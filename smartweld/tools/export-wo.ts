// Stage-7 export: reads the committed plant piping and ground truth, writes
//   public/isometrics/ISO-<line>.svg  — one isometric per line (SW-ISO-1)
//   public/workorders/index.json, WO-*.json, WO-*.html — the owner's shutdown work orders with ITPs (SW-WO, SW-ITP)
// Then `npm run wo:pdf` prints each HTML pack to public/workorders/pdf/WO-*.pdf.
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import type { PipingModel } from '../src/generator/piping';
import type { GTLine, GTEquipment, GroundTruth } from '../src/generator/groundtruth';
import { workOrderFiles } from '../src/generator/woexport';

const m = JSON.parse(readFileSync('public/plant-piping.json', 'utf8')) as PipingModel;
const lines = readdirSync('public/groundtruth/lines').sort().map(f => JSON.parse(readFileSync(`public/groundtruth/lines/${f}`, 'utf8')) as GTLine);
const order = new Map(m.lines.map((l, i) => [l.no, i] as const)); lines.sort((a, b) => order.get(a.header.line)! - order.get(b.header.line)!);
const gt = { lines, classes: JSON.parse(readFileSync('public/groundtruth/line-classes.json', 'utf8')), nozzles: [] } as GroundTruth;
const eq = JSON.parse(readFileSync('public/groundtruth/equipment.json', 'utf8')) as GTEquipment[];
const t0 = Date.now(), files = workOrderFiles(m, gt, eq);
rmSync('public/isometrics', { recursive: true, force: true }); mkdirSync('public/isometrics', { recursive: true });
rmSync('public/workorders', { recursive: true, force: true }); mkdirSync('public/workorders', { recursive: true });
let bytes = 0; for (const [p, c] of files) { writeFileSync(`public/${p}`, c); bytes += c.length; }
console.log(`wrote ${files.size} files, ${(bytes / 1e6).toFixed(1)} MB, in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
