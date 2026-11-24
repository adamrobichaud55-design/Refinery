// Plant 3: writes the piping register of every piped unit (DESIGN_BASIS.md §76, SW-REG-9).
//   vite-node tools/refinery-piping-register.ts      reads public/refinery/piping/unit-NN.json and writes public/refinery/registry/piping/unit-NN.json
//                                                     and docs/REFINERY-PIPING-REGISTER.md
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import type { PipingModel } from '../src/generator/piping';
import { unitPiping } from '../src/refinery/unitPiping';
import { pipingRegister, pipingRegisterDocument, serializeRegister } from '../src/refinery/pipingRegister';

const src = 'public/refinery/piping', dir = 'public/refinery/registry/piping'; mkdirSync(dir, { recursive: true }); mkdirSync('docs', { recursive: true });
const units = readdirSync(src).map(f => /^unit-(\d+)\.json$/.exec(f)?.[1]).filter((n): n is string => !!n).map(Number).sort((a, b) => a - b);
for (const f of readdirSync(dir)) if (!units.includes(Number(/^unit-(\d+)\.json$/.exec(f)?.[1]))) rmSync(`${dir}/${f}`);   // a unit no longer piped keeps no register
const rs = units.map(u => pipingRegister(unitPiping(u), JSON.parse(readFileSync(`${src}/unit-${u}.json`, 'utf8')) as PipingModel));
for (const r of rs) writeFileSync(`${dir}/unit-${r.unit}.json`, serializeRegister(r) + '\n');
writeFileSync('docs/REFINERY-PIPING-REGISTER.md', pipingRegisterDocument(rs) + '\n');
for (const r of rs) console.log(`unit ${r.unit}: ${r.totals.lines} lines, ${r.totals.components} components (${r.totals.byRegistration.pipe} pipe, ${r.totals.byRegistration.A} fittings, ${r.totals.byRegistration.B} flanges and blanks, ${r.totals.byRegistration.C} valves, ${r.totals.byRegistration.none} studs and gaskets), ${r.systems.length} piping systems, ${r.totals.fittingNumbers} fitting numbers, ${r.totals.welds} welds`);
console.log(`wrote ${dir}/unit-{${units.join(',')}}.json and docs/REFINERY-PIPING-REGISTER.md`);
