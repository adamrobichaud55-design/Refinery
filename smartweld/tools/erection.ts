// Draws a plant's structural steel erection set (DESIGN_BASIS.md §64) with SmartWeld's own PDF writer and renders a
// preview of every sheet with its own renderer.   vite-node tools/erection.ts [P1|P2]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { parseFont } from '../src/pdf/ttf';
import { pagePng } from '../src/render/page';
import { erectionDrawings } from '../src/drawings/erection';
import { plantById } from '../src/generator/plants';
const plant = plantById(process.argv[2] ?? 'P1'), t0 = Date.now();
const font = parseFont(new Uint8Array(readFileSync('assets/fonts/DejaVuSans.ttf')));
const { doc, sheets, marks, welds, bolts } = erectionDrawings(plant, font);
const out = `downloads/erection-${plant.id}`; mkdirSync(`${out}/sheets`, { recursive: true });
writeFileSync(`${out}.pdf`, doc.save());
const index: string[] = [`# ${plant.name} — structural steel erection drawings`, '', `Drawn by \`tools/erection.ts\` (DESIGN_BASIS.md §64) from the structural model; previews by SmartWeld's own renderer (SW-REN-2).`, '', '| Sheet | Title | Scale | Preview |', '|---|---|---|---|'];
for (const s of sheets) { const png = pagePng(font, s.page, doc.W, doc.H, 72); writeFileSync(`${out}/sheets/${s.no}.png`, png); index.push(`| ${s.no} | ${s.title} | ${s.scale ?? ''} | [${s.no}.png](sheets/${s.no}.png) |`); }
writeFileSync(`${out}/INDEX.md`, index.join('\n') + '\n');
writeFileSync(`${out}/schedules.json`, JSON.stringify({ marks, welds, bolts }, null, 1));
console.log(`${plant.id}: ${sheets.length} sheets, ${marks.length} marks, ${welds.length} weld marks, ${bolts.length} bolt marks → ${out}.pdf in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
