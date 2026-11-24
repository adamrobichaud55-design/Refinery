# Plant 3: piping of the units

> **Demonstration data.** Written by `tools/refinery-piping.ts`; do not edit by hand.

Each unit is piped in its own frame by the generator of plants 1 and 2, unchanged (DESIGN_BASIS.md §79): what it is given is the unit's rack and bodies, a nozzle schedule and a line list drawn from the flowsheet, battery limit spools in a valve bay, and where lines may travel. Its own checks (§40) are then run on the result and reported here as they come out.

| Unit | Name | Lines | Routed | Components | Welds | Supports | Pipe, ft | Failures | Checks not at zero |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 15 | Kerosene hydrotreater | 54 | 54 | 1,340 | 838 | 158 | 4,363 | 0 | supports 13 |

## Unit 15: Kerosene hydrotreater

54 lines: 32 of the flowsheet, 12 to installed spares and parallel bodies, 4 utility headers and 6 utility connections. Generated in 1 run.

| Component | Count |
| --- | --- |
| cap | 8 |
| elbow | 261 |
| flange | 173 |
| gasket | 280 |
| olet | 2 |
| pipe | 408 |
| reducer | 32 |
| spade | 30 |
| spectacle | 10 |
| tee | 21 |
| valve | 115 |

| Welds | Count |
| --- | --- |
| BW, field | 115 |
| BW, shop | 697 |
| FW, shop | 26 |

| Supports | Count |
| --- | --- |
| anchor | 16 |
| guide | 38 |
| hanger | 33 |
| shoe | 47 |
| stanchion | 10 |
| trapeze | 2 |
| trunnion | 12 |

### Checks

| Check (the generator's own, §40) | Found |
| --- | --- |
| every line continuous from end to end | 0 |
| every joint a joint of its class | 0 |
| elbows and the straights between them | 0 |
| valves by class and size | 0 |
| 3 in between lines | 0 |
| 3 in from steel and equipment | 0 |
| spans within SW-PS-7, a support at every rack beam crossed | 13 |

Not at zero, supports:

- 6"-P600-P-15007: unsupported span 332 in > 240 on run from 492,234,46
- 8"-P600-P-15009: unsupported span 262 in > 240 on run from 810,162,37
- 4"-P150-P-15019: unsupported span 323 in > 240 on run from 870,246,19
- 3"-P300-P-15025: unsupported span 1049 in > 180 on run from 1246,198,-336
- 3"-P300-P-15025: unsupported span 272 in > 180 on run from 192,198,-331
- 3"-P600-P-15027: unsupported span 626 in > 180 on run from 1555,192,-222
- 4"-P300-P-15029: unsupported span 299 in > 240 on run from 1050,144,-215
- 3"-P150-CWS-15501: unsupported span 317 in > 180 on run from 930,342,284
- 4"-P150-CWR-15502: unsupported span 417 in > 240 on run from 942,354,599
- 4"-P150-CWS-15503: unsupported span 350 in > 240 on run from 1164,198,259
- 4"-P150-CWR-15504: unsupported span 449 in > 240 on run from 1146,186,605
- 3"-P300-LS-15505: unsupported span 434 in > 180 on run from 1188,390,13
- 2"-P150-P-15506: unsupported span 203 in > 120 on run from 2499,372,36

These runs are longer than a pipe of their size spans and no steel stands where a support would go: lines that cross the yard or run beside the rack away from the support beams. They are listed, not hidden, and want pipe supports of their own.

### Battery limit

| Spool | Stream | Direction | Line | Stands at (x, y, z), in | Lane |
| --- | --- | --- | --- | --- | --- |
| BL-1506 | wild naphtha | out | 3"-P300-P-15025 | 150, 198, -54 | -336 |
| BL-1502 | reformer net gas | in | 3"-P600-P-15005 | 150, 198, -36 | — |
| BL-1505 | stripper gas | out | 3"-P150-P-15022 | 150, 198, -18 | -48 |
| BL-1504 | sour water | out | 3"-P600-P-15016 | 150, 198, 0 | -42 |
| BL-1507 | treated kerosene | out | 4"-P300-P-15032 | 150, 198, 18 | 48 |
| BL-1501 | straight-run kerosene | in | 4"-P150-P-15001 | 150, 198, 36 | — |
| BL-1503 | stripped water | in | 3"-P150-W-15012 | 150, 198, 54 | — |

### Control valve stations

| Line | Station | Given to the generator end for end |
| --- | --- | --- |
| 4"-P150-P-15001 | piped | no |
| 6"-P600-P-15007 | piped | yes |
| 3"-P600-P-15016 | omitted | no |
| 4"-P150-P-15019 | piped | yes |
| 3"-P150-P-15022 | piped | yes |
| 3"-P300-P-15024 | piped | no |
| 3"-P300-P-15025 | omitted | no |
| 4"-P300-P-15032 | piped | yes |

### Lines

| Line | Kind | Fluid | From | To | Design | Components | Welds | Supports | Length, ft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4"-P150-P-15001 | process | kerosene | BL-1501-U | D-1501-N1 | 105 psi, 150 °F | 43 | 22 | 1 | 80 |
| 6"-P150-P-15002 | process | kerosene | D-1501-N2 | P-1501A-S | 55 psi, 150 °F | 31 | 18 | 0 | 38 |
| 4"-P600-P-15003 | process | kerosene | P-1501A-D | E-1501-N1 | 595 psi, 150 °F | 33 | 20 | 3 | 83 |
| 3"-P600-P-15004 | process | hydrogen-rich gas | D-1502-N1 | K-1501A-N1 | 375 psi, 160 °F | 30 | 23 | 7 | 122 |
| 3"-P600-P-15005 | process | hydrogen-rich gas | BL-1502-U | tap 3"-P600-P-15004 | 380 psi, 160 °F | 13 | 10 | 1 | 35 |
| 3"-P600-P-15006 | process | hydrogen-rich gas | K-1501A-N2 | tap 4"-P600-P-15003 | 515 psi, 220 °F | 15 | 12 | 0 | 12 |
| 6"-P600-P-15007 | process | reactor effluent (oil and hydrogen) | E-1501-N2 | H-1501-N1 | 595 psi, 570 °F | 52 | 31 | 10 | 252 |
| 8"-P600-P-15008 | process | reactor effluent (oil and hydrogen) | H-1501-N2 | R-1501-N1 | 455 psi, 650 °F | 32 | 23 | 4 | 163 |
| 8"-P600-P-15009 | process | reactor effluent (oil and hydrogen) | R-1501-N2 | E-1505-N1 | 420 psi, 665 °F | 37 | 26 | 5 | 168 |
| 8"-P600-P-15010 | process | reactor effluent (oil and hydrogen) | E-1505-N2 | E-1501-N3 | 415 psi, 615 °F | 34 | 23 | 4 | 139 |
| 6"-P600-P-15011 | process | reactor effluent (oil and hydrogen) | E-1501-N4 | A-1501-N1 | 500 psi, 315 °F | 23 | 14 | 1 | 81 |
| 3"-P150-W-15012 | process | process and wash water | BL-1503-U | P-1505A-S | 125 psi, 160 °F | 27 | 19 | 1 | 45 |
| 3"-P600-W-15013 | process | process and wash water | P-1505A-D | tap 6"-P600-P-15011 | 500 psi, 160 °F | 23 | 16 | 0 | 21 |
| 4"-P600-P-15014 | process | reactor effluent (oil and hydrogen) | A-1501-N2 | E-1502-N1 | 500 psi, 190 °F | 22 | 13 | 0 | 88 |
| 4"-P600-P-15015 | process | reactor effluent (oil and hydrogen) | E-1502-N2 | D-1502-N2 | 500 psi, 160 °F | 24 | 13 | 5 | 90 |
| 3"-P600-P-15016 | process | sour water | D-1502-N3 | BL-1504-U | 470 psi, 160 °F | 26 | 19 | 7 | 115 |
| 4"-P150-P-15017 | process | kerosene | D-1502-N4 | E-1503-N1 | 95 psi, 160 °F | 27 | 18 | 4 | 114 |
| 4"-P150-P-15018 | process | kerosene | E-1503-N2 | E-1505-N3 | 85 psi, 370 °F | 23 | 12 | 1 | 31 |
| 4"-P150-P-15019 | process | kerosene | E-1505-N4 | C-1501-N1 | 75 psi, 435 °F | 50 | 27 | 4 | 151 |
| 4"-P150-P-15020 | process | hydrocarbon gas | C-1501-N2 | A-1502-N1 | 65 psi, 300 °F | 38 | 29 | 3 | 182 |
| 3"-P150-P-15021 | process | hydrocarbon gas | A-1502-N2 | D-1503-N1 | 60 psi, 170 °F | 29 | 20 | 7 | 140 |
| 3"-P150-P-15022 | process | hydrocarbon gas | D-1503-N2 | BL-1505-U | 55 psi, 170 °F | 39 | 20 | 12 | 157 |
| 3"-P150-P-15023 | process | naphtha | D-1503-N3 | P-1502A-S | 55 psi, 170 °F | 29 | 18 | 1 | 37 |
| 3"-P300-P-15024 | process | naphtha | P-1502A-D | C-1501-N3 | 155 psi, 170 °F | 51 | 26 | 0 | 86 |
| 3"-P300-P-15025 | process | naphtha | tap 3"-P300-P-15024 | BL-1506-U | 155 psi, 170 °F | 11 | 8 | 0 | 111 |
| 3"-P150-P-15026 | process | sour water | D-1503-N4 | P-1504A-S | 55 psi, 170 °F | 28 | 17 | 1 | 41 |
| 3"-P600-P-15027 | process | sour water | P-1504A-D | tap 3"-P600-P-15016 | 470 psi, 170 °F | 21 | 14 | 0 | 63 |
| 6"-P150-P-15028 | process | kerosene | C-1501-N4 | P-1503A-S | 70 psi, 420 °F | 25 | 12 | 2 | 46 |
| 4"-P300-P-15029 | process | kerosene | P-1503A-D | E-1503-N3 | 180 psi, 420 °F | 27 | 14 | 3 | 77 |
| 4"-P300-P-15030 | process | kerosene | E-1503-N4 | E-1504-N1 | 180 psi, 210 °F | 23 | 12 | 1 | 37 |
| 4"-P300-P-15031 | process | kerosene | E-1504-N2 | F-1501-N1 | 180 psi, 150 °F | 29 | 20 | 7 | 152 |
| 4"-P300-P-15032 | process | kerosene | F-1501-N2 | BL-1507-U | 180 psi, 150 °F | 48 | 29 | 9 | 193 |
| 6"-P150-P-15301 | spare | kerosene | tap 6"-P150-P-15002 | P-1501B-S | 55 psi, 150 °F | 19 | 12 | 0 | 9 |
| 4"-P600-P-15302 | spare | kerosene | P-1501B-D | tap 4"-P600-P-15003 | 595 psi, 150 °F | 16 | 9 | 0 | 10 |
| 3"-P600-P-15303 | spare | hydrogen-rich gas | tap 3"-P600-P-15004 | K-1501B-N1 | 375 psi, 160 °F | 7 | 4 | 0 | 11 |
| 3"-P600-P-15304 | spare | hydrogen-rich gas | K-1501B-N2 | tap 3"-P600-P-15006 | 515 psi, 220 °F | 7 | 4 | 0 | 11 |
| 3"-P150-W-15305 | spare | process and wash water | tap 3"-P150-W-15012 | P-1505B-S | 125 psi, 160 °F | 17 | 13 | 0 | 7 |
| 3"-P600-W-15306 | spare | process and wash water | P-1505B-D | tap 3"-P600-W-15013 | 500 psi, 160 °F | 20 | 13 | 0 | 10 |
| 3"-P150-P-15307 | spare | naphtha | tap 3"-P150-P-15023 | P-1502B-S | 55 psi, 170 °F | 15 | 8 | 0 | 4 |
| 3"-P300-P-15308 | spare | naphtha | P-1502B-D | tap 3"-P300-P-15024 | 155 psi, 170 °F | 18 | 11 | 0 | 8 |
| 3"-P150-P-15309 | spare | sour water | tap 3"-P150-P-15026 | P-1504B-S | 55 psi, 170 °F | 14 | 7 | 0 | 7 |
| 3"-P600-P-15310 | spare | sour water | P-1504B-D | tap 3"-P600-P-15027 | 470 psi, 170 °F | 14 | 7 | 0 | 7 |
| 6"-P150-P-15311 | spare | kerosene | tap 6"-P150-P-15028 | P-1503B-S | 70 psi, 420 °F | 19 | 12 | 0 | 10 |
| 4"-P300-P-15312 | spare | kerosene | P-1503B-D | tap 4"-P300-P-15029 | 180 psi, 420 °F | 14 | 7 | 0 | 6 |
| 6"-P150-CWS-15401 | header | cooling water supply | cap | cap | 85 psi, 150 °F | 8 | 7 | 8 | 178 |
| 6"-P150-CWR-15402 | header | cooling water return | cap | cap | 70 psi, 155 °F | 10 | 9 | 8 | 178 |
| 3"-P300-LS-15403 | header | steam, 150 psi | cap | cap | 175 psi, 450 °F | 8 | 7 | 17 | 178 |
| 2"-P150-P-15404 | header | fuel gas | cap | cap | 75 psi, 150 °F | 9 | 8 | 17 | 178 |
| 3"-P150-CWS-15501 | utility | cooling water supply | tap 6"-P150-CWS-15401 | E-1502-N3 | 85 psi, 150 °F | 33 | 20 | 1 | 82 |
| 4"-P150-CWR-15502 | utility | cooling water return | E-1502-N4 | tap 6"-P150-CWR-15402 | 70 psi, 155 °F | 27 | 16 | 0 | 70 |
| 4"-P150-CWS-15503 | utility | cooling water supply | tap 6"-P150-CWS-15401 | E-1504-N3 | 85 psi, 150 °F | 31 | 20 | 2 | 84 |
| 4"-P150-CWR-15504 | utility | cooling water return | E-1504-N4 | tap 6"-P150-CWR-15402 | 70 psi, 155 °F | 32 | 21 | 0 | 72 |
| 3"-P300-LS-15505 | utility | steam, 150 psi | tap 3"-P300-LS-15403 | C-1501-N5 | 175 psi, 450 °F | 21 | 14 | 0 | 49 |
| 2"-P150-P-15506 | utility | fuel gas | tap 2"-P150-P-15404 | H-1501-N3 | 75 psi, 150 °F | 18 | 11 | 1 | 44 |

