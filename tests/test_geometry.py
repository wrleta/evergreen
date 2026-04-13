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
from rhino_engine.walls import compute_perimeter, build_wall_registry, trim_partitions
from rhino_engine.zones import make_zone_lookup


FIXTURES = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixtures")


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


if __name__ == "__main__":
    test_compute_perimeter_simple_rectangle()
    test_compute_perimeter_baseline()
    test_wall_registry()
    test_trim_partitions()
    test_zone_lookup()
    print("\nAll tests passed.")
