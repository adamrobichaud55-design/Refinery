/** Valves: DESIGN_BASIS.md sections 31–32. 18 types, each a distinct design. Local frame: flow along +z, stem up +y, x across. */
import { K } from '../../core/constants';
import { drawing, rule, constant, type Dim } from '../../core/basis';
import { roundUpTo } from '../../core/units';
import { type PartSpec, type Material } from '../part';
import { pipeDims, designFlange, CLASS_PRESSURE, SIZE_SERIES, CLASS_SERIES, type PipeClass, type FlangeDesign } from './pipe';
import { hexHardware } from './hardware';
import { revolve, extrude, transformMesh, signedVolume, mergeMeshes, helixTube, type MeshData, type Mat4 } from '../../geometry/mesh';
import { circle, rect, regularHexagon, annularSector, arc, dedupe, type Polygon } from '../../geometry/polygon';
import { multiply, translate, rotateX, rotateY, rotateZ } from '../../geometry/transform';
import { ringAroundHole } from '../../geometry/profiles';

const RHO = K.STEEL_DENSITY_LB_IN3;
const rhoDim = () => constant(K.STEEL_DENSITY_LB_FT3, 'K-1', 'Steel density', 'lb/ft3');
export type ValveType = 'GATE' | 'KNIFE' | 'GLOBE' | 'YGLOBE' | 'AGLOBE' | 'CHECK' | 'LCHECK' | 'DCHECK' | 'BALL' | 'TBALL' | 'BFLY' | 'LBFLY' | 'DBFLY' | 'PLUG' | 'DIAPH' | 'NEEDLE' | 'PSV' | 'CONTROL';
export const VALVE_TYPES: { id: ValveType; name: string }[] = [
  { id: 'GATE', name: 'Gate, wedge, OS&Y' }, { id: 'KNIFE', name: 'Knife gate, lugged wafer' }, { id: 'GLOBE', name: 'Globe, T-pattern' }, { id: 'YGLOBE', name: 'Globe, Y-pattern' },
  { id: 'AGLOBE', name: 'Angle globe' }, { id: 'CHECK', name: 'Swing check' }, { id: 'LCHECK', name: 'Lift (piston) check' }, { id: 'DCHECK', name: 'Dual-plate wafer check' },
  { id: 'BALL', name: 'Ball, floating' }, { id: 'TBALL', name: 'Ball, trunnion-mounted' }, { id: 'BFLY', name: 'Butterfly, wafer' }, { id: 'LBFLY', name: 'Butterfly, lugged' },
  { id: 'DBFLY', name: 'Butterfly, double-flanged, double-offset' }, { id: 'PLUG', name: 'Plug, lubricated taper' }, { id: 'DIAPH', name: 'Diaphragm, weir' }, { id: 'NEEDLE', name: 'Needle' },
  { id: 'PSV', name: 'Pressure safety valve' }, { id: 'CONTROL', name: 'Control, globe with diaphragm actuator' },
];
export type ValveRole = 'casting' | 'closure' | 'stem' | 'polymer' | 'hardware';
export interface ValveSolid { name: string; mesh: MeshData; role: ValveRole; material: string; count?: number }
export const CASTING: Material = { grade: 'Grade 36 casting', Fy: { value: 36, unit: 'ksi', basis: { kind: 'drawing' }, label: 'Minimum yield strength (grade stated on drawing)' } };
export const BAR60: Material = { grade: 'Grade 60 bar', Fy: { value: 60, unit: 'ksi', basis: { kind: 'drawing' }, label: 'Minimum yield strength (grade stated on drawing)' } };
const N = 48;

// ---- offering (SW-VLV-11) --------------------------------------------------------------------------------
const OFFER: Record<ValveType, [number, number, PipeClass]> = {
  GATE: [0.5, 48, 'P4800'], KNIFE: [2, 36, 'P150'], GLOBE: [0.5, 12, 'P4800'], YGLOBE: [0.5, 16, 'P4800'], AGLOBE: [0.5, 12, 'P4800'],
  CHECK: [2, 48, 'P4800'], LCHECK: [0.5, 6, 'P4800'], DCHECK: [2, 48, 'P600'], BALL: [0.5, 6, 'P600'], TBALL: [2, 48, 'P4800'],
  BFLY: [2, 24, 'P300'], LBFLY: [2, 24, 'P300'], DBFLY: [3, 48, 'P1200'], PLUG: [0.5, 12, 'P600'], DIAPH: [0.5, 12, 'P300'],
  NEEDLE: [0.25, 1, 'P4800'], PSV: [1, 8, 'P4800'], CONTROL: [0.5, 12, 'P4800'],
};
export function isOffered(type: ValveType, NPS: number, cls: PipeClass): boolean {
  const [lo, hi, maxCls] = OFFER[type];
  if (!SIZE_SERIES.includes(NPS) || NPS < lo || NPS > hi) return false;
  if (CLASS_SERIES.indexOf(cls) > CLASS_SERIES.indexOf(maxCls)) return false;
  return NPS * NPS * CLASS_PRESSURE[cls] <= 1800000;                        // P D² limit
}
export const offeredSizes = (type: ValveType, cls: PipeClass) => SIZE_SERIES.filter(n => isOffered(type, n, cls));
export const offeredClasses = (type: ValveType, NPS: number) => CLASS_SERIES.filter(c => isOffered(type, NPS, c));

// ---- geometry helpers (all return closed meshes) ---------------------------------------------------------
const cylZ = (r: number, z0: number, z1: number, x = 0, y = 0) => transformMesh(extrude({ outer: circle(0, 0, r, N) }, z1 - z0), translate(x, y, z0));
const ringZ = (ro: number, ri: number, z0: number, z1: number, x = 0, y = 0) => transformMesh(extrude({ outer: circle(0, 0, ro, N), inner: circle(0, 0, ri, N) }, z1 - z0), translate(x, y, z0));
const toY: Mat4 = rotateX(-Math.PI / 2);          // local z → world y
const toX: Mat4 = rotateY(Math.PI / 2);           // local z → world x
const cylY = (r: number, y0: number, y1: number, x = 0, z = 0) => transformMesh(cylZ(r, y0, y1), multiply(translate(x, 0, z), toY));
const ringY = (ro: number, ri: number, y0: number, y1: number, x = 0, z = 0) => transformMesh(ringZ(ro, ri, y0, y1), multiply(translate(x, 0, z), toY));
const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => { const [za, zb] = z0 < z1 ? [z0, z1] : [z1, z0]; return transformMesh(extrude({ outer: rect(Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1)) }, zb - za), translate(0, 0, za)); };
const revolveY = (loop: { r: number; z: number }[]) => transformMesh(revolve(loop, N), toY);
const torusY = (R: number, rt: number, y: number) => transformMesh(revolve(arc(R, 0, rt, 0, 2 * Math.PI, 24).slice(0, -1).map(p => ({ r: p.x, z: p.y })), N), multiply(translate(0, y, 0), toY));
const hexPrismY = (F: number, y0: number, y1: number, x = 0, z = 0) => transformMesh(extrude({ outer: regularHexagon(F) }, y1 - y0), multiply(translate(x, 0, z), multiply(toY, translate(0, 0, y0))));
/** flange ring (thickness t, default the design thickness) with n holes as star-shaped cells, along z from z0 */
function flangeRing(f: FlangeDesign, z0: number, bore: number, t = f.tf, holes = true): MeshData {
  const cells: MeshData[] = [];
  for (let i = 0; i < f.n; i++) {
    const a = (2 * Math.PI * (i + 0.5)) / f.n, half = Math.PI / f.n;
    const sector = bore > 0 ? annularSector(bore / 2, f.OD / 2, a - half, a + half, 6) : dedupe([{ x: 0, y: 0 }, ...arc(0, 0, f.OD / 2, a - half, a + half, 8)]);
    const prof = holes ? ringAroundHole(sector, { x: (f.BC / 2) * Math.cos(a), y: (f.BC / 2) * Math.sin(a) }, f.holeD / 2, 24) : { outer: sector };
    cells.push(transformMesh(extrude(prof, t), translate(0, 0, z0)));
  }
  return mergeMeshes(cells);
}
function stud(d: number, L: number, z0: number, x: number, y: number, tStack: number): MeshData {
  const h = hexHardware(d), nutProf = ringAroundHole(regularHexagon(h.F), { x: 0, y: 0 }, d / 2, 24);
  const stick = (L - tStack) / 2;
  return mergeMeshes([transformMesh(cylZ(d / 2, 0, L), translate(x, y, z0)), transformMesh(extrude(nutProf, h.nutH), translate(x, y, z0 + stick - h.nutH)), transformMesh(extrude(nutProf, h.nutH), translate(x, y, z0 + stick + tStack))]);
}
/** studs around a flange joint along z: plates from z0 (stack thickness tStack) */
function studRing(f: FlangeDesign, z0: number, tStack: number): MeshData {
  const arr: MeshData[] = [];
  for (let i = 0; i < f.n; i++) { const a = (2 * Math.PI * (i + 0.5)) / f.n; arr.push(stud(f.d, f.studLen, z0 - (f.studLen - tStack) / 2, (f.BC / 2) * Math.cos(a), (f.BC / 2) * Math.sin(a), tStack)); }
  return mergeMeshes(arr);
}
/** tube of radius r along a polyline (local frame), closed with end caps */
function pathTube(path: [number, number, number][], r: number, nRing = 10): MeshData {
  const positions: number[] = [], indices: number[] = [], rings: number[][] = [];
  const sub = (a: number[], b: number[]) => [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const norm = (v: number[]) => { const L = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / L, v[1] / L, v[2] / L]; };
  const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  let ref = [0, 1, 0];
  for (let i = 0; i < path.length; i++) {
    const t = norm(i === 0 ? sub(path[0], path[1]) : i === path.length - 1 ? sub(path[i - 1], path[i]) : sub(path[i - 1], path[i + 1]));
    if (Math.abs(t[0] * ref[0] + t[1] * ref[1] + t[2] * ref[2]) > 0.95) ref = [1, 0, 0];
    const n1 = norm(cross(t, ref)), n2 = cross(t, n1), ring: number[] = [];
    for (let k = 0; k < nRing; k++) { const a = (2 * Math.PI * k) / nRing; positions.push(path[i][0] + r * (Math.cos(a) * n1[0] + Math.sin(a) * n2[0]), path[i][1] + r * (Math.cos(a) * n1[1] + Math.sin(a) * n2[1]), path[i][2] + r * (Math.cos(a) * n1[2] + Math.sin(a) * n2[2])); ring.push(positions.length / 3 - 1); }
    rings.push(ring);
  }
  for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < nRing; k++) { const k2 = (k + 1) % nRing; indices.push(rings[i][k], rings[i + 1][k], rings[i + 1][k2], rings[i][k], rings[i + 1][k2], rings[i][k2]); }
  for (const [ring, flip] of [[rings[0], false], [rings[rings.length - 1], true]] as const) {
    let cx = 0, cy = 0, cz = 0; for (const v of ring) { cx += positions[3 * v]; cy += positions[3 * v + 1]; cz += positions[3 * v + 2]; }
    positions.push(cx / nRing, cy / nRing, cz / nRing); const c = positions.length / 3 - 1;
    for (let k = 0; k < nRing; k++) { const k2 = (k + 1) % nRing; if (flip) indices.push(c, ring[k2], ring[k]); else indices.push(c, ring[k], ring[k2]); }
  }
  const m = { positions, indices };
  if (signedVolume(m) < 0) for (let k = 0; k < indices.length; k += 3) { const t = indices[k + 1]; indices[k + 1] = indices[k + 2]; indices[k + 2] = t; }
  return m;
}
/** hex bolt along local z from z0 (head at the far end z0+L..z0+L+H, nut near z0) through a stack of thickness tStack starting at z0+stick */
function hexBolt(d: number, tStack: number, z0: number, x: number, y: number): MeshData {
  const h = hexHardware(d), nutProf = ringAroundHole(regularHexagon(h.F), { x: 0, y: 0 }, d / 2, 24), headProf = { outer: regularHexagon(h.F) };
  const stick = d / 4, L = tStack + h.nutH + stick;
  return mergeMeshes([transformMesh(cylZ(d / 2, 0, L), translate(x, y, z0 - h.nutH - stick + 0)), transformMesh(extrude(nutProf, h.nutH), translate(x, y, z0 - h.nutH)), transformMesh(extrude(headProf, h.H), translate(x, y, z0 + tStack))]);
}
/** ring of hex bolts around a joint along z: stack from z0 to z0+tStack, heads at the top */
function boltRing(f: FlangeDesign, z0: number, tStack: number): MeshData {
  const arr: MeshData[] = [];
  for (let i = 0; i < f.n; i++) { const a = (2 * Math.PI * (i + 0.5)) / f.n; arr.push(hexBolt(f.d, tStack, z0, (f.BC / 2) * Math.cos(a), (f.BC / 2) * Math.sin(a))); }
  return mergeMeshes(arr);
}
/** domed bonnet: from the neck radius Rn at yTop to the stuffing-box radius rb at yBox, wall tb, with a rounded shoulder */
function domeBonnet(Rn: number, yTop: number, rb: number, yBox: number, tb: number): MeshData {
  const H = yBox - yTop, outer: { r: number; z: number }[] = [], inner: { r: number; z: number }[] = [];
  for (let i = 0; i <= 10; i++) { const a = (Math.PI / 2) * (i / 10); const r = rb + (Rn - rb) * Math.cos(a), z = yTop + H * Math.sin(a); outer.push({ r: r + tb, z }); inner.push({ r, z }); }
  return revolveY([...outer, ...inner.reverse()]);
}
/** tapered cast arm in the x–y plane: from width w0 at y0 to w1 at y1, centred on xc, thickness t along z */
const taperedArm = (xc: number, y0: number, y1: number, w0: number, w1: number, t: number) => transformMesh(extrude({ outer: [{ x: xc - w0 / 2, y: y0 }, { x: xc + w0 / 2, y: y0 }, { x: xc + w1 / 2, y: y1 }, { x: xc - w1 / 2, y: y1 }] }, t), translate(0, 0, -t / 2));
const CAST = 'Grade 36 casting', BAR = 'Grade 60 bar', STUDM = 'Grade 90 stud';
const push = (b: ValveSolid[], name: string, mesh: MeshData, role: ValveRole = 'casting', material = CAST, count?: number) => b.push({ name, mesh, role, material, count });

// ---- operability (SW-VLV-4/5/8) -------------------------------------------------------------------------
export interface Operator { kind: 'handwheel' | 'lever' | 'gear' | 'tbar' | 'none'; Dhw?: number; lever?: number; ratio?: number; rimForce: number; T: number }
export function sizeOperator(T: number, quarterTurn: boolean): Operator {
  if (quarterTurn) { const L = roundUpTo(T / 50, 2); if (L <= 24) return { kind: 'lever', lever: Math.max(6, L), rimForce: T / Math.max(6, L), T }; }
  else { const D = roundUpTo((2 * T) / 80, 2); if (D <= 30) return { kind: 'handwheel', Dhw: Math.max(6, D), rimForce: (2 * T) / Math.max(6, D), T }; }
  const ratio = Math.ceil(T / (80 * 6));
  return { kind: 'gear', ratio, Dhw: 12, rimForce: T / ratio / 6, T };
}
export interface StemDesign { F: number; ds: number; p: number; T: number; packing: number; boxBore: number }
export function risingStem(F: number, D = 0, pitchDiv = 5): StemDesign {           // SW-VLV-5/6
  const ds = roundUpTo(Math.max(Math.sqrt((4 * F) / (Math.PI * 0.25 * BAR60.Fy.value * 1000)), D / 8, 0.5), 1 / 16);
  const p = ds / pitchDiv, lambda = Math.atan(p / (Math.PI * ds)), phi = Math.atan(0.15);
  const T = F * (ds / 2) * Math.tan(lambda + phi) + F * 0.02 * (ds / 2);
  const packing = roundUpTo(Math.max(0.25, ds / 8), 1 / 16);
  return { F, ds, p, T, packing, boxBore: ds + 2 * packing };
}
export interface SpringDesign { F: number; dw: number; Dm: number; turns: number; pitch: number; length: number }
export function springDesign(F: number, deflection?: number): SpringDesign {       // SW-VLV-PSV-1 / CV-1
  const dw = roundUpTo(Math.sqrt((52 * F) / (Math.PI * 90000)), 1 / 32), Dm = 5 * dw;        // index 5, τ = 90 ksi
  if (deflection === undefined) { const turns = 8, pitch = 2.5 * dw; return { F, dw, Dm, turns, pitch, length: turns * pitch }; }
  const G = (K.STEEL_E_KSI * 1000) / (2 * (1 + K.STEEL_NU));                       // shear modulus from K-2, K-3
  const nA = Math.max(2, Math.ceil((deflection * G * dw ** 4) / (8 * F * Dm ** 3))), turns = nA + 2, pitch = dw + (1.2 * deflection) / nA;
  return { F, dw, Dm, turns, pitch, length: turns * pitch };
}
function handwheel(b: ValveSolid[], op: Operator, y: number, ds: number, clearD = 0) {   // SW-VLV-8: y is the rim plane
  if (clearD + 3 > op.Dhw!) { op.Dhw = roundUpTo(clearD + 3, 2); op.rimForce = (2 * op.T) / op.Dhw; }
  const D = op.Dhw!, rt = Math.min(1.5, 0.06 * D + 0.25) / 2, spokes = D > 16 ? 6 : 4, hubR = Math.max(ds, 0.75), hubL = 1.5 * ds + 0.5, dish = 0.12 * D;
  const parts: MeshData[] = [torusY(D / 2 - rt, rt, y), cylY(hubR, y - dish - hubL / 2, y - dish + hubL / 2)];
  for (let i = 0; i < spokes; i++) {
    const a = (2 * Math.PI * i) / spokes, ca = Math.cos(a), sa = Math.sin(a);
    const path: [number, number, number][] = [0.2, 0.45, 0.7, 1].map(u => { const r = hubR * 0.8 + u * (D / 2 - rt - hubR * 0.8); return [r * ca, y - dish * (1 - u * u), r * sa]; });
    parts.push(pathTube([[hubR * 0.6 * ca, y - dish, hubR * 0.6 * sa], ...path], 0.6 * rt));
  }
  push(b, `handwheel ${D} in`, mergeMeshes(parts));
}
function lever(b: ValveSolid[], op: Operator, y: number, ds: number, D: number) {   // lever along +z (open position)
  const L = op.lever!, w = Math.max(1, 0.25 * D), t = 0.25;
  push(b, `lever ${L} in`, mergeMeshes([box(-w / 2, y, 0, w / 2, y + t, L), cylY(Math.max(ds, 0.6) + 0.2, y - 0.5, y + t + 0.5), box(-w / 2, y - 0.5, -1.5, w / 2, y + 0.5, 1.5)]));
  push(b, 'lever grip', transformMesh(cylZ(0.5, L - 4, L + 1), translate(0, y + t + 0.5, 0)), 'polymer', 'polymer');
}
function gearOperator(b: ValveSolid[], op: Operator, y: number, ds: number) {
  const s = Math.max(4, 3 * ds), yc = y + 0.6 * s;
  push(b, `gear operator ${op.ratio}:1`, box(-s, y, -s, s, y + 1.2 * s, s));
  push(b, 'input shaft', transformMesh(cylZ(0.5, s, s + 3), multiply(translate(0, yc, 0), toX)), 'stem', BAR);
  const parts: MeshData[] = [transformMesh(torusY(6 - 0.6, 0.6, 0), multiply(translate(s + 3, yc, 0), rotateZ(-Math.PI / 2))), transformMesh(cylZ(1, s + 2, s + 4), multiply(translate(0, yc, 0), toX))];
  for (let i = 0; i < 4; i++) parts.push(transformMesh(cylZ(0.3, 0.8, 5.4), multiply(translate(s + 3, yc, 0), rotateX((2 * Math.PI * i) / 4))));
  push(b, 'input handwheel 12 in', mergeMeshes(parts));
}
const operate = (b: ValveSolid[], op: Operator, y: number, ds: number, D: number, clearD = 0) => { if (op.kind === 'gear') gearOperator(b, op, y, ds); else if (op.kind === 'lever') lever(b, op, y, ds, D); else if (op.kind === 'handwheel') handwheel(b, op, y, ds, clearD); };

// ---- shared body builders -------------------------------------------------------------------------------
interface Common { NPS: number; cls: PipeClass; P: number; D: number; tb: number; f: FlangeDesign; F2F: number; hHub: number; wBody: number }
function common(NPS: number, cls: PipeClass, wBody: number, Dc: number): Common {
  const pd = pipeDims(NPS, cls), P = CLASS_PRESSURE[cls], f = designFlange(NPS, cls);
  const Sc = (CASTING.Fy.value * 1000) / 2.5;
  const tb = roundUpTo(Math.max(0.25, (P * Dc) / (2 * Sc) + 0.125), 1 / 16);                                  // SW-VLV-2
  const hHub = f.hubLen + f.neckLen, F2F = 2 * f.tf + 2 * hHub + wBody;                                       // SW-VLV-9
  return { NPS, cls, P, D: pd.D, tb, f, F2F, hHub, wBody };
}
/** one flanged end at the face z = sz·zFace with the hub tapering to the cavity wall at |z| = zCav */
function flangedEnd(b: ValveSolid[], c: Common, s: 1 | -1, zFace: number, zCav: number, f = c.f, D = c.D) {
  const { tb } = c;
  push(b, 'end flange', flangeRing(f, s > 0 ? zFace - f.tf : -zFace, D));
  push(b, 'raised face', s > 0 ? ringZ(f.rfOD / 2, D / 2, zFace, zFace + f.rfH) : ringZ(f.rfOD / 2, D / 2, -zFace - f.rfH, -zFace));
  const zi = s * (zFace - f.tf), zo = s * zCav;
  const loop = [{ r: D / 2, z: zi }, { r: D / 2 + 2 * tb, z: zi }, { r: D / 2 + tb, z: zi - s * f.hubLen }, { r: D / 2 + tb, z: zo }, { r: D / 2, z: zo }];
  push(b, 'body run', revolve(s > 0 ? loop : loop.reverse(), N));
}
const ends = (b: ValveSolid[], c: Common) => { for (const s of [-1, 1] as const) flangedEnd(b, c, s, c.F2F / 2, c.wBody / 2 + c.tb); };
/** vertical chamber wall of inner radius Rc from y0 to y1 with run openings at ±z (each a y-range) */
function chamber(b: ValveSolid[], c: Common, Rc: number, y0: number, y1: number, openIn: [number, number], openOut: [number, number]) {
  const { tb, D } = c, half = Math.asin(Math.min(1, (D / 2) / Rc));
  const yMid0 = Math.min(openIn[0], openOut[0]), yMid1 = Math.max(openIn[1], openOut[1]);
  for (const [a, bnd] of [[y0, yMid0], [yMid1, y1]]) if (bnd - a > 1e-6) push(b, 'body chamber', ringY(Rc + tb, Rc, a, bnd));
  const seg = (a0: number, a1: number, ya: number, yb: number) => { if (yb - ya > 1e-6 && a1 > a0 + 1e-9) push(b, 'body chamber', transformMesh(extrude({ outer: annularSector(Rc, Rc + tb, a0, a1, 12) }, yb - ya), multiply(translate(0, ya, 0), toY))); };
  seg(-Math.PI / 2 + half, Math.PI / 2 - half, yMid0, yMid1); seg(Math.PI / 2 + half, 1.5 * Math.PI - half, yMid0, yMid1);
  for (const [a0, a1, op] of [[Math.PI / 2 - half, Math.PI / 2 + half, openOut], [1.5 * Math.PI - half, 1.5 * Math.PI + half, openIn]] as const) { seg(a0, a1, yMid0, op[0]); seg(a0, a1, op[1], yMid1); }
}
/** bolted cover/bonnet joint on a vertical neck of bore `neckBore` at y (SW-VLV-7); returns the joint flange design and the top of the cover flange */
function bonnetJoint(b: ValveSolid[], c: Common, neckBore: number, y: number, name = 'bonnet', coverBore = neckBore) {
  const fb = designFlange(c.NPS, c.cls, neckBore, c.tb, neckBore + 2 * c.tb);
  push(b, 'body bonnet flange', transformMesh(flangeRing(fb, 0, neckBore), multiply(translate(0, y - fb.tf, 0), toY)));
  push(b, `${name} gasket`, ringY((fb.gasketID + 2 * fb.wg) / 2, fb.gasketID / 2, y, y + fb.gasketT), 'polymer', 'compressed sheet');
  push(b, `${name} flange`, transformMesh(flangeRing(fb, 0, coverBore), multiply(translate(0, y + fb.gasketT, 0), toY)));
  push(b, `${name} bolts ${fb.n} × ${fb.d} in`, transformMesh(boltRing(fb, 0, 2 * fb.tf + fb.gasketT), multiply(translate(0, y - fb.tf, 0), toY)), 'hardware', 'Grade 90 bolt', fb.n);
  push(b, 'body flange fillet', revolveY([{ r: neckBore / 2 + c.tb, z: y - fb.tf - c.tb }, { r: neckBore / 2 + 2 * c.tb, z: y - fb.tf }, { r: neckBore / 2 + c.tb, z: y - fb.tf }]));
  return { fb, yTop: y + fb.gasketT + fb.tf };
}
function stuffingBox(b: ValveSolid[], st: StemDesign, tb: number, y0: number, rings = 4) {   // SW-VLV-6
  const s = st.packing, h = rings * s;
  push(b, 'stuffing box', ringY(st.boxBore / 2 + tb, st.boxBore / 2, y0, y0 + h + s));
  for (let i = 0; i < rings; i++) push(b, 'packing ring', ringY(st.boxBore / 2, st.ds / 2, y0 + i * s, y0 + (i + 1) * s), 'polymer', 'braided packing');
  push(b, 'gland follower', mergeMeshes([ringY(st.boxBore / 2 - 0.02, st.ds / 2, y0 + h, y0 + h + s + 0.25), ringY(st.boxBore / 2 + tb + 0.75, st.ds / 2, y0 + h + s, y0 + h + s + 0.25)]));
  const dg = Math.max(0.375, s), studs: MeshData[] = [];
  for (const sx of [-1, 1]) studs.push(transformMesh(stud(dg, 2 * s + 1.5, 0, sx * (st.boxBore / 2 + tb + 0.4), 0, s + 0.25), multiply(translate(0, y0 + h - s, 0), toY)));
  push(b, `gland studs 2 × ${dg} in`, mergeMeshes(studs), 'hardware', STUDM, 2);
  return y0 + h + s + 0.25;
}
/** conical bonnet from the neck (radius Rn at yTop) to the stuffing box (radius rb at yBox) */
const bonnetCone = (b: ValveSolid[], Rn: number, yTop: number, rb: number, yBox: number, tb: number) => push(b, 'bonnet', domeBonnet(Rn, yTop, rb, yBox, tb));

// ---- type builders -----------------------------------------------------------------------------------------
type Build = (b: ValveSolid[], NPS: number, cls: PipeClass, dims: Record<string, Dim>, notes: string[]) => { c: Common; op: Operator; extra?: Record<string, unknown> };

const buildGate: Build = (b, NPS, cls, dims) => {
  const D0 = pipeDims(NPS, cls).D, P = CLASS_PRESSURE[cls], Rc = 0.675 * D0;
  const c = common(NPS, cls, D0, 2 * Rc); c.wBody = D0 + 2 * c.tb; c.F2F = 2 * c.f.tf + 2 * c.hHub + c.wBody;   // G-2
  const { D, tb } = c; ends(b, c);
  const stroke = 1.05 * D, yBottom = -(D / 2 + 0.1 * D + tb), yBonnet = D / 2 + 0.6 * D;
  chamber(b, c, Rc, yBottom + tb, yBonnet, [-D / 2, D / 2], [-D / 2, D / 2]);
  push(b, 'body bottom', cylY(Rc + tb, yBottom, yBottom + tb));
  const sw = Math.max(0.25, 0.1 * D), tw = 0.25 * D, tan5 = Math.tan((5 * Math.PI) / 180);
  for (const s of [-1, 1]) push(b, 'seat ring', transformMesh(ringZ(0.65 * D, D / 2, -sw / 2, sw / 2), multiply(translate(0, 0, s * (tw / 2 + sw / 2)), rotateX(-s * (5 * Math.PI) / 180))), 'stem', BAR);
  const wedge = extrude({ outer: circle(0, 0, 0.65 * D, N) }, tw, -tw / 2, { start: { dx: 0, dy: -tan5 }, end: { dx: 0, dy: tan5 } });
  push(b, 'wedge', mergeMeshes([wedge, cylY(0.15 * D, 0.6 * D, 0.75 * D)]), 'closure');
  const F = P * (Math.PI / 4) * D * D * ((0.3 + tan5) * 1.15 + 0.25);                                          // G-3
  const st = risingStem(F, D);
  const { fb, yTop } = bonnetJoint(b, c, 2 * Rc, yBonnet);
  const yBoxBase = yTop + 0.5 * D;
  bonnetCone(b, Rc, yTop, st.boxBore / 2, yBoxBase, tb);
  const yGland = stuffingBox(b, st, tb, yBoxBase);
  const yNut = yGland + stroke + 2, nutH = 1.5 * st.ds, ta = Math.max(0.375, 0.8 * tb), bossR = 1.5 * st.ds + 0.25;   // G-4
  for (const sx of [-1, 1]) push(b, 'yoke arm', taperedArm(sx * (Rc * 0.75), yTop, yNut + nutH / 2, 0.25 * D, 0.12 * D, ta));
  push(b, 'yoke boss', cylY(bossR + ta, yNut - 0.25, yNut + nutH + 0.25));
  push(b, 'yoke cross', box(-Rc * 0.75, yNut, -ta / 2, Rc * 0.75, yNut + nutH, ta / 2));
  push(b, 'stem nut', ringY(bossR, st.ds / 2 + 0.02, yNut - 0.5, yNut + nutH + 0.5), 'stem', BAR);
  const op = sizeOperator(st.T, false);
  push(b, `stem ${st.ds} in`, cylY(st.ds / 2, 0.75 * D, yNut + nutH + 2 + 1.5 * st.ds), 'stem', BAR);
  operate(b, op, op.kind === 'gear' ? yNut + nutH + 0.5 : yNut + nutH + 1 + 0.12 * (op.Dhw ?? 0), st.ds, D, 2 * bossR + 2 * ta);
  Object.assign(dims, { stroke: rule(stroke, 'SW-VLV-G-2', 'Stroke'), wedgeT: rule(tw, 'SW-VLV-G-1', 'Wedge thickness at the seat line'), seatW: rule(sw, 'SW-VLV-G-1', 'Seat face width'), thrust: rule(F, 'SW-VLV-G-3', 'Stem thrust', 'lb'), stemD: rule(st.ds, 'SW-VLV-5', 'Stem diameter') });
  return { c, op, extra: { stroke, bonnet: fb, stem: st } };
};

const buildKnife: Build = (b, NPS, cls, dims) => {
  const D0 = pipeDims(NPS, cls).D, P = CLASS_PRESSURE[cls];
  const w = Math.max(1.5, 0.12 * D0 + 1);
  const c = common(NPS, cls, w, D0); c.F2F = w;                                                                 // K-1 wafer
  const { D, tb, f } = c, hw = 0.65 * D, tg = Math.max(0.25, 0.03 * D), stroke = 1.05 * D;
  push(b, 'lugged body', flangeRing(f, -w / 2, D, w));
  const yH = D / 2 + 0.15 * D;                                                                                   // housing top
  for (const sz of [-1, 1]) push(b, 'gate housing wall', box(-hw - tb, 0, sz * (tg / 2 + 0.06), hw + tb, yH, sz * w / 2));
  for (const sx of [-1, 1]) push(b, 'gate housing side', box(sx * hw, 0, -w / 2, sx * (hw + tb), yH, w / 2));
  const F = P * (Math.PI / 4) * D * D * 0.3 * 1.2, st = risingStem(F, D), s = st.packing;                      // K-2
  push(b, 'transverse packing box', mergeMeshes([box(-hw - tb, yH, -w / 2, hw + tb, yH + 4 * s + s, -tg / 2 - 0.06), box(-hw - tb, yH, tg / 2 + 0.06, hw + tb, yH + 4 * s + s, w / 2)]));
  for (let i = 0; i < 4; i++) push(b, 'packing strip', box(-hw, yH + i * s, -tg / 2 - 0.06, hw, yH + (i + 1) * s, tg / 2 + 0.06), 'polymer', 'braided packing');
  push(b, 'gland plate', box(-hw - tb - 0.5, yH + 5 * s, -w / 2, hw + tb + 0.5, yH + 5 * s + tb, w / 2));
  const dg = Math.max(0.375, s), gl: MeshData[] = [];
  for (const sx of [-1, 1]) gl.push(transformMesh(stud(dg, 3 * s + 1.5, 0, sx * (hw + tb + 0.25), 0, s + tb), multiply(translate(0, yH + 4 * s, 0), toY)));
  push(b, `gland studs 2 × ${dg} in`, mergeMeshes(gl), 'hardware', STUDM, 2);
  { const rGate = 0.52 * D, yTopG = yH + 5 * s + tb + 1, a0 = Math.asin(Math.min(1, hw / rGate));                // K-1: rounded bottom edge concentric with the bore
    const outline = dedupe([{ x: -hw, y: yTopG }, { x: -hw, y: Math.max(-rGate * Math.cos(a0), -rGate) }, ...arc(0, 0, rGate, -Math.PI / 2 - a0, -Math.PI / 2 + a0, 24), { x: hw, y: yTopG }]);
    push(b, 'gate plate', transformMesh(extrude({ outer: outline }, tg), translate(0, 0, -tg / 2)), 'closure'); }
  const yNut = yH + 5 * s + tb + stroke + 2, nutH = 1.5 * st.ds, ta = Math.max(0.375, 0.8 * tb), bossR = 1.5 * st.ds + 0.25;
  for (const sx of [-1, 1]) push(b, 'yoke arm', taperedArm(sx * hw * 0.8, yH + 5 * s + tb, yNut + nutH / 2, 0.25 * D, 0.12 * D, ta));
  push(b, 'yoke boss', cylY(bossR + ta, yNut - 0.25, yNut + nutH + 0.25));
  push(b, 'yoke cross', box(-hw * 0.8, yNut, -ta / 2, hw * 0.8, yNut + nutH, ta / 2));
  push(b, 'stem nut', ringY(bossR, st.ds / 2 + 0.02, yNut - 0.5, yNut + nutH + 0.5), 'stem', BAR);
  const op = sizeOperator(st.T, false);
  push(b, `stem ${st.ds} in`, cylY(st.ds / 2, yH + 5 * s + tb, yNut + nutH + 2 + 1.5 * st.ds), 'stem', BAR);
  operate(b, op, op.kind === 'gear' ? yNut + nutH + 0.5 : yNut + nutH + 1 + 0.12 * (op.Dhw ?? 0), st.ds, D, 2 * bossR + 2 * ta);
  Object.assign(dims, { bodyW: rule(w, 'SW-VLV-K-1', 'Body width'), gateT: rule(tg, 'SW-VLV-K-1', 'Gate plate thickness'), stroke: rule(stroke, 'SW-VLV-K-1', 'Stroke'), thrust: rule(F, 'SW-VLV-K-2', 'Stem thrust', 'lb'), stemD: rule(st.ds, 'SW-VLV-5', 'Stem diameter') });
  return { c, op };
};

/** globe internals shared by T, Y, angle, lift check and control: chamber, partition, seat ring; returns key heights */
function globeBody(b: ValveSolid[], c: Common, Rc: number, openIn: [number, number], openOut: [number, number]) {
  const { D, tb } = c, yBottom = -(0.75 * D + tb), yBonnet = 0.75 * D;
  chamber(b, c, Rc, yBottom + tb, yBonnet, openIn, openOut);
  push(b, 'body bottom', cylY(Rc + tb, yBottom, yBottom + tb));
  push(b, 'partition', ringY(Rc, 0.6 * D, -tb / 2, tb / 2));
  push(b, 'seat ring', ringY(0.6 * D, D / 2, tb / 2, tb / 2 + 0.1 * D), 'stem', BAR);
  return { yBonnet, yS: tb / 2 + 0.1 * D };
}
function plugDisc(b: ValveSolid[], D: number, yS: number, ds: number) {
  push(b, 'disc', revolveY([{ r: 0, z: yS - 0.15 * D }, { r: D / 2 - 0.05 * D, z: yS - 0.15 * D }, { r: 0.6 * D, z: yS + 0.12 * D }, { r: 0.6 * D, z: yS + 0.27 * D }, { r: ds, z: yS + 0.27 * D }, { r: ds, z: yS + 0.4 * D }, { r: 0, z: yS + 0.4 * D }]), 'closure');
}
const buildGlobeCore = (b: ValveSolid[], c: Common, Rc: number, dims: Record<string, Dim>, openIn: [number, number], openOut: [number, number]) => {
  const { D, tb, P } = c;
  const { yBonnet, yS } = globeBody(b, c, Rc, openIn, openOut);
  const lift = D / 4, F = P * (Math.PI / 4) * (1.2 * D) ** 2 * 1.15, st = risingStem(F, D);                   // GL-1/2
  plugDisc(b, D, yS, st.ds);
  const { fb, yTop } = bonnetJoint(b, c, 2 * Rc, yBonnet);
  const yBoxBase = yTop + 0.4 * D + lift;
  bonnetCone(b, Rc, yTop, st.boxBore / 2, yBoxBase, tb);
  push(b, 'stem nut (in bonnet)', ringY(st.ds, st.ds / 2 + 0.02, yTop + 0.1 * D, yTop + 0.1 * D + 1.5 * st.ds), 'stem', BAR);
  const yGland = stuffingBox(b, st, tb, yBoxBase);
  const op = sizeOperator(st.T, false), stemTop = yGland + 2 + 1.5 * st.ds;
  push(b, `stem ${st.ds} in`, cylY(st.ds / 2, yS + 0.3 * D, stemTop), 'stem', BAR);
  operate(b, op, op.kind === 'gear' ? yGland + 0.5 : stemTop, st.ds, D, st.boxBore + 2 * tb + 1.5);
  Object.assign(dims, { lift: rule(lift, 'SW-VLV-GL-1', 'Disc lift'), seatOD: rule(1.2 * D, 'SW-VLV-GL-1', 'Seat ring OD'), thrust: rule(F, 'SW-VLV-GL-2', 'Stem thrust', 'lb'), stemD: rule(st.ds, 'SW-VLV-5', 'Stem diameter') });
  return { op, extra: { lift, bonnet: fb, stem: st } };
};
const buildGlobe: Build = (b, NPS, cls, dims, notes) => {
  const D0 = pipeDims(NPS, cls).D, Rc = 0.75 * D0, c = common(NPS, cls, 1.5 * D0, 2 * Rc); const { D } = c; ends(b, c);
  const r = buildGlobeCore(b, c, Rc, dims, [-D / 2, 0], [0, D / 2]);
  notes.push('Inlet/outlet passages meet the chamber as plain openings; the cast S-transition is not modeled (stated).');
  return { c, ...r };
};
const buildYGlobe: Build = (b, NPS, cls, dims, notes) => {
  const D0 = pipeDims(NPS, cls).D, Rc = 0.75 * D0, c = common(NPS, cls, 1.5 * D0, 2 * Rc);
  for (const s of [-1, 1] as const) flangedEnd(b, c, s, c.F2F / 2, 0.01);          // run tubes meet at the centre inside the inclined chamber
  // build the T-pattern stack in a sub-list with a continuous chamber wall, then tilt it 45° toward the inlet (−z) (GY-1)
  const sub: ValveSolid[] = [];
  const r = buildGlobeCore(sub, c, Rc, dims, [0, 0], [0, 0]);
  const tiltM = rotateX(-Math.PI / 4);                                              // rotateX(θ): y → (0, cos θ, sin θ); θ = −45° tilts the stem toward −z
  for (const s of sub) push(b, s.name, transformMesh(s.mesh, tiltM), s.role, s.material, s.count);
  notes.push('Stem and seat on a 45° axis toward the inlet (SW-VLV-GY-1); the chamber bulge below the run is the cast body.');
  return { c, ...r };
};
const buildAGlobe: Build = (b, NPS, cls, dims, notes) => {
  const D0 = pipeDims(NPS, cls).D, Rc = 0.75 * D0, c = common(NPS, cls, 1.5 * D0, 2 * Rc);
  const { D, tb, f } = c, CF = f.tf + c.hHub + 0.75 * D; c.F2F = 2 * CF;
  flangedEnd(b, c, -1, CF, 0.75 * D + tb);                                                                     // inlet on −z
  // outlet downward: flange ring at y ∈ [−CF, −CF + tf] (built along z then stood up), hub up to the chamber bottom
  push(b, 'end flange', transformMesh(flangeRing(f, 0, D), multiply(translate(0, -CF, 0), toY)));
  push(b, 'raised face', ringY(f.rfOD / 2, D / 2, -CF - f.rfH, -CF));
  push(b, 'body run', revolveY([{ r: D / 2, z: -CF + f.tf }, { r: D / 2 + 2 * tb, z: -CF + f.tf }, { r: D / 2 + tb, z: -CF + f.tf + f.hubLen }, { r: D / 2 + tb, z: -0.75 * D - tb }, { r: D / 2, z: -0.75 * D - tb }]));
  const yBonnet = 0.75 * D;
  chamber(b, c, Rc, -0.75 * D, yBonnet, [-D / 2, D / 2], [yBonnet, yBonnet]);                                   // only the inlet opening in the wall
  push(b, 'body bottom (seat partition)', ringY(Rc + tb, 0.6 * D, -0.75 * D - tb, -0.75 * D));
  const yS = -0.75 * D;
  push(b, 'seat ring', ringY(0.6 * D, D / 2, yS, yS + 0.1 * D), 'stem', BAR);
  const lift = D / 4, F = c.P * (Math.PI / 4) * (1.2 * D) ** 2 * 1.15, st = risingStem(F, D);
  plugDisc(b, D, yS + 0.1 * D, st.ds);
  const { fb, yTop } = bonnetJoint(b, c, 2 * Rc, yBonnet);
  const yBoxBase = yTop + 0.4 * D + lift;
  bonnetCone(b, Rc, yTop, st.boxBore / 2, yBoxBase, tb);
  push(b, 'stem nut (in bonnet)', ringY(st.ds, st.ds / 2 + 0.02, yTop + 0.1 * D, yTop + 0.1 * D + 1.5 * st.ds), 'stem', BAR);
  const yGland = stuffingBox(b, st, tb, yBoxBase);
  const op = sizeOperator(st.T, false), stemTop = yGland + 2 + 1.5 * st.ds;
  push(b, `stem ${st.ds} in`, cylY(st.ds / 2, yS + 0.4 * D, stemTop), 'stem', BAR);
  operate(b, op, op.kind === 'gear' ? yGland + 0.5 : stemTop, st.ds, D, st.boxBore + 2 * tb + 1.5);
  Object.assign(dims, { CF: rule(CF, 'SW-VLV-GA-1', 'Centre to face (both ends)'), lift: rule(lift, 'SW-VLV-GL-1', 'Disc lift'), thrust: rule(F, 'SW-VLV-GL-2', 'Stem thrust', 'lb'), stemD: rule(st.ds, 'SW-VLV-5', 'Stem diameter') });
  notes.push('Inlet on the run axis, outlet turned down (SW-VLV-GA-1); face-to-face reported as twice the centre-to-face.');
  return { c, op, extra: { lift, bonnet: fb, stem: st } };
};

const buildCheck: Build = (b, NPS, cls, dims) => {
  const D0 = pipeDims(NPS, cls).D, Rc = 0.65 * D0, c = common(NPS, cls, 1.2 * D0, 2 * Rc); const { D, tb } = c; ends(b, c);
  const yBottom = -(0.65 * D + tb), yCover = 0.75 * D;
  chamber(b, c, Rc, yBottom + tb, yCover, [-D / 2, D / 2], [-D / 2, D / 2]);
  push(b, 'body bottom', cylY(Rc + tb, yBottom, yBottom + tb));
  const zs = -0.1 * D, tDisc = 0.15 * D, pin = Math.max(0.375, 0.1 * D);
  push(b, 'seat ring', ringZ(0.6 * D, D / 2, zs - 0.05 * D, zs), 'stem', BAR);
  push(b, 'disc', cylZ(0.6 * D, zs, zs + tDisc), 'closure');
  push(b, 'hinge arm', box(-0.1 * D, 0, zs + tDisc, 0.1 * D, 0.7 * D, zs + tDisc + 0.08 * D));
  push(b, `hinge pin ${pin} in`, transformMesh(cylZ(pin / 2, -Rc - tb, Rc + tb), multiply(translate(0, 0.65 * D, zs + tDisc + 0.04 * D), toX)), 'stem', BAR);
  const { fb, yTop } = bonnetJoint(b, c, 2 * Rc, yCover, 'cover', 0);
  void yTop;
  Object.assign(dims, { discD: rule(1.2 * D, 'SW-VLV-C-1', 'Disc diameter'), discT: rule(tDisc, 'SW-VLV-C-1', 'Disc thickness'), pin: rule(pin, 'SW-VLV-C-1', 'Hinge pin diameter') });
  return { c, op: { kind: 'none', rimForce: 0, T: 0 }, extra: { cover: fb } };
};
const buildLCheck: Build = (b, NPS, cls, dims) => {
  const D0 = pipeDims(NPS, cls).D, Rc = 0.75 * D0, c = common(NPS, cls, 1.5 * D0, 2 * Rc); const { D, tb } = c; ends(b, c);
  const { yBonnet, yS } = globeBody(b, c, Rc, [-D / 2, 0], [0, D / 2]);
  push(b, 'piston disc', cylY(0.6 * D, yS, yS + 0.3 * D), 'closure');                                           // CL-1
  const { fb, yTop } = bonnetJoint(b, c, 2 * Rc, yBonnet, 'cap');
  push(b, 'dashpot guide', ringY(0.6 * D + 1 / 32 + tb, 0.6 * D + 1 / 32, yS + 0.1 * D, yTop));
  push(b, 'cap dome', revolveY([{ r: Rc, z: yTop }, { r: Rc + tb, z: yTop }, { r: 0.3 * Rc, z: yTop + 0.5 * Rc + tb }, { r: 0, z: yTop + 0.5 * Rc + tb }, { r: 0, z: yTop + 0.5 * Rc }, { r: 0.3 * Rc, z: yTop + 0.5 * Rc }]));
  Object.assign(dims, { pistonD: rule(1.2 * D, 'SW-VLV-CL-1', 'Piston diameter'), pistonL: rule(0.3 * D, 'SW-VLV-CL-1', 'Piston length') });
  return { c, op: { kind: 'none', rimForce: 0, T: 0 }, extra: { cap: fb } };
};
const buildDCheck: Build = (b, NPS, cls, dims) => {
  const D0 = pipeDims(NPS, cls).D, wb = 0.25 * D0 + 1, c = common(NPS, cls, wb, D0); c.F2F = wb;
  const { D, f } = c, bodyOD = f.BC - f.d - 0.25, rp = Math.max(0.375, 0.08 * D) / 2, tp = Math.max(3 / 16, 0.04 * D);
  push(b, 'wafer body', ringZ(bodyOD / 2, D / 2, -wb / 2, wb / 2));
  const zStop = Math.min(0.3 * D, wb / 2 - rp * 0.7 - 0.1);
  const rRet = (D / 2 + bodyOD / 2) / 2;                                                                       // post ends retained in holes in the body ring
  push(b, 'hinge post', cylY(rp, -rRet, rRet), 'stem', BAR);
  push(b, 'stop pin', cylY(rp * 0.7, -rRet, rRet, 0, zStop), 'stem', BAR);
  for (const sx of [-1, 1]) {
    const half: Polygon = dedupe([{ x: sx * (rp + 0.05), y: -0.48 * D }, ...arc(0, 0, 0.48 * D, sx > 0 ? -Math.PI / 2 : 1.5 * Math.PI, sx > 0 ? Math.PI / 2 : Math.PI / 2, 24).filter(p => sx * p.x >= rp + 0.05 - 1e-9), { x: sx * (rp + 0.05), y: 0.48 * D }]);
    push(b, 'plate', transformMesh(extrude({ outer: half }, tp), translate(0, 0, 0.02)), 'closure');
    push(b, 'torsion spring', transformMesh(helixTube(rp + 0.08, 0.1, 3, 0.04, 16, 8), multiply(translate(0, sx * 0.25 * D, 0), toY)), 'stem', 'Grade 180 spring wire');
  }
  Object.assign(dims, { bodyW: rule(wb, 'SW-VLV-CD-1', 'Body width'), bodyOD: rule(bodyOD, 'SW-VLV-CD-1', 'Body OD'), plateT: rule(tp, 'SW-VLV-CD-1', 'Plate thickness'), post: rule(2 * rp, 'SW-VLV-CD-1', 'Post diameter') });
  return { c, op: { kind: 'none', rimForce: 0, T: 0 } };
};

function ballStem(T: number) { return roundUpTo(Math.max(Math.cbrt((16 * T) / (Math.PI * 0.3 * BAR60.Fy.value * 1000)), 0.375), 1 / 16); }
function ballWithBore(Rb: number, D: number): MeshData {
  const zc = Math.sqrt(Rb * Rb - (D / 2) ** 2), loop: { r: number; z: number }[] = [];
  for (let i = 0; i <= 24; i++) { const z = -zc + (2 * zc * i) / 24; loop.push({ r: Math.sqrt(Math.max(0, Rb * Rb - z * z)), z }); }
  loop.push({ r: D / 2, z: zc }, { r: D / 2, z: -zc });
  return revolve(loop, N);
}
const buildBall: Build = (b, NPS, cls, dims) => {
  const D0 = pipeDims(NPS, cls).D, Rb = 0.75 * D0, seat = 0.1 * D0, wBody = 1.5 * D0 + 2 * seat + 0.5;
  const c = common(NPS, cls, wBody, 2 * Rb + 2 * seat); const { D, tb, P } = c; ends(b, c);
  const Rc = Rb + seat, Rs = Rc + tb, zj = wBody / 2 - 0.25;
  // spherical body wall around the ball, cut to the cavity bore at the end-cap joint and the run bore at the inlet (B-1)
  const sph: { r: number; z: number }[] = [];
  const zIn = -Math.sqrt(Math.max(0, Rs * Rs - (D / 2 + tb) ** 2)), zOut = Math.min(zj, Math.sqrt(Math.max(0, Rs * Rs - (Rc) ** 2)));
  for (let i = 0; i <= 24; i++) { const z = zIn + ((zOut - zIn) * i) / 24; sph.push({ r: Math.sqrt(Math.max(0, Rs * Rs - z * z)), z }); }
  sph.push({ r: Rc, z: zOut }, { r: Rc, z: -zOut }, { r: D / 2, z: -zOut }, { r: D / 2, z: zIn });
  push(b, 'body (spherical)', revolve(sph, N));
  if (zj > zOut) push(b, 'body neck', ringZ(Rc + tb, Rc, zOut, zj));
  const fe = designFlange(NPS, cls, 2 * Rc, tb, 2 * Rc + 2 * tb);
  push(b, 'body end flange', flangeRing(fe, zj - fe.tf, 2 * Rc));
  push(b, 'end cap gasket', ringZ((fe.gasketID + 2 * fe.wg) / 2, fe.gasketID / 2, zj, zj + fe.gasketT), 'polymer', 'compressed sheet');
  push(b, 'end cap flange', flangeRing(fe, zj + fe.gasketT, D));
  push(b, `end cap bolts ${fe.n} × ${fe.d} in`, boltRing(fe, zj - fe.tf, 2 * fe.tf + fe.gasketT), 'hardware', 'Grade 90 bolt', fe.n);
  push(b, `ball ${2 * Rb} in`, ballWithBore(Rb, D), 'closure', BAR);
  for (const s of [-1, 1]) push(b, 'seat ring', ringZ(0.6 * D + seat / 2, 0.6 * D - seat / 2, s * (Rb - 0.3 * seat) - seat / 2, s * (Rb - 0.3 * seat) + seat / 2), 'polymer', 'polymer');
  const T = P * (Math.PI / 4) * (1.2 * D) ** 2 * 0.1 * (0.75 * D) * 1.2, ds = ballStem(T), op = sizeOperator(T, true);  // B-2
  const yNeck = Rc + tb + 1.5 * ds + 0.5;
  push(b, 'stem boss', ringY(ds + 0.5, ds / 2 + 0.03, Rc - 0.5, yNeck));
  push(b, 'stem seal', ringY(ds / 2 + 0.03, ds / 2, yNeck - 0.6, yNeck - 0.2), 'polymer', 'polymer');
  push(b, `stem ${ds} in`, mergeMeshes([cylY(ds / 2, Rb - 0.4 * ds, yNeck + 1), cylY(ds, Rc - 0.4, Rc - 0.4 + 0.3 * ds)]), 'stem', BAR);
  operate(b, op, op.kind === 'gear' ? yNeck : yNeck + 0.2, ds, D);
  Object.assign(dims, { ballD: rule(2 * Rb, 'SW-VLV-B-1', 'Ball diameter'), seat: rule(seat, 'SW-VLV-B-1', 'Seat section'), torque: rule(T, 'SW-VLV-B-2', 'Operating torque (lb·in)', 'lb'), stemD: rule(ds, 'SW-VLV-B-2', 'Stem diameter') });
  return { c, op, extra: { endCap: fe, torque: T } };
};
const buildTBall: Build = (b, NPS, cls, dims) => {
  const D0 = pipeDims(NPS, cls).D, Rb = 0.75 * D0, sc = 0.15 * D0;
  const c = common(NPS, cls, 1.5 * D0 + 2 * sc + 1, 2 * Rb + 2 * sc); const { D, tb, P } = c;
  const Rc = Rb + sc, fe = designFlange(NPS, cls, 2 * Rc, tb, 2 * Rc + 2 * tb);
  const wc = Math.max(1.5 * D0 + 2 * sc + 1, 2 * (fe.tf + 0.25) + Rb);                                           // centre body long enough for both joint flanges
  c.wBody = wc; c.F2F = 2 * c.f.tf + 2 * c.hHub + wc;
  const zj = wc / 2 - fe.tf - 0.25;                                                                              // joint faces at ±zj
  { const Rs = Rc + tb, zOut = Math.min(zj, Math.sqrt(Math.max(0, Rs * Rs - Rc * Rc))), sph: { r: number; z: number }[] = [];
    for (let i = 0; i <= 32; i++) { const z = -zOut + ((2 * zOut) * i) / 32; sph.push({ r: Math.sqrt(Math.max(0, Rs * Rs - z * z)), z }); }
    sph.push({ r: Rc, z: zOut }, { r: Rc, z: -zOut });
    push(b, 'centre body (spherical)', revolve(sph, N));
    if (zj > zOut) for (const s of [-1, 1]) push(b, 'centre body neck', s > 0 ? ringZ(Rc + tb, Rc, zOut, zj) : ringZ(Rc + tb, Rc, -zj, -zOut)); }
  for (const s of [-1, 1] as const) {
    push(b, 'centre body flange', flangeRing(fe, s > 0 ? zj - fe.tf : -zj, 2 * Rc));
    push(b, 'end cap gasket', s > 0 ? ringZ((fe.gasketID + 2 * fe.wg) / 2, fe.gasketID / 2, zj, zj + fe.gasketT) : ringZ((fe.gasketID + 2 * fe.wg) / 2, fe.gasketID / 2, -zj - fe.gasketT, -zj), 'polymer', 'compressed sheet');
    push(b, 'end cap flange', flangeRing(fe, s > 0 ? zj + fe.gasketT : -zj - fe.gasketT - fe.tf, D));
    push(b, `end cap bolts ${fe.n} × ${fe.d} in`, boltRing(fe, s > 0 ? zj - fe.tf : -zj - fe.gasketT - fe.tf, 2 * fe.tf + fe.gasketT), 'hardware', 'Grade 90 bolt', fe.n);
    flangedEnd(b, c, s, c.F2F / 2, zj + fe.gasketT + fe.tf - 0.01);                                              // pipe flange + hub on each cap
  }
  push(b, `ball ${2 * Rb} in`, ballWithBore(Rb, D), 'closure', BAR);
  for (const s of [-1, 1]) {
    push(b, 'seat carrier', ringZ(0.6 * D + sc, 0.6 * D - sc / 2, s * (Rb - 0.2 * sc) - sc / 2, s * (Rb - 0.2 * sc) + sc / 2), 'stem', BAR);
    push(b, 'seat insert', ringZ(0.6 * D + sc / 4, 0.6 * D - sc / 2, s * (Rb - 0.2 * sc) - sc / 2 - 0.08, s * (Rb - 0.2 * sc) - sc / 2), 'polymer', 'polymer');
    const room = Math.max(0.3, zj - (Rb + 0.3 * sc) - 0.1), spr: MeshData[] = [];                              // springs fit between the carrier and the joint face
    for (let i = 0; i < 6; i++) { const a = (2 * Math.PI * i) / 6; spr.push(transformMesh(helixTube(Math.min(0.06 * D, sc / 2), room / 3, 3, Math.min(0.02 * D, sc / 8), 12, 6), translate((0.6 * D + sc / 4) * Math.cos(a), (0.6 * D + sc / 4) * Math.sin(a), s > 0 ? Rb + 0.3 * sc : -Rb - 0.3 * sc - room))); }
    push(b, 'seat springs 6', mergeMeshes(spr), 'stem', 'Grade 180 spring wire', 6);
  }
  const T = P * Math.PI * (1.2 * D) * (0.1 * D) * 0.1 * (0.6 * D) + P * (Math.PI / 4) * D * D * 0.05 * 0.5;        // BT-2 (stem term uses a provisional ds/2 = 0.5)
  const ds = ballStem(T), op = sizeOperator(T, true), yNeck = Rc + tb + 1.5 * ds + 0.5;
  push(b, 'stem boss', ringY(ds + 0.5, ds / 2 + 0.03, Rc - 0.5, yNeck));
  push(b, 'stem seal', ringY(ds / 2 + 0.03, ds / 2, yNeck - 0.6, yNeck - 0.2), 'polymer', 'polymer');
  push(b, `stem ${ds} in`, cylY(ds / 2, Rb - 0.4 * ds, yNeck + 1), 'stem', BAR);
  push(b, 'trunnion boss', ringY(ds + 0.5, ds / 2 + 0.03, -(Rc + tb + 1), -(Rc - 0.5)));
  push(b, 'trunnion', cylY(ds / 2, -(Rc + 0.5), -(Rb - 0.4 * ds)), 'stem', BAR);
  push(b, 'trunnion cover', cylY(ds + 1.25, -(Rc + tb + 1.5), -(Rc + tb + 1)));
  const cov: MeshData[] = []; for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + (Math.PI * i) / 2; cov.push(transformMesh(hexBolt(0.375, 0.5, 0, (ds + 0.95) * Math.cos(a), (ds + 0.95) * Math.sin(a)), multiply(translate(0, -(Rc + tb + 1.5), 0), multiply(rotateX(Math.PI / 2), translate(0, 0, 0))))); }
  push(b, 'cover bolts 4 × 3/8 in', mergeMeshes(cov), 'hardware', 'Grade 90 bolt', 4);
  operate(b, op, op.kind === 'gear' ? yNeck : yNeck + 0.2, ds, D);
  Object.assign(dims, { ballD: rule(2 * Rb, 'SW-VLV-BT-1', 'Ball diameter'), carrier: rule(sc, 'SW-VLV-BT-1', 'Seat carrier section'), torque: rule(T, 'SW-VLV-BT-2', 'Operating torque (lb·in)', 'lb'), stemD: rule(ds, 'SW-VLV-B-2', 'Stem / trunnion diameter') });
  return { c, op, extra: { endCap: fe, torque: T } };
};

function butterflyWafer(b: ValveSolid[], c: Common, bodyOD: number, wBody: number, dims: Record<string, Dim>, ruleId: string) {
  const { D, P } = c, liner = 0.125;
  push(b, 'wafer body', ringZ(bodyOD / 2, D / 2 + liner, -wBody / 2, wBody / 2));
  push(b, 'liner', ringZ(D / 2 + liner, D / 2, -wBody / 2, wBody / 2), 'polymer', 'polymer');
  const ds = Math.max(0.5, 0.12 * D), T = 0.014 * P * D ** 3;
  push(b, 'disc', revolve([{ r: 0, z: -0.075 * D }, { r: D / 2, z: -0.025 * D }, { r: D / 2, z: 0.025 * D }, { r: 0, z: 0.075 * D }], N), 'closure');
  const yNeck = bodyOD / 2 + 1.5 * ds + 1;
  push(b, 'neck boss', ringY(ds + 0.5, ds / 2 + 0.03, bodyOD / 2 - 0.5, yNeck));
  push(b, `shaft ${ds} in`, cylY(ds / 2, -bodyOD / 2 + 0.5, yNeck + 1), 'stem', BAR);
  push(b, 'shaft seal', ringY(ds / 2 + 0.03, ds / 2, yNeck - 0.6, yNeck - 0.2), 'polymer', 'polymer');
  const op = sizeOperator(T, true);
  if (op.kind === 'gear') gearOperator(b, op, yNeck, ds); else { lever(b, op, yNeck + 0.2, ds, D); push(b, 'notch plate', transformMesh(extrude({ outer: annularSector(1.5 * ds, 0.25 * D + 1, 0, Math.PI / 2, 8) }, 0.25), multiply(translate(0, yNeck, 0), toY))); }
  Object.assign(dims, { bodyOD: rule(bodyOD, ruleId, 'Body OD'), liner: rule(liner, ruleId, 'Liner thickness'), shaftD: rule(ds, ruleId, 'Shaft diameter'), torque: rule(T, 'SW-VLV-BF-1', 'Operating torque (lb·in)', 'lb') });
  return { op, T };
}
const buildBfly: Build = (b, NPS, cls, dims, notes) => {
  const D0 = pipeDims(NPS, cls).D, wBody = 0.3 * D0 + 1, c = common(NPS, cls, wBody, D0); c.F2F = wBody;
  const { f } = c, bodyOD = f.BC - f.d - 0.25;
  const { op, T } = butterflyWafer(b, c, bodyOD, wBody, dims, 'SW-VLV-BF-1');
  notes.push('Wafer body held between the pipe flanges by their studs (SW-VLV-BF-1).');
  return { c, op, extra: { torque: T } };
};
const buildLBfly: Build = (b, NPS, cls, dims, notes) => {
  const D0 = pipeDims(NPS, cls).D, wBody = 0.3 * D0 + 1, c = common(NPS, cls, wBody, D0); c.F2F = wBody;
  const { f } = c, bodyOD = f.BC - f.d - 0.25;
  const { op, T } = butterflyWafer(b, c, bodyOD, wBody, dims, 'SW-VLV-BL-1');
  const lugs: MeshData[] = [];
  for (let i = 0; i < f.n; i++) { const a = (2 * Math.PI * (i + 0.5)) / f.n; lugs.push(transformMesh(extrude(ringAroundHole(circle(0, 0, f.d, 24), { x: 0, y: 0 }, f.d / 2, 24), wBody), translate((f.BC / 2) * Math.cos(a), (f.BC / 2) * Math.sin(a), -wBody / 2))); }
  push(b, `lugs ${f.n} × tapped ${f.d} in`, mergeMeshes(lugs), 'casting', CAST, f.n);
  notes.push('Lugged body: tapped lugs take the line studs from either side (SW-VLV-BL-1).');
  return { c, op, extra: { torque: T } };
};
const buildDBfly: Build = (b, NPS, cls, dims, notes) => {
  const D0 = pipeDims(NPS, cls).D, c = common(NPS, cls, 0.5 * D0, D0);
  const { D, tb, f, P } = c; c.F2F = 0.5 * D + 2 * f.tf;                                                        // BD-1
  for (const s of [-1, 1] as const) { push(b, 'end flange', flangeRing(f, s > 0 ? c.F2F / 2 - f.tf : -c.F2F / 2, D)); push(b, 'raised face', s > 0 ? ringZ(f.rfOD / 2, D / 2, c.F2F / 2, c.F2F / 2 + f.rfH) : ringZ(f.rfOD / 2, D / 2, -c.F2F / 2 - f.rfH, -c.F2F / 2)); }
  push(b, 'body', ringZ(D / 2 + 2 * tb, D / 2, -0.25 * D, 0.25 * D));
  const ds = Math.max(0.625, 0.14 * D), T = 0.03 * P * D ** 3, zOff = 0.1 * D, xOff = 0.05 * D;
  push(b, 'metal seat ring', ringZ(D / 2, D / 2 - 0.04 * D, zOff - 0.03 * D, zOff + 0.03 * D), 'stem', BAR);
  push(b, 'disc', transformMesh(revolve([{ r: 0, z: -0.05 * D }, { r: D / 2 - 0.045 * D, z: -0.05 * D }, { r: D / 2 - 0.045 * D, z: 0.05 * D }, { r: 0, z: 0.05 * D }], N), translate(0, 0, zOff)), 'closure');
  push(b, 'disc hub', box(xOff - 0.1 * D, -0.3 * D, 0, xOff + 0.1 * D, 0.3 * D, zOff), 'closure');
  const yNeck = D / 2 + 2 * tb + 2 * ds + 1;
  push(b, 'neck boss', ringY(ds + 0.5 + tb, ds / 2 + 0.03, D / 2 + tb, yNeck, xOff));
  const st: StemDesign = { F: 0, ds, p: 0, T, packing: roundUpTo(Math.max(0.25, ds / 8), 1 / 16), boxBore: ds + 2 * roundUpTo(Math.max(0.25, ds / 8), 1 / 16) };
  const sub: ValveSolid[] = []; const yGland = stuffingBox(sub, st, tb, yNeck);
  for (const s of sub) push(b, s.name, transformMesh(s.mesh, translate(xOff, 0, 0)), s.role, s.material, s.count);
  push(b, `shaft ${ds} in`, cylY(ds / 2, -(D / 2 + tb + 0.5), yGland + 1.5, xOff), 'stem', BAR);
  push(b, 'bottom bearing cover', cylY(ds + 1, -(D / 2 + tb + 1), -(D / 2 + tb + 0.5), xOff));
  const op = D >= 8 ? sizeOperator(Math.max(T, 80 * 6 * 2), true) : sizeOperator(T, true);
  if (op.kind === 'gear') { const s2: ValveSolid[] = []; gearOperator(s2, op, yGland + 1, ds); for (const s of s2) push(b, s.name, transformMesh(s.mesh, translate(xOff, 0, 0)), s.role, s.material); }
  else { const s2: ValveSolid[] = []; lever(s2, op, yGland + 1.7, ds, D); for (const s of s2) push(b, s.name, transformMesh(s.mesh, translate(xOff, 0, 0)), s.role, s.material); }
  Object.assign(dims, { offsetZ: rule(zOff, 'SW-VLV-BD-1', 'Shaft offset behind the disc plane'), offsetX: rule(xOff, 'SW-VLV-BD-1', 'Shaft offset off the centreline'), shaftD: rule(ds, 'SW-VLV-BD-1', 'Shaft diameter'), torque: rule(T, 'SW-VLV-BD-1', 'Operating torque (lb·in)', 'lb') });
  notes.push('Double offset: the disc lifts off the metal seat as it opens (SW-VLV-BD-1).');
  return { c, op, extra: { torque: T } };
};

const buildPlug: Build = (b, NPS, cls, dims, notes) => {
  const D0 = pipeDims(NPS, cls).D, c = common(NPS, cls, 1.6 * D0, 1.6 * D0); c.wBody = 1.6 * D0 + 2 * c.tb; c.F2F = 2 * c.f.tf + 2 * c.hHub + c.wBody;
  const { D, tb, P } = c; ends(b, c);
  const tan5 = Math.tan((5 * Math.PI) / 180), yB = -0.9 * D, yT = 0.9 * D, rB = 0.55 * D, rT = rB + 1.8 * D * tan5;
  // tapered chamber wall following the plug, with the run openings as in chamber(): approximate with the mean radius ring split
  const Rc = (rB + rT) / 2 + 0.02;
  chamber(b, c, Rc, yB, yT, [-D / 2, D / 2], [-D / 2, D / 2]);
  push(b, 'body bottom', cylY(Rc + tb, yB - tb, yB));
  push(b, 'plug', revolveY([{ r: 0, z: yB }, { r: rB, z: yB }, { r: rT, z: yT }, { r: 0, z: yT }]), 'closure');                 // PL-1
  const fb = designFlange(NPS, cls, 2 * Rc, tb, 2 * Rc + 2 * tb);
  push(b, 'body top flange', transformMesh(flangeRing(fb, 0, 2 * Rc), multiply(translate(0, yT - fb.tf, 0), toY)));
  push(b, 'gland gasket', ringY((fb.gasketID + 2 * fb.wg) / 2, fb.gasketID / 2, yT, yT + fb.gasketT), 'polymer', 'compressed sheet');
  const head = 0.5 * D;
  push(b, 'gland cover', transformMesh(flangeRing(fb, 0, head * 1.1), multiply(translate(0, yT + fb.gasketT, 0), toY)));
  push(b, `cover bolts ${fb.n} × ${fb.d} in`, transformMesh(boltRing(fb, 0, 2 * fb.tf + fb.gasketT), multiply(translate(0, yT - fb.tf, 0), toY)), 'hardware', 'Grade 90 bolt', fb.n);
  const yHead = yT + fb.gasketT + fb.tf;
  push(b, 'wrench head (square)', box(-head / 2, yT - 0.1, -head / 2, head / 2, yHead + head, head / 2), 'closure');
  push(b, 'lubricant fitting', mergeMeshes([hexPrismY(0.5, yHead, yHead + 0.5, 0.4 * Rc, 0.4 * Rc), cylY(0.15, yHead + 0.5, yHead + 1.0, 0.4 * Rc, 0.4 * Rc)]), 'stem', BAR);
  const T = P * (Math.PI / 4) * D * D * 0.1 * (0.65 * D), op = sizeOperator(T, true);   // PL-1 (lubricated film)
  operate(b, op, yHead + head, head / 2, D);
  Object.assign(dims, { plugBase: rule(2 * rB, 'SW-VLV-PL-1', 'Plug diameter at the small end'), plugTop: rule(2 * rT, 'SW-VLV-PL-1', 'Plug diameter at the large end'), torque: rule(T, 'SW-VLV-PL-1', 'Operating torque (lb·in)', 'lb') });
  notes.push('Plug port not cut in this stage (shown closed); the chamber is drawn at the plug\'s mean radius (SW-VLV-PL-1).');
  return { c, op, extra: { torque: T } };
};
const buildDiaph: Build = (b, NPS, cls, dims, notes) => {
  const D0 = pipeDims(NPS, cls).D, c = common(NPS, cls, 1.6 * D0, 1.6 * D0); c.wBody = 1.6 * D0 + 2 * c.tb; c.F2F = 2 * c.f.tf + 2 * c.hHub + c.wBody;
  const { D, tb, P } = c; ends(b, c);
  const Ro = 0.8 * D, yF = 0.3 * D;                                                                              // DI-1 opening flange at yF
  chamber(b, c, Ro, -D / 2 - tb, yF, [-D / 2, D / 2], [-D / 2, D / 2]);
  push(b, 'body bottom', cylY(Ro + tb, -D / 2 - tb, -D / 2));
  push(b, 'weir', box(-Ro, -D / 2, -0.1 * D, Ro, 0.1 * D, 0.1 * D));
  const fb = designFlange(NPS, cls, 2 * Ro, tb, 2 * Ro + 2 * tb), td = Math.max(0.125, 0.03 * D);
  push(b, 'body flange', transformMesh(flangeRing(fb, 0, 2 * Ro), multiply(translate(0, yF - fb.tf, 0), toY)));
  push(b, 'diaphragm', cylY(fb.OD / 2 - 0.1, yF, yF + td), 'polymer', 'polymer');
  push(b, 'bonnet flange', transformMesh(flangeRing(fb, 0, 2 * Ro), multiply(translate(0, yF + td, 0), toY)));
  push(b, `bonnet bolts ${fb.n} × ${fb.d} in`, transformMesh(boltRing(fb, 0, 2 * fb.tf + td), multiply(translate(0, yF - fb.tf, 0), toY)), 'hardware', 'Grade 90 bolt', fb.n);
  const F = P * (Math.PI / 4) * (1.6 * D) ** 2 * 0.5, st = risingStem(F, D), yTop = yF + td + fb.tf;
  const Rd = fb.OD / 2, Hd = 0.45 * fb.OD, dome: { r: number; z: number }[] = [];                                // DI-1 rounded dome
  for (let i = 0; i <= 12; i++) { const a = (Math.PI / 2) * (i / 12); dome.push({ r: Rd * Math.cos(a), z: yTop + Hd * Math.sin(a) }); }
  for (let i = 12; i >= 0; i--) { const a = (Math.PI / 2) * (i / 12); dome.push({ r: Math.max(st.ds + tb, (Rd - tb) * Math.cos(a)), z: yTop + (Hd - tb) * Math.sin(a) }); }
  push(b, 'bonnet dome', revolveY(dome));
  push(b, 'top boss', cylY(1.5 * st.ds + 0.5, yTop + Hd - 0.5, yTop + Hd + 1));
  push(b, 'compressor', revolveY([{ r: 0, z: yF + td }, { r: 0.6 * Ro, z: yF + td }, { r: 0.3 * Ro, z: yF + td + 0.3 * Ro }, { r: 0, z: yF + td + 0.3 * Ro }]), 'closure');
  const op = sizeOperator(st.T, false);
  push(b, `spindle ${st.ds} in`, cylY(st.ds / 2, yF + td, yTop + Hd + 1.5 * st.ds + 1.5), 'stem', BAR);
  push(b, 'spindle sleeve', ringY(st.ds, st.ds / 2 + 0.02, yTop + Hd + 1, yTop + Hd + 1 + 1.5 * st.ds), 'stem', BAR);
  operate(b, op, op.kind === 'gear' ? yTop + Hd + 1 : yTop + Hd + 1.5 * st.ds + 1.5, st.ds, D, 2 * Rd);
  Object.assign(dims, { opening: rule(2 * Ro, 'SW-VLV-DI-1', 'Diaphragm opening'), diaphragmT: rule(td, 'SW-VLV-DI-1', 'Diaphragm thickness'), weirH: rule(0.6 * D, 'SW-VLV-DI-1', 'Weir height above the bore bottom'), thrust: rule(F, 'SW-VLV-DI-1', 'Spindle thrust', 'lb'), stemD: rule(st.ds, 'SW-VLV-5', 'Spindle diameter') });
  notes.push('No packing: the diaphragm is the pressure boundary (SW-VLV-DI-1).');
  return { c, op, extra: { stem: st } };
};
const buildNeedle: Build = (b, NPS, cls, dims, notes) => {
  const D0 = pipeDims(NPS, cls).D, P = CLASS_PRESSURE[cls], AF = 2 * D0 + 0.75, Lb = 3 * D0 + 2;
  const c = common(NPS, cls, Lb, D0); c.F2F = Lb;                                                                // NE-1
  const { D } = c;
  push(b, 'hex body', transformMesh(extrude(ringAroundHole(regularHexagon(AF), { x: 0, y: 0 }, D / 2, 24), Lb), translate(0, 0, -Lb / 2)));
  for (const s of [-1, 1]) push(b, 'port counterbore', ringZ(0.6 * D + 0.02, 0.6 * D, s > 0 ? Lb / 2 - 0.8 * D : -Lb / 2, s > 0 ? Lb / 2 : -Lb / 2 + 0.8 * D), 'stem', BAR);
  const F = P * (Math.PI / 4) * D * D * 1.5, ds = Math.max(0.25, 0.4 * D), st = risingStem(F, 0, 10); st.ds = ds; st.p = ds / 10;
  const rb = 0.75 * D + 0.25, yB = AF / 2;
  push(b, 'bonnet (threaded)', ringY(rb, ds / 2 + 0.03, yB - 0.2, yB + 1.2 * D + 0.75));
  push(b, 'packing nut', hexPrismY(2 * rb, yB + 1.2 * D + 0.75, yB + 1.2 * D + 1.1));
  push(b, 'packing', ringY(ds / 2 + 0.03 + 0.06, ds / 2, yB + 1.2 * D + 0.3, yB + 1.2 * D + 0.75), 'polymer', 'braided packing');
  push(b, 'needle stem', mergeMeshes([cylY(ds / 2, -0.3 * D, yB + 1.2 * D + 2.5), revolveY([{ r: 0, z: -0.3 * D - 1.5 * ds }, { r: ds / 2, z: -0.3 * D }, { r: 0, z: -0.3 * D }])]), 'stem', BAR);
  const Lt = 3 * D + 2, yh = yB + 1.2 * D + 2.5;
  push(b, 'T-bar handle', mergeMeshes([transformMesh(cylZ(0.15 * D + 0.1, -Lt / 2, Lt / 2), translate(0, yh, 0)), cylY(ds, yh - 0.5, yh + 0.3)]));
  const T = st.T, op: Operator = { kind: 'tbar', lever: Lt, rimForce: T / (Lt / 2), T };
  Object.assign(dims, { AF: rule(AF, 'SW-VLV-NE-1', 'Body across flats'), stemD: rule(ds, 'SW-VLV-NE-1', 'Stem diameter'), pitch: rule(ds / 10, 'SW-VLV-NE-1', 'Thread pitch'), tbar: rule(Lt, 'SW-VLV-NE-1', 'T-bar length'), thrust: rule(F, 'SW-VLV-NE-1', 'Stem thrust', 'lb') });
  notes.push('Threaded female ports shown as bores with a counterbore; threads not modeled (SW-VLV-NE-1).');
  return { c, op };
};
const buildPSV: Build = (b, NPS, cls, dims, notes) => {
  const D0 = pipeDims(NPS, cls).D, P = CLASS_PRESSURE[cls];
  const c = common(NPS, cls, 1.8 * D0, 1.8 * D0); const { D, tb, f } = c;
  const outNPS = SIZE_SERIES[SIZE_SERIES.indexOf(NPS) + 1], fo = designFlange(outNPS, cls), Do = pipeDims(outNPS, cls).D;
  const Rbody = 0.9 * D, CFin = f.tf + c.hHub + Rbody, CFout = fo.tf + fo.hubLen + 1 + Rbody; c.F2F = CFin + CFout;
  // inlet flange below, hub up to the body sphere
  push(b, 'inlet flange', transformMesh(flangeRing(f, 0, D), multiply(translate(0, -CFin, 0), toY)));
  push(b, 'raised face', ringY(f.rfOD / 2, D / 2, -CFin - f.rfH, -CFin));
  push(b, 'inlet neck', revolveY([{ r: D / 2, z: -CFin + f.tf }, { r: D / 2 + 2 * tb, z: -CFin + f.tf }, { r: D / 2 + tb, z: -CFin + f.tf + f.hubLen }, { r: D / 2 + tb, z: -Rbody * 0.7 }, { r: D / 2, z: -Rbody * 0.7 }]));
  // body: spherical shell
  const sph: { r: number; z: number }[] = []; for (let i = 0; i <= 20; i++) { const a = -Math.PI / 2 + (Math.PI * i) / 20; sph.push({ r: (Rbody + tb) * Math.cos(a), z: (Rbody + tb) * Math.sin(a) }); } for (let i = 20; i >= 0; i--) { const a = -Math.PI / 2 + (Math.PI * i) / 20; sph.push({ r: Rbody * Math.cos(a), z: Rbody * Math.sin(a) }); }
  push(b, 'body', revolveY(sph));
  // outlet to +z
  push(b, 'outlet neck', revolve([{ r: Do / 2, z: Rbody * 0.6 }, { r: Do / 2 + tb, z: Rbody * 0.6 }, { r: Do / 2 + tb, z: CFout - fo.tf - fo.hubLen }, { r: Do / 2 + 2 * tb, z: CFout - fo.tf }, { r: Do / 2, z: CFout - fo.tf }], N));
  push(b, 'outlet flange', flangeRing(fo, CFout - fo.tf, Do));
  push(b, 'raised face', ringZ(fo.rfOD / 2, Do / 2, CFout, CFout + fo.rfH));
  // nozzle, disc, spindle, spring (PSV-1)
  const dSeat = 0.8 * D, F = P * (Math.PI / 4) * dSeat ** 2, sp = springDesign(F), dsp = Math.max(0.375, 0.2 * D);
  push(b, 'nozzle', ringY(D / 2, dSeat / 2 - 0.05 * D, -Rbody * 0.7, -0.2 * D), 'stem', BAR);
  push(b, 'disc', cylY(dSeat / 2 + 0.05 * D, -0.2 * D, -0.2 * D + 0.15 * D), 'closure', BAR);
  push(b, 'disc holder', revolveY([{ r: 0, z: -0.05 * D }, { r: dSeat / 2 + 0.05 * D, z: -0.05 * D }, { r: dSeat / 2 + 0.05 * D, z: 0.1 * D }, { r: dsp, z: 0.25 * D }, { r: 0, z: 0.25 * D }]), 'closure');
  const Rh = sp.Dm / 2 + sp.dw / 2 + 0.125, yBody = Rbody + tb;
  const { fb, yTop } = bonnetJoint(b, c, 2 * Rh, yBody, 'spring housing');
  const yHouse = yTop + sp.length + 2 * sp.dw + 1;
  push(b, 'spring housing', ringY(Rh + tb, Rh, yTop, yHouse));
  push(b, 'spring', transformMesh(helixTube(sp.Dm / 2, sp.pitch, sp.turns, sp.dw / 2), multiply(translate(0, yTop + 0.5, 0), toY)), 'stem', 'Grade 180 spring wire');
  push(b, 'spring plates', mergeMeshes([cylY(Rh - 0.05, yTop + 0.25, yTop + 0.5), cylY(Rh - 0.05, yTop + 0.5 + sp.length, yTop + 0.75 + sp.length)]), 'stem', BAR);
  push(b, `spindle ${dsp} in`, cylY(dsp / 2, 0.25 * D, yHouse + 1.5 * dsp), 'stem', BAR);
  push(b, 'housing top', ringY(Rh + tb, dsp + 0.1, yHouse, yHouse + tb));
  push(b, 'adjusting screw', mergeMeshes([ringY(dsp + 0.1, dsp / 2 + 0.05, yHouse - 1, yHouse + tb + 1), hexPrismY(2 * dsp + 0.7, yHouse + tb, yHouse + tb + 0.5)]), 'stem', BAR);
  push(b, 'cap', revolveY([{ r: 0, z: yHouse + tb + 0.5 }, { r: dsp + 0.9, z: yHouse + tb + 0.5 }, { r: dsp + 0.9, z: yHouse + tb + 1.5 * dsp + 1.5 }, { r: 0, z: yHouse + tb + 1.5 * dsp + 1.5 }]));
  push(b, 'lifting lever', box(dsp + 0.9, yHouse + tb + 1, -0.3, dsp + 0.9 + 3 * D + 2, yHouse + tb + 1.4, 0.3));
  const op: Operator = { kind: 'none', rimForce: 0, T: 0 };
  Object.assign(dims, { outlet: rule(outNPS, 'SW-VLV-PSV-1', 'Outlet size'), seatD: rule(dSeat, 'SW-VLV-PSV-1', 'Seat diameter'), setForce: rule(F, 'SW-VLV-PSV-1', 'Spring force at set pressure', 'lb'), wire: rule(sp.dw, 'SW-VLV-PSV-1', 'Spring wire diameter'), coilD: rule(sp.Dm, 'SW-VLV-PSV-1', 'Mean coil diameter'), spindle: rule(dsp, 'SW-VLV-PSV-1', 'Spindle diameter'), CFin: rule(CFin, 'SW-VLV-PSV-1', 'Inlet centre to face'), CFout: rule(CFout, 'SW-VLV-PSV-1', 'Outlet centre to face') });
  notes.push('Set pressure = class pressure (drawing); face-to-face reported as inlet plus outlet centre-to-face (SW-VLV-PSV-1).');
  return { c, op, extra: { spring: sp, housing: fb, outlet: outNPS } };
};
const buildControl: Build = (b, NPS, cls, dims, notes) => {
  const D0 = pipeDims(NPS, cls).D, Rc = 0.75 * D0, c = common(NPS, cls, 1.5 * D0, 2 * Rc); const { D, tb, P } = c; ends(b, c);
  const { yBonnet, yS } = globeBody(b, c, Rc, [-D / 2, 0], [0, D / 2]);
  const Fa = P * (Math.PI / 4) * (1.2 * D) ** 2 + 100 * Math.PI * 1.2 * D, st = risingStem(Fa, D);               // CV-1
  push(b, 'cage', ringY(0.6 * D + 0.1 * D, 0.6 * D, yS, yBonnet - 0.1 * D), 'stem', BAR);
  push(b, 'plug', mergeMeshes([cylY(0.6 * D - 0.02, yS, yS + 0.4 * D), cylY(st.ds, yS + 0.4 * D, yS + 0.5 * D)]), 'closure', BAR);
  const { fb, yTop } = bonnetJoint(b, c, 2 * Rc, yBonnet);
  const yBoxBase = yTop + 0.3 * D;
  bonnetCone(b, Rc, yTop, st.boxBore / 2, yBoxBase, tb);
  const yGland = stuffingBox(b, st, tb, yBoxBase, 6);
  const Da = roundUpTo(Math.sqrt((4 * Fa) / (Math.PI * 30)), 2), travel = D / 4, sp = springDesign(Fa, travel);
  const spPre = springDesign(Fa, D / 4), barrelR = spPre.Dm / 2 + spPre.dw + 0.5;
  const yYoke0 = yGland + 0.5, yAct = yYoke0 + travel + 2 * D + 2 + spPre.length + 1;
  const hsPre = spPre.length + 1, hcPre = 0.12 * Da;
  for (const sx of [-1, 1]) push(b, 'yoke leg', taperedArm(sx * (barrelR + 0.6 * tb + 0.4), yYoke0, yAct - hsPre - hcPre + 0.6, 0.3 * D + 1, 0.15 * D + 0.6, Math.max(0.375, 0.8 * tb)));
  push(b, 'yoke base', box(-barrelR - 1.2 * tb - 0.9, yYoke0, -tb, barrelR + 1.2 * tb + 0.9, yYoke0 + tb, tb));
  push(b, 'travel scale', box(barrelR + 1.2 * tb + 0.8, yYoke0 + 1, -0.75, barrelR + 1.2 * tb + 0.86, yYoke0 + 1 + travel + 2, 0.75), 'stem', BAR);
  push(b, 'stem connector', mergeMeshes([box(-st.ds - 0.5, yYoke0 + 1, -st.ds - 0.5, st.ds + 0.5, yYoke0 + 1 + 2 * st.ds + 1, st.ds + 0.5)]));
  push(b, 'positioner', box(-barrelR - 1.2 * tb - 0.8 - 4, yYoke0 + 2, -2.5, -barrelR - 1.2 * tb - 0.8, yYoke0 + 8, 2.5));
  push(b, `stem ${st.ds} in`, cylY(st.ds / 2, yS + 0.4 * D, yAct + 1 + sp.length * 0.3), 'stem', BAR);
  // actuator cases: lower dish (bowl) and upper dish, bolted rim, spring inside the lower case
  const dish = (y0: number, up: 1 | -1) => { const pts: { r: number; z: number }[] = []; for (let i = 0; i <= 12; i++) { const a = (Math.PI / 2) * (i / 12); pts.push({ r: (Da / 2) * Math.cos(a), z: y0 + up * (0.3 * Da) * Math.sin(a) }); } for (let i = 12; i >= 0; i--) { const a = (Math.PI / 2) * (i / 12); pts.push({ r: (Da / 2 - 0.25) * Math.cos(a), z: y0 + up * (0.3 * Da - 0.25) * Math.sin(a) }); } return revolveY(pts); };
  const hs = sp.length + 1, hc = 0.12 * Da;                                                                     // CV-1: shallow cases, spring barrel below
  const shallow = (y0: number, up: 1 | -1) => { const pts: { r: number; z: number }[] = []; for (let i = 0; i <= 12; i++) { const a = (Math.PI / 2) * (i / 12); pts.push({ r: (Da / 2) * Math.cos(a), z: y0 + up * hc * Math.sin(a) }); } for (let i = 12; i >= 0; i--) { const a = (Math.PI / 2) * (i / 12); pts.push({ r: Math.max(barrelR, (Da / 2 - 0.2) * Math.cos(a)), z: y0 + up * (hc - 0.2) * Math.sin(a) }); } return revolveY(pts); };
  push(b, `actuator lower case ${Da} in`, shallow(yAct, -1));
  push(b, 'actuator upper case', shallow(yAct + 0.4, 1));
  push(b, 'spring barrel', ringY(barrelR, barrelR - 0.25, yAct - hs - hc + 0.5, yAct - hc + 0.3));
  push(b, 'diaphragm', cylY(Da / 2 + 0.6, yAct + 0.1, yAct + 0.3), 'polymer', 'polymer');
  const nb = Math.max(8, roundUpTo(Math.ceil((Math.PI * (Da + 0.8)) / 3), 4)), rb: MeshData[] = [];
  for (let i = 0; i < nb; i++) { const a = (2 * Math.PI * (i + 0.5)) / nb; rb.push(transformMesh(hexBolt(0.375, 0.9, 0, ((Da + 0.8) / 2) * Math.cos(a), ((Da + 0.8) / 2) * Math.sin(a)), multiply(translate(0, yAct - 0.25, 0), toY))); }
  push(b, 'case rim flanges', mergeMeshes([ringY(Da / 2 + 1.2, Da / 2 - 0.2, yAct - 0.25, yAct), ringY(Da / 2 + 1.2, Da / 2 - 0.2, yAct + 0.4, yAct + 0.65)]));
  push(b, `case bolts ${nb} × 3/8 in`, mergeMeshes(rb), 'hardware', 'Grade 90 bolt', nb);
  push(b, 'range spring', transformMesh(helixTube(sp.Dm / 2, sp.pitch, sp.turns, sp.dw / 2), multiply(translate(0, yAct - hs - hc + 1, 0), toY)), 'stem', 'Grade 180 spring wire');
  push(b, 'diaphragm plate', cylY(0.45 * Da, yAct + 0.3, yAct + 0.6), 'closure', BAR);
  const op: Operator = { kind: 'none', rimForce: 0, T: 0 };
  Object.assign(dims, { actuatorD: rule(Da, 'SW-VLV-CV-1', 'Actuator diaphragm case diameter'), actuatorF: rule(Fa, 'SW-VLV-CV-1', 'Actuator force', 'lb'), travel: rule(travel, 'SW-VLV-GL-1', 'Travel'), stemD: rule(st.ds, 'SW-VLV-5', 'Stem diameter'), wire: rule(sp.dw, 'SW-VLV-PSV-1', 'Range spring wire') });
  notes.push('Cage windows not cut in this stage (SW-VLV-CV-1); actuator on a 30 psi supply (drawing).');
  return { c, op, extra: { actuator: { Da, Fa }, stem: st, spring: sp } };
};

const BUILDERS: Record<ValveType, Build> = { GATE: buildGate, KNIFE: buildKnife, GLOBE: buildGlobe, YGLOBE: buildYGlobe, AGLOBE: buildAGlobe, CHECK: buildCheck, LCHECK: buildLCheck, DCHECK: buildDCheck, BALL: buildBall, TBALL: buildTBall, BFLY: buildBfly, LBFLY: buildLBfly, DBFLY: buildDBfly, PLUG: buildPlug, DIAPH: buildDiaph, NEEDLE: buildNeedle, PSV: buildPSV, CONTROL: buildControl };

export function makeValve(id: string, type: ValveType, NPS: number, cls: PipeClass): PartSpec {
  if (!isOffered(type, NPS, cls)) throw new Error(`${type} is not offered in ${NPS} in ${cls} (SW-VLV-11)`);
  const b: ValveSolid[] = [], notes: string[] = [];
  const dims: Record<string, Dim> = { NPS: drawing(NPS, 'Nominal size'), P: drawing(CLASS_PRESSURE[cls], 'Class design pressure', 'psi') };
  const { c, op, extra } = BUILDERS[type](b, NPS, cls, dims, notes);
  const { D, tb, f, F2F, hHub, wBody } = c;
  Object.assign(dims, {
    D: rule(D, 'SW-VLV-1', 'Bore (full port)'), tb: rule(tb, 'SW-VLV-2', 'Body wall'), F2F: rule(F2F, 'SW-VLV-9', 'Face to face'),
    tf: rule(f.tf, 'SW-FLG-5', 'End flange thickness'), hHub: rule(hHub, 'SW-FLG-6', 'Hub + neck length'), wBody: rule(wBody, 'SW-VLV-9', 'Body cavity width'),
    flangeOD: rule(f.OD, 'SW-FLG-4', 'End flange OD'), studs: rule(f.n, 'SW-FLG-4', 'End studs per flange', 'count'), studD: rule(f.d, 'SW-FLG-4', 'End stud diameter'),
    rho: rhoDim(),
  });
  if (op.kind !== 'none') {
    dims.operator = rule(op.kind === 'gear' ? op.ratio! : op.kind === 'handwheel' ? op.Dhw! : op.lever!, 'SW-VLV-4', op.kind === 'gear' ? 'Gear operator ratio' : op.kind === 'handwheel' ? 'Handwheel diameter' : op.kind === 'tbar' ? 'T-bar length' : 'Lever length', op.kind === 'gear' ? 'count' : 'in');
    dims.rimForce = rule(op.rimForce, 'SW-VLV-4', 'Operating force at the rim or lever end', 'lb');
    dims.T = rule(op.T, 'SW-VLV-5', 'Operating torque (lb·in)', 'lb');
  }
  const steelVol = b.filter(s => s.role !== 'polymer').reduce((a, s) => a + signedVolume(s.mesh), 0);
  const name = VALVE_TYPES.find(t => t.id === type)!.name;
  return {
    id, kind: 'VALVE', category: 'valve', designation: `${type}${NPS}-${cls}`, dims,
    length: rule(F2F, 'SW-VLV-9', 'Face to face'), material: CASTING,
    weight: rule(steelVol * RHO, 'SW-VLV-10', 'Steel weight from the drawn solids', 'lb'),
    notes: [`${name}, designed by SW-VLV rules from bore, pressure and the operating effort; every internal is a drawn part.`, ...notes],
    extra: { solids: b, operator: op, flange: f, type, typeName: name, ...(extra ?? {}) },
  };
}
