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
  - unit 17 (cracking): 222 of 222 lines routed, every check at zero; unsupported spans listed.
- The main pipeway joining the units, with the plant's nine utility headers on its top tier.
  Re-run with unit 17 joined: 145 of 145 lines routed, every check at zero.

## The cracking unit and the main pipeway: closed 2026-11-25

The four items this file first listed as open are closed, each by a rule written first
(PROVENANCE P-91):

- the spare stripper feed pump's suction valve and the steam take-off valves 2.7 in from the
  cooling water header: the unit's last run made again (SW-RPI-16), the blocking valve's stem
  turned, the striking lines routed first, a strip laid beside the header;
- the lean amine line's lane shut by a hanger rod of an earlier run: the line given the nearest
  free lane, the move reported (SW-RPI-7), and the pipeway's lane test checks the new lane;
- the two unsupported spans and the branch out over the top tier at unit 17's limit: the
  cracker's 14 in header is given to the generator early enough that its spool clears the main
  rack's columns (SW-RPI-5).

From fresh runs: unit 17, 222 of 222 lines, every check at zero but the listed spans; the main
pipeway, 145 of 145, every check at zero. The eight units routed before compare identical to
commit `b437c6f`.

## What is still to do

Later stages, not started: supports for the 94 spans still listed after SW-RPI-17 (each has another line or equipment directly below and no steel above); the cooling tower's plot and the cooling water mains (where the two
30 in mains run is a question put to the owner: buried along the corridor with a riser at each
unit is recommended); tank farm, jetty, flare and relief piping; offsite pipeways; expansion
loops on the hot headers; a viewer entry for the pipeway.

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
