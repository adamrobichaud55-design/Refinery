/**
 * Plant 3's plot plan (DESIGN_BASIS.md §77, SW-SITE-3..7): the benches, the plot of each unit and building, the rows
 * of tanks in their dikes, the roads and the pipeways. Drawing data, in feet in the site frame (x east, z south);
 * SmartWeld's own arrangement of an invented site (PROVENANCE P-79). A test checks it against the spacings of SW-SITE-5.
 */
import { grade, meanGround, natural, shore, type Bench, type Road, type Rect, type Ground } from './terrain';
import { sizing } from './sizing';
import { BBL_FT3 } from './fluids';

const R = (x0: number, x1: number, z0: number, z1: number): Rect => ({ x0, x1, z0, z1 });
/** SW-SITE-3, SW-SITE-4: the benches; each one's elevation is the mean of the natural ground over it */
const BENCH_RECTS: [string, string, Rect][] = [
  ['process', 'Process bench', R(850, 3050, 2110, 3260)],
  ['south', 'South tank terrace', R(940, 3560, 1390, 1860)],
  ['north', 'North tank terrace', R(1000, 3160, 740, 1200)],
  ['lpg', 'Liquefied gas bench', R(3760, 4260, 1480, 1880)],
  ['waste', 'Wastewater bench', R(3600, 4300, 2750, 3250)],
  ['admin', 'Administration bench', R(140, 760, 2250, 3150)],
  ['truck', 'Truck loading bench', R(200, 780, 1500, 2050)],
  ['flare', 'Flare pad', R(470, 570, 470, 570)],
  ['jetty', 'Jetty head', R(1080, 1320, 4080, 4260)],
  ['pond', 'Storm pond', R(3720, 4080, 3300, 3400)],
];
export const BENCHES: Bench[] = BENCH_RECTS.map(([id, name, r]) => ({ id, name, ...r, el: meanGround(r) }));
export const bench = (id: string) => { const b = BENCHES.find(x => x.id === id); if (!b) throw new Error(`no bench ${id}`); return b; };

/** what stands on a plot */
export type PlotKind = 'unit' | 'tower' | 'building' | 'pad' | 'spare' | 'pond';
/** a plot: the ground a unit, a building or an item stands on. A unit's battery limit is on the side it faces. */
export interface Plot extends Rect { id: string; name: string; unit: number; bench: string; kind: PlotKind; faces?: 'N' | 'S'; /** a building's height, ft */ height?: number }
const P = (id: string, name: string, unit: number, b: string, kind: PlotKind, r: Rect, o: Partial<Plot> = {}): Plot => ({ id, name, unit, bench: b, kind, ...r, ...o });
/** SW-SITE-4: the main pipeway runs east–west at z = 2,700 in a corridor 100 ft wide (the rack, and an access way each side), with the units on both sides of it */
export const PIPEWAY_Z = 2700, PIPEWAY_HALF = 50;
const N0 = PIPEWAY_Z - PIPEWAY_HALF, S0 = PIPEWAY_Z + PIPEWAY_HALF;
export const PLOTS: Plot[] = [
  // north of the main pipeway, west to east: utilities upwind, then the crude and vacuum units, the cracker, the cooling tower downwind
  P('U19', 'Utilities', 19, 'process', 'unit', R(1000, 1420, 2170, N0), { faces: 'S' }),
  P('U11', 'Crude distillation', 11, 'process', 'unit', R(1520, 1820, 2230, N0), { faces: 'S' }),
  P('U12', 'Vacuum distillation', 12, 'process', 'unit', R(1920, 2180, 2350, N0), { faces: 'S' }),
  P('U17', 'Fluid catalytic cracker', 17, 'process', 'unit', R(2280, 2620, 2170, N0), { faces: 'S' }),
  P('CT', 'Cooling tower', 19, 'process', 'tower', R(2720, 2920, 2190, 2590)),
  // south of it: the hydrogen users beside the reformer that feeds them, the sulfur block downwind
  P('U13', 'Naphtha hydrotreater', 13, 'process', 'unit', R(1000, 1240, S0, 3070), { faces: 'N' }),
  P('U14', 'Catalytic reformer', 14, 'process', 'unit', R(1340, 1600, S0, 3110), { faces: 'N' }),
  P('U15', 'Kerosene hydrotreater', 15, 'process', 'unit', R(1700, 1920, S0, 3010), { faces: 'N' }),
  P('U16', 'Diesel hydrotreater', 16, 'process', 'unit', R(2020, 2260, S0, 3090), { faces: 'N' }),
  P('U18', 'Sulfur block', 18, 'process', 'unit', R(2360, 2620, S0, 3150), { faces: 'N' }),
  P('FUT', 'Space for a future unit', 0, 'process', 'spare', R(2720, 2940, S0, 3150)),
  // offsites
  P('U23', 'Truck loading', 23, 'truck', 'unit', R(260, 720, 1560, 1990)),
  P('U24', 'Wastewater treatment', 24, 'waste', 'unit', R(3660, 4240, 2810, 3190)),
  P('U25', 'Flare stack and seal drum', 25, 'flare', 'pad', R(480, 560, 480, 560)),
  // the knock-out drum stands at the low end of the flare header, so that what condenses in the header drains to it
  P('U25K', 'Flare knock-out drum', 25, 'process', 'pad', R(865, 945, 2170, 2290)),
  P('U22', 'Marine terminal shore station', 22, 'jetty', 'unit', R(1100, 1300, 4100, 4250)),
  P('POND', 'Storm pond', 24, 'pond', 'pond', R(3740, 4060, 3315, 3385)),
  P('U26', 'Fire water tanks and pumps', 26, 'admin', 'unit', R(520, 740, 2290, 2450)),
  // unit 27: buildings, upwind at the west boundary; offices, workshops and stores 500 ft from the nearest unit, the control building 250 ft
  P('B-GATE', 'Gatehouse', 27, 'admin', 'building', R(160, 200, 2650, 2680), { height: 12 }),
  P('B-WARE', 'Warehouse', 27, 'admin', 'building', R(230, 470, 2290, 2400), { height: 28 }),
  P('B-FIRE', 'Fire station', 27, 'admin', 'building', R(230, 350, 2450, 2530), { height: 22 }),
  P('B-CANT', 'Canteen and change house', 27, 'admin', 'building', R(230, 390, 2575, 2645), { height: 14 }),
  P('B-ADMIN', 'Administration office', 27, 'admin', 'building', R(230, 430, 2760, 2850), { height: 28 }),
  P('B-LAB', 'Laboratory', 27, 'admin', 'building', R(230, 350, 2900, 2960), { height: 16 }),
  P('B-SHOP', 'Workshop', 27, 'admin', 'building', R(230, 430, 3010, 3100), { height: 30 }),
  P('B-SUB', 'Main substation', 27, 'admin', 'building', R(620, 740, 2500, 2590), { height: 20 }),
  P('B-CTRL', 'Control building', 27, 'admin', 'building', R(640, 740, 2790, 2910), { height: 18 }),
];
export const plot = (id: string) => { const p = PLOTS.find(x => x.id === id); if (!p) throw new Error(`no plot ${id}`); return p; };

/** a row of tanks of one kind of stock in one dike (SW-SITE-5, SW-CIV-14) */
export interface TankSpot { tag: string; unit: number; x: number; z: number; D: number; H: number }
export interface Dike extends Rect { id: string; name: string; unit: number; bench: string; tanks: TankSpot[]; /** wall height, ft */ wall: number; /** what it holds to the top of its wall, and 1.1 × its largest tank, ft³ */ holds: number; needs: number }
/** the rows: stock, bench, the dike's inner west edge and centre line, and its tanks from west to east */
const ROWS: [string, string, number, string, number, number, string[]][] = [
  ['crude', 'Crude oil', 20, 'south', 1014, 1588, ['T-2001', 'T-2002', 'T-2003', 'T-2004', 'T-2005']],
  ['black', 'Fuel oil, asphalt and gas oil', 21, 'south', 2420, 1588, ['T-2115', 'T-2116', 'T-2117', 'T-2118', 'T-2104', 'T-2119']],
  ['slop', 'Slop oil', 21, 'south', 3370, 1588, ['T-2120', 'T-2121']],
  ['gasoline', 'Gasoline', 21, 'north', 1070, 950, ['T-2108', 'T-2109', 'T-2110']],
  ['components', 'Naphthas and gasoline components', 21, 'north', 1678, 950, ['T-2107', 'T-2106', 'T-2105', 'T-2101', 'T-2102']],
  ['distillates', 'Jet fuel and diesel', 21, 'north', 2391, 950, ['T-2111', 'T-2112', 'T-2113', 'T-2114', 'T-2103']],
];
let dikes: Dike[] | undefined;
export function DIKES(): Dike[] {
  if (dikes) return dikes;
  const Z = sizing();
  dikes = ROWS.map(([id, name, unit, b, x0, zc, tags]) => {
    const t = tags.map(tag => { const d = Z.get(unit)!.equip.get(tag)!.d; return { tag, D: d.Dft, H: d.Hft, bbl: d.bbl }; });
    const toe = Math.max(15, Math.max(...t.map(x => x.H)) / 2), spots: TankSpot[] = []; let x = x0 + toe;
    t.forEach((k, i) => { if (i) x += Math.max(50, Math.max(k.D, t[i - 1].D) / 2); spots.push({ tag: k.tag, unit, x: x + k.D / 2, z: zc, D: k.D, H: k.H }); x += k.D; });
    const L = x + toe - x0, foot = t.reduce((a, k) => a + (Math.PI / 4) * k.D ** 2, 0), needs = 1.1 * Math.max(...t.map(k => k.bbl)) * BBL_FT3;
    // SW-SITE-5: as wide as the toe clearance asks, and wider where the wall would pass 6 ft
    const W = Math.ceil(Math.max(Math.max(...t.map(k => k.D)) + 2 * toe, (needs / 6 + foot) / L)), wall = Math.max(1.5, Math.ceil((needs / (L * W - foot)) * 2) / 2);
    return { id, name, unit, bench: b, tanks: spots, x0, x1: x0 + L, z0: zc - W / 2, z1: zc + W / 2, wall, holds: (L * W - foot) * wall, needs };
  });
  return dikes;
}
/** liquefied gas: spheres in a row a diameter apart, and the loading bullets beside them (SW-SITE-5) */
export interface PressureSpot { tag: string; x: number; z: number; D: number; L?: number }
export function spheres(): PressureSpot[] {
  const Z = sizing().get(21)!.equip, out: PressureSpot[] = []; let x = 3900;
  for (const tag of ['S-2101', 'S-2102', 'S-2103']) { const D = Z.get(tag)!.d.Dft; out.push({ tag, x: x + D / 2, z: 1720, D }); x += 2 * D; }
  ['S-2104', 'S-2105'].forEach((tag, i) => { const d = Z.get(tag)!.d; out.push({ tag, x: 3940, z: 1560 + i * (2 * d.D) / 12, D: d.D / 12, L: d.L / 12 }); });
  return out;
}

/** SW-SITE-6: roads. A ramp runs at one grade between its two ends; any other road takes the level of the bench it is on, or the natural ground. */
const ROAD_LINES: [string, string, number, [number, number][], boolean?][] = [
  ['main', 'Main road from the gate', 24, [[0, 2700], [140, 2700], [760, 2700], [975, 2700]]],
  ['ring', 'Process ring road', 24, [[975, 2135], [3025, 2135], [3025, 3235], [975, 3235], [975, 2135]]],
  ...[1470, 1870, 2230].map((x, i): [string, string, number, [number, number][]] => [`n${i + 1}`, 'Road between units', 20, [[x, 2135], [x, N0]]]),
  ...[1290, 1650, 1970, 2310].map((x, i): [string, string, number, [number, number][]] => [`s${i + 1}`, 'Road between units', 20, [[x, S0], [x, 3235]]]),
  ['cross', 'Road across the pipeway', 20, [[2670, 2135], [2670, 3235]]],
  ['rampSouth', 'Ramp to the south terrace', 24, [[1470, 2135], [1100, 1840]], true],
  ['south', 'South terrace road', 24, [[965, 1840], [3535, 1840], [3535, 1410], [965, 1410], [965, 1840]]],
  ['southMid', 'Road between the dikes', 20, [[2353, 1410], [2353, 1840]]],
  ['rampNorth', 'Ramp to the north terrace', 24, [[2353, 1410], [2880, 1180]], true],
  ['north', 'North terrace road', 24, [[1020, 1180], [3140, 1180], [3140, 760], [1020, 760], [1020, 1180]]],
  ['lpg', 'Road to the liquefied gas bench', 20, [[3025, 2135], [3780, 1860]], true],
  ['lpgRing', 'Liquefied gas bench road', 20, [[3780, 1860], [4240, 1860], [4240, 1500], [3780, 1500], [3780, 1860]]],
  ['waste', 'Road to the wastewater bench', 20, [[3025, 2700], [3620, 3000]], true],
  ['east', 'East road', 20, [[3900, 1880], [3900, 2750]], true],
  ['wasteRing', 'Wastewater bench road', 20, [[3620, 3000], [3620, 2770], [4280, 2770], [4280, 3230], [3620, 3230], [3620, 3000]]],
  ['jetty', 'Road to the jetty', 20, [[975, 3235], [1100, 4100]], true],
  ['truckGate', 'Truck gate road', 24, [[0, 1775], [200, 1775], [240, 1775]]],
  ['truckRing', 'Truck loading road', 24, [[240, 1530], [760, 1530], [760, 2020], [240, 2020], [240, 1530]]],
  ['adminTruck', 'Road from the offices to truck loading', 20, [[700, 2270], [300, 2040]], true],
  ['adminNorth', 'Administration road', 20, [[490, 2700], [490, 2270], [700, 2270]]],
  ['adminSouth', 'Administration road', 20, [[490, 2700], [490, 3125]]],
  ['truckSouth', 'Road from truck loading to the tanks', 20, [[780, 1800], [965, 1800]], true],
  ['flare', 'Track to the flare', 16, [[1020, 760], [1000, 300], [640, 300], [300, 400], [470, 520]], true],
];
function roadLevels(pts: [number, number][], ramp: boolean): number[] {
  const at = ([x, z]: [number, number]) => { const b = BENCHES.find(k => x >= k.x0 && x <= k.x1 && z >= k.z0 && z <= k.z1); return b ? b.el : natural(x, z); };
  if (!ramp) return pts.map(at);
  const a = at(pts[0]), b = at(pts[pts.length - 1]), len = pts.map((p, i) => (i ? Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0)), total = len.reduce((s, v) => s + v, 0); let run = 0;
  return pts.map((_, i) => { run += len[i]; return a + ((b - a) * run) / total; });
}
export const ROADS: Road[] = ROAD_LINES.map(([id, name, width, pts, ramp]) => ({ id, name, width, pts, el: roadLevels(pts, !!ramp) }));

/** pipeways: where lines run between units and areas (SW-SITE-4); built in the piping stage */
export interface Pipeway { id: string; name: string; kind: 'rack' | 'sleepers' | 'trestle'; width: number; pts: [number, number][] }
export const PIPEWAYS: Pipeway[] = [
  { id: 'main', name: 'Main pipeway', kind: 'rack', width: 40, pts: [[990, PIPEWAY_Z], [2990, PIPEWAY_Z]] },
  { id: 'tanks', name: 'Tank farm pipeway', kind: 'sleepers', width: 30, pts: [[2200, N0], [2200, 2135], [2200, 1805], [2390, 1805], [2390, 1150]] },
  { id: 'southTrack', name: 'South terrace pipe track', kind: 'sleepers', width: 24, pts: [[990, 1805], [3500, 1805]] },
  { id: 'northTrack', name: 'North terrace pipe track', kind: 'sleepers', width: 24, pts: [[1050, 1150], [3110, 1150]] },
  { id: 'jetty', name: 'Jetty pipeway', kind: 'sleepers', width: 30, pts: [[990, 1805], [900, 1900], [900, 3300], [1200, 4100], [1200, 4260]] },
  { id: 'trestle', name: 'Jetty trestle', kind: 'trestle', width: 40, pts: [[1200, 4260], [1200, 5060]] },
  { id: 'flare', name: 'Flare line', kind: 'sleepers', width: 12, pts: [[990, PIPEWAY_Z], [905, PIPEWAY_Z], [905, 2290], [905, 2170], [900, 1900], [900, 1250], [900, 850], [560, 550]] },
  { id: 'lpg', name: 'Liquefied gas lines', kind: 'sleepers', width: 16, pts: [[2990, PIPEWAY_Z], [3000, 2200], [3760, 1820]] },
  { id: 'waste', name: 'Wastewater lines', kind: 'sleepers', width: 16, pts: [[2990, PIPEWAY_Z], [3040, 2730], [3620, 3030]] },
  { id: 'truck', name: 'Truck loading lines', kind: 'sleepers', width: 16, pts: [[990, 1805], [780, 1830], [740, 1830]] },
];
/** the berth: its loading platform, the deck level of the trestle, and the dolphins a tanker lies against and moors to */
export const JETTY = { deck: 32, platform: R(1130, 1270, 5060, 5140), breasting: [[1040, 5150], [1360, 5150]] as [number, number][], mooring: [[780, 5110], [1620, 5110]] as [number, number][], berthLine: 5160, ship: R(800, 1600, 5165, 5305) };
/** SW-SITE-6: the fence, 50 ft inside the property line and along the top of the bank; and the two gates */
export function fenceLine(): [number, number][] {
  const pts: [number, number][] = [[50, 50], [4950, 50]];
  for (let x = 4950; x >= 50; x -= 50) pts.push([x, x > 1050 && x < 1350 ? 4275 : shore(x) - 80]);   // round the seaward side of the jetty head
  pts.push([50, shore(50) - 80], [50, 50]);
  return pts;
}
export const GATES: { name: string; x: number; z: number }[] = [{ name: 'Main gate', x: 50, z: 2700 }, { name: 'Truck gate', x: 50, z: 1775 }];
/** the flare: where its stack stands and the radius kept bare round it (SW-SITE-4) */
export const FLARE = { x: 520, z: 520, sterile: 300, clear: 500 };

let ground: Ground | undefined;
/** the finished ground of the site */
export const siteGround = (): Ground => (ground ??= grade(BENCHES, ROADS));
