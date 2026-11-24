/**
 * Units 11 and 12, crude and vacuum distillation (DESIGN_BASIS.md §74, SW-REF-10). Drawing data: SmartWeld's own
 * demonstration scheme and conditions (PROVENANCE P-79). A stream that crosses the battery limit carries the same
 * name in the unit it leaves and the unit it enters.
 */
import { UnitBuilder, type UnitSheet } from '../flowsheet';
import { liquid, vapour } from '../fluids';
import type { Balance } from '../balance';

export function unit11(B: Balance): UnitSheet {
  const u = new UnitBuilder(11, 'Crude distillation'), c = B.cut, W = B.crude.w, sg = B.crude.sg;
  const naphtha = c.LE.w * 0.8 + c.LN.w + c.HN.w, reflux = 0.8 * naphtha, steam = 14000, gas = c.LE.w * 0.2;
  u.item('C-1101', 'column', 'Atmospheric column', { trays: 42, vapW: naphtha + gas + reflux + steam, vapMw: 81, vapT: 250, vapP: 15, liqSg: 0.72, skirt: 180 });
  u.item('C-1102', 'column', 'Side stripper (kerosene, diesel and gas oil sections)', { trays: 18, vapW: 0.15 * (c.KE.w + c.DI.w + c.AGO.w) + 5000, vapMw: 70, vapT: 450, vapP: 18, liqSg: 0.80, skirt: 240, sections: 3 });
  u.item('D-1101', 'desalter', 'Desalter');
  u.item('D-1102', 'drum', 'Preflash drum');
  u.item('D-1103', 'drum', 'Overhead accumulator', { boot: 1 });

  // crude: charge, cold train, desalter, first hot train, preflash, second hot train, heater, column
  const crude = u.feed('crude', liquid('CR', W, sg, 60, 50));
  crude.pump('P-1101', 300, 'Crude charge pump')
    .hx('E-1101', 'tube', 105, 'Crude / top pumparound exchanger')
    .hx('E-1102', 'tube', 125, 'Crude / kerosene exchanger')
    .hx('E-1103', 'tube', 185, 'Crude / diesel exchanger')
    .hx('E-1104', 'tube', 270, 'Crude / diesel pumparound exchanger')
    .set({ P: 165 }).into('D-1101', 'inlet', { kind: 'desalter' });
  const wash = 43800;
  u.feed('stripped water', liquid('PW', wash, 1, 110, 60)).pump('P-1102', 220, 'Desalter wash water pump')
    .hx('E-1105', 'tube', 220, 'Wash water / brine exchanger').mixInto(crude, 'wash water into the crude ahead of the desalter');
  u.out('D-1101', 'brine', liquid('OW', wash, 1.02, 268, 150)).hxMatch('E-1105', 'shell')
    .hx('E-1112', 'shell', 110, 'Brine cooler', { util: 'CW' }).toBL('desalter brine', { cv: true });
  u.out('D-1101', 'oil', liquid('CR', W, sg, 268, 150)).pump('P-1103', 330, 'Desalted crude booster pump')
    .hx('E-1106', 'tube', 285, 'Crude / gas oil exchanger')
    .hx('E-1107', 'tube', 400, 'Crude / gas oil pumparound exchanger')
    .set({ P: 50 }).into('D-1102', 'inlet', { cv: true });
  u.out('D-1102', 'vapour', vapour('NA', 0.04 * W, 85, 400, 45)).into('C-1101', 'flash vapour', { kind: 'column' });
  u.out('D-1102', 'liquid', liquid('CR', 0.96 * W, sg + 0.008, 400, 45)).pump('P-1104', 350, 'Flashed crude pump')
    .hx('E-1108', 'tube', 455, 'Crude / vacuum gas oil pumparound exchanger')
    .hx('E-1109', 'tube', 505, 'Crude / vacuum residue exchanger')
    .fired('H-1101', 680, 'Crude heater', { ph: 'M', vf: 0.45, mw: 160, P: 35, cv: true })
    .into('C-1101', 'feed', { kind: 'column' });

  // overhead
  u.out('C-1101', 'overhead', vapour('NA', naphtha + gas + reflux + steam, 81, 250, 15))
    .air('A-1101', 140, 'Overhead air condenser', { ph: 'M', vf: 0.04, dP: 3 })
    .hx('E-1110', 'shell', 100, 'Overhead trim condenser', { util: 'CW', ph: 'M', vf: 0.02, dP: 2 })
    .into('D-1103', 'inlet');
  u.out('D-1103', 'gas', vapour('HG', gas, 38, 100, 10)).toBL('crude overhead gas');
  u.out('D-1103', 'reflux', liquid('NA', reflux, 0.72, 100, 10)).pump('P-1112', 70, 'Reflux pump').into('C-1101', 'reflux', { kind: 'column', cv: true });
  u.out('D-1103', 'naphtha', liquid('NA', naphtha, 0.72, 100, 10)).pump('P-1113', 130, 'Naphtha product pump').toBL('straight-run naphtha', { cv: true });
  u.out('D-1103', 'water', liquid('SW', steam, 1, 100, 10)).pump('P-1114', 90, 'Overhead sour water pump').toBL('sour water', { cv: true });

  // pumparounds
  u.out('C-1101', 'top pumparound draw', liquid('NA', 380000, 0.76, 330, 18)).pump('P-1105', 110, 'Top pumparound pump')
    .hxMatch('E-1101', 'shell').air('A-1102', 190, 'Top pumparound air cooler').into('C-1101', 'top pumparound return', { kind: 'column', cv: true });
  u.out('C-1101', 'diesel pumparound draw', liquid('DI', 430000, 0.85, 500, 20)).pump('P-1106', 110, 'Diesel pumparound pump')
    .hxMatch('E-1104', 'shell').into('C-1101', 'diesel pumparound return', { kind: 'column', cv: true });
  u.out('C-1101', 'gas oil pumparound draw', liquid('GO', 420000, 0.885, 610, 21)).pump('P-1107', 110, 'Gas oil pumparound pump')
    .hxMatch('E-1107', 'shell').into('C-1101', 'gas oil pumparound return', { kind: 'column', cv: true });

  // side draws through the stripper sections
  const side = (name: string, fluid: string, w: number, sgc: number, T: number) => {
    u.out('C-1101', `${name} draw`, liquid(fluid, 1.1 * w, sgc, T, 19)).into('C-1102', `${name} in`, { kind: 'column', slow: true, cv: true });
    u.out('C-1102', `${name} vapour`, vapour(fluid, 0.1 * w + 1500, 60, T - 8, 18)).into('C-1101', `${name} vapour return`, { kind: 'column' });
    return u.out('C-1102', `${name} out`, liquid(fluid, w, sgc, T - 12, 19));
  };
  side('kerosene', 'KE', c.KE.w, c.KE.sg, 400).pump('P-1108', 150, 'Kerosene product pump').hxMatch('E-1102', 'shell')
    .hx('E-1111', 'shell', 100, 'Kerosene trim cooler', { util: 'CW' }).toBL('straight-run kerosene', { cv: true });
  side('diesel', 'DI', c.DI.w, c.DI.sg, 540).pump('P-1109', 150, 'Diesel product pump').hxMatch('E-1103', 'shell')
    .air('A-1103', 140, 'Diesel air cooler').toBL('straight-run diesel', { cv: true });
  side('gas oil', 'GO', c.AGO.w, c.AGO.sg, 620).pump('P-1110', 150, 'Gas oil product pump').hxMatch('E-1106', 'shell').toBL('atmospheric gas oil', { cv: true });

  // residue, and the two unit 12 streams that preheat the crude
  u.out('C-1101', 'bottoms', liquid('RS', B.atmResid.w, B.atmResid.sg, 650, 25)).pump('P-1111', 200, 'Atmospheric residue pump').toBL('atmospheric residue', { cv: true });
  u.feed('vacuum gas oil pumparound supply', liquid('GO', 322000, c.HVGO.sg, 550, 130)).hxMatch('E-1108', 'shell').toBL('vacuum gas oil pumparound return');
  u.feed('vacuum residue hot', liquid('RS', c.VR.w, c.VR.sg, 680, 130)).hxMatch('E-1109', 'shell')
    .hx('E-1113', 'shell', 350, 'Vacuum residue steam generator', { util: 'SG-LS' }).toBL('vacuum residue rundown');

  // steam: stripping steam to the column and to each stripper section; fuel gas to the heater
  u.utility('LS', 'C-1101', 'stripping steam', 'to', 9000, 300, 50);
  for (const n of ['kerosene', 'diesel', 'gas oil']) u.utility('LS', 'C-1102', `${n} stripping steam`, 'to', 1500, 300, 50);
  u.utility('FG', 'H-1101', 'fuel gas', 'to', (u.sheet.equip.get('H-1101')!.duty.process / 0.85) / 20000, 100, 50);
  return u.done();
}

export function unit12(B: Balance): UnitSheet {
  const u = new UnitBuilder(12, 'Vacuum distillation'), c = B.cut, VAC = -14.1;
  const ovhd = 8000 + 800 + 1500, lpa = 250000, hpa = 322000, quench = 40000;
  u.item('C-1201', 'column', 'Vacuum column', { swaged: 1, vapW: 0.4 * B.atmResid.w + 8000, vapMw: 300, vapT: 730, vapP: VAC, liqSg: 0.85, topVapW: ovhd + 60000, topMw: 120, topT: 300, botVapW: 12000, botMw: 40, hBot: 240, hMid: 480, hTop: 360, skirt: 240 });
  u.item('D-1201', 'drum', 'Ejector hotwell');
  u.feed('atmospheric residue', liquid('RS', B.atmResid.w, B.atmResid.sg, 650, 150))
    .fired('H-1201', 750, 'Vacuum heater', { ph: 'M', vf: 0.40, mw: 300, P: -12.5, cv: true }).into('C-1201', 'feed', { kind: 'column' });
  // overhead: ejectors and hotwell
  u.out('C-1201', 'overhead', vapour('HG', ovhd, 22, 150, -14.3)).thru('J-1201', 'ejector', 'Vacuum ejector set, three stages with condensers', { T: 110, P: 3, ph: 'M', vf: 0.08 }).into('D-1201', 'inlet');
  u.utility('MS', 'J-1201', 'motive steam', 'to', 12000, 400, 150);
  u.utility('CWS', 'J-1201', 'cooling water in', 'to', 950000, 85, 60); u.utility('CWR', 'J-1201', 'cooling water out', 'from', 950000, 105, 45);
  u.out('D-1201', 'gas', vapour('HG', 800, 35, 110, 3)).into('H-1201', 'off-gas', { kind: 'heater' });
  u.out('D-1201', 'oil', liquid('OW', 1500, 0.86, 110, 3)).pump('P-1204', 80, 'Hotwell slop oil pump').toBL('slop oil', { cv: true });
  u.out('D-1201', 'water', liquid('SW', 20000, 1, 110, 3)).pump('P-1205', 90, 'Hotwell sour water pump').toBL('sour water', { cv: true });
  // light vacuum gas oil: pumparound and product
  const lv = u.out('C-1201', 'light vacuum gas oil draw', liquid('GO', c.LVGO.w + lpa, c.LVGO.sg, 300, VAC)).pump('P-1201', 120, 'Light vacuum gas oil pump')
    .air('A-1201', 150, 'Light vacuum gas oil cooler'), lvProduct = lv.split(c.LVGO.w);
  lv.into('C-1201', 'light vacuum gas oil return', { kind: 'column', cv: true }); lvProduct.toBL('light vacuum gas oil', { cv: true });
  // heavy vacuum gas oil: pumparound through the crude preheat of unit 11, product through a steam generator
  const hv = u.out('C-1201', 'heavy vacuum gas oil draw', liquid('GO', c.HVGO.w + hpa, c.HVGO.sg, 550, VAC)).pump('P-1202', 150, 'Heavy vacuum gas oil pump'), hvProduct = hv.split(c.HVGO.w);
  hv.toBL('vacuum gas oil pumparound supply');
  hvProduct.hx('E-1201', 'shell', 400, 'Heavy vacuum gas oil steam generator', { util: 'SG-MS' }).toBL('heavy vacuum gas oil', { cv: true });
  u.feed('vacuum gas oil pumparound return', liquid('GO', hpa, c.HVGO.sg, 445, 110)).into('C-1201', 'heavy vacuum gas oil return', { kind: 'column', cv: true });
  // vacuum residue: to the crude preheat of unit 11; quench back to the column's boot through a steam generator
  const vr = u.out('C-1201', 'bottoms', liquid('RS', c.VR.w + quench, c.VR.sg, 690, VAC)).pump('P-1203', 150, 'Vacuum residue pump'), q = vr.split(quench);
  vr.toBL('vacuum residue hot', { cv: true });
  q.hx('E-1202', 'shell', 500, 'Quench cooler (steam generator)', { util: 'SG-MS' }).into('C-1201', 'quench return', { kind: 'column', cv: true });
  u.utility('LS', 'C-1201', 'stripping steam', 'to', 6000, 300, 50);
  u.utility('FG', 'H-1201', 'fuel gas', 'to', (u.sheet.equip.get('H-1201')!.duty.process / 0.85) / 20000, 100, 50);
  return u.done();
}
