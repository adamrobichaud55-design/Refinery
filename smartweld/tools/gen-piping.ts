// Runs the stage-5 piping generator, reports stats, failures and the §40 checks; optionally writes the model as JSON
// (npm run gen:piping writes public/plant-piping.json, which the viewer loads).
import { writeFileSync } from 'node:fs';
import { generatePiping, partFromKey, staticPlant, serializePiping } from '../src/generator/piping';
import * as K from '../src/generator/pipingCheck';
import { buildGeometry } from '../src/geometry/partGeometry';
import type { Comp } from '../src/generator/piping';
import type { V3 } from '../src/generator/router';
const t0 = Date.now();
const m = generatePiping();
console.log('time', ((Date.now() - t0) / 1000).toFixed(1), 's');
console.log(m.stats);
console.log('failures', m.failures.length); for (const f of m.failures) console.log('  ', f);
const vb = valveBoxFn();
const report = (name: string, v: string[]) => { console.log(`${name}: ${v.length}`); for (const s of v.slice(0, 12)) console.log('   ', s); };
report('continuity', K.checkContinuity(m));
report('joints', K.checkJoints(m));
report('elbows/straights', K.checkElbowsAndStraights(m));
report('numbering/valves', K.checkNumberingAndValves(m));
const c = K.checkLineClearance(m, vb); console.log('line clearance: pairs', c.pairs, 'min', c.min.toFixed(2)); report('  violations', c.violations);
report('static clearance', K.checkStaticClearance(m, staticPlant(), vb));
report('supports', K.checkSupports(m));
if (process.argv[2]) { writeFileSync(process.argv[2], serializePiping(m)); console.log('wrote', process.argv[2]); }

function valveBoxFn() {
  const cache = new Map<string, [V3, V3]>();
  return (c: Comp): [V3, V3] => {
    let b = cache.get(c.key);
    if (!b) { const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity]; for (const s of buildGeometry(partFromKey(c.key)).solids) for (let i = 0; i < s.mesh.positions.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], s.mesh.positions[i + a]); mx[a] = Math.max(mx[a], s.mesh.positions[i + a]); } b = [mn, mx]; cache.set(c.key, b); }
    const T = c.T, mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity];
    for (let k = 0; k < 8; k++) { const p = [k & 1 ? b[1][0] : b[0][0], k & 2 ? b[1][1] : b[0][1], k & 4 ? b[1][2] : b[0][2]]; const q = [T[0] * p[0] + T[4] * p[1] + T[8] * p[2] + T[12], T[1] * p[0] + T[5] * p[1] + T[9] * p[2] + T[13], T[2] * p[0] + T[6] * p[1] + T[10] * p[2] + T[14]]; for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], q[a]); mx[a] = Math.max(mx[a], q[a]); } }
    return [mn, mx];
  };
}
