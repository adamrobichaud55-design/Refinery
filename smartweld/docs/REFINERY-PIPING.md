# Plant 3: piping of the units

> **Demonstration data.** Written by `tools/refinery-piping.ts`; do not edit by hand.

Each unit is piped in its own frame by the generator of plants 1 and 2, unchanged (DESIGN_BASIS.md §79): what it is given is the unit's rack and bodies, a nozzle schedule and a line list drawn from the flowsheet, battery limit spools in a valve bay, and where lines may travel. Its own checks (§40) are then run on the result and reported here as they come out.

| Unit | Name | Lines | Routed | Components | Welds | Supports | Pipe, ft | Failures | Checks not at zero |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | Crude distillation | 135 | 135 | 3,768 | 2,426 | 551 | 14,251 | 0 | supports 9 |
| 12 | Vacuum distillation | 62 | 62 | 1,468 | 912 | 198 | 5,027 | 0 | supports 1 |
| 13 | Naphtha hydrotreater and splitter | 86 | 86 | 2,134 | 1,310 | 331 | 7,360 | 0 | supports 3 |
| 14 | Catalytic reformer and hydrogen purification | 99 | 99 | 2,395 | 1,507 | 468 | 9,517 | 0 | supports 7 |
| 15 | Kerosene hydrotreater | 65 | 65 | 1,572 | 963 | 217 | 4,689 | 0 | none |
| 16 | Diesel hydrotreater | 85 | 85 | 2,133 | 1,348 | 395 | 8,285 | 0 | supports 2 |
| 17 | Fluid catalytic cracker and gas concentration | 222 | 222 | 6,022 | 3,804 | 1,203 | 25,404 | 0 | supports 9 |
| 18 | Sulfur block | 139 | 139 | 3,739 | 2,221 | 709 | 12,908 | 0 | supports 7 |
| 19 | Utilities | 104 | 104 | 2,500 | 1,563 | 514 | 10,219 | 0 | supports 1 |

## Unit 11: Crude distillation

135 lines: 66 of the flowsheet, 34 to installed spares and parallel bodies, 5 utility headers and 13 utility connections, 17 parts of lines after their control stations (SW-RPI-9). The lines that run the rack are on 3 of its tiers (SW-RPI-7), each in a lane given it beforehand, no tier loaded beyond 180 in of lanes at any section: tier 1 25 lines, tier 2 22 lines, tier 3 7 lines. The generator was run 62 times: once for each line that runs the rack or rises in a column's chase, with the branches that tap it, and once for the rest.

| Component | Count |
| --- | --- |
| cap | 5 |
| elbow | 817 |
| flange | 469 |
| gasket | 740 |
| olet | 6 |
| pipe | 1212 |
| reducer | 80 |
| spade | 80 |
| spectacle | 6 |
| tee | 42 |
| valve | 311 |

| Welds | Count |
| --- | --- |
| BW, field | 340 |
| BW, shop | 2064 |
| FW, shop | 22 |

| Supports | Count |
| --- | --- |
| anchor | 58 |
| guide | 127 |
| hanger | 101 |
| shoe | 136 |
| stanchion | 72 |
| trunnion | 57 |

### Checks

| Check (the generator's own, §40) | Found |
| --- | --- |
| every line continuous from end to end | 0 |
| every joint a joint of its class | 0 |
| elbows and the straights between them | 0 |
| valves by class and size | 0 |
| 3 in between lines | 0 |
| 3 in from steel and equipment | 0 |
| spans within SW-PS-7, a support at every rack beam crossed | 9 |

Not at zero, supports:

- 12"-P600-P-11019: unsupported span 260 in > 240 on run from 1350,108,-16
- 24"-P300-P-11022: unsupported span 426 in > 240 on run from 558,486,32
- 8"-P300-P-11036: unsupported span 269 in > 240 on run from 1446,414,245
- 8"-P150-P-11712: unsupported span 255 in > 240 on run from 888,234,95
- 4"-P150-P-11056: unsupported span 245 in > 240 on run from 558,654,89
- 24"-P150-P-11310: unsupported span 280 in > 240 on run from 694,774,-198
- 24"-P150-P-11311: unsupported span 544 in > 240 on run from 610,684,-114
- 6"-P150-LS-11509: unsupported span 454 in > 240 on run from 558,444,-58
- 3"-P150-LS-11511: unsupported span 188 in > 180 on run from 858,348,-377

These runs are longer than a pipe of their size spans and no steel stands where a support would go: lines that cross the yard or run beside the rack away from the support beams. They are listed, not hidden, and want pipe supports of their own.

### Battery limit

| Spool | Stream | Direction | Line | Stands at (x, y, z), in | Tier | Lane |
| --- | --- | --- | --- | --- | --- | --- |
| BL-1105 | straight-run naphtha | out | 6"-P150-P-11705 | 150, 204, -150 | 1 | — |
| BL-1107 | straight-run kerosene | out | 4"-P150-P-11711 | 150, 198, -132 | 1 | -108 |
| BL-1102 | stripped water | in | 4"-P150-P-11007 | 150, 198, -12 | 1 | 12 |
| BL-1110 | atmospheric residue | out | 8"-P300-P-11716 | 150, 204, 30 | 1 | 54 |
| BL-1111 | vacuum gas oil pumparound supply | in | 8"-P300-P-11062 | 150, 204, 60 | 1 | 72 |
| BL-1112 | vacuum gas oil pumparound return | out | 8"-P300-P-11063 | 150, 204, 90 | 1 | 90 |
| BL-1108 | straight-run diesel | out | 6"-P150-P-11713 | 150, 204, 120 | 1 | 144 |
| BL-1103 | desalter brine | out | 3"-P150-P-11701 | 150, 198, 138 | 1 | — |
| BL-1106 | sour water | out | 3"-P150-P-11706 | 150, 198, 156 | 1 | — |
| BL-1114 | vacuum residue rundown | out | 6"-P150-P-11066 | 150, 276, -6 | 2 | 0 |
| BL-1113 | vacuum residue hot | in | 6"-P600-P-11064 | 150, 276, 24 | 2 | 18 |
| BL-1104 | crude overhead gas | out | 3"-P150-P-11026 | 150, 270, 78 | 2 | 84 |
| BL-1109 | atmospheric gas oil | out | 3"-P150-P-11715 | 150, 270, 102 | 2 | 108 |
| BL-1118 | low-pressure steam | out | 8"-P150-LS-11404 | 150, 348, -48 | 3 | -48 |
| BL-1116 | cooling water return | out | 10"-P150-CWR-11402 | 240, 348, -24 | 3 | -24 |
| BL-1115 | cooling water supply | in | 10"-P150-CWS-11401 | 150, 348, 0 | 3 | 0 |
| BL-1117 | boiler feed water | in | 2"-P1200-SC-11403 | 240, 342, 24 | 3 | 24 |
| BL-1119 | fuel gas to users | in | 4"-P150-P-11405 | 150, 342, 42 | 3 | 42 |
| BL-1101 | crude | in | 16"-P150-P-11001 | 240, 348, 66 | 3 | — |

### Control valve stations

Each stands at grade under the rack, on a spool that divides its line (SW-RPI-9): the flowsheet's control valves, and those of the utility connections that are fed or drained under control (boiler feed water to a steam generator, condensate from a steam heater: SW-PRC-19).

| Line | Station | Spool | Stands at (x, y, z), in | The line after it |
| --- | --- | --- | --- | --- |
| 3"-P300-P-11012 | piped | CS-1101 | 444, 36, 144 | 3"-P150-P-11701 |
| 12"-P600-P-11016 | piped | CS-1102 | 1872, 36, -108 | 12"-P150-P-11702 |
| 12"-P600-P-11021 | piped | CS-1103 | 2892, 36, -108 | 12"-P600-P-11703 |
| 6"-P150-P-11028 | piped | CS-1104 | 558, 36, -144 | 6"-P150-P-11704 |
| 6"-P300-P-11030 | piped | CS-1105 | 450, 36, -72 | 6"-P150-P-11705 |
| 3"-P150-P-11032 | piped | CS-1106 | 444, 36, 0 | 3"-P150-P-11706 |
| 8"-P300-P-11036 | piped | CS-1107 | 738, 36, -36 | 8"-P150-P-11707 |
| 10"-P300-P-11039 | piped | CS-1108 | 558, 36, 72 | 10"-P150-P-11708 |
| 10"-P300-P-11042 | piped | CS-1109 | 1428, 36, 0 | 10"-P150-P-11709 |
| 6"-P150-P-11043 | piped | CS-1110 | 948, 36, -144 | 6"-P150-P-11710 |
| 4"-P300-P-11048 | piped | CS-1111 | 864, 36, 144 | 4"-P150-P-11711 |
| 8"-P150-P-11049 | piped | CS-1112 | 1548, 36, 108 | 8"-P150-P-11712 |
| 6"-P300-P-11054 | piped | CS-1113 | 864, 36, 72 | 6"-P150-P-11713 |
| 6"-P150-P-11055 | piped | CS-1114 | 1518, 36, -144 | 6"-P150-P-11714 |
| 3"-P300-P-11059 | piped | CS-1115 | 1404, 36, -72 | 3"-P150-P-11715 |
| 8"-P300-P-11061 | piped | CS-1116 | 1704, 36, 108 | 8"-P300-P-11716 |
| 2"-P1200-SC-11507 | piped | CS-1117 | 1872, 36, 36 | 2"-P300-SC-11551 |

### Headers at the battery limit

Each utility header ends at the limit in a block valve and a spool on the top tier, in its own lane, and runs straight through the valve; the plant's header joins it on the pipeway's side (SW-RPI-15, SW-PWY-12). 5 headers carried on in line to their block valves at the battery limit, the cap there left out: 8"-P150-LS-11404 from BL-1118-U, its first piece 183.2 in longer, a shoe at x 360; 10"-P150-CWR-11402 from BL-1116-U, its first piece 111.0 in longer, a shoe at x 360; 10"-P150-CWS-11401 from BL-1115-U, its first piece 201.0 in longer, a shoe at x 360; 2"-P1200-SC-11403 from BL-1117-U, its first piece 103.7 in longer, a shoe at x 360; 4"-P150-P-11405 from BL-1119-U, its first piece 189.1 in longer, a shoe at x 360.

### Connections without a valve

At these ends the valve the generator stands at every equipment connection is not built, and the line's own flange meets the nozzle (SW-RPI-14): a transfer line from a fired heater, a line from a column's top, an ejector set's drains and its connections under its deck.

- 24"-P300-P-11022: no valve at H-1101-N2; GATE 24 and what stood with it left out, 3 pieces, the pipe 35.1 in longer
- 24"-P300-P-11022: no valve at C-1101-N2; GATE 24 and what stood with it left out, 5 pieces, the pipe 36.9 in longer
- 24"-P150-P-11023: no valve at C-1101-N3; GATE 24 and what stood with it left out, 5 pieces, the pipe 36.5 in longer
- 24"-P150-P-11023: no valve at A-1101A-N1; GATE 24 and what stood with it left out, 3 pieces, the pipe 35.1 in longer

### Lines

| Line | Kind | Fluid | From | To | Design | Rack tier | Components | Welds | Supports | Length, ft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 16"-P150-P-11001 | process | crude oil | BL-1101-U | P-1101A-S | 120 psi, 150 °F | — | 27 | 16 | 1 | 51 |
| 12"-P600-P-11002 | process | crude oil | P-1101A-D | E-1101-N1 | 390 psi, 150 °F | — | 30 | 17 | 2 | 54 |
| 12"-P600-P-11003 | process | crude oil | E-1101-N2 | E-1102-N1 | 390 psi, 155 °F | — | 21 | 10 | 1 | 24 |
| 12"-P600-P-11004 | process | crude oil | E-1102-N2 | E-1103-N1 | 390 psi, 175 °F | — | 21 | 10 | 1 | 24 |
| 12"-P600-P-11005 | process | crude oil | E-1103-N2 | E-1104-N1 | 390 psi, 235 °F | — | 21 | 10 | 1 | 24 |
| 12"-P600-P-11006 | process | crude oil | E-1104-N2 | D-1101-N1 | 390 psi, 320 °F | 1 | 38 | 27 | 7 | 180 |
| 4"-P150-P-11007 | process | process and wash water | BL-1102-U | P-1102A-S | 125 psi, 170 °F | 1 | 33 | 22 | 2 | 77 |
| 3"-P300-P-11008 | process | process and wash water | P-1102A-D | E-1105-N1 | 285 psi, 160 °F | 2 | 37 | 24 | 8 | 127 |
| 3"-P300-P-11009 | process | process and wash water | E-1105-N2 | tap 12"-P600-P-11006 | 285 psi, 270 °F | — | 14 | 9 | 0 | 19 |
| 3"-P300-P-11010 | process | oily water | D-1101-N2 | E-1105-N3 | 175 psi, 320 °F | 2 | 32 | 23 | 19 | 222 |
| 3"-P300-P-11011 | process | oily water | E-1105-N4 | E-1112-N1 | 165 psi, 210 °F | — | 23 | 12 | 2 | 36 |
| 3"-P300-P-11012 | process | oily water | E-1112-N2 | CS-1101-A | 155 psi, 160 °F | 2 | 52 | 31 | 7 | 118 |
| 3"-P150-P-11701 | control | oily water | CS-1101-B | BL-1103-U | 110 psi, 160 °F | — | 19 | 12 | 1 | 34 |
| 16"-P300-P-11013 | process | crude oil | D-1101-N3 | P-1103A-S | 175 psi, 320 °F | — | 27 | 16 | 2 | 72 |
| 12"-P600-P-11014 | process | crude oil | P-1103A-D | E-1106-N1 | 400 psi, 320 °F | 1 | 40 | 27 | 5 | 162 |
| 12"-P600-P-11015 | process | crude oil | E-1106-N2 | E-1107-N1 | 400 psi, 335 °F | — | 21 | 10 | 1 | 25 |
| 12"-P600-P-11016 | process | crude oil | E-1107-N2 | CS-1102-A | 400 psi, 450 °F | 1 | 48 | 27 | 5 | 140 |
| 12"-P150-P-11702 | control | crude oil | CS-1102-B | D-1102-N1 | 70 psi, 450 °F | — | 22 | 13 | 3 | 74 |
| 8"-P150-P-11017 | process | naphtha | D-1102-N2 | C-1101-N1 | 70 psi, 450 °F | 1 | 35 | 28 | 10 | 314 |
| 16"-P150-P-11018 | process | crude oil | D-1102-N3 | P-1104A-S | 70 psi, 450 °F | — | 33 | 22 | 0 | 58 |
| 12"-P600-P-11019 | process | crude oil | P-1104A-D | E-1108-N1 | 455 psi, 450 °F | 1 | 38 | 25 | 6 | 164 |
| 12"-P600-P-11020 | process | crude oil | E-1108-N2 | E-1109-N1 | 455 psi, 505 °F | — | 23 | 12 | 1 | 37 |
| 12"-P600-P-11021 | process | crude oil | E-1109-N2 | CS-1103-A | 455 psi, 555 °F | 1 | 48 | 27 | 9 | 191 |
| 12"-P600-P-11703 | control | crude oil | CS-1103-B | H-1101-N1 | 455 psi, 555 °F | 1 | 23 | 16 | 4 | 135 |
| 24"-P300-P-11022 | process | crude oil | H-1101-N2 | C-1101-N2 | 60 psi, 730 °F | 3 | 22 | 19 | 16 | 333 |
| 24"-P150-P-11023 | process | naphtha | C-1101-N3 | A-1101A-N1 | 50 psi, 300 °F | — | 22 | 19 | 0 | 122 |
| 10"-P150-P-11024 | process | naphtha | A-1101A-N2 | E-1110-N1 | 50 psi, 190 °F | 3 | 37 | 28 | 9 | 190 |
| 10"-P150-P-11025 | process | naphtha | E-1110-N2 | D-1103-N1 | 50 psi, 150 °F | 1 | 32 | 21 | 7 | 178 |
| 3"-P150-P-11026 | process | hydrocarbon gas | D-1103-N2 | BL-1104-U | 50 psi, 150 °F | 2 | 28 | 21 | 23 | 271 |
| 8"-P150-P-11027 | process | naphtha | D-1103-N3 | P-1112A-S | 50 psi, 150 °F | — | 31 | 18 | 1 | 49 |
| 6"-P150-P-11028 | process | naphtha | P-1112A-D | CS-1104-A | 125 psi, 150 °F | 1 | 55 | 32 | 11 | 229 |
| 6"-P150-P-11704 | control | naphtha | CS-1104-B | C-1101-N4 | 125 psi, 150 °F | — | 25 | 16 | 2 | 155 |
| 8"-P150-P-11029 | process | naphtha | D-1103-N4 | P-1113A-S | 50 psi, 150 °F | — | 29 | 18 | 1 | 50 |
| 6"-P300-P-11030 | process | naphtha | P-1113A-D | CS-1105-A | 200 psi, 150 °F | 1 | 56 | 33 | 10 | 212 |
| 6"-P150-P-11705 | control | naphtha | CS-1105-B | BL-1105-U | 135 psi, 150 °F | — | 19 | 12 | 1 | 38 |
| 3"-P150-P-11031 | process | sour water | D-1103-N5 | P-1114A-S | 50 psi, 150 °F | — | 29 | 18 | 3 | 59 |
| 3"-P150-P-11032 | process | sour water | P-1114A-D | CS-1106-A | 150 psi, 150 °F | 2 | 62 | 39 | 22 | 262 |
| 3"-P150-P-11706 | control | sour water | CS-1106-B | BL-1106-U | 85 psi, 190 °F | — | 19 | 12 | 1 | 44 |
| 12"-P150-P-11033 | process | naphtha | C-1101-N5 | P-1105A-S | 50 psi, 380 °F | — | 31 | 20 | 1 | 133 |
| 10"-P300-P-11034 | process | naphtha | P-1105A-D | E-1101-N3 | 165 psi, 380 °F | — | 32 | 19 | 5 | 97 |
| 10"-P300-P-11035 | process | naphtha | E-1101-N4 | A-1102-N1 | 165 psi, 295 °F | 3 | 32 | 23 | 7 | 173 |
| 8"-P300-P-11036 | process | naphtha | A-1102-N2 | CS-1107-A | 165 psi, 240 °F | 3 | 50 | 31 | 4 | 136 |
| 8"-P150-P-11707 | control | naphtha | CS-1107-B | C-1101-N6 | 50 psi, 240 °F | — | 22 | 15 | 3 | 160 |
| 14"-P150-P-11037 | process | diesel | C-1101-N7 | P-1106A-S | 50 psi, 550 °F | — | 28 | 17 | 1 | 111 |
| 10"-P300-P-11038 | process | diesel | P-1106A-D | E-1104-N3 | 165 psi, 550 °F | — | 32 | 19 | 5 | 99 |
| 10"-P300-P-11039 | process | diesel | E-1104-N4 | CS-1108-A | 165 psi, 420 °F | 1 | 39 | 18 | 1 | 54 |
| 10"-P150-P-11708 | control | diesel | CS-1108-B | C-1101-N8 | 50 psi, 420 °F | — | 21 | 14 | 4 | 139 |
| 14"-P150-P-11040 | process | gas oil | C-1101-N9 | P-1107A-S | 50 psi, 660 °F | 3 | 41 | 30 | 3 | 154 |
| 10"-P300-P-11041 | process | gas oil | P-1107A-D | E-1107-N3 | 165 psi, 660 °F | 1 | 38 | 25 | 4 | 139 |
| 10"-P300-P-11042 | process | gas oil | E-1107-N4 | CS-1109-A | 165 psi, 490 °F | — | 52 | 31 | 5 | 147 |
| 10"-P150-P-11709 | control | gas oil | CS-1109-B | C-1101-N10 | 50 psi, 490 °F | 1 | 31 | 24 | 7 | 178 |
| 6"-P150-P-11043 | process | kerosene | C-1101-N11 | CS-1110-A | 50 psi, 450 °F | 2 | 40 | 21 | 2 | 145 |
| 6"-P150-P-11710 | control | kerosene | CS-1110-B | C-1102-N1 | 50 psi, 450 °F | — | 22 | 15 | 3 | 114 |
| 6"-P150-P-11044 | process | kerosene | C-1102-N2 | C-1101-N12 | 50 psi, 445 °F | 2 | 35 | 28 | 4 | 241 |
| 6"-P150-P-11045 | process | kerosene | C-1102-N3 | P-1108A-S | 50 psi, 440 °F | 2 | 37 | 26 | 4 | 143 |
| 4"-P300-P-11046 | process | kerosene | P-1108A-D | E-1102-N3 | 215 psi, 440 °F | 2 | 36 | 23 | 7 | 161 |
| 4"-P300-P-11047 | process | kerosene | E-1102-N4 | E-1111-N1 | 215 psi, 250 °F | 2 | 32 | 21 | 10 | 222 |
| 4"-P300-P-11048 | process | kerosene | E-1111-N2 | CS-1111-A | 215 psi, 150 °F | 2 | 53 | 32 | 6 | 153 |
| 4"-P150-P-11711 | control | kerosene | CS-1111-B | BL-1107-U | 105 psi, 150 °F | 1 | 24 | 17 | 4 | 95 |
| 8"-P150-P-11049 | process | diesel | C-1101-N13 | CS-1112-A | 50 psi, 590 °F | 1 | 51 | 32 | 7 | 204 |
| 8"-P150-P-11712 | control | diesel | CS-1112-B | C-1102-N4 | 50 psi, 590 °F | 1 | 23 | 16 | 7 | 167 |
| 6"-P150-P-11050 | process | diesel | C-1102-N5 | C-1101-N14 | 50 psi, 585 °F | 2 | 31 | 24 | 4 | 200 |
| 8"-P150-P-11051 | process | diesel | C-1102-N6 | P-1109A-S | 50 psi, 580 °F | 1 | 34 | 23 | 5 | 139 |
| 6"-P300-P-11052 | process | diesel | P-1109A-D | E-1103-N3 | 215 psi, 580 °F | 2 | 34 | 21 | 7 | 162 |
| 6"-P300-P-11053 | process | diesel | E-1103-N4 | A-1103-N1 | 215 psi, 285 °F | 3 | 38 | 29 | 5 | 169 |
| 6"-P300-P-11054 | process | diesel | A-1103-N2 | CS-1113-A | 215 psi, 190 °F | 3 | 43 | 24 | 4 | 109 |
| 6"-P150-P-11713 | control | diesel | CS-1113-B | BL-1108-U | 105 psi, 190 °F | 1 | 24 | 17 | 3 | 78 |
| 6"-P150-P-11055 | process | gas oil | C-1101-N15 | CS-1114-A | 50 psi, 670 °F | 2 | 49 | 30 | 5 | 184 |
| 6"-P150-P-11714 | control | gas oil | CS-1114-B | C-1102-N7 | 50 psi, 670 °F | 2 | 32 | 25 | 5 | 159 |
| 4"-P150-P-11056 | process | gas oil | C-1102-N8 | C-1101-N16 | 50 psi, 665 °F | 2 | 31 | 24 | 5 | 189 |
| 6"-P150-P-11057 | process | gas oil | C-1102-N9 | P-1110A-S | 50 psi, 660 °F | 2 | 41 | 30 | 4 | 147 |
| 4"-P300-P-11058 | process | gas oil | P-1110A-D | E-1106-N3 | 215 psi, 660 °F | 2 | 33 | 20 | 5 | 143 |
| 3"-P300-P-11059 | process | gas oil | E-1106-N4 | CS-1115-A | 215 psi, 430 °F | 2 | 47 | 26 | 9 | 137 |
| 3"-P150-P-11715 | control | gas oil | CS-1115-B | BL-1109-U | 125 psi, 430 °F | 2 | 31 | 24 | 9 | 145 |
| 12"-P150-P-11060 | process | residue | C-1101-N17 | P-1111A-S | 50 psi, 700 °F | 1 | 36 | 23 | 3 | 122 |
| 8"-P300-P-11061 | process | residue | P-1111A-D | CS-1116-A | 270 psi, 700 °F | 1 | 51 | 28 | 5 | 126 |
| 8"-P300-P-11716 | control | residue | CS-1116-B | BL-1110-U | 175 psi, 700 °F | 1 | 27 | 20 | 7 | 155 |
| 8"-P300-P-11062 | process | gas oil | BL-1111-U | E-1108-N3 | 260 psi, 600 °F | 1 | 28 | 19 | 7 | 162 |
| 8"-P300-P-11063 | process | gas oil | E-1108-N4 | BL-1112-U | 260 psi, 500 °F | 1 | 31 | 22 | 7 | 153 |
| 6"-P600-P-11064 | process | residue | BL-1113-U | E-1109-N3 | 155 psi, 740 °F | 2 | 34 | 25 | 7 | 184 |
| 6"-P150-P-11065 | process | residue | E-1109-N4 | E-1113-N1 | 145 psi, 560 °F | 1 | 30 | 19 | 7 | 145 |
| 6"-P150-P-11066 | process | residue | E-1113-N2 | BL-1114-U | 135 psi, 400 °F | 2 | 39 | 30 | 8 | 216 |
| 16"-P150-P-11301 | spare | crude oil | tap 16"-P150-P-11001 | P-1101B-S | 120 psi, 150 °F | — | 23 | 16 | 0 | 36 |
| 12"-P600-P-11302 | spare | crude oil | P-1101B-D | tap 12"-P600-P-11002 | 390 psi, 150 °F | — | 21 | 14 | 0 | 27 |
| 4"-P150-P-11303 | spare | process and wash water | tap 4"-P150-P-11007 | P-1102B-S | 125 psi, 170 °F | — | 13 | 6 | 0 | 5 |
| 3"-P300-P-11304 | spare | process and wash water | P-1102B-D | tap 3"-P300-P-11008 | 285 psi, 160 °F | — | 14 | 7 | 0 | 6 |
| 16"-P300-P-11305 | spare | crude oil | tap 16"-P300-P-11013 | P-1103B-S | 175 psi, 320 °F | — | 21 | 14 | 0 | 37 |
| 12"-P600-P-11306 | spare | crude oil | P-1103B-D | tap 12"-P600-P-11014 | 400 psi, 320 °F | — | 19 | 12 | 0 | 16 |
| 16"-P150-P-11307 | spare | crude oil | tap 16"-P150-P-11018 | P-1104B-S | 70 psi, 450 °F | — | 25 | 18 | 0 | 45 |
| 12"-P600-P-11308 | spare | crude oil | P-1104B-D | tap 12"-P600-P-11019 | 455 psi, 450 °F | — | 19 | 12 | 0 | 17 |
| 24"-P150-P-11309 | spare | naphtha | tap 24"-P150-P-11023 | A-1101B-N1 | 50 psi, 300 °F | — | 12 | 9 | 0 | 40 |
| 24"-P150-P-11310 | spare | naphtha | tap 24"-P150-P-11023 | A-1101C-N1 | 50 psi, 300 °F | — | 11 | 8 | 0 | 49 |
| 24"-P150-P-11311 | spare | naphtha | tap 24"-P150-P-11023 | A-1101D-N1 | 50 psi, 300 °F | — | 18 | 15 | 0 | 95 |
| 10"-P150-P-11312 | spare | naphtha | A-1101B-N2 | tap 10"-P150-P-11024 | 50 psi, 190 °F | — | 13 | 10 | 0 | 21 |
| 10"-P150-P-11313 | spare | naphtha | A-1101C-N2 | tap 10"-P150-P-11024 | 50 psi, 190 °F | — | 9 | 6 | 2 | 32 |
| 10"-P150-P-11314 | spare | naphtha | A-1101D-N2 | tap 10"-P150-P-11024 | 50 psi, 190 °F | — | 11 | 8 | 2 | 45 |
| 8"-P150-P-11315 | spare | naphtha | tap 8"-P150-P-11027 | P-1112B-S | 50 psi, 150 °F | — | 19 | 12 | 0 | 12 |
| 6"-P150-P-11316 | spare | naphtha | P-1112B-D | tap 6"-P150-P-11028 | 125 psi, 150 °F | — | 14 | 7 | 0 | 5 |
| 8"-P150-P-11317 | spare | naphtha | tap 8"-P150-P-11029 | P-1113B-S | 50 psi, 150 °F | — | 19 | 12 | 0 | 12 |
| 6"-P300-P-11318 | spare | naphtha | P-1113B-D | tap 6"-P300-P-11030 | 200 psi, 150 °F | — | 14 | 7 | 0 | 5 |
| 3"-P150-P-11319 | spare | sour water | tap 3"-P150-P-11031 | P-1114B-S | 50 psi, 150 °F | — | 15 | 8 | 0 | 6 |
| 3"-P150-P-11320 | spare | sour water | P-1114B-D | tap 3"-P150-P-11032 | 150 psi, 150 °F | — | 14 | 7 | 0 | 6 |
| 12"-P150-P-11321 | spare | naphtha | tap 12"-P150-P-11033 | P-1105B-S | 50 psi, 380 °F | — | 19 | 12 | 0 | 15 |
| 10"-P300-P-11322 | spare | naphtha | P-1105B-D | tap 10"-P300-P-11034 | 165 psi, 380 °F | — | 20 | 13 | 0 | 17 |
| 14"-P150-P-11323 | spare | diesel | tap 14"-P150-P-11037 | P-1106B-S | 50 psi, 550 °F | — | 19 | 12 | 0 | 26 |
| 10"-P300-P-11324 | spare | diesel | P-1106B-D | tap 10"-P300-P-11038 | 165 psi, 550 °F | — | 24 | 17 | 0 | 21 |
| 14"-P150-P-11325 | spare | gas oil | tap 14"-P150-P-11040 | P-1107B-S | 50 psi, 660 °F | — | 21 | 14 | 0 | 27 |
| 10"-P300-P-11326 | spare | gas oil | P-1107B-D | tap 10"-P300-P-11041 | 165 psi, 660 °F | — | 20 | 13 | 0 | 18 |
| 6"-P150-P-11327 | spare | kerosene | tap 6"-P150-P-11045 | P-1108B-S | 50 psi, 440 °F | — | 13 | 6 | 0 | 5 |
| 4"-P300-P-11328 | spare | kerosene | P-1108B-D | tap 4"-P300-P-11046 | 215 psi, 440 °F | — | 14 | 7 | 0 | 6 |
| 8"-P150-P-11329 | spare | diesel | tap 8"-P150-P-11051 | P-1109B-S | 50 psi, 580 °F | — | 13 | 6 | 0 | 5 |
| 6"-P300-P-11330 | spare | diesel | P-1109B-D | tap 6"-P300-P-11052 | 215 psi, 580 °F | — | 14 | 7 | 0 | 6 |
| 6"-P150-P-11331 | spare | gas oil | tap 6"-P150-P-11057 | P-1110B-S | 50 psi, 660 °F | — | 19 | 12 | 0 | 12 |
| 4"-P300-P-11332 | spare | gas oil | P-1110B-D | tap 4"-P300-P-11058 | 215 psi, 660 °F | — | 14 | 7 | 0 | 6 |
| 12"-P150-P-11333 | spare | residue | tap 12"-P150-P-11060 | P-1111B-S | 50 psi, 700 °F | — | 13 | 6 | 0 | 5 |
| 8"-P300-P-11334 | spare | residue | P-1111B-D | tap 8"-P300-P-11061 | 270 psi, 700 °F | — | 14 | 7 | 0 | 6 |
| 10"-P150-CWS-11401 | header | cooling water supply | BL-1115-U | cap | 140 psi, 150 °F | — | 16 | 12 | 13 | 276 |
| 10"-P150-CWR-11402 | header | cooling water return | BL-1116-U | cap | 70 psi, 155 °F | — | 16 | 12 | 13 | 268 |
| 2"-P1200-SC-11403 | header | boiler feed water | BL-1117-U | cap | 1035 psi, 300 °F | — | 14 | 10 | 26 | 268 |
| 8"-P150-LS-11404 | header | steam, 50 psi | BL-1118-U | cap | 80 psi, 370 °F | — | 15 | 11 | 13 | 276 |
| 4"-P150-P-11405 | header | fuel gas | BL-1119-U | cap | 85 psi, 150 °F | — | 15 | 11 | 13 | 276 |
| 4"-P150-CWS-11501 | utility | cooling water supply | tap 10"-P150-CWS-11401 | E-1112-N3 | 140 psi, 150 °F | — | 31 | 18 | 3 | 95 |
| 4"-P150-CWR-11502 | utility | cooling water return | E-1112-N4 | tap 10"-P150-CWR-11402 | 70 psi, 155 °F | — | 32 | 19 | 3 | 84 |
| 8"-P150-CWS-11503 | utility | cooling water supply | tap 10"-P150-CWS-11401 | E-1110-N3 | 140 psi, 150 °F | — | 33 | 22 | 4 | 97 |
| 8"-P150-CWR-11504 | utility | cooling water return | E-1110-N4 | tap 10"-P150-CWR-11402 | 70 psi, 155 °F | — | 32 | 21 | 3 | 83 |
| 6"-P150-CWS-11505 | utility | cooling water supply | tap 10"-P150-CWS-11401 | E-1111-N3 | 140 psi, 150 °F | — | 33 | 22 | 5 | 95 |
| 6"-P150-CWR-11506 | utility | cooling water return | E-1111-N4 | tap 10"-P150-CWR-11402 | 70 psi, 155 °F | — | 32 | 21 | 3 | 87 |
| 2"-P1200-SC-11507 | utility | boiler feed water | tap 2"-P1200-SC-11403 | CS-1117-A | 1035 psi, 300 °F | — | 40 | 21 | 1 | 31 |
| 2"-P300-SC-11551 | control | boiler feed water | CS-1117-B | E-1113-N3 | 175 psi, 300 °F | — | 22 | 13 | 5 | 74 |
| 8"-P150-LS-11508 | utility | steam, 50 psi | E-1113-N4 | tap 8"-P150-LS-11404 | 80 psi, 370 °F | — | 25 | 16 | 3 | 91 |
| 6"-P150-LS-11509 | utility | steam, 50 psi | tap 8"-P150-LS-11404 | C-1101-N18 | 80 psi, 370 °F | — | 17 | 10 | 0 | 53 |
| 3"-P150-LS-11510 | utility | steam, 50 psi | tap 8"-P150-LS-11404 | C-1102-N10 | 80 psi, 370 °F | — | 26 | 19 | 3 | 90 |
| 3"-P150-LS-11511 | utility | steam, 50 psi | tap 8"-P150-LS-11404 | C-1102-N11 | 80 psi, 370 °F | — | 27 | 20 | 2 | 75 |
| 3"-P150-LS-11512 | utility | steam, 50 psi | tap 8"-P150-LS-11404 | C-1102-N12 | 80 psi, 370 °F | — | 25 | 18 | 3 | 55 |
| 4"-P150-P-11513 | utility | fuel gas | tap 4"-P150-P-11405 | H-1101-N3 | 85 psi, 150 °F | — | 18 | 11 | 1 | 42 |

## Unit 12: Vacuum distillation

62 lines: 24 of the flowsheet, 12 to installed spares and parallel bodies, 6 utility headers and 9 utility connections, 11 parts of lines after their control stations (SW-RPI-9). The lines that run the rack are on 3 of its tiers (SW-RPI-7), each in a lane given it beforehand, no tier loaded beyond 72 in of lanes at any section: tier 1 9 lines, tier 2 4 lines, tier 3 1 lines. The generator was run 24 times: once for each line that runs the rack or rises in a column's chase, with the branches that tap it, and once for the rest.

| Component | Count |
| --- | --- |
| cap | 6 |
| elbow | 279 |
| flange | 218 |
| gasket | 308 |
| olet | 3 |
| pipe | 443 |
| reducer | 38 |
| spade | 18 |
| spectacle | 1 |
| tee | 21 |
| valve | 133 |

| Welds | Count |
| --- | --- |
| BW, field | 132 |
| BW, shop | 769 |
| FW, shop | 11 |

| Supports | Count |
| --- | --- |
| anchor | 20 |
| guide | 47 |
| hanger | 28 |
| shoe | 47 |
| stanchion | 33 |
| trunnion | 23 |

### Checks

| Check (the generator's own, §40) | Found |
| --- | --- |
| every line continuous from end to end | 0 |
| every joint a joint of its class | 0 |
| elbows and the straights between them | 0 |
| valves by class and size | 0 |
| 3 in between lines | 0 |
| 3 in from steel and equipment | 0 |
| spans within SW-PS-7, a support at every rack beam crossed | 1 |

Not at zero, supports:

- 48"-P150-P-12003: unsupported span 392 in > 240 on run from 600,1716,-692

These runs are longer than a pipe of their size spans and no steel stands where a support would go: lines that cross the yard or run beside the rack away from the support beams. They are listed, not hidden, and want pipe supports of their own.

### Battery limit

| Spool | Stream | Direction | Line | Stands at (x, y, z), in | Tier | Lane |
| --- | --- | --- | --- | --- | --- | --- |
| BL-1203 | sour water | out | 3"-P150-P-12703 | 150, 198, -84 | 1 | — |
| BL-1202 | slop oil | out | 3"-P150-P-12702 | 150, 198, -66 | 1 | — |
| BL-1201 | atmospheric residue | in | 8"-P300-P-12001 | 150, 204, -42 | 1 | -36 |
| BL-1205 | vacuum gas oil pumparound supply | out | 10"-P300-P-12017 | 150, 204, -12 | 1 | -18 |
| BL-1207 | vacuum gas oil pumparound return | in | 8"-P300-P-12020 | 150, 204, 18 | 1 | 18 |
| BL-1208 | vacuum residue hot | out | 6"-P600-P-12708 | 150, 204, 54 | 1 | 54 |
| BL-1206 | heavy vacuum gas oil | out | 6"-P150-P-12706 | 150, 204, 84 | 1 | — |
| BL-1204 | light vacuum gas oil | out | 3"-P150-P-12705 | 150, 270, 12 | 2 | 12 |
| BL-1214 | fuel gas to users | in | 3"-P150-P-12406 | 150, 342, -66 | 3 | -66 |
| BL-1212 | boiler feed water | in | 2"-P1200-SC-12404 | 240, 342, -48 | 3 | -48 |
| BL-1210 | cooling water supply | in | 12"-P150-CWS-12402 | 150, 348, -24 | 3 | -24 |
| BL-1209 | medium-pressure steam | out | 6"-P300-LS-12401 | 240, 348, 0 | 3 | 0 |
| BL-1211 | cooling water return | out | 12"-P150-CWR-12403 | 150, 348, 24 | 3 | 24 |
| BL-1213 | low-pressure steam | in | 4"-P150-LS-12405 | 240, 342, 48 | 3 | 48 |

### Control valve stations

Each stands at grade under the rack, on a spool that divides its line (SW-RPI-9): the flowsheet's control valves, and those of the utility connections that are fed or drained under control (boiler feed water to a steam generator, condensate from a steam heater: SW-PRC-19).

| Line | Station | Spool | Stands at (x, y, z), in | The line after it |
| --- | --- | --- | --- | --- |
| 8"-P300-P-12001 | piped | CS-1201 | 1848, 36, -108 | 8"-P300-P-12701 |
| 3"-P150-P-12009 | piped | CS-1202 | 444, 36, -108 | 3"-P150-P-12702 |
| 3"-P300-P-12011 | piped | CS-1203 | 444, 36, -36 | 3"-P150-P-12703 |
| 8"-P300-P-12014 | piped | CS-1204 | 690, 36, -108 | 8"-P150-P-12704 |
| 3"-P300-P-12015 | piped | CS-1205 | 528, 36, 108 | 3"-P150-P-12705 |
| 6"-P300-P-12019 | piped | CS-1206 | 450, 36, 36 | 6"-P150-P-12706 |
| 8"-P300-P-12020 | piped | CS-1207 | 870, 36, 0 | 8"-P150-P-12707 |
| 6"-P600-P-12022 | piped | CS-1208 | 684, 36, 108 | 6"-P600-P-12708 |
| 3"-P300-P-12024 | piped | CS-1209 | 1500, 36, -108 | 3"-P150-P-12709 |
| 2"-P1200-SC-12504 | piped | CS-1210 | 1476, 36, 108 | 2"-P300-SC-12551 |
| 2"-P1200-SC-12506 | piped | CS-1211 | 1014, 36, 108 | 2"-P300-SC-12552 |

### Headers at the battery limit

Each utility header ends at the limit in a block valve and a spool on the top tier, in its own lane, and runs straight through the valve; the plant's header joins it on the pipeway's side (SW-RPI-15, SW-PWY-12). 6 headers carried on in line to their block valves at the battery limit, the cap there left out: 3"-P150-P-12406 from BL-1214-U, its first piece 191.1 in longer, a shoe at x 360 and 240; 2"-P1200-SC-12404 from BL-1212-U, its first piece 103.7 in longer, a shoe at x 360; 12"-P150-CWS-12402 from BL-1210-U, its first piece 200.1 in longer, a shoe at x 360; 6"-P300-LS-12401 from BL-1209-U, its first piece 99.8 in longer, a shoe at x 360; 12"-P150-CWR-12403 from BL-1211-U, its first piece 200.1 in longer, a shoe at x 360; 4"-P150-LS-12405 from BL-1213-U, its first piece 98.0 in longer, a shoe at x 360.

### Connections without a valve

At these ends the valve the generator stands at every equipment connection is not built, and the line's own flange meets the nozzle (SW-RPI-14): a transfer line from a fired heater, a line from a column's top, an ejector set's drains and its connections under its deck.

- 36"-P300-P-12002: no valve at H-1201-N2; GATE 36 and what stood with it left out, 3 pieces, the pipe 50.7 in longer
- 36"-P300-P-12002: no valve at C-1201-N1; GATE 36 and what stood with it left out, 5 pieces, the pipe 53.3 in longer
- 48"-P150-P-12003: no valve at C-1201-N2; GATE 48 and what stood with it left out, 5 pieces, the pipe 68.2 in longer
- 48"-P150-P-12003: no valve at J-1201-N1; GATE 48 and what stood with it left out, 3 pieces, the pipe 65.7 in longer
- 3"-P150-P-12004: no valve at J-1201-N2; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer
- 3"-P150-P-12004: no valve at D-1201-N1; GATE 3 and what stood with it left out, 5 pieces, the pipe 14.1 in longer
- 3"-P150-P-12005: no valve at J-1201-N3; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer
- 3"-P150-P-12005: no valve at D-1201-N2; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer
- 3"-P150-P-12006: no valve at J-1201-N4; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer
- 3"-P150-P-12006: no valve at D-1201-N3; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer
- 6"-P300-LS-12501: no valve at J-1201-N5; GLOBE 6 and what stood with it left out, 3 pieces, the pipe 16.2 in longer
- 12"-P150-CWS-12502: no valve at J-1201-N6; BFLY 12 and GLOBE 12 and what stood with them left out, 11 pieces, the pipe 48.3 in longer
- 12"-P150-CWR-12503: no valve at J-1201-N7; BFLY 12 and GLOBE 12 and what stood with them left out, 11 pieces, the pipe 48.3 in longer

3 floor penetrations: a sleeve where a line passes down through a deck's grating (SW-PEN-1).

### Lines

| Line | Kind | Fluid | From | To | Design | Rack tier | Components | Welds | Supports | Length, ft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 8"-P300-P-12001 | process | residue | BL-1201-U | CS-1201-A | 175 psi, 700 °F | 1 | 45 | 26 | 6 | 154 |
| 8"-P300-P-12701 | control | residue | CS-1201-B | H-1201-N1 | 175 psi, 700 °F | 1 | 21 | 14 | 2 | 88 |
| 36"-P300-P-12002 | process | residue | H-1201-N2 | C-1201-N1 | 50 psi, 800 °F | 3 | 37 | 34 | 6 | 322 |
| 48"-P150-P-12003 | process | hydrocarbon gas | C-1201-N2 | J-1201-N1 | 50 psi, 200 °F | — | 10 | 7 | 0 | 101 |
| 3"-P150-P-12004 | process | hydrocarbon gas | J-1201-N2 | D-1201-N1 | 50 psi, 275 °F | — | 6 | 3 | 0 | 37 |
| 3"-P150-P-12005 | process | oily water | J-1201-N3 | D-1201-N2 | 50 psi, 170 °F | — | 6 | 3 | 0 | 37 |
| 3"-P150-P-12006 | process | sour water | J-1201-N4 | D-1201-N3 | 50 psi, 220 °F | — | 6 | 3 | 0 | 37 |
| 3"-P150-P-12007 | process | hydrocarbon gas | D-1201-N4 | H-1201-N3 | 50 psi, 180 °F | 1 | 29 | 22 | 16 | 205 |
| 3"-P150-P-12008 | process | oily water | D-1201-N5 | P-1204A-S | 50 psi, 180 °F | — | 30 | 19 | 4 | 89 |
| 3"-P150-P-12009 | process | oily water | P-1204A-D | CS-1202-A | 150 psi, 180 °F | 2 | 55 | 32 | 6 | 106 |
| 3"-P150-P-12702 | control | oily water | CS-1202-B | BL-1202-U | 65 psi, 200 °F | — | 19 | 12 | 0 | 35 |
| 3"-P150-P-12010 | process | sour water | D-1201-N6 | P-1205A-S | 50 psi, 180 °F | — | 30 | 19 | 5 | 104 |
| 3"-P300-P-12011 | process | sour water | P-1205A-D | CS-1203-A | 160 psi, 180 °F | 2 | 55 | 32 | 7 | 127 |
| 3"-P150-P-12703 | control | sour water | CS-1203-B | BL-1203-U | 85 psi, 190 °F | — | 19 | 12 | 1 | 35 |
| 10"-P150-P-12012 | process | gas oil | C-1201-N3 | P-1201A-S | 50 psi, 350 °F | — | 29 | 18 | 1 | 119 |
| 8"-P300-P-12013 | process | gas oil | P-1201A-D | A-1201A-N1 | 220 psi, 350 °F | — | 29 | 18 | 0 | 58 |
| 8"-P300-P-12014 | process | gas oil | A-1201A-N2 | CS-1204-A | 220 psi, 200 °F | — | 41 | 22 | 1 | 68 |
| 8"-P150-P-12704 | control | gas oil | CS-1204-B | C-1201-N4 | 50 psi, 200 °F | — | 23 | 16 | 2 | 140 |
| 3"-P300-P-12015 | process | gas oil | tap 8"-P300-P-12014 | CS-1205-A | 220 psi, 200 °F | — | 32 | 17 | 2 | 56 |
| 3"-P150-P-12705 | control | gas oil | CS-1205-B | BL-1204-U | 105 psi, 200 °F | 2 | 19 | 12 | 3 | 60 |
| 14"-P150-P-12016 | process | gas oil | C-1201-N5 | P-1202A-S | 50 psi, 600 °F | — | 28 | 17 | 1 | 89 |
| 10"-P300-P-12017 | process | gas oil | P-1202A-D | BL-1205-U | 260 psi, 600 °F | 1 | 36 | 25 | 2 | 81 |
| 6"-P300-P-12018 | process | gas oil | tap 10"-P300-P-12017 | E-1201-N1 | 260 psi, 600 °F | — | 12 | 7 | 1 | 44 |
| 6"-P300-P-12019 | process | gas oil | E-1201-N2 | CS-1206-A | 260 psi, 450 °F | — | 41 | 20 | 0 | 47 |
| 6"-P150-P-12706 | control | gas oil | CS-1206-B | BL-1206-U | 125 psi, 450 °F | — | 15 | 8 | 1 | 35 |
| 8"-P300-P-12020 | process | gas oil | BL-1207-U | CS-1207-A | 260 psi, 500 °F | 1 | 45 | 26 | 1 | 67 |
| 8"-P150-P-12707 | control | gas oil | CS-1207-B | C-1201-N6 | 50 psi, 500 °F | 1 | 26 | 19 | 4 | 149 |
| 8"-P300-P-12021 | process | residue | C-1201-N7 | P-1203A-S | 50 psi, 740 °F | 1 | 39 | 26 | 3 | 93 |
| 6"-P600-P-12022 | process | residue | P-1203A-D | CS-1208-A | 260 psi, 740 °F | — | 44 | 21 | 2 | 45 |
| 6"-P600-P-12708 | control | residue | CS-1208-B | BL-1208-U | 155 psi, 740 °F | 1 | 16 | 9 | 3 | 55 |
| 3"-P600-P-12023 | process | residue | tap 6"-P600-P-12022 | E-1202-N1 | 260 psi, 740 °F | — | 18 | 13 | 4 | 59 |
| 3"-P300-P-12024 | process | residue | E-1202-N2 | CS-1209-A | 260 psi, 550 °F | 1 | 46 | 25 | 11 | 127 |
| 3"-P150-P-12709 | control | residue | CS-1209-B | C-1201-N8 | 50 psi, 550 °F | 2 | 33 | 26 | 9 | 256 |
| 3"-P150-P-12301 | spare | oily water | tap 3"-P150-P-12008 | P-1204B-S | 50 psi, 180 °F | — | 17 | 10 | 0 | 8 |
| 3"-P150-P-12302 | spare | oily water | P-1204B-D | tap 3"-P150-P-12009 | 150 psi, 180 °F | — | 14 | 7 | 0 | 6 |
| 3"-P150-P-12303 | spare | sour water | tap 3"-P150-P-12010 | P-1205B-S | 50 psi, 180 °F | — | 15 | 8 | 0 | 6 |
| 3"-P300-P-12304 | spare | sour water | P-1205B-D | tap 3"-P300-P-12011 | 160 psi, 180 °F | — | 14 | 7 | 0 | 6 |
| 10"-P150-P-12305 | spare | gas oil | tap 10"-P150-P-12012 | P-1201B-S | 50 psi, 350 °F | — | 19 | 12 | 0 | 13 |
| 8"-P300-P-12306 | spare | gas oil | tap 8"-P300-P-12013 | A-1201B-N1 | 220 psi, 350 °F | — | 13 | 10 | 0 | 20 |
| 8"-P300-P-12307 | spare | gas oil | P-1201B-D | tap 8"-P300-P-12013 | 220 psi, 350 °F | — | 20 | 13 | 0 | 9 |
| 8"-P300-P-12308 | spare | gas oil | A-1201B-N2 | tap 8"-P300-P-12014 | 220 psi, 200 °F | — | 13 | 10 | 0 | 17 |
| 14"-P150-P-12309 | spare | gas oil | tap 14"-P150-P-12016 | P-1202B-S | 50 psi, 600 °F | — | 19 | 12 | 0 | 26 |
| 10"-P300-P-12310 | spare | gas oil | P-1202B-D | tap 10"-P300-P-12017 | 260 psi, 600 °F | — | 20 | 13 | 0 | 14 |
| 8"-P300-P-12311 | spare | residue | tap 8"-P300-P-12021 | P-1203B-S | 50 psi, 740 °F | — | 13 | 6 | 0 | 5 |
| 6"-P600-P-12312 | spare | residue | P-1203B-D | tap 6"-P600-P-12022 | 260 psi, 740 °F | — | 14 | 7 | 0 | 6 |
| 6"-P300-LS-12401 | header | steam, 150 psi | BL-1209-U | cap | 185 psi, 450 °F | — | 12 | 8 | 7 | 148 |
| 12"-P150-CWS-12402 | header | cooling water supply | BL-1210-U | cap | 140 psi, 150 °F | — | 11 | 7 | 7 | 156 |
| 12"-P150-CWR-12403 | header | cooling water return | BL-1211-U | cap | 70 psi, 155 °F | — | 11 | 7 | 7 | 156 |
| 2"-P1200-SC-12404 | header | boiler feed water | BL-1212-U | cap | 1035 psi, 300 °F | — | 13 | 9 | 14 | 148 |
| 4"-P150-LS-12405 | header | steam, 50 psi | BL-1213-U | cap | 80 psi, 370 °F | — | 11 | 7 | 7 | 148 |
| 3"-P150-P-12406 | header | fuel gas | BL-1214-U | cap | 85 psi, 150 °F | — | 12 | 8 | 15 | 156 |
| 6"-P300-LS-12501 | utility | steam, 150 psi | tap 6"-P300-LS-12401 | J-1201-N5 | 185 psi, 450 °F | — | 17 | 12 | 5 | 114 |
| 12"-P150-CWS-12502 | utility | cooling water supply | tap 12"-P150-CWS-12402 | J-1201-N6 | 140 psi, 150 °F | — | 18 | 15 | 3 | 101 |
| 12"-P150-CWR-12503 | utility | cooling water return | J-1201-N7 | tap 12"-P150-CWR-12403 | 70 psi, 155 °F | — | 24 | 21 | 4 | 108 |
| 2"-P1200-SC-12504 | utility | boiler feed water | tap 2"-P1200-SC-12404 | CS-1210-A | 1035 psi, 300 °F | — | 36 | 17 | 1 | 41 |
| 2"-P300-SC-12551 | control | boiler feed water | CS-1210-B | E-1201-N3 | 275 psi, 300 °F | — | 25 | 16 | 10 | 135 |
| 6"-P300-LS-12505 | utility | steam, 150 psi | E-1201-N4 | tap 6"-P300-LS-12401 | 185 psi, 450 °F | — | 24 | 15 | 3 | 68 |
| 2"-P1200-SC-12506 | utility | boiler feed water | tap 2"-P1200-SC-12404 | CS-1211-A | 1035 psi, 300 °F | — | 36 | 17 | 1 | 41 |
| 2"-P300-SC-12552 | control | boiler feed water | CS-1211-B | E-1202-N3 | 275 psi, 300 °F | — | 23 | 14 | 6 | 85 |
| 3"-P300-LS-12507 | utility | steam, 150 psi | E-1202-N4 | tap 6"-P300-LS-12401 | 185 psi, 450 °F | — | 22 | 13 | 3 | 66 |
| 4"-P150-LS-12508 | utility | steam, 50 psi | tap 4"-P150-LS-12405 | C-1201-N9 | 80 psi, 370 °F | — | 24 | 17 | 0 | 49 |
| 3"-P150-P-12509 | utility | fuel gas | tap 3"-P150-P-12406 | H-1201-N4 | 85 psi, 150 °F | — | 18 | 11 | 1 | 46 |

## Unit 13: Naphtha hydrotreater and splitter

86 lines: 39 of the flowsheet, 16 to installed spares and parallel bodies, 6 utility headers and 9 utility connections, 14 parts of lines after their control stations (SW-RPI-9), and 2 connections to branch root spools (SW-RPI-8). The lines that run the rack are on 3 of its tiers (SW-RPI-7), each in a lane given it beforehand, no tier loaded beyond 72 in of lanes at any section: tier 1 16 lines, tier 2 5 lines, tier 3 5 lines. The generator was run 33 times: once for each line that runs the rack or rises in a column's chase, with the branches that tap it, and once for the rest.

| Component | Count |
| --- | --- |
| cap | 6 |
| elbow | 426 |
| flange | 286 |
| gasket | 454 |
| olet | 6 |
| pipe | 647 |
| reducer | 42 |
| spade | 34 |
| spectacle | 14 |
| tee | 24 |
| valve | 195 |

| Welds | Count |
| --- | --- |
| BW, field | 196 |
| BW, shop | 1100 |
| FW, shop | 14 |

| Supports | Count |
| --- | --- |
| anchor | 33 |
| guide | 63 |
| hanger | 52 |
| shoe | 103 |
| stanchion | 43 |
| trapeze | 2 |
| trunnion | 35 |

### Checks

| Check (the generator's own, §40) | Found |
| --- | --- |
| every line continuous from end to end | 0 |
| every joint a joint of its class | 0 |
| elbows and the straights between them | 0 |
| valves by class and size | 0 |
| 3 in between lines | 0 |
| 3 in from steel and equipment | 0 |
| spans within SW-PS-7, a support at every rack beam crossed | 3 |

Not at zero, supports:

- 3"-P150-P-13704: no shoe at bent x=360
- 6"-P150-CWS-13501: unsupported span 256 in > 240 on run from 942,108,256
- 2"-P150-CWS-13505: unsupported span 148 in > 120 on run from 1134,372,3

These runs are longer than a pipe of their size spans and no steel stands where a support would go: lines that cross the yard or run beside the rack away from the support beams. They are listed, not hidden, and want pipe supports of their own.

### Battery limit

| Spool | Stream | Direction | Line | Stands at (x, y, z), in | Tier | Lane |
| --- | --- | --- | --- | --- | --- | --- |
| BL-1307 | light naphtha | out | 3"-P150-P-13710 | 150, 198, -66 | 1 | -54 |
| BL-1301 | straight-run naphtha | in | 6"-P150-P-13001 | 150, 204, -48 | 1 | -36 |
| BL-1308 | hydrotreated heavy naphtha | out | 6"-P150-P-13711 | 150, 204, 24 | 1 | 36 |
| BL-1309 | heavy naphtha to storage | out | 6"-P150-P-13712 | 150, 204, 42 | 1 | 54 |
| BL-1303 | reformer net gas | in | 3"-P600-P-13006 | 150, 198, 66 | 1 | 78 |
| BL-1304 | stripped water | in | 3"-P150-P-13012 | 150, 198, 84 | 1 | — |
| BL-1305 | sour water | out | 3"-P150-P-13704 | 150, 198, 102 | 1 | — |
| BL-1306 | stripper gas | out | 3"-P150-P-13706 | 150, 198, 120 | 1 | — |
| BL-1302 | wild naphtha | in | 3"-P150-P-13002 | 150, 270, -12 | 2 | -12 |
| BL-1315 | fuel gas to users | in | 2"-P150-P-13406 | 150, 342, -60 | 3 | -60 |
| BL-1313 | condensate | out | 2"-P150-SC-13404 | 240, 342, -42 | 3 | -42 |
| BL-1311 | cooling water return | out | 6"-P150-CWR-13402 | 150, 348, -24 | 3 | -24 |
| BL-1310 | cooling water supply | in | 6"-P150-CWS-13401 | 240, 348, 0 | 3 | 0 |
| BL-1312 | high-pressure steam | in | 4"-P1200-LS-13403 | 150, 342, 24 | 3 | 24 |
| BL-1314 | medium-pressure steam | in | 4"-P300-LS-13405 | 240, 342, 48 | 3 | 48 |

### Branch roots

Branches that travel the rack start at a spool on it, a block valve on each face (SW-RPI-8).

| Spool | Branch | Connection to the tee | On | Stands at (x, y, z), in | Tier |
| --- | --- | --- | --- | --- | --- |
| RS-1301 | 3"-P600-P-13006 | 3"-P600-P-13601 | 3"-P600-P-13005 | 720, 198, 78 | 1 |
| RS-1302 | 3"-P150-P-13032 | 3"-P150-P-13602 | 4"-P150-P-13031 | 1680, 270, 0 | 2 |

### Control valve stations

Each stands at grade under the rack, on a spool that divides its line (SW-RPI-9): the flowsheet's control valves, and those of the utility connections that are fed or drained under control (boiler feed water to a steam generator, condensate from a steam heater: SW-PRC-19).

| Line | Station | Spool | Stands at (x, y, z), in | The line after it |
| --- | --- | --- | --- | --- |
| 6"-P150-P-13001 | piped | CS-1301 | 564, 36, -108 | 6"-P150-P-13701 |
| 3"-P150-P-13002 | piped | CS-1302 | 528, 36, -36 | 3"-P150-P-13702 |
| 10"-P600-P-13008 | piped | CS-1303 | 2892, 36, 72 | 10"-P600-P-13703 |
| 3"-P600-P-13016 | piped | CS-1304 | 444, 36, 36 | 3"-P150-P-13704 |
| 6"-P300-P-13018 | piped | CS-1305 | 1536, 36, -108 | 6"-P300-P-13705 |
| 3"-P300-P-13021 | piped | CS-1306 | 444, 36, 108 | 3"-P150-P-13706 |
| 3"-P300-P-13023 | piped | CS-1307 | 1416, 36, -36 | 3"-P300-P-13707 |
| 6"-P150-P-13027 | piped | CS-1308 | 1776, 36, -36 | 6"-P150-P-13708 |
| 4"-P150-P-13031 | piped | CS-1309 | 1686, 36, -108 | 4"-P150-P-13709 |
| 3"-P150-P-13033 | piped | CS-1310 | 654, 36, -36 | 3"-P150-P-13710 |
| 6"-P300-P-13037 | piped | CS-1311 | 684, 36, 36 | 6"-P150-P-13711 |
| 6"-P300-P-13039 | piped | CS-1312 | 684, 36, 108 | 6"-P150-P-13712 |
| 2"-P1200-SC-13504 | piped | CS-1313 | 1470, 36, 36 | 2"-P150-SC-13551 |
| 2"-P300-SC-13508 | piped | CS-1314 | 1806, 36, 36 | 2"-P150-SC-13552 |

### Headers at the battery limit

Each utility header ends at the limit in a block valve and a spool on the top tier, in its own lane, and runs straight through the valve; the plant's header joins it on the pipeway's side (SW-RPI-15, SW-PWY-12). 6 headers carried on in line to their block valves at the battery limit, the cap there left out: 2"-P150-P-13406 from BL-1315-U, its first piece 194.8 in longer, a shoe at x 360 and 240; 2"-P150-SC-13404 from BL-1313-U, its first piece 104.6 in longer, a shoe at x 360; 6"-P150-CWR-13402 from BL-1311-U, its first piece 203.1 in longer, a shoe at x 360; 6"-P150-CWS-13401 from BL-1310-U, its first piece 113.1 in longer, a shoe at x 360; 4"-P1200-LS-13403 from BL-1312-U, its first piece 188.1 in longer, a shoe at x 360; 4"-P300-LS-13405 from BL-1314-U, its first piece 98.0 in longer, a shoe at x 360.

### Connections without a valve

At these ends the valve the generator stands at every equipment connection is not built, and the line's own flange meets the nozzle (SW-RPI-14): a transfer line from a fired heater, a line from a column's top, an ejector set's drains and its connections under its deck.

- 10"-P600-P-13009: no valve at H-1301-N2; GATE 10 and what stood with it left out, 3 pieces, the pipe 20.0 in longer
- 10"-P600-P-13009: no valve at R-1301-N1; GATE 10 and what stood with it left out, 5 pieces, the pipe 21.1 in longer
- 6"-P300-P-13019: no valve at C-1301-N2; GATE 6 and what stood with it left out, 5 pieces, the pipe 14.8 in longer
- 6"-P300-P-13019: no valve at A-1302-N1; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer
- 12"-P150-P-13028: no valve at C-1302-N2; GATE 12 and what stood with it left out, 5 pieces, the pipe 23.4 in longer
- 12"-P150-P-13028: no valve at A-1303A-N1; GATE 12 and what stood with it left out, 3 pieces, the pipe 22.6 in longer

### Lines

| Line | Kind | Fluid | From | To | Design | Rack tier | Components | Welds | Supports | Length, ft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 6"-P150-P-13001 | process | naphtha | BL-1301-U | CS-1301-A | 135 psi, 150 °F | 1 | 37 | 18 | 0 | 37 |
| 6"-P150-P-13701 | control | naphtha | CS-1301-B | D-1301-N1 | 135 psi, 150 °F | — | 19 | 10 | 2 | 68 |
| 3"-P150-P-13002 | process | naphtha | BL-1302-U | CS-1302-A | 105 psi, 170 °F | 2 | 33 | 14 | 2 | 38 |
| 3"-P150-P-13702 | control | naphtha | CS-1302-B | D-1301-N2 | 105 psi, 170 °F | — | 20 | 13 | 4 | 67 |
| 8"-P150-P-13003 | process | naphtha | D-1301-N3 | P-1301A-S | 55 psi, 150 °F | — | 31 | 18 | 1 | 49 |
| 6"-P600-P-13004 | process | naphtha | P-1301A-D | E-1301-N1 | 595 psi, 150 °F | — | 31 | 18 | 4 | 88 |
| 3"-P600-P-13005 | process | hydrogen-rich gas | D-1302-N1 | K-1301A-N1 | 385 psi, 150 °F | 2 | 30 | 23 | 11 | 149 |
| 3"-P600-P-13006 | process | hydrogen-rich gas | BL-1303-U | RS-1301-B | 395 psi, 160 °F | 1 | 13 | 6 | 3 | 42 |
| 3"-P600-P-13007 | process | hydrogen-rich gas | K-1301A-N2 | tap 6"-P600-P-13004 | 515 psi, 215 °F | — | 8 | 5 | 0 | 11 |
| 10"-P600-P-13008 | process | reactor effluent (oil and hydrogen) | E-1301-N2 | CS-1303-A | 595 psi, 570 °F | 1 | 46 | 25 | 13 | 265 |
| 10"-P600-P-13703 | control | reactor effluent (oil and hydrogen) | CS-1303-B | H-1301-N1 | 595 psi, 570 °F | 1 | 23 | 16 | 3 | 80 |
| 10"-P600-P-13009 | process | reactor effluent (oil and hydrogen) | H-1301-N2 | R-1301-N1 | 455 psi, 650 °F | 1 | 28 | 25 | 4 | 162 |
| 10"-P600-P-13010 | process | reactor effluent (oil and hydrogen) | R-1301-N2 | E-1301-N3 | 425 psi, 660 °F | 1 | 35 | 24 | 11 | 275 |
| 8"-P600-P-13011 | process | reactor effluent (oil and hydrogen) | E-1301-N4 | A-1301A-N1 | 500 psi, 355 °F | — | 27 | 18 | 1 | 82 |
| 3"-P150-P-13012 | process | process and wash water | BL-1304-U | P-1305A-S | 125 psi, 170 °F | — | 35 | 24 | 1 | 71 |
| 3"-P600-P-13013 | process | process and wash water | P-1305A-D | tap 8"-P600-P-13011 | 500 psi, 160 °F | — | 17 | 10 | 0 | 17 |
| 6"-P600-P-13014 | process | reactor effluent (oil and hydrogen) | A-1301A-N2 | E-1302-N1 | 500 psi, 190 °F | — | 21 | 12 | 2 | 77 |
| 6"-P600-P-13015 | process | reactor effluent (oil and hydrogen) | E-1302-N2 | D-1302-N2 | 500 psi, 150 °F | — | 26 | 15 | 5 | 94 |
| 3"-P600-P-13016 | process | sour water | D-1302-N3 | CS-1304-A | 385 psi, 150 °F | 2 | 51 | 32 | 8 | 137 |
| 3"-P150-P-13704 | control | sour water | CS-1304-B | BL-1305-U | 85 psi, 190 °F | — | 15 | 8 | 2 | 37 |
| 6"-P300-P-13017 | process | naphtha | D-1302-N4 | E-1303-N1 | 235 psi, 150 °F | — | 24 | 15 | 4 | 112 |
| 6"-P300-P-13018 | process | naphtha | E-1303-N2 | CS-1305-A | 225 psi, 350 °F | 1 | 42 | 21 | 5 | 111 |
| 6"-P300-P-13705 | control | naphtha | CS-1305-B | C-1301-N1 | 225 psi, 350 °F | — | 31 | 22 | 4 | 122 |
| 6"-P300-P-13019 | process | hydrocarbon gas | C-1301-N2 | A-1302-N1 | 205 psi, 250 °F | 3 | 28 | 25 | 3 | 166 |
| 4"-P300-P-13020 | process | hydrocarbon gas | A-1302-N2 | D-1303-N1 | 200 psi, 170 °F | 3 | 29 | 20 | 7 | 184 |
| 3"-P300-P-13021 | process | hydrocarbon gas | D-1303-N2 | CS-1306-A | 195 psi, 170 °F | 1 | 45 | 26 | 16 | 190 |
| 3"-P150-P-13706 | control | hydrocarbon gas | CS-1306-B | BL-1306-U | 50 psi, 190 °F | — | 17 | 10 | 1 | 32 |
| 3"-P300-P-13022 | process | naphtha | D-1303-N3 | P-1302A-S | 195 psi, 170 °F | — | 31 | 18 | 2 | 43 |
| 3"-P300-P-13023 | process | naphtha | P-1302A-D | CS-1307-A | 270 psi, 170 °F | 1 | 50 | 27 | 4 | 75 |
| 3"-P300-P-13707 | control | naphtha | CS-1307-B | C-1301-N3 | 270 psi, 170 °F | — | 22 | 13 | 4 | 113 |
| 6"-P300-P-13024 | process | naphtha | C-1301-N4 | E-1304-N1 | 210 psi, 435 °F | — | 19 | 10 | 0 | 35 |
| 8"-P300-P-13025 | process | naphtha | E-1304-N2 | C-1301-N5 | 210 psi, 450 °F | — | 17 | 8 | 0 | 39 |
| 6"-P300-P-13026 | process | naphtha | C-1301-N6 | E-1303-N3 | 210 psi, 450 °F | 1 | 32 | 21 | 6 | 133 |
| 6"-P150-P-13027 | process | naphtha | E-1303-N4 | CS-1308-A | 65 psi, 240 °F | 1 | 46 | 25 | 5 | 120 |
| 6"-P150-P-13708 | control | naphtha | CS-1308-B | C-1302-N1 | 65 psi, 240 °F | — | 24 | 15 | 3 | 104 |
| 12"-P150-P-13028 | process | naphtha | C-1302-N2 | A-1303A-N1 | 50 psi, 230 °F | 3 | 29 | 26 | 3 | 203 |
| 4"-P150-P-13029 | process | naphtha | A-1303A-N2 | D-1304-N1 | 50 psi, 180 °F | 3 | 30 | 21 | 5 | 152 |
| 6"-P150-P-13030 | process | naphtha | D-1304-N2 | P-1303A-S | 50 psi, 180 °F | — | 31 | 18 | 1 | 44 |
| 4"-P150-P-13031 | process | naphtha | P-1303A-D | CS-1309-A | 145 psi, 180 °F | 1 | 54 | 31 | 2 | 80 |
| 4"-P150-P-13709 | control | naphtha | CS-1309-B | C-1302-N3 | 145 psi, 180 °F | — | 22 | 13 | 2 | 125 |
| 3"-P150-P-13032 | process | naphtha | RS-1302-B | E-1305-N1 | 145 psi, 180 °F | 2 | 19 | 10 | 8 | 103 |
| 3"-P150-P-13033 | process | naphtha | E-1305-N2 | CS-1310-A | 145 psi, 150 °F | 2 | 49 | 28 | 6 | 106 |
| 3"-P150-P-13710 | control | naphtha | CS-1310-B | BL-1307-U | 75 psi, 150 °F | 1 | 27 | 20 | 3 | 56 |
| 6"-P150-P-13034 | process | naphtha | C-1302-N4 | E-1306-N1 | 50 psi, 350 °F | — | 19 | 10 | 1 | 34 |
| 12"-P150-P-13035 | process | naphtha | E-1306-N2 | C-1302-N5 | 50 psi, 360 °F | — | 17 | 8 | 0 | 37 |
| 8"-P150-P-13036 | process | naphtha | C-1302-N6 | P-1304A-S | 50 psi, 360 °F | — | 25 | 12 | 2 | 46 |
| 6"-P300-P-13037 | process | naphtha | P-1304A-D | CS-1311-A | 160 psi, 360 °F | 1 | 53 | 30 | 5 | 112 |
| 6"-P150-P-13711 | control | naphtha | CS-1311-B | BL-1308-U | 85 psi, 360 °F | 1 | 21 | 14 | 3 | 56 |
| 6"-P300-P-13038 | process | naphtha | tap 6"-P300-P-13037 | A-1304-N1 | 160 psi, 360 °F | — | 17 | 14 | 0 | 56 |
| 6"-P300-P-13039 | process | naphtha | A-1304-N2 | CS-1312-A | 160 psi, 190 °F | 3 | 43 | 24 | 7 | 143 |
| 6"-P150-P-13712 | control | naphtha | CS-1312-B | BL-1309-U | 75 psi, 190 °F | 1 | 27 | 20 | 2 | 64 |
| 3"-P600-P-13601 | root | hydrogen-rich gas | RS-1301-A | tap 3"-P600-P-13005 | 395 psi, 160 °F | — | 11 | 8 | 0 | 13 |
| 3"-P150-P-13602 | root | naphtha | tap 4"-P150-P-13031 | RS-1302-A | 145 psi, 180 °F | — | 11 | 8 | 1 | 19 |
| 8"-P150-P-13301 | spare | naphtha | tap 8"-P150-P-13003 | P-1301B-S | 55 psi, 150 °F | — | 19 | 12 | 0 | 13 |
| 6"-P600-P-13302 | spare | naphtha | P-1301B-D | tap 6"-P600-P-13004 | 595 psi, 150 °F | — | 16 | 9 | 0 | 11 |
| 3"-P600-P-13303 | spare | hydrogen-rich gas | tap 3"-P600-P-13005 | K-1301B-N1 | 385 psi, 150 °F | — | 13 | 10 | 0 | 25 |
| 3"-P600-P-13304 | spare | hydrogen-rich gas | K-1301B-N2 | tap 6"-P600-P-13004 | 515 psi, 215 °F | — | 10 | 7 | 1 | 26 |
| 8"-P600-P-13305 | spare | reactor effluent (oil and hydrogen) | tap 8"-P600-P-13011 | A-1301B-N1 | 500 psi, 355 °F | — | 9 | 6 | 0 | 19 |
| 3"-P150-P-13306 | spare | process and wash water | tap 3"-P150-P-13012 | P-1305B-S | 125 psi, 170 °F | — | 13 | 6 | 0 | 7 |
| 3"-P600-P-13307 | spare | process and wash water | P-1305B-D | tap 8"-P600-P-13011 | 500 psi, 160 °F | — | 21 | 14 | 0 | 16 |
| 6"-P600-P-13308 | spare | reactor effluent (oil and hydrogen) | A-1301B-N2 | tap 6"-P600-P-13014 | 500 psi, 190 °F | — | 13 | 10 | 0 | 20 |
| 3"-P300-P-13309 | spare | naphtha | tap 3"-P300-P-13022 | P-1302B-S | 195 psi, 170 °F | — | 15 | 8 | 0 | 2 |
| 3"-P300-P-13310 | spare | naphtha | P-1302B-D | tap 3"-P300-P-13023 | 270 psi, 170 °F | — | 14 | 7 | 0 | 6 |
| 12"-P150-P-13311 | spare | naphtha | tap 12"-P150-P-13028 | A-1303B-N1 | 50 psi, 230 °F | — | 11 | 8 | 0 | 20 |
| 4"-P150-P-13312 | spare | naphtha | A-1303B-N2 | tap 4"-P150-P-13029 | 50 psi, 180 °F | — | 11 | 8 | 0 | 16 |
| 6"-P150-P-13313 | spare | naphtha | tap 6"-P150-P-13030 | P-1303B-S | 50 psi, 180 °F | — | 19 | 12 | 0 | 8 |
| 4"-P150-P-13314 | spare | naphtha | P-1303B-D | tap 4"-P150-P-13031 | 145 psi, 180 °F | — | 14 | 7 | 0 | 5 |
| 8"-P150-P-13315 | spare | naphtha | tap 8"-P150-P-13036 | P-1304B-S | 50 psi, 360 °F | — | 19 | 12 | 0 | 12 |
| 6"-P300-P-13316 | spare | naphtha | P-1304B-D | tap 6"-P300-P-13037 | 160 psi, 360 °F | — | 14 | 7 | 0 | 5 |
| 6"-P150-CWS-13401 | header | cooling water supply | BL-1310-U | cap | 140 psi, 150 °F | — | 13 | 9 | 12 | 248 |
| 6"-P150-CWR-13402 | header | cooling water return | BL-1311-U | cap | 70 psi, 155 °F | — | 13 | 9 | 12 | 256 |
| 4"-P1200-LS-13403 | header | steam, 600 psi | BL-1312-U | cap | 685 psi, 700 °F | — | 14 | 10 | 12 | 256 |
| 2"-P150-SC-13404 | header | steam condensate | BL-1313-U | cap | 55 psi, 280 °F | — | 15 | 11 | 24 | 248 |
| 4"-P300-LS-13405 | header | steam, 150 psi | BL-1314-U | cap | 185 psi, 450 °F | — | 14 | 10 | 12 | 248 |
| 2"-P150-P-13406 | header | fuel gas | BL-1315-U | cap | 85 psi, 150 °F | — | 15 | 11 | 25 | 256 |
| 6"-P150-CWS-13501 | utility | cooling water supply | tap 6"-P150-CWS-13401 | E-1302-N3 | 140 psi, 150 °F | — | 33 | 22 | 3 | 86 |
| 6"-P150-CWR-13502 | utility | cooling water return | E-1302-N4 | tap 6"-P150-CWR-13402 | 70 psi, 155 °F | — | 32 | 21 | 4 | 75 |
| 4"-P1200-LS-13503 | utility | steam, 600 psi | tap 4"-P1200-LS-13403 | E-1304-N3 | 685 psi, 700 °F | — | 20 | 11 | 3 | 77 |
| 2"-P1200-SC-13504 | utility | steam condensate | E-1304-N4 | CS-1313-A | 650 psi, 660 °F | — | 42 | 21 | 5 | 78 |
| 2"-P150-SC-13551 | control | steam condensate | CS-1313-B | tap 2"-P150-SC-13404 | 55 psi, 280 °F | — | 18 | 11 | 1 | 38 |
| 2"-P150-CWS-13505 | utility | cooling water supply | tap 6"-P150-CWS-13401 | E-1305-N3 | 140 psi, 150 °F | — | 33 | 20 | 6 | 84 |
| 2"-P150-CWR-13506 | utility | cooling water return | E-1305-N4 | tap 6"-P150-CWR-13402 | 70 psi, 155 °F | — | 32 | 19 | 6 | 75 |
| 4"-P300-LS-13507 | utility | steam, 150 psi | tap 4"-P300-LS-13405 | E-1306-N3 | 185 psi, 450 °F | — | 25 | 16 | 3 | 83 |
| 2"-P300-SC-13508 | utility | steam condensate | E-1306-N4 | CS-1314-A | 165 psi, 410 °F | — | 42 | 21 | 5 | 77 |
| 2"-P150-SC-13552 | control | steam condensate | CS-1314-B | tap 2"-P150-SC-13404 | 55 psi, 280 °F | — | 16 | 9 | 1 | 35 |
| 2"-P150-P-13509 | utility | fuel gas | tap 2"-P150-P-13406 | H-1301-N3 | 85 psi, 150 °F | — | 18 | 11 | 4 | 55 |

## Unit 14: Catalytic reformer and hydrogen purification

99 lines: 41 of the flowsheet, 17 to installed spares and parallel bodies, 7 utility headers and 17 utility connections, 15 parts of lines after their control stations (SW-RPI-9), and 2 connections to branch root spools (SW-RPI-8). The lines that run the rack are on 3 of its tiers (SW-RPI-7), each in a lane given it beforehand, no tier loaded beyond 72 in of lanes at any section: tier 1 20 lines, tier 2 7 lines, tier 3 6 lines. The generator was run 38 times: once for each line that runs the rack or rises in a column's chase, with the branches that tap it, and once for the rest.

| Component | Count |
| --- | --- |
| cap | 7 |
| elbow | 486 |
| flange | 309 |
| gasket | 494 |
| olet | 5 |
| pipe | 766 |
| reducer | 32 |
| spade | 31 |
| spectacle | 13 |
| tee | 33 |
| valve | 219 |

| Welds | Count |
| --- | --- |
| BW, field | 231 |
| BW, shop | 1255 |
| FW, shop | 21 |

| Supports | Count |
| --- | --- |
| anchor | 36 |
| guide | 84 |
| hanger | 60 |
| shoe | 179 |
| stanchion | 65 |
| trapeze | 1 |
| trunnion | 43 |

### Checks

| Check (the generator's own, §40) | Found |
| --- | --- |
| every line continuous from end to end | 0 |
| every joint a joint of its class | 0 |
| elbows and the straights between them | 0 |
| valves by class and size | 0 |
| 3 in between lines | 0 |
| 3 in from steel and equipment | 0 |
| spans within SW-PS-7, a support at every rack beam crossed | 7 |

Not at zero, supports:

- 4"-P300-P-14026: unsupported span 260 in > 240 on run from 1410,174,-29
- 6"-P300-P-14027: unsupported span 253 in > 240 on run from 1386,162,500
- 3"-P150-CWS-14505: unsupported span 256 in > 180 on run from 1266,96,179
- 3"-P150-CWR-14506: unsupported span 193 in > 180 on run from 1272,378,163
- 6"-P150-CWR-14508: unsupported span 282 in > 240 on run from 1470,336,500
- 2"-P1200-SC-14510: unsupported span 262 in > 120 on run from 2340,96,-657
- 4"-P150-CWS-14511: unsupported span 260 in > 240 on run from 1578,108,211

These runs are longer than a pipe of their size spans and no steel stands where a support would go: lines that cross the yard or run beside the rack away from the support beams. They are listed, not hidden, and want pipe supports of their own.

### Battery limit

| Spool | Stream | Direction | Line | Stands at (x, y, z), in | Tier | Lane |
| --- | --- | --- | --- | --- | --- | --- |
| BL-1407 | reformer liquefied gas | out | 3"-P300-P-14712 | 150, 198, -72 | 1 | -72 |
| BL-1408 | reformate | out | 4"-P150-P-14713 | 150, 198, -54 | 1 | -60 |
| BL-1402 | heavy naphtha from storage | in | 6"-P150-P-14002 | 150, 204, -30 | 1 | -30 |
| BL-1401 | hydrotreated heavy naphtha | in | 6"-P150-P-14001 | 150, 204, -12 | 1 | -12 |
| BL-1405 | surplus hydrogen | out | 3"-P150-P-14707 | 150, 198, 36 | 1 | 36 |
| BL-1404 | hydrogen | out | 3"-P600-P-14706 | 150, 198, 54 | 1 | — |
| BL-1406 | stabiliser gas | out | 3"-P150-P-14710 | 150, 270, -6 | 2 | 0 |
| BL-1403 | reformer net gas | out | 3"-P600-P-14705 | 150, 270, 12 | 2 | 12 |
| BL-1415 | fuel gas to users | in | 3"-P150-P-14407 | 150, 342, -66 | 3 | -66 |
| BL-1412 | cooling water return | out | 8"-P150-CWR-14404 | 240, 348, -48 | 3 | -48 |
| BL-1410 | low-pressure steam | out | 10"-P150-LS-14402 | 150, 348, -24 | 3 | -24 |
| BL-1409 | high-pressure steam | in | 8"-P1200-LS-14401 | 240, 348, 0 | 3 | 0 |
| BL-1411 | cooling water supply | in | 8"-P150-CWS-14403 | 150, 348, 24 | 3 | 24 |
| BL-1413 | condensate | out | 2"-P150-SC-14405 | 240, 342, 42 | 3 | 42 |
| BL-1414 | boiler feed water | in | 2"-P1200-SC-14406 | 150, 342, 60 | 3 | 60 |

### Branch roots

Branches that travel the rack start at a spool on it, a block valve on each face (SW-RPI-8).

| Spool | Branch | Connection to the tee | On | Stands at (x, y, z), in | Tier |
| --- | --- | --- | --- | --- | --- |
| RS-1401 | 3"-P600-P-14021 | 3"-P600-P-14601 | 3"-P600-P-14020 | 1200, 198, 72 | 1 |
| RS-1402 | 3"-P300-P-14033 | 3"-P300-P-14602 | 3"-P300-P-14032 | 2400, 198, -60 | 1 |

### Control valve stations

Each stands at grade under the rack, on a spool that divides its line (SW-RPI-9): the flowsheet's control valves, and those of the utility connections that are fed or drained under control (boiler feed water to a steam generator, condensate from a steam heater: SW-PRC-19).

| Line | Station | Spool | Stands at (x, y, z), in | The line after it |
| --- | --- | --- | --- | --- |
| 6"-P150-P-14001 | piped | CS-1401 | 564, 36, -108 | 6"-P150-P-14701 |
| 6"-P150-P-14002 | piped | CS-1402 | 564, 36, -36 | 6"-P150-P-14702 |
| 12"-P1200-P-14007 | piped | CS-1403 | 3528, 36, -72 | 12"-P1200-P-14703 |
| 3"-P600-P-14020 | piped | CS-1404 | 1500, 36, -108 | 3"-P600-P-14704 |
| 3"-P600-P-14021 | piped | CS-1405 | 528, 36, 108 | 3"-P600-P-14705 |
| 3"-P600-P-14022 | piped | CS-1406 | 444, 36, 36 | 3"-P600-P-14706 |
| 3"-P150-P-14023 | piped | CS-1407 | 744, 36, 108 | 3"-P150-P-14707 |
| 4"-P150-P-14025 | piped | CS-1408 | 3528, 36, 36 | 4"-P150-P-14708 |
| 6"-P300-P-14027 | piped | CS-1409 | 1956, 36, -108 | 6"-P300-P-14709 |
| 3"-P300-P-14030 | piped | CS-1410 | 684, 36, 36 | 3"-P150-P-14710 |
| 3"-P300-P-14032 | piped | CS-1411 | 2376, 36, -108 | 3"-P300-P-14711 |
| 3"-P300-P-14033 | piped | CS-1412 | 804, 36, -36 | 3"-P300-P-14712 |
| 4"-P300-P-14039 | piped | CS-1413 | 714, 36, -108 | 4"-P150-P-14713 |
| 2"-P1200-SC-14510 | piped | CS-1414 | 2430, 36, -36 | 2"-P150-SC-14551 |
| 2"-P1200-SC-14513 | piped | CS-1415 | 2700, 36, -108 | 2"-P1200-SC-14552 |

### Headers at the battery limit

Each utility header ends at the limit in a block valve and a spool on the top tier, in its own lane, and runs straight through the valve; the plant's header joins it on the pipeway's side (SW-RPI-15, SW-PWY-12). 7 headers carried on in line to their block valves at the battery limit, the cap there left out: 3"-P150-P-14407 from BL-1415-U, its first piece 191.1 in longer, a shoe at x 360 and 240; 8"-P150-CWR-14404 from BL-1412-U, its first piece 111.3 in longer, a shoe at x 360; 10"-P150-LS-14402 from BL-1410-U, its first piece 181.3 in longer, a shoe at x 360; 8"-P1200-LS-14401 from BL-1409-U, its first piece 93.4 in longer, a shoe at x 360; 8"-P150-CWS-14403 from BL-1411-U, its first piece 201.3 in longer, a shoe at x 360; 2"-P150-SC-14405 from BL-1413-U, its first piece 104.6 in longer, a shoe at x 360; 2"-P1200-SC-14406 from BL-1414-U, its first piece 193.7 in longer, a shoe at x 360 and 240.

### Connections without a valve

At these ends the valve the generator stands at every equipment connection is not built, and the line's own flange meets the nozzle (SW-RPI-14): a transfer line from a fired heater, a line from a column's top, an ejector set's drains and its connections under its deck.

- 14"-P1200-P-14008: no valve at H-1401-N2; GATE 14 and what stood with it left out, 3 pieces, the pipe 28.3 in longer
- 14"-P1200-P-14008: no valve at R-1401-N1; GATE 14 and what stood with it left out, 5 pieces, the pipe 30.3 in longer
- 14"-P1200-P-14010: no valve at H-1402-N2; GATE 14 and what stood with it left out, 3 pieces, the pipe 28.3 in longer
- 14"-P1200-P-14010: no valve at R-1402-N1; GATE 14 and what stood with it left out, 5 pieces, the pipe 30.3 in longer
- 14"-P1200-P-14012: no valve at H-1403-N2; GATE 14 and what stood with it left out, 3 pieces, the pipe 28.3 in longer
- 14"-P1200-P-14012: no valve at R-1403-N1; GATE 14 and what stood with it left out, 5 pieces, the pipe 30.3 in longer
- 6"-P300-P-14028: no valve at C-1401-N2; GATE 6 and what stood with it left out, 5 pieces, the pipe 14.8 in longer
- 6"-P300-P-14028: no valve at E-1405-N1; GATE 6 and what stood with it left out, 5 pieces, the pipe 14.8 in longer

### Lines

| Line | Kind | Fluid | From | To | Design | Rack tier | Components | Welds | Supports | Length, ft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 6"-P150-P-14001 | process | naphtha | BL-1401-U | CS-1401-A | 85 psi, 360 °F | 1 | 37 | 18 | 0 | 40 |
| 6"-P150-P-14701 | control | naphtha | CS-1401-B | D-1401-N1 | 85 psi, 360 °F | — | 21 | 12 | 2 | 68 |
| 6"-P150-P-14002 | process | naphtha | BL-1402-U | CS-1402-A | 85 psi, 190 °F | 1 | 39 | 20 | 1 | 37 |
| 6"-P150-P-14702 | control | naphtha | CS-1402-B | D-1401-N2 | 85 psi, 190 °F | — | 18 | 11 | 3 | 74 |
| 8"-P150-P-14003 | process | naphtha | D-1401-N3 | P-1401A-S | 65 psi, 340 °F | — | 33 | 20 | 1 | 47 |
| 6"-P600-P-14004 | process | naphtha | P-1401A-D | E-1401-N1 | 540 psi, 340 °F | — | 33 | 20 | 3 | 75 |
| 8"-P300-P-14005 | process | hydrogen-rich gas | D-1402-N1 | K-1401-N1 | 275 psi, 150 °F | 1 | 24 | 17 | 4 | 118 |
| 8"-P600-P-14006 | process | hydrogen-rich gas | K-1401-N2 | tap 6"-P600-P-14004 | 470 psi, 225 °F | — | 7 | 4 | 0 | 4 |
| 12"-P1200-P-14007 | process | reactor effluent (oil and hydrogen) | E-1401-N2 | CS-1403-A | 540 psi, 850 °F | 1 | 50 | 29 | 15 | 315 |
| 12"-P1200-P-14703 | control | reactor effluent (oil and hydrogen) | CS-1403-B | H-1401-N1 | 540 psi, 850 °F | 1 | 19 | 12 | 1 | 66 |
| 14"-P1200-P-14008 | process | reactor effluent (oil and hydrogen) | H-1401-N2 | R-1401-N1 | 410 psi, 1000 °F | 3 | 24 | 21 | 6 | 181 |
| 14"-P1200-P-14009 | process | reactor effluent (oil and hydrogen) | R-1401-N2 | H-1402-N1 | 400 psi, 900 °F | 3 | 25 | 16 | 5 | 155 |
| 14"-P1200-P-14010 | process | reactor effluent (oil and hydrogen) | H-1402-N2 | R-1402-N1 | 385 psi, 1000 °F | 3 | 26 | 23 | 5 | 152 |
| 14"-P1200-P-14011 | process | reactor effluent (oil and hydrogen) | R-1402-N2 | H-1403-N1 | 375 psi, 940 °F | 1 | 22 | 13 | 6 | 133 |
| 14"-P1200-P-14012 | process | reactor effluent (oil and hydrogen) | H-1403-N2 | R-1403-N1 | 360 psi, 1000 °F | 3 | 33 | 30 | 18 | 413 |
| 14"-P1200-P-14013 | process | reactor effluent (oil and hydrogen) | R-1403-N2 | E-1401-N3 | 350 psi, 970 °F | — | 25 | 14 | 5 | 117 |
| 12"-P600-P-14014 | process | reactor effluent (oil and hydrogen) | E-1401-N4 | A-1401A-N1 | 340 psi, 580 °F | — | 27 | 18 | 1 | 73 |
| 8"-P600-P-14015 | process | reactor effluent (oil and hydrogen) | A-1401A-N2 | E-1402-N1 | 335 psi, 190 °F | — | 21 | 12 | 0 | 54 |
| 8"-P600-P-14016 | process | reactor effluent (oil and hydrogen) | E-1402-N2 | D-1402-N2 | 325 psi, 150 °F | — | 26 | 15 | 4 | 91 |
| 4"-P300-P-14017 | process | hydrogen-rich gas | D-1402-N3 | K-1402A-N1 | 275 psi, 150 °F | — | 22 | 15 | 4 | 86 |
| 3"-P600-P-14018 | process | hydrogen-rich gas | K-1402A-N2 | E-1403-N1 | 585 psi, 280 °F | 1 | 25 | 16 | 7 | 101 |
| 3"-P600-P-14019 | process | hydrogen-rich gas | E-1403-N2 | D-1403-N1 | 575 psi, 160 °F | — | 24 | 13 | 6 | 81 |
| 3"-P600-P-14020 | process | hydrogen-rich gas | D-1403-N2 | CS-1404-A | 570 psi, 160 °F | 2 | 37 | 18 | 4 | 66 |
| 3"-P600-P-14704 | control | hydrogen-rich gas | CS-1404-B | X-1401A-N1 | 570 psi, 160 °F | — | 21 | 14 | 2 | 42 |
| 3"-P600-P-14021 | process | hydrogen-rich gas | RS-1401-B | CS-1405-A | 570 psi, 160 °F | 1 | 34 | 15 | 7 | 81 |
| 3"-P600-P-14705 | control | hydrogen-rich gas | CS-1405-B | BL-1403-U | 395 psi, 160 °F | 2 | 17 | 10 | 3 | 59 |
| 3"-P600-P-14022 | process | hydrogen-rich gas | X-1401A-N2 | CS-1406-A | 560 psi, 160 °F | 2 | 52 | 33 | 12 | 151 |
| 3"-P600-P-14706 | control | hydrogen-rich gas | CS-1406-B | BL-1404-U | 545 psi, 160 °F | — | 15 | 8 | 1 | 33 |
| 3"-P150-P-14023 | process | hydrogen-rich gas | tap 3"-P600-P-14022 | CS-1407-A | 85 psi, 160 °F | — | 27 | 12 | 0 | 8 |
| 3"-P150-P-14707 | control | hydrogen-rich gas | CS-1407-B | BL-1405-U | 85 psi, 160 °F | 1 | 18 | 11 | 5 | 69 |
| 4"-P150-P-14024 | process | fuel gas | X-1401A-N3 | D-1404-N1 | 50 psi, 150 °F | — | 25 | 16 | 0 | 16 |
| 4"-P150-P-14025 | process | fuel gas | D-1404-N2 | CS-1408-A | 50 psi, 150 °F | 2 | 48 | 27 | 12 | 246 |
| 4"-P150-P-14708 | control | fuel gas | CS-1408-B | H-1401-N3 | 50 psi, 150 °F | 2 | 25 | 18 | 3 | 84 |
| 4"-P300-P-14026 | process | reformate | D-1402-N4 | E-1404-N1 | 275 psi, 150 °F | 1 | 32 | 23 | 8 | 152 |
| 6"-P300-P-14027 | process | reformate | E-1404-N2 | CS-1409-A | 265 psi, 350 °F | 1 | 44 | 23 | 5 | 111 |
| 6"-P300-P-14709 | control | reformate | CS-1409-B | C-1401-N1 | 265 psi, 350 °F | — | 21 | 12 | 2 | 98 |
| 6"-P300-P-14028 | process | liquefied petroleum gas | C-1401-N2 | E-1405-N1 | 245 psi, 210 °F | 1 | 25 | 22 | 7 | 230 |
| 3"-P300-P-14029 | process | liquefied petroleum gas | E-1405-N2 | D-1405-N1 | 240 psi, 160 °F | 2 | 32 | 21 | 14 | 173 |
| 3"-P300-P-14030 | process | fuel gas | D-1405-N2 | CS-1410-A | 235 psi, 160 °F | 1 | 43 | 24 | 21 | 211 |
| 3"-P150-P-14710 | control | fuel gas | CS-1410-B | BL-1406-U | 95 psi, 160 °F | 2 | 27 | 20 | 3 | 65 |
| 4"-P300-P-14031 | process | liquefied petroleum gas | D-1405-N3 | P-1402A-S | 235 psi, 160 °F | — | 29 | 18 | 1 | 43 |
| 3"-P300-P-14032 | process | liquefied petroleum gas | P-1402A-D | CS-1411-A | 300 psi, 160 °F | — | 46 | 23 | 0 | 24 |
| 3"-P300-P-14711 | control | liquefied petroleum gas | CS-1411-B | C-1401-N3 | 300 psi, 160 °F | — | 22 | 13 | 2 | 137 |
| 3"-P300-P-14033 | process | liquefied petroleum gas | RS-1402-B | CS-1412-A | 300 psi, 160 °F | 1 | 40 | 21 | 15 | 157 |
| 3"-P300-P-14712 | control | liquefied petroleum gas | CS-1412-B | BL-1407-U | 275 psi, 160 °F | 1 | 28 | 21 | 5 | 77 |
| 8"-P300-P-14034 | process | reformate | C-1401-N4 | E-1406-N1 | 250 psi, 480 °F | — | 19 | 10 | 0 | 35 |
| 10"-P300-P-14035 | process | reformate | E-1406-N2 | C-1401-N5 | 250 psi, 495 °F | — | 17 | 8 | 0 | 38 |
| 6"-P300-P-14036 | process | reformate | C-1401-N6 | E-1404-N3 | 250 psi, 495 °F | 1 | 33 | 22 | 5 | 158 |
| 4"-P300-P-14037 | process | reformate | E-1404-N4 | A-1402-N1 | 240 psi, 280 °F | 3 | 33 | 24 | 2 | 108 |
| 4"-P300-P-14038 | process | reformate | A-1402-N2 | E-1407-N1 | 235 psi, 190 °F | 3 | 30 | 21 | 4 | 122 |
| 4"-P300-P-14039 | process | reformate | E-1407-N2 | CS-1413-A | 225 psi, 150 °F | 1 | 46 | 25 | 6 | 119 |
| 4"-P150-P-14713 | control | reformate | CS-1413-B | BL-1408-U | 75 psi, 150 °F | 1 | 27 | 20 | 2 | 65 |
| 6"-P1200-P-14040 | process | boiler feed water | D-1406-N1 | H-1401-N4 | 660 psi, 530 °F | 1 | 29 | 22 | 7 | 193 |
| 8"-P1200-P-14041 | process | boiler feed water | H-1401-N5 | D-1406-N2 | 660 psi, 540 °F | 1 | 22 | 15 | 7 | 175 |
| 3"-P600-P-14601 | root | hydrogen-rich gas | tap 3"-P600-P-14020 | RS-1401-A | 570 psi, 160 °F | — | 9 | 6 | 0 | 17 |
| 3"-P300-P-14602 | root | liquefied petroleum gas | tap 3"-P300-P-14032 | RS-1402-A | 300 psi, 160 °F | — | 9 | 6 | 0 | 11 |
| 8"-P150-P-14301 | spare | naphtha | tap 8"-P150-P-14003 | P-1401B-S | 65 psi, 340 °F | — | 19 | 12 | 0 | 13 |
| 6"-P600-P-14302 | spare | naphtha | P-1401B-D | tap 6"-P600-P-14004 | 540 psi, 340 °F | — | 20 | 13 | 0 | 12 |
| 12"-P600-P-14303 | spare | reactor effluent (oil and hydrogen) | tap 12"-P600-P-14014 | A-1401B-N1 | 340 psi, 580 °F | — | 8 | 5 | 0 | 21 |
| 8"-P600-P-14304 | spare | reactor effluent (oil and hydrogen) | A-1401B-N2 | tap 8"-P600-P-14015 | 335 psi, 190 °F | — | 13 | 10 | 0 | 16 |
| 4"-P300-P-14305 | spare | hydrogen-rich gas | tap 4"-P300-P-14017 | K-1402B-N1 | 275 psi, 150 °F | — | 11 | 8 | 1 | 18 |
| 3"-P600-P-14306 | spare | hydrogen-rich gas | K-1402B-N2 | tap 3"-P600-P-14018 | 585 psi, 280 °F | — | 7 | 4 | 0 | 18 |
| 3"-P600-P-14307 | spare | hydrogen-rich gas | tap 3"-P600-P-14704 | X-1401B-N1 | 570 psi, 160 °F | — | 7 | 4 | 0 | 13 |
| 3"-P600-P-14308 | spare | hydrogen-rich gas | tap 3"-P600-P-14704 | X-1401C-N1 | 570 psi, 160 °F | — | 7 | 4 | 1 | 28 |
| 3"-P600-P-14309 | spare | hydrogen-rich gas | tap 3"-P600-P-14704 | X-1401D-N1 | 570 psi, 160 °F | — | 8 | 5 | 2 | 42 |
| 3"-P600-P-14310 | spare | hydrogen-rich gas | X-1401B-N2 | tap 3"-P600-P-14022 | 560 psi, 160 °F | — | 15 | 12 | 0 | 16 |
| 3"-P600-P-14311 | spare | hydrogen-rich gas | X-1401C-N2 | tap 3"-P600-P-14022 | 560 psi, 160 °F | — | 15 | 12 | 2 | 30 |
| 3"-P600-P-14312 | spare | hydrogen-rich gas | X-1401D-N2 | tap 3"-P600-P-14022 | 560 psi, 160 °F | — | 16 | 13 | 4 | 45 |
| 4"-P150-P-14313 | spare | fuel gas | X-1401B-N3 | tap 4"-P150-P-14024 | 50 psi, 150 °F | — | 11 | 8 | 0 | 20 |
| 4"-P150-P-14314 | spare | fuel gas | X-1401C-N3 | tap 4"-P150-P-14024 | 50 psi, 150 °F | — | 11 | 8 | 2 | 36 |
| 4"-P150-P-14315 | spare | fuel gas | X-1401D-N3 | tap 4"-P150-P-14024 | 50 psi, 150 °F | — | 12 | 9 | 2 | 53 |
| 4"-P300-P-14316 | spare | liquefied petroleum gas | tap 4"-P300-P-14031 | P-1402B-S | 235 psi, 160 °F | — | 15 | 8 | 0 | 6 |
| 3"-P300-P-14317 | spare | liquefied petroleum gas | P-1402B-D | tap 3"-P300-P-14032 | 300 psi, 160 °F | — | 18 | 11 | 0 | 8 |
| 8"-P1200-LS-14401 | header | steam, 600 psi | BL-1409-U | cap | 685 psi, 700 °F | — | 16 | 12 | 14 | 288 |
| 10"-P150-LS-14402 | header | steam, 50 psi | BL-1410-U | cap | 80 psi, 370 °F | — | 14 | 10 | 14 | 296 |
| 8"-P150-CWS-14403 | header | cooling water supply | BL-1411-U | cap | 140 psi, 150 °F | — | 16 | 12 | 14 | 296 |
| 8"-P150-CWR-14404 | header | cooling water return | BL-1412-U | cap | 70 psi, 155 °F | — | 16 | 12 | 14 | 288 |
| 2"-P150-SC-14405 | header | steam condensate | BL-1413-U | cap | 55 psi, 280 °F | — | 15 | 11 | 28 | 288 |
| 2"-P1200-SC-14406 | header | boiler feed water | BL-1414-U | cap | 1035 psi, 300 °F | — | 15 | 11 | 29 | 296 |
| 3"-P150-P-14407 | header | fuel gas | BL-1415-U | cap | 85 psi, 150 °F | — | 19 | 15 | 29 | 296 |
| 6"-P1200-LS-14501 | utility | steam, 600 psi | tap 8"-P1200-LS-14401 | K-1401-N3 | 685 psi, 700 °F | — | 18 | 11 | 0 | 56 |
| 10"-P150-LS-14502 | utility | steam, 50 psi | K-1401-N4 | tap 10"-P150-LS-14402 | 80 psi, 370 °F | — | 22 | 15 | 2 | 73 |
| 6"-P150-CWS-14503 | utility | cooling water supply | tap 8"-P150-CWS-14403 | E-1402-N3 | 140 psi, 150 °F | — | 33 | 22 | 2 | 75 |
| 6"-P150-CWR-14504 | utility | cooling water return | E-1402-N4 | tap 8"-P150-CWR-14404 | 70 psi, 155 °F | — | 32 | 21 | 4 | 68 |
| 3"-P150-CWS-14505 | utility | cooling water supply | tap 8"-P150-CWS-14403 | E-1403-N3 | 140 psi, 150 °F | — | 33 | 20 | 3 | 72 |
| 3"-P150-CWR-14506 | utility | cooling water return | E-1403-N4 | tap 8"-P150-CWR-14404 | 70 psi, 155 °F | — | 31 | 18 | 3 | 67 |
| 6"-P150-CWS-14507 | utility | cooling water supply | tap 8"-P150-CWS-14403 | E-1405-N3 | 140 psi, 150 °F | — | 33 | 22 | 1 | 74 |
| 6"-P150-CWR-14508 | utility | cooling water return | E-1405-N4 | tap 8"-P150-CWR-14404 | 70 psi, 155 °F | — | 31 | 20 | 1 | 68 |
| 4"-P1200-LS-14509 | utility | steam, 600 psi | tap 8"-P1200-LS-14401 | E-1406-N3 | 685 psi, 700 °F | — | 21 | 12 | 3 | 75 |
| 2"-P1200-SC-14510 | utility | steam condensate | E-1406-N4 | CS-1414-A | 650 psi, 660 °F | — | 42 | 21 | 4 | 66 |
| 2"-P150-SC-14551 | control | steam condensate | CS-1414-B | tap 2"-P150-SC-14405 | 55 psi, 280 °F | — | 16 | 9 | 1 | 35 |
| 4"-P150-CWS-14511 | utility | cooling water supply | tap 8"-P150-CWS-14403 | E-1407-N3 | 140 psi, 150 °F | — | 33 | 20 | 2 | 73 |
| 4"-P150-CWR-14512 | utility | cooling water return | E-1407-N4 | tap 8"-P150-CWR-14404 | 70 psi, 155 °F | — | 32 | 19 | 4 | 66 |
| 2"-P1200-SC-14513 | utility | boiler feed water | tap 2"-P1200-SC-14406 | CS-1415-A | 1035 psi, 300 °F | — | 34 | 15 | 3 | 42 |
| 2"-P1200-SC-14552 | control | boiler feed water | CS-1415-B | D-1406-N3 | 770 psi, 300 °F | — | 17 | 10 | 5 | 47 |
| 6"-P1200-LS-14514 | utility | steam, 600 psi | D-1406-N4 | tap 8"-P1200-LS-14401 | 685 psi, 700 °F | — | 22 | 15 | 1 | 71 |
| 2"-P150-P-14515 | utility | fuel gas | tap 3"-P150-P-14407 | H-1401-N6 | 85 psi, 150 °F | — | 18 | 11 | 2 | 52 |
| 2"-P150-P-14516 | utility | fuel gas | tap 3"-P150-P-14407 | H-1402-N3 | 85 psi, 150 °F | — | 22 | 15 | 3 | 59 |
| 2"-P150-P-14517 | utility | fuel gas | tap 3"-P150-P-14407 | H-1403-N3 | 85 psi, 150 °F | — | 18 | 11 | 6 | 80 |

## Unit 15: Kerosene hydrotreater

65 lines: 32 of the flowsheet, 12 to installed spares and parallel bodies, 4 utility headers and 6 utility connections, 8 parts of lines after their control stations (SW-RPI-9), and 3 connections to branch root spools (SW-RPI-8). The lines that run the rack are on 2 of its tiers (SW-RPI-7), each in a lane given it beforehand, no tier loaded beyond 72 in of lanes at any section: tier 1 16 lines, tier 3 3 lines. The generator was run 23 times: once for each line that runs the rack or rises in a column's chase, with the branches that tap it, and once for the rest.

| Component | Count |
| --- | --- |
| cap | 4 |
| elbow | 311 |
| flange | 211 |
| gasket | 338 |
| olet | 3 |
| pipe | 468 |
| reducer | 36 |
| spade | 30 |
| spectacle | 8 |
| tee | 20 |
| valve | 143 |

| Welds | Count |
| --- | --- |
| BW, field | 144 |
| BW, shop | 804 |
| FW, shop | 15 |

| Supports | Count |
| --- | --- |
| anchor | 23 |
| guide | 47 |
| hanger | 35 |
| shoe | 59 |
| stanchion | 26 |
| trapeze | 1 |
| trunnion | 26 |

### Checks

| Check (the generator's own, §40) | Found |
| --- | --- |
| every line continuous from end to end | 0 |
| every joint a joint of its class | 0 |
| elbows and the straights between them | 0 |
| valves by class and size | 0 |
| 3 in between lines | 0 |
| 3 in from steel and equipment | 0 |
| spans within SW-PS-7, a support at every rack beam crossed | 0 |

### Battery limit

| Spool | Stream | Direction | Line | Stands at (x, y, z), in | Tier | Lane |
| --- | --- | --- | --- | --- | --- | --- |
| BL-1504 | sour water | out | 3"-P150-P-15703 | 150, 198, -48 | 1 | — |
| BL-1501 | straight-run kerosene | in | 4"-P150-P-15001 | 150, 198, -30 | 1 | -24 |
| BL-1507 | treated kerosene | out | 4"-P150-P-15708 | 150, 198, -12 | 1 | -12 |
| BL-1502 | reformer net gas | in | 3"-P600-P-15005 | 150, 198, 6 | 1 | 12 |
| BL-1506 | wild naphtha | out | 3"-P150-P-15707 | 150, 198, 84 | 1 | 90 |
| BL-1503 | stripped water | in | 3"-P150-P-15012 | 150, 198, 102 | 1 | — |
| BL-1505 | stripper gas | out | 3"-P150-P-15705 | 150, 198, 120 | 1 | — |
| BL-1509 | cooling water return | out | 6"-P150-CWR-15402 | 150, 348, -24 | 3 | -24 |
| BL-1508 | cooling water supply | in | 6"-P150-CWS-15401 | 240, 348, 0 | 3 | 0 |
| BL-1510 | medium-pressure steam | in | 3"-P300-LS-15403 | 150, 342, 18 | 3 | 18 |
| BL-1511 | fuel gas to users | in | 2"-P150-P-15404 | 240, 342, 36 | 3 | 36 |

### Branch roots

Branches that travel the rack start at a spool on it, a block valve on each face (SW-RPI-8).

| Spool | Branch | Connection to the tee | On | Stands at (x, y, z), in | Tier |
| --- | --- | --- | --- | --- | --- |
| RS-1501 | 3"-P600-P-15005 | 3"-P600-P-15601 | 3"-P600-P-15004 | 720, 198, 12 | 1 |
| RS-1502 | 3"-P300-P-15025 | 3"-P300-P-15602 | 3"-P300-P-15024 | 1440, 198, 78 | 1 |
| RS-1503 | 3"-P600-P-15027 | 3"-P600-P-15603 | 3"-P600-P-15016 | 960, 198, -12 | 1 |

### Control valve stations

Each stands at grade under the rack, on a spool that divides its line (SW-RPI-9): the flowsheet's control valves, and those of the utility connections that are fed or drained under control (boiler feed water to a steam generator, condensate from a steam heater: SW-PRC-19).

| Line | Station | Spool | Stands at (x, y, z), in | The line after it |
| --- | --- | --- | --- | --- |
| 4"-P150-P-15001 | piped | CS-1501 | 540, 36, -108 | 4"-P150-P-15701 |
| 6"-P600-P-15007 | piped | CS-1502 | 1956, 36, 108 | 6"-P600-P-15702 |
| 3"-P600-P-15016 | piped | CS-1503 | 444, 36, -36 | 3"-P150-P-15703 |
| 4"-P150-P-15019 | piped | CS-1504 | 990, 36, -108 | 4"-P150-P-15704 |
| 3"-P150-P-15022 | piped | CS-1505 | 444, 36, 36 | 3"-P150-P-15705 |
| 3"-P300-P-15024 | piped | CS-1506 | 1410, 36, -108 | 3"-P150-P-15706 |
| 3"-P300-P-15025 | piped | CS-1507 | 528, 36, 108 | 3"-P150-P-15707 |
| 4"-P300-P-15032 | piped | CS-1508 | 684, 36, -36 | 4"-P150-P-15708 |

### Headers at the battery limit

Each utility header ends at the limit in a block valve and a spool on the top tier, in its own lane, and runs straight through the valve; the plant's header joins it on the pipeway's side (SW-RPI-15, SW-PWY-12). 4 headers carried on in line to their block valves at the battery limit, the cap there left out: 6"-P150-CWR-15402 from BL-1509-U, its first piece 203.1 in longer, a shoe at x 360; 6"-P150-CWS-15401 from BL-1508-U, its first piece 113.1 in longer, a shoe at x 360; 3"-P300-LS-15403 from BL-1510-U, its first piece 190.3 in longer, a shoe at x 360 and 240; 2"-P150-P-15404 from BL-1511-U, its first piece 104.8 in longer, a shoe at x 360.

### Connections without a valve

At these ends the valve the generator stands at every equipment connection is not built, and the line's own flange meets the nozzle (SW-RPI-14): a transfer line from a fired heater, a line from a column's top, an ejector set's drains and its connections under its deck.

- 8"-P600-P-15008: no valve at H-1501-N2; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.7 in longer
- 8"-P600-P-15008: no valve at R-1501-N1; GATE 8 and what stood with it left out, 5 pieces, the pipe 19.7 in longer
- 4"-P150-P-15020: no valve at C-1501-N2; GATE 4 and what stood with it left out, 5 pieces, the pipe 15.8 in longer
- 4"-P150-P-15020: no valve at A-1502-N1; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer

### Lines

| Line | Kind | Fluid | From | To | Design | Rack tier | Components | Welds | Supports | Length, ft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4"-P150-P-15001 | process | kerosene | BL-1501-U | CS-1501-A | 105 psi, 150 °F | 1 | 33 | 14 | 1 | 37 |
| 4"-P150-P-15701 | control | kerosene | CS-1501-B | D-1501-N1 | 105 psi, 150 °F | — | 21 | 12 | 2 | 59 |
| 6"-P150-P-15002 | process | kerosene | D-1501-N2 | P-1501A-S | 55 psi, 150 °F | — | 31 | 18 | 0 | 38 |
| 4"-P600-P-15003 | process | kerosene | P-1501A-D | E-1501-N1 | 595 psi, 150 °F | — | 35 | 22 | 3 | 83 |
| 3"-P600-P-15004 | process | hydrogen-rich gas | D-1502-N1 | K-1501A-N1 | 395 psi, 160 °F | 1 | 29 | 22 | 9 | 122 |
| 3"-P600-P-15005 | process | hydrogen-rich gas | BL-1502-U | RS-1501-B | 395 psi, 160 °F | 1 | 17 | 10 | 3 | 43 |
| 3"-P600-P-15006 | process | hydrogen-rich gas | K-1501A-N2 | tap 4"-P600-P-15003 | 515 psi, 220 °F | — | 13 | 10 | 0 | 15 |
| 6"-P600-P-15007 | process | reactor effluent (oil and hydrogen) | E-1501-N2 | CS-1502-A | 595 psi, 570 °F | 1 | 48 | 27 | 10 | 191 |
| 6"-P600-P-15702 | control | reactor effluent (oil and hydrogen) | CS-1502-B | H-1501-N1 | 595 psi, 570 °F | 1 | 24 | 17 | 4 | 90 |
| 8"-P600-P-15008 | process | reactor effluent (oil and hydrogen) | H-1501-N2 | R-1501-N1 | 455 psi, 650 °F | 1 | 24 | 21 | 5 | 160 |
| 8"-P600-P-15009 | process | reactor effluent (oil and hydrogen) | R-1501-N2 | E-1505-N1 | 420 psi, 665 °F | 1 | 25 | 14 | 8 | 155 |
| 8"-P600-P-15010 | process | reactor effluent (oil and hydrogen) | E-1505-N2 | E-1501-N3 | 415 psi, 615 °F | 1 | 31 | 20 | 5 | 135 |
| 6"-P600-P-15011 | process | reactor effluent (oil and hydrogen) | E-1501-N4 | A-1501-N1 | 500 psi, 315 °F | — | 26 | 17 | 0 | 81 |
| 3"-P150-P-15012 | process | process and wash water | BL-1503-U | P-1505A-S | 125 psi, 170 °F | — | 33 | 22 | 2 | 89 |
| 3"-P600-P-15013 | process | process and wash water | P-1505A-D | tap 6"-P600-P-15011 | 500 psi, 160 °F | — | 15 | 8 | 0 | 7 |
| 4"-P600-P-15014 | process | reactor effluent (oil and hydrogen) | A-1501-N2 | E-1502-N1 | 500 psi, 190 °F | 3 | 26 | 17 | 4 | 118 |
| 4"-P600-P-15015 | process | reactor effluent (oil and hydrogen) | E-1502-N2 | D-1502-N2 | 500 psi, 160 °F | — | 24 | 13 | 4 | 96 |
| 3"-P600-P-15016 | process | sour water | D-1502-N3 | CS-1503-A | 470 psi, 160 °F | 1 | 49 | 30 | 7 | 95 |
| 3"-P150-P-15703 | control | sour water | CS-1503-B | BL-1504-U | 85 psi, 190 °F | — | 19 | 12 | 1 | 34 |
| 4"-P150-P-15017 | process | kerosene | D-1502-N4 | E-1503-N1 | 95 psi, 160 °F | — | 27 | 18 | 4 | 120 |
| 4"-P150-P-15018 | process | kerosene | E-1503-N2 | E-1505-N3 | 85 psi, 370 °F | — | 23 | 12 | 1 | 31 |
| 4"-P150-P-15019 | process | kerosene | E-1505-N4 | CS-1504-A | 75 psi, 435 °F | — | 40 | 19 | 3 | 76 |
| 4"-P150-P-15704 | control | kerosene | CS-1504-B | C-1501-N1 | 75 psi, 435 °F | — | 21 | 12 | 2 | 77 |
| 4"-P150-P-15020 | process | hydrocarbon gas | C-1501-N2 | A-1502-N1 | 65 psi, 300 °F | 3 | 34 | 31 | 1 | 155 |
| 3"-P150-P-15021 | process | hydrocarbon gas | A-1502-N2 | D-1503-N1 | 60 psi, 170 °F | 3 | 26 | 17 | 6 | 123 |
| 3"-P150-P-15022 | process | hydrocarbon gas | D-1503-N2 | CS-1505-A | 55 psi, 170 °F | 1 | 45 | 26 | 11 | 140 |
| 3"-P150-P-15705 | control | hydrocarbon gas | CS-1505-B | BL-1505-U | 50 psi, 190 °F | — | 19 | 12 | 1 | 38 |
| 3"-P150-P-15023 | process | naphtha | D-1503-N3 | P-1502A-S | 55 psi, 170 °F | — | 29 | 18 | 1 | 37 |
| 3"-P300-P-15024 | process | naphtha | P-1502A-D | CS-1506-A | 155 psi, 170 °F | — | 46 | 23 | 0 | 27 |
| 3"-P150-P-15706 | control | naphtha | CS-1506-B | C-1501-N3 | 70 psi, 170 °F | — | 23 | 14 | 3 | 106 |
| 3"-P300-P-15025 | process | naphtha | RS-1502-B | CS-1507-A | 155 psi, 170 °F | 1 | 35 | 16 | 9 | 100 |
| 3"-P150-P-15707 | control | naphtha | CS-1507-B | BL-1506-U | 105 psi, 170 °F | 1 | 23 | 16 | 3 | 49 |
| 3"-P150-P-15026 | process | sour water | D-1503-N4 | P-1504A-S | 55 psi, 170 °F | — | 28 | 17 | 1 | 41 |
| 3"-P600-P-15027 | process | sour water | P-1504A-D | RS-1503-B | 470 psi, 170 °F | 1 | 27 | 16 | 6 | 75 |
| 6"-P150-P-15028 | process | kerosene | C-1501-N4 | P-1503A-S | 70 psi, 420 °F | — | 25 | 12 | 2 | 43 |
| 4"-P300-P-15029 | process | kerosene | P-1503A-D | E-1503-N3 | 180 psi, 420 °F | — | 29 | 16 | 4 | 75 |
| 4"-P300-P-15030 | process | kerosene | E-1503-N4 | E-1504-N1 | 180 psi, 210 °F | — | 23 | 12 | 1 | 38 |
| 4"-P300-P-15031 | process | kerosene | E-1504-N2 | F-1501-N1 | 180 psi, 150 °F | 1 | 27 | 18 | 7 | 150 |
| 4"-P300-P-15032 | process | kerosene | F-1501-N2 | CS-1508-A | 180 psi, 150 °F | 1 | 47 | 28 | 8 | 154 |
| 4"-P150-P-15708 | control | kerosene | CS-1508-B | BL-1507-U | 75 psi, 150 °F | 1 | 16 | 9 | 3 | 53 |
| 3"-P600-P-15601 | root | hydrogen-rich gas | RS-1501-A | tap 3"-P600-P-15004 | 395 psi, 160 °F | — | 11 | 8 | 0 | 9 |
| 3"-P300-P-15602 | root | naphtha | tap 3"-P300-P-15024 | RS-1502-A | 155 psi, 170 °F | — | 13 | 10 | 0 | 24 |
| 3"-P600-P-15603 | root | sour water | RS-1503-A | tap 3"-P600-P-15016 | 470 psi, 170 °F | — | 9 | 6 | 0 | 5 |
| 6"-P150-P-15301 | spare | kerosene | tap 6"-P150-P-15002 | P-1501B-S | 55 psi, 150 °F | — | 19 | 12 | 0 | 9 |
| 4"-P600-P-15302 | spare | kerosene | P-1501B-D | tap 4"-P600-P-15003 | 595 psi, 150 °F | — | 16 | 9 | 0 | 10 |
| 3"-P600-P-15303 | spare | hydrogen-rich gas | tap 3"-P600-P-15004 | K-1501B-N1 | 395 psi, 160 °F | — | 13 | 10 | 0 | 24 |
| 3"-P600-P-15304 | spare | hydrogen-rich gas | K-1501B-N2 | tap 4"-P600-P-15003 | 515 psi, 220 °F | — | 13 | 10 | 1 | 29 |
| 3"-P150-P-15305 | spare | process and wash water | tap 3"-P150-P-15012 | P-1505B-S | 125 psi, 170 °F | — | 13 | 6 | 0 | 7 |
| 3"-P600-P-15306 | spare | process and wash water | P-1505B-D | tap 6"-P600-P-15011 | 500 psi, 160 °F | — | 19 | 12 | 0 | 3 |
| 3"-P150-P-15307 | spare | naphtha | tap 3"-P150-P-15023 | P-1502B-S | 55 psi, 170 °F | — | 15 | 8 | 0 | 4 |
| 3"-P300-P-15308 | spare | naphtha | P-1502B-D | tap 3"-P300-P-15024 | 155 psi, 170 °F | — | 16 | 9 | 0 | 7 |
| 3"-P150-P-15309 | spare | sour water | tap 3"-P150-P-15026 | P-1504B-S | 55 psi, 170 °F | — | 14 | 7 | 0 | 7 |
| 3"-P600-P-15310 | spare | sour water | P-1504B-D | tap 3"-P600-P-15027 | 470 psi, 170 °F | — | 14 | 7 | 0 | 7 |
| 6"-P150-P-15311 | spare | kerosene | tap 6"-P150-P-15028 | P-1503B-S | 70 psi, 420 °F | — | 19 | 12 | 0 | 10 |
| 4"-P300-P-15312 | spare | kerosene | P-1503B-D | tap 4"-P300-P-15029 | 180 psi, 420 °F | — | 14 | 7 | 0 | 6 |
| 6"-P150-CWS-15401 | header | cooling water supply | BL-1508-U | cap | 140 psi, 150 °F | — | 12 | 8 | 9 | 188 |
| 6"-P150-CWR-15402 | header | cooling water return | BL-1509-U | cap | 70 psi, 155 °F | — | 14 | 10 | 9 | 196 |
| 3"-P300-LS-15403 | header | steam, 150 psi | BL-1510-U | cap | 185 psi, 450 °F | — | 12 | 8 | 19 | 196 |
| 2"-P150-P-15404 | header | fuel gas | BL-1511-U | cap | 85 psi, 150 °F | — | 13 | 9 | 18 | 188 |
| 3"-P150-CWS-15501 | utility | cooling water supply | tap 6"-P150-CWS-15401 | E-1502-N3 | 140 psi, 150 °F | — | 34 | 21 | 4 | 82 |
| 4"-P150-CWR-15502 | utility | cooling water return | E-1502-N4 | tap 6"-P150-CWR-15402 | 70 psi, 155 °F | — | 32 | 21 | 2 | 73 |
| 4"-P150-CWS-15503 | utility | cooling water supply | tap 6"-P150-CWS-15401 | E-1504-N3 | 140 psi, 150 °F | — | 31 | 20 | 3 | 85 |
| 4"-P150-CWR-15504 | utility | cooling water return | E-1504-N4 | tap 6"-P150-CWR-15402 | 70 psi, 155 °F | — | 32 | 21 | 3 | 73 |
| 3"-P300-LS-15505 | utility | steam, 150 psi | tap 3"-P300-LS-15403 | C-1501-N5 | 185 psi, 450 °F | — | 20 | 13 | 2 | 47 |
| 2"-P150-P-15506 | utility | fuel gas | tap 2"-P150-P-15404 | H-1501-N3 | 85 psi, 150 °F | — | 18 | 11 | 2 | 44 |

## Unit 16: Diesel hydrotreater

85 lines: 43 of the flowsheet, 16 to installed spares and parallel bodies, 4 utility headers and 4 utility connections, 13 parts of lines after their control stations (SW-RPI-9), and 5 connections to branch root spools (SW-RPI-8). The lines that run the rack are on 3 of its tiers (SW-RPI-7), each in a lane given it beforehand, no tier loaded beyond 72 in of lanes at any section: tier 1 16 lines, tier 2 15 lines, tier 3 4 lines. The generator was run 43 times: once for each line that runs the rack or rises in a column's chase, with the branches that tap it, and once for the rest.

| Component | Count |
| --- | --- |
| cap | 4 |
| elbow | 440 |
| flange | 277 |
| gasket | 435 |
| olet | 4 |
| pipe | 673 |
| reducer | 50 |
| spade | 28 |
| spectacle | 9 |
| tee | 23 |
| valve | 190 |

| Welds | Count |
| --- | --- |
| BW, field | 197 |
| BW, shop | 1139 |
| FW, shop | 12 |

| Supports | Count |
| --- | --- |
| anchor | 39 |
| guide | 92 |
| hanger | 60 |
| shoe | 130 |
| stanchion | 33 |
| trapeze | 1 |
| trunnion | 40 |

### Checks

| Check (the generator's own, §40) | Found |
| --- | --- |
| every line continuous from end to end | 0 |
| every joint a joint of its class | 0 |
| elbows and the straights between them | 0 |
| valves by class and size | 0 |
| 3 in between lines | 0 |
| 3 in from steel and equipment | 0 |
| spans within SW-PS-7, a support at every rack beam crossed | 2 |

Not at zero, supports:

- 6"-P1200-P-16005: unsupported span 299 in > 240 on run from 426,138,-26
- 3"-P150-P-16704: no shoe at bent x=360

These runs are longer than a pipe of their size spans and no steel stands where a support would go: lines that cross the yard or run beside the rack away from the support beams. They are listed, not hidden, and want pipe supports of their own.

### Battery limit

| Spool | Stream | Direction | Line | Stands at (x, y, z), in | Tier | Lane |
| --- | --- | --- | --- | --- | --- | --- |
| BL-1608 | stripper gas | out | 3"-P150-P-16709 | 150, 198, -90 | 1 | -72 |
| BL-1601 | straight-run diesel | in | 6"-P150-P-16001 | 150, 204, -30 | 1 | -12 |
| BL-1610 | treated diesel | out | 6"-P150-P-16713 | 150, 204, -6 | 1 | 12 |
| BL-1605 | hydrogen | in | 3"-P600-P-16014 | 150, 198, 66 | 1 | 84 |
| BL-1603 | lean amine | in | 4"-P600-P-16007 | 150, 198, 84 | 1 | — |
| BL-1604 | rich amine | out | 3"-P150-P-16704 | 150, 198, 102 | 1 | — |
| BL-1607 | sour water | out | 3"-P150-P-16707 | 150, 198, 120 | 1 | — |
| BL-1602 | light cycle oil to hydrotreating | in | 3"-P150-P-16002 | 150, 270, -12 | 2 | -12 |
| BL-1609 | wild naphtha | out | 3"-P150-P-16712 | 150, 270, 24 | 2 | 24 |
| BL-1606 | stripped water | in | 3"-P150-P-16021 | 150, 270, 42 | 2 | 36 |
| BL-1614 | fuel gas to users | in | 2"-P150-P-16404 | 150, 342, -42 | 3 | -42 |
| BL-1612 | cooling water return | out | 6"-P150-CWR-16402 | 240, 348, -24 | 3 | -24 |
| BL-1611 | cooling water supply | in | 6"-P150-CWS-16401 | 150, 348, 0 | 3 | 0 |
| BL-1613 | medium-pressure steam | in | 4"-P300-LS-16403 | 240, 342, 24 | 3 | 24 |

### Branch roots

Branches that travel the rack start at a spool on it, a block valve on each face (SW-RPI-8).

| Spool | Branch | Connection to the tee | On | Stands at (x, y, z), in | Tier |
| --- | --- | --- | --- | --- | --- |
| RS-1601 | 3"-P1200-P-16013 | 3"-P1200-P-16601 | 6"-P1200-P-16012 | 720, 270, -54 | 2 |
| RS-1602 | 3"-P1200-P-16015 | 3"-P1200-P-16602 | 6"-P1200-P-16012 | 720, 270, 60 | 2 |
| RS-1603 | 3"-P150-P-16032 | 3"-P150-P-16603 | 3"-P300-P-16026 | 1920, 198, -96 | 1 |
| RS-1604 | 3"-P300-P-16035 | 3"-P300-P-16604 | 3"-P300-P-16034 | 1920, 270, 42 | 2 |
| RS-1605 | 3"-P1200-P-16037 | 3"-P1200-P-16605 | 3"-P1200-P-16024 | 960, 270, -72 | 2 |

### Control valve stations

Each stands at grade under the rack, on a spool that divides its line (SW-RPI-9): the flowsheet's control valves, and those of the utility connections that are fed or drained under control (boiler feed water to a steam generator, condensate from a steam heater: SW-PRC-19).

| Line | Station | Spool | Stands at (x, y, z), in | The line after it |
| --- | --- | --- | --- | --- |
| 6"-P150-P-16001 | piped | CS-1601 | 564, 36, -108 | 6"-P150-P-16701 |
| 3"-P150-P-16002 | piped | CS-1602 | 528, 36, -36 | 3"-P150-P-16702 |
| 3"-P1200-P-16008 | piped | CS-1603 | 1494, 36, -108 | 3"-P1200-P-16703 |
| 3"-P150-P-16009 | piped | CS-1604 | 444, 36, 36 | 3"-P150-P-16704 |
| 3"-P1200-P-16013 | piped | CS-1605 | 2604, 36, -108 | 3"-P1200-P-16705 |
| 8"-P1200-P-16016 | piped | CS-1606 | 3528, 36, 108 | 8"-P1200-P-16706 |
| 3"-P1200-P-16024 | piped | CS-1607 | 444, 36, 108 | 3"-P150-P-16707 |
| 6"-P300-P-16025 | piped | CS-1608 | 1662, 36, -36 | 6"-P300-P-16708 |
| 3"-P300-P-16026 | piped | CS-1609 | 654, 36, -36 | 3"-P150-P-16709 |
| 6"-P150-P-16029 | piped | CS-1610 | 1950, 36, -108 | 6"-P150-P-16710 |
| 3"-P300-P-16034 | piped | CS-1611 | 1860, 36, -36 | 3"-P150-P-16711 |
| 3"-P300-P-16035 | piped | CS-1612 | 744, 36, 108 | 3"-P150-P-16712 |
| 6"-P300-P-16043 | piped | CS-1613 | 684, 36, 36 | 6"-P150-P-16713 |

### Headers at the battery limit

Each utility header ends at the limit in a block valve and a spool on the top tier, in its own lane, and runs straight through the valve; the plant's header joins it on the pipeway's side (SW-RPI-15, SW-PWY-12). 4 headers carried on in line to their block valves at the battery limit, the cap there left out: 2"-P150-P-16404 from BL-1614-U, its first piece 194.8 in longer, a shoe at x 360 and 240; 6"-P150-CWR-16402 from BL-1612-U, its first piece 113.1 in longer, a shoe at x 360; 6"-P150-CWS-16401 from BL-1611-U, its first piece 203.1 in longer, a shoe at x 360; 4"-P300-LS-16403 from BL-1613-U, its first piece 98.0 in longer, a shoe at x 360.

### Connections without a valve

At these ends the valve the generator stands at every equipment connection is not built, and the line's own flange meets the nozzle (SW-RPI-14): a transfer line from a fired heater, a line from a column's top, an ejector set's drains and its connections under its deck.

- 6"-P1200-P-16010: no valve at C-1601-N4; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.3 in longer
- 6"-P1200-P-16010: no valve at D-1603-N1; GATE 6 and what stood with it left out, 5 pieces, the pipe 15.3 in longer
- 10"-P1200-P-16017: no valve at H-1601-N2; GATE 10 and what stood with it left out, 3 pieces, the pipe 21.6 in longer
- 10"-P1200-P-16017: no valve at R-1601-N2; GATE 10 and what stood with it left out, 5 pieces, the pipe 23.1 in longer
- 4"-P150-P-16030: no valve at C-1602-N2; GATE 4 and what stood with it left out, 5 pieces, the pipe 15.8 in longer
- 4"-P150-P-16030: no valve at A-1602-N1; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer

### Lines

| Line | Kind | Fluid | From | To | Design | Rack tier | Components | Welds | Supports | Length, ft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 6"-P150-P-16001 | process | diesel | BL-1601-U | CS-1601-A | 105 psi, 190 °F | 1 | 37 | 18 | 1 | 39 |
| 6"-P150-P-16701 | control | diesel | CS-1601-B | D-1601-N1 | 105 psi, 190 °F | — | 19 | 10 | 2 | 65 |
| 3"-P150-P-16002 | process | diesel | BL-1602-U | CS-1602-A | 105 psi, 190 °F | 2 | 33 | 14 | 2 | 38 |
| 3"-P150-P-16702 | control | diesel | CS-1602-B | D-1601-N2 | 105 psi, 190 °F | — | 21 | 14 | 4 | 64 |
| 6"-P150-P-16003 | process | diesel | D-1601-N3 | F-1601-N1 | 55 psi, 190 °F | 1 | 33 | 24 | 13 | 276 |
| 8"-P150-P-16004 | process | diesel | F-1601-N2 | P-1601A-S | 50 psi, 190 °F | — | 23 | 12 | 1 | 39 |
| 6"-P1200-P-16005 | process | diesel | P-1601A-D | E-1601-N1 | 1145 psi, 190 °F | 1 | 45 | 32 | 13 | 296 |
| 6"-P1200-P-16006 | process | hydrogen-rich gas | D-1602-N1 | C-1601-N1 | 850 psi, 180 °F | — | 15 | 8 | 0 | 22 |
| 4"-P600-P-16007 | process | amine solution | BL-1603-U | P-1602A-S | 330 psi, 170 °F | — | 33 | 22 | 2 | 80 |
| 3"-P1200-P-16008 | process | amine solution | P-1602A-D | CS-1603-A | 995 psi, 170 °F | 2 | 55 | 32 | 10 | 138 |
| 3"-P1200-P-16703 | control | amine solution | CS-1603-B | C-1601-N2 | 995 psi, 170 °F | — | 20 | 13 | 4 | 119 |
| 3"-P150-P-16009 | process | amine solution | C-1601-N3 | CS-1604-A | 105 psi, 190 °F | 1 | 42 | 23 | 11 | 134 |
| 3"-P150-P-16704 | control | amine solution | CS-1604-B | BL-1604-U | 95 psi, 190 °F | — | 15 | 8 | 2 | 37 |
| 6"-P1200-P-16010 | process | hydrogen-rich gas | C-1601-N4 | D-1603-N1 | 840 psi, 180 °F | — | 16 | 13 | 0 | 88 |
| 6"-P1200-P-16011 | process | hydrogen-rich gas | D-1603-N2 | K-1601A-N1 | 835 psi, 180 °F | 2 | 31 | 24 | 7 | 180 |
| 6"-P1200-P-16012 | process | hydrogen-rich gas | K-1601A-N2 | tap 6"-P1200-P-16005 | 1000 psi, 230 °F | — | 9 | 6 | 0 | 24 |
| 3"-P1200-P-16013 | process | hydrogen-rich gas | RS-1601-B | CS-1605-A | 1000 psi, 230 °F | 2 | 38 | 19 | 15 | 166 |
| 3"-P1200-P-16705 | control | hydrogen-rich gas | CS-1605-B | R-1601-N1 | 1000 psi, 230 °F | — | 19 | 12 | 3 | 62 |
| 3"-P600-P-16014 | process | hydrogen-rich gas | BL-1605-U | K-1602A-N1 | 545 psi, 160 °F | 1 | 24 | 17 | 8 | 107 |
| 3"-P1200-P-16015 | process | hydrogen-rich gas | K-1602A-N2 | RS-1602-B | 1000 psi, 300 °F | 2 | 17 | 10 | 4 | 71 |
| 8"-P1200-P-16016 | process | reactor effluent (oil and hydrogen) | E-1601-N2 | CS-1606-A | 1145 psi, 590 °F | 1 | 52 | 31 | 15 | 326 |
| 8"-P1200-P-16706 | control | reactor effluent (oil and hydrogen) | CS-1606-B | H-1601-N1 | 1145 psi, 590 °F | 1 | 23 | 16 | 2 | 63 |
| 10"-P1200-P-16017 | process | reactor effluent (oil and hydrogen) | H-1601-N2 | R-1601-N2 | 935 psi, 660 °F | 1 | 26 | 23 | 6 | 213 |
| 10"-P1200-P-16018 | process | reactor effluent (oil and hydrogen) | R-1601-N3 | E-1604-N1 | 880 psi, 700 °F | 1 | 29 | 18 | 11 | 210 |
| 10"-P1200-P-16019 | process | reactor effluent (oil and hydrogen) | E-1604-N2 | E-1601-N3 | 870 psi, 650 °F | 1 | 31 | 20 | 8 | 176 |
| 8"-P1200-P-16020 | process | reactor effluent (oil and hydrogen) | E-1601-N4 | A-1601-N1 | 1015 psi, 340 °F | — | 25 | 16 | 1 | 83 |
| 3"-P150-P-16021 | process | process and wash water | BL-1606-U | P-1605A-S | 125 psi, 170 °F | 2 | 35 | 24 | 3 | 73 |
| 3"-P1200-P-16022 | process | process and wash water | P-1605A-D | tap 8"-P1200-P-16020 | 1015 psi, 160 °F | — | 19 | 12 | 0 | 21 |
| 8"-P1200-P-16023 | process | reactor effluent (oil and hydrogen) | A-1601-N2 | D-1602-N2 | 1015 psi, 190 °F | — | 20 | 11 | 5 | 115 |
| 3"-P1200-P-16024 | process | sour water | D-1602-N3 | CS-1607-A | 990 psi, 190 °F | 2 | 48 | 29 | 9 | 133 |
| 3"-P150-P-16707 | control | sour water | CS-1607-B | BL-1607-U | 85 psi, 190 °F | — | 17 | 10 | 1 | 32 |
| 6"-P300-P-16025 | process | diesel | D-1602-N4 | CS-1608-A | 175 psi, 190 °F | 2 | 46 | 27 | 6 | 131 |
| 6"-P300-P-16708 | control | diesel | CS-1608-B | D-1604-N1 | 175 psi, 190 °F | — | 22 | 13 | 3 | 60 |
| 3"-P300-P-16026 | process | hydrocarbon gas | D-1604-N2 | CS-1609-A | 165 psi, 190 °F | 2 | 44 | 25 | 13 | 159 |
| 3"-P150-P-16709 | control | hydrocarbon gas | CS-1609-B | BL-1608-U | 50 psi, 190 °F | 1 | 21 | 14 | 3 | 55 |
| 6"-P300-P-16027 | process | diesel | D-1604-N3 | E-1602-N1 | 165 psi, 190 °F | 1 | 32 | 23 | 8 | 167 |
| 6"-P300-P-16028 | process | diesel | E-1602-N2 | E-1604-N3 | 155 psi, 420 °F | — | 21 | 10 | 0 | 19 |
| 6"-P150-P-16029 | process | diesel | E-1604-N4 | CS-1610-A | 145 psi, 485 °F | 2 | 51 | 30 | 6 | 145 |
| 6"-P150-P-16710 | control | diesel | CS-1610-B | C-1602-N1 | 145 psi, 485 °F | — | 21 | 12 | 2 | 79 |
| 4"-P150-P-16030 | process | hydrocarbon gas | C-1602-N2 | A-1602-N1 | 125 psi, 350 °F | 3 | 32 | 29 | 8 | 245 |
| 3"-P150-P-16031 | process | hydrocarbon gas | A-1602-N2 | D-1605-N1 | 120 psi, 170 °F | 3 | 30 | 21 | 16 | 203 |
| 3"-P150-P-16032 | process | hydrocarbon gas | D-1605-N2 | RS-1603-B | 105 psi, 170 °F | 1 | 16 | 9 | 6 | 77 |
| 3"-P150-P-16033 | process | naphtha | D-1605-N3 | P-1603A-S | 115 psi, 170 °F | — | 29 | 18 | 2 | 44 |
| 3"-P300-P-16034 | process | naphtha | P-1603A-D | CS-1611-A | 205 psi, 170 °F | 2 | 56 | 33 | 5 | 83 |
| 3"-P150-P-16711 | control | naphtha | CS-1611-B | C-1602-N3 | 130 psi, 170 °F | — | 25 | 16 | 3 | 129 |
| 3"-P300-P-16035 | process | naphtha | RS-1604-B | CS-1612-A | 205 psi, 170 °F | 2 | 43 | 24 | 11 | 139 |
| 3"-P150-P-16712 | control | naphtha | CS-1612-B | BL-1609-U | 105 psi, 170 °F | 2 | 25 | 18 | 4 | 78 |
| 3"-P150-P-16036 | process | sour water | D-1605-N4 | P-1606A-S | 115 psi, 170 °F | — | 29 | 18 | 1 | 46 |
| 3"-P1200-P-16037 | process | sour water | P-1606A-D | RS-1605-B | 990 psi, 170 °F | 2 | 27 | 16 | 12 | 146 |
| 8"-P150-P-16038 | process | diesel | C-1602-N4 | P-1604A-S | 130 psi, 470 °F | — | 29 | 16 | 1 | 52 |
| 6"-P300-P-16039 | process | diesel | P-1604A-D | E-1602-N3 | 225 psi, 470 °F | 1 | 36 | 23 | 4 | 130 |
| 6"-P300-P-16040 | process | diesel | E-1602-N4 | A-1603-N1 | 225 psi, 240 °F | 3 | 32 | 23 | 3 | 135 |
| 6"-P300-P-16041 | process | diesel | A-1603-N2 | E-1603-N1 | 225 psi, 190 °F | 3 | 30 | 21 | 6 | 143 |
| 6"-P300-P-16042 | process | diesel | E-1603-N2 | F-1602-N1 | 225 psi, 160 °F | 2 | 34 | 25 | 10 | 233 |
| 6"-P300-P-16043 | process | diesel | F-1602-N2 | CS-1613-A | 225 psi, 160 °F | 1 | 47 | 28 | 13 | 257 |
| 6"-P150-P-16713 | control | diesel | CS-1613-B | BL-1610-U | 75 psi, 160 °F | 1 | 23 | 16 | 3 | 58 |
| 3"-P1200-P-16601 | root | hydrogen-rich gas | tap 6"-P1200-P-16012 | RS-1601-A | 1000 psi, 230 °F | — | 14 | 11 | 3 | 51 |
| 3"-P1200-P-16602 | root | hydrogen-rich gas | RS-1602-A | tap 6"-P1200-P-16012 | 1000 psi, 300 °F | — | 18 | 15 | 1 | 42 |
| 3"-P150-P-16603 | root | hydrocarbon gas | RS-1603-A | tap 3"-P300-P-16026 | 105 psi, 170 °F | — | 13 | 10 | 0 | 9 |
| 3"-P300-P-16604 | root | naphtha | tap 3"-P300-P-16034 | RS-1604-A | 205 psi, 170 °F | — | 9 | 6 | 0 | 10 |
| 3"-P1200-P-16605 | root | sour water | RS-1605-A | tap 3"-P1200-P-16024 | 990 psi, 170 °F | — | 11 | 8 | 0 | 10 |
| 8"-P150-P-16301 | spare | diesel | tap 8"-P150-P-16004 | P-1601B-S | 50 psi, 190 °F | — | 19 | 12 | 0 | 13 |
| 6"-P1200-P-16302 | spare | diesel | P-1601B-D | tap 6"-P1200-P-16005 | 1145 psi, 190 °F | — | 13 | 6 | 0 | 7 |
| 4"-P600-P-16303 | spare | amine solution | tap 4"-P600-P-16007 | P-1602B-S | 330 psi, 170 °F | — | 15 | 8 | 0 | 6 |
| 3"-P1200-P-16304 | spare | amine solution | P-1602B-D | tap 3"-P1200-P-16008 | 995 psi, 170 °F | — | 14 | 7 | 0 | 7 |
| 6"-P1200-P-16305 | spare | hydrogen-rich gas | tap 6"-P1200-P-16011 | K-1601B-N1 | 835 psi, 180 °F | — | 15 | 12 | 0 | 26 |
| 6"-P1200-P-16306 | spare | hydrogen-rich gas | K-1601B-N2 | tap 6"-P1200-P-16005 | 1000 psi, 230 °F | — | 9 | 6 | 1 | 41 |
| 3"-P600-P-16307 | spare | hydrogen-rich gas | tap 3"-P600-P-16014 | K-1602B-N1 | 545 psi, 160 °F | — | 13 | 10 | 0 | 25 |
| 3"-P1200-P-16308 | spare | hydrogen-rich gas | K-1602B-N2 | tap 3"-P1200-P-16015 | 1000 psi, 300 °F | — | 11 | 8 | 0 | 17 |
| 3"-P150-P-16309 | spare | process and wash water | tap 3"-P150-P-16021 | P-1605B-S | 125 psi, 170 °F | — | 13 | 6 | 0 | 7 |
| 3"-P1200-P-16310 | spare | process and wash water | P-1605B-D | tap 8"-P1200-P-16020 | 1015 psi, 160 °F | — | 19 | 12 | 0 | 23 |
| 3"-P150-P-16311 | spare | naphtha | tap 3"-P150-P-16033 | P-1603B-S | 115 psi, 170 °F | — | 15 | 8 | 0 | 3 |
| 3"-P300-P-16312 | spare | naphtha | P-1603B-D | tap 3"-P300-P-16034 | 205 psi, 170 °F | — | 14 | 7 | 0 | 6 |
| 3"-P150-P-16313 | spare | sour water | tap 3"-P150-P-16036 | P-1606B-S | 115 psi, 170 °F | — | 15 | 8 | 0 | 7 |
| 3"-P1200-P-16314 | spare | sour water | P-1606B-D | tap 3"-P1200-P-16037 | 990 psi, 170 °F | — | 14 | 7 | 0 | 7 |
| 8"-P150-P-16315 | spare | diesel | tap 8"-P150-P-16038 | P-1604B-S | 130 psi, 470 °F | — | 19 | 12 | 0 | 14 |
| 6"-P300-P-16316 | spare | diesel | P-1604B-D | tap 6"-P300-P-16039 | 225 psi, 470 °F | — | 14 | 7 | 0 | 5 |
| 6"-P150-CWS-16401 | header | cooling water supply | BL-1611-U | cap | 140 psi, 150 °F | — | 15 | 11 | 14 | 296 |
| 6"-P150-CWR-16402 | header | cooling water return | BL-1612-U | cap | 70 psi, 155 °F | — | 15 | 11 | 14 | 288 |
| 4"-P300-LS-16403 | header | steam, 150 psi | BL-1613-U | cap | 185 psi, 450 °F | — | 15 | 11 | 14 | 288 |
| 2"-P150-P-16404 | header | fuel gas | BL-1614-U | cap | 85 psi, 150 °F | — | 16 | 12 | 29 | 296 |
| 6"-P150-CWS-16501 | utility | cooling water supply | tap 6"-P150-CWS-16401 | E-1603-N3 | 140 psi, 150 °F | — | 33 | 22 | 3 | 89 |
| 6"-P150-CWR-16502 | utility | cooling water return | E-1603-N4 | tap 6"-P150-CWR-16402 | 70 psi, 155 °F | — | 31 | 20 | 1 | 81 |
| 4"-P300-LS-16503 | utility | steam, 150 psi | tap 4"-P300-LS-16403 | C-1602-N5 | 185 psi, 450 °F | — | 22 | 15 | 1 | 56 |
| 2"-P150-P-16504 | utility | fuel gas | tap 2"-P150-P-16404 | H-1601-N3 | 85 psi, 150 °F | — | 18 | 11 | 2 | 52 |

## Unit 17: Fluid catalytic cracker and gas concentration

222 lines: 101 of the flowsheet, 32 to installed spares and parallel bodies, 10 utility headers and 32 utility connections, 39 parts of lines after their control stations (SW-RPI-9), and 8 connections to branch root spools (SW-RPI-8). The lines that run the rack are on 3 of its tiers (SW-RPI-7), each in a lane given it beforehand, no tier loaded beyond 132 in of lanes at any section: tier 1 38 lines, tier 2 26 lines, tier 3 8 lines. The generator was run 95 times: once for each line that runs the rack or rises in a column's chase, with the branches that tap it, and once for the rest.

| Component | Count |
| --- | --- |
| cap | 10 |
| elbow | 1222 |
| flange | 797 |
| gasket | 1219 |
| olet | 20 |
| pipe | 1933 |
| reducer | 122 |
| spade | 88 |
| spectacle | 27 |
| tee | 57 |
| valve | 527 |

| Welds | Count |
| --- | --- |
| BW, field | 518 |
| BW, shop | 3250 |
| FW, shop | 36 |

| Supports | Count |
| --- | --- |
| anchor | 78 |
| guide | 201 |
| hanger | 163 |
| shoe | 520 |
| stanchion | 144 |
| trapeze | 1 |
| trunnion | 96 |

### Checks

| Check (the generator's own, §40) | Found |
| --- | --- |
| every line continuous from end to end | 0 |
| every joint a joint of its class | 0 |
| elbows and the straights between them | 0 |
| valves by class and size | 0 |
| 3 in between lines | 0 |
| 3 in from steel and equipment | 0 |
| spans within SW-PS-7, a support at every rack beam crossed | 9 |

Not at zero, supports:

- 3"-P300-P-17018: unsupported span 186 in > 180 on run from 1056,132,469
- 16"-P150-P-17038: unsupported span 301 in > 240 on run from 1362,300,-255
- 4"-P300-P-17064: unsupported span 282 in > 240 on run from 1500,294,-893
- 6"-P300-P-17081: unsupported span 241 in > 240 on run from 1686,294,452
- 6"-P300-P-17081: unsupported span 241 in > 240 on run from 1194,618,-206
- 24"-P150-V-17312: unsupported span 376 in > 240 on run from 1790,744,-198
- 3"-P150-CWS-17513: unsupported span 279 in > 180 on run from 1308,246,317
- 8"-P150-CWS-17515: unsupported span 331 in > 240 on run from 1422,318,381
- 6"-P150-CWS-17531: unsupported span 309 in > 240 on run from 2142,252,334

These runs are longer than a pipe of their size spans and no steel stands where a support would go: lines that cross the yard or run beside the rack away from the support beams. They are listed, not hidden, and want pipe supports of their own.

### Battery limit

| Spool | Stream | Direction | Line | Stands at (x, y, z), in | Tier | Lane |
| --- | --- | --- | --- | --- | --- | --- |
| BL-1702 | light vacuum gas oil | in | 3"-P150-P-17002 | 150, 198, -126 | 1 | -120 |
| BL-1701 | atmospheric gas oil | in | 3"-P150-P-17001 | 150, 198, -108 | 1 | -108 |
| BL-1709 | sour water | out | 3"-P150-P-17717 | 150, 198, -78 | 1 | -72 |
| BL-1715 | three-carbon liquefied gas | out | 3"-P300-P-17730 | 150, 198, -60 | 1 | -60 |
| BL-1712 | fuel gas | out | 4"-P150-P-17720 | 150, 198, -42 | 1 | -48 |
| BL-1710 | lean amine | in | 4"-P600-P-17062 | 150, 198, -24 | 1 | -36 |
| BL-1703 | heavy vacuum gas oil | in | 6"-P150-P-17003 | 150, 204, 6 | 1 | 12 |
| BL-1711 | rich amine | out | 4"-P150-P-17719 | 150, 198, 48 | 1 | 54 |
| BL-1708 | stripper gas | in | 6"-P150-P-17041 | 150, 204, 66 | 1 | 72 |
| BL-1706 | light cycle oil to hydrotreating | out | 3"-P150-P-17711 | 150, 198, 84 | 1 | 90 |
| BL-1713 | cracked gasoline | out | 6"-P150-P-17724 | 150, 204, 102 | 1 | 108 |
| BL-1704 | slurry oil | out | 3"-P150-P-17706 | 150, 198, 120 | 1 | — |
| BL-1705 | light cycle oil to fuel oil | out | 4"-P150-P-17710 | 150, 198, 138 | 1 | — |
| BL-1716 | four-carbon liquefied gas | out | 3"-P300-P-17731 | 150, 270, -108 | 2 | -108 |
| BL-1707 | crude overhead gas | in | 3"-P150-P-17040 | 150, 270, -48 | 2 | -48 |
| BL-1714 | reformer liquefied gas | in | 3"-P300-P-17088 | 150, 270, 108 | 2 | 108 |
| BL-1725 | low-pressure steam | out | 14"-P150-P-17409 | 150, 348, -102 | 3 | -102 |
| BL-1723 | medium-pressure steam | out | 10"-P300-LS-17407 | 240, 348, -72 | 3 | -72 |
| BL-1720 | high-pressure steam | in | 8"-P1200-LS-17404 | 150, 348, -48 | 3 | -48 |
| BL-1718 | instrument air | in | 2"-P150-IA-17402 | 240, 342, -24 | 3 | -24 |
| BL-1717 | cooling water supply | in | 20"-P150-CWS-17401 | 150, 354, 0 | 3 | 0 |
| BL-1719 | boiler feed water | in | 4"-P1200-SC-17403 | 240, 342, 24 | 3 | 24 |
| BL-1721 | service water | in | 3"-P300-W-17405 | 150, 342, 42 | 3 | 42 |
| BL-1722 | caustic | in | 2"-P600-P-17406 | 240, 342, 60 | 3 | 60 |
| BL-1724 | cooling water return | out | 20"-P150-CWR-17408 | 150, 354, 84 | 3 | 84 |
| BL-1726 | condensate | out | 2"-P150-SC-17410 | 240, 342, 108 | 3 | 108 |

### Branch roots

Branches that travel the rack start at a spool on it, a block valve on each face (SW-RPI-8).

| Spool | Branch | Connection to the tee | On | Stands at (x, y, z), in | Tier |
| --- | --- | --- | --- | --- | --- |
| RS-1701 | 3"-P600-P-17034 | 3"-P600-P-17601 | 4"-P600-P-17032 | 720, 270, 30 | 2 |
| RS-1702 | 6"-P300-P-17070 | 6"-P300-P-17602 | 8"-P300-P-17052 | 960, 276, 0 | 2 |
| RS-1703 | 4"-P300-P-17085 | 4"-P300-P-17603 | 6"-P300-P-17083 | 1920, 270, 60 | 2 |
| RS-1704 | 4"-P300-P-17087 | 4"-P300-P-17604 | 6"-P300-P-17077 | 3600, 198, 42 | 1 |
| RS-1705 | 3"-P300-P-17088 | 3"-P300-P-17605 | 4"-P300-P-17087 | 3600, 270, 108 | 2 |
| RS-1706 | 3"-P600-P-17089 | 3"-P600-P-17606 | 4"-P600-P-17062 | 960, 270, 126 | 2 |
| RS-1707 | 3"-P300-P-17090 | 3"-P300-P-17607 | 4"-P150-P-17063 | 1440, 270, 144 | 2 |
| RS-1708 | 3"-P600-P-17097 | 3"-P600-P-17608 | 6"-P600-P-17096 | 4320, 270, -96 | 2 |

### Control valve stations

Each stands at grade under the rack, on a spool that divides its line (SW-RPI-9): the flowsheet's control valves, and those of the utility connections that are fed or drained under control (boiler feed water to a steam generator, condensate from a steam heater: SW-PRC-19).

| Line | Station | Spool | Stands at (x, y, z), in | The line after it |
| --- | --- | --- | --- | --- |
| 3"-P150-P-17001 | piped | CS-1701 | 528, 36, -144 | 3"-P150-P-17701 |
| 3"-P150-P-17002 | piped | CS-1702 | 528, 36, -72 | 3"-P150-P-17702 |
| 6"-P150-P-17003 | piped | CS-1703 | 564, 36, 0 | 6"-P150-P-17703 |
| 8"-P600-P-17007 | piped | CS-1704 | 2520, 36, -144 | 8"-P150-P-17704 |
| 10"-P300-P-17017 | piped | CS-1705 | 1944, 36, -108 | 10"-P150-P-17705 |
| 3"-P300-P-17020 | piped | CS-1706 | 444, 36, 72 | 3"-P150-P-17706 |
| 8"-P300-P-17023 | piped | CS-1707 | 1824, 36, 0 | 8"-P150-P-17707 |
| 8"-P300-P-17027 | piped | CS-1708 | 1824, 36, 108 | 8"-P150-P-17708 |
| 6"-P150-P-17028 | piped | CS-1709 | 1500, 36, -144 | 6"-P150-P-17709 |
| 4"-P600-P-17032 | piped | CS-1710 | 444, 36, 144 | 4"-P150-P-17710 |
| 3"-P600-P-17033 | piped | CS-1711 | 744, 36, 72 | 3"-P150-P-17711 |
| 3"-P600-P-17035 | piped | CS-1712 | 1404, 36, -72 | 3"-P300-P-17712 |
| 3"-P150-P-17036 | piped | CS-1713 | 1614, 36, 0 | 3"-P150-P-17713 |
| 6"-P150-P-17041 | piped | CS-1714 | 1536, 36, 72 | 6"-P150-P-17714 |
| 4"-P150-P-17043 | piped | CS-1715 | 1614, 36, 144 | 4"-P150-P-17715 |
| 6"-P600-P-17045 | piped | CS-1716 | 882, 36, -144 | 6"-P300-P-17716 |
| 3"-P300-P-17047 | piped | CS-1717 | 654, 36, -144 | 3"-P150-P-17717 |
| 4"-P600-P-17062 | piped | CS-1718 | 984, 36, -72 | 4"-P300-P-17718 |
| 4"-P150-P-17063 | piped | CS-1719 | 684, 36, 144 | 4"-P150-P-17719 |
| 4"-P300-P-17065 | piped | CS-1720 | 714, 36, 0 | 4"-P150-P-17720 |
| 8"-P600-P-17069 | piped | CS-1721 | 2904, 36, 144 | 8"-P300-P-17721 |
| 8"-P300-P-17073 | piped | CS-1722 | 3456, 36, 144 | 8"-P300-P-17722 |
| 6"-P300-P-17077 | piped | CS-1723 | 3336, 36, 36 | 6"-P300-P-17723 |
| 6"-P300-P-17084 | piped | CS-1724 | 2364, 36, 144 | 6"-P150-P-17724 |
| 3"-P600-P-17086 | piped | CS-1725 | 972, 36, 72 | 3"-P300-P-17725 |
| 4"-P300-P-17087 | piped | CS-1726 | 3888, 36, 144 | 4"-P300-P-17726 |
| 3"-P600-P-17089 | piped | CS-1727 | 3888, 36, 72 | 3"-P300-P-17727 |
| 4"-P300-P-17092 | piped | CS-1728 | 4386, 36, 144 | 4"-P300-P-17728 |
| 6"-P600-P-17096 | piped | CS-1729 | 4386, 36, 72 | 6"-P300-P-17729 |
| 3"-P600-P-17097 | piped | CS-1730 | 744, 36, -72 | 3"-P300-P-17730 |
| 3"-P300-P-17101 | piped | CS-1731 | 2364, 36, 72 | 3"-P300-P-17731 |
| 2"-P150-IA-17501 | piped | CS-1732 | 4428, 36, -144 | 2"-P150-IA-17551 |
| 3"-P1200-SC-17502 | piped | CS-1733 | 3396, 36, -144 | 3"-P1200-SC-17552 |
| 3"-P300-W-17504 | piped | CS-1734 | 3888, 36, -144 | 3"-P150-W-17553 |
| 2"-P600-P-17505 | piped | CS-1735 | 3888, 36, -72 | 2"-P150-P-17554 |
| 3"-P1200-SC-17507 | piped | CS-1736 | 1002, 36, 144 | 3"-P300-SC-17555 |
| 2"-P600-P-17525 | piped | CS-1737 | 4830, 36, 144 | 2"-P150-P-17556 |
| 2"-P600-P-17526 | piped | CS-1738 | 4368, 36, 0 | 2"-P300-P-17557 |
| 2"-P300-SC-17530 | piped | CS-1739 | 4578, 36, 0 | 2"-P150-SC-17558 |

### Headers at the battery limit

Each utility header ends at the limit in a block valve and a spool on the top tier, in its own lane, and runs straight through the valve; the plant's header joins it on the pipeway's side (SW-RPI-15, SW-PWY-12). 10 headers carried on in line to their block valves at the battery limit, the cap there left out: 14"-P150-P-17409 from BL-1725-U, its first piece 180.1 in longer, a shoe at x 360; 10"-P300-LS-17407 from BL-1723-U, its first piece 91.3 in longer, a shoe at x 360; 8"-P1200-LS-17404 from BL-1720-U, its first piece 183.4 in longer, a shoe at x 360; 2"-P150-IA-17402 from BL-1718-U, its first piece 113.9 in longer, a shoe at x 360; 20"-P150-CWS-17401 from BL-1717-U, its first piece 197.8 in longer, a shoe at x 360; 4"-P1200-SC-17403 from BL-1719-U, its first piece 98.1 in longer, a shoe at x 360; 3"-P300-W-17405 from BL-1721-U, its first piece 202.7 in longer, a shoe at x 360 and 240; 2"-P600-P-17406 from BL-1722-U, its first piece 104.8 in longer, a shoe at x 360; 20"-P150-CWR-17408 from BL-1724-U, its first piece 197.8 in longer, a shoe at x 360; 2"-P150-SC-17410 from BL-1726-U, its first piece 104.6 in longer, a shoe at x 360.

### Connections without a valve

At these ends the valve the generator stands at every equipment connection is not built, and the line's own flange meets the nozzle (SW-RPI-14): a transfer line from a fired heater, a line from a column's top, an ejector set's drains and its connections under its deck.

- 20"-P150-V-17008: no valve at R-1701-N2; GATE 20 and what stood with it left out, 3 pieces, the pipe 30.6 in longer
- 42"-P150-V-17011: no valve at R-1701-N5; GATE 42 and what stood with it left out, 3 pieces, the pipe 58.5 in longer
- 42"-P150-V-17011: no valve at E-1703-N1; GATE 42 and what stood with it left out, 5 pieces, the pipe 60.8 in longer
- 36"-P150-V-17012: no valve at E-1703-N2; GATE 36 and what stood with it left out, 5 pieces, the pipe 52.6 in longer
- 36"-P150-V-17012: no valve at C-1705-N1; GATE 36 and what stood with it left out, 3 pieces, the pipe 50.7 in longer
- 24"-P300-V-17013: no valve at R-1701-N6; GATE 24 and what stood with it left out, 3 pieces, the pipe 35.1 in longer
- 24"-P300-V-17013: no valve at C-1701-N1; GATE 24 and what stood with it left out, 5 pieces, the pipe 36.9 in longer
- 6"-P150-P-17029: no valve at C-1702-N2; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer
- 6"-P150-P-17029: no valve at C-1701-N9; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer
- 24"-P150-V-17037: no valve at C-1701-N11; GATE 24 and what stood with it left out, 5 pieces, the pipe 36.5 in longer
- 24"-P150-V-17037: no valve at A-1701C-N1; GATE 24 and what stood with it left out, 3 pieces, the pipe 35.1 in longer
- 6"-P300-P-17060: no valve at C-1703-N4; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer
- 6"-P300-P-17060: no valve at C-1704-N3; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer
- 4"-P300-P-17061: no valve at C-1704-N4; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer
- 4"-P300-P-17061: no valve at C-1706-N1; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer
- 4"-P300-P-17064: no valve at C-1706-N4; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer
- 4"-P300-P-17064: no valve at D-1706-N1; GATE 4 and what stood with it left out, 5 pieces, the pipe 15.9 in longer
- 6"-P300-P-17070: no valve at C-1707-N2; GATE 6 and what stood with it left out, 5 pieces, the pipe 14.8 in longer
- 12"-P300-P-17074: no valve at C-1708-N2; GATE 12 and what stood with it left out, 5 pieces, the pipe 23.6 in longer
- 12"-P300-P-17074: no valve at E-1712-N1; GATE 12 and what stood with it left out, 5 pieces, the pipe 23.6 in longer
- 8"-P300-P-17093: no valve at C-1710-N2; GATE 8 and what stood with it left out, 5 pieces, the pipe 19.4 in longer
- 8"-P300-P-17093: no valve at E-1713-N1; GATE 8 and what stood with it left out, 5 pieces, the pipe 19.4 in longer

### Lines

| Line | Kind | Fluid | From | To | Design | Rack tier | Components | Welds | Supports | Length, ft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3"-P150-P-17001 | process | gas oil | BL-1701-U | CS-1701-A | 125 psi, 430 °F | 1 | 33 | 14 | 2 | 33 |
| 3"-P150-P-17701 | control | gas oil | CS-1701-B | D-1701-N1 | 125 psi, 430 °F | — | 21 | 12 | 4 | 68 |
| 3"-P150-P-17002 | process | gas oil | BL-1702-U | CS-1702-A | 105 psi, 200 °F | 1 | 37 | 18 | 1 | 35 |
| 3"-P150-P-17702 | control | gas oil | CS-1702-B | D-1701-N2 | 105 psi, 200 °F | — | 22 | 15 | 5 | 72 |
| 6"-P150-P-17003 | process | gas oil | BL-1703-U | CS-1703-A | 125 psi, 450 °F | 1 | 39 | 20 | 0 | 37 |
| 6"-P150-P-17703 | control | gas oil | CS-1703-B | D-1701-N3 | 125 psi, 450 °F | — | 20 | 13 | 3 | 84 |
| 10"-P150-P-17004 | process | gas oil | D-1701-N4 | P-1701A-S | 55 psi, 390 °F | — | 30 | 17 | 1 | 46 |
| 6"-P600-P-17005 | process | gas oil | P-1701A-D | E-1701-N1 | 330 psi, 390 °F | — | 34 | 21 | 6 | 104 |
| 8"-P600-P-17006 | process | gas oil | E-1701-N2 | E-1702-N1 | 330 psi, 450 °F | — | 21 | 10 | 1 | 21 |
| 8"-P600-P-17007 | process | gas oil | E-1702-N2 | CS-1704-A | 330 psi, 500 °F | 1 | 44 | 23 | 11 | 208 |
| 8"-P150-P-17704 | control | gas oil | CS-1704-B | R-1701-N1 | 55 psi, 500 °F | — | 21 | 12 | 2 | 61 |
| 20"-P150-V-17008 | process | process air | K-1701-N1 | R-1701-N2 | 65 psi, 430 °F | — | 20 | 11 | 6 | 105 |
| 3"-P150-P-17009 | process | process air | V-1701-N1 | R-1701-N3 | 70 psi, 150 °F | 1 | 33 | 26 | 21 | 276 |
| 3"-P150-P-17010 | process | process air | R-1701-N4 | V-1702-N1 | 55 psi, 650 °F | 1 | 35 | 28 | 20 | 301 |
| 42"-P150-V-17011 | process | flue gas | R-1701-N5 | E-1703-N1 | 50 psi, 650 °F | — | 12 | 9 | 0 | 79 |
| 36"-P150-V-17012 | process | flue gas | E-1703-N2 | C-1705-N1 | 50 psi, 600 °F | — | 5 | 2 | 1 | 4 |
| 24"-P300-V-17013 | process | hydrocarbon gas | R-1701-N6 | C-1701-N1 | 55 psi, 1030 °F | — | 15 | 12 | 1 | 139 |
| 14"-P300-P-17014 | process | slurry oil | C-1701-N2 | P-1702A-S | 55 psi, 730 °F | — | 31 | 18 | 1 | 58 |
| 10"-P600-P-17015 | process | slurry oil | P-1702A-D | E-1702-N3 | 210 psi, 730 °F | 1 | 41 | 28 | 8 | 183 |
| 10"-P600-P-17016 | process | slurry oil | E-1702-N4 | E-1704-N1 | 210 psi, 710 °F | — | 23 | 12 | 1 | 38 |
| 10"-P300-P-17017 | process | slurry oil | E-1704-N2 | CS-1705-A | 210 psi, 530 °F | 1 | 47 | 26 | 6 | 139 |
| 10"-P150-P-17705 | control | slurry oil | CS-1705-B | C-1701-N3 | 55 psi, 530 °F | — | 20 | 13 | 3 | 97 |
| 3"-P300-P-17018 | process | slurry oil | tap 10"-P300-P-17017 | E-1705-N1 | 210 psi, 530 °F | — | 14 | 9 | 0 | 30 |
| 3"-P300-P-17019 | process | slurry oil | E-1705-N2 | F-1701-N1 | 210 psi, 250 °F | 2 | 33 | 24 | 36 | 417 |
| 3"-P300-P-17020 | process | slurry oil | F-1701-N2 | CS-1706-A | 210 psi, 250 °F | 2 | 58 | 39 | 41 | 445 |
| 3"-P150-P-17706 | control | slurry oil | CS-1706-B | BL-1704-U | 85 psi, 250 °F | — | 19 | 12 | 1 | 35 |
| 10"-P150-P-17021 | process | gas oil | C-1701-N4 | P-1703A-S | 55 psi, 650 °F | — | 27 | 16 | 1 | 84 |
| 8"-P300-P-17022 | process | gas oil | P-1703A-D | E-1715-N1 | 210 psi, 650 °F | 1 | 39 | 26 | 8 | 208 |
| 8"-P300-P-17023 | process | gas oil | E-1715-N2 | CS-1707-A | 210 psi, 550 °F | 1 | 47 | 26 | 9 | 185 |
| 8"-P150-P-17707 | control | gas oil | CS-1707-B | C-1701-N5 | 55 psi, 550 °F | — | 23 | 16 | 3 | 110 |
| 10"-P150-P-17024 | process | diesel | C-1701-N6 | P-1704A-S | 50 psi, 500 °F | 1 | 34 | 23 | 3 | 160 |
| 8"-P300-P-17025 | process | diesel | P-1704A-D | E-1701-N3 | 210 psi, 500 °F | 1 | 39 | 26 | 8 | 220 |
| 8"-P300-P-17026 | process | diesel | E-1701-N4 | E-1707-N1 | 210 psi, 440 °F | 1 | 34 | 23 | 15 | 297 |
| 8"-P300-P-17027 | process | diesel | E-1707-N2 | CS-1708-A | 210 psi, 380 °F | 1 | 51 | 30 | 8 | 160 |
| 8"-P150-P-17708 | control | diesel | CS-1708-B | C-1701-N7 | 55 psi, 380 °F | — | 23 | 16 | 4 | 139 |
| 6"-P150-P-17028 | process | diesel | C-1701-N8 | CS-1709-A | 50 psi, 500 °F | 1 | 46 | 27 | 3 | 146 |
| 6"-P150-P-17709 | control | diesel | CS-1709-B | C-1702-N1 | 50 psi, 500 °F | — | 23 | 14 | 2 | 84 |
| 6"-P150-P-17029 | process | diesel | C-1702-N2 | C-1701-N9 | 50 psi, 490 °F | 2 | 29 | 26 | 4 | 228 |
| 6"-P150-P-17030 | process | diesel | C-1702-N3 | P-1705A-S | 50 psi, 485 °F | — | 27 | 14 | 2 | 57 |
| 4"-P600-P-17031 | process | diesel | P-1705A-D | A-1702-N1 | 345 psi, 485 °F | 2 | 36 | 25 | 4 | 166 |
| 4"-P600-P-17032 | process | diesel | A-1702-N2 | CS-1710-A | 345 psi, 190 °F | 3 | 44 | 25 | 2 | 88 |
| 4"-P150-P-17710 | control | diesel | CS-1710-B | BL-1705-U | 85 psi, 190 °F | — | 21 | 14 | 0 | 35 |
| 3"-P600-P-17033 | process | diesel | tap 4"-P600-P-17032 | CS-1711-A | 345 psi, 190 °F | — | 29 | 14 | 0 | 3 |
| 3"-P150-P-17711 | control | diesel | CS-1711-B | BL-1706-U | 105 psi, 190 °F | 1 | 27 | 20 | 4 | 71 |
| 3"-P600-P-17034 | process | diesel | RS-1701-B | E-1708-N1 | 345 psi, 190 °F | 2 | 21 | 12 | 8 | 114 |
| 3"-P600-P-17035 | process | diesel | E-1708-N2 | CS-1712-A | 345 psi, 150 °F | — | 42 | 21 | 3 | 76 |
| 3"-P300-P-17712 | control | diesel | CS-1712-B | C-1704-N1 | 215 psi, 150 °F | — | 23 | 16 | 6 | 154 |
| 3"-P150-P-17036 | process | diesel | C-1704-N2 | CS-1713-A | 65 psi, 165 °F | 2 | 50 | 31 | 8 | 141 |
| 3"-P150-P-17713 | control | diesel | CS-1713-B | C-1701-N10 | 65 psi, 165 °F | 2 | 34 | 27 | 7 | 173 |
| 24"-P150-V-17037 | process | hydrocarbon gas | C-1701-N11 | A-1701C-N1 | 50 psi, 320 °F | — | 22 | 19 | 0 | 115 |
| 16"-P150-P-17038 | process | hydrocarbon gas | A-1701A-N2 | E-1709-N1 | 50 psi, 190 °F | — | 26 | 17 | 5 | 113 |
| 16"-P150-P-17039 | process | hydrocarbon gas | E-1709-N2 | D-1702-N1 | 50 psi, 150 °F | — | 29 | 18 | 7 | 128 |
| 3"-P150-P-17040 | process | hydrocarbon gas | BL-1707-U | D-1702-N2 | 50 psi, 150 °F | 2 | 18 | 11 | 12 | 141 |
| 6"-P150-P-17041 | process | hydrocarbon gas | BL-1708-U | CS-1714-A | 50 psi, 190 °F | 1 | 41 | 22 | 6 | 118 |
| 6"-P150-P-17714 | control | hydrocarbon gas | CS-1714-B | D-1702-N3 | 50 psi, 190 °F | 1 | 25 | 18 | 4 | 105 |
| 6"-P150-P-17042 | process | gasoline | D-1702-N4 | P-1706A-S | 50 psi, 150 °F | — | 33 | 20 | 1 | 47 |
| 4"-P150-P-17043 | process | gasoline | P-1706A-D | CS-1715-A | 145 psi, 150 °F | 2 | 44 | 21 | 1 | 59 |
| 4"-P150-P-17715 | control | gasoline | CS-1715-B | C-1701-N12 | 145 psi, 150 °F | 2 | 39 | 30 | 3 | 189 |
| 6"-P150-P-17044 | process | gasoline | D-1702-N5 | P-1707A-S | 50 psi, 150 °F | — | 27 | 16 | 2 | 56 |
| 6"-P600-P-17045 | process | gasoline | P-1707A-D | CS-1716-A | 370 psi, 150 °F | 1 | 48 | 25 | 3 | 71 |
| 6"-P300-P-17716 | control | gasoline | CS-1716-B | C-1703-N1 | 225 psi, 150 °F | — | 21 | 14 | 4 | 158 |
| 3"-P150-P-17046 | process | sour water | D-1702-N6 | P-1708A-S | 50 psi, 150 °F | — | 31 | 20 | 1 | 57 |
| 3"-P300-P-17047 | process | sour water | P-1708A-D | CS-1717-A | 155 psi, 150 °F | 2 | 51 | 28 | 8 | 117 |
| 3"-P150-P-17717 | control | sour water | CS-1717-B | BL-1709-U | 85 psi, 190 °F | 1 | 27 | 20 | 3 | 59 |
| 14"-P150-P-17048 | process | hydrocarbon gas | D-1702-N7 | K-1702-N1 | 50 psi, 150 °F | 3 | 28 | 21 | 8 | 200 |
| 12"-P150-P-17049 | process | hydrocarbon gas | K-1702-N2 | A-1703-N1 | 85 psi, 250 °F | 3 | 29 | 22 | 2 | 119 |
| 10"-P150-P-17050 | process | hydrocarbon gas | A-1703-N2 | D-1703-N1 | 80 psi, 170 °F | — | 20 | 11 | 4 | 108 |
| 10"-P150-P-17051 | process | hydrocarbon gas | D-1703-N2 | K-1703-N1 | 80 psi, 170 °F | 1 | 30 | 23 | 6 | 152 |
| 8"-P300-P-17052 | process | hydrocarbon gas | K-1703-N2 | A-1704-N1 | 300 psi, 280 °F | 3 | 33 | 26 | 2 | 113 |
| 10"-P300-P-17053 | process | hydrocarbon gas | A-1704-N2 | E-1710-N1 | 300 psi, 180 °F | 3 | 33 | 24 | 4 | 139 |
| 10"-P300-P-17054 | process | hydrocarbon gas | E-1710-N2 | D-1704-N1 | 300 psi, 150 °F | 1 | 36 | 25 | 11 | 246 |
| 3"-P150-P-17055 | process | gasoline | D-1703-N3 | P-1709A-S | 80 psi, 170 °F | — | 29 | 18 | 1 | 41 |
| 3"-P300-P-17056 | process | gasoline | P-1709A-D | tap 8"-P300-P-17052 | 300 psi, 170 °F | — | 19 | 12 | 5 | 60 |
| 6"-P300-P-17057 | process | hydrocarbon gas | D-1704-N2 | C-1703-N2 | 225 psi, 150 °F | — | 17 | 10 | 0 | 26 |
| 8"-P300-P-17058 | process | gasoline | C-1703-N3 | P-1710A-S | 225 psi, 165 °F | — | 28 | 17 | 2 | 72 |
| 6"-P300-P-17059 | process | gasoline | P-1710A-D | tap 8"-P300-P-17052 | 275 psi, 165 °F | — | 16 | 9 | 3 | 54 |
| 6"-P300-P-17060 | process | hydrocarbon gas | C-1703-N4 | C-1704-N3 | 220 psi, 160 °F | 1 | 31 | 28 | 6 | 260 |
| 4"-P300-P-17061 | process | hydrocarbon gas | C-1704-N4 | C-1706-N1 | 215 psi, 160 °F | 2 | 30 | 27 | 5 | 234 |
| 4"-P600-P-17062 | process | amine solution | BL-1710-U | CS-1718-A | 330 psi, 170 °F | 1 | 46 | 27 | 3 | 78 |
| 4"-P300-P-17718 | control | amine solution | CS-1718-B | C-1706-N2 | 210 psi, 170 °F | 2 | 33 | 26 | 6 | 188 |
| 4"-P150-P-17063 | process | amine solution | C-1706-N3 | CS-1719-A | 105 psi, 185 °F | 2 | 55 | 36 | 6 | 183 |
| 4"-P150-P-17719 | control | amine solution | CS-1719-B | BL-1711-U | 95 psi, 190 °F | 1 | 25 | 18 | 3 | 62 |
| 4"-P300-P-17064 | process | fuel gas | C-1706-N4 | D-1706-N1 | 205 psi, 165 °F | 2 | 33 | 30 | 11 | 300 |
| 4"-P300-P-17065 | process | fuel gas | D-1706-N2 | CS-1720-A | 205 psi, 165 °F | 2 | 51 | 32 | 10 | 240 |
| 4"-P150-P-17720 | control | fuel gas | CS-1720-B | BL-1712-U | 95 psi, 165 °F | 1 | 27 | 20 | 2 | 64 |
| 3"-P150-P-17066 | process | sour water | D-1704-N3 | tap 3"-P300-P-17047 | 120 psi, 150 °F | — | 18 | 15 | 6 | 93 |
| 10"-P300-P-17067 | process | gasoline | D-1704-N4 | P-1711A-S | 225 psi, 150 °F | — | 32 | 21 | 3 | 82 |
| 8"-P600-P-17068 | process | gasoline | P-1711A-D | E-1711-N1 | 315 psi, 150 °F | 1 | 39 | 26 | 10 | 209 |
| 8"-P600-P-17069 | process | gasoline | E-1711-N2 | CS-1721-A | 315 psi, 230 °F | 1 | 46 | 25 | 9 | 171 |
| 8"-P300-P-17721 | control | gasoline | CS-1721-B | C-1707-N1 | 240 psi, 230 °F | — | 22 | 13 | 2 | 88 |
| 6"-P300-P-17070 | process | hydrocarbon gas | C-1707-N2 | RS-1702-B | 235 psi, 200 °F | 2 | 28 | 23 | 10 | 292 |
| 8"-P300-P-17071 | process | gasoline | C-1707-N3 | E-1707-N3 | 240 psi, 330 °F | — | 21 | 12 | 1 | 54 |
| 10"-P300-P-17072 | process | gasoline | E-1707-N4 | C-1707-N4 | 240 psi, 335 °F | — | 17 | 8 | 0 | 47 |
| 8"-P300-P-17073 | process | gasoline | C-1707-N5 | CS-1722-A | 190 psi, 340 °F | 1 | 43 | 22 | 4 | 87 |
| 8"-P300-P-17722 | control | gasoline | CS-1722-B | C-1708-N1 | 190 psi, 340 °F | — | 28 | 19 | 5 | 131 |
| 12"-P300-P-17074 | process | liquefied petroleum gas | C-1708-N2 | E-1712-N1 | 175 psi, 190 °F | 3 | 31 | 28 | 10 | 319 |
| 6"-P300-P-17075 | process | liquefied petroleum gas | E-1712-N2 | D-1705-N1 | 170 psi, 160 °F | 2 | 33 | 22 | 12 | 251 |
| 10"-P300-P-17076 | process | liquefied petroleum gas | D-1705-N2 | P-1712A-S | 165 psi, 160 °F | — | 31 | 18 | 1 | 50 |
| 6"-P300-P-17077 | process | liquefied petroleum gas | P-1712A-D | CS-1723-A | 300 psi, 160 °F | — | 46 | 23 | 0 | 35 |
| 6"-P300-P-17723 | control | liquefied petroleum gas | CS-1723-B | C-1708-N3 | 300 psi, 160 °F | — | 24 | 15 | 3 | 147 |
| 8"-P300-P-17078 | process | gasoline | C-1708-N4 | E-1715-N3 | 185 psi, 390 °F | — | 21 | 12 | 1 | 52 |
| 12"-P300-P-17079 | process | gasoline | E-1715-N4 | C-1708-N5 | 180 psi, 435 °F | — | 17 | 8 | 0 | 46 |
| 6"-P300-P-17080 | process | gasoline | C-1708-N6 | E-1711-N3 | 185 psi, 400 °F | 2 | 33 | 22 | 11 | 245 |
| 6"-P300-P-17081 | process | gasoline | E-1711-N4 | A-1705-N1 | 175 psi, 285 °F | 3 | 35 | 26 | 6 | 183 |
| 6"-P300-P-17082 | process | gasoline | A-1705-N2 | E-1717-N1 | 170 psi, 190 °F | 3 | 28 | 19 | 5 | 142 |
| 6"-P300-P-17083 | process | gasoline | E-1717-N2 | V-1704-N1 | 160 psi, 150 °F | 1 | 39 | 28 | 16 | 337 |
| 6"-P300-P-17084 | process | gasoline | V-1704-N2 | CS-1724-A | 155 psi, 150 °F | 1 | 52 | 31 | 13 | 288 |
| 6"-P150-P-17724 | control | gasoline | CS-1724-B | BL-1713-U | 75 psi, 150 °F | 1 | 27 | 20 | 9 | 198 |
| 4"-P300-P-17085 | process | gasoline | RS-1703-B | P-1714A-S | 160 psi, 150 °F | 2 | 28 | 17 | 7 | 153 |
| 3"-P600-P-17086 | process | gasoline | P-1714A-D | CS-1725-A | 325 psi, 150 °F | 1 | 52 | 29 | 5 | 78 |
| 3"-P300-P-17725 | control | gasoline | CS-1725-B | C-1703-N5 | 225 psi, 150 °F | — | 25 | 18 | 7 | 180 |
| 4"-P300-P-17087 | process | liquefied petroleum gas | RS-1704-B | CS-1726-A | 300 psi, 160 °F | 1 | 35 | 16 | 1 | 30 |
| 4"-P300-P-17726 | control | liquefied petroleum gas | CS-1726-B | C-1709-N1 | 300 psi, 160 °F | — | 19 | 12 | 2 | 49 |
| 3"-P300-P-17088 | process | liquefied petroleum gas | BL-1714-U | RS-1705-B | 275 psi, 160 °F | 2 | 16 | 9 | 27 | 281 |
| 3"-P600-P-17089 | process | amine solution | RS-1706-B | CS-1727-A | 330 psi, 170 °F | 2 | 40 | 21 | 24 | 253 |
| 3"-P300-P-17727 | control | amine solution | CS-1727-B | C-1709-N2 | 265 psi, 170 °F | — | 20 | 13 | 4 | 87 |
| 3"-P300-P-17090 | process | amine solution | C-1709-N3 | RS-1707-B | 215 psi, 165 °F | 2 | 26 | 19 | 21 | 252 |
| 4"-P300-P-17091 | process | liquefied petroleum gas | C-1709-N4 | V-1703-N1 | 260 psi, 160 °F | — | 17 | 8 | 0 | 25 |
| 4"-P300-P-17092 | process | liquefied petroleum gas | V-1703-N2 | CS-1728-A | 255 psi, 160 °F | — | 37 | 16 | 1 | 40 |
| 4"-P300-P-17728 | control | liquefied petroleum gas | CS-1728-B | C-1710-N1 | 255 psi, 160 °F | — | 24 | 15 | 2 | 99 |
| 8"-P300-P-17093 | process | liquefied petroleum gas | C-1710-N2 | E-1713-N1 | 240 psi, 170 °F | 1 | 32 | 29 | 13 | 412 |
| 6"-P300-P-17094 | process | liquefied petroleum gas | E-1713-N2 | D-1707-N1 | 235 psi, 160 °F | 1 | 34 | 23 | 13 | 299 |
| 6"-P300-P-17095 | process | liquefied petroleum gas | D-1707-N2 | P-1713A-S | 235 psi, 160 °F | — | 31 | 18 | 1 | 42 |
| 6"-P600-P-17096 | process | liquefied petroleum gas | P-1713A-D | CS-1729-A | 305 psi, 160 °F | 1 | 44 | 21 | 0 | 36 |
| 6"-P300-P-17729 | control | liquefied petroleum gas | CS-1729-B | C-1710-N3 | 250 psi, 160 °F | — | 25 | 16 | 3 | 153 |
| 3"-P600-P-17097 | process | liquefied petroleum gas | RS-1708-B | CS-1730-A | 305 psi, 160 °F | 2 | 46 | 27 | 32 | 334 |
| 3"-P300-P-17730 | control | liquefied petroleum gas | CS-1730-B | BL-1715-U | 265 psi, 160 °F | 1 | 27 | 20 | 4 | 68 |
| 6"-P300-P-17098 | process | liquefied petroleum gas | C-1710-N4 | E-1714-N1 | 250 psi, 275 °F | — | 21 | 12 | 0 | 33 |
| 8"-P300-P-17099 | process | liquefied petroleum gas | E-1714-N2 | C-1710-N5 | 245 psi, 285 °F | — | 17 | 8 | 0 | 40 |
| 3"-P300-P-17100 | process | liquefied petroleum gas | C-1710-N6 | E-1716-N1 | 250 psi, 285 °F | 2 | 36 | 25 | 23 | 294 |
| 3"-P300-P-17101 | process | liquefied petroleum gas | E-1716-N2 | CS-1731-A | 240 psi, 150 °F | — | 50 | 29 | 7 | 150 |
| 3"-P300-P-17731 | control | liquefied petroleum gas | CS-1731-B | BL-1716-U | 225 psi, 150 °F | 2 | 21 | 14 | 18 | 212 |
| 3"-P600-P-17601 | root | diesel | tap 4"-P600-P-17032 | RS-1701-A | 345 psi, 190 °F | — | 11 | 8 | 1 | 21 |
| 6"-P300-P-17602 | root | hydrocarbon gas | RS-1702-A | tap 8"-P300-P-17052 | 235 psi, 200 °F | — | 11 | 8 | 0 | 16 |
| 4"-P300-P-17603 | root | gasoline | tap 6"-P300-P-17083 | RS-1703-A | 160 psi, 150 °F | — | 11 | 8 | 0 | 10 |
| 4"-P300-P-17604 | root | liquefied petroleum gas | tap 6"-P300-P-17077 | RS-1704-A | 300 psi, 160 °F | — | 13 | 10 | 0 | 9 |
| 3"-P300-P-17605 | root | liquefied petroleum gas | RS-1705-A | tap 4"-P300-P-17087 | 275 psi, 160 °F | — | 11 | 8 | 0 | 11 |
| 3"-P600-P-17606 | root | amine solution | tap 4"-P600-P-17062 | RS-1706-A | 330 psi, 170 °F | — | 19 | 16 | 0 | 27 |
| 3"-P300-P-17607 | root | amine solution | RS-1707-A | tap 4"-P150-P-17063 | 215 psi, 165 °F | — | 11 | 8 | 0 | 17 |
| 3"-P600-P-17608 | root | liquefied petroleum gas | tap 6"-P600-P-17096 | RS-1708-A | 305 psi, 160 °F | — | 18 | 15 | 1 | 42 |
| 10"-P150-P-17301 | spare | gas oil | tap 10"-P150-P-17004 | P-1701B-S | 55 psi, 390 °F | — | 18 | 11 | 0 | 17 |
| 6"-P600-P-17302 | spare | gas oil | P-1701B-D | tap 6"-P600-P-17005 | 330 psi, 390 °F | — | 20 | 13 | 0 | 11 |
| 14"-P300-P-17303 | spare | slurry oil | tap 14"-P300-P-17014 | P-1702B-S | 55 psi, 730 °F | — | 23 | 16 | 0 | 31 |
| 10"-P600-P-17304 | spare | slurry oil | P-1702B-D | tap 10"-P600-P-17015 | 210 psi, 730 °F | — | 20 | 13 | 0 | 16 |
| 10"-P150-P-17305 | spare | gas oil | tap 10"-P150-P-17021 | P-1703B-S | 55 psi, 650 °F | — | 19 | 12 | 0 | 13 |
| 8"-P300-P-17306 | spare | gas oil | P-1703B-D | tap 8"-P300-P-17022 | 210 psi, 650 °F | — | 20 | 13 | 0 | 13 |
| 10"-P150-P-17307 | spare | diesel | tap 10"-P150-P-17024 | P-1704B-S | 50 psi, 500 °F | — | 13 | 6 | 0 | 5 |
| 8"-P300-P-17308 | spare | diesel | P-1704B-D | tap 8"-P300-P-17025 | 210 psi, 500 °F | — | 14 | 7 | 0 | 5 |
| 6"-P150-P-17309 | spare | diesel | tap 6"-P150-P-17030 | P-1705B-S | 50 psi, 485 °F | — | 19 | 12 | 0 | 11 |
| 4"-P600-P-17310 | spare | diesel | P-1705B-D | tap 4"-P600-P-17031 | 345 psi, 485 °F | — | 14 | 7 | 0 | 6 |
| 24"-P150-V-17311 | spare | hydrocarbon gas | tap 24"-P150-V-17037 | A-1701B-N1 | 50 psi, 320 °F | — | 13 | 10 | 0 | 38 |
| 24"-P150-V-17312 | spare | hydrocarbon gas | tap 24"-P150-V-17037 | A-1701A-N1 | 50 psi, 320 °F | — | 10 | 7 | 0 | 52 |
| 16"-P150-P-17313 | spare | hydrocarbon gas | A-1701B-N2 | tap 16"-P150-P-17038 | 50 psi, 190 °F | — | 13 | 10 | 0 | 26 |
| 16"-P150-P-17314 | spare | hydrocarbon gas | A-1701C-N2 | tap 16"-P150-P-17038 | 50 psi, 190 °F | — | 9 | 6 | 1 | 38 |
| 6"-P150-P-17315 | spare | gasoline | tap 6"-P150-P-17042 | P-1706B-S | 50 psi, 150 °F | — | 19 | 12 | 0 | 12 |
| 4"-P150-P-17316 | spare | gasoline | P-1706B-D | tap 4"-P150-P-17043 | 145 psi, 150 °F | — | 18 | 11 | 0 | 7 |
| 6"-P150-P-17317 | spare | gasoline | tap 6"-P150-P-17044 | P-1707B-S | 50 psi, 150 °F | — | 17 | 10 | 0 | 11 |
| 6"-P600-P-17318 | spare | gasoline | P-1707B-D | tap 6"-P600-P-17045 | 370 psi, 150 °F | — | 14 | 7 | 0 | 6 |
| 3"-P150-P-17319 | spare | sour water | tap 3"-P150-P-17046 | P-1708B-S | 50 psi, 150 °F | — | 17 | 10 | 0 | 8 |
| 3"-P300-P-17320 | spare | sour water | P-1708B-D | tap 3"-P300-P-17047 | 155 psi, 150 °F | — | 14 | 7 | 0 | 6 |
| 3"-P150-P-17321 | spare | gasoline | tap 3"-P150-P-17055 | P-1709B-S | 80 psi, 170 °F | — | 15 | 8 | 0 | 9 |
| 3"-P300-P-17322 | spare | gasoline | P-1709B-D | tap 8"-P300-P-17052 | 300 psi, 170 °F | — | 21 | 14 | 2 | 68 |
| 8"-P300-P-17323 | spare | gasoline | tap 8"-P300-P-17058 | P-1710B-S | 225 psi, 165 °F | — | 19 | 12 | 0 | 12 |
| 6"-P300-P-17324 | spare | gasoline | P-1710B-D | tap 8"-P300-P-17052 | 275 psi, 165 °F | — | 20 | 13 | 2 | 62 |
| 10"-P300-P-17325 | spare | gasoline | tap 10"-P300-P-17067 | P-1711B-S | 225 psi, 150 °F | — | 19 | 12 | 0 | 13 |
| 8"-P600-P-17326 | spare | gasoline | P-1711B-D | tap 8"-P600-P-17068 | 315 psi, 150 °F | — | 14 | 7 | 0 | 5 |
| 10"-P300-P-17327 | spare | liquefied petroleum gas | tap 10"-P300-P-17076 | P-1712B-S | 165 psi, 160 °F | — | 19 | 12 | 0 | 15 |
| 6"-P300-P-17328 | spare | liquefied petroleum gas | P-1712B-D | tap 6"-P300-P-17077 | 300 psi, 160 °F | — | 20 | 13 | 0 | 11 |
| 4"-P300-P-17329 | spare | gasoline | tap 4"-P300-P-17085 | P-1714B-S | 160 psi, 150 °F | — | 15 | 8 | 0 | 8 |
| 3"-P600-P-17330 | spare | gasoline | P-1714B-D | tap 3"-P600-P-17086 | 325 psi, 150 °F | — | 14 | 7 | 0 | 6 |
| 6"-P300-P-17331 | spare | liquefied petroleum gas | tap 6"-P300-P-17095 | P-1713B-S | 235 psi, 160 °F | — | 19 | 12 | 0 | 9 |
| 6"-P600-P-17332 | spare | liquefied petroleum gas | P-1713B-D | tap 6"-P600-P-17096 | 305 psi, 160 °F | — | 16 | 9 | 0 | 10 |
| 20"-P150-CWS-17401 | header | cooling water supply | BL-1717-U | cap | 140 psi, 150 °F | — | 18 | 14 | 20 | 416 |
| 2"-P150-IA-17402 | header | instrument air | BL-1718-U | cap | 130 psi, 150 °F | — | 18 | 14 | 40 | 408 |
| 4"-P1200-SC-17403 | header | boiler feed water | BL-1719-U | cap | 1035 psi, 300 °F | — | 20 | 16 | 20 | 408 |
| 8"-P1200-LS-17404 | header | steam, 600 psi | BL-1720-U | cap | 685 psi, 700 °F | — | 18 | 14 | 20 | 416 |
| 3"-P300-W-17405 | header | raw and service water | BL-1721-U | cap | 160 psi, 150 °F | — | 19 | 15 | 41 | 416 |
| 2"-P600-P-17406 | header | caustic solution | BL-1722-U | cap | 385 psi, 150 °F | — | 23 | 19 | 40 | 408 |
| 10"-P300-LS-17407 | header | steam, 150 psi | BL-1723-U | cap | 185 psi, 450 °F | — | 20 | 16 | 20 | 408 |
| 20"-P150-CWR-17408 | header | cooling water return | BL-1724-U | cap | 70 psi, 155 °F | — | 18 | 14 | 20 | 416 |
| 14"-P150-P-17409 | header | steam, 50 psi | BL-1725-U | cap | 80 psi, 370 °F | — | 18 | 14 | 20 | 416 |
| 2"-P150-SC-17410 | header | steam condensate | BL-1726-U | cap | 55 psi, 280 °F | — | 19 | 15 | 40 | 408 |
| 2"-P150-IA-17501 | utility | instrument air | tap 2"-P150-IA-17402 | CS-1732-A | 130 psi, 150 °F | — | 37 | 26 | 1 | 42 |
| 2"-P150-IA-17551 | control | instrument air | CS-1732-B | V-1701-N2 | 115 psi, 150 °F | — | 18 | 11 | 4 | 53 |
| 3"-P1200-SC-17502 | utility | boiler feed water | tap 4"-P1200-SC-17403 | CS-1733-A | 1035 psi, 300 °F | — | 34 | 15 | 1 | 43 |
| 3"-P1200-SC-17552 | control | boiler feed water | CS-1733-B | E-1703-N3 | 770 psi, 300 °F | — | 23 | 14 | 3 | 89 |
| 8"-P1200-LS-17503 | utility | steam, 600 psi | E-1703-N4 | tap 8"-P1200-LS-17404 | 685 psi, 700 °F | — | 24 | 15 | 1 | 64 |
| 3"-P300-W-17504 | utility | raw and service water | tap 3"-P300-W-17405 | CS-1734-A | 160 psi, 150 °F | — | 42 | 19 | 1 | 49 |
| 3"-P150-W-17553 | control | raw and service water | CS-1734-B | C-1705-N2 | 105 psi, 150 °F | — | 27 | 16 | 1 | 53 |
| 2"-P600-P-17505 | utility | caustic solution | tap 2"-P600-P-17406 | CS-1735-A | 385 psi, 150 °F | — | 36 | 17 | 1 | 39 |
| 2"-P150-P-17554 | control | caustic solution | CS-1735-B | C-1705-N3 | 85 psi, 150 °F | — | 19 | 12 | 3 | 57 |
| 6"-P300-LS-17506 | utility | steam, 150 psi | tap 10"-P300-LS-17407 | R-1701-N7 | 185 psi, 450 °F | — | 20 | 13 | 2 | 58 |
| 3"-P1200-SC-17507 | utility | boiler feed water | tap 4"-P1200-SC-17403 | CS-1736-A | 1035 psi, 300 °F | — | 36 | 17 | 1 | 46 |
| 3"-P300-SC-17555 | control | boiler feed water | CS-1736-B | E-1704-N3 | 275 psi, 300 °F | — | 24 | 15 | 3 | 62 |
| 10"-P300-LS-17508 | utility | steam, 150 psi | E-1704-N4 | tap 10"-P300-LS-17407 | 185 psi, 450 °F | — | 25 | 16 | 4 | 90 |
| 6"-P150-CWS-17509 | utility | cooling water supply | tap 20"-P150-CWS-17401 | E-1705-N3 | 140 psi, 150 °F | — | 33 | 20 | 5 | 92 |
| 6"-P150-CWR-17510 | utility | cooling water return | E-1705-N4 | tap 20"-P150-CWR-17408 | 70 psi, 155 °F | — | 32 | 19 | 4 | 73 |
| 2"-P300-LS-17511 | utility | steam, 150 psi | tap 10"-P300-LS-17407 | C-1702-N4 | 185 psi, 450 °F | — | 23 | 16 | 3 | 50 |
| 6"-P300-LS-17512 | utility | steam, 150 psi | tap 10"-P300-LS-17407 | C-1701-N13 | 185 psi, 450 °F | — | 20 | 13 | 2 | 46 |
| 3"-P150-CWS-17513 | utility | cooling water supply | tap 20"-P150-CWS-17401 | E-1708-N3 | 140 psi, 150 °F | — | 31 | 18 | 5 | 93 |
| 3"-P150-CWR-17514 | utility | cooling water return | E-1708-N4 | tap 20"-P150-CWR-17408 | 70 psi, 155 °F | — | 31 | 18 | 4 | 73 |
| 8"-P150-CWS-17515 | utility | cooling water supply | tap 20"-P150-CWS-17401 | E-1709-N3 | 140 psi, 150 °F | — | 31 | 18 | 3 | 95 |
| 8"-P150-CWR-17516 | utility | cooling water return | E-1709-N4 | tap 20"-P150-CWR-17408 | 70 psi, 155 °F | — | 31 | 18 | 3 | 71 |
| 8"-P1200-LS-17517 | utility | steam, 600 psi | tap 8"-P1200-LS-17404 | K-1702-N3 | 685 psi, 700 °F | — | 22 | 15 | 1 | 78 |
| 14"-P150-P-17518 | utility | steam, 50 psi | K-1702-N4 | tap 14"-P150-P-17409 | 80 psi, 370 °F | — | 19 | 12 | 2 | 89 |
| 6"-P150-CWS-17519 | utility | cooling water supply | tap 20"-P150-CWS-17401 | E-1710-N3 | 140 psi, 150 °F | — | 33 | 20 | 5 | 93 |
| 6"-P150-CWR-17520 | utility | cooling water return | E-1710-N4 | tap 20"-P150-CWR-17408 | 70 psi, 155 °F | — | 31 | 18 | 1 | 74 |
| 14"-P150-P-17521 | utility | cooling water supply | tap 20"-P150-CWS-17401 | E-1712-N3 | 140 psi, 150 °F | — | 21 | 16 | 3 | 96 |
| 14"-P150-P-17522 | utility | cooling water return | E-1712-N4 | tap 20"-P150-CWR-17408 | 70 psi, 155 °F | — | 20 | 15 | 1 | 73 |
| 6"-P150-CWS-17523 | utility | cooling water supply | tap 20"-P150-CWS-17401 | E-1717-N3 | 140 psi, 150 °F | — | 33 | 20 | 5 | 93 |
| 6"-P150-CWR-17524 | utility | cooling water return | E-1717-N4 | tap 20"-P150-CWR-17408 | 70 psi, 155 °F | — | 32 | 19 | 2 | 73 |
| 2"-P600-P-17525 | utility | caustic solution | tap 2"-P600-P-17406 | CS-1737-A | 385 psi, 150 °F | — | 34 | 15 | 1 | 35 |
| 2"-P150-P-17556 | control | caustic solution | CS-1737-B | V-1704-N3 | 125 psi, 150 °F | — | 19 | 12 | 5 | 53 |
| 2"-P600-P-17526 | utility | caustic solution | tap 2"-P600-P-17406 | CS-1738-A | 385 psi, 150 °F | — | 36 | 17 | 1 | 33 |
| 2"-P300-P-17557 | control | caustic solution | CS-1738-B | V-1703-N3 | 275 psi, 150 °F | — | 20 | 13 | 7 | 72 |
| 10"-P150-CWS-17527 | utility | cooling water supply | tap 20"-P150-CWS-17401 | E-1713-N3 | 140 psi, 150 °F | — | 33 | 20 | 3 | 95 |
| 10"-P150-CWR-17528 | utility | cooling water return | E-1713-N4 | tap 20"-P150-CWR-17408 | 70 psi, 155 °F | — | 32 | 19 | 2 | 75 |
| 4"-P300-LS-17529 | utility | steam, 150 psi | tap 10"-P300-LS-17407 | E-1714-N3 | 185 psi, 450 °F | — | 25 | 16 | 4 | 89 |
| 2"-P300-SC-17530 | utility | steam condensate | E-1714-N4 | CS-1739-A | 165 psi, 410 °F | — | 42 | 21 | 5 | 75 |
| 2"-P150-SC-17558 | control | steam condensate | CS-1739-B | tap 2"-P150-SC-17410 | 55 psi, 280 °F | — | 18 | 11 | 1 | 37 |
| 6"-P150-CWS-17531 | utility | cooling water supply | tap 20"-P150-CWS-17401 | E-1716-N3 | 140 psi, 150 °F | — | 31 | 18 | 4 | 93 |
| 6"-P150-CWR-17532 | utility | cooling water return | E-1716-N4 | tap 20"-P150-CWR-17408 | 70 psi, 155 °F | — | 31 | 18 | 1 | 74 |

## Unit 18: Sulfur block

139 lines: 59 of the flowsheet, 20 to installed spares and parallel bodies, 7 utility headers and 21 utility connections, 31 parts of lines after their control stations (SW-RPI-9), and 1 connections to branch root spools (SW-RPI-8). The lines that run the rack are on 3 of its tiers (SW-RPI-7), each in a lane given it beforehand, no tier loaded beyond 84 in of lanes at any section: tier 1 18 lines, tier 2 12 lines, tier 3 6 lines. The generator was run 44 times: once for each line that runs the rack or rises in a column's chase, with the branches that tap it, and once for the rest.

| Component | Count |
| --- | --- |
| cap | 7 |
| elbow | 692 |
| flange | 542 |
| gasket | 827 |
| olet | 7 |
| pipe | 1102 |
| reducer | 84 |
| spade | 63 |
| spectacle | 18 |
| tee | 36 |
| valve | 361 |

| Welds | Count |
| --- | --- |
| BW, field | 325 |
| BW, shop | 1881 |
| FW, shop | 15 |

| Supports | Count |
| --- | --- |
| anchor | 43 |
| guide | 115 |
| hanger | 78 |
| shoe | 294 |
| stanchion | 116 |
| trapeze | 1 |
| trunnion | 62 |

### Checks

| Check (the generator's own, §40) | Found |
| --- | --- |
| every line continuous from end to end | 0 |
| every joint a joint of its class | 0 |
| elbows and the straights between them | 0 |
| valves by class and size | 0 |
| 3 in between lines | 0 |
| 3 in from steel and equipment | 0 |
| spans within SW-PS-7, a support at every rack beam crossed | 7 |

Not at zero, supports:

- 3"-P150-P-18711: no shoe at bent x=360
- 4"-P300-P-18030: unsupported span 249 in > 240 on run from 738,246,503
- 3"-P150-P-18059: unsupported span 280 in > 180 on run from 984,246,619
- 3"-P150-CWS-18503: unsupported span 259 in > 180 on run from 678,102,215
- 2"-P1200-SC-18507: unsupported span 126 in > 120 on run from 2562,372,39
- 2"-P300-SC-18554: unsupported span 136 in > 120 on run from 894,96,111
- 2"-P300-SC-18556: unsupported span 135 in > 120 on run from 1050,102,237

These runs are longer than a pipe of their size spans and no steel stands where a support would go: lines that cross the yard or run beside the rack away from the support beams. They are listed, not hidden, and want pipe supports of their own.

### Battery limit

| Spool | Stream | Direction | Line | Stands at (x, y, z), in | Tier | Lane |
| --- | --- | --- | --- | --- | --- | --- |
| BL-1801 | rich amine | in | 4"-P150-P-18001 | 150, 198, -12 | 1 | -12 |
| BL-1805 | stripped water | out | 4"-P150-P-18716 | 150, 198, 12 | 1 | 12 |
| BL-1806 | stripped water to wastewater | out | 3"-P150-P-18717 | 150, 198, 36 | 1 | 36 |
| BL-1802 | lean amine | out | 6"-P600-P-18706 | 150, 204, 60 | 1 | — |
| BL-1804 | slop oil | out | 3"-P150-P-18711 | 150, 198, 84 | 1 | — |
| BL-1803 | sour water | in | 4"-P150-P-18022 | 150, 270, -18 | 2 | -18 |
| BL-1812 | high-pressure steam | out | 4"-P1200-LS-18406 | 150, 342, -60 | 3 | -60 |
| BL-1810 | cooling water return | out | 3"-P150-CWR-18404 | 240, 342, -42 | 3 | -42 |
| BL-1808 | condensate | out | 3"-P150-SC-18402 | 150, 342, -24 | 3 | -24 |
| BL-1807 | low-pressure steam | in | 10"-P150-LS-18401 | 240, 348, 0 | 3 | 0 |
| BL-1809 | cooling water supply | in | 3"-P150-CWS-18403 | 150, 342, 24 | 3 | 24 |
| BL-1811 | boiler feed water | in | 2"-P1200-SC-18405 | 240, 342, 42 | 3 | 42 |
| BL-1813 | fuel gas to users | in | 2"-P150-P-18407 | 150, 342, 60 | 3 | 60 |

### Branch roots

Branches that travel the rack start at a spool on it, a block valve on each face (SW-RPI-8).

| Spool | Branch | Connection to the tee | On | Stands at (x, y, z), in | Tier |
| --- | --- | --- | --- | --- | --- |
| RS-1801 | 3"-P600-P-18018 | 3"-P600-P-18601 | 6"-P600-P-18017 | 720, 270, -72 | 2 |

### Control valve stations

Each stands at grade under the rack, on a spool that divides its line (SW-RPI-9): the flowsheet's control valves, and those of the utility connections that are fed or drained under control (boiler feed water to a steam generator, condensate from a steam heater: SW-PRC-19).

| Line | Station | Spool | Stands at (x, y, z), in | The line after it |
| --- | --- | --- | --- | --- |
| 4"-P150-P-18001 | piped | CS-1801 | 540, 36, -108 | 4"-P150-P-18701 |
| 3"-P150-P-18002 | piped | CS-1802 | 3888, 36, 108 | 3"-P150-P-18702 |
| 6"-P150-P-18005 | piped | CS-1803 | 1002, 36, -108 | 6"-P150-P-18703 |
| 3"-P150-P-18009 | piped | CS-1804 | 1002, 36, -36 | 3"-P150-P-18704 |
| 4"-P150-P-18010 | piped | CS-1805 | 1488, 36, -108 | 4"-P150-P-18705 |
| 6"-P600-P-18017 | piped | CS-1806 | 450, 36, 108 | 6"-P600-P-18706 |
| 3"-P600-P-18019 | piped | CS-1807 | 696, 36, -36 | 3"-P150-P-18707 |
| 3"-P150-P-18021 | piped | CS-1808 | 468, 36, -36 | 3"-P150-P-18708 |
| 4"-P150-P-18022 | piped | CS-1809 | 1506, 36, -36 | 4"-P150-P-18709 |
| 3"-P150-P-18023 | piped | CS-1810 | 3888, 36, -108 | 3"-P150-P-18710 |
| 3"-P150-P-18025 | piped | CS-1811 | 444, 36, 36 | 3"-P150-P-18711 |
| 4"-P150-P-18027 | piped | CS-1812 | 1626, 36, -108 | 4"-P150-P-18712 |
| 4"-P300-P-18030 | piped | CS-1813 | 1950, 36, -108 | 4"-P150-P-18713 |
| 6"-P150-P-18033 | piped | CS-1814 | 1950, 36, -36 | 6"-P150-P-18714 |
| 3"-P150-P-18034 | piped | CS-1815 | 1824, 36, 36 | 3"-P150-P-18715 |
| 4"-P300-P-18040 | piped | CS-1816 | 684, 36, 36 | 4"-P150-P-18716 |
| 3"-P300-P-18041 | piped | CS-1817 | 804, 36, 108 | 3"-P150-P-18717 |
| 4"-P150-P-18042 | piped | CS-1818 | 2460, 36, -108 | 4"-P150-P-18718 |
| 3"-P150-P-18043 | piped | CS-1819 | 2460, 36, -36 | 3"-P150-P-18719 |
| 3"-P150-P-18046 | piped | CS-1820 | 1554, 36, 36 | 3"-P150-P-18720 |
| 6"-P150-P-18047 | piped | CS-1821 | 2490, 36, 36 | 6"-P150-P-18721 |
| 3"-P150-P-18059 | piped | CS-1822 | 2904, 36, -108 | 3"-P150-P-18722 |
| 2"-P150-SC-18502 | piped | CS-1823 | 996, 36, 36 | 2"-P150-SC-18551 |
| 2"-P150-SC-18506 | piped | CS-1824 | 1974, 36, 108 | 2"-P150-SC-18552 |
| 2"-P1200-SC-18507 | piped | CS-1825 | 2688, 36, -108 | 2"-P1200-SC-18553 |
| 2"-P1200-SC-18509 | piped | CS-1826 | 1014, 36, 108 | 2"-P300-SC-18554 |
| 2"-P1200-SC-18512 | piped | CS-1827 | 1482, 36, 108 | 2"-P150-SC-18555 |
| 2"-P1200-SC-18513 | piped | CS-1828 | 750, 36, -108 | 2"-P300-SC-18556 |
| 2"-P1200-SC-18516 | piped | CS-1829 | 1008, 36, 72 | 2"-P150-SC-18557 |
| 2"-P1200-SC-18517 | piped | CS-1830 | 1686, 36, 108 | 2"-P300-SC-18558 |
| 2"-P150-SC-18521 | piped | CS-1831 | 2430, 36, 108 | 2"-P150-SC-18559 |

### Headers at the battery limit

Each utility header ends at the limit in a block valve and a spool on the top tier, in its own lane, and runs straight through the valve; the plant's header joins it on the pipeway's side (SW-RPI-15, SW-PWY-12). 7 headers carried on in line to their block valves at the battery limit, the cap there left out: 4"-P1200-LS-18406 from BL-1812-U, its first piece 188.1 in longer, a shoe at x 360; 3"-P150-CWR-18404 from BL-1810-U, its first piece 112.7 in longer, a shoe at x 360; 3"-P150-SC-18402 from BL-1808-U, its first piece 190.3 in longer, a shoe at x 360 and 240; 10"-P150-LS-18401 from BL-1807-U, its first piece 91.3 in longer, a shoe at x 360; 3"-P150-CWS-18403 from BL-1809-U, its first piece 202.7 in longer, a shoe at x 360 and 240; 2"-P1200-SC-18405 from BL-1811-U, its first piece 103.7 in longer, a shoe at x 360; 2"-P150-P-18407 from BL-1813-U, its first piece 194.8 in longer, a shoe at x 360 and 240.

### Connections without a valve

At these ends the valve the generator stands at every equipment connection is not built, and the line's own flange meets the nozzle (SW-RPI-14): a transfer line from a fired heater, a line from a column's top, an ejector set's drains and its connections under its deck.

- 8"-P150-P-18006: no valve at C-1801-N2; GATE 8 and what stood with it left out, 5 pieces, the pipe 19.3 in longer
- 8"-P150-P-18006: no valve at A-1801-N1; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.7 in longer
- 3"-P150-P-18034: no valve at C-1802-N4; GATE 3 and what stood with it left out, 5 pieces, the pipe 14.1 in longer
- 3"-P150-P-18715: no valve at D-1805-N1; GATE 3 and what stood with it left out, 5 pieces, the pipe 14.1 in longer

### Lines

| Line | Kind | Fluid | From | To | Design | Rack tier | Components | Welds | Supports | Length, ft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4"-P150-P-18001 | process | amine solution | BL-1801-U | CS-1801-A | 95 psi, 190 °F | 1 | 33 | 14 | 1 | 38 |
| 4"-P150-P-18701 | control | amine solution | CS-1801-B | D-1801-N1 | 95 psi, 190 °F | — | 21 | 12 | 1 | 62 |
| 3"-P150-P-18002 | process | hydrocarbon gas | D-1801-N2 | CS-1802-A | 50 psi, 185 °F | 2 | 46 | 27 | 31 | 330 |
| 3"-P150-P-18702 | control | hydrocarbon gas | CS-1802-B | H-1802-N1 | 50 psi, 185 °F | 1 | 23 | 16 | 5 | 75 |
| 6"-P150-P-18003 | process | amine solution | D-1801-N3 | P-1801A-S | 50 psi, 185 °F | — | 29 | 18 | 1 | 45 |
| 6"-P150-P-18004 | process | amine solution | P-1801A-D | E-1801-N1 | 150 psi, 185 °F | — | 31 | 18 | 3 | 75 |
| 6"-P150-P-18005 | process | amine solution | E-1801-N2 | CS-1803-A | 150 psi, 260 °F | 2 | 48 | 27 | 7 | 119 |
| 6"-P150-P-18703 | control | amine solution | CS-1803-B | C-1801-N1 | 150 psi, 260 °F | — | 21 | 12 | 2 | 79 |
| 8"-P150-P-18006 | process | acid gas | C-1801-N2 | A-1801-N1 | 50 psi, 275 °F | 3 | 29 | 26 | 3 | 186 |
| 6"-P150-P-18007 | process | acid gas | A-1801-N2 | D-1802-N1 | 50 psi, 170 °F | — | 21 | 12 | 1 | 63 |
| 3"-P150-P-18008 | process | sour water | D-1802-N2 | P-1802A-S | 50 psi, 170 °F | — | 31 | 18 | 1 | 41 |
| 3"-P150-P-18009 | process | sour water | P-1802A-D | CS-1804-A | 115 psi, 170 °F | — | 44 | 21 | 1 | 27 |
| 3"-P150-P-18704 | control | sour water | CS-1804-B | C-1801-N3 | 115 psi, 170 °F | — | 24 | 15 | 3 | 120 |
| 4"-P150-P-18010 | process | acid gas | D-1802-N3 | CS-1805-A | 50 psi, 170 °F | 2 | 42 | 23 | 5 | 107 |
| 4"-P150-P-18705 | control | acid gas | CS-1805-B | D-1803-N1 | 50 psi, 170 °F | — | 17 | 8 | 4 | 55 |
| 6"-P150-P-18011 | process | amine solution | C-1801-N4 | E-1802-N1 | 50 psi, 300 °F | — | 19 | 10 | 1 | 33 |
| 16"-P150-P-18012 | process | amine solution | E-1802-N2 | C-1801-N5 | 50 psi, 305 °F | — | 17 | 8 | 0 | 31 |
| 6"-P150-P-18013 | process | amine solution | C-1801-N6 | P-1803A-S | 50 psi, 305 °F | — | 27 | 14 | 2 | 46 |
| 6"-P600-P-18014 | process | amine solution | P-1803A-D | E-1801-N3 | 445 psi, 305 °F | 1 | 34 | 21 | 5 | 117 |
| 6"-P600-P-18015 | process | amine solution | E-1801-N4 | A-1802-N1 | 445 psi, 230 °F | 3 | 37 | 28 | 1 | 114 |
| 6"-P600-P-18016 | process | amine solution | A-1802-N2 | E-1803-N1 | 445 psi, 180 °F | 3 | 24 | 15 | 2 | 99 |
| 6"-P600-P-18017 | process | amine solution | E-1803-N2 | CS-1806-A | 445 psi, 170 °F | — | 39 | 18 | 0 | 28 |
| 6"-P600-P-18706 | control | amine solution | CS-1806-B | BL-1802-U | 330 psi, 170 °F | — | 15 | 8 | 1 | 35 |
| 3"-P600-P-18018 | process | amine solution | RS-1801-B | F-1801-N1 | 445 psi, 170 °F | 2 | 22 | 15 | 23 | 246 |
| 3"-P600-P-18019 | process | amine solution | F-1801-N2 | CS-1807-A | 445 psi, 170 °F | 2 | 55 | 36 | 24 | 275 |
| 3"-P150-P-18707 | control | amine solution | CS-1807-B | T-1801-N1 | 0 psi, 170 °F | — | 28 | 19 | 9 | 151 |
| 3"-P150-P-18020 | process | amine solution | T-1801-N2 | P-1804A-S | 50 psi, 165 °F | — | 30 | 17 | 3 | 78 |
| 3"-P150-P-18021 | process | amine solution | P-1804A-D | CS-1808-A | 85 psi, 165 °F | 1 | 50 | 27 | 4 | 75 |
| 3"-P150-P-18708 | control | amine solution | CS-1808-B | D-1801-N4 | 85 psi, 165 °F | — | 21 | 14 | 3 | 65 |
| 4"-P150-P-18022 | process | sour water | BL-1803-U | CS-1809-A | 85 psi, 190 °F | 2 | 39 | 20 | 6 | 121 |
| 4"-P150-P-18709 | control | sour water | CS-1809-B | D-1804-N1 | 85 psi, 190 °F | — | 22 | 13 | 2 | 62 |
| 3"-P150-P-18023 | process | acid gas | D-1804-N2 | CS-1810-A | 50 psi, 155 °F | 1 | 44 | 25 | 21 | 231 |
| 3"-P150-P-18710 | control | acid gas | CS-1810-B | H-1802-N2 | 50 psi, 155 °F | 1 | 25 | 18 | 5 | 79 |
| 3"-P150-P-18024 | process | oily water | D-1804-N3 | P-1808A-S | 50 psi, 155 °F | — | 31 | 20 | 1 | 41 |
| 3"-P150-P-18025 | process | oily water | P-1808A-D | CS-1811-A | 130 psi, 155 °F | 2 | 54 | 31 | 10 | 144 |
| 3"-P150-P-18711 | control | oily water | CS-1811-B | BL-1804-U | 65 psi, 200 °F | — | 15 | 8 | 2 | 35 |
| 6"-P150-P-18026 | process | sour water | D-1804-N4 | P-1809A-S | 50 psi, 155 °F | — | 29 | 18 | 1 | 45 |
| 4"-P150-P-18027 | process | sour water | P-1809A-D | CS-1812-A | 90 psi, 155 °F | — | 44 | 21 | 0 | 25 |
| 4"-P150-P-18712 | control | sour water | CS-1812-B | T-1802-N1 | 90 psi, 155 °F | — | 22 | 13 | 2 | 76 |
| 6"-P150-P-18028 | process | sour water | T-1802-N2 | P-1805A-S | 50 psi, 150 °F | — | 32 | 19 | 2 | 83 |
| 4"-P300-P-18029 | process | sour water | P-1805A-D | E-1804-N1 | 160 psi, 150 °F | 2 | 45 | 32 | 8 | 190 |
| 4"-P300-P-18030 | process | sour water | E-1804-N2 | CS-1813-A | 160 psi, 250 °F | 2 | 52 | 31 | 9 | 180 |
| 4"-P150-P-18713 | control | sour water | CS-1813-B | C-1802-N1 | 55 psi, 250 °F | — | 23 | 14 | 2 | 65 |
| 8"-P150-P-18031 | process | sour water | C-1802-N2 | P-1806A-S | 50 psi, 240 °F | — | 28 | 17 | 2 | 87 |
| 6"-P150-P-18032 | process | sour water | P-1806A-D | A-1803-N1 | 110 psi, 240 °F | 3 | 38 | 27 | 4 | 149 |
| 6"-P150-P-18033 | process | sour water | A-1803-N2 | CS-1814-A | 110 psi, 200 °F | 3 | 47 | 28 | 5 | 129 |
| 6"-P150-P-18714 | control | sour water | CS-1814-B | C-1802-N3 | 110 psi, 200 °F | — | 22 | 15 | 3 | 126 |
| 3"-P150-P-18034 | process | acid gas | C-1802-N4 | CS-1815-A | 50 psi, 230 °F | — | 39 | 22 | 3 | 152 |
| 3"-P150-P-18715 | control | acid gas | CS-1815-B | D-1805-N1 | 50 psi, 230 °F | — | 16 | 11 | 3 | 57 |
| 6"-P150-P-18035 | process | sour water | C-1802-N5 | E-1805-N1 | 55 psi, 310 °F | — | 19 | 10 | 0 | 33 |
| 14"-P150-P-18036 | process | sour water | E-1805-N2 | C-1802-N6 | 50 psi, 315 °F | — | 17 | 8 | 0 | 34 |
| 6"-P150-P-18037 | process | process and wash water | C-1802-N7 | P-1807A-S | 55 psi, 315 °F | — | 29 | 16 | 1 | 50 |
| 4"-P300-P-18038 | process | process and wash water | P-1807A-D | E-1804-N3 | 185 psi, 315 °F | 1 | 34 | 21 | 9 | 187 |
| 4"-P300-P-18039 | process | process and wash water | E-1804-N4 | A-1804-N1 | 185 psi, 215 °F | 2 | 33 | 24 | 2 | 132 |
| 4"-P300-P-18040 | process | process and wash water | A-1804-N2 | CS-1816-A | 185 psi, 170 °F | 3 | 47 | 28 | 3 | 101 |
| 4"-P150-P-18716 | control | process and wash water | CS-1816-B | BL-1805-U | 125 psi, 170 °F | 1 | 16 | 9 | 3 | 53 |
| 3"-P300-P-18041 | process | process and wash water | tap 4"-P300-P-18040 | CS-1817-A | 185 psi, 170 °F | — | 33 | 18 | 0 | 21 |
| 3"-P150-P-18717 | control | process and wash water | CS-1817-B | BL-1806-U | 55 psi, 170 °F | 1 | 18 | 11 | 6 | 76 |
| 4"-P150-P-18042 | process | acid gas | D-1803-N2 | CS-1818-A | 50 psi, 170 °F | 1 | 42 | 23 | 7 | 139 |
| 4"-P150-P-18718 | control | acid gas | CS-1818-B | H-1801-N1 | 50 psi, 170 °F | — | 19 | 12 | 1 | 55 |
| 3"-P150-P-18043 | process | acid gas | D-1805-N2 | CS-1819-A | 50 psi, 230 °F | 1 | 45 | 26 | 9 | 106 |
| 3"-P150-P-18719 | control | acid gas | CS-1819-B | H-1801-N2 | 50 psi, 230 °F | — | 20 | 13 | 5 | 76 |
| 3"-P150-P-18044 | process | sour water | D-1803-N3 | P-1810A-S | 50 psi, 170 °F | — | 27 | 16 | 1 | 37 |
| 3"-P150-P-18045 | process | sour water | P-1810A-D | D-1804-N5 | 115 psi, 170 °F | — | 26 | 15 | 3 | 55 |
| 3"-P150-P-18046 | process | sour water | D-1805-N3 | CS-1820-A | 50 psi, 230 °F | 2 | 40 | 21 | 2 | 60 |
| 3"-P150-P-18720 | control | sour water | CS-1820-B | D-1804-N6 | 50 psi, 230 °F | — | 22 | 15 | 3 | 70 |
| 6"-P150-P-18047 | process | process air | K-1801-N1 | CS-1821-A | 50 psi, 230 °F | 1 | 52 | 29 | 9 | 203 |
| 6"-P150-P-18721 | control | process air | CS-1821-B | H-1801-N3 | 50 psi, 230 °F | — | 24 | 17 | 5 | 121 |
| 10"-P150-P-18048 | process | acid gas | H-1801-N4 | E-1806-N1 | 50 psi, 650 °F | 1 | 30 | 21 | 10 | 260 |
| 3"-P150-P-18049 | process | liquid sulfur | E-1806-N3 | X-1801-N1 | 50 psi, 340 °F | — | 21 | 12 | 0 | 35 |
| 8"-P150-P-18050 | process | acid gas | E-1806-N2 | E-1807-N1 | 50 psi, 390 °F | — | 23 | 12 | 1 | 27 |
| 8"-P150-P-18051 | process | acid gas | E-1807-N2 | R-1801-N1 | 50 psi, 500 °F | 1 | 31 | 20 | 14 | 293 |
| 10"-P150-P-18052 | process | acid gas | R-1801-N2 | E-1808-N1 | 50 psi, 630 °F | 1 | 35 | 24 | 14 | 286 |
| 3"-P150-P-18053 | process | liquid sulfur | E-1808-N3 | X-1801-N2 | 50 psi, 340 °F | — | 23 | 14 | 0 | 27 |
| 8"-P150-P-18054 | process | acid gas | E-1808-N2 | E-1809-N1 | 50 psi, 380 °F | — | 23 | 12 | 1 | 27 |
| 8"-P150-P-18055 | process | acid gas | E-1809-N2 | R-1802-N1 | 50 psi, 470 °F | 1 | 33 | 22 | 11 | 219 |
| 8"-P150-P-18056 | process | acid gas | R-1802-N2 | E-1810-N1 | 50 psi, 495 °F | 1 | 32 | 21 | 10 | 206 |
| 3"-P150-P-18057 | process | liquid sulfur | E-1810-N3 | X-1801-N3 | 50 psi, 340 °F | — | 21 | 12 | 0 | 36 |
| 8"-P150-P-18058 | process | acid gas | E-1810-N2 | H-1802-N3 | 50 psi, 320 °F | 1 | 28 | 19 | 16 | 319 |
| 3"-P150-P-18059 | process | liquid sulfur | X-1801-N4 | CS-1822-A | 85 psi, 335 °F | 2 | 49 | 30 | 21 | 255 |
| 3"-P150-P-18722 | control | liquid sulfur | CS-1822-B | X-1802-N1 | 85 psi, 335 °F | — | 19 | 12 | 2 | 46 |
| 3"-P600-P-18601 | root | amine solution | tap 6"-P600-P-18017 | RS-1801-A | 445 psi, 170 °F | — | 16 | 13 | 1 | 34 |
| 6"-P150-P-18301 | spare | amine solution | tap 6"-P150-P-18003 | P-1801B-S | 50 psi, 185 °F | — | 19 | 12 | 0 | 11 |
| 6"-P150-P-18302 | spare | amine solution | P-1801B-D | tap 6"-P150-P-18004 | 150 psi, 185 °F | — | 20 | 13 | 0 | 13 |
| 3"-P150-P-18303 | spare | sour water | tap 3"-P150-P-18008 | P-1802B-S | 50 psi, 170 °F | — | 15 | 8 | 0 | 6 |
| 3"-P150-P-18304 | spare | sour water | P-1802B-D | tap 3"-P150-P-18009 | 115 psi, 170 °F | — | 18 | 11 | 0 | 3 |
| 6"-P150-P-18305 | spare | amine solution | tap 6"-P150-P-18013 | P-1803B-S | 50 psi, 305 °F | — | 19 | 12 | 0 | 9 |
| 6"-P600-P-18306 | spare | amine solution | P-1803B-D | tap 6"-P600-P-18014 | 445 psi, 305 °F | — | 14 | 7 | 0 | 6 |
| 3"-P150-P-18307 | spare | amine solution | tap 3"-P150-P-18020 | P-1804B-S | 50 psi, 165 °F | — | 15 | 8 | 0 | 8 |
| 3"-P150-P-18308 | spare | amine solution | P-1804B-D | tap 3"-P150-P-18021 | 85 psi, 165 °F | — | 14 | 7 | 0 | 6 |
| 3"-P150-P-18309 | spare | oily water | tap 3"-P150-P-18024 | P-1808B-S | 50 psi, 155 °F | — | 17 | 10 | 0 | 3 |
| 3"-P150-P-18310 | spare | oily water | P-1808B-D | tap 3"-P150-P-18025 | 130 psi, 155 °F | — | 14 | 7 | 0 | 6 |
| 6"-P150-P-18311 | spare | sour water | tap 6"-P150-P-18026 | P-1809B-S | 50 psi, 155 °F | — | 17 | 10 | 0 | 10 |
| 4"-P150-P-18312 | spare | sour water | P-1809B-D | tap 4"-P150-P-18027 | 90 psi, 155 °F | — | 16 | 9 | 0 | 8 |
| 6"-P150-P-18313 | spare | sour water | tap 6"-P150-P-18028 | P-1805B-S | 50 psi, 150 °F | — | 17 | 10 | 0 | 10 |
| 4"-P300-P-18314 | spare | sour water | P-1805B-D | tap 4"-P300-P-18029 | 160 psi, 150 °F | — | 14 | 7 | 0 | 5 |
| 8"-P150-P-18315 | spare | sour water | tap 8"-P150-P-18031 | P-1806B-S | 50 psi, 240 °F | — | 19 | 12 | 0 | 11 |
| 6"-P150-P-18316 | spare | sour water | P-1806B-D | tap 6"-P150-P-18032 | 110 psi, 240 °F | — | 20 | 13 | 0 | 11 |
| 6"-P150-P-18317 | spare | process and wash water | tap 6"-P150-P-18037 | P-1807B-S | 55 psi, 315 °F | — | 17 | 10 | 0 | 11 |
| 4"-P300-P-18318 | spare | process and wash water | P-1807B-D | tap 4"-P300-P-18038 | 185 psi, 315 °F | — | 14 | 7 | 0 | 5 |
| 3"-P150-P-18319 | spare | sour water | tap 3"-P150-P-18044 | P-1810B-S | 50 psi, 170 °F | — | 15 | 8 | 0 | 6 |
| 3"-P150-P-18320 | spare | sour water | P-1810B-D | tap 3"-P150-P-18045 | 115 psi, 170 °F | — | 14 | 7 | 0 | 6 |
| 10"-P150-LS-18401 | header | steam, 50 psi | BL-1807-U | cap | 80 psi, 370 °F | — | 17 | 13 | 16 | 328 |
| 3"-P150-SC-18402 | header | steam condensate | BL-1808-U | cap | 55 psi, 280 °F | — | 24 | 20 | 33 | 336 |
| 3"-P150-CWS-18403 | header | cooling water supply | BL-1809-U | cap | 140 psi, 150 °F | — | 16 | 12 | 33 | 336 |
| 3"-P150-CWR-18404 | header | cooling water return | BL-1810-U | cap | 70 psi, 155 °F | — | 15 | 11 | 32 | 328 |
| 2"-P1200-SC-18405 | header | boiler feed water | BL-1811-U | cap | 1035 psi, 300 °F | — | 20 | 16 | 32 | 328 |
| 4"-P1200-LS-18406 | header | steam, 600 psi | BL-1812-U | cap | 685 psi, 700 °F | — | 16 | 12 | 16 | 336 |
| 2"-P150-P-18407 | header | fuel gas | BL-1813-U | cap | 85 psi, 150 °F | — | 17 | 13 | 33 | 336 |
| 8"-P150-LS-18501 | utility | steam, 50 psi | tap 10"-P150-LS-18401 | E-1802-N3 | 80 psi, 370 °F | — | 20 | 11 | 2 | 71 |
| 2"-P150-SC-18502 | utility | steam condensate | E-1802-N4 | CS-1823-A | 65 psi, 310 °F | — | 42 | 21 | 7 | 95 |
| 2"-P150-SC-18551 | control | steam condensate | CS-1823-B | tap 3"-P150-SC-18402 | 55 psi, 280 °F | — | 20 | 13 | 1 | 46 |
| 3"-P150-CWS-18503 | utility | cooling water supply | tap 3"-P150-CWS-18403 | E-1803-N3 | 140 psi, 150 °F | — | 33 | 22 | 2 | 72 |
| 3"-P150-CWR-18504 | utility | cooling water return | E-1803-N4 | tap 3"-P150-CWR-18404 | 70 psi, 155 °F | — | 27 | 16 | 3 | 67 |
| 8"-P150-LS-18505 | utility | steam, 50 psi | tap 10"-P150-LS-18401 | E-1805-N3 | 80 psi, 370 °F | — | 20 | 11 | 4 | 72 |
| 2"-P150-SC-18506 | utility | steam condensate | E-1805-N4 | CS-1824-A | 65 psi, 310 °F | — | 42 | 21 | 9 | 98 |
| 2"-P150-SC-18552 | control | steam condensate | CS-1824-B | tap 3"-P150-SC-18402 | 55 psi, 280 °F | — | 18 | 11 | 1 | 39 |
| 2"-P1200-SC-18507 | utility | boiler feed water | tap 2"-P1200-SC-18405 | CS-1825-A | 1035 psi, 300 °F | — | 34 | 15 | 2 | 41 |
| 2"-P1200-SC-18553 | control | boiler feed water | CS-1825-B | H-1801-N5 | 770 psi, 300 °F | — | 17 | 10 | 5 | 58 |
| 4"-P1200-LS-18508 | utility | steam, 600 psi | H-1801-N6 | tap 4"-P1200-LS-18406 | 685 psi, 700 °F | — | 18 | 11 | 1 | 50 |
| 2"-P1200-SC-18509 | utility | boiler feed water | tap 2"-P1200-SC-18405 | CS-1826-A | 1035 psi, 300 °F | — | 38 | 19 | 1 | 34 |
| 2"-P300-SC-18554 | control | boiler feed water | CS-1826-B | E-1806-N4 | 175 psi, 300 °F | — | 23 | 14 | 4 | 48 |
| 3"-P150-LS-18510 | utility | steam, 50 psi | E-1806-N5 | tap 10"-P150-LS-18401 | 80 psi, 370 °F | — | 21 | 12 | 2 | 53 |
| 2"-P1200-LS-18511 | utility | steam, 600 psi | tap 4"-P1200-LS-18406 | E-1807-N3 | 685 psi, 700 °F | — | 22 | 13 | 7 | 73 |
| 2"-P1200-SC-18512 | utility | steam condensate | E-1807-N4 | CS-1827-A | 650 psi, 660 °F | — | 41 | 20 | 3 | 55 |
| 2"-P150-SC-18555 | control | steam condensate | CS-1827-B | tap 3"-P150-SC-18402 | 55 psi, 280 °F | — | 16 | 9 | 2 | 39 |
| 2"-P1200-SC-18513 | utility | boiler feed water | tap 2"-P1200-SC-18405 | CS-1828-A | 1035 psi, 300 °F | — | 34 | 15 | 2 | 41 |
| 2"-P300-SC-18556 | control | boiler feed water | CS-1828-B | E-1808-N4 | 175 psi, 300 °F | — | 25 | 16 | 5 | 76 |
| 3"-P150-LS-18514 | utility | steam, 50 psi | E-1808-N5 | tap 10"-P150-LS-18401 | 80 psi, 370 °F | — | 23 | 14 | 1 | 54 |
| 2"-P1200-LS-18515 | utility | steam, 600 psi | tap 4"-P1200-LS-18406 | E-1809-N3 | 685 psi, 700 °F | — | 22 | 13 | 6 | 70 |
| 2"-P1200-SC-18516 | utility | steam condensate | E-1809-N4 | CS-1829-A | 650 psi, 660 °F | — | 41 | 20 | 2 | 52 |
| 2"-P150-SC-18557 | control | steam condensate | CS-1829-B | tap 3"-P150-SC-18402 | 55 psi, 280 °F | — | 22 | 15 | 1 | 43 |
| 2"-P1200-SC-18517 | utility | boiler feed water | tap 2"-P1200-SC-18405 | CS-1830-A | 1035 psi, 300 °F | — | 36 | 17 | 1 | 37 |
| 2"-P300-SC-18558 | control | boiler feed water | CS-1830-B | E-1810-N4 | 175 psi, 300 °F | — | 23 | 14 | 4 | 68 |
| 3"-P150-LS-18518 | utility | steam, 50 psi | E-1810-N5 | tap 10"-P150-LS-18401 | 80 psi, 370 °F | — | 25 | 16 | 1 | 56 |
| 2"-P150-P-18519 | utility | fuel gas | tap 2"-P150-P-18407 | H-1802-N4 | 85 psi, 150 °F | — | 16 | 9 | 2 | 40 |
| 2"-P150-LS-18520 | utility | steam, 50 psi | tap 10"-P150-LS-18401 | X-1801-N5 | 80 psi, 370 °F | — | 20 | 13 | 6 | 83 |
| 2"-P150-SC-18521 | utility | steam condensate | X-1801-N6 | CS-1831-A | 65 psi, 310 °F | — | 39 | 20 | 17 | 185 |
| 2"-P150-SC-18559 | control | steam condensate | CS-1831-B | tap 3"-P150-SC-18402 | 55 psi, 280 °F | — | 16 | 9 | 2 | 39 |

## Unit 19: Utilities

104 lines: 48 of the flowsheet, 28 to installed spares and parallel bodies, 1 utility headers and 1 utility connections, 16 parts of lines after their control stations (SW-RPI-9), and 10 connections to branch root spools (SW-RPI-8). The lines that run the rack are on 3 of its tiers (SW-RPI-7), each in a lane given it beforehand, no tier loaded beyond 84 in of lanes at any section: tier 1 19 lines, tier 2 16 lines, tier 3 7 lines. The generator was run 44 times: once for each line that runs the rack or rises in a column's chase, with the branches that tap it, and once for the rest.

| Component | Count |
| --- | --- |
| cap | 1 |
| elbow | 475 |
| flange | 326 |
| gasket | 520 |
| olet | 4 |
| pipe | 803 |
| reducer | 60 |
| spade | 14 |
| spectacle | 28 |
| tee | 37 |
| valve | 232 |

| Welds | Count |
| --- | --- |
| BW, field | 257 |
| BW, shop | 1302 |
| FW, shop | 4 |

| Supports | Count |
| --- | --- |
| anchor | 42 |
| guide | 109 |
| hanger | 42 |
| shoe | 215 |
| stanchion | 64 |
| trapeze | 4 |
| trunnion | 38 |

### Checks

| Check (the generator's own, §40) | Found |
| --- | --- |
| every line continuous from end to end | 0 |
| every joint a joint of its class | 0 |
| elbows and the straights between them | 0 |
| valves by class and size | 0 |
| 3 in between lines | 0 |
| 3 in from steel and equipment | 0 |
| spans within SW-PS-7, a support at every rack beam crossed | 1 |

Not at zero, supports:

- 4"-P1200-P-19707: unsupported span 446 in > 240 on run from 1920,108,-43

These runs are longer than a pipe of their size spans and no steel stands where a support would go: lines that cross the yard or run beside the rack away from the support beams. They are listed, not hidden, and want pipe supports of their own.

### Battery limit

| Spool | Stream | Direction | Line | Stands at (x, y, z), in | Tier | Lane |
| --- | --- | --- | --- | --- | --- | --- |
| BL-1909 | low-pressure steam | out | 6"-P150-P-19026 | 150, 204, -120 | 1 | -120 |
| BL-1906 | boiler feed water | out | 8"-P1200-P-19018 | 150, 204, -96 | 1 | -102 |
| BL-1919 | fuel gas to users | out | 8"-P150-P-19052 | 150, 204, -72 | 1 | -84 |
| BL-1908 | medium-pressure steam | out | 8"-P300-P-19024 | 150, 204, -48 | 1 | -66 |
| BL-1901 | raw water | in | 8"-P150-P-19001 | 150, 204, -24 | 1 | -36 |
| BL-1907 | high-pressure steam | out | 10"-P1200-P-19021 | 150, 204, 0 | 1 | -18 |
| BL-1915 | fuel gas | in | 6"-P150-P-19048 | 150, 204, 24 | 1 | 12 |
| BL-1904 | fire water make-up | out | 6"-P300-P-19010 | 150, 204, 42 | 1 | 36 |
| BL-1910 | boiler blowdown | out | 3"-P150-P-19709 | 150, 198, 60 | 1 | — |
| BL-1905 | condensate | in | 4"-P150-P-19013 | 150, 270, -90 | 2 | -90 |
| BL-1911 | plant air | out | 4"-P150-P-19039 | 150, 270, -72 | 2 | -78 |
| BL-1912 | instrument air | out | 4"-P150-P-19043 | 150, 270, -54 | 2 | -66 |
| BL-1918 | purchased gas | in | 6"-P150-P-19051 | 150, 276, 0 | 2 | 0 |
| BL-1903 | X-1903 make-up | out | 6"-P150-P-19702 | 150, 276, 42 | 2 | 42 |
| BL-1902 | service water | out | 4"-P300-P-19008 | 150, 270, 60 | 2 | 60 |
| BL-1913 | nitrogen | out | 3"-P300-P-19045 | 150, 270, 78 | 2 | 78 |
| BL-1914 | caustic | out | 3"-P600-P-19047 | 150, 342, -48 | 3 | -48 |
| BL-1916 | surplus hydrogen | in | 3"-P150-P-19049 | 240, 342, -36 | 3 | -36 |
| BL-1921 | low-pressure steam | in | 10"-P150-LS-19401 | 150, 348, 0 | 3 | 0 |
| BL-1917 | stabiliser gas | in | 3"-P150-P-19050 | 240, 342, 24 | 3 | 24 |
| BL-1920 | slop oil | out | 3"-P150-P-19716 | 150, 342, 48 | 3 | 48 |

### Branch roots

Branches that travel the rack start at a spool on it, a block valve on each face (SW-RPI-8).

| Spool | Branch | Connection to the tee | On | Stands at (x, y, z), in | Tier |
| --- | --- | --- | --- | --- | --- |
| RS-1901 | 4"-P300-P-19008 | 4"-P300-P-19601 | 8"-P300-P-19003 | 960, 270, 60 | 2 |
| RS-1902 | 6"-P300-P-19009 | 6"-P300-P-19602 | 8"-P300-P-19003 | 960, 276, 24 | 2 |
| RS-1903 | 6"-P300-P-19010 | 6"-P300-P-19603 | 8"-P300-P-19003 | 960, 204, 36 | 1 |
| RS-1904 | 4"-P1200-P-19019 | 4"-P1200-P-19604 | 8"-P1200-P-19018 | 480, 270, -30 | 2 |
| RS-1905 | 4"-P1200-P-19020 | 4"-P1200-P-19605 | 4"-P1200-P-19019 | 1440, 270, -102 | 2 |
| RS-1906 | 10"-P1200-P-19022 | 10"-P1200-P-19606 | 10"-P1200-P-19021 | 1680, 204, -42 | 1 |
| RS-1907 | 6"-P1200-P-19023 | 6"-P1200-P-19607 | 10"-P1200-P-19021 | 1680, 276, -24 | 2 |
| RS-1908 | 3"-P1200-P-19028 | 3"-P1200-P-19608 | 3"-P1200-P-19027 | 1680, 270, -120 | 2 |
| RS-1909 | 3"-P150-P-19040 | 3"-P150-P-19609 | 4"-P150-P-19039 | 2400, 198, 54 | 1 |
| RS-1910 | 4"-P150-P-19054 | 4"-P150-P-19610 | 4"-P150-P-19053 | 1680, 198, 36 | 1 |

### Control valve stations

Each stands at grade under the rack, on a spool that divides its line (SW-RPI-9): the flowsheet's control valves, and those of the utility connections that are fed or drained under control (boiler feed water to a steam generator, condensate from a steam heater: SW-PRC-19).

| Line | Station | Spool | Stands at (x, y, z), in | The line after it |
| --- | --- | --- | --- | --- |
| 6"-P150-P-19007 | piped | CS-1901 | 1842, 36, -108 | 6"-P150-P-19701 |
| 6"-P300-P-19009 | piped | CS-1902 | 564, 36, 108 | 6"-P150-P-19702 |
| 6"-P150-P-19012 | piped | CS-1903 | 636, 36, -108 | 6"-P150-P-19703 |
| 4"-P150-P-19013 | piped | CS-1904 | 954, 36, -36 | 4"-P150-P-19704 |
| 4"-P150-P-19016 | piped | CS-1905 | 606, 36, -36 | 4"-P150-P-19705 |
| 4"-P1200-P-19019 | piped | CS-1906 | 1506, 36, -108 | 4"-P1200-P-19706 |
| 4"-P1200-P-19020 | piped | CS-1907 | 1950, 36, -36 | 4"-P1200-P-19707 |
| 3"-P1200-P-19027 | piped | CS-1908 | 1410, 36, -36 | 3"-P150-P-19708 |
| 3"-P150-P-19030 | piped | CS-1909 | 444, 36, 36 | 3"-P150-P-19709 |
| 6"-P150-P-19048 | piped | CS-1910 | 2916, 36, -108 | 6"-P150-P-19710 |
| 3"-P150-P-19049 | piped | CS-1911 | 2910, 36, -36 | 3"-P150-P-19711 |
| 3"-P150-P-19050 | piped | CS-1912 | 2904, 36, 36 | 3"-P150-P-19712 |
| 6"-P150-P-19051 | piped | CS-1913 | 2898, 36, 108 | 6"-P150-P-19713 |
| 4"-P150-P-19053 | piped | CS-1914 | 1686, 36, 36 | 4"-P150-P-19714 |
| 4"-P150-P-19054 | piped | CS-1915 | 2460, 36, -108 | 4"-P150-P-19715 |
| 3"-P150-P-19055 | piped | CS-1916 | 684, 36, 36 | 3"-P150-P-19716 |

### Headers at the battery limit

Each utility header ends at the limit in a block valve and a spool on the top tier, in its own lane, and runs straight through the valve; the plant's header joins it on the pipeway's side (SW-RPI-15, SW-PWY-12). 1 header carried on in line to its block valve at the battery limit, the cap there left out: 10"-P150-LS-19401 from BL-1921-U, its first piece 181.3 in longer, a shoe at x 360.

### Lines

| Line | Kind | Fluid | From | To | Design | Rack tier | Components | Welds | Supports | Length, ft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 8"-P150-P-19001 | process | raw and service water | BL-1901-U | T-1901-N1 | 65 psi, 150 °F | 1 | 33 | 24 | 5 | 159 |
| 12"-P150-P-19002 | process | raw and service water | T-1901-N2 | P-1901A-S | 50 psi, 150 °F | — | 36 | 23 | 2 | 85 |
| 8"-P300-P-19003 | process | raw and service water | P-1901A-D | F-1901A-N1 | 160 psi, 150 °F | 1 | 45 | 34 | 12 | 269 |
| 6"-P300-P-19004 | process | demineralised water | F-1901A-N2 | V-1901A-N1 | 160 psi, 150 °F | 1 | 34 | 25 | 4 | 131 |
| 6"-P150-P-19005 | process | demineralised water | V-1901A-N2 | V-1902A-N1 | 105 psi, 150 °F | 1 | 30 | 19 | 5 | 121 |
| 6"-P150-P-19006 | process | demineralised water | V-1902A-N2 | V-1903-N1 | 100 psi, 150 °F | 1 | 30 | 19 | 5 | 129 |
| 6"-P150-P-19007 | process | demineralised water | V-1903-N2 | CS-1901-A | 95 psi, 150 °F | 1 | 46 | 25 | 13 | 254 |
| 6"-P150-P-19701 | control | demineralised water | CS-1901-B | T-1902-N1 | 95 psi, 150 °F | — | 23 | 14 | 4 | 112 |
| 4"-P300-P-19008 | process | raw and service water | RS-1901-B | BL-1902-U | 160 psi, 150 °F | 2 | 10 | 3 | 3 | 61 |
| 6"-P300-P-19009 | process | raw and service water | RS-1902-B | CS-1902-A | 160 psi, 150 °F | 2 | 36 | 17 | 3 | 69 |
| 6"-P150-P-19702 | control | raw and service water | CS-1902-B | BL-1903-U | 0 psi, 150 °F | 2 | 17 | 10 | 3 | 61 |
| 6"-P300-P-19010 | process | raw and service water | RS-1903-B | BL-1904-U | 160 psi, 150 °F | 1 | 18 | 11 | 3 | 64 |
| 6"-P150-P-19011 | process | demineralised water | T-1902-N2 | P-1902A-S | 50 psi, 150 °F | — | 32 | 19 | 3 | 100 |
| 6"-P150-P-19012 | process | demineralised water | P-1902A-D | CS-1903-A | 135 psi, 150 °F | 2 | 54 | 31 | 6 | 160 |
| 6"-P150-P-19703 | control | demineralised water | CS-1903-B | V-1904-N1 | 135 psi, 150 °F | — | 21 | 14 | 2 | 81 |
| 4"-P150-P-19013 | process | steam condensate | BL-1905-U | CS-1904-A | 55 psi, 280 °F | 2 | 38 | 19 | 3 | 85 |
| 4"-P150-P-19704 | control | steam condensate | CS-1904-B | D-1901-N1 | 55 psi, 280 °F | — | 22 | 13 | 5 | 69 |
| 3"-P150-P-19014 | process | steam, 50 psi | D-1901-N2 | V-1904-N2 | 50 psi, 310 °F | 3 | 28 | 21 | 8 | 145 |
| 6"-P150-P-19015 | process | steam condensate | D-1901-N3 | P-1903A-S | 50 psi, 280 °F | — | 29 | 18 | 1 | 48 |
| 4"-P150-P-19016 | process | steam condensate | P-1903A-D | CS-1905-A | 115 psi, 280 °F | 3 | 54 | 31 | 3 | 105 |
| 4"-P150-P-19705 | control | steam condensate | CS-1905-B | V-1904-N3 | 115 psi, 280 °F | — | 20 | 13 | 3 | 76 |
| 10"-P150-P-19017 | process | boiler feed water | V-1904-N4 | P-1904A-S | 50 psi, 300 °F | — | 31 | 18 | 1 | 54 |
| 8"-P1200-P-19018 | process | boiler feed water | P-1904A-D | BL-1906-U | 1035 psi, 300 °F | 1 | 34 | 23 | 0 | 52 |
| 4"-P1200-P-19019 | process | boiler feed water | RS-1904-B | CS-1906-A | 1035 psi, 300 °F | 2 | 42 | 23 | 5 | 96 |
| 4"-P1200-P-19706 | control | boiler feed water | CS-1906-B | B-1901-N1 | 1035 psi, 300 °F | — | 22 | 15 | 2 | 86 |
| 4"-P1200-P-19020 | process | boiler feed water | RS-1905-B | CS-1907-A | 1035 psi, 300 °F | 2 | 39 | 20 | 3 | 58 |
| 4"-P1200-P-19707 | control | boiler feed water | CS-1907-B | B-1902-N1 | 1035 psi, 300 °F | — | 22 | 15 | 2 | 87 |
| 10"-P1200-P-19021 | process | steam, 600 psi | B-1901-N2 | BL-1907-U | 685 psi, 700 °F | 1 | 33 | 26 | 7 | 195 |
| 10"-P1200-P-19022 | process | steam, 600 psi | B-1902-N2 | RS-1906-B | 685 psi, 700 °F | 1 | 20 | 13 | 3 | 96 |
| 6"-P1200-P-19023 | process | steam, 600 psi | RS-1907-B | X-1901-N1 | 685 psi, 700 °F | 2 | 22 | 15 | 12 | 264 |
| 8"-P300-P-19024 | process | steam, 150 psi | X-1901-N2 | BL-1908-U | 185 psi, 450 °F | 1 | 34 | 27 | 19 | 401 |
| 4"-P300-P-19025 | process | steam, 150 psi | tap 8"-P300-P-19024 | X-1902-N1 | 185 psi, 450 °F | — | 12 | 9 | 1 | 21 |
| 6"-P150-P-19026 | process | steam, 50 psi | X-1902-N2 | BL-1909-U | 80 psi, 370 °F | 1 | 33 | 26 | 18 | 407 |
| 3"-P1200-P-19027 | process | boiler feed water | B-1901-N3 | CS-1908-A | 685 psi, 540 °F | — | 41 | 22 | 1 | 45 |
| 3"-P150-P-19708 | control | boiler feed water | CS-1908-B | D-1902-N1 | 50 psi, 540 °F | — | 20 | 11 | 5 | 61 |
| 3"-P1200-P-19028 | process | boiler feed water | B-1902-N3 | RS-1908-B | 685 psi, 540 °F | 2 | 17 | 10 | 5 | 74 |
| 3"-P150-P-19029 | process | oily water | D-1902-N2 | P-1908A-S | 50 psi, 265 °F | — | 27 | 16 | 2 | 43 |
| 3"-P150-P-19030 | process | oily water | P-1908A-D | CS-1909-A | 110 psi, 265 °F | 3 | 53 | 30 | 8 | 135 |
| 3"-P150-P-19709 | control | oily water | CS-1909-B | BL-1910-U | 55 psi, 265 °F | — | 19 | 12 | 0 | 33 |
| 4"-P150-P-19038 | process | plant air | K-1903A-N1 | D-1903-N1 | 150 psi, 160 °F | 2 | 38 | 25 | 8 | 238 |
| 4"-P150-P-19039 | process | plant air | D-1903-N2 | BL-1911-U | 145 psi, 160 °F | 2 | 36 | 27 | 12 | 245 |
| 3"-P150-P-19040 | process | plant air | RS-1909-B | V-1905A-N1 | 145 psi, 160 °F | 1 | 22 | 13 | 23 | 234 |
| 3"-P150-P-19041 | process | instrument air | V-1905A-N2 | F-1903-N1 | 140 psi, 160 °F | 1 | 37 | 28 | 6 | 132 |
| 4"-P150-P-19042 | process | instrument air | F-1903-N2 | D-1904-N1 | 135 psi, 160 °F | 1 | 32 | 23 | 12 | 294 |
| 4"-P150-P-19043 | process | instrument air | D-1904-N2 | BL-1912-U | 130 psi, 150 °F | 2 | 34 | 25 | 13 | 261 |
| 3"-P300-P-19044 | process | nitrogen | T-1903-N1 | X-1904-N1 | 175 psi, 150 °F | 1 | 27 | 20 | 23 | 290 |
| 3"-P300-P-19045 | process | nitrogen | X-1904-N2 | BL-1913-U | 170 psi, 150 °F | 2 | 28 | 21 | 42 | 465 |
| 3"-P150-P-19046 | process | caustic solution | T-1904-N1 | P-1907A-S | 50 psi, 150 °F | — | 33 | 20 | 5 | 107 |
| 3"-P600-P-19047 | process | caustic solution | P-1907A-D | BL-1914-U | 385 psi, 150 °F | 3 | 36 | 25 | 20 | 251 |
| 6"-P150-P-19048 | process | fuel gas | BL-1915-U | CS-1910-A | 95 psi, 165 °F | 1 | 52 | 33 | 11 | 251 |
| 6"-P150-P-19710 | control | fuel gas | CS-1910-B | D-1905-N1 | 95 psi, 165 °F | — | 18 | 9 | 3 | 53 |
| 3"-P150-P-19049 | process | hydrogen-rich gas | BL-1916-U | CS-1911-A | 85 psi, 160 °F | 3 | 44 | 25 | 22 | 237 |
| 3"-P150-P-19711 | control | hydrogen-rich gas | CS-1911-B | D-1905-N2 | 85 psi, 160 °F | — | 18 | 11 | 5 | 64 |
| 3"-P150-P-19050 | process | fuel gas | BL-1917-U | CS-1912-A | 95 psi, 160 °F | 3 | 44 | 25 | 22 | 241 |
| 3"-P150-P-19712 | control | fuel gas | CS-1912-B | D-1905-N3 | 95 psi, 160 °F | — | 20 | 13 | 5 | 72 |
| 6"-P150-P-19051 | process | fuel gas | BL-1918-U | CS-1913-A | 95 psi, 150 °F | 2 | 42 | 23 | 12 | 248 |
| 6"-P150-P-19713 | control | fuel gas | CS-1913-B | D-1905-N4 | 95 psi, 150 °F | — | 18 | 11 | 4 | 79 |
| 8"-P150-P-19052 | process | fuel gas | D-1905-N5 | BL-1919-U | 85 psi, 150 °F | 1 | 38 | 29 | 13 | 301 |
| 4"-P150-P-19053 | process | fuel gas | tap 8"-P150-P-19052 | CS-1914-A | 85 psi, 150 °F | — | 32 | 17 | 1 | 23 |
| 4"-P150-P-19714 | control | fuel gas | CS-1914-B | B-1901-N4 | 85 psi, 150 °F | — | 16 | 9 | 2 | 49 |
| 4"-P150-P-19054 | process | fuel gas | RS-1910-B | CS-1915-A | 85 psi, 150 °F | 1 | 34 | 15 | 4 | 75 |
| 4"-P150-P-19715 | control | fuel gas | CS-1915-B | B-1902-N4 | 85 psi, 150 °F | 2 | 21 | 14 | 4 | 94 |
| 3"-P150-P-19055 | process | oily water | D-1905-N6 | CS-1916-A | 85 psi, 150 °F | 2 | 48 | 29 | 26 | 285 |
| 3"-P150-P-19716 | control | oily water | CS-1916-B | BL-1920-U | 65 psi, 200 °F | 3 | 20 | 13 | 4 | 66 |
| 4"-P300-P-19601 | root | raw and service water | tap 8"-P300-P-19003 | RS-1901-A | 160 psi, 150 °F | — | 12 | 9 | 0 | 20 |
| 6"-P300-P-19602 | root | raw and service water | tap 8"-P300-P-19003 | RS-1902-A | 160 psi, 150 °F | — | 11 | 8 | 0 | 15 |
| 6"-P300-P-19603 | root | raw and service water | tap 8"-P300-P-19003 | RS-1903-A | 160 psi, 150 °F | — | 13 | 10 | 0 | 16 |
| 4"-P1200-P-19604 | root | boiler feed water | tap 8"-P1200-P-19018 | RS-1904-A | 1035 psi, 300 °F | — | 12 | 9 | 0 | 10 |
| 4"-P1200-P-19605 | root | boiler feed water | tap 4"-P1200-P-19019 | RS-1905-A | 1035 psi, 300 °F | — | 11 | 8 | 0 | 10 |
| 10"-P1200-P-19606 | root | steam, 600 psi | RS-1906-A | tap 10"-P1200-P-19021 | 685 psi, 700 °F | — | 17 | 14 | 0 | 19 |
| 6"-P1200-P-19607 | root | steam, 600 psi | tap 10"-P1200-P-19021 | RS-1907-A | 685 psi, 700 °F | — | 15 | 12 | 0 | 12 |
| 3"-P1200-P-19608 | root | boiler feed water | RS-1908-A | tap 3"-P1200-P-19027 | 685 psi, 540 °F | — | 13 | 10 | 0 | 24 |
| 3"-P150-P-19609 | root | plant air | tap 4"-P150-P-19039 | RS-1909-A | 145 psi, 160 °F | — | 11 | 8 | 0 | 16 |
| 4"-P150-P-19610 | root | fuel gas | tap 4"-P150-P-19053 | RS-1910-A | 85 psi, 150 °F | — | 15 | 12 | 0 | 22 |
| 12"-P150-P-19301 | spare | raw and service water | tap 12"-P150-P-19002 | P-1901B-S | 50 psi, 150 °F | — | 17 | 10 | 0 | 12 |
| 12"-P150-P-19302 | spare | raw and service water | tap 12"-P150-P-19002 | P-1901C-S | 50 psi, 150 °F | — | 19 | 12 | 0 | 19 |
| 8"-P300-P-19303 | spare | raw and service water | tap 8"-P300-P-19003 | F-1901B-N1 | 160 psi, 150 °F | — | 7 | 4 | 0 | 8 |
| 8"-P300-P-19304 | spare | raw and service water | tap 8"-P300-P-19003 | F-1901C-N1 | 160 psi, 150 °F | — | 7 | 4 | 0 | 19 |
| 8"-P300-P-19305 | spare | raw and service water | P-1901B-D | tap 8"-P300-P-19003 | 160 psi, 150 °F | — | 14 | 7 | 0 | 5 |
| 8"-P300-P-19306 | spare | raw and service water | P-1901C-D | tap 8"-P300-P-19003 | 160 psi, 150 °F | — | 14 | 7 | 0 | 13 |
| 6"-P300-P-19307 | spare | demineralised water | tap 6"-P300-P-19004 | V-1901B-N1 | 160 psi, 150 °F | — | 9 | 4 | 0 | 11 |
| 6"-P300-P-19308 | spare | demineralised water | F-1901B-N2 | tap 6"-P300-P-19004 | 160 psi, 150 °F | — | 7 | 4 | 0 | 8 |
| 6"-P300-P-19309 | spare | demineralised water | F-1901C-N2 | tap 6"-P300-P-19004 | 160 psi, 150 °F | — | 11 | 8 | 1 | 23 |
| 6"-P150-P-19310 | spare | demineralised water | tap 6"-P150-P-19005 | V-1902B-N1 | 105 psi, 150 °F | — | 9 | 4 | 0 | 11 |
| 6"-P150-P-19311 | spare | demineralised water | V-1901B-N2 | tap 6"-P150-P-19005 | 105 psi, 150 °F | — | 9 | 4 | 0 | 11 |
| 6"-P150-P-19312 | spare | demineralised water | V-1902B-N2 | tap 6"-P150-P-19006 | 100 psi, 150 °F | — | 9 | 4 | 0 | 11 |
| 6"-P150-P-19313 | spare | demineralised water | tap 6"-P150-P-19011 | P-1902B-S | 50 psi, 150 °F | — | 19 | 12 | 0 | 11 |
| 6"-P150-P-19314 | spare | demineralised water | P-1902B-D | tap 6"-P150-P-19012 | 135 psi, 150 °F | — | 14 | 7 | 0 | 5 |
| 6"-P150-P-19315 | spare | steam condensate | tap 6"-P150-P-19015 | P-1903B-S | 50 psi, 280 °F | — | 19 | 12 | 0 | 10 |
| 4"-P150-P-19316 | spare | steam condensate | P-1903B-D | tap 4"-P150-P-19016 | 115 psi, 280 °F | — | 14 | 7 | 0 | 5 |
| 10"-P150-P-19317 | spare | boiler feed water | tap 10"-P150-P-19017 | P-1904B-S | 50 psi, 300 °F | — | 19 | 12 | 0 | 14 |
| 10"-P150-P-19318 | spare | boiler feed water | tap 10"-P150-P-19017 | P-1904C-S | 50 psi, 300 °F | — | 19 | 12 | 0 | 24 |
| 8"-P1200-P-19319 | spare | boiler feed water | P-1904B-D | tap 8"-P1200-P-19018 | 1035 psi, 300 °F | — | 14 | 7 | 0 | 6 |
| 8"-P1200-P-19320 | spare | boiler feed water | P-1904C-D | tap 8"-P1200-P-19018 | 1035 psi, 300 °F | — | 14 | 7 | 0 | 16 |
| 3"-P150-P-19321 | spare | oily water | tap 3"-P150-P-19029 | P-1908B-S | 50 psi, 265 °F | — | 15 | 8 | 0 | 3 |
| 3"-P150-P-19322 | spare | oily water | P-1908B-D | tap 3"-P150-P-19030 | 110 psi, 265 °F | — | 14 | 7 | 0 | 6 |
| 4"-P150-P-19323 | spare | plant air | K-1903B-N1 | tap 4"-P150-P-19038 | 150 psi, 160 °F | — | 13 | 6 | 0 | 14 |
| 4"-P150-P-19324 | spare | plant air | K-1903C-N1 | tap 4"-P150-P-19038 | 150 psi, 160 °F | — | 15 | 8 | 0 | 32 |
| 3"-P150-P-19325 | spare | plant air | tap 3"-P150-P-19040 | V-1905B-N1 | 145 psi, 160 °F | — | 9 | 4 | 0 | 10 |
| 3"-P150-P-19326 | spare | instrument air | V-1905B-N2 | tap 3"-P150-P-19041 | 140 psi, 160 °F | — | 9 | 4 | 0 | 10 |
| 3"-P150-P-19327 | spare | caustic solution | tap 3"-P150-P-19046 | P-1907B-S | 50 psi, 150 °F | — | 15 | 8 | 0 | 7 |
| 3"-P600-P-19328 | spare | caustic solution | P-1907B-D | tap 3"-P600-P-19047 | 385 psi, 150 °F | — | 14 | 7 | 0 | 6 |
| 10"-P150-LS-19401 | header | steam, 50 psi | BL-1921-U | cap | 80 psi, 370 °F | — | 17 | 13 | 20 | 416 |
| 10"-P150-LS-19501 | utility | steam, 50 psi | tap 10"-P150-LS-19401 | V-1904-N5 | 80 psi, 370 °F | — | 20 | 13 | 1 | 62 |

