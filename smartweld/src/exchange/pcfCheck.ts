/** The owner's zero-checks on a plant's ground truth and PCF files (DESIGN_BASIS.md SW-LL-8, SW-GT-7, SW-PCF-2..4, the
 *  review of 2026-11-05/06). Every count must be zero before the files are pushed; the command is tools/pcf-check.ts. */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pcfDir, pcfName, mainChain, workPoint, near, skeyOf } from './pcf';
import type { GTLine, GTItem } from '../generator/groundtruth';

export interface CheckResult { counts: Record<string, number>; examples: Record<string, string[]> }

/** the checks; `valveToValve` may be left out for plant 1, whose sixteen such joints the owner keeps (SW-LL-8 (5)) */
export function checkPlant(groundtruth: string, opts: { valveToValve?: boolean } = {}): CheckResult {
  const dir = join(groundtruth, 'lines'), lines = readdirSync(dir).sort().map(f => JSON.parse(readFileSync(join(dir, f), 'utf8')) as GTLine);
  const pdir = pcfDir(groundtruth);
  const counts: Record<string, number> = {}, examples: Record<string, string[]> = {};
  const hit = (k: string, ex: string) => { counts[k] = (counts[k] ?? 0) + 1; (examples[k] ??= []).length < 5 && examples[k].push(ex); };
  const keys = ['socket-weld plugs', 'plugs not straight into a valve', 'field welds at slip-on or socket-weld flanges or at threaded or socket-weld valves', 'slip-on flanges on an outlet or a tee', 'slip-on flanges on a reducer', 'gaskets with a valve on each side',
    'valves whose two flanges differ', 'elbows whose CENTRE-POINT is not the work point', 'tees, three-way and four-way valves without BRANCH1-POINT', 'four-way valves without BRANCH2-POINT', 'SPOOL undefined', 'reducers with the same size at both ends', 'INDEX.csv rows not readable'];
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
      if (it.kind === 'reducer' || it.kind === 'swage') { const m = text.match(new RegExp(`COMPONENT-ATTRIBUTE1 ${it.tag.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\n`)); void m; }
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
      if (it.kind === 'elbow') { const cp = r.lines.find(l => l.startsWith('CENTRE-POINT '))?.split(/\s+/).slice(1, 4).map(Number); const wp = workPoint(it, main, i); if (!cp || Math.hypot(cp[0] - wp.E, cp[1] - wp.N, cp[2] - wp.EL) > 1 / 32) hit('elbows whose CENTRE-POINT is not the work point', it.tag); }
      if (it.kind === 'tee' || /^VLV\|(TWAY|FWAY)\|/.test(it.key)) { if (!r.lines.some(l => l.startsWith('BRANCH1-POINT '))) hit('tees, three-way and four-way valves without BRANCH1-POINT', it.tag); }
      if (it.key.startsWith('VLV|FWAY')) { if (!r.lines.some(l => l.startsWith('BRANCH2-POINT '))) hit('four-way valves without BRANCH2-POINT', it.tag); }
    }
    for (const r of recs) if (r.lines.some(l => l === 'COMPONENT-ATTRIBUTE3 SPOOL undefined' || l.endsWith(' undefined'))) hit('SPOOL undefined', `${L.header.line} ${r.type}`);
  }
  if (opts.valveToValve === false) delete counts['gaskets with a valve on each side'];
  // INDEX.csv: every row reads back to a line number and a file that exists
  const idx = readFileSync(join(pdir, 'INDEX.csv'), 'utf8').split('\n').slice(1).filter(Boolean);
  for (const row of idx) {
    const m = row.match(/^"((?:[^"]|"")*)",([^,]+),(\d+)$/);
    if (!m) { hit('INDEX.csv rows not readable', row); continue; }
    const line = m[1].replace(/""/g, '"'); if (!lines.some(L => L.header.line === line) || m[2] !== pcfName(line)) hit('INDEX.csv rows not readable', row);
  }
  return { counts, examples };
}

