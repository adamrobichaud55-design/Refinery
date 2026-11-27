/**
 * Independent clash detector for plant 3, method "interfaces between models" (audit agent "interfaces").
 *
 * Run: cd /home/user/Refinery/smartweld && MODELS=<dir> [LABEL=x] [PLANT=1] [FULL=1] npx vite-node <this file>
 *
 * Trusts none of the models' own checks. Every piece is rebuilt from its part key / part spec with the catalogue's own
 * geometry definitions, as exact signed-distance solids: analytic shapes for pipes, flanges, gaskets, elbows, tees,
 * reducers, caps and weld beads; the exact SDFs of the cast valve bodies, tees and small-bore fittings (recorded from
 * the catalogue's own SDF instead of its polygonised mesh); the extruded profiles of every steel/concrete member; and
 * the triangle meshes of everything else (convex components as plane sets, the rest by an exact BVH distance with a
 * ray-parity sign). Overlap is found with a Lipschitz branch-and-bound over the two SDFs, then measured by local
 * ascent: depthIn = how deep the overlap reaches into either solid; thickness = 2 x the deepest point common to both.
 *
 * Read only: models from $MODELS, code from the repo. Writes only into this file's folder.
 *
 * Reviewer's changes (independent review of this detector, 2026-11-27), each marked "(reviewer)" below:
 *  - scope: with FULL (the default) a unit cell's own steel, equipment and concrete are tested among themselves too, by kit structure
 *    (cellGroup): the unit's rack, each equipment item with its own pad/pier, an access structure, the cooler deck, the yard supports.
 *    Equipment on its own pad/pier, and an air cooler on the cooler deck or an item on its own elevated structure, is a bearing test
 *    (lifted 0.05 in, the item's anchor bolts left out); everything else between two structures is an overlap test.
 *  - support -> its line narrowed to support -> the piece it carries (the nearest of its line's pipes and fittings to its point); the rest of
 *    its line, and the pipe frame built for its line (frames carry the line's name), are tested like anything else.
 *  - hanger -> the member it hangs from: the member whose own section (in its frame) holds the rod top, not any member whose world box does.
 *  - nozzle -> its equipment: only the solid its neck is set in (the one holding or nearest its inner end) and that solid's weld seams;
 *    the equipment's other solids (pedestals, buckstays, built-in vent nozzles, ladders...) are tested.
 *  - line bolted to an equipment nozzle: only the joint at the face (pieces with an end on it, what bolts to the gasket, the studs),
 *    not every piece of the line inside a box round the face.
 *  - 'weld at the end of a piece of its line' (a weld against pieces it does not join) removed: it hid slip-on flange face welds in gaskets.
 *  - PLANT=1 adds (3): a copy of an equipment body moved 2 in into its neighbour in the same cell, with no bypass of the contact policy.
 *  - SELFTEST=3: every vertex of the catalogue's own mesh of every distinct analytic/prism/SDF part must lie inside this detector's solids.
 *  - AUDITX=<reasons,...>: also test the pairs a named relationship excuses and list what overlaps (auditx-<label>.json), to audit the policy.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import * as SDFM from '../../src/geometry/sdf';

// ---- the catalogue's polygoniser, switchable to a recorder of the exact SDF (no meshing) ------------------------------
type Rec = { f: (x: number, y: number, z: number) => number; min: number[]; max: number[] };
const REC = new WeakMap<object, Rec>();
const realPolygonize = SDFM.polygonize;
let STUB = false;
const recorder = (f: Rec['f'], min: number[], max: number[]) => { const m = { positions: [] as number[], indices: [] as number[] }; REC.set(m, { f, min: [...min], max: [...max] }); return m; };
Object.defineProperty(SDFM, 'polygonize', { configurable: true, enumerable: true, get: () => (STUB ? recorder : realPolygonize) });

import { cells } from '../../src/refinery/assemble';
import { pipeway, unitToPipeway } from '../../src/refinery/pipeway';
import { CWM } from '../../src/refinery/coolingWater';
import { framePlaced, type FrameSpec } from '../../src/refinery/supports';
import { partFromKey, worldBox } from '../../src/generator/piping';
import { buildGeometry, profileOf } from '../../src/geometry/partGeometry';
import { pipeDims, designFlange, grooveDims, type PipeClass } from '../../src/catalogue';
import { interiorKit } from '../../src/generator/interiorKit';
import { frameFromAxes, multiply, translate } from '../../src/geometry/transform';

const T0 = Date.now();
const HERE = (process.env.AUDIT_OUT ?? 'audit-out') + '/interfaces'; mkdirSync(HERE, { recursive: true });
const MODELS = process.env.MODELS ?? '';
const LABEL = process.env.LABEL ?? 'run';
const PLANT = process.env.PLANT === '1';
const FULL = process.env.FULL !== '0';   // default: every pair anywhere (but a cell's own steel/equipment among themselves); FULL=0: the interface method's scope only (across models, and plant 3's own frames/junctions/sleepers against anything)
const VERBOSE = process.env.VERBOSE === '1';
if (!MODELS || !existsSync(MODELS)) throw new Error(`MODELS folder not found: ${MODELS}`);
if (!existsSync(HERE)) mkdirSync(HERE, { recursive: true });
const log = (...a: unknown[]) => console.error(`[${((Date.now() - T0) / 1000).toFixed(1)}s]`, ...a);

type V3 = [number, number, number];
type M4 = number[];
const TOL = 0.01;          // half of the 0.02 in noise floor: a point 0.01 inside both solids = an overlap 0.02 thick
const NOISE = 0.02;        // overlaps under this are numeric noise
const JOINT = 0.05;        // a shared face: ends within 0.05 in
const BEAR = 0.05;         // a support's bearing face: within 0.05 in

// ---- vectors / rigid transforms ---------------------------------------------------------------------------------
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const addv = (a: V3, b: V3, k = 1): V3 => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const crs = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const unit = (a: V3): V3 => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const xp = (T: M4, p: V3): V3 => [T[0] * p[0] + T[4] * p[1] + T[8] * p[2] + T[12], T[1] * p[0] + T[5] * p[1] + T[9] * p[2] + T[13], T[2] * p[0] + T[6] * p[1] + T[10] * p[2] + T[14]];
const xd = (T: M4, d: V3): V3 => [T[0] * d[0] + T[4] * d[1] + T[8] * d[2], T[1] * d[0] + T[5] * d[1] + T[9] * d[2], T[2] * d[0] + T[6] * d[1] + T[10] * d[2]];
const r6 = (v: number) => Math.round(v * 1e4) / 1e4;
let nonRigid = 0;
function checkRigid(T: M4) { const c = [[T[0], T[1], T[2]], [T[4], T[5], T[6]], [T[8], T[9], T[10]]]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const d = c[i][0] * c[j][0] + c[i][1] * c[j][1] + c[i][2] * c[j][2]; if (Math.abs(d - (i === j ? 1 : 0)) > 2e-3) { nonRigid++; return false; } } return true; }

// =====================================================================================================
// Local shapes: an SDF in the part's own frame, its local box, a Lipschitz factor for pruning
// =====================================================================================================
type F3 = (x: number, y: number, z: number) => number;
interface Shp { f: F3; lo: V3; hi: V3; lip: number; name: string; kind: string }
const capped = (dr: number, da: number) => Math.min(Math.max(dr, da), 0) + Math.hypot(Math.max(dr, 0), Math.max(da, 0));
function cylZ(r: number, z0: number, z1: number, name = 'cyl'): Shp { return { f: (x, y, z) => capped(Math.hypot(x, y) - r, Math.max(z0 - z, z - z1)), lo: [-r, -r, z0], hi: [r, r, z1], lip: 1, name, kind: 'cyl' }; }
function frustumZ(r0: number, z0: number, r1: number, z1: number): F3 {
  const k = Math.cos(Math.atan2(Math.abs(r1 - r0), Math.abs(z1 - z0)));
  return (x, y, z) => { const t = Math.min(1, Math.max(0, (z - z0) / (z1 - z0))); return capped((Math.hypot(x, y) - (r0 + (r1 - r0) * t)) * k, Math.max(z0 - z, z - z1)); };
}
function unionShp(parts: Shp[], name: string, kind: string): Shp {
  const fs = parts.map(p => p.f), lo: V3 = [Infinity, Infinity, Infinity], hi: V3 = [-Infinity, -Infinity, -Infinity];
  for (const p of parts) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], p.lo[k]); hi[k] = Math.max(hi[k], p.hi[k]); }
  return { f: (x, y, z) => { let d = Infinity; for (const f of fs) { const v = f(x, y, z); if (v < d) d = v; } return d; }, lo, hi, lip: Math.max(...parts.map(p => p.lip)), name, kind };
}
/** exact signed distance to a simple polygon (any shape), xy flat array */
function polyD(P: Float64Array, x: number, y: number): number {
  const n = P.length / 2; let d = (x - P[0]) ** 2 + (y - P[1]) ** 2, s = 1;
  for (let i = 0, j = n - 1; i < n; j = i, i++) {
    const vix = P[2 * i], viy = P[2 * i + 1], vjx = P[2 * j], vjy = P[2 * j + 1], ex = vjx - vix, ey = vjy - viy, wx = x - vix, wy = y - viy;
    const ee = ex * ex + ey * ey, t = ee > 0 ? Math.min(1, Math.max(0, (wx * ex + wy * ey) / ee)) : 0, bx = wx - ex * t, by = wy - ey * t, bb = bx * bx + by * by;
    if (bb < d) d = bb;
    const c1 = y >= viy, c2 = y < vjy, c3 = ex * wy > ey * wx;
    if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
  }
  return s * Math.sqrt(d);
}
const flat = (pts: { x: number; y: number }[]) => { const a = new Float64Array(pts.length * 2); pts.forEach((p, i) => { a[2 * i] = p.x; a[2 * i + 1] = p.y; }); return a; };
/** an extruded profile, z from 0 to L, ends optionally sheared (z += dx·x + dy·y) */
function prism(outer: Float64Array, inner: Float64Array | null, L: number, cuts: { start?: { dx: number; dy: number }; end?: { dx: number; dy: number } } | undefined, name: string): Shp {
  const c0 = cuts?.start ?? { dx: 0, dy: 0 }, c1 = cuts?.end ?? { dx: 0, dy: 0 }, n0 = Math.hypot(1, c0.dx, c0.dy), n1 = Math.hypot(1, c1.dx, c1.dy);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, zlo = Infinity, zhi = -Infinity;
  for (let i = 0; i < outer.length; i += 2) { const x = outer[i], y = outer[i + 1]; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); zlo = Math.min(zlo, c0.dx * x + c0.dy * y); zhi = Math.max(zhi, L + c1.dx * x + c1.dy * y); }
  const f: F3 = (x, y, z) => {
    let d2 = polyD(outer, x, y); if (inner) d2 = Math.max(d2, -polyD(inner, x, y));
    const da = Math.max((c0.dx * x + c0.dy * y - z) / n0, (z - (L + c1.dx * x + c1.dy * y)) / n1);
    return capped(d2, da);
  };
  return { f, lo: [x0, y0, zlo], hi: [x1, y1, zhi], lip: 1, name, kind: 'prism' };
}
/** a solid of revolution about local z from a closed polygon in (r, z) */
function revolve2D(rz: [number, number][], name: string): Shp {
  const P = new Float64Array(rz.length * 2); rz.forEach(([r, z], i) => { P[2 * i] = r; P[2 * i + 1] = z; });
  const R = Math.max(...rz.map(p => p[0])), z0 = Math.min(...rz.map(p => p[1])), z1 = Math.max(...rz.map(p => p[1]));
  return { f: (x, y, z) => polyD(P, Math.hypot(x, y), z), lo: [-R, -R, z0], hi: [R, R, z1], lip: 1, name, kind: 'revolve' };
}
/** elbow: torus segment, inlet at the origin along +z, turning toward +x about (R, 0, 0) through ang */
function torusSeg(R: number, ro: number, ang: number): Shp {
  const sa = Math.sin(ang), ca = Math.cos(ang), ox = R - R * ca, oz = R * sa;
  const f: F3 = (x, y, z) => {
    const qx = x - R, rho = Math.hypot(qx, z), tube = Math.hypot(rho - R, y) - ro;
    const p1 = -z, p2 = (x - ox) * sa + (z - oz) * ca;
    return Math.max(tube, p1, p2);
  };
  // box: the arc's points and the tube radius
  const lo: V3 = [Infinity, -ro, Infinity], hi: V3 = [-Infinity, ro, -Infinity];
  for (let i = 0; i <= 32; i++) { const t = (ang * i) / 32, cx = R - R * Math.cos(t), cz = R * Math.sin(t); lo[0] = Math.min(lo[0], cx - ro); hi[0] = Math.max(hi[0], cx + ro); lo[2] = Math.min(lo[2], cz - ro); hi[2] = Math.max(hi[2], cz + ro); }
  lo[2] = Math.max(lo[2], 0); return { f, lo, hi, lip: 1, name: 'elbow', kind: 'torus' };
}

// ---- meshes: welded components; convex ones as plane sets, the others by an exact BVH distance -------------------------
interface MeshData { positions: number[]; indices: number[] }
const RAY: V3 = unit([0.5773, 0.6931, 0.4318]);
class BVH {
  tri: Float64Array; n: number; lo: Float64Array; hi: Float64Array; left: Int32Array; right: Int32Array; start: Int32Array; count: Int32Array; order: Int32Array; nodes = 0; closed: boolean;
  constructor(tri: Float64Array, closed: boolean) {
    this.tri = tri; this.n = tri.length / 9; this.closed = closed; const cap = 2 * this.n + 1;
    this.lo = new Float64Array(cap * 3); this.hi = new Float64Array(cap * 3); this.left = new Int32Array(cap).fill(-1); this.right = new Int32Array(cap).fill(-1); this.start = new Int32Array(cap); this.count = new Int32Array(cap);
    this.order = new Int32Array(this.n); for (let i = 0; i < this.n; i++) this.order[i] = i;
    const cen = new Float64Array(this.n * 3); for (let i = 0; i < this.n; i++) for (let k = 0; k < 3; k++) cen[3 * i + k] = (tri[9 * i + k] + tri[9 * i + 3 + k] + tri[9 * i + 6 + k]) / 3;
    const build = (s: number, c: number): number => {
      const id = this.nodes++; let lx = Infinity, ly = Infinity, lz = Infinity, hx = -Infinity, hy = -Infinity, hz = -Infinity;
      for (let q = s; q < s + c; q++) { const t = this.order[q] * 9; for (let v = 0; v < 9; v += 3) { const x = tri[t + v], y = tri[t + v + 1], z = tri[t + v + 2]; if (x < lx) lx = x; if (y < ly) ly = y; if (z < lz) lz = z; if (x > hx) hx = x; if (y > hy) hy = y; if (z > hz) hz = z; } }
      this.lo[3 * id] = lx; this.lo[3 * id + 1] = ly; this.lo[3 * id + 2] = lz; this.hi[3 * id] = hx; this.hi[3 * id + 1] = hy; this.hi[3 * id + 2] = hz;
      if (c <= 4) { this.start[id] = s; this.count[id] = c; return id; }
      const ext = [hx - lx, hy - ly, hz - lz], ax = ext[0] >= ext[1] && ext[0] >= ext[2] ? 0 : ext[1] >= ext[2] ? 1 : 2;
      const sl = Array.from(this.order.subarray(s, s + c)).sort((a, b) => cen[3 * a + ax] - cen[3 * b + ax]); for (let q = 0; q < c; q++) this.order[s + q] = sl[q];
      const h = c >> 1; this.left[id] = build(s, h); this.right[id] = build(s + h, c - h); return id;
    };
    build(0, this.n);
  }
  /** squared distance from p to the nearest triangle */
  dist2(px: number, py: number, pz: number): number {
    let best = Infinity; const st: number[] = [0];
    while (st.length) {
      const id = st.pop()!, b = this.boxD2(id, px, py, pz); if (b >= best) continue;
      if (this.left[id] < 0) { for (let q = this.start[id]; q < this.start[id] + this.count[id]; q++) { const d = triD2(this.tri, this.order[q] * 9, px, py, pz); if (d < best) best = d; } continue; }
      const l = this.left[id], r = this.right[id], dl = this.boxD2(l, px, py, pz), dr = this.boxD2(r, px, py, pz);
      if (dl < dr) { if (dr < best) st.push(r); if (dl < best) st.push(l); } else { if (dl < best) st.push(l); if (dr < best) st.push(r); }
    }
    return best;
  }
  boxD2(id: number, x: number, y: number, z: number) { const o = 3 * id; const dx = Math.max(this.lo[o] - x, 0, x - this.hi[o]), dy = Math.max(this.lo[o + 1] - y, 0, y - this.hi[o + 1]), dz = Math.max(this.lo[o + 2] - z, 0, z - this.hi[o + 2]); return dx * dx + dy * dy + dz * dz; }
  /** ray parity along RAY */
  inside(px: number, py: number, pz: number): boolean {
    if (!this.closed) return false;
    let hits = 0; const st: number[] = [0], dx = RAY[0], dy = RAY[1], dz = RAY[2], ix = 1 / dx, iy = 1 / dy, iz = 1 / dz;
    while (st.length) {
      const id = st.pop()!, o = 3 * id;
      let t0 = (this.lo[o] - px) * ix, t1 = (this.hi[o] - px) * ix; let tmin = Math.min(t0, t1), tmax = Math.max(t0, t1);
      t0 = (this.lo[o + 1] - py) * iy; t1 = (this.hi[o + 1] - py) * iy; tmin = Math.max(tmin, Math.min(t0, t1)); tmax = Math.min(tmax, Math.max(t0, t1));
      t0 = (this.lo[o + 2] - pz) * iz; t1 = (this.hi[o + 2] - pz) * iz; tmin = Math.max(tmin, Math.min(t0, t1)); tmax = Math.min(tmax, Math.max(t0, t1));
      if (tmax < Math.max(tmin, 0)) continue;
      if (this.left[id] < 0) { for (let q = this.start[id]; q < this.start[id] + this.count[id]; q++) if (rayTri(this.tri, this.order[q] * 9, px, py, pz)) hits++; continue; }
      st.push(this.left[id], this.right[id]);
    }
    return (hits & 1) === 1;
  }
}
function triD2(T: Float64Array, o: number, px: number, py: number, pz: number): number {
  const ax = T[o], ay = T[o + 1], az = T[o + 2], bx = T[o + 3], by = T[o + 4], bz = T[o + 5], cx = T[o + 6], cy = T[o + 7], cz = T[o + 8];
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
            if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const w = (d4 - d3) / ((d4 - d3) + (d5 - d6)); qx = bx + w * (cx - bx); qy = by + w * (cy - by); qz = bz + w * (cz - bz); }
            else { const den = 1 / (va + vb + vc), v = vb * den, w = vc * den; qx = ax + abx * v + acx * w; qy = ay + aby * v + acy * w; qz = az + abz * v + acz * w; }
          }
        }
      }
    }
  }
  return (px - qx) ** 2 + (py - qy) ** 2 + (pz - qz) ** 2;
}
function rayTri(T: Float64Array, o: number, px: number, py: number, pz: number): boolean {
  const e1x = T[o + 3] - T[o], e1y = T[o + 4] - T[o + 1], e1z = T[o + 5] - T[o + 2], e2x = T[o + 6] - T[o], e2y = T[o + 7] - T[o + 1], e2z = T[o + 8] - T[o + 2];
  const hx = RAY[1] * e2z - RAY[2] * e2y, hy = RAY[2] * e2x - RAY[0] * e2z, hz = RAY[0] * e2y - RAY[1] * e2x, a = e1x * hx + e1y * hy + e1z * hz;
  if (Math.abs(a) < 1e-14) return false;
  const f = 1 / a, sx = px - T[o], sy = py - T[o + 1], sz = pz - T[o + 2], u = f * (sx * hx + sy * hy + sz * hz); if (u < 0 || u > 1) return false;
  const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x, v = f * (RAY[0] * qx + RAY[1] * qy + RAY[2] * qz); if (v < 0 || u + v > 1) return false;
  return f * (e2x * qx + e2y * qy + e2z * qz) > 1e-9;
}
const meshStats = { comps: 0, convex: 0, bvh: 0, open: 0, openNames: new Map<string, number>() };
/** split a mesh into welded connected components; each a convex plane set or a BVH */
function meshShapes(m: MeshData, name: string): Shp[] {
  const P = m.positions, I = m.indices, nv = P.length / 3; if (!I.length) return [];
  const weld = new Int32Array(nv), map = new Map<string, number>(); let nw = 0;
  for (let v = 0; v < nv; v++) { const k = `${Math.round(P[3 * v] * 1e4)},${Math.round(P[3 * v + 1] * 1e4)},${Math.round(P[3 * v + 2] * 1e4)}`; let w = map.get(k); if (w === undefined) { w = nw++; map.set(k, w); } weld[v] = w; }
  const par = Int32Array.from({ length: nw }, (_, i) => i); const fnd = (x: number): number => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  for (let t = 0; t < I.length; t += 3) { const a = fnd(weld[I[t]]), b = fnd(weld[I[t + 1]]), c = fnd(weld[I[t + 2]]); par[b] = a; par[fnd(c)] = a; }
  const groups = new Map<number, number[]>(); for (let t = 0; t < I.length; t += 3) { const r = fnd(weld[I[t]]); let g = groups.get(r); if (!g) { g = []; groups.set(r, g); } g.push(t); }
  const out: Shp[] = [];
  for (const tris of groups.values()) {
    meshStats.comps++;
    // closed? every welded edge used an even number of times
    const ec = new Map<number, number>(); for (const t of tris) for (let e = 0; e < 3; e++) { const a = weld[I[t + e]], b = weld[I[t + (e + 1) % 3]]; if (a === b) continue; const k = a < b ? a * 4194304 + b : b * 4194304 + a; ec.set(k, (ec.get(k) ?? 0) + 1); }
    let closed = true; for (const c of ec.values()) if (c % 2) { closed = false; break; }
    const vs = new Set<number>(); for (const t of tris) for (let e = 0; e < 3; e++) vs.add(I[t + e]);
    const verts = [...vs]; const lo: V3 = [Infinity, Infinity, Infinity], hi: V3 = [-Infinity, -Infinity, -Infinity];
    for (const v of verts) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], P[3 * v + k]); hi[k] = Math.max(hi[k], P[3 * v + k]); }
    // planes
    const planes: number[] = [], seen = new Set<string>();
    for (const t of tris) {
      const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3, ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const L = Math.hypot(nx, ny, nz); if (L < 1e-10) continue; nx /= L; ny /= L; nz /= L;
      const d = nx * P[a] + ny * P[a + 1] + nz * P[a + 2], k = `${Math.round(nx * 1e4)},${Math.round(ny * 1e4)},${Math.round(nz * 1e4)},${Math.round(d * 1e3)}`; if (seen.has(k)) continue; seen.add(k); planes.push(nx, ny, nz, d);
    }
    let convex = closed && planes.length / 4 * verts.length < 4e6 && planes.length > 0;
    if (convex) { outer: for (let q = 0; q < planes.length; q += 4) for (const v of verts) if (planes[q] * P[3 * v] + planes[q + 1] * P[3 * v + 1] + planes[q + 2] * P[3 * v + 2] - planes[q + 3] > 2e-3) { convex = false; break outer; } }
    if (convex) {
      meshStats.convex++; const PL = Float64Array.from(planes), np = PL.length;
      out.push({ f: (x, y, z) => { let d = -Infinity; for (let q = 0; q < np; q += 4) { const v = PL[q] * x + PL[q + 1] * y + PL[q + 2] * z - PL[q + 3]; if (v > d) d = v; } return d; }, lo, hi, lip: 1, name, kind: 'convex' });
      continue;
    }
    if (!closed) { meshStats.open++; meshStats.openNames.set(name, (meshStats.openNames.get(name) ?? 0) + 1); }
    meshStats.bvh++;
    const tri = new Float64Array(tris.length * 9); tris.forEach((t, i) => { for (let e = 0; e < 3; e++) for (let k = 0; k < 3; k++) tri[9 * i + 3 * e + k] = P[3 * I[t + e] + k]; });
    let bvh: BVH | null = null;
    const L0 = lo, H0 = hi;
    out.push({ f: (x, y, z) => { if (!bvh) bvh = new BVH(tri, closed); const d = Math.sqrt(bvh.dist2(x, y, z)); const inBox = x > L0[0] && x < H0[0] && y > L0[1] && y < H0[1] && z > L0[2] && z < H0[2]; return inBox && bvh.inside(x, y, z) ? -d : d; }, lo, hi, lip: 1, name, kind: closed ? 'bvh' : 'open' });
  }
  return out;
}


/** raw closed BVHs of a mesh's components (for the self test) */
function meshShapesRaw(m: MeshData): BVH[] {
  const P = m.positions, I = m.indices, nv = P.length / 3, weld = new Int32Array(nv), map = new Map<string, number>(); let nw = 0;
  for (let v = 0; v < nv; v++) { const k = `${Math.round(P[3 * v] * 1e4)},${Math.round(P[3 * v + 1] * 1e4)},${Math.round(P[3 * v + 2] * 1e4)}`; let w = map.get(k); if (w === undefined) { w = nw++; map.set(k, w); } weld[v] = w; }
  const par = Int32Array.from({ length: nw }, (_, i) => i); const fnd = (x: number): number => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  for (let t = 0; t < I.length; t += 3) { const a = fnd(weld[I[t]]), b = fnd(weld[I[t + 1]]), c = fnd(weld[I[t + 2]]); par[b] = a; par[fnd(c)] = a; }
  const groups = new Map<number, number[]>(); for (let t = 0; t < I.length; t += 3) { const r = fnd(weld[I[t]]); let g = groups.get(r); if (!g) { g = []; groups.set(r, g); } g.push(t); }
  return [...groups.values()].map(tris => { const tri = new Float64Array(tris.length * 9); tris.forEach((t, i) => { for (let e = 0; e < 3; e++) for (let k = 0; k < 3; k++) tri[9 * i + 3 * e + k] = P[3 * I[t + e] + k]; }); return new BVH(tri, true); });
}
import * as CAT from '../../src/catalogue';
function rebuildFresh(key: string): unknown {
  const a = key.split('|'), n = (i: number) => Number(a[i]);
  switch (a[0]) {
    case 'VLV': return CAT.makeValve(key + '#fresh', a[1] as never, n(2), a[3] as PipeClass, (a[4] as never) ?? 'RF');
    case 'TEE': return CAT.makeTee(key + '#fresh', n(1), a[2] as PipeClass, n(3));
    case 'OLET': return CAT.makeOlet(key + '#fresh', n(1), n(2), a[3] as PipeClass, a[4] as never);
  }
  return null;
}

// ---- part → shapes (cached per part object) ----------------------------------------------------------------------
const shapeCache = new WeakMap<object, Shp[]>();
const ceil16 = (v: number) => Math.ceil(v * 16 - 1e-9) / 16;
const PRISM_KINDS = new Set(['W', 'C', 'L', 'HSS_RECT', 'HSS_ROUND', 'PL', 'GUSSET', 'STIFFENER', 'Z', 'CS', 'PANEL', 'TRIM', 'CONCRETE', 'DOOR_LEAF', 'DOOR_CURTAIN', 'DOOR_DRUM', 'FILLET_WELD', 'GROOVE_WELD']);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shapesOfPart(part: any, key?: string): Shp[] {
  let s = shapeCache.get(part); if (s) return s;
  s = buildShapes(part, key); shapeCache.set(part, s); return s;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildShapes(part: any, key?: string): Shp[] {
  const d = part.dims ?? {}, v = (k: string) => d[k]?.value as number, kk = (key ?? '').split('|');
  switch (part.kind) {
    case 'PIPE': return [cylZ(v('OD') / 2, 0, part.length.value, 'pipe')];
    case 'FLANGE': if (!part.extra?.solids) { const f = part.extra.design; return [unionShp([cylZ(f.OD / 2, 0, f.tf), cylZ(f.rfOD / 2, -f.rfH, 0), { f: frustumZ(f.bore / 2 + f.hubT, f.tf, f.bore / 2 + f.pipeT, f.tf + f.hubLen), lo: [-(f.bore / 2 + f.hubT), -(f.bore / 2 + f.hubT), f.tf], hi: [f.bore / 2 + f.hubT, f.bore / 2 + f.hubT, f.tf + f.hubLen], lip: 1, name: 'hub', kind: 'frustum' }, cylZ(f.bore / 2 + f.pipeT, f.tf + f.hubLen, f.tf + f.hubLen + f.neckLen)], 'flange', 'flange')]; } break;
    case 'BLIND': { const f = part.extra.design; return [unionShp([cylZ(f.OD / 2, 0, f.tf), cylZ(f.rfOD / 2, -f.rfH, 0)], 'blind', 'flange')]; }
    case 'GASKET': { const f = part.extra.design; return [cylZ(f.gasketID / 2 + f.wg, 0, f.gasketT, 'gasket')]; }
    case 'ELBOW': return [torusSeg(part.extra.R, v('OD') / 2, part.extra.angle)];
    case 'TEE': { const NPS = v('NPS'), cls = kk[2] as PipeClass, p = pipeDims(NPS, cls), q = pipeDims(part.extra.branchNPS, cls), C = part.extra.C, k = Math.max(0.1, 0.12 * q.OD);
      return [{ f: SDFM.blend(k, SDFM.cylZ(p.OD / 2, -C, C), SDFM.cylY(q.OD / 2, 0, C)), lo: [-p.OD / 2 - k, -p.OD / 2 - k, -C - 0.01], hi: [p.OD / 2 + k, C + 0.01, C + 0.01], lip: 1, name: 'tee', kind: 'tee' }]; }
    case 'REDUCER': {
      const cls = kk[3] as PipeClass, a = pipeDims(Number(kk[1]), cls), b = pipeDims(Number(kk[2]), cls), H = part.extra.H, flatS = part.extra.flat === 'none' ? 0 : part.extra.flat === 'bottom' ? 1 : -1;
      const Ra = a.OD / 2, Rb = b.OD / 2, slope = Math.abs(Rb - Ra) / Math.max(1e-6, H - 2), kf = 1 / Math.hypot(1, (flatS ? 2 : 1) * slope), off = Ra - Rb;
      return [{ f: (x, y, z) => { const t = Math.min(1, Math.max(0, (z - 1) / (H - 2))), ro = Ra + (Rb - Ra) * t, dy = flatS * (Ra - ro); return capped((Math.hypot(x, y - dy) - ro) * kf, Math.max(-z, z - H)); }, lo: [-Ra, -Ra - off, 0], hi: [Ra, Ra + off, H], lip: 1, name: 'reducer', kind: 'reducer' }];
    }
    case 'CAP': { const R = v('OD') !== undefined ? v('OD') / 2 : pipeDims(Number(kk[1]), kk[2] as PipeClass).OD / 2, h = 2 * R / 4, ell = SDFM.ellipsoid(0, 0, 1, R, R, h);
      return [{ f: (x, y, z) => Math.min(capped(Math.hypot(x, y) - R, Math.max(-z, z - 1)), Math.max(ell(x, y, z), 1 - z)), lo: [-R, -R, 0], hi: [R, R, 1 + h], lip: 1.5, name: 'cap', kind: 'cap' }]; }
    case 'BUTT_WELD': {
      if (kk[0] === 'BW') { const p = pipeDims(Number(kk[1]), kk[2] as PipeClass), g = grooveDims(p.t), r = p.OD / 2; return [revolve2D([[r - 0.01, -g.topWidth / 2], [r + g.cap * 0.6, -g.topWidth / 4], [r + g.cap, 0], [r + g.cap * 0.6, g.topWidth / 4], [r - 0.01, g.topWidth / 2]], 'butt weld')]; }
      if (kk[0] === 'SWW') { const p = pipeDims(Number(kk[1]), kk[2] as PipeClass), tf = Math.max(3 / 16, ceil16(1.5 * p.t)), w = ceil16(1.4 * p.t), r = p.OD / 2; return [revolve2D([[r - 0.01, 0], [r + tf + 0.01, 0], [r + tf + 0.01, 0.02], [r - 0.01, w]], 'socket weld')]; }
      if (kk[0] === 'FWR') { const r = Number(kk[1]), w = Number(kk[2]); return [revolve2D([[r - 0.01, 0], [r + w, 0], [r - 0.01, w]], 'fillet weld ring')]; }
      break;
    }
  }
  if (PRISM_KINDS.has(part.kind) && part.length) {
    const pr = profileOf(part); if (pr) return [prism(flat(pr.outer), pr.inner ? flat(pr.inner) : null, part.length.value, part.extra?.endCuts, `${part.kind} ${part.designation ?? ''}`)];
  }
  if (part.kind === 'ROD' && part.length) return [cylZ(v('d') / 2, 0, part.length.value, 'rod')];
  // generic: the part's own solids
  const out: Shp[] = [];
  for (const so of buildGeometry(part).solids) {
    const rec = REC.get(so.mesh);
    if (rec) { out.push({ f: rec.f, lo: rec.min as V3, hi: rec.max as V3, lip: 2, name: so.name, kind: 'sdf' }); continue; }
    if (!so.mesh.indices.length) continue;
    out.push(...meshShapes(so.mesh as MeshData, so.name));
  }
  return out;
}

// =====================================================================================================
// Pieces in the common (pipeway) frame
// =====================================================================================================
type Cat = 'comp' | 'weld' | 'support' | 'nozzle' | 'steel' | 'equip' | 'concrete' | 'frame' | 'junction' | 'rack' | 'sleeper';
interface End { p: V3; d: V3 }
interface Piece {
  id: number; model: string; line: string; tag: string; kind: string; cat: Cat; T: M4; shapes: Shp[]; lo: V3; hi: V3; wlo?: V3[]; whi?: V3[];
  key?: string; a?: V3; b?: V3; ends?: End[]; NPS?: number; cls?: string; equip?: string; onRun?: string; joins?: string[]; supType?: string; struct?: string; own3?: boolean;
  tags?: string[]; carries?: Set<number>; planted?: boolean; frameId?: string; part?: unknown; at?: V3; axes?: { p: V3; d: V3 }[]; tilt?: number; endEquip?: { face: V3; equip: string; r: number }[];
}
const pieces: Piece[] = [];
function boxOf(T: M4, lo: V3, hi: V3): [V3, V3] {
  const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity];
  for (let c = 0; c < 8; c++) { const q = xp(T, [c & 1 ? hi[0] : lo[0], c & 2 ? hi[1] : lo[1], c & 4 ? hi[2] : lo[2]]); for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], q[k]); mx[k] = Math.max(mx[k], q[k]); } }
  return [mn, mx];
}
function addPiece(p: Omit<Piece, 'id' | 'lo' | 'hi'>): Piece | null {
  if (!p.shapes.length) return null;
  checkRigid(p.T);
  const lo: V3 = [Infinity, Infinity, Infinity], hi: V3 = [-Infinity, -Infinity, -Infinity], wlo: V3[] = [], whi: V3[] = [];
  for (const s of p.shapes) { const [a, b] = boxOf(p.T, s.lo, s.hi); wlo.push(a); whi.push(b); for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], a[k]); hi[k] = Math.max(hi[k], b[k]); } }
  const q = { ...p, id: pieces.length, lo, hi, wlo, whi } as Piece; pieces.push(q); return q;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const readJ = (f: string): any => JSON.parse(readFileSync(`${MODELS}/${f}`, 'utf8'));

// ---- frames -------------------------------------------------------------------------------------------------------
log('cells()');
const CELLS = cells();
const frameOf = new Map<string, M4>();
const cellOf = new Map<string, (typeof CELLS)[number]>();
for (const c of CELLS) { const name = c.plot.kind === 'unit' ? `unit-${c.plot.unit}` : `unit-${c.plot.unit}-${c.plot.id}`; frameOf.set(name, unitToPipeway(c.plot, c.cell) as M4); cellOf.set(name, c); }
frameOf.set('pipeway', [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
frameOf.set('cooling-water', translate(0, 0, CWM.way) as M4);
STUB = true;   // from here the catalogue's castings are recorded as exact SDFs, not meshed (the pipeway's own steel was checked identical either way)
log('pipeway()');
const cwd = process.cwd(); const EMPTY = `${HERE}/empty-cwd`; if (!existsSync(EMPTY)) mkdirSync(EMPTY);
process.chdir(EMPTY);   // the pipeway's routing aids read public/ relative to cwd: give it none (its steel does not depend on them)
const PW = pipeway();
process.chdir(cwd);

// ---- piping models --------------------------------------------------------------------------------------------------
const MODEL_FILES: [string, string][] = [...[11, 12, 13, 14, 15, 16, 17, 18, 19].map(u => [`unit-${u}`, `unit-${u}.json`] as [string, string]), ['pipeway', 'pipeway.json'], ['cooling-water', 'cooling-water.json']];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MODEL: Record<string, any> = {};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lineIndex = new Map<string, any>();   // `${model}|${no}` → line
const nozzleIndex = new Map<string, { model: string; n: any }>();   // eslint-disable-line @typescript-eslint/no-explicit-any
const tagIndex = new Map<string, Piece>();  // `${model}|${tag}` → piece
let keyErrors = 0;
log('load models');
for (const [name, file] of MODEL_FILES) {
  const M = readJ(file), TM = frameOf.get(name)!; MODEL[name] = M;
  const W = (p: V3) => xp(TM, p), Wd = (d: V3) => xd(TM, d);
  const pipingPiece = (c: any, line: string, cat: Cat, extra0: Partial<Piece> = {}) => {   // eslint-disable-line @typescript-eslint/no-explicit-any
    let extra: Partial<Piece> = extra0;
    let part; try { part = partFromKey(c.key); } catch (e) { keyErrors++; log('bad key', c.key, String(e)); return null; }
    const T = multiply(TM, c.T) as M4, a = W(c.a), b = W(c.b), ends: End[] = [], k = c.key.split('|');
    const ab = sub(b, a), L = len(ab);
    if (c.kind === 'elbow') { const ang = Number(k[3]) * Math.PI / 180; ends.push({ p: a, d: xd(T, [0, 0, -1]) }, { p: b, d: xd(T, [Math.sin(ang), 0, Math.cos(ang)]) }); }
    else if (c.kind === 'tee') { const C = (part as any).extra.C; ends.push({ p: a, d: L > 0 ? unit(sub(a, b)) : [0, 0, 0] }, { p: b, d: L > 0 ? unit(ab) : [0, 0, 0] }, { p: xp(T, [0, C, 0]), d: xd(T, [0, 1, 0]) }); }   // eslint-disable-line @typescript-eslint/no-explicit-any
    else if (c.kind === 'olet') ends.push({ p: b, d: unit(ab) });
    else if (k[0] === 'VLV' && k[1] === 'PSV') {   // the outlet: square to the inlet, its face CFout and the outlet flange's raised face from the body's axis point b
      const out = xd(T, [0, 0, 1]), dims = (part as any).dims, fo = designFlange(dims.outlet.value, 'P150'), face = addv(b, out, dims.CFout.value + fo.rfH);   // eslint-disable-line @typescript-eslint/no-explicit-any
      ends.push({ p: a, d: unit(sub(a, b)) }, { p: face, d: out }); extra = { ...extra, axes: [{ p: b, d: out }] };
    }
    else if (L > 1e-6) ends.push({ p: a, d: unit(sub(a, b)) }, { p: b, d: unit(ab) });
    const pc = addPiece({ model: name, line, tag: c.tag, kind: c.kind, cat, T, shapes: shapesOfPart(part, c.key), key: c.key, a, b, ends, NPS: c.NPS, cls: c.cls, onRun: c.onRun, part, ...extra });
    if (pc) tagIndex.set(`${name}|${c.tag}`, pc);
    return pc;
  };
  for (const l of M.lines) {
    lineIndex.set(`${name}|${l.no}`, l);
    for (const c of [...l.comps, ...(l.side ?? []), ...(l.pens ?? [])]) pipingPiece(c, l.no, 'comp');
    for (const w of l.welds) { let part; try { part = partFromKey(w.key); } catch { keyErrors++; continue; } const pc = addPiece({ model: name, line: l.no, tag: w.id, kind: 'weld', cat: 'weld', T: multiply(TM, w.T) as M4, shapes: shapesOfPart(part, w.key), key: w.key, joins: w.joins, a: W(w.at), at: W(w.at), part }); if (pc) tagIndex.set(`${name}|${w.id}`, pc); }
    for (const s of l.supports) { let part; try { part = partFromKey(s.key); } catch { keyErrors++; continue; } const pc = addPiece({ model: name, line: s.line ?? l.no, tag: s.id, kind: `support:${s.type}`, cat: 'support', T: multiply(TM, s.T) as M4, shapes: shapesOfPart(part, s.key), key: s.key, supType: s.type, at: W(s.at), part }); if (pc) tagIndex.set(`${name}|${s.id}`, pc); }
  }
  for (const n of M.nozzles) {
    nozzleIndex.set(`${name}|${n.id}`, { model: name, n });
    for (const c of n.comps ?? []) pipingPiece(c, n.id, 'nozzle', { equip: n.equip });
    for (const w of n.welds ?? []) { let part; try { part = partFromKey(w.key); } catch { keyErrors++; continue; } const pc = addPiece({ model: name, line: n.id, tag: w.id, kind: 'weld', cat: 'weld', T: multiply(TM, w.T) as M4, shapes: shapesOfPart(part, w.key), key: w.key, joins: w.joins, a: W(w.at), at: W(w.at), equip: n.equip, part }); if (pc) tagIndex.set(`${name}|${w.id}`, pc); }
  }
}
// a weld bead's axis against the straight piece it joins (the models give the elbow's chord at an elbow joint)
let tiltedWelds = 0;
for (const w of pieces) {
  if (w.cat !== 'weld' || !w.joins) continue;
  const ax = xd(w.T, [0, 0, 1]);
  for (const j of w.joins) { const q = tagIndex.get(`${w.model}|${j}`); if (!q || !q.a || !q.b || !['pipe', 'flange', 'reducer', 'valve', 'nipple'].includes(q.kind)) continue; const d = sub(q.b, q.a); if (len(d) < 1e-6) continue; w.tilt = Math.acos(Math.min(1, Math.abs(dot(ax, unit(d))))) * 180 / Math.PI; break; }
  if ((w.tilt ?? 0) > 1) tiltedWelds++;
}
// (reviewer) each nozzle's inner end: the end of its pieces farthest from its face (where the neck is set into the body)
const nozzleInner = new Map<string, V3>();
const nozzlePieces = new Map<string, Piece[]>(); for (const p of pieces) if (p.cat === 'nozzle') { const k = `${p.model}|${p.line}`; const a = nozzlePieces.get(k) ?? []; a.push(p); nozzlePieces.set(k, a); }
for (const [k, { model, n }] of nozzleIndex) { const face = xp(frameOf.get(model)!, n.face); let best: V3 | null = null, bd = -1; for (const p of nozzlePieces.get(k) ?? []) for (const e of [p.a!, p.b!]) { const d = len(sub(e, face)); if (d > bd) { bd = d; best = e; } } if (best) nozzleInner.set(k, best); }
const compsByLine = new Map<string, Piece[]>(); for (const p of pieces) if (p.cat === 'comp') { const k = `${p.model}|${p.line}`; const a = compsByLine.get(k) ?? []; a.push(p); compsByLine.set(k, a); }
// a line that ends at a nozzle of an equipment item: its pieces at that face are bolted to the item
for (const [k, l] of lineIndex) {
  const model = k.split('|')[0];
  for (const e of [l.from, l.to]) {
    const nz = nozzleIndex.get(`${model}|${e}`); if (!nz || /^(BL|PL)-/.test(nz.n.equip)) continue;
    const face = xp(frameOf.get(model)!, nz.n.face), r = designFlange(nz.n.NPS, nz.n.cls).OD / 2 + 3;
    // (reviewer) only the joint bolted to the nozzle's face: the pieces with an end on the face, what bolts on a gasket's far face, and the studs through them
    const mine = compsByLine.get(`${model}|${l.no}`) ?? [];
    const joint = new Set(mine.filter(p => p.ends?.some(x => len(sub(x.p, face)) <= JOINT)));
    for (const g of [...joint]) if (g.kind === 'gasket') { const far = g.ends!.find(x => len(sub(x.p, face)) > JOINT); if (far) for (const q of mine) if (q.ends?.some(y => len(sub(y.p, far.p)) <= JOINT)) joint.add(q); }
    for (const q of mine) if (q.kind === 'studs' && [...joint].some(g => coaxialJoint(q, g))) joint.add(q);
    for (const p of joint) (p.endEquip ??= []).push({ face, equip: nz.n.equip, r });
  }
}
const nPiping = pieces.length;
log('piping pieces', nPiping);

// ---- steel, equipment and concrete of the unit cells ---------------------------------------------------------------
const catOfTags = (tags: string[], kind: string): Cat => tags.includes('equipment') ? 'equip' : (kind === 'CONCRETE' || /^(FOOTING|PEDESTAL|PAD|SLAB|OCTAGON|RINGWALL|PIER|GRADE_BEAM|GROUT|CURB|PAVING|TRENCH|SUMP|DIKE|PILE_CAP|RETAINING_WALL|MANHOLE|SLEEPER|MACHINE_BLOCK|TABLE_TOP|BASIN|PIT|CULVERT|DUCT_BANK)$/.test(kind)) ? 'concrete' : 'steel';
let keepOutSkipped = 0;
/** (reviewer) the kit structure a cell's instance belongs to: the unit's rack (bents, bays, stringers, ladder), each equipment item with its
 *  own pad or pier, an access structure (deck and stair) of its own, the cooler deck, the yard supports; anything else by its first tag */
function cellGroup(tags: string[]): string { const t0 = tags[0] ?? ''; if (/^rack-/.test(t0)) return 'rack'; const m = /^(J-\d+)-(deck|stair)$/.exec(t0); if (m) return `${m[1]}:access`; return t0; }
for (const [name, c] of cellOf) {
  const TM = frameOf.get(name)!;
  c.cell.interior.instances.forEach((pl, i) => {
    if (pl.tags.includes('keep-out')) { keepOutSkipped++; return; }
    const cat = catOfTags(pl.tags, pl.part.kind);
    addPiece({ model: name, line: '', tag: `${pl.tags.join('/')}#${i}`, kind: pl.part.kind, cat, T: multiply(TM, pl.transform) as M4, shapes: shapesOfPart(pl.part), tags: pl.tags, struct: `${name}:${cellGroup(pl.tags)}`, part: pl.part });
  });
}
// ---- the pipeway's own steel (not its copies of the units' valve-bay steel) ------------------------------------------
let pwCopies = 0;
PW.interior.instances.forEach((pl, i) => {
  if (pl.tags.includes('keep-out')) { keepOutSkipped++; return; }
  if (pl.tags.some(t => /^unit-\d+$/.test(t))) { pwCopies++; return; }
  const jt = pl.tags.find(t => t.startsWith('junction:'));
  const cat: Cat = jt ? 'junction' : 'rack';
  addPiece({ model: 'pipeway', line: '', tag: `${pl.tags.join('/')}#${i}`, kind: pl.part.kind, cat, T: pl.transform as M4, shapes: shapesOfPart(pl.part), tags: pl.tags, struct: jt ?? 'pipeway:rack', own3: !!jt, part: pl.part });
});
// ---- the cooling water mains' sleepers, rebuilt from coolingWater()'s own rule and the model's report -------------------
const cwRep = readJ('cooling-water.report.json');
{
  const own: any[] = [], kit = interiorKit({ pedestal: 6, padHeight: 6 }, own, {});   // eslint-disable-line @typescript-eslint/no-explicit-any
  const OD = pipeDims(cwRep.mains[0].NPS, cwRep.mains[0].cls).OD, lanes = cwRep.mains.map((m: { lane: number }) => m.lane) as number[];
  const zs0 = Math.min(...lanes) - OD / 2 - CWM.sleeperOver, zs1 = Math.max(...lanes) + OD / 2 + CWM.sleeperOver;
  const steelBoxes = PW.interior.instances.filter(pl => pl.tags.includes('junction') || pl.tags.some(t => t.startsWith('rack'))).map(pl => { const b = worldBox(pl.part, pl.transform as never)!; return [[b[0][0], b[0][1], b[0][2] - CWM.way], [b[1][0], b[1][1], b[1][2] - CWM.way]] as [V3, V3]; });
  let placed = 0, left = 0; const TM = frameOf.get('cooling-water')!;
  for (let x = cwRep.way.x0; x <= cwRep.way.x1 - CWM.sleeperW / 2 + 1e-6; x += 240) {
    const mn: V3 = [x - CWM.sleeperW / 2 - 3, 0, zs0 - 3], mx: V3 = [x + CWM.sleeperW / 2 + 3, CWM.sleeperTop + 3, zs1 + 3];
    if (steelBoxes.some(b => b[0].every((v, k) => v < mx[k]) && b[1].every((v, k) => v > mn[k]))) { left++; continue; }
    const part = kit.concrete('sleeper', CWM.sleeperW, CWM.sleeperTop, zs1 - zs0), T = frameFromAxes([x, CWM.sleeperTop / 2, zs0], [0, 1, 0], [0, 0, 1]);
    addPiece({ model: 'cooling-water', line: '', tag: `sleeper:${x}`, kind: 'SLEEPER', cat: 'sleeper', T: multiply(TM, T) as M4, shapes: shapesOfPart(part), tags: ['sleeper', 'pad'], struct: `sleeper:${x}`, own3: true, part });
    placed++;
  }
  if (placed !== cwRep.sleepers) log(`WARNING: rebuilt ${placed} sleepers, the report says ${cwRep.sleepers}`); else log(`sleepers: ${placed} (as the report)`);
}
// ---- the pipe frames of plant 3's own (SW-RPI-17), from each report ----------------------------------------------------
let nFrames = 0;
for (const [name, file] of [...[11, 12, 13, 14, 15, 16, 17, 18, 19].map(u => [`unit-${u}`, `unit-${u}.report.json`]), ['cooling-water', 'cooling-water.report.json'], ['pipeway', 'pipeway.report.json']] as [string, string][]) {
  if (!existsSync(`${MODELS}/${file}`)) continue;
  const rep = readJ(file), TM = frameOf.get(name)!;
  (rep.frames ?? []).forEach((f: FrameSpec, k: number) => {
    nFrames++; const fid = `frame:${name}:${f.line}:${k}`;
    framePlaced(f).forEach((pl, i) => addPiece({ model: name, line: f.line, tag: `${pl.tags.join('/')}#${k}.${i}`, kind: pl.part.kind, cat: 'frame', T: multiply(TM, pl.transform) as M4, shapes: shapesOfPart(pl.part), tags: pl.tags, struct: fid, frameId: fid, own3: true, part: pl.part }));
  });
}
log(`pieces ${pieces.length} (piping ${nPiping}); frames ${nFrames}; pipeway copies of unit steel skipped ${pwCopies}; keep-out aids skipped ${keepOutSkipped}; non-rigid transforms ${nonRigid}; bad keys ${keyErrors}`);

// ---- SELFTEST=1: every distinct part's shapes against the catalogue's own mesh of it (real polygoniser), at random points ----
if (process.env.SELFTEST === '1') {
  const byKind = new Map<string, Piece[]>();
  for (const p of pieces) { const k = p.key ? p.key.split('|')[0] : `${p.cat}:${p.kind}`; const a = byKind.get(k) ?? []; if (a.length < 400) a.push(p); byKind.set(k, a); }
  let seed = 12345; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const rows: string[] = [];
  for (const [k, list] of [...byKind].sort()) {
    if (process.env.SELFTEST_KINDS && !process.env.SELFTEST_KINDS.split(',').includes(k)) continue;
    const uniq = new Map<string, Piece>(); for (const p of list) { const id = p.key ?? `${p.kind}:${(p.part as { id?: string })?.id}`; if (!uniq.has(id)) uniq.set(id, p); }
    const sample = [...uniq.values()].slice(0, /^(VLV|TEE|OLET)$/.test(k) ? 2 : 6);
    let missed = 0, extra = 0, n = 0, worstMiss = 0, worstExtra = 0;
    for (const p of sample) {
      let part = p.part as any;   // eslint-disable-line @typescript-eslint/no-explicit-any
      if (p.key && /^(VLV|TEE|OLET|SWEL|SWTEE|CPLG|SWG|NIP|PLUG)/.test(p.key)) { STUB = false; try { const fresh = (globalThis as any).__fresh ?? new Map(); (globalThis as any).__fresh = fresh; part = fresh.get(p.key); if (!part) { part = rebuildFresh(p.key); fresh.set(p.key, part); } } finally { STUB = true; } }   // eslint-disable-line @typescript-eslint/no-explicit-any
      if (!part) continue;
      const comps: BVH[] = [];
      for (const so of buildGeometry(part).solids) { const m = so.mesh as MeshData; if (!m.indices.length) continue; for (const sh of meshShapesRaw(m)) comps.push(sh); }
      const lo = p.shapes.reduce((a, s) => [Math.min(a[0], s.lo[0]), Math.min(a[1], s.lo[1]), Math.min(a[2], s.lo[2])] as V3, [Infinity, Infinity, Infinity] as V3), hi = p.shapes.reduce((a, s) => [Math.max(a[0], s.hi[0]), Math.max(a[1], s.hi[1]), Math.max(a[2], s.hi[2])] as V3, [-Infinity, -Infinity, -Infinity] as V3);
      for (let t = 0; t < 1500; t++) {
        const x = lo[0] + (hi[0] - lo[0]) * (rnd() * 1.2 - 0.1), y = lo[1] + (hi[1] - lo[1]) * (rnd() * 1.2 - 0.1), z = lo[2] + (hi[2] - lo[2]) * (rnd() * 1.2 - 0.1);
        const sd = Math.min(...p.shapes.map(s => s.f(x, y, z))), inMesh = comps.some(c => c.inside(x, y, z)), md = Math.sqrt(Math.min(...comps.map(c => c.dist2(x, y, z))));
        n++;
        if (inMesh && sd > 0.05 && md > 0.05) { missed++; worstMiss = Math.max(worstMiss, Math.min(sd, md)); }
        if (!inMesh && sd < -0.05 && md > 0.05) { extra++; worstExtra = Math.max(worstExtra, Math.min(-sd, md)); }
      }
    }
    rows.push(`${k.padEnd(22)} parts ${String(sample.length).padStart(2)} pts ${String(n).padStart(5)}  mesh-solid-but-shape-outside ${String(missed).padStart(4)} (worst ${worstMiss.toFixed(3)})  shape-inside-but-mesh-outside ${String(extra).padStart(4)} (worst ${worstExtra.toFixed(3)})`);
  }
  console.log(rows.join('\n')); process.exit(0);
}
// ---- SELFTEST=3 (reviewer): every distinct part - each vertex of the catalogue's own mesh must lie inside or on this detector's solids ----
if (process.env.SELFTEST === '3') {
  const seen = new Map<string, Piece>();
  for (const p of pieces) { const kk = p.key?.split('|'); const id = kk ? (kk[0] === 'PIPE' || kk[0] === 'STUDS' ? kk.slice(0, 3).join('|') : p.key!) : `${p.cat}:${p.kind}:${(p.part as { designation?: string })?.designation}`; if (!seen.has(id)) seen.set(id, p); }
  const rows: { id: string; worst: number; n: number; at: number[]; solid: string }[] = []; let nParts = 0, nVerts = 0;
  for (const [id, p] of seen) {
    let part = p.part as any;   // eslint-disable-line @typescript-eslint/no-explicit-any
    if (p.key && /^(VLV|TEE|OLET|SWEL|SWTEE)/.test(p.key)) { STUB = false; try { part = rebuildFresh(p.key) ?? part; } finally { STUB = true; } }
    if (!part) continue; if (p.shapes.every(sh => sh.kind === 'convex' || sh.kind === 'bvh' || sh.kind === 'open') && !(p.key && /^(VLV|TEE|OLET)/.test(p.key))) continue; nParts++;
    let worst = -Infinity, at: number[] = [], solid = '', n = 0;
    let geo; try { STUB = false; geo = buildGeometry(part); } finally { STUB = true; }
    for (const so of geo.solids) { const P = so.mesh.positions, stride = 3 * Math.max(1, Math.floor(P.length / 3 / 20000)); for (let i = 0; i < P.length; i += stride) { n++; let d = Infinity; for (const s of p.shapes) { const v = s.f(P[i], P[i + 1], P[i + 2]); if (v < d) d = v; } if (d > worst) { worst = d; at = [P[i], P[i + 1], P[i + 2]]; solid = so.name; } } }
    nVerts += n; rows.push({ id, worst, n, at, solid }); if (worst > 0.02 || nParts % 50 === 0) log(`selftest3 ${nParts}/${seen.size} ${id.slice(0, 80)} worst ${worst.toFixed(4)} (${solid})`);
  }
  rows.sort((a, b) => b.worst - a.worst);
  writeFileSync(`${HERE}/selftest3-${LABEL}.json`, JSON.stringify(rows, null, 1));
  console.log(`SELFTEST=3: ${nParts} distinct parts, ${nVerts} mesh vertices; parts with a vertex more than 0.02 in outside their solids: ${rows.filter(r => r.worst > 0.02).length}`);
  for (const r of rows.slice(0, 40)) console.log(r.worst.toFixed(4).padStart(9), r.id.slice(0, 110), '|', r.solid, r.at.map(v => v.toFixed(2)).join(','), `(${r.n} verts)`);
  process.exit(0);
}
// =====================================================================================================
// Planted clashes (PLANT=1), made in memory
// =====================================================================================================
const planted: { tag: string; expect: string }[] = [];
const isPipeCyl = (p: Piece) => p.kind === 'pipe' && (p.cat === 'comp' || p.cat === 'nozzle');
function plantCopy(src: Piece, move: V3, tag: string, expect: string) {
  const T = [...src.T]; T[12] += move[0]; T[13] += move[1]; T[14] += move[2];
  const q = addPiece({ ...src, model: src.model, line: 'PLANTED', tag, T, a: addv(src.a!, move), b: addv(src.b!, move), ends: [], planted: true, onRun: undefined });
  if (q) planted.push({ tag, expect });
}

// =====================================================================================================
// Broad phase: a uniform grid of 48 in cells
// =====================================================================================================
const CELL = 48;
class Grid {
  m = new Map<string, number[]>();
  add(id: number, lo: V3, hi: V3) { for (let i = Math.floor(lo[0] / CELL); i <= Math.floor(hi[0] / CELL); i++) for (let j = Math.floor(lo[1] / CELL); j <= Math.floor(hi[1] / CELL); j++) for (let k = Math.floor(lo[2] / CELL); k <= Math.floor(hi[2] / CELL); k++) { const key = `${i},${j},${k}`; let a = this.m.get(key); if (!a) { a = []; this.m.set(key, a); } a.push(id); } }
  query(lo: V3, hi: V3): Set<number> { const out = new Set<number>(); for (let i = Math.floor(lo[0] / CELL); i <= Math.floor(hi[0] / CELL); i++) for (let j = Math.floor(lo[1] / CELL); j <= Math.floor(hi[1] / CELL); j++) for (let k = Math.floor(lo[2] / CELL); k <= Math.floor(hi[2] / CELL); k++) { const a = this.m.get(`${i},${j},${k}`); if (a) for (const x of a) out.add(x); } return out; }
}
function boxesTouch(alo: V3, ahi: V3, blo: V3, bhi: V3, g = 0) { return alo[0] <= bhi[0] + g && blo[0] <= ahi[0] + g && alo[1] <= bhi[1] + g && blo[1] <= ahi[1] + g && alo[2] <= bhi[2] + g && blo[2] <= ahi[2] + g; }

// planting needs a grid of the pieces as loaded
if (PLANT) {
  const g0 = new Grid(); for (const p of pieces) if (isPipeCyl(p)) g0.add(p.id, p.lo, p.hi);
  // (1) a copy of a pipeway pipe moved 2 in into the nearest parallel pipe of a unit or of the mains
  let best: { s: Piece; o: Piece; gap: number; dir: V3 } | null = null;
  for (const s of pieces) {
    if (s.model !== 'pipeway' || !isPipeCyl(s) || s.cat !== 'comp') continue;
    const ds = unit(sub(s.b!, s.a!)), rs = (s.shapes[0].hi[0]);
    for (const id of g0.query(addv(s.lo, [-12, -12, -12]), addv(s.hi, [12, 12, 12]))) {
      const o = pieces[id]; if (o.model === 'pipeway' || !isPipeCyl(o)) continue;
      const dov = unit(sub(o.b!, o.a!)); if (Math.abs(Math.abs(dot(ds, dov)) - 1) > 1e-6) continue;
      // overlap along the axis of at least 6 in
      const t0 = dot(sub(o.a!, s.a!), ds), t1 = dot(sub(o.b!, s.a!), ds), Ls = len(sub(s.b!, s.a!)); if (Math.min(Ls, Math.max(t0, t1)) - Math.max(0, Math.min(t0, t1)) < 6) continue;
      const w = sub(o.a!, s.a!), perp = sub(w, [ds[0] * dot(w, ds), ds[1] * dot(w, ds), ds[2] * dot(w, ds)]), dist = len(perp), gap = dist - rs - o.shapes[0].hi[0];
      if (gap > 0.5 && gap < 12 && (!best || gap < best.gap)) best = { s, o, gap, dir: unit(perp) };
    }
  }
  if (best) plantCopy(best.s, [best.dir[0] * (best.gap + 2), best.dir[1] * (best.gap + 2), best.dir[2] * (best.gap + 2)], `PLANTED-1 copy of ${best.s.tag} moved ${(best.gap + 2).toFixed(2)} in`, `against ${best.o.model} ${best.o.line} ${best.o.tag}, ~2 in`);
  // (2) a copy of a pipeway pipe pushed 2 in down into the junction frame beam it crosses over
  const beams = pieces.filter(p => p.kind === 'W' && (p.cat === 'junction' || (p.cat === 'steel' && p.model.startsWith('unit'))) && p.hi[1] - p.lo[1] < 30 && Math.max(p.hi[0] - p.lo[0], p.hi[2] - p.lo[2]) > 60);
  let best2: { s: Piece; b: Piece; gap: number } | null = null;
  for (const s of pieces) {
    if (s.model !== 'pipeway' || !isPipeCyl(s) || s.cat !== 'comp') continue;
    const ds = unit(sub(s.b!, s.a!)); if (Math.abs(ds[1]) > 1e-6) continue;
    for (const b of beams) {
      if (!(s.lo[0] < b.hi[0] && s.hi[0] > b.lo[0] && s.lo[2] < b.hi[2] && s.hi[2] > b.lo[2])) continue;
      const gap = s.lo[1] - b.hi[1]; if (gap > 0.5 && gap < 48 && (!best2 || gap < best2.gap)) best2 = { s, b, gap };
    }
  }
  if (best2) plantCopy(best2.s, [0, -(best2.gap + 2), 0], `PLANTED-2 copy of ${best2.s.tag} pushed ${(best2.gap + 2).toFixed(2)} in down`, `into ${best2.b.tag}, ~2 in`);
  // (reviewer) (3) inside one unit cell, with no bypass of the relationships: a copy of an equipment body moved sideways 2 in into its neighbour
  //     (the copy keeps its kind of identity: its own tag, the cell's model, its own structure, so only the scope and the contact policy decide)
  if (FULL) {
    const eq = pieces.filter(p => p.cat === 'equip' && p.model.startsWith('unit-'));
    let b3: { s: Piece; o: Piece; gap: number; ax: number; sg: number } | null = null;
    for (const s of eq) for (const o of eq) {
      if (o === s || o.model !== s.model) continue;
      for (const ax of [0, 2]) { const oth = 2 - ax; if (!(s.lo[1] < o.hi[1] && s.hi[1] > o.lo[1] && s.lo[oth] < o.hi[oth] - 6 && s.hi[oth] > o.lo[oth] + 6)) continue; const sg = o.lo[ax] >= s.hi[ax] ? 1 : s.lo[ax] >= o.hi[ax] ? -1 : 0; if (!sg) continue; const gap = sg > 0 ? o.lo[ax] - s.hi[ax] : s.lo[ax] - o.hi[ax]; if (gap > 1 && gap < 24 && (!b3 || gap < b3.gap)) b3 = { s, o, gap, ax, sg }; }
    }
    if (b3) {
      const mv: V3 = [0, 0, 0]; mv[b3.ax] = b3.sg * (b3.gap + 2); const T = [...b3.s.T]; T[12] += mv[0]; T[13] += mv[1]; T[14] += mv[2];
      const ctag = `${b3.s.tags![0]}~copy`, tag = `PLANTED-3 copy of ${b3.s.tags![0]} moved ${(b3.gap + 2).toFixed(2)} in`;
      const q = addPiece({ ...b3.s, tag, T, tags: [ctag, 'equipment'], struct: `${b3.s.model}:${ctag}` });
      if (q) planted.push({ tag, expect: `against ${b3.o.model} ${b3.o.tags![0]} (same cell), ~2 in` });
    }
  }
  log('planted', JSON.stringify(planted));
}

// =====================================================================================================
// Narrow phase: Lipschitz branch-and-bound over two SDFs, then local ascent for the depth
// =====================================================================================================
interface WS { s: Shp; T: M4; lo: V3; hi: V3; shift?: V3; inv?: Float64Array; sc?: number }
/** the inverse of a placement's linear part, and its smallest singular value: some models' frames are sheared (frameFromAxes does not square y to z),
 *  so a piece is mapped back exactly with the true inverse, and its local distances are scaled by the smallest stretch (a lower bound, 1-Lipschitz again) */
const invCache = new WeakMap<object, { inv: Float64Array; sc: number }>();
function invOf(T: M4): { inv: Float64Array; sc: number } {
  let r = invCache.get(T); if (r) return r;
  const a = T[0], b = T[4], c = T[8], d = T[1], e = T[5], f = T[9], g = T[2], h = T[6], i = T[10];   // rows of the 3x3 linear part
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C;
  const inv = Float64Array.from([A / det, -(b * i - c * h) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, -(a * f - c * d) / det, C / det, -(a * h - b * g) / det, (a * e - b * d) / det]);   // row-major inverse
  // smallest singular value: sqrt of the smallest eigenvalue of M^T M (Jacobi on the 3x3)
  const M = [[a, b, c], [d, e, f], [g, h, i]], S = [0, 1, 2].map(r0 => [0, 1, 2].map(c0 => M[0][r0] * M[0][c0] + M[1][r0] * M[1][c0] + M[2][r0] * M[2][c0]));
  for (let sweep = 0; sweep < 30; sweep++) for (const [p, q] of [[0, 1], [0, 2], [1, 2]]) { if (Math.abs(S[p][q]) < 1e-14) continue; const th = 0.5 * Math.atan2(2 * S[p][q], S[q][q] - S[p][p]), cs = Math.cos(th), sn = Math.sin(th);
    for (let k = 0; k < 3; k++) { const skp = S[k][p], skq = S[k][q]; S[k][p] = cs * skp - sn * skq; S[k][q] = sn * skp + cs * skq; } for (let k = 0; k < 3; k++) { const spk = S[p][k], sqk = S[q][k]; S[p][k] = cs * spk - sn * sqk; S[q][k] = sn * spk + cs * sqk; } }
  r = { inv, sc: Math.sqrt(Math.max(1e-12, Math.min(S[0][0], S[1][1], S[2][2]))) }; invCache.set(T, r); return r;
}
let sdfEvals = 0;
function wEval(w: WS, x: number, y: number, z: number): number {
  sdfEvals++;
  const T = w.T; let px = x - T[12], py = y - T[13], pz = z - T[14]; if (w.shift) { px -= w.shift[0]; py -= w.shift[1]; pz -= w.shift[2]; }
  if (!w.inv) { const r = invOf(T); w.inv = r.inv; w.sc = r.sc; }
  const m = w.inv;
  return w.sc! * w.s.f(m[0] * px + m[1] * py + m[2] * pz, m[3] * px + m[4] * py + m[5] * pz, m[6] * px + m[7] * py + m[8] * pz);
}
const H = 1e-4;
function grad(w: WS, p: V3, sign = 1): V3 {
  const gx = wEval(w, p[0] + H, p[1], p[2]) - wEval(w, p[0] - H, p[1], p[2]), gy = wEval(w, p[0], p[1] + H, p[2]) - wEval(w, p[0], p[1] - H, p[2]), gz = wEval(w, p[0], p[1], p[2] + H) - wEval(w, p[0], p[1], p[2] - H);
  const L = Math.hypot(gx, gy, gz) || 1; return [sign * gx / L, sign * gy / L, sign * gz / L];
}
class Heap { a: { k: number; lo: V3; hi: V3; sa: number; sb: number }[] = []; push(x: Heap['a'][number]) { const a = this.a; a.push(x); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p].k <= a[i].k) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } } pop() { const a = this.a, top = a[0], last = a.pop()!; if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l].k < a[m].k) m = l; if (r < a.length && a[r].k < a[m].k) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } } return top; } get size() { return this.a.length; } }
interface Hit { g: number; p: V3; depth: number; dA: number; dB: number }
let pairTests = 0, budgetOut = 0, lastBudgetOut = false; const budgetOutPairs: { a: string; b: string; bestG: number }[] = [];
/** do the solids A and B share a point 0.01 inside both? if so, how deep */
function pairTest(A: WS, B: WS, tol = TOL, budget = 4000): Hit | null {
  pairTests++;
  const lo: V3 = [Math.max(A.lo[0], B.lo[0]) - 1e-3, Math.max(A.lo[1], B.lo[1]) - 1e-3, Math.max(A.lo[2], B.lo[2]) - 1e-3], hi: V3 = [Math.min(A.hi[0], B.hi[0]) + 1e-3, Math.min(A.hi[1], B.hi[1]) + 1e-3, Math.min(A.hi[2], B.hi[2]) + 1e-3];
  if (lo[0] > hi[0] || lo[1] > hi[1] || lo[2] > hi[2]) return null;
  const la = A.s.lip, lb = B.s.lip, heap = new Heap();
  const consider = (blo: V3, bhi: V3) => { const c: V3 = [(blo[0] + bhi[0]) / 2, (blo[1] + bhi[1]) / 2, (blo[2] + bhi[2]) / 2], r = Math.hypot(bhi[0] - blo[0], bhi[1] - blo[1], bhi[2] - blo[2]) / 2, sa = wEval(A, c[0], c[1], c[2]); if (sa >= la * r - tol) return; const sb = wEval(B, c[0], c[1], c[2]); if (sb >= lb * r - tol) return; heap.push({ k: Math.max(sa, sb), lo: blo, hi: bhi, sa, sb }); };
  consider(lo, hi);
  let found: V3 | null = null, n = 0; const leftovers: V3[] = [];
  while (heap.size && n < budget) {
    const it = heap.pop(); n++;
    const c: V3 = [(it.lo[0] + it.hi[0]) / 2, (it.lo[1] + it.hi[1]) / 2, (it.lo[2] + it.hi[2]) / 2];
    if (it.k < -tol) { found = c; break; }
    const ext = [it.hi[0] - it.lo[0], it.hi[1] - it.lo[1], it.hi[2] - it.lo[2]], mx = Math.max(...ext);
    if (mx < 0.004) { if (leftovers.length < 4) leftovers.push(c); continue; }
    const axes = [0, 1, 2].filter(k => ext[k] > 0.5 * mx);
    const nc = 1 << axes.length;
    for (let m = 0; m < nc; m++) { const blo = [...it.lo] as V3, bhi = [...it.hi] as V3; axes.forEach((k, j) => { const mid = (it.lo[k] + it.hi[k]) / 2; if (m & (1 << j)) blo[k] = mid; else bhi[k] = mid; }); consider(blo, bhi); }
  }
  const seeds: V3[] = [];
  if (found) seeds.push(found);
  else {
    if (!heap.size && !leftovers.length) return null;   // everything pruned: no common point 0.01 deep
    budgetOut++; lastBudgetOut = true;
    const rest = heap.a.slice().sort((p, q) => p.k - q.k).slice(0, 3).map(x => [(x.lo[0] + x.hi[0]) / 2, (x.lo[1] + x.hi[1]) / 2, (x.lo[2] + x.hi[2]) / 2] as V3);
    seeds.push(...leftovers.slice(0, 2), ...rest);
  }
  let best: { p: V3; g: number } | null = null;
  for (const s of seeds) { const r = ascend(A, B, s); if (!best || r.g > best.g) best = r; if (best.g > tol) break; }
  if (!found && budgetOutPairs.length < 400) budgetOutPairs.push({ a: A.s.name, b: B.s.name, bestG: r6(best?.g ?? -1) });
  if (!best || best.g <= tol) return null;
  const dA = intrude(A, B, best.p), dB = intrude(B, A, best.p);
  return { g: best.g, p: best.p, depth: Math.max(dA, dB, 2 * best.g), dA, dB };
}
/** maximise min(−sA, −sB) */
function ascend(A: WS, B: WS, p0: V3): { p: V3; g: number } {
  let p = p0, ga = -wEval(A, ...p), gb = -wEval(B, ...p), g = Math.min(ga, gb), step = 0.25;
  for (let it = 0; it < 120 && step > 1e-4; it++) {
    const na = grad(A, p, -1), nb = grad(B, p, -1);
    let d: V3;
    if (ga < gb - step) d = na; else if (gb < ga - step) d = nb; else { const s = addv(na, nb); d = len(s) < 1e-6 ? na : unit(s); }
    const q = addv(p, d, step), qa = -wEval(A, ...q), qb = -wEval(B, ...q), qg = Math.min(qa, qb);
    if (qg > g + 1e-7) { p = q; ga = qa; gb = qb; g = qg; step = Math.min(step * 1.6, 8); } else step *= 0.5;
  }
  return { p, g };
}
/** the deepest point into X of the region inside Y as well (X, Y both containing p0) */
function intrude(X: WS, Y: WS, p0: V3): number {
  let p = p0, v = -wEval(X, ...p), step = 0.25;
  for (let it = 0; it < 120 && step > 1e-4; it++) {
    const d = grad(X, p, -1); let q = addv(p, d, step);
    for (let k = 0; k < 4; k++) { const sy = wEval(Y, ...q); if (sy <= 0) break; q = addv(q, grad(Y, q, 1), -(sy + 1e-5)); }
    const qv = -wEval(X, ...q);
    if (wEval(Y, ...q) <= 1e-5 && qv > v + 1e-7) { p = q; v = qv; step = Math.min(step * 1.6, 8); } else step *= 0.5;
  }
  return v;
}
const wsOf = (p: Piece, i: number, shift?: V3): WS => ({ s: p.shapes[i], T: p.T, lo: shift ? addv(p.wlo![i], shift) : p.wlo![i], hi: shift ? addv(p.whi![i], shift) : p.whi![i], shift });
/** the deepest overlap between two pieces (over their solids); skip: solids of P left out */
function pieceTest(P: Piece, Q: Piece, opts: { shiftP?: V3; skipP?: (s: Shp) => boolean; skipQ?: (s: Shp) => boolean; tol?: number } = {}): (Hit & { sa: string; sb: string }) | null {
  let best: (Hit & { sa: string; sb: string }) | null = null;
  for (let i = 0; i < P.shapes.length; i++) {
    if (opts.skipP?.(P.shapes[i])) continue;
    const A = wsOf(P, i, opts.shiftP);
    for (let j = 0; j < Q.shapes.length; j++) {
      if (opts.skipQ?.(Q.shapes[j]) || !boxesTouch(A.lo, A.hi, Q.wlo![j], Q.whi![j])) continue;
      const h = pairTest(A, wsOf(Q, j), opts.tol ?? TOL);
      if (h && (!best || h.depth > best.depth)) best = { ...h, sa: P.shapes[i].name, sb: Q.shapes[j].name };
    }
  }
  return best;
}

// ---- SELFTEST=2: placed pieces in the world (sheared frames included) against the catalogue mesh moved by the same matrix ----
if (process.env.SELFTEST === '2') {
  let seed = 777; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const groups = new Map<string, Piece[]>();
  for (const p of pieces) { if (!p.part) continue; const T = p.T, c = [[T[0], T[1], T[2]], [T[4], T[5], T[6]], [T[8], T[9], T[10]]]; let bad = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) bad = Math.max(bad, Math.abs(c[i][0] * c[j][0] + c[i][1] * c[j][1] + c[i][2] * c[j][2] - (i === j ? 1 : 0))); const k = `${bad > 2e-3 ? 'sheared' : 'rigid'}:${p.cat}:${p.kind}`; const a = groups.get(k) ?? []; if (a.length < 8 && (bad > 2e-3 || rnd() < 0.002)) a.push(p); groups.set(k, a); }
  for (const [k, list] of [...groups].sort()) {
    if (!list.length) continue; let n = 0, miss = 0, extra = 0, wm = 0;
    for (const p of list) {
      const comps: BVH[] = [];
      for (const so of buildGeometry(p.part as never).solids) { const m = so.mesh as MeshData; if (!m.indices.length) continue; const P = m.positions.slice(); for (let v = 0; v < P.length; v += 3) { const q = xp(p.T, [P[v], P[v + 1], P[v + 2]]); P[v] = q[0]; P[v + 1] = q[1]; P[v + 2] = q[2]; } comps.push(...meshShapesRaw({ positions: P, indices: m.indices })); }
      if (!comps.length) continue;
      for (let t = 0; t < 1500; t++) {
        const x = p.lo[0] + (p.hi[0] - p.lo[0]) * rnd(), y = p.lo[1] + (p.hi[1] - p.lo[1]) * rnd(), z = p.lo[2] + (p.hi[2] - p.lo[2]) * rnd();
        const sd = Math.min(...p.shapes.map((_s, i) => wEval(wsOf(p, i), x, y, z))), inM = comps.some(c => c.inside(x, y, z)), md = Math.sqrt(Math.min(...comps.map(c => c.dist2(x, y, z)))); n++;
        if (inM && sd > 0.03 && md > 0.03) { miss++; wm = Math.max(wm, md); }
        if (!inM && sd < -0.03 && md > 0.03) extra++;
      }
    }
    console.log(`${k.padEnd(34)} pieces ${String(list.length).padStart(2)} pts ${String(n).padStart(5)}  mesh-solid-shape-outside ${String(miss).padStart(4)} (worst ${wm.toFixed(3)})  shape-inside-mesh-outside ${extra}`);
  }
  process.exit(0);
}
// =====================================================================================================
// Relationships that excuse a contact (each named)
// =====================================================================================================
// (reviewer) the piece(s) each support carries: of its own line's pipes and fittings, the one(s) nearest its point (within 0.05 in of the nearest)
{
  const byLine = new Map<string, Piece[]>(); for (const p of pieces) if ((p.cat === 'comp' || p.cat === 'nozzle') && p.kind !== 'studs') { const k = `${p.model}|${p.line}`; const a = byLine.get(k) ?? []; a.push(p); byLine.set(k, a); }
  for (const S of pieces) {
    if (S.cat !== 'support' || !S.at) continue;
    const cand = byLine.get(`${S.model}|${S.line}`) ?? []; let best = Infinity; const vs: [Piece, number][] = [];
    for (const O of cand) { let v = Infinity; for (let i = 0; i < O.shapes.length; i++) v = Math.min(v, wEval(wsOf(O, i), S.at[0], S.at[1], S.at[2])); vs.push([O, v]); best = Math.min(best, v); }
    S.carries = new Set(vs.filter(([, v]) => v <= best + 0.05).map(([O]) => O.id));
  }
}
const PIPING = new Set<Cat>(['comp', 'weld', 'support', 'nozzle']);
const STATIC = new Set<Cat>(['steel', 'equip', 'concrete', 'frame', 'junction', 'rack', 'sleeper']);
const JOINT_KINDS = new Set(['flange', 'blind', 'gasket', 'valve', 'spade', 'spectacle']);
const segDist = (p: V3, a: V3, b: V3) => { const ab = sub(b, a), L2 = dot(ab, ab), t = L2 < 1e-12 ? 0 : Math.max(0, Math.min(1, dot(sub(p, a), ab) / L2)); return len(sub(p, addv(a, ab, t))); };
function sharedFace(P: Piece, Q: Piece): boolean {
  if (!P.ends?.length || !Q.ends?.length) return false;
  for (const e of P.ends) for (const f of Q.ends) if (len(sub(e.p, f.p)) <= JOINT && dot(e.d, f.d) < -0.99) return true;
  return false;
}
function coaxialJoint(S: Piece, Q: Piece): boolean {   // a stud set through the pieces of its joint
  if (!S.a || !S.b || !Q.a || !Q.b) return false;
  if (Q.axes?.some(ax => { const ds = unit(sub(S.b!, S.a!)); if (len(crs(ds, ax.d)) > 0.01) return false; const w = sub(S.a!, ax.p); return len(sub(w, [ax.d[0] * dot(w, ax.d), ax.d[1] * dot(w, ax.d), ax.d[2] * dot(w, ax.d)])) <= JOINT; })) return true;
  const ds = unit(sub(S.b, S.a)), dq = sub(Q.b, Q.a); if (len(dq) < 1e-6) return false;
  if (len(crs(ds, unit(dq))) > 0.01) return false;
  const w = sub(Q.a, S.a), off = len(sub(w, [ds[0] * dot(w, ds), ds[1] * dot(w, ds), ds[2] * dot(w, ds)])); if (off > JOINT) return false;
  const L = len(sub(S.b, S.a)), t0 = dot(sub(Q.a, S.a), ds), t1 = dot(sub(Q.b, S.a), ds);
  return Math.max(t0, t1) >= -JOINT && Math.min(t0, t1) <= L + JOINT;
}
/** the point a support bears on (below) or hangs from (above), and which way it bears */
function bearing(S: Piece): { pts: V3[]; dir: V3 } | null {
  const k = (S.key ?? '').split('|'), T = S.T;
  switch (S.supType) {
    case 'shoe': case 'guide': case 'anchor': { const h = k[4] !== undefined ? Number(k[4]) : 4; return { pts: [xp(T, [0, -h, 0])], dir: [0, 1, 0] }; }
    case 'stanchion': return { pts: [xp(T, [0, 0, 0])], dir: [0, 1, 0] };
    case 'trunnion': { const h = Number(k[3]); return { pts: [xp(T, [0, -h, 0])], dir: [0, 1, 0] }; }
    case 'hanger': { const h = Number(k[3]); return { pts: [xp(T, [0, h + 0.375, 0])], dir: [0, -1, 0] }; }
    case 'trapeze': { const p = pipeDims(Number(k[1]), k[2] as PipeClass), a = k[5] !== undefined ? Number(k[5]) : p.OD / 2 + 6; return { pts: [xp(T, [-a, Number(k[3]) + 0.375, 0]), xp(T, [a, Number(k[4]) + 0.375, 0])], dir: [0, -1, 0] }; }
  }
  return null;
}
/** (reviewer) the member(s) a hanger or trapeze hangs from: for each rod top, the horizontal member whose own section (its profile's box, along its
 *  length, in the member's frame) holds it within 0.5 in, a beam, strut, girder or channel but not a bracing rod; not any member whose world bounding
 *  box does (a diagonal bracing rod's box spans its whole bay) */
const hangCache = new Map<number, Set<number>>();
function hangsFrom(S: Piece, pts: V3[]): Set<number> {
  let r = hangCache.get(S.id); if (r) return r; r = new Set();
  for (const x of pts) {
    const cands: [number, number][] = [];
    for (const id of grid0().query(addv(x, [-1, -1, -1]), addv(x, [1, 1, 1]))) {
      const O = pieces[id]; if (!STATIC.has(O.cat) || O.kind === 'ROD' || O.shapes.length !== 1 || !(O.shapes[0].kind === 'prism' || O.shapes[0].kind === 'cyl') || Math.abs(xd(O.T, [0, 0, 1])[1]) > 0.5) continue;
      const { inv } = invOf(O.T), px = x[0] - O.T[12], py = x[1] - O.T[13], pz = x[2] - O.T[14], q = [inv[0] * px + inv[1] * py + inv[2] * pz, inv[3] * px + inv[4] * py + inv[5] * pz, inv[6] * px + inv[7] * py + inv[8] * pz], sh = O.shapes[0];
      if ([0, 1, 2].every(k => q[k] >= sh.lo[k] - 0.5 && q[k] <= sh.hi[k] + 0.5)) cands.push([id, 0]);
    }
    for (const [id] of cands) r.add(id);
  }
  hangCache.set(S.id, r); if (process.env.DEBUGHANG && S.tag.includes(process.env.DEBUGHANG)) console.error('HANG', S.tag, JSON.stringify(pts.map(p => p.map(r6))), [...r].map(id => pieces[id].tag), [...grid0().query(addv(pts[0], [-3, -3, -3]), addv(pts[0], [3, 3, 3]))].map(id => pieces[id]).filter(O => STATIC.has(O.cat)).map(O => `${O.tag} ${O.shapes.length} ${O.shapes[0].kind} ${r6(wEval(wsOf(O, 0), pts[0][0], pts[0][1], pts[0][2]))} ax ${xd(O.T, [0, 0, 1]).map(r6)}`));
  return r;
}
/** (reviewer) a nozzle's neck is set in one solid of its equipment (the one holding, or nearest to, the neck's inner end) and the weld seams drawn on it */
const attachCache = new Map<string, Set<string>>();
function attachOf(N: Piece, E: Piece): Set<string> {
  const k = `${N.model}|${N.line}|${E.id}`; let r = attachCache.get(k); if (r) return r; r = new Set();
  const inner = nozzleInner.get(`${N.model}|${N.line}`);
  if (inner) { let best = Infinity, bn = ''; E.shapes.forEach((s, i) => { const d = wEval(wsOf(E, i), inner[0], inner[1], inner[2]); if (d <= 0.05) r!.add(s.name); if (d < best) { best = d; bn = s.name; } }); if (bn) r.add(bn); }
  for (const s of E.shapes) if (/seam/i.test(s.name)) r.add(s.name);
  attachCache.set(k, r); return r;
}
/** is any solid of Q at (or within d of) point x */
const near = (Q: Piece, x: V3, d: number) => Q.shapes.some((s, i) => x[0] >= Q.wlo![i][0] - d && x[0] <= Q.whi![i][0] + d && x[1] >= Q.wlo![i][1] - d && x[1] <= Q.whi![i][1] + d && x[2] >= Q.wlo![i][2] - d && x[2] <= Q.whi![i][2] + d && wEval(wsOf(Q, i), x[0], x[1], x[2]) <= d);
const ANCHORS = (s: Shp) => /anchor (rods|bolts)/i.test(s.name);
type Verdict = { skip: string } | { test: true; shiftP?: V3; swap?: boolean; skipP?: (s: Shp) => boolean; skipQ?: (s: Shp) => boolean; note?: string; cls?: 'bearing' };
function relate(P: Piece, Q: Piece): Verdict {
  if (P.planted || Q.planted) return { test: true, note: 'planted' };
  const sameModel = P.model === Q.model;
  // static against static
  if (STATIC.has(P.cat) && STATIC.has(Q.cat)) {
    if (sameModel && P.struct && P.struct === Q.struct) {
      // (reviewer) an equipment body on its own pad or pier (same tag): tested lifted by the bearing allowance, anchor rods left out
      for (const [E, F, swap] of [[P, Q, false], [Q, P, true]] as const) if (E.cat === 'equip' && F.cat !== 'equip' && E.tags?.[0] && F.tags?.[0] === E.tags[0]) return { test: true, shiftP: [0, BEAR, 0], swap, skipP: ANCHORS, skipQ: ANCHORS, cls: 'bearing', note: `equipment on its own ${F.tags?.[1] ?? 'foundation'}; bearing face allowed ${BEAR} in, its anchor bolts not tested` };
      return { skip: 'one structure' };
    }
    // (reviewer) an equipment item on the structure built to carry it: an air cooler on the unit's cooler deck, an item on its own elevated structure (J-1201 on J-1201's deck)
    for (const [E, F, swap] of [[P, Q, false], [Q, P, true]] as const) if (sameModel && E.cat === 'equip' && F.cat !== 'equip' && E.tags?.[0] && ((/^A-\d/.test(E.tags[0]) && F.struct === `${F.model}:cooler-deck`) || F.struct === `${E.model}:${E.tags[0]}:access`)) return { test: true, shiftP: [0, BEAR, 0], swap, skipP: ANCHORS, skipQ: ANCHORS, cls: 'bearing', note: `equipment on the structure that carries it (${F.struct!.split(':').slice(1).join(':')}); bearing face allowed ${BEAR} in, its anchor bolts not tested` };
    // a frame's (or junction's) posts and pedestals on their floor
    for (const [X, Y, swap] of [[P, Q, false], [Q, P, true]] as const) {
      if ((X.cat === 'frame' || X.cat === 'junction' || (X.cat === 'steel' && X.struct?.endsWith(':cooler-deck'))) && X.tags && (X.tags.includes('post') || X.tags.includes('pad'))) {
        const base = xp(X.T, [0, 0, 0]);   // posts: stood up from their base; pedestals: frameFromAxes at mid-height (checked below)
        const baseY = Math.min(X.lo[1], X.hi[1]);
        const foot: V3 = [(X.lo[0] + X.hi[0]) / 2, baseY - 0.02, (X.lo[2] + X.hi[2]) / 2]; void base;
        if (near(Y, foot, 0.1)) return { test: true, shiftP: [0, BEAR, 0], swap, cls: 'bearing', note: `${X.cat} part on its floor (${Y.cat}); bearing face allowed ${BEAR} in` };
      }
    }
    return { test: true };
  }
  // supports
  for (const [S, O, swap] of [[P, Q, false], [Q, P, true]] as const) {
    if (S.cat !== 'support') continue;
    if (O.model === S.model && O.line === S.line && S.carries?.has(O.id)) return { skip: 'support → the piece it carries' };
    if (STATIC.has(O.cat)) {
      const b = bearing(S);
      // a hanger or trapeze hangs from a horizontal member whose section holds its rod's top: its rod and top plate meet that member by design
      if (b && b.dir[1] < 0 && hangsFrom(S, b.pts).has(O.id)) return { skip: 'support → the member it hangs from' };
      if (b && b.dir[1] > 0 && b.pts.some(x => near(O, addv(x, b.dir, -0.02), 0.1))) {
        return { test: true, shiftP: [0, BEAR, 0], swap, skipP: s => s.name.startsWith('anchor rods'), cls: 'bearing', note: `support bears on this ${O.cat} (its member); bearing face allowed ${BEAR} in, anchor rods not tested` };
      }
    }
  }
  if (!PIPING.has(P.cat) || !PIPING.has(Q.cat)) {
    // a nozzle with its own equipment body
    for (const [N, E, swap] of [[P, Q, false], [Q, P, true]] as const) if ((N.cat === 'nozzle' || (N.cat === 'weld' && N.equip)) && N.equip && E.cat === 'equip' && E.model === N.model && E.tags?.includes(N.equip)) { const att = attachOf(N, E); return { test: true, swap, skipQ: s => att.has(s.name), note: `nozzle against its own equipment, the solids it is set in (${[...att].join(', ')}) not tested` }; }
    for (const [N, E] of [[P, Q], [Q, P]] as const) if (N.endEquip && E.cat === 'equip' && E.model === N.model && N.endEquip.some(x => E.tags?.includes(x.equip))) return { skip: 'line bolted to the equipment\'s nozzle' };
    return { test: true };
  }
  // piping against piping
  for (const [Wd, O] of [[P, Q], [Q, P]] as const) {
    if (Wd.cat !== 'weld') continue;
    if (Wd.model === O.model && Wd.joins?.includes(O.tag)) return { skip: 'weld → the pieces it joins' };
    const run = Wd.joins?.find(j => j.endsWith('/run'));
    if (run && Wd.model === O.model && O.line === run.slice(0, -4) && O.a && O.b && segDist(Wd.at!, O.a, O.b) <= (O.NPS ?? 0) / 2 + 1) return { skip: 'branch weld → its run' };
  }
  for (const [S, O] of [[P, Q], [Q, P]] as const) {
    if (S.kind !== 'studs') continue;
    if ((JOINT_KINDS.has(O.kind) || O.kind === 'studs') && coaxialJoint(S, O)) return { skip: 'studs → their joint' };
  }
  for (const [Ol, O] of [[P, Q], [Q, P]] as const) {
    if (Ol.kind !== 'olet' || !Ol.onRun) continue;
    if (O.model === Ol.model && O.line === Ol.onRun && O.a && O.b && segDist(Ol.a!, O.a, O.b) <= (O.NPS ?? 0) / 2 + 1) return { skip: 'branch outlet → its run' };
  }
  if (sharedFace(P, Q)) return { skip: 'joined at a shared face' };
  // weld beads of a joint touch the joint's neighbours only through its joins; a weld on the same line, coaxial, at a piece's end
  return { test: true };
}
const inScope = (P: Piece, Q: Piece) => P.model !== Q.model || !!P.own3 || !!Q.own3 || P.planted || Q.planted || FULL;

// =====================================================================================================
// The sweep
// =====================================================================================================
interface Finding { a: { model: string; line: string; tag: string; kind: string }; b: { model: string; line: string; tag: string; kind: string }; depthIn: number; at: V3; note: string; class: 'overlap' | 'bearing' | 'weld-axis' | 'interface' | 'clearance'; thicknessIn?: number; gapIn?: number; scope?: string }
const findings: Finding[] = [];
const ref = (p: Piece) => ({ model: p.model, line: p.line, tag: p.tag, kind: p.kind });
let GRID0: Grid | null = null;
function grid0(): Grid { if (!GRID0) { GRID0 = new Grid(); for (const p of pieces) GRID0.add(p.id, p.lo, p.hi); } return GRID0; }
const grid = grid0();
log('grid', grid.m.size, 'cells');
// ---- debugging aids: DEBUGNEAR=<tag substring> lists what is near; DEBUGRIGID lists non-rigid transforms ----
if (process.env.DEBUGNEAR) {
  for (const P of pieces.filter(p => p.tag.includes(process.env.DEBUGNEAR!))) {
    console.error('NEAR', P.model, P.line, P.tag, P.kind, P.cat, 'box', P.lo.map(r6), P.hi.map(r6));
    for (const id of grid0().query(addv(P.lo, [-6, -6, -6]), addv(P.hi, [6, 6, 6]))) { const Q = pieces[id]; if (Q === P) continue; const v = relate(P, Q); const h = 'skip' in v ? null : pieceTest(v.swap ? Q : P, v.swap ? P : Q, { shiftP: v.shiftP, skipP: v.skipP, skipQ: v.skipQ }); console.error('   ', Q.model, Q.line, Q.tag, Q.kind, Q.cat, 'box', Q.lo.map(r6), Q.hi.map(r6), 'touch', boxesTouch(P.lo, P.hi, Q.lo, Q.hi), 'scope', inScope(P, Q), JSON.stringify(v), h ? `HIT ${r6(h.depth)} ${h.sa} x ${h.sb}` : '-'); }
  }
}
if (process.env.DEBUGRIGID) { let n = 0; const kinds = new Map<string, number>(); for (const p of pieces) { const T = p.T; const c = [[T[0], T[1], T[2]], [T[4], T[5], T[6]], [T[8], T[9], T[10]]]; let bad = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) bad = Math.max(bad, Math.abs(c[i][0] * c[j][0] + c[i][1] * c[j][1] + c[i][2] * c[j][2] - (i === j ? 1 : 0))); if (bad > 2e-3) { kinds.set(`${p.cat}:${p.kind}`, (kinds.get(`${p.cat}:${p.kind}`) ?? 0) + 1); if (n++ < 6) console.error('NONRIGID', p.model, p.tag, p.kind, r6(bad), JSON.stringify(T.slice(0, 12).map(r6))); } } console.error('NONRIGID kinds', JSON.stringify([...kinds])); }

const excusedBy = new Map<string, number>(); let candidatePairs = 0, testedPairs = 0;
const AUDITX = new Set((process.env.AUDITX ?? '').split(',').filter(Boolean)); const auditx: unknown[] = [];
const seenPair = new Set<number>();
const N = pieces.length;
for (const ids of grid.m.values()) {
  for (let x = 0; x < ids.length; x++) for (let y = x + 1; y < ids.length; y++) {
    let i = ids[x], j = ids[y]; if (i > j) [i, j] = [j, i];
    const P = pieces[i], Q = pieces[j];
    if (!inScope(P, Q)) continue;
    if (!boxesTouch(P.lo, P.hi, Q.lo, Q.hi)) continue;
    const key = i * N + j; if (seenPair.has(key)) continue; seenPair.add(key);
    candidatePairs++;
    const v = relate(P, Q);
    if ('skip' in v) { excusedBy.set(v.skip, (excusedBy.get(v.skip) ?? 0) + 1);
      if (AUDITX.has(v.skip)) { const h = pieceTest(P, Q); if (h && h.depth >= NOISE) auditx.push({ why: v.skip, a: ref(P), b: ref(Q), acat: P.cat, bcat: Q.cat, depthIn: r6(h.depth), at: h.p.map(r6), note: `${h.sa} x ${h.sb}; into ${P.kind} ${r6(h.dA)}, into ${Q.kind} ${r6(h.dB)}` }); }
      continue; }
    testedPairs++;
    const [A, B] = v.swap ? [Q, P] : [P, Q];
    const h = pieceTest(A, B, { shiftP: v.shiftP, skipP: v.skipP, skipQ: v.skipQ });
    if (!h || h.depth < NOISE) { if (v.cls === 'bearing') excusedBy.set('support/frame on its member (no overlap past the bearing face)', (excusedBy.get('support/frame on its member (no overlap past the bearing face)') ?? 0) + 1); continue; }
    const tw = [A, B].filter(x => (x.tilt ?? 0) > 1).map(x => `${x.tag} is a weld bead tilted ${x.tilt!.toFixed(1)} deg off the pipe it joins (the model's weld axis)`).join('; ');
    findings.push({ a: ref(A), b: ref(B), depthIn: r6(h.depth + (v.shiftP ? BEAR * 0 : 0)), at: h.p.map(r6) as V3, thicknessIn: r6(2 * h.g), note: `${h.sa} x ${h.sb}; depth into ${A.kind} ${r6(h.dA)}, into ${B.kind} ${r6(h.dB)}${v.note ? '; ' + v.note : ''}${tw ? '; ' + tw : ''}${A.model === B.model ? (A.line && A.line === B.line ? '; same line' : '; same model') : ''}`, scope: A.model === B.model ? 'intra-model' : 'cross-model', class: v.cls ?? (A.model === B.model && A.line === B.line && [A, B].some(x => (x.tilt ?? 0) > 1) ? 'weld-axis' : 'overlap') });
  }
}
if (AUDITX.size) writeFileSync(`${HERE}/auditx-${LABEL}.json`, JSON.stringify(auditx, null, 1));
log(`sweep: candidate pairs ${candidatePairs}, tested ${testedPairs}, solid pair tests ${pairTests} (budget out ${budgetOut}), sdf evals ${sdfEvals}, findings ${findings.length}`);

// =====================================================================================================
// Interfaces: every spool where two models (or a model and the world beyond) meet
// =====================================================================================================
interface FaceCheck { spool: string; face: string; model: string; NPS: number; cls: string; at: V3; u: V3; refs: string[]; mates: string[]; ok: boolean; problems: string[]; open?: string }
const faces: FaceCheck[] = [], clearance: { spool: string; zone: string; piece: string; gapIn: number; at: V3 }[] = [];
const spools = new Map<string, { model: string; faces: { n: any; model: string }[] }>();   // eslint-disable-line @typescript-eslint/no-explicit-any
for (const [k, v] of nozzleIndex) { const e = v.n.equip as string; if (!/^(BL|PL)-\d+$/.test(e)) continue; const id = `${v.model}|${e}`; let s = spools.get(id); if (!s) { s = { model: v.model, faces: [] }; spools.set(id, s); } s.faces.push({ n: v.n, model: v.model }); void k; }
const refsTo = new Map<string, string[]>();
for (const [k, l] of lineIndex) { const model = k.split('|')[0]; for (const e of [l.from, l.to]) { const arr = refsTo.get(e) ?? []; arr.push(`${model}|${l.no}`); refsTo.set(e, arr); } }
const skippedWhy = new Map<string, string>(); { const pr = readJ('pipeway.report.json'); const byStream = new Map<string, string>(); for (const s of pr.skipped ?? []) { const m = /\((unit \d+), (BL-\d+)\)/.exec(s.stream); if (m) skippedWhy.set(m[2], s.why); else byStream.set(s.stream, s.why); }
  for (const u of [11, 12, 13, 14, 15, 16, 17, 18, 19]) { const f = `unit-${u}.report.json`; if (!existsSync(`${MODELS}/${f}`)) continue; for (const sp of readJ(f).spools ?? []) if (!skippedWhy.has(sp.tag) && byStream.has(sp.stream)) skippedWhy.set(sp.tag, `the pipeway's own report: ${sp.stream}: ${byStream.get(sp.stream)}`); } }
const spoolPieces = (model: string, equip: string) => pieces.filter(p => p.model === model && p.equip === equip && (p.cat === 'nozzle' || p.cat === 'weld'));
let zoneTests = 0;
for (const [sid, s] of spools) {
  const equip = sid.split('|')[1], own = spoolPieces(s.model, equip), ownIds = new Set(own.map(p => p.id));
  const excluded = new Set<number>(ownIds);
  const zoneSolids: { ws: WS; name: string; front?: boolean }[] = []; const boltedIds = new Set<number>();
  for (const { n, model } of s.faces) {
    const TM = frameOf.get(model)!, f = xp(TM, n.face), u = unit(xd(TM, n.u)), fl = designFlange(n.NPS, n.cls);
    const fc: FaceCheck = { spool: equip, face: n.id, model, NPS: n.NPS, cls: n.cls, at: f.map(r6) as V3, u: u.map(r6) as V3, refs: refsTo.get(n.id)?.filter(r => { const m = r.split('|')[0]; return n.id.endsWith('-P') && model.startsWith('unit') ? m !== model : true; }) ?? [], mates: [], ok: true, problems: [] };
    // the spool's own flange at the face
    const myFl = own.find(p => p.kind === 'flange' && p.line === n.id && p.a && len(sub(p.a, f)) <= 0.01);
    if (!myFl) fc.problems.push('the spool has no flange face at its nozzle face');
    else if (dot(unit(sub(myFl.b!, myFl.a!)), u) > -0.999) fc.problems.push('the spool flange does not face along the nozzle axis');
    // pieces of any model with an end at this face
    const nearIds = grid.query(addv(f, [-0.6, -0.6, -0.6]), addv(f, [0.6, 0.6, 0.6]));
    const mates: Piece[] = [];
    for (const id of nearIds) { const p = pieces[id]; if (ownIds.has(id) || !p.ends || p.kind === 'studs' || p.cat !== 'comp') continue; for (const e of p.ends) if (len(sub(e.p, f)) <= 0.5) { mates.push(p); break; } }
    const exact = mates.filter(p => p.ends!.some(e => len(sub(e.p, f)) <= 0.01 && dot(e.d, u) < -0.999));
    const lines = [...new Set(exact.map(p => `${p.model}|${p.line}`))];
    fc.mates = mates.map(p => `${p.model}|${p.line}|${p.tag}|${p.kind}|off ${r6(Math.min(...p.ends!.map(e => len(sub(e.p, f)))))}`);
    if (!fc.refs.length && !lines.length) { fc.open = skippedWhy.get(equip) ?? 'no line bolts to this face'; faces.push(fc); continue; }
    if (fc.refs.length !== 1) fc.problems.push(`${fc.refs.length} lines name this face as an end (${fc.refs.join(', ')})`);
    if (lines.length !== 1) fc.problems.push(`${lines.length} lines bolt to this face (${lines.join(', ') || 'none within 0.01 in, coaxial; near: ' + fc.mates.join('; ')})`);
    if (fc.refs.length === 1 && lines.length === 1 && fc.refs[0] !== lines[0]) fc.problems.push(`the line that names this face (${fc.refs[0]}) is not the one bolted to it (${lines[0]})`);
    for (const m of mates) if (!exact.includes(m) && !m.ends!.some(e => Math.abs(len(sub(e.p, f)) - fl.gasketT) <= 0.01 && Math.abs(dot(unit(sub(e.p, f)), u)) > 0.999)) fc.problems.push(`${m.model} ${m.tag} (${m.kind}) has an end ${r6(Math.min(...m.ends!.map(e => len(sub(e.p, f)))))} in from the face, not on it`);
    const gk = exact.find(p => p.kind === 'gasket');
    if (!gk) fc.problems.push(`no gasket at the face (on it: ${exact.map(p => p.kind).join(', ') || 'nothing'})`);
    let mateFlange: Piece | undefined;
    if (gk) {
      if (gk.NPS !== n.NPS || gk.cls !== n.cls) fc.problems.push(`gasket ${gk.NPS} in ${gk.cls} on a ${n.NPS} in ${n.cls} face`);
      const far = gk.ends!.find(e => len(sub(e.p, f)) > 0.01)!;
      if (Math.abs(len(sub(far.p, f)) - fl.gasketT) > 0.01) fc.problems.push(`gasket ${r6(len(sub(far.p, f)))} thick, not ${fl.gasketT}`);
      const after = [...grid.query(addv(far.p, [-0.1, -0.1, -0.1]), addv(far.p, [0.1, 0.1, 0.1]))].map(id => pieces[id]).filter(p => p !== gk && p.model === gk.model && p.line === gk.line && p.ends?.some(e => len(sub(e.p, far.p)) <= 0.01 && dot(e.d, far.d) < -0.999));
      mateFlange = after.find(p => JOINT_KINDS.has(p.kind));
      if (!mateFlange) fc.problems.push(`nothing flanged bolts on the gasket's far face (${after.map(p => p.kind).join(', ') || 'nothing'})`);
      else {
        const dirAway = unit(sub(mateFlange.b!, mateFlange.a!)), awayOk = Math.abs(dot(dirAway, u)) > 0.999;
        if (!awayOk) fc.problems.push(`the mating ${mateFlange.kind} is not on the spool's axis (angle ${(Math.acos(Math.min(1, Math.abs(dot(dirAway, u)))) * 180 / Math.PI).toFixed(2)} deg)`);
        if (mateFlange.NPS !== n.NPS || mateFlange.cls !== n.cls) {
          const line = lineIndex.get(`${mateFlange.model}|${mateFlange.line}`), red = line?.comps.some((c: { kind: string }) => c.kind === 'reducer');
          if (mateFlange.cls !== n.cls || !red) fc.problems.push(`mating ${mateFlange.kind} ${mateFlange.NPS} in ${mateFlange.cls} on a ${n.NPS} in ${n.cls} spool${red ? ' (the line has a reducer)' : ''}`);
        }
      }
      const studs = [...nearIds].map(id => pieces[id]).filter(p => p.kind === 'studs' && p.model === gk.model && coaxialJoint(p, gk));
      if (!studs.length) fc.problems.push('no stud bolting through the joint');
    }
    fc.ok = !fc.problems.length; faces.push(fc);
    // --- what is excluded from the 3 in zone: the spool and, of each line bolted to it, what lies within 2 ft of the face along the chain ---
    for (const ln of lines) {
      const [lm, lno] = ln.split('|'), mine = pieces.filter(p => p.model === lm && p.line === lno); for (const p of mine) boltedIds.add(p.id);
      for (const p of pieces) if (p.cat === 'support' && p.model === lm && p.line === lno) boltedIds.add(p.id);
      const start = mine.filter(p => exact.includes(p)); const dist = new Map<number, number>(); const queue: [Piece, number][] = start.map(p => [p, 0]);
      for (const p of start) dist.set(p.id, 0);
      while (queue.length) {
        const [p, d0] = queue.shift()!; const d1 = d0 + (p.cat === 'comp' && p.a && p.b ? len(sub(p.b, p.a)) : 0); if (d1 > 30) continue;
        for (const q of mine) { if (dist.has(q.id)) continue; const v = relate(p, q); if ('skip' in v || (p.cat === 'comp' && q.cat === 'comp' && sharedFace(p, q))) { dist.set(q.id, d1); queue.push([q, d1]); } }
      }
      for (const id of dist.keys()) excluded.add(id);
      for (const p of pieces) if (p.cat === 'support' && p.model === lm && p.line === lno && boxesTouch(p.lo, p.hi, addv(f, [-30, -30, -30]), addv(f, [30, 30, 30]))) excluded.add(p.id);
    }
    // --- the zone in front of the face: the mating flange's round, 2 ft out, grown 3 in ---
    const yRef: V3 = Math.abs(u[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], T = frameFromAxes(f, yRef, u) as M4, shp = cylZ(fl.OD / 2 + 3, 0, 24 + 3, `front of ${n.id}`), [lo, hi] = boxOf(T, shp.lo, shp.hi);
    zoneSolids.push({ ws: { s: shp, T, lo, hi }, name: `the 2 ft in front of ${n.id}`, front: true });
  }
  // --- the spool body grown 3 in ---
  for (const p of own) p.shapes.forEach((s, i) => { const g: Shp = { f: (x, y, z) => s.f(x, y, z) - 3, lo: addv(s.lo, [-3, -3, -3]), hi: addv(s.hi, [3, 3, 3]), lip: s.lip, name: `${s.name} + 3 in`, kind: s.kind }; const [lo, hi] = boxOf(p.T, g.lo, g.hi); zoneSolids.push({ ws: { s: g, T: p.T, lo, hi }, name: `spool body ${p.tag}` }); });
  const hitBy = new Map<number, { gap: number; at: V3; zone: string }>();
  for (const z of zoneSolids) {
    for (const id of grid.query(z.ws.lo, z.ws.hi)) {
      if (excluded.has(id) || (z.front && boltedIds.has(id))) continue; const p = pieces[id]; if (p.planted && !PLANT) continue;
      for (let i = 0; i < p.shapes.length; i++) {
        if (!boxesTouch(z.ws.lo, z.ws.hi, p.wlo![i], p.whi![i])) continue;
        zoneTests++;
        const h = pairTest(z.ws, wsOf(p, i), 0.0005, 2500);
        if (!h) continue;
        const gap = Math.max(0, 3 - intrude(z.ws, wsOf(p, i), h.p));
        const prev = hitBy.get(id); if (!prev || gap < prev.gap) hitBy.set(id, { gap, at: h.p, zone: z.name });
      }
    }
  }
  for (const [id, h] of hitBy) {
    const p = pieces[id]; clearance.push({ spool: `${s.model} ${equip}`, zone: h.zone, piece: `${p.model} ${p.line} ${p.tag} ${p.kind}`, gapIn: r6(h.gap), at: h.at.map(r6) as V3 });
    const zp = own.find(q => h.zone.includes(q.tag)) ?? own[0];
    findings.push({ a: { model: s.model, line: zp?.line ?? equip, tag: h.zone.startsWith('spool body') ? zp.tag : h.zone.replace('the 2 ft in front of ', 'front of '), kind: h.zone.startsWith('spool body') ? zp.kind : 'spool face zone' }, b: ref(p), depthIn: 0, gapIn: r6(h.gap), at: h.at.map(r6) as V3, note: `CLEARANCE (no overlap): ${p.kind} ${r6(h.gap)} in from ${h.zone} of spool ${equip}; the interface rule wants 3 in`, scope: 'interface', class: 'clearance' });
  }
}
for (const fc of faces) if (!fc.ok && !fc.open) findings.push({ a: { model: fc.model, line: fc.face, tag: fc.spool, kind: 'spool face' }, b: { model: fc.mates[0]?.split('|')[0] ?? '', line: fc.mates[0]?.split('|')[1] ?? '', tag: fc.mates[0]?.split('|')[2] ?? '', kind: fc.mates[0]?.split('|')[3] ?? '' }, depthIn: 0, at: fc.at, note: `INTERFACE: ${fc.problems.join('; ')}`, scope: 'interface', class: 'interface' });
log(`interfaces: ${spools.size} spools, ${faces.length} faces (${faces.filter(f => f.open).length} open, ${faces.filter(f => !f.ok && !f.open).length} failing), clearance hits ${clearance.length} (${zoneTests} zone tests)`);

// =====================================================================================================
// Output
// =====================================================================================================
findings.sort((p, q) => q.depthIn - p.depthIn);
writeFileSync(`${HERE}/findings-${LABEL}.json`, JSON.stringify(findings, null, 1));
writeFileSync(`${HERE}/interfaces-${LABEL}.json`, JSON.stringify({ faces, clearance: clearance.sort((p, q) => p.gapIn - q.gapIn) }, null, 1));
const secs = (Date.now() - T0) / 1000;
const byCat: Record<string, number> = {}; for (const p of pieces) byCat[p.cat] = (byCat[p.cat] ?? 0) + 1;
const stats = { label: LABEL, models: MODELS, seconds: secs, pieces: pieces.length, byCat, piping: nPiping, frames: nFrames, candidatePairs, testedPairs, pairTests, budgetOut, budgetOutWorst: budgetOutPairs.sort((p, q) => q.bestG - p.bestG).slice(0, 15), sdfEvals, excused: Object.fromEntries(excusedBy), meshStats: { ...meshStats, openNames: Object.fromEntries(meshStats.openNames) }, planted, nonRigid, keyErrors, findings: findings.length, overlaps: findings.filter(f => f.class === 'overlap').length, bearing: findings.filter(f => f.class === 'bearing').length, weldAxis: findings.filter(f => f.class === 'weld-axis').length, tiltedWelds, interfaceFailures: findings.filter(f => f.class === 'interface').length, clearanceFindings: findings.filter(f => f.class === 'clearance').length, faces: faces.length, openFaces: faces.filter(f => f.open).length, clearanceHits: clearance.length, full: FULL };
writeFileSync(`${HERE}/stats-${LABEL}.json`, JSON.stringify(stats, null, 1));
if (VERBOSE) for (const f of findings.slice(0, 60)) console.error(f.depthIn, f.a.model, f.a.tag, '|', f.b.model, f.b.tag, '|', f.note);
// calibration self-check: the three known clashes of calib-before, and anything planted
const has = (l: string, sp: string) => findings.filter(f => (f.a.line.includes(l) && (f.b.line.includes(sp) || f.b.tag.includes(sp))) || (f.b.line.includes(l) && (f.a.line.includes(sp) || f.a.tag.includes(sp))));
const calib = [['10618', 'BL-1724'], ['10632', 'BL-1211'], ['10631', 'BL-1611']].map(([l, sp]) => { const h = has(l, sp); return `${l}/${sp}: ${h.length ? h.map(f => f.class).filter((v, i, a) => a.indexOf(v) === i).join('+') + ' ' + Math.max(...h.map(f => f.depthIn)).toFixed(2) + ' in' + (h.some(f => f.class === 'clearance') ? ' (gap ' + Math.min(...h.filter(f => f.gapIn !== undefined).map(f => f.gapIn!)).toFixed(2) + ')' : '') : 'NOT FOUND'}`; });
const plantedHits = planted.map(pl => { const h = findings.filter(f => f.a.tag === pl.tag || f.b.tag === pl.tag); return `${pl.tag}: ${h.length ? h.length + ' findings, deepest ' + Math.max(...h.map(f => f.depthIn)).toFixed(2) + ' in vs ' + (h.sort((x, y) => y.depthIn - x.depthIn)[0].a.tag === pl.tag ? h[0].b.tag : h[0].a.tag) : 'NOT FOUND'} (expected ${pl.expect})`; });
writeFileSync(`${HERE}/stats-${LABEL}.json`, JSON.stringify({ ...stats, calib, plantedHits }, null, 1));
console.error('calibration:', calib.join('; ')); if (planted.length) console.error('planted:', plantedHits.join('; '));
console.log(`interfaces detector [${LABEL}]: ${findings.length} findings (${stats.overlaps} overlaps > ${NOISE} in between unrelated pieces, ${stats.bearing} supports/frames sunk into their own member, ${stats.weldAxis} own-line hits of weld beads the models tilt off their pipe, ${stats.interfaceFailures} interface failures, ${stats.clearanceFindings} clearance < 3 in at spools) from ${testedPairs} piece pairs tested of ${candidatePairs} touching boxes, ${pieces.length} pieces; ${faces.length} spool faces (${stats.openFaces} open), ${clearance.length} within 3 in of a spool zone; ${secs.toFixed(0)} s -> ${HERE}/findings-${LABEL}.json`);
