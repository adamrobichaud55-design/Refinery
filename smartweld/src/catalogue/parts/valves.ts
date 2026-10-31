/** Valves: DESIGN_BASIS.md sections 31–32. 18 types, each a distinct design. Local frame: flow along +z, stem up +y, x across. */
import { K } from '../../core/constants';
import { drawing, rule, constant, type Dim } from '../../core/basis';
import { roundUpTo } from '../../core/units';
import { type PartSpec, type Material } from '../part';
import { pipeDims, designFlange, CLASS_PRESSURE, SIZE_SERIES, CLASS_SERIES, type PipeClass, type FlangeDesign } from './pipe';
import { hexHardware } from './hardware';
import { revolve, extrude, transformMesh, signedVolume, mergeMeshes, helixTube, type MeshData, type Mat4 } from '../../geometry/mesh';
import { circle, rect, regularHexagon, annularSector, arc, dedupe, roundedRect, type Polygon } from '../../geometry/polygon';
const roundedRectP = (w: number, h: number, r: number) => roundedRect(w, h, r, 4);
import { multiply, translate, rotateX, rotateY, rotateZ } from '../../geometry/transform';
import { ringAroundHole } from '../../geometry/profiles';
import * as S from '../../geometry/sdf';
import { polygonize, type SDF } from '../../geometry/sdf';

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
export type ValveRole = 'casting' | 'closure' | 'stem' | 'polymer' | 'hardware' | 'operator';
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
  const Din = T <= 10000 ? 8 : T <= 50000 ? 12 : 18, ratio = Math.ceil(T / (80 * (Din / 2)));   // SW-VLV-4 gear input wheel
  return { kind: 'gear', ratio, Dhw: Din, rimForce: T / ratio / (Din / 2), T };
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
  push(b, `handwheel ${D} in`, mergeMeshes(parts), 'operator');
}
/** lever form (SW-VLV-4): tapered handle with rounded end and grip sleeve, lying along +z (open); `style` adds a latch (butterfly) or a square socket (plug, head = square size) */
function lever(b: ValveSolid[], op: Operator, y: number, ds: number, D: number, style: 'plain' | 'butterfly' | 'plug' = 'plain', head = 0) {
  const L = op.lever!, w = Math.min(2, Math.max(1, 0.12 * D + 0.6)), t = Math.max(0.25, w / 5), w0 = 1.2 * w, w1 = 0.8 * w, rh = Math.max(ds, 0.6) + 0.35;
  const outline = dedupe([{ x: -w0 / 2, y: 0 }, { x: w0 / 2, y: 0 }, { x: w1 / 2, y: L - w1 / 2 }, ...arc(0, L - w1 / 2, w1 / 2, 0, Math.PI, 12), { x: -w1 / 2, y: L - w1 / 2 }]);
  const bar = transformMesh(extrude({ outer: outline }, t), multiply(translate(0, y + t, 0), rotateX(Math.PI / 2)));       // polygon y → world z; thickness downward from y + t
  const hub = style === 'plug' ? box(-(head / 2 + 0.3), y - 0.3 * head, -(head / 2 + 0.3), head / 2 + 0.3, y + t + 0.2, head / 2 + 0.3) : cylY(rh, y - 0.4, y + t + 0.4);
  push(b, `lever ${L} in`, mergeMeshes([bar, hub]), 'operator');
  push(b, 'lever grip', transformMesh(extrude({ outer: roundedRectP(w1 + 0.3, t + 0.45, Math.min((t + 0.45) / 2, 0.3)) }, 4.3), translate(0, y + t / 2, L - 4.2)), 'polymer', 'polymer');   // sleeve hugging the bar
  if (style === 'butterfly') push(b, 'lever latch', box(-0.3 * w0, y + t, rh + 0.5, 0.3 * w0, y + t + 0.4, rh + 2.5), 'stem', BAR);
}
/** toothed notch plate for a butterfly lever: sector from −45° to 90°, ten teeth */
function notchPlate(b: ValveSolid[], y: number, r0: number, r1: number) {
  const a0 = -Math.PI / 4, a1 = Math.PI / 2, M = 20, outer: { x: number; y: number }[] = [];
  for (let i = 0; i <= M; i++) { const a = a0 + ((a1 - a0) * i) / M, r = i % 2 === 1 ? r1 - 0.3 : r1; outer.push({ x: r * Math.sin(a), y: r * Math.cos(a) }); }
  for (let i = M; i >= 0; i--) { const a = a0 + ((a1 - a0) * i) / M; outer.push({ x: r0 * Math.sin(a), y: r0 * Math.cos(a) }); }
  push(b, 'notch plate', transformMesh(extrude({ outer: dedupe(outer) }, 0.25), multiply(translate(0, y + 0.25, 0), rotateX(Math.PI / 2))), 'stem', BAR);
}
function gearOperator(b: ValveSolid[], op: Operator, y: number, ds: number, quarterTurn = false) {   // SW-VLV-4 gear form
  const Rg = Math.max(3, 2.5 * ds), Hg = Math.max(3, 1.6 * ds + 1), rr = 0.15 * Rg, yb = y + 1.5;
  push(b, 'gearbox mounting spool', ringY(0.6 * Rg, ds / 2 + 0.05, y, yb));
  const hs: { r: number; z: number }[] = [{ r: 0, z: yb }, { r: Rg, z: yb }];
  for (let i = 0; i <= 6; i++) { const a = (Math.PI / 2) * (i / 6); hs.push({ r: Rg - rr + rr * Math.cos(a), z: yb + Hg - rr + rr * Math.sin(a) }); }
  hs.push({ r: 0, z: yb + Hg });
  push(b, `gearbox housing ${op.ratio}:1`, revolveY(hs));
  const yw = yb + Hg / 2, zw = 0.7 * Rg, rw = 0.35 * Rg, xw = 0.95 * Rg;
  push(b, 'worm tube', transformMesh(cylZ(rw, -xw, xw), multiply(translate(0, yw, zw), toX)));
  for (const sx of [-1, 1]) push(b, 'worm bearing cap', transformMesh(cylZ(rw + 0.2, sx > 0 ? xw : -xw - 0.5, sx > 0 ? xw + 0.5 : -xw), multiply(translate(0, yw, zw), toX)));
  push(b, 'input shaft', transformMesh(cylZ(0.5, xw + 0.5, xw + 3), multiply(translate(0, yw, zw), toX)), 'stem', BAR);
  const Dw = op.Dhw ?? 12, rt = 0.05 * Dw, xh = xw + 3, parts: MeshData[] = [transformMesh(torusY(Dw / 2 - rt, rt, 0), multiply(translate(xh, yw, zw), rotateZ(-Math.PI / 2))), transformMesh(cylZ(1, xh - 1, xh + 1), multiply(translate(0, yw, zw), toX))];
  for (let i = 0; i < 4; i++) parts.push(transformMesh(cylZ(0.5 * rt, 0.8, Dw / 2 - rt), multiply(translate(xh, yw, zw), rotateX((2 * Math.PI * i) / 4))));
  push(b, `input handwheel ${Dw} in`, mergeMeshes(parts), 'operator');
  if (quarterTurn) {
    push(b, 'position indicator', cylY(0.4 * Rg, yb + Hg, yb + Hg + 0.6));
    push(b, 'indicator pointer', box(-0.15, yb + Hg + 0.6, -0.35 * Rg, 0.15, yb + Hg + 0.9, 0.35 * Rg), 'polymer', 'polymer');
  }
}
const operate = (b: ValveSolid[], op: Operator, y: number, ds: number, D: number, clearD = 0) => { if (op.kind === 'gear') gearOperator(b, op, y, ds); else if (op.kind === 'lever') lever(b, op, y, ds, D); else if (op.kind === 'handwheel') handwheel(b, op, y, ds, clearD); };
const operateQT = (b: ValveSolid[], op: Operator, y: number, ds: number, D: number, style: 'plain' | 'butterfly' | 'plug' = 'plain', head = 0) => { if (op.kind === 'gear') gearOperator(b, op, y, ds, true); else if (op.kind === 'lever') lever(b, op, y, ds, D, style, head); };

// =====================================================================================================
// Castings (SW-VLV-F-*). Smooth blended solids meshed by the SmartWeld polygoniser.
// =====================================================================================================
type V3 = [number, number, number];
/** mesh a cast part: cell ≤ half the wall where the cap allows (F-0) */
const castPart = (b: ValveSolid[], name: string, f: SDF, min: V3, max: V3, wall: number, role: ValveRole = 'casting', material = CAST) => push(b, name, polygonize(f, min, max, wall / 2), role, material);
const blendK = (c: Common) => Math.max(c.tb, 0.06 * c.D);                                     // F-0 blend radius

interface Common { NPS: number; cls: PipeClass; P: number; D: number; tb: number; f: FlangeDesign; F2F: number; hHub: number; wBody: number }
function common(NPS: number, cls: PipeClass, wBody: number, Dc: number): Common {
  const pd = pipeDims(NPS, cls), P = CLASS_PRESSURE[cls], f = designFlange(NPS, cls);
  const Sc = (CASTING.Fy.value * 1000) / 2.5;
  const tb = roundUpTo(Math.max(0.25 + pd.D / 50, (P * Dc) / (2 * Sc) + 0.125), 1 / 16);                     // SW-VLV-2
  const hHub = f.hubLen + f.neckLen, F2F = 2 * f.tf + 2 * hHub + wBody;                                       // SW-VLV-9
  return { NPS, cls, P, D: pd.D, tb, f, F2F, hHub, wBody };
}
/** machined end flanges with raised faces at ±zFace (bolt holes exact) */
function endFlanges(b: ValveSolid[], c: Common, zFace = c.F2F / 2, f = c.f, D = c.D) {
  for (const s of [-1, 1]) {
    push(b, 'end flange', flangeRing(f, s > 0 ? zFace - f.tf : -zFace, D));
    push(b, 'raised face', s > 0 ? ringZ(f.rfOD / 2, D / 2, zFace, zFace + f.rfH) : ringZ(f.rfOD / 2, D / 2, -zFace - f.rfH, -zFace));
  }
}
/** run tube and tapered hubs ending at the flange backs ±zi (SW-FLG-6) */
const runSDF = (c: Common, zi: number, zLo = -zi, zHi = zi): SDF => {
  const { D, tb, f } = c, parts: SDF[] = [S.cylZ(D / 2 + tb, zLo, zHi)];
  if (zHi === zi) parts.push(S.frustumZ(D / 2 + tb, zi - f.hubLen, D / 2 + 2 * tb, zi));
  if (zLo === -zi) parts.push(S.frustumZ(D / 2 + 2 * tb, -zi, D / 2 + tb, -zi + f.hubLen));
  return S.union(...parts);
};
const boreSDF = (c: Common, zi: number) => S.cylZ(c.D / 2, -zi - 1, zi + 1);

/** bolts of a cast joint along y (F-1): nut and stick-out below yBot, head above yTop; shank inside the flanges not drawn */
function jointBolts(b: ValveSolid[], pts: [number, number][], d: number, yBot: number, yTop: number, name: string) {
  const h = hexHardware(d), parts: MeshData[] = [];
  for (const [x, z] of pts) parts.push(hexPrismY(h.F, yBot - h.nutH, yBot, x, z), cylY(d / 2, yBot - h.nutH - d / 4, yBot - h.nutH, x, z), hexPrismY(h.F, yTop, yTop + h.H, x, z));
  push(b, `${name} ${pts.length} × ${d} in (shank inside the flanges not drawn)`, mergeMeshes(parts), 'hardware', 'Grade 90 bolt', pts.length);
}
const circlePts = (r: number, n: number): [number, number][] => Array.from({ length: n }, (_, i) => { const a = (2 * Math.PI * (i + 0.5)) / n; return [r * Math.cos(a), r * Math.sin(a)] as [number, number]; });
const ellipsePts = (a: number, bz: number, n: number): [number, number][] => Array.from({ length: n }, (_, i) => { const t = (2 * Math.PI * (i + 0.5)) / n; return [a * Math.cos(t), bz * Math.sin(t)] as [number, number]; });
/** n points evenly spaced along the perimeter of a square of half-side h */
const squarePts = (h: number, n: number): [number, number][] => Array.from({ length: n }, (_, i) => {
  const u = ((i + 0.5) / n) * 8 * h, side = Math.floor(u / (2 * h)), t = u - side * 2 * h - h;
  return ([[t, -h], [h, t], [-t, h], [-h, -t]] as [number, number][])[side];
});
/** gasket of an outline (round or oval) between two cast flanges */
const ovalGasket = (b: ValveSolid[], ao: number, bo: number, ai: number, bi: number, y: number, t: number) => {
  const outer = Array.from({ length: 48 }, (_, i) => { const a = (2 * Math.PI * i) / 48; return { x: ao * Math.cos(a), y: bo * Math.sin(a) }; });
  const inner = Array.from({ length: 48 }, (_, i) => { const a = (2 * Math.PI * i) / 48; return { x: ai * Math.cos(a), y: bi * Math.sin(a) }; });
  push(b, 'bonnet gasket', transformMesh(extrude({ outer, inner }, t), multiply(translate(0, y, 0), multiply(toY, rotateX(0)))), 'polymer', 'compressed sheet');
};

/** flat arm in the x–y plane (thickness 2tz along z) between two points with end half-widths ra, rb (cast yoke leg) */
const armXY = (a: [number, number], bb: [number, number], ra: number, rbb: number, tz: number): SDF => {
  const e = 0.35 * Math.min(ra, rbb, tz), tc = S.taperCapsule([a[0], a[1], 0], [bb[0], bb[1], 0], ra - e, rbb - e);
  return (x, y, z) => { const d2 = tc(x, y, 0), dz = Math.abs(z) - (tz - e); return Math.min(Math.max(d2, dz), 0) + Math.hypot(Math.max(d2, 0), Math.max(dz, 0)) - e; };   // rounded edges
};
const edgeR = (t: number) => Math.min(0.3, 0.3 * t);   // F-0 edge radius of cast flanges

interface BonnetSpec {
  ai: number; bi: number;                // inner chamber semi-axes at the joint (x across, z along flow)
  aF: number; bF: number;                // flange semi-axes
  y0: number; tfb: number; hb: number;   // joint face (top of gasket), flange thickness, body height above the flange
  st: StemDesign; tb: number;
  yoke?: { yTop: number; headH: number; bossR: number; ta: number };   // yoke head (stem nut boss or actuator mount)
}
/** cast bonnet with optional integral yoke (F-2, F-3); returns the stuffing box levels and the gland bolt x */
function bonnetYoke(b: ValveSolid[], sp: BonnetSpec, name = 'bonnet') {
  const { ai, bi, aF, bF, y0, tfb, hb, st, tb } = sp, s = st.packing, rs = st.boxBore / 2 + tb + 0.1;
  const y1 = y0 + tfb + hb, yBoxTop = y1 + 5 * s, dg = Math.max(0.375, s), xg = rs + dg + 0.3;
  const k = Math.max(tb, 0.25);
  const parts: SDF[] = [
    S.superFrustumY(ai + tb, bi + tb, y0 + tfb * 0.5, rs, rs, y1, 2),
    S.cylY(rs, y1 - 0.5, yBoxTop),
    S.cylY(dg + 0.25, yBoxTop - Math.max(1, 2 * dg), yBoxTop, xg, 0), S.cylY(dg + 0.25, yBoxTop - Math.max(1, 2 * dg), yBoxTop, -xg, 0),
  ];
  let yMax = yBoxTop, xMax = Math.max(aF, xg + dg + 0.3);
  if (sp.yoke) {
    const { yTop, headH, bossR, ta } = sp.yoke, xa0 = Math.max(rs + ta + 1, 0.75 * ai), yA0 = y0 + tfb + 0.35 * hb, yA1 = yTop + headH / 2;
    for (const sx of [-1, 1]) parts.push(armXY([sx * xa0, yA0], [sx * (bossR + ta * 0.5), yA1], ta * 0.9, ta * 0.6, ta * 0.8));
    parts.push(S.rcylY(bossR + ta * 0.8, yTop, yTop + headH, 0.25 * ta));
    yMax = yTop + headH; xMax = Math.max(xMax, xa0 + ta);
  }
  let outer: SDF = S.union(S.rsuperCylY(aF, bF, y0, y0 + tfb, edgeR(tfb), 2), S.blend(k, ...parts));
  const inner: SDF[] = [S.superFrustumY(ai, bi, y0 - 1, st.boxBore / 2 + 0.05, st.boxBore / 2 + 0.05, y1, 2), S.cylY(st.boxBore / 2, y1 - 1, yBoxTop + 1)];
  if (sp.yoke) inner.push(S.cylY(sp.yoke.bossR, sp.yoke.yTop - 1, sp.yoke.yTop + sp.yoke.headH + 1));
  outer = S.subtract(outer, ...inner);
  const zMax = Math.max(bF, rs, sp.yoke ? sp.yoke.ta : 0) + 0.5;
  castPart(b, sp.yoke ? `${name} with integral yoke` : name, outer, [-xMax - 0.5, y0 - 0.25, -zMax], [xMax + 0.5, yMax + 0.25, zMax], tb);
  return { y1, yBoxTop, xg, dg, rs };
}
/** packing rings in the box from y1, gland follower and a stadium gland flange with two swing bolts (SW-VLV-6, F-2) */
function packingGland(b: ValveSolid[], st: StemDesign, y1: number, yBoxTop: number, xg: number, dg: number, rings = 4) {
  const s = st.packing;
  for (let i = 0; i < rings; i++) push(b, 'packing ring', ringY(st.boxBore / 2, st.ds / 2, y1 + i * s, y1 + (i + 1) * s), 'polymer', 'braided packing');
  const yF = Math.max(yBoxTop, y1 + rings * s + 0.5) + 0.1, tg = Math.max(0.375, s);
  push(b, 'gland follower', ringY(st.boxBore / 2 - 0.02, st.ds / 2 + 0.02, y1 + rings * s, yF), 'stem', BAR);
  const rG = dg + 0.35, stad = dedupe([...arc(xg, 0, rG, -Math.PI / 2, Math.PI / 2, 10), ...arc(-xg, 0, rG, Math.PI / 2, 1.5 * Math.PI, 10)]);
  push(b, 'gland flange', transformMesh(extrude(ringAroundHole(stad, { x: 0, y: 0 }, st.ds / 2 + 0.03, 32), tg), multiply(translate(0, yF, 0), multiply(toY, rotateX(0)))));
  const h = hexHardware(dg), parts: MeshData[] = [];
  for (const sx of [-1, 1]) parts.push(cylY(dg / 2, yBoxTop - 1.5 * dg, yF + tg + h.nutH + dg / 4, sx * xg, 0), hexPrismY(h.F, yF + tg, yF + tg + h.nutH, sx * xg, 0));
  push(b, `gland bolts 2 × ${dg} in`, mergeMeshes(parts), 'hardware', STUDM, 2);
  return yF + tg;
}

// ---- globe-family body (F-3): bulb, S-partition, round neck and body flange --------------------------------
interface GlobeBody { Rs: number; Rn: number; fb: FlangeDesign; yB: number; yS: number }
function globeBodySDF(c: Common, zi: number, tilt = 0): { body: SDF; info: GlobeBody } {
  const { D, tb } = c, Rs = 0.85 * D + tb, Rn = 0.62 * D, fb = designFlange(c.NPS, c.cls, 2 * Rn, tb, 2 * Rn + 2 * tb);
  const yB = 0.75 * D + 0.5 * tb + fb.tf;                                   // top of the body flange (joint face)
  const k = blendK(c);
  const neckOuter = S.union(S.cylY(Rn + tb, 0, yB - fb.tf), S.cylY(fb.OD / 2, yB - fb.tf, yB));
  const neckInner = S.cylY(Rn, 0, yB + 1);
  const tiltF = (f: SDF) => (tilt ? S.rotX(f, tilt) : f);
  const outer = S.union(S.blend(k, runSDF(c, zi), S.ellipsoid(0, 0, 0, Rs, 0.9 * Rs, Rs), tiltF(S.cylY(Rn + tb, 0, yB - fb.tf))), tiltF(S.rcylY(fb.OD / 2, yB - fb.tf, yB, edgeR(fb.tf))));
  void neckOuter;
  let cavity: SDF = S.union(S.ellipsoid(0, 0, 0, Rs - tb, 0.9 * Rs - tb, Rs - tb), boreSDF(c, zi), tiltF(neckInner));
  // partition: seat plate perpendicular to the stem axis with the seat opening; for T-pattern also the two walls of the S-path
  const plate = S.subtract(S.cylY(Rs, -tb / 2, tb / 2), S.cylY(0.6 * D, -1, 1));
  const parts: SDF[] = [tiltF(plate)];
  if (!tilt) {
    const plateT = S.subtract(S.roundBox(0, 0, 0, Rs, tb / 2, 0.6 * D + tb, 0), S.cylY(0.6 * D, -1, 1));
    parts.length = 0; parts.push(plateT, S.roundBox(0, Rs / 2, -(0.6 * D + tb / 2), Rs, Rs / 2, tb / 2, 0), S.roundBox(0, -Rs / 2, 0.6 * D + tb / 2, Rs, Rs / 2, tb / 2, 0));
  }
  cavity = S.subtract(cavity, ...parts);
  return { body: S.subtract(outer, cavity), info: { Rs, Rn, fb, yB, yS: tb / 2 } };
}

// =====================================================================================================
// Type builders
// =====================================================================================================
type Build = (b: ValveSolid[], NPS: number, cls: PipeClass, dims: Record<string, Dim>, notes: string[]) => { c: Common; op: Operator; extra?: Record<string, unknown> };
const yokeTa = (c: Common) => Math.max(0.5, 0.15 * c.D, c.tb);

// ---- kept: fabricated or machined designs (knife gate, dual-plate check, forged trunnion ball, needle) ----
const buildKnife: Build = (b, NPS, cls, dims) => {
  const D0 = pipeDims(NPS, cls).D, P = CLASS_PRESSURE[cls];
  const w = Math.max(1.5, 0.12 * D0 + 1);
  const c = common(NPS, cls, w, D0); c.F2F = w;                                                                 // K-1 wafer
  const { D, tb, f } = c, hw = 0.65 * D, tg = Math.max(0.25, 0.03 * D), stroke = 1.05 * D, k = blendK(c);
  const F = P * (Math.PI / 4) * D * D * 0.3 * 1.2, st = risingStem(F, D), s = st.packing;                      // K-2
  // K-1 body casting: lugged ring rising into the gate chest, packing box and top flange
  const xc = hw + tb, yH = D / 2 + 0.15 * D, yBox = yH + 4 * s, tF = Math.max(0.5, tb + 0.125), yFl = yBox + tF;
  const dg = Math.max(0.375, s), hg = hexHardware(dg), bl = Math.max(1, 0.15 * D), hb = hexHardware(Math.max(0.375, roundUpTo(0.12 * bl + 0.25, 1 / 8)));
  const xs = xc + dg / 2 + 0.15, xg = xs + hg.F / 2 + 0.2, xl0 = xg + 0.25, xl1 = xl0 + bl, xF = xl1 + hb.F + 0.4;
  const zP = tg / 2 + 0.06, zPk = zP + s;                                                                        // gate slot and packing recess half-widths
  const er = Math.min(0.25, 0.2 * w);
  const ring = S.rcylZ(f.OD / 2, -w / 2, w / 2, er), chest = S.roundBox(0, yBox / 2, 0, xc, yBox / 2, w / 2, er), topF = S.roundBox(0, yBox + tF / 2, 0, xF, tF / 2, w / 2, Math.min(0.2, tF / 3));
  const holes = Array.from({ length: f.n }, (_, i) => { const a = (2 * Math.PI * (i + 0.5)) / f.n; return S.cylZ(f.holeD / 2, -w, w, (f.BC / 2) * Math.cos(a), (f.BC / 2) * Math.sin(a)); });
  const cav = [S.cylZ(D / 2, -w, w), S.roundBox(0, (yFl + 1 - 0.56 * D) / 2, 0, hw + 0.06, (yFl + 1 + 0.56 * D) / 2, zP, 0), S.roundBox(0, (yH + yFl + 1) / 2, 0, hw + 0.06, (yFl + 1 - yH) / 2, zPk, 0), ...holes];
  const xMax = Math.max(f.OD / 2, xF) + 0.5;
  castPart(b, 'body', S.subtract(S.union(S.blend(k, ring, chest), topF), ...cav), [-xMax, -f.OD / 2 - 0.5, -w / 2 - 0.5], [xMax, yFl + 0.5, w / 2 + 0.5], tb);
  for (let i = 0; i < 4; i++) for (const sz of [-1, 1]) push(b, 'packing strip', box(-hw, yH + i * s, sz * zP, hw, yH + (i + 1) * s, sz * zPk), 'polymer', 'braided packing');
  // gland: two plates either side of the gate, drawn down by two short studs into the top flange
  const tgp = Math.max(0.375, 0.75 * s);
  for (const sz of [-1, 1]) push(b, 'gland plate', box(-xg, yFl, sz * zP, xg, yFl + tgp, sz * (w / 2)));
  { const gl: MeshData[] = []; for (const sx of [-1, 1]) gl.push(cylY(dg / 2, yFl - 1.5 * dg, yFl + tgp + hg.nutH + dg / 4, sx * xs, 0), hexPrismY(hg.F, yFl + tgp, yFl + tgp + hg.nutH, sx * xs, 0));
    push(b, `gland studs 2 × ${dg} in`, mergeMeshes(gl), 'hardware', STUDM, 2); }
  { const rGate = 0.52 * D, yTopG = yFl + tgp + 1, a0 = Math.asin(Math.min(1, hw / rGate));                    // K-1: rounded bottom edge concentric with the bore
    const outline = dedupe([{ x: -hw, y: yTopG }, { x: -hw, y: Math.max(-rGate * Math.cos(a0), -rGate) }, ...arc(0, 0, rGate, -Math.PI / 2 - a0, -Math.PI / 2 + a0, 24), { x: hw, y: yTopG }]);
    push(b, 'gate plate', transformMesh(extrude({ outer: outline }, tg), translate(0, 0, -tg / 2)), 'closure'); }
  // yoke: two straight parallel legs with bolted feet, a yoke plate and the stem-nut boss
  const yNut = yFl + tgp + 1 + stroke + 1.5, nutH = 1.5 * st.ds, bossR = 1.5 * st.ds + 0.25, ta = Math.max(0.5, tb);
  const tFoot = 0.375, legs: MeshData[] = [], feet: MeshData[] = [], bolts: MeshData[] = [];
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? xl0 : -xl1, x1 = sx > 0 ? xl1 : -xl0;
    legs.push(box(x0, yFl + tFoot, -w / 2 + 0.1, x1, yNut, w / 2 - 0.1));
    feet.push(box(sx > 0 ? xl0 : -xF + 0.1, yFl, -w / 2, sx > 0 ? xF - 0.1 : -xl0, yFl + tFoot, w / 2));
    for (const sz of [-1, 1]) bolts.push(hexPrismY(hb.F, yFl + tFoot, yFl + tFoot + hb.H, sx * (xl1 + hb.F / 2 + 0.15), sz * w / 4));
  }
  push(b, `yoke legs 2 × bar ${bl.toFixed(2)} in`, mergeMeshes(legs));
  push(b, 'leg feet', mergeMeshes(feet));
  push(b, 'leg bolts 4', mergeMeshes(bolts), 'hardware', 'Grade 90 bolt', 4);
  push(b, 'yoke plate', box(-xl1, yNut, -w / 2 + 0.1, xl1, yNut + Math.max(nutH, 2 * ta), w / 2 - 0.1));
  push(b, 'yoke boss', cylY(bossR + ta, yNut - 0.25, yNut + Math.max(nutH, 2 * ta) + 0.25));
  push(b, 'stem nut', ringY(bossR, st.ds / 2 + 0.02, yNut - 0.5, yNut + Math.max(nutH, 2 * ta) + 0.5), 'stem', BAR);
  const yTop = yNut + Math.max(nutH, 2 * ta), op = sizeOperator(st.T, false);
  push(b, `stem ${st.ds} in`, cylY(st.ds / 2, yFl + tgp + 0.5, yTop + 2 + 1.5 * st.ds), 'stem', BAR);
  operate(b, op, op.kind === 'gear' ? yTop + 0.5 : yTop + 1 + 0.12 * (op.Dhw ?? 0), st.ds, D, 2 * bossR + 2 * ta);
  Object.assign(dims, { bodyW: rule(w, 'SW-VLV-K-1', 'Body width'), gateT: rule(tg, 'SW-VLV-K-1', 'Gate plate thickness'), stroke: rule(stroke, 'SW-VLV-K-1', 'Stroke'), legBar: rule(bl, 'SW-VLV-K-1', 'Yoke leg bar width'), thrust: rule(F, 'SW-VLV-K-2', 'Stem thrust', 'lb'), stemD: rule(st.ds, 'SW-VLV-5', 'Stem diameter') });
  return { c, op };
};

const buildDCheck: Build = (b, NPS, cls, dims) => {
  const D0 = pipeDims(NPS, cls).D, wb = 0.25 * D0 + 1, c = common(NPS, cls, wb, D0); c.F2F = wb;
  const { D, f } = c, bodyOD = f.BC - f.d - 0.25, rp = Math.max(0.375, 0.08 * D) / 2, tp = Math.max(3 / 16, 0.04 * D);
  castPart(b, 'wafer body', S.subtract(S.blend(0.3, S.rcylZ(bodyOD / 2, -wb / 2, wb / 2, Math.min(0.3, wb * 0.15)), S.rcylY(0.45 + 0.03 * D, bodyOD / 2 - 0.5, bodyOD / 2 + 0.5, 0.15)), S.cylZ(D / 2, -wb, wb), S.cylY(0.22 + 0.01 * D, bodyOD / 2 - 0.4, bodyOD / 2 + 1)),
    [-bodyOD / 2 - 0.3, -bodyOD / 2 - 0.3, -wb / 2 - 0.1], [bodyOD / 2 + 0.3, bodyOD / 2 + 0.7, wb / 2 + 0.1], Math.min(c.tb, wb / 4));                 // F-5: ring with lifting-eye boss
  { const re = 0.5 + 0.03 * D, rw = 0.12 + 0.008 * D, yE = bodyOD / 2 + 0.5 + re;                                   // lifting eyebolt
    push(b, 'lifting eyebolt', mergeMeshes([transformMesh(torusY(re, rw, 0), multiply(translate(0, yE, 0), rotateX(Math.PI / 2))), cylY(0.2 + 0.01 * D, bodyOD / 2 - 0.4, yE - re + rw)]), 'hardware', STUDM); }
  for (const sy of [-1, 1]) push(b, 'retainer plug', hexPrismY(0.6 + 0.04 * D, sy > 0 ? bodyOD / 2 - 0.01 : -bodyOD / 2 - 0.35, sy > 0 ? bodyOD / 2 + 0.35 : -bodyOD / 2 + 0.01, 0, Math.min(0.3 * D, wb / 2 - rp * 0.7 - 0.1)), 'hardware', STUDM);   // retain the stop pin; the post is retained under the eye boss
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

const mirrorZ = (m: MeshData): MeshData => { const p = m.positions.slice(); for (let i = 2; i < p.length; i += 3) p[i] = -p[i]; const idx = m.indices.slice(); for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; } return { positions: p, indices: idx }; };
/** ball-valve body of BT-1: thick cylinder along z, bore 2Rc, OD Db, from −zj to zj, chamfered outer edges */
function forgedBody(Rc: number, Db: number, zj: number, rr = 0.1 * (Db / 2 - Rc)): MeshData {
  const R = Db / 2, loop: { r: number; z: number }[] = [{ r: Rc, z: -zj }];
  for (let i = 0; i <= 8; i++) { const a = (Math.PI / 2) * (i / 8); loop.push({ r: R - rr + rr * Math.sin(a), z: -zj + rr - rr * Math.cos(a) }); }
  for (let i = 0; i <= 8; i++) { const a = (Math.PI / 2) * (i / 8); loop.push({ r: R - rr + rr * Math.cos(a), z: zj - rr + rr * Math.sin(a) }); }
  loop.push({ r: Rc, z: zj });
  return revolve(dedupeRZ(loop), N);
}
const dedupeRZ = (p: { r: number; z: number }[]) => p.filter((q, i) => i === 0 || Math.hypot(q.r - p[i - 1].r, q.z - p[i - 1].z) > 1e-6);
/** one end of a ball valve on +z (BT-1 / B-1): bolted adapter (gasket, studs tapped into the body, adapter flange) or integral collar, then a curved taper, neck and pipe flange. */
function ballEnd(c: Common, fe: FlangeDesign, zj: number, Db: number, bolted: boolean, taperK = 0.45, neckMin = 0): { solids: ValveSolid[]; zFace: number } {
  const { D, tb, f } = c, out: ValveSolid[] = [], h = hexHardware(fe.d);
  const z1 = zj + fe.gasketT + fe.tf;
  if (bolted) {
    out.push({ name: 'adapter gasket', mesh: ringZ((fe.gasketID + 2 * fe.wg) / 2, fe.gasketID / 2, zj, zj + fe.gasketT), role: 'polymer', material: 'compressed sheet' });
    out.push({ name: 'end adapter flange', mesh: flangeRing({ ...fe, OD: Db }, zj + fe.gasketT, D), role: 'casting', material: CAST });
    const nutProf = ringAroundHole(regularHexagon(h.F), { x: 0, y: 0 }, fe.d / 2, 24), st: MeshData[] = [];
    for (let i = 0; i < fe.n; i++) {
      const a = (2 * Math.PI * (i + 0.5)) / fe.n, x = (fe.BC / 2) * Math.cos(a), y = (fe.BC / 2) * Math.sin(a);
      st.push(cylZ(fe.d / 2, zj, z1 + h.nutH + fe.d / 4, x, y), transformMesh(extrude(nutProf, h.nutH), translate(x, y, z1)));
    }
    out.push({ name: `adapter studs ${fe.n} × ${fe.d} in (1.5 d tapped into the body, engaged length not drawn)`, mesh: mergeMeshes(st), role: 'hardware', material: STUDM, count: fe.n });
  } else out.push({ name: 'integral end collar', mesh: ringZ(Db / 2 - 0.1 * (Db / 2 - fe.gasketID / 2), D / 2, zj, z1), role: 'casting', material: CAST });
  const rN = D / 2 + 2 * tb, Rt0 = Math.max(rN + 0.25, bolted ? fe.BC / 2 - h.F / 2 - 0.25 : Db / 2 - 0.1 * (Db / 2 - fe.gasketID / 2));
  const Lt = Math.max(1, taperK * (Rt0 - rN)), loop: { r: number; z: number }[] = [{ r: D / 2, z: z1 }];
  for (let i = 0; i <= 8; i++) { const a = (Math.PI / 2) * (i / 8); loop.push({ r: rN + (Rt0 - rN) * Math.cos(a), z: z1 + Lt * Math.sin(a) }); }
  loop.push({ r: D / 2, z: z1 + Lt });
  out.push({ name: bolted ? 'end adapter taper' : 'body end taper', mesh: revolve(loop, N), role: 'casting', material: CAST });
  const z2 = z1 + Lt, zFace = z2 + Math.max(1 + 0.5 * f.hubLen, neckMin) + f.tf;
  out.push({ name: bolted ? 'end adapter neck' : 'body end neck', mesh: ringZ(rN, D / 2, z2, zFace - f.tf), role: 'casting', material: CAST });
  out.push({ name: 'end flange', mesh: flangeRing(f, zFace - f.tf, D), role: 'casting', material: CAST });
  out.push({ name: 'raised face', mesh: ringZ(f.rfOD / 2, D / 2, zFace, zFace + f.rfH), role: 'casting', material: CAST });
  return { solids: out, zFace };
}
const pushEnd = (b: ValveSolid[], e: { solids: ValveSolid[] }, side: 1 | -1) => { for (const x of e.solids) b.push({ ...x, mesh: side > 0 ? x.mesh : mirrorZ(x.mesh) }); };
/** stem pad on top and trunnion/bottom pad on a cylindrical body of radius Rb2 (BT-1) */
function bodyPad(Rb2: number, rp: number, up: 1 | -1, proud: number): MeshData {
  const y0 = Math.sqrt(Math.max(0, Rb2 * Rb2 - rp * rp)) - 0.2;
  return up > 0 ? cylY(rp, y0, Rb2 + proud) : cylY(rp, -(Rb2 + proud), -y0);
}
function ballStem(T: number) { return roundUpTo(Math.max(Math.cbrt((16 * T) / (Math.PI * 0.3 * BAR60.Fy.value * 1000)), 0.375), 1 / 16); }
function ballWithBore(Rb: number, D: number): MeshData {
  const zc = Math.sqrt(Rb * Rb - (D / 2) ** 2), loop: { r: number; z: number }[] = [];
  for (let i = 0; i <= 24; i++) { const z = -zc + (2 * zc * i) / 24; loop.push({ r: Math.sqrt(Math.max(0, Rb * Rb - z * z)), z }); }
  loop.push({ r: D / 2, z: zc }, { r: D / 2, z: -zc });
  return revolve(loop, N);
}
const buildTBall: Build = (b, NPS, cls, dims) => {
  const D0 = pipeDims(NPS, cls).D, Rb = 0.75 * D0, sc = 0.15 * D0;
  const c = common(NPS, cls, 1.5 * D0 + 2 * sc + 1, 2 * Rb + 2 * sc); const { D, tb, P } = c;
  const Rc = Rb + sc, fe = designFlange(NPS, cls, 2 * Rc, tb, 2 * Rc + 2 * tb), Db = fe.BC + 3.5 * fe.d, zj = Rc + 0.5;   // BT-1
  push(b, 'centre body (forged)', forgedBody(Rc, Db, zj, 1.5 * fe.d));
  const end = ballEnd(c, fe, zj, Db, true, 1.0, 0.25 * D);
  pushEnd(b, end, 1); pushEnd(b, end, -1);
  c.wBody = 2 * zj; c.F2F = 2 * end.zFace;
  push(b, `ball ${2 * Rb} in`, ballWithBore(Rb, D), 'closure', BAR);
  for (const s of [-1, 1]) {
    push(b, 'seat carrier', ringZ(0.6 * D + sc, 0.6 * D - sc / 2, s * (Rb - 0.2 * sc) - sc / 2, s * (Rb - 0.2 * sc) + sc / 2), 'stem', BAR);
    push(b, 'seat insert', ringZ(0.6 * D + sc / 4, 0.6 * D - sc / 2, s * (Rb - 0.2 * sc) - sc / 2 - 0.08, s * (Rb - 0.2 * sc) - sc / 2), 'polymer', 'polymer');
    const room = Math.max(0.3, zj - (Rb + 0.3 * sc) - 0.1), spr: MeshData[] = [];                              // springs between the carrier and the adapter face
    for (let i = 0; i < 6; i++) { const a = (2 * Math.PI * i) / 6; spr.push(transformMesh(helixTube(Math.min(0.06 * D, sc / 2), room / 3, 3, Math.min(0.02 * D, sc / 8), 12, 6), translate((0.6 * D + sc / 4) * Math.cos(a), (0.6 * D + sc / 4) * Math.sin(a), s > 0 ? Rb + 0.3 * sc : -Rb - 0.3 * sc - room))); }
    push(b, 'seat springs 6', mergeMeshes(spr), 'stem', 'Grade 180 spring wire', 6);
  }
  const T = P * Math.PI * (1.2 * D) * (0.1 * D) * 0.1 * (0.6 * D) + P * (Math.PI / 4) * D * D * 0.05 * 0.5;        // BT-2 (stem term uses a provisional ds/2 = 0.5)
  const ds = ballStem(T), op = sizeOperator(T, true);
  // BT-1: stem housing — a raised boss closed by a bolted cover, then a mounting spool to the operator; the same boss
  // and cover close the trunnion underneath
  const rp = Math.max(ds + 3, 0.4 * D) / 2 + ds / 2, yBoss = Db / 2 + 1, tc = Math.max(0.75, 0.5 * ds), dB = Math.max(0.375, roundUpTo(0.12 * rp, 1 / 8)), hB = hexHardware(dB);
  const rBC = rp - hB.F / 2 - 0.15, rSp = Math.max(ds / 2 + 1, 0.45 * rp), ySp0 = yBoss + tc, yNeck = ySp0 + 1.5 * ds + 1.5;
  for (const up of [1, -1] as const) {
    push(b, up > 0 ? 'stem housing boss' : 'trunnion boss', bodyPad(Db / 2, rp, up, yBoss - Db / 2));
    push(b, up > 0 ? 'stem housing cover' : 'trunnion cover', up > 0 ? ringY(rp + 0.25, ds / 2 + 0.05, yBoss, yBoss + tc) : cylY(rp + 0.25, -(yBoss + tc), -yBoss));
    const bl: MeshData[] = []; for (let i = 0; i < 8; i++) { const a = (Math.PI * (i + 0.5)) / 4, x = rBC * Math.cos(a), z = rBC * Math.sin(a); bl.push(up > 0 ? hexPrismY(hB.F, yBoss + tc, yBoss + tc + hB.H, x, z) : hexPrismY(hB.F, -(yBoss + tc + hB.H), -(yBoss + tc), x, z)); }
    push(b, `${up > 0 ? 'cover' : 'trunnion cover'} bolts 8 × ${dB} in`, mergeMeshes(bl), 'hardware', 'Grade 90 bolt', 8);
  }
  push(b, 'mounting spool', ringY(rSp, ds / 2 + 0.05, ySp0, yNeck - 0.5));
  push(b, 'mounting flange', ringY(rSp + 0.5, ds / 2 + 0.05, yNeck - 0.5, yNeck));
  push(b, 'stem seal', ringY(ds / 2 + 0.03, ds / 2, yBoss - 0.6, yBoss - 0.2), 'polymer', 'polymer');
  push(b, `stem ${ds} in`, cylY(ds / 2, Rb - 0.4 * ds, yNeck + 1), 'stem', BAR);
  push(b, 'trunnion', cylY(ds / 2, -(Db / 2 + 0.5), -(Rb - 0.4 * ds)), 'stem', BAR);
  if (NPS >= 8) {                                                                                                  // BT-1 saddle feet
    const tF = tb + 0.25, yBase = -(yBoss + tc + hB.H + 1), xw = 0.3 * Db, yTopF = -Math.sqrt((Db / 2) ** 2 - xw * xw) + 0.3, ft: MeshData[] = [];
    for (const sz of [-1, 1]) { const z = sz * 0.5 * zj; ft.push(box(-xw, yBase + 0.5, z - tF / 2, xw, yTopF, z + tF / 2), box(-xw - 1, yBase, z - 2, xw + 1, yBase + 0.5, z + 2)); }
    push(b, 'saddle feet 2', mergeMeshes(ft));
  }
  operateQT(b, op, op.kind === 'gear' ? yNeck : yNeck + 0.2, ds, D);
  Object.assign(dims, { ballD: rule(2 * Rb, 'SW-VLV-BT-1', 'Ball diameter'), carrier: rule(sc, 'SW-VLV-BT-1', 'Seat carrier section'), bodyOD: rule(Db, 'SW-VLV-BT-1', 'Body outside diameter'), torque: rule(T, 'SW-VLV-BT-2', 'Operating torque (lb·in)', 'lb'), stemD: rule(ds, 'SW-VLV-B-2', 'Stem / trunnion diameter') });
  return { c, op, extra: { joint: fe, torque: T } };
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

// ---- gate (G-*, F-2) --------------------------------------------------------------------------------------
const buildGate: Build = (b, NPS, cls, dims) => {
  const D0 = pipeDims(NPS, cls).D, P = CLASS_PRESSURE[cls];
  const c = common(NPS, cls, D0, 1.4 * D0); c.wBody = D0 + 2 * c.tb; c.F2F = 2 * c.f.tf + 2 * c.hHub + c.wBody;   // G-2
  const { D, tb } = c, zi = c.F2F / 2 - c.f.tf, k = blendK(c);
  endFlanges(b, c);
  const ai = 0.7 * D, bi = 0.3 * D, fb = designFlange(NPS, cls, 2 * ai, tb, 2 * ai + 2 * tb);
  const ab = ai + tb + 1.25 * fb.d, bbz = bi + tb + 1.25 * fb.d, aF = ab + 1.25 * fb.d + 0.25, bF = bbz + 1.25 * fb.d + 0.25;
  const yB0 = D / 2 + 0.6 * D + fb.tf, yJ = yB0 - fb.tf;
  const outer = S.union(S.blend(k, runSDF(c, zi), S.superCylY(ai + tb, bi + tb, -D / 2, yJ, 2), S.ellipsoid(0, -D / 2, 0, ai + tb, 0.15 * D + tb, bi + tb)), S.rsuperCylY(aF, bF, yJ, yB0, edgeR(fb.tf), 2));
  const cav = S.union(boreSDF(c, zi), S.superCylY(ai, bi, -D / 2, yB0 + 1, 2), S.ellipsoid(0, -D / 2, 0, ai, 0.15 * D, bi));
  castPart(b, 'body', S.subtract(outer, cav), [-(aF + 0.5), -(0.65 * D + tb + 0.5), -(zi + 0.1)], [aF + 0.5, yB0 + 0.1, zi + 0.1], tb);
  ovalGasket(b, ab - 0.7 * fb.d, bbz - 0.7 * fb.d, ai + 0.06, bi + 0.06, yB0, fb.gasketT);
  // closure, seats
  const sw = Math.max(0.25, 0.1 * D), tw = 0.25 * D, tan5 = Math.tan((5 * Math.PI) / 180), stroke = 1.05 * D;
  for (const s of [-1, 1]) push(b, 'seat ring', transformMesh(ringZ(0.65 * D, D / 2, -sw / 2, sw / 2), multiply(translate(0, 0, s * (tw / 2 + sw / 2)), rotateX(-s * (5 * Math.PI) / 180))), 'stem', BAR);
  const wedge = extrude({ outer: circle(0, 0, 0.65 * D, N) }, tw, -tw / 2, { start: { dx: 0, dy: -tan5 }, end: { dx: 0, dy: tan5 } });
  push(b, 'wedge', mergeMeshes([wedge, cylY(0.15 * D, 0.6 * D, 0.75 * D)]), 'closure');
  // stem, bonnet with integral yoke, packing, stem nut, operator
  const F = P * (Math.PI / 4) * D * D * ((0.3 + tan5) * 1.15 + 0.25), st = risingStem(F, D);                     // G-3
  const y0 = yB0 + fb.gasketT, hb = Math.max(1.0 * D, 2), s = st.packing, tg = Math.max(0.375, s);
  const yBoxTopEst = y0 + fb.tf + hb + 5 * s, yNut = yBoxTopEst + 0.1 + tg + stroke + 1.5, nutH = 1.5 * st.ds, bossR = 1.5 * st.ds + 0.25, ta = yokeTa(c);
  const bn = bonnetYoke(b, { ai, bi, aF, bF, y0, tfb: fb.tf, hb, st, tb, yoke: { yTop: yNut, headH: nutH, bossR, ta } });
  jointBolts(b, ellipsePts(ab, bbz, fb.n), fb.d, yJ, y0 + fb.tf, 'bonnet bolts');
  packingGland(b, st, bn.y1, bn.yBoxTop, bn.xg, bn.dg);
  push(b, 'stem nut', ringY(bossR, st.ds / 2 + 0.02, yNut - 0.4, yNut + nutH + 0.4), 'stem', BAR);
  const op = sizeOperator(st.T, false);
  push(b, `stem ${st.ds} in`, cylY(st.ds / 2, 0.75 * D, yNut + nutH + 2 + 1.5 * st.ds), 'stem', BAR);
  operate(b, op, op.kind === 'gear' ? yNut + nutH + 0.5 : yNut + nutH + 1 + 0.12 * (op.Dhw ?? 0), st.ds, D, 2 * (bossR + ta));
  Object.assign(dims, { stroke: rule(stroke, 'SW-VLV-G-2', 'Stroke'), wedgeT: rule(tw, 'SW-VLV-G-1', 'Wedge thickness at the seat line'), seatW: rule(sw, 'SW-VLV-G-1', 'Seat face width'), thrust: rule(F, 'SW-VLV-G-3', 'Stem thrust', 'lb'), stemD: rule(st.ds, 'SW-VLV-5', 'Stem diameter'), bonnetOval: rule(2 * aF, 'SW-VLV-F-2', 'Bonnet flange length across the flow') });
  return { c, op, extra: { stroke, bonnet: fb, stem: st } };
};

// ---- globe family (GL/GY/GA, CV, CL; F-3/F-4) -------------------------------------------------------------
function plugDisc(b: ValveSolid[], D: number, yS: number, ds: number) {
  push(b, 'disc', revolveY([{ r: 0, z: yS - 0.15 * D }, { r: D / 2 - 0.05 * D, z: yS - 0.15 * D }, { r: 0.6 * D, z: yS + 0.12 * D }, { r: 0.6 * D, z: yS + 0.27 * D }, { r: ds, z: yS + 0.27 * D }, { r: ds, z: yS + 0.4 * D }, { r: 0, z: yS + 0.4 * D }]), 'closure');
}
/** body bbox for a globe-family body */
const globeBox = (info: GlobeBody, zi: number, c: Common): [V3, V3] => { const x = Math.max(info.Rs, info.fb.OD / 2, c.D / 2 + 2 * c.tb) + 0.5; return [[-x, -0.9 * info.Rs - 0.5, -(zi + 0.1)], [x, info.yB + 0.1, zi + 0.1]]; };
/** the OS&Y globe superstructure above a globe-family body (seat, disc, gasket, bonnet+yoke, packing, stem, nut, wheel) */
function globeTop(b: ValveSolid[], c: Common, info: GlobeBody, dims: Record<string, Dim>, ySeat = info.yS) {
  const { D, tb, P } = c, { Rn, fb, yB } = info;
  push(b, 'seat ring', ringY(0.6 * D, D / 2, ySeat, ySeat + 0.1 * D), 'stem', BAR);
  const lift = D / 4, F = P * (Math.PI / 4) * (1.2 * D) ** 2 * 1.15, st = risingStem(F, D);                    // GL-1/2
  plugDisc(b, D, ySeat + 0.1 * D, st.ds);
  push(b, 'bonnet gasket', ringY((fb.gasketID + 2 * fb.wg) / 2, fb.gasketID / 2, yB, yB + fb.gasketT), 'polymer', 'compressed sheet');
  const y0 = yB + fb.gasketT, hb = Math.max(0.5 * D + lift, 1.5), s = st.packing, tg = Math.max(0.375, s);
  const yNut = y0 + fb.tf + hb + 5 * s + 0.1 + tg + lift + 1.5, nutH = 1.5 * st.ds, bossR = 1.5 * st.ds + 0.25, ta = yokeTa(c);
  const bn = bonnetYoke(b, { ai: Rn, bi: Rn, aF: fb.OD / 2, bF: fb.OD / 2, y0, tfb: fb.tf, hb, st, tb, yoke: { yTop: yNut, headH: nutH, bossR, ta } });
  jointBolts(b, circlePts(fb.BC / 2, fb.n), fb.d, yB - fb.tf, y0 + fb.tf, 'bonnet bolts');
  packingGland(b, st, bn.y1, bn.yBoxTop, bn.xg, bn.dg);
  push(b, 'stem nut', ringY(bossR, st.ds / 2 + 0.02, yNut - 0.4, yNut + nutH + 0.4), 'stem', BAR);
  const op = sizeOperator(st.T, false);
  push(b, `stem ${st.ds} in`, cylY(st.ds / 2, ySeat + 0.4 * D, yNut + nutH + 2 + 1.5 * st.ds), 'stem', BAR);
  operate(b, op, op.kind === 'gear' ? yNut + nutH + 0.5 : yNut + nutH + 1 + 0.12 * (op.Dhw ?? 0), st.ds, D, 2 * (bossR + ta));
  Object.assign(dims, { lift: rule(lift, 'SW-VLV-GL-1', 'Disc lift'), seatOD: rule(1.2 * D, 'SW-VLV-GL-1', 'Seat ring OD'), thrust: rule(F, 'SW-VLV-GL-2', 'Stem thrust', 'lb'), stemD: rule(st.ds, 'SW-VLV-5', 'Stem diameter'), bulb: rule(2 * info.Rs, 'SW-VLV-F-3', 'Body bulb diameter') });
  return { op, extra: { lift, bonnet: fb, stem: st } };
}
const buildGlobe: Build = (b, NPS, cls, dims) => {
  const D0 = pipeDims(NPS, cls).D, c = common(NPS, cls, 1.5 * D0, 1.7 * D0), zi = c.F2F / 2 - c.f.tf;
  endFlanges(b, c);
  const { body, info } = globeBodySDF(c, zi), [mn, mx] = globeBox(info, zi, c);
  castPart(b, 'body', body, mn, mx, c.tb);
  return { c, ...globeTop(b, c, info, dims) };
};
const buildYGlobe: Build = (b, NPS, cls, dims, notes) => {
  const D0 = pipeDims(NPS, cls).D, c = common(NPS, cls, 1.5 * D0, 1.7 * D0), zi = c.F2F / 2 - c.f.tf, tilt = -Math.PI / 4;
  endFlanges(b, c);
  const { body, info } = globeBodySDF(c, zi, tilt), R = Math.max(zi, info.yB + info.fb.OD / 2, info.Rs) + 0.5;
  castPart(b, 'body', body, [-R, -R, -R], [R, R, R], c.tb);
  const sub: ValveSolid[] = [], r = globeTop(sub, c, info, dims), tiltM = rotateX(tilt);
  for (const s of sub) push(b, s.name, transformMesh(s.mesh, tiltM), s.role, s.material, s.count);
  notes.push('Seat, bonnet, yoke and stem on a 45° axis toward the inlet (SW-VLV-GY-1, F-4).');
  return { c, ...r };
};
const buildAGlobe: Build = (b, NPS, cls, dims, notes) => {
  const D0 = pipeDims(NPS, cls).D, c = common(NPS, cls, 1.5 * D0, 1.7 * D0);
  const { D, tb, f } = c, CF = f.tf + c.hHub + 0.75 * D; c.F2F = 2 * CF;
  const Rs = 0.85 * D + tb, Rn = 0.62 * D, fb = designFlange(NPS, cls, 2 * Rn, tb, 2 * Rn + 2 * tb), yB = 0.75 * D + 0.5 * tb + fb.tf, zi = CF - f.tf, k = blendK(c);
  // inlet flange (−z) and outlet flange (−y), machined
  push(b, 'end flange', flangeRing(f, -CF, D)); push(b, 'raised face', ringZ(f.rfOD / 2, D / 2, -CF - f.rfH, -CF));
  push(b, 'end flange', transformMesh(flangeRing(f, 0, D), multiply(translate(0, -CF, 0), toY)));
  push(b, 'raised face', ringY(f.rfOD / 2, D / 2, -CF - f.rfH, -CF));
  const outlet = S.union(S.cylY(D / 2 + tb, -zi, 0), S.frustumY(D / 2 + 2 * tb, -zi, D / 2 + tb, -zi + f.hubLen));
  const outer = S.union(S.blend(k, runSDF(c, zi, -zi, 0), outlet, S.ellipsoid(0, 0, 0, Rs, 0.9 * Rs, Rs), S.cylY(Rn + tb, 0, yB - fb.tf)), S.rcylY(fb.OD / 2, yB - fb.tf, yB, edgeR(fb.tf)));
  const cav = S.union(S.cylZ(D / 2, -zi - 1, 0), S.cylY(D / 2, -zi - 1, 0), S.ellipsoid(0, 0, 0, Rs - tb, 0.9 * Rs - tb, Rs - tb), S.cylY(Rn, 0, yB + 1));
  const x = Math.max(Rs, fb.OD / 2, f.OD / 2) + 0.5;
  castPart(b, 'body', S.subtract(outer, cav), [-x, -zi - 0.1, -zi - 0.1], [x, yB + 0.1, Rs + 0.5], tb);
  const info: GlobeBody = { Rs, Rn, fb, yB, yS: -(0.9 * Rs - tb) };
  const r = globeTop(b, c, info, dims, -(0.9 * Rs - tb));
  dims.CF = rule(CF, 'SW-VLV-GA-1', 'Centre to face (both ends)');
  notes.push('Inlet on the run axis, outlet turned down, seat at the mouth of the outlet (SW-VLV-GA-1, F-4); face-to-face reported as twice the centre-to-face.');
  return { c, ...r };
};

// ---- checks (C, CL, CD; F-5) ------------------------------------------------------------------------------
const buildCheck: Build = (b, NPS, cls, dims) => {
  const D0 = pipeDims(NPS, cls).D, c = common(NPS, cls, 1.5 * D0, 1.5 * D0), zi = c.F2F / 2 - c.f.tf;
  const { D, tb } = c, k = blendK(c);
  endFlanges(b, c);
  const ax = 0.62 * D, az = 0.75 * D, Rn = 0.72 * D, fb = designFlange(NPS, cls, 2 * Rn, tb, 2 * Rn + 2 * tb), yC = 0.85 * D + fb.tf;
  const zs = -0.1 * D, tDisc = 0.15 * D, pin = Math.max(0.375, 0.1 * D), yPin = 0.65 * D, zPin = zs + tDisc + 0.04 * D;
  const outer = S.union(S.blend(k, runSDF(c, zi), S.superCylY(ax + tb, az + tb, -0.3 * D, 0.5 * D, 2), S.ellipsoid(0, -0.3 * D, 0, ax + tb, 0.4 * D + tb, az + tb), S.cylY(Rn + tb, 0.3 * D, yC - fb.tf),
    S.cylX(pin / 2 + 0.35 + 0.05 * D, -(ax + tb + 0.35), ax + tb + 0.35, yPin, zPin)), S.rcylY(fb.OD / 2, yC - fb.tf, yC, edgeR(fb.tf)));
  const cav = S.union(boreSDF(c, zi), S.superCylY(ax, az, -0.3 * D, 0.5 * D, 2), S.ellipsoid(0, -0.3 * D, 0, ax, 0.4 * D, az), S.cylY(Rn, 0.3 * D, yC + 1));
  const x = Math.max(fb.OD / 2, ax + tb + 0.5, c.f.OD / 2) + 0.5;
  castPart(b, 'body', S.subtract(outer, cav), [-x, -(0.7 * D + tb + 0.5), -(zi + 0.1)], [x, yC + 0.1, zi + 0.1], tb);
  push(b, 'seat ring', ringZ(0.6 * D, D / 2, zs - 0.05 * D, zs), 'stem', BAR);
  push(b, 'disc', cylZ(0.6 * D, zs, zs + tDisc), 'closure');
  push(b, 'disc nut', transformMesh(extrude({ outer: regularHexagon(0.25 * D) }, 0.1 * D), translate(0, 0, zs + tDisc)), 'hardware', STUDM);
  push(b, 'hinge arm', box(-0.08 * D, 0, zs + tDisc + 0.1 * D, 0.08 * D, yPin, zs + tDisc + 0.16 * D), 'closure');
  push(b, `hinge pin ${pin} in`, transformMesh(cylZ(pin / 2, -(ax + tb + 0.3), ax + tb + 0.3), multiply(translate(0, yPin, zPin), toX)), 'stem', BAR);
  push(b, 'cover gasket', ringY((fb.gasketID + 2 * fb.wg) / 2, fb.gasketID / 2, yC, yC + fb.gasketT), 'polymer', 'compressed sheet');
  const y0 = yC + fb.gasketT, boss = Math.max(tb, 0.08 * D);
  castPart(b, 'cover', S.blend(Math.max(0.2, tb / 2), S.rcylY(fb.OD / 2, y0, y0 + fb.tf, edgeR(fb.tf)), S.cylY(0.8 * Rn, y0 + fb.tf - 0.1, y0 + fb.tf + boss)), [-fb.OD / 2 - 0.3, y0 - 0.1, -fb.OD / 2 - 0.3], [fb.OD / 2 + 0.3, y0 + fb.tf + boss + 0.2, fb.OD / 2 + 0.3], Math.min(fb.tf, tb));
  jointBolts(b, circlePts(fb.BC / 2, fb.n), fb.d, yC - fb.tf, y0 + fb.tf, 'cover bolts');
  Object.assign(dims, { discD: rule(1.2 * D, 'SW-VLV-C-1', 'Disc diameter'), discT: rule(tDisc, 'SW-VLV-C-1', 'Disc thickness'), pin: rule(pin, 'SW-VLV-C-1', 'Hinge pin diameter'), coverD: rule(fb.OD, 'SW-VLV-F-5', 'Cover diameter') });
  return { c, op: { kind: 'none', rimForce: 0, T: 0 }, extra: { cover: fb } };
};
const buildLCheck: Build = (b, NPS, cls, dims) => {
  const D0 = pipeDims(NPS, cls).D, c = common(NPS, cls, 1.5 * D0, 1.7 * D0), zi = c.F2F / 2 - c.f.tf;
  const { D, tb } = c;
  endFlanges(b, c);
  const { body, info } = globeBodySDF(c, zi), [mn, mx] = globeBox(info, zi, c);
  castPart(b, 'body', body, mn, mx, tb);
  const { Rn, fb, yB, yS } = info;
  push(b, 'seat ring', ringY(0.6 * D, D / 2, yS, yS + 0.1 * D), 'stem', BAR);
  push(b, 'piston disc', cylY(0.6 * D, yS + 0.1 * D, yS + 0.4 * D), 'closure');                                  // CL-1
  push(b, 'cap gasket', ringY((fb.gasketID + 2 * fb.wg) / 2, fb.gasketID / 2, yB, yB + fb.gasketT), 'polymer', 'compressed sheet');
  const y0 = yB + fb.gasketT, yT = y0 + fb.tf, Hd = 0.35 * Rn + tb;
  const cap = S.subtract(S.blend(0.3, S.rcylY(fb.OD / 2, y0, yT, edgeR(fb.tf)), S.intersect(S.ellipsoid(0, yT, 0, Rn + tb, Hd, Rn + tb), (x, y) => yT - 0.05 - y)), S.ellipsoid(0, yT, 0, Rn, Hd - tb, Rn));
  castPart(b, 'cap', cap, [-fb.OD / 2 - 0.3, y0 - 0.1, -fb.OD / 2 - 0.3], [fb.OD / 2 + 0.3, yT + Hd + 0.2, fb.OD / 2 + 0.3], tb);
  push(b, 'dashpot guide', ringY(0.6 * D + 1 / 32 + tb, 0.6 * D + 1 / 32, yS + 0.3 * D, yT - 0.05), 'stem', BAR);
  jointBolts(b, circlePts(fb.BC / 2, fb.n), fb.d, yB - fb.tf, yT, 'cap bolts');
  Object.assign(dims, { pistonD: rule(1.2 * D, 'SW-VLV-CL-1', 'Piston diameter'), pistonL: rule(0.3 * D, 'SW-VLV-CL-1', 'Piston length') });
  return { c, op: { kind: 'none', rimForce: 0, T: 0 }, extra: { cap: fb } };
};

// ---- floating ball (B-*, F-6) -----------------------------------------------------------------------------
const buildBall: Build = (b, NPS, cls, dims) => {
  const D0 = pipeDims(NPS, cls).D, Rb = 0.75 * D0, seat = 0.1 * D0;
  const c = common(NPS, cls, 1.5 * D0 + 2 * seat + 0.5, 2 * Rb + 2 * seat); const { D, tb, P, f } = c, k = blendK(c);
  const Rc = Rb + seat, fe = designFlange(NPS, cls, 2 * Rc, tb, 2 * Rc + 2 * tb), Db = fe.BC + 2.5 * fe.d, h = hexHardware(fe.d);
  const Rs = Rc + tb + 0.05 * D, zj = Rc + 0.25, Lc = 1.5 * fe.d + 0.5, z1 = zj + fe.gasketT + fe.tf;
  const rN = D / 2 + 2 * tb, rT = Math.max(rN + 0.25, fe.BC / 2 - h.F / 2 - 0.25), Lt = Math.max(1, 0.45 * (rT - rN));
  const zFace = z1 + Lt + 1 + 0.5 * f.hubLen + f.tf, zi = zFace - f.tf;
  c.wBody = 2 * zj; c.F2F = 2 * zFace;
  endFlanges(b, c, zFace);
  const T = P * (Math.PI / 4) * (1.2 * D) ** 2 * 0.1 * (0.75 * D) * 1.2, ds = ballStem(T), op = sizeOperator(T, true);  // B-2
  const rp = Math.max(ds + 1, 0.3 * D), yPad = Rs + 0.4, yNeck = yPad + 1.5 * ds + 0.5;
  const outer = S.blend(k, S.sphere(0, 0, 0, Rs), runSDF(c, zi, -zi, 0), S.rcylZ(Db / 2, zj - Lc, zj, edgeR(Lc)), S.cylY(rp, 0, yPad), S.cylY(ds + 0.45, yPad - 0.2, yNeck));
  const cav = S.union(S.sphere(0, 0, 0, Rc), S.cylZ(Rc, 0, zj + 1), S.cylZ(D / 2, -zi - 1, 0), S.cylY(ds / 2 + 0.03, 0, yNeck + 1));
  const xb = Math.max(Db / 2, Rs, rp) + 0.5;
  castPart(b, 'body', S.subtract(outer, cav), [-xb, -Math.max(Db / 2, Rs) - 0.5, -zi - 0.1], [xb, yNeck + 0.1, zj + 0.1], tb);
  const conn = S.subtract(S.blend(Math.max(0.25, tb / 2), S.rcylZ(Db / 2, zj + fe.gasketT, z1, edgeR(fe.tf)), S.frustumZ(rT, z1 - 0.05, rN, z1 + Lt), S.cylZ(rN, z1 + Lt - 0.05, zi)), S.cylZ(D / 2, zj - 1, zi + 1));
  castPart(b, 'end connector', conn, [-Db / 2 - 0.3, -Db / 2 - 0.3, zj + fe.gasketT - 0.05], [Db / 2 + 0.3, Db / 2 + 0.3, zi + 0.05], Math.min(tb, fe.tf));
  push(b, 'connector gasket', ringZ((fe.gasketID + 2 * fe.wg) / 2, fe.gasketID / 2, zj, zj + fe.gasketT), 'polymer', 'compressed sheet');
  const nutProf = ringAroundHole(regularHexagon(h.F), { x: 0, y: 0 }, fe.d / 2, 24), st: MeshData[] = [];
  for (const [x, y] of circlePts(fe.BC / 2, fe.n)) st.push(cylZ(fe.d / 2, z1, z1 + h.nutH + fe.d / 4, x, y), transformMesh(extrude(nutProf, h.nutH), translate(x, y, z1)));
  push(b, `connector studs ${fe.n} × ${fe.d} in (tapped 1.5 d into the body; length inside not drawn)`, mergeMeshes(st), 'hardware', STUDM, fe.n);
  push(b, `ball ${2 * Rb} in`, ballWithBore(Rb, D), 'closure', BAR);
  for (const s of [-1, 1]) push(b, 'seat ring', ringZ(0.6 * D + seat / 2, 0.6 * D - seat / 2, s * (Rb - 0.3 * seat) - seat / 2, s * (Rb - 0.3 * seat) + seat / 2), 'polymer', 'polymer');
  push(b, 'stem seal', ringY(ds / 2 + 0.03, ds / 2, yNeck - 0.6, yNeck - 0.2), 'polymer', 'polymer');
  push(b, `stem ${ds} in`, mergeMeshes([cylY(ds / 2, Rb - 0.4 * ds, yNeck + 1), cylY(ds, Rc - 0.4, Rc - 0.4 + 0.3 * ds)]), 'stem', BAR);
  push(b, 'stem nut', hexPrismY(1.5 * ds + 0.2, yNeck + 0.6, yNeck + 0.6 + 0.6 * ds), 'hardware', STUDM);
  operateQT(b, op, op.kind === 'gear' ? yNeck : yNeck + 0.2, ds, D);
  Object.assign(dims, { ballD: rule(2 * Rb, 'SW-VLV-B-1', 'Ball diameter'), seat: rule(seat, 'SW-VLV-B-1', 'Seat section'), bodyOD: rule(Db, 'SW-VLV-BT-1', 'Body joint diameter'), bodySphere: rule(2 * Rs, 'SW-VLV-F-6', 'Body sphere diameter'), torque: rule(T, 'SW-VLV-B-2', 'Operating torque (lb·in)', 'lb'), stemD: rule(ds, 'SW-VLV-B-2', 'Stem diameter') });
  return { c, op, extra: { joint: fe, torque: T } };
};

// ---- butterflies (BF, BL, BD; F-7) ------------------------------------------------------------------------
function butterflyCast(b: ValveSolid[], c: Common, Ro: number, zLo: number, zHi: number, ds: number, xOff: number, mode: 'wafer' | 'lug' | 'flanged') {
  const lugs = mode === 'lug';
  const { D, f, tb } = c, liner = c.cls === 'P150' || c.cls === 'P300' ? 0.125 : 0, rn = Math.max(1, ds / 2 + 0.6, 0.1 * D + 0.6), hn = Math.max(2.5, 0.25 * D), tp = Math.max(0.5, tb), sp = 2.6 * rn;
  const yTop = Ro + hn + tp, holes: SDF[] = [], parts: SDF[] = [S.rcylZ(Ro, zLo, zHi, Math.min(0.3, (zHi - zLo) * 0.2)), S.cylY(rn, Ro - 1, Ro + hn, xOff), S.cylY(0.8 * rn, -(Ro + 0.75), -(Ro - 1), xOff)];
  const pts = circlePts(f.BC / 2, f.n);
  if (lugs) for (const [x, y] of pts) { parts.push(S.rcylZ(f.d, zLo, zHi, 0.2, x, y)); holes.push(S.cylZ(f.holeD / 2, zLo - 1, zHi + 1, x, y)); }
  if (mode === 'wafer') for (const i of [0, 1, 2, 3].map(q => Math.floor((q * f.n) / 4))) { const [x, y] = pts[i], m = (zHi - zLo) * 0.15; parts.push(S.rcylZ(f.d * 0.9 + 0.15, zLo + m, zHi - m, 0.15, x, y)); holes.push(S.cylZ(f.holeD / 2, zLo - 1, zHi + 1, x, y)); }   // F-7 locating ears
  const outer = S.union(S.blend(Math.max(0.4, 0.04 * D), ...parts), S.roundBox(xOff, Ro + hn + tp / 2, 0, sp / 2, tp / 2, sp / 2, 0.12));
  const cav = S.union(S.cylZ(D / 2 + liner, zLo - 1, zHi + 1), S.cylY(ds / 2 + 0.03, -(Ro + 1), yTop + 1, xOff), ...holes);
  const x = (mode === 'flanged' ? Ro : f.BC / 2 + f.d) + 0.5;
  castPart(b, 'body', S.subtract(outer, cav), [-Math.max(x, sp / 2 + Math.abs(xOff)), -Math.max(x, Ro + 0.75) - 0.3, zLo - 0.1], [Math.max(x, sp / 2 + Math.abs(xOff)), yTop + 0.2, zHi + 0.1], Math.min(tb, (zHi - zLo) / 2));
  if (liner) push(b, 'liner', ringZ(D / 2 + liner, D / 2, zLo, zHi), 'polymer', 'polymer');
  push(b, `shaft ${ds} in`, cylY(ds / 2, -(Ro + 0.5), yTop + 1, xOff), 'stem', BAR);
  return { yTop, liner };
}
function butterflyWafer(b: ValveSolid[], c: Common, w: number, dims: Record<string, Dim>, ruleId: string, lugs: boolean) {
  const { D, P, f } = c, Ro = (f.BC - f.d - 0.25) / 2, ds = Math.max(0.5, 0.12 * D), T = 0.014 * P * D ** 3;
  const { yTop, liner } = butterflyCast(b, c, Ro, -w / 2, w / 2, ds, 0, lugs ? 'lug' : 'wafer');
  push(b, 'disc', revolve([{ r: 0, z: -0.075 * D }, { r: D / 2, z: -0.025 * D }, { r: D / 2, z: 0.025 * D }, { r: 0, z: 0.075 * D }], N), 'closure');
  const op = sizeOperator(T, true);
  if (op.kind === 'gear') gearOperator(b, op, yTop, ds, true);
  else { notchPlate(b, yTop, Math.max(ds, 0.6) + 0.5, Math.max(ds, 0.6) + 2.5); lever(b, op, yTop + 0.75, ds, D, 'butterfly'); }
  Object.assign(dims, { bodyOD: rule(2 * Ro, ruleId, 'Body OD'), liner: rule(liner, ruleId, 'Liner thickness'), shaftD: rule(ds, ruleId, 'Shaft diameter'), neck: rule(Math.max(2.5, 0.25 * D), 'SW-VLV-F-7', 'Neck height above the ring'), torque: rule(T, 'SW-VLV-BF-1', 'Operating torque (lb·in)', 'lb') });
  return { op, T };
}
const buildBfly: Build = (b, NPS, cls, dims, notes) => {
  const D0 = pipeDims(NPS, cls).D, wBody = 0.3 * D0 + 1, c = common(NPS, cls, wBody, D0); c.F2F = wBody;
  const { op, T } = butterflyWafer(b, c, wBody, dims, 'SW-VLV-BF-1', false);
  notes.push('Wafer body held between the pipe flanges by their studs (SW-VLV-BF-1).');
  return { c, op, extra: { torque: T } };
};
const buildLBfly: Build = (b, NPS, cls, dims, notes) => {
  const D0 = pipeDims(NPS, cls).D, wBody = 0.3 * D0 + 1, c = common(NPS, cls, wBody, D0); c.F2F = wBody;
  const { op, T } = butterflyWafer(b, c, wBody, dims, 'SW-VLV-BL-1', true);
  notes.push(`Lugged body: ${c.f.n} tapped lugs take the line studs from either side (SW-VLV-BL-1); tapped holes not cut in the casting.`);
  return { c, op, extra: { torque: T } };
};
const buildDBfly: Build = (b, NPS, cls, dims, notes) => {
  const D0 = pipeDims(NPS, cls).D, c = common(NPS, cls, 0.5 * D0, D0);
  const { D, tb, f, P } = c; c.F2F = 0.5 * D + 2 * f.tf;                                                        // BD-1
  endFlanges(b, c);
  const ds = Math.max(0.625, 0.14 * D), T = 0.03 * P * D ** 3, zOff = 0.1 * D, xOff = 0.05 * D, zi = c.F2F / 2 - f.tf;
  const { yTop } = butterflyCast(b, c, D / 2 + 2 * tb, -zi, zi, ds, xOff, 'flanged');
  push(b, 'metal seat ring', ringZ(D / 2, D / 2 - 0.04 * D, zOff - 0.03 * D, zOff + 0.03 * D), 'stem', BAR);
  push(b, 'disc', transformMesh(revolve([{ r: 0, z: -0.05 * D }, { r: D / 2 - 0.045 * D, z: -0.05 * D }, { r: D / 2 - 0.045 * D, z: 0.05 * D }, { r: 0, z: 0.05 * D }], N), translate(0, 0, zOff)), 'closure');
  push(b, 'disc hub', box(xOff - 0.1 * D, -0.3 * D, 0, xOff + 0.1 * D, 0.3 * D, zOff), 'closure');
  const op = D >= 8 ? sizeOperator(Math.max(T, 80 * 6 * 2), true) : sizeOperator(T, true);
  const s2: ValveSolid[] = [];
  if (op.kind === 'gear') gearOperator(s2, op, yTop, ds, true); else lever(s2, op, yTop + 0.75, ds, D);
  for (const s of s2) push(b, s.name, transformMesh(s.mesh, translate(xOff, 0, 0)), s.role, s.material);
  Object.assign(dims, { offsetZ: rule(zOff, 'SW-VLV-BD-1', 'Shaft offset behind the disc plane'), offsetX: rule(xOff, 'SW-VLV-BD-1', 'Shaft offset off the centreline'), shaftD: rule(ds, 'SW-VLV-BD-1', 'Shaft diameter'), torque: rule(T, 'SW-VLV-BD-1', 'Operating torque (lb·in)', 'lb') });
  notes.push('Double offset: the disc lifts off the metal seat as it opens (SW-VLV-BD-1).');
  return { c, op, extra: { torque: T } };
};

// ---- plug and diaphragm (PL, DI; F-8) ---------------------------------------------------------------------
const buildPlug: Build = (b, NPS, cls, dims, notes) => {
  const D0 = pipeDims(NPS, cls).D, c = common(NPS, cls, 1.6 * D0, 1.6 * D0); c.wBody = 1.6 * D0 + 2 * c.tb; c.F2F = 2 * c.f.tf + 2 * c.hHub + c.wBody;
  const { D, tb, P } = c, zi = c.F2F / 2 - c.f.tf, k = blendK(c);
  endFlanges(b, c);
  const tan5 = Math.tan((5 * Math.PI) / 180), yB = -0.9 * D, yT = 0.9 * D, rB = 0.55 * D, rT = rB + 1.8 * D * tan5, a = rT + tb + 0.05 * D;
  const fb = designFlange(NPS, cls, 2 * (rT + 0.02), tb, 2 * (rT + 0.02) + 2 * tb);
  const ym = (yB - tb + yT - fb.tf) / 2, hy = (yT - fb.tf - (yB - tb)) / 2;
  const outer = S.union(S.blend(k, runSDF(c, zi), S.roundBox(0, ym, 0, a, hy, a, Math.min(0.3 * D, 0.45 * a))), S.rcylY(fb.OD / 2, yT - fb.tf, yT, edgeR(fb.tf)));
  const cav = S.union(boreSDF(c, zi), S.frustumY(rB + 0.02, yB, rT + 0.02, yT + 1));
  const x = Math.max(a, fb.OD / 2) + 0.5;
  castPart(b, 'body', S.subtract(outer, cav), [-x, yB - tb - 0.5, -(zi + 0.1)], [x, yT + 0.1, zi + 0.1], tb);
  push(b, 'plug', revolveY([{ r: 0, z: yB }, { r: rB, z: yB }, { r: rT, z: yT }, { r: 0, z: yT }]), 'closure');                 // PL-1
  push(b, 'gland gasket', ringY((fb.gasketID + 2 * fb.wg) / 2, fb.gasketID / 2, yT, yT + fb.gasketT), 'polymer', 'compressed sheet');
  const head = 0.5 * D, y0 = yT + fb.gasketT, yHead = y0 + fb.tf;
  castPart(b, 'gland cover', S.subtract(S.blend(0.2, S.rcylY(fb.OD / 2, y0, yHead, edgeR(fb.tf)), S.cylY(head * 0.8 + tb, yHead - 0.1, yHead + 0.4 * tb + 0.2)), S.cylY(head * 0.72, y0 - 1, yHead + 2)), [-fb.OD / 2 - 0.3, y0 - 0.1, -fb.OD / 2 - 0.3], [fb.OD / 2 + 0.3, yHead + tb + 0.5, fb.OD / 2 + 0.3], Math.min(fb.tf, tb));
  jointBolts(b, circlePts(fb.BC / 2, fb.n), fb.d, yT - fb.tf, yHead, 'cover bolts');
  push(b, 'wrench head (square)', box(-head / 2, yT - 0.1, -head / 2, head / 2, yHead + head, head / 2), 'closure');
  push(b, 'lubricant fitting', mergeMeshes([hexPrismY(0.5, yHead, yHead + 0.5, 0.75 * (fb.BC / 2), 0), cylY(0.15, yHead + 0.5, yHead + 1.0, 0.75 * (fb.BC / 2), 0)]), 'stem', BAR);
  const T = P * (Math.PI / 4) * D * D * 0.1 * (0.65 * D), op = sizeOperator(T, true);   // PL-1 (lubricated film)
  operateQT(b, op, yHead + 0.7 * head, head / 2, D, 'plug', head);
  Object.assign(dims, { plugBase: rule(2 * rB, 'SW-VLV-PL-1', 'Plug diameter at the small end'), plugTop: rule(2 * rT, 'SW-VLV-PL-1', 'Plug diameter at the large end'), torque: rule(T, 'SW-VLV-PL-1', 'Operating torque (lb·in)', 'lb') });
  notes.push('Plug port not cut (shown closed) (SW-VLV-PL-1).');
  return { c, op, extra: { torque: T } };
};
const buildDiaph: Build = (b, NPS, cls, dims, notes) => {
  const D0 = pipeDims(NPS, cls).D, c = common(NPS, cls, 1.6 * D0, 1.6 * D0); c.wBody = 1.6 * D0 + 2 * c.tb; c.F2F = 2 * c.f.tf + 2 * c.hHub + c.wBody;
  const { D, tb, P } = c, zi = c.F2F / 2 - c.f.tf, k = blendK(c);
  endFlanges(b, c);
  const Ro = 0.8 * D, yF = 0.3 * D, fb = designFlange(NPS, cls, 2 * Ro, tb, 2 * Ro + 2 * tb), hs = Ro + tb + 2.2 * fb.d, td = Math.max(0.125, 0.03 * D);
  const yLo = -(D / 2 + tb), yHi = yF - fb.tf;
  // F-8: the body flares from each flange hub into the body (no bare run tube)
  const rH = D / 2 + 2 * tb, rBf = 0.75 * (Ro + tb), zb = Ro + tb;
  const flares = [S.frustumZ(rBf, 0.5 * zb, rH, zi), S.frustumZ(rH, -zi, rBf, -0.5 * zb)];
  const outer = S.union(S.blend(1.5 * k, runSDF(c, zi), ...flares, S.roundBox(0, (yLo + yHi) / 2, 0, Ro + tb, (yHi - yLo) / 2, Ro + tb, Math.min(0.35 * D, 0.4 * (Ro + tb)))), S.roundBox(0, yF - fb.tf / 2, 0, hs, fb.tf / 2, hs, 0.25));
  const weir = S.roundBox(0, -D / 2 + 0.3 * D - 0.5, 0, Ro + 1, 0.3 * D + 0.5, 0.12 * D, 0.08 * D);
  const cav = S.subtract(S.union(boreSDF(c, zi), S.superCylY(Ro, Ro, -0.1 * D, yF + 1, 4)), weir);
  castPart(b, 'body', S.subtract(outer, cav), [-hs - 0.5, yLo - 0.5, -(zi + 0.1)], [hs + 0.5, yF + 0.1, zi + 0.1], tb);
  push(b, 'diaphragm', box(-hs + 0.1, yF, -hs + 0.1, hs - 0.1, yF + td, hs - 0.1), 'polymer', 'polymer');
  const F = P * (Math.PI / 4) * (1.6 * D) ** 2 * 0.5, st = risingStem(F, D), y0 = yF + td, yT = y0 + fb.tf;
  // F-8 bonnet: square at its flange, round above (square prism ∩ cone), up to a round spindle neck
  const he = hs - 0.4, rN = Math.max(1.2 * st.ds + 0.5, 0.3 * he), Hb = 0.8 * he, yN = yT + Hb, Hn = Math.max(1.5, 0.6 * rN), kb = Math.max(0.3, 0.12 * he);
  const shell = (d: number) => S.smoothIntersect(kb, S.superFrustumY(he - d, he - d, yT - 0.05 - (d ? 1 : 0), 0.8 * he - d, 0.8 * he - d, yN - d, 4), S.superFrustumY(1.35 * he - d, 1.35 * he - d, yT - 0.05 - (d ? 1 : 0), rN - d, rN - d, yN - d, 2));
  const bonOuter = S.union(S.roundBox(0, y0 + fb.tf / 2, 0, hs, fb.tf / 2, hs, 0.25), S.blend(0.4, shell(0), S.cylY(rN, yN - 0.5 * rN, yN + Hn)));
  const bon = S.subtract(bonOuter, S.intersect(S.superCylY(Ro, Ro, y0 - 1, yN, 4), shell(tb)), S.cylY(st.ds / 2 + 0.05, yT, yN + Hn + 1));
  castPart(b, 'bonnet', bon, [-hs - 0.3, y0 - 0.1, -hs - 0.3], [hs + 0.3, yN + Hn + 0.3, hs + 0.3], tb);
  jointBolts(b, squarePts(hs - 1.2 * fb.d, fb.n), fb.d, yF - fb.tf, yT, 'bonnet bolts');
  push(b, 'compressor', revolveY([{ r: 0, z: y0 }, { r: 0.6 * Ro, z: y0 }, { r: 0.3 * Ro, z: y0 + 0.3 * Ro }, { r: 0, z: y0 + 0.3 * Ro }]), 'closure');
  const op = sizeOperator(st.T, false), ySp = yN + Hn;
  push(b, `spindle ${st.ds} in`, cylY(st.ds / 2, y0, ySp + 1.5 * st.ds + 1.5), 'stem', BAR);
  push(b, 'spindle sleeve', ringY(st.ds, st.ds / 2 + 0.02, ySp, ySp + 1.5 * st.ds), 'stem', BAR);
  operate(b, op, op.kind === 'gear' ? ySp : ySp + 1.5 * st.ds + 1 + 0.12 * (op.Dhw ?? 0), st.ds, D, 2 * rN + 2);
  Object.assign(dims, { opening: rule(2 * Ro, 'SW-VLV-DI-1', 'Diaphragm opening'), diaphragmT: rule(td, 'SW-VLV-DI-1', 'Diaphragm thickness'), weirH: rule(0.6 * D, 'SW-VLV-DI-1', 'Weir height above the bore bottom'), thrust: rule(F, 'SW-VLV-DI-1', 'Spindle thrust', 'lb'), stemD: rule(st.ds, 'SW-VLV-5', 'Spindle diameter'), flangeSquare: rule(2 * hs, 'SW-VLV-F-8', 'Square bonnet flange side') });
  notes.push('No packing: the diaphragm is the pressure boundary (SW-VLV-DI-1).');
  return { c, op, extra: { stem: st } };
};

// ---- safety valve (PSV-1, F-9) ----------------------------------------------------------------------------
const buildPSV: Build = (b, NPS, cls, dims, notes) => {
  const D0 = pipeDims(NPS, cls).D, P = CLASS_PRESSURE[cls];
  const c = common(NPS, cls, 1.8 * D0, 1.8 * D0); const { D, tb, f } = c, k = blendK(c);
  const outNPS = SIZE_SERIES[SIZE_SERIES.indexOf(NPS) + 1], fo = designFlange(outNPS, 'P150'), Do = pipeDims(outNPS, 'P150').D;   // PSV-1: outlet in P150
  const Rbowl = 0.9 * D, CFin = f.tf + c.hHub + Rbowl, CFout = fo.tf + fo.hubLen + 1 + Rbowl; c.F2F = CFin + CFout;
  const dSeat = 0.8 * D, Fs = P * (Math.PI / 4) * dSeat ** 2, sp = springDesign(Fs), dsp = Math.max(0.375, 0.2 * D), Rh = sp.Dm / 2 + sp.dw / 2 + 0.125;
  const fbj = designFlange(NPS, cls, 2 * Rh, tb, 2 * Rh + 2 * tb), yBody = Rbowl + tb + fbj.tf;
  // machined inlet (below) and outlet (side) flanges
  push(b, 'inlet flange', transformMesh(flangeRing(f, 0, D), multiply(translate(0, -CFin, 0), toY)));
  push(b, 'raised face', ringY(f.rfOD / 2, D / 2, -CFin - f.rfH, -CFin));
  push(b, 'outlet flange', flangeRing(fo, CFout - fo.tf, Do));
  push(b, 'raised face', ringZ(fo.rfOD / 2, Do / 2, CFout, CFout + fo.rfH));
  const yi = -(CFin - f.tf), zo = CFout - fo.tf;
  const outer = S.union(S.blend(k, S.cylY(D / 2 + tb, yi, 0), S.frustumY(D / 2 + 2 * tb, yi, D / 2 + tb, yi + f.hubLen), S.ellipsoid(0, 0.1 * D, 0, Rbowl + tb, Rbowl + tb, Rbowl + tb),
    S.cylZ(Do / 2 + tb, 0, zo), S.frustumZ(Do / 2 + tb, zo - fo.hubLen, Do / 2 + 2 * tb, zo), S.cylY(Rh + tb, 0.3 * D, yBody - fbj.tf)), S.rcylY(fbj.OD / 2, yBody - fbj.tf, yBody, edgeR(fbj.tf)));
  const cav = S.union(S.cylY(D / 2, yi - 1, 0.2 * D), S.ellipsoid(0, 0.1 * D, 0, Rbowl, Rbowl, Rbowl), S.cylZ(Do / 2, 0, zo + 1), S.cylY(Rh, 0.3 * D, yBody + 1));
  const x = Math.max(Rbowl + tb, fbj.OD / 2, Do / 2 + 2 * tb) + 0.5;
  castPart(b, 'body', S.subtract(outer, cav), [-x, yi - 0.1, -x], [x, yBody + 0.1, zo + 0.1], tb);
  push(b, 'nozzle', ringY(D / 2, dSeat / 2 - 0.05 * D, -Rbowl * 0.7, -0.2 * D), 'stem', BAR);
  push(b, 'disc', cylY(dSeat / 2 + 0.05 * D, -0.2 * D, -0.05 * D), 'closure', BAR);
  push(b, 'disc holder', revolveY([{ r: 0, z: -0.05 * D }, { r: dSeat / 2 + 0.05 * D, z: -0.05 * D }, { r: dSeat / 2 + 0.05 * D, z: 0.1 * D }, { r: dsp, z: 0.25 * D }, { r: 0, z: 0.25 * D }]), 'closure');
  push(b, 'bonnet gasket', ringY((fbj.gasketID + 2 * fbj.wg) / 2, fbj.gasketID / 2, yBody, yBody + fbj.gasketT), 'polymer', 'compressed sheet');
  const y0 = yBody + fbj.gasketT, yT = y0 + fbj.tf, yHouse = yT + sp.length + 2 * sp.dw + 1, rTop = Math.max(dsp + 0.9, 0.8 * (Rh + tb));
  const bon = S.subtract(S.union(S.rcylY(fbj.OD / 2, y0, yT, edgeR(fbj.tf)), S.blend(0.3, S.frustumY(Rh + tb + 0.3, yT - 0.05, rTop, yHouse), S.cylY(rTop, yHouse - 0.3, yHouse + tb))),
    S.frustumY(Rh, y0 - 1, Math.max(Rh * 0.8, dsp + 0.3), yHouse), S.cylY(dsp / 2 + 0.1, yHouse - 1, yHouse + tb + 1));
  castPart(b, 'bonnet', bon, [-fbj.OD / 2 - 0.3, y0 - 0.1, -fbj.OD / 2 - 0.3], [fbj.OD / 2 + 0.3, yHouse + tb + 0.2, fbj.OD / 2 + 0.3], tb);
  jointBolts(b, circlePts(fbj.BC / 2, fbj.n), fbj.d, yBody - fbj.tf, yT, 'bonnet bolts');
  push(b, 'spring', transformMesh(helixTube(sp.Dm / 2, sp.pitch, sp.turns, sp.dw / 2), multiply(translate(0, yT + 0.5, 0), toY)), 'stem', 'Grade 180 spring wire');
  push(b, 'spring plates', mergeMeshes([cylY(Math.min(Rh - 0.05, sp.Dm / 2 + sp.dw), yT + 0.25, yT + 0.5), cylY(Math.min(Rh * 0.8, sp.Dm / 2 + sp.dw), yT + 0.5 + sp.length, yT + 0.75 + sp.length)]), 'stem', BAR);
  push(b, `spindle ${dsp} in`, cylY(dsp / 2, 0.25 * D, yHouse + tb + 1.5 * dsp), 'stem', BAR);
  push(b, 'adjusting screw and lock nut', mergeMeshes([ringY(dsp + 0.1, dsp / 2 + 0.05, yHouse - 1, yHouse + tb + 1), hexPrismY(2 * dsp + 0.7, yHouse + tb, yHouse + tb + 0.5)]), 'stem', BAR);
  const yc = yHouse + tb + 0.5, hc = 1.5 * dsp + 1.5, rc = dsp + 0.9;
  castPart(b, 'cap', S.subtract(S.blend(0.2, S.cylY(rc, yc, yc + hc), S.sphere(0, yc + hc, 0, rc * 0.75)), S.cylY(rc - 0.2, yc - 1, yc + hc - 0.2)), [-rc - 0.3, yc - 0.1, -rc - 0.3], [rc + 0.3, yc + hc + rc, rc + 0.3], 0.2);
  const Ll = Math.max(4, 3 * rc), yp = yc + hc * 0.6;                                                            // F-9 lifting lever hanging 30° down
  push(b, 'lifting lever', transformMesh(box(0, -0.2, -0.3, Ll, 0.2, 0.3), multiply(translate(rc - 0.2, yp, 0), rotateZ(-Math.PI / 6))), 'operator');
  push(b, 'lever pivot', transformMesh(cylZ(0.18, -0.5, 0.5), translate(rc - 0.1, yp, 0)), 'stem', BAR);
  Object.assign(dims, { outlet: rule(outNPS, 'SW-VLV-PSV-1', 'Outlet size'), seatD: rule(dSeat, 'SW-VLV-PSV-1', 'Seat diameter'), setForce: rule(Fs, 'SW-VLV-PSV-1', 'Spring force at set pressure', 'lb'), wire: rule(sp.dw, 'SW-VLV-PSV-1', 'Spring wire diameter'), coilD: rule(sp.Dm, 'SW-VLV-PSV-1', 'Mean coil diameter'), spindle: rule(dsp, 'SW-VLV-PSV-1', 'Spindle diameter'), CFin: rule(CFin, 'SW-VLV-PSV-1', 'Inlet centre to face'), CFout: rule(CFout, 'SW-VLV-PSV-1', 'Outlet centre to face') });
  notes.push('Set pressure = class pressure (drawing); face-to-face reported as inlet plus outlet centre-to-face (SW-VLV-PSV-1).');
  return { c, op: { kind: 'none', rimForce: 0, T: 0 }, extra: { spring: sp, housing: fbj, outlet: outNPS } };
};

// ---- control valve (CV-1, F-9) ----------------------------------------------------------------------------
const buildControl: Build = (b, NPS, cls, dims, notes) => {
  const D0 = pipeDims(NPS, cls).D, c = common(NPS, cls, 1.5 * D0, 1.7 * D0), zi = c.F2F / 2 - c.f.tf;
  const { D, tb, P } = c;
  endFlanges(b, c);
  const { body, info } = globeBodySDF(c, zi), [mn, mx] = globeBox(info, zi, c);
  castPart(b, 'body', body, mn, mx, tb);
  const { Rn, fb, yB, yS } = info;
  push(b, 'seat ring', ringY(0.6 * D, D / 2, yS, yS + 0.1 * D), 'stem', BAR);
  const Fa = P * (Math.PI / 4) * (1.2 * D) ** 2 + 100 * Math.PI * 1.2 * D, st = risingStem(Fa, D);               // CV-1
  push(b, 'cage', ringY(0.7 * D, 0.6 * D, yS + 0.1 * D, yB - 0.05), 'stem', BAR);
  push(b, 'plug', mergeMeshes([cylY(0.6 * D - 0.02, yS + 0.1 * D, yS + 0.5 * D), cylY(st.ds, yS + 0.5 * D, yS + 0.6 * D)]), 'closure', BAR);
  push(b, 'bonnet gasket', ringY((fb.gasketID + 2 * fb.wg) / 2, fb.gasketID / 2, yB, yB + fb.gasketT), 'polymer', 'compressed sheet');
  const Da = roundUpTo(Math.sqrt((4 * Fa) / (Math.PI * 30)), 2), travel = D / 4, spr = springDesign(Fa / 6, travel);   // F-9: six springs
  const hc = Math.max(0.2 * Da, (spr.length + 0.5) / 0.866), y0 = yB + fb.gasketT, hb = 0.3 * D + 1, s = st.packing;
  const yBoxTop = y0 + fb.tf + hb + 7 * s, yAct = yBoxTop + 0.5 + travel + 2 * D + 2 + hc, ta = yokeTa(c), bossR = Math.max(1.25, 0.1 * Da);
  const bn = bonnetYoke(b, { ai: Rn, bi: Rn, aF: fb.OD / 2, bF: fb.OD / 2, y0, tfb: fb.tf, hb, st: { ...st }, tb, yoke: { yTop: yAct - hc - 1.2, headH: 1.2, bossR, ta } });
  jointBolts(b, circlePts(fb.BC / 2, fb.n), fb.d, yB - fb.tf, y0 + fb.tf, 'bonnet bolts');
  packingGland(b, st, bn.y1, bn.yBoxTop, bn.xg, bn.dg, 4);
  push(b, 'stem connector', box(-st.ds - 0.5, yBoxTop + 1, -st.ds - 0.5, st.ds + 0.5, yBoxTop + 2 + 2 * st.ds, st.ds + 0.5), 'stem', BAR);
  push(b, 'travel indicator and scale', box(st.ds + 0.5, yBoxTop + 1.4, -0.05, st.ds + 2.2, yBoxTop + 1.6, 0.05), 'stem', BAR);
  push(b, 'positioner', transformMesh(box(-4.5, 0, -2.5, 0, 6, 2.5), translate(-(bossR + ta + 2), yBoxTop + 1, 0)));
  push(b, `stem ${st.ds} in`, cylY(st.ds / 2, yS + 0.5 * D, yAct + 0.6), 'stem', BAR);
  // actuator: two shallow dished cases, rim flanges with bolts, diaphragm, plate, ring of six springs
  const dish = (y0d: number, up: 1 | -1, depth: number) => { const pts: { r: number; z: number }[] = []; for (let i = 0; i <= 12; i++) { const a = (Math.PI / 2) * (i / 12); pts.push({ r: (Da / 2) * Math.cos(a) + 0.01, z: y0d + up * depth * Math.sin(a) }); } for (let i = 12; i >= 0; i--) { const a = (Math.PI / 2) * (i / 12); pts.push({ r: Math.max(0.01, (Da / 2 - 0.2) * Math.cos(a)), z: y0d + up * (depth - 0.2) * Math.sin(a) }); } return revolveY(pts); };
  push(b, `actuator lower case ${Da} in`, dish(yAct, -1, hc));
  push(b, 'actuator upper case', dish(yAct + 0.4, 1, Math.max(0.15 * Da, 1.5)));
  push(b, 'diaphragm', cylY(Da / 2 + 0.6, yAct + 0.1, yAct + 0.3), 'polymer', 'polymer');
  const nb = Math.max(8, roundUpTo(Math.ceil((Math.PI * (Da + 0.8)) / 3), 4)), rb: MeshData[] = [];
  for (const [x, z] of circlePts((Da + 0.8) / 2, nb)) rb.push(hexPrismY(hexHardware(0.375).F, yAct - 0.25 - hexHardware(0.375).nutH, yAct - 0.25, x, z), hexPrismY(hexHardware(0.375).F, yAct + 0.65, yAct + 0.65 + hexHardware(0.375).H, x, z));
  push(b, 'case rim flanges', mergeMeshes([ringY(Da / 2 + 1.2, Da / 2 - 0.2, yAct - 0.25, yAct), ringY(Da / 2 + 1.2, Da / 2 - 0.2, yAct + 0.4, yAct + 0.65)]));
  push(b, `case bolts ${nb} × 3/8 in`, mergeMeshes(rb), 'hardware', 'Grade 90 bolt', nb);
  push(b, 'diaphragm plate', cylY(0.45 * Da, yAct + 0.3, yAct + 0.6), 'closure', BAR);
  const sps: MeshData[] = []; for (const [x, z] of circlePts(0.25 * Da, 6)) sps.push(transformMesh(helixTube(spr.Dm / 2, spr.pitch, spr.turns, spr.dw / 2), multiply(translate(x, yAct - 0.866 * hc + 0.25, z), toY)));   // floor of the dish at r = 0.25 Da
  push(b, 'actuator springs 6', mergeMeshes(sps), 'stem', 'Grade 180 spring wire', 6);
  push(b, 'air connection', cylY(0.3, yAct + 0.4 + Math.max(0.15 * Da, 1.5) - 0.3, yAct + 0.4 + Math.max(0.15 * Da, 1.5) + 0.6), 'stem', BAR);
  Object.assign(dims, { actuatorD: rule(Da, 'SW-VLV-CV-1', 'Actuator diaphragm case diameter'), actuatorF: rule(Fa, 'SW-VLV-CV-1', 'Actuator force', 'lb'), travel: rule(travel, 'SW-VLV-GL-1', 'Travel'), stemD: rule(st.ds, 'SW-VLV-5', 'Stem diameter'), wire: rule(spr.dw, 'SW-VLV-PSV-1', 'Actuator spring wire (each of six)'), caseDepth: rule(hc, 'SW-VLV-F-9', 'Lower case depth') });
  notes.push('Cage windows not cut (SW-VLV-CV-1); actuator on a 30 psi supply (drawing).');
  return { c, op: { kind: 'none', rimForce: 0, T: 0 }, extra: { actuator: { Da, Fa }, stem: st, spring: spr } };
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
