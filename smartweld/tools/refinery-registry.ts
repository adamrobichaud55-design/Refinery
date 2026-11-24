// Plant 3: writes the code layer's files (DESIGN_BASIS.md §76, SW-REG-7).
//   vite-node tools/refinery-registry.ts      writes docs/REFINERY-REGISTRY.md, public/refinery/registry/*.json and the printable records
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { parseFont } from '../src/pdf/ttf';
import { processModel } from '../src/refinery/process';
import { registryData, registryDocument, REGISTRY_IMAGES } from '../src/refinery/registryReport';
import { pagePng } from '../src/render/page';
import type { PdfDoc } from '../src/pdf/pdf';
import { registryPdf } from '../src/refinery/registryPdf';

const dir = 'public/refinery/registry', D = registryData();
mkdirSync(dir, { recursive: true }); mkdirSync('docs', { recursive: true });
const round = (_k: string, v: unknown) => (typeof v === 'number' && !Number.isInteger(v) ? Number(v.toPrecision(7)) : v);
for (const [name, data] of Object.entries(D)) writeFileSync(`${dir}/${name}.json`, JSON.stringify(data, round, 1) + '\n');
writeFileSync('docs/REFINERY-REGISTRY.md', registryDocument() + '\n');
const font = parseFont(new Uint8Array(readFileSync('assets/fonts/DejaVuSans.ttf')));
let pages = 0, bytes = 0;
// previews of a few pages, drawn by SmartWeld's own renderer from the PDF writer's records (SW-REN-2)
const shots = 'screenshots/refinery'; mkdirSync(shots, { recursive: true });
const preview = (doc: PdfDoc, find: string, name: string) => { const i = doc.pages.findIndex(p => p.recs.some(r => r.k === 'text' && r.size > 12 && r.str.startsWith(find))); if (i < 0) throw new Error(`no page headed "${find}"`); writeFileSync(`${shots}/${name}.png`, pagePng(font, doc.pages[i], doc.W, doc.H, 110)); };
for (const unit of [...processModel().sheets.map(s => s.no), 0]) {
  const { name, pdf, pageCount, doc } = registryPdf(font, unit);
  writeFileSync(`${dir}/${name}`, pdf); pages += pageCount; bytes += pdf.length;
  if (unit === 11) { preview(doc, 'C-1101', 'registry-record-of-a-column'); preview(doc, 'E-1109', 'registry-record-of-an-exchanger'); preview(doc, 'Unit 11: line register', 'registry-line-register'); }
  if (unit === 19) preview(doc, 'B-1901', 'registry-record-of-a-boiler');
  if (unit === 0) preview(doc, 'Plant 3: registration index', 'registry-line-classes');
}
const idx = 'screenshots/INDEX.md', cur = existsSync(idx) ? readFileSync(idx, 'utf8').replace(/\n*$/, '').split('\n') : [], idOf = (r: string) => r.slice(0, r.indexOf('|', 2));
for (const [name, caption] of Object.entries(REGISTRY_IMAGES)) { const r = `| \`refinery/${name}.png\` | ${caption} |`, k = cur.findIndex(c => idOf(c) === idOf(r)); if (k >= 0) cur[k] = r; else cur.push(r); }
writeFileSync(idx, cur.join('\n') + '\n');
console.log(`wrote docs/REFINERY-REGISTRY.md, ${dir}/{${Object.keys(D).join(',')}}.json and the printable records: ${D.equipment.records.length} equipment records, ${D.lines.lines.length} lines, ${D.lines.classes.length} line classes; ${pages} pages, ${(bytes / 1e6).toFixed(1)} MB of PDF`);
