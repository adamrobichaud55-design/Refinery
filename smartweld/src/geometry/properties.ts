/** Exact section properties of simple polygons (and rings) by Green's theorem. Units: inches. */
import type { Polygon } from './polygon';
import type { Profile } from './mesh';

export interface SectionProps { A: number; cx: number; cy: number; Ixx: number; Iyy: number; Ixy: number; yTop: number; yBot: number; xMax: number; xMin: number; Sx: number; Sy: number }

function raw(p: Polygon) {
  let A = 0, Cx = 0, Cy = 0, Ixx = 0, Iyy = 0, Ixy = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    const f = a.x * b.y - b.x * a.y;
    A += f; Cx += (a.x + b.x) * f; Cy += (a.y + b.y) * f;
    Ixx += (a.y * a.y + a.y * b.y + b.y * b.y) * f;
    Iyy += (a.x * a.x + a.x * b.x + b.x * b.x) * f;
    Ixy += (a.x * b.y + 2 * a.x * a.y + 2 * b.x * b.y + b.x * a.y) * f;
  }
  return { A: A / 2, Cx: Cx / 6, Cy: Cy / 6, Ixx: Ixx / 12, Iyy: Iyy / 12, Ixy: Ixy / 24 }; // about the origin (signed by winding)
}

/** Properties about the centroid. Ixx is about the horizontal axis (bending in the vertical plane). */
export function sectionProps(prof: Profile): SectionProps {
  const o = raw(prof.outer);
  let A = o.A, Cx = o.Cx, Cy = o.Cy, Ixx = o.Ixx, Iyy = o.Iyy, Ixy = o.Ixy;
  if (prof.inner) {
    const i = raw(prof.inner);
    const s = Math.sign(o.A) === Math.sign(i.A) ? -1 : 1; // subtract the hole whatever its winding
    A += s * i.A; Cx += s * i.Cx; Cy += s * i.Cy; Ixx += s * i.Ixx; Iyy += s * i.Iyy; Ixy += s * i.Ixy;
  }
  const sgn = Math.sign(A); A *= sgn; Cx *= sgn; Cy *= sgn; Ixx *= sgn; Iyy *= sgn; Ixy *= sgn;
  const cx = Cx / A, cy = Cy / A;
  const Ixc = Ixx - A * cy * cy, Iyc = Iyy - A * cx * cx, Ixyc = Ixy - A * cx * cy;
  const ys = prof.outer.map(p => p.y), xs = prof.outer.map(p => p.x);
  const yTop = Math.max(...ys) - cy, yBot = cy - Math.min(...ys);
  const xMax = Math.max(...xs) - cx, xMin = cx - Math.min(...xs);
  return { A, cx, cy, Ixx: Ixc, Iyy: Iyc, Ixy: Ixyc, yTop, yBot, xMax, xMin, Sx: Ixc / Math.max(yTop, yBot), Sy: Iyc / Math.max(xMax, xMin) };
}

/** SW-PF-3: plastic modulus of the drawn W section (fillets ignored). */
export function wPlasticModulus(d: number, bf: number, tf: number, tw: number): number {
  return bf * tf * (d - tf) + (tw * (d - 2 * tf) ** 2) / 4;
}
