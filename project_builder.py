# -*- coding: utf-8 -*-
"""
project_builder.py -- Generic project entry point for the rhino estimation engine.

Usage:
    python project_builder.py --project <slug>

Reads estimates/<slug>/project_config.json, validates it, computes a wall
schedule (pure Python, no Rhino required), and writes wall_schedule.json
to the project directory.

When run inside Rhino 8, also builds the 3D model, cuts openings, and
writes captures.

IronPython 2.7 compatible. ASCII only.
"""
import json
import os
import sys

# ── Path bootstrap -----------------------------------------------------------
_here = os.path.dirname(os.path.abspath(__file__))
if _here not in sys.path:
    sys.path.insert(0, _here)

# ── Rhino availability check -------------------------------------------------
# Try to import rhinoscriptsyntax; if absent, inject a no-op mock so
# rhino_engine modules can be imported for their pure-Python functions.
# build_3d() is gated on _RHINO_AVAILABLE and will raise if called without Rhino.
try:
    import rhinoscriptsyntax as _rs_probe  # noqa: F401
    _RHINO_AVAILABLE = True
except ImportError:
    _RHINO_AVAILABLE = False
    # Inject minimal stubs so rhino_engine/*.py imports succeed.
    # Must set both 'System' and 'System.Drawing' before any import
    # that does "import System.Drawing as SD".
    class _MockRS(object):
        def __getattr__(self, name):
            def _noop(*a, **kw): return None
            return _noop
    _mod = type(sys)
    _sys_mod = _mod('System')
    _sd_mod = _mod('System.Drawing')
    _sys_mod.Drawing = _sd_mod
    sys.modules['rhinoscriptsyntax'] = _MockRS()
    sys.modules['Rhino'] = _mod('Rhino')
    sys.modules['System'] = _sys_mod
    sys.modules['System.Drawing'] = _sd_mod
    sys.modules['scriptcontext'] = _mod('scriptcontext')

from rhino_engine.walls import (
    compute_perimeter, build_wall_registry, trim_partitions, wall_schedule,
)
from rhino_engine.zones import floor_z_from_floor_config
from rhino_engine.config_validator import validate

# Rhino-specific imports (only work inside Rhino 8)
if _RHINO_AVAILABLE:
    from rhino_engine.primitives import (
        make_solid, wall_from_centerline, solid_difference, capture,
    )
    from rhino_engine.layers import (
        setup_layers, clear_layers, layer_audit,
        BASEMENT_LAYERS, MARKUP_LAYERS,
    )


# ── Pure-Python helpers -------------------------------------------------------

def _perim_wall_data(outer, inner, seg_t, floor_z_default, wall_top_z, config):
    """Build perimeter wall data dicts from computed geometry.

    Returns a list of dicts with the same shape as wall_schedule() expects,
    but without Rhino object GUIDs (no "obj" key).
    """
    n = len(outer)
    walls = []
    annotations = (
        config.get("perimeter", {})
              .get("outer_polygon", {})
              .get("annotations", [])
    )
    for i in range(n):
        j = (i + 1) % n
        dx = abs(outer[j][0] - outer[i][0])
        dy = abs(outer[j][1] - outer[i][1])
        ann = annotations[i] if i < len(annotations) else {}
        entry = {
            "id": "perim_%d" % i,
            "type": "exterior",
            "room": "perimeter",
            "note": ann.get("note", ""),
            "cat": ann.get("cat", ""),
            "t": seg_t[i],
            "z0": floor_z_default,
            "z1": wall_top_z,
        }
        if dx > dy:
            x0s = min(outer[i][0], outer[j][0])
            x1s = max(outer[i][0], outer[j][0])
            entry["dir"] = "H"
            entry["x0"] = x0s
            entry["x1"] = x1s
            entry["cx"] = (x0s + x1s) / 2.0
            entry["cy"] = (
                outer[i][1] + inner[i][1] + outer[j][1] + inner[j][1]
            ) / 4.0
        else:
            y0s = min(outer[i][1], outer[j][1])
            y1s = max(outer[i][1], outer[j][1])
            entry["dir"] = "V"
            entry["y0"] = y0s
            entry["y1"] = y1s
            entry["cx"] = (
                outer[i][0] + inner[i][0] + outer[j][0] + inner[j][0]
            ) / 4.0
            entry["cy"] = (y0s + y1s) / 2.0
        walls.append(entry)
    return walls


def _beam_wall_data(beams, floor_z_default, wall_top_z):
    """Convert project_config structure.beams list to wall data dicts."""
    result = []
    for b in beams:
        by = b.get("y") or b.get("cy")
        bx0 = b.get("x0", -30.0)
        bx1 = b.get("x1", 70.0)
        bt = b.get("t", 0.67)
        result.append({
            "id": b.get("id", "beam_wall"),
            "type": "struct",
            "dir": "H",
            "t": bt,
            "x0": bx0,
            "x1": bx1,
            "z0": floor_z_default,
            "z1": wall_top_z,
            "room": "beam line",
            "note": b.get("note", ""),
            "cat": b.get("cat", "exist"),
        })
    return result


def _partition_wall_data(trimmed, floor_z_fn, wall_top_z):
    """Augment trimmed partition dicts with z0/z1 from zone lookup."""
    result = []
    for p in trimmed:
        if p["dir"] == "V":
            cx_mid = p["x"]
            cy_mid = (p["y0"] + p["y1"]) / 2.0
        else:
            cx_mid = (p["x0"] + p["x1"]) / 2.0
            cy_mid = p["y"]
        info = dict(p)
        info["z0"] = floor_z_fn(cx_mid, cy_mid)
        info["z1"] = wall_top_z
        result.append(info)
    return result


# ── Core build functions ------------------------------------------------------

def build_schedule(config, output_dir=None):
    """Compute wall schedule from a project_config dict.

    Pure Python -- no Rhino required. Returns the schedule dict.
    Writes wall_schedule.json to output_dir if provided.

    Args:
        config: Parsed project_config.json dict.
        output_dir: Directory path to write wall_schedule.json. Optional.

    Returns:
        Schedule dict with keys "walls", "summary_by_type", "trim_log".
    """
    # Floor configuration
    floors = config.get("floors", [{}])
    floor_cfg = floors[0] if floors else {}
    floor_z_default = floor_cfg.get("floor_z", 0.0)
    wall_top_z = floor_cfg.get("wall_top_z", 0.0)
    floor_z_fn = floor_z_from_floor_config(floor_cfg)

    # Perimeter geometry
    perim_data = config.get("perimeter", {})
    outer, inner, seg_t = compute_perimeter(perim_data)
    perim_walls = _perim_wall_data(outer, inner, seg_t, floor_z_default, wall_top_z, config)

    # Structure (beams)
    structure = config.get("structure", {})
    beams = structure.get("beams", [])
    beam_walls = _beam_wall_data(beams, floor_z_default, wall_top_z)

    # First beam for wall registry (primary beam only)
    beam_y = None
    beam_t = None
    if beams:
        b0 = beams[0]
        beam_y = b0.get("y") or b0.get("cy")
        beam_t = b0.get("t")

    # Interior partitions: trim then annotate with z0/z1
    raw_partitions = config.get("interior_partitions", [])
    h_walls, v_walls = build_wall_registry(
        outer, inner, seg_t, raw_partitions, beam_y, beam_t
    )
    trimmed, trim_log = trim_partitions(raw_partitions, h_walls, v_walls)
    partition_walls = _partition_wall_data(trimmed, floor_z_fn, wall_top_z)

    # Compute schedule
    all_wall_data = perim_walls + beam_walls + partition_walls
    schedule = wall_schedule(all_wall_data)
    schedule["trim_log"] = trim_log

    if output_dir:
        out_path = os.path.join(output_dir, "wall_schedule.json")
        with open(out_path, "w") as f:
            json.dump(schedule, f, indent=2)
        print("Written: %s" % out_path)

    return schedule


def build_3d(config, output_dir=None):
    """Build 3D Rhino model and cut openings. Requires Rhino 8.

    Returns schedule dict with n_openings_cut added.
    Raises ImportError if Rhino primitives are not available.
    """
    if not _RHINO_AVAILABLE:
        raise ImportError("build_3d() requires Rhino 8 (rhinoscriptsyntax not found)")

    import rhinoscriptsyntax as rs

    floors = config.get("floors", [{}])
    floor_cfg = floors[0] if floors else {}
    floor_z_default = floor_cfg.get("floor_z", 0.0)
    wall_top_z = floor_cfg.get("wall_top_z", 0.0)
    floor_z_fn = floor_z_from_floor_config(floor_cfg)

    perim_data = config.get("perimeter", {})

    # Layer setup
    layer_defs = BASEMENT_LAYERS.copy()
    config_layers = config.get("layers", {})
    for name, rgb in config_layers.items():
        layer_defs[name] = tuple(rgb)
    setup_layers(layer_defs)
    setup_layers(MARKUP_LAYERS)
    clear_layers(list(layer_defs.keys()))

    # Exterior perimeter walls (3D)
    from rhino_engine.walls import build_perimeter_walls
    layer_ext = "Bsmt::Wall::Exterior"
    perim_walls_3d, n_perim = build_perimeter_walls(
        floor_z_default, wall_top_z, layer_ext, perim_data
    )
    annotations = (
        perim_data.get("outer_polygon", {}).get("annotations", [])
    )
    for i, pw in enumerate(perim_walls_3d):
        pw["id"] = "perim_%d" % i
        pw["type"] = "exterior"
        pw["room"] = "perimeter"
        ann = annotations[i] if i < len(annotations) else {}
        pw["note"] = ann.get("note", "")
        pw["cat"] = ann.get("cat", "")

    # Wall registry + trim
    outer, inner, seg_t = compute_perimeter(perim_data)
    raw_partitions = config.get("interior_partitions", [])
    structure = config.get("structure", {})
    beams = structure.get("beams", [])
    beam_y = None
    beam_t = None
    if beams:
        b0 = beams[0]
        beam_y = b0.get("y") or b0.get("cy")
        beam_t = b0.get("t")
    h_walls, v_walls = build_wall_registry(
        outer, inner, seg_t, raw_partitions, beam_y, beam_t
    )
    trimmed, trim_log = trim_partitions(raw_partitions, h_walls, v_walls)

    # Interior + structural partitions (3D)
    partition_wall_info = []
    for p in trimmed:
        wtype = p.get("type", "interior")
        if wtype == "struct":
            layer = "Bsmt::Wall::Struct"
        elif wtype == "demo":
            layer = "Bsmt::Wall::Demo"
        elif p.get("subcategory") == "crawl":
            layer = "Bsmt::Wall::Crawl"
        else:
            layer = "Bsmt::Wall::Interior"

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

        z0 = floor_z_fn(cx_mid, cy_mid)
        obj = wall_from_centerline(p1, p2, p["t"], z0, wall_top_z, layer)
        info = dict(p)
        info["obj"] = obj
        info["z0"] = z0
        info["z1"] = wall_top_z
        partition_wall_info.append(info)

    # Beam walls (3D)
    beam_wall_info = []
    for b in beams:
        by = b.get("y") or b.get("cy")
        bx0 = b.get("x0", -30.0)
        bx1 = b.get("x1", 70.0)
        bt = b.get("t", 0.67)
        bobj = wall_from_centerline(
            (bx0, by), (bx1, by), bt,
            floor_z_default, wall_top_z, "Bsmt::Wall::Struct"
        )
        beam_wall_info.append({
            "id": b.get("id", "beam_wall"),
            "type": "struct",
            "dir": "H",
            "t": bt,
            "x0": bx0,
            "x1": bx1,
            "z0": floor_z_default,
            "z1": wall_top_z,
            "obj": bobj,
            "room": "beam line",
            "note": b.get("note", ""),
            "cat": b.get("cat", "exist"),
        })

    # Cut openings
    all_wall_objs = perim_walls_3d + beam_wall_info + partition_wall_info
    openings = config.get("openings", [])
    n_cut = 0
    for op in openings:
        cx, cy = op["cx"], op["cy"]
        w = op["width"]
        z0_op = op.get("z_bot", floor_z_default)
        z1_op = op.get("z_top", wall_top_z)
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
            if wo.get("dir") != op["dir"] or not wo.get("obj"):
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
                n_cut += 1
            else:
                rs.DeleteObject(cutter)
        else:
            rs.DeleteObject(cutter)

    # Wall schedule
    all_wall_data = list(perim_walls_3d) + beam_wall_info + partition_wall_info
    schedule = wall_schedule(all_wall_data)
    schedule["n_openings_cut"] = n_cut
    schedule["trim_log"] = trim_log

    if output_dir:
        out_path = os.path.join(output_dir, "wall_schedule.json")
        with open(out_path, "w") as f:
            json.dump(schedule, f, indent=2)
        print("Written: %s" % out_path)

        captures_dir = os.path.join(output_dir, "captures")
        if not os.path.isdir(captures_dir):
            os.makedirs(captures_dir)
        capture(os.path.join(captures_dir, "top.png"), view_type="Top")
        capture(
            os.path.join(captures_dir, "perspective.png"),
            view_type="Perspective",
            shaded=True,
        )

        audit = layer_audit()
        audit_path = os.path.join(output_dir, "layer_audit.json")
        with open(audit_path, "w") as f:
            json.dump(audit, f, indent=2)
        print("Audit: %s" % str(audit))

    return schedule


# ── CLI entry point -----------------------------------------------------------

def _parse_args(argv):
    """Minimal arg parser: --project <slug>, no argparse dependency."""
    slug = None
    i = 0
    while i < len(argv):
        if argv[i] == "--project" and i + 1 < len(argv):
            slug = argv[i + 1]
            i += 2
        else:
            i += 1
    return slug


def main(argv=None):
    """CLI entry point."""
    argv = argv if argv is not None else sys.argv[1:]
    slug = _parse_args(argv)

    if not slug:
        sys.stderr.write("Usage: project_builder.py --project <slug>\n")
        sys.exit(1)

    config_path = os.path.join(_here, "estimates", slug, "project_config.json")
    if not os.path.isfile(config_path):
        sys.stderr.write("Config not found: %s\n" % config_path)
        sys.exit(1)

    with open(config_path) as f:
        config = json.load(f)

    # Validate against schema
    schema_path = os.path.join(_here, "rhino_engine", "project_config_schema.json")
    if os.path.isfile(schema_path):
        with open(schema_path) as f:
            schema = json.load(f)
        errors = validate(config, schema)
        if errors:
            sys.stderr.write("Config validation errors:\n")
            for e in errors:
                sys.stderr.write("  %s\n" % e)
            sys.exit(1)
        print("Config validated: %s" % slug)

    output_dir = os.path.join(_here, "estimates", slug)

    # Run pure-Python schedule; 3D build only if inside Rhino
    if _RHINO_AVAILABLE:
        schedule = build_3d(config, output_dir=output_dir)
    else:
        schedule = build_schedule(config, output_dir=output_dir)

    # Print summary
    s = schedule.get("summary_by_type", {})
    print("Wall schedule for %s:" % slug)
    for wtype in sorted(s.keys()):
        stats = s[wtype]
        print("  %-12s: %d walls, %.2f LF, %.2f SF" % (
            wtype, stats["count"],
            stats["total_length"],
            stats["total_face_area_sf"],
        ))
    n_cut = schedule.get("n_openings_cut")
    if n_cut is not None:
        print("  Openings cut: %d" % n_cut)

    return schedule


if __name__ == "__main__":
    main()
