import type { Dim } from '../core/basis';

export type PartKind =
  | 'W' | 'C' | 'L' | 'HSS_RECT' | 'HSS_ROUND'
  | 'PL' | 'GUSSET' | 'BASE_PLATE' | 'STIFFENER'
  | 'BOLT' | 'ANCHOR_ROD' | 'FILLET_WELD' | 'GROOVE_WELD'
  | 'Z' | 'CS' | 'ROD' | 'PANEL' | 'TRIM' | 'CONCRETE' | 'DOOR_LEAF' | 'DOOR_CURTAIN' | 'DOOR_DRUM' | 'FILLET_WELD_AROUND'
  | 'GRATING' | 'GRATING_TREAD' | 'CAGE_HOOP' | 'VESSEL_V' | 'VESSEL_H' | 'EXCHANGER' | 'PUMP' | 'TANK'
  | 'PIPE' | 'FLANGE' | 'BLIND' | 'GASKET' | 'STUD' | 'VALVE'
  | 'ELBOW' | 'TEE' | 'REDUCER' | 'CAP' | 'BUTT_WELD' | 'SUPPORT' | 'FITTING' | 'HOPPER'
  // civil and concrete catalogue (§65)
  | 'FOOTING' | 'PEDESTAL' | 'PAD' | 'SLAB' | 'OCTAGON' | 'RINGWALL' | 'PIER' | 'GRADE_BEAM' | 'GROUT' | 'CURB' | 'PAVING' | 'TRENCH' | 'SUMP' | 'DIKE'
  // equipment catalogue (§66)
  | 'MOTOR' | 'NOZZLE' | 'MANWAY' | 'LIFTING_LUG' | 'VESSEL_LEGS' | 'SUPPORT_LUGS' | 'INSUL_RINGS' | 'DAVIT' | 'COLUMN' | 'REACTOR' | 'AIR_COOLER' | 'COMPRESSOR'
  | 'BLOWER' | 'HEATER' | 'AGITATED_TANK' | 'FILTER' | 'DUST_COLLECTOR' | 'CYCLONE' | 'SCREW_CONVEYOR' | 'BUCKET_ELEVATOR' | 'SILO' | 'SUMP_PUMP' | 'HAIRPIN' | 'PLATE_EXCHANGER'
  // process units, boiler equipment and storage tanks (§69)
  | 'TUBE_BUNDLE' | 'PROCESS_UNIT' | 'FLARE' | 'SCRUBBER' | 'BOILER' | 'DRUM' | 'STACK' | 'ECONOMIZER' | 'BURNER';

export type Category = 'section' | 'plate' | 'hardware' | 'weld' | 'sheet' | 'non-steel' | 'equipment' | 'piping' | 'valve' | 'civil';

export interface Material {
  grade: string;
  Fy: Dim; // ksi, basis drawing (SW-MAT-1)
}

/**
 * Plain-data description of one part. JSON-serialisable; no renderer types.
 * `dims` holds every dimension with its basis. `extra` holds non-dimensional
 * data a geometry builder needs (e.g. a gusset outline).
 */
export interface PartSpec {
  id: string;
  kind: PartKind;
  category: Category;
  /** drawing text, e.g. "W12x26" */
  designation: string;
  dims: Record<string, Dim>;
  /** member length / weld length / plate thickness direction length, inches */
  length?: Dim;
  material: Material;
  /** total weight in lb */
  weight: Dim;
  notes: string[];
  extra?: Record<string, unknown>;
}

export const DEFAULT_MATERIAL: Material = {
  grade: 'Grade 36',
  Fy: { value: 36, unit: 'ksi', basis: { kind: 'drawing' }, label: 'Minimum yield strength (grade stated on drawing)' },
};

/** forged small-bore fittings and valve bodies (SW-SWT-1): the forging grade of SW-FLG */
export const FORGING_GRADE_SB: Material = { grade: 'Grade 36 forging', Fy: { value: 36, unit: 'ksi', basis: { kind: 'drawing' }, label: 'Minimum yield strength (grade stated on drawing)' } };

export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Positive root of a x^2 + b x + c = 0 (a>0, c<0) — the only positive root. */
export function positiveRoot(a: number, b: number, c: number): number {
  const disc = b * b - 4 * a * c;
  if (disc < 0) throw new Error('no real root');
  return (-b + Math.sqrt(disc)) / (2 * a);
}
/** Smaller positive root of a x^2 + b x + c = 0 (a>0, b<0, c>0). */
export function smallerRoot(a: number, b: number, c: number): number {
  const disc = b * b - 4 * a * c;
  if (disc < 0) throw new Error('no real root: section cannot be proportioned by rule');
  return (-b - Math.sqrt(disc)) / (2 * a);
}
