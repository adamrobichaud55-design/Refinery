/** Fillet weld all around a closed profile outline (SW-PF-7): a loft from the outline offset by the leg (on the plate) to the outline at leg height. */
import { ensureCCW, type Polygon, type Pt } from './polygon';
import type { MeshData } from './mesh';

/** Miter offset of a closed CCW polygon outward by `dist` (miter length capped at 2×dist). */
export function offsetPolygon(poly: Polygon, dist: number): Polygon {
  const p = ensureCCW(poly), n = p.length, out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = p[(i + n - 1) % n], b = p[i], c = p[(i + 1) % n];
    const n1 = edgeNormal(a, b), n2 = edgeNormal(b, c);
    let nx = n1.x + n2.x, ny = n1.y + n2.y; const L = Math.hypot(nx, ny);
    if (L < 1e-9) { out.push({ x: b.x + n1.x * dist, y: b.y + n1.y * dist }); continue; }
    nx /= L; ny /= L;
    const cosHalf = Math.max(0.5, nx * n1.x + ny * n1.y);
    out.push({ x: b.x + (nx * dist) / cosHalf, y: b.y + (ny * dist) / cosHalf });
  }
  return out;
}
function edgeNormal(a: Pt, b: Pt): Pt { const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1; return { x: dy / L, y: -dx / L }; } // outward for CCW

/** Closed fillet ring: bottom ring (outline → offset outline) at z=0, sloped outer face up to the outline at z=leg, inner vertical face. */
export function filletAroundProfile(outline: Polygon, leg: number): MeshData {
  const inner = ensureCCW(outline), outer = offsetPolygon(inner, leg), n = inner.length;
  const positions: number[] = [], indices: number[] = [];
  const push = (q: Pt, z: number) => { positions.push(q.x, q.y, z); return positions.length / 3 - 1; };
  const ib = inner.map(q => push(q, 0)), ob = outer.map(q => push(q, 0)), it = inner.map(q => push(q, leg));
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    indices.push(ib[i], ib[j], ob[j], ib[i], ob[j], ob[i]);   // bottom ring on the plate (normal −z)
    indices.push(ob[i], ob[j], it[j], ob[i], it[j], it[i]);   // sloped outer face
    indices.push(ib[j], ib[i], it[i], ib[j], it[i], it[j]);   // inner vertical face against the member (normal toward the axis)
  }
  return { positions, indices };
}
