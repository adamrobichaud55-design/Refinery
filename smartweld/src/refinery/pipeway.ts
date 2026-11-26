/**
 * Plant 3: the main pipeway as a plant for the piping generator of plants 1 and 2 (DESIGN_BASIS.md §80, SW-PWY-*).
 * A rack down the corridor between the two rows of units; the units' battery-limit spools as its connections; a line
 * for every stream between units that has a party on the process bench. The generator itself is unchanged: it is
 * given the rack, a nozzle schedule, a line list and where lines may travel, and is run once for each line in a lane
 * given it beforehand, as in a unit (SW-RPI-7).
 */
import { pipeDims, designFlange, gateFaceToFace, makeWideFlange, elbowRadius, type PipeClass } from '../catalogue';
import { buildGeometry } from '../geometry/partGeometry';
import type { PlantDef } from '../generator/plant';
import { jointBySpec, flangeBySpec, lineGroup } from '../generator/plant';
import type { Nozzle, NozzleDef } from '../generator/nozzles';
import type { LineDef, EndRef, Service } from '../generator/linelist';
import type { BuildingModel, Placed } from '../generator/building';
import type { InteriorModel } from '../generator/interior';
import { interiorKit, type RackLayout } from '../generator/interiorKit';
import { frameFromAxes, multiply, translate, standUp } from '../geometry/transform';
import type { Mat4 } from '../geometry/mesh';
import { processModel, type Transfer } from './process';
import { sizing, transferLine } from './sizing';
import { cells, cellToSite } from './assemble';
import { bench, PIPEWAY_Z, type Plot } from './site';
import { RACK, type CellModel } from './cell';
import { unitPiping, block, gateReach, gateWidth, laneSpacing, keptReach, STRINGER, type UnitRun, type RackLane, type V3 } from './unitPiping';
import { lineNumber, serviceOf } from './registry';
import { plantHeaders, unitHeaders, type PlantHeader } from './headers';
import { K } from '../core/constants';

const near = (v: number, s = 6) => Math.round(v / s) * s, up = (v: number, s = 6) => Math.ceil(v / s - 1e-9) * s, down = (v: number, s = 6) => Math.floor(v / s + 1e-9) * s;
/** SW-PWY-1, SW-PWY-2, SW-PWY-9: the main pipeway's own figures. `west`: where its frame's origin stands on the site, ft east */
export const PWY = { area: 10, west: 985, bays: 58, bent: 240, half: 180, tiers: [240, 312, 396] as const, loadPsf: 40, stringers: [-60, 60] as const, /** under the top tier: clear of where the headers' branches come down beside their band (SW-PWY-9, SW-PWY-12) */ topStringers: [-96, 0, 96] as const, limit: 60, PAD: 6, /** how far from the centre line a junction frame stands (SW-PWY-9): 2 ft inside the corridor's edge */ junction: 336 };
/** the units piped so far: each has battery-limit spools for the pipeway's lines to meet (§79) */
export const PIPED = [11, 12, 13, 14, 15, 16, 17, 18, 19];
/** the units of the process bench that stand on the main pipeway */
const ON_BENCH = [11, 12, 13, 14, 15, 16, 17, 18, 19];
/** the areas beyond the bench, by the end of the main rack their pipeways leave from (SW-SITE-4, SW-PWY-4) */
const END_OF: Record<number, 'west' | 'east'> = { 20: 'east', 21: 'east', 22: 'east', 23: 'east', 24: 'east', 25: 'west', 26: 'west' };
const AREA: Record<number, string> = { 20: 'crude tank farm', 21: 'product tankage', 22: 'marine terminal', 23: 'truck loading', 24: 'wastewater treatment', 25: 'flare', 26: 'fire water tanks' };
const LENGTH = PWY.bays * PWY.bent;

/** a party's connection to a stream's line */
export interface Conn {
  stream: string; /** the unit, or 0 for what lies beyond the site boundary */ unit: number; party: string; sends: boolean; NPS: number; cls: PipeClass;
  /** the nozzle the pipeway's line bolts to */ nozzle: string; /** a limit spool of the pipeway's own (SW-PWY-4), by its tag */ own?: string; /** at an end of the main rack */ end?: 'west' | 'east';
  /** where its face stands in the pipeway's frame; for an end's spool, set with its line's lane */ x: number; y: number; z: number; /** north of the rack, south of it, or on it */ side: -1 | 0 | 1; /** the unit tier its spool stands on (an index) */ unitTier?: number;
  /** SW-PWY-12: a party of a utility header: `stream` is the header's name */ header?: boolean;
}
/** a line of the pipeway, kept beside the generator's own record */
export interface PipewayLine {
  def: LineDef; unit: number; seq: number; stream: string; fluid: string; origin: 'main' | 'branch' | 'limit' | 'header'; designP: number; designT: number;
  /** the main tier it runs on (an index) */ tier?: number; /** SW-PWY-7: the ends at which the generator's valve is not built */ bare?: ('from' | 'to')[];
}
/** a limit spool of the pipeway's own (SW-PWY-4) */
export interface LimitSpool { tag: string; stream: string; party: string; unit: number; sends: boolean; line: string; stub: string; NPS: number; cls: PipeClass; at: V3; where: 'valve bay' | 'west limit bay' | 'east limit bay' }
/** a junction frame at a unit's limit (SW-PWY-9) */
export interface Junction { unit: number; x: number; z: number; half: number; tiers: number[]; beam: string; post: string }
export interface StreamPlan { stream: string; fluid: string; NPS: number; cls: PipeClass; designP: number; designT: number; main: string; branches: string[]; parties: { party: string; sends: boolean; nozzle: string; NPS: number; role: 'end' | 'branch' }[]; laid: 'on the rack' | 'direct' }
/** a utility header on the top tier (SW-PWY-11) and the parties joined to it by branches (SW-PWY-12) */
export interface HeaderPlan {
  fluid: string; key: string; line: string; NPS: number; cls: PipeClass; designP: number; designT: number; /** its lane, z in */ z: number;
  /** what set its size (SW-PRC-19): unit 19's line, the largest flow a stretch carries and the size for that, the largest unit header joined */ sizedBy: { line: number; stretch: number; stretchNPS: number; joined: number };
  /** what the units make into it and take from it, lb/h */ made: number; used: number;
  /** `NPS`: the branch's size, 3 in at least; `spool`: its spool's, where that is smaller and the branch is reduced at it */ parties: { party: string; unit: number; sends: boolean; nozzle: string; NPS: number; spool: number; branch: string }[];
}
/** SW-PWY-13: what lies along a tier in its heaviest bay, lb per foot of rack, against what the tier is built for */
export interface TierLoad { tier: number; lines: number; most: number; bay: number; limit: number }
export interface Pipeway {
  rack: RackLayout; /** the pipeway's own steel, and the steel of each unit that stands in its valve bay */ interior: InteriorModel; own: Placed[]; plant: PlantDef; lines: PipewayLine[]; nozzles: Map<string, Nozzle>;
  conns: Conn[]; limits: LimitSpool[]; junctions: Junction[]; streams: StreamPlan[]; /** streams and lines not on the main pipeway, and why */ skipped: { stream: string; why: string }[];
  runs: UnitRun[]; runOf: Map<string, number>; runPlant: (run: number, prior: Placed[], whole?: boolean) => PlantDef; foreseen: RackLane[]; tierRoom: number; tiers: number[]; notes: string[];
  /** SW-PWY-11: the utility headers; SW-PWY-13: the tiers' loads */ headers: HeaderPlan[]; loads: TierLoad[];
  /** what stands in the pipeway's frame of each unit: its rack's centre along the pipeway, its side, its rack's half-width */ units: { unit: number; x: number; side: -1 | 1; half: number; piped: boolean }[];
}

const xf = (m: Mat4, p: V3): V3 => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]].map(v => Math.round(v * 1e6) / 1e6) as V3;
const rot = (m: Mat4, p: V3): V3 => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2], m[1] * p[0] + m[5] * p[1] + m[9] * p[2], m[2] * p[0] + m[6] * p[1] + m[10] * p[2]].map(v => Math.round(v * 1e6) / 1e6) as V3;
/** SW-PWY-1: the pipeway's frame set on the site */
export const pipewayToSite = (): Mat4 => translate(PWY.west * 12, bench('process').el * 12, PIPEWAY_Z * 12);
/** a unit's frame in the pipeway's */
export const unitToPipeway = (p: Plot, c: CellModel): Mat4 => multiply(translate(-PWY.west * 12, -bench(p.bench).el * 12, -PIPEWAY_Z * 12), cellToSite(p, c));
/** the height a line of this size lies at on a tier of the main rack, and on a tier of a unit's rack (SW-RT-2) */
/** SW-PWY-9: the stringers under a tier, z in */
export const stringersOf = (t: number): readonly number[] => (t === PWY.tiers.length - 1 ? PWY.topStringers : PWY.stringers);
/** SW-PWY-5: the stringers a lane of a tier keeps clear of: those under its own tier, which a line leaving the tier downward passes, and those under the tier above, which one leaving it upward would meet */
export const stringersBy = (t: number): number[] => [...new Set([...stringersOf(t), ...(t + 1 < PWY.tiers.length ? stringersOf(t + 1) : [])])];
export const mainY = (t: number, NPS: number, cls: PipeClass) => up(PWY.tiers[t] + 4 + pipeDims(NPS, cls).OD / 2);
const unitY = (t: number, NPS: number, cls: PipeClass) => up(RACK.tiers[t] + 4 + pipeDims(NPS, cls).OD / 2);
/** SW-RT-4: the height two elbows of a line and the make-up piece between them take */
/** SW-PWY-12: the least size of a header's branch between the main rack and a unit */
export const MIN_BRANCH = 3;
export const turnHeight = (NPS: number, cls: PipeClass) => 6 * Math.ceil((2 * elbowRadius(pipeDims(NPS, cls).OD) + 2) / 6);

const boxes = new WeakMap<object, [V3, V3]>();
/** the box of a placed part in the frame its transform leads to */
function placedBox(pl: Placed, m: Mat4): [V3, V3] {
  let b = boxes.get(pl.part);
  if (!b) { const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity]; for (const s of buildGeometry(pl.part).solids) for (let i = 0; i < s.mesh.positions.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], s.mesh.positions[i + a]); mx[a] = Math.max(mx[a], s.mesh.positions[i + a]); } b = [mn, mx]; boxes.set(pl.part, b); }
  const T = multiply(m, pl.transform), mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity];
  for (let k = 0; k < 8; k++) { const w = xf(T, [k & 1 ? b[1][0] : b[0][0], k & 2 ? b[1][1] : b[0][1], k & 4 ? b[1][2] : b[0][2]]); for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], w[a]); mx[a] = Math.max(mx[a], w[a]); } }
  return [mn, mx];
}

let cache: Pipeway | undefined;
/** SW-PWY-*: the main pipeway as a plant */
export function pipeway(): Pipeway {
  if (cache) return cache;
  const M = processModel(), Z = sizing(), notes: string[] = [], skipped: Pipeway['skipped'] = [];
  const I: Mat4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  // ---- the units on the pipeway: where each stands in its frame ----
  const site = cells().filter(c => c.plot.kind === 'unit' && ON_BENCH.includes(c.plot.unit));
  const units = site.map(({ plot: p, cell }) => { const T = unitToPipeway(p, cell), o = xf(T, [0, 0, 0]), side: -1 | 1 = xf(T, [100, 0, 0])[2] > o[2] ? 1 : -1; return { unit: p.unit, plot: p, cell, T, x: o[0], side, half: cell.rack.halfWidth, piped: PIPED.includes(p.unit) }; });
  for (const u of units) if (Math.abs(Math.abs(xf(u.T, [0, 0, 0])[2]) - 360) > 1e-6 || Math.abs(u.x - near(u.x)) > 1e-6) throw new Error(`unit ${u.unit}: its limit does not stand on the pipeway's grid at the corridor's edge (x ${u.x}, z ${xf(u.T, [0, 0, 0])[2]})`);
  const unitOf = (no: number) => units.find(u => u.unit === no);

  // ---- SW-PWY-3: the parties of each stream ----
  const nozzles = new Map<string, Nozzle>(), defs: NozzleDef[] = [], conns: Conn[] = [], limits: LimitSpool[] = [];
  const addNozzle = (id: string, equip: string, service: string, NPS: number, cls: PipeClass, A: V3, u: V3, S = 12) => { nozzles.set(id, { id, equip, service, NPS, cls, A, u, face: [A[0] + u[0] * S, A[1] + u[1] * S, A[2] + u[2] * S], S, z0: A[2] }); defs.push({ equip, id, service, NPS, cls, at: { on: 'top', dx: 0, dz: 0 } }); };
  /** a unit's lines that end at its limit under a stream's name: their direction and size */
  const blEnds = (unit: number, key: string) => { const sh = M.sheet(unit), out: { sends: boolean; NPS: number }[] = []; sh.lines.forEach((l, i) => { if (l.from.k === 'bl' && l.from.name === key) out.push({ sends: false, NPS: Z.get(unit)!.lines[i].NPS }); if (l.to.k === 'bl' && l.to.name === key) out.push({ sends: true, NPS: Z.get(unit)!.lines[i].NPS }); }); return out; };
  const piping = new Map(PIPED.map(u => [u, unitPiping(u)]));
  const wanted: Transfer[] = [], elsewhere: string[] = [];
  for (const t of M.transfers) {
    const parties = [...new Set([...t.from, ...t.to].map(p => p.unit))];
    if (!parties.some(u => ON_BENCH.includes(u))) { skipped.push({ stream: t.key, why: parties.length ? `between ${parties.map(u => `the ${AREA[u] ?? `unit ${u}`}`).join(' and ')}${t.boundary ? ' and the site boundary' : ''}: for those areas' own pipeways` : 'no unit sends it yet: relief systems are a later stage' }); continue; }
    const L = transferLine(t.key); wanted.push(t);
    for (const u of parties) {
      if (PIPED.includes(u)) {
        const up0 = piping.get(u)!, U = unitOf(u)!;
        for (const sp of up0.spools.filter(q => q.stream === t.key)) {
          const q = up0.nozzles.get(`${sp.tag}-P`)!, A = xf(U.T, q.A as V3), dir = rot(U.T, q.u as V3), id = `${sp.tag}-P`;
          if (sp.cls !== L.cls) throw new Error(`${sp.tag}: its class ${sp.cls} is not its stream's, ${L.cls} (SW-RPI-9, SW-PRC-2)`);
          addNozzle(id, sp.tag, 'pipeway side', sp.NPS, sp.cls, A, dir, q.S);
          const f = nozzles.get(id)!.face; if ([f[0], f[1]].some(v => Math.abs(v - near(v)) > 1e-6)) throw new Error(`${id}: its face is off the 6 in grid (${f})`);
          conns.push({ stream: t.key, unit: u, party: `unit ${u}`, sends: sp.dir === 'out', NPS: sp.NPS, cls: sp.cls, nozzle: id, x: f[0], y: f[1], z: f[2], side: U.side, unitTier: sp.tier });
        }
      } else for (const e of blEnds(u, t.key)) {
        const end = END_OF[u], U = unitOf(u);
        // an area beyond the bench meets the main pipeway only for what it exchanges with a unit on the bench: what it sends to another such area, or takes from one, runs on those areas' own pipeways
        if (end && !(e.sends ? t.to : t.from).some(q => ON_BENCH.includes(q.unit))) { if (!elsewhere.includes(`${t.key}: the ${AREA[u]}`)) elsewhere.push(`${t.key}: the ${AREA[u]}`); continue; }
        if (!end && !U) throw new Error(`unit ${u}: no place on the pipeway for its "${t.key}"`);
        conns.push({ stream: t.key, unit: u, party: U ? `unit ${u}` : `the ${AREA[u]}`, sends: e.sends, NPS: e.NPS, cls: L.cls, nozzle: '', own: '', ...(end ? { end } : {}), x: end === 'west' ? PWY.limit : end === 'east' ? LENGTH - PWY.limit : NaN, y: NaN, z: NaN, side: U ? U.side : 0 });
      }
    }
    if (t.boundary === 'in') conns.push({ stream: t.key, unit: 0, party: t.where ? `the site boundary (${t.where})` : 'the site boundary', sends: true, NPS: L.NPS, cls: L.cls, nozzle: '', own: '', end: 'west', x: PWY.limit, y: NaN, z: NaN, side: 0 });
    if (t.boundary === 'out') throw new Error(`"${t.key}": a stream that leaves the site from the process bench has no place on the pipeway yet`);
    // a piped unit's line that stands on another plot of that unit (the cooling tower's) has no spool at the unit's limit: the stream waits for that plot
    const got = conns.filter(c => c.stream === t.key);
    if (got.length < 2 || !got.some(c => ON_BENCH.includes(c.unit))) {
      for (const c of got) { conns.splice(conns.indexOf(c), 1); if (c.nozzle) { nozzles.delete(c.nozzle); defs.splice(defs.findIndex(d => d.id === c.nozzle), 1); } }
      wanted.pop(); skipped.push({ stream: t.key, why: `its line in ${parties.filter(u => PIPED.includes(u)).map(u => `unit ${u}`).join(', ')} stands on another plot of that unit: with that plot, a later stage` });
    }
  }
  // unit 19's lines to its own items on another plot (the cooling tower) end at spools too: those lines are for that plot's stage
  for (const u of PIPED) for (const sp of piping.get(u)!.spools) if (!M.transfers.some(t => t.key === sp.stream) && !M.headers.some(h => h.key === sp.stream)) skipped.push({ stream: `${sp.stream} (unit ${u}, ${sp.tag})`, why: 'a line of the unit to an item of its own on another plot: with that plot, a later stage' });
  // ---- SW-PWY-11, SW-PWY-12: the utility headers that lie on the top tier, and the parties of each ----
  const onPlot19 = (tag: string) => piping.get(19)!.cell.spots.some(sp => sp.item === tag);
  const PH = plantHeaders(u => unitOf(u)?.x ?? (END_OF[u] === 'west' ? 0 : LENGTH), (u, tag) => u !== 19 || onPlot19(tag)), laid: PlantHeader[] = [], beyond: string[] = [];
  for (const h of PH) {
    const users = h.parties.filter(q => !q.line && q.unit !== 19);
    if (!users.some(q => ON_BENCH.includes(q.unit))) { skipped.push({ stream: h.key, why: `${users.length ? 'no unit on the pipeway' : 'no unit\'s flowsheet'} takes it or makes it yet: its line ends at unit 19's spool (SW-PWY-11)` }); continue; }
    if (h.fluid === 'CWS' || h.fluid === 'CWR') { skipped.push({ stream: h.key, why: `a ${h.NPS} in main from the cooling tower, whose plot is not piped yet; the pair of mains is too heavy for a tier of the rack, and where they run is put to the owner with that stage (SW-PWY-11). The units' headers end at their valves and spools meanwhile` }); continue; }
    laid.push(h);
    for (const q of users.filter(v => !ON_BENCH.includes(v.unit))) beyond.push(`${h.key}: the ${AREA[q.unit] ?? `unit ${q.unit}`}`);
    for (const u of ON_BENCH) {
      const U = unitOf(u)!;
      if (PIPED.includes(u)) for (const sp of piping.get(u)!.spools.filter(q => q.stream === h.key)) {   // unit 19's spool for the utility; a unit's header spool (SW-RPI-15)
        const q = piping.get(u)!.nozzles.get(`${sp.tag}-P`)!, A = xf(U.T, q.A as V3), dir = rot(U.T, q.u as V3), id = `${sp.tag}-P`;
        if (sp.cls !== h.cls) throw new Error(`${sp.tag}: its class ${sp.cls} is not its header's, ${h.cls} (SW-PRC-19)`);
        addNozzle(id, sp.tag, 'pipeway side', sp.NPS, sp.cls, A, dir, q.S);
        const f = nozzles.get(id)!.face; if ([f[0], f[1]].some(v => Math.abs(v - near(v)) > 1e-6)) throw new Error(`${id}: its face is off the 6 in grid (${f})`);
        conns.push({ stream: h.key, unit: u, party: sp.header ? `unit ${u}'s header` : `unit ${u}`, sends: sp.dir === 'out', NPS: sp.NPS, cls: sp.cls, nozzle: id, x: f[0], y: f[1], z: f[2], side: U.side, unitTier: sp.tier, header: true });
      }
      else for (const uh of unitHeaders(u).filter(q => q.fluid === h.fluid)) conns.push({ stream: h.key, unit: u, party: `unit ${u}'s header`, sends: uh.makes > uh.takes, NPS: uh.NPS, cls: h.cls, nozzle: '', own: '', x: NaN, y: NaN, z: NaN, side: U.side, header: true });
    }
  }
  // SW-PWY-11: the utility headers' lanes on the top tier, as the generator will give them when it lays them in its last run (SW-RT-2): the largest first, each in the
  // first place from the centre line outward that is its neighbours' half-widths and 3 in from them
  const headerLanes: { h: PlantHeader; z: number; OD: number }[] = [];
  { const cz: number[] = []; for (let z = -up(PWY.half - 18) + 6; z <= up(PWY.half - 18) - 6; z += 6) cz.push(z); cz.sort((a, b) => Math.abs(a) - Math.abs(b));
    for (const h of [...laid].sort((a, b) => b.NPS - a.NPS || PH.indexOf(a) - PH.indexOf(b))) { const OD = pipeDims(h.NPS, h.cls).OD, z = cz.find(c => headerLanes.every(L => Math.abs(L.z - c) >= (L.OD + OD) / 2 + 3)); if (z === undefined) throw new Error(`the main pipeway: no lane on the top tier for the ${h.key} header`); headerLanes.push({ h, z, OD }); } }
  /** SW-PWY-12: a party across the centre line from its header: its branch comes down on the header's side and passes under the band */
  const far = (c: Conn) => { const z = headerLanes.find(L => L.h.key === c.stream)!.z; return z !== 0 && Math.sign(z) !== c.side ? 1 : 0; };
  if (beyond.length) notes.push(`Carried on from the headers' caps with the pipeways of the areas beyond the bench, not from the main rack (SW-PWY-11): ${beyond.join('; ')}.`);
  if (elsewhere.length) notes.push(`Not on the main pipeway, though their streams are: ${elsewhere.join('; ')}. What an area beyond the bench sends to another such area, or takes from one, runs on those areas' own pipeways (SW-PWY-3).`);

  // ---- SW-PWY-4: the limit spools of a unit on the pipeway that is not yet piped: in its valve bay, on its lowest tier, spaced as a unit's are ----
  let seqSpool = 0; const newTag = () => `PL-${PWY.area}${String(++seqSpool).padStart(2, '0')}`;
  const farX = (c: Conn) => { const xs = conns.filter(q => q.stream === c.stream && q !== c && Number.isFinite(q.x)).map(q => q.x); return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0; };
  for (const U of units.filter(u => !u.piped)) {
    const mine = conns.filter(c => c.unit === U.unit && !c.header).sort((a, b) => U.side * (farX(b) - farX(a)) || a.stream.localeCompare(b.stream)), heads = conns.filter(c => c.unit === U.unit && c.header); if (!mine.length && !heads.length) continue;   // along the unit's rack from one column line to the other, in the order of where each line goes
    const f = (c: Conn) => designFlange(c.NPS, c.cls).OD, w = (c: Conn) => gateWidth(c.NPS, c.cls), pitch = (a: Conn, b: Conn) => up(Math.max((f(a) + f(b)) / 2 + 6, (w(a) + w(b)) / 2 + 3)), limit = U.half - 12;
    const lay = (row: Conn[]) => { const q: number[] = []; row.forEach((c, k) => q.push(k ? q[k - 1] + pitch(row[k - 1], c) : 0)); const mid = near((q[0] + q[q.length - 1]) / 2); return q.map(v => v - mid); };
    let rows: Conn[][] = mine.length ? [mine] : []; const fits = (row: Conn[]) => { const q = lay(row); return q[q.length - 1] + f(row[row.length - 1]) / 2 <= limit && q[0] - f(row[0]) / 2 >= -limit; };
    for (let n = 2; rows.some(r => !fits(r)); n++) { if (n > RACK.tiers.length) throw new Error(`unit ${U.unit}: its ${mine.length} limit spools do not fit its rack's width on ${RACK.tiers.length} tiers`); rows = Array.from({ length: n }, (_, k) => mine.filter((_c, i) => i % n === k)); }
    rows.forEach((row, t) => lay(row).forEach((zu, k) => {
      const c = row[k], tag = newTag(), at: V3 = [RACK.start - RACK.bent + 30, unitY(t, c.NPS, c.cls), zu];
      const A = xf(U.T, at), toRack = rot(U.T, [-1, 0, 0]), away = rot(U.T, [1, 0, 0]);
      addNozzle(`${tag}-P`, tag, 'pipeway side', c.NPS, c.cls, A, toRack); addNozzle(`${tag}-U`, tag, 'limit', c.NPS, c.cls, A, away);
      const face = nozzles.get(`${tag}-P`)!.face; Object.assign(c, { nozzle: `${tag}-P`, own: tag, x: face[0], y: face[1], z: face[2], unitTier: t });
    }));
    // SW-PWY-12: the spools of its utility headers, where its own will stand (SW-RPI-15): on its top tier, here in one row at the bay's middle, clear of the row above
    if (heads.length) {
      // along the pipeway from the west: each a valve's width from the last and 2 ft at least from the line of a bent or mid-bay beam of the main rack, whose steel its branch
      // must pass where it comes through the top tier; those of the headers across the centre line from the unit last, at the row's east end, where their longer way has room
      const tt = RACK.tiers.length - 1, sx = rot(U.T, [0, 0, 1])[0], row = [...heads].sort((a, b) => far(a) - far(b)), clean = (x: number) => Math.abs(x - (PWY.bent / 2) * Math.round(x / (PWY.bent / 2))) >= 24, xs: number[] = [];
      for (const [k, c] of row.entries()) { let x = up(k ? xs[k - 1] + pitch(row[k - 1], c) : U.x - limit + f(c) / 2); while (!clean(x)) x += 6; xs.push(x); }
      if (xs[xs.length - 1] + f(row[row.length - 1]) / 2 > U.x + limit) throw new Error(`unit ${U.unit}: the limit spools of its ${heads.length} utility headers do not fit its rack's width in one row`);
      xs.forEach((x, k) => {
        const c = row[k], zu = (x - U.x) * sx, tag = newTag(), at: V3 = [RACK.start - RACK.bent / 2, unitY(tt, c.NPS, c.cls), zu], A = xf(U.T, at);
        addNozzle(`${tag}-P`, tag, 'pipeway side', c.NPS, c.cls, A, rot(U.T, [-1, 0, 0])); addNozzle(`${tag}-U`, tag, 'limit', c.NPS, c.cls, A, rot(U.T, [1, 0, 0]));
        const face = nozzles.get(`${tag}-P`)!.face; Object.assign(c, { nozzle: `${tag}-P`, own: tag, x: face[0], y: face[1], z: face[2], unitTier: tt });
      });
    }
  }

  // ---- SW-PWY-3: each stream's line between its two parties furthest apart; every other party a branch ----
  interface Plan { t: Transfer; L: ReturnType<typeof transferLine>; a: Conn; b: Conn; rest: Conn[]; direct: boolean }
  const plans: Plan[] = wanted.map(t => {
    const cs = conns.filter(c => c.stream === t.key && !c.header).sort((p, q) => p.x - q.x || Number(p.sends) - Number(q.sends));
    if (cs.length < 2) throw new Error(`"${t.key}": ${cs.length} connection on the pipeway`);
    // the two furthest apart; of several at one end of the rack, one that sends to a receiver at the other end, or receives from a sender
    const lo = cs[0], his = cs.filter(c => Math.abs(c.x - cs[cs.length - 1].x) < 1e-6), hi = his.find(c => c.sends !== lo.sends) ?? his[his.length - 1];
    const [a, b] = lo.sends && !hi.sends ? [lo, hi] : hi.sends && !lo.sends ? [hi, lo] : [lo, hi];
    return { t, L: transferLine(t.key), a, b, rest: cs.filter(c => c !== a && c !== b), direct: Math.abs(a.x - b.x) <= 240 };
  });

  // ---- SW-PWY-5: the tier and lane of each line that runs the rack ----
  const rack: RackLayout = { x0: PWY.bent, x1: LENGTH - PWY.bent, bentSpacing: PWY.bent, halfWidth: PWY.half, tiers: PWY.tiers, loadPsf: PWY.loadPsf };   // the first and last bays are limit bays (SW-PWY-4)
  const own: Placed[] = [], derived: InteriorModel['derived'] = {}, kit = interiorKit({ pedestal: PWY.PAD, padHeight: PWY.PAD }, own, derived);
  const built = kit.rack({ ...rack, x0: 0, x1: LENGTH });
  // how far from the centre line a pipe's side may lie: 3 in short of the round the generator holds a column by (its section's half-diagonal about its axis)
  const edge = PWY.half - built.cd.d / 2 - Math.hypot(built.cd.d, built.cd.bf) / 2 - 3;
  const foreseen: RackLane[] = [], tierOf = new Map<Plan, number>(), laneOf = new Map<Plan, number>(); let tierRoom = 72;
  const HW = PWY.half, top = PWY.tiers.length - 1, clampX = (x: number) => Math.min(rack.x1 - 12, Math.max(rack.x0 + 12, up(x)));
  // SW-PWY-11: the headers' band, and 3 ft either side of it where their branches come down (SW-PWY-12), are no lane of any other line; a strip reaches 8 ft from the
  // centre line at least
  const band = headerLanes.length ? { z0: Math.min(...headerLanes.map(L => L.z - L.OD / 2)), z1: Math.max(...headerLanes.map(L => L.z + L.OD / 2)) } : undefined, STRIP = 36;
  const strips = band ? { z0: Math.min(band.z0 - STRIP, -96), z1: Math.max(band.z1 + STRIP, 96) } : undefined;
  // SW-PWY-12: the generator lets a line through the head room it keeps over a tier only within 6 ft of the line's own end (SW-RT-3), so a branch comes down within 6 ft of
  // its header: each header must have a place for that beside the band, 12 in clear of it, 18 in from the top tier's stringers and 18 in inside the strip
  if (band && strips) for (const L of headerLanes) {
    const place = (z: number) => Math.abs(z - L.z) <= 72 && (z <= band.z0 - 12 || z >= band.z1 + 12) && z >= strips.z0 + 18 && z <= strips.z1 - 18 && PWY.topStringers.every(q => Math.abs(z - q) >= 18);
    let found = false; for (let z = down(strips.z0); z <= strips.z1; z += 6) if (place(z)) found = true;
    if (!found) throw new Error(`the main pipeway: the ${L.h.key} header, at z ${L.z}, has no place within 6 ft of it where a branch can come down beside the band (SW-PWY-12)`);
  }
  const bandLanes: RackLane[] = !band || !strips ? [] : [...headerLanes.map(L => ({ t: top, z: L.z, OD: L.OD, x0: rack.x0, x1: rack.x1 })), { t: top, z: (strips.z0 + band.z0) / 2, OD: band.z0 - strips.z0, x0: rack.x0, x1: rack.x1 }, { t: top, z: (band.z1 + strips.z1) / 2, OD: strips.z1 - band.z1, x0: rack.x0, x1: rack.x1 }];
  {
    const onRack = plans.filter(p => !p.direct).map(p => ({ p, OD: pipeDims(p.L.NPS, p.L.cls).OD, x0: Math.min(clampX(p.a.x), clampX(p.b.x)), x1: Math.max(clampX(p.a.x), clampX(p.b.x)) }));
    const order = [...onRack].sort((p, q) => q.p.L.NPS - p.p.L.NPS || (q.x1 - q.x0) - (p.x1 - p.x0) || p.p.t.key.localeCompare(q.p.t.key));
    const cands: number[] = []; for (let z = -(HW - 24); z <= HW - 24; z += 6) cands.push(z); cands.sort((p, q) => Math.abs(p) - Math.abs(q) || p - q);
    const over = (L: RackLane, x0: number, x1: number) => !(L.x1 < x0 - 24 || L.x0 > x1 + 24);
    const free = (taken: RackLane[], t: number, z: number, OD: number, x0: number, x1: number) => taken.every(L => L.t !== t || !over(L, x0, x1) || Math.abs(L.z - z) >= laneSpacing(L.OD, OD));
    // the tiers a line may lie on, in the order they are tried: the main tier 4 ft above each of its spools' unit tiers, or 2 ft below, where its elbows allow; then, for one of 8 in
    // or less, any other (it changes level in the strip between the rack and the unit); a larger one that can lie on neither tier next to its spools, the lowest
    const turn = (c: Conn, t: number, NPS: number, cls: PipeClass) => c.end !== undefined || Math.abs(mainY(t, NPS, cls) - c.y) >= turnHeight(NPS, cls);
    const beside = (c: Conn, t: number) => c.end !== undefined || t === c.unitTier || t === c.unitTier! - 1;
    // The top tier is kept for the utility headers of the next stage: a line lies on it only where its spools leave it no other (`topToo`: or where the two below cannot take it)
    const allowed = (p: Plan, topToo: boolean): number[] => {
      const all = [...PWY.tiers.keys()], ends = [p.a, p.b], next = all.filter(t => ends.every(c => beside(c, t) && turn(c, t, p.L.NPS, p.L.cls)));
      const any = p.L.NPS <= 8 ? [...next, ...all.filter(t => !next.includes(t) && ends.every(c => turn(c, t, p.L.NPS, p.L.cls)))] : next.length ? next : all.filter(t => ends.every(c => turn(c, t, p.L.NPS, p.L.cls))).slice(0, 1);
      const below = any.filter(t => t !== top); return topToo || !below.length ? any : below;
    };
    const nx = Math.ceil(LENGTH / 24) + 2, most = 0.85 * (2 * HW - 48);
    const wide = (NPS: number, cls: PipeClass) => Math.max(designFlange(NPS, cls).OD, gateWidth(NPS, cls) + 3);
    let stuck = '';
    const share = (room: number, topToo: boolean): { taken: RackLane[]; put: Map<Plan, RackLane>; beside: Map<Conn, number> } | undefined => {
      // the headers' band is taken on the top tier from the start; it is not counted in what the tiers are loaded to, which shares the process lines out between them
      const load = PWY.tiers.map(() => new Float64Array(nx)), taken: RackLane[] = [...bandLanes], put = new Map<Plan, RackLane>(), besideOf = new Map<Conn, number>();
      for (const v of order) {
        const p = v.p, i0 = Math.max(0, Math.floor((v.x0 - 36) / 24)), i1 = Math.min(nx - 1, Math.ceil((v.x1 + 36) / 24)), w = v.OD + 3, sides = [p.a, p.b].map(c => c.side).filter(s => s !== 0);
        const s = sides.length && sides.every(q => q === sides[0]) ? sides[0] : 0, inner = s ? [...cands.filter(c => c * s >= 0), ...cands.filter(c => c * s < 0)] : cands;
        // a line over 10 in that comes onto the rack from a unit lies in the outermost lane on that unit's side: it cannot cross over the lanes of the tier below (the generator holds a
        // kept lane 9 in above its pipe, and a 16 in line 2 ft above that tier's pipes does not clear it)
        const big = p.L.NPS > 10 && s !== 0, zs = big ? [...inner].sort((a, b) => b * s - a * s) : inner;
        const fits = (k: number) => { let m = 0; for (let i = i0; i <= i1; i++) m = Math.max(m, load[k][i]); return m + w <= room; };
        let got: RackLane | undefined, extra: RackLane[] = [], side2 = new Map<Conn, number>();
        // every lane on the side its parties stand on is tried, tier by tier, before any on the far side: a line on the far side crosses under the whole rack to reach it
        const tiersOk = allowed(p, topToo).filter(fits), tries: [number, number][] = [...tiersOk.flatMap(t => zs.filter(c => !s || c * s >= 0).map(z => [t, z] as [number, number])), ...tiersOk.flatMap(t => zs.filter(c => s && c * s < 0).map(z => [t, z] as [number, number]))];
        for (const [t, z] of tries) {
          {
            if (Math.abs(z) + v.OD / 2 > edge || stringersBy(t).some(q => Math.abs(z - q) < v.OD / 2 + STRINGER) || !free(taken, t, z, v.OD, v.x0 - 36, v.x1 + 36)) continue;
            const more: RackLane[] = [], sideZ = new Map<Conn, number>(); let ok = true;
            const hold = (tt: number, zz: number, OD: number, x0: number, x1: number) => { if (!free([...taken, ...more], tt, zz, OD, x0, x1)) ok = false; else more.push({ t: tt, z: zz, OD, x0, x1 }); };
            for (const c of [p.a, p.b]) {
              // SW-PWY-4: at a limit bay the lane is as wide as the valves that stand there, and where they would reach the lines of the tier above, that tier's lane over them is kept clear
              if (c.end) { const xe = c.end === 'west' ? 0 : LENGTH, x0 = Math.min(xe, c.end === 'west' ? rack.x0 + 60 : rack.x1 - 60), x1 = Math.max(xe, c.end === 'west' ? rack.x0 + 60 : rack.x1 - 60);
                hold(t, z, wide(c.NPS, c.cls), x0, x1); for (let tt = t + 1; tt <= top; tt++) if (mainY(t, c.NPS, c.cls) + gateReach(c.NPS) + 3 > PWY.tiers[tt]) hold(tt, z, gateWidth(c.NPS, c.cls), x0, x1); }
              // a line over 8 in that falls or rises past a tier on its way to its lane has that tier's lane clear where it passes (a smaller one changes level in the strip outside the rack)
              else if (p.L.NPS > 8) for (let tt = 0; tt <= top; tt++) if (tt !== t && (PWY.tiers[tt] - c.y) * (PWY.tiers[tt] - mainY(t, p.L.NPS, p.L.cls)) < 0) hold(tt, z, v.OD, c.x - 60, c.x + 60);
              // and one over 10 in has the lane of the tier below its spool's level clear beneath where it comes in
              if (!c.end && big) { let tb = -1; PWY.tiers.forEach((q, i) => { if (q < c.y) tb = i; }); if (tb >= 0 && tb !== t) hold(tb, z, v.OD, c.x - 60, c.x + 60); }
            }
            // a second connection at the same limit bay stands beside the line's own, a valve's width off, on whichever side is free
            for (const c of p.rest.filter(q => q.end)) { const xe = c.end === 'west' ? 0 : LENGTH, x0 = Math.min(xe, c.end === 'west' ? rack.x0 + 60 : rack.x1 - 60), x1 = Math.max(xe, c.end === 'west' ? rack.x0 + 60 : rack.x1 - 60), wd = wide(c.NPS, c.cls), step = up(Math.max(wd, wide(p.L.NPS, p.L.cls)) / 2 + wd / 2 + 3);
              const zz = [z + step, z - step, z + 2 * step, z - 2 * step].find(q => Math.abs(q) + designFlange(c.NPS, c.cls).OD / 2 <= edge && !stringersBy(t).some(st => Math.abs(q - st) < designFlange(c.NPS, c.cls).OD / 2 + STRINGER) && free([...taken, ...more], t, q, wd, x0, x1));
              if (zz === undefined) ok = false; else { more.push({ t, z: zz, OD: wd, x0, x1 }); sideZ.set(c, zz); } }
            if (ok) { got = { t, z, OD: v.OD, x0: v.x0, x1: v.x1, no: p.t.key }; extra = more; side2 = sideZ; break; }
          }
        }
        if (!got) { stuck = `"${p.t.key}" (${p.L.NPS} in, ${Math.round(v.x0)} to ${Math.round(v.x1)}; tiers it may lie on: ${allowed(p, topToo).map(t => t + 1).join(', ') || 'none'}; ${p.a.party}${p.a.unitTier !== undefined ? ` tier ${p.a.unitTier + 1}` : ''} to ${p.b.party}${p.b.unitTier !== undefined ? ` tier ${p.b.unitTier + 1}` : ''})`; return undefined; }
        for (let i = i0; i <= i1; i++) load[got.t][i] += w;
        taken.push(got, ...extra); put.set(p, got); for (const [c, zz] of side2) besideOf.set(c, zz);
      }
      return { taken, put, beside: besideOf };
    };
    let planned: ReturnType<typeof share>;
    for (const topToo of [false, true]) { if (planned) break; for (tierRoom = 72; tierRoom <= most && !planned; tierRoom += 12) planned = share(tierRoom, topToo); }
    if (!planned) throw new Error(`the main pipeway: its lines do not fit ${PWY.tiers.length} tiers at ${Math.round(most)} in of lanes each: no lane for ${stuck}`);
    tierRoom -= 12;
    for (const [p, L] of planned.put) { tierOf.set(p, L.t); laneOf.set(p, L.z); }
    foreseen.push(...planned.taken);
    // SW-PWY-4: the limit spools at the rack's two ends, each on the lane its line runs in
    const endSpool = (p: Plan, c: Conn, z: number) => {
      const t = tierOf.get(p)!, tag = newTag(), y = mainY(t, p.L.NPS, p.L.cls), at: V3 = [c.end === 'west' ? PWY.limit : LENGTH - PWY.limit, y, z], toRack: V3 = [c.end === 'west' ? 1 : -1, 0, 0];
      addNozzle(`${tag}-P`, tag, 'pipeway side', c.NPS, c.cls, at, toRack); addNozzle(`${tag}-U`, tag, 'limit', c.NPS, c.cls, at, [-toRack[0], 0, 0]);
      const face = nozzles.get(`${tag}-P`)!.face; Object.assign(c, { nozzle: `${tag}-P`, own: tag, x: face[0], y: face[1], z: face[2] });
    };
    for (const p of plans.filter(q => !q.direct)) { for (const c of [p.a, p.b]) if (c.end) endSpool(p, c, laneOf.get(p)!); for (const c of p.rest) if (c.end) endSpool(p, c, planned.beside.get(c)!); }
    if (plans.some(p => p.direct && [p.a, p.b, ...p.rest].some(c => c.end))) throw new Error('a line laid direct has a party at an end of the rack');
  }
  if (conns.some(c => !c.nozzle)) throw new Error(`no spool for ${conns.filter(c => !c.nozzle).map(c => `${c.party} on "${c.stream}"`).join(', ')}`);

  // ---- the line list (SW-PWY-1, SW-PWY-3, SW-PWY-4) ----
  const lines: PipewayLine[] = [], streams: StreamPlan[] = []; let seqMain = 0, seqBranch = 100, seqStub = 800;
  const nz = (c: Conn): EndRef => ({ k: 'nozzle', id: c.nozzle });
  for (const p of plans) {
    const { t, L } = p, main = lineNumber(PWY.area, ++seqMain, L.NPS, L.cls, t.fluid), rest = { unit: PWY.area, stream: t.key, fluid: t.fluid, designP: L.designP, designT: L.designT };
    lines.push({ def: { no: main, service: 'P' as Service, NPS: L.NPS, cls: L.cls, from: nz(p.a), to: nz(p.b), kind: 'routed' }, seq: seqMain, origin: 'main', ...rest, ...(tierOf.has(p) ? { tier: tierOf.get(p)! } : {}), bare: ['from', 'to'] });
    const branches: string[] = [];
    for (const c of p.rest) {
      const no = lineNumber(PWY.area, ++seqBranch, c.NPS, L.cls, t.fluid), tap: EndRef = { k: 'tap', line: main, valve: false };
      lines.push({ def: { no, service: 'P' as Service, NPS: c.NPS, cls: L.cls, from: c.sends ? nz(c) : tap, to: c.sends ? tap : nz(c), kind: 'routed' }, seq: seqBranch, origin: 'branch', ...rest, bare: [c.sends ? 'from' : 'to'] });
      branches.push(no);
    }
    const role = (c: Conn): 'end' | 'branch' => (c === p.a || c === p.b ? 'end' : 'branch');
    streams.push({ stream: t.key, fluid: t.fluid, NPS: L.NPS, cls: L.cls, designP: L.designP, designT: L.designT, main, branches, parties: [p.a, p.b, ...p.rest].map(c => ({ party: c.party, sends: c.sends, nozzle: c.nozzle, NPS: c.NPS, role: role(c) })), laid: p.direct ? 'direct' : 'on the rack' });
    // SW-PWY-4: beyond each limit spool, the party's block valve and blind
    for (const c of [p.a, p.b, ...p.rest]) if (c.own) {
      const stub = lineNumber(PWY.area, ++seqStub, c.NPS, L.cls, t.fluid), A = nozzles.get(c.nozzle)!.A as V3;
      lines.push({ def: { no: stub, service: 'P' as Service, NPS: c.NPS, cls: L.cls, from: { k: 'nozzle', id: `${c.own}-U` }, to: { k: 'blind' }, kind: 'stub' }, seq: seqStub, origin: 'limit', ...rest });
      limits.push({ tag: c.own, stream: t.key, party: c.party, unit: c.unit, sends: c.sends, line: role(c) === 'end' ? main : branches[p.rest.indexOf(c)], stub, NPS: c.NPS, cls: L.cls, at: A, where: c.end ? `${c.end} limit bay` : 'valve bay' });
    }
  }
  // ---- SW-PWY-11, SW-PWY-12: the utility headers, in the order of their lanes (the generator gives its lanes in the order of its list), then their branches, the largest first ----
  const headerPlans: HeaderPlan[] = []; let seqHeader = 400, seqTake = 600;
  for (const L of headerLanes) {
    const h = L.h, no = lineNumber(PWY.area, ++seqHeader, h.NPS, h.cls, h.fluid);
    lines.push({ def: { no, service: serviceOf(h.fluid, h.cls, true, h.NPS) as Service, NPS: h.NPS, cls: h.cls, from: { k: 'blind' }, to: { k: 'blind' }, kind: 'header' }, unit: PWY.area, seq: seqHeader, stream: h.key, fluid: h.fluid, origin: 'header', designP: h.designP, designT: h.designT, tier: top });
    headerPlans.push({ fluid: h.fluid, key: h.key, line: no, NPS: h.NPS, cls: h.cls, designP: h.designP, designT: h.designT, z: L.z, sizedBy: { line: h.line.NPS, stretch: h.stretch, stretchNPS: h.stretchNPS, joined: h.joined }, made: h.made, used: h.used, parties: [] });
  }
  // those of a party across the centre line from its header first: such a branch comes down on its header's side and passes under the band (SW-PWY-12), the longest way
  // there is, and is given the first choice of it
  for (const c of conns.filter(q => q.header).sort((a, b) => far(b) - far(a) || b.NPS - a.NPS || a.x - b.x || a.nozzle.localeCompare(b.nozzle))) {
    // a branch has no valve of its own: its service would decide nothing but the valve the generator stands at the spool and that is not built (SW-PWY-7), so it is numbered and built as a process line (SW-RPI-3)
    // 3 in at least: a smaller pipe does not span from the rack's edge to the junction frame (SW-PS-7); where the spool is smaller the branch is reduced at it
    const hp = headerPlans.find(q => q.key === c.stream)!, size = Math.max(MIN_BRANCH, c.NPS), no = lineNumber(PWY.area, ++seqTake, size, hp.cls, hp.fluid), tap: EndRef = { k: 'tap', line: hp.line, valve: false };
    if (size > hp.NPS) throw new Error(`${c.party}: its ${size} in branch is larger than the ${hp.key} header, ${hp.NPS} in (SW-PRC-19)`);
    const rest = { unit: PWY.area, stream: hp.key, fluid: hp.fluid, designP: hp.designP, designT: hp.designT };
    lines.push({ def: { no, service: 'P' as Service, NPS: size, cls: hp.cls, from: c.sends ? nz(c) : tap, to: c.sends ? tap : nz(c), kind: 'routed' }, seq: seqTake, origin: 'branch', ...rest, bare: [c.sends ? 'from' : 'to'] });
    hp.parties.push({ party: c.party, unit: c.unit, sends: c.sends, nozzle: c.nozzle, NPS: size, spool: c.NPS, branch: no });
    if (c.own) {   // SW-PWY-4: beyond a limit spool, the party's block valve and blind
      const stub = lineNumber(PWY.area, ++seqStub, c.NPS, hp.cls, hp.fluid), A = nozzles.get(c.nozzle)!.A as V3;
      lines.push({ def: { no: stub, service: 'P' as Service, NPS: c.NPS, cls: hp.cls, from: { k: 'nozzle', id: `${c.own}-U` }, to: { k: 'blind' }, kind: 'stub' }, seq: seqStub, origin: 'limit', ...rest });
      limits.push({ tag: c.own, stream: hp.key, party: c.party, unit: c.unit, sends: c.sends, line: no, stub, NPS: c.NPS, cls: hp.cls, at: A, where: 'valve bay' });
    }
  }
  for (const hp of headerPlans) hp.parties.sort((a, b) => nozzles.get(a.nozzle)!.face[0] - nozzles.get(b.nozzle)!.face[0]);
  const list = lines.map(l => l.def), byNo = new Map(list.map(l => [l.no, l])), mainOf = new Map(plans.map((p, i) => [p, streams[i].main]));
  for (const L of foreseen) if (L.no !== undefined) L.no = streams.find(s => s.stream === L.no)!.main;   // a lane was planned under its stream's name: now under its line's number

  // ---- the pipeway's own steel: the rack (SW-PWY-2), the stringers under each tier and a junction frame at each unit's limit (SW-PWY-9) ----
  const junctions: Junction[] = [];
  { const st = makeWideFlange('W8x18', 8, 18, PWY.bent - 12);
    for (const [t, tier] of PWY.tiers.entries()) for (const z of stringersOf(t)) for (let x = 0; x < LENGTH - 1e-6; x += PWY.bent) own.push({ part: st, transform: frameFromAxes([x + 6, tier - 16, z], [0, 1, 0], [1, 0, 0]), tags: ['rack-stringer', 'beam'] }); }
  for (const U of units) {
    const mine = conns.filter(c => c.unit === U.unit); if (!mine.length) continue;
    // a beam under every main tier: a line may cross to the rack at any of the three levels, whatever tier its spool stands on (it changes level in the unit's valve bay or in the strip)
    const tiers = [...PWY.tiers.keys()], span = 2 * U.half, D = up(span / 20, 2), w = up(2.75 * D, 5), Dp = Math.max(10, D - 2), wp = up(2.75 * Dp, 5), z = U.side * PWY.junction;
    const beam = makeWideFlange(`W${D}x${w}`, D, w, span - Dp), post = makeWideFlange(`W${Dp}x${wp}`, Dp, wp, PWY.tiers[tiers[tiers.length - 1]] - PWY.PAD), tag = `junction:U${U.unit}`;
    for (const sx of [-1, 1]) { const x = U.x + sx * U.half; own.push({ part: kit.concrete('pedestal', Dp + 12, PWY.PAD, Dp + 12), transform: frameFromAxes([x - (Dp + 12) / 2, PWY.PAD / 2, z], [0, 1, 0], [1, 0, 0]), tags: ['junction', tag, 'pad'] }); own.push({ part: post, transform: multiply(translate(x, PWY.PAD, z), standUp()), tags: ['junction', tag, 'post'] }); }
    for (const t of tiers) own.push({ part: beam, transform: frameFromAxes([U.x - U.half + Dp / 2, PWY.tiers[t] - D / 2, z], [0, 1, 0], [1, 0, 0]), tags: ['junction', tag, 'beam'] });
    junctions.push({ unit: U.unit, x: U.x, z, half: U.half, tiers, beam: `W${D}x${w}`, post: `W${Dp}x${wp}` });
  }
  // ---- SW-PWY-8: the steel of each unit that stands in its valve bay, as it stands; the tier beams of its rack's first bent are not shown to the generator ----
  const unitSteel: Placed[] = [], hidden: Placed[] = [];
  for (const U of units) {
    const firstBent = `rack-bent:${RACK.start - RACK.bent}`;
    for (const pl of U.cell.interior.instances) {
      if (pl.tags.includes('rack-ladder') && pl.transform[12] < RACK.start) continue;                    // SW-CELL-2: no ladder at the rack's battery-limit end
      if (pl.transform[12] > RACK.start + 12) continue;
      const [mn, mx] = placedBox(pl, I); if (mn[0] > RACK.start - RACK.bent / 2 + 24 || Math.abs((mn[2] + mx[2]) / 2) > U.half + 36) continue;
      const q: Placed = { part: pl.part, transform: multiply(U.T, pl.transform), tags: [...pl.tags, `unit-${U.unit}`] };
      (pl.tags.includes('beam') && pl.tags.includes(firstBent) ? hidden : unitSteel).push(q);
    }
  }
  const interior: InteriorModel = { instances: [...own, ...unitSteel, ...hidden], derived, notes: [`Main pipeway: rack ${LENGTH / 12} ft long, ${(2 * HW) / 12} ft wide, tiers at ${PWY.tiers.map(t => t / 12).join(', ')} ft; ${junctions.length} junction frames (SW-PWY-2, SW-PWY-9).`], equipment: [] };

  // ---- SW-PWY-8: where lines may travel ----
  const gridTop = PWY.tiers[top] + 144, G = { x0: -60, x1: LENGTH + 60, z0: -720, z1: 720 }, low = RACK.tiers[0] - 12;   // across, as far as the units' second bents: a limit spool at a bay's middle has its valve beyond it
  const keepOut: Placed[] = [block([G.x0, 0, G.z0], [G.x1, low, G.z1])];
  for (const side of [-1, 1] as const) {
    // beyond the corridor's edge only the valve bays of the units on that side are open: between each rack's column lines, as far as its spools (a unit not yet piped: as far as the valves beyond its limit spools)
    const holes = units.filter(u => u.side === side && conns.some(c => c.unit === u.unit)).map(u => ({ x0: u.x - u.half, x1: u.x + u.half, depth: Math.max(u.piped ? 156 : 264, ...conns.filter(c => c.unit === u.unit && !c.end).map(c => Math.abs(c.z) - 360 + (u.piped ? 18 : 126))) })).sort((a, b) => a.x0 - b.x0);
    let x = G.x0; const zin = side * 360, zout = side * G.z1, z0 = Math.min(zin, zout), z1 = Math.max(zin, zout);
    for (const h of holes) { if (h.x0 > x) keepOut.push(block([x, low, z0], [h.x0, gridTop, z1])); const zd = side * (360 + h.depth); keepOut.push(block([h.x0, low, Math.min(zd, zout)], [h.x1, gridTop, Math.max(zd, zout)])); x = h.x1; }
    if (x < G.x1) keepOut.push(block([x, low, z0], [G.x1, gridTop, z1]));
  }
  // SW-PWY-8 (amended 2026-11-26): each unit's cooling water header spools, which the cooling water mains join (§81), and the room in front of each that its branch will need
  for (const U of units.filter(u => u.piped)) for (const sp of piping.get(U.unit)!.spools.filter(q => q.header && M.headers.some(h => h.key === q.stream && (h.fluid === 'CWS' || h.fluid === 'CWR')))) {
    const q = piping.get(U.unit)!.nozzles.get(`${sp.tag}-P`)!, A = xf(U.T, q.A as V3), u = rot(U.T, q.u as V3), w = designFlange(sp.NPS, sp.cls).OD / 2;   // the generator keeps its own 3 in from it besides
    const L = q.S + gateFaceToFace(sp.NPS, sp.cls) + 6 + elbowRadius(pipeDims(sp.NPS, sp.cls).OD) + 12, a: V3 = [A[0] - u[0] * (q.S + 3), A[1], A[2] - u[2] * (q.S + 3)], b: V3 = [A[0] + u[0] * L, A[1], A[2] + u[2] * L];
    keepOut.push({ ...block([Math.min(a[0], b[0]) - (u[0] ? 0 : w), A[1] - w, Math.min(a[2], b[2]) - (u[2] ? 0 : w)], [Math.max(a[0], b[0]) + (u[0] ? 0 : w), A[1] + w, Math.max(a[2], b[2]) + (u[2] ? 0 : w)], 'cooling water spool'), tags: ['keep-out', 'cladding', 'cooling water spool'] });
  }
  const shown: InteriorModel = { ...interior, instances: [...own, ...unitSteel, ...keepOut] };
  const building: BuildingModel = { instances: [], derived: {}, notes: [], drawing: { bays: PWY.bays, bayFt: PWY.bent / 12, widthFt: (2 * HW) / 12, eaveFt: 0, slopeRisePer12: 0, slabIn: 0 } } as unknown as BuildingModel;
  const plant: PlantDef = {
    id: `R${PWY.area}`, name: 'SmartWeld coastal refinery (plant 3), area 10: the main pipeway',
    building: () => building, interior: () => shown, nozzles: () => nozzles, nozzleDefs: () => defs, lines: () => list, rack,
    grid: { x0: G.x0, x1: G.x1, y1: gridTop, z0: G.z0, z1: G.z1 },
    joint: l => jointBySpec(lineGroup(l, byNo), l.NPS), flangeType: l => flangeBySpec(lineGroup(l, byNo), l.NPS, l.cls), verticalThroughPlatforms: true,
    areas: { PWY: { name: 'Main pipeway', equipment: [...new Set([...nozzles.values()].map(q => q.equip))] } }, pilot: [],
    paths: { piping: 'public/refinery/piping/pipeway.json', groundtruth: 'public/refinery/units/pipeway/groundtruth', answerKey: 'eval/refinery/answer-key-pipeway.json', designer: 'downloads/refinery/pipeway' },
  };

  // ---- SW-PWY-6: the runs of the generator: each line that runs the rack in one of its own, with its branches; then what remains ----
  const runs: UnitRun[] = [], runOf = new Map<string, number>();
  {
    const add = (r: UnitRun) => { const fresh = r.lines.filter(no => !runOf.has(no)); if (!fresh.length) return; for (const no of fresh) runOf.set(no, runs.length); runs.push({ ...r, lines: fresh }); };
    const racked = plans.filter(p => !p.direct).sort((p, q) => q.L.NPS - p.L.NPS || tierOf.get(p)! - tierOf.get(q)! || mainOf.get(p)!.localeCompare(mainOf.get(q)!));
    for (const p of racked) { const s = streams[plans.indexOf(p)]; add({ kind: 'rack', lines: [s.main, ...s.branches], lane: foreseen.find(L => L.no === s.main)! }); }
    add({ kind: 'rest', lines: list.map(l => l.no) });
  }
  /** the room a later run's line will need for the first valves at one of its nozzles: a spool's, where a valve can only stand stem up (SW-RPI-7) */
  const reserve = (id: string): Placed[] => {
    const q = nozzles.get(id)!, f = designFlange(q.NPS, q.cls).OD / 2, L = q.S + gateFaceToFace(q.NPS, q.cls) + 2 * q.NPS + 24;
    const box = (len: number, half: number, topUp: number) => { const a = q.A as V3, b: V3 = [a[0] + q.u[0] * len, a[1], a[2] + q.u[2] * len], w = (k: number) => (q.u[k] ? 0 : half);
      return block([Math.min(a[0], b[0]) - w(0), a[1] - f, Math.min(a[2], b[2]) - w(2)], [Math.max(a[0], b[0]) + w(0), a[1] + topUp, Math.max(a[2], b[2]) + w(2)], 'room for valves'); };
    return [box(L, f, f), box(q.S + gateFaceToFace(q.NPS, q.cls) + 3, Math.max(f, gateWidth(q.NPS, q.cls) / 2), gateReach(q.NPS))];
  };
  const laneY = (L: RackLane) => { const d = byNo.get(L.no!)!; return mainY(L.t, d.NPS, d.cls); };
  const atEnd = (e: EndRef) => e.k === 'nozzle' && conns.some(c => c.nozzle === e.id && c.end !== undefined);
  const xAt = (e: EndRef) => (e.k === 'nozzle' ? nozzles.get(e.id)!.face[0] : NaN);
  /** SW-RPI-7: the lane kept for a line not yet routed */
  const kept = (L: RackLane, wideTo: boolean): Placed[] => {
    const d = byNo.get(L.no!)!, lo = xAt(d.from) <= xAt(d.to) ? d.from : d.to, hi = lo === d.from ? d.to : d.from, a = L.x0 + (atEnd(lo) ? 24 : -36), b = L.x1 + (atEnd(hi) ? -24 : 36);
    const y = laneY(L), r = L.OD / 2, h = keptReach(r), w = wideTo ? Math.max(r, h, r + 6) : r;   // (a pipe's radius and 6 in: a line of another tier that passes this lane on its way down keeps the generator's clearance from the pipe to come)
    return b - a >= 12 ? [block([Math.max(rack.x0 + 6, a), y - h, L.z - w], [Math.min(rack.x1 - 6, b), y + h, L.z + w], 'lane kept')] : [];
  };
  const widest = (t: number) => Math.max(0, ...foreseen.filter(L => L.t === t && L.no !== undefined).map(L => L.OD));
  /** SW-RPI-7: the fence on the tier of a run's line: the tier closed at the height its pipes lie at but for a slot along the line's own lane */
  const fence = (L: RackLane): Placed[] => {
    const slot = 6 * Math.ceil((L.OD / 2 + 6) / 6 - 1e-9) + 2, y0 = PWY.tiers[L.t] + 4, y1 = y0 + widest(L.t), out: Placed[] = [];
    out.push(block([rack.x0 + 6, y0, -HW], [rack.x1 - 6, y1, L.z - slot], 'lane fence'), block([rack.x0 + 6, y0, L.z + slot], [rack.x1 - 6, y1, HW], 'lane fence'));
    return out;
  };
  const runPlant = (k: number, prior: Placed[], whole = false): PlantDef => {
    const run = runs[k], rest = run.kind === 'rest', mine = new Set(run.lines);
    const held = lines.filter(l => runOf.get(l.def.no)! > k).flatMap(l => [l.def.from, l.def.to].filter((e): e is Extract<EndRef, { k: 'nozzle' }> => e.k === 'nozzle').flatMap(e => reserve(e.id)));
    const lanesKept = foreseen.filter(L => L.no !== undefined && runOf.get(L.no)! > k).flatMap(L => kept(L, !run.lane || run.lane.t !== L.t)), gates = run.lane ? fence(run.lane) : [];
    // SW-PWY-12: until the last run the headers' band and the strips beside it are held on the top tier, as high as their branches rise. In the last run the space over the
    // top tier is closed from 6 ft above it, and from its level upward outside the band and its strips as far as the junction frames: a branch then crosses over the
    // headers, comes down in a strip and goes out under the tier, where the steel is. A block about each cap (SW-RPI-12)
    const y0 = PWY.tiers[top], over: Placed[] = [];
    if (band && strips) {
      if (!rest) over.push(block([rack.x0 + 6, y0 + 4, strips.z0], [rack.x1 - 6, y0 + 72, strips.z1], 'header band'));
      else {
        over.push(block([G.x0, y0 + 72, G.z0], [G.x1, gridTop, G.z1]), block([rack.x0, y0, -PWY.junction + 6], [rack.x1, y0 + 72, strips.z0]), block([rack.x0, y0, strips.z1], [rack.x1, y0 + 72, PWY.junction - 6]));
        // only the headers' branches are routed in this run where no stream's line is laid direct: they cross under the top tier, and the space under the rack below the level
        // of the units' top tiers is closed to them (a branch found its way under the lowest tier and up through two tiers of lanes; another ran out of search among them)
        if (plans.every(q => !q.direct)) over.push(block([rack.x0, low, -(HW - 6)], [rack.x1, RACK.tiers[RACK.tiers.length - 1] - 6, HW - 6]));
        for (const L of headerLanes) { const y = mainY(top, L.h.NPS, L.h.cls), q = L.OD / 2 + 3; over.push(block([rack.x0 + 3, y - q, L.z - q], [rack.x0 + 12, y + q, L.z + q], 'header cap'), block([rack.x1 - 12, y - q, L.z - q], [rack.x1 - 3, y + q, L.z + q], 'header cap')); }
      }
    }
    const inst = [...shown.instances, ...held, ...lanesKept, ...gates, ...over, ...prior];
    const ends = lines.filter(l => mine.has(l.def.no)).flatMap(l => [l.def.from, l.def.to]).filter((e): e is Extract<EndRef, { k: 'nozzle' }> => e.k === 'nozzle').map(e => nozzles.get(e.id)!);
    const xs = ends.flatMap(q => [q.A[0], q.face[0]]), full = { x0: G.x0, x1: G.x1, y1: gridTop, z0: G.z0, z1: G.z1 };
    const grid = whole || rest || !ends.length ? full : { ...full, x0: Math.max(G.x0, down(Math.min(...xs) - 360)), x1: Math.min(G.x1, up(Math.max(...xs) + 360)) };
    return { ...plant, grid, rack: { ...rack, tiers: PWY.tiers.slice(run.lane ? run.lane.t : 0) }, interior: () => ({ ...shown, instances: inst }) };
  };
  const tiers = [...new Set(tierOf.values())].sort((a, b) => a - b);
  // ---- SW-PWY-13: what lies along each tier, bay by bay, against the 40 psf the tier is built for ----
  const perFoot = (NPS: number, cls: PipeClass, sg: number) => { const d = pipeDims(NPS, cls), id = d.OD - 2 * d.t; return (Math.PI / 4) * ((d.OD ** 2 - id ** 2) * K.STEEL_DENSITY_LB_IN3 * 12 + (id ** 2 / 144) * K.WATER_DENSITY_LB_FT3 * sg); };
  const along: { t: number; x0: number; x1: number; w: number }[] = [];
  plans.forEach(p => { const L = foreseen.find(q => q.no === mainOf.get(p)); if (!L) return; const st = (p.t.from[0] ?? p.t.to[0]).s; along.push({ t: L.t, x0: L.x0, x1: L.x1, w: perFoot(p.L.NPS, p.L.cls, st.ph === 'V' ? 0 : st.sg) }); });
  for (const L of headerLanes) along.push({ t: top, x0: rack.x0 + 12, x1: rack.x1 - 12, w: perFoot(L.h.NPS, L.h.cls, ['HS', 'MS', 'LS', 'FG', 'IA', 'PA', 'NI'].includes(L.h.fluid) ? 0 : L.h.fluid === 'CA' ? 1.2 : 1) });
  const loads: TierLoad[] = PWY.tiers.map((_, t) => {
    let most = 0, bay = 0; const mine = along.filter(a => a.t === t);
    for (let k = 0; k < PWY.bays; k++) { const b0 = k * PWY.bent, b1 = b0 + PWY.bent, w = mine.reduce((a, q) => a + q.w * Math.max(0, Math.min(b1, q.x1) - Math.max(b0, q.x0)) / PWY.bent, 0); if (w > most) { most = w; bay = k + 1; } }
    return { tier: t + 1, lines: mine.length, most: Math.round(most), bay, limit: Math.round(PWY.loadPsf * (2 * HW) / 12) };
  });
  for (const q of loads) if (q.most > q.limit) notes.push(`Tier ${q.tier} carries ${q.most} lb a foot in bay ${q.bay}, more than the ${q.limit} lb a foot it is built for (SW-PWY-13).`);
  cache = { rack, interior, own, plant, lines, nozzles, conns, limits, junctions, streams, skipped, runs, runOf, runPlant, foreseen, tierRoom, tiers, notes, headers: headerPlans, loads, units: units.map(u => ({ unit: u.unit, x: u.x, side: u.side, half: u.half, piped: u.piped })) };
  return cache;
}
