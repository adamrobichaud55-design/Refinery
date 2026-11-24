// Plant 3: writes the process document and data files (DESIGN_BASIS.md §74, §75; SW-REF-2).
//   vite-node tools/refinery-process.ts      writes docs/REFINERY-PROCESS.md and public/refinery/process/*.json
import { writeFileSync, mkdirSync } from 'node:fs';
import { processDocument, processData } from '../src/refinery/report';

const D = processData(), dir = 'public/refinery/process';
mkdirSync(dir, { recursive: true }); mkdirSync('docs', { recursive: true });
const round = (_k: string, v: unknown) => (typeof v === 'number' && !Number.isInteger(v) ? Number(v.toPrecision(7)) : v);
for (const [name, data] of Object.entries(D)) writeFileSync(`${dir}/${name}.json`, JSON.stringify(data, round, 1) + '\n');
writeFileSync('docs/REFINERY-PROCESS.md', processDocument() + '\n');
console.log(`wrote docs/REFINERY-PROCESS.md and ${dir}/{${Object.keys(D).join(',')}}.json: ${D.equipment.reduce((a, u) => a + u.items.length, 0)} equipment items, ${D.lines.reduce((a, u) => a + u.lines.length, 0)} lines, ${D.streams.transfers.length} streams between units`);
