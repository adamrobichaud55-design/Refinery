/**
 * Further process equipment: DESIGN_BASIS.md §72 (SW-EQC-45..65). Catalogue items only. True-scale arrangements from
 * stated principal dimensions; the proportions are SmartWeld's own rules, written from reasoning, from no drawing,
 * licensor's design, maker's data, standard or table (PROVENANCE P-77).
 * Horizontal items: z along the axis, y up. Vertical items and site items: z up from grade.
 */
import { drawing, rule, type Dim } from '../../core/basis';
import { K } from '../../core/constants';
import type { PartSpec } from '../part';
import { extrude, revolve, transformMesh, mergeMeshes, signedVolume, type MeshData, type Profile } from '../../geometry/mesh';
import { circle, rect } from '../../geometry/polygon';
import { wProfile } from '../../geometry/profiles';
import { translate, multiply, rotateX, rotateY, rotateZ, frameFromAxes } from '../../geometry/transform';
import { proportionW } from './wideFlange';
import { pipeDims, designFlange } from './pipe';
import { shellRing, headLoop, vesselSolids, makeVerticalVessel } from './equipment';
import { sweep, boxMesh, orient, type V3 } from './detailKit';
import { done, cylZ, cylX, cylY, tube, at, flangeSolids, flangeLen, seriesUp, makeNozzle, makeManway, makeSupportLugs, dressVessel, seamSolids, makeShellTubeExchanger, motorSolids, MOTOR_SHAFT, NOZZLE_UP, SHAFT_X_UP_Z, type Solid } from './equipmentKit';
import { member, pipeRun, frustum, lift, named, onShell, pointUp, pointDown, floorsThrough, towerAccess, ringFlange, straightRail, saddleSolids, drumBody, spiralStair, ringRail, ringPlatform, ladderSolids, stackSolids, burnerSolids, makeFlueGasCooler, partSolids, P_L3, P_W8 } from './processUnits';
import { bendPath } from './pipingSpecials';

const NOT_STEEL = new Set(['concrete', 'grout', 'polymer']);
function equip(id: string, kind: PartSpec['kind'], designation: string, dims: Record<string, Dim>, len: number, solids: Solid[], notes: string[] = []): PartSpec {
  const p = done(id, kind, designation, dims, len, solids, notes), steel = solids.filter(s => !NOT_STEEL.has(s.role ?? '')).reduce((a, s) => a + signedVolume(s.mesh), 0);
  return { ...p, weight: rule((steel * K.STEEL_DENSITY_LB_FT3) / 1728, 'SW-EQ-7', 'Empty steel weight from the drawn envelope', 'lb'), notes: p.notes.map(n => (n.startsWith('Envelope only') ? 'True-scale arrangement; internals are not drawn unless named (SW-EQC-45..65).' : n)) };
}
/** a z-up local frame laid into a y-up one: local x → z, y → x, z → y */
const M_YUP = [0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1];
const yUp = (list: Solid[], x = 0, y = 0, z = 0): Solid[] => list.map(s => ({ ...s, mesh: transformMesh(s.mesh, multiply(translate(x, y, z), M_YUP)) }));
/** a nozzle on a z-axis shell of outer radius R at z, at angle phi from the top toward +x; the shell's axis at height y0 */
const radialOn = (p: PartSpec, R: number, z: number, phi: number, label: string, y0 = 0): Solid[] => named(p, label, m => transformMesh(m, multiply(translate(0, y0, 0), multiply(rotateZ(-phi), multiply(translate(0, R, z), NOZZLE_UP)))));
const endOn = (p: PartSpec, x: number, y: number, z: number, dir: 1 | -1, label: string): Solid[] => named(p, label, m => (dir > 0 ? at(m, x, y, z) : transformMesh(m, multiply(translate(x, y, z), rotateX(Math.PI)))));
const thk = (ID: number, ratio: number, least: number) => Math.max(least, Math.ceil((ID / ratio) * 8) / 8);
const noz = (tag: string, NPS: number, t: number, R?: number, extra: { projection?: number; blind?: boolean } = {}) => makeNozzle(tag, { NPS, cls: 'P150', shellT: t, shellR: R, ...extra });
const manD = (ID: number): 20 | 24 => (ID < 48 ? 20 : 24);
const W6: Profile = { outer: wProfile(proportionW(6, 10)) }, W10: Profile = { outer: wProfile(proportionW(10, 20)) };
const rectTube = (a: number, b: number, t: number, L: number, z0 = 0): MeshData => extrude({ outer: rect(-a / 2, -b / 2, a / 2, b / 2), inner: rect(-a / 2 + t, -b / 2 + t, a / 2 - t, b / 2 - t) }, L, z0);
/** a plate between an outer quad and the same quad moved inward */
function slab(A: V3[], B: V3[]): MeshData {
  const positions = [...A.flat(), ...B.flat()], indices = [0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; indices.push(i, i + 4, j, j, i + 4, j + 4); }
  return orient({ positions, indices });
}
/** a rectangular hopper or transition about the z axis in plate t: a0 × b0 at z0 to a1 × b1 at z1 */
function pyramid(a0: number, b0: number, z0: number, a1: number, b1: number, z1: number, t: number): MeshData {
  const c = (a: number, b: number, z: number): V3[] => [[-a / 2, -b / 2, z], [a / 2, -b / 2, z], [a / 2, b / 2, z], [-a / 2, b / 2, z]];
  const o0 = c(a0, b0, z0), o1 = c(a1, b1, z1), i0 = c(a0 - 2 * t, b0 - 2 * t, z0), i1 = c(a1 - 2 * t, b1 - 2 * t, z1);
  return mergeMeshes([0, 1, 2, 3].map(k => { const j = (k + 1) % 4; return slab([o0[k], o0[j], o1[j], o1[k]], [i0[k], i0[j], i1[j], i1[k]]); }));
}
/** a cone between two circles whose centres differ in y (an eccentric reducer), wall t */
function eccCone(r0: number, y0: number, z0: number, r1: number, y1: number, z1: number, t: number, n = 64): MeshData {
  const positions: number[] = [], indices: number[] = [], ring = (r: number, y: number, z: number) => { for (let k = 0; k < n; k++) { const a = (2 * Math.PI * k) / n; positions.push(r * Math.cos(a), y + r * Math.sin(a), z); } };
  ring(r0, y0, z0); ring(r1, y1, z1); ring(r1 - t, y1, z1); ring(r0 - t, y0, z0);
  for (let i = 0; i < 4; i++) { const a0 = i * n, b0 = ((i + 1) % 4) * n; for (let k = 0; k < n; k++) { const k2 = (k + 1) % n; indices.push(a0 + k, a0 + k2, b0 + k, a0 + k2, b0 + k2, b0 + k); } }
  return orient({ positions, indices });
}

// ---- SW-EQC-45: horizontal drums ------------------------------------------------------------------------------------------------------
function hDrum(ID: number, L: number, t: number, cl?: number): { s: Solid[]; R: number; cl: number } {
  const R = ID / 2 + t, c = cl ?? R + 36;
  return { R, cl: c, s: [...drumBody(R, t, L), ...[0.2, 0.8].flatMap(f => saddleSolids(R, c, f * L, Math.max(6, ID / 3)))] };
}
/** SW-EQC-46: a walkway 36 in wide along a drum's top, with its ladder; local z-up frame: x along from the ladder end, y across, the drum's axis at z = 0 */
function walkway(Lw: number, zF: number, grade: number, shellZ: (y: number) => number): Solid[] {
  const bars: MeshData[] = [], frame: MeshData[] = [], rail: MeshData[] = [], nb = Math.ceil(Lw / 60);
  for (let y = -17.25; y <= 17.3; y += 1.5) bars.push(boxMesh(0, y - 3 / 32, zF - 1.5, Lw, y + 3 / 32, zF));
  for (let x = 2; x < Lw; x += 4) bars.push(boxMesh(x - 0.125, -18, zF - 0.25, x + 0.125, 18, zF));
  for (let i = 0; i <= nb; i++) { const x = Math.min(Lw - 3, Math.max(0, (Lw * i) / nb)); frame.push(member([x, -18, zF - 1.55], [x, 18, zF - 1.55], P_L3, [0, 0, -1])); for (const y of [-15, 15]) frame.push(member([x + 0.2, y, shellZ(y) - 0.2], [x + 0.2, y, zF - 1.6], P_L3, [1, 0, 0])); }
  for (const y of [-18.25, 18]) frame.push(boxMesh(0, y, zF - 6, Lw, y + 0.25, zF + 4));
  rail.push(straightRail([0, -17, zF], [Lw, -17, zF]), straightRail([0, 17, zF], [Lw, 17, zF]), straightRail([Lw, -17, zF], [Lw, 17, zF]));
  return [{ name: 'walkway grating (SW-GR-1)', role: 'galv', mesh: mergeMeshes(bars) }, { name: 'walkway framing L3x3x1/4 and kerbs', role: 'steel', mesh: mergeMeshes(frame) }, { name: 'walkway handrail', role: 'safety', mesh: mergeMeshes(rail) },
    ...ladderSolids(0, Math.PI, grade, zF).map(q => ({ ...q, name: `walkway ${q.name}` }))];
}
const onTop = (R: number, xw: number, z0: number, Lw: number, cl: number): Solid[] => yUp(walkway(Lw, R + 12, -cl, y => Math.sqrt(Math.max(R * R - (y + xw) ** 2, 0))), xw, 0, z0);
export interface HDrumInput { tag: string; ID: number; L: number; t?: number; centreline?: number; boot?: boolean; service?: string }
export function makeHorizontalDrum(inp: HDrumInput): PartSpec {
  const { ID, L, tag } = inp, t = inp.t ?? thk(ID, 96, 0.375), bootL = ID / 2, d = hDrum(ID, L, t, inp.centreline ?? (inp.boot ? ID / 2 + t + bootL + ID / 12 + 42 : undefined)), R = d.R, s = d.s, nI = seriesUp(Math.max(2, ID / 8)), nL = seriesUp(Math.max(2, ID / 12));
  s.push(...radialOn(noz(`${tag}-N1`, nI, t, R), R, 0.1 * L, 0, 'inlet nozzle'), ...radialOn(noz(`${tag}-N2`, nI, t, R), R, 0.9 * L, 0, 'vapour outlet nozzle'), ...radialOn(makeManway(`${tag}-M1`, { D: manD(ID), cls: 'P150', shellT: t, shellR: R }), R, 0.5 * L, 0, 'manway'));
  s.push(...radialOn(noz(`${tag}-V`, 2, t, R), R, 0.5 * L + 36, 0, 'vent'), ...radialOn(noz(`${tag}-D`, 2, t, R), R, 0.5 * L, Math.PI, 'drain'));
  for (const [k, phi] of [1.15, 1.95].entries()) s.push(...radialOn(noz(`${tag}-LG${k}`, 2, t, R, { blind: true }), R, 0.25 * L, phi, 'level connection'));
  if (inp.boot) {
    const rb = ID / 6 + t, boot: Solid[] = [{ name: 'boot shell', mesh: shellRing(rb, t, bootL + 0.15 * R) }, { name: 'boot head', mesh: orient(revolve(headLoop(rb, t, -1), 48)) }, ...pointDown(noz(`${tag}-N3`, nL, t), 0, 0, -rb / 2 + 0.3, 'liquid outlet nozzle'), ...onShell(noz(`${tag}-LB`, 2, t, rb, { blind: true }), rb, 0, 0.3 * bootL, 'boot level connection')];
    s.push(...yUp(boot, 0, -R - bootL, 0.85 * L));
  } else s.push(...radialOn(noz(`${tag}-N3`, nL, t, R), R, 0.85 * L, Math.PI, 'liquid outlet nozzle'));
  return equip(tag, 'VESSEL_H', `${tag} ${inp.service ?? 'horizontal drum'} ${ID}" ID × ${(L / 12).toFixed(0)}' T/T${inp.boot ? ' with boot' : ''}`, {
    ID: drawing(ID, 'Inside diameter'), L: drawing(L, 'Tangent length'), t: inp.t !== undefined ? drawing(t, 'Shell thickness') : rule(t, 'SW-EQC-45', 'Shell thickness (ID / 96, 3/8 least)'), centreline: inp.centreline !== undefined ? drawing(d.cl, 'Centreline above grade') : rule(d.cl, 'SW-EQC-45', 'Centreline above grade'),
    saddle: rule(0.2 * L, 'SW-EQC-45', 'Saddle from each tangent line (0.2 L)'), inlet: rule(nI, 'SW-EQC-45', 'Inlet and vapour outlet (ID / 8, to the series)'), outlet: rule(nL, 'SW-EQC-45', 'Liquid outlet (ID / 12, to the series)'), manway: rule(manD(ID), 'SW-EQC-45', 'Manway'),
    ...(inp.boot ? { bootD: rule(ID / 3, 'SW-EQC-45', 'Boot diameter (ID / 3)'), bootL: rule(bootL, 'SW-EQC-45', 'Boot length (ID / 2)') } : {}),
  }, L + R, s);
}
// ---- SW-EQC-46: storage bullet --------------------------------------------------------------------------------------------------------
export function makeBullet(inp: { tag: string; ID: number; L: number }): PartSpec {
  const { ID, L, tag } = inp, t = thk(ID, 72, 0.5), d = hDrum(ID, L, t), R = d.R, s = d.s, nL = seriesUp(Math.max(3, ID / 12)), xw = -Math.min(0.55 * R, 34);
  for (const [k, f] of [0.4, 0.6].entries()) s.push(...radialOn(noz(`${tag}-RV${k}`, 4, t, R, { projection: 12 }), R, f * L, 0, `relief nozzle ${k + 1}`));
  s.push(...radialOn(makeManway(`${tag}-M1`, { D: manD(ID), cls: 'P150', shellT: t, shellR: R }), R, 0.27 * L, 0, 'manway'), ...radialOn(noz(`${tag}-V`, 2, t, R), R, 0.5 * L, 0, 'vent'));
  s.push(...radialOn(noz(`${tag}-F`, nL, t, R), R, 0.12 * L, Math.PI, 'fill nozzle'), ...radialOn(noz(`${tag}-O`, nL, t, R), R, 0.88 * L, Math.PI, 'outlet nozzle'), ...radialOn(noz(`${tag}-D`, 2, t, R), R, 0.5 * L, Math.PI, 'drain'));
  for (const [k, phi] of [1.15, 1.95].entries()) s.push(...radialOn(noz(`${tag}-LG${k}`, 2, t, R, { blind: true }), R, 0.3 * L, phi, 'level connection'));
  s.push(...onTop(R, xw, 0.2 * L, 0.6 * L, d.cl));
  return equip(tag, 'VESSEL_H', `${tag} storage bullet ${ID}" ID × ${(L / 12).toFixed(0)}' T/T`, { ID: drawing(ID, 'Inside diameter'), L: drawing(L, 'Tangent length'), t: rule(t, 'SW-EQC-46', 'Shell thickness (ID / 72, 1/2 least)'), relief: rule(4, 'SW-EQC-46', 'Relief nozzles, two'), walkway: rule(0.6 * L, 'SW-EQC-46', 'Walkway length (0.6 L)'), walkwayW: rule(36, 'SW-EQC-46', 'Walkway width'), nozzle: rule(nL, 'SW-EQC-46', 'Fill and outlet nozzles') }, L + R, s);
}
// ---- SW-EQC-47: desalter --------------------------------------------------------------------------------------------------------------
export function makeDesalter(inp: { tag: string; ID: number; L: number }): PartSpec {
  const { ID, L, tag } = inp, t = thk(ID, 96, 0.5), d = hDrum(ID, L, t), R = d.R, s = d.s, hd = pipeDims(seriesUp(ID / 8), 'P150').OD, a = 0.25 * ID, xw = -(a / 2 + 26), xc = a / 2 + 16, yc = R + 20, yh = -R - 24;
  for (const [k, f] of [0.3, 0.7].entries()) {
    const z = f * L, yb = R + 22;
    s.push(...radialOn(noz(`${tag}-EB${k}`, 8, t, R, { projection: 14 }), R, z, 0, `entrance bushing ${k + 1}`));
    s.push({ name: 'transformer tanks', role: 'machine', mesh: boxMesh(-a / 2, yb, z - a / 2, a / 2, yb + 0.3 * ID, z + a / 2) }, { name: 'transformer radiators', role: 'machine', mesh: mergeMeshes(Array.from({ length: 6 }, (_, i) => boxMesh(-a / 2 + 3 + (i * (a - 6)) / 5 - 0.5, yb + 3, z + a / 2, -a / 2 + 3 + (i * (a - 6)) / 5 + 0.5, yb + 0.3 * ID - 3, z + a / 2 + 6))) },
      { name: 'transformer frames', role: 'steel', mesh: mergeMeshes([boxMesh(-a / 2 - 2, yb - 3, z - a / 2 - 2, a / 2 + 2, yb, z - a / 2 + 2), boxMesh(-a / 2 - 2, yb - 3, z + a / 2 - 2, a / 2 + 2, yb, z + a / 2 + 2), ...[-1, 1].flatMap(sx => [-1, 1].map(sz => { const x = sx * (a / 2 - 2), zz = z + sz * (a / 2 - 1); return member([x, Math.sqrt(R * R - x * x) - 0.2, zz], [x, yb - 3, zz], P_L3, [0, 0, 1]); }))]) });
  }
  s.push({ name: 'outlet collector', mesh: pipeRun([[xc, yc, 0.15 * L], [xc, yc, 0.92 * L]], hd, 16) }, { name: 'outlet collector flange', mesh: at(ringFlange(hd / 2, 0, 2.5, 1.25), xc, yc, 0.92 * L) });
  for (const f of [0.2, 0.5, 0.8]) s.push({ name: 'outlet risers', mesh: pipeRun([[xc, Math.sqrt(R * R - xc * xc) - 1, f * L], [xc, yc, f * L]], hd, 16) });
  s.push({ name: 'inlet header', mesh: mergeMeshes([pipeRun([[0, yh, 0.27 * L], [0, yh, 0.73 * L]], hd, 16), pipeRun([[0, yh, 0.5 * L], [R + 14, yh, 0.5 * L]], hd, 16)]) }, { name: 'inlet flange', mesh: transformMesh(ringFlange(hd / 2, 0, 2.5, 1.25), multiply(translate(R + 14, yh, 0.5 * L), rotateY(Math.PI / 2))) });
  for (const f of [0.35, 0.5, 0.65]) s.push({ name: 'inlet risers', mesh: pipeRun([[0, yh, f * L], [0, -R + 1, f * L]], hd, 16) });
  s.push(...radialOn(noz(`${tag}-W`, 6, t, R), R, 0.9 * L, Math.PI, 'water outlet nozzle'), ...radialOn(makeManway(`${tag}-M1`, { D: 24, cls: 'P150', shellT: t, shellR: R }), R, 0.5 * L, Math.PI / 2, 'manway'), ...radialOn(noz(`${tag}-V`, 2, t, R), R, 0.5 * L, 0, 'vent'));
  [-0.5, -0.2, 0.1, 0.4].forEach((f, k) => s.push(...endOn(noz(`${tag}-T${k}`, 2, t, undefined, { blind: true }), 0, f * R, -(R / 2) * Math.sqrt(1 - f * f) + 0.4, -1, `try connection ${k + 1}`)));
  s.push(...onTop(R, xw, 0.1 * L, 0.8 * L, d.cl));
  return equip(tag, 'VESSEL_H', `${tag} desalter ${ID}" ID × ${(L / 12).toFixed(0)}' T/T`, { ID: drawing(ID, 'Inside diameter'), L: drawing(L, 'Tangent length'), t: rule(t, 'SW-EQC-47', 'Shell thickness (ID / 96, 1/2 least)'), transformer: rule(a, 'SW-EQC-47', 'Transformer box side (0.25 ID)'), header: rule(seriesUp(ID / 8), 'SW-EQC-47', 'Inlet header and outlet collector (ID / 8)'), risers: rule(3, 'SW-EQC-47', 'Risers on each', 'count'), walkway: rule(0.8 * L, 'SW-EQC-47', 'Walkway length (0.8 L)') }, L + R, s, ['Electrode grids and the distributor inside are not drawn.']);
}
// ---- SW-EQC-50: deaerator -------------------------------------------------------------------------------------------------------------
export function makeDeaerator(inp: { tag: string; ID: number; L: number; centreline: number; /** a stated shell wall in place of the proportion (§72) */ t?: number }): PartSpec {
  const { ID, L, tag } = inp, t = inp.t ?? thk(ID, 96, 0.375), d = hDrum(ID, L, t, inp.centreline), R = d.R, s = d.s, rd = 0.25 * ID + t, Hd = 0.75 * ID, rn = 0.125 * ID + t, nS = seriesUp(Math.max(2, ID / 8));
  const dome: Solid[] = [{ name: 'dome neck', mesh: tube(rn, t, 14 + 0.1 * R, -0.1 * R) }, ...lift(vesselSolids(rd, t, Hd, 'head', 'head').map(q => ({ ...q, name: `dome ${q.name}` })), 0, 0, 12 + rd / 2), ...lift(onShell(noz(`${tag}-WI`, 6, t, rd), rd, Math.PI / 2, 0.7 * Hd, 'water inlet nozzle'), 0, 0, 12 + rd / 2), ...pointUp(noz(`${tag}-V`, 2, t), 0, 0, 12 + rd + Hd - 0.3, 'vent')];
  s.push(...yUp(dome, 0, R, 0.5 * L), ...radialOn(noz(`${tag}-S`, nS, t, R), R, 0.2 * L, 0, 'steam inlet nozzle'), ...radialOn(noz(`${tag}-RV`, 4, t, R, { projection: 12 }), R, 0.8 * L, 0, 'relief nozzle'), ...radialOn(noz(`${tag}-O`, nS, t, R), R, 0.5 * L, Math.PI, 'outlet nozzle'),
    ...radialOn(makeManway(`${tag}-M1`, { D: manD(ID), cls: 'P150', shellT: t, shellR: R }), R, 0.85 * L, Math.PI / 2, 'manway'));
  for (const [k, phi] of [1.15, 1.95].entries()) s.push(...radialOn(noz(`${tag}-LG${k}`, 2, t, R, { blind: true }), R, 0.3 * L, phi, 'level connection'));
  return equip(tag, 'VESSEL_H', `${tag} deaerator ${ID}" ID × ${(L / 12).toFixed(0)}' with dome`, { ID: drawing(ID, 'Storage inside diameter'), L: drawing(L, 'Tangent length'), centreline: drawing(inp.centreline, 'Centreline above grade'), t: inp.t ? drawing(t, 'Shell thickness (stated)') : rule(t, 'SW-EQC-45', 'Shell thickness (ID / 96, 3/8 least)'), domeD: rule(0.5 * ID, 'SW-EQC-50', 'Dome diameter (0.5 ID)'), domeH: rule(Hd, 'SW-EQC-50', 'Dome height (0.75 ID)'), neck: rule(0.25 * ID, 'SW-EQC-50', 'Neck diameter (0.25 ID)'), steam: rule(nS, 'SW-EQC-50', 'Steam inlet (ID / 8, to the series)') }, L + R, s, ['Trays and sprays in the dome are not drawn.']);
}
// ---- SW-EQC-63: kettle reboiler -------------------------------------------------------------------------------------------------------
export function makeKettleReboiler(inp: { tag: string; bundleD: number; tubeL: number }): PartSpec {
  const { bundleD: Db, tubeL: Lt, tag } = inp, t = 0.5, rb = Db / 2 + t, Rs = 0.8 * Db + t, y0 = Rs - rb, ts = Math.max(1, Db / 12), Lc = 0.6 * Db, zs = ts + 0.6 * Db, Ls = 1.15 * Lt - 0.6 * Db, cl = rb + 30, nV = seriesUp(Db / 3), nT = seriesUp(Math.max(2, Db / 4)), s: Solid[] = [];
  s.push({ name: 'channel', mesh: at(shellRing(rb, t, Lc), 0, 0, -Lc) }, { name: 'channel cover', mesh: cylZ(0, 0, rb + 3, -Lc - 1.5, -Lc, 64) }, { name: 'girth flanges', mesh: mergeMeshes([ringFlange(rb, -1.5, 3, 1.5), ringFlange(rb, ts, 3, 1.5), ringFlange(rb, -Lc, 3, 1.5)]) }, { name: 'tubesheet', role: 'closure', mesh: cylZ(0, 0, rb + 3, 0, ts, 64) });
  s.push({ name: 'eccentric cone', mesh: eccCone(rb, 0, ts + 1.5, Rs, y0, zs, t) }, { name: 'shell', mesh: at(shellRing(Rs, t, Ls), 0, y0, zs) }, { name: 'rear head', mesh: at(orient(revolve(headLoop(Rs, t, 1), 64)), 0, y0, zs + Ls) }, { name: 'weld seams', mesh: at(seamSolids(Rs, t, 0, Ls), 0, y0, zs) });
  for (const f of [0.2, 0.8]) s.push(...lift(saddleSolids(Rs, cl + y0, zs + f * Ls, Math.max(6, Db / 3)), 0, y0, 0));
  for (const [k, f] of [0.3, 0.7].entries()) s.push(...radialOn(noz(`${tag}-V${k}`, nV, t, Rs), Rs, zs + f * Ls, 0, `vapour outlet nozzle ${k + 1}`, y0));
  s.push(...radialOn(noz(`${tag}-F`, nT, t, Rs), Rs, zs + 0.12 * Ls, Math.PI, 'feed nozzle', y0), ...radialOn(noz(`${tag}-L`, nT, t, Rs), Rs, zs + 0.94 * Ls, Math.PI, 'liquid outlet nozzle', y0), ...radialOn(noz(`${tag}-T1`, nT, t, rb), rb, -Lc / 2, 0, 'tube-side inlet nozzle'), ...radialOn(noz(`${tag}-T2`, nT, t, rb), rb, -Lc / 2, Math.PI, 'tube-side outlet nozzle'));
  for (const [k, phi] of [1.2, 1.9].entries()) s.push(...radialOn(noz(`${tag}-LG${k}`, 2, t, Rs, { blind: true }), Rs, zs + 0.9 * Ls, phi, 'level connection', y0));
  const flip = multiply(translate(0, 0, zs + Ls), rotateY(Math.PI)); for (const q of s) q.mesh = transformMesh(q.mesh, flip);   // the channel end toward +z
  return equip(tag, 'EXCHANGER', `${tag} kettle reboiler, ${Db}" bundle × ${(Lt / 12).toFixed(0)}' tubes`, { bundleD: drawing(Db, 'Bundle diameter'), tubeL: drawing(Lt, 'Tube length'), shellD: rule(1.6 * Db, 'SW-EQC-63', 'Shell diameter (1.6 Db)'), cone: rule(0.6 * Db, 'SW-EQC-63', 'Eccentric cone length (0.6 Db)'), shellL: rule(1.15 * Lt, 'SW-EQC-63', 'Tubesheet to rear tangent (1.15 tube lengths)'), vapour: rule(nV, 'SW-EQC-63', 'Vapour nozzles (Db / 3, to the series), two') }, Lc + zs + Ls + Rs / 2, s, ['The bundle and weir are inside and not drawn.']);
}
// ---- SW-EQC-52: steam jet ejector -----------------------------------------------------------------------------------------------------
export function makeEjector(id: string, NPS: number): PartSpec {
  const pd = pipeDims(NPS, 'P150'), OD = pd.OD, t = Math.max(0.25, pd.t), f = designFlange(NPS, 'P150'), Lf = flangeLen(f), nM = seriesUp(Math.max(1, NPS / 3)), rt = 0.225 * OD + t, s: Solid[] = [];
  s.push({ name: 'suction chamber', role: 'casting', mesh: mergeMeshes([tube(0.8 * OD, t, 2 * OD, 0), cylZ(0, 0, 0.8 * OD, -t, 0, 48)]) }, { name: 'diffuser inlet cone', role: 'casting', mesh: frustum(0.8 * OD, rt, 2 * OD, 4 * OD, t, 48) }, { name: 'throat', role: 'casting', mesh: tube(rt, t, OD, 4 * OD) }, { name: 'diffuser outlet cone', role: 'casting', mesh: frustum(rt, OD / 2, 5 * OD, 10 * OD, t, 48) });
  s.push(...flangeSolids(f, 'discharge flange').map(q => ({ ...q, role: 'casting' as const, mesh: transformMesh(q.mesh, multiply(translate(0, 0, 10 * OD + Lf), rotateX(Math.PI))) })));
  s.push(...endOn(noz(`${id}-M`, nM, t, undefined, { projection: 6 }), 0, 0, -t + 0.1, -1, 'motive steam nozzle').map(q => ({ ...q, role: 'casting' as const })), ...radialOn(noz(`${id}-S`, NPS, t, 0.8 * OD, { projection: 6 }), 0.8 * OD, OD, Math.PI, 'suction nozzle').map(q => ({ ...q, role: 'casting' as const })));
  return equip(id, 'PROCESS_UNIT', `Steam jet ejector, ${NPS}" suction`, { NPS: drawing(NPS, 'Suction size'), chamberD: rule(1.6 * OD, 'SW-EQC-52', 'Suction chamber diameter (1.6 OD)'), throat: rule(0.45 * OD, 'SW-EQC-52', 'Throat diameter (0.45 OD)'), diverging: rule(5 * OD, 'SW-EQC-52', 'Diverging cone length (5 OD)'), motive: rule(nM, 'SW-EQC-52', 'Motive steam nozzle (a third of the suction, to the series)'), overall: rule(10 * OD + Lf, 'SW-EQC-52', 'Chamber back to discharge face') }, 10 * OD + Lf, s);
}
// ---- SW-EQC-51: steam turbine driver --------------------------------------------------------------------------------------------------
export function makeSteamTurbine(id: string, d: number): PartSpec {
  const nI = seriesUp(Math.max(2, d / 6)), nE = seriesUp(Math.max(3, d / 3)), yb = -0.9 * d, s: Solid[] = [], side = (p: PartSpec, x: number, y: number, z: number, sg: 1 | -1, label: string) => named(p, label, m => transformMesh(m, multiply(translate(x, y, z), rotateY((sg * Math.PI) / 2))));
  s.push({ name: 'casing', role: 'machine', mesh: cylZ(0, 0, 0.75 * d, 0, 0.8 * d, 64) }, { name: 'joint flange', role: 'machine', mesh: boxMesh(-0.75 * d - 3, -1, 0, 0.75 * d + 3, 1, 0.8 * d) }, { name: 'steam chest', role: 'machine', mesh: boxMesh(-0.25 * d, 0.7 * d, 0.2 * d, 0.25 * d, 1.1 * d, 0.6 * d) });
  s.push(...side(noz(`${id}-I`, nI, 0.5, undefined, { projection: 6 }), 0.25 * d, 0.9 * d, 0.4 * d, 1, 'inlet nozzle'), ...side(noz(`${id}-E`, nE, 0.5, undefined, { projection: 6 }), -0.7 * d, -0.3 * d, 0.4 * d, -1, 'exhaust nozzle'));
  s.push({ name: 'bearing housings', role: 'machine', mesh: mergeMeshes([cylZ(0, 0, 0.225 * d, -0.4 * d, -0.05 * d, 40), cylZ(0, 0, 0.225 * d, 0.85 * d, 1.2 * d, 40)]) }, { name: 'shaft and coupling half', role: 'stem', mesh: mergeMeshes([cylZ(0, 0, d / 16, -0.7 * d, 1.2 * d, 24), cylZ(0, 0, 0.15 * d, -0.7 * d, -0.58 * d, 32)]) }, { name: 'governor housing', role: 'machine', mesh: mergeMeshes([cylZ(0, 0, 0.15 * d, 1.2 * d, 1.45 * d, 32), cylY(0, 1.32 * d, 0.06 * d, 0.1 * d, 0.3 * d, 16)]) });
  s.push({ name: 'pedestals', role: 'steel', mesh: mergeMeshes([boxMesh(-0.2 * d, yb, -0.38 * d, 0.2 * d, -0.2 * d, -0.07 * d), boxMesh(-0.2 * d, yb, 0.87 * d, 0.2 * d, -0.2 * d, 1.18 * d), boxMesh(0.5 * d, yb, 0.1 * d, 0.75 * d + 3, -1, 0.7 * d), boxMesh(-0.75 * d - 3, yb, 0.1 * d, -0.5 * d, -1, 0.7 * d)]) }, { name: 'baseplate', role: 'steel', mesh: boxMesh(-0.65 * d, yb - 4, -0.75 * d, 0.65 * d, yb, 1.85 * d) });
  return equip(id, 'PROCESS_UNIT', `Steam turbine driver, ${d}" wheel`, { d: drawing(d, 'Wheel diameter'), casingD: rule(1.5 * d, 'SW-EQC-51', 'Casing diameter (1.5 d)'), casingL: rule(0.8 * d, 'SW-EQC-51', 'Casing length (0.8 d)'), inlet: rule(nI, 'SW-EQC-51', 'Inlet (d / 6, to the series)'), exhaust: rule(nE, 'SW-EQC-51', 'Exhaust (d / 3, to the series)'), shaftH: rule(0.9 * d, 'SW-EQC-51', 'Shaft above the baseplate (0.9 d)'), baseL: rule(2.6 * d, 'SW-EQC-51', 'Baseplate length (2.6 d)') }, 2.6 * d, s);
}
// ---- SW-EQC-64: vertical in-line pump -------------------------------------------------------------------------------------------------
export function makeInlinePump(inp: { tag: string; NPS: number; motorD: number }): PartSpec {
  const { NPS, motorD: Dm, tag } = inp, pd = pipeDims(NPS, 'P150'), OD = pd.OD, f = designFlange(NPS, 'P150'), Lf = flangeLen(f), rc = 1.2 * OD, FF = 2 * rc + 2 * (Lf + 3), zc = FF / 2, yt = 0.5 * OD + Dm, s: Solid[] = [];
  s.push(...flangeSolids(f, 'suction flange'), ...flangeSolids(f, 'discharge flange').map(q => ({ ...q, mesh: transformMesh(q.mesh, multiply(translate(0, 0, FF), rotateX(Math.PI))) })), { name: 'suction and discharge necks', mesh: mergeMeshes([cylZ(0, 0, OD / 2, Lf - 0.2, zc - 0.9 * rc, 32), cylZ(0, 0, OD / 2, zc + 0.9 * rc, FF - Lf + 0.2, 32)]) });
  s.push({ name: 'casing', role: 'casting', mesh: cylY(0, zc, rc, -0.5 * OD, 0.5 * OD, 64) }, { name: 'base ring', role: 'steel', mesh: cylY(0, zc, rc + 2, -0.5 * OD - 3, -0.5 * OD, 64) }, { name: 'motor support head', role: 'casting', mesh: transformMesh(tube(rc, 0.5, Dm, 0), multiply(translate(0, 0.5 * OD, zc), rotateX(-Math.PI / 2))) },
    { name: 'hand hole frames', role: 'casting', mesh: mergeMeshes([-1, 1].map(sg => boxMesh(sg > 0 ? rc - 0.3 : -rc - 0.6, 0.5 * OD + 0.25 * Dm, zc - 0.25 * rc, sg > 0 ? rc + 0.6 : -rc + 0.3, 0.5 * OD + 0.75 * Dm, zc + 0.25 * rc))) }, { name: 'motor flange', role: 'machine', mesh: cylY(0, zc, rc + 1, yt, yt + 1, 64) }, { name: 'pump shaft', role: 'stem', mesh: cylY(0, zc, Math.max(0.5, OD / 8), 0.5 * OD, yt, 16) });
  s.push(...motorSolids(Dm).solids.filter(q => !/feet|holding-down/.test(q.name)).map(q => ({ ...q, mesh: transformMesh(q.mesh, multiply(translate(-MOTOR_SHAFT(Dm), yt + 1 - 0.3 * Dm, zc), M_YUP)) })));
  return equip(tag, 'PUMP', `${tag} vertical in-line pump ${NPS}" × ${NPS}", motor frame ${Dm}"`, { NPS: drawing(NPS, 'Suction and discharge size'), motorD: drawing(Dm, 'Motor frame'), casingD: rule(2 * rc, 'SW-EQC-64', 'Casing across (2.4 OD)'), FF: rule(FF, 'SW-EQC-64', 'Face to face'), head: rule(Dm, 'SW-EQC-64', 'Motor support head height (one frame)') }, FF, s);
}
// ---- SW-EQC-56, -57: sulfur plant furnace with waste heat boiler; sulfur condenser -----------------------------------------------------
export function makeSulfurFurnace(inp: { tag: string; D: number; furnaceL: number; boilerL: number; /** stated walls for the waste heat boiler's shell and its steam drum (§72) */ boilerT?: number; drumT?: number }): PartSpec {
  const { D, furnaceL: Lf, boilerL: Lb, tag } = inp, c = makeFlueGasCooler({ tag: `${tag}-E`, D, L: Lb, t: inp.boilerT, drumT: inp.drumT }), t = 0.75, R = D / 2 + t, rd = 0.25 * D, coneL = (R - rd - t) / Math.tan(Math.PI / 6), zE = -(2 + 0.33 * D + coneL + 13.5), z0 = zE - coneL - Lf, db = 0.3 * D, cl = R + 36, s: Solid[] = [];
  s.push(...partSolids(c).filter(q => !q.name.startsWith('fire tubes')).map(q => ({ ...q, cut: false, name: `waste heat boiler: ${q.name}` })));
  s.push({ name: 'furnace chamber', mesh: at(shellRing(R, t, Lf), 0, 0, z0) }, { name: 'furnace rear cone', mesh: frustum(R, rd + t, zE - coneL, zE, t) }, { name: 'furnace front plate', mesh: cylZ(0, 0, R + 2, z0 - 1.5, z0, 64) }, { name: 'furnace weld seams', mesh: seamSolids(R, t, z0, Lf) });
  s.push(...burnerSolids(db).map(q => ({ ...q, name: `burner: ${q.name}`, mesh: transformMesh(q.mesh, multiply(translate(0, 0, z0 - 1.5), rotateY(Math.PI))) })));
  for (const f of [0.25, 0.75]) s.push(...saddleSolids(R, cl, z0 + f * Lf, Math.max(6, D / 3)).map(q => ({ ...q, name: `furnace ${q.name}` })));
  s.push(...radialOn(makeManway(`${tag}-M1`, { D: 24, cls: 'P150', shellT: t, shellR: R }), R, z0 + 0.7 * Lf, Math.PI / 2, 'furnace manway'), ...radialOn(noz(`${tag}-T1`, 2, t, R), R, z0 + 0.3 * Lf, 0, 'furnace thermowell nozzle'), ...radialOn(noz(`${tag}-T2`, 2, t, R), R, z0 + 0.6 * Lf, 0, 'furnace thermowell nozzle'), ...radialOn(noz(`${tag}-SP`, 3, t, R, { blind: true }), R, z0 + 0.15 * Lf, Math.PI / 2, 'sight port'));
  return equip(tag, 'PROCESS_UNIT', `${tag} sulfur plant reaction furnace ${D}" × ${(Lf / 12).toFixed(0)}' with waste heat boiler ${(Lb / 12).toFixed(0)}'`, { D: drawing(D, 'Inside diameter'), furnaceL: drawing(Lf, 'Furnace chamber length'), boilerL: drawing(Lb, 'Boiler length between tubesheets'), burner: rule(db, 'SW-EQC-56', 'Burner throat (0.3 D)'), cone: rule(coneL, 'SW-EQC-56', 'Rear cone length (30°)'), duct: rule(0.5 * D, 'SW-EQC-37', 'Gas duct diameter (0.5 D)'), ...(inp.boilerT ? { boilerT: drawing(inp.boilerT, 'Waste heat boiler shell thickness (stated)') } : {}) }, Lf + Lb + 4 * coneL, s, ['Refractory is not drawn. The boiler\'s fire tubes are inside and are drawn on its own entry (SW-EQC-37).']);
}
export function makeSulfurCondenser(inp: { tag: string; ID: number; TT: number }): PartSpec {
  const { ID, TT, tag } = inp, t = 0.5, R = ID / 2 + t, cl = R + 60, e = makeShellTubeExchanger({ tag, ID, t, TT, centreline: cl }), s = [...partSolids(e)], z = TT - 12;
  s.push({ name: 'sulfur outlet 4 in', mesh: pipeRun([[0, -R + 1, z], [0, -cl + 30, z]], 4.5, 16) }, { name: 'seal pot', mesh: mergeMeshes([transformMesh(tube(9, 0.25, 36, 0), multiply(translate(0, -cl, z), rotateX(-Math.PI / 2))), cylY(0, z, 9, -cl, -cl + 0.25, 40), cylY(0, z, 9, -cl + 35.75, -cl + 36, 40)]) }, { name: 'seal pot overflow', mesh: pipeRun([[9, -cl + 28, z], [20, -cl + 28, z]], 3.5, 12) });
  return equip(tag, 'EXCHANGER', `${tag} sulfur condenser ${ID}" × ${(TT / 12).toFixed(0)}' with seal pot`, { ...e.dims, sealPotD: rule(18, 'SW-EQC-57', 'Seal pot diameter'), sealPotH: rule(36, 'SW-EQC-57', 'Seal pot height'), outlet: rule(4, 'SW-EQC-57', 'Sulfur outlet') }, e.length!.value, s, ['Steam jacketing of the sulfur line is not drawn.']);
}
// ---- SW-EQC-61: duct run --------------------------------------------------------------------------------------------------------------
export function makeDuctRun(id: string, a: number, b: number): PartSpec {
  const t = 0.1875, L1 = 72, zJ = L1 + 12, zD = zJ + 18, L2 = 48, zM = zD + L2 + b / 2, L3 = 60 + b / 2, s: Solid[] = [], frames: MeshData[] = [], stiff: MeshData[] = [];
  const frame = (z: number) => mergeMeshes([extrude({ outer: rect(-a / 2 - 3, -b / 2 - 3, a / 2 + 3, b / 2 + 3), inner: rect(-a / 2, -b / 2, a / 2, b / 2) }, 0.25, z - 0.125), rectTube(a + 0.5, b + 0.5, 0.25, 3, z - (z > 1 ? 3 : 0))]);
  for (const z of [0, L1, zJ, zD]) frames.push(frame(z));
  for (const z of [36, zD + 24]) stiff.push(frame(z));
  s.push({ name: 'duct PL3/16', role: 'sheet', mesh: mergeMeshes([rectTube(a, b, t, L1), rectTube(a, b, t, 18, zJ), orient(extrude({ outer: rect(-a / 2, -b / 2, a / 2, b / 2), inner: rect(-a / 2 + t, -b / 2 + t, a / 2 - t, b / 2 - t) }, zM - zD, zD, { end: { dx: 0, dy: -1 } }))]) });
  const up = frameFromAxes([0, 0, zM], [0, 0, -1], [0, 1, 0]);
  s[0].mesh = mergeMeshes([s[0].mesh, orient(transformMesh(extrude({ outer: rect(-a / 2, -b / 2, a / 2, b / 2), inner: rect(-a / 2 + t, -b / 2 + t, a / 2 - t, b / 2 - t) }, L3, 0, { start: { dx: 0, dy: 1 } }), up))]);
  frames.push(transformMesh(frame(L3), up)); stiff.push(transformMesh(frame(L3 - 30), up));
  s.push({ name: 'end frames L3x3x1/4', role: 'steel', mesh: mergeMeshes(frames) }, { name: 'stiffener frames L3x3x1/4', role: 'steel', mesh: mergeMeshes(stiff) }, { name: 'fabric expansion joint', role: 'polymer', mesh: rectTube(a + 3, b + 3, 0.5, 11.5, L1 + 0.25) });
  const n = Math.ceil(b / 9), bw = b / n, link: MeshData[] = [], blades: MeshData[] = [];
  for (let i = 0; i < n; i++) { const y = -b / 2 + (i + 0.5) * bw; blades.push(transformMesh(boxMesh(-a / 2 + 0.5, -bw / 2 + 0.25, -0.0625, a / 2 - 0.5, bw / 2 - 0.25, 0.0625), multiply(translate(0, y, zJ + 9), rotateX(Math.PI / 4)))); link.push(cylX(y, zJ + 9, 0.5, a / 2, a / 2 + 5, 10), boxMesh(a / 2 + 4, y - 0.25, zJ + 9, a / 2 + 4.5, y + 0.25, zJ + 13)); }
  link.push(boxMesh(a / 2 + 4.5, -b / 2 + bw / 2 - 1, zJ + 12.5, a / 2 + 5, b / 2 - bw / 2 + 1, zJ + 13.5));
  s.push({ name: `damper blades (${n})`, role: 'closure', mesh: mergeMeshes(blades) }, { name: 'damper shafts, link bar and lever', role: 'hardware', mesh: mergeMeshes(link) }, { name: 'damper actuator', role: 'machine', mesh: mergeMeshes([boxMesh(a / 2 + 5, -6, zJ + 4, a / 2 + 13, 6, zJ + 14)]) });
  return equip(id, 'PROCESS_UNIT', `Duct run ${a}" × ${b}" with elbow, expansion joint and damper`, { a: drawing(a, 'Duct width'), b: drawing(b, 'Duct height'), plate: rule(t, 'SW-EQC-61', 'Plate'), stiffeners: rule(36, 'SW-EQC-61', 'Stiffener frames at most'), joint: rule(12, 'SW-EQC-61', 'Fabric joint length'), damper: rule(18, 'SW-EQC-61', 'Damper length'), blades: rule(n, 'SW-EQC-61', 'Damper blades (9 in at most)', 'count') }, zM + b / 2, s);
}

// ======== vertical and site items: z up from grade ====================================================================================
// ---- SW-EQC-48: sphere ----------------------------------------------------------------------------------------------------------------
export function makeSphere(inp: { tag: string; D: number; /** a stated shell wall in place of the proportion (§72) */ t?: number }): PartSpec {
  const { D, tag } = inp, t = inp.t ?? thk(D, 200, 1), R = D / 2 + t, clear = Math.max(60, D / 6), zc = clear + R, n = Math.max(6, Math.round((Math.PI * D) / 150)), cOD = Math.ceil(D / 16 / 2) * 2, Rc = R * Math.cos((20 * Math.PI) / 180) + cOD / 2, rp = D / 8, zF = zc + R + 4, nO = seriesUp(Math.max(4, D / 40)), s: Solid[] = [];
  const arc = (r: number, k: number) => ({ r: Math.max(r * Math.cos(-Math.PI / 2 + (Math.PI * k) / 48), 0), z: r * Math.sin(-Math.PI / 2 + (Math.PI * k) / 48) });
  s.push({ name: 'shell', mesh: at(orient(revolve([...Array.from({ length: 49 }, (_, k) => arc(R, k)), ...Array.from({ length: 49 }, (_, k) => arc(R - t, 48 - k))], 96)), 0, 0, zc) });
  const cols: MeshData[] = [], bases: MeshData[] = [], rods: MeshData[] = [], bolts: MeshData[] = [], top = zc + 0.35 * cOD, zr = zc - 0.34 * R;
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n, a2 = (2 * Math.PI * (i + 1)) / n, x = Rc * Math.cos(a), y = Rc * Math.sin(a), rot = rotateZ(a);
    cols.push(at(tube(cOD / 2, 0.5, top - 1, 1), x, y, 0), at(cylZ(0, 0, cOD / 2, top, top + 0.5, 32), x, y, 0)); bases.push(transformMesh(boxMesh(Rc - cOD / 2 - 5, -cOD / 2 - 5, 0, Rc + cOD / 2 + 5, cOD / 2 + 5, 1), rot));
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) bolts.push(transformMesh(cylZ(Rc + sx * (cOD / 2 + 3), sy * (cOD / 2 + 3), 0.5, 0, 3, 8), rot));
    rods.push(sweep([[x, y, 12], [Rc * Math.cos(a2), Rc * Math.sin(a2), zr]], 0.75, 8), sweep([[Rc * Math.cos(a2), Rc * Math.sin(a2), 12], [x, y, zr]], 0.75, 8));
  }
  s.push({ name: `columns (${n} × ${cOD} in pipe)`, mesh: mergeMeshes(cols) }, { name: 'column base plates', role: 'steel', mesh: mergeMeshes(bases) }, { name: 'anchor bolts', role: 'hardware', mesh: mergeMeshes(bolts) }, { name: 'rod bracing 1-1/2 in', role: 'hardware', mesh: mergeMeshes(rods) });
  // crown platform
  const bars: MeshData[] = [], posts: MeshData[] = [], zs = (r: number) => zc + Math.sqrt(Math.max(R * R - r * r, 0));
  for (let y = -rp + 0.75; y < rp; y += 1.5) { const h = Math.sqrt(rp * rp - y * y); if (h > 1) bars.push(boxMesh(-h, y - 3 / 32, zF - 1.5, h, y + 3 / 32, zF)); }
  for (let x = -rp + 2; x < rp; x += 4) { const h = Math.sqrt(rp * rp - x * x); if (h > 1) bars.push(boxMesh(x - 0.125, -h, zF - 0.25, x + 0.125, h, zF)); }
  for (let i = 0; i < 8; i++) { const a = (Math.PI * (i + 0.5)) / 4, r = rp - 3; posts.push(member([r * Math.cos(a), r * Math.sin(a), zs(r) - 0.3], [r * Math.cos(a), r * Math.sin(a), zF - 1.5], P_L3, [0, 0, 1])); }
  posts.push(at(extrude({ outer: circle(0, 0, rp + 0.25, 64), inner: circle(0, 0, rp, 64) }, 8, 0), 0, 0, zF - 4));
  s.push({ name: 'crown platform grating (SW-GR-1)', role: 'galv', mesh: mergeMeshes(bars) }, { name: 'crown platform posts and kerb', role: 'steel', mesh: mergeMeshes(posts) }, { name: 'crown platform handrail', role: 'safety', mesh: ringRail(rp - 1.5, zF) });
  const crown = (p: PartSpec, x: number, y: number, label: string) => pointUp(p, x, y, zs(Math.hypot(x, y)) - 0.4, label);
  s.push(...crown(noz(`${tag}-RV1`, 6, t, undefined, { projection: 24 }), 0.35 * rp, 0.3 * rp, 'relief nozzle 1'), ...crown(noz(`${tag}-RV2`, 6, t, undefined, { projection: 24 }), 0.35 * rp, -0.3 * rp, 'relief nozzle 2'), ...crown(noz(`${tag}-V`, 2, t, undefined, { projection: 24 }), -0.1 * rp, 0.5 * rp, 'vent'),
    ...pointUp(makeManway(`${tag}-M1`, { D: 24, cls: 'P150', shellT: t }), -0.4 * rp, -0.1 * rp, zs(0.41 * rp) + 8, 'manway'), ...pointDown(noz(`${tag}-O`, nO, t), 0, 0, zc - R + 0.4, 'outlet nozzle'), ...pointDown(noz(`${tag}-D`, 2, t), 30, 0, zc - Math.sqrt(R * R - 900) + 0.4, 'drain'));
  // access: a spiral stair round the columns to the equator, then a stair over the crown
  const Rs = Rc + cOD / 2 + 3, st = spiralStair(Rs, 0, zc, -2.6), a0 = st.aEnd, da = 54 / (R + 20);
  s.push(...st.solids.map(q => ({ ...q, name: `spiral ${q.name}` })), ...ringPlatform(R, zc, a0 - 0.02, a0 + da, Rs + 33 - R - 1, [false, true]).map(q => ({ ...q, name: `equator landing: ${q.name}` })));
  const treads: MeshData[] = [], legs: MeshData[] = [], inner: V3[] = [], outer: V3[] = [], rail: MeshData[] = [], Rw = R + 19; let th = a0 + da / 2, z = zc, k = 0;
  while (true) {
    const dz0 = z - zc, rho = Math.sqrt(Math.max(Rw * Rw - dz0 * dz0, 1)); if (rho <= rp + 12 || k > 400) break;
    let dz = 8, dr = rho - Math.sqrt(Math.max(Rw * Rw - (dz0 + dz) ** 2, 1)), tang = 0;
    if (dr <= 10) tang = Math.sqrt(100 - dr * dr); else { dr = 10; dz = Math.sqrt(Math.max(Rw * Rw - (rho - 10) ** 2, 0)) - dz0; }
    z += dz; th += tang / rho; const r2 = rho - dr, psi = th + Math.atan2(tang, -dr), c: V3 = [r2 * Math.cos(th), r2 * Math.sin(th), z], ax: V3 = [-Math.sin(psi), Math.cos(psi), 0];
    treads.push(transformMesh(boxMesh(-5.5, -15, -1.25, 5.5, 15, 0), multiply(translate(c[0], c[1], c[2]), rotateZ(psi))));
    inner.push([c[0] - 15 * ax[0], c[1] - 15 * ax[1], z]); outer.push([c[0] + 15 * ax[0], c[1] + 15 * ax[1], z]);
    if (k % 4 === 0) { const f = (R - 0.3) / Math.hypot(c[0], c[1], z - zc); legs.push(sweep([[c[0] * f, c[1] * f, zc + (z - zc) * f], [c[0], c[1], z - 1.25]], 1, 8)); for (const q of [inner[inner.length - 1], outer[outer.length - 1]]) rail.push(cylZ(q[0], q[1], 0.95, z, z + 42, 8)); }
    k++;
  }
  for (const side of [inner, outer]) rail.push(sweep(side.map(q => [q[0], q[1], q[2] + 42] as V3), 0.95, 8), sweep(side.map(q => [q[0], q[1], q[2] + 21] as V3), 0.66, 8), sweep(side.map(q => [q[0], q[1], q[2] - 3] as V3), 1, 6));
  s.push({ name: `crown stair treads (${k})`, role: 'galv', mesh: mergeMeshes(treads) }, { name: 'crown stair posts to the shell', role: 'steel', mesh: mergeMeshes(legs) }, { name: 'crown stair handrail and stringers', role: 'safety', mesh: mergeMeshes(rail) });
  return equip(tag, 'TANK', `${tag} sphere ${(D / 12).toFixed(0)}' diameter on ${n} columns`, { D: drawing(D, 'Inside diameter'), t: inp.t ? drawing(t, 'Shell thickness (stated)') : rule(t, 'SW-EQC-48', 'Shell thickness (D / 200, 1 in least)'), columns: rule(n, 'SW-EQC-48', 'Columns (round(π D / 150 in), 6 least)', 'count'), columnOD: rule(cOD, 'SW-EQC-48', 'Column diameter (D / 16, to 2 in)'), clear: rule(clear, 'SW-EQC-48', 'Bottom pole above grade (D / 6, 60 in least)'), platform: rule(2 * rp, 'SW-EQC-48', 'Crown platform diameter (D / 4)'), outlet: rule(nO, 'SW-EQC-48', 'Outlet (D / 40, to the series)') }, zF + 42, s);
}
// ---- SW-EQC-49: cooling tower ---------------------------------------------------------------------------------------------------------
export function makeCoolingTower(inp: { tag: string; cells: number; cellL: number; cellW: number; H: number; riserNPS: number; motorD?: number }): PartSpec {
  const { cells: n, cellL: Lc, cellW: Wc, H, tag } = inp, Dm = inp.motorD ?? 18, L = n * Lc, zb = 60, zd = zb + H, hi = 0.3 * H, rs = 0.3 * Wc, hs = 0.25 * Wc, cy = MOTOR_SHAFT(Dm), pOD = pipeDims(inp.riserNPS, 'P150').OD, s: Solid[] = [];
  s.push({ name: 'basin (concrete, 48 in deep)', role: 'concrete', mesh: mergeMeshes([boxMesh(-36, -36, 0, L + 36, Wc + 36, 12), at(extrude({ outer: rect(-36, -36, L + 36, Wc + 36), inner: rect(-24, -24, L + 24, Wc + 24) }, 48, 0), 0, 0, 12)]) });
  const colM: MeshData[] = [], sheet: MeshData[] = [], louv: MeshData[] = [];
  for (let i = 0; i <= n; i++) for (const y of [0, Wc]) colM.push(member([i * Lc, y, 12], [i * Lc, y, zd], P_W8, [1, 0, 0]));
  for (const y of [0, Wc]) { colM.push(member([0, y, zb + hi], [L, y, zb + hi], P_W8, [0, 0, 1]), member([0, y, zd - 4], [L, y, zd - 4], P_W8, [0, 0, 1])); sheet.push(boxMesh(0, y - 0.125, zb + hi, L, y + 0.125, zd)); }
  for (const x of [0, L]) sheet.push(boxMesh(x - 0.125, 0, zb, x + 0.125, Wc, zd));
  for (let i = 1; i < n; i++) sheet.push(boxMesh(i * Lc - 0.125, 0, zb, i * Lc + 0.125, Wc, zd));
  for (const [y, sg] of [[0, -1], [Wc, 1]] as const) for (let z = zb + 8; z < zb + hi - 4; z += 12) louv.push(transformMesh(boxMesh(0, -7, -0.125, L, 7, 0.125), multiply(translate(0, y + sg * 5, z), rotateX(sg * -Math.PI / 4))));
  s.push({ name: 'frame W8', role: 'steel', mesh: mergeMeshes(colM) }, { name: 'casing sheet', role: 'sheet', mesh: mergeMeshes(sheet) }, { name: 'air inlet louvres', role: 'sheet', mesh: mergeMeshes(louv) }, { name: 'fan deck', role: 'steel', mesh: boxMesh(-6, -6, zd, L + 6, Wc + 6, zd + 0.375) });
  const stacks: MeshData[] = [], fans: MeshData[] = [], drive: MeshData[] = [], prof = [{ r: 1.1 * rs, z: 0 }, { r: rs, z: 0.3 * hs }, { r: rs, z: 0.7 * hs }, { r: 1.1 * rs, z: hs }, { r: 1.1 * rs - 0.25, z: hs }, { r: rs - 0.25, z: 0.7 * hs }, { r: rs - 0.25, z: 0.3 * hs }, { r: 1.1 * rs - 0.25, z: 0 }];
  const motorT = [1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1];   // shaft toward +y, feet down
  for (let i = 0; i < n; i++) {
    const xc = (i + 0.5) * Lc, yc = Wc / 2, zh = zd + 0.375 + cy, ym = yc - 1.1 * rs - 8;
    stacks.push(at(orient(revolve(prof, 64)), xc, yc, zd + 0.375));
    fans.push(cylZ(xc, yc, 0.06 * Wc, zh + 6, zh + 16, 32), ...Array.from({ length: 6 }, (_, k) => transformMesh(boxMesh(0.05 * Wc, -0.04 * Wc, -0.5, 0.275 * Wc, 0.04 * Wc, 0.5), multiply(translate(xc, yc, zh + 11), multiply(rotateZ((k * Math.PI) / 3), rotateX(0.3))))));
    drive.push(boxMesh(xc - 0.05 * Wc, yc - 0.05 * Wc, zd + 0.375, xc + 0.05 * Wc, yc + 0.05 * Wc, zh + 6), cylY(xc, zh, 1.5, ym, yc - 0.05 * Wc, 12));
    s.push(...motorSolids(Dm).solids.map(q => ({ ...q, name: `fan motor: ${q.name}`, mesh: transformMesh(q.mesh, multiply(translate(xc, ym, zd + 0.375), motorT)) })));
    drive.push(pipeRun([[xc, Wc - 36, zd + 20], [xc, Wc - 36, zd - 30]], pOD * 0.6, 12));
  }
  s.push({ name: 'fan stacks', role: 'sheet', mesh: mergeMeshes(stacks) }, { name: 'fans (six blades)', role: 'machine', mesh: mergeMeshes(fans) }, { name: 'gears, drive shafts and cell branches', role: 'steel', mesh: mergeMeshes(drive) });
  s.push({ name: `riser and distribution header ${inp.riserNPS} in`, mesh: pipeRun(bendPath([[-30, Wc - 36, 0], [-30, Wc - 36, zd + 20], [L - Lc / 2, Wc - 36, zd + 20]], 1.2 * pOD, 6), pOD, 16) });
  s.push({ name: 'deck guardrail', role: 'safety', mesh: mergeMeshes([straightRail([-4, -4, zd + 0.375], [L + 4, -4, zd + 0.375]), straightRail([L + 4, -4, zd + 0.375], [L + 4, Wc + 4, zd + 0.375]), straightRail([L + 4, Wc + 4, zd + 0.375], [-4, Wc + 4, zd + 0.375]), straightRail([-4, Wc + 4, zd + 0.375], [-4, -4, zd + 0.375])]) });
  s.push(...lift(ladderSolids(0, 0, 0, zd + 0.375), L + 6, 0.25 * Wc, 0));
  return equip(tag, 'PROCESS_UNIT', `${tag} cooling tower, ${n} cells ${(Lc / 12).toFixed(0)}' × ${(Wc / 12).toFixed(0)}', induced draft`, { cells: drawing(n, 'Cells', 'count'), cellL: drawing(Lc, 'Cell length'), cellW: drawing(Wc, 'Cell width'), H: drawing(H, 'Casing height'), riser: drawing(inp.riserNPS, 'Riser size'), basin: rule(48, 'SW-EQC-49', 'Basin depth'), inlet: rule(hi, 'SW-EQC-49', 'Air inlet height (0.3 H)'), stackD: rule(2 * rs, 'SW-EQC-49', 'Fan stack diameter (0.6 W)'), stackH: rule(hs, 'SW-EQC-49', 'Fan stack height (0.25 W)'), fanD: rule(0.55 * Wc, 'SW-EQC-49', 'Fan diameter (0.55 W)') }, L, s, ['Fill and drift eliminators are not drawn.']);
}
// ---- SW-EQC-53: cabin heater ----------------------------------------------------------------------------------------------------------
/** a trapezoid in the y–z plane (y0..y1 at z0 narrowing to ya..yb at z1) as a plate shell of thickness t along x from x0 to x1 */
const hipShell = (y0: number, y1: number, z0: number, ya: number, yb: number, z1: number, x0: number, x1: number, t: number): MeshData => transformMesh(extrude({ outer: [{ x: y0, y: z0 }, { x: y1, y: z0 }, { x: yb, y: z1 }, { x: ya, y: z1 }], inner: [{ x: y0 + 2 * t, y: z0 + t }, { x: y1 - 2 * t, y: z0 + t }, { x: yb - 2 * t, y: z1 - t }, { x: ya + 2 * t, y: z1 - t }] }, x1 - x0, x0), SHAFT_X_UP_Z);
export function makeCabinHeater(inp: { tag: string; L: number; W: number; H: number }): PartSpec {
  const { L, W: Wd, H, tag } = inp, zf = 84, zr = zf + H, zh = zr + 0.25 * Wd, zc = zh + 0.5 * H, t = 0.25, nb = Math.max(1, Math.round(L / (0.5 * Wd))), db = 0.12 * Wd, rs = 0.125 * Wd, Hs = 1.5 * H, nc = Math.ceil(L / 240), nk = Math.ceil(L / 96), s: Solid[] = [];
  const cols: MeshData[] = [], bases: MeshData[] = [], stays: MeshData[] = [], doors: MeshData[] = [];
  for (let i = 0; i <= nc; i++) for (const y of [4, Wd - 4]) { const x = Math.min(L - 4, Math.max(4, (L * i) / nc)); cols.push(member([x, y, 0.75], [x, y, zf - 8], P_W8, [0, 1, 0])); bases.push(boxMesh(x - 7, y - 7, 0, x + 7, y + 7, 0.75)); }
  for (const y of [4, Wd - 4]) cols.push(member([0, y, zf - 4], [L, y, zf - 4], P_W8, [0, 0, 1]));
  for (let i = 0; i <= nc; i++) { const x = Math.min(L - 4, Math.max(4, (L * i) / nc)); cols.push(member([x, 4, zf - 4.2], [x, Wd - 4, zf - 4.2], P_W8, [0, 0, 1])); }
  for (let i = 0; i <= nk; i++) for (const [y, sg] of [[0, -1], [Wd, 1]] as const) stays.push(member([(L * i) / nk, y + sg * 3.2, zf], [(L * i) / nk, y + sg * 3.2, zr], W6, [0, 1, 0]));
  for (let i = 0; i < nk; i++) doors.push(boxMesh((L * (i + 0.5)) / nk - 5, -1.2, zf + 48, (L * (i + 0.5)) / nk + 5, 0, zf + 60));
  s.push({ name: 'support columns and floor beams W8', role: 'steel', mesh: mergeMeshes(cols) }, { name: 'column base plates', role: 'steel', mesh: mergeMeshes(bases) });
  s.push({ name: 'radiant box casing', mesh: mergeMeshes([at(extrude({ outer: rect(0, 0, L, Wd), inner: rect(t, t, L - t, Wd - t) }, H, 0), 0, 0, zf), boxMesh(0, 0, zf - t, L, Wd, zf)]) }, { name: 'buckstays W6', role: 'steel', mesh: mergeMeshes(stays) }, { name: 'peep doors', role: 'closure', mesh: mergeMeshes(doors) });
  s.push({ name: 'hip', mesh: mergeMeshes([hipShell(0, Wd, zr, 0.3 * Wd, 0.7 * Wd, zh, 0, L, t)]) }, { name: 'convection section casing', mesh: mergeMeshes([at(extrude({ outer: rect(0, 0.3 * Wd, L, 0.7 * Wd), inner: rect(t, 0.3 * Wd + t, L - t, 0.7 * Wd - t) }, 0.5 * H, 0), 0, 0, zh), boxMesh(0, 0.3 * Wd, zc, L, 0.7 * Wd, zc + t)]) },
    { name: 'header boxes', role: 'steel', mesh: mergeMeshes([boxMesh(-12, 0.3 * Wd + 2, zh + 6, 0, 0.7 * Wd - 2, zc - 6), boxMesh(L, 0.3 * Wd + 2, zh + 6, L + 12, 0.7 * Wd - 2, zc - 6)]) });
  s.push({ name: 'breeching cone', mesh: at(frustum(0.19 * Wd, rs, 0, 0.3 * Wd, t), L / 2, Wd / 2, zc + t) }, { name: 'stack', mesh: at(mergeMeshes([tube(rs, t, Hs, 0), ...[0.33, 0.66, 1].map(f => at(extrude({ outer: circle(0, 0, rs + 3, 48), inner: circle(0, 0, rs, 48) }, 0.25, 0), 0, 0, f * Hs - 0.25))]), L / 2, Wd / 2, zc + t + 0.3 * Wd) });
  for (let i = 0; i < nb; i++) s.push(...burnerSolids(db).map(q => ({ ...q, name: `floor burner: ${q.name}`, mesh: transformMesh(q.mesh, multiply(translate((L * (i + 0.5)) / nb, Wd / 2, zf - t), rotateX(Math.PI))) })));
  // platform along the −y wall at the hip, with its ladder
  const bars: MeshData[] = [], br: MeshData[] = [];
  for (let y = -39.25; y < -3.5; y += 1.5) bars.push(boxMesh(0, y - 3 / 32, zr - 1.5, L, y + 3 / 32, zr));
  for (let x = 2; x < L; x += 4) bars.push(boxMesh(x - 0.125, -40, zr - 0.25, x + 0.125, -4, zr));
  for (let i = 0; i <= nk; i++) { const x = Math.min(L - 3, (L * i) / nk + 4); br.push(member([x, -6.5, zr - 1.55], [x, -40, zr - 1.55], P_L3, [0, 0, -1]), member([x, -36, zr - 4.6], [x, -6.5, zr - 34], P_L3, [1, 0, 0])); }
  s.push({ name: 'platform grating (SW-GR-1)', role: 'galv', mesh: mergeMeshes(bars) }, { name: 'platform brackets L3x3x1/4', role: 'steel', mesh: mergeMeshes(br) }, { name: 'platform handrail', role: 'safety', mesh: mergeMeshes([straightRail([0, -39, zr], [L, -39, zr]), straightRail([L, -39, zr], [L, -5, zr])]) });
  s.push(...towerAccess(-40, 120 - 4, 120, -Math.PI / 2, 0, zr).map(q => ({ ...q, name: `access: ${q.name}` })));
  return equip(tag, 'HEATER', `${tag} cabin heater, radiant box ${(L / 12).toFixed(0)}' × ${(Wd / 12).toFixed(0)}' × ${(H / 12).toFixed(0)}'`, { L: drawing(L, 'Radiant box length'), W: drawing(Wd, 'Radiant box width'), H: drawing(H, 'Radiant box height'), floor: rule(zf, 'SW-EQC-53', 'Floor above grade'), burners: rule(nb, 'SW-EQC-53', 'Floor burners (spacing W / 2)', 'count'), throat: rule(db, 'SW-EQC-53', 'Burner throat (0.12 W)'), hip: rule(0.25 * Wd, 'SW-EQC-53', 'Hip height (0.25 W)'), convW: rule(0.4 * Wd, 'SW-EQC-53', 'Convection width (0.4 W)'), convH: rule(0.5 * H, 'SW-EQC-53', 'Convection height (0.5 H)'), stackD: rule(2 * rs, 'SW-EQC-53', 'Stack diameter (0.25 W)'), stackH: rule(Hs, 'SW-EQC-53', 'Stack height (1.5 H)') }, zc + 0.3 * Wd + Hs, s, ['Tubes and refractory are not drawn.']);
}
// ---- SW-EQC-54: reformer furnace ------------------------------------------------------------------------------------------------------
export function makeReformer(inp: { tag: string; L: number; W: number; H: number }): PartSpec {
  const { L, W: Wd, H, tag } = inp, zf = 96, zr = zf + H, t = 0.25, nr = Math.max(1, Math.round(Wd / 96)), zt = zr + 36, zh = zt + 30, zm = zf - 24 - 6.375, nc = Math.ceil(L / 240), cw = 0.3 * Wd, rs = 0.1 * Wd, s: Solid[] = [];
  const cols: MeshData[] = [], tubes: MeshData[] = [], caps: MeshData[] = [], pig: MeshData[] = [], hdr: MeshData[] = [], man: MeshData[] = [], ring: Profile = { outer: circle(0, 0, 2.5, 10), inner: circle(0, 0, 2, 10) };
  for (let i = 0; i <= nc; i++) for (const y of [5, Wd - 5]) { const x = Math.min(L - 5, Math.max(5, (L * i) / nc)); cols.push(member([x, y, 0.75], [x, y, zf - 10], W10, [0, 1, 0]), boxMesh(x - 8, y - 8, 0, x + 8, y + 8, 0.75)); }
  for (const y of [5, Wd - 5]) cols.push(member([0, y, zf - 5], [L, y, zf - 5], W10, [0, 0, 1]));
  for (let i = 0; i <= nc; i++) { const x = Math.min(L - 5, Math.max(5, (L * i) / nc)); cols.push(member([x, 5, zf - 5.2], [x, Wd - 5, zf - 5.2], W10, [0, 0, 1])); }
  s.push({ name: 'support columns and floor beams W10', role: 'steel', mesh: mergeMeshes(cols) }, { name: 'furnace box casing', mesh: mergeMeshes([at(extrude({ outer: rect(0, 0, L, Wd), inner: rect(t, t, L - t, Wd - t) }, H, 0), 0, 0, zf), boxMesh(0, 0, zf - t, L, Wd, zf), boxMesh(0, 0, zr, L, Wd, zr + t)]) });
  let count = 0;
  for (let j = 0; j < nr; j++) {
    const y = (Wd * (j + 0.5)) / nr;
    for (let x = 24; x <= L - 24 + 0.01; x += 12) { count++; tubes.push(at(extrude(ring, zt - zm, 0), x, y, zm)); caps.push(cylZ(x, y, 4, zt, zt + 1, 12)); pig.push(sweep([[x, y + 3, zt - 4], [x, y + 9, zt + 2], [x, y + 12, zt + 14], [x, y + 14, zh - 4]], 0.66, 6)); }
    hdr.push(pipeRun([[12, y + 14, zh], [L - 12, y + 14, zh]], 8.625, 16)); man.push(pipeRun([[12, y, zm], [L + 36, y, zm]], 12.75, 16));
  }
  man.push(pipeRun([[L + 36, -24, zm], [L + 36, Wd + 24, zm]], 24, 20), transformMesh(ringFlange(12, 0, 3, 1.5), multiply(translate(L + 36, -24, zm), rotateX(Math.PI / 2))));
  s.push({ name: `catalyst tubes (${count} × 5 in)`, role: 'closure', mesh: mergeMeshes(tubes) }, { name: 'tube top flanges', role: 'closure', mesh: mergeMeshes(caps) }, { name: 'inlet pigtails 1 in', role: 'closure', mesh: mergeMeshes(pig) }, { name: 'inlet headers 8 in', mesh: mergeMeshes(hdr) }, { name: 'outlet manifolds 12 in and transfer line 24 in', mesh: mergeMeshes(man) });
  let burners = 0;
  for (let j = 0; j <= nr; j++) { const y = j === 0 ? 20 : j === nr ? Wd - 20 : (Wd * j) / nr; for (let x = 36; x <= L - 36 + 0.01; x += 48) { burners++; s.push(...burnerSolids(12).map(q => ({ ...q, name: `roof burner: ${q.name}`, mesh: at(q.mesh, x, y, zr + t) }))); } }
  s.push({ name: 'flue duct', mesh: mergeMeshes([transformMesh(rectTube(0.6 * Wd, 0.2 * H, t, 60), multiply(translate(-60, Wd / 2, zf + 0.1 * H), SHAFT_X_UP_Z))]) }, { name: 'convection section casing', mesh: mergeMeshes([at(extrude({ outer: rect(-60 - cw, 0, -60, Wd), inner: rect(-60 - cw + t, t, -60 - t, Wd - t) }, H - 0.75, 0), 0, 0, 0.75), boxMesh(-60 - cw, 0, H, -60, Wd, H + t)]) },
    { name: 'stack', mesh: at(mergeMeshes([frustum(Math.min(cw, 2.4 * rs) / 2, rs, 0, 0.2 * Wd, t), tube(rs, t, H, 0.2 * Wd), ...[0.5, 1].map(f => at(extrude({ outer: circle(0, 0, rs + 3, 48), inner: circle(0, 0, rs, 48) }, 0.25, 0), 0, 0, 0.2 * Wd + f * H - 0.25))]), -60 - cw / 2, Wd / 2, H + t) });
  s.push({ name: 'roof guardrail', role: 'safety', mesh: mergeMeshes([straightRail([2, 2, zr + t], [L - 2, 2, zr + t]), straightRail([L - 2, 2, zr + t], [L - 2, Wd - 2, zr + t]), straightRail([L - 2, Wd - 2, zr + t], [2, Wd - 2, zr + t]), straightRail([2, Wd - 2, zr + t], [2, 2, zr + t])]) }, ...towerAccess(L - 72, 120, 120, -Math.PI / 2, 0, zr + t).map(q => ({ ...q, name: `access: ${q.name}` })));
  return equip(tag, 'HEATER', `${tag} reformer furnace, top fired, ${(L / 12).toFixed(0)}' × ${(Wd / 12).toFixed(0)}' × ${(H / 12).toFixed(0)}', ${count} tubes`, { L: drawing(L, 'Box length'), W: drawing(Wd, 'Box width'), H: drawing(H, 'Box height'), rows: rule(nr, 'SW-EQC-54', 'Tube rows (round(W / 96 in))', 'count'), tubes: rule(count, 'SW-EQC-54', 'Catalyst tubes at 12 in pitch', 'count'), tubeOD: rule(5, 'SW-EQC-54', 'Tube outside diameter'), burners: rule(burners, 'SW-EQC-54', 'Roof burners at 48 in', 'count'), floor: rule(zf, 'SW-EQC-54', 'Floor above grade'), convW: rule(cw, 'SW-EQC-54', 'Convection section width (0.3 W)'), stackD: rule(2 * rs, 'SW-EQC-54', 'Stack diameter (0.2 W)') }, zh + 10, s, ['The penthouse over the headers, the catalyst and the refractory are not drawn.']);
}
// ---- SW-EQC-55: pressure swing adsorption unit -----------------------------------------------------------------------------------------
export function makePsaUnit(inp: { tag: string; ID: number; TT: number; beds?: number; /** a stated shell wall in place of the proportion (§72) */ t?: number }): PartSpec {
  const { ID, TT, tag } = inp, beds = inp.beds ?? 4, t = inp.t ?? thk(ID, 96, 0.5), R = ID / 2 + t, h = R / 2, skirtH = 60, pitch = 1.75 * 2 * R, nN = seriesUp(Math.max(2, ID / 8)), OD = pipeDims(nN, 'P150').OD, zt = skirtH + 2 * h + TT, ya = -(R + 30), yb = -(R + 30 + 2.5 * OD), zl = 24, zu = zt + 36, s: Solid[] = [];
  const pipes: MeshData[] = [], sup: MeshData[] = [];
  for (let i = 0; i < beds; i++) {
    const x = i * pitch, v = makeVerticalVessel({ tag: `${tag}-V${i + 1}`, ID, t, TT, skirtH });
    s.push(...lift(partSolids(v).map(q => ({ ...q, name: `bed ${i + 1}: ${q.name}` })), x, 0, 0), ...lift(pointUp(noz(`${tag}-T${i}`, nN, t), 0, 0, zt - 0.3, `bed ${i + 1} top nozzle`), x, 0, 0), ...lift(pointDown(noz(`${tag}-B${i}`, nN, t), 0, 0, skirtH + 0.3, `bed ${i + 1} bottom nozzle`), x, 0, 0));
    pipes.push(pipeRun(bendPath([[x, 0, skirtH - 12], [x, 0, zl], [x, yb, zl]], 1.5 * OD, 6), OD, 14), pipeRun(bendPath([[x, 0, zt + 12], [x, 0, zu], [x, yb, zu]], 1.5 * OD, 6), OD, 14));
    sup.push(member([x + OD, -R + 0.5, zu - OD / 2 - 1.6], [x + OD, yb - OD, zu - OD / 2 - 1.6], P_L3, [0, 0, -1]), member([x + OD, yb, zu - OD / 2 - 3], [x + OD, -R + 0.5, zu - OD / 2 - 3 + yb + R], P_L3, [1, 0, 0]), member([x + OD, ya - OD, 0], [x + OD, ya - OD, zl - OD / 2], W6, [1, 0, 0]), member([x + OD, yb - OD, 0], [x + OD, yb - OD, zl - OD / 2], W6, [1, 0, 0]), member([x + OD, yb - 1.5 * OD, zl - OD / 2 - 1.5], [x + OD, ya + OD, zl - OD / 2 - 1.5], P_L3, [0, 0, -1]));
  }
  const x0 = -pitch / 2, x1 = (beds - 1) * pitch + OD;
  for (const [y, z] of [[ya, zl], [yb, zl], [ya, zu], [yb, zu]] as const) pipes.push(pipeRun([[x0, y, z], [x1, y, z]], OD, 14), transformMesh(ringFlange(OD / 2, 0, 2.5, 1.25), multiply(translate(x0, y, z), rotateY(-Math.PI / 2))));
  s.push({ name: `headers and bed branches ${nN} in`, mesh: mergeMeshes(pipes) }, { name: 'header supports', role: 'steel', mesh: mergeMeshes(sup) });
  return equip(tag, 'PROCESS_UNIT', `${tag} pressure swing adsorption unit, ${beds} beds ${ID}" ID × ${(TT / 12).toFixed(0)}' T/T`, { ID: drawing(ID, 'Bed inside diameter'), TT: drawing(TT, 'Bed tangent length'), beds: inp.beds !== undefined ? drawing(beds, 'Beds', 'count') : rule(beds, 'SW-EQC-55', 'Beds', 'count'), t: inp.t ? drawing(t, 'Shell thickness (stated)') : rule(t, 'SW-EQC-55', 'Shell thickness (ID / 96, 1/2 least)'), pitch: rule(pitch, 'SW-EQC-55', 'Bed spacing (1.75 outside diameters)'), nozzle: rule(nN, 'SW-EQC-55', 'Head nozzles and headers (ID / 8, to the series)'), headers: rule(4, 'SW-EQC-55', 'Headers (two below, two above)', 'count') }, (beds - 1) * pitch + 2 * R, s, ['Switching valves are catalogue valves and are not drawn; adsorbent is not drawn.']);
}
// ---- SW-EQC-58: incinerator -----------------------------------------------------------------------------------------------------------
export function makeIncinerator(inp: { tag: string; D: number; L: number; stackH: number }): PartSpec {
  const { D, L, stackH: Hs, tag } = inp, t = 0.5, R = D / 2 + t, cl = R + 36, db = 0.3 * D, Ds = 0.6 * D, rd = 0.3 * D + t, coneL = (R - rd) / Math.tan(Math.PI / 6), xs = L + coneL + 0.75 * Ds + 24, loc: Solid[] = [];
  loc.push({ name: 'chamber shell', mesh: shellRing(R, t, L) }, { name: 'chamber front plate', mesh: cylZ(0, 0, R + 2, -1.5, 0, 64) }, { name: 'chamber weld seams', mesh: seamSolids(R, t, 0, L) }, { name: 'chamber rear cone', mesh: frustum(R, rd, L, L + coneL, t) }, { name: 'duct to the stack', mesh: tube(rd, t, xs - L - coneL - 0.3 * Ds, L + coneL) });
  loc.push(...burnerSolids(db).map(q => ({ ...q, name: `burner: ${q.name}`, mesh: transformMesh(q.mesh, multiply(translate(0, 0, -1.5), rotateY(Math.PI))) })), ...[0.2, 0.8].flatMap(f => saddleSolids(R, cl, f * L, Math.max(6, D / 3))));
  loc.push(...radialOn(noz(`${tag}-TG`, seriesUp(D / 6), t, R), R, 0.15 * L, 0, 'tail gas inlet nozzle'), ...radialOn(makeManway(`${tag}-M1`, { D: 24, cls: 'P150', shellT: t, shellR: R }), R, 0.6 * L, Math.PI / 2, 'manway'), ...radialOn(noz(`${tag}-T1`, 2, t, R), R, 0.5 * L, 0, 'thermowell nozzle'));
  const s: Solid[] = [...loc.map(q => ({ ...q, mesh: transformMesh(q.mesh, multiply(translate(0, 0, cl), SHAFT_X_UP_Z)) })), ...lift(stackSolids(Ds, Hs).map(q => ({ ...q, name: q.name.startsWith('stack') ? q.name : `stack ${q.name}` })), xs, 0, 0)];
  return equip(tag, 'PROCESS_UNIT', `${tag} incinerator ${D}" × ${(L / 12).toFixed(0)}' with stack ${(Hs / 12).toFixed(0)}'`, { D: drawing(D, 'Chamber inside diameter'), L: drawing(L, 'Chamber length'), stackH: drawing(Hs, 'Stack height'), burner: rule(db, 'SW-EQC-58', 'Burner throat (0.3 D)'), stackD: rule(Ds, 'SW-EQC-58', 'Stack diameter (0.6 D)'), cone: rule(coneL, 'SW-EQC-58', 'Rear cone length (30°)') }, xs + Ds, s, ['Refractory is not drawn.']);
}
// ---- SW-EQC-59: electrostatic precipitator --------------------------------------------------------------------------------------------
export function makePrecipitator(inp: { tag: string; L: number; W: number; H: number }): PartSpec {
  const { L, W: Wd, H, tag } = inp, nf = Math.max(1, Math.round(L / 144)), a = L / nf, b = Wd / 2, hh = 0.6 * Math.max(a, b), z0 = 96 + hh, zr = z0 + H, t = 0.25, tl = 0.4 * L, s: Solid[] = [];
  const hop: MeshData[] = [], cols: MeshData[] = [], ribs: MeshData[] = [], roof: MeshData[] = [], tr: MeshData[] = [];
  for (let i = 0; i < nf; i++) for (const j of [0, 1]) hop.push(at(pyramid(a, b, 0, 12, 12, -hh, t), (i + 0.5) * a, (j + 0.5) * b, z0), at(extrude({ outer: rect(-9, -9, 9, 9), inner: rect(-6, -6, 6, 6) }, 0.75, 0), (i + 0.5) * a, (j + 0.5) * b, 96 - 0.75));
  for (let i = 0; i <= nf; i++) for (const y of [0, b, Wd]) cols.push(member([i * a, y, 0.75], [i * a, y, z0], W10, [1, 0, 0]), boxMesh(i * a - 8, y - 8, 0, i * a + 8, y + 8, 0.75));
  for (const y of [0, Wd]) cols.push(sweep([[0, y, 4], [a, y, z0 - hh]], 0.5, 8), sweep([[a, y, 4], [0, y, z0 - hh]], 0.5, 8));
  for (const x of [0, L]) cols.push(sweep([[x, 0, 4], [x, b, z0 - hh]], 0.5, 8), sweep([[x, b, 4], [x, 0, z0 - hh]], 0.5, 8));
  for (let x = 0; x <= L + 0.01; x += L / Math.ceil(L / 48)) for (const [y, sg] of [[0, -1], [Wd, 1]] as const) ribs.push(boxMesh(x - 0.125, Math.min(y, y + sg * 4), z0, x + 0.125, Math.max(y, y + sg * 4), zr));
  s.push({ name: `hoppers (${2 * nf}) and outlet flanges`, mesh: mergeMeshes(hop) }, { name: 'support columns W10 and bracing', role: 'steel', mesh: mergeMeshes(cols) }, { name: 'casing', mesh: mergeMeshes([at(extrude({ outer: rect(0, 0, L, Wd), inner: rect(t, t, L - t, Wd - t) }, H, 0), 0, 0, z0), boxMesh(0, 0, zr, L, Wd, zr + t)]) }, { name: 'casing stiffeners', role: 'steel', mesh: mergeMeshes(ribs) });
  const inT = [0, -1, 0, 0, 0, 0, 1, 0, -1, 0, 0, 0, 0, 0, 0, 1];   // local z → −x, x → −y, y → z
  s.push({ name: 'inlet transition', mesh: transformMesh(mergeMeshes([pyramid(0.8 * Wd, 0.8 * H, 0, 0.4 * Wd, 0.4 * H, tl, t), extrude({ outer: rect(-0.2 * Wd - 3, -0.2 * H - 3, 0.2 * Wd + 3, 0.2 * H + 3), inner: rect(-0.2 * Wd, -0.2 * H, 0.2 * Wd, 0.2 * H) }, 0.5, tl)]), multiply(translate(0, Wd / 2, z0 + H / 2), inT)) },
    { name: 'outlet transition', mesh: transformMesh(mergeMeshes([pyramid(0.8 * Wd, 0.8 * H, 0, 0.4 * Wd, 0.4 * H, tl, t), extrude({ outer: rect(-0.2 * Wd - 3, -0.2 * H - 3, 0.2 * Wd + 3, 0.2 * H + 3), inner: rect(-0.2 * Wd, -0.2 * H, 0.2 * Wd, 0.2 * H) }, 0.5, tl)]), multiply(translate(L, Wd / 2, z0 + H / 2), SHAFT_X_UP_Z)) });
  for (let i = 0; i < nf; i++) { const x = (i + 0.5) * a; for (const y of [0.2 * Wd, 0.8 * Wd]) roof.push(boxMesh(x - 12, y - 12, zr + t, x + 12, y + 12, zr + 30)); tr.push(boxMesh(x - 18, Wd / 2 - 15, zr + t + 4, x + 18, Wd / 2 + 15, zr + 44), cylZ(x, Wd / 2, 4, zr + 44, zr + 56, 16), boxMesh(x - 20, Wd / 2 - 17, zr + t, x + 20, Wd / 2 + 17, zr + t + 4)); }
  s.push({ name: 'insulator compartments', role: 'steel', mesh: mergeMeshes(roof) }, { name: 'transformer-rectifiers', role: 'machine', mesh: mergeMeshes(tr) }, { name: 'roof guardrail', role: 'safety', mesh: mergeMeshes([straightRail([2, 2, zr + t], [L - 2, 2, zr + t]), straightRail([L - 2, 2, zr + t], [L - 2, Wd - 2, zr + t]), straightRail([L - 2, Wd - 2, zr + t], [2, Wd - 2, zr + t]), straightRail([2, Wd - 2, zr + t], [2, 2, zr + t])]) },
    ...towerAccess(L - 60, 120 - 4, 120, -Math.PI / 2, 0, zr + t).map(q => ({ ...q, name: `access: ${q.name}` })));
  return equip(tag, 'PROCESS_UNIT', `${tag} electrostatic precipitator ${(L / 12).toFixed(0)}' × ${(Wd / 12).toFixed(0)}' × ${(H / 12).toFixed(0)}', ${nf} fields`, { L: drawing(L, 'Casing length'), W: drawing(Wd, 'Casing width'), H: drawing(H, 'Casing height'), fields: rule(nf, 'SW-EQC-59', 'Fields (round(L / 144 in))', 'count'), hoppers: rule(2 * nf, 'SW-EQC-59', 'Hoppers (two across per field)', 'count'), hopperH: rule(hh, 'SW-EQC-59', 'Hopper height (0.6 of its plan side)'), clear: rule(96, 'SW-EQC-59', 'Clear under the hopper outlets'), transition: rule(tl, 'SW-EQC-59', 'Transition length (0.4 L)') }, L + 2 * tl, s, ['Plates, electrodes and rappers are not drawn.']);
}
// ---- SW-EQC-60: vent silencer ---------------------------------------------------------------------------------------------------------
export function makeVentSilencer(id: string, D: number): PartSpec {
  const t = 0.25, R = D / 2 + t, nI = seriesUp(D / 3), pd = pipeDims(nI, 'P150'), n = noz(`${id}-I`, nI, t), Ln = n.length!.value, zc = Ln, hc = 0.5 * D, zb = zc + hc, zt = zb + 3 * D, s: Solid[] = [];
  s.push(...pointDown(n, 0, 0, zc + 0.3, 'inlet nozzle'), { name: 'inlet cone', mesh: frustum(pd.OD / 2 + t, R, zc, zb, t) }, { name: 'shell', mesh: tube(R, t, 3 * D, zb) }, { name: 'shell rings', mesh: mergeMeshes([zb, zb + 1.5 * D, zt - 2].map(z => at(extrude({ outer: circle(0, 0, R + 2, 64), inner: circle(0, 0, R, 64) }, 0.375, 0), 0, 0, z))) });
  s.push({ name: 'absorber core (top seen)', role: 'closure', mesh: tube(0.6 * R, 0.1, 2, zt - 2.5) }, { name: 'weather hood', mesh: at(orient(revolve([{ r: 0, z: 0.3 * D }, { r: 0.65 * D, z: 0 }, { r: 0.65 * D, z: -0.1875 }, { r: 0, z: 0.3 * D - 0.1875 }], 48)), 0, 0, zt + 0.35 * D) }, { name: 'hood posts', mesh: mergeMeshes([0, 1, 2, 3].map(i => transformMesh(boxMesh(R - 1, -1, zt - 6, R + 1, 1, zt + 0.35 * D + 0.06 * D), rotateZ(Math.PI / 4 + (i * Math.PI) / 2)))) });
  s.push(...lift(partSolids(makeSupportLugs(`${id}-L`, R)).map(q => ({ ...q, name: `support lugs: ${q.name}` })), 0, 0, zb + 1.5 * D - 14), ...onShell(noz(`${id}-D`, 1, t, R, { projection: 4 }), R, Math.PI / 4, zb + 4, 'drain'));
  return equip(id, 'PROCESS_UNIT', `Vent silencer ${D}" dia × ${(3 * D / 12).toFixed(0)}'`, { D: drawing(D, 'Diameter'), H: rule(3 * D, 'SW-EQC-60', 'Body height (3 D)'), inlet: rule(nI, 'SW-EQC-60', 'Inlet (D / 3, to the series)'), cone: rule(hc, 'SW-EQC-60', 'Inlet cone height (0.5 D)'), lugs: rule(4, 'SW-EQC-60', 'Support lugs at mid-height', 'count') }, zt + 0.65 * D, s, ['The absorber is inside and not drawn.']);
}
// ---- SW-EQC-62: multi-bed reactor -----------------------------------------------------------------------------------------------------
const KEEP = /^(weld seams|lifting lug|nameplate|earthing lug|skirt opening frame|skirt vent|anchor chairs|anchor rods)/;
/** platforms and ladders at the listed floors on a shell whose outer radius is Rz(z) (SW-EQC-27, -28) */
function accessAt(Rz: (z: number) => number, floors: number[]): Solid[] {
  const out: Solid[] = [], half = (135 * Math.PI) / 180;
  floors.forEach((z, k) => {
    const side = k % 2 ? -1 : 1, R = Rz(z), Rl = Math.max(R, k ? Rz(floors[k - 1]) : R);
    out.push(...ringPlatform(R, z, -half, half, 36, [side < 0, side > 0]).map(q => ({ ...q, name: `platform ${k + 1}: ${q.name}` })), ...ladderSolids(Rl, side * (half + 16 / (Rl + 7)), k ? floors[k - 1] : 0, z).map(q => ({ ...q, name: `ladder ${k + 1}: ${q.name}` })));
  });
  return out;
}
export function makeMultiBedReactor(inp: { tag: string; ID: number; TT: number; t: number; skirtH: number; beds?: number }): PartSpec {
  const { ID, TT, t, skirtH, tag } = inp, beds = inp.beds ?? 3, v = makeVerticalVessel({ tag, ID, t, TT, skirtH }), R = ID / 2 + t, h = R / 2, zTL = skirtH + h, zTop = zTL + TT, hb = TT / beds, nN = seriesUp(Math.max(2, ID / 8)), OD = pipeDims(nN, 'P150').OD, s: Solid[] = [...partSolids(v)];
  s.push(...dressVessel(tag, { ID, t, TT, skirtH, emptyKips: v.weight.value / 1000 }).filter(q => KEEP.test(q.name)));
  const inlet = noz(`${tag}-N1`, nN, t, undefined, { projection: 10 }), zi = zTop + h - 0.3 + inlet.length!.value;
  s.push(...pointUp(inlet, 0, 0, zTop + h - 0.3, 'inlet nozzle'), { name: 'inlet elbow and spool', mesh: pipeRun(bendPath([[0, 0, zi], [0, 0, zi + 2 * OD], [-R - 24, 0, zi + 2 * OD]], 1.5 * OD, 8), OD, 16) }, ...pointDown(noz(`${tag}-N2`, nN, t), 0, 0, zTL - h + 0.3, 'outlet nozzle'));
  const targets: number[] = [];
  for (let k = 1; k < beds; k++) { const z = zTL + k * hb; targets.push(z - 36); s.push(...onShell(makeManway(`${tag}-M${k}`, { D: 24, cls: 'P150', shellT: t, shellR: R }), R, 0, z, `bed manway ${k}`), ...onShell(noz(`${tag}-Q${k}`, 4, t, R), R, Math.PI, z, `quench nozzle ${k}`)); }
  for (let k = 0; k < beds; k++) { s.push(...onShell(noz(`${tag}-CD${k}`, 6, t, R, { blind: true }), R, 0.9, zTL + k * hb + 14, `catalyst dump nozzle ${k + 1}`)); for (const [j, a] of [0.5, 2.7, -1.7].entries()) s.push(...onShell(noz(`${tag}-TW${k}${j}`, 2, t, R, { projection: 6 }), R, a, zTL + (k + 0.5) * hb, 'thermowell nozzle')); }
  targets.push(zTop - 6);
  const floors = floorsThrough(targets, 0);
  s.push(...accessAt(() => R, floors));
  return equip(tag, 'REACTOR', `${tag} multi-bed reactor ${ID}" ID × ${(TT / 12).toFixed(0)}' T/T, ${beds} beds, t ${t}"`, { ...v.dims, beds: inp.beds !== undefined ? drawing(beds, 'Beds', 'count') : rule(beds, 'SW-EQC-62', 'Beds', 'count'), bedH: rule(hb, 'SW-EQC-62', 'Bed height (equal)'), inlet: rule(nN, 'SW-EQC-62', 'Inlet and outlet (ID / 8, to the series)'), quench: rule(4, 'SW-EQC-62', 'Quench nozzles between beds'), dump: rule(6, 'SW-EQC-62', 'Catalyst dump nozzles'), platforms: rule(floors.length, 'SW-EQC-62', 'Platforms (15 ft apart at most)', 'count') }, zi + 2 * OD, s, ['Catalyst, bed supports and quench internals are not drawn.']);
}
// ---- SW-EQC-65: swaged tower ----------------------------------------------------------------------------------------------------------
export function makeSwagedTower(inp: { tag: string; sections: [number, number][]; t?: number; skirtH: number }): PartSpec {
  const { tag, skirtH } = inp, t = inp.t ?? 0.625, sec = inp.sections, Rk = sec.map(q => q[0] / 2 + t), zTL = skirtH + Rk[0] / 2, s: Solid[] = [], zone: { a: number; b: number; R: number }[] = [], cone: { a: number; b: number; R0: number; R1: number }[] = [];
  if (sec.length !== 3) throw new Error('SW-EQC-65: three shells, bottom to top');
  let z = zTL;
  sec.forEach(([, Lk], k) => { zone.push({ a: z, b: z + Lk, R: Rk[k] }); z += Lk; if (k < 2) { const c = Math.abs(Rk[k + 1] - Rk[k]) / Math.tan(Math.PI / 6); cone.push({ a: z, b: z + c, R0: Rk[k], R1: Rk[k + 1] }); z += c; } });
  const zTop = z, Rz = (zz: number) => { for (const q of zone) if (zz >= q.a - 1e-6 && zz <= q.b + 1e-6) return q.R; for (const c of cone) if (zz > c.a && zz < c.b) return Math.max(c.R0, c.R1); return zz < zTL ? Rk[0] : Rk[2]; };
  zone.forEach((q, k) => s.push({ name: `shell ${k + 1}`, mesh: at(shellRing(q.R, t, q.b - q.a), 0, 0, q.a) }, { name: 'weld seams', mesh: seamSolids(q.R, t, q.a, q.b - q.a) }));
  cone.forEach((c, k) => s.push({ name: `cone ${k + 1}`, mesh: frustum(c.R0, c.R1, c.a, c.b, t) }));
  s.push({ name: 'bottom head', mesh: at(orient(revolve(headLoop(Rk[0], t, -1), 64)), 0, 0, zTL) }, { name: 'top head', mesh: at(orient(revolve(headLoop(Rk[2], t, 1), 64)), 0, 0, zTop) }, { name: 'skirt', mesh: tube(Rk[0], 0.375, skirtH + 2, 0) }, { name: 'base ring', mesh: at(extrude({ outer: circle(0, 0, Rk[0] + 6, 64), inner: circle(0, 0, Rk[0] - 0.375, 64) }, 0.75, 0), 0, 0, -0.75) });
  s.push(...dressVessel(tag, { ID: sec[0][0], t, TT: sec[0][1], skirtH, emptyKips: 100, rods: Math.max(8, Math.ceil((2 * Math.PI * Rk[0]) / 30)) }).filter(q => /^(nameplate|earthing lug|skirt opening frame|skirt vent|anchor chairs|anchor rods)/.test(q.name)));
  const nO = seriesUp(Math.min(24, sec[2][0] / 3)), nF = seriesUp(Math.min(24, sec[1][0] / 4)), nB = seriesUp(Math.max(2, sec[0][0] / 8));
  s.push(...pointUp(noz(`${tag}-OH`, nO, t), 0, 0, zTop + Rk[2] / 2 - 0.3, 'overhead nozzle'), ...onShell(noz(`${tag}-F`, nF, t, Rk[1], { projection: 12 }), Rk[1], Math.PI, zone[1].a + 36, 'feed nozzle'), ...pointDown(noz(`${tag}-B`, nB, t), 0, 0, zTL - Rk[0] / 2 + 0.3, 'bottoms nozzle'));
  [0.4, 0.75].forEach((f, k) => s.push(...onShell(noz(`${tag}-SD${k}`, 6, t, Rk[1]), Rk[1], Math.PI, zone[1].a + f * (zone[1].b - zone[1].a), `side draw ${k + 1}`)));
  s.push(...onShell(noz(`${tag}-SD2`, 6, t, Rk[2]), Rk[2], Math.PI, zone[2].a + 0.5 * (zone[2].b - zone[2].a), 'side draw 3'));
  const targets = zone.flatMap(q => (q.b - q.a > 60 ? [q.a + 24, q.b - 12] : [q.a + 24])), floors = floorsThrough(targets, 0).map(f => { const c = cone.find(q => f > q.a - 1 && f < q.b + 1); return c ? c.b + 12 : f; });
  s.push(...accessAt(Rz, floors));
  floors.forEach((f, k) => { const R = Rz(f); if (zone.some(q => f + 36 > q.a + 20 && f + 36 < q.b - 20)) s.push(...onShell(makeManway(`${tag}-M${k + 1}`, { D: 24, cls: 'P150', shellT: t, shellR: R }), R, 0, f + 36, `manway ${k + 1}`)); });
  return equip(tag, 'COLUMN', `${tag} swaged tower ${sec.map(q => `${q[0]}"`).join(' / ')} ID, ${((zTop - zTL) / 12).toFixed(0)}' T/T with ${floors.length} platforms`, {
    D1: drawing(sec[0][0], 'Bottom shell inside diameter'), L1: drawing(sec[0][1], 'Bottom shell length'), D2: drawing(sec[1][0], 'Middle shell inside diameter'), L2: drawing(sec[1][1], 'Middle shell length'), D3: drawing(sec[2][0], 'Top shell inside diameter'), L3: drawing(sec[2][1], 'Top shell length'), skirtH: drawing(skirtH, 'Skirt height'),
    t: inp.t !== undefined ? drawing(t, 'Shell thickness') : rule(t, 'SW-EQC-65', 'Shell thickness'), cone1: rule(cone[0].b - cone[0].a, 'SW-EQC-65', 'Lower cone length (30° to the axis)'), cone2: rule(cone[1].b - cone[1].a, 'SW-EQC-65', 'Upper cone length (30° to the axis)'), overhead: rule(nO, 'SW-EQC-65', 'Overhead nozzle (D3 / 3, 24 in at most)'), feed: rule(nF, 'SW-EQC-65', 'Feed nozzle (D2 / 4)'), bottoms: rule(nB, 'SW-EQC-65', 'Bottoms nozzle (D1 / 8)'),
    platforms: rule(floors.length, 'SW-EQC-32', 'Platforms', 'count'), spacing: rule(180, 'SW-EQC-28', 'Platform spacing at most'),
  }, zTop + Rk[2] / 2 + 42, s, ['Trays and packing are not drawn.'], );
}
