/**
 * Plant 3: the code layer's files (DESIGN_BASIS.md §76, SW-REG-7): the data written as JSON, the document, and the
 * printable records as blocks for SmartWeld's own PDF writer. Every page of a printable record carries the
 * demonstration band; nothing here reproduces a form of any code body.
 */
import type { Block } from '../generator/wopack';
import { processModel } from './process';
import { UNIT_ROLE } from './report';
import { equipmentRecords, lineRecords, lineClasses, coilRecords, componentRecords, registrationIndex, stressCheck, NOTICE, FITTING_CATEGORIES, MAKERS, type EquipmentRecord, type Field, type LineRecord } from './registry';

/** page previews written beside the files, with their captions for screenshots/INDEX.md */
export const REGISTRY_IMAGES: Record<string, string> = {
  'registry-record-of-a-column': 'Plant 3: a printable pressure equipment record (the crude column), demonstration data in SmartWeld\'s own layout',
  'registry-record-of-an-exchanger': 'Plant 3: a printable pressure equipment record of a two-chamber exchanger, demonstration data',
  'registry-record-of-a-boiler': 'Plant 3: a printable boiler record with its drums as parts, demonstration data',
  'registry-line-register': 'Plant 3: a unit\'s line register with fluid service, line class and severity, demonstration data',
  'registry-line-classes': 'Plant 3: the registration index\'s first page, with the line classes and their severity, demonstration data',
};
export const BAND = 'DEMONSTRATION DATA — not a manufacturer\'s data report, not a registration';
export const LEGEND = '[r] recalled from general knowledge of the codes, applied at the owner\'s instruction and for the owner to verify. [i] an invented demonstration number or name, issued by no one. Unmarked values are the model\'s own.';
const mark = (x: Field<unknown>) => (x.source === 'recalled' ? ' [r]' : x.source === 'invented' ? ' [i]' : '');
const num = (v: number) => (Number.isInteger(v) ? v.toLocaleString('en-US') : String(Math.round(v * 1000) / 1000));
const f = (x: Field<unknown> | undefined, unit = '') => (x === undefined ? '—' : `${typeof x.value === 'number' ? num(x.value) : typeof x.value === 'boolean' ? (x.value ? 'yes' : 'no') : String(x.value)}${unit}${mark(x)}`);
const size = (n: number) => (n === 0.75 ? '3/4' : n === 1.5 ? '1-1/2' : String(n));
const ftIn = (inches: number) => `${num(Math.round((inches / 12) * 100) / 100)} ft`;

export function registryData() {
  return {
    equipment: { demonstration: true, notice: NOTICE, basis: 'DESIGN_BASIS.md §76 (SW-REG-1 to SW-REG-3, SW-REG-5, SW-REG-6)', sources: { model: 'SmartWeld\'s own sizing and geometry', recalled: 'the assistant\'s recollection of general practice under the named codes, for the owner to verify', invented: 'a demonstration number or name made by a rule from the tag' }, records: equipmentRecords(), heaterCoils: coilRecords(), components: componentRecords() },
    lines: { demonstration: true, notice: NOTICE, basis: 'DESIGN_BASIS.md §76 (SW-REG-4 to SW-REG-6, SW-REG-8)', classes: lineClasses(), lines: lineRecords() },
    registration: registrationIndex(),
  };
}

// ───────────────────────── printable records ─────────────────────────
/** one pressure equipment record, in SmartWeld's own layout */
export function recordBlocks(r: EquipmentRecord): Block[] {
  const b: Block[] = [], sh = r.shell, checks = stressCheck(r);
  b.push({ k: 'h1', text: `${r.tag}   ${r.service}` });
  b.push({ k: 'p', small: true, text: `Pressure equipment record, unit ${r.unit}, in SmartWeld's own layout. It stands where a manufacturer's data report would be filed and names the report designation such an item would carry; it reproduces no form and certifies nothing.` });
  b.push({ k: 'kv', rows: [
    [['Tag', r.tag], ['Service', r.service]], [['Code', f(r.code)], ['Report designation', f(r.report)]],
    [['Registration number', f(r.registration)], ['Fabricator', f(r.fabricator)]], [['Serial number', f(r.serial)], ['Year built', `${r.yearBuilt.value}${mark(r.yearBuilt)}`]],
  ] });
  b.push({ k: 'h2', text: 'Chambers' });
  b.push({ k: 'table', head: ['Chamber', 'Maximum allowable working pressure, psi', 'at, °F', 'Full vacuum', 'Test pressure, psi', 'Inside diameter, in', 'Wall, in', 'Contents'],
    rows: r.chambers.map(c => [c.name, f(c.mawp), f(c.temperature), f(c.fullVacuum), f(c.testPressure), f(c.insideDiameter ?? sh.insideDiameter), f(c.thickness ?? sh.thickness), c.contents.join(', ')]) });
  b.push({ k: 'h2', text: 'Construction' });
  b.push({ k: 'kv', rows: [
    [['Shell and head material', f(sh.material)], ['Heads', f(sh.heads)]],
    [['Inside diameter', sh.insideDiameter ? `${num(sh.insideDiameter.value)} in (${ftIn(sh.insideDiameter.value)})` : '—'], [r.tubes ? 'Tube length' : r.shape === 'sphere' ? 'Length' : 'Length between tangents', sh.length ? `${num(sh.length.value)} in (${ftIn(sh.length.value)})` : '—']],
    [['Wall thickness', f(sh.thickness, ' in')], ['Corrosion allowance', f(r.corrosionAllowance, ' in')]],
    [['Minimum design metal temperature', f(r.mdmt, ' °F')], ['Radiography', `${r.radiography.value}, joint efficiency ${r.jointEfficiency.value}${mark(r.radiography)}`]],
    [['Heat treatment after welding', f(r.heatTreatment)], ['Lethal service', f(r.lethalService)]],
    [['Supports', f(r.supports)], ['Volume', f(r.volumeFt3, ' ft³')]],
    [['Empty weight', r.emptyWeightLb ? `${num(r.emptyWeightLb.value)} lb` : 'not stated'], ['Weight basis', r.weightBasis ?? '—']],
    ...(r.tubes ? [[['Tubes', `${num(r.tubes.count.value)} of ${size(r.tubes.outsideDiameter.value)} in × ${ftIn(r.tubes.length.value)}, ${num(r.tubes.surfaceFt2.value)} ft² outside surface`], ['Tube material', f(r.tubes.material)]] as [string, string][]] : []),
    ...(checks.length ? [[['Wall check (SW-PRC-14)', checks.map(c => `${c.chamber}: ${num(Math.round(c.stress))} psi against ${num(Math.round(c.allowed))} allowed`).join('; ')]] as [string, string][]] : []),
  ] });
  if (r.parts) { b.push({ k: 'h2', text: 'Parts' }); b.push({ k: 'table', head: ['Part', 'Description', 'Report designation', 'Inside diameter, in', 'Wall, in', 'Working pressure, psi', 'at, °F'], rows: r.parts.map(p => [p.tag, p.description, f(p.report), f(p.insideDiameter), f(p.thickness), f(p.mawp ?? (p.insideDiameter ? r.chambers[0].mawp : undefined)), f(p.temperature ?? (p.insideDiameter ? r.chambers[0].temperature : undefined))]) }); }
  b.push({ k: 'h2', text: 'Connections' });
  b.push({ k: 'table', head: ['Mark', 'Service', 'Size, in', 'Class', 'Fluid'], rows: r.nozzles.map(n => [n.mark, n.service, size(n.size.value), n.pipeClass.value, n.fluid]) });
  b.push({ k: 'h2', text: 'Relief' });
  b.push({ k: 'table', head: ['Relief valve', 'Set pressure, psi', 'Protects'], rows: r.relief.map((q, i) => [f(q.tag), f(q.setPressure), r.chambers[i].name]) });
  b.push({ k: 'p', text: `Signatures: ${r.signatures}.` });
  b.push({ k: 'p', small: true, text: LEGEND });
  return b;
}
const lineRow = (l: LineRecord) => [l.number, l.from, l.to, l.fluidName, `${num(l.design.value.P)} psi${l.design.value.fullVacuum ? ' and full vacuum' : ''} at ${num(l.design.value.T)} °F`, l.lineClass.value, String(l.severity.value.level), l.fluidService.value, l.examination.value, l.leakTest.value, l.materials.value.pipe, l.pipingSystemRegistration.value, [l.boilerExternalPiping?.value, l.elevatedTemperature?.value].filter(Boolean).join('; ')];
const LINE_HEAD = ['Line', 'From', 'To', 'Fluid', 'Design', 'Line class', 'Severity', 'Fluid service [r]', 'Examination of welds [r]', 'Leak test [r]', 'Pipe [r]', 'Piping system registration [i]', 'Notes [r]'];
/** a unit's file: its pressure equipment records, a page each, then its heater coils and its line register */
export function unitSections(unit: number): { title: string; pages: Block[][] } {
  const M = processModel(), name = M.sheet(unit).name, eq = equipmentRecords().filter(r => r.unit === unit), ln = lineRecords().filter(l => l.unit === unit), coils = coilRecords().filter(c => c.unit === unit), comps = componentRecords().filter(c => c.unit === unit);
  const pages: Block[][] = [];
  const cover: Block[] = [{ k: 'h1', text: `Unit ${unit}: ${name}. Pressure equipment and piping records` }, { k: 'demo', text: NOTICE },
    { k: 'p', text: `${eq.length} pressure equipment record${eq.length === 1 ? '' : 's'}, ${coils.length} fired heater coil${coils.length === 1 ? '' : 's'}, ${comps.length} packaged component${comps.length === 1 ? '' : 's'} and ${ln.length} lines. Rules: DESIGN_BASIS.md §76 (SW-REG-0 to SW-REG-8). ${LEGEND}` }];
  if (eq.length) cover.push({ k: 'h2', text: 'Pressure equipment' }, { k: 'table', head: ['Tag', 'Service', 'Report [r]', 'Registration [i]', 'Working pressure and temperature', 'Size', 'Wall, in', 'Material [r]', 'Radiography [r]', 'Heat treatment [r]', 'Weight, lb'],
    rows: eq.map(r => [r.tag, r.service, r.report.value, r.registration.value, r.chambers.map(c => `${c.name}: ${num(c.mawp.value)} psi${c.fullVacuum.value ? ' and full vacuum' : ''} at ${num(c.temperature.value)} °F`).join('; '), sizeText(r), r.shell.thickness ? num(r.shell.thickness.value) : '—', r.shell.material.value, r.radiography.value, r.heatTreatment.value, r.emptyWeightLb ? num(r.emptyWeightLb.value) : '—']) });
  if (coils.length) cover.push({ k: 'h2', text: 'Fired heater coils' }, { k: 'table', head: ['Coil', 'Heater', 'Service', 'Code label [r]', 'Registration [i]', 'Design', 'Material [r]', 'Fluid service [r]'], rows: coils.map(c => [c.tag, c.heater, `${c.service}: ${c.coil}`, c.code.value, c.registration.value, `${num(c.design.value.P)} psi at ${num(c.design.value.T)} °F`, c.material.value, c.fluidService.value]) });
  if (comps.length) cover.push({ k: 'h2', text: 'Packaged components counted with the fittings' }, { k: 'table', head: ['Tag', 'Service', 'Category', 'Maker [i]', 'Registration [i]', 'Class'], rows: comps.map(c => [c.tag, c.service, `${c.category}: ${FITTING_CATEGORIES[c.category]}`, c.maker.value, c.registration.value, c.pipeClass.value]) });
  pages.push(cover);
  for (const r of eq) pages.push(recordBlocks(r));
  pages.push([{ k: 'h1', text: `Unit ${unit}: line register` }, { k: 'p', small: true, text: `Each line with its design conditions, line class and severity (SW-REG-8), fluid service and what follows from it (SW-REG-4), pipe material label (SW-REG-5) and the registration number of its unit's piping system for that class (SW-REG-6). ${LEGEND}` }, { k: 'table', head: LINE_HEAD, rows: ln.map(lineRow) }]);
  return { title: `SmartWeld plant 3, unit ${unit} ${name}: pressure equipment and piping records (demonstration)`, pages };
}
function sizeText(r: EquipmentRecord): string {
  const sh = r.shell;
  if (r.shape === 'sphere') return `sphere ${ftIn(sh.insideDiameter!.value)}`;
  if (r.shape === 'tube bundle') return `${num(r.tubes!.count.value)} tubes of ${size(r.tubes!.outsideDiameter.value)} in × ${ftIn(r.tubes!.length.value)}`;
  if (!sh.insideDiameter) return r.parts?.filter(p => p.insideDiameter).map(p => `${p.description} ${num(p.insideDiameter!.value)} in`).join(', ') ?? '—';
  return `${num(sh.insideDiameter.value)} in × ${sh.length ? ftIn(sh.length.value) : '—'}`;
}
/** the registration index as pages */
export function indexSections(): { title: string; pages: Block[][] } {
  const X = registrationIndex(), C = lineClasses();
  return { title: 'SmartWeld plant 3: registration index and line classes (demonstration)', pages: [
    [{ k: 'h1', text: 'Plant 3: registration index' }, { k: 'demo', text: NOTICE }, { k: 'p', text: `Jurisdiction: ${X.jurisdiction.value} [r]. ${X.vessels.length} vessel and boiler designs, ${X.pipingSystems.length} piping systems (one for each line class in each unit), ${X.heaterCoils.length} fired heater coils, ${X.components.length} packaged components, and ${X.fittings.length} fitting registrations (eight categories × ${X.fittings.length / 8 / MAKERS.length} pipe classes × ${MAKERS.length} fictional makers). Every number is invented by a rule from the item's tag (SW-REG-6).` },
      { k: 'h2', text: 'Line classes and severity (SW-REG-8)' }, { k: 'table', head: ['Line class', 'Pipe class', 'Material [r]', 'Fluid service [r]', 'Pressure rank', 'Medium rank', 'Severity', 'Lines', 'Sizes, in', 'Highest design', 'Fluids'], rows: C.map(c => [c.lineClass, c.pipeClass, c.materialName, c.fluidService, String(c.pressureRank), String(c.mediumRank), String(c.severity), String(c.lines), c.sizes[0] === c.sizes[1] ? size(c.sizes[0]) : `${size(c.sizes[0])} to ${size(c.sizes[1])}`, `${num(c.maxDesignP)} psi, ${num(c.maxDesignT)} °F`, c.fluids.join(', ')]) }],
    [{ k: 'h1', text: 'Vessel and boiler designs' }, { k: 'table', head: ['Tag', 'Unit', 'Report designation [r]', 'Registration [i]'], rows: X.vessels.map(v => [v.tag, String(v.unit), v.report, v.registration]) }],
    [{ k: 'h1', text: 'Piping systems, heater coils and components' }, { k: 'table', head: ['Unit', 'Line class', 'Lines', 'Piping system registration [i]'], rows: X.pipingSystems.map(s => [String(s.unit), s.lineClass, String(s.lines), s.registration]) },
      { k: 'h2', text: 'Fired heater coils' }, { k: 'table', head: ['Coil', 'Unit', 'Registration [i]'], rows: X.heaterCoils.map(c => [c.tag, String(c.unit), c.registration]) },
      { k: 'h2', text: 'Packaged components' }, { k: 'table', head: ['Tag', 'Unit', 'Maker [i]', 'Registration [i]'], rows: X.components.map(c => [c.tag, String(c.unit), c.maker, c.registration]) }],
    [{ k: 'h1', text: 'Fittings by category, pipe class and maker' }, { k: 'table', head: ['Category', 'Kind', 'Pipe class', 'Maker [i]', 'Registration [i]'], rows: X.fittings.map(q => [q.category, q.kind, q.pipeClass, q.maker, q.registration]) }],
  ] };
}

// ───────────────────────── the document ─────────────────────────
const table = (head: string[], rows: (string | number)[][]) => [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n');
export function registryDocument(): string {
  const M = processModel(), E = equipmentRecords(), L = lineRecords(), C = lineClasses(), X = registrationIndex(), coils = coilRecords(), comps = componentRecords();
  const count = <T>(xs: T[], k: (x: T) => string) => { const m = new Map<string, number>(); for (const x of xs) m.set(k(x), (m.get(k(x)) ?? 0) + 1); return m; };
  const byReport = count(E, r => r.report.value), units = M.sheets.map(s => s.no), noWeight = E.filter(r => !r.emptyWeightLb && r.kind !== 'cracker').map(r => r.tag);
  const out: string[] = [];
  out.push('# Plant 3: pressure equipment and piping records', '');
  out.push(`> **${BAND}.** Written by \`tools/refinery-registry.ts\` from \`src/refinery/registry.ts\`; do not edit by hand.`, '');
  out.push('This is the code layer of the demonstration refinery (DESIGN_BASIS.md §76): a record for every pressure vessel and boiler, the fluid service, line class and severity of every line, and a registration number for every design, piping system and fitting category. It exists so that software reading the model has realistic regulatory data to read. Three kinds of value appear, and every field in the data files says which it is:', '');
  out.push('- **model**: SmartWeld\'s own sizing and geometry (design conditions, dimensions, wall thickness, weight, connections). The wall on a record is the wall the 3D body is drawn with, and a test checks each against its pressure.');
  out.push('- **recalled**: code names, report designations, test factors, examination, heat treatment, fluid service and material labels, written from the assistant\'s general knowledge at the owner\'s instruction. No code, form or regulation was opened. They may be wrong or out of date and are **for the owner to verify** (SW-REG-0).');
  out.push('- **invented**: every registration number, serial number, fabricator and maker. None was issued by anyone; a number that happens to equal a real one means nothing.', '');
  out.push('No form of any code body is reproduced: the printable records are in SmartWeld\'s own layout.', '');
  out.push('## What is recorded', '');
  out.push(table(['Kind of record', 'Count', 'Rule'], [
    ['Pressure vessel records, designation U-1', byReport.get('U-1') ?? 0, 'SW-REG-1, -2, -3'], ['Pressure vessel records, designation U-1A', byReport.get('U-1A') ?? 0, 'SW-REG-1, -2, -3'], ['Boiler records, designation P-3 (drums as P-4 parts, external piping P-4A)', byReport.get('P-3') ?? 0, 'SW-REG-1, -2, -3'],
    ['Fired heater coils', coils.length, 'SW-REG-1'], ['Packaged components counted with the fittings', comps.length, 'SW-REG-1'], ['Lines with fluid service, line class and severity', L.length, 'SW-REG-4, -5, -8'], ['Line classes', C.length, 'SW-REG-8'],
    ['Piping system registrations (a line class in a unit)', X.pipingSystems.length, 'SW-REG-6'], ['Fitting registrations (category × pipe class × maker)', X.fittings.length, 'SW-REG-6'],
  ]), '');
  out.push('Outside this layer, with no record (SW-REG-1): storage tanks at atmospheric pressure, catalyst hoppers, basins and pits; pumps and compressors; structures.', '');
  out.push('## Fluid service of the lines', '');
  out.push('SmartWeld stands in for the owner in designating each line (SW-REG-4): Category D for benign fluids at 150 psi or less between −20 and 366 °F; Category M for acid gas and sour water stripper gas; Normal for the rest.', '');
  out.push(table(['Unit', 'Name', 'Lines', 'Category D', 'Normal', 'Category M'], units.map(u => { const l = L.filter(q => q.unit === u), n = (c: string) => l.filter(q => q.fluidService.value === c).length; return [u, M.sheet(u).name, l.length, n('D'), n('Normal'), n('M')]; }).concat([['', 'Plant', L.length, L.filter(q => q.fluidService.value === 'D').length, L.filter(q => q.fluidService.value === 'Normal').length, L.filter(q => q.fluidService.value === 'M').length]])), '');
  out.push(table(['Fluid service', 'Examination of welds (recalled)', 'Leak test (recalled)', 'Threaded joints'], [['Category D', 'visual', 'hydrostatic at 1.5 × design pressure, or an initial service test', 'allowed'], ['Normal', 'visual, and 5 % random radiography of girth butt welds', 'hydrostatic at 1.5 × design pressure', 'allowed'], ['Category M', 'visual, 20 % random radiography of girth butt welds, and a sensitive leak test', 'hydrostatic at 1.5 × design pressure', 'none: small bore is welded']]), '');
  out.push('## Line classes and severity', '');
  out.push('A line class is written `{group}{rating}-{material}-{service}{rank}` (SW-REG-8, SmartWeld\'s own scheme): the fluid group and pipe class of the generator\'s line class, a material label, the fluid service, and the medium\'s rank. Severity, 1 to 5, is the larger of the pressure rank (P150 1, P300 2, P600 3, P1200 4) and the medium rank (1 a Category D fluid; 2 harmful or beyond Category D but neither flammable nor toxic; 3 a flammable liquid; 4 a flammable gas, liquefied gas or hydrogen; 5 Category M).', '');
  out.push(table(['Line class', 'Pipe class', 'Material', 'Fluid service', 'Pressure rank', 'Medium rank', 'Severity', 'Lines', 'Sizes, in', 'Highest design', 'Fluids'], C.map(c => [`\`${c.lineClass}\``, c.pipeClass, c.materialName, c.fluidService, c.pressureRank, c.mediumRank, `**${c.severity}**`, c.lines, c.sizes[0] === c.sizes[1] ? size(c.sizes[0]) : `${size(c.sizes[0])} to ${size(c.sizes[1])}`, `${num(c.maxDesignP)} psi, ${num(c.maxDesignT)} °F`, c.fluids.join(', ')])), '');
  out.push(table(['Severity', 'Lines'], [5, 4, 3, 2, 1].map(s => [s, L.filter(l => l.severity.value.level === s).length])), '');
  out.push('## Pressure equipment', '');
  for (const u of units) {
    const eq = E.filter(r => r.unit === u); if (!eq.length) continue;
    out.push(`### Unit ${u}: ${M.sheet(u).name}`, '', UNIT_ROLE[u] ?? '', '');
    out.push(table(['Tag', 'Service', 'Report', 'Registration', 'Working pressure and temperature', 'Size', 'Wall, in', 'Material', 'Radiography', 'Heat treatment', 'Minimum metal temperature, °F', 'Weight, lb'],
      eq.map(r => [r.tag, r.service, r.report.value, r.registration.value, r.chambers.map(c => `${c.name}: ${num(c.mawp.value)} psi${c.fullVacuum.value ? ' and full vacuum' : ''} at ${num(c.temperature.value)} °F`).join('; '), sizeText(r), r.shell.thickness ? num(r.shell.thickness.value) : '—', r.shell.material.value, r.radiography.value, r.heatTreatment.value, r.mdmt.value, r.emptyWeightLb ? num(r.emptyWeightLb.value) : '—'])), '');
  }
  out.push('## Fired heater coils', '', 'As recalled, a fired process heater\'s coil is pressure equipment whose design is registered; each is listed with a design number and a piping code label, and is not a vessel (SW-REG-1).', '');
  out.push(table(['Coil', 'Service', 'Design', 'Material label', 'Registration'], coils.map(c => [c.tag, `${c.service}: ${c.coil}`, `${num(c.design.value.P)} psi at ${num(c.design.value.T)} °F`, c.material.value, c.registration.value])), '');
  out.push('## Packaged components counted with the fittings', '', table(['Tag', 'Unit', 'Service', 'Category', 'Maker', 'Registration'], comps.map(c => [c.tag, c.unit, c.service, `${c.category}: ${FITTING_CATEGORIES[c.category]}`, c.maker.value, c.registration.value])), '');
  const bep = L.filter(l => l.boilerExternalPiping), hot = L.filter(l => l.elevatedTemperature);
  out.push('## Lines with a note', '', `Boiler external piping (${bep.length} lines): from a Section I boiler to its first stop valve the line is labelled "ASME Section I / B31.1", report P-4A; beyond it, B31.3.`, '');
  out.push(table(['Line', 'From', 'To', 'Fluid'], bep.map(l => [l.number, l.from, l.to, l.fluidName])), '');
  out.push(`Design temperature of 800 °F or more (${hot.length} lines): marked "elevated-temperature provisions may apply: for the owner to decide". The model designates no line under them.`, '');
  out.push(table(['Line', 'From', 'To', 'Fluid', 'Design'], hot.map(l => [l.number, l.from, l.to, l.fluidName, `${num(l.design.value.P)} psi at ${num(l.design.value.T)} °F`])), '');
  out.push('## What the owner is asked to verify', '');
  out.push('Each item below is recalled, not looked up (SW-REG-0):', '');
  for (const s of ['which items fall under Section VIII Division 1 and which under Section I, and that a fired heater\'s coil is registered pressure equipment while pump and compressor casings are not (SW-REG-1);', 'the report designations U-1, U-1A, P-3, P-4 and P-4A and which item carries which (SW-REG-2);', 'test pressure at 1.3 × (Section VIII Division 1) and 1.5 × (Section I) the working pressure; full radiography above 1-1/4 in of wall, for hydrogen above 600 psi and for lethal service; heat treatment above 1-1/4 in and for amine, caustic and wet hydrogen sulfide; minimum metal temperatures of −20, −50 and −320 °F (SW-REG-3);', 'the limits of Category D, the designation of acid gas as Category M, the examination and leak test listed for each category, and whether the elevated-temperature provisions apply to the hot lines listed above (SW-REG-4);', 'every material designation (SW-REG-5);', 'the form of a Canadian Registration Number, the fitting categories A to H, and the digit 7 for New Brunswick (SW-REG-6).']) out.push(`- ${s}`);
  out.push('', '## Not yet in the model', '');
  out.push('- Relief valves are named on the records and set at the working pressure; the valves themselves enter the 3D model with the piping.');
  out.push('- Connections listed on a record are the item\'s process and utility connections; manways, vents, drains and instrument connections are not listed.');
  out.push('- A registration number for each pipe piece, fitting, flange and valve follows from its line\'s piping system and its fitting category once the piping is generated.');
  if (noWeight.length) out.push(`- No weight yet on ${noWeight.join(', ')}: their bodies are placed with the offsite units.`);
  out.push('', '## Files', '');
  out.push(table(['File', 'Content'], [['`public/refinery/registry/equipment.json`', 'every pressure equipment record, the heater coils and the packaged components'], ['`public/refinery/registry/lines.json`', 'the line classes and every line record'], ['`public/refinery/registry/registration.json`', 'the registration index'],
    ['`public/refinery/registry/unit-NN.pdf`', 'a unit\'s printable records: a summary, a page for each pressure equipment record, and its line register'], ['`public/refinery/registry/registration-index.pdf`', 'the index and the line classes, printable']]), '');
  return out.join('\n');
}
