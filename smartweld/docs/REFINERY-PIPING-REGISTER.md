# Plant 3: piping registers of the piped units

> **DEMONSTRATION DATA — not a registration.** Written by `tools/refinery-piping-register.ts` from `src/refinery/pipingRegister.ts` and the generated models in `public/refinery/piping/`; do not edit by hand.

For every unit that is piped, every line the generator built and every component of it has a record (DESIGN_BASIS.md §76, SW-REG-9): the line's fluid service, line class and severity; each component's material label and registration. A piece of pipe carries its line's piping system number; a fitting, flange, line blank or valve carries its maker's number in its category; studs and gaskets carry none and are listed so that each joint is whole.

What is whose: sizes, classes, counts, lengths and line classes are the model's own. Fluid service, examination, leak test, material labels and what is registered in which category are **recalled** from general knowledge of the codes, for the owner to verify. Every maker and every registration number is **invented**: issued by no one, looked up nowhere.

## The units

| Unit | Name | Lines | Pipe, ft | Components | Pipe pieces | Fittings (A) | Flanges and blanks (B) | Valves (C) | Studs and gaskets | Fitting numbers in use | Welds |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | Crude distillation | 134 | 12,739 | 4,461 | 1,257 | 947 | 602 | 301 | 1,354 | 27 | 2,459 |
| 12 | Vacuum distillation | 60 | 4,398 | 1,705 | 459 | 347 | 249 | 117 | 533 | 25 | 914 |
| 13 | Naphtha hydrotreater and splitter | 84 | 6,790 | 2,510 | 674 | 503 | 358 | 179 | 796 | 34 | 1,322 |
| 14 | Catalytic reformer and hydrogen purification | 97 | 8,846 | 2,813 | 794 | 565 | 376 | 202 | 876 | 36 | 1,522 |
| 15 | Kerosene hydrotreater | 65 | 4,421 | 1,918 | 499 | 377 | 281 | 139 | 622 | 25 | 993 |
| 16 | Diesel hydrotreater | 85 | 7,822 | 2,619 | 725 | 525 | 366 | 186 | 817 | 34 | 1,400 |
| 18 | Sulfur block | 130 | 11,778 | 4,162 | 1,084 | 802 | 602 | 309 | 1,365 | 30 | 2,136 |
| 19 | Utilities | 104 | 9,760 | 3,158 | 896 | 578 | 459 | 231 | 994 | 33 | 1,656 |
| 10 | Main pipeway | 109 | 25,751 | 1,928 | 973 | 283 | 238 | 42 | 392 | 22 | 1,323 |
|  | **all** | 868 | 92,305 | 25,274 | 7,361 | 4,927 | 3,531 | 1,706 | 7,749 | 36 | 13,725 |

Categories as recalled (SW-REG-6): A pipe fittings; B flanges; C line valves. Line blanks (spades and spectacle blinds) are counted with the flanges they are clamped between.

## Unit 11: Crude distillation

Piping systems: a line class in the unit, with the number its lines and their pipe carry.

| Line class | Fluid service | Severity | Piping system number | Lines | Pipe, ft | Components |
| --- | --- | --- | --- | --- | --- | --- |
| `H150-C5-N4` | Normal | 4 | W9246.7 | 1 | 179 | 35 |
| `H150-CS-N4` | Normal | 4 | M2860.7 | 15 | 1,879 | 369 |
| `H300-C5-N4` | Normal | 4 | V9269.7 | 1 | 313 | 24 |
| `H150-C5-N3` | Normal | 3 | T5103.7 | 8 | 678 | 294 |
| `H150-CS-N3` | Normal | 3 | E1241.7 | 34 | 2,844 | 1,118 |
| `H300-C5-N3` | Normal | 3 | D6936.7 | 7 | 538 | 245 |
| `H300-CS-N3` | Normal | 3 | F7478.7 | 26 | 2,624 | 1,064 |
| `H600-C5-N3` | Normal | 3 | V7627.7 | 1 | 172 | 42 |
| `H600-CS-N3` | Normal | 3 | X3461.7 | 15 | 976 | 513 |
| `C300-CS-N2` | Normal | 2 | S9622.7 | 2 | 348 | 42 |
| `H150-CS-N2` | Normal | 2 | F8622.7 | 5 | 368 | 175 |
| `H300-CS-N2` | Normal | 2 | E9097.7 | 3 | 146 | 77 |
| `H150-CS-D1` | D | 1 | N1389.7 | 2 | 77 | 58 |
| `S150-CS-D1` | D | 1 | K8946.7 | 6 | 593 | 152 |
| `W150-CS-D1` | D | 1 | K6134.7 | 8 | 1,005 | 253 |

| Fluid service | Lines | Examination of welds (recalled) | Butt welds | Socket welds | Fillet welds | Shop | Field |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Normal | 118 | visual, and 5 % random radiography of girth butt welds | 2,189 | 0 | 1 | 1,881 | 309 |
| Category D | 16 | visual | 248 | 0 | 21 | 240 | 29 |

Lines by what they are: 66 of the flowsheet (16 of them as far as a control station), 16 parts after a control station (9 in another class than the line ahead: a specification break), 34 connections of installed spares, 0 branch root connections, 13 utility connections and 5 utility headers.

| Component | Count | Registered as | Material labels (recalled) | Fitting numbers in use |
| --- | --- | --- | --- | --- |
| pipe | 1,257 | its line's piping system | A106-B; A335-P5 | — |
| elbow | 809 | category A | A234-WPB; A234-WP5 | 8 |
| gasket | 720 | not registered | compressed sheet (non-steel) | — |
| stud set | 634 | not registered | A193-B7 studs, A194-2H nuts | — |
| flange | 516 | category B | A105; A182-F5 | 7 |
| gate valve | 227 | category C | A216-WCB; A217-C5 | 8 |
| reducer | 80 | category A | A234-WPB; A234-WP5 | 7 |
| spade | 80 | category B | A105; A182-F5 | 8 |
| tee | 42 | category A | A234-WPB; A234-WP5 | 7 |
| check valve | 28 | category C | A216-WCB; A217-C5 | 6 |
| globe valve | 18 | category C | A216-WCB | 4 |
| control valve | 16 | category C | A216-WCB; A217-C5 | 7 |
| bfly valve | 12 | category C | A216-WCB | 2 |
| cap | 10 | category A | A234-WPB | 3 |
| spectacle blind | 6 | category B | A105; A182-F5 | 3 |
| branch outlet fitting | 6 | category A | A234-WPB | 3 |

## Unit 12: Vacuum distillation

Piping systems: a line class in the unit, with the number its lines and their pipe carry.

| Line class | Fluid service | Severity | Piping system number | Lines | Pipe, ft | Components |
| --- | --- | --- | --- | --- | --- | --- |
| `H150-CS-N4` | Normal | 4 | A2743.7 | 5 | 521 | 83 |
| `H300-C5-N4` | Normal | 4 | H3274.7 | 1 | 191 | 39 |
| `H150-CS-N3` | Normal | 3 | D6886.7 | 15 | 1,079 | 444 |
| `H300-C5-N3` | Normal | 3 | E4179.7 | 4 | 300 | 148 |
| `H300-CS-N3` | Normal | 3 | E6701.7 | 12 | 525 | 440 |
| `H600-C5-N3` | Normal | 3 | U3264.7 | 4 | 160 | 122 |
| `C300-CS-N2` | Normal | 2 | V8421.7 | 3 | 291 | 71 |
| `H150-CS-N2` | Normal | 2 | C8505.7 | 4 | 181 | 90 |
| `H300-CS-N2` | Normal | 2 | F5082.7 | 2 | 130 | 87 |
| `S300-CS-N2` | Normal | 2 | E9413.7 | 4 | 371 | 83 |
| `S150-CS-D1` | D | 1 | A9009.7 | 2 | 180 | 36 |
| `W150-CS-D1` | D | 1 | T8349.7 | 4 | 467 | 62 |

| Fluid service | Lines | Examination of welds (recalled) | Butt welds | Socket welds | Fillet welds | Shop | Field |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Normal | 54 | visual, and 5 % random radiography of girth butt welds | 839 | 0 | 3 | 721 | 121 |
| Category D | 6 | visual | 64 | 0 | 8 | 65 | 7 |

Lines by what they are: 24 of the flowsheet (9 of them as far as a control station), 9 parts after a control station (6 in another class than the line ahead: a specification break), 12 connections of installed spares, 0 branch root connections, 9 utility connections and 6 utility headers.

| Component | Count | Registered as | Material labels (recalled) | Fitting numbers in use |
| --- | --- | --- | --- | --- |
| pipe | 459 | its line's piping system | A335-P5; A106-B | — |
| gasket | 276 | not registered | compressed sheet (non-steel) | — |
| elbow | 273 | category A | A234-WP5; A234-WPB | 6 |
| stud set | 257 | not registered | A193-B7 studs, A194-2H nuts | — |
| flange | 230 | category B | A182-F5; A105 | 7 |
| gate valve | 85 | category C | A217-C5; A216-WCB | 8 |
| reducer | 38 | category A | A234-WP5; A234-WPB | 7 |
| tee | 21 | category A | A234-WPB; A234-WP5 | 6 |
| spade | 18 | category B | A105; A182-F5 | 6 |
| cap | 12 | category A | A234-WPB | 3 |
| globe valve | 11 | category C | A216-WCB | 2 |
| check valve | 10 | category C | A216-WCB; A217-C5 | 4 |
| control valve | 9 | category C | A217-C5; A216-WCB | 4 |
| branch outlet fitting | 3 | category A | A234-WPB; A234-WP5 | 2 |
| bfly valve | 2 | category C | A216-WCB | 1 |
| spectacle blind | 1 | category B | A182-F5 | 1 |

## Unit 13: Naphtha hydrotreater and splitter

Piping systems: a line class in the unit, with the number its lines and their pipe carry.

| Line class | Fluid service | Severity | Piping system number | Lines | Pipe, ft | Components |
| --- | --- | --- | --- | --- | --- | --- |
| `C1200-CS-N2` | Normal | 4 | U3268.7 | 2 | 317 | 42 |
| `H150-CS-N4` | Normal | 4 | P5322.7 | 6 | 544 | 125 |
| `H300-CS-N4` | Normal | 4 | L8633.7 | 4 | 553 | 141 |
| `H600-C1-N4` | Normal | 4 | F8044.7 | 4 | 714 | 156 |
| `H600-CS-N4` | Normal | 4 | S3386.7 | 11 | 515 | 221 |
| `S1200-CS-N2` | Normal | 4 | K6780.7 | 2 | 312 | 34 |
| `H150-CS-N3` | Normal | 3 | V6227.7 | 24 | 1,310 | 797 |
| `H300-CS-N3` | Normal | 3 | K1252.7 | 14 | 991 | 501 |
| `H600-CS-N2` | Normal | 3 | Y2672.7 | 3 | 163 | 109 |
| `H600-CS-N3` | Normal | 3 | X4291.7 | 2 | 92 | 57 |
| `C300-CS-N2` | Normal | 2 | U7072.7 | 1 | 80 | 31 |
| `H150-CS-N2` | Normal | 2 | W4608.7 | 1 | 38 | 25 |
| `S300-CS-N2` | Normal | 2 | S5696.7 | 2 | 313 | 39 |
| `H150-CS-D1` | D | 1 | E3887.7 | 2 | 74 | 58 |
| `W150-CS-D1` | D | 1 | D3924.7 | 6 | 776 | 174 |

| Fluid service | Lines | Examination of welds (recalled) | Butt welds | Socket welds | Fillet welds | Shop | Field |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Normal | 76 | visual, and 5 % random radiography of girth butt welds | 1,188 | 0 | 4 | 1,013 | 179 |
| Category D | 8 | visual | 120 | 0 | 10 | 117 | 13 |

Lines by what they are: 39 of the flowsheet (12 of them as far as a control station), 12 parts after a control station (4 in another class than the line ahead: a specification break), 16 connections of installed spares, 2 branch root connections, 9 utility connections and 6 utility headers.

| Component | Count | Registered as | Material labels (recalled) | Fitting numbers in use |
| --- | --- | --- | --- | --- |
| pipe | 674 | its line's piping system | A106-B; A335-P11 | — |
| gasket | 422 | not registered | compressed sheet (non-steel) | — |
| elbow | 419 | category A | A234-WPB; A234-WP11 | 10 |
| stud set | 374 | not registered | A193-B7 studs, A194-2H nuts | — |
| flange | 310 | category B | A105; A182-F11 | 9 |
| gate valve | 137 | category C | A216-WCB; A217-WC6 | 8 |
| reducer | 42 | category A | A234-WPB | 7 |
| spade | 34 | category B | A105; A182-F11 | 9 |
| tee | 24 | category A | A234-WPB | 9 |
| spectacle blind | 14 | category B | A105; A182-F11 | 7 |
| control valve | 12 | category C | A216-WCB; A217-WC6 | 7 |
| cap | 12 | category A | A234-WPB | 4 |
| globe valve | 12 | category C | A216-WCB | 6 |
| check valve | 10 | category C | A216-WCB | 5 |
| bfly valve | 8 | category C | A216-WCB | 2 |
| branch outlet fitting | 6 | category A | A234-WPB | 3 |

## Unit 14: Catalytic reformer and hydrogen purification

Piping systems: a line class in the unit, with the number its lines and their pipe carry.

| Line class | Fluid service | Severity | Piping system number | Lines | Pipe, ft | Components |
| --- | --- | --- | --- | --- | --- | --- |
| `C1200-CS-N2` | Normal | 4 | T7365.7 | 4 | 711 | 75 |
| `H1200-C1-N4` | Normal | 4 | P5784.7 | 8 | 1,369 | 260 |
| `H1200-CS-N2` | Normal | 4 | B7348.7 | 2 | 347 | 59 |
| `H150-CS-N4` | Normal | 4 | X8157.7 | 13 | 1,037 | 347 |
| `H300-CS-N4` | Normal | 4 | B1850.7 | 15 | 1,288 | 473 |
| `H600-C1-N4` | Normal | 4 | T9247.7 | 2 | 70 | 41 |
| `H600-CS-N4` | Normal | 4 | X4785.7 | 20 | 946 | 478 |
| `S1200-CS-N2` | Normal | 4 | T4501.7 | 4 | 462 | 86 |
| `H150-CS-N3` | Normal | 3 | W5824.7 | 7 | 299 | 256 |
| `H300-CS-N3` | Normal | 3 | X2755.7 | 8 | 839 | 308 |
| `H600-CS-N3` | Normal | 3 | F6404.7 | 2 | 76 | 63 |
| `S150-CS-N2` | Normal | 2 | K6192.7 | 2 | 336 | 37 |
| `W150-CS-D1` | D | 1 | E4811.7 | 10 | 1,067 | 330 |

| Fluid service | Lines | Examination of welds (recalled) | Butt welds | Socket welds | Fillet welds | Shop | Field |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Normal | 87 | visual, and 5 % random radiography of girth butt welds | 1,337 | 0 | 1 | 1,127 | 211 |
| Category D | 10 | visual | 164 | 0 | 20 | 168 | 16 |

Lines by what they are: 41 of the flowsheet (13 of them as far as a control station), 13 parts after a control station (2 in another class than the line ahead: a specification break), 17 connections of installed spares, 2 branch root connections, 17 utility connections and 7 utility headers.

| Component | Count | Registered as | Material labels (recalled) | Fitting numbers in use |
| --- | --- | --- | --- | --- |
| pipe | 794 | its line's piping system | A106-B; A335-P11 | — |
| elbow | 481 | category A | A234-WPB; A234-WP11 | 12 |
| gasket | 460 | not registered | compressed sheet (non-steel) | — |
| stud set | 416 | not registered | A193-B7 studs, A194-2H nuts | — |
| flange | 332 | category B | A105; A182-F11 | 10 |
| gate valve | 149 | category C | A216-WCB; A217-WC6 | 10 |
| tee | 33 | category A | A234-WPB; A234-WP11 | 9 |
| reducer | 32 | category A | A234-WPB | 7 |
| spade | 31 | category B | A105; A182-F11 | 9 |
| globe valve | 20 | category C | A216-WCB | 4 |
| bfly valve | 16 | category C | A216-WCB | 2 |
| cap | 14 | category A | A234-WPB | 3 |
| control valve | 13 | category C | A216-WCB; A217-WC6 | 7 |
| spectacle blind | 13 | category B | A105; A182-F11 | 8 |
| branch outlet fitting | 5 | category A | A234-WPB | 3 |
| check valve | 4 | category C | A216-WCB | 2 |

## Unit 15: Kerosene hydrotreater

Piping systems: a line class in the unit, with the number its lines and their pipe carry.

| Line class | Fluid service | Severity | Piping system number | Lines | Pipe, ft | Components |
| --- | --- | --- | --- | --- | --- | --- |
| `H150-CS-N4` | Normal | 4 | M5528.7 | 6 | 659 | 183 |
| `H600-C1-N4` | Normal | 4 | P8610.7 | 5 | 676 | 180 |
| `H600-CS-N4` | Normal | 4 | B7972.7 | 9 | 504 | 208 |
| `H150-CS-N3` | Normal | 3 | N7861.7 | 15 | 704 | 463 |
| `H300-CS-N3` | Normal | 3 | P1434.7 | 9 | 560 | 316 |
| `H600-CS-N2` | Normal | 3 | U4734.7 | 6 | 188 | 169 |
| `H600-CS-N3` | Normal | 3 | T6353.7 | 2 | 88 | 61 |
| `H150-CS-N2` | Normal | 2 | P6242.7 | 3 | 77 | 79 |
| `S300-CS-N2` | Normal | 2 | M1410.7 | 2 | 222 | 32 |
| `H150-CS-D1` | D | 1 | C2409.7 | 2 | 93 | 56 |
| `W150-CS-D1` | D | 1 | M1266.7 | 6 | 651 | 171 |

| Fluid service | Lines | Examination of welds (recalled) | Butt welds | Socket welds | Fillet welds | Shop | Field |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Normal | 57 | visual, and 5 % random radiography of girth butt welds | 864 | 0 | 2 | 735 | 131 |
| Category D | 8 | visual | 114 | 0 | 13 | 114 | 13 |

Lines by what they are: 32 of the flowsheet (8 of them as far as a control station), 8 parts after a control station (4 in another class than the line ahead: a specification break), 12 connections of installed spares, 3 branch root connections, 6 utility connections and 4 utility headers.

| Component | Count | Registered as | Material labels (recalled) | Fitting numbers in use |
| --- | --- | --- | --- | --- |
| pipe | 499 | its line's piping system | A106-B; A335-P11 | — |
| gasket | 330 | not registered | compressed sheet (non-steel) | — |
| elbow | 310 | category A | A234-WPB; A234-WP11 | 9 |
| stud set | 292 | not registered | A193-B7 studs, A194-2H nuts | — |
| flange | 243 | category B | A105; A182-F11 | 7 |
| gate valve | 107 | category C | A216-WCB; A217-WC6 | 6 |
| reducer | 36 | category A | A234-WPB; A234-WP11 | 7 |
| spade | 30 | category B | A105; A182-F11 | 5 |
| tee | 20 | category A | A234-WPB | 7 |
| check valve | 10 | category C | A216-WCB | 4 |
| control valve | 8 | category C | A216-WCB; A217-WC6 | 6 |
| spectacle blind | 8 | category B | A105; A182-F11 | 4 |
| cap | 8 | category A | A234-WPB | 2 |
| bfly valve | 8 | category C | A216-WCB | 2 |
| globe valve | 6 | category C | A216-WCB | 3 |
| branch outlet fitting | 3 | category A | A234-WPB | 2 |

## Unit 16: Diesel hydrotreater

Piping systems: a line class in the unit, with the number its lines and their pipe carry.

| Line class | Fluid service | Severity | Piping system number | Lines | Pipe, ft | Components |
| --- | --- | --- | --- | --- | --- | --- |
| `H1200-C1-N4` | Normal | 4 | D4394.7 | 5 | 912 | 189 |
| `H1200-CS-N2` | Normal | 4 | B2126.7 | 9 | 592 | 287 |
| `H1200-CS-N3` | Normal | 4 | A3745.7 | 2 | 290 | 68 |
| `H1200-CS-N4` | Normal | 4 | U5364.7 | 14 | 935 | 317 |
| `H150-CS-N4` | Normal | 4 | N1971.7 | 7 | 900 | 172 |
| `H300-CS-N4` | Normal | 4 | P4988.7 | 1 | 157 | 56 |
| `H600-CS-N4` | Normal | 4 | L3907.7 | 2 | 126 | 47 |
| `H150-CS-N3` | Normal | 3 | H1066.7 | 16 | 1,057 | 538 |
| `H300-CS-N3` | Normal | 3 | R3369.7 | 14 | 1,413 | 532 |
| `H600-CS-N2` | Normal | 3 | E4621.7 | 2 | 78 | 60 |
| `H150-CS-N2` | Normal | 2 | G2685.7 | 5 | 250 | 158 |
| `S300-CS-N2` | Normal | 2 | J4265.7 | 2 | 329 | 37 |
| `H150-CS-D1` | D | 1 | D9042.7 | 2 | 75 | 60 |
| `W150-CS-D1` | D | 1 | C5217.7 | 4 | 710 | 98 |

| Fluid service | Lines | Examination of welds (recalled) | Butt welds | Socket welds | Fillet welds | Shop | Field |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Normal | 79 | visual, and 5 % random radiography of girth butt welds | 1,302 | 0 | 4 | 1,117 | 189 |
| Category D | 6 | visual | 86 | 0 | 8 | 86 | 8 |

Lines by what they are: 43 of the flowsheet (13 of them as far as a control station), 13 parts after a control station (5 in another class than the line ahead: a specification break), 16 connections of installed spares, 5 branch root connections, 4 utility connections and 4 utility headers.

| Component | Count | Registered as | Material labels (recalled) | Fitting numbers in use |
| --- | --- | --- | --- | --- |
| pipe | 725 | its line's piping system | A106-B; A335-P11 | — |
| elbow | 440 | category A | A234-WPB; A234-WP11 | 11 |
| gasket | 427 | not registered | compressed sheet (non-steel) | — |
| stud set | 390 | not registered | A193-B7 studs, A194-2H nuts | — |
| flange | 329 | category B | A105; A182-F11 | 9 |
| gate valve | 153 | category C | A216-WCB; A217-WC6 | 9 |
| reducer | 50 | category A | A234-WPB; A234-WP11 | 7 |
| spade | 28 | category B | A105; A182-F11 | 6 |
| tee | 23 | category A | A234-WPB | 7 |
| control valve | 13 | category C | A216-WCB; A217-WC6 | 5 |
| check valve | 12 | category C | A216-WCB | 4 |
| spectacle blind | 9 | category B | A105; A182-F11 | 5 |
| cap | 8 | category A | A234-WPB | 2 |
| branch outlet fitting | 4 | category A | A234-WPB | 2 |
| bfly valve | 4 | category C | A216-WCB | 1 |
| globe valve | 4 | category C | A216-WCB | 2 |

## Unit 18: Sulfur block

Piping systems: a line class in the unit, with the number its lines and their pipe carry.

| Line class | Fluid service | Severity | Piping system number | Lines | Pipe, ft | Components |
| --- | --- | --- | --- | --- | --- | --- |
| `H150-CS-M5` | M | 5 | G2165.7 | 10 | 1,840 | 354 |
| `H150-SS-M5` | M | 5 | A4669.7 | 10 | 954 | 366 |
| `C1200-CS-N2` | Normal | 4 | J8761.7 | 5 | 794 | 118 |
| `H150-CS-N4` | Normal | 4 | T1785.7 | 4 | 757 | 120 |
| `S1200-CS-N2` | Normal | 4 | C7161.7 | 4 | 505 | 86 |
| `H150-CS-N3` | Normal | 3 | B3404.7 | 5 | 220 | 167 |
| `H600-CS-N2` | Normal | 3 | J4147.7 | 9 | 902 | 316 |
| `C300-CS-N2` | Normal | 2 | G9443.7 | 3 | 172 | 90 |
| `H150-CS-N2` | Normal | 2 | A5023.7 | 47 | 2,462 | 1,500 |
| `H150-SS-N2` | Normal | 2 | X7527.7 | 5 | 191 | 164 |
| `H300-CS-N2` | Normal | 2 | Y4348.7 | 8 | 781 | 329 |
| `C150-CS-D1` | D | 1 | C3739.7 | 3 | 258 | 88 |
| `H150-CS-D1` | D | 1 | K4428.7 | 6 | 488 | 202 |
| `S150-CS-D1` | D | 1 | J5459.7 | 7 | 682 | 166 |
| `W150-CS-D1` | D | 1 | A3439.7 | 4 | 770 | 96 |

| Fluid service | Lines | Examination of welds (recalled) | Butt welds | Socket welds | Fillet welds | Shop | Field |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Category M | 20 | visual, 20 % random radiography of girth butt welds, and a sensitive leak test | 380 | 0 | 0 | 321 | 59 |
| Normal | 90 | visual, and 5 % random radiography of girth butt welds | 1,455 | 0 | 3 | 1,253 | 205 |
| Category D | 20 | visual | 286 | 0 | 12 | 255 | 43 |

Lines by what they are: 59 of the flowsheet (22 of them as far as a control station), 22 parts after a control station (4 in another class than the line ahead: a specification break), 20 connections of installed spares, 1 branch root connections, 21 utility connections and 7 utility headers.

| Component | Count | Registered as | Material labels (recalled) | Fitting numbers in use |
| --- | --- | --- | --- | --- |
| pipe | 1,084 | its line's piping system | A106-B; A312-TP316L | — |
| gasket | 723 | not registered | compressed sheet (non-steel) | — |
| elbow | 661 | category A | A234-WPB; A403-WP316L | 10 |
| stud set | 642 | not registered | A193-B7 studs, A194-2H nuts | — |
| flange | 521 | category B | A105; A182-F316L | 9 |
| gate valve | 220 | category C | A216-WCB; A351-CF8M | 7 |
| reducer | 84 | category A | A234-WPB; A403-WP316L | 8 |
| spade | 63 | category B | A105; A182-F316L | 6 |
| globe valve | 38 | category C | A216-WCB | 5 |
| tee | 36 | category A | A234-WPB; A403-WP316L | 9 |
| control valve | 22 | category C | A216-WCB; A351-CF8M | 7 |
| check valve | 21 | category C | A216-WCB; A351-CF8M | 5 |
| spectacle blind | 18 | category B | A105; A182-F316L | 3 |
| cap | 14 | category A | A234-WPB | 4 |
| bfly valve | 8 | category C | A216-WCB | 2 |
| branch outlet fitting | 7 | category A | A234-WPB | 4 |

## Unit 19: Utilities

Piping systems: a line class in the unit, with the number its lines and their pipe carry.

| Line class | Fluid service | Severity | Piping system number | Lines | Pipe, ft | Components |
| --- | --- | --- | --- | --- | --- | --- |
| `H1200-CS-N2` | Normal | 4 | V2571.7 | 17 | 1,061 | 504 |
| `H150-CS-N4` | Normal | 4 | D8084.7 | 14 | 1,771 | 556 |
| `H150-CS-N3` | Normal | 3 | V6465.7 | 7 | 558 | 254 |
| `H600-CS-N2` | Normal | 3 | H2538.7 | 2 | 255 | 57 |
| `H150-CS-N2` | Normal | 2 | W4846.7 | 6 | 235 | 162 |
| `H300-CS-N2` | Normal | 2 | G1185.7 | 19 | 1,849 | 445 |
| `H150-CS-D1` | D | 1 | C1013.7 | 37 | 3,584 | 1,142 |
| `S150-CS-D1` | D | 1 | U2258.7 | 2 | 447 | 38 |

| Fluid service | Lines | Examination of welds (recalled) | Butt welds | Socket welds | Fillet welds | Shop | Field |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Normal | 65 | visual, and 5 % random radiography of girth butt welds | 1,021 | 0 | 4 | 867 | 158 |
| Category D | 39 | visual | 631 | 0 | 0 | 532 | 99 |

Lines by what they are: 48 of the flowsheet (16 of them as far as a control station), 16 parts after a control station (2 in another class than the line ahead: a specification break), 28 connections of installed spares, 10 branch root connections, 1 utility connections and 1 utility headers.

| Component | Count | Registered as | Material labels (recalled) | Fitting numbers in use |
| --- | --- | --- | --- | --- |
| pipe | 896 | its line's piping system | A106-B | — |
| gasket | 518 | not registered | compressed sheet (non-steel) | — |
| stud set | 476 | not registered | A193-B7 studs, A194-2H nuts | — |
| elbow | 475 | category A | A234-WPB | 9 |
| flange | 417 | category B | A105 | 9 |
| gate valve | 190 | category C | A216-WCB | 10 |
| reducer | 60 | category A | A234-WPB | 8 |
| tee | 37 | category A | A234-WPB | 8 |
| spectacle blind | 28 | category B | A105 | 4 |
| check valve | 17 | category C | A216-WCB | 6 |
| control valve | 16 | category C | A216-WCB | 6 |
| spade | 14 | category B | A105 | 3 |
| bfly valve | 6 | category C | A216-WCB | 4 |
| branch outlet fitting | 4 | category A | A234-WPB | 3 |
| cap | 2 | category A | A234-WPB | 1 |
| globe valve | 2 | category C | A216-WCB | 1 |

## Area 10: Main pipeway

Piping systems: a line class in the unit, with the number its lines and their pipe carry.

| Line class | Fluid service | Severity | Piping system number | Lines | Pipe, ft | Components |
| --- | --- | --- | --- | --- | --- | --- |
| `H150-CS-N4` | Normal | 4 | N7585.7 | 12 | 2,512 | 202 |
| `H300-CS-N4` | Normal | 4 | H6510.7 | 8 | 1,438 | 137 |
| `H600-CS-N4` | Normal | 4 | N6685.7 | 3 | 884 | 58 |
| `H150-CS-N3` | Normal | 3 | W9204.7 | 61 | 16,504 | 1,096 |
| `H300-C5-N3` | Normal | 3 | A1441.7 | 1 | 314 | 25 |
| `H300-CS-N3` | Normal | 3 | N2367.7 | 2 | 625 | 46 |
| `H600-C5-N3` | Normal | 3 | W6958.7 | 1 | 304 | 29 |
| `H600-CS-N2` | Normal | 3 | L5971.7 | 3 | 356 | 48 |
| `H150-CS-N2` | Normal | 2 | V1823.7 | 10 | 1,424 | 154 |
| `H300-CS-N2` | Normal | 2 | P9748.7 | 2 | 235 | 29 |
| `H150-CS-D1` | D | 1 | H5316.7 | 6 | 1,154 | 104 |

| Fluid service | Lines | Examination of welds (recalled) | Butt welds | Socket welds | Fillet welds | Shop | Field |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Normal | 103 | visual, and 5 % random radiography of girth butt welds | 1,241 | 0 | 2 | 1,064 | 179 |
| Category D | 6 | visual | 80 | 0 | 0 | 67 | 13 |

Lines by what they are: 45 lines of streams between units, 22 branches to the further parties of streams that have more than two, and 42 valves with their blinds beyond the limit spools (SW-PWY-3, SW-PWY-4). Each stream's line is of the material of the unit lines it joins.

| Component | Count | Registered as | Material labels (recalled) | Fitting numbers in use |
| --- | --- | --- | --- | --- |
| pipe | 973 | its line's piping system | A106-B; A335-P5 | — |
| elbow | 250 | category A | A234-WPB; A234-WP5 | 6 |
| gasket | 196 | not registered | compressed sheet (non-steel) | — |
| flange | 196 | category B | A105; A182-F5 | 7 |
| stud set | 196 | not registered | A193-B7 studs, A194-2H nuts | — |
| gate valve | 42 | category C | A216-WCB | 6 |
| blind flange | 42 | category B | A105 | 6 |
| tee | 20 | category A | A234-WPB | 4 |
| reducer | 11 | category A | A234-WPB | 5 |
| branch outlet fitting | 2 | category A | A234-WPB | 1 |

## Files

| File | Content |
| --- | --- |
| `public/refinery/registry/piping/unit-NN.json` | a piped unit's register: every line record, every component record, its piping systems and its welds by fluid service |

