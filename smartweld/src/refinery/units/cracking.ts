/**
 * Unit 17, fluid catalytic cracker with gas concentration (DESIGN_BASIS.md §74, SW-REF-10). Drawing data: SmartWeld's
 * own demonstration scheme and conditions (PROVENANCE P-79).
 */
import { UnitBuilder, type UnitSheet } from '../flowsheet';
import { liquid, vapour } from '../fluids';
import type { Balance } from '../balance';
import { stripperGas } from './treating';

const H2S = 34.08 / 32.06;
/** the gases that reach unit 17 from other units, and the fuel gas it sends on, lb/h */
export function crackerGas(B: Balance) {
  const g = stripperGas(B), overhead = B.cut.LE.w * 0.2, stripper = g[13] + g[15] + g[16], lightEndsLpg = B.cut.LE.w * 0.8;
  const h2s = (B.sulfur.fcc + B.sulfur.nht + B.sulfur.kht) * H2S;
  return { overhead, stripper, gasIn: overhead + stripper, lightEndsLpg, h2s, fuelGas: B.fcc.dryGas + overhead + stripper - lightEndsLpg - h2s };
}

export function unit17(B: Balance): UnitSheet {
  const u = new UnitBuilder(17, 'Fluid catalytic cracker and gas concentration'), c = B.cut, X = B.fcc, feedW = X.feed.w, G = crackerGas(B);
  const air = 13 * X.coke, flue = air + X.coke, rxSteam = 12000, colSteam = 15000, refluxW = 0.6 * X.gasoline.w;
  const gasIn = G.gasIn;                                                                               // from units 11, 13, 15 and 16
  const lightEndsLpg = G.lightEndsLpg, lpgFcc = X.c3.w + X.c4.w + lightEndsLpg, lpgRef = B.reformer.c3 + B.reformer.c4, c3 = B.products.c3.w, c4 = lpgFcc + lpgRef - c3;
  const wetGas = X.dryGas + X.c3.w + X.c4.w + 0.15 * X.gasoline.w + gasIn, unstab = 0.85 * X.gasoline.w, leanGasoline = 40000, sponge = 30000;
  const h2sHere = G.h2s, fuelGas = G.fuelGas, amineFg = 60000, amineLpg = 20000;
  const slurryPa = 500000, hcoPa = 300000, lcoPa = 250000, debFeed = X.gasoline.w + lpgFcc + leanGasoline, strOvhd = 25000;

  // the order the items are declared in is the order they stand in along their rows (SW-CELL-3). Next the rack, from the battery limit: the feed drum; the
  // main fractionator's drums, its side stripper and the fractionator itself, under the air coolers and beside the compressors that serve them; the reactor and
  // regenerator, the reactor toward the fractionator; the flue gas cooler and the scrubber with its stack. Behind them, in a row of its own, the gas plant in
  // the order the gas and the gasoline go through it, and the catalyst hoppers. The blower stands across the rack from the regenerator.
  u.item('D-1701', 'drum', 'Fresh feed surge drum', { holdMin: 15 });
  u.item('D-1703', 'drum', 'Compressor interstage drum', { boot: 1 }); u.item('D-1702', 'drum', 'Main column overhead receiver', { boot: 1 });
  u.item('C-1702', 'column', 'Light cycle oil stripper', { trays: 6, vapW: 0.15 * X.lco.w + 2000, vapMw: 60, vapT: 440, vapP: 24, liqSg: 0.85, skirt: 240 });
  u.item('C-1701', 'column', 'Main fractionator', { trays: 32, vapW: X.gasoline.w + lpgFcc + X.dryGas + refluxW + colSteam, vapMw: 60, vapT: 270, vapP: 15, liqSg: 0.72, skirt: 240 });
  u.item('R-1701', 'cracker', 'Reactor and regenerator', { cokeLbh: X.coke });
  u.item('E-1703', 'fluegascooler', 'Flue gas cooler (steam generator)');
  u.item('C-1705', 'scrubber', 'Flue gas wet scrubber and stack');
  u.item('V-1701', 'hopper', 'Fresh catalyst hopper'); u.item('V-1702', 'hopper', 'Equilibrium catalyst hopper'); u.item('F-1701', 'filter', 'Slurry filter');   // after the scrubber, at the end of the cracker's own row: the rack before them (SW-CELL-3)
  u.item('K-1701', 'blower', 'Main air blower', { after: 'E-1716' });
  u.item('K-1702', 'compressor', 'Wet gas compressor, first stage, turbine driven', { drives: 'K-1703' }); u.item('K-1703', 'compressor', 'Wet gas compressor, second stage, on the first stage\'s shaft', { shaft: 'K-1702' });
  u.item('D-1704', 'drum', 'High-pressure separator', { boot: 1, row: 'new' });
  u.item('C-1703', 'column', 'Primary absorber', { trays: 30, vapW: 40000, vapMw: 32, vapT: 110, vapP: 195, liqSg: 0.72, skirt: 120 });
  u.item('C-1704', 'column', 'Sponge absorber', { trays: 20, vapW: 20000, vapMw: 24, vapT: 110, vapP: 190, liqSg: 0.9, skirt: 120 });
  u.item('C-1706', 'column', 'Fuel gas amine absorber', { trays: 20, vapW: fuelGas + h2sHere, vapMw: 21, vapT: 110, vapP: 180, liqSg: 1.03, skirt: 120 });
  // the rest of the gas plant stands across the rack, opposite the converter: behind the main fractionator or the reactor's structure it would have no way to the rack (SW-CELL-3)
  u.item('D-1706', 'drum', 'Fuel gas knock-out drum', { vertical: 1, across: 1 });
  u.item('C-1707', 'column', 'Stripper', { trays: 30, vapW: strOvhd, vapMw: 40, vapT: 150, vapP: 210, liqSg: 0.65, skirt: 180, across: 1 });
  u.item('C-1708', 'column', 'Debutaniser', { trays: 36, vapW: 3.5 * lpgFcc, vapMw: 52, vapT: 140, vapP: 150, liqSg: 0.55, skirt: 180, across: 1 });
  u.item('D-1705', 'drum', 'Debutaniser receiver', { across: 1 });
  u.item('C-1709', 'column', 'Liquefied gas amine contactor', { trays: 10, liquidOnly: 1, vapW: 0, vapMw: 50, vapT: 100, vapP: 240, liqSg: 0.55, skirt: 120, across: 1 });
  u.item('V-1703', 'vessel', 'Liquefied gas caustic wash drum', { across: 1 });
  u.item('C-1710', 'column', 'Depropaniser', { trays: 40, vapW: 4 * c3, vapMw: 43, vapT: 120, vapP: 215, liqSg: 0.5, skirt: 180, across: 1 });
  u.item('D-1707', 'drum', 'Depropaniser receiver', { across: 1 });
  u.item('V-1704', 'vessel', 'Gasoline caustic wash drum', { across: 1 });
  // the main column's overhead condenser bays last of the air coolers, next the fractionator; its overhead line is met direct: over the bays at their own level, not by way of the rack (SW-RPI-3)
  u.item('A-1701', 'aircooler', 'Main column overhead condenser', { after: 'A-1705', direct: 1, nearest: 1 });   // each of its lines to the bay nearest the line's other end
  // feed: surge drum, preheat against the main column's pumparounds, riser
  u.feed('atmospheric gas oil', liquid('GO', c.AGO.w, c.AGO.sg, 370, 100)).into('D-1701', 'inlet', { cv: true });
  u.feed('light vacuum gas oil', liquid('GO', c.LVGO.w, c.LVGO.sg, 150, 80)).into('D-1701', 'inlet 2', { cv: true });
  u.feed('heavy vacuum gas oil', liquid('GO', c.HVGO.w, c.HVGO.sg, 400, 100)).into('D-1701', 'inlet 3', { cv: true });
  u.out('D-1701', 'outlet', liquid('GO', feedW, X.feed.sg, 340, 30)).pump('P-1701', 250, 'Fresh feed pump')
    .hx('E-1701', 'tube', 400, 'Feed / light cycle oil pumparound exchanger').hx('E-1702', 'tube', 450, 'Feed / slurry exchanger')
    .into('R-1701', 'feed', { kind: 'cracker', cv: true });
  // regenerator air, catalyst, flue gas
  u.open('K-1701', 'intake', 'in', vapour('AIR', air, 29, 60, 0));
  u.out('K-1701', 'discharge', vapour('AIR', air, 29, 380, 40)).into('R-1701', 'regenerator air', { kind: 'cracker' });
  u.utility('IA', 'V-1701', 'conveying air', 'to', 800, 100, 90);
  u.out('V-1701', 'catalyst out', vapour('AIR', 2000, 29, 100, 45)).into('R-1701', 'fresh catalyst', { kind: 'cracker' });
  u.out('R-1701', 'catalyst withdrawal', vapour('AIR', 2000, 29, 600, 30)).into('V-1702', 'catalyst in', { kind: 'hopper' });
  u.out('R-1701', 'flue gas', vapour('FLG', flue, 30, 1300, 28)).set({ P: 4 }).thru('E-1703', 'fluegascooler', 'Flue gas cooler (steam generator)', { T: 550, dP: 1, util: 'SG-HS' })
    .into('C-1705', 'flue gas in', { kind: 'scrubber' });
  u.open('C-1705', 'stack', 'out', vapour('FLG', flue, 29, 150, 0));
  u.utility('RW', 'C-1705', 'make-up water', 'to', 40000, 60, 80); u.utility('CA', 'C-1705', 'caustic', 'to', 800, 85, 60);
  u.utility('MS', 'R-1701', 'riser and stripping steam', 'to', rxSteam, 400, 150);
  // main fractionator
  u.out('R-1701', 'reactor vapour', vapour('HG', feedW - X.coke + rxSteam, 75, 980, 28)).into('C-1701', 'feed', { kind: 'column' });
  const sl = u.out('C-1701', 'bottoms', liquid('SL', X.slurry.w + slurryPa, X.slurry.sg, 680, 28)).pump('P-1702', 150, 'Slurry pump')
    .hxMatch('E-1702', 'shell').hx('E-1704', 'shell', 480, 'Slurry steam generator', { util: 'SG-MS' }), slOut = sl.split(X.slurry.w);
  sl.into('C-1701', 'slurry return', { kind: 'column', cv: true });
  slOut.hx('E-1705', 'shell', 200, 'Slurry product cooler', { util: 'CW' }).thru('F-1701', 'filter', 'Slurry filter').toBL('slurry oil', { cv: true });
  u.out('C-1701', 'heavy cycle oil draw', liquid('GO', hcoPa, 0.98, 600, 26)).pump('P-1703', 150, 'Heavy cycle oil pumparound pump')
    .hx('E-1715', 'shell', 500, 'Debutaniser reboiler').into('C-1701', 'heavy cycle oil return', { kind: 'column', cv: true });
  u.out('C-1701', 'light cycle oil pumparound draw', liquid('DI', lcoPa, X.lco.sg, 450, 24)).pump('P-1704', 150, 'Light cycle oil pumparound pump')
    .hxMatch('E-1701', 'shell').hx('E-1707', 'shell', 330, 'Stripper reboiler').into('C-1701', 'light cycle oil pumparound return', { kind: 'column', cv: true });
  u.out('C-1701', 'light cycle oil draw', liquid('DI', 1.1 * (X.lco.w + sponge), X.lco.sg, 450, 24)).into('C-1702', 'feed', { kind: 'column', slow: true, cv: true });
  u.out('C-1702', 'vapour', vapour('DI', 0.1 * (X.lco.w + sponge) + 2000, 60, 440, 23)).into('C-1701', 'stripper vapour return', { kind: 'column' });
  u.utility('MS', 'C-1702', 'stripping steam', 'to', 2000, 400, 150); u.utility('MS', 'C-1701', 'stripping steam', 'to', colSteam, 400, 150);
  const lco = u.out('C-1702', 'bottoms', liquid('DI', X.lco.w + sponge, X.lco.sg, 435, 24)).pump('P-1705', 260, 'Light cycle oil product pump')
    .air('A-1702', 140, 'Light cycle oil air cooler'), lcoDht = lco.split(B.lcoToDht.w), lean = lco.split(sponge);
  lco.toBL('light cycle oil to fuel oil', { cv: true }); lcoDht.toBL('light cycle oil to hydrotreating', { cv: true });
  lean.hx('E-1708', 'shell', 100, 'Sponge oil cooler', { util: 'CW' }).into('C-1704', 'lean oil', { kind: 'column', cv: true });
  u.out('C-1704', 'rich oil', liquid('DI', sponge + 3000, X.lco.sg, 115, 190)).set({ P: 40 }).into('C-1701', 'rich oil return', { kind: 'column', cv: true });
  // overhead, wet gas compressor, high-pressure separator
  u.out('C-1701', 'overhead', vapour('HG', X.gasoline.w + lpgFcc + X.dryGas + refluxW + colSteam, 60, 270, 15))
    .air('A-1701', 140, 'Main column overhead condenser', { ph: 'M', vf: 0.25 })
    .hx('E-1709', 'shell', 100, 'Overhead trim condenser', { util: 'CW', ph: 'M', vf: 0.22, dP: 3 }).into('D-1702', 'inlet');
  u.feed('crude overhead gas', vapour('HG', G.overhead, 38, 100, 9)).into('D-1702', 'inlet 2');
  u.feed('stripper gas', vapour('HG', G.stripper, 40, 110, 25)).set({ P: 10 }).into('D-1702', 'inlet 3', { cv: true });
  u.out('D-1702', 'reflux', liquid('GS', refluxW, 0.74, 100, 7)).pump('P-1706', 80, 'Main column reflux pump').into('C-1701', 'reflux', { kind: 'column', cv: true });
  u.out('D-1702', 'gasoline', liquid('GS', unstab, 0.74, 100, 7)).pump('P-1707', 260, 'Unstabilised gasoline pump').into('C-1703', 'lean oil', { kind: 'column', cv: true });
  const sw = u.out('D-1702', 'water', liquid('SW', rxSteam + colSteam, 1, 100, 7)).pump('P-1708', 90, 'Overhead sour water pump'); sw.toBL('sour water', { cv: true });
  u.out('D-1702', 'gas', vapour('HG', wetGas, 42, 100, 7)).thru('K-1702', 'compressor', 'Wet gas compressor, first stage, turbine driven', { P: 60, T: 200, spare: false })
    .air('A-1703', 120, 'Interstage cooler', { ph: 'M', vf: 0.85 }).into('D-1703', 'inlet');
  u.utility('HS', 'K-1702', 'turbine steam in', 'to', 60000, 650, 600); u.utility('LS', 'K-1702', 'turbine exhaust', 'from', 60000, 320, 50);
  const hp = u.out('D-1703', 'gas', vapour('HG', 0.85 * wetGas, 38, 120, 55)).thru('K-1703', 'compressor', '', { P: 215, T: 230, spare: false })
    .air('A-1704', 130, 'High-pressure cooler', { ph: 'M', vf: 0.15, addW: 0.15 * wetGas + unstab + leanGasoline + 20000 + strOvhd }), coolerIn = hp.lastLine;
  hp.hx('E-1710', 'shell', 100, 'High-pressure trim cooler', { util: 'CW' }).into('D-1704', 'inlet');
  u.out('D-1703', 'liquid', liquid('GS', 0.15 * wetGas, 0.68, 120, 55)).pump('P-1709', 230, 'Interstage liquid pump').mixInto(coolerIn, 'interstage liquid into the high-pressure cooler inlet');
  // absorbers and fuel gas treating
  u.out('D-1704', 'gas', vapour('HG', 40000, 32, 100, 200)).into('C-1703', 'gas in', { kind: 'column' });
  u.out('C-1703', 'rich oil', liquid('GS', unstab + leanGasoline + 20000, 0.72, 115, 197)).pump('P-1710', 235, 'Absorber rich oil pump').mixInto(coolerIn, 'rich oil into the high-pressure cooler inlet');
  u.out('C-1703', 'gas out', vapour('HG', 20000, 24, 110, 193)).into('C-1704', 'gas in', { kind: 'column' });
  u.out('C-1704', 'gas out', vapour('HG', fuelGas + h2sHere, 21, 110, 188)).into('C-1706', 'gas in', { kind: 'column' });
  const la = u.feed('lean amine', liquid('AM', amineFg + amineLpg, 1.03, 120, 300)), laLpg = la.split(amineLpg);
  la.into('C-1706', 'lean amine', { kind: 'column', cv: true });
  const ra = u.out('C-1706', 'rich amine', liquid('AM', amineFg + h2sHere, 1.04, 135, 185)); ra.set({ P: 80 }).toBL('rich amine', { cv: true });
  u.out('C-1706', 'treated gas', vapour('FG', fuelGas, 20, 115, 180)).into('D-1706', 'inlet');
  u.out('D-1706', 'gas', vapour('FG', fuelGas, 20, 115, 178)).toBL('fuel gas', { cv: true });
  u.out('D-1704', 'water', liquid('SW', 3000, 1, 100, 200)).set({ P: 95 }).mixInto(sw, 'separator water into the sour water line');
  // stripper, debutaniser
  u.out('D-1704', 'liquid', liquid('GS', debFeed + strOvhd, 0.68, 100, 200)).pump('P-1711', 270, 'Stripper feed pump')
    .hx('E-1711', 'tube', 180, 'Stripper feed / debutaniser bottoms exchanger').into('C-1707', 'feed', { kind: 'column', cv: true });
  u.out('C-1707', 'overhead', vapour('HG', strOvhd, 40, 150, 210)).mixInto(coolerIn, 'stripper overhead into the high-pressure cooler inlet');
  u.out('C-1707', 'reboiler draw', liquid('GS', 250000, 0.68, 280, 215)).hxMatch('E-1707', 'tube', { ph: 'M', vf: 0.25, mw: 60, dP: 1 }).into('C-1707', 'reboiler return', { kind: 'column' });
  u.out('C-1707', 'bottoms', liquid('GS', debFeed, 0.68, 290, 215)).set({ P: 165 }).into('C-1708', 'feed', { kind: 'column', cv: true });
  u.out('C-1708', 'overhead', vapour('LP', 3.5 * lpgFcc, 52, 140, 150)).hx('E-1712', 'shell', 110, 'Debutaniser condenser', { util: 'CW', ph: 'L', dP: 5 }).into('D-1705', 'inlet');
  const dt = u.out('D-1705', 'outlet', liquid('LP', 3.5 * lpgFcc, 0.55, 110, 140)).pump('P-1712', 245, 'Debutaniser reflux and product pump'), lpg = dt.split(lpgFcc);
  dt.into('C-1708', 'reflux', { kind: 'column', cv: true });
  u.out('C-1708', 'reboiler draw', liquid('GS', 300000, 0.74, 340, 156)).hxMatch('E-1715', 'tube', { ph: 'M', vf: 0.3, mw: 90, dP: 1 }).into('C-1708', 'reboiler return', { kind: 'column' });
  const gl = u.out('C-1708', 'bottoms', liquid('GS', X.gasoline.w + leanGasoline, X.gasoline.sg, 350, 156)).hxMatch('E-1711', 'shell')
    .air('A-1705', 140, 'Gasoline air cooler').hx('E-1717', 'shell', 100, 'Gasoline trim cooler', { util: 'CW' }), recy = gl.split(leanGasoline);
  gl.thru('V-1704', 'vessel', 'Gasoline caustic wash drum').toBL('cracked gasoline', { cv: true });
  recy.pump('P-1714', 260, 'Lean gasoline pump').into('C-1703', 'supplemental lean oil', { kind: 'column', cv: true });
  u.utility('CA', 'V-1704', 'caustic', 'to', 500, 85, 100);
  // liquefied gas: amine, caustic, depropaniser
  lpg.into('C-1709', 'liquefied gas in', { kind: 'column', cv: true });
  u.feed('reformer liquefied gas', liquid('LP', lpgRef, 0.54, 110, 250)).mixInto(lpg, 'reformer liquefied gas into the contactor feed');
  laLpg.into('C-1709', 'lean amine', { kind: 'column', cv: true });
  u.out('C-1709', 'rich amine', liquid('AM', amineLpg + 300, 1.04, 115, 240)).set({ P: 190 }).mixInto(ra, 'rich amine from the contactor into the rich amine line');
  u.out('C-1709', 'liquefied gas out', liquid('LP', lpgFcc + lpgRef, 0.55, 110, 235)).thru('V-1703', 'vessel', 'Liquefied gas caustic wash drum').into('C-1710', 'feed', { kind: 'column', cv: true });
  u.utility('CA', 'V-1703', 'caustic', 'to', 300, 85, 250);
  u.out('C-1710', 'overhead', vapour('LP', 4 * c3, 43, 120, 215)).hx('E-1713', 'shell', 110, 'Depropaniser condenser', { util: 'CW', ph: 'L', dP: 5 }).into('D-1707', 'inlet');
  const pt = u.out('D-1707', 'outlet', liquid('LP', 4 * c3, 0.51, 110, 207)).pump('P-1713', 260, 'Depropaniser reflux and product pump'), c3Out = pt.split(c3);
  pt.into('C-1710', 'reflux', { kind: 'column', cv: true }); c3Out.toBL('three-carbon liquefied gas', { cv: true });
  u.out('C-1710', 'reboiler draw', liquid('LP', 150000, 0.585, 225, 221)).hx('E-1714', 'shell', 232, 'Depropaniser reboiler', { util: 'MS', ph: 'M', vf: 0.3, mw: 58, dP: 1 }).into('C-1710', 'reboiler return', { kind: 'column' });
  u.out('C-1710', 'bottoms', liquid('LP', c4, 0.585, 232, 221)).hx('E-1716', 'shell', 100, 'Four-carbon cooler', { util: 'CW' }).toBL('four-carbon liquefied gas', { cv: true });
  return u.done();
}
