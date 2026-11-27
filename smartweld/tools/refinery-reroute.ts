// Plant 3, SW-RPI-26: lines at connections that moved, routed again alone. The lines that end at the named items' connections, with the lines that tap
// them, are taken out of the unit's model on disk and routed again by the generator in their own runs' order, each run seeing everything the model keeps;
// then the corrections a unit's run makes on its merged model (SW-RPI-14, -23, -11, -10). The supports and the rest are made after by
// tools/refinery-supports.ts, as on any model on disk.
//   vite-node tools/refinery-reroute.ts <unit> <item pattern>      e.g. 11 '^P-110[134][AB]$'
import { readFileSync, writeFileSync } from 'node:fs';
import { generatePiping, serializePiping, type PipingModel, type LineRun } from '../src/generator/piping';
import type { Placed } from '../src/generator/building';
import { unitPiping } from '../src/refinery/unitPiping';
import { runSolids, valveBoxFn, removeValves, lengthenShortPieces, cutLongPipes, type PipedUnit } from '../src/refinery/pipingReport';
import { selfCorrections } from '../src/refinery/ownLine';

const dir = process.env.PIPING_DIR ?? 'public/refinery/piping', u = Number(process.argv[2]), items = new RegExp(process.argv[3] ?? '^$'), vb = valveBoxFn(), t0 = Date.now();
const m = JSON.parse(readFileSync(`${dir}/unit-${u}.json`, 'utf8')) as PipingModel, r = JSON.parse(readFileSync(`${dir}/unit-${u}.report.json`, 'utf8')) as PipedUnit, up = unitPiping(u);
// the lines at the items' connections, and every line that taps one of them
const equipOf = new Map([...up.nozzles.entries()].map(([id, n]) => [id, (n as { equip: string }).equip] as const));
const at = (e: { k: string; id?: string }) => e.k === 'nozzle' && !!e.id && items.test(equipOf.get(e.id) ?? '');
const L = new Set(up.lines.filter(l => at(l.def.from as never) || at(l.def.to as never)).map(l => l.def.no));
for (let grew = true; grew;) { grew = false; for (const l of up.lines) if (!L.has(l.def.no) && [l.def.from, l.def.to].some(e => e.k === 'tap' && L.has(e.line))) { L.add(l.def.no); grew = true; } }
if (!L.size) throw new Error(`unit ${u}: no line ends at an item matching ${items}`);
console.log(`unit ${u}: ${L.size} lines routed again (SW-RPI-26): ${[...L].join(', ')}`);
// the model as it stands, without them; each of their runs routed again in order, seeing the rest as it stands and the runs before it
const kept: PipingModel = { ...m, lines: m.lines.filter(l => !L.has(l.no)) }, prior: Placed[] = runSolids(kept, vb), fresh = new Map<string, LineRun>(), failures: string[] = [];
for (const [k, run] of up.runs.entries()) {
  const mine = new Set(run.lines.filter(no => L.has(no))); if (!mine.size) continue;
  const only = (l: { no: string }) => mine.has(l.no);
  let res = generatePiping({ plant: up.runPlant(k, prior), only });
  // as a unit's run does: on the unit's whole grid, then on a grid cut close to it, where the cut grid finds no way
  if (res.failures.length && run.kind !== 'rest') for (const g of [true, 'close'] as const) { const again = generatePiping({ plant: up.runPlant(k, prior, g as never), only }); if (again.failures.length < res.failures.length) res = again; if (!res.failures.length) break; }
  for (const l of res.lines) if (mine.has(l.no)) fresh.set(l.no, l);
  failures.push(...res.failures);
  console.log(`unit ${u}: run ${k + 1}${run.lane ? ` on tier ${run.lane.t + 1} in the lane at z ${run.lane.z}` : ''}: ${[...mine].join(', ')}; ${res.failures.length} failures`); for (const f of res.failures) console.log(`   ${f}`);
  for (const b of runSolids({ ...res, lines: res.lines.filter(l => mine.has(l.no)) }, vb)) prior.push(b);
}
// SW-RPI-26: a line its run left unrouted, routed once more after the others, seeing them as laid; a branch with its parent and the parent's other
// branches (the generator plans a take-off on a parent it routes in the same call), everything else as laid
const defs = new Map(up.lines.map(l => [l.def.no, l.def] as const)), tapOf = (no: string) => [defs.get(no)?.from, defs.get(no)?.to].filter((e): e is { k: 'tap'; line: string } & never => !!e && e.k === 'tap').map(e => (e as { line: string }).line);
for (const f of [...failures]) {
  const no = f.split(':')[0], k = up.runs.findIndex(q => q.lines.includes(no)); if (k < 0 || !L.has(no)) continue;
  const set = new Set([no]); for (let grew = true; grew;) { grew = false; for (const x of [...set]) for (const p of tapOf(x)) if (L.has(p) && !set.has(p)) { set.add(p); grew = true; } for (const l of up.lines) if (L.has(l.def.no) && !set.has(l.def.no) && tapOf(l.def.no).some(p => set.has(p))) { set.add(l.def.no); grew = true; } }
  const others: Placed[] = [...runSolids(kept, vb), ...runSolids({ ...kept, lines: [...fresh.values()].filter(l => !set.has(l.no)) }, vb)], only = (l: { no: string }) => set.has(l.no);
  let res = generatePiping({ plant: up.runPlant(k, others), only });
  if (res.failures.length) for (const g of [true, 'close'] as const) { const again = generatePiping({ plant: up.runPlant(k, others, g as never), only }); if (again.failures.length < res.failures.length) res = again; if (!res.failures.length) break; }
  if (res.failures.length) { console.log(`unit ${u}: ${[...set].join(', ')} after the others: still ${res.failures.length} not routed`); continue; }
  for (const l of res.lines) if (set.has(l.no)) fresh.set(l.no, l);
  for (const x of [...failures]) if (set.has(x.split(':')[0])) failures.splice(failures.indexOf(x), 1);
  console.log(`unit ${u}: ${[...set].join(', ')} routed after the others of the run (SW-RPI-26)`);
}
// merged in the plan's order; the corrections a unit's run makes on its merged model, on the lines routed again (SW-RPI-14, SW-RPI-11, SW-RPI-10) and on the whole (SW-RPI-23)
m.lines = m.lines.map(l => fresh.get(l.no) ?? l);
const sub: PipingModel = { ...m, lines: m.lines.filter(l => L.has(l.no)) }, notes: string[] = [];
const bared = removeValves(sub, up); notes.push(...bared.map(c => `${c} (SW-RPI-14)`));
const selfx = selfCorrections(m, up, vb); notes.push(...selfx);
notes.push(...lengthenShortPieces(sub).map(c => `${c}: a make-up piece under 2 in beside a 45° offset, the offset moved along the run to make it 2 in (SW-RPI-11)`));
notes.push(...cutLongPipes(sub).map(c => `${c}: a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)`));
// the report: those lines' failures, frames and entries; the supports tool brings the checks and counts up to date
r.failures = [...(r.failures ?? []).filter(f => !L.has(f.split(':')[0])), ...failures];
r.frames = (r.frames ?? []).filter(f => !L.has(f.line));
m.failures = r.failures as never;
const pathLen = (q: LineRun) => q.path.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - q.path[i - 1][0], p[1] - q.path[i - 1][1], p[2] - q.path[i - 1][2]) : 0), 0);
for (const l of r.lines) { const q = m.lines.find(x => x.no === l.no); if (!q || !L.has(q.no)) continue; l.routed = q.ok; l.components = q.comps.filter(c => c.kind !== 'studs').length; l.welds = q.welds.length; l.supports = q.supports.length; l.lengthFt = Math.round(pathLen(q) / 12); }
r.notes.push(`${L.size} lines at the connections of ${items.source} routed again alone, the rest of the unit as it stood (SW-RPI-26): ${[...L].join(', ')}${failures.length ? `; ${failures.length} not routed` : ''}`, ...notes);
writeFileSync(`${dir}/unit-${u}.json`, serializePiping(m) + '\n'); writeFileSync(`${dir}/unit-${u}.report.json`, JSON.stringify(r, null, 1) + '\n');
console.log(`unit ${u}: ${[...L].filter(no => fresh.get(no)?.ok).length} of ${L.size} routed again, ${failures.length} failures; ${notes.length} notes; ${((Date.now() - t0) / 1000).toFixed(0)} s`);
for (const n of notes) console.log(`   ${n}`);
