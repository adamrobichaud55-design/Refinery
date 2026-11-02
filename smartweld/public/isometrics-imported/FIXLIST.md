# Fix list FL-1: owner's isometric drawings, Rev 0 to Rev 1

Issued 2026-11-02 by the SmartWeld plant model (`tools/isomatch.py`, DESIGN_BASIS.md §53, SW-IMP-7). Generated; do not edit by hand.

**For:** The isometric generator that drew SmartWeld-plant-isometrics-27bc863.pdf (Rev 0).  
**Source data (unchanged):** the plant model's ground truth, `smartweld/public/groundtruth` at commit `c35ea3396121`, the export the set was drawn from.  
**Received Rev 0:** `2beea050-SmartWeld-plant-isometrics-27bc863-part1of3.pdf` (SHA-256 `b5d33506236dc412…`); `cc901c7a-SmartWeld-plant-isometrics-27bc863-part2of3.pdf` (SHA-256 `998e1cfac2c59d5d…`); `a3077a74-SmartWeld-plant-isometrics-27bc863-part3of3.pdf` (SHA-256 `e4fdddcec39265fb…`).

Everything else on the drawings agrees with the model: the title blocks, every bill of materials and pipe length, every sheet break, and the coverage of all 203 lines. Change only what is listed here. Fix the generator by the rules below, then regenerate, rather than editing sheets one by one. The changes by drawing are what the rules must produce, and they are the check.

## Rules for Rev 1

- **R1 Coordinates.** A negative value's minus sign applies to the whole value: format the size of the value in feet and inches, then put '-' in front. -138 in prints -11'-6" (Rev 0 printed -12'-6", which a reader takes as -150 in); -6 in prints -6". This applies wherever a coordinate is printed (continuation blocks and end points).
- **R2 Weld labels.** Label every weld exactly once, on the sheet that holds its position: the sheet whose two breaks (CONT'D ON / FROM points) bracket the weld's distance along the line. Never leave a weld dot without its label because of crowding; move the label or lengthen its leader instead. A weld close to a break is labelled only on its own sheet.
- **R3 Branch welds.** A weld of a vent, drain, instrument or sample tap drawn on its parent line's sheets is labelled with its model tag's form {service}-{sequence}/W{n}: I-7001/W1 for the weld 3/4"-P300-I-7001/W1. Rev 0 continued the parent's numbering (W29, W30, ...), and those numbers do not exist in the model.
- **R4 FROM / TO labels.** Print a FROM label at the start and a TO label at the end of every line whose end is an equipment nozzle ('TO P-101A NOZ. S'), a relief valve ('TO PSV', 'FROM PSV ON D-101 NOZ. N3') or a hose station ('TO HOSE STATION'). A tap end is shown by its CONT'D block, and a cap or blind by its symbol.
- **R5 Revision.** Issue the corrected set as revision 1 of the same drawing numbers and sheet split: REV 1 in every title block and a revision row '1 <date> REVISED TO MATCH THE MODEL (FL-1)'. Change nothing else: the bills, pipe lengths, sheet breaks, title blocks and coverage already agree with the model.

## Acceptance

- A re-import here (python3 -I tools/isomatch.py import <parts>) reports 0 errors and 0 warnings.
- All 203 lines are covered; every bill, pipe length, title block and sheet break still agrees with the model.
- The set reads with the usual sign convention (summary coordinateSign: conventional).
- Every weld of every line and branch carries its model label once, on its own sheet.

## Summary

64 drawings, 188 changes.

| Change | Rule | Count |
|---|---|---|
| Coordinate text | R1 | 22 |
| Add weld label | R2 | 98 |
| Remove repeated label | R2 | 17 |
| Move weld label | R2 | 3 |
| Relabel branch weld | R3 | 25 |
| Add end label | R4 | 23 |

| Drawing | Line | Sheets | Changes |
|---|---|---|---|
| ISO-P-1001 | 6"-P150-P-1001 | 5 | 5 |
| ISO-P-1002 | 6"-P150-P-1002 | 1 | 3 |
| ISO-P-1003 | 4"-P300-P-1003 | 3 | 6 |
| ISO-P-1004 | 4"-P300-P-1004 | 1 | 3 |
| ISO-P-1005 | 4"-P300-P-1005 | 4 | 5 |
| ISO-P-1006 | 6"-P300-P-1006 | 7 | 7 |
| ISO-P-1007 | 6"-P300-P-1007 | 2 | 7 |
| ISO-P-1008 | 4"-P300-P-1008 | 3 | 5 |
| ISO-P-1009 | 4"-P300-P-1009 | 1 | 3 |
| ISO-P-1010 | 4"-P300-P-1010 | 4 | 4 |
| ISO-P-1011 | 6"-P300-P-1011 | 2 | 3 |
| ISO-P-1012 | 6"-P300-P-1012 | 2 | 2 |
| ISO-P-1013 | 4"-P300-P-1013 | 5 | 9 |
| ISO-P-1014 | 4"-P300-P-1014 | 1 | 2 |
| ISO-P-1015 | 3"-P300-P-1015 | 6 | 10 |
| ISO-P-1016 | 3"-P300-P-1016 | 1 | 3 |
| ISO-P-1017 | 6"-P300-P-1017 | 4 | 5 |
| ISO-P-1018 | 6"-P300-P-1018 | 2 | 6 |
| ISO-P-1019 | 4"-P300-P-1019 | 5 | 5 |
| ISO-P-1020 | 4"-P300-P-1020 | 1 | 3 |
| ISO-P-1021 | 4"-P300-P-1021 | 4 | 3 |
| ISO-CWS-2001 | 8"-P150-CWS-2001 | 4 | 3 |
| ISO-CWR-2002 | 8"-P150-CWR-2002 | 4 | 3 |
| ISO-LS-2003 | 6"-P300-LS-2003 | 7 | 3 |
| ISO-SC-2004 | 3"-P150-SC-2004 | 6 | 4 |
| ISO-IA-2005 | 2"-P150-IA-2005 | 8 | 6 |
| ISO-PA-2006 | 2"-P150-PA-2006 | 8 | 7 |
| ISO-N-2007 | 2"-P150-N-2007 | 9 | 5 |
| ISO-W-2008 | 3"-P150-W-2008 | 10 | 7 |
| ISO-FL-2009 | 8"-P150-FL-2009 | 5 | 4 |
| ISO-CWS-3005 | 4"-P150-CWS-3005 | 1 | 1 |
| ISO-CWR-3006 | 4"-P150-CWR-3006 | 2 | 2 |
| ISO-SC-3008 | 2"-P150-SC-3008 | 1 | 2 |
| ISO-LS-3009 | 2"-P300-LS-3009 | 1 | 1 |
| ISO-SC-3010 | 2"-P150-SC-3010 | 1 | 1 |
| ISO-N-3011 | 1"-P150-N-3011 | 1 | 2 |
| ISO-N-3012 | 1"-P150-N-3012 | 1 | 1 |
| ISO-N-3015 | 1"-P150-N-3015 | 1 | 1 |
| ISO-N-3016 | 1"-P150-N-3016 | 1 | 1 |
| ISO-W-3018 | 3/4"-P150-W-3018 | 1 | 1 |
| ISO-W-3019 | 3/4"-P150-W-3019 | 1 | 2 |
| ISO-W-3020 | 3/4"-P150-W-3020 | 1 | 1 |
| ISO-W-3021 | 3/4"-P150-W-3021 | 1 | 1 |
| ISO-W-3022 | 3/4"-P150-W-3022 | 1 | 1 |
| ISO-W-3023 | 3/4"-P150-W-3023 | 1 | 1 |
| ISO-W-3024 | 3/4"-P150-W-3024 | 1 | 3 |
| ISO-RV-4001 | 3"-P300-RV-4001 | 1 | 1 |
| ISO-RV-4002 | 3"-P150-RV-4002 | 1 | 1 |
| ISO-RV-4003 | 3"-P150-RV-4003 | 1 | 1 |
| ISO-FL-4004 | 4"-P150-FL-4004 | 1 | 1 |
| ISO-FL-4005 | 4"-P150-FL-4005 | 3 | 2 |
| ISO-FL-4006 | 4"-P150-FL-4006 | 2 | 2 |
| ISO-HS-5002 | 1"-P150-HS-5002 | 1 | 1 |
| ISO-HS-5007 | 1"-P150-HS-5007 | 1 | 1 |
| ISO-HS-5009 | 1"-P150-HS-5009 | 1 | 1 |
| ISO-HS-5012 | 1"-P150-HS-5012 | 1 | 1 |
| ISO-HS-5015 | 1/2"-P150-HS-5015 | 1 | 6 |
| ISO-HS-5016 | 1"-P150-HS-5016 | 1 | 1 |
| ISO-HS-5019 | 1"-P150-HS-5019 | 2 | 1 |
| ISO-HS-5023 | 1"-P300-HS-5023 | 1 | 1 |
| ISO-HS-5027 | 1"-P150-HS-5027 | 1 | 1 |
| ISO-HS-5030 | 1/2"-P150-HS-5030 | 1 | 1 |
| ISO-HS-5031 | 1"-P150-HS-5031 | 1 | 1 |
| ISO-HS-5032 | 1"-P150-HS-5032 | 1 | 1 |

## Changes by drawing

Positions are the model's plant coordinates (E = east, N = north, EL = elevation; the floor is EL 100'-0"). Tags are the model's; the tool that drew the set links every weld to its tag.

### ISO-P-1001: 6"-P150-P-1001 (5 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 4 | Add weld label | 3/4"-P300-I-7001/W1 | I-7001/W1 | E 152'-6" N 0" EL 117'-5" | Label the weld dot I-7001/W1, between W14 and W15. |
| 02 | 4 | Add weld label | 3/4"-P300-I-7030/W1 | I-7030/W1 | E 151'-6" N 0" EL 117'-5" | Label the weld dot I-7030/W1, between W12 and W13. |
| 03 | 4 | Remove repeated label | 6"-P150-P-1001/W21 | W21 |  | Remove label W21 from sheet 4; it stays on sheet 5, which holds the weld. |
| 04 | 5 | Coordinate text | CONT'D ON ISO-P-1002 | N -11'-6" | E 154'-5" N -11'-6" EL 102'-0" | print N -11'-6" (not -12'-6"): the minus sign applies to the whole value. |
| 05 | 5 | Add end label |  | TO P-101A NOZ. S | E 154'-0" N -15'-4 7/16" EL 102'-0" | Print 'TO P-101A NOZ. S' at the line's end (E 154'-0" N -15'-4 7/16" EL 102'-0"). |

### ISO-P-1002: 6"-P150-P-1002 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Coordinate text | CONT'D FROM ISO-P-1001 SH 5 | N -11'-6" | E 154'-5" N -11'-6" EL 102'-0" | print N -11'-6" (not -12'-6"): the minus sign applies to the whole value. |
| 02 | 1 | Relabel branch weld | 3/4"-P300-I-7002/W1 | I-7002/W1 |  | Relabel W12 as I-7002/W1, the model's tag of this branch weld. |
| 03 | 1 | Relabel branch weld | 3/4"-P300-I-7031/W1 | I-7031/W1 |  | Relabel W11 as I-7031/W1, the model's tag of this branch weld. |

### ISO-P-1003: 4"-P300-P-1003 (3 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Coordinate text | CONT'D ON ISO-P-1004 | N -16'-6" | E 154'-3 5/16" N -16'-6" EL 107'-6" | print N -16'-6" (not -17'-6"): the minus sign applies to the whole value. |
| 02 | 2 | Coordinate text | CONT'D ON ISO-P-1003 SH 3 | N -3'-3" | E 110'-6" N -3'-3" EL 118'-6" | print N -3'-3" (not -4'-9"): the minus sign applies to the whole value. |
| 03 | 2 | Add weld label | 3/4"-P300-I-7003/W1 | I-7003/W1 | E 110'-6" N -2'-6" EL 118'-9 5/16" | Label the weld dot I-7003/W1, between W16 and W17. |
| 04 | 2 | Remove repeated label | 4"-P300-P-1003/W18 | W18 |  | Remove label W18 from sheet 2; it stays on sheet 3, which holds the weld. |
| 05 | 3 | Coordinate text | CONT'D FROM ISO-P-1003 SH 2 | N -3'-3" | E 110'-6" N -3'-3" EL 118'-6" | print N -3'-3" (not -4'-9"): the minus sign applies to the whole value. |
| 06 | 3 | Add weld label | 3/4"-P300-SP-7022/W1 | SP-7022/W1 | E 110'-6" N -4'-0" EL 118'-9 5/16" | Label the weld dot SP-7022/W1, between W18 and W19. |

### ISO-P-1004: 4"-P300-P-1004 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Coordinate text | CONT'D ON ISO-P-1003 SH 1 | N -16'-6" | E 154'-3 5/16" N -16'-6" EL 107'-6" | print N -16'-6" (not -17'-6"): the minus sign applies to the whole value. |
| 02 | 1 | Relabel branch weld | 3/4"-P300-I-7004/W1 | I-7004/W1 |  | Relabel W11 as I-7004/W1, the model's tag of this branch weld. |
| 03 | 1 | Relabel branch weld | 3/4"-P300-SP-7023/W1 | SP-7023/W1 |  | Relabel W10 as SP-7023/W1, the model's tag of this branch weld. |

### ISO-P-1005: 4"-P300-P-1005 (4 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 4"-P300-P-1005/W11 | W11 | E 109'-11/16" N -4'-0" EL 116'-6" | Label the weld dot W11, after W10. |
| 02 | 2 | Add weld label | 3/4"-P300-I-7005/W1 | I-7005/W1 | E 109'-0" N -2'-0" EL 116'-9 5/16" | Label the weld dot I-7005/W1, between W16 and W17. |
| 03 | 2 | Remove repeated label | 4"-P300-P-1005/W18 | W18 |  | Remove label W18 from sheet 2; it stays on sheet 3, which holds the weld. |
| 04 | 3 | Add weld label | 4"-P300-P-1005/W19 | W19 | E 34'-11/16" N -2'-0" EL 116'-6" | Label the weld dot W19, between W18 and W20. |
| 05 | 4 | Add weld label | 4"-P300-P-1005/W21 | W21 | E 33'-6" N -2'-0" EL 117'-11 5/16" | Label the weld dot W21, before W22. |

### ISO-P-1006: 6"-P300-P-1006 (7 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 2 | Add weld label | 6"-P300-P-1006/W9 | W9 | E 34'-4" N 1'-0" EL 117'-0" | Label the weld dot W9, after W8. |
| 02 | 5 | Add weld label | 3/4"-P300-I-7006/W1 | I-7006/W1 | E 162'-6" N 1'-0" EL 117'-5" | Label the weld dot I-7006/W1, between W15 and W16. |
| 03 | 5 | Add weld label | 3/4"-P300-I-7032/W1 | I-7032/W1 | E 161'-6" N 1'-0" EL 117'-5" | Label the weld dot I-7032/W1, between W13 and W14. |
| 04 | 5 | Remove repeated label | 6"-P300-P-1006/W19 | W19 |  | Remove label W19 from sheet 5; it stays on sheet 6, which holds the weld. |
| 05 | 5 | Remove repeated label | 6"-P300-P-1006/W20 | W20 |  | Remove label W20 from sheet 5; it stays on sheet 6, which holds the weld. |
| 06 | 7 | Coordinate text | CONT'D ON ISO-P-1007 SH 1 | N -11'-6" | E 164'-5" N -11'-6" EL 102'-0" | print N -11'-6" (not -12'-6"): the minus sign applies to the whole value. |
| 07 | 7 | Add end label |  | TO P-102A NOZ. S | E 164'-0" N -15'-4 7/16" EL 102'-0" | Print 'TO P-102A NOZ. S' at the line's end (E 164'-0" N -15'-4 7/16" EL 102'-0"). |

### ISO-P-1007: 6"-P300-P-1007 (2 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Coordinate text | CONT'D ON ISO-P-1007 SH 2 | N -11'-6" | E 165'-3" N -11'-6" EL 102'-0" | print N -11'-6" (not -12'-6"): the minus sign applies to the whole value. |
| 02 | 1 | Coordinate text | CONT'D FROM ISO-P-1006 SH 7 | N -11'-6" | E 164'-5" N -11'-6" EL 102'-0" | print N -11'-6" (not -12'-6"): the minus sign applies to the whole value. |
| 03 | 1 | Add weld label | 6"-P300-P-1007/W1 | W1 | E 164'-5" N -11'-6" EL 102'-0" | Label the weld dot W1. |
| 04 | 2 | Coordinate text | CONT'D FROM ISO-P-1007 SH 1 | N -11'-6" | E 165'-3" N -11'-6" EL 102'-0" | print N -11'-6" (not -12'-6"): the minus sign applies to the whole value. |
| 05 | 2 | Add weld label | 3/4"-P300-I-7007/W1 | I-7007/W1 | E 167'-6" N -11'-6" EL 102'-5" | Label the weld dot I-7007/W1, between W4 and W5. |
| 06 | 2 | Add weld label | 3/4"-P300-I-7033/W1 | I-7033/W1 | E 166'-6" N -11'-6" EL 102'-5" | Label the weld dot I-7033/W1, between W2 and W3. |
| 07 | 2 | Add end label |  | TO P-102B NOZ. S | E 169'-0" N -15'-4 7/16" EL 102'-0" | Print 'TO P-102B NOZ. S' at the line's end (E 169'-0" N -15'-4 7/16" EL 102'-0"). |

### ISO-P-1008: 4"-P300-P-1008 (3 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Coordinate text | CONT'D ON ISO-P-1009 | N -16'-6" | E 164'-3 5/16" N -16'-6" EL 107'-6" | print N -16'-6" (not -17'-6"): the minus sign applies to the whole value. |
| 02 | 2 | Add weld label | 3/4"-P300-I-7008/W1 | I-7008/W1 | E 135'-0" N 2'-0" EL 116'-9 5/16" | Label the weld dot I-7008/W1, after W13. |
| 03 | 2 | Add weld label | 3/4"-P300-SP-7024/W1 | SP-7024/W1 | E 136'-0" N 2'-0" EL 116'-9 5/16" | Label the weld dot SP-7024/W1, between W11 and W12. |
| 04 | 2 | Add weld label | 4"-P300-P-1008/W14 | W14 | E 134'-8 11/16" N 2'-0" EL 116'-6" | Label the weld dot W14, after W13. |
| 05 | 2 | Remove repeated label | 4"-P300-P-1008/W15 | W15 |  | Remove label W15 from sheet 2; it stays on sheet 3, which holds the weld. |

### ISO-P-1009: 4"-P300-P-1009 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Coordinate text | CONT'D ON ISO-P-1008 SH 1 | N -16'-6" | E 164'-3 5/16" N -16'-6" EL 107'-6" | print N -16'-6" (not -17'-6"): the minus sign applies to the whole value. |
| 02 | 1 | Relabel branch weld | 3/4"-P300-I-7009/W1 | I-7009/W1 |  | Relabel W11 as I-7009/W1, the model's tag of this branch weld. |
| 03 | 1 | Relabel branch weld | 3/4"-P300-SP-7025/W1 | SP-7025/W1 |  | Relabel W10 as SP-7025/W1, the model's tag of this branch weld. |

### ISO-P-1010: 4"-P300-P-1010 (4 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Coordinate text | CONT'D ON ISO-P-1010 SH 2 | N -15'-5 11/16" | E 133'-6" N -15'-5 11/16" EL 112'-6" | print N -15'-5 11/16" (not -16'-6 5/16"): the minus sign applies to the whole value. |
| 02 | 2 | Coordinate text | CONT'D FROM ISO-P-1010 SH 1 | N -15'-5 11/16" | E 133'-6" N -15'-5 11/16" EL 112'-6" | print N -15'-5 11/16" (not -16'-6 5/16"): the minus sign applies to the whole value. |
| 03 | 3 | Add weld label | 3/4"-P300-I-7010/W1 | I-7010/W1 | E 70'-0" N 3'-0" EL 116'-9 5/16" | Label the weld dot I-7010/W1, between W13 and W14. |
| 04 | 4 | Add end label |  | TO C-101 NOZ. N1 | E 68'-6" N 22'-3 15/16" EL 116'-0" | Print 'TO C-101 NOZ. N1' at the line's end (E 68'-6" N 22'-3 15/16" EL 116'-0"). |

### ISO-P-1011: 6"-P300-P-1011 (2 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 3/4"-P300-I-7011/W1 | I-7011/W1 | E 68'-11" N 6" EL 120'-0" | Label the weld dot I-7011/W1, between W8 and W9. |
| 02 | 1 | Remove repeated label | 6"-P300-P-1011/W14 | W14 |  | Remove label W14 from sheet 1; it stays on sheet 2, which holds the weld. |
| 03 | 2 | Add weld label | 6"-P300-P-1011/W20 | W20 | E 89'-0" N 25'-0" EL 110'-2 1/2" | Label the weld dot W20, after W19. |

### ISO-P-1012: 6"-P300-P-1012 (2 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 3/4"-P300-I-7012/W1 | I-7012/W1 | E 99'-6" N 21'-0" EL 113'-11" | Label the weld dot I-7012/W1, between W8 and W9. |
| 02 | 1 | Remove repeated label | 6"-P300-P-1012/W10 | W10 |  | Remove label W10 from sheet 1; it stays on sheet 2, which holds the weld. |

### ISO-P-1013: 4"-P300-P-1013 (5 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 2 | Add weld label | 4"-P300-P-1013/W11 | W11 | E 98'-6 11/16" N 4'-0" EL 116'-6" | Label the weld dot W11, between W10 and W12. |
| 02 | 3 | Add weld label | 3/4"-P300-I-7013/W1 | I-7013/W1 | E 172'-6" N 4'-0" EL 116'-9 5/16" | Label the weld dot I-7013/W1, after W15. |
| 03 | 3 | Add weld label | 3/4"-P300-I-7034/W1 | I-7034/W1 | E 171'-6" N 4'-0" EL 116'-9 5/16" | Label the weld dot I-7034/W1, between W13 and W14. |
| 04 | 3 | Add weld label | 4"-P300-P-1013/W16 | W16 | E 172'-9 5/16" N 4'-0" EL 116'-6" | Label the weld dot W16, after W15. |
| 05 | 3 | Remove repeated label | 4"-P300-P-1013/W17 | W17 |  | Remove label W17 from sheet 3; it stays on sheet 4, which holds the weld. |
| 06 | 3 | Remove repeated label | 4"-P300-P-1013/W18 | W18 |  | Remove label W18 from sheet 3; it stays on sheet 4, which holds the weld. |
| 07 | 4 | Coordinate text | CONT'D ON ISO-P-1013 SH 5 | N -9'-8 3/16" | E 174'-0" N -9'-8 3/16" EL 102'-0" | print N -9'-8 3/16" (not -10'-3 13/16"): the minus sign applies to the whole value. |
| 08 | 5 | Coordinate text | CONT'D FROM ISO-P-1013 SH 4 | N -9'-8 3/16" | E 174'-0" N -9'-8 3/16" EL 102'-0" | print N -9'-8 3/16" (not -10'-3 13/16"): the minus sign applies to the whole value. |
| 09 | 5 | Add end label |  | TO P-103A NOZ. S | E 174'-0" N -15'-4 7/16" EL 102'-0" | Print 'TO P-103A NOZ. S' at the line's end (E 174'-0" N -15'-4 7/16" EL 102'-0"). |

### ISO-P-1014: 4"-P300-P-1014 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 3/4"-P300-I-7035/W1 | I-7035/W1 | E 176'-6" N -11'-0" EL 102'-3 5/16" | Label the weld dot I-7035/W1, between W2 and W3. |
| 02 | 1 | Relabel branch weld | 3/4"-P300-I-7014/W1 | I-7014/W1 |  | Relabel W12 as I-7014/W1, the model's tag of this branch weld. |

### ISO-P-1015: 3"-P300-P-1015 (6 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Coordinate text | CONT'D ON ISO-P-1016 | N -16'-6" | E 174'-2 1/2" N -16'-6" EL 107'-6" | print N -16'-6" (not -17'-6"): the minus sign applies to the whole value. |
| 02 | 5 | Add weld label | 3"-P300-P-1015/W16 | W16 | E 68'-6" N -5'-0" EL 124'-7" | Label the weld dot W16, between W15 and W18. |
| 03 | 5 | Add weld label | 3"-P300-P-1015/W17 | W17 | E 68'-11" N -5'-0" EL 125'-0" | Label the weld dot W17, between W15 and W18. |
| 04 | 5 | Add weld label | 3"-P300-P-1015/W19 | W19 | E 69'-6" N -4'-7" EL 125'-0" | Label the weld dot W19, between W18 and W21. |
| 05 | 5 | Add weld label | 3"-P300-P-1015/W20 | W20 | E 69'-6" N -4'-2 1/2" EL 125'-0" | Label the weld dot W20, between W18 and W21. |
| 06 | 5 | Add weld label | 3/4"-P300-I-7015/W1 | I-7015/W1 | E 68'-8 1/2" N -5'-0" EL 124'-0" | Label the weld dot I-7015/W1, between W14 and W15. |
| 07 | 5 | Add weld label | 3/4"-P300-SP-7026/W1 | SP-7026/W1 | E 69'-3 1/2" N -4'-0" EL 125'-0" | Label the weld dot SP-7026/W1, between W18 and W21. |
| 08 | 5 | Remove repeated label | 3"-P300-P-1015/W22 | W22 |  | Remove label W22 from sheet 5; it stays on sheet 6, which holds the weld. |
| 09 | 5 | Remove repeated label | 3"-P300-P-1015/W23 | W23 |  | Remove label W23 from sheet 5; it stays on sheet 6, which holds the weld. |
| 10 | 6 | Add weld label | 3"-P300-P-1015/W26 | W26 | E 68'-6" N 14'-11 9/16" EL 125'-0" | Label the weld dot W26, between W25 and W27. |

### ISO-P-1016: 3"-P300-P-1016 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Coordinate text | CONT'D ON ISO-P-1015 SH 1 | N -16'-6" | E 174'-2 1/2" N -16'-6" EL 107'-6" | print N -16'-6" (not -17'-6"): the minus sign applies to the whole value. |
| 02 | 1 | Relabel branch weld | 3/4"-P300-I-7016/W1 | I-7016/W1 |  | Relabel W9 as I-7016/W1, the model's tag of this branch weld. |
| 03 | 1 | Relabel branch weld | 3/4"-P300-SP-7027/W1 | SP-7027/W1 |  | Relabel W10 as SP-7027/W1, the model's tag of this branch weld. |

### ISO-P-1017: 6"-P300-P-1017 (4 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 3 | Add weld label | 3/4"-P300-I-7017/W1 | I-7017/W1 | E 115'-0" N 2'-0" EL 117'-5" | Label the weld dot I-7017/W1, between W13 and W14. |
| 02 | 3 | Add weld label | 3/4"-P300-I-7036/W1 | I-7036/W1 | E 114'-0" N 2'-0" EL 117'-5" | Label the weld dot I-7036/W1, between W11 and W12. |
| 03 | 3 | Remove repeated label | 6"-P300-P-1017/W17 | W17 |  | Remove label W17 from sheet 3; it stays on sheet 4, which holds the weld. |
| 04 | 3 | Remove repeated label | 6"-P300-P-1017/W18 | W18 |  | Remove label W18 from sheet 3; it stays on sheet 4, which holds the weld. |
| 05 | 4 | Add end label |  | TO P-104A NOZ. S | E 116'-6" N 15'-4 7/16" EL 102'-0" | Print 'TO P-104A NOZ. S' at the line's end (E 116'-6" N 15'-4 7/16" EL 102'-0"). |

### ISO-P-1018: 6"-P300-P-1018 (2 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 6"-P300-P-1018/W1 | W1 | E 116'-11" N 11'-6" EL 102'-0" | Label the weld dot W1. |
| 02 | 2 | Add weld label | 3/4"-P300-I-7018/W1 | I-7018/W1 | E 120'-0" N 11'-6" EL 102'-5" | Label the weld dot I-7018/W1, between W4 and W5. |
| 03 | 2 | Add weld label | 3/4"-P300-I-7037/W1 | I-7037/W1 | E 119'-0" N 11'-6" EL 102'-5" | Label the weld dot I-7037/W1, before W3. |
| 04 | 2 | Add weld label | 6"-P300-P-1018/W2 | W2 | E 118'-7" N 11'-6" EL 102'-0" | Label the weld dot W2, before W3. |
| 05 | 2 | Add weld label | 6"-P300-P-1018/W8 | W8 | E 121'-6" N 12'-6 1/8" EL 102'-0" | Label the weld dot W8, between W7 and W9. |
| 06 | 2 | Add end label |  | TO P-104B NOZ. S | E 121'-6" N 15'-4 7/16" EL 102'-0" | Print 'TO P-104B NOZ. S' at the line's end (E 121'-6" N 15'-4 7/16" EL 102'-0"). |

### ISO-P-1019: 4"-P300-P-1019 (5 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 3 | Add weld label | 3/4"-P300-I-7019/W1 | I-7019/W1 | E 53'-6" N 3'-6" EL 119'-3 5/16" | Label the weld dot I-7019/W1, between W16 and W17. |
| 02 | 4 | Coordinate text | CONT'D ON ISO-P-1019 SH 5 | N -10'-6" | E 53'-6" N -10'-6" EL 120'-0" | print N -10'-6" (not -11'-6"): the minus sign applies to the whole value. |
| 03 | 4 | Add weld label | 3/4"-P300-SP-7028/W1 | SP-7028/W1 | E 53'-6" N 2'-0" EL 119'-3 5/16" | Label the weld dot SP-7028/W1, between W18 and W19. |
| 04 | 5 | Coordinate text | CONT'D FROM ISO-P-1019 SH 4 | N -10'-6" | E 53'-6" N -10'-6" EL 120'-0" | print N -10'-6" (not -11'-6"): the minus sign applies to the whole value. |
| 05 | 5 | Move weld label | 4"-P300-P-1019/W22 | W22 | E 53'-6" N -10'-6" EL 120'-5 5/16" | Show and label W22 on sheet 5, which holds its position; remove it from sheet 4. |

### ISO-P-1020: 4"-P300-P-1020 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 3/4"-P300-I-7020/W1 | I-7020/W1 | E 117'-6" N 16'-6" EL 107'-9 5/16" | Label the weld dot I-7020/W1, between W8 and W9. |
| 02 | 1 | Add weld label | 4"-P300-P-1020/W1 | W1 | E 116'-9 5/16" N 16'-6" EL 107'-6" | Label the weld dot W1, after W9. |
| 03 | 1 | Relabel branch weld | 3/4"-P300-SP-7029/W1 | SP-7029/W1 |  | Relabel W10 as SP-7029/W1, the model's tag of this branch weld. |

### ISO-P-1021: 4"-P300-P-1021 (4 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Coordinate text | CONT'D ON ISO-P-1021 SH 2 | N -12'-7 15/16" | E 53'-6" N -12'-7 15/16" EL 109'-0" | print N -12'-7 15/16" (not -13'-4 1/16"): the minus sign applies to the whole value. |
| 02 | 2 | Coordinate text | CONT'D FROM ISO-P-1021 SH 1 | N -12'-7 15/16" | E 53'-6" N -12'-7 15/16" EL 109'-0" | print N -12'-7 15/16" (not -13'-4 1/16"): the minus sign applies to the whole value. |
| 03 | 4 | Relabel branch weld | 3/4"-P300-I-7021/W1 | I-7021/W1 |  | Relabel W12 as I-7021/W1, the model's tag of this branch weld. |

### ISO-CWS-2001: 8"-P150-CWS-2001 (4 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 4 | Add weld label | 3/4"-P150-D-8002/W1 | D-8002/W1 | E 176'-0" N 0" EL 123'-6 11/16" | Label the weld dot D-8002/W1, between W12 and W13. |
| 02 | 4 | Relabel branch weld | 3/4"-P150-D-8001/W1 | D-8001/W1 |  | Relabel W19 as D-8001/W1, the model's tag of this branch weld. |
| 03 | 4 | Relabel branch weld | 3/4"-P150-V-8003/W1 | V-8003/W1 |  | Relabel W17 as V-8003/W1, the model's tag of this branch weld. |

### ISO-CWR-2002: 8"-P150-CWR-2002 (4 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 4 | Relabel branch weld | 3/4"-P150-D-8004/W1 | D-8004/W1 |  | Relabel W19 as D-8004/W1, the model's tag of this branch weld. |
| 02 | 4 | Relabel branch weld | 3/4"-P150-D-8005/W1 | D-8005/W1 |  | Relabel W18 as D-8005/W1, the model's tag of this branch weld. |
| 03 | 4 | Relabel branch weld | 3/4"-P150-V-8006/W1 | V-8006/W1 |  | Relabel W17 as V-8006/W1, the model's tag of this branch weld. |

### ISO-LS-2003: 6"-P300-LS-2003 (7 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 6 | Add weld label | 3/4"-P150-V-8009/W1 | V-8009/W1 | E 175'-6" N -1'-0" EL 123'-5" | Label the weld dot V-8009/W1, between W23 and W24. |
| 02 | 7 | Add weld label | 3/4"-P150-D-8007/W1 | D-8007/W1 | E 178'-0" N -1'-0" EL 123'-5" | Label the weld dot D-8007/W1, between W27 and W28. |
| 03 | 7 | Relabel branch weld | 3/4"-P150-D-8008/W1 | D-8008/W1 |  | Relabel W31 as D-8008/W1, the model's tag of this branch weld. |

### ISO-SC-2004: 3"-P150-SC-2004 (6 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 5 | Add weld label | 3/4"-P150-V-8012/W1 | V-8012/W1 | E 175'-0" N -2'-0" EL 122'-8 1/2" | Label the weld dot V-8012/W1, between W9 and W10. |
| 02 | 5 | Remove repeated label | 3"-P150-SC-2004/W11 | W11 |  | Remove label W11 from sheet 5; it stays on sheet 6, which holds the weld. |
| 03 | 6 | Add weld label | 3/4"-P150-D-8010/W1 | D-8010/W1 | E 177'-6" N -2'-0" EL 122'-8 1/2" | Label the weld dot D-8010/W1, between W13 and W14. |
| 04 | 6 | Relabel branch weld | 3/4"-P150-D-8011/W1 | D-8011/W1 |  | Relabel W17 as D-8011/W1, the model's tag of this branch weld. |

### ISO-IA-2005: 2"-P150-IA-2005 (8 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 7 | Add weld label | 2"-P150-IA-2005/W18 | W18 | E 174'-8" N 2'-6" EL 122'-6" | Label the weld dot W18, after W17. |
| 02 | 7 | Add weld label | 3/4"-P150-V-8015/W1 | V-8015/W1 | E 174'-6" N 2'-6" EL 122'-8" | Label the weld dot V-8015/W1, after W17. |
| 03 | 7 | Remove repeated label | 2"-P150-IA-2005/W19 | W19 |  | Remove label W19 from sheet 7; it stays on sheet 8, which holds the weld. |
| 04 | 8 | Add weld label | 2"-P150-IA-2005/W24 | W24 | E 177'-8" N 2'-6" EL 122'-6" | Label the weld dot W24, between W23 and W25. |
| 05 | 8 | Add weld label | 3/4"-P150-D-8013/W1 | D-8013/W1 | E 176'-6" N 2'-6" EL 122'-8" | Label the weld dot D-8013/W1, between W21 and W22. |
| 06 | 8 | Add weld label | 3/4"-P150-D-8014/W1 | D-8014/W1 | E 175'-6" N 2'-6" EL 122'-8" | Label the weld dot D-8014/W1, between W19 and W20. |

### ISO-PA-2006: 2"-P150-PA-2006 (8 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 7 | Add weld label | 2"-P150-PA-2006/W18 | W18 | E 173'-2" N -3'-0" EL 122'-6" | Label the weld dot W18, after W17. |
| 02 | 8 | Add weld label | 2"-P150-PA-2006/W19 | W19 | E 175'-10" N -3'-0" EL 122'-6" | Label the weld dot W19, before W26. |
| 03 | 8 | Add weld label | 2"-P150-PA-2006/W22 | W22 | E 177'-2" N -3'-0" EL 122'-6" | Label the weld dot W22, between W21 and W28. |
| 04 | 8 | Add weld label | 2"-P150-PA-2006/W23 | W23 | E 177'-10" N -3'-0" EL 122'-6" | Label the weld dot W23, between W21 and W28. |
| 05 | 8 | Add weld label | 3/4"-P150-D-8017/W1 | D-8017/W1 | E 177'-0" N -3'-0" EL 122'-8" | Label the weld dot D-8017/W1, between W21 and W28. |
| 06 | 8 | Relabel branch weld | 3/4"-P150-D-8016/W1 | D-8016/W1 |  | Relabel W28 as D-8016/W1, the model's tag of this branch weld. |
| 07 | 8 | Relabel branch weld | 3/4"-P150-V-8018/W1 | V-8018/W1 |  | Relabel W26 as V-8018/W1, the model's tag of this branch weld. |

### ISO-N-2007: 2"-P150-N-2007 (9 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 4 | Add weld label | 2"-P150-N-2007/W21 | W21 | E 91'-8" N 3'-6" EL 122'-6" | Label the weld dot W21, after W20. |
| 02 | 8 | Move weld label | 3/4"-P150-V-8021/W1 | V-8021/W1 | E 175'-0" N 3'-6" EL 122'-8" | Show and label V-8021/W1 on sheet 8, which holds its position; remove it from sheet 9. |
| 03 | 8 | Relabel branch weld | 3/4"-P150-V-8021/W1 | V-8021/W1 |  | Relabel W38 as V-8021/W1, the model's tag of this branch weld. |
| 04 | 9 | Add weld label | 3/4"-P150-D-8019/W1 | D-8019/W1 | E 178'-0" N 3'-6" EL 122'-8" | Label the weld dot D-8019/W1, between W35 and W36. |
| 05 | 9 | Relabel branch weld | 3/4"-P150-D-8020/W1 | D-8020/W1 |  | Relabel W39 as D-8020/W1, the model's tag of this branch weld. |

### ISO-W-2008: 3"-P150-W-2008 (10 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 7 | Add weld label | 3"-P150-W-2008/W22 | W22 | E 162'-3 1/2" N -4'-0" EL 122'-6" | Label the weld dot W22, between W21 and W23. |
| 02 | 8 | Add weld label | 3"-P150-W-2008/W29 | W29 | E 171'-2 1/2" N -4'-0" EL 122'-6" | Label the weld dot W29, after W28. |
| 03 | 8 | Add weld label | 3/4"-P150-V-8024/W1 | V-8024/W1 | E 169'-0" N -4'-0" EL 122'-8 1/2" | Label the weld dot V-8024/W1, between W26 and W27. |
| 04 | 8 | Remove repeated label | 3"-P150-W-2008/W30 | W30 |  | Remove label W30 from sheet 8; it stays on sheet 9, which holds the weld. |
| 05 | 9 | Add weld label | 3/4"-P150-D-8023/W1 | D-8023/W1 | E 174'-0" N -4'-0" EL 122'-8 1/2" | Label the weld dot D-8023/W1, between W32 and W33. |
| 06 | 10 | Add weld label | 3/4"-P150-D-8022/W1 | D-8022/W1 | E 175'-0" N -4'-0" EL 122'-8 1/2" | Label the weld dot D-8022/W1, before W35. |
| 07 | 10 | Move weld label | 3"-P150-W-2008/W34 | W34 | E 174'-9 1/2" N -4'-0" EL 122'-6" | Show and label W34 on sheet 10, which holds its position; remove it from sheet 9. |

### ISO-FL-2009: 8"-P150-FL-2009 (5 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 8"-P150-FL-2009/W2 | W2 | E 21'-11 5/16" N 4'-6" EL 123'-0" | Label the weld dot W2, between W1 and W3. |
| 02 | 5 | Relabel branch weld | 3/4"-P150-D-8025/W1 | D-8025/W1 |  | Relabel W20 as D-8025/W1, the model's tag of this branch weld. |
| 03 | 5 | Relabel branch weld | 3/4"-P150-D-8026/W1 | D-8026/W1 |  | Relabel W19 as D-8026/W1, the model's tag of this branch weld. |
| 04 | 5 | Relabel branch weld | 3/4"-P150-V-8027/W1 | V-8027/W1 |  | Relabel W18 as V-8027/W1, the model's tag of this branch weld. |

### ISO-CWS-3005: 4"-P150-CWS-3005 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 4"-P150-CWS-3005/W1 | W1 | E 86'-0" N 0" EL 123'-6 11/16" | Label the weld dot W1, before W2. |

### ISO-CWR-3006: 4"-P150-CWR-3006 (2 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 2 | Add weld label | 4"-P150-CWR-3006/W12 | W12 | E 85'-0" N 1'-6" EL 125'-11 5/16" | Label the weld dot W12, between W11 and W13. |
| 02 | 2 | Add weld label | 4"-P150-CWR-3006/W9 | W9 | E 84'-5 5/16" N 25'-0" EL 126'-6" | Label the weld dot W9, between W8 and W10. |

### ISO-SC-3008: 2"-P150-SC-3008 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 2"-P150-SC-3008/W1 | W1 | E 23'-6" N -2'-0" EL 122'-8 1/2" | Label the weld dot W1, after W13. |
| 02 | 1 | Add weld label | 2"-P150-SC-3008/W11 | W11 | E 23'-6" N -1'-8 11/16" EL 125'-0" | Label the weld dot W11, between W10 and W12. |

### ISO-LS-3009: 2"-P300-LS-3009 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 2"-P300-LS-3009/W1 | W1 | E 35'-6" N -1'-0" EL 123'-5" | Label the weld dot W1, before W2. |

### ISO-SC-3010: 2"-P150-SC-3010 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add end label |  | FROM T-102 NOZ. N8 | E 37'-6 1/8" N 26'-6" EL 104'-6" | Print 'FROM T-102 NOZ. N8' at the line's start (E 37'-6 1/8" N 26'-6" EL 104'-6"). |

### ISO-N-3011: 1"-P150-N-3011 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 1"-P150-N-3011/W10 | W10 | E 38'-10 5/16" N -25'-0" EL 120'-6" | Label the weld dot W10, after W9. |
| 02 | 1 | Add weld label | 1"-P150-N-3011/W11 | W11 | E 38'-5 1/2" N -25'-0" EL 120'-6" | Label the weld dot W11, after W9. |

### ISO-N-3012: 1"-P150-N-3012 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 1"-P150-N-3012/W11 | W11 | E 48'-6 1/2" N -25'-0" EL 120'-6" | Label the weld dot W11, after W10. |

### ISO-N-3015: 1"-P150-N-3015 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 1"-P150-N-3015/W1 | W1 | E 28'-0" N 3'-6" EL 122'-8" | Label the weld dot W1, before W2. |

### ISO-N-3016: 1"-P150-N-3016 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 1"-P150-N-3016/W3 | W3 | E 47'-0" N 3'-6" EL 124'-10 5/16" | Label the weld dot W3, between W2 and W4. |

### ISO-W-3018: 3/4"-P150-W-3018 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add end label |  | TO P-101B NOZ. F | E 160'-3 1/16" N -16'-6" EL 102'-0" | Print 'TO P-101B NOZ. F' at the line's end (E 160'-3 1/16" N -16'-6" EL 102'-0"). |

### ISO-W-3019: 3/4"-P150-W-3019 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 3/4"-P150-W-3019/W10 | W10 | E 165'-10 3/4" N -16'-6" EL 102'-0" | Label the weld dot W10, between W9 and W11. |
| 02 | 1 | Add end label |  | TO P-102A NOZ. F | E 165'-3 1/16" N -16'-6" EL 102'-0" | Print 'TO P-102A NOZ. F' at the line's end (E 165'-3 1/16" N -16'-6" EL 102'-0"). |

### ISO-W-3020: 3/4"-P150-W-3020 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add end label |  | TO P-102B NOZ. F | E 170'-3 1/16" N -16'-6" EL 102'-0" | Print 'TO P-102B NOZ. F' at the line's end (E 170'-3 1/16" N -16'-6" EL 102'-0"). |

### ISO-W-3021: 3/4"-P150-W-3021 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add end label |  | TO P-103A NOZ. F | E 175'-3 1/16" N -16'-6" EL 102'-0" | Print 'TO P-103A NOZ. F' at the line's end (E 175'-3 1/16" N -16'-6" EL 102'-0"). |

### ISO-W-3022: 3/4"-P150-W-3022 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 3/4"-P150-W-3022/W8 | W8 | E 181'-0" N -16'-6" EL 124'-10 3/4" | Label the weld dot W8, between W7 and W9. |

### ISO-W-3023: 3/4"-P150-W-3023 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add end label |  | TO P-104A NOZ. F | E 117'-9 1/16" N 16'-6" EL 102'-0" | Print 'TO P-104A NOZ. F' at the line's end (E 117'-9 1/16" N 16'-6" EL 102'-0"). |

### ISO-W-3024: 3/4"-P150-W-3024 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 3/4"-P150-W-3024/W1 | W1 | E 123'-6" N -4'-0" EL 122'-8 1/2" | Label the weld dot W1, before W2. |
| 02 | 1 | Add weld label | 3/4"-P150-W-3024/W4 | W4 | E 123'-6" N -3'-10 3/4" EL 125'-0" | Label the weld dot W4, between W3 and W5. |
| 03 | 1 | Add end label |  | TO P-104B NOZ. F | E 122'-9 1/16" N 16'-6" EL 102'-0" | Print 'TO P-104B NOZ. F' at the line's end (E 122'-9 1/16" N 16'-6" EL 102'-0"). |

### ISO-RV-4001: 3"-P300-RV-4001 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add end label |  | TO PSV | E 94'-0" N -25'-0" EL 111'-6" | Print 'TO PSV' at the line's end (E 94'-0" N -25'-0" EL 111'-6"). |

### ISO-RV-4002: 3"-P150-RV-4002 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add end label |  | TO PSV | E 22'-0" N 26'-6" EL 124'-0" | Print 'TO PSV' at the line's end (E 22'-0" N 26'-6" EL 124'-0"). |

### ISO-RV-4003: 3"-P150-RV-4003 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add end label |  | TO PSV | E 41'-0" N 26'-6" EL 124'-0" | Print 'TO PSV' at the line's end (E 41'-0" N 26'-6" EL 124'-0"). |

### ISO-FL-4004: 4"-P150-FL-4004 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add end label |  | FROM PSV ON D-101 NOZ. N3 | E 94'-0" N -24'-4 1/8" EL 111'-6" | Print 'FROM PSV ON D-101 NOZ. N3' at the line's start (E 94'-0" N -24'-4 1/8" EL 111'-6"). |

### ISO-FL-4005: 4"-P150-FL-4005 (3 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add end label |  | FROM PSV ON T-101 NOZ. N3 | E 22'-0" N 25'-10 1/8" EL 124'-0" | Print 'FROM PSV ON T-101 NOZ. N3' at the line's start (E 22'-0" N 25'-10 1/8" EL 124'-0"). |
| 02 | 3 | Add weld label | 4"-P150-FL-4005/W1 | W1 | E 22'-6" N 4'-6" EL 123'-6 11/16" | Label the weld dot W1, after W12. |

### ISO-FL-4006: 4"-P150-FL-4006 (2 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add end label |  | FROM PSV ON T-102 NOZ. N3 | E 41'-0" N 25'-10 1/8" EL 124'-0" | Print 'FROM PSV ON T-102 NOZ. N3' at the line's start (E 41'-0" N 25'-10 1/8" EL 124'-0"). |
| 02 | 2 | Add weld label | 4"-P150-FL-4006/W1 | W1 | E 41'-6" N 4'-6" EL 123'-6 11/16" | Label the weld dot W1, after W12. |

### ISO-HS-5002: 1"-P150-HS-5002 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add end label |  | TO HOSE STATION | E 24'-0" N 11'-0" EL 103'-6" | Print 'TO HOSE STATION' at the line's end (E 24'-0" N 11'-0" EL 103'-6"). |

### ISO-HS-5007: 1"-P150-HS-5007 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 1"-P150-HS-5007/W1 | W1 | E 44'-0" N -3'-0" EL 122'-8" | Label the weld dot W1, before W2. |

### ISO-HS-5009: 1"-P150-HS-5009 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add end label |  | TO HOSE STATION | E 47'-0" N 11'-0" EL 103'-6" | Print 'TO HOSE STATION' at the line's end (E 47'-0" N 11'-0" EL 103'-6"). |

### ISO-HS-5012: 1"-P150-HS-5012 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 1"-P150-HS-5012/W1 | W1 | E 64'-0" N -3'-0" EL 122'-8" | Label the weld dot W1, before W2. |

### ISO-HS-5015: 1/2"-P150-HS-5015 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 1/2"-P150-HS-5015/W1 | W1 | E 68'-0" N 2'-6" EL 122'-8" | Label the weld dot W1, before W2. |
| 02 | 1 | Add weld label | 1/2"-P150-HS-5015/W10 | W10 | E 67'-6 13/16" N 11'-0" EL 105'-6" | Label the weld dot W10, between W9 and W11. |
| 03 | 1 | Add weld label | 1/2"-P150-HS-5015/W12 | W12 | E 68'-6" N 11'-0" EL 105'-5 3/16" | Label the weld dot W12, between W11 and W13. |
| 04 | 1 | Add weld label | 1/2"-P150-HS-5015/W3 | W3 | E 68'-0" N 2'-6" EL 125'-5 3/16" | Label the weld dot W3, between W2 and W4. |
| 05 | 1 | Add weld label | 1/2"-P150-HS-5015/W5 | W5 | E 67'-6 13/16" N 2'-6" EL 125'-6" | Label the weld dot W5, between W4 and W6. |
| 06 | 1 | Add end label |  | TO HOSE STATION | E 68'-6" N 11'-0" EL 103'-6" | Print 'TO HOSE STATION' at the line's end (E 68'-6" N 11'-0" EL 103'-6"). |

### ISO-HS-5016: 1"-P150-HS-5016 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 1"-P150-HS-5016/W1 | W1 | E 82'-6" N -4'-0" EL 122'-8 1/2" | Label the weld dot W1, before W2. |

### ISO-HS-5019: 1"-P150-HS-5019 (2 sheets)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 1"-P150-HS-5019/W1 | W1 | E 87'-0" N 3'-6" EL 122'-8" | Label the weld dot W1, before W2. |

### ISO-HS-5023: 1"-P300-HS-5023 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 1"-P300-HS-5023/W1 | W1 | E 105'-6" N -1'-0" EL 123'-5" | Label the weld dot W1, before W2. |

### ISO-HS-5027: 1"-P150-HS-5027 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 1"-P150-HS-5027/W1 | W1 | E 144'-0" N -3'-0" EL 122'-8" | Label the weld dot W1, before W2. |

### ISO-HS-5030: 1/2"-P150-HS-5030 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 1/2"-P150-HS-5030/W10 | W10 | E 148'-6" N 11'-0" EL 105'-5 3/16" | Label the weld dot W10, between W9 and W11. |

### ISO-HS-5031: 1"-P150-HS-5031 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 1"-P150-HS-5031/W1 | W1 | E 162'-6" N -4'-0" EL 122'-8 1/2" | Label the weld dot W1, before W2. |

### ISO-HS-5032: 1"-P150-HS-5032 (1 sheet)

| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |
|---|---|---|---|---|---|---|
| 01 | 1 | Add weld label | 1"-P150-HS-5032/W1 | W1 | E 164'-0" N -3'-0" EL 122'-8" | Label the weld dot W1, before W2. |

