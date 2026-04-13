# -*- coding: utf-8 -*-
"""
rhino_engine — Reusable 3D building model generator for Rhino 8.

Builds architectural 3D models from JSON project configs:
  perimeter walls (quadrilateral prisms with clean corners),
  interior partitions (auto-trimmed to wall faces),
  openings (boolean-cut windows/doors),
  structural elements (beams, posts, footings, stairs).

Extracted from the 12 Fox Hollow v30 basement builder.
"""

__version__ = "0.1.0"
