/** 2D polygon utilities (plain data, no renderer). Points are inches. */
export interface Pt { x: number; y: number }
export type Polygon = Pt[];

export function signedArea(p: Polygon): number {
  let s = 0;
  for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a.x * b.y - b.x * a.y; }
  return s / 2;
}
export const area = (p: Polygon) => Math.abs(signedArea(p));
export const isCCW = (p: Polygon) => signedArea(p) > 0;
export function ensureCCW(p: Polygon): Polygon { return isCCW(p) ? p : [...p].reverse(); }

/** Remove consecutive duplicate points. */
export function dedupe(p: Polygon, eps = 1e-9): Polygon {
  const out: Pt[] = [];
  for (const q of p) {
    const last = out[out.length - 1];
    if (!last || Math.hypot(last.x - q.x, last.y - q.y) > eps) out.push(q);
  }
  if (out.length > 1 && Math.hypot(out[0].x - out[out.length - 1].x, out[0].y - out[out.length - 1].y) <= eps) out.pop();
  return out;
}

function segIntersect(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const o = (p: Pt, q: Pt, r: Pt) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const o1 = o(a, b, c), o2 = o(a, b, d), o3 = o(c, d, a), o4 = o(c, d, b);
  return o1 * o2 < 0 && o3 * o4 < 0;
}
/** True if no two non-adjacent edges cross (proper intersections only). */
export function isSimple(p: Polygon): boolean {
  const n = p.length;
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
    if (i === 0 && j === n - 1) continue;
    if (segIntersect(p[i], p[(i + 1) % n], p[j], p[(j + 1) % n])) return false;
  }
  return true;
}

/** Points on an arc from angle a0 to a1 (radians, either direction), n segments, endpoints included. */
export function arc(cx: number, cy: number, r: number, a0: number, a1: number, n: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; out.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }); }
  return out;
}
export function circle(cx: number, cy: number, r: number, n: number): Polygon {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) { const a = (2 * Math.PI * i) / n; out.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }); }
  return out;
}
/** Rounded rectangle centred at origin, width w (x), height h (y), corner radius r (r may be 0). CCW. */
export function roundedRect(w: number, h: number, r: number, nArc: number): Polygon {
  const hw = w / 2, hh = h / 2;
  if (r <= 1e-9) return [{ x: -hw, y: -hh }, { x: hw, y: -hh }, { x: hw, y: hh }, { x: -hw, y: hh }];
  const pts: Pt[] = [];
  pts.push(...arc(hw - r, -hh + r, r, -Math.PI / 2, 0, nArc));
  pts.push(...arc(hw - r, hh - r, r, 0, Math.PI / 2, nArc));
  pts.push(...arc(-hw + r, hh - r, r, Math.PI / 2, Math.PI, nArc));
  pts.push(...arc(-hw + r, -hh + r, r, Math.PI, 1.5 * Math.PI, nArc));
  return dedupe(pts);
}
/** Regular hexagon with width across flats F, sampled at n points by angle so it can pair with a circle of n points. */
export function hexagonRadial(F: number, n: number): Polygon {
  const R = F / 2 / Math.cos(Math.PI / 6); // circumradius
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n;
    // distance to hexagon edge along angle a: apothem / cos(angle to nearest edge normal)
    const sector = Math.PI / 3;
    const local = ((a % sector) + sector) % sector - sector / 2; // angle from edge normal (-30..30°)
    const r = (F / 2) / Math.cos(local);
    out.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
    void R;
  }
  return out;
}
export const regularHexagon = (F: number): Polygon => {
  const R = F / 2 / Math.cos(Math.PI / 6);
  return Array.from({ length: 6 }, (_, i) => ({ x: R * Math.cos((Math.PI / 3) * i + Math.PI / 6), y: R * Math.sin((Math.PI / 3) * i + Math.PI / 6) }));
};

/** Ear-clipping triangulation of a simple CCW polygon. Returns index triples. */
export function earClip(poly: Polygon): number[] {
  const n = poly.length;
  const idx = Array.from({ length: n }, (_, i) => i);
  const tris: number[] = [];
  const cross = (a: Pt, b: Pt, c: Pt) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const inTri = (p: Pt, a: Pt, b: Pt, c: Pt) => cross(a, b, p) >= -1e-12 && cross(b, c, p) >= -1e-12 && cross(c, a, p) >= -1e-12;
  let guard = 0;
  while (idx.length > 3 && guard++ < 10000) {
    let clipped = false;
    for (let i = 0; i < idx.length; i++) {
      const i0 = idx[(i + idx.length - 1) % idx.length], i1 = idx[i], i2 = idx[(i + 1) % idx.length];
      const a = poly[i0], b = poly[i1], c = poly[i2];
      if (cross(a, b, c) <= 1e-12) continue; // reflex or degenerate
      let ok = true;
      for (const j of idx) {
        if (j === i0 || j === i1 || j === i2) continue;
        const p = poly[j];
        if ((p.x === a.x && p.y === a.y) || (p.x === b.x && p.y === b.y) || (p.x === c.x && p.y === c.y)) continue;
        if (inTri(p, a, b, c)) { ok = false; break; }
      }
      if (!ok) continue;
      tris.push(i0, i1, i2);
      idx.splice(i, 1);
      clipped = true;
      break;
    }
    if (!clipped) throw new Error('earClip: no ear found (polygon not simple?)');
  }
  if (idx.length === 3) tris.push(idx[0], idx[1], idx[2]);
  return tris;
}

/** Annular sector from angle a0 to a1 (radians, a1 > a0), radii r0 < r1, n segments. CCW. */
export function annularSector(r0: number, r1: number, a0: number, a1: number, n: number): Polygon {
  return dedupe([...arc(0, 0, r1, a0, a1, n), ...arc(0, 0, r0, a1, a0, n)]);
}
/** Axis-aligned rectangle from corner (x0,y0) to (x1,y1). CCW. */
export const rect = (x0: number, y0: number, x1: number, y1: number): Polygon => [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
