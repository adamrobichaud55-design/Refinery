// Re-runs the §40 checks on a saved model (JSON) without regenerating; prints every violation of the named check.
import { readFileSync } from 'node:fs';
import * as K from '../src/generator/pipingCheck';
import { partFromKey, staticPlant, worldBox } from '../src/generator/piping';
import type { PipingModel, Comp } from '../src/generator/piping';
const m = JSON.parse(readFileSync(process.argv[2], 'utf8')) as PipingModel, which = process.argv[3] ?? 'all', lim = Number(process.argv[4] ?? 40);
const vb = (c: Comp) => worldBox(partFromKey(c.key), c.T)!;
const show = (n: string, v: string[]) => { if (which !== 'all' && which !== n) return; console.log(`${n}: ${v.length}`); for (const s of v.slice(0, lim)) console.log('   ', s); };
show('continuity', K.checkContinuity(m)); show('joints', K.checkJoints(m)); show('elbows', K.checkElbowsAndStraights(m)); show('numbering', K.checkNumberingAndValves(m));
if (which === 'all' || which === 'lines') { const c = K.checkLineClearance(m, vb); show('lines', c.violations); }
if (which === 'all' || which === 'static') show('static', K.checkStaticClearance(m, staticPlant(), vb));
show('supports', K.checkSupports(m));
