/** Plant 3, the coastal refinery: its ground and plot plan (DESIGN_BASIS.md §77). The natural ground is the written
 *  formula; benches are level at the mean of the ground under them with 2 : 1 slopes; the plot meets every spacing
 *  written for it; tanks stand in dikes that hold them; roads keep their grade; and the committed document and data
 *  are current. Nothing here touches plants 1 and 2. */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { natural, shore, meanGround, distRect, groundMeshes, grade, SITE, TIDE } from '../src/refinery/terrain';
import { BENCHES, PLOTS, DIKES, spheres, ROADS, PIPEWAYS, JETTY, FLARE, siteGround, bench, plot, PIPEWAY_Z, PIPEWAY_HALF } from '../src/refinery/site';
import { siteChecks } from '../src/refinery/siteChecks';
import { plotDocument, plotData, earthworks, IMAGES } from '../src/refinery/siteReport';
import { processModel } from '../src/refinery/process';
import { sizing } from '../src/refinery/sizing';

const basisDoc = readFileSync(new URL('../DESIGN_BASIS.md', import.meta.url), 'utf8');
const G = siteGround();

describe('plant 3: natural ground (SW-SITE-2)', () => {
  it('the shoreline has its headland and its cove', () => {
    expect(shore(2500)).toBe(3900); expect(shore(1200)).toBe(4320); expect(shore(3900)).toBe(3600); expect(shore(0)).toBe(3900);
    for (let x = 0; x <= SITE.x1; x += 50) { expect(Math.abs(natural(x, shore(x)))).toBeLessThan(1e-9); expect(natural(x, shore(x) - 100)).toBeGreaterThan(0); expect(natural(x, shore(x) + 100)).toBeLessThan(0); }
  });
  it('a rock bank, a plateau at 1.5 % and then 4.5 %, a hill, a ravine', () => {
    const flat = (x: number, d: number) => natural(x, shore(x) - d);
    expect(flat(2500, 60)).toBeGreaterThan(36); expect(flat(2500, 60)).toBeLessThan(40);                // 38 ft of bank
    expect(flat(3900, 60)).toBeLessThan(13);                                                            // 10 ft at the cove
    const slope = (d0: number, d1: number) => { let s = 0; for (const x of [1900, 2100, 2300, 2500, 2700]) s += (flat(x, d1) - flat(x, d0)) / (d1 - d0); return s / 5; };
    expect(slope(300, 1700)).toBeGreaterThan(0.012); expect(slope(300, 1700)).toBeLessThan(0.018);
    expect(slope(2200, 3400)).toBeGreaterThan(0.04); expect(slope(2200, 3400)).toBeLessThan(0.05);
    expect(natural(520, 520) - natural(1500, 520)).toBeGreaterThan(40);                                 // the hill stands above the ground east of it
    const xr = 4620 + 60 * Math.sin(2400 / 400); expect((natural(xr - 200, 2400) + natural(xr + 200, 2400)) / 2 - natural(xr, 2400)).toBeGreaterThan(15);   // the ravine is cut below the ground either side of it
  });
  it('the sea bed falls at 4 %, 9 % off the headland and 2 % in the cove', () => {
    const fall = (x: number) => -natural(x, shore(x) + 500) / 500;
    expect(fall(2500)).toBeCloseTo(0.04, 6); expect(fall(1200)).toBeCloseTo(0.09, 6); expect(fall(3900)).toBeCloseTo(0.02, 6);
    expect(TIDE).toBe(11);
  });
  it('is the same every time, and finite everywhere', () => {
    for (let x = 0; x <= SITE.x1; x += 250) for (let z = 0; z <= SITE.z1; z += 250) { const n = natural(x, z); expect(Number.isFinite(n)).toBe(true); expect(natural(x, z)).toBe(n); expect(n).toBeGreaterThan(-200); expect(n).toBeLessThan(260); }
  });
});

describe('plant 3: benches, roads and finished ground (SW-SITE-3, SW-SITE-6)', () => {
  it('each bench stands at the mean of the natural ground under it', () => {
    for (const b of BENCHES) { expect(b.el, b.id).toBe(meanGround(b)); expect(b.el, b.id).toBeGreaterThan(TIDE); }
    expect(bench('process').el).toBeGreaterThan(50); expect(bench('north').el).toBeGreaterThan(bench('south').el);
  });
  it('the finished ground is level on every bench and never steeper than 2 : 1 beside it', () => {
    for (const b of BENCHES) {
      for (let i = 0; i <= 6; i++) for (let j = 0; j <= 6; j++) expect(G.finished(b.x0 + ((b.x1 - b.x0) * i) / 6, b.z0 + ((b.z1 - b.z0) * j) / 6), b.id).toBeCloseTo(b.el, 9);
      for (const off of [5, 20, 40]) for (const [x, z] of [[b.x0 - off, (b.z0 + b.z1) / 2], [b.x1 + off, (b.z0 + b.z1) / 2], [(b.x0 + b.x1) / 2, b.z0 - off], [(b.x0 + b.x1) / 2, b.z1 + off]]) expect(Math.abs(G.finished(x, z) - b.el), `${b.id} ${off} ft out`).toBeLessThanOrEqual(off / 2 + 1e-9);
    }
  });
  it('away from benches and roads the finished ground is the natural ground', () => {
    for (const [x, z] of [[4700, 400], [4400, 1200], [2000, 3600], [300, 1100], [4500, 3500]]) expect(G.finished(x, z)).toBe(natural(x, z));
    const bare = grade([], []); expect(bare.finished(2000, 2500)).toBe(natural(2000, 2500)); expect(bare.cover(2000, 4500)).toBe('water'); expect(bare.cover(2000, 2500)).toBe('ground');
  });
  it('roads keep 6 % and start and end on the ground they join', () => {
    for (const r of ROADS) {
      expect(r.el.length, r.id).toBe(r.pts.length); expect([24, 20, 16]).toContain(r.width);
      for (let i = 1; i < r.pts.length; i++) expect(Math.abs(r.el[i] - r.el[i - 1]) / Math.hypot(r.pts[i][0] - r.pts[i - 1][0], r.pts[i][1] - r.pts[i - 1][1]), r.id).toBeLessThanOrEqual(0.06 + 1e-9);
      for (const k of [0, r.pts.length - 1]) { const [x, z] = r.pts[k], b = BENCHES.find(q => distRect(q, x, z) === 0); expect(r.el[k], `${r.id} end ${k}`).toBeCloseTo(b ? b.el : natural(x, z), 9); }
    }
    expect(ROADS.find(r => r.id === 'rampSouth')!.el).toEqual([bench('process').el, bench('south').el]);
  });
  it('earth cut about balances earth filled', () => {
    const E = earthworks(); expect(E.cut).toBeGreaterThan(200000); expect(E.fill).toBeGreaterThan(200000); expect(Math.abs(E.cut - E.fill) / (E.cut + E.fill)).toBeLessThan(0.25);
  });
  it('the ground meshes cover the site with sound triangles', () => {
    const pieces = groundMeshes(G, 100); let tris = 0;
    for (const p of pieces) { expect(p.mesh.positions.length % 3).toBe(0); for (const i of p.mesh.indices) expect(i).toBeLessThan(p.mesh.positions.length / 3); for (const v of p.mesh.positions) expect(Number.isFinite(v)).toBe(true); tris += p.mesh.indices.length / 3; }
    expect(pieces.some(p => p.cover === 'water')).toBe(true); expect(pieces.some(p => p.cover === 'bench')).toBe(true); expect(pieces.some(p => p.cover === 'road')).toBe(true); expect(tris).toBeGreaterThan(4000);
  });
});

describe('plant 3: plot plan (SW-SITE-4, SW-SITE-5, SW-SITE-7)', () => {
  it('meets every spacing and gradient written for it', () => {
    const checks = siteChecks(); expect(checks.length).toBeGreaterThanOrEqual(28);
    for (const c of checks) expect(c.ok, `${c.rule}: ${c.what} (asks ${c.asks}, has ${c.has})`).toBe(true);
  });
  it('every process unit has a plot at the main pipeway, and every other unit a place', () => {
    for (const no of [11, 12, 13, 14, 15, 16, 17, 18, 19]) { const p = PLOTS.find(q => q.unit === no && q.kind === 'unit')!; expect(p, `unit ${no}`).toBeTruthy(); expect(p.bench).toBe('process'); expect(p.faces === 'S' ? p.z1 : p.z0, `unit ${no}`).toBe(PIPEWAY_Z + (p.faces === 'S' ? -PIPEWAY_HALF : PIPEWAY_HALF)); }
    for (const sh of processModel().sheets) expect(PLOTS.some(p => p.unit === sh.no) || DIKES().some(d => d.unit === sh.no), `unit ${sh.no}`).toBe(true);
    expect(plot('U19').x0).toBeLessThan(plot('U11').x0); expect(plot('CT').x0).toBeGreaterThan(plot('U17').x1);          // utilities upwind, cooling tower downwind
    expect(Math.abs(plot('U11').x1 - plot('U12').x0)).toBe(100);                                                         // the crude and vacuum units side by side
  });
  it('every storage tank stands once in a dike that holds it, at the size its duty gave', () => {
    const Z = sizing(), placed = DIKES().flatMap(d => d.tanks), tags = placed.map(t => t.tag);
    expect(new Set(tags).size).toBe(tags.length);
    for (const unit of [20, 21]) for (const e of Z.get(unit)!.equip.values()) if (e.kind === 'tank') { const t = placed.find(k => k.tag === e.tag)!; expect(t, e.tag).toBeTruthy(); expect(t.D).toBe(e.d.Dft); expect(t.H).toBe(e.d.Hft); }
    for (const d of DIKES()) { expect(d.wall, d.id).toBeLessThanOrEqual(6); expect(d.wall, d.id).toBeGreaterThanOrEqual(1.5); expect(d.holds, d.id).toBeGreaterThanOrEqual(d.needs); }
    expect(spheres().map(s => s.tag)).toEqual(['S-2101', 'S-2102', 'S-2103', 'S-2104', 'S-2105']);
  });
  it('the berth is in deep water off the headland, and the pipeways reach every area', () => {
    const x = (JETTY.platform.x0 + JETTY.platform.x1) / 2; expect(-natural(x, JETTY.berthLine) - TIDE).toBeGreaterThanOrEqual(60); expect(JETTY.deck).toBeGreaterThan(TIDE + 15);
    expect(PIPEWAYS.find(p => p.id === 'main')!.pts.every(q => q[1] === PIPEWAY_Z)).toBe(true);
    const reach = (id: string, b: string) => PIPEWAYS.find(p => p.id === id)!.pts.some(q => distRect(bench(b), q[0], q[1]) < 30);
    expect(reach('tanks', 'north') && reach('tanks', 'south') && reach('jetty', 'jetty') && reach('lpg', 'lpg') && reach('waste', 'waste') && reach('truck', 'truck')).toBe(true);
    const fl = PIPEWAYS.find(p => p.id === 'flare')!.pts; expect(Math.hypot(fl[fl.length - 1][0] - FLARE.x, fl[fl.length - 1][1] - FLARE.z)).toBeLessThan(60);
  });
});

describe('plant 3: the site document, data and images', () => {
  it('docs/REFINERY-PLOT.md is what the code produces', () => {
    expect(readFileSync(new URL('../docs/REFINERY-PLOT.md', import.meta.url), 'utf8')).toBe(plotDocument() + '\n');
  });
  it('the data file is current and marked as a demonstration', () => {
    const D = JSON.parse(readFileSync(new URL('../public/refinery/site/plot.json', import.meta.url), 'utf8')), now = plotData();
    expect(D.demonstration).toBe(true); expect(D.benches.length).toBe(now.benches.length); expect(D.plots.length).toBe(now.plots.length); expect(D.dikes.length).toBe(now.dikes.length); expect(D.checks.every((c: { ok: boolean }) => c.ok)).toBe(true);
    expect(D.benches.map((b: { el: number }) => b.el)).toEqual(now.benches.map(b => b.el));
  });
  it('every image named in the document exists and is listed in the image index', () => {
    const index = readFileSync(new URL('../screenshots/INDEX.md', import.meta.url), 'utf8');
    for (const n of Object.keys(IMAGES)) { expect(existsSync(new URL(`../screenshots/refinery/${n}.png`, import.meta.url)), n).toBe(true); expect(index.includes('`refinery/' + n + '.png`'), n).toBe(true); }
  });
  it('every rule the site code cites is written in the design basis', () => {
    const defined = new Set([...basisDoc.matchAll(/`(SW-[A-Z]+-\d+[a-z]?)`/g)].map(m => m[1]));
    for (const f of ['src/refinery/terrain.ts', 'src/refinery/site.ts', 'src/refinery/siteChecks.ts', 'src/refinery/siteReport.ts', 'tools/refinery-site.ts']) for (const m of readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').matchAll(/SW-[A-Z]+-\d+[a-z]?/g)) expect(defined.has(m[0]), `${f} cites ${m[0]}`).toBe(true);
  });
});
