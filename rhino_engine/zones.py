# -*- coding: utf-8 -*-
"""
rhino_engine.zones — Floor elevation zones.

Replaces hardcoded floor_z() functions with a data-driven zone lookup.
Each project defines zones as rectangles (or polygons) with floor elevations.
Points are tested against zones; the first matching zone wins.
"""


def make_zone_lookup(zones, default_z):
    """Create a floor_z(x, y) function from zone definitions.

    Args:
        zones: List of zone dicts, each with:
            - "name": zone identifier
            - "floor_z": elevation for this zone
            - "bounds": {"x_min", "x_max", "y_min", "y_max"} rectangle
            - "exclude_margin": optional float, points within this distance
              of a boundary edge use default_z instead (for walls that
              straddle zone boundaries)
        default_z: Default floor elevation for points outside all zones.

    Returns a function floor_z(x, y) -> float.
    """
    def floor_z(x, y):
        for zone in zones:
            b = zone["bounds"]
            margin = zone.get("exclude_margin", 0.0)
            if (b["x_min"] + margin <= x <= b["x_max"] - margin and
                b["y_min"] + margin <= y <= b["y_max"] - margin):
                return zone["floor_z"]
        return default_z

    return floor_z
