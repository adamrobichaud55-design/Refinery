# Plant 3: piping of the units

> **Demonstration data.** Written by `tools/refinery-piping.ts`; do not edit by hand.

Each unit is piped in its own frame by the generator of plants 1 and 2, unchanged (DESIGN_BASIS.md §79): what it is given is the unit's rack and bodies, a nozzle schedule and a line list drawn from the flowsheet, battery limit spools in a valve bay, and where lines may travel. Its own checks (§40) are then run on the result and reported here as they come out.

| Unit | Name | Lines | Routed | Components | Welds | Supports | Pipe, ft | Failures | Checks not at zero |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 13 | Naphtha hydrotreater and splitter | 84 | 84 | 2,170 | 1,354 | 306 | 8,058 | 0 | supports 29 |
| 15 | Kerosene hydrotreater | 65 | 65 | 1,645 | 1,042 | 201 | 4,929 | 0 | supports 12 |
| 16 | Diesel hydrotreater | 85 | 85 | 2,215 | 1,430 | 397 | 9,046 | 0 | supports 20 |

## Unit 13: Naphtha hydrotreater and splitter

84 lines: 39 of the flowsheet, 16 to installed spares and parallel bodies, 6 utility headers and 9 utility connections, 12 parts of lines after their control stations (SW-RPI-9), and 2 connections to branch root spools (SW-RPI-8). The lines that run the rack are on 2 of its tiers (SW-RPI-7), no tier loaded beyond 96 in of lanes at any section: tier 1 19 lines, tier 2 12 lines. Generated twice, the second time with the battery limit spools set on the lanes the lines took.

| Component | Count |
| --- | --- |
| cap | 12 |
| coupling | 6 |
| elbow | 458 |
| flange | 260 |
| gasket | 423 |
| nipple | 8 |
| olet | 4 |
| pipe | 697 |
| reducer | 42 |
| spade | 32 |
| spectacle | 17 |
| tee | 26 |
| valve | 185 |

| Welds | Count |
| --- | --- |
| BW, field | 203 |
| BW, shop | 1125 |
| FW, shop | 24 |
| SW, shop | 2 |

| Supports | Count |
| --- | --- |
| anchor | 38 |
| guide | 76 |
| hanger | 38 |
| shoe | 99 |
| stanchion | 9 |
| trapeze | 9 |
| trunnion | 37 |

### Checks

| Check (the generator's own, §40) | Found |
| --- | --- |
| every line continuous from end to end | 0 |
| every joint a joint of its class | 0 |
| elbows and the straights between them | 0 |
| valves by class and size | 0 |
| 3 in between lines | 0 |
| 3 in from steel and equipment | 0 |
| spans within SW-PS-7, a support at every rack beam crossed | 29 |

Not at zero, supports:

- 3"-P150-P-13702: unsupported span 560 in > 180 on run from 504,294,61
- 6"-P600-P-13004: unsupported span 332 in > 240 on run from 564,126,-218
- 3"-P600-P-13005: unsupported span 440 in > 180 on run from 1122,222,-499
- 10"-P600-P-13008: unsupported span 535 in > 240 on run from 456,240,607
- 10"-P600-P-13010: unsupported span 258 in > 240 on run from 456,204,193
- 6"-P600-P-13014: unsupported span 284 in > 240 on run from 912,168,262
- 6"-P300-P-13018: unsupported span 586 in > 240 on run from 1026,234,614
- 3"-P300-P-13021: unsupported span 386 in > 180 on run from 2022,204,-499
- 3"-P300-P-13707: unsupported span 194 in > 180 on run from 2334,240,-103
- 3"-P300-P-13707: unsupported span 199 in > 180 on run from 1290,306,91
- 8"-P300-P-13025: unsupported span 951 in > 240 on run from 1134,234,551
- 6"-P300-P-13026: unsupported span 282 in > 240 on run from 1026,222,16
- 3"-P150-P-13032: unsupported span 297 in > 180 on run from 1236,294,-91
- 12"-P150-P-13035: unsupported span 323 in > 240 on run from 1344,204,532
- 6"-P150-CWS-13501: unsupported span 362 in > 240 on run from 912,204,268
- 6"-P150-CWR-13502: unsupported span 442 in > 240 on run from 912,192,614
- 4"-P1200-LS-13503: unsupported span 326 in > 240 on run from 1134,252,259
- 1.5"-P1200-SC-13504: unsupported span 169 in > 120 on run from 1110,342,616
- 1.5"-P1200-SC-13504: unsupported span 169 in > 120 on run from 1110,342,445
- 1.5"-P1200-SC-13504: unsupported span 139 in > 120 on run from 1110,372,100
- 2"-P150-CWS-13505: unsupported span 232 in > 120 on run from 1236,372,3
- 2"-P150-CWS-13505: unsupported span 358 in > 120 on run from 1236,330,280
- 2"-P150-CWR-13506: unsupported span 623 in > 120 on run from 1236,312,615
- 4"-P300-LS-13507: unsupported span 347 in > 240 on run from 1344,222,271
- 1.5"-P300-SC-13508: unsupported span 187 in > 120 on run from 1374,354,622
- 1.5"-P300-SC-13508: unsupported span 187 in > 120 on run from 1374,354,433
- 1.5"-P300-SC-13508: unsupported span 130 in > 120 on run from 1374,372,91
- 2"-P150-P-13509: unsupported span 137 in > 120 on run from 3216,372,-57
- 2"-P150-P-13509: unsupported span 221 in > 120 on run from 3219,372,84

These runs are longer than a pipe of their size spans and no steel stands where a support would go: lines that cross the yard or run beside the rack away from the support beams. They are listed, not hidden, and want pipe supports of their own.

### Battery limit

| Spool | Stream | Direction | Line | Stands at (x, y, z), in | Tier | Lane |
| --- | --- | --- | --- | --- | --- | --- |
| BL-1308 | hydrotreated heavy naphtha | out | 6"-P300-P-13711 | 150, 204, -54 | 1 | — |
| BL-1303 | reformer net gas | in | 3"-P600-P-13006 | 150, 198, -36 | 1 | -18 |
| BL-1302 | wild naphtha | in | 3"-P150-P-13002 | 150, 198, -18 | 1 | -12 |
| BL-1301 | straight-run naphtha | in | 6"-P150-P-13001 | 150, 204, 0 | 1 | 0 |
| BL-1309 | heavy naphtha to storage | out | 6"-P300-P-13712 | 150, 204, 18 | 1 | 0 |
| BL-1304 | stripped water | in | 3"-P150-W-13012 | 150, 198, 36 | 1 | 36 |
| BL-1307 | light naphtha | out | 3"-P150-P-13710 | 150, 198, 54 | 1 | — |
| BL-1306 | stripper gas | out | 3"-P300-P-13706 | 150, 270, -12 | 2 | -90 |
| BL-1305 | sour water | out | 3"-P600-P-13704 | 150, 270, 6 | 2 | 48 |

### Branch roots

Branches that travel the rack start at a spool on it, a block valve on each face (SW-RPI-8).

| Spool | Branch | Connection to the tee | On | Stands at (x, y, z), in | Tier |
| --- | --- | --- | --- | --- | --- |
| RS-1301 | 3"-P600-P-13006 | 3"-P600-P-13601 | 3"-P600-P-13005 | 720, 198, 36 | 1 |
| RS-1302 | 3"-P150-P-13032 | 3"-P150-P-13602 | 4"-P150-P-13031 | 1680, 270, -54 | 2 |

### Control valve stations

Each stands at grade under the rack, on a spool that divides its line (SW-RPI-9).

| Line | Station | Spool | Stands at (x, y, z), in | The line after it |
| --- | --- | --- | --- | --- |
| 6"-P150-P-13001 | piped | CS-1301 | 564, 36, -108 | 6"-P150-P-13701 |
| 3"-P150-P-13002 | piped | CS-1302 | 804, 36, -108 | 3"-P150-P-13702 |
| 10"-P600-P-13008 | piped | CS-1303 | 2892, 36, 72 | 10"-P600-P-13703 |
| 3"-P600-P-13016 | piped | CS-1304 | 1404, 36, -108 | 3"-P600-P-13704 |
| 6"-P300-P-13018 | piped | CS-1305 | 1746, 36, -108 | 6"-P300-P-13705 |
| 3"-P300-P-13021 | piped | CS-1306 | 1884, 36, -108 | 3"-P300-P-13706 |
| 3"-P300-P-13023 | piped | CS-1307 | 2376, 36, -108 | 3"-P300-P-13707 |
| 6"-P150-P-13027 | piped | CS-1308 | 2712, 36, -108 | 6"-P150-P-13708 |
| 4"-P150-P-13031 | piped | CS-1309 | 1632, 36, -72 | 4"-P150-P-13709 |
| 3"-P150-P-13033 | piped | CS-1310 | 444, 36, 108 | 3"-P150-P-13710 |
| 6"-P300-P-13037 | piped | CS-1311 | 450, 36, -72 | 6"-P300-P-13711 |
| 6"-P300-P-13039 | piped | CS-1312 | 714, 36, -72 | 6"-P300-P-13712 |

### Lines

| Line | Kind | Fluid | From | To | Design | Rack tier | Components | Welds | Supports | Length, ft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 6"-P150-P-13001 | process | naphtha | BL-1301-U | CS-1301-A | 135 psi, 150 °F | 1 | 35 | 16 | 2 | 41 |
| 6"-P150-P-13701 | control | naphtha | CS-1301-B | D-1301-N1 | 135 psi, 150 °F | — | 21 | 12 | 1 | 65 |
| 3"-P150-P-13002 | process | naphtha | BL-1302-U | CS-1302-A | 105 psi, 160 °F | 1 | 47 | 28 | 3 | 69 |
| 3"-P150-P-13702 | control | naphtha | CS-1302-B | D-1301-N2 | 105 psi, 160 °F | 1 | 24 | 17 | 4 | 119 |
| 8"-P150-P-13003 | process | naphtha | D-1301-N3 | P-1301A-S | 55 psi, 150 °F | — | 31 | 18 | 1 | 46 |
| 6"-P600-P-13004 | process | naphtha | P-1301A-D | E-1301-N1 | 595 psi, 150 °F | — | 31 | 18 | 3 | 87 |
| 3"-P600-P-13005 | process | hydrogen-rich gas | D-1302-N1 | K-1301A-N1 | 385 psi, 150 °F | 1 | 34 | 27 | 7 | 138 |
| 3"-P600-P-13006 | process | hydrogen-rich gas | BL-1303-U | RS-1301-B | 395 psi, 160 °F | 1 | 29 | 22 | 2 | 56 |
| 3"-P600-P-13007 | process | hydrogen-rich gas | K-1301A-N2 | tap 6"-P600-P-13004 | 515 psi, 215 °F | — | 12 | 9 | 0 | 7 |
| 10"-P600-P-13008 | process | reactor effluent (oil and hydrogen) | E-1301-N2 | CS-1303-A | 595 psi, 570 °F | 1 | 46 | 25 | 10 | 265 |
| 10"-P600-P-13703 | control | reactor effluent (oil and hydrogen) | CS-1303-B | H-1301-N1 | 595 psi, 570 °F | 1 | 19 | 12 | 3 | 71 |
| 10"-P600-P-13009 | process | reactor effluent (oil and hydrogen) | H-1301-N2 | R-1301-N1 | 455 psi, 650 °F | 1 | 30 | 21 | 4 | 161 |
| 10"-P600-P-13010 | process | reactor effluent (oil and hydrogen) | R-1301-N2 | E-1301-N3 | 425 psi, 660 °F | 1 | 32 | 21 | 11 | 261 |
| 8"-P600-P-13011 | process | reactor effluent (oil and hydrogen) | E-1301-N4 | A-1301A-N1 | 500 psi, 355 °F | — | 27 | 18 | 1 | 82 |
| 3"-P150-W-13012 | process | process and wash water | BL-1304-U | P-1305A-S | 125 psi, 160 °F | — | 29 | 21 | 1 | 47 |
| 3"-P600-W-13013 | process | process and wash water | P-1305A-D | tap 8"-P600-P-13011 | 500 psi, 160 °F | — | 19 | 12 | 0 | 18 |
| 6"-P600-P-13014 | process | reactor effluent (oil and hydrogen) | A-1301A-N2 | E-1302-N1 | 500 psi, 190 °F | — | 21 | 12 | 1 | 77 |
| 6"-P600-P-13015 | process | reactor effluent (oil and hydrogen) | E-1302-N2 | D-1302-N2 | 500 psi, 150 °F | — | 26 | 15 | 6 | 91 |
| 3"-P600-P-13016 | process | sour water | D-1302-N3 | CS-1304-A | 385 psi, 150 °F | 2 | 49 | 30 | 8 | 145 |
| 3"-P600-P-13704 | control | sour water | CS-1304-B | BL-1305-U | 385 psi, 150 °F | 2 | 27 | 20 | 10 | 136 |
| 6"-P300-P-13017 | process | naphtha | D-1302-N4 | E-1303-N1 | 235 psi, 150 °F | — | 24 | 15 | 4 | 109 |
| 6"-P300-P-13018 | process | naphtha | E-1303-N2 | CS-1305-A | 225 psi, 350 °F | 2 | 47 | 26 | 4 | 140 |
| 6"-P300-P-13705 | control | naphtha | CS-1305-B | C-1301-N1 | 225 psi, 350 °F | 2 | 30 | 21 | 5 | 146 |
| 6"-P300-P-13019 | process | hydrocarbon gas | C-1301-N2 | A-1302-N1 | 205 psi, 250 °F | 1 | 34 | 25 | 3 | 189 |
| 4"-P300-P-13020 | process | hydrocarbon gas | A-1302-N2 | D-1303-N1 | 200 psi, 170 °F | 2 | 31 | 22 | 6 | 173 |
| 3"-P300-P-13021 | process | hydrocarbon gas | D-1303-N2 | CS-1306-A | 195 psi, 170 °F | — | 35 | 16 | 1 | 52 |
| 3"-P300-P-13706 | control | hydrocarbon gas | CS-1306-B | BL-1306-U | 195 psi, 170 °F | 2 | 22 | 15 | 14 | 165 |
| 3"-P300-P-13022 | process | naphtha | D-1303-N3 | P-1302A-S | 195 psi, 170 °F | — | 31 | 18 | 2 | 41 |
| 3"-P300-P-13023 | process | naphtha | P-1302A-D | CS-1307-A | 270 psi, 170 °F | 1 | 53 | 30 | 7 | 115 |
| 3"-P300-P-13707 | control | naphtha | CS-1307-B | C-1301-N3 | 270 psi, 170 °F | 2 | 35 | 26 | 9 | 224 |
| 6"-P300-P-13024 | process | naphtha | C-1301-N4 | E-1304-N1 | 210 psi, 435 °F | — | 24 | 15 | 3 | 103 |
| 8"-P300-P-13025 | process | naphtha | E-1304-N2 | C-1301-N5 | 210 psi, 450 °F | — | 21 | 12 | 0 | 111 |
| 6"-P300-P-13026 | process | naphtha | C-1301-N6 | E-1303-N3 | 210 psi, 450 °F | 2 | 34 | 23 | 4 | 129 |
| 6"-P150-P-13027 | process | naphtha | E-1303-N4 | CS-1308-A | 65 psi, 240 °F | 1 | 48 | 27 | 10 | 199 |
| 6"-P150-P-13708 | control | naphtha | CS-1308-B | C-1302-N1 | 65 psi, 240 °F | 1 | 32 | 23 | 7 | 195 |
| 12"-P150-P-13028 | process | naphtha | C-1302-N2 | A-1303A-N1 | 50 psi, 230 °F | 1 | 38 | 29 | 3 | 235 |
| 4"-P150-P-13029 | process | naphtha | A-1303A-N2 | D-1304-N1 | 50 psi, 180 °F | 2 | 29 | 20 | 7 | 178 |
| 6"-P150-P-13030 | process | naphtha | D-1304-N2 | P-1303A-S | 50 psi, 180 °F | — | 31 | 18 | 1 | 40 |
| 4"-P150-P-13031 | process | naphtha | P-1303A-D | CS-1309-A | 145 psi, 180 °F | 2 | 50 | 27 | 3 | 87 |
| 4"-P150-P-13709 | control | naphtha | CS-1309-B | C-1302-N3 | 145 psi, 180 °F | — | 25 | 16 | 2 | 126 |
| 3"-P150-P-13032 | process | naphtha | RS-1302-B | E-1305-N1 | 145 psi, 180 °F | 2 | 26 | 17 | 6 | 112 |
| 3"-P150-P-13033 | process | naphtha | E-1305-N2 | CS-1310-A | 145 psi, 150 °F | 1 | 50 | 29 | 9 | 136 |
| 3"-P150-P-13710 | control | naphtha | CS-1310-B | BL-1307-U | 145 psi, 150 °F | — | 17 | 10 | 1 | 36 |
| 6"-P150-P-13034 | process | naphtha | C-1302-N4 | E-1306-N1 | 50 psi, 350 °F | 2 | 33 | 24 | 4 | 120 |
| 12"-P150-P-13035 | process | naphtha | E-1306-N2 | C-1302-N5 | 50 psi, 360 °F | 1 | 35 | 26 | 2 | 129 |
| 8"-P150-P-13036 | process | naphtha | C-1302-N6 | P-1304A-S | 50 psi, 360 °F | — | 27 | 14 | 1 | 43 |
| 6"-P300-P-13037 | process | naphtha | P-1304A-D | CS-1311-A | 160 psi, 360 °F | 1 | 54 | 31 | 5 | 125 |
| 6"-P300-P-13711 | control | naphtha | CS-1311-B | BL-1308-U | 160 psi, 360 °F | — | 21 | 14 | 1 | 37 |
| 6"-P300-P-13038 | process | naphtha | tap 6"-P300-P-13037 | A-1304-N1 | 160 psi, 360 °F | — | 17 | 14 | 0 | 55 |
| 6"-P300-P-13039 | process | naphtha | A-1304-N2 | CS-1312-A | 160 psi, 190 °F | 1 | 41 | 22 | 5 | 141 |
| 6"-P300-P-13712 | control | naphtha | CS-1312-B | BL-1309-U | 160 psi, 190 °F | 1 | 25 | 18 | 2 | 65 |
| 3"-P600-P-13601 | root | hydrogen-rich gas | RS-1301-A | tap 3"-P600-P-13005 | 395 psi, 160 °F | — | 11 | 8 | 0 | 10 |
| 3"-P150-P-13602 | root | naphtha | tap 4"-P150-P-13031 | RS-1302-A | 145 psi, 180 °F | — | 5 | 2 | 0 | 4 |
| 8"-P150-P-13301 | spare | naphtha | tap 8"-P150-P-13003 | P-1301B-S | 55 psi, 150 °F | — | 19 | 12 | 0 | 13 |
| 6"-P600-P-13302 | spare | naphtha | P-1301B-D | tap 6"-P600-P-13004 | 595 psi, 150 °F | — | 20 | 13 | 0 | 12 |
| 3"-P600-P-13303 | spare | hydrogen-rich gas | tap 3"-P600-P-13005 | K-1301B-N1 | 385 psi, 150 °F | — | 13 | 10 | 0 | 25 |
| 3"-P600-P-13304 | spare | hydrogen-rich gas | K-1301B-N2 | tap 3"-P600-P-13007 | 515 psi, 215 °F | — | 11 | 8 | 0 | 17 |
| 8"-P600-P-13305 | spare | reactor effluent (oil and hydrogen) | tap 8"-P600-P-13011 | A-1301B-N1 | 500 psi, 355 °F | — | 11 | 8 | 0 | 20 |
| 3"-P150-W-13306 | spare | process and wash water | tap 3"-P150-W-13012 | P-1305B-S | 125 psi, 160 °F | — | 17 | 13 | 0 | 7 |
| 3"-P600-W-13307 | spare | process and wash water | P-1305B-D | tap 3"-P600-W-13013 | 500 psi, 160 °F | — | 16 | 9 | 0 | 1 |
| 6"-P600-P-13308 | spare | reactor effluent (oil and hydrogen) | A-1301B-N2 | tap 6"-P600-P-13014 | 500 psi, 190 °F | — | 13 | 10 | 0 | 20 |
| 3"-P300-P-13309 | spare | naphtha | tap 3"-P300-P-13022 | P-1302B-S | 195 psi, 170 °F | — | 15 | 8 | 0 | 2 |
| 3"-P300-P-13310 | spare | naphtha | P-1302B-D | tap 3"-P300-P-13023 | 270 psi, 170 °F | — | 14 | 7 | 0 | 6 |
| 12"-P150-P-13311 | spare | naphtha | tap 12"-P150-P-13028 | A-1303B-N1 | 50 psi, 230 °F | — | 11 | 8 | 0 | 20 |
| 4"-P150-P-13312 | spare | naphtha | A-1303B-N2 | tap 4"-P150-P-13029 | 50 psi, 180 °F | — | 11 | 8 | 0 | 16 |
| 6"-P150-P-13313 | spare | naphtha | tap 6"-P150-P-13030 | P-1303B-S | 50 psi, 180 °F | — | 19 | 12 | 0 | 8 |
| 4"-P150-P-13314 | spare | naphtha | P-1303B-D | tap 4"-P150-P-13031 | 145 psi, 180 °F | — | 18 | 11 | 0 | 8 |
| 8"-P150-P-13315 | spare | naphtha | tap 8"-P150-P-13036 | P-1304B-S | 50 psi, 360 °F | — | 21 | 14 | 0 | 15 |
| 6"-P300-P-13316 | spare | naphtha | P-1304B-D | tap 6"-P300-P-13037 | 160 psi, 360 °F | — | 14 | 7 | 0 | 5 |
| 6"-P150-CWS-13401 | header | cooling water supply | cap | cap | 85 psi, 150 °F | — | 10 | 9 | 11 | 238 |
| 6"-P150-CWR-13402 | header | cooling water return | cap | cap | 70 psi, 155 °F | — | 10 | 9 | 11 | 238 |
| 4"-P1200-LS-13403 | header | steam, 600 psi | cap | cap | 660 psi, 700 °F | — | 10 | 9 | 11 | 238 |
| 2"-P1200-SC-13404 | header | steam condensate | cap | cap | 650 psi, 660 °F | — | 12 | 11 | 23 | 238 |
| 4"-P300-LS-13405 | header | steam, 150 psi | cap | cap | 175 psi, 450 °F | — | 11 | 10 | 11 | 238 |
| 2"-P150-P-13406 | header | fuel gas | cap | cap | 75 psi, 150 °F | — | 11 | 10 | 23 | 238 |
| 6"-P150-CWS-13501 | utility | cooling water supply | tap 6"-P150-CWS-13401 | E-1302-N3 | 85 psi, 150 °F | — | 31 | 20 | 2 | 86 |
| 6"-P150-CWR-13502 | utility | cooling water return | E-1302-N4 | tap 6"-P150-CWR-13402 | 70 psi, 155 °F | — | 32 | 21 | 0 | 75 |
| 4"-P1200-LS-13503 | utility | steam, 600 psi | tap 4"-P1200-LS-13403 | E-1304-N3 | 660 psi, 700 °F | — | 20 | 11 | 1 | 70 |
| 1.5"-P1200-SC-13504 | utility | steam condensate | E-1304-N4 | tap 2"-P1200-SC-13404 | 650 psi, 660 °F | — | 29 | 2 | 1 | 87 |
| 2"-P150-CWS-13505 | utility | cooling water supply | tap 6"-P150-CWS-13401 | E-1305-N3 | 85 psi, 150 °F | — | 31 | 18 | 1 | 84 |
| 2"-P150-CWR-13506 | utility | cooling water return | E-1305-N4 | tap 6"-P150-CWR-13402 | 70 psi, 155 °F | — | 28 | 15 | 0 | 73 |
| 4"-P300-LS-13507 | utility | steam, 150 psi | tap 4"-P300-LS-13405 | E-1306-N3 | 175 psi, 450 °F | — | 20 | 11 | 0 | 66 |
| 1.5"-P300-SC-13508 | utility | steam condensate | E-1306-N4 | tap 2"-P1200-SC-13404 | 165 psi, 410 °F | — | 29 | 2 | 1 | 87 |
| 2"-P150-P-13509 | utility | fuel gas | tap 2"-P150-P-13406 | H-1301-N3 | 75 psi, 150 °F | — | 18 | 11 | 1 | 55 |

## Unit 15: Kerosene hydrotreater

65 lines: 32 of the flowsheet, 12 to installed spares and parallel bodies, 4 utility headers and 6 utility connections, 8 parts of lines after their control stations (SW-RPI-9), and 3 connections to branch root spools (SW-RPI-8). The lines that run the rack are on 2 of its tiers (SW-RPI-7), no tier loaded beyond 72 in of lanes at any section: tier 1 19 lines, tier 2 4 lines. Generated twice, the second time with the battery limit spools set on the lanes the lines took.

| Component | Count |
| --- | --- |
| cap | 8 |
| elbow | 347 |
| flange | 207 |
| gasket | 336 |
| olet | 2 |
| pipe | 505 |
| reducer | 36 |
| spade | 30 |
| spectacle | 10 |
| tee | 21 |
| valve | 143 |

| Welds | Count |
| --- | --- |
| BW, field | 159 |
| BW, shop | 857 |
| FW, shop | 26 |

| Supports | Count |
| --- | --- |
| anchor | 26 |
| guide | 45 |
| hanger | 33 |
| shoe | 51 |
| stanchion | 12 |
| trapeze | 5 |
| trunnion | 29 |

### Checks

| Check (the generator's own, §40) | Found |
| --- | --- |
| every line continuous from end to end | 0 |
| every joint a joint of its class | 0 |
| elbows and the straights between them | 0 |
| valves by class and size | 0 |
| 3 in between lines | 0 |
| 3 in from steel and equipment | 0 |
| spans within SW-PS-7, a support at every rack beam crossed | 12 |

Not at zero, supports:

- 6"-P600-P-15007: unsupported span 506 in > 240 on run from 456,228,614
- 8"-P600-P-15009: unsupported span 269 in > 240 on run from 912,162,73
- 4"-P600-P-15014: unsupported span 291 in > 240 on run from 1014,150,-17
- 4"-P150-P-15019: unsupported span 593 in > 240 on run from 942,156,611
- 3"-P150-P-15705: unsupported span 183 in > 180 on run from 364,198,36
- 4"-P300-P-15029: unsupported span 299 in > 240 on run from 1098,144,-215
- 4"-P150-CWR-15502: unsupported span 575 in > 240 on run from 1032,318,611
- 4"-P150-CWS-15503: unsupported span 359 in > 240 on run from 1236,270,259
- 4"-P150-CWR-15504: unsupported span 359 in > 240 on run from 1236,258,611
- 4"-P150-CWR-15504: unsupported span 257 in > 240 on run from 1254,378,239
- 3"-P300-LS-15505: unsupported span 272 in > 180 on run from 1170,378,13
- 2"-P150-P-15506: unsupported span 203 in > 120 on run from 2499,372,36

These runs are longer than a pipe of their size spans and no steel stands where a support would go: lines that cross the yard or run beside the rack away from the support beams. They are listed, not hidden, and want pipe supports of their own.

### Battery limit

| Spool | Stream | Direction | Line | Stands at (x, y, z), in | Tier | Lane |
| --- | --- | --- | --- | --- | --- | --- |
| BL-1507 | treated kerosene | out | 4"-P300-P-15708 | 150, 198, -54 | 1 | — |
| BL-1506 | wild naphtha | out | 3"-P300-P-15707 | 150, 198, -36 | 1 | -24 |
| BL-1504 | sour water | out | 3"-P600-P-15703 | 150, 198, -18 | 1 | -18 |
| BL-1501 | straight-run kerosene | in | 4"-P150-P-15001 | 150, 198, 0 | 1 | -12 |
| BL-1502 | reformer net gas | in | 3"-P600-P-15005 | 150, 198, 18 | 1 | -12 |
| BL-1505 | stripper gas | out | 3"-P150-P-15705 | 150, 198, 36 | 1 | 48 |
| BL-1503 | stripped water | in | 3"-P150-W-15012 | 150, 198, 54 | 1 | — |

### Branch roots

Branches that travel the rack start at a spool on it, a block valve on each face (SW-RPI-8).

| Spool | Branch | Connection to the tee | On | Stands at (x, y, z), in | Tier |
| --- | --- | --- | --- | --- | --- |
| RS-1501 | 3"-P600-P-15005 | 3"-P600-P-15601 | 3"-P600-P-15004 | 720, 198, 24 | 1 |
| RS-1502 | 3"-P300-P-15025 | 3"-P300-P-15602 | 3"-P300-P-15024 | 1440, 198, 48 | 1 |
| RS-1503 | 3"-P600-P-15027 | 3"-P600-P-15603 | 3"-P600-P-15016 | 960, 270, -12 | 2 |

### Control valve stations

Each stands at grade under the rack, on a spool that divides its line (SW-RPI-9).

| Line | Station | Spool | Stands at (x, y, z), in | The line after it |
| --- | --- | --- | --- | --- |
| 4"-P150-P-15001 | piped | CS-1501 | 540, 36, -108 | 4"-P150-P-15701 |
| 6"-P600-P-15007 | piped | CS-1502 | 1956, 36, 108 | 6"-P600-P-15702 |
| 3"-P600-P-15016 | piped | CS-1503 | 684, 36, -108 | 3"-P600-P-15703 |
| 4"-P150-P-15019 | piped | CS-1504 | 1500, 36, -108 | 4"-P150-P-15704 |
| 3"-P150-P-15022 | piped | CS-1505 | 924, 36, -108 | 3"-P150-P-15705 |
| 3"-P300-P-15024 | piped | CS-1506 | 1650, 36, -108 | 3"-P300-P-15706 |
| 3"-P300-P-15025 | piped | CS-1507 | 528, 36, 108 | 3"-P300-P-15707 |
| 4"-P300-P-15032 | piped | CS-1508 | 444, 36, -72 | 4"-P300-P-15708 |

### Lines

| Line | Kind | Fluid | From | To | Design | Rack tier | Components | Welds | Supports | Length, ft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4"-P150-P-15001 | process | kerosene | BL-1501-U | CS-1501-A | 105 psi, 150 °F | 1 | 33 | 14 | 1 | 39 |
| 4"-P150-P-15701 | control | kerosene | CS-1501-B | D-1501-N1 | 105 psi, 150 °F | — | 21 | 12 | 2 | 59 |
| 6"-P150-P-15002 | process | kerosene | D-1501-N2 | P-1501A-S | 55 psi, 150 °F | — | 31 | 18 | 0 | 38 |
| 4"-P600-P-15003 | process | kerosene | P-1501A-D | E-1501-N1 | 595 psi, 150 °F | — | 33 | 20 | 3 | 83 |
| 3"-P600-P-15004 | process | hydrogen-rich gas | D-1502-N1 | K-1501A-N1 | 375 psi, 160 °F | 2 | 30 | 23 | 8 | 134 |
| 3"-P600-P-15005 | process | hydrogen-rich gas | BL-1502-U | RS-1501-B | 380 psi, 160 °F | 1 | 21 | 14 | 3 | 49 |
| 3"-P600-P-15006 | process | hydrogen-rich gas | K-1501A-N2 | tap 4"-P600-P-15003 | 515 psi, 220 °F | — | 15 | 12 | 0 | 14 |
| 6"-P600-P-15007 | process | reactor effluent (oil and hydrogen) | E-1501-N2 | CS-1502-A | 595 psi, 570 °F | 1 | 50 | 29 | 6 | 209 |
| 6"-P600-P-15702 | control | reactor effluent (oil and hydrogen) | CS-1502-B | H-1501-N1 | 595 psi, 570 °F | 1 | 28 | 21 | 3 | 92 |
| 8"-P600-P-15008 | process | reactor effluent (oil and hydrogen) | H-1501-N2 | R-1501-N1 | 455 psi, 650 °F | 1 | 32 | 23 | 4 | 163 |
| 8"-P600-P-15009 | process | reactor effluent (oil and hydrogen) | R-1501-N2 | E-1505-N1 | 420 psi, 665 °F | 1 | 29 | 18 | 6 | 155 |
| 8"-P600-P-15010 | process | reactor effluent (oil and hydrogen) | E-1505-N2 | E-1501-N3 | 415 psi, 615 °F | 1 | 36 | 25 | 6 | 141 |
| 6"-P600-P-15011 | process | reactor effluent (oil and hydrogen) | E-1501-N4 | A-1501-N1 | 500 psi, 315 °F | — | 25 | 16 | 1 | 81 |
| 3"-P150-W-15012 | process | process and wash water | BL-1503-U | P-1505A-S | 125 psi, 160 °F | — | 29 | 21 | 1 | 45 |
| 3"-P600-W-15013 | process | process and wash water | P-1505A-D | tap 6"-P600-P-15011 | 500 psi, 160 °F | — | 23 | 16 | 0 | 21 |
| 4"-P600-P-15014 | process | reactor effluent (oil and hydrogen) | A-1501-N2 | E-1502-N1 | 500 psi, 190 °F | 1 | 26 | 17 | 4 | 132 |
| 4"-P600-P-15015 | process | reactor effluent (oil and hydrogen) | E-1502-N2 | D-1502-N2 | 500 psi, 160 °F | — | 24 | 13 | 4 | 97 |
| 3"-P600-P-15016 | process | sour water | D-1502-N3 | CS-1503-A | 470 psi, 160 °F | — | 41 | 22 | 1 | 50 |
| 3"-P600-P-15703 | control | sour water | CS-1503-B | BL-1504-U | 470 psi, 160 °F | 1 | 23 | 16 | 3 | 61 |
| 4"-P150-P-15017 | process | kerosene | D-1502-N4 | E-1503-N1 | 95 psi, 160 °F | — | 27 | 18 | 4 | 120 |
| 4"-P150-P-15018 | process | kerosene | E-1503-N2 | E-1505-N3 | 85 psi, 370 °F | — | 23 | 12 | 1 | 31 |
| 4"-P150-P-15019 | process | kerosene | E-1505-N4 | CS-1504-A | 75 psi, 435 °F | 1 | 46 | 25 | 3 | 118 |
| 4"-P150-P-15704 | control | kerosene | CS-1504-B | C-1501-N1 | 75 psi, 435 °F | 1 | 27 | 18 | 3 | 118 |
| 4"-P150-P-15020 | process | hydrocarbon gas | C-1501-N2 | A-1502-N1 | 65 psi, 300 °F | 1 | 38 | 29 | 3 | 180 |
| 3"-P150-P-15021 | process | hydrocarbon gas | A-1502-N2 | D-1503-N1 | 60 psi, 170 °F | 2 | 27 | 18 | 7 | 134 |
| 3"-P150-P-15022 | process | hydrocarbon gas | D-1503-N2 | CS-1505-A | 55 psi, 170 °F | 2 | 45 | 26 | 7 | 114 |
| 3"-P150-P-15705 | control | hydrocarbon gas | CS-1505-B | BL-1505-U | 55 psi, 170 °F | 1 | 22 | 15 | 5 | 85 |
| 3"-P150-P-15023 | process | naphtha | D-1503-N3 | P-1502A-S | 55 psi, 170 °F | — | 29 | 18 | 2 | 38 |
| 3"-P300-P-15024 | process | naphtha | P-1502A-D | CS-1506-A | 155 psi, 170 °F | 1 | 52 | 29 | 7 | 99 |
| 3"-P300-P-15706 | control | naphtha | CS-1506-B | C-1501-N3 | 155 psi, 170 °F | 1 | 30 | 21 | 7 | 142 |
| 3"-P300-P-15025 | process | naphtha | RS-1502-B | CS-1507-A | 155 psi, 170 °F | 1 | 43 | 24 | 9 | 105 |
| 3"-P300-P-15707 | control | naphtha | CS-1507-B | BL-1506-U | 155 psi, 170 °F | 1 | 25 | 18 | 2 | 59 |
| 3"-P150-P-15026 | process | sour water | D-1503-N4 | P-1504A-S | 55 psi, 170 °F | — | 28 | 17 | 1 | 42 |
| 3"-P600-P-15027 | process | sour water | P-1504A-D | RS-1503-B | 470 psi, 170 °F | 2 | 35 | 24 | 6 | 88 |
| 6"-P150-P-15028 | process | kerosene | C-1501-N4 | P-1503A-S | 70 psi, 420 °F | — | 25 | 12 | 2 | 43 |
| 4"-P300-P-15029 | process | kerosene | P-1503A-D | E-1503-N3 | 180 psi, 420 °F | — | 29 | 16 | 3 | 75 |
| 4"-P300-P-15030 | process | kerosene | E-1503-N4 | E-1504-N1 | 180 psi, 210 °F | — | 23 | 12 | 1 | 38 |
| 4"-P300-P-15031 | process | kerosene | E-1504-N2 | F-1501-N1 | 180 psi, 150 °F | 1 | 27 | 18 | 7 | 144 |
| 4"-P300-P-15032 | process | kerosene | F-1501-N2 | CS-1508-A | 180 psi, 150 °F | 1 | 51 | 32 | 7 | 176 |
| 4"-P300-P-15708 | control | kerosene | CS-1508-B | BL-1507-U | 180 psi, 150 °F | — | 19 | 12 | 1 | 33 |
| 3"-P600-P-15601 | root | hydrogen-rich gas | RS-1501-A | tap 3"-P600-P-15004 | 380 psi, 160 °F | — | 11 | 8 | 0 | 7 |
| 3"-P300-P-15602 | root | naphtha | tap 3"-P300-P-15024 | RS-1502-A | 155 psi, 170 °F | — | 7 | 4 | 0 | 1 |
| 3"-P600-P-15603 | root | sour water | RS-1503-A | tap 3"-P600-P-15016 | 470 psi, 170 °F | — | 15 | 12 | 1 | 31 |
| 6"-P150-P-15301 | spare | kerosene | tap 6"-P150-P-15002 | P-1501B-S | 55 psi, 150 °F | — | 19 | 12 | 0 | 9 |
| 4"-P600-P-15302 | spare | kerosene | P-1501B-D | tap 4"-P600-P-15003 | 595 psi, 150 °F | — | 16 | 9 | 0 | 10 |
| 3"-P600-P-15303 | spare | hydrogen-rich gas | tap 3"-P600-P-15004 | K-1501B-N1 | 375 psi, 160 °F | — | 13 | 10 | 0 | 25 |
| 3"-P600-P-15304 | spare | hydrogen-rich gas | K-1501B-N2 | tap 3"-P600-P-15006 | 515 psi, 220 °F | — | 11 | 8 | 0 | 17 |
| 3"-P150-W-15305 | spare | process and wash water | tap 3"-P150-W-15012 | P-1505B-S | 125 psi, 160 °F | — | 19 | 15 | 0 | 9 |
| 3"-P600-W-15306 | spare | process and wash water | P-1505B-D | tap 3"-P600-W-15013 | 500 psi, 160 °F | — | 20 | 13 | 0 | 10 |
| 3"-P150-P-15307 | spare | naphtha | tap 3"-P150-P-15023 | P-1502B-S | 55 psi, 170 °F | — | 15 | 8 | 0 | 7 |
| 3"-P300-P-15308 | spare | naphtha | P-1502B-D | tap 3"-P300-P-15024 | 155 psi, 170 °F | — | 14 | 7 | 0 | 6 |
| 3"-P150-P-15309 | spare | sour water | tap 3"-P150-P-15026 | P-1504B-S | 55 psi, 170 °F | — | 14 | 7 | 0 | 7 |
| 3"-P600-P-15310 | spare | sour water | P-1504B-D | tap 3"-P600-P-15027 | 470 psi, 170 °F | — | 14 | 7 | 0 | 7 |
| 6"-P150-P-15311 | spare | kerosene | tap 6"-P150-P-15028 | P-1503B-S | 70 psi, 420 °F | — | 19 | 12 | 0 | 10 |
| 4"-P300-P-15312 | spare | kerosene | P-1503B-D | tap 4"-P300-P-15029 | 180 psi, 420 °F | — | 14 | 7 | 0 | 6 |
| 6"-P150-CWS-15401 | header | cooling water supply | cap | cap | 85 psi, 150 °F | — | 8 | 7 | 8 | 178 |
| 6"-P150-CWR-15402 | header | cooling water return | cap | cap | 70 psi, 155 °F | — | 10 | 9 | 8 | 178 |
| 3"-P300-LS-15403 | header | steam, 150 psi | cap | cap | 175 psi, 450 °F | — | 8 | 7 | 17 | 178 |
| 2"-P150-P-15404 | header | fuel gas | cap | cap | 75 psi, 150 °F | — | 9 | 8 | 17 | 178 |
| 3"-P150-CWS-15501 | utility | cooling water supply | tap 6"-P150-CWS-15401 | E-1502-N3 | 85 psi, 150 °F | — | 34 | 21 | 3 | 83 |
| 4"-P150-CWR-15502 | utility | cooling water return | E-1502-N4 | tap 6"-P150-CWR-15402 | 70 psi, 155 °F | — | 32 | 21 | 0 | 74 |
| 4"-P150-CWS-15503 | utility | cooling water supply | tap 6"-P150-CWS-15401 | E-1504-N3 | 85 psi, 150 °F | — | 31 | 20 | 2 | 85 |
| 4"-P150-CWR-15504 | utility | cooling water return | E-1504-N4 | tap 6"-P150-CWR-15402 | 70 psi, 155 °F | — | 31 | 20 | 0 | 73 |
| 3"-P300-LS-15505 | utility | steam, 150 psi | tap 3"-P300-LS-15403 | C-1501-N5 | 175 psi, 450 °F | — | 22 | 15 | 0 | 51 |
| 2"-P150-P-15506 | utility | fuel gas | tap 2"-P150-P-15404 | H-1501-N3 | 75 psi, 150 °F | — | 18 | 11 | 1 | 44 |

## Unit 16: Diesel hydrotreater

85 lines: 43 of the flowsheet, 16 to installed spares and parallel bodies, 4 utility headers and 4 utility connections, 13 parts of lines after their control stations (SW-RPI-9), and 5 connections to branch root spools (SW-RPI-8). The lines that run the rack are on 2 of its tiers (SW-RPI-7), no tier loaded beyond 96 in of lanes at any section: tier 1 20 lines, tier 2 17 lines. Generated twice, the second time with the battery limit spools set on the lanes the lines took.

| Component | Count |
| --- | --- |
| cap | 8 |
| elbow | 469 |
| flange | 273 |
| gasket | 436 |
| olet | 3 |
| pipe | 720 |
| reducer | 50 |
| spade | 28 |
| spectacle | 12 |
| tee | 24 |
| valve | 192 |

| Welds | Count |
| --- | --- |
| BW, field | 218 |
| BW, shop | 1189 |
| FW, shop | 23 |

| Supports | Count |
| --- | --- |
| anchor | 43 |
| guide | 109 |
| hanger | 54 |
| shoe | 138 |
| stanchion | 8 |
| trapeze | 4 |
| trunnion | 41 |

### Checks

| Check (the generator's own, §40) | Found |
| --- | --- |
| every line continuous from end to end | 0 |
| every joint a joint of its class | 0 |
| elbows and the straights between them | 0 |
| valves by class and size | 0 |
| 3 in between lines | 0 |
| 3 in from steel and equipment | 0 |
| spans within SW-PS-7, a support at every rack beam crossed | 20 |

Not at zero, supports:

- 3"-P150-P-16702: unsupported span 410 in > 180 on run from 504,222,13
- 6"-P1200-P-16005: unsupported span 334 in > 240 on run from 426,138,-44
- 3"-P1200-P-16703: unsupported span 313 in > 180 on run from 1536,204,-113
- 3"-P1200-P-16703: unsupported span 212 in > 180 on run from 1531,204,-456
- 3"-P1200-P-16705: unsupported span 308 in > 180 on run from 2646,144,-113
- 8"-P1200-P-16016: unsupported span 651 in > 240 on run from 462,294,635
- 10"-P1200-P-16018: unsupported span 265 in > 240 on run from 1290,240,-1
- 8"-P1200-P-16023: unsupported span 676 in > 240 on run from 726,234,245
- 3"-P300-P-16026: unsupported span 475 in > 180 on run from 1842,294,-547
- 3"-P300-P-16709: no shoe at bent x=360
- 6"-P300-P-16027: unsupported span 332 in > 240 on run from 1410,240,16
- 6"-P150-P-16029: unsupported span 610 in > 240 on run from 1302,168,638
- 3"-P150-P-16031: unsupported span 410 in > 180 on run from 2298,246,37
- 3"-P150-P-16032: unsupported span 524 in > 180 on run from 2382,240,-547
- 6"-P300-P-16039: unsupported span 280 in > 240 on run from 1446,228,10
- 6"-P300-P-16041: unsupported span 278 in > 240 on run from 1590,234,-8
- 6"-P150-CWS-16501: unsupported span 262 in > 240 on run from 1578,384,10
- 6"-P150-CWR-16502: unsupported span 457 in > 240 on run from 1602,354,632
- 4"-P300-LS-16503: unsupported span 251 in > 240 on run from 2010,384,17
- 2"-P150-P-16504: unsupported span 209 in > 120 on run from 3699,378,78

These runs are longer than a pipe of their size spans and no steel stands where a support would go: lines that cross the yard or run beside the rack away from the support beams. They are listed, not hidden, and want pipe supports of their own.

### Battery limit

| Spool | Stream | Direction | Line | Stands at (x, y, z), in | Tier | Lane |
| --- | --- | --- | --- | --- | --- | --- |
| BL-1606 | stripped water | in | 3"-P150-W-16021 | 150, 198, -66 | 1 | — |
| BL-1602 | light cycle oil to hydrotreating | in | 3"-P150-P-16002 | 150, 198, -48 | 1 | -18 |
| BL-1601 | straight-run diesel | in | 6"-P150-P-16001 | 150, 204, -30 | 1 | -12 |
| BL-1610 | treated diesel | out | 6"-P300-P-16713 | 150, 204, -12 | 1 | -6 |
| BL-1605 | hydrogen | in | 3"-P600-P-16014 | 150, 198, 6 | 1 | 24 |
| BL-1609 | wild naphtha | out | 3"-P300-P-16712 | 150, 198, 24 | 1 | 30 |
| BL-1603 | lean amine | in | 4"-P150-P-16007 | 150, 198, 42 | 1 | — |
| BL-1608 | stripper gas | out | 3"-P300-P-16709 | 150, 198, 60 | 1 | — |
| BL-1604 | rich amine | out | 3"-P150-P-16704 | 150, 270, -12 | 2 | -48 |
| BL-1607 | sour water | out | 3"-P1200-P-16707 | 150, 270, 6 | 2 | 54 |

### Branch roots

Branches that travel the rack start at a spool on it, a block valve on each face (SW-RPI-8).

| Spool | Branch | Connection to the tee | On | Stands at (x, y, z), in | Tier |
| --- | --- | --- | --- | --- | --- |
| RS-1601 | 3"-P1200-P-16013 | 3"-P1200-P-16601 | 6"-P1200-P-16012 | 720, 270, 36 | 2 |
| RS-1602 | 3"-P1200-P-16015 | 3"-P1200-P-16602 | 6"-P1200-P-16012 | 720, 198, -12 | 1 |
| RS-1603 | 3"-P150-P-16032 | 3"-P150-P-16603 | 3"-P300-P-16026 | 1920, 270, 12 | 2 |
| RS-1604 | 3"-P300-P-16035 | 3"-P300-P-16604 | 3"-P300-P-16034 | 1920, 270, -54 | 2 |
| RS-1605 | 3"-P1200-P-16037 | 3"-P1200-P-16605 | 3"-P1200-P-16024 | 1920, 198, 36 | 1 |

### Control valve stations

Each stands at grade under the rack, on a spool that divides its line (SW-RPI-9).

| Line | Station | Spool | Stands at (x, y, z), in | The line after it |
| --- | --- | --- | --- | --- |
| 6"-P150-P-16001 | piped | CS-1601 | 564, 36, -108 | 6"-P150-P-16701 |
| 3"-P150-P-16002 | piped | CS-1602 | 804, 36, -108 | 3"-P150-P-16702 |
| 3"-P1200-P-16008 | piped | CS-1603 | 1494, 36, -108 | 3"-P1200-P-16703 |
| 3"-P150-P-16009 | piped | CS-1604 | 1644, 36, -108 | 3"-P150-P-16704 |
| 3"-P1200-P-16013 | piped | CS-1605 | 2604, 36, -108 | 3"-P1200-P-16705 |
| 8"-P1200-P-16016 | piped | CS-1606 | 3624, 36, 108 | 8"-P1200-P-16706 |
| 3"-P1200-P-16024 | piped | CS-1607 | 1884, 36, -108 | 3"-P1200-P-16707 |
| 6"-P300-P-16025 | piped | CS-1608 | 2862, 36, -108 | 6"-P300-P-16708 |
| 3"-P300-P-16026 | piped | CS-1609 | 444, 36, -72 | 3"-P300-P-16709 |
| 6"-P150-P-16029 | piped | CS-1610 | 3450, 36, -108 | 6"-P150-P-16710 |
| 3"-P300-P-16034 | piped | CS-1611 | 1860, 36, -72 | 3"-P300-P-16711 |
| 3"-P300-P-16035 | piped | CS-1612 | 528, 36, 108 | 3"-P300-P-16712 |
| 6"-P300-P-16043 | piped | CS-1613 | 684, 36, -72 | 6"-P300-P-16713 |

### Lines

| Line | Kind | Fluid | From | To | Design | Rack tier | Components | Welds | Supports | Length, ft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 6"-P150-P-16001 | process | diesel | BL-1601-U | CS-1601-A | 105 psi, 190 °F | 1 | 35 | 16 | 2 | 39 |
| 6"-P150-P-16701 | control | diesel | CS-1601-B | D-1601-N1 | 105 psi, 190 °F | — | 19 | 10 | 2 | 67 |
| 3"-P150-P-16002 | process | diesel | BL-1602-U | CS-1602-A | 105 psi, 190 °F | 1 | 43 | 24 | 4 | 65 |
| 3"-P150-P-16702 | control | diesel | CS-1602-B | D-1601-N2 | 105 psi, 190 °F | 1 | 26 | 19 | 5 | 105 |
| 6"-P150-P-16003 | process | diesel | D-1601-N3 | F-1601-N1 | 55 psi, 190 °F | 1 | 33 | 24 | 13 | 280 |
| 8"-P150-P-16004 | process | diesel | F-1601-N2 | P-1601A-S | 50 psi, 190 °F | — | 23 | 12 | 1 | 39 |
| 6"-P1200-P-16005 | process | diesel | P-1601A-D | E-1601-N1 | 1145 psi, 190 °F | 1 | 43 | 30 | 12 | 295 |
| 6"-P1200-P-16006 | process | hydrogen-rich gas | D-1602-N1 | C-1601-N1 | 850 psi, 180 °F | — | 15 | 8 | 0 | 22 |
| 4"-P150-P-16007 | process | amine solution | BL-1603-U | P-1602A-S | 85 psi, 170 °F | — | 31 | 20 | 2 | 65 |
| 3"-P1200-P-16008 | process | amine solution | P-1602A-D | CS-1603-A | 1050 psi, 170 °F | 2 | 51 | 28 | 10 | 141 |
| 3"-P1200-P-16703 | control | amine solution | CS-1603-B | C-1601-N2 | 1050 psi, 170 °F | — | 20 | 13 | 2 | 118 |
| 3"-P150-P-16009 | process | amine solution | C-1601-N3 | CS-1604-A | 105 psi, 190 °F | 2 | 48 | 29 | 6 | 124 |
| 3"-P150-P-16704 | control | amine solution | CS-1604-B | BL-1604-U | 105 psi, 190 °F | 2 | 21 | 14 | 12 | 145 |
| 6"-P1200-P-16010 | process | hydrogen-rich gas | C-1601-N4 | D-1603-N1 | 840 psi, 180 °F | — | 22 | 13 | 0 | 88 |
| 6"-P1200-P-16011 | process | hydrogen-rich gas | D-1603-N2 | K-1601A-N1 | 835 psi, 180 °F | 1 | 27 | 20 | 7 | 168 |
| 6"-P1200-P-16012 | process | hydrogen-rich gas | K-1601A-N2 | tap 6"-P1200-P-16005 | 1000 psi, 230 °F | — | 11 | 8 | 0 | 24 |
| 3"-P1200-P-16013 | process | hydrogen-rich gas | RS-1601-B | CS-1605-A | 1000 psi, 230 °F | 2 | 46 | 27 | 15 | 178 |
| 3"-P1200-P-16705 | control | hydrogen-rich gas | CS-1605-B | R-1601-N1 | 1000 psi, 230 °F | — | 19 | 12 | 2 | 62 |
| 3"-P600-P-16014 | process | hydrogen-rich gas | BL-1605-U | K-1602A-N1 | 545 psi, 160 °F | 1 | 24 | 17 | 8 | 112 |
| 3"-P1200-P-16015 | process | hydrogen-rich gas | K-1602A-N2 | RS-1602-B | 1000 psi, 300 °F | 1 | 29 | 22 | 4 | 78 |
| 8"-P1200-P-16016 | process | reactor effluent (oil and hydrogen) | E-1601-N2 | CS-1606-A | 1145 psi, 590 °F | 1 | 48 | 27 | 13 | 348 |
| 8"-P1200-P-16706 | control | reactor effluent (oil and hydrogen) | CS-1606-B | H-1601-N1 | 1145 psi, 590 °F | — | 15 | 8 | 1 | 50 |
| 10"-P1200-P-16017 | process | reactor effluent (oil and hydrogen) | H-1601-N2 | R-1601-N2 | 935 psi, 660 °F | 1 | 32 | 23 | 6 | 216 |
| 10"-P1200-P-16018 | process | reactor effluent (oil and hydrogen) | R-1601-N3 | E-1604-N1 | 880 psi, 700 °F | 1 | 28 | 17 | 10 | 210 |
| 10"-P1200-P-16019 | process | reactor effluent (oil and hydrogen) | E-1604-N2 | E-1601-N3 | 870 psi, 650 °F | 1 | 35 | 24 | 7 | 181 |
| 8"-P1200-P-16020 | process | reactor effluent (oil and hydrogen) | E-1601-N4 | A-1601-N1 | 1015 psi, 340 °F | — | 25 | 16 | 1 | 83 |
| 3"-P150-W-16021 | process | process and wash water | BL-1606-U | P-1605A-S | 125 psi, 160 °F | — | 29 | 21 | 3 | 70 |
| 3"-P1200-W-16022 | process | process and wash water | P-1605A-D | tap 8"-P1200-P-16020 | 1015 psi, 160 °F | — | 21 | 14 | 0 | 21 |
| 8"-P1200-P-16023 | process | reactor effluent (oil and hydrogen) | A-1601-N2 | D-1602-N2 | 1015 psi, 190 °F | — | 20 | 11 | 1 | 115 |
| 3"-P1200-P-16024 | process | sour water | D-1602-N3 | CS-1607-A | 990 psi, 190 °F | 2 | 49 | 30 | 13 | 183 |
| 3"-P1200-P-16707 | control | sour water | CS-1607-B | BL-1607-U | 990 psi, 190 °F | 2 | 24 | 17 | 14 | 175 |
| 6"-P300-P-16025 | process | diesel | D-1602-N4 | CS-1608-A | 175 psi, 190 °F | 1 | 48 | 29 | 11 | 232 |
| 6"-P300-P-16708 | control | diesel | CS-1608-B | D-1604-N1 | 175 psi, 190 °F | 2 | 26 | 17 | 8 | 186 |
| 3"-P300-P-16026 | process | hydrocarbon gas | D-1604-N2 | CS-1609-A | 165 psi, 190 °F | 2 | 46 | 27 | 12 | 182 |
| 3"-P300-P-16709 | control | hydrocarbon gas | CS-1609-B | BL-1608-U | 165 psi, 190 °F | — | 17 | 10 | 2 | 42 |
| 6"-P300-P-16027 | process | diesel | D-1604-N3 | E-1602-N1 | 165 psi, 190 °F | 2 | 32 | 23 | 6 | 176 |
| 6"-P300-P-16028 | process | diesel | E-1602-N2 | E-1604-N3 | 155 psi, 420 °F | — | 23 | 12 | 1 | 24 |
| 6"-P150-P-16029 | process | diesel | E-1604-N4 | CS-1610-A | 145 psi, 485 °F | 1 | 50 | 29 | 9 | 249 |
| 6"-P150-P-16710 | control | diesel | CS-1610-B | C-1602-N1 | 145 psi, 485 °F | 2 | 32 | 23 | 9 | 220 |
| 4"-P150-P-16030 | process | hydrocarbon gas | C-1602-N2 | A-1602-N1 | 125 psi, 350 °F | 2 | 42 | 33 | 6 | 257 |
| 3"-P150-P-16031 | process | hydrocarbon gas | A-1602-N2 | D-1605-N1 | 120 psi, 170 °F | 2 | 30 | 21 | 14 | 222 |
| 3"-P150-P-16032 | process | hydrocarbon gas | D-1605-N2 | RS-1603-B | 105 psi, 170 °F | 2 | 24 | 17 | 3 | 90 |
| 3"-P150-P-16033 | process | naphtha | D-1605-N3 | P-1603A-S | 115 psi, 170 °F | — | 29 | 18 | 1 | 43 |
| 3"-P300-P-16034 | process | naphtha | P-1603A-D | CS-1611-A | 205 psi, 170 °F | 2 | 58 | 35 | 5 | 96 |
| 3"-P300-P-16711 | control | naphtha | CS-1611-B | C-1602-N3 | 205 psi, 170 °F | — | 24 | 15 | 3 | 126 |
| 3"-P300-P-16035 | process | naphtha | RS-1604-B | CS-1612-A | 205 psi, 170 °F | 2 | 44 | 25 | 13 | 159 |
| 3"-P300-P-16712 | control | naphtha | CS-1612-B | BL-1609-U | 205 psi, 170 °F | 1 | 23 | 16 | 3 | 54 |
| 3"-P150-P-16036 | process | sour water | D-1605-N4 | P-1606A-S | 115 psi, 170 °F | — | 29 | 18 | 1 | 45 |
| 3"-P1200-P-16037 | process | sour water | P-1606A-D | RS-1605-B | 990 psi, 170 °F | 1 | 33 | 22 | 5 | 73 |
| 8"-P150-P-16038 | process | diesel | C-1602-N4 | P-1604A-S | 130 psi, 470 °F | — | 31 | 18 | 1 | 52 |
| 6"-P300-P-16039 | process | diesel | P-1604A-D | E-1602-N3 | 225 psi, 470 °F | 1 | 34 | 21 | 4 | 133 |
| 6"-P300-P-16040 | process | diesel | E-1602-N4 | A-1603-N1 | 225 psi, 240 °F | 2 | 36 | 27 | 4 | 147 |
| 6"-P300-P-16041 | process | diesel | A-1603-N2 | E-1603-N1 | 225 psi, 190 °F | 2 | 30 | 21 | 5 | 154 |
| 6"-P300-P-16042 | process | diesel | E-1603-N2 | F-1602-N1 | 225 psi, 160 °F | 1 | 32 | 23 | 9 | 220 |
| 6"-P300-P-16043 | process | diesel | F-1602-N2 | CS-1613-A | 225 psi, 160 °F | 1 | 49 | 30 | 12 | 251 |
| 6"-P300-P-16713 | control | diesel | CS-1613-B | BL-1610-U | 225 psi, 160 °F | 1 | 27 | 20 | 2 | 69 |
| 3"-P1200-P-16601 | root | hydrogen-rich gas | tap 6"-P1200-P-16012 | RS-1601-A | 1000 psi, 230 °F | — | 14 | 11 | 1 | 43 |
| 3"-P1200-P-16602 | root | hydrogen-rich gas | RS-1602-A | tap 6"-P1200-P-16012 | 1000 psi, 300 °F | — | 16 | 13 | 2 | 42 |
| 3"-P150-P-16603 | root | hydrocarbon gas | RS-1603-A | tap 3"-P300-P-16026 | 105 psi, 170 °F | — | 13 | 10 | 0 | 10 |
| 3"-P300-P-16604 | root | naphtha | tap 3"-P300-P-16034 | RS-1604-A | 205 psi, 170 °F | — | 9 | 6 | 0 | 6 |
| 3"-P1200-P-16605 | root | sour water | RS-1605-A | tap 3"-P1200-P-16024 | 990 psi, 170 °F | — | 7 | 4 | 0 | 6 |
| 8"-P150-P-16301 | spare | diesel | tap 8"-P150-P-16004 | P-1601B-S | 50 psi, 190 °F | — | 19 | 12 | 0 | 13 |
| 6"-P1200-P-16302 | spare | diesel | P-1601B-D | tap 6"-P1200-P-16005 | 1145 psi, 190 °F | — | 13 | 6 | 0 | 7 |
| 4"-P150-P-16303 | spare | amine solution | tap 4"-P150-P-16007 | P-1602B-S | 85 psi, 170 °F | — | 15 | 8 | 0 | 9 |
| 3"-P1200-P-16304 | spare | amine solution | P-1602B-D | tap 3"-P1200-P-16008 | 1050 psi, 170 °F | — | 14 | 7 | 0 | 7 |
| 6"-P1200-P-16305 | spare | hydrogen-rich gas | tap 6"-P1200-P-16011 | K-1601B-N1 | 835 psi, 180 °F | — | 13 | 10 | 0 | 25 |
| 6"-P1200-P-16306 | spare | hydrogen-rich gas | K-1601B-N2 | tap 6"-P1200-P-16012 | 1000 psi, 230 °F | — | 11 | 8 | 0 | 19 |
| 3"-P600-P-16307 | spare | hydrogen-rich gas | tap 3"-P600-P-16014 | K-1602B-N1 | 545 psi, 160 °F | — | 13 | 10 | 0 | 25 |
| 3"-P1200-P-16308 | spare | hydrogen-rich gas | K-1602B-N2 | tap 3"-P1200-P-16015 | 1000 psi, 300 °F | — | 11 | 8 | 0 | 17 |
| 3"-P150-W-16309 | spare | process and wash water | tap 3"-P150-W-16021 | P-1605B-S | 125 psi, 160 °F | — | 17 | 13 | 0 | 7 |
| 3"-P1200-W-16310 | spare | process and wash water | P-1605B-D | tap 3"-P1200-W-16022 | 1015 psi, 160 °F | — | 16 | 9 | 0 | 7 |
| 3"-P150-P-16311 | spare | naphtha | tap 3"-P150-P-16033 | P-1603B-S | 115 psi, 170 °F | — | 15 | 8 | 0 | 3 |
| 3"-P300-P-16312 | spare | naphtha | P-1603B-D | tap 3"-P300-P-16034 | 205 psi, 170 °F | — | 22 | 15 | 0 | 8 |
| 3"-P150-P-16313 | spare | sour water | tap 3"-P150-P-16036 | P-1606B-S | 115 psi, 170 °F | — | 15 | 8 | 0 | 7 |
| 3"-P1200-P-16314 | spare | sour water | P-1606B-D | tap 3"-P1200-P-16037 | 990 psi, 170 °F | — | 14 | 7 | 0 | 7 |
| 8"-P150-P-16315 | spare | diesel | tap 8"-P150-P-16038 | P-1604B-S | 130 psi, 470 °F | — | 23 | 16 | 0 | 17 |
| 6"-P300-P-16316 | spare | diesel | P-1604B-D | tap 6"-P300-P-16039 | 225 psi, 470 °F | — | 14 | 7 | 0 | 5 |
| 6"-P150-CWS-16401 | header | cooling water supply | cap | cap | 85 psi, 150 °F | — | 11 | 10 | 13 | 278 |
| 6"-P150-CWR-16402 | header | cooling water return | cap | cap | 70 psi, 155 °F | — | 11 | 10 | 13 | 278 |
| 4"-P300-LS-16403 | header | steam, 150 psi | cap | cap | 175 psi, 450 °F | — | 11 | 10 | 13 | 278 |
| 2"-P150-P-16404 | header | fuel gas | cap | cap | 75 psi, 150 °F | — | 12 | 11 | 27 | 278 |
| 6"-P150-CWS-16501 | utility | cooling water supply | tap 6"-P150-CWS-16401 | E-1603-N3 | 85 psi, 150 °F | — | 33 | 22 | 2 | 88 |
| 6"-P150-CWR-16502 | utility | cooling water return | E-1603-N4 | tap 6"-P150-CWR-16402 | 70 psi, 155 °F | — | 32 | 21 | 0 | 78 |
| 4"-P300-LS-16503 | utility | steam, 150 psi | tap 4"-P300-LS-16403 | C-1602-N5 | 175 psi, 450 °F | — | 22 | 15 | 0 | 56 |
| 2"-P150-P-16504 | utility | fuel gas | tap 2"-P150-P-16404 | H-1601-N3 | 75 psi, 150 °F | — | 18 | 11 | 1 | 53 |

