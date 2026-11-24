# Plant 3: pressure equipment and piping records

> **DEMONSTRATION DATA — not a manufacturer's data report, not a registration.** Written by `tools/refinery-registry.ts` from `src/refinery/registry.ts`; do not edit by hand.

This is the code layer of the demonstration refinery (DESIGN_BASIS.md §76): a record for every pressure vessel and boiler, the fluid service, line class and severity of every line, and a registration number for every design, piping system and fitting category. It exists so that software reading the model has realistic regulatory data to read. Three kinds of value appear, and every field in the data files says which it is:

- **model**: SmartWeld's own sizing and geometry (design conditions, dimensions, wall thickness, weight, connections). The wall on a record is the wall the 3D body is drawn with, and a test checks each against its pressure.
- **recalled**: code names, report designations, test factors, examination, heat treatment, fluid service and material labels, written from the assistant's general knowledge at the owner's instruction. No code, form or regulation was opened. They may be wrong or out of date and are **for the owner to verify** (SW-REG-0).
- **invented**: every registration number, serial number, fabricator and maker. None was issued by anyone; a number that happens to equal a real one means nothing.

No form of any code body is reproduced: the printable records are in SmartWeld's own layout.

## What is recorded

| Kind of record | Count | Rule |
| --- | --- | --- |
| Pressure vessel records, designation U-1 | 98 | SW-REG-1, -2, -3 |
| Pressure vessel records, designation U-1A | 104 | SW-REG-1, -2, -3 |
| Boiler records, designation P-3 (drums as P-4 parts, external piping P-4A) | 3 | SW-REG-1, -2, -3 |
| Fired heater coils | 9 | SW-REG-1 |
| Packaged components counted with the fittings | 6 | SW-REG-1 |
| Lines with fluid service, line class and severity | 742 | SW-REG-4, -5, -8 |
| Line classes | 38 | SW-REG-8 |
| Piping system registrations (a line class in a unit) | 148 | SW-REG-6 |
| Fitting registrations (category × pipe class × maker) | 96 | SW-REG-6 |

Outside this layer, with no record (SW-REG-1): storage tanks at atmospheric pressure, catalyst hoppers, basins and pits; pumps and compressors; structures.

## Fluid service of the lines

SmartWeld stands in for the owner in designating each line (SW-REG-4): Category D for benign fluids at 150 psi or less between −20 and 366 °F; Category M for acid gas and sour water stripper gas; Normal for the rest.

| Unit | Name | Lines | Category D | Normal | Category M |
| --- | --- | --- | --- | --- | --- |
| 11 | Crude distillation | 79 | 12 | 67 | 0 |
| 12 | Vacuum distillation | 31 | 3 | 28 | 0 |
| 13 | Naphtha hydrotreater and splitter | 48 | 5 | 43 | 0 |
| 14 | Catalytic reformer and hydrogen purification | 58 | 8 | 50 | 0 |
| 15 | Kerosene hydrotreater | 38 | 5 | 33 | 0 |
| 16 | Diesel hydrotreater | 47 | 3 | 44 | 0 |
| 17 | Fluid catalytic cracker and gas concentration | 133 | 19 | 114 | 0 |
| 18 | Sulfur block | 80 | 13 | 52 | 15 |
| 19 | Utilities | 56 | 24 | 32 | 0 |
| 20 | Crude tank farm | 18 | 0 | 18 | 0 |
| 21 | Intermediate and product tank farm | 94 | 12 | 82 | 0 |
| 22 | Marine terminal | 13 | 0 | 13 | 0 |
| 23 | Truck loading | 11 | 0 | 11 | 0 |
| 24 | Wastewater treatment | 20 | 4 | 16 | 0 |
| 25 | Flare | 8 | 1 | 7 | 0 |
| 26 | Fire water | 8 | 6 | 2 | 0 |
|  | Plant | 742 | 115 | 612 | 15 |

| Fluid service | Examination of welds (recalled) | Leak test (recalled) | Threaded joints |
| --- | --- | --- | --- |
| Category D | visual | hydrostatic at 1.5 × design pressure, or an initial service test | allowed |
| Normal | visual, and 5 % random radiography of girth butt welds | hydrostatic at 1.5 × design pressure | allowed |
| Category M | visual, 20 % random radiography of girth butt welds, and a sensitive leak test | hydrostatic at 1.5 × design pressure | none: small bore is welded |

## Line classes and severity

A line class is written `{group}{rating}-{material}-{service}{rank}` (SW-REG-8, SmartWeld's own scheme): the fluid group and pipe class of the generator's line class, a material label, the fluid service, and the medium's rank. Severity, 1 to 5, is the larger of the pressure rank (P150 1, P300 2, P600 3, P1200 4) and the medium rank (1 a Category D fluid; 2 harmful or beyond Category D but neither flammable nor toxic; 3 a flammable liquid; 4 a flammable gas, liquefied gas or hydrogen; 5 Category M).

| Line class | Pipe class | Material | Fluid service | Pressure rank | Medium rank | Severity | Lines | Sizes, in | Highest design | Fluids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `H150-CS-M5` | P150 | carbon steel | M | 1 | 5 | **5** | 9 | 3 to 10 | 50 psi, 650 °F | acid gas |
| `H150-SS-M5` | P150 | stainless steel | M | 1 | 5 | **5** | 6 | 3 to 8 | 50 psi, 275 °F | acid gas |
| `C1200-CS-N2` | P1200 | carbon steel | Normal | 4 | 2 | **4** | 14 | 3/4 to 8 | 1,035 psi, 660 °F | steam condensate, boiler feed water |
| `F150-CS-N4` | P150 | carbon steel | Normal | 1 | 4 | **4** | 3 | 36 | 50 psi, 300 °F | flare gas |
| `H1200-C1-N4` | P1200 | 1-1/4 Cr alloy steel | Normal | 4 | 4 | **4** | 11 | 8 to 14 | 1,145 psi, 1,000 °F | reactor effluent (oil and hydrogen) |
| `H1200-CS-N2` | P1200 | carbon steel | Normal | 4 | 2 | **4** | 3 | 3 | 1,050 psi, 190 °F | amine solution, sour water |
| `H1200-CS-N3` | P1200 | carbon steel | Normal | 4 | 3 | **4** | 1 | 6 | 1,145 psi, 190 °F | diesel |
| `H1200-CS-N4` | P1200 | carbon steel | Normal | 4 | 4 | **4** | 8 | 3 to 8 | 1,015 psi, 340 °F | hydrogen-rich gas, reactor effluent (oil and hydrogen) |
| `H150-C5-N4` | P150 | 5 Cr alloy steel | Normal | 1 | 4 | **4** | 1 | 4 | 50 psi, 665 °F | gas oil |
| `H150-CS-N4` | P150 | carbon steel | Normal | 1 | 4 | **4** | 54 | 2 to 48 | 125 psi, 585 °F | naphtha, hydrocarbon gas, kerosene, diesel, fuel gas, hydrogen-rich gas, liquefied petroleum gas |
| `H300-C5-N4` | P300 | 5 Cr alloy steel | Normal | 2 | 4 | **4** | 3 | 24 to 36 | 60 psi, 1,030 °F | crude oil, residue, hydrocarbon gas |
| `H300-CS-N4` | P300 | carbon steel | Normal | 2 | 4 | **4** | 52 | 3 to 12 | 300 psi, 495 °F | hydrocarbon gas, naphtha, hydrogen-rich gas, liquefied petroleum gas, fuel gas, reformate, gasoline |
| `H600-C1-N4` | P600 | 1-1/4 Cr alloy steel | Normal | 3 | 4 | **4** | 8 | 6 to 12 | 595 psi, 665 °F | reactor effluent (oil and hydrogen) |
| `H600-CS-N4` | P600 | carbon steel | Normal | 3 | 4 | **4** | 23 | 3 to 8 | 585 psi, 355 °F | hydrogen-rich gas, reactor effluent (oil and hydrogen), liquefied petroleum gas |
| `S1200-CS-N2` | P1200 | carbon steel | Normal | 4 | 2 | **4** | 12 | 3/4 to 10 | 685 psi, 700 °F | steam, 600 psi |
| `W1200-CS-N2` | P1200 | carbon steel | Normal | 4 | 2 | **4** | 1 | 3 | 1,015 psi, 160 °F | process and wash water |
| `H150-C5-N3` | P150 | 5 Cr alloy steel | Normal | 1 | 3 | **3** | 5 | 6 to 14 | 55 psi, 700 °F | gas oil, residue |
| `H150-CS-N3` | P150 | carbon steel | Normal | 1 | 3 | **3** | 166 | 3 to 36 | 150 psi, 600 °F | crude oil, naphtha, diesel, kerosene, gas oil, residue, oily water, gasoline, reformate, slurry oil |
| `H300-C5-N3` | P300 | 5 Cr alloy steel | Normal | 2 | 3 | **3** | 7 | 4 to 14 | 270 psi, 740 °F | gas oil, residue, slurry oil |
| `H300-CS-N3` | P300 | carbon steel | Normal | 2 | 3 | **3** | 104 | 3 to 24 | 300 psi, 600 °F | oily water, crude oil, naphtha, diesel, gas oil, kerosene, residue, reformate, slurry oil, gasoline |
| `H600-C5-N3` | P600 | 5 Cr alloy steel | Normal | 3 | 3 | **3** | 5 | 3 to 10 | 260 psi, 740 °F | residue, slurry oil |
| `H600-CS-N2` | P600 | carbon steel | Normal | 3 | 2 | **3** | 12 | 3 to 6 | 470 psi, 305 °F | sour water, amine solution, caustic solution |
| `H600-CS-N3` | P600 | carbon steel | Normal | 3 | 3 | **3** | 26 | 3 to 12 | 595 psi, 555 °F | crude oil, naphtha, kerosene, gas oil, diesel, gasoline |
| `W600-CS-N2` | P600 | carbon steel | Normal | 3 | 2 | **3** | 2 | 3 | 500 psi, 160 °F | process and wash water |
| `C150-CS-N2` | P150 | carbon steel | Normal | 1 | 2 | **2** | 1 | 10 | 50 psi, 300 °F | boiler feed water |
| `C300-CS-N2` | P300 | carbon steel | Normal | 2 | 2 | **2** | 9 | 3/4 to 3 | 275 psi, 410 °F | boiler feed water, steam condensate |
| `G150-CS-N2` | P150 | carbon steel | Normal | 1 | 2 | **2** | 2 | 3 to 20 | 65 psi, 650 °F | process air |
| `G300-CS-N2` | P300 | carbon steel | Normal | 2 | 2 | **2** | 2 | 3 | 175 psi, 150 °F | nitrogen |
| `H150-CS-N2` | P150 | carbon steel | Normal | 1 | 2 | **2** | 40 | 2 to 42 | 150 psi, 650 °F | sour water, amine solution, flue gas, caustic solution, liquid sulfur |
| `H150-SS-N2` | P150 | stainless steel | Normal | 1 | 2 | **2** | 2 | 3 | 115 psi, 170 °F | sour water |
| `H300-CS-N2` | P300 | carbon steel | Normal | 2 | 2 | **2** | 6 | 2 to 4 | 275 psi, 250 °F | sour water, amine solution, caustic solution |
| `S150-CS-N2` | P150 | carbon steel | Normal | 1 | 2 | **2** | 2 | 10 to 14 | 75 psi, 370 °F | steam, 50 psi |
| `S300-CS-N2` | P300 | carbon steel | Normal | 2 | 2 | **2** | 14 | 2 to 10 | 185 psi, 450 °F | steam, 150 psi |
| `W300-CS-N2` | P300 | carbon steel | Normal | 2 | 2 | **2** | 13 | 3 to 20 | 285 psi, 315 °F | process and wash water, raw and service water, demineralised water, fire water |
| `C150-CS-D1` | P150 | carbon steel | D | 1 | 1 | **1** | 12 | 3/4 to 6 | 115 psi, 310 °F | steam condensate |
| `G150-CS-D1` | P150 | carbon steel | D | 1 | 1 | **1** | 10 | 1-1/2 to 6 | 150 psi, 230 °F | process air, instrument air, plant air |
| `S150-CS-D1` | P150 | carbon steel | D | 1 | 1 | **1** | 21 | 2 to 10 | 80 psi, 350 °F | steam, 50 psi |
| `W150-CS-D1` | P150 | carbon steel | D | 1 | 1 | **1** | 72 | 3/4 to 48 | 140 psi, 315 °F | process and wash water, cooling water supply, cooling water return, raw and service water, demineralised water, fire water |

| Severity | Lines |
| --- | --- |
| 5 | 15 |
| 4 | 194 |
| 3 | 327 |
| 2 | 91 |
| 1 | 115 |

## Pressure equipment

### Unit 11: Crude distillation

Separates the crude by boiling range into gas, naphtha, kerosene, diesel, gas oil and residue, after washing the salt out of it. Everything else in the refinery works on what this unit cuts.

| Tag | Service | Report | Registration | Working pressure and temperature | Size | Wall, in | Material | Radiography | Heat treatment | Minimum metal temperature, °F | Weight, lb |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C-1101 | Atmospheric column | U-1 | Y5288.7 | vessel: 50 psi at 730 °F | 138 in × 104 ft | 0.625 | SA-516-70 | spot | none | -20 | 141,022 |
| C-1102 | Side stripper (kerosene, diesel and gas oil sections) | U-1 | V1145.7 | vessel: 50 psi at 670 °F | 60 in × 56 ft | 0.375 | SA-516-70 | spot | none | -20 | 32,919 |
| D-1101 | Desalter | U-1A | A9559.7 | vessel: 175 psi at 320 °F | 144 in × 48 ft | 0.875 | SA-516-70 | spot | none | -20 | 80,694 |
| D-1102 | Preflash drum | U-1A | Y2178.7 | vessel: 70 psi at 450 °F | 126 in × 31.5 ft | 0.625 | SA-516-70 | spot | none | -20 | 36,384 |
| D-1103 | Overhead accumulator | U-1A | X3797.7 | vessel: 50 psi at 150 °F | 96 in × 24 ft | 0.5 | SA-516-70 | spot | post-weld heat treated | -20 | 17,503 |
| E-1101 | Crude / top pumparound exchanger | U-1 | Y8322.7 | shell side: 165 psi at 380 °F; tube side: 390 psi at 155 °F | 36 in × 20 ft | 0.625 | SA-516-70 | spot | none | -20 | 20,972 |
| E-1102 | Crude / kerosene exchanger | U-1 | A6703.7 | shell side: 215 psi at 440 °F; tube side: 390 psi at 175 °F | 36 in × 20 ft | 0.625 | SA-516-70 | spot | none | -20 | 20,972 |
| E-1103 | Crude / diesel exchanger | U-1 | B5084.7 | shell side: 215 psi at 580 °F; tube side: 390 psi at 235 °F | 36 in × 20 ft | 0.625 | SA-516-70 | spot | none | -20 | 20,972 |
| E-1104 | Crude / diesel pumparound exchanger | U-1 | T3465.7 | shell side: 165 psi at 550 °F; tube side: 390 psi at 320 °F | 36 in × 20 ft | 0.625 | SA-516-70 | spot | none | -20 | 20,972 |
| E-1105 | Wash water / brine exchanger | U-1 | U1846.7 | shell side: 175 psi at 320 °F; tube side: 285 psi at 270 °F | 18 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 4,929 |
| E-1112 | Brine cooler | U-1 | F9370.7 | shell side: 165 psi at 210 °F; tube side: 85 psi at 155 °F | 18 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 4,929 |
| E-1106 | Crude / gas oil exchanger | U-1 | V9227.7 | shell side: 215 psi at 660 °F; tube side: 400 psi at 335 °F | 36 in × 20 ft | 0.625 | SA-516-70 | spot | none | -20 | 20,972 |
| E-1107 | Crude / gas oil pumparound exchanger | U-1 | W7608.7 | shell side: 165 psi at 660 °F; tube side: 400 psi at 450 °F | 48 in × 20 ft | 0.75 | SA-516-70 | spot | none | -20 | 38,100 |
| E-1108 | Crude / vacuum gas oil pumparound exchanger | U-1 | G5989.7 | shell side: 155 psi at 600 °F; tube side: 455 psi at 505 °F | 54 in × 20 ft | 0.875 | SA-516-70 | spot | none | -20 | 49,340 |
| E-1109 | Crude / vacuum residue exchanger | U-1 | H4370.7 | shell side: 155 psi at 730 °F; tube side: 455 psi at 555 °F | 42 in × 20 ft | 0.75 | SA-516-70 | spot | none | -20 | 29,703 |
| A-1101A | Overhead air condenser | U-1A | R5045.7 | headers and tubes: 50 psi at 300 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| A-1101B | Overhead air condenser | U-1A | P9188.7 | headers and tubes: 50 psi at 300 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| A-1101C | Overhead air condenser | U-1A | N1807.7 | headers and tubes: 50 psi at 300 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| A-1101D | Overhead air condenser | U-1A | W5950.7 | headers and tubes: 50 psi at 300 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| E-1110 | Overhead trim condenser | U-1 | H6132.7 | shell side: 50 psi at 190 °F; tube side: 85 psi at 155 °F | 36 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 18,716 |
| A-1102 | Top pumparound air cooler | U-1A | N3523.7 | headers and tubes: 165 psi at 295 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| E-1111 | Kerosene trim cooler | U-1 | G7751.7 | shell side: 215 psi at 250 °F; tube side: 85 psi at 155 °F | 24 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 8,685 |
| A-1103 | Diesel air cooler | U-1A | P1904.7 | headers and tubes: 215 psi at 285 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| E-1113 | Vacuum residue steam generator | U-1 | E1989.7 | shell side: 145 psi at 560 °F; tube side: 175 psi at 350 °F | 36 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 18,716 |

### Unit 12: Vacuum distillation

Distils the atmospheric residue again under vacuum, so that gas oil for the cracker can be boiled off without the oil being hot enough to crack. What will not boil leaves as vacuum residue for fuel oil and asphalt.

| Tag | Service | Report | Registration | Working pressure and temperature | Size | Wall, in | Material | Radiography | Heat treatment | Minimum metal temperature, °F | Weight, lb |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C-1201 | Vacuum column | U-1 | C6025.7 | vessel: 50 psi and full vacuum at 800 °F | 228 in × 101.5 ft | 1.625 | SA-516-70 | full | post-weld heat treated | -20 | 414,458 |
| D-1201 | Ejector hotwell | U-1A | H6546.7 | vessel: 50 psi at 160 °F | 36 in × 12 ft | 0.375 | SA-516-70 | spot | post-weld heat treated | -20 | 2,531 |
| J-1201-C1 | Vacuum ejector set, three stages with condensers: condenser 1 | U-1 | V3179.7 | shell side: 50 psi and full vacuum at 200 °F; tube side: 85 psi at 155 °F | 30 in × 10 ft | 0.375 | SA-516-70 | spot | none | -20 | 7,520 |
| J-1201-C2 | Vacuum ejector set, three stages with condensers: condenser 2 | U-1 | Y4798.7 | shell side: 50 psi and full vacuum at 200 °F; tube side: 85 psi at 155 °F | 30 in × 10 ft | 0.375 | SA-516-70 | spot | none | -20 | 7,520 |
| A-1201A | Light vacuum gas oil cooler | U-1A | P4670.7 | headers and tubes: 220 psi at 350 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| A-1201B | Light vacuum gas oil cooler | U-1A | L3051.7 | headers and tubes: 220 psi at 350 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| E-1201 | Heavy vacuum gas oil steam generator | U-1 | R2335.7 | shell side: 260 psi at 600 °F; tube side: 275 psi at 415 °F | 36 in × 20 ft | 0.5 | SA-516-70 | spot | none | -20 | 19,840 |
| E-1202 | Quench cooler (steam generator) | U-1 | P3954.7 | shell side: 260 psi at 740 °F; tube side: 275 psi at 415 °F | 18 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 4,929 |

### Unit 13: Naphtha hydrotreater and splitter

Removes sulfur and nitrogen from the naphtha with hydrogen over a catalyst, because they would poison the reformer's catalyst, then splits it into light naphtha for gasoline blending and heavy naphtha for the reformer.

| Tag | Service | Report | Registration | Working pressure and temperature | Size | Wall, in | Material | Radiography | Heat treatment | Minimum metal temperature, °F | Weight, lb |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D-1301 | Feed surge drum | U-1A | A1773.7 | vessel: 55 psi at 160 °F | 108 in × 27 ft | 0.5 | SA-516-70 | spot | none | -20 | 22,047 |
| D-1302 | Product separator | U-1A | D5916.7 | vessel: 385 psi at 150 °F | 78 in × 19.5 ft | 1 | SA-516-70 | spot | post-weld heat treated | -20 | 21,815 |
| C-1301 | Stripper | U-1 | P7094.7 | vessel: 210 psi at 450 °F | 72 in × 60 ft | 0.625 | SA-516-70 | spot | none | -20 | 50,069 |
| C-1302 | Naphtha splitter | U-1 | R5475.7 | vessel: 50 psi at 360 °F | 78 in × 80 ft | 0.375 | SA-516-70 | spot | none | -20 | 51,252 |
| D-1303 | Stripper reflux drum | U-1A | C7535.7 | vessel: 195 psi at 170 °F | 42 in × 10.5 ft | 0.375 | SA-516-70 | spot | none | -20 | 2,798 |
| D-1304 | Splitter reflux drum | U-1A | W2678.7 | vessel: 50 psi at 180 °F | 66 in × 16.5 ft | 0.375 | SA-516-70 | spot | none | -20 | 6,630 |
| E-1301 | Feed / effluent exchanger | U-1 | Y7108.7 | shell side: 425 psi at 660 °F; tube side: 595 psi at 570 °F | 42 in × 20 ft | 0.875 | SA-387-11 | spot | none | -20 | 31,060 |
| R-1301 | Hydrotreating reactor | U-1 | V7215.7 | vessel: 455 psi at 660 °F | 78 in × 22.5 ft | 1.25 | SA-387-11 | spot | none | -20 | 40,277 |
| A-1301A | Reactor effluent air cooler | U-1A | N7395.7 | headers and tubes: 500 psi at 355 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| A-1301B | Reactor effluent air cooler | U-1A | S9014.7 | headers and tubes: 500 psi at 355 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| E-1302 | Effluent trim cooler | U-1 | V2965.7 | shell side: 500 psi at 190 °F; tube side: 85 psi at 155 °F | 30 in × 20 ft | 0.625 | SA-516-70 | spot | none | -20 | 15,149 |
| E-1303 | Stripper feed / bottoms exchanger | U-1 | W1346.7 | shell side: 210 psi at 450 °F; tube side: 235 psi at 350 °F | 30 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 13,296 |
| A-1302 | Stripper overhead condenser | U-1A | G4489.7 | headers and tubes: 205 psi at 250 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| E-1304 | Stripper reboiler | U-1 | T2251.7 | shell side: 210 psi at 450 °F; tube side: 660 psi at 700 °F | 24 in × 20 ft | 0.625 | SA-516-70 | spot | none | -20 | 10,150 |
| A-1303A | Splitter overhead condenser | U-1A | V1397.7 | headers and tubes: 50 psi at 230 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| A-1303B | Splitter overhead condenser | U-1A | U5540.7 | headers and tubes: 50 psi at 230 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| E-1305 | Light naphtha cooler | U-1 | U9632.7 | shell side: 145 psi at 180 °F; tube side: 85 psi at 155 °F | 18 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 4,929 |
| E-1306 | Splitter reboiler | U-1 | R5489.7 | shell side: 50 psi at 360 °F; tube side: 175 psi at 450 °F | 36 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 18,716 |
| A-1304 | Heavy naphtha rundown cooler | U-1A | N7727.7 | headers and tubes: 160 psi at 360 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |

### Unit 14: Catalytic reformer and hydrogen purification

Rearranges heavy naphtha into high-octane reformate for gasoline, and in doing so makes the hydrogen the hydrotreaters live on. Its adsorbers purify that hydrogen for the diesel hydrotreater.

| Tag | Service | Report | Registration | Working pressure and temperature | Size | Wall, in | Material | Radiography | Heat treatment | Minimum metal temperature, °F | Weight, lb |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D-1401 | Feed surge drum | U-1A | H1024.7 | vessel: 65 psi at 350 °F | 102 in × 25.5 ft | 0.5 | SA-516-70 | spot | none | -20 | 19,710 |
| D-1402 | Product separator | U-1A | E5881.7 | vessel: 275 psi at 150 °F | 66 in × 16.5 ft | 0.75 | SA-516-70 | spot | none | -20 | 12,068 |
| D-1403 | Net gas knock-out drum | U-1A | F4262.7 | vessel: 570 psi at 160 °F | 36 in × 9 ft | 0.75 | SA-516-70 | spot | none | -20 | 4,069 |
| D-1404 | Tail gas drum | U-1A | L9119.7 | vessel: 50 psi at 150 °F | 36 in × 9 ft | 0.375 | SA-516-70 | spot | none | -20 | 2,412 |
| X-1401A | Pressure swing adsorption unit, four beds: adsorber 1 | U-1A | G6095.7 | vessel: 560 psi at 160 °F | 72 in × 20 ft | 1.25 | SA-516-70 | spot | none | -20 | 25,210 |
| X-1401B | Pressure swing adsorption unit, four beds: adsorber 2 | U-1A | F7714.7 | vessel: 560 psi at 160 °F | 72 in × 20 ft | 1.25 | SA-516-70 | spot | none | -20 | 25,210 |
| X-1401C | Pressure swing adsorption unit, four beds: adsorber 3 | U-1A | J9333.7 | vessel: 560 psi at 160 °F | 72 in × 20 ft | 1.25 | SA-516-70 | spot | none | -20 | 25,210 |
| X-1401D | Pressure swing adsorption unit, four beds: adsorber 4 | U-1A | D7000.7 | vessel: 560 psi at 160 °F | 72 in × 20 ft | 1.25 | SA-516-70 | spot | none | -20 | 25,210 |
| C-1401 | Stabiliser | U-1 | N9887.7 | vessel: 250 psi at 495 °F | 66 in × 80 ft | 0.625 | SA-516-70 | spot | none | -20 | 61,444 |
| D-1405 | Stabiliser receiver | U-1A | M7500.7 | vessel: 235 psi at 160 °F | 48 in × 12 ft | 0.5 | SA-516-70 | spot | none | -20 | 4,565 |
| D-1406 | Convection section steam drum | U-1A | J3357.7 | vessel: 660 psi at 540 °F | 36 in × 9 ft | 0.875 | SA-516-70 | spot | none | -20 | 4,300 |
| E-1401 | Combined feed exchanger | U-1 | T7473.7 | shell side: 350 psi at 970 °F; tube side: 540 psi at 850 °F | 42 in × 20 ft | 1.125 | SA-387-11 | spot | none | -20 | 33,798 |
| R-1401 | First reforming reactor | U-1 | B8126.7 | vessel: 410 psi at 1,000 °F | 72 in × 16 ft | 1.875 | SA-387-11 | full | post-weld heat treated | -20 | 32,299 |
| R-1402 | Second reforming reactor | U-1 | C6507.7 | vessel: 385 psi at 1,000 °F | 78 in × 19 ft | 1.875 | SA-387-11 | full | post-weld heat treated | -20 | 40,250 |
| R-1403 | Third reforming reactor | U-1 | D4888.7 | vessel: 360 psi at 1,000 °F | 96 in × 21.5 ft | 2.125 | SA-387-11 | full | post-weld heat treated | -20 | 63,379 |
| A-1401A | Product condenser | U-1A | U8772.7 | headers and tubes: 340 psi at 580 °F | 268 tubes of 1 in × 32 ft | — | SA-387-11 | spot | none | -20 | 16,243 |
| A-1401B | Product condenser | U-1A | V4629.7 | headers and tubes: 340 psi at 580 °F | 268 tubes of 1 in × 32 ft | — | SA-387-11 | spot | none | -20 | 16,243 |
| E-1402 | Product trim cooler | U-1 | W2616.7 | shell side: 335 psi at 190 °F; tube side: 85 psi at 155 °F | 30 in × 20 ft | 0.5 | SA-516-70 | spot | none | -20 | 14,219 |
| E-1403 | Net gas cooler | U-1 | V4235.7 | shell side: 585 psi at 280 °F; tube side: 85 psi at 155 °F | 12 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 2,377 |
| E-1404 | Stabiliser feed / bottoms exchanger | U-1 | Y3330.7 | shell side: 250 psi at 495 °F; tube side: 275 psi at 350 °F | 24 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 8,685 |
| E-1405 | Stabiliser condenser | U-1 | X4949.7 | shell side: 245 psi at 210 °F; tube side: 85 psi at 155 °F | 24 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 8,685 |
| E-1406 | Stabiliser reboiler | U-1 | B9092.7 | shell side: 250 psi at 495 °F; tube side: 660 psi at 700 °F | 30 in × 20 ft | 0.75 | SA-516-70 | spot | none | -20 | 16,087 |
| A-1402 | Reformate air cooler | U-1A | W5940.7 | headers and tubes: 240 psi at 280 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| E-1407 | Reformate trim cooler | U-1 | A1711.7 | shell side: 235 psi at 190 °F; tube side: 85 psi at 155 °F | 24 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 8,685 |

### Unit 15: Kerosene hydrotreater

Removes sulfur from kerosene with hydrogen so that it meets jet fuel quality.

| Tag | Service | Report | Registration | Working pressure and temperature | Size | Wall, in | Material | Radiography | Heat treatment | Minimum metal temperature, °F | Weight, lb |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D-1501 | Feed surge drum | U-1A | V5251.7 | vessel: 55 psi at 150 °F | 84 in × 21 ft | 0.375 | SA-516-70 | spot | none | -20 | 10,570 |
| D-1502 | Product separator | U-1A | U6870.7 | vessel: 375 psi at 160 °F | 60 in × 15 ft | 0.75 | SA-516-70 | spot | post-weld heat treated | -20 | 10,023 |
| C-1501 | Stripper | U-1 | U1956.7 | vessel: 70 psi at 435 °F | 42 in × 50 ft | 0.375 | SA-516-70 | spot | none | -20 | 22,873 |
| D-1503 | Stripper overhead drum | U-1A | T8489.7 | vessel: 55 psi at 170 °F | 36 in × 12 ft | 0.375 | SA-516-70 | spot | post-weld heat treated | -20 | 2,531 |
| E-1501 | Feed / effluent exchanger | U-1 | F3246.7 | shell side: 415 psi at 615 °F; tube side: 595 psi at 570 °F | 36 in × 20 ft | 0.75 | SA-387-11 | spot | none | -20 | 22,112 |
| R-1501 | Hydrotreating reactor | U-1 | V7057.7 | vessel: 455 psi at 665 °F | 72 in × 23.5 ft | 1.125 | SA-387-11 | spot | none | -20 | 35,576 |
| E-1505 | Reactor effluent / stripper feed exchanger | U-1 | K9722.7 | shell side: 420 psi at 665 °F; tube side: 85 psi at 435 °F | 24 in × 20 ft | 0.5 | SA-387-11 | spot | none | -20 | 9,414 |
| A-1501 | Reactor effluent air cooler | U-1A | B2866.7 | headers and tubes: 500 psi at 315 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| E-1502 | Effluent trim cooler | U-1 | G1627.7 | shell side: 500 psi at 190 °F; tube side: 85 psi at 155 °F | 18 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 4,929 |
| E-1503 | Stripper feed / bottoms exchanger | U-1 | H9008.7 | shell side: 180 psi at 420 °F; tube side: 95 psi at 370 °F | 36 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 18,716 |
| A-1502 | Stripper overhead condenser | U-1A | C1247.7 | headers and tubes: 65 psi at 300 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| E-1504 | Kerosene trim cooler | U-1 | J2341.7 | shell side: 180 psi at 210 °F; tube side: 85 psi at 155 °F | 24 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 8,685 |
| F-1501 | Product coalescer | U-1A | X5429.7 | vessel: 180 psi at 150 °F | 30 in × 5 ft | 0.375 | SA-516-70 | spot | none | -20 | 1,470 |

### Unit 16: Diesel hydrotreater

Removes sulfur from diesel and light cycle oil with hydrogen at high pressure to make road diesel.

| Tag | Service | Report | Registration | Working pressure and temperature | Size | Wall, in | Material | Radiography | Heat treatment | Minimum metal temperature, °F | Weight, lb |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D-1601 | Feed surge drum | U-1A | K5118.7 | vessel: 55 psi at 190 °F | 108 in × 27 ft | 0.5 | SA-516-70 | spot | none | -20 | 22,047 |
| D-1602 | Cold separator | U-1A | L3499.7 | vessel: 850 psi at 190 °F | 78 in × 19.5 ft | 2 | SA-516-70 | full | post-weld heat treated | -20 | 42,525 |
| C-1601 | Recycle gas amine absorber | U-1 | N3749.7 | vessel: 845 psi at 190 °F | 36 in × 60 ft | 1 | SA-516-70 | full | post-weld heat treated | -20 | 37,713 |
| D-1603 | Recycle compressor knock-out drum | U-1A | M1880.7 | vessel: 835 psi at 180 °F | 36 in × 9 ft | 1 | SA-516-70 | full | none | -20 | 5,194 |
| D-1604 | Low-pressure flash drum | U-1A | N4213.7 | vessel: 165 psi at 190 °F | 72 in × 18 ft | 0.5 | SA-516-70 | spot | none | -20 | 9,987 |
| C-1602 | Product stripper | U-1 | S7892.7 | vessel: 130 psi at 485 °F | 60 in × 60 ft | 0.375 | SA-516-70 | spot | none | -20 | 32,665 |
| D-1605 | Stripper overhead drum | U-1A | P2594.7 | vessel: 115 psi at 170 °F | 36 in × 12 ft | 0.375 | SA-516-70 | spot | post-weld heat treated | -20 | 2,531 |
| R-1601 | Hydrotreating reactor, two beds | U-1 | F2616.7 | vessel: 1,000 psi at 700 °F | 126 in × 42.5 ft | 4 | SA-387-11 | full | post-weld heat treated | -20 | 301,495 |
| F-1601 | Feed filter | U-1A | D8532.7 | vessel: 55 psi at 190 °F | 42 in × 7 ft | 0.375 | SA-516-70 | spot | none | -20 | 2,541 |
| E-1601 | Feed / effluent exchanger | U-1 | N5667.7 | shell side: 870 psi at 650 °F; tube side: 1,145 psi at 590 °F | 48 in × 20 ft | 1.75 | SA-387-11 | full | post-weld heat treated | -20 | 50,918 |
| E-1604 | Reactor effluent / stripper feed exchanger | U-1 | U1524.7 | shell side: 880 psi at 700 °F; tube side: 155 psi at 485 °F | 30 in × 20 ft | 1 | SA-387-11 | full | none | -20 | 17,986 |
| A-1601 | Reactor effluent air cooler | U-1A | C9583.7 | headers and tubes: 1,015 psi at 340 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | full | none | -20 | 16,243 |
| E-1602 | Stripper feed / bottoms exchanger | U-1 | M7286.7 | shell side: 225 psi at 470 °F; tube side: 165 psi at 420 °F | 48 in × 20 ft | 0.5 | SA-516-70 | spot | none | -20 | 34,977 |
| A-1602 | Stripper overhead condenser | U-1A | B2202.7 | headers and tubes: 125 psi at 350 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| A-1603 | Diesel air cooler | U-1A | A3821.7 | headers and tubes: 225 psi at 240 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| E-1603 | Diesel trim cooler | U-1 | L8905.7 | shell side: 225 psi at 190 °F; tube side: 85 psi at 155 °F | 24 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 8,685 |
| F-1602 | Product coalescer and salt dryer | U-1A | A4389.7 | vessel: 225 psi at 160 °F | 42 in × 7 ft | 0.5 | SA-516-70 | spot | none | -20 | 3,082 |

### Unit 17: Fluid catalytic cracker and gas concentration

Cracks gas oil on hot fluidised catalyst into gasoline and liquefied gas, burning the coke off the catalyst to supply the heat. Its gas plant recovers and treats the refinery's fuel gas, liquefied gas and cracked gasoline.

| Tag | Service | Report | Registration | Working pressure and temperature | Size | Wall, in | Material | Radiography | Heat treatment | Minimum metal temperature, °F | Weight, lb |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D-1701 | Fresh feed surge drum | U-1A | X4049.7 | vessel: 55 psi at 450 °F | 126 in × 31.5 ft | 0.625 | SA-516-70 | spot | none | -20 | 36,384 |
| R-1701-RX | Reactor and regenerator: reactor vessel and stripper | U-1 | F1008.7 | vessel: 55 psi at 650 °F | 132 in × 32.4 ft | 1 | SA-516-70 | spot | none | -20 | — |
| R-1701-RG | Reactor and regenerator: regenerator | U-1 | L6197.7 | vessel: 55 psi at 650 °F | 216 in × 27 ft | 1 | SA-516-70 | spot | none | -20 | — |
| C-1701 | Main fractionator | U-1 | W6874.7 | vessel: 55 psi at 1,030 °F | 144 in × 84 ft | 0.625 | SA-516-70 | spot | none | -20 | 126,551 |
| C-1702 | Light cycle oil stripper | U-1 | X5255.7 | vessel: 50 psi at 500 °F | 42 in × 32 ft | 0.375 | SA-516-70 | spot | none | -20 | 18,305 |
| D-1702 | Main column overhead receiver | U-1A | B8192.7 | vessel: 50 psi at 160 °F | 84 in × 21 ft | 0.375 | SA-516-70 | spot | post-weld heat treated | -20 | 10,570 |
| D-1703 | Compressor interstage drum | U-1A | A9811.7 | vessel: 80 psi at 170 °F | 42 in × 10.5 ft | 0.375 | SA-516-70 | spot | none | -20 | 2,798 |
| D-1704 | High-pressure separator | U-1A | D8906.7 | vessel: 225 psi at 150 °F | 90 in × 22.5 ft | 0.75 | SA-516-70 | spot | post-weld heat treated | -20 | 22,140 |
| C-1703 | Primary absorber | U-1 | Y3636.7 | vessel: 225 psi at 165 °F | 66 in × 80 ft | 0.625 | SA-516-70 | spot | none | -20 | 60,027 |
| C-1704 | Sponge absorber | U-1 | A2017.7 | vessel: 215 psi at 165 °F | 36 in × 60 ft | 0.375 | SA-516-70 | spot | none | -20 | 21,321 |
| C-1706 | Fuel gas amine absorber | U-1 | C7779.7 | vessel: 210 psi at 185 °F | 36 in × 60 ft | 0.375 | SA-516-70 | spot | post-weld heat treated | -20 | 21,321 |
| D-1706 | Fuel gas knock-out drum | U-1A | F5668.7 | vessel: 205 psi at 165 °F | 36 in × 9 ft | 0.375 | SA-516-70 | spot | none | -20 | 2,412 |
| C-1707 | Stripper | U-1 | D6160.7 | vessel: 240 psi at 340 °F | 84 in × 80 ft | 0.75 | SA-516-70 | spot | none | -20 | 84,425 |
| C-1708 | Debutaniser | U-1 | E4541.7 | vessel: 185 psi at 435 °F | 84 in × 92 ft | 0.625 | SA-516-70 | spot | none | -20 | 84,233 |
| D-1705 | Debutaniser receiver | U-1A | C1525.7 | vessel: 165 psi at 160 °F | 84 in × 21 ft | 0.625 | SA-516-70 | spot | none | -20 | 16,406 |
| C-1709 | Liquefied gas amine contactor | U-1 | F2922.7 | vessel: 265 psi at 170 °F | 42 in × 40 ft | 0.5 | SA-516-70 | spot | post-weld heat treated | -20 | 20,522 |
| C-1710 | Depropaniser | U-1 | F4684.7 | vessel: 250 psi at 285 °F | 54 in × 100 ft | 0.5 | SA-516-70 | spot | none | -20 | 55,460 |
| D-1707 | Depropaniser receiver | U-1A | E7287.7 | vessel: 235 psi at 160 °F | 72 in × 18 ft | 0.625 | SA-516-70 | spot | none | -20 | 12,140 |
| E-1701 | Feed / light cycle oil pumparound exchanger | U-1 | W6736.7 | shell side: 210 psi at 500 °F; tube side: 330 psi at 450 °F | 36 in × 20 ft | 0.5 | SA-516-70 | spot | none | -20 | 19,840 |
| E-1702 | Feed / slurry exchanger | U-1 | X2593.7 | shell side: 210 psi at 730 °F; tube side: 330 psi at 500 °F | 30 in × 20 ft | 0.5 | SA-516-70 | spot | none | -20 | 14,219 |
| E-1703 | Flue gas cooler (steam generator) | P-3 | Y9974.7 | steam and water side (shell and steam drum): 770 psi at 540 °F; gas side (tubes and channels): 50 psi at 650 °F | 126 in × 20 ft | 2.875 | SA-516-70 | full | post-weld heat treated | -20 | 313,612 |
| E-1704 | Slurry steam generator | U-1 | A5831.7 | shell side: 210 psi at 710 °F; tube side: 275 psi at 415 °F | 48 in × 20 ft | 0.5 | SA-516-70 | spot | none | -20 | 34,977 |
| E-1705 | Slurry product cooler | U-1 | B4212.7 | shell side: 210 psi at 530 °F; tube side: 85 psi at 155 °F | 18 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 4,929 |
| F-1701 | Slurry filter | U-1A | X1335.7 | vessel: 210 psi at 250 °F | 24 in × 4 ft | 0.375 | SA-516-70 | spot | none | -20 | 1,015 |
| E-1715 | Debutaniser reboiler | U-1 | A8689.7 | shell side: 210 psi at 650 °F; tube side: 185 psi at 435 °F | 36 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 18,716 |
| E-1707 | Stripper reboiler | U-1 | Y7450.7 | shell side: 210 psi at 440 °F; tube side: 240 psi at 335 °F | 30 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 13,296 |
| A-1702 | Light cycle oil air cooler | U-1A | G4861.7 | headers and tubes: 345 psi at 485 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| E-1708 | Sponge oil cooler | U-1 | E4403.7 | shell side: 345 psi at 190 °F; tube side: 85 psi at 155 °F | 18 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 4,929 |
| A-1701A | Main column overhead condenser | U-1A | J9311.7 | headers and tubes: 50 psi at 320 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| A-1701B | Main column overhead condenser | U-1A | M1930.7 | headers and tubes: 50 psi at 320 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| A-1701C | Main column overhead condenser | U-1A | L3549.7 | headers and tubes: 50 psi at 320 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| E-1709 | Overhead trim condenser | U-1 | F2784.7 | shell side: 50 psi at 190 °F; tube side: 85 psi at 155 °F | 48 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 33,428 |
| A-1703 | Interstage cooler | U-1A | H3242.7 | headers and tubes: 85 psi at 250 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| A-1704 | High-pressure cooler | U-1A | E4147.7 | headers and tubes: 300 psi at 280 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| E-1710 | High-pressure trim cooler | U-1 | F4546.7 | shell side: 300 psi at 180 °F; tube side: 85 psi at 155 °F | 36 in × 20 ft | 0.5 | SA-516-70 | spot | none | -20 | 19,840 |
| E-1711 | Stripper feed / debutaniser bottoms exchanger | U-1 | E6165.7 | shell side: 185 psi at 400 °F; tube side: 315 psi at 230 °F | 24 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 8,685 |
| E-1712 | Debutaniser condenser | U-1 | H1308.7 | shell side: 175 psi at 190 °F; tube side: 85 psi at 155 °F | 54 in × 20 ft | 0.5 | SA-516-70 | spot | none | -20 | 43,971 |
| A-1705 | Gasoline air cooler | U-1A | F2528.7 | headers and tubes: 175 psi at 285 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| E-1717 | Gasoline trim cooler | U-1 | C5451.7 | shell side: 170 psi at 190 °F; tube side: 85 psi at 155 °F | 30 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 13,296 |
| V-1704 | Gasoline caustic wash drum | U-1A | F8560.7 | vessel: 160 psi at 150 °F | 72 in × 15 ft | 0.5 | SA-516-70 | spot | none | -20 | 9,048 |
| V-1703 | Liquefied gas caustic wash drum | U-1A | X1893.7 | vessel: 260 psi at 160 °F | 66 in × 13.75 ft | 0.625 | SA-516-70 | spot | none | -20 | 9,299 |
| E-1713 | Depropaniser condenser | U-1 | G2927.7 | shell side: 240 psi at 170 °F; tube side: 85 psi at 155 °F | 48 in × 20 ft | 0.5 | SA-516-70 | spot | none | -20 | 34,977 |
| E-1714 | Depropaniser reboiler | U-1 | B7070.7 | shell side: 250 psi at 285 °F; tube side: 175 psi at 450 °F | 24 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 8,685 |
| E-1716 | Four-carbon cooler | U-1 | D3832.7 | shell side: 250 psi at 285 °F; tube side: 85 psi at 155 °F | 18 in × 20 ft | 0.375 | SA-516-70 | spot | none | -20 | 4,929 |

### Unit 18: Sulfur block

Takes the hydrogen sulfide out of circulation: regenerates the amine that washes it from the gases, strips it from sour water, and converts it to liquid sulfur for sale.

| Tag | Service | Report | Registration | Working pressure and temperature | Size | Wall, in | Material | Radiography | Heat treatment | Minimum metal temperature, °F | Weight, lb |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D-1801 | Rich amine flash drum | U-1A | D1324.7 | vessel: 50 psi at 185 °F | 84 in × 21 ft | 0.375 | SA-516-70 | spot | post-weld heat treated | -20 | 10,570 |
| D-1802 | Regenerator reflux drum | U-1A | A6181.7 | vessel: 50 psi at 170 °F | 36 in × 9 ft | 0.375 | SA-516-70 | full | post-weld heat treated | -20 | 2,095 |
| C-1801 | Amine regenerator | U-1 | V7611.7 | vessel: 50 psi at 305 °F | 54 in × 64 ft | 0.375 | SA-516-70 | full | post-weld heat treated | -20 | 33,967 |
| D-1803 | Acid gas knock-out drum | U-1A | B4562.7 | vessel: 50 psi at 170 °F | 36 in × 9 ft | 0.375 | SA-516-70 | full | post-weld heat treated | -20 | 2,412 |
| D-1804 | Sour water degassing drum | U-1A | X1763.7 | vessel: 50 psi at 230 °F | 72 in × 18 ft | 0.375 | SA-516-70 | full | post-weld heat treated | -20 | 7,841 |
| D-1805 | Stripper gas knock-out drum | U-1A | Y9144.7 | vessel: 50 psi at 230 °F | 36 in × 9 ft | 0.375 | SA-516-70 | full | post-weld heat treated | -20 | 2,412 |
| C-1802 | Sour water stripper | U-1 | U9230.7 | vessel: 55 psi at 315 °F | 54 in × 80 ft | 0.375 | SA-516-70 | full | post-weld heat treated | -20 | 40,256 |
| H-1801 | Reaction furnace with waste heat boiler | U-1 | M6152.7 | furnace chamber and boiler tubes: 50 psi at 650 °F; waste heat boiler shell: 770 psi at 540 °F | 72 in × 30 ft | 0.75 | SA-516-70 | full | post-weld heat treated | -20 | 113,158 |
| E-1801 | Lean / rich amine exchanger | U-1 | G5581.7 | shell side: 445 psi at 305 °F; tube side: 150 psi at 260 °F | 30 in × 20 ft | 0.5 | SA-516-70 | spot | post-weld heat treated | -20 | 14,219 |
| A-1801 | Regenerator overhead condenser | U-1A | J2169.7 | headers and tubes: 50 psi at 275 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | full | post-weld heat treated | -20 | 16,243 |
| E-1802 | Regenerator reboiler | U-1 | K9724.7 | shell side: 50 psi at 305 °F; tube side: 75 psi at 350 °F | 48 in × 20 ft | 0.375 | SA-516-70 | spot | post-weld heat treated | -20 | 33,428 |
| A-1802 | Lean amine air cooler | U-1A | M6312.7 | headers and tubes: 445 psi at 230 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | post-weld heat treated | -20 | 16,243 |
| E-1803 | Lean amine trim cooler | U-1 | J2343.7 | shell side: 445 psi at 180 °F; tube side: 85 psi at 155 °F | 18 in × 20 ft | 0.375 | SA-516-70 | spot | post-weld heat treated | -20 | 4,929 |
| F-1801 | Lean amine filter | U-1A | Y3094.7 | vessel: 445 psi at 170 °F | 24 in × 4 ft | 0.5 | SA-516-70 | spot | post-weld heat treated | -20 | 1,201 |
| E-1804 | Stripper feed / bottoms exchanger | U-1 | D6486.7 | shell side: 185 psi at 315 °F; tube side: 160 psi at 250 °F | 18 in × 20 ft | 0.375 | SA-516-70 | spot | post-weld heat treated | -20 | 4,929 |
| A-1803 | Stripper pumparound cooler | U-1A | L7931.7 | headers and tubes: 110 psi at 240 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | post-weld heat treated | -20 | 16,243 |
| E-1805 | Stripper reboiler | U-1 | C8105.7 | shell side: 55 psi at 315 °F; tube side: 75 psi at 350 °F | 42 in × 20 ft | 0.375 | SA-516-70 | spot | post-weld heat treated | -20 | 25,679 |
| A-1804 | Stripped water cooler | U-1A | P7026.7 | headers and tubes: 185 psi at 215 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |
| E-1806 | First sulfur condenser | U-1 | F3248.7 | shell side: 175 psi at 350 °F; tube side: 50 psi at 650 °F | 30 in × 20 ft | 0.375 | SA-516-70 | full | post-weld heat treated | -20 | 13,296 |
| E-1807 | First reheater | U-1 | E4867.7 | shell side: 660 psi at 700 °F; tube side: 50 psi at 500 °F | 24 in × 20 ft | 0.625 | SA-516-70 | full | post-weld heat treated | -20 | 10,150 |
| R-1801 | First converter | U-1 | F8426.7 | vessel: 50 psi at 630 °F | 54 in × 13.5 ft | 0.375 | SA-516-70 | full | post-weld heat treated | -20 | 4,511 |
| E-1808 | Second sulfur condenser | U-1 | S9010.7 | shell side: 175 psi at 350 °F; tube side: 50 psi at 630 °F | 30 in × 20 ft | 0.375 | SA-516-70 | full | post-weld heat treated | -20 | 13,296 |
| E-1809 | Second reheater | U-1 | R1629.7 | shell side: 660 psi at 700 °F; tube side: 50 psi at 470 °F | 24 in × 20 ft | 0.625 | SA-516-70 | full | post-weld heat treated | -20 | 10,150 |
| R-1802 | Second converter | U-1 | G6807.7 | vessel: 50 psi at 495 °F | 54 in × 13.5 ft | 0.375 | SA-516-70 | full | post-weld heat treated | -20 | 4,511 |
| E-1810 | Final sulfur condenser | U-1 | X9963.7 | shell side: 175 psi at 350 °F; tube side: 50 psi at 495 °F | 24 in × 20 ft | 0.375 | SA-516-70 | full | post-weld heat treated | -20 | 8,685 |

### Unit 19: Utilities

Supplies what every unit needs to run: steam, boiler feed water, cooling water, compressed air, nitrogen, caustic and fuel gas.

| Tag | Service | Report | Registration | Working pressure and temperature | Size | Wall, in | Material | Radiography | Heat treatment | Minimum metal temperature, °F | Weight, lb |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V-1904 | Deaerator | U-1A | F4202.7 | vessel: 50 psi at 310 °F | 108 in × 27 ft | 0.5 | SA-516-70 | spot | none | -20 | 27,295 |
| D-1901 | Condensate flash drum | U-1A | J3359.7 | vessel: 50 psi at 310 °F | 78 in × 19.5 ft | 0.375 | SA-516-70 | spot | none | -20 | 9,155 |
| D-1902 | Blowdown drum | U-1A | H4978.7 | vessel: 50 psi at 540 °F | 36 in × 9 ft | 0.375 | SA-516-70 | spot | none | -20 | 2,412 |
| B-1901 | Steam boiler 1 | P-3 | T6917.7 | steam and water side: 685 psi at 700 °F | steam drum 54 in, mud drum 35.1 in | — | SA-516-70 | spot | none | -20 | 142,769 |
| B-1902 | Steam boiler 2 | P-3 | W2060.7 | steam and water side: 685 psi at 700 °F | steam drum 54 in, mud drum 35.1 in | — | SA-516-70 | spot | none | -20 | 142,769 |
| D-1903 | Wet air receiver | U-1A | G6597.7 | vessel: 145 psi at 160 °F | 48 in × 12 ft | 0.375 | SA-516-70 | spot | none | -20 | 3,945 |
| D-1904 | Instrument air receiver | U-1A | F4264.7 | vessel: 130 psi at 160 °F | 42 in × 10.5 ft | 0.375 | SA-516-70 | spot | none | -20 | 3,135 |
| T-1903 | Liquid nitrogen tank | U-1A | L9405.7 | inner vessel: 175 psi at 150 °F | 120 in × 30 ft | 0.75 | SA-240-304 | spot | none | -320 | 37,369 |
| D-1905 | Fuel gas mixing drum | U-1A | E5883.7 | vessel: 85 psi at 165 °F | 48 in × 12 ft | 0.375 | SA-516-70 | spot | none | -20 | 3,945 |
| F-1901A | Pressure filters | U-1A | B8920.7 | vessel: 160 psi at 150 °F | 24 in × 4 ft | 0.375 | SA-516-70 | spot | none | -20 | 1,015 |
| F-1901B | Pressure filters | U-1A | C4777.7 | vessel: 160 psi at 150 °F | 24 in × 4 ft | 0.375 | SA-516-70 | spot | none | -20 | 1,015 |
| F-1901C | Pressure filters | U-1A | D3158.7 | vessel: 160 psi at 150 °F | 24 in × 4 ft | 0.375 | SA-516-70 | spot | none | -20 | 1,015 |
| V-1901A | Cation exchangers | U-1A | D8880.7 | vessel: 110 psi at 150 °F | 60 in × 12.5 ft | 0.375 | SA-516-70 | spot | none | -20 | 5,224 |
| V-1901B | Cation exchangers | U-1A | E4737.7 | vessel: 110 psi at 150 °F | 60 in × 12.5 ft | 0.375 | SA-516-70 | spot | none | -20 | 5,224 |
| V-1902A | Anion exchangers | U-1A | V7499.7 | vessel: 105 psi at 150 °F | 60 in × 12.5 ft | 0.375 | SA-516-70 | spot | none | -20 | 5,224 |
| V-1902B | Anion exchangers | U-1A | Y9118.7 | vessel: 105 psi at 150 °F | 60 in × 12.5 ft | 0.375 | SA-516-70 | spot | none | -20 | 5,224 |
| V-1903 | Mixed bed polisher | U-1A | L5107.7 | vessel: 100 psi at 150 °F | 78 in × 16.25 ft | 0.375 | SA-516-70 | spot | none | -20 | 8,291 |
| F-1902 | Side-stream filter | U-1A | K6168.7 | vessel: 140 psi at 150 °F | 48 in × 8 ft | 0.375 | SA-516-70 | spot | none | -20 | 3,170 |
| V-1905A | Air dryer, twin towers | U-1A | B1284.7 | vessel: 145 psi at 160 °F | 36 in × 7.5 ft | 0.375 | SA-516-70 | spot | none | -20 | 2,193 |
| V-1905B | Air dryer, twin towers | U-1A | C6141.7 | vessel: 145 psi at 160 °F | 36 in × 7.5 ft | 0.375 | SA-516-70 | spot | none | -20 | 2,193 |
| F-1903 | Dryer afterfilter | U-1A | J7787.7 | vessel: 140 psi at 160 °F | 24 in × 4 ft | 0.375 | SA-516-70 | spot | none | -20 | 1,015 |

### Unit 21: Intermediate and product tank farm

Holds feed between units, blends gasoline from its components, and stores the finished products and liquefied gas until they are shipped.

| Tag | Service | Report | Registration | Working pressure and temperature | Size | Wall, in | Material | Radiography | Heat treatment | Minimum metal temperature, °F | Weight, lb |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S-2101 | Three-carbon liquefied gas sphere | U-1 | T7027.7 | vessel: 205 psi at 160 °F | sphere 54 ft | 2 | SA-516-70 | full | post-weld heat treated | -50 | 906,844 |
| S-2102 | Four-carbon liquefied gas sphere | U-1 | S8646.7 | vessel: 85 psi at 150 °F | sphere 50 ft | 0.875 | SA-516-70 | spot | none | -20 | 404,548 |
| S-2103 | Four-carbon liquefied gas sphere | U-1 | R1265.7 | vessel: 85 psi at 150 °F | sphere 50 ft | 0.875 | SA-516-70 | spot | none | -20 | 404,548 |
| S-2104 | Three-carbon loading bullet | U-1A | Y2884.7 | vessel: 205 psi at 150 °F | 120 in × 60 ft | 0.875 | SA-516-70 | spot | none | -50 | 79,189 |
| S-2105 | Four-carbon loading bullet | U-1A | X4503.7 | vessel: 85 psi at 150 °F | 120 in × 60 ft | 0.5 | SA-516-70 | spot | none | -20 | 46,781 |
| A-2101 | Fuel oil rundown cooler | U-1A | C5597.7 | headers and tubes: 220 psi at 340 °F | 268 tubes of 1 in × 32 ft | — | SA-516-70 | spot | none | -20 | 16,243 |

### Unit 22: Marine terminal

Lands crude from tankers and loads products onto ships at a berth in deep water.

| Tag | Service | Report | Registration | Working pressure and temperature | Size | Wall, in | Material | Radiography | Heat treatment | Minimum metal temperature, °F | Weight, lb |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D-2201 | Jetty slop drum | U-1A | C6733.7 | vessel: 50 psi at 150 °F | 36 in × 9 ft | 0.375 | SA-516-70 | spot | none | -20 | — |

### Unit 23: Truck loading

Loads gasoline, jet fuel, diesel, asphalt and liquefied gas onto road tankers.

| Tag | Service | Report | Registration | Working pressure and temperature | Size | Wall, in | Material | Radiography | Heat treatment | Minimum metal temperature, °F | Weight, lb |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D-2301 | Loading rack drain drum | U-1A | M4698.7 | vessel: 50 psi at 150 °F | 36 in × 9 ft | 0.375 | SA-516-70 | spot | none | -20 | — |

### Unit 25: Flare

Burns safely, at a distance, whatever the relief valves release in an upset.

| Tag | Service | Report | Registration | Working pressure and temperature | Size | Wall, in | Material | Radiography | Heat treatment | Minimum metal temperature, °F | Weight, lb |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D-2501 | Flare knock-out drum | U-1A | P1464.7 | vessel: 50 psi at 300 °F | 132 in × 33 ft | 0.625 | SA-516-70 | spot | none | -20 | — |
| D-2502 | Flare water seal drum | U-1A | L6321.7 | vessel: 50 psi at 290 °F | 132 in × 33 ft | 0.625 | SA-516-70 | spot | none | -20 | — |

## Fired heater coils

As recalled, a fired process heater's coil is pressure equipment whose design is registered; each is listed with a design number and a piping code label, and is not a vessel (SW-REG-1).

| Coil | Service | Design | Material label | Registration |
| --- | --- | --- | --- | --- |
| H-1101-PC | Crude heater: process coil | 365 psi at 730 °F | A335-P5 | A6583.7 |
| H-1201-PC | Vacuum heater: process coil | 175 psi at 800 °F | A335-P5 | W2328.7 |
| H-1301-PC | Charge heater: process coil | 495 psi at 650 °F | A335-P11 | T5405.7 |
| H-1401-PC | Charge heater: process coil | 455 psi at 1,000 °F | A335-P11 | S6246.7 |
| H-1401-SC | Charge heater: steam coil | 660 psi at 540 °F | A106-B | V9929.7 |
| H-1402-PC | First interheater: process coil | 400 psi at 1,000 °F | A335-P11 | J2905.7 |
| H-1403-PC | Second interheater: process coil | 375 psi at 1,000 °F | A335-P11 | U1668.7 |
| H-1501-PC | Charge heater: process coil | 495 psi at 650 °F | A335-P11 | C9499.7 |
| H-1601-PC | Charge heater: process coil | 980 psi at 660 °F | A335-P11 | S1092.7 |

## Packaged components counted with the fittings

| Tag | Unit | Service | Category | Maker | Registration |
| --- | --- | --- | --- | --- | --- |
| J-1201-1 | 12 | Vacuum ejector set, three stages with condensers | H: other pressure-retaining components | Demonstration Maker 2 | 0H38353.7 |
| J-1201-2 | 12 | Vacuum ejector set, three stages with condensers | H: other pressure-retaining components | Demonstration Maker 2 | 0H38353.7 |
| J-1201-3 | 12 | Vacuum ejector set, three stages with condensers | H: other pressure-retaining components | Demonstration Maker 3 | 0H90734.7 |
| X-1901 | 19 | High to medium pressure let-down and desuperheater | H: other pressure-retaining components | Demonstration Maker 1 | 0H39013.7 |
| X-1902 | 19 | Medium to low pressure let-down and desuperheater | H: other pressure-retaining components | Demonstration Maker 1 | 0H68103.7 |
| X-1904 | 19 | Nitrogen vaporisers | H: other pressure-retaining components | Demonstration Maker 1 | 0H68103.7 |

## Lines with a note

Boiler external piping (8 lines): from a Section I boiler to its first stop valve the line is labelled "ASME Section I / B31.1", report P-4A; beyond it, B31.3.

| Line | From | To | Fluid |
| --- | --- | --- | --- |
| 3"-P1200-SC-17502 | boiler feed water header | E-1703 feed water in | boiler feed water |
| 8"-P1200-LS-17503 | E-1703 steam out | steam, 600 psi header | steam, 600 psi |
| 4"-P1200-SC-19019 | line 6"-P1200-SC-19018 | B-1901 feed water | boiler feed water |
| 4"-P1200-SC-19020 | line 4"-P1200-SC-19019 | B-1902 feed water | boiler feed water |
| 10"-P1200-LS-19021 | B-1901 steam | battery limit (high-pressure steam) | steam, 600 psi |
| 10"-P1200-LS-19022 | B-1902 steam | line 10"-P1200-LS-19021 | steam, 600 psi |
| 3"-P1200-SC-19027 | B-1901 blowdown | D-1902 inlet | boiler feed water |
| 3"-P1200-SC-19028 | B-1902 blowdown | line 3"-P1200-SC-19027 | boiler feed water |

Design temperature of 800 °F or more (9 lines): marked "elevated-temperature provisions may apply: for the owner to decide". The model designates no line under them.

| Line | From | To | Fluid | Design |
| --- | --- | --- | --- | --- |
| 36"-P300-P-12002 | H-1201 outlet | C-1201 feed | residue | 50 psi at 800 °F |
| 12"-P1200-P-14007 | E-1401 tube out | H-1401 inlet | reactor effluent (oil and hydrogen) | 540 psi at 850 °F |
| 14"-P1200-P-14008 | H-1401 outlet | R-1401 inlet | reactor effluent (oil and hydrogen) | 410 psi at 1,000 °F |
| 14"-P1200-P-14009 | R-1401 outlet | H-1402 inlet | reactor effluent (oil and hydrogen) | 400 psi at 900 °F |
| 14"-P1200-P-14010 | H-1402 outlet | R-1402 inlet | reactor effluent (oil and hydrogen) | 385 psi at 1,000 °F |
| 14"-P1200-P-14011 | R-1402 outlet | H-1403 inlet | reactor effluent (oil and hydrogen) | 375 psi at 940 °F |
| 14"-P1200-P-14012 | H-1403 outlet | R-1403 inlet | reactor effluent (oil and hydrogen) | 360 psi at 1,000 °F |
| 14"-P1200-P-14013 | R-1403 outlet | E-1401 shell in | reactor effluent (oil and hydrogen) | 350 psi at 970 °F |
| 24"-P300-P-17013 | R-1701 reactor vapour | C-1701 feed | hydrocarbon gas | 55 psi at 1,030 °F |

## What the owner is asked to verify

Each item below is recalled, not looked up (SW-REG-0):

- which items fall under Section VIII Division 1 and which under Section I, and that a fired heater's coil is registered pressure equipment while pump and compressor casings are not (SW-REG-1);
- the report designations U-1, U-1A, P-3, P-4 and P-4A and which item carries which (SW-REG-2);
- test pressure at 1.3 × (Section VIII Division 1) and 1.5 × (Section I) the working pressure; full radiography above 1-1/4 in of wall, for hydrogen above 600 psi and for lethal service; heat treatment above 1-1/4 in and for amine, caustic and wet hydrogen sulfide; minimum metal temperatures of −20, −50 and −320 °F (SW-REG-3);
- the limits of Category D, the designation of acid gas as Category M, the examination and leak test listed for each category, and whether the elevated-temperature provisions apply to the hot lines listed above (SW-REG-4);
- every material designation (SW-REG-5);
- the form of a Canadian Registration Number, the fitting categories A to H, and the digit 7 for New Brunswick (SW-REG-6).

## Not yet in the model

- Relief valves are named on the records and set at the working pressure; the valves themselves enter the 3D model with the piping.
- Connections listed on a record are the item's process and utility connections; manways, vents, drains and instrument connections are not listed.
- A registration number for each pipe piece, fitting, flange and valve follows from its line's piping system and its fitting category once the piping is generated.
- No weight yet on D-2201, D-2301, D-2501, D-2502: their bodies are placed with the offsite units.

## Files

| File | Content |
| --- | --- |
| `public/refinery/registry/equipment.json` | every pressure equipment record, the heater coils and the packaged components |
| `public/refinery/registry/lines.json` | the line classes and every line record |
| `public/refinery/registry/registration.json` | the registration index |
| `public/refinery/registry/unit-NN.pdf` | a unit's printable records: a summary, a page for each pressure equipment record, and its line register |
| `public/refinery/registry/registration-index.pdf` | the index and the line classes, printable |

