/**
 * Unit 18, the sulfur block: amine regeneration, sour water stripping and sulfur recovery (DESIGN_BASIS.md §74,
 * SW-REF-10). Drawing data: SmartWeld's own demonstration scheme and conditions (PROVENANCE P-79).
 */
import { UnitBuilder, type UnitSheet } from '../flowsheet';
import { liquid, vapour } from '../fluids';
import type { Balance } from '../balance';

/** sour water sent to unit 18 by each unit, lb/h (the steam each condenses, and its wash water) */
export const SOUR_WATER = { 11: 14000, 12: 20000, 13: 2000, 15: 3500, 16: 12000, 17: 30000 } as const;
/** stripped water returned as wash water, lb/h: to the desalter of unit 11 and the effluent wash of units 13, 15 and 16 */
export const STRIPPED_TO = { 11: 43800, 13: 2000, 15: 1000, 16: 6000 } as const;

export function unit18(B: Balance): UnitSheet {
  const u = new UnitBuilder(18, 'Sulfur block'), S = B.sulfur, H2S = 34.08 / 32.06;
  const h2sAmine = (S.toSru - S.sws) * H2S, lean = 120000, slipW = 0.1 * lean, rich = lean + h2sAmine + 300, acidGas = h2sAmine + 180, swsGas = 600;
  const sourWater = Object.values(SOUR_WATER).reduce((a, b) => a + b, 0), stripped = sourWater - swsGas, air = 9500, processGas = acidGas + swsGas + air, product = S.recovered;
  u.item('D-1801', 'drum', 'Rich amine flash drum', { holdMin: 10 }); u.item('D-1802', 'drum', 'Regenerator reflux drum');
  u.item('C-1801', 'column', 'Amine regenerator', { trays: 22, vapW: acidGas + 12000, vapMw: 22, vapT: 225, vapP: 12, liqSg: 1.0, skirt: 180 });
  u.item('T-1801', 'tank', 'Amine storage tank', { bbl: 3000, roof: 'cone' });
  u.item('D-1803', 'drum', 'Acid gas knock-out drum', { vertical: 1 }); u.item('D-1804', 'drum', 'Sour water degassing drum', { holdMin: 10 }); u.item('D-1805', 'drum', 'Stripper gas knock-out drum', { vertical: 1 });
  u.item('T-1802', 'tank', 'Sour water tank', { bbl: 15000, roof: 'cone' });
  u.item('C-1802', 'column', 'Sour water stripper', { trays: 30, vapW: 16000, vapMw: 19, vapT: 230, vapP: 22, liqSg: 1.0, skirt: 180 });
  u.item('H-1801', 'furnace', 'Reaction furnace with waste heat boiler'); u.item('H-1802', 'incinerator', 'Tail gas incinerator and stack');
  u.item('X-1801', 'pit', 'Sulfur pit with pumps'); u.item('X-1802', 'loading', 'Sulfur truck loading station');
  u.item('K-1801', 'blower', 'Combustion air blower', { spare: 1 });

  // amine regeneration
  u.feed('rich amine', liquid('AM', rich, 1.04, 135, 70)).into('D-1801', 'inlet', { cv: true });
  u.out('D-1801', 'gas', vapour('HG', 300, 24, 135, 10)).into('H-1802', 'amine flash gas', { kind: 'incinerator', cv: true });
  u.out('D-1801', 'liquid', liquid('AM', rich - 300 + slipW, 1.04, 135, 10)).pump('P-1801', 90, 'Rich amine pump')
    .hx('E-1801', 'tube', 210, 'Lean / rich amine exchanger').into('C-1801', 'feed', { kind: 'column', cv: true });
  u.out('C-1801', 'overhead', vapour('AG', acidGas + 8000, 24, 225, 12)).air('A-1801', 120, 'Regenerator overhead condenser', { ph: 'M', vf: 0.36, dP: 3 }).into('D-1802', 'inlet');
  u.out('D-1802', 'reflux', liquid('SW', 8000, 1, 120, 9)).pump('P-1802', 60, 'Regenerator reflux pump').into('C-1801', 'reflux', { kind: 'column', cv: true });
  u.out('D-1802', 'acid gas', vapour('AG', acidGas, 34, 120, 9)).into('D-1803', 'inlet', { cv: true });
  u.out('C-1801', 'reboiler draw', liquid('AM', 200000, 1.03, 250, 14)).hx('E-1802', 'shell', 255, 'Regenerator reboiler', { util: 'LS', ph: 'M', vf: 0.08, mw: 18, dP: 1 }).into('C-1801', 'reboiler return', { kind: 'column' });
  const la = u.out('C-1801', 'bottoms', liquid('AM', lean + slipW, 1.03, 255, 14)).pump('P-1803', 330, 'Lean amine pump').hxMatch('E-1801', 'shell')
    .air('A-1802', 130, 'Lean amine air cooler').hx('E-1803', 'shell', 120, 'Lean amine trim cooler', { util: 'CW' }), slip = la.split(slipW);
  la.toBL('lean amine', { cv: true });
  slip.thru('F-1801', 'filter', 'Lean amine filter').set({ P: 60 }).into('T-1801', 'inlet', { kind: 'tank', cv: true });
  u.out('T-1801', 'outlet', liquid('AM', slipW, 1.03, 115, 2)).pump('P-1804', 30, 'Amine make-up pump').into('D-1801', 'make-up', { cv: true });

  // sour water stripping
  u.feed('sour water', liquid('SW', sourWater, 1, 105, 60)).into('D-1804', 'inlet', { cv: true });
  u.out('D-1804', 'gas', vapour('AG', 50, 30, 105, 8)).into('H-1802', 'degassing drum gas', { kind: 'incinerator', cv: true });
  u.out('D-1804', 'oil', liquid('OW', 2500, 0.85, 105, 8)).pump('P-1808', 70, 'Skimmed oil pump').toBL('slop oil', { cv: true });
  u.out('D-1804', 'water', liquid('SW', sourWater, 1, 105, 8)).pump('P-1809', 40, 'Sour water transfer pump').into('T-1802', 'inlet', { kind: 'tank', cv: true });
  u.out('T-1802', 'outlet', liquid('SW', sourWater, 1, 100, 3)).pump('P-1805', 90, 'Stripper feed pump')
    .hx('E-1804', 'tube', 200, 'Stripper feed / bottoms exchanger').into('C-1802', 'feed', { kind: 'column', cv: true });
  u.out('C-1802', 'pumparound draw', liquid('SW', 150000, 1, 190, 22)).pump('P-1806', 70, 'Stripper pumparound pump')
    .air('A-1803', 150, 'Stripper pumparound cooler').into('C-1802', 'pumparound return', { kind: 'column', cv: true });
  u.out('C-1802', 'overhead', vapour('AG', swsGas, 25, 180, 20)).into('D-1805', 'inlet', { cv: true });
  u.out('C-1802', 'reboiler draw', liquid('SW', 180000, 1, 258, 26)).hx('E-1805', 'shell', 262, 'Stripper reboiler', { util: 'LS', ph: 'M', vf: 0.08, mw: 18, dP: 1 }).into('C-1802', 'reboiler return', { kind: 'column' });
  const sw = u.out('C-1802', 'bottoms', liquid('PW', stripped, 1, 262, 26)).pump('P-1807', 130, 'Stripped water pump').hxMatch('E-1804', 'shell')
    .air('A-1804', 120, 'Stripped water cooler'), toWaste = sw.split(stripped - Object.values(STRIPPED_TO).reduce((a, b) => a + b, 0));
  sw.toBL('stripped water', { cv: true }); toWaste.toBL('stripped water to wastewater', { cv: true });

  // sulfur recovery: reaction furnace and waste heat boiler, two catalytic stages, incinerator
  u.out('D-1803', 'gas', vapour('AG', acidGas, 34, 120, 8)).into('H-1801', 'acid gas', { kind: 'furnace', cv: true });
  u.out('D-1805', 'gas', vapour('AG', swsGas, 25, 180, 18)).into('H-1801', 'stripper gas', { kind: 'furnace', cv: true });
  u.out('D-1803', 'liquid', liquid('SW', 5000, 1, 120, 8)).pump('P-1810', 60, 'Acid gas drum water pump').into('D-1804', 'inlet 2');
  u.out('D-1805', 'liquid', liquid('SW', 100, 1, 180, 18)).into('D-1804', 'inlet 3', { cv: true });
  u.open('K-1801', 'intake', 'in', vapour('AIR', air, 29, 60, 0));
  u.out('K-1801', 'discharge', vapour('AIR', air, 29, 180, 12)).into('H-1801', 'combustion air', { kind: 'furnace', cv: true });
  u.utility('BW', 'H-1801', 'feed water in', 'to', 9000, 250, 700); u.utility('HS', 'H-1801', 'steam out', 'from', 9000, 489, 600);
  const cond = (tag: string, n: string, frac: number) => { u.utility('BW', tag, 'feed water in', 'to', 1500, 250, 150); u.utility('LS', tag, 'steam out', 'from', 1500, 298, 50);
    u.out(tag, 'sulfur out', liquid('SU', frac * product, 1.8, 290, 5)).into('X-1801', `sulfur in ${n}`, { kind: 'pit', slow: true }); };
  const g = u.out('H-1801', 'process gas', vapour('AG', processGas, 30, 600, 7))
    .thru('E-1806', 'condenser', 'First sulfur condenser', { T: 340, dP: 0.5 });
  cond('E-1806', '1', 0.6);
  g.set({ w: processGas - 0.6 * product }).hx('E-1807', 'tube', 450, 'First reheater', { util: 'HS', dP: 0.3 }).thru('R-1801', 'reactor', 'First converter', { T: 580, dP: 0.5 })
    .thru('E-1808', 'condenser', 'Second sulfur condenser', { T: 330, dP: 0.5 });
  cond('E-1808', '2', 0.28);
  g.set({ w: processGas - 0.88 * product }).hx('E-1809', 'tube', 420, 'Second reheater', { util: 'HS', dP: 0.3 }).thru('R-1802', 'reactor', 'Second converter', { T: 445, dP: 0.5 })
    .thru('E-1810', 'condenser', 'Final sulfur condenser', { T: 270, dP: 0.5 });
  cond('E-1810', '3', 0.12);
  g.set({ w: processGas - product }).into('H-1802', 'tail gas', { kind: 'incinerator' });
  u.open('H-1802', 'stack', 'out', vapour('FLG', processGas - product + 12000, 29, 1200, 0));
  u.utility('FG', 'H-1802', 'fuel gas', 'to', 400, 100, 50);
  u.utility('LS', 'X-1801', 'steam coil in', 'to', 1200, 300, 50); u.utility('CO', 'X-1801', 'steam coil out', 'from', 1200, 260, 40);
  u.out('X-1801', 'sulfur out', liquid('SU', product, 1.8, 285, 60)).into('X-1802', 'inlet', { kind: 'loading', cv: true });
  return u.done();
}
