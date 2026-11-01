// Stage-6 ground-truth export (SW-GT-6): reads the committed plant piping (public/plant-piping.json) and writes
// public/groundtruth/ — one file per line, the index, the line-class table, the nozzle necks and the plant BOM.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { buildGroundTruth, buildEquipment, exportFiles } from '../src/generator/groundtruth';
import type { PipingModel } from '../src/generator/piping';
const m = JSON.parse(readFileSync('public/plant-piping.json', 'utf8')) as PipingModel, out = 'public/groundtruth';
const t0 = Date.now(), files = exportFiles(buildGroundTruth(m), buildEquipment(m));
rmSync(out, { recursive: true, force: true }); mkdirSync(`${out}/lines`, { recursive: true });
let bytes = 0; for (const [p, c] of files) { writeFileSync(`${out}/${p}`, c); bytes += c.length; }
console.log(`wrote ${files.size} files, ${(bytes / 1e6).toFixed(1)} MB, in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
