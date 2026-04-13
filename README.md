# rhino-engine

Reusable 3D building model generator for Rhino 8. Takes architectural plan data (JSON) and builds solid 3D models for quantity takeoff estimation.

## Modules

- `rhino_engine/primitives.py` — Solid extrusion, boolean ops, view capture
- `rhino_engine/walls.py` — Perimeter computation, wall registry, partition trimming
- `rhino_engine/layers.py` — Layer management with configurable palettes
- `rhino_engine/zones.py` — Data-driven floor elevation zones

## Tests

Pure-Python geometry tests (no Rhino required):

```bash
python tests/test_geometry.py
```

## Status

Extracted from the 12 Fox Hollow v30 basement builder. See `RHINO_PARITY_ROADMAP.md` for the full refactoring plan.
