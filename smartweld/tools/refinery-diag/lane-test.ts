// Plant 3 diagnostic (read-only; writes nothing in the repository). See docs/REFINERY-HANDOFF.md. Run from smartweld/: npx vite-node tools/refinery-diag/lane-test.ts
// the generator's own test of a lane, replayed on a grid marked as it marks one (read-only): which cell of the static plant bars each point of the lane
//   RUN=<index> R=<pipe radius> Y=<lane y> Z=<lane z> X0= X1=  vite-node u17lane.ts
import { readFileSync, existsSync } from 'node:fs';
import { staticObstacles, type PipingModel } from '../../src/generator/piping';
import { Grid, H, STATIC } from '../../src/generator/router';
import { unitPiping } from '../../src/refinery/unitPiping';
import { runSolids, valveBoxFn } from '../../src/refinery/pipingReport';
import type { Placed } from '../../src/generator/building';
const dir = (process.env.REFINERY_DIAG ?? '/tmp/refinery-diag'), U = Number(process.env.UNIT ?? 17), up = unitPiping(U), K = process.env.LINE ? up.runs.findIndex(r => r.lines.some(n => n.endsWith(process.env.LINE!))) : Number(process.env.RUN ?? 0), vb = valveBoxFn(), prior: Placed[] = [];
for (let k = 0; k < K; k++) { const f = `${dir}/u${U}-run-${k}.json`; if (!existsSync(f)) { if (process.env.NOPRIOR) continue; throw new Error(`no kept run ${k}`); } const q = JSON.parse(readFileSync(f, 'utf8')) as { lines: string[]; model: PipingModel }; for (const b of runSolids(q.model, vb)) prior.push(Object.assign(b, { tags: [...b.tags, `run:${k}`] })); }
const plant = up.runPlant(K, prior), st = staticObstacles(plant.building().instances, plant.interior().instances, plant.verticalThroughPlatforms);
const g = new Grid(plant.grid.x0, 0, plant.grid.z0, plant.grid.x1, plant.grid.y1, plant.grid.z1);
const tagOf: string[] = [];
for (const o of st.obstacles) { if (o.kind === 'cap') g.markCapsule(o.a, o.b, Math.max(o.r, 1.5), STATIC, (H * Math.sqrt(3)) / 2); else g.markBox(o.mn, o.mx, STATIC); }
g.markBox([-1e6, -1e6, -1e6], [1e6, 0, 1e6], STATIC); g.computeDistance();
const r = Number(process.env.R ?? 6.4), y = Number(process.env.Y), z = Number(process.env.Z), x0 = Number(process.env.X0), x1 = Number(process.env.X1), clr = 3;
console.log(`run ${K} ${up.runs[K].lines[0]}; grid ${JSON.stringify(plant.grid)}; lane y ${y} z ${z} x ${x0}–${x1}, r ${r}`);
let bad = 0;
for (let x = x0; x <= x1; x += H) {
  const c = g.cellOf([x, y, z]); if (g.clear(c[0], c[1], c[2], r, [])) continue; bad++;
  const Rc = Math.ceil((r + clr + g.maxReach) / H); let why = '';
  for (let dk = -Rc; dk <= Rc && !why; dk++) for (let dj = -Rc; dj <= Rc && !why; dj++) for (let di = -Rc; di <= Rc && !why; di++) { if (!g.inside(c[0] + di, c[1] + dj, c[2] + dk)) continue; const q = g.idx(c[0] + di, c[1] + dj, c[2] + dk); if (g.occ[q] && Math.hypot(di, dj, dk) * H - g.reach[q] < r + clr) { const p = g.pos(c[0] + di, c[1] + dj, c[2] + dk); why = `cell at ${p} reach ${g.reach[q].toFixed(1)}`;
    const near = st.obstacles.filter(o => o.kind === 'box' ? [0, 1, 2].every(k => p[k] >= o.mn[k] - 3.01 && p[k] <= o.mx[k] + 3.01) : false).map(o => o.tag + (o.kind === 'box' ? ` box ${o.mn.map(v => Math.round(v))}…${o.mx.map(v => Math.round(v))}` : '')); why += ` ${near.slice(0, 2).join(' | ')}`; } }
  if (bad <= 6) console.log(`  x ${x}: barred by ${why}`);
}
console.log(`${bad} points barred`);
