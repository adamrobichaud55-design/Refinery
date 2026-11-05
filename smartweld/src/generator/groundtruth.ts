/**
 * Ground-truth export (stage 6, DESIGN_BASIS.md §41–44): every placed item of the plant piping with its metadata
 * (SW-GT-1), plant coordinates (SW-GT-2), item numbers (SW-GT-3), spools (SW-GT-4) and the isometric data of each
 * line (SW-GT-5). Reads only the plain-data piping model and the catalogue.
 */
import { VALVE_TYPES, pipeDims, CLASS_PRESSURE, type PipeClass, type PartSpec } from '../catalogue';
import { ruleIdsOf } from '../core/basis';
import { formatLength } from '../core/units';
import { partFromKey, type PipingModel, type LineRun, type Comp, type NozzleRun } from './piping';
import { lineClassFor, fluidGroupOf, classColour, type FluidGroup, type LineClass } from './lineclass';
import { elbowRadius } from '../catalogue';
import type { V3 } from './router';
import { PLANT1, type PlantDef } from './plant';
import { basisText } from '../core/basis';


// ---- SW-GT-2 plant coordinates ------------------------------------------------------------------------------
export const DATUM = 1200;                                                   // 100'-0" (in)
export interface PlantPt { E: number; N: number; EL: number }
export const toPlant = (p: V3): PlantPt => ({ E: p[0], N: -p[2], EL: DATUM + p[1] });
export const fromPlant = (q: PlantPt): V3 => [q.E, q.EL - DATUM, -q.N];
export const plantText = (q: PlantPt) => `E ${formatLength(q.E)}  N ${formatLength(q.N)}  EL ${formatLength(q.EL)}`;
const dirPlant = (d: V3) => ({ E: d[0], N: -d[2], EL: d[1] });

// ---- item records -------------------------------------------------------------------------------------------
export interface GTItem {
  tag: string; line: string; lineClass: string; kind: string; itemNo: number; description: string; designation: string; key: string;
  NPS: number; NPS2?: number; cls: PipeClass; material: string; ends: string; cutLength?: number; weight: number; spool: string;
  a: PlantPt; b: PlantPt; centre: PlantPt; axis: { E: number; N: number; EL: number }; rules: string[];
}
export interface GTWeld { tag: string; line: string; lineClass: string; type: 'BW' | 'SW' | 'FW'; size: number; NPS: number; cls: PipeClass; joins: [string, string]; shopField: 'shop' | 'field'; spool: string; spools: [string, string]; at: PlantPt; key: string; weight: number; rules: string[] }
export interface GTSupport { tag: string; line: string; lineClass: string; type: string; description: string; designation: string; key: string; material: string; weight: number; spool: 'loose'; at: PlantPt; rules: string[] }
export interface GTNode { at: PlantPt; kind: string; ref: string }
export interface GTLine {
  header: { line: string; lineClass: string; fluid: string; service: string; NPS: number; cls: PipeClass; designPressure: number; insulated: boolean; kind: string; from: string; to: string; flow: string; joint?: string };
  items: GTItem[]; welds: GTWeld[]; supports: GTSupport[];
  spools: { id: string; items: string[]; shopWelds: string[]; weight: number }[];
  bom: { itemNo: number; description: string; qty: number; length?: number; weight: number }[];
  nodes: GTNode[]; totals: { items: number; welds: number; fieldWelds: number; supports: number; pipeLength: number; weight: number };
}

const valveName = (t: string) => (VALVE_TYPES.find(v => v.id === t)?.name ?? t).toUpperCase();
const fmt = (n: number) => (n === 0.75 ? '3/4' : n === 0.5 ? '1/2' : String(n));
/** SW-GT-1 description written from the part */
function describe(c: Comp, p: PartSpec): { description: string; ends: string; NPS2?: number } {
  const k = c.key.split('|'), cls = c.cls, n = fmt(c.NPS);
  switch (c.kind) {
    case 'pipe': return k[4] === 'TH' ? { description: `PIPE ${n}" ${cls} THREADED CLASS, PLAIN ENDS`, ends: 'TH×TH' } : c.e1 === 'SP' ? { description: `PIPE ${n}" ${cls} PLAIN ENDS`, ends: 'SW×SW' } : { description: `PIPE ${n}" ${cls} BEVELLED ENDS`, ends: 'BW×BW' };
    case 'elbow': { const ang = k[3] ?? '90'; if (k[0] === 'SWEL') return { description: `ELBOW ${ang}° ${k[4] === 'SW' ? 'SOCKET-WELD' : 'THREADED'} ${n}" ${cls}`, ends: k[4] === 'SW' ? 'SW×SW' : 'TH×TH' }; return { description: `ELBOW ${ang}° R = 5/3 OD ${n}" ${cls}`, ends: 'BW×BW' }; }
    case 'tee': { const sw = k[0] === 'SWTEE', e = sw ? (k[4] === 'SW' ? 'SW' : 'TH') : 'BW', ends = `${e}×${e}×${e}`, form = sw ? (k[4] === 'SW' ? ' SOCKET-WELD' : ' THREADED') : '';
      return Number(k[3]) === c.NPS ? { description: `TEE EQUAL${form} ${n}" ${cls}`, ends } : { description: `TEE REDUCING${form} ${n}" × ${fmt(Number(k[3]))}" ${cls}`, ends, NPS2: Number(k[3]) }; }
    case 'reducer': return k[0] === 'REDE' ? { description: `REDUCER ECCENTRIC ${fmt(Number(k[1]))}" × ${fmt(Number(k[2]))}" ${cls} FLAT ${k[4].toUpperCase()}`, ends: 'BW×BW', NPS2: Number(k[2]) } : { description: `REDUCER CONCENTRIC ${fmt(Number(k[1]))}" × ${fmt(Number(k[2]))}" ${cls}`, ends: 'BW×BW', NPS2: Number(k[2]) };
    case 'cap': return { description: `CAP ${n}" ${cls}`, ends: 'BW' };
    case 'flange': return k[0] === 'SOF' ? { description: `FLANGE SLIP-ON ${n}" ${cls} RAISED FACE`, ends: 'SO×RF' } : k[0] === 'SWF' ? { description: `FLANGE SOCKET-WELD ${n}" ${cls} RAISED FACE`, ends: 'SW×RF' } : { description: `FLANGE WELD-NECK ${n}" ${cls} RAISED FACE`, ends: 'BW×RF' };
    case 'blind': return { description: `FLANGE BLIND ${n}" ${cls} RAISED FACE`, ends: 'RF' };
    case 'spade': return { description: `SPADE ${n}" ${cls} ${formatLength(p.dims.t.value)} THICK`, ends: 'RF×RF' };
    case 'spectacle': return { description: `SPECTACLE BLIND ${n}" ${cls} ${formatLength(p.dims.t.value)} THICK`, ends: 'RF×RF' };
    case 'nipple': { const e = k[4], close = p.extra?.close; return { description: `NIPPLE ${n}" ${cls} × ${formatLength(Number(k[3]))} ${close ? 'CLOSE' : e === 'TBE' ? 'THREADED BOTH ENDS' : e === 'TOE' ? 'THREADED ONE END, PLAIN ONE END' : 'PLAIN BOTH ENDS'}`, ends: e === 'TBE' ? 'TH×TH' : e === 'TOE' ? 'BW×TH' : 'SW×SW' }; }
    case 'coupling': return { description: `COUPLING ${k[3] === 'SW' ? 'SOCKET-WELD' : 'THREADED'} ${n}" ${cls}`, ends: k[3] === 'SW' ? 'SW×SW' : 'TH×TH' };
    case 'olet': return { description: `BRANCH OUTLET ${fmt(Number(k[1]))}" × ${fmt(Number(k[2]))}" ${cls} ${k[4] === 'SW' ? 'SOCKET-WELD' : k[4] === 'TH' ? 'THREADED' : 'BUTT-WELD'} OUTLET`, ends: `FW×${k[4]}`, NPS2: Number(k[1]) };
    case 'swage': return { description: `SWAGE CONCENTRIC ${fmt(Number(k[1]))}" × ${fmt(Number(k[2]))}" ${cls} ${k[4]}×${k[5]}`, ends: `${k[4]}×${k[5]}`, NPS2: Number(k[2]) };
    case 'plug': return { description: k[3] === 'SW' ? `PLUG SOCKET-WELD ${n}" ${cls}` : `PLUG ${(p.extra?.head as string) === 'square' ? 'SQUARE' : 'HEX'} HEAD THREADED ${n}" ${cls}`, ends: k[3] === 'SW' ? 'SW' : 'TH' };
    case 'penetration': return { description: k[0] === 'FSLV' ? `FLOOR SLEEVE ${fmt(p.dims.sleeve.value)}" FOR ${n}" LINE, WITH COLLAR` : `WALL SLEEVE ${fmt(p.dims.sleeve.value)}" FOR ${n}" LINE, WITH ESCUTCHEON`, ends: '—' };
    case 'gasket': return { description: `GASKET ${n}" ${cls} COMPRESSED SHEET`, ends: '—' };
    case 'studs': { const d = p.dims; return { description: `STUD SET ${d.n.value} × ${d.d.value}" × ${formatLength(d.L.value)} WITH 2 NUTS, FOR ${n}" ${cls}`, ends: '—' }; }
    case 'valve': { const ends = k[4] ?? 'RF', e = ends === 'RF' ? 'RF×RF' : `${ends}×${ends}`, f = ends === 'RF' ? '' : ends === 'SW' ? ' SOCKET-WELD ENDS' : ' THREADED ENDS';
      return k[1] === 'PSV' ? { description: `VALVE, ${valveName('PSV')} ${n}" ${cls} INLET × ${fmt(p.dims.outlet.value)}" P150 OUTLET`, ends: 'RF×RF', NPS2: p.dims.outlet.value } : { description: `VALVE, ${valveName(k[1])}${f} ${n}" ${cls}`, ends: k[1] === 'TWAY' ? e + '×' + ends : k[1] === 'FWAY' ? e + '×' + ends + '×' + ends : e }; }
    default: return { description: `${p.designation}`, ends: '—' };
  }
}
const LOOSE = new Set(['valve', 'gasket', 'studs', 'blind', 'spade', 'spectacle', 'plug', 'penetration']);
const rulesOf = (p: PartSpec) => [...new Set([...ruleIdsOf(p.dims), ...(p.weight.basis.kind === 'rule' ? [p.weight.basis.id] : [])])].sort();
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const unit = (a: V3): V3 => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/** SW-GT-4: spools — break at every field weld and every flanged (non-welded) joint */
function spoolsOf(r: LineRun): Map<string, string> {
  const chain = r.comps.filter(c => c.kind !== 'studs'), field = new Set(r.welds.filter(w => w.field).map(w => w.joins.join('>')));
  const out = new Map<string, string>(); let n = 0, open = false;
  for (let i = 0; i < chain.length; i++) {
    const c = chain[i];
    if (LOOSE.has(c.kind)) { out.set(c.tag, 'loose'); open = false; continue; }
    const prev = chain[i - 1], fieldBreak = prev && (field.has(`${prev.tag}>${c.tag}`) || field.has(`${c.tag}>${prev.tag}`));
    if (!open || fieldBreak) { n++; open = true; }
    out.set(c.tag, `${r.no}-SP${String(n).padStart(2, '0')}`);
  }
  for (const c of r.comps) if (c.kind === 'studs') out.set(c.tag, 'loose');
  return out;
}

export interface GroundTruth { lines: GTLine[]; classes: (LineClass & { lines: string[] })[]; nozzles: GTItem[] }
export function buildGroundTruth(m: PipingModel): GroundTruth {
  const byNo = new Map(m.lines.map(l => [l.no, l] as const)), spoolOfTag = new Map<string, string>();
  for (const r of m.lines) for (const [t, s] of spoolsOf(r)) spoolOfTag.set(t, s);
  const lines: GTLine[] = [], classMap = new Map<string, LineClass & { lines: string[] }>();
  for (const r of m.lines) {
    const group = fluidGroupOf(r, byNo) as FluidGroup, lc = lineClassFor(group, r.cls);
    if (!classMap.has(lc.code)) classMap.set(lc.code, { ...lc, lines: [] }); classMap.get(lc.code)!.lines.push(r.no);
    // items, numbered by description in the order met (SW-GT-3)
    const itemNos = new Map<string, number>(), items: GTItem[] = [];
    for (const c of [...r.comps, ...(r.side ?? []), ...(r.pens ?? [])]) {   // the chain, then a valve station's spare-port closure and the line's sleeves (stage 9)
      const p = partFromKey(c.key), d = describe(c, p);
      if (!itemNos.has(d.description)) itemNos.set(d.description, itemNos.size + 1);
      const axis = unit(sub(c.b, c.a)), mid: V3 = [(c.a[0] + c.b[0]) / 2, (c.a[1] + c.b[1]) / 2, (c.a[2] + c.b[2]) / 2];
      items.push({ tag: c.tag, line: r.no, lineClass: lc.code, kind: c.kind, itemNo: itemNos.get(d.description)!, description: d.description, designation: p.designation, key: c.key,
        NPS: c.NPS, ...(d.NPS2 !== undefined ? { NPS2: d.NPS2 } : {}), cls: c.cls, material: p.material.grade, ends: d.ends, ...(c.kind === 'pipe' || c.kind === 'nipple' ? { cutLength: len(sub(c.b, c.a)) + (c.ins ? c.ins[0] + c.ins[1] : 0) } : {}),
        weight: p.weight.value, spool: spoolOfTag.get(c.tag)!, a: toPlant(c.a), b: toPlant(c.b), centre: toPlant(c.kind === 'valve' ? [c.T[12], c.T[13], c.T[14]] : mid), axis: dirPlant(axis), rules: rulesOf(p) });
    }
    const welds: GTWeld[] = r.welds.map(w => {
      const s0 = spoolOfTag.get(w.joins[0]) ?? `parent ${w.joins[0]}`, s1 = spoolOfTag.get(w.joins[1]) ?? `parent ${w.joins[1]}`, p = partFromKey(w.key);
      return { tag: w.id, line: r.no, lineClass: lc.code, type: w.type ?? 'BW', size: w.size, NPS: w.NPS, cls: r.cls, joins: w.joins, shopField: w.field ? 'field' : 'shop', spool: w.field ? 'field' : s0, spools: [s0, s1], at: toPlant(w.at), key: w.key, weight: p.weight.value, rules: ['SW-PW-1', 'SW-PW-2', 'SW-PW-3', ...rulesOf(p)].filter((x, i, a) => a.indexOf(x) === i) };
    });
    const supports: GTSupport[] = r.supports.map(s => { const p = partFromKey(s.key); return { tag: s.id, line: r.no, lineClass: lc.code, type: s.type, description: `${s.type.toUpperCase()} FOR ${fmt(r.NPS)}" LINE (${p.designation})`, designation: p.designation, key: s.key, material: p.material.grade, weight: p.weight.value, spool: 'loose', at: toPlant(s.at), rules: rulesOf(p) }; });
    // spools
    const spMap = new Map<string, { id: string; items: string[]; shopWelds: string[]; weight: number }>();
    for (const it of items) if (it.spool !== 'loose') { const s = spMap.get(it.spool) ?? { id: it.spool, items: [], shopWelds: [], weight: 0 }; s.items.push(it.tag); s.weight += it.weight; spMap.set(it.spool, s); }
    for (const w of welds) if (w.shopField === 'shop' && spMap.has(w.spool)) { const s = spMap.get(w.spool)!; s.shopWelds.push(w.tag); s.weight += w.weight; }
    // BOM by item number
    const bomMap = new Map<number, { itemNo: number; description: string; qty: number; length?: number; weight: number }>();
    for (const it of items) { const e = bomMap.get(it.itemNo) ?? { itemNo: it.itemNo, description: it.description, qty: 0, ...(it.kind === 'pipe' ? { length: 0 } : {}), weight: 0 }; e.qty++; if (it.cutLength !== undefined) e.length! += it.cutLength; e.weight += it.weight; bomMap.set(it.itemNo, e); }
    // isometric nodes along the chain (SW-GT-5): each item's start and end, elbow work points and tee centres
    const nodes: GTNode[] = [], addNode = (p: V3, kind: string, ref: string) => { const q = toPlant(p), last = nodes[nodes.length - 1]; if (last && Math.hypot(last.at.E - q.E, last.at.N - q.N, last.at.EL - q.EL) < 1e-6) return; nodes.push({ at: q, kind, ref }); };
    let cur: V3 | null = null;
    for (const c of r.comps.filter(x => x.kind !== 'studs')) {
      const [s, e]: [V3, V3] = !cur || len(sub(c.a, cur)) <= len(sub(c.b, cur)) ? [c.a, c.b] : [c.b, c.a];
      addNode(s, `${c.kind} start`, c.tag);
      if (c.kind === 'elbow') { const k = c.key.split('|'), ang = Number(k[3]) || 90, R = k[0] === 'SWEL' ? (partFromKey(c.key).extra!.A as number) : elbowRadius(pipeDims(c.NPS, c.cls).OD) * Math.tan((ang * Math.PI) / 360), z: V3 = [c.T[8], c.T[9], c.T[10]]; const wp: V3 = [c.a[0] + z[0] * R, c.a[1] + z[1] * R, c.a[2] + z[2] * R]; addNode(wp, 'elbow work point', c.tag); }
      if (c.kind === 'tee') addNode([c.T[12], c.T[13], c.T[14]], 'tee centre', c.tag);
      addNode(e, `${c.kind} end`, c.tag); cur = e;
    }
    const pipeLength = items.filter(i => i.kind === 'pipe').reduce((a, i) => a + i.cutLength!, 0), weight = items.reduce((a, i) => a + i.weight, 0);
    lines.push({
      header: { line: r.no, lineClass: lc.code, fluid: lc.fluid, service: r.service, NPS: r.NPS, cls: r.cls, designPressure: CLASS_PRESSURE[r.cls], insulated: lc.insulated, kind: r.kind, from: r.from, to: r.to, flow: `${r.from} → ${r.to}`, ...(r.joint ? { joint: r.joint } : {}) },
      items, welds, supports, spools: [...spMap.values()], bom: [...bomMap.values()].sort((a, b) => a.itemNo - b.itemNo), nodes,
      totals: { items: items.length, welds: welds.length, fieldWelds: welds.filter(w => w.shopField === 'field').length, supports: supports.length, pipeLength, weight },
    });
  }
  // equipment nozzle necks: equipment items, recorded with the line class of the line at their face
  const lineAt = new Map<string, LineRun>(); for (const r of m.lines) for (const e of [r.from, r.to]) if (!lineAt.has(e)) lineAt.set(e, r);
  const nozzles: GTItem[] = m.nozzles.flatMap((n: NozzleRun) => n.comps.map(c => {
    const p = partFromKey(c.key), d = describe(c, p), mid: V3 = [(c.a[0] + c.b[0]) / 2, (c.a[1] + c.b[1]) / 2, (c.a[2] + c.b[2]) / 2], att = lineAt.get(n.id) ?? lineAt.get(`PSV on ${n.id}`);
    return { tag: c.tag, line: `${n.equip} nozzle ${n.id}`, lineClass: `equipment (${att ? att.lineClass ?? '' : ''})`, kind: c.kind, itemNo: 1, description: `NOZZLE ${d.description}`, designation: p.designation, key: c.key, NPS: c.NPS, cls: c.cls, material: p.material.grade, ends: d.ends, ...(c.kind === 'pipe' ? { cutLength: len(sub(c.b, c.a)) } : {}), weight: p.weight.value, spool: `${n.equip} (equipment)`, a: toPlant(c.a), b: toPlant(c.b), centre: toPlant(mid), axis: dirPlant(unit(sub(c.b, c.a))), rules: ['SW-NOZ-1', ...rulesOf(p)] };
  }));
  return { lines, classes: [...classMap.values()].sort((a, b) => a.code.localeCompare(b.code)), nozzles };
}

export const lineFileName = (no: string) => no.replace(/"/g, 'in').replace(/\//g, '-') + '.json';
const r4 = (_k: string, v: unknown) => (typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v);
/** SW-GT-6: the files of the export, path → content (deterministic) */
export function exportFiles(gt: GroundTruth, equipment?: GTEquipment[]): Map<string, string> {
  const f = new Map<string, string>();
  if (equipment) f.set('equipment.json', JSON.stringify(equipment, r4, 1));
  for (const l of gt.lines) f.set(`lines/${lineFileName(l.header.line)}`, JSON.stringify(l, r4, 1));
  f.set('line-classes.json', JSON.stringify(gt.classes.map(c => ({ ...c, colour: `#${classColour(c.code).toString(16).padStart(6, '0')}` })), r4, 1));
  f.set('nozzles.json', JSON.stringify(gt.nozzles, r4, 1));
  f.set('index.json', JSON.stringify({ datum: 'EL 100\'-0" = floor; E = +x, N = -z (SW-GT-2)', lines: gt.lines.map(l => ({ ...l.header, file: `lines/${lineFileName(l.header.line)}`, ...l.totals })) }, r4, 1));
  const csv = ['line,lineClass,itemNo,description,qty,length_in,weight_lb'];
  for (const l of gt.lines) for (const b of l.bom) csv.push([l.header.line, l.header.lineClass, b.itemNo, b.description, b.qty, b.length !== undefined ? b.length.toFixed(3) : '', b.weight.toFixed(2)].map(v => { const s = String(v); return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(','));
  f.set('bom.csv', csv.join('\n') + '\n');
  return f;
}

// ---- SW-GT-7 equipment metadata -------------------------------------------------------------------------------
export interface GTEquipment {
  tag: string; type: string; description: string; area: string; areaName: string; designation: string; material: string; weight: number;
  origin: PlantPt; axis?: { E: number; N: number; EL: number }; dims: { name: string; label: string; value: number; unit: string; basis: string }[];
  nozzles: { id: string; service: string; NPS: number; cls: PipeClass; face: PlantPt; facing: { E: number; N: number; EL: number }; line: string | null; lineClass: string | null }[];
}
const EQUIP_TYPE: Record<string, string> = { VESSEL_V: 'Vertical vessel', VESSEL_H: 'Horizontal drum', EXCHANGER: 'Shell-and-tube exchanger', PUMP: 'Centrifugal pump', TANK: 'Cone-roof storage tank', HOPPER: 'Solids hopper' };
export function buildEquipment(m: PipingModel, plant: PlantDef = PLANT1): GTEquipment[] {
  const nz = plant.nozzles(), defs = plant.nozzleDefs(), lineAt = new Map<string, LineRun>();
  const areaOf = (tag: string) => Object.keys(plant.areas).find(a => plant.areas[a].equipment.includes(tag)) ?? Object.keys(plant.areas)[Object.keys(plant.areas).length - 1];
  for (const r of m.lines) for (const e of [r.from, r.to]) { const id = e.startsWith('PSV on ') ? e.slice(7) : e; if (!lineAt.has(id)) lineAt.set(id, r); }
  return plant.interior(m.cuts).equipment.map(e => {
    const p = e.part, area = areaOf(e.tag);
    const nozzles = defs.filter(d => d.equip === e.tag).map(d => { const n = nz.get(d.id)!, l = lineAt.get(d.id) ?? null; return { id: d.id, service: d.service, NPS: d.NPS, cls: d.cls, face: toPlant(n.face), facing: dirPlant(n.u), line: l?.no ?? null, lineClass: l?.lineClass ?? null }; });
    return { tag: e.tag, type: EQUIP_TYPE[p.kind] ?? p.kind, description: p.designation, area, areaName: plant.areas[area].name, designation: p.designation, material: p.material.grade, weight: p.weight.value,
      origin: toPlant([e.transform[12], e.transform[13], e.transform[14]]), axis: dirPlant([e.transform[8], e.transform[9], e.transform[10]]), dims: Object.entries(p.dims).filter(([k]) => k !== 'rho').map(([k, d]) => ({ name: k, label: d.label, value: d.value, unit: d.unit, basis: basisText(d.basis) })), nozzles };
  });
}
