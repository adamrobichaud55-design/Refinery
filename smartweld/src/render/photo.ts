/**
 * Photo-style 3D views by SmartWeld's own renderer (DESIGN_BASIS.md §67, SW-REN-4..10): the same depth-buffered
 * rasterizer idea as view3d.ts, but each sample keeps its surface normal and finish, and is then lit: sun with a shadow
 * map, sky dome and ground bounce reduced by ambient occlusion, a microfacet highlight, a Fresnel reflection of the sky,
 * procedural colour texture, a ground plane, filmic tone. Geometry is never altered (SW-U-5). No third-party code.
 */
import { Raster, type RGB } from './raster';
import type { Drawable } from './scene';
import type { MeshData } from '../geometry/mesh';
import type { Camera } from './view3d';

type V3 = [number, number, number];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/** SW-REN-4: the finishes. rough 0 mirror … 1 matt; metal 1 = bare metal; tex 0 none, 1 concrete, 2 spangle, 3 paint */
export type FinishName = 'paint' | 'gloss' | 'zinc' | 'stainless' | 'weld' | 'concrete' | 'rebar' | 'galv' | 'aluminium' | 'polymer';
const FINISH: Record<FinishName, { rough: number; metal: number; tex: number }> = {
  paint: { rough: 0.55, metal: 0, tex: 3 }, gloss: { rough: 0.38, metal: 0, tex: 3 }, zinc: { rough: 0.45, metal: 1, tex: 0 }, stainless: { rough: 0.28, metal: 1, tex: 0 },
  weld: { rough: 0.6, metal: 1, tex: 0 }, concrete: { rough: 0.95, metal: 0, tex: 1 }, rebar: { rough: 0.75, metal: 0.6, tex: 3 }, galv: { rough: 0.5, metal: 1, tex: 2 },
  aluminium: { rough: 0.34, metal: 1, tex: 0 }, polymer: { rough: 0.8, metal: 0, tex: 0 },
};
const FIN_LIST = Object.keys(FINISH) as FinishName[];

export interface PhotoOpts {
  /** keep only the side n·p ≤ d of the drawables flagged `cuttable` (all, when none is flagged); cut faces are capped (SW-REN-10) */
  cut?: { n: V3; d: number };
  /** the ground plane's height (world y); undefined = none (the scene has its own floor) */
  groundY?: number;
  /** scene radius for the ground fade and the occlusion radius; default from the drawables' bounds */
  radius?: number;
}

// ---- smooth normals (SW-REN-6) --------------------------------------------------------------------------------------
const normalCache = new WeakMap<MeshData, Float32Array>();
/** per-triangle-corner unit normals: the area-weighted mean of the faces at the vertex that lie within 40° of the corner's face */
function cornerNormals(m: MeshData): Float32Array {
  let out = normalCache.get(m); if (out) return out;
  const P = m.positions, I = m.indices, nt = I.length / 3; out = new Float32Array(nt * 9);
  if (m.normals) { for (let t = 0; t < nt * 3; t++) { out[3 * t] = m.normals[3 * I[t]]; out[3 * t + 1] = m.normals[3 * I[t] + 1]; out[3 * t + 2] = m.normals[3 * I[t] + 2]; } normalCache.set(m, out); return out; }
  const fa = new Float32Array(nt * 3), fu = new Float32Array(nt * 3), at = new Map<number, number[]>(), key = new Int32Array(nt * 3);
  const ids = new Map<string, number>();
  for (let t = 0; t < nt; t++) {
    const a = 3 * I[3 * t], b = 3 * I[3 * t + 1], c = 3 * I[3 * t + 2];
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1;
    fa[3 * t] = nx; fa[3 * t + 1] = ny; fa[3 * t + 2] = nz; fu[3 * t] = nx / l; fu[3 * t + 1] = ny / l; fu[3 * t + 2] = nz / l;
    for (let k = 0; k < 3; k++) {
      const v = 3 * I[3 * t + k], s = `${Math.round(P[v] * 2000)},${Math.round(P[v + 1] * 2000)},${Math.round(P[v + 2] * 2000)}`;
      let id = ids.get(s); if (id === undefined) { id = ids.size; ids.set(s, id); }
      key[3 * t + k] = id; const arr = at.get(id); if (arr) arr.push(t); else at.set(id, [t]);
    }
  }
  const COS = Math.cos((40 * Math.PI) / 180);
  for (let t = 0; t < nt; t++) for (let k = 0; k < 3; k++) {
    let x = 0, y = 0, z = 0;
    for (const o of at.get(key[3 * t + k])!) if (fu[3 * t] * fu[3 * o] + fu[3 * t + 1] * fu[3 * o + 1] + fu[3 * t + 2] * fu[3 * o + 2] > COS) { x += fa[3 * o]; y += fa[3 * o + 1]; z += fa[3 * o + 2]; }
    const l = Math.hypot(x, y, z) || 1, i = 9 * t + 3 * k; out[i] = x / l; out[i + 1] = y / l; out[i + 2] = z / l;
  }
  normalCache.set(m, out); return out;
}

// ---- value noise for the colour textures (SW-REN-8) -----------------------------------------------------------------
function hash3(i: number, j: number, k: number): number {
  let n = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 1440662683)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16; return (n >>> 0) / 4294967296;
}
function noise(x: number, y: number, z: number): number {
  const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z), fx = x - i, fy = y - j, fz = z - k;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const a = hash3(i, j, k), b = hash3(i + 1, j, k), c = hash3(i, j + 1, k), d = hash3(i + 1, j + 1, k), e = hash3(i, j, k + 1), f = hash3(i + 1, j, k + 1), g = hash3(i, j + 1, k + 1), h = hash3(i + 1, j + 1, k + 1);
  const ab = a + (b - a) * u, cd = c + (d - c) * u, ef = e + (f - e) * u, gh = g + (h - g) * u, lo = ab + (cd - ab) * v, hi = ef + (gh - ef) * v;
  return lo + (hi - lo) * w;
}
const lin = (c: number) => Math.pow(c / 255, 2.2);

// ---- the sky dome (SW-REN-5, -9) ------------------------------------------------------------------------------------
const SUN = unit([600, 1000, 400]), FILL = unit([-600, 300, -800]);
const SUN_COL: V3 = [3.0, 2.82, 2.5], ZENITH: V3 = [0.16, 0.31, 0.68], HORIZON: V3 = [0.60, 0.70, 0.84], GROUND: V3 = [0.22, 0.21, 0.19];
function dome(y: number, out: V3) {
  if (y >= 0) { const t = Math.pow(y, 0.45); out[0] = HORIZON[0] + (ZENITH[0] - HORIZON[0]) * t; out[1] = HORIZON[1] + (ZENITH[1] - HORIZON[1]) * t; out[2] = HORIZON[2] + (ZENITH[2] - HORIZON[2]) * t; }
  else { let t = Math.min(1, -y / 0.25); t = t * t * (3 - 2 * t); out[0] = HORIZON[0] + (GROUND[0] - HORIZON[0]) * t; out[1] = HORIZON[1] + (GROUND[1] - HORIZON[1]) * t; out[2] = HORIZON[2] + (GROUND[2] - HORIZON[2]) * t; }
}
const tone = (x: number) => { x *= 0.47; const y = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14); return 255 * Math.pow(Math.min(1, Math.max(0, y)), 1 / 2.2); };

/** a PNG of the drawables seen from the camera, lit and finished (SW-REN-4..10) */
export function renderPhoto(ds: Drawable[], cam: Camera, w = 1200, h = 800, ss = 2, opts: PhotoOpts = {}): Uint8Array {
  const R = new Raster(w, h, ss, [255, 255, 255]), W = R.W, H = R.H, N = W * H;
  const fov = ((cam.fovDeg ?? 50) * Math.PI) / 180, f = 1 / Math.tan(fov / 2), aspect = w / h, near = 0.5;
  const zc = unit(sub(cam.eye, cam.target)), xc = unit(cross([0, 1, 0], zc)), yc = cross(zc, xc), eye = cam.eye;
  const depth = new Float32Array(N).fill(Infinity), gn = new Float32Array(N * 3), gid = new Int32Array(N).fill(-1);
  const anyFlag = ds.some(d => d.cuttable), cut = opts.cut;

  // world-space vertices and corner normals of every drawable, with its bounds
  const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity];
  const WP: Float32Array[] = [], WN: Float32Array[] = [];
  for (const d of ds) {
    const src = d.mesh.positions, T = d.T, P = new Float32Array(src.length), cn = cornerNormals(d.mesh), Nw = new Float32Array(cn.length);
    for (let i = 0; i < src.length; i += 3) {
      const x = src[i], y = src[i + 1], z = src[i + 2];
      const px = T[0] * x + T[4] * y + T[8] * z + T[12], py = T[1] * x + T[5] * y + T[9] * z + T[13], pz = T[2] * x + T[6] * y + T[10] * z + T[14];
      P[i] = px; P[i + 1] = py; P[i + 2] = pz;
      if (px < mn[0]) mn[0] = px; if (py < mn[1]) mn[1] = py; if (pz < mn[2]) mn[2] = pz; if (px > mx[0]) mx[0] = px; if (py > mx[1]) mx[1] = py; if (pz > mx[2]) mx[2] = pz;
    }
    for (let i = 0; i < cn.length; i += 3) {
      const x = cn[i], y = cn[i + 1], z = cn[i + 2], a = T[0] * x + T[4] * y + T[8] * z, b = T[1] * x + T[5] * y + T[9] * z, c = T[2] * x + T[6] * y + T[10] * z, l = Math.hypot(a, b, c) || 1;
      Nw[i] = a / l; Nw[i + 1] = b / l; Nw[i + 2] = c / l;
    }
    WP.push(P); WN.push(Nw);
  }
  const centre: V3 = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2], radius = opts.radius ?? Math.max(1, Math.hypot(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) / 2);

  // a triangle as vertices [x, y, z, nx, ny, nz] clipped by the cut plane (world) when it applies
  const clipW = (poly: number[][], n: V3, dd: number): number[][] => {
    const out: number[][] = [], fn = (p: number[]) => n[0] * p[0] + n[1] * p[1] + n[2] * p[2] - dd;
    for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length], fp = fn(p), fq = fn(q); if (fp <= 0) out.push(p); if ((fp <= 0) !== (fq <= 0)) { const t = fp / (fp - fq); out.push(p.map((v, k) => v + (q[k] - v) * t)); } }
    return out;
  };

  // ---- shadow map from the sun (SW-REN-5) ---------------------------------------------------------------------------
  const lz = SUN, lx = unit(cross([0, 1, 0], lz)), ly = cross(lz, lx), S = radius > 1500 ? 4096 : 2048;
  let lmnx = Infinity, lmny = Infinity, lmxx = -Infinity, lmxy = -Infinity;
  for (let c = 0; c < 8; c++) { const p: V3 = [c & 1 ? mx[0] : mn[0], c & 2 ? mx[1] : mn[1], c & 4 ? mx[2] : mn[2]], u = dot(p, lx), v = dot(p, ly); lmnx = Math.min(lmnx, u); lmxx = Math.max(lmxx, u); lmny = Math.min(lmny, v); lmxy = Math.max(lmxy, v); }
  const texel = Math.max(lmxx - lmnx, lmxy - lmny) / (S - 8) || 1, sm = new Float32Array(S * S).fill(-Infinity);
  const smTri = (a: number[], b: number[], c: number[]) => {
    const ax = (dot(a as V3, lx) - lmnx) / texel + 4, ay = (dot(a as V3, ly) - lmny) / texel + 4, az = dot(a as V3, lz), bx = (dot(b as V3, lx) - lmnx) / texel + 4, by = (dot(b as V3, ly) - lmny) / texel + 4, bz = dot(b as V3, lz), cx = (dot(c as V3, lx) - lmnx) / texel + 4, cy = (dot(c as V3, ly) - lmny) / texel + 4, cz = dot(c as V3, lz);
    const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax); if (Math.abs(area) < 1e-9) return;
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx))), x1 = Math.min(S - 1, Math.ceil(Math.max(ax, bx, cx))), y0 = Math.max(0, Math.floor(Math.min(ay, by, cy))), y1 = Math.min(S - 1, Math.ceil(Math.max(ay, by, cy)));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5, py = y + 0.5, w0 = ((bx - px) * (cy - py) - (by - py) * (cx - px)) / area, w1 = ((cx - px) * (ay - py) - (cy - py) * (ax - px)) / area, w2 = 1 - w0 - w1;
      if (w0 < -1e-4 || w1 < -1e-4 || w2 < -1e-4) continue;
      const z = w0 * az + w1 * bz + w2 * cz, i = y * S + x; if (z > sm[i]) sm[i] = z;
    }
  };

  // ---- G-buffer raster --------------------------------------------------------------------------------------------
  const toCam = (p: number[]): number[] => { const dx = p[0] - eye[0], dy = p[1] - eye[1], dz = p[2] - eye[2]; return [dx * xc[0] + dy * xc[1] + dz * xc[2], dx * yc[0] + dy * yc[1] + dz * yc[2], dx * zc[0] + dy * zc[1] + dz * zc[2], p[3], p[4], p[5]]; };
  const clipNear = (poly: number[][]): number[][] => {
    const out: number[][] = [];
    for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length], ip = p[2] <= -near, iq = q[2] <= -near; if (ip) out.push(p); if (ip !== iq) { const t = (-near - p[2]) / (q[2] - p[2]); out.push(p.map((v, k) => v + (q[k] - v) * t)); } }
    return out;
  };
  // the cap of a cut solid: where a back face of a cut drawable shows, the surface seen is the cut plane (SW-REN-10)
  const capDepth = (sx: number, sy: number): number => {
    const xcam = ((sx / W - 0.5) * 2 * aspect) / f, ycam = ((0.5 - sy / H) * 2) / f;
    const rx = xc[0] * xcam + yc[0] * ycam - zc[0], ry = xc[1] * xcam + yc[1] * ycam - zc[1], rz = xc[2] * xcam + yc[2] * ycam - zc[2];
    const den = cut!.n[0] * rx + cut!.n[1] * ry + cut!.n[2] * rz; if (Math.abs(den) < 1e-9) return Infinity;
    const t = (cut!.d - dot(cut!.n, eye)) / den; return t > near ? t : Infinity;
  };
  // a cut solid is capped where the ray, past the cut plane, crosses its surface an odd number of times: the plane point is then inside it
  const crossings = cut && dot(cut.n, eye) > cut.d ? new Uint16Array(N) : null, capId = new Int32Array(crossings ? N : 0);
  const rasterTri = (a: number[], b: number[], c: number[], id: number, count: boolean) => {
    const pj = (q: number[]) => { const iz = 1 / -q[2]; return [((q[0] * f) / aspect * iz * 0.5 + 0.5) * W, (0.5 - q[1] * f * iz * 0.5) * H, iz, q[3] * iz, q[4] * iz, q[5] * iz]; };
    const A = pj(a), B = pj(b), C = pj(c), area = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]); if (Math.abs(area) < 1e-12) return;
    const x0 = Math.max(0, Math.floor(Math.min(A[0], B[0], C[0]))), x1 = Math.min(W - 1, Math.ceil(Math.max(A[0], B[0], C[0]))), y0 = Math.max(0, Math.floor(Math.min(A[1], B[1], C[1]))), y1 = Math.min(H - 1, Math.ceil(Math.max(A[1], B[1], C[1])));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5, py = y + 0.5, w0 = ((B[0] - px) * (C[1] - py) - (B[1] - py) * (C[0] - px)) / area, w1 = ((C[0] - px) * (A[1] - py) - (C[1] - py) * (A[0] - px)) / area, w2 = 1 - w0 - w1;
      if (w0 < 0 || w1 < 0 || w2 < 0) continue;
      const iz = w0 * A[2] + w1 * B[2] + w2 * C[2], i = y * W + x;
      if (count) { crossings![i]++; capId[i] = id; }
      const z = 1 / iz; if (z >= depth[i]) continue;
      depth[i] = z; gid[i] = id; gn[3 * i] = (w0 * A[3] + w1 * B[3] + w2 * C[3]) * z; gn[3 * i + 1] = (w0 * A[4] + w1 * B[4] + w2 * C[4]) * z; gn[3 * i + 2] = (w0 * A[5] + w1 * B[5] + w2 * C[5]) * z;
    }
  };
  for (let di = 0; di < ds.length; di++) {
    const d = ds[di], I = d.mesh.indices, P = WP[di], Nw = WN[di], cutThis = !!cut && (!anyFlag || !!d.cuttable);
    for (let t = 0; t < I.length; t += 3) {
      let poly: number[][] = [0, 1, 2].map(k => { const v = 3 * I[t + k], n = 3 * t + 3 * k; return [P[v], P[v + 1], P[v + 2], Nw[n], Nw[n + 1], Nw[n + 2]]; });
      if (cutThis) { poly = clipW(poly, cut!.n, cut!.d); if (poly.length < 3) continue; }
      for (let k = 1; k < poly.length - 1; k++) smTri(poly[0], poly[k], poly[k + 1]);
      const cp = clipNear(poly.map(toCam)); if (cp.length < 3) continue;
      for (let k = 1; k < cp.length - 1; k++) rasterTri(cp[0], cp[k], cp[k + 1], di, cutThis && !!crossings);
    }
  }
  if (crossings) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (!(crossings[i] & 1)) continue;
    const z = capDepth(x + 0.5, y + 0.5); if (z < depth[i]) { depth[i] = z; gid[i] = capId[i]; gn[3 * i] = cut!.n[0]; gn[3 * i + 1] = cut!.n[1]; gn[3 * i + 2] = cut!.n[2]; }
  }

  // ---- the ground plane (SW-REN-7), analytic ------------------------------------------------------------------------
  const gy = opts.groundY, GID = -2;
  if (gy !== undefined) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const xcam = (((x + 0.5) / W - 0.5) * 2 * aspect) / f, ycam = ((0.5 - (y + 0.5) / H) * 2) / f, ry = xc[1] * xcam + yc[1] * ycam - zc[1];
    if (ry >= -1e-6) continue;
    const t = (gy - eye[1]) / ry, i = y * W + x; if (t > near && t < depth[i]) { depth[i] = t; gid[i] = GID; gn[3 * i] = 0; gn[3 * i + 1] = 1; gn[3 * i + 2] = 0; }
  }

  // ---- ambient occlusion in the depth buffer (SW-REN-5) -------------------------------------------------------------
  const ao = new Float32Array(N).fill(1), Rao = Math.max(1.5, 0.06 * radius), K = 10;
  const dirs = Array.from({ length: K }, (_, k) => { const a = k * 2.399963, r = Math.sqrt((k + 0.5) / K); return [Math.cos(a) * r, Math.sin(a) * r]; });
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, z = depth[i]; if (!isFinite(z)) continue;
    const kx = (2 * aspect) / f / W, ky = 2 / f / H, pxc = ((x + 0.5) - W / 2) * kx * z, pyc = (H / 2 - (y + 0.5)) * ky * z;
    let nx = gn[3 * i], ny = gn[3 * i + 1], nz = gn[3 * i + 2]; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    let ncx = nx * xc[0] + ny * xc[1] + nz * xc[2], ncy = nx * yc[0] + ny * yc[1] + nz * yc[2], ncz = nx * zc[0] + ny * zc[1] + nz * zc[2];
    if (ncx * -pxc + ncy * -pyc + ncz * z < 0) { ncx = -ncx; ncy = -ncy; ncz = -ncz; }
    const rpx = Math.min(90 * ss, Math.max(2, (Rao * f * H) / 2 / z)), rot = hash3(x, y, 7) * 6.2832, cr = Math.cos(rot), sr = Math.sin(rot);
    let occ = 0;
    for (let k = 0; k < K; k++) {
      const ox = (dirs[k][0] * cr - dirs[k][1] * sr) * rpx, oy = (dirs[k][0] * sr + dirs[k][1] * cr) * rpx, sx = Math.round(x + ox), sy = Math.round(y + oy);
      if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue;
      const z2 = depth[sy * W + sx]; if (!isFinite(z2)) continue;
      const vx = ((sx + 0.5) - W / 2) * kx * z2 - pxc, vy = (H / 2 - (sy + 0.5)) * ky * z2 - pyc, vz = -z2 + z, dl = Math.hypot(vx, vy, vz); if (dl < 1e-6 || dl > Rao) continue;
      occ += Math.max(0, (vx * ncx + vy * ncy + vz * ncz) / dl - 0.12) * (1 - dl / Rao);
    }
    ao[i] = Math.max(0.2, 1 - (2.4 * occ) / K);
  }
  // soften the occlusion over 5 × 5 samples of like depth
  const ao2 = new Float32Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, z = depth[i]; if (!isFinite(z)) { ao2[i] = 1; continue; }
    let s = 0, c = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const j = yy * W + xx, z2 = depth[j]; if (Math.abs(z2 - z) < 0.05 * z) { s += ao[j]; c++; } }
    ao2[i] = c ? s / c : ao[i];
  }

  // ---- shading ----------------------------------------------------------------------------------------------------
  const albedo = ds.map(d => (d.finish === 'zinc' ? [0.56, 0.58, 0.6] : [lin(d.color[0]), lin(d.color[1]), lin(d.color[2])]) as V3), fin = ds.map(d => FINISH[d.finish ?? 'paint']);
  const shadowAt = (px: number, py: number, pz: number, nx: number, ny: number, nz: number): number => {
    const qx = px + nx * texel * 1.6, qy = py + ny * texel * 1.6, qz = pz + nz * texel * 1.6;
    const u = (qx * lx[0] + qy * lx[1] + qz * lx[2] - lmnx) / texel + 4, v = (qx * ly[0] + qy * ly[1] + qz * ly[2] - lmny) / texel + 4, zl = qx * lz[0] + qy * lz[1] + qz * lz[2];
    let lit = 0, n = 0;
    for (let dy = -1.5; dy <= 1.5; dy += 1) for (let dx = -1.5; dx <= 1.5; dx += 1) { const xi = Math.floor(u + dx), yi = Math.floor(v + dy); n++; if (xi < 0 || yi < 0 || xi >= S || yi >= S) { lit++; continue; } if (zl >= sm[yi * S + xi] - texel * 0.9) lit++; }
    return lit / n;
  };
  const sky: V3 = [0, 0, 0], env: V3 = [0, 0, 0], hor: V3 = [0, 0, 0]; dome(0, hor);
  const out = R.px;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, z = depth[i];
    const xcam = (((x + 0.5) / W - 0.5) * 2 * aspect) / f, ycam = ((0.5 - (y + 0.5) / H) * 2) / f;
    let rx = xc[0] * xcam + yc[0] * ycam - zc[0], ry = xc[1] * xcam + yc[1] * ycam - zc[1], rz = xc[2] * xcam + yc[2] * ycam - zc[2];
    if (!isFinite(z)) { const rl = Math.hypot(rx, ry, rz); dome(Math.max(ry / rl, 0) * 0.8, sky); out[3 * i] = tone(sky[0] * 1.15); out[3 * i + 1] = tone(sky[1] * 1.15); out[3 * i + 2] = tone(sky[2] * 1.15); continue; }
    const px = eye[0] + rx * z, py = eye[1] + ry * z, pz = eye[2] + rz * z, rl = Math.hypot(rx, ry, rz); rx /= rl; ry /= rl; rz /= rl;   // V = −r
    let nx = gn[3 * i], ny = gn[3 * i + 1], nz = gn[3 * i + 2]; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    if (nx * rx + ny * ry + nz * rz > 0) { nx = -nx; ny = -ny; nz = -nz; }
    const id = gid[i], ground = id === GID, F = ground ? FINISH.concrete : fin[id]; let ar: number, ag: number, ab: number;
    if (ground) { ar = 0.21; ag = 0.21; ab = 0.205; } else { ar = albedo[id][0]; ag = albedo[id][1]; ab = albedo[id][2]; }
    // colour texture from position (SW-REN-8)
    if (F.tex === 1) { const s = ground ? 0.5 : 1, t = 1 + 0.07 * (noise(px * 0.9 * s, py * 0.9 * s, pz * 0.9 * s) - 0.5) + 0.12 * (noise(px * 0.11, py * 0.11, pz * 0.11) - 0.5) + 0.10 * (noise(px * 0.021, py * 0.021, pz * 0.021) - 0.5) - (noise(px * 2.3, py * 2.3, pz * 2.3) > 0.83 ? 0.07 : 0); ar *= t; ag *= t; ab *= t * 0.99; }
    else if (F.tex === 2) { const t = 0.9 + 0.2 * (Math.floor(noise(px * 1.4, py * 1.4, pz * 1.4) * 5) / 5) + 0.04 * (noise(px * 6, py * 6, pz * 6) - 0.5); ar *= t; ag *= t; ab *= t; }
    else if (F.tex === 3) { const t = 1 + 0.05 * (noise(px * 0.25, py * 0.25, pz * 0.25) - 0.5) + 0.02 * (noise(px * 3, py * 3, pz * 3) - 0.5); ar *= t; ag *= t; ab *= t; }
    const occ = ao2[i], ndl = Math.max(0, nx * SUN[0] + ny * SUN[1] + nz * SUN[2]), ndv = Math.max(0.03, -(nx * rx + ny * ry + nz * rz));
    const sh = ndl > 0 ? shadowAt(px, py, pz, nx, ny, nz) : 0;
    // diffuse: sun, sky above and ground bounce below, a weak fill
    const up = ny * 0.5 + 0.5, fill = 0.22 * Math.max(0, nx * FILL[0] + ny * FILL[1] + nz * FILL[2]);
    const amr = (GROUND[0] * 0.5 + (ZENITH[0] * 0.5 + HORIZON[0] * 0.4 - GROUND[0] * 0.5) * up) * occ + fill * occ, amg = (GROUND[1] * 0.5 + (ZENITH[1] * 0.5 + HORIZON[1] * 0.4 - GROUND[1] * 0.5) * up) * occ + fill * occ, amb = (GROUND[2] * 0.5 + (ZENITH[2] * 0.5 + HORIZON[2] * 0.4 - GROUND[2] * 0.5) * up) * occ + fill * occ;
    const kd = 1 - F.metal;
    let cr = ar * kd * (SUN_COL[0] * ndl * sh + amr), cg = ag * kd * (SUN_COL[1] * ndl * sh + amg), cb = ab * kd * (SUN_COL[2] * ndl * sh + amb);
    // specular: microfacet lobe for the sun, Fresnel reflection of the dome (SW-REN-6)
    const f0r = 0.04 + (ar - 0.04) * F.metal, f0g = 0.04 + (ag - 0.04) * F.metal, f0b = 0.04 + (ab - 0.04) * F.metal, al = F.rough * F.rough;
    if (ndl > 0 && sh > 0) {
      let hx = SUN[0] - rx, hy = SUN[1] - ry, hz = SUN[2] - rz; const hl = Math.hypot(hx, hy, hz) || 1; hx /= hl; hy /= hl; hz /= hl;
      const ndh = Math.max(0, nx * hx + ny * hy + nz * hz), vdh = Math.max(0, -(rx * hx + ry * hy + rz * hz)), dd = ndh * ndh * (al * al - 1) + 1, D = (al * al) / (Math.PI * dd * dd);
      const k = ((F.rough + 1) * (F.rough + 1)) / 8, G = 0.25 / ((ndl * (1 - k) + k) * (ndv * (1 - k) + k)), fr = Math.pow(1 - vdh, 5), sp = Math.min(D * G, 40) * ndl * sh;
      cr += SUN_COL[0] * sp * (f0r + (1 - f0r) * fr); cg += SUN_COL[1] * sp * (f0g + (1 - f0g) * fr); cb += SUN_COL[2] * sp * (f0b + (1 - f0b) * fr);
    }
    const rdn = rx * nx + ry * ny + rz * nz, refy = ry - 2 * rdn * ny; dome(refy, env); dome(ny, sky);
    const blur = F.rough, er = env[0] + (sky[0] * 0.8 - env[0]) * blur, eg = env[1] + (sky[1] * 0.8 - env[1]) * blur, eb = env[2] + (sky[2] * 0.8 - env[2]) * blur;
    const fe = Math.pow(1 - ndv, 5), gloss = 1 - F.rough, so = 0.35 + 0.65 * occ;
    cr += er * so * (f0r + (Math.max(gloss, f0r) - f0r) * fe) * (0.35 + 0.65 * gloss + 0.5 * F.metal * F.rough); cg += eg * so * (f0g + (Math.max(gloss, f0g) - f0g) * fe) * (0.35 + 0.65 * gloss + 0.5 * F.metal * F.rough); cb += eb * so * (f0b + (Math.max(gloss, f0b) - f0b) * fe) * (0.35 + 0.65 * gloss + 0.5 * F.metal * F.rough);
    if (ground) {   // the ground fades into the background with distance (SW-REN-7)
      const dist = Math.hypot(px - centre[0], pz - centre[2]); let t = Math.min(1, Math.max(0, (dist - radius * 1.3) / (radius * 2.2))); t = t * t * (3 - 2 * t);
      cr += (hor[0] * 1.15 - cr) * t; cg += (hor[1] * 1.15 - cg) * t; cb += (hor[2] * 1.15 - cb) * t;
    }
    out[3 * i] = tone(cr); out[3 * i + 1] = tone(cg); out[3 * i + 2] = tone(cb);
  }
  void FIN_LIST;
  return R.png();
}
