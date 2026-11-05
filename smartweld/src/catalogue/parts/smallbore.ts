/**
 * Small-bore joints and fittings (DESIGN_BASIS.md §60–61): socket-weld and threaded elbows, tees, couplings, branch
 * outlets (olets), swages, nipples, plugs; slip-on and socket-weld flanges; spades and spectacle blinds; floor and wall
 * penetration sleeves. Every dimension is proportioned from the pipe of the size and class (SW-PIPE-2/3) by the rules
 * SW-SWT-*, SW-FLG-10..13 and SW-PEN-*; nothing is taken from a published table.
 * Local frames follow the butt-weld fittings (§34): flow along +z; an elbow's inlet mouth at the origin along +z turning
 * toward +x; a tee's run along z about the origin with its outlet along +y.
 */
import { K } from '../../core/constants';
import { drawing, rule, constant, type Dim } from '../../core/basis';
import { roundUpTo } from '../../core/units';
import { DEFAULT_MATERIAL, FORGING_GRADE_SB, type PartSpec, type Material } from '../part';
import { pipeDims, designFlange, PIPE_GRADE, FORGING_GRADE, SIZE_SERIES, type PipeClass, type FlangeDesign } from './pipe';
import { GRATING } from './access';
import { revolve, extrude, transformMesh, signedVolume, mergeMeshes, type MeshData } from '../../geometry/mesh';
import { circle, rect, regularHexagon } from '../../geometry/polygon';
import { ringAroundHole } from '../../geometry/profiles';
import { translate, rotateY, multiply } from '../../geometry/transform';
import * as S from '../../geometry/sdf';
import { polygonize, type SDF } from '../../geometry/sdf';
import { type FitSolid } from './fittings';

const RHO = K.STEEL_DENSITY_LB_IN3, NC = 40;
const rhoDim = () => constant(K.STEEL_DENSITY_LB_FT3, 'K-1', 'Steel density', 'lb/ft3');
export type JointEnd = 'BW' | 'SW' | 'TH';
export const END_NAME: Record<JointEnd, string> = { BW: 'BUTT-WELD', SW: 'SOCKET-WELD', TH: 'THREADED' };

function finish(id: string, kind: PartSpec['kind'], designation: string, dims: Record<string, Dim>, solids: FitSolid[], weightRule: string, extra: Record<string, unknown> = {}, material: Material = FORGING_GRADE_SB, length?: Dim): PartSpec {
  const vol = solids.reduce((a, s) => a + signedVolume(s.mesh), 0);
  return {
    id, kind, category: 'piping', designation, dims: { ...dims, rho: rhoDim() },
    length: length ?? dims.L ?? drawing(0, 'Length'), material,
    weight: rule(vol * RHO, weightRule, 'Weight (drawn solid)', 'lb'), notes: [], extra: { solids, ...extra },
  };
}

// ---- the small-bore joint dimensions (SW-SWT-1/2) ---------------------------------------------------------------
export interface SmallBore { NPS: number; cls: PipeClass; OD: number; t: number; D: number; tf: number; s: number; leg: number; ht: number; Lt: number; socketBore: number; threadBore: number }
export function smallBore(NPS: number, cls: PipeClass): SmallBore {
  const p = pipeDims(NPS, cls);
  const s = roundUpTo(Math.max(3 / 8, p.OD / 3), 1 / 16), tf = Math.max(3 / 16, roundUpTo(1.5 * p.t, 1 / 16)), leg = roundUpTo(1.4 * p.t, 1 / 16);   // SW-SWT-1
  const ht = 1 / 32 + p.OD / 40, Lt = roundUpTo(Math.max(3 / 8, 0.4 * p.OD), 1 / 16);                                                                  // SW-SWT-2
  return { NPS, cls, OD: p.OD, t: p.t, D: p.D, tf, s, leg, ht, Lt, socketBore: p.OD + 1 / 16, threadBore: p.OD - 2 * ht };
}
/** the engagement length of an end: socket depth, thread length, or the 1 in butt-weld straight */
export const endLength = (sb: SmallBore, end: JointEnd) => (end === 'SW' ? sb.s : end === 'TH' ? sb.Lt : 1);
/** wall of pipe supplied for threading (SW-SWT-2): the thread depth added so the pressure wall remains under the root */
export const threadedWall = (NPS: number, cls: PipeClass) => { const sb = smallBore(NPS, cls); return roundUpTo(sb.t + sb.ht, 1 / 32); };
const endDims = (sb: SmallBore, end: JointEnd, suffix = ''): Record<string, Dim> => end === 'SW'
  ? { [`socketDepth${suffix}`]: rule(sb.s, 'SW-SWT-1', `Socket depth${suffix ? ' ' + suffix : ''}`), [`socketBore${suffix}`]: rule(sb.socketBore, 'SW-SWT-1', 'Socket bore'), [`weldLeg${suffix}`]: rule(sb.leg, 'SW-SWT-1', 'Socket weld leg') }
  : end === 'TH' ? { [`threadLength${suffix}`]: rule(sb.Lt, 'SW-SWT-2', `Thread engagement${suffix ? ' ' + suffix : ''}`), [`threadDepth${suffix}`]: rule(sb.ht, 'SW-SWT-2', 'Thread depth') }
  : { [`bevelStraight${suffix}`]: rule(1, 'SW-SWT-6', 'Butt-weld straight') };

// ---- SDF helpers ---------------------------------------------------------------------------------------------------
type V3 = [number, number, number];
/** cylinder of radius r along the segment a–b, flat ends */
const cylAxis = (a: V3, b: V3, r: number): SDF => {
  const ab: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...ab), u: V3 = [ab[0] / L, ab[1] / L, ab[2] / L];
  return (x, y, z) => { const px = x - a[0], py = y - a[1], pz = z - a[2], t = px * u[0] + py * u[1] + pz * u[2];
    const dr = Math.hypot(px - t * u[0], py - t * u[1], pz - t * u[2]) - r, da = Math.max(-t, t - L);
    return Math.min(Math.max(dr, da), 0) + Math.hypot(Math.max(dr, 0), Math.max(da, 0)); };
};
/** the passage of a bend: a tube of radius r on an arc of radius rc about the centre (rc, 0, zc) in the x–z plane, from the
 *  inlet tangent point (0, 0, zc) turning toward +x through `ang`; outside the arc's angular range the distance is to its ends */
const bendPassage = (rc: number, r: number, zc: number, ang: number): SDF => (x, y, z) => {
  const dx = x - rc, dz = z - zc, th = Math.atan2(dx, -dz);                   // th = 0 at the inlet tangent point (−x side... x = 0 → dx = −rc, dz = 0)
  const a = Math.atan2(dz, -dx);                                                // angle from the inlet point about the centre, increasing toward +z then +x
  const t = Math.min(ang, Math.max(0, a)); void th;
  const cx = rc - rc * Math.cos(t), cz = zc + rc * Math.sin(t);                 // nearest centreline point
  return Math.hypot(x - cx, y, z - cz) - r;
};
const meshOf = (f: SDF, min: V3, max: V3, cell: number): MeshData => {
  const m = polygonize(f, min, max, cell);
  if (signedVolume(m) < 0) for (let q = 0; q < m.indices.length; q += 3) { const s = m.indices[q + 1]; m.indices[q + 1] = m.indices[q + 2]; m.indices[q + 2] = s; }
  return m;
};
const ringZ = (ro: number, ri: number, z0: number, z1: number) => transformMesh(extrude({ outer: circle(0, 0, ro, NC), inner: circle(0, 0, ri, NC) }, z1 - z0), translate(0, 0, z0));
const discZ = (ro: number, z0: number, z1: number) => transformMesh(extrude({ outer: circle(0, 0, ro, NC) }, z1 - z0), translate(0, 0, z0));
const boxM = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => transformMesh(extrude({ outer: rect(x0, y0, x1, y1) }, z1 - z0), translate(0, 0, z0));

// ---- elbows (SW-SWT-3) ---------------------------------------------------------------------------------------------
export const smallElbowA = (sb: SmallBore, end: JointEnd) => sb.OD + sb.tf + endLength(sb, end);       // centre to mouth
/** Socket-weld or threaded elbow. Inlet mouth at the origin along +z, corner at (0, 0, A), outlet mouth A beyond the corner
 *  in the turned direction (toward +x). */
export function makeSmallElbow(id: string, NPS: number, cls: PipeClass, angleDeg: 90 | 45, end: 'SW' | 'TH'): PartSpec {
  const sb = smallBore(NPS, cls), e = endLength(sb, end), rc = sb.OD, A = smallElbowA(sb, end), ro = sb.OD / 2 + sb.tf, ang = (angleDeg * Math.PI) / 180;
  const corner: V3 = [0, 0, A], dir: V3 = [Math.sin(ang), 0, Math.cos(ang)], mouth: V3 = [corner[0] + dir[0] * A, 0, corner[2] + dir[2] * A];
  const zT = A - rc;                                                           // inlet tangent point (passage starts bending here)
  const body = S.union(cylAxis([0, 0, 0], corner, ro), cylAxis(corner, mouth, ro), S.sphere(0, 0, A, ro));
  // passage: inlet straight, the bend about (rc, 0, zT), outlet straight; sockets or threads at both mouths
  const endBore = end === 'SW' ? sb.socketBore / 2 : sb.threadBore / 2;
  const outStart: V3 = [corner[0] + dir[0] * (A - e - sb.tf), 0, corner[2] + dir[2] * (A - e - sb.tf)];
  const passage = S.union(S.cylZ(sb.D / 2, -1, zT + 0.01), bendPassage(rc, sb.D / 2, zT, ang), cylAxis(outStart, [mouth[0] + dir[0], 0, mouth[2] + dir[2]], sb.D / 2),
    S.cylZ(endBore, -1, e), cylAxis([mouth[0] - dir[0] * e, 0, mouth[2] - dir[2] * e], [mouth[0] + dir[0], 0, mouth[2] + dir[2]], endBore));
  const lim = A + ro + 0.2;
  const mesh = meshOf(S.subtract(body, passage), [-ro - 0.2, -ro - 0.2, -0.2], [lim, ro + 0.2, lim], Math.max(0.05, sb.tf / 2));
  return finish(id, 'FITTING', `${end}EL${angleDeg}-${NPS}-${cls}`, {
    NPS: drawing(NPS, 'Nominal size'), angle: drawing(angleDeg, 'Angle', 'deg'), rc: rule(rc, 'SW-SWT-3', 'Passage bend radius'), tf: rule(sb.tf, 'SW-SWT-1', 'Body wall'),
    A: rule(A, 'SW-SWT-3', 'Centre to mouth'), bodyOD: rule(2 * ro, 'SW-SWT-3', 'Body diameter'), ...endDims(sb, end),
  }, [{ name: 'elbow', mesh, role: 'pipe' }], 'SW-FIT-5', { A, angle: ang, end, e, fitting: 'elbow' });
}

// ---- tees (SW-SWT-4) -----------------------------------------------------------------------------------------------
export const smallTeeC = (sb: SmallBore, end: JointEnd) => sb.OD / 2 + sb.tf + endLength(sb, end);
/** Socket-weld or threaded tee: run along z from −C to +C, outlet along +y to Cb (reducing when branchNPS < NPS). */
export function makeSmallTee(id: string, NPS: number, cls: PipeClass, end: 'SW' | 'TH', branchNPS = NPS): PartSpec {
  const sb = smallBore(NPS, cls), bb = smallBore(branchNPS, cls), e = endLength(sb, end), eb = endLength(bb, end);
  const C = smallTeeC(sb, end), Cb = sb.OD / 2 + sb.tf + eb, ro = sb.OD / 2 + sb.tf, rob = bb.OD / 2 + sb.tf;
  const bore = (x: SmallBore) => (end === 'SW' ? x.socketBore / 2 : x.threadBore / 2);
  const body = S.blend(Math.max(0.1, 0.5 * sb.tf), S.cylZ(ro, -C, C), S.cylY(rob, 0, Cb));
  const passage = S.union(S.cylZ(sb.D / 2, -C - 1, C + 1), S.cylY(bb.D / 2, 0, Cb + 1), S.cylZ(bore(sb), -C - 1, -C + e), S.cylZ(bore(sb), C - e, C + 1), S.cylY(bore(bb), Cb - eb, Cb + 1));
  const mesh = meshOf(S.subtract(body, passage), [-ro - 0.2, -ro - 0.2, -C - 0.2], [ro + 0.2, Cb + 0.2, C + 0.2], Math.max(0.05, sb.tf / 2));
  return finish(id, 'FITTING', `${end}TEE${NPS}${branchNPS !== NPS ? 'x' + branchNPS : ''}-${cls}`, {
    NPS: drawing(NPS, 'Run size'), branch: drawing(branchNPS, 'Outlet size'), tf: rule(sb.tf, 'SW-SWT-1', 'Body wall'), C: rule(C, 'SW-SWT-4', 'Centre to run mouth'), Cb: rule(Cb, 'SW-SWT-4', 'Centre to outlet mouth'), L: rule(2 * C, 'SW-SWT-4', 'Run length'),
    ...endDims(sb, end), ...(branchNPS !== NPS ? endDims(bb, end, 'outlet') : {}),
  }, [{ name: 'tee', mesh, role: 'pipe' }], 'SW-FIT-5', { C, Cb, branchNPS, end, e, eb, fitting: 'tee' });
}

// ---- couplings (SW-SWT-5) ------------------------------------------------------------------------------------------
/** Full coupling: two sockets (or threads) back to back with a stop ring between; along z from 0 to L. */
export function makeCoupling(id: string, NPS: number, cls: PipeClass, end: 'SW' | 'TH'): PartSpec {
  const sb = smallBore(NPS, cls), e = endLength(sb, end), L = 2 * e + sb.tf, ro = sb.OD / 2 + sb.tf, ri = end === 'SW' ? sb.socketBore / 2 : sb.threadBore / 2;
  const mesh = mergeMeshes([ringZ(ro, ri, 0, e), ringZ(ro, sb.D / 2, e, e + sb.tf), ringZ(ro, ri, e + sb.tf, L)]);
  return finish(id, 'FITTING', `${end}CPLG${NPS}-${cls}`, { NPS: drawing(NPS, 'Size'), L: rule(L, 'SW-SWT-5', 'Length'), tf: rule(sb.tf, 'SW-SWT-1', 'Wall'), stop: rule(sb.tf, 'SW-SWT-5', 'Stop ring width'), ...endDims(sb, end) },
    [{ name: 'coupling', mesh, role: 'pipe' }], 'SW-FIT-5', { L, end, e, fitting: 'coupling' });
}

// ---- branch outlets (SW-SWT-6) -------------------------------------------------------------------------------------
export const oletHeight = (run: SmallBore, br: SmallBore, end: JointEnd) => run.OD / 2 + 4 * br.tf + endLength(br, end);
/** Olet: origin on the run's axis, +y toward the outlet mouth at y = H; the base is saddled to the run's outside surface. */
export function makeOlet(id: string, runNPS: number, NPS: number, cls: PipeClass, end: JointEnd): PartSpec {
  const run = smallBore(runNPS, cls), br = smallBore(NPS, cls), e = endLength(br, end), H = oletHeight(run, br, end), ro = br.OD / 2 + br.tf, Rr = run.OD / 2;
  const yBase = Math.sqrt(Math.max(0, Rr * Rr - (ro + br.tf) ** 2));         // where the flared base meets the run at its widest
  const body = S.union(S.frustumY(ro + br.tf, yBase - 0.01, ro, yBase + 2 * br.tf), S.cylY(ro, yBase + 2 * br.tf - 0.01, H));
  const endBore = end === 'SW' ? br.socketBore / 2 : end === 'TH' ? br.threadBore / 2 : br.D / 2;
  const passage = S.union(S.cylY(br.D / 2, -1, H + 1), S.cylY(endBore, H - e, H + 1));
  const f = S.subtract(body, passage, S.cylZ(Rr, -ro - 1, ro + 1));           // the run's own volume: the base is cut to the run surface
  const mesh = meshOf(f, [-ro - br.tf - 0.2, yBase - 0.2, -ro - br.tf - 0.2], [ro + br.tf + 0.2, H + 0.2, ro + br.tf + 0.2], Math.max(0.05, br.tf / 2));
  return finish(id, 'FITTING', `${end}OLET${runNPS}x${NPS}-${cls}`, {
    NPS: drawing(runNPS, 'Run size'), branch: drawing(NPS, 'Outlet size'), H: rule(H, 'SW-SWT-6', 'Run centreline to outlet mouth'), tf: rule(br.tf, 'SW-SWT-1', 'Body wall'),
    baseOD: rule(2 * (ro + br.tf), 'SW-SWT-6', 'Base diameter'), baseWeld: rule(br.tf, 'SW-SWT-6', 'Fillet leg to the run'), ...endDims(br, end),
  }, [{ name: 'branch outlet', mesh, role: 'pipe' }], 'SW-FIT-5', { H, end, e, fitting: 'olet', runNPS });
}

// ---- swages (SW-SWT-7) ---------------------------------------------------------------------------------------------
export function swageLength(NPS1: number, NPS2: number, cls: PipeClass, end1: JointEnd, end2: JointEnd) {
  const a = smallBore(NPS1, cls), b = smallBore(NPS2, cls), e1 = endLength(a, end1), e2 = endLength(b, end2);
  return { a, b, e1, e2, cone: (a.OD - b.OD) / (2 * Math.tan((12 * Math.PI) / 180)), L: e1 + e2 + (a.OD - b.OD) / (2 * Math.tan((12 * Math.PI) / 180)) };
}
/** Swage: large end at z = 0, small end at z = L, each end socket, threaded or butt-weld. */
export function makeSwage(id: string, NPS1: number, NPS2: number, cls: PipeClass, end1: JointEnd, end2: JointEnd): PartSpec {
  const { a, b, e1, e2, cone, L } = swageLength(NPS1, NPS2, cls, end1, end2), tf = a.tf;
  const bore = (x: SmallBore, end: JointEnd) => (end === 'SW' ? x.socketBore / 2 : end === 'TH' ? x.threadBore / 2 : x.D / 2);
  const ro1 = end1 === 'BW' ? a.OD / 2 : a.OD / 2 + tf, ro2 = end2 === 'BW' ? b.OD / 2 : b.OD / 2 + tf;
  const loop: { r: number; z: number }[] = [
    { r: bore(a, end1), z: 0 }, { r: ro1, z: 0 }, { r: ro1, z: e1 }, { r: ro2, z: e1 + cone }, { r: ro2, z: L }, { r: bore(b, end2), z: L },
    { r: bore(b, end2), z: L - e2 }, { r: b.D / 2, z: L - e2 }, { r: a.D / 2, z: e1 }, { r: bore(a, end1), z: e1 },
  ];
  const mesh = revolve(loop, NC);
  if (signedVolume(mesh) < 0) for (let q = 0; q < mesh.indices.length; q += 3) { const s = mesh.indices[q + 1]; mesh.indices[q + 1] = mesh.indices[q + 2]; mesh.indices[q + 2] = s; }
  return finish(id, 'FITTING', `SWG${NPS1}x${NPS2}-${cls}-${end1}x${end2}`, {
    NPS: drawing(NPS1, 'Large end'), NPS2: drawing(NPS2, 'Small end'), L: rule(L, 'SW-SWT-7', 'Length'), cone: rule(cone, 'SW-SWT-7', 'Cone length (12° half-angle)'), tf: rule(tf, 'SW-SWT-1', 'Wall'),
    ...endDims(a, end1, 'large'), ...endDims(b, end2, 'small'),
  }, [{ name: 'swage', mesh, role: 'pipe' }], 'SW-FIT-5', { L, e1, e2, end1, end2, fitting: 'swage' });
}

// ---- nipples (SW-SWT-8) and pipe for threading (SW-SWT-2) ----------------------------------------------------------
export type NippleEnds = 'TBE' | 'TOE' | 'PBE';
export const closeNippleLength = (NPS: number, cls: PipeClass) => 2 * smallBore(NPS, cls).Lt + 0.25;
/** Nipple: a short pipe piece along z from 0 to L; threaded pipe carries the heavier wall of SW-SWT-2. */
export function makeNipple(id: string, NPS: number, cls: PipeClass, L: number, ends: NippleEnds): PartSpec {
  const sb = smallBore(NPS, cls), t = ends === 'PBE' ? sb.t : threadedWall(NPS, cls), D = sb.OD - 2 * t, A = (Math.PI / 4) * (sb.OD ** 2 - D ** 2);
  const close = Math.abs(L - closeNippleLength(NPS, cls)) < 1e-6;
  return {
    id, kind: 'PIPE', category: 'piping', designation: `NIP${NPS}-${cls}-${close ? 'CLOSE' : ends}`,
    dims: { NPS: drawing(NPS, 'Nominal size'), OD: rule(sb.OD, 'SW-PIPE-2', 'Outside diameter'), t: rule(t, ends === 'PBE' ? 'SW-PIPE-3' : 'SW-SWT-2', 'Wall thickness'), D: rule(D, 'SW-PIPE-4', 'Bore'), A: rule(A, 'SW-PIPE-5', 'Metal area', 'in2'),
      L: rule(L, 'SW-SWT-8', close ? 'Length (close nipple)' : 'Length'), ...(ends === 'PBE' ? {} : { threadLength: rule(close ? L : sb.Lt, 'SW-SWT-2', 'Thread length each threaded end') }), rho: rhoDim() },
    length: rule(L, 'SW-SWT-8', 'Length'), material: PIPE_GRADE, weight: rule(A * L * RHO, 'SW-PIPE-5', 'Weight', 'lb'),
    notes: [], extra: { nipple: ends, close },
  };
}

// ---- plugs (SW-SWT-9) ----------------------------------------------------------------------------------------------
/** Threaded plug: head base at z = 0 with the shank toward −z into the fitting; hex head, square for NPS ≤ 1/2. */
export function makePlug(id: string, NPS: number, cls: PipeClass, socket = false): PartSpec {
  const sb = smallBore(NPS, cls), F = sb.OD + 2 * sb.tf, hh = socket ? 0.6 * sb.OD : 0.6 * F, square = !socket && NPS <= 0.5;
  const head = socket ? discZ(sb.OD / 2, 0, hh) : square ? boxM(-F / 2, -F / 2, 0, F / 2, F / 2, hh) : transformMesh(extrude({ outer: regularHexagon(F) }, hh), translate(0, 0, 0));
  const shank = discZ(socket ? sb.OD / 2 - 0.01 : sb.OD / 2, -(socket ? sb.s : sb.Lt), 0);
  return finish(id, 'FITTING', socket ? `SWPLUG${NPS}-${cls}` : `PLUG${NPS}-${cls}-${square ? 'SQ' : 'HEX'}`, {
    NPS: drawing(NPS, 'Size'), F: rule(F, 'SW-SWT-9', square ? 'Head across flats (square)' : 'Head across flats (hex)'), headH: rule(hh, 'SW-SWT-9', 'Head height'),
    shank: rule(socket ? sb.s : sb.Lt, socket ? 'SW-SWT-1' : 'SW-SWT-2', socket ? 'Shank (socket depth)' : 'Shank (thread length)'),
  }, [{ name: 'plug', mesh: mergeMeshes([head, shank]), role: 'pipe' }], 'SW-FIT-5', { L: hh, shank: socket ? sb.s : sb.Lt, fitting: 'plug', head: socket ? 'socket' : square ? 'square' : 'hex' }, FORGING_GRADE_SB, rule(hh, 'SW-SWT-9', 'Head height'));
}

// ---- slip-on and socket-weld flanges (SW-FLG-10/11) ----------------------------------------------------------------
/** The SW-FLG ring with a short hub; face at z = 0 (raised face −rfH..0), ring 0..tf, hub beyond. `extra.flangeType`. */
export function makeSlipOnFlange(id: string, NPS: number, cls: PipeClass): PartSpec {
  const f = designFlange(NPS, cls), sb = smallBore(NPS, cls), bore = sb.socketBore, hub = 0.75 * f.tf, ro = sb.OD / 2 + sb.tf, stop = sb.t + 1 / 8;
  const solids = flangeSolids(f, bore, hub, ro, bore);
  return finish(id, 'FLANGE', `SOF${NPS}-${cls}`, { ...flangeDimsOf(f), hub: rule(hub, 'SW-FLG-10', 'Hub length'), hubWall: rule(sb.tf, 'SW-SWT-1', 'Hub wall'), setback: rule(stop, 'SW-FLG-10', 'Pipe end set back from the face'), weldLeg: rule(sb.t, 'SW-WD-1', 'Fillet leg (back and face welds)') },
    solids, 'SW-FLG-9', { design: f, flangeType: 'SO', hub, setback: stop, L: f.tf + hub }, FORGING_GRADE, rule(f.tf + hub, 'SW-FLG-10', 'Overall length (face to hub back)'));
}
export function makeSocketWeldFlange(id: string, NPS: number, cls: PipeClass): PartSpec {
  const f = designFlange(NPS, cls), sb = smallBore(NPS, cls), hub = sb.s + sb.tf, ro = sb.OD / 2 + sb.tf;
  const solids = flangeSolids(f, sb.D, hub, ro, sb.socketBore, sb.s);
  return finish(id, 'FLANGE', `SWF${NPS}-${cls}`, { ...flangeDimsOf(f), hub: rule(hub, 'SW-FLG-11', 'Hub length'), hubWall: rule(sb.tf, 'SW-SWT-1', 'Hub wall'), ...endDims(sb, 'SW') },
    solids, 'SW-FLG-9', { design: f, flangeType: 'SW', hub, socket: sb.s, L: f.tf + hub }, FORGING_GRADE, rule(f.tf + hub, 'SW-FLG-11', 'Overall length (face to hub back)'));
}
function flangeDimsOf(f: FlangeDesign): Record<string, Dim> {
  return { NPS: drawing(f.NPS, 'Nominal size'), P: drawing(f.P, 'Class design pressure', 'psi'), rfOD: rule(f.rfOD, 'SW-FLG-4', 'Raised face diameter'), rfH: rule(f.rfH, 'SW-FLG-1', 'Raised face height'),
    d: rule(f.d, 'SW-FLG-4', 'Stud diameter'), n: rule(f.n, 'SW-FLG-4', 'Stud count', 'count'), BC: rule(f.BC, 'SW-FLG-4', 'Bolt circle'), OD: rule(f.OD, 'SW-FLG-4', 'Flange outside diameter'), holeD: rule(f.holeD, 'SW-FLG-4', 'Bolt hole'), tf: rule(f.tf, 'SW-FLG-5', 'Flange thickness') };
}
/** ring with bolt holes (as star cells), raised face and a straight hub; the socket (if any) is a counterbore from the hub back */
function flangeSolids(f: FlangeDesign, bore: number, hub: number, hubRo: number, backBore: number, socket = 0): FitSolid[] {
  const cells: MeshData[] = [];
  for (let i = 0; i < f.n; i++) {
    const a = (2 * Math.PI * (i + 0.5)) / f.n, half = Math.PI / f.n, hx = (f.BC / 2) * Math.cos(a), hy = (f.BC / 2) * Math.sin(a);
    const outer: { x: number; y: number }[] = [];
    for (let k = 0; k <= 6; k++) { const t = a - half + (2 * half * k) / 6; outer.push({ x: (f.OD / 2) * Math.cos(t), y: (f.OD / 2) * Math.sin(t) }); }
    for (let k = 6; k >= 0; k--) { const t = a - half + (2 * half * k) / 6; outer.push({ x: (bore / 2) * Math.cos(t), y: (bore / 2) * Math.sin(t) }); }
    cells.push(extrude(ringAroundHole(outer, { x: hx, y: hy }, f.holeD / 2, 24), f.tf));
  }
  const solids: FitSolid[] = [{ name: 'flange ring', mesh: mergeMeshes(cells), role: 'steel' }, { name: 'raised face', mesh: ringZ(f.rfOD / 2, bore / 2, -f.rfH, 0), role: 'steel' }];
  if (socket) solids.push({ name: 'hub', mesh: mergeMeshes([ringZ(hubRo, bore / 2, f.tf, f.tf + hub - socket), ringZ(hubRo, backBore / 2, f.tf + hub - socket, f.tf + hub)]), role: 'steel' });
  else solids.push({ name: 'hub', mesh: ringZ(hubRo, bore / 2, f.tf, f.tf + hub), role: 'steel' });
  return solids;
}

// ---- spades and spectacle blinds (SW-FLG-13) -----------------------------------------------------------------------
export function spadeThickness(f: FlangeDesign) { return Math.max(0.25, roundUpTo((f.G / 2) * Math.sqrt((1.24 * f.P) / (0.6 * FORGING_GRADE.Fy.value * 1000)), 1 / 8)); }
/** Spade: a disc inside the bolt circle with a handle along +y; plate centred on z = 0. */
export function makeSpade(id: string, NPS: number, cls: PipeClass): PartSpec {
  const f = designFlange(NPS, cls), t = spadeThickness(f), Rd = (f.BC - f.d) / 2, hEnd = f.OD / 2 + 2;
  const disc = transformMesh(extrude({ outer: circle(0, 0, Rd, NC) }, t), translate(0, 0, -t / 2));
  const handle = transformMesh(extrude(ringAroundHole(rect(-1, Rd - 0.5, 1, hEnd), { x: 0, y: hEnd - 1 }, 0.375, 12), t), translate(0, 0, -t / 2));
  return finish(id, 'FITTING', `SPADE${NPS}-${cls}`, { NPS: drawing(NPS, 'Size'), t: rule(t, 'SW-FLG-13', 'Plate thickness'), discD: rule(2 * Rd, 'SW-FLG-13', 'Disc diameter (inside the bolt circle)'), handle: rule(hEnd, 'SW-FLG-13', 'Handle reach from the axis'), L: rule(t, 'SW-FLG-13', 'Thickness') },
    [{ name: 'spade', mesh: mergeMeshes([disc, handle]), role: 'steel' }], 'SW-FLG-9', { design: f, t, fitting: 'spade' }, FORGING_GRADE);
}
/** Spectacle blind: the ring (bore D) in line at the origin, the solid disc hanging below (−y), joined by a web. */
export function makeSpectacleBlind(id: string, NPS: number, cls: PipeClass): PartSpec {
  const f = designFlange(NPS, cls), t = spadeThickness(f), Rd = (f.BC - f.d) / 2, D = pipeDims(NPS, cls).D, pitch = 2 * Rd + 1;
  const ring = transformMesh(extrude({ outer: circle(0, 0, Rd, NC), inner: circle(0, 0, D / 2, NC) }, t), translate(0, 0, -t / 2));
  const disc = transformMesh(extrude({ outer: circle(0, -pitch, Rd, NC) }, t), translate(0, 0, -t / 2));
  const web = transformMesh(extrude({ outer: rect(-1, -pitch + Rd - 0.5, 1, -Rd + 0.5) }, t), translate(0, 0, -t / 2));
  return finish(id, 'FITTING', `SPEC${NPS}-${cls}`, { NPS: drawing(NPS, 'Size'), t: rule(t, 'SW-FLG-13', 'Plate thickness'), discD: rule(2 * Rd, 'SW-FLG-13', 'Disc diameter'), pitch: rule(pitch, 'SW-FLG-13', 'Ring to disc centres'), L: rule(t, 'SW-FLG-13', 'Thickness') },
    [{ name: 'spectacle blind', mesh: mergeMeshes([ring, disc, web]), role: 'steel' }], 'SW-FLG-9', { design: f, t, fitting: 'spectacle' }, FORGING_GRADE);
}

// ---- penetration sleeves (SW-PEN-1/2) ------------------------------------------------------------------------------
export const sleeveSize = (OD: number) => SIZE_SERIES.find(s => s >= OD + 1.5) ?? SIZE_SERIES[SIZE_SERIES.length - 1];
/** Floor sleeve: pipe axis along z, the walking surface at z = 0; sleeve from −(bar depth + 1) to +2 with a PL1/4 collar on the bars. */
export function makeFloorSleeve(id: string, NPS: number, cls: PipeClass): PartSpec {
  const sN = sleeveSize(pipeDims(NPS, cls).OD), sp = pipeDims(sN, 'P150'), z0 = -(GRATING.barDepth + 1), z1 = 2;
  const solids: FitSolid[] = [{ name: 'sleeve', mesh: ringZ(sp.OD / 2, sp.D / 2, z0, z1), role: 'steel' }, { name: 'collar PL1/4', mesh: ringZ(sp.OD / 2 + 2, sp.OD / 2 - 0.01, 0, 0.25), role: 'steel' }];
  return finish(id, 'FITTING', `FSLV${sN}`, { NPS: drawing(NPS, 'Line size'), sleeve: rule(sN, 'SW-PEN-1', 'Sleeve pipe size'), L: rule(z1 - z0, 'SW-PEN-1', 'Sleeve length'), curb: rule(2, 'SW-PEN-1', 'Curb above the walking surface'), collar: rule(2, 'SW-PEN-1', 'Collar width'), cut: rule(sp.OD + 0.25, 'SW-PEN-1', 'Grating cut diameter') },
    solids, 'SW-FIT-5', { sleeveNPS: sN, z0, z1, fitting: 'floor_penetration', cutD: sp.OD + 0.25 }, DEFAULT_MATERIAL);
}
/** Wall sleeve: pipe axis along z, the panel's inner face at z = 0; sleeve from −2 to rib + 2 with a PL1/8 escutcheon outside. */
export function makeWallSleeve(id: string, NPS: number, cls: PipeClass): PartSpec {
  const sN = sleeveSize(pipeDims(NPS, cls).OD), sp = pipeDims(sN, 'P150'), rib = 1.25, z0 = -2, z1 = rib + 2, e = sp.OD + 4;
  const solids: FitSolid[] = [{ name: 'sleeve', mesh: ringZ(sp.OD / 2, sp.D / 2, z0, z1), role: 'steel' }, { name: 'escutcheon PL1/8', mesh: transformMesh(extrude(ringAroundHole(rect(-e / 2, -e / 2, e / 2, e / 2), { x: 0, y: 0 }, sp.OD / 2 - 0.01, NC), 0.125), translate(0, 0, rib)), role: 'steel' }];
  return finish(id, 'FITTING', `WSLV${sN}`, { NPS: drawing(NPS, 'Line size'), sleeve: rule(sN, 'SW-PEN-2', 'Sleeve pipe size'), L: rule(z1 - z0, 'SW-PEN-2', 'Sleeve length'), plate: rule(e, 'SW-PEN-2', 'Escutcheon side'), cut: rule(sp.OD + 0.25, 'SW-PEN-2', 'Panel cut diameter') },
    solids, 'SW-FIT-5', { sleeveNPS: sN, z0, z1, fitting: 'wall_penetration', cutD: sp.OD + 0.25 }, DEFAULT_MATERIAL);
}
void rotateY; void multiply;
