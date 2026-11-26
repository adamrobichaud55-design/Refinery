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
| R     | Plant 3, the coastal refinery (in progress; `src/refinery/`, DESIGN_BASIS §74–§79): an invented 60,000 barrel-a-day refinery on an invented coastal site, about ten times plant 2. Done so far: the basis of design; the process model: material balance, the flowsheets of sixteen units (374 equipment items, 617 process lines), every stream between units, and sizes for duty (`docs/REFINERY-PROCESS.md`, `public/refinery/process/`); the site: an invented coast as a formula, benches and roads graded into it, and the plot plan checked against its spacings (`docs/REFINERY-PLOT.md`, `screenshots/refinery/`). the equipment of the nine process units, the tanks, spheres and flare as catalogue bodies at their sized dimensions, each unit arranged about its rack and set on its plot (`screenshots/refinery/unit-*.png`, `plant-*.png`); the code layer, first part: a record for each of 205 pressure vessels and boilers whose wall is the wall its body is drawn with, the fluid service, line class and severity of each of 742 lines, and invented registration numbers, with printable records (`docs/REFINERY-REGISTRY.md`, `public/refinery/registry/`; code names and categories recalled and flagged for the owner to verify, numbers invented, no form reproduced). units piped through the unchanged generator of plants 1 and 2: crude distillation, vacuum distillation, naphtha hydrotreater, catalytic reformer, kerosene hydrotreater, diesel hydrotreater, sulfur recovery, amine and sour water, utilities (units 11, 12, 13, 14, 15, 16, 18, 19), 775 lines all routed, about 24,500 components, 12,800 welds and 68,000 ft of pipe, each line that runs the rack in a lane given it beforehand on one of the rack's three tiers, each battery limit spool on its line's lane, control stations at grade under the rack, reboilers beside their columns, the vacuum unit's ejector set sized stage by stage and standing on a steel deck of its own a tail pipe's height above its hotwell, the column's overhead falling straight onto its first ejector, no valve built where a plant has none (a heater's transfer line, a column's overhead, an ejector set's drains: SW-RPI-14, 45 ends in all), the checks of continuity, joints and clearances at zero and the unsupported spans listed (`docs/REFINERY-PIPING.md`, `public/refinery/piping/`); the code layer, second part: for each piped unit a record for every generated line and every component of it, pipe under its line's piping system number and each fitting, flange and valve under a fitting number (`docs/REFINERY-PIPING-REGISTER.md`, `public/refinery/registry/piping/`; demonstration data as the first part); each piped unit's ground truth and piping component files by the exporters of plants 1 and 2 (`public/refinery/units/`), and the viewer offers each as a plant. The units stand close along a main pipeway and are joined by it (owner's instruction of 2026-11-24, `DESIGN_BASIS.md` §80): a rack 1160 ft long and 30 ft wide down the corridor between the two rows, and on it a line for every stream between units that has a party on the process bench, from one unit's battery-limit spool to the other's, and on its top tier the plant's 9 utility headers (steam at three pressures, condensate, boiler feed water, fuel gas, and the air, water and caustic the cracker takes), each joined by a branch from its top to the header of every unit that takes or makes it, which runs through a block valve at that unit's limit (SW-PRC-19, SW-RPI-15, SW-PWY-11, SW-PWY-12), by the same unchanged generator: 169 lines (45 streams' lines, 9 headers, 65 branches, 50 valves with blinds at limit spools), all routed, 38,320 ft of pipe, hung from a junction frame at each unit's limit and from the rack's struts and stringers where they cross to the rack, the checks of continuity, joints and clearances at zero, and no span longer than its line carries (`docs/REFINERY-PIPEWAY.md`, `public/refinery/piping/pipeway.json`); every unit line that meets a stream at its limit is of that stream's pressure class, so that the flanges there bolt together (SW-PRC-2, SW-RPI-9). **2026-11-25 (PROVENANCE P-91):** the cracking unit (unit 17) is piped too, on a plot laid out again so that the back of its gas plant stands across the rack from the converter: 222 of 222 lines routed, every check of continuity, joints, elbows, valves and clearances at zero; the main pipeway, piped again with it joined, 145 of 145 lines, 38,346 ft of pipe, every check at zero. All nine units are piped: 997 lines, each one routed. Supports were then added where the generator's stepping along a run had stopped (SW-RPI-17, P-92): 441 hangers, stanchions and support posts, and 92 pipe frames (two posts and a beam across under a pipe, P-93); 26 spans, over air coolers, inside full rack tiers or among equipment, are still listed. The figures for the eight units in the sentences above are unchanged by it. **2026-11-26 (P-94):** the cooling water mains: two 30 in mains on sleepers at grade along the corridor's north strip, from the cooling tower plot's edge, with a branch to every unit's cooling water header spool, 22 of 22 lines routed, every check at zero against everything built (`docs/REFINERY-COOLING-WATER.md`); the main pipeway routed again with those spools in view (three of its branches had lain against them), 145 of 145, every check at zero. To come: the flare and relief system (next), the cooling tower plot's own piping, supports for the spans still listed, the pipeways beyond the process bench and the tank farm, the offsite units' equipment, relief valves, vents and drains, expansion loops on the hot lines. A demonstration, not a process design; not in the plant list, and plants 1 and 2 are untouched | in progress |

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
npx vite-node tools/gen-plant.ts P2 public/plants/P2/plant-piping.json   # regenerate plant 2 (about 13 min)
npx vite-node tools/export-gt.ts P2              # plant 2 ground truth (public/plants/P2/groundtruth/)
npx vite-node tools/coverage.ts public/plants/P2/plant-piping.json       # symbol coverage against the SW-COV-2 floor
npx vite-node tools/export-pcf.ts P1|P2           # one PCF per line from the ground truth (public/.../pcf/, SW-PCF-1..4; tools/pcf-mapping.md)
npx vite-node tools/catalogue-doc.ts              # the civil and equipment catalogues as documents (docs/CATALOGUE-*.md)
npx vite-node tools/render-views.ts screenshots cat10   # catalogue images in the photo style (cat10 civil and equipment, cat11 piping, entry- structural, valve-)
npx vite-node tools/pcf-check.ts P1|P2            # the owner's eighteen zero-checks on the ground truth and PCF files (SW-LL-8, SW-GT-7, SW-PCF-*, SW-PEN-1)
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
src/catalogue          designation parser and part rules → PartSpec (plain data); parts/civil.ts the civil and concrete
                       catalogue (§65), parts/equipment.ts, parts/equipmentKit.ts and parts/processUnits.ts the equipment catalogue (§25, §66, §69);
                       parts/pipingSpecials.ts the piping specials (§70), catalogue items only;
                       parts/processEquipment.ts further process equipment (§72), catalogue items only;
                       parts/civil2.ts further civil items (§73), catalogue items only
src/scene/structures.ts  structural assemblies for the catalogue (§71): racks, bridges, platforms, stairs, ladders, supports
src/refinery           plant 3, the coastal refinery (§74–§79): balance.ts, flowsheet.ts and units/ the process;
                       process.ts the streams between units; sizing.ts sizes for duty; report.ts the document
                       terrain.ts the ground; site.ts the plot plan; siteChecks.ts its spacings
docs/REFINERY-PROCESS.md  plant 3's process as a document (tools/refinery-process.ts); data in public/refinery/process/
                       cell.ts a unit's equipment about its rack; assemble.ts the units on the site (tools/refinery-model.ts)
docs/REFINERY-PLOT.md  plant 3's site and plot plan (tools/refinery-site.ts); data in public/refinery/site/
                       registry.ts the code layer (§76): pressure equipment and line records, registration numbers;
                       registryReport.ts and registryPdf.ts its document and printable records
                       unitPiping.ts a unit as a plant for the piping generator (§79); pipingReport.ts runs and checks it
docs/REFINERY-HANDOFF.md  plant 3: how to carry the work on, its tools (tools/refinery-diag/), what was learned of the generator
docs/REFINERY-PIPING.md  plant 3's piped units with their checks (tools/refinery-piping.ts); models in public/refinery/piping/
docs/REFINERY-PIPEWAY.md  plant 3's main pipeway with its checks (tools/refinery-pipeway.ts); model in public/refinery/piping/pipeway.json
                       pipingRegister.ts the piping register of a piped unit (§76, SW-REG-9)
docs/REFINERY-PIPING-REGISTER.md  plant 3's piping registers (tools/refinery-piping-register.ts); data in public/refinery/registry/piping/
public/refinery/units/  each piped unit's ground truth and piping component files (tools/refinery-export.ts)
docs/REFINERY-REGISTRY.md  plant 3's pressure equipment and piping records (tools/refinery-registry.ts); data and
                       printable records in public/refinery/registry/ (demonstration data)
docs/CATALOGUE-*.md    the civil and equipment catalogues as documents (tools/catalogue-doc.ts)
src/geometry           profiles, extrusion, transforms → mesh arrays (plain data)
src/scene              catalogue list and demonstration assemblies (plain data)
src/generator          building shell, interior, nozzles, line list, router and piping generators → placed parts
                       and per-line records (plain data); pipingCheck.ts audits the piping against §40
public/plant-piping.json  the generated plant piping (committed; a test checks it is current)
src/viewer             three.js browser viewer (rendering only)
tests                  vitest rule/geometry/audit tests
src/pdf                SmartWeld's own PDF writer: font subsetting, layout, the work-order packs (SW-PDF-*)
src/render             SmartWeld's own renderer: 3D views, page previews, contact sheets, PNG (SW-REN-*)
                       photo.ts: the photo style (finishes, shadows, occlusion, sky reflection, ground, cutaways; §67)
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
