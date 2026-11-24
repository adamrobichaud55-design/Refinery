// Plant 3: the ground truth and the piping component files of every piped unit, written by the exporters of plants 1 and 2
// unchanged (DESIGN_BASIS.md SW-GT-*, SW-PCF-*; §79). Coordinates are the unit's own frame (SW-CELL-1) on the exporters' datum.
//   vite-node tools/refinery-export.ts [<unit> ...]     reads public/refinery/piping/unit-NN.json; writes public/refinery/units/unit-NN/groundtruth/
//                                                        (a file for each line, the index, line classes, nozzle necks, equipment, bill of material)
//                                                        and public/refinery/units/unit-NN/pcf/ (a component file for each line, and an index)
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { buildGroundTruth, buildEquipment, exportFiles } from '../src/generator/groundtruth';
import type { PipingModel } from '../src/generator/piping';
import { pcfFor, chained, pcfDir, pcfName } from '../src/exchange/pcf';
import { unitPiping } from '../src/refinery/unitPiping';

const src = 'public/refinery/piping', asked = process.argv.slice(2).map(Number), exported: { id: string; unit: number; name: string }[] = [];
const units = readdirSync(src).map(f => /^unit-(\d+)\.json$/.exec(f)?.[1]).filter((n): n is string => !!n).map(Number).filter(u => !asked.length || asked.includes(u)).sort((a, b) => a - b);
for (const u of units) {
  const t0 = Date.now(), up = unitPiping(u), m = JSON.parse(readFileSync(`${src}/unit-${u}.json`, 'utf8')) as PipingModel, out = up.plant.paths.groundtruth, pcf = pcfDir(out);
  if (m.failures.length || m.lines.some(l => !l.ok)) { console.log(`unit ${u}: not exported, its model has lines that are not routed`); continue; }
  const gt = buildGroundTruth(m), files = exportFiles(gt, buildEquipment(m, up.plant));
  rmSync(out, { recursive: true, force: true }); mkdirSync(`${out}/lines`, { recursive: true });
  let bytes = 0; for (const [p, c] of files) { writeFileSync(`${out}/${p}`, c); bytes += c.length; }
  rmSync(pcf, { recursive: true, force: true }); mkdirSync(pcf, { recursive: true });
  let pb = 0; const unchained: string[] = [], index: string[] = ['line,file,records'];
  for (const L of gt.lines) {
    const text = pcfFor(L, gt.lines), name = pcfName(L.header.line); writeFileSync(join(pcf, name), text); pb += text.length;
    if (!chained(L)) unchained.push(L.header.line);
    index.push(`"${L.header.line.replace(/"/g, '""')}",${name},${L.items.length + L.welds.length + L.supports.length}`);
  }
  writeFileSync(join(pcf, 'INDEX.csv'), index.join('\n') + '\n');
  exported.push({ id: up.plant.id, unit: u, name: up.cell.name });
  console.log(`unit ${u}: ground truth ${files.size} files, ${(bytes / 1e6).toFixed(1)} MB; ${gt.lines.length} component files, ${(pb / 1e6).toFixed(1)} MB${unchained.length ? `; NOT CHAINED: ${unchained.join(', ')}` : ''}; ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
// the list the viewer offers: every unit whose exports are on disk; a unit no longer piped keeps no exports
if (!asked.length && existsSync('public/refinery/units')) for (const d of readdirSync('public/refinery/units')) { const u = /^unit-(\d+)$/.exec(d)?.[1]; if (u && !exported.some(e => e.unit === Number(u))) rmSync(`public/refinery/units/${d}`, { recursive: true, force: true }); }
if (!asked.length) { mkdirSync('public/refinery/units', { recursive: true }); writeFileSync('public/refinery/units/index.json', JSON.stringify(exported, null, 1) + '\n'); console.log(`wrote public/refinery/units/index.json (${exported.length} units)`); }
