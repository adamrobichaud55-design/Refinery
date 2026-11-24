// Plant 3: renders the units and the whole plant (DESIGN_BASIS.md §78).
//   vite-node tools/refinery-model.ts [unit number | site]      writes screenshots/refinery/unit-*.png and plant-*.png
import { writeFileSync, mkdirSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { render3d, type Camera } from '../src/render/view3d';
import { partDrawables, pipingDrawables, byLineClass, type Drawable } from '../src/render/scene';
import type { PipingModel } from '../src/generator/piping';
import { multiply } from '../src/geometry/transform';
import type { RGB } from '../src/render/raster';
import { cells, siteParts, cellToSite } from '../src/refinery/assemble';
import { groundMeshes, type Cover } from '../src/refinery/terrain';
import { siteGround, plot, bench } from '../src/refinery/site';
import { MODEL_IMAGES } from '../src/refinery/modelReport';

const out = 'screenshots/refinery', only = process.argv[2], named = process.argv[3]; mkdirSync(out, { recursive: true });   // [unit | 'units' | 'site'] [part of a view's name]
const C = (h: number): RGB => [(h >> 16) & 255, (h >> 8) & 255, h & 255], I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const ft = (v: [number, number, number]): [number, number, number] => [v[0] * 12, v[1] * 12, v[2] * 12];
const shot = (name: string, ds: Drawable[], cam: Camera, w = 1800, h = 1100) => { if (named && !name.includes(named)) return; const t0 = Date.now(); writeFileSync(`${out}/${name}.png`, render3d(ds, cam, w, h, 2)); console.log(`${name} ${((Date.now() - t0) / 1000).toFixed(1)} s (${ds.length} drawables)`); };
// each unit in its own frame, seen from its vessel side and from its exchanger side
for (const { plot: p, cell } of cells()) {
  const id = p.id === 'CT' ? 'cooling-tower' : `unit-${p.unit}`; if (only && only !== String(p.unit) && only !== 'units') continue;
  const ds = partDrawables(cell.interior.instances.map(i => ({ part: i.part, transform: i.transform }))), cx = cell.x1 / 2, cz = (cell.z0 + cell.z1) / 2, span = Math.max(cell.x1, cell.z1 - cell.z0);
  ds.push({ mesh: { positions: [-240, -1, cell.z0 - 240, cell.x1 + 240, -1, cell.z0 - 240, cell.x1 + 240, -1, cell.z1 + 240, -240, -1, cell.z1 + 240], indices: [0, 2, 1, 0, 3, 2] }, T: I, color: C(0xcdc6b3) });
  shot(`${id}-from-the-vessel-side`, ds, { eye: [cx - 0.42 * span, 0.34 * span, cell.z0 - 0.5 * span], target: [cx, cell.y1 * 0.2, cz], fovDeg: 42 });
  shot(`${id}-from-the-exchanger-side`, ds, { eye: [cx + 0.42 * span, 0.3 * span, cell.z1 + 0.5 * span], target: [cx, cell.y1 * 0.2, cz], fovDeg: 42 });
}
if (!only || only === 'site') {
  const COVER: Record<Cover, RGB> = { water: C(0x5f8fb0), beach: C(0xd6cba6), rock: C(0x8b8a84), ground: C(0x8f9b6b), slope: C(0xa69473), bench: C(0xcdc6b3), road: C(0x5c5f63) };
  const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const tone = (t: number) => { const base = mix(C(0x93a36c), C(0xa39a70), Math.floor(t / 3) / 3), k = [0.93, 1, 1.07][t % 3]; return [base[0] * k, base[1] * k, base[2] * k] as RGB; };
  const ds: Drawable[] = groundMeshes(siteGround(), 10).map(g => ({ mesh: g.mesh, T: I, color: g.cover === 'ground' ? tone(g.tone) : COVER[g.cover] }));
  ds.push(...partDrawables(siteParts().map(i => ({ part: i.part, transform: i.transform }))));
  // the piping of the units that are piped (§79), each model set on the site with its unit, lines coloured by line class
  const pipedDir = 'public/refinery/piping', piped = existsSync(pipedDir) ? readdirSync(pipedDir).map(f => /^unit-(\d+)\.json$/.exec(f)?.[1]).filter((n): n is string => !!n).map(Number) : [];
  for (const { plot: p, cell } of cells()) {
    if (p.id === 'CT' || !piped.includes(p.unit!)) continue;
    const m = JSON.parse(readFileSync(`${pipedDir}/unit-${p.unit}.json`, 'utf8')) as PipingModel, T = cellToSite(p, cell);
    for (const d of pipingDrawables(m, { lineColour: byLineClass, valveCells: 10 })) ds.push({ ...d, T: multiply(T, d.T) });
  }
  console.log(`site: ${ds.length} drawables, piping of units ${piped.join(', ') || 'none'}`);
  const pb = bench('process'), u11 = plot('U11');
  shot('plant-from-the-south-west', ds, { eye: ft([-300, 1100, 5300]), target: ft([2100, 60, 2350]), fovDeg: 45 });
  shot('plant-from-the-south-east', ds, { eye: ft([4700, 900, 4700]), target: ft([2200, 60, 2400]), fovDeg: 45 });
  shot('plant-process-units-from-the-south', ds, { eye: ft([1900, 520, 4100]), target: ft([1900, pb.el + 30, 2700]), fovDeg: 45 });
  shot('plant-crude-and-vacuum-units', ds, { eye: ft([u11.x0 - 260, pb.el + 190, u11.z1 + 330]), target: ft([(u11.x0 + u11.x1) / 2 + 150, pb.el + 40, u11.z1 - 190]), fovDeg: 45 });
  shot('plant-tank-farm-from-the-north-east', ds, { eye: ft([3900, 520, 250]), target: ft([2100, 90, 1500]), fovDeg: 45 });
  const u15 = plot('U15');
  // from above the west end of the road between the two rows of units, looking east along it
  const u13 = plot('U13'), road = (u11.z1 + u15.z0) / 2;
  shot('plant-piped-units-along-the-pipeway', ds, { eye: ft([u13.x0 - 260, pb.el + 330, road + 40]), target: ft([u15.x1 + 60, pb.el + 15, road]), fovDeg: 50 });
}
const idx = 'screenshots/INDEX.md', cur = existsSync(idx) ? readFileSync(idx, 'utf8').replace(/\n*$/, '').split('\n') : [], idOf = (r: string) => r.slice(0, r.indexOf('|', 2));
for (const [name, caption] of Object.entries(MODEL_IMAGES)) { if (!existsSync(`${out}/${name}.png`)) continue; const r = `| \`refinery/${name}.png\` | ${caption} |`, k = cur.findIndex(c => idOf(c) === idOf(r)); if (k >= 0) cur[k] = r; else cur.push(r); }
writeFileSync(idx, cur.join('\n') + '\n');
