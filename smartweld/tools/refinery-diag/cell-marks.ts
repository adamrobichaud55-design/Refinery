// Plant 3 diagnostic (read-only; writes nothing in the repository). See docs/REFINERY-HANDOFF.md. Run from smartweld/: npx vite-node tools/refinery-diag/cell-marks.ts
// which static members and solids mark a given grid cell of a run's plant, as the generator marks it (read-only):  RUN= AT=x,y,z
import { staticObstacles } from '../../src/generator/piping';
import { unitPiping } from '../../src/refinery/unitPiping';
const U = Number(process.env.UNIT ?? 17), up = unitPiping(U), K = Number(process.env.RUN ?? 0), P = (process.env.AT ?? '0,0,0').split(',').map(Number);
const plant = up.runPlant(K, []), st = staticObstacles(plant.building().instances, plant.interior().instances, plant.verticalThroughPlatforms);
const dSeg = (a: number[], b: number[], p: number[]) => { const ab = [0, 1, 2].map(k => b[k] - a[k]), L2 = ab.reduce((s, v) => s + v * v, 0), t = L2 ? Math.max(0, Math.min(1, [0, 1, 2].reduce((s, k) => s + (p[k] - a[k]) * ab[k], 0) / L2)) : 0; return Math.hypot(...[0, 1, 2].map(k => p[k] - a[k] - t * ab[k])); };
for (const o of st.obstacles) {
  if (o.kind === 'cap') { const r = Math.max(o.r, 1.5), d = dSeg(o.a, o.b, P); if (d <= r + 5.2) console.log(`member [${o.tag}] r ${o.r.toFixed(2)} axis ${o.a.map(v => Math.round(v))} → ${o.b.map(v => Math.round(v))}: ${d.toFixed(2)} in from the cell, reach ${(r - d).toFixed(2)}`); }
  else if ([0, 1, 2].every(k => P[k] >= o.mn[k] - 3.001 && P[k] <= o.mx[k] + 3.001)) console.log(`box [${o.tag}] ${o.mn.map(v => v.toFixed(1))} … ${o.mx.map(v => v.toFixed(1))}`);
}
