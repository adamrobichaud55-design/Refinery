# SmartWeld 3D Catalogue and Plant Generator

Clean-room build. Read `DESIGN_BASIS.md` (every rule with its reason) and `PROVENANCE.md`
(the audit log) first. No GPL or other copyleft code, tool or font is used anywhere in the process
(`DESIGN_BASIS.md` §0.1, SW-LIC-1..5). `IP_REVIEW.md` is the package for IP counsel; `THIRD_PARTY_NOTICES.md`
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
| 7     | Equipment metadata; 25 shutdown work orders with scope, isolations, demo welding specs, NDE, tests and ITPs (`public/workorders/`); the generated isometrics of this stage were withdrawn in stage 8 | done |
| 8     | The owner's isometric drawings (139 drawings, 240 sheets) imported and matched to the model; the project's only isometrics; their sheets are attached to the work-order packs (`public/isometrics-imported/`) | done |
| 9     | Plant 2 (`public/plants/P2/`): the coverage plant with socket-weld and threaded piping, every symbol class of the owner's generator at least 20 times (SW-COV-2), its ground truth, answer key and designer package (`downloads/designer-package-P2.zip`); structural steel erection drawings with weld details for both plants (`downloads/erection-P1.pdf`, `erection-P2.pdf`) | done |

## Run

```
npm install
npm test          # rule and geometry tests (vitest)
npm run typecheck
npm run dev       # viewer at http://127.0.0.1:5173/
npm run render     # review images by SmartWeld's own renderer (screenshots/, INDEX.md; about 30 min)
npm run gen:piping # regenerate public/plant-piping.json (about a minute) after any stage-5 change
npm run export:gt  # regenerate public/groundtruth/ from the plant piping (about a minute)
npm run export:wo  # regenerate public/workorders/, PDFs with the owner's sheets attached (seconds)
python3 -I tools/isomatch.py import <parts.pdf…>  # receive the owner's isometric drawings (stage 8)
python3 -I tools/isomatch.py [--check]            # re-match the committed drawings to the model
python3 -I tools/isomatch.py --selftest           # prove the fix list clears every finding
python3 -I tools/evalscore.py key|receive|clear|score|selftest   # external test drawings (eval/README.md)
npx vite-node tools/designer-package.ts [P2]     # the model for a piping designer (downloads/designer-package.zip, -P2.zip)
npx vite-node tools/gen-plant.ts P2 public/plants/P2/plant-piping.json   # regenerate plant 2 (about 7 min; plant 1 stays byte-identical)
npx vite-node tools/export-gt.ts P2              # plant 2 ground truth (public/plants/P2/groundtruth/)
npx vite-node tools/coverage.ts public/plants/P2/plant-piping.json       # symbol coverage against the SW-COV-2 floor
npx vite-node tools/export-pcf.ts P1|P2           # one PCF per line from the ground truth (public/.../pcf/, SW-PCF-1..4; tools/pcf-mapping.md)
npx vite-node tools/erection.ts P1|P2            # structural steel erection drawings (downloads/erection-P*.pdf, sheet previews)
npx vite-node tools/render-plant.ts P2           # review images of plant 2 (screenshots/stage9/)
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
src/pdf                SmartWeld's own PDF writer: font subsetting, layout, the work-order packs (SW-PDF-*)
src/render             SmartWeld's own renderer: 3D views, page previews, contact sheets, PNG (SW-REN-*)
assets/fonts           DejaVu Sans and its licence (the only font; SW-LIC-3)
tools/render-views.ts  renders the review images in screenshots/
tools/gen-piping.ts    runs the piping generator and the §40 checks; writes the plant data
```

The same `PartSpec` + transform data drives the 3D view and (stage 6) the ground-truth export.

## Viewer

The building views render the generated plant; click the 3D view to walk (W A S D, mouse look,
Shift to run, Esc to release). The right panel lists the values derived by rule and the bill of
materials computed from the same placed-part list that the 3D view draws.

A plant selector in the toolbar switches every view between plant 1 and plant 2 (stage 9); plant 2 adds the
socket-weld and threaded small bore, the outdoor area and the solids receivers.

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

Stage 7 work orders: `public/workorders/index.json` lists the 25 shutdown work orders by area;
each `WO-*.json` holds the scope, affected items, isolation list (valves locked, blinds), parts,
new welds (each tied to the weld it replaces), welding specification, NDE, inspections and
thickness locations, test, bolt-up preloads and the ITP; `WO-*.html` and `pdf/WO-*.pdf` are the
printable packs. The PDF pack ends with a table of where the work is on the owner's drawings and
those drawings' sheets, attached unchanged (SW-IMP-8). Welding, NDE and test content is SmartWeld
demonstration content — not qualified procedures; the facility owner's procedures and codes
govern. In the viewer, open a work order from the left list: its items are highlighted, and the
ITP can be signed off activity by activity (saved in the browser; "Download completion record").

Stage 8 imported drawings: `public/isometrics-imported/` holds the owner's isometric drawings, revision 1:
one PDF per drawing (`ISO-*.pdf`, copied unchanged from the received parts), `RECEIPT.json` (each received
file's SHA-256, the part and page of every sheet, and the superseded revision 0's hashes), `index.json` (the
drawing for each line, each weld's label and sheet, each item's sheet, the findings), `match.json` (everything
read from every sheet) and `report.md`. Revision 1 agrees with the model completely: all 203 lines, every
title block, bill, pipe length, sheet break and weld label (1,265, each once on its own sheet), and every
FROM/TO label — 0 errors, 0 warnings. In the viewer, a line or a clicked item shows its drawing and the
weld's label and sheet; each work order lists its lines' drawings, says where each replaced weld is on them,
and its PDF pack attaches the sheets that hold the work.
`FIXLIST.md` and `fixlist.json` turn every finding into an instruction for the drawings' author
(SW-IMP-7). Fix list FL-1 (in git history) took revision 0 to revision 1; for revision 1 they state that
no change is needed. A new revision is received with `python3 -I tools/isomatch.py import <parts…>`.

External test drawings: isometrics drawn by a third party's software from this model are a test set
only (DESIGN_BASIS.md §57). `eval/README.md` describes the steps: the answer key from the model, a
receipt and two clearances per set, SmartWeld's own detection format, and the scores. The received
drawings and the detections on them are kept in git-ignored folders and are never shipped or used for
training.
