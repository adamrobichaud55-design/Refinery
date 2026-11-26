# Plant 3: the cooling water mains

> **Demonstration data.** Written by `tools/refinery-cooling-water.ts`; do not edit by hand.

The two cooling water mains (DESIGN_BASIS.md §81) lie on 51 concrete sleepers at grade in the corridor's north strip, 234 in north of the main rack's centre line, from the cooling tower plot's south edge to 20 ft east of the rack's west end, with a branch to each unit's cooling water header spool at its limit. Piped by the generator of plants 1 and 2, unchanged; frame: the main pipeway's (SW-PWY-1) moved 234 in north (SW-CWM-1): inches, x east from the rack's west end, y up from the bench, z south from the sleeper way's centre line.

| Lines | Routed | Components | Welds | Supports | Pipe, ft | Failures | Checks not at zero |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 18 | 18 | 283 | 245 | 149 | 3,403 | 0 | none |

## Mains

| Main | Line | Design | Lane, z in | Axis above grade, in |
| --- | --- | --- | --- | --- |
| cooling water supply | 30"-P150-P-27001 | 140 psi, 150 °F | 0 | 30 |
| cooling water return | 30"-P150-P-27002 | 70 psi, 155 °F | -54 | 30 |

## Branches

| Unit | Stream | Spool | Branch | Size, in | Routed |
| --- | --- | --- | --- | --- | --- |
| 17 | cooling water supply | BL-1717 | 20"-P150-P-27101 | 20 | yes |
| 17 | cooling water return | BL-1724 | 20"-P150-P-27102 | 20 | yes |
| 12 | cooling water supply | BL-1210 | 12"-P150-P-27103 | 12 | yes |
| 12 | cooling water return | BL-1211 | 12"-P150-P-27104 | 12 | yes |
| 11 | cooling water return | BL-1116 | 10"-P150-P-27105 | 10 | yes |
| 11 | cooling water supply | BL-1115 | 10"-P150-P-27106 | 10 | yes |
| 14 | cooling water supply | BL-1411 | 8"-P150-P-27107 | 8 | yes |
| 14 | cooling water return | BL-1412 | 8"-P150-P-27108 | 8 | yes |
| 13 | cooling water supply | BL-1310 | 6"-P150-P-27109 | 6 | yes |
| 13 | cooling water return | BL-1311 | 6"-P150-P-27110 | 6 | yes |
| 15 | cooling water supply | BL-1508 | 6"-P150-P-27111 | 6 | yes |
| 15 | cooling water return | BL-1509 | 6"-P150-P-27112 | 6 | yes |
| 16 | cooling water supply | BL-1611 | 6"-P150-P-27113 | 6 | yes |
| 16 | cooling water return | BL-1612 | 6"-P150-P-27114 | 6 | yes |
| 18 | cooling water supply | BL-1809 | 3"-P150-P-27115 | 3 | yes |
| 18 | cooling water return | BL-1810 | 3"-P150-P-27116 | 3 | yes |

## Limit spools

| Spool | Main | Where | Beyond it |
| --- | --- | --- | --- |
| PL-2701 | 30"-P150-P-27001 | the cooling tower plot's south edge | block valve and blind (30"-P150-P-27801) |
| PL-2702 | 30"-P150-P-27001 | the west end of the sleeper way | block valve and blind (30"-P150-P-27802) |
| PL-2703 | 30"-P150-P-27002 | the cooling tower plot's south edge | block valve and blind (30"-P150-P-27803) |
| PL-2704 | 30"-P150-P-27002 | the west end of the sleeper way | block valve and blind (30"-P150-P-27804) |

| Component | Count |
| --- | --- |
| blind | 4 |
| elbow | 65 |
| flange | 20 |
| gasket | 28 |
| olet | 14 |
| pipe | 146 |
| tee | 2 |
| valve | 4 |

| Welds | Count |
| --- | --- |
| BW, field | 38 |
| BW, shop | 193 |
| FW, shop | 14 |

| Supports | Count |
| --- | --- |
| anchor | 2 |
| guide | 8 |
| hanger | 29 |
| shoe | 88 |
| stanchion | 15 |
| trunnion | 7 |

## Checks

| Check (the generator's own, §40, against everything SW-CWM-5 shows as solid) | Found |
| --- | --- |
| continuity | 0 |
| joints | 0 |
| elbows | 0 |
| valves | 0 |
| lineClearance | 0 |
| staticClearance | 0 |
| supports | 0 |

## Notes

- 83 solids not shown to the generator while it routes: the sleepers, the first bents' tier beams of the units and the pieces of the pipeway's and units' lines where the generator's own valve at a unit's spool stands (SW-CWM-5).
- 30"-P150-P-27001: no valve at PL-2701-P; GATE 30 and what stood with it left out, 3 pieces, the pipe 43.0 in longer (SW-PWY-7)
- 30"-P150-P-27001: no valve at PL-2702-P; GATE 30 and what stood with it left out, 3 pieces, the pipe 43.0 in longer (SW-PWY-7)
- 20"-P150-P-27101: no valve at BL-1717-P; GATE 20 and what stood with it left out, 3 pieces, the pipe 30.6 in longer (SW-PWY-7)
- 12"-P150-P-27103: no valve at BL-1210-P; GATE 12 and what stood with it left out, 3 pieces, the pipe 22.6 in longer (SW-PWY-7)
- 10"-P150-P-27106: no valve at BL-1115-P; GATE 10 and what stood with it left out, 3 pieces, the pipe 20.0 in longer (SW-PWY-7)
- 8"-P150-P-27107: no valve at BL-1411-P; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.7 in longer (SW-PWY-7)
- 6"-P150-P-27109: no valve at BL-1310-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-PWY-7)
- 6"-P150-P-27111: no valve at BL-1508-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-PWY-7)
- 6"-P150-P-27113: no valve at BL-1611-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-PWY-7)
- 3"-P150-P-27115: no valve at BL-1809-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-PWY-7)
- 30"-P150-P-27002: no valve at PL-2704-P; GATE 30 and what stood with it left out, 3 pieces, the pipe 43.0 in longer (SW-PWY-7)
- 30"-P150-P-27002: no valve at PL-2703-P; GATE 30 and what stood with it left out, 3 pieces, the pipe 43.0 in longer (SW-PWY-7)
- 20"-P150-P-27102: no valve at BL-1724-P; GATE 20 and what stood with it left out, 3 pieces, the pipe 30.6 in longer (SW-PWY-7)
- 12"-P150-P-27104: no valve at BL-1211-P; GATE 12 and what stood with it left out, 3 pieces, the pipe 22.6 in longer (SW-PWY-7)
- 10"-P150-P-27105: no valve at BL-1116-P; GATE 10 and what stood with it left out, 3 pieces, the pipe 20.0 in longer (SW-PWY-7)
- 8"-P150-P-27108: no valve at BL-1412-P; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.7 in longer (SW-PWY-7)
- 6"-P150-P-27110: no valve at BL-1311-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-PWY-7)
- 6"-P150-P-27112: no valve at BL-1509-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-PWY-7)
- 6"-P150-P-27114: no valve at BL-1612-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-PWY-7)
- 3"-P150-P-27116: no valve at BL-1810-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-PWY-7)
- 2 pieces of pipe over 40 ft cut again with a shop weld (SW-RPI-10)
- 14 supports set where the generator's stepping along a run had stopped (SW-RPI-17): 5 hangers from steel above, 9 stanchions on steel below, 0 stanchions and 0 support posts from the floor, and 0 pipe frames

Not in this stage (SW-CWM-8): the cooling tower plot's own piping; the mains end at its edge, each at a limit spool with its block valve and blind.

