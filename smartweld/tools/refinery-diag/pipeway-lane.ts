// Plant 3 diagnostic (read-only; writes nothing in the repository). See docs/REFINERY-HANDOFF.md.
// The generator's own lane test replayed on the main pipeway's grid for a run, with the earlier runs kept by
// `REFINERY_RUNS=<dir> vite-node tools/refinery-pipeway.ts` standing as solids; names the cell that bars each point.
//   RUNS=<dir> LINE=10034 [R=] [Y=] [Z=] vite-node tools/refinery-diag/pipeway-lane.ts
import { readFileSync, existsSync } from 'node:fs';
import { staticObstacles, type PipingModel } from '../../src/generator/piping';
import { Grid, H, STATIC } from '../../src/generator/router';
import { pipeway } from '../../src/refinery/pipeway';
import { runSolids, valveBoxFn } from '../../src/refinery/pipingReport';
import { pipeDims } from '../../src/catalogue';
import type { Placed } from '../../src/generator/building';
const dir = process.env.RUNS ?? '/tmp/pwruns', pw = pipeway() as any, vb = valveBoxFn(), prior: Placed[] = [];
const K = pw.runs.findIndex((r: { lines: string[] }) => r.lines.some(n => n.endsWith(process.env.LINE ?? '')));
const run = pw.runs[K], L = pw.lines.find((l: { def: { no: string } }) => l.def.no === run.lines[0]);
for (let k = 0; k < K; k++) { const f = `${dir}/pipeway-run-${k}.json`; if (!existsSync(f)) throw new Error(`no kept run ${k}`); const q = JSON.parse(readFileSync(f, 'utf8')) as { model: PipingModel }; for (const b of runSolids(q.model, vb)) prior.push(Object.assign(b, { tags: [...b.tags, `run:${k}`] })); }
const plant = pw.runPlant(K, prior), st = staticObstacles(plant.building().instances, plant.interior().instances, plant.verticalThroughPlatforms);
const g = new Grid(plant.grid.x0, 0, plant.grid.z0, plant.grid.x1, plant.grid.y1, plant.grid.z1);
for (const o of st.obstacles) { if (o.kind === 'cap') g.markCapsule(o.a, o.b, Math.max(o.r, 1.5), STATIC, (H * Math.sqrt(3)) / 2); else g.markBox(o.mn, o.mx, STATIC); }
g.markBox([-1e6, -1e6, -1e6], [1e6, 0, 1e6], STATIC); g.computeDistance();
const r = Number(process.env.R ?? pipeDims(L.def.NPS, L.def.cls).OD / 2), lane = run.lane, y = Number(process.env.Y ?? Math.ceil((plant.rack.tiers[0] + 4 + 2 * r / 2) / 6 - 1e-9) * 6), z = Number(process.env.Z ?? lane.z);
console.log(`run ${K} ${run.lines.join(', ')}; lane ${JSON.stringify(lane)}; tiers ${plant.rack.tiers}; y ${y} z ${z} r ${r}; grid ${JSON.stringify(plant.grid)}`);
let bad = 0;
for (let x = lane.x0 + 36; x <= lane.x1 - 36; x += H) {
  const c = g.cellOf([x, y, z]); if (g.clear(c[0], c[1], c[2], r, [])) continue; bad++;
  const Rc = Math.ceil((r + 3 + g.maxReach) / H); let why = '';
  for (let dk = -Rc; dk <= Rc && !why; dk++) for (let dj = -Rc; dj <= Rc && !why; dj++) for (let di = -Rc; di <= Rc && !why; di++) { if (!g.inside(c[0] + di, c[1] + dj, c[2] + dk)) continue; const q = g.idx(c[0] + di, c[1] + dj, c[2] + dk); if (g.occ[q] && Math.hypot(di, dj, dk) * H - g.reach[q] < r + 3) { const p = g.pos(c[0] + di, c[1] + dj, c[2] + dk); why = `cell at ${p} reach ${g.reach[q].toFixed(1)}`;
    const nearB = st.obstacles.filter(o => o.kind === 'box' ? [0, 1, 2].every(kk => p[kk] >= o.mn[kk] - 3.01 && p[kk] <= o.mx[kk] + 3.01) : false).map(o => `${o.tag} ${(o as any).mn.map((v: number) => Math.round(v))}…${(o as any).mx.map((v: number) => Math.round(v))}`); why += ` ${nearB.slice(0, 2).join(' | ')}`; } }
  if (bad <= 8) console.log(`  x ${x}: barred by ${why}`);
}
console.log(`${bad} points barred`);
