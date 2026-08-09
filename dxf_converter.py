# -*- coding: utf-8 -*-
"""
dxf_converter.py - Convert a DXF floor plan to project_config.json format.

Requires: ezdxf (pip install ezdxf). Python 3 only; not IronPython compatible.

Usage:
    python dxf_converter.py \
        --dxf estimates/8_greatmeadow/1_Greatmeadow_MEASURE.dxf \
        --map estimates/8_greatmeadow/dxf_layer_map.json \
        --out estimates/8_greatmeadow/project_config.json \
        --slug 8_greatmeadow \
        --name "1 Greatmeadow" \
        --floor-z -8.17 \
        --wall-top-z 0.0 \
        --units feet

Layer map JSON format:
    {
        "perimeter":   ["LAYER_A", "LAYER_B"],       <- closed polyline layer names
        "interior":    {"LAYER_C": {"t": 0.5}},      <- interior wall layers + thickness
        "structural":  {"LAYER_D": {"t": 0.67}},     <- structural wall layers
        "demo":        {"LAYER_E": {"t": 0.5}},      <- demo wall layers
        "hatch":       ["LAYER_F"]                   <- hatch area layers
    }

Perimeter segment thicknesses default to 0.833 ft (10 in). Adjust in the
generated project_config.json before running project_builder.py.
"""
import json
import math
import os
import sys

try:
    import ezdxf as _ezdxf
    _HAS_EZDXF = True
except ImportError:
    _ezdxf = None
    _HAS_EZDXF = False


# ---- Pure-Python geometry helpers -------------------------------------------

def classify_line(p1, p2, angle_tol_deg=2.0):
    """Return 'H', 'V', or 'D' (diagonal) for the line between p1 and p2.

    p1, p2 are (x, y) tuples. Returns None for zero-length lines.
    """
    dx = p2[0] - p1[0]
    dy = p2[1] - p1[1]
    if abs(dx) < 1e-9 and abs(dy) < 1e-9:
        return None
    angle = math.degrees(math.atan2(abs(dy), abs(dx)))
    if angle < angle_tol_deg:
        return 'H'
    if angle > (90.0 - angle_tol_deg):
        return 'V'
    return 'D'


def line_length(p1, p2):
    """Euclidean distance between two 2D points."""
    dx = p2[0] - p1[0]
    dy = p2[1] - p1[1]
    return math.sqrt(dx * dx + dy * dy)


def polygon_area(vertices):
    """Shoelace area of a polygon. Positive = CCW, negative = CW."""
    n = len(vertices)
    area = 0.0
    for i in range(n):
        x1, y1 = vertices[i][0], vertices[i][1]
        x2, y2 = vertices[(i + 1) % n][0], vertices[(i + 1) % n][1]
        area += (x1 * y2 - x2 * y1)
    return area / 2.0


def merge_collinear_lines(lines, merge_tol=0.1):
    """Merge overlapping collinear line segments.

    Args:
        lines: list of (axis_val, span_min, span_max) tuples.
               For H walls: (y, x0, x1). For V walls: (x, y0, y1).
        merge_tol: grouping/overlap tolerance in the same units as lines.

    Returns:
        list of (axis_val, span_min, span_max) with overlapping spans merged.
    """
    if not lines:
        return []

    # Group by axis_val within merge_tol
    groups = {}
    for av, s0, s1 in lines:
        s0, s1 = min(s0, s1), max(s0, s1)
        placed = False
        for existing_av in list(groups.keys()):
            if abs(existing_av - av) <= merge_tol:
                groups[existing_av].append((s0, s1))
                placed = True
                break
        if not placed:
            groups[av] = [(s0, s1)]

    result = []
    for av, spans in sorted(groups.items()):
        spans_sorted = sorted(spans)
        merged = [list(spans_sorted[0])]
        for s0, s1 in spans_sorted[1:]:
            if s0 <= merged[-1][1] + merge_tol:
                merged[-1][1] = max(merged[-1][1], s1)
            else:
                merged.append([s0, s1])
        for s0, s1 in merged:
            result.append((round(av, 6), round(s0, 6), round(s1, 6)))

    return result


# ---- DXF extraction functions (require ezdxf) --------------------------------

def _lwpolyline_pts(entity, unit_scale):
    """Extract (x, y) list from an ezdxf LWPOLYLINE entity."""
    pts = []
    for p in entity.get_points():
        pts.append((p[0] * unit_scale, p[1] * unit_scale))
    # Remove duplicate closing vertex if present
    if (len(pts) >= 2
            and abs(pts[-1][0] - pts[0][0]) < 1e-6
            and abs(pts[-1][1] - pts[0][1]) < 1e-6):
        pts = pts[:-1]
    return pts


def extract_perimeter(doc, perimeter_layers, unit_scale=1.0):
    """Find the largest closed LWPOLYLINE on any of the perimeter_layers.

    Returns list of [x, y] vertices in CCW order, or [] if none found.

    Args:
        doc: ezdxf document object.
        perimeter_layers: list of AutoCAD layer name strings (case-insensitive).
        unit_scale: multiply DXF coordinates by this to get feet (e.g. 1/12 for inches).
    """
    layers_upper = set(ln.upper() for ln in perimeter_layers)
    best_pts = []
    best_area = 0.0

    msp = doc.modelspace()
    for entity in msp:
        if entity.dxf.layer.upper() not in layers_upper:
            continue

        pts = []
        if entity.dxftype() == 'LWPOLYLINE':
            if not entity.closed:
                continue
            pts = _lwpolyline_pts(entity, unit_scale)
        elif entity.dxftype() == 'POLYLINE':
            try:
                if not entity.is_closed:
                    continue
                pts = [
                    (v.dxf.location[0] * unit_scale, v.dxf.location[1] * unit_scale)
                    for v in entity.vertices
                ]
            except Exception:
                continue

        if len(pts) < 3:
            continue

        area = abs(polygon_area(pts))
        if area > best_area:
            best_area = area
            best_pts = pts

    if not best_pts:
        return []

    # Ensure CCW orientation
    if polygon_area(best_pts) < 0:
        best_pts = list(reversed(best_pts))

    return [[round(x, 4), round(y, 4)] for x, y in best_pts]


def extract_interior_walls(doc, layer_config, unit_scale=1.0, merge_tol=0.1):
    """Extract interior wall lines from DXF LINE and LWPOLYLINE entities.

    Args:
        doc: ezdxf document object.
        layer_config: dict mapping layer names to {"type": str, "t": float}.
                      type is "interior", "struct", or "demo".
        unit_scale: DXF unit to feet conversion factor.
        merge_tol: tolerance for merging collinear/parallel lines (in feet).

    Returns:
        (partitions, diagonals) where partitions is a list of project_config
        interior_partition dicts and diagonals is a list of diagonal dicts.
    """
    # Normalize layer names to uppercase for matching
    cfg_upper = {k.upper(): v for k, v in layer_config.items()}

    # Collect raw line segments: H_lines[key] = [(y, x0, x1), ...]
    h_raw = {}  # key: (wall_type, thickness) -> [(y, x0, x1), ...]
    v_raw = {}  # key: (wall_type, thickness) -> [(x, y0, y1), ...]
    diag_raw = []

    msp = doc.modelspace()
    for entity in msp:
        layer = entity.dxf.layer.upper()
        if layer not in cfg_upper:
            continue

        cfg = cfg_upper[layer]
        wall_type = cfg.get("type", "interior")
        thickness = float(cfg.get("t", 0.5))
        key = (wall_type, thickness)

        segments = []
        if entity.dxftype() == 'LINE':
            p1 = (entity.dxf.start[0] * unit_scale, entity.dxf.start[1] * unit_scale)
            p2 = (entity.dxf.end[0] * unit_scale, entity.dxf.end[1] * unit_scale)
            segments.append((p1, p2))
        elif entity.dxftype() == 'LWPOLYLINE':
            pts = _lwpolyline_pts(entity, unit_scale)
            n = len(pts)
            end_idx = n if entity.closed else n - 1
            for i in range(end_idx):
                segments.append((pts[i], pts[(i + 1) % n]))

        for p1, p2 in segments:
            direction = classify_line(p1, p2)
            if direction == 'H':
                y = (p1[1] + p2[1]) / 2.0
                x0, x1 = min(p1[0], p2[0]), max(p1[0], p2[0])
                if x1 - x0 < 1e-6:
                    continue
                h_raw.setdefault(key, []).append((y, x0, x1))
            elif direction == 'V':
                x = (p1[0] + p2[0]) / 2.0
                y0, y1 = min(p1[1], p2[1]), max(p1[1], p2[1])
                if y1 - y0 < 1e-6:
                    continue
                v_raw.setdefault(key, []).append((x, y0, y1))
            elif direction == 'D':
                diag_raw.append((p1, p2, wall_type, thickness))

    partitions = []
    counters = {}

    def next_id(prefix, wtype):
        k = (prefix, wtype)
        counters[k] = counters.get(k, 0) + 1
        return "%s_%s_%d" % (
            {'interior': 'int', 'struct': 'struct', 'demo': 'demo'}.get(wtype, 'int'),
            prefix,
            counters[k],
        )

    for (wtype, thickness), lines in sorted(h_raw.items()):
        for y, x0, x1 in merge_collinear_lines(lines, merge_tol):
            p = {
                "id": next_id("h", wtype),
                "dir": "H",
                "t": round(thickness, 4),
                "y": round(y, 4),
                "x0": round(x0, 4),
                "x1": round(x1, 4),
                "type": wtype,
            }
            partitions.append(p)

    for (wtype, thickness), lines in sorted(v_raw.items()):
        for x, y0, y1 in merge_collinear_lines(lines, merge_tol):
            p = {
                "id": next_id("v", wtype),
                "dir": "V",
                "t": round(thickness, 4),
                "x": round(x, 4),
                "y0": round(y0, 4),
                "y1": round(y1, 4),
                "type": wtype,
            }
            partitions.append(p)

    diagonals = []
    for i, (p1, p2, wtype, thickness) in enumerate(diag_raw):
        d = {
            "id": "diag_%d" % (i + 1),
            "p1": [round(p1[0], 4), round(p1[1], 4)],
            "p2": [round(p2[0], 4), round(p2[1], 4)],
            "t": round(thickness, 4),
            "type": wtype,
        }
        diagonals.append(d)

    return partitions, diagonals


def extract_hatches(doc, hatch_layers, unit_scale=1.0):
    """Extract hatch entities and compute their boundary areas.

    In AutoCAD quantity takeoffs, hatch scale often encodes a property
    (e.g. roof pitch). This function captures pattern name, scale, and
    approximate area for downstream interpretation.

    Returns:
        list of {layer, pattern, scale, area_sf} dicts.
        area_sf is 0.0 if the boundary path cannot be parsed.
    """
    layers_upper = set(ln.upper() for ln in hatch_layers) if hatch_layers else None
    result = []
    msp = doc.modelspace()

    for entity in msp:
        if entity.dxftype() != 'HATCH':
            continue
        layer = entity.dxf.layer
        if layers_upper is not None and layer.upper() not in layers_upper:
            continue

        pattern_name = entity.dxf.get('pattern_name', '') or ''
        # Extract pattern scale from the first pattern line if available
        scale = 1.0
        try:
            if hasattr(entity, 'pattern') and entity.pattern:
                lines = list(entity.pattern.lines)
                if lines and hasattr(lines[0], 'scale'):
                    scale = float(lines[0].scale)
        except Exception:
            pass

        # Compute area from boundary paths
        area = 0.0
        try:
            for path in entity.paths:
                if hasattr(path, 'vertices') and path.vertices:
                    pts = [(v[0] * unit_scale, v[1] * unit_scale) for v in path.vertices]
                    area += abs(polygon_area(pts))
        except Exception:
            pass

        result.append({
            "layer": layer,
            "pattern": pattern_name,
            "scale": scale,
            "area_sf": round(area, 2),
        })

    return result


# ---- Main converter ----------------------------------------------------------

def convert_dxf(dxf_path, layer_map, project_slug, project_name,
                floor_z=-8.17, wall_top_z=0.0, unit_scale=1.0):
    """Convert a DXF file to a project_config dict.

    Args:
        dxf_path: path to the .dxf file.
        layer_map: dict with optional keys:
            "perimeter"  -> list of layer names for the outer perimeter polyline
            "interior"   -> {layer_name: {"t": float}} for interior walls
            "structural" -> {layer_name: {"t": float}} for structural walls
            "demo"       -> {layer_name: {"t": float}} for demo walls
            "hatch"      -> list of layer names for hatch areas
        project_slug: machine-readable project id (e.g. "8_greatmeadow").
        project_name: human-readable project name.
        floor_z: slab elevation in Rhino world feet.
        wall_top_z: top-of-wall elevation in Rhino world feet.
        unit_scale: multiply DXF coords by this to convert to feet.
                    Use 1.0 for DXF in feet, 1/12.0 for DXF in inches.

    Returns:
        project_config dict (not yet written to disk).

    Raises:
        ImportError: if ezdxf is not installed.
        ValueError: if no perimeter polygon is found.
    """
    if not _HAS_EZDXF:
        raise ImportError("dxf_converter requires ezdxf: pip install ezdxf")

    doc = _ezdxf.readfile(dxf_path)

    perimeter_layers = layer_map.get("perimeter", [])
    hatch_layers = layer_map.get("hatch", [])

    # Build unified wall layer config
    wall_layer_cfg = {}
    for wtype in ("interior", "structural", "demo"):
        section = layer_map.get(wtype, {})
        resolved_type = "struct" if wtype == "structural" else wtype
        if isinstance(section, list):
            for ln in section:
                wall_layer_cfg[ln] = {"type": resolved_type, "t": 0.5}
        elif isinstance(section, dict):
            for ln, opts in section.items():
                entry = dict(opts)
                entry.setdefault("type", resolved_type)
                wall_layer_cfg[ln] = entry

    vertices = extract_perimeter(doc, perimeter_layers, unit_scale)
    if not vertices:
        raise ValueError(
            "No closed perimeter polygon found on layers: %s\n"
            "Check dxf_layer_map.json 'perimeter' list and DXF layer names." % perimeter_layers
        )

    n_verts = len(vertices)
    partitions, diagonals = extract_interior_walls(doc, wall_layer_cfg, unit_scale)
    hatches = extract_hatches(doc, hatch_layers, unit_scale)

    config = {
        "project": {
            "name": project_name,
            "slug": project_slug,
            "description": "Generated from %s" % os.path.basename(dxf_path),
        },
        "floors": [
            {
                "name": "basement",
                "floor_z": floor_z,
                "wall_top_z": wall_top_z,
                "zones": [],
            }
        ],
        "perimeter": {
            "outer_polygon": {
                "vertices": vertices,
                "segment_thickness": [0.833] * n_verts,
                "note": (
                    "Segment thicknesses default to 10 in (0.833 ft); "
                    "adjust per field survey before running project_builder.py"
                ),
            }
        },
        "interior_partitions": partitions,
        "diagonals": diagonals,
        "openings": [],
        "structure": {
            "beams": [],
            "posts": [],
            "footings": [],
            "stairs": [],
            "areaways": [],
        },
    }

    # Hatch data stored as a private key (not in schema) for reference
    if hatches:
        config["_dxf_hatches"] = hatches

    return config


# ---- CLI --------------------------------------------------------------------

def _parse_args(argv):
    """Parse CLI arguments. Returns a dict of option -> value."""
    opts = {}
    i = 0
    while i < len(argv):
        arg = argv[i]
        if arg.startswith("--") and i + 1 < len(argv):
            key = arg[2:].replace("-", "_")
            opts[key] = argv[i + 1]
            i += 2
        else:
            i += 1
    return opts


def main(argv=None):
    if argv is None:
        argv = sys.argv[1:]

    opts = _parse_args(argv)

    if not opts.get("dxf"):
        sys.stderr.write("Usage: dxf_converter.py --dxf <path> --map <path> --out <path>"
                         " --slug <slug> [--name <name>] [--floor-z <z>]"
                         " [--wall-top-z <z>] [--units feet|inches]\n")
        sys.exit(1)

    dxf_path = opts["dxf"]
    map_path = opts.get("map", "")
    out_path = opts.get("out", "")
    slug = opts.get("slug", "project")
    name = opts.get("name", slug)
    floor_z = float(opts.get("floor_z", "-8.17"))
    wall_top_z = float(opts.get("wall_top_z", "0.0"))
    units = opts.get("units", "feet")
    unit_scale = 1.0 / 12.0 if units == "inches" else 1.0

    if not os.path.isfile(dxf_path):
        sys.stderr.write("DXF file not found: %s\n" % dxf_path)
        sys.exit(1)

    layer_map = {}
    if map_path and os.path.isfile(map_path):
        with open(map_path) as f:
            layer_map = json.load(f)
        # Strip comment keys (keys starting with _)
        layer_map = {k: v for k, v in layer_map.items() if not k.startswith("_")}
    else:
        print("No layer map supplied; using empty mapping (no perimeter layers set).")

    try:
        config = convert_dxf(
            dxf_path, layer_map, slug, name,
            floor_z=floor_z, wall_top_z=wall_top_z, unit_scale=unit_scale,
        )
    except ValueError as e:
        sys.stderr.write("Conversion error: %s\n" % e)
        sys.exit(1)

    n_verts = len(config["perimeter"]["outer_polygon"]["vertices"])
    n_parts = len(config.get("interior_partitions", []))
    n_diag = len(config.get("diagonals", []))
    n_hatch = len(config.get("_dxf_hatches", []))

    if out_path:
        out_dir = os.path.dirname(out_path)
        if out_dir and not os.path.isdir(out_dir):
            os.makedirs(out_dir)
        with open(out_path, "w") as f:
            json.dump(config, f, indent=2)
        print("Written: %s" % out_path)
    else:
        print(json.dumps(config, indent=2))

    print("Perimeter: %d vertices, %d interior partitions, %d diagonals, %d hatches" % (
        n_verts, n_parts, n_diag, n_hatch,
    ))


if __name__ == "__main__":
    main()
