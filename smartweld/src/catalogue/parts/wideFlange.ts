/** Wide-flange sections: DESIGN_BASIS.md section 4 (SW-W-1 .. SW-W-8). */
import { areaFromWeightPerFoot, K } from '../../core/constants';
import { drawing, rule, constant } from '../../core/basis';
import { roundThickness, roundWidth } from '../../core/units';
import { clamp, positiveRoot, smallerRoot, DEFAULT_MATERIAL, type PartSpec, type Material } from '../part';

const FILLET_AREA_4 = 4 * (1 - Math.PI / 4); // 0.8584, four fillets of radius tw (SW-W-6)

/** SW-W-5: clear web depth T of the family with nominal depth D. */
export function familyClearDepth(D: number): number {
  const A0 = 0.045 * D * D;        // reference member r0 = 0.045
  const bf0 = 0.40 * D;            // SW-W-2 at r0 (≤ 0.05)
  // A0 = (3.2 bf0 + D) tw0 - (3.2 - 0.8584) tw0^2   (d = D exactly for the reference member)
  const tw0 = smallerRoot(3.2 - FILLET_AREA_4, -(3.2 * bf0 + D), A0);
  return D - 3.2 * tw0; // T = D - 2 tf0, tf0 = 1.6 tw0
}

export interface WDims { D: number; w: number; A: number; bf: number; tw: number; tf: number; R: number; T: number; d: number }

export function proportionW(D: number, w: number): WDims {
  const A = areaFromWeightPerFoot(w);                            // SW-W-1
  const r = A / (D * D);
  const bf = roundWidth(clamp(0.40 + 6 * (r - 0.05), 0.40, 1.0) * D); // SW-W-2
  const T = familyClearDepth(D);                                // SW-W-5
  const twRaw = positiveRoot(FILLET_AREA_4, 3.2 * bf + T, -A);  // SW-W-6
  const tw = roundThickness(twRaw);
  // SW-W-7: after rounding tw, re-solve tf from the area balance so the drawn section weighs what the designation states
  const tf = roundThickness((A - T * tw - FILLET_AREA_4 * tw * tw) / (2 * bf));
  const R = roundThickness(tw);                                 // SW-W-4
  const d = roundWidth(T + 2 * tf);                             // SW-W-5
  return { D, w, A, bf, tw, tf, R, T: roundWidth(T), d };
}

/** Area of the drawn section (closed form, matches the profile up to arc facetting). */
export function wArea(p: WDims): number {
  return 2 * p.bf * p.tf + (p.d - 2 * p.tf) * p.tw + FILLET_AREA_4 * p.R * p.R;
}

export function makeWideFlange(id: string, D: number, w: number, lengthIn: number, material: Material = DEFAULT_MATERIAL): PartSpec {
  const p = proportionW(D, w);
  const designation = `W${D}x${w}`;
  return {
    id, kind: 'W', category: 'section', designation,
    dims: {
      D: drawing(D, 'Nominal depth'),
      w: drawing(w, 'Weight per foot', 'lb/ft'),
      A: rule(p.A, 'SW-W-1', 'Cross-section area', 'in2'),
      bf: rule(p.bf, 'SW-W-2', 'Flange width'),
      tf: rule(p.tf, 'SW-W-3', 'Flange thickness'),
      tw: rule(p.tw, 'SW-W-6', 'Web thickness'),
      R: rule(p.R, 'SW-W-4', 'Web-flange fillet radius'),
      T: rule(p.T, 'SW-W-5', 'Clear distance between flanges'),
      d: rule(p.d, 'SW-W-5', 'Actual depth'),
      k: rule(p.tf + p.R, 'SW-W-4', 'k distance (flange face to end of fillet)'),
      rho: constant(K.STEEL_DENSITY_LB_FT3, 'K-1', 'Steel density', 'lb/ft3'),
    },
    length: drawing(lengthIn, 'Member length'),
    material,
    weight: drawing((w * lengthIn) / 12, 'Weight (designation weight × length)', 'lb'),
    notes: ['Cross-section proportioned by SmartWeld rules SW-W-2..6; only D and w are stated by the designation.'],
  };
}
