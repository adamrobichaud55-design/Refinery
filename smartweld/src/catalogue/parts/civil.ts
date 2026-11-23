/**
 * Civil and concrete catalogue: DESIGN_BASIS.md §65 (SW-CIV-*). Every part is a true-scale concrete solid with its bar
 * list and quantities (SW-CIV-15). Local frame: x and y in plan, z up from the bottom of the part (or from grade where
 * a rule says so). Nothing here comes from a published table (PROVENANCE P-72).
 */
import { K } from '../../core/constants';
import { drawing, rule, constant, type Dim } from '../../core/basis';
import { roundUpTo } from '../../core/units';
import type { PartSpec, Material } from '../part';
import { extrude, signedVolume, revolve, mergeMeshes, helixTube, transformMesh, type MeshData } from '../../geometry/mesh';
import { rect, type Polygon } from '../../geometry/polygon';
import { translate } from '../../geometry/transform';
import { sweep, hookedBarPath, loopPath, ringPath, chamferedPrism, insetConvex, hexNut, orient, boxMesh, type V3, type DSolid } from './detailKit';
import { hexHardware } from './hardware';

const RHO_C = K.CONCRETE_DENSITY_LB_IN3, RHO_S = K.STEEL_DENSITY_LB_IN3;
const rhoC = () => constant(K.CONCRETE_DENSITY_LB_FT3, 'K-7', 'Concrete density', 'lb/ft3');

/** SW-CIV-1: the two concrete classes and the bar grade */
export const CONCRETE_A: Material = { grade: 'Class A concrete (3 ksi)', Fy: rule(3, 'SW-CIV-1', 'Compressive strength (class A)', 'ksi') };
export const CONCRETE_B: Material = { grade: 'Class B concrete (4 ksi)', Fy: rule(4, 'SW-CIV-1', 'Compressive strength (class B)', 'ksi') };
export const GROUT: Material = { grade: 'Non-shrink cementitious grout', Fy: rule(4, 'SW-CIV-11', 'Compressive strength (as class B)', 'ksi') };
export const REBAR_GRADE: Material = { grade: 'Grade 60 reinforcing bar', Fy: drawing(60, 'Minimum yield strength (grade stated on drawing)', 'ksi') };

/** SW-CIV-1: bar #n has diameter n/8 in (SmartWeld's own naming) */
export const barDiameter = (n: number) => n / 8;
export const barArea = (n: number) => (Math.PI * barDiameter(n) ** 2) / 4;
/** SW-CIV-3b: a 90° hook adds 12 d to the bar's length */
export const hookLength = (n: number) => 12 * barDiameter(n);

export interface Bar { designation: string; n: number; count: number; length: number; weight: number; note: string }
export function bars(n: number, count: number, length: number, note: string): Bar {
  return { designation: `#${n}`, n, count, length, weight: count * length * barArea(n) * RHO_S, note };
}
/** bars of size n at spacing s across a width w (cover c each side): count and the clear spacing used */
export const spaced = (w: number, s: number, c: number) => Math.max(2, Math.ceil((w - 2 * c) / s) + 1);

const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): MeshData => extrude({ outer: rect(x0, y0, x1, y1) }, z1 - z0, z0);
/** a regular octagon of across-flats width F, centred */
export function octagon(F: number): Polygon {
  const R = F / 2 / Math.cos(Math.PI / 8);
  return Array.from({ length: 8 }, (_, i) => ({ x: R * Math.cos((Math.PI / 4) * i + Math.PI / 8), y: R * Math.sin((Math.PI / 4) * i + Math.PI / 8) }));
}
/** area of a regular octagon of across-flats width F: 2(√2 − 1) F² */
export const octagonArea = (F: number) => 2 * (Math.SQRT2 - 1) * F * F;

interface Solid { name: string; mesh: MeshData }
export const CH = 0.75;   // SW-DET-2: chamfer on exposed edges
export const even = (lo: number, hi: number, n: number): number[] => (n <= 1 ? [(lo + hi) / 2] : Array.from({ length: n }, (_, i) => lo + ((hi - lo) * i) / (n - 1)));
/** SW-DET-1: the drawn bars of one bar-list entry, merged; `paths` one per bar (closed = a loop) */
export function drawn(b: Bar, paths: V3[][], closed = false): DSolid & { count: number } {
  return { name: `bars ${b.designation}: ${b.note}`, role: 'rebar', count: paths.length, mesh: mergeMeshes(paths.map(p => sweep(p, barDiameter(b.n) / 2, 8, closed))) };
}
/** n points evenly along a closed polygon's perimeter */
export function alongPerimeter(poly: Polygon, n: number): { x: number; y: number; nx: number; ny: number }[] {
  const m = poly.length, len = poly.map((p, i) => Math.hypot(poly[(i + 1) % m].x - p.x, poly[(i + 1) % m].y - p.y)), total = len.reduce((a, b) => a + b, 0), out: { x: number; y: number; nx: number; ny: number }[] = [];
  const cx = poly.reduce((a, p) => a + p.x, 0) / m, cy = poly.reduce((a, p) => a + p.y, 0) / m;
  for (let k = 0; k < n; k++) { let s = (total * (k + 0.5)) / n, i = 0; while (s > len[i]) { s -= len[i]; i++; } const p = poly[i], q = poly[(i + 1) % m], t = s / len[i], x = p.x + (q.x - p.x) * t, y = p.y + (q.y - p.y) * t, l = Math.hypot(x - cx, y - cy) || 1; out.push({ x, y, nx: (x - cx) / l, ny: (y - cy) / l }); }
  return out;
}
/** SW-DET-3: an anchor rod of diameter d from z0 to z1 with its plate washer and nut run down on the concrete at zTop */
export function anchorRod(x: number, y: number, d: number, z0: number, z1: number, zTop: number): MeshData {
  const n = 16, rod = extrude({ outer: Array.from({ length: n }, (_, i) => ({ x: x + (d / 2) * Math.cos((2 * Math.PI * i) / n), y: y + (d / 2) * Math.sin((2 * Math.PI * i) / n) })) }, z1 - z0, z0);
  return mergeMeshes([rod, boxMesh(x - 1.5 * d, y - 1.5 * d, zTop, x + 1.5 * d, y + 1.5 * d, zTop + 0.375), transformMesh(hexNut(d), translate(x, y, zTop + 0.375))]);
}
/** a ring between two polygons of equal vertex count whose section changes from (outer0, inner0) at z0 to (outer1, inner1) at z1 */
function ringFrustum(outer0: Polygon, inner0: Polygon, outer1: Polygon, inner1: Polygon, z0: number, z1: number): MeshData {
  const m = outer0.length, positions: number[] = [], indices: number[] = [];
  for (const [poly, z] of [[outer0, z0], [inner0, z0], [outer1, z1], [inner1, z1]] as const) for (const p of poly) positions.push(p.x, p.y, z);
  const quad = (a: number, b: number, c: number, d: number) => indices.push(a, b, c, a, c, d);
  for (let i = 0; i < m; i++) { const j = (i + 1) % m; quad(i, j, 2 * m + j, 2 * m + i); quad(m + j, m + i, 3 * m + i, 3 * m + j); quad(j, i, m + i, m + j); quad(2 * m + i, 2 * m + j, 3 * m + j, 3 * m + i); }
  return orient({ positions, indices });
}
/** SW-CIV-15: volume, weight, formed area and bars onto the spec; `detail` are the drawn bars and embedded steel (SW-DET-*) */
export function finishCivil(id: string, kind: PartSpec['kind'], designation: string, dims: Record<string, Dim>, lengthIn: number, solids: Solid[], material: Material, barList: Bar[], formedIn2: number, notes: string[], extra: Record<string, unknown> = {}, detail: DSolid[] = []): PartSpec {
  const vol = solids.reduce((a, s) => a + signedVolume(s.mesh), 0), wC = vol * RHO_C, wB = barList.reduce((a, b) => a + b.weight, 0);
  return {
    id, kind, category: 'civil', designation,
    dims: {
      ...dims, rho: rhoC(),
      volume: rule(vol / 46656, 'SW-CIV-15', 'Concrete volume', 'yd3'), concreteWeight: rule(wC, 'SW-CIV-15', 'Concrete weight (volume × K-7)', 'lb'),
      formedArea: rule(formedIn2 / 144, 'SW-CIV-15', 'Formed area', 'ft2'), barWeight: rule(wB, 'SW-CIV-15', 'Reinforcing bar weight (K-1)', 'lb'),
    },
    length: drawing(lengthIn, 'Overall length'), material,
    weight: rule(wC + wB, 'SW-CIV-15', 'Concrete plus bars', 'lb'),
    notes: ['Concrete solid at true scale with its bars drawn in place (SW-CIV-15, SW-DET-1).', ...notes],
    extra: { solids: [...solids.map(s => ({ ...s, role: material === GROUT ? 'grout' : 'concrete' })), ...detail.map(d => ({ name: d.name, mesh: d.mesh, role: d.role }))], bars: barList, barsDrawn: detail.filter(d => d.role === 'rebar').map(d => (d as DSolid & { count?: number }).count ?? 0), concreteVolume: vol, ...extra },
  };
}
export const cover = { earth: 3, formed: 2, slab: 1.5 };   // SW-CIV-2

export interface FootingInput { loadKips: number; bearingKsf?: number; pedestalSide: number }
/** SW-CIV-3: square spread footing; z up from the bottom; the pedestal (SW-CIV-4) stands on its top */
export function makeFooting(id: string, inp: FootingInput): PartSpec {
  const q = inp.bearingKsf ?? 3, qDim: Dim = inp.bearingKsf !== undefined ? drawing(inp.bearingKsf, 'Allowable bearing', 'ksf') : rule(3, 'SW-CIV-3a', 'Allowable bearing (default)', 'ksf');
  const B = Math.max(36, roundUpTo(Math.sqrt((1.1 * inp.loadKips) / q) * 12, 6));
  const proj = (B - inp.pedestalSide) / 2, t = roundUpTo(Math.max(12, proj), 3);
  const sMat = Math.min(12, barArea(5) / (0.002 * t)), n = spaced(B, sMat, cover.earth), L = B - 2 * cover.earth + 2 * hookLength(5);
  const mat = [bars(5, n, L, 'bottom mat, x direction, hooked ends'), bars(5, n, L, 'bottom mat, y direction, hooked ends')];
  const d5 = barDiameter(5), e = B / 2 - cover.earth, at = even(-e + d5 / 2, e - d5 / 2, n), z1 = cover.earth + d5 / 2, z2 = z1 + d5;
  const detail = [drawn(mat[0], at.map(y => hookedBarPath([-e, y, z1], [e, y, z1], [0, 0, 1], d5))), drawn(mat[1], at.map(x => hookedBarPath([x, -e, z2], [x, e, z2], [0, 0, 1], d5)))];
  return finishCivil(id, 'FOOTING', `Footing ${B / 12}' × ${B / 12}' × ${t}" (class B)`, {
    P: drawing(inp.loadKips, 'Column load', 'kip'), q: qDim, pedestal: drawing(inp.pedestalSide, 'Pedestal side'),
    B: rule(B, 'SW-CIV-3', 'Plan side (bearing, 1.1 P / q)'), t: rule(t, 'SW-CIV-3', 'Thickness (45° spread from the pedestal face)'),
    barSpacing: rule(sMat, 'SW-CIV-3', 'Mat bar spacing (0.2 % of b·t, ≤ 12 in)'), cover: rule(cover.earth, 'SW-CIV-2', 'Cover (cast against earth)'),
  }, B, [{ name: 'footing', mesh: box(-B / 2, -B / 2, 0, B / 2, B / 2, t) }], CONCRETE_B, mat, 4 * B * t, ['Sides formed, bottom cast against earth.'], { B, t }, detail);
}

export interface PedestalInput { plateN: number; plateB: number; height: number }
/** SW-CIV-4: pedestal over a footing; z up from its bottom (the footing top) */
export function makePedestal(id: string, inp: PedestalInput): PartSpec {
  const a = Math.max(12, roundUpTo(inp.plateN + 12, 2)), b = Math.max(12, roundUpTo(inp.plateB + 12, 2)), h = inp.height;
  const nV = 4 + 2 * (Math.max(0, Math.ceil(a / 12) - 1) + Math.max(0, Math.ceil(b / 12) - 1));
  const nT = Math.max(2, Math.floor((h - 3) / 12) + 1), tieL = 2 * (a + b - 4 * cover.formed) + 2 * hookLength(3);
  const list = [bars(5, nV, h + 12 + hookLength(5), 'verticals, hooked into the footing (12 in embedment)'), bars(3, nT, tieL, 'ties at 12 in, first 3 in below the top')];
  const d5 = barDiameter(5), d3 = barDiameter(3), ins = cover.formed + d3 + d5 / 2, ax = a / 2 - ins, by = b / 2 - ins, ka = Math.max(0, Math.ceil(a / 12) - 1), kb = Math.max(0, Math.ceil(b / 12) - 1), vp: [number, number][] = [[-ax, -by], [ax, -by], [ax, by], [-ax, by]];
  for (const x of even(-ax, ax, ka + 2).slice(1, -1)) vp.push([x, -by], [x, by]);
  for (const y of even(-by, by, kb + 2).slice(1, -1)) vp.push([-ax, y], [ax, y]);
  const tieIn = cover.formed + d3 / 2, tx = a / 2 - tieIn, ty = b / 2 - tieIn;
  const rodD = 0.75, rx = inp.plateN / 2 - 1.5, ry = inp.plateB / 2 - 1.5, proj = 1.5 + 1 + 0.375 + 0.75 + 0.25;
  const detail: DSolid[] = [
    drawn(list[0], vp.map(([x, y]) => { const l = Math.hypot(x, y) || 1; return hookedBarPath([x, y, -12], [x, y, h - cover.slab], [x / l, y / l, 0], d5, [true, false]); })),
    drawn(list[1], Array.from({ length: nT }, (_, k) => loopPath([[-tx, -ty, h - 3 - 12 * k], [tx, -ty, h - 3 - 12 * k], [tx, ty, h - 3 - 12 * k], [-tx, ty, h - 3 - 12 * k]], 2 * d3)), true),
    { name: 'anchor rods AR3/4 with washers and nuts (SW-AR-*)', role: 'hardware', mesh: mergeMeshes([[-rx, -ry], [rx, -ry], [rx, ry], [-rx, ry]].map(([x, y]) => anchorRod(x, y, rodD, h - 12, h + proj, h))) },
  ];
  return finishCivil(id, 'PEDESTAL', `Pedestal ${a}" × ${b}" × ${h}" (class B)`, {
    plateN: drawing(inp.plateN, 'Base plate N'), plateB: drawing(inp.plateB, 'Base plate B'), h: drawing(h, 'Height'),
    a: rule(a, 'SW-CIV-4', 'Side (plate + 6 in each way, to 2 in)'), b: rule(b, 'SW-CIV-4', 'Side (plate + 6 in each way, to 2 in)'),
    verticals: rule(nV, 'SW-CIV-4', 'Vertical bars #5', 'count'), ties: rule(nT, 'SW-CIV-4', 'Ties #3', 'count'), cover: rule(cover.formed, 'SW-CIV-2', 'Cover (formed)'),
  }, h, [{ name: 'pedestal', mesh: chamferedPrism(rect(-a / 2, -b / 2, a / 2, b / 2), 0, h, CH) }], CONCRETE_B, list, 2 * (a + b) * h, ['Top edges chamfered 3/4 in (SW-DET-2); anchor rods drawn with nut and washer run down (SW-DET-3).'], { a, b, h }, detail);
}

export interface PadInput { baseW: number; baseL: number; height?: number; pump?: boolean }
/** SW-CIV-5: housekeeping pad on the slab; z up from the slab */
export function makeEquipmentPad(id: string, inp: PadInput): PartSpec {
  const h = inp.height ?? (inp.pump ? 9 : 6), w = inp.baseW + 12, L = inp.baseL + 12;
  const nx = spaced(L, 12, cover.slab), ny = spaced(w, 12, cover.slab), nD = Math.ceil((2 * (w + L)) / 24);
  const list = [bars(4, nx, w - 2 * cover.slab, 'mesh across the width at mid-height'), bars(4, ny, L - 2 * cover.slab, 'mesh along the length at mid-height'), bars(4, nD, 10, 'dowels into the slab, 6 in in, 4 in up, at 24 in round the edge')];
  const d4 = barDiameter(4), ex = L / 2 - cover.slab, ey = w / 2 - cover.slab, perim = alongPerimeter(rect(-L / 2 + 3, -w / 2 + 3, L / 2 - 3, w / 2 - 3), nD);
  const detail = [drawn(list[0], even(-ex + d4 / 2, ex - d4 / 2, nx).map(x => [[x, -ey, h / 2 - d4 / 2], [x, ey, h / 2 - d4 / 2]] as V3[])), drawn(list[1], even(-ey + d4 / 2, ey - d4 / 2, ny).map(y => [[-ex, y, h / 2 + d4 / 2], [ex, y, h / 2 + d4 / 2]] as V3[])),
    drawn(list[2], perim.map(q => [[q.x, q.y, -6], [q.x, q.y, 4]] as V3[]))];
  return finishCivil(id, 'PAD', `Equipment pad ${w}" × ${L}" × ${h}" (class B)`, {
    baseW: drawing(inp.baseW, 'Equipment base width'), baseL: drawing(inp.baseL, 'Equipment base length'),
    w: rule(w, 'SW-CIV-5', 'Width (base + 6 in each side)'), L: rule(L, 'SW-CIV-5', 'Length (base + 6 in each side)'), h: inp.height !== undefined ? drawing(h, 'Height') : rule(h, 'SW-CIV-5', inp.pump ? 'Height (pump)' : 'Height'),
    dowels: rule(nD, 'SW-CIV-5', 'Dowels #4', 'count'), cover: rule(cover.slab, 'SW-CIV-2', 'Cover (indoor pad)'),
  }, L, [{ name: 'pad', mesh: chamferedPrism(rect(-L / 2, -w / 2, L / 2, w / 2), 0, h, CH) }], CONCRETE_B, list, 2 * (w + L) * h, ['Top edges chamfered 3/4 in (SW-DET-2).'], { w, L, h }, detail);
}

export interface SlabInput { w: number; L: number; t?: number; thickenedEdge?: boolean }
/** SW-CIV-6: slab on grade; z up from the slab's underside (the thickened edge hangs below) */
export function makeSlab(id: string, inp: SlabInput): PartSpec {
  const t = inp.t ?? 6, edge = inp.thickenedEdge ?? true, w = inp.w, L = inp.L;
  const solids: Solid[] = [{ name: 'slab', mesh: box(0, 0, 0, L, w, t) }];
  if (edge) for (const [x0, y0, x1, y1] of [[0, 0, L, 12], [0, w - 12, L, w], [0, 12, 12, w - 12], [L - 12, 12, L, w - 12]]) solids.push({ name: 'thickened edge', mesh: box(x0, y0, -12, x1, y1, 0) });
  const nx = spaced(L, 18, cover.slab), ny = spaced(w, 18, cover.slab);
  const list = [bars(4, nx, w - 2 * cover.slab, 'mesh across the width at mid-depth'), bars(4, ny, L - 2 * cover.slab, 'mesh along the length at mid-depth')];
  if (edge) list.push(bars(5, 2, 2 * (w + L), 'thickened edge, continuous (two bars)'));
  const d4 = barDiameter(4), c = cover.slab;
  const detail = [drawn(list[0], even(c + d4 / 2, L - c - d4 / 2, nx).map(x => [[x, c, t / 2 - d4 / 2], [x, w - c, t / 2 - d4 / 2]] as V3[])), drawn(list[1], even(c + d4 / 2, w - c - d4 / 2, ny).map(y => [[c, y, t / 2 + d4 / 2], [L - c, y, t / 2 + d4 / 2]] as V3[]))];
  if (edge) detail.push(drawn(list[2], [4, 8].map(o => loopPath([[o, o, -8], [L - o, o, -8], [L - o, w - o, -8], [o, w - o, -8]], 4)), true));
  return finishCivil(id, 'SLAB', `Slab on grade ${(L / 12).toFixed(0)}' × ${(w / 12).toFixed(0)}' × ${t}" (class A)`, {
    w: drawing(w, 'Width'), L: drawing(L, 'Length'), t: inp.t !== undefined ? drawing(t, 'Thickness') : rule(t, 'SW-CIV-6', 'Thickness'),
    edgeW: rule(edge ? 12 : 0, 'SW-CIV-6', 'Thickened edge width'), edgeD: rule(edge ? 12 : 0, 'SW-CIV-6', 'Thickened edge depth below the slab'),
    cover: rule(cover.slab, 'SW-CIV-2', 'Cover (slab)'),
  }, L, solids, CONCRETE_A, list, 2 * (w + L) * (t + (edge ? 12 : 0)), ['On a 6 in compacted granular base (not modeled).'], { w, L, t }, detail);
}

export interface OctagonInput { baseRingOD: number; weightKips: number; bearingKsf?: number; pedestalH: number; rods?: number }
/** SW-CIV-7: octagonal pedestal and footing for a skirt-supported vessel; z up from the footing's bottom */
export function makeOctagonFoundation(id: string, inp: OctagonInput): PartSpec {
  const q = inp.bearingKsf ?? 3, qDim: Dim = inp.bearingKsf !== undefined ? drawing(inp.bearingKsf, 'Allowable bearing', 'ksf') : rule(3, 'SW-CIV-3a', 'Allowable bearing (default)', 'ksf');
  const Fp = roundUpTo(inp.baseRingOD + 12, 2);
  const Ff = Math.max(Fp + 24, roundUpTo(Math.sqrt(((1.1 * inp.weightKips) / q) * 144 / (2 * (Math.SQRT2 - 1))), 6));
  const proj = (Ff - Fp) / 2, t = roundUpTo(Math.max(12, proj), 3);
  const d5 = barDiameter(5), d6 = barDiameter(6), d4 = barDiameter(4), side = (F: number) => F / (1 + Math.SQRT2);
  const sMat = Math.min(12, barArea(5) / (0.002 * t)), n = spaced(Ff, sMat, cover.earth);
  // a mat bar runs the octagon's chord at its offset (shorter near the 45° sides); the list gives the mean length
  const halfChord = (o: number) => (Math.abs(o) <= side(Ff) / 2 ? Ff / 2 : Ff / 2 - (Math.abs(o) - side(Ff) / 2)) - cover.earth;
  const offs = even(-Ff / 2 + cover.earth + d5 / 2, Ff / 2 - cover.earth - d5 / 2, n), L = offs.reduce((a, o) => a + 2 * Math.max(6, halfChord(o)) + 2 * hookLength(5), 0) / n;
  const perim = 8 * side(Fp), nV = Math.max(8, Math.ceil(perim / 12)), nT = Math.max(2, Math.floor((inp.pedestalH - 3) / 12) + 1), top = t + inp.pedestalH;
  const list = [bars(5, n, L, 'footing mat, x direction, hooked ends (mean length; each bar runs its chord)'), bars(5, n, L, 'footing mat, y direction, hooked ends (mean length; each bar runs its chord)'),
    bars(6, nV, inp.pedestalH + 12 + hookLength(6), 'pedestal verticals at 12 in round the perimeter, hooked into the footing'), bars(4, nT, perim - 8 * cover.formed + 2 * hookLength(4), 'pedestal ties at 12 in')];
  const solids: Solid[] = [{ name: 'octagonal footing', mesh: extrude({ outer: octagon(Ff) }, t, 0) }, { name: 'octagonal pedestal', mesh: chamferedPrism(octagon(Fp), t, top, CH) }];
  const z1 = cover.earth + d5 / 2, vr = alongPerimeter(insetConvex(octagon(Fp), cover.formed + d4 + d6 / 2), nV), tie = insetConvex(octagon(Fp), cover.formed + d4 / 2);
  const rods = Math.max(8, inp.rods ?? 8), bc = inp.baseRingOD / 2 - 3, rodD = 1;
  const detail: DSolid[] = [
    drawn(list[0], offs.map(y => { const hc = Math.max(6, halfChord(y)); return hookedBarPath([-hc, y, z1], [hc, y, z1], [0, 0, 1], d5); })),
    drawn(list[1], offs.map(x => { const hc = Math.max(6, halfChord(x)); return hookedBarPath([x, -hc, z1 + d5], [x, hc, z1 + d5], [0, 0, 1], d5); })),
    drawn(list[2], vr.map(q => hookedBarPath([q.x, q.y, t - 12], [q.x, q.y, top - cover.slab], [q.nx, q.ny, 0], d6, [true, false]))),
    drawn(list[3], Array.from({ length: nT }, (_, k) => loopPath(tie.map(q => [q.x, q.y, top - 3 - 12 * k] as V3), 2 * d4)), true),
    { name: `anchor rods ${rods} × AR1 with washers and nuts (SW-EQ-1, SW-AR-*)`, role: 'hardware', mesh: mergeMeshes(Array.from({ length: rods }, (_, i) => { const a = (2 * Math.PI * (i + 0.5)) / rods; return anchorRod(bc * Math.cos(a), bc * Math.sin(a), rodD, top - 12, top + 10.75, top); })) },
  ];
  return finishCivil(id, 'OCTAGON', `Octagonal foundation ${(Ff / 12).toFixed(1)}' A/F footing, ${(Fp / 12).toFixed(1)}' A/F pedestal (class B)`, {
    baseRingOD: drawing(inp.baseRingOD, 'Vessel base ring OD'), W: drawing(inp.weightKips, 'Operating weight', 'kip'), q: qDim, pedestalH: drawing(inp.pedestalH, 'Pedestal height'),
    Fp: rule(Fp, 'SW-CIV-7', 'Pedestal across flats (base ring + 12 in)'), Ff: rule(Ff, 'SW-CIV-7', 'Footing across flats (bearing)'), t: rule(t, 'SW-CIV-3', 'Footing thickness (45° spread)'),
    verticals: rule(nV, 'SW-CIV-7', 'Pedestal verticals #6', 'count'), cover: rule(cover.earth, 'SW-CIV-2', 'Footing cover (earth)'),
  }, Ff, solids, CONCRETE_B, list, 8 * (Ff / (1 + Math.SQRT2)) * t + perim * inp.pedestalH, ['Anchor rods of the vessel (SW-EQ-1, SW-AR-*) are cast in the pedestal and drawn with their nuts run down (SW-DET-3).', 'Pedestal top chamfered 3/4 in (SW-DET-2).'], { Fp, Ff, t }, detail);
}

export interface RingWallInput { tankD: number; fillPcf?: number }
/** SW-CIV-8: ring wall under a flat-bottom tank; z up from the wall's bottom (grade is at z = 36) */
export function makeRingWall(id: string, inp: RingWallInput): PartSpec {
  const w = 12, H = 42, below = 36, gamma = inp.fillPcf ?? 120, R = inp.tankD / 2;
  const gDim: Dim = inp.fillPcf !== undefined ? drawing(gamma, 'Fill unit weight', 'lb/ft3') : rule(120, 'SW-CIV-8a', 'Fill unit weight (default)', 'lb/ft3');
  const p = 0.3 * gamma * (below / 12), T = 0.5 * p * (below / 12) * (R / 12);   // lb: triangular pressure over the buried height times the radius
  const nHoop = Math.max(4, Math.ceil(T / (0.6 * 60000 * barArea(5)))), circ = 2 * Math.PI * R, nV = Math.ceil(circ / 12);
  const list = [bars(5, nHoop, circ + 24, 'hoop bars (two top, two bottom, more by the hoop tension), lapped 24 in'), bars(4, nV, H - 2 * cover.formed, 'verticals at 12 in')];
  const d5 = barDiameter(5), d4 = barDiameter(4), levels = Math.ceil(nHoop / 2), hz = even(H - 3, 3, levels), hoopPaths: V3[][] = [];
  for (let k = 0; k < nHoop; k++) hoopPaths.push(ringPath(R + (k % 2 ? -1 : 1) * (w / 2 - cover.formed - d4 - d5 / 2), hz[Math.floor(k / 2)], 96));
  const detail = [drawn(list[0], hoopPaths, true), drawn(list[1], Array.from({ length: nV }, (_, i) => { const a = (2 * Math.PI * i) / nV; return [[R * Math.cos(a), R * Math.sin(a), cover.formed], [R * Math.cos(a), R * Math.sin(a), H - cover.formed]] as V3[]; }))];
  const wall = orient(revolve([{ r: R - w / 2, z: 0 }, { r: R + w / 2, z: 0 }, { r: R + w / 2, z: H - CH }, { r: R + w / 2 - CH, z: H }, { r: R - w / 2 + CH, z: H }, { r: R - w / 2, z: H - CH }], 96));
  return finishCivil(id, 'RINGWALL', `Ring wall ${(inp.tankD / 12).toFixed(0)}' tank, ${w}" × ${H}" (class B)`, {
    tankD: drawing(inp.tankD, 'Tank diameter'), gamma: gDim, w: rule(w, 'SW-CIV-8', 'Wall width'), H: rule(H, 'SW-CIV-8', 'Wall height (36 in below grade, 6 in above)'),
    hoopTension: rule(T / 1000, 'SW-CIV-8', 'Hoop tension ½ p H R', 'kip'), hoops: rule(nHoop, 'SW-CIV-8', 'Hoop bars #5', 'count'), cover: rule(cover.formed, 'SW-CIV-2', 'Cover (formed)'),
  }, inp.tankD + w, [{ name: 'ring wall', mesh: wall }], CONCRETE_B, list, 2 * circ * H, ['Inside the ring: compacted granular fill and a 3 in sand cushion (not modeled).', 'Top edges chamfered 3/4 in (SW-DET-2).'], { R, w, H }, detail);
}

export interface PierInput { D: number; loadKips: number; endBearingKsf?: number; frictionKsf?: number }
/** SW-CIV-9: drilled pier; z up from the tip */
export function makeDrilledPier(id: string, inp: PierInput): PartSpec {
  const D = Math.max(18, inp.D), qb = inp.endBearingKsf ?? 10, f = inp.frictionKsf ?? 0.5, A = (Math.PI * D * D) / 4 / 144, circ = (Math.PI * D) / 12;
  const L = Math.max(120, roundUpTo(((1.1 * inp.loadKips) / (qb * A + f * circ)) * 12, 6));
  const nV = Math.max(6, Math.ceil((Math.PI * D) / 6)), cageD = D - 2 * cover.earth, turns = L / 6, spiralL = turns * Math.PI * cageD;
  const list = [bars(6, nV, L - 2 * cover.earth, 'verticals, full length less cover'), bars(3, 1, spiralL, 'spiral at 6 in pitch')];
  const d6 = barDiameter(6), d3 = barDiameter(3), rv = cageD / 2 - d3 - d6 / 2;
  const detail = [drawn(list[0], Array.from({ length: nV }, (_, i) => { const a = (2 * Math.PI * i) / nV; return [[rv * Math.cos(a), rv * Math.sin(a), cover.earth], [rv * Math.cos(a), rv * Math.sin(a), L - cover.earth]] as V3[]; })),
    { name: 'bars #3: spiral at 6 in pitch', role: 'rebar' as const, count: 1, mesh: transformMesh(helixTube(cageD / 2 - d3 / 2, 6, (L - 2 * cover.earth) / 6, d3 / 2, 24, 6), translate(0, 0, cover.earth)) }];
  const n = 48, outer = Array.from({ length: n }, (_, i) => ({ x: (D / 2) * Math.cos((2 * Math.PI * i) / n), y: (D / 2) * Math.sin((2 * Math.PI * i) / n) }));
  return finishCivil(id, 'PIER', `Drilled pier ${D}" dia × ${(L / 12).toFixed(1)}' (class B)`, {
    D: drawing(D, 'Diameter'), P: drawing(inp.loadKips, 'Load', 'kip'),
    qb: inp.endBearingKsf !== undefined ? drawing(qb, 'Allowable end bearing', 'ksf') : rule(10, 'SW-CIV-9a', 'Allowable end bearing (default)', 'ksf'),
    f: inp.frictionKsf !== undefined ? drawing(f, 'Allowable side friction', 'ksf') : rule(0.5, 'SW-CIV-9b', 'Allowable side friction (default)', 'ksf'),
    L: rule(L, 'SW-CIV-9', 'Length (end bearing + side friction, 1.1 P)'), verticals: rule(nV, 'SW-CIV-9', 'Verticals #6 (one per 6 in of circumference)', 'count'), cover: rule(cover.earth, 'SW-CIV-2', 'Cover (earth)'),
  }, L, [{ name: 'pier', mesh: extrude({ outer }, L, 0) }], CONCRETE_B, list, 0, ['Drilled: no formwork.'], { D, L }, detail);
}

export interface GradeBeamInput { L: number; w?: number; d?: number }
/** SW-CIV-10: grade beam; x along the beam, z up from its bottom */
export function makeGradeBeam(id: string, inp: GradeBeamInput): PartSpec {
  const w = inp.w ?? 12, d = inp.d ?? 24, nS = Math.floor(inp.L / 12) + 1;
  const list = [bars(5, 2, inp.L + 2 * hookLength(5), 'top, hooked ends'), bars(5, 2, inp.L + 2 * hookLength(5), 'bottom, hooked ends'), bars(3, nS, 2 * (w + d - 4 * cover.formed) + 2 * hookLength(3), 'stirrups at 12 in')];
  const d5 = barDiameter(5), d3 = barDiameter(3), yb = w / 2 - cover.formed - d3 - d5 / 2, zt = d - cover.formed - d3 - d5 / 2, zb = cover.formed + d3 + d5 / 2, sy = w / 2 - cover.formed - d3 / 2, sz0 = cover.formed + d3 / 2, sz1 = d - cover.formed - d3 / 2;
  const detail = [drawn(list[0], [-yb, yb].map(y => hookedBarPath([cover.formed, y, zt], [inp.L - cover.formed, y, zt], [0, 0, -1], d5))), drawn(list[1], [-yb, yb].map(y => hookedBarPath([cover.formed, y, zb], [inp.L - cover.formed, y, zb], [0, 0, 1], d5))),
    drawn(list[2], even(cover.formed + 1, inp.L - cover.formed - 1, nS).map(x => loopPath([[x, -sy, sz0], [x, sy, sz0], [x, sy, sz1], [x, -sy, sz1]], 2 * d3)), true)];
  return finishCivil(id, 'GRADE_BEAM', `Grade beam ${w}" × ${d}" × ${(inp.L / 12).toFixed(0)}' (class B)`, {
    L: drawing(inp.L, 'Length'), w: inp.w !== undefined ? drawing(w, 'Width') : rule(w, 'SW-CIV-10', 'Width'), d: inp.d !== undefined ? drawing(d, 'Depth') : rule(d, 'SW-CIV-10', 'Depth'),
    stirrups: rule(nS, 'SW-CIV-10', 'Stirrups #3', 'count'), cover: rule(cover.formed, 'SW-CIV-2', 'Cover (formed)'),
  }, inp.L, [{ name: 'grade beam', mesh: box(0, -w / 2, 0, inp.L, w / 2, d) }], CONCRETE_B, list, 2 * inp.L * d, [], { w, d }, detail);
}

/** SW-CIV-11: grout bed under a base plate or base ring; z up from the concrete */
export function makeGroutBed(id: string, plateN: number, plateB: number): PartSpec {
  const t = 1.5, a = plateN + 2, b = plateB + 2;
  return finishCivil(id, 'GROUT', `Grout bed ${a}" × ${b}" × 1-1/2"`, {
    plateN: drawing(plateN, 'Plate N'), plateB: drawing(plateB, 'Plate B'), t: rule(t, 'SW-CIV-11', 'Thickness (SW-BP-5)'), a: rule(a, 'SW-CIV-11', 'Plan (plate + 1 in each side)'), b: rule(b, 'SW-CIV-11', 'Plan (plate + 1 in each side)'),
  }, a, [{ name: 'grout', mesh: box(-a / 2, -b / 2, 0, a / 2, b / 2, t) }], GROUT, [], 0, ['Edges chamfered at 45° (drawn square).'], { a, b, t });
}

/** SW-CIV-12: curb along a slab edge; x along the curb */
export function makeCurb(id: string, L: number): PartSpec {
  return finishCivil(id, 'CURB', `Curb 6" × 6" × ${(L / 12).toFixed(0)}' (class A)`, {
    L: drawing(L, 'Length'), h: rule(6, 'SW-CIV-12', 'Height'), w: rule(6, 'SW-CIV-12', 'Width'),
  }, L, [{ name: 'curb', mesh: chamferedPrism(rect(0, -3, L, 3), 0, 6, CH) }], CONCRETE_A, [bars(4, 1, L, 'continuous')], 2 * L * 6, ['Top edges chamfered 3/4 in (SW-DET-2).'], {}, [drawn(bars(4, 1, L, 'continuous'), [[[cover.slab, 0, 3], [L - cover.slab, 0, 3]]])]);
}
/** SW-CIV-12: paving slab outdoors; z up from its underside */
export function makePaving(id: string, w: number, L: number): PartSpec {
  const t = 4, nx = spaced(L, 18, cover.slab), ny = spaced(w, 18, cover.slab);
  return finishCivil(id, 'PAVING', `Paving ${(L / 12).toFixed(0)}' × ${(w / 12).toFixed(0)}' × 4" (class A)`, {
    w: drawing(w, 'Width'), L: drawing(L, 'Length'), t: rule(t, 'SW-CIV-12', 'Thickness'), cover: rule(cover.slab, 'SW-CIV-2', 'Cover'),
  }, L, [{ name: 'paving', mesh: box(0, 0, 0, L, w, t) }], CONCRETE_A, [bars(4, nx, w - 2 * cover.slab, 'mesh across'), bars(4, ny, L - 2 * cover.slab, 'mesh along')], 2 * (w + L) * t, [], {},
    [drawn(bars(4, nx, w - 2 * cover.slab, 'mesh across'), even(cover.slab + 0.25, L - cover.slab - 0.25, nx).map(x => [[x, cover.slab, t / 2 - 0.25], [x, w - cover.slab, t / 2 - 0.25]] as V3[])), drawn(bars(4, ny, L - 2 * cover.slab, 'mesh along'), even(cover.slab + 0.25, w - cover.slab - 0.25, ny).map(y => [[cover.slab, y, t / 2 + 0.25], [L - cover.slab, y, t / 2 + 0.25]] as V3[]))]);
}

export interface TrenchInput { L: number; w?: number; d?: number }
/** SW-DET-4: a grating cover drawn bar by bar (SW-GR-1): bearing bars across the opening (along y) at 1-1/2 in, cross bars along x at 4 in; top at z = zTop */
export function gratingCover(x0: number, x1: number, y0: number, y1: number, zTop: number): MeshData {
  const parts: MeshData[] = [], nb = Math.max(2, Math.floor((x1 - x0) / 1.5)), nc = Math.max(2, Math.floor((y1 - y0) / 4));
  for (const x of even(x0 + 0.1, x1 - 0.1 - 0.1875, nb)) parts.push(boxMesh(x, y0, zTop - 1.5, x + 0.1875, y1, zTop));
  for (const y of even(y0 + 1, y1 - 1.25, nc)) parts.push(boxMesh(x0, y, zTop - 0.25, x1, y + 0.25, zTop));
  return mergeMeshes(parts);
}
/** SW-CIV-13: floor trench with a grating cover on an angle frame; x along the trench, z up from the bottom slab's underside */
export function makeTrench(id: string, inp: TrenchInput): PartSpec {
  const w = inp.w ?? 18, d = inp.d ?? 24, L = inp.L, wall = 6, top = wall + d, seat = top - 1.75;
  // the U section with a ledge 2 in wide and 1-3/4 in deep each side for the cover (SW-DET-4), extruded along x
  const sec: Polygon = [[-w / 2 - wall, 0], [w / 2 + wall, 0], [w / 2 + wall, top], [w / 2 + 2, top], [w / 2 + 2, seat], [w / 2, seat], [w / 2, wall], [-w / 2, wall], [-w / 2, seat], [-w / 2 - 2, seat], [-w / 2 - 2, top], [-w / 2 - wall, top]].map(([y, z]) => ({ x: -z, y }));
  const along = (m: MeshData) => orient(transformMesh(m, [0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1]));   // local z → x, local x → −z
  const solids: Solid[] = [{ name: 'trench', mesh: along(extrude({ outer: sec }, L, 0)) }];
  const nWall = spaced(d + wall, 12, cover.formed) + 1, nBot = spaced(w + 2 * wall, 12, cover.formed), nAlong = 2 * nWall + nBot, nAcross = spaced(L, 12, cover.formed);
  const list = [bars(4, nAlong, L - 2 * cover.formed, 'longitudinal bars in the walls and bottom at 12 in'), bars(4, nAcross, 2 * (d + wall) + w + 2 * wall - 6 * cover.formed, 'U-shaped bars across at 12 in')];
  const yw = w / 2 + wall / 2, zb = wall / 2, lp: V3[][] = [];
  for (const sgn of [-1, 1]) for (const z of even(zb + 3, seat - 3, nWall)) lp.push([[cover.formed, sgn * yw, z], [L - cover.formed, sgn * yw, z]]);
  for (const y of even(-yw + 3, yw - 3, nBot)) lp.push([[cover.formed, y, zb], [L - cover.formed, y, zb]]);
  const uBars = even(cover.formed + 0.5, L - cover.formed - 0.5, nAcross).map(x => [[x, -yw - 0.5, seat - 2], [x, -yw - 0.5, zb + 0.5], [x, -yw, zb - 0.5], [x, yw, zb - 0.5], [x, yw + 0.5, zb + 0.5], [x, yw + 0.5, seat - 2]] as V3[]);
  const frame = mergeMeshes([-1, 1].flatMap(sgn => [boxMesh(0, Math.min(sgn * w / 2, sgn * (w / 2 + 2)), seat, L, Math.max(sgn * w / 2, sgn * (w / 2 + 2)), seat + 0.25), boxMesh(0, Math.min(sgn * w / 2, sgn * (w / 2 + 0.25)), seat - 1.75, L, Math.max(sgn * w / 2, sgn * (w / 2 + 0.25)), seat)]));
  const grating = gratingCover(0, L, -w / 2 - 1.875, w / 2 + 1.875, top);
  const detail: DSolid[] = [drawn(list[0], lp), drawn(list[1], uBars), { name: 'cover frame L2x2x1/4 (nosing angle each side)', role: 'galv', mesh: frame }, { name: 'grating cover (SW-GR-1)', role: 'galv', mesh: grating }];
  const frameL = 2 * L, gratingLb = signedVolume(grating) * RHO_S;
  return finishCivil(id, 'TRENCH', `Trench ${w}" × ${d}" × ${(L / 12).toFixed(0)}' with grating cover (class B)`, {
    L: drawing(L, 'Length'), w: inp.w !== undefined ? drawing(w, 'Inside width') : rule(w, 'SW-CIV-13', 'Inside width'), d: inp.d !== undefined ? drawing(d, 'Inside depth') : rule(d, 'SW-CIV-13', 'Inside depth'),
    wall: rule(wall, 'SW-CIV-13', 'Wall and bottom thickness'), frame: rule(frameL, 'SW-CIV-13', 'Cover frame L2x2x1/4, total length'), gratingWeight: rule(gratingLb, 'SW-CIV-13', 'Grating cover weight (drawn bars, SW-GR-1)', 'lb'),
  }, L, solids, CONCRETE_B, list, 2 * L * (d + wall) + 2 * L * d, ['Grating cover and its L2x2x1/4 frame are structural catalogue parts (SW-GR-*, SW-L-*), drawn in place (SW-DET-4) and listed by weight.'], { w, d, wall }, detail);
}
export interface SumpInput { w?: number; L?: number; d?: number }
/** SW-CIV-13: sump; z up from the bottom slab's underside */
export function makeSump(id: string, inp: SumpInput = {}): PartSpec {
  const w = inp.w ?? 24, L = inp.L ?? 24, d = inp.d ?? 24, wall = 8, top = wall + d, seat = top - 1.75;
  const solids: Solid[] = [{ name: 'sump bottom', mesh: box(-L / 2 - wall, -w / 2 - wall, 0, L / 2 + wall, w / 2 + wall, wall) },
    { name: 'sump walls', mesh: extrude({ outer: rect(-L / 2 - wall, -w / 2 - wall, L / 2 + wall, w / 2 + wall), inner: rect(-L / 2, -w / 2, L / 2, w / 2) }, d - 1.75, wall) },
    { name: 'sump rim (cover ledge)', mesh: extrude({ outer: rect(-L / 2 - wall, -w / 2 - wall, L / 2 + wall, w / 2 + wall), inner: rect(-L / 2 - 2, -w / 2 - 2, L / 2 + 2, w / 2 + 2) }, 1.75, seat) }];
  const nV = Math.ceil((2 * (w + L + 4 * wall)) / 12), nH = Math.ceil((d + wall) / 12) + 1, nB = spaced(w + 2 * wall, 12, cover.formed);
  const list = [bars(4, nV, d + wall - 2 * cover.formed + hookLength(4), 'wall verticals at 12 in, hooked into the bottom'), bars(4, nH, 2 * (w + L + 4 * wall) - 8 * cover.formed + 2 * hookLength(4), 'wall horizontals at 12 in'), bars(4, 2 * nB, L + 2 * wall - 2 * cover.formed, 'bottom mat each way')];
  const cl = rect(-L / 2 - wall / 2, -w / 2 - wall / 2, L / 2 + wall / 2, w / 2 + wall / 2), d4 = barDiameter(4), ex = L / 2 + wall - cover.formed, ey = w / 2 + wall - cover.formed;
  const detail: DSolid[] = [
    drawn(list[0], alongPerimeter(cl, nV).map(q => hookedBarPath([q.x, q.y, cover.formed], [q.x, q.y, seat - 1], [-q.nx, -q.ny, 0], d4, [true, false]))),
    drawn(list[1], even(cover.formed + 1, seat - 2, nH).map(z => loopPath(insetConvex(cl, -0.5).map(q => [q.x, q.y, z] as V3), 2)), true),
    drawn(list[2], [...even(-ey, ey, nB).map(y => [[-ex, y, wall / 2 - d4 / 2], [ex, y, wall / 2 - d4 / 2]] as V3[]), ...even(-ex, ex, nB).map(x => [[x, -ey, wall / 2 + d4 / 2], [x, ey, wall / 2 + d4 / 2]] as V3[])]),
    { name: 'cover frame L2x2x1/4', role: 'galv', mesh: mergeMeshes([extrude({ outer: rect(-L / 2 - 2, -w / 2 - 2, L / 2 + 2, w / 2 + 2), inner: rect(-L / 2, -w / 2, L / 2, w / 2) }, 0.25, seat), extrude({ outer: rect(-L / 2 - 0.25, -w / 2 - 0.25, L / 2 + 0.25, w / 2 + 0.25), inner: rect(-L / 2, -w / 2, L / 2, w / 2) }, 1.75, seat - 1.75)]) },
    { name: 'grating cover (SW-GR-1)', role: 'galv', mesh: gratingCover(-L / 2 - 1.875, L / 2 + 1.875, -w / 2 - 1.875, w / 2 + 1.875, top) },
  ];
  return finishCivil(id, 'SUMP', `Sump ${L}" × ${w}" × ${d}" inside (class B)`, {
    w: inp.w !== undefined ? drawing(w, 'Inside width') : rule(w, 'SW-CIV-13', 'Inside width'), L: inp.L !== undefined ? drawing(L, 'Inside length') : rule(L, 'SW-CIV-13', 'Inside length'), d: inp.d !== undefined ? drawing(d, 'Inside depth') : rule(d, 'SW-CIV-13', 'Inside depth'),
    wall: rule(wall, 'SW-CIV-13', 'Wall and bottom thickness'), cover: rule(cover.formed, 'SW-CIV-2', 'Cover (formed)'),
  }, L + 2 * wall, solids, CONCRETE_B, list, 2 * (2 * (w + L) + 4 * wall) * d, ['Grating cover on an L2x2x1/4 frame, drawn in place (SW-DET-4).'], { w, L, d, wall }, detail);
}

export interface DikeInput { planW: number; planL: number; tanks: { D: number; H: number }[] }
/** SW-CIV-14: containment dike round tanks; x along the length, y across, z up from the footing's bottom (grade) */
export function makeDike(id: string, inp: DikeInput): PartSpec {
  const wall = 8, fW = 24, fD = 12, largest = Math.max(...inp.tanks.map(t => (Math.PI * t.D * t.D * t.H) / 4)), footprints = inp.tanks.reduce((a, t) => a + (Math.PI * t.D * t.D) / 4, 0);
  const area = inp.planL * inp.planW - footprints, Hraw = (1.1 * largest) / area, H = Math.min(72, Math.max(18, roundUpTo(Hraw, 6)));
  const perim = 2 * (inp.planL + inp.planW);
  const solids: Solid[] = [
    { name: 'dike footing', mesh: extrude({ outer: rect(-fW / 2, -fW / 2, inp.planL + fW / 2, inp.planW + fW / 2), inner: rect(fW / 2, fW / 2, inp.planL - fW / 2, inp.planW - fW / 2) }, fD, 0) },
    { name: 'dike wall', mesh: extrude({ outer: rect(-wall / 2, -wall / 2, inp.planL + wall / 2, inp.planW + wall / 2), inner: rect(wall / 2, wall / 2, inp.planL - wall / 2, inp.planW - wall / 2) }, H - CH, fD) },
    { name: 'dike wall top (chamfered)', mesh: ringFrustum(rect(-wall / 2, -wall / 2, inp.planL + wall / 2, inp.planW + wall / 2), rect(wall / 2, wall / 2, inp.planL - wall / 2, inp.planW - wall / 2), rect(-wall / 2 + CH, -wall / 2 + CH, inp.planL + wall / 2 - CH, inp.planW + wall / 2 - CH), rect(wall / 2 - CH, wall / 2 - CH, inp.planL - wall / 2 + CH, inp.planW - wall / 2 + CH), fD + H - CH, fD + H) },
  ];
  const nV = Math.ceil(perim / 12), nH = Math.ceil(H / 12) + 1;
  const list = [bars(4, nV, H + fD - 2 * cover.formed + hookLength(4), 'wall verticals at 12 in, hooked into the footing'), bars(4, nH, perim + 24, 'wall horizontals at 12 in'), bars(5, 2, perim + 24, 'footing, continuous (two bars)')];
  const cl = rect(0, 0, inp.planL, inp.planW), d4 = barDiameter(4);
  const detail: DSolid[] = [
    drawn(list[0], alongPerimeter(cl, nV).map(q => hookedBarPath([q.x, q.y, cover.earth], [q.x, q.y, fD + H - cover.formed], [q.nx, q.ny, 0], d4, [true, false]))),
    drawn(list[1], even(fD + 2, fD + H - 3, nH).map(z => loopPath(cl.map(q => [q.x, q.y, z] as V3), 2)), true),
    drawn(list[2], [-6, 6].map(o => loopPath(insetConvex(cl, o).map(q => [q.x, q.y, cover.earth + 0.5] as V3), 3)), true),
  ];
  return finishCivil(id, 'DIKE', `Containment dike ${(inp.planL / 12).toFixed(0)}' × ${(inp.planW / 12).toFixed(0)}', wall ${H}" high (class B)`, {
    planL: drawing(inp.planL, 'Diked plan length'), planW: drawing(inp.planW, 'Diked plan width'), tanks: drawing(inp.tanks.length, 'Tanks inside', 'count'),
    H: rule(H, 'SW-CIV-14', 'Wall height (1.1 × the largest tank, 18 to 72 in)'), wall: rule(wall, 'SW-CIV-14', 'Wall thickness'), fW: rule(fW, 'SW-CIV-14', 'Footing width'), fD: rule(fD, 'SW-CIV-14', 'Footing depth'),
    holds: rule((area * H) / (largest || 1), 'SW-CIV-14', 'Dike volume / largest tank volume', 'count'),
  }, inp.planL, solids, CONCRETE_B, list, 2 * perim * H + 2 * perim * fD, ['Wall top chamfered 3/4 in (SW-DET-2).'], { H, wall }, detail);
}
