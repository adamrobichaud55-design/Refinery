/** Butt-weld fittings, pipe weld rings and pipe supports: DESIGN_BASIS.md §34, §38, §39. */
import { K } from '../../core/constants';
import { drawing, rule, constant, type Dim } from '../../core/basis';
import { type PartSpec, type Material } from '../part';
import { pipeDims, PIPE_GRADE, STUD_GRADE, designFlange, type PipeClass } from './pipe';
import { hexHardware } from './hardware';
import { grooveDims } from './welds';
import { DEFAULT_MATERIAL } from '../part';
import { revolve, extrude, transformMesh, signedVolume, mergeMeshes, type MeshData } from '../../geometry/mesh';
import { circle, rect, regularHexagon } from '../../geometry/polygon';
import { translate, rotateX, multiply } from '../../geometry/transform';
import * as S from '../../geometry/sdf';
import { polygonize } from '../../geometry/sdf';

const RHO = K.STEEL_DENSITY_LB_IN3, NC = 40;
const rhoDim = () => constant(K.STEEL_DENSITY_LB_FT3, 'K-1', 'Steel density', 'lb/ft3');
export type FitRole = 'pipe' | 'weld' | 'steel' | 'hardware';
export interface FitSolid { name: string; mesh: MeshData; role: FitRole }

function finish(id: string, kind: PartSpec['kind'], designation: string, dims: Record<string, Dim>, solids: FitSolid[], weightRule: string, extra: Record<string, unknown> = {}, weightOverride?: number, material: Material = PIPE_GRADE): PartSpec {
  const vol = solids.filter(s => s.role !== 'hardware' || true).reduce((a, s) => a + signedVolume(s.mesh), 0);
  return {
    id, kind, category: 'piping', designation, dims: { ...dims, rho: rhoDim() },
    length: dims.L ?? drawing(0, 'Length'), material,
    weight: rule(weightOverride ?? vol * RHO, weightRule, weightOverride !== undefined ? 'Weight' : 'Weight (drawn solid)', 'lb'),
    notes: [], extra: { solids, ...extra },
  };
}

/** ring tube swept along a circular arc: inlet at the origin along +z, turning toward +x about the centre (R, 0, 0) */
function arcTube(Ro: number, Ri: number, R: number, ang: number): MeshData {
  const nA = Math.max(8, Math.ceil(ang / (Math.PI / 24))), positions: number[] = [], indices: number[] = [];
  const ringO: number[][] = [], ringI: number[][] = [];
  for (let i = 0; i <= nA; i++) {
    const t = (ang * i) / nA, cx = R - R * Math.cos(t), cz = R * Math.sin(t), nx = -Math.cos(t), nz = Math.sin(t);   // n: toward the outside of the bend? (radial from centre, pointing away)
    const rx = Math.cos(t), rz = -Math.sin(t);           // unit vector from the centre toward the centreline point is (−cos t, 0, sin t); use its negative as the in-plane axis
    void nx; void nz;
    const o: number[] = [], inn: number[] = [];
    for (let k = 0; k < NC; k++) {
      const a = (2 * Math.PI * k) / NC, ca = Math.cos(a), sa = Math.sin(a);
      positions.push(cx + Ro * ca * rx, Ro * sa, cz + Ro * ca * rz); o.push(positions.length / 3 - 1);
      positions.push(cx + Ri * ca * rx, Ri * sa, cz + Ri * ca * rz); inn.push(positions.length / 3 - 1);
    }
    ringO.push(o); ringI.push(inn);
  }
  for (let i = 0; i < nA; i++) for (let k = 0; k < NC; k++) {
    const k2 = (k + 1) % NC;
    indices.push(ringO[i][k], ringO[i + 1][k], ringO[i + 1][k2], ringO[i][k], ringO[i + 1][k2], ringO[i][k2]);
    indices.push(ringI[i][k], ringI[i + 1][k2], ringI[i + 1][k], ringI[i][k], ringI[i][k2], ringI[i + 1][k2]);
  }
  for (const [i, flip] of [[0, false], [nA, true]] as const) for (let k = 0; k < NC; k++) {
    const k2 = (k + 1) % NC, a = ringO[i][k], b = ringO[i][k2], c = ringI[i][k2], d = ringI[i][k];
    if (flip) indices.push(a, c, b, a, d, c); else indices.push(a, b, c, a, c, d);
  }
  const m = { positions, indices };
  if (signedVolume(m) < 0) for (let q = 0; q < indices.length; q += 3) { const s = indices[q + 1]; indices[q + 1] = indices[q + 2]; indices[q + 2] = s; }
  return m;
}

export const elbowRadius = (OD: number) => (5 / 3) * OD;                                        // SW-FIT-1
/** Elbow (SW-FIT-1): local inlet at the origin along +z, outlet after turning `angleDeg` toward +x. */
export function makeElbow(id: string, NPS: number, cls: PipeClass, angleDeg: 90 | 45): PartSpec {
  const p = pipeDims(NPS, cls), R = elbowRadius(p.OD), ang = (angleDeg * Math.PI) / 180;
  const mesh = arcTube(p.OD / 2, p.D / 2, R, ang);
  return finish(id, 'ELBOW', `EL${angleDeg}-${NPS}-${cls}`, {
    NPS: drawing(NPS, 'Nominal size'), angle: drawing(angleDeg, 'Angle', 'deg'), OD: rule(p.OD, 'SW-PIPE-2', 'Outside diameter'), t: rule(p.t, 'SW-PIPE-3', 'Wall'),
    R: rule(R, 'SW-FIT-1', 'Centreline bend radius'), L: rule(R * Math.tan(ang / 2), 'SW-FIT-1', 'Centre to end'),
  }, [{ name: 'elbow', mesh, role: 'pipe' }], 'SW-FIT-5', { R, angle: ang });
}
export const teeC = (OD: number) => OD / 2 + Math.max(1, OD / 3);                              // SW-FIT-2
/** Tee (SW-FIT-2): run along z from −C to +C, outlet along +y to C; reducing outlet if branchNPS < NPS. Blended crotch. */
export function makeTee(id: string, NPS: number, cls: PipeClass, branchNPS = NPS): PartSpec {
  const p = pipeDims(NPS, cls), q = pipeDims(branchNPS, cls), C = teeC(p.OD), k = Math.max(0.1, 0.12 * q.OD);
  const outer = S.blend(k, S.cylZ(p.OD / 2, -C, C), S.cylY(q.OD / 2, 0, C)), inner = S.union(S.cylZ(p.D / 2, -C - 1, C + 1), S.cylY(q.D / 2, 0, C + 1));
  const f = S.subtract(outer, inner), wall = Math.min(p.t, q.t);
  const mesh = polygonize(f, [-p.OD / 2 - 0.2, -p.OD / 2 - 0.2, -C - 0.05], [p.OD / 2 + 0.2, C + 0.05, C + 0.05], wall / 1.5);
  return finish(id, 'TEE', `TEE${NPS}${branchNPS !== NPS ? 'x' + branchNPS : ''}-${cls}`, {
    NPS: drawing(NPS, 'Run size'), branch: drawing(branchNPS, 'Outlet size'), C: rule(C, 'SW-FIT-2', 'Centre to end (run and outlet)'), L: rule(2 * C, 'SW-FIT-2', 'Run length'),
  }, [{ name: 'tee', mesh, role: 'pipe' }], 'SW-FIT-5', { C, branchNPS });
}
export const reducerLength = (OD1: number, OD2: number) => (OD1 - OD2) / (2 * Math.tan((12 * Math.PI) / 180)) + 2;   // SW-FIT-3
/** Reducer (SW-FIT-3): large end at z = 0, small end at z = H; eccentric keeps the −y side flat when flat = 'bottom' (+y when 'top'). */
export function makeReducer(id: string, NPS1: number, NPS2: number, cls: PipeClass, flat: 'none' | 'top' | 'bottom' = 'none'): PartSpec {
  const a = pipeDims(NPS1, cls), b = pipeDims(NPS2, cls), H = reducerLength(a.OD, b.OD), n = 12;
  const rings: { z: number; ro: number; ri: number; dy: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const z = i === 0 ? 0 : i === n ? H : 1 + ((H - 2) * (i - 1)) / (n - 2);
    const t = Math.min(1, Math.max(0, (z - 1) / (H - 2))), ro = a.OD / 2 + (b.OD / 2 - a.OD / 2) * t, ri = a.D / 2 + (b.D / 2 - a.D / 2) * t;
    const dy = flat === 'none' ? 0 : (flat === 'bottom' ? 1 : -1) * (a.OD / 2 - ro);
    rings.push({ z, ro, ri, dy });
  }
  const positions: number[] = [], indices: number[] = [], O: number[][] = [], I: number[][] = [];
  for (const r of rings) { const o: number[] = [], inn: number[] = []; for (let k = 0; k < NC; k++) { const t = (2 * Math.PI * k) / NC; positions.push(r.ro * Math.cos(t), r.dy + r.ro * Math.sin(t), r.z); o.push(positions.length / 3 - 1); positions.push(r.ri * Math.cos(t), r.dy + r.ri * Math.sin(t), r.z); inn.push(positions.length / 3 - 1); } O.push(o); I.push(inn); }
  for (let i = 0; i < n; i++) for (let k = 0; k < NC; k++) { const k2 = (k + 1) % NC; indices.push(O[i][k], O[i][k2], O[i + 1][k2], O[i][k], O[i + 1][k2], O[i + 1][k]); indices.push(I[i][k], I[i + 1][k2], I[i][k2], I[i][k], I[i + 1][k], I[i + 1][k2]); }
  for (const [i, flip] of [[0, true], [n, false]] as const) for (let k = 0; k < NC; k++) { const k2 = (k + 1) % NC; if (flip) indices.push(O[i][k], I[i][k2], O[i][k2], O[i][k], I[i][k], I[i][k2]); else indices.push(O[i][k], O[i][k2], I[i][k2], O[i][k], I[i][k2], I[i][k]); }
  const mesh = { positions, indices };
  if (signedVolume(mesh) < 0) for (let q = 0; q < indices.length; q += 3) { const s = indices[q + 1]; indices[q + 1] = indices[q + 2]; indices[q + 2] = s; }
  return finish(id, 'REDUCER', `RED${flat === 'none' ? 'C' : 'E'}${NPS1}x${NPS2}-${cls}`, {
    NPS: drawing(NPS1, 'Large end'), NPS2: drawing(NPS2, 'Small end'), L: rule(H, 'SW-FIT-3', 'Length'), offset: rule(flat === 'none' ? 0 : (a.OD - b.OD) / 2, 'SW-FIT-3', 'Eccentric offset'),
  }, [{ name: 'reducer', mesh, role: 'pipe' }], 'SW-FIT-5', { H, flat, offset: flat === 'none' ? 0 : (a.OD - b.OD) / 2 });
}
/** Cap (SW-FIT-4): weld end at z = 0, closed toward +z. */
export function makeCap(id: string, NPS: number, cls: PipeClass): PartSpec {
  const p = pipeDims(NPS, cls), h = p.OD / 4, n = 14, loop: { r: number; z: number }[] = [{ r: p.D / 2, z: 0 }, { r: p.OD / 2, z: 0 }, { r: p.OD / 2, z: 1 }];
  for (let i = 1; i <= n; i++) { const a = (Math.PI / 2) * (i / n); loop.push({ r: (p.OD / 2) * Math.cos(a), z: 1 + h * Math.sin(a) }); }
  for (let i = n; i >= 1; i--) { const a = (Math.PI / 2) * (i / n); loop.push({ r: Math.max(0, (p.D / 2) * Math.cos(a)), z: 1 + Math.max(0.01, h - p.t) * Math.sin(a) }); }
  loop.push({ r: p.D / 2, z: 1 });
  const mesh = revolve(loop.filter((pt, i, arr) => i === 0 || pt.r > 1e-6 || arr[i - 1].r > 1e-6), NC);
  return finish(id, 'CAP', `CAP${NPS}-${cls}`, { NPS: drawing(NPS, 'Size'), L: rule(1 + h, 'SW-FIT-4', 'Length') }, [{ name: 'cap', mesh, role: 'pipe' }], 'SW-FIT-5', { len: 1 + h });
}
/** Butt weld (SW-PW-1): the cap ring proud of the pipe surface, centred at z = 0; weight is the full groove (SW-WD-5). */
export function makeButtWeld(id: string, NPS: number, cls: PipeClass): PartSpec {
  const p = pipeDims(NPS, cls), g = grooveDims(p.t), r = p.OD / 2;
  const mesh = revolve([{ r: r - 0.01, z: -g.topWidth / 2 }, { r: r + g.cap * 0.6, z: -g.topWidth / 4 }, { r: r + g.cap, z: 0 }, { r: r + g.cap * 0.6, z: g.topWidth / 4 }, { r: r - 0.01, z: g.topWidth / 2 }], NC);
  return finish(id, 'BUTT_WELD', `BW${NPS}-${cls}`, {
    NPS: drawing(NPS, 'Size'), t: rule(p.t, 'SW-PIPE-3', 'Joint thickness (pipe wall)'), groove: rule(g.area, 'SW-WD-4', 'Groove area', 'in2'), width: rule(g.topWidth, 'SW-WD-4', 'Width at surface'), cap: rule(g.cap, 'SW-WD-4', 'Reinforcement'),
  }, [{ name: 'butt weld', mesh, role: 'weld' }], 'SW-WD-5', {}, g.area * Math.PI * (p.OD - p.t) * RHO);
}

/** Socket weld (SW-SWT-1): the fillet ring at a socket mouth, leg w, centred on the mouth plane z = 0; the socket body is at z < 0. */
export function makeSocketWeld(id: string, NPS: number, cls: PipeClass): PartSpec {
  const p = pipeDims(NPS, cls), s = roundUpToSixteenth(Math.max(3 / 8, p.OD / 3)), tf = Math.max(3 / 16, roundUpToSixteenth(1.5 * p.t)), w = roundUpToSixteenth(1.4 * p.t), r = p.OD / 2;
  const mesh = revolve([{ r: r - 0.01, z: 0 }, { r: r + tf + 0.01, z: 0 }, { r: r + tf + 0.01, z: 0.02 }, { r: r - 0.01, z: w }], NC);
  void s;
  return finish(id, 'BUTT_WELD', `SW${NPS}-${cls}`, { NPS: drawing(NPS, 'Size'), leg: rule(w, 'SW-SWT-1', 'Fillet leg (throat = pipe wall)'), throat: rule(w * Math.SQRT1_2, 'SW-WD-2', 'Throat'), area: rule(0.5 * w * w, 'SW-WD-2', 'Cross-section area', 'in2') },
    [{ name: 'socket weld', mesh, role: 'weld' }], 'SW-WD-3', { socket: true }, 0.5 * w * w * Math.PI * (p.OD + w) * RHO);
}
/** Fillet weld ring (SW-WD-1/2) of leg w around a pipe of radius r (an olet base, a slip-on flange, a sleeve collar), on the plane z = 0 with the part at z < 0 */
export function makeFilletRing(id: string, r: number, w: number): PartSpec {
  const mesh = revolve([{ r: r - 0.01, z: 0 }, { r: r + w, z: 0 }, { r: r - 0.01, z: w }], NC);
  return finish(id, 'BUTT_WELD', `FW${w}-R${r}`, { r: drawing(r, 'Pipe radius'), leg: rule(w, 'SW-WD-1', 'Fillet leg'), throat: rule(w * Math.SQRT1_2, 'SW-WD-2', 'Throat'), area: rule(0.5 * w * w, 'SW-WD-2', 'Cross-section area', 'in2') },
    [{ name: 'fillet weld', mesh, role: 'weld' }], 'SW-WD-3', { fillet: true }, 0.5 * w * w * 2 * Math.PI * (r + w / 2) * RHO);
}
const roundUpToSixteenth = (v: number) => Math.ceil(v * 16 - 1e-9) / 16;

// ---- supports (SW-PS-*) ---------------------------------------------------------------------------------
const boxM = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => transformMesh(extrude({ outer: rect(x0, y0, x1, y1) }, z1 - z0), translate(0, 0, z0));
const cylYM = (r: number, y0: number, y1: number, x = 0, z = 0) => transformMesh(extrude({ outer: circle(0, 0, r, 24) }, y1 - y0), multiply(translate(x, y0, z), rotateX(-Math.PI / 2)));
/** Shoe, guide or anchor (SW-PS-1..3). Local frame: origin at the pipe bottom, y up, z along the pipe; the base sits
 *  h below on the beam top (h ≥ 4 in, the gap the line's grid elevation leaves, SW-PS-1). */
export function makeShoe(id: string, NPS: number, cls: PipeClass, kind: 'shoe' | 'guide' | 'anchor', h = 4): PartSpec {
  const p = pipeDims(NPS, cls), Ls = p.OD <= 8 ? 12 : 18, t = 0.375;
  const solids: FitSolid[] = [
    { name: 'shoe web', mesh: boxM(-t / 2, -h + t, -Ls / 2, t / 2, 0.15, Ls / 2), role: 'steel' },
    { name: 'shoe base', mesh: boxM(-2, -h, -Ls / 2, 2, -h + t, Ls / 2), role: 'steel' },
  ];
  if (kind === 'guide') for (const s of [-1, 1]) solids.push({ name: 'guide angle L3x3x1/4', mesh: mergeMeshes([boxM(s > 0 ? 2.125 : -2.375, -h, -3, s > 0 ? 2.375 : -2.125, -h + 3, 3), boxM(s > 0 ? 2.125 : -5.125, -h, -3, s > 0 ? 5.125 : -2.125, -h + 0.25, 3)]), role: 'steel' });
  return finish(id, 'SUPPORT', `${kind.toUpperCase()}-${NPS}`, { NPS: drawing(NPS, 'Pipe size'), H: rule(h, 'SW-PS-1', 'Shoe height'), L: rule(Ls, 'SW-PS-1', 'Shoe length') }, solids, 'SW-PS-1', { supportKind: kind }, undefined, DEFAULT_MATERIAL);
}
/** Stanchion (SW-PS-9): post from the floor (y = 0) up to a saddle under the pipe bottom at y = h. */
export function makeStanchion(id: string, NPS: number, cls: PipeClass, h: number): PartSpec {
  const p = pipeDims(NPS, cls), rp = Math.max(1, (pipeDims(Math.max(2, prevSize(NPS)), cls).OD) / 2), tb = 0.375, sb = 2 * rp + 6;
  const solids: FitSolid[] = [
    { name: 'base plate', mesh: boxM(-sb / 2, 0, -sb / 2, sb / 2, tb, sb / 2), role: 'steel' },
    { name: 'post', mesh: cylYM(rp, tb, h - 0.375), role: 'steel' },
    { name: 'saddle', mesh: boxM(-p.OD * 0.4, h - 0.375, -3, p.OD * 0.4, h, 3), role: 'steel' },
    { name: 'anchor rods 2 × 1/2', mesh: mergeMeshes([cylYM(0.25, -0.5, tb + 0.6, -sb / 2 + 1.25, 0), cylYM(0.25, -0.5, tb + 0.6, sb / 2 - 1.25, 0)]), role: 'hardware' },
  ];
  return finish(id, 'SUPPORT', `STANCHION-${NPS}x${h.toFixed(1)}`, { NPS: drawing(NPS, 'Pipe size'), post: rule(2 * rp, 'SW-PS-9', 'Post OD'), H: rule(h, 'SW-PS-9', 'Height to saddle') }, solids, 'SW-PS-9', { supportKind: 'stanchion' }, undefined, DEFAULT_MATERIAL);
}
const SIZES_FOR_POST = [2, 2.5, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 24];
const prevSize = (NPS: number) => { let best = 2; for (const s of SIZES_FOR_POST) if (s < NPS) best = s; return best; };
export const hangerRod = (OD: number) => (OD <= 4.5 ? 0.375 : OD <= 8.5 ? 0.5 : OD <= 12.75 ? 0.625 : 0.75);   // SW-PS-9
/** Hanger (SW-PS-9): clamp around the pipe (centre at y = 0) and a rod up to y = h, with a top plate. */
export function makeHanger(id: string, NPS: number, cls: PipeClass, h: number): PartSpec {
  const p = pipeDims(NPS, cls), d = hangerRod(p.OD), r = p.OD / 2, band = Math.max(0.25, d / 2), w = 1.5;
  const clamp = revolve([{ r: r + 0.02, z: -w / 2 }, { r: r + band, z: -w / 2 }, { r: r + band, z: w / 2 }, { r: r + 0.02, z: w / 2 }], 32);
  const solids: FitSolid[] = [
    { name: 'pipe clamp', mesh: clamp, role: 'steel' },
    { name: 'clamp ears', mesh: boxM(-1, r, -w / 2, 1, r + 1.5, w / 2), role: 'steel' },
    { name: `rod ${d}`, mesh: cylYM(d / 2, r + 1.5, h), role: 'hardware' },
    { name: 'top plate', mesh: boxM(-2, h, -2, 2, h + 0.375, 2), role: 'steel' },
  ];
  return finish(id, 'SUPPORT', `HANGER-${NPS}x${h.toFixed(1)}`, { NPS: drawing(NPS, 'Pipe size'), rod: rule(d, 'SW-PS-9', 'Rod diameter'), H: rule(h, 'SW-PS-9', 'Rod length to the steel') }, solids, 'SW-PS-9', { supportKind: 'hanger' }, undefined, DEFAULT_MATERIAL);
}
/** Trapeze (SW-PS-13): an L2x2x1/4 under the pipe carried by two rods at a = OD/2 + 6 in either side, for a line that
 *  runs directly under another so a single rod cannot pass. Local frame: pipe centre at the origin, y up, z along the
 *  pipe; rods rise h1 (at x = −a) and h2 (at x = +a) to the steel. */
export function makeTrapeze(id: string, NPS: number, cls: PipeClass, h1: number, h2: number, aOff?: number): PartSpec {
  const p = pipeDims(NPS, cls), d = hangerRod(p.OD), r = p.OD / 2, a = aOff ?? r + 6, t = 0.25;   // SW-PS-13: rods at OD/2 + 6 in, or further out where stated
  const solids: FitSolid[] = [
    { name: 'angle L2x2x1/4', mesh: mergeMeshes([boxM(-a - 1, -r - t, -1, a + 1, -r, 1), boxM(-a - 1, -r - 2, -1, a + 1, -r - t, -1 + t)]), role: 'steel' },
    { name: `rods ${d}`, mesh: mergeMeshes([cylYM(d / 2, -r - 1, h1, -a, 0), cylYM(d / 2, -r - 1, h2, a, 0)]), role: 'hardware' },
    { name: 'top plates', mesh: mergeMeshes([boxM(-a - 2, h1, -2, -a + 2, h1 + 0.375, 2), boxM(a - 2, h2, -2, a + 2, h2 + 0.375, 2)]), role: 'steel' },
  ];
  return finish(id, 'SUPPORT', `TRAPEZE-${NPS}x${Math.max(h1, h2).toFixed(1)}`, { NPS: drawing(NPS, 'Pipe size'), rod: rule(d, 'SW-PS-9', 'Rod diameter'), a: rule(a, 'SW-PS-13', 'Rod offset from the pipe axis'), H1: rule(h1, 'SW-PS-13', 'Rod length, side 1'), H2: rule(h2, 'SW-PS-13', 'Rod length, side 2') }, solids, 'SW-PS-13', { supportKind: 'trapeze' }, undefined, DEFAULT_MATERIAL);
}
/**
 * Trunnion or dummy leg (SW-PS-4/10): a tube of the line's OD × 3/8 in wall on the riser's axis, from a base plate on
 * the floor up to the elbow, its top cut to the elbow's outer surface (a saddle).
 * Local frame: origin under the elbow's work point at the bottom of the horizontal run's pipe (h above the floor, so
 * the floor is at y = −h); +y up the riser; +x the direction the elbow turns into. The elbow (bend radius R, outer
 * radius r) is the torus whose ring centre is (R, R + r, 0) in the x–y plane; the riser's end is at y = R + r.
 */
export function makeTrunnion(id: string, NPS: number, cls: PipeClass, h: number): PartSpec {
  const p = pipeDims(NPS, cls), r = p.OD / 2, ro = r, ri = Math.max(0.1, ro - 0.375), sb = p.OD + 4, R = elbowRadius(p.OD), N = 48;
  const yc = R + r;
  /** the height of the elbow's outer surface above (x, z), or the riser's end where the leg's edge meets the riser's side */
  const top = (x: number, z: number) => { const s = Math.sqrt(Math.max(0, r * r - z * z)), q = (R + s) ** 2 - (x - R) ** 2; return q > 0 ? yc - Math.sqrt(q) : yc; };
  const yb = -h + 0.5, pos: number[] = [], idx: number[] = [];
  const v = (x: number, y: number, z: number) => { pos.push(x, y, z); return pos.length / 3 - 1; };
  const ob: number[] = [], ot: number[] = [], ib: number[] = [], it: number[] = [];
  for (let i = 0; i < N; i++) {
    const a = (2 * Math.PI * i) / N, c = Math.cos(a), sn = Math.sin(a);
    ob.push(v(ro * c, yb, ro * sn)); ot.push(v(ro * c, top(ro * c, ro * sn), ro * sn));
    ib.push(v(ri * c, yb, ri * sn)); it.push(v(ri * c, top(ri * c, ri * sn), ri * sn));
  }
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    idx.push(ob[i], ot[i], ot[j], ob[i], ot[j], ob[j]);      // outer wall, facing out
    idx.push(ib[i], ib[j], it[j], ib[i], it[j], it[i]);      // inner wall, facing the axis
    idx.push(ot[i], it[i], it[j], ot[i], it[j], ot[j]);      // the saddle-cut top edge
    idx.push(ob[i], ob[j], ib[j], ob[i], ib[j], ib[i]);      // the foot on the base plate
  }
  let tube: MeshData = { positions: pos, indices: idx };
  if (signedVolume(tube) < 0) tube = { positions: pos, indices: idx.map((_, k) => idx[k - (k % 3) + [0, 2, 1][k % 3]]) };
  const solids: FitSolid[] = [{ name: 'trunnion', mesh: tube, role: 'steel' }, { name: 'base plate', mesh: boxM(-sb / 2, -h, -sb / 2, sb / 2, -h + 0.5, sb / 2), role: 'steel' }];
  return finish(id, 'SUPPORT', `TRUNNION-${NPS}x${h.toFixed(1)}`, { NPS: drawing(NPS, 'Pipe size'), H: rule(h, 'SW-PS-10', 'Height of the run\'s pipe bottom above the floor'), R: rule(R, 'SW-FIT-1', 'Bend radius of the elbow it carries'), top: rule(yc + h, 'SW-PS-4', 'Height of the riser\'s end above the floor (highest point of the saddle)') }, solids, 'SW-PS-4', { supportKind: 'trunnion' }, undefined, DEFAULT_MATERIAL);
}
void DEFAULT_MATERIAL;

/** Stud bolting of one flanged joint (SW-FLG-4/7): n studs on the bolt circle, centred on the joint plane z = 0, nuts outside a stack of thickness `stack`. */
export function makeStudSet(id: string, NPS: number, cls: PipeClass, stack: number): PartSpec {
  // SW-FLG-13: a spade or spectacle blind in the joint lengthens the studs by its thickness and the extra gasket
  const f = designFlange(NPS, cls), h = hexHardware(f.d), L = f.studLen + Math.max(0, stack - (2 * (f.tf + f.rfH) + f.gasketT)), parts: MeshData[] = [];
  for (let i = 0; i < f.n; i++) {
    const a = (2 * Math.PI * (i + 0.5)) / f.n, x = (f.BC / 2) * Math.cos(a), y = (f.BC / 2) * Math.sin(a);
    parts.push(transformMesh(extrude({ outer: circle(0, 0, f.d / 2, 16) }, L), translate(x, y, -L / 2)));
    for (const z0 of [stack / 2, -stack / 2 - h.nutH]) parts.push(transformMesh(extrude({ outer: regularHexagon(h.F) }, h.nutH), translate(x, y, z0)));
  }
  const vol = f.n * ((Math.PI / 4) * f.d ** 2 * L + 2 * ((Math.sqrt(3) / 2) * h.F ** 2 - (Math.PI / 4) * f.d ** 2) * h.nutH);
  return {
    id, kind: 'STUD', category: 'hardware', designation: `STUDS ${f.n}×${f.d}x${L} (${NPS}-${cls})`,
    dims: { n: rule(f.n, 'SW-FLG-4', 'Studs', 'count'), d: rule(f.d, 'SW-FLG-4', 'Stud diameter'), L: rule(L, 'SW-FLG-7', 'Stud length'), rho: rhoDim() },
    length: rule(L, 'SW-FLG-7', 'Stud length'), material: STUD_GRADE, weight: rule(vol * RHO, 'SW-FLG-7', 'Weight of studs and nuts', 'lb'),
    notes: [], extra: { solids: [{ name: `studs ${f.n} × ${f.d}`, mesh: mergeMeshes(parts), role: 'hardware' }] },
  };
}
