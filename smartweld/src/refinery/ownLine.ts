/**
 * Plant 3, SW-RPI-22: pieces of one line clear of each other. The generator keeps a line 3 in from every other line but never
 * measures a line against itself; here each line is measured against itself, with the flange and neck of each nozzle it ends at.
 * A piece is held by its true shape: a pipe, reducer or tee's run by its cylinder, a tee's outlet by its stub, a 90° elbow by
 * its arc, a 45° elbow by its own two legs (SW-RPI-13), a flange, gasket, blind or spade by the flange's diameter, a valve by
 * its part's solids; every shape with flat ends, and studs not measured. Not compared: two pieces joined to each other; two
 * with nothing between them but gaskets and a joint's blind; two on one axis whose lengths overlap by no more than 0.05 in.
 * A pair that shares more than 0.05 in is a finding.
 */
import { partFromKey, solidBoxes, type Comp, type LineRun, type NozzleRun, type PipingModel } from '../generator/piping';
import * as K from '../generator/pipingCheck';
import type { V3 } from '../generator/router';
import { pipeDims, elbowRadius, designFlange, teeC } from '../catalogue';

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
