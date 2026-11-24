/**
 * Plant 3: a unit built in its own frame (DESIGN_BASIS.md §78, SW-CELL-1..5). Each sized item of the process model
 * becomes a catalogue body at its size, standing in its row beside the unit's rack. Inches; x from the battery limit
 * along the rack, z across, y up. The steel of the rack and the pads are built by the interior kit of plants 1 and 2,
 * unchanged; nozzles are not part of a body (the piping stage adds them).
 */
import {
  makeVerticalVessel, makeHorizontalVessel, makeExchanger, makePump, makeAirCooler, makeFiredHeater, makeCompressorPackage, makeBlower,
  makePlatformedColumn, makeSwagedTower, makeCabinHeater, makeConeRoofTank, makeCatCracker, makeWetScrubber, makeFlueGasCooler, makeSulfurFurnace,
  makeSulfurCondenser, makeIncinerator, makeWaterTubeBoiler, makeTurbineCompressor, makeCoolingTower, makeSilo, makeDeaerator, makeEjector, makeSulfurPit, makeSeparatorBasin,
  MOTOR_SHAFT, designFlange, pipeDims, gateFaceToFace, globeFaceToFace, elbowRadius, makeWideFlange, type PartSpec, type PipeClass,
} from '../catalogue';
import type { Dim } from '../core/basis';
import { frameFromAxes, multiply, translate, standUp, rotateY } from '../geometry/transform';
import type { Mat4 } from '../geometry/mesh';
import type { Placed } from '../generator/building';
import type { InteriorModel } from '../generator/interior';
import { interiorKit, type RackLayout } from '../generator/interiorKit';
import { processModel } from './process';
import { sizing, type EquipSize } from './sizing';
import type { Equip, UnitSheet, EqKind } from './flowsheet';
import { cfs } from './fluids';
import { buildGeometry } from '../geometry/partGeometry';

const up = (v: number, s = 6) => Math.ceil(v / s - 1e-9) * s, near = (v: number, s = 6) => Math.round(v / s) * s;
/** SW-CELL-2: the unit rack */
export const RACK = { start: 360, bent: 240, half: 144, tiers: [192, 264, 336] as const, loadPsf: 40 };
export const PAD = 6, PUMP_PAD = 9, Y_VESSEL = PAD + 1.5 + 0.75;
/** SW-CELL-4: the air coolers' deck, top of steel, 9 ft above the rack's top tier; the rack's column depth (SW-RK-2: top tier / 24, to 2 in) */
/** SW-CELL-6: the underside of the yard's support beams */
export const YARD = 366;
export const DECK = RACK.tiers[RACK.tiers.length - 1] + 108, RACK_COL = Math.ceil(RACK.tiers[RACK.tiers.length - 1] / 24 / 2) * 2;
export type Lane = 'pump' | 'exchanger' | 'air' | 'vessel' | 'heater';
/** where a body stands in its unit, and the facts of its shape the nozzle schedule needs */
export interface Spot {
  tag: string; item: string; kind: EqKind; lane: Lane; side: 1 | -1; x: number; z: number; /** footprint along and across the rack, and height */ lx: number; lz: number; h: number;
  shape: 'vv' | 'hv' | 'hx' | 'pump' | 'machine' | 'tank' | 'cabin' | 'box'; /** the origin of the body's own frame */ o?: [number, number, number]; /** outside radius; bottom and top tangent, or centre line; axis direction of a horizontal body */ R?: number; yb?: number; yt?: number; yc?: number; axis?: 'x' | 'z'; len?: number;
  /** a plane on the grid square to the axis: a pump's or compressor's casing centre, an exchanger's channel centre; and a pump's suction end */ zc?: number; zs?: number;
  /** the platform floors of a column, elevations */ floors?: number[];
  /** the tags of the parts that make up the body */ parts?: string[];
}
export interface CellModel { unit: number; name: string; rack: RackLayout; spots: Spot[]; interior: InteriorModel; /** where the yard's support beams run, z, on each side that has one */ yard: { neg?: number; pos?: number }; /** the unit's extent in its own frame */ x1: number; z0: number; z1: number; y1: number }

/** SW-CELL-4: the room a connection under a shell needs for the generator's stack (SW-LL-6): its standout, the blind and gaskets, a gate valve, a weld-neck flange, an elbow, half the pipe and 18 in */
export function valveDrop(NPS: number, cls: PipeClass, throttled = false): number {
  const f = designFlange(NPS, cls), OD = pipeDims(NPS, cls).OD, v = gateFaceToFace(NPS, cls) + 2 * f.rfH, Lf = f.tf + f.hubLen + f.neckLen;
  // a water consumer's inlet also carries a throttling globe valve, a flanged 6 in stub between the two valves (SW-LL-7, SW-LL-8)
  return f.OD / 2 + 3 + 1.5 + v + Lf + elbowRadius(OD) + OD / 2 + 18 + (throttled ? globeFaceToFace(NPS, cls) + 2 * f.rfH + 6 + 2 * Lf + 1 : 0);
}
/** a body before it is placed: its footprint and how to build it at a spot */
interface Plan { tag: string; item: string; kind: EqKind; lane: Lane; lx: number; lz: number; h: number; gap?: number; side?: 1 | -1; /** stands in the ground, with no pad (a pit, a basin) */ ground?: boolean; /** SW-CELL-7: the solid whose centre is brought onto the 6 in grid in the axes named, so that connections on it can be met (in y by a thicker pad) */ align?: { solid: RegExp; axes: string }; build: (c: Ctx, s: Spot) => void }
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
const SUFFIX = 'ABCDEFGH';
/** a catalogue item without the nozzles it draws for the catalogue: the piping stage adds the plant's own (SW-CELL-4) */
export function bare(p: PartSpec): PartSpec {
  // a compressor's lube oil piping is left out with the nozzles: the generator would hold its bounding box, which spans the casing, as solid;
  // a vessel's level connections are instrument connections, outside this model's scope
  const solids = (p.extra?.solids as { name: string }[] | undefined)?.filter(s => !/nozzle|blind flange|flange face|stub|lube oil piping|level connection/i.test(s.name) || /manway/i.test(s.name));
  return solids ? { ...p, extra: { ...p.extra, solids } } : p;
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
  const horizontal = (tag: string, ID: number, t: number, TT: number, under: number, exchanger = false): Plan => {
    const R = ID / 2 + t, yc = PAD + under + R, pier = under - 18;
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

  switch (e.kind) {
    case 'pump': return tags(z.count).map(tag => {
      const D = Math.max(6, d.impeller), casingD = Math.max(10, up(1.5 * D, 1)), casingW = Math.max(6, up(0.5 * D * d.stages, 1)), motorD = Math.max(8, Math.round(d.motorFrame)), motorL = up(1.8 * motorD, 1);
      const baseW = up(Math.max(casingD, motorD) + 12, 6), baseL = up(14 + casingW + motorL + 6, 12), shaftY = 1 + casingD / 2 + 4;
      // SW-CELL-4: the pad is raised until the shaft stands on the grid, and the pump set along its shaft until the casing's centre plane does
      const padH = up(PUMP_PAD + shaftY) - shaftY, dz = up(casingW / 2) - casingW / 2;
      return { tag, item: e.tag, kind: e.kind, lane: 'pump' as Lane, lx: baseW + 12, lz: baseL + 12, h: padH + shaftY + Math.max(casingD, motorD) / 2, gap: 36, build: (c: Ctx, s: Spot) => {
        const zp = s.z + s.side * dz;
        pad(c, s.x, zp, baseW + 12, baseL + 12, tag, padH, 'pump pad'); place(c, makePump({ tag, baseW, baseL, casingD, casingW, motorD, motorL }), frameFromAxes([s.x, padH, zp], [0, 1, 0], [0, 0, s.side]), tag);
        Object.assign(s, { shape: 'pump', R: casingD / 2, yc: padH + shaftY, len: baseL, axis: 'z', zc: zp + s.side * (-baseL / 2 + 6 + casingW / 2), zs: zp + s.side * (-baseL / 2 + 6) });
      } };
    });
    case 'hx': case 'condenser': return tags(d.shells ?? z.count).map((tag, k) => {
      // SW-CELL-4: the shell's underside clear of grade by what its largest connection's valve needs below it, 4 ft at least
      const under = up(Math.max(48, ...z.nozzles.map(q => valveDrop(q.NPS, q.cls, q.fluid === 'CWS'))));
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
    case 'fluegascooler': return [boxy(e.tag, 'vessel', 240 + d.ID, d.ID + 96, d.ID + 150, (c, s) => { place(c, bare(makeFlueGasCooler({ tag: e.tag, D: d.ID, L: 240, t: d.tShell, drumT: d.drumT })), frameFromAxes([s.x - 120, PAD + d.ID / 2 + 36, s.z], [0, 1, 0], [1, 0, 0]), e.tag); })];
    // SW-CELL-4: over the rack, on a deck 9 ft above its top tier, the tubes across the rack; the catalogue cooler on 2 ft legs, its headers' tops 134 in above the deck
    case 'aircooler': return tags(d.bays).map(tag => boxy(tag, 'air', 168 + 12, 384 + 24, DECK + 134, (c, s) => { place(c, bare(makeAirCooler({ tag, W: 168, L: 384, fans: 2, legH: 24 })), multiply(translate(s.x, DECK, s.z), multiply(rotateY(Math.PI / 2), standUp())), tag); Object.assign(s, { yt: DECK + 134 }); }, 0));
    case 'drum': {
      if (e.p.vertical) return [vertical(e.tag, d.D, d.t, d.L, 60, false)];
      return [horizontal(e.tag, d.D, d.t, d.L, up(Math.max(feedsPump ? 120 : 48, ...z.nozzles.filter(q => q.dir === 'out' && !/gas|vapour|vent|steam out/.test(q.port)).map(q => valveDrop(q.NPS, q.cls)))))];
    }
    case 'desalter': return [horizontal(e.tag, d.D, d.t, d.L, 60)];
    case 'deaerator': return [boxy(e.tag, 'vessel', d.L + d.D, d.D + 24, 180 + 2 * d.D, (c, s) => { pad(c, s.x, s.z, d.L + 24, d.D + 24, e.tag); for (const f of [0.2, 0.8]) pad(c, s.x - d.L / 2 + f * d.L, s.z, 48, d.D, e.tag, 162, 'pier'), c.out[c.out.length - 1].transform = frameFromAxes([s.x - d.L / 2 + f * d.L - 24, PAD + 81, s.z], [0, 1, 0], [1, 0, 0]);
      place(c, bare(makeDeaerator({ tag: e.tag, ID: d.D, L: d.L, centreline: d.D / 2 + 18, t: d.t })), frameFromAxes([s.x - d.L / 2, PAD + 162 + 18 + d.D / 2, s.z], [0, 1, 0], [1, 0, 0]), e.tag); Object.assign(s, { shape: 'hv', R: d.D / 2 + 0.5, yc: PAD + 180 + d.D / 2, axis: 'x', len: d.L }); })];
    case 'column': {
      if (d.Dtop) return [boxy(e.tag, 'vessel', d.D + 132, d.D + 132, Y_VESSEL + d.skirt + d.TT + d.D / 2, (c, s) => { pad(c, s.x, s.z, d.D + 48, d.D + 48, e.tag); place(c, bare(makeSwagedTower({ tag: e.tag, sections: [[d.Dbot, d.hBot], [d.D, d.hMid], [d.Dtop, d.hTop]], t: d.t, skirtH: d.skirt })), upright(s.x, Y_VESSEL, s.z, s.side > 0 ? -Math.PI / 2 : Math.PI / 2), e.tag); Object.assign(s, { shape: 'vv', R: d.D / 2 + d.t, yb: Y_VESSEL + d.skirt, yt: Y_VESSEL + d.skirt + d.TT }); }, 96)];
      return [vertical(e.tag, d.D, d.t, d.TT, d.skirt, d.skirt + d.TT > 360, d.trays)];
    }
    case 'reactor': return d.TT ? [vertical(e.tag, d.D, d.t, d.TT, 96, d.TT + 96 > 360)] : [horizontal(e.tag, d.D, d.t, d.L, 48)];
    case 'vessel': case 'filter': return tags(z.count).map(tag => vertical(tag, d.D, d.t, d.L, 60, false));
    case 'heater': return d.D
      ? [boxy(e.tag, 'heater', d.D + 48, d.D + 48, 96 + d.H * 1.9, (c, s) => { pad(c, s.x, s.z, d.D + 36, d.D + 36, e.tag); place(c, makeFiredHeater({ tag: e.tag, D: d.D, H: d.H, stackH: up(0.6 * d.H, 12) }), upright(s.x, PAD, s.z), e.tag); Object.assign(s, { shape: 'vv', R: d.D / 2, yb: PAD + 96, yt: PAD + 96 + d.H }); }, 240)]
      : [boxy(e.tag, 'heater', d.W + 48, d.L + 48, 84 + 2.5 * d.H, (c, s) => { pad(c, s.x, s.z, d.W + 36, d.L + 36, e.tag); place(c, makeCabinHeater({ tag: e.tag, L: d.L, W: d.W, H: d.H }), multiply(translate(s.x + d.W / 2, PAD, s.z + d.L / 2), multiply(rotateY(Math.PI / 2), standUp())), e.tag); Object.assign(s, { shape: 'cabin', yb: PAD + 84, yt: PAD + 84 + d.H }); }, 240)];
    case 'compressor': case 'blower': return tags(z.count).map(tag => {
      const casingD = Math.max(10, up(14 * Math.cbrt(d.gasHp / 100), 1)), motorD = Math.max(10, Math.round(d.motorFrame ?? d.wheel ?? 0.8 * casingD));
      if (e.kind === 'blower') { const wheelD = Math.max(12, up(casingD, 1)), baseL = 0.5 * wheelD + 24 + 2 * motorD; return boxy(tag, 'exchanger', 1.4 * wheelD + 24, baseL + 12, 1.6 * wheelD + 12, (c, s) => { place(c, bare(makeBlower({ tag, wheelD, motorD })), frameFromAxes([s.x, PUMP_PAD, s.z - s.side * (baseL / 2 - 6)], [0, 1, 0], [0, 0, s.side]), tag); }); }
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
      return [boxy(e.tag, 'vessel', 3.2 * regenD, 2 * regenD, 6 * regenD, (c, s) => { place(c, bare(makeCatCracker({ tag: e.tag, regenD, regenTT, reactorD, reactorTT })), upright(s.x - 0.6 * regenD, PAD, s.z), e.tag); }, 120)];
    }
    case 'scrubber': { const gas = e.ports.find(p => p.name.startsWith('stack'))!.s, D = up(Math.sqrt((4 * cfs(gas)) / (Math.PI * 10)) * 12, 6); return [boxy(e.tag, 'vessel', D + 96, D + 96, 8 * D, (c, s) => { place(c, bare(makeWetScrubber({ tag: e.tag, D, H: 8 * D })), upright(s.x, PAD, s.z), e.tag); }, 96)]; }
    case 'furnace': return [boxy(e.tag, 'vessel', 420, 144, 144, (c, s) => { place(c, bare(makeSulfurFurnace({ tag: e.tag, D: d.D, furnaceL: d.furnaceL, boilerL: d.boilerL, boilerT: d.boilerT, drumT: d.drumT })), frameFromAxes([s.x - 190, PAD + 66, s.z], [0, 1, 0], [1, 0, 0]), e.tag); })];
    case 'incinerator': return [boxy(e.tag, 'heater', 420, 144, 1300, (c, s) => { place(c, bare(makeIncinerator({ tag: e.tag, D: 72, L: 240, stackH: 1200 })), upright(s.x - 190, PAD, s.z), e.tag); }, 240)];
    case 'psa': return tags(z.count).map(tag => vertical(tag, d.D, d.t, d.TT, 60, false));   // SW-CELL-4: each adsorber a vessel of its own, piped to the others by the generator
    case 'boiler': return [boxy(e.tag, 'vessel', 420, 420, 1200, (c, s) => { place(c, bare(makeWaterTubeBoiler({ tag: e.tag, steamID: d.steamID, L: d.L, centres: d.centres, stackD: 72, stackH: 1200, drumT: d.drumT })), upright(s.x - 60, PAD, s.z + 150), e.tag); }, 180)];
    case 'coolingtower': return [boxy(e.tag, 'vessel', d.cells * d.cellFt * 12 + 48, d.cellFt * 12 + 96, 560, (c, s) => place(c, bare(makeCoolingTower({ tag: e.tag, cells: d.cells, cellL: d.cellFt * 12, cellW: d.cellFt * 12, H: 480, riserNPS: 24 })), upright(s.x - (d.cells * d.cellFt * 12) / 2, 0, s.z + d.cellFt * 6), e.tag), 240, true)];
    case 'hopper': return [boxy(e.tag, 'vessel', 192, 192, 480, (c, s) => { place(c, bare(makeSilo({ tag: e.tag, D: 144, H: 300, outletNPS: 8, outletH: 96 })), upright(s.x, Y_VESSEL, s.z), e.tag); })];
    case 'ejector': return [boxy(e.tag, 'vessel', 240, 96, 240, (c, s) => { for (const [k, dx] of [-84, 0, 84].entries()) place(c, bare(makeEjector(`${e.tag}-${k + 1}`, [10, 8, 6][k])), frameFromAxes([s.x + dx, PAD + 156, s.z - 30], [0, 1, 0], [0, 0, 1]), `${e.tag}-${k + 1}`);
      for (const [k, dx] of [-42, 42].entries()) place(c, makeExchanger({ tag: `${e.tag}-C${k + 1}`, ID: 30, t: 0.375, TT: 120, centreline: 60 }), frameFromAxes([s.x + dx - 60, PAD + 60, s.z + 12], [0, 1, 0], [1, 0, 0]), `${e.tag}-C${k + 1}`); })];
    case 'pit': return [boxy(e.tag, 'vessel', 420, 204, 60, (c, s) => place(c, makeSulfurPit(e.tag, { L: 384, W: 168, D: 96 }), multiply(translate(s.x - 192, 0, s.z + 84), standUp()), e.tag), 48, true)];
    case 'basin': return [boxy(e.tag, 'vessel', 1260, 600, 36, (c, s) => place(c, makeSeparatorBasin(e.tag, { channels: 2, w: 240, d: 96, L: 1200 }), multiply(translate(s.x - 600, 0, s.z + 252), standUp()), e.tag), 120, true)];
    case 'package': return [asVessel(e.tag, volume())];
    default: return [];                                                                                   // loading arms, the flare: built with the offsites
  }
}

/** the cooling tower and its pumps stand on their own plot at the downwind end of the process bench (SW-SITE-4) */
export const TOWER_TAGS = ['X-1903', 'P-1905', 'P-1906', 'F-1902'];
const cache = new Map<string, CellModel>();
/** SW-CELL-3: the unit, arranged and built. `longest` is the room along the rack, in; `part` picks the cooling tower's group out of unit 19, or leaves it out. */
export function buildCell(unit: number, longest = 4200, part: 'all' | 'tower' | 'rest' = 'all'): CellModel {
  const key = `${unit}:${longest}:${part}`, hit = cache.get(key); if (hit) return hit;
  const M = processModel(), sh = M.sheet(unit), Z = sizing().get(unit)!, out: Placed[] = [], derived: Record<string, Dim> = {}, equipment: InteriorModel['equipment'] = [];
  const kit = interiorKit({ pedestal: PAD, padHeight: PAD }, out, derived), plans: Plan[] = [];
  for (const e of sh.equip.values()) if (part === 'all' || (part === 'tower') === TOWER_TAGS.includes(e.tag)) plans.push(...plansOf(sh, e, Z.equip.get(e.tag)!));
  // SW-CELL-3: pumps stand on the side of the vessels they draw from where they draw from one, otherwise on the exchanger side
  const laneOf = new Map<string, Lane>(plans.map(p => [p.item, p.lane]));
  for (const p of plans) if (p.lane === 'pump') { const src = sh.lines.find(l => l.to.k === 'eq' && l.to.tag === p.item && l.to.port === 'S')?.from; p.side = src && src.k === 'eq' && laneOf.get(src.tag) === 'vessel' ? -1 : 1; }
  // SW-CELL-7: every body is built once, at the origin, and measured there: its footprint is what its solids and pads cover, about its
  // datum. A body with no datum the connections are set from (a package, a furnace, a boiler) stands by its extent instead: level on a pad
  // laid under what it stands on, and centred on its spot. Each is then moved to its spot whole.
  const sideOf = (p: Plan): 1 | -1 => (p.lane === 'pump' ? p.side! : p.lane === 'vessel' || p.lane === 'air' ? -1 : 1);
  const built = new Map<Plan, { out: Placed[]; equipment: InteriorModel['equipment']; facts: Spot }>();
  for (const p of plans) {
    const c: Ctx = { out: [], equipment: [], kit }, s0: Spot = { tag: p.tag, item: p.item, kind: p.kind, lane: p.lane, side: sideOf(p), x: 0, z: 0, lx: p.lx, lz: p.lz, h: p.h, shape: 'box' };
    p.build(c, s0); built.set(p, { out: c.out, equipment: c.equipment, facts: s0 });
    if (!c.equipment.length) continue;
    if (p.lane === 'air') { p.h = Math.max(p.h, union(placedBoxes(c.out)).mx[1]); continue; }   // the bays stand side by side on their deck at the pitch given (SW-CELL-4)
    const move = (dx: number, dy: number, dz: number) => { const T = translate(dx, dy, dz); for (const q of [...c.out, ...c.equipment]) q.transform = multiply(T, q.transform); };
    if (s0.shape === 'box') {
      const centreOf = (re: RegExp) => { const b = union(placedBoxes(c.equipment).filter(q => re.test(q.name))); return [(b.mn[0] + b.mx[0]) / 2, (b.mn[1] + b.mx[1]) / 2, (b.mn[2] + b.mx[2]) / 2]; };
      if (!p.ground) {
        const low = Math.min(...placedBoxes(c.equipment).filter(b => !HELD.test(b.name)).map(b => b.mn[1]));
        move(0, PAD - low, 0);
        // a thicker pad where the body's reference solid must stand on the grid in height
        const lift = p.align?.axes.includes('y') ? (() => { const cy = centreOf(p.align!.solid)[1]; return up(cy - 1e-6) - cy; })() : 0; if (lift) move(0, lift, 0);
        const foot = union(placedBoxes(c.equipment).filter(b => !HELD.test(b.name) && b.mn[1] <= PAD + lift + 3)), lx = up(foot.mx[0] - foot.mn[0] + 12, 1), lz = up(foot.mx[2] - foot.mn[2] + 12, 1);
        c.out.push({ part: kit.concrete('equipment pad', lz, PAD + lift, lx), transform: frameFromAxes([(foot.mn[0] + foot.mx[0]) / 2 - lx / 2, (PAD + lift) / 2, (foot.mn[2] + foot.mx[2]) / 2], [0, 1, 0], [1, 0, 0]), tags: [p.tag, 'pad'] });
      }
      const all = union(placedBoxes(c.out)); move(-near((all.mn[0] + all.mx[0]) / 2), 0, -near((all.mn[2] + all.mx[2]) / 2));
      if (p.align) { const c0 = centreOf(p.align.solid); move(p.align.axes.includes('x') ? near(c0[0]) - c0[0] : 0, 0, p.align.axes.includes('z') ? near(c0[2]) - c0[2] : 0); }
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
    Object.assign(s, { shape: f.shape, parts: b.equipment.map(q => q.tag), ...(f.R !== undefined ? { R: f.R } : {}), ...(f.yb !== undefined ? { yb: f.yb } : {}), ...(f.yt !== undefined ? { yt: f.yt } : {}), ...(f.yc !== undefined ? { yc: f.yc } : {}), ...(f.axis ? { axis: f.axis } : {}), ...(f.len !== undefined ? { len: f.len } : {}), ...(f.floors ? { floors: f.floors } : {}),
      ...(f.o ? { o: [f.o[0] + s.x, f.o[1], f.o[2] + s.z] } : {}), ...(f.zc !== undefined ? { zc: f.zc + s.z } : {}), ...(f.zs !== undefined ? { zs: f.zs + s.z } : {}) });
  };
  const hw = RACK.half, spots: Spot[] = [], x0 = RACK.start + 60, heat = plans.filter(p => p.lane === 'heater');
  const room = longest - (heat.length ? 600 + Math.max(...heat.map(p => p.lx)) + 48 : 48) - 264;          // the heaters' ground at the outer end, and the rack's last bay
  /** rows of bodies along the rack, a new row further out when one is full; returns the outer edge and how far the rows run */
  let far = x0 + RACK.bent;
  const rows = (list: Plan[], side: 1 | -1, zIn: number, way: number, centred: boolean): number => {
    const lines: Plan[][] = [[]]; let x = x0;
    for (const p of list) { if (p.lx > 0 && x + p.lx > room && lines[lines.length - 1].length) { lines.push([]); x = x0; } lines[lines.length - 1].push(p); if (p.lx > 0) x += p.lx + (p.gap ?? 48); }
    let z = zIn;
    for (const line of lines) {
      if (!line.length) continue;
      const depth = Math.max(...line.map(p => p.lz)); let xx = x0;
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
  // exchanger side (+z): pumps, access way, exchangers and machines, then the air coolers
  const zP = rows(pumps(1), 1, hw + 60, 48, false); rows(plans.filter(p => p.lane === 'exchanger'), 1, zP + 96, 96, false);
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
  rows(plans.filter(p => p.lane === 'vessel'), -1, hw + 60 + depthP + (mine.length ? 96 : 0), 120, true);
  const sourceX = (p: Plan) => { const src = sh.lines.find(l => l.to.k === 'eq' && l.to.tag === p.item && l.to.port === 'S')?.from, v = src && src.k === 'eq' ? spots.find(q => q.item === src.tag) : undefined; return v ? v.x : Infinity; };
  const groups = [...new Set(mine.map(p => p.item))].map(item => ({ item, ps: mine.filter(p => p.item === item), x: sourceX(mine.find(p => p.item === item)!) })).sort((a, b) => a.x - b.x);
  let cursor = x0;
  for (const g of groups) {
    const width = g.ps.reduce((a, p) => a + p.lx + (p.gap ?? 36), 0); let xx = Math.max(cursor, Number.isFinite(g.x) ? up(g.x - width / 2) : cursor);
    for (const p of g.ps) { xx = up(xx + p.lx / 2); const sp: Spot = { tag: p.tag, item: p.item, kind: p.kind, lane: p.lane, side: -1, x: xx, z: near(-(hw + 60 + p.lz / 2)), lx: p.lx, lz: p.lz, h: p.h, shape: 'box' }; spots.push(sp); settle(p, sp); xx += p.lx / 2 + (p.gap ?? 36); far = Math.max(far, xx); }
    cursor = xx;
  }
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
  }
  // heaters beyond the outer end of the rack, 50 ft from the nearest equipment, side by side across it
  let zh = -heat.reduce((a, p) => a + p.lz + 120, -120) / 2, xH = 0;
  for (const p of heat) { const s: Spot = { tag: p.tag, item: p.item, kind: p.kind, lane: p.lane, side: 1, x: up(rackEnd + 600 + p.lx / 2), z: near(zh + p.lz / 2), lx: p.lx, lz: p.lz, h: p.h, shape: 'box' }; spots.push(s); settle(p, s); zh += p.lz + 120; xH = Math.max(xH, s.x + p.lx / 2); }
  // SW-CELL-2: where heaters stand beyond the equipment, the rack runs on toward them and ends 10 ft short of their pads, so that their lines have steel under them
  const rack: RackLayout = { x0: RACK.start, x1: rackEnd + (heat.length ? 480 : 0), bentSpacing: RACK.bent, halfWidth: hw, tiers: RACK.tiers, loadPsf: RACK.loadPsf };
  kit.rack({ ...rack, x0: RACK.start - RACK.bent });                                                      // SW-CELL-2: one bay more toward the battery limit, the valve bay (SW-RPI-4)
  const notes = [`Unit ${unit}: ${spots.length} bodies of ${sh.equip.size} items; rack ${(rackEnd - RACK.start) / 12} ft long, ${(2 * hw) / 12} ft wide, tiers at ${RACK.tiers.map(t => t / 12).join(', ')} ft (SW-CELL-2, SW-CELL-3).`];
  const m: CellModel = { unit, name: sh.name, rack, spots, yard, interior: { instances: out, derived, notes, equipment }, x1: Math.max(rack.x1, xH) + 24, z0: Math.min(-hw, ...spots.map(s => s.z - s.lz / 2)) - 24, z1: Math.max(hw, ...spots.map(s => s.z + s.lz / 2)) + 24, y1: Math.max(...spots.map(s => s.h)) };
  cache.set(key, m); return m;
}
