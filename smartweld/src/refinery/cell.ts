/**
 * Plant 3: a unit built in its own frame (DESIGN_BASIS.md §78, SW-CELL-1..5). Each sized item of the process model
 * becomes a catalogue body at its size, standing in its row beside the unit's rack. Inches; x from the battery limit
 * along the rack, z across, y up. The steel of the rack and the pads are built by the interior kit of plants 1 and 2,
 * unchanged; nozzles are not part of a body (the piping stage adds them).
 */
import {
  makeVerticalVessel, makeHorizontalVessel, makeExchanger, makePump, pumpShaftY, makeAirCooler, makeFiredHeater, makeCompressorPackage, makeBlower,
  makePlatformedColumn, makeSwagedTower, makeCabinHeater, makeConeRoofTank, makeCatCracker, makeWetScrubber, makeFlueGasCooler, makeSulfurFurnace,
  makeSulfurCondenser, makeIncinerator, makeWaterTubeBoiler, makeTurbineCompressor, makeLoadingStation, makeCoolingTower, makeSilo, makeDeaerator, makeEjector, makeSulfurPit, makeSeparatorBasin,
  makeEjectorSet, ejectorSetLayout, makeShellTubeExchanger, makeGrating, makeRod, GRATING, type EjectorSetInput, type Cut,
  MOTOR_SHAFT, designFlange, pipeDims, gateFaceToFace, globeFaceToFace, elbowRadius, makeWideFlange, proportionW, type PartSpec, type PipeClass,
} from '../catalogue';
import { K } from '../core/constants';
import { zReq } from '../scene/structures';
import { sizeW } from '../generator/building';
import { partFromKey } from '../generator/piping';
import type { Dim } from '../core/basis';
import { frameFromAxes, multiply, translate, standUp, rotateY } from '../geometry/transform';
import { unitHeaders, connection } from './headers';
import type { Mat4 } from '../geometry/mesh';
import type { Placed } from '../generator/building';
import type { InteriorModel } from '../generator/interior';
import { interiorKit, type RackLayout } from '../generator/interiorKit';
import { processModel } from './process';
import { sizing, tubeCount, type EquipSize } from './sizing';
import type { Equip, UnitSheet, EqKind } from './flowsheet';
import { cfs, FLUIDS } from './fluids';
import { buildGeometry } from '../geometry/partGeometry';
import { nozzleStandout } from '../generator/nozzles';

const up = (v: number, s = 6) => Math.ceil(v / s - 1e-9) * s, down = (v: number, s = 6) => Math.floor(v / s + 1e-9) * s, near = (v: number, s = 6) => Math.round(v / s) * s;
/** SW-CELL-2: the unit rack */
export const RACK = { start: 360, bent: 240, half: 144, tiers: [192, 264, 336] as const, loadPsf: 40 };
export const PAD = 6, PUMP_PAD = 9, Y_VESSEL = PAD + 1.5 + 0.75;
/** SW-CELL-4: the air coolers' deck, top of steel, 9 ft above the rack's top tier; the rack's column depth (SW-RK-2: top tier / 24, to 2 in) */
/** SW-CELL-6: the underside of the yard's support beams */
export const YARD = 366;
export const DECK = RACK.tiers[RACK.tiers.length - 1] + 108, RACK_COL = Math.ceil(RACK.tiers[RACK.tiers.length - 1] / 24 / 2) * 2;
/** SW-CELL-4 (amended 2026-11-27): an air cooler's columns, 2 ft less what the deck's girders (W12x40, centred 6 in under DECK by their nominal depth and drawn
 *  at their own, SW-W-5) stand above DECK; the cooler's column bases are on the girders' tops and its plenum where 2 ft columns on DECK put it */
export const COOLER_LEG = 24 - (proportionW(12, 40).d / 2 - 6);
export type Lane = 'pump' | 'exchanger' | 'air' | 'vessel' | 'heater' | 'pit' | 'under' | 'behind';
/** where a body stands in its unit, and the facts of its shape the nozzle schedule needs */
export interface Spot {
  tag: string; item: string; kind: EqKind; lane: Lane; side: 1 | -1; x: number; z: number; /** footprint along and across the rack, and height */ lx: number; lz: number; h: number;
  shape: 'vv' | 'hv' | 'hx' | 'pump' | 'machine' | 'tank' | 'cabin' | 'box'; /** the origin of the body's own frame */ o?: [number, number, number]; /** outside radius; bottom and top tangent, or centre line; axis direction of a horizontal body */ R?: number; yb?: number; yt?: number; yc?: number; axis?: 'x' | 'z'; len?: number;
  /** a plane on the grid square to the axis: a pump's or compressor's casing centre, an exchanger's channel centre; and a pump's suction end */ zc?: number; zs?: number;
  /** the platform floors of a column, elevations */ floors?: number[];
  /** the tags of the parts that make up the body */ parts?: string[];
  /** round holes in the body's own floor where pipes pass, in plan (SW-CELL-4) */ holes?: { x: number; z: number; r: number }[];
}
export interface CellModel { unit: number; name: string; rack: RackLayout; spots: Spot[]; interior: InteriorModel; /** where the yard's support beams run, z, on each side that has one */ yard: { neg?: number; pos?: number }; /** the unit's extent in its own frame */ x1: number; z0: number; z1: number; y1: number }

/** SW-CELL-4: the room a connection under a shell needs for the generator's stack (SW-LL-6): its standout, the blind and gaskets, a gate valve, a weld-neck flange, an elbow, half the pipe and 18 in */
export function valveDrop(NPS: number, cls: PipeClass, throttled = false): number {
  const f = designFlange(NPS, cls), OD = pipeDims(NPS, cls).OD, v = gateFaceToFace(NPS, cls) + 2 * f.rfH, Lf = f.tf + f.hubLen + f.neckLen;
  // a water consumer's inlet also carries a throttling globe valve, a flanged 6 in stub between the two valves (SW-LL-7, SW-LL-8)
  return f.OD / 2 + 3 + 1.5 + v + Lf + elbowRadius(OD) + OD / 2 + 18 + (throttled ? globeFaceToFace(NPS, cls) + 2 * f.rfH + 6 + 2 * Lf + 1 : 0);
}
/** SW-CELL-3: how far a pump's suction valve set reaches from the casing's end toward the rack (SW-LL-6): the nozzle's standout, the spade and gaskets, a flange of the
 *  nozzle's size, the reducer (as long as its larger size at most; 6 in of pipe where there is none), two flanges of the line's size about a gate valve, and the turn after it */
export function suctionReach(lineNPS: number, nozNPS: number, cls: PipeClass): number {
  const fn = designFlange(nozNPS, cls), fl = designFlange(lineNPS, cls), L = (f: typeof fn) => f.tf + f.hubLen + f.neckLen;
  return nozzleStandout(nozNPS, cls) + 2 + L(fn) + (lineNPS !== nozNPS ? lineNPS : 6) + 2 * L(fl) + gateFaceToFace(lineNPS, cls) + 2 * fl.rfH + elbowRadius(pipeDims(lineNPS, cls).OD);
}
/** a body before it is placed: its footprint and how to build it at a spot */
interface Plan { tag: string; item: string; kind: EqKind; lane: Lane; lx: number; lz: number; h: number; gap?: number; side?: 1 | -1; /** a vessel the flowsheet states to stand across the rack, on the exchangers' side (SW-CELL-3) */ across?: boolean; /** room along the row kept with it for what must stand next to it (a column's reboiler) */ keep?: number; /** a pump: the room its suction valve set needs between the casing's end and the rack's columns */ reach?: number; /** stands in the ground, with no pad (a pit, a basin) */ ground?: boolean; /** SW-CELL-7: the solid whose centre is brought onto the 6 in grid in the axes named, so that connections on it can be met (in y by a thicker pad) */ align?: { solid?: RegExp; /** or a point of the body's own frame */ point?: [number, number, number]; axes: string; /** across the rack, onto the row's own centre line, not the nearest grid line: bodies whose ducts run from one to the next along the row share an axis */ onLine?: boolean }; /** SW-CELL-4: stands on concrete piers this high, one under each of its solids named */ raise?: { by: number; under: RegExp }; build: (c: Ctx, s: Spot) => void }
interface Ctx { out: Placed[]; equipment: InteriorModel['equipment']; kit: ReturnType<typeof interiorKit> }
type V3 = [number, number, number];
export interface SolidBox { part: string; name: string; mn: V3; mx: V3 }
const ownBoxes = new WeakMap<PartSpec, { name: string; mn: V3; mx: V3 }[]>();
/** the boxes of a part's solids in its own frame */
function partBoxes(p: PartSpec): { name: string; mn: V3; mx: V3 }[] {
  let r = ownBoxes.get(p); if (r) return r; r = [];
  for (const so of buildGeometry(p).solids) { const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity], P = so.mesh.positions; for (let i = 0; i < P.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], P[i + a]); mx[a] = Math.max(mx[a], P[i + a]); } if (Number.isFinite(mn[0])) r.push({ name: so.name ?? '', mn, mx }); }
  ownBoxes.set(p, r); return r;
}
/** the lowest point of a placed part's solids */
function lowestY(pl: Placed): number { const T = pl.transform as number[]; let lo = Infinity; for (const so of buildGeometry(pl.part).solids) { const P = so.mesh.positions; for (let i = 0; i < P.length; i += 3) lo = Math.min(lo, T[1] * P[i] + T[5] * P[i + 1] + T[9] * P[i + 2] + T[13]); } return lo; }
/** SW-CELL-4 (amended): how far from the vertical axis through (x, z) a part's solids reach between the heights y0 and y1, counting only what lies
 *  within `near` of it: the greatest distance in plan of the solids' corners there and of their edges where they cross y0 and y1 */
function reachBetween(p: PartSpec, x: number, z: number, y0: number, y1: number, near: number): number {
  let r = 0;
  for (const so of buildGeometry(p).solids) {
    const P = so.mesh.positions, I = so.mesh.indices, d = (xx: number, zz: number) => Math.hypot(xx - x, zz - z), take = (v: number) => { if (v <= near && v > r) r = v; };
    for (let i = 0; i < P.length; i += 3) if (P[i + 1] >= y0 && P[i + 1] <= y1) take(d(P[i], P[i + 2]));
    for (let t = 0; t < I.length; t += 3) for (const [a, b] of [[I[t], I[t + 1]], [I[t + 1], I[t + 2]], [I[t + 2], I[t]]]) for (const y of [y0, y1]) {
      const ya = P[3 * a + 1], yb = P[3 * b + 1]; if ((ya - y) * (yb - y) > 0 || ya === yb) continue;
      const u = (y - ya) / (yb - ya); take(d(P[3 * a] + (P[3 * b] - P[3 * a]) * u, P[3 * a + 2] + (P[3 * b + 2] - P[3 * a + 2]) * u));
    }
  }
  return r;
}
/** a box under a transform: the box of its eight corners (exact for the quarter turns bodies are placed by) */
function boxAt(b: { mn: V3; mx: V3 }, T: Mat4): { mn: V3; mx: V3 } {
  const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity];
  for (let k = 0; k < 8; k++) { const q = [k & 1 ? b.mx[0] : b.mn[0], k & 2 ? b.mx[1] : b.mn[1], k & 4 ? b.mx[2] : b.mn[2]]; for (let a = 0; a < 3; a++) { const w = T[a] * q[0] + T[4 + a] * q[1] + T[8 + a] * q[2] + T[12 + a]; mn[a] = Math.min(mn[a], w); mx[a] = Math.max(mx[a], w); } }
  return { mn, mx };
}
/** what holds a body down rather than carries it: left out when its lowest point is looked for */
const HELD = /anchor|holding-down|bolts|studs and nuts/i;
/** the solids of placed parts as boxes in the frame they are placed in */
function placedBoxes(list: { part: PartSpec; transform: Mat4; tag?: string }[]): SolidBox[] { return list.flatMap(q => partBoxes(q.part).map(b => ({ part: q.tag ?? '', name: b.name, ...boxAt(b, q.transform) }))); }
function union(bs: { mn: V3; mx: V3 }[]): { mn: V3; mx: V3 } { const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity]; for (const b of bs) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], b.mn[a]); mx[a] = Math.max(mx[a], b.mx[a]); } return { mn, mx }; }
const solidCache = new WeakMap<CellModel, Map<string, SolidBox[]>>();
/** SW-CELL-7: the solids of a body as boxes in the unit's frame, by the body's tag: what a connection is set on */
export function bodySolids(cell: CellModel, tag: string): SolidBox[] {
  let m = solidCache.get(cell); if (!m) solidCache.set(cell, (m = new Map()));
  let r = m.get(tag); if (!r) { const sp = cell.spots.find(q => q.tag === tag), parts = new Set(sp?.parts ?? [tag]); m.set(tag, (r = placedBoxes(cell.interior.equipment.filter(q => parts.has(q.tag))))); }
  return r;
}
/** the boxes of the cell's own works that carry every tag given: a body's pad, the piers it stands on (SW-CELL-4) */
export function worksBoxes(cell: CellModel, ...tags: string[]): SolidBox[] { return placedBoxes(cell.interior.instances.filter(i => tags.every(t => i.tags.includes(t)))); }
const SUFFIX = 'ABCDEFGH';
/** a catalogue item without the nozzles it draws for the catalogue: the piping stage adds the plant's own (SW-CELL-4) */
export function bare(p: PartSpec): PartSpec {
  // a compressor's lube oil piping is left out with the nozzles: the generator would hold its bounding box, which spans the casing, as solid;
  // a vessel's level connections are instrument connections, outside this model's scope
  const solids = (p.extra?.solids as { name: string }[] | undefined)?.filter(s => !/nozzle|blind flange|flange face|stub|lube oil piping|level connection|^superheated steam outlet: /i.test(s.name) || /manway/i.test(s.name));   // a boiler's drawn steam outlet gives way to the plant's own connection
  return solids ? { ...p, extra: { ...p.extra, solids } } : p;
}

/** SW-CELL-4: a connection at which the generator stands a throttling globe valve after the block valve (SW-LL-7): where a water connection from a header arrives, and where a cooling water return leaves; water above class P300, and any line of the flowsheet, is piped as a process line (SW-RPI-3) */
const throttled = (q: { fluid: string; cls: PipeClass; dir: 'in' | 'out'; util?: string }) => { const sv = FLUIDS[q.fluid].svc; return q.util !== undefined && ['CWS', 'CWR', 'W'].includes(sv) && Number(q.cls.slice(1)) <= 300 && (q.dir === 'in' || sv === 'CWR'); };
/** SW-CELL-4: how far a horizontal drum's underside stands above its pad: 4 ft, 10 ft where a pump draws from it, and what the valve under its largest liquid outlet needs */
function drumUnder(sh: UnitSheet, e: Equip, z: EquipSize): number {
  const feedsPump = sh.lines.some(l => l.from.k === 'eq' && l.from.tag === e.tag && l.to.k === 'eq' && sh.equip.get(l.to.tag)?.kind === 'pump');
  return up(Math.max(feedsPump ? 120 : 48, ...z.nozzles.filter(q => q.dir === 'out' && !/gas|vapour|vent|steam out/.test(q.port)).map(q => valveDrop(q.NPS, q.cls))));
}
/** SW-CELL-3: a drum that tail pipes run down to */
const isHotwell = (sh: UnitSheet, tag: string) => sh.lines.some(l => l.to.k === 'eq' && l.to.tag === tag && /^tail pipe/.test(l.to.port));
/** SW-EQC-68's input from the sizes of SW-PRC-18 */
export function ejectorSetInput(tag: string, z: EquipSize): EjectorSetInput {
  const d = z.d, n = d.stages, nz = (port: string) => { const q = z.nozzles.find(v => v.port === port); if (!q) throw new Error(`${tag}: no connection "${port}"`); return q; };
  return { tag, steam: nz('motive steam').NPS, steamCls: nz('motive steam').cls, water: nz('cooling water in').NPS,
    stages: Array.from({ length: n }, (_, k) => ({ suction: d[`s${k + 1}Suction`], discharge: d[`s${k + 1}Discharge`], motive: d[`s${k + 1}Motive`], ID: d[`c${k + 1}ID`], t: d[`c${k + 1}Shell`], vent: d[`c${k + 1}Vent`], water: d[`c${k + 1}Water`], drain: nz(k + 1 < n ? `condensate ${k + 1}` : 'outlet').NPS })) };
}
/** SW-CELL-4: the deck's floor load, psf (SW-STA-12), and a 3/4 in tube's weight, lb/ft (wall d / 9, SW-EQC-30) */
const DECK_PSF = 250, TUBE_LB_FT = (Math.PI / 4) * (0.75 ** 2 - (0.75 * (7 / 9)) ** 2) * 12 * K.STEEL_DENSITY_LB_IN3;
/** SW-CELL-3: the room between two bodies whose connections face one another on one axis, joined by a straight duct: the valve the generator stands at each end (not built: SW-RPI-14), each connection's own length, and 2 ft of pipe between */
const ductRoom = (NPS: number, cls: PipeClass) => up(2 * (stackLength(NPS, cls) + nozzleStandout(NPS, cls)) + 12, 12);
/** the length the generator's valve, its gaskets, the line's flange and the lead pipe behind it take at a connection (SW-LL-6): what a line needs straight before its first turn, whether the valve is built or not */
const stackLength = (NPS: number, cls: PipeClass) => gateFaceToFace(NPS, cls) + 2 * NPS + 12;
/** SW-CELL-4: the wet scrubber as the plant builds it: its gas inlet duct level and of its line's outside diameter; turned end for end, its pumps on the other side, where its gas comes from an item before it in the row (SW-CELL-3) */
function scrubberBody(sh: UnitSheet, e: Equip, z: EquipSize): { body: PartSpec; D: number; turned: boolean; duct?: { NPS: number; cls: PipeClass } } {
  const gas = e.ports.find(p => p.name.startsWith('stack'))!.s, D = up(Math.sqrt((4 * cfs(gas)) / (Math.PI * 10)) * 12, 6), nG = z.nozzles.find(q => q.port === 'flue gas in'), order = [...sh.equip.keys()];
  const from = sh.lines.find(l => l.to.k === 'eq' && l.to.tag === e.tag && l.to.port === 'flue gas in')?.from, turned = !!from && from.k === 'eq' && order.indexOf(from.tag) < order.indexOf(e.tag);
  return { body: bare(makeWetScrubber({ tag: e.tag, D, H: 8 * D, ...(nG ? { inlet: { OD: pipeDims(nG.NPS, nG.cls).OD } } : {}), ...(turned ? { pumpsAt: -Math.PI / 2 } : {}) })), D, turned, ...(nG ? { duct: { NPS: nG.NPS, cls: nG.cls } } : {}) };
}
function plansOf(sh: UnitSheet, e: Equip, z: EquipSize): Plan[] {
  const d = z.d, tags = (n: number) => Array.from({ length: n }, (_, i) => (n > 1 ? `${e.tag}${SUFFIX[i]}` : e.tag));
  const place = (c: Ctx, part: PartSpec, T: Mat4, tag: string) => { c.out.push({ part, transform: T, tags: [tag, 'equipment'] }); c.equipment.push({ tag, part, transform: T }); };
  const pad = (c: Ctx, x: number, zc: number, lx: number, lz: number, tag: string, h = PAD, name = 'equipment pad') => c.out.push({ part: c.kit.concrete(name, up(lz, 1), h, up(lx, 1)), transform: frameFromAxes([x - up(lx, 1) / 2, h / 2, zc], [0, 1, 0], [1, 0, 0]), tags: [tag, 'pad'] });
  const upright = (x: number, y: number, zc: number, turn = 0) => multiply(translate(x, y, zc), multiply(rotateY(turn), standUp()));
  const feedsPump = sh.lines.some(l => l.from.k === 'eq' && l.from.tag === e.tag && l.to.k === 'eq' && sh.equip.get(l.to.tag)?.kind === 'pump');
  const vertical = (tag: string, ID: number, t: number, TT: number, skirt: number, platforms: boolean, trays = 0): Plan => {
    const R = ID / 2 + t, total = skirt + TT + R, wide = platforms ? 2 * R + 108 : 2 * R;
    return { tag, item: e.tag, kind: e.kind, lane: 'vessel', lx: wide + 24, lz: wide + 24, h: Y_VESSEL + total, gap: platforms ? 96 : 48, build: (c, s) => {
      const part = platforms ? bare(makePlatformedColumn({ tag, ID, t, TT, skirtH: skirt, trays: Math.max(1, trays), platformArc: 180, davitAngle: 0 })) : makeVerticalVessel({ tag, ID, t, TT, skirtH: skirt });   // platforms, ladders and davit on the half away from the rack (SW-CELL-4)
      pad(c, s.x, s.z, 2 * R + 36, 2 * R + 36, tag); place(c, part, upright(s.x, Y_VESSEL, s.z, platforms ? (s.side > 0 ? -Math.PI / 2 : Math.PI / 2) : 0), tag);   // the manways face away from the rack
      Object.assign(s, { shape: 'vv', R, yb: Y_VESSEL + skirt + R / 2, yt: Y_VESSEL + skirt + R / 2 + TT, ...(platforms ? { floors: (part.extra!.floors as number[]).map(f => Y_VESSEL + f) } : {}) });
    } };
  };
  const horizontal = (tag: string, ID: number, t: number, TT: number, under: number, exchanger = false, across = false): Plan => {
    const R = ID / 2 + t, yc = PAD + under + R, pier = under - 18;
    // SW-CELL-3, SW-CELL-4: a hotwell, square to the rack under the set that drains into it: it takes no room in a row
    if (across) return { tag, item: e.tag, kind: e.kind, lane: 'under', lx: 0, lz: 0, h: yc + R, build: (c, s) => {
      pad(c, s.x, s.z, 2 * R + 24, TT + 24, tag);
      for (const f of [0.2, 0.8]) { const w = up(Math.max(6, ID / 3) + 12, 1), dp = up(2 * R * 0.95 + 12, 1); c.out.push({ part: c.kit.concrete('pier', w, pier, dp), transform: frameFromAxes([s.x - dp / 2, PAD + pier / 2, s.z - TT / 2 + f * TT], [0, 1, 0], [1, 0, 0]), tags: [tag, 'pad'] }); }
      place(c, makeHorizontalVessel({ tag, ID, t, TT, centreline: R + 18 }), frameFromAxes([s.x, yc, s.z - TT / 2], [0, 1, 0], [0, 0, 1]), tag);
      Object.assign(s, { shape: 'hv', R, yc, axis: 'z', len: TT });
    } };
    return { tag, item: e.tag, kind: e.kind, lane: 'vessel', lx: TT + R + 24, lz: 2 * R + 24, h: yc + R, build: (c, s) => {
      const part = (exchanger ? makeExchanger : makeHorizontalVessel)({ tag, ID, t, TT, centreline: R + 18 });
      pad(c, s.x, s.z, TT + 24, 2 * R + 24, tag);
      for (const f of [0.2, 0.8]) pad(c, s.x - TT / 2 + f * TT, s.z, Math.max(6, ID / 3) + 12, 2 * R * 0.95 + 12, tag, pier, 'pier'), c.out[c.out.length - 1].transform = frameFromAxes([s.x - TT / 2 + f * TT - (up(Math.max(6, ID / 3) + 12, 1)) / 2, PAD + pier / 2, s.z], [0, 1, 0], [1, 0, 0]);
      place(c, part, frameFromAxes([s.x - TT / 2, yc, s.z], [0, 1, 0], [1, 0, 0]), tag);
      Object.assign(s, { shape: 'hv', R, yc, axis: 'x', len: TT });
    } };
  };
  // the footprint given here is a first figure only: the body is measured once built (SW-CELL-7)
  const boxy = (tag: string, lane: Lane, lx: number, lz: number, h: number, build: (c: Ctx, s: Spot) => void, gap = 48, ground = false, align?: Plan['align']): Plan => ({ tag, item: e.tag, kind: e.kind, lane, lx, lz, h, gap, ground, ...(align ? { align } : {}), build: (c, s) => { build(c, s); Object.assign(s, { shape: s.shape ?? 'box' }); } });
  const volume = (min = 600) => { const s = e.ports.find(p => p.dir === 'in')?.s; return s ? Math.max(8, cfs(s) * (s.ph === 'L' ? min : 20)) : 50; };
  const asVessel = (tag: string, ft3: number, skirt = 60) => { const ID = Math.max(36, up(Math.cbrt((4 * ft3) / (2.5 * Math.PI)) * 12, 6)); return vertical(tag, ID, 0.375, 2.5 * ID, skirt, false); };

  /** SW-CELL-4: the ejector set on its deck. `drainY` is where the first condenser's boot must stand at least; the set's axes are x toward the rack, z along it from the tubesheets. */
  const ejectorDeck = (tag: string, inp: EjectorSetInput, drainY: number, stageCount: number): Plan => {
    const L = ejectorSetLayout(inp), set = bare(makeEjectorSet(inp)), sb = partBoxes(set), bx = (re: RegExp) => { const b = sb.filter(q => re.test(q.name)); if (!b.length) throw new Error(`${tag}: the set has no solid named ${re}`); return union(b); };
    const RISE = 7.5, RUN = 10, bar = GRATING.barDepth, deckTag = `${tag}-deck`;
    // height: the floor where the first boot stands the tail pipe's height above the hotwell, raised to equal flights of 12 ft at most
    const floorMin = drainY - bx(/^condenser 1: condensate boot$/).mn[1] + bar, flights = Math.ceil(floorMin / 144 - 1e-9), risers = Math.ceil(floorMin / RISE / flights - 1e-9), rise = risers * RISE, E = flights * rise, steel = E - bar;
    // plan: beyond the set's widest part, the water pipes, the channel covers and the steam pipe behind the first ejector
    const all = union(sb), legs = bx(/leg$/), xA = -up(-all.mn[0] + 30, 12), xB = up(legs.mx[0] + 24, 12), zA = -up(-bx(/channel cover$/).mn[2] + 48, 12), zB = up(all.mx[2] + 36, 12), W = xB - xA, len = zB - zA, nx = Math.ceil(len / 240 - 1e-9), sx = len / nx;
    // what the beams carry: a condenser with its tubes and full of water, half on each line of saddles; a third of the first ejector on each of its frames
    const full = inp.stages.reduce((a, q) => a + makeShellTubeExchanger({ tag: 'w', ID: q.ID, t: q.t, TT: 240, centreline: q.ID }).weight.value + tubeCount(q.ID) * 20 * TUBE_LB_FT + ((Math.PI / 4) * q.ID ** 2 * 240 * K.WATER_DENSITY_LB_FT3) / 1728, 0) / 1000;
    const q0 = inp.stages[0], Pc = full / 2, Pe = makeEjector('w', q0.suction, { dischargeNPS: q0.discharge, motiveNPS: q0.motive }).weight.value / 3000;
    const zPoint = (kip: number, span: number) => (1.25 * kip * span) / 4 / (0.9 * 36), D = Math.max(6, up(W / 20, 2)), girder = sizeW(D, zReq(DECK_PSF, W / 2, sx) + zPoint(Math.max(Pc, Pe) / 2, sx)), Dx = Math.max(8, up(W / 30, 2));
    // the beams' stations along the set: ends, column lines, saddles, frames, and 2 ft either side of the middle of each row of pipes through the floor; between them at 4 ft at most
    const rows = [[bx(/^cooling water supply leg$/), bx(/^motive steam leg$/)].map(b => (b.mn[2] + b.mx[2]) / 2), [L.drainZ]], bands = rows.map(r => { const m = (Math.min(...r) + Math.max(...r)) / 2; return [m - 24, m + 24]; });
    const fixed = new Map<number, number>(), put = (zz: number, kip = 0) => fixed.set(zz, Math.max(fixed.get(zz) ?? 0, kip));
    put(zA); put(zB); for (let i = 1; i < nx; i++) put(zA + i * sx); for (const zz of L.saddles) put(zz, Pc); for (const zz of L.frames) put(zz, Pe); for (const b of bands) { put(b[0]); put(b[1]); }
    const keys = [...fixed.keys()].sort((a, b) => a - b), stations: { z: number; kip: number }[] = [];
    keys.forEach((zz, i) => {
      if (bands.some(b => zz > b[0] + 1e-6 && zz < b[1] - 1e-6)) throw new Error(`${tag}: a beam at ${zz} would cross a row of pipes through the floor`);
      if (i && zz - keys[i - 1] < 8) throw new Error(`${tag}: beams at ${keys[i - 1]} and ${zz} stand on one another`);
      stations.push({ z: zz, kip: fixed.get(zz)! }); if (i + 1 === keys.length) return;
      const gap = keys[i + 1] - zz, m = bands.some(b => Math.abs(b[0] - zz) < 1e-6 && Math.abs(b[1] - keys[i + 1]) < 1e-6) ? 1 : Math.ceil(gap / 48 - 1e-9);
      for (let j = 1; j < m; j++) stations.push({ z: zz + (gap * j) / m, kip: 0 });
    });
    return boxy(tag, 'behind', len + 24, W + 132, E + L.top, (c, s) => {
      const sd = s.side, k = interiorKit({ pedestal: PAD, padHeight: PAD }, c.out, {}), U = (xl: number, y: number, zl: number): V3 => [sd * zl, y, -sd * xl], far = sd as 1 | -1;   // `far`: the way across, away from the rack
      place(c, set, frameFromAxes([0, steel, 0], [0, 1, 0], [sd, 0, 0]), tag);
      const w = (Dn: number, wt: number, a: V3, b: V3, ...more: string[]) => { k.wBeam(Dn, wt, a, b, deckTag); c.out[c.out.length - 1].tags.push('structure', ...more); };
      // beams across, girders along, columns under the girders
      stations.forEach((st, i) => { const trib = ((stations[i + 1]?.z ?? st.z) - (stations[i - 1]?.z ?? st.z)) / 2, b = sizeW(D, zReq(DECK_PSF, trib, W) + zPoint(st.kip, W)); w(D, b.w, U(xA + girder.dims.tw / 2, steel - b.dims.d / 2, st.z), U(xB - girder.dims.tw / 2, steel - b.dims.d / 2, st.z), st.kip ? 'carrying-beam' : 'floor-beam'); });
      const lines = [xA, xB], cols = Array.from({ length: nx + 1 }, (_, i) => zA + i * sx), colTop = steel - girder.dims.d;
      for (const xl of lines) { for (let i = 0; i < nx; i++) w(D, girder.w, U(xl, steel - girder.dims.d / 2, cols[i]), U(xl, steel - girder.dims.d / 2, cols[i + 1]), 'girder'); for (const zl of cols) { const p = U(xl, 0, zl); k.postColumn(p[0], p[2], colTop, deckTag); } }
      // struts at each landing's height, and crossed rods in the end bay of each line next the channel covers and in both end frames, storey by storey
      const levels = Array.from({ length: flights - 1 }, (_, j) => (j + 1) * rise), d8 = sizeW(8, 2), dX = sizeW(Dx, 2);
      for (const y of levels) { for (const xl of lines) for (let i = 0; i < nx; i++) w(8, d8.w, U(xl, y - d8.dims.d / 2, cols[i]), U(xl, y - d8.dims.d / 2, cols[i + 1]), 'strut'); for (const zl of cols) w(Dx, dX.w, U(xA, y - dX.dims.d / 2, zl), U(xB, y - dX.dims.d / 2, zl), 'strut'); }
      const rod = (a: V3, b: V3, nrm: V3) => { const Lr = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); k.add(k.part(`xrod:${Lr.toFixed(1)}`, () => makeRod('XR', 0.75, Lr)), frameFromAxes(a, nrm, [(b[0] - a[0]) / Lr, (b[1] - a[1]) / Lr, (b[2] - a[2]) / Lr]), deckTag, 'structure', 'bolted-rod'); };   // a rod is no steel to hang a line from: the generator hangs from nothing whose tag says bolt
      const storeys = [PAD + 12, ...levels, colTop].map((y, j, a) => (j + 1 < a.length ? [j ? y + 6 : y, a[j + 1] - 14] : null)).filter((v): v is number[] => !!v);
      for (const [y0, y1] of storeys) {
        for (const xl of lines) for (const [za, zb] of [[cols[0], cols[1]], [cols[1], cols[0]]]) rod(U(xl, y0, za), U(xl, y1, zb), [0, 0, 1]);
        for (const zl of [zA, zB]) for (const [xa, xb] of [[xA, xB], [xB, xA]]) rod(U(xa, y0, zl), U(xb, y1, zl), [1, 0, 0]);
      }
      // grating between the beams, cut round the saddles, the frames' posts and every pipe through the floor; panels 3 ft wide at most
      const plan = (b: { mn: V3; mx: V3 }, m: number) => { const p = U(b.mn[0], 0, b.mn[2]), q = U(b.mx[0], 0, b.mx[2]); return { x0: Math.min(p[0], q[0]) - m, x1: Math.max(p[0], q[0]) + m, z0: Math.min(p[2], q[2]) - m, z1: Math.max(p[2], q[2]) + m }; };
      const rects = sb.filter(b => /saddle base|: posts /.test(b.name) && b.mn[1] < 1).map(b => plan(b, 1));
      // round holes: the set's own pipes, an inch clear; and under each boot the hole its tail pipe's sleeve needs (SW-PEN-1), since a tail pipe falls straight (SW-CELL-3)
      // SW-CELL-4 (amended): each an inch clear of its pipe where the pipe passes between the grating's faces, its bend included
      const rounds = [...sb.filter(b => /leg$/.test(b.name)).map(b => { const cx = (b.mn[0] + b.mx[0]) / 2, cz = (b.mn[2] + b.mx[2]) / 2, half = (b.mx[0] - b.mn[0]) / 2, p = U(cx, 0, cz); return { x: p[0], z: p[2], r: Math.max(half, reachBetween(set, cx, cz, 0, bar, half + 12)) + 1 }; }),
        ...inp.stages.map((q, i) => { const b = bx(new RegExp(`^condenser ${i + 1}: condensate boot$`)), p = U((b.mn[0] + b.mx[0]) / 2, 0, (b.mn[2] + b.mx[2]) / 2); return { x: p[0], z: p[2], r: (partFromKey(`FSLV|${q.drain}|P150`).extra!.cutD as number) / 2 }; })];
      const z0 = Math.min(U(xA, 0, 0)[2], U(xB, 0, 0)[2]), nP = Math.ceil(W / 36 - 1e-9);
      for (let i = 0; i + 1 < stations.length; i++) {
        const xa = Math.min(sd * stations[i].z, sd * stations[i + 1].z), xb = Math.max(sd * stations[i].z, sd * stations[i + 1].z), wd = xb - xa;
        for (let j = 0; j < nP; j++) {
          const s0 = (W * j) / nP, hh = W / nP, zTop = z0 + s0 + hh;
          const cuts: Cut[] = [...rects.filter(r => r.x1 > xa && r.x0 < xb && r.z1 > zTop - hh && r.z0 < zTop).map(r => ({ x0: r.x0 - xa, y0: zTop - r.z1, x1: r.x1 - xa, y1: zTop - r.z0 })), ...rounds.filter(r => r.x + r.r > xa && r.x - r.r < xb && r.z + r.r > zTop - hh && r.z - r.r < zTop).map(r => ({ cx: r.x - xa, cy: zTop - r.z, r: r.r }))];
          const panel = k.part(`deck-grating:${wd.toFixed(2)}:${hh.toFixed(2)}:${JSON.stringify(cuts)}`, () => makeGrating('GR', wd, hh, cuts));
          if (panel.dims.bars.value > 0) k.add(panel, frameFromAxes([xa, E, zTop], [0, 0, -1], [0, 1, 0]), deckTag, 'grating');
        }
      }
      // the stair: equal flights along the deck's far side, a landing at each end; the top landing against the deck beside the condensers
      const run = (risers - 1) * RUN, gap = 18, zf = U(xA, 0, 0)[2], zIn = zf + far * gap, zOut = zIn + far * 84, laneZ = (inner: boolean) => zIn + far * (inner ? 21 : 63), postTop = (el: number) => el - bar - k.platformBeam.dims.d;
      let zN = up(L.saddles[0] + 60, 6); const clearOf = (zz: number) => cols.every(cz => Math.abs(cz - zz) >= 30); while (![zN, zN + 36, zN + 36 + run, zN + 72 + run].every(clearOf)) zN += 6;
      const ux = (u: number) => sd * (zN + u), span = (u0: number, u1: number) => [Math.min(ux(u0), ux(u1)), Math.max(ux(u0), ux(u1))], zLo = Math.min(zIn, zOut), zHi = Math.max(zIn, zOut), stairTag = `${tag}-stair`;
      for (let j = 0; j < flights; j++) {
        const el = E - j * rise, near = j % 2 === 0, [x0, x1] = near ? span(0, 36) : span(36 + run, 72 + run), topL = j === 0;
        // the landing: to the deck's edge at the top, where the guardrail is open; on four posts of its own
        k.platform(x0, topL ? Math.min(zLo, zf) : zLo, x1, topL ? Math.max(zHi, zf) : zHi, el, { span: 'z', tag: stairTag });
        for (const [px, pz] of [[x0, zLo], [x1, zLo], [x1, zHi], [x0, zHi]]) k.postColumn(px, pz, postTop(el), stairTag);
        const cen: [number, number] = [(x0 + x1) / 2, (zLo + zHi) / 2], xEnd = near ? ux(0) : ux(72 + run), xFl = near ? ux(36) : ux(36 + run);
        k.guardrail([[xFl, el, zOut], [xEnd, el, zOut], [xEnd, el, topL ? zf : zIn], ...(topL ? [] : [[xFl, el, zIn] as V3])], cen, stairTag);
        if (topL) { k.guardrail([[xFl, el, zf], [xFl, el, laneZ(true) + far * 21]], cen, stairTag); }
        // the flight down from it: even ones climb toward the near end in the outer lane, odd ones toward the far end in the inner lane
        const from = c.out.length; k.stairFlight([near ? ux(36 + run) : ux(36), el - rise, laneZ(!near)], (near ? -sd : sd) as 1 | -1, risers, stairTag);
        // SW-CELL-4 (amended): a stringer the kit cut as its fellow's mirror, its foot below the floor, cut again level at the floor and plumb at the landing
        for (const pl of c.out.slice(from)) if (pl.tags.includes('stringer') && lowestY(pl) < el - rise - 0.01) {
          const cuts = pl.part.extra?.endCuts as { start: { dx: number; dy: number }; end: { dx: number; dy: number } } | undefined; if (!cuts) continue;
          const again: PartSpec = { ...pl.part, id: `${pl.part.id}:other-hand`, extra: { ...pl.part.extra, endCuts: { start: { dx: cuts.start.dx, dy: -cuts.start.dy }, end: { dx: cuts.end.dx, dy: -cuts.end.dy } } } };
          if (lowestY({ ...pl, part: again }) >= el - rise - 0.01) pl.part = again;
        }
      }
      // guardrail round the deck, open where the top landing meets it
      const [l0, l1] = span(0, 36), y = E, c1 = U(xA, y, zA), c2 = U(xB, y, zA), c3 = U(xB, y, zB), c4 = U(xA, y, zB), centre: [number, number] = [U(0, 0, (zA + zB) / 2)[0], U((xA + xB) / 2, 0, 0)[2]];
      // from the landing's upper end along the far edge, round the deck, and back along the far edge to the landing's lower end
      k.guardrail([[l1, y, zf], ...(c1[0] > c4[0] ? [c1, c2, c3, c4] : [c4, c3, c2, c1]), [l0, y, zf]], centre, deckTag);
      Object.assign(s, { yt: E, holes: rounds });
    }, 96, true, { solid: /^condenser 1: condensate boot$/, axes: 'xz' });   // the boot under the first condenser stands on the set's 6 in module, as every connection of the set does
  };

  switch (e.kind) {
    case 'pump': return tags(z.count).map(tag => {
      const D = Math.max(6, d.impeller), casingD = Math.max(10, up(1.5 * D, 1)), casingW = Math.max(6, up(0.5 * D * d.stages, 1)), motorD = Math.max(8, Math.round(d.motorFrame)), motorL = up(1.8 * motorD, 1);
      const baseW = up(Math.max(casingD, motorD) + 12, 6), baseL = up(14 + casingW + motorL + 6, 12), shaftY = pumpShaftY(casingD, motorD);   // SW-CELL-4 (amended 2026-11-27): the catalogue's shaft height
      // SW-CELL-4: the pad is raised until the shaft stands on the grid, and the pump set along its shaft until the casing's centre plane does
      const padH = up(PUMP_PAD + shaftY) - shaftY, dz = up(casingW / 2) - casingW / 2;
      const nS = z.nozzles.find(q => q.port === 'S'), iS = sh.lines.findIndex(l => l.to.k === 'eq' && l.to.tag === e.tag && l.to.port === 'S'), reach = nS ? suctionReach(iS >= 0 ? sizing().get(sh.no)!.lines[iS].NPS : nS.NPS, nS.NPS, nS.cls) : 0;
      return { tag, item: e.tag, kind: e.kind, lane: 'pump' as Lane, lx: baseW + 12, lz: baseL + 12, h: padH + shaftY + Math.max(casingD, motorD) / 2, gap: 36, reach, build: (c: Ctx, s: Spot) => {
        const zp = s.z + s.side * dz;
        pad(c, s.x, zp, baseW + 12, baseL + 12, tag, padH, 'pump pad'); place(c, makePump({ tag, baseW, baseL, casingD, casingW, motorD, motorL }), frameFromAxes([s.x, padH, zp], [0, 1, 0], [0, 0, s.side]), tag);
        Object.assign(s, { shape: 'pump', R: casingD / 2, yc: padH + shaftY, len: baseL, axis: 'z', zc: zp + s.side * (-baseL / 2 + 6 + casingW / 2), zs: zp + s.side * (-baseL / 2 + 6) });
      } };
    });
    case 'hx': case 'condenser': return tags(d.shells ?? z.count).map((tag, k) => {
      // SW-CELL-4: the shell's underside clear of grade by what its largest connection's valve needs below it, 4 ft at least
      const under = up(Math.max(48, ...z.nozzles.map(q => valveDrop(q.NPS, q.cls, throttled(q)))));
      const ID = d.ID, t = d.tShell ?? 0.5, R = ID / 2 + t, TT = 240, upper = k % 2 === 1, yc = PAD + under + R + (upper ? 2 * R + 30 : 0), outer = TT + ID / 2 + Math.max(1, ID / 12), inner = R / 2;
      return { tag, item: e.tag, kind: e.kind, lane: 'exchanger' as Lane, lx: upper ? 0 : 2 * R + 24, lz: outer + inner, h: yc + R, gap: 54, build: (c: Ctx, s: Spot) => {
        // square to the rack, channel end outward: the tubesheet is at the outer end of the tube length, the rear head toward the rack
        const zc = near(s.z + s.side * ((outer + inner) / 2 - (outer - TT) + ID / 4)), zo = zc - s.side * (ID / 4);   // the channel's centre plane on the grid; the tubesheet a quarter diameter inside it
        if (!upper) pad(c, s.x, zo - s.side * (TT / 2), 2 * R + 24, TT + 24, tag);
        // saddles 18 in deep on concrete piers, as the drums'
        if (!upper) for (const f of [0.2, 0.8]) { const w = up(Math.max(6, ID / 3) + 12, 1), dp = up(2 * R * 0.95 + 12, 1); c.out.push({ part: c.kit.concrete('pier', w, under - 18, dp), transform: frameFromAxes([s.x - dp / 2, PAD + (under - 18) / 2, zo - s.side * f * TT], [0, 1, 0], [1, 0, 0]), tags: [tag, 'pad'] }); }
        place(c, makeExchanger({ tag, ID, t, TT, centreline: upper ? R + 30 : R + 18 }), frameFromAxes([s.x, yc, zo], [0, 1, 0], [0, 0, -s.side]), tag);
        Object.assign(s, { shape: 'hx', R, yc, axis: 'z', len: TT, o: [s.x, yc, zo], zc });
      } };
    });
    case 'fluegascooler': {
      // SW-CELL-4: its ducts of their lines' outside diameters, without flanges, and no drawn steam outlet: the plant's own connections stand there (SW-RPI-2)
      const nIn = z.nozzles.find(q => q.port === 'inlet')!, nOut = z.nozzles.find(q => q.port === 'outlet')!, order = [...sh.equip.keys()];
      const from = sh.lines.find(l => l.to.k === 'eq' && l.to.tag === e.tag && l.to.port === 'inlet')?.from, east = !!from && from.k === 'eq' && order.indexOf(from.tag) > order.indexOf(e.tag);   // SW-CELL-3: its inlet end toward the item its gas comes from
      const drawn = bare(makeFlueGasCooler({ tag: e.tag, D: d.ID, L: 240, t: d.tShell, drumT: d.drumT, ducts: { inletOD: pipeDims(nIn.NPS, nIn.cls).OD, outletOD: pipeDims(nOut.NPS, nOut.cls).OD, plain: ['inlet', 'outlet'] } }));
      const body: PartSpec = { ...drawn, extra: { ...drawn.extra, solids: (drawn.extra!.solids as { name: string }[]).filter(q => !/^steam drum steam outlet: /.test(q.name)) } };
      // SW-CELL-4: on piers, where its gas goes on to a scrubber: its axis at the height of that scrubber's inlet duct, so that the duct between them is straight
      const to = sh.lines.find(l => l.from.k === 'eq' && l.from.tag === e.tag && l.from.port === 'outlet')?.to, sc = to && to.k === 'eq' ? sh.equip.get(to.tag) : undefined;
      const axisOver = (boxes: { name: string; mn: V3; mx: V3 }[], re: RegExp, k: number) => { const b = boxes.filter(q => re.test(q.name)); return (Math.min(...b.map(q => q.mn[k])) + Math.max(...b.map(q => q.mx[k]))) / 2 - Math.min(...boxes.filter(q => !HELD.test(q.name)).map(q => q.mn[k])); };
      const by = sc && sc.kind === 'scrubber' ? up(PAD + axisOver(partBoxes(scrubberBody(sh, sc, sizing().get(sh.no)!.equip.get(sc.tag)!).body), /^gas inlet duct$/, 2) - 1e-6) - up(PAD + axisOver(partBoxes(body), /^shell$/, 1) - 1e-6) : 0;
      // SW-CELL-3: clear of the item after it by what the duct between them needs: toward the regenerator, 2 ft, the duct's elbow, the length of the valve the generator stands at this inlet (not built: SW-RPI-14) and the connection's own length
      const toRegen = up(24 + elbowRadius(pipeDims(nIn.NPS, nIn.cls).OD) + stackLength(nIn.NPS, nIn.cls) + nozzleStandout(nIn.NPS, nIn.cls), 12);
      return [{ ...boxy(e.tag, 'vessel', 240 + d.ID, d.ID + 96, d.ID + 150, (c, s) => { place(c, body, frameFromAxes([s.x + (east ? 120 : -120), PAD + d.ID / 2 + 36, s.z], [0, 1, 0], [east ? -1 : 1, 0, 0]), e.tag); }, east ? toRegen : ductRoom(nOut.NPS, nOut.cls), false, { solid: /^shell$/, axes: 'xyz', onLine: true }), ...(by > 0 ? { raise: { by, under: /^saddle base/ } } : {}) }];
    }
    // SW-CELL-4: over the rack, on a deck 9 ft above its top tier, the tubes across the rack; the catalogue cooler on 2 ft legs, its headers' tops 134 in above the deck
    // (amended 2026-11-27: the legs COOLER_LEG long, standing on the girders' drawn tops, the plenum and headers where they were)
    case 'aircooler': return tags(d.bays).map(tag => boxy(tag, 'air', 168 + 12, 384 + 24, DECK + 134, (c, s) => { place(c, bare(makeAirCooler({ tag, W: 168, L: 384, fans: 2, legH: COOLER_LEG })), multiply(translate(s.x, DECK + 24 - COOLER_LEG, s.z), multiply(rotateY(Math.PI / 2), standUp())), tag); Object.assign(s, { yt: DECK + 134 }); }, 0));
    case 'drum': {
      if (e.p.vertical) return [vertical(e.tag, d.D, d.t, d.L, 60, false)];
      return [horizontal(e.tag, d.D, d.t, d.L, drumUnder(sh, e, z), false, isHotwell(sh, e.tag))];
    }
    case 'desalter': return [horizontal(e.tag, d.D, d.t, d.L, up(Math.max(60, ...z.nozzles.filter(q => q.port !== 'oil').map(q => valveDrop(q.NPS, q.cls)))))];   // SW-CELL-4: the crude enters and the brine leaves underneath, each through its valve; the oil leaves on top
    case 'deaerator': return [boxy(e.tag, 'vessel', d.L + d.D, d.D + 24, 180 + 2 * d.D, (c, s) => { pad(c, s.x, s.z, d.L + 24, d.D + 24, e.tag); for (const f of [0.2, 0.8]) pad(c, s.x - d.L / 2 + f * d.L, s.z, 48, d.D, e.tag, 162, 'pier'), c.out[c.out.length - 1].transform = frameFromAxes([s.x - d.L / 2 + f * d.L - 24, PAD + 81, s.z], [0, 1, 0], [1, 0, 0]);
      place(c, bare(makeDeaerator({ tag: e.tag, ID: d.D, L: d.L, centreline: d.D / 2 + 18, t: d.t })), frameFromAxes([s.x - d.L / 2, PAD + 162 + 18 + d.D / 2, s.z], [0, 1, 0], [1, 0, 0]), e.tag); Object.assign(s, { shape: 'hv', R: d.D / 2 + 0.5, yc: PAD + 180 + d.D / 2, axis: 'x', len: d.L }); })];
    case 'column': {
      if (d.Dtop) return [boxy(e.tag, 'vessel', d.D + 132, d.D + 132, Y_VESSEL + d.skirt + d.TT + d.D / 2, (c, s) => { pad(c, s.x, s.z, d.D + 48, d.D + 48, e.tag); place(c, bare(makeSwagedTower({ tag: e.tag, sections: [[d.Dbot, d.hBot], [d.D, d.hMid], [d.Dtop, d.hTop]], t: d.t, skirtH: d.skirt })), upright(s.x, Y_VESSEL, s.z, s.side > 0 ? -Math.PI / 2 : Math.PI / 2), e.tag); Object.assign(s, { shape: 'vv', R: d.D / 2 + d.t, yb: Y_VESSEL + d.skirt, yt: Y_VESSEL + d.skirt + d.TT }); }, 96)];
      return [vertical(e.tag, d.D, d.t, d.TT, d.skirt, d.skirt + d.TT > 360, d.trays)];
    }
    case 'reactor': return d.TT ? [vertical(e.tag, d.D, d.t, d.TT, 96, d.TT + 96 > 360)] : [horizontal(e.tag, d.D, d.t, d.L, up(Math.max(48, ...z.nozzles.filter(q => q.dir === 'out' && !/gas out|vapour|vent|steam out/.test(q.port)).map(q => valveDrop(q.NPS, q.cls)))))];   // a horizontal converter: its outlet leaves underneath through its valve
    case 'vessel': case 'filter': return tags(z.count).map(tag => vertical(tag, d.D, d.t, d.L, 60, false));
    case 'heater': return d.D
      ? [boxy(e.tag, 'heater', d.D + 48, d.D + 48, 96 + d.H * 1.9, (c, s) => { pad(c, s.x, s.z, d.D + 36, d.D + 36, e.tag); place(c, makeFiredHeater({ tag: e.tag, D: d.D, H: d.H, stackH: up(0.6 * d.H, 12) }), upright(s.x, PAD, s.z), e.tag); Object.assign(s, { shape: 'vv', R: d.D / 2, yb: PAD + 96, yt: PAD + 96 + d.H }); }, 240)]
      : [boxy(e.tag, 'heater', d.W + 48, d.L + 48, 84 + 2.5 * d.H, (c, s) => { pad(c, s.x, s.z, d.W + 36, d.L + 36, e.tag); place(c, makeCabinHeater({ tag: e.tag, L: d.L, W: d.W, H: d.H }), multiply(translate(s.x + d.W / 2, PAD, s.z + d.L / 2), multiply(rotateY(Math.PI / 2), standUp())), e.tag); Object.assign(s, { shape: 'cabin', yb: PAD + 84, yt: PAD + 84 + d.H }); }, 240)];
    case 'compressor': case 'blower': return tags(z.count).map(tag => {
      const casingD = Math.max(10, up(14 * Math.cbrt(d.gasHp / 100), 1)), motorD = Math.max(10, Math.round(d.motorFrame ?? d.wheel ?? 0.8 * casingD));
      if (e.kind === 'blower') { const wheelD = Math.max(12, up(casingD, 1)), baseL = 0.5 * wheelD + 24 + 2 * motorD; return boxy(tag, 'exchanger', 1.4 * wheelD + 24, baseL + 12, 1.6 * wheelD + 12, (c, s) => { place(c, bare(makeBlower({ tag, wheelD, motorD })), frameFromAxes([s.x, PUMP_PAD, s.z - s.side * (baseL / 2 - 6)], [0, 1, 0], [0, 0, s.side]), tag); }, 48, false, { solid: /^outlet flange$/, axes: 'xz' }); }
      // SW-CELL-4: a steam turbine drives it where the process says so (SW-EQC-66): its wheel sets the shaft's height and the skid's length
      const wheel = typeof d.wheel === 'number' ? Math.round(d.wheel) : 0;
      const skidW = up(1.5 * Math.max(casingD, wheel ? 1.5 * wheel : motorD) + 24, 6), skidL = wheel ? up(2 * casingD + 2.55 * wheel + 20, 6) : up(1.2 * casingD + 2.2 * motorD + 48, 6);
      // as a pump: the shaft and the casing's centre plane on the grid (the casing is 0.9 diameters long, 0.15 from the skid's end, SW-EQC-12)
      const cy = wheel ? 1 + 0.9 * wheel + 4 : 1 + MOTOR_SHAFT(motorD), padH = up(12 + cy) - cy, mid = -skidL / 2 + 6 + 0.6 * casingD, dz = up(mid) - mid;
      return boxy(tag, 'exchanger', skidW + 24, skidL + 24, 2 * Math.max(casingD, motorD) + 24, (c, s) => {
        const zp = s.z + s.side * dz;
        pad(c, s.x, zp, skidW + 24, skidL + 24, tag, padH, 'machine pad'); place(c, bare(wheel ? makeTurbineCompressor({ tag, skidW, skidL, casingD, wheelD: wheel }) : makeCompressorPackage({ tag, skidW, skidL, casingD, motorD })), frameFromAxes([s.x, padH, zp], [0, 1, 0], [0, 0, s.side]), tag);
        Object.assign(s, { shape: 'machine', R: casingD / 2, yc: padH + cy, zc: zp + s.side * mid, zs: zp + s.side * (-skidL / 2 + 6), len: 0.9 * casingD });
      });
    });
    case 'tank': {
      if (e.p.vertical) return [vertical(e.tag, d.D, d.t, d.H, 36, false)];
      const D = d.Dft * 12, H = d.Hft * 12;
      return [boxy(e.tag, 'vessel', D + 120, D + 120, H + D / 16, (c, s) => { pad(c, s.x, s.z, D + 24, D + 24, e.tag); place(c, bare(makeConeRoofTank({ tag: e.tag, D, H })), upright(s.x, PAD, s.z), e.tag); Object.assign(s, { shape: 'tank', R: D / 2, yb: PAD, yt: PAD + H }); }, 120)];
    }
    case 'cracker': {
      const flue = e.ports.find(p => p.name === 'flue gas')!.s, regenD = up(Math.sqrt((4 * cfs({ ...flue, P: 28 })) / (Math.PI * 3)) * 12, 6), regenTT = 1.5 * regenD, reactorD = up(0.6 * regenD, 6), reactorTT = 1.2 * regenTT;
      // SW-CELL-4: the flue gas outlet and the air inlet line of their lines' outside diameters, the vessels and the riser on the grid; set so that the regenerator's axis and the air line's are on it (SW-CELL-7)
      const nF = z.nozzles.find(q => q.port === 'flue gas')!, nA = z.nozzles.find(q => q.port === 'regenerator air')!, order = [...sh.equip.keys()];
      // SW-CELL-3: its reactor toward the fractionator it feeds: where that stands before it in the row the item is turned end for end, and built with its riser on the other side so that the riser still faces the rack
      const to = sh.lines.find(l => l.from.k === 'eq' && l.from.tag === e.tag && l.from.port === 'reactor vapour')?.to, turned = !!to && to.k === 'eq' && order.indexOf(to.tag) < order.indexOf(e.tag);
      const body = bare(makeCatCracker({ tag: e.tag, regenD, regenTT, reactorD, reactorTT, plant: { flueOD: pipeDims(nF.NPS, nF.cls).OD, airOD: pipeDims(nA.NPS, nA.cls).OD, grid: 6, airAt: turned ? Math.PI / 2 : -Math.PI / 2, airZ: RACK.tiers[0] - 36 - PAD - 6, ...(turned ? { riserSide: 1 as const } : {}) } }));   // the air inlet toward the rack, where the blower stands, and 3 ft under the rack's lowest tier, the height its line crosses under the rack at (stated less the pad and the 6 in by which the item is then raised to stand on the grid, SW-CELL-7)
      return [boxy(e.tag, 'vessel', 3.2 * regenD, 2 * regenD, 6 * regenD, (c, s) => { place(c, body, upright(s.x + (turned ? 0.6 : -0.6) * regenD, PAD, s.z, turned ? Math.PI : 0), e.tag); }, turned ? up(24 + elbowRadius(pipeDims(nF.NPS, nF.cls).OD) + stackLength(nF.NPS, nF.cls) + nozzleStandout(nF.NPS, nF.cls), 12) : 120, false, { point: [0, 0, body.extra!.zAir as number], axes: 'xyz', onLine: true })];
    }
    case 'scrubber': {
      const { body, D, turned, duct } = scrubberBody(sh, e, z);
      return [boxy(e.tag, 'vessel', D + 96, D + 96, 8 * D, (c, s) => { place(c, body, upright(s.x, PAD, s.z, turned ? Math.PI : 0), e.tag); }, duct && !turned ? ductRoom(duct.NPS, duct.cls) : 96, false, duct ? { point: [0, 0, body.extra!.zInlet as number], axes: 'xyz', onLine: true } : undefined)];
    }
    case 'furnace': return [boxy(e.tag, 'vessel', 420, 144, 144, (c, s) => { const og = z.nozzles.find(q => q.port === 'process gas'); place(c, bare(makeSulfurFurnace({ tag: e.tag, D: d.D, furnaceL: d.furnaceL, boilerL: d.boilerL, boilerT: d.boilerT, drumT: d.drumT, ...(og ? { outletOD: pipeDims(og.NPS, og.cls).OD } : {}) })), frameFromAxes([s.x - 190, PAD + 66, s.z], [0, 1, 0], [1, 0, 0]), e.tag); }, 48, false, { solid: /^furnace chamber$/, axes: 'y' })];
    case 'incinerator': return [boxy(e.tag, 'heater', 420, 144, 1300, (c, s) => { place(c, bare(makeIncinerator({ tag: e.tag, D: 72, L: 240, stackH: 1200 })), upright(s.x - 190, PAD, s.z), e.tag); }, 240, false, { solid: /^chamber shell$/, axes: 'y' })];
    case 'psa': return tags(z.count).map(tag => vertical(tag, d.D, d.t, d.TT, 60, false));   // SW-CELL-4: each adsorber a vessel of its own, piped to the others by the generator
    case 'boiler': return [boxy(e.tag, 'vessel', 420, 420, 1200, (c, s) => { place(c, bare(makeWaterTubeBoiler({ tag: e.tag, steamID: d.steamID, L: d.L, centres: d.centres, stackD: 72, stackH: 1200, drumT: d.drumT })), upright(s.x - 60, PAD, s.z + 150), e.tag); }, 180)];
    case 'coolingtower': return [boxy(e.tag, 'vessel', d.cells * d.cellFt * 12 + 48, d.cellFt * 12 + 96, 560, (c, s) => place(c, bare(makeCoolingTower({ tag: e.tag, cells: d.cells, cellL: d.cellFt * 12, cellW: d.cellFt * 12, H: 480, riserNPS: 24 })), upright(s.x - (d.cells * d.cellFt * 12) / 2, 0, s.z + d.cellFt * 6), e.tag), 240, true)];
    case 'hopper': return [boxy(e.tag, 'vessel', 192, 192, 480, (c, s) => { place(c, bare(makeSilo({ tag: e.tag, D: 144, H: 300, outletNPS: 8, outletH: 96 })), upright(s.x, Y_VESSEL, s.z), e.tag); })];
    case 'ejector': {   // SW-CELL-4: the set of SW-EQC-68 at its sizes, on a deck of its own a tail pipe's height above its hotwell
      const nz = (port: string) => z.nozzles.find(q => q.port === port)!, n = d.stages, first = sh.lines.find(l => l.from.k === 'eq' && l.from.tag === e.tag && l.from.port === 'condensate 1')?.to;
      if (!first || first.k !== 'eq') throw new Error(`${e.tag}: an ejector set whose first tail pipe runs to no hotwell`);
      const hot = sh.equip.get(first.tag)!, zh = sizing().get(sh.no)!.equip.get(first.tag)!;
      return [ejectorDeck(e.tag, ejectorSetInput(e.tag, z), PAD + drumUnder(sh, hot, zh) + zh.d.D / 2 + zh.d.t + d.c1LegIn, n)];
    }
    case 'pit': return [boxy(e.tag, 'vessel', 420, 204, 60, (c, s) => place(c, makeSulfurPit(e.tag, { L: 384, W: 180, D: 96, noDischarge: true }), multiply(translate(s.x - 192, 0, s.z + 90), standUp()), e.tag), 48, true, { point: [10, 12, 0], axes: 'xz' })];   // SW-CELL-4: one end of its steam coil on the grid, and so the other
    case 'basin': return [boxy(e.tag, 'vessel', 1260, 600, 36, (c, s) => place(c, makeSeparatorBasin(e.tag, { channels: 2, w: 240, d: 96, L: 1200 }), multiply(translate(s.x - 600, 0, s.z + 252), standUp()), e.tag), 120, true)];
    case 'package': return [asVessel(e.tag, volume())];
    case 'loading': {   // a road tanker loading station in a process unit (SW-EQC-67), its vehicle bay away from the rack; the marine arms are built with the offsites
      const q = z.nozzles.find(n => n.port === 'inlet'); if (!q || sh.no > 19) return [];
      return [boxy(e.tag, 'vessel', 300, 120, 220, (c, s) => place(c, makeLoadingStation({ tag: e.tag, NPS: q.NPS }), upright(s.x, PAD, s.z, s.side > 0 ? -Math.PI / 2 : Math.PI / 2), e.tag), 96, false, { solid: /^loading arm riser$/, axes: 'x' })];
    }
    default: return [];                                                                                   // the flare: built with the offsites
  }
}

/** SW-CELL-2: half the width of a unit's rack: 12 ft, or 15 or 18 where the unit's lines would load three tiers of a narrower rack beyond 60 % of their lanes */
export function rackHalf(unit: number, longest = 4200, part: 'all' | 'tower' | 'rest' = 'all'): number {
  const c = buildCell(unit, longest, part, RACK.half), sh = processModel().sheet(unit), Z = sizing().get(unit)!, xBay = RACK.start - RACK.bent + 114;
  const xOf = (en: UnitSheet['lines'][number]['from']) => (en.k === 'eq' ? c.spots.find(q => q.item === en.tag)?.x : en.k === 'bl' ? xBay : undefined);
  const runs = sh.lines.map((l, i) => ({ xa: xOf(l.from), xb: xOf(l.to), z: Z.lines[i] })).filter(r => r.xa !== undefined && r.xb !== undefined && Math.abs(r.xa - r.xb) > 240);   // every line of the flowsheet is a process line (SW-RPI-3)
  let peak = 0; for (let x = RACK.start; x <= c.rack.x1; x += 24) peak = Math.max(peak, runs.filter(r => Math.min(r.xa!, r.xb!) - 36 <= x && Math.max(r.xa!, r.xb!) + 36 >= x).reduce((a, r) => a + pipeDims(r.z.NPS, r.z.cls).OD + 3, 0));
  // the unit's own headers on the top tier, each as wide as the lane it is given (SW-RPI-5): its pipe, or its largest connection's flange and 6 in
  const here = (tag: string) => part === 'all' || (part === 'tower') === TOWER_TAGS.includes(tag);
  const heads = unitHeaders(unit, here).reduce((a, h) => a + Math.max(pipeDims(h.NPS, h.cls).OD, ...h.utils.map(i => { const q = connection(Z.utils[i]); return designFlange(q.NPS, q.cls).OD + 6; })) + 3, 0);
  return [RACK.half, RACK.half + 36, RACK.half + 72].find(h => (peak + Math.max(60, heads)) / RACK.tiers.length <= 0.6 * (2 * h - 48)) ?? RACK.half + 72;
}
/** the cooling tower and its pumps stand on their own plot at the downwind end of the process bench (SW-SITE-4) */
export const TOWER_TAGS = ['X-1903', 'P-1905', 'P-1906', 'F-1902'];
const cache = new Map<string, CellModel>();
/** SW-CELL-3: the unit, arranged and built. `longest` is the room along the rack, in; `part` picks the cooling tower's group out of unit 19, or leaves it out. */
export function buildCell(unit: number, longest = 4200, part: 'all' | 'tower' | 'rest' = 'all', half?: number): CellModel {
  if (half === undefined) half = rackHalf(unit, longest, part);
  const key = `${unit}:${longest}:${part}:${half}`, hit = cache.get(key); if (hit) return hit;
  const M = processModel(), sh = M.sheet(unit), Z = sizing().get(unit)!, out: Placed[] = [], derived: Record<string, Dim> = {}, equipment: InteriorModel['equipment'] = [];
  const kit = interiorKit({ pedestal: PAD, padHeight: PAD }, out, derived), plans: Plan[] = [];
  for (const e of sh.equip.values()) if (part === 'all' || (part === 'tower') === TOWER_TAGS.includes(e.tag)) plans.push(...plansOf(sh, e, Z.equip.get(e.tag)!));
  // SW-CELL-3: a reboiler stands in the vessels' row, next after the column it boils for, 3 ft clear of that column's platforms
  for (const l of sh.lines) {
    if (l.from.k !== 'eq' || l.to.k !== 'eq' || l.to.port !== 'reboiler return' || sh.equip.get(l.from.tag)?.kind !== 'hx') continue;
    const mine = plans.filter(p => p.item === (l.from as { tag: string }).tag), col = plans.findIndex(p => p.item === (l.to as { tag: string }).tag && p.lane === 'vessel'); if (!mine.length || col < 0) continue;
    const column = plans[col]; for (const p of mine) { p.lane = 'vessel'; plans.splice(plans.indexOf(p), 1); }
    plans.splice(plans.indexOf(column) + 1, 0, ...mine); column.gap = 12; column.keep = mine.reduce((w, p) => w + p.lx, 12);                                   // the footprints of the two keep 12 in of their own beyond the platforms and the shell
  }
  // SW-CELL-3: an item the flowsheet states to stand after another stands next after it, in its row
  for (const e of sh.equip.values()) {
    const host = e.p.after; if (typeof host !== 'string') continue;
    const mine = plans.filter(p => p.item === e.tag && p.lane !== 'pump'), theirs = plans.filter(p => p.item === host && p.lane !== 'pump'); if (!mine.length) continue;
    if (!theirs.length) throw new Error(`${e.tag}: stated to stand after ${host}, which has no place in a row`);
    for (const p of mine) { plans.splice(plans.indexOf(p), 1); p.lane = theirs[0].lane; }
    plans.splice(plans.indexOf(theirs[theirs.length - 1]) + 1, 0, ...mine);
  }
  // SW-CELL-3: a vessel the flowsheet states to stand across the rack; a reboiler goes with its column
  for (const e of sh.equip.values()) if (e.p.across !== undefined) for (const p of plans) if (p.item === e.tag && p.lane === 'vessel') p.across = true;
  for (const l of sh.lines) { if (l.from.k !== 'eq' || l.to.k !== 'eq' || l.to.port !== 'reboiler return') continue; const tag = l.to.tag, own = l.from.tag; if (plans.some(p => p.item === tag && p.lane === 'vessel' && p.across)) for (const p of plans) if (p.item === own && p.lane === 'vessel') p.across = true; }
  const acrossItems = new Set(plans.filter(p => p.across).map(p => p.item));
  if (plans.some(p => p.kind === 'condenser' && p.lane === 'exchanger')) for (const p of plans) if (p.kind === 'pit') p.lane = 'pit';
  // SW-CELL-3: a unit's storage tanks stand after its other vessels, so that the row next the rack is the process equipment's
  { const tanks = plans.filter(p => p.kind === 'tank' && p.lane === 'vessel' && p.lx >= 240); for (const p of tanks) plans.splice(plans.indexOf(p), 1); plans.push(...tanks); }
  // SW-CELL-3: pumps stand on the side of the vessels they draw from where they draw from one, otherwise on the exchanger side
  const laneOf = new Map<string, Lane>(plans.map(p => [p.item, p.lane]));
  for (const p of plans) if (p.lane === 'pump') { const src = sh.lines.find(l => l.to.k === 'eq' && l.to.tag === p.item && l.to.port === 'S')?.from; p.side = src && src.k === 'eq' && ['vessel', 'under'].includes(laneOf.get(src.tag) ?? '') ? (acrossItems.has(src.tag) ? 1 : -1) : 1; }   // a vessel across the rack has its pumps there with it
  // SW-CELL-7: every body is built once, at the origin, and measured there: its footprint is what its solids and pads cover, about its
  // datum. A body with no datum the connections are set from (a package, a furnace, a boiler) stands by its extent instead: level on a pad
  // laid under what it stands on, and centred on its spot. Each is then moved to its spot whole.
  const sideOf = (p: Plan): 1 | -1 => (p.lane === 'pump' ? p.side! : p.across ? 1 : ['vessel', 'air', 'behind', 'under'].includes(p.lane) ? -1 : 1);
  const built = new Map<Plan, { out: Placed[]; equipment: InteriorModel['equipment']; facts: Spot }>();
  for (const p of plans) {
    const c: Ctx = { out: [], equipment: [], kit }, s0: Spot = { tag: p.tag, item: p.item, kind: p.kind, lane: p.lane, side: sideOf(p), x: 0, z: 0, lx: p.lx, lz: p.lz, h: p.h, shape: 'box' };
    p.build(c, s0); built.set(p, { out: c.out, equipment: c.equipment, facts: s0 });
    if (!c.equipment.length) continue;
    if (p.lane === 'air') { p.h = Math.max(p.h, union(placedBoxes(c.out)).mx[1]); continue; }   // the bays stand side by side on their deck at the pitch given (SW-CELL-4)
    const move = (dx: number, dy: number, dz: number) => { const T = translate(dx, dy, dz); for (const q of [...c.out, ...c.equipment]) q.transform = multiply(T, q.transform); for (const hh of s0.holes ?? []) { hh.x += dx; hh.z += dz; } };
    if (s0.shape === 'box') {
      const ref = (a: NonNullable<Plan['align']>) => { if (a.point) { const T = c.equipment[0].transform, q = a.point; return [0, 1, 2].map(k => T[k] * q[0] + T[4 + k] * q[1] + T[8 + k] * q[2] + T[12 + k]); } const b = union(placedBoxes(c.equipment).filter(q => a.solid!.test(q.name))); return [(b.mn[0] + b.mx[0]) / 2, (b.mn[1] + b.mx[1]) / 2, (b.mn[2] + b.mx[2]) / 2]; };
      if (!p.ground) {
        const low = Math.min(...placedBoxes(c.equipment).filter(b => !HELD.test(b.name)).map(b => b.mn[1]));
        move(0, PAD - low, 0);
        // a thicker pad where the body's reference solid must stand on the grid in height
        const lift = p.align?.axes.includes('y') ? (() => { const cy = ref(p.align!)[1]; return up(cy - 1e-6) - cy; })() : 0; if (lift) move(0, lift, 0);
        const foot = union(placedBoxes(c.equipment).filter(b => !HELD.test(b.name) && b.mn[1] <= PAD + lift + 3)), lx = up(foot.mx[0] - foot.mn[0] + 12, 1), lz = up(foot.mx[2] - foot.mn[2] + 12, 1);
        c.out.push({ part: kit.concrete('equipment pad', lz, PAD + lift, lx), transform: frameFromAxes([(foot.mn[0] + foot.mx[0]) / 2 - lx / 2, (PAD + lift) / 2, (foot.mn[2] + foot.mx[2]) / 2], [0, 1, 0], [1, 0, 0]), tags: [p.tag, 'pad'] });
        if (p.raise && p.raise.by > 0) {   // on piers: the body lifted, and a pier 6 in larger all round under each solid it stands on
          const bases = placedBoxes(c.equipment).filter(b => p.raise!.under.test(b.name)), T = translate(0, p.raise.by, 0); if (!bases.length) throw new Error(`${p.tag}: nothing named ${p.raise.under} to stand on piers`);
          for (const q of c.equipment) q.transform = multiply(T, q.transform); for (const q of c.out) if (q.tags.includes('equipment')) q.transform = multiply(T, q.transform);
          for (const b of bases) { const px = up(b.mx[0] - b.mn[0] + 12, 1), pz = up(b.mx[2] - b.mn[2] + 12, 1); c.out.push({ part: kit.concrete('pier', pz, p.raise.by, px), transform: frameFromAxes([(b.mn[0] + b.mx[0]) / 2 - px / 2, PAD + lift + p.raise.by / 2, (b.mn[2] + b.mx[2]) / 2], [0, 1, 0], [1, 0, 0]), tags: [p.tag, 'pier'] }); }
        }
      }
      // SW-CELL-4: a pit stands in the ground, the top of its roof slab 1 ft above grade
      if (p.ground) { const roof = placedBoxes(c.equipment).filter(b => /^roof slab/.test(b.name)); if (roof.length) move(0, 12 - Math.max(...roof.map(b => b.mx[1])), 0); }
      const all = union(placedBoxes(c.out)); move(-near((all.mn[0] + all.mx[0]) / 2), 0, -near((all.mn[2] + all.mx[2]) / 2));
      if (p.align) { const c0 = ref(p.align); move(p.align.axes.includes('x') ? near(c0[0]) - c0[0] : 0, 0, p.align.axes.includes('z') ? (p.align.onLine ? -c0[2] : near(c0[2]) - c0[2]) : 0); }
    }
    // the measured extent about the datum; a figure given with the plan stands where the body keeps within 6 in of it (one step of the grid it is set on)
    const ext = union(placedBoxes(c.out)), fit = (given: number, measured: number) => (s0.shape === 'box' || measured > given + 12 ? up(measured, 6) : given);
    if (p.lx > 0) p.lx = fit(p.lx, 2 * Math.max(-ext.mn[0], ext.mx[0]));                                  // a second shell stacked on the first keeps no width of its own
    p.lz = fit(p.lz, 2 * Math.max(-ext.mn[2], ext.mx[2])); p.h = Math.max(p.h, ext.mx[1]);
  }
  /** a built body moved to its spot, with the facts of its shape */
  const settle = (p: Plan, s: Spot) => {
    const b = built.get(p)!, T = translate(s.x, 0, s.z), f = b.facts;
    for (const q of b.out) out.push({ ...q, transform: multiply(T, q.transform) });
    for (const q of b.equipment) equipment.push({ ...q, transform: multiply(T, q.transform) });
    Object.assign(s, { shape: f.shape, parts: b.equipment.map(q => q.tag), ...(f.holes ? { holes: f.holes.map(hh => ({ x: hh.x + s.x, z: hh.z + s.z, r: hh.r })) } : {}), ...(f.R !== undefined ? { R: f.R } : {}), ...(f.yb !== undefined ? { yb: f.yb } : {}), ...(f.yt !== undefined ? { yt: f.yt } : {}), ...(f.yc !== undefined ? { yc: f.yc } : {}), ...(f.axis ? { axis: f.axis } : {}), ...(f.len !== undefined ? { len: f.len } : {}), ...(f.floors ? { floors: f.floors } : {}),
      ...(f.o ? { o: [f.o[0] + s.x, f.o[1], f.o[2] + s.z] } : {}), ...(f.zc !== undefined ? { zc: f.zc + s.z } : {}), ...(f.zs !== undefined ? { zs: f.zs + s.z } : {}) });
  };
  const hw = half, spots: Spot[] = [], x0 = RACK.start + 60, heat = plans.filter(p => p.lane === 'heater');
  const room = longest - (heat.length ? 600 + Math.max(...heat.map(p => p.lx)) + 48 : 48) - 264;          // the heaters' ground at the outer end, and the rack's last bay
  /** rows of bodies along the rack, a new row further out when one is full; returns the outer edge and how far the rows run */
  let far = x0 + RACK.bent;
  const rows = (list: Plan[], side: 1 | -1, zIn: number, way: number, centred: boolean, from = x0): number => {
    const lines: Plan[][] = [[]]; let x = from;
    const begins = (p: Plan) => sh.equip.get(p.item)?.p.row === 'new' && list.find(q => q.item === p.item) === p;   // SW-CELL-3: an item the flowsheet states to begin a row
    for (const p of list) { if (p.lx > 0 && (x + p.lx + (p.keep ?? 0) > room || begins(p)) && lines[lines.length - 1].length) { lines.push([]); x = x0; } lines[lines.length - 1].push(p); if (p.lx > 0) x += p.lx + (p.gap ?? 48); }
    let z = zIn;
    for (const line of lines) {
      if (!line.length) continue;
      const depth = Math.max(...line.map(p => p.lz)); let xx = line === lines[0] ? from : x0;
      for (const p of line) {
        if (p.lx > 0) xx = up(xx + p.lx / 2);
        const s: Spot = { tag: p.tag, item: p.item, kind: p.kind, lane: p.lane, side, x: p.lx > 0 ? xx : spots[spots.length - 1].x, z: near(side * (z + (centred ? depth : p.lz) / 2)), lx: p.lx, lz: p.lz, h: p.h, shape: 'box' };
        spots.push(s); settle(p, s); if (p.lx > 0) { xx += p.lx / 2 + (p.gap ?? 48); far = Math.max(far, xx); }
      }
      z += depth + way;
    }
    return z - way;
  };
  const pumps = (side: 1 | -1) => plans.filter(p => p.lane === 'pump' && p.side === side);
  // SW-CELL-3: the pumps' row stands 5 ft from the columns' line, or as far as the largest suction valve set on that side needs to end outside it
  const pumpOff = (side: 1 | -1) => up(Math.max(60, ...pumps(side).map(p => p.reach ?? 0)));
  // exchanger side (+z): pumps, access way, exchangers and machines, then the air coolers
  // (the pumps that draw from a vessel standing across the rack are placed opposite it, below; their row is as deep as the deepest of all the pumps on this side)
  const sourceOf = (p: Plan) => sh.lines.find(l => l.to.k === 'eq' && l.to.tag === p.item && l.to.port === 'S')?.from, drawsAcross = (p: Plan) => { const src = sourceOf(p); return !!src && src.k === 'eq' && acrossItems.has(src.tag); };
  const theirs = pumps(1).filter(drawsAcross);
  const zP = Math.max(rows(pumps(1).filter(p => !drawsAcross(p)), 1, hw + pumpOff(1), 48, false), theirs.length ? hw + pumpOff(1) + Math.max(...theirs.map(p => p.lz)) : -Infinity); rows(plans.filter(p => p.lane === 'exchanger'), 1, zP + 96, 96, false);
  // SW-CELL-3: a sulfur pit beyond the outer ends of the condensers that drain into it, across an 8 ft way, its middle at theirs along the rack: each rundown is then a few feet of pipe laid direct
  for (const p of plans.filter(q => q.lane === 'pit')) {
    const cond = spots.filter(q => q.kind === 'condenser' && q.lane === 'exchanger'), x = near(cond.reduce((a, q) => a + q.x, 0) / cond.length);
    const row = spots.filter(q => q.side === 1 && q.lane !== 'pump' && q.lx > 0 && Math.abs(q.x - x) < (q.lx + p.lx) / 2 + 48), sp: Spot = { tag: p.tag, item: p.item, kind: p.kind, lane: p.lane, side: 1, x, z: near(Math.max(...row.map(q => q.z + q.lz / 2)) + 96 + p.lz / 2), lx: p.lx, lz: p.lz, h: p.h, shape: 'box' };
    spots.push(sp); settle(p, sp); far = Math.max(far, x + p.lx / 2);
  }
  // SW-CELL-3, SW-CELL-4: the air cooler bays side by side over the rack from its second bay on, on a deck of their own carried by the rack's columns
  const air = plans.filter(p => p.lane === 'air');
  if (air.length) {
    let xa = RACK.start + RACK.bent;
    for (const p of air) { const sp: Spot = { tag: p.tag, item: p.item, kind: p.kind, lane: p.lane, side: -1, x: up(xa + p.lx / 2), z: 0, lx: p.lx, lz: p.lz, h: p.h, shape: 'box' }; spots.push(sp); settle(p, sp); xa = sp.x + p.lx / 2; }
    far = Math.max(far, xa);
    const b0 = RACK.start + Math.floor((RACK.start + RACK.bent - RACK.start) / RACK.bent) * RACK.bent, b1 = RACK.start + Math.ceil((xa - RACK.start) / RACK.bent) * RACK.bent, zc = hw - RACK_COL / 2;
    const post = makeWideFlange('W8x31', 8, 31, DECK - 12 - 14 - RACK.tiers[RACK.tiers.length - 1]), beam = makeWideFlange('W14x48', 14, 48, 384), girder = makeWideFlange('W12x40', 12, 40, b1 - b0);
    for (let x = b0; x <= b1 + 1e-6; x += RACK.bent) {
      for (const sgn of [1, -1]) out.push({ part: post, transform: multiply(translate(x, RACK.tiers[RACK.tiers.length - 1], sgn * zc), standUp()), tags: ['cooler-deck', 'post'] });
      out.push({ part: beam, transform: frameFromAxes([x, DECK - 12 - 7, -192], [0, 1, 0], [0, 0, 1]), tags: ['cooler-deck', 'beam'] });
    }
    for (const sgn of [1, -1]) out.push({ part: girder, transform: frameFromAxes([b0, DECK - 6, sgn * 180], [0, 1, 0], [1, 0, 0]), tags: ['cooler-deck', 'girder'] });
  }
  // vessel side (−z): the vessels first, each row on one centre line beyond the pumps' row and the access way; then each
  // pump opposite the vessel it draws from, as near its centre as the pumps before it allow (SW-CELL-3)
  const mine = pumps(-1), depthP = mine.length ? Math.max(...mine.map(p => p.lz)) : 0;
  rows(plans.filter(p => p.lane === 'vessel' && !p.across), -1, hw + pumpOff(-1) + depthP + (mine.length ? 96 : 0), 120, true);
  // SW-CELL-3: the vessels stated to stand across the rack: one row on one centre line on the exchangers' side, begun where the exchangers' and machines' row ends, or 4 ft beyond the
  // station of a regenerator across the rack where that is further along (its blower's discharge runs along the row to that station before it turns under the rack)
  { const acr = plans.filter(p => p.lane === 'vessel' && p.across);
    if (acr.length) {
      const end = Math.max(x0, ...spots.filter(q => q.side === 1 && q.lane === 'exchanger' && q.lx > 0).map(q => q.x + q.lx / 2 + (plans.find(p => p.tag === q.tag)?.gap ?? 48)));
      const regen = spots.filter(q => q.kind === 'cracker' && q.side === -1).map(q => { const b = union(placedBoxes(equipment.filter(v => v.tag === q.tag)).filter(v => /^regenerator shell$/.test(v.name))); return (b.mn[0] + b.mx[0]) / 2 + 48; });
      rows(acr, 1, zP + 96, 120, true, up(Math.max(end, ...regen)));
    } }
  // SW-CELL-3: an ejector set behind the column it draws from, in a row of its own 10 ft further from the rack, its first ejector's suction at the column's station along the rack
  for (const p of plans.filter(q => q.lane === 'behind')) {
    const src = sh.lines.find(l => l.to.k === 'eq' && l.to.tag === p.item && l.to.port === 'inlet')?.from, col = src && src.k === 'eq' ? spots.find(q => q.item === src.tag) : undefined;
    if (!col) throw new Error(`${p.item}: the column it draws from is not placed`);
    const ch = union(placedBoxes(built.get(p)!.equipment).filter(q => /^stage 1 ejector: suction chamber$/.test(q.name)));
    const sp: Spot = { tag: p.tag, item: p.item, kind: p.kind, lane: p.lane, side: col.side, x: col.x - near((ch.mn[0] + ch.mx[0]) / 2), z: near(col.z + col.side * (col.lz / 2 + 120 + p.lz / 2)), lx: p.lx, lz: p.lz, h: p.h, shape: 'box' };
    spots.push(sp); settle(p, sp); far = Math.max(far, sp.x + p.lx / 2);
  }
  // SW-CELL-3: a hotwell under the ejector set that drains into it, square to the rack: its axis under the row of the condensers' boots, its middle under the row's middle
  for (const p of plans.filter(q => q.lane === 'under')) {
    const src = sh.lines.find(l => l.to.k === 'eq' && l.to.tag === p.item && /^tail pipe/.test(l.to.port))!.from as { tag: string }, host = spots.find(q => q.item === src.tag), hp = plans.find(q => q.item === src.tag);
    if (!host || !hp) throw new Error(`${p.item}: the set that drains into it is not placed`);
    const boots = placedBoxes(built.get(hp)!.equipment).filter(b => /condensate boot$/.test(b.name)), bz = boots.map(b => (b.mn[2] + b.mx[2]) / 2 + host.z);
    const sp: Spot = { tag: p.tag, item: p.item, kind: p.kind, lane: p.lane, side: host.side, x: near((boots[0].mn[0] + boots[0].mx[0]) / 2 + host.x), z: near((Math.min(...bz) + Math.max(...bz)) / 2), lx: p.lx, lz: p.lz, h: p.h, shape: 'box' };
    spots.push(sp); settle(p, sp);
  }
  const sourceX = (p: Plan) => { const src = sh.lines.find(l => l.to.k === 'eq' && l.to.tag === p.item && l.to.port === 'S')?.from, v = src && src.k === 'eq' ? spots.find(q => q.item === src.tag) : undefined; return v ? v.x : Infinity; };
  const opposite = (list: Plan[], side: 1 | -1, start: number) => {
    const groups = [...new Set(list.map(p => p.item))].map(item => ({ item, ps: list.filter(p => p.item === item), x: sourceX(list.find(p => p.item === item)!) })).sort((a, b) => a.x - b.x);
    let cursor = start;
    for (const g of groups) {
      const width = g.ps.reduce((a, p) => a + p.lx + (p.gap ?? 36), 0); let xx = Math.max(cursor, Number.isFinite(g.x) ? up(g.x - width / 2) : cursor);
      for (const p of g.ps) { xx = up(xx + p.lx / 2); const sp: Spot = { tag: p.tag, item: p.item, kind: p.kind, lane: p.lane, side, x: xx, z: near(side * (hw + pumpOff(side) + p.lz / 2)), lx: p.lx, lz: p.lz, h: p.h, shape: 'box' }; spots.push(sp); settle(p, sp); xx += p.lx / 2 + (p.gap ?? 36); far = Math.max(far, xx); }
      cursor = xx;
    }
  };
  opposite(mine, -1, x0);
  if (theirs.length) opposite(theirs, 1, Math.max(x0, ...spots.filter(q => q.side === 1 && q.lane === 'pump').map(q => q.x + q.lx / 2 + 36)));   // the vessels across the rack: their pumps opposite them too, beyond the pumps already in that row
  const rackEnd = RACK.start + up(far - RACK.start, RACK.bent);
  // SW-CELL-6: a stringer along the rack's centre line under the lowest tier, bay by bay, from which lines crossing under the rack hang
  { const st = makeWideFlange('W8x18', 8, 18, RACK.bent - 12);
    for (let x = RACK.start; x < rackEnd - 1e-6; x += RACK.bent) out.push({ part: st, transform: frameFromAxes([x + 6, RACK.tiers[0] - 4, 0], [0, 1, 0], [1, 0, 0]), tags: ['rack-stringer', 'beam'] }); }
  // SW-CELL-6: a line of support steel along each side of the rack that has equipment, 18 in beyond the pumps' row: posts at each bent
  // and a beam along the rack whose underside is YARD above grade, from which the lines crossing between equipment and rack hang
  const yard: { neg?: number; pos?: number } = {};
  for (const side of [1, -1] as const) {
    if (!spots.some(q => q.side === side && q.lane !== 'pump' && q.lane !== 'air' && q.lane !== 'heater')) continue;
    const rowP = spots.filter(q => q.side === side && q.lane === 'pump'), zb = up(Math.max(hw + 78, ...rowP.map(q => Math.abs(q.z) + q.lz / 2 + 18))), post = makeWideFlange('W8x31', 8, 31, YARD - PAD), beam = makeWideFlange('W12x40', 12, 40, rackEnd - RACK.start);
    for (let x = RACK.start; x <= rackEnd + 1e-6; x += RACK.bent) { out.push({ part: kit.concrete('pedestal', 20, PAD, 20), transform: frameFromAxes([x - 10, PAD / 2, side * zb], [0, 1, 0], [1, 0, 0]), tags: ['yard-support', 'pad'] }); out.push({ part: post, transform: multiply(translate(x, PAD, side * zb), standUp()), tags: ['yard-support', 'post'] }); }
    out.push({ part: beam, transform: frameFromAxes([RACK.start, YARD + 6, side * zb], [0, 1, 0], [1, 0, 0]), tags: ['yard-support', 'beam'] });
    if (side > 0) yard.pos = zb; else yard.neg = -zb;
    // where a body stands in a row behind the first (an ejector set), the same steel leads to it: beams along the rack at 15 ft at most between the yard's line and
    // the body's own steel, as long as its connections toward the rack and its hotwell reach along the rack, with 6 ft over at either end; posts at 20 ft at most
    for (const b of spots.filter(q => q.side === side && q.lane === 'behind')) {
      const under = spots.filter(q => q.lane === 'under' && Math.abs(q.x - b.x) < b.lx / 2 && Math.abs(q.z - b.z) < b.lz / 2), legs = placedBoxes(equipment.filter(q => q.tag === b.tag)).filter(q => /leg$/.test(q.name));
      const xs = [...under.map(q => q.x), ...legs.flatMap(q => [q.mn[0], q.mx[0]])]; if (!xs.length) continue;
      const x0 = down(Math.min(...xs) - 72), x1 = up(Math.max(...xs) + 72), nb = Math.ceil((x1 - x0) / 240 - 1e-9), edge = Math.abs(b.z) - b.lz / 2, n = Math.ceil((edge - zb) / 180 - 1e-9), way = makeWideFlange('W12x40', 12, 40, x1 - x0);   // 15 ft: what a 3 in line spans (SW-PS-7)
      for (let k = 1; k < n; k++) { const z = side * near(zb + ((edge - zb) * k) / n);
        for (let i = 0; i <= nb; i++) { const x = x0 + ((x1 - x0) * i) / nb; out.push({ part: kit.concrete('pedestal', 20, PAD, 20), transform: frameFromAxes([x - 10, PAD / 2, z], [0, 1, 0], [1, 0, 0]), tags: ['yard-support', 'pad'] }); out.push({ part: post, transform: multiply(translate(x, PAD, z), standUp()), tags: ['yard-support', 'post'] }); }
        out.push({ part: way, transform: frameFromAxes([x0, YARD + 6, z], [0, 1, 0], [1, 0, 0]), tags: ['yard-support', 'beam', 'way'] }); }
    }
  }
  // heaters beyond the outer end of the rack, 50 ft from the nearest equipment, side by side across it
  let zh = -heat.reduce((a, p) => a + p.lz + 120, -120) / 2, xH = 0;
  for (const p of heat) { const s: Spot = { tag: p.tag, item: p.item, kind: p.kind, lane: p.lane, side: 1, x: up(rackEnd + 600 + p.lx / 2), z: near(zh + p.lz / 2), lx: p.lx, lz: p.lz, h: p.h, shape: 'box' }; spots.push(s); settle(p, s); zh += p.lz + 120; xH = Math.max(xH, s.x + p.lx / 2); }
  // SW-CELL-2: where heaters stand beyond the equipment, the rack runs on toward them and ends 10 ft short of their pads, so that their lines have steel under them
  const rack: RackLayout = { x0: RACK.start, x1: rackEnd + (heat.length ? 480 : 0), bentSpacing: RACK.bent, halfWidth: hw, tiers: RACK.tiers, loadPsf: RACK.loadPsf };
  kit.rack({ ...rack, x0: RACK.start - RACK.bent });                                                      // SW-CELL-2: one bay more toward the battery limit, the valve bay (SW-RPI-4)
  // SW-CELL-2: no ladder at the rack's battery-limit end, where the lines to the main pipeway pass out between its columns (§80); the ladder at its far end stays
  for (let i = out.length - 1; i >= 0; i--) if (out[i].tags.includes('rack-ladder') && out[i].transform[12] < RACK.start) out.splice(i, 1);
  const notes = [`Unit ${unit}: ${spots.length} bodies of ${sh.equip.size} items; rack ${(rackEnd - RACK.start) / 12} ft long, ${(2 * hw) / 12} ft wide, tiers at ${RACK.tiers.map(t => t / 12).join(', ')} ft (SW-CELL-2, SW-CELL-3).`];
  const m: CellModel = { unit, name: sh.name, rack, spots, yard, interior: { instances: out, derived, notes, equipment }, x1: Math.max(rack.x1, xH) + 24, z0: Math.min(-hw, ...spots.map(s => s.z - s.lz / 2)) - 24, z1: Math.max(hw, ...spots.map(s => s.z + s.lz / 2)) + 24, y1: Math.max(...spots.map(s => s.h)) };
  cache.set(key, m); return m;
}
