// Plant 3 diagnostic (read-only; writes nothing in the repository). See docs/REFINERY-HANDOFF.md. Run from smartweld/: npx vite-node tools/refinery-diag/one-run.ts
// one run of the cracking unit's piping, with the runs before it taken from where they were kept (or made and kept): for finding what stops a line (read-only: nothing of the repository is written)
//   RUN=<index from 0> [WHOLE=1] vite-node u17run.ts
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { generatePiping, serializePiping, type PipingModel } from '../../src/generator/piping';
import { unitPiping } from '../../src/refinery/unitPiping';
import { runSolids, valveBoxFn } from '../../src/refinery/pipingReport';
import type { Placed } from '../../src/generator/building';
const dir = (process.env.REFINERY_DIAG ?? '/tmp/refinery-diag'), U = Number(process.env.UNIT ?? 17), K = Number(process.env.RUN ?? 0), up = unitPiping(U), vb = valveBoxFn(), prior: Placed[] = [];
mkdirSync(dir, { recursive: true });
console.log(`unit ${U}: ${up.runs.length} runs; run ${K}: ${up.runs[K].kind} ${up.runs[K].lines.join(', ')}${up.runs[K].lane ? ` lane tier ${up.runs[K].lane!.t + 1} z ${up.runs[K].lane!.z} x ${up.runs[K].lane!.x0}–${up.runs[K].lane!.x1}` : ''}`);
for (let k = 0; k <= K; k++) {
  const run = up.runs[k], f = `${dir}/u${U}-run-${k}.json`, mine = new Set(run.lines), t0 = Date.now();
  let m: PipingModel | undefined;
  if (k < K && existsSync(f)) { const q = JSON.parse(readFileSync(f, 'utf8')) as { lines: string[]; model: PipingModel }; if (JSON.stringify(q.lines) === JSON.stringify(run.lines)) m = q.model; }
  if (!m) { m = generatePiping({ plant: up.runPlant(k, prior, k === K && process.env.CLOSE ? 'close' : k === K && !!process.env.WHOLE), only: l => mine.has(l.no) }); if (k < K) writeFileSync(f, `{"lines":${JSON.stringify(run.lines)},"model":${serializePiping(m)}}`); console.log(`run ${k} (${run.lines[0]}): ${m.lines.filter(l => l.ok && l.kind === 'routed').length} routed, ${m.failures.length} failures, ${((Date.now() - t0) / 1000).toFixed(0)} s`); for (const x of m.failures) console.log('   ', x); }
  if (k === K) for (const r of m.lines) if (mine.has(r.no)) console.log(`   ${r.no}: ok ${r.ok}; path ${JSON.stringify(r.path.map(p => p.map(v => Math.round(v))))}`);
  for (const b of runSolids(m, vb)) prior.push(b);
}
