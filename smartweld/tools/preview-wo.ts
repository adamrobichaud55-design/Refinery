// Page previews of a work-order pack (SW-REN-2), drawn by SmartWeld's own renderer from the PDF writer's records.
//   vite-node tools/preview-wo.ts <WO-number> <out-dir> [dpi]
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import type { PipingModel } from '../src/generator/piping';
import type { GTLine, GTEquipment, GroundTruth } from '../src/generator/groundtruth';
import type { ImportedIndex } from '../src/generator/imported';
import { buildWorkOrders, DEMO_NOTICE } from '../src/generator/workorders';
import { linkImported } from '../src/generator/woexport';
import { woIsometrics, woSections } from '../src/generator/wopack';
import { packDoc } from '../src/pdf/wopdf';
import { parseFont } from '../src/pdf/ttf';
import { pagePng } from '../src/render/page';

const [num, out, dpi] = process.argv.slice(2);
const m = JSON.parse(readFileSync('public/plant-piping.json', 'utf8')) as PipingModel;
const lines = readdirSync('public/groundtruth/lines').map(f => JSON.parse(readFileSync(`public/groundtruth/lines/${f}`, 'utf8')) as GTLine);
const order = new Map(m.lines.map((l, i) => [l.no, i] as const)); lines.sort((a, b) => order.get(a.header.line)! - order.get(b.header.line)!);
const gt = { lines, classes: JSON.parse(readFileSync('public/groundtruth/line-classes.json', 'utf8')), nozzles: [] } as GroundTruth;
const eq = JSON.parse(readFileSync('public/groundtruth/equipment.json', 'utf8')) as GTEquipment[];
const imported = existsSync('public/isometrics-imported/index.json') ? JSON.parse(readFileSync('public/isometrics-imported/index.json', 'utf8')) as ImportedIndex : undefined;
const wos = buildWorkOrders(m, gt, eq); if (imported) linkImported(wos, imported);
const w = wos.find(x => x.number === num); if (!w) throw new Error(`no work order ${num}`);
const font = parseFont(new Uint8Array(readFileSync('assets/fonts/DejaVuSans.ttf')));
const doc = packDoc(font, w.number, woSections(w, woIsometrics(w, new Map(lines.map(l => [l.header.line, l] as const))), imported), { demo: DEMO_NOTICE, font: readFileSync('assets/fonts/DejaVuSans-LICENSE.txt', 'utf8') });
mkdirSync(out, { recursive: true });
doc.pages.forEach((p, i) => { writeFileSync(`${out}/${num}-p${String(i + 1).padStart(2, '0')}.png`, pagePng(font, p, doc.W, doc.H, Number(dpi ?? 100))); });
console.log(`${doc.pages.length} pages to ${out}`);
