// Review images of a plant (SW-REN-1..3): the steel and equipment with its piping, from several view points, with
// SmartWeld's own renderer.   vite-node tools/render-plant.ts P2 [out-dir=screenshots/stage9]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { partDrawables, pipingDrawables, byLineClass, type Drawable } from '../src/render/scene';
import { render3d, type Camera } from '../src/render/view3d';
import { plantById } from '../src/generator/plants';
import type { PipingModel } from '../src/generator/piping';

const plant = plantById(process.argv[2] ?? 'P2'), out = process.argv[3] ?? `screenshots/stage9`;
const m = existsSync(plant.paths.piping) ? (JSON.parse(readFileSync(plant.paths.piping, 'utf8')) as PipingModel) : null;
const B = plant.building(), I = plant.interior(m?.cuts);
const L = B.drawing.bays * B.drawing.bayFt * 12, W = B.drawing.widthFt * 12;
const cut = partDrawables([...B.instances, ...I.instances].filter(i => !i.tags.includes('cladding') && !i.tags.includes('trim') && !i.tags.includes('roof-sheet')));
const full = partDrawables([...B.instances, ...I.instances]);
const pipes = (o?: Parameters<typeof pipingDrawables>[1]): Drawable[] => (m ? pipingDrawables(m, o) : []);
const views: { name: string; caption: string; ds: () => Drawable[]; cam: Camera }[] = [
  { name: 'exterior', caption: 'Building shell and outdoor area, from the south-east', ds: () => full, cam: { eye: [L * 1.35, 900, W * 1.4], target: [L * 0.55, 60, 0] } },
  { name: 'overview', caption: 'Steel, equipment and piping, cut-away overview', ds: () => [...cut, ...pipes()], cam: { eye: [L * 1.25, 900, W * 1.5], target: [L * 0.5, 60, 0] } },
  { name: 'line-classes', caption: 'Piping coloured by line class (SW-LC-1)', ds: () => [...cut, ...pipes({ lineColour: byLineClass })], cam: { eye: [L * 0.7, 900, 900], target: [L * 0.5, 120, 0] } },
  { name: 'rack', caption: 'Pipe rack and headers', ds: () => [...cut, ...pipes()], cam: { eye: [120, 100, 330], target: [900, 260, 0] } },
  { name: 'vessels', caption: 'Adsorber vessels, platforms and stair tower', ds: () => [...cut, ...pipes()], cam: { eye: [1100, 150, 220], target: [540, 200, 330] } },
  { name: 'column', caption: 'Column C-201, platforms and ladders', ds: () => [...cut, ...pipes()], cam: { eye: [1200, 130, -150], target: [840, 180, -330] } },
  { name: 'exchangers', caption: 'Exchanger pairs with their three-way valves', ds: () => [...cut, ...pipes()], cam: { eye: [1250, 140, 90], target: [1550, 80, 330] } },
  { name: 'pumps', caption: 'Pumps with seal-flush, sample and thermal-relief small bore', ds: () => [...cut, ...pipes()], cam: { eye: [1750, 110, 60], target: [2250, 40, 240] } },
  { name: 'bins', caption: 'Bins, rotary feeders, walkway and fill lines', ds: () => [...cut, ...pipes()], cam: { eye: [1500, 240, -240], target: [2300, 150, -510] } },
  { name: 'outdoor', caption: 'Outdoor tanks, drums and silos with the lines through the end wall', ds: () => [...full, ...pipes()], cam: { eye: [3950, 260, 760], target: [3380, 120, 0] } },
  { name: 'above', caption: 'Plan view from above', ds: () => [...cut, ...pipes()], cam: { eye: [L * 0.55, 2800, 40], target: [L * 0.55, 0, 0] } },
];
mkdirSync(out, { recursive: true });
const index = [`# ${plant.name} — review images`, '', 'Rendered by SmartWeld\'s own renderer (`tools/render-plant.ts`, SW-REN-1..3).', '', '| Image | View |', '|---|---|'];
for (const v of views) {
  const t0 = Date.now(), ds = v.ds();
  writeFileSync(`${out}/${plant.id}-${v.name}.png`, render3d(ds, v.cam, 1400, 900, 2));
  index.push(`| \`${plant.id}-${v.name}.png\` | ${v.caption} |`); console.log(`${v.name} ${((Date.now() - t0) / 1000).toFixed(1)} s (${ds.length} drawables)`);
}
writeFileSync(`${out}/../INDEX-${plant.id}.md`, index.join('\n') + '\n');   // beside screenshots/INDEX.md (the image folders hold images only)
