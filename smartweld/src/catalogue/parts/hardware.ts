/** Bolts and anchor rods: DESIGN_BASIS.md section 9. */
import { K } from '../../core/constants';
import { drawing, rule, constant, type Dim } from '../../core/basis';
import { roundUpTo, roundTo } from '../../core/units';
import { DEFAULT_MATERIAL, type PartSpec, type Material } from '../part';
import { formatDesignation } from '../designation';

const RHO = K.STEEL_DENSITY_LB_IN3;
const rhoDim = () => constant(K.STEEL_DENSITY_LB_FT3, 'K-1', 'Steel density', 'lb/ft3');

export interface HexDims { F: number; C: number; H: number; nutH: number; washerOD: number; washerT: number; hole: number }

/** SW-B-2/3/4/8 derived hardware dimensions for a nominal diameter d. */
export function hexHardware(d: number): HexDims {
  const F = roundUpTo(1.5 * d, 1 / 16);
  return {
    F,
    C: F / Math.cos(Math.PI / 6),
    H: roundTo(0.65 * d, 1 / 32),
    nutH: roundTo(1.0 * d, 1 / 32),
    washerOD: 2 * d,
    washerT: Math.max(1 / 8, roundUpTo(0.15 * d, 1 / 32)),
    hole: d + 1 / 16,
  };
}

/** SW-B-7: bolt length for a grip (sum of ply thicknesses). One washer under the nut. */
export function boltLengthForGrip(d: number, grip: number): number {
  const h = hexHardware(d);
  return roundUpTo(grip + h.washerT + h.nutH + d / 4, 0.25);
}

export function hexArea(F: number): number { return (Math.sqrt(3) / 2) * F * F; }

/** A structural bolt assembly: head + shank + one washer + nut. */
export function makeBolt(id: string, d: number, L: number, grip?: number, material: Material = DEFAULT_MATERIAL): PartSpec {
  const h = hexHardware(d);
  const shank = Math.PI * d * d / 4;
  const vol = hexArea(h.F) * h.H + shank * L
    + (hexArea(h.F) - shank) * h.nutH
    + (Math.PI / 4) * (h.washerOD ** 2 - h.hole ** 2) * h.washerT;
  const dims: Record<string, Dim> = {
    d: drawing(d, 'Nominal diameter'),
    L: drawing(L, 'Length under head'),
    F: rule(h.F, 'SW-B-2', 'Head/nut width across flats'),
    C: rule(h.C, 'SW-B-2', 'Head/nut width across corners'),
    H: rule(h.H, 'SW-B-2', 'Head height'),
    nutH: rule(h.nutH, 'SW-B-3', 'Nut height'),
    washerOD: rule(h.washerOD, 'SW-B-4', 'Washer outside diameter'),
    washerT: rule(h.washerT, 'SW-B-4', 'Washer thickness'),
    threadLength: rule(Math.min(L, 2 * d), 'SW-B-5', 'Thread length'),
    stickOut: rule(d / 4, 'SW-B-6', 'Minimum thread stick-out beyond nut'),
    hole: rule(h.hole, 'SW-B-8', 'Standard hole'),
    minSpacing: rule(3 * d, 'SW-B-9', 'Minimum spacing'),
    minEdge: rule(1.5 * d, 'SW-B-9', 'Minimum edge distance'),
    rho: rhoDim(),
  };
  if (grip !== undefined) dims.grip = drawing(grip, 'Grip');
  return {
    id, kind: 'BOLT', category: 'hardware', designation: formatDesignation({ kind: 'B', d, L }),
    dims, length: drawing(L, 'Length under head'), material,
    weight: rule(vol * RHO, 'SW-B-2', 'Weight of head, shank, washer and nut', 'lb'),
    notes: ['Threads not modeled as helices (shank drawn at nominal diameter).'],
  };
}

export interface AnchorRodInput {
  d?: number;             // drawing; omitted → SW-AR-1a
  basePlateT: number;     // from base plate
  groutT: number;         // SW-BP-5
  plateWasherT: number;   // SW-BP-4
}

export function makeAnchorRod(id: string, input: AnchorRodInput, material: Material = DEFAULT_MATERIAL): PartSpec {
  const dDim: Dim = input.d !== undefined ? drawing(input.d, 'Diameter') : rule(0.75, 'SW-AR-1a', 'Diameter (default)');
  const d = dDim.value;
  const h = hexHardware(d);
  const embed = Math.max(12 * d, 12);                                                        // SW-AR-2
  const projRaw = input.groutT + input.basePlateT + h.nutH + input.plateWasherT + h.nutH + d / 4; // SW-AR-3
  const proj = roundUpTo(projRaw, 0.25);
  const L = embed + proj;
  const shank = Math.PI * d * d / 4;
  const hole = d + 1 / 16, topHole = d + 0.5; // embedded washer hole SW-B-8; top washer spans the SW-BP-4 oversize hole
  const vol = shank * L + 3 * (hexArea(h.F) - shank) * h.nutH
    + ((3 * d) ** 2 - Math.PI * hole * hole / 4) * (3 / 8)
    + ((3 * d) ** 2 - Math.PI * topHole * topHole / 4) * input.plateWasherT;
  return {
    id, kind: 'ANCHOR_ROD', category: 'hardware', designation: formatDesignation({ kind: 'AR', d, L }),
    dims: {
      d: dDim,
      embed: rule(embed, 'SW-AR-2', 'Embedment below concrete surface'),
      proj: rule(proj, 'SW-AR-3', 'Projection above concrete'),
      L: rule(L, 'SW-AR-3', 'Overall length'),
      F: rule(h.F, 'SW-B-3', 'Nut width across flats'),
      nutH: rule(h.nutH, 'SW-B-3', 'Nut height'),
      embWasherSide: rule(3 * d, 'SW-AR-2', 'Embedded plate washer side'),
      embWasherT: rule(3 / 8, 'SW-AR-2', 'Embedded plate washer thickness'),
      topWasherSide: rule(3 * d, 'SW-BP-4', 'Top plate washer side'),
      topWasherT: rule(input.plateWasherT, 'SW-BP-4', 'Top plate washer thickness'),
      grout: rule(input.groutT, 'SW-BP-5', 'Grout bed'),
      basePlateT: rule(input.basePlateT, 'SW-BP-2', 'Base plate thickness'),
      stickOut: rule(d / 4, 'SW-B-6', 'Stick-out beyond top nut'),
      rho: rhoDim(),
    },
    length: rule(L, 'SW-AR-3', 'Overall length'), material,
    weight: rule(vol * RHO, 'SW-AR-3', 'Weight of rod, 3 nuts, 2 plate washers', 'lb'),
    notes: ['Embedded nut + plate washer (SW-AR-2); leveling nut, plate washer, top nut above (SW-AR-3).'],
  };
}
