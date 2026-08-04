# -*- coding: utf-8 -*-
"""
test_geometry.py — Pure-Python tests for the geometry engine.

These tests validate compute_perimeter() and trim_partitions() math
WITHOUT requiring Rhino. They mock rhinoscriptsyntax to test the
pure geometry computations.

Run: python tests/test_geometry.py
"""
import json
import math
import os
import sys

# ── Mock rhinoscriptsyntax for testing without Rhino ─────────────────────────
# The geometry functions we're testing only use rs for AddPolyline, ObjectLayer,
# etc. — the math itself is pure Python. We mock rs to test just the math.

class MockRS:
    def AddLayer(self, *a, **kw): return "layer"
    def CreateColor(self, *a): return (a[0], a[1], a[2])
    def LayerVisible(self, *a): pass
    def LayerLocked(self, *a): pass
    def AddPolyline(self, pts): return "polyline_guid"
    def ObjectLayer(self, *a): pass
    def ExtrudeCurveStraight(self, *a): return "solid_guid"
    def DeleteObject(self, *a): pass
    def CapPlanarHoles(self, *a): pass
    def IsLayer(self, name): return True
    def LayerNames(self): return []
    def ObjectsByLayer(self, name): return []

sys.modules['rhinoscriptsyntax'] = MockRS()
sys.modules['Rhino'] = type(sys)('Rhino')
sys.modules['System'] = type(sys)('System')
sys.modules['System.Drawing'] = type(sys)('System.Drawing')
sys.modules['scriptcontext'] = type(sys)('scriptcontext')

# Now we can import the engine modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from rhino_engine.walls import compute_perimeter, build_wall_registry, trim_partitions, wall_schedule
from rhino_engine.zones import make_zone_lookup
from rhino_engine.config_validator import validate


FIXTURES = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixtures")
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCHEMA_PATH = os.path.join(REPO_ROOT, "rhino_engine", "project_config_schema.json")
EXAMPLE_CONFIG_PATH = os.path.join(REPO_ROOT, "estimates", "12_fox_hollow", "project_config.json")


def test_compute_perimeter_simple_rectangle():
    """A simple 10x20 rectangle with 1ft thick walls should produce correct inner polygon."""
    data = {
        "outer_polygon": {
            "vertices": [[0, 0], [20, 0], [20, 10], [0, 10]],
            "segment_thickness": [1.0, 1.0, 1.0, 1.0]
        }
    }
    outer, inner, seg_t = compute_perimeter(data)

    assert len(outer) == 4
    assert len(inner) == 4
    assert len(seg_t) == 4

    # Inner should be offset 1ft inward on all sides
    # For CCW: bottom wall normal points up, right wall normal points left, etc.
    assert abs(inner[0][0] - 1.0) < 0.01, "inner[0].x should be 1.0, got %.3f" % inner[0][0]
    assert abs(inner[0][1] - 1.0) < 0.01, "inner[0].y should be 1.0, got %.3f" % inner[0][1]
    assert abs(inner[1][0] - 19.0) < 0.01, "inner[1].x should be 19.0, got %.3f" % inner[1][0]
    assert abs(inner[1][1] - 1.0) < 0.01, "inner[1].y should be 1.0, got %.3f" % inner[1][1]
    assert abs(inner[2][0] - 19.0) < 0.01, "inner[2].x should be 19.0, got %.3f" % inner[2][0]
    assert abs(inner[2][1] - 9.0) < 0.01, "inner[2].y should be 9.0, got %.3f" % inner[2][1]
    assert abs(inner[3][0] - 1.0) < 0.01, "inner[3].x should be 1.0, got %.3f" % inner[3][0]
    assert abs(inner[3][1] - 9.0) < 0.01, "inner[3].y should be 9.0, got %.3f" % inner[3][1]

    print("PASS: simple rectangle perimeter")


def test_compute_perimeter_baseline():
    """Validate compute_perimeter against the 12FH baseline data."""
    with open(os.path.join(FIXTURES, "baseline_perimeter.json")) as f:
        perim = json.load(f)

    outer, inner, seg_t = compute_perimeter(perim)

    n_vertices = len(perim["outer_polygon"]["vertices"])
    assert len(outer) == n_vertices, "outer count mismatch: %d vs %d" % (len(outer), n_vertices)
    assert len(inner) == n_vertices, "inner count mismatch"
    assert len(seg_t) == n_vertices, "seg_t count mismatch"

    # Every inner point should be offset inward (distance > 0 from outer)
    for i in range(len(outer)):
        dx = inner[i][0] - outer[i][0]
        dy = inner[i][1] - outer[i][1]
        dist = math.sqrt(dx * dx + dy * dy)
        assert dist > 0.1, "inner[%d] too close to outer (dist=%.4f)" % (i, dist)
        assert dist < 5.0, "inner[%d] too far from outer (dist=%.4f)" % (i, dist)

    print("PASS: baseline perimeter (%d vertices)" % n_vertices)


def test_wall_registry():
    """Wall registry should correctly classify H and V segments."""
    data = {
        "outer_polygon": {
            "vertices": [[0, 0], [20, 0], [20, 10], [0, 10]],
            "segment_thickness": [0.83, 0.83, 0.83, 0.83]
        }
    }
    outer, inner, seg_t = compute_perimeter(data)
    partitions = [
        {"id": "w1", "dir": "V", "x": 10.0, "t": 0.5, "y0": 0.0, "y1": 10.0},
        {"id": "w2", "dir": "H", "y": 5.0, "t": 0.5, "x0": 0.0, "x1": 20.0},
    ]
    h_walls, v_walls = build_wall_registry(outer, inner, seg_t, partitions)

    # Should have: 2 H perimeter + 1 H partition + 2 V perimeter + 1 V partition
    h_perim = [w for w in h_walls if w[4].startswith("perim")]
    v_perim = [w for w in v_walls if w[4].startswith("perim")]
    assert len(h_perim) == 2, "expected 2 H perimeter walls, got %d" % len(h_perim)
    assert len(v_perim) == 2, "expected 2 V perimeter walls, got %d" % len(v_perim)
    assert any(w[4] == "w1" for w in v_walls), "partition w1 missing from V walls"
    assert any(w[4] == "w2" for w in h_walls), "partition w2 missing from H walls"

    print("PASS: wall registry")


def test_trim_partitions():
    """Trimming should snap partition endpoints to wall inner faces."""
    data = {
        "outer_polygon": {
            "vertices": [[0, 0], [20, 0], [20, 10], [0, 10]],
            "segment_thickness": [1.0, 1.0, 1.0, 1.0]
        }
    }
    outer, inner, seg_t = compute_perimeter(data)
    raw = [
        {"id": "test_v", "dir": "V", "x": 10.0, "t": 0.5, "y0": 0.0, "y1": 10.0},
    ]
    h_walls, v_walls = build_wall_registry(outer, inner, seg_t, raw)
    trimmed, log = trim_partitions(raw, h_walls, v_walls)

    assert len(trimmed) == 1
    t = trimmed[0]
    # y0 should be trimmed to inner face of bottom wall (y=1.0)
    assert abs(t["y0"] - 1.0) < 0.1, "y0 should be ~1.0, got %.3f" % t["y0"]
    # y1 should be trimmed to inner face of top wall (y=9.0)
    assert abs(t["y1"] - 9.0) < 0.1, "y1 should be ~9.0, got %.3f" % t["y1"]

    print("PASS: partition trimming")


def test_zone_lookup():
    """Zone-based floor_z should return correct elevations."""
    zones = [
        {"name": "crawl", "floor_z": -3.0, "bounds": {"x_min": -30, "x_max": -15, "y_min": 0, "y_max": 25}, "exclude_margin": 1.0},
    ]
    floor_z = make_zone_lookup(zones, default_z=-8.17)

    assert floor_z(-22, 12) == -3.0, "crawl zone should be -3.0"
    assert floor_z(0, 12) == -8.17, "outside zones should be default"
    assert floor_z(-15.5, 12) == -8.17, "within exclude_margin should be default"

    print("PASS: zone lookup")


def test_wall_schedule_aggregation():
    """wall_schedule() should compute lengths, areas, volumes and aggregate by type."""
    HEIGHT = 8.17   # -8.17 to 0.0
    walls = [
        {"id": "ext1", "type": "exterior", "dir": "H", "t": 0.83,
         "z0": -8.17, "z1": 0.0, "x0": 0.0, "x1": 10.0},
        {"id": "ext2", "type": "exterior", "dir": "V", "t": 0.83,
         "z0": -8.17, "z1": 0.0, "y0": 0.0, "y1": 20.0},
        {"id": "int1", "type": "interior", "dir": "H", "t": 0.5,
         "z0": -8.17, "z1": 0.0, "x0": 2.0, "x1": 17.0},
        {"id": "struct1", "type": "struct", "dir": "H", "t": 0.67,
         "z0": -8.17, "z1": 0.0, "x0": -30.0, "x1": 70.0},
    ]
    sched = wall_schedule(walls)

    assert len(sched["walls"]) == 4

    ext = sched["summary_by_type"]["exterior"]
    assert ext["count"] == 2, "exterior count should be 2, got %d" % ext["count"]
    assert abs(ext["total_length"] - 30.0) < 0.01, "total_length: expected 30, got %.4f" % ext["total_length"]
    # ext1: 10*8.17=81.7, ext2: 20*8.17=163.4, total=245.1
    assert abs(ext["total_face_area_sf"] - (10.0 * HEIGHT + 20.0 * HEIGHT)) < 0.1, \
        "exterior face area mismatch: %.4f" % ext["total_face_area_sf"]

    int_s = sched["summary_by_type"]["interior"]
    assert int_s["count"] == 1, "interior count should be 1"
    assert abs(int_s["total_length"] - 15.0) < 0.01, "interior length: expected 15, got %.4f" % int_s["total_length"]

    struct_s = sched["summary_by_type"]["struct"]
    assert struct_s["count"] == 1
    assert abs(struct_s["total_length"] - 100.0) < 0.01, "struct length: expected 100, got %.4f" % struct_s["total_length"]

    # Verify volume: ext1 = 10 * 8.17 * 0.83 = 67.81
    w = sched["walls"][0]
    assert abs(w["volume_cf"] - 10.0 * HEIGHT * 0.83) < 0.05, \
        "ext1 volume: expected %.2f, got %.4f" % (10.0 * HEIGHT * 0.83, w["volume_cf"])

    print("PASS: wall schedule aggregation")


def test_baseline_wall_schedule():
    """Baseline fixture should match the 12FH verified quantities from the roadmap."""
    with open(os.path.join(FIXTURES, "baseline_wall_schedule.json")) as f:
        sched = json.load(f)

    s = sched["summary_by_type"]

    assert s["exterior"]["count"] == 17, \
        "exterior count: expected 17, got %d" % s["exterior"]["count"]
    assert abs(s["exterior"]["total_length"] - 390.8) < 0.1, \
        "exterior length: expected 390.8, got %.2f" % s["exterior"]["total_length"]
    assert abs(s["exterior"]["total_face_area_sf"] - 3192.82) < 0.5, \
        "exterior area: expected 3192.82, got %.2f" % s["exterior"]["total_face_area_sf"]

    assert s["interior"]["count"] == 51, \
        "interior count: expected 51, got %d" % s["interior"]["count"]
    assert abs(s["interior"]["total_length"] - 460.89) < 0.1, \
        "interior length: expected 460.89, got %.2f" % s["interior"]["total_length"]
    assert abs(s["interior"]["total_face_area_sf"] - 3411.10) < 0.5, \
        "interior area: expected 3411.10, got %.2f" % s["interior"]["total_face_area_sf"]

    assert s["struct"]["count"] == 5, \
        "struct count: expected 5, got %d" % s["struct"]["count"]
    assert abs(s["struct"]["total_length"] - 198.61) < 0.1, \
        "struct length: expected 198.61, got %.2f" % s["struct"]["total_length"]
    assert abs(s["struct"]["total_face_area_sf"] - 1197.47) < 0.5, \
        "struct area: expected 1197.47, got %.2f" % s["struct"]["total_face_area_sf"]

    assert s["demo"]["count"] == 1, \
        "demo count: expected 1, got %d" % s["demo"]["count"]
    assert abs(s["demo"]["total_length"] - 13.21) < 0.1, \
        "demo length: expected 13.21, got %.2f" % s["demo"]["total_length"]

    print("PASS: baseline wall schedule matches 12FH verified numbers")


def test_project_config_schema_loads():
    """Schema file must be valid JSON with required top-level structure."""
    with open(SCHEMA_PATH) as f:
        schema = json.load(f)

    assert schema.get("type") == "object", "schema root type must be 'object'"
    assert "required" in schema, "schema must have 'required' key"
    assert "properties" in schema, "schema must have 'properties' key"

    required = schema["required"]
    for field in ("project", "floors", "perimeter"):
        assert field in required, "schema must require top-level field '%s'" % field

    props = schema["properties"]
    assert "project" in props
    assert "floors" in props
    assert "perimeter" in props
    assert "interior_partitions" in props
    assert "diagonals" in props
    assert "openings" in props
    assert "structure" in props
    assert "layers" in props

    # project sub-schema requires name and slug
    proj_required = props["project"].get("required", [])
    assert "name" in proj_required, "project must require 'name'"
    assert "slug" in proj_required, "project must require 'slug'"

    # perimeter sub-schema requires outer_polygon
    perim_required = props["perimeter"].get("required", [])
    assert "outer_polygon" in perim_required, "perimeter must require 'outer_polygon'"

    # outer_polygon requires vertices and segment_thickness
    outer_poly = props["perimeter"]["properties"]["outer_polygon"]
    op_required = outer_poly.get("required", [])
    assert "vertices" in op_required, "outer_polygon must require 'vertices'"
    assert "segment_thickness" in op_required, "outer_polygon must require 'segment_thickness'"

    print("PASS: project_config schema loads and has expected structure")


def test_project_config_12fh_validates():
    """12FH project_config.json must load and pass schema validation."""
    with open(SCHEMA_PATH) as f:
        schema = json.load(f)
    with open(EXAMPLE_CONFIG_PATH) as f:
        config = json.load(f)

    errors = validate(config, schema)
    assert not errors, "12FH config failed schema validation:\n  " + "\n  ".join(errors)

    # Structural spot checks: confirm 12FH data is present
    proj = config["project"]
    assert proj["slug"] == "12_fox_hollow", "slug mismatch"
    assert proj["name"] == "12 Fox Hollow", "name mismatch"

    floors = config["floors"]
    assert len(floors) == 1, "expected 1 floor, got %d" % len(floors)
    assert abs(floors[0]["floor_z"] - (-8.17)) < 0.001, "floor_z mismatch"
    assert abs(floors[0]["wall_top_z"] - 0.0) < 0.001, "wall_top_z mismatch"

    zones = floors[0].get("zones", [])
    assert len(zones) == 1, "expected 1 zone (crawl), got %d" % len(zones)
    assert zones[0]["name"] == "crawl"
    assert abs(zones[0]["floor_z"] - (-3.0)) < 0.001, "crawl floor_z mismatch"

    outer = config["perimeter"]["outer_polygon"]
    verts = outer["vertices"]
    thicknesses = outer["segment_thickness"]
    assert len(verts) == 14, "expected 14 vertices (12FH polygon), got %d" % len(verts)
    assert len(thicknesses) == 14, "segment_thickness count must match vertex count"
    assert len(thicknesses) == len(verts), "vertex/thickness count mismatch"

    # Every thickness must be positive
    for i, t in enumerate(thicknesses):
        assert t > 0, "segment_thickness[%d] must be positive, got %s" % (i, t)

    partitions = config.get("interior_partitions", [])
    assert len(partitions) == 54, "expected 54 interior partitions, got %d" % len(partitions)

    # All partition ids must be unique
    ids = [p["id"] for p in partitions]
    assert len(ids) == len(set(ids)), "duplicate partition ids found"

    # All partitions must have required fields
    for p in partitions:
        assert "id" in p, "partition missing 'id'"
        assert "dir" in p, "partition '%s' missing 'dir'" % p.get("id", "?")
        assert p["dir"] in ("H", "V"), "partition '%s' dir must be H or V" % p["id"]
        assert "t" in p, "partition '%s' missing 't'" % p["id"]
        assert p["t"] > 0, "partition '%s' thickness must be positive" % p["id"]
        if p["dir"] == "H":
            assert "y" in p, "H partition '%s' missing 'y'" % p["id"]
            assert "x0" in p and "x1" in p, "H partition '%s' missing x0/x1" % p["id"]
        else:
            assert "x" in p, "V partition '%s' missing 'x'" % p["id"]
            assert "y0" in p and "y1" in p, "V partition '%s' missing y0/y1" % p["id"]

    # Count struct/demo types
    struct_count = sum(1 for p in partitions if p.get("type") == "struct")
    demo_count = sum(1 for p in partitions if p.get("type") == "demo")
    assert struct_count == 4, "expected 4 struct partitions, got %d" % struct_count
    assert demo_count == 1, "expected 1 demo partition, got %d" % demo_count

    diagonals = config.get("diagonals", [])
    assert len(diagonals) == 2, "expected 2 diagonal walls, got %d" % len(diagonals)
    for d in diagonals:
        assert "id" in d and "p1" in d and "p2" in d and "t" in d
        assert len(d["p1"]) == 2 and len(d["p2"]) == 2

    structure = config.get("structure", {})
    beams = structure.get("beams", [])
    assert len(beams) == 1, "expected 1 beam, got %d" % len(beams)
    assert beams[0]["id"] == "beam_wall"
    assert beams[0]["dir"] == "H"
    assert abs(beams[0]["t"] - 0.67) < 0.001, "beam thickness mismatch"

    print("PASS: 12FH project_config validates against schema (%d partitions, %d diagonals, %d beams)" % (
        len(partitions), len(diagonals), len(beams)
    ))


if __name__ == "__main__":
    test_compute_perimeter_simple_rectangle()
    test_compute_perimeter_baseline()
    test_wall_registry()
    test_trim_partitions()
    test_zone_lookup()
    test_wall_schedule_aggregation()
    test_baseline_wall_schedule()
    test_project_config_schema_loads()
    test_project_config_12fh_validates()
    print("\nAll tests passed.")
