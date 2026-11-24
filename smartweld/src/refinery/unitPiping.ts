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
import { buildCell, RACK, YARD, type CellModel, type Spot } from './cell';
import { lineNumber } from './registry';

export type V3 = [number, number, number];
const SUFFIX = 'ABCDEFGH', near = (v: number, s = 6) => Math.round(v / s) * s, up = (v: number, s = 6) => Math.ceil(v / s - 1e-9) * s, down = (v: number, s = 6) => Math.floor(v / s + 1e-9) * s;

/** what a generated line carries, kept beside the generator's own record (SW-RPI-3) */
export interface UnitLine {
  def: LineDef; unit: number; seq: number; fluid: string; origin: 'process' | 'spare' | 'utility' | 'header'; /** the flowsheet line it is, or branches from */ flow?: number; /** the utility connection it is */ util?: number;
  designP: number; designT: number; /** a control valve the flowsheet asks for that is not piped: the catalogue does not offer its size, or neither end can take a station */ cvOmitted?: boolean; /** given to the generator end for end, so that the control valve station stands at the lower end; the flowsheet's direction is `flow` */ reversed?: boolean;
}
/** a battery limit spool: two nozzles back to back on a lane of the rack (SW-RPI-4) */
export interface BlSpool { tag: string; stream: string; dir: 'in' | 'out'; line: string; NPS: number; cls: PipeClass; at: V3; /** the rack lane its line is expected to run in */ lane?: number }
export interface UnitPiping { unit: number; cell: CellModel; plant: PlantDef; lines: UnitLine[]; nozzles: Map<string, Nozzle>; spools: BlSpool[]; notes: string[] }

/** how far a gate valve's handwheel stands from the pipe's axis: an upper bound on the catalogue's gate valves (SW-VLV-*), which a test checks */
export const gateReach = (NPS: number) => 4 * NPS + 8;
/** the shortest distance between two segments, by sampling (enough for a clearance check on the grid) */
function segDist(a: V3, b: V3, c: V3, d: V3): number {
  let best = Infinity;
  for (let i = 0; i <= 12; i++) for (let j = 0; j <= 12; j++) { const s = i / 12, t = j / 12, v = Math.hypot(a[0] + (b[0] - a[0]) * s - c[0] - (d[0] - c[0]) * t, a[1] + (b[1] - a[1]) * s - c[1] - (d[1] - c[1]) * t, a[2] + (b[2] - a[2]) * s - c[2] - (d[2] - c[2]) * t); if (v < best) best = v; }
  return best;
}
interface Anchor { A: V3; u: V3; /** a standout other than SW-NOZ-1's */ S?: number }
/** the first elevation at or above e, on the grid, clear of every platform's band (SW-RPI-2) */
function clearOfFloors(e: number, floors: number[] | undefined, step = 6): number {
  let y = up(e); for (let k = 0; k < 40; k++) { const f = floors?.find(q => y > q - 18 && y < q + 54); if (f === undefined) return y; y = step > 0 ? up(f + 54) : down(f - 18); }
  return y;
}

/** SW-RPI-2: where each connection of an item stands on one of its bodies */
function anchorsOf(s: Spot, e: Equip, z: EquipSize, other: (port: string) => Spot | undefined): Map<string, Anchor> {
  const pumpX = (port: string) => { const o = other(port); return o && o.kind === 'pump' ? o.x : undefined; };
  const out = new Map<string, Anchor>(), R = s.R ?? 0, toRack: V3 = [0, 0, -s.side], ports = z.nozzles;
  const od = (port: string) => { const n = ports.find(q => q.port === port)!; return designFlange(n.NPS, n.cls).OD; };
  switch (s.shape) {
    case 'pump': out.set('S', { A: [s.x, s.yc!, s.zs!], u: toRack }); out.set('D', { A: [s.x, s.yc! + R, s.zc!], u: [0, 1, 0] }); return out;
    case 'machine': out.set('inlet', { A: [s.x, s.yc!, s.zs!], u: toRack }); out.set('outlet', { A: [s.x, s.yc! + R, s.zc!], u: [0, 1, 0] }); return out;   // as a pump: suction on the shaft's line at the casing's free end, facing the rack; discharge on top
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
        return out;
      }
      const H = s.yt! - s.yb!, shell = (y: number, u: V3): Anchor => ({ A: [s.x + u[0] * R, y, s.z + u[2] * R], u }), used: { y: number; NPS: number; f: number }[] = [];
      // apart by a gate valve's reach: the generator stands a horizontal stack's stem up, so the connection above must clear the handwheel below
      const at = (y: number, q: { NPS: number; cls: PipeClass }, dir = 1) => { const f = designFlange(q.NPS, q.cls).OD, need = (lo: { NPS: number; f: number }, hi: { f: number }) => Math.max(36, gateReach(lo.NPS) + hi.f / 2 + 6);
        let v = clearOfFloors(Math.min(Math.max(y, s.yb! + 12), s.yt! - 12), s.floors, dir);
        for (let k = 0; k < 400 && used.some(u => (u.y <= v ? v - u.y < need(u, { f }) : u.y - v < need({ NPS: q.NPS, f }, u))); k++) v = clearOfFloors(v + dir * 6, s.floors, dir);
        used.push({ y: v, NPS: q.NPS, f }); return shell(v, toRack); };
      let topUsed = false; const frac: [string, number][] = [];
      for (const q of ports) {
        const p = q.port;
        if (!topUsed && ((e.kind === 'reactor' && p === 'inlet') || (q.dir === 'out' && /^(overhead|vapour|gas|gas out|treated gas|net gas|recycle gas|acid gas|vent|hydrogen)$/.test(p)))) { out.set(p, { A: [s.x, s.yt! + R / 2, s.z], u: [0, 1, 0], ...(s.floors ? { S: Math.max(nozzleStandout(q.NPS, q.cls), s.floors[s.floors.length - 1] + 54 - (s.yt! + R / 2)) } : {}) }); topUsed = true; continue; }
        const f = /bottoms|rich amine|rich oil|^liquid$|^outlet$| out$|^water$|^oil$/.test(p) && q.dir === 'out' ? 0 : /reboiler draw/.test(p) ? 0.03 : /stripping steam|gas in/.test(p) ? 0.07 : /reboiler return/.test(p) ? 0.12
          : /reflux|lean amine|lean oil|quench return|^inlet$/.test(p) ? 0.97 : /feed|flash vapour| in$/.test(p) ? 0.5 : -1;
        frac.push([p, f]);
      }
      const rest = frac.filter(([, f]) => f < 0); rest.forEach((r, i) => { r[1] = 0.85 - (0.6 * i) / Math.max(1, rest.length - 1 || 1); });   // draws and returns down the column in the order the flowsheet meets them
      for (const [p, f] of frac.sort((a, b) => a[1] - b[1])) out.set(p, at(s.yb! + 12 + f * (H - 24), ports.find(q => q.port === p)!, f > 0.5 ? -1 : 1));
      return out;
    }
    default: {
      if (e.kind === 'aircooler') {   // both connections on top of one header, over the two halves of the bundle: the header on the side of the rack its inlet comes from
        const from = other('inlet'), side = from && from.z > 0 ? 1 : -1, zh = side * (384 / 2 + 6);
        out.set('inlet', { A: [s.x - 36, s.yt!, zh], u: [0, 1, 0] }); out.set('outlet', { A: [s.x + 36, s.yt!, zh], u: [0, 1, 0] });
        return out;
      }
      throw new Error(`${e.tag}: no nozzle rule yet for a ${e.kind}`);
    }
  }
}

/** SW-RPI-1: the unit as a plant; `lanes` gives the rack lane (z) of each battery limit line once a first run has found it */
export function unitPiping(unit: number, lanes: Map<string, number> = new Map(), longest?: number): UnitPiping {
  const M = processModel(), sh: UnitSheet = M.sheet(unit), Z = sizing().get(unit)!, cell = buildCell(unit, longest), notes: string[] = [];
  const bodies = (tag: string) => cell.spots.filter(s => s.item === tag), defs: NozzleDef[] = [], nozzles = new Map<string, Nozzle>(), lines: UnitLine[] = [], spools: BlSpool[] = [];
  const addNozzle = (id: string, equip: string, service: string, NPS: number, cls: PipeClass, a: Anchor, z0: number, S = nozzleStandout(NPS, cls)) => {
    const face: V3 = [a.A[0] + a.u[0] * S, a.A[1] + a.u[1] * S, a.A[2] + a.u[2] * S];
    nozzles.set(id, { id, equip, service, NPS, cls, A: a.A, u: a.u, face, S, z0 }); defs.push({ equip, id, service, NPS, cls, at: { on: 'top', dx: 0, dz: 0 } });
  };
  // ---- nozzles of the equipment (SW-RPI-2) ----
  const nozzleId = (tag: string, port: string, body = 0) => { const b = bodies(tag)[body]; if (!b) throw new Error(`${tag}: no body ${body}`); return `${b.tag}-${port === 'S' || port === 'D' ? port : `N${Z.equip.get(tag)!.nozzles.findIndex(q => q.port === port) + 1}`}`; };
  for (const e of sh.equip.values()) {
    const z = Z.equip.get(e.tag)!; if (!z.nozzles.length) continue;
    for (const [k, s] of bodies(e.tag).entries()) {
      const a = anchorsOf(s, e, z, port => { const l = sh.lines.find(q => [q.from, q.to].some(en => en.k === 'eq' && en.tag === e.tag && en.port === port)); if (!l) return undefined; const far = l.from.k === 'eq' && l.from.tag === e.tag && l.from.port === port ? l.to : l.from; return far.k === 'eq' ? bodies(far.tag)[0] : undefined; });
      for (const q of z.nozzles) { const an = a.get(q.port); if (!an) throw new Error(`${e.tag}: no place for "${q.port}"`); addNozzle(nozzleId(e.tag, q.port, k), s.tag, q.port === 'S' ? 'suction' : q.port === 'D' ? 'discharge' : q.port, q.NPS, q.cls, an, s.z, an.S); }
    }
  }
  // ---- the line list (SW-RPI-3) ----
  const no = sh.lines.map((l, i) => lineNumber(unit, i + 1, Z.lines[i].NPS, Z.lines[i].cls, l.s.fluid)), tier0 = RACK.tiers[0];
  const tierY = (NPS: number, cls: PipeClass) => up(tier0 + 4 + pipeDims(NPS, cls).OD / 2);
  // SW-RPI-4: a battery limit end is a spool's inner nozzle; the spools are set once the lanes are known
  const pending: { tag: string; stream: string; dir: 'in' | 'out'; i: number }[] = [];
  const blEnd = (name: string, dir: 'in' | 'out', i: number): EndRef => { const tag = `BL-${unit}${String(pending.length + 1).padStart(2, '0')}`; pending.push({ tag, stream: name, dir, i }); return { k: 'nozzle', id: `${tag}-U` }; };
  const endOf = (en: End, dir: 'in' | 'out', i: number): EndRef => (en.k === 'eq' ? { k: 'nozzle', id: nozzleId(en.tag, en.port) } : en.k === 'tap' ? { k: 'tap', line: no[en.line], valve: false } : blEnd(en.name, dir, i));
  const offered = (NPS: number, cls: PipeClass) => NPS <= 12 && NPS * NPS * Number(cls.slice(1)) <= 1_800_000;
  sh.lines.forEach((l, i) => {
    const z = Z.lines[i]; if (z.n > 1) throw new Error(`${no[i]}: ${z.n} parallel lines are not piped yet`);
    const a = endOf(l.from, 'in', i), b = endOf(l.to, 'out', i);
    // SW-RPI-3: the generator stands a control valve station at the line's destination, along that nozzle's axis. It is given as
    // destination the lower of the ends that can take one (an item's nozzle that does not point down and is not a pump's); failing
    // that, a battery limit spool; failing that the valve is left out. The flowsheet's direction is kept here.
    const seat = (en: End, r: EndRef) => (en.k === 'eq' && r.k === 'nozzle' && sh.equip.get(en.tag)!.kind !== 'pump' && nozzles.get(r.id)!.u[1] >= 0 ? nozzles.get(r.id)!.face[1] : en.k === 'bl' && z.NPS <= 2 ? 1e6 : Infinity);
    const sa = seat(l.from, a), sb = seat(l.to, b), cv = l.cv && offered(z.NPS, z.cls) && Math.min(sa, sb) < Infinity, reversed = cv && sa < sb;
    lines.push({ def: { no: no[i], service: FLUIDS[l.s.fluid].svc as Service, NPS: z.NPS, cls: z.cls, from: reversed ? b : a, to: reversed ? a : b, kind: 'routed', cv }, unit, seq: i + 1, fluid: l.s.fluid, origin: 'process', flow: i, designP: z.designP, designT: z.designT,
      ...(reversed ? { reversed: true } : {}), ...(l.cv && !cv ? { cvOmitted: true } : {}) });
  });
  // ---- battery limit spools in the valve bay (SW-RPI-4) ----
  {
    // the lane the generator will give each line that runs the rack (SW-RT-1/2): process lines with no tap whose ends are more than 20 ft
    // apart along it, largest first, each taking the lane nearest the rack's centre that is free over its run
    const xS = RACK.start - RACK.bent + 30, xOf = (r: EndRef) => (r.k !== 'nozzle' ? undefined : r.id.startsWith('BL-') ? xS + 84 : nozzles.get(r.id)!.face[0]);
    const clampX = (x: number) => Math.min(cell.rack.x1 - 12, Math.max(cell.rack.x0 + 12, up(x)));
    const taken: { z: number; OD: number; x0: number; x1: number }[] = [], laneOf = new Map<string, number>(), cands: number[] = [];
    for (let z = -(RACK.half - 24); z <= RACK.half - 24; z += 6) cands.push(z); cands.sort((p, q) => Math.abs(p) - Math.abs(q) || p - q);
    const free = (z: number, OD: number, x0: number, x1: number) => taken.every(L => L.x1 < x0 - 24 || L.x0 > x1 + 24 || Math.abs(L.z - z) >= (L.OD + OD) / 2 + 3);
    for (const l of lines.filter(q => q.def.service === 'P' && q.def.from.k === 'nozzle' && q.def.to.k === 'nozzle').sort((p, q) => q.def.NPS - p.def.NPS)) {
      const xa = xOf(l.def.from)!, xb = xOf(l.def.to)!; if (Math.abs(xa - xb) <= 240) continue;
      const a0 = clampX(xa), b0 = clampX(xb), OD = pipeDims(l.def.NPS, l.def.cls).OD, z = cands.find(c => free(c, OD, Math.min(a0, b0) - 36, Math.max(a0, b0) + 36)); if (z === undefined) continue;
      taken.push({ z, OD, x0: Math.min(a0, b0), x1: Math.max(a0, b0) }); laneOf.set(l.def.no, z);
    }
    // the spools stand in the order of their lanes, a flange and 6 in apart, about the rack's centre line; a line with no lane of its own stands outside them
    const want = pending.map(p => ({ p, lane: lanes.get(no[p.i]) ?? laneOf.get(no[p.i]), f: designFlange(Z.lines[p.i].NPS, Z.lines[p.i].cls).OD }));
    const row = [...want.filter(w => w.lane !== undefined).sort((p, q) => p.lane! - q.lane!)]; want.filter(w => w.lane === undefined).forEach((w, k) => (k % 2 ? row.unshift(w) : row.push(w)));
    const pos: number[] = []; row.forEach((w, k) => pos.push(k ? pos[k - 1] + up((row[k - 1].f + w.f) / 2 + 6) : 0)); const shift = near((pos[0] + (pos[pos.length - 1] ?? 0)) / 2);
    row.forEach((w, k) => {
      // a spool whose line ends in a control valve station stands 54 in further in, so that the station's 18 in spacer, and no flange, lies over the bay's mid beam
      const zl = Z.lines[w.p.i], zs = pos[k] - shift, y = tierY(zl.NPS, zl.cls), def = lines.find(q => q.def.no === no[w.p.i])!.def, station = !!def.cv && def.to.k === 'nozzle' && def.to.id === `${w.p.tag}-U`, at: V3 = [xS + (station || zl.NPS <= 2 ? 54 : 0), y, zs];
      if (Math.abs(zs) + w.f / 2 > RACK.half - 12) throw new Error(`unit ${unit}: the battery limit spools do not fit the rack's width`);
      addNozzle(`${w.p.tag}-U`, w.p.tag, w.p.dir === 'in' ? 'battery limit in' : 'battery limit out', zl.NPS, zl.cls, { A: at, u: [1, 0, 0] }, zs, 12);
      addNozzle(`${w.p.tag}-P`, w.p.tag, 'pipeway side', zl.NPS, zl.cls, { A: at, u: [-1, 0, 0] }, zs, 12);
      spools.push({ tag: w.p.tag, stream: w.p.stream, dir: w.p.dir, line: no[w.p.i], NPS: zl.NPS, cls: zl.cls, at, ...(w.lane !== undefined ? { lane: w.lane } : {}) });
    });
  }
  // installed spares and parallel bodies join the first body's lines with tees (SW-LL-3)
  let seq = 300;
  sh.lines.forEach((l, i) => {
    const z = Z.lines[i];
    for (const [en, into] of [[l.to, true], [l.from, false]] as const) {
      if (en.k !== 'eq') continue;
      for (let b = 1; b < bodies(en.tag).length; b++) {
        const nz: EndRef = { k: 'nozzle', id: nozzleId(en.tag, en.port, b) }, tap: EndRef = { k: 'tap', line: no[i], valve: false }, n = ++seq;
        lines.push({ def: { no: lineNumber(unit, n, z.NPS, z.cls, l.s.fluid), service: FLUIDS[l.s.fluid].svc as Service, NPS: z.NPS, cls: z.cls, from: into ? tap : nz, to: into ? nz : tap, kind: 'routed' }, unit, seq: n, fluid: l.s.fluid, origin: 'spare', flow: i, designP: z.designP, designT: z.designT });
      }
    }
  });
  // ---- utility headers on the rack's top tier and the connections that tap them (SW-RPI-5) ----
  const byFluid = new Map<string, number[]>(); Z.utils.forEach((u, i) => byFluid.set(u.fluid, [...(byFluid.get(u.fluid) ?? []), i]));
  let hSeq = 400; const header = new Map<string, string>();
  for (const [fluid, idx] of byFluid) {
    const us = idx.map(i => Z.utils[i]), total = us.reduce((a, u) => a + u.w, 0), P = Math.max(...us.map(u => u.P)), T = Math.max(...us.map(u => u.T)), designP = Math.max(...us.map(u => u.designP)), designT = Math.max(...us.map(u => u.designT));
    const cls = classFor(designP, designT), NPS = Math.max(lineSize(utilState({ fluid, w: total, T, P }), false, cls, 2).NPS, ...us.map(u => u.NPS)), n = ++hSeq, hno = lineNumber(unit, n, NPS, cls, fluid);
    header.set(fluid, hno);
    lines.push({ def: { no: hno, service: FLUIDS[fluid].svc as Service, NPS, cls, from: { k: 'blind' }, to: { k: 'blind' }, kind: 'header' }, unit, seq: n, fluid, origin: 'header', designP, designT });
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
  const limit = RACK.tiers[RACK.tiers.length - 1] + 108, gridTop = up(Math.max(cell.y1 + 120, limit + 96)), G = { x0: 0, x1: up(cell.x1 + 60), z0: down(cell.z0 - 60), z1: up(cell.z1 + 60) };
  const tall = new Set([...nozzles.values()].filter(q => q.face[1] > limit - 60).map(q => q.equip));
  type Rect = { x0: number; x1: number; z0: number; z1: number };
  const around = (sp: Spot, m: number): Rect => { const hx = (sp.shape === 'vv' ? (sp.R ?? 0) + (sp.floors ? 48 : 0) : sp.lx / 2) + m, hz = (sp.shape === 'vv' ? (sp.R ?? 0) + (sp.floors ? 48 : 0) : sp.lz / 2) + m; return { x0: sp.x - hx, x1: sp.x + hx, z0: sp.z - hz, z1: sp.z + hz }; };
  const keepOut: Placed[] = [], kit = interiorKit({ pedestal: 6, padHeight: 6 }, [], {});
  /** blocks filling a region of the plan between two elevations, less the holes */
  const fill = (region: Rect, y0: number, y1: number, holes: Rect[]) => {
    const xs = [...new Set([region.x0, region.x1, ...holes.flatMap(h => [h.x0, h.x1])].map(v => Math.min(region.x1, Math.max(region.x0, v))))].sort((p, q) => p - q);
    for (let i = 0; i < xs.length - 1; i++) {
      const xa = xs[i], xb = xs[i + 1], cut = holes.filter(h => h.x0 < xb && h.x1 > xa).map(h => [h.z0, h.z1] as [number, number]).sort((p, q) => p[0] - q[0]); let z = region.z0;
      const slab = (za: number, zb: number) => { if (zb - za > 1 && xb - xa > 1) keepOut.push({ part: kit.concrete('keep-out', zb - za, y1 - y0, xb - xa), transform: frameFromAxes([xa, (y0 + y1) / 2, (za + zb) / 2], [0, 1, 0], [1, 0, 0]), tags: ['keep-out', 'cladding'] }); };   // tagged so that no hanger hangs from one
      for (const [za, zb] of cut) { slab(z, Math.min(za, region.z1)); z = Math.max(z, zb); } slab(z, region.z1);
    }
  };
  const tallHoles = cell.spots.filter(sp => tall.has(sp.tag)).map(sp => around(sp, 144));
  fill(G, limit, gridTop + 12, tallHoles);
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
  return { unit, cell, plant, lines, nozzles, spools, notes };
}
