/**
 * 3D views by SmartWeld's own renderer (DESIGN_BASIS.md §56, SW-REN-1): perspective camera, near-plane clipping,
 * depth buffer, one directional light plus ambient (and a weaker fill from the opposite side), as the viewer lights.
 */
import { Raster, type RGB } from './raster';
import type { Drawable } from './scene';

export interface Camera { eye: [number, number, number]; target: [number, number, number]; fovDeg?: number }
type V3 = [number, number, number];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/** the camera that frames a box from a direction, as the viewer's frame() does */
export function frameBox(min: V3, max: V3, dir: V3 = [0.8, 0.55, 1], fovDeg = 50): Camera {
  const c: V3 = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
  const r = Math.max(Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]) / 2, 1), d = r / Math.sin((fovDeg * Math.PI) / 360) * 1.05, u = unit(dir);
  return { eye: [c[0] + u[0] * d, c[1] + u[1] * d, c[2] + u[2] * d], target: c, fovDeg };
}
export function bounds(ds: Drawable[], clip?: (p: V3) => boolean): [V3, V3] {
  const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity];
  for (const d of ds) for (let i = 0; i < d.mesh.positions.length; i += 3) {
    const p = place(d.T, d.mesh.positions, i); if (clip && !clip(p)) continue;
    for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], p[k]); mx[k] = Math.max(mx[k], p[k]); }
  }
  return [mn, mx];
}

/** a template vertex placed by a column-major 4 × 4 transform */
function place(T: ArrayLike<number>, p: ArrayLike<number>, i: number): V3 {
  const x = p[i], y = p[i + 1], z = p[i + 2];
  return [T[0] * x + T[4] * y + T[8] * z + T[12], T[1] * x + T[5] * y + T[9] * z + T[13], T[2] * x + T[6] * y + T[10] * z + T[14]];
}

const SUN = unit([600, 1000, 400]), FILL = unit([-600, 300, -800]), SKY: RGB = [223, 230, 238];

/** a PNG of the drawables seen from the camera; cut (optional) keeps only the side n·p ≤ d, as the viewer's section plane */
export function render3d(ds: Drawable[], cam: Camera, w = 1200, h = 800, ss = 2, cut?: { n: V3; d: number }): Uint8Array {
  const R = new Raster(w, h, ss, SKY), fov = ((cam.fovDeg ?? 50) * Math.PI) / 180, f = 1 / Math.tan(fov / 2), aspect = w / h;
  const zc = unit(sub(cam.eye, cam.target)), xc = unit(cross([0, 1, 0], zc)), yc = cross(zc, xc), near = 0.5;
  const toCam = (p: V3): V3 => { const d = sub(p, cam.eye); return [dot(d, xc), dot(d, yc), dot(d, zc)]; };
  const proj = (q: V3): [number, number, number] => [(q[0] * f / aspect / -q[2] * 0.5 + 0.5) * w, (0.5 - q[1] * f / -q[2] * 0.5) * h, -q[2]];
  for (const d of ds) {
    const I = d.mesh.indices, src = d.mesh.positions, P = new Float64Array(src.length);
    for (let i = 0; i < src.length; i += 3) { const q = place(d.T, src, i); P[i] = q[0]; P[i + 1] = q[1]; P[i + 2] = q[2]; }
    // skip whole parts behind the camera or outside the view (their bounding sphere)
    let cx = 0, cy = 0, cz = 0; const nv = P.length / 3; for (let i = 0; i < P.length; i += 3) { cx += P[i]; cy += P[i + 1]; cz += P[i + 2]; } cx /= nv; cy /= nv; cz /= nv;
    let rad = 0; for (let i = 0; i < P.length; i += 3) rad = Math.max(rad, Math.hypot(P[i] - cx, P[i + 1] - cy, P[i + 2] - cz));
    const qc = toCam([cx, cy, cz]); if (qc[2] - rad > -near) continue;
    const depth = -qc[2], lim = (depth + rad) * Math.tan(fov / 2) * 1.05;
    if (Math.abs(qc[1]) - rad > lim || Math.abs(qc[0]) - rad > lim * aspect) continue;
    for (let t = 0; t < I.length; t += 3) {
      const a: V3 = [P[3 * I[t]], P[3 * I[t] + 1], P[3 * I[t] + 2]], b: V3 = [P[3 * I[t + 1]], P[3 * I[t + 1] + 1], P[3 * I[t + 1] + 2]], c: V3 = [P[3 * I[t + 2]], P[3 * I[t + 2] + 1], P[3 * I[t + 2] + 2]];
      const n = unit(cross(sub(b, a), sub(c, a))); if (!isFinite(n[0])) continue;
      const toEye = unit(sub(cam.eye, a)), facing = dot(n, toEye) >= 0 ? n : [-n[0], -n[1], -n[2]] as V3;   // two-sided, as the viewer's double-sided finishes
      const light = 0.42 + 0.62 * Math.max(0, dot(facing, SUN)) + 0.2 * Math.max(0, dot(facing, FILL));
      const col: RGB = [Math.min(255, d.color[0] * light), Math.min(255, d.color[1] * light), Math.min(255, d.color[2] * light)];
      // clip against the near plane, then fan into triangles
      const world = cut ? clipPlane([a, b, c], cut.n, cut.d) : [a, b, c]; if (world.length < 3) continue;
      const poly = clipNear(world.map(toCam), near);
      if (poly.length < 3) continue;
      const s = poly.map(proj);
      for (let k = 1; k < s.length - 1; k++) R.tri(s[0], s[k], s[k + 1], col);
    }
  }
  return R.png();
}

function clipNear(poly: V3[], near: number): V3[] {
  const out: V3[] = [], inside = (p: V3) => p[2] <= -near;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    if (inside(p)) out.push(p);
    if (inside(p) !== inside(q)) { const t = (-near - p[2]) / (q[2] - p[2]); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, -near]); }
  }
  return out;
}

function clipPlane(poly: V3[], n: V3, d: number): V3[] {
  const out: V3[] = [], f = (p: V3) => dot(n, p) - d;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length], fp = f(p), fq = f(q);
    if (fp <= 0) out.push(p);
    if ((fp <= 0) !== (fq <= 0)) { const t = fp / (fp - fq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t]); }
  }
  return out;
}
