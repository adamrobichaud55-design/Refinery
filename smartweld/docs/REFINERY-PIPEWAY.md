# Plant 3: the main pipeway

> **Demonstration data.** Written by `tools/refinery-pipeway.ts`; do not edit by hand.

The main pipeway joins the units (DESIGN_BASIS.md §80): a rack 1160 ft long and 30 ft wide down the corridor between the two rows, tiers at 20, 26, 33 ft, and on it a line for every stream between units that has a party on the process bench, from one unit's battery-limit spool to the other's. It is piped in its own frame by the generator of plants 1 and 2, unchanged, as each unit is: what the generator is given is the rack, the units' spools as connections, a line list drawn from the process model's streams, and where lines may travel. Its own checks (§40) are then run on the result against the steel as it stands, and reported here as they come out.

| Lines | Routed | Components | Welds | Supports | Pipe, ft | Failures | Checks not at zero |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 109 | 109 | 1,564 | 1,239 | 1,670 | 25,803 | 0 | supports 1 |

109 lines: 45 streams' lines, 22 branches to the further parties of streams that have more than two, and 42 valves with their blinds beyond the limit spools (SW-PWY-4). The lines that run the rack are on 3 of its tiers (tier 1 23 lines, tier 2 21 lines, tier 3 1 lines), each in a lane given it beforehand, no tier loaded beyond 120 in of lanes at any section; the top tier is kept for the utility headers of the next stage. The generator was run 46 times: once for each line that runs the rack, with its branches, and once for the rest.

| Component | Count |
| --- | --- |
| blind | 42 |
| elbow | 250 |
| flange | 112 |
| gasket | 196 |
| olet | 2 |
| pipe | 889 |
| reducer | 11 |
| tee | 20 |
| valve | 42 |

| Welds | Count |
| --- | --- |
| BW, field | 192 |
| BW, shop | 1045 |
| FW, shop | 2 |

| Supports | Count |
| --- | --- |
| anchor | 45 |
| guide | 173 |
| hanger | 138 |
| shoe | 1314 |

## Checks

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

- 4"-P150-P-10031: unsupported span 253 in > 240 on run from 9564,198,-240

## Streams

Each stream's line, and who is on it (SW-PWY-3). A stream with more than two parties runs between the two furthest apart along the rack; the others join by branches.

| Stream | Line | Design | Tier | Lane, z in | Parties | Branches |
| --- | --- | --- | --- | --- | --- | --- |
| desalter brine | 3"-P150-P-10001 | 110 psi, 160 °F | 2 | -96 | unit 11 sends; the wastewater treatment receives | — |
| crude overhead gas | 3"-P150-P-10002 | 50 psi, 150 °F | 2 | -108 | unit 11 sends; unit 17 receives | — |
| straight-run naphtha | 6"-P150-P-10003 | 135 psi, 150 °F | 1 | 42 | the product tankage sends; unit 13 receives; unit 11 sends (a 6 in branch); the product tankage receives (a 6 in branch) | 6"-P150-P-10101, 6"-P150-P-10102 |
| sour water | 4"-P150-P-10004 | 85 psi, 190 °F | 2 | -18 | unit 13 sends; unit 17 sends; unit 11 sends (a 3 in branch); unit 15 sends (a 3 in branch); unit 16 sends (a 3 in branch); unit 12 sends (a 3 in branch); unit 18 receives (a 4 in branch) | 3"-P150-P-10103, 3"-P150-P-10104, 3"-P150-P-10105, 3"-P150-P-10106, 4"-P150-P-10107 |
| straight-run kerosene | 4"-P150-P-10005 | 105 psi, 150 °F | 1 | 90 | unit 11 sends; unit 15 receives | — |
| straight-run diesel | 6"-P150-P-10006 | 105 psi, 190 °F | 1 | -96 | unit 11 sends; the product tankage receives; unit 16 receives (a 6 in branch); the product tankage sends (a 6 in branch) | 6"-P150-P-10108, 6"-P150-P-10109 |
| atmospheric gas oil | 3"-P150-P-10007 | 125 psi, 430 °F | 2 | -120 | unit 11 sends; unit 17 receives | — |
| atmospheric residue | 8"-P300-P-10008 | 175 psi, 700 °F | 1 | -18 | unit 11 sends; unit 12 receives | — |
| vacuum gas oil pumparound return | 8"-P300-P-10009 | 260 psi, 500 °F | 1 | -36 | unit 11 sends; unit 12 receives | — |
| vacuum residue rundown | 6"-P150-P-10010 | 135 psi, 400 °F | 1 | -72 | unit 11 sends; the product tankage receives | — |
| crude | 16"-P150-P-10011 | 120 psi, 150 °F | 3 | -150 | the crude tank farm sends; unit 11 receives | — |
| stripped water | 4"-P150-P-10012 | 125 psi, 170 °F | 2 | 30 | unit 18 sends; unit 13 receives; unit 11 receives (a 4 in branch); unit 15 receives (a 3 in branch); unit 16 receives (a 3 in branch) | 4"-P150-P-10110, 3"-P150-P-10111, 3"-P150-P-10112 |
| vacuum gas oil pumparound supply | 10"-P300-P-10013 | 260 psi, 600 °F | 1 | 0 | unit 12 sends; unit 11 receives | — |
| vacuum residue hot | 6"-P600-P-10014 | 155 psi, 740 °F | 1 | -132 | unit 12 sends; unit 11 receives | — |
| slop oil | 3"-P150-P-10015 | 65 psi, 200 °F | 2 | -42 | unit 19 sends; the product tankage receives; unit 12 sends (a 3 in branch); unit 18 sends (a 3 in branch) | 3"-P150-P-10113, 3"-P150-P-10114 |
| light vacuum gas oil | 3"-P150-P-10016 | 105 psi, 200 °F | 2 | -156 | unit 12 sends; the product tankage receives; unit 17 receives (a 3 in branch); the product tankage sends (a 3 in branch) | 3"-P150-P-10115, 3"-P150-P-10116 |
| heavy vacuum gas oil | 6"-P150-P-10017 | 125 psi, 450 °F | 1 | 0 | unit 12 sends; unit 17 receives | — |
| stripper gas | 6"-P150-P-10018 | 50 psi, 190 °F | 1 | 72 | unit 13 sends; unit 17 receives; unit 15 sends (a 3 in branch); unit 16 sends (a 3 in branch) | 3"-P150-P-10117, 3"-P150-P-10118 |
| light naphtha | 3"-P150-P-10019 | 75 psi, 150 °F | 2 | 72 | unit 13 sends; the product tankage receives | — |
| hydrotreated heavy naphtha | 6"-P150-P-10020 | 85 psi, 360 °F | 1 | 90 | unit 13 sends; unit 14 receives | — |
| heavy naphtha to storage | 6"-P150-P-10021 | 75 psi, 190 °F | 1 | 18 | unit 13 sends; the product tankage receives | — |
| wild naphtha | 3"-P150-P-10022 | 105 psi, 170 °F | 2 | 84 | unit 16 sends; unit 13 receives; unit 15 sends (a 3 in branch) | 3"-P150-P-10119 |
| reformer net gas | 3"-P600-P-10023 | 395 psi, 160 °F | 1 | 132 | unit 13 receives; unit 15 receives; unit 14 sends (a 3 in branch) | 3"-P600-P-10120 |
| hydrogen | 3"-P600-P-10024 | 545 psi, 160 °F | 2 | 96 | unit 14 sends; unit 16 receives | — |
| surplus hydrogen | 3"-P150-P-10025 | 85 psi, 160 °F | 1 | -48 | unit 14 sends; unit 19 receives | — |
| stabiliser gas | 3"-P150-P-10026 | 95 psi, 160 °F | 2 | 0 | unit 14 sends; unit 19 receives | — |
| reformer liquefied gas | 3"-P300-P-10027 | 275 psi, 160 °F | 2 | -84 | unit 14 sends; unit 17 receives | — |
| reformate | 4"-P150-P-10028 | 75 psi, 150 °F | 2 | 18 | unit 14 sends; the product tankage receives | — |
| heavy naphtha from storage | 6"-P150-P-10029 | 85 psi, 190 °F | 1 | 114 | the product tankage sends; unit 14 receives | — |
| treated kerosene | 4"-P150-P-10030 | 75 psi, 150 °F | 2 | 42 | unit 15 sends; the product tankage receives | — |
| rich amine | 4"-P150-P-10031 | 95 psi, 190 °F | 2 | -30 | unit 16 sends; unit 17 sends; unit 18 receives (a 4 in branch) | 4"-P150-P-10121 |
| treated diesel | 6"-P150-P-10032 | 75 psi, 160 °F | 1 | 138 | unit 16 sends; the product tankage receives | — |
| light cycle oil to hydrotreating | 3"-P150-P-10033 | 105 psi, 190 °F | 2 | 108 | unit 17 sends; unit 16 receives | — |
| lean amine | 6"-P600-P-10034 | 330 psi, 170 °F | 2 | 0 | unit 16 receives; unit 17 receives; unit 18 sends (a 6 in branch) | 6"-P600-P-10122 |
| slurry oil | 3"-P150-P-10035 | 85 psi, 250 °F | 2 | -6 | unit 17 sends; the product tankage receives | — |
| light cycle oil to fuel oil | 4"-P150-P-10036 | 85 psi, 190 °F | 1 | -30 | unit 17 sends; the product tankage receives | — |
| fuel gas | 6"-P150-P-10037 | 95 psi, 165 °F | 1 | -114 | unit 17 sends; unit 19 receives | — |
| cracked gasoline | 6"-P150-P-10038 | 75 psi, 150 °F | 1 | -6 | unit 17 sends; the product tankage receives | — |
| three-carbon liquefied gas | 3"-P300-P-10039 | 265 psi, 160 °F | 2 | 120 | unit 17 sends; the product tankage receives | — |
| four-carbon liquefied gas | 3"-P300-P-10040 | 225 psi, 150 °F | 1 | -144 | unit 17 sends; the product tankage receives | — |
| stripped water to wastewater | 3"-P150-P-10041 | 55 psi, 170 °F | 2 | 96 | unit 18 sends; the wastewater treatment receives | — |
| fire water make-up | 6"-P300-P-10042 | 160 psi, 150 °F | 1 | -30 | unit 19 sends; the fire water tanks receives | — |
| boiler blowdown | 3"-P150-P-10043 | 55 psi, 265 °F | 2 | -72 | unit 19 sends; the wastewater treatment receives | — |
| raw water | 8"-P150-P-10044 | 65 psi, 150 °F | 1 | 0 | the site boundary (the intake) sends; unit 19 receives | — |
| purchased gas | 6"-P150-P-10045 | 95 psi, 150 °F | 1 | -72 | the site boundary (the gas main) sends; unit 19 receives | — |

## Limit spools

Where a party is not yet piped the line ends at a spool of the pipeway's own, with the party's block valve and a blind beyond it (SW-PWY-4).

| Spool | Stands in | At (x, y, z), in | Size, class | Party | Stream | Line | Valve and blind |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PL-1017 | east limit bay | 13860, 318, -96 | 3 in, P150 | the wastewater treatment receives | desalter brine | 3"-P150-P-10001 | 3"-P150-P-10801 |
| PL-1004 | valve bay | 9456, 198, -510 | 3 in, P150 | unit 17 receives | crude overhead gas | 3"-P150-P-10002 | 3"-P150-P-10802 |
| PL-1018 | east limit bay | 13860, 252, 42 | 6 in, P150 | the product tankage sends | straight-run naphtha | 6"-P150-P-10003 | 6"-P150-P-10803 |
| PL-1019 | east limit bay | 13860, 252, 90 | 6 in, P150 | the product tankage receives | straight-run naphtha | 6"-P150-P-10102 | 6"-P150-P-10804 |
| PL-1006 | valve bay | 9492, 198, -510 | 3 in, P150 | unit 17 sends | sour water | 4"-P150-P-10004 | 3"-P150-P-10805 |
| PL-1020 | east limit bay | 13860, 252, -96 | 6 in, P150 | the product tankage receives | straight-run diesel | 6"-P150-P-10006 | 6"-P150-P-10806 |
| PL-1021 | east limit bay | 13860, 252, -120 | 6 in, P150 | the product tankage sends | straight-run diesel | 6"-P150-P-10109 | 6"-P150-P-10807 |
| PL-1005 | valve bay | 9474, 198, -510 | 3 in, P150 | unit 17 receives | atmospheric gas oil | 3"-P150-P-10007 | 3"-P150-P-10808 |
| PL-1022 | east limit bay | 13860, 252, -72 | 6 in, P150 | the product tankage receives | vacuum residue rundown | 6"-P150-P-10010 | 6"-P150-P-10809 |
| PL-1023 | east limit bay | 13860, 408, -150 | 12 in, P150 | the crude tank farm sends | crude | 16"-P150-P-10011 | 12"-P150-P-10810 |
| PL-1024 | east limit bay | 13860, 318, -42 | 3 in, P150 | the product tankage receives | slop oil | 3"-P150-P-10015 | 3"-P150-P-10811 |
| PL-1025 | east limit bay | 13860, 318, -156 | 3 in, P150 | the product tankage receives | light vacuum gas oil | 3"-P150-P-10016 | 3"-P150-P-10812 |
| PL-1011 | valve bay | 9582, 198, -510 | 3 in, P150 | unit 17 receives | light vacuum gas oil | 3"-P150-P-10115 | 3"-P150-P-10813 |
| PL-1026 | east limit bay | 13860, 318, -120 | 3 in, P150 | the product tankage sends | light vacuum gas oil | 3"-P150-P-10116 | 3"-P150-P-10814 |
| PL-1008 | valve bay | 9528, 204, -510 | 6 in, P150 | unit 17 receives | heavy vacuum gas oil | 6"-P150-P-10017 | 6"-P150-P-10815 |
| PL-1003 | valve bay | 9438, 204, -510 | 6 in, P150 | unit 17 receives | stripper gas | 6"-P150-P-10018 | 6"-P150-P-10816 |
| PL-1027 | east limit bay | 13860, 318, 72 | 3 in, P150 | the product tankage receives | light naphtha | 3"-P150-P-10019 | 3"-P150-P-10817 |
| PL-1028 | east limit bay | 13860, 252, 18 | 6 in, P150 | the product tankage receives | heavy naphtha to storage | 6"-P150-P-10021 | 6"-P150-P-10818 |
| PL-1002 | valve bay | 9420, 198, -510 | 3 in, P300 | unit 17 receives | reformer liquefied gas | 3"-P300-P-10027 | 3"-P300-P-10819 |
| PL-1029 | east limit bay | 13860, 318, 18 | 4 in, P150 | the product tankage receives | reformate | 4"-P150-P-10028 | 4"-P150-P-10820 |
| PL-1030 | east limit bay | 13860, 252, 114 | 6 in, P150 | the product tankage sends | heavy naphtha from storage | 6"-P150-P-10029 | 6"-P150-P-10821 |
| PL-1031 | east limit bay | 13860, 318, 42 | 4 in, P150 | the product tankage receives | treated kerosene | 4"-P150-P-10030 | 4"-P150-P-10822 |
| PL-1010 | valve bay | 9564, 198, -510 | 4 in, P150 | unit 17 sends | rich amine | 4"-P150-P-10031 | 4"-P150-P-10823 |
| PL-1032 | east limit bay | 13860, 252, 138 | 6 in, P150 | the product tankage receives | treated diesel | 6"-P150-P-10032 | 6"-P150-P-10824 |
| PL-1007 | valve bay | 9510, 198, -510 | 3 in, P150 | unit 17 sends | light cycle oil to hydrotreating | 3"-P150-P-10033 | 3"-P150-P-10825 |
| PL-1009 | valve bay | 9546, 198, -510 | 4 in, P600 | unit 17 receives | lean amine | 6"-P600-P-10034 | 4"-P600-P-10826 |
| PL-1015 | valve bay | 9654, 198, -510 | 3 in, P150 | unit 17 sends | slurry oil | 3"-P150-P-10035 | 3"-P150-P-10827 |
| PL-1033 | east limit bay | 13860, 318, -6 | 3 in, P150 | the product tankage receives | slurry oil | 3"-P150-P-10035 | 3"-P150-P-10828 |
| PL-1014 | valve bay | 9636, 198, -510 | 4 in, P150 | unit 17 sends | light cycle oil to fuel oil | 4"-P150-P-10036 | 4"-P150-P-10829 |
| PL-1034 | east limit bay | 13860, 246, -30 | 3 in, P150 | the product tankage receives | light cycle oil to fuel oil | 4"-P150-P-10036 | 3"-P150-P-10830 |
| PL-1001 | valve bay | 9402, 198, -510 | 4 in, P150 | unit 17 sends | fuel gas | 6"-P150-P-10037 | 4"-P150-P-10831 |
| PL-1012 | valve bay | 9600, 204, -510 | 6 in, P150 | unit 17 sends | cracked gasoline | 6"-P150-P-10038 | 6"-P150-P-10832 |
| PL-1035 | east limit bay | 13860, 252, -6 | 6 in, P150 | the product tankage receives | cracked gasoline | 6"-P150-P-10038 | 6"-P150-P-10833 |
| PL-1016 | valve bay | 9672, 198, -510 | 3 in, P300 | unit 17 sends | three-carbon liquefied gas | 3"-P300-P-10039 | 3"-P300-P-10834 |
| PL-1036 | east limit bay | 13860, 318, 120 | 3 in, P300 | the product tankage receives | three-carbon liquefied gas | 3"-P300-P-10039 | 3"-P300-P-10835 |
| PL-1013 | valve bay | 9618, 198, -510 | 3 in, P300 | unit 17 sends | four-carbon liquefied gas | 3"-P300-P-10040 | 3"-P300-P-10836 |
| PL-1037 | east limit bay | 13860, 246, -144 | 3 in, P300 | the product tankage receives | four-carbon liquefied gas | 3"-P300-P-10040 | 3"-P300-P-10837 |
| PL-1038 | east limit bay | 13860, 318, 96 | 3 in, P150 | the wastewater treatment receives | stripped water to wastewater | 3"-P150-P-10041 | 3"-P150-P-10838 |
| PL-1039 | west limit bay | 60, 252, -30 | 6 in, P300 | the fire water tanks receives | fire water make-up | 6"-P300-P-10042 | 6"-P300-P-10839 |
| PL-1040 | east limit bay | 13860, 318, -72 | 3 in, P150 | the wastewater treatment receives | boiler blowdown | 3"-P150-P-10043 | 3"-P150-P-10840 |
| PL-1041 | west limit bay | 60, 252, 0 | 8 in, P150 | the site boundary (the intake) sends | raw water | 8"-P150-P-10044 | 8"-P150-P-10841 |
| PL-1042 | west limit bay | 60, 252, -72 | 6 in, P150 | the site boundary (the gas main) sends | purchased gas | 6"-P150-P-10045 | 6"-P150-P-10842 |

## Junction frames

At each unit's limit: two posts in line with the columns of the unit's rack and a beam between them under each main tier, from which the lines that cross to the rack hang (SW-PWY-9).

| Unit | Along the rack, x in | Side | Span, ft | Beams under main tiers | Beam | Posts |
| --- | --- | --- | --- | --- | --- | --- |
| 11 | 4260 | north | 30 | 1, 2, 3 | W18x50 | W16x45 |
| 12 | 7146 | north | 24 | 1, 2, 3 | W16x45 | W14x40 |
| 13 | 882 | south | 24 | 1, 2, 3 | W16x45 | W14x40 |
| 14 | 2802 | south | 24 | 1, 2, 3 | W16x45 | W14x40 |
| 15 | 5064 | south | 24 | 1, 2, 3 | W16x45 | W14x40 |
| 16 | 7008 | south | 24 | 1, 2, 3 | W16x45 | W14x40 |
| 17 | 9540 | north | 30 | 1, 2, 3 | W18x50 | W16x45 |
| 18 | 9204 | south | 24 | 1, 2, 3 | W16x45 | W14x40 |
| 19 | 2346 | north | 24 | 1, 2, 3 | W16x45 | W14x40 |

## Not on the main pipeway

| Stream | Why |
| --- | --- |
| cooling tower blowdown | its line in unit 19 stands on another plot of that unit: with that plot, a later stage |
| tank farm oily water | between the crude tank farm and the wastewater treatment: for those areas' own pipeways |
| crude from the marine terminal | between the marine terminal and the crude tank farm: for those areas' own pipeways |
| slop oil to crude | between the product tankage and the crude tank farm: for those areas' own pipeways |
| three-carbon liquefied gas to loading | between the product tankage and the truck loading: for those areas' own pipeways |
| four-carbon liquefied gas to loading | between the product tankage and the truck loading: for those areas' own pipeways |
| gasoline to the marine terminal | between the product tankage and the marine terminal: for those areas' own pipeways |
| gasoline to truck loading | between the product tankage and the truck loading: for those areas' own pipeways |
| jet fuel to the marine terminal | between the product tankage and the marine terminal: for those areas' own pipeways |
| jet fuel to truck loading | between the product tankage and the truck loading: for those areas' own pipeways |
| diesel to the marine terminal | between the product tankage and the marine terminal: for those areas' own pipeways |
| diesel to truck loading | between the product tankage and the truck loading: for those areas' own pipeways |
| fuel oil to the marine terminal | between the product tankage and the marine terminal: for those areas' own pipeways |
| asphalt to truck loading | between the product tankage and the truck loading: for those areas' own pipeways |
| treated effluent | between the wastewater treatment and the site boundary: for those areas' own pipeways |
| flare header | between the flare and the site boundary: for those areas' own pipeways |
| fire water ring main | between the fire water tanks and the site boundary: for those areas' own pipeways |
| X-1903 make-up (unit 19, BL-1903) | a line of the unit to an item of its own on another plot: with that plot, a later stage |
| high-pressure steam | a utility header: the next stage of the pipeway (SW-PWY-10) |
| medium-pressure steam | a utility header: the next stage of the pipeway (SW-PWY-10) |
| low-pressure steam | a utility header: the next stage of the pipeway (SW-PWY-10) |
| condensate | a utility header: the next stage of the pipeway (SW-PWY-10) |
| boiler feed water | a utility header: the next stage of the pipeway (SW-PWY-10) |
| cooling water supply | a utility header: the next stage of the pipeway (SW-PWY-10) |
| cooling water return | a utility header: the next stage of the pipeway (SW-PWY-10) |
| fuel gas to users | a utility header: the next stage of the pipeway (SW-PWY-10) |
| instrument air | a utility header: the next stage of the pipeway (SW-PWY-10) |
| plant air | a utility header: the next stage of the pipeway (SW-PWY-10) |
| nitrogen | a utility header: the next stage of the pipeway (SW-PWY-10) |
| service water | a utility header: the next stage of the pipeway (SW-PWY-10) |
| caustic | a utility header: the next stage of the pipeway (SW-PWY-10) |

## Notes

- Not on the main pipeway, though their streams are: slop oil: the marine terminal; slop oil: the truck loading; slop oil: the wastewater treatment; slop oil: the flare. What an area beyond the bench sends to another such area, or takes from one, runs on those areas' own pipeways (SW-PWY-3).
- 3"-P150-P-10001: no valve at BL-1103-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10001: no valve at PL-1017-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10002: no valve at BL-1104-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10002: no valve at PL-1004-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 6"-P150-P-10003: no valve at PL-1018-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10003: no valve at BL-1301-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10101: no valve at BL-1105-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10102: no valve at PL-1019-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 4"-P150-P-10004: no valve at BL-1305-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 4"-P150-P-10004: no valve at PL-1006-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10103: no valve at BL-1106-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10104: no valve at BL-1504-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10105: no valve at BL-1607-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10106: no valve at BL-1203-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 4"-P150-P-10107: no valve at BL-1803-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 4"-P150-P-10005: no valve at BL-1107-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 4"-P150-P-10005: no valve at BL-1501-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 6"-P150-P-10006: no valve at BL-1108-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10006: no valve at PL-1020-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10108: no valve at BL-1601-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10109: no valve at PL-1021-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 3"-P150-P-10007: no valve at BL-1109-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10007: no valve at PL-1005-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 8"-P300-P-10008: no valve at BL-1110-P; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.7 in longer (SW-RPI-14)
- 8"-P300-P-10008: no valve at BL-1201-P; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.7 in longer (SW-RPI-14)
- 8"-P300-P-10009: no valve at BL-1112-P; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.7 in longer (SW-RPI-14)
- 8"-P300-P-10009: no valve at BL-1207-P; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.7 in longer (SW-RPI-14)
- 6"-P150-P-10010: no valve at BL-1114-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10010: no valve at PL-1022-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 16"-P150-P-10011: no valve at PL-1023-P; GATE 12 and what stood with it left out, 3 pieces, the pipe 22.6 in longer (SW-RPI-14)
- 16"-P150-P-10011: no valve at BL-1101-P; GATE 16 and what stood with it left out, 3 pieces, the pipe 25.9 in longer (SW-RPI-14)
- 4"-P150-P-10012: no valve at BL-1805-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 4"-P150-P-10012: no valve at BL-1304-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 4"-P150-P-10110: no valve at BL-1102-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 3"-P150-P-10111: no valve at BL-1503-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10112: no valve at BL-1606-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 10"-P300-P-10013: no valve at BL-1205-P; GATE 10 and what stood with it left out, 3 pieces, the pipe 20.0 in longer (SW-RPI-14)
- 10"-P300-P-10013: no valve at BL-1111-P; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.7 in longer (SW-RPI-14)
- 6"-P600-P-10014: no valve at BL-1208-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P600-P-10014: no valve at BL-1113-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 3"-P150-P-10015: no valve at BL-1920-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10015: no valve at PL-1024-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10113: no valve at BL-1202-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10114: no valve at BL-1804-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10016: no valve at BL-1204-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10016: no valve at PL-1025-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10115: no valve at PL-1011-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10116: no valve at PL-1026-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 6"-P150-P-10017: no valve at BL-1206-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10017: no valve at PL-1008-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10018: no valve at BL-1306-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 6"-P150-P-10018: no valve at PL-1003-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 3"-P150-P-10117: no valve at BL-1505-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10118: no valve at BL-1608-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10019: no valve at BL-1307-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10019: no valve at PL-1027-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 6"-P150-P-10020: no valve at BL-1308-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10020: no valve at BL-1401-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10021: no valve at BL-1309-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10021: no valve at PL-1028-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 3"-P150-P-10022: no valve at BL-1609-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10022: no valve at BL-1302-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10119: no valve at BL-1506-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P600-P-10023: no valve at BL-1303-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P600-P-10023: no valve at BL-1502-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P600-P-10120: no valve at BL-1403-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P600-P-10024: no valve at BL-1404-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P600-P-10024: no valve at BL-1605-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10025: no valve at BL-1405-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10025: no valve at BL-1916-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10026: no valve at BL-1406-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10026: no valve at BL-1917-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P300-P-10027: no valve at BL-1407-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P300-P-10027: no valve at PL-1002-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 4"-P150-P-10028: no valve at BL-1408-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 4"-P150-P-10028: no valve at PL-1029-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 6"-P150-P-10029: no valve at PL-1030-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10029: no valve at BL-1402-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 4"-P150-P-10030: no valve at BL-1507-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 4"-P150-P-10030: no valve at PL-1031-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 4"-P150-P-10031: no valve at BL-1604-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 4"-P150-P-10031: no valve at PL-1010-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 4"-P150-P-10121: no valve at BL-1801-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 6"-P150-P-10032: no valve at BL-1610-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10032: no valve at PL-1032-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 3"-P150-P-10033: no valve at PL-1007-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10033: no valve at BL-1602-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 6"-P600-P-10034: no valve at BL-1603-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 6"-P600-P-10034: no valve at PL-1009-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 6"-P600-P-10122: no valve at BL-1802-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 3"-P150-P-10035: no valve at PL-1015-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10035: no valve at PL-1033-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 4"-P150-P-10036: no valve at PL-1014-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 4"-P150-P-10036: no valve at PL-1034-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 6"-P150-P-10037: no valve at PL-1001-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 6"-P150-P-10037: no valve at BL-1915-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10038: no valve at PL-1012-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10038: no valve at PL-1035-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 3"-P300-P-10039: no valve at PL-1016-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P300-P-10039: no valve at PL-1036-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P300-P-10040: no valve at PL-1013-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P300-P-10040: no valve at PL-1037-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10041: no valve at BL-1806-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10041: no valve at PL-1038-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 6"-P300-P-10042: no valve at BL-1904-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P300-P-10042: no valve at PL-1039-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 3"-P150-P-10043: no valve at BL-1910-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10043: no valve at PL-1040-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 8"-P150-P-10044: no valve at PL-1041-P; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.7 in longer (SW-RPI-14)
- 8"-P150-P-10044: no valve at BL-1901-P; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.7 in longer (SW-RPI-14)
- 6"-P150-P-10045: no valve at PL-1042-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10045: no valve at BL-1918-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 3"-P150-P-10001/p34 (40.4 ft, far end 13843,318,-96): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 3"-P150-P-10007/p13 (40.2 ft, far end 5776,318,-120): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 16"-P150-P-10011/p8 (41.6 ft, far end 13333,408,-150): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 3"-P150-P-10015/p43 (40.5 ft, far end 13843,318,-42): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 3"-P150-P-10019/p43 (40.9 ft, far end 13843,318,72): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 6"-P150-P-10021/p22 (40.1 ft, far end 4577,252,18): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 3"-P300-P-10027/p24 (40.1 ft, far end 6619,318,-84): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 4"-P150-P-10028/p37 (41.0 ft, far end 13842,318,18): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 6"-P150-P-10029/p7 (41.0 ft, far end 13352,252,114): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 6"-P150-P-10038/p23 (40.5 ft, far end 13844,252,-6): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 3"-P300-P-10040/p23 (40.1 ft, far end 13843,246,-144): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 3"-P150-P-10043/p40 (40.9 ft, far end 13843,318,-72): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 4"-P150-P-10110/p8 (pipe) passes rack-bent:120/beam/unit-11 at 0.30 in from the round the check holds that member by and 6.40 in from its section (SW-RPI-13)
- 3"-P150-P-10111/p5 (pipe) passes rack-bent:120/beam/unit-15 at 1.87 in from the round the check holds that member by and 7.30 in from its section (SW-RPI-13)
- 3"-P150-P-10115/p5 (pipe) passes rack-bent:120/beam/unit-17 at 0.80 in from the round the check holds that member by and 6.90 in from its section (SW-RPI-13)
- 6"-P150-P-10018/A7 (reducer) passes rack-bent:120/beam/unit-13 at 2.86 in from the round the check holds that member by and 3.02 in from its section (SW-RPI-13)
- 6"-P150-P-10018/p8 (pipe) passes rack-bent:120/beam/unit-13 at 2.38 in from the round the check holds that member by and 3.00 in from its section (SW-RPI-13)
- 6"-P600-P-10034/p8 (pipe) passes rack-bent:120/beam/unit-16 at 2.38 in from the round the check holds that member by and 3.00 in from its section (SW-RPI-13)
- 6"-P600-P-10034/p27 (pipe) passes rack-bent:120/beam/unit-17 at 2.31 in from the round the check holds that member by and 3.00 in from its section (SW-RPI-13)
- 6"-P150-P-10037/p8 (pipe) passes rack-bent:120/beam/unit-17 at 2.31 in from the round the check holds that member by and 3.00 in from its section (SW-RPI-13)

## Lines

| Line | Kind | Stream | Fluid | From | To | Design | Tier | Components | Welds | Supports | Length, ft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3"-P150-P-10001 | main | desalter brine | oily water | BL-1103-P | PL-1017-P | 110 psi, 160 °F | 2 | 33 | 30 | 80 | 826 |
| 3"-P150-P-10801 | limit | desalter brine | oily water | PL-1017-U | blind | 110 psi, 160 °F | — | 4 | 0 | 0 | 1 |
| 3"-P150-P-10002 | main | crude overhead gas | hydrocarbon gas | BL-1104-P | PL-1004-P | 50 psi, 150 °F | 2 | 27 | 24 | 46 | 501 |
| 3"-P150-P-10802 | limit | crude overhead gas | hydrocarbon gas | PL-1004-U | blind | 50 psi, 150 °F | — | 4 | 0 | 0 | 1 |
| 6"-P150-P-10003 | main | straight-run naphtha | naphtha | PL-1018-P | BL-1301-P | 135 psi, 150 °F | 1 | 39 | 36 | 56 | 1113 |
| 6"-P150-P-10101 | branch | straight-run naphtha | naphtha | BL-1105-P | tap 6"-P150-P-10003 | 135 psi, 150 °F | — | 6 | 5 | 2 | 45 |
| 6"-P150-P-10102 | branch | straight-run naphtha | naphtha | tap 6"-P150-P-10003 | PL-1019-P | 135 psi, 150 °F | — | 5 | 4 | 0 | 3 |
| 6"-P150-P-10803 | limit | straight-run naphtha | naphtha | PL-1018-U | blind | 135 psi, 150 °F | — | 4 | 0 | 0 | 1 |
| 6"-P150-P-10804 | limit | straight-run naphtha | naphtha | PL-1019-U | blind | 135 psi, 150 °F | — | 4 | 0 | 0 | 1 |
| 4"-P150-P-10004 | main | sour water | sour water | BL-1305-P | PL-1006-P | 85 psi, 190 °F | 2 | 48 | 45 | 40 | 827 |
| 3"-P150-P-10103 | branch | sour water | sour water | BL-1106-P | tap 4"-P150-P-10004 | 85 psi, 190 °F | — | 9 | 8 | 2 | 47 |
| 3"-P150-P-10104 | branch | sour water | sour water | BL-1504-P | tap 4"-P150-P-10004 | 85 psi, 190 °F | — | 9 | 8 | 2 | 50 |
| 3"-P150-P-10105 | branch | sour water | sour water | BL-1607-P | tap 4"-P150-P-10004 | 85 psi, 190 °F | — | 9 | 8 | 2 | 50 |
| 3"-P150-P-10106 | branch | sour water | sour water | BL-1203-P | tap 4"-P150-P-10004 | 85 psi, 190 °F | — | 9 | 8 | 2 | 47 |
| 4"-P150-P-10107 | branch | sour water | sour water | tap 4"-P150-P-10004 | BL-1803-P | 85 psi, 190 °F | — | 6 | 5 | 2 | 44 |
| 3"-P150-P-10805 | limit | sour water | sour water | PL-1006-U | blind | 85 psi, 190 °F | — | 4 | 0 | 0 | 1 |
| 4"-P150-P-10005 | main | straight-run kerosene | kerosene | BL-1107-P | BL-1501-P | 105 psi, 150 °F | 1 | 16 | 13 | 8 | 167 |
| 6"-P150-P-10006 | main | straight-run diesel | diesel | BL-1108-P | PL-1020-P | 105 psi, 190 °F | 1 | 32 | 29 | 40 | 821 |
| 6"-P150-P-10108 | branch | straight-run diesel | diesel | tap 6"-P150-P-10006 | BL-1601-P | 105 psi, 190 °F | — | 6 | 5 | 3 | 49 |
| 6"-P150-P-10109 | branch | straight-run diesel | diesel | PL-1021-P | tap 6"-P150-P-10006 | 105 psi, 190 °F | — | 5 | 4 | 0 | 1 |
| 6"-P150-P-10806 | limit | straight-run diesel | diesel | PL-1020-U | blind | 105 psi, 190 °F | — | 4 | 0 | 0 | 1 |
| 6"-P150-P-10807 | limit | straight-run diesel | diesel | PL-1021-U | blind | 105 psi, 190 °F | — | 4 | 0 | 0 | 1 |
| 3"-P150-P-10007 | main | atmospheric gas oil | gas oil | BL-1109-P | PL-1005-P | 125 psi, 430 °F | 2 | 28 | 25 | 44 | 501 |
| 3"-P150-P-10808 | limit | atmospheric gas oil | gas oil | PL-1005-U | blind | 125 psi, 430 °F | — | 4 | 0 | 0 | 1 |
| 8"-P300-P-10008 | main | atmospheric residue | residue | BL-1110-P | BL-1201-P | 175 psi, 700 °F | 1 | 23 | 20 | 14 | 321 |
| 8"-P300-P-10009 | main | vacuum gas oil pumparound return | gas oil | BL-1112-P | BL-1207-P | 260 psi, 500 °F | 1 | 18 | 15 | 15 | 313 |
| 6"-P150-P-10010 | main | vacuum residue rundown | residue | BL-1114-P | PL-1022-P | 135 psi, 400 °F | 1 | 29 | 26 | 42 | 831 |
| 6"-P150-P-10809 | limit | vacuum residue rundown | residue | PL-1022-U | blind | 135 psi, 400 °F | — | 4 | 0 | 0 | 1 |
| 16"-P150-P-10011 | main | crude | crude oil | PL-1023-P | BL-1101-P | 120 psi, 150 °F | 3 | 30 | 27 | 41 | 823 |
| 12"-P150-P-10810 | limit | crude | crude oil | PL-1023-U | blind | 120 psi, 150 °F | — | 4 | 0 | 0 | 2 |
| 4"-P150-P-10012 | main | stripped water | process and wash water | BL-1805-P | BL-1304-P | 125 psi, 170 °F | 2 | 41 | 38 | 38 | 793 |
| 4"-P150-P-10110 | branch | stripped water | process and wash water | tap 4"-P150-P-10012 | BL-1102-P | 125 psi, 170 °F | — | 14 | 13 | 2 | 54 |
| 3"-P150-P-10111 | branch | stripped water | process and wash water | tap 4"-P150-P-10012 | BL-1503-P | 125 psi, 170 °F | — | 9 | 8 | 2 | 46 |
| 3"-P150-P-10112 | branch | stripped water | process and wash water | tap 4"-P150-P-10012 | BL-1606-P | 125 psi, 170 °F | — | 9 | 8 | 1 | 41 |
| 10"-P300-P-10013 | main | vacuum gas oil pumparound supply | gas oil | BL-1205-P | BL-1111-P | 260 psi, 600 °F | 1 | 24 | 21 | 14 | 323 |
| 6"-P600-P-10014 | main | vacuum residue hot | residue | BL-1208-P | BL-1113-P | 155 psi, 740 °F | 1 | 27 | 24 | 14 | 312 |
| 3"-P150-P-10015 | main | slop oil | oily water | BL-1920-P | PL-1024-P | 65 psi, 200 °F | 2 | 42 | 39 | 95 | 992 |
| 3"-P150-P-10113 | branch | slop oil | oily water | BL-1202-P | tap 3"-P150-P-10015 | 65 psi, 200 °F | — | 15 | 14 | 1 | 48 |
| 3"-P150-P-10114 | branch | slop oil | oily water | BL-1804-P | tap 3"-P150-P-10015 | 65 psi, 200 °F | — | 9 | 8 | 2 | 53 |
| 3"-P150-P-10811 | limit | slop oil | oily water | PL-1024-U | blind | 65 psi, 200 °F | — | 4 | 0 | 0 | 1 |
| 3"-P150-P-10016 | main | light vacuum gas oil | gas oil | BL-1204-P | PL-1025-P | 105 psi, 200 °F | 2 | 26 | 23 | 56 | 585 |
| 3"-P150-P-10115 | branch | light vacuum gas oil | gas oil | tap 3"-P150-P-10016 | PL-1011-P | 105 psi, 200 °F | — | 9 | 8 | 1 | 35 |
| 3"-P150-P-10116 | branch | light vacuum gas oil | gas oil | PL-1026-P | tap 3"-P150-P-10016 | 105 psi, 200 °F | — | 5 | 4 | 0 | 3 |
| 3"-P150-P-10812 | limit | light vacuum gas oil | gas oil | PL-1025-U | blind | 105 psi, 200 °F | — | 4 | 0 | 0 | 1 |
| 3"-P150-P-10813 | limit | light vacuum gas oil | gas oil | PL-1011-U | blind | 105 psi, 200 °F | — | 4 | 0 | 0 | 1 |
| 3"-P150-P-10814 | limit | light vacuum gas oil | gas oil | PL-1026-U | blind | 105 psi, 200 °F | — | 4 | 0 | 0 | 1 |
| 6"-P150-P-10017 | main | heavy vacuum gas oil | gas oil | BL-1206-P | PL-1008-P | 125 psi, 450 °F | 1 | 19 | 16 | 13 | 277 |
| 6"-P150-P-10815 | limit | heavy vacuum gas oil | gas oil | PL-1008-U | blind | 125 psi, 450 °F | — | 4 | 0 | 0 | 1 |
| 6"-P150-P-10018 | main | stripper gas | hydrocarbon gas | BL-1306-P | PL-1003-P | 50 psi, 190 °F | 1 | 33 | 30 | 40 | 808 |
| 3"-P150-P-10117 | branch | stripper gas | hydrocarbon gas | BL-1505-P | tap 6"-P150-P-10018 | 50 psi, 190 °F | — | 6 | 5 | 2 | 37 |
| 3"-P150-P-10118 | branch | stripper gas | hydrocarbon gas | BL-1608-P | tap 6"-P150-P-10018 | 50 psi, 190 °F | — | 6 | 5 | 2 | 37 |
| 6"-P150-P-10816 | limit | stripper gas | hydrocarbon gas | PL-1003-U | blind | 50 psi, 190 °F | — | 4 | 0 | 0 | 1 |
| 3"-P150-P-10019 | main | light naphtha | naphtha | BL-1307-P | PL-1027-P | 75 psi, 150 °F | 2 | 42 | 39 | 108 | 1118 |
| 3"-P150-P-10817 | limit | light naphtha | naphtha | PL-1027-U | blind | 75 psi, 150 °F | — | 4 | 0 | 0 | 1 |
| 6"-P150-P-10020 | main | hydrotreated heavy naphtha | naphtha | BL-1308-P | BL-1401-P | 85 psi, 360 °F | 1 | 17 | 14 | 10 | 233 |
| 6"-P150-P-10021 | main | heavy naphtha to storage | naphtha | BL-1309-P | PL-1028-P | 75 psi, 190 °F | 1 | 41 | 38 | 54 | 1126 |
| 6"-P150-P-10818 | limit | heavy naphtha to storage | naphtha | PL-1028-U | blind | 75 psi, 190 °F | — | 4 | 0 | 0 | 1 |
| 3"-P150-P-10022 | main | wild naphtha | naphtha | BL-1609-P | BL-1302-P | 105 psi, 170 °F | 2 | 31 | 28 | 54 | 580 |
| 3"-P150-P-10119 | branch | wild naphtha | naphtha | BL-1506-P | tap 3"-P150-P-10022 | 105 psi, 170 °F | — | 11 | 10 | 2 | 42 |
| 3"-P600-P-10023 | main | reformer net gas | hydrogen-rich gas | BL-1303-P | BL-1502-P | 395 psi, 160 °F | 1 | 23 | 20 | 40 | 418 |
| 3"-P600-P-10120 | branch | reformer net gas | hydrogen-rich gas | BL-1403-P | tap 3"-P600-P-10023 | 395 psi, 160 °F | — | 5 | 4 | 2 | 29 |
| 3"-P600-P-10024 | main | hydrogen | hydrogen-rich gas | BL-1404-P | BL-1605-P | 545 psi, 160 °F | 2 | 25 | 22 | 38 | 436 |
| 3"-P150-P-10025 | main | surplus hydrogen | hydrogen-rich gas | BL-1405-P | BL-1916-P | 85 psi, 160 °F | 1 | 17 | 14 | 9 | 130 |
| 3"-P150-P-10026 | main | stabiliser gas | fuel gas | BL-1406-P | BL-1917-P | 95 psi, 160 °F | 2 | 18 | 15 | 8 | 123 |
| 3"-P300-P-10027 | main | reformer liquefied gas | liquefied petroleum gas | BL-1407-P | PL-1002-P | 275 psi, 160 °F | 2 | 37 | 34 | 60 | 649 |
| 3"-P300-P-10819 | limit | reformer liquefied gas | liquefied petroleum gas | PL-1002-U | blind | 275 psi, 160 °F | — | 4 | 0 | 0 | 1 |
| 4"-P150-P-10028 | main | reformate | reformate | BL-1408-P | PL-1029-P | 75 psi, 150 °F | 2 | 36 | 33 | 47 | 961 |
| 4"-P150-P-10820 | limit | reformate | reformate | PL-1029-U | blind | 75 psi, 150 °F | — | 4 | 0 | 0 | 1 |
| 6"-P150-P-10029 | main | heavy naphtha from storage | naphtha | PL-1030-P | BL-1402-P | 85 psi, 190 °F | 1 | 32 | 29 | 47 | 948 |
| 6"-P150-P-10821 | limit | heavy naphtha from storage | naphtha | PL-1030-U | blind | 85 psi, 190 °F | — | 4 | 0 | 0 | 1 |
| 4"-P150-P-10030 | main | treated kerosene | kerosene | BL-1507-P | PL-1031-P | 75 psi, 150 °F | 2 | 31 | 28 | 37 | 774 |
| 4"-P150-P-10822 | limit | treated kerosene | kerosene | PL-1031-U | blind | 75 psi, 150 °F | — | 4 | 0 | 0 | 1 |
| 4"-P150-P-10031 | main | rich amine | amine solution | BL-1604-P | PL-1010-P | 95 psi, 190 °F | 2 | 28 | 25 | 12 | 320 |
| 4"-P150-P-10121 | branch | rich amine | amine solution | tap 4"-P150-P-10031 | BL-1801-P | 95 psi, 190 °F | — | 6 | 5 | 2 | 51 |
| 4"-P150-P-10823 | limit | rich amine | amine solution | PL-1010-U | blind | 95 psi, 190 °F | — | 4 | 0 | 0 | 1 |
| 6"-P150-P-10032 | main | treated diesel | diesel | BL-1610-P | PL-1032-P | 75 psi, 160 °F | 1 | 23 | 20 | 29 | 598 |
| 6"-P150-P-10824 | limit | treated diesel | diesel | PL-1032-U | blind | 75 psi, 160 °F | — | 4 | 0 | 0 | 1 |
| 3"-P150-P-10033 | main | light cycle oil to hydrotreating | diesel | PL-1007-P | BL-1602-P | 105 psi, 190 °F | 2 | 22 | 19 | 25 | 304 |
| 3"-P150-P-10825 | limit | light cycle oil to hydrotreating | diesel | PL-1007-U | blind | 105 psi, 190 °F | — | 4 | 0 | 0 | 1 |
| 6"-P600-P-10034 | main | lean amine | amine solution | BL-1603-P | PL-1009-P | 330 psi, 170 °F | 2 | 26 | 23 | 14 | 316 |
| 6"-P600-P-10122 | branch | lean amine | amine solution | BL-1802-P | tap 6"-P600-P-10034 | 330 psi, 170 °F | — | 9 | 8 | 1 | 47 |
| 4"-P600-P-10826 | limit | lean amine | amine solution | PL-1009-U | blind | 330 psi, 170 °F | — | 4 | 0 | 0 | 1 |
| 3"-P150-P-10035 | main | slurry oil | slurry oil | PL-1015-P | PL-1033-P | 85 psi, 250 °F | 2 | 21 | 18 | 36 | 396 |
| 3"-P150-P-10827 | limit | slurry oil | slurry oil | PL-1015-U | blind | 85 psi, 250 °F | — | 4 | 0 | 0 | 1 |
| 3"-P150-P-10828 | limit | slurry oil | slurry oil | PL-1033-U | blind | 85 psi, 250 °F | — | 4 | 0 | 0 | 1 |
| 4"-P150-P-10036 | main | light cycle oil to fuel oil | diesel | PL-1014-P | PL-1034-P | 85 psi, 190 °F | 1 | 19 | 16 | 19 | 389 |
| 4"-P150-P-10829 | limit | light cycle oil to fuel oil | diesel | PL-1014-U | blind | 85 psi, 190 °F | — | 4 | 0 | 0 | 1 |
| 3"-P150-P-10830 | limit | light cycle oil to fuel oil | diesel | PL-1034-U | blind | 85 psi, 190 °F | — | 4 | 0 | 0 | 1 |
| 6"-P150-P-10037 | main | fuel gas | fuel gas | PL-1001-P | BL-1915-P | 95 psi, 165 °F | 1 | 28 | 25 | 32 | 652 |
| 4"-P150-P-10831 | limit | fuel gas | fuel gas | PL-1001-U | blind | 95 psi, 165 °F | — | 4 | 0 | 0 | 1 |
| 6"-P150-P-10038 | main | cracked gasoline | gasoline | PL-1012-P | PL-1035-P | 75 psi, 150 °F | 1 | 22 | 19 | 19 | 397 |
| 6"-P150-P-10832 | limit | cracked gasoline | gasoline | PL-1012-U | blind | 75 psi, 150 °F | — | 4 | 0 | 0 | 1 |
| 6"-P150-P-10833 | limit | cracked gasoline | gasoline | PL-1035-U | blind | 75 psi, 150 °F | — | 4 | 0 | 0 | 1 |
| 3"-P300-P-10039 | main | three-carbon liquefied gas | liquefied petroleum gas | PL-1016-P | PL-1036-P | 265 psi, 160 °F | 2 | 22 | 19 | 37 | 405 |
| 3"-P300-P-10834 | limit | three-carbon liquefied gas | liquefied petroleum gas | PL-1016-U | blind | 265 psi, 160 °F | — | 4 | 0 | 0 | 1 |
| 3"-P300-P-10835 | limit | three-carbon liquefied gas | liquefied petroleum gas | PL-1036-U | blind | 265 psi, 160 °F | — | 4 | 0 | 0 | 1 |
| 3"-P300-P-10040 | main | four-carbon liquefied gas | liquefied petroleum gas | PL-1013-P | PL-1037-P | 225 psi, 150 °F | 1 | 22 | 19 | 35 | 384 |
| 3"-P300-P-10836 | limit | four-carbon liquefied gas | liquefied petroleum gas | PL-1013-U | blind | 225 psi, 150 °F | — | 4 | 0 | 0 | 1 |
| 3"-P300-P-10837 | limit | four-carbon liquefied gas | liquefied petroleum gas | PL-1037-U | blind | 225 psi, 150 °F | — | 4 | 0 | 0 | 1 |
| 3"-P150-P-10041 | main | stripped water to wastewater | oily water | BL-1806-P | PL-1038-P | 55 psi, 170 °F | 2 | 18 | 15 | 40 | 429 |
| 3"-P150-P-10838 | limit | stripped water to wastewater | oily water | PL-1038-U | blind | 55 psi, 170 °F | — | 4 | 0 | 0 | 1 |
| 6"-P300-P-10042 | main | fire water make-up | raw and service water | BL-1904-P | PL-1039-P | 160 psi, 150 °F | 1 | 17 | 14 | 11 | 235 |
| 6"-P300-P-10839 | limit | fire water make-up | raw and service water | PL-1039-U | blind | 160 psi, 150 °F | — | 4 | 0 | 0 | 1 |
| 3"-P150-P-10043 | main | boiler blowdown | oily water | BL-1910-P | PL-1040-P | 55 psi, 265 °F | 2 | 39 | 36 | 96 | 998 |
| 3"-P150-P-10840 | limit | boiler blowdown | oily water | PL-1040-U | blind | 55 psi, 265 °F | — | 4 | 0 | 0 | 1 |
| 8"-P150-P-10044 | main | raw water | raw and service water | PL-1041-P | BL-1901-P | 65 psi, 150 °F | 1 | 14 | 11 | 11 | 226 |
| 8"-P150-P-10841 | limit | raw water | raw and service water | PL-1041-U | blind | 65 psi, 150 °F | — | 4 | 0 | 0 | 2 |
| 6"-P150-P-10045 | main | purchased gas | fuel gas | PL-1042-P | BL-1918-P | 95 psi, 150 °F | 1 | 13 | 10 | 11 | 221 |
| 6"-P150-P-10842 | limit | purchased gas | fuel gas | PL-1042-U | blind | 95 psi, 150 °F | — | 4 | 0 | 0 | 1 |

