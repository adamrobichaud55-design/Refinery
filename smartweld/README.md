# SmartWeld 3D Catalogue and Plant Generator

Clean-room build. Read `DESIGN_BASIS.md` (every rule with its reason) and `PROVENANCE.md`
(the audit log) first. `IP_REVIEW.md` is the package for IP counsel; `THIRD_PARTY_NOTICES.md`
must accompany any distribution of the viewer. No published dimension tables, standards or catalogues were used.

## Stage status

| Stage | Scope                                                   | Status  |
|-------|---------------------------------------------------------|---------|
| 1     | Structural sections, plates, connection hardware, welds | done    |
| 2     | Building shell (frame, cold-formed framing, cladding, roof, doors) | done |
| 3     | Interior: equipment, pipe rack, platforms, access steel  | done (SmartWeld rules only; no regulation cited, by user decision) |
| 4     | Pipe, flanges and 16 valve types, all sizes and classes offered (SW-VLV-11) | done |
| 5     | Piping and routing: 203 lines with fittings, valves, welds and supports; all §40 checks pass | done |
| 6     | Line classes (8) and ground-truth export: per-item metadata, spools, isometric data, BOM (`public/groundtruth/`) | done |

## Run

```
npm install
npm test          # rule and geometry tests (vitest)
npm run typecheck
npm run dev       # viewer at http://127.0.0.1:5173/
npm run screenshot -- screenshots/stageN  # headless-browser verification
npm run gen:piping # regenerate public/plant-piping.json (about a minute) after any stage-5 change
npm run export:gt  # regenerate public/groundtruth/ from the plant piping (about a minute)
```

Type any designation into the viewer (e.g. `W18x50`, `C12x20.7`, `L5x3x3/8`, `HSS8x6x3/8`,
`HSS10x1/2`, `PL3/4x10x14`, `B7/8x3`, `FW5/16`, `GW3/4`). Use the valve configurator (type, size, class) to build any
of the 16 valve types in any offered size and class; the "Section view" checkbox cuts any part on
its stem plane.

## Layout

```
DESIGN_BASIS.md        rules and reasons (the only source of rule numbers)
PROVENANCE.md          audit log, libraries and licences
src/core               units, dimension basis tags, physical constants
src/catalogue          designation parser and part rules → PartSpec (plain data)
src/geometry           profiles, extrusion, transforms → mesh arrays (plain data)
src/scene              catalogue list and demonstration assemblies (plain data)
src/generator          building shell, interior, nozzles, line list, router and piping generators → placed parts
                       and per-line records (plain data); pipingCheck.ts audits the piping against §40
public/plant-piping.json  the generated plant piping (committed; a test checks it is current)
src/viewer             three.js browser viewer (rendering only)
tests                  vitest rule/geometry/audit tests
tools/screenshot.mjs   Playwright verification
tools/gen-piping.ts    runs the piping generator and the §40 checks; writes the plant data
```

The same `PartSpec` + transform data drives the 3D view and (stage 6) the ground-truth export.

## Viewer

The building views render the generated plant; click the 3D view to walk (W A S D, mouse look,
Shift to run, Esc to release). The right panel lists the values derived by rule and the bill of
materials computed from the same placed-part list that the 3D view draws.

The "Plant piping" views add the stage-5 piping. The line inspector (right panel) lists any line's
components, its welds (with shop/field status and the two parts each joins) and its supports, and
highlights the line in the 3D view. In these whole-plant views valves are faceted more coarsely with
distance and tees are drawn as plain run and branch pipes; dimensions are unchanged (PROVENANCE P-47).

Stage 6 ground truth: `public/groundtruth/index.json` lists every line (class, service, size, from/to,
counts); `lines/<line>.json` holds each line's header, items with full metadata, welds, supports,
spools, bill of materials and isometric nodes in plant coordinates (E, N, EL with EL 100'-0" at the
floor); `line-classes.json` defines the 8 SmartWeld line classes; `bom.csv` is the plant-wide bill of
materials. In the viewer, "Piping — by line class" colours each class (tick boxes show or hide them),
and clicking any item shows its metadata.
