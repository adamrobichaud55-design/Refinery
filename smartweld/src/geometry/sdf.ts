/**
 * Signed-distance solids and a marching-tetrahedra polygoniser (SmartWeld, written for this project).
 * Used for cast parts (valve bodies, bonnets, yokes) whose real form is a smooth blend of simple shapes.
 * Negative = inside. Distances may be approximate away from the surface; only the zero set is meshed.
 */
import type { MeshData } from './mesh';
import { signedVolume } from './mesh';

export type SDF = (x: number, y: number, z: number) => number;

// ---- primitives -------------------------------------------------------------------------------------------
export const sphere = (cx: number, cy: number, cz: number, r: number): SDF => (x, y, z) => Math.hypot(x - cx, y - cy, z - cz) - r;
/** capped cylinder along an axis; (u, v) are the two other coordinates of the axis line; a0..a1 the extent */
function capped(dr: number, da: number) { return Math.min(Math.max(dr, da), 0) + Math.hypot(Math.max(dr, 0), Math.max(da, 0)); }
export const cylZ = (r: number, z0: number, z1: number, cx = 0, cy = 0): SDF => (x, y, z) => capped(Math.hypot(x - cx, y - cy) - r, Math.max(z0 - z, z - z1));
export const cylY = (r: number, y0: number, y1: number, cx = 0, cz = 0): SDF => (x, y, z) => capped(Math.hypot(x - cx, z - cz) - r, Math.max(y0 - y, y - y1));
export const cylX = (r: number, x0: number, x1: number, cy = 0, cz = 0): SDF => (x, y, z) => capped(Math.hypot(y - cy, z - cz) - r, Math.max(x0 - x, x - x1));
/** frustum along z: radius r0 at z0, r1 at z1 */
export const frustumZ = (r0: number, z0: number, r1: number, z1: number, cx = 0, cy = 0): SDF => {
  const lo = Math.min(z0, z1), hi = Math.max(z0, z1), k = Math.cos(Math.atan2(Math.abs(r1 - r0), Math.abs(z1 - z0)));
  return (x, y, z) => { const t = Math.min(1, Math.max(0, (z - z0) / (z1 - z0))); return capped((Math.hypot(x - cx, y - cy) - (r0 + (r1 - r0) * t)) * k, Math.max(lo - z, z - hi)); };
};
export const frustumY = (r0: number, y0: number, r1: number, y1: number, cx = 0, cz = 0): SDF => {
  const lo = Math.min(y0, y1), hi = Math.max(y0, y1), k = Math.cos(Math.atan2(Math.abs(r1 - r0), Math.abs(y1 - y0)));
  return (x, y, z) => { const t = Math.min(1, Math.max(0, (y - y0) / (y1 - y0))); return capped((Math.hypot(x - cx, z - cz) - (r0 + (r1 - r0) * t)) * k, Math.max(lo - y, y - hi)); };
};
/** vertical prism of superelliptic section (exponent n: 2 = ellipse, 4+ = rounded rectangle), semi-axes ax (x) and az (z) */
export const superCylY = (ax: number, az: number, y0: number, y1: number, n = 2, cx = 0, cz = 0): SDF => (x, y, z) => {
  const u = Math.abs(x - cx) / ax, w = Math.abs(z - cz) / az;
  return capped((Math.pow(Math.pow(u, n) + Math.pow(w, n), 1 / n) - 1) * Math.min(ax, az), Math.max(y0 - y, y - y1));
};
/** vertical prism whose superelliptic section interpolates linearly from (ax0, az0) at y0 to (ax1, az1) at y1 */
export const superFrustumY = (ax0: number, az0: number, y0: number, ax1: number, az1: number, y1: number, n = 2, cx = 0, cz = 0): SDF => (x, y, z) => {
  const t = Math.min(1, Math.max(0, (y - y0) / (y1 - y0))), ax = ax0 + (ax1 - ax0) * t, az = az0 + (az1 - az0) * t;
  const u = Math.abs(x - cx) / ax, w = Math.abs(z - cz) / az;
  return capped((Math.pow(Math.pow(u, n) + Math.pow(w, n), 1 / n) - 1) * Math.min(ax, az) * 0.9, Math.max(Math.min(y0, y1) - y, y - Math.max(y0, y1)));
};
/** rounded-edge variants (edge radius e): cast parts have no sharp edges (F-0) */
export const rcylY = (r: number, y0: number, y1: number, e: number, cx = 0, cz = 0): SDF => { const k = Math.min(e, r * 0.9, (y1 - y0) / 2 * 0.9); const f = cylY(r - k, y0 + k, y1 - k, cx, cz); return (x, y, z) => f(x, y, z) - k; };
export const rcylZ = (r: number, z0: number, z1: number, e: number, cx = 0, cy = 0): SDF => { const k = Math.min(e, r * 0.9, (z1 - z0) / 2 * 0.9); const f = cylZ(r - k, z0 + k, z1 - k, cx, cy); return (x, y, z) => f(x, y, z) - k; };
export const rsuperCylY = (ax: number, az: number, y0: number, y1: number, e: number, n = 2): SDF => { const k = Math.min(e, Math.min(ax, az) * 0.9, (y1 - y0) / 2 * 0.9); const f = superCylY(ax - k, az - k, y0 + k, y1 - k, n); return (x, y, z) => f(x, y, z) - k; };
export const ellipsoid = (cx: number, cy: number, cz: number, rx: number, ry: number, rz: number): SDF => (x, y, z) => {
  const px = (x - cx) / rx, py = (y - cy) / ry, pz = (z - cz) / rz, k0 = Math.hypot(px, py, pz);
  const k1 = Math.hypot(px / rx, py / ry, pz / rz);
  return k1 < 1e-12 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
};
export const roundBox = (cx: number, cy: number, cz: number, hx: number, hy: number, hz: number, r = 0): SDF => (x, y, z) => {
  const qx = Math.abs(x - cx) - hx + r, qy = Math.abs(y - cy) - hy + r, qz = Math.abs(z - cz) - hz + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
};
/** capsule between two points */
export const capsule = (a: [number, number, number], b: [number, number, number], r: number): SDF => {
  const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2], bb = bax * bax + bay * bay + baz * baz;
  return (x, y, z) => { const pax = x - a[0], pay = y - a[1], paz = z - a[2]; const h = Math.min(1, Math.max(0, (pax * bax + pay * bay + paz * baz) / bb)); return Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h) - r; };
};
/** tapered capsule (cone with round ends) between two points */
export const taperCapsule = (a: [number, number, number], b: [number, number, number], ra: number, rb: number): SDF => {
  const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2], bb = bax * bax + bay * bay + baz * baz;
  return (x, y, z) => { const pax = x - a[0], pay = y - a[1], paz = z - a[2]; const h = Math.min(1, Math.max(0, (pax * bax + pay * bay + paz * baz) / bb)); return Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h) - (ra + (rb - ra) * h); };
};
export const torusY = (R: number, r: number, cy = 0, cx = 0, cz = 0): SDF => (x, y, z) => Math.hypot(Math.hypot(x - cx, z - cz) - R, y - cy) - r;

// ---- operators -------------------------------------------------------------------------------------------
export const union = (...s: SDF[]): SDF => (x, y, z) => { let d = Infinity; for (const f of s) { const v = f(x, y, z); if (v < d) d = v; } return d; };
const smin = (a: number, b: number, k: number) => { if (k <= 0) return Math.min(a, b); const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
/** smooth union (fillet radius ≈ k) */
export const blend = (k: number, ...s: SDF[]): SDF => (x, y, z) => { let d = s[0](x, y, z); for (let i = 1; i < s.length; i++) d = smin(d, s[i](x, y, z), k); return d; };
export const subtract = (a: SDF, ...b: SDF[]): SDF => (x, y, z) => { let d = a(x, y, z); for (const f of b) d = Math.max(d, -f(x, y, z)); return d; };
/** smooth intersection (rounded crease of radius ≈ k) */
export const smoothIntersect = (k: number, ...s: SDF[]): SDF => (x, y, z) => { let d = s[0](x, y, z); for (let i = 1; i < s.length; i++) d = -smin(-d, -s[i](x, y, z), k); return d; };
export const intersect = (...s: SDF[]): SDF => (x, y, z) => { let d = -Infinity; for (const f of s) { const v = f(x, y, z); if (v > d) d = v; } return d; };
/** rotate the field about the x axis by `ang` around the point (0, py, pz) */
export const rotX = (f: SDF, ang: number, py = 0, pz = 0): SDF => { const c = Math.cos(-ang), s = Math.sin(-ang); return (x, y, z) => { const yy = y - py, zz = z - pz; return f(x, py + c * yy - s * zz, pz + s * yy + c * zz); }; };
export const translate = (f: SDF, dx: number, dy: number, dz: number): SDF => (x, y, z) => f(x - dx, y - dy, z - dz);
/** mirror the field in z (z → −z) */
export const mirrorZ = (f: SDF): SDF => (x, y, z) => f(x, y, -z);

// ---- polygoniser -----------------------------------------------------------------------------------------
let MAX_CELLS = 110;
/** cap on cells along the longest side (tests lower it for speed; tessellation only, geometry is unchanged) */
export function setMaxCells(n: number) { MAX_CELLS = n; }
export function getMaxCells() { return MAX_CELLS; }

// Kuhn (Freudenthal) split of a cube into 6 tetrahedra along the 0–7 diagonal; consistent across neighbours → watertight.
const TETS = [[0, 1, 3, 7], [0, 1, 5, 7], [0, 2, 3, 7], [0, 2, 6, 7], [0, 4, 5, 7], [0, 4, 6, 7]];

/**
 * Mesh the zero set of `f` inside the box [min, max] (the solid must lie strictly inside; a 2-cell margin is added).
 * `minCell` asks for a cell no larger than this (e.g. half the thinnest wall), limited by the cell cap.
 */
export function polygonize(f: SDF, min: [number, number, number], max: [number, number, number], minCell = Infinity): MeshData {
  const span = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
  const h = Math.max(span / MAX_CELLS, Math.min(minCell, span / 40));
  const ox = min[0] - 2 * h, oy = min[1] - 2 * h, oz = min[2] - 2 * h;
  const nx = Math.ceil((max[0] - min[0]) / h) + 5, ny = Math.ceil((max[1] - min[1]) / h) + 5, nz = Math.ceil((max[2] - min[2]) / h) + 5;
  const N = nx * ny * nz, val = new Float32Array(N);
  const id = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const edge = i === 0 || j === 0 || k === 0 || i === nx - 1 || j === ny - 1 || k === nz - 1;
    val[id(i, j, k)] = edge ? Math.max(h, f(ox + i * h, oy + j * h, oz + k * h)) : f(ox + i * h, oy + j * h, oz + k * h);   // the box boundary is always outside
  }
  const positions: number[] = [], indices: number[] = [], edgeMap = new Map<number, number>();
  const pos = (g: number): [number, number, number] => { const i = g % nx, j = Math.floor(g / nx) % ny, k = Math.floor(g / (nx * ny)); return [ox + i * h, oy + j * h, oz + k * h]; };
  const vert = (a: number, b: number) => {
    const lo = Math.min(a, b), hi = Math.max(a, b), key = lo * N + hi;
    let v = edgeMap.get(key);
    if (v === undefined) {
      const fa = val[a], fb = val[b], t = Math.min(0.99, Math.max(0.01, fa / (fa - fb))), pa = pos(a), pb = pos(b);
      positions.push(pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t, pa[2] + (pb[2] - pa[2]) * t);
      v = positions.length / 3 - 1; edgeMap.set(key, v);
    }
    return v;
  };
  const mid = (a: number, b: number) => { const pa = pos(a), pb = pos(b); return [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2, (pa[2] + pb[2]) / 2]; };
  /** emit triangle on edges (e0,e1,e2) oriented so its normal points along `dir` (computed on edge midpoints → robust) */
  const tri = (e: [number, number][], dir: number[]) => {
    const m0 = mid(e[0][0], e[0][1]), m1 = mid(e[1][0], e[1][1]), m2 = mid(e[2][0], e[2][1]);
    const ux = m1[0] - m0[0], uy = m1[1] - m0[1], uz = m1[2] - m0[2], vx = m2[0] - m0[0], vy = m2[1] - m0[1], vz = m2[2] - m0[2];
    const nxv = uy * vz - uz * vy, nyv = uz * vx - ux * vz, nzv = ux * vy - uy * vx;
    const a = vert(e[0][0], e[0][1]), b = vert(e[1][0], e[1][1]), c = vert(e[2][0], e[2][1]);
    if (nxv * dir[0] + nyv * dir[1] + nzv * dir[2] >= 0) indices.push(a, b, c); else indices.push(a, c, b);
  };
  const corner = new Array<number>(8);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let neg = 0;
    for (let c = 0; c < 8; c++) { corner[c] = id(i + (c & 1), j + ((c >> 1) & 1), k + ((c >> 2) & 1)); if (val[corner[c]] < 0) neg++; }
    if (neg === 0 || neg === 8) continue;
    for (const t of TETS) {
      const v = t.map(c => corner[c]), ins = v.filter(g => val[g] < 0), out = v.filter(g => val[g] >= 0);
      if (ins.length === 0 || ins.length === 4) continue;
      const ci = [0, 0, 0], co = [0, 0, 0];
      for (const g of ins) { const p = pos(g); ci[0] += p[0] / ins.length; ci[1] += p[1] / ins.length; ci[2] += p[2] / ins.length; }
      for (const g of out) { const p = pos(g); co[0] += p[0] / out.length; co[1] += p[1] / out.length; co[2] += p[2] / out.length; }
      const dir = [co[0] - ci[0], co[1] - ci[1], co[2] - ci[2]];
      if (ins.length === 1) tri([[ins[0], out[0]], [ins[0], out[1]], [ins[0], out[2]]], dir);
      else if (ins.length === 3) tri([[out[0], ins[0]], [out[0], ins[1]], [out[0], ins[2]]], dir);
      else { const [a, b] = ins, [c, d] = out; tri([[a, c], [a, d], [b, d]], dir); tri([[a, c], [b, d], [b, c]], dir); }
    }
  }
  // snap each vertex onto the surface (one Newton step, limited to half a cell) and take the exact normal from the field gradient
  const normals: number[] = new Array(positions.length), e = h * 0.05;
  for (let v = 0; v < positions.length; v += 3) {
    let x = positions[v], y = positions[v + 1], z = positions[v + 2];
    for (let it = 0; it < 2; it++) {
      const d = f(x, y, z), gx = (f(x + e, y, z) - f(x - e, y, z)) / (2 * e), gy = (f(x, y + e, z) - f(x, y - e, z)) / (2 * e), gz = (f(x, y, z + e) - f(x, y, z - e)) / (2 * e);
      const g2 = gx * gx + gy * gy + gz * gz; if (g2 < 1e-12) break;
      let sx = (d * gx) / g2, sy = (d * gy) / g2, sz = (d * gz) / g2; const L = Math.hypot(sx, sy, sz), cap = 0.5 * h;
      if (L > cap) { sx *= cap / L; sy *= cap / L; sz *= cap / L; }
      x -= sx; y -= sy; z -= sz;
    }
    positions[v] = x; positions[v + 1] = y; positions[v + 2] = z;
    const gx = f(x + e, y, z) - f(x - e, y, z), gy = f(x, y + e, z) - f(x, y - e, z), gz = f(x, y, z + e) - f(x, y, z - e), L = Math.hypot(gx, gy, gz) || 1;
    normals[v] = gx / L; normals[v + 1] = gy / L; normals[v + 2] = gz / L;
  }
  const m: MeshData = { positions, indices, normals };
  if (signedVolume(m) < 0) for (let q = 0; q < indices.length; q += 3) { const s = indices[q + 1]; indices[q + 1] = indices[q + 2]; indices[q + 2] = s; }
  return m;
}
