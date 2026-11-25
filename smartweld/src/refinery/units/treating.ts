/**
 * Units 13 to 16: naphtha hydrotreater and splitter, catalytic reformer with hydrogen purification, kerosene
 * hydrotreater, diesel hydrotreater (DESIGN_BASIS.md §74, SW-REF-10). Drawing data: SmartWeld's own demonstration
 * schemes and conditions (PROVENANCE P-79).
 */
import { UnitBuilder, type UnitSheet } from '../flowsheet';
import { liquid, vapour } from '../fluids';
import { YIELDS, type Balance } from '../balance';

const H2S = 34.08 / 32.06;
/** reformer net gas: the hydrogen made with four fifths of the two-carbon-and-lighter gas; its molecular weight and hydrogen share by mass */
export const NET_GAS = { mw: 3.6, h2: YIELDS.reformer.h2 / (YIELDS.reformer.h2 + 0.8 * YIELDS.reformer.c2) };
/** the hydrocarbon that rides in with the net gas a unit takes for h2 lb/h of hydrogen; it leaves in that unit's stripper gas */
export const carried = (h2: number) => (h2 / NET_GAS.h2) * (1 - NET_GAS.h2);
/** stripper gas sent to the unit 17 wet gas compressor by units 13, 15 and 16, lb/h */
export const stripperGas = (B: Balance) => ({ 13: B.nht.sourGas + B.cut.LE.w * 0.8 + carried(B.nht.h2), 15: B.kht.sourGas + carried(B.kht.h2), 16: B.dht.sourGas - B.sulfur.dht * H2S });
/** unit 14's stabiliser gas, lb/h: what the reformer's feed leaves after net gas, liquefied gas and reformate */
export const stabiliserGas = (B: Balance) => B.reformer.feed.w - (B.reformer.h2 + 0.8 * B.reformer.c2) - B.reformer.c3 - B.reformer.c4 - B.reformer.reformate.w;
const fuel = (u: UnitBuilder, tag: string) => u.utility('FG', tag, 'fuel gas', 'to', (u.sheet.equip.get(tag)!.duty.process / 0.85) / 20000, 100, 50);

export function unit13(B: Balance): UnitSheet {
  const u = new UnitBuilder(13, 'Naphtha hydrotreater and splitter'), c = B.cut;
  const sr = c.LE.w * 0.8 + c.LN.w + c.HN.w, wild = B.kht.wildNaphtha + B.dht.wildNaphtha, feedW = sr + wild, recycle = 3340, makeup = B.nht.h2 / NET_GAS.h2;
  const offGas = stripperGas(B)[13], ln = B.nht.lightNaphtha.w, hn = B.nht.heavyNaphtha.w, wash = 2000;
  u.item('D-1301', 'drum', 'Feed surge drum', { holdMin: 15 });
  u.item('D-1302', 'drum', 'Product separator', { boot: 1 });
  u.item('C-1301', 'column', 'Stripper', { trays: 20, vapW: 3 * offGas, vapMw: 50, vapT: 200, vapP: 180, liqSg: 0.62, skirt: 180 });
  u.item('C-1302', 'column', 'Naphtha splitter', { trays: 30, vapW: 2.5 * ln, vapMw: 78, vapT: 180, vapP: 20, liqSg: 0.62, skirt: 180 });
  u.item('D-1303', 'drum', 'Stripper reflux drum', { boot: 1 }); u.item('D-1304', 'drum', 'Splitter reflux drum');
  u.feed('straight-run naphtha', liquid('NA', sr, 0.72, 100, 110)).into('D-1301', 'inlet', { cv: true });
  u.feed('wild naphtha', liquid('NA', wild, 0.74, 110, 80)).into('D-1301', 'inlet 2', { cv: true });
  // reactor loop
  const feed = u.out('D-1301', 'outlet', liquid('NA', feedW, 0.725, 100, 30)).pump('P-1301', 460, 'Charge pump')
    .hx('E-1301', 'tube', 520, 'Feed / effluent exchanger', { ph: 'M', vf: 0.6, mw: 60, addW: recycle + makeup, fluid: 'RX' });
  const rec = u.out('D-1302', 'gas', vapour('HY', recycle, 6, 100, 350)).thru('K-1301', 'compressor', 'Recycle gas compressor', { P: 465, T: 165, spare: true });
  u.feed('reformer net gas', vapour('HY', makeup, NET_GAS.mw, 110, 500)).set({ P: 355 }).mixInto(rec, 'make-up hydrogen into the recycle compressor suction');
  rec.mixInto(feed, 'recycle gas into the feed ahead of the exchangers');
  const eff = feed.fired('H-1301', 600, 'Charge heater', { ph: 'V', mw: 60, cv: true }).thru('R-1301', 'reactor', 'Hydrotreating reactor', { T: 610, dP: 25 })
    .hxMatch('E-1301', 'shell', { ph: 'M', vf: 0.35 }).air('A-1301', 140, 'Reactor effluent air cooler', { ph: 'M', vf: 0.03, addW: wash });
  u.feed('stripped water', liquid('PW', wash, 1, 110, 100)).pump('P-1305', 400, 'Wash water pump').mixInto(eff, 'wash water into the effluent ahead of the air cooler');
  eff.hx('E-1302', 'shell', 100, 'Effluent trim cooler', { util: 'CW' }).into('D-1302', 'inlet');
  u.out('D-1302', 'water', liquid('SW', wash, 1, 100, 350)).toBL('sour water', { cv: true });
  // stripper
  u.out('D-1302', 'liquid', liquid('NA', feedW, 0.725, 100, 350)).set({ P: 210 }).hx('E-1303', 'tube', 300, 'Stripper feed / bottoms exchanger').into('C-1301', 'feed', { kind: 'column', cv: true });
  u.out('C-1301', 'overhead', vapour('HG', 3 * offGas, 50, 200, 180)).air('A-1302', 120, 'Stripper overhead condenser', { ph: 'M', vf: 0.33 }).into('D-1303', 'inlet');
  u.out('D-1303', 'gas', vapour('HG', offGas, 45, 120, 170)).toBL('stripper gas', { cv: true });
  u.out('D-1303', 'reflux', liquid('NA', 2 * offGas, 0.6, 120, 170)).pump('P-1302', 230, 'Stripper reflux pump').into('C-1301', 'reflux', { kind: 'column', cv: true });
  u.out('C-1301', 'reboiler draw', liquid('NA', 150000, 0.72, 385, 185)).hx('E-1304', 'shell', 400, 'Stripper reboiler', { util: 'HS', ph: 'M', vf: 0.3, mw: 100, dP: 1 }).into('C-1301', 'reboiler return', { kind: 'column' });
  u.out('C-1301', 'bottoms', liquid('NA', ln + hn, 0.725, 400, 185)).hxMatch('E-1303', 'shell').set({ P: 40 }).into('C-1302', 'feed', { kind: 'column', cv: true });
  // splitter
  u.out('C-1302', 'overhead', vapour('NA', 2.5 * ln, 78, 180, 20)).air('A-1303', 130, 'Splitter overhead condenser', { ph: 'L' }).into('D-1304', 'inlet');
  const top = u.out('D-1304', 'outlet', liquid('NA', 2.5 * ln, 0.67, 130, 15)).pump('P-1303', 90, 'Splitter reflux and product pump'), lnOut = top.split(ln);
  top.into('C-1302', 'reflux', { kind: 'column', cv: true });
  lnOut.hx('E-1305', 'shell', 100, 'Light naphtha cooler', { util: 'CW' }).toBL('light naphtha', { cv: true });
  u.out('C-1302', 'reboiler draw', liquid('NA', 200000, 0.755, 300, 25)).hx('E-1306', 'shell', 310, 'Splitter reboiler', { util: 'MS', ph: 'M', vf: 0.25, mw: 110, dP: 1 }).into('C-1302', 'reboiler return', { kind: 'column' });
  // heavy naphtha: hot to unit 14, or cooled to its feed tank when the reformer is down
  const hnOut = u.out('C-1302', 'bottoms', liquid('NA', hn, 0.755, 310, 25)).pump('P-1304', 110, 'Heavy naphtha pump'), toTank = hnOut.alt();
  hnOut.toBL('hydrotreated heavy naphtha', { cv: true });
  toTank.air('A-1304', 140, 'Heavy naphtha rundown cooler').toBL('heavy naphtha to storage', { cv: true });
  fuel(u, 'H-1301');
  return u.done();
}

export function unit14(B: Balance): UnitSheet {
  const u = new UnitBuilder(14, 'Catalytic reformer and hydrogen purification'), R = B.reformer, feedW = R.feed.w, recycle = 35500;
  const netGas = R.h2 + 0.8 * R.c2, toUsers = (B.h2.nht + B.h2.kht) / NET_GAS.h2, toPsa = netGas - toUsers, h2 = B.h2.purified, tail = toPsa - h2;
  const liq = feedW - netGas, lpg = R.c3 + R.c4, stabGas = stabiliserGas(B);
  u.item('D-1401', 'drum', 'Feed surge drum', { holdMin: 15 }); u.item('D-1402', 'drum', 'Product separator');
  u.item('D-1403', 'drum', 'Net gas knock-out drum', { vertical: 1 }); u.item('D-1404', 'drum', 'Tail gas drum', { vertical: 1 });
  u.item('X-1401', 'psa', 'Pressure swing adsorption unit, four beds', { beds: 4 });
  u.item('C-1401', 'column', 'Stabiliser', { trays: 30, vapW: 3 * (lpg + stabGas), vapMw: 48, vapT: 160, vapP: 220, liqSg: 0.55, skirt: 180 });
  u.item('D-1405', 'drum', 'Stabiliser receiver'); u.item('D-1406', 'drum', 'Convection section steam drum', { steamDrum: 1 });
  u.feed('hydrotreated heavy naphtha', liquid('NA', feedW, R.feed.sg, 300, 60)).into('D-1401', 'inlet', { cv: true });
  u.feed('heavy naphtha from storage', liquid('NA', feedW, R.feed.sg, 140, 60)).into('D-1401', 'inlet 2', { cv: true });
  // reactor loop: three reactors, a heater ahead of each
  const feed = u.out('D-1401', 'outlet', liquid('NA', feedW, R.feed.sg, 290, 40)).pump('P-1401', 420, 'Charge pump')
    .hx('E-1401', 'tube', 800, 'Combined feed exchanger', { ph: 'V', mw: 30, addW: recycle, fluid: 'RX' });
  const rec = u.out('D-1402', 'recycle gas', vapour('HY', recycle, 6.5, 100, 250)).thru('K-1401', 'compressor', 'Recycle gas compressor, turbine driven', { P: 425, T: 175, spare: false });
  u.utility('HS', 'K-1401', 'turbine steam in', 'to', 30000, 650, 600); u.utility('LS', 'K-1401', 'turbine exhaust', 'from', 30000, 320, 50);
  rec.mixInto(feed, 'recycle gas into the feed ahead of the exchanger');
  feed.fired('H-1401', 950, 'Charge heater', { cv: true }).thru('R-1401', 'reactor', 'First reforming reactor', { T: 850, dP: 8 })
    .fired('H-1402', 950, 'First interheater', { dP: 15 }).thru('R-1402', 'reactor', 'Second reforming reactor', { T: 890, dP: 8 })
    .fired('H-1403', 950, 'Second interheater', { dP: 15 }).thru('R-1403', 'reactor', 'Third reforming reactor', { T: 920, dP: 8 })
    .hxMatch('E-1401', 'shell').air('A-1401', 140, 'Product condenser', { ph: 'M', vf: 0.3 })
    .hx('E-1402', 'shell', 100, 'Product trim cooler', { util: 'CW' }).into('D-1402', 'inlet');
  // net gas: boosted, cooled, shared between the hydrotreaters and the adsorbers
  const ng = u.out('D-1402', 'net gas', vapour('HY', netGas, NET_GAS.mw, 100, 250)).thru('K-1402', 'compressor', 'Net gas compressor', { P: 530, T: 230, spare: true })
    .hx('E-1403', 'shell', 110, 'Net gas cooler', { util: 'CW' });
  ng.into('D-1403', 'inlet');
  const dry = u.out('D-1403', 'gas', vapour('HY', netGas, NET_GAS.mw, 110, 515)), users = dry.split(toUsers);
  dry.into('X-1401', 'feed', { kind: 'psa', cv: true }); users.toBL('reformer net gas', { cv: true });
  const prod = u.out('X-1401', 'hydrogen', vapour('HY', h2, 2.02, 110, 505)), surplus = prod.split(B.h2.surplus);
  prod.toBL('hydrogen', { cv: true }); surplus.set({ P: 60 }).toBL('surplus hydrogen', { cv: true });
  u.out('X-1401', 'tail gas', vapour('FG', tail, 14, 100, 6)).into('D-1404', 'inlet');
  u.out('D-1404', 'outlet', vapour('FG', tail, 14, 100, 5)).into('H-1401', 'tail gas', { kind: 'heater', cv: true });
  // stabiliser
  u.out('D-1402', 'liquid', liquid('RF', liq, 0.78, 100, 250)).hx('E-1404', 'tube', 300, 'Stabiliser feed / bottoms exchanger').into('C-1401', 'feed', { kind: 'column', cv: true });
  u.out('C-1401', 'overhead', vapour('LP', 3 * (lpg + stabGas), 48, 160, 220)).hx('E-1405', 'shell', 110, 'Stabiliser condenser', { util: 'CW', ph: 'M', vf: 0.05, dP: 5 }).into('D-1405', 'inlet');
  u.out('D-1405', 'gas', vapour('FG', stabGas, 24, 110, 210)).toBL('stabiliser gas', { cv: true });
  const ot = u.out('D-1405', 'liquid', liquid('LP', 3 * lpg + 2 * stabGas, 0.54, 110, 210)).pump('P-1402', 260, 'Stabiliser reflux pump'), lp = ot.split(lpg);
  ot.into('C-1401', 'reflux', { kind: 'column', cv: true }); lp.toBL('reformer liquefied gas', { cv: true });
  u.out('C-1401', 'reboiler draw', liquid('RF', 220000, 0.795, 430, 225)).hx('E-1406', 'shell', 445, 'Stabiliser reboiler', { util: 'HS', ph: 'M', vf: 0.3, mw: 100, dP: 1 }).into('C-1401', 'reboiler return', { kind: 'column' });
  u.out('C-1401', 'bottoms', liquid('RF', R.reformate.w, R.reformate.sg, 445, 225)).hxMatch('E-1404', 'shell').air('A-1402', 140, 'Reformate air cooler')
    .hx('E-1407', 'shell', 100, 'Reformate trim cooler', { util: 'CW' }).toBL('reformate', { cv: true });
  // steam raised in the heaters' convection section
  u.out('D-1406', 'downcomer', liquid('BW', 90000, 1, 480, 600)).into('H-1401', 'steam coil in', { kind: 'heater', slow: true });
  u.out('H-1401', 'steam coil out', { fluid: 'BW', ph: 'M', w: 90000, sg: 1, mw: 18, T: 489, P: 600, vf: 0.2 }).into('D-1406', 'riser');
  u.utility('BW', 'D-1406', 'feed water in', 'to', 18000, 250, 700); u.utility('HS', 'D-1406', 'steam out', 'from', 18000, 489, 600);
  for (const h of ['H-1401', 'H-1402', 'H-1403']) fuel(u, h);
  return u.done();
}

export function unit15(B: Balance): UnitSheet {
  const u = new UnitBuilder(15, 'Kerosene hydrotreater'), K = B.kht, feedW = K.feed.w, recycle = 2800, makeup = K.h2 / NET_GAS.h2, wash = 1000, gas = stripperGas(B)[15];
  u.item('D-1501', 'drum', 'Feed surge drum', { holdMin: 15 }); u.item('D-1502', 'drum', 'Product separator', { boot: 1 });
  u.item('C-1501', 'column', 'Stripper', { trays: 15, vapW: 3 * (gas + K.wildNaphtha) + 2500, vapMw: 40, vapT: 250, vapP: 40, liqSg: 0.7, skirt: 180 });
  u.item('D-1503', 'drum', 'Stripper overhead drum', { boot: 1 });
  u.feed('straight-run kerosene', liquid('KE', feedW, K.feed.sg, 100, 80)).into('D-1501', 'inlet', { cv: true });
  const feed = u.out('D-1501', 'outlet', liquid('KE', feedW, K.feed.sg, 100, 30)).pump('P-1501', 460, 'Charge pump')
    .hx('E-1501', 'tube', 520, 'Feed / effluent exchanger', { ph: 'M', vf: 0.3, mw: 40, addW: recycle + makeup, fluid: 'RX' });
  const rec = u.out('D-1502', 'gas', vapour('HY', recycle, 6, 110, 340)).thru('K-1501', 'compressor', 'Recycle gas compressor', { P: 465, T: 170, spare: true });
  u.feed('reformer net gas', vapour('HY', makeup, NET_GAS.mw, 110, 500)).set({ P: 345 }).mixInto(rec, 'make-up hydrogen into the recycle compressor suction');
  rec.mixInto(feed, 'recycle gas into the feed ahead of the exchangers');
  const eff = feed.fired('H-1501', 600, 'Charge heater', { ph: 'M', vf: 0.6, cv: true }).thru('R-1501', 'reactor', 'Hydrotreating reactor', { T: 615, dP: 30 })
    .hx('E-1505', 'shell', 565, 'Reactor effluent / stripper feed exchanger', { dP: 5 }).hxMatch('E-1501', 'shell', { ph: 'M', vf: 0.1 }).air('A-1501', 140, 'Reactor effluent air cooler', { ph: 'M', vf: 0.04, addW: wash });
  u.feed('stripped water', liquid('PW', wash, 1, 110, 100)).pump('P-1505', 400, 'Wash water pump').mixInto(eff, 'wash water into the effluent ahead of the air cooler');
  eff.hx('E-1502', 'shell', 110, 'Effluent trim cooler', { util: 'CW' }).into('D-1502', 'inlet');
  const sw = u.out('D-1502', 'water', liquid('SW', wash, 1, 110, 340)); sw.toBL('sour water', { cv: true });
  u.out('D-1502', 'liquid', liquid('KE', feedW, K.feed.sg, 110, 340)).set({ P: 70 }).hx('E-1503', 'tube', 320, 'Stripper feed / bottoms exchanger').hxMatch('E-1505', 'tube').into('C-1501', 'feed', { kind: 'column', cv: true });
  u.out('C-1501', 'overhead', vapour('HG', 3 * (gas + K.wildNaphtha) + 2500, 40, 250, 40)).air('A-1502', 120, 'Stripper overhead condenser', { ph: 'M', vf: 0.1 }).into('D-1503', 'inlet');
  u.out('D-1503', 'gas', vapour('HG', gas, 30, 120, 30)).toBL('stripper gas', { cv: true });
  const ot = u.out('D-1503', 'liquid', liquid('NA', 3 * K.wildNaphtha + 2 * gas, 0.72, 120, 30)).pump('P-1502', 110, 'Stripper reflux pump'), wn = ot.split(K.wildNaphtha);
  ot.into('C-1501', 'reflux', { kind: 'column', cv: true }); wn.toBL('wild naphtha', { cv: true });
  u.out('D-1503', 'water', liquid('SW', 2500, 1, 120, 30)).pump('P-1504', 360, 'Stripper sour water pump').mixInto(sw, 'stripper water into the sour water line');
  u.out('C-1501', 'bottoms', liquid('KE', K.product.w, K.product.sg, 370, 45)).pump('P-1503', 130, 'Kerosene product pump').hxMatch('E-1503', 'shell')
    .hx('E-1504', 'shell', 100, 'Kerosene trim cooler', { util: 'CW' })
    .thru('F-1501', 'filter', 'Product coalescer').toBL('treated kerosene', { cv: true });
  u.utility('MS', 'C-1501', 'stripping steam', 'to', 2500, 400, 150);
  fuel(u, 'H-1501');
  return u.done();
}

export function unit16(B: Balance): UnitSheet {
  const u = new UnitBuilder(16, 'Diesel hydrotreater'), D = B.dht, c = B.cut, feedW = D.feed.w, recycle = 16800, quench = 5000, wash = 6000, amine = 40000, h2s = B.sulfur.dht * H2S;
  u.item('D-1601', 'drum', 'Feed surge drum', { holdMin: 15 }); u.item('D-1602', 'drum', 'Cold separator', { boot: 1 });
  u.item('C-1601', 'column', 'Recycle gas amine absorber', { trays: 20, vapW: recycle, vapMw: 5, vapT: 130, vapP: 760, liqSg: 1.03, skirt: 120 });
  u.item('D-1603', 'drum', 'Recycle compressor knock-out drum', { vertical: 1 }); u.item('D-1604', 'drum', 'Low-pressure flash drum', { boot: 1 });
  u.item('C-1602', 'column', 'Product stripper', { trays: 20, vapW: 3 * D.wildNaphtha + 6000, vapMw: 45, vapT: 300, vapP: 100, liqSg: 0.7, skirt: 180 });
  u.item('D-1605', 'drum', 'Stripper overhead drum', { boot: 1 });
  u.item('R-1601', 'reactor', 'Hydrotreating reactor, two beds', { beds: 2 });
  u.feed('straight-run diesel', liquid('DI', c.DI.w, c.DI.sg, 140, 80)).into('D-1601', 'inlet', { cv: true });
  u.feed('light cycle oil to hydrotreating', liquid('DI', B.lcoToDht.w, B.lcoToDht.sg, 140, 80)).into('D-1601', 'inlet 2', { cv: true });
  const feed = u.out('D-1601', 'outlet', liquid('DI', feedW, D.feed.sg, 140, 30)).thru('F-1601', 'filter', 'Feed filter').pump('P-1601', 900, 'Charge pump')
    .hx('E-1601', 'tube', 540, 'Feed / effluent exchanger', { ph: 'M', vf: 0.25, mw: 30, addW: recycle - quench + D.h2, fluid: 'RX' });
  // recycle gas: amine-scrubbed, knocked out, compressed; quench to the reactor; make-up hydrogen compressed in
  u.out('D-1602', 'gas', vapour('HY', recycle + h2s, 6, 130, 770)).into('C-1601', 'gas in', { kind: 'column' });
  u.feed('lean amine', liquid('AM', amine, 1.03, 120, 300)).pump('P-1602', 830, 'Lean amine booster pump')   /* at the pressure the lean amine line runs at for the cracker's absorbers (SW-REF-12) */.into('C-1601', 'lean amine', { kind: 'column', cv: true });
  u.out('C-1601', 'rich amine', liquid('AM', amine + h2s, 1.04, 140, 765)).set({ P: 80 }).toBL('rich amine', { cv: true });
  u.out('C-1601', 'treated gas', vapour('HY', recycle, 5, 130, 760)).into('D-1603', 'inlet');
  const rec = u.out('D-1603', 'gas', vapour('HY', recycle, 5, 130, 758)).thru('K-1601', 'compressor', 'Recycle gas compressor', { P: 905, T: 180, spare: true }), q = rec.split(quench);
  rec.mixInto(feed, 'recycle gas into the feed ahead of the exchangers');
  q.into('R-1601', 'quench', { kind: 'reactor', cv: true });
  u.feed('hydrogen', vapour('HY', D.h2, 2.02, 110, 495)).thru('K-1602', 'compressor', 'Make-up hydrogen compressor', { P: 905, T: 250, spare: true }).mixInto(rec, 'make-up hydrogen into the recycle gas');
  const eff = feed.fired('H-1601', 610, 'Charge heater', { ph: 'M', vf: 0.4, cv: true }).thru('R-1601', 'reactor', 'Hydrotreating reactor, two beds', { T: 650, dP: 50, addW: quench })
    .hx('E-1604', 'shell', 600, 'Reactor effluent / stripper feed exchanger').hxMatch('E-1601', 'shell', { ph: 'M', vf: 0.15 });
  eff.air('A-1601', 140, 'Reactor effluent air cooler', { ph: 'M', vf: 0.12, addW: wash });
  u.feed('stripped water', liquid('PW', wash, 1, 110, 100)).pump('P-1605', 810, 'Wash water pump').mixInto(eff, 'wash water into the effluent ahead of the air cooler');
  eff.into('D-1602', 'inlet');
  const sw = u.out('D-1602', 'water', liquid('SW', wash, 1, 140, 770)); sw.toBL('sour water', { cv: true });
  // flash, stripper, product
  u.out('D-1602', 'liquid', liquid('DI', feedW, D.feed.sg, 140, 770)).set({ P: 150 }).into('D-1604', 'inlet', { cv: true });
  const fg = u.out('D-1604', 'gas', vapour('HG', 400, 20, 140, 140)); fg.toBL('stripper gas', { cv: true });
  u.out('D-1604', 'liquid', liquid('DI', feedW, D.feed.sg, 140, 140)).hx('E-1602', 'tube', 370, 'Stripper feed / bottoms exchanger').hxMatch('E-1604', 'tube').into('C-1602', 'feed', { kind: 'column', cv: true });
  u.out('C-1602', 'overhead', vapour('HG', 3 * D.wildNaphtha + 6000, 45, 300, 100)).air('A-1602', 120, 'Stripper overhead condenser', { ph: 'M', vf: 0.05 }).into('D-1605', 'inlet');
  u.out('D-1605', 'gas', vapour('HG', D.sourGas - h2s - 400, 30, 120, 90)).set({ P: 80 }).mixInto(fg, 'stripper gas into the flash gas line');
  const ot = u.out('D-1605', 'liquid', liquid('NA', 3 * D.wildNaphtha, 0.74, 120, 90)).pump('P-1603', 160, 'Stripper reflux pump'), wn = ot.split(D.wildNaphtha);
  ot.into('C-1602', 'reflux', { kind: 'column', cv: true }); wn.toBL('wild naphtha', { cv: true });
  u.out('D-1605', 'water', liquid('SW', 6000, 1, 120, 90)).pump('P-1606', 790, 'Stripper sour water pump').mixInto(sw, 'stripper water into the sour water line');
  u.out('C-1602', 'bottoms', liquid('DI', D.product.w, D.product.sg, 420, 105)).pump('P-1604', 180, 'Diesel product pump').hxMatch('E-1602', 'shell')
    .air('A-1603', 140, 'Diesel air cooler').hx('E-1603', 'shell', 110, 'Diesel trim cooler', { util: 'CW' })
    .thru('F-1602', 'filter', 'Product coalescer and salt dryer').toBL('treated diesel', { cv: true });
  u.utility('MS', 'C-1602', 'stripping steam', 'to', 6000, 400, 150);
  fuel(u, 'H-1601');
  return u.done();
}
