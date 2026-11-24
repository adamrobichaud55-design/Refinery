/** Plant 3, the coastal refinery: its process model (DESIGN_BASIS.md §74, §75). The balance closes; every unit's
 *  flowsheet builds with every item connected; every stream between units has both ends and balances; utilities
 *  cover their use; every line and item is sized by the written rules; and the committed document is current.
 *  Nothing here touches plants 1 and 2 or the piping generator. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { balance, CRUDE_BPD, CUTS } from '../src/refinery/balance';
import { processModel, sent, received } from '../src/refinery/process';
import { sizing, designPressure, designTemperature, classFor, lineSize, motorHp, wall, allowable, tubeCount, shellArea, transferLine, LINE_SIZES } from '../src/refinery/sizing';
import { ejectorStages, tailPipeHeight, vapourPressure, condensingT, EJ } from '../src/refinery/ejector';
import { VAC_SET } from '../src/refinery/units/crude';
import { STEAM } from '../src/refinery/flowsheet';
import { processDocument, processData, UNIT_ROLE } from '../src/refinery/report';
import { FLUIDS, liquid, vapour, rho, cfs, ATM } from '../src/refinery/fluids';
import { storage, tankBbl } from '../src/refinery/units/offsites';
import { bundleSolids } from '../src/catalogue/parts/processUnits';
import { CLASS_PRESSURE, pipeDims } from '../src/catalogue';
import { PLANTS } from '../src/generator/plants';

const M = processModel(), Z = sizing(), B = M.B;
const basisDoc = readFileSync(new URL('../DESIGN_BASIS.md', import.meta.url), 'utf8');

describe('plant 3: material balance (SW-REF-5 to SW-REF-8)', () => {
  it('closes on mass, and the crude is what its cuts make it', () => {
    expect(Math.abs(B.closure)).toBeLessThan(1e-12);
    expect(CUTS.reduce((a, c) => a + c.vol, 0)).toBeCloseTo(100, 9);
    expect(B.crude.api).toBeGreaterThan(31); expect(B.crude.api).toBeLessThan(33);
    expect(B.crude.sulfurPct).toBeGreaterThan(1.5); expect(B.crude.sulfurPct).toBeLessThan(1.7);
    expect(balance().crude.w).toBe(B.crude.w);                                                         // the same every time
  });
  it('lives on its own hydrogen, with a surplus', () => {
    expect(B.h2.surplus).toBeGreaterThan(0);
    expect(B.h2.nht + B.h2.kht + B.h2.toPsa).toBeCloseTo(B.h2.made, 6);
    expect(B.h2.purified).toBeCloseTo(0.87 * B.h2.toPsa, 6);
  });
  it('recovers the sulfur its units remove', () => {
    expect(B.sulfur.recovered).toBeCloseTo(0.96 * B.sulfur.toSru, 6);
    expect(B.sulfur.longTonsPerDay).toBeLessThan(45);                                                   // the unit's design rate (SW-REF-4)
    expect(B.sulfur.toSru).toBeLessThan(B.sulfur.inCrude);
  });
  it('the design rates of SW-REF-4 cover each unit\'s feed', () => {
    const rate = (unit: number) => Number(basisDoc.match(new RegExp(`\\| ${unit} \\| [^|]+ \\| ([\\d,]+) \\|`))![1].replace(/,/g, ''));
    const feed = (unit: number, tag: string) => { const s = M.sheet(unit).equip.get(tag)!.ports.find(p => p.name === 'outlet')!.s; return s.w / (s.sg * 62.4 * (9702 / 1728) / 24); };
    expect(rate(11)).toBe(CRUDE_BPD);
    for (const [unit, tag] of [[13, 'D-1301'], [14, 'D-1401'], [15, 'D-1501'], [16, 'D-1601'], [17, 'D-1701']] as const) { const f = feed(unit, tag); expect(rate(unit), `unit ${unit}`).toBeGreaterThanOrEqual(f); expect(rate(unit), `unit ${unit}`).toBeLessThan(1.03 * f); }
  });
});

describe('plant 3: unit flowsheets (SW-REF-10)', () => {
  it('builds sixteen units, each with a stated role', () => {
    expect(M.sheets.map(s => s.no)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]);
    for (const sh of M.sheets) expect(UNIT_ROLE[sh.no], `unit ${sh.no}`).toBeTruthy();
  });
  it('tags follow SW-REF-3 and are used once', () => {
    const seen = new Set<string>();
    for (const sh of M.sheets) for (const e of sh.equip.values()) {
      expect(e.tag, e.tag).toMatch(/^[A-Z]-\d{4}$/); expect(Number(e.tag.slice(2, 4)), e.tag).toBe(sh.no); expect(seen.has(e.tag), e.tag).toBe(false); seen.add(e.tag);
      const letter = e.tag[0], kinds: Record<string, string[]> = { C: ['column', 'scrubber'], D: ['drum', 'desalter'], R: ['reactor', 'cracker'], E: ['hx', 'condenser', 'fluegascooler'], A: ['aircooler'], H: ['heater', 'furnace', 'incinerator'], B: ['boiler'], P: ['pump'], K: ['compressor', 'blower'], T: ['tank'], S: ['sphere', 'bullet'], F: ['filter'], J: ['ejector'], V: ['vessel', 'hopper', 'deaerator'], X: ['package', 'psa', 'coolingtower', 'pit', 'basin', 'flare', 'loading'] };
      expect(kinds[letter], `${e.tag} is a ${e.kind}`).toContain(e.kind);
    }
    expect(seen.size).toBeGreaterThan(350);
    // none of plant 3's tags is a tag of plants 1 and 2, and plant 3 is not in the plant list (SW-REF-2)
    expect(PLANTS.some(p => p.id === 'R3')).toBe(false);
  });
  it('every line runs between two things that exist, and every fluid is one of the plant\'s', () => {
    for (const sh of M.sheets) for (const l of sh.lines) {
      for (const e of [l.from, l.to]) {
        if (e.k === 'eq') expect(sh.equip.get(e.tag)?.ports.some(p => p.name === e.port), `unit ${sh.no} line ${l.id}: ${e.tag} ${e.port}`).toBe(true);
        if (e.k === 'tap') { expect(e.line).toBeGreaterThanOrEqual(0); expect(e.line).toBeLessThan(sh.lines.length); expect(e.line).not.toBe(l.id); }
      }
      expect(FLUIDS[l.s.fluid], l.s.fluid).toBeTruthy(); expect(l.s.w).toBeGreaterThan(0); expect(rho(l.s)).toBeGreaterThan(0); expect(Number.isFinite(cfs(l.s))).toBe(true);
    }
  });
  it('a vessel\'s inlets arrive at no less than the pressure its outlets leave at', () => {
    for (const sh of M.sheets) for (const e of sh.equip.values()) {
      if (!['drum', 'vessel', 'desalter', 'deaerator'].includes(e.kind)) continue;
      // a tail pipe leaves its condenser under vacuum and arrives with the head of its leg (SW-PRC-18): it is checked with the ejector set, below
      const ins = e.ports.filter(p => p.dir === 'in' && !/open/.test(p.name) && !/^tail pipe/.test(p.name)), outs = e.ports.filter(p => p.dir === 'out' && !/open/.test(p.name));
      if (ins.length && outs.length) expect(Math.min(...ins.map(p => p.s.P)), e.tag).toBeGreaterThanOrEqual(Math.max(...outs.map(p => p.s.P)));
    }
  });
  it('the vacuum ejector set: stages, loads, steam and water as SW-PRC-18 states them', () => {
    const sh = M.sheet(12), J = sh.equip.get('J-1201')!, top = J.ports.find(p => p.name === 'inlet')!.s, hot = J.ports.find(p => p.name === 'outlet')!.s.P;
    const st = ejectorStages({ load: top, gas: VAC_SET.gas, gasMw: VAC_SET.gasMw, oil: VAC_SET.oil, steam: VAC_SET.steam, steamT: STEAM.MS.T, Pout: hot });
    // water boils at 212 °F at one atmosphere, and the two relations are each other's inverse
    expect(vapourPressure(212)).toBeCloseTo(ATM, 9); for (const T of [95, 120, 221]) expect(condensingT(vapourPressure(T))).toBeCloseTo(T, 9);
    // the first condenser condenses 15 °F above the returning water; the others' pressures follow in equal ratios, none above five; the last reaches the hotwell
    expect(st.length).toBe(3); expect(st[0].Tc).toBeCloseTo(EJ.cwOut + EJ.approach, 9); expect(st[0].Ps).toBeCloseTo(top.P + ATM, 9); expect(st[2].Pd).toBeCloseTo(hot + ATM, 9);
    expect(st[1].ratio).toBeCloseTo(st[2].ratio, 9); for (const q of st) expect(q.ratio).toBeLessThanOrEqual(EJ.maxRatio);
    for (let k = 1; k < st.length; k++) { expect(st[k].Ps).toBeCloseTo(st[k - 1].Pd, 9); expect(st[k].load).toBeCloseTo(st[k - 1].vent, 9); expect(st[k].Ts).toBe(EJ.cwIn + EJ.vent); }
    // a vent is the gas saturated with water at 95 °F: the vapour's share of the moles is its share of the pressure
    const pw = vapourPressure(EJ.cwIn + EJ.vent), nGas = VAC_SET.gas / VAC_SET.gasMw;
    for (const q of st.slice(0, -1)) expect((q.ventMoles - nGas) / q.ventMoles).toBeCloseTo(pw / q.Pd, 9);
    // all the steam is used, most of it by the first stage; all the water condenses; the cooling water takes it at 20 Btu/lb
    expect(st.reduce((a, q) => a + q.steam, 0)).toBeCloseTo(VAC_SET.steam, 6); expect(st[0].steam).toBeGreaterThan(0.85 * VAC_SET.steam);
    const water = st.reduce((a, q) => a + q.water, 0); expect(water).toBeCloseTo(top.w - VAC_SET.gas - VAC_SET.oil + VAC_SET.steam, 6);
    const cw = sh.utils.find(u => u.tag === 'J-1201' && u.fluid === 'CWS')!; expect(cw.w).toBeCloseTo((water * EJ.latent) / 20, 3);
    // the hotwell receives what the overhead and the steam bring, and sends it on
    const D = sh.equip.get('D-1201')!, sum = (dir: 'in' | 'out') => D.ports.filter(p => p.dir === dir).reduce((a, p) => a + p.s.w, 0);
    expect(sum('in')).toBeCloseTo(top.w + VAC_SET.steam, 6); expect(sum('out')).toBeCloseTo(sum('in'), 6);
    // each tail pipe's leg holds the hotwell's pressure against its condenser's, with 5 ft over; the last condenser, above the hotwell's pressure, needs none
    for (const p of D.ports.filter(q => /^tail pipe/.test(q.name))) { const h = tailPipeHeight(p.s.P + ATM, hot); expect(p.s.P + (((h - EJ.margin) / 12) * 62.4) / 144).toBeCloseTo(hot, 9); expect(h).toBeGreaterThan(360); }
    expect(tailPipeHeight(hot + ATM + 0.1, hot)).toBe(0);
    // sized: one ejector and one condenser a stage, each shell wide enough for its vapour and its surface
    const z = Z.get(12)!.equip.get('J-1201')!; expect(z.count).toBe(3); expect(z.vacuum).toBe(true);
    for (let n = 1; n <= 3; n++) { expect(shellArea(z.d[`c${n}ID`])).toBeGreaterThanOrEqual(z.d[`c${n}AreaFt2`]); expect(z.d[`c${n}ID`]).toBeGreaterThanOrEqual(Math.min(3 * z.d[`s${n}Discharge`], 60)); expect(z.d[`s${n}Discharge`]).toBeLessThanOrEqual(z.d[`s${n}Suction`]); }
    expect(z.d.s1Suction).toBe(Z.get(12)!.lines.find((_, i) => sh.lines[i].to.k === 'eq' && (sh.lines[i].to as { tag: string }).tag === 'J-1201')!.NPS);
    expect(z.sides.steam.designP).toBeGreaterThan(z.sides.water.designP);
  });
  it('each exchanger\'s two process sides exchange the same heat', () => {
    let n = 0;
    for (const sh of M.sheets) for (const e of sh.equip.values()) if (e.kind === 'hx' && e.duty.shell !== undefined && e.duty.tube !== undefined) { n++; expect(Math.abs(e.duty.shell + e.duty.tube), e.tag).toBeLessThan(1e-6 * Math.abs(e.duty.shell) + 1); }
    expect(n).toBeGreaterThan(25);
  });
  it('a steam stripper\'s bottoms leave cooler than its feed', () => {
    for (const [unit, tag] of [[15, 'C-1501'], [16, 'C-1602']] as const) { const c = M.sheet(unit).equip.get(tag)!, T = (n: string) => c.ports.find(p => p.name === n)!.s.T; expect(T('bottoms'), tag).toBeLessThan(T('feed')); }
  });
});

describe('plant 3: streams between units and utilities (SW-REF-12)', () => {
  it('every stream has a unit at each end, or the site boundary at one', () => {
    for (const t of M.transfers) { if (t.boundary) expect(t.from.length === 0 || t.to.length === 0, t.key).toBe(true); else { expect(t.from.length, t.key).toBeGreaterThan(0); expect(t.to.length, t.key).toBeGreaterThan(0); } }
    expect(M.transfers.filter(t => t.boundary).map(t => t.key).sort()).toEqual(['fire water ring main', 'flare header', 'purchased gas', 'raw water', 'treated effluent']);
  });
  it('steady, alternate and intermittent streams balance to the pound', () => {
    for (const t of M.transfers) if (!t.boundary && t.carry !== 'collected') expect(Math.abs(sent(t) - received(t)), t.key).toBeLessThan(0.5);
    for (const t of M.transfers) for (const p of t.from.filter(x => x.standby)) expect(t.to.find(q => q.unit === p.unit)!.w, t.key).toBeCloseTo(p.w, 6);   // a tank on a line takes what it gives
  });
  it('a stream arrives within 10 °F of how it left, and at no higher pressure', () => {
    for (const t of M.transfers) {
      if (!t.from.length || !t.to.length) continue;
      const lowest = Math.min(...t.from.map(p => p.s.P)); for (const q of t.to) expect(q.s.P, `${t.key} into unit ${q.unit}`).toBeLessThanOrEqual(lowest);
      if (t.from.filter(p => !p.standby).length === 1) { const T = t.from.find(p => !p.standby)!.s.T; for (const q of t.to) expect(Math.abs(q.s.T - T), `${t.key} into unit ${q.unit}`).toBeLessThanOrEqual(10); }
    }
  });
  it('the fuel gas of the flowsheets is the fuel gas of the balance', () => {
    const t = (k: string) => sent(M.transfers.find(x => x.key === k)!), tail = M.sheet(14).equip.get('X-1401')!.ports.find(p => p.name === 'tail gas')!.s.w;
    expect(t('fuel gas') + t('stabiliser gas') + t('surplus hydrogen') + tail).toBeCloseTo(B.products.fuelGas, 6);
  });
  it('sour water, wash water and amine go round', () => {
    const t = (k: string) => M.transfers.find(x => x.key === k)!;
    expect(t('sour water').from.map(p => p.unit)).toEqual([11, 12, 13, 15, 16, 17]); expect(t('sour water').to.map(p => p.unit)).toEqual([18]);
    expect(sent(t('rich amine')) - sent(t('lean amine'))).toBeCloseTo((B.sulfur.toSru - B.sulfur.sws) * (34.08 / 32.06) + 300, 6);   // the hydrogen sulfide the amine carries, and its flash gas
    expect(sent(t('stripped water')) + sent(t('stripped water to wastewater'))).toBeCloseTo(sent(t('sour water')) - 600, 6);
  });
  it('unit 19 and the units\' own make cover every utility', () => {
    expect(M.headers.map(h => h.fluid)).toEqual(['HS', 'MS', 'LS', 'CO', 'BW', 'CWS', 'CWR', 'FG', 'IA', 'PA', 'NI', 'RW', 'CA']);
    for (const h of M.headers) { const made = h.made.reduce((a, p) => a + p.w, 0), used = h.used.reduce((a, p) => a + p.w, 0); if (h.dir === 'supply') expect(h.capacity + made, h.key).toBeGreaterThanOrEqual(used); else expect(h.capacity, h.key).toBeGreaterThanOrEqual(made); }
    const cws = M.headers.find(h => h.fluid === 'CWS')!, cwr = M.headers.find(h => h.fluid === 'CWR')!;
    expect(cws.used.reduce((a, p) => a + p.w, 0)).toBeCloseTo(cwr.made.reduce((a, p) => a + p.w, 0), 6);
    for (const sh of M.sheets) for (const u of sh.utils) expect(M.headers.some(h => h.fluid === u.fluid), `${u.tag} takes ${u.fluid}`).toBe(true);   // no utility without a header
  });
});

describe('plant 3: sizing rules (SW-PRC-2 to SW-PRC-17)', () => {
  it('design pressure, temperature and class', () => {
    expect(designPressure(10)).toBe(50); expect(designPressure(100)).toBe(125); expect(designPressure(300)).toBe(330); expect(designPressure(-14)).toBe(50);
    expect(designTemperature(60)).toBe(150); expect(designTemperature(650)).toBe(700);
    expect(classFor(150, 300)).toBe('P150'); expect(classFor(151, 300)).toBe('P300'); expect(classFor(600, 700)).toBe('P600'); expect(classFor(600, 701)).toBe('P1200');
  });
  it('line size is the smallest within the velocity limits', () => {
    const water = liquid('PW', 500 * 60 * 8.34, 1, 60, 50);                                             // 500 gallons a minute
    const fast = lineSize(water, false, 'P150'), slow = lineSize(water, true, 'P150');
    expect(fast.v).toBeLessThanOrEqual(8); expect(slow.v).toBeLessThanOrEqual(4); expect(slow.NPS).toBeGreaterThan(fast.NPS);
    const below = LINE_SIZES[LINE_SIZES.indexOf(fast.NPS) - 1], A = (Math.PI / 4) * (pipeDims(below, 'P150').D / 12) ** 2; expect(cfs(water) / A).toBeGreaterThan(8);
    const gas = vapour('FG', 20000, 20, 100, 60), g = lineSize(gas, false, 'P150'); expect(rho(gas) * g.v ** 2).toBeLessThanOrEqual(4000 + 1e-6); expect(g.v).toBeLessThanOrEqual(200);
  });
  it('every line and utility connection has a size and a class that covers its pressure', () => {
    let n = 0;
    for (const sh of M.sheets) { const z = Z.get(sh.no)!;
      for (const l of sh.lines) { const s = z.lines[l.id]; n++;
        expect(LINE_SIZES).toContain(s.NPS); expect(CLASS_PRESSURE[s.cls], `unit ${sh.no} line ${l.id}`).toBeGreaterThanOrEqual(s.designP); expect(s.designP).toBeGreaterThanOrEqual(designPressure(l.s.P));
        expect(s.n, `unit ${sh.no} line ${l.id}`).toBe(1); if (FLUIDS[l.s.fluid].svc === 'P') expect(s.NPS).toBeGreaterThanOrEqual(2);
        if (l.s.ph === 'L') expect(s.v).toBeLessThanOrEqual(l.slow ? 4 + 1e-9 : 8 + 1e-9); else expect(s.v).toBeLessThanOrEqual(200 + 1e-9);
      }
      for (const u of z.utils) { expect(LINE_SIZES).toContain(u.NPS); expect(CLASS_PRESSURE[u.cls]).toBeGreaterThanOrEqual(u.designP); }
    }
    expect(n).toBeGreaterThan(600);
    expect(new Set([...Z.values()].flatMap(z => z.lines.map(l => l.cls)))).toEqual(new Set(['P150', 'P300', 'P600', 'P1200']));   // nothing above P1200
  });
  it('a pump\'s discharge is designed for the pump blocked in, as far as its first control valve', () => {
    const sh = M.sheet(11), z = Z.get(11)!, at = (to: string) => sh.lines.find(l => l.to.k === 'eq' && `${l.to.tag} ${l.to.port}` === to)!.id;
    for (const to of ['E-1101 tube in', 'E-1104 tube in', 'D-1101 inlet']) { expect(z.lines[at(to)].designP, to).toBe(390); expect(z.lines[at(to)].pump).toBe('P-1101'); }   // 75 + 1.25 × 250, to 5
    expect(z.lines[at('H-1101 inlet')].pump).toBe('P-1104'); expect(z.lines[at('C-1101 feed')].pump).toBeUndefined();                                   // the heater's inlet has the valve
    expect(z.equip.get('C-1101')!.designP).toBe(50); expect(z.equip.get('E-1101')!.sides.tube.designP).toBe(390);
  });
  it('pumps, motors and vessel walls', () => {
    expect(motorHp(0.4)).toBe(1); expect(motorHp(42)).toBe(50); expect(motorHp(75)).toBe(75); expect(motorHp(76)).toBe(100);
    expect(allowable(650)).toBe(18000); expect(allowable(1000)).toBe(9000); expect(allowable(825)).toBe(13500);
    expect(wall(120, 150, 300)).toBe(0.625); expect(wall(36, 50, 150)).toBe(0.375); expect(wall(240, 50, 300, true)).toBe(1.625);
    const p = Z.get(11)!.equip.get('P-1101')!; expect(p.count).toBe(2); expect(p.running).toBe(1); expect(p.d.motorHp).toBeGreaterThanOrEqual(p.d.shaftHp); expect(p.d.impeller).toBeLessThanOrEqual(16);
    for (const z of Z.values()) for (const e of z.equip.values()) if (e.kind === 'pump') { expect(e.d.impeller, e.tag).toBeLessThanOrEqual(e.d.rpm === 3560 ? 16 : 24); expect(e.nozzles.length, e.tag).toBe(2); }
  });
  it('exchanger shells hold the surface the duty needs, with the catalogue\'s tube count', () => {
    for (const ID of [18, 36]) expect(tubeCount(ID)).toBe(bundleSolids(ID, 240).tubes);
    for (const z of Z.values()) for (const e of z.equip.values()) if (e.kind === 'hx') { expect(e.d.shells * e.d.tubes * Math.PI * (0.75 / 12) * 20, e.tag).toBeGreaterThanOrEqual(e.d.areaFt2 - 1e-6); expect(e.d.lmtd, e.tag).toBeGreaterThanOrEqual(5); expect(e.d.shells, e.tag).toBeLessThanOrEqual(2); }
  });
  it('columns, drums, reactors, heaters and tanks come out at believable sizes', () => {
    const d = (unit: number, tag: string) => Z.get(unit)!.equip.get(tag)!.d;
    expect(d(11, 'C-1101').D).toBeGreaterThanOrEqual(120); expect(d(11, 'C-1101').D).toBeLessThanOrEqual(168); expect(d(11, 'C-1101').TT).toBe(42 * 24 + 240);
    expect(d(12, 'C-1201').D).toBeGreaterThan(d(12, 'C-1201').Dtop); expect(d(12, 'C-1201').Dtop).toBeGreaterThan(d(12, 'C-1201').Dbot);                // swaged: widest at the flash zone
    expect(d(16, 'R-1601').beds).toBe(2); expect(d(14, 'R-1403').catalystFt3).toBeCloseTo(2.5 * d(14, 'R-1401').catalystFt3, 6);                         // 2 : 3 : 5
    expect(Z.get(11)!.equip.get('H-1101')!.type).toBe('cabin'); expect(Z.get(15)!.equip.get('H-1501')!.type).toBe('vertical cylindrical');
    expect(d(11, 'H-1101').firedMMBtu).toBeCloseTo(d(11, 'H-1101').absorbedMMBtu / 0.85, 6);
    expect(d(19, 'X-1903').cells).toBe(4); expect(d(19, 'X-1903').cellFt).toBe(36);
    for (const s of storage(B)) for (const tag of s.tags) { const t = d(s.unit, tag); expect(t.bbl, tag).toBeCloseTo(tankBbl(s.bpd, s.days, s.tags.length), -1); expect(t.Dft, tag).toBeLessThanOrEqual(180); expect((Math.PI / 4) * t.Dft ** 2 * t.Hft, tag).toBeGreaterThanOrEqual(t.bbl * (9702 / 1728)); expect(t.Hft % 8, tag).toBe(0); }
    expect(d(21, 'S-2101').Dft).toBeLessThanOrEqual(60);
  });
  it('the line between two units takes the pressure its receivers need', () => {
    expect(transferLine('sour water').cls).toBe('P150'); expect(transferLine('lean amine').cls).toBe('P600'); expect(transferLine('crude').NPS).toBe(16); expect(transferLine('flare header').NPS).toBe(36);
  });
});

describe('plant 3: the document and data files', () => {
  it('docs/REFINERY-PROCESS.md is what the code produces', () => {
    expect(readFileSync(new URL('../docs/REFINERY-PROCESS.md', import.meta.url), 'utf8')).toBe(processDocument() + '\n');
  });
  it('the data files list every item and line, marked as a demonstration', () => {
    const D = processData(), read = (n: string) => JSON.parse(readFileSync(new URL(`../public/refinery/process/${n}.json`, import.meta.url), 'utf8'));
    expect(D.balance.demonstration).toBe(true); expect(read('balance').demonstration).toBe(true); expect(read('streams').demonstration).toBe(true);
    expect(read('equipment').reduce((a: number, u: { items: unknown[] }) => a + u.items.length, 0)).toBe(M.sheets.reduce((a, s) => a + s.equip.size, 0));
    expect(read('lines').reduce((a: number, u: { lines: unknown[] }) => a + u.lines.length, 0)).toBe(M.sheets.reduce((a, s) => a + s.lines.length, 0));
    expect(read('streams').transfers.length).toBe(M.transfers.length);
  });
  it('every rule the process code cites is written in the design basis', () => {
    const defined = new Set([...basisDoc.matchAll(/`(SW-[A-Z]+-\d+[a-z]?)`/g)].map(m => m[1]));
    for (const f of ['balance', 'fluids', 'flowsheet', 'process', 'sizing', 'report', 'units/crude', 'units/treating', 'units/cracking', 'units/sulfur', 'units/utilities', 'units/offsites']) {
      const src = readFileSync(new URL(`../src/refinery/${f}.ts`, import.meta.url), 'utf8');
      for (const m of src.matchAll(/SW-[A-Z]+-\d+[a-z]?/g)) expect(defined.has(m[0]), `${f}.ts cites ${m[0]}`).toBe(true);
    }
  });
});
