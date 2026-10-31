/** Hollow structural sections: DESIGN_BASIS.md section 7 (SW-HSS-1 .. SW-HSS-4). */
import { K, weightPerFootFromArea } from '../../core/constants';
import { drawing, rule, constant } from '../../core/basis';
import { roundWidth } from '../../core/units';
import { DEFAULT_MATERIAL, type PartSpec, type Material } from '../part';
import { formatDesignation } from '../designation';

export const HSS_RI = 1.5; // SW-HSS-2 inside radius / t
export const HSS_RO = 2.5; // SW-HSS-2 outside radius / t

export function hssRectArea(H: number, B: number, t: number): number {
  const Ro = HSS_RO * t, Ri = HSS_RI * t;
  const outer = H * B - (4 - Math.PI) * Ro * Ro;
  const inner = (H - 2 * t) * (B - 2 * t) - (4 - Math.PI) * Ri * Ri;
  return outer - inner; // SW-HSS-4
}
export function hssRoundArea(OD: number, t: number): number {
  return (Math.PI / 4) * (OD * OD - (OD - 2 * t) * (OD - 2 * t));
}

export function makeHssRect(id: string, H: number, B: number, t: number, lengthIn: number, material: Material = DEFAULT_MATERIAL): PartSpec {
  if (2 * t >= Math.min(H, B)) throw new Error('HSS wall too thick for its outside size');
  const A = hssRectArea(H, B, t);
  const wpf = weightPerFootFromArea(A);
  return {
    id, kind: 'HSS_RECT', category: 'section', designation: formatDesignation({ kind: 'HSS_RECT', H, B, t }),
    dims: {
      H: drawing(H, 'Outside depth'),
      B: drawing(B, 'Outside width'),
      t: drawing(t, 'Wall thickness (modeled as stated, SW-HSS-1)'),
      Ro: rule(roundWidth(HSS_RO * t), 'SW-HSS-2', 'Outside corner radius'),
      Ri: rule(roundWidth(HSS_RI * t), 'SW-HSS-2', 'Inside corner radius'),
      A: rule(A, 'SW-HSS-4', 'Cross-section area', 'in2'),
      w: rule(wpf, 'SW-HSS-4', 'Weight per foot (derived)', 'lb/ft'),
      rho: constant(K.STEEL_DENSITY_LB_FT3, 'K-1', 'Steel density', 'lb/ft3'),
    },
    length: drawing(lengthIn, 'Member length'),
    material,
    weight: rule((wpf * lengthIn) / 12, 'SW-HSS-4', 'Weight (derived from drawn area)', 'lb'),
    notes: ['No design-wall reduction is applied (SW-HSS-1).'],
  };
}

export function makeHssRound(id: string, OD: number, t: number, lengthIn: number, material: Material = DEFAULT_MATERIAL): PartSpec {
  if (2 * t >= OD) throw new Error('HSS wall too thick for its outside diameter');
  const A = hssRoundArea(OD, t);
  const wpf = weightPerFootFromArea(A);
  return {
    id, kind: 'HSS_ROUND', category: 'section', designation: formatDesignation({ kind: 'HSS_ROUND', OD, t }),
    dims: {
      OD: drawing(OD, 'Outside diameter'),
      t: drawing(t, 'Wall thickness (modeled as stated, SW-HSS-1)'),
      ID: rule(OD - 2 * t, 'SW-HSS-3', 'Inside diameter'),
      A: rule(A, 'SW-HSS-4', 'Cross-section area', 'in2'),
      w: rule(wpf, 'SW-HSS-4', 'Weight per foot (derived)', 'lb/ft'),
      rho: constant(K.STEEL_DENSITY_LB_FT3, 'K-1', 'Steel density', 'lb/ft3'),
    },
    length: drawing(lengthIn, 'Member length'),
    material,
    weight: rule((wpf * lengthIn) / 12, 'SW-HSS-4', 'Weight (derived from drawn area)', 'lb'),
    notes: [],
  };
}
