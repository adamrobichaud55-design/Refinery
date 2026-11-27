// Plant 3: SW-RPI-17 applied to the piped units' models on disk, without routing them again: supports are added where the
// generator's stepping along a run had stopped, and each unit's report is brought up to date (checks, support counts, notes).
// A unit routed afresh by tools/refinery-piping.ts has the same correction made as part of its run.
//   vite-node tools/refinery-supports.ts [<unit> ...]
import { readFileSync, writeFileSync } from 'node:fs';
import { serializePiping, type PipingModel } from '../src/generator/piping';
import { unitPiping } from '../src/refinery/unitPiping';
import { unitChecks, valveBoxFn, spanNote, type PipedUnit } from '../src/refinery/pipingReport';
import { supportsAlongSpans, supportsThatStrike, valvesThatStrike, hangerTops, waferStuds } from '../src/refinery/supports';
const dir = 'public/refinery/piping', vb = valveBoxFn();
const units = process.argv.slice(2).map(Number); for (const u of units.length ? units : [11, 12, 13, 14, 15, 16, 17, 18, 19]) {
  const m = JSON.parse(readFileSync(`${dir}/unit-${u}.json`, 'utf8')) as PipingModel, r = JSON.parse(readFileSync(`${dir}/unit-${u}.report.json`, 'utf8')) as PipedUnit, up = unitPiping(u);
  // made again on a model that has had it, the counts are added to the note already there
  const was = r.notes.findIndex(n => n.includes('(SW-RPI-17)')), num = (re: RegExp) => (was >= 0 ? Number(re.exec(r.notes[was])?.[1] ?? 0) : 0);
  const vt = valvesThatStrike(m, up.plant, vb);   // SW-RPI-19: valves whose stem or handwheel strikes, turned
  if (vt.turned.length || vt.stuck.length) r.notes.push(`${vt.turned.length} valves turned where their stem or handwheel struck (SW-RPI-19)${vt.turned.length ? `: ${vt.turned.join('; ')}` : ''}${vt.stuck.length ? `; ${vt.stuck.length} with no clear direction, left: ${vt.stuck.join('; ')}` : ''}`);
  const struck = supportsThatStrike(m, up.plant, vb);   // SW-RPI-18 first: supports whose rod, post or leg strikes are taken out
  const before = r.checks.supports.length, s = supportsAlongSpans(m, up.plant, vb), ht = hangerTops(m, up.plant), ws = waferStuds(m), aside: string[] = [], checks = unitChecks(m, up, aside);
  if (ht.length) r.notes.push(`${ht.length} hangers' rods made to reach the underside of the steel they hang from (SW-RPI-20)`); if (ws.length) r.notes.push(`${ws.length} wafer valves bolted with one stud set through both flanges (SW-RPI-21)`);
  if (struck.length) r.notes.push(`${struck.length} supports taken out where their rod, post or leg struck another line, steel or another support (SW-RPI-18): ${struck.join('; ')}`);
  if (was >= 0) { s.hangers += num(/(\d+) hangers/); s.onSteel += num(/(\d+) stanchions on steel/); s.stanchions += num(/, (\d+) stanchions and/); s.posts += num(/(\d+) support posts/); s.frames = [...(r.frames ?? []), ...s.frames]; r.notes.splice(was, 1); }
  for (const k of ['continuity', 'joints', 'elbows', 'valves', 'lineClearance', 'staticClearance'] as const) if (checks[k].length > r.checks[k].length) throw new Error(`unit ${u}: ${k} changed from ${r.checks[k].length} to ${checks[k].length}: the correction must add supports only`);
  r.checks = checks; r.notes.push(spanNote(s)); r.frames = s.frames;
  const count = (xs: string[]) => { const o: Record<string, number> = {}; for (const x of xs) o[x] = (o[x] ?? 0) + 1; return Object.fromEntries(Object.entries(o).sort()); };
  r.counts.supports = count(m.lines.flatMap(l => l.supports.map(q => q.type))); for (const l of r.lines) l.supports = m.lines.find(q => q.no === l.no)!.supports.length;
  writeFileSync(`${dir}/unit-${u}.json`, serializePiping(m) + '\n'); writeFileSync(`${dir}/unit-${u}.report.json`, JSON.stringify(r, null, 1) + '\n');
  console.log(`unit ${u}: ${ht.length} hanger tops (SW-RPI-20), ${ws.length} wafer stud sets (SW-RPI-21), ${vt.turned.length} valves turned (SW-RPI-19), ${vt.stuck.length} left; ${struck.length} supports that strike taken out (SW-RPI-18); spans ${before} → ${checks.supports.length}; ${spanNote(s)}`);
}
