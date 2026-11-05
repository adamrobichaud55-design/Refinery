// Exchange package for a piping designer (DESIGN_BASIS.md §58, SW-XCH-1..5): the model as SmartWeld's own neutral
// export (CSV + JSON), a spec request list, a three-line pilot, a README and a manifest, zipped.
//   vite-node tools/designer-package.ts            writes downloads/designer-package/ and downloads/designer-package.zip
// Built from the committed ground truth only; no outside format description is consulted (P-62).
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { deflateRawSync } from 'node:zlib';
import { partFromKey } from '../src/generator/piping';
import type { GTLine, GTItem, GTEquipment } from '../src/generator/groundtruth';

import { plantById } from '../src/generator/plants';
const plant = plantById(process.argv[2] ?? 'P1'), OUT = plant.paths.designer, GT = plant.paths.groundtruth;
const PILOT = plant.pilot;
type P = { E: number; N: number; EL: number };
const idx = JSON.parse(readFileSync(`${GT}/index.json`, 'utf8')) as { lines: { line: string; file: string }[] };
const lines = idx.lines.map(l => JSON.parse(readFileSync(`${GT}/${l.file}`, 'utf8')) as GTLine);
const nozzles = JSON.parse(readFileSync(`${GT}/nozzles.json`, 'utf8')) as GTItem[];
const equipment = JSON.parse(readFileSync(`${GT}/equipment.json`, 'utf8')) as GTEquipment[];

const r4 = (v: number) => (Math.round(v * 1e4) / 1e4).toFixed(4);
const mm = (v: number) => (Math.round(v * 25.4 * 100) / 100).toFixed(2);
const csvCell = (v: unknown) => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = (head: string[], rows: unknown[][]) => [head.join(','), ...rows.map(r => r.map(csvCell).join(','))].join('\n') + '\n';
const pt = (p?: P) => (p ? [r4(p.E), r4(p.N), r4(p.EL), mm(p.E), mm(p.N), mm(p.EL)] : ['', '', '', '', '', '']);
const near = (a: P, b: P) => Math.hypot(a.E - b.E, a.N - b.N, a.EL - b.EL) < 1 / 32;

// the branch end of every tee: the weld that joins the tee to a part that is not on either run end (SW-XCH-2)
const allWelds = lines.flatMap(L => L.welds);
const branchEnd = new Map<string, { at: P; line: string }>();
for (const L of lines) for (const it of L.items) if (it.kind === 'tee') {
  const w = allWelds.find(x => x.joins.includes(it.tag) && !near(x.at as P, it.a as P) && !near(x.at as P, it.b as P));
  if (w) { const other = w.joins.find(j => j !== it.tag)!; branchEnd.set(it.tag, { at: w.at as P, line: other.slice(0, other.lastIndexOf('/')) }); }
}

// angle valves (the relief valves): end 1 is the inlet face, the centre is the body's corner, end 2 the outlet face, which is
// where the outlet line starts (that line runs 'from PSV on <nozzle>', the nozzle the valve's own line starts at) (SW-XCH-2)
const outletFace = new Map<string, P>();
for (const L of lines) for (const it of L.items) if (it.kind === 'valve' && it.key.startsWith('VLV|PSV|')) {
  const out = lines.find(o => o.header.from === `PSV on ${L.header.from}`);
  if (!out) throw new Error(`no outlet line for the relief valve ${it.tag}`);
  outletFace.set(it.tag, out.items[0].a as P);
}

const LINE_HEAD = ['line', 'lineClass', 'fluid', 'service', 'sizeIn', 'pressureClass', 'designPressurePsi', 'insulated', 'kind', 'joint', 'from', 'to', 'tapsLine', 'components', 'welds', 'supports', 'pipeLengthIn'];
const lineRow = (L: GTLine) => { const H = L.header; return [H.line, H.lineClass, H.fluid, H.service, H.NPS, H.cls, H.designPressure, H.insulated ? 'yes' : 'no', H.kind, H.joint ?? 'BW', H.from, H.to, [H.from, H.to].filter(x => x.startsWith('tap ')).map(x => x.slice(4)).join(' '), L.items.length, L.welds.length, L.supports.length, r4(L.totals.pipeLength)]; };
const XYZ = (p: string) => [`${p}E_in`, `${p}N_in`, `${p}EL_in`, `${p}E_mm`, `${p}N_mm`, `${p}EL_mm`];
const COMP_HEAD = ['line', 'tag', 'seq', 'type', 'partCode', 'description', 'sizeIn', 'branchSizeIn', 'pressureClass', 'lineClass', 'ends', 'material', 'weightLb', 'spool', 'cutLengthIn', ...XYZ('end1'), ...XYZ('end2'), ...XYZ('centre'), ...XYZ('branch'), 'branchLine'];
const compRow = (line: string, it: GTItem, seq: number) => {
  const b = branchEnd.get(it.tag), angle = outletFace.get(it.tag);
  const centre = it.kind === 'elbow' || it.kind === 'tee' ? it.centre as P : angle ? it.b as P : undefined;
  return [line, it.tag, seq, it.kind, it.key, it.description, it.NPS, it.NPS2 ?? '', it.cls, it.lineClass, it.ends, it.material, r4(it.weight), it.spool, it.cutLength !== undefined ? r4(it.cutLength) : '',
    ...pt(it.a as P), ...pt(angle ?? it.b as P), ...pt(centre), ...pt(b?.at), b?.line ?? ''];
};
const WELD_HEAD = ['line', 'tag', 'label', 'joins1', 'joins2', 'shopOrField', 'weldType', 'sizeIn', 'pressureClass', 'spools', ...XYZ('')];
const weldRow = (L: GTLine, w: GTLine['welds'][number]) =>
  [L.header.line, w.tag, w.tag.slice(w.tag.lastIndexOf('/') + 1), w.joins[0], w.joins[1], w.shopField, w.type, w.NPS, w.cls, (w.spools ?? []).join(' '), ...pt(w.at as P)];
const SUP_HEAD = ['line', 'tag', 'type', 'designation', 'description', 'material', 'weightLb', ...XYZ('')];
const supRow = (L: GTLine, s: GTLine['supports'][number]) => [L.header.line, s.tag, s.type, s.designation, s.description, s.material, r4(s.weight), ...pt(s.at as P)];
const EQ_HEAD = ['equipment', 'type', 'description', 'nozzle', 'service', 'sizeIn', 'pressureClass', 'line', 'lineClass', ...XYZ('face'), 'facingE', 'facingN', 'facingEL'];
const eqRows = (eqs = equipment) => eqs.flatMap(e => e.nozzles.map(n => [e.tag, e.type, e.description, n.id, n.service, n.NPS, n.cls, n.line ?? '', n.lineClass ?? '', ...pt(n.face as P), n.facing.E, n.facing.N, n.facing.EL]));
// the equipment the lines connect to (SW-XCH-6): its type, every stated and rule-set dimension, its origin and axis in plant coordinates
const EQI_HEAD = ['equipment', 'type', 'description', 'area', 'material', 'weightLb', ...XYZ('origin'), 'axisE', 'axisN', 'axisEL', 'nozzles', 'dimensions (label=value unit (rule))'];
const eqItemRows = (eqs = equipment) => eqs.map(e => [e.tag, e.type, e.description, e.areaName, e.material, r4(e.weight), ...pt(e.origin as P), e.axis?.E ?? '', e.axis?.N ?? '', e.axis?.EL ?? '', e.nozzles.map(n => n.id).join(' '), e.dims.map(d => `${d.label}=${Number(d.value.toFixed(4))} ${d.unit} (${d.basis})`).join('; ')]);

/** every distinct part per line class with its rule-set dimensions (SW-XCH-3) */
function specRows(ls: GTLine[], withNozzles: boolean) {
  const by = new Map<string, { lc: string; it: GTItem; n: number; code: string }>();
  const add = (lc: string, it: GTItem) => {
    const code = it.kind === 'pipe' ? it.key.split('|').slice(0, 3).join('|') : it.key, k = `${lc}|${code}`;
    const e = by.get(k); if (e) e.n++; else by.set(k, { lc, it, n: 1, code });
  };
  for (const L of ls) for (const it of L.items) add(L.header.lineClass, it);
  if (withNozzles) for (const it of nozzles) add('equipment nozzles', it);
  return [...by.values()].sort((a, b) => (a.lc + a.code).localeCompare(b.lc + b.code)).map(({ lc, it, n, code }) => {
    const p = partFromKey(it.kind === 'pipe' ? `${code}|12.000` : code);
    const dims = Object.values(p.dims).filter(d => !/length/i.test(d.label) || it.kind !== 'pipe')
      .map(d => `${d.label}=${Number(d.value.toFixed(4))} ${d.unit}${d.basis.kind === 'rule' ? ` (${d.basis.id})` : d.basis.kind === 'drawing' ? ' (stated)' : ''}`).join('; ');
    return [lc, it.kind, code, it.description.replace(/ BEVELLED ENDS$/, ' BEVELLED ENDS'), it.NPS, it.NPS2 ?? '', it.cls, it.ends, it.material, n, it.kind === 'pipe' ? 'per inch of length' : r4(p.weight.value), dims];
  });
}
const SPEC_HEAD = ['lineClass', 'type', 'partCode', 'description', 'sizeIn', 'branchSizeIn', 'pressureClass', 'ends', 'material', 'countInPlant', 'unitWeightLb', 'dimensions (label=value unit (rule))'];

function writeSet(dir: string, ls: GTLine[], withNozzles: boolean) {
  mkdirSync(dir, { recursive: true });
  // the equipment these lines touch (every item in the full set)
  const touched = new Set(ls.flatMap(L => [L.header.from, L.header.to]).map(e => e.replace(/^PSV on /, '')).map(id => equipment.find(e => e.nozzles.some(n => n.id === id))?.tag).filter(Boolean) as string[]);
  const eqs = withNozzles ? equipment : equipment.filter(e => touched.has(e.tag));
  writeFileSync(join(dir, 'lines.csv'), csv(LINE_HEAD, ls.map(lineRow)));
  const comps = ls.flatMap(L => L.items.map((it, i) => compRow(L.header.line, it, i + 1)));
  if (withNozzles) comps.push(...nozzles.map((it, i) => compRow(it.line, it, i + 1)));
  writeFileSync(join(dir, 'components.csv'), csv(COMP_HEAD, comps));
  writeFileSync(join(dir, 'welds.csv'), csv(WELD_HEAD, ls.flatMap(L => L.welds.map(w => weldRow(L, w)))));
  writeFileSync(join(dir, 'supports.csv'), csv(SUP_HEAD, ls.flatMap(L => L.supports.map(s => supRow(L, s)))));
  writeFileSync(join(dir, 'equipment-nozzles.csv'), csv(EQ_HEAD, eqRows(eqs)));
  writeFileSync(join(dir, 'equipment.csv'), csv(EQI_HEAD, eqItemRows(eqs)));
  const spec = specRows(ls, withNozzles);
  writeFileSync(join(dir, 'spec-request.csv'), csv(SPEC_HEAD, spec));
  const obj = (head: string[], rows: unknown[][]) => rows.map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
  writeFileSync(join(dir, 'model.json'), JSON.stringify({ units: { coordinates: 'inches and millimetres', weights: 'pounds' }, coordinates: 'E = east, N = north, EL = elevation; floor at EL 1200 in (100\'-0")',
    lines: obj(LINE_HEAD, ls.map(lineRow)), components: obj(COMP_HEAD, comps), welds: obj(WELD_HEAD, ls.flatMap(L => L.welds.map(w => weldRow(L, w)))),
    supports: obj(SUP_HEAD, ls.flatMap(L => L.supports.map(s => supRow(L, s)))), equipment: obj(EQI_HEAD, eqItemRows(eqs)), equipmentNozzles: obj(EQ_HEAD, eqRows(eqs)), specRequest: obj(SPEC_HEAD, spec) }, null, 1));
  return { lines: ls.length, components: comps.length, welds: ls.reduce((n, L) => n + L.welds.length, 0), supports: ls.reduce((n, L) => n + L.supports.length, 0), specParts: spec.length, equipment: eqs.length };
}

rmSync(OUT, { recursive: true, force: true });
const full = writeSet(OUT, lines, true);
// the three pilot lines and every line descended from them (branches of branches too), so no pilot tee is left open
const inPilot = new Set(PILOT);
const tapOf = (L: GTLine) => [L.header.from, L.header.to].filter(x => x.startsWith('tap ')).map(x => x.slice(4));   // a line taps another at its start or its end
for (let grew = true; grew;) { grew = false; for (const L of lines) if (!inPilot.has(L.header.line) && tapOf(L).some(x => inPilot.has(x))) { inPilot.add(L.header.line); grew = true; } }
const pilotLines = lines.filter(L => inPilot.has(L.header.line));
const pilot = writeSet(join(OUT, 'pilot'), pilotLines, false);
writeFileSync(join(OUT, 'README.md'), readFileSync('tools/designer-README.md', 'utf8')
  .replace('{{PLANT}}', plant.name)
  .replace('{{FULL}}', `${full.lines} lines, ${full.components} components (including ${nozzles.length} equipment nozzle parts), ${full.welds} welds, ${full.supports} supports, ${full.equipment} equipment items, ${full.specParts} distinct parts in the spec request`)
  .replace('{{PILOT}}', `${pilot.lines} lines (${pilotLines.map(L => L.header.line).join(', ')}), ${pilot.components} components, ${pilot.welds} welds, ${pilot.supports} supports, ${pilot.specParts} distinct parts`
    + pilotLines.flatMap(L => tapOf(L).filter(x => !inPilot.has(x)).map(x => `. ${L.header.line} ${L.header.from === `tap ${x}` ? 'starts' : 'ends'} at a tee on ${x}, which is not in the pilot: treat that end as a continuation to that line`)).join('')));

// manifest and zip (stored with deflate by Node's zlib; the zip container is written here)
const files: string[] = []; const walk = (d: string) => { for (const n of readdirSync(d).sort()) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else files.push(p); } }; walk(OUT);
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex');
writeFileSync(join(OUT, 'MANIFEST.txt'), ['SmartWeld exchange package — files and SHA-256 (DESIGN_BASIS.md SW-XCH-5)', '', ...files.map(p => `${sha(p)}  ${relative(OUT, p)}`)].join('\n') + '\n');
files.push(join(OUT, 'MANIFEST.txt'));
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const parts: Buffer[] = [], central: Buffer[] = []; let off = 0;
for (const p of files) {
  const data = readFileSync(p), z = deflateRawSync(data, { level: 9 }), name = Buffer.from(`smartweld-designer-package${plant.id === 'P1' ? '' : '-' + plant.id}/${relative(OUT, p)}`), crc = crc32(data);
  const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(8, 8); lh.writeUInt32LE(0, 10);
  lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(z.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(name.length, 26); lh.writeUInt16LE(0, 28);
  const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(8, 10); ch.writeUInt32LE(0, 12);
  ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(z.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(name.length, 28); ch.writeUInt32LE(off, 42);
  parts.push(lh, name, z); central.push(ch, name); off += 30 + name.length + z.length;
}
const cd = Buffer.concat(central), end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
writeFileSync(`${OUT}.zip`, Buffer.concat([...parts, cd, end]));
console.log(JSON.stringify({ full, pilot, files: files.length, zipBytes: off + cd.length + 22 }, null, 1));
