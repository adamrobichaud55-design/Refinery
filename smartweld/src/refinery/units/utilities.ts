/**
 * Unit 19, utilities: steam and boiler feed water, cooling water, air, nitrogen, caustic and fuel gas
 * (DESIGN_BASIS.md §74, SW-REF-10). Drawing data: SmartWeld's own demonstration scheme and capacities (PROVENANCE
 * P-79); a test checks that each capacity covers what the other units draw.
 */
import { UnitBuilder, type UnitSheet } from '../flowsheet';
import { liquid, vapour } from '../fluids';
import type { Balance } from '../balance';
import { stabiliserGas } from './treating';
import { crackerGas } from './cracking';

/**
 * Capacities, lb/h: cooling water circulated; steam from one boiler (the second stands by); boiler feed water sent to
 * the steam generators of the process units; condensate returned; low-pressure steam to the deaerator; compressed air;
 * nitrogen; purchased gas; service water; fire water tank make-up; caustic.
 */
export const UTILITY = { cw: 7_500_000, boiler: 100_000, bfwExport: 180_000, condensate: 95_000, deaeratorSteam: 35_000, air: 11_500, nitrogen: 2_200, purchasedGas: 8_500, serviceWater: 100_000, fireMakeUp: 250_000, caustic: 1_600 } as const;
/** fuel gas a boiler burns at its full output, lb/h: 1,160 Btu to raise a pound of steam from feed water, 85 % efficiency, 20,000 Btu a pound of gas (SW-PRC-10) */
export const boilerFuel = (UTILITY.boiler * 1160) / 0.85 / 20000;

export function unit19(B: Balance): UnitSheet {
  const u = new UnitBuilder(19, 'Utilities'), U = UTILITY, bfwAll = U.boiler + U.bfwExport, flash = 2000, makeUp = bfwAll - U.condensate - U.deaeratorSteam;
  const evaporation = 0.02 * U.cw, blowdown = 40000, towerMakeUp = evaporation + blowdown, raw = makeUp * 1.1 + towerMakeUp + U.serviceWater;
  u.item('T-1901', 'tank', 'Raw water tank', { bbl: 40000, roof: 'cone', fluid: 'RW' }); u.item('T-1902', 'tank', 'Demineralised water tank', { bbl: 20000, roof: 'cone', fluid: 'DM' });
  u.item('V-1904', 'deaerator', 'Deaerator'); u.item('D-1901', 'drum', 'Condensate flash drum', { holdMin: 10 }); u.item('D-1902', 'drum', 'Blowdown drum', { vertical: 1 });
  u.item('B-1901', 'boiler', 'Steam boiler 1', { lbh: U.boiler }); u.item('B-1902', 'boiler', 'Steam boiler 2', { lbh: U.boiler });
  u.item('K-1901', 'blower', 'Forced draught fan, boiler 1'); u.item('K-1902', 'blower', 'Forced draught fan, boiler 2');
  u.item('X-1903', 'coolingtower', 'Cooling tower, four cells', { cells: 4 });
  u.item('K-1903', 'compressor', 'Air compressor package', { count: 3 }); u.item('D-1903', 'drum', 'Wet air receiver', { vertical: 1, receiver: 1 }); u.item('D-1904', 'drum', 'Instrument air receiver', { vertical: 1, receiver: 1 });
  u.item('T-1903', 'tank', 'Liquid nitrogen tank', { vertical: 1, bbl: 400, fluid: 'NI' }); u.item('D-1905', 'drum', 'Fuel gas mixing drum', { vertical: 1 });
  u.item('T-1904', 'tank', 'Caustic tank', { bbl: 1500, roof: 'cone', fluid: 'CA' });

  // raw water: demineralised for boiler feed; service water; cooling tower and fire water tank make-up
  u.feed('raw water', liquid('RW', raw, 1, 50, 40)).into('T-1901', 'inlet', { kind: 'tank' });
  const rw = u.out('T-1901', 'outlet', liquid('RW', raw, 1, 50, 5)).pump('P-1901', 90, 'Raw water pump', { count: 3 }), service = rw.split(U.serviceWater), ctMake = rw.split(towerMakeUp), fire = rw.alt({ w: U.fireMakeUp });
  rw.thru('F-1901', 'filter', 'Pressure filters', { shells: 3, fluid: 'DM' }).thru('V-1901', 'vessel', 'Cation exchangers', { shells: 2 }).thru('V-1902', 'vessel', 'Anion exchangers', { shells: 2 })
    .thru('V-1903', 'vessel', 'Mixed bed polisher').set({ w: makeUp }).into('T-1902', 'inlet', { kind: 'tank', cv: true });
  service.toBL('service water'); ctMake.into('X-1903', 'make-up', { kind: 'coolingtower', cv: true }); fire.toBL('fire water make-up');
  u.out('T-1902', 'outlet', liquid('DM', makeUp, 1, 60, 3)).pump('P-1902', 70, 'Demineralised water pump').into('V-1904', 'make-up', { kind: 'deaerator', cv: true });
  // condensate, deaerator, boiler feed water
  u.feed('condensate', liquid('CO', U.condensate, 1, 230, 30)).into('D-1901', 'inlet', { cv: true });
  u.out('D-1901', 'vent', vapour('LS', flash, 18, 260, 20)).into('V-1904', 'flash steam', { kind: 'deaerator' });
  u.out('D-1901', 'liquid', liquid('CO', U.condensate - flash, 1, 230, 20)).pump('P-1903', 70, 'Condensate pump').into('V-1904', 'condensate', { kind: 'deaerator', cv: true });
  u.utility('LS', 'V-1904', 'steam', 'to', U.deaeratorSteam, 300, 50);
  const bfw = u.out('V-1904', 'outlet', liquid('BW', bfwAll, 1, 250, 15)).pump('P-1904', 800, 'Boiler feed water pump', { count: 3 }), b1 = bfw.split(U.boiler), b2 = b1.alt();
  bfw.toBL('boiler feed water');
  b1.into('B-1901', 'feed water', { kind: 'boiler', cv: true }); b2.into('B-1902', 'feed water', { kind: 'boiler', cv: true });
  // steam: one boiler on the 600 psi header with the other standing by; let down to 150 and 50 psi
  const hs = u.out('B-1901', 'steam', vapour('HS', U.boiler * 0.97, 18, 650, 620)), ms = hs.split(30000);
  hs.toBL('high-pressure steam');
  u.out('B-1902', 'steam', vapour('HS', U.boiler * 0.97, 18, 650, 620)).mixInto(hs, 'boiler 2 into the steam header', { standby: true });
  const msOut = ms.thru('X-1901', 'package', 'High to medium pressure let-down and desuperheater', { P: 160, T: 400, fluid: 'MS' }), ls = msOut.split(8000);
  msOut.toBL('medium-pressure steam');
  ls.thru('X-1902', 'package', 'Medium to low pressure let-down and desuperheater', { P: 55, T: 300, fluid: 'LS' }).toBL('low-pressure steam');
  const bd = u.out('B-1901', 'blowdown', liquid('BW', U.boiler * 0.03, 1, 490, 620)); bd.into('D-1902', 'inlet', { cv: true });
  u.out('B-1902', 'blowdown', liquid('BW', U.boiler * 0.03, 1, 490, 620)).mixInto(bd, 'boiler 2 blowdown into the blowdown line');
  u.out('D-1902', 'water', liquid('OW', 5000, 1, 212, 2)).pump('P-1908', 50, 'Blowdown pump').toBL('boiler blowdown', { cv: true });
  u.open('D-1902', 'vent', 'out', vapour('LS', 1000, 18, 212, 0));
  for (const k of ['K-1901', 'K-1902']) { u.open(k, 'intake', 'in', vapour('AIR', 110000, 29, 60, 0)); u.open(k, 'discharge to the windbox', 'out', vapour('AIR', 110000, 29, 80, 0.5)); }
  // cooling water: the pumps circulate the supply and a side stream through a filter
  u.feed('cooling water return', liquid('CWR', U.cw, 1, 105, 30)).into('X-1903', 'return', { kind: 'coolingtower' });
  const cw = u.out('X-1903', 'basin outlet', liquid('CWS', 1.03 * U.cw, 1, 85, 3)).pump('P-1905', 75, 'Cooling water circulation pump', { count: 4 }), side = cw.split(0.03 * U.cw);
  cw.toBL('cooling water supply');
  side.thru('F-1902', 'filter', 'Side-stream filter').into('X-1903', 'filtered return', { kind: 'coolingtower', cv: true });
  u.out('X-1903', 'blowdown', liquid('OW', blowdown, 1, 85, 3)).pump('P-1906', 50, 'Cooling tower blowdown pump').toBL('cooling tower blowdown', { cv: true });
  u.open('X-1903', 'evaporation', 'out', vapour('AIR', evaporation, 18, 95, 0));
  // air: compressed, received, part dried for instruments
  u.open('K-1903', 'intake', 'in', vapour('AIR', U.air, 29, 60, 0));
  u.out('K-1903', 'discharge', vapour('PA', U.air, 29, 110, 125)).into('D-1903', 'inlet');
  const pa = u.out('D-1903', 'outlet', vapour('PA', U.air, 29, 110, 120)), ia = pa.split(0.6 * U.air);
  pa.toBL('plant air');
  ia.thru('V-1905', 'vessel', 'Air dryer, twin towers', { shells: 2, fluid: 'IA' }).thru('F-1903', 'filter', 'Dryer afterfilter').into('D-1904', 'inlet');
  u.out('D-1904', 'outlet', vapour('IA', 0.6 * U.air, 29, 100, 105)).toBL('instrument air');
  // nitrogen, caustic
  u.out('T-1903', 'liquid', liquid('NI', U.nitrogen, 0.81, -310, 150)).thru('X-1904', 'package', 'Nitrogen vaporisers', { T: 50, ph: 'V', mw: 28 }).toBL('nitrogen');
  u.out('T-1904', 'outlet', liquid('CA', U.caustic, 1.2, 85, 3)).pump('P-1907', 270, 'Caustic pump').toBL('caustic');
  // fuel gas: the plant's own gases mixed with purchased gas; one boiler fired, the other standing by
  const own = [crackerGas(B).fuelGas, B.h2.surplus, stabiliserGas(B)], all = own.reduce((a, b) => a + b, 0) + U.purchasedGas;
  u.feed('fuel gas', vapour('FG', own[0], 20, 115, 170)).set({ P: 70 }).into('D-1905', 'inlet', { cv: true });
  u.feed('surplus hydrogen', vapour('HY', own[1], 2.02, 110, 60)).into('D-1905', 'inlet 2', { cv: true });
  u.feed('stabiliser gas', vapour('FG', own[2], 24, 110, 200)).set({ P: 70 }).into('D-1905', 'inlet 3', { cv: true });
  u.feed('purchased gas', vapour('FG', U.purchasedGas, 17, 60, 100)).set({ P: 70 }).into('D-1905', 'inlet 4', { cv: true });
  const fg = u.out('D-1905', 'outlet', vapour('FG', all, 16, 100, 60)), fb1 = fg.split(boilerFuel), fb2 = fb1.alt();
  fg.toBL('fuel gas to users'); fb1.into('B-1901', 'fuel gas', { kind: 'boiler', cv: true }); fb2.into('B-1902', 'fuel gas', { kind: 'boiler', cv: true });
  u.out('D-1905', 'liquid', liquid('OW', 50, 0.7, 100, 60)).toBL('slop oil', { cv: true });
  return u.done();
}
