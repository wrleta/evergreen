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
from rhino_engine.zones import make_zone_lookup, floor_z_from_floor_config
from rhino_engine.config_validator import validate
from project_builder import build_schedule, _parse_args
from dxf_converter import (
    classify_line, polygon_area, merge_collinear_lines,
    extract_perimeter, extract_interior_walls,
)

try:
    import ezdxf as _ezdxf
    _HAS_EZDXF = True
except ImportError:
    _ezdxf = None
    _HAS_EZDXF = False


FIXTURES = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixtures")
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCHEMA_PATH = os.path.join(REPO_ROOT, "rhino_engine", "project_config_schema.json")
EXAMPLE_CONFIG_PATH = os.path.join(REPO_ROOT, "estimates", "12_fox_hollow", "project_config.json")
GM_CONFIG_PATH = os.path.join(REPO_ROOT, "estimates", "8_greatmeadow", "project_config.json")
GM_LAYER_MAP_PATH = os.path.join(REPO_ROOT, "estimates", "8_greatmeadow", "dxf_layer_map.json")


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


def test_floor_z_from_floor_config():
    """floor_z_from_floor_config should build correct lookup from a floor config dict."""
    floor_config = {
        "name": "basement",
        "floor_z": -8.17,
        "wall_top_z": 0.0,
        "zones": [
            {
                "name": "crawl",
                "floor_z": -3.0,
                "exclude_margin": 1.0,
                "bounds": {"x_min": -30.0, "x_max": -15.0, "y_min": 0.0, "y_max": 25.0},
            }
        ],
    }
    floor_z = floor_z_from_floor_config(floor_config)

    assert floor_z(-22, 12) == -3.0, "interior crawl zone should be -3.0"
    assert floor_z(0, 12) == -8.17, "outside zones should be default"
    assert floor_z(-15.5, 12) == -8.17, "within exclude_margin should be default"

    # Floor config with no zones should always return default_z
    simple_config = {"floor_z": -9.0}
    flat_floor_z = floor_z_from_floor_config(simple_config)
    assert flat_floor_z(0, 0) == -9.0, "no-zones floor should return default_z"
    assert flat_floor_z(-100, -100) == -9.0, "no-zones floor always returns default_z"

    print("PASS: floor_z_from_floor_config")


def test_floor_z_from_12fh_config():
    """Config-driven floor_z should match hardcoded values for key 12FH wall positions."""
    with open(EXAMPLE_CONFIG_PATH) as f:
        config = json.load(f)
    floor_config = config["floors"][0]
    floor_z = floor_z_from_floor_config(floor_config)

    # Main basement slab (default zone)
    assert abs(floor_z(0.0, 20.0) - (-8.17)) < 0.001, \
        "main floor should be -8.17, got %.4f" % floor_z(0.0, 20.0)
    assert abs(floor_z(30.0, 25.0) - (-8.17)) < 0.001, \
        "east wing should be -8.17, got %.4f" % floor_z(30.0, 25.0)

    # Crawl space zone (NW corner, x:-30 to -15, y:0 to 25, margin=1.0)
    # Effective range: x:-29 to -16, y:1 to 24
    # crawl_east_fdn wall at x=-19.65, midpoint y=(2.3+21.0)/2=11.65
    assert abs(floor_z(-19.65, 11.65) - (-3.0)) < 0.001, \
        "crawl_east_fdn midpoint should be -3.0, got %.4f" % floor_z(-19.65, 11.65)

    # Wall near crawl zone but outside (should be default)
    assert abs(floor_z(-14.5, 12.0) - (-8.17)) < 0.001, \
        "just east of crawl zone should be -8.17, got %.4f" % floor_z(-14.5, 12.0)

    # Within the exclude_margin band of the crawl zone east edge (x=-15, margin=1 -> effective x_max=-16)
    assert abs(floor_z(-15.5, 12.0) - (-8.17)) < 0.001, \
        "within crawl zone margin should be -8.17, got %.4f" % floor_z(-15.5, 12.0)

    print("PASS: floor_z from 12FH project_config (crawl zone and default zone both correct)")


def test_project_builder_parse_args():
    """_parse_args should extract --project slug correctly."""
    assert _parse_args(["--project", "12_fox_hollow"]) == "12_fox_hollow"
    assert _parse_args(["--project", "foo", "--other", "bar"]) == "foo"
    assert _parse_args([]) is None
    assert _parse_args(["--other", "x"]) is None

    print("PASS: project_builder _parse_args")


def test_project_builder_schedule_12fh():
    """build_schedule() should produce a valid schedule from 12FH project_config.json."""
    with open(EXAMPLE_CONFIG_PATH) as f:
        config = json.load(f)

    schedule = build_schedule(config)

    # Must have required keys
    assert "walls" in schedule, "schedule missing 'walls' key"
    assert "summary_by_type" in schedule, "schedule missing 'summary_by_type' key"
    assert "trim_log" in schedule, "schedule missing 'trim_log' key"

    s = schedule["summary_by_type"]

    # 12FH project_config: 14-vertex polygon -> 14 exterior walls
    assert "exterior" in s, "schedule must have exterior walls"
    assert s["exterior"]["count"] == 14, \
        "expected 14 exterior walls (14-vertex polygon), got %d" % s["exterior"]["count"]

    # All exterior walls must have positive length and area
    for w in schedule["walls"]:
        if w["type"] == "exterior":
            assert w["length"] > 0, "exterior wall %s has zero length" % w["id"]
            assert w["face_area_sf"] > 0, "exterior wall %s has zero area" % w["id"]

    # Interior partitions: 54 partitions in config, 4 struct, 1 demo, 49 interior
    # Plus 1 beam (struct) -> struct total = 5
    assert "interior" in s, "schedule must have interior walls"
    assert "struct" in s, "schedule must have struct walls"
    assert "demo" in s, "schedule must have demo walls"

    assert s["interior"]["count"] == 49, \
        "expected 49 interior partition walls, got %d" % s["interior"]["count"]
    assert s["struct"]["count"] == 5, \
        "expected 5 struct walls (4 partitions + 1 beam), got %d" % s["struct"]["count"]
    assert s["demo"]["count"] == 1, \
        "expected 1 demo wall, got %d" % s["demo"]["count"]

    # Perimeter walls: 14 segments * height 8.17 * varying thickness
    # Rough total exterior LF (not matching v30 baseline, which used different source data)
    ext_lf = s["exterior"]["total_length"]
    assert ext_lf > 100.0, "exterior total length should be > 100 LF, got %.2f" % ext_lf
    assert ext_lf < 500.0, "exterior total length should be < 500 LF, got %.2f" % ext_lf

    # Interior total length sanity check
    int_lf = s["interior"]["total_length"]
    assert int_lf > 50.0, "interior total length should be > 50 LF, got %.2f" % int_lf

    # Trim log should have one entry per partition
    raw_partitions = config.get("interior_partitions", [])
    assert len(schedule["trim_log"]) == len(raw_partitions), \
        "trim_log length %d != partition count %d" % (
            len(schedule["trim_log"]), len(raw_partitions)
        )

    print("PASS: project_builder build_schedule (12FH: %d ext, %d int, %d struct, %d demo)" % (
        s["exterior"]["count"],
        s["interior"]["count"],
        s["struct"]["count"],
        s["demo"]["count"],
    ))


def test_dxf_converter_helpers():
    """classify_line, polygon_area, and merge_collinear_lines pure-Python correctness."""
    # classify_line: horizontal, vertical, diagonal
    assert classify_line((0, 0), (10, 0)) == 'H', "horizontal line should be H"
    assert classify_line((0, 0), (0, 10)) == 'V', "vertical line should be V"
    assert classify_line((0, 0), (10, 10)) == 'D', "45-deg line should be D"
    assert classify_line((0, 0), (10, 0.03)) == 'H', "near-horizontal should be H (within 2 deg)"
    assert classify_line((0, 0), (0, 0)) is None, "zero-length should be None"

    # polygon_area: CCW rectangle should be positive
    rect_ccw = [(0, 0), (10, 0), (10, 5), (0, 5)]
    area_ccw = polygon_area(rect_ccw)
    assert abs(area_ccw - 50.0) < 0.001, "CCW area should be +50, got %.4f" % area_ccw

    # CW orientation gives negative area
    rect_cw = list(reversed(rect_ccw))
    area_cw = polygon_area(rect_cw)
    assert abs(area_cw + 50.0) < 0.001, "CW area should be -50, got %.4f" % area_cw

    # Triangle
    tri = [(0, 0), (4, 0), (0, 3)]
    assert abs(polygon_area(tri) - 6.0) < 0.001, "triangle area should be 6, got %.4f" % polygon_area(tri)

    # merge_collinear_lines: two overlapping H segments at same y -> merged
    lines = [(5.0, 0.0, 8.0), (5.0, 6.0, 12.0)]  # gap < tol=1.0
    merged = merge_collinear_lines(lines, merge_tol=1.0)
    assert len(merged) == 1, "two overlapping spans should merge to 1, got %d" % len(merged)
    assert abs(merged[0][0] - 5.0) < 0.01 and abs(merged[0][1] - 0.0) < 0.01 and abs(merged[0][2] - 12.0) < 0.01

    # Two non-overlapping spans at same y, gap > tol -> stay separate
    lines2 = [(5.0, 0.0, 4.0), (5.0, 8.0, 12.0)]
    merged2 = merge_collinear_lines(lines2, merge_tol=0.1)
    assert len(merged2) == 2, "non-overlapping spans should stay separate, got %d" % len(merged2)

    # Different y values -> separate groups
    lines3 = [(5.0, 0.0, 10.0), (7.0, 0.0, 10.0)]
    merged3 = merge_collinear_lines(lines3, merge_tol=0.1)
    assert len(merged3) == 2, "different axis vals should stay separate, got %d" % len(merged3)

    print("PASS: dxf_converter helpers (classify_line, polygon_area, merge_collinear_lines)")


def test_dxf_converter_extract_perimeter():
    """extract_perimeter should find the largest closed LWPOLYLINE on the target layer."""
    if not _HAS_EZDXF:
        print("SKIP: test_dxf_converter_extract_perimeter (ezdxf not installed)")
        return

    doc = _ezdxf.new('R2010')
    msp = doc.modelspace()

    # Rectangular perimeter: 50 x 30 feet, CCW
    pts = [(0, 0), (50, 0), (50, 30), (0, 30)]
    lwpoly = msp.add_lwpolyline(pts, dxfattribs={'layer': 'PERIM'})
    lwpoly.closed = True

    # A smaller closed polyline on a different layer (should be ignored)
    small_pts = [(5, 5), (10, 5), (10, 8), (5, 8)]
    sm = msp.add_lwpolyline(small_pts, dxfattribs={'layer': 'OTHER'})
    sm.closed = True

    # An open polyline on PERIM layer (should be ignored)
    open_pts = [(1, 1), (20, 1), (20, 10)]
    msp.add_lwpolyline(open_pts, dxfattribs={'layer': 'PERIM'})

    verts = extract_perimeter(doc, ['PERIM'])

    assert len(verts) == 4, "expected 4 vertices, got %d" % len(verts)
    # CCW: polygon_area should be positive
    area = polygon_area(verts)
    assert area > 0, "perimeter polygon should be CCW (positive area), got %.2f" % area
    assert abs(abs(area) - 50.0 * 30.0) < 0.5, "area should be ~1500 sq ft, got %.2f" % abs(area)

    # Perimeter on OTHER layer should not appear
    verts_other = extract_perimeter(doc, ['NONEXISTENT'])
    assert verts_other == [], "no polygon on missing layer should return []"

    # Case-insensitive layer matching
    verts_lower = extract_perimeter(doc, ['perim'])
    assert len(verts_lower) == 4, "layer matching should be case-insensitive"

    print("PASS: dxf_converter extract_perimeter (%d vertices, area=%.0f sf)" % (len(verts), abs(area)))


def test_dxf_converter_extract_walls():
    """extract_interior_walls should classify LINE entities into H/V partitions."""
    if not _HAS_EZDXF:
        print("SKIP: test_dxf_converter_extract_walls (ezdxf not installed)")
        return

    doc = _ezdxf.new('R2010')
    msp = doc.modelspace()

    # Two horizontal lines on INT-WALL (should merge if collinear, stay separate if not)
    msp.add_line((2.0, 5.0, 0), (18.0, 5.0, 0), dxfattribs={'layer': 'INT-WALL'})
    msp.add_line((5.0, 12.0, 0), (15.0, 12.0, 0), dxfattribs={'layer': 'INT-WALL'})

    # Two vertical lines on INT-WALL
    msp.add_line((10.0, 1.0, 0), (10.0, 20.0, 0), dxfattribs={'layer': 'INT-WALL'})

    # One structural line
    msp.add_line((0.0, 8.0, 0), (50.0, 8.0, 0), dxfattribs={'layer': 'STRUCT'})

    # One diagonal line (should become a diagonal, not a partition)
    msp.add_line((3.0, 3.0, 0), (8.0, 8.0, 0), dxfattribs={'layer': 'INT-WALL'})

    layer_cfg = {
        'INT-WALL': {'type': 'interior', 't': 0.5},
        'STRUCT':   {'type': 'struct',   't': 0.67},
    }

    partitions, diagonals = extract_interior_walls(doc, layer_cfg, unit_scale=1.0)

    # H partitions: 2 horizontal INT-WALL lines
    h_parts = [p for p in partitions if p['dir'] == 'H' and p.get('type', 'interior') == 'interior']
    assert len(h_parts) == 2, "expected 2 H interior partitions, got %d" % len(h_parts)

    # V partitions: 1 vertical INT-WALL line
    v_parts = [p for p in partitions if p['dir'] == 'V']
    assert len(v_parts) == 1, "expected 1 V partition, got %d" % len(v_parts)
    assert abs(v_parts[0]['x'] - 10.0) < 0.01, "V partition x should be 10.0"
    assert abs(v_parts[0]['y0'] - 1.0) < 0.01, "V partition y0 should be 1.0"
    assert abs(v_parts[0]['y1'] - 20.0) < 0.01, "V partition y1 should be 20.0"

    # Structural: 1 H struct wall
    struct_parts = [p for p in partitions if p.get('type') == 'struct']
    assert len(struct_parts) == 1, "expected 1 struct partition, got %d" % len(struct_parts)
    assert abs(struct_parts[0]['t'] - 0.67) < 0.001, "struct thickness should be 0.67"

    # Diagonal: the 45-deg line
    assert len(diagonals) == 1, "expected 1 diagonal, got %d" % len(diagonals)
    d = diagonals[0]
    assert 'p1' in d and 'p2' in d and 't' in d, "diagonal must have p1, p2, t"

    # All partition ids must be unique
    ids = [p['id'] for p in partitions]
    assert len(ids) == len(set(ids)), "duplicate partition ids: %s" % ids

    print("PASS: dxf_converter extract_interior_walls (%d partitions, %d diagonals)" % (
        len(partitions), len(diagonals)
    ))


def test_dxf_layer_map_8gm():
    """8_greatmeadow dxf_layer_map.json and project_config.json must load and be valid."""
    # Layer map structure
    with open(GM_LAYER_MAP_PATH) as f:
        layer_map = json.load(f)

    # Strip private/comment keys
    public = {k: v for k, v in layer_map.items() if not k.startswith("_")}
    assert "perimeter" in public, "layer map must have 'perimeter'"
    assert "interior" in public, "layer map must have 'interior'"
    assert "structural" in public, "layer map must have 'structural'"
    assert "demo" in public, "layer map must have 'demo'"
    assert "hatch" in public, "layer map must have 'hatch'"

    # Perimeter is a non-empty list of strings
    perim = public["perimeter"]
    assert isinstance(perim, list) and len(perim) > 0, "perimeter must be a non-empty list"
    assert all(isinstance(s, str) for s in perim), "perimeter entries must be strings"

    # Interior is a dict mapping layer->config with positive thickness
    interior = public["interior"]
    assert isinstance(interior, dict), "interior must be a dict"
    for ln, cfg in interior.items():
        assert isinstance(cfg, dict), "interior entry %s must be a dict" % ln
        assert "t" in cfg and cfg["t"] > 0, "interior entry %s must have positive t" % ln

    # 8_greatmeadow project_config.json must be valid per schema
    with open(SCHEMA_PATH) as f:
        schema = json.load(f)
    with open(GM_CONFIG_PATH) as f:
        gm_config = json.load(f)

    from rhino_engine.config_validator import validate
    errors = validate(gm_config, schema)
    assert not errors, "8_greatmeadow config failed schema validation:\n  " + "\n  ".join(errors)

    assert gm_config["project"]["slug"] == "8_greatmeadow", "slug must be 8_greatmeadow"
    floors = gm_config["floors"]
    assert len(floors) >= 1, "must have at least 1 floor"
    assert abs(floors[0]["floor_z"] - (-8.17)) < 0.001, "floor_z must be -8.17"

    verts = gm_config["perimeter"]["outer_polygon"]["vertices"]
    assert len(verts) >= 3, "perimeter must have >= 3 vertices"
    thicknesses = gm_config["perimeter"]["outer_polygon"]["segment_thickness"]
    assert len(thicknesses) == len(verts), "segment_thickness count must match vertices"

    print("PASS: 8_greatmeadow layer map + project_config.json valid (%d perimeter layers, %d polygon vertices)" % (
        len(perim), len(verts)
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
    test_floor_z_from_floor_config()
    test_floor_z_from_12fh_config()
    test_project_builder_parse_args()
    test_project_builder_schedule_12fh()
    test_dxf_converter_helpers()
    test_dxf_converter_extract_perimeter()
    test_dxf_converter_extract_walls()
    test_dxf_layer_map_8gm()
    print("\nAll tests passed.")
