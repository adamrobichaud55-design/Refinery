/**
 * Plant 3 fluids (DESIGN_BASIS.md §75, SW-PRC-1): every stream is one of these. Drawing data: SmartWeld's own list
 * and round demonstration properties, from general process-engineering understanding (PROVENANCE P-79).
 * `svc` is the line-list service of SW-LL-1 that the piping generator builds the line as; `group` is its SW-LC-1
 * fluid group. The code layer's fluid service (§76) follows from `hazard` and the design conditions.
 */
import { K } from '../core/constants';

export type Hazard = 'flammable' | 'toxic' | 'harmful' | 'benign';
export type Phase = 'L' | 'V' | 'M';
/** the SW-LL-1 services the generator knows */
export type GenService = 'P' | 'CWS' | 'CWR' | 'LS' | 'SC' | 'IA' | 'PA' | 'N' | 'W' | 'FL';
export interface Fluid { code: string; name: string; hazard: Hazard; svc: GenService; /** specific heat, Btu/lb·°F: liquid, vapour */ cpL: number; cpV: number; /** latent heat, Btu/lb */ latent: number; /** specific gravity of its liquid and molecular weight of its vapour, where a stream changes phase and states neither */ sg0: number; mw0: number; /** runs hot enough, or is viscous enough, to be insulated */ black?: boolean }

const f = (code: string, name: string, hazard: Hazard, svc: GenService, cpL: number, cpV: number, latent: number, sg0: number, mw0: number, black = false): Fluid => ({ code, name, hazard, svc, cpL, cpV, latent, sg0, mw0, ...(black ? { black } : {}) });
export const FLUIDS: Record<string, Fluid> = Object.fromEntries([
  f('CR', 'crude oil', 'flammable', 'P', 0.52, 0.60, 110, 0.87, 150),
  f('NA', 'naphtha', 'flammable', 'P', 0.54, 0.50, 130, 0.72, 95),
  f('GS', 'gasoline', 'flammable', 'P', 0.53, 0.50, 130, 0.74, 100),
  f('RF', 'reformate', 'flammable', 'P', 0.50, 0.48, 130, 0.79, 105),
  f('KE', 'kerosene', 'flammable', 'P', 0.56, 0.55, 110, 0.8, 160),
  f('DI', 'diesel', 'flammable', 'P', 0.58, 0.58, 105, 0.85, 210),
  f('GO', 'gas oil', 'flammable', 'P', 0.62, 0.62, 95, 0.9, 300, true),
  f('RS', 'residue', 'flammable', 'P', 0.65, 0.65, 90, 1.0, 450, true),
  f('SL', 'slurry oil', 'flammable', 'P', 0.60, 0.62, 90, 1.05, 350, true),
  f('LP', 'liquefied petroleum gas', 'flammable', 'P', 0.62, 0.45, 150, 0.54, 50),
  f('HG', 'hydrocarbon gas', 'flammable', 'P', 0.60, 0.52, 150, 0.62, 40),
  f('FG', 'fuel gas', 'flammable', 'P', 0.60, 0.55, 150, 0.6, 20),
  f('HY', 'hydrogen-rich gas', 'flammable', 'P', 0.60, 1.60, 150, 0.65, 5),
  f('RX', 'reactor effluent (oil and hydrogen)', 'flammable', 'P', 0.60, 0.75, 120, 0.75, 30),
  f('AG', 'acid gas', 'toxic', 'P', 0.50, 0.25, 200, 1.0, 34),
  f('AM', 'amine solution', 'harmful', 'P', 0.92, 0.45, 900, 1.03, 18),
  f('SW', 'sour water', 'harmful', 'P', 1.00, 0.45, 950, 1.0, 18),
  f('CA', 'caustic solution', 'harmful', 'P', 0.90, 0.45, 950, 1.2, 18),
  f('SU', 'liquid sulfur', 'harmful', 'P', 0.24, 0.20, 120, 1.8, 64, true),
  f('FLG', 'flue gas', 'harmful', 'P', 0.26, 0.27, 0, 1.0, 30),
  f('AIR', 'process air', 'benign', 'PA', 0.24, 0.24, 0, 1.0, 29),
  f('FL', 'flare gas', 'flammable', 'FL', 0.60, 0.50, 150, 0.7, 44),
  f('HS', 'steam, 600 psi', 'harmful', 'LS', 1.0, 0.55, 730, 1.0, 18),
  f('MS', 'steam, 150 psi', 'harmful', 'LS', 1.0, 0.50, 860, 1.0, 18),
  f('LS', 'steam, 50 psi', 'harmful', 'LS', 1.0, 0.48, 910, 1.0, 18),
  f('CO', 'steam condensate', 'harmful', 'SC', 1.0, 0.48, 910, 1.0, 18),
  f('BW', 'boiler feed water', 'harmful', 'SC', 1.0, 0.48, 900, 1.0, 18),
  f('CWS', 'cooling water supply', 'benign', 'CWS', 1.0, 0.45, 1000, 1.0, 18),
  f('CWR', 'cooling water return', 'benign', 'CWR', 1.0, 0.45, 1000, 1.0, 18),
  f('PW', 'process and wash water', 'benign', 'W', 1.0, 0.45, 1000, 1.0, 18),
  f('RW', 'raw and service water', 'benign', 'W', 1.0, 0.45, 1000, 1.0, 18),
  f('FW', 'fire water', 'benign', 'W', 1.0, 0.45, 1000, 1.0, 18),
  f('DM', 'demineralised water', 'benign', 'W', 1.0, 0.45, 1000, 1.0, 18),
  f('OW', 'oily water', 'flammable', 'P', 1.0, 0.45, 1000, 1.0, 18),
  f('IA', 'instrument air', 'benign', 'IA', 0.24, 0.24, 0, 1.0, 29),
  f('PA', 'plant air', 'benign', 'PA', 0.24, 0.24, 0, 1.0, 29),
  f('NI', 'nitrogen', 'benign', 'N', 0.25, 0.25, 0, 0.81, 28),
].map(x => [x.code, x]));

/** the condition of a stream at one point: mass flow, phase, density basis, temperature (°F) and gauge pressure (psi) */
export interface State { fluid: string; ph: Phase; w: number; sg: number; mw: number; T: number; P: number; /** vapour mass fraction of a mixed phase */ vf: number }
export const liquid = (fluid: string, w: number, sg: number, T: number, P: number): State => ({ fluid, ph: 'L', w, sg, mw: 0, T, P, vf: 0 });
export const vapour = (fluid: string, w: number, mw: number, T: number, P: number): State => ({ fluid, ph: 'V', w, sg: 0, mw, T, P, vf: 1 });
export const mixed = (fluid: string, w: number, sg: number, mw: number, vf: number, T: number, P: number): State => ({ fluid, ph: 'M', w, sg, mw, T, P, vf });

export const ATM = 14.696, RGAS = 10.732, BBL_FT3 = 9702 / 1728;                   // K-10, K-9, K-8
/** lb/h of a liquid of specific gravity sg flowing at one barrel a day */
export const LBH_PER_BPD = (K.WATER_DENSITY_LB_FT3 * BBL_FT3) / 24;
export const lbh = (bpd: number, sg: number) => bpd * sg * LBH_PER_BPD;
export const bpd = (w: number, sg: number) => w / (sg * LBH_PER_BPD);
/** liquid density at temperature, lb/ft³: oils swell about 0.05 % per °F above 60 °F, water much less (SW-PRC-1) */
export function rhoL(sg: number, T: number): number { const beta = sg > 0.97 && sg < 1.03 ? 0.0002 : 0.0005; return K.WATER_DENSITY_LB_FT3 * sg * Math.max(0.6, 1 - beta * (T - 60)); }
/** gas density from the ideal gas law (K-9), lb/ft³ */
export const rhoV = (mw: number, T: number, P: number) => ((P + ATM) * mw) / (RGAS * (T + 459.67));
/** flowing density, lb/ft³ */
export function rho(s: State): number {
  if (s.ph === 'L') return rhoL(s.sg, s.T);
  if (s.ph === 'V') return rhoV(s.mw, s.T, s.P);
  return 1 / (s.vf / rhoV(s.mw, s.T, s.P) + (1 - s.vf) / rhoL(s.sg, s.T));
}
/** flowing volume, ft³/s; liquid flow in US gallons a minute */
export const cfs = (s: State) => s.w / rho(s) / 3600;
export const gpm = (s: State) => (s.w / rhoL(s.sg || 1, s.T) / 60) * (1728 / 231);
/** standard volume of a gas, millions of ft³ a day (K-9) */
export const mmscfd = (w: number, mw: number) => ((w / mw) * 379.5 * 24) / 1e6;
