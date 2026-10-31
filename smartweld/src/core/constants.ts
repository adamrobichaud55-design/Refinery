/** Physical constants, DESIGN_BASIS.md section 1. */
export const K = {
  /** K-1 density of carbon steel, lb/ft3 */
  STEEL_DENSITY_LB_FT3: 490,
  /** K-1 density of carbon steel, lb/in3 */
  STEEL_DENSITY_LB_IN3: 490 / 1728,
  /** K-2 elastic modulus of steel, ksi */
  STEEL_E_KSI: 29000,
  /** K-3 Poisson's ratio */
  STEEL_NU: 0.3,
  /** K-4 gravity, ft/s2 */
  G_FT_S2: 32.174,
  /** K-5 water density lb/ft3 */
  WATER_DENSITY_LB_FT3: 62.4,
} as const;

/** SW-W-1 / SW-C-1: cross-section area (in2) from weight per foot (lb/ft). */
export function areaFromWeightPerFoot(lbPerFt: number): number {
  return (lbPerFt * 144) / K.STEEL_DENSITY_LB_FT3;
}
/** Inverse: weight per foot from area. */
export function weightPerFootFromArea(areaIn2: number): number {
  return (areaIn2 * K.STEEL_DENSITY_LB_FT3) / 144;
}
