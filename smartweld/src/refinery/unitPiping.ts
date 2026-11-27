/**
 * Plant 3: a unit as a plant for the piping generator of plants 1 and 2 (DESIGN_BASIS.md §79, SW-RPI-*). The unit's
 * cell (its rack and bodies, §78) is given a nozzle schedule and a line list drawn from its flowsheet and sizes (§74,
 * §75); the generator itself is unchanged and routes, assembles, welds and supports the lines by its own rules.
 */
import { pipeDims, designFlange, gateFaceToFace, makeValve, teeC, elbowRadius, heaterGasRings, cabinGasHeaderY, boilerOutletHeader, type PipeClass, type PartSpec } from '../catalogue';
import { buildGeometry } from '../geometry/partGeometry';
import type { PlantDef } from '../generator/plant';
import { jointBySpec, flangeBySpec, lineGroup } from '../generator/plant';
import { nozzleStandout, type Nozzle, type NozzleDef } from '../generator/nozzles';
import type { LineDef, EndRef, Service } from '../generator/linelist';
import type { BuildingModel, Placed } from '../generator/building';
import { staticObstacles, type Obstacle } from '../generator/piping';
import { interiorKit } from '../generator/interiorKit';
import { frameFromAxes } from '../geometry/transform';
import type { Mat4 } from '../geometry/mesh';
import { processModel } from './process';
import { sizing, lineSize, utilState, classFor, designPressure, designTemperature, sideOf, transferLine, type EquipSize } from './sizing';
import { unitHeaders, connection } from './headers';
import { stationed } from './sizing';
import { FLUIDS } from './fluids';
import type { Equip, End, UnitSheet } from './flowsheet';
import { buildCell, valveDrop, bodySolids, relaySeams, cabinGasY, RACK, RACK_COL, YARD, type CellModel, type Spot, type SolidBox } from './cell';
import { lineNumber, serviceOf, routedFree } from './registry';
import { PLOTS } from './site';
import { plotLength, cellToSite } from './assemble';
import { PWY } from './pipeway';

export type V3 = [number, number, number];
const SUFFIX = 'ABCDEFGH', near = (v: number, s = 6) => Math.round(v / s) * s, up = (v: number, s = 6) => Math.ceil(v / s - 1e-9) * s, down = (v: number, s = 6) => Math.floor(v / s + 1e-9) * s;

/** what a generated line carries, kept beside the generator's own record (SW-RPI-3) */
export interface UnitLine {
  def: LineDef; unit: number; seq: number; fluid: string; origin: 'process' | 'spare' | 'utility' | 'header' | 'root' | 'control'; /** the flowsheet line it is, or branches from */ flow?: number; /** the utility connection it is */ util?: number;
  designP: number; designT: number; /** the rack tier it runs on, where it runs the rack (SW-RPI-7) */ tier?: number; /** the control station it is divided at (SW-RPI-9) */ station?: string; /** a control valve the flowsheet asks for that is not piped: the catalogue does not offer its size */ cvOmitted?: boolean;
  /** SW-RPI-14: the ends at which the generator's valve is not built */ bare?: ('from' | 'to')[];
}
/** a battery limit spool: two nozzles back to back on a lane of the rack (SW-RPI-4) */
export interface BlSpool { tag: string; stream: string; dir: 'in' | 'out'; line: string; NPS: number; cls: PipeClass; at: V3; /** the rack tier its line runs on (an index into the rack's tiers) */ tier: number; /** the rack lane its line is expected to run in */ lane?: number; /** SW-RPI-15: a utility header's spool: `stream` is the plant header's name, `line` the unit's header */ header?: boolean }
/** SW-RPI-15: a header's block valve at the limit: given to the generator as a stub on its spool's inner face, and joined to the header on the generator's result */
export interface HeaderFeed { tag: string; header: string; stub: LineDef; z: number }
/** a control station's spool at grade under the rack (SW-RPI-9): the line as far as the station, and the part after it */
export interface StationSpool { tag: string; line: string; after: string; at: V3 }
/** a utility header and the lane on the top tier it is foreseen in */
export interface HeaderLane { line: string; z?: number }
/** a branch's root spool on the rack (SW-RPI-8) */
export interface RootSpool { tag: string; line: string; connection: string; parent: string; at: V3; tier: number }
export interface UnitPiping {
  unit: number; cell: CellModel; plant: PlantDef; lines: UnitLine[]; nozzles: Map<string, PlantNozzle>; spools: BlSpool[]; roots: RootSpool[]; stations: StationSpool[]; headers: HeaderLane[]; /** SW-RPI-15: the block valves of the headers at the limit */ feeds: HeaderFeed[]; notes: string[];
  /** the width of lanes each tier is loaded to in this unit, in */ tierRoom: number;
  /** SW-RPI-7: the rack tiers in use, lowest first (indices into the rack's tiers) */
  tiers: number[];
  /** SW-RPI-7: the runs of the generator, in order; the run each line is routed in; and the plant as a run is given it, with the solids of the runs before (`whole`: on the unit's whole grid) */
  runs: UnitRun[]; runOf: Map<string, number>; runPlant: (run: number, prior: Placed[], whole?: boolean | 'close') => PlantDef;
  /** the lanes on each tier: the headers', each rack line's, each root spool's */
  foreseen: RackLane[];
}
/** the width of lanes a tier is loaded to at least; and at most, as a share of the tier's lanes (SW-RPI-7) */
export const TIER_ROOM = 72, TIER_SHARE = 0.85;
/** a run of the generator (SW-RPI-7): a column's overhead line, a line that runs the rack with the lane given it, or a line that rises in a column's chase without running the rack, each with the branches that tap it; or the rest of the unit's lines */
export interface UnitRun { kind: 'overhead' | 'rack' | 'chase' | 'rest'; lines: string[]; lane?: RackLane }
/** a lane on a tier of the rack (SW-RPI-7): the tier (an index into the rack's tiers), its centre, the width it is held by, the stretch of rack it is taken over, and the line it is given to (none: a header's lane, a root spool's place) */
export interface RackLane { t: number; z: number; OD: number; x0: number; x1: number; no?: string }
/** SW-RPI-7: a line of this size and larger cannot turn out of the rack between two tiers, and runs on the lowest or the top */
export const BIG = 14;
/** SW-RPI-5: the round the generator holds a column of the main rack by: half the diagonal of the section the main rack is built with */
let mainColumn: number | undefined;
export function mainColumnRound(): number {
  if (mainColumn === undefined) { const own: Placed[] = [], kit = interiorKit({ pedestal: PWY.PAD, padHeight: PWY.PAD }, own, {}), b = kit.rack({ x0: PWY.bent, x1: 3 * PWY.bent, bentSpacing: PWY.bent, halfWidth: PWY.half, tiers: PWY.tiers as unknown as number[], loadPsf: PWY.loadPsf }); mainColumn = Math.hypot(b.cd.d, b.cd.bf) / 2; }
  return mainColumn;
}
/** SW-RPI-7: how far from the lowest tier's centre line, beyond its own radius, a lane's axis lies at least: the stringer under that line is held by the generator as a round of its section's half-diagonal, to the grid cell beyond it */
export const STRINGER = 9;
/** SW-RPI-7: the half-width the generator's 6 in grid holds a box of half-width `b` by: the cells whose centres are within 3 in of it, each taken to reach 3 in beyond its centre */
export const heldAs = (b: number) => 6 * Math.floor((b + 3) / 6) + 3;
/** SW-RPI-7: how far from a kept lane's axis its solid reaches, for a pipe of radius `r`: so far that the grid holds it 3 in beyond the pipe at least */
export const keptReach = (r: number) => 6 * Math.ceil((r + 3) / 6 - 1e-9) - 3;
/** SW-RPI-7: how far apart the centres of two lanes of these widths are at least, so that a pipe in either passes the other held as a box */
export const laneSpacing = (wa: number, wb: number) => up(Math.max(wa / 2 + 3 + heldAs(wb / 2), wb / 2 + 3 + heldAs(wa / 2)));
const KIT = interiorKit({ pedestal: 6, padHeight: 6 }, [], {});
/** a solid block the generator is shown but the model does not hold: tagged so that no hanger hangs from it */
export function block(mn: V3, mx: V3, name = 'keep-out'): Placed {
  return { part: KIT.concrete(name, mx[2] - mn[2], mx[1] - mn[1], mx[0] - mn[0]), transform: frameFromAxes([mn[0], (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2], [0, 1, 0], [1, 0, 0]), tags: ['keep-out', 'cladding'] };
}

/** how far a gate valve's handwheel stands from the pipe's axis: an upper bound on the catalogue's gate valves (SW-VLV-*), which a test checks */
export const gateReach = (NPS: number) => 4 * NPS + 8;
const wheels = new Map<string, number>();
/** how wide a gate valve is across its line and its stem: its handwheel or gear, from the catalogue's own valve (SW-VLV-*) */
export function gateWidth(NPS: number, cls: PipeClass): number {
  const k = `${NPS}|${cls}`; let w = wheels.get(k);
  if (w === undefined) { w = 0; for (const so of buildGeometry(makeValve(`GATE${NPS}-${cls}`, 'GATE', NPS, cls)).solids) for (let i = 0; i < so.mesh.positions.length; i += 3) w = Math.max(w, 2 * Math.abs(so.mesh.positions[i])); wheels.set(k, w); }
  return w;
}
/** the shortest distance between two segments, by sampling (enough for a clearance check on the grid) */
function segDist(a: V3, b: V3, c: V3, d: V3): number {
  let best = Infinity;
  for (let i = 0; i <= 12; i++) for (let j = 0; j <= 12; j++) { const s = i / 12, t = j / 12, v = Math.hypot(a[0] + (b[0] - a[0]) * s - c[0] - (d[0] - c[0]) * t, a[1] + (b[1] - a[1]) * s - c[1] - (d[1] - c[1]) * t, a[2] + (b[2] - a[2]) * s - c[2] - (d[2] - c[2]) * t); if (v < best) best = v; }
  return best;
}
interface Anchor { A: V3; u: V3; /** a standout other than SW-NOZ-1's */ S?: number; /** SW-NOZ-1 (amended 2026-11-27): how far behind A, along −u, the item's drawn body lies where the neck meets it (the neck runs on to it; the face stays) */ back?: number }
/** a plant 3 nozzle: its neck's end and length to the drawn body, and the base and standout its face was set by, which its runs are planned from */
export type PlantNozzle = Nozzle & { plan?: { A: V3; S: number } };

/** SW-RPI-2: where each connection of an item stands on one of its bodies */
function anchorsOf(s: Spot, e: Equip, z: EquipSize, other: (port: string) => Spot | undefined, temps: (port: string) => number | undefined, solids: () => SolidBox[], mate: (port: string) => Anchor | undefined = () => undefined, own: () => { part: PartSpec; transform: Mat4 } | undefined = () => undefined): Map<string, Anchor> {
  const pumpX = (port: string) => { const o = other(port); return o && o.kind === 'pump' ? o.x : undefined; };
  const out = new Map<string, Anchor>(), R = s.R ?? 0, toRack: V3 = [0, 0, -s.side], ports = z.nozzles;
  const od = (port: string) => { const n = ports.find(q => q.port === port)!; return designFlange(n.NPS, n.cls).OD; };
  switch (s.shape) {
    case 'pump': out.set('S', { A: [s.x, s.yc!, s.zs!], u: toRack }); out.set('D', { A: [s.x, s.yc! + R, s.zc!], u: [0, 1, 0] }); return out;
    case 'machine': {
      out.set('inlet', { A: [s.x, s.yc!, s.zs!], u: toRack }); out.set('outlet', { A: [s.x, s.yc! + R, s.zc!], u: [0, 1, 0] });   // as a pump: suction on the shaft's line at the casing's free end, facing the rack; discharge on top
      out.set('discharge', out.get('outlet')!);                                                         // a compressor that draws from the atmosphere has the one connection
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
      if (!ports.some(q => q.port === 'tube in')) {   // a sulfur condenser: gas through the tubes from end to end, sulfur draining at the outlet end, water boiling in the shell
        const zMid = near(zo - s.side * (s.len! / 2)), zEnd = near(zo - s.side * (s.len! - 18));
        // the gas enters on top at the end toward the rack and leaves on top of the channel at the outer end, where the sulfur drains from underneath toward its pit
        out.set('inlet', { A: [s.x, yT, zEnd], u: [0, 1, 0] }); out.set('outlet', { A: [s.x, yT, s.zc!], u: [0, 1, 0] }); out.set('sulfur out', { A: [s.x, yB, s.zc!], u: [0, -1, 0] });
        out.set('steam out', { A: [s.x, yT, zMid], u: [0, 1, 0] }); out.set('feed water in', { A: [s.x, yB, zMid], u: [0, -1, 0] });
        return out;
      }
      const heatedSide = (side: 'tube' | 'shell') => { const i = e.ports.find(p => p.name === `${side} in`), o = e.ports.find(p => p.name === `${side} out`); return i && o ? o.s.T > i.s.T || (o.s.T === i.s.T && o.s.vf > i.s.vf) : /^(BW|CWS)$/.test(np(`${side} in`).fluid); };
      const tH = heatedSide('tube'), sH = heatedSide('shell'), tubeTop = tH ? 'tube out' : 'tube in', tubeBot = tH ? 'tube in' : 'tube out', shellTop = sH ? 'shell out' : 'shell in', shellBot = sH ? 'shell in' : 'shell out';
      out.set(tubeTop, { A: [s.x, yT, s.zc!], u: [0, 1, 0] }); out.set(tubeBot, { A: [s.x, yB, s.zc!], u: [0, -1, 0] });
      const za = s.zc! - s.side * up(Math.max(Math.abs(s.zc! - zo) + 12, gateReach(np(shellTop).NPS) + od(tubeTop) / 2 + 6)), zb = near(zo - s.side * (s.len! - 12));
      out.set(shellTop, { A: [s.x, yT, za], u: [0, 1, 0] }); out.set(shellBot, { A: [s.x, yB, zb], u: [0, -1, 0] }); void top;
      return out;
    }
    case 'hv': {
      if (s.axis === 'z') {
        // a hotwell, square to the rack under its ejector set: each tail pipe and the last condenser's outlet enters on top under the boot it comes from; gas leaves on top
        // midway between the last two of them, the end toward the rack; water underneath midway between the first two; oil underneath below the second tail pipe
        const ins = ports.filter(q => q.dir === 'in').map(q => ({ q, m: mate(q.port) })); if (ins.some(v => !v.m) || ins.length < 2) throw new Error(`${e.tag}: a hotwell whose inlets do not each come from a boot of its set`);
        const zs = ins.map(v => v.m!.A[2]).sort((a, b) => (toRack[2] > 0 ? a - b : b - a)), top = s.yc! + R, bot = s.yc! - R;
        for (const v of ins) { if (Math.abs(v.m!.A[0] - s.x) > 1e-6 || Math.abs(v.m!.A[2] - s.z) > s.len! / 2 - 18) throw new Error(`${e.tag}: "${v.q.port}" does not stand under its boot on the shell`); out.set(v.q.port, { A: [s.x, top, v.m!.A[2]], u: [0, 1, 0] }); }
        const nI = zs.length, zw = near((zs[0] + zs[1]) / 2), zg = near((zs[nI - 2] + zs[nI - 1]) / 2), outs = ports.filter(q => q.dir === 'out'), gas = outs.filter(q => /gas|vapour|vent/.test(q.port)), liq = outs.filter(q => !gas.includes(q));
        if (gas.length !== 1 || liq.length > 2) throw new Error(`${e.tag}: a hotwell has one gas outlet and two liquid outlets at most`);
        if (nI < 3 || Math.min(Math.abs(zg - zs[nI - 2]), Math.abs(zg - zs[nI - 1])) < od(gas[0].port) / 2 + od(ins[0].q.port) / 2 + 6) throw new Error(`${e.tag}: no room on top for its gas outlet between its last two inlets`);
        out.set(gas[0].port, { A: [s.x, top, zg], u: [0, 1, 0] });
        const water = liq.find(q => /water/.test(q.port)) ?? liq[0], oil = liq.find(q => q !== water);
        if (water) out.set(water.port, { A: [s.x, bot, zw], u: [0, -1, 0] }); if (oil) out.set(oil.port, { A: [s.x, bot, zs[1]], u: [0, -1, 0] });
        return out;
      }
      // a horizontal drum, its axis along the rack: what enters and gas on top, liquids below, in order along its length
      // a deaerator: the water it deaerates and the steam that does it enter its dome; the deaerated water leaves under the storage shell as a drum's does
      const dome = e.kind === 'deaerator' ? solids().find(b => b.name === 'dome shell') : undefined, onDome = new Map<string, Anchor>();
      if (dome) {
        const cx = near((dome.mn[0] + dome.mx[0]) / 2), cz = near((dome.mn[2] + dome.mx[2]) / 2), ym = near((dome.mn[1] + dome.mx[1]) / 2), top = solids().find(b => b.name === 'dome top head') ?? dome, ins = ports.filter(q => q.dir === 'in');
        const water = ins.filter(q => !/steam/.test(q.port)).sort((a, b) => b.NPS - a.NPS), steam = ins.filter(q => /steam/.test(q.port)).sort((a, b) => b.NPS - a.NPS);
        if (water[0]) onDome.set(water[0].port, { A: [cx, top.mx[1], cz], u: [0, 1, 0] });
        if (water[1]) onDome.set(water[1].port, { A: [cx, ym, toRack[2] > 0 ? dome.mx[2] : dome.mn[2]], u: toRack });
        if (steam[0]) onDome.set(steam[0].port, { A: [dome.mn[0], ym, cz], u: [-1, 0, 0] });
        if (steam[1]) onDome.set(steam[1].port, { A: [dome.mx[0], ym, cz], u: [1, 0, 0] });
        if (water.length > 2 || steam.length > 2) throw new Error(`${e.tag}: its dome has a place for two water and two steam connections, and it has ${water.length} and ${steam.length}`);
      }
      // a desalter is fed from underneath, through its distributor, and its oil leaves on top; its brine leaves underneath at the far end
      const des = e.kind === 'desalter', x0 = s.x - s.len! / 2, topP = des ? ports.filter(q => q.port === 'oil') : ports.filter(q => !onDome.has(q.port) && (q.dir === 'in' || /gas|vapour|vent|steam out/.test(q.port) || (e.kind === 'drum' && q.dir === 'out' && e.ports.find(x => x.name === q.port)?.s.vf === 1))),   // SW-RPI-2 (amended 2026-11-27): a drum's outlet all vapour is gas, on top
        botP = ports.filter(q => !topP.includes(q) && !onDome.has(q.port));
      for (const [p, a] of onDome) out.set(p, a);
      // under the shell, no connection stands over a saddle and its pier (SW-CELL-4: at 0.2 and 0.8 of the length)
      const pier = (Math.max(6, (2 * R) / 3) + 12) / 2, overPier = (x: number, w: number) => [0.2, 0.8].some(f => Math.abs(x - (x0 + f * s.len!)) < pier + w / 2 + 9);
      const along = (list: typeof ports, y: number, u: V3, fromEnd: boolean) => {
        let x = fromEnd ? down(x0 + s.len! - 18) : up(x0 + 18), prev = 0; const step = fromEnd ? -1 : 1;
        for (const q of fromEnd ? [...list].reverse() : list) { const w = designFlange(q.NPS, q.cls).OD; if (prev) x += step * up((prev + w) / 2 + 12); while (u[1] < 0 && overPier(x, w)) x += step * 6;
          if (x < x0 + 18 - 1e-6 || x > x0 + s.len! - 18 + 1e-6) throw new Error(`${e.tag}: its connection "${q.port}" would stand at ${x}, beyond 18 in inside a tangent line (${x0 + 18} to ${x0 + s.len! - 18}); the drum is too short for its connections (SW-RPI-2)`);
          out.set(q.port, { A: [x, y, s.z], u }); prev = w; }
      };
      const ins = topP.filter(q => q.dir === 'in'), gas = topP.filter(q => q.dir === 'out'), toPump = botP.filter(q => pumpX(q.port) !== undefined);
      along(ins, s.yc! + R, [0, 1, 0], false); along(gas, s.yc! + R, [0, 1, 0], true);
      if (des) { along(botP.filter(q => q.dir === 'in'), s.yc! - R, [0, -1, 0], false); along(botP.filter(q => q.dir === 'out'), s.yc! - R, [0, -1, 0], true); return out; }
      along(botP.filter(q => !toPump.includes(q)), s.yc! - R, [0, -1, 0], true);
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
        // SW-EQC-15 (amended 2026-11-27): the gas rings under the floor that the heater draws for its gas connections, and each gas's pipe
        const fuel = ports.filter(q => q.port === 'fuel gas'), waste = ports.filter(q => /gas$/.test(q.port) && q.port !== 'fuel gas'), gasOD = [...fuel, ...waste].map(q => pipeDims(q.NPS, q.cls).OD), rings = fuel.length ? heaterGasRings(2 * R, gasOD) : [];
        if (waste.length && !fuel.length) throw new Error(`${e.tag}: a waste gas and no fuel gas (SW-EQC-15)`);
        out.set('inlet', { A: [s.x - 0.3 * 2 * R, up(s.yt! + 0.2 * 2 * R), s.z], u: [-1, 0, 0] }); out.set('outlet', { A: [s.x, up(s.yb! + 24), s.z - R], u: [0, 0, -1] }); out.set('fuel gas', { A: [s.x, down(s.yb! - 18), s.z + R], u: [0, 0, 1], back: R - (rings[0] + gasOD[0] / 2) });
        // a waste gas it burns enters beside the fuel gas, 3 ft along; a steam coil's two ends stand in the convection box's two side faces
        // SW-RPI-2 (amended 2026-11-27): the waste gas 1 ft along and 1 ft below the fuel gas, its neck in to its own ring inside the fuel gas's (SW-EQC-15)
        waste.forEach((q, k) => out.set(q.port, { A: [s.x + 12, down(s.yb! - 30), s.z + R], u: [0, 0, 1], back: R - Math.sqrt((rings[k + 1] + gasOD[k + 1] / 2) ** 2 - 144) }));
        if (ports.some(q => q.port === 'steam coil in')) { out.set('steam coil in', { A: [s.x, up(s.yt! + 0.2 * 2 * R), s.z - 0.3 * 2 * R], u: [0, 0, -1] }); out.set('steam coil out', { A: [s.x, up(s.yt! + 0.2 * 2 * R), s.z + 0.3 * 2 * R], u: [0, 0, 1] }); }
        return out;
      }
      // every shell connection on the centre line of the half that faces the rack (the platforms and ladders stand on the other half)
      const lo = up(s.yb! + 12), hi = down(s.yt! - 12), tOf = (p: string) => e.ports.find(q => q.name === p)?.s.T ?? temps(p) ?? 0;
      // SW-RPI-2 (amended 2026-11-27): a column of shells of different diameters stands each connection on the shell at its own height, the top one on its crown
      const body = s.body, crown = s.yt! + (body?.Rtop ?? R) / 2;
      const Rat = (yy: number): number => {
        if (!body) return R;
        for (const q of body.zones) if (yy >= q.a - 1e-6 && yy <= q.b + 1e-6) return q.R;
        for (const c of body.cones) if (yy > c.a && yy < c.b) return c.R0 + ((c.R1 - c.R0) * (yy - c.a)) / (c.b - c.a);
        const [Rh, d] = yy < body.zones[0].a ? [body.Rbot, body.zones[0].a - yy] : [body.Rtop, yy - body.zones[body.zones.length - 1].b];
        return Rh * Math.sqrt(Math.max(0, 1 - (d / (Rh / 2)) ** 2));   // on a 2:1 head
      };
      let topUsed = false; const want: { p: string; y: number }[] = [], middle: string[] = [];
      // a vessel named in sections (a stacked side stripper): equal sections, the hottest lowest
      const secOf = (p: string) => /^(.+) (in|vapour|out|stripping steam)$/.exec(p), names = [...new Set(ports.map(q => secOf(q.port)?.[1]).filter((n): n is string => !!n && ports.some(q => q.port === `${n} in`) && ports.some(q => q.port === `${n} out`)))];
      const sections = names.length > 1 ? [...names].sort((a, b) => tOf(`${b} in`) - tOf(`${a} in`)) : [], hs = (hi - lo) / Math.max(1, sections.length);
      for (const q of ports) {
        const p = q.port, sec = secOf(p);
        // the one connection on top: a reactor's inlet; what leaves as vapour by its name; a drum's outlet that is all vapour (a knock-out or surge drum's gas)
        if (!topUsed && ((e.kind === 'reactor' && p === 'inlet') || (q.dir === 'out' && /^(overhead|vapour|gas|gas out|treated gas|net gas|recycle gas|acid gas|vent|hydrogen)$/.test(p)) || (e.kind === 'drum' && q.dir === 'out' && e.ports.find(x => x.name === p)?.s.vf === 1))) { out.set(p, { A: [s.x, crown, s.z], u: [0, 1, 0], ...(s.floors ? { S: Math.max(nozzleStandout(q.NPS, q.cls), s.floors[s.floors.length - 1] + 54 - crown) } : {}) }); topUsed = true; continue; }
        if (sec && sections.includes(sec[1])) { want.push({ p, y: lo + (sections.indexOf(sec[1]) + { out: 0.08, 'stripping steam': 0.2, in: 0.8, vapour: 0.92 }[sec[2] as 'in']) * hs }); continue; }
        const f = (/bottoms|rich amine|rich oil|^liquid$|^outlet$| out$|^water$|^oil$/.test(p) && q.dir === 'out') || (e.kind === 'psa' && /^(feed|tail gas)$/.test(p)) ? 0 : /reboiler draw/.test(p) ? 0.03 : /stripping steam|gas in/.test(p) ? 0.07 : /reboiler return/.test(p) ? 0.12 : /reflux|lean amine|lean oil|quench return|^inlet$/.test(p) ? 1 : -1;
        if (f < 0) middle.push(p); else want.push({ p, y: lo + f * (hi - lo) });
      }
      // the middle: by temperature, the hottest lowest, a return directly above its own draw
      const drawOf = (p: string) => { const m = /^(.+?) (vapour )?return$/.exec(p); return m && middle.includes(`${m[1]} draw`) ? `${m[1]} draw` : undefined; };
      const order = middle.filter(p => !drawOf(p)).sort((a, b) => tOf(b) - tOf(a)).flatMap(p => [p, ...middle.filter(r => drawOf(r) === p)]);
      order.forEach((p, k) => want.push({ p, y: lo + (order.length > 1 ? 0.2 + (0.7 * k) / (order.length - 1) : 0.5) * (hi - lo) }));
      // apart by a gate valve's reach: the generator stands a horizontal stack's stem up, so the connection above must clear the handwheel below
      want.sort((a, b) => a.y - b.y); let nz = want.map(w => ports.find(q => q.port === w.p)!), fl = nz.map(q => designFlange(q.NPS, q.cls).OD), gap: number[] = [], y: number[] = [];
      let y0 = lo, y1 = hi;
      const pack = () => {
        for (const [least, edge] of [[36, 12], [0, 12], [0, 6]]) {   // 36 in apart and 12 in from the tangent lines, where the shell is long enough for that; a short one closes them up
          y0 = up(s.yb! + edge); y1 = down(s.yt! - edge);
          gap = nz.map((q, k) => (k + 1 < nz.length ? Math.max(least, gateReach(q.NPS) + fl[k + 1] / 2 + 6) : 0)); y = [];
          want.forEach((w, k) => y.push(up(Math.max(w.y, y0, k ? y[k - 1] + gap[k - 1] : y0))));
          if (y.length && y[y.length - 1] > y1) { y[y.length - 1] = y1; for (let k = y.length - 2; k >= 0; k--) y[k] = Math.min(y[k], down(y[k + 1] - gap[k])); }
          if (!y.length || y[0] >= y0) break;
        }
        return !y.length || y[0] >= y0;
      };
      // a vessel without platforms too short for its shell connections: the uppermost on the top head instead, where that is free
      if (!pack() && !topUsed && !s.floors && want.length > 1) { const w = want.pop()!; out.set(w.p, { A: [s.x, crown, s.z], u: [0, 1, 0] }); topUsed = true; nz = want.map(q => ports.find(x => x.port === q.p)!); fl = nz.map(q => designFlange(q.NPS, q.cls).OD); pack(); }
      if (y.length && y[0] < y0) throw new Error(`${e.tag}: its ${y.length} shell connections need ${Math.round(gap.reduce((a, b) => a + b, 0))} in of shell and it has ${y1 - y0}`);
      if (body) {   // SW-RPI-2 (amended 2026-11-27): the feed 36 in above the lower cone on the middle shell; none with its pipe within 6 in of a cone; spaced again upward
        const odOf = (p: string) => { const q = ports.find(x => x.port === p)!; return pipeDims(q.NPS, q.cls).OD; };
        const clear = (p: string, yy: number) => { for (const c of body.cones) { const m = odOf(p) / 2 + 6; if (yy + m > c.a && yy - m < c.b) return up(c.b + m); } return yy; };
        const at = want.map((w, k) => ({ w, y: w.p === 'feed' ? up(body.cones[0].b + 36) : y[k] })).sort((a, b) => a.y - b.y);
        want.splice(0, want.length, ...at.map(q => q.w)); nz = want.map(w => ports.find(q => q.port === w.p)!); fl = nz.map(q => designFlange(q.NPS, q.cls).OD);
        y = []; at.forEach((q, k) => { let yy = up(Math.max(q.y, k ? y[k - 1] + Math.max(36, gateReach(nz[k - 1].NPS) + fl[k] / 2 + 6) : y0)); for (let n = 0; n < 4; n++) { const c = clear(q.w.p, yy); if (c === yy) break; yy = c; } y.push(yy); });
        if (y.length && y[y.length - 1] > y1) throw new Error(`${e.tag}: its shell connections, kept off its cones, reach ${y[y.length - 1]} past ${y1} (SW-RPI-2)`);
      }
      want.forEach((w, k) => { const r = Rat(y[k]); out.set(w.p, { A: [s.x + toRack[0] * r, y[k], s.z + toRack[2] * r], u: toRack }); });
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
      // SW-RPI-2 (amended 2026-11-27): each gas's neck in to its header inside the wall's columns (SW-EQC-53)
      const yGas = gases.length ? cabinGasY(W, s.yb!, gases.map(q => pipeDims(q.NPS, q.cls).OD)) : 0;
      gases.forEach((q, k) => { const od = pipeDims(q.NPS, q.cls).OD; out.set(q.port, { A: [s.x - W / 2, yGas, s.z + (k - (gases.length - 1) / 2) * 48], u: [-1, 0, 0], back: W - (cabinGasHeaderY(W, od) + od / 2) }); });
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
      const sb = solids(), boxOf = (re: RegExp) => { const bs = sb.filter(b => re.test(b.name)); if (!bs.length) throw new Error(`${e.tag}: it has no solid named ${re}`); return { mn: [0, 1, 2].map(k => Math.min(...bs.map(b => b.mn[k]))) as V3, mx: [0, 1, 2].map(k => Math.max(...bs.map(b => b.mx[k]))) as V3 }; }, mid = (b: { mn: V3; mx: V3 }, k: number) => near((b.mn[k] + b.mx[k]) / 2);
      const need = (port: string, a: Anchor) => { if (ports.some(q => q.port === port)) out.set(port, a); };
      if (e.kind === 'furnace') {
        const wb = boxOf(/^burner: windbox/), ch = boxOf(/^furnace chamber$/), duct = boxOf(/outlet duct$/), drum = boxOf(/steam drum shell$/), yc = mid(ch, 1), zc = mid(ch, 2), xw = mid(wb, 0), front = (wb.mn[0] + wb.mx[0]) / 2 < (ch.mn[0] + ch.mx[0]) / 2 ? -1 : 1;
        need('combustion air', { A: [xw, wb.mx[1], zc], u: [0, 1, 0] });   // the catalogue's own air duct stub is left off with the body's other stubs
        need('acid gas', { A: [xw, yc, toRack[2] > 0 ? wb.mx[2] : wb.mn[2]], u: toRack }); need('stripper gas', { A: [xw, yc, toRack[2] > 0 ? wb.mn[2] : wb.mx[2]], u: [0, 0, -toRack[2]] });
        need('process gas', { A: [front < 0 ? duct.mx[0] : duct.mn[0], yc, zc], u: [-front, 0, 0] });
        need('steam out', { A: [mid(drum, 0), drum.mx[1], mid(drum, 2)], u: [0, 1, 0] }); need('feed water in', { A: [mid(drum, 0) + front * 36, drum.mx[1], mid(drum, 2)], u: [0, 1, 0] });
        return out;
      }
      if (e.kind === 'boiler') {
        const sh2 = boxOf(/^superheater headers/), eh = boxOf(/^economizer water headers/), ef = boxOf(/^economizer header flanges/), mud = boxOf(/^mud drum head$/), md = boxOf(/^mud drum shell$/), wb = boxOf(/^burner 1: windbox/), drum = boxOf(/^steam drum shell$/);
        // the outlet header is the one of the two further from the steam drum; the connection at its mid-length
        // SW-RPI-2 (amended 2026-11-27): the steam on the outlet header's drawn surface at the grid line nearest its axis
        const nS = ports.find(q => q.port === 'steam'), Rh = boilerOutletHeader(nS?.NPS).OD / 2, outer = mid(sh2, 0) > mid(drum, 0), xc = outer ? sh2.mx[0] - Rh : sh2.mn[0] + Rh, yc = sh2.mx[1] - Rh, xs = near(xc);
        if (Math.abs(xs - xc) > Rh - (nS ? pipeDims(nS.NPS, nS.cls).OD / 2 : 0)) throw new Error(`${e.tag}: the steam's grid line stands off its outlet header (SW-RPI-2)`);
        need('steam', { A: [xs, yc + Math.sqrt(Rh * Rh - (xs - xc) ** 2), mid(sh2, 2)], u: [0, 1, 0] });
        // the feed water on the economizer's lower header's axis at the end of its pipe (the boiler is set so that axis is on the grid), its neck continuing the header
        const dirZ = Math.abs(ef.mn[2] - s.z) > Math.abs(ef.mx[2] - s.z) ? (ef.mn[2] < mid(eh, 2) ? -1 : 1) : (ef.mx[2] < mid(eh, 2) ? -1 : 1), endZ = dirZ < 0 ? eh.mn[2] : eh.mx[2];
        const xa = (eh.mn[0] + eh.mx[0]) / 2, ya = eh.mn[1] + 6.625 / 2;
        if (Math.abs(xa - near(xa)) > 0.01 || Math.abs(ya - near(ya)) > 0.01) throw new Error(`${e.tag}: the economizer's lower header's axis (${xa.toFixed(2)}, ${ya.toFixed(2)}) is off the grid (SW-CELL-7)`);
        need('feed water', { A: [near(xa), near(ya), endZ], u: [0, 0, dirZ] });
        need('blowdown', { A: [mid(md, 0), mid(md, 1), toRack[2] > 0 ? mud.mx[2] : mud.mn[2]], u: toRack });
        const sx = mid(wb, 0) > mid(drum, 0) ? 1 : -1; need('fuel gas', { A: [sx > 0 ? wb.mx[0] : wb.mn[0], mid(wb, 1), mid(wb, 2)], u: [sx, 0, 0] });
        return out;
      }
      if (e.kind === 'incinerator') {
        const ch = boxOf(/^chamber shell$/), wb = boxOf(/^burner: windbox/), yc = mid(ch, 1), zc = mid(ch, 2), front = (wb.mn[0] + wb.mx[0]) / 2 < (ch.mn[0] + ch.mx[0]) / 2 ? -1 : 1, x = near((front < 0 ? ch.mn[0] : ch.mx[0]) - front * 36);
        const gases = ports.filter(q => q.dir === 'in' && q.port !== 'fuel gas').sort((a, b) => b.NPS - a.NPS);
        gases.forEach((q, k) => out.set(q.port, k === 0 ? { A: [x, ch.mx[1], zc], u: [0, 1, 0] } : k === 1 ? { A: [x, yc, ch.mx[2]], u: [0, 0, 1] } : { A: [x, yc, ch.mn[2]], u: [0, 0, -1] }));
        need('fuel gas', { A: [mid(wb, 0), yc, wb.mx[2]], u: [0, 0, 1] });
        return out;
      }
      if (e.kind === 'pit') {
        const roof = boxOf(/^roof slab$/), pump = boxOf(/^pump head/), coil = boxOf(/^steam coil/), y = roof.mx[1], zRow = mid(roof, 2) + toRack[2] * 60, r = 1.1875;
        const ins = ports.filter(q => /^sulfur in/.test(q.port)); ins.forEach((q, k) => out.set(q.port, { A: [near(mid(roof, 0) + 60 * (k - (ins.length - 1) / 2)), y, zRow], u: [0, 1, 0] }));   // about the pit's middle, 5 ft apart
        need('sulfur out', { A: [mid(pump, 0), near((pump.mx[1] - 24 + pump.mx[1]) / 2), toRack[2] > 0 ? pump.mx[2] : pump.mn[2]], u: toRack });
        const snap = (v: number) => (Math.abs(v - near(v)) < 0.05 ? near(v) : v);   // the coil's ends were brought onto the grid (SW-CELL-4); a mesh's bounds give them to a thousandth
        need('steam coil in', { A: [snap(coil.mn[0] + r), coil.mx[1], snap(toRack[2] > 0 ? coil.mx[2] - r : coil.mn[2] + r)], u: [0, 1, 0] }); need('steam coil out', { A: [snap(coil.mn[0] + r), coil.mx[1], snap(toRack[2] > 0 ? coil.mn[2] + r : coil.mx[2] - r)], u: [0, 1, 0] });
        return out;
      }
      if (e.kind === 'ejector') {
        // each connection where the catalogue's set has it (SW-EQC-68): on top of the first ejector's suction chamber; under each condenser's boot; at the lower ends of the set's steam and water pipes
        const under = (re: RegExp): Anchor => { const b = boxOf(re); return { A: [mid(b, 0), b.mn[1], mid(b, 2)], u: [0, -1, 0] }; }, ch = boxOf(/^stage 1 ejector: suction chamber$/), n = Number(z.d.stages);
        need('inlet', { A: [mid(ch, 0), ch.mx[1], mid(ch, 2)], u: [0, 1, 0] });
        for (let k = 1; k < n; k++) need(`condensate ${k}`, under(new RegExp(`^condenser ${k}: condensate boot$`)));
        need('outlet', under(new RegExp(`^condenser ${n}: condensate boot$`)));
        need('motive steam', under(/^motive steam leg$/)); need('cooling water in', under(/^cooling water supply leg$/)); need('cooling water out', under(/^cooling water return leg$/));
        return out;
      }
      if (e.kind === 'loading') { const rs = boxOf(/^loading arm riser$/); need('inlet', { A: [mid(rs, 0), up(rs.mn[1] + 12), toRack[2] > 0 ? rs.mx[2] : rs.mn[2]], u: toRack }); return out; }
      if (e.kind === 'blower') { const of = boxOf(/^outlet flange$/); need('discharge', { A: [mid(of, 0), of.mx[1], mid(of, 2)], u: [0, 1, 0] }); return out; }
      if (e.kind === 'cracker') {
        // each connection where its stream enters or leaves the item (SW-EQC-33 with the plant's stated inputs): the item's own frame gives the places
        const o = own(), ex = o?.part.extra as { X: number; riser: [number, number]; zWye: number; towerHalf: number; zCone: number; airEnd: V3; zHead: number; zr0: number } | undefined;
        if (!o || !ex || !ex.riser) throw new Error(`${e.tag}: the cracker is not built for the plant's own connections (SW-EQC-33)`);
        const T = o.transform, snap = (v: number) => (Math.abs(v - near(v)) < 0.01 ? near(v) : v), at = (q: V3): V3 => [0, 1, 2].map(k => snap(T[k] * q[0] + T[4 + k] * q[1] + T[8 + k] * q[2] + T[12 + k])) as V3, dir = (q: V3): V3 => [0, 1, 2].map(k => Math.round(T[k] * q[0] + T[4 + k] * q[1] + T[8 + k] * q[2])) as V3;
        need('flue gas', { A: at([0, 0, ex.zCone]), u: [0, 1, 0] });
        { const end = ex.airEnd, n = Math.hypot(end[0], end[1]); need('regenerator air', { A: at(end), u: dir([end[0] / n, end[1] / n, 0]).map(v => Math.round(v * 1e9) / 1e9 + 0) as V3 }); }   // (its components whole: the item is turned by quarter turns)
        { const q = ports.find(v => v.port === 'reactor vapour'), head = at([ex.X, 0, ex.zHead]), floor = Math.max(...sb.filter(b => /^reactor platform \d+: platform grating/.test(b.name)).map(b => b.mx[1]));
          if (q) out.set('reactor vapour', { A: head, u: [0, 1, 0], S: Math.max(nozzleStandout(q.NPS, q.cls), floor + 54 - head[1]) }); }
        { // on the riser, out through the face of the reactor's tower: clear of its girts and bracing (SW-EQC-29: panels 2.4 half-widths high, both diagonals in each)
          const riser = boxOf(/^riser$/), tower = boxOf(/^reactor tower/), wye = at([ex.riser[0], ex.riser[1], ex.zWye]), cx = near((riser.mn[0] + riser.mx[0]) / 2), cz = near((riser.mn[2] + riser.mx[2]) / 2), rR = (riser.mx[0] - riser.mn[0]) / 2;
          if ((cz - (tower.mn[2] + tower.mx[2]) / 2) * toRack[2] <= 0) throw new Error(`${e.tag}: its riser does not stand on the tower's side toward the rack`);
          const face = toRack[2] > 0 ? tower.mx[2] : tower.mn[2], surf = cz + toRack[2] * rR, base = at([0, 0, 0])[1], b = ex.towerHalf, dx = ex.riser[0] - ex.X, levels: number[] = [0];
          for (let zz = 0; zz < ex.zr0 - 1;) { zz = Math.min(ex.zr0, zz + 2.4 * b); if (ex.zr0 - zz < 0.6 * b) zz = ex.zr0; levels.push(zz); }
          const clearAt = (y: number, rf: number) => levels.every((L, k) => {
            const h = y - base, L1 = levels[k + 1]; if (k && Math.abs(h - L) < rf + 6) return false; if (L1 === undefined || h < L - rf - 6 || h > L1 + rf + 6) return true;
            const m = (L1 - L) / (2 * b), room = (rf + 5) * Math.hypot(1, m); return Math.abs(h - (L + (dx + b) * m)) >= room && Math.abs(h - (L + (b - dx) * m)) >= room; });
          const onRiser = (port: string, above: number) => {
            const q = ports.find(v => v.port === port); if (!q) return; const rf = designFlange(q.NPS, q.cls).OD / 2; let y = up(wye[1] + above); for (let i = 0; i < 60 && !clearAt(y, rf); i++) y += 6;
            if (!clearAt(y, rf)) throw new Error(`${e.tag}: no place on the riser for "${port}" clear of the tower's bracing`); out.set(port, { A: [cx, y, surf], u: toRack, S: Math.abs(face - surf) + 6 }); };
          onRiser('riser and stripping steam', 24); onRiser('feed', 96);
        }
        { // on the regenerator's shell toward the rack, in the stretches between its platform levels
          const shell = boxOf(/^regenerator shell$/), cx = near((shell.mn[0] + shell.mx[0]) / 2), cz = near((shell.mn[2] + shell.mx[2]) / 2), Rg = (shell.mx[0] - shell.mn[0]) / 2;
          const ks = [...new Set(sb.map(q => /^regenerator platform (\d+): /.exec(q.name)?.[1]).filter((k): k is string => !!k))];
          const rings = ks.map(k => { const bs = sb.filter(q => q.name.startsWith(`regenerator platform ${k}: `)); return { lo: Math.min(...bs.map(q => q.mn[1])), hi: Math.max(...bs.map(q => q.mx[1])) }; }).sort((p, q) => p.lo - q.lo);
          const gaps: [number, number][] = []; for (let k = 0; k + 1 < rings.length; k++) { const lo = Math.max(rings[k].hi, shell.mn[1]), hi = Math.min(rings[k + 1].lo, shell.mx[1]); if (hi - lo > 12) gaps.push([lo, hi]); }
          const inGap = (port: string, k: number) => {
            const q = ports.find(v => v.port === port); if (!q) return; const g = gaps[k]; if (!g) throw new Error(`${e.tag}: no stretch of the regenerator's shell between two platforms for "${port}"`);
            const lo = g[0] + 3 + designFlange(q.NPS, q.cls).OD / 2, hi = g[1] - 3 - gateReach(q.NPS), y = Math.min(down(hi), Math.max(up(lo), near((lo + hi) / 2)));
            if (y < lo) throw new Error(`${e.tag}: "${port}" does not fit between two of the regenerator's platforms (${Math.round(g[0])} to ${Math.round(g[1])})`); out.set(port, { A: [cx, y, cz + toRack[2] * Rg], u: toRack }); };
          inGap('catalyst withdrawal', 0); inGap('fresh catalyst', 1);
        }
        return out;
      }
      if (e.kind === 'hopper') {
        // out through the skirt's opening, side by side (the catalyst's toward the rack, the carrying air's beside it); in through the roof at its centre, over the handrail
        const shell = boxOf(/^shell$/), roof = boxOf(/^top plate$/), cx = mid(shell, 0), cz = mid(shell, 2), frame = sb.find(b => b.name === 'skirt opening frame');
        const row = [...ports.filter(q => q.dir === 'out'), ...ports.filter(q => q.dir === 'in' && /air/.test(q.port))], tops = ports.filter(q => q.dir === 'in' && !/air/.test(q.port));
        if (row.length) {
          if (!frame) throw new Error(`${e.tag}: it has no skirt opening to leave through`); if (row.length > 2) throw new Error(`${e.tag}: its skirt's opening has room for two connections, and it has ${row.length}`);
          const ux: V3 = (frame.mn[0] + frame.mx[0]) / 2 > cx ? [1, 0, 0] : [-1, 0, 0], x = ux[0] > 0 ? frame.mx[0] : frame.mn[0], y = near((frame.mn[1] + frame.mx[1]) / 2), zc = near((frame.mn[2] + frame.mx[2]) / 2);
          row.forEach((q, k) => out.set(q.port, { A: [x, y, zc + (row.length > 1 ? (k ? -1 : 1) * toRack[2] * 12 : 0)], u: ux }));
        }
        if (tops.length > 1) throw new Error(`${e.tag}: its roof has a place for one connection at its centre, and it has ${tops.length}`);
        for (const q of tops) out.set(q.port, { A: [cx, roof.mx[1], cz], u: [0, 1, 0], S: Math.max(nozzleStandout(q.NPS, q.cls), 54) });
        return out;
      }
      if (e.kind === 'scrubber') {
        const shell = boxOf(/^shell$/), duct = boxOf(/^gas inlet duct$/), cx = mid(shell, 0), cz = mid(shell, 2), R = (shell.mx[0] - shell.mn[0]) / 2, east = (duct.mn[0] + duct.mx[0]) / 2 > cx;
        need('flue gas in', { A: [east ? duct.mx[0] : duct.mn[0], mid(duct, 1), mid(duct, 2)], u: [east ? 1 : -1, 0, 0] });
        // into the sump, under the lowest platform
        const low = Math.min(...sb.filter(b => /^platform \d+: /.test(b.name)).map(b => b.mn[1])), y1 = up(shell.mn[1] + 24), y2 = y1 + 36, upper = ports.find(q => q.port === 'caustic') ?? ports.find(q => q.port === 'make-up water');
        if (upper && y2 + gateReach(upper.NPS) + 3 > low) throw new Error(`${e.tag}: its sump connections do not fit under its lowest platform (${Math.round(low)})`);
        need('make-up water', { A: [cx, y1, cz + toRack[2] * R], u: toRack }); need('caustic', { A: [cx, y2, cz + toRack[2] * R], u: toRack });
        return out;
      }
      if (e.kind === 'fluegascooler') {
        const shell = boxOf(/^shell$/), din = boxOf(/^inlet duct$/), dout = boxOf(/^outlet duct$/), drum = boxOf(/^steam drum shell$/), yc = mid(shell, 1), zc = mid(shell, 2), xc = mid(drum, 0), east = (din.mn[0] + din.mx[0]) / 2 > (shell.mn[0] + shell.mx[0]) / 2;
        need('inlet', { A: [east ? din.mx[0] : din.mn[0], yc, zc], u: [east ? 1 : -1, 0, 0] }); need('outlet', { A: [east ? dout.mn[0] : dout.mx[0], yc, zc], u: [east ? -1 : 1, 0, 0] });
        need('steam out', { A: [xc, drum.mx[1], mid(drum, 2)], u: [0, 1, 0] }); need('feed water in', { A: [xc + (east ? 36 : -36), drum.mx[1], mid(drum, 2)], u: [0, 1, 0] });
        return out;
      }
      throw new Error(`${e.tag}: no nozzle rule yet for a ${e.kind}`);
    }
  }
}

/** SW-RPI-1: the unit as a plant */
export function unitPiping(unit: number, longest = plotLength(PLOTS.find(q => q.unit === unit && q.kind === 'unit')!)): UnitPiping {
  // the cell the site stands on its plot (SW-SITE-7): the same room along the rack, and unit 19 without its cooling tower's group, which has a plot of its own
  const M = processModel(), sh: UnitSheet = M.sheet(unit), Z = sizing().get(unit)!, cell = buildCell(unit, longest, unit === 19 ? 'rest' : 'all'), notes: string[] = [];
  const HW = cell.rack.halfWidth, bodies = (tag: string) => cell.spots.filter(s => s.item === tag), defs: NozzleDef[] = [], nozzles = new Map<string, PlantNozzle>(), lines: UnitLine[] = [], spools: BlSpool[] = [], roots: RootSpool[] = [], stations: StationSpool[] = [];
  const addNozzle = (id: string, equip: string, service: string, NPS: number, cls: PipeClass, a: Anchor, z0: number, S = nozzleStandout(NPS, cls)) => {
    const face: V3 = [a.A[0] + a.u[0] * S, a.A[1] + a.u[1] * S, a.A[2] + a.u[2] * S], b = a.back ?? 0;
    // SW-NOZ-1 (amended 2026-11-27): the neck runs back to the drawn body, `back` beyond A; the runs are planned from A and S as the face was set
    nozzles.set(id, { id, equip, service, NPS, cls, A: b ? [a.A[0] - a.u[0] * b, a.A[1] - a.u[1] * b, a.A[2] - a.u[2] * b] : a.A, u: a.u, face, S: S + b, z0, ...(b ? { plan: { A: a.A, S } } : {}) }); defs.push({ equip, id, service, NPS, cls, at: { on: 'top', dx: 0, dz: 0 } });
  };
  const offered = (NPS: number, cls: PipeClass) => NPS <= 12 && NPS * NPS * Number(cls.slice(1)) <= 1_800_000;
  // SW-RPI-9: a control station is the line's specification break: the part after it, and the destination's nozzle, take the destination's class where it is lower
  // where the destination is the battery limit, the part after it is the stream's line in everything but its number: its design pressure, temperature and class, higher or lower
  const after = new Map<number, { cls: PipeClass; designP: number; designT?: number }>();
  sh.lines.forEach((l, i) => {
    const zl = Z.lines[i]; if (!l.cv || !offered(zl.NPS, zl.cls)) return;
    if (l.to.k === 'bl') { const t = transferLine(l.to.name); if (t.cls !== zl.cls || t.designP !== zl.designP || t.designT !== zl.designT) after.set(i, { cls: t.cls, designP: t.designP, designT: t.designT }); return; }
    if (l.to.k !== 'eq') return;
    const ze = Z.equip.get(l.to.tag)!, P = (ze.sides[sideOf(sh.equip.get(l.to.tag)!, l.to.port, false)] ?? ze).designP, cls = classFor(P, zl.designT);
    if (Number(cls.slice(1)) < Number(zl.cls.slice(1))) after.set(i, { cls, designP: P });
  });
  // ---- nozzles of the equipment (SW-RPI-2) ----
  const nozzleId = (tag: string, port: string, body = 0) => { const b = bodies(tag)[body]; if (!b) throw new Error(`${tag}: no body ${body}`); return `${b.tag}-${port === 'S' || port === 'D' ? port : `N${Z.equip.get(tag)!.nozzles.findIndex(q => q.port === port) + 1}`}`; };
  /** SW-RPI-3: the bodies of an item in parallel in the order a line takes them: the first, then the others; for an item the flowsheet states is met at its nearest body (`nearest`), the one nearest the line's other end along the rack first, and the rest outward from it */
  const bodyOrder = (i: number, en: Extract<End, { k: 'eq' }>): number[] => {
    const bs = bodies(en.tag), all = bs.map((_, k) => k), l = sh.lines[i]; if (bs.length < 2 || sh.equip.get(en.tag)!.p.nearest === undefined) return all;
    const other = l.from === en ? l.to : l.from, ox = other.k === 'eq' ? bodies(other.tag)[0]?.x : undefined; if (ox === undefined) return all;
    return all.sort((a, b) => Math.abs(bs[a].x - ox) - Math.abs(bs[b].x - ox) || a - b);
  };
  // the far end of the line at a connection: the item and its port
  const farEnd = (tag: string, port: string) => { const l = sh.lines.find(q => [q.from, q.to].some(en => en.k === 'eq' && en.tag === tag && en.port === port)); if (!l) return undefined; const far = l.from.k === 'eq' && l.from.tag === tag && l.from.port === port ? l.to : l.from; return far.k === 'eq' ? far : undefined; };
  const anchorMemo = new Map<string, Map<string, Anchor>>();
  const anchorsFor = (e: Equip, k: number): Map<string, Anchor> => {
    const s = bodies(e.tag)[k], key = `${e.tag}|${k}`; let a = anchorMemo.get(key);
    if (!a) { a = anchorsOf(s, e, Z.equip.get(e.tag)!, port => { const far = farEnd(e.tag, port); return far ? bodies(far.tag)[0] : undefined; }, port => Z.utils.find(u => u.tag === e.tag && u.port === port)?.T, () => bodySolids(cell, s.tag),
      port => { const far = farEnd(e.tag, port), fe = far ? sh.equip.get(far.tag) : undefined; return far && fe && fe !== e && bodies(far.tag).length ? anchorsFor(fe, 0).get(far.port) : undefined; },
      () => cell.interior.equipment.find(q => q.tag === s.tag)); anchorMemo.set(key, a); }
    return a;
  };
  for (const e of sh.equip.values()) {
    const z = Z.equip.get(e.tag)!; if (!z.nozzles.length) continue;
    for (const [k, s] of bodies(e.tag).entries()) {
      const a = anchorsFor(e, k);
      for (const q of z.nozzles) { const an = a.get(q.port); if (!an) throw new Error(`${e.tag}: no place for "${q.port}"`); const cls = q.dir === 'in' && q.line !== undefined ? after.get(q.line)?.cls ?? q.cls : q.cls; addNozzle(nozzleId(e.tag, q.port, k), s.tag, q.port === 'S' ? 'suction' : q.port === 'D' ? 'discharge' : q.port, q.NPS, cls, an, s.z, an.S); }
    }
  }
  // ---- the line list (SW-RPI-3) ----
  const no = sh.lines.map((l, i) => lineNumber(unit, i + 1, Z.lines[i].NPS, Z.lines[i].cls, l.s.fluid));
  const tierY = (tier: number, NPS: number, cls: PipeClass) => up(RACK.tiers[tier] + 4 + pipeDims(NPS, cls).OD / 2);
  // SW-RPI-4: a battery limit end is a spool's inner nozzle; the spools are set once the lanes are known
  const pending: { tag: string; stream: string; dir: 'in' | 'out' }[] = [];
  const blEnd = (name: string, dir: 'in' | 'out'): EndRef => { const tag = `BL-${unit}${String(pending.length + 1).padStart(2, '0')}`; pending.push({ tag, stream: name, dir }); return { k: 'nozzle', id: `${tag}-U` }; };
  // SW-RPI-4: an item of the unit that stands on another plot is reached through a spool at the limit; a line with no end on this plot is that plot's
  const here = (en: End) => en.k === 'eq' && bodies(en.tag).length > 0, mine = new Map<number, boolean>();
  const onPlot = (i: number, depth = 0): boolean => { const k = mine.get(i); if (k !== undefined) return k; const l = sh.lines[i], v = here(l.from) || here(l.to) || (depth < 8 && [l.from, l.to].some(en => en.k === 'tap' && onPlot(en.line, depth + 1))) || ![l.from, l.to].some(en => en.k === 'eq'); mine.set(i, v); return v; };
  const endOf = (en: End, dir: 'in' | 'out', i?: number): EndRef => (en.k === 'eq' ? (here(en) ? { k: 'nozzle', id: nozzleId(en.tag, en.port, i === undefined ? 0 : bodyOrder(i, en)[0]) } : blEnd(`${en.tag} ${en.port}`, dir)) : en.k === 'tap' ? (onPlot(en.line) ? { k: 'tap', line: no[en.line], valve: false } : blEnd(`line ${no[en.line]}`, dir)) : blEnd(en.name, dir));
  // SW-RPI-9: a line with a control valve is divided at a station spool at grade under the rack; the part after the spool has a number of its own
  const stationPlans: { tag: string; ahead: UnitLine; after: UnitLine }[] = [], afterStation = new Map<number, string>();
  sh.lines.forEach((l, i) => {
    if (!onPlot(i)) return;
    const z = Z.lines[i]; if (z.n > 1) throw new Error(`${no[i]}: ${z.n} parallel lines are not piped yet`);
    const a = endOf(l.from, 'in', i), b = endOf(l.to, 'out', i), service = (routedFree(unit, i + 1) ? 'V' : serviceOf(l.s.fluid, z.cls, false)) as Service, rest = { unit, fluid: l.s.fluid, flow: i, designP: z.designP, designT: z.designT };
    if (!l.cv || !offered(z.NPS, z.cls)) { lines.push({ def: { no: no[i], service, NPS: z.NPS, cls: z.cls, from: a, to: b, kind: 'routed' }, seq: i + 1, origin: 'process', ...rest, ...(l.cv ? { cvOmitted: true } : {}) }); return; }
    const tag = `CS-${unit}${String(stationPlans.length + 1).padStart(2, '0')}`, n = 700 + stationPlans.length + 1, brk = after.get(i), cls2 = brk?.cls ?? z.cls, later = lineNumber(unit, n, z.NPS, cls2, l.s.fluid);
    const ahead: UnitLine = { def: { no: no[i], service, NPS: z.NPS, cls: z.cls, from: a, to: { k: 'nozzle', id: `${tag}-A` }, kind: 'routed', cv: true }, seq: i + 1, origin: 'process', station: tag, ...rest };
    const beyond: UnitLine = { def: { no: later, service: serviceOf(l.s.fluid, cls2, false) as Service, NPS: z.NPS, cls: cls2, from: { k: 'nozzle', id: `${tag}-B` }, to: b, kind: 'routed' }, seq: n, origin: 'control', station: tag, ...rest, ...(brk ? { designP: brk.designP, ...(brk.designT !== undefined ? { designT: brk.designT } : {}) } : {}) };
    lines.push(ahead, beyond); stationPlans.push({ tag, ahead, after: beyond }); afterStation.set(i, later);
  });
  // ---- utility headers (SW-RPI-5, SW-PRC-19): sized here, because the top tier's lanes start with them and a connection that has a control station is divided at it ----
  // the lane a header takes is as wide as the largest flange on its valved take-offs, with 3 in each side for the valves' bodies (SW-RT-2, SW-RK-7)
  // (a water connection over 12 in has no valve at its take-off, SW-RPI-3, and the generator widens a header's lane for valved take-offs only)
  const widthOf = (h: ReturnType<typeof unitHeaders>[number]) => Math.max(pipeDims(h.NPS, h.cls).OD, ...h.utils.filter(i => !(Z.utils[i].NPS > 12 && ['CWS', 'CWR', 'W'].includes(FLUIDS[Z.utils[i].fluid].svc))).map(i => { const c = connection(Z.utils[i]); return designFlange(c.NPS, c.cls).OD + 6; }));
  let heads = unitHeaders(unit, tag => bodies(tag).length > 0);   // a connection of an item on another plot is that plot's
  // SW-RPI-5: the generator lays the headers in the order given, each in the first lane from the centre line that is free; a header of 12 in and more whose spool would then stand nearer a
  // column of the main rack than its branch can pass is laid earlier, at the first place in the order where every such header is clear
  {
    const HWh = cell.rack.halfWidth, lanesOf = (order: typeof heads) => { const cs: number[] = []; for (let z = -(HWh - 24); z <= HWh - 24; z += 6) cs.push(z); cs.sort((p, q) => Math.abs(p) - Math.abs(q) || p - q); const put: { z: number; w: number }[] = []; return order.map(h => { const w = widthOf(h), z = cs.find(c => put.every(L => Math.abs(L.z - c) >= (L.w + w) / 2 + 3)); if (z !== undefined) put.push({ z, w }); return z; }); };
    const plotOf = PLOTS.find(q => q.unit === unit && q.kind === 'unit'), colR = mainColumnRound();
    const toX = (z: number) => { if (!plotOf) return undefined; const T = cellToSite(plotOf, cell); return T[8] * z + T[12] - PWY.west * 12; };
    const fine = (order: typeof heads) => lanesOf(order).every((z, k) => { const h = order[k]; if (h.NPS < 12 || z === undefined) return true; const x = toX(z); if (x === undefined) return true; const n = Math.round(x / PWY.bent); return Math.abs(x - n * PWY.bent) >= pipeDims(h.NPS, h.cls).OD / 2 + 3 + colR + 3; });
    if (!fine(heads)) {
      let found: typeof heads | undefined;
      for (const h of heads.filter(q => q.NPS >= 12)) { for (let at = 0; at < heads.length && !found; at++) { const rest = heads.filter(q => q !== h), order = [...rest.slice(0, at), h, ...rest.slice(at)]; if (fine(order)) found = order; } if (found) break; }
      if (!found) throw new Error(`unit ${unit}: no order of its headers keeps the spool of each of 12 in and more clear of the main rack's columns (SW-RPI-5)`);
      heads = found;
    }
  }
  const headers = heads.map((h, k) => ({ ...h, no: lineNumber(unit, 401 + k, h.NPS, h.cls, h.fluid), width: widthOf(h), z: undefined as number | undefined }));
  // SW-PRC-19, SW-RPI-9: a utility connection with a control station is divided at a station spool as a process line is: the part on the header's side is of the header's class and
  // conditions, the part on the item's side of the item's own. These stations are set after the process lines', in the places those leave
  const utilParts = new Map<number, { ahead: UnitLine; after: UnitLine }>();
  Z.utils.forEach((u, i) => {
    if (!bodies(u.tag).length) return; const c = connection(u); if (!c.station) return;
    if (!offered(c.NPS, c.cls) || !offered(c.NPS, u.cls)) throw new Error(`${u.tag} ${u.port}: no control valve of ${c.NPS} in is offered for its ${u.fluid} connection`);
    const h = headers.find(q => q.fluid === u.fluid)!, tag = `CS-${unit}${String(stationPlans.length + 1).padStart(2, '0')}`, n = 500 + i + 1, m = 551 + Z.utils.slice(0, i).filter(stationed).length;   // the part beyond the station among the utility numbers (SW-REF-3), in the order of the unit's connections that have one
    const nz: EndRef = { k: 'nozzle', id: nozzleId(u.tag, u.port) }, tap: EndRef = { k: 'tap', line: h.no, valve: true }, A: EndRef = { k: 'nozzle', id: `${tag}-A` }, B: EndRef = { k: 'nozzle', id: `${tag}-B` };
    const own = { cls: u.cls, designP: u.designP, designT: u.designT }, hdr = { cls: h.cls, designP: h.designP, designT: h.designT }, [c1, c2] = u.dir === 'to' ? [hdr, own] : [own, hdr];
    const part = (seq: number, q: typeof own, from: EndRef, to: EndRef, origin: UnitLine['origin'], cv: boolean): UnitLine => ({ def: { no: lineNumber(unit, seq, c.NPS, q.cls, u.fluid), service: serviceOf(u.fluid, q.cls, true, c.NPS, true) as Service, NPS: c.NPS, cls: q.cls, from, to, kind: 'routed', ...(cv ? { cv: true } : {}) }, unit, seq, fluid: u.fluid, origin, util: i, station: tag, designP: q.designP, designT: q.designT });
    const ahead = part(n, c1, u.dir === 'to' ? tap : nz, A, 'utility', true), after = part(m, c2, B, u.dir === 'to' ? nz : tap, 'control', false);
    stationPlans.push({ tag, ahead, after }); utilParts.set(i, { ahead, after });
  });
  // the stations: along the rack at grade, under its edge on the destination's side, as near the destination as those already set allow
  const xBay = RACK.start - RACK.bent + 30, rootX = new Map<string, number>();
  const xAt = (r: EndRef): number | undefined => (r.k !== 'nozzle' ? undefined : r.id.startsWith('BL-') ? xBay + 84 : rootX.get(r.id) ?? nozzles.get(r.id)!.face[0]);
  {
    // the rack's braced bays, whose rods come down to the column bases, are left clear
    const braced = [...new Set(cell.interior.instances.filter(q => q.tags.includes('bracing')).flatMap(q => q.tags.map(t => /^rack-bay:(\d+)$/.exec(t)?.[1]).filter((n): n is string => !!n)))].map(n => RACK.start - RACK.bent + Number(n) * RACK.bent);
    const zOf = (r: EndRef) => (r.k === 'nozzle' && !r.id.startsWith('BL-') ? nozzles.get(r.id)?.face[2] : undefined);
    /** the stations' places, taken in the order given */
    const layout = (order: typeof stationPlans) => { const set: { z: number; x0: number; x1: number; w: number }[] = [], put = new Map<string, { at: V3; dirA: 1 | -1; xd: number }>();
    for (const st of order) {
      const d = st.ahead.def, plain = 12 + gateFaceToFace(d.NPS, d.cls) + 2 * d.NPS + 24, LA = Math.max(plain, 12 + 12 * d.NPS + 96), LB = plain;
      const xd = xAt(st.after.def.to) ?? xAt(d.from) ?? cell.rack.x0 + 240, xs = xAt(d.from) ?? xd, dirA: 1 | -1 = xs <= xd ? -1 : 1, left = dirA < 0 ? LA : LB, right = dirA < 0 ? LB : LA;
      const wide = gateReach(d.NPS);       // the width a valve of its may take lying over on its side, where it cannot stand: stations side by side keep clear of each other by it
      const sgn = Math.sign(zOf(st.after.def.to) ?? zOf(d.from) ?? 1) || 1, lo = up(cell.rack.x0 + 24 + left);
      // a station whose line comes from or goes on to a connection beyond the rack's far end (a heater's) stands 15 ft short of that end at least: the generator runs that part of the line on the rack, and needs so much of it for a lane
      const beyondEnd = [xAt(st.after.def.to), xAt(d.from)].some(x => x !== undefined && x > cell.rack.x1 - 12), hi = down(Math.min(cell.rack.x1 - 24 - right, beyondEnd ? cell.rack.x1 - 12 - 180 : Infinity));
      let at: V3 | undefined;
      // files 3 ft apart under the rack: those of the destination's side from the outermost inward (a line rising from a station to its lane then comes up beside the tiers' middle
      // lanes, not under them), the centre line's, then the other side's from the centre outward; the outermost only where the valves' handwheels clear the columns
      const files: number[] = []; for (let v = HW - 36; v > 0; v -= 36) files.push(sgn * v); files.push(0); for (let v = 36; v <= HW - 36; v += 36) files.push(-sgn * v);
      const usable = files.filter(v => HW - Math.abs(v) >= gateReach(d.NPS) / 2 + RACK_COL / 2 + 6), own = usable.filter(v => v * sgn >= 0);
      // a station whose onward line climbs to a connection above the lowest tier, its far face toward that connection: not where this plan would count that line a rack line and the generator,
      // measuring from where the pieces on that face end, would not (between 20 ft and 20 ft and the outlet's length short of the connection)
      const on = st.after.def.to, dest = on.k === 'nozzle' && !/^(BL|RS|CS)-/.test(on.id) ? nozzles.get(on.id) : undefined, climbs = !!dest && dest.face[1] > RACK.tiers[0];
      const between = (x: number) => climbs && Math.sign(xd - x) === -dirA && Math.abs(x - xd) > 240 && Math.abs(x - xd) <= 240 + LB + 12;
      // and one whose line comes down to it from a connection above the lowest tier: not where the generator, measuring from the end of the station that stands on its near face, would send
      // that line free (within 20 ft) while its drop is long: there it stands either under that connection's own station or beyond the stretch
      const src = d.from.k === 'nozzle' && !/^(BL|RS|CS)-/.test(d.from.id) ? nozzles.get(d.from.id) : undefined, falls = !!src && src.face[1] > RACK.tiers[RACK.tiers.length - 1] + 108 && lines.some(l => l.def.service === 'V' && [l.def.from, l.def.to].some(e => { const q = e.k === 'nozzle' ? nozzles.get(e.id) : undefined; return !!q && q.equip === src.equip && q.u[1] === 0; }));   // (a vessel whose chase a line routed free crosses: the ways down before it are few)
      const short = (x: number) => falls && Math.abs(x - xs) > 60 && Math.abs((x + dirA * LA) - xs) <= 240 + 12 && Math.abs(x - xs) > 0;
      const free = (x: number, z: number) => x >= lo && x <= hi && !between(x) && !short(x) && set.every(q => q.x1 + 12 <= x - left || q.x0 - 12 >= x + right || Math.abs(q.z - z) >= q.w + wide + 3) && braced.every(b => b + RACK.bent + 12 <= x - left || b - 12 >= x + right);
      // on the destination's side wherever a place is free there within 20 ft along the rack of the nearest; failing that the nearest place on any file. Of two places the nearer comes first
      const seek = (zs: number[], steps: number) => { for (let k = 0; k <= steps && !at; k++) for (const x of k ? [near(xd) - 30 * k, near(xd) + 30 * k] : [Math.min(hi, Math.max(lo, near(xd)))]) for (const z of zs) if (!at && free(x, z)) at = [x, 36, z]; };
      seek(own, 8); seek(usable, 160);
      if (!at) throw new Error(`unit ${unit}: no room under the rack for the control station of ${d.no}`);
      set.push({ z: at[2], x0: at[0] - left, x1: at[0] + right, w: wide }); put.set(st.tag, { at, dirA, xd });
    }
    return put; };
    // SW-RPI-9: in the order the lines come; but a station whose onward line is not a process line (the generator will route it free, however far) and that found no place within
    // 20 ft of what it serves has its place before the others, and the rest are placed again
    let put = layout(stationPlans);
    const far = stationPlans.filter(st => st.after.def.service !== 'P' && st.after.def.NPS >= 3 && Math.abs(put.get(st.tag)!.at[0] - put.get(st.tag)!.xd) > 240);
    if (far.length) put = layout([...far, ...stationPlans.filter(st => !far.includes(st))]);
    for (const st of stationPlans) { const { at, dirA } = put.get(st.tag)!, d = st.ahead.def;
      addNozzle(`${st.tag}-A`, st.tag, 'control station', d.NPS, d.cls, { A: at, u: [dirA, 0, 0] }, at[2], 12);
      addNozzle(`${st.tag}-B`, st.tag, 'control station outlet', d.NPS, st.after.def.cls, { A: at, u: [-dirA, 0, 0] }, at[2], 12);
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
  // ---- SW-RPI-7: the tier and the lane of each line that runs the rack; then the battery limit spools in the valve bay (SW-RPI-4) ----
  const tierOf = new Map<string, number>(), laneOf = new Map<string, number>(), top = RACK.tiers.length - 1, feeds: HeaderFeed[] = []; let tierRoom = TIER_ROOM;
  /** the lanes on each tier: the headers', each rack line's, each root spool's */
  const foreseen: RackLane[] = [];
  {
    const xS = xBay, xOf = xAt;
    const clampX = (x: number) => Math.min(cell.rack.x1 - 12, Math.max(cell.rack.x0 + 12, up(x)));
    // the lines the generator will run on the rack (SW-RT-1): process lines with no tap whose ends are more than 20 ft apart along it
    const onRack = lines.filter(q => q.def.service === 'P' && q.def.from.k === 'nozzle' && q.def.to.k === 'nozzle').map(l => ({ l, xa: xOf(l.def.from)!, xb: xOf(l.def.to)!, OD: pipeDims(l.def.NPS, l.def.cls).OD })).filter(v => Math.abs(v.xa - v.xb) > 240);
    // SW-RPI-4: a battery limit valve stands stem up, the only way its neighbours leave it room; one that would reach the tier above stands on the top tier, and its line with it
    const atLimit = (d: LineDef) => [d.from, d.to].some(en => en.k === 'nozzle' && en.id.startsWith('BL-')), tallAtLimit = (d: LineDef) => atLimit(d) && gateReach(d.NPS) > RACK.tiers[1] - RACK.tiers[0] - 12;
    const CELL = 24, nx = Math.ceil(cell.rack.x1 / CELL) + 4, order = [...onRack].sort((p, q) => Number(tallAtLimit(q.l.def)) - Number(tallAtLimit(p.l.def)) || q.l.def.NPS - p.l.def.NPS || Math.abs(q.xa - q.xb) - Math.abs(p.xa - p.xb));
    // the tiers a line may run on, in the order they are tried: one too large to turn out between two tiers the lowest or the top (the top first where one of its ends stands above the rack: it leaves
    // the lowest tier downward only); one to or from an air cooler from the top down; any other from the lowest up
    const all = [...RACK.tiers.keys()], cooler = (r: EndRef) => r.k === 'nozzle' && cell.spots.some(sp => sp.lane === 'air' && sp.tag === nozzles.get(r.id)?.equip);
    const above = (r: EndRef) => r.k === 'nozzle' && !/^(BL|RS)-/.test(r.id) && (nozzles.get(r.id)?.face[1] ?? 0) > RACK.tiers[top];
    // a 12 in line cannot turn in between two tiers either (the generator's straight between two elbows is 42 in for it, SW-RT-4): with both its ends above the lowest tier it runs the top one
    const item = (r: EndRef) => r.k === 'nozzle' && !/^(BL|RS)-/.test(r.id), high = (r: EndRef) => item(r) && (nozzles.get((r as { id: string }).id)?.face[1] ?? 0) > RACK.tiers[0];
    const allowed = (d: LineDef): number[] => (tallAtLimit(d) ? [top] : d.NPS >= BIG ? ([d.from, d.to].some(above) ? [top, 0] : [0, top]) : d.NPS >= 12 && high(d.from) && high(d.to) ? [top] : [d.from, d.to].some(cooler) ? [...all].reverse() : all);
    // the beams that cross the rack under the lowest tier (each bent's, and the one midway between bents), as the generator holds them: a line of 12 in and larger comes up into that tier at the
    // station of its end and nowhere else, and where its riser would foul one of them the lowest tier is not for it
    const crossing = staticObstacles([], cell.interior.instances.filter(i => i.tags.some(g => /^rack-(bent|bay):/.test(g)) && (i.tags.includes('beam') || i.tags.includes('intermediate-beam')))).obstacles
      .filter((o): o is Extract<Obstacle, { kind: 'cap' }> => o.kind === 'cap' && Math.abs(o.a[0] - o.b[0]) < 1 && Math.abs(o.a[1] - RACK.tiers[0]) < 24);
    const fouls = (x: number, OD: number) => crossing.some(o => Math.abs(x - o.a[0]) < o.r + OD / 2 + 3 + 3);   // the generator's clearance (SW-RT-3) and half a square of its grid
    // SW-RPI-7: a lane no nearer the rack's columns than the generator will lay that pipe: its own test, made at one bent. It holds a column as the grid squares whose centres lie within the
    // column's half-diagonal and a square's half-diagonal of its axis, each reaching toward the lane by what of the column's half-diagonal lies beyond it (never less than nothing), and
    // keeps a line's centre its radius and 3 in from the nearest
    const posts = staticObstacles([], cell.interior.instances.filter(i => i.tags.some(g => /^rack-bent:/.test(g)) && i.tags.includes('column'))).obstacles.filter((o): o is Extract<Obstacle, { kind: 'cap' }> => o.kind === 'cap');
    const xb = posts.length ? posts[0].a[0] : 0, squares = posts.filter(o => Math.abs(o.a[0] - xb) < 1).flatMap(o => {
      const q = Math.max(o.r, 1.5) + 3 * Math.sqrt(3), out: { p: V3; reach: number }[] = [], y0 = Math.min(o.a[1], o.b[1]), y1 = Math.max(o.a[1], o.b[1]);
      for (let x = down(xb - q); x <= xb + q; x += 6) for (let y = Math.max(0, down(y0 - q)); y <= y1 + q; y += 6) for (let z = down(o.a[2] - q); z <= o.a[2] + q; z += 6) { const d = Math.hypot(x - xb, y - Math.min(y1, Math.max(y0, y)), z - o.a[2]); if (d <= q) out.push({ p: [x, y, z], reach: Math.max(0, Math.max(o.r, 1.5) - d) }); }
      return out; });
    const pastColumns = (t: number, z: number, NPS: number, cls: PipeClass) => { const y = tierY(t, NPS, cls), r = pipeDims(NPS, cls).OD / 2; return !squares.some(s => Math.abs(s.p[1] - y) <= r + 12 && Math.abs(s.p[2] - z) <= r + 12 && [-12, -6, 0, 6, 12].some(dx => Math.hypot(s.p[0] - (xb + dx), s.p[1] - y, s.p[2] - z) - s.reach < r + 3)); };
    // (an item's connection that does not point along the rack: the line's station on the rack is then the connection's own; one that points along it ends its valves somewhere the plan does not know)
    const square = (r: EndRef) => item(r) && Math.abs(nozzles.get((r as { id: string }).id)?.u[0] ?? 1) < 0.5;
    // the half of the rack both a line's ends stand on, if they stand on one (a spool on the rack is on neither)
    const zEnd = (r: EndRef) => (r.k === 'nozzle' && !r.id.startsWith('BL-') ? nozzles.get(r.id)?.face[2] : undefined);
    const half = (d: LineDef) => { const zs = [zEnd(d.from), zEnd(d.to)].filter((v): v is number => v !== undefined); return zs.length && zs.every(z => z > 0) ? 1 : zs.length && zs.every(z => z < 0) ? -1 : 0; };
    // a line sent to the top tier because its riser would foul a beam, its ends on the two sides of the rack: the half of its higher end first (it comes onto the rack from that side, and the half its lower end stands on is left to the lines of that side)
    const upper = (d: LineDef) => { if (d.NPS < 12 || !item(d.from) || !item(d.to)) return 0; const p = nozzles.get((d.from as { id: string }).id)!, q = nozzles.get((d.to as { id: string }).id)!; return p.face[2] * q.face[2] >= 0 || p.face[1] === q.face[1] ? 0 : Math.sign((p.face[1] > q.face[1] ? p : q).face[2]); };
    // lanes: every 6 in across the tier, from the centre line outward; the headers first on the top tier, by the generator's own spacing among themselves (SW-RT-2, SW-RK-7)
    const cands: number[] = []; for (let z = -(HW - 24); z <= HW - 24; z += 6) cands.push(z); cands.sort((p, q) => Math.abs(p) - Math.abs(q) || p - q);
    const over = (L: RackLane, x0: number, x1: number) => !(L.x1 < x0 - 24 || L.x0 > x1 + 24);
    for (const h of headers) { const z = cands.find(c => foreseen.every(L => Math.abs(L.z - c) >= (L.OD + h.width) / 2 + 3)); if (z !== undefined) { foreseen.push({ t: top, z, OD: h.width, x0: cell.rack.x0, x1: cell.rack.x1 }); h.z = z; } }
    // SW-RPI-15: in the valve bay a header is as wide as its flange (its block valve stands there): a line that passes it keeps a pipe's width and 4 in from that flange
    for (const h of headers) if (h.z !== undefined) foreseen.push({ t: top, z: h.z, OD: designFlange(h.NPS, h.cls).OD + 2, x0: RACK.start - RACK.bent, x1: cell.rack.x0 });
    const headerPlan = [...foreseen];
    /** a lane's centre far enough from every lane taken on its tier over the stretch (the line `own` apart) */
    const free = (taken: RackLane[], t: number, z: number, OD: number, x0: number, x1: number, own?: string) => taken.every(L => L.t !== t || (own !== undefined && L.no === own) || !over(L, x0, x1) || Math.abs(L.z - z) >= laneSpacing(L.OD, OD));
    // SW-RPI-8: a branch that starts at a root spool has its lane where the spool's valves, which stand stem up between the lanes beside it, have their width too
    const spoolOf = new Map(rootPlans.map(r => [r.main.def.no, r])), spoolWidth = (d: LineDef) => Math.max(designFlange(d.NPS, d.cls).OD, gateWidth(d.NPS, d.cls) + 3);
    const most = TIER_SHARE * (2 * HW - 48);
    /** largest first, each on the first tier allowed it that it does not load beyond `room` at any section of its run (the top tier, for a line that is to go there first: beyond 85 % of its lanes) and that has a lane free for it; undefined if a line fits none */
    const share = (room: number): RackLane[] | undefined => {
      const load = RACK.tiers.map((_, t) => new Float64Array(nx).fill(t === top ? headers.reduce((a, h) => a + h.width + 3, 0) : 0)), taken = [...headerPlan];
      // SW-RPI-8 (amended 2026-11-27, SW-RPI-22): a branch's root spool on its parent's tier, its connection taken off by a tee (an olet for a branch of half the run or less, SW-SWT-6;
      // butt welded, SW-SPEC-1): the tee on the parent's run points across the rack at the spool, and the spool stands no nearer the parent's lane than the tee's lead point toward it
      // and one grid step (the tee's centre-to-end of its outlet and the connection's elbow radius, out to the 6 in grid, and 6 in: 36 in for a 10 in connection). Whichever of the
      // branch and its parent is planned second keeps that distance from the other's lane; the spool stands in the branch's lane, and the lines planned after take theirs around it
      const apart = rootPlans.flatMap(r => {
        const p = lines.find(l => l.def.no === r.parent)?.def, c = r.root.def, tap = [c.from, c.to].find((e): e is Extract<EndRef, { k: 'tap' }> => e.k === 'tap');
        if (!p || !tap || p.NPS < 2 || (tap.via ?? (c.NPS <= p.NPS / 2 ? 'olet' : 'tee')) !== 'tee') return [];
        return [{ pair: [r.main.def.no, r.parent], d: up(teeC(pipeDims(p.NPS, p.cls).OD) + elbowRadius(pipeDims(c.NPS, c.cls).OD)) + 6 }];
      });
      const keepsApart = (no: string, t: number, z: number) => apart.every(q => { const i = q.pair.indexOf(no), L = i < 0 ? undefined : taken.find(x => x.no === q.pair[1 - i]); return !L || L.t !== t || Math.abs(L.z - z) >= q.d; });
      for (const v of order) {
        const i0 = Math.max(0, Math.floor((Math.min(v.xa, v.xb) - 36) / CELL)), i1 = Math.min(nx - 1, Math.ceil((Math.max(v.xa, v.xb) + 36) / CELL)), w = v.OD + 3;
        const a0 = clampX(v.xa), b0 = clampX(v.xb), x0 = Math.min(a0, b0), x1 = Math.max(a0, b0), s0 = half(v.l.def);
        // on the lowest tier no lane over the stringer that runs under the tier's centre line (SW-RK-6): a line leaves that tier downward, and the generator holds the stringer 9 in wide of its axis
        const clearOf = (t: number, c: number) => t > 0 || Math.abs(c) >= v.OD / 2 + STRINGER;
        const d = v.l.def, rp = spoolOf.get(d.no), wide = rp ? spoolWidth(d) : 0, may = allowed(d), sent = d.NPS >= 12 && may.includes(0) && ((square(d.from) && fouls(a0, v.OD)) || (square(d.to) && fouls(b0, v.OD))), tiersOf = sent ? [top] : may, topFirst = tiersOf[0] === top;
        const s = s0 || (sent && may[0] === 0 ? upper(d) : 0), zs = s ? [...cands.filter(c => c * s >= 0), ...cands.filter(c => c * s < 0)] : cands;
        const fits = (k: number) => { let m = 0; for (let i = i0; i <= i1; i++) m = Math.max(m, load[k][i]); return m + w <= (topFirst && k === top ? Math.max(room, most) : room); };
        let put: RackLane | undefined;
        for (const t of tiersOf) { if (!fits(t)) continue; const z = zs.find(c => clearOf(t, c) && pastColumns(t, c, d.NPS, d.cls) && free(taken, t, c, v.OD, x0 - 36, x1 + 36) && (!rp || free(taken, t, c, wide, rp.x - 60, rp.x + 60)) && keepsApart(d.no, t, c)); if (z !== undefined) { put = { t, z, OD: v.OD, x0, x1, no: d.no }; break; } }
        if (!put) { stuck = `${d.no}, ${Math.round(x0)} to ${Math.round(x1)} along the rack, tiers ${tiersOf.map(k => k + 1).join(' or ')}: ${tiersOf.map(k => (fits(k) ? `no lane free on tier ${k + 1}` : `tier ${k + 1} full`)).join(', ')}`; return undefined; }
        for (let i = i0; i <= i1; i++) load[put.t][i] += w;
        taken.push(put); if (rp) taken.push({ t: put.t, z: put.z, OD: wide, x0: rp.x - 60, x1: rp.x + 60 });
      }
      return taken;
    };
    let planned: RackLane[] | undefined, stuck = '';
    for (tierRoom = TIER_ROOM; tierRoom <= most && !planned; tierRoom += 12) planned = share(tierRoom);
    if (!planned) throw new Error(`unit ${unit}: the lines that run its rack do not fit its ${RACK.tiers.length} tiers at ${Math.round(most)} in of lanes each (the first without a lane: ${stuck})`);
    tierRoom -= 12;
    for (const L of planned.slice(headerPlan.length)) { foreseen.push(L); if (L.no === undefined) continue; tierOf.set(L.no, L.t); laneOf.set(L.no, L.z); lines.find(l => l.def.no === L.no)!.tier = L.t; }
    const taken = foreseen;
    // SW-RPI-8: each root spool in its branch's lane on its tier, which was given wide enough at that place for the spool's valves; the spool of a branch that
    // does not run the rack, in the free place nearest the rack's centre line on the lowest tier
    for (const r of rootPlans) {
      const d = r.main.def, t = tierOf.get(d.no) ?? 0, zl = laneOf.get(d.no), wide = spoolWidth(d);
      const z = zl ?? cands.find(c => free(taken, t, c, wide, r.x - 60, r.x + 60)) ?? 0, at: V3 = [r.x, tierY(t, d.NPS, d.cls), z];
      addNozzle(`${r.tag}-B`, r.tag, 'branch root', d.NPS, d.cls, { A: at, u: [r.dir, 0, 0] }, z, 12);
      addNozzle(`${r.tag}-A`, r.tag, 'branch root', d.NPS, d.cls, { A: at, u: [-r.dir, 0, 0] }, z, 12);
      if (zl === undefined) taken.push({ t, z, OD: wide, x0: r.x - 60, x1: r.x + 60 });
      roots.push({ tag: r.tag, line: d.no, connection: r.root.def.no, parent: r.parent, at, tier: t });
    }
    // SW-RPI-4: each tier's spools stand on the lanes their lines run in, so that each line passes the limit straight; where two neighbours' flanges
    // would be closer than 6 in the row is spread just enough, keeping its order and its middle. A line with no lane of its own stands beyond the
    // row's end, on the side of the rack its far end is on; one whose valve is too tall to stand under another tier, on the highest tier in use
    const highest = Math.max(0, ...tierOf.values());
    // the line that ends at each spool: the flowsheet's, or the part of it after its control station
    const lineAt = (tag: string) => lines.find(l => [l.def.from, l.def.to].some(en => en.k === 'nozzle' && en.id === `${tag}-U`))!.def;
    const spoolTier = (d: LineDef) => tierOf.get(d.no) ?? (tallAtLimit(d) ? highest : 0);
    const farZ = (d: LineDef) => { const en = [d.from, d.to].find(q => !(q.k === 'nozzle' && q.id.startsWith('BL-'))); return en && en.k === 'nozzle' ? nozzles.get(en.id)?.face[2] ?? 0 : 0; };
    // SW-RPI-4, SW-RPI-15: on the top tier every spool stands on its own lane, a header's in its header's lane, and the spools are taken in turn across the rack into two
    // rows, the second at the bay's middle: neighbours' valves then stand 7 ft 6 in apart along the rack. A spool with no lane stands beyond the row's end
    const topRow = () => {
      type S = { tag: string; stream: string; dir: 'in' | 'out'; no: string; NPS: number; cls: PipeClass; lane?: number; far: number; header: boolean };
      const od = (q: S) => pipeDims(q.NPS, q.cls).OD, f = (q: S) => designFlange(q.NPS, q.cls).OD, w = (q: S) => gateWidth(q.NPS, q.cls), e = (q: S) => Math.max(f(q) / 2, od(q) / 2 + 3 + RACK_COL - 12);
      // two spools of one row a flange and 6 in apart, or their handwheels and 3 in; a line passing a spool of the other row a pipe's width and 4 in from its flange
      const beside = (a: S, b: S) => Math.max((f(a) + f(b)) / 2 + 6, (w(a) + w(b)) / 2 + 3), past = (a: S, b: S) => Math.max(od(a) + f(b), f(a) + od(b)) / 2 + 4;
      const all: S[] = [...pending.map(q => ({ q, d: lineAt(q.tag) })).filter(v => spoolTier(v.d) === top).map(v => ({ tag: v.q.tag, stream: v.q.stream, dir: v.q.dir, no: v.d.no, NPS: v.d.NPS, cls: v.d.cls, lane: laneOf.get(v.d.no), far: farZ(v.d), header: false })),
        ...headers.filter(h => h.z !== undefined).map((h, k) => ({ tag: `BL-${unit}${String(pending.length + k + 1).padStart(2, '0')}`, stream: h.key, dir: (h.takes >= h.makes ? 'in' : 'out') as 'in' | 'out', no: h.no, NPS: h.NPS, cls: h.cls, lane: h.z, far: 0, header: true }))];
      const row = all.filter(q => q.lane !== undefined).sort((a, b) => a.lane! - b.lane!), zOf = new Map<S, number>(row.map(q => [q, q.lane!]));
      for (const q of all.filter(v => v.lane === undefined)) {
        if (!row.length) { zOf.set(q, 0); row.push(q); }
        else if (q.far >= 0) { const hi = row[row.length - 1]; zOf.set(q, zOf.get(hi)! + up(beside(hi, q))); row.push(q); }
        else { const lo = row[0]; zOf.set(q, zOf.get(lo)! - up(beside(lo, q))); row.unshift(q); }
      }
      row.forEach((q, k) => {
        const z = zOf.get(q)!, at: V3 = [k % 2 ? RACK.start - RACK.bent / 2 : xS, tierY(top, q.NPS, q.cls), z];
        if (k > 0 && z - zOf.get(row[k - 1])! < past(row[k - 1], q) - 1e-6) throw new Error(`unit ${unit}: on the top tier the spools ${row[k - 1].tag} and ${q.tag} stand ${z - zOf.get(row[k - 1])!} in apart on their lanes, and a line passing a flange needs ${past(row[k - 1], q).toFixed(1)} (SW-RPI-4)`);
        if (k > 1 && z - zOf.get(row[k - 2])! < beside(row[k - 2], q) - 1e-6) throw new Error(`unit ${unit}: on the top tier the spools ${row[k - 2].tag} and ${q.tag}, of one row, stand ${z - zOf.get(row[k - 2])!} in apart on their lanes, and their valves need ${beside(row[k - 2], q).toFixed(1)} (SW-RPI-4)`);
        if (Math.abs(z) + e(q) > HW - 12 + 1e-6) throw new Error(`unit ${unit}: the top tier's battery limit spools do not fit the rack's width (${q.tag} at ${z} in)`);
        addNozzle(`${q.tag}-U`, q.tag, q.dir === 'in' ? 'battery limit in' : 'battery limit out', q.NPS, q.cls, { A: at, u: [1, 0, 0] }, z, 12);
        addNozzle(`${q.tag}-P`, q.tag, 'pipeway side', q.NPS, q.cls, { A: at, u: [-1, 0, 0] }, z, 12);
        spools.push({ tag: q.tag, stream: q.stream, dir: q.dir, line: q.no, NPS: q.NPS, cls: q.cls, at, tier: top, ...(q.lane !== undefined ? { lane: q.lane } : {}), ...(q.header ? { header: true } : {}) });
        // SW-RPI-15: a header's block valve, a stub on the spool's inner face
        if (q.header) { const h = headers.find(v => v.no === q.no)!; feeds.push({ tag: q.tag, header: q.no, z, stub: { no: lineNumber(unit, 451 + headers.indexOf(h), q.NPS, q.cls, h.fluid), service: serviceOf(h.fluid, q.cls, true, q.NPS) as Service, NPS: q.NPS, cls: q.cls, from: { k: 'nozzle', id: `${q.tag}-U` }, to: { k: 'blind' }, kind: 'stub' } }); }
      });
    };
    for (const t of RACK.tiers.keys()) {
      if (t === top) { topRow(); continue; }
      // `e`: how far a spool reaches toward the rack's edge: its flange, or its line with the 3 in it keeps from the columns of the bay's first bent (which stand RACK_COL inside the half-width, 12 in further than the flanges' limit)
      const want = pending.map(q => ({ p: q, d: lineAt(q.tag) })).filter(q => spoolTier(q.d) === t).map(q => ({ ...q, lane: laneOf.get(q.d.no), f: designFlange(q.d.NPS, q.d.cls).OD, w: gateWidth(q.d.NPS, q.d.cls), e: Math.max(designFlange(q.d.NPS, q.d.cls).OD / 2, pipeDims(q.d.NPS, q.d.cls).OD / 2 + 3 + RACK_COL - 12) })); if (!want.length) continue;
      type W = typeof want[number];
      // neighbours a flange and 6 in apart, and their valves' handwheels, which stand side by side stem up, 3 in apart
      const laned = want.filter(w => w.lane !== undefined).sort((p, q) => p.lane! - q.lane!), loose = want.filter(w => w.lane === undefined), pitch = (a: W, b: W) => up(Math.max((a.f + b.f) / 2 + 6, (a.w + b.w) / 2 + 3)), zOf = new Map<W, number>(), limit = HW - 12;
      laned.forEach((w, k) => zOf.set(w, k ? Math.max(w.lane!, zOf.get(laned[k - 1])! + pitch(laned[k - 1], w)) : w.lane!));
      if (laned.length) { const drift = near(laned.reduce((a, w) => a + zOf.get(w)! - w.lane!, 0) / laned.length); for (const w of laned) zOf.set(w, zOf.get(w)! - drift); }
      let lo = laned[0] as W | undefined, hi = laned[laned.length - 1] as W | undefined;
      for (const w of loose) {
        if (!lo || !hi) { zOf.set(w, 0); lo = hi = w; continue; }
        if (farZ(w.d) >= 0) { zOf.set(w, zOf.get(hi)! + pitch(hi, w)); hi = w; } else { zOf.set(w, zOf.get(lo)! - pitch(lo, w)); lo = w; }
      }
      // the row as a whole within the rack's width
      const row = [...want].sort((p, q) => zOf.get(p)! - zOf.get(q)!), z0 = zOf.get(row[0])! - row[0].e, z1 = zOf.get(row[row.length - 1])! + row[row.length - 1].e;
      const slide = z1 > limit ? -up(z1 - limit) : z0 < -limit ? up(-limit - z0) : 0; if (slide) for (const w of row) zOf.set(w, zOf.get(w)! + slide);
      let two = false, pos = row.map(w => zOf.get(w)!), shift = 0;
      if (z1 - z0 > 2 * limit) {
        // too many for one row on their lanes: side by side a flange and 6 in apart about the rack's centre line, in two rows taken in turn where one is too wide,
        // the second beyond the bay's mid beam (a spool's line then passes between the valves of the other row, a pipe's width from a flange)
        const od = (w: W) => pipeDims(w.d.NPS, w.d.cls).OD;
        const lay = (twoRows: boolean) => { const q: number[] = []; row.forEach((w, k) => { if (!k) { q.push(0); return; } const a = row[k - 1], near1 = twoRows ? Math.max(od(a) + w.f, a.f + od(w)) / 2 + 4 : pitch(a, w), same = twoRows && k > 1 ? q[k - 2] + (row[k - 2].f + w.f) / 2 + 6 - q[k - 1] : 0; q.push(q[k - 1] + up(Math.max(near1, same))); }); return q; };
        pos = lay(false); if (pos[pos.length - 1] - pos[0] + row[0].e + row[row.length - 1].e > 2 * limit) { two = true; pos = lay(true); }
        shift = near((pos[0] + pos[pos.length - 1]) / 2);
      }
      row.forEach((w, k) => {
        const zl = w.d, zs = pos[k] - shift, at: V3 = [two && k % 2 ? RACK.start - RACK.bent / 2 : xS, tierY(t, zl.NPS, zl.cls), zs];
        if (Math.abs(zs) + w.e > limit + 1e-6) throw new Error(`unit ${unit}: the battery limit spools of tier ${t + 1} do not fit the rack's width (${Math.round(pos[pos.length - 1] - pos[0])} in in ${two ? 'two rows' : 'one row'})`);
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
        // where the first body's line is itself a branch (it ends at a tee on another line), the further body joins that same line with a tee of its own: the first body's
        // connection may be no longer than its valves, with no straight piece for a tee
        // (not where that branch was given a root spool on the rack, SW-RPI-8: its tee is then far off, and the further body joins the branch itself)
        const other = into ? l.from : l.to, direct = lines.some(q => q.flow === i && (q.origin === 'process' || q.origin === 'control') && (into ? q.def.from : q.def.to).k === 'tap');
        const main = other.k === 'tap' && direct && onPlot(other.line) ? afterStation.get(other.line) ?? no[other.line] : undefined;
        const nz: EndRef = { k: 'nozzle', id: nozzleId(en.tag, en.port, bodyOrder(i, en)[b]) }, tap: EndRef = { k: 'tap', line: main ?? (into ? afterStation.get(i) ?? no[i] : no[i]), valve: false }, n = ++seq;   // SW-RPI-9: at the destination, the part after the station
        const brk = into && afterStation.has(i) ? after.get(i) : undefined, cls = brk?.cls ?? z.cls;
        const free = routedFree(unit, i + 1);   // SW-RPI-3: a branch of a line routed free is routed free with it (the generator routes a process line's branches before any line that is not one)
        lines.push({ def: { no: lineNumber(unit, n, z.NPS, cls, l.s.fluid, free), service: (free ? 'V' : serviceOf(l.s.fluid, cls, false)) as Service, NPS: z.NPS, cls, from: into ? tap : nz, to: into ? nz : tap, kind: 'routed' }, unit, seq: n, fluid: l.s.fluid, origin: 'spare', flow: i, designP: brk?.designP ?? z.designP, designT: brk?.designT ?? z.designT });
      }
    }
  });
  // ---- utility headers on the rack's top tier and the connections that tap them (SW-RPI-5) ----
  const headerLanes: HeaderLane[] = [];
  headers.forEach((h, k) => {
    headerLanes.push({ line: h.no, z: h.z });
    lines.push({ def: { no: h.no, service: serviceOf(h.fluid, h.cls, true, h.NPS) as Service, NPS: h.NPS, cls: h.cls, from: { k: 'blind' }, to: { k: 'blind' }, kind: 'header' }, unit, seq: 401 + k, fluid: h.fluid, origin: 'header', designP: h.designP, designT: h.designT });
  });
  Z.utils.forEach((u, i) => {
    if (!bodies(u.tag).length) return;
    const parts = utilParts.get(i); if (parts) { lines.push(parts.ahead, parts.after); return; }   // SW-RPI-9: divided at its control station
    const nz: EndRef = { k: 'nozzle', id: nozzleId(u.tag, u.port) }, tap: EndRef = { k: 'tap', line: headers.find(h => h.fluid === u.fluid)!.no, valve: !(u.NPS > 12 && ['CWS', 'CWR', 'W'].includes(FLUIDS[u.fluid].svc)) }, n = 500 + i + 1;   // SW-RPI-3: a water connection over 12 in has its one valve at the item
    lines.push({ def: { no: lineNumber(unit, n, u.NPS, u.cls, u.fluid), service: serviceOf(u.fluid, u.cls, true, u.NPS, true) as Service, NPS: u.NPS, cls: u.cls, from: u.dir === 'to' ? tap : nz, to: u.dir === 'to' ? nz : tap, kind: 'routed' }, unit, seq: n, fluid: u.fluid, origin: 'utility', util: i, designP: u.designP, designT: u.designT });
  });
  void designPressure; void designTemperature; void lineSize; void utilState; void classFor;

  // ---- before the generator runs: no two nozzles' valve stacks may stand in each other's way (SW-RPI-2) ----
  { const all = [...nozzles.values()].filter(q => q.service !== 'pipeway side'), env = (q: Nozzle) => { const f = designFlange(q.NPS, q.cls); return { a: q.face, b: [q.face[0] + q.u[0] * (gateFaceToFace(q.NPS, q.cls) + 12), q.face[1] + q.u[1] * (gateFaceToFace(q.NPS, q.cls) + 12), q.face[2] + q.u[2] * (gateFaceToFace(q.NPS, q.cls) + 12)] as V3, r: f.OD / 2 }; };
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) { const p = env(all[i]), q = env(all[j]), d = segDist(p.a, p.b, q.a, q.b); if (d < p.r + q.r + 1) notes.push(`nozzles ${all[i].id} and ${all[j].id} stand ${d.toFixed(1)} in apart, their flanges need ${(p.r + q.r + 1).toFixed(1)}`); } }
  // ---- SW-RPI-14: the ends at which the generator's valve is not built ----
  {
    const itemOf = (id: string) => { const q = nozzles.get(id), sp = q ? cell.spots.find(v => v.tag === q.equip) : undefined; return q && sp ? { q, sp, e: sh.equip.get(sp.item)! } : undefined; }, bareFlow = new Set<number>();
    sh.lines.forEach((l, i) => {
      if (l.from.k !== 'eq' || !here(l.from)) return; const fe = sh.equip.get(l.from.tag)!;
      if (fe.kind === 'heater' && l.from.port === 'outlet' && l.to.k === 'eq' && ['column', 'reactor'].includes(sh.equip.get(l.to.tag)!.kind)) bareFlow.add(i);                 // a transfer line
      if (fe.kind === 'cracker' && ['flue gas', 'reactor vapour'].includes(l.from.port)) bareFlow.add(i);                                                                         // the regenerator's flue gas to its cooler; the reactor's vapour to its fractionator
      if (fe.kind === 'fluegascooler' && l.from.port === 'outlet' && l.to.k === 'eq' && sh.equip.get(l.to.tag)!.kind === 'scrubber') bareFlow.add(i);                              // the cooled flue gas to the scrubber
      if (fe.kind === 'ejector') bareFlow.add(i);                                                                                                                              // a tail pipe, or the last condenser's outlet
      if (fe.kind === 'column') { const q = nozzles.get(nozzleId(l.from.tag, l.from.port)), sp = bodies(l.from.tag)[0]; if (q && sp.shape === 'vv' && q.u[1] > 0 && (q.plan?.A ?? q.A)[1] >= sp.yt! - 1e-6) bareFlow.add(i); }   // from a column's top
    });
    for (const l of lines) {
      const ends = (['from', 'to'] as const).filter(side => { const en = l.def[side]; if (en.k !== 'nozzle') return false; const it = itemOf(en.id); return !!it && (it.e.kind === 'ejector' || (it.e.kind === 'cracker' && it.q.service === 'regenerator air') || (l.flow !== undefined && bareFlow.has(l.flow) && (l.origin === 'process' || l.origin === 'control'))); });
      if (ends.length) l.bare = ends;
    }
  }
  const list = [...lines.map(l => l.def), ...feeds.map(f => f.stub)], byNo = new Map(list.map(l => [l.no, l]));   // SW-RPI-15: with each header's block valve at the limit, a stub
  // a unit has no building: its "drawing" is its plot's extent, for what frames a view of it
  const building: BuildingModel = { instances: [], derived: {}, notes: [], drawing: { bays: Math.ceil(cell.x1 / RACK.bent), bayFt: RACK.bent / 12, widthFt: Math.ceil(2 * Math.max(-cell.z0, cell.z1) / 12), eaveFt: 0, slopeRisePer12: 0, slabIn: 0 } } as unknown as BuildingModel;
  // ---- SW-RPI-6: where lines may travel. The generator is shown solid blocks (not part of the model) that leave open only where
  // there is steel to carry a pipe: from 9 ft above the top tier upward, everywhere but within 12 ft of a body that has a connection
  // up there; and beyond the yard's support beams, above them ----
  const limit = RACK.tiers[RACK.tiers.length - 1] + 108, gridTop = up(Math.max(cell.y1 + 120, limit + 96, ...[...nozzles.values()].filter(q => q.u[1] > 0).map(q => q.face[1] + valveDrop(q.NPS, q.cls) + 72))),   // room above the highest connection for its valve and the turn after it
     G = { x0: 0, x1: up(cell.x1 + 60), z0: down(cell.z0 - 60), z1: up(cell.z1 + 60) };
  // a body has a connection up there if one stands within 5 ft of that level, or if the valve standing up from one on top of it reaches above the yard's beams
  const high = (q: Nozzle) => q.face[1] > limit - 60 || (q.u[1] > 0 && q.face[1] + valveDrop(q.NPS, q.cls) + 12 > YARD + 18);
  const tall = new Set([...nozzles.values()].filter(high).map(q => q.equip)), reach = new Map<string, number>(), reaches = (tag: string, y: number) => reach.set(tag, Math.max(reach.get(tag) ?? 0, y));
  // how high each such body's lines need room: over an upward connection its valve and the turn after it, beside any other a handwheel, and 6 ft
  for (const q of nozzles.values()) if (high(q)) reaches(q.equip, q.face[1] + (q.u[1] > 0 ? valveDrop(q.NPS, q.cls) : gateReach(q.NPS)) + 72);
  // an ejector set's room reaches as high as the room of the column whose overhead it takes: that line runs back from the column's top at the top's own level
  for (const l of lines) { const a = l.def.from, b = l.def.to; if (a.k !== 'nozzle' || b.k !== 'nozzle') continue; const na = nozzles.get(a.id)!, sa = cell.spots.find(sp => sp.tag === na.equip), sb = cell.spots.find(sp => sp.tag === nozzles.get(b.id)!.equip); if (sa && sb && sb.kind === 'ejector' && sa.shape === 'vv' && na.u[1] > 0) reaches(sb.tag, reach.get(sa.tag) ?? 0); }
  type Rect = { x0: number; x1: number; z0: number; z1: number };
  // the room such a body's lines need: for a vertical vessel a chase on the side that faces the rack, 2 ft wider than the shell on either hand and
  // 10 ft beyond it (its lines stand on that side and come down there); for any other body, 6 ft all round
  const roomOf = (sp: Spot): Rect => {
    if (sp.shape === 'vv') {
      // as wide as the vessel's own footprint along the rack (a column's platforms and 12 in), 2 ft beyond the shell at least; toward the rack as far as the yard's beam, under which its lines pass, 10 ft from the shell at least
      // the narrower chase holds two rows of risers 2 ft apart across it; a vessel with more connections than that has the wider and deeper one
      const R = sp.R ?? 0, joined = lines.some(l => l.def.service === 'V' && [l.def.from, l.def.to].some(e => { const q = e.k === 'nozzle' ? nozzles.get(e.id) : undefined; return !!q && q.equip === sp.tag && q.u[1] === 0; }));   // a line routed free joins it at its side: it crosses the chase
      const many = joined || [...nozzles.values()].filter(q => q.equip === sp.tag).length > 2 * Math.floor((2 * R + 48) / 24);
      const half = Math.max(R + 24, many && sp.lane === 'vessel' ? sp.lx / 2 : 0), yardZ = !many || sp.lane !== 'vessel' ? undefined : sp.side < 0 ? cell.yard.neg : cell.yard.pos, toYard = yardZ === undefined ? 0 : Math.abs(sp.z - yardZ) - 12;
      // and as far as the valve set on its largest connection toward the rack, and the turn after it, reach from the shell
      const sets = Math.max(0, ...[...nozzles.values()].filter(q => q.equip === sp.tag && q.u[1] === 0).map(q => valveDrop(q.NPS, q.cls)));
      const back = sp.z + sp.side * (R + 12), front = sp.z - sp.side * Math.max(R + 120, toYard, R + sets); return { x0: sp.x - half, x1: sp.x + half, z0: Math.min(back, front), z1: Math.max(back, front) };
    }
    const r = { x0: sp.x - sp.lx / 2 - 72, x1: sp.x + sp.lx / 2 + 72, z0: sp.z - sp.lz / 2 - 72, z1: sp.z + sp.lz / 2 + 72 };
    // an air cooler bay: on the side a connection faces, as far as that connection's valve set ends (a gate valve's length and two pipe sizes from its face), half the pipe and 1 ft
    if (sp.lane === 'air') for (const q of nozzles.values()) {
      if (q.equip !== sp.tag || q.u[1] !== 0) continue; const far = gateFaceToFace(q.NPS, q.cls) + 2 * q.NPS + pipeDims(q.NPS, q.cls).OD / 2 + 12, x = q.face[0] + q.u[0] * far, zz = q.face[2] + q.u[2] * far;
      r.x0 = Math.min(r.x0, down(x)); r.x1 = Math.max(r.x1, up(x)); r.z0 = Math.min(r.z0, down(zz)); r.z1 = Math.max(r.z1, up(zz));
    }
    return r;
  };
  const keepOut: Placed[] = [];
  /** blocks filling a region of the plan between two elevations, less the holes */
  const fill = (region: Rect, y0: number, y1: number, holes: Rect[], into: Placed[] = keepOut) => {
    const xs = [...new Set([region.x0, region.x1, ...holes.flatMap(h => [h.x0, h.x1])].map(v => Math.min(region.x1, Math.max(region.x0, v))))].sort((p, q) => p - q);
    for (let i = 0; i < xs.length - 1; i++) {
      const xa = xs[i], xb = xs[i + 1], cut = holes.filter(h => h.x0 < xb && h.x1 > xa).map(h => [h.z0, h.z1] as [number, number]).sort((p, q) => p[0] - q[0]); let z = region.z0;
      const slab = (za: number, zb: number) => { if (zb - za > 1 && xb - xa > 1) into.push(block([xa, y0, za], [xb, y1, zb], into === keepOut ? 'keep-out' : 'lane fence')); };
      for (const [za, zb] of cut) { slab(z, Math.min(za, region.z1)); z = Math.max(z, zb); } slab(z, region.z1);
    }
  };
  const topOf = (sp: Spot) => up(Math.max(limit + 6, reach.get(sp.tag) ?? 0)), rooms = cell.spots.filter(sp => tall.has(sp.tag)).map(sp => ({ rect: roomOf(sp), top: topOf(sp) }));
  // where a line joins connections up there on two bodies (a column's top and the air cooler it feeds), the way between their rooms is open too, as high as the lower
  // room: the line crosses at the cooler's level on the steel that carries the cooler, and does not come down under the rack's top to go up again
  for (const l of lines) {
    const a = l.def.from, b = l.def.to; if (a.k !== 'nozzle' || b.k !== 'nozzle') continue;
    const na = nozzles.get(a.id)!, nb = nozzles.get(b.id)!, sa = cell.spots.find(sp => sp.tag === na.equip), sb = cell.spots.find(sp => sp.tag === nb.equip); if (!sa || !sb || sa === sb || !high(na) || !high(nb)) continue;
    const ra = roomOf(sa), rb = roomOf(sb), x0 = Math.max(ra.x0, rb.x0), x1 = Math.min(ra.x1, rb.x1), z0 = Math.max(ra.z0, rb.z0), z1 = Math.min(ra.z1, rb.z1), top = Math.min(topOf(sa), topOf(sb));
    if (x1 - x0 >= 48 && z1 < z0) rooms.push({ rect: { x0, x1, z0: z1, z1: z0 }, top }); else if (z1 - z0 >= 48 && x1 < x0) rooms.push({ rect: { x0: x1, x1: x0, z0, z1 }, top });
  }
  const tallHoles = rooms.map(r => r.rect);
  // each body's room reaches as high as its own lines need and no higher: above an air cooler's connections the space is closed again, so a column's overhead line cannot wander out over it
  { const levels = [...new Set([limit, ...rooms.map(r => Math.min(r.top, gridTop + 12)), gridTop + 12])].sort((a, b) => a - b);
    for (let i = 0; i + 1 < levels.length; i++) fill(G, levels[i], levels[i + 1], rooms.filter(r => r.top > levels[i]).map(r => r.rect)); }
  // beyond the yard's support beams nothing travels above them: every line crossing between equipment and rack passes under a beam, and hangs from it (SW-CELL-6)
  if (cell.yard.neg !== undefined) fill({ ...G, z1: cell.yard.neg + 12 }, YARD + 18, limit, tallHoles);
  if (cell.yard.pos !== undefined) fill({ ...G, z0: cell.yard.pos - 12 }, YARD + 18, limit, tallHoles);
  // SW-DET-6 (amended 2026-11-27): each shell's course joints laid again clear of the plant's own radial connections on it; a seam solid's extent is unchanged
  const seamed = relaySeams(cell.interior.instances, [...nozzles.values()]);
  const shown = { ...cell.interior, instances: [...seamed, ...keepOut] };
  const plant: PlantDef = {
    id: `R${unit}`, name: `SmartWeld coastal refinery (plant 3), unit ${unit}: ${sh.name}`,
    building: () => building, interior: () => shown, nozzles: () => nozzles, nozzleDefs: () => defs, lines: () => list, rack: cell.rack,
    grid: { x0: G.x0, x1: G.x1, y1: gridTop, z0: G.z0, z1: G.z1 },
    joint: l => jointBySpec(lineGroup(l, byNo), l.NPS), flangeType: l => flangeBySpec(lineGroup(l, byNo), l.NPS, l.cls), verticalThroughPlatforms: true,
    areas: { [`U${unit}`]: { name: sh.name, equipment: cell.spots.map(s => s.tag) } }, pilot: [],
    paths: { piping: `public/refinery/piping/unit-${unit}.json`, groundtruth: `public/refinery/units/unit-${unit}/groundtruth`, answerKey: `eval/refinery/answer-key-unit-${unit}.json`, designer: `downloads/refinery/unit-${unit}` },
  };
  // ---- SW-RPI-7: the runs of the generator: each line that runs the rack in one of its own, on the lane given it ----
  const tiers = [...new Set(tierOf.values())].sort((a, b) => a - b); if (!tiers.length) tiers.push(0);
  const runs: UnitRun[] = [], runOf = new Map<string, number>();
  {
    // the branches that tap a line go with it: the generator sets a tee on a line of its own run
    const kids = (no: string, depth = 0): string[] => (depth > 8 ? [] : list.filter(q => [q.from, q.to].some(e => e.k === 'tap' && e.line === no)).flatMap(q => [q.no, ...kids(q.no, depth + 1)]));
    const add = (r: UnitRun) => { const fresh = r.lines.filter(no => !runOf.has(no)); if (!fresh.length) return; for (const no of fresh) runOf.set(no, runs.length); runs.push({ ...r, lines: fresh }); };
    // first the lines routed free by their letter (SW-RPI-3: a cracker's ducts and its reactor's vapour line), the largest first: every other line finds its way round them
    for (const l of [...lines].filter(q => q.def.service === 'V' && q.def.kind === 'routed' && q.def.from.k === 'nozzle' && q.def.to.k === 'nozzle').sort((a, b) => b.def.NPS - a.def.NPS)) add({ kind: 'overhead', lines: [l.def.no, ...kids(l.def.no)] });
    // then each column's overhead line that does not run the rack: the top connection of a column with platforms, to a body of this plot
    const overheads = new Set([...nozzles.values()].filter(q => q.u[1] > 0 && cell.spots.some(sp => sp.tag === q.equip && sp.shape === 'vv' && sp.floors)).map(q => q.id));
    for (const l of list) if (l.kind === 'routed' && !tierOf.has(l.no) && l.from.k === 'nozzle' && l.to.k === 'nozzle' && !spools.some(q => q.line === l.no) && [l.from, l.to].some(en => en.k === 'nozzle' && overheads.has(en.id))) add({ kind: 'overhead', lines: [l.no, ...kids(l.no)] });
    // then each line that runs the rack, and each that rises to a connection high on a body (in a column's chase) without running the rack: the largest first, of one size the lower tier first
    const rises = (l: UnitLine) => l.def.kind === 'routed' && !tierOf.has(l.def.no) && !runOf.has(l.def.no) && l.def.from.k === 'nozzle' && l.def.to.k === 'nozzle' && !spools.some(q => q.line === l.def.no) && [l.def.from, l.def.to].some(e => e.k === 'nozzle' && high(nozzles.get(e.id)!));
    for (const l of lines.filter(q => tierOf.has(q.def.no) || rises(q)).sort((a, b) => b.def.NPS - a.def.NPS || (tierOf.get(a.def.no) ?? RACK.tiers.length) - (tierOf.get(b.def.no) ?? RACK.tiers.length)))
      add(tierOf.has(l.def.no) ? { kind: 'rack', lines: [l.def.no, ...kids(l.def.no)], lane: foreseen.find(L => L.no === l.def.no)! } : { kind: 'chase', lines: [l.def.no, ...kids(l.def.no)] });
    // last the utility headers, their take-offs and every line that does not run the rack
    add({ kind: 'rest', lines: list.map(l => l.no) });
  }
  /** the room a later run's line will need for the first valves at one of its nozzles */
  const reserve = (l: UnitLine, id: string, dest: boolean): Placed[] => {
    // the room kept for its valves is measured from the base and standout the face was set by (SW-NOZ-1 as amended 2026-11-27)
    const q0 = nozzles.get(id)!, q = { ...q0, ...(q0.plan ?? {}) }, f = designFlange(q.NPS, q.cls).OD / 2, base = gateFaceToFace(q.NPS, q.cls) + 2 * q.NPS + 24, L = q.S + (l.def.cv && dest ? Math.max(base, 12 * q.NPS + 96) : q.service === 'discharge' ? 2 * base : base);
    const box = (len: number, half: number, top: number) => { const a = q.A, b: V3 = [a[0] + q.u[0] * len, a[1] + q.u[1] * len, a[2] + q.u[2] * len], w = (k: number) => (q.u[k] ? 0 : k === 1 ? f : half);
      return block([Math.min(a[0], b[0]) - w(0), Math.min(a[1], b[1]) - w(1), Math.min(a[2], b[2]) - w(2)], [Math.max(a[0], b[0]) + w(0), Math.max(a[1], b[1]) + (q.u[1] ? 0 : top), Math.max(a[2], b[2]) + w(2)], 'room for valves'); };
    // at a spool (on the rack, or a control station's under it) a valve can only stand stem up, its neighbours on either hand: where the valve itself stands, the room is as high as its stem and
    // as wide as its handwheel
    const spool = /^(BL|RS|CS)-/.test(id) && !q.u[1];
    return spool ? [box(L, f, f), box(q.S + gateFaceToFace(q.NPS, q.cls) + 3, Math.max(f, gateWidth(q.NPS, q.cls) / 2), gateReach(q.NPS))] : [box(L, f, f)];
  };
  const laneY = (L: RackLane) => { const d = byNo.get(L.no!)!; return tierY(L.t, d.NPS, d.cls); };
  /**
   * SW-RPI-7: the lane kept for a line not yet routed: a solid along it from 3 ft beyond each end of its run (2 ft inside an end that is a spool on the rack, whose valves
   * stand there). It reaches above and below the pipe's axis as far as keeps a line that crosses it clear of the pipe when that is routed in its turn: the generator lets a
   * line pass a solid by the grid cells the solid touches, and will hold the crossing line the same way when the lane's own line comes. To the line of a run on the same
   * tier it is as wide as the pipe (the lanes of a tier are spaced for that, and such a line leaves the tier at its own lane); to any other run (`wide`) it reaches as far
   * to either side as above and below, so that a line of another tier that passes down or up beside it leaves the lane's own pipe its room too
   */
  const onRackSpool = (e: EndRef) => e.k === 'nozzle' && /^(BL|RS)-/.test(e.id);
  const kept = (L: RackLane, wide: boolean): Placed[] => {
    const d = byNo.get(L.no!)!, lo = xAt(d.from)! <= xAt(d.to)! ? d.from : d.to, hi = lo === d.from ? d.to : d.from, a = L.x0 + (onRackSpool(lo) ? 24 : -36), b = L.x1 + (onRackSpool(hi) ? -24 : 36);
    const y = laneY(L), r = L.OD / 2, h = keptReach(r), w = wide ? Math.max(r, h) : r;
    return b - a >= 12 ? [block([Math.max(cell.rack.x0 + 6, a), y - h, L.z - w], [Math.min(cell.rack.x1 - 6, b), y + h, L.z + w], 'lane kept')] : [];
  };
  /**
   * SW-RPI-7: the fence on the tier of a run's line: the tier closed from end to end of the rack at the height its pipes lie at, but for a slot along the line's own lane,
   * as wide as leaves the lane clear to the generator and shuts the lanes 6 in either side, and for an opening about each root spool on that tier that a line of
   * this run starts at or comes to (SW-RPI-8), as wide as the spool's valves. The line can then lie nowhere on its tier but in its lane, and neither it nor a branch of it can shift
   * to one side at that height and stand where a lane beside it is still to be taken
   */
  const widest = (t: number) => Math.max(0, ...foreseen.filter(L => L.t === t && L.no !== undefined).map(L => L.OD));
  const fence = (L: RackLane, mine: Set<string>): Placed[] => {
    const slot = 6 * Math.ceil((L.OD / 2 + 6) / 6 - 1e-9) + 2, out: Placed[] = [];
    const open = roots.filter(r => r.tier === L.t && (mine.has(r.connection) || mine.has(r.line))).map(r => { const q = nozzles.get(`${r.tag}-A`)!, f = Math.max(designFlange(q.NPS, q.cls).OD / 2 + 9, gateWidth(q.NPS, q.cls) / 2 + 6); return { x0: r.at[0] - 150, x1: r.at[0] + 150, z0: r.at[2] - f, z1: r.at[2] + f }; });
    fill({ x0: cell.rack.x0 + 6, x1: cell.rack.x1 - 6, z0: -HW, z1: HW }, RACK.tiers[L.t] + 4, RACK.tiers[L.t] + 4 + widest(L.t), [{ x0: cell.rack.x0, x1: cell.rack.x1, z0: L.z - slot, z1: L.z + slot }, ...open], out);
    return out;
  };
  const runPlant = (k: number, prior: Placed[], whole: boolean | 'close' = false): PlantDef => {
    const run = runs[k], rest = run.kind === 'rest', mine = new Set(run.lines);
    const held = [...lines.filter(l => runOf.get(l.def.no)! > k).flatMap(l => [[l.def.from, false] as const, [l.def.to, true] as const].filter(([e]) => e.k === 'nozzle').flatMap(([e, dest]) => reserve(l, (e as Extract<EndRef, { k: 'nozzle' }>).id, dest))),
      ...feeds.filter(f => runOf.get(f.stub.no)! > k).flatMap(f => reserve({ def: f.stub } as UnitLine, `${f.tag}-U`, false))];
    // SW-RPI-15: where each header's first piece will lie once it is carried back to its block valve, from the valve's blind to the header's cap
    const pieces = feeds.map(f => { const q = nozzles.get(`${f.tag}-U`)!, r = pipeDims(q.NPS, q.cls).OD / 2; return block([q.face[0] + gateFaceToFace(q.NPS, q.cls) + 18, q.face[1] - r, f.z - r], [cell.rack.x0 + (rest ? 0 : 12), q.face[1] + r, f.z + r], 'header piece'); });
    // the headers are laid in the last run, in lanes the generator gives without looking: until then their lanes are held, with room above for their valved take-offs
    const lanesHeld = rest ? [] : headers.filter(h => h.z !== undefined).map(h => { const y = tierY(top, h.NPS, h.cls), r = pipeDims(h.NPS, h.cls).OD / 2; return block([cell.rack.x0 + 12, y - r, h.z! - h.width / 2], [cell.rack.x1 - 12, y + r + 48, h.z! + h.width / 2], 'header lane'); });
    const lanesKept = foreseen.filter(L => L.no !== undefined && runOf.get(L.no)! > k).flatMap(L => kept(L, !run.lane || run.lane.t !== L.t)), gates = run.lane ? fence(run.lane, mine) : [];
    // the way of each later line whose two connections stand on one vertical, one facing down and the other up (a tail pipe): the space straight between the two faces, a flange wide
    const ways = lines.filter(l => runOf.get(l.def.no)! > k).flatMap(l => {
      const a = l.def.from, b = l.def.to; if (a.k !== 'nozzle' || b.k !== 'nozzle') return [];
      const p = nozzles.get(a.id)!, q = nozzles.get(b.id)!; if (Math.abs(p.face[0] - q.face[0]) > 1e-6 || Math.abs(p.face[2] - q.face[2]) > 1e-6 || p.u[1] * q.u[1] >= 0 || (q.face[1] - p.face[1]) * p.u[1] <= 0) return [];
      const f = Math.max(designFlange(p.NPS, p.cls).OD, designFlange(q.NPS, q.cls).OD) / 2;
      return [block([p.face[0] - f, Math.min(p.face[1], q.face[1]), p.face[2] - f], [p.face[0] + f, Math.max(p.face[1], q.face[1]), p.face[2] + f], 'way kept')];
    });
    // in the last run the headers are laid without a look at what is there, and their end caps are not held on the generator's grid: a block about each cap keeps the
    // lines of that run, which pass the rack's two ends on the top tier, clear of it (SW-RPI-12)
    const caps = !rest ? [] : headers.filter(h => h.z !== undefined).flatMap(h => { const y = tierY(top, h.NPS, h.cls), q = pipeDims(h.NPS, h.cls).OD / 2 + 3; return [block([cell.rack.x0 + 3, y - q, h.z! - q], [cell.rack.x0 + 12, y + q, h.z! + q], 'header cap'), block([cell.rack.x1 - 12, y - q, h.z! - q], [cell.rack.x1 - 3, y + q, h.z! + q], 'header cap')]; });
    // SW-RPI-3: while a line routed free is laid, the way down before each side connection of a vertical vessel that a later line will leave by is held for that line: from where its valves end, 6 ft
    // further out, a pipe and 1 ft wide, from 9 ft over the top tier up to the connection (the fractionator's 24 in overhead otherwise comes down the middle of its chase, before all its side connections)
    const drops = run.kind !== 'overhead' ? [] : lines.filter(l => runOf.get(l.def.no)! > k && l.def.service !== 'V').flatMap(l => [l.def.from, l.def.to].flatMap(e => {
      if (e.k !== 'nozzle') return []; const q = nozzles.get(e.id)!, sp = cell.spots.find(s => s.tag === q.equip); if (!sp || sp.shape !== 'vv' || q.u[1] !== 0 || q.face[1] <= RACK.tiers[top] + 108) return [];
      const w = pipeDims(q.NPS, q.cls).OD / 2 + 6, s0 = gateFaceToFace(q.NPS, q.cls) + 2 * q.NPS + 24, a: V3 = [q.face[0] + q.u[0] * s0, 0, q.face[2] + q.u[2] * s0], b: V3 = [a[0] + q.u[0] * 72, 0, a[2] + q.u[2] * 72];
      // (from above the valve a line routed free has on a side connection of the same vessel, whose stem must have its room)
      const low = Math.max(RACK.tiers[top] + 108, ...lines.filter(v => v.def.service === 'V').flatMap(v => [v.def.from, v.def.to]).flatMap(en => { const n = en.k === 'nozzle' ? nozzles.get(en.id) : undefined; return n && n.equip === q.equip && n.u[1] === 0 ? [n.face[1] + gateReach(n.NPS) + 12] : []; }));
      if (q.face[1] + w <= low) return [];
      return [block([Math.min(a[0], b[0]) - (q.u[0] ? 0 : w), low, Math.min(a[2], b[2]) - (q.u[2] ? 0 : w)], [Math.max(a[0], b[0]) + (q.u[0] ? 0 : w), q.face[1] + w, Math.max(a[2], b[2]) + (q.u[2] ? 0 : w)], 'way down kept')];
    }));
    const inst = [...shown.instances, ...held, ...ways, ...drops, ...lanesHeld, ...pieces, ...lanesKept, ...gates, ...caps, ...prior];
    // the grid cut to the run: 30 ft beyond its connections along and across the rack, its lane included, and 20 ft above the highest of them or of the rack's top tier
    const ends = lines.filter(l => mine.has(l.def.no)).flatMap(l => [l.def.from, l.def.to]).filter((e): e is Extract<EndRef, { k: 'nozzle' }> => e.k === 'nozzle').map(e => nozzles.get(e.id)!);
    const pA = (q: PlantNozzle) => q.plan?.A ?? q.A, xs = ends.flatMap(q => [pA(q)[0], q.face[0]]), ys = ends.flatMap(q => [pA(q)[1], q.face[1]]), zs = [...ends.flatMap(q => [pA(q)[2], q.face[2]]), ...(run.lane ? [run.lane.z] : [])];
    const full = { x0: G.x0, x1: G.x1, y1: gridTop, z0: G.z0, z1: G.z1 }, y1 = Math.min(gridTop, up(Math.max(RACK.tiers[top] + 24, ...ys) + 240));
    const far = whole === 'close' ? 120 : 360;   // 'close': the third attempt, 10 ft beyond the connections in place of 30
    const grid = whole === true || !ends.length ? full : rest ? { ...full, y1 } : { x0: Math.max(G.x0, down(Math.min(...xs) - far)), x1: Math.min(G.x1, up(Math.max(...xs) + far)), y1: whole === 'close' ? Math.min(gridTop, up(Math.max(RACK.tiers[top] + 24, ...ys) + far)) : y1, z0: Math.max(G.z0, down(Math.min(...zs) - far)), z1: Math.min(G.z1, up(Math.max(...zs) + far)) };
    return { ...plant, grid, rack: { ...cell.rack, tiers: cell.rack.tiers.slice(run.lane ? run.lane.t : rest ? top : 0) }, interior: () => ({ ...shown, instances: inst }) };
  };
  return { unit, cell, plant, lines, nozzles, spools, roots, stations, headers: headerLanes, feeds, notes, tierRoom, tiers, runs, runOf, runPlant, foreseen };
}
