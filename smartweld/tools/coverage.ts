// Coverage of the owner's symbol set (DESIGN_BASIS.md §63, SW-COV-1/2): counts every symbol class in a plant's piping
// model and reports the classes below the floor.   vite-node tools/coverage.ts public/plants/P2/plant-piping.json [--json out.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { coverage, SYMBOL_CLASSES } from '../src/generator/coverage';
import type { PipingModel } from '../src/generator/piping';
const m = JSON.parse(readFileSync(process.argv[2] ?? 'public/plants/P2/plant-piping.json', 'utf8')) as PipingModel, cov = coverage(m);
for (const c of SYMBOL_CLASSES) console.log(`${c.padEnd(24)} ${String(cov.counts[c]).padStart(5)}  lines ${String(cov.lines[c]).padStart(3)}  sizes ${cov.sizes[c]}${cov.short.some(s => s.cls === c) ? '   << below the floor' : ''}`);
console.log(`\n${cov.short.length} classes below the floor (SW-COV-2)`);
const i = process.argv.indexOf('--json'); if (i > 0) writeFileSync(process.argv[i + 1], JSON.stringify(cov, null, 1));
