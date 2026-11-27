/**
 * Plant 3: the whole plant in the site frame (DESIGN_BASIS.md §77, §78). Each unit, built level in its own frame
 * (SW-CELL-1), is set on its plot by a quarter turn, a shift and its bench's elevation (SW-SITE-1); tanks, spheres and
 * the other offsite items are placed where the plot plan puts them. Inches: x east, y up, z south.
 */
import { makeConeRoofTank, makeFloatingRoofTank, makeDike, makeSphere, makeHorizontalVessel, makeFlareStack, type PartSpec } from '../catalogue';
import { multiply, translate, standUp, rotateY, frameFromAxes } from '../geometry/transform';
import type { Mat4 } from '../geometry/mesh';
import { readFileSync, existsSync } from 'node:fs';
import { buildCell, bare, relaySeams, type CellModel, type SeamOpening } from './cell';
import { PLOTS, DIKES, spheres, bench, plot, FLARE, type Plot } from './site';
import { processModel } from './process';
import { sizing } from './sizing';

type V3 = [number, number, number];
export interface SitePart { part: PartSpec; transform: Mat4; tags: string[]; unit: number }
/** SW-CELL-1: the transform that sets a unit's frame on its plot: its battery limit on the plot's pipeway edge, its width centred to the nearest 6 in (the main pipeway's grid, §80) */
export function cellToSite(p: Plot, c: CellModel): Mat4 {
  const el = bench(p.bench).el * 12, mid = Math.round((c.z0 + c.z1) / 2 / 6) * 6, cx = ((p.x0 + p.x1) / 2) * 12;
  return p.faces === 'N' ? multiply(translate(cx + mid, el, p.z0 * 12), rotateY(-Math.PI / 2)) : multiply(translate(cx - mid, el, p.z1 * 12), rotateY(Math.PI / 2));
}
/** the room along a unit's rack: its plot's length, in */
export const plotLength = (p: Plot) => (p.z1 - p.z0) * 12;
/** the cells of the process bench: the nine process units, and the cooling tower's group on its own plot */
export function cells(): { plot: Plot; cell: CellModel }[] {
  const out = [11, 12, 13, 14, 15, 16, 17, 18, 19].map(u => { const p = PLOTS.find(q => q.unit === u && q.kind === 'unit')!, cell = buildCell(u, plotLength(p), u === 19 ? 'rest' : 'all');
    // SW-DET-6 (amended 2026-11-27): the shells' seams laid clear of the connections the unit's stored piping has on them
    const op = storedOpenings(u); if (op.length) cell.interior = { ...cell.interior, instances: relaySeams(cell.interior.instances, op) };
    return { plot: p, cell }; });
  const ct = plot('CT'); out.push({ plot: { ...ct, faces: 'S' }, cell: buildCell(19, plotLength(ct), 'tower') });
  return out;
}

/** the connections of a unit's stored piping model, as its shells' seams need them (each neck's end, axis and size); none where no model is stored */
function storedOpenings(u: number): SeamOpening[] {
  try {
    const dir = (process.env.MODELS ?? process.env.PIPING_DIR ?? new URL('../../public/refinery/piping/', import.meta.url).pathname).replace(/\/$/, ''), f = `${dir}/unit-${u}.json`;
    if (!existsSync(f)) return [];
    const m = JSON.parse(readFileSync(f, 'utf8')) as { nozzles?: { equip: string; face: V3; u: V3; NPS: number; cls: string; comps?: { a: V3; b: V3 }[] }[] };
    return (m.nozzles ?? []).map(n => { const d = (p: V3) => -((p[0] - n.face[0]) * n.u[0] + (p[1] - n.face[1]) * n.u[1] + (p[2] - n.face[2]) * n.u[2]), ends = (n.comps ?? []).flatMap(c => [c.a, c.b]);
      const far = ends.reduce((a, e) => (d(e) > d(a) ? e : a), n.face); return { equip: n.equip, A: far, u: n.u, NPS: n.NPS, cls: n.cls as SeamOpening['cls'] }; });
  } catch { return []; }   // no file system (a browser): the seams as drawn
}

let cache: SitePart[] | undefined;
export function siteParts(): SitePart[] {
  if (cache) return cache;
  const out: SitePart[] = [], Z = sizing(), M = processModel();
  for (const { plot: p, cell } of cells()) { const T = cellToSite(p, cell); for (const i of cell.interior.instances) out.push({ part: i.part, transform: multiply(T, i.transform), tags: i.tags, unit: p.unit }); }
  // tanks in their dikes (SW-SITE-5, SW-CIV-14): the dike's inner plan with its wall, each tank on the terrace
  for (const d of DIKES()) {
    const el = bench(d.bench).el * 12, sheet = M.sheet(d.unit);
    out.push({ part: makeDike(`dike-${d.id}`, { planL: (d.x1 - d.x0) * 12, planW: (d.z1 - d.z0) * 12, tanks: d.tanks.map(t => ({ D: t.D * 12, H: t.H * 12 })) }), transform: multiply(translate(d.x0 * 12, el - 12, d.z1 * 12), standUp()), tags: [`dike-${d.id}`, 'dike'], unit: d.unit });
    for (const t of d.tanks) { const floating = sheet.equip.get(t.tag)!.p.roof === 'floating', part = bare((floating ? makeFloatingRoofTank : makeConeRoofTank)({ tag: t.tag, D: t.D * 12, H: t.H * 12 })); out.push({ part, transform: multiply(translate(t.x * 12, el, t.z * 12), standUp()), tags: [t.tag, 'equipment'], unit: d.unit }); }
  }
  // liquefied gas: spheres on their columns, bullets on saddles
  for (const s of spheres()) {
    const el = bench('lpg').el * 12, e = Z.get(21)!.equip.get(s.tag)!;
    if (s.L) out.push({ part: makeHorizontalVessel({ tag: s.tag, ID: e.d.D, t: e.d.t, TT: e.d.L, centreline: e.d.D / 2 + 30 }), transform: frameFromAxes([(s.x - s.L / 2) * 12, el + e.d.D / 2 + 36, s.z * 12], [0, 1, 0], [1, 0, 0]), tags: [s.tag, 'equipment'], unit: 21 });
    else out.push({ part: bare(makeSphere({ tag: s.tag, D: s.D * 12, t: e.d.t })), transform: multiply(translate(s.x * 12, el, s.z * 12), standUp()), tags: [s.tag, 'equipment'], unit: 21 });
  }
  // the flare, in its derrick
  out.push({ part: bare(makeFlareStack({ tag: 'X-2501', D: 36, H: 2640, derrick: true })), transform: multiply(translate(FLARE.x * 12, bench('flare').el * 12, FLARE.z * 12), standUp()), tags: ['X-2501', 'equipment'], unit: 25 });
  cache = out; return out;
}
