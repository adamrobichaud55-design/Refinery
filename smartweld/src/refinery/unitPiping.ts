/**
 * Plant 3: a unit as a plant for the piping generator of plants 1 and 2 (DESIGN_BASIS.md §79, SW-RPI-*). The unit's
 * cell (its rack and bodies, §78) is given a nozzle schedule and a line list drawn from its flowsheet and sizes (§74,
 * §75); the generator itself is unchanged and routes, assembles, welds and supports the lines by its own rules.
 */
import { pipeDims, designFlange, gateFaceToFace, type PipeClass } from '../catalogue';
import type { PlantDef } from '../generator/plant';
import { jointBySpec, flangeBySpec, lineGroup } from '../generator/plant';
import { nozzleStandout, type Nozzle, type NozzleDef } from '../generator/nozzles';
import type { LineDef, EndRef, Service } from '../generator/linelist';
import type { BuildingModel, Placed } from '../generator/building';
import { interiorKit } from '../generator/interiorKit';
import { frameFromAxes } from '../geometry/transform';
import { processModel } from './process';
import { sizing, lineSize, utilState, classFor, designPressure, designTemperature, type EquipSize } from './sizing';
import { FLUIDS } from './fluids';
import type { Equip, End, UnitSheet } from './flowsheet';
import { buildCell, valveDrop, bodySolids, RACK, RACK_COL, YARD, type CellModel, type Spot, type SolidBox } from './cell';
import { lineNumber } from './registry';
import { PLOTS } from './site';
import { plotLength } from './assemble';

export type V3 = [number, number, number];
const SUFFIX = 'ABCDEFGH', near = (v: number, s = 6) => Math.round(v / s) * s, up = (v: number, s = 6) => Math.ceil(v / s - 1e-9) * s, down = (v: number, s = 6) => Math.floor(v / s + 1e-9) * s;

/** what a generated line carries, kept beside the generator's own record (SW-RPI-3) */
export interface UnitLine {
  def: LineDef; unit: number; seq: number; fluid: string; origin: 'process' | 'spare' | 'utility' | 'header' | 'root' | 'control'; /** the flowsheet line it is, or branches from */ flow?: number; /** the utility connection it is */ util?: number;
  designP: number; designT: number; /** the rack tier it runs on, where it runs the rack (SW-RPI-7) */ tier?: number; /** the control station it is divided at (SW-RPI-9) */ station?: string; /** a control valve the flowsheet asks for that is not piped: the catalogue does not offer its size */ cvOmitted?: boolean;
}
/** a battery limit spool: two nozzles back to back on a lane of the rack (SW-RPI-4) */
export interface BlSpool { tag: string; stream: string; dir: 'in' | 'out'; line: string; NPS: number; cls: PipeClass; at: V3; /** the rack tier its line runs on (an index into the rack's tiers) */ tier: number; /** the rack lane its line is expected to run in */ lane?: number }
/** a control station's spool at grade under the rack (SW-RPI-9): the line as far as the station, and the part after it */
export interface StationSpool { tag: string; line: string; after: string; at: V3 }
/** a utility header and the lane on the top tier it is foreseen in */
export interface HeaderLane { line: string; z?: number }
/** a branch's root spool on the rack (SW-RPI-8) */
export interface RootSpool { tag: string; line: string; connection: string; parent: string; at: V3; tier: number }
export interface UnitPiping {
  unit: number; cell: CellModel; plant: PlantDef; lines: UnitLine[]; nozzles: Map<string, Nozzle>; spools: BlSpool[]; roots: RootSpool[]; stations: StationSpool[]; headers: HeaderLane[]; notes: string[];
  /** the width of lanes each tier is loaded to in this unit, in */ tierRoom: number;
  /** SW-RPI-7: the rack tiers in use, lowest first (indices into the rack's tiers); the run each line is routed in (an index into `tiers`); the plant as that run is given it, with the solids of the runs before */
  tiers: number[]; passOf: Map<string, number>; passPlant: (pass: number, prior: Placed[]) => PlantDef;
}
/** the width of lanes a tier is loaded to, at least and at most (SW-RPI-7) */
export const TIER_ROOM = 72, TIER_MOST = 204;
const KIT = interiorKit({ pedestal: 6, padHeight: 6 }, [], {});
/** a solid block the generator is shown but the model does not hold: tagged so that no hanger hangs from it */
export function block(mn: V3, mx: V3, name = 'keep-out'): Placed {
  return { part: KIT.concrete(name, mx[2] - mn[2], mx[1] - mn[1], mx[0] - mn[0]), transform: frameFromAxes([mn[0], (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2], [0, 1, 0], [1, 0, 0]), tags: ['keep-out', 'cladding'] };
}

/** how far a gate valve's handwheel stands from the pipe's axis: an upper bound on the catalogue's gate valves (SW-VLV-*), which a test checks */
export const gateReach = (NPS: number) => 4 * NPS + 8;
/** the shortest distance between two segments, by sampling (enough for a clearance check on the grid) */
function segDist(a: V3, b: V3, c: V3, d: V3): number {
  let best = Infinity;
  for (let i = 0; i <= 12; i++) for (let j = 0; j <= 12; j++) { const s = i / 12, t = j / 12, v = Math.hypot(a[0] + (b[0] - a[0]) * s - c[0] - (d[0] - c[0]) * t, a[1] + (b[1] - a[1]) * s - c[1] - (d[1] - c[1]) * t, a[2] + (b[2] - a[2]) * s - c[2] - (d[2] - c[2]) * t); if (v < best) best = v; }
  return best;
}
interface Anchor { A: V3; u: V3; /** a standout other than SW-NOZ-1's */ S?: number }

/** SW-RPI-2: where each connection of an item stands on one of its bodies */
function anchorsOf(s: Spot, e: Equip, z: EquipSize, other: (port: string) => Spot | undefined, temps: (port: string) => number | undefined, solids: () => SolidBox[]): Map<string, Anchor> {
  const pumpX = (port: string) => { const o = other(port); return o && o.kind === 'pump' ? o.x : undefined; };
  const out = new Map<string, Anchor>(), R = s.R ?? 0, toRack: V3 = [0, 0, -s.side], ports = z.nozzles;
  const od = (port: string) => { const n = ports.find(q => q.port === port)!; return designFlange(n.NPS, n.cls).OD; };
  switch (s.shape) {
    case 'pump': out.set('S', { A: [s.x, s.yc!, s.zs!], u: toRack }); out.set('D', { A: [s.x, s.yc! + R, s.zc!], u: [0, 1, 0] }); return out;
    case 'machine': {
      out.set('inlet', { A: [s.x, s.yc!, s.zs!], u: toRack }); out.set('outlet', { A: [s.x, s.yc! + R, s.zc!], u: [0, 1, 0] });   // as a pump: suction on the shaft's line at the casing's free end, facing the rack; discharge on top
      // a turbine driver (SW-EQC-66): steam in on top of its steam chest; exhaust from the side of its casing away from the lube console, below the joint
      const chest = solids().find(b => b.name === 'turbine: steam chest'), casing = solids().find(b => b.name === 'turbine: casing'), console = solids().find(b => b.name === 'lube console'), ex = ports.find(q => q.port === 'turbine exhaust');
      if (chest && casing && console && ex) {
        const rc = (casing.mx[1] - casing.mn[1]) / 2, dy = up(pipeDims(ex.NPS, ex.cls).OD / 2 + 3), sx = (console.mn[0] + console.mx[0]) / 2 > s.x ? -1 : 1, zt = near((casing.mn[2] + casing.mx[2]) / 2);
        out.set('turbine steam in', { A: [s.x, chest.mx[1], near((chest.mn[2] + chest.mx[2]) / 2)], u: [0, 1, 0] });
        out.set('turbine exhaust', { A: [s.x + sx * Math.sqrt(Math.max(rc * rc - dy * dy, 0)), s.yc! - dy, zt], u: [sx, 0, 0] });
      }
      return out;
    }
    case 'hx': {
      // tube connections on the channel's centre plane. Of the shell's two, the one on top stands at the channel end, clear of the tube
      // connection beside it by a gate valve's reach (the generator lays an upward stack's stem outward, along the shell); the one
      // underneath stands 1 ft inside the rear end. On either side, what is heated enters below and leaves above.
      const zo = s.o![2], yT = s.yc! + R, yB = s.yc! - R, top: Anchor[] = [], np = (port: string) => ports.find(q => q.port === port)!;
      const heatedSide = (side: 'tube' | 'shell') => { const i = e.ports.find(p => p.name === `${side} in`), o = e.ports.find(p => p.name === `${side} out`); return i && o ? o.s.T > i.s.T || (o.s.T === i.s.T && o.s.vf > i.s.vf) : /^(BW|CWS)$/.test(np(`${side} in`).fluid); };
      const tH = heatedSide('tube'), sH = heatedSide('shell'), tubeTop = tH ? 'tube out' : 'tube in', tubeBot = tH ? 'tube in' : 'tube out', shellTop = sH ? 'shell out' : 'shell in', shellBot = sH ? 'shell in' : 'shell out';
      out.set(tubeTop, { A: [s.x, yT, s.zc!], u: [0, 1, 0] }); out.set(tubeBot, { A: [s.x, yB, s.zc!], u: [0, -1, 0] });
      const za = s.zc! - s.side * up(Math.max(Math.abs(s.zc! - zo) + 12, gateReach(np(shellTop).NPS) + od(tubeTop) / 2 + 6)), zb = near(zo - s.side * (s.len! - 12));
      out.set(shellTop, { A: [s.x, yT, za], u: [0, 1, 0] }); out.set(shellBot, { A: [s.x, yB, zb], u: [0, -1, 0] }); void top;
      return out;
    }
    case 'hv': {
      // a horizontal drum, its axis along the rack: what enters and gas on top, liquids below, in order along its length
      const x0 = s.x - s.len! / 2, topP = ports.filter(q => q.dir === 'in' || /gas|vapour|vent|steam out/.test(q.port)), botP = ports.filter(q => !topP.includes(q));
      // under the shell, no connection stands over a saddle and its pier (SW-CELL-4: at 0.2 and 0.8 of the length)
      const pier = (Math.max(6, (2 * R) / 3) + 12) / 2, overPier = (x: number, w: number) => [0.2, 0.8].some(f => Math.abs(x - (x0 + f * s.len!)) < pier + w / 2 + 9);
      const along = (list: typeof ports, y: number, u: V3, fromEnd: boolean) => {
        let x = fromEnd ? down(x0 + s.len! - 18) : up(x0 + 18), prev = 0; const step = fromEnd ? -1 : 1;
        for (const q of fromEnd ? [...list].reverse() : list) { const w = designFlange(q.NPS, q.cls).OD; if (prev) x += step * up((prev + w) / 2 + 12); while (u[1] < 0 && overPier(x, w)) x += step * 6; out.set(q.port, { A: [x, y, s.z], u }); prev = w; }
      };
      const ins = topP.filter(q => q.dir === 'in'), gas = topP.filter(q => q.dir === 'out'), toPump = botP.filter(q => pumpX(q.port) !== undefined);
      along(ins, s.yc! + R, [0, 1, 0], false); along(gas, s.yc! + R, [0, 1, 0], true); along(botP.filter(q => !toPump.includes(q)), s.yc! - R, [0, -1, 0], true);
      // a liquid outlet a pump draws from stands over that pump, within the drum's length and clear of the outlets already placed
      // in the order of their pumps along the rack, each as near over its pump as the piers and the outlets already placed allow, leaving room for the next
      const wantOf = (q: typeof ports[number]) => Math.min(Math.max(near(pumpX(q.port)!), up(x0 + 18)), down(x0 + s.len! - 18));
      for (const q of [...toPump].sort((p, r) => wantOf(p) - wantOf(r))) {
        const want = wantOf(q), w = designFlange(q.NPS, q.cls).OD;
        const bad = (x: number) => x < x0 + 18 || x > x0 + s.len! - 18 || overPier(x, w) || [...out].some(([port, a]) => a.u[1] < 0 && Math.abs(a.A[0] - x) < (w + od(port)) / 2 + 6);
        let x = up(Math.max(x0 + 18, want - 36)); while (bad(x) && x <= x0 + s.len!) x += 6;
        if (bad(x)) { x = want; while (bad(x) && x >= x0) x -= 6; }
        if (bad(x)) throw new Error(`${e.tag}: no place under the shell for "${q.port}" (wanted ${want}, shell ${x0} to ${x0 + s.len!}, flange ${w}, placed ${[...out].filter(([, a]) => a.u[1] < 0).map(([p, a]) => `${p} at ${a.A[0]}`).join(', ')})`);
        out.set(q.port, { A: [x, s.yc! - R, s.z], u: [0, -1, 0] });
      }
      return out;
    }
    case 'vv': {
      if (e.kind === 'heater') {   // a vertical cylindrical heater beyond the rack's end: the coil enters the convection box and leaves the radiant shell near its floor, both toward the rack; fuel gas under the floor
        out.set('inlet', { A: [s.x - 0.3 * 2 * R, up(s.yt! + 0.2 * 2 * R), s.z], u: [-1, 0, 0] }); out.set('outlet', { A: [s.x, up(s.yb! + 24), s.z - R], u: [0, 0, -1] }); out.set('fuel gas', { A: [s.x, down(s.yb! - 18), s.z + R], u: [0, 0, 1] });
        // a waste gas it burns enters beside the fuel gas, 3 ft along; a steam coil's two ends stand in the convection box's two side faces
        ports.filter(q => /gas$/.test(q.port) && q.port !== 'fuel gas').forEach((q, k) => out.set(q.port, { A: [s.x + 36 * (k + 1), down(s.yb! - 18), s.z + R], u: [0, 0, 1] }));
        if (ports.some(q => q.port === 'steam coil in')) { out.set('steam coil in', { A: [s.x, up(s.yt! + 0.2 * 2 * R), s.z - 0.3 * 2 * R], u: [0, 0, -1] }); out.set('steam coil out', { A: [s.x, up(s.yt! + 0.2 * 2 * R), s.z + 0.3 * 2 * R], u: [0, 0, 1] }); }
        return out;
      }
      // every shell connection on the centre line of the half that faces the rack (the platforms and ladders stand on the other half)
      const lo = up(s.yb! + 12), hi = down(s.yt! - 12), tOf = (p: string) => e.ports.find(q => q.name === p)?.s.T ?? temps(p) ?? 0;
      let topUsed = false; const want: { p: string; y: number }[] = [], middle: string[] = [];
      // a vessel named in sections (a stacked side stripper): equal sections, the hottest lowest
      const secOf = (p: string) => /^(.+) (in|vapour|out|stripping steam)$/.exec(p), names = [...new Set(ports.map(q => secOf(q.port)?.[1]).filter((n): n is string => !!n && ports.some(q => q.port === `${n} in`) && ports.some(q => q.port === `${n} out`)))];
      const sections = names.length > 1 ? [...names].sort((a, b) => tOf(`${b} in`) - tOf(`${a} in`)) : [], hs = (hi - lo) / Math.max(1, sections.length);
      for (const q of ports) {
        const p = q.port, sec = secOf(p);
        if (!topUsed && ((e.kind === 'reactor' && p === 'inlet') || (q.dir === 'out' && /^(overhead|vapour|gas|gas out|treated gas|net gas|recycle gas|acid gas|vent|hydrogen)$/.test(p)))) { out.set(p, { A: [s.x, s.yt! + R / 2, s.z], u: [0, 1, 0], ...(s.floors ? { S: Math.max(nozzleStandout(q.NPS, q.cls), s.floors[s.floors.length - 1] + 54 - (s.yt! + R / 2)) } : {}) }); topUsed = true; continue; }
        if (sec && sections.includes(sec[1])) { want.push({ p, y: lo + (sections.indexOf(sec[1]) + { out: 0.08, 'stripping steam': 0.2, in: 0.8, vapour: 0.92 }[sec[2] as 'in']) * hs }); continue; }
        const f = (/bottoms|rich amine|rich oil|^liquid$|^outlet$| out$|^water$|^oil$/.test(p) && q.dir === 'out') || (e.kind === 'psa' && /^(feed|tail gas)$/.test(p)) ? 0 : /reboiler draw/.test(p) ? 0.03 : /stripping steam|gas in/.test(p) ? 0.07 : /reboiler return/.test(p) ? 0.12 : /reflux|lean amine|lean oil|quench return|^inlet$/.test(p) ? 1 : -1;
        if (f < 0) middle.push(p); else want.push({ p, y: lo + f * (hi - lo) });
      }
      // the middle: by temperature, the hottest lowest, a return directly above its own draw
      const drawOf = (p: string) => { const m = /^(.+?) (vapour )?return$/.exec(p); return m && middle.includes(`${m[1]} draw`) ? `${m[1]} draw` : undefined; };
      const order = middle.filter(p => !drawOf(p)).sort((a, b) => tOf(b) - tOf(a)).flatMap(p => [p, ...middle.filter(r => drawOf(r) === p)]);
      order.forEach((p, k) => want.push({ p, y: lo + (order.length > 1 ? 0.2 + (0.7 * k) / (order.length - 1) : 0.5) * (hi - lo) }));
      // apart by a gate valve's reach: the generator stands a horizontal stack's stem up, so the connection above must clear the handwheel below
      want.sort((a, b) => a.y - b.y); const nz = want.map(w => ports.find(q => q.port === w.p)!), fl = nz.map(q => designFlange(q.NPS, q.cls).OD); let gap: number[] = [], y: number[] = [];
      let y0 = lo, y1 = hi;
      for (const [least, edge] of [[36, 12], [0, 12], [0, 6]]) {   // 36 in apart and 12 in from the tangent lines, where the shell is long enough for that; a short one closes them up
        y0 = up(s.yb! + edge); y1 = down(s.yt! - edge);
        gap = nz.map((q, k) => (k + 1 < nz.length ? Math.max(least, gateReach(q.NPS) + fl[k + 1] / 2 + 6) : 0)); y = [];
        want.forEach((w, k) => y.push(up(Math.max(w.y, y0, k ? y[k - 1] + gap[k - 1] : y0))));
        if (y.length && y[y.length - 1] > y1) { y[y.length - 1] = y1; for (let k = y.length - 2; k >= 0; k--) y[k] = Math.min(y[k], down(y[k + 1] - gap[k])); }
        if (!y.length || y[0] >= y0) break;
      }
      if (y.length && y[0] < y0) throw new Error(`${e.tag}: its ${y.length} shell connections need ${Math.round(gap.reduce((a, b) => a + b, 0))} in of shell and it has ${y1 - y0}`);
      want.forEach((w, k) => out.set(w.p, { A: [s.x + toRack[0] * R, y[k], s.z + toRack[2] * R], u: toRack }));
      return out;
    }
    case 'tank': {
      // a storage tank: every connection low on the shell where it faces the rack, side by side, a flange and 18 in apart (to 1 ft); each parallel to the one at the middle
      const fl = ports.map(q => designFlange(q.NPS, q.cls).OD), pitch = up(Math.max(...fl) + 18, 12), y = up(s.yb! + Math.max(24, Math.max(...fl) / 2 + 12));
      ports.forEach((q, k) => { const dx = (k - (ports.length - 1) / 2) * pitch; out.set(q.port, { A: [s.x + dx, y, s.z + toRack[2] * Math.sqrt(R * R - dx * dx)], u: toRack }); });
      return out;
    }
    case 'cabin': {
      // a cabin heater beyond the rack's end, all its connections on the wall that faces the rack: the coil enters the convection section
      // (0.4 of the box's width, above the hip) and leaves the radiant box 2 ft above its floor; fuel and waste gases to the burners under the floor
      const W = Number(z.d.W), L = Number(z.d.L), H = s.yt! - s.yb!, yConv = near(s.yt! + 60 + H / 4), gases = ports.filter(q => /gas$/.test(q.port)), coils = ports.filter(q => /^steam coil/.test(q.port));
      out.set('inlet', { A: [s.x - 0.2 * W, yConv, s.z - up(L / 4)], u: [-1, 0, 0] }); out.set('outlet', { A: [s.x - W / 2, up(s.yb! + 24), s.z + up(L / 4)], u: [-1, 0, 0] });
      gases.forEach((q, k) => out.set(q.port, { A: [s.x - W / 2, down(s.yb! - 24), s.z + (k - (gases.length - 1) / 2) * 48], u: [-1, 0, 0] }));
      coils.forEach((q, k) => out.set(q.port, { A: [s.x - 0.2 * W, yConv, s.z + up(L / 4) + (k ? 60 : 0)], u: [-1, 0, 0] }));
      return out;
    }
    default: {
      if (e.kind === 'aircooler') {   // two passes side by side in one header, on the side of the rack the inlet comes from: in on top over one pass, out through the header's outer face from the other
        const from = other('inlet'), side = from && from.z > 0 ? 1 : -1, hb = solids().filter(b => b.name === 'header box').sort((p, q) => side * (q.mn[2] - p.mn[2]))[0];
        out.set('inlet', { A: [s.x - 36, hb.mx[1], near((hb.mn[2] + hb.mx[2]) / 2)], u: [0, 1, 0] });
        out.set('outlet', { A: [s.x + 36, near((hb.mn[1] + hb.mx[1]) / 2), side > 0 ? hb.mx[2] : hb.mn[2]], u: [0, 0, side] });
        return out;
      }
      throw new Error(`${e.tag}: no nozzle rule yet for a ${e.kind}`);
    }
  }
}

/** SW-RPI-1: the unit as a plant; `lanes` gives the rack lane (z) of each battery limit line once a first run has found it */
export function unitPiping(unit: number, lanes: Map<string, number> = new Map(), longest = plotLength(PLOTS.find(q => q.unit === unit && q.kind === 'unit')!)): UnitPiping {
  // the cell the site stands on its plot (SW-SITE-7): the same room along the rack, and unit 19 without its cooling tower's group, which has a plot of its own
  const M = processModel(), sh: UnitSheet = M.sheet(unit), Z = sizing().get(unit)!, cell = buildCell(unit, longest, unit === 19 ? 'rest' : 'all'), notes: string[] = [];
  const bodies = (tag: string) => cell.spots.filter(s => s.item === tag), defs: NozzleDef[] = [], nozzles = new Map<string, Nozzle>(), lines: UnitLine[] = [], spools: BlSpool[] = [], roots: RootSpool[] = [], stations: StationSpool[] = [];
  const addNozzle = (id: string, equip: string, service: string, NPS: number, cls: PipeClass, a: Anchor, z0: number, S = nozzleStandout(NPS, cls)) => {
    const face: V3 = [a.A[0] + a.u[0] * S, a.A[1] + a.u[1] * S, a.A[2] + a.u[2] * S];
    nozzles.set(id, { id, equip, service, NPS, cls, A: a.A, u: a.u, face, S, z0 }); defs.push({ equip, id, service, NPS, cls, at: { on: 'top', dx: 0, dz: 0 } });
  };
  // ---- nozzles of the equipment (SW-RPI-2) ----
  const nozzleId = (tag: string, port: string, body = 0) => { const b = bodies(tag)[body]; if (!b) throw new Error(`${tag}: no body ${body}`); return `${b.tag}-${port === 'S' || port === 'D' ? port : `N${Z.equip.get(tag)!.nozzles.findIndex(q => q.port === port) + 1}`}`; };
  for (const e of sh.equip.values()) {
    const z = Z.equip.get(e.tag)!; if (!z.nozzles.length) continue;
    for (const [k, s] of bodies(e.tag).entries()) {
      const a = anchorsOf(s, e, z, port => { const l = sh.lines.find(q => [q.from, q.to].some(en => en.k === 'eq' && en.tag === e.tag && en.port === port)); if (!l) return undefined; const far = l.from.k === 'eq' && l.from.tag === e.tag && l.from.port === port ? l.to : l.from; return far.k === 'eq' ? bodies(far.tag)[0] : undefined; }, port => Z.utils.find(u => u.tag === e.tag && u.port === port)?.T, () => bodySolids(cell, s.tag));
      for (const q of z.nozzles) { const an = a.get(q.port); if (!an) throw new Error(`${e.tag}: no place for "${q.port}"`); addNozzle(nozzleId(e.tag, q.port, k), s.tag, q.port === 'S' ? 'suction' : q.port === 'D' ? 'discharge' : q.port, q.NPS, q.cls, an, s.z, an.S); }
    }
  }
  // ---- the line list (SW-RPI-3) ----
  const no = sh.lines.map((l, i) => lineNumber(unit, i + 1, Z.lines[i].NPS, Z.lines[i].cls, l.s.fluid));
  const tierY = (tier: number, NPS: number, cls: PipeClass) => up(RACK.tiers[tier] + 4 + pipeDims(NPS, cls).OD / 2);
  // SW-RPI-4: a battery limit end is a spool's inner nozzle; the spools are set once the lanes are known
  const pending: { tag: string; stream: string; dir: 'in' | 'out' }[] = [];
  const blEnd = (name: string, dir: 'in' | 'out'): EndRef => { const tag = `BL-${unit}${String(pending.length + 1).padStart(2, '0')}`; pending.push({ tag, stream: name, dir }); return { k: 'nozzle', id: `${tag}-U` }; };
  const endOf = (en: End, dir: 'in' | 'out'): EndRef => (en.k === 'eq' ? { k: 'nozzle', id: nozzleId(en.tag, en.port) } : en.k === 'tap' ? { k: 'tap', line: no[en.line], valve: false } : blEnd(en.name, dir));
  const offered = (NPS: number, cls: PipeClass) => NPS <= 12 && NPS * NPS * Number(cls.slice(1)) <= 1_800_000;
  // SW-RPI-9: a line with a control valve is divided at a station spool at grade under the rack; the part after the spool has a number of its own
  const stationPlans: { tag: string; ahead: UnitLine; after: UnitLine }[] = [], afterStation = new Map<number, string>();
  sh.lines.forEach((l, i) => {
    const z = Z.lines[i]; if (z.n > 1) throw new Error(`${no[i]}: ${z.n} parallel lines are not piped yet`);
    const a = endOf(l.from, 'in'), b = endOf(l.to, 'out'), service = FLUIDS[l.s.fluid].svc as Service, rest = { unit, fluid: l.s.fluid, flow: i, designP: z.designP, designT: z.designT };
    if (!l.cv || !offered(z.NPS, z.cls)) { lines.push({ def: { no: no[i], service, NPS: z.NPS, cls: z.cls, from: a, to: b, kind: 'routed' }, seq: i + 1, origin: 'process', ...rest, ...(l.cv ? { cvOmitted: true } : {}) }); return; }
    const tag = `CS-${unit}${String(stationPlans.length + 1).padStart(2, '0')}`, n = 700 + stationPlans.length + 1, later = lineNumber(unit, n, z.NPS, z.cls, l.s.fluid);
    const ahead: UnitLine = { def: { no: no[i], service, NPS: z.NPS, cls: z.cls, from: a, to: { k: 'nozzle', id: `${tag}-A` }, kind: 'routed', cv: true }, seq: i + 1, origin: 'process', station: tag, ...rest };
    const after: UnitLine = { def: { no: later, service, NPS: z.NPS, cls: z.cls, from: { k: 'nozzle', id: `${tag}-B` }, to: b, kind: 'routed' }, seq: n, origin: 'control', station: tag, ...rest };
    lines.push(ahead, after); stationPlans.push({ tag, ahead, after }); afterStation.set(i, later);
  });
  // the stations: along the rack at grade, under its edge on the destination's side, as near the destination as those already set allow
  const xBay = RACK.start - RACK.bent + 30, rootX = new Map<string, number>();
  const xAt = (r: EndRef): number | undefined => (r.k !== 'nozzle' ? undefined : r.id.startsWith('BL-') ? xBay + 84 : rootX.get(r.id) ?? nozzles.get(r.id)!.face[0]);
  {
    // the rack's braced bays, whose rods come down to the column bases, are left clear
    const braced = [...new Set(cell.interior.instances.filter(q => q.tags.includes('bracing')).flatMap(q => q.tags.map(t => /^rack-bay:(\d+)$/.exec(t)?.[1]).filter((n): n is string => !!n)))].map(n => RACK.start - RACK.bent + Number(n) * RACK.bent);
    const set: { z: number; x0: number; x1: number }[] = [], zOf = (r: EndRef) => (r.k === 'nozzle' && !r.id.startsWith('BL-') ? nozzles.get(r.id)?.face[2] : undefined);
    for (const st of stationPlans) {
      const d = st.ahead.def, plain = 12 + gateFaceToFace(d.NPS, d.cls) + 2 * d.NPS + 24, LA = Math.max(plain, 12 + 12 * d.NPS + 96), LB = plain;
      const xd = xAt(st.after.def.to) ?? xAt(d.from) ?? cell.rack.x0 + 240, xs = xAt(d.from) ?? xd, dirA: 1 | -1 = xs <= xd ? -1 : 1, left = dirA < 0 ? LA : LB, right = dirA < 0 ? LB : LA;
      const sgn = Math.sign(zOf(st.after.def.to) ?? zOf(d.from) ?? 1) || 1, lo = up(cell.rack.x0 + 24 + left), hi = down(cell.rack.x1 - 24 - right);
      let at: V3 | undefined;
      for (const inside of [36, 72, 108].filter(v => v >= gateReach(d.NPS) / 2 + RACK_COL / 2 + 6)) {   // a file far enough inside the columns' line for the valves' handwheels
        const z = sgn * (RACK.half - inside), free = (x: number) => x >= lo && x <= hi && set.every(q => q.z !== z || q.x1 + 12 <= x - left || q.x0 - 12 >= x + right) && braced.every(b => b + RACK.bent + 12 <= x - left || b - 12 >= x + right);
        for (let k = 0; k <= 80 && !at; k++) for (const x of k ? [near(xd) - 30 * k, near(xd) + 30 * k] : [Math.min(hi, Math.max(lo, near(xd)))]) if (!at && free(x)) at = [x, 36, z];
        if (at) break;
      }
      if (!at) throw new Error(`unit ${unit}: no room under the rack for the control station of ${d.no}`);
      set.push({ z: at[2], x0: at[0] - left, x1: at[0] + right });
      addNozzle(`${st.tag}-A`, st.tag, 'control station', d.NPS, d.cls, { A: at, u: [dirA, 0, 0] }, at[2], 12);
      addNozzle(`${st.tag}-B`, st.tag, 'control station outlet', d.NPS, d.cls, { A: at, u: [-dirA, 0, 0] }, at[2], 12);
      stations.push({ tag: st.tag, line: d.no, after: st.after.def.no, at });
    }
  }
  // ---- SW-RPI-8: a branch that must travel the rack starts (or ends) at a root spool on it ----
  const rootPlans: { tag: string; x: number; dir: 1 | -1; main: UnitLine; root: UnitLine; parent: string }[] = [];
  {
    const early = new Map(lines.map(l => [l.def.no, l.def]));
    // the stretch of rack a line runs along: between its nozzles; or, for one that ends at a tee, from its nozzle to the nearest point of the line it taps
    const runX = (l: LineDef, depth = 0): number[] => {
      const own = [l.from, l.to].filter(en => en.k === 'nozzle').map(en => xAt(en)!), tap = [l.from, l.to].find(en => en.k === 'tap') as Extract<EndRef, { k: 'tap' }> | undefined;
      if (!tap || depth > 4 || !early.has(tap.line)) return own;
      const far = runX(early.get(tap.line)!, depth + 1); if (!far.length) return own; if (!own.length) return far;
      return [own[0], Math.min(Math.max(own[0], Math.min(...far)), Math.max(...far))];
    };
    for (const l of [...lines]) {
      const d = l.def, side = d.from.k === 'tap' ? 'from' : d.to.k === 'tap' ? 'to' : undefined; if (!side) continue;
      const tap = d[side] as Extract<EndRef, { k: 'tap' }>, far = side === 'from' ? d.to : d.from, parent = early.get(tap.line), xe = xAt(far); if (!parent || xe === undefined) continue;
      const xs = runX(parent); if (!xs.length) continue;
      const x0 = Math.min(...xs), x1 = Math.max(...xs); if ((xe < x0 ? x0 - xe : xe > x1 ? xe - x1 : 0) <= 240) continue;
      const dir = xe > x1 ? 1 : -1, bays = Math.round((cell.rack.x1 - cell.rack.x0) / RACK.bent), x = cell.rack.x0 + (Math.min(bays - 1, Math.max(0, Math.floor(((dir > 0 ? x1 : x0) - cell.rack.x0) / RACK.bent))) + 0.5) * RACK.bent /* the middle of a bay, clear of the bents' beams */, tag = `RS-${unit}${String(rootPlans.length + 1).padStart(2, '0')}`, n = 600 + rootPlans.length + 1;
      const here: EndRef = { k: 'nozzle', id: `${tag}-A` };
      const root: UnitLine = { def: { no: lineNumber(unit, n, d.NPS, d.cls, l.fluid), service: d.service, NPS: d.NPS, cls: d.cls, from: side === 'from' ? tap : here, to: side === 'from' ? here : tap, kind: 'routed' }, unit, seq: n, fluid: l.fluid, origin: 'root', flow: l.flow, designP: l.designP, designT: l.designT };
      d[side] = { k: 'nozzle', id: `${tag}-B` };
      rootX.set(`${tag}-A`, x); rootX.set(`${tag}-B`, x); rootPlans.push({ tag, x, dir, main: l, root, parent: tap.line }); lines.push(root);
    }
  }
  // ---- utility headers (SW-RPI-5): sized here, because the top tier's lanes start with them ----
  const byFluid = new Map<string, number[]>(); Z.utils.forEach((u, i) => byFluid.set(u.fluid, [...(byFluid.get(u.fluid) ?? []), i]));
  const headers = [...byFluid].map(([fluid, idx]) => {
    const us = idx.map(i => Z.utils[i]), total = us.reduce((a, u) => a + u.w, 0), P = Math.max(...us.map(u => u.P)), T = Math.max(...us.map(u => u.T)), designP = Math.max(...us.map(u => u.designP)), designT = Math.max(...us.map(u => u.designT));
    const cls = classFor(designP, designT), NPS = Math.max(lineSize(utilState({ fluid, w: total, T, P }), false, cls, 2).NPS, ...us.map(u => u.NPS));
    return { fluid, NPS, cls, designP, designT, width: Math.max(pipeDims(NPS, cls).OD, ...us.map(u => designFlange(u.NPS, u.cls).OD + 6)), z: undefined as number | undefined };   // the lane a header takes is as wide as the largest flange on its valved take-offs, with 3 in each side for the valves' bodies (SW-RT-2, SW-RK-7)
  });
  // ---- SW-RPI-7: the tier of each line that runs the rack; then the battery limit spools in the valve bay (SW-RPI-4) ----
  const tierOf = new Map<string, number>(), top = RACK.tiers.length - 1; let tierRoom = TIER_ROOM;
  {
    const xS = xBay, xOf = xAt;
    const clampX = (x: number) => Math.min(cell.rack.x1 - 12, Math.max(cell.rack.x0 + 12, up(x)));
    // the lines the generator will run on the rack (SW-RT-1): process lines with no tap whose ends are more than 20 ft apart along it
    const onRack = lines.filter(q => q.def.service === 'P' && q.def.from.k === 'nozzle' && q.def.to.k === 'nozzle').map(l => ({ l, xa: xOf(l.def.from)!, xb: xOf(l.def.to)!, OD: pipeDims(l.def.NPS, l.def.cls).OD })).filter(v => Math.abs(v.xa - v.xb) > 240);
    const CELL = 24, nx = Math.ceil(cell.rack.x1 / CELL) + 4, order = [...onRack].sort((p, q) => q.l.def.NPS - p.l.def.NPS || Math.abs(q.xa - q.xb) - Math.abs(p.xa - p.xb));
    /** largest first, each on the lowest tier that it does not load beyond `room` at any section of its run; undefined if a line fits none */
    const share = (room: number): Map<string, number> | undefined => {
      const load = RACK.tiers.map((_, t) => new Float64Array(nx).fill(t === top ? headers.reduce((a, h) => a + h.width + 3, 0) : 0)), out = new Map<string, number>();
      for (const v of order) {
        const i0 = Math.max(0, Math.floor((Math.min(v.xa, v.xb) - 36) / CELL)), i1 = Math.min(nx - 1, Math.ceil((Math.max(v.xa, v.xb) + 36) / CELL)), w = v.OD + 3;
        const t = RACK.tiers.findIndex((_, k) => { let m = 0; for (let i = i0; i <= i1; i++) m = Math.max(m, load[k][i]); return m + w <= room; });
        if (t < 0) return undefined;
        for (let i = i0; i <= i1; i++) load[t][i] += w;
        out.set(v.l.def.no, t);
      }
      return out;
    };
    for (tierRoom = TIER_ROOM; tierRoom <= TIER_MOST; tierRoom += 12) { const m = share(tierRoom); if (m) { for (const v of onRack) { tierOf.set(v.l.def.no, m.get(v.l.def.no)!); v.l.tier = m.get(v.l.def.no)!; } break; } }
    if (onRack.length && !tierOf.size) throw new Error(`unit ${unit}: the lines that run its rack do not fit its ${RACK.tiers.length} tiers at ${TIER_MOST} in of lanes each`);
    // the lane the generator will give each (SW-RT-1/2): on each tier, largest first, each the lane nearest the rack's centre that is free over its run; the headers' lanes first on the top tier
    const taken: { t: number; z: number; OD: number; x0: number; x1: number }[] = [], laneOf = new Map<string, number>(), cands: number[] = [];
    for (let z = -(RACK.half - 24); z <= RACK.half - 24; z += 6) cands.push(z); cands.sort((p, q) => Math.abs(p) - Math.abs(q) || p - q);
    const free = (t: number, z: number, OD: number, x0: number, x1: number) => taken.every(L => L.t !== t || L.x1 < x0 - 24 || L.x0 > x1 + 24 || Math.abs(L.z - z) >= (L.OD + OD) / 2 + 3);
    for (const h of headers) { const z = cands.find(c => free(top, c, h.width, cell.rack.x0, cell.rack.x1)); if (z !== undefined) { taken.push({ t: top, z, OD: h.width, x0: cell.rack.x0, x1: cell.rack.x1 }); h.z = z; } }
    for (const v of [...onRack].sort((p, q) => q.l.def.NPS - p.l.def.NPS)) {
      const a0 = clampX(v.xa), b0 = clampX(v.xb), t = tierOf.get(v.l.def.no)!, z = cands.find(c => free(t, c, v.OD, Math.min(a0, b0) - 36, Math.max(a0, b0) + 36)); if (z === undefined) continue;
      taken.push({ t, z, OD: v.OD, x0: Math.min(a0, b0), x1: Math.max(a0, b0) }); laneOf.set(v.l.def.no, z);
    }
    // SW-RPI-8: each root spool in its branch's lane on its tier; failing a lane of its own, in the free one nearest the rack's centre
    for (const r of rootPlans) {
      const d = r.main.def, t = tierOf.get(d.no) ?? 0, f = designFlange(d.NPS, d.cls).OD, z = laneOf.get(d.no) ?? cands.find(c => free(t, c, f, r.x - 60, r.x + 60)) ?? 0, at: V3 = [r.x, tierY(t, d.NPS, d.cls), z];
      addNozzle(`${r.tag}-B`, r.tag, 'branch root', d.NPS, d.cls, { A: at, u: [r.dir, 0, 0] }, z, 12);
      addNozzle(`${r.tag}-A`, r.tag, 'branch root', d.NPS, d.cls, { A: at, u: [-r.dir, 0, 0] }, z, 12);
      taken.push({ t, z, OD: f, x0: r.x - 60, x1: r.x + 60 }); roots.push({ tag: r.tag, line: d.no, connection: r.root.def.no, parent: r.parent, at, tier: t });
    }
    // each tier's spools stand in the order of their lanes, a flange and 6 in apart, about the rack's centre line; a line with no lane of its own stands outside them
    for (const t of RACK.tiers.keys()) {
      // the line that ends at each spool: the flowsheet's, or the part of it after its control station
      const lineAt = (tag: string) => lines.find(l => [l.def.from, l.def.to].some(en => en.k === 'nozzle' && en.id === `${tag}-U`))!.def;
      const want = pending.map(q => ({ p: q, d: lineAt(q.tag) })).filter(q => (tierOf.get(q.d.no) ?? 0) === t).map(q => ({ ...q, lane: lanes.get(q.d.no) ?? laneOf.get(q.d.no), f: designFlange(q.d.NPS, q.d.cls).OD })); if (!want.length) continue;
      const row = [...want.filter(w => w.lane !== undefined).sort((p, q) => p.lane! - q.lane!)]; want.filter(w => w.lane === undefined).forEach((w, k) => (k % 2 ? row.unshift(w) : row.push(w)));
      // one row where they fit the rack's width; otherwise two, taken in turn, the second beyond the bay's mid beam: a spool's line then passes
      // between the valves of the other row, a pipe's width from a flange
      const od = (w: typeof row[number]) => pipeDims(w.d.NPS, w.d.cls).OD, room = 2 * (RACK.half - 18);
      const lay = (two: boolean) => { const pos: number[] = []; row.forEach((w, k) => { if (!k) { pos.push(0); return; } const a = row[k - 1], near1 = two ? Math.max(od(a) + w.f, a.f + od(w)) / 2 + 4 : (a.f + w.f) / 2 + 6, same = two && k > 1 ? pos[k - 2] + (row[k - 2].f + w.f) / 2 + 6 - pos[k - 1] : 0; pos.push(pos[k - 1] + up(Math.max(near1, same))); }); return pos; };
      let two = false, pos = lay(false); if (pos[pos.length - 1] - pos[0] + (row[0].f + row[row.length - 1].f) / 2 > room) { two = true; pos = lay(true); }
      const shift = near((pos[0] + pos[pos.length - 1]) / 2);
      row.forEach((w, k) => {
        const zl = w.d, zs = pos[k] - shift, at: V3 = [two && k % 2 ? RACK.start - RACK.bent / 2 : xS, tierY(t, zl.NPS, zl.cls), zs];
        if (Math.abs(zs) + w.f / 2 > RACK.half - 12) throw new Error(`unit ${unit}: the battery limit spools of tier ${t + 1} do not fit the rack's width (${Math.round(pos[pos.length - 1] - pos[0])} in in ${two ? 'two rows' : 'one row'})`);
        addNozzle(`${w.p.tag}-U`, w.p.tag, w.p.dir === 'in' ? 'battery limit in' : 'battery limit out', zl.NPS, zl.cls, { A: at, u: [1, 0, 0] }, zs, 12);
        addNozzle(`${w.p.tag}-P`, w.p.tag, 'pipeway side', zl.NPS, zl.cls, { A: at, u: [-1, 0, 0] }, zs, 12);
        spools.push({ tag: w.p.tag, stream: w.p.stream, dir: w.p.dir, line: zl.no, NPS: zl.NPS, cls: zl.cls, at, tier: t, ...(w.lane !== undefined ? { lane: w.lane } : {}) });
      });
    }
  }
  // installed spares and parallel bodies join the first body's lines with tees (SW-LL-3)
  let seq = 300;
  sh.lines.forEach((l, i) => {
    const z = Z.lines[i];
    for (const [en, into] of [[l.to, true], [l.from, false]] as const) {
      if (en.k !== 'eq') continue;
      for (let b = 1; b < bodies(en.tag).length; b++) {
        const nz: EndRef = { k: 'nozzle', id: nozzleId(en.tag, en.port, b) }, tap: EndRef = { k: 'tap', line: into ? afterStation.get(i) ?? no[i] : no[i], valve: false }, n = ++seq;   // SW-RPI-9: at the destination, the part after the station
        lines.push({ def: { no: lineNumber(unit, n, z.NPS, z.cls, l.s.fluid), service: FLUIDS[l.s.fluid].svc as Service, NPS: z.NPS, cls: z.cls, from: into ? tap : nz, to: into ? nz : tap, kind: 'routed' }, unit, seq: n, fluid: l.s.fluid, origin: 'spare', flow: i, designP: z.designP, designT: z.designT });
      }
    }
  });
  // ---- utility headers on the rack's top tier and the connections that tap them (SW-RPI-5) ----
  let hSeq = 400; const header = new Map<string, string>(), headerLanes: HeaderLane[] = [];
  for (const h of headers) {
    const n = ++hSeq, hno = lineNumber(unit, n, h.NPS, h.cls, h.fluid);
    header.set(h.fluid, hno); headerLanes.push({ line: hno, z: h.z });
    lines.push({ def: { no: hno, service: FLUIDS[h.fluid].svc as Service, NPS: h.NPS, cls: h.cls, from: { k: 'blind' }, to: { k: 'blind' }, kind: 'header' }, unit, seq: n, fluid: h.fluid, origin: 'header', designP: h.designP, designT: h.designT });
  }
  Z.utils.forEach((u, i) => {
    const nz: EndRef = { k: 'nozzle', id: nozzleId(u.tag, u.port) }, tap: EndRef = { k: 'tap', line: header.get(u.fluid)!, valve: true }, n = 500 + i + 1;
    lines.push({ def: { no: lineNumber(unit, n, u.NPS, u.cls, u.fluid), service: FLUIDS[u.fluid].svc as Service, NPS: u.NPS, cls: u.cls, from: u.dir === 'to' ? tap : nz, to: u.dir === 'to' ? nz : tap, kind: 'routed' }, unit, seq: n, fluid: u.fluid, origin: 'utility', util: i, designP: u.designP, designT: u.designT });
  });
  void designPressure; void designTemperature;

  // ---- before the generator runs: no two nozzles' valve stacks may stand in each other's way (SW-RPI-2) ----
  { const all = [...nozzles.values()].filter(q => q.service !== 'pipeway side'), env = (q: Nozzle) => { const f = designFlange(q.NPS, q.cls); return { a: q.face, b: [q.face[0] + q.u[0] * (gateFaceToFace(q.NPS, q.cls) + 12), q.face[1] + q.u[1] * (gateFaceToFace(q.NPS, q.cls) + 12), q.face[2] + q.u[2] * (gateFaceToFace(q.NPS, q.cls) + 12)] as V3, r: f.OD / 2 }; };
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) { const p = env(all[i]), q = env(all[j]), d = segDist(p.a, p.b, q.a, q.b); if (d < p.r + q.r + 1) notes.push(`nozzles ${all[i].id} and ${all[j].id} stand ${d.toFixed(1)} in apart, their flanges need ${(p.r + q.r + 1).toFixed(1)}`); } }
  const list = lines.map(l => l.def), byNo = new Map(list.map(l => [l.no, l]));
  const building: BuildingModel = { instances: [], derived: {}, notes: [] } as unknown as BuildingModel;
  // ---- SW-RPI-6: where lines may travel. The generator is shown solid blocks (not part of the model) that leave open only where
  // there is steel to carry a pipe: from 9 ft above the top tier upward, everywhere but within 12 ft of a body that has a connection
  // up there; and beyond the yard's support beams, above them ----
  const limit = RACK.tiers[RACK.tiers.length - 1] + 108, gridTop = up(Math.max(cell.y1 + 120, limit + 96, ...[...nozzles.values()].filter(q => q.u[1] > 0).map(q => q.face[1] + valveDrop(q.NPS, q.cls) + 72))),   // room above the highest connection for its valve and the turn after it
     G = { x0: 0, x1: up(cell.x1 + 60), z0: down(cell.z0 - 60), z1: up(cell.z1 + 60) };
  const tall = new Set([...nozzles.values()].filter(q => q.face[1] > limit - 60).map(q => q.equip)), reach = new Map<string, number>(), reaches = (tag: string, y: number) => reach.set(tag, Math.max(reach.get(tag) ?? 0, y));
  // how high each such body's lines need room: over an upward connection its valve and the turn after it, beside any other a handwheel, and 6 ft
  for (const q of nozzles.values()) if (q.face[1] > limit - 60) reaches(q.equip, q.face[1] + (q.u[1] > 0 ? valveDrop(q.NPS, q.cls) : gateReach(q.NPS)) + 72);
  type Rect = { x0: number; x1: number; z0: number; z1: number };
  // the room such a body's lines need: for a vertical vessel a chase on the side that faces the rack, 2 ft wider than the shell on either hand and
  // 10 ft beyond it (its lines stand on that side and come down there); for any other body, 6 ft all round
  const roomOf = (sp: Spot): Rect => {
    if (sp.shape === 'vv') { const R = sp.R ?? 0, back = sp.z + sp.side * (R + 12), front = sp.z - sp.side * (R + 120); return { x0: sp.x - R - 24, x1: sp.x + R + 24, z0: Math.min(back, front), z1: Math.max(back, front) }; }
    return { x0: sp.x - sp.lx / 2 - 72, x1: sp.x + sp.lx / 2 + 72, z0: sp.z - sp.lz / 2 - 72, z1: sp.z + sp.lz / 2 + 72 };
  };
  const keepOut: Placed[] = [];
  /** blocks filling a region of the plan between two elevations, less the holes */
  const fill = (region: Rect, y0: number, y1: number, holes: Rect[]) => {
    const xs = [...new Set([region.x0, region.x1, ...holes.flatMap(h => [h.x0, h.x1])].map(v => Math.min(region.x1, Math.max(region.x0, v))))].sort((p, q) => p - q);
    for (let i = 0; i < xs.length - 1; i++) {
      const xa = xs[i], xb = xs[i + 1], cut = holes.filter(h => h.x0 < xb && h.x1 > xa).map(h => [h.z0, h.z1] as [number, number]).sort((p, q) => p[0] - q[0]); let z = region.z0;
      const slab = (za: number, zb: number) => { if (zb - za > 1 && xb - xa > 1) keepOut.push(block([xa, y0, za], [xb, y1, zb])); };
      for (const [za, zb] of cut) { slab(z, Math.min(za, region.z1)); z = Math.max(z, zb); } slab(z, region.z1);
    }
  };
  const rooms = cell.spots.filter(sp => tall.has(sp.tag)).map(sp => ({ rect: roomOf(sp), top: up(Math.max(limit + 6, reach.get(sp.tag) ?? 0)) })), tallHoles = rooms.map(r => r.rect);
  // each body's room reaches as high as its own lines need and no higher: above an air cooler's connections the space is closed again, so a column's overhead line cannot wander out over it
  { const levels = [...new Set([limit, ...rooms.map(r => Math.min(r.top, gridTop + 12)), gridTop + 12])].sort((a, b) => a - b);
    for (let i = 0; i + 1 < levels.length; i++) fill(G, levels[i], levels[i + 1], rooms.filter(r => r.top > levels[i]).map(r => r.rect)); }
  // beyond the yard's support beams nothing travels above them: every line crossing between equipment and rack passes under a beam, and hangs from it (SW-CELL-6)
  if (cell.yard.neg !== undefined) fill({ ...G, z1: cell.yard.neg + 12 }, YARD + 18, limit, tallHoles);
  if (cell.yard.pos !== undefined) fill({ ...G, z0: cell.yard.pos - 12 }, YARD + 18, limit, tallHoles);
  const shown = { ...cell.interior, instances: [...cell.interior.instances, ...keepOut] };
  const plant: PlantDef = {
    id: `R${unit}`, name: `SmartWeld coastal refinery (plant 3), unit ${unit}: ${sh.name}`,
    building: () => building, interior: () => shown, nozzles: () => nozzles, nozzleDefs: () => defs, lines: () => list, rack: cell.rack,
    grid: { x0: G.x0, x1: G.x1, y1: gridTop, z0: G.z0, z1: G.z1 },
    joint: l => jointBySpec(lineGroup(l, byNo), l.NPS), flangeType: l => flangeBySpec(lineGroup(l, byNo), l.NPS, l.cls), verticalThroughPlatforms: true,
    areas: { [`U${unit}`]: { name: sh.name, equipment: cell.spots.map(s => s.tag) } }, pilot: [],
    paths: { piping: `public/refinery/piping/unit-${unit}.json`, groundtruth: `public/refinery/groundtruth/unit-${unit}`, answerKey: `eval/refinery/answer-key-unit-${unit}.json`, designer: `downloads/refinery/unit-${unit}` },
  };
  // ---- SW-RPI-7: one run of the generator for each tier in use ----
  const tiers = [...new Set(tierOf.values())].sort((a, b) => a - b); if (!tiers.length) tiers.push(0);
  const passOf = new Map<string, number>(), last = tiers.length - 1;
  const passFor = (l: LineDef, depth = 0): number => {
    const known = passOf.get(l.no); if (known !== undefined) return known;
    const t = tierOf.get(l.no), tap = [l.from, l.to].find(e => e.k === 'tap') as Extract<EndRef, { k: 'tap' }> | undefined, parent = tap && byNo.get(tap.line);
    const v = t !== undefined ? tiers.indexOf(t) : parent && depth < 8 ? passFor(parent, depth + 1) : last;   // a branch goes with the line it taps; headers, take-offs and lines that do not run the rack go last
    passOf.set(l.no, v); return v;
  };
  for (const l of list) passFor(l);
  /** the room a later run's line will need for the first valves at one of its nozzles */
  const reserve = (l: UnitLine, id: string, dest: boolean): Placed => {
    const q = nozzles.get(id)!, f = designFlange(q.NPS, q.cls).OD / 2, base = gateFaceToFace(q.NPS, q.cls) + 2 * q.NPS + 24, L = q.S + (l.def.cv && dest ? Math.max(base, 12 * q.NPS + 96) : q.service === 'discharge' ? 2 * base : base);
    const a = q.A, b: V3 = [a[0] + q.u[0] * L, a[1] + q.u[1] * L, a[2] + q.u[2] * L], w = (k: number) => (q.u[k] ? 0 : f);
    return block([Math.min(a[0], b[0]) - w(0), Math.min(a[1], b[1]) - w(1), Math.min(a[2], b[2]) - w(2)], [Math.max(a[0], b[0]) + w(0), Math.max(a[1], b[1]) + w(1), Math.max(a[2], b[2]) + w(2)], 'room for valves');
  };
  const passPlant = (pass: number, prior: Placed[]): PlantDef => {
    const held = lines.filter(l => passOf.get(l.def.no)! > pass).flatMap(l => [[l.def.from, false] as const, [l.def.to, true] as const].filter(([e]) => e.k === 'nozzle').map(([e, dest]) => reserve(l, (e as Extract<EndRef, { k: 'nozzle' }>).id, dest)));
    // the headers are routed in the last run, in lanes the generator gives without looking: in the runs before it their lanes are held, with room above for their valved take-offs
    const lanesHeld = pass < last ? headers.filter(h => h.z !== undefined).map(h => { const y = tierY(top, h.NPS, h.cls), r = pipeDims(h.NPS, h.cls).OD / 2; return block([cell.rack.x0 + 12, y - r, h.z! - h.width / 2], [cell.rack.x1 - 12, y + r + 48, h.z! + h.width / 2], 'header lane'); }) : [];
    const inst = [...shown.instances, ...held, ...lanesHeld, ...prior];
    return { ...plant, rack: { ...cell.rack, tiers: cell.rack.tiers.slice(tiers[pass]) }, interior: () => ({ ...shown, instances: inst }) };
  };
  return { unit, cell, plant, lines, nozzles, spools, roots, stations, headers: headerLanes, notes, tierRoom, tiers, passOf, passPlant };
}
