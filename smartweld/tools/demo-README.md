# SmartWeld AI — demonstration plant

A complete, generated demonstration process facility: an 80 ft × 200 ft building with structural
steel, a pipe rack, platforms and access steel, 17 pieces of equipment, 203 pipe lines in 8 line
classes, and 25 shutdown work orders. Imperial units throughout (inches unless stated).
Every item is SmartWeld's own design (see `docs/PROVENANCE.md`); `MANIFEST.json` lists every file
with its size and SHA-256.

> **Welding, NDE and test content is DEMONSTRATION ONLY — NOT A QUALIFIED PROCEDURE. The facility
> owner's qualified procedures and the applicable codes govern.**

## Folders

| Folder | What it holds |
|---|---|
| `viewer/` | The 3D viewer, built as a static website with its own copy of the data. |
| `data/plant-piping.json` | The plant piping model: every line, component (part key + 4×4 transform), weld and support. |
| `data/groundtruth/` | Ground truth for AI training, one record per item (below). |
| `data/isometrics/` | One generated isometric per line (`ISO-<line>.svg`, 203 drawings). |
| `data/isometrics-imported/` | The owner's isometric drawings matched to the model: one PDF per drawing (`ISO-*.pdf`, 139 drawings on 240 sheets covering all 203 lines), `index.json`, `match.json`, `report.md`, `RECEIPT.json` (below). |
| `data/workorders/` | 25 shutdown work orders: `index.json`, `WO-*.json` (data), `WO-*.html` (printable pack), `pdf/WO-*.pdf`. |
| `docs/` | Design basis (every rule and its reason), provenance log, IP review package, third-party notices, project README. |
| `screenshots/` | Renders of every stage (`stage1` … `stage7`). |
| `source/` | The full project source: rules, generators, viewer, tests (`npm install`, `npm test`, `npm run dev`). |

## Running the viewer

Upload `viewer/` to any static web host (or run `python3 -m http.server` inside it) and open
`index.html` through the server. Opening the file directly from disk will not load the data,
because browsers block data requests from `file://` pages. Useful pages:

- `#piping:line-classes` — the plant coloured by line class (tick boxes show or hide classes)
- `#wo:WO-400-05` — a work order: affected items in orange, isolations in blue, ITP sign-off
- `#piping:piping-pumps;equip=P-101A` — equipment metadata
- Click any pipe, fitting, flange, valve, weld, support or equipment for its metadata; double-click to walk.

## Ground truth (`data/groundtruth/`)

| File | Content |
|---|---|
| `index.json` | Every line: number, line class, fluid, service, size, pressure class, design pressure, insulation, from/to, counts, file name. |
| `lines/<line>.json` | Per line: `header`; `items` (tag, line, lineClass, kind, itemNo, description, designation, part key, size, class, material, end types, cut length, weight, spool, end points, centre, axis, rules); `welds` (tag, size, joins, shop/field, spools, location); `supports`; `spools`; `bom`; `nodes` (isometric centreline from start to end); `totals`. |
| `line-classes.json` | The 8 SmartWeld line classes (fluid group + pressure class) and what each specifies. |
| `equipment.json` | 17 pieces of equipment: type, area, dimensions with their basis, material, empty weight, origin, nozzles with the line connected at each. |
| `nozzles.json` | Equipment nozzle necks (pipe and weld-neck flange) as items. |
| `bom.csv` | Plant-wide bill of materials by line and item number. |

Plant coordinates: East = model +x, North = model −z, Elevation = 100'-0" + model y (the floor is
EL 100'-0"); all values in inches. Line numbers read `{size}"-{pressure class}-{service}-{sequence}`.

## Work orders (`data/workorders/`)

Each `WO-*.json` holds: number, title, area, task type, priority, reason, scope, **primary asset**
and **asset list** (every object worked on, by tag, with location — each exists in the 3D model),
isolation list (valves locked, blinds), permits, parts, new welds (each tied to the weld it
replaces), welding specification, NDE, inspections and thickness locations, test, bolt-up preloads,
and the ITP (each activity with hold/witness/review/surveillance points per party and empty
sign-off fields for completion capture).

Areas: A100 tank farm, A200 vessels and column, A300 exchangers and drum, A400 pumps, A500 pipe rack.

## Owner's isometric drawings (`data/isometrics-imported/`)

The owner's drawings were received as three PDF parts and recorded with their SHA-256 (`RECEIPT.json`).
Each drawing's sheets were copied unchanged into `ISO-*.pdf`, then read and matched to the model:

| File | Content |
|---|---|
| `index.json` | For every model line, the drawing that shows it (small vents, drains and instrument taps are drawn on their parent line's sheets); for every weld, its label (W-number) and sheet on the drawing; for every drawing, its findings. |
| `match.json` | Everything read from every sheet: title block, bill of materials, weld labels, continuation points (CONT'D ON / FROM with E, N, EL), end labels. |
| `report.md` | The match report, drawing by drawing. |

All 203 lines are covered. Every sheet's bill of materials and pipe length, and every sheet break, agree
with the model. The findings are drafting points: negative coordinates printed with the minus on the
feet only ("-12'-6"" for −11'-6"), weld dots without a number, repeated labels, a few labels on the
neighbouring sheet, and missing FROM/TO labels. Branch welds are numbered on from the parent line's
welds, as on the drawings (for example, on ISO-P-1002, W11 and W12 are the welds of its two
instrument taps). In the viewer, a line or a clicked item links to its drawing. Each work order lists
its lines' drawings, and gives each new weld's place on them ("ISO-P-1019 sh 2 W12").
