/**
 * Plant 3's ground (DESIGN_BASIS.md §77, SW-SITE-1..3, SW-SITE-6): the natural ground as a formula, and the finished
 * ground once benches and roads are graded into it. Feet, site frame: x east, z south, elevation above mean sea level.
 * Invented; drawn after no real place (PROVENANCE P-79).
 */
import type { MeshData } from '../geometry/mesh';

/** SW-SITE-1: the site's extent, ft; SW-SITE-2: the tide either side of mean sea level, ft */
export const SITE = { x1: 5000, z1: 5400 } as const, TIDE = 11;
const bell = (t: number) => (Math.abs(t) >= 1 ? 0 : (1 - t * t) ** 2), smooth = (t: number) => { const u = Math.min(1, Math.max(0, t)); return u * u * (3 - 2 * u); };
const headland = (x: number) => bell((x - 1200) / 750), cove = (x: number) => bell((x - 3900) / 650);

/** SW-SITE-2: the shoreline, z at mean sea level */
export const shore = (x: number) => 3900 + 420 * headland(x) - 300 * cove(x);
/** SW-SITE-2: natural ground, ft above mean sea level (negative under water) */
export function natural(x: number, z: number): number {
  const d = shore(x) - z;
  if (d <= 0) return d * (0.04 + 0.05 * headland(x) - 0.02 * cove(x));                                   // the sea bed
  const bank = (38 - 28 * cove(x)) * smooth(d / 60), plateau = 0.015 * Math.min(Math.max(d - 60, 0), 1900) + 0.045 * Math.max(d - 1960, 0);
  const hill = 60 * bell(Math.hypot(x - 520, z - 520) / 700);
  const ravine = (10 + 18 * Math.min(1, Math.max(0, (z - 800) / 2400))) * bell((x - (4620 + 60 * Math.sin(z / 400))) / 130) * smooth(d / 200);
  const waves = (2.5 * Math.sin(x / 310 + 1.3) * Math.sin(z / 270 + 0.4) + 1.5 * Math.sin(x / 130 + z / 170)) * smooth((d - 60) / 200);
  return bank + plateau + hill - ravine + waves;
}

export interface Rect { x0: number; x1: number; z0: number; z1: number }
/** a level bench: its rectangle and elevation (SW-SITE-3) */
export interface Bench extends Rect { id: string; name: string; el: number }
/** a road: its centreline, with the elevation at each point, and its width (SW-SITE-6) */
export interface Road { id: string; name: string; width: number; pts: [number, number][]; el: number[] }
/** SW-SITE-3: the mean of the natural ground over a rectangle, to the foot */
export function meanGround(r: Rect): number {
  let s = 0, n = 0; for (let i = 0; i <= 20; i++) for (let j = 0; j <= 20; j++) { s += natural(r.x0 + ((r.x1 - r.x0) * i) / 20, r.z0 + ((r.z1 - r.z0) * j) / 20); n++; }
  return Math.round(s / n);
}
export const distRect = (r: Rect, x: number, z: number) => Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.z0 - z, 0, z - r.z1));
/** the nearest point of a road's centreline: distance to it and the road's elevation there */
export function nearRoad(r: Road, x: number, z: number): { d: number; el: number } {
  let best = { d: Infinity, el: 0 };
  for (let i = 0; i + 1 < r.pts.length; i++) {
    const [ax, az] = r.pts[i], [bx, bz] = r.pts[i + 1], L2 = (bx - ax) ** 2 + (bz - az) ** 2, t = L2 ? Math.min(1, Math.max(0, ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / L2)) : 0;
    const d = Math.hypot(x - ax - t * (bx - ax), z - az - t * (bz - az)); if (d < best.d) best = { d, el: r.el[i] + t * (r.el[i + 1] - r.el[i]) };
  }
  return best;
}
/** what the ground is at a point: used to colour it */
export type Cover = 'water' | 'beach' | 'rock' | 'ground' | 'slope' | 'bench' | 'road';
export interface Ground { natural: (x: number, z: number) => number; finished: (x: number, z: number) => number; cover: (x: number, z: number) => Cover; benches: Bench[]; roads: Road[] }
/** SW-SITE-3: the finished ground: level on each bench and road, 2 : 1 slopes running out to the natural ground */
export function grade(benches: Bench[], roads: Road[]): Ground {
  const finished = (x: number, z: number) => {
    let g = natural(x, z);
    for (const r of roads) { const n = nearRoad(r, x, z), off = Math.max(0, n.d - r.width / 2) / 2; if (off < 60) g = Math.min(Math.max(g, n.el - off), n.el + off); }
    for (const b of benches) { const off = distRect(b, x, z) / 2; if (off < 60) g = Math.min(Math.max(g, b.el - off), b.el + off); }
    return g;
  };
  const cover = (x: number, z: number): Cover => {
    if (benches.some(b => distRect(b, x, z) === 0)) return roads.some(r => nearRoad(r, x, z).d <= r.width / 2) ? 'road' : 'bench';
    if (roads.some(r => nearRoad(r, x, z).d <= r.width / 2)) return 'road';
    const g = finished(x, z), n = natural(x, z), d = shore(x) - z;
    if (g <= 0) return 'water';
    if (Math.abs(g - n) > 0.25) return 'slope';
    if (d < 70) return cove(x) > 0.5 ? 'beach' : 'rock';
    return 'ground';
  };
  return { natural, finished, cover, benches, roads };
}

/** a piece of the ground for drawing: its cover, and for open ground a tone (0 to 11: four bands of elevation, three patches) */
export interface GroundPiece { cover: Cover; tone: number; mesh: MeshData }
/** the ground as meshes in inches (x east, y up, z south), by cover; grid lines fall on every bench edge; the sea is drawn over the water only */
export function groundMeshes(G: Ground, step = 25, clip?: Rect): GroundPiece[] {
  const X = clip ?? { x0: 0, x1: SITE.x1, z0: 0, z1: SITE.z1 };
  const lines = (a: number, b: number, extra: number[]) => { const s = new Set<number>(); for (let v = a; v < b; v += step) s.add(Math.round(v * 100) / 100); s.add(b); for (const e of extra) if (e > a && e < b) s.add(e); return [...s].sort((p, q) => p - q); };
  const xs = lines(X.x0, X.x1, G.benches.flatMap(b => [b.x0, b.x1])), zs = lines(X.z0, X.z1, G.benches.flatMap(b => [b.z0, b.z1]));
  const out = new Map<string, GroundPiece>(), piece = (cover: Cover, tone: number) => { const k = `${cover}:${tone}`; let p = out.get(k); if (!p) out.set(k, (p = { cover, tone, mesh: { positions: [], indices: [] } })); return p.mesh; };
  const h = xs.map(x => zs.map(z => G.finished(x, z)));
  for (let i = 0; i + 1 < xs.length; i++) for (let j = 0; j + 1 < zs.length; j++) {
    const cx = (xs[i] + xs[i + 1]) / 2, cz = (zs[j] + zs[j + 1]) / 2, corners = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], hi = Math.max(...corners.map(([a, b]) => h[a][b])), lo = Math.min(...corners.map(([a, b]) => h[a][b]));
    const quad = (m: MeshData, y: (a: number, b: number) => number) => { const k = m.positions.length / 3; for (const [a, b] of corners) m.positions.push(xs[a] * 12, y(a, b) * 12, zs[b] * 12); m.indices.push(k, k + 2, k + 1, k, k + 3, k + 2); };
    if (lo < 0.5) quad(piece('water', 0), () => 0);                                                      // the sea, at mean sea level
    if (hi < -1) continue;                                                                               // the bed under it is not drawn
    const c = G.cover(cx, cz), land = c === 'water' ? 'beach' : c;
    const tone = land === 'ground' ? 3 * Math.min(3, Math.floor(Math.max(0, (lo + hi) / 2) / 45)) + Math.floor(1.5 + 1.49 * Math.sin(cx / 173 + 0.7 * Math.sin(cz / 131)) * Math.cos(cz / 197 + 0.5 * Math.sin(cx / 149))) : 0;
    quad(piece(land, tone), (a, b) => h[a][b]);
  }
  return [...out.values()];
}
