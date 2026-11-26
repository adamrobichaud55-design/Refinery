// Plant 3 diagnostic (read-only; writes nothing in the repository). See docs/REFINERY-HANDOFF.md.
// The main pipeway's last run made alone on top of the runs kept by `REFINERY_RUNS=<dir> vite-node tools/refinery-pipeway.ts`,
// with SW-RPI-16 and the first-bent supports applied, and what it reports: failures, clearances, spans, branches out over the top tier.
//   RUNS=<dir> [LINES=10617,10626] vite-node tools/refinery-diag/pipeway-rest.ts
import { readFileSync, existsSync } from 'node:fs';
import { generatePiping, type PipingModel } from '../../src/generator/piping';
import * as K from '../../src/generator/pipingCheck';
import { pipeway, PWY } from '../../src/refinery/pipeway';
import { runSolids, valveBoxFn } from '../../src/refinery/pipingReport';
import { supportsAtFirstBents } from '../../src/refinery/pipewayReport';
import type { Placed } from '../../src/generator/building';
const dir = process.env.RUNS ?? '/tmp/pwruns', pw = pipeway() as any, vb = valveBoxFn(), prior: Placed[] = [], models: PipingModel[] = [];
const K0 = pw.runs.length - 1;
for (let k = 0; k < K0; k++) { const f = `${dir}/pipeway-run-${k}.json`; if (!existsSync(f)) throw new Error(`no kept run ${k}`); const q = JSON.parse(readFileSync(f, 'utf8')) as { model: PipingModel }; models.push(q.model); for (const b of runSolids(q.model, vb)) prior.push(b); }
const t0 = Date.now(), mine = new Set(pw.runs[K0].lines), m = generatePiping({ plant: pw.runPlant(K0, prior), only: (l: { no: string }) => mine.has(l.no) });
console.log(`last run: ${m.lines.filter(l => l.ok).length} of ${m.lines.length} lines in ${((Date.now() - t0) / 1000).toFixed(0)} s; failures`, m.failures);
const all: PipingModel = { ...m, lines: [...models.flatMap(q => q.lines), ...m.lines] };
const set = supportsAtFirstBents(all, pw); console.log('first-bent supports', set.shoes, set.posts, set.hangers);
console.log('clearance', [...new Set(K.checkLineClearance(all, vb).violations)].slice(0, 10));
console.log('spans', K.checkSupports(all, pw.plant.rack).slice(0, 10));
const y0 = PWY.tiers[PWY.tiers.length - 1];
for (const l of m.lines) if (/-106\d\d$/.test(l.no) && l.path.some(p => Math.abs(p[2]) > PWY.half && p[1] >= y0 - 18)) console.log('out over the top tier:', l.no, JSON.stringify(l.path.map(p => p.map(v => Math.round(v)))));
for (const w of (process.env.LINES ?? '').split(',').filter(Boolean)) for (const l of all.lines) if (l.no.endsWith(w)) console.log(l.no, l.ok, JSON.stringify(l.path.map(p => p.map(v => Math.round(v)))), l.supports.map(s => `${s.type}@${s.at.map(v => Math.round(v))}`).join(' '));
