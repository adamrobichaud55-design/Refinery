// Plant 3: pipes the main pipeway with the generator of plants 1 and 2 (DESIGN_BASIS.md §80), checks and saves it, and draws it.
//   vite-node tools/refinery-pipeway.ts            writes public/refinery/piping/pipeway.json (the model) and pipeway.report.json,
//                                                  screenshots/refinery/pipeway-*.png and docs/REFINERY-PIPEWAY.md
//   vite-node tools/refinery-pipeway.ts document   writes the document again from the report on disk
import { writeFileSync, mkdirSync, readFileSync, existsSync, appendFileSync } from 'node:fs';
import { serializePiping, type PipingModel } from '../src/generator/piping';
import { render3d, type Camera } from '../src/render/view3d';
import { partDrawables, pipingDrawables, byLineClass, type Drawable } from '../src/render/scene';
import type { RGB } from '../src/render/raster';
import { pipePipeway, pipewayDocument, PIPEWAY_IMAGES, type PipedPipeway } from '../src/refinery/pipewayReport';
import { pipeway, PWY } from '../src/refinery/pipeway';

const dir = 'public/refinery/piping', shots = 'screenshots/refinery'; mkdirSync(dir, { recursive: true }); mkdirSync(shots, { recursive: true }); mkdirSync('docs', { recursive: true });
const C = (h: number): RGB => [(h >> 16) & 255, (h >> 8) & 255, h & 255], I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const only = process.argv[2];
let result: PipedPipeway, model: PipingModel;
if (only === 'document' || only === 'images') {
  result = JSON.parse(readFileSync(`${dir}/pipeway.report.json`, 'utf8')) as PipedPipeway; model = JSON.parse(readFileSync(`${dir}/pipeway.json`, 'utf8')) as PipingModel;
} else {
  // REFINERY_TRACE=<file>: which line the generator is on, for finding a line that holds a run up
  const trace = process.env.REFINERY_TRACE, t0 = Date.now(); if (trace) writeFileSync(trace, '');
  const watch = trace ? (plant: { joint: (l: never, m: never) => unknown }) => { let cur = ''; const j = plant.joint; plant.joint = ((l: { no: string }, m: never) => { if (l.no !== cur) { cur = l.no; appendFileSync(trace, `${((Date.now() - t0) / 1000).toFixed(1)} s: ${l.no}\n`); } return j(l as never, m); }) as never; } : undefined;
  // REFINERY_RUNS=<dir>: keep each single-line run's result there and take it from there again (while the last run is worked on; a result to be kept is made without it)
  const runs = process.env.REFINERY_RUNS; if (runs) mkdirSync(runs, { recursive: true });
  let taken = 0;
  const cache = runs ? { get: (k: number, lines: string[]) => { const f = `${runs}/pipeway-run-${k}.json`; if (!existsSync(f)) return undefined; const q = JSON.parse(readFileSync(f, 'utf8')) as { lines: string[]; model: PipingModel }; if (JSON.stringify(q.lines) !== JSON.stringify(lines)) return undefined; taken++; return q.model; },
    put: (k: number, lines: string[], m: PipingModel) => writeFileSync(`${runs}/pipeway-run-${k}.json`, `{"lines":${JSON.stringify(lines)},"model":${serializePiping(m)}}`) } : undefined;
  const r = pipePipeway(s => console.log(s), watch as never, cache); result = r.result; model = r.model;
  if (taken) { result.notes.push(`${taken} of the single-line runs were taken from results kept earlier, not made in this run: not a result to keep.`); console.log(`${taken} single-line runs taken from ${runs}: this result is not one to keep`); }
  writeFileSync(`${dir}/pipeway.json`, serializePiping(model) + '\n'); writeFileSync(`${dir}/pipeway.report.json`, JSON.stringify(result, null, 1) + '\n');
  console.log(`main pipeway: ${result.lines.filter(l => l.routed).length} of ${result.lines.length} lines routed in ${result.seconds} s; failures ${result.failures.length}; checks ${Object.entries(result.checks).map(([k, v]) => `${k} ${v.length}`).join(', ')}`);
}
writeFileSync('docs/REFINERY-PIPEWAY.md', pipewayDocument(result) + '\n'); console.log('wrote docs/REFINERY-PIPEWAY.md');
if (only !== 'document') {
  const pw = pipeway(), L = PWY.bays * PWY.bent;
  const ds: Drawable[] = [...partDrawables(pw.interior.instances.map(i => ({ part: i.part, transform: i.transform }))), ...pipingDrawables(model, { lineColour: byLineClass, valveCells: 20 })];
  ds.push({ mesh: { positions: [-600, -1, -900, L + 600, -1, -900, L + 600, -1, 900, -600, -1, 900], indices: [0, 2, 1, 0, 3, 2] }, T: I as never, color: C(0xcdc6b3) });
  const shot = (name: string, cam: Camera) => { const t0 = Date.now(); writeFileSync(`${shots}/${name}.png`, render3d(ds, cam, 1800, 1100, 2)); console.log(`  ${name} ${((Date.now() - t0) / 1000).toFixed(0)} s`); };
  const j = pw.units.find(u => u.unit === 11)!;
  shot('pipeway-from-the-south-west', { eye: [-900, 1300, 2100], target: [3000, 220, -60], fovDeg: 46 });
  shot('pipeway-a-junction', { eye: [j.x + 480, 470, j.side * 840], target: [j.x - 40, 300, j.side * 260], fovDeg: 42 });   // from over the unit's valve bay: its first bent, the junction frame, the rack beyond
  shot('pipeway-east-limit-bay', { eye: [L + 330, 520, 520], target: [L - 150, 300, 0], fovDeg: 40 });
  shot('pipeway-along-the-rack', { eye: [-640, 1150, 420], target: [3000, 240, 0], fovDeg: 44 });
  { const u = pw.units.find(q => q.unit === 14)!; shot('pipeway-utility-headers', { eye: [u.x - 560, 700, u.side * 40 + 520], target: [u.x + 60, 380, u.side * 150], fovDeg: 40 }); }
  const idx = 'screenshots/INDEX.md', cur = existsSync(idx) ? readFileSync(idx, 'utf8').replace(/\n*$/, '').split('\n') : [], idOf = (r: string) => r.slice(0, r.indexOf('|', 2));
  for (const [name, caption] of Object.entries(PIPEWAY_IMAGES)) { const r = `| \`refinery/${name}.png\` | ${caption} |`, k = cur.findIndex(c => idOf(c) === idOf(r)); if (k >= 0) cur[k] = r; else cur.push(r); }
  writeFileSync(idx, cur.join('\n') + '\n');
}
