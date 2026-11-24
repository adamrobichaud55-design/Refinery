// Plant 3: pipes units with the generator of plants 1 and 2 (DESIGN_BASIS.md §79), checks and saves them, and draws them.
//   vite-node tools/refinery-piping.ts <unit> [<unit> ...]      writes public/refinery/piping/unit-NN.json (the model) and unit-NN.report.json,
//                                                               screenshots/refinery/unit-NN-piping-*.png, and docs/REFINERY-PIPING.md from every report on disk
import { writeFileSync, mkdirSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { serializePiping } from '../src/generator/piping';
import { render3d, type Camera } from '../src/render/view3d';
import { partDrawables, pipingDrawables, byLineClass, type Drawable } from '../src/render/scene';
import type { RGB } from '../src/render/raster';
import { pipeUnit, pipingDocument, PIPING_IMAGES, type PipedUnit } from '../src/refinery/pipingReport';

const dir = 'public/refinery/piping', shots = 'screenshots/refinery'; mkdirSync(dir, { recursive: true }); mkdirSync(shots, { recursive: true });
const C = (h: number): RGB => [(h >> 16) & 255, (h >> 8) & 255, h & 255], I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
for (const unit of process.argv.slice(2).map(Number)) {
  const { up, model, result } = pipeUnit(unit, s => console.log(s)), cell = up.cell;
  writeFileSync(`${dir}/unit-${unit}.json`, serializePiping(model) + '\n'); writeFileSync(`${dir}/unit-${unit}.report.json`, JSON.stringify(result, null, 1) + '\n');
  console.log(`unit ${unit}: ${result.lines.filter(l => l.routed).length} of ${result.lines.length} lines routed in ${result.seconds} s; failures ${result.failures.length}; checks ${Object.entries(result.checks).map(([k, v]) => `${k} ${v.length}`).join(', ')}`);
  const ds: Drawable[] = [...partDrawables(cell.interior.instances.map(i => ({ part: i.part, transform: i.transform }))), ...pipingDrawables(model, { lineColour: byLineClass, valveCells: 40 })];
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
