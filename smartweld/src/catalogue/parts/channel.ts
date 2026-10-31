/** Channels: DESIGN_BASIS.md section 5 (SW-C-1 .. SW-C-7). */
import { areaFromWeightPerFoot, K } from '../../core/constants';
import { drawing, rule, constant } from '../../core/basis';
import { roundThickness, roundWidth } from '../../core/units';
import { clamp, smallerRoot, DEFAULT_MATERIAL, type PartSpec, type Material } from '../part';

const FILLET_AREA_2 = 2 * (1 - Math.PI / 4); // two fillets of radius tw
export const CHANNEL_TAPER = 1 / 6; // SW-C-4 inside flange slope

export interface CDims { D: number; w: number; A: number; bf: number; tw: number; tf: number; tTip: number; tRoot: number; R: number; rToe: number; d: number }

export function proportionC(D: number, w: number): CDims {
  const A = areaFromWeightPerFoot(w);                                   // SW-C-1
  const r = A / (D * D);
  const bf = roundWidth(clamp(0.25 + 2 * (r - 0.04), 0.25, 0.40) * D);  // SW-C-3
  // SW-C-6: A = (3 bf + D) tw - (3 - 0.4292) tw^2  -> smaller root
  const twRaw = smallerRoot(3 - FILLET_AREA_2, -(3 * bf + D), A);
  const tw = roundThickness(twRaw);
  // SW-C-7: after rounding tw, re-solve the average flange thickness from the exact drawn-area balance
  // A = D tw + 2 (bf - tw) tf + 2Q tw^2 - 0.5 Q tTip^2, tTip = tf - s (bf - tw)/2   (Q = 1 - pi/4)
  const Q = 1 - Math.PI / 4, s = CHANNEL_TAPER, half = (bf - tw) / 2;
  const qa = 0.5 * Q, qb = -(Q * s * half + 4 * half), qc = A - D * tw - 2 * Q * tw * tw + 0.5 * Q * s * s * half * half;
  const tf = roundThickness(smallerRoot(qa, qb, qc));
  const tTip = roundThickness(tf - CHANNEL_TAPER * half);
  const tRoot = roundThickness(tf + CHANNEL_TAPER * half);
  const R = roundThickness(tw);                                         // SW-C-5
  const rToe = roundWidth(tTip / 2);
  return { D, w, A, bf, tw, tf, tTip, tRoot, R, rToe, d: D };          // SW-C-2
}

export function makeChannel(id: string, D: number, w: number, lengthIn: number, material: Material = DEFAULT_MATERIAL): PartSpec {
  const p = proportionC(D, w);
  return {
    id, kind: 'C', category: 'section', designation: `C${D}x${w}`,
    dims: {
      D: drawing(D, 'Depth'),
      w: drawing(w, 'Weight per foot', 'lb/ft'),
      A: rule(p.A, 'SW-C-1', 'Cross-section area', 'in2'),
      d: rule(p.d, 'SW-C-2', 'Actual depth'),
      bf: rule(p.bf, 'SW-C-3', 'Flange width'),
      tf: rule(p.tf, 'SW-C-4', 'Average flange thickness'),
      tTip: rule(p.tTip, 'SW-C-4', 'Flange thickness at tip'),
      tRoot: rule(p.tRoot, 'SW-C-4', 'Flange thickness at root'),
      tw: rule(p.tw, 'SW-C-6', 'Web thickness'),
      R: rule(p.R, 'SW-C-5', 'Web-flange fillet radius'),
      rToe: rule(p.rToe, 'SW-C-5', 'Toe radius'),
      rho: constant(K.STEEL_DENSITY_LB_FT3, 'K-1', 'Steel density', 'lb/ft3'),
    },
    length: drawing(lengthIn, 'Member length'),
    material,
    weight: drawing((w * lengthIn) / 12, 'Weight (designation weight × length)', 'lb'),
    notes: ['Cross-section proportioned by SmartWeld rules SW-C-2..6; only D and w are stated by the designation.'],
  };
}
