/** Cross-section profiles for catalogue parts. Local frame: x across, y up, member axis +z (SW-U-4). */
import { arc, circle, roundedRect, dedupe, type Polygon, type Pt } from './polygon';
import type { WDims } from '../catalogue/parts/wideFlange';
import { CHANNEL_TAPER, type CDims } from '../catalogue/parts/channel';
import { HSS_RI, HSS_RO } from '../catalogue/parts/hss';
import type { Profile } from './mesh';

export const N_FILLET = 6;   // segments per fillet arc
export const N_CIRCLE = 48;  // segments per full circle

export function wProfile(p: WDims): Polygon {
  const { d, bf, tf, tw, R } = p;
  const hb = bf / 2, hd = d / 2, hw = tw / 2, N = N_FILLET;
  const pts: Pt[] = [];
  pts.push({ x: -hb, y: -hd }, { x: hb, y: -hd }, { x: hb, y: -hd + tf });
  pts.push(...arc(hw + R, -hd + tf + R, R, -Math.PI / 2, -Math.PI, N));
  pts.push(...arc(hw + R, hd - tf - R, R, Math.PI, Math.PI / 2, N));
  pts.push({ x: hb, y: hd - tf }, { x: hb, y: hd }, { x: -hb, y: hd }, { x: -hb, y: hd - tf });
  pts.push(...arc(-hw - R, hd - tf - R, R, Math.PI / 2, 0, N));
  pts.push(...arc(-hw - R, -hd + tf + R, R, 0, -Math.PI / 2, N));
  pts.push({ x: -hb, y: -hd + tf });
  return dedupe(pts);
}

/** Channel: back of web at x=0, flanges toward +x, centred on y. */
export function cProfile(p: CDims): Polygon {
  const { d, bf, tw, tTip, R, rToe } = p;
  const hd = d / 2, s = CHANNEL_TAPER, N = N_FILLET;
  const y0 = -hd + tTip;                      // inner face at the tip
  const face = (x: number) => y0 + s * (bf - x);
  // fillet tangent to web (x = tw) and the sloped face
  const cx = tw + R, k = Math.sqrt(1 + s * s);
  const cy = face(cx) + R * k;
  const tangentOnFace: Pt = { x: cx - (R * s) / k, y: cy - R / k };
  const aFace = Math.atan2(tangentOnFace.y - cy, tangentOnFace.x - cx);
  const lower: Pt[] = [];
  lower.push({ x: bf, y: -hd });
  lower.push(...arc(bf - rToe, y0 - rToe, rToe, 0, Math.PI / 2, N));          // toe
  lower.push(tangentOnFace);
  lower.push(...arc(cx, cy, R, aFace, -Math.PI, N));                            // fillet → (tw, cy)
  const upper = lower.map(q => ({ x: q.x, y: -q.y })).reverse();
  return dedupe([{ x: 0, y: -hd }, ...lower, ...upper, { x: 0, y: hd }]);
}

/** Angle: heel at origin, leg b along +x, leg a along +y. */
export function lProfile(a: number, b: number, t: number): Polygon {
  const R = t, rToe = t / 2, N = N_FILLET;
  const pts: Pt[] = [{ x: 0, y: 0 }, { x: b, y: 0 }];
  pts.push(...arc(b - rToe, t - rToe, rToe, 0, Math.PI / 2, N));
  pts.push(...arc(t + R, t + R, R, -Math.PI / 2, -Math.PI, N));
  pts.push(...arc(t - rToe, a - rToe, rToe, 0, Math.PI / 2, N));
  pts.push({ x: 0, y: a });
  return dedupe(pts);
}

export function hssRectProfile(H: number, B: number, t: number): Profile {
  return { outer: roundedRect(B, H, HSS_RO * t, N_FILLET), inner: roundedRect(B - 2 * t, H - 2 * t, HSS_RI * t, N_FILLET) };
}
export function hssRoundProfile(OD: number, t: number): Profile {
  return { outer: circle(0, 0, OD / 2, N_CIRCLE), inner: circle(0, 0, OD / 2 - t, N_CIRCLE) };
}

/** Fillet weld: root at origin, legs along +x and +y. */
export function filletProfile(w: number): Polygon {
  return [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: 0, y: w }];
}
/** Groove weld (SW-WD-4): root at y=0, plate surface at y=t, cap apex at t+cap. */
export function grooveProfile(g: { t: number; rootOpening: number; rootFace: number; topWidth: number; cap: number }): Polygon {
  const { t, rootOpening: ro, rootFace: rf, topWidth: tw, cap } = g;
  return [{ x: -ro / 2, y: 0 }, { x: ro / 2, y: 0 }, { x: ro / 2, y: rf }, { x: tw / 2, y: t }, { x: 0, y: t + cap }, { x: -tw / 2, y: t }, { x: -ro / 2, y: rf }];
}

/** Ring profile: a convex outer polygon and a round hole of radius r at `centre`, both sampled at the same angles
 *  (n uniform angles plus the direction of every outer vertex, so the outer polygon is reproduced exactly). */
export function ringAroundHole(convex: Polygon, centre: Pt, r: number, n: number): Profile {
  const angles = new Set<number>();
  for (let i = 0; i < n; i++) angles.add(Math.round(((2 * Math.PI * i) / n) * 1e9) / 1e9);
  for (const p of convex) { let a = Math.atan2(p.y - centre.y, p.x - centre.x); if (a < 0) a += 2 * Math.PI; angles.add(Math.round(a * 1e9) / 1e9); }
  const list = [...angles].sort((a, b) => a - b);
  const outer = radialSample(convex, centre, list);
  const inner = list.map(a => ({ x: centre.x + r * Math.cos(a), y: centre.y + r * Math.sin(a) }));
  return { outer, inner };
}

/** Sample a convex polygon radially from an interior centre at the given angles. */
export function radialSample(convex: Polygon, centre: Pt, angles: number[]): Polygon {
  const out: Pt[] = [];
  for (const a of angles) {
    const dx = Math.cos(a), dy = Math.sin(a);
    let best = Infinity;
    for (let k = 0; k < convex.length; k++) {
      const p = convex[k], q = convex[(k + 1) % convex.length];
      const ex = q.x - p.x, ey = q.y - p.y;
      const den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-12) continue;
      const tRay = ((p.x - centre.x) * ey - (p.y - centre.y) * ex) / den;
      const u = ((p.x - centre.x) * dy - (p.y - centre.y) * dx) / den;
      if (tRay > 0 && u >= -1e-9 && u <= 1 + 1e-9 && tRay < best) best = tRay;
    }
    if (!isFinite(best)) throw new Error('radialSample: centre outside polygon');
    out.push({ x: centre.x + dx * best, y: centre.y + dy * best });
  }
  return out;
}
