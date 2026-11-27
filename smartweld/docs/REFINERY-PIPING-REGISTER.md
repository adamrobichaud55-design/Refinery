# Plant 3: piping registers of the piped units

> **DEMONSTRATION DATA — not a registration.** Written by `tools/refinery-piping-register.ts` from `src/refinery/pipingRegister.ts` and the generated models in `public/refinery/piping/`; do not edit by hand.

For every unit that is piped, every line the generator built and every component of it has a record (DESIGN_BASIS.md §76, SW-REG-9): the line's fluid service, line class and severity; each component's material label and registration. A piece of pipe carries its line's piping system number; a fitting, flange, line blank or valve carries its maker's number in its category; studs and gaskets carry none and are listed so that each joint is whole.

What is whose: sizes, classes, counts, lengths and line classes are the model's own. Fluid service, examination, leak test, material labels and what is registered in which category are **recalled** from general knowledge of the codes, for the owner to verify. Every maker and every registration number is **invented**: issued by no one, looked up nowhere.

## The units

| Unit | Name | Lines | Pipe, ft | Components | Pipe pieces | Fittings (A) | Flanges and blanks (B) | Valves (C) | Studs and gaskets | Fitting numbers in use | Welds |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | Crude distillation | 135 | 12,825 | 4,552 | 1,284 | 950 | 627 | 311 | 1,380 | 33 | 2,498 |
| 12 | Vacuum distillation | 62 | 4,622 | 1,853 | 493 | 347 | 287 | 133 | 593 | 31 | 962 |
| 13 | Naphtha hydrotreater and splitter | 86 | 6,945 | 2,654 | 709 | 504 | 396 | 195 | 850 | 35 | 1,372 |
| 14 | Catalytic reformer and hydrogen purification | 99 | 8,982 | 2,955 | 830 | 563 | 417 | 219 | 926 | 36 | 1,571 |
| 15 | Kerosene hydrotreater | 65 | 4,476 | 1,950 | 512 | 374 | 293 | 143 | 628 | 25 | 1,007 |
| 16 | Diesel hydrotreater | 85 | 7,878 | 2,653 | 737 | 521 | 378 | 190 | 827 | 34 | 1,412 |
| 17 | Fluid catalytic cracker and gas concentration | 222 | 23,886 | 7,378 | 2,079 | 1,431 | 1,058 | 527 | 2,283 | 35 | 3,950 |
| 18 | Sulfur block | 139 | 12,378 | 4,655 | 1,192 | 826 | 713 | 361 | 1,563 | 31 | 2,311 |
| 19 | Utilities | 104 | 9,762 | 3,160 | 897 | 577 | 462 | 232 | 992 | 33 | 1,657 |
| 10 | Main pipeway | 145 | 38,061 | 2,743 | 1,502 | 568 | 233 | 26 | 414 | 28 | 2,171 |
|  | **all** | 1142 | 129,815 | 34,553 | 10,235 | 6,661 | 4,864 | 2,337 | 10,456 | 36 | 18,911 |

Categories as recalled (SW-REG-6): A pipe fittings; B flanges; C line valves. Line blanks (spades and spectacle blinds) are counted with the flanges they are clamped between.

## Unit 11: Crude distillation

Piping systems: a line class in the unit, with the number its lines and their pipe carry.

| Line class | Fluid service | Severity | Piping system number | Lines | Pipe, ft | Components |
| --- | --- | --- | --- | --- | --- | --- |
| `C1200-CS-N2` | Normal | 4 | Y2974.7 | 2 | 300 | 72 |
| `H150-C5-N4` | Normal | 4 | W9246.7 | 1 | 179 | 35 |
| `H150-CS-N4` | Normal | 4 | M2860.7 | 15 | 1,896 | 379 |
| `H300-C5-N4` | Normal | 4 | V9269.7 | 1 | 313 | 24 |
| `H150-C5-N3` | Normal | 3 | T5103.7 | 8 | 678 | 294 |
| `H150-CS-N3` | Normal | 3 | E1241.7 | 34 | 2,837 | 1,126 |
| `H300-C5-N3` | Normal | 3 | D6936.7 | 7 | 538 | 245 |
| `H300-CS-N3` | Normal | 3 | F7478.7 | 26 | 2,626 | 1,062 |
| `H600-C5-N3` | Normal | 3 | V7627.7 | 1 | 173 | 42 |
| `H600-CS-N3` | Normal | 3 | X3461.7 | 15 | 979 | 515 |
| `C300-CS-N2` | Normal | 2 | S9622.7 | 1 | 73 | 28 |
| `H150-CS-N2` | Normal | 2 | F8622.7 | 5 | 368 | 175 |
| `H300-CS-N2` | Normal | 2 | E9097.7 | 3 | 146 | 77 |
| `S150-CS-N2` | Normal | 2 | T6677.7 | 6 | 609 | 161 |
| `H150-CS-D1` | D | 1 | N1389.7 | 2 | 77 | 58 |
| `W150-CS-D1` | D | 1 | K6134.7 | 8 | 1,034 | 259 |

| Fluid service | Lines | Examination of welds (recalled) | Butt welds | Socket welds | Fillet welds | Shop | Field |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Normal | 125 | visual, and 5 % random radiography of girth butt welds | 2,313 | 0 | 4 | 1,994 | 323 |
| Category D | 10 | visual | 163 | 0 | 18 | 164 | 17 |

Lines by what they are: 66 of the flowsheet (16 of them as far as a control station), 17 parts after a control station (9 in another class than the line ahead: a specification break), 34 connections of installed spares, 0 branch root connections, 13 utility connections and 5 utility headers.

| Component | Count | Registered as | Material labels (recalled) | Fitting numbers in use |
| --- | --- | --- | --- | --- |
| pipe | 1,284 | its line's piping system | A106-B; A335-P5 | — |
| elbow | 817 | category A | A234-WPB; A234-WP5 | 10 |
| gasket | 740 | not registered | compressed sheet (non-steel) | — |
| stud set | 640 | not registered | A193-B7 studs, A194-2H nuts | — |
| flange | 541 | category B | A105; A182-F5 | 8 |
| gate valve | 230 | category C | A216-WCB; A217-C5 | 9 |
| reducer | 80 | category A | A234-WPB; A234-WP5 | 7 |
| spade | 80 | category B | A105; A182-F5 | 8 |
| tee | 42 | category A | A234-WPB; A234-WP5 | 8 |
| check valve | 28 | category C | A216-WCB; A217-C5 | 6 |
| globe valve | 22 | category C | A216-WCB | 5 |
| control valve | 17 | category C | A216-WCB; A217-C5 | 8 |
| bfly valve | 14 | category C | A216-WCB | 2 |
| spectacle blind | 6 | category B | A105; A182-F5 | 3 |
| branch outlet fitting | 6 | category A | A234-WPB | 2 |
| cap | 5 | category A | A234-WPB | 4 |

## Unit 12: Vacuum distillation

Piping systems: a line class in the unit, with the number its lines and their pipe carry.

| Line class | Fluid service | Severity | Piping system number | Lines | Pipe, ft | Components |
| --- | --- | --- | --- | --- | --- | --- |
| `C1200-CS-N2` | Normal | 4 | T2983.7 | 3 | 233 | 115 |
| `H150-CS-N4` | Normal | 4 | A2743.7 | 5 | 538 | 93 |
| `H300-C5-N4` | Normal | 4 | H3274.7 | 1 | 191 | 39 |
| `H150-CS-N3` | Normal | 3 | D6886.7 | 15 | 1,079 | 444 |
| `H300-C5-N3` | Normal | 3 | E4179.7 | 4 | 300 | 148 |
| `H300-CS-N3` | Normal | 3 | E6701.7 | 12 | 525 | 440 |
| `H600-C5-N3` | Normal | 3 | U3264.7 | 4 | 160 | 122 |
| `C300-CS-N2` | Normal | 2 | V8421.7 | 2 | 211 | 60 |
| `H150-CS-N2` | Normal | 2 | C8505.7 | 4 | 181 | 90 |
| `H300-CS-N2` | Normal | 2 | F5082.7 | 2 | 130 | 87 |
| `S150-CS-N2` | Normal | 2 | K3842.7 | 2 | 190 | 45 |
| `S300-CS-N2` | Normal | 2 | E9413.7 | 4 | 380 | 92 |
| `W150-CS-D1` | D | 1 | T8349.7 | 4 | 503 | 78 |

| Fluid service | Lines | Examination of welds (recalled) | Butt welds | Socket welds | Fillet welds | Shop | Field |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Normal | 58 | visual, and 5 % random radiography of girth butt welds | 905 | 0 | 3 | 780 | 128 |
| Category D | 4 | visual | 46 | 0 | 8 | 50 | 4 |

Lines by what they are: 24 of the flowsheet (9 of them as far as a control station), 11 parts after a control station (6 in another class than the line ahead: a specification break), 12 connections of installed spares, 0 branch root connections, 9 utility connections and 6 utility headers.

| Component | Count | Registered as | Material labels (recalled) | Fitting numbers in use |
| --- | --- | --- | --- | --- |
| pipe | 493 | its line's piping system | A335-P5; A106-B | — |
| gasket | 308 | not registered | compressed sheet (non-steel) | — |
| stud set | 285 | not registered | A193-B7 studs, A194-2H nuts | — |
| elbow | 279 | category A | A234-WP5; A234-WPB | 8 |
| flange | 268 | category B | A182-F5; A105 | 8 |
| gate valve | 90 | category C | A217-C5; A216-WCB | 9 |
| reducer | 38 | category A | A234-WP5; A234-WPB | 7 |
| tee | 21 | category A | A234-WPB; A234-WP5 | 7 |
| spade | 18 | category B | A105; A182-F5 | 6 |
| globe valve | 18 | category C | A216-WCB | 3 |
| control valve | 11 | category C | A217-C5; A216-WCB | 5 |
| check valve | 10 | category C | A216-WCB; A217-C5 | 4 |
| cap | 6 | category A | A234-WPB | 4 |
| bfly valve | 4 | category C | A216-WCB | 1 |
| branch outlet fitting | 3 | category A | A234-WPB; A234-WP5 | 3 |
| spectacle blind | 1 | category B | A182-F5 | 1 |

## Unit 13: Naphtha hydrotreater and splitter

Piping systems: a line class in the unit, with the number its lines and their pipe carry.

| Line class | Fluid service | Severity | Piping system number | Lines | Pipe, ft | Components |
| --- | --- | --- | --- | --- | --- | --- |
| `C1200-CS-N2` | Normal | 4 | U3268.7 | 1 | 78 | 54 |
| `H150-CS-N4` | Normal | 4 | P5322.7 | 6 | 562 | 135 |
| `H300-CS-N4` | Normal | 4 | L8633.7 | 4 | 553 | 141 |
| `H600-C1-N4` | Normal | 4 | F8044.7 | 4 | 714 | 156 |
| `H600-CS-N4` | Normal | 4 | S3386.7 | 11 | 515 | 221 |
| `S1200-CS-N2` | Normal | 4 | K6780.7 | 2 | 328 | 44 |
| `H150-CS-N3` | Normal | 3 | V6227.7 | 24 | 1,312 | 799 |
| `H300-CS-N3` | Normal | 3 | K1252.7 | 14 | 991 | 501 |
| `H600-CS-N2` | Normal | 3 | Y2672.7 | 3 | 163 | 109 |
| `H600-CS-N3` | Normal | 3 | X4291.7 | 2 | 92 | 57 |
| `C300-CS-N2` | Normal | 2 | U7072.7 | 1 | 78 | 54 |
| `H150-CS-N2` | Normal | 2 | W4608.7 | 1 | 38 | 25 |
| `S300-CS-N2` | Normal | 2 | S5696.7 | 2 | 324 | 49 |
| `C150-CS-D1` | D | 1 | M2576.7 | 3 | 320 | 67 |
| `H150-CS-D1` | D | 1 | E3887.7 | 2 | 74 | 60 |
| `W150-CS-D1` | D | 1 | D3924.7 | 6 | 805 | 182 |

| Fluid service | Lines | Examination of welds (recalled) | Butt welds | Socket welds | Fillet welds | Shop | Field |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Normal | 75 | visual, and 5 % random radiography of girth butt welds | 1,197 | 0 | 4 | 1,024 | 177 |
| Category D | 11 | visual | 161 | 0 | 10 | 152 | 19 |

Lines by what they are: 39 of the flowsheet (12 of them as far as a control station), 14 parts after a control station (4 in another class than the line ahead: a specification break), 16 connections of installed spares, 2 branch root connections, 9 utility connections and 6 utility headers.

| Component | Count | Registered as | Material labels (recalled) | Fitting numbers in use |
| --- | --- | --- | --- | --- |
| pipe | 709 | its line's piping system | A106-B; A335-P11 | — |
| gasket | 454 | not registered | compressed sheet (non-steel) | — |
| elbow | 426 | category A | A234-WPB; A234-WP11 | 10 |
| stud set | 396 | not registered | A193-B7 studs, A194-2H nuts | — |
| flange | 348 | category B | A105; A182-F11 | 9 |
| gate valve | 142 | category C | A216-WCB; A217-WC6 | 9 |
| reducer | 42 | category A | A234-WPB | 7 |
| spade | 34 | category B | A105; A182-F11 | 9 |
| tee | 24 | category A | A234-WPB | 8 |
| globe valve | 19 | category C | A216-WCB | 6 |
| control valve | 14 | category C | A216-WCB; A217-WC6 | 8 |
| spectacle blind | 14 | category B | A105; A182-F11 | 7 |
| check valve | 10 | category C | A216-WCB | 5 |
| bfly valve | 10 | category C | A216-WCB | 2 |
| branch outlet fitting | 6 | category A | A234-WPB | 3 |
| cap | 6 | category A | A234-WPB | 3 |

## Unit 14: Catalytic reformer and hydrogen purification

Piping systems: a line class in the unit, with the number its lines and their pipe carry.

| Line class | Fluid service | Severity | Piping system number | Lines | Pipe, ft | Components |
| --- | --- | --- | --- | --- | --- | --- |
| `C1200-CS-N2` | Normal | 4 | T7365.7 | 4 | 453 | 144 |
| `H1200-C1-N4` | Normal | 4 | P5784.7 | 8 | 1,369 | 260 |
| `H1200-CS-N2` | Normal | 4 | B7348.7 | 2 | 347 | 59 |
| `H150-CS-N4` | Normal | 4 | X8157.7 | 13 | 1,054 | 357 |
| `H300-CS-N4` | Normal | 4 | B1850.7 | 15 | 1,288 | 473 |
| `H600-C1-N4` | Normal | 4 | T9247.7 | 2 | 70 | 41 |
| `H600-CS-N4` | Normal | 4 | X4785.7 | 20 | 946 | 478 |
| `S1200-CS-N2` | Normal | 4 | T4501.7 | 4 | 471 | 95 |
| `H150-CS-N3` | Normal | 3 | W5824.7 | 7 | 299 | 256 |
| `H300-CS-N3` | Normal | 3 | X2755.7 | 8 | 839 | 308 |
| `H600-CS-N3` | Normal | 3 | F6404.7 | 2 | 76 | 63 |
| `S150-CS-N2` | Normal | 2 | K6192.7 | 2 | 352 | 46 |
| `C150-CS-D1` | D | 1 | V6951.7 | 2 | 323 | 43 |
| `W150-CS-D1` | D | 1 | E4811.7 | 10 | 1,095 | 332 |

| Fluid service | Lines | Examination of welds (recalled) | Butt welds | Socket welds | Fillet welds | Shop | Field |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Normal | 87 | visual, and 5 % random radiography of girth butt welds | 1,357 | 0 | 1 | 1,146 | 212 |
| Category D | 12 | visual | 193 | 0 | 20 | 194 | 19 |

Lines by what they are: 41 of the flowsheet (13 of them as far as a control station), 15 parts after a control station (2 in another class than the line ahead: a specification break), 17 connections of installed spares, 2 branch root connections, 17 utility connections and 7 utility headers.

| Component | Count | Registered as | Material labels (recalled) | Fitting numbers in use |
| --- | --- | --- | --- | --- |
| pipe | 830 | its line's piping system | A106-B; A335-P11 | — |
| gasket | 494 | not registered | compressed sheet (non-steel) | — |
| elbow | 486 | category A | A234-WPB; A234-WP11 | 12 |
| stud set | 432 | not registered | A193-B7 studs, A194-2H nuts | — |
| flange | 373 | category B | A105; A182-F11 | 10 |
| gate valve | 154 | category C | A216-WCB; A217-WC6 | 10 |
| tee | 33 | category A | A234-WPB; A234-WP11 | 9 |
| reducer | 32 | category A | A234-WPB | 7 |
| spade | 31 | category B | A105; A182-F11 | 9 |
| globe valve | 28 | category C | A216-WCB | 4 |
| bfly valve | 18 | category C | A216-WCB | 3 |
| control valve | 15 | category C | A216-WCB; A217-WC6 | 8 |
| spectacle blind | 13 | category B | A105; A182-F11 | 8 |
| cap | 7 | category A | A234-WPB | 3 |
| branch outlet fitting | 5 | category A | A234-WPB | 3 |
| check valve | 4 | category C | A216-WCB | 2 |

## Unit 15: Kerosene hydrotreater

Piping systems: a line class in the unit, with the number its lines and their pipe carry.

| Line class | Fluid service | Severity | Piping system number | Lines | Pipe, ft | Components |
| --- | --- | --- | --- | --- | --- | --- |
| `H150-CS-N4` | Normal | 4 | M5528.7 | 6 | 669 | 193 |
| `H600-C1-N4` | Normal | 4 | P8610.7 | 5 | 676 | 180 |
| `H600-CS-N4` | Normal | 4 | B7972.7 | 9 | 504 | 208 |
| `H150-CS-N3` | Normal | 3 | N7861.7 | 15 | 704 | 463 |
| `H300-CS-N3` | Normal | 3 | P1434.7 | 9 | 560 | 316 |
| `H600-CS-N2` | Normal | 3 | U4734.7 | 6 | 188 | 169 |
| `H600-CS-N3` | Normal | 3 | T6353.7 | 2 | 88 | 61 |
| `H150-CS-N2` | Normal | 2 | P6242.7 | 3 | 77 | 79 |
| `S300-CS-N2` | Normal | 2 | M1410.7 | 2 | 239 | 42 |
| `H150-CS-D1` | D | 1 | C2409.7 | 2 | 92 | 58 |
| `W150-CS-D1` | D | 1 | M1266.7 | 6 | 680 | 181 |

| Fluid service | Lines | Examination of welds (recalled) | Butt welds | Socket welds | Fillet welds | Shop | Field |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Normal | 57 | visual, and 5 % random radiography of girth butt welds | 870 | 0 | 2 | 741 | 131 |
| Category D | 8 | visual | 122 | 0 | 13 | 122 | 13 |

Lines by what they are: 32 of the flowsheet (8 of them as far as a control station), 8 parts after a control station (4 in another class than the line ahead: a specification break), 12 connections of installed spares, 3 branch root connections, 6 utility connections and 4 utility headers.

| Component | Count | Registered as | Material labels (recalled) | Fitting numbers in use |
| --- | --- | --- | --- | --- |
| pipe | 512 | its line's piping system | A106-B; A335-P11 | — |
| gasket | 338 | not registered | compressed sheet (non-steel) | — |
| elbow | 311 | category A | A234-WPB; A234-WP11 | 9 |
| stud set | 290 | not registered | A193-B7 studs, A194-2H nuts | — |
| flange | 255 | category B | A105; A182-F11 | 7 |
| gate valve | 108 | category C | A216-WCB; A217-WC6 | 6 |
| reducer | 36 | category A | A234-WPB; A234-WP11 | 7 |
| spade | 30 | category B | A105; A182-F11 | 5 |
| tee | 20 | category A | A234-WPB | 7 |
| check valve | 10 | category C | A216-WCB | 4 |
| bfly valve | 10 | category C | A216-WCB | 2 |
| control valve | 8 | category C | A216-WCB; A217-WC6 | 6 |
| spectacle blind | 8 | category B | A105; A182-F11 | 4 |
| globe valve | 7 | category C | A216-WCB | 3 |
| cap | 4 | category A | A234-WPB | 2 |
| branch outlet fitting | 3 | category A | A234-WPB | 2 |

## Unit 16: Diesel hydrotreater

Piping systems: a line class in the unit, with the number its lines and their pipe carry.

| Line class | Fluid service | Severity | Piping system number | Lines | Pipe, ft | Components |
| --- | --- | --- | --- | --- | --- | --- |
| `H1200-C1-N4` | Normal | 4 | D4394.7 | 5 | 912 | 189 |
| `H1200-CS-N2` | Normal | 4 | B2126.7 | 9 | 592 | 287 |
| `H1200-CS-N3` | Normal | 4 | A3745.7 | 2 | 290 | 68 |
| `H1200-CS-N4` | Normal | 4 | U5364.7 | 14 | 935 | 317 |
| `H150-CS-N4` | Normal | 4 | N1971.7 | 7 | 917 | 182 |
| `H300-CS-N4` | Normal | 4 | P4988.7 | 1 | 157 | 56 |
| `H600-CS-N4` | Normal | 4 | L3907.7 | 2 | 126 | 47 |
| `H150-CS-N3` | Normal | 3 | H1066.7 | 16 | 1,057 | 538 |
| `H300-CS-N3` | Normal | 3 | R3369.7 | 14 | 1,413 | 532 |
| `H600-CS-N2` | Normal | 3 | E4621.7 | 2 | 78 | 60 |
| `H150-CS-N2` | Normal | 2 | G2685.7 | 5 | 250 | 158 |
| `S300-CS-N2` | Normal | 2 | J4265.7 | 2 | 338 | 47 |
| `H150-CS-D1` | D | 1 | D9042.7 | 2 | 75 | 60 |
| `W150-CS-D1` | D | 1 | C5217.7 | 4 | 739 | 112 |

| Fluid service | Lines | Examination of welds (recalled) | Butt welds | Socket welds | Fillet welds | Shop | Field |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Normal | 79 | visual, and 5 % random radiography of girth butt welds | 1,308 | 0 | 4 | 1,123 | 189 |
| Category D | 6 | visual | 92 | 0 | 8 | 92 | 8 |

Lines by what they are: 43 of the flowsheet (13 of them as far as a control station), 13 parts after a control station (5 in another class than the line ahead: a specification break), 16 connections of installed spares, 5 branch root connections, 4 utility connections and 4 utility headers.

| Component | Count | Registered as | Material labels (recalled) | Fitting numbers in use |
| --- | --- | --- | --- | --- |
| pipe | 737 | its line's piping system | A106-B; A335-P11 | — |
| elbow | 440 | category A | A234-WPB; A234-WP11 | 11 |
| gasket | 435 | not registered | compressed sheet (non-steel) | — |
| stud set | 392 | not registered | A193-B7 studs, A194-2H nuts | — |
| flange | 341 | category B | A105; A182-F11 | 9 |
| gate valve | 154 | category C | A216-WCB; A217-WC6 | 9 |
| reducer | 50 | category A | A234-WPB; A234-WP11 | 7 |
| spade | 28 | category B | A105; A182-F11 | 6 |
| tee | 23 | category A | A234-WPB | 7 |
| control valve | 13 | category C | A216-WCB; A217-WC6 | 5 |
| check valve | 12 | category C | A216-WCB | 4 |
| spectacle blind | 9 | category B | A105; A182-F11 | 5 |
| bfly valve | 6 | category C | A216-WCB | 1 |
| globe valve | 5 | category C | A216-WCB | 2 |
| branch outlet fitting | 4 | category A | A234-WPB | 2 |
| cap | 4 | category A | A234-WPB | 2 |

## Unit 17: Fluid catalytic cracker and gas concentration

Piping systems: a line class in the unit, with the number its lines and their pipe carry.

| Line class | Fluid service | Severity | Piping system number | Lines | Pipe, ft | Components |
| --- | --- | --- | --- | --- | --- | --- |
| `C1200-CS-N2` | Normal | 4 | Y1120.7 | 4 | 581 | 149 |
| `H150-CS-N4` | Normal | 4 | P6766.7 | 16 | 1,494 | 445 |
| `H300-C5-N4` | Normal | 4 | L4991.7 | 1 | 126 | 17 |
| `H300-CS-N4` | Normal | 4 | C1949.7 | 38 | 4,761 | 1,239 |
| `H600-CS-N4` | Normal | 4 | H6022.7 | 4 | 415 | 160 |
| `S1200-CS-N2` | Normal | 4 | F7800.7 | 3 | 533 | 78 |
| `H150-C5-N3` | Normal | 3 | T1417.7 | 2 | 78 | 54 |
| `H150-CS-N3` | Normal | 3 | L2623.7 | 33 | 2,151 | 1,126 |
| `H300-C5-N3` | Normal | 3 | F9134.7 | 4 | 249 | 131 |
| `H300-CS-N3` | Normal | 3 | K8616.7 | 33 | 4,336 | 1,148 |
| `H600-C5-N3` | Normal | 3 | E7017.7 | 3 | 197 | 98 |
| `H600-CS-N2` | Normal | 3 | F9260.7 | 7 | 873 | 310 |
| `H600-CS-N3` | Normal | 3 | E1879.7 | 18 | 1,295 | 681 |
| `C300-CS-N2` | Normal | 2 | H8076.7 | 2 | 135 | 84 |
| `H150-CS-N2` | Normal | 2 | M1004.7 | 14 | 1,508 | 397 |
| `H300-CS-N2` | Normal | 2 | J1235.7 | 7 | 721 | 221 |
| `S300-CS-N2` | Normal | 2 | P1108.7 | 6 | 700 | 159 |
| `W300-CS-N2` | Normal | 2 | F7600.7 | 2 | 466 | 78 |
| `C150-CS-D1` | D | 1 | P4916.7 | 2 | 445 | 49 |
| `G150-CS-D1` | D | 1 | S9392.7 | 3 | 506 | 92 |
| `H150-CS-D1` | D | 1 | C2475.7 | 1 | 269 | 37 |
| `W150-CS-D1` | D | 1 | Y9704.7 | 19 | 2,048 | 625 |

| Fluid service | Lines | Examination of welds (recalled) | Butt welds | Socket welds | Fillet welds | Shop | Field |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Normal | 197 | visual, and 5 % random radiography of girth butt welds | 3,491 | 0 | 6 | 3,023 | 474 |
| Category D | 25 | visual | 423 | 0 | 30 | 409 | 44 |

Lines by what they are: 101 of the flowsheet (31 of them as far as a control station), 39 parts after a control station (18 in another class than the line ahead: a specification break), 32 connections of installed spares, 8 branch root connections, 32 utility connections and 10 utility headers.

| Component | Count | Registered as | Material labels (recalled) | Fitting numbers in use |
| --- | --- | --- | --- | --- |
| pipe | 2,079 | its line's piping system | A106-B; A335-P5 | — |
| elbow | 1,222 | category A | A234-WPB; A234-WP5 | 11 |
| gasket | 1,219 | not registered | compressed sheet (non-steel) | — |
| stud set | 1,064 | not registered | A193-B7 studs, A194-2H nuts | — |
| flange | 943 | category B | A105; A182-F5 | 9 |
| gate valve | 373 | category C | A216-WCB; A217-C5 | 10 |
| reducer | 122 | category A | A234-WPB; A234-WP5 | 10 |
| spade | 88 | category B | A105; A182-F5 | 10 |
| tee | 57 | category A | A234-WPB; A234-WP5 | 9 |
| globe valve | 46 | category C | A216-WCB | 7 |
| bfly valve | 40 | category C | A216-WCB | 4 |
| control valve | 39 | category C | A216-WCB | 9 |
| check valve | 29 | category C | A216-WCB; A217-C5 | 6 |
| spectacle blind | 27 | category B | A105; A182-F5 | 6 |
| branch outlet fitting | 20 | category A | A234-WPB | 6 |
| cap | 10 | category A | A234-WPB | 8 |

## Unit 18: Sulfur block

Piping systems: a line class in the unit, with the number its lines and their pipe carry.

| Line class | Fluid service | Severity | Piping system number | Lines | Pipe, ft | Components |
| --- | --- | --- | --- | --- | --- | --- |
| `H150-CS-M5` | M | 5 | G2165.7 | 10 | 1,840 | 354 |
| `H150-SS-M5` | M | 5 | A4669.7 | 10 | 954 | 366 |
| `C1200-CS-N2` | Normal | 4 | J8761.7 | 8 | 650 | 345 |
| `H150-CS-N4` | Normal | 4 | T1785.7 | 4 | 774 | 130 |
| `S1200-CS-N2` | Normal | 4 | C7161.7 | 4 | 522 | 96 |
| `H150-CS-N3` | Normal | 3 | B3404.7 | 5 | 220 | 167 |
| `H600-CS-N2` | Normal | 3 | J4147.7 | 9 | 904 | 318 |
| `C300-CS-N2` | Normal | 2 | G9443.7 | 3 | 184 | 89 |
| `H150-CS-N2` | Normal | 2 | A5023.7 | 47 | 2,461 | 1,496 |
| `H150-SS-N2` | Normal | 2 | X7527.7 | 5 | 191 | 164 |
| `H300-CS-N2` | Normal | 2 | Y4348.7 | 8 | 783 | 330 |
| `S150-CS-N2` | Normal | 2 | B3988.7 | 7 | 690 | 176 |
| `C150-CS-D1` | D | 1 | C3739.7 | 9 | 919 | 311 |
| `H150-CS-D1` | D | 1 | K4428.7 | 6 | 487 | 204 |
| `W150-CS-D1` | D | 1 | A3439.7 | 4 | 798 | 109 |

| Fluid service | Lines | Examination of welds (recalled) | Butt welds | Socket welds | Fillet welds | Shop | Field |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Category M | 20 | visual, 20 % random radiography of girth butt welds, and a sensitive leak test | 380 | 0 | 0 | 321 | 59 |
| Normal | 100 | visual, and 5 % random radiography of girth butt welds | 1,610 | 0 | 7 | 1,392 | 225 |
| Category D | 19 | visual | 306 | 0 | 8 | 273 | 41 |

Lines by what they are: 59 of the flowsheet (22 of them as far as a control station), 31 parts after a control station (4 in another class than the line ahead: a specification break), 20 connections of installed spares, 1 branch root connections, 21 utility connections and 7 utility headers.

| Component | Count | Registered as | Material labels (recalled) | Fitting numbers in use |
| --- | --- | --- | --- | --- |
| pipe | 1,192 | its line's piping system | A106-B; A312-TP316L | — |
| gasket | 827 | not registered | compressed sheet (non-steel) | — |
| stud set | 736 | not registered | A193-B7 studs, A194-2H nuts | — |
| elbow | 692 | category A | A234-WPB; A403-WP316L | 10 |
| flange | 632 | category B | A105; A182-F316L | 9 |
| gate valve | 239 | category C | A216-WCB; A351-CF8M | 8 |
| reducer | 84 | category A | A234-WPB; A403-WP316L | 8 |
| spade | 63 | category B | A105; A182-F316L | 6 |
| globe valve | 60 | category C | A216-WCB | 6 |
| tee | 36 | category A | A234-WPB; A403-WP316L | 8 |
| control valve | 31 | category C | A216-WCB; A351-CF8M | 8 |
| check valve | 21 | category C | A216-WCB; A351-CF8M | 5 |
| spectacle blind | 18 | category B | A105; A182-F316L | 3 |
| bfly valve | 10 | category C | A216-WCB | 2 |
| branch outlet fitting | 7 | category A | A234-WPB | 4 |
| cap | 7 | category A | A234-WPB | 3 |

## Unit 19: Utilities

Piping systems: a line class in the unit, with the number its lines and their pipe carry.

| Line class | Fluid service | Severity | Piping system number | Lines | Pipe, ft | Components |
| --- | --- | --- | --- | --- | --- | --- |
| `H1200-CS-N2` | Normal | 4 | V2571.7 | 17 | 1,061 | 504 |
| `H150-CS-N4` | Normal | 4 | D8084.7 | 14 | 1,757 | 548 |
| `H150-CS-N3` | Normal | 3 | V6465.7 | 7 | 558 | 254 |
| `H600-CS-N2` | Normal | 3 | H2538.7 | 2 | 255 | 64 |
| `H150-CS-N2` | Normal | 2 | W4846.7 | 7 | 634 | 202 |
| `H300-CS-N2` | Normal | 2 | G1185.7 | 19 | 1,849 | 444 |
| `S150-CS-N2` | Normal | 2 | E4901.7 | 2 | 463 | 47 |
| `H150-CS-D1` | D | 1 | C1013.7 | 36 | 3,185 | 1,097 |

| Fluid service | Lines | Examination of welds (recalled) | Butt welds | Socket welds | Fillet welds | Shop | Field |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Normal | 68 | visual, and 5 % random radiography of girth butt welds | 1,076 | 0 | 4 | 916 | 164 |
| Category D | 36 | visual | 577 | 0 | 0 | 484 | 93 |

Lines by what they are: 48 of the flowsheet (16 of them as far as a control station), 16 parts after a control station (2 in another class than the line ahead: a specification break), 28 connections of installed spares, 10 branch root connections, 1 utility connections and 1 utility headers.

| Component | Count | Registered as | Material labels (recalled) | Fitting numbers in use |
| --- | --- | --- | --- | --- |
| pipe | 897 | its line's piping system | A106-B | — |
| gasket | 520 | not registered | compressed sheet (non-steel) | — |
| elbow | 475 | category A | A234-WPB | 10 |
| stud set | 472 | not registered | A193-B7 studs, A194-2H nuts | — |
| flange | 420 | category B | A105 | 9 |
| gate valve | 190 | category C | A216-WCB | 10 |
| reducer | 60 | category A | A234-WPB | 8 |
| tee | 37 | category A | A234-WPB | 8 |
| spectacle blind | 28 | category B | A105 | 4 |
| check valve | 17 | category C | A216-WCB | 6 |
| control valve | 16 | category C | A216-WCB | 6 |
| spade | 14 | category B | A105 | 3 |
| bfly valve | 6 | category C | A216-WCB | 4 |
| branch outlet fitting | 4 | category A | A234-WPB | 3 |
| globe valve | 3 | category C | A216-WCB | 1 |
| cap | 1 | category A | A234-WPB | 1 |

## Area 10: Main pipeway

Piping systems: a line class in the unit, with the number its lines and their pipe carry.

| Line class | Fluid service | Severity | Piping system number | Lines | Pipe, ft | Components |
| --- | --- | --- | --- | --- | --- | --- |
| `C1200-CS-N2` | Normal | 4 | V2873.7 | 1 | 1,117 | 36 |
| `H1200-CS-N2` | Normal | 4 | Y8392.7 | 11 | 572 | 151 |
| `H150-CS-N4` | Normal | 4 | N7585.7 | 18 | 4,047 | 335 |
| `H300-CS-N4` | Normal | 4 | H6510.7 | 5 | 1,522 | 104 |
| `H600-CS-N4` | Normal | 4 | N6685.7 | 3 | 884 | 62 |
| `S1200-CS-N2` | Normal | 4 | G7841.7 | 1 | 1,114 | 36 |
| `H150-CS-N3` | Normal | 3 | W9204.7 | 54 | 16,503 | 1,036 |
| `H300-C5-N3` | Normal | 3 | A1441.7 | 1 | 314 | 25 |
| `H300-CS-N3` | Normal | 3 | N2367.7 | 2 | 625 | 46 |
| `H600-C5-N3` | Normal | 3 | W6958.7 | 1 | 306 | 27 |
| `H600-CS-N2` | Normal | 3 | L5971.7 | 5 | 1,569 | 112 |
| `H150-CS-N2` | Normal | 2 | V1823.7 | 16 | 2,836 | 267 |
| `H300-CS-N2` | Normal | 2 | P9748.7 | 10 | 647 | 151 |
| `S300-CS-N2` | Normal | 2 | N6355.7 | 1 | 1,114 | 36 |
| `W300-CS-N2` | Normal | 2 | C7967.7 | 1 | 1,117 | 33 |
| `C150-CS-D1` | D | 1 | E6843.7 | 1 | 1,115 | 38 |
| `G150-CS-D1` | D | 1 | R7503.7 | 1 | 1,117 | 35 |
| `H150-CS-D1` | D | 1 | H5316.7 | 13 | 1,542 | 213 |

| Fluid service | Lines | Examination of welds (recalled) | Butt welds | Socket welds | Fillet welds | Shop | Field |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Normal | 130 | visual, and 5 % random radiography of girth butt welds | 1,904 | 0 | 21 | 1,678 | 247 |
| Category D | 15 | visual | 246 | 0 | 0 | 219 | 27 |

Lines by what they are: 45 lines of streams between units, 65 branches to the further parties of streams that have more than two, and 26 valves with their blinds beyond the limit spools (SW-PWY-3, SW-PWY-4). Each stream's line is of the material of the unit lines it joins.

| Component | Count | Registered as | Material labels (recalled) | Fitting numbers in use |
| --- | --- | --- | --- | --- |
| pipe | 1,502 | its line's piping system | A106-B; A335-P5 | — |
| elbow | 461 | category A | A234-WPB; A234-WP5 | 11 |
| gasket | 207 | not registered | compressed sheet (non-steel) | — |
| flange | 207 | category B | A105; A182-F5 | 10 |
| stud set | 207 | not registered | A193-B7 studs, A194-2H nuts | — |
| tee | 44 | category A | A234-WPB | 8 |
| gate valve | 26 | category C | A216-WCB | 5 |
| blind flange | 26 | category B | A105 | 5 |
| reducer | 24 | category A | A234-WPB | 7 |
| branch outlet fitting | 21 | category A | A234-WPB | 6 |
| cap | 18 | category A | A234-WPB | 7 |

## Files

| File | Content |
| --- | --- |
| `public/refinery/registry/piping/unit-NN.json` | a piped unit's register: every line record, every component record, its piping systems and its welds by fluid service |

