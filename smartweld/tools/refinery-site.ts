// Plant 3: the site (DESIGN_BASIS.md §77). Draws the plot plan, renders the graded ground with the tanks, buildings and
// jetty as massing, and writes the plot data and document.
//   vite-node tools/refinery-site.ts      writes screenshots/refinery/site-*.png, docs/REFINERY-PLOT.md, public/refinery/site/plot.json
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { Raster, type RGB } from '../src/render/raster';
import { drawText } from '../src/render/sheet';
import { parseFont } from '../src/pdf/ttf';
import { render3d, type Camera } from '../src/render/view3d';
import type { Drawable } from '../src/render/scene';
import type { MeshData } from '../src/geometry/mesh';
import { SITE, TIDE, shore, natural, groundMeshes, type Cover } from '../src/refinery/terrain';
void shore;
import { BENCHES, PLOTS, DIKES, spheres, ROADS, PIPEWAYS, JETTY, fenceLine, GATES, FLARE, siteGround, bench } from '../src/refinery/site';
import { plotData, plotDocument, IMAGES } from '../src/refinery/siteReport';

const out = 'screenshots/refinery', font = parseFont(new Uint8Array(readFileSync('assets/fonts/DejaVuSans.ttf'))), G = siteGround();
const C = (h: number): RGB => [(h >> 16) & 255, (h >> 8) & 255, h & 255], mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
mkdirSync(out, { recursive: true }); mkdirSync('public/refinery/site', { recursive: true });

// ───────────────────────── the plot plan, drawn ─────────────────────────
function plotPlan(): Uint8Array {
  const s = 0.5, mx = 70, my = 70, W = Math.round(SITE.x1 * s), H = Math.round(SITE.z1 * s), panel = 470, R = new Raster(W + 2 * mx + panel, H + 2 * my, 2, [255, 255, 255]);
  const X = (x: number) => mx + x * s, Y = (z: number) => my + z * s, pt = (x: number, z: number): [number, number] => [X(x), Y(z)];
  const rect = (r: { x0: number; x1: number; z0: number; z1: number }): [number, number][] => [pt(r.x0, r.z0), pt(r.x1, r.z0), pt(r.x1, r.z1), pt(r.x0, r.z1)];
  const text = (x: number, y: number, t: string, size = 11, c: RGB = C(0x1b1f24)) => drawText(R, font, x, y, t, size, c);
  const width = (t: string, size: number) => { let w = 0; for (const ch of t) w += font.advance[font.gid.get(ch.codePointAt(0)!) ?? 0]; return (w * size) / font.unitsPerEm; };
  const centred = (x: number, y: number, t: string, size = 11, c: RGB = C(0x1b1f24)) => text(x - width(t, size) / 2, y, t, size, c);
  const INK = C(0x1b1f24), LAND0 = C(0xe9eddc), LAND1 = C(0xd9cfb2), SEA0 = C(0xd6e8f2), SEA1 = C(0x9fc4dc);
  // ground tint by elevation
  const cell = 12.5;
  for (let x = 0; x < SITE.x1; x += cell) for (let z = 0; z < SITE.z1; z += cell) {
    const g = G.finished(x + cell / 2, z + cell / 2), col = g <= 0 ? mix(SEA0, SEA1, Math.min(1, -g / 70)) : g < TIDE && shore(x) - z < 80 ? C(0xe6dfc6) : mix(LAND0, LAND1, Math.min(1, g / 190));
    R.fill([[pt(x, z), pt(x + cell, z), pt(x + cell, z + cell), pt(x, z + cell)]], col);
  }
  // contours of the finished ground every 10 ft, heavier every 50 ft
  const step = 10, nx = SITE.x1 / step, nz = SITE.z1 / step, h: number[][] = [];
  for (let i = 0; i <= nx; i++) { h.push([]); for (let j = 0; j <= nz; j++) h[i].push(G.finished(i * step, j * step)); }
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const v = [h[i][j], h[i + 1][j], h[i + 1][j + 1], h[i][j + 1]], lo = Math.min(...v), hi = Math.max(...v), P: [number, number][] = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
    for (let L0 = Math.ceil((lo - 1) / 10) * 10; L0 < hi + 1; L0 += 10) {
      const L = L0 + 1e-4, hits: [number, number][] = [];                                                 // a hair above the level, so ground lying exactly on it still crosses
      if (!(lo < L && hi > L)) continue;
      for (let k = 0; k < 4; k++) { const a = v[k], b = v[(k + 1) % 4]; if ((a < L) !== (b < L)) { const t = (L - a) / (b - a); hits.push(pt((P[k][0] + t * (P[(k + 1) % 4][0] - P[k][0])) * step, (P[k][1] + t * (P[(k + 1) % 4][1] - P[k][1])) * step)); } }
      if (hits.length >= 2) R.stroke([hits[0], hits[1]], L0 === 0 ? 1.8 : L0 % 50 === 0 ? 0.9 : 0.45, L0 === 0 ? C(0x2f6f9f) : L0 < 0 ? C(0x7fa8c4) : C(0xa08a5f));
    }
  }
  // benches, roads
  for (const b of BENCHES) { R.fill([rect(b)], C(0xefece4)); R.stroke(rect(b), 0.8, C(0x8a8473), true); }
  for (const r of ROADS) R.stroke(r.pts.map(p => pt(p[0], p[1])), r.width * s, C(0x9a9c9e));
  for (const r of ROADS) R.stroke(r.pts.map(p => pt(p[0], p[1])), 0.5, C(0xffffff), false, [6, 6]);
  // plots
  const FILL: Record<string, RGB> = { unit: C(0xf6d9a8), tower: C(0xbfd9ea), building: C(0xb9bec9), pad: C(0xf2b8a6), spare: C(0xf4f1ea), pond: C(0xa9cfe6) };
  for (const p of PLOTS) { R.fill([rect(p)], FILL[p.kind]); R.stroke(rect(p), p.kind === 'spare' ? 0.6 : 1.1, INK, true, p.kind === 'spare' ? [5, 4] : undefined); }
  // dikes and tanks
  for (const d of DIKES()) {
    R.stroke(rect(d), 1.6, C(0x7a5a3a), true);
    for (const t of d.tanks) { const c = Array.from({ length: 48 }, (_, k) => pt(t.x + (t.D / 2) * Math.cos((k * Math.PI) / 24), t.z + (t.D / 2) * Math.sin((k * Math.PI) / 24))); R.fill([c], C(0xffffff)); R.stroke(c, 1, INK, true); if (t.D >= 70) centred(X(t.x), Y(t.z) + 4, t.tag, t.D >= 100 ? 11.5 : 9.5); }
  }
  for (const sp of spheres()) {
    if (sp.L) { const r0 = { x0: sp.x - sp.L / 2, x1: sp.x + sp.L / 2, z0: sp.z - sp.D / 2, z1: sp.z + sp.D / 2 }; R.fill([rect(r0)], C(0xffffff)); R.stroke(rect(r0), 0.8, INK, true); }
    else { const c = Array.from({ length: 36 }, (_, k) => pt(sp.x + (sp.D / 2) * Math.cos((k * Math.PI) / 18), sp.z + (sp.D / 2) * Math.sin((k * Math.PI) / 18))); R.fill([c], C(0xffffff)); R.stroke(c, 1, INK, true); R.stroke([pt(sp.x - sp.D / 2, sp.z), pt(sp.x + sp.D / 2, sp.z)], 0.6, INK); }
  }
  // pipeways
  const PW: Record<string, RGB> = { rack: C(0xb0276b), sleepers: C(0x6a3fa0), trestle: C(0x59616b) };
  for (const p of PIPEWAYS) R.stroke(p.pts.map(q => pt(q[0], q[1])), p.kind === 'trestle' ? p.width * s : 2.2, PW[p.kind], false, p.kind === 'trestle' ? undefined : [9, 4]);
  // jetty
  R.fill([rect(JETTY.platform)], C(0x8f949a)); R.stroke(rect(JETTY.platform), 1, INK, true);
  for (const [x, z] of [...JETTY.breasting, ...JETTY.mooring]) { const r0 = { x0: x - 14, x1: x + 14, z0: z - 14, z1: z + 14 }; R.fill([rect(r0)], C(0x8f949a)); R.stroke(rect(r0), 0.8, INK, true); }
  { const sh = JETTY.ship, bow = 110; R.stroke([pt(sh.x0 + bow, sh.z0), pt(sh.x1 - 40, sh.z0), pt(sh.x1, sh.z0 + 30), pt(sh.x1, sh.z1 - 30), pt(sh.x1 - 40, sh.z1), pt(sh.x0 + bow, sh.z1), pt(sh.x0, (sh.z0 + sh.z1) / 2)], 1, C(0x4a5560), true, [8, 5]); centred(X((sh.x0 + sh.x1) / 2), Y((sh.z0 + sh.z1) / 2) + 4, 'tanker alongside (not modelled)', 10, C(0x4a5560)); }
  // fence, gates, flare circles
  R.stroke(fenceLine().map(p => pt(p[0], p[1])), 0.8, C(0x2d5a3a), false, [10, 3, 2, 3]);
  for (const g of GATES) { R.fill([[pt(g.x - 14, g.z - 22), pt(g.x + 14, g.z - 22), pt(g.x + 14, g.z + 22), pt(g.x - 14, g.z + 22)]], C(0x2d5a3a)); text(X(g.x) + 12, Y(g.z) - 14, g.name, 10.5, C(0x2d5a3a)); }
  for (const [rad, dash] of [[FLARE.sterile, [6, 4]], [FLARE.clear, [2, 5]]] as const) R.stroke(Array.from({ length: 90 }, (_, k) => pt(FLARE.x + rad * Math.cos((k * Math.PI) / 45), FLARE.z + rad * Math.sin((k * Math.PI) / 45))), 0.9, C(0xc0392b), true, [...dash]);
  // labels
  const label = (p: { x0: number; x1: number; z0: number; z1: number }, lines: string[], size = 11, c: RGB = INK) => lines.forEach((t, i) => centred(X((p.x0 + p.x1) / 2), Y((p.z0 + p.z1) / 2) + (i - (lines.length - 1) / 2) * (size + 3) + size / 2 - 1, t, size, c));
  const wrap = (t: string, max: number, size: number) => { const o: string[] = []; let cur = ''; for (const w of t.split(' ')) { if (cur && width(`${cur} ${w}`, size) > max) { o.push(cur); cur = w; } else cur = cur ? `${cur} ${w}` : w; } if (cur) o.push(cur); return o; };
  for (const p of PLOTS) {
    const wpx = (p.x1 - p.x0) * s - 6;
    if (p.kind === 'building') { if (wpx > 40) label(p, wrap(p.name, wpx, 10), 10); continue; }
    if (p.kind === 'pad') continue;                                                                    // too small to hold their names: named beside
    label(p, [...(p.unit && p.kind === 'unit' ? [`UNIT ${p.unit}`] : []), ...wrap(p.name, wpx, 13)], 13);
  }
  for (const d of DIKES()) centred(X((d.x0 + d.x1) / 2), Y(d.z0) - 6, `${d.name} (unit ${d.unit}); dike wall ${d.wall} ft`, 12, C(0x7a5a3a));
  centred(X(4010), Y(1640), 'Liquefied gas spheres', 12); centred(X(4010), Y(1640) + 15, 'and bullets (unit 21)', 12);
  text(X(FLARE.x) + 50, Y(FLARE.z) + 4, 'Flare stack and seal drum (unit 25)', 12, C(0xc0392b)); text(X(FLARE.x) + 50, Y(FLARE.z) + 19, '300 ft kept bare, 500 ft clear', 11, C(0xc0392b));
  text(X(865) - 4 - width('Flare knock-out', 11), Y(2215), 'Flare knock-out', 11, C(0xc0392b)); text(X(865) - 4 - width('drum (unit 25)', 11), Y(2215) + 14, 'drum (unit 25)', 11, C(0xc0392b));
  // each bench's name and elevation, where it is clear of roads: [east of the bench's west edge, ft; 'below' its south edge or 'above' its north edge]
  const AT: Record<string, [number, 'below' | 'above' | 'right']> = { process: [330, 'below'], south: [1560, 'below'], north: [10, 'below'], lpg: [190, 'below'], waste: [10, 'above'], admin: [10, 'below'], truck: [10, 'above'], jetty: [0, 'right'], pond: [0, 'right'] };
  for (const b of BENCHES) { const a = AT[b.id]; if (!a) continue; const t = `${b.name}, EL ${b.el} ft`; if (a[1] === 'right') text(X(b.x1) + 46, Y((b.z0 + b.z1) / 2) + (b.id === 'jetty' ? 40 : 4), t, 12, C(0x5f5a4c)); else text(X(b.x0 + a[0]), a[1] === 'below' ? Y(b.z1) + 42 : Y(b.z0) - 38, t, 12, C(0x5f5a4c)); }
  text(X(1232), Y(4700), 'Jetty trestle', 12); text(X(1285), Y(5104), 'Berth', 12);
  text(X(3050), Y(4600), 'Sea: mean sea level EL 0, tide ±11 ft', 15, C(0x2f6f9f)); text(X(3800), Y(3760), 'Cove', 15, C(0x2f6f9f)); text(X(1640), Y(4040), 'Headland', 15, C(0x5f5a4c));
  text(X(4520), Y(2120), 'Ravine', 15, C(0x5f5a4c)); text(X(200), Y(200), 'Hill', 15, C(0x5f5a4c));
  const mainRack = PIPEWAYS[0]; centred(X(2820), Y(mainRack.pts[0][1]) - 8, 'Main pipeway', 12, PW.rack);
  // frame, grid ticks with plant coordinates (E = x, N = −z)
  R.stroke([pt(0, 0), pt(SITE.x1, 0), pt(SITE.x1, SITE.z1), pt(0, SITE.z1)], 1.4, INK, true);
  for (let x = 0; x <= SITE.x1; x += 500) { R.stroke([pt(x, 0), pt(x, -14)], 0.8, INK); R.stroke([pt(x, SITE.z1), pt(x, SITE.z1 + 14)], 0.8, INK); centred(X(x), my - 20, `E ${x}`, 12); centred(X(x), my + H + 30, `E ${x}`, 12); }
  for (let z = 0; z <= SITE.z1; z += 500) { R.stroke([pt(0, z), pt(-14, z)], 0.8, INK); R.stroke([pt(SITE.x1, z), pt(SITE.x1 + 14, z)], 0.8, INK); text(4, Y(z) + 4, `N ${z ? '−' + z : 0}`, 12); }
  for (let x = 500; x < SITE.x1; x += 500) for (let z = 500; z < SITE.z1; z += 500) { R.stroke([pt(x - 12, z), pt(x + 12, z)], 0.5, C(0x8a8f96)); R.stroke([pt(x, z - 12), pt(x, z + 12)], 0.5, C(0x8a8f96)); }
  // side panel: title, north, wind, scale, legend
  const px = mx + W + 40; let y = my + 24;
  text(px, y, 'SmartWeld coastal refinery', 24); y += 30; text(px, y, 'Plant 3: plot plan', 18); y += 26;
  for (const t of ['An invented demonstration site: its ground is a', 'formula and its arrangement SmartWeld\'s own.', 'Not a real place and not for construction.', 'Feet. E = x, N = −z, elevations above mean sea level.', 'DESIGN_BASIS.md §77 (SW-SITE-1 to SW-SITE-7).']) { text(px, y, t, 12.5, C(0x4a5560)); y += 18; }
  y += 30; const nx0 = px + 40, ny0 = y + 70;
  R.fill([[[nx0, ny0 - 70], [nx0 + 16, ny0], [nx0, ny0 - 14], [nx0 - 16, ny0]]], INK); centred(nx0, ny0 - 78, 'N', 16);
  const wx = px + 190, wy = ny0 - 34, ang = (22.5 * Math.PI) / 180, dx = Math.cos(ang), dy = -Math.sin(ang);            // from west-south-west, toward east-north-east
  R.stroke([[wx - 60 * dx, wy - 60 * dy], [wx + 60 * dx, wy + 60 * dy]], 2.2, C(0x2f6f9f)); R.fill([[[wx + 76 * dx, wy + 76 * dy], [wx + 52 * dx + 9 * dy, wy + 52 * dy - 9 * dx], [wx + 52 * dx - 9 * dy, wy + 52 * dy + 9 * dx]]], C(0x2f6f9f));
  centred(wx, wy + 44, 'prevailing wind', 10.5, C(0x2f6f9f));
  y = ny0 + 46; R.fill([[[px, y], [px + 500 * s, y], [px + 500 * s, y + 6], [px, y + 6]]], INK); R.fill([[[px + 250 * s, y + 1], [px + 500 * s, y + 1], [px + 500 * s, y + 5], [px + 250 * s, y + 5]]], C(0xffffff));
  text(px, y + 22, '0', 10); centred(px + 250 * s, y + 22, '250', 10); centred(px + 500 * s, y + 22, '500 ft', 10); y += 56;
  text(px, y, 'Legend', 15); y += 24;
  const key = (draw: (x: number, y: number) => void, t: string) => { draw(px, y); text(px + 58, y + 4, t, 12.5); y += 24; };
  const sw = (col: RGB, edge = INK, dash?: number[]) => (x: number, yy: number) => { const q: [number, number][] = [[x, yy - 8], [x + 46, yy - 8], [x + 46, yy + 6], [x, yy + 6]]; R.fill([q], col); R.stroke(q, 0.9, edge, true, dash); };
  const ln = (col: RGB, wd: number, dash?: number[]) => (x: number, yy: number) => R.stroke([[x, yy - 1], [x + 46, yy - 1]], wd, col, false, dash);
  key(sw(FILL.unit), 'Process or offsite unit'); key(sw(FILL.tower), 'Cooling tower'); key(sw(FILL.pad), 'Flare stack; knock-out drum'); key(sw(FILL.building), 'Building'); key(sw(FILL.spare, INK, [5, 4]), 'Space for a future unit'); key(sw(FILL.pond), 'Storm pond');
  key(sw(C(0xefece4), C(0x8a8473)), 'Level bench, with its elevation'); key((x, yy) => { const c = Array.from({ length: 24 }, (_, k) => [x + 23 + 9 * Math.cos((k * Math.PI) / 12), yy - 1 + 9 * Math.sin((k * Math.PI) / 12)] as [number, number]); R.fill([c], C(0xffffff)); R.stroke(c, 1, INK, true); }, 'Storage tank; sphere');
  key(ln(C(0x7a5a3a), 1.6), 'Dike wall'); key(ln(C(0x9a9c9e), 9), 'Road'); key(ln(PW.rack, 2.2, [9, 4]), 'Pipeway on a rack'); key(ln(PW.sleepers, 2.2, [9, 4]), 'Pipeway on sleepers'); key(ln(C(0x2d5a3a), 0.9, [10, 3, 2, 3]), 'Fence');
  key(ln(C(0xa08a5f), 0.9), 'Ground contour, 10 ft (heavier at 50 ft)'); key(ln(C(0x2f6f9f), 1.6), 'Shoreline at mean sea level'); key(ln(C(0x7fa8c4), 0.9), 'Sea bed contour, 10 ft'); key(ln(C(0xc0392b), 0.9, [6, 4]), 'Flare distances');
  y += 14; text(px, y, 'Units', 15); y += 22;
  for (const [n, t] of [[11, 'Crude distillation'], [12, 'Vacuum distillation'], [13, 'Naphtha hydrotreater and splitter'], [14, 'Catalytic reformer, hydrogen purification'], [15, 'Kerosene hydrotreater'], [16, 'Diesel hydrotreater'], [17, 'Fluid catalytic cracker, gas concentration'], [18, 'Sulfur block'], [19, 'Utilities; cooling tower'], [20, 'Crude tank farm'], [21, 'Intermediate and product tanks'], [22, 'Marine terminal'], [23, 'Truck loading'], [24, 'Wastewater treatment'], [25, 'Flare'], [26, 'Fire water'], [27, 'Buildings and site works']] as const) { text(px, y, String(n), 12.5); text(px + 30, y, t, 12.5); y += 18; }
  return R.png();
}

// ───────────────────────── the site in 3D: graded ground and massing ─────────────────────────
const I: number[] = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): MeshData {
  const p = [x0, y0, z0, x1, y0, z0, x1, y1, z0, x0, y1, z0, x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1].map(v => v * 12);
  return { positions: p, indices: [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 2, 3, 7, 2, 7, 6, 1, 2, 6, 1, 6, 5, 0, 4, 7, 0, 7, 3] };
}
function cyl(cx: number, cz: number, r: number, y0: number, y1: number, n = 40, axis: 'y' | 'x' = 'y', cy = 0): MeshData {
  const p: number[] = [], ix: number[] = [];
  for (let k = 0; k < n; k++) { const a = (2 * Math.PI * k) / n, c = r * Math.cos(a), s = r * Math.sin(a); if (axis === 'y') p.push(cx + c, y0, cz + s, cx + c, y1, cz + s); else p.push(y0, cy + c, cz + s, y1, cy + c, cz + s); }
  const b = p.length / 3; if (axis === 'y') p.push(cx, y0, cz, cx, y1, cz); else p.push(y0, cy, cz, y1, cy, cz);
  for (let k = 0; k < n; k++) { const a = 2 * k, c = 2 * ((k + 1) % n); ix.push(a, a + 1, c + 1, a, c + 1, c, b, c, a, b + 1, a + 1, c + 1); }
  return { positions: p.map(v => v * 12), indices: ix };
}
function ball(cx: number, cy: number, cz: number, r: number, n = 24): MeshData {
  const p: number[] = [], ix: number[] = [];
  for (let i = 0; i <= n; i++) for (let j = 0; j < 2 * n; j++) { const t = (Math.PI * i) / n, f = (Math.PI * j) / n; p.push(cx + r * Math.sin(t) * Math.cos(f), cy + r * Math.cos(t), cz + r * Math.sin(t) * Math.sin(f)); }
  for (let i = 0; i < n; i++) for (let j = 0; j < 2 * n; j++) { const a = i * 2 * n + j, b = i * 2 * n + ((j + 1) % (2 * n)), c = a + 2 * n, d = b + 2 * n; ix.push(a, b, d, a, d, c); }
  return { positions: p.map(v => v * 12), indices: ix };
}
function siteDrawables(): Drawable[] {
  const ds: Drawable[] = [], add = (mesh: MeshData, color: RGB) => { if (mesh.indices.length) ds.push({ mesh, T: I, color }); };
  const COVER: Record<Cover, RGB> = { water: C(0x5f8fb0), beach: C(0xd6cba6), rock: C(0x8b8a84), ground: C(0x8f9b6b), slope: C(0xa69473), bench: C(0xcdc6b3), road: C(0x5c5f63) };
  // open ground: paler and drier with height, in patches a little lighter and darker
  const tone = (t: number) => { const base = mix(C(0x93a36c), C(0xa39a70), Math.floor(t / 3) / 3), k = [0.93, 1, 1.07][t % 3]; return [base[0] * k, base[1] * k, base[2] * k] as RGB; };
  for (const g of groundMeshes(G, 10)) add(g.mesh, g.cover === 'ground' ? tone(g.tone) : COVER[g.cover]);
  for (const p of PLOTS) {
    const el = bench(p.bench).el;
    if (p.kind === 'building') add(box(p.x0, p.x1, el, el + (p.height ?? 16), p.z0, p.z1), C(0xbdb7a8));
    else if (p.kind === 'pond') add(box(p.x0, p.x1, el - 0.5, el + 0.2, p.z0, p.z1), C(0x6f9bb8));
  }
  // cooling tower, as its cells
  { const ct = PLOTS.find(p => p.id === 'CT')!, el = bench('process').el, x = (ct.x0 + ct.x1) / 2, z0 = (ct.z0 + ct.z1) / 2 - 72; add(box(x - 18, x + 18, el, el + 42, z0, z0 + 144), C(0xb8b2a2)); for (let k = 0; k < 4; k++) add(cyl(x, z0 + 18 + 36 * k, 13, el + 42, el + 56), C(0xc9c4b6)); }
  for (const d of DIKES()) {
    const el = bench(d.bench).el, w = 0.67;
    for (const [a, b, c, e] of [[d.x0, d.x1, d.z0 - w, d.z0], [d.x0, d.x1, d.z1, d.z1 + w], [d.x0 - w, d.x0, d.z0, d.z1], [d.x1, d.x1 + w, d.z0, d.z1]]) add(box(a, b, el, el + d.wall, c, e), C(0xb9b4a8));
    for (const t of d.tanks) { add(cyl(t.x, t.z, t.D / 2, el, el + t.H), C(0xe9e8e3)); add(cyl(t.x, t.z, t.D / 2 + 0.6, el + t.H - 3, el + t.H - 2, 40), C(0x8d949b)); }
  }
  for (const sp of spheres()) { const el = bench('lpg').el; if (sp.L) add(cyl(0, sp.z, sp.D / 2, sp.x - sp.L / 2, sp.x + sp.L / 2, 24, 'x', el + 4 + sp.D / 2), C(0xf0efea)); else { add(ball(sp.x, el + 8 + sp.D / 2, sp.z, sp.D / 2), C(0xf0efea)); for (let k = 0; k < 8; k++) add(cyl(sp.x + (sp.D / 2 - 2) * Math.cos((k * Math.PI) / 4), sp.z + (sp.D / 2 - 2) * Math.sin((k * Math.PI) / 4), 1.2, el, el + 8 + sp.D / 2, 10), C(0x9a9fa5)); } }
  add(cyl(FLARE.x, FLARE.z, 2, bench('flare').el, bench('flare').el + 220, 16), C(0x8d949b));
  // jetty: trestle deck on pile bents, platform, dolphins
  const tr = PIPEWAYS.find(p => p.id === 'trestle')!, x = tr.pts[0][0];
  add(box(x - 20, x + 20, JETTY.deck - 3, JETTY.deck, tr.pts[0][1], tr.pts[1][1]), C(0x9a9fa5));
  for (let z = tr.pts[0][1] + 40; z < tr.pts[1][1]; z += 80) for (const dx of [-14, 14]) add(cyl(x + dx, z, 1.5, Math.min(natural(x, z), 0) - 2, JETTY.deck - 3, 10), C(0x6f7b8a));
  add(box(JETTY.platform.x0, JETTY.platform.x1, JETTY.deck - 4, JETTY.deck, JETTY.platform.z0, JETTY.platform.z1), C(0x9a9fa5));
  for (const [dx, dz] of [...JETTY.breasting, ...JETTY.mooring]) add(cyl(dx, dz, 12, natural(dx, dz) - 2, 18, 20), C(0x8d949b));
  return ds;
}
const ft = (v: [number, number, number]): [number, number, number] => [v[0] * 12, v[1] * 12, v[2] * 12];
const CAMS: Record<string, Camera> = {
  'site-from-the-south-west': { eye: ft([-500, 1300, 5700]), target: ft([2250, 40, 2350]), fovDeg: 45 },
  'site-from-the-south-east': { eye: ft([5700, 1300, 5300]), target: ft([2400, 40, 2300]), fovDeg: 45 },
  'site-from-the-north': { eye: ft([2400, 1500, -1700]), target: ft([2300, 30, 2400]), fovDeg: 45 },
  'site-process-bench-and-terraces': { eye: ft([650, 520, 3750]), target: ft([2100, 60, 2000]), fovDeg: 45 },
  'site-jetty-and-headland': { eye: ft([2350, 300, 5380]), target: ft([1250, 30, 4350]), fovDeg: 45 },
};
const only = process.argv[2];
if (!only || only === 'plan') { const t0 = Date.now(); writeFileSync(`${out}/site-plot-plan.png`, plotPlan()); console.log(`site-plot-plan ${((Date.now() - t0) / 1000).toFixed(1)} s`); }
if (!only || only === '3d') { const ds = siteDrawables(); for (const [name, cam] of Object.entries(CAMS)) { const t0 = Date.now(); writeFileSync(`${out}/${name}.png`, render3d(ds, cam, 1800, 1100, 2)); console.log(`${name} ${((Date.now() - t0) / 1000).toFixed(1)} s (${ds.length} drawables)`); } }
// data, document, and the image index (rows of screenshots/INDEX.md for this folder)
writeFileSync('public/refinery/site/plot.json', JSON.stringify(plotData(), (_k, v) => (typeof v === 'number' && !Number.isInteger(v) ? Number(v.toFixed(2)) : v), 1) + '\n');
writeFileSync('docs/REFINERY-PLOT.md', plotDocument() + '\n');
const idx = 'screenshots/INDEX.md', cur = existsSync(idx) ? readFileSync(idx, 'utf8').replace(/\n*$/, '').split('\n') : [], idOf = (r: string) => r.slice(0, r.indexOf('|', 2));
for (const [name, caption] of Object.entries(IMAGES)) { const r = `| \`refinery/${name}.png\` | ${caption} |`, k = cur.findIndex(c => idOf(c) === idOf(r)); if (k >= 0) cur[k] = r; else cur.push(r); }
writeFileSync(idx, cur.join('\n') + '\n');
console.log('wrote docs/REFINERY-PLOT.md, public/refinery/site/plot.json and the image index');
