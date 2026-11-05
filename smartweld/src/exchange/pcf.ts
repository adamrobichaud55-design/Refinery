/**
 * Piping component files (DESIGN_BASIS.md SW-PCF-1..4): one plain-text file per line, written from the ground truth of
 * SW-GT-6 by SmartWeld's own writer. The record vocabulary (UNITS-*, PIPELINE-REFERENCE, END-POINT, CENTRE-POINT, BRANCH1-POINT,
 * SKEY, ITEM-CODE, MATERIALS …) is the common line-file vocabulary isometric tools read; the symbol keys are SmartWeld's
 * own convention of SW-PCF-3 (two letters for the item, two for its ends), listed in tools/pcf-mapping.md from the same
 * table (PCF_MAP below). Nothing here is read from any outside file: every number comes from the ground truth.
 */
import type { GTLine, GTItem, GTWeld, GTSupport } from '../generator/groundtruth';

type Pt = { E: number; N: number; EL: number };
const near = (p: Pt, q: Pt, tol = 0.05) => Math.abs(p.E - q.E) <= tol && Math.abs(p.N - q.N) <= tol && Math.abs(p.EL - q.EL) <= tol;
const f = (v: number) => (Math.abs(v) < 5e-5 ? '0' : v.toFixed(4).replace(/\.?0+$/, ''));
const pt = (p: Pt) => `${f(p.E)} ${f(p.N)} ${f(p.EL)}`;

/** SW-PCF-3: the end-type letters of a symbol key, from an item's end types ("BW×BW", "RF×RF", "SW×SW", "TH×TH", "SO×RF" …) */
export function endLetters(ends: string): string {
  const e = ends.split('×').map(x => x.trim());
  const has = (t: string) => e.includes(t);
  if (has('RF') && e.every(x => x === 'RF')) return 'FL';
  if (has('BW') && has('RF')) return 'WN';          // weld-neck flange: weld end and face
  if (has('SO')) return 'SO';                       // slip-on flange
  if (has('SW') && has('RF')) return 'SF';          // socket-weld flange
  if (has('TH') && has('RF')) return 'TF';          // threaded flange
  if (has('FW')) return 'OL';                       // branch outlet welded to the run (its outlet end is the second letter pair's business: see olet keys)
  if (e.every(x => x === 'BW')) return 'BW';
  if (e.every(x => x === 'SW')) return 'SW';
  if (e.every(x => x === 'TH')) return 'SC';        // screwed
  if (has('BW') && has('SW')) return 'BS';          // swage butt-weld to socket-weld
  if (has('BW') && has('TH')) return 'BC';          // swage butt-weld to screwed
  if (has('SW') && has('TH')) return 'SS';          // swage socket-weld to screwed
  if (e.length === 1 && e[0] === 'RF') return 'FL';
  if (e.length === 1 && e[0] === 'BW') return 'BW';
  if (e.length === 1 && e[0] === 'SW') return 'SW';
  if (e.length === 1 && e[0] === 'TH') return 'SC';
  return 'PE';
}

/** SW-PCF-3: the record type and the two item letters of the symbol key for a ground-truth item kind (and valve type) */
export const PCF_MAP: { kind: string; match?: (it: GTItem) => boolean; record: string; item: string; note: string }[] = [
  { kind: 'pipe', record: 'PIPE', item: 'PI', note: 'straight pipe; cut length from the end points' },
  { kind: 'nipple', record: 'PIPE', item: 'NI', note: 'nipple (TBE, TOE, PBE, CLOSE); a short pipe record with threaded or plain ends' },
  { kind: 'elbow', match: it => /\|90\|?/.test(it.key.replace(/\|(SW|TH)$/, '')) && it.key.split('|')[3] === '90', record: 'ELBOW', item: 'EL', note: '90° elbow: butt-weld long radius, or forged socket-weld / threaded (SW-SWT-3)' },
  { kind: 'elbow', match: it => it.key.split('|')[3] === '45', record: 'ELBOW', item: 'E4', note: '45° elbow' },
  { kind: 'tee', record: 'TEE', item: 'TE', note: 'tee (equal or reducing); BRANCH1-POINT from the branch line' },
  { kind: 'olet', record: 'OLET', item: 'OL', note: 'branch outlet on the run; END-POINT on the run axis, END-POINT at the outlet; ends BW, SW or SC by the outlet' },
  { kind: 'reducer', match: it => it.key.startsWith('REDE'), record: 'REDUCER-ECCENTRIC', item: 'RE', note: 'eccentric reducer (flat side in the ground truth key)' },
  { kind: 'reducer', record: 'REDUCER-CONCENTRIC', item: 'RC', note: 'concentric reducer' },
  { kind: 'swage', record: 'REDUCER-CONCENTRIC', item: 'SG', note: 'swage nipple; ends by its two end types (BS, BC, SS, SW, SC)' },
  { kind: 'cap', record: 'CAP', item: 'CA', note: 'butt-weld cap' },
  { kind: 'plug', record: 'CAP', item: 'PL', note: 'threaded or socket plug closing an end' },
  { kind: 'coupling', record: 'COUPLING', item: 'CP', note: 'full coupling, socket-weld or threaded' },
  { kind: 'flange', match: it => it.key.startsWith('SOF'), record: 'FLANGE', item: 'FL', note: 'slip-on flange (ends SO)' },
  { kind: 'flange', match: it => it.key.startsWith('SWF'), record: 'FLANGE', item: 'FL', note: 'socket-weld flange (ends SF)' },
  { kind: 'flange', record: 'FLANGE', item: 'FL', note: 'weld-neck flange (ends WN); a nozzle flange carries the equipment nozzle id in its item code' },
  { kind: 'blind', record: 'FLANGE-BLIND', item: 'FB', note: 'blind flange' },
  { kind: 'spade', record: 'MISC-COMPONENT', item: 'SP', note: 'spade (blank) between two flanges' },
  { kind: 'spectacle', record: 'MISC-COMPONENT', item: 'SB', note: 'spectacle blind between two flanges' },
  { kind: 'gasket', record: 'GASKET', item: 'GA', note: 'gasket at a flanged joint' },
  { kind: 'studs', record: 'BOLT', item: 'BO', note: 'stud set with nuts at a flanged joint (count, diameter and length in the description)' },
  { kind: 'penetration', record: 'MISC-COMPONENT', item: 'SL', note: 'floor or wall sleeve the pipe passes through (SW-PEN-1/2)' },
  { kind: 'valve', match: it => it.key.startsWith('VLV|PSV'), record: 'VALVE-ANGLE', item: 'VR', note: 'safety (relief) valve: inlet end, outlet end, centre at the body corner' },
  { kind: 'valve', match: it => it.key.startsWith('VLV|GATE'), record: 'VALVE', item: 'VG', note: 'gate valve (flanged; forged socket-weld or threaded)' },
  { kind: 'valve', match: it => /^VLV\|(GLOBE|YGLOBE|AGLOBE)\|/.test(it.key), record: 'VALVE', item: 'VL', note: 'globe valve' },
  { kind: 'valve', match: it => /^VLV\|(CHECK|LCHECK)\|/.test(it.key), record: 'VALVE', item: 'VC', note: 'check valve (swing; lift check when threaded)' },
  { kind: 'valve', match: it => it.key.startsWith('VLV|BALL'), record: 'VALVE', item: 'VB', note: 'ball valve (three-piece when socket-weld)' },
  { kind: 'valve', match: it => /^VLV\|(BFLY|LBFLY|DBFLY)\|/.test(it.key), record: 'VALVE', item: 'VF', note: 'butterfly valve' },
  { kind: 'valve', match: it => it.key.startsWith('VLV|PLUG'), record: 'VALVE', item: 'VP', note: 'plug valve' },
  { kind: 'valve', match: it => it.key.startsWith('VLV|NEEDLE'), record: 'VALVE', item: 'VN', note: 'needle valve' },
  { kind: 'valve', match: it => it.key.startsWith('VLV|CONTROL'), record: 'VALVE', item: 'VV', note: 'control valve' },
  { kind: 'valve', match: it => it.key.startsWith('VLV|TWAY'), record: 'VALVE-3WAY', item: 'V3', note: 'three-way valve; BRANCH1-POINT at the side port' },
  { kind: 'valve', match: it => it.key.startsWith('VLV|FWAY'), record: 'VALVE-4WAY', item: 'V4', note: 'four-way valve; BRANCH1-POINT at the branch port, BRANCH2-POINT at the spare port' },
  { kind: 'valve', match: it => it.key.startsWith('VLV|ROTARY'), record: 'VALVE', item: 'VY', note: 'rotary airlock feeder (inline flanged)' },
  { kind: 'valve', record: 'VALVE', item: 'VX', note: 'other valve types (knife, diaphragm) if ever drawn' },
];
export const mapOf = (it: GTItem) => PCF_MAP.find(m => m.kind === it.kind && (!m.match || m.match(it))) ?? PCF_MAP.find(m => m.kind === it.kind && !m.match)!;
/** SW-PCF-3: the symbol key of an item */
export const skeyOf = (it: GTItem) => {
  const m = mapOf(it);
  if (it.kind === 'olet') return 'OL' + endLetters(it.ends.split('×').pop() ?? '');   // by the outlet end
  if (it.kind === 'gasket' || it.kind === 'studs' || it.kind === 'spade' || it.kind === 'spectacle') return m.item + 'FL';
  if (it.kind === 'penetration') return m.item + 'PE';
  return m.item + endLetters(it.ends);
};
const WELD_SKEY = { BW: { shop: 'WWBW', field: 'WFBW' }, SW: { shop: 'WWSW', field: 'WFSW' }, FW: { shop: 'WWFW', field: 'WFFW' } } as const;
const SUPPORT_SKEY: Record<string, string> = { hanger: 'SHAN', shoe: 'SSHO', guide: 'SGUI', anchor: 'SANC', stanchion: 'SSTA', trapeze: 'STRA', trunnion: 'STRU' };
export const supportSkey = (type: string) => SUPPORT_SKEY[type] ?? 'SSUP';

/** the first point of every line that leaves a tee, outlet or station of `line` (for BRANCH1-POINT), keyed by the item it leaves */
function branchPoints(line: GTLine, all: GTLine[]): Map<string, Pt[]> {
  const out = new Map<string, Pt[]>();
  const push = (tag: string, p: Pt) => out.set(tag, [...(out.get(tag) ?? []), p]);
  const fittings = line.items.filter(it => it.kind === 'tee' || it.kind === 'olet' || /^VLV\|(TWAY|FWAY)\|/.test(it.key));
  for (const c of all) {
    if (c === line) continue;
    for (const [end, p] of [[c.header.from, c.items[0]?.a], [c.header.to, c.items[c.items.length - 1]?.b]] as const) {
      if (!p || end !== `tap ${line.header.line}`) continue;
      // the fitting nearest that point (the olet's outlet mouth, the tee's branch mouth, the station's side port face)
      let best: GTItem | null = null, bd = Infinity;
      for (const it of fittings) { const d = Math.hypot(it.centre.E - p.E, it.centre.N - p.N, it.centre.EL - p.EL); if (d < bd) { bd = d; best = it; } }
      if (best && bd < 60) push(best.tag, p);
    }
  }
  // a four-way's spare port: the blind or plug on its side (ground-truth items tagged `<valve tag>:P…`)
  for (const it of line.items) if (it.key.startsWith('VLV|FWAY')) { const sp = line.items.find(x => x.tag.startsWith(it.tag + ':P')); if (sp) push(it.tag, sp.a); }
  return out;
}

/** a line's item code: its designation; nozzle flanges carry the nozzle id so the bill tells them apart */
const itemCode = (it: GTItem) => it.designation.replace(/\s+/g, '-');

/** SW-PCF-1..4: the file for one line; `all` gives the branch lines' first points (SW-PCF-2) and the relief outlets */
export function pcfFor(line: GTLine, all: GTLine[]): string {
  const H = line.header, L: string[] = [];
  const A = (k: string, v: string) => L.push(`    ${k} ${v}`);
  L.push('UNITS-BORE INCH', 'UNITS-CO-ORDS INCH', 'UNITS-WEIGHT LBS', 'UNITS-BOLT-DIA INCH', 'UNITS-BOLT-LENGTH INCH', `PIPELINE-REFERENCE ${H.line}`);
  A('PROJECT-IDENTIFIER', 'SMARTWELD');
  A('PIPING-SPEC', H.cls);
  A('ATTRIBUTE1', H.lineClass); A('ATTRIBUTE2', H.fluid); A('ATTRIBUTE3', H.service); A('ATTRIBUTE4', `${H.designPressure} PSI`); A('ATTRIBUTE5', H.insulated ? 'INSULATED' : 'BARE');
  A('ATTRIBUTE6', H.joint ?? 'BW'); A('ATTRIBUTE7', `FROM ${H.from}`); A('ATTRIBUTE8', `TO ${H.to}`); A('ATTRIBUTE9', H.flow); A('ATTRIBUTE10', `${H.NPS}"`);
  const bp = branchPoints(line, all);
  const psvOutlet = (it: GTItem): Pt | null => { const o = all.find(x => x.header.from === `PSV on ${H.from}` || x.header.from === `PSV on ${H.line}`); return o?.items[0]?.a ?? null; };
  const codes = new Map<string, GTItem>();
  for (const it of line.items) {
    const m = mapOf(it), skey = skeyOf(it), bore = f(it.NPS), bore2 = it.NPS2 !== undefined ? f(it.NPS2) : bore;
    L.push(m.record);
    if (m.record === 'VALVE-ANGLE') { const o = psvOutlet(it); A('END-POINT', `${pt(it.a)} ${bore}`); A('END-POINT', `${pt(o ?? it.b)} ${bore}`); A('CENTRE-POINT', pt(it.b)); }
    else if (it.kind === 'olet') { A('END-POINT', `${pt(it.a)} ${bore2}`); A('END-POINT', `${pt(it.b)} ${bore}`); A('CENTRE-POINT', pt(it.a)); }
    else if (it.kind === 'tee') { A('END-POINT', `${pt(it.a)} ${bore}`); A('END-POINT', `${pt(it.b)} ${bore}`); A('CENTRE-POINT', pt(it.centre)); for (const p of bp.get(it.tag) ?? []) A('BRANCH1-POINT', `${pt(p)} ${bore2}`); }
    else if (it.kind === 'reducer' || it.kind === 'swage') { A('END-POINT', `${pt(it.a)} ${bore}`); A('END-POINT', `${pt(it.b)} ${bore2}`); }
    else if (it.kind === 'elbow') { A('END-POINT', `${pt(it.a)} ${bore}`); A('END-POINT', `${pt(it.b)} ${bore}`); A('CENTRE-POINT', pt(corner(it))); A('ANGLE', it.key.split('|')[3] === '45' ? '4500' : '9000'); }
    else if (m.record === 'VALVE-3WAY' || m.record === 'VALVE-4WAY') { A('END-POINT', `${pt(it.a)} ${bore}`); A('END-POINT', `${pt(it.b)} ${bore}`); A('CENTRE-POINT', pt(it.centre)); const ps = bp.get(it.tag) ?? []; ps.forEach((p, i) => A(`BRANCH${i + 1}-POINT`, `${pt(p)} ${bore}`)); }
    else { A('END-POINT', `${pt(it.a)} ${bore}`); A('END-POINT', `${pt(it.b)} ${bore}`); }
    A('SKEY', skey); A('ITEM-CODE', itemCode(it)); A('COMPONENT-ATTRIBUTE1', it.tag);
    if (it.kind === 'pipe' || it.kind === 'nipple') A('COMPONENT-ATTRIBUTE2', `CUT-LENGTH ${f(it.cutLength ?? 0)}`);
    A('COMPONENT-ATTRIBUTE3', `SPOOL ${it.spool}`); A('WEIGHT', f(it.weight));
    codes.set(itemCode(it), it);
  }
  for (const w of line.welds) { L.push('WELD'); A('END-POINT', `${pt(w.at)} ${f(w.NPS)}`); A('END-POINT', `${pt(w.at)} ${f(w.NPS)}`); A('SKEY', WELD_SKEY[w.type][w.shopField]); A('COMPONENT-ATTRIBUTE1', w.tag); A('COMPONENT-ATTRIBUTE2', `JOINS ${w.joins[0]} ${w.joins[1]}`); A('WEIGHT', f(w.weight)); }
  for (const s of line.supports) { L.push('SUPPORT'); A('CO-ORDS', `${pt(s.at)} ${f(line.header.NPS)}`); A('SKEY', supportSkey(s.type)); A('NAME', s.designation); A('COMPONENT-ATTRIBUTE1', s.tag); A('COMPONENT-ATTRIBUTE2', s.type.toUpperCase()); A('WEIGHT', f(s.weight)); }
  L.push('MATERIALS');
  for (const [code, it] of codes) { L.push(`ITEM-CODE ${code}`); A('DESCRIPTION', it.description); A('MATERIAL', it.material); A('SIZE', it.NPS2 !== undefined ? `${it.NPS} x ${it.NPS2}` : String(it.NPS)); A('ENDS', it.ends); A('WEIGHT', f(it.weight)); }
  return L.join('\n') + '\n';
}
/** the elbow's corner (its mouths lie one take-out from it along each leg): the intersection of the two leg lines */
function corner(it: GTItem): Pt {
  // the bend turns in the plane of a, b and the centre; the corner is where the tangents meet: c = centre + (centre − mid(a,b)) scaled to the chord geometry
  const mid = { E: (it.a.E + it.b.E) / 2, N: (it.a.N + it.b.N) / 2, EL: (it.a.EL + it.b.EL) / 2 };
  const ang = it.key.split('|')[3] === '45' ? Math.PI / 4 : Math.PI / 2;
  const half = Math.hypot(it.b.E - it.a.E, it.b.N - it.a.N, it.b.EL - it.a.EL) / 2, sag = half * Math.tan(ang / 2);   // mid to corner along the bisector
  const d = { E: it.centre.E - mid.E, N: it.centre.N - mid.N, EL: it.centre.EL - mid.EL }, dl = Math.hypot(d.E, d.N, d.EL);
  if (dl < 1e-9) return it.centre;
  return { E: mid.E + (d.E / dl) * sag, N: mid.N + (d.N / dl) * sag, EL: mid.EL + (d.EL / dl) * sag };
}
export { near };
/** where a plant's PCF files live: beside its ground-truth folder */
export const pcfDir = (groundtruth: string) => groundtruth.replace(/[\\/]groundtruth$/, '') + '/pcf';
/** the file name of a line's PCF (the size's " as "in", "/" as "-") */
export const pcfName = (line: string) => line.replace(/"/g, 'in').replace(/\//g, '-') + '.pcf';
/** SW-PCF-2 check: the records of a line chain (each record's second end meets the next record's first end, except at branch and loose items) */
export function chained(line: GTLine): boolean {
  const main = line.items.filter(it => !/:P\d+$|:A\d+$|:B\d+$/.test(it.tag) && it.kind !== 'studs' && it.kind !== 'penetration' && !it.tag.includes('/O2'));
  // consecutive records share an end point (an end stack listed from its nozzle outward reads the other way round)
  for (let i = 1; i < main.length; i++) { const p = main[i - 1], q = main[i]; if (!near(p.b, q.a) && !near(p.b, q.b) && !near(p.a, q.a) && !near(p.a, q.b)) return false; }
  return true;
}
