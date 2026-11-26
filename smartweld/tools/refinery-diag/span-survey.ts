// Plant 3 diagnostic (read-only). For each unsupported stretch a unit's model lists, at each point where a support is wanted: steel above (a rod's way clear),
// floor within 10 ft below (a post's way clear), only a clear way to grade higher than that, or nothing. UNITS=11,17 vite-node tools/refinery-diag/span-survey.ts
import { readFileSync } from 'node:fs';
import { staticObstacles, type PipingModel, type Obstacle } from '../../src/generator/piping';
import * as K from '../../src/generator/pipingCheck';
import { unitPiping } from '../../src/refinery/unitPiping';
import { valveBoxFn } from '../../src/refinery/pipingReport';
import { pipeDims } from '../../src/catalogue';
type V = [number, number, number];
const vb = valveBoxFn(), tally: Record<string, number> = {};
for (const u of (process.env.UNITS ?? '11,12,13,14,15,16,17,18,19').split(',').map(Number)) {
  const up = unitPiping(u), m = JSON.parse(readFileSync(`public/refinery/piping/unit-${u}.json`, 'utf8')) as PipingModel, rk = up.plant.rack;
  const st = staticObstacles(up.plant.building().instances, up.plant.interior().instances, true).obstacles;
  const HANG = (tag: string) => !/equipment|pad|grout|ladder|guardrail|cage|rail|tread|stair|grating|cladding|door|slab|base-plate|anchor|weld|bolt|clip|column|keep-out/.test(tag);
  const members = st.filter((o): o is Extract<Obstacle, { kind: 'cap' }> => o.kind === 'cap' && HANG(o.tag) && Math.abs(o.b[1] - o.a[1]) < 0.5 * Math.hypot(o.b[0] - o.a[0], o.b[1] - o.a[1], o.b[2] - o.a[2]));
  const solids = [...st.filter(o => !/keep-out/.test(o.tag)), ...m.lines.flatMap(r => r.comps.filter(c => c.kind !== 'studs').flatMap(c => K.compShapes(c, vb).map(s => s.kind === 'box' ? { tag: r.no, kind: 'box' as const, mn: s.mn, mx: s.mx } : { tag: r.no, kind: 'cap' as const, a: s.a, b: s.b, r: s.r })))];
  const gap = (o: (typeof solids)[number], p: V, q: V, r: number) => o.kind === 'cap' ? K.segSeg(p, q, o.a, o.b) - o.r - r : K.segBox(p, q, o.mn, o.mx) - r;
  const floorAt = (p: V) => { let f = 0; for (const o of st) if (o.kind === 'box' && /pad|slab|pier/.test(o.tag) && p[0] > o.mn[0] && p[0] < o.mx[0] && p[2] > o.mn[2] && p[2] < o.mx[2] && o.mx[1] < p[1]) f = Math.max(f, o.mx[1]); return f; };
  for (const s of K.checkSupports(m, rk)) {
    const q = /^(\S+): unsupported span (\d+) in > (\d+) on run from (-?[\d.]+),(-?[\d.]+),(-?[\d.]+)/.exec(s); if (!q) { tally['other finding'] = (tally['other finding'] ?? 0) + 1; continue; }
    const r = m.lines.find(l => l.no === q[1])!, a: V = [+q[4], +q[5], +q[6]], rad = pipeDims(r.NPS, r.cls as never).OD / 2;
    const run = r.comps.filter(c => c.kind === 'pipe' || c.kind === 'tee').find(c => Math.hypot(c.a[0] - a[0], c.a[1] - a[1], c.a[2] - a[2]) < 1) ?? r.comps.find(c => c.kind === 'pipe')!;
    const d = [run.b[0] - run.a[0], 0, run.b[2] - run.a[2]], L = Math.hypot(d[0], d[2]) || 1, w = [d[0] / L, 0, d[2] / L];
    const at: V = [a[0] + w[0] * (+q[3]) * 0.9, a[1], a[2] + w[2] * (+q[3]) * 0.9], own = r.no;
    const steel = members.some(o => { const u2 = Math.max(0, Math.min(1, ((at[0] - o.a[0]) * (o.b[0] - o.a[0]) + (at[2] - o.a[2]) * (o.b[2] - o.a[2])) / ((o.b[0] - o.a[0]) ** 2 + (o.b[2] - o.a[2]) ** 2 || 1))), y = o.a[1] + (o.b[1] - o.a[1]) * u2, px = o.a[0] + (o.b[0] - o.a[0]) * u2, pz = o.a[2] + (o.b[2] - o.a[2]) * u2;
      if (Math.hypot(px - at[0], pz - at[2]) > o.r + 6 || y - o.r - at[1] < rad + 6 || y - at[1] > 240) return false; const top: V = [at[0], y - o.r, at[2]]; return solids.every(x => x.tag === own || x === o || gap(x, [at[0], at[1] + rad + 1, at[2]], top, 0.5) > 1); });
    const fl = floorAt(at), bottom = at[1] - rad - fl, way = solids.every(x => x.tag === own || gap(x, [at[0], fl + 1, at[2]], [at[0], at[1] - rad - 1, at[2]], Math.max(2, rad)) > 1);
    const k = steel ? 'steel above' : way && bottom <= 120 ? 'floor within 10 ft' : way ? `clear way to floor, ${Math.ceil(bottom / 120) * 10} ft` : 'nothing';
    tally[k] = (tally[k] ?? 0) + 1;
  }
  console.log(`unit ${u}`, JSON.stringify(tally));
}
