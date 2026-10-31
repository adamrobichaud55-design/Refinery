/** Welds: DESIGN_BASIS.md section 10. */
import { K } from '../../core/constants';
import { drawing, rule, constant, type Dim } from '../../core/basis';
import { roundUpTo } from '../../core/units';
import { DEFAULT_MATERIAL, type PartSpec, type Material } from '../part';
import { formatDesignation } from '../designation';

const RHO = K.STEEL_DENSITY_LB_IN3;

/** SW-WD-1: fillet leg from the thinner part (and whether the weld lies along that part's edge). */
export function filletLegForThickness(tThin: number, alongEdge = false): number {
  let w = Math.max(3 / 16, roundUpTo(0.75 * tThin, 1 / 16));
  if (alongEdge && tThin > 0.25) w = Math.min(w, tThin - 1 / 16);
  return w;
}

export function makeFilletWeld(id: string, lengthIn: number, opts: { leg?: number; tThin?: number; alongEdge?: boolean }, material: Material = DEFAULT_MATERIAL): PartSpec {
  const legDim: Dim = opts.leg !== undefined
    ? drawing(opts.leg, 'Leg size')
    : rule(filletLegForThickness(opts.tThin ?? 0.25, opts.alongEdge), 'SW-WD-1', 'Leg size');
  const w = legDim.value;
  return {
    id, kind: 'FILLET_WELD', category: 'weld', designation: formatDesignation({ kind: 'FW', leg: w }),
    dims: {
      leg: legDim,
      throat: rule(w * Math.SQRT1_2, 'SW-WD-2', 'Throat'),
      area: rule(0.5 * w * w, 'SW-WD-2', 'Cross-section area', 'in2'),
      rho: constant(K.STEEL_DENSITY_LB_FT3, 'K-1', 'Steel density', 'lb/ft3'),
    },
    length: drawing(lengthIn, 'Weld length'), material,
    weight: rule(0.5 * w * w * lengthIn * RHO, 'SW-WD-3', 'Weld metal weight', 'lb'),
    notes: ['Flat-faced isosceles fillet at true size (SW-WD-2).'],
  };
}

export interface GrooveDims { t: number; rootOpening: number; rootFace: number; includedAngle: number; topWidth: number; cap: number; area: number }

/** SW-WD-4: single-V complete-penetration groove between plates of thickness t. */
export function grooveDims(t: number): GrooveDims {
  const rootOpening = 1 / 8, rootFace = 1 / 16, includedAngle = 60, cap = 1 / 16;
  const h = t - rootFace;
  const topWidth = rootOpening + 2 * h * Math.tan((includedAngle / 2) * Math.PI / 180);
  const area = rootOpening * t + h * h * Math.tan((includedAngle / 2) * Math.PI / 180) + 0.5 * topWidth * cap; // cap modeled as a shallow triangle (SW-WD-4)
  return { t, rootOpening, rootFace, includedAngle, topWidth, cap, area };
}

export function makeGrooveWeld(id: string, t: number, lengthIn: number, material: Material = DEFAULT_MATERIAL): PartSpec {
  const g = grooveDims(t);
  return {
    id, kind: 'GROOVE_WELD', category: 'weld', designation: formatDesignation({ kind: 'GW', t }),
    dims: {
      t: drawing(t, 'Joint thickness'),
      rootOpening: rule(g.rootOpening, 'SW-WD-4', 'Root opening'),
      rootFace: rule(g.rootFace, 'SW-WD-4', 'Root face'),
      includedAngle: rule(g.includedAngle, 'SW-WD-4', 'Included angle', 'deg'),
      topWidth: rule(g.topWidth, 'SW-WD-4', 'Groove width at surface'),
      cap: rule(g.cap, 'SW-WD-4', 'Reinforcement height'),
      area: rule(g.area, 'SW-WD-5', 'Weld cross-section area', 'in2'),
      rho: constant(K.STEEL_DENSITY_LB_FT3, 'K-1', 'Steel density', 'lb/ft3'),
    },
    length: drawing(lengthIn, 'Weld length'), material,
    weight: rule(g.area * lengthIn * RHO, 'SW-WD-5', 'Weld metal weight', 'lb'),
    notes: ['Single-V, 60° included, with 1/16 in reinforcement (SW-WD-4).'],
  };
}
