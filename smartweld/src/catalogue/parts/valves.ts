/** Valves: DESIGN_BASIS.md sections 31–32 (SW-VLV-*, SW-VLV-G/GL/C/B/BF-*). Local frame: flow along +z, stem up +y, x across. */
import { K } from '../../core/constants';
import { drawing, rule, constant, type Dim } from '../../core/basis';
import { roundUpTo } from '../../core/units';
import { type PartSpec, type Material } from '../part';
import { pipeDims, designFlange, CLASS_PRESSURE, type PipeClass, type FlangeDesign } from './pipe';
import { hexHardware } from './hardware';
import { revolve, extrude, transformMesh, signedVolume, mergeMeshes, type MeshData, type Mat4 } from '../../geometry/mesh';
import { circle, rect, regularHexagon, annularSector, arc, type Polygon } from '../../geometry/polygon';
import { multiply, translate, rotateX, rotateY, rotateZ, frameFromAxes, type Vec3 } from '../../geometry/transform';
import { ringAroundHole } from '../../geometry/profiles';

const RHO = K.STEEL_DENSITY_LB_IN3;
const rhoDim = () => constant(K.STEEL_DENSITY_LB_FT3, 'K-1', 'Steel density', 'lb/ft3');
export type ValveType = 'GATE' | 'GLOBE' | 'CHECK' | 'BALL' | 'BFLY';
export type ValveRole = 'casting' | 'closure' | 'stem' | 'polymer' | 'hardware';
export interface ValveSolid { name: string; mesh: MeshData; role: ValveRole; material: string; count?: number }
export const CASTING: Material = { grade: 'Grade 36 casting', Fy: { value: 36, unit: 'ksi', basis: { kind: 'drawing' }, label: 'Minimum yield strength (grade stated on drawing)' } };
export const BAR60: Material = { grade: 'Grade 60 bar', Fy: { value: 60, unit: 'ksi', basis: { kind: 'drawing' }, label: 'Minimum yield strength (grade stated on drawing)' } };
const N = 48;

// ---- geometry helpers (all return closed meshes) ---------------------------------------------------------
const cylZ = (r: number, z0: number, z1: number, x = 0, y = 0) => transformMesh(extrude({ outer: circle(0, 0, r, N) }, z1 - z0), translate(x, y, z0));
const ringZ = (ro: number, ri: number, z0: number, z1: number, x = 0, y = 0) => transformMesh(extrude({ outer: circle(0, 0, ro, N), inner: circle(0, 0, ri, N) }, z1 - z0), translate(x, y, z0));
const toY: Mat4 = rotateX(-Math.PI / 2);          // local z → world y (a solid built along z stands up)
const toX: Mat4 = rotateY(Math.PI / 2);           // local z → world x
const cylY = (r: number, y0: number, y1: number, x = 0, z = 0) => transformMesh(cylZ(r, y0, y1), multiply(translate(x, 0, z), toY));
const ringY = (ro: number, ri: number, y0: number, y1: number, x = 0, z = 0) => transformMesh(ringZ(ro, ri, y0, y1), multiply(translate(x, 0, z), toY));
const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => transformMesh(extrude({ outer: rect(x0, y0, x1, y1) }, z1 - z0), translate(0, 0, z0));
/** revolve about the y axis: profile given as (r, y) */
const revolveY = (loop: { r: number; z: number }[]) => transformMesh(revolve(loop, N), toY);
/** torus with tube radius rt at ring radius R, axis y */
const torusY = (R: number, rt: number, y: number) => transformMesh(revolve(arc(R, 0, rt, 0, 2 * Math.PI, 24).slice(0, -1).map(p => ({ r: p.x, z: p.y })), N), multiply(translate(0, y, 0), toY));
/** flange ring with n bolt holes as n star-shaped cells (holes straddle the centrelines), along z from z0 */
function flangeRing(f: FlangeDesign, z0: number, bore: number): MeshData {
  const cells: MeshData[] = [];
  for (let i = 0; i < f.n; i++) {
    const a = (2 * Math.PI * (i + 0.5)) / f.n, half = Math.PI / f.n;
    const sector = annularSector(bore / 2, f.OD / 2, a - half, a + half, 6);
    const prof = ringAroundHole(sector, { x: (f.BC / 2) * Math.cos(a), y: (f.BC / 2) * Math.sin(a) }, f.holeD / 2, 24);
    cells.push(transformMesh(extrude(prof, f.tf), translate(0, 0, z0)));
  }
  return mergeMeshes(cells);
}
/** stud with two nuts along z from z0 */
function stud(d: number, L: number, z0: number, x: number, y: number, tStack: number): MeshData {
  const h = hexHardware(d), nutProf = ringAroundHole(regularHexagon(h.F), { x: 0, y: 0 }, d / 2, 24);
  const stick = (L - tStack) / 2;
  return mergeMeshes([
    transformMesh(cylZ(d / 2, 0, L), translate(x, y, z0)),
    transformMesh(extrude(nutProf, h.nutH), translate(x, y, z0 + stick - h.nutH)),
    transformMesh(extrude(nutProf, h.nutH), translate(x, y, z0 + stick + tStack)),
  ]);
}
const hwFrame = (o: Vec3, zDir: Vec3, yDir: Vec3): Mat4 => frameFromAxes(o, yDir, zDir);

// ---- operability (SW-VLV-4/5/8) -------------------------------------------------------------------------
export interface Operator { kind: 'handwheel' | 'lever' | 'gear'; Dhw?: number; lever?: number; ratio?: number; rimForce: number; T: number }
export function sizeOperator(T: number, quarterTurn: boolean): Operator {
  if (quarterTurn) {
    const L = roundUpTo(T / 50, 2);
    if (L <= 24) return { kind: 'lever', lever: Math.max(6, L), rimForce: T / Math.max(6, L), T };
  } else {
    const D = roundUpTo((2 * T) / 80, 2);                                               // SW-VLV-4: two hands on a wheel
    if (D <= 30) return { kind: 'handwheel', Dhw: Math.max(6, D), rimForce: (2 * T) / Math.max(6, D), T };
  }
  const ratio = Math.ceil(T / (80 * 6));
  return { kind: 'gear', ratio, Dhw: 12, rimForce: T / ratio / 6, T };
}
export interface StemDesign { F: number; ds: number; p: number; T: number; packing: number; boxBore: number }
export function risingStem(F: number, D = 0): StemDesign {                            // SW-VLV-5/6
  const ds = roundUpTo(Math.max(Math.sqrt((4 * F) / (Math.PI * 0.25 * BAR60.Fy.value * 1000)), D / 8, 0.5), 1 / 16);
  const p = ds / 5, lambda = Math.atan(p / (Math.PI * ds)), phi = Math.atan(0.15);
  const T = F * (ds / 2) * Math.tan(lambda + phi) + F * 0.02 * (ds / 2);              // thrust bearing in the yoke (SW-VLV-5)
  const packing = roundUpTo(Math.max(0.25, ds / 8), 1 / 16);
  return { F, ds, p, T, packing, boxBore: ds + 2 * packing };
}

function handwheel(b: ValveSolid[], op: Operator, y: number, ds: number) {        // SW-VLV-8
  const D = op.Dhw!, rt = Math.min(1.5, 0.06 * D + 0.25) / 2, spokes = D > 16 ? 6 : 4, hubR = Math.max(ds, 0.75), hubL = 1.5 * ds + 0.5;
  const parts: MeshData[] = [torusY(D / 2 - rt, rt, y), cylY(hubR, y - hubL / 2, y + hubL / 2)];
  for (let i = 0; i < spokes; i++) {
    const a = (2 * Math.PI * i) / spokes;
    parts.push(transformMesh(cylZ(0.5 * rt, hubR * 0.8, D / 2 - rt), multiply(translate(0, y, 0), multiply(rotateY(a), toX))));
  }
  b.push({ name: `handwheel ${D} in`, mesh: mergeMeshes(parts), role: 'casting', material: 'Grade 36 casting' });
}
function lever(b: ValveSolid[], op: Operator, y: number, ds: number, D: number) {   // SW-VLV-B-2 lever: flat bar along +z (open position shown)
  const L = op.lever!, w = Math.max(1, 0.25 * D), t = 0.25;
  b.push({ name: `lever ${L} in`, mesh: mergeMeshes([box(-w / 2, y, 0, w / 2, y + t, L), cylY(Math.max(ds, 0.6) + 0.2, y - 0.5, y + t + 0.5), box(-w / 2, y - 0.5, -1.5, w / 2, y + 0.5, 1.5)]), role: 'casting', material: 'Grade 36 casting' });
  b.push({ name: 'lever grip', mesh: transformMesh(cylZ(0.5, L - 4, L + 1), translate(0, y + t + 0.5, 0)), role: 'polymer', material: 'polymer' });
}
function gearOperator(b: ValveSolid[], op: Operator, y: number, ds: number, quarterTurn: boolean) {
  const s = Math.max(4, 3 * ds);
  b.push({ name: `gear operator ${op.ratio}:1`, mesh: box(-s, y, -s, s, y + 1.2 * s, s), role: 'casting', material: 'Grade 36 casting' });
  // input shaft and 12 in handwheel on the +x side (SW-VLV-4)
  const yc = y + 0.6 * s;
  b.push({ name: 'input shaft', mesh: transformMesh(cylZ(0.5, s, s + 3), multiply(translate(0, yc, 0), toX)), role: 'stem', material: 'Grade 60 bar' });
  const parts: MeshData[] = [transformMesh(torusY(6 - 0.6, 0.6, 0), multiply(translate(s + 3, yc, 0), rotateZ(-Math.PI / 2))), transformMesh(cylZ(1, s + 2, s + 4), multiply(translate(0, yc, 0), toX))];
  for (let i = 0; i < 4; i++) parts.push(transformMesh(cylZ(0.3, 0.8, 5.4), multiply(translate(s + 3, yc, 0), multiply(rotateX((2 * Math.PI * i) / 4), rotateX(0)))));
  b.push({ name: 'input handwheel 12 in', mesh: mergeMeshes(parts), role: 'casting', material: 'Grade 36 casting' });
  void quarterTurn;
}

// ---- valve builders ----------------------------------------------------------------------------------------
interface Common { NPS: number; cls: PipeClass; P: number; D: number; tb: number; f: FlangeDesign; F2F: number; hHub: number; wBody: number }
function common(NPS: number, cls: PipeClass, wBody: number, Dc: number): Common {
  const pd = pipeDims(NPS, cls), P = CLASS_PRESSURE[cls], f = designFlange(NPS, cls);
  const Sc = (CASTING.Fy.value * 1000) / 2.5;
  const tb = roundUpTo(Math.max(0.25, (P * Dc) / (2 * Sc) + 0.125), 1 / 16);                                  // SW-VLV-2
  const hHub = f.hubLen + f.neckLen, F2F = 2 * f.tf + 2 * hHub + wBody;                                       // SW-VLV-9
  return { NPS, cls, P, D: pd.D, tb, f, F2F, hHub, wBody };
}
/** both end flanges with raised faces and the hubs to the body cavity (SW-VLV-3, SW-FLG-6) */
function ends(b: ValveSolid[], c: Common) {
  const { f, F2F, D, tb } = c, zFace = F2F / 2;
  for (const s of [-1, 1]) {
    const z0 = s > 0 ? zFace - f.tf : -zFace;
    b.push({ name: 'end flange', mesh: flangeRing(f, z0, D), role: 'casting', material: 'Grade 36 casting', count: 1 });
    b.push({ name: 'raised face', mesh: s > 0 ? ringZ(f.rfOD / 2, D / 2, zFace, zFace + f.rfH) : ringZ(f.rfOD / 2, D / 2, -zFace - f.rfH, -zFace), role: 'casting', material: 'Grade 36 casting' });
    // hub: tapered from 2 tb at the flange to tb at the cavity wall, then the run wall to the cavity
    const zi = s * (zFace - f.tf), zo = s * (c.wBody / 2 + tb);
    const loop = [{ r: D / 2, z: zi }, { r: D / 2 + 2 * tb, z: zi }, { r: D / 2 + tb, z: zi - s * f.hubLen }, { r: D / 2 + tb, z: zo }, { r: D / 2, z: zo }];
    b.push({ name: 'body run', mesh: revolve(s > 0 ? loop : loop.reverse(), N), role: 'casting', material: 'Grade 36 casting' });
  }
}
/** vertical chamber wall around the stem axis: ring from y0 to y1 with run openings of half-angle `open` at ±z within |y| < D/2 */
function chamber(b: ValveSolid[], c: Common, Rc: number, y0: number, y1: number, openInlet: [number, number], openOutlet: [number, number]) {
  const { tb, D } = c, half = Math.asin(Math.min(1, (D / 2) / Rc));
  const bands: [number, number][] = [[y0, Math.min(openInlet[0], openOutlet[0])], [Math.max(openInlet[1], openOutlet[1]), y1]];
  for (const [a, bnd] of bands) if (bnd - a > 1e-6) b.push({ name: 'body chamber', mesh: ringY(Rc + tb, Rc, a, bnd), role: 'casting', material: 'Grade 36 casting' });
  // middle band: ring minus the two openings (sectors around ±z, i.e. around angles ±90° in the xz plane with x = r cos a, z = r sin a)
  const yMid0 = Math.min(openInlet[0], openOutlet[0]), yMid1 = Math.max(openInlet[1], openOutlet[1]);
  const seg = (a0: number, a1: number, ya: number, yb: number) => { if (yb - ya > 1e-6 && a1 > a0) b.push({ name: 'body chamber', mesh: transformMesh(extrude({ outer: annularSector(Rc, Rc + tb, a0, a1, 12) }, yb - ya), multiply(translate(0, ya, 0), toY)), role: 'casting', material: 'Grade 36 casting' }); };
  // in the revolve/toY frame the profile x,y map to world x,−z... keep angles: inlet at −z ↔ profile angle +90°? we place the sectors symmetric so either sign works
  // side walls (around ±x) span the whole middle band
  seg(-Math.PI / 2 + half, Math.PI / 2 - half, yMid0, yMid1);
  seg(Math.PI / 2 + half, 1.5 * Math.PI - half, yMid0, yMid1);
  // above/below each opening within the middle band where that end's opening does not reach
  for (const [a0, a1, op] of [[Math.PI / 2 - half, Math.PI / 2 + half, openOutlet], [1.5 * Math.PI - half, 1.5 * Math.PI + half, openInlet]] as const) {
    seg(a0, a1, yMid0, op[0]); seg(a0, a1, op[1], yMid1);
  }
}
function bonnetJoint(b: ValveSolid[], c: Common, neckBore: number, y: number, name = 'bonnet') {   // SW-VLV-7: bonnet flanges + gasket + studs
  const fb = designFlange(c.NPS, c.cls, neckBore, c.tb, neckBore + 2 * c.tb);
  b.push({ name: 'body bonnet flange', mesh: transformMesh(flangeRing(fb, 0, neckBore), multiply(translate(0, y - fb.tf, 0), toY)), role: 'casting', material: 'Grade 36 casting' });
  b.push({ name: `${name} gasket`, mesh: ringY((fb.gasketID + 2 * fb.wg) / 2, fb.gasketID / 2, y, y + fb.gasketT), role: 'polymer', material: 'compressed sheet' });
  b.push({ name: `${name} flange`, mesh: transformMesh(flangeRing(fb, 0, neckBore), multiply(translate(0, y + fb.gasketT, 0), toY)), role: 'casting', material: 'Grade 36 casting' });
  const studs: MeshData[] = [];
  for (let i = 0; i < fb.n; i++) { const a = (2 * Math.PI * (i + 0.5)) / fb.n; studs.push(transformMesh(stud(fb.d, fb.studLen, 0, (fb.BC / 2) * Math.cos(a), (fb.BC / 2) * Math.sin(a), 2 * fb.tf + fb.gasketT), multiply(translate(0, y - fb.tf - (fb.studLen - 2 * fb.tf - fb.gasketT) / 2, 0), toY))); }
  b.push({ name: `${name} studs ${fb.n} × ${fb.d} in`, mesh: mergeMeshes(studs), role: 'hardware', material: 'Grade 90 stud', count: fb.n });
  return { fb, yTop: y + fb.gasketT + fb.tf };
}
function stuffingBox(b: ValveSolid[], st: StemDesign, tb: number, y0: number) {      // SW-VLV-6: box, 4 packing rings, gland, 2 gland studs
  const s = st.packing, h = 4 * s;
  b.push({ name: 'stuffing box', mesh: ringY(st.boxBore / 2 + tb, st.boxBore / 2, y0, y0 + h + s), role: 'casting', material: 'Grade 36 casting' });
  for (let i = 0; i < 4; i++) b.push({ name: 'packing ring', mesh: ringY(st.boxBore / 2, st.ds / 2, y0 + i * s, y0 + (i + 1) * s), role: 'polymer', material: 'braided packing' });
  b.push({ name: 'gland follower', mesh: mergeMeshes([ringY(st.boxBore / 2 - 0.02, st.ds / 2, y0 + h, y0 + h + s + 0.25), ringY(st.boxBore / 2 + tb + 0.75, st.ds / 2, y0 + h + s, y0 + h + s + 0.25)]), role: 'casting', material: 'Grade 36 casting' });
  const dg = Math.max(0.375, s), studs: MeshData[] = [];
  for (const sx of [-1, 1]) studs.push(transformMesh(stud(dg, 2 * s + 1.5, 0, sx * (st.boxBore / 2 + tb + 0.4), 0, s + 0.25), multiply(translate(0, y0 + h - s, 0), toY)));
  b.push({ name: 'gland studs 2 × ' + dg + ' in', mesh: mergeMeshes(studs), role: 'hardware', material: 'Grade 90 stud', count: 2 });
  return y0 + h + s + 0.25;
}

export function makeValve(id: string, type: ValveType, NPS: number, cls: PipeClass): PartSpec {
  const b: ValveSolid[] = [];
  const dims: Record<string, Dim> = { NPS: drawing(NPS, 'Nominal size'), P: drawing(CLASS_PRESSURE[cls], 'Class design pressure', 'psi') };
  const notes: string[] = [];
  let c: Common, op: Operator, extra: Record<string, unknown> = {};
  const P = CLASS_PRESSURE[cls], D0 = pipeDims(NPS, cls).D;
  if (type === 'GATE') {                                                               // SW-VLV-G
    const Rc = 0.675 * D0;
    c = common(NPS, cls, D0, 2 * Rc);
    c.wBody = D0 + 2 * c.tb; c.F2F = 2 * c.f.tf + 2 * c.hHub + c.wBody;              // SW-VLV-G-2: cavity = bore + two walls
    const { D, tb, f } = c;
    ends(b, c);
    const stroke = 1.05 * D, yBottom = -(D / 2 + 0.1 * D + tb), yBonnet = D / 2 + 0.6 * D;
    chamber(b, c, Rc, yBottom + tb, yBonnet, [-D / 2, D / 2], [-D / 2, D / 2]);
    b.push({ name: 'body bottom', mesh: cylY(Rc + tb, yBottom, yBottom + tb), role: 'casting', material: 'Grade 36 casting' });
    // seats (SW-VLV-G-1): rings 0.1 D wide at 5°
    const sw = Math.max(0.25, 0.1 * D), tw = 0.25 * D, tan5 = Math.tan((5 * Math.PI) / 180);
    for (const s of [-1, 1]) b.push({ name: 'seat ring', mesh: transformMesh(ringZ(0.65 * D, D / 2, -sw / 2, sw / 2), multiply(translate(0, 0, s * (tw / 2 + sw / 2)), rotateX(-s * (5 * Math.PI) / 180))), role: 'stem', material: 'Grade 60 bar' });
    // wedge: disc 1.3 D across, thickness tw at the seat line growing 5° per face upward (shear of the end faces)
    const wedge = extrude({ outer: circle(0, 0, 0.65 * D, N) }, tw, -tw / 2, { start: { dx: 0, dy: -tan5 }, end: { dx: 0, dy: tan5 } });
    b.push({ name: 'wedge', mesh: mergeMeshes([wedge, cylY(0.15 * D, 0.6 * D, 0.75 * D)]), role: 'closure', material: 'Grade 36 casting' });
    // thrust, stem, bonnet, stuffing box, yoke, handwheel
    const F = P * (Math.PI / 4) * D * D * ((0.3 + tan5) * 1.15 + 0.25);               // SW-VLV-G-3 (with the wedging force)
    const st = risingStem(F, D);
    const { fb, yTop } = bonnetJoint(b, c, 2 * Rc, yBonnet);
    const yBoxBase = yTop + 0.5 * D;
    b.push({ name: 'bonnet', mesh: revolveY([{ r: Rc, z: yTop }, { r: Rc + tb, z: yTop }, { r: st.boxBore / 2 + tb, z: yBoxBase }, { r: st.boxBore / 2, z: yBoxBase }]), role: 'casting', material: 'Grade 36 casting' });
    const yGland = stuffingBox(b, st, tb, yBoxBase);
    const yNut = yGland + stroke + 2, nutH = 1.5 * st.ds;
    for (const sx of [-1, 1]) b.push({ name: 'yoke arm', mesh: box(sx * (Rc + 0.3 * tb) - 0.3 * tb, yTop, -tb, sx * (Rc + 0.3 * tb) + 0.3 * tb, yNut, tb), role: 'casting', material: 'Grade 36 casting' });
    b.push({ name: 'yoke top', mesh: box(-Rc - 0.6 * tb, yNut, -tb, Rc + 0.6 * tb, yNut + nutH, tb), role: 'casting', material: 'Grade 36 casting' });
    b.push({ name: 'stem nut', mesh: ringY(st.ds, st.ds / 2 + 0.02, yNut - 0.25, yNut + nutH + 0.25), role: 'stem', material: 'Grade 60 bar' });
    op = sizeOperator(st.T, false);
    const stemTop = yNut + nutH + 2 + 1.5 * st.ds;                                   // closed: the stem is at its lowest (rises by `stroke` when opened)
    b.push({ name: `stem ${st.ds} in`, mesh: cylY(st.ds / 2, 0.75 * D, stemTop), role: 'stem', material: 'Grade 60 bar' });
    if (op.kind === 'gear') gearOperator(b, op, yNut + nutH + 0.5, st.ds, false); else handwheel(b, op, yNut + nutH + 1, st.ds);
    Object.assign(dims, { stroke: rule(stroke, 'SW-VLV-G-2', 'Stroke'), wedgeT: rule(tw, 'SW-VLV-G-1', 'Wedge thickness at the seat line'), seatW: rule(sw, 'SW-VLV-G-1', 'Seat face width'), thrust: rule(F, 'SW-VLV-G-3', 'Stem thrust', 'lb') });
    extra = { stroke, bonnet: fb, stem: st };
  } else if (type === 'GLOBE') {                                                       // SW-VLV-GL
    const wBody = 1.5 * D0, Rc = 0.75 * D0;
    c = common(NPS, cls, wBody, 2 * Rc);
    const { D, tb } = c;
    ends(b, c);
    const yBottom = -(0.75 * D + tb), yBonnet = 0.75 * D;
    chamber(b, c, Rc, yBottom + tb, yBonnet, [-D / 2, 0], [0, D / 2]);
    b.push({ name: 'body bottom', mesh: cylY(Rc + tb, yBottom, yBottom + tb), role: 'casting', material: 'Grade 36 casting' });
    b.push({ name: 'partition', mesh: ringY(Rc, 0.6 * D, -tb / 2, tb / 2), role: 'casting', material: 'Grade 36 casting' });
    b.push({ name: 'seat ring', mesh: ringY(0.6 * D, D / 2, tb / 2, tb / 2 + 0.1 * D), role: 'stem', material: 'Grade 60 bar' });
    const lift = D / 4, F = P * (Math.PI / 4) * (1.2 * D) ** 2 * 1.15;
    const st = risingStem(F, D);
    // plug disc: 30° cone seated on the ring (closed position shown)
    const yS = tb / 2 + 0.1 * D;
    b.push({ name: 'disc', mesh: revolveY([{ r: 0, z: yS - 0.15 * D }, { r: D / 2 - 0.05 * D, z: yS - 0.15 * D }, { r: 0.6 * D, z: yS + 0.12 * D }, { r: 0.6 * D, z: yS + 0.27 * D }, { r: st.ds, z: yS + 0.27 * D }, { r: st.ds, z: yS + 0.4 * D }, { r: 0, z: yS + 0.4 * D }]), role: 'closure', material: 'Grade 36 casting' });
    const { fb, yTop } = bonnetJoint(b, c, 2 * Rc, yBonnet);
    const yBoxBase = yTop + 0.4 * D + lift;
    b.push({ name: 'bonnet', mesh: revolveY([{ r: Rc, z: yTop }, { r: Rc + tb, z: yTop }, { r: st.boxBore / 2 + tb, z: yBoxBase }, { r: st.boxBore / 2, z: yBoxBase }]), role: 'casting', material: 'Grade 36 casting' });
    b.push({ name: 'stem nut (in bonnet)', mesh: ringY(st.ds, st.ds / 2 + 0.02, yTop + 0.1 * D, yTop + 0.1 * D + 1.5 * st.ds), role: 'stem', material: 'Grade 60 bar' });
    const yGland = stuffingBox(b, st, tb, yBoxBase);
    op = sizeOperator(st.T, false);
    const stemTop = yGland + 2 + 1.5 * st.ds;
    b.push({ name: `stem ${st.ds} in`, mesh: cylY(st.ds / 2, yS + 0.3 * D, stemTop), role: 'stem', material: 'Grade 60 bar' });
    if (op.kind === 'gear') gearOperator(b, op, yGland + 0.5, st.ds, false); else handwheel(b, op, stemTop - 0.75 * st.ds, st.ds);
    Object.assign(dims, { lift: rule(lift, 'SW-VLV-GL-1', 'Disc lift'), seatOD: rule(1.2 * D, 'SW-VLV-GL-1', 'Seat ring OD'), thrust: rule(F, 'SW-VLV-GL-2', 'Stem thrust', 'lb') });
    extra = { lift, bonnet: fb, stem: st };
    notes.push('Inlet/outlet passages meet the chamber as plain openings; the cast S-transition is not modeled (stated).');
  } else if (type === 'CHECK') {                                                       // SW-VLV-C
    const wBody = 1.2 * D0, Rc = 0.65 * D0;
    c = common(NPS, cls, wBody, 2 * Rc);
    const { D, tb } = c;
    ends(b, c);
    const yBottom = -(0.65 * D + tb), yCover = 0.65 * D + 0.1 * D;
    chamber(b, c, Rc, yBottom + tb, yCover, [-D / 2, D / 2], [-D / 2, D / 2]);
    b.push({ name: 'body bottom', mesh: cylY(Rc + tb, yBottom, yBottom + tb), role: 'casting', material: 'Grade 36 casting' });
    const zs = -0.1 * D, tDisc = 0.15 * D, pin = Math.max(0.375, 0.1 * D);
    b.push({ name: 'seat ring', mesh: ringZ(0.6 * D, D / 2, zs - 0.05 * D, zs), role: 'stem', material: 'Grade 60 bar' });
    b.push({ name: 'disc', mesh: cylZ(0.6 * D, zs, zs + tDisc), role: 'closure', material: 'Grade 36 casting' });
    b.push({ name: 'hinge arm', mesh: box(-0.1 * D, 0, zs + tDisc, 0.1 * D, 0.6 * D + 0.1 * D, zs + tDisc + 0.08 * D), role: 'casting', material: 'Grade 36 casting' });
    b.push({ name: `hinge pin ${pin} in`, mesh: transformMesh(cylZ(pin / 2, -Rc - tb, Rc + tb), multiply(translate(0, 0.65 * D, zs + tDisc + 0.04 * D), toX)), role: 'stem', material: 'Grade 60 bar' });
    const { fb, yTop } = bonnetJoint(b, c, 2 * Rc, yCover, 'cover');
    b.push({ name: 'cover plate', mesh: cylY(Rc + tb, yTop, yTop + tb), role: 'casting', material: 'Grade 36 casting' });
    op = { kind: 'lever', rimForce: 0, T: 0 };
    Object.assign(dims, { discD: rule(1.2 * D, 'SW-VLV-C-1', 'Disc diameter'), discT: rule(tDisc, 'SW-VLV-C-1', 'Disc thickness'), pin: rule(pin, 'SW-VLV-C-1', 'Hinge pin diameter') });
    extra = { cover: fb };
  } else if (type === 'BALL') {                                                        // SW-VLV-B
    const Rb = 0.75 * D0, seat = 0.1 * D0, wBody = 1.5 * D0 + 2 * seat + 0.5;
    c = common(NPS, cls, wBody, 2 * Rb + 2 * seat);
    const { D, tb, f } = c;
    ends(b, c);
    const Rc = Rb + seat;
    // one-piece body cavity around the ball (end cap joint at +z side), neck boss for the stem
    b.push({ name: 'body cavity', mesh: ringZ(Rc + tb, Rc, -wBody / 2 - tb, wBody / 2 - 0.25), role: 'casting', material: 'Grade 36 casting' });
    const fe = designFlange(NPS, cls, 2 * Rc, tb, 2 * Rc + 2 * tb);
    b.push({ name: 'body end flange', mesh: flangeRing(fe, wBody / 2 - 0.25 - fe.tf, 2 * Rc), role: 'casting', material: 'Grade 36 casting' });
    b.push({ name: 'end cap gasket', mesh: ringZ((fe.gasketID + 2 * fe.wg) / 2, fe.gasketID / 2, wBody / 2 - 0.25, wBody / 2 - 0.25 + fe.gasketT), role: 'polymer', material: 'compressed sheet' });
    b.push({ name: 'end cap flange', mesh: flangeRing(fe, wBody / 2 - 0.25 + fe.gasketT, D), role: 'casting', material: 'Grade 36 casting' });
    const studs: MeshData[] = []; for (let i = 0; i < fe.n; i++) { const a = (2 * Math.PI * (i + 0.5)) / fe.n; studs.push(stud(fe.d, fe.studLen, wBody / 2 - 0.25 - fe.tf - (fe.studLen - 2 * fe.tf - fe.gasketT) / 2, (fe.BC / 2) * Math.cos(a), (fe.BC / 2) * Math.sin(a), 2 * fe.tf + fe.gasketT)); }
    b.push({ name: `end cap studs ${fe.n} × ${fe.d} in`, mesh: mergeMeshes(studs), role: 'hardware', material: 'Grade 90 stud', count: fe.n });
    // ball with through bore (open position: bore along z)
    const zc = Math.sqrt(Rb * Rb - (D / 2) ** 2);
    const loop: { r: number; z: number }[] = [];
    for (let i = 0; i <= 24; i++) { const z = -zc + (2 * zc * i) / 24; loop.push({ r: Math.sqrt(Math.max(0, Rb * Rb - z * z)), z }); }
    loop.push({ r: D / 2, z: zc }, { r: D / 2, z: -zc });
    b.push({ name: `ball ${2 * Rb} in`, mesh: revolve(loop, N), role: 'closure', material: 'Grade 60 bar' });
    for (const s of [-1, 1]) b.push({ name: 'seat ring', mesh: ringZ(0.6 * D + seat / 2, 0.6 * D - seat / 2, s * (Rb - 0.3 * seat) - seat / 2, s * (Rb - 0.3 * seat) + seat / 2), role: 'polymer', material: 'polymer' });
    const T = P * (Math.PI / 4) * (1.2 * D) ** 2 * 0.1 * (0.75 * D) * 1.2;             // SW-VLV-B-2
    const ds = roundUpTo(Math.max(Math.cbrt((16 * T) / (Math.PI * 0.3 * BAR60.Fy.value * 1000)), 0.375), 1 / 16);
    op = sizeOperator(T, true);
    const yNeck = Rc + tb + 1.5 * ds + 0.5;
    b.push({ name: 'stem boss', mesh: ringY(ds + 0.5, ds / 2 + 0.03, Rc - 0.5, yNeck), role: 'casting', material: 'Grade 36 casting' });
    b.push({ name: 'stem seal', mesh: ringY(ds / 2 + 0.03, ds / 2, yNeck - 0.6, yNeck - 0.2), role: 'polymer', material: 'polymer' });
    b.push({ name: `stem ${ds} in`, mesh: mergeMeshes([cylY(ds / 2, Rb - 0.4 * ds, yNeck + 1), cylY(ds, Rc - 0.4, Rc - 0.4 + 0.3 * ds)]), role: 'stem', material: 'Grade 60 bar' });
    if (op.kind === 'gear') gearOperator(b, op, yNeck, ds, true); else lever(b, op, yNeck + 0.2, ds, D);
    Object.assign(dims, { ballD: rule(2 * Rb, 'SW-VLV-B-1', 'Ball diameter'), seat: rule(seat, 'SW-VLV-B-1', 'Seat section'), torque: rule(T, 'SW-VLV-B-2', 'Operating torque (lb·in)', 'lb'), stemD: rule(ds, 'SW-VLV-B-2', 'Stem diameter') });
    extra = { endCap: fe, torque: T };
    void f;
  } else {                                                                             // BFLY, SW-VLV-BF
    const wBody = 0.3 * D0 + 1;
    c = common(NPS, cls, wBody, D0);
    const { D, tb, f } = c;
    c.F2F = wBody;                                                                     // wafer: no flanges of its own
    const bodyOD = f.BC - f.d - 0.25, liner = 0.125;
    b.push({ name: 'wafer body', mesh: ringZ(bodyOD / 2, D / 2 + liner, -wBody / 2, wBody / 2), role: 'casting', material: 'Grade 36 casting' });
    b.push({ name: 'liner', mesh: ringZ(D / 2 + liner, D / 2, -wBody / 2, wBody / 2), role: 'polymer', material: 'polymer' });
    const ds = Math.max(0.5, 0.12 * D), T = 0.014 * P * D ** 3;
    // lens disc about the flow axis, closed position shown (disc in the x-y plane)
    b.push({ name: 'disc', mesh: revolve([{ r: 0, z: -0.075 * D }, { r: D / 2, z: -0.025 * D }, { r: D / 2, z: 0.025 * D }, { r: 0, z: 0.075 * D }], N), role: 'closure', material: 'Grade 36 casting' });
    const yNeck = bodyOD / 2 + 1.5 * ds + 1;
    b.push({ name: 'neck boss', mesh: ringY(ds + 0.5, ds / 2 + 0.03, bodyOD / 2 - 0.5, yNeck), role: 'casting', material: 'Grade 36 casting' });
    b.push({ name: `shaft ${ds} in`, mesh: cylY(ds / 2, -bodyOD / 2 + 0.5, yNeck + 1), role: 'stem', material: 'Grade 60 bar' });
    b.push({ name: 'shaft seal', mesh: ringY(ds / 2 + 0.03, ds / 2, yNeck - 0.6, yNeck - 0.2), role: 'polymer', material: 'polymer' });
    op = sizeOperator(T, true);
    if (op.kind === 'gear') gearOperator(b, op, yNeck, ds, true); else { lever(b, op, yNeck + 0.2, ds, D); b.push({ name: 'notch plate', mesh: transformMesh(extrude({ outer: annularSector(1.5 * ds, 0.25 * D + 1, 0, Math.PI / 2, 8) }, 0.25), multiply(translate(0, yNeck, 0), toY)), role: 'casting', material: 'Grade 36 casting' }); }
    Object.assign(dims, { bodyOD: rule(bodyOD, 'SW-VLV-BF-1', 'Wafer body OD'), liner: rule(liner, 'SW-VLV-BF-1', 'Liner thickness'), shaftD: rule(ds, 'SW-VLV-BF-1', 'Shaft diameter'), torque: rule(T, 'SW-VLV-BF-1', 'Operating torque (lb·in)', 'lb') });
    extra = { torque: T };
    notes.push('Wafer body: held between the pipe flanges by their studs (SW-VLV-BF-1).');
  }
  const { D, tb, f, F2F, hHub, wBody } = c;
  Object.assign(dims, {
    D: rule(D, 'SW-VLV-1', 'Bore (full port)'), tb: rule(tb, 'SW-VLV-2', 'Body wall'), F2F: rule(F2F, 'SW-VLV-9', 'Face to face'),
    tf: rule(f.tf, 'SW-FLG-5', 'End flange thickness'), hHub: rule(hHub, 'SW-FLG-6', 'Hub + neck length'), wBody: rule(wBody, 'SW-VLV-9', 'Body cavity width'),
    flangeOD: rule(f.OD, 'SW-FLG-4', 'End flange OD'), studs: rule(f.n, 'SW-FLG-4', 'End studs per flange', 'count'), studD: rule(f.d, 'SW-FLG-4', 'End stud diameter'),
    operator: rule(op.kind === 'gear' ? op.ratio! : op.kind === 'lever' ? op.lever! : op.Dhw!, 'SW-VLV-4', op.kind === 'gear' ? 'Gear operator ratio' : op.kind === 'lever' ? 'Lever length' : 'Handwheel diameter', op.kind === 'gear' ? 'count' : 'in'),
    rimForce: rule(op.rimForce, 'SW-VLV-4', 'Operating force at the rim or lever end', 'lb'),
    rho: rhoDim(),
  });
  if (op.T) dims.T = rule(op.T, 'SW-VLV-5', 'Operating torque (lb·in)', 'lb');
  const steelVol = b.filter(s => s.role !== 'polymer').reduce((a, s) => a + signedVolume(s.mesh), 0);
  return {
    id, kind: 'VALVE', category: 'valve', designation: `${type}${NPS}-${cls}`, dims,
    length: rule(F2F, 'SW-VLV-9', 'Face to face'), material: CASTING,
    weight: rule(steelVol * RHO, 'SW-VLV-10', 'Steel weight from the drawn solids', 'lb'),
    notes: ['Designed by SW-VLV rules from bore, pressure and a 50 lbf operating effort; every internal is a drawn part.', ...notes],
    extra: { solids: b, operator: op, flange: f, type, ...extra },
  };
}
void hwFrame; void rotateZ;
