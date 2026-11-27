// Plant 3: SW-RPI-23 applied to the piped units' models on disk, without routing them again. Each line SW-RPI-22 reports as passing
// through itself is corrected where a correction serves: (d) a 45° offset over a take-off laid as the generator routed it, (b) two ends on
// one axis joined by one straight pipe, (c) a turn-about at a bare end laid as a 45° offset, (a) a take-off moved along its parent. Then
// SW-RPI-10, SW-RPI-19 (as amended again), SW-RPI-18, SW-RPI-17, SW-RPI-20 and SW-RPI-21 are made again, and each unit's report is brought
// up to date (checks, counts, lines, notes). A unit routed afresh by tools/refinery-piping.ts has the same corrections made in its run.
//   vite-node tools/refinery-selfx.ts [<unit> ...]
import { readFileSync, writeFileSync } from 'node:fs';
import { serializePiping, type PipingModel, type LineRun } from '../src/generator/piping';
import { unitPiping } from '../src/refinery/unitPiping';
import { unitChecks, valveBoxFn, spanNote, cutLongPipes, type PipedUnit } from '../src/refinery/pipingReport';
import { supportsAlongSpans, supportsThatStrike, valvesThatStrike, hangerTops, waferStuds, withFrames } from '../src/refinery/supports';
import { selfCorrections, ownClearance } from '../src/refinery/ownLine';
import { squareWelds, insideFillets, spadeHandles } from '../src/refinery/welds';
// PIPING_DIR: another folder of unit models to correct in place of the repository's (a copy, to try the corrections on)
const dir = process.env.PIPING_DIR ?? 'public/refinery/piping', vb = valveBoxFn();
const pathLen = (r: LineRun) => r.path.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - r.path[i - 1][0], p[1] - r.path[i - 1][1], p[2] - r.path[i - 1][2]) : 0), 0);
const count = (xs: string[]) => { const o: Record<string, number> = {}; for (const x of xs) o[x] = (o[x] ?? 0) + 1; return Object.fromEntries(Object.entries(o).sort()); };
const units = process.argv.slice(2).map(Number); for (const u of units.length ? units : [11, 12, 13, 14, 15, 16, 17, 18]) {
  const t0 = Date.now(), m = JSON.parse(readFileSync(`${dir}/unit-${u}.json`, 'utf8')) as PipingModel, r = JSON.parse(readFileSync(`${dir}/unit-${u}.report.json`, 'utf8')) as PipedUnit, up = unitPiping(u);
  const own0 = ownClearance(m), was = new Map(m.lines.map(l => [l.no, JSON.stringify(l)] as const));
  // SW-RPI-23 acts only on a line SW-RPI-22 reports: a unit with none is left as it is, its files not written
  if (!own0.length) { console.log(`unit ${u}: SW-RPI-22 finds no line through itself; left as it is`); continue; }
  // SW-RPI-23: the lines through themselves corrected, then SW-RPI-10 on what they laid
  const fixed = selfCorrections(m, up, vb), cut = cutLongPipes(m);
  const changed = new Set(m.lines.filter(l => JSON.stringify(l) !== was.get(l.no)).map(l => l.no));
  r.notes.push(...fixed, ...cut.map(c => `${c}: a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)`));
  // a pipe frame whose shoe went with a piece taken out goes with it
  r.frames = (r.frames ?? []).filter(f => !changed.has(f.line) || m.lines.find(l => l.no === f.line)!.supports.some(s => s.type === 'shoe' && Math.abs(s.at[0] - f.at[0]) < 0.5 && Math.abs(s.at[2] - f.at[2]) < 0.5));
  const pf = withFrames(up.plant, r.frames ?? []);   // SW-RPI-18 (amended): the frames kept are solids for the tests and for SW-RPI-17
  // made again on a model that has had it, the counts of SW-RPI-17 are added to the note already there
  const had = r.notes.findIndex(n => n.includes('(SW-RPI-17)')), num = (re: RegExp) => (had >= 0 ? Number(re.exec(r.notes[had])?.[1] ?? 0) : 0);
  const vt = valvesThatStrike(m, pf, vb);   // SW-RPI-19: valves whose stem or handwheel strikes, turned
  if (vt.turned.length || vt.stuck.length) r.notes.push(`${vt.turned.length} valves turned where their stem or handwheel struck (SW-RPI-19)${vt.turned.length ? `: ${vt.turned.join('; ')}` : ''}${vt.stuck.length ? `; ${vt.stuck.length} with no clear direction, left: ${vt.stuck.join('; ')}` : ''}`);
  // SW-RPI-24 and SW-RPI-25, as a unit's run makes them after SW-RPI-19: the welds SW-RPI-23 derived again set square to their joints, and a slip-on
  // flange's inside weld at the pipe's end, like every other
  const sw = squareWelds(m); if (sw.length) r.notes.push(`${sw.length} butt welds set square to their joints (SW-RPI-24)`);
  const fi = insideFillets(m); if (fi.length) r.notes.push(`${fi.length} slip-on flanges' inside welds moved to the pipe's end (SW-RPI-25)`);
  const sh = spadeHandles(m); if (sh.length) r.notes.push(`${sh.length} spades turned, their handles opposite the stems of the valves beside them (SW-RPI-27)`);
  const ht0 = hangerTops(m, pf);   // SW-RPI-20 first (amended 2026-11-27), then again for what SW-RPI-17 sets
  const struck = supportsThatStrike(m, pf, vb);   // SW-RPI-18 first: supports whose rod, post or leg strikes are taken out
  const before = r.checks.supports.length, s = supportsAlongSpans(m, pf, vb), ht = [...ht0, ...hangerTops(m, pf)], ws = waferStuds(m), aside: string[] = [], checks = unitChecks(m, up, aside);
  if (struck.length) r.notes.push(`${struck.length} supports taken out where their rod, post or leg struck another line, steel or another support (SW-RPI-18): ${struck.join('; ')}`);
  if (ht.length) r.notes.push(`${ht.length} hangers' rods made to reach the underside of the steel they hang from (SW-RPI-20)`); if (ws.length) r.notes.push(`${ws.length} wafer valves bolted with one stud set through both flanges (SW-RPI-21)`);
  if (had >= 0) { s.hangers += num(/(\d+) hangers/); s.onSteel += num(/(\d+) stanchions on steel/); s.stanchions += num(/, (\d+) stanchions and/); s.posts += num(/(\d+) support posts/); s.frames = [...r.frames, ...s.frames]; r.notes.splice(had, 1); }
  for (const n of aside) if (!r.notes.includes(n)) r.notes.push(n);
  // no correction here may make a check of the generator's worse, and SW-RPI-22's must fall where it found a line
  for (const k of ['continuity', 'joints', 'elbows', 'valves', 'lineClearance', 'staticClearance'] as const) { const n0 = r.checks[k]?.length ?? 0; if (checks[k].length > n0) throw new Error(`unit ${u}: ${k} changed from ${n0} to ${checks[k].length}: ${checks[k].filter(v => !(r.checks[k] ?? []).includes(v)).slice(0, 3).join('; ')}`); }
  if (own0.length && checks.ownClearance.length >= own0.length) throw new Error(`unit ${u}: SW-RPI-22 found ${own0.length} pieces of one line through each other and still finds ${checks.ownClearance.length}`);
  r.checks = checks; r.notes.push(spanNote(s)); r.frames = s.frames;
  r.stats = Object.fromEntries(Object.entries(m.stats).filter(([k]) => !k.startsWith('t_')));
  r.counts = { components: count(m.lines.flatMap(l => l.comps.filter(c => c.kind !== 'studs').map(c => c.kind))), welds: count(m.lines.flatMap(l => l.welds.map(w => `${w.type}${w.field ? ', field' : ', shop'}`))), supports: count(m.lines.flatMap(l => l.supports.map(q => q.type))) };
  for (const l of r.lines) { const q = m.lines.find(x => x.no === l.no); if (!q) continue; l.components = q.comps.filter(c => c.kind !== 'studs').length; l.welds = q.welds.length; l.supports = q.supports.length; l.lengthFt = Math.round(pathLen(q) / 12); }
  r.notes = [...new Set(r.notes)];
  writeFileSync(`${dir}/unit-${u}.json`, serializePiping(m) + '\n'); writeFileSync(`${dir}/unit-${u}.report.json`, JSON.stringify(r, null, 1) + '\n');
  console.log(`unit ${u}: SW-RPI-22 ${own0.length} → ${checks.ownClearance.length}; ${changed.size} lines changed by SW-RPI-23 (${[...changed].join(', ') || 'none'}); ${cut.length} pipes cut again (SW-RPI-10); ${vt.turned.length} valves turned (SW-RPI-19), ${vt.stuck.length} left; ${struck.length} supports that strike taken out (SW-RPI-18); spans ${before} → ${checks.supports.length}; ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  for (const n of fixed) console.log(`   ${n}`);
  for (const v of checks.ownClearance) console.log(`   still: ${v}`);
}
