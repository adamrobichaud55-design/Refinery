/** Cladding panels and trim: DESIGN_BASIS.md section 16 (SW-CL-1 .. SW-CL-5). */
import { K } from '../../core/constants';
import { drawing, rule, constant } from '../../core/basis';
import { type PartSpec, type Material } from '../part';
import { CF_GRADE_50, thickenPath } from './coldFormed';
import { arc, dedupe, type Polygon, type Pt } from '../../geometry/polygon';
import { sectionProps } from '../../geometry/properties';

export const PANEL: { t: number; ribH: number; pitch: number; topFlat: number; sideAngleDeg: number; cover: number } = { t: 0.025, ribH: 1.25, pitch: 12, topFlat: 1.5, sideAngleDeg: 30, cover: 36 }; // SW-CL-1
const RHO = K.STEEL_DENSITY_LB_IN3;

/** Panel cross-section: x across the sheet (0..cover), y up with the flat pan at y=0 and ribs rising to ribH. */
export function panelProfile(cover = PANEL.cover): Polygon {
  const { t, ribH, pitch, topFlat, sideAngleDeg } = PANEL;
  const run = ribH * Math.tan((sideAngleDeg * Math.PI) / 180);
  const ribs = Math.round(cover / pitch);
  const top: Pt[] = [{ x: 0, y: 0 }];
  for (let i = 0; i < ribs; i++) {
    const c = pitch * i + pitch / 2; // rib centre
    top.push({ x: c - topFlat / 2 - run, y: 0 }, { x: c - topFlat / 2, y: ribH }, { x: c + topFlat / 2, y: ribH }, { x: c + topFlat / 2 + run, y: 0 });
  }
  top.push({ x: cover, y: 0 });
  // offset the polyline by t (the sheet's upper surface): simple vertical offset is exact on flats and slightly
  // thick on the slopes; use a true normal offset instead.
  const upper: Pt[] = [];
  for (let i = 0; i < top.length; i++) {
    const a = top[Math.max(0, i - 1)], b = top[i], c = top[Math.min(top.length - 1, i + 1)];
    const n1 = norm(a, b), n2 = norm(b, c);
    let nx = n1.x + n2.x, ny = n1.y + n2.y; const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
    const cosHalf = Math.max(0.5, nx * n1.x + ny * n1.y); // miter length limit
    upper.push({ x: b.x + (nx * t) / cosHalf, y: b.y + (ny * t) / cosHalf });
  }
  return dedupe([...top, ...upper.reverse()]);
}
function norm(a: Pt, b: Pt): Pt { const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1; return { x: -dy / L, y: dx / L }; }

export function makePanel(id: string, lengthIn: number, material: Material = CF_GRADE_50, cover = PANEL.cover): PartSpec {
  const prof = { outer: panelProfile(cover) };
  const props = sectionProps(prof);
  const SxPerFt = (props.Sx * 12) / cover;
  return {
    id, kind: 'PANEL', category: 'sheet', designation: `PNL${PANEL.ribH}x${cover}`,
    dims: {
      t: rule(PANEL.t, 'SW-CL-1', 'Sheet thickness'), ribH: rule(PANEL.ribH, 'SW-CL-1', 'Rib height'),
      pitch: rule(PANEL.pitch, 'SW-CL-1', 'Rib pitch'), topFlat: rule(PANEL.topFlat, 'SW-CL-1', 'Rib top flat'),
      cover: rule(cover, 'SW-CL-1', 'Cover width'),
      A: rule(props.A, 'SW-CL-3', 'Gross area of sheet', 'in2'),
      SxPerFt: rule(SxPerFt, 'SW-CL-3', 'Gross section modulus per foot of width', 'in2'),
      rho: constant(K.STEEL_DENSITY_LB_FT3, 'K-1', 'Steel density', 'lb/ft3'),
    },
    length: drawing(lengthIn, 'Sheet length'), material,
    weight: rule(props.A * lengthIn * RHO, 'SW-CL-1', 'Weight (profile area × length × K-1)', 'lb'),
    notes: ['Single-skin ribbed sheet; side laps and fasteners not modeled (SW-CL-1, SW-CL-4).'],
  };
}
/** Panel dead load in psf from the drawn profile. */
export function panelPsf(): number {
  const props = sectionProps({ outer: panelProfile() });
  return (props.A * 12 * RHO * 144) / (PANEL.cover * 12); // lb per ft² = area(in²)×12in×ρ per (cover×12) in² × 144
}

/** Trim: a formed angle of legs a (vertical) × b (horizontal) from sheet t with inside bend 1.5 t (SW-CL-5). */
/** Ridge cap (SW-CL-5): two legs bent at the roof angle, apex at the origin, legs descending each slope. */
export function ridgeCapProfile(leg: number, theta: number, t = PANEL.t): Polygon {
  const path: Pt[] = [{ x: -leg * Math.cos(theta), y: -leg * Math.sin(theta) }, { x: 0, y: 0 }, { x: leg * Math.cos(theta), y: -leg * Math.sin(theta) }];
  return thickenPath(path, t, 1.5 * t);
}
export function trimProfile(a: number, b: number, t = PANEL.t): Polygon {
  const ri = 1.5 * t, ro = ri + t;
  const pts: Pt[] = [{ x: b, y: 0 }, { x: b, y: t }, { x: ro, y: t }];
  pts.push(...arc(ro, ro, ri, -Math.PI / 2, -Math.PI, 4));
  pts.push({ x: t, y: a }, { x: 0, y: a });
  pts.push(...arc(ro, ro, ro, Math.PI, 1.5 * Math.PI, 4));
  return dedupe(pts);
}
export function makeTrim(id: string, name: string, a: number, b: number, lengthIn: number, material: Material = CF_GRADE_50, t = PANEL.t, ridgeTheta?: number): PartSpec {
  const outline = ridgeTheta !== undefined ? ridgeCapProfile(a, ridgeTheta, t) : trimProfile(a, b, t);
  const props = sectionProps({ outer: outline });
  return {
    id, kind: 'TRIM', category: 'sheet', designation: `TRIM${a}x${b} ${name}`,
    dims: { a: rule(a, 'SW-CL-5', 'Leg a'), b: rule(b, 'SW-CL-5', 'Leg b'), t: t === PANEL.t ? rule(t, 'SW-CL-5', 'Sheet thickness') : drawing(t, 'Sheet thickness'), ri: rule(1.5 * t, 'SW-CL-5', 'Inside bend radius'), rho: constant(K.STEEL_DENSITY_LB_FT3, 'K-1', 'Steel density', 'lb/ft3') },
    extra: { outline },
    length: drawing(lengthIn, 'Length'), material,
    weight: rule(props.A * lengthIn * RHO, 'SW-CL-5', 'Weight', 'lb'),
    notes: [],
  };
}
