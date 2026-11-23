/**
 * Mesh primitives for the real detail of §68 (SW-DET-*): swept bars with hooks and loops, chamfered prisms, hex nuts,
 * rings, curved reinforcing pads, bolting. Every mesh is closed with outward faces. SmartWeld's own geometry.
 */
import { extrude, signedVolume, mergeMeshes, transformMesh, type MeshData } from '../../geometry/mesh';
import { circle, type Polygon } from '../../geometry/polygon';
import { translate, multiply, rotateZ } from '../../geometry/transform';
import { hexHardware } from './hardware';
import type { FlangeDesign } from './pipe';

export type V3 = [number, number, number];
export type DRole = 'steel' | 'hardware' | 'weld' | 'concrete' | 'equipment' | 'stem' | 'rebar' | 'galv' | 'jacket' | 'machine' | 'safety' | 'grout' | 'nameplate' | 'polymer' | 'closure' | 'casting' | 'pipe' | 'sheet';
export interface DSolid { name: string; mesh: MeshData; role?: DRole }

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/** faces outward: a mesh whose signed volume is negative has its triangles turned */
export function orient(m: MeshData): MeshData {
  if (signedVolume(m) >= 0) return m;
  const indices = [...m.indices]; for (let k = 0; k < indices.length; k += 3) { const t = indices[k + 1]; indices[k + 1] = indices[k + 2]; indices[k + 2] = t; }
  return { positions: m.positions, indices };
}

/** a round bar of radius r swept along a polyline (closed = a loop); end caps on an open path */
export function sweep(pts: V3[], r: number, n = 8, closed = false): MeshData {
  const P = pts.filter((p, i) => i === 0 || Math.hypot(...sub(p, pts[i - 1])) > 1e-6), m = P.length;
  const tan = (i: number): V3 => { const a = closed ? P[(i - 1 + m) % m] : P[Math.max(0, i - 1)], b = closed ? P[(i + 1) % m] : P[Math.min(m - 1, i + 1)]; return unit(sub(b, a)); };
  const t0 = tan(0); let nrm: V3 = unit(cross(t0, Math.abs(t0[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
  const positions: number[] = [], indices: number[] = [];
  for (let i = 0; i < m; i++) {
    const t = tan(i); nrm = unit(sub(nrm, [t[0] * dot(nrm, t), t[1] * dot(nrm, t), t[2] * dot(nrm, t)])); const b = cross(t, nrm);
    for (let k = 0; k < n; k++) { const a = (2 * Math.PI * k) / n, c = Math.cos(a) * r, s = Math.sin(a) * r; positions.push(P[i][0] + nrm[0] * c + b[0] * s, P[i][1] + nrm[1] * c + b[1] * s, P[i][2] + nrm[2] * c + b[2] * s); }
  }
  const rings = closed ? m : m - 1;
  for (let i = 0; i < rings; i++) for (let k = 0; k < n; k++) { const a = i * n + k, b = i * n + ((k + 1) % n), c = ((i + 1) % m) * n + k, d = ((i + 1) % m) * n + ((k + 1) % n); indices.push(a, b, c, b, d, c); }
  if (!closed) {
    const c0 = positions.length / 3; positions.push(...P[0]); const c1 = c0 + 1; positions.push(...P[m - 1]);
    for (let k = 0; k < n; k++) { indices.push(c0, (k + 1) % n, k); indices.push(c1, (m - 1) * n + k, (m - 1) * n + ((k + 1) % n)); }
  }
  return orient({ positions, indices });
}
/** points of an arc about c in the plane of unit vectors u, v, from angle a0 to a1 */
export function arcPts(c: V3, u: V3, v: V3, R: number, a0: number, a1: number, n: number): V3[] {
  return Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return add(add(c, u, R * Math.cos(a)), v, R * Math.sin(a)); });
}
/** SW-DET-1: the path of a straight bar from a to b with a 90° hook at each end turned toward `hook` (bend radius 3 d, hook 12 d) */
export function hookedBarPath(a: V3, b: V3, hook: V3, d: number, ends: [boolean, boolean] = [true, true]): V3[] {
  const e = unit(sub(b, a)), h = unit(hook), R = 3 * d, tail = 12 * d - (Math.PI / 2) * R, out: V3[] = [];
  if (ends[0]) { out.push(add(add(a, h, R + tail), e, 0)); out.push(...arcPts(add(add(a, e, R), h, R), [-e[0], -e[1], -e[2]], [-h[0], -h[1], -h[2]], R, 0, Math.PI / 2, 4)); } else out.push(a);
  if (ends[1]) { out.push(...arcPts(add(add(b, e, -R), h, R), [-h[0], -h[1], -h[2]], e, R, 0, Math.PI / 2, 4)); out.push(add(b, h, R + tail)); } else out.push(b);
  return out;
}
/** a closed loop through corner points with eased corners of radius rc (ties, stirrups, hoops through corners) */
export function loopPath(corners: V3[], rc: number): V3[] {
  const out: V3[] = [], m = corners.length;
  for (let i = 0; i < m; i++) { const p = corners[i], u1 = unit(sub(corners[(i - 1 + m) % m], p)), u2 = unit(sub(corners[(i + 1) % m], p)); out.push(add(p, u1, rc), add(add(p, u1, rc * 0.3), u2, rc * 0.3), add(p, u2, rc)); }
  return out;
}
/** a circle of radius R about the z axis at height z, as loop points */
export const ringPath = (R: number, z: number, n = 48): V3[] => Array.from({ length: n }, (_, i) => [R * Math.cos((2 * Math.PI * i) / n), R * Math.sin((2 * Math.PI * i) / n), z] as V3);

/** a convex CCW polygon moved inward by c on every edge */
export function insetConvex(poly: Polygon, c: number): Polygon {
  const m = poly.length, lines = poly.map((p, i) => { const q = poly[(i + 1) % m], dx = q.x - p.x, dy = q.y - p.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l; return { px: p.x + nx * c, py: p.y + ny * c, dx: dx / l, dy: dy / l }; });
  return lines.map((L, i) => { const K = lines[(i - 1 + m) % m], den = K.dx * L.dy - K.dy * L.dx; if (Math.abs(den) < 1e-9) return { x: L.px, y: L.py }; const t = ((L.px - K.px) * L.dy - (L.py - K.py) * L.dx) / den; return { x: K.px + K.dx * t, y: K.py + K.dy * t }; });
}
/** SW-DET-2: a prism on a convex polygon from z0 to z1 whose top edge is chamfered by c */
export function chamferedPrism(poly0: Polygon, z0: number, z1: number, c: number): MeshData {
  const area = poly0.reduce((s, p, i) => { const q = poly0[(i + 1) % poly0.length]; return s + p.x * q.y - q.x * p.y; }, 0), poly = area >= 0 ? poly0 : [...poly0].reverse();
  const m = poly.length, top = insetConvex(poly, c), positions: number[] = [], indices: number[] = [];
  for (const p of poly) positions.push(p.x, p.y, z0); for (const p of poly) positions.push(p.x, p.y, z1 - c); for (const p of top) positions.push(p.x, p.y, z1);
  for (let i = 0; i < m; i++) { const j = (i + 1) % m; indices.push(i, j, m + j, i, m + j, m + i, m + i, m + j, 2 * m + j, m + i, 2 * m + j, 2 * m + i); }
  for (let i = 1; i < m - 1; i++) { indices.push(0, i + 1, i); indices.push(2 * m, 2 * m + i, 2 * m + i + 1); }
  return orient({ positions, indices });
}
/** a hex nut (SW-B-3) on the z axis from z = 0: across flats 1.5 d to 1/16, height d, with its hole */
export function hexNut(d: number): MeshData {
  const F = hexHardware(d).F, R = F / 2 / Math.cos(Math.PI / 6), n = 24;
  const outer = Array.from({ length: n }, (_, i) => { const a = (2 * Math.PI * i) / n, sector = Math.PI / 3, local = (((a % sector) + sector) % sector) - sector / 2; const r = F / 2 / Math.cos(local); return { x: r * Math.cos(a), y: r * Math.sin(a) }; });
  void R;
  return extrude({ outer, inner: circle(0, 0, d / 2, n) }, hexHardware(d).nutH, 0);
}
/** a torus about the z axis: ring radius R, bar radius r */
export function torus(R: number, r: number, n = 32, m = 10): MeshData {
  return sweep(ringPath(R, 0, n), r, m, true);
}
/** SW-DET-5: the studs and nuts of a flanged joint whose outer faces are at z = zLo and z = zHi (flange axis z) */
export function boltingOf(f: FlangeDesign, zLo: number, zHi: number): MeshData {
  const d = f.d, nutH = hexHardware(d).nutH, ext = nutH + d / 4, parts: MeshData[] = [], nut = hexNut(d);
  for (let i = 0; i < f.n; i++) {
    const a = (2 * Math.PI * (i + 0.5)) / f.n, x = (f.BC / 2) * Math.cos(a), y = (f.BC / 2) * Math.sin(a);
    parts.push(extrude({ outer: circle(x, y, d / 2, 12) }, zHi - zLo + 2 * ext, zLo - ext), transformMesh(nut, multiply(translate(x, y, zLo - nutH), rotateZ(a))), transformMesh(nut, multiply(translate(x, y, zHi), rotateZ(a))));
  }
  return mergeMeshes(parts);
}
/** SW-EQC-1: a reinforcing pad rolled to a shell of outer radius R, in the nozzle's frame (z along the nozzle from the shell surface on its axis, y round the shell, x along it) */
export function curvedPad(R: number, t: number, rIn: number, rOut: number, n = 48): MeshData {
  const zs = (rad: number, y: number) => Math.sqrt(Math.max(rad * rad - y * y, 0)) - R, positions: number[] = [], indices: number[] = [], J = 4;
  const ring = (rho: number, rad: number) => { for (let k = 0; k < n; k++) { const a = (2 * Math.PI * k) / n, x = rho * Math.cos(a), y = rho * Math.sin(a); positions.push(x, y, zs(rad, y)); } };
  ring(rIn, R); ring(rOut, R);                                         // inner surface: rings 0, 1
  for (let j = 0; j <= J; j++) ring(rOut + ((rIn - rOut) * j) / J, R + t);   // outer surface from the rim inward: rings 2 … 2 + J
  const rings = 3 + J;
  for (let i = 0; i < rings; i++) { const a0 = i * n, b0 = ((i + 1) % rings) * n; for (let k = 0; k < n; k++) { const k2 = (k + 1) % n; indices.push(a0 + k, a0 + k2, b0 + k, a0 + k2, b0 + k2, b0 + k); } }
  return orient({ positions, indices });
}
/** a box by its two corners */
export const boxMesh = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): MeshData => extrude({ outer: [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }] }, z1 - z0, z0);
