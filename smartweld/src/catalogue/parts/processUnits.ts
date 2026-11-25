/**
 * Process units, boiler equipment and storage tanks: DESIGN_BASIS.md §69 (SW-EQC-27..44). True-scale arrangements from
 * stated principal dimensions; the proportions are SmartWeld's own rules, written from reasoning, from no drawing,
 * licensor's design, standard or table (PROVENANCE P-74). Vertical items: z up from the base; horizontal: z along the axis, y up.
 */
import { drawing, rule, type Dim } from '../../core/basis';
import type { PartSpec } from '../part';
import { extrude, revolve, transformMesh, mergeMeshes, type MeshData, type Profile } from '../../geometry/mesh';
import { circle, rect, annularSector, type Polygon } from '../../geometry/polygon';
import { translate, multiply, rotateX, rotateY, rotateZ, frameFromAxes } from '../../geometry/transform';
import { wProfile, lProfile, hssRoundProfile, cProfile } from '../../geometry/profiles';
import { proportionW } from './wideFlange';
import { proportionC } from './channel';
import { pipeDims, designFlange, type PipeClass } from './pipe';
import { vesselSolids, shellRing, headLoop, makeVerticalVessel, N_REV, type VesselVInput } from './equipment';
import { sweep, boxMesh, orient, hexNut, boltingOf, arcPts, type V3 } from './detailKit';
import {
  done, cylZ, cylX, cylY, tube, at, flangeSolids, flangeLen, seriesUp, makeNozzle, makeManway, makeDavit, makeColumn, dressVessel, seamSolids, makeShellTubeExchanger, makeProcessPump, motorSolids,
  RADIAL, NOZZLE_UP, baseBolt, type Solid, type ColumnInput, type ShellTubeInput,
} from './equipmentKit';

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const N = 48;

// ---- shared parts ---------------------------------------------------------------------------------------------------
export const P_L3: Profile = { outer: lProfile(3, 3, 0.25) }, P_L4: Profile = { outer: lProfile(4, 4, 0.375) }, P_L6: Profile = { outer: lProfile(6, 6, 0.5) };
export const P_W14: Profile = { outer: wProfile(proportionW(14, 61)) }, P_W8: Profile = { outer: wProfile(proportionW(8, 24)) }, P_C6: Profile = { outer: cProfile(proportionC(6, 8.2)) };
/** a member of constant section from a to b; `up` turns the section's y */
export function member(a: V3, b: V3, prof: Profile, up: V3 = [0, 0, 1]): MeshData {
  const d = sub(b, a), L = Math.hypot(d[0], d[1], d[2]), z: V3 = [d[0] / L, d[1] / L, d[2] / L];
  let y: V3 = [up[0] - z[0] * dot(up, z), up[1] - z[1] * dot(up, z), up[2] - z[2] * dot(up, z)];
  if (Math.hypot(y[0], y[1], y[2]) < 1e-6) { const alt: V3 = [1, 0, 0]; y = [alt[0] - z[0] * dot(alt, z), alt[1] - z[1] * dot(alt, z), alt[2] - z[2] * dot(alt, z)]; }
  return orient(transformMesh(extrude(prof, L, 0), frameFromAxes(a, y, z)));
}
/** a tube swept along points: the outer surface and, turned inward, the bore, so the drawn metal is the wall (SW-EQ-7) */
export function hollowSweep(pts: V3[], r: number, wall: number, n = 8): MeshData {
  const o = sweep(pts, r, n), i = sweep(pts, r - wall, n), idx = [...i.indices]; for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
  return mergeMeshes([o, { positions: i.positions, indices: idx }]);
}
/** a pipe run of outside diameter OD through points; wall OD/14, at least 0.2 in */
export const pipeRun = (pts: V3[], OD: number, n = 12): MeshData => hollowSweep(pts, OD / 2, Math.min(OD / 4, Math.max(0.2, OD / 14)), n);
/** a hollow frustum (a cone section) about z: outer radii r0 at z0 and r1 at z1, wall t */
export const frustum = (r0: number, r1: number, z0: number, z1: number, t: number, n = 64): MeshData => orient(revolve([{ r: r0, z: z0 }, { r: r1, z: z1 }, { r: Math.max(r1 - t, 0.01), z: z1 }, { r: Math.max(r0 - t, 0.01), z: z0 }], n));
export const turn = (list: Solid[], th: number): Solid[] => list.map(s => ({ ...s, mesh: transformMesh(s.mesh, rotateZ(th)) }));
export const lift = (list: Solid[], x: number, y: number, z: number): Solid[] => list.map(s => ({ ...s, mesh: at(s.mesh, x, y, z) }));
export const partSolids = (p: PartSpec): Solid[] => p.extra!.solids as Solid[];

/** SW-EQC-28: a caged ladder on a vertical shell of outer radius R at angle th, from z0 to z1 and 42 in past it */
export function ladderSolids(R: number, th: number, z0: number, z1: number): Solid[] {
  const lx = R + 7, top = z1 + 42, rails: MeshData[] = [], rungs: MeshData[] = [], cage: MeshData[] = [];
  for (const y of [-8, 8]) rails.push(boxMesh(lx - 1.25, y - 0.1875, z0, lx + 1.25, y + 0.1875, top));
  for (let z = z0 + 12; z < top - 6; z += 12) rungs.push(sweep([[lx, -8, z], [lx, 8, z]], 0.375, 8));
  for (let z = z0 + 36; z < top; z += 72) rails.push(boxMesh(R - 0.1, -8.5, z, lx - 1.25, -7.5, z + 0.375), boxMesh(R - 0.1, 7.5, z, lx - 1.25, 8.5, z + 0.375));
  if (top - z0 > 100) {
    for (let z = z0 + 84; z <= top; z += 48) cage.push(at(extrude({ outer: annularSector(15, 15.1875, -2.0, 2.0, 24) }, 2, 0), lx + 3, 0, Math.min(z, top - 2)));
    for (const a of [-1.6, -0.8, 0, 0.8, 1.6]) cage.push(transformMesh(boxMesh(15.1875, -0.75, z0 + 84, 15.375, 0.75, top), multiply(translate(lx + 3, 0, 0), rotateZ(a))));
  }
  const out: Solid[] = [{ name: 'ladder rails and brackets', role: 'safety', mesh: mergeMeshes(rails) }, { name: 'ladder rungs RD3/4', role: 'safety', mesh: mergeMeshes(rungs) }];
  if (cage.length) out.push({ name: 'ladder cage', role: 'safety', mesh: mergeMeshes(cage) });
  return turn(out, th);
}

/** SW-EQC-27: a ring platform round a vertical shell of outer radius R with its floor at z, over the arc a0..a1 (radians, a1 > a0) */
export function ringPlatform(R: number, z: number, a0: number, a1: number, width = 36, endRails: [boolean, boolean] = [true, true]): Solid[] {
  const Rin = R + 1, Rout = Rin + width, two = 2 * Math.PI;
  const inside = (x: number, y: number) => { const r = Math.hypot(x, y); if (r < Rin || r > Rout) return false; let a = Math.atan2(y, x); while (a < a0) a += two; while (a - two >= a0) a -= two; return a <= a1; };
  const bars: MeshData[] = [], cross: MeshData[] = [];
  const scan = (fixed: number, alongX: boolean, emit: (s: number, e: number) => void) => { let start: number | null = null; for (let u = -Rout; u <= Rout + 0.5; u += 0.5) { const inn = alongX ? inside(u, fixed) : inside(fixed, u); if (inn && start === null) start = u; if (!inn && start !== null) { if (u - 0.5 - start > 1) emit(start, u - 0.5); start = null; } } };
  for (let y = -Rout + 0.75; y < Rout; y += 1.5) scan(y, true, (s, e) => bars.push(boxMesh(s, y - 3 / 32, z - 1.5, e, y + 3 / 32, z)));
  for (let x = -Rout + 2; x < Rout; x += 4) scan(x, false, (s, e) => cross.push(boxMesh(x - 0.125, s, z - 0.25, x + 0.125, e, z)));
  const out: Solid[] = [{ name: 'platform grating (SW-GR-1)', role: 'galv', mesh: mergeMeshes([...bars, ...cross]) }];
  const na = Math.max(8, Math.ceil(((a1 - a0) * Rout) / 12));
  out.push({ name: 'platform kerb PL1/4 and toe plate', role: 'steel', mesh: mergeMeshes([extrude({ outer: annularSector(Rout, Rout + 0.25, a0, a1, na) }, 6, z - 6), extrude({ outer: annularSector(Rout + 0.25, Rout + 0.4375, a0, a1, na) }, 4, z)]) });
  const nb = Math.ceil((a1 - a0) / ((40 * Math.PI) / 180)) + 1, frame: MeshData[] = [];
  for (let i = 0; i < nb; i++) {
    const a = a0 + ((a1 - a0) * i) / (nb - 1), c = Math.cos(a), s = Math.sin(a);
    frame.push(member([(R - 0.1) * c, (R - 0.1) * s, z - 4.6], [Rout * c, Rout * s, z - 4.6], P_L3), member([(Rout - 4) * c, (Rout - 4) * s, z - 5], [(R - 0.1) * c, (R - 0.1) * s, z - 5 - 0.75 * width], P_L3));
  }
  out.push({ name: 'platform bearers and knee braces L3x3x1/4', role: 'steel', mesh: mergeMeshes(frame) });
  const rr = Rout - 1.5, np = Math.max(2, Math.ceil(((a1 - a0) * rr) / 60) + 1), rail: MeshData[] = [];
  for (let i = 0; i < np; i++) { const a = a0 + ((a1 - a0) * i) / (np - 1); rail.push(cylZ(rr * Math.cos(a), rr * Math.sin(a), 0.95, z, z + 42, 10)); }
  const arc = (h: number) => arcPts([0, 0, z + h], [1, 0, 0], [0, 1, 0], rr, a0, a1, na);
  rail.push(sweep(arc(42), 0.95, 8), sweep(arc(21), 0.66, 8));
  [a0, a1].forEach((a, k) => { if (!endRails[k]) return; const c = Math.cos(a), s = Math.sin(a); rail.push(cylZ((Rin + 2) * c, (Rin + 2) * s, 0.95, z, z + 42, 10), sweep([[(Rin + 2) * c, (Rin + 2) * s, z + 42], [rr * c, rr * s, z + 42]], 0.95, 8), sweep([[(Rin + 2) * c, (Rin + 2) * s, z + 21], [rr * c, rr * s, z + 21]], 0.66, 8)); });
  out.push({ name: 'platform handrail (1-1/2 pipe, 42 in)', role: 'safety', mesh: mergeMeshes(rail) });
  return out;
}

/** SW-EQC-29: a square lattice tower about the z axis from half-width b0 at z0 to b1 at z1 */
export function latticeTower(b0: number, b1: number, z0: number, z1: number): MeshData {
  const parts: MeshData[] = [], levels: number[] = [z0]; let z = z0;
  while (z < z1 - 1) { const b = b0 + ((b1 - b0) * (z - z0)) / (z1 - z0); z = Math.min(z1, z + 2.4 * b); if (z1 - z < 0.6 * b) z = z1; levels.push(z); }
  const hb = (zz: number) => b0 + ((b1 - b0) * (zz - z0)) / (z1 - z0), corner = (i: number, zz: number): V3 => { const b = hb(zz); return [[b, b], [-b, b], [-b, -b], [b, -b]][i % 4].concat(zz) as V3; };
  for (let i = 0; i < 4; i++) parts.push(member(corner(i, z0), corner(i, z1), P_L6, [corner(i, z0)[0], corner(i, z0)[1], 0]));
  for (let k = 0; k < levels.length; k++) for (let i = 0; i < 4; i++) {
    if (k > 0) parts.push(member(corner(i, levels[k]), corner(i + 1, levels[k]), P_L4));
    if (k + 1 < levels.length) parts.push(member(corner(i, levels[k]), corner(i + 1, levels[k + 1]), P_L3), member(corner(i + 1, levels[k]), corner(i, levels[k + 1]), P_L3));
  }
  return mergeMeshes(parts);
}

/** SW-EQC-30: a straight-tube bundle along z: the stationary tubesheet's shell face at z = 0, tubes of length L from −ts to L − ts … */
export function bundleSolids(ID: number, L: number, d = 0.75): { solids: Solid[]; tubes: number; ts: number; spacing: number } {
  const p = 1.25 * d, Rl = ID / 2 - 0.75, ts = Math.max(1, ID / 12), wall = d / 9, tubes: MeshData[] = [], rowH = p * 0.8660254, m = Math.ceil(Rl / rowH), Lt = L - ts;
  for (let j = -m; j <= m; j++) { const y = j * rowH; for (let i = -Math.ceil(Rl / p) - 1; i <= Math.ceil(Rl / p) + 1; i++) { const x = i * p + (Math.abs(j) % 2 ? p / 2 : 0); if (Math.hypot(x, y) <= Rl - d / 2) tubes.push(extrude({ outer: circle(x, y, d / 2, 8), inner: circle(x, y, d / 2 - wall, 8) }, Lt + ts, -ts)); } }
  const spacing = Math.max(8, 0.4 * ID), nb = Math.max(1, Math.floor((Lt - spacing) / spacing)), Rb = ID / 2 - 0.125, baffles: MeshData[] = [];
  for (let k = 0; k < nb; k++) {
    const sgn = k % 2 ? -1 : 1, poly: Polygon = Array.from({ length: 41 }, (_, i) => { const a = (150 + (240 * i) / 40) * (Math.PI / 180); return { x: Rb * Math.cos(a), y: sgn * Rb * Math.sin(a) }; });
    baffles.push(orient(extrude({ outer: poly }, 0.25, spacing * (k + 1))));
  }
  const rods = [[0.3, 0.3], [-0.3, 0.3], [-0.3, -0.3], [0.3, -0.3]].map(([x, y]) => cylZ(x * ID, y * ID, 0.25, 0, spacing * nb + 0.25, 8));
  const Rf = ID / 2 - 0.25;
  const solids: Solid[] = [
    { name: `tubes (${tubes.length} × ${d}" on ${p}" triangular pitch)`, role: 'closure', mesh: mergeMeshes(tubes) }, { name: `baffles PL1/4 (${nb})`, role: 'steel', mesh: mergeMeshes(baffles) }, { name: 'tie rods RD1/2', role: 'steel', mesh: mergeMeshes(rods) },
    { name: 'floating tubesheet', role: 'closure', mesh: cylZ(0, 0, Rf, Lt, Lt + ts, 64) }, { name: 'floating head cover', role: 'steel', mesh: at(orient(revolve(headLoop(Rf, 0.375, 1), 48)), 0, 0, Lt + ts) },
  ];
  return { solids, tubes: tubes.length, ts, spacing };
}
/** SW-EQC-30 as an item: the bundle with its stationary tubesheet, as it is pulled from the shell */
export function makeTubeBundle(id: string, ID: number, L: number, d = 0.75): PartSpec {
  const b = bundleSolids(ID, L, d);
  return done(id, 'TUBE_BUNDLE', `Tube bundle for ${ID}" shell × ${(L / 12).toFixed(0)}', ${b.tubes} tubes`, {
    ID: drawing(ID, 'Shell inside diameter'), L: drawing(L, 'Tube length'), d: drawing(d, 'Tube outside diameter'), pitch: rule(1.25 * d, 'SW-EQC-30', 'Triangular pitch (1.25 d)'), tubes: rule(b.tubes, 'SW-EQC-30', 'Tubes within the limit circle', 'count'),
    tubesheet: rule(b.ts, 'SW-EQC-30', 'Tubesheet thickness (ID/12, min 1 in)'), baffleSpacing: rule(b.spacing, 'SW-EQC-30', 'Baffle spacing (0.4 ID, min 8 in)'), wall: rule(d / 9, 'SW-EQC-30', 'Tube wall (d/9)'),
  }, L, [{ name: 'stationary tubesheet', role: 'closure', mesh: cylZ(0, 0, ID / 2 + 1.5, -b.ts, 0, 64) }, ...b.solids], ['Baffle tube holes are not drawn (SW-EQC-30).']);
}
/** SW-EQC-31: the detailed shell-and-tube exchanger with its bundle in place; the shell side is cut in catalogue images */
export function makeBundleExchanger(inp: ShellTubeInput): PartSpec {
  const e = makeShellTubeExchanger(inp), b = bundleSolids(inp.ID, inp.TT - 2);
  const shellSide = (n: string) => /^(shell|rear head|channel|weld seams|shell flange|channel flange|channel cover|shell inlet|shell outlet|channel inlet|channel outlet|body flange studs|cover studs)/.test(n);
  const solids = [...partSolids(e).map(s => (shellSide(s.name) ? { ...s, cut: true } : s)), ...b.solids];
  return done(inp.tag, 'EXCHANGER', `${inp.tag} shell-and-tube exchanger ${inp.ID}" ID × ${inp.TT}" with tube bundle`, { ...e.dims, tubes: rule(b.tubes, 'SW-EQC-30', 'Tubes', 'count'), pitch: rule(0.9375, 'SW-EQC-30', 'Tube pitch (1.25 × 3/4 in)'), baffleSpacing: rule(b.spacing, 'SW-EQC-30', 'Baffle spacing') },
    e.length!.value, solids, ['Bundle by SW-EQC-30; catalogue images cut the shell and channel (SW-REN-10).'], { R: inp.ID / 2 + inp.t });
}

export interface PlatformedColumnInput extends ColumnInput { platformSpacing?: number; /** SW-EQC-32: the arc the platforms cover about the manways, in degrees (270 where not stated) */ platformArc?: number }
/** the platforms and ladders of a vertical vessel (SW-EQC-27/-28): floors at the listed elevations over 270° about angle 0 (or twice the stated half arc, radians), ladders alternating ends */
export function accessSolids(R: number, floors: number[], grade = 0, half = (135 * Math.PI) / 180): Solid[] {
  const out: Solid[] = [], off = half + 16 / (R + 7);
  floors.forEach((z, k) => {
    const side = k % 2 ? -1 : 1;   // the ladder up to this floor arrives at this end; the one above leaves from the other
    out.push(...ringPlatform(R, z, -half, half, 36, [side < 0, side > 0]).map(s => ({ ...s, name: `platform ${k + 1}: ${s.name}` })));
    out.push(...ladderSolids(R, side * off, k ? floors[k - 1] : grade, z).map(s => ({ ...s, name: `ladder ${k + 1}: ${s.name}` })));
  });
  return out;
}
/** SW-EQC-32: a column with platforms every 15 ft, ladders between them, a manway at each platform and a top platform */
export function makePlatformedColumn(inp: PlatformedColumnInput): PartSpec {
  const c = makeColumn(inp), R = inp.ID / 2 + inp.t, h = R / 2, zTL = inp.skirtH + h, zTop = zTL + inp.TT, sp = inp.platformSpacing ?? 180, floors: number[] = [];
  // the first floor serves the lowest manway; above it, floors at equal steps of no more than the spacing up to the top platform
  const first = zTL + 30 - 36, n = Math.max(1, Math.ceil((zTop - 6 - first) / sp)); floors.push(first);
  for (let i = 1; i <= n; i++) floors.push(first + ((zTop - 6 - first) * i) / n);
  const solids = [...partSolids(c), ...accessSolids(R, floors, 0, inp.platformArc === undefined ? undefined : (inp.platformArc * Math.PI) / 360)];
  floors.slice(1, -1).forEach((z, k) => { for (const s of partSolids(makeManway(`${inp.tag}-M${k + 2}`, { D: inp.ID < 48 ? 20 : 24, cls: 'P150', shellT: inp.t, shellR: R }))) solids.push({ ...s, name: `manway ${k + 2}: ${s.name}`, mesh: transformMesh(s.mesh, multiply(translate(R, 0, z + 36), RADIAL)) }); });
  return done(inp.tag, 'COLUMN', `${inp.tag} column ${inp.ID}" ID × ${inp.TT}" T/T with ${floors.length} platforms and ladders`, {
    ...c.dims, platforms: rule(floors.length, 'SW-EQC-32', 'Platforms (first manway level, then every 15 ft, and the top)', 'count'), spacing: inp.platformSpacing !== undefined ? drawing(sp, 'Platform spacing') : rule(sp, 'SW-EQC-28', 'Platform spacing (15 ft)'),
    platformW: rule(36, 'SW-EQC-27', 'Platform width'), handrail: rule(42, 'SW-EQC-27', 'Handrail height'), ...(inp.platformArc === undefined ? {} : { platformArc: drawing(inp.platformArc, 'Arc the platforms cover about the manways', 'deg') }),
  }, c.length!.value + 42, solids, ['Platforms by SW-EQC-27, ladders by SW-EQC-28; trays are data.'], { ...(c.extra ?? {}), floors });
}

// ---- placing parts on shells, access --------------------------------------------------------------------------------
export const named = (p: PartSpec, label: string, tr: (m: MeshData) => MeshData): Solid[] => partSolids(p).map(s => ({ ...s, name: `${label}: ${s.name}`, mesh: tr(s.mesh) }));
/** a nozzle or manway (its z its axis) on a vertical shell of outer radius R at angle th and height z, about the axis (cx, cy) */
export const onShell = (p: PartSpec, R: number, th: number, z: number, label: string, cx = 0, cy = 0): Solid[] => named(p, label, m => at(transformMesh(m, multiply(rotateZ(th), multiply(translate(R, 0, z), RADIAL))), cx, cy, 0));
export const pointUp = (p: PartSpec, x: number, y: number, z: number, label: string): Solid[] => named(p, label, m => at(m, x, y, z));
export const pointDown = (p: PartSpec, x: number, y: number, z: number, label: string): Solid[] => named(p, label, m => transformMesh(m, multiply(translate(x, y, z), rotateX(Math.PI))));
/** floors through the target elevations with no climb longer than 15 ft (SW-EQC-28) */
export function floorsThrough(targets: number[], from = 0): number[] {
  const out: number[] = []; let z = from;
  for (const t of targets) { const n = Math.max(1, Math.ceil((t - z) / 180)); for (let i = 1; i <= n; i++) out.push(z + ((t - z) * i) / n); z = t; }
  return out;
}
/** ladder runs with landings up one face of a square tower of half-width b about (cx, cy), the face at angle th, from z0 to z1 (SW-EQC-28) */
export function towerAccess(cx: number, cy: number, b: number, th: number, z0: number, z1: number): Solid[] {
  const fl = floorsThrough([z1], z0), out: Solid[] = [], land: MeshData[] = [];
  fl.forEach((z, k) => {
    out.push(...ladderSolids(b + 1, th + (k % 2 ? -1 : 1) * (14 / b), k ? fl[k - 1] : z0, z).map(q => ({ ...q, name: `tower ladder ${k + 1}: ${q.name}` })));
    land.push(transformMesh(mergeMeshes([boxMesh(b + 1, -30, z - 1.5, b + 37, 30, z), boxMesh(b + 36, -30, z, b + 36.25, 30, z + 4), cylZ(b + 35, -29, 0.95, z, z + 42, 8), cylZ(b + 35, 29, 0.95, z, z + 42, 8), sweep([[b + 35, -29, z + 42], [b + 35, 29, z + 42]], 0.95, 8), sweep([[b + 35, -29, z + 21], [b + 35, 29, z + 21]], 0.66, 8)]), rotateZ(th)));
  });
  out.push({ name: 'tower landings with handrail', role: 'safety', mesh: mergeMeshes(land) });
  return lift(out, cx, cy, 0);
}
/** a flat flange ring (the end of a duct or a large nozzle) about z at height z */
export const ringFlange = (r: number, z: number, w = 4, t = 1.5): MeshData => at(extrude({ outer: circle(0, 0, r + w, 64), inner: circle(0, 0, r - 0.5, 64) }, t, 0), 0, 0, z);
/** a rectangular plate rail: posts and two rails along a straight edge from a to b at floor height (z of a) */
export function straightRail(a: V3, b: V3): MeshData {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.ceil(L / 60) + 1), parts: MeshData[] = [];
  for (let i = 0; i < n; i++) { const t = i / (n - 1); parts.push(cylZ(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 0.95, a[2], a[2] + 42, 8)); }
  parts.push(sweep([[a[0], a[1], a[2] + 42], [b[0], b[1], a[2] + 42]], 0.95, 8), sweep([[a[0], a[1], a[2] + 21], [b[0], b[1], a[2] + 21]], 0.66, 8));
  return mergeMeshes(parts);
}

// ---- SW-EQC-33: cat cracker reactor and regenerator ------------------------------------------------------------------
export interface CatCrackerInput { tag: string; regenD: number; regenTT: number; reactorD: number; reactorTT: number; /** SW-EQC-33: stated where a plant sets its own connections on the item: the outside diameters of the flue gas outlet and of the air inlet line, drawn without flanges (the vapour outlet's stub not at all), and a grid the two vessels' centres and the riser stand on; and the side of the line of centres the riser stands on (1: the other side, the item's mirror image about that line in its riser, standpipes and slide valves) */ plant?: { flueOD: number; airOD: number; grid: number; riserSide?: 1 | -1; /** the direction the air inlet line leaves the regenerator in, an angle about its axis in place of 180° */ airAt?: number; /** the height above the base at which the air inlet line runs out level, in place of 0.25 Dg below the bottom head */ airZ?: number } }
export function makeCatCracker(inp: CatCrackerInput): PartSpec {
  const Dg = inp.regenD, Dr = inp.reactorD, t = 1, Rg = Dg / 2 + t, Rr = Dr / 2 + t, G = inp.plant?.grid, onG = (v: number) => (G ? Math.ceil(v / G - 1e-9) * G : v), X = onG(Rg + Rr + 0.6 * Dg), dS = 0.12 * Dg, dR = 0.15 * Dg, rs = 0.25 * Dr + t, T60 = Math.tan(Math.PI / 3), s: Solid[] = [];
  // the riser stands beside the stripper; the regenerated-catalyst standpipe runs to its foot no flatter than 60°
  const sd = inp.plant?.riserSide === 1 ? -1 : 1;   // 1: as drawn by default, the riser on the −y side; −1: mirrored
  const rx = X - 30, ry = -sd * onG(rs + dR / 2 + 6), phi = Math.atan2(ry, rx), g1: V3 = [Rg * Math.cos(phi), Rg * Math.sin(phi), 0], run1 = Math.hypot(rx - g1[0], ry - g1[1]);
  const Hs = Math.ceil(Math.max(120, 72 + T60 * run1 - Rg / 2 - 0.15 * inp.regenTT) / 12) * 12, zg0 = Hs + Rg / 2, zg1 = zg0 + inp.regenTT, zOut = zg0 + 0.15 * inp.regenTT, zW = zOut - T60 * run1;
  // regenerator
  s.push({ name: 'regenerator skirt', mesh: tube(Rg, 0.75, Hs + Rg / 4, 0) }, { name: 'regenerator base ring', mesh: at(extrude({ outer: circle(0, 0, Rg + 8, 64), inner: circle(0, 0, Rg - 0.75, 64) }, 1, 0), 0, 0, -1) },
    { name: 'regenerator bottom head', mesh: at(orient(revolve(headLoop(Rg, t, -1), 64)), 0, 0, zg0) }, { name: 'regenerator shell', mesh: at(shellRing(Rg, t, inp.regenTT), 0, 0, zg0) }, { name: 'regenerator weld seams', mesh: seamSolids(Rg, t, zg0, inp.regenTT) });
  const rf = inp.plant ? inp.plant.flueOD / 2 : 0.125 * Dg + t, zc = zg1 + (Rg - rf);
  s.push({ name: 'regenerator top cone', mesh: frustum(Rg, rf, zg1, zc, t) }); if (!inp.plant) s.push({ name: 'flue gas outlet', mesh: tube(rf, t, 24, zc) }, { name: 'flue gas outlet flange', mesh: ringFlange(rf, zc + 24) });
  const aA = inp.plant?.airAt, zAir = inp.plant?.airZ ?? zg0 - Rg / 2 - 0.25 * Dg, airEnd: V3 = aA === undefined ? [-(Rg + 36), 0, zAir] : [(Rg + 36) * Math.cos(aA), (Rg + 36) * Math.sin(aA), zAir];
  if (inp.plant?.airZ !== undefined && (zAir > zg0 - Rg / 2 - 24 - inp.plant.airOD / 2 - 6 || zAir < inp.plant.airOD / 2 + 12)) throw new Error(`${inp.tag}: the air inlet line cannot run out at ${zAir} in: it needs its bend and 6 in under the bottom head, at ${zg0 - Rg / 2} in, and a foot over the base (SW-EQC-33)`);
  s.push({ name: 'air inlet line', mesh: pipeRun([[0, 0, zg0 - Rg / 2 + 3], [0, 0, zAir], airEnd], inp.plant ? inp.plant.airOD : 0.2 * Dg, 24) }); if (!inp.plant) s.push({ name: 'air inlet flange', mesh: transformMesh(ringFlange(0.1 * Dg, 0), multiply(translate(-(Rg + 36), 0, zg0 - Rg / 2 - 0.25 * Dg), rotateY(-Math.PI / 2))) });
  const mwG = [zg0 + 42, zg1 - 54];
  for (const [k, z] of mwG.entries()) s.push(...onShell(makeManway(`${inp.tag}-RG-M${k + 1}`, { D: 24, cls: 'P150', shellT: t, shellR: Rg }), Rg, Math.PI, z, `regenerator manway ${k + 1}`));
  s.push(...turn(accessSolids(Rg, floorsThrough([mwG[0] - 36, mwG[1] - 36])), Math.PI).map(q => ({ ...q, name: `regenerator ${q.name}` })));
  // spent catalyst: stripper bottom → regenerator, no flatter than 60°
  const th2 = 0.5 * sd, g2: V3 = [Rg * Math.cos(th2), Rg * Math.sin(th2), zg0 + 0.3 * inp.regenTT], sb: V3 = [X, sd * rs * 0.5, 0], run2 = Math.hypot(sb[0] - g2[0], sb[1] - g2[1]);
  sb[2] = g2[2] + T60 * run2;
  const zs0 = sb[2] + (rs - dS / 2) * T60 * 0.6, zs1 = zs0 + 1.5 * Dr, zr0 = zs1 + (Rr - rs) * T60, zr1 = zr0 + inp.reactorTT;
  // reactor (disengager) and stripper, about (X, 0)
  const R: Solid[] = [
    { name: 'stripper bottom cone', mesh: frustum(dS / 2 + t, rs, sb[2] - 6, zs0, t) }, { name: 'stripper', mesh: at(shellRing(rs, t, zs1 - zs0), 0, 0, zs0) }, { name: 'reactor cone', mesh: frustum(rs, Rr, zs1, zr0, t) },
    { name: 'reactor shell', mesh: at(shellRing(Rr, t, inp.reactorTT), 0, 0, zr0) }, { name: 'reactor top head', mesh: at(orient(revolve(headLoop(Rr, t, 1), 64)), 0, 0, zr1) }, { name: 'reactor weld seams', mesh: seamSolids(Rr, t, zr0, inp.reactorTT) },
    ...(inp.plant ? [] : [{ name: 'vapour outlet', mesh: tube(0.1 * Dr + t, t, 30, zr1 + Rr / 2 - 4) }, { name: 'vapour outlet flange', mesh: ringFlange(0.1 * Dr + t, zr1 + Rr / 2 + 26) }]),
    ...onShell(makeManway(`${inp.tag}-RX-M1`, { D: 24, cls: 'P150', shellT: t, shellR: Rr }), Rr, 0, zr0 + 48, 'reactor manway'),
    ...onShell(makeManway(`${inp.tag}-ST-M1`, { D: 20, cls: 'P150', shellT: t, shellR: rs }), rs, 0, zs0 + 0.75 * Dr, 'stripper manway'),
  ];
  const fr = floorsThrough([zr1 - 6], zr0 + 12); fr.unshift(zr0 + 12);
  fr.forEach((z, k) => { R.push(...ringPlatform(Rr, z, -2.36, 2.36, 36, [k % 2 === 1, k % 2 === 0]).map(q => ({ ...q, name: `reactor platform ${k + 1}: ${q.name}` }))); if (k) R.push(...ladderSolids(Rr, (k % 2 ? -1 : 1) * (2.36 + 16 / (Rr + 7)), fr[k - 1], z).map(q => ({ ...q, name: `reactor ladder ${k}: ${q.name}` }))); });
  s.push(...lift(R, X, 0, 0));
  // the reactor's tower: a lattice with a ring of beams under the reactor shell, and ladders with landings up its far face
  const b = Rr + 18;
  s.push({ name: 'reactor tower (lattice, SW-EQC-29)', role: 'steel', mesh: at(latticeTower(b, b, 0, zr0), X, 0, 0) },
    { name: 'reactor support beams W14 and lugs', role: 'steel', mesh: at(mergeMeshes([...[0, 1, 2, 3].map(i => { const c: V3[] = [[b, b, zr0 - 7], [-b, b, zr0 - 7], [-b, -b, zr0 - 7], [b, -b, zr0 - 7]]; return member(c[i], c[(i + 1) % 4], P_W14); }), ...[0, 1, 2, 3].map(i => transformMesh(boxMesh(Rr - 0.5, -8, zr0, b + 6, 8, zr0 + 1.5), rotateZ((i * Math.PI) / 2))), ...[0, 1, 2, 3].flatMap(i => [-6, 6].map(y => transformMesh(boxMesh(Rr - 0.5, y - 0.375, zr0 + 1.5, b, y + 0.375, zr0 + 13.5), rotateZ((i * Math.PI) / 2))))]), X, 0, 0) },
    ...towerAccess(X, 0, b, 0, 0, zr0 + 12));
  // riser, standpipes and slide valves
  const zRe = zr0 + 0.25 * inp.reactorTT;
  s.push({ name: 'riser', mesh: at(tube(dR / 2 + 0.5, 0.5, zRe - zW + 2 * dR, zW - 2 * dR), rx, ry, 0) }, { name: 'riser bottom flange and lift nozzle', mesh: at(mergeMeshes([cylZ(0, 0, dR / 2 + 5, zW - 2 * dR - 2, zW - 2 * dR, 48), cylZ(0, 0, 3, zW - 2 * dR - 14, zW - 2 * dR - 2, 24)]), rx, ry, 0) },
    { name: 'riser guides', role: 'steel', mesh: mergeMeshes(floorsThrough([zr0 - 24], zW + 60).map(z => (sd > 0 ? boxMesh(rx - dR / 2 - 3, ry - dR / 2 - 3, z, rx + dR / 2 + 3, ry - dR / 2 + 1, z + 4) : boxMesh(rx - dR / 2 - 3, ry + dR / 2 - 1, z, rx + dR / 2 + 3, ry + dR / 2 + 3, z + 4)))) });
  const stand = (a: V3, bb: V3, label: string) => {
    const d = sub(bb, a), L = Math.hypot(d[0], d[1], d[2]), u: V3 = [d[0] / L, d[1] / L, d[2] / L], mid: V3 = [a[0] + d[0] * 0.5, a[1] + d[1] * 0.5, a[2] + d[2] * 0.5], hp: V3 = [(-sd * u[1]) / Math.hypot(u[0], u[1]), (sd * u[0]) / Math.hypot(u[0], u[1]), 0];
    const along = (o: V3, k: number): V3 => [o[0] + u[0] * k, o[1] + u[1] * k, o[2] + u[2] * k], side = (o: V3, k: number): V3 => [o[0] + hp[0] * k, o[1] + hp[1] * k, o[2] + hp[2] * k];
    s.push({ name: `${label} standpipe`, mesh: member(a, bb, { outer: circle(0, 0, dS / 2 + 0.5, 32), inner: circle(0, 0, dS / 2, 32) }) },
      { name: `${label} slide valve`, role: 'machine', mesh: mergeMeshes([member(along(mid, -1.25 * dS), along(mid, 1.25 * dS), { outer: rect(-0.8 * dS, -0.8 * dS, 0.8 * dS, 0.8 * dS) }), member(side(mid, 0.8 * dS), side(mid, 3 * dS), { outer: rect(-0.6 * dS, -0.4 * dS, 0.6 * dS, 0.4 * dS) }, u), member(side(mid, 3 * dS), side(mid, 5.5 * dS), { outer: circle(0, 0, 0.45 * dS, 24) })]) });
  };
  stand([g1[0], g1[1], zOut], [rx, ry, zW], 'regenerated catalyst'); stand([sb[0], sb[1], sb[2]], g2, 'spent catalyst');
  return done(inp.tag, 'PROCESS_UNIT', `${inp.tag} cat cracker: regenerator ${Dg}" × ${inp.regenTT}", reactor ${Dr}" × ${inp.reactorTT}"`, {
    regenD: drawing(Dg, 'Regenerator diameter'), regenTT: drawing(inp.regenTT, 'Regenerator tangent length'), reactorD: drawing(Dr, 'Reactor diameter'), reactorTT: drawing(inp.reactorTT, 'Reactor tangent length'),
    skirtH: rule(Hs, 'SW-EQC-33', 'Regenerator skirt height (the standpipe no flatter than 60°)'), stripperD: rule(0.5 * Dr, 'SW-EQC-33', 'Stripper diameter (0.5 Dr)'), stripperL: rule(1.5 * Dr, 'SW-EQC-33', 'Stripper length (1.5 Dr)'),
    riserD: rule(dR, 'SW-EQC-33', 'Riser diameter (0.15 Dg)'), standpipeD: rule(dS, 'SW-EQC-33', 'Standpipe diameter (0.12 Dg)'),
    ...(inp.plant ? { flueD: drawing(inp.plant.flueOD, 'Flue gas outlet outside diameter (stated)'), airD: drawing(inp.plant.airOD, 'Air inlet line outside diameter (stated)'), top: rule(zr1 + Rr / 2, 'SW-EQC-33', 'Top of the reactor\'s head') }
      : { flueD: rule(0.25 * Dg, 'SW-EQC-33', 'Flue gas outlet (0.25 Dg)'), vapourD: rule(0.2 * Dr, 'SW-EQC-33', 'Vapour outlet (0.2 Dr)'), top: rule(zr1 + Rr / 2 + 28, 'SW-EQC-33', 'Top of the vapour outlet') }),
    reactorBase: rule(zr0, 'SW-EQC-33', 'Reactor bottom tangent elevation'), centres: rule(X, 'SW-EQC-33', 'Regenerator to reactor centres'),
  }, zr1 + Rr / 2 + (inp.plant ? 0 : 28), s, ['Cyclones, grids and refractory lining are not drawn (SW-EQC-33).'], inp.plant ? { X, zg0, zr0, zAir, airEnd, zCone: zc, zHead: zr1 + Rr / 2, riser: [rx, ry], zWye: zW, towerHalf: Rr + 18 } : { X, zg0, zr0 });
}

// ---- SW-EQC-34: coke drums with their structure ---------------------------------------------------------------------
export interface CokeDrumsInput { tag: string; D: number; TT: number }
export function makeCokeDrums(inp: CokeDrumsInput): PartSpec {
  const D = inp.D, t = 1.25, R = D / 2 + t, rf = 0.125 * D, hc = (R - rf) * Math.tan(Math.PI / 3), zbf = 240, z0 = zbf + hc, z1 = z0 + inp.TT, zTable = z0 - 0.2 * D, zDeck = z1 + R / 2 + 36, S = D + 96, s: Solid[] = [];
  const xs = [-S / 2, S / 2], X1 = S / 2 + R + 30, Y1 = R + 30, cols: V3[] = [[-X1, -Y1, 0], [0, -Y1, 0], [X1, -Y1, 0], [-X1, Y1, 0], [0, Y1, 0], [X1, Y1, 0]];
  xs.forEach((x, k) => {
    const d: Solid[] = [{ name: 'cone', mesh: frustum(rf + t, R, zbf, z0, t) }, { name: 'shell', mesh: at(shellRing(R, t, inp.TT), 0, 0, z0) }, { name: 'top head', mesh: at(orient(revolve(headLoop(R, t, 1), 64)), 0, 0, z1) }, { name: 'weld seams', mesh: seamSolids(R, t, z0, inp.TT) },
      { name: 'skirt', mesh: tube(R, 1, z0 - zTable, zTable) }, { name: 'bottom flange', mesh: ringFlange(rf + t, zbf - 3, 6, 3) }, { name: 'bottom unheading cover', role: 'machine', mesh: cylZ(0, 0, rf + t + 6, zbf - 6, zbf - 3, 48) },
      { name: 'top neck', mesh: tube(rf + t, t, 30, z1 + R / 2 - 3) }, { name: 'top flange', mesh: ringFlange(rf + t, z1 + R / 2 + 27, 6, 3) }, { name: 'top head cover', role: 'machine', mesh: cylZ(0, 0, rf + t + 6, z1 + R / 2 + 30, z1 + R / 2 + 33, 48) },
      ...onShell(makeNozzle(`${inp.tag}-F${k}`, { NPS: seriesUp(0.05 * D), cls: 'P300', shellT: t }), (rf + R) / 2, -Math.PI / 2, zbf + hc / 2, 'feed inlet'),
      ...pointUp(makeNozzle(`${inp.tag}-V${k}`, { NPS: seriesUp(0.08 * D), cls: 'P300', shellT: t, projection: 14 }), 0, 0.55 * R, z1 + (R / 2) * Math.sqrt(1 - 0.55 * 0.55) - 2, 'vapour outlet')];
    s.push(...lift(d, x, 0, 0).map(q => ({ ...q, name: `drum ${k + 1} ${q.name}` })));
    s.push({ name: `derrick ${k + 1} (SW-EQC-29)`, role: 'steel', mesh: at(latticeTower(0.25 * D, 0.08 * D, zDeck, zDeck + 0.8 * inp.TT), x, 0, 0) }, { name: `derrick ${k + 1} crown platform`, role: 'galv', mesh: boxMesh(x - 0.12 * D, -0.12 * D, zDeck + 0.8 * inp.TT, x + 0.12 * D, 0.12 * D, zDeck + 0.8 * inp.TT + 1.5) },
      { name: `drill stem ${k + 1}`, role: 'stem', mesh: cylZ(x, 0, 3, z1 + R / 2 + 33, zDeck + 0.8 * inp.TT, 16) });
  });
  // the structure: six columns to the cutting deck, table beams under the skirts, girts and bracing, the deck open over each drum
  const frame: MeshData[] = cols.map(c => member(c, [c[0], c[1], zDeck - 14], P_W14, [1, 0, 0]));
  const levels = [zTable - 7, ...floorsThrough([zDeck - 7], zTable - 7).map(z => z)], beam = (a: V3, bb: V3) => frame.push(member(a, bb, P_W14));
  for (const z of levels) { for (const y of [-Y1, Y1]) { beam([-X1, y, z], [0, y, z]); beam([0, y, z], [X1, y, z]); } for (const x of [-X1, 0, X1]) beam([x, -Y1, z], [x, Y1, z]); }
  for (let k = 0; k + 1 < levels.length; k++) for (const x of [-X1, X1]) frame.push(member([x, -Y1, levels[k]], [x, Y1, levels[k + 1]], P_L4), member([x, Y1, levels[k]], [x, -Y1, levels[k + 1]], P_L4));
  frame.push(member([-X1, -Y1, 0], [0, -Y1, zTable - 7], P_L4), member([0, -Y1, 0], [-X1, -Y1, zTable - 7], P_L4), member([0, Y1, 0], [X1, Y1, zTable - 7], P_L4), member([X1, Y1, 0], [0, Y1, zTable - 7], P_L4));
  s.push({ name: 'structure: columns and beams W14, bracing L4x4x3/8', role: 'steel', mesh: mergeMeshes(frame) });
  const q = 0.22 * D, deck: MeshData[] = [boxMesh(-X1, -Y1, zDeck - 0.25, X1, -q, zDeck), boxMesh(-X1, q, zDeck - 0.25, X1, Y1, zDeck), boxMesh(-X1, -q, zDeck - 0.25, xs[0] - q, q, zDeck), boxMesh(xs[0] + q, -q, zDeck - 0.25, xs[1] - q, q, zDeck), boxMesh(xs[1] + q, -q, zDeck - 0.25, X1, q, zDeck)];
  s.push({ name: 'cutting deck PL1/4', role: 'galv', mesh: mergeMeshes(deck) }, { name: 'cutting deck handrail', role: 'safety', mesh: mergeMeshes([straightRail([-X1, -Y1, zDeck], [X1, -Y1, zDeck]), straightRail([X1, -Y1, zDeck], [X1, Y1, zDeck]), straightRail([X1, Y1, zDeck], [-X1, Y1, zDeck]), straightRail([-X1, Y1, zDeck], [-X1, -Y1 + 40, zDeck])]) });
  s.push(...towerAccess(0, 0, X1, Math.PI + Math.atan2(-Y1 + 18, X1) * 0 , 0, zDeck).map(q2 => ({ ...q2, mesh: at(q2.mesh, 0, -Y1 + 20, 0) })));
  return done(inp.tag, 'PROCESS_UNIT', `${inp.tag} coke drums, pair ${D}" × ${inp.TT}" with structure and derricks`, {
    D: drawing(D, 'Drum diameter'), TT: drawing(inp.TT, 'Drum tangent length'), flange: rule(0.25 * D, 'SW-EQC-34', 'Top and bottom flange (0.25 D)'), coneH: rule(hc, 'SW-EQC-34', 'Cone height (60°)'), bottomFlange: rule(zbf, 'SW-EQC-34', 'Bottom flange elevation'),
    table: rule(zTable, 'SW-EQC-34', 'Table elevation (skirt base)'), deck: rule(zDeck, 'SW-EQC-34', 'Cutting deck elevation'), derrick: rule(0.8 * inp.TT, 'SW-EQC-34', 'Derrick height (0.8 of the tangent length)'), centres: rule(S, 'SW-EQC-34', 'Drum centres (D + 8 ft)'),
  }, zDeck + 0.8 * inp.TT + 2, s, ['Unheading devices, drill stems\' drives and the coke pit are not drawn.'], { zDeck });
}

// ---- SW-EQC-43: stack; SW-EQC-35: flare stack -----------------------------------------------------------------------
/** a self-supporting steel stack about z from z0: optional flared base, rings, ladder with rest platforms, a platform at `platformAt`, a rain cap */
export function stackSolids(D: number, H: number, opts: { flare?: boolean; cap?: boolean; platformAt?: number; z0?: number; breeching?: boolean } = {}): Solid[] {
  const R = D / 2, z0 = opts.z0 ?? 0, zf = opts.flare === false ? z0 : z0 + H / 5, s: Solid[] = [];
  if (opts.flare !== false) {
    s.push({ name: 'stack flared base', mesh: frustum(0.75 * D, R, z0, zf, 0.375) }, { name: 'stack base ring', mesh: at(extrude({ outer: circle(0, 0, 0.75 * D + 6, 64), inner: circle(0, 0, 0.75 * D - 0.375, 64) }, 1, 0), 0, 0, z0 - 1) });
    const n = Math.max(8, Math.ceil((2 * Math.PI * 0.75 * D) / 30)), ch: MeshData[] = [], hw: MeshData[] = [];
    for (let i = 0; i < n; i++) { const rot = rotateZ((2 * Math.PI * (i + 0.5)) / n), r = 0.75 * D; ch.push(transformMesh(mergeMeshes([boxMesh(r - 1, -2, z0, r + 5.5, -1.625, z0 + 6), boxMesh(r - 1, 1.625, z0, r + 5.5, 2, z0 + 6), boxMesh(r - 1, -2.5, z0 + 6, r + 5.5, 2.5, z0 + 6.75)]), rot)); hw.push(transformMesh(mergeMeshes([cylZ(r + 3, 0, 0.5, z0 - 2, z0 + 8.4, 10), at(hexNut(1), r + 3, 0, z0 + 6.75)]), rot)); }
    s.push({ name: 'stack anchor chairs', mesh: mergeMeshes(ch) }, { name: 'stack anchor rods AR1', role: 'hardware', mesh: mergeMeshes(hw) });
  }
  s.push({ name: 'stack shell', mesh: tube(R, 0.3125, z0 + H - zf, zf) }, { name: 'stack stiffening rings', mesh: mergeMeshes(floorsThrough([z0 + H - 12], zf).filter((_, i, a) => i < a.length).map(z => at(extrude({ outer: circle(0, 0, R + 3, 64), inner: circle(0, 0, R, 64) }, 0.25, 0), 0, 0, z))) });
  if (opts.breeching) s.push({ name: 'breeching inlet', mesh: mergeMeshes([boxMesh(-0.4 * D, -R - 30, zf + 12, 0.4 * D, -R * 0.6, zf + 12 + 1.2 * D), boxMesh(-0.4 * D - 3, -R - 31, zf + 9, 0.4 * D + 3, -R - 30, zf + 15 + 1.2 * D)]) });
  if (opts.cap !== false) s.push({ name: 'rain cap', mesh: at(orient(revolve([{ r: 0, z: 0.35 * D }, { r: 0.75 * D, z: 0 }, { r: 0.75 * D, z: -0.1875 }, { r: 0, z: 0.35 * D - 0.1875 }], 48)), 0, 0, z0 + H + 0.5 * D) }, { name: 'rain cap posts', mesh: mergeMeshes([0, 1, 2, 3].map(i => transformMesh(boxMesh(R - 1, -1, z0 + H, R + 1, 1, z0 + H + 0.5 * D + 0.1 * D), rotateZ((i * Math.PI) / 2)))) });
  const zp = opts.platformAt ?? z0 + 0.8 * H, rests = floorsThrough([zp], zf === z0 ? z0 : z0).filter(() => true), fl: number[] = []; let last = z0;
  for (const z of floorsThrough([zp], z0)) { if (z - last >= 359 || z === zp) { fl.push(z); last = z; } }
  void rests;
  fl.forEach((z, k) => {
    const Rz = (zz: number) => (zz < zf ? 0.75 * D - ((0.75 * D - R) * (zz - z0)) / (zf - z0) : R), full = z === zp;
    s.push(...ringPlatform(Rz(z), z, full ? -2.36 : (k % 2 ? Math.PI - 0.9 : -0.3), full ? 2.36 : (k % 2 ? Math.PI + 0.3 : 0.9), full ? 36 : 30, full ? [k % 2 === 1, k % 2 === 0] : [true, true]).map(q => ({ ...q, name: `${full ? 'service' : 'rest'} platform ${k + 1}: ${q.name}` })));
    const zl = k ? fl[k - 1] : z0;
    s.push(...ladderSolids(Math.max(Rz(zl), Rz(z)), full ? (k % 2 ? -1 : 1) * (2.36 + 16 / (R + 7)) : (k % 2 ? Math.PI + 0.55 : 1.15), zl, z).map(q => ({ ...q, name: `ladder ${k + 1}: ${q.name}` })));
  });
  return s;
}
export function makeStack(id: string, D: number, H: number): PartSpec {
  return done(id, 'STACK', `Stack ${D}" dia × ${(H / 12).toFixed(0)}'`, { D: drawing(D, 'Diameter'), H: drawing(H, 'Height'), baseD: rule(1.5 * D, 'SW-EQC-43', 'Base diameter (1.5 D)'), flareH: rule(H / 5, 'SW-EQC-43', 'Flared base height (H/5)'), platform: rule(0.8 * H, 'SW-EQC-43', 'Sampling platform elevation (0.8 H)'), breeching: rule(1.2 * D, 'SW-EQC-43', 'Breeching inlet height (1.2 D)') },
    H + 0.9 * D, stackSolids(D, H, { breeching: true }), ['Ladder with rest platforms every 30 ft (SW-EQC-35, -43).']);
}
export interface FlareInput { tag: string; D: number; H: number; derrick?: boolean }
export function makeFlareStack(inp: FlareInput): PartSpec {
  const D = inp.D, H = inp.H, R = D / 2, zTip = H - 3 * D, zSeal1 = zTip - 0.5 * D, zSeal0 = zSeal1 - 3 * D, zSeal00 = zSeal0 - 0.5 * D, zf = inp.derrick ? 0 : H / 5, zPlat = zSeal00 - 60, s: Solid[] = [];
  // the riser with its rings, ladder, rest platforms and service platform; flared at the base, or straight inside a derrick
  s.push(...stackSolids(D, zSeal00, { cap: false, platformAt: zPlat, flare: !inp.derrick }).map(q => ({ ...q, name: q.name.replace(/^stack/, 'riser') })));
  if (inp.derrick) s.push({ name: 'derrick (lattice, SW-EQC-29)', role: 'steel', mesh: latticeTower(H / 8, 1.5 * D + 40, 0, zSeal00 - 24) },
    { name: 'riser guides', role: 'steel', mesh: mergeMeshes(floorsThrough([zSeal00 - 30], 60).filter((_, i) => i % 2 === 1).map(z => { const g = 1.5 * D + 40 + ((H / 8 - 1.5 * D - 40) * (zSeal00 - 24 - z)) / (zSeal00 - 24); return mergeMeshes([boxMesh(-g, -2, z, -R, 2, z + 4), boxMesh(R, -2, z, g, 2, z + 4), boxMesh(-2, -g, z, 2, -R, z + 4), boxMesh(-2, R, z, 2, g, z + 4)]); })) });
  s.push({ name: 'seal drum cones', mesh: mergeMeshes([frustum(R, D, zSeal00, zSeal0, 0.375), frustum(D, 0.6 * D, zSeal1, zTip, 0.375)]) }, { name: 'seal drum', mesh: tube(D, 0.375, 3 * D, zSeal0) },
    { name: 'flare tip', role: 'closure', mesh: tube(0.6 * D, 0.375, 3 * D, zTip) }, { name: 'tip flange', role: 'closure', mesh: ringFlange(0.6 * D, zTip + 6, 3, 1.5) }, { name: 'wind shield', role: 'closure', mesh: tube(0.8 * D, 0.1875, 1.5 * D, H - 1.5 * D) },
    { name: 'wind shield brackets', role: 'closure', mesh: mergeMeshes([0, 1, 2, 3, 4, 5].map(i => transformMesh(boxMesh(0.6 * D, -0.25, H - 1.2 * D, 0.8 * D, 0.25, H - 0.9 * D), rotateZ((i * Math.PI) / 3)))) });
  const pil: MeshData[] = [], lines: MeshData[] = [];
  for (let i = 0; i < 3; i++) { const a = 0.5 + (i * 2 * Math.PI) / 3, c = Math.cos(a), sn = Math.sin(a), rp = 0.8 * D + 3; pil.push(pipeRun([[rp * c, rp * sn, zTip - 6], [rp * c, rp * sn, H + 4], [(rp - 4) * c, (rp - 4) * sn, H + 8]], 2.375, 10)); lines.push(pipeRun([[rp * c, rp * sn, zTip - 6], [(D + 2) * c, (D + 2) * sn, zSeal1 - 2], [(D + 2) * c, (D + 2) * sn, zSeal0 + 2], [(R + 2.5) * c, (R + 2.5) * sn, zSeal00 - 4], [(R + 2.5) * c, (R + 2.5) * sn, Math.max(zf + 24, 48)]], 1.315, 8)); }
  s.push({ name: 'pilots (3 × 2 in)', role: 'closure', mesh: mergeMeshes(pil) }, { name: 'pilot gas and ignition lines', role: 'closure', mesh: mergeMeshes(lines) });
  for (const q of partSolids(makeNozzle(`${inp.tag}-in`, { NPS: seriesUp(Math.min(D, 48)), cls: 'P150', shellT: 0.375, shellR: inp.derrick ? R : undefined }))) s.push({ ...q, name: `flare header inlet: ${q.name}`, mesh: transformMesh(q.mesh, multiply(rotateZ(Math.PI), multiply(translate(inp.derrick ? R : 0.6 * D, 0, inp.derrick ? 72 : Math.min(zf * 0.5, 96)), RADIAL))) });
  return done(inp.tag, 'FLARE', `${inp.tag} flare stack ${D}" × ${(H / 12).toFixed(0)}', ${inp.derrick ? 'derrick supported' : 'self-supporting'}`, {
    D: drawing(D, 'Riser diameter'), H: drawing(H, 'Height to the tip'), sealD: rule(2 * D, 'SW-EQC-35', 'Seal drum diameter (2 D)'), sealL: rule(3 * D, 'SW-EQC-35', 'Seal drum length (3 D)'), tipD: rule(1.2 * D, 'SW-EQC-35', 'Tip diameter (1.2 D)'),
    shieldD: rule(1.6 * D, 'SW-EQC-35', 'Wind shield diameter (1.6 D)'), pilots: rule(3, 'SW-EQC-35', 'Pilots', 'count'), platform: rule(zPlat, 'SW-EQC-35', 'Service platform elevation'), ...(inp.derrick ? {} : { baseD: rule(1.5 * D, 'SW-EQC-35', 'Flared base diameter'), flareH: rule(zf, 'SW-EQC-35', 'Flared base height') }),
  }, H + 8, s, ['The knock-out and seal drums at grade are separate vessels of the catalogue.'], { zTip });
}

// ---- SW-EQC-36: wet scrubber tower ----------------------------------------------------------------------------------
export interface ScrubberInput { tag: string; D: number; H: number; /** SW-EQC-36: a stated outside diameter for the gas inlet duct, which is then drawn level and without its flange, for a plant's own nozzle on its end */ inlet?: { OD: number }; /** SW-EQC-36: the angle about the tower at which the pumps, their riser and the spray nozzles stand, in place of 90° */ pumpsAt?: number }
export function makeWetScrubber(inp: ScrubberInput): PartSpec {
  const D = inp.D, H = inp.H, t = 0.375, R = D / 2 + t, zIn = 0.2 * H + 0.3 * D, rs = 0.25 * D + t, zc = H + (R - rs), thR = inp.pumpsAt ?? Math.PI / 2, rr = R + 16, s: Solid[] = [];
  s.push({ name: 'base plate', mesh: cylZ(0, 0, R + 5, 0, 0.75, 64) }, { name: 'shell', mesh: tube(R, t, H - 0.75, 0.75) }, { name: 'weld seams', mesh: seamSolids(R, t, 0.75, H - 0.75) },
    { name: 'anchor lugs', mesh: mergeMeshes(Array.from({ length: 8 }, (_, i) => transformMesh(mergeMeshes([boxMesh(R - 0.1, -2, 0.75, R + 4.5, -1.625, 6.75), boxMesh(R - 0.1, 1.625, 0.75, R + 4.5, 2, 6.75)]), rotateZ((i + 0.5) * (Math.PI / 4))))) },
    { name: 'anchor bolts', role: 'hardware', mesh: mergeMeshes(Array.from({ length: 8 }, (_, i) => transformMesh(mergeMeshes([cylZ(R + 3, 0, 0.375, -1, 3, 10), at(hexNut(0.75), R + 3, 0, 0.75)]), rotateZ((i + 0.5) * (Math.PI / 4))))) },
    { name: 'top cone', mesh: frustum(R, rs, H, zc, t) }, { name: 'outlet stack', mesh: tube(rs, t, D, zc) }, { name: 'outlet flange', mesh: ringFlange(rs, zc + D) });
  const o: V3 = [R + 0.8 * D, 0, zIn + 0.14 * D], i0: V3 = [R - 3, 0, inp.inlet ? o[2] : zIn], u: V3 = [(i0[0] - o[0]), 0, (i0[2] - o[2])], ul = Math.hypot(u[0], u[2]);
  if (inp.inlet) s.push({ name: 'gas inlet duct', mesh: member(o, i0, { outer: circle(0, 0, inp.inlet.OD / 2, 48), inner: circle(0, 0, inp.inlet.OD / 2 - 0.25, 48) }) });
  else s.push({ name: 'gas inlet duct', mesh: member(o, i0, { outer: circle(0, 0, 0.25 * D + 0.25, 48), inner: circle(0, 0, 0.25 * D, 48) }) }, { name: 'gas inlet flange', mesh: member(o, [o[0] + (u[0] / ul) * 1.5, 0, o[2] + (u[2] / ul) * 1.5], { outer: circle(0, 0, 0.25 * D + 4, 48), inner: circle(0, 0, 0.25 * D, 48) }) });
  const zs = [0, 1, 2].map(k => zIn + 0.4 * D + k * 0.12 * H), zWash = 0.8 * H - 14;
  s.push({ name: 'mist eliminator support rings', mesh: mergeMeshes([0.8 * H, 0.8 * H + 24].map(z => at(extrude({ outer: circle(0, 0, R + 3, 64), inner: circle(0, 0, R, 64) }, 0.5, 0), 0, 0, z))) });
  // recirculation pumps facing the tower, their discharge riser, and a flanged feed to each spray level and the wash header
  const pump = makeProcessPump({ tag: `${inp.tag}-P`, suctionNPS: 6, dischargeNPS: 4, cls: 'P150', impellerD: 12, motorD: 12 }), cyP = pump.dims.shaftY.value, df = pump.extra!.dischargeFace as number[];
  let zR = 0;
  for (const [k, th] of [thR - 0.4, thR + 0.4].entries()) {
    const c = Math.cos(th), sn = Math.sin(th), ox = (R + 34) * c, oy = (R + 34) * sn, M = [-sn, c, 0, 0, 0, 0, 1, 0, c, sn, 0, 0, ox, oy, 0, 1];
    s.push(...partSolids(pump).map(q => ({ ...q, name: `recirculation pump ${k + 1}: ${q.name}`, mesh: transformMesh(q.mesh, M) })));
    s.push({ name: `pump ${k + 1} suction line`, mesh: pipeRun([[(R - 1) * c, (R - 1) * sn, cyP], [ox, oy, cyP]], 6.625) });
    const w: V3 = [ox + df[0] * -sn + df[2] * c, oy + df[0] * c + df[2] * sn, df[1]]; zR = w[2] + 20;
    s.push({ name: `pump ${k + 1} discharge line`, mesh: pipeRun([w, [w[0], w[1], zR], [rr * Math.cos(thR), rr * Math.sin(thR), zR]], 4.5) });
  }
  s.push({ name: 'recirculation riser 6 in', mesh: at(tube(3.3125, 0.28, zWash + 10 - zR + 3, zR - 3), rr * Math.cos(thR), rr * Math.sin(thR), 0) });
  [...zs, zWash].forEach((z, k) => {
    const wash = k === 3;
    s.push(...onShell(makeNozzle(`${inp.tag}-S${k + 1}`, { NPS: wash ? 2 : 4, cls: 'P150', shellT: t, shellR: R }), R, thR, z, wash ? 'wash header nozzle' : `spray level ${k + 1} nozzle`));
    s.push({ name: wash ? 'wash header feed' : `spray level ${k + 1} feed`, mesh: pipeRun([[(R + 8) * Math.cos(thR), (R + 8) * Math.sin(thR), z], [rr * Math.cos(thR), rr * Math.sin(thR), z]], wash ? 2.375 : 4.5) });
  });
  const floors = [zs[0] - 30, zs[2] - 30, 0.8 * H - 6];
  s.push(...onShell(makeManway(`${inp.tag}-M0`, { D: 24, cls: 'P150', shellT: t, shellR: R }), R, Math.PI, 0.1 * H, 'sump manway'));
  floors.forEach((z, k) => s.push(...onShell(makeManway(`${inp.tag}-M${k + 1}`, { D: 24, cls: 'P150', shellT: t, shellR: R }), R, Math.PI, z + 36, k === 2 ? 'eliminator manway' : 'spray section manway')));
  s.push(...turn(accessSolids(R, floorsThrough(floors)), Math.PI));
  return done(inp.tag, 'SCRUBBER', `${inp.tag} wet scrubber tower ${D}" × ${(H / 12).toFixed(0)}'`, {
    D: drawing(D, 'Tower diameter'), H: drawing(H, 'Shell height'), sump: rule(0.2 * H, 'SW-EQC-36', 'Sump depth (0.2 H)'), inlet: inp.inlet ? drawing(inp.inlet.OD, 'Gas inlet duct outside diameter (stated)') : rule(0.5 * D, 'SW-EQC-36', 'Gas inlet duct (0.5 D)'), outlet: rule(0.5 * D, 'SW-EQC-36', 'Outlet stack (0.5 D)'),
    sprayLevels: rule(3, 'SW-EQC-36', 'Spray levels', 'count'), eliminator: rule(0.8 * H, 'SW-EQC-36', 'Mist eliminator from (0.8 H)'), pumps: rule(2, 'SW-EQC-36', 'Recirculation pumps', 'count'),
  }, zc + D + 2, s, ['Spray headers, packing and the eliminator are inside and not drawn; their nozzles and feeds are (SW-EQC-36).'], inp.inlet ? { zInlet: o[2] } : undefined);
}

// ---- drums, the flue gas cooler, the boiler (SW-EQC-37..42) ------------------------------------------------------------
/** two saddles' worth of one saddle: web to the shell's underside, ribs, base and wear plate, for a z-axis shell of outer radius R with its base at y = −cl */
export function saddleSolids(R: number, cl: number, zs: number, sw: number): Solid[] {
  const xr = 0.9 * R, yArc = (x: number) => -Math.sqrt(Math.max((R + 0.5) ** 2 - x * x, 0));
  const web: Polygon = [{ x: -xr, y: -cl + 0.5 }, { x: xr, y: -cl + 0.5 }, ...Array.from({ length: 25 }, (_, i) => { const x = xr - (2 * xr * i) / 24; return { x, y: yArc(x) }; })];
  return [{ name: 'saddle web PL1/2', role: 'steel', mesh: at(extrude({ outer: web }, 0.5, 0), 0, 0, zs - 0.25) }, { name: 'saddle base PL1/2', role: 'steel', mesh: boxMesh(-xr - 2, -cl, zs - sw / 2, xr + 2, -cl + 0.5, zs + sw / 2) },
    { name: 'saddle wear plate', role: 'steel', mesh: at(extrude({ outer: annularSector(R, R + 0.5, Math.PI * (1 + 1 / 6), Math.PI * (2 - 1 / 6), 32) }, sw + 4, 0), 0, 0, zs - sw / 2 - 2) },
    { name: 'saddle ribs PL3/8', role: 'steel', mesh: mergeMeshes([-0.6 * R, 0, 0.6 * R].map(x => boxMesh(x - 0.1875, -cl + 0.5, zs - sw / 2, x + 0.1875, yArc(x) - 0.01, zs + sw / 2))) },
    { name: 'saddle anchor bolts', role: 'hardware', mesh: mergeMeshes([-xr, xr].map(x => baseBolt(x, -cl + 0.5, zs + sw / 2 - 1.5, 0.75))) }];
}
const NOZZLE_DOWN_Z = [0, 0, 1, 0, -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 1];
export const upOn = (p: PartSpec, R: number, z: number, label: string, y0 = 0): Solid[] => named(p, label, m => transformMesh(m, multiply(translate(0, y0 + R, z), NOZZLE_UP)));
export const downOn = (p: PartSpec, R: number, z: number, label: string, y0 = 0): Solid[] => named(p, label, m => transformMesh(m, multiply(translate(0, y0 - R, z), NOZZLE_DOWN_Z)));
/** a horizontal drum along z from 0 to L (tangent lines) with 2:1 heads */
export const drumBody = (R: number, t: number, L: number): Solid[] => [{ name: 'shell', mesh: shellRing(R, t, L) }, { name: 'head', mesh: orient(revolve(headLoop(R, t, -1), 64)) }, { name: 'head', mesh: at(orient(revolve(headLoop(R, t, 1), 64)), 0, 0, L) }, { name: 'weld seams', mesh: seamSolids(R, t, 0, L) }];
/** SW-EQC-38: an elliptical manway 12 × 16 in on a head's apex at z (cover, yoke and stud), facing dir (±1 along z) */
function headManway(z: number, dir: 1 | -1): Solid[] {
  const ell: Polygon = Array.from({ length: 32 }, (_, i) => ({ x: 8.5 * Math.cos((2 * Math.PI * i) / 32), y: 6.5 * Math.sin((2 * Math.PI * i) / 32) })), z0 = dir > 0 ? z - 1 : z - 0.5;
  return [{ name: 'manway cover 12 × 16', mesh: extrude({ outer: ell }, 1.5, z0) }, { name: 'manway yoke and stud', role: 'hardware', mesh: mergeMeshes([boxMesh(-10, -1, dir > 0 ? z + 0.5 : z - 2, 10, 1, dir > 0 ? z + 2 : z - 0.5), cylZ(0, 0, 0.5, dir > 0 ? z + 0.5 : z - 4, dir > 0 ? z + 4 : z - 0.5, 10)]) }];
}
export interface DrumInput { tag: string; ID: number; L: number; saddles?: boolean; /** a stated wall in place of the proportion (§72) */ t?: number }
/** SW-EQC-38: the steam drum's solids (z along the drum, y up) */
export function steamDrumSolids(inp: DrumInput): { solids: Solid[]; R: number; t: number } {
  const t = inp.t ?? Math.max(1, Math.ceil((inp.ID / 48) * 8) / 8), R = inp.ID / 2 + t, L = inp.L, s: Solid[] = [...drumBody(R, t, L)];
  s.push(...headManway(-R / 2, -1), ...headManway(L + R / 2, 1));
  s.push(...upOn(makeNozzle(`${inp.tag}-ST`, { NPS: seriesUp(Math.max(4, inp.ID / 7)), cls: 'P600', shellT: t, shellR: R }), R, L / 2, 'steam outlet'));
  for (const [k, f] of [0.3, 0.7].entries()) s.push(...upOn(makeNozzle(`${inp.tag}-SV${k}`, { NPS: 4, cls: 'P600', shellT: t, shellR: R, projection: 10 }), R, f * L, `safety valve nozzle ${k + 1}`));
  s.push(...upOn(makeNozzle(`${inp.tag}-FW`, { NPS: 4, cls: 'P600', shellT: t, shellR: R }), R, 0.12 * L, 'feedwater nozzle'), ...downOn(makeNozzle(`${inp.tag}-BD`, { NPS: 2, cls: 'P600', shellT: t, shellR: R }), R, 0.5 * L, 'continuous blowdown'));
  for (const [k, f] of [0.1, 0.9].entries()) s.push(...downOn(makeNozzle(`${inp.tag}-DC${k}`, { NPS: 8, cls: 'P600', shellT: t, shellR: R, projection: 10 }), R, f * L, `downcomer nozzle ${k + 1}`));
  const stubs: MeshData[] = [];
  for (const a of [-0.87, 0.87]) for (let z = 24; z <= L - 24; z += 6) stubs.push(sweep([[(R - 0.5) * Math.sin(a), (R - 0.5) * Math.cos(a), z], [(R + 6) * Math.sin(a), (R + 6) * Math.cos(a), z]], 1.75, 8));
  s.push({ name: `riser stubs (${stubs.length} × 3-1/2 in)`, role: 'closure', mesh: mergeMeshes(stubs) });
  s.push({ name: 'water gauge column', role: 'closure', mesh: mergeMeshes([cylZ(0.45 * R, 7, 0.66, -R / 2 - 6, -R / 2 + 4, 10), cylZ(0.45 * R, -7, 0.66, -R / 2 - 6, -R / 2 + 4, 10), cylY(0.45 * R, -R / 2 - 6, 1.19, -11, 11, 12)]) });
  if (inp.saddles !== false) for (const f of [0.2, 0.8]) s.push(...saddleSolids(R, R + 18, f * L, Math.max(6, inp.ID / 3)));
  return { solids: s, R, t };
}
export function makeSteamDrum(inp: DrumInput): PartSpec {
  const d = steamDrumSolids(inp);
  return done(inp.tag, 'DRUM', `${inp.tag} steam drum ${inp.ID}" ID × ${(inp.L / 12).toFixed(0)}'`, { ID: drawing(inp.ID, 'Inside diameter'), L: drawing(inp.L, 'Tangent length'), t: rule(d.t, 'SW-EQC-38', 'Shell thickness (ID/48, min 1 in)'), manway: rule(16, 'SW-EQC-38', 'Elliptical manway 12 × 16'), outlet: rule(seriesUp(Math.max(4, inp.ID / 7)), 'SW-EQC-38', 'Steam outlet (ID/7, to the series)') },
    inp.L + d.R, d.solids, ['Internals (separators, baffles) are not drawn.']);
}
/** SW-EQC-39: the mud drum's solids (z along the drum, y up) */
export function mudDrumSolids(inp: DrumInput): { solids: Solid[]; R: number; t: number } {
  const t = Math.max(1, Math.ceil((inp.ID / 48) * 8) / 8), R = inp.ID / 2 + t, L = inp.L, s: Solid[] = [...drumBody(R, t, L), ...headManway(L + R / 2, 1)];
  for (const [k, f] of [0.2, 0.8].entries()) s.push(...downOn(makeNozzle(`${inp.tag}-BD${k}`, { NPS: 2, cls: 'P600', shellT: t, shellR: R }), R, f * L, `blowdown nozzle ${k + 1}`));
  const stubs: MeshData[] = [];
  for (const a of [-0.5, 0, 0.5]) for (let z = 24; z <= L - 24; z += 6) stubs.push(sweep([[(R - 0.5) * Math.sin(a), (R - 0.5) * Math.cos(a), z], [(R + 6) * Math.sin(a), (R + 6) * Math.cos(a), z]], 1, 8));
  s.push({ name: `tube stubs (${stubs.length} × 2 in)`, role: 'closure', mesh: mergeMeshes(stubs) });
  if (inp.saddles !== false) for (const f of [0.2, 0.8]) s.push(...saddleSolids(R, R + 18, f * L, Math.max(6, inp.ID / 3)));
  return { solids: s, R, t };
}
export function makeMudDrum(inp: DrumInput): PartSpec {
  const d = mudDrumSolids(inp);
  return done(inp.tag, 'DRUM', `${inp.tag} mud drum ${inp.ID}" ID × ${(inp.L / 12).toFixed(0)}'`, { ID: drawing(inp.ID, 'Inside diameter'), L: drawing(inp.L, 'Tangent length'), t: rule(d.t, 'SW-EQC-39', 'Shell thickness (ID/48, min 1 in)') }, inp.L + d.R, d.solids);
}

export interface FlueGasCoolerInput { tag: string; D: number; L: number; /** a stated shell wall in place of the fixed 3/4 in (§72) */ t?: number; /** a stated wall for its steam drum */ drumT?: number; /** SW-EQC-37: stated outside diameters for the gas ducts in place of half the shell's, and the ducts left without their flanges where a plant's own nozzle is to stand on them */ ducts?: { inletOD?: number; outletOD?: number; plain?: ('inlet' | 'outlet')[] } }
/** SW-EQC-37: a horizontal fire-tube flue gas cooler with its steam drum; z along the shell from the inlet tubesheet, y up */
export function makeFlueGasCooler(inp: FlueGasCoolerInput): PartSpec {
  const D = inp.D, L = inp.L, t = inp.t ?? 0.75, R = D / 2 + t, ts = 2, barrel = 0.33 * D, rd = 0.25 * D, coneL = (R - rd - t) / Math.tan(Math.PI / 6), cl = R + 36, s: Solid[] = [];
  s.push({ name: 'shell', cut: true, mesh: shellRing(R, t, L) }, { name: 'weld seams', cut: true, mesh: seamSolids(R, t, 0, L) }, { name: 'tubesheets', role: 'closure', mesh: mergeMeshes([cylZ(0, 0, R + 2, -ts, 0, 64), cylZ(0, 0, R + 2, L, L + ts, 64)]) });
  const tubes: MeshData[] = [], p = 2.5, Rl = D / 2 - 2, rowH = p * 0.8660254;
  for (let j = -Math.ceil(Rl / rowH); j <= Math.ceil(Rl / rowH); j++) for (let i = -Math.ceil(Rl / p) - 1; i <= Math.ceil(Rl / p) + 1; i++) { const x = i * p + (Math.abs(j) % 2 ? p / 2 : 0), y = j * rowH; if (Math.hypot(x, y) <= Rl - 1) tubes.push(extrude({ outer: circle(x, y, 1, 8), inner: circle(x, y, 0.85, 8) }, L + 2 * ts, -ts)); }
  s.push({ name: `fire tubes (${tubes.length} × 2 in on 2-1/2 in pitch)`, role: 'closure', mesh: mergeMeshes(tubes) });
  for (const [k, dir] of ([-1, 1] as const).entries()) {
    const label = dir < 0 ? 'inlet' : 'outlet', od = dir < 0 ? inp.ducts?.inletOD : inp.ducts?.outletOD, rk = od === undefined ? rd : od / 2 - t, ck = od === undefined ? coneL : (R - rk - t) / Math.tan(Math.PI / 6);
    const zb0 = dir < 0 ? -ts - barrel : L + ts, zc0 = dir < 0 ? zb0 - ck : zb0 + barrel;
    s.push({ name: `${label} channel`, cut: true, mesh: at(shellRing(R, t, barrel), 0, 0, zb0) }, { name: `${label} cone`, cut: true, mesh: dir < 0 ? frustum(rk + t, R, zc0, zb0, t) : frustum(R, rk + t, zc0, zc0 + ck, t) },
      { name: `${label} duct`, cut: true, mesh: tube(rk + t, t, 12, dir < 0 ? zc0 - 12 : zc0 + ck) });
    if (!inp.ducts?.plain?.includes(label)) s.push({ name: `${label} duct flange`, mesh: ringFlange(rk + t, dir < 0 ? zc0 - 13.5 : zc0 + ck + 12) });
    s.push(...upOn(makeManway(`${inp.tag}-CM${k}`, { D: 20, cls: 'P150', shellT: t, shellR: R }), R, zb0 + barrel / 2, `${label} channel manway`));
  }
  for (const f of [0.2, 0.8]) s.push(...saddleSolids(R, cl, f * L, Math.max(6, D / 3)));
  const drum = steamDrumSolids({ tag: `${inp.tag}-SD`, ID: 0.6 * D, L: 0.8 * L, saddles: false, t: inp.drumT }), Rd = drum.R, yd = R + 30 + Rd;
  s.push(...drum.solids.filter(q => !/riser stubs|downcomer nozzle|continuous blowdown/.test(q.name)).map(q => ({ ...q, name: `steam drum ${q.name}`, mesh: at(q.mesh, 0, yd, 0.1 * L) })));
  s.push({ name: 'steam drum pedestals', role: 'steel', mesh: mergeMeshes([0.3 * L, 0.7 * L].map(z => boxMesh(-0.4 * Rd, Math.sqrt(R * R - (0.4 * Rd) ** 2) - 0.5, z - 3, 0.4 * Rd, yd - Math.sqrt(Rd * Rd - (0.4 * Rd) ** 2) + 0.5, z + 3))) });
  s.push({ name: 'risers (4 × 6 in)', mesh: mergeMeshes([0.2, 0.4, 0.6, 0.8].map((f, i) => cylY((i % 2 ? 1 : -1) * 0.25 * Rd, f * L, 3.3125, R - 1, yd - Rd + 2, 16))) });
  s.push({ name: 'downcomers (2 × 8 in)', mesh: mergeMeshes([0.14 * L, 0.86 * L].map(z => pipeRun([[0.7 * Rd, yd - 0.7 * Rd, z], [R + 14, yd - Rd - 12, z], [R + 14, -0.45 * R, z], [0.88 * R, -0.45 * R, z]], 8.625, 14))) });
  s.push(...downOn(makeNozzle(`${inp.tag}-BD`, { NPS: 2, cls: 'P300', shellT: t, shellR: R }), R, 0.5 * L, 'shell blowdown'));
  return done(inp.tag, 'EXCHANGER', `${inp.tag} flue gas cooler ${D}" × ${(L / 12).toFixed(0)}' with steam drum`, {
    D: drawing(D, 'Shell inside diameter'), L: drawing(L, 'Shell length between tubesheets'), ...(inp.t ? { t: drawing(t, 'Shell thickness (stated)') } : {}), duct: rule(0.5 * D, 'SW-EQC-37', 'Gas duct diameter (0.5 D)'), coneL: rule(coneL, 'SW-EQC-37', 'Channel cone length (30°)'),
    tubes: rule(tubes.length, 'SW-EQC-37', 'Fire tubes 2 in on 2-1/2 in pitch', 'count'), drumD: rule(0.6 * D, 'SW-EQC-37', 'Steam drum diameter (0.6 D)'), drumL: rule(0.8 * L, 'SW-EQC-37', 'Steam drum length (0.8 L)'), risers: rule(4, 'SW-EQC-37', 'Risers 6 in', 'count'), downcomers: rule(2, 'SW-EQC-37', 'Downcomers 8 in', 'count'),
  }, L + 2 * (ts + barrel + coneL + 14), s, ['Refractory in the inlet channel and the tube ferrules are not drawn; catalogue images cut the shell and channels.'], { yd });
}

/** SW-EQC-42: a burner; z = 0 at the furnace wall, the windbox outside (+z), the throat through the wall; y up */
export function burnerSolids(d: number): Solid[] {
  return [{ name: 'windbox PL1/4', role: 'steel', mesh: mergeMeshes([extrude({ outer: rect(-d, -d, d, d), inner: rect(-d + 0.25, -d + 0.25, d - 0.25, d - 0.25) }, d - 0.25, 0), boxMesh(-d, -d, d - 0.25, d, d, d)]) }, { name: 'register throat', role: 'closure', mesh: tube(d / 2, 0.5, 0.5 * d, -0.5 * d) }, { name: 'front plate', role: 'machine', mesh: cylZ(0, 0, 0.7 * d, d, d + 1, 48) },
    { name: 'gas ring 2 in', role: 'safety', mesh: mergeMeshes([at(sweep(Array.from({ length: 32 }, (_, i) => [0.55 * d * Math.cos((2 * Math.PI * i) / 32), 0.55 * d * Math.sin((2 * Math.PI * i) / 32), 0] as V3), 1.19, 8, true), 0, 0, d + 4), cylY(0, d + 4, 1.19, -1.6 * d, -0.55 * d, 10), ...[0, 1, 2, 3].map(i => cylZ(0.55 * d * Math.cos(i * 1.5708 + 0.785), 0.55 * d * Math.sin(i * 1.5708 + 0.785), 0.5, d + 1, d + 4, 8))]) },
    { name: 'gas inlet flange', role: 'safety', mesh: transformMesh(ringFlange(1.19, 0, 2, 0.75), multiply(translate(0, -1.6 * d, d + 4), rotateX(Math.PI / 2))) },
    { name: 'oil gun and igniter', role: 'closure', mesh: mergeMeshes([cylZ(0, 0, 1.5, d + 1, d + 18, 12), cylZ(0.25 * d, 0.2 * d, 0.75, d + 1, d + 10, 10)]) }, { name: 'sight port', role: 'closure', mesh: at(tube(1.5, 0.2, 5, d + 1), -0.3 * d, 0.3 * d, 0) },
    { name: 'air duct stub', role: 'steel', mesh: mergeMeshes([extrude({ outer: rect(-0.5 * d, 0.1 * d, 0.5 * d, 0.9 * d), inner: rect(-0.5 * d + 0.1875, 0.1 * d + 0.1875, 0.5 * d - 0.1875, 0.9 * d - 0.1875) }, 0.8 * d, 0)].map(m => transformMesh(m, multiply(translate(0, d, 0), rotateX(-Math.PI / 2))))) }];
}
export function makeBurner(id: string, d: number): PartSpec {
  return done(id, 'BURNER', `Burner, ${d}" throat`, { d: drawing(d, 'Throat diameter'), windbox: rule(2 * d, 'SW-EQC-42', 'Windbox square (2 d)'), depth: rule(d, 'SW-EQC-42', 'Windbox depth (d)'), gasRing: rule(2, 'SW-EQC-42', 'Gas ring pipe size') }, 1.5 * d + 18, burnerSolids(d));
}
/** SW-EQC-41: an economizer; z up from its gas inlet flange, tubes along x */
export function economizerSolids(a: number, b: number, h: number): { solids: Solid[]; tubes: number } {
  const tubes: MeshData[] = [];
  for (let y = -b / 2 + 4; y <= b / 2 - 4; y += 4) for (let z = 6; z <= h - 6; z += 4) tubes.push(hollowSweep([[-a / 2 - 3, y, z], [a / 2 + 3, y, z]], 1, 0.22, 6));
  const solids: Solid[] = [{ name: 'casing PL3/16', cut: true, mesh: extrude({ outer: rect(-a / 2, -b / 2, a / 2, b / 2), inner: rect(-a / 2 + 0.1875, -b / 2 + 0.1875, a / 2 - 0.1875, b / 2 - 0.1875) }, h, 0) },
    { name: `coil tubes (${tubes.length} × 2 in at 4 in)`, role: 'closure', mesh: mergeMeshes(tubes) },
    { name: 'return bend boxes', cut: true, mesh: mergeMeshes([extrude({ outer: rect(a / 2, -b / 2, a / 2 + 8, b / 2), inner: rect(a / 2 + 0.1875, -b / 2 + 0.1875, a / 2 + 7.8125, b / 2 - 0.1875) }, h, 0), extrude({ outer: rect(-a / 2 - 8, -b / 2, -a / 2, b / 2), inner: rect(-a / 2 - 7.8125, -b / 2 + 0.1875, -a / 2 - 0.1875, b / 2 - 0.1875) }, h, 0)]) },
    { name: 'gas flanges L3x3', mesh: mergeMeshes([0, h - 0.25].map(z => extrude({ outer: rect(-a / 2 - 3, -b / 2 - 3, a / 2 + 3, b / 2 + 3), inner: rect(-a / 2, -b / 2, a / 2, b / 2) }, 0.25, z))) },
    { name: 'water headers 6 in', mesh: mergeMeshes([8, h - 8].map(z => pipeRun([[a / 2 + 12, -b / 2 - 4, z], [a / 2 + 12, b / 2 + 10, z]], 6.625, 14))) },
    { name: 'header flanges', mesh: mergeMeshes([8, h - 8].map(z => transformMesh(ringFlange(3.3125, 0, 2.5, 1), multiply(translate(a / 2 + 12, b / 2 + 10, z), rotateX(-Math.PI / 2))))) }];
  return { solids, tubes: tubes.length };
}
export function makeEconomizer(id: string, a: number, b: number, h: number): PartSpec {
  const e = economizerSolids(a, b, h);
  return done(id, 'ECONOMIZER', `Economizer ${a}" × ${b}" × ${h}"`, { a: drawing(a, 'Casing width (tube length)'), b: drawing(b, 'Casing depth'), h: drawing(h, 'Casing height'), tubes: rule(e.tubes, 'SW-EQC-41', 'Coil tubes 2 in at 4 in pitch', 'count'), headers: rule(6, 'SW-EQC-41', 'Header size') }, h, e.solids, ['Return bends are inside the end boxes and not drawn.']);
}

export interface BoilerInput { tag: string; steamID: number; L: number; centres: number; stackD?: number; stackH?: number; /** a stated wall for the steam drum in place of the proportion (§72) */ drumT?: number }
/** SW-EQC-40: a two-drum water-tube boiler; drums along y, z up from grade, the furnace on +x */
export function makeWaterTubeBoiler(inp: BoilerInput): PartSpec {
  const L = inp.L, C = inp.centres, sd = steamDrumSolids({ tag: `${inp.tag}-SD`, ID: inp.steamID, L, saddles: false, t: inp.drumT }), md = mudDrumSolids({ tag: `${inp.tag}-MD`, ID: 0.65 * inp.steamID, L, saddles: false });
  const Rs = sd.R, Rm = md.R, zm = Rm + 36, zs = zm + C, Wf = 0.9 * C, zr = zs + 0.25 * Rs, zf = zm - 8, xb = -(Rs + 30), s: Solid[] = [];
  const DY = [-1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1];   // a drum built along z with y up, laid along y with z up
  s.push(...sd.solids.filter(q => !/riser stubs|downcomer nozzle/.test(q.name)).map(q => ({ ...q, name: `steam drum ${q.name}`, mesh: at(transformMesh(q.mesh, DY), 0, 0, zs) })), ...md.solids.filter(q => !/tube stubs/.test(q.name)).map(q => ({ ...q, name: `mud drum ${q.name}`, mesh: at(transformMesh(q.mesh, DY), 0, 0, zm) })));
  s.push({ name: 'mud drum supports', role: 'steel', mesh: mergeMeshes([0.2 * L, 0.8 * L].map(y => boxMesh(-0.6 * Rm, y - 4, 0, 0.6 * Rm, y + 4, zm - 0.8 * Rm))) });
  const bank: MeshData[] = [], walls: MeshData[] = [], ys: number[] = []; for (let y = 20; y <= L - 20; y += 4) ys.push(y);
  for (const y of ys) {
    for (let j = 0; j < 8; j++) { const a = ((-35 + 10 * j) * Math.PI) / 180; bank.push(hollowSweep([[Rm * Math.sin(a), y, zm + Rm * Math.cos(a)], [Rs * Math.sin(a), y, zs - Rs * Math.cos(a)]], 1, 0.22, 6)); }
    walls.push(hollowSweep([[Rm - 0.5, y, zm], [Wf, y, zm], [Wf, y, zr], [0.968 * Rs - 0.5, y, zr]], 1.5, 0.3, 6));
  }
  s.push({ name: `generating bank (${bank.length} × 2 in tubes)`, role: 'closure', mesh: mergeMeshes(bank) }, { name: `furnace water walls (${walls.length} × 3 in tubes)`, role: 'closure', mesh: mergeMeshes(walls) });
  s.push({ name: 'downcomers (2 × 8 in)', mesh: mergeMeshes([5, L - 5].map(y => member([-0.72 * Rs, y, zs - 0.69 * Rs], [-0.72 * Rm, y, zm + 0.69 * Rm], { outer: circle(0, 0, 4.3125, 20), inner: circle(0, 0, 4, 20) }))) });
  const pl = 0.1875, casing: MeshData[] = [boxMesh(Wf + 4, 12, zf, Wf + 4 + pl, L - 12, zr + 4), boxMesh(xb - pl, 12, zf, xb, L - 12, zs), boxMesh(0.9 * Rs, 12, zr + 4, Wf + 4 + pl, L - 12, zr + 4 + pl), boxMesh(xb, 12, zs - pl, -0.9 * Rs, L - 12, zs),
    boxMesh(xb, 12, zf - pl, Wf + 4, L - 12, zf), boxMesh(xb, 12 - pl, zf, Wf + 4, 12, zr + 4), boxMesh(xb, L - 12, zf, Wf + 4, L - 12 + pl, zr + 4)];
  s.push({ name: 'casing PL3/16', cut: true, mesh: mergeMeshes(casing) });
  const stays: MeshData[] = []; for (let z = zf + 24; z < zr; z += 48) stays.push(member([Wf + 4 + pl, 12, z], [Wf + 4 + pl, L - 12, z], P_C6, [1, 0, 0]), member([xb - pl, L - 12, z], [xb - pl, 12, z], P_C6, [-1, 0, 0]), member([xb, 12 - pl, z], [Wf + 4, 12 - pl, z], P_C6, [0, -1, 0]), member([Wf + 4, L - 12 + pl, z], [xb, L - 12 + pl, z], P_C6, [0, 1, 0]));
  s.push({ name: 'buckstays C6', role: 'steel', cut: true, mesh: mergeMeshes(stays) });
  const bd = Math.min(30, 0.2 * C);
  for (const [k, f] of [0.3, 0.7].entries()) s.push(...burnerSolids(bd).map(q => ({ ...q, cut: true, name: `burner ${k + 1}: ${q.name}`, mesh: transformMesh(q.mesh, [1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0.55 * Wf, 12 - pl, zm + f * C, 1]) })));
  s.push({ name: 'superheater headers 8 in', mesh: mergeMeshes([0.35, 0.6].map(f => pipeRun([[f * Wf, 20, zr + 16], [f * Wf, L - 20, zr + 16]], 8.625, 14))) }, { name: 'superheater header supports', role: 'steel', mesh: mergeMeshes([0.35, 0.6].flatMap(f => [0.25 * L, 0.75 * L].map(y => boxMesh(f * Wf - 3, y - 1, zr + 4, f * Wf + 3, y + 1, zr + 12)))) });
  s.push(...pointUp(makeNozzle(`${inp.tag}-SH`, { NPS: 8, cls: 'P600', shellT: 0.5 }), 0.6 * Wf, L / 2, zr + 20, 'superheated steam outlet'));
  // gas outlet duct, economizer and stack on the bank side at the far end
  const ea = 60, eb = 72, eh = 96, ex = xb - 36 - ea / 2, ey = L - 12 - eb / 2, ez = zm, eco = economizerSolids(ea, eb, eh), sD = inp.stackD ?? 36, sH = inp.stackH ?? 600;
  s.push({ name: 'gas outlet duct', cut: true, mesh: mergeMeshes([boxMesh(xb - 36, L - 12 - eb, zf, xb, L - 12, zf + pl), boxMesh(xb - 36, L - 12 - eb, ez - 8, xb, L - 12, ez - 8 + pl), boxMesh(xb - 36, L - 12 - eb, zf, xb, L - 12 - eb + pl, ez - 8), boxMesh(xb - 36, L - 12 - pl, zf, xb, L - 12, ez - 8), boxMesh(xb - 36 - ea, L - 12 - eb, zf, xb - 36, L - 12, zf + pl), boxMesh(xb - 36 - ea - pl, L - 12 - eb, zf, xb - 36 - ea, L - 12, ez), boxMesh(xb - 36 - ea, L - 12 - eb, zf, xb - 36, L - 12 - eb + pl, ez), boxMesh(xb - 36 - ea, L - 12 - pl, zf, xb - 36, L - 12, ez)]) });
  s.push(...lift(eco.solids, ex, ey, ez).map(q => ({ ...q, name: `economizer ${q.name}` })), { name: 'stack transition', cut: true, mesh: at(frustum(Math.min(ea, eb) / 2, sD / 2, 0, 30, pl), ex, ey, ez + eh) }, ...lift(stackSolids(sD, sH, { flare: false, z0: 0, platformAt: 0.8 * sH }).filter(q => !/ladder 1:|platform 1:/.test(q.name) || true), ex, ey, ez + eh + 30).map(q => ({ ...q, name: `stack ${q.name.replace(/^stack /, '')}` })));
  // access to the steam drum: a walkway on the bank roof with a handrail, ladders with landings from grade
  s.push({ name: 'drum walkway grating', role: 'galv', mesh: boxMesh(xb, 14, zs, -Rs - 2, L - 14, zs + 1.5) }, { name: 'drum walkway handrail', role: 'safety', mesh: mergeMeshes([straightRail([xb + 1.5, 14, zs + 1.5], [xb + 1.5, L / 2 - 20, zs + 1.5]), straightRail([xb + 1.5, L / 2 + 20, zs + 1.5], [xb + 1.5, L - 14, zs + 1.5])]) },
    ...towerAccess(0, L / 2, -xb, Math.PI, 0, zs + 1.5));
  return done(inp.tag, 'BOILER', `${inp.tag} water-tube boiler, two drums ${inp.steamID}" × ${(L / 12).toFixed(0)}' at ${C}" centres`, {
    steamID: drawing(inp.steamID, 'Steam drum inside diameter'), L: drawing(L, 'Drum length'), centres: drawing(C, 'Drum centres'), mudID: rule(0.65 * inp.steamID, 'SW-EQC-39', 'Mud drum diameter (0.65 of the steam drum)'),
    bank: rule(bank.length, 'SW-EQC-40', 'Generating tubes 2 in, 8 rows at 4 in', 'count'), walls: rule(walls.length, 'SW-EQC-40', 'Water-wall tubes 3 in at 4 in', 'count'), furnaceW: rule(Wf, 'SW-EQC-40', 'Furnace width (0.9 of the centres)'),
    burners: rule(2, 'SW-EQC-40', 'Burners', 'count'), burnerD: rule(bd, 'SW-EQC-42', 'Burner throat'), stackD: inp.stackD !== undefined ? drawing(sD, 'Stack diameter') : rule(sD, 'SW-EQC-40', 'Stack diameter'), stackH: inp.stackH !== undefined ? drawing(sH, 'Stack height') : rule(sH, 'SW-EQC-40', 'Stack height'),
  }, ez + eh + 30 + sH, s, ['Refractory, insulation, superheater coils and sootblowers are not drawn; catalogue images cut the casing (SW-EQC-40).'], { zs, zm });
}

// ---- SW-EQC-44: above-ground storage tanks -----------------------------------------------------------------------------
/** a spiral stair round a tank shell of outer radius R from z0 to z1, starting at angle a0 and rising anticlockwise */
export function spiralStair(R: number, z0: number, z1: number, a0: number): { solids: Solid[]; aEnd: number } {
  const n = Math.ceil((z1 - z0) / 8), rise = (z1 - z0) / n, rIn = R + 3, rOut = R + 33, dth = 10 / (R + 18), treads: MeshData[] = [], str: MeshData[] = [], rail: MeshData[] = [], brk: MeshData[] = [], top: V3[] = [];
  for (let k = 0; k < n; k++) {
    const a = a0 + (k + 0.5) * dth, z = z0 + (k + 1) * rise;
    treads.push(transformMesh(boxMesh(rIn, -5, z - 1.25, rOut, 5, z), rotateZ(a)));
    for (const r of [rIn, rOut]) { const seg = Math.hypot(r * dth, rise) * 1.03, phi = Math.atan2(rise, r * dth); str.push(transformMesh(boxMesh(-0.1875, -seg / 2, -4.5, 0.1875, seg / 2, 4.5), multiply(rotateZ(a), multiply(translate(r, 0, z - rise / 2 - 1.5), rotateX(phi))))); }
    if (k % 3 === 0) rail.push(transformMesh(cylZ(rOut - 1, 0, 0.95, z, z + 42, 8), rotateZ(a)));
    if (k % 4 === 0) brk.push(transformMesh(boxMesh(R - 0.1, -0.25, z - 7, rIn, 0.25, z - 1.25), rotateZ(a)));
    top.push([(rOut - 1) * Math.cos(a), (rOut - 1) * Math.sin(a), z + 42]);
  }
  rail.push(sweep(top, 0.95, 8), sweep(top.map(q => [q[0], q[1], q[2] - 21] as V3), 0.66, 8));
  return { aEnd: a0 + n * dth, solids: [{ name: `stair treads (${n}, rise ${rise.toFixed(2)} in)`, role: 'galv', mesh: mergeMeshes(treads) }, { name: 'stair stringers PL3/8', role: 'steel', mesh: mergeMeshes(str) }, { name: 'stair brackets', role: 'steel', mesh: mergeMeshes(brk) }, { name: 'stair handrail', role: 'safety', mesh: mergeMeshes(rail) }] };
}
/** a tank shell's seams: a ring at every course joint (96 in courses) and vertical seams about 30 ft apart, staggered course to course */
function tankSeams(R: number, t: number, z0: number, H: number): MeshData {
  const wc = 2 * t + 0.25, parts: MeshData[] = [], nv = Math.max(3, Math.ceil((2 * Math.PI * R) / 360)), courses = Math.ceil(H / 96);
  for (let k = 1; k < courses; k++) parts.push(orient(revolve([{ r: R - 0.02, z: z0 + 96 * k - wc / 2 }, { r: R, z: z0 + 96 * k - wc / 2 }, { r: R + 0.125, z: z0 + 96 * k - wc / 4 }, { r: R + 0.125, z: z0 + 96 * k + wc / 4 }, { r: R, z: z0 + 96 * k + wc / 2 }, { r: R - 0.02, z: z0 + 96 * k + wc / 2 }], 96)));
  for (let k = 0; k < courses; k++) for (let i = 0; i < nv; i++) parts.push(transformMesh(boxMesh(R - 0.02, -wc / 2, z0 + 96 * k + (k ? wc / 2 : 0), R + 0.125, wc / 2, Math.min(z0 + H, z0 + 96 * (k + 1)) - wc / 2), rotateZ((2 * Math.PI * (i + (k % 3) / 3)) / nv)));
  return mergeMeshes(parts);
}
export const ringRail = (r: number, z: number): MeshData => { const np = Math.max(8, Math.ceil((2 * Math.PI * r) / 72)), parts: MeshData[] = []; for (let i = 0; i < np; i++) { const a = (2 * Math.PI * (i + 0.5)) / np; parts.push(cylZ(r * Math.cos(a), r * Math.sin(a), 0.95, z, z + 42, 8)); } const ring = (h: number, rad: number) => sweep(Array.from({ length: 96 }, (_, i) => [r * Math.cos((2 * Math.PI * i) / 96), r * Math.sin((2 * Math.PI * i) / 96), z + h] as V3), rad, 8, true); parts.push(ring(42, 0.95), ring(21, 0.66)); return mergeMeshes(parts); };
export interface StorageTankInput { tag: string; D: number; H: number; t?: number }
function tankCommon(inp: StorageTankInput): { s: Solid[]; R: number; t: number; aEnd: number } {
  const R = inp.D / 2, t = inp.t ?? 0.3125, H = inp.H, s: Solid[] = [];
  s.push({ name: 'bottom plate', mesh: cylZ(0, 0, R + 2, 0, 0.25, 96) }, { name: 'shell', mesh: at(extrude({ outer: circle(0, 0, R, 96), inner: circle(0, 0, R - t, 96) }, H, 0), 0, 0, 0.25) }, { name: 'shell seams', mesh: tankSeams(R, t, 0.25, H) });
  for (const [k, th] of [0.9, 0.9 + Math.PI].entries()) s.push(...onShell(makeManway(`${inp.tag}-M${k + 1}`, { D: 24, cls: 'P150', shellT: t, shellR: R }), R, th, 36, `shell manway ${k + 1}`));
  s.push(...onShell(makeNozzle(`${inp.tag}-N1`, { NPS: 6, cls: 'P150', shellT: t, shellR: R }), R, 2.5, 30, 'inlet nozzle'), ...onShell(makeNozzle(`${inp.tag}-N2`, { NPS: 8, cls: 'P150', shellT: t, shellR: R }), R, 2.2, 24, 'outlet nozzle'), ...onShell(makeNozzle(`${inp.tag}-N3`, { NPS: 3, cls: 'P150', shellT: t, shellR: R, blind: true }), R, 2.8, 10, 'drain nozzle'));
  const st = spiralStair(R, 0, H + 0.25, -0.5);
  s.push(...st.solids, ...ringPlatform(R, H + 0.25, st.aEnd - 0.02, st.aEnd + 60 / R, 36, [false, true]).map(q => ({ ...q, name: `gauger's platform: ${q.name}` })));
  return { s, R, t, aEnd: st.aEnd };
}
export function makeConeRoofTank(inp: StorageTankInput): PartSpec {
  const { s, R, t, aEnd } = tankCommon(inp), H = inp.H, rise = (R * 0.75) / 12, zt = H + 0.25, zAt = (r: number) => zt + rise * (1 - r / R);
  s.push({ name: 'curb angle L2x2x1/4', mesh: mergeMeshes([at(extrude({ outer: circle(0, 0, R + 0.25, 96), inner: circle(0, 0, R, 96) }, 2, 0), 0, 0, zt - 2), at(extrude({ outer: circle(0, 0, R + 2, 96), inner: circle(0, 0, R + 0.25, 96) }, 0.25, 0), 0, 0, zt - 0.25)]) },
    { name: 'cone roof PL3/16', mesh: at(orient(revolve([{ r: R, z: 0 }, { r: 0, z: rise }, { r: 0, z: rise + 0.1875 }, { r: R, z: 0.1875 }], 96)), 0, 0, zt) });
  s.push({ name: 'gooseneck vent 6 in', mesh: pipeRun([[0, 0, zAt(0) - 1], [0, 0, zAt(0) + 14], ...arcPts([7, 0, zAt(0) + 14], [-1, 0, 0], [0, 0, 1], 7, 0, Math.PI, 8), [14, 0, zAt(0) + 8]], 6.625, 16) },
    ...pointUp(makeNozzle(`${inp.tag}-RM`, { NPS: 24, cls: 'P150', shellT: 0.1875, blind: true }), 0.5 * R * Math.cos(aEnd + 0.4), 0.5 * R * Math.sin(aEnd + 0.4), zAt(0.5 * R) - 1, 'roof manway'),
    ...pointUp(makeNozzle(`${inp.tag}-GH`, { NPS: 8, cls: 'P150', shellT: 0.1875, blind: true }), (R - 30) * Math.cos(aEnd + 0.15), (R - 30) * Math.sin(aEnd + 0.15), zAt(R - 30) - 1, 'gauge hatch'));
  s.push({ name: 'roof rim handrail', role: 'safety', mesh: ringRail(R - 3, zt + 0.2) });
  return done(inp.tag, 'TANK', `${inp.tag} storage tank ${(inp.D / 12).toFixed(0)}' dia × ${(H / 12).toFixed(0)}', fixed cone roof`, {
    D: drawing(inp.D, 'Diameter'), H: drawing(H, 'Shell height'), t: inp.t !== undefined ? drawing(t, 'Shell thickness') : rule(t, 'SW-EQC-44', 'Shell thickness'), courses: rule(Math.ceil(H / 96), 'SW-EQC-44', 'Shell courses (96 in)', 'count'), roofRise: rule(rise, 'SW-EQ-5', 'Cone roof rise'),
    stairRise: rule(8, 'SW-EQC-44', 'Stair rise'), stairGoing: rule(10, 'SW-EQC-44', 'Stair going'), stairW: rule(30, 'SW-EQC-44', 'Stair width'), capacity: rule((Math.PI * (R - t) ** 2 * H) / 9702, 'SW-EQC-44', 'Shell capacity, barrels (42 US gal)', 'count'),
  }, zt + rise + 30, s, ['Roof rafters and the bottom\'s lap joints are not drawn.']);
}
export function makeFloatingRoofTank(inp: StorageTankInput): PartSpec {
  const { s, R, t, aEnd } = tankCommon(inp), H = inp.H, zt = H + 0.25, zg = zt - 42, zr = 0.8 * H, Rp = R - t - 8, wp = 0.1 * inp.D;
  s.push({ name: 'wind girder walkway PL1/4', role: 'galv', mesh: at(extrude({ outer: circle(0, 0, R + 30, 96), inner: circle(0, 0, R, 96) }, 0.25, 0), 0, 0, zg) }, { name: 'wind girder kerb and braces', role: 'steel', mesh: mergeMeshes([at(extrude({ outer: circle(0, 0, R + 30.25, 96), inner: circle(0, 0, R + 30, 96) }, 6, 0), 0, 0, zg - 6), ...Array.from({ length: 24 }, (_, i) => { const a = (2 * Math.PI * i) / 24, c = Math.cos(a), sn = Math.sin(a); return member([(R + 28) * c, (R + 28) * sn, zg - 0.3], [(R - 0.1) * c, (R - 0.1) * sn, zg - 30], P_L3); })]) },
    { name: 'wind girder handrail', role: 'safety', mesh: ringRail(R + 28.5, zg + 0.25) });
  s.push({ name: 'floating roof pontoon PL3/16', mesh: mergeMeshes([at(extrude({ outer: circle(0, 0, Rp, 96), inner: circle(0, 0, Rp - 0.1875, 96) }, 24, 0), 0, 0, zr - 24), at(extrude({ outer: circle(0, 0, Rp - wp + 0.1875, 96), inner: circle(0, 0, Rp - wp, 96) }, 24, 0), 0, 0, zr - 24), at(extrude({ outer: circle(0, 0, Rp - 0.1875, 96), inner: circle(0, 0, Rp - wp + 0.1875, 96) }, 0.1875, 0), 0, 0, zr - 0.1875), at(extrude({ outer: circle(0, 0, Rp - 0.1875, 96), inner: circle(0, 0, Rp - wp + 0.1875, 96) }, 0.1875, 0), 0, 0, zr - 24)]) }, { name: 'floating roof deck PL3/16', mesh: cylZ(0, 0, Rp - wp + 1, zr - 18, zr - 17.8125, 96) },
    { name: 'rim seal', role: 'polymer', mesh: frustum(Rp + 0.2, R - t - 0.2, zr, zr + 10, 0.125, 96) }, { name: 'roof drain sump', mesh: boxMesh(-12, -12, zr - 30, 12, 12, zr - 18) });
  const legs: MeshData[] = []; for (let i = 0; i < 12; i++) { const a = (2 * Math.PI * i) / 12; legs.push(cylZ(0.72 * R * Math.cos(a), 0.72 * R * Math.sin(a), 1.75, zr - 84, zr - 10, 10)); } for (let i = 0; i < 6; i++) { const a = (2 * Math.PI * (i + 0.5)) / 6; legs.push(cylZ(0.35 * R * Math.cos(a), 0.35 * R * Math.sin(a), 1.75, zr - 84, zr - 10, 10)); }
  s.push({ name: 'roof legs (18 × 3 in pipe)', mesh: mergeMeshes(legs) }, ...pointUp(makeNozzle(`${inp.tag}-RV`, { NPS: 8, cls: 'P150', shellT: 0.1875, projection: 12 }), 0.3 * R, 0, zr - 18, 'roof vent'), ...pointUp(makeNozzle(`${inp.tag}-RM`, { NPS: 24, cls: 'P150', shellT: 0.1875, blind: true }), -0.3 * R, 0, zr - 18, 'deck manway'));
  // rolling ladder from the gauger's platform to the roof at 40°
  const a = aEnd + 30 / R, c = Math.cos(a), sn = Math.sin(a), run = (zt - zr) / Math.tan((40 * Math.PI) / 180), A: V3 = [(R - 6) * c, (R - 6) * sn, zt + 2], B: V3 = [(R - 6 - run) * c, (R - 6 - run) * sn, zr + 2], tn: V3 = [-sn, c, 0], roll: MeshData[] = [];
  for (const o of [-12, 12]) roll.push(member([A[0] + tn[0] * o, A[1] + tn[1] * o, A[2]], [B[0] + tn[0] * o, B[1] + tn[1] * o, B[2]], { outer: rect(-0.1875, -3, 0.1875, 3) }));
  const Lr = Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); for (let d = 10; d < Lr; d += 12) { const f = d / Lr, q: V3 = [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f]; roll.push(sweep([[q[0] - tn[0] * 12, q[1] - tn[1] * 12, q[2]], [q[0] + tn[0] * 12, q[1] + tn[1] * 12, q[2]]], 0.5, 6)); }
  for (const o of [-12, 12]) roll.push(member([B[0] + tn[0] * o + c * 12, B[1] + tn[1] * o + sn * 12, zr + 0.5], [B[0] + tn[0] * o - c * (0.25 * inp.D), B[1] + tn[1] * o - sn * (0.25 * inp.D), zr + 0.5], P_L3));
  s.push({ name: 'rolling ladder and roof track', role: 'safety', mesh: mergeMeshes(roll) });
  return done(inp.tag, 'TANK', `${inp.tag} storage tank ${(inp.D / 12).toFixed(0)}' dia × ${(H / 12).toFixed(0)}', external floating roof`, {
    D: drawing(inp.D, 'Diameter'), H: drawing(H, 'Shell height'), t: inp.t !== undefined ? drawing(t, 'Shell thickness') : rule(t, 'SW-EQC-44', 'Shell thickness'), courses: rule(Math.ceil(H / 96), 'SW-EQC-44', 'Shell courses (96 in)', 'count'),
    girder: rule(30, 'SW-EQC-44', 'Wind girder walkway width'), girderZ: rule(42, 'SW-EQC-44', 'Wind girder below the top'), pontoonW: rule(wp, 'SW-EQC-44', 'Pontoon width (0.1 D)'), pontoonD: rule(24, 'SW-EQC-44', 'Pontoon depth'), roofAt: rule(zr, 'SW-EQC-44', 'Roof shown floating at (0.8 H)'), legs: rule(18, 'SW-EQC-44', 'Roof legs', 'count'),
  }, zt + 44, s, ['The roof is shown floating at 0.8 of the shell height.']);
}

void rect; void hssRoundProfile; void pipeDims; void designFlange; void vesselSolids; void shellRing; void makeVerticalVessel; void N_REV; void hexNut; void boltingOf; void cylX; void cylY; void tube; void flangeSolids; void flangeLen; void seriesUp; void makeNozzle; void makeDavit; void dressVessel; void seamSolids; void makeProcessPump; void motorSolids; void NOZZLE_UP; void baseBolt; void P_W14; void P_W8; void P_C6; void pipeRun; void frustum; void lift; void rotateX; void rotateY; void N;
export type { VesselVInput, PipeClass, Dim };
