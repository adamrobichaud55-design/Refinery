/**
 * Plant 3: a vacuum ejector set, stage by stage (DESIGN_BASIS.md §75, SW-PRC-18). SmartWeld's own relations and round
 * figures, from general process-engineering understanding (PROVENANCE P-87): no table of steam properties is used.
 */
import { K } from '../core/constants';
import { ATM, type State } from './fluids';

/** SW-PRC-18's figures: latent heat of water, Btu/lb; gas constant, Btu/lbmol·°R; the first condenser condenses this far above the water's return; a vent leaves this far above the water's supply; a stage's ratio at most; a tail pipe's margin, in */
export const EJ = { latent: 1000, R: 1.986, approach: 15, vent: 10, cwIn: 85, cwOut: 105, maxRatio: 5, margin: 60 } as const;
const B = (EJ.latent * 18) / EJ.R, T_BOIL = 212 + 459.67;
/** water's vapour pressure at T °F, psia */
export const vapourPressure = (T: number) => ATM * Math.exp(-B * (1 / (T + 459.67) - 1 / T_BOIL));
/** the temperature at which steam condenses at p psia, °F */
export const condensingT = (p: number) => 1 / (1 / T_BOIL - Math.log(p / ATM) / B) - 459.67;

export interface EjectorInput { /** the column's overhead */ load: State; /** of it, the gas that does not condense (lb/h, molecular weight) and the oil, lb/h */ gas: number; gasMw: number; oil: number; /** motive steam in all, lb/h, and the temperature it arrives at, °F */ steam: number; steamT: number; /** the hotwell's pressure, psig */ Pout: number }
export interface EjectorStage {
  /** suction and discharge pressure, psia */ Ps: number; Pd: number; ratio: number;
  /** load: lb/h, lbmol/h, and its temperature, °F */ load: number; moles: number; Ts: number; /** motive steam, lb/h */ steam: number; /** the mixture leaving the ejector: temperature, °F, and lbmol/h */ Td: number; outMoles: number;
  /** its condenser: condensing temperature, °F; water and oil condensed, lb/h; duty, Btu/h; cooling water, lb/h */ Tc: number; water: number; oil: number; duty: number; cw: number;
  /** what the condenser does not condense, to the next stage: lb/h, lbmol/h, °F */ vent: number; ventMoles: number; Tv: number;
}
/** SW-PRC-18: the stages of a set that holds the overhead's pressure against the hotwell's */
export function ejectorStages(inp: EjectorInput): EjectorStage[] {
  const P0 = inp.load.P + ATM, Pend = inp.Pout + ATM, p1 = vapourPressure(EJ.cwOut + EJ.approach);
  if (p1 / P0 > EJ.maxRatio + 1e-9) throw new Error(`SW-PRC-18: a first stage of ratio ${(p1 / P0).toFixed(1)}; a stage with no condenser after it is not built`);
  if (p1 >= Pend) throw new Error('SW-PRC-18: a set of one stage is not built');
  let more = 1; while ((Pend / p1) ** (1 / more) > EJ.maxRatio + 1e-9) more++;
  const r = (Pend / p1) ** (1 / more), P = [P0, p1, ...Array.from({ length: more }, (_, k) => p1 * r ** (k + 1))], n = more + 1;
  const nGas = inp.gas / inp.gasMw, Tv = EJ.cwIn + EJ.vent, pw = vapourPressure(Tv);
  // loads: the overhead, then each condenser's vent
  const loads = [{ w: inp.load.w, moles: inp.load.w / inp.load.mw, T: inp.load.T }];
  for (let k = 1; k < n; k++) { if (P[k] <= pw) throw new Error(`SW-PRC-18: at ${P[k].toFixed(2)} psia the water cannot condense the steam`); const mv = (nGas * pw) / (P[k] - pw); loads.push({ w: inp.gas + 18 * mv, moles: nGas + mv, T: Tv }); }
  const work = loads.map((l, k) => l.moles * (l.T + 459.67) * Math.log(P[k + 1] / P[k])), all = work.reduce((a, b) => a + b, 0);
  return loads.map((l, k) => {
    const steam = (inp.steam * work[k]) / all, last = k === n - 1, vent = last ? inp.gas : loads[k + 1].w, ventMoles = last ? nGas : loads[k + 1].moles, oil = k === 0 ? inp.oil : 0;
    const water = l.w + steam - vent - oil, duty = water * EJ.latent;
    return { Ps: P[k], Pd: P[k + 1], ratio: P[k + 1] / P[k], load: l.w, moles: l.moles, Ts: l.T, steam, Td: (l.w * l.T + steam * inp.steamT) / (l.w + steam), outMoles: l.moles + steam / 18,
      Tc: condensingT(P[k + 1]), water, oil, duty, cw: duty / (EJ.cwOut - EJ.cwIn), vent, ventMoles, Tv };
  });
}
/** SW-PRC-18: how far a condenser's drain stands above the hotwell's liquid at least, in: the leg that balances the hotwell's pressure, and the margin; nothing where the condenser is at the higher pressure */
export const tailPipeHeight = (condenserPsia: number, hotwellPsig: number) => (condenserPsia >= hotwellPsig + ATM ? 0 : (((hotwellPsig + ATM - condenserPsia) * 144) / K.WATER_DENSITY_LB_FT3) * 12 + EJ.margin);
