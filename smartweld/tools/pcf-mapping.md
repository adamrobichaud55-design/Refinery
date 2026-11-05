# PCF mapping table (DESIGN_BASIS.md SW-PCF-3)

One table, used by SmartWeld's PCF writer (`src/exchange/pcf.ts`, `PCF_MAP`) and meant to be used unchanged by the
owner's isometric generator when it reads the same files. Every value here is SmartWeld's own convention; an importer
that wants its own symbol keys remaps this table once.

## File shape (SW-PCF-1)

- One file per line: `<line number>.pcf` (the `"` of the size written as `in`, `/` as `-`), listed in `INDEX.csv`.
- Units: bore and coordinates in inches, weights in pounds. Coordinates are the plant frame: E east, N north, EL
  elevation with the floor at EL 1200 in (100'-0").
- Header: the `UNITS-*` lines, then `PIPELINE-REFERENCE <line>`, `PIPING-SPEC <pressure class>`, then attributes 1–10: line class, fluid,
  service, design pressure, insulation, joint type (BW / SW / TH), from, to, flow, size.
- Each item is one record (SW-PCF-2): `END-POINT E N EL bore` lines, a `CENTRE-POINT` for bends, tees, outlets and
  angle valves, `BRANCH1-POINT` (and `BRANCH2-POINT`) for tees, outlets and valve stations, then `SKEY`, `ITEM-CODE`,
  `COMPONENT-ATTRIBUTE1` = the ground-truth tag, `COMPONENT-ATTRIBUTE2` = cut length (pipe) or weld joins,
  `COMPONENT-ATTRIBUTE3` = spool, `WEIGHT`.
- Welds: `WELD` records at the joint point; supports: `SUPPORT` records with `CO-ORDS` and `NAME`.
- `MATERIALS` block (SW-PCF-4): every `ITEM-CODE` of the line with description, material, size, ends and weight.

## Symbol keys

Four letters: two for the item, two for its ends.

| End letters | Meaning |
|---|---|
| `BW` | butt-weld both ends |
| `SW` | socket-weld both ends |
| `SC` | screwed (threaded) both ends |
| `FL` | flanged (raised face) both ends |
| `WN` | weld-neck flange (weld end and face) |
| `SO` | slip-on flange |
| `SF` | socket-weld flange |
| `TF` | threaded flange |
| `BS` / `BC` / `SS` | swage: butt-weld to socket-weld / butt-weld to screwed / socket-weld to screwed |
| `PE` | plain (sleeves) |

| Ground-truth kind | Condition | PCF record | Item letters | Example key | Owner's symbol class |
|---|---|---|---|---|---|
| pipe | | `PIPE` | `PI` | `PIBW`, `PISW`, `PISC` | pipe (cut length) |
| nipple | | `PIPE` | `NI` | `NISC`, `NISW` | nipple |
| elbow | 90° | `ELBOW` (angle 9000) | `EL` | `ELBW`, `ELSW`, `ELSC` | elbow_90, sw_elbow_90 |
| elbow | 45° | `ELBOW` (angle 4500) | `E4` | `E4BW`, `E4SW`, `E4SC` | elbow_45, sw_elbow_45 |
| tee | | `TEE` | `TE` | `TEBW`, `TESW`, `TESC` | tee, sw_tee |
| olet | by outlet end | `OLET` | `OL` | `OLBW`, `OLSW`, `OLSC` | branch_outlet, branch_outlet_sw, branch_outlet_th |
| reducer | `REDE` key | `REDUCER-ECCENTRIC` | `RE` | `REBW` | eccentric_reducer |
| reducer | | `REDUCER-CONCENTRIC` | `RC` | `RCBW` | reducer |
| swage | by its two ends | `REDUCER-CONCENTRIC` | `SG` | `SGBS`, `SGBC`, `SGSS`, `SGSW`, `SGSC` | swage, swage_sw, swage_th |
| cap | | `CAP` | `CA` | `CABW` | cap |
| plug | | `CAP` | `PL` | `PLSC`, `PLSW` | plug |
| coupling | | `COUPLING` | `CP` | `CPSW`, `CPSC` | coupling_sw, coupling_th |
| flange | `SOF` key | `FLANGE` | `FL` | `FLSO` | slip_on_flange |
| flange | `SWF` key | `FLANGE` | `FL` | `FLSF` | sw_flange |
| flange | weld neck | `FLANGE` | `FL` | `FLWN` | flange (nozzle_flange when the item code names a nozzle) |
| blind | | `FLANGE-BLIND` | `FB` | `FBFL` | blind_flange |
| spade | | `MISC-COMPONENT` | `SP` | `SPFL` | spade |
| spectacle | | `MISC-COMPONENT` | `SB` | `SBFL` | spectacle |
| gasket | | `GASKET` | `GA` | `GAFL` | (bill only) |
| studs | | `BOLT` | `BO` | `BOFL` | (bill only) |
| penetration | | `MISC-COMPONENT` | `SL` | `SLPE` | floor_penetration, wall_penetration (by description) |
| valve | `VLV\|PSV` | `VALVE-ANGLE` | `VR` | `VRFL` | relief_valve |
| valve | `VLV\|GATE` | `VALVE` | `VG` | `VGFL`, `VGSW`, `VGSC` | gate_valve, forged_gate_valve, forged_gate_valve_th |
| valve | `VLV\|GLOBE` (and Y / angle) | `VALVE` | `VL` | `VLFL`, `VLSC` | globe_valve, forged_globe_valve_th |
| valve | `VLV\|CHECK`, `VLV\|LCHECK` | `VALVE` | `VC` | `VCFL`, `VCSC` | check_valve, forged_check_valve_th |
| valve | `VLV\|BALL` | `VALVE` | `VB` | `VBFL`, `VBSW` | ball_valve, ball_valve_3pc |
| valve | `VLV\|BFLY` (and L / D) | `VALVE` | `VF` | `VFFL` | butterfly_valve |
| valve | `VLV\|PLUG` | `VALVE` | `VP` | `VPFL` | plug_valve |
| valve | `VLV\|NEEDLE` | `VALVE` | `VN` | `VNSC` | needle_valve |
| valve | `VLV\|CONTROL` | `VALVE` | `VV` | `VVFL` | control_valve |
| valve | `VLV\|TWAY` | `VALVE-3WAY` | `V3` | `V3FL`, `V3SW` | three_way_valve |
| valve | `VLV\|FWAY` | `VALVE-4WAY` | `V4` | `V4FL`, `V4SW` | four_way_valve |
| valve | `VLV\|ROTARY` | `VALVE` | `VY` | `VYFL` | rotary_valve |
| weld (shop / field) | by type | `WELD` | `WW` / `WF` | `WWBW`, `WFBW`, `WWSW`, `WWFW` | weld, weld_field, socket_weld |
| support | by type | `SUPPORT` | `S` + 3 | `SHAN`, `SSHO`, `SGUI`, `SANC`, `SSTA`, `STRA`, `STRU` | pipe_support, anchor (SANC), dummy_leg (STRU) |

## Reading rules for the owner's generator

- A threaded gate valve followed within two records by a plug is the owner's `gate_valve_th_plugged`.
- A tee's branch size is the bore on its `BRANCH1-POINT`; an outlet's run size is the bore on its first `END-POINT`.
- An angle (relief) valve's second `END-POINT` is its outlet face; the outlet line starts there (its header says
  `PSV on <line>` or `PSV on <nozzle>`).
- Items on a four-way's spare port and a tee's plugged branch are their own records with tags ending `:P1…`, `:A1…`,
  `:B1…`; they hang off the station and are not in the main chain.
- `COMPONENT-ATTRIBUTE1` is the ground-truth tag, so every record can be matched back to `groundtruth/lines/<line>.json`
  and to the answer key.

## Note on the first line

SmartWeld's files begin with the `UNITS-*` lines and carry no product name. Some importers expect a first line naming
the isometric product's file set (`ISOGEN-FILES …`); if the designer's importer insists on it, he adds that line on his
side. SmartWeld does not write it (IP_REVIEW.md item 7).
