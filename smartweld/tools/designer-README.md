# SmartWeld demonstration plant — model for piping isometrics

**Confidential.** This package is SmartWeld's own work, provided to you under your agreement with
SmartWeld. Do not share it or use it for anything other than that agreement.

This package holds a complete process-plant piping model in a neutral format. It's for import into your
piping design software, so that you can produce isometric drawings of its lines in your software's
own format.

- **Full plant:** {{FULL}}.
- **Pilot (folder `pilot/`):** {{PILOT}}.

**Please start with the pilot.** Set up your import mapping and spec on those three lines, send us their
drawings, and once we've confirmed them, run the full plant.

## What we ask of you

1. **Convert this export into your software's piping exchange format, and import it.** The files give
   every component's type, end points, centre and branch points, sizes, classes, end types and
   materials. That is what an isometric needs.
2. **Build the spec from `spec-request.csv`.** It lists every part used, per line class, with its
   dimensions. Please model the parts with these dimensions, not your stock catalogue's, so that the
   drawings match our model.
3. **Keep our tag on every component** (the `tag` column, e.g. `6"-P150-P-1001/A2`) as an attribute or
   item code, if your software allows. If your drawings can show or carry it, even better.
4. **Return with the drawings:**
   - the drawings as vector PDFs (not scans), one file per line or per set;
   - your bill of materials as a CSV report;
   - the name and version of the software that produced them.
5. **Tell us early** if any part can't be modelled to the given dimensions, or any line won't import.

## Files

| File | One row per | Purpose |
|---|---|---|
| `lines.csv` | pipe line | Line number, line class, fluid, service, size, pressure class, design pressure, insulation, from, to, the line it taps into (`tapsLine`, at its start or end), counts |
| `components.csv` | component | Every pipe piece, fitting, flange, blind, gasket, stud set and valve of every line, plus the equipment nozzle necks and flanges the lines connect to |
| `welds.csv` | butt weld | The two components each weld joins, shop or field, size, position |
| `supports.csv` | support | Type, designation, position |
| `equipment-nozzles.csv` | equipment nozzle | Equipment, nozzle, size, class, the line connected, the face position and the direction it faces |
| `spec-request.csv` | distinct part per line class | What your spec must contain: part code, description, sizes, class, ends, material, count in the plant, unit weight, every dimension |
| `model.json` | — | All of the above in one file |
| `MANIFEST.txt` | file | SHA-256 of every file |

## Coordinates and units

- **Plant coordinates:**
  - `E` points east and `N` points north.
  - `EL` is the elevation; the ground floor is at EL 1200 in (100'-0").
- **Units:** every position is given in inches (`_in`, to 1/10 000 in) and in millimetres (`_mm`).
  Lengths and sizes are in inches, and weights in pounds.
- **Sizes** are nominal pipe sizes in inches (`sizeIn`). A tee or reducer's second size is `branchSizeIn`.

## Components (`components.csv`)

| Field | Meaning |
|---|---|
| `line`, `tag`, `seq` | The line, our unique tag, and the order along the line from its start. |
| `type` | `pipe`, `elbow`, `tee`, `reducer`, `cap`, `flange` (weld neck), `blind`, `gasket`, `studs` (one stud set per flanged joint) or `valve`. |
| `partCode` | Our part code, for example `VLV\|GATE\|6\|P150` (valve type, size, class) or `EL\|6\|P150` (elbow). It's the key to the matching row of `spec-request.csv`. |
| `description` | Our description, for example `VALVE, GATE, WEDGE, OS&Y 6" P150`. |
| `ends` | The end types: `BW` butt weld, `RF` raised-face flange. `BW×BW` is a fitting welded at both ends; `RF×RF` is a flanged valve. |
| `end1…`, `end2…` | The two connection points. For a valve, flange, gasket or blind they are its two faces; for pipe and fittings, the weld ends. |
| `centre…` | Elbows: the corner (work point) where the two legs' centrelines meet. Tees: the centre of the run. Angle valves (the relief valves): the body's corner, where the inlet and outlet centrelines meet; their `end1` is the inlet face and `end2` the outlet face. |
| `branch…`, `branchLine` | Tees: the branch's connection point, and the line that starts there. |
| `cutLengthIn` | Pipe pieces: the cut length. |
| `spool` | Our spool number; `loose` means a bolted part, not part of a spool. |

**How components connect:**
- Components connect where their end points coincide (within 1/32 in).
- A branch line starts (or, for a line that runs into a header, ends) at a tee's branch point on the line named in `tapsLine` of `lines.csv`.
- `welds.csv` also lists the two components every butt weld joins.
- At a flanged joint, the order is: flange face, gasket, valve (or other flange) face. The joint's stud
  set is listed as its own component at the same place.
- Line ends at equipment meet the nozzle flanges listed with the components (lines named
  `<equipment> nozzle <id>`); `equipment-nozzles.csv` gives each nozzle's face and direction.
  Each nozzle neck's inner end is at the equipment shell, so it meets no other component.
- **Ends that meet nothing are intended:** blind faces, caps, the hose-station ends and the nozzle necks'
  inner ends. Every other end meets another component.

## Welds (`welds.csv`) and supports (`supports.csv`)

- **Welds:** each has a unique `tag` (for example `6"-P150-P-1001/W12`) and its number on its own
  line, `label` (`W12`). `joins1` and `joins2` are the tags of the two components it joins.
- **Supports:** each sits at the given position on the line. `type` is hanger, shoe, guide,
  trunnion, anchor, stanchion or trapeze, and `designation` gives its size.

## Spec request (`spec-request.csv`)

- One row per distinct part in each line class (pipe by size and class). Each row has the count used in
  the plant and the part's dimensions, written `label=value unit (rule)`.
- The rule codes refer to SmartWeld's design basis. They aren't needed for modelling; they only say
  which rule set each dimension.
- Line classes are SmartWeld's own:
  - the letter is the fluid group: C condensate, F flare, G air and gases, H hydrocarbon, S steam,
    W water;
  - the number is the pressure class.
- Please create a spec per line class with these parts, and tell us if any dimension can't be
  represented.

## Questions

Send any question about the data to SmartWeld. Every field comes from SmartWeld's model, and nothing
in this package was taken from any outside source.
