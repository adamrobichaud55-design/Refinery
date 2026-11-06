/** The owner's zero-checks on a plant's ground truth and PCF files (DESIGN_BASIS.md SW-LL-8, SW-GT-7, SW-PCF-2..4, the
 *  review of 2026-11-05/06). Every count must be zero before the files are pushed; the command is tools/pcf-check.ts. */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pcfDir, pcfName, mainChain, near, skeyOf } from './pcf';
import type { GTLine, GTItem } from '../generator/groundtruth';

export interface CheckResult { counts: Record<string, number>; examples: Record<string, string[]> }

type Pt = { E: number; N: number; EL: number };
const dist = (p: Pt, q: Pt) => Math.hypot(p.E - q.E, p.N - q.N, p.EL - q.EL);
/** the work point of a bend, found on its own: the meeting point of the lines through each end along whichever main item touches that end */
function workPointOf(it: GTItem, main: GTItem[]): Pt | null {
  const legs: { at: Pt; d: Pt }[] = [];
  for (const at of [it.a, it.b]) {
    const n = main.find(x => x !== it && (near(x.a, at) || near(x.b, at))); if (!n) continue;
    const far = near(n.a, at) ? n.b : n.a, d = dist(far, at); if (d < 1e-6) continue;
    legs.push({ at, d: { E: (at.E - far.E) / d, N: (at.N - far.N) / d, EL: (at.EL - far.EL) / d } });
  }
  if (legs.length < 2) return null;
  const [p, q] = legs, w = { E: p.at.E - q.at.E, N: p.at.N - q.at.N, EL: p.at.EL - q.at.EL }, dot = (u: Pt, v: Pt) => u.E * v.E + u.N * v.N + u.EL * v.EL;
  const a = dot(p.d, p.d), b = dot(p.d, q.d), c = dot(q.d, q.d), d0 = dot(p.d, w), e = dot(q.d, w), den = a * c - b * b;
  if (Math.abs(den) < 1e-9) return null;
  const t = (b * e - c * d0) / den; return { E: p.at.E + p.d.E * t, N: p.at.N + p.d.N * t, EL: p.at.EL + p.d.EL * t };
}
/** a point lies on the straight part between a and b */
const onStraight = (x: GTItem, q: Pt) => { const ab = { E: x.b.E - x.a.E, N: x.b.N - x.a.N, EL: x.b.EL - x.a.EL }, L2 = ab.E ** 2 + ab.N ** 2 + ab.EL ** 2; if (L2 < 1e-9) return false; const t = ((q.E - x.a.E) * ab.E + (q.N - x.a.N) * ab.N + (q.EL - x.a.EL) * ab.EL) / L2; return t >= -1e-6 && t <= 1 + 1e-6 && dist({ E: x.a.E + ab.E * t, N: x.a.N + ab.N * t, EL: x.a.EL + ab.EL * t }, q) < 1 / 64; };

/** the checks: the owner's zero-checks of 2026-11-05/06 and the follow-up of 2026-11-06 (both plants, no exception) */
export function checkPlant(groundtruth: string): CheckResult {
  const dir = join(groundtruth, 'lines'), lines = readdirSync(dir).sort().map(f => JSON.parse(readFileSync(join(dir, f), 'utf8')) as GTLine);
  const pdir = pcfDir(groundtruth);
  const counts: Record<string, number> = {}, examples: Record<string, string[]> = {};
  const hit = (k: string, ex: string) => { counts[k] = (counts[k] ?? 0) + 1; (examples[k] ??= []).length < 5 && examples[k].push(ex); };
  const keys = ['socket-weld plugs', 'plugs not straight into a valve', 'field welds at slip-on or socket-weld flanges or at threaded or socket-weld valves', 'slip-on flanges on an outlet or a tee', 'slip-on flanges on a reducer', 'gaskets with a valve on each side',
    'valves whose two flanges differ', 'elbows whose CENTRE-POINT is not the work point', 'tees, three-way and four-way valves without BRANCH1-POINT', 'four-way valves without BRANCH2-POINT', 'SPOOL undefined', 'reducers with the same size at both ends', 'INDEX.csv rows not readable',
    'lines whose joint type names a joint none of their welds has', 'nipples keyed NIBC whose plain end is socket-welded', 'sleeves not round a straight part of their line'];
  for (const k of keys) counts[k] = 0;
  for (const L of lines) {
    const items = L.items, main = mainChain(L), text = readFileSync(join(pdir, pcfName(L.header.line)), 'utf8');
    const byTag = new Map(items.map(it => [it.tag, it]));
    const flangeKind = (it: GTItem) => (it.kind === 'flange' ? (it.key.startsWith('SOF') ? 'SO' : it.key.startsWith('SWF') ? 'SW' : 'WN') : null);
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === 'plug') {
        if (skeyOf(it) === 'PLSW' || it.ends.includes('SW') || it.ends.includes('SP')) hit('socket-weld plugs', it.tag);
        const prev = items[i - 1], next = items[i + 1], valveNeighbour = (n?: GTItem) => n && n.kind === 'valve' && (near(n.a, it.a) || near(n.b, it.a) || near(n.a, it.b) || near(n.b, it.b));
        if (!valveNeighbour(prev) && !valveNeighbour(next)) hit('plugs not straight into a valve', it.tag);
      }
      if (it.kind === 'gasket') { const p = items[i - 1], n = items[i + 1]; if (p?.kind === 'valve' && n?.kind === 'valve') hit('gaskets with a valve on each side', it.tag); }
      if (it.kind === 'nipple' && skeyOf(it) === 'NIBC' && L.welds.some(w => w.type === 'SW' && w.joins.includes(it.tag))) hit('nipples keyed NIBC whose plain end is socket-welded', it.tag);
      if (it.kind === 'penetration' && !items.some(x => (x.kind === 'pipe' || x.kind === 'nipple') && onStraight(x, it.a) && onStraight(x, it.b))) hit('sleeves not round a straight part of their line', it.tag);
    }
    // valves between flanges: the flange kind on each side must match (flanged valves only); slip-on never straight on a tee or an outlet
    for (let i = 0; i < main.length; i++) {
      const it = main[i];
      if (it.kind === 'valve' && it.ends.split('×').every(e => e === 'RF')) {
        const before = main.slice(0, i).reverse().find(x => x.kind === 'flange' || x.kind === 'valve' || x.kind === 'blind'), after = main.slice(i + 1).find(x => x.kind === 'flange' || x.kind === 'valve' || x.kind === 'blind');
        const fb = before ? flangeKind(before) : null, fa = after ? flangeKind(after) : null;
        if (fb && fa && fb !== fa) hit('valves whose two flanges differ', `${it.tag} (${fb} / ${fa})`);
      }
      if (it.kind === 'flange' && flangeKind(it) === 'SO') for (const n of [main[i - 1], main[i + 1]]) {
        if (!n || !(near(n.a, it.a) || near(n.a, it.b) || near(n.b, it.a) || near(n.b, it.b))) continue;
        if (n.kind === 'tee' || n.kind === 'outlet') hit('slip-on flanges on an outlet or a tee', it.tag);
        if (n.kind === 'reducer' || n.kind === 'swage') hit('slip-on flanges on a reducer', it.tag);   // SW-LL-8 (7) amended: a slip-on slips over a pipe, never a reducer
      }
      if ((it.kind === 'reducer' || it.kind === 'swage') && (it.NPS2 === undefined || it.NPS2 === it.NPS)) hit('reducers with the same size at both ends', it.tag);
    }
    for (const w of L.welds) if (w.shopField === 'field') {
      const parts = w.joins.map(t => byTag.get(t)).filter(Boolean) as GTItem[];
      if (parts.some(p => (p.kind === 'flange' && flangeKind(p) !== 'WN') || (p.kind === 'valve' && !p.ends.split('×').every(e => e === 'RF')))) hit('field welds at slip-on or socket-weld flanges or at threaded or socket-weld valves', w.tag);
    }
    // the file: records in order
    const recs = text.split('\n').reduce<{ type: string; lines: string[] }[]>((acc, ln) => { if (/^[A-Z]/.test(ln)) acc.push({ type: ln.trim(), lines: [] }); else if (acc.length) acc[acc.length - 1].lines.push(ln.trim()); return acc; }, []);
    const recOf = new Map<string, { type: string; lines: string[] }>(); for (const r of recs) { const t = r.lines.find(l => l.startsWith('COMPONENT-ATTRIBUTE1 '))?.slice(21); if (t) recOf.set(t, r); }
    for (let i = 0; i < main.length; i++) {
      const it = main[i], r = recOf.get(it.tag); if (!r) continue;
      if (it.kind === 'elbow') { const cp = r.lines.find(l => l.startsWith('CENTRE-POINT '))?.split(/\s+/).slice(1, 4).map(Number); const wp = workPointOf(it, main); if (!cp || !wp || Math.hypot(cp[0] - wp.E, cp[1] - wp.N, cp[2] - wp.EL) > 1 / 32) hit('elbows whose CENTRE-POINT is not the work point', it.tag); }
      if (it.kind === 'tee' || /^VLV\|(TWAY|FWAY)\|/.test(it.key)) { if (!r.lines.some(l => l.startsWith('BRANCH1-POINT '))) hit('tees, three-way and four-way valves without BRANCH1-POINT', it.tag); }
      if (it.key.startsWith('VLV|FWAY')) { if (!r.lines.some(l => l.startsWith('BRANCH2-POINT '))) hit('four-way valves without BRANCH2-POINT', it.tag); }
    }
    for (const r of recs) if (r.lines.some(l => l === 'COMPONENT-ATTRIBUTE3 SPOOL undefined' || l.endsWith(' undefined'))) hit('SPOOL undefined', `${L.header.line} ${r.type}`);
    // the header's joint type (ATTRIBUTE6) must be one the line's own joints have: a butt weld, a socket weld, or a threaded piece
    const a6 = text.match(/^    ATTRIBUTE6 (\S+)$/m)?.[1], wt = new Set(L.welds.map(w => w.type));
    if (a6 !== L.header.joint) hit('lines whose joint type names a joint none of their welds has', `${L.header.line} (file ${a6}, ground truth ${L.header.joint})`);
    else if (a6 === 'BW' && L.welds.length && !wt.has('BW')) hit('lines whose joint type names a joint none of their welds has', `${L.header.line} (BW, welds ${[...wt].join('+')})`);
    else if (a6 === 'SW' && !wt.has('SW')) hit('lines whose joint type names a joint none of their welds has', `${L.header.line} (SW, welds ${[...wt].join('+')})`);
    else if (a6 === 'TH' && !items.some(x => x.ends.split('×').includes('TH'))) hit('lines whose joint type names a joint none of their welds has', `${L.header.line} (TH, no threaded part)`);
  }
  // INDEX.csv: every row reads back to a line number and a file that exists
  const idx = readFileSync(join(pdir, 'INDEX.csv'), 'utf8').split('\n').slice(1).filter(Boolean);
  for (const row of idx) {
    const m = row.match(/^"((?:[^"]|"")*)",([^,]+),(\d+)$/);
    if (!m) { hit('INDEX.csv rows not readable', row); continue; }
    const line = m[1].replace(/""/g, '"'); if (!lines.some(L => L.header.line === line) || m[2] !== pcfName(line)) hit('INDEX.csv rows not readable', row);
  }
  return { counts, examples };
}

