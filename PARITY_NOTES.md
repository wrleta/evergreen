# Parity Notes

## Chunk 9 — Test build on 1 Greatmeadow (2026-08-08)

**Status: Infrastructure complete; quantity verification blocked on local DXF access.**

### What was done (remote agent)

- `project_builder.py --project 8_greatmeadow` runs without error using the
  placeholder config (4-vertex 50x30 rectangle): 4 exterior walls, 160.0 LF.
- Added `compare_schedules(actual, reference, tolerance=0.05)` to
  `project_builder.py`: checks every type/field pair within a fractional
  tolerance and returns `(ok, mismatches)`.
- Added `--verify` CLI flag to `project_builder.py`: loads
  `estimates/<slug>/acad_takeoff_full.py`, checks `REFERENCE_VERIFIED`, and
  runs `compare_schedules` against the schedule output.
- Created `estimates/8_greatmeadow/acad_takeoff_full.py`: placeholder for
  manual AutoCAD takeoff quantities with workflow instructions.
- 19/19 tests passing (2 new: `test_compare_schedules`,
  `test_project_builder_schedule_8gm`).

### Blocker — requires local access

The roadmap chunk requires comparing the 3D build against actual AutoCAD
measurements. This depends on inputs that only exist on Walter's machine:

1. **`1_Greatmeadow_MEASURE.dxf`** — The source DXF file.  The remote agent
   has no access to this file.  It must be run through `dxf_converter.py`
   locally to populate `estimates/8_greatmeadow/project_config.json`.

2. **Actual layer names** — The `dxf_layer_map.json` layer names
   (`FOUNDATION`, `INT-WALL`, etc.) are guesses.  They must be confirmed
   against the real DXF before the converter will extract the correct
   geometry.

3. **Reference measurements** — `acad_takeoff_full.py` has all `None` values.
   These must be filled in from a manual count in AutoCAD/DraftSight before
   `--verify` will do a real comparison.

### Steps to unblock (local session)

```bash
# 1. Open the DXF, check layer names, update dxf_layer_map.json

# 2. Run the converter
python dxf_converter.py \
  --dxf "C:\...\1_Greatmeadow_MEASURE.dxf" \
  --map estimates/8_greatmeadow/dxf_layer_map.json \
  --out estimates/8_greatmeadow/project_config.json \
  --slug 8_greatmeadow --name "1 Greatmeadow"

# 3. Run the builder (pure Python)
python project_builder.py --project 8_greatmeadow

# 4. Compare output counts/LF to AutoCAD; fill in acad_takeoff_full.py REFERENCE
#    and set REFERENCE_VERIFIED = True

# 5. Verify
python project_builder.py --project 8_greatmeadow --verify

# 6. Iterate dxf_layer_map.json + segment_thickness adjustments until
#    all quantities are within 5% of reference

# 7. Mark Chunk 9 complete in RHINO_PARITY_ROADMAP.md
```

### What Chunk 10 depends on

Chunk 10 (Viewer integration) needs a populated `project_config.json` for
8_greatmeadow so the viewer can display both projects.  It can proceed once
the DXF conversion produces a real config.
