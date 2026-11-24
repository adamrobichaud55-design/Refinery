/**
 * Plant 3: a unit built in its own frame (DESIGN_BASIS.md §78, SW-CELL-1..5). Each sized item of the process model
 * becomes a catalogue body at its size, standing in its row beside the unit's rack. Inches; x from the battery limit
 * along the rack, z across, y up. The steel of the rack and the pads are built by the interior kit of plants 1 and 2,
 * unchanged; nozzles are not part of a body (the piping stage adds them).
 */
import {
  makeVerticalVessel, makeHorizontalVessel, makeExchanger, makePump, makeAirCooler, makeFiredHeater, makeCompressorPackage, makeBlower,
  makePlatformedColumn, makeSwagedTower, makeCabinHeater, makeConeRoofTank, makeCatCracker, makeWetScrubber, makeFlueGasCooler, makeSulfurFurnace,
  makeSulfurCondenser, makeIncinerator, makePsaUnit, makeWaterTubeBoiler, makeCoolingTower, makeSilo, makeDeaerator, makeEjector, makeSulfurPit, makeSeparatorBasin,
  type PartSpec,
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

const up = (v: number, s = 6) => Math.ceil(v / s - 1e-9) * s, near = (v: number, s = 6) => Math.round(v / s) * s;
/** SW-CELL-2: the unit rack */
export const RACK = { start: 360, bent: 240, half: 144, tiers: [192, 264, 336] as const, loadPsf: 40 };
export const PAD = 6, PUMP_PAD = 9, Y_VESSEL = PAD + 1.5 + 0.75;
export type Lane = 'pump' | 'exchanger' | 'air' | 'vessel' | 'heater';
/** where a body stands in its unit, and the facts of its shape the nozzle schedule needs */
export interface Spot {
  tag: string; item: string; kind: EqKind; lane: Lane; side: 1 | -1; x: number; z: number; /** footprint along and across the rack, and height */ lx: number; lz: number; h: number;
  shape: 'vv' | 'hv' | 'hx' | 'pump' | 'tank' | 'box'; /** the origin of the body's own frame */ o?: [number, number, number]; /** outside radius; bottom and top tangent, or centre line; axis direction of a horizontal body */ R?: number; yb?: number; yt?: number; yc?: number; axis?: 'x' | 'z'; len?: number;
}
export interface CellModel { unit: number; name: string; rack: RackLayout; spots: Spot[]; interior: InteriorModel; /** the unit's extent in its own frame */ x1: number; z0: number; z1: number; y1: number }

/** a body before it is placed: its footprint and how to build it at a spot */
interface Plan { tag: string; item: string; kind: EqKind; lane: Lane; lx: number; lz: number; h: number; gap?: number; side?: 1 | -1; build: (c: Ctx, s: Spot) => void }
interface Ctx { out: Placed[]; equipment: InteriorModel['equipment']; kit: ReturnType<typeof interiorKit> }
const SUFFIX = 'ABCDEFGH';
/** a catalogue item without the nozzles it draws for the catalogue: the piping stage adds the plant's own (SW-CELL-4) */
export function bare(p: PartSpec): PartSpec {
  const solids = (p.extra?.solids as { name: string }[] | undefined)?.filter(s => !/nozzle|blind flange|flange face|stub/i.test(s.name) || /manway/i.test(s.name));
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
      const part = platforms ? bare(makePlatformedColumn({ tag, ID, t, TT, skirtH: skirt, trays: Math.max(1, trays) })) : makeVerticalVessel({ tag, ID, t, TT, skirtH: skirt });
      pad(c, s.x, s.z, 2 * R + 36, 2 * R + 36, tag); place(c, part, upright(s.x, Y_VESSEL, s.z, platforms ? (s.side > 0 ? -Math.PI / 2 : Math.PI / 2) : 0), tag);   // the open side of the platforms faces the rack
      Object.assign(s, { shape: 'vv', R, yb: Y_VESSEL + skirt + R / 2, yt: Y_VESSEL + skirt + R / 2 + TT });
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
  const boxy = (tag: string, lane: Lane, lx: number, lz: number, h: number, build: (c: Ctx, s: Spot) => void, gap = 48): Plan => ({ tag, item: e.tag, kind: e.kind, lane, lx, lz, h, gap, build: (c, s) => { build(c, s); Object.assign(s, { shape: s.shape ?? 'box' }); } });
  const volume = (min = 600) => { const s = e.ports.find(p => p.dir === 'in')?.s; return s ? Math.max(8, cfs(s) * (s.ph === 'L' ? min : 20)) : 50; };
  const asVessel = (tag: string, ft3: number, skirt = 60) => { const ID = Math.max(36, up(Math.cbrt((4 * ft3) / (2.5 * Math.PI)) * 12, 6)); return vertical(tag, ID, 0.375, 2.5 * ID, skirt, false); };

  switch (e.kind) {
    case 'pump': return tags(z.count).map(tag => {
      const D = Math.max(6, d.impeller), casingD = Math.max(10, up(1.5 * D, 1)), casingW = Math.max(6, up(0.5 * D * d.stages, 1)), motorD = Math.max(8, Math.round(d.motorFrame)), motorL = up(1.8 * motorD, 1);
      const baseW = up(Math.max(casingD, motorD) + 12, 6), baseL = up(14 + casingW + motorL + 6, 12), shaftY = 1 + casingD / 2 + 4;
      return { tag, item: e.tag, kind: e.kind, lane: 'pump' as Lane, lx: baseW + 12, lz: baseL + 12, h: PUMP_PAD + shaftY + Math.max(casingD, motorD) / 2, gap: 36, build: (c: Ctx, s: Spot) => {
        pad(c, s.x, s.z, baseW + 12, baseL + 12, tag, PUMP_PAD, 'pump pad'); place(c, makePump({ tag, baseW, baseL, casingD, casingW, motorD, motorL }), frameFromAxes([s.x, PUMP_PAD, s.z], [0, 1, 0], [0, 0, s.side]), tag);
        Object.assign(s, { shape: 'pump', R: casingD / 2, yc: PUMP_PAD + shaftY, len: baseL, axis: 'z' });
      } };
    });
    case 'hx': case 'condenser': return tags(d.shells ?? z.count).map((tag, k) => {
      const ID = d.ID, t = d.tShell ?? 0.5, R = ID / 2 + t, TT = 240, upper = k % 2 === 1, yc = PAD + 48 + R + (upper ? 2 * R + 30 : 0), outer = TT + ID / 2 + Math.max(1, ID / 12), inner = R / 2;
      return { tag, item: e.tag, kind: e.kind, lane: 'exchanger' as Lane, lx: upper ? 0 : 2 * R + 24, lz: outer + inner, h: yc + R, gap: 54, build: (c: Ctx, s: Spot) => {
        // square to the rack, channel end outward: the tubesheet is at the outer end of the tube length, the rear head toward the rack
        const zo = near(s.z + s.side * ((outer + inner) / 2 - (outer - TT)));                          // the tubesheet, on the grid
        if (!upper) pad(c, s.x, zo - s.side * (TT / 2), 2 * R + 24, TT + 24, tag);
        place(c, makeExchanger({ tag, ID, t, TT, centreline: upper ? R + 30 : 48 + R }), frameFromAxes([s.x, yc, zo], [0, 1, 0], [0, 0, -s.side]), tag);
        Object.assign(s, { shape: 'hx', R, yc, axis: 'z', len: TT, o: [s.x, yc, zo] });
      } };
    });
    case 'fluegascooler': return [boxy(e.tag, 'vessel', 240 + d.ID, d.ID + 96, d.ID + 150, (c, s) => { pad(c, s.x, s.z, 264, d.ID + 48, e.tag); place(c, bare(makeFlueGasCooler({ tag: e.tag, D: d.ID, L: 240, t: d.tShell, drumT: d.drumT })), frameFromAxes([s.x - 120, PAD + d.ID / 2 + 36, s.z], [0, 1, 0], [1, 0, 0]), e.tag); })];
    case 'aircooler': return tags(d.bays).map(tag => boxy(tag, 'air', 168 + 12, 384 + 24, 144 + 110, (c, s) => place(c, bare(makeAirCooler({ tag, W: 168, L: 384, fans: 2, legH: 144 })), multiply(translate(s.x, 0, s.z), multiply(rotateY(Math.PI / 2), standUp())), tag), 0));
    case 'drum': {
      if (e.p.vertical) return [vertical(e.tag, d.D, d.t, d.L, 60, false)];
      return [horizontal(e.tag, d.D, d.t, d.L, feedsPump ? 120 : 48)];
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
      : [boxy(e.tag, 'heater', d.W + 48, d.L + 48, 84 + 2.5 * d.H, (c, s) => { pad(c, s.x, s.z, d.W + 36, d.L + 36, e.tag); place(c, makeCabinHeater({ tag: e.tag, L: d.L, W: d.W, H: d.H }), multiply(translate(s.x - d.W / 2, PAD, s.z + d.L / 2), multiply(rotateY(Math.PI / 2), standUp())), e.tag); }, 240)];
    case 'compressor': case 'blower': return tags(z.count).map(tag => {
      const casingD = Math.max(10, up(14 * Math.cbrt(d.gasHp / 100), 1)), motorD = Math.max(10, Math.round(d.motorFrame ?? d.wheel ?? 0.8 * casingD));
      if (e.kind === 'blower') { const wheelD = Math.max(12, up(casingD, 1)), baseL = 0.5 * wheelD + 24 + 2 * motorD; return boxy(tag, 'exchanger', 1.4 * wheelD + 24, baseL + 12, 1.6 * wheelD + 12, (c, s) => { pad(c, s.x, s.z, 1.4 * wheelD + 24, baseL + 12, tag, PUMP_PAD, 'machine pad'); place(c, bare(makeBlower({ tag, wheelD, motorD })), frameFromAxes([s.x, PUMP_PAD, s.z - s.side * (baseL / 2 - 6)], [0, 1, 0], [0, 0, s.side]), tag); }); }
      const skidW = up(1.5 * Math.max(casingD, motorD) + 24, 6), skidL = up(1.2 * casingD + 2.2 * motorD + 48, 6);
      return boxy(tag, 'exchanger', skidW + 24, skidL + 24, 2 * Math.max(casingD, motorD) + 24, (c, s) => { pad(c, s.x, s.z, skidW + 24, skidL + 24, tag, 12, 'machine pad'); place(c, bare(makeCompressorPackage({ tag, skidW, skidL, casingD, motorD })), frameFromAxes([s.x, 12, s.z], [0, 1, 0], [0, 0, s.side]), tag); });
    });
    case 'tank': {
      if (e.p.vertical) return [vertical(e.tag, d.D, d.t, d.H, 36, false)];
      const D = d.Dft * 12, H = d.Hft * 12;
      return [boxy(e.tag, 'vessel', D + 120, D + 120, H + D / 16, (c, s) => { pad(c, s.x, s.z, D + 24, D + 24, e.tag); place(c, bare(makeConeRoofTank({ tag: e.tag, D, H })), upright(s.x, PAD, s.z), e.tag); Object.assign(s, { shape: 'tank', R: D / 2, yb: PAD, yt: PAD + H }); }, 120)];
    }
    case 'cracker': {
      const flue = e.ports.find(p => p.name === 'flue gas')!.s, regenD = up(Math.sqrt((4 * cfs({ ...flue, P: 28 })) / (Math.PI * 3)) * 12, 6), regenTT = 1.5 * regenD, reactorD = up(0.6 * regenD, 6), reactorTT = 1.2 * regenTT;
      return [boxy(e.tag, 'vessel', 3.2 * regenD, 2 * regenD, 6 * regenD, (c, s) => { pad(c, s.x, s.z, 3 * regenD, 1.6 * regenD, e.tag); place(c, bare(makeCatCracker({ tag: e.tag, regenD, regenTT, reactorD, reactorTT })), upright(s.x - 0.6 * regenD, PAD, s.z), e.tag); }, 120)];
    }
    case 'scrubber': { const gas = e.ports.find(p => p.name.startsWith('stack'))!.s, D = up(Math.sqrt((4 * cfs(gas)) / (Math.PI * 10)) * 12, 6); return [boxy(e.tag, 'vessel', D + 96, D + 96, 8 * D, (c, s) => { pad(c, s.x, s.z, D + 36, D + 36, e.tag); place(c, bare(makeWetScrubber({ tag: e.tag, D, H: 8 * D })), upright(s.x, PAD, s.z), e.tag); }, 96)]; }
    case 'furnace': return [boxy(e.tag, 'vessel', 420, 144, 144, (c, s) => { pad(c, s.x, s.z, 420, 120, e.tag); place(c, bare(makeSulfurFurnace({ tag: e.tag, D: d.D, furnaceL: d.furnaceL, boilerL: d.boilerL, boilerT: d.boilerT, drumT: d.drumT })), frameFromAxes([s.x - 190, PAD + 66, s.z], [0, 1, 0], [1, 0, 0]), e.tag); })];
    case 'incinerator': return [boxy(e.tag, 'heater', 420, 144, 1300, (c, s) => { pad(c, s.x, s.z, 408, 120, e.tag); place(c, bare(makeIncinerator({ tag: e.tag, D: 72, L: 240, stackH: 1200 })), upright(s.x - 190, PAD, s.z), e.tag); }, 240)];
    case 'psa': return [boxy(e.tag, 'vessel', 4 * 96 + 60, 144, 360, (c, s) => { pad(c, s.x, s.z, 4 * 96 + 36, 120, e.tag); place(c, bare(makePsaUnit({ tag: e.tag, ID: d.D, TT: d.TT, beds: d.beds, t: d.t })), upright(s.x - 144, PAD, s.z), e.tag); })];
    case 'boiler': return [boxy(e.tag, 'vessel', 420, 420, 1200, (c, s) => { pad(c, s.x, s.z, 396, 396, e.tag); place(c, bare(makeWaterTubeBoiler({ tag: e.tag, steamID: d.steamID, L: d.L, centres: d.centres, stackD: 72, stackH: 1200, drumT: d.drumT })), upright(s.x - 60, PAD, s.z + 150), e.tag); }, 180)];
    case 'coolingtower': return [boxy(e.tag, 'vessel', d.cells * d.cellFt * 12 + 48, d.cellFt * 12 + 96, 560, (c, s) => place(c, bare(makeCoolingTower({ tag: e.tag, cells: d.cells, cellL: d.cellFt * 12, cellW: d.cellFt * 12, H: 480, riserNPS: 24 })), upright(s.x - (d.cells * d.cellFt * 12) / 2, 0, s.z + d.cellFt * 6), e.tag), 240)];
    case 'hopper': return [boxy(e.tag, 'vessel', 192, 192, 480, (c, s) => { pad(c, s.x, s.z, 180, 180, e.tag); place(c, bare(makeSilo({ tag: e.tag, D: 144, H: 300, outletNPS: 8, outletH: 96 })), upright(s.x, Y_VESSEL, s.z), e.tag); })];
    case 'ejector': return [boxy(e.tag, 'vessel', 240, 96, 240, (c, s) => { pad(c, s.x, s.z, 240, 84, e.tag); for (const [k, dx] of [-84, 0, 84].entries()) place(c, bare(makeEjector(`${e.tag}-${k + 1}`, [10, 8, 6][k])), frameFromAxes([s.x + dx, PAD + 156, s.z - 30], [0, 1, 0], [0, 0, 1]), `${e.tag}-${k + 1}`);
      for (const [k, dx] of [-42, 42].entries()) place(c, makeExchanger({ tag: `${e.tag}-C${k + 1}`, ID: 30, t: 0.375, TT: 120, centreline: 60 }), frameFromAxes([s.x + dx - 60, PAD + 60, s.z + 12], [0, 1, 0], [1, 0, 0]), `${e.tag}-C${k + 1}`); })];
    case 'pit': return [boxy(e.tag, 'vessel', 420, 204, 60, (c, s) => place(c, makeSulfurPit(e.tag, { L: 384, W: 168, D: 96 }), multiply(translate(s.x - 192, 0, s.z + 84), standUp()), e.tag))];
    case 'basin': return [boxy(e.tag, 'vessel', 1260, 600, 36, (c, s) => place(c, makeSeparatorBasin(e.tag, { channels: 2, w: 240, d: 96, L: 1200 }), multiply(translate(s.x - 600, 0, s.z + 252), standUp()), e.tag), 120)];
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
  const kit = interiorKit({ pedestal: PAD, padHeight: PAD }, out, derived), ctx: Ctx = { out, equipment, kit }, plans: Plan[] = [];
  for (const e of sh.equip.values()) if (part === 'all' || (part === 'tower') === TOWER_TAGS.includes(e.tag)) plans.push(...plansOf(sh, e, Z.equip.get(e.tag)!));
  // SW-CELL-3: pumps stand on the side of the vessels they draw from where they draw from one, otherwise on the exchanger side
  const laneOf = new Map<string, Lane>(plans.map(p => [p.item, p.lane]));
  for (const p of plans) if (p.lane === 'pump') { const src = sh.lines.find(l => l.to.k === 'eq' && l.to.tag === p.item && l.to.port === 'S')?.from; p.side = src && src.k === 'eq' && laneOf.get(src.tag) === 'vessel' ? -1 : 1; }
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
        spots.push(s); p.build(ctx, s); if (p.lx > 0) { xx += p.lx / 2 + (p.gap ?? 48); far = Math.max(far, xx); }
      }
      z += depth + way;
    }
    return z - way;
  };
  const pumps = (side: 1 | -1) => plans.filter(p => p.lane === 'pump' && p.side === side);
  // exchanger side (+z): pumps, access way, exchangers and machines, then the air coolers
  const zP = rows(pumps(1), 1, hw + 60, 48, false), zE = rows(plans.filter(p => p.lane === 'exchanger'), 1, zP + 96, 96, false);
  rows(plans.filter(p => p.lane === 'air'), 1, zE + 120, 96, false);
  // vessel side (−z): pumps, access way, vessels, each row on one centre line
  const zQ = rows(pumps(-1), -1, hw + 60, 48, false); rows(plans.filter(p => p.lane === 'vessel'), -1, zQ + 96, 120, true);
  const rackEnd = RACK.start + up(far - RACK.start, RACK.bent);
  // heaters beyond the outer end of the rack, 50 ft from the nearest equipment, side by side across it
  let zh = -heat.reduce((a, p) => a + p.lz + 120, -120) / 2, xH = 0;
  for (const p of heat) { const s: Spot = { tag: p.tag, item: p.item, kind: p.kind, lane: p.lane, side: 1, x: up(rackEnd + 600 + p.lx / 2), z: near(zh + p.lz / 2), lx: p.lx, lz: p.lz, h: p.h, shape: 'box' }; spots.push(s); p.build(ctx, s); zh += p.lz + 120; xH = Math.max(xH, s.x + p.lx / 2); }
  const rack: RackLayout = { x0: RACK.start, x1: rackEnd, bentSpacing: RACK.bent, halfWidth: hw, tiers: RACK.tiers, loadPsf: RACK.loadPsf };
  kit.rack(rack);
  const notes = [`Unit ${unit}: ${spots.length} bodies of ${sh.equip.size} items; rack ${(rackEnd - RACK.start) / 12} ft long, ${(2 * hw) / 12} ft wide, tiers at ${RACK.tiers.map(t => t / 12).join(', ')} ft (SW-CELL-2, SW-CELL-3).`];
  const m: CellModel = { unit, name: sh.name, rack, spots, interior: { instances: out, derived, notes, equipment }, x1: Math.max(rackEnd, xH) + 24, z0: Math.min(-hw, ...spots.map(s => s.z - s.lz / 2)) - 24, z1: Math.max(hw, ...spots.map(s => s.z + s.lz / 2)) + 24, y1: Math.max(...spots.map(s => s.h)) };
  cache.set(key, m); return m;
}
