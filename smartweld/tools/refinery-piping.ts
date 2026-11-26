// Plant 3: pipes units with the generator of plants 1 and 2 (DESIGN_BASIS.md §79), checks and saves them, and draws them.
//   vite-node tools/refinery-piping.ts <unit> [<unit> ...]      writes public/refinery/piping/unit-NN.json (the model) and unit-NN.report.json,
//                                                               screenshots/refinery/unit-NN-piping-*.png, and docs/REFINERY-PIPING.md from every report on disk
import { writeFileSync, mkdirSync, readFileSync, existsSync, readdirSync, appendFileSync } from 'node:fs';
import { serializePiping } from '../src/generator/piping';
import { render3d, type Camera } from '../src/render/view3d';
import { partDrawables, pipingDrawables, byLineClass, type Drawable } from '../src/render/scene';
import type { RGB } from '../src/render/raster';
import { pipeUnit, pipingDocument, PIPING_IMAGES, type PipedUnit } from '../src/refinery/pipingReport';
import { unitPiping } from '../src/refinery/unitPiping';
import { framePlaced } from '../src/refinery/supports';

const dir = 'public/refinery/piping', shots = 'screenshots/refinery'; mkdirSync(dir, { recursive: true }); mkdirSync(shots, { recursive: true });
const C = (h: number): RGB => [(h >> 16) & 255, (h >> 8) & 255, h & 255], I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const imagesOnly = process.argv[2] === 'images';   // `images <unit> ...`: draw the models and reports on disk again, routing nothing
for (const unit of process.argv.slice(imagesOnly ? 3 : 2).map(Number)) {
  // REFINERY_TRACE=<file>: which line the generator is on (it asks the plant for a line's joint whenever it works on that line), for finding a line that holds a run up
  const trace = process.env.REFINERY_TRACE, t0 = Date.now(); if (trace) writeFileSync(trace, '');
  const watch = trace ? (plant: { joint: (l: never, m: never) => unknown }) => { let cur = ''; const j = plant.joint; plant.joint = ((l: { no: string }, m: never) => { if (l.no !== cur) { cur = l.no; appendFileSync(trace, `${((Date.now() - t0) / 1000).toFixed(1)} s: ${l.no}\n`); } return j(l as never, m); }) as never; } : undefined;
  // REFINERY_RUNS=<dir>: keep each run but the last and take it from there again (for working on the last run; a result to be kept is made without it)
  const runs = process.env.REFINERY_RUNS; if (runs) mkdirSync(runs, { recursive: true }); let taken = 0;
  const cache = runs ? { get: (k: number, lines: string[]) => { const f = `${runs}/unit-${unit}-run-${k}.json`; if (!existsSync(f)) return undefined; const q = JSON.parse(readFileSync(f, 'utf8')) as { lines: string[]; model: never }; if (JSON.stringify(q.lines) !== JSON.stringify(lines)) return undefined; taken++; return q.model; },
    put: (k: number, lines: string[], m: never) => writeFileSync(`${runs}/unit-${unit}-run-${k}.json`, `{"lines":${JSON.stringify(lines)},"model":${serializePiping(m)}}`) } : undefined;
  const { up, model, result } = imagesOnly ? { up: unitPiping(unit), model: JSON.parse(readFileSync(`${dir}/unit-${unit}.json`, 'utf8')), result: JSON.parse(readFileSync(`${dir}/unit-${unit}.report.json`, 'utf8')) as PipedUnit } : pipeUnit(unit, s => console.log(s), watch as never, cache as never), cell = up.cell;
  if (taken) { result.notes.push(`${taken} runs were taken from results kept earlier, not made in this run: not a result to keep.`); console.log(`${taken} runs taken from ${runs}: this result is not one to keep`); }
  if (!imagesOnly) { writeFileSync(`${dir}/unit-${unit}.json`, serializePiping(model) + '\n'); writeFileSync(`${dir}/unit-${unit}.report.json`, JSON.stringify(result, null, 1) + '\n'); }
  console.log(`unit ${unit}: ${result.lines.filter(l => l.routed).length} of ${result.lines.length} lines routed in ${result.seconds} s; failures ${result.failures.length}; checks ${Object.entries(result.checks).map(([k, v]) => `${k} ${v.length}`).join(', ')}`);
  const ds: Drawable[] = [...partDrawables([...cell.interior.instances, ...(result.frames ?? []).flatMap(f => framePlaced(f))].map(i => ({ part: i.part, transform: i.transform }))), ...pipingDrawables(model, { lineColour: byLineClass, valveCells: 40 })];   // with the unit's pipe frames (SW-RPI-17)
  ds.push({ mesh: { positions: [-240, -1, cell.z0 - 240, cell.x1 + 240, -1, cell.z0 - 240, cell.x1 + 240, -1, cell.z1 + 240, -240, -1, cell.z1 + 240], indices: [0, 2, 1, 0, 3, 2] }, T: I as never, color: C(0xcdc6b3) });
  const shot = (name: string, cam: Camera) => { writeFileSync(`${shots}/${name}.png`, render3d(ds, cam, 1800, 1100, 2)); console.log(' ', name); };
  const cx = cell.x1 / 2, cz = (cell.z0 + cell.z1) / 2, span = Math.max(cell.x1, cell.z1 - cell.z0), ex = cell.spots.filter(s => s.kind === 'hx'), ex0 = ex.length ? ex.reduce((a, s) => a + s.x, 0) / ex.length : cx;
  shot(`unit-${unit}-piping-from-the-vessel-side`, { eye: [cx - 0.42 * span, 0.34 * span, cell.z0 - 0.5 * span], target: [cx, cell.y1 * 0.2, cz], fovDeg: 42 });
  shot(`unit-${unit}-piping-from-the-exchanger-side`, { eye: [cx + 0.42 * span, 0.3 * span, cell.z1 + 0.5 * span], target: [cx, cell.y1 * 0.2, cz], fovDeg: 42 });
  shot(`unit-${unit}-piping-valve-bay`, { eye: [-260, 420, -420], target: [420, 190, 40], fovDeg: 40 });
  shot(`unit-${unit}-piping-exchangers`, { eye: [ex0 + 600, 330, cell.z1 + 60], target: [ex0, 90, 420], fovDeg: 40 });
  const idx = 'screenshots/INDEX.md', cur = existsSync(idx) ? readFileSync(idx, 'utf8').replace(/\n*$/, '').split('\n') : [], idOf = (r: string) => r.slice(0, r.indexOf('|', 2));
  for (const [name, caption] of Object.entries(PIPING_IMAGES(unit, result.name))) { const r = `| \`refinery/${name}.png\` | ${caption} |`, k = cur.findIndex(c => idOf(c) === idOf(r)); if (k >= 0) cur[k] = r; else cur.push(r); }
  writeFileSync(idx, cur.join('\n') + '\n');
}
const reports = readdirSync(dir).filter(f => /^unit-\d+\.report\.json$/.test(f)).map(f => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')) as PipedUnit).sort((a, b) => a.unit - b.unit);
mkdirSync('docs', { recursive: true }); writeFileSync('docs/REFINERY-PIPING.md', pipingDocument(reports) + '\n');
console.log(`wrote docs/REFINERY-PIPING.md for units ${reports.map(r => r.unit).join(', ')}`);
