/**
 * Piping generator (stage 5): routes every line of the line list through the plant and assembles it into
 * placed parts with weld and support records. DESIGN_BASIS.md §34–39. Output is plain data: each component
 * is a part key plus a transform; `partFromKey` rebuilds the part, so the same data drives the 3D view and
 * the ground-truth export.
 */
import {
  makePipe, makeFlange, makeBlindFlange, makeGasket, makeValve, makeElbow, makeTee, makeReducer, makeCap, makeButtWeld,
  makeShoe, makeStanchion, makeHanger, makeTrunnion, makeTrapeze, makeStudSet, designFlange, pipeDims, isOffered, elbowRadius, teeC, reducerLength,
  type PartSpec, type PipeClass, type ValveType,
} from '../catalogue';
import { frameFromAxes, type Vec3 } from '../geometry/transform';
import type { Mat4 } from '../geometry/mesh';
import { buildGeometry } from '../geometry/partGeometry';
import { transformMesh } from '../geometry/mesh';
import { Grid, route, corners, H, STATIC, DIRS, dirIndex, type V3 } from './router';
import { buildNozzles, type Nozzle } from './nozzles';
import { buildLineList, type LineDef, type EndRef } from './linelist';
import { generateBuilding, type Placed } from './building';
import { generateInterior, DEMO_LAYOUT } from './interior';
import { boxGap, segBox } from './pipingCheck';

// ---- vectors ---------------------------------------------------------------------------------------------
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const unit = (a: V3): V3 => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const neg = (a: V3): V3 => [-a[0], -a[1], -a[2]];
const snapUp = (v: number) => Math.ceil(v / H - 1e-9) * H;
/** First routed point beyond an end stack: one elbow radius out, snapped outward to the grid; if that would leave a
 *  pipe shorter than SW-RT-4's 2 in between the stack and the elbow, one more grid step (the elbow may also weld
 *  straight to the stack when the snap lands exactly). */
function leadP1(end: V3, u: V3, Rr: number): V3 {
  const ax = u.findIndex(v => v !== 0), sgn = u[ax], P1 = [...end] as V3;
  let s = sgn > 0 ? snapUp(end[ax] + Rr) : -snapUp(-(end[ax] - Rr));
  const gap = sgn * (s - end[ax]) - Rr; if (gap > 0.05 && gap < 2) s += sgn * H;
  P1[ax] = s; return P1;
}
/** any unit vector perpendicular to w, preferring world up, then +x */
const perp = (w: V3): V3 => Math.abs(w[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];

// ---- part keys -------------------------------------------------------------------------------------------
const memo = new Map<string, PartSpec>();
export function partFromKey(key: string): PartSpec {
  let p = memo.get(key); if (p) return p;
  const a = key.split('|'), n = (i: number) => Number(a[i]), c = (i: number) => a[i] as PipeClass;
  switch (a[0]) {
    case 'PIPE': p = makePipe(key, n(1), c(2), n(3)); break;
    case 'EL': p = makeElbow(key, n(1), c(2), n(3) as 90 | 45); break;
    case 'TEE': p = makeTee(key, n(1), c(2), n(3)); break;
    case 'RED': p = makeReducer(key, n(1), n(2), c(3), 'none'); break;
    case 'CAP': p = makeCap(key, n(1), c(2)); break;
    case 'WNF': p = makeFlange(key, n(1), c(2)); break;
    case 'BLIND': p = makeBlindFlange(key, n(1), c(2)); break;
    case 'GSK': p = makeGasket(key, n(1), c(2)); break;
    case 'STUDS': p = makeStudSet(key, n(1), c(2), n(3)); break;
    case 'VLV': p = makeValve(key, a[1] as ValveType, n(2), c(3)); break;
    case 'BW': p = makeButtWeld(key, n(1), c(2)); break;
    case 'SHOE': p = makeShoe(key, n(1), c(2), a[3] as 'shoe' | 'guide' | 'anchor', a[4] ? n(4) : 4); break;
    case 'STAN': p = makeStanchion(key, n(1), c(2), n(3)); break;
    case 'HANG': p = makeHanger(key, n(1), c(2), n(3)); break;
    case 'TRUN': p = makeTrunnion(key, n(1), c(2), n(3)); break;
    case 'TRAP': p = makeTrapeze(key, n(1), c(2), n(3), n(4)); break;
    default: throw new Error(`unknown part key ${key}`);
  }
  memo.set(key, p); return p;
}

// ---- records (ground truth, SW-PW-3) ---------------------------------------------------------------------
export interface Comp { tag: string; kind: string; key: string; T: Mat4; a: V3; b: V3; NPS: number; cls: PipeClass }
export interface WeldRec { id: string; line: string; type: 'BW' | 'FW'; size: number; at: V3; dir: V3; joins: [string, string]; field: boolean; NPS: number; key: string; T: Mat4 }
export interface SupportRec { id: string; line: string; type: 'shoe' | 'guide' | 'anchor' | 'stanchion' | 'hanger' | 'trunnion' | 'trapeze'; at: V3; key: string; T: Mat4 }
export interface LineRun { no: string; service: string; NPS: number; cls: PipeClass; kind: LineDef['kind']; from: string; to: string; comps: Comp[]; welds: WeldRec[]; supports: SupportRec[]; path: V3[]; ok: boolean; note?: string; cv?: boolean }
export interface NozzleRun { id: string; equip: string; service: string; NPS: number; cls: PipeClass; face: V3; u: V3; comps: Comp[]; welds: WeldRec[] }
export interface PipingModel { lines: LineRun[]; nozzles: NozzleRun[]; failures: string[]; stats: Record<string, number> }

// ---- dimensions of stack items --------------------------------------------------------------------------
const flangeLen = (NPS: number, cls: PipeClass) => { const f = designFlange(NPS, cls); return { f, Lf: f.tf + f.hubLen + f.neckLen, rf: f.rfH }; };
const isoValve = (NPS: number, cls: PipeClass): ValveType => NPS >= 2 ? 'GATE' : isOffered('BALL', NPS, cls) ? 'BALL' : 'GATE';
function valveF2F(type: ValveType, NPS: number, cls: PipeClass) { const v = partFromKey(`VLV|${type}|${NPS}|${cls}`); return v.dims.F2F.value + 2 * designFlange(NPS, cls).rfH; }

type Item = { k: 'gasket'; NPS: number; cls: PipeClass } | { k: 'valve'; type: ValveType; NPS: number; cls: PipeClass; stem?: V3 } | { k: 'wnf' | 'wnfR' | 'blind' | 'blindR'; NPS: number; cls: PipeClass }
  | { k: 'reducer'; from: number; to: number; cls: PipeClass } | { k: 'pipe'; NPS: number; cls: PipeClass; L: number } | { k: 'psv'; NPS: number; cls: PipeClass; out: V3 };
interface Built { comps: Comp[]; welds: { at: V3; w: V3; NPS: number; cls: PipeClass; joins: [string, string] }[]; end: V3; endIsWeld: boolean; extra?: { psvOutletFace?: V3; psvOutDir?: V3; psvOutNPS?: number } }

/** Build a stack of items along w starting at s (the face or weld end they start from). */
function buildStack(line: string, s: V3, w: V3, items: Item[], prevTag: string): Built {
  const comps: Comp[] = [], welds: Built['welds'] = []; let p = s, last = prevTag, lastWeld = false, extra: Built['extra'];
  const yUp = perp(w), stemDir: V3 = Math.abs(w[1]) < 0.9 ? [0, 1, 0] : [0, 0, w[1] > 0 ? 1 : -1];
  let pendingJoint: { at: V3; NPS: number; cls: PipeClass; stack: number } | null = null;
  let k = 0;
  for (const it of items) {
    const tag = `${line}/${comps.length + 1}`;
    if (it.k === 'gasket') {
      const f = designFlange(it.NPS, it.cls);
      comps.push({ tag, kind: 'gasket', key: `GSK|${it.NPS}|${it.cls}`, T: frameFromAxes(p, yUp, w), a: p, b: add(p, w, f.gasketT), NPS: it.NPS, cls: it.cls });
      pendingJoint = { at: add(p, w, f.gasketT / 2), NPS: it.NPS, cls: it.cls, stack: 2 * (f.tf + f.rfH) + f.gasketT };
      p = add(p, w, f.gasketT); lastWeld = false;
    } else if (it.k === 'valve') {
      const L = valveF2F(it.type, it.NPS, it.cls), c = add(p, w, L / 2);
      comps.push({ tag, kind: 'valve', key: `VLV|${it.type}|${it.NPS}|${it.cls}`, T: frameFromAxes(c, it.stem ?? stemDir, w), a: p, b: add(p, w, L), NPS: it.NPS, cls: it.cls });
      p = add(p, w, L); lastWeld = false;
    } else if (it.k === 'psv') {
      const v = partFromKey(`VLV|PSV|${it.NPS}|${it.cls}`), f = designFlange(it.NPS, it.cls), CFin = v.dims.CFin.value, CFout = v.dims.CFout.value;
      const o = add(p, w, f.rfH + CFin), outNPS = v.dims.outlet.value, fo = designFlange(outNPS, 'P150');
      comps.push({ tag, kind: 'valve', key: `VLV|PSV|${it.NPS}|${it.cls}`, T: frameFromAxes(o, w, it.out), a: p, b: o, NPS: it.NPS, cls: it.cls });
      extra = { psvOutletFace: add(o, it.out, CFout + fo.rfH), psvOutDir: it.out, psvOutNPS: outNPS };
      p = o; lastWeld = false;
    } else if (it.k === 'wnf' || it.k === 'wnfR' || it.k === 'blind' || it.k === 'blindR') {
      const { Lf, rf } = flangeLen(it.NPS, it.cls), blind = it.k.startsWith('blind');
      const body = blind ? partFromKey(`BLIND|${it.NPS}|${it.cls}`).dims.tb.value : Lf;
      const faceBack = it.k === 'wnf' || it.k === 'blind';           // face toward −w (the joint behind), weld end / back toward +w
      // local frame: face at local z = −rf, body toward +z; choose local z = +w (face back) or −w (face forward)
      const zDir = faceBack ? w : neg(w), origin = faceBack ? add(p, w, rf) : add(p, w, body);
      comps.push({ tag, kind: blind ? 'blind' : 'flange', key: `${blind ? 'BLIND' : 'WNF'}|${it.NPS}|${it.cls}`, T: frameFromAxes(origin, yUp, zDir), a: p, b: add(p, w, rf + body), NPS: it.NPS, cls: it.cls });
      if (!faceBack && lastWeld) welds.push({ at: p, w, NPS: it.NPS, cls: it.cls, joins: [last, tag] });
      p = add(p, w, rf + body); lastWeld = faceBack && !blind;
    } else if (it.k === 'reducer') {
      const a = pipeDims(it.from, it.cls), b = pipeDims(it.to, it.cls), big = Math.max(a.OD, b.OD), sm = Math.min(a.OD, b.OD), Hh = reducerLength(big, sm);
      const growing = it.to > it.from, zDir = growing ? neg(w) : w, origin = growing ? add(p, w, Hh) : p;
      comps.push({ tag, kind: 'reducer', key: `RED|${Math.max(it.from, it.to)}|${Math.min(it.from, it.to)}|${it.cls}`, T: frameFromAxes(origin, yUp, zDir), a: p, b: add(p, w, Hh), NPS: it.to, cls: it.cls });
      if (lastWeld) welds.push({ at: p, w, NPS: it.from, cls: it.cls, joins: [last, tag] });
      p = add(p, w, Hh); lastWeld = true;
    } else if (it.k === 'pipe') {
      comps.push({ tag, kind: 'pipe', key: `PIPE|${it.NPS}|${it.cls}|${it.L.toFixed(3)}`, T: frameFromAxes(p, yUp, w), a: p, b: add(p, w, it.L), NPS: it.NPS, cls: it.cls });
      if (lastWeld) welds.push({ at: p, w, NPS: it.NPS, cls: it.cls, joins: [last, tag] });
      p = add(p, w, it.L); lastWeld = true;
    }
    if (pendingJoint && it.k !== 'gasket' && comps.length >= 2 && comps[comps.length - 2].kind === 'gasket') {
      const j = pendingJoint, f = designFlange(j.NPS, j.cls);
      comps.push({ tag: `${line}/${comps.length + 1}`, kind: 'studs', key: `STUDS|${j.NPS}|${j.cls}|${j.stack.toFixed(3)}`, T: frameFromAxes(j.at, yUp, w), a: add(j.at, w, -f.studLen / 2), b: add(j.at, w, f.studLen / 2), NPS: j.NPS, cls: j.cls });
      pendingJoint = null;
    }
    last = tag; k++;
  }
  return { comps, welds, end: p, endIsWeld: lastWeld, extra };
}
const stackLength = (items: Item[]) => buildStack('x', [0, 0, 0], [0, 0, 1], items, 'x').end[2];

/** the item stack at a nozzle end (SW-LL-3); items listed from the nozzle face outward */
function nozzleStack(l: LineDef, nz: Nozzle, isDest: boolean): Item[] {
  const NPS = l.NPS, cls = l.cls, iso = isoValve(NPS, cls);
  if (nz.service === 'suction') {
    const it: Item[] = [{ k: 'gasket', NPS: nz.NPS, cls }, { k: 'wnf', NPS: nz.NPS, cls }];
    if (NPS !== nz.NPS) it.push({ k: 'reducer', from: nz.NPS, to: NPS, cls }, { k: 'wnfR', NPS, cls });
    else it.push({ k: 'pipe', NPS, cls, L: 6 }, { k: 'wnfR', NPS, cls });
    return [...it, { k: 'gasket', NPS, cls }, { k: 'valve', type: 'GATE', NPS, cls }, { k: 'gasket', NPS, cls }, { k: 'wnf', NPS, cls }];
  }
  if (nz.service === 'discharge') {
    const it: Item[] = [{ k: 'gasket', NPS: nz.NPS, cls }, { k: 'valve', type: 'CHECK', NPS: nz.NPS, cls }, { k: 'gasket', NPS: nz.NPS, cls }, { k: 'valve', type: 'GATE', NPS: nz.NPS, cls }, { k: 'gasket', NPS: nz.NPS, cls }, { k: 'wnf', NPS: nz.NPS, cls }];
    if (NPS !== nz.NPS) it.push({ k: 'reducer', from: nz.NPS, to: NPS, cls });
    return it;
  }
  if (nz.service === 'seal flush') return [{ k: 'gasket', NPS, cls }, { k: 'wnf', NPS, cls }];     // SW-LL-3: isolated at the header take-off only
  const base: Item[] = [{ k: 'gasket', NPS, cls }, { k: 'valve', type: iso, NPS, cls }, { k: 'gasket', NPS, cls }, { k: 'wnf', NPS, cls }];
  if (l.cv && isDest) return [...base, { k: 'pipe', NPS, cls, L: 18 }, { k: 'wnfR', NPS, cls }, { k: 'gasket', NPS, cls }, { k: 'valve', type: 'GATE', NPS, cls }, { k: 'gasket', NPS, cls },
    { k: 'valve', type: 'CONTROL', NPS, cls }, { k: 'gasket', NPS, cls }, { k: 'valve', type: 'GATE', NPS, cls }, { k: 'gasket', NPS, cls }, { k: 'wnf', NPS, cls }];
  return base;
}
const stubItems = (NPS: number, cls: PipeClass): Item[] => [{ k: 'gasket', NPS, cls }, { k: 'valve', type: isoValve(NPS, cls), NPS, cls }, { k: 'gasket', NPS, cls }, { k: 'blind', NPS, cls }];
const takeOffItems = (NPS: number, cls: PipeClass): Item[] => [{ k: 'wnfR', NPS, cls }, { k: 'gasket', NPS, cls }, { k: 'valve', type: isoValve(NPS, cls), NPS, cls }, { k: 'gasket', NPS, cls }, { k: 'wnf', NPS, cls }];


// ---- the static plant as obstacles (shared by the router and the checks) ------------------------------------
const xf = (T: Mat4, p: V3): V3 => [T[0] * p[0] + T[4] * p[1] + T[8] * p[2] + T[12], T[1] * p[0] + T[5] * p[1] + T[9] * p[2] + T[13], T[2] * p[0] + T[6] * p[1] + T[10] * p[2] + T[14]];
const boxXf = (b: [V3, V3], T: Mat4): [V3, V3] => { const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity];
  for (let c = 0; c < 8; c++) { const q = xf(T, [c & 1 ? b[1][0] : b[0][0], c & 2 ? b[1][1] : b[0][1], c & 4 ? b[1][2] : b[0][2]]); for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], q[a]); mx[a] = Math.max(mx[a], q[a]); } } return [mn, mx]; };
const sbCache = new WeakMap<PartSpec, [V3, V3][]>();
/** local bounding box of each drawn solid of a part */
export function solidBoxes(p: PartSpec): [V3, V3][] {
  let r = sbCache.get(p); if (r) return r; r = [];
  for (const so of buildGeometry(p).solids) { const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity], P = so.mesh.positions;
    for (let i = 0; i < P.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], P[i + a]); mx[a] = Math.max(mx[a], P[i + a]); }
    if (isFinite(mn[0])) r.push([mn, mx]); }
  sbCache.set(p, r); return r;
}
const unionBox = (bs: [V3, V3][]): [V3, V3] | null => { if (!bs.length) return null; const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity]; for (const b of bs) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], b[0][a]); mx[a] = Math.max(mx[a], b[1][a]); } return [mn, mx]; };
/** world bounding box of a placed part */
export const worldBox = (p: PartSpec, T: Mat4): [V3, V3] | null => { const b = unionBox(solidBoxes(p)); return b ? boxXf(b, T) : null; };
const MEMBERS = new Set(['W', 'C', 'L', 'HSS_RECT', 'HSS_ROUND', 'Z', 'CS', 'ROD', 'PIPE']);
export type Obstacle = { tag: string; kind: 'cap'; a: V3; b: V3; r: number } | { tag: string; kind: 'box'; mn: V3; mx: V3 };
/** members (lengths of section) as capsules on their axis; every other solid by its own box (so a nozzle between
 *  saddles stays clear); headroom zones above gratings and treads (SW-RT-3). Cladding, trim, anchor rods and the
 *  slab are left out (the floor is handled as a plane). */
export function staticObstacles(building: Placed[], interior: Placed[]): { obstacles: Obstacle[]; headroom: [V3, V3][] } {
  const obstacles: Obstacle[] = [], headroom: [V3, V3][] = [];
  for (const pl of [...building.filter(p => !p.tags.includes('cladding') && !p.tags.includes('trim')), ...interior]) {
    if (pl.tags.includes('anchor-rod') || pl.tags.includes('slab')) continue;
    const p = pl.part, tag = pl.tags.join('/');
    if (MEMBERS.has(p.kind) && p.length) {
      const b = unionBox(solidBoxes(p)); if (!b) continue;
      const cx = (b[0][0] + b[1][0]) / 2, cy = (b[0][1] + b[1][1]) / 2, r = Math.hypot(b[1][0] - b[0][0], b[1][1] - b[0][1]) / 2;
      obstacles.push({ tag, kind: 'cap', a: xf(pl.transform, [cx, cy, b[0][2]]), b: xf(pl.transform, [cx, cy, b[1][2]]), r });
    } else for (const b of solidBoxes(p)) { const wb = boxXf(b, pl.transform); obstacles.push({ tag, kind: 'box', mn: wb[0], mx: wb[1] }); }
    if (pl.tags.includes('grating') || pl.tags.includes('tread')) { const wb = worldBox(p, pl.transform); if (wb) headroom.push([[wb[0][0], wb[1][1], wb[0][2]], [wb[1][0], wb[1][1] + 84, wb[1][2]]]); }
  }
  return { obstacles, headroom };
}
/** the static plant (members as capsules, other solids as boxes) for the clearance checks */
export function staticPlant(): Obstacle[] { return staticObstacles(generateBuilding().instances, generateInterior().instances).obstacles; }

// ---- welds derived from a component chain (SW-PW-1/3) ----------------------------------------------------------
const WELDED = new Set(['pipe', 'elbow', 'tee', 'reducer', 'cap']);
const isButt = (x: Comp, y: Comp) => (WELDED.has(x.kind) && (WELDED.has(y.kind) || y.kind === 'flange')) || (WELDED.has(y.kind) && x.kind === 'flange');
interface ExtJoint { at: V3; tag: string; NPS: number; cls: PipeClass; w: V3 }
function weldRec(line: string, i: number, at: V3, w: V3, NPS: number, cls: PipeClass, joins: [string, string], field: boolean): WeldRec {
  return { id: `${line}/W${i}`, line, type: 'BW', size: pipeDims(NPS, cls).t, at, dir: w, joins, field, NPS, key: `BW|${NPS}|${cls}`, T: frameFromAxes(at, perp(w), w) };
}
/** one butt weld at every joint of the chain where pipe, a fitting or a weld-neck hub meets another; `ext` adds joints
 *  to components outside the chain (a parent's tee outlet); welds at `fieldAt` points are field welds */
export function deriveWelds(line: string, comps: Comp[], ext: ExtJoint[], fieldAt: V3[]): WeldRec[] {
  const c = comps.filter(x => x.kind !== 'studs'), out: WeldRec[] = [];
  const isField = (p: V3) => fieldAt.some(q => len(sub(p, q)) < 1e-3);
  for (const e of ext) { const first = c.reduce((best, x) => Math.min(len(sub(x.a, e.at)), len(sub(x.b, e.at))) < Math.min(len(sub(best.a, e.at)), len(sub(best.b, e.at))) ? x : best, c[0]);
    out.push(weldRec(line, out.length + 1, e.at, e.w, e.NPS, e.cls, [e.tag, first.tag], true)); }
  for (let i = 1; i < c.length; i++) {
    const x = c[i - 1], y = c[i]; if (!isButt(x, y)) continue;
    const ds = [[x.a, y.a], [x.a, y.b], [x.b, y.a], [x.b, y.b]].map(([p, q]) => ({ p, d: len(sub(p, q)) })).sort((u, v) => u.d - v.d), at = ds[0].p;
    const NPS = y.kind === 'reducer' ? x.NPS : x.kind === 'reducer' ? y.NPS : x.NPS, w = unit(sub(y.b, y.a));
    out.push(weldRec(line, out.length + 1, at, len(w) ? w : [0, 0, 1], NPS, x.cls, [x.tag, y.tag], isField(at)));
  }
  return out;
}

// ---- the generator -----------------------------------------------------------------------------------------
interface EndPlan { P1: V3; dirOut: V3; built?: Built; startFace?: V3; zone: V3; tap?: { parent: string; at: V3; out: V3; NPS: number } }

export function generatePiping(opts: { only?: (l: LineDef) => boolean } = {}): PipingModel {
  const building = generateBuilding(), interior = generateInterior(), nozzles = buildNozzles(), list = buildLineList().filter(opts.only ?? (() => true));
  const failures: string[] = [], rk = DEMO_LAYOUT.rack, T0 = Date.now(), tm: Record<string, number> = {};
  const g = new Grid(0, 0, -480, building.drawing.bays * building.drawing.bayFt * 12, 396, 480);
  // ---- static obstacles: every member as a capsule along its axis, every other solid as its box; headroom zones ----
  const st = staticObstacles(building.instances, interior.instances);
  // member axes are off the grid: cells within r + H√3/2 are marked so every point of the member has a marked centre
  // near it; each cell's reach (r − its distance from the axis) keeps the clearance test measured from the true surface
  for (const o of st.obstacles) if (o.kind === 'cap') g.markCapsule(o.a, o.b, o.r, STATIC, H * Math.sqrt(3) / 2); else g.markBox(o.mn, o.mx, STATIC);
  for (const h of st.headroom) g.markBox(h[0], h[1], 0, 'head');
  // SW-RT-7: the 2 ft above each rack tier is kept for lines running along the rack (handled like headroom)
  for (const t of rk.tiers) g.markBox([rk.x0 - 12, t, -rk.halfWidth], [rk.x1 + 12, t + 24, rk.halfWidth], 0, 'head');
  g.markBox([-1e6, -1e6, -1e6], [1e6, 96 - 1e-6, 1e6], 0, 'head');          // SW-RT-3: floor walkway headroom
  g.markBox([-1e6, -1e6, -1e6], [1e6, 0, 1e6], STATIC);                     // floor
  g.computeDistance();
  tm.t_static = Date.now() - T0;

  const bentXs: number[] = []; for (let x = rk.x0; x <= rk.x1 + 1e-6; x += rk.bentSpacing) bentXs.push(x);
  const spanOf = (OD: number) => (OD >= 3.5 ? 240 : OD >= 2.375 ? 180 : 120);                 // SW-PS-7
  /** the tier a horizontal x-run rests on, if it is on the rack (pipe bottom 4–12 in above a tier top) */
  const rackTier = (a: V3, b: V3, r: number) => Math.abs(b[0] - a[0]) > 1e-6 && Math.abs(b[1] - a[1]) < 1e-6 && Math.abs(b[2] - a[2]) < 1e-6 && Math.abs(a[2]) < rk.halfWidth - 6 ? rk.tiers.find(t => a[1] - r - t >= 3.9 && a[1] - r - t <= 12.1) : undefined;
  /** support stations on a rack run: every bent, and mid-bay intermediate beams for lines needing spans under 20 ft (SW-PS-8, SW-RK-6) */
  const rackStations = (lo: number, hi: number, span: number) => { const xs: number[] = []; for (const xb of bentXs) { if (xb > lo + 6 && xb < hi - 6) xs.push(xb); const m = xb + rk.bentSpacing / 2; if (span < rk.bentSpacing && m < rk.x1 && m > lo + 6 && m < hi - 6) xs.push(m); } return xs.sort((p, q) => p - q); };
  const lineId = new Map<string, number>(); list.forEach((l, i) => lineId.set(l.no, i + 1));
  const byNo = new Map(list.map(l => [l.no, l]));
  type Seg = [V3, V3, number] | { box: [V3, V3] };
  /** release every cell a line holds (when a trial routing is abandoned); the distance field is rebuilt */
  const unoccupy = (id: number) => { for (let c = 0; c < g.N; c++) if (g.occ[c] === id) { g.occ[c] = 0; g.reach[c] = 0; g.boxy[c] = 0; } for (let i = lineBoxes.length - 1; i >= 0; i--) if (lineBoxes[i].id === id) lineBoxes.splice(i, 1); g.computeDistance(); };
  const lineBoxes: { id: number; box: [V3, V3] }[] = [];
  const occupy = (id: number, segs: Seg[]) => { const cells: number[] = []; for (const sg of segs) { if (!Array.isArray(sg)) lineBoxes.push({ id, box: sg.box }); cells.push(...(Array.isArray(sg) ? g.markCapsule(sg[0], sg[1], sg[2], id) : g.markBox(sg.box[0], sg.box[1], id))); } g.updateDistance(cells, id, 8); };
  /** reserved envelope of placed components: valves by the box of their drawn solids (stem, handwheel, actuator included),
   *  flanges and gaskets as discs of the flange OD, pipe and fittings as capsules of the pipe OD */
  const compSegs = (comps: Comp[]): Seg[] => comps.filter(c => c.kind !== 'studs').map(c => c.kind === 'valve' ? { box: worldBox(partFromKey(c.key), c.T)! }
    : [c.a, c.b, c.kind === 'pipe' || c.kind === 'reducer' ? pipeDims(c.NPS, c.cls).OD / 2 : designFlange(c.NPS, c.cls).OD / 2] as Seg);

  const runs = new Map<string, LineRun>();
  const paths = new Map<string, V3[]>();                                    // routed centreline vertices of each line (for taps)
  const teeTag = (parent: string, child: string) => `${parent}/T:${child}`;
  const taps = new Map<string, { at: V3; out: V3; NPS: number; child: string; flR: number }[]>();
  const R = (NPS: number, cls: PipeClass) => elbowRadius(pipeDims(NPS, cls).OD);
  const kOf = (NPS: number, cls: PipeClass) => Math.ceil((2 * R(NPS, cls) + 2) / H);

  /** a valve's envelope (SW-RT-3) is clear of steel, equipment and other lines' reserved space */
  // exact static test for valve envelopes: a spatial hash of the obstacles
  const SB = 48, sidx = new Map<string, number[]>();
  st.obstacles.forEach((o, i) => { const [mn, mx] = o.kind === 'box' ? [o.mn, o.mx] : [[Math.min(o.a[0], o.b[0]) - o.r, Math.min(o.a[1], o.b[1]) - o.r, Math.min(o.a[2], o.b[2]) - o.r], [Math.max(o.a[0], o.b[0]) + o.r, Math.max(o.a[1], o.b[1]) + o.r, Math.max(o.a[2], o.b[2]) + o.r]];
    for (let x = Math.floor(mn[0] / SB); x <= Math.floor(mx[0] / SB); x++) for (let y = Math.floor(mn[1] / SB); y <= Math.floor(mx[1] / SB); y++) for (let z = Math.floor(mn[2] / SB); z <= Math.floor(mx[2] / SB); z++) { const k = `${x},${y},${z}`; let b = sidx.get(k); if (!b) sidx.set(k, (b = [])); b.push(i); } });
  /** a valve's envelope (SW-RT-3) keeps 3 in from steel and equipment (exactly, except the equipment the stack is
   *  bolted to) and from other lines' reserved space (on the grid, with each cell's reach) */
  let blockedBy = '';
  const boxClear = (bx: [V3, V3], id: number, ownEquip?: string) => {
    const e = 3 + g.maxReach, c0 = g.cellOf([bx[0][0] - e, bx[0][1] - e, bx[0][2] - e]), c1 = g.cellOf([bx[1][0] + e, bx[1][1] + e, bx[1][2] + e]);
    for (let k = Math.max(0, c0[2]); k <= Math.min(g.nz - 1, c1[2]); k++) for (let j = Math.max(0, c0[1]); j <= Math.min(g.ny - 1, c1[1]); j++) for (let i = Math.max(0, c0[0]); i <= Math.min(g.nx - 1, c1[0]); i++) {
      const c = g.idx(i, j, k), o = g.occ[c]; if (o === 0 || o === id || o === STATIC || g.boxy[c]) continue;
      const p = g.pos(i, j, k); let d2 = 0; for (let a = 0; a < 3; a++) { const d = Math.max(bx[0][a] - p[a], p[a] - bx[1][a], 0); d2 += d * d; }
      if (Math.sqrt(d2) - g.reach[c] < 3) { blockedBy = `line ${list[o - 1]?.no}`; return false; }
    }
    for (const lb of lineBoxes) if (lb.id !== id && boxGap(bx, lb.box) < 3) { blockedBy = `line ${list[lb.id - 1]?.no}`; return false; }
    if (bx[0][1] < 3) { blockedBy = 'floor'; return false; }                                           // the floor
    const seen = new Set<number>();
    for (let x = Math.floor((bx[0][0] - 3) / SB); x <= Math.floor((bx[1][0] + 3) / SB); x++) for (let y = Math.floor((bx[0][1] - 3) / SB); y <= Math.floor((bx[1][1] + 3) / SB); y++) for (let z = Math.floor((bx[0][2] - 3) / SB); z <= Math.floor((bx[1][2] + 3) / SB); z++)
      for (const i of sidx.get(`${x},${y},${z}`) ?? []) {
        if (seen.has(i)) continue; seen.add(i); const o = st.obstacles[i];
        if (ownEquip && o.tag.startsWith(ownEquip + '/')) continue;
        if (o.kind === 'box' ? boxGap(bx, [o.mn, o.mx]) < 3 : segBox(o.a, o.b, bx[0], bx[1]) - o.r < 3) { blockedBy = o.tag; return false; }
      }
    return true;
  };
  /** SW-LL-5: build a stack, turning any valve whose stem, handwheel or actuator would strike something to the next stem
   *  direction across the flow (up first, then sideways; never stem-down, which traps dirt in the bonnet) */
  const orient = (items0: Item[], build: (it: Item[]) => Built, id: number, w: V3, ownEquip?: string): { b: Built; ok: boolean } => {
    const items = items0.map(x => ({ ...x }));
    const cands: V3[] = Math.abs(w[1]) < 0.9 ? [[0, 1, 0], ...DIRS.filter(d => d[1] === 0 && Math.abs(dot(d, w)) < 0.5)] : DIRS.filter(d => d[1] === 0);
    let b = build(items), ok = true;
    items.forEach((it, i) => {
      if (it.k !== 'valve') return;
      const comp = () => b.comps.filter(c => c.kind === 'valve')[items.slice(0, i).filter(x => x.k === 'valve').length];
      if (boxClear(worldBox(partFromKey(comp().key), comp().T)!, id, ownEquip)) return;
      // a control valve keeps its actuator up and a swing check its cover up in a horizontal run (SW-LL-5)
      if (Math.abs(w[1]) < 0.9 && (it.type === 'CONTROL' || it.type === 'CHECK')) { ok = false; return; }
      for (const sd of cands) { it.stem = sd; b = build(items); if (boxClear(worldBox(partFromKey(comp().key), comp().T)!, id, ownEquip)) return; }
      delete it.stem; b = build(items); ok = false;
    });
    return { b, ok };
  };
  /** plan a nozzle end: build its stack from the face, P1 one elbow length beyond on the grid */
  const planNozzle = (l: LineDef, nz: Nozzle, isDest: boolean): EndPlan => {
    const { b, ok } = orient(nozzleStack(l, nz, isDest), it => buildStack(l.no, nz.face, nz.u, it, `${nz.id}`), lineId.get(l.no)!, nz.u, nz.equip);
    if (!ok) failures.push(`${l.no}: a valve at ${nz.id} strikes ${blockedBy} in every stem direction`);
    const ax = nz.u.findIndex(v => v !== 0), sgn = nz.u[ax];
    const P1 = leadP1(b.end, nz.u, R(l.NPS, l.cls));
    return { P1, dirOut: nz.u, built: b, startFace: nz.face, zone: nz.face };
  };
  /** choose a tap on a parent's routed path nearest a point, with the outlet pointing toward it; the whole take-off
   *  column (tee outlet, take-off stack, and one elbow length beyond) must be clear of other lines and steel */
  const chooseTap = (parentNo: string, toward: V3, child: LineDef, items: Item[], prefUp: boolean): { at: V3; out: V3; b: Built } | null => {
    const path = paths.get(parentNo), parent = byNo.get(parentNo)!; if (!path) return null;
    const pOD = pipeDims(parent.NPS, parent.cls).OD, C = teeC(pOD), Rp = R(parent.NPS, parent.cls), used = taps.get(parentNo) ?? [];
    const cr = pipeDims(child.NPS, child.cls).OD / 2, fl = designFlange(child.NPS, child.cls).OD / 2, reach = C + stackLength(items) + R(child.NPS, child.cls) + H;
    const pid = lineId.get(parentNo)!, cid = lineId.get(child.no)!, rr = Math.max(cr, items.length ? fl : cr);
    const columnFree = (at: V3, out: V3) => {
      for (let s = snapUp(pOD / 2 + 3); s <= reach + 1e-6; s += H) {
        const cc = g.cellOf(add(at, out, s)); if (!g.inside(cc[0], cc[1], cc[2])) return false;
        if (!g.clear(cc[0], cc[1], cc[2], rr, [pid, cid])) return false;
      }
      return true;
    };
    let best: { at: V3; out: V3; d: number; b: Built } | null = null;
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1], L = len(sub(b, a)), w = unit(sub(b, a));
      // at a header end the cap follows (C + 6); at a line end the pipe runs straight on into the end stack for R; at a corner an elbow takes R
      const pe = ends.get(parentNo), straightOn = (e: EndPlan | undefined, d: V3) => !!e && Math.abs(dot(e.dirOut, d) - 1) < 1e-9;
      const mA = parent.kind === 'header' ? 6 : straightOn(pe?.A, w) ? 3 - Rp : Rp + 3, mB = parent.kind === 'header' ? 6 : straightOn(pe?.B, neg(w)) ? 3 - Rp : Rp + 3;
      const s0 = Math.max(0, C + (i === 0 ? mA : Rp + 3)), s1 = Math.min(L, L - C - (i === path.length - 2 ? mB : Rp + 3));
      for (let s = snapUp(s0); s <= s1 + 1e-6; s += H) {
        const at = add(a, w, s);
        if (used.some(u => len(sub(u.at, at)) < Math.max(2 * C + 2, C + Math.max(u.flR, fl) + 3))) continue;   // tees ≥ 2 in apart, branch flanges clear
        if (rackTier(a, b, pOD / 2) !== undefined && rackStations(-1e9, 1e9, spanOf(pOD)).some(x => Math.abs(x - at[0]) < C + 8)) continue;   // keep tees off the beams that carry the shoes
        const outs: V3[] = prefUp && Math.abs(w[1]) < 0.5 ? [[0, 1, 0]] : DIRS.filter(d => Math.abs(dot(d, w)) < 0.5);
        for (const out of outs) {
          const d = len(sub(toward, add(at, out, C))) - (prefUp ? 0 : 6 * dot(out, unit(sub(toward, at))));
          if (best && d >= best.d) continue;
          if (!columnFree(at, out)) continue;
          // the take-off stack, valves oriented, must be clear in full (SW-RT-3)
          const outEnd = add(at, out, C), o = orient(items, it => buildStack(child.no, outEnd, out, it, `${parentNo}/tee`), cid, out);
          if (!o.ok) continue;
          best = { at, out, d, b: o.b };
        }
      }
    }
    return best ? { at: best.at, out: best.out, b: best.b } : null;
  };
  const planTap = (l: LineDef, e: Extract<EndRef, { k: 'tap' }>, toward: V3): EndPlan | null => {
    const parent = byNo.get(e.line)!, isHeader = parent.kind === 'header';
    const items = e.valve ? takeOffItems(l.NPS, l.cls) : [];
    const t = chooseTap(e.line, toward, l, items, isHeader); if (!t) return null;
    const pC = teeC(pipeDims(parent.NPS, parent.cls).OD), outEnd = add(t.at, t.out, pC);
    const b = t.b;
    const P1 = leadP1(b.end, t.out, R(l.NPS, l.cls));
    const list0 = taps.get(e.line) ?? []; list0.push({ at: t.at, out: t.out, NPS: l.NPS, child: l.no, flR: designFlange(l.NPS, l.cls).OD / 2 }); taps.set(e.line, list0);
    return { P1, dirOut: t.out, built: b, startFace: outEnd, zone: t.at, tap: { parent: e.line, at: t.at, out: t.out, NPS: l.NPS } };
  };

  // ---- 1. headers on the upper tier, process rack runs on the lower tier (SW-RT-1/2) ----
  const tierY = (tier: number, NPS: number, cls: PipeClass) => snapUp(tier + 4 + pipeDims(NPS, cls).OD / 2);
  const lanes: { tier: number; z: number; OD: number; x0: number; x1: number }[] = [];
  const zMax = rk.halfWidth - 18;
  /** SW-RT-2: the width a line needs in its lane — its OD, or the OD of the largest flange on a valved take-off from it */
  const laneD = (l: LineDef) => Math.max(pipeDims(l.NPS, l.cls).OD, ...list.filter(c => [c.from, c.to].some(e => e.k === 'tap' && e.line === l.no && e.valve)).map(c => designFlange(c.NPS, c.cls).OD));
  const laneCands = () => { const c: number[] = []; for (let z = -snapUp(zMax) + H; z <= snapUp(zMax) - H; z += H) c.push(z); return c.sort((a, b) => Math.abs(a) - Math.abs(b) || a - b); };
  const laneFree = (tier: number, z: number, OD: number, x0: number, x1: number) => lanes.every(L => L.tier !== tier || L.x1 < x0 - 24 || L.x0 > x1 + 24 || Math.abs(L.z - z) >= (L.OD + OD) / 2 + 3);
  const assignLane = (tier: number, OD: number, x0: number, x1: number) => {
    const cands: number[] = []; for (let z = -snapUp(zMax) + H; z <= snapUp(zMax) - H; z += H) cands.push(z);
    cands.sort((a, b) => Math.abs(a) - Math.abs(b));
    for (const z of cands) if (lanes.every(L => L.tier !== tier || L.x1 < x0 - 24 || L.x0 > x1 + 24 || Math.abs(L.z - z) >= (L.OD + OD) / 2 + 3)) { lanes.push({ tier, z, OD, x0, x1 }); return z; }
    return null;
  };
  const hx0 = rk.x0 + 12, hx1 = rk.x1 - 12;
  for (const l of list.filter(l => l.kind === 'header')) {
    const OD = pipeDims(l.NPS, l.cls).OD, z = assignLane(rk.tiers[1], laneD(l), hx0, hx1), y = tierY(rk.tiers[1], l.NPS, l.cls);
    if (z === null) { failures.push(`${l.no}: no lane`); continue; }
    const path: V3[] = [[hx0, y, z], [hx1, y, z]]; paths.set(l.no, path);
    occupy(lineId.get(l.no)!, [[path[0], path[1], OD / 2]]);
    runs.set(l.no, { no: l.no, service: l.service, NPS: l.NPS, cls: l.cls, kind: l.kind, from: 'cap', to: 'cap', comps: [], welds: [], supports: [], path, ok: true });
  }

  // ---- 2. plan nozzle ends of all routed lines and reserve their stacks ----
  const ends = new Map<string, { A?: EndPlan; B?: EndPlan }>();
  for (const l of list.filter(l => l.kind === 'routed')) {
    const e: { A?: EndPlan; B?: EndPlan } = {};
    if (l.from.k === 'nozzle') e.A = planNozzle(l, nozzles.get(l.from.id)!, false);
    if (l.to.k === 'nozzle') e.B = planNozzle(l, nozzles.get(l.to.id)!, true);
    if (l.to.k === 'station') {                                           // SW-LL-3 hose station: valve at 42 in, blind flange below it
      const at = l.to.at, b = orient([{ k: 'blindR', NPS: l.NPS, cls: l.cls }, { k: 'gasket', NPS: l.NPS, cls: l.cls }, { k: 'valve', type: isoValve(l.NPS, l.cls), NPS: l.NPS, cls: l.cls }, { k: 'gasket', NPS: l.NPS, cls: l.cls }, { k: 'wnf', NPS: l.NPS, cls: l.cls }], it => buildStack(l.no, at, [0, 1, 0], it, 'station'), lineId.get(l.no)!, [0, 1, 0]).b;
      const P1 = leadP1(b.end, [0, 1, 0], R(l.NPS, l.cls));
      e.B = { P1, dirOut: [0, 1, 0], built: b, startFace: at, zone: at };
    }
    ends.set(l.no, e);
    for (const p of [e.A, e.B]) if (p?.built) occupy(lineId.get(l.no)!, [...compSegs(p.built.comps), [p.built.end, p.P1, pipeDims(l.NPS, l.cls).OD / 2]]);
  }
  // relief valves (stubs carrying a PSV) — their outlets start the flare lines
  const psvOut = new Map<string, { face: V3; dir: V3; NPS: number }>();
  for (const l of list.filter(l => l.service === 'RV')) {
    const nz = nozzles.get((l.from as { id: string }).id)!, out: V3 = nz.equip === 'D-101' ? [0, 0, -1] : [0, 0, 1];
    const b = buildStack(l.no, nz.face, nz.u, [{ k: 'gasket', NPS: l.NPS, cls: l.cls }, { k: 'psv', NPS: l.NPS, cls: l.cls, out }], nz.id);
    psvOut.set(nz.id, { face: b.extra!.psvOutletFace!, dir: out, NPS: b.extra!.psvOutNPS! });
    runs.set(l.no, { no: l.no, service: l.service, NPS: l.NPS, cls: l.cls, kind: 'stub', from: nz.id, to: 'PSV', comps: b.comps, welds: [], supports: [], path: [nz.face, b.end], ok: true });
    occupy(lineId.get(l.no)!, [...compSegs(b.comps), [b.end, add(b.end, nz.u, 40), 10]]);
  }
  for (const l of list.filter(l => l.kind === 'routed' && l.from.k === 'psv')) {
    const po = psvOut.get((l.from as { nozzle: string }).nozzle)!;
    const b = buildStack(l.no, po.face, po.dir, [{ k: 'gasket', NPS: po.NPS, cls: 'P150' }, { k: 'wnf', NPS: po.NPS, cls: 'P150' }], 'PSV');
    const P1 = leadP1(b.end, po.dir, R(l.NPS, l.cls));
    ends.get(l.no)!.A = { P1, dirOut: po.dir, built: b, startFace: po.face, zone: po.face };
    occupy(lineId.get(l.no)!, compSegs(b.comps));
  }

  // ---- 3. route ----
  let lastWhy = '', exp = 0;
  const perLine: [string, number, number][] = [];
  const doRoute = (l: LineDef, id: number, from: EndPlan, goal: V3, goalDirs: number[] | undefined, runDir: number | undefined, zones: V3[]) => {
    const r = pipeDims(l.NPS, l.cls).OD / 2, k = kOf(l.NPS, l.cls);
    let why = '';
    for (const margin of [180, 420, 900]) {
      const res = route(g, { id, r, start: from.P1, startDir: dirIndex(from.dirOut), goal, goalDirs, runDir, k, zones, margin });
      exp += res.expanded;
      if (res.ok) return res;
      why = res.why ?? ''; if (!why.startsWith('exhausted')) break;
    }
    lastWhy = `${why} at P1=${from.P1.map(v => v.toFixed(0))} goal=${goal.map(v => v.toFixed(0))}`; return null;
  };
  const routeLine = (l: LineDef) => {
    const id = lineId.get(l.no)!, e = ends.get(l.no)!, r = pipeDims(l.NPS, l.cls).OD / 2;
    // resolve tap / station ends now that parents are routed
    if (!e.A && l.from.k === 'tap') { const toward = e.B?.P1 ?? [0, 0, 0]; const t = planTap(l, l.from, toward); if (!t) return fail(l, 'no tap position on ' + l.from.line); e.A = t; occupy(id, compSegs(t.built!.comps)); }
    if (!e.B && l.to.k === 'tap') { const toward = e.A?.P1 ?? [0, 0, 0]; const t = planTap(l, l.to, toward); if (!t) return fail(l, 'no tap position on ' + l.to.line); e.B = t; occupy(id, compSegs(t.built!.comps)); }
    if (!e.A || !e.B) return fail(l, 'unresolved end');
    const A = e.A, B = e.B;
    for (const P of [A.P1, B.P1]) if (!g.onGrid(P)) return fail(l, `end point ${P.map(v => v.toFixed(2))} is off the 6 in grid`);
    const viaRack = l.service === 'P' && Math.abs(A.P1[0] - B.P1[0]) > 240 && !A.tap && !B.tap;
    let path: V3[], rackEnds: [V3, V3] | undefined;
    if (viaRack) {
      // the rack run: a lane on the lower tier; each end drops off the rack at the bent-line x nearest its equipment,
      // or the nearest free x within 3 ft of it (so two lines leaving at the same place do not cross)
      const clampX = (x: number) => Math.min(rk.x1 - 12, Math.max(rk.x0 + 12, x));
      const xa0 = clampX(snapUp(A.P1[0])), xb0 = clampX(snapUp(B.P1[0])), OD = laneD(l), sgn = Math.sign(xb0 - xa0) || 1;
      const y = tierY(rk.tiers[0], l.NPS, l.cls), offs = [0, -6, 6, -12, 12, -18, 18, -24, 24, -30, 30, -36, 36];
      const runDir = dirIndex([sgn, 0, 0]);
      let ra: ReturnType<typeof doRoute> = null, rb: ReturnType<typeof doRoute> = null, EA: V3 = [xa0, y, 0], EB: V3 = [xb0, y, 0], done = false;
      const laneClear = (z: number, x0: number, x1: number) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x += H) { const c = g.cellOf([x, y, z]); if (!g.clear(c[0], c[1], c[2], r, [id])) return false; } return true; };
      for (const z of laneCands()) {
        if (!laneFree(rk.tiers[0], z, OD, Math.min(xa0, xb0) - 36, Math.max(xa0, xb0) + 36) || !laneClear(z, xa0 + 36 * sgn, xb0 - 36 * sgn)) continue;
        ra = rb = null;
        for (const d of offs) { EA = [clampX(xa0 + d), y, z]; if (!laneClear(z, EA[0], xa0 + 36 * sgn)) continue; ra = doRoute(l, id, A, EA, undefined, runDir, [A.zone, A.P1, EA]); if (ra) break; }
        if (!ra) continue;
        const cellsA = segsOf(ra.cells, r);
        occupy(id, cellsA);
        for (const d of offs) { EB = [clampX(xb0 + d), y, z]; if (sgn * (EB[0] - EA[0]) < 48 || !laneClear(z, EA[0], EB[0])) continue;
          rb = doRoute(l, id, B, EB, undefined, runDir ^ 1, [B.zone, B.P1, EB]); if (rb) break; }
        if (!rb) { unoccupy(id); occupy(id, compSegs([...(A.built?.comps ?? []), ...(B.built?.comps ?? [])])); for (const P of [A, B]) occupy(id, [[P.built!.end, P.P1, r]]); continue; }
        lanes.push({ tier: rk.tiers[0], z, OD, x0: Math.min(EA[0], EB[0]), x1: Math.max(EA[0], EB[0]) });
        occupy(id, [[EA, EB, r], ...segsOf(rb.cells, r)]); rackEnds = [EA, EB]; done = true; break;
      }
      if (!done) return fail(l, 'no rack lane with clear drops: ' + lastWhy);
      path = [...corners(ra!.cells), ...corners(rb!.cells).reverse()];
    } else {
      const goalDirs = B.tap || l.to.k === 'station' ? undefined : undefined;
      const res = doRoute(l, id, A, B.P1, goalDirs, dirIndex(neg(B.dirOut)), [A.zone, A.P1, B.zone, B.P1]); if (!res) return fail(l, 'route failed: ' + lastWhy);
      occupy(id, segsOf(res.cells, r));
      path = corners(res.cells);
    }
    path = simplify(path); paths.set(l.no, path);
    runs.set(l.no, { no: l.no, service: l.service, NPS: l.NPS, cls: l.cls, kind: l.kind, from: endName(l.from), to: endName(l.to), comps: [], welds: [], supports: [], path, ok: true, cv: l.cv });
    (runs.get(l.no) as LineRun & { _ends?: unknown })._ends = { A, B, rack: rackEnds };
    return true;
  };
  const fail = (l: LineDef, why: string) => { failures.push(`${l.no}: ${why}`); runs.set(l.no, { no: l.no, service: l.service, NPS: l.NPS, cls: l.cls, kind: l.kind, from: endName(l.from), to: endName(l.to), comps: [], welds: [], supports: [], path: [], ok: false, note: why }); return false; };
  const segsOf = (cells: V3[], r: number): Seg[] => { const c = corners(cells), out: Seg[] = []; for (let i = 0; i < c.length - 1; i++) out.push([c[i], c[i + 1], r]); return out; };
  const order = list.filter(l => l.kind === 'routed').sort((a, b) => {
    const rank = (l: LineDef) => (l.service === 'P' ? (l.from.k === 'tap' || l.to.k === 'tap' ? 1 : 0) : l.service === 'HS' ? 4 : l.service === 'FL' ? 3 : 2);
    return rank(a) - rank(b) || b.NPS - a.NPS;
  });
  for (const l of order) { const t = Date.now(); exp = 0; routeLine(l); perLine.push([l.no, Date.now() - t, exp]); }
  if (process.env.PIPE_DEBUG) { perLine.sort((a, b) => b[1] - a[1]); console.log(perLine.slice(0, 15)); }
  tm.t_route = Date.now() - T0 - tm.t_static;

  // ---- 4. stubs (valve + blind on nozzles, or on taps) ----
  for (const l of list.filter(l => l.kind === 'stub' && l.service !== 'RV')) {
    const id = lineId.get(l.no)!;
    if (l.from.k === 'nozzle') {
      const nz = nozzles.get(l.from.id)!, o = orient(stubItems(l.NPS, l.cls), it => buildStack(l.no, nz.face, nz.u, it, nz.id), id, nz.u, nz.equip), b = o.b;
      if (!o.ok) failures.push(`${l.no}: the valve at ${nz.id} strikes ${blockedBy} in every stem direction`);
      runs.set(l.no, { no: l.no, service: l.service, NPS: l.NPS, cls: l.cls, kind: 'stub', from: nz.id, to: 'blind', comps: b.comps, welds: [], supports: [], path: [nz.face, b.end], ok: true });
      occupy(id, compSegs(b.comps));
    } else if (l.from.k === 'tap') {
      const parent = byNo.get(l.from.line)!, pp = paths.get(l.from.line);
      const toward: V3 = pp ? add(pp[Math.floor(pp.length / 2)], [0, 100, 0]) : [0, 0, 0];
      const items: Item[] = [{ k: 'wnfR', NPS: l.NPS, cls: l.cls }, { k: 'gasket', NPS: l.NPS, cls: l.cls }, { k: 'valve', type: isoValve(l.NPS, l.cls), NPS: l.NPS, cls: l.cls }, { k: 'gasket', NPS: l.NPS, cls: l.cls }, { k: 'blind', NPS: l.NPS, cls: l.cls }];
      const t = chooseTap(l.from.line, toward, l, items, parent.kind === 'header');
      if (!t) { fail(l, 'no tap position on ' + l.from.line); continue; }
      const pC = teeC(pipeDims(parent.NPS, parent.cls).OD), outEnd = add(t.at, t.out, pC);
      const b = t.b;
      const lst = taps.get(l.from.line) ?? []; lst.push({ at: t.at, out: t.out, NPS: l.NPS, child: l.no, flR: designFlange(l.NPS, l.cls).OD / 2 }); taps.set(l.from.line, lst);
      runs.set(l.no, { no: l.no, service: l.service, NPS: l.NPS, cls: l.cls, kind: 'stub', from: `tap ${l.from.line}`, to: 'blind', comps: b.comps, welds: deriveWelds(l.no, b.comps, [{ at: outEnd, tag: teeTag(l.from.line, l.no), NPS: l.NPS, cls: l.cls, w: t.out }], [outEnd]), supports: [], path: [outEnd, b.end], ok: true });
      occupy(id, compSegs(b.comps));
    }
  }

  // ---- supports (SW-PS-7..12) ----
  const HANG_FROM = (tag: string) => !/equipment|pad|grout|ladder|guardrail|cage|rail|tread|stair|grating|cladding|door|slab|base-plate|anchor|weld|bolt|clip|column/.test(tag);
  /** lowest steel directly above p that a hanger rod can reach, with the rod path clear of other lines */
  const steelAboveExact = (p: V3, r: number, id: number): number | null => {
    let best = Infinity;
    for (let y = Math.floor((p[1] + r) / SB); y <= Math.floor(480 / SB); y++) for (const i of sidx.get(`${Math.floor(p[0] / SB)},${y},${Math.floor(p[2] / SB)}`) ?? []) {
      const o = st.obstacles[i]; if (!HANG_FROM(o.tag)) continue;
      let bottom: number;
      if (o.kind === 'box') { if (p[0] < o.mn[0] || p[0] > o.mx[0] || p[2] < o.mn[2] || p[2] > o.mx[2]) continue; bottom = o.mn[1]; }
      else {
        const ab = sub(o.b, o.a), L = len(ab); if (L < 1e-6 || Math.abs(ab[1]) / L > 0.5) continue;      // horizontal-ish members only
        const t = Math.max(0, Math.min(1, ((p[0] - o.a[0]) * ab[0] + (p[2] - o.a[2]) * ab[2]) / (ab[0] ** 2 + ab[2] ** 2 || 1))), q = add(o.a, ab, t);
        if (Math.hypot(q[0] - p[0], q[2] - p[2]) > o.r * 0.6) continue; bottom = q[1] - o.r * 0.7;
      }
      if (bottom > p[1] + r + 6 && bottom < best) best = bottom;
    }
    if (!isFinite(best) || best - p[1] > 240) return null;                                   // rods up to 20 ft (SW-PS-9)
    for (let y = p[1] + r + 3; y < best - 6; y += H / 2) { const c = g.cellOf([p[0], y, p[2]]); if (!g.inside(c[0], c[1], c[2])) return null; const o = g.occ[g.idx(c[0], c[1], c[2])]; if (o !== 0 && o !== id && o !== STATIC) return null; }
    return best;
  };
  /** clear path straight down to the floor for a stanchion */
  const floorClear = (p: V3, r: number, id: number) => { for (let y = p[1] - r - 3; y > 3; y -= H / 2) { const c = g.cellOf([p[0], y, p[2]]); if (!g.inside(c[0], c[1], c[2])) return false; const o = g.occ[g.idx(c[0], c[1], c[2])]; if (o !== 0 && o !== id) return false; } return true; };

  function placeSupports(run: LineRun, l: LineDef): SupportRec[] {
    const out: SupportRec[] = [], OD = pipeDims(l.NPS, l.cls).OD, r = OD / 2, span = spanOf(OD), id = lineId.get(run.no)!;
    const fittings = run.comps.filter(c => c.kind !== 'pipe' && c.kind !== 'studs');
    const clearOf = (p: V3, half: number) => fittings.every(f => segDist(p, f.a, f.b) > half + 2) && run.welds.every(w => len(sub(w.at, p)) > half + 2);
    // straight horizontal runs: pipe and inline tees merged
    const runs0: { a: V3; b: V3 }[] = [];
    for (const c of run.comps.filter(x => x.kind === 'pipe' || x.kind === 'tee')) { const last = runs0[runs0.length - 1], w = unit(sub(c.b, c.a)); if (last && len(sub(last.b, c.a)) < 0.1 && Math.abs(dot(unit(sub(last.b, last.a)), w) - 1) < 1e-6) last.b = c.b; else runs0.push({ a: c.a, b: c.b }); }
    let n = 0;
    const push = (type: SupportRec['type'], at: V3, key: string, T: Mat4) => out.push({ id: `${run.no}/S${++n}`, line: run.no, type, at, key, T });
    for (const sr of runs0) {
      const w = unit(sub(sr.b, sr.a)), L = len(sub(sr.b, sr.a));
      if (Math.abs(w[1]) > 0.5) continue;
      const tier = rackTier(sr.a, sr.b, r);
      if (tier !== undefined) {
        const lo = Math.min(sr.a[0], sr.b[0]), hi = Math.max(sr.a[0], sr.b[0]), xs = rackStations(lo, hi, span);
        const bx = xs.filter(x => bentXs.includes(x)), mid = (lo + hi) / 2, anchor = bx.length ? bx.reduce((u, v) => (Math.abs(v - mid) < Math.abs(u - mid) ? v : u)) : NaN, ia = bx.indexOf(anchor);
        const h = sr.a[1] - r - tier;
        for (const x of xs) {
          const ib = bx.indexOf(x);
          const type: SupportRec['type'] = x === anchor ? 'anchor' : ib >= 0 && (Math.abs(ib - ia) === 1 || ib === 0 || ib === bx.length - 1) ? 'guide' : 'shoe';
          push(type, [x, tier, sr.a[2]], `SHOE|${l.NPS}|${l.cls}|${type}|${h.toFixed(3)}`, frameFromAxes([x, sr.a[1] - r, sr.a[2]], [0, 1, 0], [1, 0, 0]));
        }
        continue;
      }
      if (L <= 48 && run.kind !== 'header') continue;                                       // short legs are carried by the fittings either side
      // where the run passes under a horizontal member (in plan), a hanger can hang straight from it
      const crossings: number[] = [];
      if (sr.a[1] - r > 120) {
        const seen = new Set<number>();
        for (let t = 0; t <= L; t += SB / 2) { const q = add(sr.a, w, t); for (let y = Math.floor(q[1] / SB); y <= Math.floor(480 / SB); y++) for (const i of sidx.get(`${Math.floor(q[0] / SB)},${y},${Math.floor(q[2] / SB)}`) ?? []) {
          if (seen.has(i)) continue; seen.add(i); const o = st.obstacles[i]; if (o.kind !== 'cap' || !HANG_FROM(o.tag)) continue;
          const ab = sub(o.b, o.a); if (Math.abs(ab[1]) > 0.5 * len(ab)) continue;
          // plan intersection of the run (sr.a + w s) with the member axis (o.a + ab u)
          const den = w[0] * ab[2] - w[2] * ab[0]; if (Math.abs(den) < 1e-9) continue;
          const dx = o.a[0] - sr.a[0], dz = o.a[2] - sr.a[2], sPos = (dx * ab[2] - dz * ab[0]) / den, u = (dx * w[2] - dz * w[0]) / den;
          if (u >= 0 && u <= 1 && sPos > 0 && sPos < L) crossings.push(sPos);
        } }
      }
      // supports stepped along the run: each at the equal division of what remains, moved in 6 in steps (never past one
      // span from the last) to clear fittings and welds and to find a floor path or steel above (SW-PS-7, SW-PS-9)
      let prev = 0;
      while (L - prev > span + 1e-6) {
        const k = Math.ceil((L - prev) / span), target = prev + (L - prev) / k, cands: number[] = crossings.filter(c => c > prev + 12 && c <= prev + span && c < L - 6);
        for (let d = 0; d <= span; d += 6) { if (target - d > prev + 12) cands.push(target - d); if (d && target + d <= prev + span && target + d < L - 6) cands.push(target + d); }
        cands.sort((u, v) => Math.abs(u - target) - Math.abs(v - target));
        let placed = -1;
        const dbg = process.env.PIPE_DEBUG_LINE === run.no;
        if (dbg) console.log(run.no, 'run', sr.a, sr.b, 'prev', prev, 'target', target, 'crossings', crossings);
        for (const sPos of cands) {
          const p = add(sr.a, w, sPos); if (!clearOf(p, 3)) { if (dbg) console.log('  ', sPos, 'not clear of fittings'); continue; }
          if (dbg) console.log('  ', sPos, 'floor', p[1] - r <= 120 && floorClear(p, r, id), 'steel', steelAboveExact(p, r, id));
          const bottom = p[1] - r;
          if (bottom <= 120 && floorClear(p, r, id)) { push('stanchion', p, `STAN|${l.NPS}|${l.cls}|${bottom.toFixed(2)}`, frameFromAxes([p[0], 0, p[2]], [0, 1, 0], [w[0], 0, w[2]])); placed = sPos; break; }
          const top = steelAboveExact(p, r, id);
          if (top !== null) { push('hanger', p, `HANG|${l.NPS}|${l.cls}|${(top - p[1]).toFixed(2)}`, frameFromAxes(p, [0, 1, 0], [w[0], 0, w[2]])); placed = sPos; break; }
        }
        if (placed < 0) for (const sPos of cands) {                                         // SW-PS-13 trapeze when a line above blocks a single rod
          const p = add(sr.a, w, sPos); if (!clearOf(p, 3)) continue;
          const side = cross(w, [0, 1, 0]), aoff = r + 6, t1 = steelAboveExact(add(p, side, -aoff), 0.5, id), t2 = steelAboveExact(add(p, side, aoff), 0.5, id);
          if (t1 === null || t2 === null) continue;
          push('trapeze', p, `TRAP|${l.NPS}|${l.cls}|${(t1 - p[1]).toFixed(2)}|${(t2 - p[1]).toFixed(2)}`, frameFromAxes(p, [0, 1, 0], w)); placed = sPos; break;
        }
        if (placed < 0) break;                                                              // reported by the span check
        prev = placed;
      }
    }
    // trunnions under the lowest elbow of vertical runs longer than 10 ft, when that elbow is at most 10 ft up (SW-PS-10)
    const els = run.comps.filter(c => c.kind === 'elbow');
    for (const sr of runs0) {
      const w = unit(sub(sr.b, sr.a)); if (Math.abs(w[1]) < 0.5 || len(sub(sr.b, sr.a)) < 120) continue;
      const lowEnd = sr.a[1] < sr.b[1] ? sr.a : sr.b, el = els.find(e => len(sub(e.a, lowEnd)) < 1e-3 || len(sub(e.b, lowEnd)) < 1e-3); if (!el) continue;
      const vtx = add(lowEnd, [0, -1, 0], R(l.NPS, l.cls)), top: V3 = [vtx[0], vtx[1] - r, vtx[2]];
      if (top[1] <= 120 && top[1] > 6 && floorClear(add(top, [0, r, 0]), r, id)) push('trunnion', top, `TRUN|${l.NPS}|${l.cls}|${top[1].toFixed(2)}`, frameFromAxes(top, [0, 1, 0], [1, 0, 0]));
    }
    return out;
  }

  // ---- 5. assemble routed lines and headers into an ordered chain of components; welds follow from the chain ----
  for (const run of runs.values()) {
    if (!run.ok || run.kind === 'stub') continue;
    const l = byNo.get(run.no)!, ends0 = (run as LineRun & { _ends?: { A: EndPlan; B: EndPlan; rack?: [V3, V3] } })._ends;
    const comps: Comp[] = [], Rr = R(l.NPS, l.cls), OD = pipeDims(l.NPS, l.cls).OD, cl = partFromKey(`CAP|${l.NPS}|${l.cls}`).extra!.len as number;
    const pts = simplify(run.kind === 'header' ? run.path : [ends0!.A.built!.end, ...run.path, ends0!.B.built!.end]);
    const myTaps = taps.get(run.no) ?? [];
    const pipeTo = (from: V3, to: V3) => {
      const rem = len(sub(to, from)); if (rem < 0.05) return;
      const w = unit(sub(to, from)), n = Math.ceil((rem + 48) / 480);    // SW-RT-5: ≤ 40 ft lengths, butt-weld splices between
      // splices on a rack run are moved (in 6 in steps) off the beams so every beam can carry a shoe
      const tier = rackTier(from, to, OD / 2), stations = tier !== undefined ? rackStations(Math.min(from[0], to[0]) - 1e3, Math.max(from[0], to[0]) + 1e3, spanOf(OD)) : [];
      const cuts: number[] = [0];
      for (let i = 1; i < n; i++) { let s = (rem * i) / n; for (const d of [0, 6, -6, 12, -12, 18, -18, 24, -24]) { const x = from[0] + w[0] * (s + d); if (stations.every(st => Math.abs(st - x) > 14)) { s += d; break; } } cuts.push(s); }
      cuts.push(rem);
      for (let i = 0; i < n; i++) { const a = add(from, w, cuts[i]), b = add(from, w, cuts[i + 1]);
        comps.push({ tag: `${run.no}/p${comps.length + 1}`, kind: 'pipe', key: `PIPE|${l.NPS}|${l.cls}|${(cuts[i + 1] - cuts[i]).toFixed(3)}`, T: frameFromAxes(a, perp(w), w), a, b, NPS: l.NPS, cls: l.cls }); }
    };
    const straight = (from: V3, to: V3) => {
      const w = unit(sub(to, from)), Ltot = len(sub(to, from)); if (Ltot < 1e-6) return;
      const here = myTaps.filter(t => { const s = dot(sub(t.at, from), w); return s > 0 && s < Ltot && len(sub(add(from, w, s), t.at)) < 1e-6; }).sort((a, b) => dot(sub(a.at, from), w) - dot(sub(b.at, from), w));
      let p = from;
      for (const t of here) {
        const C = teeC(OD), te = add(t.at, w, -C); pipeTo(p, te);
        comps.push({ tag: teeTag(run.no, t.child), kind: 'tee', key: `TEE|${l.NPS}|${l.cls}|${t.NPS}`, T: frameFromAxes(t.at, t.out, w), a: te, b: add(t.at, w, C), NPS: l.NPS, cls: l.cls });
        p = add(t.at, w, C);
      }
      pipeTo(p, to);
    };
    if (run.kind === 'header') { const w = unit(sub(pts[1], pts[0])); comps.push({ tag: `${run.no}/cap0`, kind: 'cap', key: `CAP|${l.NPS}|${l.cls}`, T: frameFromAxes(pts[0], perp(w), neg(w)), a: add(pts[0], w, -cl), b: pts[0], NPS: l.NPS, cls: l.cls }); }
    else comps.push(...ends0!.A.built!.comps);
    let cursor = pts[0];
    for (let i = 1; i < pts.length - 1; i++) {
      const a = unit(sub(pts[i], pts[i - 1])), b = unit(sub(pts[i + 1], pts[i])), ein = add(pts[i], a, -Rr), eout = add(pts[i], b, Rr);
      straight(cursor, ein);
      comps.push({ tag: `${run.no}/el${comps.length + 1}`, kind: 'elbow', key: `EL|${l.NPS}|${l.cls}|90`, T: frameFromAxes(ein, cross(a, b), a), a: ein, b: eout, NPS: l.NPS, cls: l.cls });
      cursor = eout;
    }
    straight(cursor, pts[pts.length - 1]);
    if (run.kind === 'header') { const w = unit(sub(pts[1], pts[0])), e = pts[pts.length - 1]; comps.push({ tag: `${run.no}/cap1`, kind: 'cap', key: `CAP|${l.NPS}|${l.cls}`, T: frameFromAxes(e, perp(w), w), a: e, b: add(e, w, cl), NPS: l.NPS, cls: l.cls }); }
    else comps.push(...ends0!.B.built!.comps.slice().reverse());
    run.comps = comps;
    // field welds (SW-PW-2): the closing weld at each end stack, the tee outlet at a tap, and where the line meets its rack run
    const fieldAt: V3[] = [];
    if (ends0) {
      for (const e of [ends0.A, ends0.B]) fieldAt.push(e.built!.end);
      if (ends0.rack) { const [EA, EB] = ends0.rack, w = unit(sub(EB, EA)); fieldAt.push(add(EA, w, Rr), add(EB, w, -Rr)); }
    }
    const ext: ExtJoint[] = [];
    for (const e of ends0 ? [ends0.A, ends0.B] : []) if (e.tap) ext.push({ at: e.startFace!, tag: teeTag(e.tap.parent, run.no), NPS: l.NPS, cls: l.cls, w: e.tap.out });
    run.welds = deriveWelds(run.no, comps, ext, fieldAt);
    run.supports = placeSupports(run, l);
  }
  // ---- equipment nozzles (SW-NOZ-1): weld-neck flange facing out, nozzle pipe from its hub back to the shell ----
  const nozzleRuns: NozzleRun[] = [];
  for (const nz of nozzles.values()) {
    const { Lf, rf } = flangeLen(nz.NPS, nz.cls), w = neg(nz.u), Lp = nz.S - rf - Lf;
    const items: Item[] = [{ k: 'wnf', NPS: nz.NPS, cls: nz.cls }, ...(Lp > 0.05 ? [{ k: 'pipe', NPS: nz.NPS, cls: nz.cls, L: Lp } as Item] : [])];
    const b = buildStack(nz.id, nz.face, w, items, nz.id);
    nozzleRuns.push({ id: nz.id, equip: nz.equip, service: nz.service, NPS: nz.NPS, cls: nz.cls, face: nz.face, u: nz.u, comps: b.comps, welds: deriveWelds(nz.id, b.comps, [], []) });
  }

  const lines = list.map(l => runs.get(l.no)!).filter(Boolean);
  const stats = { lines: lines.length, routed: lines.filter(r => r.kind !== 'stub' && r.ok).length, failed: failures.length, comps: lines.reduce((s, r) => s + r.comps.length, 0), welds: lines.reduce((s, r) => s + r.welds.length, 0), supports: lines.reduce((s, r) => s + r.supports.length, 0), ...tm, t_total: Date.now() - T0 };
  for (const run of runs.values()) delete (run as LineRun & { _ends?: unknown })._ends;
  return { lines, nozzles: nozzleRuns, failures, stats };
}

const endName = (e: EndRef) => e.k === 'nozzle' ? e.id : e.k === 'tap' ? `tap ${e.line}` : e.k === 'psv' ? `PSV on ${e.nozzle}` : e.k === 'station' ? 'hose station' : 'blind';
function simplify(p: V3[]): V3[] {
  const q = p.filter((v, i) => i === 0 || len(sub(v, p[i - 1])) > 1e-6);
  const out: V3[] = [q[0]];
  for (let i = 1; i < q.length - 1; i++) { const a = unit(sub(q[i], out[out.length - 1])), b = unit(sub(q[i + 1], q[i])); if (Math.abs(dot(a, b) - 1) > 1e-9) out.push(q[i]); }
  if (q.length > 1) out.push(q[q.length - 1]);
  return out;
}
function segDist(p: V3, a: V3, b: V3) { const ab = sub(b, a), t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / (dot(ab, ab) || 1))); return len(sub(p, add(a, ab, t))); }
export { transformMesh };
/** the committed plant piping data: the model with numbers rounded to 1/10000 in (deterministic, compact) */
export const serializePiping = (m: PipingModel) => JSON.stringify({ lines: m.lines, nozzles: m.nozzles, failures: m.failures, stats: Object.fromEntries(Object.entries(m.stats).filter(([k]) => !k.startsWith('t_'))) }, (_k, v) => (typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v));
