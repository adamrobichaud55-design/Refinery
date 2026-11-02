// Stage-7 export: reads the committed plant piping and ground truth, writes
//   public/isometrics/ISO-<line>.svg  — one isometric per line (SW-ISO-1)
//   public/workorders/index.json, WO-*.json, WO-*.html — the owner's shutdown work orders with ITPs (SW-WO, SW-ITP),
//   linked to the owner's imported drawings when public/isometrics-imported/index.json exists (SW-IMP-6)
//   public/workorders/pdf/WO-*.pdf — the same packs as PDF, written by SmartWeld's own PDF writer (SW-PDF-*)
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync } from 'node:fs';
import type { PipingModel } from '../src/generator/piping';
import type { GTLine, GTEquipment, GroundTruth } from '../src/generator/groundtruth';
import { workOrderFiles, workOrderPdfs } from '../src/generator/woexport';
import { parseFont } from '../src/pdf/ttf';
import type { ImportedIndex } from '../src/generator/imported';

const m = JSON.parse(readFileSync('public/plant-piping.json', 'utf8')) as PipingModel;
const lines = readdirSync('public/groundtruth/lines').sort().map(f => JSON.parse(readFileSync(`public/groundtruth/lines/${f}`, 'utf8')) as GTLine);
const order = new Map(m.lines.map((l, i) => [l.no, i] as const)); lines.sort((a, b) => order.get(a.header.line)! - order.get(b.header.line)!);
const gt = { lines, classes: JSON.parse(readFileSync('public/groundtruth/line-classes.json', 'utf8')), nozzles: [] } as GroundTruth;
const eq = JSON.parse(readFileSync('public/groundtruth/equipment.json', 'utf8')) as GTEquipment[];
// the owner's imported drawings, when present (stage 8, SW-IMP-6; written by tools/isomatch.py)
const imported = existsSync('public/isometrics-imported/index.json') ? JSON.parse(readFileSync('public/isometrics-imported/index.json', 'utf8')) as ImportedIndex : undefined;
const t0 = Date.now(), files = workOrderFiles(m, gt, eq, imported);
rmSync('public/isometrics', { recursive: true, force: true }); mkdirSync('public/isometrics', { recursive: true });
rmSync('public/workorders', { recursive: true, force: true }); mkdirSync('public/workorders', { recursive: true });
let bytes = 0; for (const [p, c] of files) { writeFileSync(`public/${p}`, c); bytes += c.length; }
// the packs as PDF, by SmartWeld's own PDF writer (SW-PDF-*), with the embedded font's licence notice (SW-LIC-3)
mkdirSync('public/workorders/pdf', { recursive: true });
const font = parseFont(new Uint8Array(readFileSync('assets/fonts/DejaVuSans.ttf'))), notice = readFileSync('assets/fonts/DejaVuSans-LICENSE.txt', 'utf8');
for (const [p, c] of workOrderPdfs(m, gt, eq, font, notice, imported)) { writeFileSync(`public/${p}`, c); bytes += c.length; }
console.log(`wrote ${files.size} files, ${(bytes / 1e6).toFixed(1)} MB, in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
