# Plant 3, the coastal refinery: where the work stands and how to carry it on

Written 2026-11-25 for whoever takes this up next, person or assistant. It says what is done,
what is open, what has been tried, and how to work on it. The rules of the work are in
`DESIGN_BASIS.md` (§75 to §80 for plant 3) and the audit log is `PROVENANCE.md` (P-79 to P-91).
Read the standing rules below before changing anything.

## Standing rules (the owner's, unchanged)

- Clean room. Nothing is looked up: no standards documents, no published dimension or property
  tables, no numbers recalled from such tables, no manufacturer or brand names, no other party's
  design. Geometry rules are written here with their reasoning. The one stated exception, for
  plant 3 only, is the code layer of §76 and general process-engineering knowledge, every such
  item marked recalled and for the owner to verify.
- `DESIGN_BASIS.md` first: no rule is used in code before it is written there with its reason.
- `PROVENANCE.md` is the audit log: one entry per piece of work, what was done and from what.
- True scale. Nothing is thickened or enlarged for looks.
- Permissive licences only. No GPL or other copyleft anywhere in the process.
- The generator of plants 1 and 2 is used unchanged. Nothing under `src/generator/`,
  `src/exchange/` or `public/plants/` may change. Plant 3 is not in `PLANTS`. Catalogue files may
  gain optional inputs only, their default output unchanged.
- No instrumentation.
- Never skip or weaken a test to get it to pass. Report what fails.
- No model identifier in anything pushed to the repository other than the commit trailer the
  session requires.

## Done

- Nine process units (11 to 19) with their equipment on their plots; site, terrain, roads,
  tank farm and jetty as placed bodies; process model, sizing, registry (code layer, §76).
- Piping through the unchanged generator, each unit in its own frame, one run per rack line:
  - units 11, 12, 13, 14, 15, 16, 18, 19: 775 of 775 lines routed, every check of continuity,
    joints, elbows, valves and clearances at zero; unsupported spans listed.
  - unit 17 (cracking): 222 of 222 lines routed; **not clean**, see below.
- The main pipeway joining the units, with the plant's nine utility headers on its top tier.
  Re-run with unit 17 joined: 143 of 145 lines routed; **not clean**, see below.

## Open items, in the order to take them

### 1. Unit 17: the spare stripper feed pump's suction valve

Report: `10"-P300-P-17325: a valve at P-1711B-S strikes line 10"-P300-P-17067 in every stem
direction`, and with it one line clearance, `17325/B9 – 17326/A10: 0.00 in`.

Facts. Pumps P-1711A and B stand at x 540 and 618 (78 in apart), suction nozzles 8 in facing the
rack at y 24, the suction line 10 in. Each suction carries a 10 in gate valve (reach 48 in). The
spare's discharge stack (check valve, 6 in gate) stands 40 in from its suction valve.

Tried. The four lines of the two pumps routed by themselves in the whole plant
(`tools/refinery-diag/few-lines.ts`, `LINES=17067,17325,17068,17326`) give no failure. In the
unit's last run (the "rest" run) the clash appears. So it depends on the order the stacks are
planned in that run and on what already stands there, not on the geometry alone.

Next to try. (a) Give the pump pair its own run before the last one, as the `chase` runs are
made, and see which stem directions are then free. (b) If the pitch of the pair is the cause,
a rule in SW-CELL-3 that a pump and its spare stand apart by their suction valve's reach where
the suction line is larger than the pump's nozzle. Check with the plan digest (below) that the
other eight units do not change.

### 2. Unit 17: a steam valve 2.7 in from the cooling water header

Report: three line clearances of 2.70 in between the 20 in cooling water supply header (z 72)
and the 8 in class P1200 globe valves on the take-offs of the high-pressure steam header (z 24):
`17517/A3` and `17503/B3`.

Facts. The valve stands on a vertical take-off above its header; the generator turned its stem
toward +z, toward the 20 in header. Toward −z and along the header the way is free. The
generator takes the first stem direction that strikes nothing; it does not look for 3 in.

Next to try. A second pass in `pipingReport.ts`, plant 3's own, as SW-RPI-13 to -15 are: where
the clearance check finds a take-off valve nearer than 3 in to a header, lay a strip 3 in thick
beside that header there and run the last run again, so the generator finds that direction
struck and takes another. It acts only where there is a finding, so the eight clean units are
not touched. Write the rule first.

### 3. Main pipeway: the lean amine line to unit 17

Report: `6"-P600-P-10034: no rack lane with clear drops:` with nothing after the colon, and
`6"-P600-P-10122: no tap position on 6"-P600-P-10034` (its branch from unit 18, which fails
only because its parent does).

Facts. The line runs from unit 16's spool (x 6924, +z side) to unit 17's (x 9462, −z side), in
the lane given it on the lowest tier at z 90, y 252. An empty reason means the generator's lane
test failed before any route was tried: something static stands within the pipe's radius and
3 in of the lane's centre line between the two ends.

Ruled out. The 4 in line 10012, whose riser at unit 18's limit stands 6 in from the lane, is
routed after this line, not before. Holding kept lanes 6 in wider (SW-PWY-6, amended) changed
nothing.

Next to try. Replay the generator's lane test on the pipeway's grid, as
`tools/refinery-diag/lane-test.ts` does for a unit (it would need the pipeway's plan in place of
`unitPiping`; `pipeway()` in `src/refinery/pipeway.ts` returns `runs`, `lines`, `nozzles` and a
`runPlant` of the same shape). Suspects: the junction frame or first bent of unit 17 or of
unit 18, which the lane passes; the fence's slot, if the lane's width in the plan is narrower
than the pipe the generator lays (the unit plan had exactly this fault with its columns, see
SW-RPI-7 "Lane").

### 4. Main pipeway: two unsupported spans at unit 17's limit

Report: `10617` and `10618`, span 219 in against 180 in, from (9528, 360, 55).

These are 3 in branches from the utility headers to unit 17 on the top tier. The supports at a
unit's first bent are set by `supportsAtFirstBents` in `src/refinery/pipewayReport.ts`
(SW-PWY-8). Look first at whether unit 17's first bent is found (its rack is wider, half-width
180) and whether the post rule (10 to 48 in over the top-tier beam) applies there.

### 5. The test suite on this state: 895 of 904 pass

Run on the commit before this note. The nine that fail, none altered to pass:

| Test | Why |
|---|---|
| `refinery-piping.test.ts`: every line routed, every check at zero | unit 17, items 1 and 2 |
| `refinery-export.test.ts` (three tests) | unit 17 has no export files, see "The exports" |
| `refinery-pipeway.test.ts`: every line routed, checks and spans at zero | items 3 and 4 |
| `refinery-pipeway.test.ts`: each rack line lies in its lane | `10034` is not routed, item 3 |
| `refinery-pipeway.test.ts`: at every spool the line's flange meets the face | the same unrouted line has no components |
| `refinery-pipeway.test.ts`: the utility headers ... a branch to every party (line 176, `NPS` of undefined) | **not looked into yet.** It reads a header or spool of unit 17 that it does not find; either the test's lookup or unit 17's header spools on the main rack. Look before item 4, it may be the same cause. |
| `refinery-pipeway.test.ts`: each header in its lane, each branch comes down beside the band (line 268, 390 not below 378) | **not looked into yet.** A branch stands 12 in higher than the test allows; unit 17's rack is 30 ft wide, the others 24 ft. May be a true fault of a branch to unit 17 or a bound written for the narrower racks. |

### The exports

`tools/refinery-export.ts` refuses a model with a line that is not routed or a failure reported,
and rightly. So unit 17 has no ground truth or piping component files yet, and the main
pipeway's files under `public/refinery/units/` are those of the run before unit 17 joined (169
lines), not of the model now on disk (145 lines). Both are written once items 1 to 4 are done.

### After these

Run the unit and the pipeway again, then `tools/refinery-piping-register.ts`,
`tools/refinery-export.ts`, `tools/refinery-model.ts`, and the full test suite. The test
"every line is routed, and the generator's own checks ... are at zero" in
`tests/refinery-piping.test.ts` fails for unit 17 until items 1 and 2 are done; it must not be
changed to pass.

Later stages, not started: the cooling tower's plot and the cooling water mains (where the two
30 in mains run is a question put to the owner: buried along the corridor with a riser at each
unit is recommended); tank farm, jetty, flare and relief piping; offsite pipeways; expansion
loops on the hot headers; supports for the units' listed spans; a viewer entry for the pipeway.

## How to work on it

Everything runs from `smartweld/` with `npx vite-node <tool>`.

| Tool | What it does | Time |
|---|---|---|
| `tools/refinery-piping.ts 17` | routes unit 17, writes its model, report, images, `docs/REFINERY-PIPING.md` | about 30 min |
| `tools/refinery-pipeway.ts` | routes the main pipeway, writes its model, report, images, document | about 28 min |
| `tools/refinery-piping-register.ts`, `refinery-export.ts`, `refinery-process.ts`, `refinery-registry.ts`, `refinery-model.ts` | registers, exports, process and registry files, plant views | minutes each |
| `npx vitest run` | the whole suite | about 25 min |

Set `REFINERY_TRACE=<file>` on either routing tool to see which line it is on. A line that
stays for several minutes has failed its first attempt and is being tried again.

Diagnostics, `tools/refinery-diag/` (read-only; they keep single runs in the folder named by
`REFINERY_DIAG`, `/tmp/refinery-diag` if unset; empty that folder whenever the plan changes):

| Script | Use |
|---|---|
| `plan-digest.ts` | `ROOT=<smartweld dir> OUT=<dir>`: a hash of each routed unit's cell and piping plan. Run it on a checkout of commit `b437c6f` and on the working tree; the eight units 11, 12, 13, 14, 15, 16, 18, 19 must come out the same after every change. This is the guard that their routed models still stand. |
| `runs.ts` | the unit's runs in order, with each rack line's tier and lane |
| `one-run.ts` | `RUN=<index>`: routes that run alone on top of the kept earlier ones and prints its failure or its route. `CLOSE=1` or `WHOLE=1` for the other grids. |
| `probe-path.ts` | `RUN= R=<pipe radius> PATHS="x,y,z;x,y,z|..."`: what bars a path you propose, by the generator's own static data |
| `lane-test.ts` | `RUN=` or `LINE=`, `R= Y= Z= X0= X1=`: the generator's own lane test replayed on its grid, naming the cell that bars each point |
| `cell-marks.ts` | `RUN= AT=x,y,z`: which members and solids mark a grid cell |
| `line-ends.ts` | `LINES=17024,17307`: a line's ends, service, run and lane |
| `plot.ts`, `audit-ends.ts`, `stations.ts` | the unit's plot; bodies standing between a rack line's end and the rack; control stations and how far each stands from its item |
| `few-lines.ts` | `LINES=...`: a few lines routed by themselves in the unit's whole plant |

## What was learned about the generator (it cannot be changed)

- A process line (`P`) whose ends are more than 240 in apart along the rack runs in a lane; it
  measures from the first point beyond each end's valve stack, not from the nozzle. Any other
  service letter is routed free. `V` is used for the five lines that must not run the rack.
- Its search gives up after 2,500,000 states. A way with five turns over a long drop is beyond
  it even when the way is clear. Fewer turns is the cure, not more room: put the connection, the
  station or the lane where the line needs no step aside.
- Between two elbows it keeps two elbow radii and 2 in, rounded up to 6 in: 42 in for a 12 in
  line, 48 in for 14 in. Under a tier there are 36 in, so a line of 12 in or more enters the
  lowest tier from below or the top tier from above, straight at its own station.
- It holds a member as the grid cells near its axis and a box as the cells within 3 in; the
  clearance it keeps is measured to those cells. A pipe can be barred by a cell that the true
  surface is well clear of. `lane-test.ts` shows which.
- The 2 ft above each tier is closed to a line except within 6 ft, in plan, of its own ends.
- It stands a valve stack at every nozzle while it routes, even where SW-RPI-14 removes the
  valve afterwards.
- It picks a valve's stem direction by what it strikes, not by 3 in of clearance.
- Each run sees the earlier runs as solid boxes. A fix for one line can move another: check the
  whole unit again after every change, and the other eight units with the digest.
