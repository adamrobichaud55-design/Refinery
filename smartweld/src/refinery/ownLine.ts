/**
 * Plant 3, SW-RPI-22: pieces of one line clear of each other. The generator keeps a line 3 in from every other line but never
 * measures a line against itself; here each line is measured against itself, with the flange and neck of each nozzle it ends at.
 * A piece is held by its true shape: a pipe, reducer or tee's run by its cylinder, a tee's outlet by its stub, a 90° elbow by
 * its arc, a 45° elbow by its own two legs (SW-RPI-13), a flange, gasket, blind or spade by the flange's diameter, a valve by
 * its part's solids; every shape with flat ends, and studs not measured. Not compared: two pieces joined to each other; two
 * with nothing between them but gaskets and a joint's blind; two on one axis whose lengths overlap by no more than 0.05 in.
 * A pair that shares more than 0.05 in is a finding.
 */
import { partFromKey, solidBoxes, deriveWelds, staticObstacles, type Comp, type LineRun, type NozzleRun, type PipingModel, type SupportRec, type WeldRec } from '../generator/piping';
import * as K from '../generator/pipingCheck';
import type { V3 } from '../generator/router';
import type { PlantDef } from '../generator/plant';
import { frameFromAxes } from '../geometry/transform';
import { pipeDims, elbowRadius, designFlange, teeC, smallBore } from '../catalogue';
import type { UnitPiping } from './unitPiping';

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a: V3, b: V3, k = 1): V3 => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const unit = (a: V3): V3 => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const xf = (T: number[], p: V3): V3 => [T[0] * p[0] + T[4] * p[1] + T[8] * p[2] + T[12], T[1] * p[0] + T[5] * p[1] + T[9] * p[2] + T[13], T[2] * p[0] + T[6] * p[1] + T[10] * p[2] + T[14]];
const is45 = (c: Comp) => /\|45(\||$)/.test(c.key);

/** SW-RPI-22: a true shape: a cylinder with flat ends, the tube of a 90° elbow's arc (centre O, from O + R·u to O + R·v), or a box */
export type OwnShape = { k: 'cyl'; a: V3; b: V3; r: number } | { k: 'arc'; O: V3; u: V3; v: V3; R: number; r: number } | { k: 'box'; mn: V3; mx: V3 };
/** how far a point lies inside a shape: its distance to the shape's surface, below 0 outside */
function depth(s: OwnShape, p: V3): number {
  if (s.k === 'box') return Math.min(p[0] - s.mn[0], s.mx[0] - p[0], p[1] - s.mn[1], s.mx[1] - p[1], p[2] - s.mn[2], s.mx[2] - p[2]);
  if (s.k === 'cyl') { const L = len(sub(s.b, s.a)), n = unit(sub(s.b, s.a)), t = dot(sub(p, s.a), n), rad = len(sub(sub(p, s.a), [n[0] * t, n[1] * t, n[2] * t])); return Math.min(t, L - t, s.r - rad); }
  const q = sub(p, s.O), x = dot(q, s.u), y = dot(q, s.v), z = dot(q, cross(s.u, s.v)), th = Math.atan2(y, x), rho = Math.hypot(x, y);
  if (th < -1e-9 || th > Math.PI / 2 + 1e-9) return -1;
  return Math.min(s.r - Math.hypot(rho - s.R, z), rho * Math.min(th, Math.PI / 2 - th));
}
function bbox(s: OwnShape): [V3, V3] {
  if (s.k === 'box') return [s.mn, s.mx];
  if (s.k === 'cyl') return [[0, 1, 2].map(i => Math.min(s.a[i], s.b[i]) - s.r) as V3, [0, 1, 2].map(i => Math.max(s.a[i], s.b[i]) + s.r) as V3];
  const ps: V3[] = []; for (let i = 0; i <= 18; i++) { const t = (i * Math.PI) / 36; ps.push(add(add(s.O, s.u, s.R * Math.cos(t)), s.v, s.R * Math.sin(t))); }
  return [[0, 1, 2].map(i => Math.min(...ps.map(p => p[i])) - s.r) as V3, [0, 1, 2].map(i => Math.max(...ps.map(p => p[i])) + s.r) as V3];
}
/** points through a shape's volume: a box on a 14-step lattice; a cylinder or arc tube by discs (every 1/2 in along a cylinder, at most 60 steps; every 2.5° along an arc), each disc in 6 rings of 16 points */
function samples(s: OwnShape, n = 14): V3[] {
  const out: V3[] = [];
  if (s.k === 'box') { for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) for (let k = 0; k <= n; k++) out.push([s.mn[0] + ((s.mx[0] - s.mn[0]) * i) / n, s.mn[1] + ((s.mx[1] - s.mn[1]) * j) / n, s.mn[2] + ((s.mx[2] - s.mn[2]) * k) / n]); return out; }
  const disc = (c: V3, e1: V3, e2: V3, r: number) => { for (let ri = 0; ri <= 6; ri++) for (let f = 0; f < (ri ? 16 : 1); f++) { const rr = (r * ri) / 6, ph = (2 * Math.PI * f) / 16; out.push(add(add(c, e1, rr * Math.cos(ph)), e2, rr * Math.sin(ph))); } };
  if (s.k === 'cyl') {
    const ax = unit(sub(s.b, s.a)), e1 = unit(Math.abs(ax[1]) < 0.9 ? cross(ax, [0, 1, 0]) : cross(ax, [1, 0, 0])), e2 = cross(ax, e1), L = len(sub(s.b, s.a)), nt = Math.max(2, Math.min(60, Math.ceil(L / 0.5)));
    for (let i = 0; i <= nt; i++) disc(add(s.a, ax, (L * i) / nt), e1, e2, s.r);
    return out;
  }
  const w = cross(s.u, s.v);
  for (let i = 0; i <= 36; i++) { const th = ((Math.PI / 2) * i) / 36, c = add(add(s.O, s.u, s.R * Math.cos(th)), s.v, s.R * Math.sin(th)); disc(c, unit(sub(c, s.O)), w, s.r); }
  return out;
}
const solidsCache = new Map<string, [V3, V3][]>();
/** a piece's body diameter: a reducer's the larger of its two ends' */
const bodyOD = (c: Comp): number => { const k = c.key.split('|'); if (k[0] === 'RED' || k[0] === 'REDE' || k[0] === 'SWG') return Math.max(pipeDims(Number(k[1]), c.cls).OD, pipeDims(Number(k[2]), c.cls).OD); return pipeDims(c.NPS, c.cls).OD; };
/** SW-RPI-22: the true shapes of a piece */
export function shapesOf(c: Comp): OwnShape[] {
  const T = c.T as unknown as number[];
  switch (c.kind) {
    case 'studs': return [];
    case 'valve': {
      let local = solidsCache.get(c.key); if (!local) solidsCache.set(c.key, (local = solidBoxes(partFromKey(c.key))));
      return local.map(b => { const cs: V3[] = []; for (const x of [b[0][0], b[1][0]]) for (const y of [b[0][1], b[1][1]]) for (const z of [b[0][2], b[1][2]]) cs.push(xf(T, [x, y, z])); return { k: 'box', mn: [0, 1, 2].map(i => Math.min(...cs.map(q => q[i]))) as V3, mx: [0, 1, 2].map(i => Math.max(...cs.map(q => q[i]))) as V3 } as OwnShape; });
    }
    case 'elbow': {
      const OD = pipeDims(c.NPS, c.cls).OD, R = elbowRadius(OD), z: V3 = [T[8], T[9], T[10]];
      // a 45° elbow by its own two legs, R tan 22.5° each (SW-RPI-13); a socket elbow by two legs to its corner
      if (is45(c)) { const leg = R * Math.tan(Math.PI / 8), corner = add(c.a, z, leg); return [{ k: 'cyl', a: c.a, b: corner, r: OD / 2 }, { k: 'cyl', a: corner, b: c.b, r: OD / 2 }]; }
      if (c.key.startsWith('SWEL')) { const corner = add(c.a, z, len(sub(c.b, c.a)) / Math.SQRT2); return [{ k: 'cyl', a: c.a, b: corner, r: OD / 2 }, { k: 'cyl', a: corner, b: c.b, r: OD / 2 }]; }
      const corner = add(c.a, z, R), O = add(c.a, sub(c.b, corner));
      return [{ k: 'arc', O, u: unit(sub(c.a, O)), v: unit(sub(c.b, O)), R, r: OD / 2 }];
    }
    case 'tee': {
      const OD = pipeDims(c.NPS, c.cls).OD, o: V3 = [T[12], T[13], T[14]], y: V3 = [T[4], T[5], T[6]], C = c.key.startsWith('TEE') ? teeC(OD) : OD / 2;
      return [{ k: 'cyl', a: c.a, b: c.b, r: OD / 2 }, { k: 'cyl', a: o, b: add(o, y, C), r: pipeDims(Number(c.key.split('|')[3]) || c.NPS, c.cls).OD / 2 }];
    }
    case 'flange': case 'blind': case 'gasket': case 'spade': case 'spectacle':
      return len(sub(c.b, c.a)) < 1e-6 ? [] : [{ k: 'cyl', a: c.a, b: c.b, r: designFlange(c.NPS, c.cls).OD / 2 }];
    default: return len(sub(c.b, c.a)) < 1e-6 ? [] : [{ k: 'cyl', a: c.a, b: c.b, r: bodyOD(c) / 2 }];
  }
}
const ov = (a: [V3, V3], b: [V3, V3]) => [0, 1, 2].every(i => a[0][i] < b[1][i] && b[0][i] < a[1][i]);
/** two shapes that cannot share a point, found from their axes: two cylinders whose axes stand their two radii apart, a cylinder whose axis stands its radius from a box */
const apart = (x: OwnShape, y: OwnShape): boolean => {
  if (x.k === 'cyl' && y.k === 'cyl') return K.segSeg(x.a, x.b, y.a, y.b) >= x.r + y.r;
  if (x.k === 'cyl' && y.k === 'box') return K.segBox(x.a, x.b, y.mn, y.mx) >= x.r;
  if (x.k === 'box' && y.k === 'cyl') return K.segBox(y.a, y.b, x.mn, x.mx) >= y.r;
  return false;
};
/** SW-RPI-22: the depth two shapes share, from points through each: twice the largest distance of a point inside both from the nearer of their surfaces; and where.
 *  Only points within both boxes can be inside both, so only those are measured */
function shared(X: OwnShape, Y: OwnShape, bx: [V3, V3], by: [V3, V3], pts: (s: OwnShape) => V3[]): { d: number; at: V3 } {
  const lo: V3 = [0, 1, 2].map(i => Math.max(bx[0][i], by[0][i])) as V3, hi: V3 = [0, 1, 2].map(i => Math.min(bx[1][i], by[1][i])) as V3;
  let best = 0, at: V3 = [0, 0, 0];
  for (const S of [X, Y]) for (const p of pts(S)) {
    if (p[0] < lo[0] || p[0] > hi[0] || p[1] < lo[1] || p[1] > hi[1] || p[2] < lo[2] || p[2] > hi[2]) continue;
    const d = Math.min(depth(X, p), depth(Y, p)); if (d > best) { best = d; at = p; }
  }
  return { d: 2 * best, at };
}
export interface OwnClash { /** `${tag} (${kind})` of each piece */ a: string; b: string; ca: Comp; cb: Comp; /** the depth the two share, in */ depth: number; at: V3 }
/** SW-RPI-22: the pairs of one line's own pieces, with the flange and neck of each nozzle it ends at, that share more than `tol` (0.05 in) */
export function ownClashes(r: LineRun, nozzles: Map<string, NozzleRun>, tol = 0.05): OwnClash[] {
  const chain = r.comps.filter(c => c.kind !== 'studs');
  const ends = [r.from, r.to].map(e => nozzles.get(e)?.comps.filter(c => c.kind !== 'studs') ?? []);
  // the nozzle's pieces go at the head (from) or the tail (to) of the chain, so that the nozzle's flange is joined to the line's gasket
  const all = [...[...ends[0]].reverse(), ...chain, ...ends[1]];
  const S = all.map(c => { const sh = shapesOf(c); return { c, sh, bb: sh.map(bbox) }; }), out: OwnClash[] = [];
  const kept = new Map<OwnShape, V3[]>(), pts = (s: OwnShape) => { let p = kept.get(s); if (!p) kept.set(s, (p = samples(s))); return p; };
  const THIN = new Set(['gasket', 'spade', 'spectacle']);
  const axisOf = (c: Comp): [V3, V3] | undefined => (c.kind === 'elbow' || len(sub(c.b, c.a)) < 1e-6 ? undefined : [c.a, unit(sub(c.b, c.a))]);
  // two pieces on one axis whose lengths along it overlap by no more than 0.05 in: the valves of a stack or of a station stand so (SW-LL-3, SW-LL-7)
  const coaxialApart = (x: Comp, y: Comp) => {
    const X = axisOf(x), Y = axisOf(y); if (!X || !Y || Math.abs(Math.abs(dot(X[1], Y[1])) - 1) > 1e-6) return false;
    const d = sub(y.a, x.a); if (len(sub(d, [X[1][0] * dot(d, X[1]), X[1][1] * dot(d, X[1]), X[1][2] * dot(d, X[1])])) > 0.01) return false;
    const t = (p: V3) => dot(sub(p, x.a), X[1]), xs = [t(x.a), t(x.b)].sort((u, v) => u - v), ys = [t(y.a), t(y.b)].sort((u, v) => u - v);
    return Math.min(xs[1], ys[1]) - Math.max(xs[0], ys[0]) <= 0.05;
  };
  // the boxes first; the depth only for shapes whose boxes overlap. Two pieces next to each other in the chain are joined, and not compared
  for (let i = 0; i < S.length; i++) for (let j = i + 2; j < S.length; j++) {
    if (S.slice(i + 1, j).every(z => THIN.has(z.c.kind)) || coaxialApart(S[i].c, S[j].c)) continue;
    let most: { d: number; at: V3 } | undefined;
    for (let p = 0; p < S[i].sh.length; p++) for (let q = 0; q < S[j].sh.length; q++) {
      if (!ov(S[i].bb[p], S[j].bb[q]) || apart(S[i].sh[p], S[j].sh[q])) continue;
      const f = shared(S[i].sh[p], S[j].sh[q], S[i].bb[p], S[j].bb[q], pts); if (f.d > tol && (!most || f.d > most.d)) most = f;
    }
    if (most) out.push({ a: `${S[i].c.tag} (${S[i].c.kind})`, b: `${S[j].c.tag} (${S[j].c.kind})`, ca: S[i].c, cb: S[j].c, depth: most.d, at: most.at.map(v => Math.round(v)) as V3 });
  }
  return out;
}
/** SW-RPI-22: every routed line of a model measured against itself, each finding in the form of the generator's clearance checks */
export function ownClearance(m: PipingModel): string[] {
  const nozzles = new Map(m.nozzles.map(n => [n.id, n] as const));
  return m.lines.flatMap(r => (r.ok ? ownClashes(r, nozzles).map(f => `${r.no} ${f.a} – ${f.b}: ${f.depth.toFixed(2)} in`) : []));
}
/** SW-RT-4, as SW-RPI-23 (a) takes it: the straight a branch's search needs before a turn, two elbow radii and 2 in on the 6 in grid (24 in at 6 in, 30 at 8, 36 at 10, 42 at 12, 54 at 14) */
export const elbowSpacing = (NPS: number, cls: Comp['cls']) => 6 * Math.ceil((2 * elbowRadius(pipeDims(NPS, cls).OD) + 2) / 6 - 1e-9);
/** SW-RPI-13: points every 5° along a 90° elbow's centre line, from its end `a` to its end `b`, as the arc is measured against steel */
export function arcPoints(c: Comp): V3[] {
  const R = elbowRadius(pipeDims(c.NPS, c.cls).OD), k: V3 = [c.a[0] + c.T[8] * R, c.a[1] + c.T[9] * R, c.a[2] + c.T[10] * R], O: V3 = [c.a[0] + c.b[0] - k[0], c.a[1] + c.b[1] - k[1], c.a[2] + c.b[2] - k[2]], out: V3[] = [];
  for (let i = 0; i <= 18; i++) { const t = (i * Math.PI) / 36; out.push([0, 1, 2].map(a => O[a] + (c.a[a] - O[a]) * Math.cos(t) + (c.b[a] - O[a]) * Math.sin(t)) as V3); }
  return out;
}
/** SW-RPI-19 (amended again), SW-RPI-13: a 90° elbow held by its arc, its tube flat at its two ends as SW-RPI-22 holds it: whether it shares a point with a box
 *  (points through the tube found inside the box, or points through the box found inside the tube). A round taken about each point of the arc would reach past
 *  the elbow's end, into the valve its flange bolts to */
export function arcMeetsBox(c: Comp): (mn: V3, mx: V3) => boolean {
  const s = shapesOf(c).find(x => x.k === 'arc'); if (!s) return () => false;
  let pts: V3[] | undefined;
  return (mn, mx) => { const box: OwnShape = { k: 'box', mn, mx }; pts ??= samples(s); return pts.some(p => depth(box, p) > 0) || samples(box).some(p => depth(s, p) > 0); };
}

// ───────────────────────── SW-RPI-23: a line through itself, corrected on the result ─────────────────────────
// Each correction acts only on a line SW-RPI-22 reports and moves nothing but that line (and for (a) the parent's fitting and the
// two pipes beside it). New pieces are laid as the generator assembles a route (src/generator/piping.ts, its step 5): a 90° or
// 45° elbow keyed EL|NPS|class|angle at each corner, framed from its inlet end, the bend's normal and the inlet direction; a pipe
// between, framed from its start. Every new piece must be at least 2 in long (SW-RT-4), 3 in from every other line, steel and
// equipment (SW-RT-3), clear of its own line (SW-RPI-22), and keep the head room (SW-RT-3, SW-RT-7); welds are derived again
// from the pieces with the generator's own deriveWelds; a support on a piece taken out goes with it.

type Bounds = [V3, V3];
const neg = (a: V3): V3 => [-a[0], -a[1], -a[2]], same = (p: V3, q: V3, tol = 1e-3) => len(sub(p, q)) < tol;
const origin = (c: Comp): V3 => [c.T[12], c.T[13], c.T[14]], yAx = (c: Comp): V3 => [c.T[4], c.T[5], c.T[6]], zAx = (c: Comp): V3 => [c.T[8], c.T[9], c.T[10]];
const moveT = (T: Comp['T'], o: V3): Comp['T'] => [...T.slice(0, 12), o[0], o[1], o[2], 1];
const perp = (w: V3): V3 => (Math.abs(w[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]);
const pipeKey = (c: Comp, L: number) => `${c.key.split('|').slice(0, 3).join('|')}|${L.toFixed(3)}`;
const pt = (p: V3) => `(${p.map(v => Math.round(v * 10) / 10 || 0).join(',')})`;
const ins = (s: Bounds, p: V3, e = 0) => [0, 1, 2].every(k => p[k] >= s[0][k] - e && p[k] <= s[1][k] + e);
/** the pieces of a line's own end stacks (A, B), the valve's pieces a header is carried on to (L, SW-RPI-15) and a branch's olets: what its route did not lay */
const STACK = /\/(A|B|L)\d+$|\/O[12]$/;
/** the routed pieces of a line: the indices of the first and last piece its route laid */
function routedSpan(r: LineRun): [number, number] | undefined {
  let i0 = -1, i1 = -1; r.comps.forEach((c, i) => { if (c.kind !== 'studs' && !STACK.test(c.tag)) { if (i0 < 0) i0 = i; i1 = i; } });
  return i0 < 0 ? undefined : [i0, i1];
}
/** SW-RT-4, as the generator sets it: a line's first routed point beyond an end, one elbow radius out on the 6 in grid, or one more step where that would leave less than 2 in of pipe */
function leadPoint(end: V3, u: V3, R: number): V3 {
  const ax = u.findIndex(v => Math.abs(v) > 0.5), sgn = Math.sign(u[ax]), P = [...end] as V3, up6 = (v: number) => Math.ceil(v / 6 - 1e-9) * 6;
  let s = sgn > 0 ? up6(end[ax] + R) : -up6(-(end[ax] - R));
  const gap = sgn * (s - end[ax]) - R; if (gap > 0.05 && gap < 2) s += sgn * 6;
  P[ax] = s; return P;
}
/** a piece's centre line: a pipe's or a fitting's axis, an elbow's two legs to its corner (as a route's path runs) */
function centreLine(c: Comp): V3[] {
  if (c.kind !== 'elbow') return [c.a, c.b];
  const R = elbowRadius(pipeDims(c.NPS, c.cls).OD), L = is45(c) ? R * Math.tan(Math.PI / 8) : c.key.startsWith('SWEL') ? len(sub(c.b, c.a)) / Math.SQRT2 : R;
  return [c.a, add(c.a, zAx(c), L), c.b];
}
const segPt = (p: V3, a: V3, b: V3) => { const ab = sub(b, a), t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / (dot(ab, ab) || 1))); return len(sub(p, add(a, ab, t))); };
const distTo = (p: V3, c: Comp) => { const q = centreLine(c); let d = Infinity; for (let i = 1; i < q.length; i++) d = Math.min(d, segPt(p, q[i - 1], q[i])); return d; };
/**
 * SW-RPI-23: the pieces of a route through `pts` (its two ends and its corners), laid as the generator lays them: at each corner an elbow
 * (45° where `angs` says so), with a pipe between; a pipe under 0.05 in is not laid. Undefined where a pipe would be under 2 in, run
 * backward, or a corner is not of its angle; and where a pipe not laid would leave two elbows welded back to back that are not a 45° pair
 * (SW-RT-4, SW-RT-8): `ends` gives the angle of the elbow each end of the route is joined to, 0 for another piece.
 */
function layPieces(NPS: number, cls: Comp['cls'], pts: V3[], angs: (45 | 90)[] = [], ends: [number, number] = [0, 0]): { comps: Comp[]; straights: number[] } | undefined {
  const R = elbowRadius(pipeDims(NPS, cls).OD), R45 = R * Math.tan(Math.PI / 8), comps: Comp[] = [], straights: number[] = [];
  const pipe = (from: V3, to: V3, w: V3, left: number, right: number): boolean => {
    const d = sub(to, from), s = dot(d, w), L = len(d);
    if (L < 0.05) return !(left && right) || (left === 45 && right === 45);
    if (s < 0 || len(sub(d, [w[0] * s, w[1] * s, w[2] * s])) > 0.01 || L < 2 - 1e-6) return false;
    comps.push({ tag: '', kind: 'pipe', key: `PIPE|${NPS}|${cls}|${L.toFixed(3)}`, T: frameFromAxes(from, perp(w), w), a: from, b: to, NPS, cls, e1: 'BW', e2: 'BW' }); straights.push(L);
    return true;
  };
  let cursor = pts[0], before = ends[0];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = unit(sub(pts[i], pts[i - 1])), b = unit(sub(pts[i + 1], pts[i])), ang = angs[i] ?? 90;
    if (Math.abs(dot(a, b) - Math.cos((ang * Math.PI) / 180)) > 1e-6) return undefined;
    const Lc = ang === 90 ? R : R45, ein = add(pts[i], a, -Lc), eout = add(pts[i], b, Lc);
    if (!pipe(cursor, ein, a, before, ang)) return undefined;
    comps.push({ tag: '', kind: 'elbow', key: `EL|${NPS}|${cls}|${ang}`, T: frameFromAxes(ein, cross(a, b), a), a: ein, b: eout, NPS, cls, e1: 'BW', e2: 'BW' });
    cursor = eout; before = ang;
  }
  return pipe(cursor, pts[pts.length - 1], unit(sub(pts[pts.length - 1], pts[pts.length - 2])), before, ends[1]) ? { comps, straights } : undefined;
}
/** the angle of the elbow a stretch of a line's pieces (from index i0 to i1) is joined to at each end, 0 where it is joined to another piece; studs are passed over */
function endsOf(comps: Comp[], i0: number, i1: number): [number, number] {
  const ang = (c?: Comp) => (c?.kind === 'elbow' ? (is45(c) ? 45 : 90) : 0);
  let p = i0 - 1; while (p >= 0 && comps[p].kind === 'studs') p--;
  let q = i1 + 1; while (q < comps.length && comps[q].kind === 'studs') q++;
  return [ang(comps[p]), ang(comps[q])];
}
/** a route from S leaving along d1 to E arriving along d2, with at most two elbows: its ends and corners, or undefined */
function fewElbows(S: V3, d1: V3, E: V3, d2: V3): V3[] | undefined {
  const D = sub(E, S);
  if (Math.abs(dot(d1, d2) - 1) < 1e-9) return len(cross(D, d1)) < 0.01 && dot(D, d1) > 0 ? [S, E] : undefined;
  if (Math.abs(dot(d1, d2)) > 1e-9) return undefined;
  const a = dot(D, d1), c = dot(D, d2), C1 = add(S, d1, a), m = sub(sub(D, [d1[0] * a, d1[1] * a, d1[2] * a]), [d2[0] * c, d2[1] * c, d2[2] * c]);
  if (a <= 0.05 || c <= 0.05) return undefined;
  return len(m) < 0.01 ? [S, C1, E] : [S, C1, add(C1, m), E];
}
/**
 * SW-RPI-23: a line's pieces with those from index i0 to i1 replaced by `laid`, tagged as the generator tags its pieces (p or el and the
 * place in the line; where that is held, the number after the line's highest). A new piece the same as one it replaces is that piece; a
 * pipe that keeps one end of a pipe it replaces (lengthened or shortened) keeps its tag.
 */
function spliced(r: LineRun, comps0: Comp[], i0: number, i1: number, laid: Comp[]): { comps: Comp[]; fresh: Comp[]; gone: Comp[] } {
  const old = comps0.slice(i0, i1 + 1), used = new Set<Comp>(), comps = comps0.slice(0, i0), fresh: Comp[] = [];
  const taken = new Set([...comps0.slice(0, i0), ...comps0.slice(i1 + 1)].map(c => c.tag));
  let top = Math.max(0, ...comps0.map(c => Number(/\/[a-z]+(\d+)$/.exec(c.tag)?.[1] ?? 0)));
  // the pieces laid the same as one they replace are found first, and their tags held, so that no new piece takes one of them
  const likes = laid.map(c => { const o = old.find(q => !used.has(q) && q.kind === c.kind && q.key === c.key && same(q.a, c.a) && same(q.b, c.b)); if (o) { used.add(o); taken.add(o.tag); } return o; });
  for (const [i, c] of laid.entries()) {
    const like = likes[i];
    if (like) { comps.push(like); continue; }
    const kept = c.kind === 'pipe' ? old.find(o => !used.has(o) && o.kind === 'pipe' && !taken.has(o.tag) && (same(o.a, c.a) || same(o.b, c.b))) : undefined;
    let tag = kept?.tag; if (kept) used.add(kept);
    if (!tag) { const pre = c.kind === 'elbow' ? 'el' : 'p'; tag = `${r.no}/${pre}${comps.length + 1}`; while (taken.has(tag)) tag = `${r.no}/${pre}${++top}`; }
    taken.add(tag); const n = { ...c, tag }; comps.push(n); fresh.push(n);
  }
  comps.push(...comps0.slice(i1 + 1));
  return { comps, fresh, gone: comps0.filter(o => !comps.includes(o)) };
}
/** SW-RPI-23: a line's welds derived again from its pieces as the generator derives them; its joints to pieces of other lines (a parent's tee outlet, the run an olet sits on) and its field welds are kept, each at `moved` of where it stood */
function weldsAgain(r: LineRun, comps: Comp[], moved: (p: V3) => V3 = p => p): WeldRec[] {
  const own = new Set(r.comps.map(c => c.tag));
  const ext = r.welds.filter(w => !own.has(w.joins[0])).map(w => ({ at: moved(w.at), tag: w.joins[0], NPS: w.NPS, cls: r.cls, w: w.dir, type: w.type, ...(/\/O[12]$/.test(w.joins[1]) ? { join: w.joins[1] } : {}) }));
  return deriveWelds(r.no, comps, ext, r.welds.filter(w => w.field && own.has(w.joins[0])).map(w => moved(w.at)));
}
/** SW-RPI-23: a line's supports, less those on a piece taken out: a support whose nearest piece is gone stays only where a new piece of the same kind holds it as that piece did */
function supportsKept(r: LineRun, comps: Comp[], gone: Comp[]): SupportRec[] {
  const g = new Set(gone), was = r.comps.filter(c => c.kind !== 'studs'), now = comps.filter(c => c.kind !== 'studs');
  const nearest = (p: V3, cs: Comp[]) => cs.reduce((b, c) => { const d = distTo(p, c); return d < b.d ? { c, d } : b; }, { c: cs[0], d: Infinity });
  return r.supports.filter(sp => { const o = nearest(sp.at, was); if (!g.has(o.c)) return true; const n = nearest(sp.at, now); return n.c.kind === o.c.kind && Math.abs(n.d - o.d) < 0.01; });
}
/** SW-RPI-13, as the units' checks measure a pair again: a 45° elbow by its own two legs (R tan 22.5° each), a piece askew to the axes against a valve's box from points every 1/4 in along its axis; undefined where the clearance check's own figure stands */
function measuredAgain(a: Comp, b: Comp, vb: (c: Comp) => Bounds): number | undefined {
  const askew = (c: Comp) => c.kind !== 'valve' && [0, 1, 2].filter(k => Math.abs(c.a[k] - c.b[k]) > 1e-6).length > 1, el45 = (c: Comp) => c.kind === 'elbow' && is45(c);
  if (!el45(a) && !el45(b) && !(a.kind === 'valve' && askew(b)) && !(b.kind === 'valve' && askew(a))) return undefined;
  const shapes = (c: Comp): K.Shape[] => { if (!el45(c)) return K.compShapes(c, vb); const OD = pipeDims(c.NPS, c.cls).OD, corner = add(c.a, zAx(c), elbowRadius(OD) * Math.tan(Math.PI / 8)); return [{ kind: 'cap', a: c.a, b: corner, r: OD / 2 }, { kind: 'cap', a: corner, b: c.b, r: OD / 2 }]; };
  const exact = (x: K.Shape, y: K.Shape): number => {
    if (x.kind === 'box' && y.kind === 'cap') return exact(y, x);
    if (x.kind !== 'cap' || y.kind !== 'box') return K.gap(x, y);
    const L = len(sub(x.b, x.a)), n = Math.max(1, Math.ceil(L / 0.25)); let best = Infinity;
    for (let i = 0; i <= n; i++) { const p = add(x.a, sub(x.b, x.a), i / n); best = Math.min(best, Math.hypot(...[0, 1, 2].map(k => Math.max(y.mn[k] - p[k], p[k] - y.mx[k], 0)))); }
    return best - x.r;
  };
  return Math.min(...shapes(a).flatMap(x => shapes(b).map(y => exact(x, y))));
}
const shapeBox = (s: K.Shape): Bounds => (s.kind === 'box' ? [s.mn, s.mx] : [[0, 1, 2].map(k => Math.min(s.a[k], s.b[k]) - s.r) as V3, [0, 1, 2].map(k => Math.max(s.a[k], s.b[k]) + s.r) as V3]);
function boundsOf(cs: Comp[], vb: (c: Comp) => Bounds): Bounds {
  const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity];
  for (const c of cs) for (const s of K.compShapes(c, vb)) { const [a, b] = shapeBox(s); for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], a[k]); mx[k] = Math.max(mx[k], b[k]); } }
  return [mn, mx];
}
/** what the corrections of one model share: its nozzles, the plant's steel and equipment (keep-outs left out: they are no part of the model), and each line's bounds */
interface Cx { m: PipingModel; up: Pick<UnitPiping, 'plant' | 'lines'>; vb: (c: Comp) => Bounds; nozzles: Map<string, NozzleRun>; boxes: WeakMap<Comp[], Bounds> }
const plantStatics = new WeakMap<PlantDef, ReturnType<typeof staticObstacles>>();
function staticsOf(plant: PlantDef) {
  let s = plantStatics.get(plant);
  if (!s) { const all = staticObstacles(plant.building().instances, plant.interior().instances, true); s = { ...all, obstacles: all.obstacles.filter(o => !/keep-out/.test(o.tag)) }; plantStatics.set(plant, s); }
  return s;
}
const context = (m: PipingModel, up: Cx['up'], vb: Cx['vb']): Cx => ({ m, up, vb, nozzles: new Map(m.nozzles.map(n => [n.id, n] as const)), boxes: new WeakMap() });
const lineBounds = (cx: Cx, r: LineRun) => { let b = cx.boxes.get(r.comps); if (!b) cx.boxes.set(r.comps, (b = boundsOf(r.comps.filter(c => c.kind !== 'studs'), cx.vb))); return b; };
/** SW-RT-3: the points whose 4 ft in plan a line's new pieces may pass below the head room: each end's face (a nozzle's, or the centre of the fitting it takes off from) and its first routed point */
function endZones(cx: Cx, r: LineRun): V3[] {
  return [r.path[0], r.path[r.path.length - 1], ...[r.from, r.to].map(e => endFace(cx, r, e)).filter((p): p is V3 => !!p)];
}
/** the face of a line's end: its nozzle's face, or the centre of the fitting it takes off from */
function endFace(cx: Cx, r: LineRun, e: string): V3 | undefined {
  const n = cx.nozzles.get(e); if (n) return n.face as V3;
  const t = e.startsWith('tap ') ? cx.m.lines.find(q => q.no === e.slice(4))?.comps.find(c => c.tag === `${e.slice(4)}/T:${r.no}`) ?? r.comps.find(c => c.kind === 'olet') : undefined;
  return t ? origin(t) : undefined;
}
/**
 * SW-RPI-23: why the new pieces `fresh` of the lines `changed` may not stand, or undefined where they may: a pipe under 2 in (SW-RT-4); a piece
 * within 3 in of another line, measured as the units' checks measure it (SW-RT-3, SW-RPI-13), or of the plant's steel and equipment; a piece
 * through its own line (SW-RPI-22); a piece of `room` below the head room kept on the floor or a platform, or in the 2 ft over a rack tier,
 * farther than 4 ft in plan from every point of `zones` (SW-RT-3, SW-RT-7), and not on the path the generator routed the line by (`routed`:
 * the generator kept the head room there itself).
 */
function refusal(cx: Cx, changed: LineRun[], fresh: Comp[], zones: V3[], room: Comp[], routed: V3[] = []): string | undefined {
  const isNew = new Set(fresh), tags = new Map(changed.map(r => [r.no, new Set(r.comps.filter(c => isNew.has(c)).map(c => c.tag))] as const)), freshTag = (no: string, tag: string) => !!tags.get(no)?.has(tag);
  for (const c of fresh) if (c.kind === 'pipe' && len(sub(c.b, c.a)) < 2 - 1e-6) return `a pipe ${len(sub(c.b, c.a)).toFixed(2)} in long (SW-RT-4)`;
  const [mn, mx] = boundsOf(fresh, cx.vb), near: Bounds = [mn.map(v => v - 12) as V3, mx.map(v => v + 12) as V3];
  const others = cx.m.lines.filter(r => r.comps.length && !changed.some(q => q.no === r.no) && K.boxGap(lineBounds(cx, r), near) < 1e-9);
  const byTag = new Map<string, Comp>(); for (const r of [...changed, ...others]) for (const c of r.comps) byTag.set(c.tag, c);
  for (const v of new Set(K.checkLineClearance({ lines: [...changed, ...others], nozzles: [], failures: [], stats: {} }, cx.vb).violations)) {
    const t = /^(\S+) (\S+) – (\S+) (\S+): /.exec(v); if (!t || !(freshTag(t[1], t[2]) || freshTag(t[3], t[4]))) continue;
    const a = byTag.get(t[2]), b = byTag.get(t[4]), g = a && b ? measuredAgain(a, b, cx.vb) : undefined; if (g !== undefined && g >= 3) continue;
    return `within 3 in of another line (${v})`;
  }
  const st = staticsOf(cx.up.plant);
  const sv = K.checkStaticClearance({ lines: changed, nozzles: cx.m.nozzles, failures: [], stats: {} }, st.obstacles, cx.vb).find(v => { const t = /^(\S+) (\S+) \(/.exec(v); return !!t && freshTag(t[1], t[2]); });
  if (sv) return `within 3 in of steel or equipment (${sv})`;
  for (const r of changed) for (const f of ownClashes(r, cx.nozzles)) if (isNew.has(f.ca) || isNew.has(f.cb)) return `through its own line (${f.a} – ${f.b}: ${f.depth.toFixed(2)} in, SW-RPI-22)`;
  const rk = cx.up.plant.rack, through = !!cx.up.plant.verticalThroughPlatforms;
  for (const c of room) {
    const q = centreLine(c);
    for (let i = 1; i < q.length; i++) {
      const d = sub(q[i], q[i - 1]), n = Math.max(1, Math.ceil(len(d) / 3)), vertical = Math.abs(unit(d)[1]) > 0.99;
      for (let k = 0; k <= n; k++) {
        const p = add(q[i - 1], d, k / n);
        const kept = p[1] < 96 || rk.tiers.some(t => p[0] >= rk.x0 - 12 && p[0] <= rk.x1 + 12 && p[1] >= t && p[1] <= t + 24 && Math.abs(p[2]) <= rk.halfWidth) || (!(through && vertical) && st.headroom.some(h => ins(h, p)));
        if (kept && !zones.some(z => (p[0] - z[0]) ** 2 + (p[2] - z[2]) ** 2 <= 48 * 48) && !routed.some((q0, j) => j > 0 && segPt(p, routed[j - 1], q0) < 0.5)) return `${c.tag} (${c.kind}) in the head room kept at ${pt(p)}, more than 4 ft in plan from the line's own end points (SW-RT-3, SW-RT-7)`;
      }
    }
  }
  return undefined;
}
/** SW-RPI-23: a line's new pieces made its own: its welds derived again, its supports on pieces taken out gone with them, the model's counts kept */
function commit(cx: Cx, r: LineRun, comps: Comp[], gone: Comp[], path?: V3[], moved?: (p: V3) => V3): void {
  const welds = weldsAgain(r, comps, moved), supports = supportsKept(r, comps, gone), s = cx.m.stats;
  s.comps = (s.comps ?? 0) + comps.length - r.comps.length; s.welds = (s.welds ?? 0) + welds.length - r.welds.length; s.supports = (s.supports ?? 0) + supports.length - r.supports.length;
  r.comps = comps; r.welds = welds; r.supports = supports; if (path) r.path = path;
}
/** a sleeve where a line passes a grating stands on a pipe; a correction does not take one out */
const sleeveGone = (r: LineRun, gone: Comp[]) => (r.pens ?? []).some(p => { const g = new Set(gone), was = r.comps.filter(c => c.kind !== 'studs'), mid = add(p.a, sub(p.b, p.a), 0.5); return g.has(was.reduce((b, c) => (distTo(mid, c) < distTo(mid, b) ? c : b), was[0])); });
const lines1 = (cx: Cx, only?: Set<string>) => cx.m.lines.filter(r => r.ok && r.kind === 'routed' && (r.joint ?? 'BW') === 'BW' && (!only || only.has(r.no)) && r.path.length >= 2 && ownClashes(r, cx.nozzles).length > 0);
const fmtLs = (xs: number[]) => xs.map(x => x.toFixed(1)).join(', ');

/**
 * SW-RPI-23 (d): a 45° offset over a take-off. The generator lays no offset where a branch sits on the length it replaces, but tests only the
 * take-off's centre against the offset's two corners. Where an offset it laid leaves less than 2 in of pipe between one of its elbows and a
 * take-off's fitting on the same run, or runs past it, the corner is laid as the generator routed it: two 90° elbows at the path's corners, the
 * pipes beside them lengthened or shortened to meet them.
 */
export function offsetOverTakeOff(m: PipingModel, up: Cx['up'], vb: Cx['vb'], only?: Set<string>): string[] {
  const cx = context(m, up, vb), notes: string[] = [];
  for (const r of lines1(cx, only)) for (let pass = 0; pass < 4 && ownClashes(r, cx.nozzles).length; pass++) {
    const c = r.comps, R = elbowRadius(pipeDims(r.NPS, r.cls).OD), R45 = R * Math.tan(Math.PI / 8); let done = false;
    for (let i = 0; i < c.length && !done; i++) {
      if (c[i].kind !== 'elbow' || !is45(c[i])) continue;
      const k = c[i + 1]?.kind === 'pipe' ? i + 2 : i + 1, e1 = c[i], e2 = c[k]; if (!e2 || e2.kind !== 'elbow' || !is45(e2)) continue;
      const a = unit(zAx(e1)), Q1 = add(e1.a, a, R45), Q2 = add(e2.a, zAx(e2), R45); if (!same(unit(sub(e2.b, Q2)), a, 1e-4)) continue;
      const D = sub(Q2, Q1), jog = sub(D, [a[0] * dot(D, a), a[1] * dot(D, a), a[2] * dot(D, a)]), P = r.path;
      const j = P.findIndex((p, q) => q + 1 < P.length && same(sub(P[q + 1], p), jog, 0.01) && len(cross(sub(p, Q1), a)) < 0.01 && len(cross(sub(P[q + 1], Q2), a)) < 0.01);
      if (j < 0) continue;
      // the take-off's fitting on either run beside the offset, with at most a pipe between: a tee of the line's own, or an olet a branch sets on it
      const s0 = c[i - 1]?.kind === 'pipe' ? i - 1 : i, s1 = c[k + 1]?.kind === 'pipe' ? k + 1 : k, before = c[s0 - 1], after = c[s1 + 1], along = (p: V3) => dot(p, a);
      const olets = m.lines.flatMap(q => q.comps.filter(o => o.kind === 'olet' && o.onRun === r.no)).map(o => ({ o, s: along(origin(o)), half: smallBore(o.NPS, o.cls).OD / 2 + 2 * smallBore(o.NPS, o.cls).tf + 1 }));
      const gaps: { tag: string; gap: number }[] = [];
      if (after?.kind === 'tee') gaps.push({ tag: after.tag, gap: Math.min(along(after.a), along(after.b)) - along(e2.b) });
      if (before?.kind === 'tee') gaps.push({ tag: before.tag, gap: along(e1.a) - Math.max(along(before.a), along(before.b)) });
      for (const ol of olets) { const off1 = len(cross(sub(origin(ol.o), Q1), a)), off2 = len(cross(sub(origin(ol.o), Q2), a)), r0 = pipeDims(r.NPS, r.cls).OD / 2 + 1;
        if (off2 <= r0 && ol.s > along(Q2) - 1e-6) gaps.push({ tag: ol.o.tag, gap: ol.s - ol.half - along(e2.b) }); if (off1 <= r0 && ol.s < along(Q1) + 1e-6) gaps.push({ tag: ol.o.tag, gap: along(e1.a) - ol.s - ol.half }); }
      const hit = gaps.find(g => g.gap < 2 - 1e-6); if (!hit) continue;
      const laid = layPieces(r.NPS, r.cls, [c[s0].a, P[j], P[j + 1], c[s1].b], [], endsOf(c, s0, s1)); if (!laid) continue;
      const sp = spliced(r, c, s0, s1, laid.comps), nr = { ...r, comps: sp.comps };
      if (sleeveGone(r, sp.gone)) continue;
      const why = refusal(cx, [nr], sp.fresh, endZones(cx, r), sp.fresh, r.path);
      if (why) { notes.push(`${r.no}: the 45° offset ${e1.tag}–${e2.tag} over ${hit.tag} not laid again as routed, ${why} (SW-RPI-23 (d))`); continue; }
      // what each pipe beside the offset became: one kept (lengthened or shortened) is told by how much
      const told = sp.fresh.filter(p => p.kind === 'pipe').map(p => { const o = c.find(q => q.tag === p.tag && q.kind === 'pipe'), L = len(sub(p.b, p.a)); return o ? `${p.tag} ${L - len(sub(o.b, o.a)) >= 0 ? 'lengthened' : 'shortened'} by ${Math.abs(L - len(sub(o.b, o.a))).toFixed(1)} in to ${L.toFixed(1)} in` : `${L.toFixed(1)} in`; });
      commit(cx, r, sp.comps, sp.gone); done = true;
      notes.push(`${r.no}: the 45° offset ${e1.tag}–${e2.tag} ${hit.gap < 0 ? `ran ${(-hit.gap).toFixed(1)} in past` : `left ${hit.gap.toFixed(1)} in of pipe to`} the take-off ${hit.tag}; the corner laid as the generator routed it, two 90° elbows at ${pt(P[j])} and ${pt(P[j + 1])}, the pipes ${told.join(', ')} (SW-RPI-23 (d))`);
    }
    if (!done) break;
  }
  return notes;
}

/**
 * SW-RPI-23 (e): a loop through its own leg. Where two straight legs of a line's routed span cross at a point inside both, the corners between them are
 * taken out and the line turns there, from the first leg onto the second; the span is laid again through the corners left.
 */
export function loopThroughLeg(m: PipingModel, up: Cx['up'], vb: Cx['vb'], only?: Set<string>): string[] {
  const cx = context(m, up, vb), notes: string[] = [];
  for (const r of lines1(cx, only)) {
    const sp = routedSpan(r); if (!sp) continue;
    const [i0, i1] = sp, mid = r.comps.slice(i0, i1 + 1); if (mid.some(c => !['pipe', 'elbow', 'coupling'].includes(c.kind)) || mid.some(c => c.kind === 'elbow' && is45(c))) continue;
    const S = r.comps[i0].a, E = r.comps[i1].b, Q: V3[] = [S, ...r.path.slice(1, -1), E];
    // the first crossing of two legs that are not neighbours: segment i and segment j > i + 1, meeting at a point inside both
    let cut: { i: number; j: number; P: V3 } | undefined;
    for (let i = 0; i + 1 < Q.length && !cut; i++) for (let j = i + 2; j + 1 < Q.length && !cut; j++) {
      const a = Q[i], b = Q[i + 1], c = Q[j], d = Q[j + 1], u = sub(b, a), v = sub(d, c), n = cross(u, v); if (len(n) < 1e-9) continue;
      const w = sub(c, a); if (Math.abs(dot(w, n)) / len(n) > 0.01) continue;   // not in one plane: they pass
      const t = dot(cross(w, v), n) / dot(n, n), q = dot(cross(w, u), n) / dot(n, n);
      if (t > 1e-6 && t < 1 - 1e-6 && q > 1e-6 && q < 1 - 1e-6) cut = { i, j, P: [a[0] + u[0] * t, a[1] + u[1] * t, a[2] + u[2] * t] };
    }
    if (!cut) continue;
    const pts = [...Q.slice(0, cut.i + 1), cut.P, ...Q.slice(cut.j + 1)];
    const laid = layPieces(r.NPS, r.cls, pts, [], endsOf(r.comps, i0, i1)); if (!laid) { notes.push(`${r.no}: its route crosses its own leg, but the line cannot be laid turning at the crossing (SW-RPI-23 (e))`); continue; }
    const s = spliced(r, r.comps, i0, i1, laid.comps), nr = { ...r, comps: s.comps };
    if (sleeveGone(r, s.gone)) continue;
    const why = refusal(cx, [nr], s.fresh, endZones(cx, r), s.fresh, r.path);
    if (why) { notes.push(`${r.no}: its route crosses its own leg at ${cut.P.map(Math.round).join(', ')}, but turning there is ${why} (SW-RPI-23 (e))`); continue; }
    commit(cx, r, s.comps, s.gone, [r.path[0], ...pts.slice(1, -1), r.path[r.path.length - 1]]);
    notes.push(`${r.no}: its route crossed its own leg; the ${cut.j - cut.i - 1} corners of the loop taken out, the line turning at ${cut.P.map(Math.round).join(', ')} (SW-RPI-23 (e))`);
  }
  return notes;
}

/**
 * SW-RPI-23 (b): two ends on one axis. Where a line's two end stacks, or an end stack and a take-off's outlet, stand on one axis facing each
 * other with 2 in or more between them, the pieces between become one straight pipe, welded where the first and last were.
 */
export function straightBetweenStacks(m: PipingModel, up: Cx['up'], vb: Cx['vb'], only?: Set<string>): string[] {
  const cx = context(m, up, vb), notes: string[] = [];
  for (const r of lines1(cx, only)) {
    const sp = routedSpan(r); if (!sp) continue;
    const [i0, i1] = sp, mid = r.comps.slice(i0, i1 + 1); if (mid.some(c => !['pipe', 'elbow', 'coupling'].includes(c.kind))) continue;
    const S = r.comps[i0].a, E = r.comps[i1].b, dS = unit(sub(r.path[0], S)), dE = unit(sub(r.path[r.path.length - 1], E)), D = sub(E, S), L = dot(D, dS);
    if (len(cross(D, dS)) > 0.01 || L < 2 - 1e-6 || Math.abs(dot(dS, dE) + 1) > 1e-6) continue;
    const laid = layPieces(r.NPS, r.cls, [S, E], [], endsOf(r.comps, i0, i1)); if (!laid) continue;
    const s = spliced(r, r.comps, i0, i1, laid.comps), nr = { ...r, comps: s.comps };
    if (sleeveGone(r, s.gone)) continue;
    const why = refusal(cx, [nr], s.fresh, endZones(cx, r), s.fresh, r.path);
    if (why) { notes.push(`${r.no}: its two ends stand on one axis facing each other, ${L.toFixed(1)} in apart, but one straight pipe between them is ${why} (SW-RPI-23 (b))`); continue; }
    const n = mid.filter(c => c.kind === 'elbow').length;
    commit(cx, r, s.comps, s.gone, [S, E]);
    notes.push(`${r.no}: its two ends stand on one axis facing each other; the ${mid.length} pieces between them (${n} elbows) laid as one straight pipe of ${L.toFixed(1)} in (SW-RPI-23 (b))`);
  }
  return notes;
}

/**
 * SW-RPI-23 (c): a turn-about at a bare end. Where a line passes through itself, or its own nozzle's flange or neck, at a connection left
 * without its valve (SW-RPI-14), and the run before the turn-about lies parallel to the connection's axis, offset in one plane by 8 ft or
 * less, the pieces from that run's last elbow to the flange are laid as a 45° offset as SW-RT-8 lays one: two 45° elbows on a diagonal
 * centred between them on the 6 in grid, neither within 6 in of a grating, every new piece within the plan area and no lower than the
 * pieces it replaces.
 */
export function bareTurnAsOffset(m: PipingModel, up: Cx['up'], vb: Cx['vb'], only?: Set<string>): string[] {
  const cx = context(m, up, vb), notes: string[] = [], st = staticsOf(up.plant);
  for (const l of up.lines) for (const side of l.bare ?? []) {
    const r = lines1(cx, new Set([l.def.no])).find(q => !only || only.has(q.no)); if (!r) continue;
    const nz = cx.nozzles.get(side === 'from' ? r.from : r.to), sp = routedSpan(r); if (!nz || !sp) continue;
    const toEnd = side === 'to', P = toEnd ? r.path : [...r.path].reverse(), u = unit(nz.u as V3), dIn = neg(u), E = toEnd ? r.comps[sp[1]].b : r.comps[sp[0]].a;
    const offAxis = (p: V3): V3 => { const d = sub(p, E), s = dot(d, u); return [d[0] - u[0] * s, d[1] - u[1] * s, d[2] - u[2] * s]; };
    // the run before the turn-about, looked for from the end back: along the axis toward the nozzle, off it in one plane by 6 in to 8 ft, and after it a run away from the nozzle
    let k = -1;
    for (let j = P.length - 2; j >= 1 && k < 0; j--) {
      const off = offAxis(P[j]), d = len(off);
      if (!same(unit(sub(P[j + 1], P[j])), dIn, 1e-6) || off.filter(v => Math.abs(v) > 1e-6).length !== 1 || d < 6 - 1e-6 || d > 96 + 1e-6) continue;
      if (P.slice(j + 1).some((p, q, arr) => q + 1 < arr.length && same(unit(sub(arr[q + 1], p)), u, 1e-6))) k = j;
    }
    if (k < 0) continue;
    const OD = pipeDims(r.NPS, r.cls).OD, R = elbowRadius(OD), R45 = R * Math.tan(Math.PI / 8), S = add(P[k], dIn, R);
    const iS = r.comps.findIndex((c, i) => i >= sp[0] && i <= sp[1] && same(toEnd ? c.a : c.b, S)); if (iS < 0) continue;
    const [i0, i1] = toEnd ? [iS, sp[1]] : [sp[0], iS], gone0 = r.comps.slice(i0, i1 + 1).filter(c => c.kind !== 'studs');
    if (gone0.some(c => c.kind !== 'pipe' && c.kind !== 'elbow')) continue;
    // it passes through itself, or its nozzle's flange or neck, here: a finding on a piece it replaces, on the end's own stack or on the nozzle
    const endTags = new Set([...gone0.map(c => c.tag), ...(toEnd ? r.comps.slice(sp[1] + 1) : r.comps.slice(0, sp[0])).map(c => c.tag), ...nz.comps.map(c => c.tag)]);
    if (!ownClashes(r, cx.nozzles).some(f => endTags.has(f.ca.tag) || endTags.has(f.cb.tag))) continue;
    const d = len(offAxis(S)), sS = dot(S, dIn), sE = dot(E, dIn), mid = Math.round((sS + sE) / 2 / 6) * 6;
    const Q1 = add(S, dIn, mid - d / 2 - sS), Q2 = add(E, dIn, mid + d / 2 - sE), reach = R45 + 6;
    const grating = st.gratings.find(gr => [Q1, Q2].some(q => Math.abs(gr.top - q[1]) < reach && q[0] >= gr.box[0][0] - reach && q[0] <= gr.box[1][0] + reach && q[2] >= gr.box[0][2] - reach && q[2] <= gr.box[1][2] + reach));
    const at = `${toEnd ? r.to : r.from}`;
    if (grating) { notes.push(`${r.no}: the turn-about at ${at} not laid as a 45° offset: an elbow would stand within 6 in of the grating ${grating.tag} (SW-RPI-23 (c))`); continue; }
    const walk = [S, Q1, Q2, E], laid = layPieces(r.NPS, r.cls, toEnd ? walk : [...walk].reverse(), [90, 45, 45, 90], endsOf(r.comps, i0, i1));
    if (!laid) { notes.push(`${r.no}: the turn-about at ${at} not laid as a 45° offset: the offset centred on the grid leaves a pipe under 2 in (SW-RPI-23 (c))`); continue; }
    // within the plan area of the pieces it replaces, and no lower than the lowest of them
    const was = gone0.flatMap(centreLine), lo: V3 = [0, 1, 2].map(q => Math.min(...was.map(p => p[q]))) as V3, hi: V3 = [0, 1, 2].map(q => Math.max(...was.map(p => p[q]))) as V3;
    if (!laid.comps.flatMap(centreLine).every(p => p[0] >= lo[0] - 0.01 && p[0] <= hi[0] + 0.01 && p[2] >= lo[2] - 0.01 && p[2] <= hi[2] + 0.01 && p[1] >= lo[1] - 0.01)) { notes.push(`${r.no}: the turn-about at ${at} not laid as a 45° offset: it would leave the plan area of the pieces it replaces, or stand lower than they (SW-RPI-23 (c))`); continue; }
    const s = spliced(r, r.comps, i0, i1, laid.comps), nr = { ...r, comps: s.comps };
    if (sleeveGone(r, s.gone)) continue;
    const why = refusal(cx, [nr], s.fresh, endZones(cx, r), s.fresh, r.path);
    if (why) { notes.push(`${r.no}: the turn-about at ${at} not laid as a 45° offset, ${why} (SW-RPI-23 (c))`); continue; }
    const tail = toEnd ? [...r.path.slice(0, k + 1), Q1, Q2, E] : [E, Q2, Q1, ...r.path.slice(r.path.length - 1 - k)];
    commit(cx, r, s.comps, s.gone, tail);
    notes.push(`${r.no}: the turn-about at ${at}, left without its valve (SW-RPI-14), laid as a 45° offset from ${pt(S)}: corners ${pt(Q1)} and ${pt(Q2)}, straights ${fmtLs(laid.straights)} in; ${gone0.length} pieces replaced by ${laid.comps.length} (SW-RPI-23 (c))`);
  }
  return notes;
}

/**
 * SW-RPI-23 (a): a take-off nearer its far end than one elbow spacing. Where a branch passes through itself and its take-off's first point
 * and its far end's first point stand nearer than one elbow spacing on every axis, its fitting, with what stands on its outlet, is moved along
 * the same straight piece of its parent 6 in at a time away from the far end's first point, to the first place from which the branch runs
 * out along the outlet and into its far end's stack with at most two elbows, keeping the generator's margins for a take-off (the fitting's
 * half-length, the parent's elbow radius and 3 in from a corner; two fittings' half-lengths and 2 in apart; a branch flange 3 in from
 * another). The parent's two pipes beside it are cut again.
 */
export function takeOffMoved(m: PipingModel, up: Cx['up'], vb: Cx['vb'], only?: Set<string>): string[] {
  const cx = context(m, up, vb), notes: string[] = [];
  for (const r of lines1(cx, only)) for (const side of ['from', 'to'] as const) {
    if (!r[side].startsWith('tap ') || !ownClashes(r, cx.nozzles).length) continue;
    const pno = r[side].slice(4), Pl = m.lines.find(q => q.no === pno), pc = Pl?.comps ?? [], ti = pc.findIndex(c => c.tag === `${pno}/T:${r.no}`);
    if (!Pl || ti < 0 || !pc[ti].key.startsWith('TEE|')) continue;
    const last = r.path.length - 1, t = side === 'from' ? r.path[0] : r.path[last], f = side === 'from' ? r.path[last] : r.path[0], k6 = elbowSpacing(r.NPS, r.cls), far = Math.max(...[0, 1, 2].map(q => Math.abs(f[q] - t[q])));
    if (far >= k6 - 1e-6) continue;                                                                       // not the cause (a) corrects
    const prevI = pc.slice(0, ti).map(c => c.kind !== 'studs').lastIndexOf(true), nextI = ti + 1 + pc.slice(ti + 1).findIndex(c => c.kind !== 'studs'), tee = pc[ti], pv = pc[prevI], nx = pc[nextI];
    if (pv?.kind !== 'pipe' || nx?.kind !== 'pipe') continue;
    const w = unit(sub(tee.b, tee.a)), out = unit(yAx(tee)), C0 = origin(tee), half = len(sub(tee.b, tee.a)) / 2, toward = dot(sub(f, C0), w);
    if (Math.abs(toward) < 1e-6) continue;
    // the straight of the parent's path the fitting stands on, and the generator's margins along it (as it chooses a take-off)
    const pp = Pl.path, seg = pp.findIndex((p, q) => { if (q + 1 >= pp.length) return false; const ws = unit(sub(pp[q + 1], p)), s = dot(sub(C0, p), ws); return len(cross(sub(C0, p), ws)) < 0.01 && s > 0 && s < len(sub(pp[q + 1], p)); });
    const psp = routedSpan(Pl); if (seg < 0 || !psp) continue;
    const a0 = pp[seg], ws = unit(sub(pp[seg + 1], a0)), L = len(sub(pp[seg + 1], a0)), Rp = elbowRadius(pipeDims(Pl.NPS, Pl.cls).OD);
    const dirA = unit(sub(pp[0], pc[psp[0]].a)), dirB = unit(sub(pp[pp.length - 1], pc[psp[1]].b));
    // at a line's end the pipe runs straight on into its stack, or an elbow takes the corner; at a header's end its cap follows; at a corner within the path an elbow
    const mA = seg !== 0 ? Rp + 3 : Pl.kind === 'header' ? 6 : same(dirA, ws, 1e-6) ? 3 - Rp : Rp + 3, mB = seg !== pp.length - 2 ? Rp + 3 : Pl.kind === 'header' ? 6 : same(dirB, neg(ws), 1e-6) ? 3 - Rp : Rp + 3;
    const sLo = Math.max(0, half + mA), sHi = Math.min(L, L - half - mB), sC = dot(sub(C0, a0), ws), step = -Math.sign(toward) * Math.sign(dot(w, ws)) * 6;
    // the parent's other fittings: its tees, its valve stations (each by its whole stack, from flange to flange, about its middle, with the flange of the branch it
    // serves) and the olets its branches set on it, each with its half-length and its branch's flange as the generator records a take-off
    const flr = designFlange(r.NPS, r.cls).OD / 2, child = (tag: string) => m.lines.find(q => q.no === tag.split('/T:')[1]);
    const kids = m.lines.filter(q => q.no !== r.no && [q.from, q.to].includes(`tap ${pno}`) && !pc.some(c => c.tag === `${pno}/T:${q.no}`) && !q.comps.some(o => o.kind === 'olet' && o.onRun === pno));
    const kidEnd = (q: LineRun) => { const cs = q.comps.filter(c => c.kind !== 'studs'); return q.from === `tap ${pno}` ? cs[0]?.a : cs[cs.length - 1]?.b; };
    const stations = pc.filter(c => c.kind === 'valve' && /VLV\|(TWAY|FWAY)/.test(c.key)).map(v => {
      const g = v.tag.split(':')[0], wv = unit(sub(v.b, v.a)), s = pc.filter(c => c.tag.split(':')[0] === g && c.kind !== 'studs').flatMap(c => [c.a, c.b]).map(p => dot(sub(p, v.a), wv)), lo = Math.min(...s), hi = Math.max(...s), at = add(v.a, wv, (lo + hi) / 2);
      const kid = kids.map(q => ({ q, d: kidEnd(q) ? len(sub(kidEnd(q)!, at)) : Infinity })).sort((x, y) => x.d - y.d)[0];
      return { at, half: (hi - lo) / 2, flR: kid && kid.d < Infinity ? designFlange(kid.q.NPS, kid.q.cls).OD / 2 : 0 };
    });
    const used = [
      ...pc.filter((c, i) => i !== ti && c.kind === 'tee').map(c => { const ch = child(c.tag); return { at: origin(c), half: len(sub(c.b, c.a)) / 2, flR: ch ? designFlange(ch.NPS, ch.cls).OD / 2 : 0 }; }),
      ...stations,
      ...m.lines.flatMap(q => q.comps.filter(o => o.kind === 'olet' && o.onRun === pno)).map(o => ({ at: origin(o), half: smallBore(o.NPS, o.cls).OD / 2 + 2 * smallBore(o.NPS, o.cls).tf + 1, flR: designFlange(o.NPS, o.cls).OD / 2 })),
    ];
    const sp = routedSpan(r); if (!sp) continue;
    const [i0, i1] = sp, Rb = elbowRadius(pipeDims(r.NPS, r.cls).OD), tapStack = side === 'from' ? r.comps.slice(0, i0) : r.comps.slice(i1 + 1);
    let why = 'no place on the same straight of its parent within the generator\'s margins';
    for (let n = 1; n <= 40; n++) {
      const s = sC + step * n; if (s < sLo - 1e-6 || s > sHi + 1e-6) break;
      const shift: V3 = [ws[0] * (s - sC), ws[1] * (s - sC), ws[2] * (s - sC)], C1 = add(C0, shift);
      if (used.some(u => len(sub(u.at, C1)) < Math.max(u.half + half + 2, Math.max(u.half, half) + Math.max(u.flR, flr) + 3) - 1e-6)) continue;
      const nt: Comp = { ...tee, a: add(tee.a, shift), b: add(tee.b, shift), T: moveT(tee.T, C1) };
      const pvL = dot(sub(nt.a, pv.a), unit(sub(pv.b, pv.a))), nxL = dot(sub(nx.b, nt.b), unit(sub(nx.b, nx.a))); if (pvL < 2 - 1e-6 || nxL < 2 - 1e-6) break;
      const npv: Comp = { ...pv, b: nt.a, key: pipeKey(pv, pvL) }, nnx: Comp = { ...nx, a: nt.b, T: moveT(nx.T, nt.b), key: pipeKey(nx, nxL) };
      const pcomps = pc.map((c, i) => (i === ti ? nt : i === prevI ? npv : i === nextI ? nnx : c));
      // the branch: what stands on the outlet moves with the fitting; from there out along the outlet and into the far end's stack
      const tr = (c: Comp): Comp => ({ ...c, a: add(c.a, shift), b: add(c.b, shift), T: moveT(c.T, add(origin(c), shift)) }), moved = tapStack.map(tr);
      const comps0 = side === 'from' ? [...moved, ...r.comps.slice(i0)] : [...r.comps.slice(0, i1 + 1), ...moved];
      const S = side === 'from' ? add(r.comps[i0].a, shift) : r.comps[i0].a, E = side === 'to' ? add(r.comps[i1].b, shift) : r.comps[i1].b;
      const d1 = side === 'from' ? out : unit(sub(r.path[0], S)), d2 = side === 'to' ? neg(out) : neg(unit(sub(r.path[last], E)));
      const pts = fewElbows(S, d1, E, d2); if (!pts) { why = 'no way out along the outlet into the far end\'s stack with at most two elbows'; continue; }
      const laid = layPieces(r.NPS, r.cls, pts, [], endsOf(comps0, i0, i1)); if (!laid) { why = 'a pipe under 2 in at every place'; continue; }
      const spl = spliced(r, comps0, i0, i1, laid.comps), nr = { ...r, comps: spl.comps }, np = { ...Pl, comps: pcomps };
      if (sleeveGone(r, spl.gone)) { why = 'a sleeve through a grating on the pieces it would lay again'; break; }
      const P1 = leadPoint(side === 'from' ? S : E, out, Rb), zones = [C1, P1, f, ...[endFace(cx, r, side === 'from' ? r.to : r.from)].filter((p): p is V3 => !!p)];
      const no = refusal(cx, [nr, np], [...spl.fresh, ...moved, nt, npv, nnx], zones, [...spl.fresh, ...moved], r.path);
      if (no) { why = no; continue; }
      // the branch's path: its first point beyond the moved take-off, its corners, its far end's first point (each kept only where it lies on the leg it belongs to)
      const ends = side === 'from' ? [P1, f] : [f, P1], q = pts.length;
      const path = [segPt(ends[0], pts[0], pts[1]) < 0.01 ? ends[0] : pts[1], ...pts.slice(1, q - 1), segPt(ends[1], pts[q - 2], pts[q - 1]) < 0.01 ? ends[1] : pts[q - 2]].filter((p, i, a) => !i || !same(p, a[i - 1]));
      const oldEnds = [side === 'from' ? r.comps[i0].a : r.comps[i1].b, ...tapStack.flatMap(c => [c.a, c.b])], movedAt = (p: V3) => (oldEnds.some(e => same(e, p)) ? add(p, shift) : p);
      commit(cx, r, spl.comps, spl.gone.filter(c => !tapStack.includes(c)), path, movedAt);
      commit(cx, Pl, pcomps, [tee, pv, nx]);
      const ax = 'xyz'[ws.findIndex(v => Math.abs(v) > 0.5)];
      notes.push(`${r.no}: its take-off's first point stood ${far.toFixed(0)} in from its far end's first point, nearer than the ${k6} in its search needs before a turn; the take-off ${tee.tag} moved ${Math.abs(s - sC).toFixed(0)} in along ${pno} (${ax} ${C0[ws.findIndex(v => Math.abs(v) > 0.5)].toFixed(1)} to ${C1[ws.findIndex(v => Math.abs(v) > 0.5)].toFixed(1)}), the branch laid again out along the outlet with ${pts.length - 2} elbow${pts.length === 3 ? '' : 's'} (path ${path.map(pt).join(' ')}), straights ${fmtLs(laid.straights)} in, and the parent's two pipes beside the fitting cut again (SW-RPI-23 (a))`);
      why = ''; break;
    }
    if (why) notes.push(`${r.no}: its take-off ${tee.tag} not moved: ${why} (SW-RPI-23 (a))`);
    break;
  }
  return notes;
}

/**
 * SW-RPI-23: the corrections of a line through itself, made on the merged model after SW-RPI-14 and before SW-RPI-11 and SW-RPI-10: (d), (b),
 * (c) and (a) in that order, each on the lines SW-RPI-22 then still reports; then each line is measured again, and one still through itself
 * is left and listed. Returns the unit's notes.
 */
export function selfCorrections(m: PipingModel, up: Cx['up'], vb: Cx['vb']): string[] {
  const nozzles = new Map(m.nozzles.map(n => [n.id, n] as const)), found = m.lines.filter(r => r.ok && ownClashes(r, nozzles).length).map(r => r.no);
  if (!found.length) return [];
  const only = new Set(found), notes = [...offsetOverTakeOff(m, up, vb, only), ...straightBetweenStacks(m, up, vb, only), ...bareTurnAsOffset(m, up, vb, only), ...takeOffMoved(m, up, vb, only)];
  { const still = new Set(found.filter(no => ownClashes(m.lines.find(q => q.no === no)!, nozzles).length)); if (still.size) notes.push(...loopThroughLeg(m, up, vb, still)); }   // (e), on the lines (a) to (d) left
  for (const no of found) {
    const r = m.lines.find(q => q.no === no)!, f = ownClashes(r, nozzles);
    if (f.length) notes.push(`${no}: still through itself (${f.map(x => `${x.a} – ${x.b}: ${x.depth.toFixed(2)} in`).join('; ')}); no correction of SW-RPI-23 serves, and it is left as routed (SW-RPI-22 lists it in the unit's checks while it stays so)`);
  }
  return notes;
}
