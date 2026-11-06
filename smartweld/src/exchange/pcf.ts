/**
 * Piping component files (DESIGN_BASIS.md SW-PCF-1..4, amended with the owner's review of 2026-11-05/06): one plain-text
 * file per line, written from the ground truth of SW-GT-6 by SmartWeld's own writer. The record vocabulary (UNITS-*,
 * PIPELINE-REFERENCE, END-POINT, CENTRE-POINT, BRANCH1-POINT, SKEY, ITEM-CODE, MATERIALS …) is the common line-file
 * vocabulary isometric tools read; the symbol keys are SmartWeld's own convention of SW-PCF-3 (two letters for the item,
 * two for its ends), listed in tools/pcf-mapping.md from the same table (PCF_MAP below). Nothing here is read from any
 * outside file: every number comes from the ground truth.
 */
import type { GTLine, GTItem } from '../generator/groundtruth';

type Pt = { E: number; N: number; EL: number };
const near = (p: Pt, q: Pt, tol = 0.05) => Math.abs(p.E - q.E) <= tol && Math.abs(p.N - q.N) <= tol && Math.abs(p.EL - q.EL) <= tol;
const f = (v: number) => (Math.abs(v) < 5e-5 ? '0' : v.toFixed(4).replace(/\.?0+$/, ''));
const pt = (p: Pt) => `${f(p.E)} ${f(p.N)} ${f(p.EL)}`;
const dist = (p: Pt, q: Pt) => Math.hypot(p.E - q.E, p.N - q.N, p.EL - q.EL);

/** where a plant's PCF files live: beside its ground-truth folder */
export const pcfDir = (groundtruth: string) => groundtruth.replace(/[\\/]groundtruth$/, '') + '/pcf';
/** the file name of a line's PCF (the size's " as "in", "/" as "-") */
export const pcfName = (line: string) => line.replace(/"/g, 'in').replace(/\//g, '-') + '.pcf';

/** SW-PCF-3: the end-type letters of a symbol key, from an item's end types ("BW×BW", "RF×RF", "SW×SW", "TH×TH", "SO×RF", "SP×TH" …) */
export function endLetters(ends: string): string {
  const e = ends.split('×').map(x => x.trim()).filter(x => x && x !== '—');
  const has = (t: string) => e.includes(t);
  if (e.length === 0) return 'PE';
  if (e.every(x => x === 'RF')) return 'FL';
  if (has('SO')) return 'SO';                       // slip-on flange
  if (has('BW') && has('RF')) return 'WN';          // weld-neck flange
  if (has('SW') && has('RF')) return 'SF';          // socket-weld flange
  if (has('TH') && has('RF')) return 'TF';          // threaded flange
  if (e.every(x => x === 'BW')) return 'BW';
  if (e.every(x => x === 'SW' || x === 'SP')) return 'SW';
  if (e.every(x => x === 'TH')) return 'SC';        // screwed
  if (has('BW') && (has('SW') || has('SP'))) return 'BS';   // butt-weld to socket-weld
  if (has('BW') && has('TH')) return 'BC';          // butt-weld to screwed
  if ((has('SW') || has('SP')) && has('TH')) return 'SS';   // socket-weld (plain into a socket) to screwed
  if (has('FW')) return endLetters(e.filter(x => x !== 'FW').join('×'));   // an outlet: by its outlet end
  return 'PE';
}

/** SW-PCF-3: the record type and the two item letters of the symbol key for a ground-truth item kind (and valve type) */
export const PCF_MAP: { kind: string; match?: (it: GTItem) => boolean; record: string; item: string; note: string }[] = [
  { kind: 'pipe', record: 'PIPE', item: 'PI', note: 'straight pipe; cut length in the second component attribute' },
  { kind: 'nipple', record: 'PIPE', item: 'NI', note: 'nipple (TBE, TOE, PBE, CLOSE): a short pipe record; NISC both ends screwed, NISS plain into a socket and screwed at the other end, NIBC butt-welded and screwed' },
  { kind: 'elbow', match: it => it.key.split('|')[3] === '45', record: 'ELBOW', item: 'E4', note: '45° elbow' },
  { kind: 'elbow', record: 'ELBOW', item: 'EL', note: '90° elbow: butt-weld long radius, or forged socket-weld / threaded (SW-SWT-3)' },
  { kind: 'tee', record: 'TEE', item: 'TE', note: 'tee (equal or reducing); BRANCH1-POINT always written' },
  { kind: 'outlet', record: 'BRANCH-OUTLET', item: 'OL', note: 'branch outlet on the run; first END-POINT on the run axis with the run bore, second at the outlet with the branch bore; ends by the outlet (BW, SW, SC)' },
  { kind: 'reducer', match: it => it.key.startsWith('REDE'), record: 'REDUCER-ECCENTRIC', item: 'RE', note: 'eccentric reducer (flat side in the ground truth key); each END-POINT carries its own bore' },
  { kind: 'reducer', record: 'REDUCER-CONCENTRIC', item: 'RC', note: 'concentric reducer; each END-POINT carries its own bore' },
  { kind: 'swage', record: 'REDUCER-CONCENTRIC', item: 'SG', note: 'swage nipple; ends by its two end types (BS, BC, SS, SW, SC); each END-POINT carries its own bore' },
  { kind: 'cap', record: 'CAP', item: 'CA', note: 'butt-weld cap; the letters name its one connecting end' },
  { kind: 'plug', record: 'CAP', item: 'PL', note: 'threaded plug in a valve\'s end (SW-LL-8); the letters name its one connecting end (SC)' },
  { kind: 'coupling', record: 'COUPLING', item: 'CP', note: 'full coupling, socket-weld or threaded' },
  { kind: 'flange', match: it => it.key.startsWith('SOF'), record: 'FLANGE', item: 'FL', note: 'slip-on flange (ends SO)' },
  { kind: 'flange', match: it => it.key.startsWith('SWF'), record: 'FLANGE', item: 'FL', note: 'socket-weld flange (ends SF)' },
  { kind: 'flange', record: 'FLANGE', item: 'FL', note: 'weld-neck flange (ends WN)' },
  { kind: 'blind', record: 'FLANGE-BLIND', item: 'FB', note: 'blind flange' },
  { kind: 'spade', record: 'MISC-COMPONENT', item: 'SP', note: 'spade (blank) between two flanges' },
  { kind: 'spectacle', record: 'MISC-COMPONENT', item: 'SB', note: 'spectacle blind between two flanges' },
  { kind: 'gasket', record: 'GASKET', item: 'GA', note: 'gasket at a flanged joint' },
  { kind: 'studs', record: 'BOLT', item: 'BO', note: 'stud set with nuts at a flanged joint (count, diameter and length in the description)' },
  { kind: 'penetration', match: it => it.key.startsWith('FSLV'), record: 'MISC-COMPONENT', item: 'PF', note: 'floor sleeve the pipe passes through (SW-PEN-1)' },
  { kind: 'penetration', record: 'MISC-COMPONENT', item: 'PW', note: 'wall sleeve the pipe passes through (SW-PEN-2)' },
  { kind: 'valve', match: it => it.key.startsWith('VLV|PSV'), record: 'VALVE-ANGLE', item: 'VR', note: 'safety (relief) valve: inlet end with the inlet bore, outlet end with the outlet bore, centre at the body corner' },
  { kind: 'valve', match: it => it.key.startsWith('VLV|GATE'), record: 'VALVE', item: 'VG', note: 'gate valve (flanged; forged socket-weld or threaded)' },
  { kind: 'valve', match: it => /^VLV\|(GLOBE|YGLOBE|AGLOBE)\|/.test(it.key), record: 'VALVE', item: 'VL', note: 'globe valve' },
  { kind: 'valve', match: it => /^VLV\|(CHECK|LCHECK)\|/.test(it.key), record: 'VALVE', item: 'VC', note: 'check valve (swing; lift check when threaded)' },
  { kind: 'valve', match: it => it.key.startsWith('VLV|BALL'), record: 'VALVE', item: 'VB', note: 'ball valve (three-piece when socket-weld)' },
  { kind: 'valve', match: it => /^VLV\|(BFLY|LBFLY|DBFLY)\|/.test(it.key), record: 'VALVE', item: 'VF', note: 'butterfly valve' },
  { kind: 'valve', match: it => it.key.startsWith('VLV|PLUG'), record: 'VALVE', item: 'VP', note: 'plug valve' },
  { kind: 'valve', match: it => it.key.startsWith('VLV|NEEDLE'), record: 'VALVE', item: 'VN', note: 'needle valve' },
  { kind: 'valve', match: it => it.key.startsWith('VLV|CONTROL'), record: 'VALVE', item: 'VV', note: 'control valve' },
  { kind: 'valve', match: it => it.key.startsWith('VLV|TWAY'), record: 'VALVE-3WAY', item: 'V3', note: 'three-way valve; BRANCH1-POINT at the side port, always written' },
  { kind: 'valve', match: it => it.key.startsWith('VLV|FWAY'), record: 'VALVE-4WAY', item: 'V4', note: 'four-way valve; BRANCH1-POINT at the branch port and BRANCH2-POINT at the spare port, always written' },
  { kind: 'valve', match: it => it.key.startsWith('VLV|ROTARY'), record: 'VALVE', item: 'VY', note: 'rotary airlock feeder (inline flanged)' },
  { kind: 'valve', record: 'VALVE', item: 'VX', note: 'other valve types (knife, diaphragm) if ever drawn' },
];
export const mapOf = (it: GTItem) => PCF_MAP.find(m => m.kind === it.kind && (!m.match || m.match(it))) ?? PCF_MAP.find(m => m.kind === it.kind && !m.match)!;
/** SW-PCF-3: the symbol key of an item */
export const skeyOf = (it: GTItem) => {
  const m = mapOf(it);
  if (it.kind === 'outlet') return 'OL' + endLetters(it.ends.split('×').pop() ?? '');   // by the outlet end
  if (it.kind === 'gasket' || it.kind === 'studs' || it.kind === 'spade' || it.kind === 'spectacle') return m.item + 'FL';
  if (it.kind === 'penetration') return m.item + 'PE';
  if (it.kind === 'plug') return m.item + 'SC';
  if (it.kind === 'cap') return m.item + 'BW';
  return m.item + endLetters(it.ends);
};
const WELD_SKEY = { BW: { shop: 'WWBW', field: 'WFBW' }, SW: { shop: 'WWSW', field: 'WFSW' }, FW: { shop: 'WWFW', field: 'WFFW' } } as const;
const SUPPORT_SKEY: Record<string, string> = { hanger: 'SHAN', shoe: 'SSHO', guide: 'SGUI', anchor: 'SANC', stanchion: 'SSTA', trapeze: 'STRA', trunnion: 'STRU' };
export const supportSkey = (type: string) => SUPPORT_SKEY[type] ?? 'SSUP';

/** a side-port item of a station or a tee's spare branch (tags `<member>:P1…`, `:A1…`, `:B1…`) */
const isSide = (it: GTItem) => /:(P|A|B)\d+$/.test(it.tag);
/** the main chain of a line: the items in order, without side-port items, stud sets and sleeves */
export const mainChain = (line: GTLine) => line.items.filter(it => !isSide(it) && it.kind !== 'studs' && it.kind !== 'penetration');

/** the branch points of every tee, outlet and station of `line` (SW-PCF-2): from the branch line where one leaves, else from the fitting's own side items or mouth */
function branchPoints(line: GTLine, all: GTLine[]): Map<string, Pt[]> {
  const out = new Map<string, Pt[]>();
  const push = (tag: string, p: Pt) => { const l = out.get(tag) ?? []; if (!l.some(q => near(q, p))) l.push(p); out.set(tag, l); };
  const fittings = line.items.filter(it => it.kind === 'tee' || /^VLV\|(TWAY|FWAY)\|/.test(it.key));
  // branch lines: a child's first (or last) point is the mouth it leaves from
  for (const c of all) {
    if (c === line) continue;
    const main = mainChain(c); if (!main.length) continue;
    for (const [end, p] of [[c.header.from, main[0].a], [c.header.to, main[main.length - 1].b]] as const) {
      if (end !== `tap ${line.header.line}`) continue;
      let best: GTItem | null = null, bd = Infinity;
      for (const it of fittings) { const d = dist(it.centre, p); if (d < bd) { bd = d; best = it; } }
      if (best && bd < 36) push(best.tag, p);
    }
  }
  // a station's side-port items (the spare port's nipple, valve and plug) and a tee's spare branch: the first side item's point nearest the fitting
  for (const it of fittings) {
    const member = it.tag.replace(/:\d+$/, '');   // a station valve `X/V30:3` has its side items as `X/V30:P1…`; a stub valve `X/7` as `X/7:A1…`
    const sides = line.items.filter(x => isSide(x) && (x.tag.startsWith(it.tag + ':') || x.tag.startsWith(member + ':')));
    for (const grp of ['P', 'A', 'B']) { const first = sides.find(x => new RegExp(`:${grp}1$`).test(x.tag)); if (first) push(it.tag, dist(first.a, it.centre) <= dist(first.b, it.centre) ? first.a : first.b); }
  }
  // a tee with no branch line found: its mouth from the tee geometry (half the run length out of the centre, square to the run)
  for (const it of fittings) if (it.kind === 'tee' && !(out.get(it.tag)?.length)) {
    const half = dist(it.a, it.b) / 2, run = { E: (it.b.E - it.a.E) / (2 * half || 1), N: (it.b.N - it.a.N) / (2 * half || 1), EL: (it.b.EL - it.a.EL) / (2 * half || 1) };
    const up = Math.abs(run.EL) < 0.5 ? { E: 0, N: 0, EL: 1 } : { E: 1, N: 0, EL: 0 };     // a tee on a horizontal run branches up, on a riser east (the ground truth has no better record)
    const n = { E: up.N * run.EL - up.EL * run.N, N: up.EL * run.E - up.E * run.EL, EL: up.E * run.N - up.N * run.E };
    const bn = { E: run.N * n.EL - run.EL * n.N, N: run.EL * n.E - run.E * n.EL, EL: run.E * n.N - run.N * n.E }, bl = Math.hypot(bn.E, bn.N, bn.EL) || 1;
    push(it.tag, { E: it.centre.E + (bn.E / bl) * half, N: it.centre.N + (bn.N / bl) * half, EL: it.centre.EL + (bn.EL / bl) * half });
  }
  return out;
}

/** a line's item code: its designation */
const itemCode = (it: GTItem) => it.designation.replace(/\s+/g, '-');

/** the bore at each end of an item: a reducer, swage or outlet takes the bore of the neighbour it meets; others their own size */
function boresOf(it: GTItem, main: GTItem[], i: number): [number, number] {
  if (it.kind !== 'reducer' && it.kind !== 'swage' && it.kind !== 'outlet') return [it.NPS, it.NPS];
  const sizes = [it.NPS, it.NPS2 ?? it.NPS];
  const meets = (p: Pt) => { for (const j of [i - 1, i + 1]) { const n = main[j]; if (n && (near(n.a, p) || near(n.b, p))) return n; } return null; };
  const na = meets(it.a), nb = meets(it.b);
  const pick = (n: GTItem | null) => (n ? (sizes.includes(n.NPS) ? n.NPS : null) : null);
  let ba = pick(na), bb = pick(nb);
  if (ba === null && bb !== null) ba = sizes.find(s => s !== bb) ?? bb;
  if (bb === null && ba !== null) bb = sizes.find(s => s !== ba) ?? ba;
  if (ba === null && bb === null) { ba = sizes[0]; bb = sizes[1]; }
  return [ba!, bb!];
}
/** an outlet's run point and mouth: the mouth is the end that meets the next item of the chain */
function outletEnds(it: GTItem, main: GTItem[], i: number): { run: Pt; mouth: Pt } {
  const meets = (p: Pt) => [i - 1, i + 1].some(j => { const n = main[j]; return n && n.kind !== 'outlet' && (near(n.a, p) || near(n.b, p)); });
  return meets(it.a) && !meets(it.b) ? { run: it.b, mouth: it.a } : { run: it.a, mouth: it.b };
}
/** the work point of a bend: where its two leg centre lines meet, from the legs either side (SW-PCF-2) */
function workPoint(it: GTItem, main: GTItem[], i: number): Pt {
  // SW-PCF-2 (amended): the meeting point of the two legs, each the line through the bend's end along the part that touches it
  const ang = it.key.split('|')[3] === '45' ? Math.PI / 4 : Math.PI / 2, chord = dist(it.a, it.b), L = chord / (2 * Math.cos(ang / 2));
  const legAt = (n: GTItem | undefined, at: Pt): Pt | null => { if (!n) return null; const far = near(n.a, at) ? n.b : near(n.b, at) ? n.a : null; if (!far) return null; const d = dist(far, at); return d < 1e-6 ? null : { E: (at.E - far.E) / d, N: (at.N - far.N) / d, EL: (at.EL - far.EL) / d }; };
  const legs: { at: Pt; d: Pt }[] = [];
  for (const n of [main[i - 1], main[i + 1]]) for (const at of [it.a, it.b]) { const d = n && !legs.some(l => l.at === at) ? legAt(n, at) : null; if (d) legs.push({ at, d }); }
  if (legs.length === 2) {   // closest point of the two leg lines (they meet at the work point)
    const [p, q] = legs, w = { E: p.at.E - q.at.E, N: p.at.N - q.at.N, EL: p.at.EL - q.at.EL }, dot = (u: Pt, v: Pt) => u.E * v.E + u.N * v.N + u.EL * v.EL;
    const a = dot(p.d, p.d), b = dot(p.d, q.d), c = dot(q.d, q.d), d0 = dot(p.d, w), e = dot(q.d, w), den = a * c - b * b;
    if (Math.abs(den) > 1e-9) { const t = (b * e - c * d0) / den; return { E: p.at.E + p.d.E * t, N: p.at.N + p.d.N * t, EL: p.at.EL + p.d.EL * t }; }
  }
  if (legs.length) { const { at, d } = legs[0]; return { E: at.E + d.E * L, N: at.N + d.N * L, EL: at.EL + d.EL * L }; }
  return it.centre;
}

/** SW-PCF-1..4: the file for one line; `all` gives the branch lines' first points and the relief outlets */
export function pcfFor(line: GTLine, all: GTLine[]): string {
  const H = line.header, L: string[] = [];
  const A = (k: string, v: string) => L.push(`    ${k} ${v}`);
  L.push('UNITS-BORE INCH', 'UNITS-CO-ORDS INCH', 'UNITS-WEIGHT LBS', 'UNITS-BOLT-DIA INCH', 'UNITS-BOLT-LENGTH INCH', `PIPELINE-REFERENCE ${H.line}`);
  A('PROJECT-IDENTIFIER', 'SMARTWELD');
  A('PIPING-SPEC', H.cls);
  A('ATTRIBUTE1', H.lineClass); A('ATTRIBUTE2', H.fluid); A('ATTRIBUTE3', H.service); A('ATTRIBUTE4', `${H.designPressure} PSI`); A('ATTRIBUTE5', H.insulated ? 'INSULATED' : 'BARE');
  A('ATTRIBUTE6', H.joint ?? 'BW'); A('ATTRIBUTE7', `FROM ${H.from}`); A('ATTRIBUTE8', `TO ${H.to}`); A('ATTRIBUTE9', H.flow); A('ATTRIBUTE10', `${H.NPS}"`);
  const bp = branchPoints(line, all), main = mainChain(line), mainIndex = new Map(main.map((it, i) => [it.tag, i]));
  const outletLine = all.find(x => x.header.from === `PSV on ${H.from}` || x.header.from === `PSV on ${H.line}`);
  const codes = new Map<string, { description: string; material: string; size: string; ends: string; weight: number }>();
  for (const it of line.items) {
    const m = mapOf(it), skey = skeyOf(it), i = mainIndex.get(it.tag) ?? -1, [ba, bb] = boresOf(it, main, i);
    L.push(m.record);
    if (m.record === 'VALVE-ANGLE') { const o = outletLine?.items[0], ob = o ? f(o.NPS) : f(it.NPS); A('END-POINT', `${pt(it.a)} ${f(it.NPS)}`); A('END-POINT', `${pt(o?.a ?? it.b)} ${ob}`); A('CENTRE-POINT', pt(it.b)); }
    else if (it.kind === 'outlet') { const { run, mouth } = outletEnds(it, main, i); A('END-POINT', `${pt(run)} ${f(it.NPS2 ?? it.NPS)}`); A('END-POINT', `${pt(mouth)} ${f(it.NPS)}`); A('CENTRE-POINT', pt(run)); }
    else if (it.kind === 'tee') { A('END-POINT', `${pt(it.a)} ${f(it.NPS)}`); A('END-POINT', `${pt(it.b)} ${f(it.NPS)}`); A('CENTRE-POINT', pt(it.centre)); for (const p of bp.get(it.tag) ?? []) A('BRANCH1-POINT', `${pt(p)} ${f(it.NPS2 ?? it.NPS)}`); }
    else if (it.kind === 'reducer' || it.kind === 'swage') { A('END-POINT', `${pt(it.a)} ${f(ba)}`); A('END-POINT', `${pt(it.b)} ${f(bb)}`); }
    else if (it.kind === 'elbow') { A('END-POINT', `${pt(it.a)} ${f(it.NPS)}`); A('END-POINT', `${pt(it.b)} ${f(it.NPS)}`); A('CENTRE-POINT', pt(workPoint(it, main, i))); A('ANGLE', it.key.split('|')[3] === '45' ? '4500' : '9000'); }
    else if (m.record === 'VALVE-3WAY' || m.record === 'VALVE-4WAY') { A('END-POINT', `${pt(it.a)} ${f(it.NPS)}`); A('END-POINT', `${pt(it.b)} ${f(it.NPS)}`); A('CENTRE-POINT', pt(it.centre)); const ps = bp.get(it.tag) ?? []; ps.slice(0, m.record === 'VALVE-4WAY' ? 2 : 1).forEach((p, k) => A(`BRANCH${k + 1}-POINT`, `${pt(p)} ${f(it.NPS)}`)); }
    else { A('END-POINT', `${pt(it.a)} ${f(it.NPS)}`); A('END-POINT', `${pt(it.b)} ${f(it.NPS)}`); }
    A('SKEY', skey); A('ITEM-CODE', itemCode(it)); A('COMPONENT-ATTRIBUTE1', it.tag);
    if (it.kind === 'pipe' || it.kind === 'nipple') A('COMPONENT-ATTRIBUTE2', `CUT-LENGTH ${f(it.cutLength ?? 0)}`);
    if (it.spool) A('COMPONENT-ATTRIBUTE3', `SPOOL ${it.spool}`);
    A('WEIGHT', f(it.weight));
    codes.set(itemCode(it), { description: it.description, material: it.material, size: it.NPS2 !== undefined ? `${it.NPS} x ${it.NPS2}` : String(it.NPS), ends: it.ends, weight: it.weight });
  }
  for (const w of line.welds) { L.push('WELD'); A('END-POINT', `${pt(w.at)} ${f(w.NPS)}`); A('END-POINT', `${pt(w.at)} ${f(w.NPS)}`); A('SKEY', WELD_SKEY[w.type][w.shopField]); A('COMPONENT-ATTRIBUTE1', w.tag); A('COMPONENT-ATTRIBUTE2', `JOINS ${w.joins[0]} ${w.joins[1]}`); A('WEIGHT', f(w.weight)); }
  for (const s of line.supports) { L.push('SUPPORT'); A('CO-ORDS', `${pt(s.at)} ${f(line.header.NPS)}`); A('SKEY', supportSkey(s.type)); A('NAME', s.designation); A('ITEM-CODE', s.designation); A('COMPONENT-ATTRIBUTE1', s.tag); A('COMPONENT-ATTRIBUTE2', s.type.toUpperCase()); A('WEIGHT', f(s.weight));
    codes.set(s.designation, { description: s.description, material: s.material, size: String(line.header.NPS), ends: '—', weight: s.weight }); }
  L.push('MATERIALS');
  for (const [code, c] of codes) { L.push(`ITEM-CODE ${code}`); A('DESCRIPTION', c.description); A('MATERIAL', c.material); A('SIZE', c.size); A('ENDS', c.ends); A('WEIGHT', f(c.weight)); }
  return L.join('\n') + '\n';
}
export { near, workPoint, boresOf, outletEnds, branchPoints };
/** SW-PCF-2 check: the records of a line chain (consecutive main-chain items share an end point) */
export function chained(line: GTLine): boolean {
  const main = mainChain(line);
  for (let i = 1; i < main.length; i++) { const p = main[i - 1], q = main[i]; if (!near(p.b, q.a) && !near(p.b, q.b) && !near(p.a, q.a) && !near(p.a, q.b)) return false; }
  return true;
}
