# -*- coding: utf-8 -*-
"""
12 Fox Hollow basement builder -- refactored to use rhino_engine.

Runs inside Rhino 8 via RunScript or the rhino-watcher trigger.
All 12FH-specific constants live here; geometry logic is in rhino_engine/.

Inputs (local to this directory):
    v30_perimeter.json              outer polygon + segment thicknesses
    basement_complete.json          interior partitions, beam, openings
    rhino_views/cad_openings_resolved.json   window/door locations

Output:
    v30_wall_schedule.json          lengths, areas, volumes by type
    captures/                       PNG views (top, perspective)
"""
import json
import os
import sys

# ── Path bootstrap -----------------------------------------------------------
# Finds rhino_engine alongside this file or one/two levels up.
_here = os.path.dirname(os.path.abspath(__file__))
for _candidate in [
    _here,
    os.path.dirname(_here),
    os.path.dirname(os.path.dirname(_here)),
    os.path.join(_here, "..", "..", "rhino-engine-repo"),
]:
    if os.path.isdir(os.path.join(_candidate, "rhino_engine")):
        if _candidate not in sys.path:
            sys.path.insert(0, _candidate)
        break

from rhino_engine.primitives import (
    make_solid, rect_box, wall_from_centerline, solid_difference, capture,
)
from rhino_engine.walls import (
    compute_perimeter, build_perimeter_walls, build_wall_registry,
    trim_partitions, wall_schedule,
)
from rhino_engine.layers import (
    setup_layers, clear_layers, layer_audit, hide_layers, show_layers,
    BASEMENT_LAYERS, MARKUP_LAYERS,
)
from rhino_engine.zones import make_zone_lookup

# ── 12FH project file paths --------------------------------------------------

PERIM_JSON    = os.path.join(_here, "v30_perimeter.json")
BASEMENT_JSON = os.path.join(_here, "basement_complete.json")
OPENINGS_JSON = os.path.join(_here, "rhino_views", "cad_openings_resolved.json")
OUTPUT_JSON   = os.path.join(_here, "v30_wall_schedule.json")
CAPTURES_DIR  = os.path.join(_here, "captures")

# ── 12FH floor elevations ----------------------------------------------------

FLOOR_Z_DEFAULT = -8.17    # main basement slab (Rhino world zero = top of slab)
WALL_TOP_Z      =  0.0     # top of foundation wall

# Crawl space in the northwest corner (measured from CAD)
CRAWL_ZONES = [
    {
        "name": "crawl",
        "floor_z": -3.0,
        "bounds": {"x_min": -30.0, "x_max": -15.0, "y_min": 0.0, "y_max": 25.0},
        "exclude_margin": 1.0,
    },
]

# ── 12FH layer names (keys into BASEMENT_LAYERS) ----------------------------

LAYER_EXT    = "Bsmt::Wall::Exterior"
LAYER_INT    = "Bsmt::Wall::Interior"
LAYER_STRUCT = "Bsmt::Wall::Struct"
LAYER_CRAWL  = "Bsmt::Wall::Crawl"
LAYER_DEMO   = "Bsmt::Wall::Demo"


# ── Opening cutter -----------------------------------------------------------

def _cut_openings(openings_data, all_wall_objs):
    """Boolean-subtract each opening box from the nearest matching wall.

    openings_data entries: {dir, cx, cy, width, height, z_bot, z_top, type}
    Returns count of successfully cut openings.
    """
    import rhinoscriptsyntax as rs

    cut_count = 0
    for op in openings_data:
        cx, cy = op["cx"], op["cy"]
        w = op["width"]
        z0_op = op.get("z_bot", FLOOR_Z_DEFAULT)
        z1_op = op.get("z_top", WALL_TOP_Z)

        if op["dir"] == "H":
            cutter_pts = [
                (cx - w / 2.0, cy - 1.0),
                (cx + w / 2.0, cy - 1.0),
                (cx + w / 2.0, cy + 1.0),
                (cx - w / 2.0, cy + 1.0),
            ]
        else:
            cutter_pts = [
                (cx - 1.0, cy - w / 2.0),
                (cx + 1.0, cy - w / 2.0),
                (cx + 1.0, cy + w / 2.0),
                (cx - 1.0, cy + w / 2.0),
            ]

        cutter = make_solid(cutter_pts, z0_op, z1_op)
        if not cutter:
            continue

        best, best_d = None, 99999.0
        for wo in all_wall_objs:
            if wo.get("dir") != op["dir"]:
                continue
            if not wo.get("obj"):
                continue
            if wo["dir"] == "H":
                dist = abs(wo.get("cy", 0) - cy)
                in_range = wo.get("x0", 0) <= cx <= wo.get("x1", 0)
            else:
                dist = abs(wo.get("cx", 0) - cx)
                in_range = wo.get("y0", 0) <= cy <= wo.get("y1", 0)
            if in_range and dist < best_d:
                best_d = dist
                best = wo

        if best:
            result = solid_difference(best["obj"], cutter)
            if result:
                best["obj"] = result[0]
                cut_count += 1
            else:
                rs.DeleteObject(cutter)
        else:
            rs.DeleteObject(cutter)

    return cut_count


# ── Main build ---------------------------------------------------------------

def main():
    # 1. Load project data
    with open(PERIM_JSON) as f:
        perim_data = json.load(f)
    with open(BASEMENT_JSON) as f:
        bsmt = json.load(f)

    openings = []
    if os.path.isfile(OPENINGS_JSON):
        with open(OPENINGS_JSON) as f:
            openings = json.load(f)

    # 2. Floor elevation lookup
    floor_z = make_zone_lookup(CRAWL_ZONES, default_z=FLOOR_Z_DEFAULT)

    # 3. Layer setup and scene reset
    setup_layers(BASEMENT_LAYERS)
    setup_layers(MARKUP_LAYERS)
    clear_layers(list(BASEMENT_LAYERS.keys()))

    # 4. Exterior perimeter walls
    perim_walls, n_perim = build_perimeter_walls(
        FLOOR_Z_DEFAULT, WALL_TOP_Z, LAYER_EXT, perim_data
    )
    # Annotate perimeter walls with ids and metadata
    perim_annotations = (
        perim_data.get("outer_polygon", {}).get("annotations", [])
    )
    for i, pw in enumerate(perim_walls):
        pw["id"] = "perim_%d" % i
        pw["type"] = "exterior"
        pw["room"] = "perimeter"
        ann = perim_annotations[i] if i < len(perim_annotations) else {}
        pw["note"] = ann.get("note", "")
        pw["cat"] = ann.get("cat", "")

    # 5. Wall registry for endpoint trimming
    outer, inner, seg_t = compute_perimeter(perim_data)
    raw_partitions = bsmt.get("partitions", [])
    beam = bsmt.get("beam", {})
    beam_y = beam.get("y") or beam.get("cy")
    beam_t = beam.get("t")
    h_walls, v_walls = build_wall_registry(
        outer, inner, seg_t, raw_partitions, beam_y, beam_t
    )

    # 6. Trim partition endpoints to perimeter inner faces
    trimmed, trim_log = trim_partitions(raw_partitions, h_walls, v_walls)

    # 7. Build interior and structural partitions
    partition_wall_info = []
    for p in trimmed:
        wtype = p.get("type", "interior")
        if wtype == "struct":
            layer = LAYER_STRUCT
        elif wtype == "demo":
            layer = LAYER_DEMO
        elif p.get("subcategory") == "crawl":
            layer = LAYER_CRAWL
        else:
            layer = LAYER_INT

        if p["dir"] == "V":
            cx_mid = p["x"]
            cy_mid = (p["y0"] + p["y1"]) / 2.0
            p1 = (p["x"], p["y0"])
            p2 = (p["x"], p["y1"])
        else:
            cx_mid = (p["x0"] + p["x1"]) / 2.0
            cy_mid = p["y"]
            p1 = (p["x0"], p["y"])
            p2 = (p["x1"], p["y"])

        z0 = floor_z(cx_mid, cy_mid)
        z1 = WALL_TOP_Z
        obj = wall_from_centerline(p1, p2, p["t"], z0, z1, layer)

        info = dict(p)
        info["obj"] = obj
        info["z0"] = z0
        info["z1"] = z1
        partition_wall_info.append(info)

    # 8. Beam/structural wall
    beam_wall_info = []
    if beam:
        by = beam.get("y") or beam.get("cy")
        bx0 = beam.get("x0", -30.0)
        bx1 = beam.get("x1", 70.0)
        bobj = wall_from_centerline(
            (bx0, by), (bx1, by), beam_t,
            FLOOR_Z_DEFAULT, WALL_TOP_Z, LAYER_STRUCT
        )
        beam_wall_info.append({
            "id": "beam_wall",
            "type": "struct",
            "dir": "H",
            "t": beam_t,
            "x0": bx0,
            "x1": bx1,
            "z0": FLOOR_Z_DEFAULT,
            "z1": WALL_TOP_Z,
            "obj": bobj,
            "room": "beam line (lower/upper boundary)",
            "note": beam.get("note", "beam wall"),
            "cat": beam.get("cat", "exist"),
        })

    # 9. Cut openings
    all_wall_objs = list(perim_walls) + beam_wall_info + partition_wall_info
    n_cut = _cut_openings(openings, all_wall_objs)

    # 10. Wall schedule
    all_wall_data = list(perim_walls) + beam_wall_info + partition_wall_info
    schedule = wall_schedule(all_wall_data)
    schedule["n_openings_cut"] = n_cut
    schedule["trim_log"] = trim_log

    with open(OUTPUT_JSON, "w") as f:
        json.dump(schedule, f, indent=2)

    # 11. Layer audit and view captures
    audit = layer_audit()

    if not os.path.isdir(CAPTURES_DIR):
        os.makedirs(CAPTURES_DIR)
    capture(os.path.join(CAPTURES_DIR, "top.png"), view_type="Top")
    capture(os.path.join(CAPTURES_DIR, "perspective.png"), view_type="Perspective", shaded=True)

    print("Build complete: %d perim + %d partitions, %d/%d openings cut" % (
        n_perim, len(trimmed), n_cut, len(openings)
    ))
    print("Summary: %s" % str({k: v["count"] for k, v in schedule["summary_by_type"].items()}))
    print("Audit: %s" % str(audit))
    return schedule


if __name__ == "__main__":
    main()
