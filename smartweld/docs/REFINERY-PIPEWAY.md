# Plant 3: the main pipeway

> **Demonstration data.** Written by `tools/refinery-pipeway.ts`; do not edit by hand.

The main pipeway joins the units (DESIGN_BASIS.md §80): a rack 1160 ft long and 30 ft wide down the corridor between the two rows, tiers at 20, 26, 33 ft, and on it a line for every stream between units that has a party on the process bench, from one unit's battery-limit spool to the other's, and on its top tier the plant's utility headers with a branch to each unit. It is piped in its own frame by the generator of plants 1 and 2, unchanged, as each unit is: what the generator is given is the rack, the units' spools as connections, a line list drawn from the process model's streams, and where lines may travel. Its own checks (§40) are then run on the result against the steel as it stands, and reported here as they come out.

| Lines | Routed | Components | Welds | Supports | Pipe, ft | Failures | Checks not at zero |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 145 | 145 | 2,442 | 2,129 | 2,430 | 38,333 | 0 | none |

145 lines: 45 streams' lines; 22 branches to the further parties of streams that have more than two; 9 utility headers and the 43 branches from them to their parties (SW-PWY-11, SW-PWY-12); and 26 valves with their blinds beyond the limit spools (SW-PWY-4). The lines that run the rack are on 3 of its tiers (tier 1 25 lines, tier 2 19 lines, tier 3 10 lines), each in a lane given it beforehand, no tier loaded beyond 132 in of lanes at any section; the middle of the top tier is the utility headers'. The generator was run 46 times: once for each stream's line that runs the rack, with its branches, and once for the rest, the headers and their branches among it.

| Component | Count |
| --- | --- |
| blind | 26 |
| cap | 18 |
| elbow | 464 |
| flange | 155 |
| gasket | 207 |
| olet | 21 |
| pipe | 1457 |
| reducer | 24 |
| tee | 44 |
| valve | 26 |

| Welds | Count |
| --- | --- |
| BW, field | 275 |
| BW, shop | 1833 |
| FW, shop | 21 |

| Supports | Count |
| --- | --- |
| anchor | 54 |
| guide | 209 |
| hanger | 218 |
| shoe | 1942 |
| stanchion | 5 |
| trapeze | 2 |

## Checks

| Check (the generator's own, §40) | Found |
| --- | --- |
| every line continuous from end to end | 0 |
| every joint a joint of its class | 0 |
| elbows and the straights between them | 0 |
| valves by class and size | 0 |
| 3 in between lines | 0 |
| 3 in from steel and equipment | 0 |
| pieces of one line clear of each other (SW-RPI-22) | 0 |
| spans within SW-PS-7, a support at every rack beam crossed | 0 |

## Streams

Each stream's line, and who is on it (SW-PWY-3). A stream with more than two parties runs between the two furthest apart along the rack; the others join by branches.

| Stream | Line | Design | Tier | Lane, z in | Parties | Branches |
| --- | --- | --- | --- | --- | --- | --- |
| desalter brine | 3"-P150-P-10001 | 110 psi, 160 °F | 2 | -72 | unit 11 sends; the wastewater treatment receives | — |
| crude overhead gas | 3"-P150-P-10002 | 50 psi, 150 °F | 2 | -84 | unit 11 sends; unit 17 receives | — |
| straight-run naphtha | 6"-P150-P-10003 | 135 psi, 150 °F | 1 | 42 | the product tankage sends; unit 13 receives; unit 11 sends (a 6 in branch); the product tankage receives (a 6 in branch) | 6"-P150-P-10101, 6"-P150-P-10102 |
| sour water | 4"-P150-P-10004 | 85 psi, 190 °F | 1 | -150 | unit 13 sends; unit 17 sends; unit 11 sends (a 3 in branch); unit 15 sends (a 3 in branch); unit 16 sends (a 3 in branch); unit 12 sends (a 3 in branch); unit 18 receives (a 4 in branch) | 3"-P150-P-10103, 3"-P150-P-10104, 3"-P150-P-10105, 3"-P150-P-10106, 4"-P150-P-10107 |
| straight-run kerosene | 4"-P150-P-10005 | 105 psi, 150 °F | 1 | 90 | unit 11 sends; unit 15 receives | — |
| straight-run diesel | 6"-P150-P-10006 | 105 psi, 190 °F | 1 | -96 | unit 11 sends; the product tankage receives; unit 16 receives (a 6 in branch); the product tankage sends (a 6 in branch) | 6"-P150-P-10108, 6"-P150-P-10109 |
| atmospheric gas oil | 3"-P150-P-10007 | 125 psi, 430 °F | 2 | -120 | unit 11 sends; unit 17 receives | — |
| atmospheric residue | 8"-P300-P-10008 | 175 psi, 700 °F | 1 | -18 | unit 11 sends; unit 12 receives | — |
| vacuum gas oil pumparound return | 8"-P300-P-10009 | 260 psi, 500 °F | 1 | -36 | unit 11 sends; unit 12 receives | — |
| vacuum residue rundown | 6"-P150-P-10010 | 135 psi, 400 °F | 1 | -72 | unit 11 sends; the product tankage receives | — |
| crude | 16"-P150-P-10011 | 120 psi, 150 °F | 3 | -150 | the crude tank farm sends; unit 11 receives | — |
| stripped water | 4"-P150-P-10012 | 125 psi, 170 °F | 2 | 24 | unit 18 sends; unit 13 receives; unit 11 receives (a 4 in branch); unit 15 receives (a 3 in branch); unit 16 receives (a 3 in branch) | 4"-P150-P-10110, 3"-P150-P-10111, 3"-P150-P-10112 |
| vacuum gas oil pumparound supply | 10"-P300-P-10013 | 260 psi, 600 °F | 1 | 0 | unit 12 sends; unit 11 receives | — |
| vacuum residue hot | 6"-P600-P-10014 | 155 psi, 740 °F | 1 | -132 | unit 12 sends; unit 11 receives | — |
| slop oil | 3"-P150-P-10015 | 65 psi, 200 °F | 2 | -24 | unit 19 sends; the product tankage receives; unit 12 sends (a 3 in branch); unit 18 sends (a 3 in branch) | 3"-P150-P-10113, 3"-P150-P-10114 |
| light vacuum gas oil | 3"-P150-P-10016 | 105 psi, 200 °F | 2 | -108 | unit 12 sends; the product tankage receives; unit 17 receives (a 3 in branch); the product tankage sends (a 3 in branch) | 3"-P150-P-10115, 3"-P150-P-10116 |
| heavy vacuum gas oil | 6"-P150-P-10017 | 125 psi, 450 °F | 1 | 0 | unit 12 sends; unit 17 receives | — |
| stripper gas | 6"-P150-P-10018 | 50 psi, 190 °F | 1 | 72 | unit 13 sends; unit 17 receives; unit 15 sends (a 3 in branch); unit 16 sends (a 3 in branch) | 3"-P150-P-10117, 3"-P150-P-10118 |
| light naphtha | 3"-P150-P-10019 | 75 psi, 150 °F | 2 | 72 | unit 13 sends; the product tankage receives | — |
| hydrotreated heavy naphtha | 6"-P150-P-10020 | 85 psi, 360 °F | 1 | 90 | unit 13 sends; unit 14 receives | — |
| heavy naphtha to storage | 6"-P150-P-10021 | 75 psi, 190 °F | 1 | 18 | unit 13 sends; the product tankage receives | — |
| wild naphtha | 3"-P150-P-10022 | 105 psi, 170 °F | 2 | 48 | unit 16 sends; unit 13 receives; unit 15 sends (a 3 in branch) | 3"-P150-P-10119 |
| reformer net gas | 3"-P600-P-10023 | 395 psi, 160 °F | 1 | 132 | unit 13 receives; unit 15 receives; unit 14 sends (a 3 in branch) | 3"-P600-P-10120 |
| hydrogen | 3"-P600-P-10024 | 545 psi, 160 °F | 2 | 84 | unit 14 sends; unit 16 receives | — |
| surplus hydrogen | 3"-P150-P-10025 | 85 psi, 160 °F | 1 | -48 | unit 14 sends; unit 19 receives | — |
| stabiliser gas | 3"-P150-P-10026 | 95 psi, 160 °F | 2 | -12 | unit 14 sends; unit 19 receives | — |
| reformer liquefied gas | 3"-P300-P-10027 | 275 psi, 160 °F | 2 | -36 | unit 14 sends; unit 17 receives | — |
| reformate | 4"-P150-P-10028 | 75 psi, 150 °F | 2 | 12 | unit 14 sends; the product tankage receives | — |
| heavy naphtha from storage | 6"-P150-P-10029 | 85 psi, 190 °F | 1 | 114 | the product tankage sends; unit 14 receives | — |
| treated kerosene | 4"-P150-P-10030 | 75 psi, 150 °F | 2 | 36 | unit 15 sends; the product tankage receives | — |
| rich amine | 4"-P150-P-10031 | 95 psi, 190 °F | 2 | -12 | unit 16 sends; unit 17 sends; unit 18 receives (a 4 in branch) | 4"-P150-P-10121 |
| treated diesel | 6"-P150-P-10032 | 75 psi, 160 °F | 1 | 138 | unit 16 sends; the product tankage receives | — |
| light cycle oil to hydrotreating | 3"-P150-P-10033 | 105 psi, 190 °F | 2 | 84 | unit 17 sends; unit 16 receives | — |
| lean amine | 6"-P600-P-10034 | 330 psi, 170 °F | 1 | -54 | unit 16 receives; unit 17 receives; unit 18 sends (a 6 in branch) | 6"-P600-P-10122 |
| slurry oil | 3"-P150-P-10035 | 85 psi, 250 °F | 1 | -144 | unit 17 sends; the product tankage receives | — |
| light cycle oil to fuel oil | 4"-P150-P-10036 | 85 psi, 190 °F | 1 | -30 | unit 17 sends; the product tankage receives | — |
| fuel gas | 6"-P150-P-10037 | 95 psi, 165 °F | 1 | -114 | unit 17 sends; unit 19 receives | — |
| cracked gasoline | 6"-P150-P-10038 | 75 psi, 150 °F | 1 | -6 | unit 17 sends; the product tankage receives | — |
| three-carbon liquefied gas | 3"-P300-P-10039 | 265 psi, 160 °F | 2 | 156 | unit 17 sends; the product tankage receives | — |
| four-carbon liquefied gas | 3"-P300-P-10040 | 225 psi, 150 °F | 2 | 132 | unit 17 sends; the product tankage receives | — |
| stripped water to wastewater | 3"-P150-P-10041 | 55 psi, 170 °F | 2 | 108 | unit 18 sends; the wastewater treatment receives | — |
| fire water make-up | 6"-P300-P-10042 | 160 psi, 150 °F | 1 | -30 | unit 19 sends; the fire water tanks receive | — |
| boiler blowdown | 3"-P150-P-10043 | 55 psi, 265 °F | 2 | -48 | unit 19 sends; the wastewater treatment receives | — |
| raw water | 8"-P150-P-10044 | 65 psi, 150 °F | 1 | 0 | the site boundary (the intake) sends; unit 19 receives | — |
| purchased gas | 6"-P150-P-10045 | 95 psi, 150 °F | 1 | -72 | the site boundary (the gas main) sends; unit 19 receives | — |

## Utility headers

On the top tier, each from a cap just inside the west limit bay to one just inside the east (SW-PWY-11). A header is of the conditions of its whole system and of the size of unit 19's line, or larger where a stretch of it carries more or a unit's header that joins it is larger (SW-PRC-19). Each party joins by a branch from the top of the header, with its block valve at its own limit (SW-PWY-12).

| Header | Line | Design | Lane, z in | Unit 19's line, in | Largest stretch, lb/h (size for it) | Largest unit header, in | Made, lb/h | Used, lb/h | Parties |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| low-pressure steam | 14"-P150-P-10401 | 80 psi, 370 °F | 0 | 6 | 45,000 (12 in) | 14 | 110,710 | 103,321 | unit 19's header takes, 10 in (10621); unit 19 sends, 6 in (10627); unit 14's header sends, 10 in (10622); unit 11's header sends, 8 in (10625); unit 12's header takes, 4 in (10632); unit 18's header takes, 10 in (10623); unit 17's header sends, 14 in (10619) |
| high-pressure steam | 10"-P1200-LS-10402 | 685 psi, 700 °F | -18 | 10 | 36,663 (8 in) | 8 | 68,136 | 114,459 | unit 13's header takes, 4 in (10606); unit 19 sends, 10 in (10620); unit 14's header takes, 8 in (10604); unit 18's header sends, 4 in (10609); unit 17's header takes, 8 in (10626) |
| medium-pressure steam | 10"-P300-LS-10403 | 185 psi, 450 °F | 18 | 8 | 28,802 (8 in) | 10 | 72,331 | 86,877 | unit 13's header takes, 4 in (10628); unit 19 sends, 8 in (10603); unit 15's header takes, 3 in (10635); unit 16's header takes, 4 in (10631); unit 12's header sends, 6 in (10605); unit 17's header sends, 10 in (10601) |
| boiler feed water | 8"-P1200-SC-10404 | 1035 psi, 300 °F | -30 | 8 | 161,177 (6 in) | 4 | 0 | 161,177 | unit 19 sends, 8 in (10624); unit 14's header takes, 3 in reduced to 2 in at its spool (10614); unit 11's header takes, 3 in reduced to 2 in at its spool (10638); unit 12's header takes, 3 in reduced to 2 in at its spool (10641); unit 18's header takes, 3 in reduced to 2 in at its spool (10616); unit 17's header takes, 4 in (10633) |
| fuel gas to users | 8"-P150-P-10405 | 85 psi, 150 °F | 30 | 8 | 11,590 (6 in) | 4 | 0 | 12,699 | unit 13's header takes, 3 in reduced to 2 in at its spool (10637); unit 19 sends, 8 in (10602); unit 14's header takes, 3 in (10634); unit 11's header takes, 4 in (10608); unit 15's header takes, 3 in reduced to 2 in at its spool (10639); unit 16's header takes, 3 in reduced to 2 in at its spool (10640); unit 12's header takes, 3 in (10611); unit 18's header takes, 3 in reduced to 2 in at its spool (10642) |
| condensate | 4"-P150-SC-10406 | 55 psi, 280 °F | -42 | 4 | 72,195 (4 in) | 3 | 90,657 | 0 | unit 13's header sends, 3 in reduced to 2 in at its spool (10613); unit 19 takes, 4 in (10629); unit 14's header sends, 3 in reduced to 2 in at its spool (10615); unit 18's header sends, 3 in (10612); unit 17's header sends, 3 in reduced to 2 in at its spool (10643) |
| instrument air | 4"-P150-IA-10407 | 130 psi, 150 °F | 42 | 4 | 800 (2 in) | 2 | 0 | 800 | unit 19 sends, 4 in (10607); unit 17's header takes, 3 in reduced to 2 in at its spool (10617) |
| service water | 4"-P300-W-10408 | 160 psi, 150 °F | -54 | 4 | 40,000 (3 in) | 3 | 0 | 42,000 | unit 19 sends, 4 in (10630); unit 17's header takes, 3 in (10636) |
| caustic | 3"-P600-P-10409 | 385 psi, 150 °F | 54 | 3 | 1,600 (2 in) | 2 | 0 | 1,600 | unit 19 sends, 3 in (10610); unit 17's header takes, 3 in reduced to 2 in at its spool (10618) |

Not modelled (SW-PRC-19): more low-pressure steam is made than used in this balance, by 7,389 lb/h with unit 19's let-down shut, and what a plant does with the rest is not drawn; the steam that flashes from condensate let down to its header is not sized for; and the growth of a hot header along 1160 ft of rack would be taken up in expansion loops, which this model does not draw.

## Tier loads

What lies along each tier in its heaviest bay, pipe and what it holds (a liquid or two-phase line full of its liquid, a steam or gas line empty; insulation and the branches that cross are not weighed), against the 40 psf a tier is built for (SW-PWY-13).

| Tier | Lines along it | Heaviest bay | lb a foot of rack there | Built for, lb a foot |
| --- | --- | --- | --- | --- |
| 1 | 25 | 20 | 333 | 1,200 |
| 2 | 19 | 31 | 106 | 1,200 |
| 3 | 10 | 20 | 391 | 1,200 |

## Limit spools

Where a party is not yet piped the line ends at a spool of the pipeway's own, with the party's block valve and a blind beyond it (SW-PWY-4).

| Spool | Stands in | At (x, y, z), in | Size, class | Party | Stream | Line | Valve and blind |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PL-1001 | east limit bay | 13860, 318, -72 | 3 in, P150 | the wastewater treatment receives | desalter brine | 3"-P150-P-10001 | 3"-P150-P-10801 |
| PL-1002 | east limit bay | 13860, 252, 42 | 6 in, P150 | the product tankage sends | straight-run naphtha | 6"-P150-P-10003 | 6"-P150-P-10802 |
| PL-1003 | east limit bay | 13860, 252, 90 | 6 in, P150 | the product tankage receives | straight-run naphtha | 6"-P150-P-10102 | 6"-P150-P-10803 |
| PL-1004 | east limit bay | 13860, 252, -96 | 6 in, P150 | the product tankage receives | straight-run diesel | 6"-P150-P-10006 | 6"-P150-P-10804 |
| PL-1005 | east limit bay | 13860, 252, -120 | 6 in, P150 | the product tankage sends | straight-run diesel | 6"-P150-P-10109 | 6"-P150-P-10805 |
| PL-1006 | east limit bay | 13860, 252, -72 | 6 in, P150 | the product tankage receives | vacuum residue rundown | 6"-P150-P-10010 | 6"-P150-P-10806 |
| PL-1007 | east limit bay | 13860, 408, -150 | 12 in, P150 | the crude tank farm sends | crude | 16"-P150-P-10011 | 12"-P150-P-10807 |
| PL-1008 | east limit bay | 13860, 318, -24 | 3 in, P150 | the product tankage receives | slop oil | 3"-P150-P-10015 | 3"-P150-P-10808 |
| PL-1009 | east limit bay | 13860, 318, -108 | 3 in, P150 | the product tankage receives | light vacuum gas oil | 3"-P150-P-10016 | 3"-P150-P-10809 |
| PL-1010 | east limit bay | 13860, 318, -144 | 3 in, P150 | the product tankage sends | light vacuum gas oil | 3"-P150-P-10116 | 3"-P150-P-10810 |
| PL-1011 | east limit bay | 13860, 318, 72 | 3 in, P150 | the product tankage receives | light naphtha | 3"-P150-P-10019 | 3"-P150-P-10811 |
| PL-1012 | east limit bay | 13860, 252, 18 | 6 in, P150 | the product tankage receives | heavy naphtha to storage | 6"-P150-P-10021 | 6"-P150-P-10812 |
| PL-1013 | east limit bay | 13860, 318, 12 | 4 in, P150 | the product tankage receives | reformate | 4"-P150-P-10028 | 4"-P150-P-10813 |
| PL-1014 | east limit bay | 13860, 252, 114 | 6 in, P150 | the product tankage sends | heavy naphtha from storage | 6"-P150-P-10029 | 6"-P150-P-10814 |
| PL-1015 | east limit bay | 13860, 318, 36 | 4 in, P150 | the product tankage receives | treated kerosene | 4"-P150-P-10030 | 4"-P150-P-10815 |
| PL-1016 | east limit bay | 13860, 252, 138 | 6 in, P150 | the product tankage receives | treated diesel | 6"-P150-P-10032 | 6"-P150-P-10816 |
| PL-1017 | east limit bay | 13860, 246, -144 | 3 in, P150 | the product tankage receives | slurry oil | 3"-P150-P-10035 | 3"-P150-P-10817 |
| PL-1018 | east limit bay | 13860, 246, -30 | 3 in, P150 | the product tankage receives | light cycle oil to fuel oil | 4"-P150-P-10036 | 3"-P150-P-10818 |
| PL-1019 | east limit bay | 13860, 252, -6 | 6 in, P150 | the product tankage receives | cracked gasoline | 6"-P150-P-10038 | 6"-P150-P-10819 |
| PL-1020 | east limit bay | 13860, 318, 156 | 3 in, P300 | the product tankage receives | three-carbon liquefied gas | 3"-P300-P-10039 | 3"-P300-P-10820 |
| PL-1021 | east limit bay | 13860, 318, 132 | 3 in, P300 | the product tankage receives | four-carbon liquefied gas | 3"-P300-P-10040 | 3"-P300-P-10821 |
| PL-1022 | east limit bay | 13860, 318, 108 | 3 in, P150 | the wastewater treatment receives | stripped water to wastewater | 3"-P150-P-10041 | 3"-P150-P-10822 |
| PL-1023 | west limit bay | 60, 252, -30 | 6 in, P300 | the fire water tanks receive | fire water make-up | 6"-P300-P-10042 | 6"-P300-P-10823 |
| PL-1024 | east limit bay | 13860, 318, -48 | 3 in, P150 | the wastewater treatment receives | boiler blowdown | 3"-P150-P-10043 | 3"-P150-P-10824 |
| PL-1025 | west limit bay | 60, 252, 0 | 8 in, P150 | the site boundary (the intake) sends | raw water | 8"-P150-P-10044 | 8"-P150-P-10825 |
| PL-1026 | west limit bay | 60, 252, -72 | 6 in, P150 | the site boundary (the gas main) sends | purchased gas | 6"-P150-P-10045 | 6"-P150-P-10826 |

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
| 17 | 9486 | north | 30 | 1, 2, 3 | W18x50 | W16x45 |
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
| cooling water supply | a 30 in main from the cooling tower, whose plot is not piped yet; the pair of mains is too heavy for a tier of the rack, and where they run is put to the owner with that stage (SW-PWY-11). The units' headers end at their valves and spools meanwhile |
| cooling water return | a 30 in main from the cooling tower, whose plot is not piped yet; the pair of mains is too heavy for a tier of the rack, and where they run is put to the owner with that stage (SW-PWY-11). The units' headers end at their valves and spools meanwhile |
| plant air | no unit's flowsheet takes it or makes it yet: its line ends at unit 19's spool (SW-PWY-11) |
| nitrogen | no unit's flowsheet takes it or makes it yet: its line ends at unit 19's spool (SW-PWY-11) |

## Notes

- Carried on from the headers' caps with the pipeways of the areas beyond the bench, not from the main rack (SW-PWY-11): medium-pressure steam: the flare; low-pressure steam: the product tankage; condensate: the product tankage; fuel gas to users: the flare; service water: the flare.
- Not on the main pipeway, though their streams are: slop oil: the marine terminal; slop oil: the truck loading; slop oil: the wastewater treatment; slop oil: the flare. What an area beyond the bench sends to another such area, or takes from one, runs on those areas' own pipeways (SW-PWY-3).
- 6"-P600-P-10034: the lane given it at z 90 on tier 1 was found shut by what an earlier run left; routed in the lane at z -54 (SW-RPI-7)
- 3"-P150-P-10001: no valve at BL-1103-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10001: no valve at PL-1001-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10002: no valve at BL-1104-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10002: no valve at BL-1707-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 6"-P150-P-10003: no valve at PL-1002-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10003: no valve at BL-1301-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10101: no valve at BL-1105-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10102: no valve at PL-1003-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 4"-P150-P-10004: no valve at BL-1305-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 4"-P150-P-10004: no valve at BL-1709-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10103: no valve at BL-1106-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10104: no valve at BL-1504-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10105: no valve at BL-1607-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10106: no valve at BL-1203-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 4"-P150-P-10107: no valve at BL-1803-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 4"-P150-P-10005: no valve at BL-1107-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 4"-P150-P-10005: no valve at BL-1501-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 6"-P150-P-10006: no valve at BL-1108-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10006: no valve at PL-1004-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10108: no valve at BL-1601-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10109: no valve at PL-1005-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 3"-P150-P-10007: no valve at BL-1109-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10007: no valve at BL-1701-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 8"-P300-P-10008: no valve at BL-1110-P; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.7 in longer (SW-RPI-14)
- 8"-P300-P-10008: no valve at BL-1201-P; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.7 in longer (SW-RPI-14)
- 8"-P300-P-10009: no valve at BL-1112-P; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.7 in longer (SW-RPI-14)
- 8"-P300-P-10009: no valve at BL-1207-P; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.7 in longer (SW-RPI-14)
- 6"-P150-P-10010: no valve at BL-1114-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10010: no valve at PL-1006-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 16"-P150-P-10011: no valve at PL-1007-P; GATE 12 and what stood with it left out, 3 pieces, the pipe 22.6 in longer (SW-RPI-14)
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
- 3"-P150-P-10015: no valve at PL-1008-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10113: no valve at BL-1202-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10114: no valve at BL-1804-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10016: no valve at BL-1204-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10016: no valve at PL-1009-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10115: no valve at BL-1702-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10116: no valve at PL-1010-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 6"-P150-P-10017: no valve at BL-1206-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10017: no valve at BL-1703-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10018: no valve at BL-1306-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 6"-P150-P-10018: no valve at BL-1708-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 3"-P150-P-10117: no valve at BL-1505-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10118: no valve at BL-1608-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10019: no valve at BL-1307-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10019: no valve at PL-1011-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 6"-P150-P-10020: no valve at BL-1308-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10020: no valve at BL-1401-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10021: no valve at BL-1309-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10021: no valve at PL-1012-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
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
- 3"-P300-P-10027: no valve at BL-1714-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 4"-P150-P-10028: no valve at BL-1408-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 4"-P150-P-10028: no valve at PL-1013-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 6"-P150-P-10029: no valve at PL-1014-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10029: no valve at BL-1402-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 4"-P150-P-10030: no valve at BL-1507-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 4"-P150-P-10030: no valve at PL-1015-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 4"-P150-P-10031: no valve at BL-1604-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 4"-P150-P-10031: no valve at BL-1711-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 4"-P150-P-10121: no valve at BL-1801-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 6"-P150-P-10032: no valve at BL-1610-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10032: no valve at PL-1016-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 3"-P150-P-10033: no valve at BL-1706-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10033: no valve at BL-1602-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 6"-P600-P-10034: no valve at BL-1603-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 6"-P600-P-10034: no valve at BL-1710-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 6"-P600-P-10122: no valve at BL-1802-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 3"-P150-P-10035: no valve at BL-1704-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10035: no valve at PL-1017-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 4"-P150-P-10036: no valve at BL-1705-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 4"-P150-P-10036: no valve at PL-1018-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 6"-P150-P-10037: no valve at BL-1712-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 6"-P150-P-10037: no valve at BL-1915-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10038: no valve at BL-1713-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10038: no valve at PL-1019-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 3"-P300-P-10039: no valve at BL-1715-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P300-P-10039: no valve at PL-1020-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P300-P-10040: no valve at BL-1716-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P300-P-10040: no valve at PL-1021-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10041: no valve at BL-1806-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10041: no valve at PL-1022-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 6"-P300-P-10042: no valve at BL-1904-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P300-P-10042: no valve at PL-1023-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 3"-P150-P-10043: no valve at BL-1910-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10043: no valve at PL-1024-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 8"-P150-P-10044: no valve at PL-1025-P; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.7 in longer (SW-RPI-14)
- 8"-P150-P-10044: no valve at BL-1901-P; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.7 in longer (SW-RPI-14)
- 6"-P150-P-10045: no valve at PL-1026-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 6"-P150-P-10045: no valve at BL-1918-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 10"-P300-P-10601: no valve at BL-1723-P; GATE 10 and what stood with it left out, 3 pieces, the pipe 20.0 in longer (SW-RPI-14)
- 8"-P150-P-10602: no valve at BL-1919-P; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.7 in longer (SW-RPI-14)
- 8"-P300-P-10603: no valve at BL-1908-P; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.7 in longer (SW-RPI-14)
- 8"-P1200-P-10604: no valve at BL-1409-P; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.8 in longer (SW-RPI-14)
- 6"-P300-P-10605: no valve at BL-1209-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 4"-P1200-P-10606: no valve at BL-1312-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.3 in longer (SW-RPI-14)
- 4"-P150-P-10607: no valve at BL-1912-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 4"-P150-P-10608: no valve at BL-1119-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 4"-P1200-P-10609: no valve at BL-1812-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.3 in longer (SW-RPI-14)
- 3"-P600-P-10610: no valve at BL-1914-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10611: no valve at BL-1214-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10612: no valve at BL-1808-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10613: no valve at BL-1313-P; GATE 2 and what stood with it left out, 3 pieces, the pipe 10.9 in longer (SW-RPI-14)
- 3"-P1200-P-10614: no valve at BL-1414-P; GATE 2 and what stood with it left out, 3 pieces, the pipe 11.4 in longer (SW-RPI-14)
- 3"-P150-P-10615: no valve at BL-1413-P; GATE 2 and what stood with it left out, 3 pieces, the pipe 10.9 in longer (SW-RPI-14)
- 3"-P1200-P-10616: no valve at BL-1811-P; GATE 2 and what stood with it left out, 3 pieces, the pipe 11.4 in longer (SW-RPI-14)
- 3"-P150-P-10617: no valve at BL-1718-P; GATE 2 and what stood with it left out, 3 pieces, the pipe 10.9 in longer (SW-RPI-14)
- 3"-P600-P-10618: no valve at BL-1722-P; GATE 2 and what stood with it left out, 3 pieces, the pipe 10.9 in longer (SW-RPI-14)
- 14"-P150-P-10619: no valve at BL-1725-P; GATE 14 and what stood with it left out, 3 pieces, the pipe 24.6 in longer (SW-RPI-14)
- 10"-P1200-P-10620: no valve at BL-1907-P; GATE 10 and what stood with it left out, 3 pieces, the pipe 21.6 in longer (SW-RPI-14)
- 10"-P150-P-10621: no valve at BL-1921-P; GATE 10 and what stood with it left out, 3 pieces, the pipe 20.0 in longer (SW-RPI-14)
- 10"-P150-P-10622: no valve at BL-1410-P; GATE 10 and what stood with it left out, 3 pieces, the pipe 20.0 in longer (SW-RPI-14)
- 10"-P150-P-10623: no valve at BL-1807-P; GATE 10 and what stood with it left out, 3 pieces, the pipe 20.0 in longer (SW-RPI-14)
- 8"-P1200-P-10624: no valve at BL-1906-P; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.8 in longer (SW-RPI-14)
- 8"-P150-P-10625: no valve at BL-1118-P; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.7 in longer (SW-RPI-14)
- 8"-P1200-P-10626: no valve at BL-1720-P; GATE 8 and what stood with it left out, 3 pieces, the pipe 18.8 in longer (SW-RPI-14)
- 6"-P150-P-10627: no valve at BL-1909-P; GATE 6 and what stood with it left out, 3 pieces, the pipe 14.2 in longer (SW-RPI-14)
- 4"-P300-P-10628: no valve at BL-1314-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 4"-P150-P-10629: no valve at BL-1905-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 4"-P300-P-10630: no valve at BL-1902-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 4"-P300-P-10631: no valve at BL-1613-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 4"-P150-P-10632: no valve at BL-1213-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.4 in longer (SW-RPI-14)
- 4"-P1200-P-10633: no valve at BL-1719-P; GATE 4 and what stood with it left out, 3 pieces, the pipe 15.3 in longer (SW-RPI-14)
- 3"-P150-P-10634: no valve at BL-1415-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P300-P-10635: no valve at BL-1510-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P300-P-10636: no valve at BL-1721-P; GATE 3 and what stood with it left out, 3 pieces, the pipe 13.7 in longer (SW-RPI-14)
- 3"-P150-P-10637: no valve at BL-1315-P; GATE 2 and what stood with it left out, 3 pieces, the pipe 10.9 in longer (SW-RPI-14)
- 3"-P1200-P-10638: no valve at BL-1117-P; GATE 2 and what stood with it left out, 3 pieces, the pipe 11.4 in longer (SW-RPI-14)
- 3"-P150-P-10639: no valve at BL-1511-P; GATE 2 and what stood with it left out, 3 pieces, the pipe 10.9 in longer (SW-RPI-14)
- 3"-P150-P-10640: no valve at BL-1614-P; GATE 2 and what stood with it left out, 3 pieces, the pipe 10.9 in longer (SW-RPI-14)
- 3"-P1200-P-10641: no valve at BL-1212-P; GATE 2 and what stood with it left out, 3 pieces, the pipe 11.4 in longer (SW-RPI-14)
- 3"-P150-P-10642: no valve at BL-1813-P; GATE 2 and what stood with it left out, 3 pieces, the pipe 10.9 in longer (SW-RPI-14)
- 3"-P150-P-10643: no valve at BL-1726-P; GATE 2 and what stood with it left out, 3 pieces, the pipe 10.9 in longer (SW-RPI-14)
- 3"-P150-P-10001/p34 (40.4 ft, far end 13843,318,-72): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 16"-P150-P-10011/p8 (41.3 ft, far end 13336,408,-150): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 3"-P150-P-10015/p41 (40.5 ft, far end 13843,318,-24): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 3"-P150-P-10019/p43 (40.9 ft, far end 13843,318,72): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 6"-P150-P-10021/p22 (40.1 ft, far end 4577,252,18): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 4"-P150-P-10028/p37 (41.0 ft, far end 13842,318,12): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 6"-P150-P-10029/p7 (41.0 ft, far end 13352,252,114): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 3"-P150-P-10035/p27 (40.1 ft, far end 13843,246,-144): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 6"-P150-P-10038/p25 (40.4 ft, far end 13844,252,-6): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 3"-P150-P-10043/p16 (40.1 ft, far end 3380,318,-48): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 3"-P150-P-10043/p18 (40.1 ft, far end 4336,318,-48): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 3"-P150-P-10043/p19 (40.1 ft, far end 4817,318,-48): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 3"-P150-P-10043/p21 (40.1 ft, far end 5744,318,-48): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 3"-P150-P-10043/p22 (40.1 ft, far end 6225,318,-48): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 3"-P150-P-10043/p38 (40.7 ft, far end 13843,318,-48): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 10"-P1200-LS-10402/p33 (40.1 ft, far end 13217,408,-18): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 10"-P300-LS-10403/p34 (40.3 ft, far end 13668,408,18): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 8"-P1200-SC-10404/p31 (40.5 ft, far end 13668,408,-30): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 8"-P150-P-10405/p25 (40.2 ft, far end 10818,408,30): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 8"-P150-P-10405/p27 (40.2 ft, far end 11776,408,30): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 8"-P150-P-10405/p28 (40.2 ft, far end 12258,408,30): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 8"-P150-P-10405/p31 (40.7 ft, far end 13668,408,30): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 4"-P150-IA-10407/p32 (40.4 ft, far end 13219,402,42): a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)
- 508 butt welds set square to their joints (SW-RPI-24)
- 6 supports taken out where their rod, post or leg struck another line, steel or another support (SW-RPI-18): 3"-P150-P-10104/S3 (hanger): its rod through 10"-P300-P-10013; 3"-P150-P-10105/S3 (hanger): its rod through 10"-P300-P-10013; 6"-P150-P-10018/S39 (hanger): its rod through 6"-P150-P-10006; 3"-P300-P-10039/S3 (hanger): its rod through 6"-P150-P-10017; 3"-P1200-P-10641/S1 (hanger): its part overlaps the support 3"-P150-P-10611/S2; 3"-P1200-P-10641/S2 (hanger): its part overlaps the support 3"-P150-P-10611/S3
- 6 supports set where the generator's stepping along a run had stopped (SW-RPI-17): 2 hangers from steel above, 0 stanchions on steel below, 0 stanchions and 3 support posts from the floor, and 1 pipe frames
- 223 hangers' rods made to reach the underside of the steel they hang from (SW-RPI-20)
- 115 shoes set on the tier beams of the units' first bents, where the pipeway's lines pass over them to their spools: those beams are not shown to the generator while it routes (SW-PWY-8).
- 2 posts set on the top-tier beams of first bents under lines that pass higher than a shoe stands, and 7 hangers set where the generator's stepping along a run had stopped for want of that steel: 3"-P1200-P-10641 1 post; 3"-P150-P-10613 3 hangers; 3"-P150-P-10615 3 hangers; 3"-P150-P-10643 1 hanger; 3"-P150-P-10025 1 post (SW-PWY-8).
- 4"-P150-P-10110/p8 (pipe) passes rack-bent:120/beam/unit-11 at 0.30 in from the round the check holds that member by and 6.40 in from its section (SW-RPI-13)
- 3"-P150-P-10111/p6 (pipe) passes rack-bent:120/beam/unit-15 at 1.87 in from the round the check holds that member by and 7.30 in from its section (SW-RPI-13)
- 3"-P150-P-10115/p5 (pipe) passes rack-bent:120/beam/unit-17 at 0.80 in from the round the check holds that member by and 6.90 in from its section (SW-RPI-13)
- 6"-P150-P-10018/A7 (reducer) passes rack-bent:120/beam/unit-13 at 2.86 in from the round the check holds that member by and 3.02 in from its section (SW-RPI-13)
- 6"-P150-P-10018/p8 (pipe) passes rack-bent:120/beam/unit-13 at 2.38 in from the round the check holds that member by and 3.00 in from its section (SW-RPI-13)
- 4"-P150-P-10121/p8 (pipe) passes rack-bent:120/beam/unit-18 at 1.37 in from the round the check holds that member by and 6.80 in from its section (SW-RPI-13)
- 6"-P600-P-10034/p8 (pipe) passes rack-bent:120/beam/unit-16 at 2.38 in from the round the check holds that member by and 3.00 in from its section (SW-RPI-13)
- 6"-P600-P-10034/p30 (pipe) passes rack-bent:120/beam/unit-17 at 2.31 in from the round the check holds that member by and 3.00 in from its section (SW-RPI-13)
- 6"-P150-P-10037/p8 (pipe) passes rack-bent:120/beam/unit-17 at 2.31 in from the round the check holds that member by and 3.00 in from its section (SW-RPI-13)

## Lines

| Line | Kind | Stream | Fluid | From | To | Design | Tier | Components | Welds | Supports | Length, ft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3"-P150-P-10001 | main | desalter brine | oily water | BL-1103-P | PL-1001-P | 110 psi, 160 °F | 2 | 33 | 30 | 80 | 828 |
| 3"-P150-P-10801 | limit | desalter brine | oily water | PL-1001-U | blind | 110 psi, 160 °F | — | 4 | 0 | 0 | 1 |
| 3"-P150-P-10002 | main | crude overhead gas | hydrocarbon gas | BL-1104-P | BL-1707-P | 50 psi, 150 °F | 2 | 23 | 20 | 48 | 497 |
| 6"-P150-P-10003 | main | straight-run naphtha | naphtha | PL-1002-P | BL-1301-P | 135 psi, 150 °F | 1 | 39 | 36 | 57 | 1113 |
| 6"-P150-P-10101 | branch | straight-run naphtha | naphtha | BL-1105-P | tap 6"-P150-P-10003 | 135 psi, 150 °F | — | 6 | 5 | 3 | 45 |
| 6"-P150-P-10102 | branch | straight-run naphtha | naphtha | tap 6"-P150-P-10003 | PL-1003-P | 135 psi, 150 °F | — | 5 | 4 | 0 | 3 |
| 6"-P150-P-10802 | limit | straight-run naphtha | naphtha | PL-1002-U | blind | 135 psi, 150 °F | — | 4 | 0 | 0 | 1 |
| 6"-P150-P-10803 | limit | straight-run naphtha | naphtha | PL-1003-U | blind | 135 psi, 150 °F | — | 4 | 0 | 0 | 1 |
| 4"-P150-P-10004 | main | sour water | sour water | BL-1305-P | BL-1709-P | 85 psi, 190 °F | 1 | 41 | 38 | 41 | 805 |
| 3"-P150-P-10103 | branch | sour water | sour water | BL-1106-P | tap 4"-P150-P-10004 | 85 psi, 190 °F | — | 5 | 4 | 3 | 30 |
| 3"-P150-P-10104 | branch | sour water | sour water | BL-1504-P | tap 4"-P150-P-10004 | 85 psi, 190 °F | — | 6 | 5 | 4 | 55 |
| 3"-P150-P-10105 | branch | sour water | sour water | BL-1607-P | tap 4"-P150-P-10004 | 85 psi, 190 °F | — | 6 | 5 | 4 | 55 |
| 3"-P150-P-10106 | branch | sour water | sour water | BL-1203-P | tap 4"-P150-P-10004 | 85 psi, 190 °F | — | 5 | 4 | 3 | 30 |
| 4"-P150-P-10107 | branch | sour water | sour water | tap 4"-P150-P-10004 | BL-1803-P | 85 psi, 190 °F | — | 6 | 5 | 4 | 52 |
| 4"-P150-P-10005 | main | straight-run kerosene | kerosene | BL-1107-P | BL-1501-P | 105 psi, 150 °F | 1 | 16 | 13 | 9 | 167 |
| 6"-P150-P-10006 | main | straight-run diesel | diesel | BL-1108-P | PL-1004-P | 105 psi, 190 °F | 1 | 32 | 29 | 41 | 821 |
| 6"-P150-P-10108 | branch | straight-run diesel | diesel | tap 6"-P150-P-10006 | BL-1601-P | 105 psi, 190 °F | — | 6 | 5 | 3 | 49 |
| 6"-P150-P-10109 | branch | straight-run diesel | diesel | PL-1005-P | tap 6"-P150-P-10006 | 105 psi, 190 °F | — | 5 | 4 | 0 | 1 |
| 6"-P150-P-10804 | limit | straight-run diesel | diesel | PL-1004-U | blind | 105 psi, 190 °F | — | 4 | 0 | 0 | 1 |
| 6"-P150-P-10805 | limit | straight-run diesel | diesel | PL-1005-U | blind | 105 psi, 190 °F | — | 4 | 0 | 0 | 1 |
| 3"-P150-P-10007 | main | atmospheric gas oil | gas oil | BL-1109-P | BL-1701-P | 125 psi, 430 °F | 2 | 27 | 24 | 48 | 490 |
| 8"-P300-P-10008 | main | atmospheric residue | residue | BL-1110-P | BL-1201-P | 175 psi, 700 °F | 1 | 23 | 20 | 16 | 321 |
| 8"-P300-P-10009 | main | vacuum gas oil pumparound return | gas oil | BL-1112-P | BL-1207-P | 260 psi, 500 °F | 1 | 18 | 15 | 17 | 313 |
| 6"-P150-P-10010 | main | vacuum residue rundown | residue | BL-1114-P | PL-1006-P | 135 psi, 400 °F | 1 | 29 | 26 | 43 | 831 |
| 6"-P150-P-10806 | limit | vacuum residue rundown | residue | PL-1006-U | blind | 135 psi, 400 °F | — | 4 | 0 | 0 | 1 |
| 16"-P150-P-10011 | main | crude | crude oil | PL-1007-P | BL-1101-P | 120 psi, 150 °F | 3 | 34 | 31 | 41 | 835 |
| 12"-P150-P-10807 | limit | crude | crude oil | PL-1007-U | blind | 120 psi, 150 °F | — | 4 | 0 | 0 | 2 |
| 4"-P150-P-10012 | main | stripped water | process and wash water | BL-1805-P | BL-1304-P | 125 psi, 170 °F | 2 | 41 | 38 | 40 | 794 |
| 4"-P150-P-10110 | branch | stripped water | process and wash water | tap 4"-P150-P-10012 | BL-1102-P | 125 psi, 170 °F | — | 14 | 13 | 2 | 53 |
| 3"-P150-P-10111 | branch | stripped water | process and wash water | tap 4"-P150-P-10012 | BL-1503-P | 125 psi, 170 °F | — | 10 | 9 | 3 | 46 |
| 3"-P150-P-10112 | branch | stripped water | process and wash water | tap 4"-P150-P-10012 | BL-1606-P | 125 psi, 170 °F | — | 9 | 8 | 3 | 41 |
| 10"-P300-P-10013 | main | vacuum gas oil pumparound supply | gas oil | BL-1205-P | BL-1111-P | 260 psi, 600 °F | 1 | 24 | 21 | 16 | 323 |
| 6"-P600-P-10014 | main | vacuum residue hot | residue | BL-1208-P | BL-1113-P | 155 psi, 740 °F | 1 | 25 | 22 | 17 | 312 |
| 3"-P150-P-10015 | main | slop oil | oily water | BL-1920-P | PL-1008-P | 65 psi, 200 °F | 2 | 40 | 37 | 97 | 993 |
| 3"-P150-P-10113 | branch | slop oil | oily water | BL-1202-P | tap 3"-P150-P-10015 | 65 psi, 200 °F | — | 11 | 10 | 2 | 48 |
| 3"-P150-P-10114 | branch | slop oil | oily water | BL-1804-P | tap 3"-P150-P-10015 | 65 psi, 200 °F | — | 9 | 8 | 3 | 52 |
| 3"-P150-P-10808 | limit | slop oil | oily water | PL-1008-U | blind | 65 psi, 200 °F | — | 4 | 0 | 0 | 1 |
| 3"-P150-P-10016 | main | light vacuum gas oil | gas oil | BL-1204-P | PL-1009-P | 105 psi, 200 °F | 2 | 26 | 23 | 58 | 589 |
| 3"-P150-P-10115 | branch | light vacuum gas oil | gas oil | tap 3"-P150-P-10016 | BL-1702-P | 105 psi, 200 °F | — | 11 | 10 | 3 | 41 |
| 3"-P150-P-10116 | branch | light vacuum gas oil | gas oil | PL-1010-P | tap 3"-P150-P-10016 | 105 psi, 200 °F | — | 5 | 4 | 0 | 3 |
| 3"-P150-P-10809 | limit | light vacuum gas oil | gas oil | PL-1009-U | blind | 105 psi, 200 °F | — | 4 | 0 | 0 | 1 |
| 3"-P150-P-10810 | limit | light vacuum gas oil | gas oil | PL-1010-U | blind | 105 psi, 200 °F | — | 4 | 0 | 0 | 1 |
| 6"-P150-P-10017 | main | heavy vacuum gas oil | gas oil | BL-1206-P | BL-1703-P | 125 psi, 450 °F | 1 | 21 | 18 | 15 | 278 |
| 6"-P150-P-10018 | main | stripper gas | hydrocarbon gas | BL-1306-P | BL-1708-P | 50 psi, 190 °F | 1 | 33 | 30 | 41 | 818 |
| 3"-P150-P-10117 | branch | stripper gas | hydrocarbon gas | BL-1505-P | tap 6"-P150-P-10018 | 50 psi, 190 °F | — | 6 | 5 | 3 | 37 |
| 3"-P150-P-10118 | branch | stripper gas | hydrocarbon gas | BL-1608-P | tap 6"-P150-P-10018 | 50 psi, 190 °F | — | 6 | 5 | 3 | 37 |
| 3"-P150-P-10019 | main | light naphtha | naphtha | BL-1307-P | PL-1011-P | 75 psi, 150 °F | 2 | 42 | 39 | 109 | 1118 |
| 3"-P150-P-10811 | limit | light naphtha | naphtha | PL-1011-U | blind | 75 psi, 150 °F | — | 4 | 0 | 0 | 1 |
| 6"-P150-P-10020 | main | hydrotreated heavy naphtha | naphtha | BL-1308-P | BL-1401-P | 85 psi, 360 °F | 1 | 17 | 14 | 12 | 233 |
| 6"-P150-P-10021 | main | heavy naphtha to storage | naphtha | BL-1309-P | PL-1012-P | 75 psi, 190 °F | 1 | 41 | 38 | 55 | 1126 |
| 6"-P150-P-10812 | limit | heavy naphtha to storage | naphtha | PL-1012-U | blind | 75 psi, 190 °F | — | 4 | 0 | 0 | 1 |
| 3"-P150-P-10022 | main | wild naphtha | naphtha | BL-1609-P | BL-1302-P | 105 psi, 170 °F | 2 | 31 | 28 | 56 | 590 |
| 3"-P150-P-10119 | branch | wild naphtha | naphtha | BL-1506-P | tap 3"-P150-P-10022 | 105 psi, 170 °F | — | 9 | 8 | 3 | 44 |
| 3"-P600-P-10023 | main | reformer net gas | hydrogen-rich gas | BL-1303-P | BL-1502-P | 395 psi, 160 °F | 1 | 23 | 20 | 42 | 418 |
| 3"-P600-P-10120 | branch | reformer net gas | hydrogen-rich gas | BL-1403-P | tap 3"-P600-P-10023 | 395 psi, 160 °F | — | 5 | 4 | 3 | 29 |
| 3"-P600-P-10024 | main | hydrogen | hydrogen-rich gas | BL-1404-P | BL-1605-P | 545 psi, 160 °F | 2 | 29 | 26 | 40 | 438 |
| 3"-P150-P-10025 | main | surplus hydrogen | hydrogen-rich gas | BL-1405-P | BL-1916-P | 85 psi, 160 °F | 1 | 22 | 19 | 11 | 142 |
| 3"-P150-P-10026 | main | stabiliser gas | fuel gas | BL-1406-P | BL-1917-P | 95 psi, 160 °F | 2 | 18 | 15 | 10 | 130 |
| 3"-P300-P-10027 | main | reformer liquefied gas | liquefied petroleum gas | BL-1407-P | BL-1714-P | 275 psi, 160 °F | 2 | 37 | 34 | 62 | 664 |
| 4"-P150-P-10028 | main | reformate | reformate | BL-1408-P | PL-1013-P | 75 psi, 150 °F | 2 | 36 | 33 | 48 | 962 |
| 4"-P150-P-10813 | limit | reformate | reformate | PL-1013-U | blind | 75 psi, 150 °F | — | 4 | 0 | 0 | 1 |
| 6"-P150-P-10029 | main | heavy naphtha from storage | naphtha | PL-1014-P | BL-1402-P | 85 psi, 190 °F | 1 | 32 | 29 | 48 | 948 |
| 6"-P150-P-10814 | limit | heavy naphtha from storage | naphtha | PL-1014-U | blind | 85 psi, 190 °F | — | 4 | 0 | 0 | 1 |
| 4"-P150-P-10030 | main | treated kerosene | kerosene | BL-1507-P | PL-1015-P | 75 psi, 150 °F | 2 | 31 | 28 | 38 | 775 |
| 4"-P150-P-10815 | limit | treated kerosene | kerosene | PL-1015-U | blind | 75 psi, 150 °F | — | 4 | 0 | 0 | 1 |
| 4"-P150-P-10031 | main | rich amine | amine solution | BL-1604-P | BL-1711-P | 95 psi, 190 °F | 2 | 25 | 22 | 16 | 317 |
| 4"-P150-P-10121 | branch | rich amine | amine solution | tap 4"-P150-P-10031 | BL-1801-P | 95 psi, 190 °F | — | 14 | 13 | 2 | 52 |
| 6"-P150-P-10032 | main | treated diesel | diesel | BL-1610-P | PL-1016-P | 75 psi, 160 °F | 1 | 23 | 20 | 30 | 598 |
| 6"-P150-P-10816 | limit | treated diesel | diesel | PL-1016-U | blind | 75 psi, 160 °F | — | 4 | 0 | 0 | 1 |
| 3"-P150-P-10033 | main | light cycle oil to hydrotreating | diesel | BL-1706-P | BL-1602-P | 105 psi, 190 °F | 2 | 19 | 16 | 28 | 305 |
| 6"-P600-P-10034 | main | lean amine | amine solution | BL-1603-P | BL-1710-P | 330 psi, 170 °F | 1 | 29 | 26 | 13 | 305 |
| 6"-P600-P-10122 | branch | lean amine | amine solution | BL-1802-P | tap 6"-P600-P-10034 | 330 psi, 170 °F | — | 10 | 9 | 3 | 46 |
| 3"-P150-P-10035 | main | slurry oil | slurry oil | BL-1704-P | PL-1017-P | 85 psi, 250 °F | 1 | 26 | 23 | 36 | 389 |
| 3"-P150-P-10817 | limit | slurry oil | slurry oil | PL-1017-U | blind | 85 psi, 250 °F | — | 4 | 0 | 0 | 1 |
| 4"-P150-P-10036 | main | light cycle oil to fuel oil | diesel | BL-1705-P | PL-1018-P | 85 psi, 190 °F | 1 | 22 | 19 | 18 | 394 |
| 3"-P150-P-10818 | limit | light cycle oil to fuel oil | diesel | PL-1018-U | blind | 85 psi, 190 °F | — | 4 | 0 | 0 | 1 |
| 6"-P150-P-10037 | main | fuel gas | fuel gas | BL-1712-P | BL-1915-P | 95 psi, 165 °F | 1 | 28 | 25 | 33 | 655 |
| 6"-P150-P-10038 | main | cracked gasoline | gasoline | BL-1713-P | PL-1019-P | 75 psi, 150 °F | 1 | 24 | 21 | 20 | 400 |
| 6"-P150-P-10819 | limit | cracked gasoline | gasoline | PL-1019-U | blind | 75 psi, 150 °F | — | 4 | 0 | 0 | 1 |
| 3"-P300-P-10039 | main | three-carbon liquefied gas | liquefied petroleum gas | BL-1715-P | PL-1020-P | 265 psi, 160 °F | 2 | 19 | 16 | 40 | 428 |
| 3"-P300-P-10820 | limit | three-carbon liquefied gas | liquefied petroleum gas | PL-1020-U | blind | 265 psi, 160 °F | — | 4 | 0 | 0 | 1 |
| 3"-P300-P-10040 | main | four-carbon liquefied gas | liquefied petroleum gas | BL-1716-P | PL-1021-P | 225 psi, 150 °F | 2 | 22 | 19 | 40 | 428 |
| 3"-P300-P-10821 | limit | four-carbon liquefied gas | liquefied petroleum gas | PL-1021-U | blind | 225 psi, 150 °F | — | 4 | 0 | 0 | 1 |
| 3"-P150-P-10041 | main | stripped water to wastewater | oily water | BL-1806-P | PL-1022-P | 55 psi, 170 °F | 2 | 22 | 19 | 40 | 428 |
| 3"-P150-P-10822 | limit | stripped water to wastewater | oily water | PL-1022-U | blind | 55 psi, 170 °F | — | 4 | 0 | 0 | 1 |
| 6"-P300-P-10042 | main | fire water make-up | raw and service water | BL-1904-P | PL-1023-P | 160 psi, 150 °F | 1 | 17 | 14 | 11 | 235 |
| 6"-P300-P-10823 | limit | fire water make-up | raw and service water | PL-1023-U | blind | 160 psi, 150 °F | — | 4 | 0 | 0 | 1 |
| 3"-P150-P-10043 | main | boiler blowdown | oily water | BL-1910-P | PL-1024-P | 55 psi, 265 °F | 2 | 42 | 39 | 96 | 995 |
| 3"-P150-P-10824 | limit | boiler blowdown | oily water | PL-1024-U | blind | 55 psi, 265 °F | — | 4 | 0 | 0 | 1 |
| 8"-P150-P-10044 | main | raw water | raw and service water | PL-1025-P | BL-1901-P | 65 psi, 150 °F | 1 | 14 | 11 | 12 | 226 |
| 8"-P150-P-10825 | limit | raw water | raw and service water | PL-1025-U | blind | 65 psi, 150 °F | — | 4 | 0 | 0 | 2 |
| 6"-P150-P-10045 | main | purchased gas | fuel gas | PL-1026-P | BL-1918-P | 95 psi, 150 °F | 1 | 13 | 10 | 12 | 221 |
| 6"-P150-P-10826 | limit | purchased gas | fuel gas | PL-1026-U | blind | 95 psi, 150 °F | — | 4 | 0 | 0 | 1 |
| 14"-P150-P-10401 | header | low-pressure steam | steam, 50 psi | cap | cap | 80 psi, 370 °F | 3 | 39 | 38 | 55 | 1118 |
| 10"-P1200-LS-10402 | header | high-pressure steam | steam, 600 psi | cap | cap | 685 psi, 700 °F | 3 | 36 | 35 | 55 | 1118 |
| 10"-P300-LS-10403 | header | medium-pressure steam | steam, 150 psi | cap | cap | 185 psi, 450 °F | 3 | 36 | 35 | 55 | 1118 |
| 8"-P1200-SC-10404 | header | boiler feed water | boiler feed water | cap | cap | 1035 psi, 300 °F | 3 | 33 | 32 | 55 | 1118 |
| 8"-P150-P-10405 | header | fuel gas to users | fuel gas | cap | cap | 85 psi, 150 °F | 3 | 36 | 35 | 55 | 1118 |
| 4"-P150-SC-10406 | header | condensate | steam condensate | cap | cap | 55 psi, 280 °F | 3 | 38 | 37 | 55 | 1118 |
| 4"-P150-IA-10407 | header | instrument air | instrument air | cap | cap | 130 psi, 150 °F | 3 | 35 | 34 | 55 | 1118 |
| 4"-P300-W-10408 | header | service water | raw and service water | cap | cap | 160 psi, 150 °F | 3 | 33 | 32 | 55 | 1118 |
| 3"-P600-P-10409 | header | caustic | caustic solution | cap | cap | 385 psi, 150 °F | 3 | 34 | 33 | 111 | 1118 |
| 10"-P300-P-10601 | branch | medium-pressure steam | steam, 150 psi | BL-1723-P | tap 10"-P300-LS-10403 | 185 psi, 450 °F | — | 10 | 9 | 3 | 62 |
| 8"-P150-P-10602 | branch | fuel gas to users | fuel gas | BL-1919-P | tap 8"-P150-P-10405 | 85 psi, 150 °F | — | 13 | 12 | 3 | 66 |
| 8"-P300-P-10603 | branch | medium-pressure steam | steam, 150 psi | BL-1908-P | tap 10"-P300-LS-10403 | 185 psi, 450 °F | — | 17 | 16 | 2 | 73 |
| 8"-P1200-P-10604 | branch | high-pressure steam | steam, 600 psi | tap 10"-P1200-LS-10402 | BL-1409-P | 685 psi, 700 °F | — | 10 | 9 | 3 | 62 |
| 6"-P300-P-10605 | branch | medium-pressure steam | steam, 150 psi | BL-1209-P | tap 10"-P300-LS-10403 | 185 psi, 450 °F | — | 10 | 9 | 3 | 63 |
| 4"-P1200-P-10606 | branch | high-pressure steam | steam, 600 psi | tap 10"-P1200-LS-10402 | BL-1312-P | 685 psi, 700 °F | — | 11 | 10 | 3 | 56 |
| 4"-P150-P-10607 | branch | instrument air | instrument air | BL-1912-P | tap 4"-P150-IA-10407 | 130 psi, 150 °F | — | 18 | 17 | 3 | 62 |
| 4"-P150-P-10608 | branch | fuel gas to users | fuel gas | tap 8"-P150-P-10405 | BL-1119-P | 85 psi, 150 °F | — | 11 | 10 | 3 | 55 |
| 4"-P1200-P-10609 | branch | high-pressure steam | steam, 600 psi | BL-1812-P | tap 10"-P1200-LS-10402 | 685 psi, 700 °F | — | 11 | 10 | 3 | 56 |
| 3"-P600-P-10610 | branch | caustic | caustic solution | BL-1914-P | tap 3"-P600-P-10409 | 385 psi, 150 °F | — | 18 | 17 | 4 | 55 |
| 3"-P150-P-10611 | branch | fuel gas to users | fuel gas | tap 8"-P150-P-10405 | BL-1214-P | 85 psi, 150 °F | — | 17 | 16 | 4 | 57 |
| 3"-P150-P-10612 | branch | condensate | steam condensate | BL-1808-P | tap 4"-P150-SC-10406 | 55 psi, 280 °F | — | 14 | 13 | 4 | 55 |
| 3"-P150-P-10613 | branch | condensate | steam condensate | BL-1313-P | tap 4"-P150-SC-10406 | 55 psi, 280 °F | — | 11 | 10 | 4 | 60 |
| 3"-P1200-P-10614 | branch | boiler feed water | boiler feed water | tap 8"-P1200-SC-10404 | BL-1414-P | 1035 psi, 300 °F | — | 16 | 15 | 4 | 55 |
| 3"-P150-P-10615 | branch | condensate | steam condensate | BL-1413-P | tap 4"-P150-SC-10406 | 55 psi, 280 °F | — | 15 | 14 | 4 | 63 |
| 3"-P1200-P-10616 | branch | boiler feed water | boiler feed water | tap 8"-P1200-SC-10404 | BL-1811-P | 1035 psi, 300 °F | — | 12 | 11 | 4 | 62 |
| 3"-P150-P-10617 | branch | instrument air | instrument air | tap 4"-P150-IA-10407 | BL-1718-P | 130 psi, 150 °F | — | 11 | 10 | 4 | 59 |
| 3"-P600-P-10618 | branch | caustic | caustic solution | tap 3"-P600-P-10409 | BL-1722-P | 385 psi, 150 °F | — | 17 | 16 | 3 | 61 |
| 14"-P150-P-10619 | branch | low-pressure steam | steam, 50 psi | BL-1725-P | tap 14"-P150-P-10401 | 80 psi, 370 °F | — | 19 | 18 | 1 | 63 |
| 10"-P1200-P-10620 | branch | high-pressure steam | steam, 600 psi | BL-1907-P | tap 10"-P1200-LS-10402 | 685 psi, 700 °F | — | 19 | 18 | 2 | 62 |
| 10"-P150-P-10621 | branch | low-pressure steam | steam, 50 psi | tap 14"-P150-P-10401 | BL-1921-P | 80 psi, 370 °F | — | 16 | 15 | 3 | 67 |
| 10"-P150-P-10622 | branch | low-pressure steam | steam, 50 psi | BL-1410-P | tap 14"-P150-P-10401 | 80 psi, 370 °F | — | 9 | 8 | 3 | 46 |
| 10"-P150-P-10623 | branch | low-pressure steam | steam, 50 psi | tap 14"-P150-P-10401 | BL-1807-P | 80 psi, 370 °F | — | 10 | 9 | 3 | 53 |
| 8"-P1200-P-10624 | branch | boiler feed water | boiler feed water | BL-1906-P | tap 8"-P1200-SC-10404 | 1035 psi, 300 °F | — | 17 | 16 | 1 | 61 |
| 8"-P150-P-10625 | branch | low-pressure steam | steam, 50 psi | BL-1118-P | tap 14"-P150-P-10401 | 80 psi, 370 °F | — | 19 | 18 | 3 | 58 |
| 8"-P1200-P-10626 | branch | high-pressure steam | steam, 600 psi | tap 10"-P1200-LS-10402 | BL-1720-P | 685 psi, 700 °F | — | 9 | 8 | 3 | 44 |
| 6"-P150-P-10627 | branch | low-pressure steam | steam, 50 psi | BL-1909-P | tap 14"-P150-P-10401 | 80 psi, 370 °F | — | 20 | 19 | 2 | 66 |
| 4"-P300-P-10628 | branch | medium-pressure steam | steam, 150 psi | tap 10"-P300-LS-10403 | BL-1314-P | 185 psi, 450 °F | — | 17 | 16 | 3 | 55 |
| 4"-P150-P-10629 | branch | condensate | steam condensate | tap 4"-P150-SC-10406 | BL-1905-P | 55 psi, 280 °F | — | 19 | 18 | 0 | 51 |
| 4"-P300-P-10630 | branch | service water | raw and service water | BL-1902-P | tap 4"-P300-W-10408 | 160 psi, 150 °F | — | 17 | 16 | 2 | 50 |
| 4"-P300-P-10631 | branch | medium-pressure steam | steam, 150 psi | tap 10"-P300-LS-10403 | BL-1613-P | 185 psi, 450 °F | — | 19 | 18 | 2 | 55 |
| 4"-P150-P-10632 | branch | low-pressure steam | steam, 50 psi | tap 14"-P150-P-10401 | BL-1213-P | 80 psi, 370 °F | — | 16 | 15 | 2 | 57 |
| 4"-P1200-P-10633 | branch | boiler feed water | boiler feed water | tap 8"-P1200-SC-10404 | BL-1719-P | 1035 psi, 300 °F | — | 11 | 10 | 3 | 51 |
| 3"-P150-P-10634 | branch | fuel gas to users | fuel gas | tap 8"-P150-P-10405 | BL-1415-P | 85 psi, 150 °F | — | 16 | 15 | 2 | 46 |
| 3"-P300-P-10635 | branch | medium-pressure steam | steam, 150 psi | tap 10"-P300-LS-10403 | BL-1510-P | 185 psi, 450 °F | — | 15 | 14 | 3 | 47 |
| 3"-P300-P-10636 | branch | service water | raw and service water | tap 4"-P300-W-10408 | BL-1721-P | 160 psi, 150 °F | — | 9 | 8 | 3 | 41 |
| 3"-P150-P-10637 | branch | fuel gas to users | fuel gas | tap 8"-P150-P-10405 | BL-1315-P | 85 psi, 150 °F | — | 11 | 10 | 3 | 44 |
| 3"-P1200-P-10638 | branch | boiler feed water | boiler feed water | tap 8"-P1200-SC-10404 | BL-1117-P | 1035 psi, 300 °F | — | 12 | 11 | 3 | 51 |
| 3"-P150-P-10639 | branch | fuel gas to users | fuel gas | tap 8"-P150-P-10405 | BL-1511-P | 85 psi, 150 °F | — | 18 | 17 | 3 | 55 |
| 3"-P150-P-10640 | branch | fuel gas to users | fuel gas | tap 8"-P150-P-10405 | BL-1614-P | 85 psi, 150 °F | — | 17 | 16 | 2 | 46 |
| 3"-P1200-P-10641 | branch | boiler feed water | boiler feed water | tap 8"-P1200-SC-10404 | BL-1212-P | 1035 psi, 300 °F | — | 16 | 15 | 3 | 51 |
| 3"-P150-P-10642 | branch | fuel gas to users | fuel gas | tap 8"-P150-P-10405 | BL-1813-P | 85 psi, 150 °F | — | 11 | 10 | 3 | 44 |
| 3"-P150-P-10643 | branch | condensate | steam condensate | BL-1726-P | tap 4"-P150-SC-10406 | 55 psi, 280 °F | — | 16 | 15 | 2 | 52 |

