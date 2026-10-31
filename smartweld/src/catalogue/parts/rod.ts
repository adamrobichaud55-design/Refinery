/** Plain round rod (bracing): SW-PF-8. */
import { K } from '../../core/constants';
import { drawing, rule, constant } from '../../core/basis';
import { DEFAULT_MATERIAL, type PartSpec, type Material } from '../part';
import { formatDesignation } from '../designation';
export function makeRod(id: string, d: number, lengthIn: number, material: Material = DEFAULT_MATERIAL, dBasisRule?: string): PartSpec {
  const A = (Math.PI * d * d) / 4;
  return {
    id, kind: 'ROD', category: 'section', designation: formatDesignation({ kind: 'RD', d }),
    dims: { d: dBasisRule ? rule(d, dBasisRule, 'Diameter') : drawing(d, 'Diameter'), A: rule(A, 'SW-PF-8', 'Area', 'in2'), rho: constant(K.STEEL_DENSITY_LB_FT3, 'K-1', 'Steel density', 'lb/ft3') },
    length: drawing(lengthIn, 'Length'), material,
    weight: rule(A * lengthIn * K.STEEL_DENSITY_LB_IN3, 'SW-PF-8', 'Weight', 'lb'),
    notes: ['End connections (hillside washers, clevises) not modeled in stage 2.'],
  };
}
