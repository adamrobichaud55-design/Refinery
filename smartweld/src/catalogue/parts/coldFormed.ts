/** Cold-formed Z and C sections: DESIGN_BASIS.md section 15 (SW-CF-1 .. SW-CF-3). */
import { K, weightPerFootFromArea } from '../../core/constants';
import { drawing, rule, constant } from '../../core/basis';
import { roundUpTo } from '../../core/units';
import { DEFAULT_MATERIAL, type PartSpec, type Material } from '../part';
import { arc, dedupe, type Polygon, type Pt } from '../../geometry/polygon';
import { sectionProps } from '../../geometry/properties';

export const CF_GRADE_50: Material = { grade: 'Grade 50', Fy: { value: 50, unit: 'ksi', basis: { kind: 'drawing' }, label: 'Minimum yield strength (grade stated on drawing)' } };
export const CF_THICKNESS_SERIES = [4, 5, 6, 7, 8, 9].map(n => n / 64); // SW-CF-5
const N_BEND = 4;

export interface CfDims { D: number; B: number; t: number; lip: number; ri: number; ro: number }
export function cfDims(D: number, B: number, t: number): CfDims {
  return { D, B, t, lip: roundUpTo(0.3 * B, 1 / 8), ri: 1.5 * t, ro: 2.5 * t }; // SW-CF-1
}

/**
 * Centre-line path of a lipped section, then thickened into a polygon. The path is a list of straight legs
 * joined by bends of centre-line radius rc = ri + t/2. We build the polygon directly: outer and inner faces of
 * each leg with arcs at the bends, going around the closed outline.
 */
export function thickenPath(path: Pt[], t: number, ri: number): Polygon {
  // offset a polyline (open) by ±t/2 with rounded joins at the given inside radius; returns the closed outline
  const half = t / 2, rc = ri + half;
  const left: Pt[] = [], right: Pt[] = [];
  const n = path.length;
  const dir = (i: number) => { const a = path[i], b = path[i + 1]; const L = Math.hypot(b.x - a.x, b.y - a.y); return { x: (b.x - a.x) / L, y: (b.y - a.y) / L }; };
  for (let i = 0; i < n; i++) {
    if (i === 0 || i === n - 1) {
      const d = dir(i === 0 ? 0 : n - 2); const nrm = { x: -d.y, y: d.x };
      left.push({ x: path[i].x + nrm.x * half, y: path[i].y + nrm.y * half });
      right.push({ x: path[i].x - nrm.x * half, y: path[i].y - nrm.y * half });
      continue;
    }
    const d0 = dir(i - 1), d1 = dir(i);
    const turn = d0.x * d1.y - d0.y * d1.x; // >0 left turn
    const ang0 = Math.atan2(d0.y, d0.x), ang1 = Math.atan2(d1.y, d1.x);
    let dAng = ang1 - ang0; while (dAng > Math.PI) dAng -= 2 * Math.PI; while (dAng < -Math.PI) dAng += 2 * Math.PI;
    // bend centre lies on the inside of the turn at distance rc from the centre-line, back along both legs by rc*tan(|dAng|/2)
    const tanHalf = Math.tan(Math.abs(dAng) / 2);
    const back = rc * tanHalf;
    const p0 = { x: path[i].x - d0.x * back, y: path[i].y - d0.y * back };
    const inside = turn > 0 ? { x: -d0.y, y: d0.x } : { x: d0.y, y: -d0.x };
    const c = { x: p0.x + inside.x * rc, y: p0.y + inside.y * rc };
    const a0 = Math.atan2(p0.y - c.y, p0.x - c.x);
    const a1 = a0 + dAng;
    const rIn = rc - half, rOut = rc + half;
    const arcIn = arc(c.x, c.y, rIn, a0, a1, N_BEND), arcOut = arc(c.x, c.y, rOut, a0, a1, N_BEND);
    if (turn > 0) { left.push(...arcIn); right.push(...arcOut); } else { left.push(...arcOut); right.push(...arcIn); }
  }
  return dedupe([...left, ...right.reverse()]);
}

/** Z: web on x=0 (centre line), top flange toward +x, bottom flange toward −x, lips turned in. Centred at mid-depth. */
export function zProfile(c: CfDims): Polygon {
  const { D, B, t, lip, ri } = c;
  const h = D / 2 - t / 2, bx = B - t / 2, ly = lip - t / 2;
  const path: Pt[] = [
    { x: -bx, y: -h + ly }, { x: -bx, y: -h }, { x: 0, y: -h }, { x: 0, y: h }, { x: bx, y: h }, { x: bx, y: h - ly },
  ];
  return thickenPath(path, t, ri);
}
/** C: web on x=0, both flanges toward +x, lips turned in. Centred at mid-depth. */
export function csProfile(c: CfDims): Polygon {
  const { D, B, t, lip, ri } = c;
  const h = D / 2 - t / 2, bx = B - t / 2, ly = lip - t / 2;
  const path: Pt[] = [
    { x: bx, y: -h + ly }, { x: bx, y: -h }, { x: 0, y: -h }, { x: 0, y: h }, { x: bx, y: h }, { x: bx, y: h - ly },
  ];
  return thickenPath(path, t, ri);
}

function makeCf(kind: 'Z' | 'CS', id: string, D: number, B: number, t: number, lengthIn: number, material: Material): PartSpec {
  const c = cfDims(D, B, t);
  const poly = kind === 'Z' ? zProfile(c) : csProfile(c);
  const props = sectionProps({ outer: poly });
  const wpf = weightPerFootFromArea(props.A);
  const f = (v: number) => Number(v.toFixed(4));
  return {
    id, kind, category: 'section', designation: `${kind}${D}x${B}x${f(t)}`,
    dims: {
      D: drawing(D, 'Depth'), B: drawing(B, 'Flange width'), t: drawing(t, 'Sheet thickness'),
      lip: rule(c.lip, 'SW-CF-1', 'Lip length'), ri: rule(c.ri, 'SW-CF-1', 'Inside bend radius'), ro: rule(c.ro, 'SW-CF-1', 'Outside bend radius'),
      A: rule(props.A, 'SW-CF-3', 'Gross area', 'in2'),
      Ix: rule(props.Ixx, 'SW-CF-3', 'Gross moment of inertia, strong axis', 'in2'),
      Sx: rule(props.Sx, 'SW-CF-3', 'Gross section modulus, strong axis', 'in2'),
      w: rule(wpf, 'SW-CF-3', 'Weight per foot (derived)', 'lb/ft'),
      rho: constant(K.STEEL_DENSITY_LB_FT3, 'K-1', 'Steel density', 'lb/ft3'),
    },
    length: drawing(lengthIn, 'Member length'), material,
    weight: rule((wpf * lengthIn) / 12, 'SW-CF-3', 'Weight (derived from drawn area)', 'lb'),
    notes: ['Gross properties by polygon integration; no effective-width reduction (SW-CF-3). Laps not modeled (SW-CF-2).'],
  };
}
export const makeZ = (id: string, D: number, B: number, t: number, L: number, m: Material = CF_GRADE_50) => makeCf('Z', id, D, B, t, L, m);
export const makeCS = (id: string, D: number, B: number, t: number, L: number, m: Material = CF_GRADE_50) => makeCf('CS', id, D, B, t, L, m);

/** SW-CF-5: size a purlin/girt for span Lb (in), uniform load w (lb/in), material Fy. Returns dims. */
export function sizeColdFormed(kind: 'Z' | 'CS', spanIn: number, wLbPerIn: number, Fy: number): { D: number; B: number; t: number; Sreq: number; S: number } {
  const M = (wLbPerIn * spanIn * spanIn) / 8;            // lb·in
  const Sreq = M / (0.9 * Fy * 1000);
  const D = roundUpTo(spanIn / 30, 2), B = roundUpTo(D / 4, 0.5);
  for (const t of CF_THICKNESS_SERIES) {
    const c = cfDims(D, B, t);
    const S = sectionProps({ outer: kind === 'Z' ? zProfile(c) : csProfile(c) }).Sx;
    if (S >= Sreq) return { D, B, t, Sreq, S };
  }
  throw new Error(`No cold-formed ${kind} in the SW-CF-5 series carries span ${spanIn} in at ${wLbPerIn} lb/in`);
}
