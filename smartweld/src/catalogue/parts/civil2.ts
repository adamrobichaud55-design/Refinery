/**
 * Further civil and concrete items: DESIGN_BASIS.md §73 (SW-CIV-17..28). Catalogue items only. True-scale concrete with
 * the bars drawn in place and quantities by SW-CIV-15. SmartWeld's own proportions (PROVENANCE P-78). z up.
 */
import { drawing, rule, type Dim } from '../../core/basis';
import { K } from '../../core/constants';
import { roundUpTo } from '../../core/units';
import type { PartSpec } from '../part';
import { extrude, mergeMeshes, helixTube, transformMesh, type MeshData } from '../../geometry/mesh';
import { rect, circle } from '../../geometry/polygon';
import { ringAroundHole } from '../../geometry/profiles';
import { translate, multiply, rotateX, rotateY } from '../../geometry/transform';
import { sweep, hookedBarPath, loopPath, ringPath, chamferedPrism, boxMesh, orient, type V3, type DSolid } from './detailKit';
import { bars, barDiameter, hookLength, finishCivil, drawn, even, spaced, cover, anchorRod, gratingCover, alongPerimeter, makeSump, CONCRETE_A, CONCRETE_B, type Bar } from './civil';
import { tube, cylZ, SHAFT_X_UP_Z } from './equipmentKit';
import { straightRail } from './processUnits';

interface Mat { list: Bar[]; detail: DSolid[] }
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const join = (...m: Mat[]): Mat => ({ list: m.flatMap(q => q.list), detail: m.flatMap(q => q.detail) });
const X: V3 = [1, 0, 0], Y: V3 = [0, 1, 0], Z: V3 = [0, 0, 1];
/** SW-CIV-17: bars #n at spacing s each way in the plane through o spanned by unit vectors u (over Lu) and v (over Lv), c in from the edges */
export function planeMat(n: number, o: V3, u: V3, v: V3, Lu: number, Lv: number, note: string, s = 12, c = 2): Mat {
  const d = barDiameter(n), w = cross(u, v), nu = spaced(Lv, s, c), nv = spaced(Lu, s, c);
  const P = (a: number, b: number, k: number): V3 => [o[0] + u[0] * a + v[0] * b + w[0] * k, o[1] + u[1] * a + v[1] * b + w[1] * k, o[2] + u[2] * a + v[2] * b + w[2] * k];
  const lu = bars(n, nu, Lu - 2 * c, `${note}, one way`), lv = bars(n, nv, Lv - 2 * c, `${note}, the other way`);
  return { list: [lu, lv], detail: [drawn(lu, even(c, Lv - c, nu).map(b => [P(c, b, -d / 2), P(Lu - c, b, -d / 2)])), drawn(lv, even(c, Lu - c, nv).map(a => [P(a, c, d / 2), P(a, Lv - c, d / 2)]))] };
}
interface Hole { a0: number; a1: number; b0: number; b1: number }
/** as planeMat over a rectangle a0..a1 × b0..b1 with openings: a bar that would cross an opening stops 2 in short of it each side */
export function holedMat(n: number, at: (a: number, b: number, k: number) => V3, a0: number, a1: number, b0: number, b1: number, holes: Hole[], note: string, s = 12, c = 2): Mat {
  const d = barDiameter(n), groups = new Map<string, { len: number; paths: V3[][]; way: string }>();
  const add = (way: string, p: V3, q: V3, len: number) => { const k = `${way}|${len.toFixed(2)}`, g = groups.get(k) ?? { len, paths: [], way }; g.paths.push([p, q]); groups.set(k, g); };
  const run = (way: 'one way' | 'the other way', lo: number, hi: number, pos: number[], cuts: (p: number) => [number, number][], pt: (along: number, p: number) => V3) => {
    for (const p of pos) { let start = lo + c; for (const [h0, h1] of cuts(p).sort((x, y) => x[0] - y[0])) { if (h0 - 2 - start > 6) add(way, pt(start, p), pt(h0 - 2, p), h0 - 2 - start); start = h1 + 2; } if (hi - c - start > 6) add(way, pt(start, p), pt(hi - c, p), hi - c - start); }
  };
  run('one way', a0, a1, even(b0 + c, b1 - c, spaced(b1 - b0, s, c)), b => holes.filter(h => b > h.b0 - 1 && b < h.b1 + 1).map(h => [h.a0, h.a1]), (a, b) => at(a, b, -d / 2));
  run('the other way', b0, b1, even(a0 + c, a1 - c, spaced(a1 - a0, s, c)), a => holes.filter(h => a > h.a0 - 1 && a < h.a1 + 1).map(h => [h.b0, h.b1]), (b, a) => at(a, b, d / 2));
  const list: Bar[] = [], detail: DSolid[] = [];
  for (const g of groups.values()) { const b = bars(n, g.paths.length, g.len, `${note}, ${g.way}${holes.length ? ', stopped at openings' : ''}`); list.push(b); detail.push(drawn(b, g.paths)); }
  return { list, detail };
}
const def = (v: number | undefined, d: number, id: string, label: string, unit?: Parameters<typeof rule>[3]): Dim => (v !== undefined ? drawing(v, label, unit) : rule(d, id, label, unit));
const pipeAlong = (axis: 'x' | 'y', OD: number, wall: number, from: number, to: number, p: [number, number]): MeshData => transformMesh(tube(OD / 2, wall, to - from, 0), axis === 'x' ? multiply(translate(from, p[0], p[1]), rotateY(Math.PI / 2)) : multiply(translate(p[0], from, p[1]), rotateX(-Math.PI / 2)));

// ---- SW-CIV-18: pile cap ---------------------------------------------------------------------------------------------------------------
export interface PileCapInput { perSide?: 2 | 3; pileD?: number; pileL: number }
export function makePileCap(id: string, inp: PileCapInput): PartSpec {
  const n = inp.perSide ?? 2, d = inp.pileD ?? 16, Lp = inp.pileL, sp = 3 * d, B = (n - 1) * sp + d + 18, t = Math.max(30, roundUpTo(sp, 3)), z0 = Lp - 6, zt = z0 + t, e = B / 2 - cover.earth;
  const pos: [number, number][] = []; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) pos.push([(i - (n - 1) / 2) * sp, (j - (n - 1) / 2) * sp]);
  const nV = Math.max(6, Math.ceil((Math.PI * d) / 6)), cageD = d - 2 * cover.earth, d6 = barDiameter(6), d3 = barDiameter(3), d7 = barDiameter(7), rv = cageD / 2 - d3 - d6 / 2, vL = z0 + 6 + 24 - cover.earth, spiralL = ((z0 - cover.earth) / 6) * Math.PI * cageD, nb = spaced(B, 8, cover.earth);
  const cage = [bars(6, nV * pos.length, vL, 'pile verticals, 24 in into the cap'), bars(3, pos.length, spiralL, 'pile spirals at 6 in pitch')], bot = [bars(7, nb, B - 2 * cover.earth + 2 * hookLength(7), 'cap bottom mat, x direction, hooked up'), bars(7, nb, B - 2 * cover.earth + 2 * hookLength(7), 'cap bottom mat, y direction, hooked up')];
  const zb = z0 + 6 + cover.earth + d7 / 2, at = even(-e + d7 / 2, e - d7 / 2, nb), top = planeMat(5, [-B / 2, -B / 2, zt - cover.formed - barDiameter(5)], X, Y, B, B, 'cap top mat', 12, cover.formed);
  const detail: DSolid[] = [
    drawn(cage[0], pos.flatMap(([x, y]) => Array.from({ length: nV }, (_, i) => { const a = (2 * Math.PI * i) / nV; return [[x + rv * Math.cos(a), y + rv * Math.sin(a), cover.earth], [x + rv * Math.cos(a), y + rv * Math.sin(a), cover.earth + vL]] as V3[]; }))),
    { name: 'bars #3: pile spirals at 6 in pitch', role: 'rebar', count: pos.length, mesh: mergeMeshes(pos.map(([x, y]) => transformMesh(helixTube(cageD / 2 - d3 / 2, 6, (z0 - cover.earth) / 6, d3 / 2, 16, 6), translate(x, y, cover.earth)))) } as DSolid,
    drawn(bot[0], at.map(y => hookedBarPath([-e, y, zb], [e, y, zb], Z, d7))), drawn(bot[1], at.map(x => hookedBarPath([x, -e, zb + d7], [x, e, zb + d7], Z, d7))), ...top.detail,
  ];
  return finishCivil(id, 'PILE_CAP', `Pile cap ${B}" × ${B}" × ${t}" on ${pos.length} piles ${d}" dia × ${(Lp / 12).toFixed(0)}' (class B)`, {
    piles: rule(pos.length, 'SW-CIV-18', 'Piles', 'count'), pileD: def(inp.pileD, 16, 'SW-CIV-18', 'Pile diameter'), pileL: drawing(Lp, 'Pile length'), spacing: rule(sp, 'SW-CIV-18', 'Pile spacing (3 d)'), B: rule(B, 'SW-CIV-18', 'Cap side (outer piles + d/2 + 9 in)'), t: rule(t, 'SW-CIV-18', 'Cap thickness (the pile spacing, 30 in least)'),
    embed: rule(6, 'SW-CIV-18', 'Piles let into the cap'), verticals: rule(nV, 'SW-CIV-9', 'Pile verticals #6 (one per 6 in of circumference)', 'count'), cover: rule(cover.earth, 'SW-CIV-2', 'Cover (earth)'),
  }, zt, [{ name: 'cap', mesh: chamferedPrism(rect(-B / 2, -B / 2, B / 2, B / 2), z0, zt, 0.75) }, ...pos.map(([x, y]) => ({ name: 'pile', mesh: extrude({ outer: circle(x, y, d / 2, 32) }, z0, 0) }))], CONCRETE_B, [...cage, ...bot, ...top.list], 4 * B * t, ['Piles are drawn to the cap\'s underside; their heads are 6 in inside it. Cap sides formed; piles cast in the ground.'], { B, t }, detail);
}
// ---- SW-CIV-19: cantilever retaining wall ----------------------------------------------------------------------------------------------
export function makeRetainingWall(id: string, inp: { H: number; L: number }): PartSpec {
  const { H, L } = inp, t = Math.max(12, roundUpTo(H / 10, 1)), B = roundUpTo(0.6 * (H + t), 6), toe = B / 3, hs = 12 + H + 6, zt = t + hs, d5 = barDiameter(5), d4 = barDiameter(4), xb = toe + t - cover.formed - d5 / 2, nL = spaced(L, 12, 2), nH = spaced(hs, 12, 3), nB = spaced(B, 12, 3), ys = even(2, L - 2, nL);
  const list = [bars(5, nL, zt - cover.formed - cover.earth + hookLength(5), 'stem verticals on the earth face, hooked into the heel'), bars(4, nH, L - 4, 'stem horizontals'), bars(5, nL, B - 2 * cover.earth, 'base bottom, across'), bars(5, nL, B - toe - cover.formed - cover.earth, 'heel top, across'), bars(4, nB, L - 4, 'base longitudinals')];
  const detail: DSolid[] = [drawn(list[0], ys.map(y => hookedBarPath([xb, y, cover.earth + d5], [xb, y, zt - cover.formed], X, d5, [true, false]))), drawn(list[1], even(t + 3, zt - 3, nH).map(z => [[xb - d5 / 2 - d4 / 2, 2, z], [xb - d5 / 2 - d4 / 2, L - 2, z]] as V3[])),
    drawn(list[2], ys.map(y => [[cover.earth, y, cover.earth + d5 / 2], [B - cover.earth, y, cover.earth + d5 / 2]] as V3[])), drawn(list[3], ys.map(y => [[toe + cover.formed, y, t - cover.formed - d5 / 2], [B - cover.earth, y, t - cover.formed - d5 / 2]] as V3[])), drawn(list[4], even(3, B - 3, nB).map(x => [[x, 2, cover.earth + d5 + d4 / 2], [x, L - 2, cover.earth + d5 + d4 / 2]] as V3[]))];
  return finishCivil(id, 'RETAINING_WALL', `Retaining wall, ${(H / 12).toFixed(0)}' retained × ${(L / 12).toFixed(0)}' long (class B)`, {
    H: drawing(H, 'Retained height'), L: drawing(L, 'Length'), stem: rule(t, 'SW-CIV-19', 'Stem thickness (H / 10, 12 in least)'), base: rule(B, 'SW-CIV-19', 'Base width (0.6 × (H + base thickness))'), baseT: rule(t, 'SW-CIV-19', 'Base thickness (= stem)'), toe: rule(toe, 'SW-CIV-19', 'Toe (a third of the base)'), heel: rule(B - toe - t, 'SW-CIV-19', 'Heel'),
    toeCover: rule(12, 'SW-CIV-19', 'Earth over the toe'), freeboard: rule(6, 'SW-CIV-19', 'Stem above the retained grade'), cover: rule(cover.formed, 'SW-CIV-2', 'Cover (formed)'),
  }, L, [{ name: 'base', mesh: boxMesh(0, 0, 0, B, L, t) }, { name: 'stem', mesh: boxMesh(toe, 0, t, toe + t, L, zt) }], CONCRETE_B, list, 2 * hs * L + 2 * t * hs + 2 * t * L + 2 * t * B, ['The earth is retained on the heel side and is not drawn.'], { t, B, toe }, detail);
}
// ---- SW-CIV-20: catch basin ------------------------------------------------------------------------------------------------------------
export function makeCatchBasin(id: string, inp: { w?: number; L?: number; d?: number } = {}): PartSpec {
  const w = inp.w ?? 24, L = inp.L ?? 24, d = inp.d ?? 36, s = makeSump(id, { w, L, d }), wall = 8, zc = wall + 12 + 4.3125;
  const pipe: DSolid = { name: 'outlet pipe 8 in', role: 'pipe', mesh: pipeAlong('x', 8.625, 0.322, L / 2 - 2, L / 2 + wall + 12, [0, zc]) };
  return { ...s, designation: `Catch basin ${L}" × ${w}" × ${d}" inside with 8" outlet (class B)`, dims: { ...s.dims, d: def(inp.d, 36, 'SW-CIV-20', 'Inside depth'), outlet: rule(8, 'SW-CIV-20', 'Outlet pipe'), invert: rule(12, 'SW-CIV-20', 'Outlet invert above the floor') }, notes: [...s.notes, 'The outlet pipe is steel and is not in the concrete weight.'], extra: { ...s.extra, solids: [...(s.extra!.solids as DSolid[]), pipe] } };
}
// ---- SW-CIV-21: manhole ----------------------------------------------------------------------------------------------------------------
export function makeManhole(id: string, inp: { ID?: number; depth: number }): PartSpec {
  const ID = inp.ID ?? 48, Dp = inp.depth, Ri = ID / 2, wall = 8, Ro = Ri + wall, Rb = Ro + 6, zs = 8 + Dp, zt = zs + 8, xo = Ri - 13, rm = Ri + wall / 2, d4 = barDiameter(4);
  const solids = [{ name: 'base slab', mesh: extrude({ outer: circle(0, 0, Rb, 64) }, 8, 0) }, { name: 'wall', mesh: extrude({ outer: circle(0, 0, Ro, 64), inner: circle(0, 0, Ri, 64) }, Dp, 8) }, { name: 'top slab', mesh: orient(extrude({ outer: circle(0, 0, Ro, 64), inner: circle(xo, 0, 12, 64) }, 8, zs)) }];
  const nV = Math.ceil((2 * Math.PI * rm) / 12), nH = Math.floor(Dp / 12) + 1, chord = (R: number, p: number) => Math.sqrt(Math.max(R * R - p * p, 0));
  const disc = (R: number, z: number, skip: (way: 'x' | 'y', p: number) => boolean): V3[][] => { const out: V3[][] = [], pos = even(-R + 3, R - 3, spaced(2 * R, 12, 3)); for (const p of pos) { const h = chord(R, p) - 1; if (h < 4) continue; if (!skip('x', p)) out.push([[-h, p, z - d4 / 2], [h, p, z - d4 / 2]]); if (!skip('y', p)) out.push([[p, -h, z + d4 / 2], [p, h, z + d4 / 2]]); } return out; };
  const pb = disc(Rb - 3, 4, () => false), ptop = disc(Ro - 3, zs + 4, (way, p) => (way === 'x' ? Math.abs(p) < 13 : Math.abs(p - xo) < 13)), mean = (ps: V3[][]) => ps.reduce((a, q) => a + Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]), 0) / ps.length;
  const trim: V3[][] = [[[xo - 14, -14, zs + 4], [xo + 14, -14, zs + 4]], [[xo - 14, 14, zs + 4], [xo + 14, 14, zs + 4]], [[xo - 14, -14, zs + 4.5], [xo - 14, 14, zs + 4.5]], [[xo + 14, -chord(Ro - 3, xo + 14) + 1, zs + 4.5], [xo + 14, chord(Ro - 3, xo + 14) - 1, zs + 4.5]]];
  const list = [bars(4, nV, zt - 5, 'wall verticals at 12 in'), bars(4, nH, 2 * Math.PI * (rm + d4), 'wall hoops at 12 in'), bars(4, pb.length, mean(pb), 'base slab, each way (mean length)'), bars(4, ptop.length, mean(ptop), 'top slab, each way (mean length), omitted at the opening'), bars(4, 4, 28, 'top slab trimmers round the opening')];
  const rungs: MeshData[] = []; for (let z = 8 + 12; z <= zs - 6; z += 12) rungs.push(sweep([[chord(Ri, 8) + 2, -8, z], [Ri - 6, -8, z], [Ri - 6, 8, z], [chord(Ri, 8) + 2, 8, z]], 0.375, 8));
  const detail: DSolid[] = [drawn(list[0], Array.from({ length: nV }, (_, i) => { const a = (2 * Math.PI * (i + 0.5)) / nV; return [[rm * Math.cos(a), rm * Math.sin(a), 3], [rm * Math.cos(a), rm * Math.sin(a), zt - 2]] as V3[]; })), drawn(list[1], even(8 + 3, zs - 3, nH).map(z => ringPath(rm + d4, z, 48)), true), drawn(list[2], pb), drawn(list[3], ptop), drawn(list[4], trim),
    { name: 'frame (cast)', role: 'casting', mesh: transformMesh(extrude({ outer: circle(0, 0, 16, 48), inner: circle(0, 0, 12, 48) }, 4, 0), translate(xo, 0, zt)) }, { name: 'cover 26 in (cast)', role: 'casting', mesh: cylZ(xo, 0, 12.9, zt + 2.5, zt + 4, 48) }, { name: `step rungs RD3/4 (${rungs.length})`, role: 'galv', mesh: mergeMeshes(rungs) },
    { name: 'pipe stubs 12 in', role: 'pipe', mesh: mergeMeshes([pipeAlong('y', 12.75, 0.375, Ri - 2, Ro + 12, [0, 8 + 6 + 6.375]), pipeAlong('y', 12.75, 0.375, -Ro - 12, -Ri + 2, [0, 8 + 6 + 6.375])]) }];
  return finishCivil(id, 'MANHOLE', `Manhole ${ID}" inside × ${(Dp / 12).toFixed(0)}' deep (class B)`, {
    ID: def(inp.ID, 48, 'SW-CIV-21', 'Inside diameter'), depth: drawing(Dp, 'Inside depth'), wall: rule(wall, 'SW-CIV-21', 'Wall thickness'), slab: rule(8, 'SW-CIV-21', 'Base and top slab thickness'), opening: rule(24, 'SW-CIV-21', 'Opening'), cover26: rule(26, 'SW-CIV-21', 'Cover across'), rungs: rule(rungs.length, 'SW-CIV-21', 'Step rungs at 12 in', 'count'), stubs: rule(12, 'SW-CIV-21', 'Pipe stubs, two'),
  }, zt + 4, solids, CONCRETE_B, list, 2 * Math.PI * Ro * (Dp + 8) + 2 * Math.PI * Ri * Dp + Math.PI * Ri * Ri + 2 * Math.PI * Rb * 8, ['Frame, cover, rungs and pipe stubs are not in the concrete weight.'], { ID, Dp }, detail);
}
// ---- SW-CIV-22: pipe sleeper -----------------------------------------------------------------------------------------------------------
export function makeSleeper(id: string, inp: { L: number; h?: number }): PartSpec {
  const L = inp.L, h = inp.h ?? 12, zt = 12 + 12 + h, d5 = barDiameter(5), d3 = barDiameter(3), yb = 6 - cover.formed - d3 - d5 / 2, zlo = 12 + 3, zhi = zt - cover.formed - d3 - d5 / 2, nT = spaced(L, 12, 2), nF = spaced(L, 12, 3);
  const list = [bars(5, 4, L - 4, 'stem longitudinals, two top and two bottom'), bars(3, nT, 2 * (12 + zt - 12 - 4 * cover.formed) + 2 * hookLength(3), 'stem ties at 12 in'), bars(5, 3, L - 6, 'footing longitudinals'), bars(4, nF, 24 - 6, 'footing bars across at 12 in')];
  const studs: MeshData[] = []; for (let x = 6; x < L; x += 12) for (const y of [-1.5, 1.5]) studs.push(cylZ(x, y, 0.25, zt - 4.375, zt - 0.375, 8));
  const detail: DSolid[] = [drawn(list[0], [[-yb, zlo], [yb, zlo], [-yb, zhi], [yb, zhi]].map(([y, z]) => [[2, y, z], [L - 2, y, z]] as V3[])), drawn(list[1], even(2, L - 2, nT).map(x => loopPath([[x, -yb - d5 / 2 - d3 / 2, zlo - d5 / 2 - d3 / 2], [x, yb + d5 / 2 + d3 / 2, zlo - d5 / 2 - d3 / 2], [x, yb + d5 / 2 + d3 / 2, zhi + d5 / 2 + d3 / 2], [x, -yb - d5 / 2 - d3 / 2, zhi + d5 / 2 + d3 / 2]], 2 * d3)), true),
    drawn(list[2], [-8, 0, 8].map(y => [[3, y, 3 + d5 / 2 + barDiameter(4)], [L - 3, y, 3 + d5 / 2 + barDiameter(4)]] as V3[])), drawn(list[3], even(3, L - 3, nF).map(x => [[x, -9, 3 + barDiameter(4) / 2], [x, 9, 3 + barDiameter(4) / 2]] as V3[])),
    { name: 'wear strip PL3/8x6', role: 'steel', mesh: boxMesh(0, -3, zt - 0.375, L, 3, zt + 0.02) }, { name: 'studs 1/2 × 4 at 12 in', role: 'hardware', mesh: mergeMeshes(studs) }];
  return finishCivil(id, 'SLEEPER', `Pipe sleeper ${(L / 12).toFixed(0)}' long, ${h}" above grade (class B)`, { L: drawing(L, 'Length'), h: def(inp.h, 12, 'SW-CIV-22', 'Height above grade'), stem: rule(12, 'SW-CIV-22', 'Stem width'), below: rule(12, 'SW-CIV-22', 'Stem below grade'), footingW: rule(24, 'SW-CIV-22', 'Footing width'), footingD: rule(12, 'SW-CIV-22', 'Footing depth'), strip: rule(6, 'SW-CIV-22', 'Wear strip PL3/8 width') },
    L, [{ name: 'footing', mesh: boxMesh(0, -12, 0, L, 12, 12) }, { name: 'stem', mesh: boxMesh(0, -6, 12, L, 6, zt) }], CONCRETE_B, list, 2 * L * (zt - 12) + 2 * 12 * (zt - 12) + 2 * L * 12, ['The wear strip and its studs are steel, drawn in place.'], { L, h }, detail);
}
// ---- SW-CIV-23: machine foundation block -----------------------------------------------------------------------------------------------
export function makeMachineBlock(id: string, inp: { weightKips: number; baseL: number; baseW: number; reciprocating?: boolean }): PartSpec {
  const { weightKips: Wm, baseL: a, baseW: b } = inp, f = inp.reciprocating ? 5 : 3, c = 3, depthFor = (mg: number) => Math.max(36, roundUpTo((f * Wm * 1000) / K.CONCRETE_DENSITY_LB_IN3 / ((a + 2 * mg) * (b + 2 * mg)), 6));
  let mg = 12; while (depthFor(mg) > 0.6 * (Math.min(a, b) + 2 * mg)) mg += 6;
  const A = a + 2 * mg, Bp = b + 2 * mg, Dp = depthFor(mg);
  const m = join(planeMat(5, [-A / 2, -Bp / 2, Dp - c], X, Y, A, Bp, 'top mat', 12, c), planeMat(5, [-A / 2, -Bp / 2, c + 1], X, Y, A, Bp, 'bottom mat', 12, c), planeMat(5, [-A / 2, -Bp / 2 + c, 0], X, Z, A, Dp, 'side mat, long face', 12, c), planeMat(5, [-A / 2, Bp / 2 - c, 0], X, Z, A, Dp, 'side mat, far long face', 12, c),
    planeMat(5, [-A / 2 + c, -Bp / 2, 0], Y, Z, Bp, Dp, 'side mat, end face', 12, c), planeMat(5, [A / 2 - c, -Bp / 2, 0], Y, Z, Bp, Dp, 'side mat, far end face', 12, c));
  const rods: [number, number][] = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]].map(([sx, sy]) => [sx * (a / 2 - 3), sy * (b / 2 - 3)]);
  const detail: DSolid[] = [...m.detail, { name: 'grout bed 2 in under the machine base', role: 'grout', mesh: chamferedPrism(rect(-a / 2 - 1, -b / 2 - 1, a / 2 + 1, b / 2 + 1), Dp, Dp + 2, 0.5) }, { name: 'anchor rods AR1 with washers and nuts (8)', role: 'hardware', mesh: mergeMeshes(rods.map(([x, y]) => anchorRod(x, y, 1, Dp - 24, Dp + 7, Dp + 3.5))) },
    { name: 'machine base (outline plate)', role: 'steel', mesh: extrude({ outer: rect(-a / 2, -b / 2, a / 2, b / 2), inner: rect(-a / 2 + 6, -b / 2 + 6, a / 2 - 6, b / 2 - 6) }, 1.5, Dp + 2) }];
  return finishCivil(id, 'MACHINE_BLOCK', `Machine foundation block ${(A / 12).toFixed(1)}' × ${(Bp / 12).toFixed(1)}' × ${Dp}" for a ${Wm} kip ${inp.reciprocating ? 'reciprocating' : 'rotating'} machine (class B)`, {
    W: drawing(Wm, 'Machine weight', 'kip'), baseL: drawing(a, 'Machine base length'), baseW: drawing(b, 'Machine base width'), factor: rule(f, 'SW-CIV-23', 'Block weight ÷ machine weight', 'count'), margin: rule(mg, 'SW-CIV-23', 'Block beyond the base each side (12 in, widened while the depth passes 0.6 of the width)'), A: rule(A, 'SW-CIV-23', 'Block length'), B: rule(Bp, 'SW-CIV-23', 'Block width'), depth: rule(Dp, 'SW-CIV-23', 'Block depth (weight ÷ K-7 ÷ plan, 36 in least)'), above: rule(12, 'SW-CIV-23', 'Top above grade'), rods: rule(8, 'SW-CIV-23', 'Anchor rods of 1 in', 'count'), grout: rule(2, 'SW-CIV-23', 'Grout bed'),
  }, A, [{ name: 'block', mesh: chamferedPrism(rect(-A / 2, -Bp / 2, A / 2, Bp / 2), 0, Dp, 0.75) }], CONCRETE_B, m.list, 2 * (A + Bp) * Dp, ['The machine base is shown as an outline plate; the machine is a catalogue item of its own.'], { A, Bp, Dp }, detail);
}
// ---- SW-CIV-24: table-top foundation ---------------------------------------------------------------------------------------------------
export function makeTableTop(id: string, inp: { L: number; W: number; H: number }): PartSpec {
  const { L, W: Wd, H } = inp, c = Math.max(24, roundUpTo(H / 8, 6)), nper = L > 240 ? 3 : 2, sp = (L - c) / (nper - 1), td = Math.max(36, roundUpTo(sp / 4, 6)), tm = td, zd0 = tm + H - td, zd1 = tm + H, hole: Hole = { a0: L / 3, a1: (2 * L) / 3, b0: Wd / 3, b1: (2 * Wd) / 3 }, d8 = 1, d4 = barDiameter(4);
  const cols = even(c / 2, L - c / 2, nper).flatMap(x => [c / 2, Wd - c / 2].map(y => [x, y] as [number, number]));
  const solids = [{ name: 'mat', mesh: boxMesh(-24, -24, 0, L + 24, Wd + 24, tm) }, ...cols.map(([x, y]) => ({ name: 'column', mesh: boxMesh(x - c / 2, y - c / 2, tm, x + c / 2, y + c / 2, zd0) })), { name: 'deck', mesh: extrude({ outer: rect(0, 0, L, Wd), inner: rect(hole.a0, hole.b0, hole.a1, hole.b1) }, td, zd0) }];
  const flat = (z: number) => (a: number, b: number, k: number): V3 => [a, b, z + k];
  const m = join(planeMat(6, [-24, -24, tm - 3], X, Y, L + 48, Wd + 48, 'mat top', 12, 3), planeMat(6, [-24, -24, 4], X, Y, L + 48, Wd + 48, 'mat bottom', 12, 3), holedMat(6, flat(zd1 - 3), 0, L, 0, Wd, [hole], 'deck top', 12, 2), holedMat(6, flat(zd0 + 3), 0, L, 0, Wd, [hole], 'deck bottom', 12, 2));
  const e = c / 2 - cover.formed - d4 - d8 / 2, vp: [number, number][] = [[-e, -e], [0, -e], [e, -e], [e, 0], [e, e], [0, e], [-e, e], [-e, 0]], nT = Math.max(2, Math.floor((zd0 - tm) / 12)), te = c / 2 - cover.formed - d4 / 2;
  const cl = [bars(8, 8 * cols.length, zd1 - 3 - 3, 'column verticals, mat to deck'), bars(4, nT * cols.length, 8 * te + 2 * hookLength(4), 'column ties at 12 in')];
  const detail: DSolid[] = [...m.detail, drawn(cl[0], cols.flatMap(([x, y]) => vp.map(([dx, dy]) => [[x + dx, y + dy, 3], [x + dx, y + dy, zd1 - 3]] as V3[]))), drawn(cl[1], cols.flatMap(([x, y]) => even(tm + 6, zd0 - 6, nT).map(z => loopPath([[x - te, y - te, z], [x + te, y - te, z], [x + te, y + te, z], [x - te, y + te, z]], 2 * d4))), true)];
  const formed = 2 * (L + Wd + 96) * tm + cols.length * 4 * c * (zd0 - tm) + 2 * (L + Wd) * td + (L * Wd - (L / 3) * (Wd / 3)) - cols.length * c * c + 2 * (L / 3 + Wd / 3) * td;
  return finishCivil(id, 'TABLE_TOP', `Table-top foundation, deck ${(L / 12).toFixed(0)}' × ${(Wd / 12).toFixed(0)}' at ${(H / 12).toFixed(0)}' on ${cols.length} columns (class B)`, {
    L: drawing(L, 'Deck length'), W: drawing(Wd, 'Deck width'), H: drawing(H, 'Deck top above grade'), columns: rule(cols.length, 'SW-CIV-24', 'Columns (two per side to 20 ft, three above)', 'count'), column: rule(c, 'SW-CIV-24', 'Column side (H / 8, 24 in least)'), deck: rule(td, 'SW-CIV-24', 'Deck depth (column spacing / 4, 36 in least)'), mat: rule(tm, 'SW-CIV-24', 'Mat depth (= deck)'), matL: rule(L + 48, 'SW-CIV-24', 'Mat length (deck + 24 in each side)'), openL: rule(L / 3, 'SW-CIV-24', 'Deck opening length (a third)'), openW: rule(Wd / 3, 'SW-CIV-24', 'Deck opening width (a third)'),
  }, L + 48, solids, CONCRETE_B, [...m.list, ...cl], formed, ['The mat\'s top is at grade.'], { c, td }, detail);
}
// ---- SW-CIV-25: gravity separator basin ------------------------------------------------------------------------------------------------
export function makeSeparatorBasin(id: string, inp: { channels?: number; w: number; d: number; L: number }): PartSpec {
  const nc = inp.channels ?? 2, { w, d, L: Lc } = inp, hw = d + 12, Li = 60 + Lc + 48, Wi = nc * w + (nc - 1) * 12, zf = 12, zt = zf + hw, xu = 60 + 24, xo = 60 + Lc - 60, xw = 60 + Lc - 12, xs = xo - 24;
  const solids = [{ name: 'base', mesh: boxMesh(-12, -12, 0, Li + 12, Wi + 12, 12) }, { name: 'outer walls', mesh: extrude({ outer: rect(-12, -12, Li + 12, Wi + 12), inner: rect(0, 0, Li, Wi) }, hw, zf) }];
  const mats: Mat[] = [planeMat(5, [-12, -12, 6], X, Y, Li + 24, Wi + 24, 'base', 12, 3), planeMat(5, [-12, -6, zf], X, Z, Li + 24, hw, 'long wall'), planeMat(5, [-12, Wi + 6, zf], X, Z, Li + 24, hw, 'far long wall'), planeMat(5, [-6, -12, zf], Y, Z, Wi + 24, hw, 'inlet end wall'), planeMat(5, [Li + 6, -12, zf], Y, Z, Wi + 24, hw, 'outlet end wall')];
  const skim: MeshData[] = [];
  for (let k = 0; k < nc; k++) {
    const y0 = k * (w + 12);
    if (k > 0) { solids.push({ name: 'dividing wall', mesh: boxMesh(60, y0 - 12, zf, 60 + Lc, y0, zt) }); mats.push(planeMat(5, [60, y0 - 6, zf], X, Z, Lc, hw, `dividing wall ${k}`)); }
    solids.push({ name: 'under-flow baffle', mesh: boxMesh(xu, y0, zf + 24, xu + 8, y0 + w, zt) }, { name: 'oil-retention baffle', mesh: boxMesh(xo, y0, zf + 24, xo + 8, y0 + w, zt) }, { name: 'outlet weir wall', mesh: boxMesh(xw, y0, zf, xw + 12, y0 + w, zf + d - 12) });
    mats.push(planeMat(5, [xu + 4, y0, zf + 24], Y, Z, w, hw - 24, `under-flow baffle ${k + 1}`), planeMat(5, [xo + 4, y0, zf + 24], Y, Z, w, hw - 24, `oil-retention baffle ${k + 1}`), planeMat(5, [xw + 6, y0, zf], Y, Z, w, d - 12, `outlet weir wall ${k + 1}`));
    skim.push(pipeAlong('y', 8.625, 0.322, y0 - 2, y0 + w + 2, [xs, zf + d - 2]));
  }
  const m = join(...mats);
  const detail: DSolid[] = [...m.detail, { name: 'slotted skimmer pipes 8 in', role: 'pipe', mesh: mergeMeshes(skim) }, { name: 'walkway grating (SW-GR-1)', role: 'galv', mesh: gratingCover(xs - 54, xs - 18, -12, Wi + 12, zt + 1.5) }, { name: 'walkway guardrail', role: 'safety', mesh: mergeMeshes([straightRail([xs - 53, -11, zt + 1.5], [xs - 53, Wi + 11, zt + 1.5]), straightRail([xs - 19, -11, zt + 1.5], [xs - 19, Wi + 11, zt + 1.5])]) },
    { name: 'inlet and outlet pipe stubs 12 in', role: 'pipe', mesh: mergeMeshes([pipeAlong('x', 12.75, 0.375, -26, 2, [Wi / 2, zf + d - 14]), pipeAlong('x', 12.75, 0.375, Li - 2, Li + 26, [Wi / 2, zf + d - 26])]) }];
  const formed = 2 * (Li + Wi + 48) * (hw + 12) + 2 * (Li + Wi) * hw + (nc - 1) * 2 * Lc * hw + nc * (2 * 2 * w * (hw - 24) + 2 * w * (d - 12));
  return finishCivil(id, 'BASIN', `Gravity separator basin, ${nc} channels ${(w / 12).toFixed(0)}' wide × ${(d / 12).toFixed(0)}' deep × ${(Lc / 12).toFixed(0)}' long (class B)`, {
    channels: def(inp.channels, 2, 'SW-CIV-25', 'Channels', 'count'), w: drawing(w, 'Channel width'), d: drawing(d, 'Liquid depth'), L: drawing(Lc, 'Channel length'), wall: rule(12, 'SW-CIV-25', 'Wall and base thickness'), freeboard: rule(12, 'SW-CIV-25', 'Wall above the liquid'), inletBay: rule(60, 'SW-CIV-25', 'Inlet bay length'), outletBay: rule(48, 'SW-CIV-25', 'Outlet bay length'),
    baffleGap: rule(24, 'SW-CIV-25', 'Baffles stop above the floor'), weir: rule(d - 12, 'SW-CIV-25', 'Weir height (12 in below the surface)'), skimmer: rule(8, 'SW-CIV-25', 'Skimmer pipe'),
  }, Li + 24, solids, CONCRETE_B, m.list, formed, ['Skimmer pipes, walkway and pipe stubs are steel, drawn in place; the liquid is not drawn.'], { Li, Wi }, detail);
}
// ---- SW-CIV-26: sulfur pit -------------------------------------------------------------------------------------------------------------
export function makeSulfurPit(id: string, inp: { L: number; W: number; D: number }): PartSpec {
  const { L, W: Wd, D } = inp, zf = 12, zr = zf + D, zt = zr + 10, holes: Hole[] = [0.25, 0.75].map(f => ({ a0: f * L - 15, a1: f * L + 15, b0: Wd / 2 - 15, b1: Wd / 2 + 15 }));
  const solids = [{ name: 'base', mesh: boxMesh(-12, -12, 0, L + 12, Wd + 12, 12) }, { name: 'walls', mesh: extrude({ outer: rect(-12, -12, L + 12, Wd + 12), inner: rect(0, 0, L, Wd) }, D, zf) }];
  let x = -12; for (const h of holes) { solids.push({ name: 'roof slab', mesh: boxMesh(x, -12, zr, h.a0 - 20, Wd + 12, zt) }, { name: 'roof slab', mesh: extrude({ outer: rect(h.a0 - 20, -12, h.a1 + 20, Wd + 12), inner: rect(h.a0, h.b0, h.a1, h.b1) }, 10, zr) }); x = h.a1 + 20; }
  solids.push({ name: 'roof slab', mesh: boxMesh(x, -12, zr, L + 12, Wd + 12, zt) });
  const m = join(planeMat(5, [-12, -12, 6], X, Y, L + 24, Wd + 24, 'base', 12, 3), planeMat(5, [-12, -6, zf], X, Z, L + 24, D, 'long wall'), planeMat(5, [-12, Wd + 6, zf], X, Z, L + 24, D, 'far long wall'), planeMat(5, [-6, -12, zf], Y, Z, Wd + 24, D, 'end wall'), planeMat(5, [L + 6, -12, zf], Y, Z, Wd + 24, D, 'far end wall'),
    holedMat(5, (a, b, k) => [a, b, zr + 5 + k], -12, L + 12, -12, Wd + 12, holes, 'roof slab', 12, 2));
  const coil: V3[] = [[10, 12, zt + 8], [10, 12, zf + 6]], ys = even(12, Wd - 12, Math.max(2, Math.round((Wd - 24) / 12) + 1));
  ys.forEach((y, i) => { coil.push(i % 2 ? [L - 10, y, zf + 6] : [10, y, zf + 6], i % 2 ? [10, y, zf + 6] : [L - 10, y, zf + 6]); });
  const last = coil[coil.length - 1]; coil.push([last[0], last[1], zt + 8]);
  const detail: DSolid[] = [...m.detail, { name: `steam coil 2 in (${ys.length} passes)`, role: 'closure', mesh: sweep(coil, 1.1875, 8) }, { name: 'cover plates PL3/8', role: 'steel', mesh: mergeMeshes(holes.map(h => boxMesh(h.a0 - 3, h.b0 - 3, zt, h.a1 + 3, h.b1 + 3, zt + 0.375))) },
    { name: 'pump head and discharge', role: 'machine', mesh: mergeMeshes([cylZ(holes[0].a0 + 15, Wd / 2, 6, zt + 0.375, zt + 30, 24), boxMesh(holes[0].a0 + 6, Wd / 2 - 9, zt + 30, holes[0].a0 + 24, Wd / 2 + 9, zt + 54), pipeAlong('y', 4.5, 0.237, Wd / 2 + 6, Wd + 20, [holes[0].a0 + 15, zt + 18])]) },
    { name: 'vent 8 in with hood', role: 'pipe', mesh: mergeMeshes([transformMesh(tube(4.3125, 0.322, 62, 0), translate(L / 2, Wd / 2, zr + 2)), cylZ(L / 2, Wd / 2, 8, zt + 58, zt + 58.25, 24)]) }];
  const formed = 2 * (L + Wd + 48) * (D + 22) + 2 * (L + Wd) * D + L * Wd;
  return finishCivil(id, 'PIT', `Sulfur pit ${(L / 12).toFixed(0)}' × ${(Wd / 12).toFixed(0)}' × ${(D / 12).toFixed(0)}' inside with steam coil (class B)`, { L: drawing(L, 'Inside length'), W: drawing(Wd, 'Inside width'), D: drawing(D, 'Inside depth'), wall: rule(12, 'SW-CIV-26', 'Wall and base thickness'), roof: rule(10, 'SW-CIV-26', 'Roof slab thickness'), above: rule(12, 'SW-CIV-26', 'Roof top above grade'), openings: rule(30, 'SW-CIV-26', 'Pump and access openings, square'), vent: rule(8, 'SW-CIV-26', 'Vent pipe'), coil: rule(12, 'SW-CIV-26', 'Steam coil passes at'), coilH: rule(6, 'SW-CIV-26', 'Coil above the floor') },
    L + 24, solids, CONCRETE_B, m.list, formed, ['Coil, cover plates, pump head and vent are steel, drawn in place; the sulfur is not drawn.'], { L, Wd, D }, detail);
}
// ---- SW-CIV-27: box culvert ------------------------------------------------------------------------------------------------------------
export function makeBoxCulvert(id: string, inp: { span: number; rise: number; L: number }): PartSpec {
  const { span: S, rise: R, L } = inp, t = Math.max(8, roundUpTo(S / 12, 1)), a = S / 2 + t, hT = R + 2 * t, d5 = barDiameter(5), am = S / 2 + t / 2, zl = t / 2, zh = R + 1.5 * t, nHoop = spaced(L, 12, 2), per = rect(-am, zl, am, zh), nLong = Math.ceil((2 * (2 * am + zh - zl)) / 12);
  const sec = (m: MeshData) => transformMesh(m, SHAFT_X_UP_Z);   // a section drawn in (y, z) and run along x
  const solids = [{ name: 'box', mesh: sec(extrude({ outer: rect(-a, 0, a, hT), inner: rect(-S / 2, t, S / 2, t + R) }, L, 0)) }, ...[-12, L].map(x => ({ name: 'headwall', mesh: sec(extrude({ outer: rect(-a - 24, 0, a + 24, hT + 12), inner: rect(-S / 2, t, S / 2, t + R) }, 12, x)) }))];
  const hole: Hole = { a0: -S / 2, a1: S / 2, b0: t, b1: t + R }, hw = [-6, L + 6].map((x, k) => holedMat(5, (y, z, kk) => [x + kk, y, z], -a - 24, a + 24, 0, hT + 12, [hole], `headwall ${k + 1}`, 12, 2));
  const list = [bars(5, nHoop, 2 * (2 * am) + 2 * (zh - zl), 'transverse hoops at 12 in'), bars(5, nLong, L - 4, 'longitudinals at 12 in round the box')];
  const detail: DSolid[] = [drawn(list[0], even(2, L - 2, nHoop).map(x => loopPath([[x, -am, zl], [x, am, zl], [x, am, zh], [x, -am, zh]], 3)), true), drawn(list[1], alongPerimeter(per, nLong).map(q => [[2, q.x - q.nx * d5, q.y - q.ny * d5], [L - 2, q.x - q.nx * d5, q.y - q.ny * d5]] as V3[])), ...hw.flatMap(q => q.detail)];
  const formed = 2 * hT * L + 2 * (S + R) * L + 2 * (2 * (2 * a + 48) * (hT + 12) - 2 * S * R) + 2 * 2 * (hT + 12) * 12;
  return finishCivil(id, 'CULVERT', `Box culvert ${(S / 12).toFixed(0)}' × ${(R / 12).toFixed(0)}' × ${(L / 12).toFixed(0)}' long with headwalls (class B)`, { span: drawing(S, 'Inside span'), rise: drawing(R, 'Inside rise'), L: drawing(L, 'Length'), t: rule(t, 'SW-CIV-27', 'Wall and slab thickness (span / 12, 8 in least)'), headwall: rule(12, 'SW-CIV-27', 'Headwall thickness'), wing: rule(24, 'SW-CIV-27', 'Headwall beyond the box each side'), above: rule(12, 'SW-CIV-27', 'Headwall above the box') },
    L + 24, solids, CONCRETE_B, [...list, ...hw.flatMap(q => q.list)], formed, ['The bottom is cast on a blinding layer (not drawn).'], { S, R, t }, detail);
}
// ---- SW-CIV-28: duct bank --------------------------------------------------------------------------------------------------------------
export function makeDuctBank(id: string, inp: { rows: number; cols: number; L: number }): PartSpec {
  const { rows, cols, L } = inp, p = 7.5, OD = 4.5, Wd = (cols - 1) * p + OD + 6, Hd = (rows - 1) * p + OD + 6, cells: MeshData[] = [], cond: MeshData[] = [], d4 = barDiameter(4), d3 = barDiameter(3);
  const edge = (i: number, n: number, total: number) => (i === 0 ? 0 : i === n ? total : 3 + OD / 2 + (i - 0.5) * p);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const cy = 3 + OD / 2 + i * p - Wd / 2, cz = 3 + OD / 2 + j * p;
    cells.push(transformMesh(extrude(ringAroundHole(rect(edge(i, cols, Wd) - Wd / 2, edge(j, rows, Hd), edge(i + 1, cols, Wd) - Wd / 2, edge(j + 1, rows, Hd)), { x: cy, y: cz }, OD / 2, 32), L, 0), SHAFT_X_UP_Z));
    cond.push(pipeAlong('x', OD, 0.237, -6, L + 6, [cy, cz]));
  }
  const by = Wd / 2 - 1.5 - d3 - d4 / 2, z0 = 1.5 + d3 + d4 / 2, z1 = Hd - z0, nT = spaced(L, 24, 2), list = [bars(4, 4, L - 4, 'corner longitudinals'), bars(3, nT, 2 * (Wd + Hd - 6) + 2 * hookLength(3), 'ties at 24 in')];
  const detail: DSolid[] = [drawn(list[0], [[-by, z0], [by, z0], [by, z1], [-by, z1]].map(([y, z]) => [[2, y, z], [L - 2, y, z]] as V3[])), drawn(list[1], even(2, L - 2, nT).map(x => loopPath([[x, -by - 0.4, z0 - 0.4], [x, by + 0.4, z0 - 0.4], [x, by + 0.4, z1 + 0.4], [x, -by - 0.4, z1 + 0.4]], 2 * d3)), true), { name: `conduits 4 in (${rows * cols})`, role: 'polymer', mesh: mergeMeshes(cond) }];
  return finishCivil(id, 'DUCT_BANK', `Duct bank ${rows} × ${cols} conduits of 4", ${(L / 12).toFixed(0)}' long (class A)`, { rows: drawing(rows, 'Rows', 'count'), cols: drawing(cols, 'Columns', 'count'), L: drawing(L, 'Length'), pitch: rule(p, 'SW-CIV-28', 'Conduit centres (3 in of concrete between)'), W: rule(Wd, 'SW-CIV-28', 'Width (3 in outside the conduits)'), H: rule(Hd, 'SW-CIV-28', 'Height'), ties: rule(24, 'SW-CIV-28', 'Tie spacing') },
    L, [{ name: 'encasement', mesh: mergeMeshes(cells) }], CONCRETE_A, list, 2 * Hd * L, ['The conduits are not concrete; the encasement is drawn with their holes, so its volume is true. Cast in a trench: sides formed.'], { Wd, Hd }, detail);
}
