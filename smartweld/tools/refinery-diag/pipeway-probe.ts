// Plant 3 diagnostic (read-only). What stands within R of each leg of a path in a pipeway run's plant, the kept earlier runs included.
//   RUNS=<dir> RUN=<index, default the last> R=<in> PATHS="x,y,z;x,y,z|..." vite-node tools/refinery-diag/pipeway-probe.ts
import { readFileSync, existsSync } from 'node:fs';
import { worldBox, type PipingModel } from '../../src/generator/piping';
import { pipeway } from '../../src/refinery/pipeway';
import { runSolids, valveBoxFn } from '../../src/refinery/pipingReport';
import type { Placed } from '../../src/generator/building';
const dir = process.env.RUNS ?? '/tmp/pwruns', pw = pipeway() as any, vb = valveBoxFn(), K = Number(process.env.RUN ?? pw.runs.length - 1), R = Number(process.env.R ?? 10), prior: Placed[] = [];
for (let k = 0; k < K; k++) { const f = `${dir}/pipeway-run-${k}.json`; if (!existsSync(f)) throw new Error(`no kept run ${k}`); const q = JSON.parse(readFileSync(f, 'utf8')) as { lines: string[]; model: PipingModel }; for (const b of runSolids(q.model, vb)) prior.push(Object.assign(b, { tags: [...b.tags, `run:${k}:${q.lines[0]}`] })); }
const inst = pw.runPlant(K, prior).interior().instances, boxes = inst.map((q: Placed) => ({ q, b: worldBox(q.part, q.transform) })).filter((v: any) => v.b);
for (const spec of (process.env.PATHS ?? '').split('|').filter(Boolean)) {
  const pts = spec.split(';').map(s => s.split(',').map(Number)); console.log(`path ${spec} (R ${R})`);
  for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], c = pts[i + 1], lo = [0, 1, 2].map(k => Math.min(a[k], c[k]) - R), hi = [0, 1, 2].map(k => Math.max(a[k], c[k]) + R);
    const hit = boxes.filter((v: any) => [0, 1, 2].every(k => v.b[0][k] < hi[k] && v.b[1][k] > lo[k])); console.log(`  leg ${a} → ${c}: ${hit.length ? '' : 'clear'}`);
    for (const h of hit.slice(0, 10)) console.log(`     [${h.q.tags.join(', ')}] ${h.b[0].map((v: number) => Math.round(v))} … ${h.b[1].map((v: number) => Math.round(v))}`); }
}
