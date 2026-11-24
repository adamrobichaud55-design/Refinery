/**
 * Plant 3: the process model as a document and as data files (DESIGN_BASIS.md §74, §75). `tools/refinery-process.ts`
 * writes them; a test checks that the committed document is the one this code produces.
 */
import { CUTS, CRUDE_BPD, YIELDS, flowBpd } from './balance';
import { FLUIDS, bpd, mmscfd, gpm, type State } from './fluids';
import type { End, Equip } from './flowsheet';
import { processModel, sent, received, type Transfer } from './process';
import { sizing, transferLine, type EquipSize } from './sizing';
import { storage } from './units/offsites';

/** SW-REF-4, SW-REF-10: what each unit is there to do */
export const UNIT_ROLE: Record<number, string> = {
  11: 'Separates the crude by boiling range into gas, naphtha, kerosene, diesel, gas oil and residue, after washing the salt out of it. Everything else in the refinery works on what this unit cuts.',
  12: 'Distils the atmospheric residue again under vacuum, so that gas oil for the cracker can be boiled off without the oil being hot enough to crack. What will not boil leaves as vacuum residue for fuel oil and asphalt.',
  13: 'Removes sulfur and nitrogen from the naphtha with hydrogen over a catalyst, because they would poison the reformer\'s catalyst, then splits it into light naphtha for gasoline blending and heavy naphtha for the reformer.',
  14: 'Rearranges heavy naphtha into high-octane reformate for gasoline, and in doing so makes the hydrogen the hydrotreaters live on. Its adsorbers purify that hydrogen for the diesel hydrotreater.',
  15: 'Removes sulfur from kerosene with hydrogen so that it meets jet fuel quality.',
  16: 'Removes sulfur from diesel and light cycle oil with hydrogen at high pressure to make road diesel.',
  17: 'Cracks gas oil on hot fluidised catalyst into gasoline and liquefied gas, burning the coke off the catalyst to supply the heat. Its gas plant recovers and treats the refinery\'s fuel gas, liquefied gas and cracked gasoline.',
  18: 'Takes the hydrogen sulfide out of circulation: regenerates the amine that washes it from the gases, strips it from sour water, and converts it to liquid sulfur for sale.',
  19: 'Supplies what every unit needs to run: steam, boiler feed water, cooling water, compressed air, nitrogen, caustic and fuel gas.',
  20: 'Receives crude from tankers and holds two weeks of it, so that the crude unit runs steadily between cargoes.',
  21: 'Holds feed between units, blends gasoline from its components, and stores the finished products and liquefied gas until they are shipped.',
  22: 'Lands crude from tankers and loads products onto ships at a berth in deep water.',
  23: 'Loads gasoline, jet fuel, diesel, asphalt and liquefied gas onto road tankers.',
  24: 'Cleans the refinery\'s waste water (desalter brine, stripped water, blowdown and oily drainage) before it goes to the outfall, and recovers the oil.',
  25: 'Burns safely, at a distance, whatever the relief valves release in an upset.',
  26: 'Holds and pumps the water that fights a fire anywhere on the site.',
};

const n0 = (x: number) => Math.round(x).toLocaleString('en-US'), n1 = (x: number) => x.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const endText = (e: End) => (e.k === 'eq' ? `${e.tag} ${e.port}` : e.k === 'bl' ? `battery limit: ${e.name}` : `line ${e.line}`);
const flowText = (s: State) => (s.ph === 'L' ? `${n0(bpd(s.w, s.sg))} bbl/d` : s.ph === 'V' ? `${mmscfd(s.w, s.mw).toFixed(2)} MMscf/d` : 'two-phase');
const cap = (t: string) => t[0].toUpperCase() + t.slice(1);
const sizeText = (NPS: number) => (NPS === 0.75 ? '3/4' : NPS === 1.5 ? '1-1/2' : String(NPS));

export function processData() {
  const M = processModel(), Z = sizing(), B = M.B;
  const balance = {
    demonstration: true, crude: { bpd: CRUDE_BPD, lbh: B.crude.w, sg: B.crude.sg, api: B.crude.api, sulfurPct: B.crude.sulfurPct }, cuts: CUTS.map(c => ({ ...c, lbh: B.cut[c.key].w })),
    products: Object.fromEntries(Object.entries(B.products).map(([k, v]) => [k, typeof v === 'number' ? { lbh: v } : { lbh: v.w, sg: v.sg, bpd: flowBpd(v) }])),
    hydrogen: B.h2, sulfur: B.sulfur, closure: B.closure,
  };
  const streams = {
    demonstration: true,
    transfers: M.transfers.map(t => { const z = transferLine(t.key); return { ...t, from: t.from.map(p => ({ unit: p.unit, lbh: p.w, T: p.s.T, P: p.s.P, standby: !!p.standby })), to: t.to.map(p => ({ unit: p.unit, lbh: p.w, T: p.s.T, P: p.s.P, standby: !!p.standby })), fluidName: FLUIDS[t.fluid].name, hazard: FLUIDS[t.fluid].hazard, NPS: z.NPS, cls: z.cls, designP: z.designP, designT: z.designT }; }),
    headers: M.headers.map(h => ({ fluid: h.fluid, name: h.key, direction: h.dir, capacity: h.capacity, made: h.made.map(p => ({ unit: p.unit, lbh: p.w })), used: h.used.map(p => ({ unit: p.unit, lbh: p.w })) })),
  };
  const equipment = M.sheets.map(sh => ({
    unit: sh.no, name: sh.name,
    items: [...sh.equip.values()].map((e: Equip) => { const z = Z.get(sh.no)!.equip.get(e.tag)!; return { tag: e.tag, service: e.service, kind: e.kind, type: z.type, installed: z.count, running: z.running, designP: z.designP, designT: z.designT, vacuum: z.vacuum, cls: z.cls, sides: z.sides, size: z.d, description: z.text, dutyBtuh: e.duty, given: e.p, ports: e.ports.map(p => ({ name: p.name, dir: p.dir, ...p.s })), nozzles: z.nozzles }; }),
  }));
  const lines = M.sheets.map(sh => ({
    unit: sh.no, name: sh.name,
    lines: sh.lines.map(l => { const z = Z.get(sh.no)!.lines[l.id]; return { id: l.id, from: l.from, to: l.to, fluid: l.s.fluid, phase: l.s.ph, lbh: l.s.w, T: l.s.T, P: l.s.P, sg: l.s.sg, mw: l.s.mw, vapourFraction: l.s.vf, controlValve: l.cv, suctionOrGravity: l.slow, note: l.note, NPS: z.NPS, parallel: z.n, cls: z.cls, designP: z.designP, designT: z.designT, vacuum: z.vacuum, velocity: z.v, sizedBy: z.by, ...(z.pump ? { pumpBlockedIn: z.pump } : {}) }; }),
    utilities: Z.get(sh.no)!.utils.map(u => ({ fluid: u.fluid, tag: u.tag, port: u.port, direction: u.dir, lbh: u.w, T: u.T, P: u.P, NPS: u.NPS, cls: u.cls, designP: u.designP, designT: u.designT })),
  }));
  return { balance, streams, equipment, lines };
}

export function processDocument(): string {
  const M = processModel(), Z = sizing(), B = M.B, o: string[] = [];
  const items = M.sheets.reduce((a, s) => a + s.equip.size, 0), machines = [...Z.values()].reduce((a, z) => a + [...z.equip.values()].reduce((b, e) => b + e.count, 0), 0);
  const nLines = M.sheets.reduce((a, s) => a + s.lines.length, 0), nUtil = M.sheets.reduce((a, s) => a + s.utils.length, 0);
  o.push('# Plant 3, the coastal refinery: process', '',
    'Generated by `tools/refinery-process.ts` from `src/refinery/`; do not edit by hand. Rules: DESIGN_BASIS.md §74 (`SW-REF-*`) and §75 (`SW-PRC-*`).', '',
    '**What this is.** The process the model is built on: what the refinery makes from its crude, what each unit does, every equipment item with the size its duty calls for, and every stream that passes between units. The 3D model\'s equipment and piping are sized and connected from this and nothing else.', '',
    '**What it is not.** It is an invented demonstration, not a process design. The crude, the yields, the operating conditions and the sizing rules are round figures chosen by SmartWeld from general refining knowledge, with the reasoning written in the design basis; no handbook, licensor\'s design, assay or published flow scheme was opened or reproduced. Every figure is for the owner to review and tune.', '',
    `**Size.** ${M.sheets.length} units, ${items} tagged equipment items (${machines} machines, shells and bays with installed spares and parallel shells), ${nLines} process lines and ${nUtil} utility connections to equipment, before battery-limit stations, relief lines, vents, drains and hose stations are added by the piping stage.`, '');

  // 1 balance
  o.push('## 1. What the refinery makes', '', `Design crude: ${n0(CRUDE_BPD)} barrels a day, ${n0(B.crude.w)} lb/h, specific gravity ${B.crude.sg.toFixed(4)} (${B.crude.api.toFixed(1)} °API), ${B.crude.sulfurPct.toFixed(2)} % sulfur by weight (SW-REF-5).`, '',
    '| Cut | Boiling range, °F | Volume % | Specific gravity | Sulfur, wt % | lb/h |', '|---|---|---|---|---|---|');
  for (const c of CUTS) o.push(`| ${c.name} | ${c.range} | ${c.vol} | ${c.sg.toFixed(3)} | ${c.sulfur} | ${n0(B.cut[c.key].w)} |`);
  const P = B.products, prod: [string, { w: number; sg: number } | number, string][] = [['Three-carbon liquefied gas', P.c3, 'pressure storage, trucks'], ['Four-carbon liquefied gas', P.c4, 'pressure storage, trucks'], ['Gasoline', P.gasoline, 'ship and truck'], ['Jet fuel', P.jet, 'ship and truck'], ['Diesel', P.diesel, 'ship and truck'], ['Heavy fuel oil', P.fuelOil, 'ship'], ['Asphalt', P.asphalt, 'truck'], ['Sulfur', P.sulfur, 'truck, as liquid'], ['Fuel gas', P.fuelGas, 'burned in the plant'], ['Coke on catalyst', P.coke, 'burned in the regenerator']];
  o.push('', '| Product | lb/h | Barrels a day | % of crude by mass | Leaves by |', '|---|---|---|---|---|');
  for (const [name, v, how] of prod) { const w = typeof v === 'number' ? v : v.w; o.push(`| ${name} | ${n0(w)} | ${typeof v === 'number' ? '' : n0(flowBpd(v))} | ${((100 * w) / B.crude.w).toFixed(2)} | ${how} |`); }
  o.push('', `The balance is on mass and closes to ${Math.abs(B.closure).toExponential(1)} of the crude (SW-REF-6). Volumes follow from the specific gravities; liquid products total ${n0([P.c3, P.c4, P.gasoline, P.jet, P.diesel, P.fuelOil, P.asphalt].reduce((a, x) => a + flowBpd(x), 0))} barrels a day.`, '',
    `**Hydrogen** (SW-REF-7). The reformer makes ${n0(B.h2.made)} lb/h (${B.h2.madeMmscfd.toFixed(2)} million standard cubic feet a day). The naphtha and kerosene hydrotreaters take ${n0(B.h2.nht)} and ${n0(B.h2.kht)} lb/h in net gas; ${n0(B.h2.toPsa)} lb/h goes to the adsorbers, which recover ${n0(B.h2.purified)} lb/h; the diesel hydrotreater takes ${n0(B.h2.dht)} lb/h, leaving a surplus of ${n0(B.h2.surplus)} lb/h (${B.h2.surplusMmscfd.toFixed(2)} million standard cubic feet a day) for fuel gas. The refinery lives on its own hydrogen.`, '',
    `**Sulfur** (SW-REF-7). Of ${n0(B.sulfur.inCrude)} lb/h of sulfur in the crude, ${n0(B.sulfur.toSru)} lb/h reaches the sulfur recovery unit as hydrogen sulfide (naphtha ${n0(B.sulfur.nht)}, kerosene ${n0(B.sulfur.kht)}, diesel ${n0(B.sulfur.dht)}, cracker ${n0(B.sulfur.fcc)}, sour water ${n0(B.sulfur.sws)}); ${n0(B.sulfur.recovered)} lb/h is recovered, ${B.sulfur.longTonsPerDay.toFixed(1)} long tons a day. The rest of the crude's sulfur leaves in fuel oil, asphalt and the cracker's liquid products.`, '');

  // 2 units
  o.push('## 2. The units and what each contributes', '', '| Unit | Section | Feed at the design crude rate | Items | Lines |', '|---|---|---|---|---|');
  const feedOf: Record<number, string> = { 11: `${n0(CRUDE_BPD)} bbl/d crude`, 12: `${n0(flowBpd(B.atmResid))} bbl/d atmospheric residue`, 13: `${n0(bpd(M.sheet(13).equip.get('D-1301')!.ports.find(p => p.name === 'outlet')!.s.w, 0.725))} bbl/d naphtha`, 14: `${n0(flowBpd(B.reformer.feed))} bbl/d heavy naphtha`, 15: `${n0(flowBpd(B.kht.feed))} bbl/d kerosene`, 16: `${n0(flowBpd(B.dht.feed))} bbl/d diesel and light cycle oil`, 17: `${n0(flowBpd(B.fcc.feed))} bbl/d gas oil`, 18: `${B.sulfur.longTonsPerDay.toFixed(1)} long tons of sulfur a day` };
  for (const sh of M.sheets) o.push(`| ${sh.no} | ${sh.name} | ${feedOf[sh.no] ?? ''} | ${sh.equip.size} | ${sh.lines.length} |`);
  o.push('');
  for (const sh of M.sheets) o.push(`- **${sh.no} ${sh.name}.** ${UNIT_ROLE[sh.no]}`);
  o.push('', 'Unit 27 is the buildings, substations and site works, which carry no process.', '');

  // 3 streams
  const partyText = (t: Transfer, side: 'from' | 'to') => { const ps = t[side]; if (!ps.length) return t.where ?? ''; return ps.map(p => `${p.unit}${p.standby ? ' (tank)' : ''}`).join(', '); };
  o.push('## 3. Streams between units', '', 'Every stream that crosses a unit\'s battery limit, with the units at each end (SW-REF-12). Steady streams balance to the pound. The line takes the size of its larger end; its pressure is what the receiving units take it at, or what a pump sends it at where there is no control valve at the battery limit of the sending unit (SW-PRC-3, SW-PRC-4).', '',
    '| Stream | Fluid | From unit | To unit | lb/h | Flow | °F | psig | Line, in | Class | How it flows |', '|---|---|---|---|---|---|---|---|---|---|---|');
  for (const t of M.transfers) {
    const src = t.from.filter(p => !p.standby), w = t.carry === 'collected' ? Math.max(...[...t.from, ...t.to].map(p => p.w)) : Math.max(sent(t), received(t)), s = { ...(src[0] ?? t.to[0]).s, w }, z = transferLine(t.key);
    o.push(`| ${cap(t.key)} | ${FLUIDS[t.fluid].name} | ${partyText(t, 'from')} | ${partyText(t, 'to')} | ${n0(w)} | ${flowText(s)} | ${n0(s.T)} | ${n0(z.opP)} | ${sizeText(z.NPS)} | ${z.cls} | ${t.carry}${t.note ? `: ${t.note}` : ''} |`);
  }
  o.push('');

  // 4 utilities
  o.push('## 4. Utilities', '', 'Each utility is a header (SW-REF-12). Unit 19 supplies it, or for condensate and cooling water return receives it; the other units add what they make and take what they use.', '',
    '| Utility | Unit 19, lb/h | Made by other units, lb/h | Used, lb/h | Margin, lb/h | Makers | Users |', '|---|---|---|---|---|---|---|');
  for (const h of M.headers) { const m = h.made.reduce((a, p) => a + p.w, 0), u = h.used.reduce((a, p) => a + p.w, 0), margin = h.dir === 'supply' ? h.capacity + m - u : h.capacity - m;
    o.push(`| ${cap(FLUIDS[h.fluid].name)} | ${h.dir === 'supply' ? 'supplies' : 'receives'} ${n0(h.capacity)} | ${m ? n0(m) : ''} | ${u ? n0(u) : ''} | ${n0(margin)} | ${h.made.map(p => p.unit).join(', ')} | ${h.used.map(p => p.unit).join(', ')} |`); }
  o.push('', 'Steam, air, water and nitrogen also serve the hose stations along every unit (SW-PRC-15), which draw no steady flow.');
  const all = [...Z.values()].flatMap(z => [...z.equip.values()]), sum = (f: (e: EquipSize) => number) => all.reduce((a, e) => a + f(e), 0);
  const cws = M.headers.find(h => h.fluid === 'CWS')!, fired = sum(e => (e.kind === 'heater' ? e.d.firedMMBtu ?? 0 : 0));
  o.push('', `Totals: fired heaters ${n0(fired)} million Btu/h fired in ${all.filter(e => e.kind === 'heater').length} heaters; cooling water used ${n0(gpm({ fluid: 'CWS', ph: 'L', w: cws.used.reduce((a, p) => a + p.w, 0), sg: 1, mw: 0, T: 85, P: 60, vf: 0 }))} of ${n0(gpm({ fluid: 'CWS', ph: 'L', w: cws.capacity, sg: 1, mw: 0, T: 85, P: 60, vf: 0 }))} US gallons a minute circulated; ${n0(sum(e => (e.kind === 'aircooler' ? e.count : 0)))} air cooler bays; ${n0(sum(e => (e.kind === 'hx' || e.kind === 'condenser' || e.kind === 'fluegascooler' ? e.count : 0)))} exchanger shells; ${n0(sum(e => (e.kind === 'pump' ? e.count : 0)))} pumps with ${n0(sum(e => (e.kind === 'pump' ? e.count * (e.d.motorHp ?? 0) : 0)))} horsepower of motors installed; compressors and blowers of ${n0(sum(e => (e.kind === 'compressor' || e.kind === 'blower' ? e.running * (e.d.gasHp ?? 0) : 0)))} horsepower of gas power running.`, '');

  // 5 storage
  o.push('## 5. Storage', '', 'Days of each stream\'s rate (SW-REF-9); tank sizes by SW-PRC-13.', '', '| Tanks | Service | Rate, bbl/d | Days | Each, bbl | Each | Roof |', '|---|---|---|---|---|---|---|');
  for (const s of storage(B)) { const e = Z.get(s.unit)!.equip.get(s.tags[0])!; o.push(`| ${s.tags.length > 1 ? `${s.tags[0]} to ${s.tags[s.tags.length - 1]}` : s.tags[0]} | ${s.service} | ${n0(s.bpd)} | ${s.days} | ${n0(e.d.bbl)} | ${e.d.Dft} ft × ${e.d.Hft} ft | ${e.type} |`); }
  const s21 = Z.get(21)!.equip;
  for (const tag of ['S-2101', 'S-2102', 'S-2104']) { const e = s21.get(tag)!; o.push(`| ${tag}${tag === 'S-2102' ? ', S-2103' : tag === 'S-2104' ? ', S-2105' : ''} | ${tag === 'S-2104' ? 'Liquefied gas loading bullets' : e.service} | | ${tag === 'S-2104' ? '' : 5} | ${n0(e.d.bbl)} | ${e.kind === 'sphere' ? `${e.d.Dft} ft sphere` : `${e.d.D} in × ${e.d.L / 12} ft bullet`} | |`); }
  o.push('');

  // 6 equipment
  o.push('## 6. Equipment', '', 'Each item with the size its duty calls for (SW-PRC-5 to SW-PRC-17) and its design conditions (SW-PRC-2, SW-PRC-3). Exchangers show the higher of their two sides. Items with no size here (the cracker, boilers, furnaces, packages, loading arms and basins) are sized with their bodies when the equipment is built.', '');
  for (const sh of M.sheets) {
    o.push(`### Unit ${sh.no}: ${sh.name}`, '', '| Tag | Service | Type | Design | Class | Size |', '|---|---|---|---|---|---|');
    for (const e of sh.equip.values()) { const z = Z.get(sh.no)!.equip.get(e.tag)!; o.push(`| ${e.tag} | ${e.service} | ${z.type || e.kind} | ${z.designP ? `${n0(z.designP)} psi${z.vacuum ? ' and full vacuum' : ''}, ${n0(z.designT)} °F` : 'atmospheric'} | ${z.cls} | ${z.text} |`); }
    o.push('');
  }

  // 7 lines
  o.push('## 7. Lines', '', 'Process lines of each unit by size (inches) and by class. The full list, with what each line carries, its conditions, its velocity and what sized it, is in `public/refinery/process/lines.json`.', '');
  const sizes = [...new Set([...Z.values()].flatMap(z => z.lines.map(l => l.NPS)))].sort((a, b) => a - b);
  o.push(`| Unit | ${sizes.map(sizeText).join(' | ')} | Total |`, `|---|${sizes.map(() => '---').join('|')}|---|`);
  for (const sh of M.sheets) { const z = Z.get(sh.no)!; o.push(`| ${sh.no} | ${sizes.map(s => z.lines.filter(l => l.NPS === s).length || '').join(' | ')} | ${z.lines.length} |`); }
  o.push(`| All | ${sizes.map(s => [...Z.values()].reduce((a, z) => a + z.lines.filter(l => l.NPS === s).length, 0)).join(' | ')} | ${nLines} |`, '');
  const classes = ['P150', 'P300', 'P600', 'P1200'];
  o.push(`| Unit | ${classes.join(' | ')} |`, `|---|${classes.map(() => '---').join('|')}|`);
  for (const sh of M.sheets) { const z = Z.get(sh.no)!; o.push(`| ${sh.no} | ${classes.map(c => z.lines.filter(l => l.cls === c).length || '').join(' | ')} |`); }
  o.push('', 'The largest lines:', '', '| Unit | From | To | Carries | lb/h | Size, in | Class | ft/s |', '|---|---|---|---|---|---|---|---|');
  const big = M.sheets.flatMap(sh => sh.lines.map(l => ({ sh, l, z: Z.get(sh.no)!.lines[l.id] }))).sort((a, b) => b.z.NPS - a.z.NPS || b.l.s.w - a.l.s.w).slice(0, 24);
  for (const { sh, l, z } of big) o.push(`| ${sh.no} | ${endText(l.from)} | ${endText(l.to)} | ${FLUIDS[l.s.fluid].name} | ${n0(l.s.w)} | ${z.n > 1 ? `${z.n} × ` : ''}${sizeText(z.NPS)} | ${z.cls} | ${n1(z.v)} |`);
  o.push('');
  void YIELDS;
  return o.join('\n');
}
