# SmartWeld 3D Catalogue and Plant Generator

Clean-room build. Read `DESIGN_BASIS.md` (every rule with its reason) and `PROVENANCE.md`
(the audit log) first. No published dimension tables, standards or catalogues were used.

## Stage status

| Stage | Scope                                                   | Status  |
|-------|---------------------------------------------------------|---------|
| 1     | Structural sections, plates, connection hardware, welds | done    |
| 2     | Building shell (frame, cold-formed framing, cladding, roof, doors) | next |
| 3     | Interior: equipment, pipe rack, platforms, access steel  | pending (needs eCFR access) |
| 4     | Valves                                                  | pending |
| 5     | Piping and routing                                      | pending (needs user decision on pipe/flange interface sourcing) |
| 6     | Ground-truth export                                     | pending |

## Run

```
npm install
npm test          # rule and geometry tests (vitest)
npm run typecheck
npm run dev       # viewer at http://127.0.0.1:5173/
npm run screenshot  # headless-browser verification → screenshots/stage1/
```

Type any designation into the viewer (e.g. `W18x50`, `C12x20.7`, `L5x3x3/8`, `HSS8x6x3/8`,
`HSS10x1/2`, `PL3/4x10x14`, `B7/8x3`, `FW5/16`, `GW3/4`).

## Layout

```
DESIGN_BASIS.md        rules and reasons (the only source of rule numbers)
PROVENANCE.md          audit log, libraries and licences
src/core               units, dimension basis tags, physical constants
src/catalogue          designation parser and part rules → PartSpec (plain data)
src/geometry           profiles, extrusion, transforms → mesh arrays (plain data)
src/scene              catalogue list and demonstration assemblies (plain data)
src/viewer             three.js browser viewer (rendering only)
tests                  vitest rule/geometry/audit tests
tools/screenshot.mjs   Playwright verification
```

The same `PartSpec` + transform data drives the 3D view and (stage 6) the ground-truth export.
