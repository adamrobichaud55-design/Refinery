// The owner's zero-checks on a plant's ground truth and PCF files (DESIGN_BASIS.md SW-LL-8, SW-GT-7, SW-PCF-2..4).
//   vite-node tools/pcf-check.ts [P1|P2]      every count must be zero before the files are pushed
import { checkPlant } from '../src/exchange/pcfCheck';
import { plantById } from '../src/generator/plants';
const plant = plantById(process.argv[2] ?? 'P2'), r = checkPlant(plant.paths.groundtruth, { valveToValve: plant.id !== 'P1' });
let bad = 0;
for (const [k, v] of Object.entries(r.counts)) { console.log(`${String(v).padStart(5)}  ${k}${v ? '   e.g. ' + r.examples[k].join(', ') : ''}`); bad += v; }
console.log(bad ? `${plant.id}: ${bad} findings` : `${plant.id}: all checks zero`);
if (bad) process.exitCode = 1;
