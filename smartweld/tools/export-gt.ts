// Ground-truth export (SW-GT-6, SW-PLANT-2): reads a plant's committed piping and writes its ground-truth folder — one file
// per line, the index, the line-class table, the nozzle necks, the equipment and the plant BOM.  vite-node tools/export-gt.ts [P1|P2]
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { buildGroundTruth, buildEquipment, exportFiles } from '../src/generator/groundtruth';
import type { PipingModel } from '../src/generator/piping';
import { plantById } from '../src/generator/plants';
const plant = plantById(process.argv[2] ?? 'P1');
const m = JSON.parse(readFileSync(plant.paths.piping, 'utf8')) as PipingModel, out = plant.paths.groundtruth;
const t0 = Date.now(), files = exportFiles(buildGroundTruth(m), buildEquipment(m, plant));
rmSync(out, { recursive: true, force: true }); mkdirSync(`${out}/lines`, { recursive: true });
let bytes = 0; for (const [p, c] of files) { writeFileSync(`${out}/${p}`, c); bytes += c.length; }
console.log(`${plant.id}: wrote ${files.size} files, ${(bytes / 1e6).toFixed(1)} MB, in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
