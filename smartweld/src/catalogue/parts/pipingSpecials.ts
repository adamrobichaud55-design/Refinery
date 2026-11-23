/**
 * Piping specials: DESIGN_BASIS.md §70 (SW-PSP-*). Catalogue items only: not in the plants, the ground truth or the PCF
 * mapping. In-line items lie along z from one end face (z = 0) to the other; y is up. SmartWeld's own proportions (P-75).
 */
import { drawing, rule } from '../../core/basis';
import type { PartSpec } from '../part';
import { extrude, revolve, transformMesh, mergeMeshes, signedVolume, type MeshData } from '../../geometry/mesh';
import { circle, annularSector } from '../../geometry/polygon';
import { translate, multiply, rotateX, rotateZ, frameFromAxes } from '../../geometry/transform';
import { pipeDims, designFlange, type PipeClass, type FlangeDesign } from './pipe';
import { sweep, boxMesh, orient, hexNut, curvedPad, type V3 } from './detailKit';
import { done, cylZ, cylX, cylY, tube, at, flangeSolids, flangeLen, NOZZLE_UP, type Solid } from './equipmentKit';
import { member, frustum, hollowSweep, P_L3 } from './processUnits';

const N = 48;
/** roles that are not metal: left out of the weight (SW-PSP-18) */
const NOT_METAL = new Set(['grout', 'polymer']);
function piping(p: PartSpec, kind: PartSpec['kind'] = 'FITTING'): PartSpec {
  const solids = p.extra!.solids as Solid[], metal = solids.filter(s => !NOT_METAL.has(s.role ?? '')).reduce((a, s) => a + signedVolume(s.mesh), 0);
  return { ...p, kind, category: 'piping', weight: rule((metal * p.dims.rho.value) / 1728, 'SW-PSP-18', 'Weight of the drawn metal', 'lb'), notes: p.notes.filter(n => !n.startsWith('Envelope only')) };
}
/** the two end flanges of an in-line item of face-to-face length FF (faces at z = 0 and z = FF) */
const endFlanges = (f: FlangeDesign, FF: number, role: Solid['role'] = 'casting'): Solid[] => [...flangeSolids(f, 'inlet flange').map(s => ({ ...s, role })), ...flangeSolids(f, 'outlet flange').map(s => ({ ...s, role, mesh: transformMesh(s.mesh, multiply(translate(0, 0, FF), rotateX(Math.PI))) }))];
/** hex nuts on a circle of radius r about the z axis at height z (bolting of a cover) */
const boltCircle = (r: number, z: number, n: number, d: number): MeshData => mergeMeshes(Array.from({ length: n }, (_, i) => { const a = (2 * Math.PI * (i + 0.5)) / n; return at(hexNut(d), r * Math.cos(a), r * Math.sin(a), z); }));
/** a body about the z axis laid along +y (a vertical body in a horizontal line) */
const standY = (m: MeshData, x = 0, y = 0, z = 0): MeshData => transformMesh(m, multiply(translate(x, y, z), rotateX(-Math.PI / 2)));
/** SW-PSP-5/-6: a bellows about z from z0: n convolutions of the pitch on a mean radius rm */
function bellows(rm: number, pitch: number, n: number, z0: number): MeshData {
  const h = 0.6 * pitch, w = 0.0625, k = 8, out: { r: number; z: number }[] = [], inn: { r: number; z: number }[] = [];
  for (let i = 0; i <= n * k; i++) { const z = z0 + (i * pitch) / k, r = rm + (h / 2) * (1 - Math.cos((2 * Math.PI * i) / k)); out.push({ r, z }); inn.push({ r: r - w, z }); }
  return orient(revolve([...out, ...inn.reverse()], N));
}

export function makeYStrainer(id: string, NPS: number, cls: PipeClass): PartSpec {
  const pd = pipeDims(NPS, cls), f = designFlange(NPS, cls), Lf = flangeLen(f), OD = pd.OD, FF = 2 * Lf + 2.5 * OD, zc = FF / 2 - 0.2 * OD, c = Math.SQRT1_2, L = 1.6 * OD, e: V3 = [0, -L * c, zc + L * c], u: V3 = [0, -c, c];
  const s: Solid[] = [...endFlanges(f, FF), { name: 'body', role: 'casting', mesh: tube(0.75 * OD, 0.25 * OD, FF - 2 * Lf + 0.4, Lf - 0.2) },
    { name: 'screen pocket', role: 'casting', mesh: member([0, 0, zc], e, { outer: circle(0, 0, 0.5 * OD + pd.t, N), inner: circle(0, 0, 0.5 * OD, N) }) },
    { name: 'pocket cover', role: 'casting', mesh: member(e, [e[0] + u[0] * 0.75, e[1] + u[1] * 0.75, e[2] + u[2] * 0.75], { outer: circle(0, 0, 0.8 * OD, N) }) },
    { name: 'cover bolts', role: 'hardware', mesh: transformMesh(boltCircle(0.66 * OD, 0.75, 6, Math.max(0.375, 0.08 * OD)), frameFromAxes(e, [1, 0, 0], u)) },
    { name: 'drain plug', role: 'hardware', mesh: transformMesh(hexNut(0.75), frameFromAxes([e[0] + u[0] * 0.75, e[1] + u[1] * 0.75, e[2] + u[2] * 0.75], [1, 0, 0], u)) }];
  return piping(done(id, 'FITTING', `Y strainer ${NPS}" ${cls} flanged`, { NPS: drawing(NPS, 'Size'), FF: rule(FF, 'SW-PSP-1', 'Face to face (2 flange lengths + 2.5 OD)'), bodyD: rule(1.5 * OD, 'SW-PSP-1', 'Body diameter (1.5 OD)'), pocket: rule(L, 'SW-PSP-1', 'Screen pocket length (1.6 OD) at 45°') }, FF, s));
}
export function makeBasketStrainer(id: string, NPS: number, cls: PipeClass): PartSpec {
  const pd = pipeDims(NPS, cls), f = designFlange(NPS, cls), Lf = flangeLen(f), OD = pd.OD, r = OD, FF = 2 * Lf + 2 * r + OD, zc = FF / 2, yn = 0.3 * OD, y0 = -1.9 * OD, y1 = 1.3 * OD, t = Math.max(0.25, pd.t);
  const s: Solid[] = [...endFlanges(f, FF), { name: 'body', role: 'casting', mesh: standY(tube(r, t, y1 - y0, 0), 0, y0, zc) }, { name: 'bottom', role: 'casting', mesh: standY(cylZ(0, 0, r, 0, t, N), 0, y0 - t, zc) },
    { name: 'body flange', role: 'casting', mesh: standY(extrude({ outer: circle(0, 0, r + 2, N), inner: circle(0, 0, r - t, N) }, 1, 0), 0, y1 - 1, zc) }, { name: 'cover', role: 'casting', mesh: standY(cylZ(0, 0, r + 2, 0, 1, N), 0, y1 + 0.06, zc) },
    { name: 'cover bolts', role: 'hardware', mesh: standY(boltCircle(r + 1, 1, 8, Math.max(0.5, 0.08 * OD)), 0, y1 + 0.06, zc) }, { name: 'cover handle', role: 'hardware', mesh: sweep([[-0.4 * OD, y1 + 1, zc], [-0.4 * OD, y1 + 3.5, zc], [0.4 * OD, y1 + 3.5, zc], [0.4 * OD, y1 + 1, zc]], 0.3125, 10) },
    { name: 'inlet nozzle', role: 'casting', mesh: cylZ(0, yn, OD / 2, Lf - 0.2, zc - r * 0.9) }, { name: 'outlet nozzle', role: 'casting', mesh: cylZ(0, yn, OD / 2, zc + r * 0.9, FF - Lf + 0.2) },
    { name: 'drain boss and plug', role: 'hardware', mesh: mergeMeshes([cylY(0, zc, 1, y0 - t - 2, y0 - t, 12), transformMesh(hexNut(0.75), multiply(translate(0, y0 - t - 2, zc), rotateX(Math.PI / 2)))]) },
    { name: 'legs L3x3x1/4', role: 'steel', mesh: mergeMeshes([0, 1, 2].map(i => { const a = 0.5 + (i * 2 * Math.PI) / 3; return member([(r + 0.2) * Math.cos(a), y0 + 4, zc + (r + 0.2) * Math.sin(a)], [(r + 3) * Math.cos(a), y0 - 14, zc + (r + 3) * Math.sin(a)], P_L3, [0, 0, 1]); })) }];
  for (const q of flangeSolids(f)) for (const [k, zz] of [[0, 0], [1, FF]] as const) s.push({ ...q, role: 'casting', name: `${k ? 'outlet' : 'inlet'} ${q.name} (raised)`, mesh: at(k ? transformMesh(q.mesh, multiply(translate(0, 0, zz), rotateX(Math.PI))) : q.mesh, 0, yn, 0) });
  const out = s.filter(q => !/^(inlet|outlet) flange (ring|raised face|hub and neck)$/.test(q.name));
  return piping(done(id, 'FITTING', `Basket strainer ${NPS}" ${cls} flanged`, { NPS: drawing(NPS, 'Size'), FF: rule(FF, 'SW-PSP-2', 'Face to face'), bodyD: rule(2 * OD, 'SW-PSP-2', 'Body diameter (2 OD)'), bodyH: rule(y1 - y0, 'SW-PSP-2', 'Body height (3.2 OD)') }, FF, out));
}
export function makeConeStrainer(id: string, NPS: number, cls: PipeClass): PartSpec {
  const pd = pipeDims(NPS, cls), f = designFlange(NPS, cls), ro = (f.BC - f.d) / 2 - 0.125, L = 1.5 * pd.OD;
  const s: Solid[] = [{ name: 'ring PL1/8', role: 'closure', mesh: extrude({ outer: circle(0, 0, ro, N), inner: circle(0, 0, pd.D / 2, N) }, 0.125, 0) }, { name: 'handle tab', role: 'closure', mesh: boxMesh(-0.75, ro - 0.2, 0, 0.75, f.OD / 2 + 2.5, 0.125) },
    { name: 'cone of perforated plate', role: 'closure', mesh: frustum(pd.D / 2, 0.35, 0.125, L, 0.0625, N) }];
  return piping(done(id, 'FITTING', `Temporary cone strainer ${NPS}" ${cls}`, { NPS: drawing(NPS, 'Size'), ring: rule(2 * ro, 'SW-PSP-3', 'Ring diameter (inside the bolt circle)'), cone: rule(L, 'SW-PSP-3', 'Cone length (1.5 OD)') }, L, s, ['Perforations are not drawn.']));
}
export function makeSteamTrap(id: string, NPS: number, cls: PipeClass, type: 'disc' | 'bucket' = 'disc'): PartSpec {
  const pd = pipeDims(NPS, cls), w = Math.max(1.5, 2.2 * pd.OD), FF = (type === 'disc' ? 2.4 : 3.4) * w, zm = FF / 2, s: Solid[] = [];
  s.push({ name: 'inlet end (threaded)', role: 'casting', mesh: cylZ(0, 0, 0.75 * pd.OD, 0, zm - 0.6 * w, 24) }, { name: 'outlet end (threaded)', role: 'casting', mesh: cylZ(0, 0, 0.75 * pd.OD, zm + 0.6 * w, FF, 24) }, { name: 'end hexes', role: 'casting', mesh: mergeMeshes([extrude({ outer: circle(0, 0, 0.95 * pd.OD, 6) }, 0.25 * w, 0), extrude({ outer: circle(0, 0, 0.95 * pd.OD, 6) }, 0.25 * w, FF - 0.25 * w)]) });
  if (type === 'disc') s.push({ name: 'body', role: 'casting', mesh: boxMesh(-w / 2, -w / 2, zm - 0.6 * w, w / 2, w / 2, zm + 0.6 * w) }, { name: 'cap', role: 'closure', mesh: standY(extrude({ outer: circle(0, 0, 0.45 * w, 6) }, 0.5 * w, 0), 0, w / 2, zm) }, { name: 'nameplate', role: 'nameplate', mesh: boxMesh(w / 2, -0.25 * w, zm - 0.4 * w, w / 2 + 0.03, 0.25 * w, zm + 0.4 * w) });
  else s.push({ name: 'head', role: 'casting', mesh: boxMesh(-w / 2, -0.4 * w, zm - 0.6 * w, w / 2, 0.5 * w, zm + 0.6 * w) }, { name: 'body', role: 'casting', mesh: standY(cylZ(0, 0, w, 0, 2.5 * w, N), 0, -2.9 * w - 0.5, zm) }, { name: 'body flange and cover', role: 'casting', mesh: standY(cylZ(0, 0, w + 0.9, 0, 0.5, N), 0, -0.4 * w - 0.5, zm) },
    { name: 'cover bolts', role: 'hardware', mesh: standY(boltCircle(w + 0.45, 0.5, 6, 0.5), 0, -0.4 * w - 0.5, zm) }, { name: 'drain plug', role: 'hardware', mesh: transformMesh(hexNut(0.5), multiply(translate(0, -2.9 * w - 0.5, zm), rotateX(Math.PI / 2))) });
  return piping(done(id, 'FITTING', `Steam trap ${NPS}" ${cls} threaded, ${type} type`, { NPS: drawing(NPS, 'Size'), w: rule(w, 'SW-PSP-4', 'Body width (2.2 OD, min 1.5 in)'), FF: rule(FF, 'SW-PSP-4', `End to end (${type === 'disc' ? 2.4 : 3.4} widths)`) }, FF, s));
}
function corrugated(id: string, NPS: number, cls: PipeClass, pitch: number, n: number, rods: boolean, label: string, ruleId: string): PartSpec {
  const pd = pipeDims(NPS, cls), f = designFlange(NPS, cls), Lf = flangeLen(f), Lb = n * pitch, FF = 2 * Lf + 4 + Lb, z0 = Lf + 2, s: Solid[] = [...endFlanges(f, FF, 'pipe')];
  s.push({ name: 'weld ends', role: 'pipe', mesh: mergeMeshes([tube(pd.OD / 2, pd.t, 2.2, Lf - 0.2), tube(pd.OD / 2, pd.t, 2.2, z0 + Lb)]) }, { name: `${rods ? 'bellows' : 'corrugated hose'} (${n} convolutions)`, role: 'closure', mesh: bellows(pd.OD / 2, pitch, n, z0) });
  if (rods) {
    const rr = f.OD / 2 + 1.5, lug: MeshData[] = [], rod: MeshData[] = [];
    for (let i = 0; i < 4; i++) { const rot = rotateZ(Math.PI / 4 + (i * Math.PI) / 2); for (const z of [f.tf, FF - f.tf - 0.75]) lug.push(transformMesh(boxMesh(f.OD / 2 - 0.5, -1.5, z, rr + 1.5, 1.5, z + 0.75), rot)); rod.push(transformMesh(mergeMeshes([cylZ(rr, 0, 0.375, f.tf - 1.5, FF - f.tf + 1.5, 10), at(hexNut(0.75), rr, 0, f.tf - 0.75), at(hexNut(0.75), rr, 0, FF - f.tf)]), rot)); }
    s.push({ name: 'limit rod lugs', role: 'pipe', mesh: mergeMeshes(lug) }, { name: 'limit rods RD3/4', role: 'hardware', mesh: mergeMeshes(rod) });
  } else s.push({ name: 'braid collars', role: 'closure', mesh: mergeMeshes([tube(pd.OD / 2 + 0.7 * pitch, 0.125, 1.5, z0 - 0.5), tube(pd.OD / 2 + 0.7 * pitch, 0.125, 1.5, z0 + Lb - 1)]) });
  return piping(done(id, 'FITTING', `${label} ${NPS}" ${cls}`, { NPS: drawing(NPS, 'Size'), convolutions: drawing(n, 'Convolutions', 'count'), pitch: rule(pitch, ruleId, 'Convolution pitch'), height: rule(0.6 * pitch, 'SW-PSP-5', 'Convolution height (0.6 pitch)'), FF: rule(FF, ruleId, 'Face to face') }, FF, s, rods ? [] : ['The braid is not drawn; its collars are.']));
}
export const makeExpansionJoint = (id: string, NPS: number, cls: PipeClass, convolutions = 5): PartSpec => corrugated(id, NPS, cls, Math.max(0.75, 0.2 * pipeDims(NPS, cls).OD), convolutions, true, 'Expansion joint (bellows)', 'SW-PSP-5');
export const makeFlexHose = (id: string, NPS: number, cls: PipeClass, L: number): PartSpec => { const p = Math.max(0.3, 0.1 * pipeDims(NPS, cls).OD); return corrugated(id, NPS, cls, p, Math.max(4, Math.round(L / p)), false, 'Flexible hose', 'SW-PSP-6'); };
export function makeFlameArrestor(id: string, NPS: number, cls: PipeClass): PartSpec {
  const pd = pipeDims(NPS, cls), f = designFlange(NPS, cls), Lf = flangeLen(f), OD = pd.OD, cone = 0.9 * OD, el = 0.8 * OD, FF = 2 * Lf + 2 * cone + el, z1 = Lf + cone, z2 = z1 + el;
  const s: Solid[] = [...endFlanges(f, FF), { name: 'cones', role: 'casting', mesh: mergeMeshes([frustum(OD / 2, OD, Lf - 0.1, z1, pd.t, N), frustum(OD, OD / 2, z2, FF - Lf + 0.1, pd.t, N)]) }, { name: 'element housing', role: 'closure', mesh: tube(OD, 0.25, el, z1) },
    { name: 'ring flanges', role: 'casting', mesh: mergeMeshes([at(extrude({ outer: circle(0, 0, OD + 1.75, N), inner: circle(0, 0, OD - 0.25, N) }, 0.75, 0), 0, 0, z1 - 0.75), at(extrude({ outer: circle(0, 0, OD + 1.75, N), inner: circle(0, 0, OD - 0.25, N) }, 0.75, 0), 0, 0, z2)]) },
    { name: 'tie bolts (8)', role: 'hardware', mesh: mergeMeshes(Array.from({ length: 8 }, (_, i) => { const a = (2 * Math.PI * (i + 0.5)) / 8, x = (OD + 1) * Math.cos(a), y = (OD + 1) * Math.sin(a); return mergeMeshes([cylZ(x, y, 0.25, z1 - 1.75, z2 + 1.75, 8), at(hexNut(0.5), x, y, z1 - 1.25), at(hexNut(0.5), x, y, z2 + 0.75)]); })) }];
  return piping(done(id, 'FITTING', `Flame arrestor ${NPS}" ${cls} in-line`, { NPS: drawing(NPS, 'Size'), housing: rule(2 * OD, 'SW-PSP-7', 'Element housing diameter (2 OD)'), element: rule(el, 'SW-PSP-7', 'Element length (0.8 OD)'), FF: rule(FF, 'SW-PSP-7', 'Face to face') }, FF, s, ['The element is inside its housing and not drawn.']));
}
export function makeSightGlass(id: string, NPS: number, cls: PipeClass): PartSpec {
  const pd = pipeDims(NPS, cls), f = designFlange(NPS, cls), Lf = flangeLen(f), OD = pd.OD, FF = 2 * Lf + 2.2 * OD, zc = FF / 2;
  const s: Solid[] = [...endFlanges(f, FF), { name: 'body', role: 'casting', mesh: cylZ(0, 0, 0.62 * OD, Lf - 0.2, FF - Lf + 0.2) }, { name: 'window body', role: 'casting', mesh: cylX(0, zc, 0.8 * OD, -0.8 * OD, 0.8 * OD) }];
  for (const sg of [-1, 1]) s.push({ name: 'glass', role: 'polymer', mesh: cylX(0, zc, 0.6 * OD, sg > 0 ? 0.8 * OD : -0.8 * OD - 0.5, sg > 0 ? 0.8 * OD + 0.5 : -0.8 * OD, N) },
    { name: 'retaining ring', role: 'casting', mesh: transformMesh(extrude({ outer: circle(0, 0, 0.85 * OD, N), inner: circle(0, 0, 0.5 * OD, N) }, 0.5, 0), multiply(translate(sg > 0 ? 0.8 * OD + 0.5 : -0.8 * OD - 1, 0, zc), [0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1])) },
    { name: 'ring bolts', role: 'hardware', mesh: transformMesh(boltCircle(0.72 * OD, 0, 6, 0.375), multiply(translate(sg > 0 ? 0.8 * OD + 1 : -0.8 * OD - 1.375, 0, zc), [0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1])) });
  return piping(done(id, 'FITTING', `Sight glass ${NPS}" ${cls} flanged`, { NPS: drawing(NPS, 'Size'), body: rule(1.6 * OD, 'SW-PSP-8', 'Window body (1.6 OD)'), glass: rule(1.2 * OD, 'SW-PSP-8', 'Glass diameter (1.2 OD)'), FF: rule(FF, 'SW-PSP-8', 'Face to face') }, FF, s));
}
export function makeRuptureDiscHolder(id: string, NPS: number, cls: PipeClass): PartSpec {
  const pd = pipeDims(NPS, cls), f = designFlange(NPS, cls), ro = (f.BC - f.d) / 2 - 0.125, ri = pd.D / 2, sag = 0.25 * pd.D, Rs = (ri * ri + sag * sag) / (2 * sag), a0 = Math.asin(ri / Rs);
  const dome = orient(revolve([...Array.from({ length: 9 }, (_, i) => { const a = (a0 * i) / 8; return { r: Rs * Math.sin(a), z: 0.75 + sag - Rs * (1 - Math.cos(a)) }; }), ...Array.from({ length: 9 }, (_, i) => { const a = (a0 * (8 - i)) / 8; return { r: Rs * Math.sin(a), z: 0.6875 + sag - Rs * (1 - Math.cos(a)) }; })], N));
  const s: Solid[] = [{ name: 'holder rings', role: 'closure', mesh: mergeMeshes([extrude({ outer: circle(0, 0, ro, N), inner: circle(0, 0, ri, N) }, 0.75, 0), extrude({ outer: circle(0, 0, ro, N), inner: circle(0, 0, ri, N) }, 0.75, 0.8125)]) }, { name: 'domed disc', role: 'nameplate', mesh: dome },
    { name: 'tag stem', role: 'nameplate', mesh: boxMesh(-0.5, ro - 0.2, 0.75, 0.5, f.OD / 2 + 3, 0.8125) }];
  return piping(done(id, 'FITTING', `Rupture disc holder ${NPS}" ${cls}`, { NPS: drawing(NPS, 'Size'), ring: rule(2 * ro, 'SW-PSP-9', 'Holder diameter (inside the bolt circle)'), thickness: rule(1.5625, 'SW-PSP-9', 'Overall thickness (two 3/4 in rings and the disc)') }, 1.5625, s));
}
export function makeDripRing(id: string, NPS: number, cls: PipeClass): PartSpec {
  const pd = pipeDims(NPS, cls), f = designFlange(NPS, cls), ro = (f.BC - f.d) / 2 - 0.125;
  const s: Solid[] = [{ name: 'ring', role: 'closure', mesh: extrude({ outer: circle(0, 0, ro, N), inner: circle(0, 0, pd.D / 2, N) }, 1.5, 0) }, { name: 'tapped bosses 3/4', role: 'closure', mesh: mergeMeshes([cylY(0, 0.75, 0.7, ro - 0.2, ro + 2, 12), cylY(0, 0.75, 0.7, -ro - 2, -ro + 0.2, 12)]) },
    { name: 'plug', role: 'hardware', mesh: transformMesh(hexNut(0.75), multiply(translate(0, -ro - 2, 0.75), rotateX(Math.PI / 2))) }];
  return piping(done(id, 'FITTING', `Drip ring ${NPS}" ${cls}`, { NPS: drawing(NPS, 'Size'), t: rule(1.5, 'SW-PSP-10', 'Thickness'), ring: rule(2 * ro, 'SW-PSP-10', 'Ring diameter') }, 1.5, s));
}
export function makeLateral(id: string, NPS: number, cls: PipeClass): PartSpec {
  const pd = pipeDims(NPS, cls), OD = pd.OD, A = OD + 2, B = 2.7 * OD + 2, c = Math.SQRT1_2, prof = { outer: circle(0, 0, OD / 2, N), inner: circle(0, 0, OD / 2 - pd.t, N) };
  const s: Solid[] = [{ name: 'run', role: 'pipe', mesh: tube(OD / 2, pd.t, A + B, 0) }, { name: 'branch at 45°', role: 'pipe', mesh: member([0, (OD / 2 - pd.t) * 0.5, A + (OD / 2 - pd.t) * 0.5], [0, B * c, A + B * c], prof) }];
  return piping(done(id, 'FITTING', `Lateral 45° ${NPS}" ${cls} BW`, { NPS: drawing(NPS, 'Size'), A: rule(A, 'SW-PSP-11', 'Run before the branch point (OD + 2)'), B: rule(B, 'SW-PSP-11', 'Run after it, and the branch (2.7 OD + 2)') }, A + B, s));
}
export function makeMitreBend(id: string, NPS: number, cls: PipeClass, pieces = 3): PartSpec {
  const pd = pipeDims(NPS, cls), OD = pd.OD, R = 1.5 * OD, cuts = pieces - 1, th = Math.PI / 2 / cuts, T = R * Math.tan(th / 2), sl = Math.tan(th / 2), prof = { outer: circle(0, 0, OD / 2, N), inner: circle(0, 0, OD / 2 - pd.t, N) }, parts: MeshData[] = [], welds: MeshData[] = [];
  let p: V3 = [0, 0, 0];
  for (let k = 0; k < pieces; k++) {
    const phi = k * th, d: V3 = [0, Math.sin(phi), Math.cos(phi)], L = k === 0 || k === pieces - 1 ? T : 2 * T;   // local y points to the inside of the bend
    parts.push(transformMesh(extrude(prof, L, 0, { start: k === 0 ? undefined : { dx: 0, dy: sl }, end: k === pieces - 1 ? undefined : { dx: 0, dy: -sl } }), frameFromAxes(p, [0, Math.cos(phi), -Math.sin(phi)], d)));
    if (k < pieces - 1) { const Y: V3 = [0, Math.cos(phi), -Math.sin(phi)], r = OD / 2; welds.push(sweep(Array.from({ length: 48 }, (_, i) => { const a = (2 * Math.PI * i) / 48, x = r * Math.cos(a), y = r * Math.sin(a), z = L - sl * y; return [p[0] + x, p[1] + Y[1] * y + d[1] * z, p[2] + Y[2] * y + d[2] * z] as V3; }), Math.max(0.1, 0.5 * pd.t), 8, true)); }
    p = [p[0], p[1] + d[1] * L, p[2] + d[2] * L];
  }
  return piping(done(id, 'FITTING', `Mitre bend 90° ${NPS}" ${cls}, ${pieces} pieces`, { NPS: drawing(NPS, 'Size'), pieces: drawing(pieces, 'Pieces', 'count'), R: rule(R, 'SW-PSP-12', 'Centreline radius (1.5 OD)'), cut: rule((th * 90) / Math.PI, 'SW-PSP-12', 'Cut angle at each joint', 'deg'), T: rule(T, 'SW-PSP-12', 'End piece length on the centreline') }, R + OD / 2, [{ name: `mitred pieces (${pieces})`, role: 'pipe', mesh: mergeMeshes(parts.map(orient)) }, { name: `mitre welds (${cuts})`, role: 'weld', mesh: mergeMeshes(welds) }]));
}
export function makeStubIn(id: string, runNPS: number, branchNPS: number, cls: PipeClass): PartSpec {
  const pr = pipeDims(runNPS, cls), pb = pipeDims(branchNPS, cls), Lr = 3 * pr.OD + 2 * pb.OD, sag = pr.OD / 2 - Math.sqrt((pr.OD / 2) ** 2 - (pb.OD / 2) ** 2);
  const s: Solid[] = [{ name: 'run', role: 'pipe', mesh: tube(pr.OD / 2, pr.t, Lr, 0) }, { name: 'branch', role: 'pipe', mesh: standY(tube(pb.OD / 2, pb.t, 6 + sag + 0.25, 0), 0, pr.OD / 2 - sag - 0.25, Lr / 2) },
    { name: 'reinforcing pad', role: 'pipe', mesh: transformMesh(curvedPad(pr.OD / 2, pr.t, pb.OD / 2, pb.OD), multiply(translate(0, pr.OD / 2, Lr / 2), NOZZLE_UP)) }];
  return piping(done(id, 'FITTING', `Stub-in ${runNPS}" × ${branchNPS}" ${cls} with pad`, { run: drawing(runNPS, 'Run size'), branch: drawing(branchNPS, 'Branch size'), padOD: rule(2 * pb.OD, 'SW-PSP-13', 'Pad diameter (2 × branch OD)'), padT: rule(pr.t, 'SW-PSP-13', 'Pad thickness (= run)') }, Lr, s));
}
export function makeSpringHanger(id: string, NPS: number, cls: PipeClass, rodL = 36): PartSpec {
  const pd = pipeDims(NPS, cls), r = pd.OD / 2, yc0 = r + 3 + rodL, yc1 = yc0 + 14, s: Solid[] = [{ name: 'pipe', role: 'pipe', mesh: tube(r, pd.t, 30, -15) }];
  s.push({ name: 'pipe clamp PL3/8 × 2-1/2', role: 'galv', mesh: mergeMeshes([extrude({ outer: annularSector(r, r + 0.375, 0.12, Math.PI - 0.12, 24) }, 2.5, -1.25), extrude({ outer: annularSector(r, r + 0.375, Math.PI + 0.12, 2 * Math.PI - 0.12, 24) }, 2.5, -1.25), boxMesh(-0.1875, r, -1.25, 0.1875, r + 3, 1.25), boxMesh(r + 0.2, -0.6, -1.25, r + 2.2, -0.225, 1.25), boxMesh(r + 0.2, 0.225, -1.25, r + 2.2, 0.6, 1.25), boxMesh(-r - 2.2, -0.6, -1.25, -r - 0.2, -0.225, 1.25), boxMesh(-r - 2.2, 0.225, -1.25, -r - 0.2, 0.6, 1.25)]) },
    { name: 'clamp bolts', role: 'hardware', mesh: mergeMeshes([-1, 1].flatMap(sg => [cylY(sg * (r + 1.3), 0, 0.3125, -1.2, 1.2, 8), transformMesh(hexNut(0.625), multiply(translate(sg * (r + 1.3), 0.6, 0), rotateX(-Math.PI / 2)))])) },
    { name: 'lower rod RD3/4 and turnbuckle', role: 'hardware', mesh: mergeMeshes([cylY(0, 0, 0.375, r + 2, yc0, 10), cylY(0, 0, 0.7, r + 3 + rodL * 0.4, r + 3 + rodL * 0.4 + 6, 6)]) },
    { name: 'spring can', role: 'machine', mesh: standY(tube(3.5, 0.1875, 14, 0), 0, yc0, 0) }, { name: 'can ends', role: 'machine', mesh: mergeMeshes([standY(cylZ(0, 0, 3.5, 0, 0.375, 32), 0, yc0, 0), standY(cylZ(0, 0, 3.5, 0, 0.375, 32), 0, yc1 - 0.375, 0)]) },
    { name: 'load scale', role: 'nameplate', mesh: boxMesh(-1.25, yc0 + 2, 3.5, 1.25, yc1 - 2, 3.55) }, { name: 'upper rod and lug', role: 'hardware', mesh: mergeMeshes([cylY(0, 0, 0.375, yc1, yc1 + 12, 10), boxMesh(-0.25, yc1 + 11, -2, 0.25, yc1 + 15, 2)]) },
    { name: 'supporting steel (stub)', role: 'steel', mesh: boxMesh(-4, yc1 + 15, -9, 4, yc1 + 15.5, 9) });
  return piping(done(id, 'SUPPORT', `Spring hanger for ${NPS}" pipe`, { NPS: drawing(NPS, 'Pipe size'), rod: drawing(rodL, 'Rod length below the can'), canD: rule(7, 'SW-PSP-14', 'Spring can diameter'), canH: rule(14, 'SW-PSP-14', 'Spring can height'), rodD: rule(0.75, 'SW-PSP-14', 'Rod diameter') }, yc1 + 15.5, s, ['The spring is inside its can and not drawn.']), 'SUPPORT');
}
/** SW-PSP-15: insulation thickness by pipe size */
export const insulationThickness = (NPS: number) => (NPS <= 2 ? 1 : NPS <= 6 ? 1.5 : NPS <= 12 ? 2 : 3);
export function makeInsulatedPipe(id: string, NPS: number, cls: PipeClass, L = 96, traced = true): PartSpec {
  const pd = pipeDims(NPS, cls), r = pd.OD / 2, ti = insulationThickness(NPS), gap = traced ? 0.5 : 0, ri = r + gap, bands: MeshData[] = [];
  for (let z = 30; z <= L - 30; z += 12) bands.push(tube(ri + ti + 0.04, 0.02, 0.75, z));
  const s: Solid[] = [{ name: 'pipe', role: 'pipe', mesh: tube(r, pd.t, L, 0) }, { name: `insulation ${ti} in`, role: 'grout', mesh: tube(ri + ti, ti, L - 24, 12) }, { name: 'aluminium jacket', role: 'jacket', mesh: tube(ri + ti + 0.02, 0.02, L - 48, 24) }, { name: 'jacket bands', role: 'closure', mesh: mergeMeshes(bands) }];
  if (traced) s.push({ name: 'steam tracer 1/2 in tube', role: 'closure', mesh: at(tube(0.25, 0.035, L, 0), (r + 0.25) * Math.cos(-2.1), (r + 0.25) * Math.sin(-2.1), 0) });
  return piping(done(id, 'FITTING', `Insulated ${traced ? 'and steam-traced ' : ''}pipe ${NPS}" ${cls}`, { NPS: drawing(NPS, 'Size'), L: drawing(L, 'Length shown'), insulation: rule(ti, 'SW-PSP-15', 'Insulation thickness by size'), jacket: rule(0.02, 'SW-PSP-15', 'Jacket thickness'), bands: rule(12, 'SW-PSP-15', 'Band spacing') }, L, s, ['Layers are stepped back at the ends to show each.']));
}
/** a polyline with every corner eased to a bend of radius R (corner angle any) */
export function bendPath(pts: V3[], R: number, n = 6): V3[] {
  const out: V3[] = [pts[0]], un = (a: V3, b: V3): V3 => { const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(d[0], d[1], d[2]); return [d[0] / l, d[1] / l, d[2] / l]; };
  for (let i = 1; i + 1 < pts.length; i++) { const u = un(pts[i - 1], pts[i]), v = un(pts[i], pts[i + 1]), P = pts[i], C: V3 = [P[0] - u[0] * R + v[0] * R, P[1] - u[1] * R + v[1] * R, P[2] - u[2] * R + v[2] * R]; for (let k = 0; k <= n; k++) { const t = (Math.PI / 2) * (k / n); out.push([C[0] + R * (u[0] * Math.sin(t) - v[0] * Math.cos(t)), C[1] + R * (u[1] * Math.sin(t) - v[1] * Math.cos(t)), C[2] + R * (u[2] * Math.sin(t) - v[2] * Math.cos(t))]); } }
  out.push(pts[pts.length - 1]); return out;
}
export function makeExpansionLoop(id: string, NPS: number, cls: PipeClass, W: number, H: number): PartSpec {
  const pd = pipeDims(NPS, cls), R = (5 / 3) * pd.OD, a = 3 * pd.OD + 12;
  const path = bendPath([[0, 0, 0], [0, 0, a], [H, 0, a], [H, 0, a + W], [0, 0, a + W], [0, 0, 2 * a + W]], R, 8);
  return piping(done(id, 'FITTING', `Expansion loop ${NPS}" ${cls}, ${W}" wide × ${H}" high`, { NPS: drawing(NPS, 'Size'), W: drawing(W, 'Loop width'), H: drawing(H, 'Loop height'), R: rule(R, 'SW-FIT-1', 'Bend radius (long radius)'), lead: rule(a, 'SW-PSP-16', 'Straight shown each side (3 OD + 12)') }, 2 * a + W, [{ name: 'loop', role: 'pipe', mesh: hollowSweep(path, pd.OD / 2, pd.t, 16) }]));
}
export function makeHoseConnection(id: string, NPS: number): PartSpec {
  const pd = pipeDims(NPS, 'P150'), r = pd.OD / 2;
  const s: Solid[] = [{ name: 'nipple (threaded)', role: 'pipe', mesh: tube(r, pd.t, 4, 0) }, { name: 'coupling body', role: 'closure', mesh: mergeMeshes([extrude({ outer: circle(0, 0, 1.25 * r + 0.3, 6), inner: circle(0, 0, r - pd.t, 6) }, 1, 3.5), tube(1.3 * r + 0.2, 0.25, 2, 4.5)]) },
    { name: 'cam arms', role: 'closure', mesh: mergeMeshes([-1, 1].map(sg => boxMesh(sg > 0 ? 1.3 * r + 0.2 : -1.3 * r - 0.7, -0.4, 3, sg > 0 ? 1.3 * r + 0.7 : -1.3 * r - 0.2, 0.4, 6.2))) }, { name: 'dust cap', role: 'closure', mesh: cylZ(0, 0, 1.3 * r + 0.1, 6.5, 7.5, 32) },
    { name: 'cap chain', role: 'hardware', mesh: sweep([[0, -1.3 * r - 0.2, 7], [0, -1.3 * r - 2, 6], [0, -1.3 * r - 2.2, 3], [0, -r - 0.1, 1.5]], 0.09, 6) }];
  return piping(done(id, 'FITTING', `Hose connection ${NPS}", quick coupling with cap`, { NPS: drawing(NPS, 'Size'), L: rule(7.5, 'SW-PSP-17', 'Overall length') }, 7.5, s));
}
