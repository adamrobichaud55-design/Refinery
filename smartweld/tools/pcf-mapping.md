# PCF mapping table (DESIGN_BASIS.md SW-PCF-3, as amended with the owner's review of 2026-11-05/06)

One table, used by SmartWeld's PCF writer (`src/exchange/pcf.ts`, `PCF_MAP`) and used unchanged by the owner's
isometric generator when it reads the same files. Every value here is SmartWeld's own convention; an importer that
wants its own symbol keys remaps this table once.

## File shape (SW-PCF-1)

- One file per line: `<line number>.pcf` (the `"` of the size written as `in`, `/` as `-`), listed in `INDEX.csv`
  (line number quoted, with the inch mark doubled inside the quotes, as standard CSV).
- Units: bore and coordinates in inches, weights in pounds. Coordinates are the plant frame: E east, N north, EL
  elevation with the floor at EL 1200 in (100'-0").
- Header: the `UNITS-*` lines, then `PIPELINE-REFERENCE <line>`, `PIPING-SPEC <pressure class>`, then attributes 1–10:
  line class, fluid, service, design pressure, insulation, joint type (BW / SW / TH, read from the line's own pipe
  pieces, SW-GT-7), from, to, flow, size.
- Each item is one record (SW-PCF-2): `END-POINT E N EL bore` lines, each end with its own bore; a `CENTRE-POINT` for
  bends (the work point, where the two centre lines meet), tees, outlets and angle valves; `BRANCH1-POINT` always on
  tees, three-way and four-way valves, and `BRANCH2-POINT` on a four-way valve's spare port; `ANGLE` on elbows; then
  `SKEY`, `ITEM-CODE`, `COMPONENT-ATTRIBUTE1` = the ground-truth tag, `COMPONENT-ATTRIBUTE2` = cut length (pipe,
  nipple) or weld joins, `COMPONENT-ATTRIBUTE3` = spool (absent on items with no spool), `WEIGHT`.
- Welds: `WELD` records at the joint point; supports: `SUPPORT` records with `CO-ORDS`, `NAME`, `ITEM-CODE`.
- `MATERIALS` block (SW-PCF-4): every `ITEM-CODE` of the line, supports included, with description, material, size,
  ends and weight.

## Symbol keys

Four letters: two for the item, two for its ends. A one-ended part (plug, cap) names its one connecting end.

| End letters | Meaning |
|---|---|
| `BW` | butt-weld both ends |
| `SW` | socket-weld both ends (plain ends into sockets) |
| `SC` | screwed (threaded) both ends |
| `FL` | flanged (raised face) both ends |
| `WN` | weld-neck flange (weld end and face) |
| `SO` | slip-on flange |
| `SF` | socket-weld flange |
| `TF` | threaded flange |
| `BS` / `BC` / `SS` | two different ends: butt-weld and socket-weld / butt-weld and screwed / socket-weld (plain into a socket) and screwed |
| `FW` | fillet weld (weld records only: `WWFW` shop, `WFFW` field) |
| `PE` | plain (sleeves) |

| Ground-truth kind | Condition | PCF record | Item letters | Example keys | Owner's symbol class |
|---|---|---|---|---|---|
| pipe | | `PIPE` | `PI` | `PIBW`, `PISW`, `PISC` | pipe (cut length) |
| nipple | | `PIPE` | `NI` | `NISC` (threaded both ends), `NISS` (plain into a socket, screwed at the other end), `NIBC` (butt-welded to a flange, screwed), `NISW` | nipple |
| elbow | 90° | `ELBOW` (angle 9000) | `EL` | `ELBW`, `ELSW`, `ELSC` | elbow_90, sw_elbow_90 |
| elbow | 45° | `ELBOW` (angle 4500) | `E4` | `E4BW`, `E4SW`, `E4SC` | elbow_45, sw_elbow_45 |
| tee | | `TEE` | `TE` | `TEBW`, `TESW`, `TESC` | tee, sw_tee |
| outlet | by outlet end | `BRANCH-OUTLET` | `OL` | `OLBW`, `OLSW`, `OLSC` | branch_outlet, branch_outlet_sw, branch_outlet_th |
| reducer | `REDE` key | `REDUCER-ECCENTRIC` | `RE` | `REBW` | eccentric_reducer |
| reducer | | `REDUCER-CONCENTRIC` | `RC` | `RCBW` | reducer |
| swage | by its two ends | `REDUCER-CONCENTRIC` | `SG` | `SGBS`, `SGBC`, `SGSS`, `SGSW`, `SGSC` | swage, swage_sw, swage_th |
| cap | | `CAP` | `CA` | `CABW` | cap |
| plug | | `CAP` | `PL` | `PLSC` (always threaded, in a valve's end) | plug |
| coupling | | `COUPLING` | `CP` | `CPSW`, `CPSC` | coupling_sw, coupling_th |
| flange | `SOF` key | `FLANGE` | `FL` | `FLSO` | slip_on_flange |
| flange | `SWF` key | `FLANGE` | `FL` | `FLSF` | sw_flange |
| flange | weld neck | `FLANGE` | `FL` | `FLWN` | flange (nozzle_flange when the item code names a nozzle) |
| blind | | `FLANGE-BLIND` | `FB` | `FBFL` | blind_flange |
| spade | | `MISC-COMPONENT` | `SP` | `SPFL` | spade |
| spectacle | | `MISC-COMPONENT` | `SB` | `SBFL` | spectacle |
| gasket | | `GASKET` | `GA` | `GAFL` | (bill only) |
| studs | | `BOLT` | `BO` | `BOFL` | (bill only) |
| penetration | `FSLV` key | `MISC-COMPONENT` | `PF` | `PFPE` | floor_penetration |
| penetration | `WSLV` key | `MISC-COMPONENT` | `PW` | `PWPE` | wall_penetration |
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

- A threaded gate valve followed within two records by a plug is the owner's `gate_valve_th_plugged`. A plug is
  always threaded and always screws straight into a valve's end (SW-LL-8).
- A tee's branch size is the bore on its `BRANCH1-POINT`; an outlet's run size is the bore on its first `END-POINT`,
  which is on the run whichever way the line is written; its second `END-POINT` is the outlet mouth.
- A reducer's or swage's two `END-POINT`s each carry their own bore.
- An angle (relief) valve's first `END-POINT` carries the inlet bore and its second the outlet bore; the outlet line
  starts at the second point (its header says `PSV on <line>` or `PSV on <nozzle>`).
- A station's members are its tagged items: for four-way station `V30` the members are `V30:1…7`, the valve is the
  member whose record is `VALVE-4WAY` (`V30:3`), and the side items `V30:P1…` (the spare port's nipple, threaded gate
  valve and plug) hang off that valve at its `BRANCH2-POINT`; `V30:A1…` and `V30:B1…` are the side-port stacks of a
  four-way gauge manifold in an instrument stub, hanging off that valve. A socket-weld tee's spare branch items are
  tagged `<tee tag>:P1…` and hang off the tee at its `BRANCH1-POINT`. Side items are not in the main chain.
- `COMPONENT-ATTRIBUTE1` is the ground-truth tag, so every record can be matched back to `groundtruth/lines/<line>.json`
  and to the answer key.
- Field welds (`WF..`) are butt welds only; welds at slip-on and socket-weld flanges and at threaded and socket-weld
  valves are shop welds (SW-LL-8).

## Note on the first line

SmartWeld's files begin with the `UNITS-*` lines and carry no product name. Some importers expect a first line naming
the isometric product's file set; if the designer's importer insists on it, he adds that line on his side. SmartWeld
does not write it (IP_REVIEW.md item 7).
