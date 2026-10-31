/** Plates, gussets, base plates, stiffeners: DESIGN_BASIS.md section 8. */
import { K } from '../../core/constants';
import { drawing, rule, constant, type Dim } from '../../core/basis';
import { roundUpTo, roundDownTo, roundWidth } from '../../core/units';
import { DEFAULT_MATERIAL, type PartSpec, type Material } from '../part';
import { formatDesignation } from '../designation';
import type { WDims } from './wideFlange';

const RHO = K.STEEL_DENSITY_LB_IN3;
const rhoDim = () => constant(K.STEEL_DENSITY_LB_FT3, 'K-1', 'Steel density', 'lb/ft3');

/** SW-PL-2: plate thickness increments. */
export function plateThicknessIncrement(t: number): number {
  return t < 0.5 ? roundUpTo(t, 1 / 16) : roundUpTo(t, 1 / 8);
}

export function makePlate(id: string, t: number, w: number, L: number, material: Material = DEFAULT_MATERIAL): PartSpec {
  return {
    id, kind: 'PL', category: 'plate', designation: formatDesignation({ kind: 'PL', t, w, L }),
    dims: { t: drawing(t, 'Thickness'), w: drawing(w, 'Width'), L: drawing(L, 'Length'), rho: rhoDim() },
    length: drawing(L, 'Length'),
    material,
    weight: drawing(t * w * L * RHO, 'Weight (t × w × L × K-1)', 'lb'),
    notes: [],
  };
}

export interface Pt { x: number; y: number }

/** SW-GP-1/2: a gusset is an outline polygon (drawing or later rule) with a rule thickness. */
export function makeGusset(id: string, outline: Pt[], tMember: number, material: Material = DEFAULT_MATERIAL, tStated?: number): PartSpec {
  const tg = tStated ?? plateThicknessIncrement(Math.max(3 / 8, 0.75 * tMember));
  const area = Math.abs(outline.reduce((s, p, i) => { const q = outline[(i + 1) % outline.length]; return s + p.x * q.y - q.x * p.y; }, 0)) / 2;
  const xs = outline.map(p => p.x), ys = outline.map(p => p.y);
  const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
  return {
    id, kind: 'GUSSET', category: 'plate', designation: `PL${tg}x${roundWidth(w)}x${roundWidth(h)} gusset`,
    dims: {
      t: tStated !== undefined ? drawing(tg, 'Thickness') : rule(tg, 'SW-GP-2', 'Thickness'),
      w: drawing(w, 'Envelope width'), h: drawing(h, 'Envelope height'),
      area: drawing(area, 'Outline area', 'in2'), rho: rhoDim(),
    },
    length: drawing(tg, 'Thickness (extrusion)'),
    material,
    weight: rule(area * tg * RHO, 'SW-GP-2', 'Weight (outline area × t × K-1)', 'lb'),
    notes: ['Outline from drawing (SW-GP-1); thickness by SW-GP-2 unless stated.'],
    extra: { outline },
  };
}

export interface BasePlateInput {
  column: WDims;
  /** bearing pressure under the plate, ksi (drawing) — omitted: SW-BP-2a default 1.0 ksi */
  bearingPressureKsi?: number;
  /** anchor rod diameter (drawing) — omitted: SW-AR-1a default 3/4 in */
  rodDiameter?: number;
}

export function makeBasePlate(id: string, input: BasePlateInput, material: Material = DEFAULT_MATERIAL): PartSpec {
  const { d, bf } = input.column;
  const e = 3;                                                             // SW-BP-1
  const N = roundUpTo(d + 2 * e, 1), B = roundUpTo(bf + 2 * e, 1);
  const l = Math.max((N - d) / 2, (B - bf) / 2);                           // SW-BP-2
  const fp: Dim = input.bearingPressureKsi !== undefined
    ? drawing(input.bearingPressureKsi, 'Bearing pressure', 'ksi')
    : rule(1.0, 'SW-BP-2a', 'Bearing pressure (default)', 'ksi');
  const tRaw = l * Math.sqrt((2 * fp.value) / (0.9 * material.Fy.value));
  const t = Math.max(0.75, plateThicknessIncrement(tRaw));
  const dr: Dim = input.rodDiameter !== undefined
    ? drawing(input.rodDiameter, 'Anchor rod diameter')
    : rule(0.75, 'SW-AR-1a', 'Anchor rod diameter (default)');
  const hole = dr.value + 0.5;                                             // SW-BP-4
  const inset = 1.5;                                                       // SW-BP-3
  const holes: Pt[] = [
    { x: -(B / 2 - inset), y: -(N / 2 - inset) }, { x: B / 2 - inset, y: -(N / 2 - inset) },
    { x: B / 2 - inset, y: N / 2 - inset }, { x: -(B / 2 - inset), y: N / 2 - inset },
  ];
  return {
    id, kind: 'BASE_PLATE', category: 'plate', designation: `PL${t}x${B}x${N} base plate`,
    dims: {
      N: rule(N, 'SW-BP-1', 'Plate length (along column depth)'),
      B: rule(B, 'SW-BP-1', 'Plate width (across flanges)'),
      e: rule(e, 'SW-BP-1', 'Edge margin beyond column'),
      l: rule(l, 'SW-BP-2', 'Cantilever length'),
      fp, Fy: material.Fy,
      t: rule(t, 'SW-BP-2', 'Plate thickness'),
      rodCount: rule(4, 'SW-BP-3', 'Anchor rod count', 'count'),
      rodInset: rule(inset, 'SW-BP-3', 'Rod inset from plate edges'),
      dr,
      hole: rule(hole, 'SW-BP-4', 'Rod hole diameter'),
      washerSide: rule(3 * dr.value, 'SW-BP-4', 'Plate washer side'),
      washerT: rule(3 / 8, 'SW-BP-4', 'Plate washer thickness'),
      grout: rule(1.5, 'SW-BP-5', 'Grout bed thickness'),
      rho: rhoDim(),
    },
    length: rule(t, 'SW-BP-2', 'Thickness (extrusion)'),
    material,
    weight: rule((N * B - 4 * Math.PI * (hole / 2) ** 2) * t * RHO, 'SW-BP-2', 'Weight (plan area less holes × t × K-1)', 'lb'),
    notes: ['Plan size SW-BP-1, thickness SW-BP-2 (cantilever strip), 4 rods SW-BP-3, holes SW-BP-4.'],
    extra: { holes, holeDiameter: hole },
  };
}

/** SW-ST-1..3: one transverse stiffener plate of a pair on a W section. */
export function makeStiffener(id: string, column: WDims, material: Material = DEFAULT_MATERIAL): PartSpec {
  const { bf, tw, R, T } = column;
  const bs = roundDownTo((bf - tw) / 2 - 0.25, 0.25);                     // SW-ST-1
  const ts = roundUpTo(Math.max(3 / 8, bs / 15), 1 / 16);
  const clip = Math.max(0.75, roundUpTo(R + 0.25, 0.25));                  // SW-ST-2
  const outline: Pt[] = [                                                  // x across outstand (0 at web face), y along T
    { x: clip, y: 0 }, { x: bs, y: 0 }, { x: bs, y: T }, { x: clip, y: T },
    { x: clip, y: T - clip }, { x: 0, y: T - clip }, { x: 0, y: clip }, { x: clip, y: clip },
  ];
  const area = bs * T - 2 * clip * clip;
  return {
    id, kind: 'STIFFENER', category: 'plate', designation: `PL${ts}x${bs}x${roundWidth(T)} stiffener`,
    dims: {
      bs: rule(bs, 'SW-ST-1', 'Stiffener width'),
      ts: rule(ts, 'SW-ST-1', 'Stiffener thickness'),
      clip: rule(clip, 'SW-ST-2', 'Corner clip'),
      L: rule(T, 'SW-ST-3', 'Stiffener length (clear web depth)'),
      rho: rhoDim(),
    },
    length: rule(ts, 'SW-ST-1', 'Thickness (extrusion)'),
    material,
    weight: rule(area * ts * RHO, 'SW-ST-1', 'Weight', 'lb'),
    notes: ['Fit between flanges with corner clips clearing the rolled fillet (SW-ST-2).'],
    extra: { outline },
  };
}
