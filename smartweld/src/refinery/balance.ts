/**
 * Plant 3 material balance (DESIGN_BASIS.md §74, SW-REF-5..8): the design crude as nine cuts, each unit's yields by
 * mass, and the hydrogen and sulfur balances that follow. Everything is on mass, so every balance closes by
 * construction; volumes follow from the specific gravities. Invented demonstration data (PROVENANCE P-79).
 */
import { lbh, bpd, mmscfd } from './fluids';

export const CRUDE_BPD = 60000;
export interface Cut { key: string; name: string; range: string; vol: number; sg: number; sulfur: number }
/** SW-REF-5 */
export const CUTS: Cut[] = [
  { key: 'LE', name: 'Light ends (four carbons and lighter)', range: 'below 90', vol: 1.8, sg: 0.560, sulfur: 0 },
  { key: 'LN', name: 'Light naphtha', range: '90–180', vol: 5.6, sg: 0.670, sulfur: 0.02 },
  { key: 'HN', name: 'Heavy naphtha', range: '180–360', vol: 15.2, sg: 0.755, sulfur: 0.05 },
  { key: 'KE', name: 'Kerosene', range: '360–480', vol: 10.4, sg: 0.805, sulfur: 0.25 },
  { key: 'DI', name: 'Diesel', range: '480–650', vol: 18.6, sg: 0.850, sulfur: 1.05 },
  { key: 'AGO', name: 'Atmospheric gas oil', range: '650–720', vol: 6.0, sg: 0.885, sulfur: 1.60 },
  { key: 'LVGO', name: 'Light vacuum gas oil', range: '720–850', vol: 6.4, sg: 0.905, sulfur: 1.90 },
  { key: 'HVGO', name: 'Heavy vacuum gas oil', range: '850–1,020', vol: 17.0, sg: 0.935, sulfur: 2.20 },
  { key: 'VR', name: 'Vacuum residue', range: 'above 1,020', vol: 19.0, sg: 1.012, sulfur: 3.40 },
];
/** SW-REF-6: yields as mass fractions of each unit's fresh feed */
export const YIELDS = {
  lightEnds: { c2: 0.20, c3: 0.30, c4: 0.50 },
  nht: { h2: 0.0010, sourGas: 0.0060 },
  reformer: { h2: 0.021, c2: 0.024, c3: 0.033, c4: 0.044, reformate: 0.878, reformateSg: 0.795 },
  kht: { h2: 0.0025, product: 0.9920, wildNaphtha: 0.0045, sourGas: 0.0060 },
  dht: { h2: 0.0065, product: 0.9790, wildNaphtha: 0.0120, sourGas: 0.0155 },
  fcc: { dryGas: 0.040, c3: 0.053, c4: 0.099, gasoline: 0.476, lco: 0.190, slurry: 0.088, coke: 0.054, sg: { c3: 0.515, c4: 0.585, gasoline: 0.750, lco: 0.950, slurry: 1.070 } },
  lcoToDht: 1 / 3,
  /** SW-REF-7 */
  psaRecovery: 0.87, sulfurRemoved: { naphtha: 1, kerosene: 0.95, diesel: 0.99, fcc: 0.40 }, fccSulfurTo: { gasoline: 0.05, lco: 0.25, slurry: 0.20, flueGas: 0.10 }, swsSulfur: 100, sulfurRecovery: 0.96,
  /** SW-REF-8: the share of vacuum residue sold as asphalt, and of the four-carbon pool blended into gasoline */
  asphaltShare: 0.35, butaneToGasoline: 0.30,
} as const;

export interface Flow { w: number; sg: number }
const F = (w: number, sg: number): Flow => ({ w, sg });
export const flowBpd = (f: Flow) => bpd(f.w, f.sg);

export function balance() {
  const Y = YIELDS, cut = Object.fromEntries(CUTS.map(c => [c.key, { ...F(lbh((CRUDE_BPD * c.vol) / 100, c.sg), c.sg), s: (lbh((CRUDE_BPD * c.vol) / 100, c.sg) * c.sulfur) / 100 }])) as Record<string, Flow & { s: number }>;
  const crudeW = CUTS.reduce((a, c) => a + cut[c.key].w, 0), crudeSg = CUTS.reduce((a, c) => a + (c.vol / 100) * c.sg, 0), crudeS = CUTS.reduce((a, c) => a + cut[c.key].s, 0);
  const crude = { ...F(crudeW, crudeSg), api: 141.5 / crudeSg - 131.5, sulfurPct: (100 * crudeS) / crudeW };
  // unit 11 / 12
  const le = cut.LE.w, atmResid = F(cut.LVGO.w + cut.HVGO.w + cut.VR.w, (cut.LVGO.w + cut.HVGO.w + cut.VR.w) / (cut.LVGO.w / cut.LVGO.sg + cut.HVGO.w / cut.HVGO.sg + cut.VR.w / cut.VR.sg));
  // unit 17
  const fccFeedW = cut.AGO.w + cut.LVGO.w + cut.HVGO.w, fccFeed = F(fccFeedW, fccFeedW / (cut.AGO.w / cut.AGO.sg + cut.LVGO.w / cut.LVGO.sg + cut.HVGO.w / cut.HVGO.sg)), fccS = cut.AGO.s + cut.LVGO.s + cut.HVGO.s;
  const fcc = { feed: fccFeed, dryGas: fccFeedW * Y.fcc.dryGas, c3: F(fccFeedW * Y.fcc.c3, Y.fcc.sg.c3), c4: F(fccFeedW * Y.fcc.c4, Y.fcc.sg.c4), gasoline: F(fccFeedW * Y.fcc.gasoline, Y.fcc.sg.gasoline), lco: F(fccFeedW * Y.fcc.lco, Y.fcc.sg.lco), slurry: F(fccFeedW * Y.fcc.slurry, Y.fcc.sg.slurry), coke: fccFeedW * Y.fcc.coke };
  const lcoToDht = F(fcc.lco.w * Y.lcoToDht, fcc.lco.sg), lcoToFuelOil = F(fcc.lco.w - lcoToDht.w, fcc.lco.sg);
  // unit 15
  const kht = { feed: F(cut.KE.w, cut.KE.sg), h2: cut.KE.w * Y.kht.h2, product: F(cut.KE.w * Y.kht.product, cut.KE.sg), wildNaphtha: cut.KE.w * Y.kht.wildNaphtha, sourGas: cut.KE.w * Y.kht.sourGas };
  // unit 16
  const dhtFeedW = cut.DI.w + lcoToDht.w, dhtFeed = F(dhtFeedW, dhtFeedW / (cut.DI.w / cut.DI.sg + lcoToDht.w / lcoToDht.sg));
  const dht = { feed: dhtFeed, h2: dhtFeedW * Y.dht.h2, product: F(dhtFeedW * Y.dht.product, 0.845), wildNaphtha: dhtFeedW * Y.dht.wildNaphtha, sourGas: dhtFeedW * Y.dht.sourGas };
  // unit 13: straight-run naphthas and the wild naphthas; the wild naphthas leave with the heavy naphtha
  const wild = kht.wildNaphtha + dht.wildNaphtha, nhtFeedW = cut.LN.w + cut.HN.w + wild, liquidOut = nhtFeedW * (1 + Y.nht.h2 - Y.nht.sourGas);
  const nht = { feed: F(nhtFeedW, nhtFeedW / (cut.LN.w / cut.LN.sg + (cut.HN.w + wild) / cut.HN.sg)), h2: nhtFeedW * Y.nht.h2, sourGas: nhtFeedW * Y.nht.sourGas, lightNaphtha: F((liquidOut * cut.LN.w) / nhtFeedW, cut.LN.sg), heavyNaphtha: F((liquidOut * (cut.HN.w + wild)) / nhtFeedW, cut.HN.sg) };
  // unit 14
  const rf = nht.heavyNaphtha.w, reformer = { feed: nht.heavyNaphtha, h2: rf * Y.reformer.h2, c2: rf * Y.reformer.c2, c3: rf * Y.reformer.c3, c4: rf * Y.reformer.c4, reformate: F(rf * Y.reformer.reformate, Y.reformer.reformateSg) };
  // hydrogen (SW-REF-7): the naphtha and kerosene hydrotreaters take net gas as it comes; the diesel hydrotreater takes purified hydrogen
  const toPsa = reformer.h2 - nht.h2 - kht.h2, purified = toPsa * Y.psaRecovery, surplus = purified - dht.h2, psaTail = toPsa - purified;
  const h2 = { made: reformer.h2, madeMmscfd: mmscfd(reformer.h2, 2.016), nht: nht.h2, kht: kht.h2, dht: dht.h2, toPsa, purified, surplus, psaTail, surplusMmscfd: mmscfd(surplus, 2.016) };
  // sulfur (SW-REF-7): sulfur, lb/h, leaving each unit as hydrogen sulfide
  const lcoS = fccS * Y.fccSulfurTo.lco, sNht = (cut.LN.s + cut.HN.s) * Y.sulfurRemoved.naphtha, sKht = cut.KE.s * Y.sulfurRemoved.kerosene, sDht = (cut.DI.s + lcoS * Y.lcoToDht) * Y.sulfurRemoved.diesel, sFcc = fccS * Y.sulfurRemoved.fcc;
  const toSru = sNht + sKht + sDht + sFcc + Y.swsSulfur, recovered = toSru * Y.sulfurRecovery, H2S = 34.08 / 32.06;
  const sulfur = { inCrude: crudeS, nht: sNht, kht: sKht, dht: sDht, fcc: sFcc, sws: Y.swsSulfur, toSru, recovered, longTonsPerDay: (recovered * 24) / 2240, tailGas: toSru - recovered, flueGas: fccS * Y.fccSulfurTo.flueGas, h2sMass: toSru * H2S };
  // product pools (SW-REF-8)
  const c3 = F(le * Y.lightEnds.c3 + reformer.c3 + fcc.c3.w, 0.51), c4w = le * Y.lightEnds.c4 + reformer.c4 + fcc.c4.w, c4 = F(c4w * (1 - Y.butaneToGasoline), 0.585), butaneToGasoline = F(c4w * Y.butaneToGasoline, 0.585);
  const gasW = nht.lightNaphtha.w + reformer.reformate.w + fcc.gasoline.w + butaneToGasoline.w;
  const gasoline = F(gasW, gasW / (nht.lightNaphtha.w / nht.lightNaphtha.sg + reformer.reformate.w / reformer.reformate.sg + fcc.gasoline.w / fcc.gasoline.sg + butaneToGasoline.w / butaneToGasoline.sg));
  const asphalt = F(cut.VR.w * Y.asphaltShare, cut.VR.sg), foW = cut.VR.w * (1 - Y.asphaltShare) + lcoToFuelOil.w + fcc.slurry.w;
  const fuelOil = F(foW, foW / ((cut.VR.w * (1 - Y.asphaltShare)) / cut.VR.sg + lcoToFuelOil.w / lcoToFuelOil.sg + fcc.slurry.w / fcc.slurry.sg));
  // fuel gas: every gas stream less the hydrogen sulfide taken out of it by amine, plus the hydrogen not used. The
  // hydrogen sulfide (the sulfur and the hydrogen it took up) leaves the hydrocarbon balance for the sulfur block.
  const gasIn = le * Y.lightEnds.c2 + nht.sourGas + kht.sourGas + dht.sourGas + fcc.dryGas + reformer.c2 + surplus + psaTail;
  const h2sOut = (sNht + sKht + sDht + sFcc) * H2S, fuelGas = gasIn - h2sOut;
  const products = { c3, c4, gasoline, jet: kht.product, diesel: dht.product, fuelOil, asphalt, sulfur: recovered, fuelGas, coke: fcc.coke };
  // closure: crude in = products out, the stripper gas's sulfur (counted into the sulfur unit from the water) set aside
  const out = c3.w + c4.w + gasoline.w + kht.product.w + dht.product.w + fuelOil.w + asphalt.w + fuelGas + fcc.coke + h2sOut;
  return { crude, cut, atmResid, fcc, lcoToDht, lcoToFuelOil, kht, dht, nht, reformer, h2, sulfur, products, closure: (out - crudeW) / crudeW };
}
export type Balance = ReturnType<typeof balance>;
