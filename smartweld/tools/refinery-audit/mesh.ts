/**
 * Plant 3 independent clash detector, method "mesh": TRUE-SHAPE TRIANGLE MESHES.
 *
 *   cd /home/user/Refinery/smartweld && MODELS=<dir> [LABEL=run] [PLANT=1] npx vite-node <this file>
 *
 * Every piece (line comps, nozzle comps, supports, welds) and every static object (unit cells' steel, equipment and
 * concrete, the pipeway's own steel, pipe frames, cooling-water sleepers) is meshed from its part with the repo's own
 * catalogue (buildGeometry / partFromKey / makeValve) and placed by its transform into the PIPEWAY frame. Broad phase:
 * world AABBs in a uniform grid. Narrow phase: dual BVH traversal (template-local BVHs, rigid relative transforms) with
 * an exact triangle-triangle test (Moller interval test, own code), then a ray-parity containment test, then a depth
 * estimate (deepest sampled surface point of one solid inside the other, distance to the other's surface by a BVH
 * nearest-triangle query). None of the model's own checks, boxes, obstacles or clearance results are used.
 *
 * Semantics: a pipe's and a tee's bore is full of fluid, so their meshes are their filled outer solids (same outer
 * polygon as the catalogue's pipe, the catalogue tee's outer blend); all other parts are exactly buildGeometry's solids.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cells } from '../../src/refinery/assemble';
import { unitToPipeway, PWY, stringersOf } from '../../src/refinery/pipeway';
import { framePlaced, type FrameSpec } from '../../src/refinery/supports';
import { CWM } from '../../src/refinery/coolingWater';
import { RACK } from '../../src/refinery/cell';
import { gateWidth } from '../../src/refinery/unitPiping';
import { interiorKit } from '../../src/generator/interiorKit';
import { partFromKey, worldBox } from '../../src/generator/piping';
import { makeWideFlange, makeValve, pipeDims, designFlange, teeC, type PartSpec, type PipeClass, type ValveType } from '../../src/catalogue';
import { buildGeometry } from '../../src/geometry/partGeometry';
import { setMaxCells, polygonize, blend, cylZ, cylY } from '../../src/geometry/sdf';
import { extrude, type MeshData } from '../../src/geometry/mesh';
import { circle } from '../../src/geometry/polygon';
import { frameFromAxes, multiply, translate, standUp } from '../../src/geometry/transform';

// ------------------------------------------------------------------------------------------------------------------
const ENV = process.env;
const MODELS = ENV.MODELS; if (!MODELS) throw new Error('set MODELS to the model folder');
const LABEL = ENV.LABEL ?? 'run';
const OUT_DIR = (process.env.AUDIT_OUT ?? 'audit-out') + '/mesh'; mkdirSync(OUT_DIR, { recursive: true });
// REVIEW FIX (valves): every valve is meshed once at the catalogue's default tessellation (110 cells), the shape the model's own
// geometry uses, for its broad-phase box and its narrow phase alike. The original used the 18-cell plant-view mesh + 0.5 in for
// the box (the true box reaches up to 0.70 in beyond that: GATE 30 P150, BFLY 20, CHECK 20, GATE 24, BFLY 12) and a 40-cell
// mesh for the narrow phase (a cast solid loses up to 37% of its volume there; GATE 30 P150) with a 90 s budget for re-meshing
// close calls, after which close calls stayed coarse. Measured over the 99 valve keys: 110 cells for all costs ~300 s.
const VALVE_FINE = Number(ENV.VALVE_FINE ?? 110);             // the catalogue default
const VALVE_CELLS = Number(ENV.VALVE_CELLS ?? VALVE_FINE);    // (dev only: a coarser working mesh)
const VALVE_BOUND = Number(ENV.VALVE_BOUND ?? VALVE_FINE), VALVE_BOUND_PAD = VALVE_BOUND >= VALVE_FINE ? 0 : 1.25;   // dev only below 110: padded
const FINE_BUDGET_S = Number(ENV.FINE_BUDGET_S ?? 1e9);
/** REVIEW FIX (support relations): how far from the point a support carries its line (its record's `at`) a piece of its own line,
 *  or of a nozzle its line ends at, may lie and still be the piece it carries (measured to the piece's box). */
const CARRY_D = Number(ENV.CARRY_D ?? 12);
const NOISE = 0.02, FACE = 0.05, PORT_TOL = 0.05, EPS_PLANE = 1e-3;
const CLEAR = Number(ENV.CLEAR ?? 2);   // near-miss listing (not findings): unrelated piping of different models closer than this
const PLANT = ENV.PLANT === '1';
const ONLY = ENV.ONLY ? new RegExp(ENV.ONLY) : undefined;   // development: test only pairs with a side in a model matching this
// STRUCT=1 (added 2026-11-27): only the pairs within one structure, which every other mode excuses as 'one structure': each structure's own pieces against each
// other, bolts, anchor rods and bars through steel (their holes are not drawn, as for every bolt of the plant) and welds against the steel they join excused, a shared
// face to FACE allowed, and nothing else (not 'one standing on the other': a plate set half into the floor it stands on is a finding)
const STRUCT = ENV.STRUCT === '1';
const THROUGH_KIND = new Set(['BOLT', 'ANCHOR_ROD', 'ROD', 'FILLET_WELD', 'FILLET_WELD_AROUND', 'GROUT']);
const T0 = Date.now();
const secs = () => ((Date.now() - T0) / 1000).toFixed(1);
let peakRss = 0; const rss = () => { const r = process.memoryUsage().rss; if (r > peakRss) peakRss = r; return r; };
const log = (...a: unknown[]) => console.error(`[${secs()}s]`, ...a, `(rss ${(rss() / 2 ** 30).toFixed(2)} GB)`);
type V3 = [number, number, number];
type M4 = number[];

// ---- affine helpers (column-major 4x4) ---------------------------------------------------------------------------
const xfp = (m: M4, p: ArrayLike<number>, o = 0): V3 => [m[0] * p[o] + m[4] * p[o + 1] + m[8] * p[o + 2] + m[12], m[1] * p[o] + m[5] * p[o + 1] + m[9] * p[o + 2] + m[13], m[2] * p[o] + m[6] * p[o + 1] + m[10] * p[o + 2] + m[14]];
function inv4(m: M4): M4 {
  // M = [[a b c] [d e f] [g h i]] from the column-major array; inverse by the adjugate
  const a = m[0], b = m[4], c = m[8], d = m[1], e = m[5], f = m[9], g = m[2], h = m[6], i = m[10];
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) throw new Error('singular transform');
  const inv = [A / det, B / det, C / det, 0, -(b * i - c * h) / det, (a * i - c * g) / det, -(a * h - b * g) / det, 0, (b * f - c * e) / det, -(a * f - c * d) / det, (a * e - b * d) / det, 0, 0, 0, 0, 1];
  const t = [m[12], m[13], m[14]];
  inv[12] = -(inv[0] * t[0] + inv[4] * t[1] + inv[8] * t[2]); inv[13] = -(inv[1] * t[0] + inv[5] * t[1] + inv[9] * t[2]); inv[14] = -(inv[2] * t[0] + inv[6] * t[1] + inv[10] * t[2]);
  return inv;
}
// self-check of inv4 once
{ const m = multiply(translate(3, -4, 7), [0.6, 0, -0.8, 0, 0, 1, 0, 0, 0.8, 0, 0.6, 0, 0, 0, 0, 1]); const p: V3 = [1.5, 2.5, -3.5], q = xfp(inv4(m), xfp(m, p)); if (Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) > 1e-9) throw new Error('inv4 self-check failed'); }

// ---- templates: a part's solids as one triangle soup with solid and component ids ------------------------------------
interface BVH { tv: Float32Array; ts: Uint16Array; tc: Int32Array; nT: number; bmin: Float32Array; bmax: Float32Array; left: Int32Array; start: Int32Array; count: Int32Array; nN: number }
interface Tpl {
  id: number; name: string; solidNames: string[]; nT: number;
  pos: Float64Array; idx: Uint32Array; tSolid: Uint16Array; tComp: Int32Array;
  nComp: number; compSolid: Int32Array; compRep: Int32Array; compBox: Float64Array;
  box: Float64Array; bvh?: BVH; sdf?: { key: string; level: number }; parity?: Uint8Array;
}
const tpls: Tpl[] = [];
function makeTpl(name: string, solids: { name: string; mesh: MeshData }[]): Tpl {
  let nV = 0, nI = 0; for (const s of solids) { nV += s.mesh.positions.length / 3; nI += s.mesh.indices.length; }
  const pos = new Float64Array(nV * 3), idx = new Uint32Array(nI), tSolid = new Uint16Array(nI / 3);
  let v0 = 0, i0 = 0;
  solids.forEach((s, si) => { const P = s.mesh.positions, I = s.mesh.indices; for (let k = 0; k < P.length; k++) pos[v0 * 3 + k] = P[k]; for (let k = 0; k < I.length; k++) idx[i0 + k] = I[k] + v0; for (let t = 0; t < I.length / 3; t++) tSolid[i0 / 3 + t] = si; v0 += P.length / 3; i0 += I.length; });
  // connected components by shared vertex index (each closed shell is tested for parity on its own)
  const par = new Int32Array(nV); for (let k = 0; k < nV; k++) par[k] = k;
  const find = (x: number) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  for (let t = 0; t < nI; t += 3) { const a = find(idx[t]), b = find(idx[t + 1]), c = find(idx[t + 2]); if (a !== b) par[b] = a; const a2 = find(a); if (a2 !== c) par[c] = a2; }
  const compOf = new Int32Array(nV).fill(-1); let nComp = 0; const tComp = new Int32Array(nI / 3); const reps: number[] = [], cs: number[] = [];
  for (let t = 0; t < nI / 3; t++) { const r = find(idx[3 * t]); if (compOf[r] < 0) { compOf[r] = nComp++; reps.push(idx[3 * t]); cs.push(tSolid[t]); } tComp[t] = compOf[r]; }
  const compBox = new Float64Array(nComp * 6); for (let c = 0; c < nComp; c++) { compBox[6 * c] = compBox[6 * c + 1] = compBox[6 * c + 2] = Infinity; compBox[6 * c + 3] = compBox[6 * c + 4] = compBox[6 * c + 5] = -Infinity; }
  for (let t = 0; t < nI / 3; t++) { const c = tComp[t]; for (let k = 0; k < 3; k++) { const v = idx[3 * t + k]; for (let a = 0; a < 3; a++) { const x = pos[3 * v + a]; if (x < compBox[6 * c + a]) compBox[6 * c + a] = x; if (x > compBox[6 * c + 3 + a]) compBox[6 * c + 3 + a] = x; } } }
  const box = new Float64Array([Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity]);
  for (let k = 0; k < nV; k++) for (let a = 0; a < 3; a++) { const x = pos[3 * k + a]; if (x < box[a]) box[a] = x; if (x > box[3 + a]) box[3 + a] = x; }
  const t: Tpl = { id: tpls.length, name, solidNames: solids.map(s => s.name), nT: nI / 3, pos, idx, tSolid, tComp, nComp, compSolid: Int32Array.from(cs), compRep: Int32Array.from(reps), compBox, box };
  tpls.push(t); return t;
}

// ---- BVH over a template's triangles (float32 copies in BVH order) --------------------------------------------------
const LEAF = 4;
function buildBVH(tp: Tpl): BVH {
  const nT = tp.nT, P = tp.pos, I = tp.idx, cen = new Float64Array(nT * 3), tb = new Float64Array(nT * 6);
  const tv0 = new Float32Array(nT * 9);
  for (let t = 0; t < nT; t++) {
    let mnx = Infinity, mny = Infinity, mnz = Infinity, mxx = -Infinity, mxy = -Infinity, mxz = -Infinity;
    for (let k = 0; k < 3; k++) { const v = I[3 * t + k]; const x = Math.fround(P[3 * v]), y = Math.fround(P[3 * v + 1]), z = Math.fround(P[3 * v + 2]); tv0[9 * t + 3 * k] = x; tv0[9 * t + 3 * k + 1] = y; tv0[9 * t + 3 * k + 2] = z;
      if (x < mnx) mnx = x; if (y < mny) mny = y; if (z < mnz) mnz = z; if (x > mxx) mxx = x; if (y > mxy) mxy = y; if (z > mxz) mxz = z; }
    tb[6 * t] = mnx; tb[6 * t + 1] = mny; tb[6 * t + 2] = mnz; tb[6 * t + 3] = mxx; tb[6 * t + 4] = mxy; tb[6 * t + 5] = mxz;
    cen[3 * t] = (mnx + mxx) / 2; cen[3 * t + 1] = (mny + mxy) / 2; cen[3 * t + 2] = (mnz + mxz) / 2;
  }
  const perm = new Uint32Array(nT); for (let k = 0; k < nT; k++) perm[k] = k;
  const maxN = Math.max(1, 2 * Math.ceil(nT / 2) + 1);
  const bmin = new Float32Array(maxN * 3), bmax = new Float32Array(maxN * 3), left = new Int32Array(maxN).fill(-1), start = new Int32Array(maxN), count = new Int32Array(maxN);
  let nN = 1; const st: number[] = [0, 0, nT];
  const select = (s: number, e: number, kth: number, ax: number) => {   // quickselect on perm[s..e) by centroid axis
    let lo = s, hi = e - 1;
    while (hi > lo) {
      const pv = cen[3 * perm[(lo + hi) >> 1] + ax]; let i = lo, j = hi;
      while (i <= j) { while (cen[3 * perm[i] + ax] < pv) i++; while (cen[3 * perm[j] + ax] > pv) j--; if (i <= j) { const tmp = perm[i]; perm[i] = perm[j]; perm[j] = tmp; i++; j--; } }
      if (kth <= j) hi = j; else if (kth >= i) lo = i; else break;
    }
  };
  while (st.length) {
    const e = st.pop()!, s = st.pop()!, n = st.pop()!;
    let mnx = Infinity, mny = Infinity, mnz = Infinity, mxx = -Infinity, mxy = -Infinity, mxz = -Infinity, cnx = Infinity, cny = Infinity, cnz = Infinity, cxx = -Infinity, cxy = -Infinity, cxz = -Infinity;
    for (let k = s; k < e; k++) { const t = perm[k];
      if (tb[6 * t] < mnx) mnx = tb[6 * t]; if (tb[6 * t + 1] < mny) mny = tb[6 * t + 1]; if (tb[6 * t + 2] < mnz) mnz = tb[6 * t + 2]; if (tb[6 * t + 3] > mxx) mxx = tb[6 * t + 3]; if (tb[6 * t + 4] > mxy) mxy = tb[6 * t + 4]; if (tb[6 * t + 5] > mxz) mxz = tb[6 * t + 5];
      const x = cen[3 * t], y = cen[3 * t + 1], z = cen[3 * t + 2]; if (x < cnx) cnx = x; if (y < cny) cny = y; if (z < cnz) cnz = z; if (x > cxx) cxx = x; if (y > cxy) cxy = y; if (z > cxz) cxz = z; }
    bmin[3 * n] = mnx; bmin[3 * n + 1] = mny; bmin[3 * n + 2] = mnz; bmax[3 * n] = mxx; bmax[3 * n + 1] = mxy; bmax[3 * n + 2] = mxz;
    if (e - s <= LEAF) { start[n] = s; count[n] = e - s; continue; }
    const dx = cxx - cnx, dy = cxy - cny, dz = cxz - cnz, ax = dx >= dy && dx >= dz ? 0 : dy >= dz ? 1 : 2, mid = (s + e) >> 1;
    select(s, e, mid, ax);
    const l = nN; nN += 2; left[n] = l; count[n] = 0;
    st.push(l, s, mid, l + 1, mid, e);
  }
  const tv = new Float32Array(nT * 9), ts = new Uint16Array(nT), tc = new Int32Array(nT);
  for (let k = 0; k < nT; k++) { const t = perm[k]; for (let q = 0; q < 9; q++) tv[9 * k + q] = tv0[9 * t + q]; ts[k] = tp.tSolid[t]; tc[k] = tp.tComp[t]; }
  return { tv, ts, tc, nT, bmin, bmax, left, start, count, nN };
}
let bvhTris = 0;
const bvhOf = (t: Tpl) => { if (!t.bvh) { t.bvh = buildBVH(t); bvhTris += t.nT; } return t.bvh; };

// ---- exact triangle-triangle test (Moller's interval test; touching and coplanar contact are not crossings) ---------
function triTri(a: Float64Array, b: Float64Array): boolean {
  // plane of b
  let e1x = b[3] - b[0], e1y = b[4] - b[1], e1z = b[5] - b[2], e2x = b[6] - b[0], e2y = b[7] - b[1], e2z = b[8] - b[2];
  let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x; let L = Math.hypot(nx, ny, nz); if (L < 1e-12) return false;
  nx /= L; ny /= L; nz /= L; let d = -(nx * b[0] + ny * b[1] + nz * b[2]);
  let da0 = nx * a[0] + ny * a[1] + nz * a[2] + d, da1 = nx * a[3] + ny * a[4] + nz * a[5] + d, da2 = nx * a[6] + ny * a[7] + nz * a[8] + d;
  if (Math.abs(da0) < EPS_PLANE) da0 = 0; if (Math.abs(da1) < EPS_PLANE) da1 = 0; if (Math.abs(da2) < EPS_PLANE) da2 = 0;
  if (!((da0 > 0 || da1 > 0 || da2 > 0) && (da0 < 0 || da1 < 0 || da2 < 0))) return false;
  const n2x = nx, n2y = ny, n2z = nz;
  // plane of a
  e1x = a[3] - a[0]; e1y = a[4] - a[1]; e1z = a[5] - a[2]; e2x = a[6] - a[0]; e2y = a[7] - a[1]; e2z = a[8] - a[2];
  nx = e1y * e2z - e1z * e2y; ny = e1z * e2x - e1x * e2z; nz = e1x * e2y - e1y * e2x; L = Math.hypot(nx, ny, nz); if (L < 1e-12) return false;
  nx /= L; ny /= L; nz /= L; d = -(nx * a[0] + ny * a[1] + nz * a[2]);
  let db0 = nx * b[0] + ny * b[1] + nz * b[2] + d, db1 = nx * b[3] + ny * b[4] + nz * b[5] + d, db2 = nx * b[6] + ny * b[7] + nz * b[8] + d;
  if (Math.abs(db0) < EPS_PLANE) db0 = 0; if (Math.abs(db1) < EPS_PLANE) db1 = 0; if (Math.abs(db2) < EPS_PLANE) db2 = 0;
  if (!((db0 > 0 || db1 > 0 || db2 > 0) && (db0 < 0 || db1 < 0 || db2 < 0))) return false;
  // the line of the two planes; project on its largest axis
  const Dx = Math.abs(ny * n2z - nz * n2y), Dy = Math.abs(nz * n2x - nx * n2z), Dz = Math.abs(nx * n2y - ny * n2x);
  const ax = Dx >= Dy && Dx >= Dz ? 0 : Dy >= Dz ? 1 : 2;
  const ia = interval(a[ax], a[3 + ax], a[6 + ax], da0, da1, da2), ia0 = IV0, ia1 = IV1; void ia;
  interval(b[ax], b[3 + ax], b[6 + ax], db0, db1, db2);
  const lo = Math.max(ia0, IV0), hi = Math.min(ia1, IV1);
  return hi - lo > 1e-9;
}
let IV0 = 0, IV1 = 0;
function interval(p0: number, p1: number, p2: number, d0: number, d1: number, d2: number): number {
  let lo = Infinity, hi = -Infinity;
  const add = (v: number) => { if (v < lo) lo = v; if (v > hi) hi = v; };
  if (d0 === 0) add(p0); if (d1 === 0) add(p1); if (d2 === 0) add(p2);
  if (d0 * d1 < 0) add(p0 + (p1 - p0) * d0 / (d0 - d1));
  if (d1 * d2 < 0) add(p1 + (p2 - p1) * d1 / (d1 - d2));
  if (d2 * d0 < 0) add(p2 + (p0 - p2) * d2 / (d2 - d0));
  IV0 = lo; IV1 = hi; return 0;
}

// ---- ray parity (per closed component) and nearest-surface distance --------------------------------------------------
const RAYS: V3[] = [[0.5381, 0.6419, 0.5463], [-0.7071, 0.1263, 0.6957], [0.2311, -0.8432, 0.4853]].map(d => { const l = Math.hypot(...d); return [d[0] / l, d[1] / l, d[2] / l] as V3; });
const rayStack = new Int32Array(1 << 16);
/** components of the template whose shell the point is inside (odd crossings along the ray) */
function insideComps(tp: Tpl, px: number, py: number, pz: number, ray = 0): number[] {
  const B = bvhOf(tp); if (!tp.parity) tp.parity = new Uint8Array(tp.nComp);
  const par = tp.parity, touched: number[] = [];
  const [dx, dy, dz] = RAYS[ray], ix = 1 / dx, iy = 1 / dy, iz = 1 / dz;
  let sp = 0; rayStack[sp++] = 0;
  while (sp) {
    const n = rayStack[--sp];
    // slab test
    let t0 = 0, t1 = Infinity, ta = (B.bmin[3 * n] - px) * ix, tb = (B.bmax[3 * n] - px) * ix; if (ta > tb) { const q = ta; ta = tb; tb = q; } t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
    ta = (B.bmin[3 * n + 1] - py) * iy; tb = (B.bmax[3 * n + 1] - py) * iy; if (ta > tb) { const q = ta; ta = tb; tb = q; } t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
    ta = (B.bmin[3 * n + 2] - pz) * iz; tb = (B.bmax[3 * n + 2] - pz) * iz; if (ta > tb) { const q = ta; ta = tb; tb = q; } t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
    if (t0 > t1 + 1e-9) continue;
    if (B.count[n]) {
      for (let k = B.start[n], e = k + B.count[n]; k < e; k++) {
        const o = 9 * k, ax = B.tv[o], ay = B.tv[o + 1], az = B.tv[o + 2];
        const e1x = B.tv[o + 3] - ax, e1y = B.tv[o + 4] - ay, e1z = B.tv[o + 5] - az, e2x = B.tv[o + 6] - ax, e2y = B.tv[o + 7] - ay, e2z = B.tv[o + 8] - az;
        const hx = dy * e2z - dz * e2y, hy = dz * e2x - dx * e2z, hz = dx * e2y - dy * e2x, det = e1x * hx + e1y * hy + e1z * hz;
        if (Math.abs(det) < 1e-14) continue;
        const f = 1 / det, sx = px - ax, sy = py - ay, sz = pz - az, u = f * (sx * hx + sy * hy + sz * hz); if (u < 0 || u > 1) continue;
        const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x, v = f * (dx * qx + dy * qy + dz * qz); if (v < 0 || u + v > 1) continue;
        const t = f * (e2x * qx + e2y * qy + e2z * qz); if (t <= 1e-9) continue;
        const c = B.tc[k]; if (!par[c]) touched.push(c); par[c] ^= 1; if (!par[c]) { /* back to even: keep in touched list */ }
      }
    } else { rayStack[sp++] = B.left[n]; rayStack[sp++] = B.left[n] + 1; }
  }
  const out: number[] = []; for (const c of touched) { if (par[c]) out.push(c); par[c] = 0; }
  return [...new Set(out)];
}
function inside(tp: Tpl, x: number, y: number, z: number, robust = false): number[] {
  const r0 = insideComps(tp, x, y, z, 0); if (!robust) return r0;
  const r1 = insideComps(tp, x, y, z, 1), r2 = insideComps(tp, x, y, z, 2);
  const votes = new Map<number, number>(); for (const r of [r0, r1, r2]) for (const c of r) votes.set(c, (votes.get(c) ?? 0) + 1);
  return [...votes].filter(([, v]) => v >= 2).map(([c]) => c);
}
const nnStack = new Int32Array(1 << 16);
/** distance from a point to the template's surface (and the solid of the nearest triangle), searching within maxR */
function nearest(tp: Tpl, px: number, py: number, pz: number, maxR = 96): { d: number; solid: number } {
  const B = bvhOf(tp); let best2 = maxR * maxR, bs = -1; let sp = 0; nnStack[sp++] = 0;
  while (sp) {
    const n = nnStack[--sp];
    const qx = Math.max(B.bmin[3 * n] - px, 0, px - B.bmax[3 * n]), qy = Math.max(B.bmin[3 * n + 1] - py, 0, py - B.bmax[3 * n + 1]), qz = Math.max(B.bmin[3 * n + 2] - pz, 0, pz - B.bmax[3 * n + 2]);
    if (qx * qx + qy * qy + qz * qz >= best2) continue;
    if (B.count[n]) { for (let k = B.start[n], e = k + B.count[n]; k < e; k++) { const d2 = ptTri2(B.tv, 9 * k, px, py, pz); if (d2 < best2) { best2 = d2; bs = B.ts[k]; } } }
    else {
      const l = B.left[n], r = l + 1;   // nearer child last (popped first)
      const dl = boxD2(B, l, px, py, pz), dr = boxD2(B, r, px, py, pz);
      if (dl < dr) { nnStack[sp++] = r; nnStack[sp++] = l; } else { nnStack[sp++] = l; nnStack[sp++] = r; }
    }
  }
  return { d: Math.sqrt(best2), solid: bs };
}
const boxD2 = (B: BVH, n: number, px: number, py: number, pz: number) => { const qx = Math.max(B.bmin[3 * n] - px, 0, px - B.bmax[3 * n]), qy = Math.max(B.bmin[3 * n + 1] - py, 0, py - B.bmax[3 * n + 1]), qz = Math.max(B.bmin[3 * n + 2] - pz, 0, pz - B.bmax[3 * n + 2]); return qx * qx + qy * qy + qz * qz; };
/** squared distance from p to the triangle at tv[o..o+9) (Ericson, closest point on triangle) */
function ptTri2(tv: Float32Array, o: number, px: number, py: number, pz: number): number {
  const ax = tv[o], ay = tv[o + 1], az = tv[o + 2], bx = tv[o + 3], by = tv[o + 4], bz = tv[o + 5], cx = tv[o + 6], cy = tv[o + 7], cz = tv[o + 8];
  const abx = bx - ax, aby = by - ay, abz = bz - az, acx = cx - ax, acy = cy - ay, acz = cz - az, apx = px - ax, apy = py - ay, apz = pz - az;
  const d1 = abx * apx + aby * apy + abz * apz, d2 = acx * apx + acy * apy + acz * apz;
  let qx: number, qy: number, qz: number;
  if (d1 <= 0 && d2 <= 0) { qx = ax; qy = ay; qz = az; }
  else {
    const bpx = px - bx, bpy = py - by, bpz = pz - bz, d3 = abx * bpx + aby * bpy + abz * bpz, d4 = acx * bpx + acy * bpy + acz * bpz;
    if (d3 >= 0 && d4 <= d3) { qx = bx; qy = by; qz = bz; }
    else {
      const vc = d1 * d4 - d3 * d2;
      if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); qx = ax + v * abx; qy = ay + v * aby; qz = az + v * abz; }
      else {
        const cpx = px - cx, cpy = py - cy, cpz = pz - cz, d5 = abx * cpx + aby * cpy + abz * cpz, d6 = acx * cpx + acy * cpy + acz * cpz;
        if (d6 >= 0 && d5 <= d6) { qx = cx; qy = cy; qz = cz; }
        else {
          const vb = d5 * d2 - d1 * d6;
          if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); qx = ax + w * acx; qy = ay + w * acy; qz = az + w * acz; }
          else {
            const va = d3 * d6 - d5 * d4;
            if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const w = (d4 - d3) / (d4 - d3 + (d5 - d6)); qx = bx + w * (cx - bx); qy = by + w * (cy - by); qz = bz + w * (cz - bz); }
            else { const den = 1 / (va + vb + vc), v = vb * den, w = vc * den; qx = ax + abx * v + acx * w; qy = ay + aby * v + acy * w; qz = az + abz * v + acz * w; }
          }
        }
      }
    }
  }
  return (px - qx) ** 2 + (py - qy) ** 2 + (pz - qz) ** 2;
}

// ---- pair narrow phase ----------------------------------------------------------------------------------------------
interface PairOut { hits: number; contained: boolean; depth: number; at: V3; solidDepthA: Map<number, number>; solidDepthB: Map<number, number>; near: boolean }
const travStack = new Int32Array(1 << 22);
const TA = new Float64Array(9), TBw = new Float64Array(9);
const HIT_CAP = 600;
/** R maps B-local to A-local */
function narrow(A: Tpl, B: Tpl, R: M4, nearMargin = 0): { hA: number[]; hB: number[]; near: boolean } {
  const bA = bvhOf(A), bB = bvhOf(B);
  const r0 = R[0], r1 = R[1], r2 = R[2], r4 = R[4], r5 = R[5], r6 = R[6], r8 = R[8], r9 = R[9], r10 = R[10], t0 = R[12], t1 = R[13], t2 = R[14];
  const a0 = Math.abs(r0), a1 = Math.abs(r1), a2 = Math.abs(r2), a4 = Math.abs(r4), a5 = Math.abs(r5), a6 = Math.abs(r6), a8 = Math.abs(r8), a9 = Math.abs(r9), a10 = Math.abs(r10);
  const hA: number[] = [], hB: number[] = []; let near = false;
  let sp = 0; travStack[sp++] = 0; travStack[sp++] = 0;
  const m = Math.max(1e-6, nearMargin);
  while (sp) {
    const nb = travStack[--sp], na = travStack[--sp];
    // B node box into A's frame
    const cx = (bB.bmin[3 * nb] + bB.bmax[3 * nb]) / 2, cy = (bB.bmin[3 * nb + 1] + bB.bmax[3 * nb + 1]) / 2, cz = (bB.bmin[3 * nb + 2] + bB.bmax[3 * nb + 2]) / 2;
    const ex = (bB.bmax[3 * nb] - bB.bmin[3 * nb]) / 2, ey = (bB.bmax[3 * nb + 1] - bB.bmin[3 * nb + 1]) / 2, ez = (bB.bmax[3 * nb + 2] - bB.bmin[3 * nb + 2]) / 2;
    const Cx = r0 * cx + r4 * cy + r8 * cz + t0, Cy = r1 * cx + r5 * cy + r9 * cz + t1, Cz = r2 * cx + r6 * cy + r10 * cz + t2;
    const Ex = a0 * ex + a4 * ey + a8 * ez, Ey = a1 * ex + a5 * ey + a9 * ez, Ez = a2 * ex + a6 * ey + a10 * ez;
    if (Cx - Ex > bA.bmax[3 * na] + m || Cx + Ex < bA.bmin[3 * na] - m || Cy - Ey > bA.bmax[3 * na + 1] + m || Cy + Ey < bA.bmin[3 * na + 1] - m || Cz - Ez > bA.bmax[3 * na + 2] + m || Cz + Ez < bA.bmin[3 * na + 2] - m) continue;
    const la = bA.count[na] > 0, lb = bB.count[nb] > 0;
    if (la && lb) {
      if (nearMargin > 0) near = true;
      for (let kb = bB.start[nb], eb = kb + bB.count[nb]; kb < eb; kb++) {
        const o = 9 * kb; let bmnx = Infinity, bmny = Infinity, bmnz = Infinity, bmxx = -Infinity, bmxy = -Infinity, bmxz = -Infinity;
        for (let v = 0; v < 3; v++) { const x = bB.tv[o + 3 * v], y = bB.tv[o + 3 * v + 1], z = bB.tv[o + 3 * v + 2];
          const X = r0 * x + r4 * y + r8 * z + t0, Y = r1 * x + r5 * y + r9 * z + t1, Z = r2 * x + r6 * y + r10 * z + t2; TBw[3 * v] = X; TBw[3 * v + 1] = Y; TBw[3 * v + 2] = Z;
          if (X < bmnx) bmnx = X; if (Y < bmny) bmny = Y; if (Z < bmnz) bmnz = Z; if (X > bmxx) bmxx = X; if (Y > bmxy) bmxy = Y; if (Z > bmxz) bmxz = Z; }
        for (let ka = bA.start[na], ea = ka + bA.count[na]; ka < ea; ka++) {
          const p = 9 * ka; let amnx = Infinity, amny = Infinity, amnz = Infinity, amxx = -Infinity, amxy = -Infinity, amxz = -Infinity;
          for (let v = 0; v < 3; v++) { const x = bA.tv[p + 3 * v], y = bA.tv[p + 3 * v + 1], z = bA.tv[p + 3 * v + 2]; TA[3 * v] = x; TA[3 * v + 1] = y; TA[3 * v + 2] = z; if (x < amnx) amnx = x; if (y < amny) amny = y; if (z < amnz) amnz = z; if (x > amxx) amxx = x; if (y > amxy) amxy = y; if (z > amxz) amxz = z; }
          if (amnx > bmxx || bmnx > amxx || amny > bmxy || bmny > amxy || amnz > bmxz || bmnz > amxz) continue;
          if (triTri(TA, TBw)) { hA.push(ka); hB.push(kb); if (hA.length >= HIT_CAP) return { hA, hB, near: true }; }
        }
      }
      continue;
    }
    // descend the larger (or the internal one)
    const sa = (bA.bmax[3 * na] - bA.bmin[3 * na]) + (bA.bmax[3 * na + 1] - bA.bmin[3 * na + 1]) + (bA.bmax[3 * na + 2] - bA.bmin[3 * na + 2]), sb = 2 * (Ex + Ey + Ez);
    if (sp + 8 >= travStack.length) throw new Error('traversal stack overflow');
    if (lb || (!la && sa >= sb)) { const l = bA.left[na]; travStack[sp++] = l; travStack[sp++] = nb; travStack[sp++] = l + 1; travStack[sp++] = nb; }
    else { const l = bB.left[nb]; travStack[sp++] = na; travStack[sp++] = l; travStack[sp++] = na; travStack[sp++] = l + 1; }
  }
  return { hA, hB, near };
}

/** surface samples of a triangle within a region box: the triangle clipped to the box (Sutherland-Hodgman), fanned, and
 *  each fan triangle subdivided breadth-first to the spacing s; at most `cap` points added */
function sampleTri(v: ArrayLike<number>, o: number, rg: number[], s: number, out: number[], cap: number) {
  let poly: number[][] = [[v[o], v[o + 1], v[o + 2]], [v[o + 3], v[o + 4], v[o + 5]], [v[o + 6], v[o + 7], v[o + 8]]];
  for (let ax = 0; ax < 3 && poly.length; ax++) for (const [lim, sgn] of [[rg[ax], 1], [rg[3 + ax], -1]] as const) {
    const next: number[][] = [];
    for (let i = 0; i < poly.length; i++) { const P = poly[i], Q = poly[(i + 1) % poly.length], dp = sgn * (P[ax] - lim), dq = sgn * (Q[ax] - lim);
      if (dp >= 0) next.push(P); if ((dp >= 0) !== (dq >= 0)) { const t = dp / (dp - dq); next.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t, P[2] + (Q[2] - P[2]) * t]); } }
    poly = next; if (!poly.length) break;
  }
  if (!poly.length) return;
  const limit = out.length + cap * 3;
  for (const P of poly) out.push(P[0], P[1], P[2]);
  const q: number[][] = []; for (let i = 1; i + 1 < poly.length; i++) q.push([...poly[0], ...poly[i], ...poly[i + 1]]);
  for (let qi = 0; qi < q.length && out.length < limit && qi < 20000; qi++) {
    const t = q[qi];
    out.push((t[0] + t[3] + t[6]) / 3, (t[1] + t[4] + t[7]) / 3, (t[2] + t[5] + t[8]) / 3);
    const l01 = Math.hypot(t[3] - t[0], t[4] - t[1], t[5] - t[2]), l12 = Math.hypot(t[6] - t[3], t[7] - t[4], t[8] - t[5]), l20 = Math.hypot(t[0] - t[6], t[1] - t[7], t[2] - t[8]);
    if (Math.max(l01, l12, l20) <= s) continue;
    const m01 = [(t[0] + t[3]) / 2, (t[1] + t[4]) / 2, (t[2] + t[5]) / 2], m12 = [(t[3] + t[6]) / 2, (t[4] + t[7]) / 2, (t[5] + t[8]) / 2], m20 = [(t[6] + t[0]) / 2, (t[7] + t[1]) / 2, (t[8] + t[2]) / 2];
    out.push(...m01, ...m12, ...m20);
    q.push([t[0], t[1], t[2], ...m01, ...m20], [...m01, t[3], t[4], t[5], ...m12], [...m20, ...m12, t[6], t[7], t[8]], [...m01, ...m12, ...m20]);
  }
  if (out.length > limit) out.length = limit;
}
const boxXf = (b: ArrayLike<number>, m: M4): number[] => { const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity]; for (let c = 0; c < 8; c++) { const q = xfp(m, [c & 1 ? b[3] : b[0], c & 2 ? b[4] : b[1], c & 4 ? b[5] : b[2]]); for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], q[a]); mx[a] = Math.max(mx[a], q[a]); } } return [...mn, ...mx]; };
const boxAnd = (a: number[], b: ArrayLike<number>, pad: number) => [Math.max(a[0], b[0]) - pad, Math.max(a[1], b[1]) - pad, Math.max(a[2], b[2]) - pad, Math.min(a[3], b[3]) + pad, Math.min(a[4], b[4]) + pad, Math.min(a[5], b[5]) + pad];

/** full pair evaluation: crossings, containment, depth (in A's frame; `at` in world) */
function evaluate(A: Obj, B: Obj): PairOut | null {
  const R = multiply(A.inv, B.T), Ri = multiply(B.inv, A.T);
  const { hA, hB } = narrow(A.tpl, B.tpl, R);
  const bA = bvhOf(A.tpl), bB = bvhOf(B.tpl);
  let contained = false; const contA: number[] = [], contB: number[] = [];
  const boxBinA = boxXf(B.tpl.box, R), boxAinB = boxXf(A.tpl.box, Ri);
  if (!hA.length) {
    // containment: a closed shell of one wholly inside a shell of the other
    for (let c = 0; c < A.tpl.nComp; c++) {
      const cb = A.tpl.compBox; if (cb[6 * c] > boxBinA[3] || cb[6 * c + 3] < boxBinA[0] || cb[6 * c + 1] > boxBinA[4] || cb[6 * c + 4] < boxBinA[1] || cb[6 * c + 2] > boxBinA[5] || cb[6 * c + 5] < boxBinA[2]) continue;
      const v = A.tpl.compRep[c], p = xfp(Ri, A.tpl.pos, 3 * v);
      if (inside(B.tpl, p[0], p[1], p[2], true).length) { contained = true; contA.push(c); }
    }
    for (let c = 0; c < B.tpl.nComp; c++) {
      const cb = B.tpl.compBox; if (cb[6 * c] > boxAinB[3] || cb[6 * c + 3] < boxAinB[0] || cb[6 * c + 1] > boxAinB[4] || cb[6 * c + 4] < boxAinB[1] || cb[6 * c + 2] > boxAinB[5] || cb[6 * c + 5] < boxAinB[2]) continue;
      const v = B.tpl.compRep[c], p = xfp(R, B.tpl.pos, 3 * v);
      if (inside(A.tpl, p[0], p[1], p[2], true).length) { contained = true; contB.push(c); }
    }
    if (!contained) return null;
  }
  // depth: surface samples of each inside the other
  const out: PairOut = { hits: hA.length, contained, depth: 0, at: [0, 0, 0], solidDepthA: new Map(), solidDepthB: new Map(), near: true };
  const rgA = boxAnd(boxBinA, A.tpl.box, 0.05), rgB = boxAnd(boxAinB, B.tpl.box, 0.05);
  const diag = Math.hypot(rgA[3] - rgA[0], rgA[4] - rgA[1], rgA[5] - rgA[2]);
  const s = Math.min(1.0, Math.max(0.05, diag / 40)), CAP = 900;
  const probe = (P: number[], self: Tpl, selfSolid: (k: number) => number, other: Tpl, toOther: M4, selfIsA: boolean) => {
    for (let k = 0; k < P.length; k += 3) {
      const q = xfp(toOther, P, k);
      const nn = nearest(other, q[0], q[1], q[2], 96); if (nn.d < NOISE) continue;
      let ins = inside(other, q[0], q[1], q[2]); if (!ins.length) continue;
      // REVIEW FIX: one ray's parity can be wrong where it grazes an edge; a point that would set a depth is confirmed by three rays
      if (nn.d > Math.min(out.depth, FACE)) { ins = inside(other, q[0], q[1], q[2], true); if (!ins.length) continue; }
      const d = nn.d, ss = selfSolid(k / 3);
      const mSelf = selfIsA ? out.solidDepthA : out.solidDepthB, mOther = selfIsA ? out.solidDepthB : out.solidDepthA;
      if (ss >= 0) mSelf.set(ss, Math.max(mSelf.get(ss) ?? 0, d));
      for (const c of ins) { const os = other.compSolid[c]; mOther.set(os, Math.max(mOther.get(os) ?? 0, d)); }
      if (d > out.depth) { out.depth = d; out.at = selfIsA ? (xfp(A.T, P, k)) : (xfp(B.T, P, k)); }
    }
  };
  const samplesOf = (bv: BVH, tris: number[], rg: number[]) => { const P: number[] = [], S: number[] = []; const uniq = [...new Set(tris)]; const step = Math.max(1, Math.floor(uniq.length / 120));
    for (let i = 0; i < uniq.length; i += step) { const n0 = P.length; sampleTri(bv.tv, 9 * uniq[i], rg, s, P, 150); for (let k = n0; k < P.length; k += 3) S.push(bv.ts[uniq[i]]); if (P.length > CAP * 3) break; }
    return { P, S }; };
  if (hA.length) {
    const sa = samplesOf(bA, hA, rgA); probe(sa.P, A.tpl, k => sa.S[k], B.tpl, Ri, true);
    const sb = samplesOf(bB, hB, rgB); probe(sb.P, B.tpl, k => sb.S[k], A.tpl, R, false);
    // REVIEW FIX: on finely tessellated solids (polygonized valves and tees) the crossing triangles lie within one triangle of the
    // other's surface, so their samples understate a deep overlap; where that estimate is shallow (it decides noise, a shared face
    // and a support's solids), also probe the vertices of each solid within the overlap region.
    if (out.depth < 0.25) {
      const rv = (bv: BVH, rg: number[]) => { const tris = trisInBox(bv, rg, 6000), P: number[] = [], S: number[] = [], step = Math.max(1, Math.floor(tris.length / 500));
        for (let i = 0; i < tris.length; i += step) { const o = 9 * tris[i]; for (let v = 0; v < 3; v++) { const x = bv.tv[o + 3 * v], y = bv.tv[o + 3 * v + 1], z = bv.tv[o + 3 * v + 2]; if (x < rg[0] || x > rg[3] || y < rg[1] || y > rg[4] || z < rg[2] || z > rg[5]) continue; P.push(x, y, z); S.push(bv.ts[tris[i]]); } }
        return { P, S }; };
      const va = rv(bA, rgA); probe(va.P, A.tpl, k => va.S[k], B.tpl, Ri, true);
      const vb = rv(bB, rgB); probe(vb.P, B.tpl, k => vb.S[k], A.tpl, R, false);
    }
  }
  const compVerts = (tp: Tpl, comps: number[]) => { const P: number[] = [], S: number[] = []; const want = new Set(comps); for (let t = 0; t < tp.nT && P.length < CAP * 3; t++) if (want.has(tp.tComp[t])) for (let k = 0; k < 3; k++) { const v = tp.idx[3 * t + k]; P.push(tp.pos[3 * v], tp.pos[3 * v + 1], tp.pos[3 * v + 2]); S.push(tp.tSolid[t]); } return { P, S }; };
  if (contA.length) { const c = compVerts(A.tpl, contA); probe(c.P, A.tpl, k => c.S[k], B.tpl, Ri, true); }
  if (contB.length) { const c = compVerts(B.tpl, contB); probe(c.P, B.tpl, k => c.S[k], A.tpl, R, false); }
  return out;
}

/** triangles of a BVH whose boxes overlap a region (up to cap) */
function trisInBox(B: BVH, rg: number[], cap: number): number[] {
  const out: number[] = []; let sp = 0; nnStack[sp++] = 0;
  while (sp && out.length < cap) { const n = nnStack[--sp];
    if (B.bmin[3 * n] > rg[3] || B.bmax[3 * n] < rg[0] || B.bmin[3 * n + 1] > rg[4] || B.bmax[3 * n + 1] < rg[1] || B.bmin[3 * n + 2] > rg[5] || B.bmax[3 * n + 2] < rg[2]) continue;
    if (B.count[n]) { for (let k = B.start[n], e = k + B.count[n]; k < e; k++) out.push(k); } else { nnStack[sp++] = B.left[n]; nnStack[sp++] = B.left[n] + 1; } }
  return out;
}
/** clearance between two objects (no crossing): surface samples of each near the other, nearest distance to the other's surface */
function clearance(A: Obj, B: Obj, limit: number): { d: number; at: V3 } {
  const R = multiply(A.inv, B.T), Ri = multiply(B.inv, A.T); let best = limit, at: V3 = [0, 0, 0];
  const side = (S: Obj, O: Obj, toO: M4, boxOinS: number[]) => {
    const bv = bvhOf(S.tpl), rg = [boxOinS[0] - limit, boxOinS[1] - limit, boxOinS[2] - limit, boxOinS[3] + limit, boxOinS[4] + limit, boxOinS[5] + limit];
    const tris = trisInBox(bv, rg, 4000), step = Math.max(1, Math.floor(tris.length / 150)), P: number[] = [];
    for (let i = 0; i < tris.length; i += step) sampleTri(bv.tv, 9 * tris[i], rg, 0.25, P, 30);
    for (let k = 0; k < P.length; k += 3) { const q = xfp(toO, P, k), nn = nearest(O.tpl, q[0], q[1], q[2], best); if (nn.d < best) { best = nn.d; at = xfp(S.T, P, k); } }
  };
  side(A, B, Ri, boxXf(B.tpl.box, R)); side(B, A, R, boxXf(A.tpl.box, Ri));
  return { d: best, at };
}

// ---- objects ---------------------------------------------------------------------------------------------------------
const CAT = { piece: 0, weld: 1, support: 2, steel: 3, concrete: 4, equipment: 5 } as const;
const CAT_NAME = ['piece', 'weld', 'support', 'steel', 'concrete', 'equipment'];
interface Obj {
  i: number; cat: number; model: string; line: string; tag: string; kind: string; key?: string;
  tpl: Tpl; T: M4; inv: M4; box: number[];
  lineKey: string; tagKey: string; spool?: string; ports?: number[]; ax?: [V3, V3]; joins?: [string, string]; onRun?: string;
  endSpools?: Set<string>; struct?: string; equip?: string; baseEquip?: string; nozzleEquip?: string; planted?: boolean; pen?: boolean;
  /** a support: the point it carries its line at (its record's `at`, world); the nozzles its line ends at (and a spool's other half) */
  at?: V3; endNoz?: Set<string>;
}
const objs: Obj[] = [], emptyParts: string[] = [];
const addObj = (o: Omit<Obj, 'i' | 'inv' | 'box'>) => { const ob = o as Obj; if (!o.tpl.nT) { emptyParts.push(o.tag); return ob; } ob.i = objs.length; ob.inv = inv4(o.T); ob.box = boxXf(o.tpl.box, o.T); objs.push(ob); return ob; };

// ---- template factories ----------------------------------------------------------------------------------------------
const keyTpl = new Map<string, Tpl>(), partTpl = new Map<PartSpec, Tpl>();
const tm = { valve: 0, tee: 0, other: 0, olet: 0, cells: 0 };
function valveMeshBuild(key: string, cells: number) {
  const [, t, n, c, e] = key.split('|'); setMaxCells(cells);
  try { return buildGeometry(makeValve(`${key}@mesh${cells}`, t as ValveType, Number(n), c as PipeClass, (e as 'SW' | 'TH' | undefined) ?? 'RF')).solids; } finally { setMaxCells(110); }
}
// REVIEW: a disk cache of the valves' 110-cell meshes (they take ~5 min to make; the narrow phase needs them all). It is keyed by a
// hash of every source file under src/catalogue and src/geometry and by the tessellation, so a change to the catalogue or the
// mesher makes a new one; NOCACHE=1 bypasses it. The cache holds only the catalogue's own meshes (positions as float32, which is
// what the narrow phase's BVH uses), nothing from the models.
const CACHE_DIR = (() => {
  if (ENV.NOCACHE === '1') return undefined;
  const files: string[] = []; const walk = (d: string) => { for (const f of readdirSync(d, { withFileTypes: true })) { const q = `${d}/${f.name}`; if (f.isDirectory()) walk(q); else if (/\.ts$/.test(f.name)) files.push(q); } };
  const root = new URL('../../src/', import.meta.url).pathname;   // from this file, wherever it is run from
  for (const d of [`${root}catalogue`, `${root}geometry`]) walk(d.replace(/\/$/, ''));
  const h = createHash('sha1'); for (const f of files.sort()) { h.update(f); h.update(readFileSync(f)); }
  const dir = `${OUT_DIR}/valve-cache/${h.digest('hex').slice(0, 16)}`; mkdirSync(dir, { recursive: true }); return dir;
})();
let cacheHits = 0, cacheMade = 0;
function valveMesh(key: string, cells: number): { name: string; mesh: MeshData }[] {
  const f = CACHE_DIR && cells === 110 ? `${CACHE_DIR}/${key.replace(/[^A-Za-z0-9.]+/g, '_')}.bin` : undefined;
  if (f && existsSync(f)) {
    try {
      const buf = readFileSync(f), hl = buf.readUInt32LE(0), hd = JSON.parse(buf.subarray(4, 4 + hl).toString('utf8')) as { key: string; solids: { name: string; nP: number; nI: number }[] };
      if (hd.key === key) { let o = 4 + hl; o = (o + 3) & ~3; const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer; const out: { name: string; mesh: MeshData }[] = [];
        for (const s of hd.solids) { const P = new Float32Array(ab, o, s.nP); o += 4 * s.nP; const I = new Uint32Array(ab, o, s.nI); o += 4 * s.nI; out.push({ name: s.name, mesh: { positions: P as unknown as number[], indices: I as unknown as number[] } }); }
        cacheHits++; return out; }
    } catch { /* rebuild */ }
  }
  const solids = valveMeshBuild(key, cells);
  if (f) {
    const hd = JSON.stringify({ key, solids: solids.map(s => ({ name: s.name, nP: s.mesh.positions.length, nI: s.mesh.indices.length })) }), hb = Buffer.from(hd, 'utf8'), off = (4 + hb.length + 3) & ~3;
    const tot = off + solids.reduce((a, s) => a + 4 * (s.mesh.positions.length + s.mesh.indices.length), 0), buf = Buffer.alloc(tot); buf.writeUInt32LE(hb.length, 0); hb.copy(buf, 4);
    let o = off; for (const s of solids) { const P = Float32Array.from(s.mesh.positions), I = Uint32Array.from(s.mesh.indices); Buffer.from(P.buffer).copy(buf, o); o += P.byteLength; Buffer.from(I.buffer).copy(buf, o); o += I.byteLength; }
    try { writeFileSync(f, buf); cacheMade++; } catch { /* no cache */ }
  }
  return solids;
}
function tplOfKey(key: string): Tpl {
  let t = keyTpl.get(key); if (t) return t;
  const t0 = performance.now(), pre = key.split('|')[0];
  if (pre === 'PIPE') {   // the pipe's outer cylinder, filled (the bore is the line's own fluid)
    const p = partFromKey(key), OD = p.dims.OD.value, L = p.length!.value;
    // REVIEW FIX: the 48-gon inscribed in the pipe's circle lies up to 0.0021 r inside it (0.021 in at 20 in, 0.05 in at 48 in, more
    // than the 0.02 in noise depth); from 18 in up a 96-gon is used (0.0005 r)
    t = makeTpl(key, [{ name: 'pipe (filled)', mesh: extrude({ outer: circle(0, 0, OD / 2, OD >= 18 ? 96 : 48) }, L) }]); tm.other += performance.now() - t0;
  } else if (pre === 'TEE') {   // the catalogue tee's outer blend (SW-FIT-2), filled
    const a = key.split('|'), NPS = Number(a[1]), cls = a[2] as PipeClass, bN = a[3] !== undefined ? Number(a[3]) : NPS;
    const p = pipeDims(NPS, cls), q = pipeDims(bN, cls), C = teeC(p.OD), k = Math.max(0.1, 0.12 * q.OD);
    const f = blend(k, cylZ(p.OD / 2, -C, C), cylY(q.OD / 2, 0, C)), mn: V3 = [-p.OD / 2 - 0.2, -p.OD / 2 - 0.2, -C - 0.05], mx: V3 = [p.OD / 2 + 0.2, C + 0.05, C + 0.05];
    const span = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]);
    t = makeTpl(key, [{ name: 'tee (filled)', mesh: polygonize(f, mn, mx, span / 50) }]); tm.tee += performance.now() - t0;
  } else if (pre === 'VLV') {
    t = makeTpl(key, valveMesh(key, VALVE_BOUND)); t.sdf = { key, level: VALVE_BOUND }; if (VALVE_BOUND_PAD) for (let a = 0; a < 3; a++) { t.box[a] -= VALVE_BOUND_PAD; t.box[3 + a] += VALVE_BOUND_PAD; } tm.valve += performance.now() - t0;
  } else {
    t = makeTpl(key, buildGeometry(partFromKey(key)).solids); if (pre === 'OLET') tm.olet += performance.now() - t0; else tm.other += performance.now() - t0;
  }
  const dt = performance.now() - t0; if (dt > 1500) log(`  slow template ${key}: ${(dt / 1000).toFixed(1)}s, ${t.nT} tris`);
  keyTpl.set(key, t); return t;
}
const tplOfPart = (p: PartSpec): Tpl => { let t = partTpl.get(p); if (!t) { const t0 = performance.now(); t = makeTpl(`${p.kind}:${p.designation ?? p.id}`, buildGeometry(p).solids); partTpl.set(p, t); tm.cells += performance.now() - t0; } return t; };
let fineSpent = 0, fineCount = 0, workSpent = 0, workCount = 0;
function remesh(t: Tpl, cells: number) {
  const nt = makeTpl(t.name, valveMesh(t.sdf!.key, cells)); tpls.pop();
  Object.assign(t, { ...nt, id: t.id, bvh: undefined, parity: undefined, sdf: { key: t.sdf!.key, level: cells } });
}
/** a valve in a tested pair: its working tessellation */
function workValve(t: Tpl) { if (!t.sdf || t.sdf.level >= VALVE_CELLS) return; const t0 = performance.now(); remesh(t, VALVE_CELLS); workSpent += performance.now() - t0; workCount++; }
/** re-mesh a valve at the catalogue default; returns true when the template changed */
function refineValve(t: Tpl): boolean {
  if (!t.sdf || t.sdf.level >= VALVE_FINE || fineSpent > FINE_BUDGET_S * 1000) return false;
  const t0 = performance.now(); remesh(t, VALVE_FINE); fineSpent += performance.now() - t0; fineCount++; return true;
}

// ---- load ------------------------------------------------------------------------------------------------------------
interface Comp { tag: string; kind: string; key: string; T: M4; a: V3; b: V3; NPS: number; cls: string; onRun?: string; ins?: [number, number] }
interface Model { lines: { no: string; from: string; to: string; kind: string; comps: Comp[]; side?: Comp[]; pens?: Comp[]; supports: { id: string; line: string; type: string; key: string; T: M4; at: V3 }[]; welds: { id: string; line: string; type: string; key: string; T: M4; joins: [string, string] }[] }[]; nozzles: { id: string; equip: string; comps: Comp[]; welds: { id: string; key: string; T: M4; joins: [string, string]; type: string }[] }[] }
const readJ = (f: string) => JSON.parse(readFileSync(`${MODELS}/${f}`, 'utf8'));
const site = cells();
log(`cells() ${site.length} cells`);
const unitCell = (u: number) => site.find(c => c.plot.unit === u && c.plot.kind === 'unit')!;
const MODEL_T = new Map<string, M4>();
for (let u = 11; u <= 19; u++) { const c = unitCell(u); MODEL_T.set(`unit-${u}`, unitToPipeway(c.plot, c.cell)); }
MODEL_T.set('pipeway', [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
const cwWay = (() => { try { const z = JSON.parse(readFileSync(`${MODELS}/cooling-water.report.json`, 'utf8')).way?.centreZ; return typeof z === 'number' ? z : CWM.way; } catch { return CWM.way; } })();
if (cwWay !== CWM.way) log(`WARNING: the cooling water report's way ${cwWay} differs from CWM.way ${CWM.way}; using the report's (the frame its model was made in)`);
MODEL_T.set('cooling-water', translate(0, 0, cwWay));   // z_pipeway = z_area + CWM.way
const models = new Map<string, Model>();
for (const name of MODEL_T.keys()) models.set(name, readJ(`${name}.json`));
log('models loaded', [...models].map(([k, m]) => `${k}:${m.lines.length}L/${m.nozzles.length}N`).join(' '));

// nozzle spools by id, for lines' end connections
const nozzleEquip = new Map<string, string>();   // nozzle id -> equip (spool tag), plant-wide
const nozLineKey = new Map<string, string>();    // nozzle id -> the lineKey its pieces carry
for (const [mn, m] of models) for (const n of m.nozzles) { nozzleEquip.set(n.id, n.equip); nozLineKey.set(n.id, `${mn}|nozzle ${n.id}`); }
/** the nozzles a line ends at, with the other half of a limit spool (its -P and -U nozzles are one spool body) */
const endNozzles = (from: string, to: string) => { const s = new Set<string>(); for (const e of [from, to]) if (nozLineKey.has(e)) { s.add(e); const m = /^(.*)-([PU])$/.exec(e); if (m) { const o = `${m[1]}-${m[2] === 'P' ? 'U' : 'P'}`; if (nozLineKey.has(o) && nozzleEquip.get(o) === nozzleEquip.get(e)) s.add(o); } } return s; };

const dist = (a: ArrayLike<number>, b: ArrayLike<number>, ia = 0, ib = 0) => Math.hypot(a[ia] - b[ib], a[ia + 1] - b[ib + 1], a[ia + 2] - b[ib + 2]);
function pieceObj(model: string, M: M4, c: Comp, line: string, extra: Partial<Obj>): Obj {
  const tpl = tplOfKey(c.key), T = multiply(M, c.T), a = xfp(M, c.a), b = xfp(M, c.b);
  const ports = c.kind === 'studs' ? [] : [...a, ...b];
  if (c.kind === 'tee') { const C = Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1], c.b[2] - c.a[2]) / 2, br = [T[12] + T[4] * C, T[13] + T[5] * C, T[14] + T[6] * C]; ports.push(...br); }
  return addObj({ cat: CAT.piece, model, line, tag: c.tag, kind: c.kind, key: c.key, tpl, T, lineKey: `${model}|${line}`, tagKey: `${model}|${c.tag}`, ports, ax: [a, b], ...(c.onRun ? { onRun: `${model}|${c.onRun}` } : {}), ...extra });
}
const tLoad0 = Date.now();
for (const [model, m] of models) {
  const M = MODEL_T.get(model)!;
  for (const l of m.lines) {
    const ends = new Set<string>(); for (const e of [l.from, l.to]) { const q = nozzleEquip.get(e); if (q) ends.add(q); }
    const endNoz = endNozzles(l.from, l.to);
    for (const c of [...l.comps, ...(l.side ?? [])]) pieceObj(model, M, c, l.no, {});
    for (const c of l.pens ?? []) pieceObj(model, M, c, l.no, { pen: true });
    for (const s of l.supports) addObj({ cat: CAT.support, model, line: s.line ?? l.no, tag: s.id, kind: s.type, key: s.key, tpl: tplOfKey(s.key), T: multiply(M, s.T), lineKey: `${model}|${s.line ?? l.no}`, tagKey: `${model}|${s.id}`, endSpools: ends, endNoz, at: xfp(M, s.at) });
    for (const w of l.welds) addObj({ cat: CAT.weld, model, line: l.no, tag: w.id, kind: `weld ${w.type}`, key: w.key, tpl: tplOfKey(w.key), T: multiply(M, w.T), lineKey: `${model}|${l.no}`, tagKey: `${model}|${w.id}`, joins: [`${model}|${w.joins[0]}`, `${model}|${w.joins[1]}`] });
  }
  log(`  ${model}: lines done (${objs.length} objects, ${keyTpl.size} templates)`);
  for (const n of m.nozzles) {
    for (const c of n.comps) pieceObj(model, M, c, `nozzle ${n.id}`, { spool: n.equip, nozzleEquip: n.equip });
    for (const w of n.welds) addObj({ cat: CAT.weld, model, line: `nozzle ${n.id}`, tag: w.id, kind: `weld ${w.type}`, key: w.key, tpl: tplOfKey(w.key), T: multiply(M, w.T), lineKey: `${model}|nozzle ${n.id}`, tagKey: `${model}|${w.id}`, joins: [`${model}|${w.joins[0]}`, `${model}|${w.joins[1]}`], spool: n.equip, nozzleEquip: n.equip });
  }
}
const nPiping = objs.length;
log(`piping objects ${nPiping} (templates ${keyTpl.size}; valve ${(tm.valve / 1000).toFixed(1)}s tee ${(tm.tee / 1000).toFixed(1)}s olet ${(tm.olet / 1000).toFixed(1)}s other ${(tm.other / 1000).toFixed(1)}s) in ${((Date.now() - tLoad0) / 1000).toFixed(1)}s`);

// ---- statics ---------------------------------------------------------------------------------------------------------
const CIVIL = new Set(['CONCRETE', 'FOOTING', 'PEDESTAL', 'PAD', 'SLAB', 'OCTAGON', 'RINGWALL', 'PIER', 'GRADE_BEAM', 'GROUT', 'CURB', 'PAVING', 'TRENCH', 'SUMP', 'DIKE', 'PILE_CAP', 'RETAINING_WALL', 'MANHOLE', 'SLEEPER', 'MACHINE_BLOCK', 'TABLE_TOP', 'BASIN', 'CULVERT', 'DUCT_BANK']);
const EQ_TAG = /^([A-Z]+-\d+[A-Z]?)(-deck|-stair)?$/;
function staticObj(model: string, M: M4, pl: { part: PartSpec; transform: M4; tags: string[] }, struct: string) {
  if (pl.tags.includes('keep-out')) return;
  const isEq = pl.tags.includes('equipment'), m = EQ_TAG.exec(pl.tags[0] ?? '');
  const cat = isEq ? CAT.equipment : CIVIL.has(pl.part.kind) || pl.tags.some(t => t === 'pad' || t === 'pedestal' || t === 'pier' || t === 'sleeper') ? CAT.concrete : CAT.steel;
  const equip = isEq ? pl.tags[0] : undefined, baseEquip = !isEq && m ? m[1] : undefined;
  const st = isEq ? `eq:${equip}` : baseEquip ? `eqst:${baseEquip}` : struct;
  addObj({ cat, model, line: '', tag: pl.tags.join('/'), kind: pl.part.kind, tpl: tplOfPart(pl.part), T: multiply(M, pl.transform), lineKey: '', tagKey: `${model}|${pl.tags.join('/')}`, struct: `${model}#${st}`, equip, baseEquip });
}
const structOfCellTags = (tags: string[]) => tags[0]?.startsWith('rack') ? 'rack' : tags[0] ?? 'misc';
for (const { plot, cell } of site) { const M = unitToPipeway(plot, cell); for (const pl of cell.interior.instances) staticObj(`cell ${plot.id}`, M, pl as never, structOfCellTags(pl.tags)); }
log(`cell statics done: ${objs.length - nPiping}`);

// the pipeway's own steel, rebuilt from pipeway.ts's code (rack, stringers, junction frames) and the model's junction list
const pwRep = readJ('pipeway.report.json');
const up = (v: number, s = 6) => Math.ceil(v / s - 1e-9) * s, down = (v: number, s = 6) => Math.floor(v / s + 1e-9) * s;
const LENGTH = PWY.bays * PWY.bent;
const pwOwn: { part: PartSpec; transform: M4; tags: string[] }[] = [];
{
  const kit = interiorKit({ pedestal: PWY.PAD, padHeight: PWY.PAD }, pwOwn as never, {});
  const rack = { x0: PWY.bent, x1: LENGTH - PWY.bent, bentSpacing: PWY.bent, halfWidth: PWY.half, tiers: PWY.tiers, loadPsf: PWY.loadPsf };
  kit.rack({ ...rack, x0: 0, x1: LENGTH } as never);
  const st = makeWideFlange('W8x18', 8, 18, PWY.bent - 12);
  for (const [t, tier] of PWY.tiers.entries()) for (const z of stringersOf(t)) for (let x = 0; x < LENGTH - 1e-6; x += PWY.bent) pwOwn.push({ part: st, transform: frameFromAxes([x + 6, tier - 16, z], [0, 1, 0], [1, 0, 0]), tags: ['rack-stringer', 'beam'] });
  for (const J of pwRep.junctions as { unit: number; x: number; z: number; half: number; tiers: number[] }[]) {
    const span = 2 * J.half, D = up(span / 20, 2), w = up(2.75 * D, 5), Dp = Math.max(10, D - 2), wp = up(2.75 * Dp, 5), z = J.z, tiers = J.tiers;
    const beam = makeWideFlange(`W${D}x${w}`, D, w, span - Dp), post = makeWideFlange(`W${Dp}x${wp}`, Dp, wp, PWY.tiers[tiers[tiers.length - 1]] - PWY.PAD), tag = `junction:U${J.unit}`;
    for (const sx of [-1, 1]) { const x = J.x + sx * J.half; pwOwn.push({ part: kit.concrete('pedestal', Dp + 12, PWY.PAD, Dp + 12), transform: frameFromAxes([x - (Dp + 12) / 2, PWY.PAD / 2, z], [0, 1, 0], [1, 0, 0]), tags: ['junction', tag, 'pad'] }); pwOwn.push({ part: post, transform: multiply(translate(x, PWY.PAD, z), standUp()), tags: ['junction', tag, 'post'] }); }
    for (const t of tiers) pwOwn.push({ part: beam, transform: frameFromAxes([J.x - J.half + Dp / 2, PWY.tiers[t] - D / 2, z], [0, 1, 0], [1, 0, 0]), tags: ['junction', tag, 'beam'] });
  }
}
const I4: M4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
for (const pl of pwOwn) staticObj('pipeway steel', I4, pl, pl.tags[0] === 'junction' ? pl.tags[1] : 'rack');
log(`pipeway steel rebuilt: ${pwOwn.length}`);

// pipe frames of plant 3's own (SW-RPI-17), from each report's frames
let nFrames = 0;
for (const [model, M] of MODEL_T) {
  const f = `${MODELS}/${model}.report.json`; if (!existsSync(f)) continue;
  const rep = JSON.parse(readFileSync(f, 'utf8')); (rep.frames as FrameSpec[] | undefined ?? []).forEach((fs, k) => { nFrames++; for (const pl of framePlaced(fs)) staticObj(`frames ${model}`, M, pl as never, `frame${k}:${fs.line}`); });
}
log(`frames: ${nFrames}`);

// cooling water sleepers, rebuilt from coolingWater.ts's code (SW-CWM-2) with the model's spools and mains
const cwRep = readJ('cooling-water.report.json');
let nSleepers = 0;
{
  const main = cwRep.mains[0] as { NPS: number; cls: PipeClass }, OD = pipeDims(main.NPS, main.cls).OD;
  const fl = designFlange(main.NPS, main.cls).OD, pitch = up(Math.max(fl + 6, gateWidth(main.NPS, main.cls) + 3)), lanes = [0, -pitch];
  const repLanes = (cwRep.mains as { lane: number }[]).map(q => q.lane).sort((a, b) => a - b).join(',');
  if (repLanes !== [...lanes].sort((a, b) => a - b).join(',')) log(`WARNING: rebuilt main lanes ${lanes} differ from the report's ${repLanes}`);
  const sp = cwRep.spools as { tag: string; where: string; at: V3 }[], westX = Math.min(...sp.filter(q => q.where.includes('west')).map(q => q.at[0])), towerX = sp.filter(q => q.where.includes('tower')).map(q => q.at[0]);
  const x0 = down(westX - PWY.bent, PWY.bent), x1 = down(Math.min(...towerX) - CWM.approach);
  const zs0 = Math.min(...lanes) - OD / 2 - CWM.sleeperOver, zs1 = Math.max(...lanes) + OD / 2 + CWM.sleeperOver;
  // the steel a sleeper keeps 3 in from: the pipeway's junction frames and rack, and the units' valve-bay rack steel (as pipeway.ts lists it)
  const steel: number[][] = [];
  for (const pl of pwOwn) if (pl.tags.includes('junction') || pl.tags.some(t => t.startsWith('rack'))) { const b = worldBox(pl.part, pl.transform as never)!; steel.push([b[0][0], b[0][1], b[0][2] - CWM.way, b[1][0], b[1][1], b[1][2] - CWM.way]); }
  for (let u = 11; u <= 19; u++) { const { cell } = unitCell(u), T = MODEL_T.get(`unit-${u}`)!; for (const pl of cell.interior.instances) {
    if (pl.tags.includes('rack-ladder') && pl.transform[12] < RACK.start) continue; if (pl.transform[12] > RACK.start + 12) continue;
    const b0 = worldBox(pl.part, pl.transform as never); if (!b0) continue; if (b0[0][0] > RACK.start - RACK.bent / 2 + 24 || Math.abs((b0[0][2] + b0[1][2]) / 2) > cell.rack.halfWidth + 36) continue;
    if (!pl.tags.some(t => t.startsWith('rack'))) continue; const b = worldBox(pl.part, multiply(T, pl.transform) as never)!; steel.push([b[0][0], b[0][1], b[0][2] - CWM.way, b[1][0], b[1][1], b[1][2] - CWM.way]); } }
  const own: { part: PartSpec; transform: M4; tags: string[] }[] = [], kit = interiorKit({ pedestal: 6, padHeight: 6 }, own as never, {});
  for (let x = x0; x <= x1 - CWM.sleeperW / 2 + 1e-6; x += PWY.bent) {
    const mn = [x - CWM.sleeperW / 2 - 3, 0, zs0 - 3], mx = [x + CWM.sleeperW / 2 + 3, CWM.sleeperTop + 3, zs1 + 3];
    if (steel.some(b => b[0] < mx[0] && b[1] < mx[1] && b[2] < mx[2] && b[3] > mn[0] && b[4] > mn[1] && b[5] > mn[2])) continue;
    own.push({ part: kit.concrete('sleeper', CWM.sleeperW, CWM.sleeperTop, zs1 - zs0), transform: frameFromAxes([x, CWM.sleeperTop / 2, zs0], [0, 1, 0], [0, 0, 1]), tags: ['sleeper', 'pad', `sleeper:${x}`] });
  }
  for (const pl of own) { staticObj('cw sleepers', MODEL_T.get('cooling-water')!, pl, pl.tags[2]); nSleepers++; }
  if (nSleepers !== cwRep.sleepers) log(`WARNING: rebuilt ${nSleepers} sleepers, the report says ${cwRep.sleepers}`);
}
log(`sleepers: ${nSleepers}; objects ${objs.length}; templates ${tpls.length}`);

// ---- planted clashes (PLANT=1): copies of pipeway pipes moved 2 in into a neighbouring line's pipe, and 2 in into a tier beam
const planted: { obj: Obj; target: string; expect: string }[] = [];
if (PLANT) {
  const pw = objs.filter(o => o.model === 'pipeway' && o.kind === 'pipe' && o.ax && Math.abs(o.ax[1][0] - o.ax[0][0]) > 200 && Math.abs(o.ax[1][1] - o.ax[0][1]) < 1e-6 && Math.abs(o.ax[1][2] - o.ax[0][2]) < 1e-6);
  const r = (o: Obj) => partFromKey(o.key!).dims.OD.value / 2;
  let best: { p: Obj; q: Obj; gap: number } | undefined;
  for (const p of pw) for (const q of pw) {
    if (q.line === p.line || Math.abs(q.ax![0][1] - p.ax![0][1]) > 1e-6) continue;
    const ov = Math.min(Math.max(p.ax![0][0], p.ax![1][0]), Math.max(q.ax![0][0], q.ax![1][0])) - Math.max(Math.min(p.ax![0][0], p.ax![1][0]), Math.min(q.ax![0][0], q.ax![1][0])); if (ov < 120) continue;
    const gap = Math.abs(q.ax![0][2] - p.ax![0][2]) - r(p) - r(q); if (gap > 0.5 && (!best || gap < best.gap)) best = { p, q, gap };
  }
  if (best) {
    const dz = Math.sign(best.q.ax![0][2] - best.p.ax![0][2]) * (best.gap + 2), T = multiply(translate(0, 0, dz), best.p.T);
    const o = addObj({ cat: CAT.piece, model: 'planted', line: `PLANT-1 (copy of ${best.p.tag}, moved ${dz.toFixed(3)} in z)`, tag: 'PLANT-1', kind: 'pipe', key: best.p.key, tpl: best.p.tpl, T, lineKey: 'planted|1', tagKey: 'planted|PLANT-1', ports: [], planted: true });
    planted.push({ obj: o, target: best.q.tag, expect: `${best.q.tag} (line ${best.q.line}) ~2 in` });
  }
  // a pipe on a tier pushed down 6 in: its bottom, 4 in above the tier's beams on its shoes, then 2 in into them
  const lift = (p: Obj) => { const b = p.ax![0][1] - r(p); return Math.min(...PWY.tiers.map(t => (b - t >= 4 - 1e-6 && b - t < 12 ? b - t : Infinity))); };
  const overBent = (p: Obj) => { const x0 = Math.min(p.ax![0][0], p.ax![1][0]) + 12, x1 = Math.max(p.ax![0][0], p.ax![1][0]) - 12; return Math.ceil(x0 / PWY.bent) * PWY.bent < x1; };
  const onTier = pw.find(p => isFinite(lift(p)) && overBent(p) && p !== best?.p && p.line !== best?.q.line);
  if (onTier) {
    const dy = -(lift(onTier) + 2);
    const o = addObj({ cat: CAT.piece, model: 'planted', line: `PLANT-2 (copy of ${onTier.tag}, moved ${dy.toFixed(3)} in y)`, tag: 'PLANT-2', kind: 'pipe', key: onTier.key, tpl: onTier.tpl, T: multiply(translate(0, dy, 0), onTier.T), lineKey: 'planted|2', tagKey: 'planted|PLANT-2', ports: [], planted: true });
    planted.push({ obj: o, target: 'beam', expect: 'a rack tier beam ~2 in' });
  }
  // REVIEW: PLANT-3, today's defect class: a 4 in pipe laid along a unit's limit spool (a nozzle piece of another model), its
  // surface 0.5 in into the spool's flange ring
  const fl = objs.find(o => o.model === 'unit-12' && o.nozzleEquip?.startsWith('BL-') && o.kind === 'flange' && o.ax && Math.abs(o.ax[1][2] - o.ax[0][2]) > 1);
  if (fl) {
    const [a, b] = fl.ax!, L = dist(a, b), u: V3 = [(b[0] - a[0]) / L, (b[1] - a[1]) / L, (b[2] - a[2]) / L], kk = fl.key!.split('|'), fd = designFlange(Number(kk[1]), kk[2] as PipeClass);
    const off = fd.OD / 2 + 2 - 0.5, mid: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - off, (a[2] + b[2]) / 2], key = 'PIPE|4|P150|48', s0: V3 = [mid[0] - 24 * u[0], mid[1] - 24 * u[1], mid[2] - 24 * u[2]];
    const o = addObj({ cat: CAT.piece, model: 'planted', line: `PLANT-3 (4 in pipe along ${fl.tag}, 0.5 in into its flange ring)`, tag: 'PLANT-3', kind: 'pipe', key, tpl: tplOfKey(key), T: frameFromAxes(s0, [0, 1, 0], u) as M4, lineKey: 'planted|3', tagKey: 'planted|PLANT-3', ports: [], planted: true });
    planted.push({ obj: o, target: fl.tag, expect: `${fl.tag} (spool ${fl.nozzleEquip}, ${fl.model}) ~0.5 in` });
  }
  log(`planted: ${planted.map(p => `${p.obj.line} -> ${p.expect}`).join('; ')}`);
}

const tagObj = new Map<string, Obj>(); for (const o of objs) if (o.tagKey && !tagObj.has(o.tagKey)) tagObj.set(o.tagKey, o);
const lineObjs = new Map<string, Obj[]>(); for (const o of objs) if (o.lineKey) { const l = lineObjs.get(o.lineKey); if (l) l.push(o); else lineObjs.set(o.lineKey, [o]); }
// ---- relations (the contact policy) ----------------------------------------------------------------------------------
const MODE = { SKIP: 0, TEST: 1, FACE: 2, BEARING: 3, STUDS: 4, INSIDE: 5 } as const;
const STACK = new Set(['flange', 'blind', 'gasket', 'valve', 'spade', 'spectacle']);
const isPiping = (o: Obj) => o.cat <= CAT.support;
function portsMeet(a: Obj, b: Obj): boolean {
  const p = a.ports, q = b.ports; if (!p || !q) return false;
  for (let i = 0; i < p.length; i += 3) for (let j = 0; j < q.length; j += 3) if (dist(p, q, i, j) <= PORT_TOL) return true;
  return false;
}
/** a stud set and a piece of the joint it bolts (coaxial with the studs, overlapping their span) */
function studsThrough(s: Obj, q: Obj): boolean {
  if (s.kind !== 'studs' || !STACK.has(q.kind) || !s.ax || !q.ax) return false;
  const [a, b] = s.ax, L = dist(a, b); if (L < 1e-6) return false; const u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L, (b[2] - a[2]) / L];
  const off = (p: V3) => { const t = (p[0] - a[0]) * u[0] + (p[1] - a[1]) * u[1] + (p[2] - a[2]) * u[2]; return { t, d: Math.hypot(p[0] - a[0] - u[0] * t, p[1] - a[1] - u[1] * t, p[2] - a[2] - u[2] * t) }; };
  const qa = off(q.ax[0]), qb = off(q.ax[1]); if (qa.d > PORT_TOL || qb.d > PORT_TOL) return false;
  return Math.max(qa.t, qb.t) > -PORT_TOL && Math.min(qa.t, qb.t) < L + PORT_TOL;
}
/** the joint-stack pieces of the stud set's own line that it bolts through */
const stackCache = new Map<Obj, number[]>(); let stackStuds = 0;
function stackPieces(st: Obj): number[] {
  let r = stackCache.get(st); if (r) return r;
  r = (lineObjs.get(st.lineKey) ?? []).filter(q => q.cat === CAT.piece && studsThrough(st, q)).map(q => q.i); stackCache.set(st, r); return r;
}
const boxDist = (p: ArrayLike<number>, b: ArrayLike<number>) => Math.hypot(Math.max(0, b[0] - p[0], p[0] - b[3]), Math.max(0, b[1] - p[1], p[1] - b[4]), Math.max(0, b[2] - p[2], p[2] - b[5]));
/** REVIEW FIX: a support carries the pieces of its line nearest its `at` point, not every piece of its line. The original excused a
 *  support against every piece and weld of its own line, and against every nozzle piece of any equipment or spool its line ends
 *  at, at any depth (so a hanger rod through another run of its own line, or a shoe in another nozzle of the same vessel, was
 *  never tested). Now: the pieces (and welds) of its own line and of the nozzles its line ends at whose box lies within CARRY_D of
 *  the nearest such piece's distance from its `at` point. */
const carryMin = new Map<Obj, number>();
function carries(S: Obj, P: Obj): boolean {
  if (!S.at) return true;
  let d0 = carryMin.get(S);
  if (d0 === undefined) {
    d0 = Infinity; const cand = [...(lineObjs.get(S.lineKey) ?? [])]; for (const id of S.endNoz ?? []) cand.push(...(lineObjs.get(nozLineKey.get(id)!) ?? []));
    for (const q of cand) if (q.cat === CAT.piece || q.cat === CAT.weld) d0 = Math.min(d0, boxDist(S.at, q.box));
    carryMin.set(S, d0);
  }
  if (boxDist(S.at, P.box) <= d0 + CARRY_D) return true;
  // a weld of a piece it carries (a dummy leg drawn up to its elbow's end touches the elbow's girth weld there)
  if (P.cat === CAT.weld && P.joins) for (const j of P.joins) { const q = tagObj.get(j); if (q && q !== P && q.cat === CAT.piece && (q.lineKey === S.lineKey || q.line.startsWith('nozzle ')) && boxDist(S.at, q.box) <= d0 + CARRY_D) return true; }
  return false;
}
function relate(A: Obj, B: Obj): { mode: number; why: string } {
  if (A.planted || B.planted) return { mode: MODE.TEST, why: 'planted' };
  if (STRUCT) {
    if (isPiping(A) || isPiping(B) || A.struct !== B.struct) return { mode: MODE.SKIP, why: 'not within one structure (STRUCT)' };
    if (THROUGH_KIND.has(A.kind) || THROUGH_KIND.has(B.kind) || [A, B].some(o => o.tag.split('/').some(t => /^(bolt|anchor-rod|weld|bolted-rod)$/.test(t)))) return { mode: MODE.SKIP, why: 'bolt, rod or weld within its structure' };
    return { mode: MODE.INSIDE, why: 'within one structure' };
  }
  const pa = isPiping(A), pb = isPiping(B);
  if (pa && pb) {
    let why = '';
    for (const [x, y] of [[A, B], [B, A]] as const) {
      if (x.cat === CAT.weld && x.joins && (x.joins[0] === y.tagKey || x.joins[1] === y.tagKey)) return { mode: MODE.SKIP, why: 'weld joins' };
      if (x.cat === CAT.support && y.cat !== CAT.support && (y.lineKey === x.lineKey || (y.line.startsWith('nozzle ') && x.endNoz?.has(y.line.slice(7))))) {
        if (carries(x, y)) return { mode: MODE.SKIP, why: 'support on its line' };
        why = y.lineKey === x.lineKey ? 'support vs its own line away from where it carries it' : 'support vs the nozzle its line ends at, away from where it carries it';
      }
      // REVIEW FIX: an olet sits on the run piece under its base point, not on every piece of its run line
      if (x.kind === 'olet' && x.onRun && y.lineKey === x.onRun && x.ax && Math.min(boxDist(x.ax[0], y.box), boxDist(x.ax[1], y.box)) <= PORT_TOL) return { mode: MODE.SKIP, why: 'olet on its run' };   // (its port on the run's axis is a or b, by the line's direction)
      // REVIEW FIX: a stud set bolts through a valve's end flanges, not its body, bonnet or operator: a flanged valve is tested and
      // only its end flanges and raised faces are excused (a wafer or lugged butterfly body lies between the flanges, inside the studs)
      if (x.kind === 'studs' && studsThrough(x, y)) return y.kind === 'valve' && !/^VLV\|(BFLY|LBFLY|DBFLY)\|/.test(y.key ?? '') ? { mode: MODE.STUDS, why: 'studs through a valve\'s end flange' } : { mode: MODE.SKIP, why: 'studs through joint' };
      if (x.kind === 'studs' && y.kind === 'studs' && x.lineKey === y.lineKey && stackPieces(x).some(q => stackPieces(y).includes(q))) { stackStuds++; return { mode: MODE.SKIP, why: 'stud sets of one joint stack' }; }
      if (x.pen && y.lineKey === x.lineKey) return { mode: MODE.SKIP, why: 'line through its sleeve' };
    }
    if (A.cat === CAT.piece && B.cat === CAT.piece && portsMeet(A, B)) return { mode: MODE.SKIP, why: 'joined end to end' };
    return { mode: MODE.TEST, why: why || (A.lineKey === B.lineKey ? 'same line, not adjacent' : A.model === B.model ? 'other line' : 'other model') };
  }
  if (pa !== pb) {
    const p = pa ? A : B, s = pa ? B : A;
    if (p.nozzleEquip && s.equip === p.nozzleEquip) return { mode: MODE.SKIP, why: 'nozzle on its equipment' };
    if (p.cat === CAT.support) return { mode: MODE.BEARING, why: 'support bearing' };
    return { mode: MODE.TEST, why: `piping vs ${CAT_NAME[s.cat]}` };
  }
  // static vs static
  if (A.struct === B.struct) return { mode: MODE.SKIP, why: 'one structure' };
  if (A.model === B.model && ((A.equip && B.baseEquip === A.equip) || (B.equip && A.baseEquip === B.equip))) return { mode: MODE.SKIP, why: 'equipment on its foundation' };
  if (A.cat === CAT.equipment && B.cat === CAT.equipment) return { mode: MODE.TEST, why: 'equipment vs equipment' };
  // the cooler deck is the structure a cell builds to carry its air coolers: an air cooler stands on it
  for (const [e, d] of [[A, B], [B, A]] as const) if (e.model === d.model && e.kind === 'AIR_COOLER' && d.struct === `${d.model}#cooler-deck`) return { mode: MODE.FACE, why: 'air cooler on its cooler deck' };
  return { mode: MODE.FACE, why: 'static vs static' };
}
/** a support's bearing solids (where it sits on or hangs from steel or concrete, as the catalogue draws it): a hanger's or
 *  trapeze's top plate(s), a shoe's base, a stanchion's or trunnion's base plate. Each closed shell of them gives a point
 *  (its box centre) and its half-thickness: the member or floor at that point is the one the support bears on. */
const BEAR_SOLID = /^(top plate|shoe base|base plate)/;
const attCache = new Map<Tpl, { p: V3; tol: number }[]>();
/** each bearing shell's point: for a hanger or trapeze its plate's centre; for a shoe, stanchion or trunnion the centre of its
 *  base's underside (the supports' local y is up) */
function attachments(t: Tpl, base: boolean): { p: V3; tol: number }[] {
  let a = attCache.get(t); if (a) return a; a = [];
  for (let c = 0; c < t.nComp; c++) { if (!BEAR_SOLID.test(t.solidNames[t.compSolid[c]] ?? '')) continue; const b = t.compBox.subarray(6 * c, 6 * c + 6);
    a.push({ p: [(b[0] + b[3]) / 2, base ? b[1] : (b[1] + b[4]) / 2, (b[2] + b[5]) / 2], tol: base ? 0 : Math.min(b[3] - b[0], b[4] - b[1], b[5] - b[2]) / 2 }); }
  attCache.set(t, a); return a;
}
/** is M the member or floor the support bears on or hangs from (whatever the overlap's depth: that contact is meant; its
 *  depth is listed). A hanger's or trapeze's plate lies within the envelope of the member it hangs from (on its underside,
 *  or between a beam's flanges with the rod up through the lower one); a shoe's, stanchion's or trunnion's base has its
 *  underside within M's envelope and in M's upper half (on its top face, or sunk into it from above). A base at the bottom
 *  of a pad (a post standing on grade through it) or a rod through a member short of the one it hangs from does not count. */
/** REVIEW FIX: what a support may bear on or hang from at all: a structural member, a frame, a floor or concrete; never bracing,
 *  a ladder or cage, a guardrail or handrail, a tread, a bolt, anchor rod, weld, clip, end or base plate, nor an equipment body.
 *  (The original accepted any static whose box held the bearing point: 12 hanger top plates cut by rack bracing rods were excused.) */
const NOT_BEARABLE_TAG = /^(bracing|bolted-rod|ladder|rack-ladder|cage|guardrail|handrail|tread|bolt|anchor-rod|weld|clip|end-plate|base-plate)$/;
const NOT_BEARABLE_KIND = new Set(['ROD', 'BOLT', 'ANCHOR_ROD', 'FILLET_WELD', 'FILLET_WELD_AROUND', 'CAGE_HOOP', 'BASE_PLATE', 'GRATING_TREAD']);
const bearable = (M: Obj) => (M.cat === CAT.steel || M.cat === CAT.concrete) && !NOT_BEARABLE_KIND.has(M.kind) && !M.tag.split('/').some(t => NOT_BEARABLE_TAG.test(t));
function bearsOn(sup: Obj, M: Obj): boolean {
  if (!bearable(M)) return false;
  const hangs = sup.kind === 'hanger' || sup.kind === 'trapeze', mb = M.tpl.box;
  for (const a of attachments(sup.tpl, !hangs)) { const w = xfp(sup.T, a.p), l = xfp(M.inv, w), e = a.tol + FACE;
    if (!(l[0] > mb[0] - e && l[0] < mb[3] + e && l[1] > mb[1] - e && l[1] < mb[4] + e && l[2] > mb[2] - e && l[2] < mb[5] + e)) continue;
    if (hangs) return true;
    if (w[1] >= (M.box[1] + M.box[4]) / 2 - FACE && w[1] <= M.box[4] + FACE) return true; }
  return false;
}

// ---- broad phase -----------------------------------------------------------------------------------------------------
const tB0 = Date.now();
const G = 60, gKey = (x: number, y: number, z: number) => ((x + 1000) * 2048 + (y + 1000)) * 4096 + (z + 1000);
const grid = new Map<number, number[]>();
const padOf = (o: Obj) => (o.cat <= CAT.support ? CLEAR / 2 : 0);
for (const o of objs) {
  const pd = padOf(o), b = [o.box[0] - pd, o.box[1] - pd, o.box[2] - pd, o.box[3] + pd, o.box[4] + pd, o.box[5] + pd], x0 = Math.floor(b[0] / G), x1 = Math.floor(b[3] / G), y0 = Math.floor(b[1] / G), y1 = Math.floor(b[4] / G), z0 = Math.floor(b[2] / G), z1 = Math.floor(b[5] / G);
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) { const k = gKey(x, y, z); let l = grid.get(k); if (!l) grid.set(k, l = []); l.push(o.i); }
}
const pairs: number[] = []; let nCand = 0, nNearCand = 0;
for (const [k, l] of grid) {
  if (l.length < 2) continue;
  const cz = (k % 4096) - 1000, cy = (Math.floor(k / 4096) % 2048) - 1000, cx = Math.floor(k / 4096 / 2048) - 1000;
  for (let i = 0; i < l.length; i++) { const A = objs[l[i]], a = A.box, pa = padOf(A); for (let j = i + 1; j < l.length; j++) { const B = objs[l[j]], b = B.box, pb = padOf(B);
    const ox = Math.min(a[3], b[3]) - Math.max(a[0], b[0]), oy = Math.min(a[4], b[4]) - Math.max(a[1], b[1]), oz = Math.min(a[5], b[5]) - Math.max(a[2], b[2]);
    const real = ox > NOISE && oy > NOISE && oz > NOISE, near = pa > 0 && pb > 0 && A.model !== B.model && ox > -CLEAR && oy > -CLEAR && oz > -CLEAR;
    if (!real && !near) continue;
    // owner cell: the one holding the padded overlap's min corner
    if (Math.floor(Math.max(a[0] - pa, b[0] - pb) / G) !== cx || Math.floor(Math.max(a[1] - pa, b[1] - pb) / G) !== cy || Math.floor(Math.max(a[2] - pa, b[2] - pb) / G) !== cz) continue;
    pairs.push(l[i], l[j]); nCand++; if (!real) nNearCand++; } }
}
grid.clear();
log(`broad phase: ${nCand} pairs (${nNearCand} of them only within ${CLEAR} in, for the near-miss list) in ${((Date.now() - tB0) / 1000).toFixed(1)}s`);

// ---- narrow phase ----------------------------------------------------------------------------------------------------
interface Finding { a: { model: string; line: string; tag: string; kind: string }; b: { model: string; line: string; tag: string; kind: string }; depthIn: number; at: V3; note: string }
const findings: Finding[] = [];
const excusedBearing: { support: Finding['a']; member: Finding['a']; depthIn: number; at: V3; solids: string }[] = [];
const nearMiss: { a: Finding['a']; b: Finding['a']; clearanceIn: number; at: V3 }[] = [];
const excusedFounded: { upper: Finding['a']; lower: Finding['a']; depthIn: number; at: V3 }[] = [];
/** REVIEW: overlaps that were not reported, with why, so nothing is dropped silently: crossings shallower than the noise depth, and
 *  static or support contacts of a shared face (0.05 in) */
const dropped: { a: Finding['a']; b: Finding['a']; depthIn: number; at: V3; why: string }[] = [];
const drop = (A: Obj, B: Obj, r: PairOut, why: string) => { const [p, q] = order(A, B); dropped.push({ a: desc(p), b: desc(q), depthIn: Math.round(r.depth * 10000) / 10000, at: r.at.map(v => Math.round(v * 100) / 100) as V3, why: `${why} (${r.hits ? `${r.hits} triangle crossings` : 'containment'})` }); };
const stats = { studsOk: 0, foundedOk: 0, skip: new Map<string, number>(), tested: 0, intersect: 0, contained: 0, noise: 0, bearingOk: 0, faceOk: 0, refined: 0 };
const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
const desc = (o: Obj) => ({ model: o.model, line: o.line, tag: o.tag, kind: o.kind });
const order = (A: Obj, B: Obj) => (A.cat <= B.cat ? [A, B] : [B, A]);
const tN0 = Date.now(); let lastLog = Date.now(), tEval = 0, tNear = 0;
function judge(A: Obj, B: Obj, mode: number, why: string): Finding | null {
  for (const o of [A, B]) workValve(o.tpl);
  let t0 = performance.now(), r = evaluate(A, B); tEval += performance.now() - t0;
  // a cast valve body in a close call (shallow crossing, or within 0.25 in): re-mesh it at the catalogue default and look again
  if ((A.tpl.sdf && A.tpl.sdf.level < VALVE_FINE) || (B.tpl.sdf && B.tpl.sdf.level < VALVE_FINE)) {   // (dev only: with a coarser working mesh)
    t0 = performance.now(); const close = r ? r.depth < 0.25 : narrow(A.tpl, B.tpl, multiply(A.inv, B.T), 1.0).near; tEval += performance.now() - t0;
    if (close) { let ch = false; for (const o of [A, B]) if (o.tpl.sdf && refineValve(o.tpl)) ch = true; if (ch) { stats.refined++; t0 = performance.now(); r = evaluate(A, B); tEval += performance.now() - t0; } }
  }
  if (!r) return null;
  if (r.hits) stats.intersect++; else stats.contained++;
  if (r.depth < NOISE) { stats.noise++; drop(A, B, r, `${why}: shallower than ${NOISE} in`); return null; }
  const fine = [A, B].filter(o => o.tpl.sdf).map(o => `${o.tag} valve mesh at ${o.tpl.sdf!.level} cells`).join(', ');
  let note = `${why}: ${r.hits ? `${r.hits >= HIT_CAP ? '>=' : ''}${r.hits} triangle crossings` : 'one solid inside the other'}`;
  if (mode === MODE.INSIDE) {
    if (r.depth <= FACE) { stats.faceOk++; drop(A, B, r, `${why}: a shared face (${FACE} in)`); return null; }
    note += `; deeper than a shared face (${FACE} in), within one structure`;
  }
  if (mode === MODE.FACE) {
    if (r.depth <= FACE) { stats.faceOk++; drop(A, B, r, `${why}: a shared face (${FACE} in)`); return null; }
    // founded on: one stands on the other, the overlap at the upper one's underside and the lower one's top
    const [lo, hi] = A.box[4] <= B.box[4] ? [A, B] : [B, A];
    if (why === 'air cooler on its cooler deck' || (lo.box[4] <= hi.box[1] + r.depth + FACE && r.at[1] <= hi.box[1] + r.depth + FACE && r.at[1] >= lo.box[4] - r.depth - FACE)) {
      stats.foundedOk++; excusedFounded.push({ upper: desc(hi), lower: desc(lo), depthIn: Math.round(r.depth * 1000) / 1000, at: r.at.map(v => Math.round(v * 100) / 100) as V3 }); return null; }
    note += `; deeper than a shared face (${FACE} in) and not one standing on the other`;
  }
  if (mode === MODE.STUDS) {
    const v = A.kind === 'valve' ? A : B, sd = v === A ? r.solidDepthA : r.solidDepthB, bad = [...sd].filter(([q, d]) => d >= NOISE && !/^(end flange|raised face)/.test(v.tpl.solidNames[q] ?? ''));
    if (!bad.length) { stats.studsOk++; return null; }
    note += `; the stud set reaches the valve's ${bad.map(([q, d]) => `${v.tpl.solidNames[q]} ${d.toFixed(2)} in`).join(', ')}`;
  }
  if (mode === MODE.BEARING) {
    const sup = A.cat === CAT.support ? A : B, mem = sup === A ? B : A, sd = sup === A ? r.solidDepthA : r.solidDepthB;
    // a pipe frame built for this support's own line (SW-RPI-17) carries it; otherwise the member at its bearing solid
    const ownFrame = mem.model === `frames ${sup.model}` && mem.tag.startsWith(`pipe-frame:${sup.line}/`) && bearable(mem);
    if (ownFrame || bearsOn(sup, mem)) { stats.bearingOk++; if (r.depth > FACE) excusedBearing.push({ support: desc(sup), member: desc(mem), depthIn: Math.round(r.depth * 1000) / 1000, at: r.at.map(v => Math.round(v * 100) / 100) as V3, solids: [...sd].map(([q, d]) => `${sup.tpl.solidNames[q]} ${d.toFixed(2)}`).join(', ') }); return null; }
    const over = [...sd].filter(([, d]) => d > FACE);
    if (!over.length) { stats.faceOk++; drop(A, B, r, `${why}: a support's shared face with a member it does not bear on (${FACE} in)`); return null; }
    note += `; the support does not bear on or hang from this ${CAT_NAME[mem.cat]} (its ${over.map(([q, d]) => `${sup.tpl.solidNames[q]} ${d.toFixed(2)} in`).join(', ')})`;
  }
  if (fine) note += `; ${fine}`;
  const [a, b] = order(A, B);
  return { a: desc(a), b: desc(b), depthIn: Math.round(r.depth * 1000) / 1000, at: r.at.map(v => Math.round(v * 100) / 100) as V3, note };
}
for (let k = 0; k < pairs.length; k += 2) {
  const A = objs[pairs[k]], B = objs[pairs[k + 1]];
  if (ONLY && !ONLY.test(A.model) && !ONLY.test(B.model)) continue;
  const rel = relate(A, B);
  if (rel.mode === MODE.SKIP) { bump(stats.skip, rel.why); continue; }
  const a = A.box, b = B.box, real = Math.min(a[3], b[3]) - Math.max(a[0], b[0]) > NOISE && Math.min(a[4], b[4]) - Math.max(a[1], b[1]) > NOISE && Math.min(a[5], b[5]) - Math.max(a[2], b[2]) > NOISE;
  let f: Finding | null = null;
  if (real) { stats.tested++; f = judge(A, B, rel.mode, rel.why); if (f) findings.push(f); }
  if (!f && CLEAR > 0 && isPiping(A) && isPiping(B) && A.model !== B.model) {
    for (const o of [A, B]) workValve(o.tpl);
    const t0 = performance.now(), c = clearance(A, B, CLEAR); tNear += performance.now() - t0;
    if (c.d < CLEAR) { const [p, q] = order(A, B); nearMiss.push({ a: desc(p), b: desc(q), clearanceIn: Math.round(c.d * 1000) / 1000, at: c.at.map(v => Math.round(v * 100) / 100) as V3 }); }
  }
  if (Date.now() - lastLog > 20000) { lastLog = Date.now(); log(`  narrow ${k / 2}/${pairs.length / 2} pairs, tested ${stats.tested}, findings ${findings.length}, BVH tris ${bvhTris}, valves ${workCount}/${fineCount}, eval ${(tEval / 1000).toFixed(1)}s`); }
}
log(`narrow phase: tested ${stats.tested} pairs in ${((Date.now() - tN0) / 1000).toFixed(1)}s; crossings ${stats.intersect}, containments ${stats.contained}, noise ${stats.noise}, bearing ok ${stats.bearingOk}, shared face ok ${stats.faceOk}, studs on a valve's end flanges ok ${stats.studsOk}, valves meshed for tested pairs ${workCount} (${(workSpent / 1000).toFixed(1)}s), re-meshed at ${VALVE_FINE} ${fineCount} (${(fineSpent / 1000).toFixed(1)}s); evaluate ${(tEval / 1000).toFixed(1)}s, near-miss ${(tNear / 1000).toFixed(1)}s, BVH tris ${bvhTris}`);

// ---- output ----------------------------------------------------------------------------------------------------------
findings.sort((p, q) => q.depthIn - p.depthIn);
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(`${OUT_DIR}/findings-${LABEL}.json`, JSON.stringify(findings, null, 1));
nearMiss.sort((p, q) => p.clearanceIn - q.clearanceIn); excusedBearing.sort((p, q) => q.depthIn - p.depthIn);
writeFileSync(`${OUT_DIR}/near-${LABEL}.json`, JSON.stringify(nearMiss, null, 1));
writeFileSync(`${OUT_DIR}/excused-bearing-${LABEL}.json`, JSON.stringify({ supportsOnTheirMembers: excusedBearing, foundedOn: excusedFounded.sort((p, q) => q.depthIn - p.depthIn), droppedShallow: dropped.sort((p, q) => q.depthIn - p.depthIn) }, null, 1));
const calib = [['10618', 'BL-1724'], ['10632', 'BL-1211'], ['10631', 'BL-1611']].map(([l, s]) => ({ l, s, hit: findings.filter(f => [f.a, f.b].some(x => x.model === 'pipeway' && x.line.endsWith(l)) && [f.a, f.b].some(x => x.line === `nozzle ${s}-P` || x.line === `nozzle ${s}-U`)) }));
const plantedHits = planted.map(p => ({ p, hit: findings.filter(f => (f.a.tag === p.obj.tag || f.b.tag === p.obj.tag) && (p.target === 'beam' ? [f.a, f.b].some(x => /beam/.test(x.tag)) : [f.a, f.b].some(x => x.tag === p.target))) }));
const byPair = new Map<string, number>(); for (const f of findings) { const k = `${f.a.model.split(' ')[0]}:${CAT_NAME[0]}`; void k; const key = `${f.a.model} vs ${f.b.model}`; byPair.set(key, (byPair.get(key) ?? 0) + 1); }
console.error(`peak rss sampled at the log lines: ${(Math.max(peakRss, rss()) / 2 ** 30).toFixed(2)} GB`);
console.error('skips:', [...stats.skip].map(([k, v]) => `${k} ${v}`).join(', '));
console.error('findings by models:', [...byPair].sort((p, q) => q[1] - p[1]).map(([k, v]) => `${k}: ${v}`).join('; '));
for (const c of calib) { const nm = nearMiss.filter(f => [f.a, f.b].some(x => x.model === 'pipeway' && x.line.endsWith(c.l)) && [f.a, f.b].some(x => x.line === `nozzle ${c.s}-P` || x.line === `nozzle ${c.s}-U`)); console.error(`calibration ${c.l} vs ${c.s}: ${c.hit.length ? `FOUND ${c.hit.length} (deepest ${Math.max(...c.hit.map(h => h.depthIn))} in)` : 'no intersection'}${nm.length ? `; near miss, clearance ${Math.min(...nm.map(h => h.clearanceIn))} in` : ''}`); }
console.error(`near misses (unrelated piping of different models within ${CLEAR} in, not findings): ${nearMiss.length}; stud sets of one joint stack excused: ${stackStuds}; founded-on overlaps excused deeper than ${FACE} in: ${excusedFounded.length}${excusedFounded.length ? ` (deepest ${Math.max(...excusedFounded.map(e => e.depthIn))} in)` : ''}; bearing contacts excused deeper than ${FACE} in: ${excusedBearing.length}${excusedBearing.length ? ` (deepest ${excusedBearing[0].depthIn} in)` : ''}; empty parts skipped: ${emptyParts.length}`);
for (const p of plantedHits) console.error(`planted ${p.p.obj.tag} vs ${p.p.expect}: ${p.hit.length ? `FOUND (${p.hit.map(h => `${h.a.tag === p.p.obj.tag ? h.b.tag : h.a.tag} ${h.depthIn}`).join(', ')})` : 'NOT FOUND'}`);
console.log(`mesh detector [${LABEL}] MODELS=${MODELS}: ${objs.length} objects (${nPiping} piping), ${nCand} AABB pairs, ${stats.tested} tested, ${findings.length} findings` +
  `${findings.length ? `, deepest ${findings[0].depthIn} in` : ''}; calibration ${calib.map(c => `${c.l}/${c.s}:${c.hit.length ? 'yes' : 'no'}`).join(' ')}` +
  `${planted.length ? `; planted ${plantedHits.map(p => `${p.p.obj.tag}:${p.hit.length ? 'yes' : 'no'}`).join(' ')}` : ''}; ${secs()} s -> ${OUT_DIR}/findings-${LABEL}.json`);
