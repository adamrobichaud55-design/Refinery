/**
 * Units 20 to 26: tank farm, marine terminal, truck loading, wastewater treatment, flare and fire water
 * (DESIGN_BASIS.md §74, SW-REF-9, SW-REF-10). Drawing data: SmartWeld's own demonstration schemes (PROVENANCE P-79).
 * Tank volumes follow from days of each stream's rate (SW-REF-9, SW-PRC-13).
 */
import { UnitBuilder, type UnitSheet, type Flow, type EqKind } from '../flowsheet';
import { liquid, vapour, bpd, lbh } from '../fluids';
import type { Balance } from '../balance';
import { CRUDE_BPD } from '../balance';
import { SOUR_WATER, STRIPPED_TO } from './sulfur';

/** SW-PRC-13: gross volume of each tank, barrels, for a rate held for some days in `count` tanks */
export const tankBbl = (bpdRate: number, days: number, count: number) => (bpdRate * days) / 0.85 / count;
/** rates while a transfer runs, barrels a day: a tanker discharging, a product cargo loading, a truck rack's bays (SW-REF-10) */
export const RATE = { crudeShip: 600000, gasolineShip: 240000, jetShip: 120000, dieselShip: 240000, fuelOilShip: 180000, truck: 20000, asphaltTruck: 15000, gasTruck: 6000 } as const;
/** water and oil reaching the wastewater plant apart from brine and stripped water, lb/h */
export const WASTE = { tankFarm: 6000, sewer: 30000, skimmedOil: 800 } as const;
/** the largest relief load the flare is sized for, lb/h; and the fire water demand, US gallons a minute */
export const RELIEF_LBH = 400000, FIRE_GPM = 6000;

export interface Storage { unit: 20 | 21; tags: string[]; service: string; fluid: string; sg: number; bpd: number; days: number; roof: 'floating' | 'cone'; heated?: boolean }
/** SW-REF-9: what is stored, for how long, in how many tanks */
export function storage(B: Balance): Storage[] {
  const c = B.cut, P = B.products, f = (x: { w: number; sg: number }) => bpd(x.w, x.sg);
  const sr = c.LE.w * 0.8 + c.LN.w + c.HN.w, cutter = B.lcoToFuelOil.w + B.fcc.slurry.w;
  return [
    { unit: 20, tags: ['T-2001', 'T-2002', 'T-2003', 'T-2004', 'T-2005'], service: 'Crude oil', fluid: 'CR', sg: B.crude.sg, bpd: CRUDE_BPD, days: 14, roof: 'floating' },
    { unit: 21, tags: ['T-2101'], service: 'Straight-run naphtha (unit 13 feed)', fluid: 'NA', sg: 0.72, bpd: bpd(sr, 0.72), days: 3, roof: 'floating' },
    { unit: 21, tags: ['T-2102'], service: 'Heavy naphtha (unit 14 feed)', fluid: 'NA', sg: B.reformer.feed.sg, bpd: f(B.reformer.feed), days: 3, roof: 'floating' },
    { unit: 21, tags: ['T-2103'], service: 'Diesel (unit 16 feed)', fluid: 'DI', sg: c.DI.sg, bpd: f(c.DI), days: 3, roof: 'cone' },
    { unit: 21, tags: ['T-2104'], service: 'Gas oil (unit 17 feed)', fluid: 'GO', sg: B.fcc.feed.sg, bpd: f(B.fcc.feed), days: 3, roof: 'cone', heated: true },
    { unit: 21, tags: ['T-2105'], service: 'Light naphtha', fluid: 'NA', sg: B.nht.lightNaphtha.sg, bpd: f(B.nht.lightNaphtha), days: 4, roof: 'floating' },
    { unit: 21, tags: ['T-2106'], service: 'Reformate', fluid: 'RF', sg: B.reformer.reformate.sg, bpd: f(B.reformer.reformate), days: 4, roof: 'floating' },
    { unit: 21, tags: ['T-2107'], service: 'Cracked gasoline', fluid: 'GS', sg: B.fcc.gasoline.sg, bpd: f(B.fcc.gasoline), days: 4, roof: 'floating' },
    { unit: 21, tags: ['T-2108', 'T-2109', 'T-2110'], service: 'Gasoline', fluid: 'GS', sg: P.gasoline.sg, bpd: f(P.gasoline), days: 10, roof: 'floating' },
    { unit: 21, tags: ['T-2111', 'T-2112'], service: 'Jet fuel', fluid: 'KE', sg: P.jet.sg, bpd: f(P.jet), days: 10, roof: 'cone' },
    { unit: 21, tags: ['T-2113', 'T-2114'], service: 'Diesel', fluid: 'DI', sg: P.diesel.sg, bpd: f(P.diesel), days: 10, roof: 'cone' },
    { unit: 21, tags: ['T-2115', 'T-2116'], service: 'Heavy fuel oil', fluid: 'RS', sg: P.fuelOil.sg, bpd: f(P.fuelOil), days: 12, roof: 'cone', heated: true },
    { unit: 21, tags: ['T-2117', 'T-2118'], service: 'Asphalt', fluid: 'RS', sg: P.asphalt.sg, bpd: f(P.asphalt), days: 20, roof: 'cone', heated: true },
    { unit: 21, tags: ['T-2119'], service: 'Fuel oil cutter stock', fluid: 'DI', sg: 0.98, bpd: bpd(cutter, 0.98), days: 3, roof: 'cone', heated: true },
    { unit: 21, tags: ['T-2120', 'T-2121'], service: 'Slop oil', fluid: 'OW', sg: 0.85, bpd: 0.02 * CRUDE_BPD, days: 5, roof: 'cone' },
  ];
}
const st = (S: Storage[], tag: string) => { const s = S.find(x => x.tags.includes(tag)); if (!s) throw new Error(`no storage ${tag}`); return s; };
function tanks(u: UnitBuilder, S: Storage[]) {
  for (const s of S.filter(x => x.unit === u.sheet.no)) for (const t of s.tags) u.item(t, 'tank', `${s.service} tank`, { bbl: Math.round(tankBbl(s.bpd, s.days, s.tags.length)), days: s.days, roof: s.roof, fluid: s.fluid, ...(s.heated ? { heated: 1 } : {}) });
}
/** fill the tanks of one service from a rundown: the line runs to the first tank and the others branch from it, one tank receiving at a time */
function fill(f: Flow, tags: string[], kind: EqKind = 'tank', cv = false) {
  const others = tags.slice(1).map(() => f.alt());
  f.into(tags[0], 'inlet', { kind, cv }); others.forEach((b, i) => b.into(tags[i + 1], 'inlet', { kind, cv }));
}
/** draw one service's tanks to a pump: the first tank's outlet runs to the pump suction and the others join that line */
function draw(u: UnitBuilder, tags: string[], fluid: string, w: number, sg: number, T: number, pump: string, P: number, service: string, o: { count?: number; port?: string; Ps?: number } = {}): Flow {
  const port = o.port ?? 'outlet', s = liquid(fluid, w, sg, T, o.Ps ?? 5), f = u.out(tags[0], port, s).pump(pump, P, service, o.count ? { count: o.count } : {});
  for (const t of tags.slice(1)) u.out(t, port, s).mixInto(f, `${t} into the suction line of ${pump}`, { slow: true });
  return f;
}
/** steam coils of the heated tanks */
const coils = (u: UnitBuilder, tags: string[]) => { for (const t of tags) { u.utility('LS', t, 'heating coil in', 'to', 2500, 300, 50); u.utility('CO', t, 'heating coil out', 'from', 2500, 260, 40); } };

export function unit20(B: Balance): UnitSheet {
  const u = new UnitBuilder(20, 'Crude tank farm'), S = storage(B), crude = st(S, 'T-2001'), sg = B.crude.sg;
  tanks(u, S);
  fill(u.feed('crude from the marine terminal', liquid('CR', lbh(RATE.crudeShip, sg), sg, 60, 90)), crude.tags);
  const f = draw(u, crude.tags, 'CR', B.crude.w, sg, 60, 'P-2001', 60, 'Crude booster pump', { count: 3 });
  f.toBL('crude');
  u.feed('slop oil to crude', liquid('OW', 4000, 0.85, 80, 80)).mixInto(f, 'recovered slop into the crude charge line', { standby: true });
  // water settled out of the crude is drawn from the tank bottoms to the wastewater plant
  draw(u, crude.tags, 'OW', WASTE.tankFarm, 1, 60, 'P-2002', 50, 'Tank water draw pump', { port: 'water draw' }).toBL('tank farm oily water');
  return u.done();
}

export function unit21(B: Balance): UnitSheet {
  const u = new UnitBuilder(21, 'Intermediate and product tank farm'), S = storage(B), c = B.cut, P = B.products, X = B.fcc;
  tanks(u, S);
  // unit feeds: each tank stands on the line between two units, taking the rundown when the unit downstream is down and feeding it when the unit upstream is
  const hold = (tag: string, keyIn: string, keyOut: string, fluid: string, w: number, sg: number, T: number, pump: string, service: string, P2: number) => {
    u.feed(keyIn, liquid(fluid, w, sg, T, 50)).into(tag, 'inlet', { kind: 'tank' });
    u.out(tag, 'outlet', liquid(fluid, w, sg, T, 5)).pump(pump, P2, service).toBL(keyOut, { cv: true });
  };
  hold('T-2101', 'straight-run naphtha', 'straight-run naphtha', 'NA', c.LE.w * 0.8 + c.LN.w + c.HN.w, 0.72, 100, 'P-2101', 'Naphtha feed pump', 130);
  hold('T-2102', 'heavy naphtha to storage', 'heavy naphtha from storage', 'NA', B.reformer.feed.w, B.reformer.feed.sg, 140, 'P-2102', 'Reformer feed pump', 80);
  hold('T-2103', 'straight-run diesel', 'straight-run diesel', 'DI', c.DI.w, c.DI.sg, 140, 'P-2103', 'Diesel feed pump', 100);
  hold('T-2104', 'light vacuum gas oil', 'light vacuum gas oil', 'GO', c.LVGO.w, c.LVGO.sg, 150, 'P-2104', 'Gas oil feed pump', 100);
  // gasoline: each component runs down to its tank and is pumped, with butane, into the blend header that fills the gasoline tanks
  const comp = (tag: string, key: string, fluid: string, w: number, sg: number, pump: string, service: string) => {
    u.feed(key, liquid(fluid, w, sg, 100, 50)).into(tag, 'inlet', { kind: 'tank' });
    return u.out(tag, 'outlet', liquid(fluid, w, sg, 90, 5)).pump(pump, 90, service);
  };
  const blend = comp('T-2107', 'cracked gasoline', 'GS', X.gasoline.w, X.gasoline.sg, 'P-2107', 'Cracked gasoline blend pump'), gas = st(S, 'T-2108');
  fill(blend.set({ w: P.gasoline.w, sg: P.gasoline.sg }), gas.tags);
  comp('T-2106', 'reformate', 'RF', B.reformer.reformate.w, B.reformer.reformate.sg, 'P-2106', 'Reformate blend pump').mixInto(blend, 'reformate into the gasoline blend header');
  comp('T-2105', 'light naphtha', 'NA', B.nht.lightNaphtha.w, B.nht.lightNaphtha.sg, 'P-2105', 'Light naphtha blend pump').mixInto(blend, 'light naphtha into the gasoline blend header');
  // liquefied gas: spheres for the rundown, bullets at the truck rack
  const c4all = P.c4.w / 0.7, c4sg = P.c4.sg;                                                            // the four-carbon pool, 30 % of it blended into gasoline (SW-REF-8)
  u.item('S-2101', 'sphere', 'Three-carbon liquefied gas sphere', { bbl: Math.round(tankBbl(bpd(P.c3.w, P.c3.sg), 5, 1)), days: 5, fluid: 'LP' });
  for (const t of ['S-2102', 'S-2103']) u.item(t, 'sphere', 'Four-carbon liquefied gas sphere', { bbl: Math.round(tankBbl(bpd(c4all, c4sg), 5, 2)), days: 5, fluid: 'LP' });
  u.item('S-2104', 'bullet', 'Three-carbon loading bullet', { bbl: 800, fluid: 'LP' }); u.item('S-2105', 'bullet', 'Four-carbon loading bullet', { bbl: 800, fluid: 'LP' });
  u.feed('three-carbon liquefied gas', liquid('LP', P.c3.w, P.c3.sg, 110, 240)).into('S-2101', 'inlet', { kind: 'sphere' });
  fill(u.feed('four-carbon liquefied gas', liquid('LP', c4all, c4sg, 100, 200)), ['S-2102', 'S-2103'], 'sphere');
  draw(u, ['S-2102', 'S-2103'], 'LP', c4all - P.c4.w, c4sg, 90, 'P-2110', 180, 'Butane blend pump', { Ps: 60 }).mixInto(blend, 'butane into the gasoline blend header');
  u.out('S-2101', 'outlet', liquid('LP', lbh(RATE.gasTruck, P.c3.sg), P.c3.sg, 90, 180)).pump('P-2108', 255, 'Three-carbon transfer pump').into('S-2104', 'inlet', { kind: 'bullet', cv: true });
  draw(u, ['S-2102', 'S-2103'], 'LP', lbh(RATE.gasTruck, c4sg), c4sg, 90, 'P-2109', 200, 'Four-carbon transfer pump', { port: 'transfer outlet', Ps: 60 }).into('S-2105', 'inlet', { kind: 'bullet', cv: true });
  u.out('S-2104', 'outlet', liquid('LP', lbh(RATE.gasTruck, P.c3.sg), P.c3.sg, 90, 180)).pump('P-2111', 255, 'Three-carbon loading pump').toBL('three-carbon liquefied gas to loading', { cv: true });
  u.out('S-2105', 'outlet', liquid('LP', lbh(RATE.gasTruck, c4sg), c4sg, 90, 60)).pump('P-2112', 220, 'Four-carbon loading pump').toBL('four-carbon liquefied gas to loading', { cv: true });
  // finished products: rundown to tanks; shipping pumps to the marine terminal, loading pumps to the truck rack
  const ship = (tags: string[], fluid: string, sg: number, T: number, pump: string, name: string, rate: number, P2 = 150) =>
    draw(u, tags, fluid, lbh(rate, sg), sg, T, pump, P2, `${name} shipping pump`).toBL(`${name.toLowerCase()} to the marine terminal`);
  const truck = (tags: string[], fluid: string, sg: number, T: number, pump: string, name: string, rate: number = RATE.truck) =>
    draw(u, tags, fluid, lbh(rate, sg), sg, T, pump, 90, `${name} truck loading pump`, { port: 'truck outlet' }).toBL(`${name.toLowerCase()} to truck loading`, { cv: true });
  ship(gas.tags, 'GS', P.gasoline.sg, 90, 'P-2121', 'Gasoline', RATE.gasolineShip); truck(gas.tags, 'GS', P.gasoline.sg, 90, 'P-2131', 'Gasoline');
  fill(u.feed('treated kerosene', liquid('KE', P.jet.w, P.jet.sg, 100, 50)), ['T-2111', 'T-2112']);
  ship(['T-2111', 'T-2112'], 'KE', P.jet.sg, 90, 'P-2122', 'Jet fuel', RATE.jetShip); truck(['T-2111', 'T-2112'], 'KE', P.jet.sg, 90, 'P-2132', 'Jet fuel');
  fill(u.feed('treated diesel', liquid('DI', P.diesel.w, P.diesel.sg, 110, 50)), ['T-2113', 'T-2114']);
  ship(['T-2113', 'T-2114'], 'DI', P.diesel.sg, 90, 'P-2123', 'Diesel', RATE.dieselShip); truck(['T-2113', 'T-2114'], 'DI', P.diesel.sg, 90, 'P-2133', 'Diesel');
  // black oils: vacuum residue to asphalt tanks, and with cutter stock through a cooler to the fuel oil tanks
  const vr = u.feed('vacuum residue rundown', liquid('RS', c.VR.w, c.VR.sg, 350, 100)), toAsphalt = vr.split(P.asphalt.w);
  vr.set({ w: P.fuelOil.w, sg: P.fuelOil.sg, T: 290 }).air('A-2101', 200, 'Fuel oil rundown cooler');
  const rundown = vr.lastLine;
  fill(vr, ['T-2115', 'T-2116']); fill(toAsphalt, ['T-2117', 'T-2118']);
  const cut = u.feed('light cycle oil to fuel oil', liquid('DI', B.lcoToFuelOil.w, B.lcoToFuelOil.sg, 140, 60)); cut.into('T-2119', 'inlet', { kind: 'tank' });
  u.feed('slurry oil', liquid('SL', X.slurry.w, X.slurry.sg, 200, 60)).mixInto(cut, 'slurry oil into the cutter stock rundown');
  u.out('T-2119', 'outlet', liquid('DI', B.lcoToFuelOil.w + X.slurry.w, 0.98, 150, 5)).pump('P-2119', 140, 'Cutter stock blend pump').mixInto(rundown, 'cutter stock into the residue ahead of the cooler, under flow control', { cv: true });   // SW-PRC-2: the blend pump's blocked-in pressure then stops at its own valve, and the rundown line from the crude unit keeps its own
  ship(['T-2115', 'T-2116'], 'RS', P.fuelOil.sg, 200, 'P-2124', 'Fuel oil', RATE.fuelOilShip, 160);
  truck(['T-2117', 'T-2118'], 'RS', P.asphalt.sg, 320, 'P-2125', 'Asphalt', RATE.asphaltTruck);
  coils(u, ['T-2104', 'T-2115', 'T-2116', 'T-2117', 'T-2118', 'T-2119']);
  // slop: collected from every unit, returned slowly to the crude
  fill(u.feed('slop oil', liquid('OW', 30000, 0.85, 100, 40)), ['T-2120', 'T-2121']);
  draw(u, ['T-2120', 'T-2121'], 'OW', 4000, 0.85, 80, 'P-2120', 100, 'Slop oil return pump').toBL('slop oil to crude', { cv: true });
  return u.done();
}

export function unit22(B: Balance): UnitSheet {
  const u = new UnitBuilder(22, 'Marine terminal'), P = B.products, sg = B.crude.sg, arm = lbh(RATE.crudeShip, sg) / 3;
  for (const t of ['X-2201', 'X-2202', 'X-2203']) u.item(t, 'loading', 'Crude unloading arm', { marine: 1 });
  u.item('X-2204', 'loading', 'Gasoline and jet fuel loading arm', { marine: 1 }); u.item('X-2205', 'loading', 'Diesel loading arm', { marine: 1 }); u.item('X-2206', 'loading', 'Fuel oil loading arm', { marine: 1 });
  u.item('D-2201', 'drum', 'Jetty slop drum', { holdMin: 30 });
  const a = u.out('X-2201', 'outlet', liquid('CR', arm, sg, 60, 120)); a.toBL('crude from the marine terminal');
  for (const t of ['X-2202', 'X-2203']) u.out(t, 'outlet', liquid('CR', arm, sg, 60, 120)).mixInto(a, `${t} into the crude unloading line`);
  const white = u.feed('gasoline to the marine terminal', liquid('GS', lbh(RATE.gasolineShip, P.gasoline.sg), P.gasoline.sg, 90, 120)); white.into('X-2204', 'inlet', { kind: 'loading' });
  u.feed('jet fuel to the marine terminal', liquid('KE', lbh(RATE.jetShip, P.jet.sg), P.jet.sg, 90, 120)).mixInto(white, 'jet fuel into the white products arm manifold');
  u.feed('diesel to the marine terminal', liquid('DI', lbh(RATE.dieselShip, P.diesel.sg), P.diesel.sg, 90, 120)).into('X-2205', 'inlet', { kind: 'loading' });
  u.feed('fuel oil to the marine terminal', liquid('RS', lbh(RATE.fuelOilShip, P.fuelOil.sg), P.fuelOil.sg, 200, 130)).into('X-2206', 'inlet', { kind: 'loading' });
  ['X-2201', 'X-2204', 'X-2205', 'X-2206'].forEach((t, i) => u.out(t, 'drain', liquid('OW', 500, 0.85, 60, 2)).into('D-2201', `inlet ${i + 1}`, { slow: true }));
  u.out('D-2201', 'outlet', liquid('OW', 2000, 0.85, 60, 2)).pump('P-2201', 100, 'Jetty slop pump').toBL('slop oil', { cv: true });
  return u.done();
}

export function unit23(B: Balance): UnitSheet {
  const u = new UnitBuilder(23, 'Truck loading'), P = B.products;
  const bay = (tag: string, service: string, key: string, fluid: string, rate: number, sg: number, T: number, Pin: number) => {
    u.item(tag, 'loading', service); u.feed(key, liquid(fluid, lbh(rate, sg), sg, T, Pin)).into(tag, 'inlet', { kind: 'loading', cv: true });
  };
  bay('X-2301', 'Gasoline loading bays', 'gasoline to truck loading', 'GS', RATE.truck, P.gasoline.sg, 90, 70);
  bay('X-2302', 'Jet fuel loading bay', 'jet fuel to truck loading', 'KE', RATE.truck, P.jet.sg, 90, 70);
  bay('X-2303', 'Diesel loading bays', 'diesel to truck loading', 'DI', RATE.truck, P.diesel.sg, 90, 70);
  bay('X-2304', 'Asphalt loading bay', 'asphalt to truck loading', 'RS', RATE.asphaltTruck, P.asphalt.sg, 320, 70);
  bay('X-2305', 'Three-carbon liquefied gas loading bay', 'three-carbon liquefied gas to loading', 'LP', RATE.gasTruck, P.c3.sg, 90, 240);
  bay('X-2306', 'Four-carbon liquefied gas loading bay', 'four-carbon liquefied gas to loading', 'LP', RATE.gasTruck, P.c4.sg, 90, 200);
  u.item('D-2301', 'drum', 'Loading rack drain drum', { holdMin: 30 });
  ['X-2301', 'X-2302', 'X-2303'].forEach((t, i) => u.out(t, 'drain', liquid('OW', 300, 0.8, 80, 2)).into('D-2301', `inlet ${i + 1}`, { slow: true }));
  u.out('D-2301', 'outlet', liquid('OW', 900, 0.8, 80, 2)).pump('P-2301', 80, 'Rack drain pump').toBL('slop oil', { cv: true });
  return u.done();
}

/** stripped water not reused as wash water, lb/h: sour water less the gas stripped from it and the water returned */
export const strippedToWaste = () => Object.values(SOUR_WATER).reduce((a, b) => a + b, 0) - 600 - Object.values(STRIPPED_TO).reduce((a, b) => a + b, 0);

export function unit24(B: Balance): UnitSheet {
  const u = new UnitBuilder(24, 'Wastewater treatment');
  const streams: [string, number, number][] = [['desalter brine', STRIPPED_TO[11], 110], ['stripped water to wastewater', strippedToWaste(), 120], ['tank farm oily water', WASTE.tankFarm, 60], ['cooling tower blowdown', 40000, 85], ['boiler blowdown', 5000, 212]];
  const total = streams.reduce((a, [, w]) => a + w, 0) + WASTE.sewer;
  u.item('X-2401', 'basin', 'Gravity separator, two channels'); u.item('T-2401', 'tank', 'Recovered oil tank', { bbl: 2000, roof: 'cone', fluid: 'OW' }); u.item('T-2402', 'tank', 'Equalisation tank', { bbl: 30000, roof: 'cone', fluid: 'OW' });
  u.item('X-2403', 'basin', 'Aeration basin'); u.item('X-2404', 'basin', 'Clarifier'); u.item('K-2401', 'blower', 'Aeration blower');
  const inlet = u.feed(streams[0][0], liquid('OW', streams[0][1], 1.02, 110, 40)); inlet.into('X-2401', 'inlet', { kind: 'basin' });
  for (const [k, w, T] of streams.slice(1)) u.feed(k, liquid('OW', w, 1, T, 30)).mixInto(inlet, `${k} into the separator inlet line`);
  u.open('X-2401', 'oily water sewer', 'in', liquid('OW', WASTE.sewer, 1, 70, 0));
  u.out('X-2401', 'skimmed oil', liquid('OW', WASTE.skimmedOil, 0.88, 90, 1)).pump('P-2402', 60, 'Skimmed oil pump').into('T-2401', 'inlet', { kind: 'tank' });
  u.out('T-2401', 'outlet', liquid('OW', WASTE.skimmedOil, 0.88, 90, 3)).pump('P-2406', 80, 'Recovered oil pump').toBL('slop oil', { cv: true });
  u.out('X-2401', 'water', liquid('OW', total, 1, 90, 1)).pump('P-2401', 50, 'Separator effluent pump').into('T-2402', 'inlet', { kind: 'tank' });
  u.out('T-2402', 'outlet', liquid('OW', total, 1, 90, 3)).pump('P-2403', 50, 'Flotation feed pump').thru('X-2402', 'package', 'Dissolved air flotation unit').into('X-2403', 'inlet', { kind: 'basin', cv: true });
  u.open('K-2401', 'intake', 'in', vapour('AIR', 9000, 29, 60, 0)); u.out('K-2401', 'discharge', vapour('PA', 9000, 29, 180, 8)).into('X-2403', 'air', { kind: 'basin' });
  u.out('X-2403', 'outlet', liquid('PW', 1.3 * total, 1, 90, 1)).into('X-2404', 'inlet', { kind: 'basin', slow: true });
  u.out('X-2404', 'sludge', liquid('OW', 0.3 * total, 1.01, 90, 1)).pump('P-2404', 30, 'Return sludge pump').into('X-2403', 'return sludge', { kind: 'basin', cv: true });
  u.out('X-2404', 'effluent', liquid('PW', total, 1, 90, 1)).pump('P-2405', 40, 'Treated effluent pump').toBL('treated effluent', { cv: true });
  void B;
  return u.done();
}

export function unit25(B: Balance): UnitSheet {
  const u = new UnitBuilder(25, 'Flare');
  u.item('D-2501', 'drum', 'Flare knock-out drum', { knockOut: 1 }); u.item('D-2502', 'drum', 'Flare water seal drum', { knockOut: 1 }); u.item('X-2501', 'flare', 'Flare stack, derrick supported');
  u.feed('flare header', vapour('FL', RELIEF_LBH, 44, 250, 8)).into('D-2501', 'inlet');
  u.out('D-2501', 'gas', vapour('FL', RELIEF_LBH, 44, 240, 6)).into('D-2502', 'inlet');
  u.out('D-2502', 'gas', vapour('FL', RELIEF_LBH, 44, 230, 3)).into('X-2501', 'inlet', { kind: 'flare' });
  u.out('D-2501', 'liquid', liquid('OW', 30000, 0.75, 150, 6)).pump('P-2501', 80, 'Knock-out drum pump').toBL('slop oil', { cv: true });
  u.utility('RW', 'D-2502', 'seal water in', 'to', 2000, 60, 60); u.utility('FG', 'X-2501', 'pilot gas', 'to', 200, 100, 50); u.utility('MS', 'X-2501', 'smokeless steam', 'to', 20000, 400, 150);
  void B;
  return u.done();
}

export function unit26(B: Balance): UnitSheet {
  const u = new UnitBuilder(26, 'Fire water'), rate = FIRE_GPM * 60 * 8.345;                              // lb/h of water at 8.345 lb a gallon (K-5 × 231 / 1728)
  for (const t of ['T-2601', 'T-2602']) u.item(t, 'tank', 'Fire water tank', { bbl: Math.round((FIRE_GPM * 60 * 4) / 42), roof: 'cone', fluid: 'FW' });
  fill(u.feed('fire water make-up', liquid('RW', 250000, 1, 50, 40)), ['T-2601', 'T-2602'], 'tank', true);   // each tank kept full by its level valve: the make-up line arrives at the service water pump's blocked-in pressure (SW-PRC-2), and the tanks' connections are past the valves
  // three pumps, two engine driven and one motor driven, any two of which give the demand; jockey pumps hold the ring main's pressure
  const main = draw(u, ['T-2601', 'T-2602'], 'FW', rate, 1, 50, 'P-2601', 150, 'Fire water pump (two engine driven, one motor driven)', { count: 3 });
  main.toBL('fire water ring main');
  draw(u, ['T-2601', 'T-2602'], 'FW', 25000, 1, 50, 'P-2602', 160, 'Jockey pump', { port: 'jockey outlet' }).mixInto(main, 'jockey pump into the ring main supply', { standby: true });
  void B;
  return u.done();
}
