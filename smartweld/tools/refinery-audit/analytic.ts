import { mkdirSync } from 'node:fs';
/**
 * Plant 3 — an INDEPENDENT clash detector, method: analytic geometry.
 *
 * Every piping piece is built from catalogue dimensions as exact convex primitives (pipes as cylinders, elbows as a chain of
 * convex hulls of consecutive cross-section discs of the torus, flanges/gaskets/blinds/caps/reducers/tees as cylinders,
 * frustums and an ellipsoidal dome, stud sets stud by stud with hexagonal nuts); valves, olets, supports, steel, concrete and
 * equipment are fitted from their catalogue meshes component by component (round components as disc-hull chains or as
 * angular sectors when hollow, other components as the convex hull of their vertices or as an oriented box). Everything is
 * brought into the PIPEWAY frame. Broad phase: a spatial hash grid of piece boxes. Narrow phase per convex primitive pair:
 * GJK for intersection, penetration depth = min over directions d of h_A(d) + h_B(-d) (the distance from the origin to the
 * boundary of the Minkowski difference), minimised over candidate axes and refined by a pattern search on the sphere.
 * Contacts are excused ONLY by a named relationship (see relate()); overlaps up to 0.02 in are numeric noise; structural
 * pieces of different structures may also meet at a shared face within 0.05 in.
 *
 * Run: cd /home/user/Refinery/smartweld && MODELS=<dir> [LABEL=run] [PLANT=1] npx vite-node <this file>
 * Writes <this folder>/findings-<LABEL>.json and prints a one-line summary.
 *
 * REVIEWED 2026-11-27 (independent reviewer; every change is marked REVIEW in the code). Blind spots confirmed and fixed:
 *  1. disc support function: a placed normal 0.99999 long (rounded 0.7071 rotations) sent the support point a whole radius out of the disc's
 *     plane along the normal; normalised, and (anti)parallel directions give the centre.
 *  2. tees: the crotch blend's cover stopped low and missed up to k/4 = 0.03 OD of the real tee (0.72 in on a 24 in tee, measured by
 *     SELFTEST2 against the catalogue mesh); now covered over its whole extent (outlet and run sides).
 *  3. valves: fitted on a 40-cell marching grid that lies up to 0.051 in inside the default grid's surface; grown by a margin
 *     0.01 + 0.0035 NPS in (SELFTEST2: no default-grid vertex outside).
 *  4. "support bears on it" excused the WHOLE support against the member once any bearing solid touched it: a stanchion post 5.6 in down in an
 *     equipment pad was hidden. Now per solid: bearing solids, and a hanger's rods through the member its top plate bears on, only.
 *  5. "nozzle on its own equipment" and "line bolted at the equipment's nozzle" excused the whole body, platforms and handrails, buckstays,
 *     lattice towers and pedestals included. Now only the solids the nozzle is set on (touched at its neck's root or its face, never an
 *     attachment of the body).
 *  6. "joined at a shared face" excused any overlap of two joined pieces: a line that turned back through its own elbow and tee (6.3 in) was
 *     hidden. Run pieces (pipe, elbow, tee, reducer, cap, flange, gasket, blind, spade) must now stand on the two sides of their shared face.
 *  7. "stud set through its joint" excused a stud set against any coaxial piece within its length, another stud set included: two stud sets
 *     in the same bolt positions (3.9 in into each other at wafer valves) were hidden. Now only the pieces within its own grip, never studs.
 *  8. "support of its own line" excused a support against its line's valves and flanges (posts 1.25-1.67 in inside valve bodies); now only the
 *     run it carries. "branch outlet on its parent run" likewise only against the parent's run pieces.
 *  9. a body and its own pads/piers were "one structure" at any depth (a pump motor 5.8 in down in its pad); now the body bears on them only
 *     through its bearing solids, as against any other structure.
 * 10. grating cut: the witness point alone excused a pipe too big for its hole; the pipe's whole section must now lie in the cut.
 * 11. a piece lying INSIDE a hollow body's shell touches none of its primitives; a pass now reports pieces within a process shell's bore.
 * 12. PLANT: cases 3-5 go through the relationships like real pieces (a pipeway pipe into a unit spool flange, a shoe sunk into its beam,
 *     a pipe inside a vessel); cases 1-2 bypass them as before. Pieces that cannot be represented are counted, never silently dropped.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cells } from '../../src/refinery/assemble';
import { pipeway, unitToPipeway, PWY } from '../../src/refinery/pipeway';
import { CWM } from '../../src/refinery/coolingWater';
import { framePlaced, type FrameSpec } from '../../src/refinery/supports';
import { partFromKey } from '../../src/generator/piping';
import { buildGeometry } from '../../src/geometry/partGeometry';
import { setMaxCells } from '../../src/geometry/sdf';
import { interiorKit } from '../../src/generator/interiorKit';
import { frameFromAxes, multiply, translate } from '../../src/geometry/transform';
import { regularHexagon } from '../../src/geometry/polygon';
import { grooveDims } from '../../src/catalogue/parts/welds';
import {
  pipeDims, designFlange, elbowRadius, teeC, reducerLength, hexHardware, smallBore, oletHeight, endLength, spadeThickness, sleeveSize, GRATING, makeBlindFlange,
  type PipeClass, type PartSpec,
} from '../../src/catalogue';

const t00 = Date.now();
const HERE = (process.env.AUDIT_OUT ?? 'audit-out') + '/analytic'; mkdirSync(HERE, { recursive: true });
const MODELS = process.env.MODELS ?? '';
const LABEL = process.env.LABEL ?? 'run';
const PLANT = !!process.env.PLANT && process.env.PLANT !== '0';
if (!MODELS || !existsSync(MODELS)) throw new Error(`MODELS (${MODELS}) is not a folder`);
const NOISE = 0.02, FACE = 0.05, JOIN = 0.05;
const log = (...a: unknown[]) => { if (process.env.VERBOSE) console.error(`[${((Date.now() - t00) / 1000).toFixed(1)}s]`, ...a); };

// ================================================================== vectors ==================================================================
type V = number[];
type Mat = number[];
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V, b: V, k = 1): V => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];
const mul = (a: V, k: number): V => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: V) => Math.hypot(a[0], a[1], a[2]);
const unit = (a: V): V => { const l = len(a); return l > 1e-15 ? [a[0] / l, a[1] / l, a[2] / l] : [1, 0, 0]; };
const xf = (T: Mat, p: V): V => [T[0] * p[0] + T[4] * p[1] + T[8] * p[2] + T[12], T[1] * p[0] + T[5] * p[1] + T[9] * p[2] + T[13], T[2] * p[0] + T[6] * p[1] + T[10] * p[2] + T[14]];
const rot = (T: Mat, p: V): V => [T[0] * p[0] + T[4] * p[1] + T[8] * p[2], T[1] * p[0] + T[5] * p[1] + T[9] * p[2], T[2] * p[0] + T[6] * p[1] + T[10] * p[2]];
const IDENT: Mat = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const EX: V = [1, 0, 0], EY: V = [0, 1, 0], EZ: V = [0, 0, 1];
const AXES = [EX, EY, EZ];
/** a transform must be rigid for the primitives to stay exact */
function checkRigid(T: Mat, what: string) {
  const c = [[T[0], T[1], T[2]], [T[4], T[5], T[6]], [T[8], T[9], T[10]]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (Math.abs(dot(c[i], c[j]) - (i === j ? 1 : 0)) > 1e-3) throw new Error(`${what}: transform is not rigid`);
}

// ================================================================ primitives =================================================================
// t: 0 cylinder {c,w,h,r}; 1 hull of two discs {c1,n1,r1,c2,n2,r2}; 2 oriented box {c,u:[3],e}; 3 convex hull of points {v,nrm};
//    4 annular-sector slab (hull of the two end faces) {c,w,u,v,z0,z1,ri0,ro0,ri1,ro1,ca0,sa0,ca1,sa1}; 5 cap = cylinder [0,1] + semi-ellipsoid dome {c,w,R,h}
interface Prim { t: number; lo: V; hi: V; bear?: boolean; [k: string]: any }

function discSup(c: V, n0: V, r: number, d: V): V {
  // REVIEW: the normal is normalised here and a direction (anti)parallel to it gives the centre. With a model's rounded rotation (0.7071) a
  // placed normal is 0.99999 long; the old code then took the tiny residual d - (d.n)n, which lies ALONG n, as an in-plane direction and put
  // the support point a whole radius out of the disc's plane (a 16 in elbow end reached 8 in through its own face)
  const nl = Math.hypot(n0[0], n0[1], n0[2]), n = nl > 0 ? [n0[0] / nl, n0[1] / nl, n0[2] / nl] : n0;
  const dn = dot(d, n), px = d[0] - dn * n[0], py = d[1] - dn * n[1], pz = d[2] - dn * n[2], L = Math.hypot(px, py, pz);
  if (L <= 1e-9 * Math.hypot(d[0], d[1], d[2]) || r === 0) return [c[0], c[1], c[2]];
  const k = r / L; return [c[0] + px * k, c[1] + py * k, c[2] + pz * k];
}
function sup(p: Prim, d: V): V {
  const s0 = sup0(p, d); if (!p.m) return s0;
  const L = Math.hypot(d[0], d[1], d[2]); if (L < 1e-15) return s0; const k = p.m / L; return [s0[0] + d[0] * k, s0[1] + d[1] * k, s0[2] + d[2] * k];
}
function sup0(p: Prim, d: V): V {
  switch (p.t) {
    case 0: { const dw = dot(d, p.w), s = dw >= 0 ? p.h : -p.h; return discSup([p.c[0] + s * p.w[0], p.c[1] + s * p.w[1], p.c[2] + s * p.w[2]], p.w, p.r, d); }
    case 1: { const a = discSup(p.c1, p.n1, p.r1, d), b = discSup(p.c2, p.n2, p.r2, d); return dot(a, d) >= dot(b, d) ? a : b; }
    case 2: { const u = p.u, e = p.e, c = p.c; let x = c[0], y = c[1], z = c[2];
      for (let i = 0; i < 3; i++) { const s = dot(d, u[i]) >= 0 ? e[i] : -e[i]; x += s * u[i][0]; y += s * u[i][1]; z += s * u[i][2]; } return [x, y, z]; }
    case 3: { // vertices kept in the part's own frame (shared by every instance), placed by T
      const v: Float64Array = p.v, T: Mat = p.T, d0 = T[0] * d[0] + T[1] * d[1] + T[2] * d[2], d1 = T[4] * d[0] + T[5] * d[1] + T[6] * d[2], d2 = T[8] * d[0] + T[9] * d[1] + T[10] * d[2];
      let bi = 0, bd = -Infinity; for (let i = 0; i < v.length; i += 3) { const q = v[i] * d0 + v[i + 1] * d1 + v[i + 2] * d2; if (q > bd) { bd = q; bi = i; } }
      return xf(T, [v[bi], v[bi + 1], v[bi + 2]]);
    }
    case 4: {
      const du = dot(d, p.u), dv = dot(d, p.v); let best: V = p.c, bd = -Infinity;
      const inRange = (p.ca0 * dv - p.sa0 * du) >= 0 && (du * p.sa1 - dv * p.ca1) >= 0, L = Math.hypot(du, dv);
      for (const [z, ri, ro] of [[p.z0, p.ri0, p.ro0], [p.z1, p.ri1, p.ro1]]) {
        const base = add(p.c, p.w, z);
        const cand: V[] = [add(add(base, p.u, ro * p.ca0), p.v, ro * p.sa0), add(add(base, p.u, ro * p.ca1), p.v, ro * p.sa1), add(add(base, p.u, ri * p.ca0), p.v, ri * p.sa0), add(add(base, p.u, ri * p.ca1), p.v, ri * p.sa1)];
        if (inRange && L > 1e-12) cand.push(add(add(base, p.u, ro * du / L), p.v, ro * dv / L));
        for (const q of cand) { const s = dot(q, d); if (s > bd) { bd = s; best = q; } }
      }
      return best;
    }
    case 5: {
      const dw = dot(d, p.w), b0 = discSup(p.c, p.w, p.R, d), top = add(p.c, p.w, 1);
      let s1: V;
      if (dw > 0) { const px = sub(d, mul(p.w, dw)), q = Math.sqrt(p.R * p.R * dot(px, px) + p.h * p.h * dw * dw); s1 = q > 1e-12 ? add(add(top, px, p.R * p.R / q), p.w, p.h * p.h * dw / q) : add(top, p.w, p.h); }
      else s1 = discSup(top, p.w, p.R, d);
      return dot(b0, d) >= dot(s1, d) ? b0 : s1;
    }
  }
  throw new Error('bad primitive');
}
function finishPrim(p: Prim): Prim {
  p.lo = [0, 0, 0]; p.hi = [0, 0, 0];
  for (let k = 0; k < 3; k++) { const e = AXES[k]; p.hi[k] = sup(p, e)[k]; p.lo[k] = sup(p, mul(e, -1))[k]; }
  return p;
}
const cyl = (c: V, w: V, h: number, r: number, bear = false): Prim => finishPrim({ t: 0, c, w: unit(w), h, r, lo: [], hi: [], bear });
const dh = (c1: V, n1: V, r1: number, c2: V, n2: V, r2: number, bear = false): Prim => finishPrim({ t: 1, c1, n1: unit(n1), r1, c2, n2: unit(n2), r2, lo: [], hi: [], bear });
const box = (c: V, u: V[], e: V, bear = false): Prim => finishPrim({ t: 2, c, u: u.map(unit), e, lo: [], hi: [], bear });
const poly = (v: Float64Array, nrm: V[], bear = false, T: Mat = IDENT): Prim => finishPrim({ t: 3, v, T, nrm, lo: [], hi: [], bear });
const boxLH = (lo: V, hi: V, bear = false) => box([(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2], [EX, EY, EZ], [(hi[0] - lo[0]) / 2, (hi[1] - lo[1]) / 2, (hi[2] - lo[2]) / 2], bear);
/** a cylinder between two axial stations z0..z1 of an axis through c along w */
const cylZ = (c: V, w: V, z0: number, z1: number, r: number, bear = false) => cyl(add(c, w, (z0 + z1) / 2), w, Math.abs(z1 - z0) / 2, r, bear);

/** a primitive moved by a rigid transform */
function xfPrim(p: Prim, T: Mat): Prim {
  switch (p.t) {
    case 0: return finishPrim({ ...p, c: xf(T, p.c), w: rot(T, p.w) });
    case 1: return finishPrim({ ...p, c1: xf(T, p.c1), n1: rot(T, p.n1), c2: xf(T, p.c2), n2: rot(T, p.n2) });
    case 2: return finishPrim({ ...p, c: xf(T, p.c), u: p.u.map((x: V) => rot(T, x)) });
    case 3: return finishPrim({ ...p, T: multiply(T, p.T) as Mat, nrm: p.nrm.map((x: V) => rot(T, x)) });
    case 4: return finishPrim({ ...p, c: xf(T, p.c), w: rot(T, p.w), u: rot(T, p.u), v: rot(T, p.v) });
    case 5: return finishPrim({ ...p, c: xf(T, p.c), w: rot(T, p.w) });
  }
  throw new Error('bad primitive');
}
/** candidate axes of a primitive (face normals, its axis) and its core points (centre or axis ends) */
function primAxes(p: Prim): V[] {
  switch (p.t) {
    case 0: case 5: return [p.w];
    case 1: { const a = [p.n1]; if (Math.abs(dot(p.n1, p.n2)) < 0.9999) a.push(p.n2); const e = sub(p.c2, p.c1); if (len(e) > 1e-9) a.push(unit(e)); return a; }
    case 2: return p.u;
    case 3: return p.nrm;
    case 4: { const ma = Math.atan2(p.sa0 + p.sa1, p.ca0 + p.ca1); return [p.w, add(mul(p.u, Math.cos(ma)), p.v, Math.sin(ma)), add(mul(p.u, -p.sa0), p.v, p.ca0), add(mul(p.u, -p.sa1), p.v, p.ca1)]; }
  }
  return [];
}
function primCore(p: Prim): V[] {
  switch (p.t) {
    case 0: return [add(p.c, p.w, -p.h), add(p.c, p.w, p.h)];
    case 1: return [p.c1, p.c2];
    case 5: return [p.c, add(p.c, p.w, 1 + p.h)];
    default: return [[(p.lo[0] + p.hi[0]) / 2, (p.lo[1] + p.hi[1]) / 2, (p.lo[2] + p.hi[2]) / 2]];
  }
}

// ====================================================== GJK (intersection / distance) =======================================================
function closestOnSimplex(P: V[]): { v: V; keep: number[] } {
  const n = P.length; let best: V | null = null, bk: number[] = [], bd = Infinity;
  for (let m = 1; m < (1 << n); m++) {
    const S: number[] = []; for (let i = 0; i < n; i++) if (m & (1 << i)) S.push(i);
    let v: V | null = null;
    if (S.length === 1) v = P[S[0]];
    else if (S.length === 2) { const a = P[S[0]], e = sub(P[S[1]], a), ee = dot(e, e); if (ee < 1e-24) continue; const t = -dot(a, e) / ee; if (t < 0 || t > 1) continue; v = add(a, e, t); }
    else if (S.length === 3) {
      const a = P[S[0]], e1 = sub(P[S[1]], a), e2 = sub(P[S[2]], a), g11 = dot(e1, e1), g12 = dot(e1, e2), g22 = dot(e2, e2), r1 = -dot(a, e1), r2 = -dot(a, e2), det = g11 * g22 - g12 * g12;
      if (Math.abs(det) < 1e-18 * Math.max(1, g11 * g22)) continue; const s = (r1 * g22 - r2 * g12) / det, t = (g11 * r2 - g12 * r1) / det;
      if (s < 0 || t < 0 || s + t > 1) continue; v = add(add(a, e1, s), e2, t);
    } else {
      const a = P[S[0]], e1 = sub(P[S[1]], a), e2 = sub(P[S[2]], a), e3 = sub(P[S[3]], a), det = dot(e1, cross(e2, e3));
      if (Math.abs(det) < 1e-18) continue; const r = mul(a, -1);
      const l1 = dot(r, cross(e2, e3)) / det, l2 = dot(e1, cross(r, e3)) / det, l3 = dot(e1, cross(e2, r)) / det;
      if (l1 < 0 || l2 < 0 || l3 < 0 || l1 + l2 + l3 > 1) continue; v = [0, 0, 0];
    }
    const d2 = dot(v!, v!); if (d2 < bd - 1e-15) { bd = d2; best = v; bk = S; }
  }
  if (!best) { // degenerate: fall back to the nearest vertex
    let bi = 0; for (let i = 1; i < n; i++) if (dot(P[i], P[i]) < dot(P[bi], P[bi])) bi = i; return { v: P[bi], keep: [bi] };
  }
  return { v: best, keep: bk };
}
/** GJK on convex primitives: the distance between them, 0 when they intersect. `stopAt`: return early once proven farther apart */
function gjk(A: Prim, B: Prim, stopAt = 0): number {
  const sM = (d: V) => sub(sup(A, d), sup(B, mul(d, -1)));
  let v = sub(primCore(A)[0], primCore(B)[0]); if (len(v) < 1e-9) v = [1, 0, 0];
  let S: V[] = [sM(mul(v, -1))]; v = S[0];
  for (let it = 0; it < 80; it++) {
    const vv = dot(v, v); if (vv < 1e-14) return 0;
    const w = sM(mul(v, -1)), vw = dot(v, w);
    if (vw > 0 && vw * vw > stopAt * stopAt * vv) return vw / Math.sqrt(vv);   // a separating plane: at least this far apart
    if (vv - vw <= 1e-10 * Math.max(1, vv)) return Math.sqrt(vv);     // converged: v is the closest point
    S.push(w); const r = closestOnSimplex(S); S = r.keep.map(i => S[i]); v = r.v;
    if (S.length === 4) return 0;
  }
  return Math.sqrt(dot(v, v));
}

// ========================================================= penetration depth =========================================================
const fOver = (A: Prim, B: Prim, d: V) => dot(sup(A, d), d) - dot(sup(B, mul(d, -1)), d);
function segClosest(p1: V, q1: V, p2: V, q2: V): [V, V] {
  const d1 = sub(q1, p1), d2 = sub(q2, p2), r = sub(p1, p2), a = dot(d1, d1), e = dot(d2, d2), f = dot(d2, r);
  let s = 0, t = 0;
  if (a <= 1e-12 && e <= 1e-12) return [p1, p2];
  if (a <= 1e-12) { t = Math.min(1, Math.max(0, f / e)); }
  else { const c = dot(d1, r); if (e <= 1e-12) { s = Math.min(1, Math.max(0, -c / a)); } else { const b = dot(d1, d2), den = a * e - b * b; s = den > 1e-12 ? Math.min(1, Math.max(0, (b * f - c * e) / den)) : 0; t = (b * s + f) / e; if (t < 0) { t = 0; s = Math.min(1, Math.max(0, -c / a)); } else if (t > 1) { t = 1; s = Math.min(1, Math.max(0, (b - c) / a)); } } }
  return [add(p1, d1, s), add(p2, d2, t)];
}
const coreAB = (P: V[]) => (P.length === 1 ? [P[0], P[0]] : P);
/** depth of overlap of two convex primitives (null when at most `thr`); `at`: a point within the overlap */
function depthOf(A: Prim, B: Prim, thr: number): { depth: number; at: V; d: V } | null {
  const cands: V[] = [EX, EY, EZ];
  const aa = primAxes(A), bb = primAxes(B);
  for (const x of aa) cands.push(x); for (const x of bb) cands.push(x);
  for (const x of aa.slice(0, 4)) for (const y of bb.slice(0, 4)) { const c = cross(x, y); if (len(c) > 1e-6) cands.push(unit(c)); }
  const ca = coreAB(primCore(A)), cb = coreAB(primCore(B)), [qa, qb] = segClosest(ca[0], ca[1], cb[0], cb[1]), dq = sub(qb, qa);
  if (len(dq) > 1e-9) { cands.push(unit(dq)); for (const x of aa.slice(0, 2)) { const c = sub(dq, mul(x, dot(dq, x))); if (len(c) > 1e-9) cands.push(unit(c)); } for (const x of bb.slice(0, 2)) { const c = sub(dq, mul(x, dot(dq, x))); if (len(c) > 1e-9) cands.push(unit(c)); } }
  const dc = sub(primCore(B)[0], primCore(A)[0]); if (len(dc) > 1e-9) cands.push(unit(dc));
  const scored: { d: V; f: number }[] = [];
  for (const c of cands) for (const d of [c, mul(c, -1)]) { const f = fOver(A, B, d); if (f <= thr) return null; scored.push({ d, f }); }
  if (gjk(A, B) > 0) return null;                                  // proven apart
  scored.sort((p, q) => p.f - q.f);
  let best = scored[0];
  const starts = [scored[0]]; for (const s of scored) { if (starts.length >= 3) break; if (starts.every(q => dot(q.d, s.d) < 0.95)) starts.push(s); }
  for (const s0 of starts) {
    let d = s0.d, f = s0.f, step = 0.3;
    while (step > 2e-5) {
      const e1 = unit(Math.abs(d[0]) < 0.9 ? cross(d, EX) : cross(d, EY)), e2 = cross(d, e1); let moved = false;
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7071, 0.7071], [-0.7071, 0.7071], [0.7071, -0.7071], [-0.7071, -0.7071]]) {
        const nd = unit(add(add(d, e1, a * step), e2, b * step)), nf = fOver(A, B, nd);
        if (nf < f - 1e-12) { f = nf; d = nd; moved = true; break; }
      }
      if (!moved) step *= 0.5;
      if (f <= thr) return null;
    }
    if (f < best.f) best = { d, f };
  }
  if (best.f <= thr) return null;
  const pa = sup(A, best.d), pb = sup(B, mul(best.d, -1));
  return { depth: best.f, at: mul(add(pa, pb), 0.5), d: best.d };
}

// ===================================================== generic fit of catalogue meshes =====================================================
interface Mesh { positions: number[] | Float64Array | Float32Array; indices: number[] | Uint32Array }
/** fit one solid's mesh, in its part's own frame: each connected component becomes a convex primitive (or a few) */
function fitMesh(mesh: Mesh, bear: boolean, hollowOK = true): Prim[] {
  const P = mesh.positions, I = mesh.indices, nv = P.length / 3; if (!nv) return [];
  { // the whole solid round about one of its axes (a shell, a ring of bolts, a handwheel): a chain of discs, or sectors where hollow
    const all: V[] = []; for (let i = 0; i < nv; i++) all.push([P[3 * i], P[3 * i + 1], P[3 * i + 2]]);
    const r = roundPrims(all, bear, hollowOK); if (r) return r;
  }
  // weld coincident vertices, then join vertices of each triangle (union-find)
  const canon = new Int32Array(nv), key = new Map<string, number>();
  for (let i = 0; i < nv; i++) { const k = `${Math.round(P[3 * i] * 2e4)},${Math.round(P[3 * i + 1] * 2e4)},${Math.round(P[3 * i + 2] * 2e4)}`; const c = key.get(k); if (c === undefined) { key.set(k, i); canon[i] = i; } else canon[i] = c; }
  const par = new Int32Array(nv); for (let i = 0; i < nv; i++) par[i] = i;
  const find = (x: number): number => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  const uni = (a: number, b: number) => { a = find(a); b = find(b); if (a !== b) par[a] = b; };
  for (let t = 0; t < I.length; t += 3) { const a = canon[I[t]], b = canon[I[t + 1]], c = canon[I[t + 2]]; uni(a, b); uni(b, c); }
  const comps = new Map<number, number[]>();
  for (let i = 0; i < nv; i++) if (canon[i] === i) { const r = find(i); let l = comps.get(r); if (!l) comps.set(r, (l = [])); l.push(i); }
  const triN = new Map<number, V[]>();
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t], b = I[t + 1], c = I[t + 2], pa = [P[3 * a], P[3 * a + 1], P[3 * a + 2]], n = cross(sub([P[3 * b], P[3 * b + 1], P[3 * b + 2]], pa), sub([P[3 * c], P[3 * c + 1], P[3 * c + 2]], pa)), L = len(n);
    if (L < 1e-9) continue; const r = find(canon[a]); let l = triN.get(r); if (!l) triN.set(r, (l = [])); if (l.length < 400) { const u = mul(n, 1 / L); if (!l.some(q => Math.abs(dot(q, u)) > 0.9999)) l.push(u); }
  }
  if (comps.size > 3000) { // too many pieces: the solid's box
    const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity]; for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], P[3 * i + k]); mx[k] = Math.max(mx[k], P[3 * i + k]); }
    return [boxLH(mn, mx, bear)];
  }
  const out: Prim[] = [];
  for (const [r, vs] of comps) out.push(...fitComponent(vs.map(i => [P[3 * i], P[3 * i + 1], P[3 * i + 2]]), triN.get(r) ?? [], bear, hollowOK));
  return out;
}
function fitComponent(vs: V[], nrm: V[], bear: boolean, hollowOK: boolean): Prim[] {
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (const v of vs) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], v[k]); mx[k] = Math.max(mx[k], v[k]); }
  if (vs.length <= 3) return [boxLH(mn, mx, bear)];
  return roundPrims(vs, bear, hollowOK) ?? [poly(hullPoints(vs), nrm.slice(0, 32), bear)];
}
/** points round about a local axis (a polygon of 16 sides or more about it): a chain of disc hulls level by level, or, when
 *  hollow, 24 angular sectors per level span; null when not round */
function roundPrims(vs: V[], bear: boolean, hollowOK: boolean): Prim[] | null {
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (const v of vs) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], v[k]); mx[k] = Math.max(mx[k], v[k]); }
  let bestK = -1, bestRatio = Infinity;
  for (let k = 0; k < 3; k++) {
    const i = (k + 1) % 3, j = (k + 2) % 3, hi = (mx[i] - mn[i]) / 2, hj = (mx[j] - mn[j]) / 2; if (hi < 0.05 || hj < 0.05) continue;
    if (Math.abs(hi - hj) > 0.03 * Math.max(hi, hj)) continue;
    const ci = (mx[i] + mn[i]) / 2, cj = (mx[j] + mn[j]) / 2; let rm = 0; for (const v of vs) rm = Math.max(rm, Math.hypot(v[i] - ci, v[j] - cj));
    const ratio = rm / Math.max(hi, hj); if (ratio <= 1.03 && ratio < bestRatio) { bestRatio = ratio; bestK = k; }
  }
  if (bestK >= 0) {
    const k = bestK, i = (k + 1) % 3, j = (k + 2) % 3, ci = (mx[i] + mn[i]) / 2, cj = (mx[j] + mn[j]) / 2;
    const lv = new Map<number, { z: number; ro: number; ri: number }>();
    for (const v of vs) { const q = Math.round(v[k] * 1e3), r = Math.hypot(v[i] - ci, v[j] - cj); const e = lv.get(q); if (!e) lv.set(q, { z: v[k], ro: r, ri: r }); else { e.ro = Math.max(e.ro, r); e.ri = Math.min(e.ri, r); } }
    const L = [...lv.values()].sort((a, b) => a.z - b.z);
    const roAll = Math.max(...L.map(l => l.ro)), riAll = Math.min(...L.map(l => l.ri));
    const ax = [0, 0, 0]; ax[k] = 1; const eu = [0, 0, 0]; eu[i] = 1; const ev = [0, 0, 0]; ev[j] = 1;
    const c0 = [0, 0, 0]; c0[i] = ci; c0[j] = cj;
    if (L.length === 1) return [cylZ(c0, ax, L[0].z - 0.0005, L[0].z + 0.0005, L[0].ro, bear)];
    const hollow = hollowOK && riAll >= 1.0 && riAll >= 0.4 * roAll;
    const maxSeg = hollow ? 6 : 32, segs: { z0: number; z1: number; ro0: number; ro1: number; ri: number }[] = [];
    if (L.length - 1 <= maxSeg) for (let s = 0; s + 1 < L.length; s++) segs.push({ z0: L[s].z, z1: L[s + 1].z, ro0: L[s].ro, ro1: L[s + 1].ro, ri: Math.min(L[s].ri, L[s + 1].ri) });
    else { const n = maxSeg, per = (L.length - 1) / n; for (let s = 0; s < n; s++) { const a = Math.round(s * per), b = Math.round((s + 1) * per); let ro = 0, ri = Infinity; for (let q = a; q <= b; q++) { ro = Math.max(ro, L[q].ro); ri = Math.min(ri, L[q].ri); } segs.push({ z0: L[a].z, z1: L[b].z, ro0: ro, ro1: ro, ri }); } }
    const out: Prim[] = [];
    for (const s of segs) {
      if (s.z1 - s.z0 < 1e-6) continue;
      if (!hollow) { if (Math.abs(s.ro0 - s.ro1) < 1e-9) out.push(cylZ(c0, ax, s.z0, s.z1, s.ro0, bear)); else out.push(dh(add(c0, ax, s.z0), ax, s.ro0, add(c0, ax, s.z1), ax, s.ro1, bear)); }
      else for (let q = 0; q < 24; q++) { const a0 = (2 * Math.PI * q) / 24, a1 = (2 * Math.PI * (q + 1)) / 24; out.push(finishPrim({ t: 4, c: c0, w: ax, u: eu, v: ev, z0: s.z0, z1: s.z1, ri0: s.ri, ri1: s.ri, ro0: s.ro0, ro1: s.ro1, ca0: Math.cos(a0), sa0: Math.sin(a0), ca1: Math.cos(a1), sa1: Math.sin(a1), lo: [], hi: [], bear })); }
    }
    return out;
  }
  return null;
}
/** the points of a component that matter to its convex hull: all of them when few; else the extreme point in each of 2562
 *  directions (an icosphere): the support function is then within R(1 - cos 2.3 deg) ~ 0.0008 R of the exact hull's */
let ICO: V[] | undefined;
function icosphere(level: number): V[] {
  const t = (1 + Math.sqrt(5)) / 2; let P: V[] = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(unit);
  let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  for (let l = 0; l < level; l++) { const mid = new Map<string, number>(), m = (a: number, b: number) => { const k = a < b ? `${a},${b}` : `${b},${a}`; let i = mid.get(k); if (i === undefined) { i = P.length; P.push(unit(add(P[a], P[b]))); mid.set(k, i); } return i; };
    const nf: number[][] = []; for (const [a, b, c] of F) { const ab = m(a, b), bc = m(b, c), ca = m(c, a); nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); } F = nf; }
  return P;
}
function hullPoints(vs: V[]): Float64Array {
  let keep: V[] = vs;
  if (vs.length > 600) {
    ICO ??= icosphere(4); const idx = new Set<number>();
    for (const d of ICO) { let bi = 0, bd = -Infinity; for (let i = 0; i < vs.length; i++) { const q = vs[i][0] * d[0] + vs[i][1] * d[1] + vs[i][2] * d[2]; if (q > bd) { bd = q; bi = i; } } idx.add(bi); }
    keep = [...idx].map(i => vs[i]);
  }
  const v = new Float64Array(keep.length * 3); keep.forEach((q, n) => { v[3 * n] = q[0]; v[3 * n + 1] = q[1]; v[3 * n + 2] = q[2]; }); return v;
}
const partCache = new WeakMap<object, Prim[]>();
/** a part's primitives in its own frame, fitted from its solids; `bearRe`: solids that bear on what carries the part */
function fitPart(part: PartSpec, bearRe?: RegExp, hollowOK = true): Prim[] {
  let r = partCache.get(part); if (r) return r;
  r = [];
  for (const s of buildGeometry(part).solids) for (const q of fitMesh(s.mesh as unknown as Mesh, !!bearRe && bearRe.test(s.name), hollowOK)) { q.name = s.name; r.push(q); }
  partCache.set(part, r); return r;
}

// =============================================== analytic piping pieces from catalogue dimensions ===============================================
const keyCache = new Map<string, Prim[]>();
let genericMs = 0, genericN = 0;
// KEYCACHE=<file> (development aid only): the fitted primitives of generic parts (valves) kept between runs
const KEYCACHE = process.env.KEYCACHE, keyCacheLoaded = !!KEYCACHE && existsSync(KEYCACHE);
if (keyCacheLoaded) for (const [k, prs] of Object.entries(JSON.parse(readFileSync(KEYCACHE!, 'utf8')) as Record<string, Prim[]>)) keyCache.set(k, prs.map(r => (r.t === 3 ? { ...r, v: Float64Array.from(r.v as unknown as number[]) } : r)));
const saveKeyCache = () => { if (KEYCACHE && !keyCacheLoaded) writeFileSync(KEYCACHE, JSON.stringify(Object.fromEntries([...keyCache].filter(([k]) => k.startsWith('VLV')).map(([k, prs]) => [k, prs.map(r => (r.t === 3 ? { ...r, v: [...r.v] } : r))])))); };
const SUPPORT_BEAR = /shoe base|guide angle|base plate|anchor rods|top plate/;
/** the solids a body stands on (legs, saddles' bases, base plates, skids, feet, anchor bolts): their contacts with what carries it are its bearing */
const EQUIP_BEAR = /^column W|(^|: )legs?\b|saddle base|base ?plate|baseplate|base ring|base PL|^skid|feet|foot\b|anchor|holding-down|pedestal|chairs?\b|support columns|stair stringers?/i;
/** the convex primitives of a piping, weld or support part in its own frame, from its key */
function keyPrims(key: string): Prim[] {
  let r = keyCache.get(key); if (r) return r;
  const a = key.split('|'), n = (i: number) => Number(a[i]), c = (i: number) => a[i] as PipeClass, O: V = [0, 0, 0];
  r = [];
  switch (a[0]) {
    case 'PIPE': r.push(cylZ(O, EZ, 0, n(3), pipeDims(n(1), c(2)).OD / 2)); break;
    case 'EL': {
      const OD = pipeDims(n(1), c(2)).OD, R = elbowRadius(OD), ro = OD / 2, ang = (n(3) * Math.PI) / 180;
      const dA = 2 * Math.acos(1 - 0.01 / (R + ro)), N = Math.max(6, Math.ceil(ang / dA));
      const pt = (t: number): V => [R - R * Math.cos(t), 0, R * Math.sin(t)], tg = (t: number): V => [Math.sin(t), 0, Math.cos(t)];
      for (let s = 0; s < N; s++) { const t0 = (ang * s) / N, t1 = (ang * (s + 1)) / N; r.push(dh(pt(t0), tg(t0), ro, pt(t1), tg(t1), ro)); }
      break;
    }
    case 'TEE': { // run and outlet cylinders; the blended crotch (smooth union of radius k, SW-FIT-2) adds at most k/4 about the outlet's root
      const p = pipeDims(n(1), c(2)), q = pipeDims(n(3), c(2)), C = teeC(p.OD), k = Math.max(0.1, 0.12 * q.OD), R = p.OD / 2, ro = q.OD / 2, kb = k / 4, reach = ro + 1.25 * k;
      r.push(cylZ(O, EZ, -C, C, R), cylZ(O, EY, 0, C, ro));
      // the smooth union adds material only where a point is within k/4 of one cylinder and within k of the other (polynomial smin):
      // (1) about the outlet: radius ro + k/4, from k/4 below the run's axis to 1.25 k above the run's top
      r.push(cylZ(O, EY, -kb, Math.min(C, R + 1.25 * k), ro + kb));
      // (2) about the run: a shell R..R + k/4 over the run's angles within reach of the outlet (|x| <= ro + 1.25 k, y >= -1.25 k), |z| <= ro + 1.25 k
      const th0 = reach >= R ? -Math.asin(Math.min(1, (1.25 * k) / R)) : Math.acos(reach / R), th1 = Math.PI - th0, nS = Math.max(1, Math.ceil((th1 - th0) / (Math.PI / 12))), zr = Math.min(C, reach);
      for (let q2 = 0; q2 < nS; q2++) { const a0 = th0 + ((th1 - th0) * q2) / nS, a1 = th0 + ((th1 - th0) * (q2 + 1)) / nS; r.push(finishPrim({ t: 4, c: [0, 0, 0], w: EZ, u: EX, v: EY, z0: -zr, z1: zr, ri0: R - 0.001, ri1: R - 0.001, ro0: R + kb, ro1: R + kb, ca0: Math.cos(a0), sa0: Math.sin(a0), ca1: Math.cos(a1), sa1: Math.sin(a1), lo: [], hi: [] })); }
      break;
    }
    case 'RED': case 'REDE': {
      const A = pipeDims(n(1), c(3)), B = pipeDims(n(2), c(3)), H = reducerLength(A.OD, B.OD), flat = a[0] === 'REDE' ? a[4] : 'none';
      const dyE = flat === 'none' ? 0 : (flat === 'bottom' ? 1 : -1) * (A.OD / 2 - B.OD / 2);
      r.push(cylZ(O, EZ, 0, 1, A.OD / 2), dh([0, 0, 1], EZ, A.OD / 2, [0, dyE, H - 1], EZ, B.OD / 2), cylZ([0, dyE, 0], EZ, H - 1, H, B.OD / 2)); break;
    }
    case 'CAP': { const OD = pipeDims(n(1), c(2)).OD; r.push(finishPrim({ t: 5, c: [0, 0, 0], w: EZ, R: OD / 2, h: OD / 4, lo: [], hi: [] })); break; }
    case 'WNF': { const f = designFlange(n(1), c(2)); r.push(cylZ(O, EZ, -f.rfH, 0, f.rfOD / 2), cylZ(O, EZ, 0, f.tf, f.OD / 2), dh([0, 0, f.tf], EZ, f.bore / 2 + f.hubT, [0, 0, f.tf + f.hubLen], EZ, f.bore / 2 + f.pipeT), cylZ(O, EZ, f.tf + f.hubLen, f.tf + f.hubLen + f.neckLen, f.bore / 2 + f.pipeT)); break; }
    case 'SOF': { const f = designFlange(n(1), c(2)), sb = smallBore(n(1), c(2)), hub = 0.75 * f.tf, ro = sb.OD / 2 + sb.tf; r.push(cylZ(O, EZ, -f.rfH, 0, f.rfOD / 2), cylZ(O, EZ, 0, f.tf, f.OD / 2), cylZ(O, EZ, f.tf, f.tf + hub, ro)); break; }
    case 'BLIND': { const f = designFlange(n(1), c(2)), tb = makeBlindFlange('x', n(1), c(2)).dims.tb.value; r.push(cylZ(O, EZ, -f.rfH, 0, f.rfOD / 2), cylZ(O, EZ, 0, tb, f.OD / 2)); break; }
    case 'GSK': { const f = designFlange(n(1), c(2)); r.push(cylZ(O, EZ, 0, f.gasketT, f.gasketID / 2 + f.wg)); break; }
    case 'STUDS': {
      const f = designFlange(n(1), c(2)), stack = n(3), h = hexHardware(f.d), L = f.studLen + Math.max(0, stack - (2 * (f.tf + f.rfH) + f.gasketT)), hex = regularHexagon(h.F);
      for (let i = 0; i < f.n; i++) {
        const ang = (2 * Math.PI * (i + 0.5)) / f.n, x = (f.BC / 2) * Math.cos(ang), y = (f.BC / 2) * Math.sin(ang);
        r.push(cylZ([x, y, 0], EZ, -L / 2, L / 2, f.d / 2));
        for (const z0 of [stack / 2, -stack / 2 - h.nutH]) { const v = new Float64Array(36); hex.forEach((q, m) => { v.set([x + q.x, y + q.y, z0], 3 * m); v.set([x + q.x, y + q.y, z0 + h.nutH], 18 + 3 * m); }); const nr: V[] = [EZ]; for (let m = 0; m < 3; m++) { const t = (Math.PI / 3) * m; nr.push([Math.cos(t), Math.sin(t), 0]); } r.push(poly(v, nr)); }
      }
      break;
    }
    case 'OLET': {
      const run = smallBore(n(1), c(3)), br = smallBore(n(2), c(3)), end = a[4] as 'BW' | 'SW' | 'TH', H = oletHeight(run, br, end), ro = br.OD / 2 + br.tf, Rr = run.OD / 2;
      const yBase = Math.sqrt(Math.max(0, Rr * Rr - (ro + br.tf) ** 2)); void endLength;
      r.push(dh([0, yBase, 0], EY, ro + br.tf, [0, yBase + 2 * br.tf, 0], EY, ro), cylZ(O, EY, yBase + 2 * br.tf, H, ro)); break;
    }
    case 'SPADE': { const f = designFlange(n(1), c(2)), t = spadeThickness(f), Rd = (f.BC - f.d) / 2, hEnd = f.OD / 2 + 2; r.push(cylZ(O, EZ, -t / 2, t / 2, Rd), boxLH([-1, Rd - 0.5, -t / 2], [1, hEnd, t / 2])); break; }
    case 'SPEC': { const f = designFlange(n(1), c(2)), t = spadeThickness(f), Rd = (f.BC - f.d) / 2, pitch = 2 * Rd + 1; r.push(cylZ(O, EZ, -t / 2, t / 2, Rd), cylZ([0, -pitch, 0], EZ, -t / 2, t / 2, Rd), boxLH([-1, -pitch + Rd - 0.5, -t / 2], [1, -Rd + 0.5, t / 2])); break; }
    case 'FSLV': { const sp = pipeDims(sleeveSize(pipeDims(n(1), c(2)).OD), 'P150'), z0 = -(GRATING.barDepth + 1); r.push(cylZ(O, EZ, z0, 2, sp.OD / 2), cylZ(O, EZ, 0, 0.25, sp.OD / 2 + 2)); break; }
    case 'BW': { const p = pipeDims(n(1), c(2)), g = grooveDims(p.t); r.push(cylZ(O, EZ, -g.topWidth / 2, g.topWidth / 2, p.OD / 2 + g.cap)); break; }
    case 'FWR': { const rr = n(1), w = n(2); r.push(dh([0, 0, 0], EZ, rr + w, [0, 0, w], EZ, rr)); break; }
    case 'SHOE': case 'STAN': case 'HANG': case 'TRUN': case 'TRAP': r = fitPart(partFromKey(key), SUPPORT_BEAR); break;
    default: {                                                       // valves and anything else: fitted from the catalogue part's own solids
      const t0 = Date.now();
      if (a[0] === 'VLV') setMaxCells(40);                             // the cast bodies' marching grid: their extents agree with the default grid's to 0.12 in
      try { r = fitPart(partFromKey(key), undefined, a[0] !== 'VLV'); } finally { setMaxCells(110); }   // a valve's bore is its own line's: its round parts solid
      // REVIEW: the 40-cell grid lies up to 0.051 in inside the default grid's surface (SELFTEST2 on 37 valve keys: 0.011 at 3 in, 0.019 at 6 in,
      // 0.043 at 12 in, 0.051 at 20 in); each valve primitive is grown by a margin above that bound, so no valve is smaller than the model's own part
      if (a[0] === 'VLV') { const m = 0.01 + 0.0035 * n(2); r = r.map(q => finishPrim({ ...q, m })); }
      genericMs += Date.now() - t0; genericN++;
    }
  }
  keyCache.set(key, r); return r;
}

// ================================================================= self-test =================================================================
if (process.env.SELFTEST) {
  // 1. the analytic pieces against the catalogue's own meshes: the boxes must agree
  const keys = ['PIPE|8|P300|30.000', 'EL|8|P300|90', 'EL|20|P150|45', 'TEE|6|P150|6', 'TEE|4|P150|3', 'RED|8|6|P300', 'REDE|8|6|P300|top', 'REDE|14|12|P150|bottom', 'CAP|12|P150', 'WNF|20|P150', 'SOF|8|P150', 'BLIND|6|P300', 'GSK|8|P300',
    'STUDS|8|P300|3.500', 'OLET|10|3|P300|BW', 'SPADE|6|P300', 'SPEC|8|P300', 'FSLV|3|P150', 'BW|8|P300', 'SHOE|8|P300|guide|8.000', 'VLV|GATE|8|P150'];
  for (const k of keys) {
    const pr = keyPrims(k), lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const q of pr) for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], q.lo[i]); hi[i] = Math.max(hi[i], q.hi[i]); }
    const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    for (const s of buildGeometry(partFromKey(k)).solids) { const P = s.mesh.positions; for (let i = 0; i < P.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], P[i + a]); mx[a] = Math.max(mx[a], P[i + a]); } }
    const err = Math.max(...[0, 1, 2].map(i => Math.max(Math.abs(lo[i] - mn[i]), Math.abs(hi[i] - mx[i]))));
    console.log(`${k.padEnd(28)} prims ${String(pr.length).padStart(4)}  analytic ${lo.map(v => v.toFixed(3))}..${hi.map(v => v.toFixed(3))}  mesh ${mn.map(v => v.toFixed(3))}..${mx.map(v => v.toFixed(3))}  max diff ${err.toFixed(3)}`);
  }
  // 2. depths of known overlaps
  const A = cyl([0, 0, 0], EX, 50, 3), B = cyl([0, 5, 0], EZ, 50, 4);            // crossing at right angles, 2 in deep
  const C = boxLH([-10, -10, -10], [10, 10, 10]), D = cyl([0, 0, 11.5], EX, 30, 3); // a pipe 1.5 in into a box's face
  const E = cyl([0, 0, 0], EX, 50, 3), F2 = cyl([0, 6.5, 0], EX, 50, 3);            // parallel, 0.5 in apart
  const keyEl = keyPrims('EL|8|P300|90'), pipeIn = cyl([12, 0, 4], EY, 20, 2);       // a 4 in pipe through the elbow's bend
  console.log('cross 2 in:', depthOf(A, B, 0)?.depth.toFixed(4), ' box face 1.5 in:', depthOf(C, D, 0)?.depth.toFixed(4), ' apart:', depthOf(E, F2, 0), gjk(E, F2).toFixed(4),
    ' elbow x pipe:', Math.max(...keyEl.map(q => depthOf(q, pipeIn, 0)?.depth ?? 0)).toFixed(3));
  process.exit(0);
}
// SELFTEST2=1 (reviewer's check): is every vertex of the catalogue's own mesh (default grid) inside the analytic primitives? A part
// reduced to a shape smaller than the real part shows here as vertices outside its primitives.
if (process.env.SELFTEST2) {
  const keys = new Map<string, number>();
  for (const f of ['pipeway', 'cooling-water', 'unit-11', 'unit-12', 'unit-13', 'unit-14', 'unit-15', 'unit-16', 'unit-17', 'unit-18', 'unit-19']) {
    const M = JSON.parse(readFileSync(join(MODELS, `${f}.json`), 'utf8'));
    const put = (k: string) => keys.set(k, (keys.get(k) ?? 0) + 1);
    for (const l of M.lines) { for (const c of [...l.comps, ...(l.pens ?? [])]) if (c.kind !== 'pipe' && c.kind !== 'nipple') put(c.key); for (const s of l.supports) put(s.key); for (const w of l.welds) put(w.key); }
    for (const n of M.nozzles) for (const c of n.comps) if (c.kind !== 'pipe') put(c.key);
  }
  const only = process.env.SELFTEST2_RE ? new RegExp(process.env.SELFTEST2_RE) : undefined, skipVLV = !process.env.SELFTEST2_VLV;
  const byPre = new Map<string, { n: number; worst: number; key: string; solid: string }>(); const bad: string[] = [];
  let done = 0; const maxN = Number(process.env.SELFTEST2_MAX ?? 1e9);
  for (const k of keys.keys()) {
    if (only && !only.test(k)) continue; if (done >= maxN) break;
    if (skipVLV && k.startsWith('VLV')) continue;
    const pr = keyPrims(k); let worst = 0, wsol = '';
    for (const s of buildGeometry(partFromKey(k)).solids) {
      const P = s.mesh.positions;
      for (let i = 0; i < P.length; i += 3) {
        const v: V = [P[i], P[i + 1], P[i + 2]]; let dmin = Infinity;
        for (const q of pr) { if (v[0] < q.lo[0] - dmin || v[0] > q.hi[0] + dmin || v[1] < q.lo[1] - dmin || v[1] > q.hi[1] + dmin || v[2] < q.lo[2] - dmin || v[2] > q.hi[2] + dmin) continue; const d = gjk(cyl(v, EZ, 0, 0), q); if (d < dmin) dmin = d; if (dmin <= 1e-6) break; }
        if (dmin > worst) { worst = dmin; wsol = s.name; }
      }
    }
    const pre = k.split('|')[0], e = byPre.get(pre) ?? { n: 0, worst: 0, key: '', solid: '' }; e.n++; if (worst > e.worst) { e.worst = worst; e.key = k; e.solid = wsol; } byPre.set(pre, e);
    if (worst > 0.01) bad.push(`${k} solid "${wsol}" vertex ${worst.toFixed(3)} in outside`);
    if (++done % 200 === 0) log('selftest2', done);
  }
  for (const [p, e] of byPre) console.log(`${p.padEnd(6)} keys ${String(e.n).padStart(5)}  worst vertex outside the analytic shape ${e.worst.toFixed(4)} in  (${e.key} "${e.solid}")`);
  console.log(`${bad.length} keys with a mesh vertex more than 0.01 in outside:`); for (const b of bad.slice(0, 80)) console.log('  ', b);
  process.exit(0);
}

// ==================================================================== pieces ====================================================================
type Cat = 'pipe' | 'sup' | 'steel' | 'conc' | 'equip';
interface Port { p: V; d: V }
interface Piece {
  id: number; model: string; line: string; tag: string; kind: string; cat: Cat; prims: Prim[]; lo: V; hi: V;
  lk?: string; ports?: Port[]; ax?: { p: V; d: V; s0: number; s1: number }; studs?: boolean; pen?: boolean; onRun?: string; joins?: string[];
  nozzleOf?: string; atEquip?: Set<string>; struct?: string; equip?: string; grating?: boolean; planted?: boolean;
  /** REVIEW: the nozzle a nozzle piece belongs to; the nozzles a line's piece is bolted at; a pipe's insertion at its two ends */
  nz?: NzRec; atNz?: NzRec[]; ins?: [number, number]; plantedRel?: boolean; grip?: number;
}
/** an equipment nozzle in the pipeway frame: its face, outward direction, the inner end of its neck and the radii of the discs there */
interface NzRec { id: string; model: string; equip: string; face: V; u: V; inner: V; rIn: number; rFace: number }
const pieces: Piece[] = [];
const dropped: string[] = [];   // REVIEW: pieces that could not be represented (no solids, or a non-finite primitive): listed, never silently lost
function addPiece(p: Omit<Piece, 'id' | 'lo' | 'hi'>): Piece | undefined {
  if (!p.prims.length) { dropped.push(`${p.model} ${p.tag} ${p.kind}: no solids`); return undefined; }
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const q of p.prims) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], q.lo[k]); hi[k] = Math.max(hi[k], q.hi[k]); }
  if (![...lo, ...hi].every(Number.isFinite)) { dropped.push(`${p.model} ${p.tag} ${p.kind}: non-finite primitive`); return undefined; }
  const pc = { ...p, id: pieces.length, lo, hi } as Piece; pieces.push(pc); return pc;
}
const placePrims = (local: Prim[], T: Mat) => local.map(q => xfPrim(q, T));

// ---- the models (lines, nozzles) ----
interface Comp { tag: string; kind: string; key: string; T: Mat; a: V; b: V; NPS: number; cls: PipeClass; ins?: [number, number]; onRun?: string }
interface Model { lines: { no: string; kind: string; from: string; to: string; comps: Comp[]; supports: { id: string; line: string; type: string; at: V; key: string; T: Mat }[]; welds: { id: string; key: string; T: Mat; joins: [string, string]; at: V; dir: V }[]; pens?: Comp[]; side?: Comp[] }[]; nozzles: { id: string; equip: string; face: V; u: V; comps: Comp[]; welds?: { id: string; key: string; T: Mat; joins: [string, string] }[] }[]; cuts?: { x: number; y: number; z: number; r: number }[] }
const readJson = (f: string) => JSON.parse(readFileSync(join(MODELS, f), 'utf8'));
// the pipeway's own steel: from pipeway() (about 2 minutes); PWCACHE=<file> keeps the fitted pieces between development runs only
const PWCACHE = process.env.PWCACHE;
type PWPiece = { line: string; tag: string; kind: string; cat: Cat; struct: string; prims: Prim[]; grating: boolean };
let pwSteel: PWPiece[] | undefined;
if (PWCACHE && existsSync(PWCACHE)) pwSteel = (JSON.parse(readFileSync(PWCACHE, 'utf8')) as PWPiece[]).map(q => ({ ...q, prims: q.prims.map(r => (r.t === 3 ? { ...r, v: Float64Array.from(r.v as unknown as number[]) } : r)) }));
const PW = pwSteel ? undefined : pipeway();                         // first, at the catalogue's default meshes (its own steel is all that is taken from it)
log('pipeway() done', pwSteel ? '(from the development cache)' : '');
const site = cells();
const unitCells = new Map(site.filter(c => c.plot.kind === 'unit').map(c => [c.plot.unit, c]));
const MODEL_T = new Map<string, Mat>();
for (const u of [11, 12, 13, 14, 15, 16, 17, 18, 19]) { const c = unitCells.get(u)!; MODEL_T.set(`unit-${u}`, unitToPipeway(c.plot, c.cell) as Mat); }
MODEL_T.set('pipeway', IDENT);
MODEL_T.set('cooling-water', translate(0, 0, CWM.way) as Mat);
for (const [m, T] of MODEL_T) checkRigid(T, m);
const models = new Map<string, Model>();
for (const m of MODEL_T.keys()) models.set(m, readJson(`${m}.json`));
log('models read');

/** the ports of a piping piece (its connection faces) in the pipeway frame */
function portsOf(c: Comp, T: Mat): Port[] {
  const a = xf(T, c.a), b = xf(T, c.b), Tc = c.T, zl: V = rot(T, [Tc[8], Tc[9], Tc[10]]), yl: V = rot(T, [Tc[4], Tc[5], Tc[6]]);
  if (c.kind === 'elbow') { const ang = (Number(c.key.split('|')[3]) * Math.PI) / 180, tz = rot(T, rot(Tc, [Math.sin(ang), 0, Math.cos(ang)])); return [{ p: a, d: zl }, { p: b, d: tz }]; }
  const ab = sub(b, a), d = len(ab) > 1e-6 ? unit(ab) : zl, out: Port[] = [{ p: a, d }, { p: b, d }];
  if (c.kind === 'tee') { const k = c.key.split('|'), C = teeC(pipeDims(Number(k[1]), k[2] as PipeClass).OD); out.push({ p: xf(T, xf(Tc, [0, C, 0])), d: yl }); }
  return out;
}
const rigid = (T: Mat) => { const c = [[T[0], T[1], T[2]], [T[4], T[5], T[6]], [T[8], T[9], T[10]]]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (Math.abs(dot(c[i], c[j]) - (i === j ? 1 : 0)) > 1e-3) return false; return true; };
let skewPipes = 0, skewWelds = 0;
function addComp(model: string, line: string, c: Comp, T: Mat, extra: Partial<Piece> = {}) {
  const W = multiply(T, c.T) as Mat;
  const a = xf(T, c.a), b = xf(T, c.b), ab = sub(b, a);
  let prims: Prim[];
  if (c.kind === 'pipe' || c.kind === 'nipple') {   // a pipe is OD along a..b, with any insertion into a socket or slip-on bore beyond its ends
    const w = unit(ab), i0 = c.ins?.[0] ?? 0, i1 = c.ins?.[1] ?? 0, k = c.key.split('|'), OD = pipeDims(Number(k[1]), k[2] as PipeClass).OD, s0 = add(a, w, -i0), s1 = add(b, w, i1);
    prims = [cyl(mul(add(s0, s1), 0.5), w, len(sub(s1, s0)) / 2, OD / 2)];
    if (!rigid(c.T)) skewPipes++;
  } else { checkRigid(W, c.tag); prims = placePrims(keyPrims(c.key), W); }
  const ports = portsOf(c, T); portIndex.set(`${model}|${c.tag}`, ports);
  return addPiece({ model, line, tag: c.tag, kind: c.kind, cat: 'pipe', prims, lk: `${model}|${line}`, ports,
    ax: { p: a, d: len(ab) > 1e-6 ? unit(ab) : rot(W, EZ), s0: 0, s1: len(ab) }, studs: c.kind === 'studs', grip: c.kind === 'studs' ? Number(c.key.split('|')[3]) : undefined, onRun: c.onRun, ins: c.ins, ...extra });
}
/** a weld ring, square to the joint it makes: its axis is the joined pieces' port direction at the weld (the model's own weld
 *  records give a chord direction at an elbow's end and a skewed frame at 45 deg and vertical joints; counted, see stats) */
const portIndex = new Map<string, Port[]>();   // model|tag -> ports
function weldPrims(w: { key: string; T: Mat; at: V; dir: V; joins?: string[] }, T: Mat, model: string): Prim[] {
  const at = xf(T, w.at), rz = unit(rot(T, rigid(w.T) ? [w.T[8], w.T[9], w.T[10]] : w.dir)); let z = rz;
  // the joint's axis from a joined piece's port at the weld; the record's sense kept (a fillet ring stands on one side of its plane)
  found: for (const t of w.joins ?? []) for (const pt of portIndex.get(`${model}|${t}`) ?? []) if (len(sub(pt.p, at)) <= JOIN) { if (Math.abs(dot(pt.d, rz)) < 0.999) weldDirFixed++; z = dot(pt.d, rz) >= 0 ? pt.d : mul(pt.d, -1); break found; }
  if (!rigid(w.T)) skewWelds++;
  const y = Math.abs(z[1]) < 0.9 ? EY : EX, F = frameFromAxes(at as never, unit(sub(y, mul(z, dot(y, z)))) as never, z as never) as Mat;
  return placePrims(keyPrims(w.key), F);
}
let weldDirFixed = 0;
let nComp = 0, nSup = 0, nWeld = 0;
const nozzleFaces: { model: string; p: V; d: V; equip: string; rec: NzRec }[] = [];
for (const [model, M] of models) {
  const T = MODEL_T.get(model)!;
  for (const l of M.lines) {
    for (const c of [...l.comps, ...(l.side ?? [])]) { addComp(model, l.no, c, T); nComp++; }
    for (const c of l.pens ?? []) { addComp(model, l.no, c, T, { pen: true }); nComp++; }
  }
  for (const nz of M.nozzles) for (const c of nz.comps) portIndex.set(`${model}|${c.tag}`, portsOf(c, T));
  for (const l of M.lines) {
    for (const w of l.welds) { addPiece({ model, line: l.no, tag: w.id, kind: 'weld', cat: 'pipe', prims: weldPrims(w, T, model), lk: `${model}|${l.no}`, joins: w.joins }); nWeld++; }
    for (const s of l.supports) { const W = multiply(T, s.T) as Mat; checkRigid(W, s.id); addPiece({ model, line: s.line, tag: s.id, kind: s.type, cat: 'sup', prims: placePrims(keyPrims(s.key), W), lk: `${model}|${s.line}` }); nSup++; }
  }
  for (const nz of M.nozzles) {
    // REVIEW: the nozzle's own record: its neck's inner end is the comp end farthest behind the face (into the body)
    const face = xf(T, nz.face), u = unit(rot(T, nz.u)), nzA = nz as unknown as { NPS: number; cls: PipeClass };
    let inner = face, back = -Infinity; for (const c of nz.comps) for (const q of [c.a, c.b]) { const P = xf(T, q), s2 = dot(sub(face, P), u); if (s2 > back) { back = s2; inner = P; } }
    const rec: NzRec = { id: nz.id, model, equip: nz.equip, face, u, inner, rIn: pipeDims(nzA.NPS, nzA.cls).OD / 2, rFace: designFlange(nzA.NPS, nzA.cls).OD / 2 };
    for (const c of nz.comps) { addComp(model, nz.id, c, T, { nozzleOf: nz.equip, nz: rec }); nComp++; }
    for (const w of nz.welds ?? []) { addPiece({ model, line: nz.id, tag: w.id, kind: 'weld', cat: 'pipe', prims: weldPrims(w as never, T, model), lk: `${model}|${nz.id}`, joins: w.joins, nozzleOf: nz.equip, nz: rec }); nWeld++; }
    nozzleFaces.push({ model, p: face, d: u, equip: nz.equip, rec });
  }
}
log('piping pieces', pieces.length, `(${genericN} parts fitted from catalogue meshes in ${(genericMs / 1000).toFixed(1)} s)`);

// ---- steel, concrete and equipment of the unit cells (authoritative for each unit's own steel) ----
const EQTAG = /^[A-Z]{1,3}-\d{3,5}[A-Z]?$/;
let nStruct = 0;
function structOf(prefix: string, tags: string[]): string {
  if (tags.some(t => t.startsWith('rack'))) return `${prefix}:rack`;
  if (EQTAG.test(tags[0])) return `${prefix}:${tags[0]}`;
  for (const t of ['cooler-deck', 'yard-support']) if (tags.includes(t)) return `${prefix}:${t}`;
  const j = tags.find(t => /^[A-Z]{1,3}-\d{3,5}[A-Z]?-(deck|stair)$/.test(t)); if (j) return `${prefix}:${j.replace(/-(deck|stair)$/, '')} structure`;   // SW-CELL-4: a body's elevated structure, its deck and stair one kit
  const j2 = tags.find(t => /^[A-Z]{1,3}-\d{3,5}[A-Z]?-/.test(t)); if (j2) return `${prefix}:${j2}`;
  return `${prefix}:${tags.join('/')}`;
}
const catOf = (part: PartSpec, tags: string[]): Cat => (tags.includes('equipment') ? 'equip' : part.category === 'civil' || part.kind === 'CONCRETE' || ['FOOTING', 'PEDESTAL', 'PAD', 'SLAB', 'PIER', 'GRADE_BEAM', 'GROUT', 'CURB', 'PAVING', 'TRENCH', 'SUMP', 'PIT', 'BASIN', 'SLEEPER'].includes(part.kind) ? 'conc' : 'steel');
function addPlaced(model: string, prefix: string, pl: { part: PartSpec; transform: Mat; tags: string[] }, T: Mat, struct?: string, line?: string, tag?: string) {
  if (pl.tags.includes('keep-out')) return;
  const W = multiply(T, pl.transform) as Mat; checkRigid(W, pl.tags.join('/'));
  const cat = catOf(pl.part, pl.tags), st = struct ?? structOf(prefix, pl.tags);
  addPiece({ model, line: line ?? st.split(':').slice(1).join(':'), tag: tag ?? pl.tags.join('/'), kind: `${cat === 'equip' ? 'equipment' : cat === 'conc' ? 'concrete' : 'steel'}:${pl.part.kind}`, cat, prims: placePrims(fitPart(pl.part, cat === 'equip' ? EQUIP_BEAR : undefined), W), struct: st, equip: cat === 'equip' ? pl.tags[0] : undefined, grating: /GRATING/.test(pl.part.kind) });
  nStruct++;
}
const spotParts = new Map<string, string>();   // a part's tag -> the tag of the body it belongs to (SW-CELL: a body made of several parts)
for (const { plot, cell } of site) {
  const model = plot.kind === 'unit' ? `unit-${plot.unit}` : `unit-${plot.unit}-${plot.id}`, prefix = model, T = unitToPipeway(plot, cell) as Mat; checkRigid(T, model);
  for (const sp of cell.spots) for (const t of sp.parts ?? []) if (t !== sp.tag) spotParts.set(`${prefix}:${t}`, `${prefix}:${sp.tag}`);
  for (const pl of cell.interior.instances) {
    let st = structOf(prefix, pl.tags as string[]); st = spotParts.get(st) ?? st;
    addPlaced(model, prefix, pl as never, T, st);
  }
}
log('cells done', pieces.length);

// ---- the pipeway's own steel (rack, stringers, junction frames); its copies of the units' valve-bay steel are skipped ----
if (pwSteel) for (const q of pwSteel) { addPiece({ model: 'pipeway', ...q }); nStruct++; }
else {
  const first = pieces.length;
  for (const pl of PW!.interior.instances) {
    if ((pl.tags as string[]).some(t => /^unit-\d+$/.test(t))) continue;
    const tags = pl.tags as string[], j = tags.find(t => t.startsWith('junction:'));
    addPlaced('pipeway', 'pipeway', pl as never, IDENT, j ? `pipeway:${j}` : 'pipeway:rack');
  }
  if (PWCACHE) writeFileSync(PWCACHE, JSON.stringify(pieces.slice(first).map(q => ({ line: q.line, tag: q.tag, kind: q.kind, cat: q.cat, struct: q.struct, grating: q.grating, prims: q.prims.map(r => (r.t === 3 ? { ...r, v: [...r.v] } : r)) }))));
}
log('pipeway steel done', pieces.length);

// ---- pipe frames of plant 3's own (from each model's report), placed in their model's frame ----
let nFrames = 0;
for (const model of MODEL_T.keys()) {
  const f = join(MODELS, `${model}.report.json`); if (!existsSync(f)) continue;
  const rep = JSON.parse(readFileSync(f, 'utf8')); const frames = (rep.frames ?? []) as FrameSpec[];
  frames.forEach((fs, k) => {
    for (const pl of framePlaced(fs)) { const role = (pl.tags as string[]).find(t => ['pad', 'post', 'beam'].includes(t)) ?? 'part'; addPlaced(model, model, pl as never, MODEL_T.get(model)!, `${model}:frame:${k}`, fs.line, `pipe-frame:${fs.line}#${k}/${role}`); }
    nFrames++;
  });
}
log('frames', nFrames);

// ---- the cooling water mains' sleepers, rebuilt by SW-CWM-2's code from the report's figures (the area frame is the pipeway's moved by CWM.way in z) ----
let nSleepers = 0, sleeperCheck = '';
{
  const rep = JSON.parse(readFileSync(join(MODELS, 'cooling-water.report.json'), 'utf8'));
  const mains = rep.mains as { NPS: number; cls: PipeClass; lane: number }[], OD = pipeDims(mains[0].NPS, mains[0].cls).OD, lanes = mains.map(m => m.lane);
  const zs0 = Math.min(...lanes) - OD / 2 - CWM.sleeperOver, zs1 = Math.max(...lanes) + OD / 2 + CWM.sleeperOver, x0 = rep.way.x0, x1 = rep.way.x1;
  const own: never[] = [], kit = interiorKit({ pedestal: 6, padHeight: 6 }, own, {});
  // SW-CWM-2: a sleeper is left out where it would come within 3 in of a junction frame's or the rack's steel (boxes of the pipeway's own pieces)
  const steelBoxes = pieces.filter(q => q.model === 'pipeway' && (q.struct === 'pipeway:rack' || !!q.struct?.startsWith('pipeway:junction:'))).map(q => [[q.lo[0], q.lo[1], q.lo[2] - CWM.way], [q.hi[0], q.hi[1], q.hi[2] - CWM.way]]);
  const toPw = translate(0, 0, CWM.way) as Mat; let left = 0;
  for (let x = x0; x <= x1 - CWM.sleeperW / 2 + 1e-6; x += PWY.bent) {
    const mn = [x - CWM.sleeperW / 2 - 3, 0, zs0 - 3], mx = [x + CWM.sleeperW / 2 + 3, CWM.sleeperTop + 3, zs1 + 3];
    if (steelBoxes.some(b => b[0].every((v, k) => v < mx[k]) && b[1].every((v, k) => v > mn[k]))) { left++; continue; }
    const part = kit.concrete('sleeper', CWM.sleeperW, CWM.sleeperTop, zs1 - zs0);
    addPlaced('cooling-water', 'cooling-water', { part, transform: frameFromAxes([x, CWM.sleeperTop / 2, zs0], [0, 1, 0], [0, 0, 1]) as Mat, tags: ['sleeper', 'pad', `sleeper:${x}`] }, toPw, `cooling-water:sleeper:${x}`, 'sleepers', `sleeper:${x}`);
    nSleepers++;
  }
  sleeperCheck = `${nSleepers} sleepers rebuilt (${left} left out by the 3 in rule); the report states ${rep.sleepers}`;
  if (nSleepers !== rep.sleepers) console.error(`WARNING: ${sleeperCheck}`);
}
log(sleeperCheck);

// ---- which piping pieces are bolted at an equipment nozzle's face (R6b) ----
{
  const H = new Map<string, { p: V; d: V; equip: string; model: string; rec: NzRec }[]>(), hk = (p: V) => `${Math.floor(p[0])},${Math.floor(p[1])},${Math.floor(p[2])}`;
  for (const f of nozzleFaces) { const k = hk(f.p); let l = H.get(k); if (!l) H.set(k, (l = [])); l.push(f); }
  const near = (p: V) => { const out: { p: V; d: V; equip: string; model: string; rec: NzRec }[] = []; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) out.push(...(H.get(`${Math.floor(p[0]) + i},${Math.floor(p[1]) + j},${Math.floor(p[2]) + k}`) ?? [])); return out; };
  for (const pc of pieces) {
    if (pc.cat !== 'pipe') continue;
    if (pc.ports) for (const pt of pc.ports) for (const f of near(pt.p)) if (len(sub(pt.p, f.p)) <= JOIN && Math.abs(dot(pt.d, f.d)) > 0.999) { (pc.atEquip ??= new Set()).add(f.equip); (pc.atNz ??= []).push(f.rec); }
    if (pc.studs && pc.ax) { const mid = add(pc.ax.p, pc.ax.d, pc.ax.s1 / 2); for (const f of near(mid)) { const off = sub(f.p, pc.ax.p), s = dot(off, pc.ax.d), perp = len(sub(off, mul(pc.ax.d, s))); if (perp <= JOIN && Math.abs(dot(pc.ax.d, f.d)) > 0.999 && s >= -JOIN && s <= pc.ax.s1 + JOIN) { (pc.atEquip ??= new Set()).add(f.equip); (pc.atNz ??= []).push(f.rec); } } }
  }
}

// ---- grating cuts of each model (where a line passes a grating through a hole cut for it), in the pipeway frame ----
const cutsOf = new Map<string, { p: V; r: number }[]>();
for (const [model, M] of models) cutsOf.set(model, (M.cuts ?? []).map(c => ({ p: xf(MODEL_T.get(model)!, [c.x, c.y, c.z]), r: c.r })));

// ---- a planted clash (env PLANT): proves the detector reports what it should ----
const planted: string[] = [];
if (PLANT) {
  // (1) a copy of a pipeway pipe moved sideways 2 in into a parallel pipe of another line
  const pipesPW = pieces.filter(p => p.model === 'pipeway' && p.kind === 'pipe' && p.prims.length === 1 && p.prims[0].t === 0 && p.prims[0].h > 24 && p.prims[0].r <= 3 && Math.abs(p.prims[0].w[0]) > 0.999);
  const others = pieces.filter(p => p.cat === 'pipe' && p.kind === 'pipe' && p.prims.length === 1 && p.prims[0].t === 0 && Math.abs(p.prims[0].w[0]) > 0.999);
  let done1 = false;
  for (const X of pipesPW) {
    if (done1) break; const px = X.prims[0];
    for (const Y of others) {
      if (Y.lk === X.lk) continue; const py = Y.prims[0];
      if (Math.abs(py.c[1] - px.c[1]) > 0.01) continue;                       // same elevation, side by side across the rack
      const D = Math.abs(py.c[2] - px.c[2]), g = D - px.r - py.r; if (g < 1 || g > 12) continue;
      const x0 = Math.max(px.c[0] - px.h, py.c[0] - py.h), x1 = Math.min(px.c[0] + px.h, py.c[0] + py.h); if (x1 - x0 < 24) continue;
      const shift = (g + 2) * Math.sign(py.c[2] - px.c[2]); if (Math.abs(shift) < 2 * px.r + 0.5) continue;   // the copy must clear its own original
      addPiece({ model: X.model, line: X.line, tag: `${X.tag}#PLANTED-1`, kind: 'pipe', cat: 'pipe', prims: X.prims.map(q => xfPrim(q, translate(0, 0, shift) as Mat)), lk: X.lk, planted: true });
      planted.push(`PLANTED-1: a copy of ${X.model} ${X.line} ${X.tag} moved ${shift.toFixed(2)} in in z, 2.00 in into ${Y.model} ${Y.line} ${Y.tag} (gap ${g.toFixed(2)} in)`); done1 = true; break;
    }
  }
  // (2) a copy of a pipeway pipe that sits on a shoe, pushed down 2 in into the steel the shoe bears on
  for (const S of pieces) {
    if (S.model !== 'pipeway' || S.kind !== 'shoe' || S.cat !== 'sup') continue;
    const X = pieces.find(p => p.lk === S.lk && p.kind === 'pipe' && p.prims.length === 1 && p.prims[0].t === 0 && Math.abs(p.prims[0].w[0]) > 0.999 && p.prims[0].r <= 4 && S.lo[0] > p.lo[0] + 6 && S.hi[0] < p.hi[0] - 6 && Math.abs(p.prims[0].c[2] - (S.lo[2] + S.hi[2]) / 2) < 0.5);
    if (!X) continue;
    const drop = X.lo[1] - S.lo[1] + 2;                                        // pipe bottom to the shoe's base (the steel's top), and 2 in more
    addPiece({ model: X.model, line: `${X.line}`, tag: `${X.tag}#PLANTED-2`, kind: 'pipe', cat: 'pipe', prims: X.prims.map(q => xfPrim(q, translate(0, -drop, 0) as Mat)), lk: `${X.lk}#PLANTED-2`, planted: true });
    planted.push(`PLANTED-2: a copy of ${X.model} ${X.line} ${X.tag} moved ${(-drop).toFixed(2)} in in y, 2.00 in into the steel under its shoe ${S.tag}`); break;
  }
  // REVIEW: (3) and (4) go through the relationships like any real piece (1 and 2 bypass them), so they also test the excuses.
  // (3) a pipe of a pipeway line laid 2 in into a unit's battery-limit spool flange (another model), square to the spool, at its flange ring
  {
    const pwPorts = new Map<string, Piece>(); for (const q of pieces) if (q.model === 'pipeway' && q.cat === 'pipe' && q.ports) for (const pt of q.ports) pwPorts.set(pt.p.map(v => Math.round(v * 10)).join(','), q);
    const F = pieces.find(p => p.model.startsWith('unit-') && p.kind === 'flange' && !!p.nozzleOf?.startsWith('BL-') && !!p.ax && pwPorts.has(p.ax.p.map(v => Math.round(v * 10)).join(',')));
    const G = F && pwPorts.get(F.ax!.p.map(v => Math.round(v * 10)).join(','));
    if (F && G) {
      const dF = F.ax!.d, rF = F.prims.reduce((m, q) => Math.max(m, q.t === 0 ? q.r : 0), 0), rP = 1.5, c = add(F.ax!.p, dF, 0.6);
      const e = unit(Math.abs(dF[1]) < 0.9 ? cross(dF, EY) : cross(dF, EX)), w = unit(cross(dF, e)), ctr = add(c, e, rF + rP - 2);
      const pr = cyl(ctr, w, 24, rP), a0 = add(ctr, w, -24), b0 = add(ctr, w, 24);
      addPiece({ model: 'pipeway', line: G.line, tag: `${G.line}/PLANTED-3`, kind: 'pipe', cat: 'pipe', prims: [pr], lk: G.lk, ports: [{ p: a0, d: w }, { p: b0, d: w }], ax: { p: a0, d: w, s0: 0, s1: 48 }, plantedRel: true });
      planted.push(`PLANTED-3: a 3 in pipe of pipeway ${G.line} laid square across ${F.model} spool flange ${F.tag} (radius ${rF.toFixed(3)} in), its axis ${(rF + rP - 2).toFixed(3)} in from the flange's: 2.00 in into it`);
    }
  }
  // (4) a pipeway shoe (the real one, moved) sunk 2 in into the rack steel it bears on: its base still bears, its web is 1.625 in in the steel
  {
    const steel = pieces.filter(q => q.model === 'pipeway' && q.cat === 'steel' && q.kind === 'steel:W');
    for (const S of pieces) {
      if (S.model !== 'pipeway' || S.kind !== 'shoe' || S.cat !== 'sup') continue;
      const M = steel.find(q => Math.abs(q.hi[1] - S.lo[1]) < 0.05 && q.lo[0] < S.hi[0] - 1 && q.hi[0] > S.lo[0] + 1 && q.lo[2] < S.hi[2] - 1 && q.hi[2] > S.lo[2] + 1); if (!M) continue;
      S.prims = S.prims.map(q => xfPrim(q, translate(0, -2, 0) as Mat)); S.lo = [S.lo[0], S.lo[1] - 2, S.lo[2]]; S.hi = [S.hi[0], S.hi[1] - 2, S.hi[2]]; S.plantedRel = true;
      planted.push(`PLANTED-4: pipeway shoe ${S.tag} moved 2.00 in down into the steel it bears on (${M.tag}): its web 1.625 in into the member`); break;
    }
  }
  // (5) a 2 in pipe of a unit line laid inside a vessel's shell, on its axis, touching no wall: only the hollow-body pass can see it
  {
    const E = pieces.find(p => p.cat === 'equip' && p.model === 'unit-16' && p.prims.filter(q => q.t === 4 && /shell/.test(String(q.name)) && Math.min(q.ri0, q.ri1) > 12).length >= 24);
    const X = E && pieces.find(p => p.model === E.model && p.kind === 'pipe' && p.cat === 'pipe' && !p.nozzleOf);
    const q0 = E?.prims.find(q => q.t === 4 && /shell/.test(String(q.name)) && Math.min(q.ri0, q.ri1) > 12);
    if (E && X && q0) {
      const ctr = add(q0.c, q0.w, (q0.z0 + q0.z1) / 2), pr = cyl(ctr, q0.w, Math.min(6, (q0.z1 - q0.z0) / 2 - 1), 1);
      addPiece({ model: X.model, line: X.line, tag: `${X.line}/PLANTED-5`, kind: 'pipe', cat: 'pipe', prims: [pr], lk: X.lk, plantedRel: true });
      planted.push(`PLANTED-5: a 2 in pipe of ${X.model} ${X.line} inside ${E.tag}'s ${q0.name} (bore radius ${Math.min(q0.ri0, q0.ri1).toFixed(2)} in), on its axis, touching no wall`);
    }
  }
  log(planted.join('\n'));
}

// ================================================================ relationships ================================================================
const isStruct = (p: Piece) => p.cat === 'steel' || p.cat === 'conc' || p.cat === 'equip';
function joinedAt(A: Piece, B: Piece): Port | null {
  if (!A.ports || !B.ports) return null;
  for (const p of A.ports) for (const q of B.ports) if (Math.abs(p.p[0] - q.p[0]) <= JOIN && Math.abs(p.p[1] - q.p[1]) <= JOIN && Math.abs(p.p[2] - q.p[2]) <= JOIN && len(sub(p.p, q.p)) <= JOIN && Math.abs(dot(p.d, q.d)) > 0.999) return p;
  return null;
}
const joined = (A: Piece, B: Piece) => !!joinedAt(A, B);
/** REVIEW: pieces whose solids lie wholly between their own ports (a pipe beyond them only by its recorded insertion) */
const RUNK = new Set(['pipe', 'nipple', 'elbow', 'tee', 'reducer', 'cap', 'flange', 'gasket', 'blind', 'spade', 'spectacle']);
const reach = (X: Piece, n: V) => { let m = -Infinity; for (const q of X.prims) m = Math.max(m, dot(sup(q, n), n)); return m; };
const insAt = (X: Piece, P: V) => (X.ins && X.ax ? (len(sub(P, X.ax.p)) <= len(sub(P, add(X.ax.p, X.ax.d, X.ax.s1))) ? X.ins[0] : X.ins[1]) : 0);
/** two joined pieces must stand on the two sides of their shared face: neither may reach through it into the other, beyond a recorded
 *  insertion (a line that turns back through the piece it is joined to is not "joined", it is a clash) */
function sidesOK(A: Piece, B: Piece, port: Port): boolean {
  const P = port.p, cA: V = [(A.lo[0] + A.hi[0]) / 2, (A.lo[1] + A.hi[1]) / 2, (A.lo[2] + A.hi[2]) / 2], n = dot(sub(P, cA), port.d) >= 0 ? port.d : mul(port.d, -1);
  if (process.env.SIDEDEBUG && (A.tag.includes(process.env.SIDEDEBUG) || B.tag.includes(process.env.SIDEDEBUG))) console.log('SIDE', A.tag, B.tag, 'n', n.map(v => v.toFixed(4)), 'reachA', (reach(A, n) - dot(P, n)).toFixed(4), 'reachB', (reach(B, mul(n, -1)) + dot(P, n)).toFixed(4), 'insA', insAt(A, P), 'insB', insAt(B, P), 'last', JSON.stringify(A.prims[A.prims.length - 1]).slice(0, 400), 'ports', JSON.stringify(A.ports), 'P', P, 'A prims', A.prims.length, A.prims.map(q => (dot(sup(q, n), n) - dot(P, n)).toFixed(3)).slice(0, 30).join(' '));
  return reach(A, n) - dot(P, n) <= JOIN + insAt(A, P) && reach(B, mul(n, -1)) + dot(P, n) <= JOIN + insAt(B, P);
}
const crossedJoins = new Set<string>();
/** a stud set and a piece on the same axis within the studs' length (the flanges, gasket, blind, spade or valve end of its joint) */
function studsThrough(S: Piece, X: Piece): boolean {
  // REVIEW: through the pieces of ITS joint only: those reaching into its grip (the stack between its nuts, centred on the set), never another
  // stud set. Two stud sets at a wafer valve stood 3.9 in into each other in the same bolt positions, and a set's nuts in the next joint's gasket,
  // all excused before because "coaxial within the studs' length" was the whole test
  if (X.studs || !S.ax || !X.ax || Math.abs(dot(S.ax.d, X.ax.d)) < 0.999) return false;
  const off = sub(X.ax.p, S.ax.p), s = dot(off, S.ax.d); if (len(sub(off, mul(S.ax.d, s))) > JOIN) return false;
  const sx0 = s, sx1 = s + dot(X.ax.d, S.ax.d) * X.ax.s1, lo = Math.min(sx0, sx1), hi = Math.max(sx0, sx1);
  const mid = S.ax.s1 / 2, half = (S.grip ?? S.ax.s1) / 2;
  return hi >= mid - half - JOIN && lo <= mid + half + JOIN;
}
const bearCache = new Map<string, boolean>();
/** a support (or anything with bearing solids) bears on M: one of its bearing solids touches M within 0.05 in */
function bearsOn(S: Piece, M: Piece): boolean {
  const k = `${S.id}|${M.id}`, c = bearCache.get(k); if (c !== undefined) return c;
  let r = false;
  outer: for (const p of S.prims) {
    if (!p.bear) continue;
    for (const q of M.prims) { if (p.lo[0] > q.hi[0] + FACE || q.lo[0] > p.hi[0] + FACE || p.lo[1] > q.hi[1] + FACE || q.lo[1] > p.hi[1] + FACE || p.lo[2] > q.hi[2] + FACE || q.lo[2] > p.hi[2] + FACE) continue; if (gjk(p, q, FACE) <= FACE) { r = true; break outer; } }
  }
  bearCache.set(k, r); return r;
}
/** REVIEW: the solids of a body that a nozzle (or a line bolted at its face) is set on: those touched by the disc at the neck's inner end or
 *  by the face's disc, never an attachment of the body (platform, handrail, ladder, buckstay, lattice, ...: a top platform's handrail ring
 *  crosses C-1302-N2's neck right at the head) */
const ATTACH = /platform|handrail|guardrail|toe ?plate|kick ?plate|ladder|cage|stair|grating|buckstay|lattice|davit|monorail|walkway|structure|pedestal|skid|saddle|skirt|legs?\b|lug|bracket|foundation/i;
const seatCache = new Map<string, Set<string>>();
function seatOf(P: Piece, X: Piece): Set<string> {
  const k = `${P.id}|${X.id}`; let r = seatCache.get(k); if (r) return r; r = new Set();
  const tags = [X.equip!, ...(X.struct ? [X.struct.split(':').slice(1).join(':')] : [])];
  const recs = [...(P.nz ? [P.nz] : []), ...(P.atNz ?? [])].filter(q => tags.includes(q.equip));
  for (const rec of recs) {
    // the face's disc, and for the nozzle's own pieces the root of its neck: the last rIn of it (at most the neck), where it enters the body
    const discs: [Prim, boolean][] = [[cyl(rec.face, rec.u, 0.0005, rec.rFace), false]];
    if (P.nz === rec) { const Ln = Math.max(0.001, Math.min(rec.rIn, dot(sub(rec.face, rec.inner), rec.u))); discs.push([cylZ(rec.inner, rec.u, 0, Ln, rec.rIn), true]); }
    for (const q of X.prims) { const nm = String(q.name ?? ''); if (r.has(nm)) continue; if (ATTACH.test(nm)) continue; for (const [dsk] of discs) { if (gjk(dsk, q, FACE) <= FACE) { r.add(nm); break; } } }
  }
  if (process.env.SEATDEBUG && P.tag.includes(process.env.SEATDEBUG)) { const recs2 = [...(P.nz ? [P.nz] : []), ...(P.atNz ?? [])]; for (const rec of recs2) { const di = cyl(rec.inner, rec.u, 0.0005, rec.rIn), df = cyl(rec.face, rec.u, 0.0005, rec.rFace); const seen = new Map<string, [number, number]>(); for (const q of X.prims) { const nm = String(q.name); const g1 = gjk(di, q), g2 = gjk(df, q); const e = seen.get(nm); seen.set(nm, e ? [Math.min(e[0], g1), Math.min(e[1], g2)] : [g1, g2]); } console.log('SEAT', P.tag, X.tag, 'face', rec.face.map(v => v.toFixed(2)), 'inner', rec.inner.map(v => v.toFixed(2)), 'rIn', rec.rIn, 'rFace', rec.rFace, 'seat', [...r].join(' | ')); for (const [nm, [g1, g2]] of seen) if (g1 < 30 || g2 < 30) console.log('    ', nm, 'inner', g1.toFixed(3), 'face', g2.toFixed(3)); } }
  seatCache.set(k, r); return r;
}
void seatCache;
const CARRIED = new Set(['pipe', 'nipple', 'elbow', 'tee', 'reducer', 'cap', 'weld']);
const PER_PRIM = new Set(['support bears on it', 'nozzle on its own equipment', "line bolted at the equipment's nozzle", 'equipment on its own pad or pier']);
/** the named relationship that makes two pieces meant to touch, or null */
function relate(A: Piece, B: Piece): string | null {
  if (A.planted || B.planted) return A.lk === B.lk && (A.cat === 'sup' || B.cat === 'sup') ? 'support of its own line' : null;
  const pa = A.cat === 'pipe', pb = B.cat === 'pipe';
  if (pa && pb) {
    const jp = joinedAt(A, B);
    if (jp) { if (!RUNK.has(A.kind) || !RUNK.has(B.kind) || sidesOK(A, B, jp)) return 'joined at a shared face'; crossedJoins.add(`${A.id}|${B.id}`); }
    if (A.kind === 'weld' && A.model === B.model && A.joins?.includes(B.tag)) return 'weld joining it';
    if (B.kind === 'weld' && A.model === B.model && B.joins?.includes(A.tag)) return 'weld joining it';
    if (A.studs && studsThrough(A, B)) return 'stud set through its joint';
    if (B.studs && studsThrough(B, A)) return 'stud set through its joint';
    // REVIEW: on its parent's run (pipe, elbow, tee, reducer, girth weld), not on whatever piece of the parent line it meets
    if (A.kind === 'olet' && A.model === B.model && A.onRun === B.line && CARRIED.has(B.kind)) return 'branch outlet on its parent run';
    if (B.kind === 'olet' && A.model === B.model && B.onRun === A.line && CARRIED.has(A.kind)) return 'branch outlet on its parent run';
    if ((A.pen || B.pen) && A.lk === B.lk) return 'penetration sleeve around its own line';
    return null;
  }
  if (A.cat === 'sup' || B.cat === 'sup') {
    const S = A.cat === 'sup' ? A : B, X = S === A ? B : A;
    // REVIEW: a support carries its line's run (pipe, elbow, tee, reducer and the girth welds on it); its line's valve, flange, gasket, studs or
    // blind are not what it carries (stanchion posts stood 1.25-1.67 in inside their own lines' valve bodies)
    if (X.cat === 'pipe') return X.lk === S.lk && CARRIED.has(X.kind) ? 'support of its own line' : null;
    if (X.cat === 'sup') return null;
    return bearsOn(S, X) ? 'support bears on it' : null;
  }
  if (pa || pb) {
    const P = pa ? A : B, X = P === A ? B : A;
    if (X.cat === 'equip' && P.model === X.model) {
      const tags = [X.equip!, ...(X.struct ? [X.struct.split(':').slice(1).join(':')] : [])];
      if (P.nozzleOf && tags.includes(P.nozzleOf)) return 'nozzle on its own equipment';
      if (tags.some(t => P.atEquip?.has(t))) return 'line bolted at the equipment\'s nozzle';
    }
    if (P.pen && X.grating) return 'penetration sleeve set in the grating';
    return null;
  }
  // structural with structural
  // REVIEW: a body and its own pad or pier are one kit, but the body bears on them only through its legs, base, saddles or feet (decided per solid:
  // a pump's motor 5.8 in down in its own pad was excused as "one structure")
  if (A.struct && A.struct === B.struct && (A.cat === 'equip') !== (B.cat === 'equip') && (A.cat === 'conc' || B.cat === 'conc')) return 'equipment on its own pad or pier';
  if (A.struct && A.struct === B.struct) return 'one structure';
  return null;
}

// ================================================================ broad phase ================================================================
const CELL = 48;
const grid = new Map<number, number[]>();
const ck = (i: number, j: number, k: number) => ((i + 2000) * 4096 + (j + 2000)) * 4096 + (k + 2000);
for (const p of pieces) {
  const i0 = Math.floor(p.lo[0] / CELL), i1 = Math.floor(p.hi[0] / CELL), j0 = Math.floor(p.lo[1] / CELL), j1 = Math.floor(p.hi[1] / CELL), k0 = Math.floor(p.lo[2] / CELL), k1 = Math.floor(p.hi[2] / CELL);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (let k = k0; k <= k1; k++) { const key = ck(i, j, k); let l = grid.get(key); if (!l) grid.set(key, (l = [])); l.push(p.id); }
}
log('grid cells', grid.size);

// ================================================================ narrow phase ================================================================
interface Finding { a: { model: string; line: string; tag: string; kind: string }; b: { model: string; line: string; tag: string; kind: string }; depthIn: number; at: V; note: string }
const findings: Finding[] = [];
const excused = new Map<string, number>();
let piecePairs = 0, primPairs = 0, primTests = 0;
const ov = (a: { lo: V; hi: V }, b: { lo: V; hi: V }, m: number) => a.lo[0] < b.hi[0] - m && b.lo[0] < a.hi[0] - m && a.lo[1] < b.hi[1] - m && b.lo[1] < a.hi[1] - m && a.lo[2] < b.hi[2] - m && b.lo[2] < a.hi[2] - m;
const desc = (p: Piece) => ({ model: p.model, line: p.line, tag: p.tag, kind: p.kind });
function noteOf(A: Piece, B: Piece): string {
  const w = (p: Piece) => (p.cat === 'pipe' ? (p.nozzleOf ? 'nozzle/spool piece' : 'piping') : p.cat === 'sup' ? 'support' : p.cat === 'equip' ? 'equipment' : p.cat === 'conc' ? 'concrete' : 'steel');
  const same = A.lk && A.lk === B.lk ? ' (same line, not joined)' : A.model !== B.model ? ` (${A.model} vs ${B.model})` : '';
  const bead = A.kind === 'weld' || B.kind === 'weld' ? ' [weld bead]' : '';
  return `${w(A)} vs ${w(B)}${same}${bead}`;
}
const PROBE = process.env.PROBE ? new RegExp(process.env.PROBE) : undefined;
const probed: { rel: string; a: ReturnType<typeof desc>; b: ReturnType<typeof desc>; depth: number; at: V; na?: string; nb?: string; ba?: boolean; bb?: boolean; nonBear?: number; nonBearName?: string }[] = [];
function probePair(A: Piece, B: Piece, rel: string) {
  let best: { depth: number; at: V; na?: string; nb?: string; ba?: boolean; bb?: boolean } | null = null, nonBear = 0, nonBearName = '';
  const S = A.cat === 'sup' ? A : B.cat === 'sup' ? B : A.cat === 'equip' ? A : B;
  for (const p of A.prims) for (const q of B.prims) {
    if (!ov(p, q, NOISE)) continue; const r = depthOf(p, q, NOISE); if (!r) continue;
    if (!best || r.depth > best.depth) best = { depth: r.depth, at: r.at, na: p.name, nb: q.name, ba: !!p.bear, bb: !!q.bear };
    const sp = S === A ? p : q; if (!sp.bear && r.depth > nonBear) { nonBear = r.depth; nonBearName = String(sp.name ?? ''); }
  }
  if (best) probed.push({ rel, a: desc(A), b: desc(B), depth: Math.round(best.depth * 1000) / 1000, at: best.at.map(v => Math.round(v * 100) / 100), na: best.na, nb: best.nb, ba: best.ba, bb: best.bb, nonBear: Math.round(nonBear * 1000) / 1000, nonBearName });
}
function testPair(A: Piece, B: Piece) {
  piecePairs++;
  const rel = relate(A, B); if (rel && !PER_PRIM.has(rel)) { excused.set(rel, (excused.get(rel) ?? 0) + 1); if (PROBE && PROBE.test(rel) && (rel !== 'one structure' || (A.cat === 'equip') !== (B.cat === 'equip')) && (rel !== 'stud set through its joint' || ((A.studs ? B : A).kind !== 'flange'))) probePair(A, B, rel); return; }
  // REVIEW: these relationships excuse only the solids that make them (they excused the whole pair before): a support's bearing solids, and the
  // rods of a hanger through the member its top plate bears on; a nozzle's pieces against the solids of its body it is set on
  let skip: ((p: Prim, q: Prim) => boolean) | undefined, skipped = 0;
  if (rel === 'support bears on it') { const S = A.cat === 'sup' ? A : B; skip = (p, q) => { const sp = S === A ? p : q; return !!sp.bear || /^rods? /.test(String(sp.name ?? '')); }; }
  else if (rel === 'equipment on its own pad or pier') { const E = A.cat === 'equip' ? A : B; skip = (p, q) => !!(E === A ? p : q).bear; }
  else if (rel) { const P = A.cat === 'pipe' ? A : B, X = P === A ? B : A, seat = seatOf(P, X); skip = (p, q) => seat.has(String((P === A ? q : p).name ?? '')); }
  const thr = isStruct(A) && isStruct(B) && !process.env.STRUCTNOISE ? FACE : NOISE;
  const pa = A.prims.length > 1 ? A.prims.filter(q => ov(q, B, NOISE)) : A.prims, pb = B.prims.length > 1 ? B.prims.filter(q => ov(q, A, NOISE)) : B.prims;
  let best: { depth: number; at: V; na?: string; nb?: string } | null = null, cutExcused = false, bearExcused = false;
  const eqBear = !rel && (A.cat === 'equip') !== (B.cat === 'equip') && isStruct(A) && isStruct(B);   // a body and the steel or concrete of another structure
  for (const p of pa) for (const q of pb) {
    if (!ov(p, q, NOISE)) continue; primPairs++;
    if (skip && skip(p, q)) { skipped++; continue; }
    if (eqBear && ((A.cat === 'equip' && p.bear) || (B.cat === 'equip' && q.bear))) { const rb = depthOf(p, q, thr); if (rb) { bearExcused = true; if (PROBE && PROBE.test('equipment bears on it')) probed.push({ rel: 'equipment bears on it', a: desc(A), b: desc(B), depth: Math.round(rb.depth * 1000) / 1000, at: rb.at.map(v => Math.round(v * 100) / 100), na: p.name, nb: q.name }); } continue; }   // its legs, saddles or base on what carries it
    const r0 = depthOf(p, q, thr); primTests++; if (!r0) continue;
    const r = { ...r0, na: p.name as string | undefined, nb: q.name as string | undefined };
    if ((A.grating || B.grating) && (A.cat === 'pipe' || B.cat === 'pipe')) {   // a line through a hole cut in a grating for it (the model's cuts)
      const P = A.cat === 'pipe' ? A : B, cuts = cutsOf.get(P.model) ?? [];
      // REVIEW: only a pipe standing through the hole, its whole section inside the cut (the witness point alone excused a pipe too big for its hole)
      const pr0 = P.prims[0], fits = (c: { p: V; r: number }) => P.kind === 'pipe' && !!P.ax && Math.abs(P.ax.d[1]) > 0.999 && pr0?.t === 0 && Math.hypot(P.ax.p[0] + P.ax.d[0] * (c.p[1] - P.ax.p[1]) / P.ax.d[1] - c.p[0], P.ax.p[2] + P.ax.d[2] * (c.p[1] - P.ax.p[1]) / P.ax.d[1] - c.p[2]) + pr0.r <= c.r + JOIN;
      if (cuts.some(c => fits(c) && Math.hypot(r.at[0] - c.p[0], r.at[2] - c.p[2]) <= c.r + 0.25 && Math.abs(r.at[1] - c.p[1]) <= 6)) { cutExcused = true; if (PROBE && PROBE.test('grating cut')) probed.push({ rel: 'line through a grating cut', a: desc(A), b: desc(B), depth: Math.round(r.depth * 1000) / 1000, at: r.at.map(v => Math.round(v * 100) / 100), na: p.name, nb: q.name }); continue; }
    }
    if (!best || r.depth > best.depth) best = r;
  }
  if (!best) { const why = rel ? `${rel} (its ${rel.startsWith('support') || rel.startsWith('equipment') ? 'bearing solids' : 'seat solids'} only)` : cutExcused ? 'line through a grating cut' : bearExcused ? 'equipment bears on it (legs, saddle or base)' : thr === FACE ? 'structural face contact (<=0.05 in) or clear' : 'clear at the primitives'; excused.set(why, (excused.get(why) ?? 0) + 1); return; }
  const [X, Y] = A.cat === 'pipe' && B.cat !== 'pipe' ? [A, B] : B.cat === 'pipe' && A.cat !== 'pipe' ? [B, A] : A.id < B.id ? [A, B] : [B, A];
  const [nx, ny] = X === A ? [best.na, best.nb] : [best.nb, best.na], parts = [nx ? `${X.tag.split('/').pop()}: ${nx}` : '', ny ? `${Y.tag.split('/').pop()}: ${ny}` : ''].filter(Boolean).join(' x ');
  const why = rel === 'support bears on it' ? ' [a non-bearing solid of the support in the member it bears on]' : rel === 'equipment on its own pad or pier' ? ' [a non-bearing solid of the body in its own pad or pier]' : rel ? ` [${rel}, but against a solid it is not set on]` : crossedJoins.has(`${A.id}|${B.id}`) || crossedJoins.has(`${B.id}|${A.id}`) ? ' [joined, but one reaches through their shared face into the other]' : A.studs && B.studs && A.lk === B.lk ? ' [two stud sets of one line in the same bolt positions]' : (A.studs || B.studs) && A.lk === B.lk ? ' [a stud set against a piece of its line outside its own joint]' : '';
  findings.push({ a: desc(X), b: desc(Y), depthIn: Math.round(best.depth * 1000) / 1000, at: best.at.map(v => Math.round(v * 100) / 100), note: noteOf(X, Y) + why + (parts ? `; solids ${parts}` : '') + (A.planted || B.planted || A.plantedRel || B.plantedRel ? ' [PLANTED]' : '') });
}
// DEBUGTAG=<substring>: every piece within 3 in of a piece whose tag contains it, the relation and the gap (development aid)
if (process.env.DEBUGTAG) {
  const sel = pieces.filter(p => p.tag.includes(process.env.DEBUGTAG!));
  for (const A of sel) for (const B of pieces) {
    if (A === B || !ov(A, B, -3)) continue;
    let gap = Infinity; for (const p of A.prims) for (const q of B.prims) if (ov(p, q, -3)) gap = Math.min(gap, gjk(p, q));
    if (gap > 3) continue;
    let dep = 0; for (const p of A.prims) for (const q of B.prims) if (ov(p, q, 0)) dep = Math.max(dep, depthOf(p, q, 0)?.depth ?? 0);
    console.log(`DEBUG ${A.model} ${A.tag} ~ ${B.model} ${B.line} ${B.tag} ${B.kind}: gap ${gap.toFixed(3)} depth ${dep.toFixed(3)} rel ${relate(A, B)}`);
  }
}
let cellsVisited = 0;
for (const [key, ids] of grid) {
  if (ids.length < 2) continue; cellsVisited++;
  const k = key % 4096 - 2000, j = Math.floor(key / 4096) % 4096 - 2000, i = Math.floor(key / 4096 / 4096) - 2000;
  for (let x = 0; x < ids.length; x++) {
    const A = pieces[ids[x]];
    for (let y = x + 1; y < ids.length; y++) {
      const B = pieces[ids[y]];
      if (!ov(A, B, NOISE)) continue;
      // test each pair once: in the cell holding the low corner of the two boxes' overlap
      if (Math.floor(Math.max(A.lo[0], B.lo[0]) / CELL) !== i || Math.floor(Math.max(A.lo[1], B.lo[1]) / CELL) !== j || Math.floor(Math.max(A.lo[2], B.lo[2]) / CELL) !== k) continue;
      testPair(A, B);
    }
  }
}
// ---- REVIEW: piping or a support INSIDE a hollow body. A body's shell is fitted as a hollow ring (24 sectors), so a piece that lies within the
// shell without crossing its wall overlaps none of its primitives: the narrow phase above cannot see it. Every piece whose core points (axis
// ends and middle) lie within a process shell's bore is reported (not its own nozzle's pieces, nor a line bolted at that body's nozzle) ----
let nCav = 0, cavFound = 0;
{
  const PROC = /shell|drum|channel|casing|barrel|chamber|regenerator|tank/i, NOTPROC = /skirt|nozzle|neck|flange|weld|seam|insul|jacket|coil|tray|support|ring|davit|pad/i;
  const hit = new Set(findings.map(f => `${f.a.model}|${f.a.tag}|${f.b.model}|${f.b.tag}`));
  for (const E of pieces) {
    if (E.cat !== 'equip') continue;
    const groups = new Map<string, Prim[]>();
    for (const q of E.prims) { if (q.t !== 4) continue; const nm = String(q.name ?? ''); if (!PROC.test(nm) || NOTPROC.test(nm) || ATTACH.test(nm)) continue; const k = `${nm}|${q.c.map((v: number) => v.toFixed(2))}|${q.w.map((v: number) => v.toFixed(3))}|${q.z0.toFixed(3)}`; let l = groups.get(k); if (!l) groups.set(k, (l = [])); l.push(q); }
    for (const [k, qs] of groups) {
      if (qs.length < 24) continue;                                      // a whole ring only
      const q0 = qs[0], ri = Math.min(...qs.map(q => Math.min(q.ri0, q.ri1))) - FACE, lo = [0, 1, 2].map(i => Math.min(...qs.map(q => q.lo[i]))), hi = [0, 1, 2].map(i => Math.max(...qs.map(q => q.hi[i])));
      if (ri <= 0.5) continue; nCav++;
      const inside = (p: V) => { const d = sub(p, q0.c), t = dot(d, q0.w); if (t < q0.z0 + FACE || t > q0.z1 - FACE) return -1; const rr = len(sub(d, mul(q0.w, t))); return rr < ri ? ri + FACE - rr : -1; };
      const seen = new Set<number>();
      for (let i = Math.floor(lo[0] / CELL); i <= Math.floor(hi[0] / CELL); i++) for (let j = Math.floor(lo[1] / CELL); j <= Math.floor(hi[1] / CELL); j++) for (let kk = Math.floor(lo[2] / CELL); kk <= Math.floor(hi[2] / CELL); kk++) for (const id of grid.get(ck(i, j, kk)) ?? []) {
        if (seen.has(id)) continue; seen.add(id); const X = pieces[id];
        if (X.cat !== 'pipe' && X.cat !== 'sup') continue;
        if (X.model === E.model && ((X.nozzleOf && X.nozzleOf === E.equip) || X.atEquip?.has(E.equip!))) continue;
        if (!ov(X, { lo, hi }, NOISE)) continue;
        let best = -1, at: V = [0, 0, 0];
        for (const q of X.prims) { const cs = primCore(q), pts = cs.length > 1 ? [cs[0], cs[1], mul(add(cs[0], cs[1]), 0.5)] : cs; for (const pt of pts) { const dpt = inside(pt); if (dpt > best) { best = dpt; at = pt; } } }
        if (best <= NOISE) continue;
        if (hit.has(`${X.model}|${X.tag}|${E.model}|${E.tag}`) || hit.has(`${E.model}|${E.tag}|${X.model}|${X.tag}`)) continue;
        hit.add(`${X.model}|${X.tag}|${E.model}|${E.tag}`); cavFound++;
        findings.push({ a: desc(X), b: desc(E), depthIn: Math.round(best * 1000) / 1000, at: at.map(v => Math.round(v * 100) / 100), note: `${X.cat === 'pipe' ? (X.nozzleOf ? 'nozzle/spool piece' : 'piping') : 'support'} vs equipment${X.model !== E.model ? ` (${X.model} vs ${E.model})` : ''} [inside the bore of ${k.split('|')[0]}: depth is its distance in from the inner wall]${X.plantedRel ? ' [PLANTED]' : ''}` });
      }
    }
  }
  log('hollow bodies checked', nCav, 'pieces inside one', cavFound);
}
findings.sort((p, q) => q.depthIn - p.depthIn);
if (PROBE) { probed.sort((p, q) => q.depth - p.depth); writeFileSync(join(HERE, `probe-${LABEL}.json`), JSON.stringify(probed, null, 1)); }
saveKeyCache();
// ---- near misses (not findings): pieces of piping of DIFFERENT models closer than SW-RT-3's 3 in clearance, without overlap ----
const NEAR = 3, near: { a: ReturnType<typeof desc>; b: ReturnType<typeof desc>; gapIn: number; at: V }[] = [];
{
  const P = pieces.filter(p => p.cat === 'pipe' && !p.planted), g2 = new Map<number, number[]>(), C2 = 48;
  for (const p of P) { const lo = p.lo.map(v => Math.floor((v - NEAR / 2) / C2)), hi = p.hi.map(v => Math.floor((v + NEAR / 2) / C2)); for (let i = lo[0]; i <= hi[0]; i++) for (let j = lo[1]; j <= hi[1]; j++) for (let k = lo[2]; k <= hi[2]; k++) { const key = ck(i, j, k); let l = g2.get(key); if (!l) g2.set(key, (l = [])); l.push(p.id); } }
  const seen = new Set<string>(), hit = new Set(findings.map(f => `${f.a.model}|${f.a.tag}|${f.b.model}|${f.b.tag}`));
  for (const ids of g2.values()) for (let x = 0; x < ids.length; x++) for (let y = x + 1; y < ids.length; y++) {
    const A = pieces[ids[x]], B = pieces[ids[y]]; if (A.model === B.model || !ov(A, B, -NEAR)) continue;
    const k = A.id < B.id ? `${A.id}|${B.id}` : `${B.id}|${A.id}`; if (seen.has(k)) continue; seen.add(k);
    if (A.ax && B.ax && Math.abs(dot(A.ax.d, B.ax.d)) > 0.999 && len(sub(sub(B.ax.p, A.ax.p), mul(A.ax.d, dot(sub(B.ax.p, A.ax.p), A.ax.d)))) <= JOIN && Math.min(len(sub(A.ax.p, B.ax.p)), len(sub(add(A.ax.p, A.ax.d, A.ax.s1), B.ax.p)), len(sub(A.ax.p, add(B.ax.p, B.ax.d, B.ax.s1))), len(sub(add(A.ax.p, A.ax.d, A.ax.s1), add(B.ax.p, B.ax.d, B.ax.s1)))) <= NEAR) continue;   // the two sides of one bolted joint
    if (relate(A, B) || hit.has(`${A.model}|${A.tag}|${B.model}|${B.tag}`) || hit.has(`${B.model}|${B.tag}|${A.model}|${A.tag}`)) continue;
    let gap = Infinity, at: V = [0, 0, 0];
    for (const p of A.prims) for (const q of B.prims) { if (!ov(p, q, -NEAR)) continue; const d = gjk(p, q, NEAR); if (d < gap) { gap = d; at = mul(add(primCore(p)[0], primCore(q)[0]), 0.5); } }
    if (gap < NEAR && gap > 0) near.push({ a: desc(A), b: desc(B), gapIn: Math.round(gap * 1000) / 1000, at: at.map(v => Math.round(v * 100) / 100) });
  }
  near.sort((p, q) => p.gapIn - q.gapIn);
  writeFileSync(join(HERE, `near-${LABEL}.json`), JSON.stringify(near, null, 1));
}
const out = join(HERE, `findings-${LABEL}.json`);
writeFileSync(out, JSON.stringify(findings, null, 1));
const counts = { pieces: pieces.length, piping: nComp, welds: nWeld, supports: nSup, structural: nStruct, frames: nFrames, sleepers: nSleepers, piecePairs, primPairs, skewPipes, skewWelds, weldDirFixed };
writeFileSync(join(HERE, `stats-${LABEL}.json`), JSON.stringify({ models: MODELS, CWMway: CWM.way, nearMisses: near.length, counts, excused: Object.fromEntries(excused), planted, sleeperCheck, dropped, seconds: (Date.now() - t00) / 1000 }, null, 1));
const classOf = (f: Finding) => (f.note.includes('PLANTED') ? 'planted' : f.note.includes('[weld bead]') ? 'weld-bead' : f.note.includes('reaches through their shared face') ? 'joined-reversal' : f.note.includes('stud set') ? 'stud-sets' : f.note.includes('non-bearing solid of the support') ? 'support-sunk-in-its-member' : f.note.includes('non-bearing solid of the body') ? 'body-in-its-own-pad' : f.note.includes('not set on') ? 'nozzle-vs-own-body-attachment' : f.note.includes('inside the bore') ? 'inside-a-body' : f.note.includes('same line') ? 'self' : f.a.model !== f.b.model ? 'cross-model' : f.note.split(';')[0].replace(/ \(.*$/, '').replace(/ \[.*$/, '').replace(/ /g, '-'));
const byClass = new Map<string, number>(); for (const f of findings) byClass.set(classOf(f), (byClass.get(classOf(f)) ?? 0) + 1);
const top = [...byClass.entries()].sort((p, q) => q[1] - p[1]).map(([k, v]) => `${k} ${v}`).join(', ') + ` | deepest ${findings[0] ? `${findings[0].a.model} ${findings[0].a.tag} x ${findings[0].b.model} ${findings[0].b.tag} ${findings[0].depthIn} in` : '-'}`;
console.log(`analytic [${LABEL}] ${findings.length} findings over ${pieces.length} pieces (${nComp} piping, ${nWeld} welds, ${nSup} supports, ${nStruct} structural, ${nFrames} frames, ${nSleepers} sleepers), ${piecePairs} piece pairs tested, ${((Date.now() - t00) / 1000).toFixed(0)} s -> ${out}${planted.length ? ` | ${planted.length} planted` : ''} | ${dropped.length} pieces not representable | ${near.length} cross-model near misses < 3 in | ${top}`);
