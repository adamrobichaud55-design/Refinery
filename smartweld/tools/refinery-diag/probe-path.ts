// Plant 3 diagnostic (read-only; writes nothing in the repository). See docs/REFINERY-HANDOFF.md. Run from smartweld/: npx vite-node tools/refinery-diag/probe-path.ts
// what bars a polyline in a run's plant, by the generator's own static data: obstacles within r + 3 in of it, headroom over gratings and treads, the band over each rack tier (read-only)
//   RUN=<index> R=<pipe radius> PATHS="x,y,z;x,y,z|..." vite-node u17probe2.ts
import { readFileSync, existsSync } from 'node:fs';
import { staticObstacles, type PipingModel } from '../../src/generator/piping';
import { unitPiping } from '../../src/refinery/unitPiping';
import { runSolids, valveBoxFn } from '../../src/refinery/pipingReport';
import type { Placed } from '../../src/generator/building';
const dir = (process.env.REFINERY_DIAG ?? '/tmp/refinery-diag'), U = Number(process.env.UNIT ?? 17), K = Number(process.env.RUN ?? 0), R = Number(process.env.R ?? 7), up = unitPiping(U), vb = valveBoxFn(), prior: Placed[] = [];
for (let k = 0; k < K; k++) { const f = `${dir}/u${U}-run-${k}.json`; if (!existsSync(f)) throw new Error(`no kept run ${k}`); const q = JSON.parse(readFileSync(f, 'utf8')) as { lines: string[]; model: PipingModel }; for (const b of runSolids(q.model, vb)) prior.push(Object.assign(b, { tags: [...b.tags, `run:${k}`] })); }
const plant = up.runPlant(K, prior), st = staticObstacles(plant.building().instances, plant.interior().instances, plant.verticalThroughPlatforms), rk = plant.rack;
console.log(`run ${K} ${up.runs[K].lines[0]}: ${st.obstacles.length} obstacles, ${st.headroom.length} headroom zones, ${st.gratings.length} gratings; through platforms ${plant.verticalThroughPlatforms}; rack x ${rk.x0}–${rk.x1} half ${rk.halfWidth} tiers ${rk.tiers}; grid ${JSON.stringify(plant.grid)}`);
type V = number[];
const dSegPt = (a: V, b: V, p: V) => { const ab = [0, 1, 2].map(k => b[k] - a[k]), L2 = ab.reduce((s, v) => s + v * v, 0), t = L2 ? Math.max(0, Math.min(1, [0, 1, 2].reduce((s, k) => s + (p[k] - a[k]) * ab[k], 0) / L2)) : 0; return Math.hypot(...[0, 1, 2].map(k => p[k] - a[k] - t * ab[k])); };
const dBoxPt = (mn: V, mx: V, p: V) => Math.hypot(...[0, 1, 2].map(k => Math.max(mn[k] - p[k], p[k] - mx[k], 0)));
const inBox = (b: [V, V], p: V) => [0, 1, 2].every(k => p[k] >= b[0][k] - 1e-6 && p[k] <= b[1][k] + 1e-6);
for (const spec of (process.env.PATHS ?? '').split('|').filter(Boolean)) {
  const pts = spec.split(';').map(s => s.split(',').map(Number));
  console.log(`path ${spec} (r ${R})`);
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], c = pts[i + 1], L = Math.hypot(...[0, 1, 2].map(k => c[k] - a[k])), n = Math.max(1, Math.round(L / 6)), vertical = a[0] === c[0] && a[2] === c[2];
    const bars = new Map<string, string>();
    for (let s = 0; s <= n; s++) {
      const p = [0, 1, 2].map(k => a[k] + ((c[k] - a[k]) * s) / n);
      for (const o of st.obstacles) { const d = o.kind === 'cap' ? dSegPt(o.a, o.b, p) - o.r : dBoxPt(o.mn, o.mx, p); if (d < R + 3 - 1e-6 && !bars.has(o.tag)) bars.set(o.tag, `${d.toFixed(1)} in from [${o.tag}] at ${p.map(v => Math.round(v))}${o.kind === 'box' ? ` box ${o.mn.map(v => Math.round(v))} … ${o.mx.map(v => Math.round(v))}` : ` member ${o.a.map(v => Math.round(v))} → ${o.b.map(v => Math.round(v))} r ${o.r.toFixed(1)}`}`); }
      if (!vertical || !plant.verticalThroughPlatforms) for (const h of st.headroom) if (inBox(h as [V, V], p) && !bars.has('headroom')) bars.set('headroom', `headroom over a grating or tread at ${p.map(v => Math.round(v))}: zone ${h[0].map(v => Math.round(v))} … ${h[1].map(v => Math.round(v))}`);
      if (!vertical) for (const g of st.gratings) if (inBox([[g.box[0][0], g.box[0][1] - 1, g.box[0][2]], [g.box[1][0], g.box[1][1] + 1, g.box[1][2]]], p) && !bars.has('grating')) bars.set('grating', `a grating panel at ${p.map(v => Math.round(v))} [${g.tag}]`);
      for (const t of rk.tiers) if (p[0] >= rk.x0 - 12 && p[0] <= rk.x1 + 12 && Math.abs(p[2]) <= rk.halfWidth && p[1] >= t && p[1] <= t + 24 && !bars.has(`tier ${t}`)) bars.set(`tier ${t}`, `the band over tier ${t} at ${p.map(v => Math.round(v))} (barred beyond 72 in in plan of the line's end points)`);
      if (p[1] < 96 && !bars.has('floor')) bars.set('floor', `floor headroom at ${p.map(v => Math.round(v))}`);
    }
    console.log(`  leg ${a} → ${c}: ${bars.size ? '' : 'clear'}`); for (const v of [...bars.values()].slice(0, 10)) console.log(`     ${v}`);
  }
}
