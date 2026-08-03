# -*- coding: utf-8 -*-
"""
rhino_engine.walls — Perimeter computation and wall trimming.

Handles:
  - Quadrilateral prism perimeter walls with clean corner intersections
  - Wall registry (H/V centerline database for intersection detection)
  - Interior partition endpoint trimming to wall faces
"""
import math

import rhinoscriptsyntax as rs

from rhino_engine.primitives import make_solid


# ── Perimeter geometry ───────────────────────────────────────────────────────

def compute_perimeter(perim_data):
    """Compute outer and inner perimeter points from polygon + thickness data.

    Reads perim_data['outer_polygon'] with keys:
      - 'vertices': list of [x, y] points (CCW order)
      - 'segment_thickness': list of wall thickness per segment

    Returns (outer_pts, inner_pts, seg_thicknesses).
    Inner corners are computed by intersecting adjacent inner-offset lines,
    producing clean miter joints with zero overlap.
    """
    poly = perim_data["outer_polygon"]
    outer = [tuple(v) for v in poly["vertices"]]
    seg_t = list(poly["segment_thickness"])

    n = len(outer)

    def seg_direction(i):
        j = (i + 1) % n
        dx = outer[j][0] - outer[i][0]
        dy = outer[j][1] - outer[i][1]
        return (dx, dy)

    def inward_normal(i):
        dx, dy = seg_direction(i)
        ln = math.sqrt(dx * dx + dy * dy)
        if ln < 0.001:
            return (0, 0)
        return (-dy / ln, dx / ln)

    def inner_offset_line(i):
        nx, ny = inward_normal(i)
        t = seg_t[i]
        j = (i + 1) % n
        mx = (outer[i][0] + outer[j][0]) / 2.0 + nx * t
        my = (outer[i][1] + outer[j][1]) / 2.0 + ny * t
        dx, dy = seg_direction(i)
        return ((mx, my), (dx, dy))

    def line_intersect(p1, d1, p2, d2):
        det = d1[0] * d2[1] - d1[1] * d2[0]
        if abs(det) < 1e-10:
            return (p1[0], p1[1])
        dx = p2[0] - p1[0]
        dy = p2[1] - p1[1]
        s = (dx * d2[1] - dy * d2[0]) / det
        return (p1[0] + s * d1[0], p1[1] + s * d1[1])

    inner = []
    for i in range(n):
        prev = (i - 1) % n
        lp, ld = inner_offset_line(prev)
        lc, lcd = inner_offset_line(i)
        pt = line_intersect(lp, ld, lc, lcd)
        inner.append(pt)

    return outer, inner, seg_t


def build_perimeter_walls(z0, z1, layer, perim_data):
    """Build exterior perimeter as quadrilateral prisms.

    Each wall segment is a trapezoid (outer[i], outer[j], inner[j], inner[i])
    extruded from z0 to z1. Returns (wall_info_list, count).

    wall_info_list entries:
      {"obj": guid, "dir": "H"|"V", "cx", "cy", "t", "z0", "z1",
       "x0", "x1" (for H) or "y0", "y1" (for V)}
    """
    outer, inner, seg_t = compute_perimeter(perim_data)
    n = len(outer)
    wall_objs = []
    count = 0

    for i in range(n):
        j = (i + 1) % n
        pts = [outer[i], outer[j], inner[j], inner[i]]
        obj = make_solid(pts, z0, z1)
        if not obj:
            continue
        rs.ObjectLayer(obj, layer)
        count += 1

        dx = abs(outer[j][0] - outer[i][0])
        dy = abs(outer[j][1] - outer[i][1])
        if dx > dy:
            x0s = min(outer[i][0], outer[j][0])
            x1s = max(outer[i][0], outer[j][0])
            cy = (outer[i][1] + inner[i][1] + outer[j][1] + inner[j][1]) / 4.0
            t = seg_t[i]
            wall_objs.append({"obj": obj, "dir": "H", "cx": (x0s + x1s) / 2.0, "cy": cy,
                              "t": t, "z0": z0, "z1": z1, "x0": x0s, "x1": x1s})
        else:
            y0s = min(outer[i][1], outer[j][1])
            y1s = max(outer[i][1], outer[j][1])
            cx = (outer[i][0] + inner[i][0] + outer[j][0] + inner[j][0]) / 4.0
            t = seg_t[i]
            wall_objs.append({"obj": obj, "dir": "V", "cx": cx, "cy": (y0s + y1s) / 2.0,
                              "t": t, "z0": z0, "z1": z1, "y0": y0s, "y1": y1s})

    return wall_objs, count


# ── Wall registry and trimming ───────────────────────────────────────────────

def build_wall_registry(outer, inner, seg_t, partitions, beam_y=None, beam_t=None):
    """Build database of all H and V wall centerlines for intersection detection.

    Args:
        outer, inner, seg_t: From compute_perimeter().
        partitions: List of interior partition dicts.
        beam_y: Optional beam centerline Y position.
        beam_t: Optional beam wall thickness.

    Returns (h_walls, v_walls) where each entry is:
      (center_coord, thickness, range_min, range_max, wall_id)
    """
    h_walls = []
    v_walls = []

    n = len(outer)
    for i in range(n):
        j = (i + 1) % n
        dx = abs(outer[j][0] - outer[i][0])
        dy = abs(outer[j][1] - outer[i][1])
        if dx > dy:
            outer_y = outer[i][1]
            inner_y = (inner[i][1] + inner[j][1]) / 2.0
            t = abs(outer_y - inner_y)
            cy = (outer_y + inner_y) / 2.0
            x_min = min(outer[i][0], outer[j][0], inner[i][0], inner[j][0])
            x_max = max(outer[i][0], outer[j][0], inner[i][0], inner[j][0])
            h_walls.append((cy, t, x_min, x_max, "perim_%d" % i))
        else:
            outer_x = outer[i][0]
            inner_x = (inner[i][0] + inner[j][0]) / 2.0
            t = abs(outer_x - inner_x)
            cx = (outer_x + inner_x) / 2.0
            y_min = min(outer[i][1], outer[j][1], inner[i][1], inner[j][1])
            y_max = max(outer[i][1], outer[j][1], inner[i][1], inner[j][1])
            v_walls.append((cx, t, y_min, y_max, "perim_%d" % i))

    if beam_y is not None and beam_t is not None:
        h_walls.append((beam_y - beam_t / 2.0, beam_t, -999, 999, "beam"))

    for p in partitions:
        pid = p.get("id", "?")
        if p["dir"] == "H":
            h_walls.append((p["y"], p["t"], p.get("x0", -999), p.get("x1", 999), pid))
        else:
            v_walls.append((p["x"], p["t"], p.get("y0", -999), p.get("y1", 999), pid))

    return h_walls, v_walls


def trim_partitions(partitions, h_walls, v_walls):
    """Trim interior partition endpoints to the inner face of intersecting walls.

    Each partition's start/end is snapped to the nearest wall face within
    a 2.0ft tolerance. Prevents walls from protruding through perimeter.

    Returns list of trimmed partition dicts (copies, originals unchanged).
    Also returns a trim_log list of strings describing each trim operation.
    """
    TOL = 2.0

    def find_nearest_h(y_pt, x_pos, skip_id):
        best, best_d = None, TOL
        for (hy, ht, hx0, hx1, hid) in h_walls:
            if hid == skip_id:
                continue
            d = abs(hy - y_pt)
            if d < best_d and hx0 - 1.5 <= x_pos <= hx1 + 1.5:
                best_d = d
                best = (hy, ht)
        return best

    def find_nearest_v(x_pt, y_pos, skip_id):
        best, best_d = None, TOL
        for (vx, vt, vy0, vy1, vid) in v_walls:
            if vid == skip_id:
                continue
            d = abs(vx - x_pt)
            if d < best_d and vy0 - 1.5 <= y_pos <= vy1 + 1.5:
                best_d = d
                best = (vx, vt)
        return best

    OVERLAP = 0.0
    FACE_TOL = 0.02

    trim_log = []
    result = []
    for p in partitions:
        tp = dict(p)
        pid = p.get("id", "?")
        changes = []

        if p["dir"] == "V":
            x = p["x"]
            hit = find_nearest_h(p["y0"], x, pid)
            if hit:
                face_lo = hit[0] - hit[1] / 2.0
                face_hi = hit[0] + hit[1] / 2.0
                if face_lo - FACE_TOL <= p["y0"] <= face_hi + FACE_TOL:
                    old = p["y0"]
                    tp["y0"] = face_hi - OVERLAP
                    changes.append("y0 %.2f->%.2f (hit cy=%.2f t=%.2f)" % (old, tp["y0"], hit[0], hit[1]))
                else:
                    changes.append("y0 %.2f SKIP outside wall" % p["y0"])
            else:
                changes.append("y0 %.2f NO HIT" % p["y0"])
            hit = find_nearest_h(p["y1"], x, pid)
            if hit:
                face_lo = hit[0] - hit[1] / 2.0
                face_hi = hit[0] + hit[1] / 2.0
                if face_lo - FACE_TOL <= p["y1"] <= face_hi + FACE_TOL:
                    old = p["y1"]
                    tp["y1"] = face_lo + OVERLAP
                    changes.append("y1 %.2f->%.2f (hit cy=%.2f t=%.2f)" % (old, tp["y1"], hit[0], hit[1]))
                else:
                    changes.append("y1 %.2f SKIP outside wall" % p["y1"])
            else:
                changes.append("y1 %.2f NO HIT" % p["y1"])
        else:
            y = p["y"]
            hit = find_nearest_v(p["x0"], y, pid)
            if hit:
                face_lo = hit[0] - hit[1] / 2.0
                face_hi = hit[0] + hit[1] / 2.0
                if face_lo - FACE_TOL <= p["x0"] <= face_hi + FACE_TOL:
                    old = p["x0"]
                    tp["x0"] = face_hi - OVERLAP
                    changes.append("x0 %.2f->%.2f (hit cx=%.2f t=%.2f)" % (old, tp["x0"], hit[0], hit[1]))
                else:
                    changes.append("x0 %.2f SKIP outside wall" % p["x0"])
            else:
                changes.append("x0 %.2f NO HIT" % p["x0"])
            hit = find_nearest_v(p["x1"], y, pid)
            if hit:
                face_lo = hit[0] - hit[1] / 2.0
                face_hi = hit[0] + hit[1] / 2.0
                if face_lo - FACE_TOL <= p["x1"] <= face_hi + FACE_TOL:
                    old = p["x1"]
                    tp["x1"] = face_lo + OVERLAP
                    changes.append("x1 %.2f->%.2f (hit cx=%.2f t=%.2f)" % (old, tp["x1"], hit[0], hit[1]))
                else:
                    changes.append("x1 %.2f SKIP outside wall" % p["x1"])
            else:
                changes.append("x1 %.2f NO HIT" % p["x1"])

        trim_log.append("%s [%s]: %s" % (pid, p["dir"], " | ".join(changes)))
        result.append(tp)

    return result, trim_log


# ── Wall schedule ────────────────────────────────────────────────────────────

def wall_schedule(wall_data_list):
    """Compute a wall schedule from a flat list of wall data dicts.

    Each dict must have: dir ("H" or "V"), t, z0, z1.
    H walls need x0, x1; V walls need y0, y1.
    Optional fields: id, type, note, cat, room.

    Returns {"walls": [...], "summary_by_type": {...}}.
    Each wall entry has: id, type, dir, t, length, height,
    face_area_sf, volume_cf, room, note, cat.
    Summary entries have: count, total_length, total_face_area_sf, total_volume_cf.
    """
    walls = []
    for w in wall_data_list:
        if w["dir"] == "H":
            length = abs(w["x1"] - w["x0"])
        else:
            length = abs(w["y1"] - w["y0"])
        height = abs(w["z1"] - w["z0"])
        face_area = round(length * height, 4)
        volume = round(face_area * w["t"], 4)
        entry = {
            "id": w.get("id", "?"),
            "type": w.get("type", "exterior"),
            "dir": w["dir"],
            "t": w["t"],
            "length": round(length, 4),
            "height": round(height, 4),
            "face_area_sf": face_area,
            "volume_cf": volume,
            "room": w.get("room", ""),
            "note": w.get("note", ""),
            "cat": w.get("cat", ""),
        }
        walls.append(entry)

    summary = {}
    for w in walls:
        wtype = w["type"]
        if wtype not in summary:
            summary[wtype] = {
                "count": 0,
                "total_length": 0.0,
                "total_face_area_sf": 0.0,
                "total_volume_cf": 0.0,
            }
        summary[wtype]["count"] += 1
        s = summary[wtype]
        s["total_length"] = round(s["total_length"] + w["length"], 4)
        s["total_face_area_sf"] = round(s["total_face_area_sf"] + w["face_area_sf"], 4)
        s["total_volume_cf"] = round(s["total_volume_cf"] + w["volume_cf"], 4)

    return {"walls": walls, "summary_by_type": summary}
