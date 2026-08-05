# Rhino Estimation Engine — Parity Roadmap

## What This Is
Refactoring the 12 Fox Hollow Rhino build scripts into a reusable estimation engine
that works on ANY project. The engine takes project JSON config as input and builds
3D models in Rhino for quantity takeoff.

## How It Gets Done
- A scheduled agent picks up chunks during low-usage weeks
- Each chunk: code → test → verify against 12FH baseline → iterate until passing → commit
- Progress tracked in this file (checkboxes below)

## Verification Baseline (12 Fox Hollow)
The refactored engine must reproduce these EXACT numbers from v30_wall_schedule.json:
- 17 exterior walls, 390.8 LF total, 3192.82 SF face area
- 51 interior walls, 460.89 LF total, 3411.10 SF face area
- 5 structural walls, 198.61 LF total, 1197.47 SF face area
- 1 demo wall, 13.21 LF total, 97.49 SF face area
- 13/13 openings cut successfully

Self-test: run the engine with 12FH JSON inputs → compare wall_schedule output → 
all counts and measurements must match within 0.01 tolerance.

---

## Work Queue

### Phase 1: Extract Reusable Engine (no behavior change)

- [x] **Chunk 1 — Create rhino_engine/ package with primitives** (2026-04-12)
  - Extracted: `make_solid()`, `box()`, `rect_box()`, `wall_from_centerline()`,
    `object_brep()`, `solid_difference()`, `capture()`
  - File: `rhino_engine/primitives.py`
  - 5/5 geometry tests passing

- [x] **Chunk 2 — Extract perimeter + wall trimming** (2026-04-12)
  - Extracted: `compute_perimeter()`, `build_perimeter_walls()`,
    `build_wall_registry()`, `trim_partitions()`
  - File: `rhino_engine/walls.py`
  - trim_partitions now returns (result, trim_log) tuple
  - Baseline perimeter test validates against 12FH 14-vertex polygon

- [x] **Chunk 3 — Extract layer management + capture system** (2026-04-12)
  - Extracted: `setup_layers()`, `clear_layers()`, `layer_audit()`,
    `hide_layers()`, `show_layers()`
  - File: `rhino_engine/layers.py`
  - LAYERS dicts are now parameters, not constants (BASEMENT_LAYERS, FIRST_FLOOR_LAYERS as defaults)
  - Also created `rhino_engine/zones.py` with `make_zone_lookup()` (chunk 6 head start)

- [x] **Chunk 4 — Refactor v30.py main() to use rhino_engine imports** (2026-08-03)
  - Created estimates/12_fox_hollow/v30.py: thin IronPython entry point using engine imports
  - All geometry logic imported from rhino_engine/{primitives,walls,layers,zones}
  - 12FH-specific data kept in v30.py: FLOOR_Z_DEFAULT=-8.17, WALL_TOP_Z=0, CRAWL_ZONES, file paths
  - Added wall_schedule() to rhino_engine/walls.py (pure Python, testable)
  - Fixed truncated baseline_wall_schedule.json fixture (trailing incomplete entry removed)
  - 7/7 tests passing (2 new: wall_schedule aggregation + baseline fixture validation)
  - NOTE: Full Rhino verification (wall schedule match) requires running locally with Walter's
    12FH JSON inputs (v30_perimeter.json, basement_complete.json, cad_openings_resolved.json)

### Phase 2: Parameterize Project Config

- [x] **Chunk 5 — Define project_config.json schema** (2026-08-04)
  - Schema: `rhino_engine/project_config_schema.json` (JSON Schema Draft 7)
    - project: { name, slug, description }
    - floors[]: { name, floor_z, wall_top_z, zones[] }
    - zones[]: { name, floor_z, bounds, exclude_margin }
    - perimeter: { outer_polygon: { vertices, segment_thickness, segment_labels } }
    - interior_partitions[]: { id, dir, t, type, cat, x/y/x0/x1/y0/y1, note }
    - diagonals[]: { id, p1, p2, t, type, cat, note }
    - openings[]: { id, dir, cx, cy, width, height, z_bot, z_top, type }
    - structure: { beams[], posts[], footings[], stairs[], areaways[] }
    - layers: { name -> [R,G,B] } (overridable defaults)
  - Validator: `rhino_engine/config_validator.py` (minimal Draft 7, IronPython 2.7 compatible)
  - Example: `estimates/12_fox_hollow/project_config.json`
    - 14-vertex outer polygon, 54 interior partitions (4 struct, 1 demo), 2 diagonals, 1 beam
    - Crawl zone (floor_z=-3.0 in NW corner)
  - 9/9 tests passing (2 new: schema structure + 12FH validation)

- [x] **Chunk 6 — Build generic floor_z() from zone config** (2026-08-05)
  - Added floor_z_from_floor_config() to rhino_engine/zones.py
  - Reads zones[] and default floor_z from project_config.json floors[] entry
  - Updated estimates/12_fox_hollow/v30.py to load floor config from project_config.json
    (removed hardcoded CRAWL_ZONES; FLOOR_Z_DEFAULT/WALL_TOP_Z kept as fallback constants)
  - 11/11 tests passing (2 new: test_floor_z_from_floor_config + test_floor_z_from_12fh_config)
  - VERIFY: crawl zone (-19.65, 11.65) -> -3.0, main zone (0.0, 20.0) -> -8.17 both confirmed

- [ ] **Chunk 7 — Create project_builder.py (the generic entry point)**
  - Takes: --project <slug> (reads estimates/<slug>/project_config.json)
  - Calls rhino_engine functions with config-driven parameters
  - Outputs: wall_schedule.json, captures, layer audit
  - VERIFY: 12FH baseline match when run as `project_builder.py --project 12_fox_hollow`

### Phase 3: Bridge from AutoCAD Traces

- [ ] **Chunk 8 — DXF-to-config converter**
  - Read 1_Greatmeadow_MEASURE.dxf (or .dwg export)
  - Extract: hatch areas (with scale→pitch encoding), polylines by layer
  - Map AutoCAD layers → project_config.json structure
  - Output: estimates/8_greatmeadow/project_config.json
  - VERIFY: quantities match acad_takeoff_full.py output for 1GM

- [ ] **Chunk 9 — Test build on 1 Greatmeadow**
  - Run project_builder.py --project 8_greatmeadow
  - Compare 3D model quantities against manual AutoCAD measurements
  - Iterate until wall counts, areas, lengths match within 5%
  - VERIFY: visual comparison (captures) + quantity cross-check

- [ ] **Chunk 10 — Viewer integration**
  - Ensure takeoff.json gets generated for new projects
  - Verify viewer loads and displays correctly
  - Test project switcher in the UI
  - VERIFY: both projects visible and navigable in viewer

---

## Usage Gate

Before starting any chunk, the agent checks:
```bash
git log --since="7 days ago" --oneline -- . | wc -l
```
If > 30 commits in the last week = HIGH USAGE → skip, reschedule.
If <= 30 = LOW USAGE → proceed with next chunk.

## Rhino Watcher Integration

Chunks needing Rhino verification use the **file-trigger watcher pattern**:
1. Write an IronPython script to `estimates/12_fox_hollow/<name>.py`
2. Write the script path to `estimates/12_fox_hollow/<name>.trigger`
3. Rhino watcher (idle event) picks it up, runs it, writes `<name>.py.result`
4. Read the `.result` file for OK/ERROR status

Watcher source: `estimates/12_fox_hollow/rhino_watcher.py`
Watch dir: `C:\Users\Walter\iCloudDrive\Documents\Work\windowsmac\estimates\12_fox_hollow`

For LOCAL sessions (not remote agent): check `tasklist | grep -i rhino` first.
If Rhino not running, launch it and inject watcher via SendKeys:
  `rhino-send-script.ps1` in `qbo-api/scripts/`

Remote agent (GitHub): does pure Python/JSON work only.
Local agent (Walter's machine): does Rhino-dependent verification via watcher triggers.

## Self-Grind Protocol

For each chunk:
1. Read this roadmap, find next unchecked chunk
2. Read the relevant source files
3. Make the changes
4. Run verification:
   - Pure Python chunks: `python tests/test_geometry.py`
   - Rhino chunks: write trigger → wait for .result → read output
5. If FAIL: read the error, diagnose, fix, re-run (up to 5 attempts)
6. If PASS: commit, mark chunk done
7. If stuck after 5 attempts: leave detailed notes in PARITY_NOTES.md, move on
8. Update this roadmap (check the box)

## File Locations
- Engine repo: https://github.com/wrleta/rhino-engine (private)
- Engine local: C:\Users\Walter\rhino-engine-repo\rhino_engine\
- 12FH project: C:\Users\Walter\iCloudDrive\Documents\Work\windowsmac\estimates\12_fox_hollow\
- 12FH baseline: v30_wall_schedule.json (17 ext, 51 int, 5 struct, 13/13 openings)
- 12FH source: v30.py (1,444 lines)
- 12FH inputs: v30_perimeter.json, basement_complete.json, rhino_views/cad_openings_resolved.json
- 1GM AutoCAD: estimates/8_greatmeadow/1_Greatmeadow_MEASURE.dxf
- 1GM measurements: estimates/8_greatmeadow/acad_takeoff_full.py (reference quantities)
- Rhino watcher: estimates/12_fox_hollow/rhino_watcher.py
- Rhino SendKeys: qbo-api/scripts/rhino-send-script.ps1
- Viewer: takeoff/server.mjs, takeoff/ui/app.js
