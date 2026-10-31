/** Angles: DESIGN_BASIS.md section 6 (SW-L-1 .. SW-L-3). */
import { K, weightPerFootFromArea } from '../../core/constants';
import { drawing, rule, constant } from '../../core/basis';
import { roundWidth } from '../../core/units';
import { DEFAULT_MATERIAL, type PartSpec, type Material } from '../part';
import { formatDesignation } from '../designation';

const Q = 1 - Math.PI / 4;

export function angleArea(a: number, b: number, t: number): number {
  const R = t, rToe = t / 2;                          // SW-L-2
  return t * (a + b - t) + Q * R * R - 2 * Q * rToe * rToe;  // SW-L-3
}

export function makeAngle(id: string, a: number, b: number, t: number, lengthIn: number, material: Material = DEFAULT_MATERIAL): PartSpec {
  const A = angleArea(a, b, t);
  const wpf = weightPerFootFromArea(A);
  return {
    id, kind: 'L', category: 'section', designation: formatDesignation({ kind: 'L', a, b, t }),
    dims: {
      a: drawing(a, 'Leg a (vertical)'),
      b: drawing(b, 'Leg b (horizontal)'),
      t: drawing(t, 'Thickness'),
      R: rule(roundWidth(t), 'SW-L-2', 'Root fillet radius'),
      rToe: rule(roundWidth(t / 2), 'SW-L-2', 'Toe radius'),
      A: rule(A, 'SW-L-3', 'Cross-section area', 'in2'),
      w: rule(wpf, 'SW-L-3', 'Weight per foot (derived)', 'lb/ft'),
      rho: constant(K.STEEL_DENSITY_LB_FT3, 'K-1', 'Steel density', 'lb/ft3'),
    },
    length: drawing(lengthIn, 'Member length'),
    material,
    weight: rule((wpf * lengthIn) / 12, 'SW-L-3', 'Weight (derived from drawn area)', 'lb'),
    notes: ['Legs and thickness stated; fillet and toe radii by SW-L-2; weight derived by SW-L-3.'],
  };
}
