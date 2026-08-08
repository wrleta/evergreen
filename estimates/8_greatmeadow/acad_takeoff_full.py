# -*- coding: utf-8 -*-
"""
Reference quantities for 1 Greatmeadow from manual AutoCAD takeoff.

Workflow to fill this in:
  1. Open 1_Greatmeadow_MEASURE.dxf in AutoCAD / DraftSight.
  2. Identify actual layer names (LIST or LAYER command).
  3. Update estimates/8_greatmeadow/dxf_layer_map.json with real layer names.
  4. Run: python dxf_converter.py --dxf 1_Greatmeadow_MEASURE.dxf
            --map estimates/8_greatmeadow/dxf_layer_map.json
            --out estimates/8_greatmeadow/project_config.json
            --slug 8_greatmeadow --name "1 Greatmeadow"
  5. Measure wall counts/lengths in AutoCAD and enter them below.
  6. Set REFERENCE_VERIFIED = True.
  7. Run: python project_builder.py --project 8_greatmeadow --verify

Set REFERENCE_VERIFIED = True once the values below are from actual field measurements.
"""

REFERENCE = {
    "exterior": {
        "count": None,           # number of perimeter wall segments
        "total_length": None,    # linear feet
        "total_face_area_sf": None,  # square feet of face area
    },
    "interior": {
        "count": None,
        "total_length": None,
        "total_face_area_sf": None,
    },
    "struct": {
        "count": None,
        "total_length": None,
        "total_face_area_sf": None,
    },
    "demo": {
        "count": None,
        "total_length": None,
        "total_face_area_sf": None,
    },
}

REFERENCE_VERIFIED = False
