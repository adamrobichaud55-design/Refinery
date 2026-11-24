/**
 * Plant 3: the piping register of a piped unit (DESIGN_BASIS.md §76, SW-REG-9). From a unit's generated model, a record
 * for every line the generator built and for every component of it: fluid service, line class and severity, material
 * labels, and a registration number for each piece of the pressure boundary. Demonstration data throughout: the code
 * items are recalled and every number is invented (SW-REG-0, SW-REG-6).
 */
import type { PipingModel, Comp } from '../generator/piping';
import { partFromKey } from '../generator/piping';
import { processModel } from './process';
import { sizing } from './sizing';
import { FLUIDS } from './fluids';
import type { UnitPiping, UnitLine } from './unitPiping';
import { lineRecords, lineNumber, classify, pipeMaterial, fittingCrn, makerOf, MATERIALS, BOLTING, NOTICE, FITTING_CATEGORIES, type Category, type MaterialCode, type Source } from './registry';

/** SW-REG-9: valve body labels by the line's material, recalled */
export const VALVE_BODY: Record<MaterialCode, string> = { CS: 'A216-WCB', C1: 'A217-WC6', C5: 'A217-C5', SS: 'A351-CF8M' };
/** how a component is registered: a piece of pipe under its line's piping system; a fitting, flange or valve in its category; bolting and gaskets not at all */
export type Registered = 'pipe' | 'A' | 'B' | 'C' | 'none';
const WHAT: Record<string, [string, Registered]> = {
  pipe: ['pipe', 'pipe'], elbow: ['elbow', 'A'], tee: ['tee', 'A'], reducer: ['reducer', 'A'], cap: ['cap', 'A'], olet: ['branch outlet fitting', 'A'], swage: ['swage', 'A'], nipple: ['nipple', 'A'], coupling: ['coupling', 'A'], union: ['union', 'A'], plug: ['plug', 'A'],
  flange: ['flange', 'B'], blind: ['blind flange', 'B'], spade: ['spade', 'B'], spectacle: ['spectacle blind', 'B'], valve: ['valve', 'C'], gasket: ['gasket', 'none'], studs: ['stud set', 'none'],
};
export interface PipingLineRecord {
  number: string; unit: number; origin: UnitLine['origin']; /** the flowsheet line or utility connection it is, or is part of */ of?: string; from: string; to: string; fluid: string; fluidName: string; phase: string;
  designP: number; designT: number; size: number; pipeClass: string; lineClass: string; severity: number; fluidService: Category; examination: string; leakTest: string; material: MaterialCode;
  pipingSystemRegistration: string; /** the rack tier it runs on (SW-RPI-7), the control station it is divided at (SW-RPI-9) */ tier?: number; station?: string;
  components: number; pipeFt: number; welds: { shop: number; field: number };
}
export interface PipingComponentRecord { tag: string; line: string; kind: string; what: string; designation: string; size: number; pipeClass: string; material: string; registered: Registered; maker?: string; registration?: string }
export interface PipingRegister {
  demonstration: true; notice: string; basis: string; unit: number; name: string;
  /** whether a column's values are the model's, recalled or invented */ sources: { lines: Record<string, Source>; components: Record<string, Source> };
  lines: PipingLineRecord[]; components: PipingComponentRecord[];
  /** the unit's piping systems: a line class with its number, lines and length of pipe */ systems: { lineClass: string; registration: string; fluidService: Category; severity: number; lines: number; pipeFt: number; components: number }[];
  /** welds by fluid service, with the examination recorded for it */ welds: { fluidService: Category; examination: string; lines: number; butt: number; socket: number; fillet: number; shop: number; field: number }[];
  totals: { lines: number; components: number; pipeFt: number; byRegistration: Record<Registered, number>; fittingNumbers: number; welds: number };
}

const phaseOfUtility = (fluid: string) => (['HS', 'MS', 'LS', 'FG', 'IA', 'PA', 'NI'].includes(fluid) ? 'vapour' : 'liquid');
/** SW-REG-9: the register of a unit from its line list (SW-RPI-3) and its generated model */
export function pipingRegister(up: UnitPiping, model: PipingModel): PipingRegister {
  const unit = up.unit, sh = processModel().sheet(unit), Z = sizing().get(unit)!, base = new Map(lineRecords().filter(r => r.unit === unit).map(r => [r.number, r]));
  const flowNo = (i: number) => lineNumber(unit, i + 1, Z.lines[i].NPS, Z.lines[i].cls, sh.lines[i].s.fluid), utilNo = (i: number) => lineNumber(unit, 500 + i + 1, Z.utils[i].NPS, Z.utils[i].cls, Z.utils[i].fluid);
  const run = new Map(model.lines.map(l => [l.no, l])), lines: PipingLineRecord[] = [], components: PipingComponentRecord[] = [], matOf = new Map<string, MaterialCode>();
  for (const ul of up.lines) {
    const d = ul.def, r = run.get(d.no); if (!r) throw new Error(`unit ${unit}: line ${d.no} of the line list is not in the generated model`);
    const of = ul.flow !== undefined ? flowNo(ul.flow) : ul.util !== undefined ? utilNo(ul.util) : undefined, b = of ? base.get(of) : undefined;
    if (of && !b) throw new Error(`unit ${unit}: no line record ${of} for ${d.no}`);
    const phase = b?.phase ?? phaseOfUtility(ul.fluid), mat = b?.materials.value.code ?? pipeMaterial(unit, ul.fluid, ul.designT, false), c = classify(unit, ul.fluid, phase, d.cls, ul.designP, ul.designT, mat, ul.origin === 'utility' || ul.origin === 'header');
    matOf.set(d.no, mat);
    lines.push({
      number: d.no, unit, origin: ul.origin, ...(of && of !== d.no ? { of } : {}), from: r.from, to: r.to, fluid: ul.fluid, fluidName: FLUIDS[ul.fluid].name, phase, designP: ul.designP, designT: ul.designT, size: d.NPS, pipeClass: d.cls,
      lineClass: c.lineClass, severity: c.severity.level, fluidService: c.fluidService, examination: c.examination, leakTest: c.leakTest, material: mat, pipingSystemRegistration: c.registration,
      ...(ul.tier !== undefined ? { tier: ul.tier + 1 } : {}), ...(ul.station ? { station: ul.station } : {}), components: 0, pipeFt: 0, welds: { shop: 0, field: 0 },
    });
  }
  const byNo = new Map(lines.map(l => [l.number, l]));
  const add = (line: PipingLineRecord, c: Comp) => {
    const w = WHAT[c.kind]; if (!w) throw new Error(`unit ${unit}: no registration rule for a component of kind "${c.kind}" (${c.tag})`);
    const mat = matOf.get(line.number)!, m = MATERIALS[mat], part = partFromKey(c.key), cls = c.cls as string;
    const material = w[1] === 'pipe' ? m.pipe : w[1] === 'A' ? m.fittings : w[1] === 'B' ? m.flanges : w[1] === 'C' ? VALVE_BODY[mat] : c.kind === 'studs' ? BOLTING : part.material.grade;   // a gasket is what the catalogue draws: its own material, not a label
    const maker = w[1] === 'A' || w[1] === 'B' || w[1] === 'C' ? makerOf(c.key) : undefined;
    components.push({ tag: c.tag, line: line.number, kind: c.kind, what: c.kind === 'valve' ? `${c.key.split('|')[1].toLowerCase()} valve` : w[0], designation: part.designation, size: c.NPS, pipeClass: cls, material, registered: w[1],
      ...(w[1] === 'pipe' ? { registration: line.pipingSystemRegistration } : maker ? { maker, registration: fittingCrn(w[1] as 'A' | 'B' | 'C', cls, maker) } : {}) });
    line.components++; if (c.kind === 'pipe') line.pipeFt += Number(c.key.split('|')[3]) / 12;
  };
  for (const r of model.lines) { const line = byNo.get(r.no); if (!line) throw new Error(`unit ${unit}: generated line ${r.no} is not in the line list`); for (const c of r.comps) add(line, c); for (const w of r.welds) line.welds[w.field ? 'field' : 'shop']++; }
  // the spools of the battery limit, the control stations and the branch roots are piping: each half with the line that ends at it (a pipeway side with its other half's, until the pipeways are piped)
  const endAt = new Map<string, string>(); for (const r of model.lines) { endAt.set(r.from, r.no); endAt.set(r.to, r.no); }
  for (const n of model.nozzles) {
    if (!/^(BL|CS|RS)-/.test(n.id)) continue;                                                           // an item's own nozzle belongs to its pressure equipment record
    const no = endAt.get(n.id) ?? endAt.get(n.id.replace(/-P$/, '-U')), line = no ? byNo.get(no) : undefined; if (!line) throw new Error(`unit ${unit}: no line ends at the spool nozzle ${n.id}`);
    for (const c of n.comps) add(line, c); for (const w of n.welds) line.welds[w.field ? 'field' : 'shop']++;
  }
  for (const l of lines) l.pipeFt = Math.round(l.pipeFt * 100) / 100;
  const systems = new Map<string, PipingRegister['systems'][number]>();
  for (const l of lines) { let s = systems.get(l.lineClass); if (!s) systems.set(l.lineClass, (s = { lineClass: l.lineClass, registration: l.pipingSystemRegistration, fluidService: l.fluidService, severity: l.severity, lines: 0, pipeFt: 0, components: 0 })); s.lines++; s.pipeFt = Math.round((s.pipeFt + l.pipeFt) * 100) / 100; s.components += l.components; s.severity = Math.max(s.severity, l.severity); }
  const weldRows = (['M', 'Normal', 'D'] as Category[]).map(cat => {
    const ls = lines.filter(l => l.fluidService === cat), ids = new Set(ls.map(l => l.number)), ws = [...model.lines.filter(r => ids.has(r.no)).flatMap(r => r.welds), ...model.nozzles.filter(n => /^(BL|CS|RS)-/.test(n.id) && ids.has(endAt.get(n.id) ?? endAt.get(n.id.replace(/-P$/, '-U')) ?? '')).flatMap(n => n.welds)];
    return { fluidService: cat, examination: ls[0]?.examination ?? '', lines: ls.length, butt: ws.filter(w => w.type === 'BW').length, socket: ws.filter(w => w.type === 'SW').length, fillet: ws.filter(w => w.type === 'FW').length, shop: ws.filter(w => !w.field).length, field: ws.filter(w => w.field).length };
  }).filter(r => r.lines);
  const byRegistration = { pipe: 0, A: 0, B: 0, C: 0, none: 0 } as Record<Registered, number>; for (const c of components) byRegistration[c.registered]++;
  return {
    demonstration: true, notice: NOTICE, basis: 'DESIGN_BASIS.md §76 (SW-REG-4 to SW-REG-6, SW-REG-8, SW-REG-9) and §79', unit, name: sh.name,
    sources: {
      lines: { number: 'model', unit: 'model', origin: 'model', of: 'model', from: 'model', to: 'model', fluid: 'model', fluidName: 'model', phase: 'model', designP: 'model', designT: 'model', size: 'model', pipeClass: 'model', lineClass: 'model', severity: 'model', fluidService: 'recalled', examination: 'recalled', leakTest: 'recalled', material: 'recalled', pipingSystemRegistration: 'invented', tier: 'model', station: 'model', components: 'model', pipeFt: 'model', welds: 'model' },
      components: { tag: 'model', line: 'model', kind: 'model', what: 'model', designation: 'model', size: 'model', pipeClass: 'model', material: 'recalled', registered: 'recalled', maker: 'invented', registration: 'invented' },
    },
    lines, components, systems: [...systems.values()].sort((a, b) => b.severity - a.severity || a.lineClass.localeCompare(b.lineClass)), welds: weldRows,
    totals: { lines: lines.length, components: components.length, pipeFt: Math.round(lines.reduce((a, l) => a + l.pipeFt, 0)), byRegistration, fittingNumbers: new Set(components.filter(c => c.maker).map(c => c.registration)).size, welds: weldRows.reduce((a, r) => a + r.shop + r.field, 0) },
  };
}

/** the register as text: one record to a line, so that a change shows as the lines it changes */
export function serializeRegister(r: PipingRegister): string {
  const rows = (xs: unknown[]) => `[\n${xs.map(x => `  ${JSON.stringify(x)}`).join(',\n')}\n ]`, { lines, components, systems, welds, ...head } = r;
  return `{\n${Object.entries(head).map(([k, v]) => ` ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')},\n "systems": ${rows(systems)},\n "welds": ${rows(welds)},\n "lines": ${rows(lines)},\n "components": ${rows(components)}\n}`;
}

const table = (head: string[], rows: (string | number)[][]) => [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n');
const num = (v: number) => v.toLocaleString('en-US');
/** the document of the piping registers on disk */
export function pipingRegisterDocument(rs: PipingRegister[]): string {
  const out: string[] = [];
  out.push('# Plant 3: piping registers of the piped units', '');
  out.push('> **DEMONSTRATION DATA — not a registration.** Written by `tools/refinery-piping-register.ts` from `src/refinery/pipingRegister.ts` and the generated models in `public/refinery/piping/`; do not edit by hand.', '');
  out.push('For every unit that is piped, every line the generator built and every component of it has a record (DESIGN_BASIS.md §76, SW-REG-9): the line\'s fluid service, line class and severity; each component\'s material label and registration. A piece of pipe carries its line\'s piping system number; a fitting, flange, line blank or valve carries its maker\'s number in its category; studs and gaskets carry none and are listed so that each joint is whole.', '');
  out.push('What is whose: sizes, classes, counts, lengths and line classes are the model\'s own. Fluid service, examination, leak test, material labels and what is registered in which category are **recalled** from general knowledge of the codes, for the owner to verify. Every maker and every registration number is **invented**: issued by no one, looked up nowhere.', '');
  if (!rs.length) { out.push('No unit is piped yet.'); return out.join('\n'); }
  out.push('## The units', '');
  out.push(table(['Unit', 'Name', 'Lines', 'Pipe, ft', 'Components', 'Pipe pieces', 'Fittings (A)', 'Flanges and blanks (B)', 'Valves (C)', 'Studs and gaskets', 'Fitting numbers in use', 'Welds'],
    [...rs.map(r => [r.unit, r.name, r.totals.lines, num(r.totals.pipeFt), num(r.totals.components), num(r.totals.byRegistration.pipe), num(r.totals.byRegistration.A), num(r.totals.byRegistration.B), num(r.totals.byRegistration.C), num(r.totals.byRegistration.none), r.totals.fittingNumbers, num(r.totals.welds)]),
      ['', '**all**', rs.reduce((a, r) => a + r.totals.lines, 0), num(rs.reduce((a, r) => a + r.totals.pipeFt, 0)), num(rs.reduce((a, r) => a + r.totals.components, 0)), num(rs.reduce((a, r) => a + r.totals.byRegistration.pipe, 0)), num(rs.reduce((a, r) => a + r.totals.byRegistration.A, 0)), num(rs.reduce((a, r) => a + r.totals.byRegistration.B, 0)), num(rs.reduce((a, r) => a + r.totals.byRegistration.C, 0)), num(rs.reduce((a, r) => a + r.totals.byRegistration.none, 0)), new Set(rs.flatMap(r => r.components.filter(c => c.maker).map(c => c.registration))).size, num(rs.reduce((a, r) => a + r.totals.welds, 0))]]), '');
  out.push(`Categories as recalled (SW-REG-6): ${(['A', 'B', 'C'] as const).map(c => `${c} ${FITTING_CATEGORIES[c]}`).join('; ')}. Line blanks (spades and spectacle blinds) are counted with the flanges they are clamped between.`, '');
  for (const r of rs) {
    out.push(`## Unit ${r.unit}: ${r.name}`, '');
    out.push('Piping systems: a line class in the unit, with the number its lines and their pipe carry.', '');
    out.push(table(['Line class', 'Fluid service', 'Severity', 'Piping system number', 'Lines', 'Pipe, ft', 'Components'], r.systems.map(s => [`\`${s.lineClass}\``, s.fluidService, s.severity, s.registration, s.lines, num(Math.round(s.pipeFt)), num(s.components)])), '');
    out.push(table(['Fluid service', 'Lines', 'Examination of welds (recalled)', 'Butt welds', 'Socket welds', 'Fillet welds', 'Shop', 'Field'], r.welds.map(w => [w.fluidService === 'D' ? 'Category D' : w.fluidService === 'M' ? 'Category M' : 'Normal', w.lines, w.examination, num(w.butt), num(w.socket), num(w.fillet), num(w.shop), num(w.field)])), '');
    const byOrigin = (o: UnitLine['origin']) => r.lines.filter(l => l.origin === o).length;
    out.push(`Lines by what they are: ${byOrigin('process')} of the flowsheet (${r.lines.filter(l => l.origin === 'process' && l.station).length} of them as far as a control station), ${byOrigin('control')} parts after a control station (${r.lines.filter(l => l.origin === 'control' && l.of && r.lines.find(q => q.number === l.of)?.pipeClass !== l.pipeClass).length} in a lower class than the line ahead: a specification break), ${byOrigin('spare')} connections of installed spares, ${byOrigin('root')} branch root connections, ${byOrigin('utility')} utility connections and ${byOrigin('header')} utility headers.`, '');
    const kinds = new Map<string, { n: number; reg: Registered; mat: Set<string>; nums: Set<string> }>();
    for (const c of r.components) { let k = kinds.get(c.what); if (!k) kinds.set(c.what, (k = { n: 0, reg: c.registered, mat: new Set(), nums: new Set() })); k.n++; k.mat.add(c.material); if (c.maker) k.nums.add(c.registration!); }
    out.push(table(['Component', 'Count', 'Registered as', 'Material labels (recalled)', 'Fitting numbers in use'], [...kinds].sort((a, b) => b[1].n - a[1].n).map(([what, k]) => [what, num(k.n), k.reg === 'pipe' ? 'its line\'s piping system' : k.reg === 'none' ? 'not registered' : `category ${k.reg}`, [...k.mat].join('; '), k.nums.size || '—'])), '');
  }
  out.push('## Files', '');
  out.push(table(['File', 'Content'], [['`public/refinery/registry/piping/unit-NN.json`', 'a piped unit\'s register: every line record, every component record, its piping systems and its welds by fluid service']]), '');
  return out.join('\n');
}
