/**
 * Plant 3: the plot plan checked against the spacings and gradients written for it (DESIGN_BASIS.md §77, SW-SITE-3..6).
 * Each check gives what the rule asks and what the plot has, so the document can show the margin and a test can hold it.
 */
import { natural, shore, distRect, SITE, TIDE, type Rect } from './terrain';
import { BENCHES, PLOTS, DIKES, spheres, ROADS, FLARE, JETTY, bench, fenceLine, type Plot } from './site';

export interface Check { rule: string; what: string; asks: string; has: string; ok: boolean }
const gap = (a: Rect, b: Rect) => Math.hypot(Math.max(a.x0 - b.x1, b.x0 - a.x1, 0), Math.max(a.z0 - b.z1, b.z0 - a.z1, 0));
const inside = (a: Rect, b: Rect, m = 0) => a.x0 >= b.x0 + m && a.x1 <= b.x1 - m && a.z0 >= b.z0 + m && a.z1 <= b.z1 - m;
const f0 = (v: number) => Math.round(v).toLocaleString('en-US');

export function siteChecks(): Check[] {
  const out: Check[] = [], add = (rule: string, what: string, asks: string, has: number, ok: boolean, unit = 'ft') => out.push({ rule, what, asks, has: `${f0(has)} ${unit}`.trim(), ok });
  const least = <T>(xs: T[], f: (x: T) => number) => xs.reduce((a, x) => Math.min(a, f(x)), Infinity);
  const process = PLOTS.filter(p => p.unit >= 11 && p.unit <= 19 && (p.kind === 'unit' || p.kind === 'tower')), units = PLOTS.filter(p => p.kind === 'unit' || p.kind === 'tower'), buildings = PLOTS.filter(p => p.kind === 'building');
  const tanks = DIKES().flatMap(d => d.tanks), sph = spheres();
  // SW-SITE-3
  const pairs = <T>(xs: T[]) => xs.flatMap((a, i) => xs.slice(i + 1).map(b => [a, b] as const));
  add('SW-SITE-3', 'benches stand twice their difference in level apart (least margin)', 'at least 0 ft over', least(pairs(BENCHES), ([a, b]) => gap(a, b) - 2 * Math.abs(a.el - b.el)), pairs(BENCHES).every(([a, b]) => gap(a, b) >= 2 * Math.abs(a.el - b.el)));
  add('SW-SITE-3', 'every plot lies on its bench', 'all', PLOTS.filter(p => inside(p, bench(p.bench))).length, PLOTS.every(p => inside(p, bench(p.bench))), `of ${PLOTS.length}`);
  add('SW-SITE-3', 'every dike lies on its terrace, 40 ft inside its edge', 'all', DIKES().filter(d => inside(d, bench(d.bench), 40)).length, DIKES().every(d => inside(d, bench(d.bench), 40)), `of ${DIKES().length}`);
  // SW-SITE-4
  const ct = PLOTS.find(p => p.id === 'CT')!;
  add('SW-SITE-4', 'the cooling tower stands east (downwind) of every process unit', 'at least 100 ft', least(process.filter(p => p !== ct), p => ct.x0 - p.x1), process.every(p => p === ct || ct.x0 - p.x1 >= 100));
  add('SW-SITE-4', 'the tank terraces stand above the process bench (lower terrace)', 'above', bench('south').el - bench('process').el, bench('south').el > bench('process').el && bench('north').el > bench('south').el);
  add('SW-SITE-4', 'the liquefied gas bench lies below the tank terraces', 'below', bench('south').el - bench('lpg').el, bench('lpg').el < bench('south').el);
  add('SW-SITE-4', 'the wastewater bench lies below the process bench, so drains reach it by gravity', 'below', bench('process').el - bench('waste').el, bench('waste').el < bench('process').el);
  add('SW-SITE-4', 'the wastewater bench stands above the highest tide', `above ${TIDE} ft`, bench('waste').el, bench('waste').el > TIDE + 5, 'ft elevation');
  const flareTo = (r: Rect) => distRect(r, FLARE.x, FLARE.z);
  add('SW-SITE-4', 'flare to the nearest tank shell', 'at least 500 ft', least(tanks, t => Math.hypot(t.x - FLARE.x, t.z - FLARE.z) - t.D / 2), tanks.every(t => Math.hypot(t.x - FLARE.x, t.z - FLARE.z) - t.D / 2 >= FLARE.clear));
  add('SW-SITE-4', 'flare to the nearest unit or building', 'at least 500 ft', least([...units.filter(p => p.unit !== 25), ...buildings], flareTo), [...units.filter(p => p.unit !== 25), ...buildings].every(p => flareTo(p) >= FLARE.clear));
  add('SW-SITE-4', 'flare to the property line', 'at least 500 ft', Math.min(FLARE.x, FLARE.z, SITE.x1 - FLARE.x), Math.min(FLARE.x, FLARE.z, SITE.x1 - FLARE.x) >= FLARE.clear);
  const office = buildings.filter(b => !['B-CTRL', 'B-SUB'].includes(b.id)), ctrl = PLOTS.find(p => p.id === 'B-CTRL')!;
  add('SW-SITE-4', 'offices, laboratory, workshop, stores and fire station to the nearest process unit', 'at least 500 ft', least(office, b => least(process, u => gap(b, u))), office.every(b => process.every(u => gap(b, u) >= 500)));
  add('SW-SITE-4', 'control building to the nearest process unit', 'at least 250 ft', least(process, u => gap(ctrl, u)), process.every(u => gap(ctrl, u) >= 250));
  add('SW-SITE-4', 'buildings stand west (upwind) of every process unit', 'all', buildings.filter(b => process.every(u => b.x1 < u.x0)).length, buildings.every(b => process.every(u => b.x1 < u.x0)), `of ${buildings.length}`);
  const berth = natural((JETTY.platform.x0 + JETTY.platform.x1) / 2, JETTY.berthLine), off = JETTY.berthLine - shore((JETTY.platform.x0 + JETTY.platform.x1) / 2);
  add('SW-SITE-4', 'water at the berth at low tide', 'at least 60 ft', -berth - TIDE, -berth - TIDE >= 60);
  add('SW-SITE-4', 'the berth from the shore', 'at most 900 ft', off, off <= 900);
  // SW-SITE-5
  add('SW-SITE-5', 'process unit to process unit', 'at least 100 ft', least(pairs(process), ([a, b]) => gap(a, b)), pairs(process).every(([a, b]) => gap(a, b) >= 100));
  const shellGap = (a: { x: number; z: number; D: number }, b: { x: number; z: number; D: number }) => Math.hypot(a.x - b.x, a.z - b.z) - a.D / 2 - b.D / 2;
  add('SW-SITE-5', 'tank shell to tank shell, over what the rule asks (least margin)', 'half the larger diameter, 50 ft at least', least(pairs(tanks), ([a, b]) => shellGap(a, b) - Math.max(50, Math.max(a.D, b.D) / 2)), pairs(tanks).every(([a, b]) => shellGap(a, b) >= Math.max(50, Math.max(a.D, b.D) / 2) - 1e-6));
  add('SW-SITE-5', 'tank shell to the toe of its dike, over what the rule asks (least margin)', 'half its height, 15 ft at least', least(DIKES(), d => least(d.tanks, t => Math.min(t.x - t.D / 2 - d.x0, d.x1 - t.x - t.D / 2, t.z - t.D / 2 - d.z0, d.z1 - t.z - t.D / 2) - Math.max(15, t.H / 2))), DIKES().every(d => d.tanks.every(t => Math.min(t.x - t.D / 2 - d.x0, d.x1 - t.x - t.D / 2, t.z - t.D / 2 - d.z0, d.z1 - t.z - t.D / 2) >= Math.max(15, t.H / 2) - 1e-6)));
  add('SW-CIV-14', 'each dike holds 1.1 × its largest tank within a wall of 6 ft at most (highest wall)', 'at most 6 ft', Math.max(...DIKES().map(d => d.wall)), DIKES().every(d => d.wall <= 6 && d.holds >= d.needs));
  add('SW-SITE-5', 'dike to dike', 'at least 100 ft', least(pairs(DIKES()), ([a, b]) => gap(a, b)), pairs(DIKES()).every(([a, b]) => gap(a, b) >= 100));
  add('SW-SITE-5', 'tank shell to the nearest process unit', 'at least 250 ft', least(tanks, t => least(process, u => distRect(u, t.x, t.z) - t.D / 2)), tanks.every(t => process.every(u => distRect(u, t.x, t.z) - t.D / 2 >= 250)));
  const balls = sph.filter(s => !s.L), other: Rect[] = [...units, ...buildings];
  add('SW-SITE-5', 'sphere to sphere', 'one diameter', least(pairs(balls), ([a, b]) => shellGap(a, b) - Math.max(a.D, b.D)), pairs(balls).every(([a, b]) => shellGap(a, b) >= Math.max(a.D, b.D) - 1e-6), 'ft over');
  add('SW-SITE-5', 'spheres to the nearest tank, unit or building', 'at least 200 ft', least(balls, s => Math.min(least(tanks, t => Math.hypot(t.x - s.x, t.z - s.z) - t.D / 2 - s.D / 2), least(other, r => distRect(r, s.x, s.z) - s.D / 2))), balls.every(s => tanks.every(t => Math.hypot(t.x - s.x, t.z - s.z) - t.D / 2 - s.D / 2 >= 200) && other.every(r => distRect(r, s.x, s.z) - s.D / 2 >= 200)));
  const toLine = (x: number, z: number) => Math.min(x, z, SITE.x1 - x);
  add('SW-SITE-5', 'process units and tanks to the property line', 'at least 200 ft', Math.min(least(process, p => Math.min(toLine(p.x0, p.z0), toLine(p.x1, p.z0))), least(tanks, t => toLine(t.x, t.z) - t.D / 2), least(balls, s => toLine(s.x, s.z) - s.D / 2)), process.every(p => toLine(p.x0, p.z0) >= 200 && toLine(p.x1, p.z0) >= 200) && tanks.every(t => toLine(t.x, t.z) - t.D / 2 >= 200) && balls.every(s => toLine(s.x, s.z) - s.D / 2 >= 200));
  // SW-SITE-6
  let steep = 0; for (const r of ROADS) for (let i = 1; i < r.pts.length; i++) steep = Math.max(steep, Math.abs(r.el[i] - r.el[i - 1]) / Math.hypot(r.pts[i][0] - r.pts[i - 1][0], r.pts[i][1] - r.pts[i - 1][1]));
  add('SW-SITE-6', 'steepest road', 'at most 6 %', steep * 100, steep <= 0.06 + 1e-9, '%');
  const onRoads = (p: Plot) => ROADS.filter(r => r.pts.some((q, i) => i > 0 && segRect(r.pts[i - 1], q, p) <= 60)).length;
  add('SW-SITE-6', 'process units with a road on two sides or more', 'all', process.filter(p => onRoads(p) >= 2).length, process.every(p => onRoads(p) >= 2), `of ${process.length}`);
  const fence = fenceLine(); add('SW-SITE-6', 'fence inside the property line', '50 ft', Math.min(...fence.map(p => Math.min(p[0], p[1], SITE.x1 - p[0]))), fence.every(p => Math.min(p[0], p[1], SITE.x1 - p[0]) >= 50));
  return out;
}
/** least distance from a segment to a rectangle, by sampling the segment */
function segRect(a: [number, number], b: [number, number], r: Rect): number { let d = Infinity; for (let t = 0; t <= 1; t += 0.02) d = Math.min(d, distRect(r, a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]))); return d; }
