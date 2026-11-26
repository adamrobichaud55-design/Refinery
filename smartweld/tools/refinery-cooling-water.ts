// Plant 3: pipes the cooling water mains with the generator of plants 1 and 2 (DESIGN_BASIS.md §81), checks and saves them, and draws them.
//   vite-node tools/refinery-cooling-water.ts            writes public/refinery/piping/cooling-water.json (the model, in the area's frame) and cooling-water.report.json,
//                                                        screenshots/refinery/cooling-water-*.png and docs/REFINERY-COOLING-WATER.md
//   vite-node tools/refinery-cooling-water.ts document   writes the document again from the report on disk
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { serializePiping, type PipingModel } from '../src/generator/piping';
import { render3d, type Camera } from '../src/render/view3d';
import { partDrawables, pipingDrawables, byLineClass, type Drawable } from '../src/render/scene';
import type { RGB } from '../src/render/raster';
import { pipeCoolingWater, coolingWaterDocument, COOLING_WATER_IMAGES, type PipedCoolingWater } from '../src/refinery/coolingWaterReport';
import { coolingWater, CWM } from '../src/refinery/coolingWater';
import { pipeway } from '../src/refinery/pipeway';
import { framePlaced } from '../src/refinery/supports';
import { multiply } from '../src/geometry/transform';

const dir = 'public/refinery/piping', shots = 'screenshots/refinery'; mkdirSync(dir, { recursive: true }); mkdirSync(shots, { recursive: true }); mkdirSync('docs', { recursive: true });
const C = (h: number): RGB => [(h >> 16) & 255, (h >> 8) & 255, h & 255], I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const only = process.argv[2];
let result: PipedCoolingWater, model: PipingModel;
if (only === 'document' || only === 'images') {
  result = JSON.parse(readFileSync(`${dir}/cooling-water.report.json`, 'utf8')) as PipedCoolingWater; model = JSON.parse(readFileSync(`${dir}/cooling-water.json`, 'utf8')) as PipingModel;
} else {
  const r = pipeCoolingWater(s => console.log(s)); result = r.result; model = r.model;
  writeFileSync(`${dir}/cooling-water.json`, serializePiping(model) + '\n'); writeFileSync(`${dir}/cooling-water.report.json`, JSON.stringify(result, null, 1) + '\n');
  console.log(`cooling water mains: ${result.lines.filter(l => l.routed).length} of ${result.lines.length} lines routed in ${result.seconds} s; failures ${result.failures.length}; checks ${Object.entries(result.checks).map(([k, v]) => `${k} ${v.length}`).join(', ')}`);
}
writeFileSync('docs/REFINERY-COOLING-WATER.md', coolingWaterDocument(result) + '\n'); console.log('wrote docs/REFINERY-COOLING-WATER.md');
if (only !== 'document' && !process.env.NO_IMAGES) {
  // drawn in the area's frame: the pipeway's steel and lines moved with it, the sleepers and frames, the mains coloured by line class
  const cw = coolingWater(), pw = pipeway(), toA = (T: number[]) => multiply(cw.toPipeway.map((v, i) => (i === 14 ? -v : v)) as never, T as never) as unknown as number[];
  const pm = JSON.parse(readFileSync(`${dir}/pipeway.json`, 'utf8')) as PipingModel;
  const shifted: PipingModel = { ...pm, lines: pm.lines.map(r => ({ ...r, comps: r.comps.map(c => ({ ...c, T: toA(c.T) as never })), supports: r.supports.map(s => ({ ...s, T: toA(s.T) as never })) })), nozzles: [] };
  const own = cw.interior.instances.filter(i => i.tags.includes('sleeper'));
  const ds: Drawable[] = [...partDrawables([...pw.interior.instances.map(i => ({ part: i.part, transform: toA(i.transform as never) as never })), ...own.map(i => ({ part: i.part, transform: i.transform })), ...(result.frames ?? []).flatMap(f => framePlaced(f)).map(i => ({ part: i.part, transform: i.transform }))]),
    ...pipingDrawables(shifted, { lineColour: () => C(0xb9b4a8), valveCells: 12 }), ...pipingDrawables(model, { lineColour: byLineClass, valveCells: 20 })];
  ds.push({ mesh: { positions: [-600, -1, -1400, 14600, -1, -1400, 14600, -1, 1100, -600, -1, 1100], indices: [0, 2, 1, 0, 3, 2] }, T: I as never, color: C(0xcdc6b3) });
  const shot = (name: string, cam: Camera) => { const t0 = Date.now(); writeFileSync(`${shots}/${name}.png`, render3d(ds, cam, 1800, 1100, 2)); console.log(`  ${name} ${((Date.now() - t0) / 1000).toFixed(0)} s`); };
  const tower = cw.spools.filter(s => s.unit === 19), tx = tower.reduce((a, s) => a + s.at[0], 0) / Math.max(1, tower.length), tz = tower.length ? tower[0].at[2] : 0;
  shot('cooling-water-from-the-tower', { eye: [tx + 900, 700, tz - 600], target: [tx - 1400, 60, 0], fovDeg: 44 });
  const b = cw.branches.find(q => q.unit === 11) ?? cw.branches[0], bz = cw.nozzles.get(`${b.spool}-P`)!.face;
  shot('cooling-water-risers', { eye: [bz[0] + 620, 150, -60], target: [bz[0] - 40, 190, bz[2] / 2], fovDeg: 50 });
  shot('cooling-water-along-the-way', { eye: [-500, 380, -260], target: [4000, 40, 40], fovDeg: 40 });
  const idx = 'screenshots/INDEX.md', cur = existsSync(idx) ? readFileSync(idx, 'utf8').replace(/\n*$/, '').split('\n') : [], idOf = (r: string) => r.slice(0, r.indexOf('|', 2));
  for (const [name, caption] of Object.entries(COOLING_WATER_IMAGES)) { const r = `| \`refinery/${name}.png\` | ${caption} |`, k = cur.findIndex(c => idOf(c) === idOf(r)); if (k >= 0) cur[k] = r; else cur.push(r); }
  writeFileSync(idx, cur.join('\n') + '\n');
  void CWM;
}
