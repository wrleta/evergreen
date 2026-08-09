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

- [x] **Chunk 7 — Create project_builder.py (the generic entry point)** (2026-08-06)
  - Takes: --project <slug> (reads estimates/<slug>/project_config.json)
  - Validates config against schema; injects Rhino stubs when outside Rhino
  - Pure-Python path: build_schedule() computes wall schedule without Rhino
  - Rhino path: build_3d() builds geometry, cuts openings, captures, layer_audit
  - Outputs: wall_schedule.json (always); captures + layer_audit.json (Rhino only)
  - CLI run: 12FH -> 14 ext, 49 int, 5 struct, 1 demo (293 LF ext, 452 LF int)
  - 13/13 tests passing (2 new: project_builder _parse_args + build_schedule 12FH)
  - NOTE: Pure-Python counts differ from v30 baseline (14 vs 17 ext) because
    project_config.json perimeter uses 14 segments; full Rhino baseline requires
    running with Walter's v30_perimeter.json source data

### Phase 3: Bridge from AutoCAD Traces

- [x] **Chunk 8 — DXF-to-config converter** (2026-08-07)
  - Created dxf_converter.py (Python 3, uses ezdxf) at repo root
    - extract_perimeter(): largest closed LWPOLYLINE on configurable layers
    - extract_interior_walls(): LINE/LWPOLYLINE -> H/V partitions + diagonals
    - extract_hatches(): HATCH entities with pattern/scale/area (scale encodes pitch)
    - merge_collinear_lines(): collapses overlapping parallel segments before output
    - convert_dxf(): orchestrates extraction -> project_config dict
    - CLI: --dxf, --map, --out, --slug, --name, --floor-z, --wall-top-z, --units
  - Created estimates/8_greatmeadow/dxf_layer_map.json (template; update layer names
    to match actual 1_Greatmeadow_MEASURE.dxf layers before running)
  - Created estimates/8_greatmeadow/project_config.json (placeholder 4-vertex rect;
    will be overwritten when converter runs against actual DXF)
  - 17/17 tests passing (4 new: dxf_converter helpers, extract_perimeter,
    extract_interior_walls, 8gm layer_map + config validation)
  - NOTE: Actual quantity verification (Chunk 8 VERIFY step) requires running
    converter locally against 1_Greatmeadow_MEASURE.dxf, then adjusting
    dxf_layer_map.json layer names to match that file's actual AutoCAD layers

- [x] **Chunk 9 — Test build on 1 Greatmeadow** (2026-08-09)
  - project_builder.py --project 8_greatmeadow runs cleanly (placeholder: 4 ext walls, 160 LF)
  - compare_schedules() + --verify flag ready for when real quantities are measured
  - Fixed dxf_converter bug: interior partitions now emit explicit "type": "interior"
    (previously missing type caused wall_schedule to count them as exterior)
  - Added test_dxf_to_schedule_round_trip: full pipeline from synthetic DXF -> wall_schedule
  - 20/20 tests passing
  - NOTE: Actual AutoCAD quantity verification requires Walter's local session:
    (1) confirm layer names in 1_Greatmeadow_MEASURE.dxf, update dxf_layer_map.json,
    (2) run dxf_converter.py to populate project_config.json,
    (3) fill in acad_takeoff_full.py REFERENCE values + set REFERENCE_VERIFIED=True,
    (4) run project_builder.py --project 8_greatmeadow --verify, iterate until within 5%
  - See PARITY_NOTES.md for detailed step-by-step instructions

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
