/**
 * Equipment catalogue: DESIGN_BASIS.md §66 (SW-EQC-*), extending the envelopes of §25. Every item is a true-scale
 * envelope from stated principal dimensions; the rest follows the rules there. Weights are the drawn steel (SW-EQ-7).
 * Local frames: a vertical item has z up from its base; a horizontal one z along its axis, y up. No published table
 * was consulted (PROVENANCE P-72).
 */
import { K } from '../../core/constants';
import { drawing, rule, type Dim } from '../../core/basis';
import { roundUpTo } from '../../core/units';
import { DEFAULT_MATERIAL, type PartSpec, type Material } from '../part';
import { extrude, revolve, transformMesh, helixTube, mergeMeshes, signedVolume, type MeshData } from '../../geometry/mesh';
import { circle, rect, annularSector, type Polygon } from '../../geometry/polygon';
import { translate, multiply, rotateX, rotateY, rotateZ } from '../../geometry/transform';
import { ringAroundHole } from '../../geometry/profiles';
import { wProfile, lProfile, hssRoundProfile, cProfile } from '../../geometry/profiles';
import { proportionW } from './wideFlange';
import { proportionC } from './channel';
import { pipeDims, designFlange, type PipeClass, type FlangeDesign } from './pipe';
import { finish, vesselSolids, shellRing, headLoop, makeVerticalVessel, N_REV, type VesselVInput } from './equipment';

const RHO = K.STEEL_DENSITY_LB_IN3;
interface Solid { name: string; mesh: MeshData }
const N = 48;
const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): MeshData => extrude({ outer: rect(x0, y0, x1, y1) }, z1 - z0, z0);
/** a cylinder along z of radius r from z0 to z1, centred at (cx, cy) */
const cylZ = (cx: number, cy: number, r: number, z0: number, z1: number, n = N): MeshData => extrude({ outer: circle(cx, cy, r, n) }, z1 - z0, z0);
/** a cylinder along x from x0 to x1 at (y, z) */
const cylX = (y: number, z: number, r: number, x0: number, x1: number, n = N): MeshData => transformMesh(extrude({ outer: circle(0, 0, r, n) }, x1 - x0, 0), multiply(translate(x0, y, z), rotateY(Math.PI / 2)));
/** a cylinder along y from y0 to y1 at (x, z) */
const cylY = (x: number, z: number, r: number, y0: number, y1: number, n = N): MeshData => transformMesh(extrude({ outer: circle(0, 0, r, n) }, y1 - y0, 0), multiply(translate(x, y0, z), rotateX(-Math.PI / 2)));
const tube = (r: number, t: number, L: number, z0 = 0): MeshData => extrude({ outer: circle(0, 0, r, N), inner: circle(0, 0, r - t, N) }, L, z0);
const at = (m: MeshData, x: number, y: number, z: number): MeshData => transformMesh(m, translate(x, y, z));

/** a weld-neck flange's solids along +z from its face at z = 0 (ring with bolt holes, raised face below the face, hub and neck above) */
export function flangeSolids(f: FlangeDesign, name = 'flange'): Solid[] {
  const cells: MeshData[] = [];
  for (let i = 0; i < f.n; i++) {
    const a = (2 * Math.PI * (i + 0.5)) / f.n, half = Math.PI / f.n;
    cells.push(extrude(ringAroundHole(annularSector(f.bore / 2, f.OD / 2, a - half, a + half, 6), { x: (f.BC / 2) * Math.cos(a), y: (f.BC / 2) * Math.sin(a) }, f.holeD / 2, 24), f.tf));
  }
  const loop = [{ r: f.bore / 2, z: f.tf }, { r: f.bore / 2 + f.hubT, z: f.tf }, { r: f.bore / 2 + f.pipeT, z: f.tf + f.hubLen }, { r: f.bore / 2 + f.pipeT, z: f.tf + f.hubLen + f.neckLen }, { r: f.bore / 2, z: f.tf + f.hubLen + f.neckLen }];
  return [{ name: `${name} ring`, mesh: mergeMeshes(cells) }, { name: `${name} raised face`, mesh: at(tube(f.rfOD / 2, (f.rfOD - f.bore) / 2, f.rfH), 0, 0, -f.rfH) }, { name: `${name} hub and neck`, mesh: revolve(loop, N) }];
}
const flangeLen = (f: FlangeDesign) => f.tf + f.hubLen + f.neckLen;

function done(id: string, kind: PartSpec['kind'], designation: string, dims: Record<string, Dim>, lengthIn: number, solids: Solid[], notes: string[] = [], extra: Record<string, unknown> = {}, material: Material = DEFAULT_MATERIAL): PartSpec {
  const { solids: _s, nozzles: _n, ...rest } = extra;   // the item's own solids are the ones passed here, never a sub-part's
  void _s; void _n;
  return finish(id, kind, designation, dims, lengthIn, solids, material, [], notes, rest);
}
/** a plate of thickness t on a planar quadrilateral (corners in order), extruded along the quad's normal; closed, positive volume */
function quadPlate(c: [number, number, number][], t: number): MeshData {
  const sub = (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cr = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const n0 = cr(sub(c[1], c[0]), sub(c[3], c[0])), L = Math.hypot(...n0), n = n0.map(v => v / L);
  const positions = [...c.flatMap(p => p), ...c.flatMap(p => [p[0] - n[0] * t, p[1] - n[1] * t, p[2] - n[2] * t])];
  const indices = [0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; indices.push(i, i + 4, j, j, i + 4, j + 4); }
  const m = { positions, indices };
  if (signedVolume(m) < 0) { for (let k = 0; k < indices.length; k += 3) { const tmp = indices[k + 1]; indices[k + 1] = indices[k + 2]; indices[k + 2] = tmp; } }
  return m;
}

// ---- parts a pressure vessel carries (SW-EQC-1..7) ------------------------------------------------------------------

export interface NozzleInput { NPS: number; cls: PipeClass; shellT: number; projection?: number }
/** SW-EQC-1: nozzle neck, flange and reinforcing pad; z along the nozzle from the shell's outer surface (z = 0) to the flange face */
export function makeNozzle(id: string, inp: NozzleInput): PartSpec {
  const proj = inp.projection ?? 8, pd = pipeDims(inp.NPS, inp.cls), f = designFlange(inp.NPS, inp.cls), Lf = flangeLen(f), neck = Math.max(1, proj - Lf);
  const solids: Solid[] = [{ name: 'neck', mesh: tube(pd.OD / 2, pd.t, neck, 0) }, ...flangeSolids(f).map(s => ({ ...s, mesh: transformMesh(s.mesh, multiply(translate(0, 0, proj), rotateX(Math.PI))) }))];
  if (inp.NPS >= 3) solids.push({ name: 'reinforcing pad', mesh: tube(pd.OD, pd.OD / 2, inp.shellT, 0) });
  return done(id, 'NOZZLE', `Nozzle ${inp.NPS}" ${inp.cls} WN, ${proj}" projection`, {
    NPS: drawing(inp.NPS, 'Size'), shellT: drawing(inp.shellT, 'Shell thickness'), projection: inp.projection !== undefined ? drawing(proj, 'Projection') : rule(proj, 'SW-EQC-1', 'Projection from the shell'),
    padOD: rule(inp.NPS >= 3 ? 2 * pd.OD : 0, 'SW-EQC-1', 'Reinforcing pad OD (2 × neck OD, 3 in and up)'), padT: rule(inp.NPS >= 3 ? inp.shellT : 0, 'SW-EQC-1', 'Reinforcing pad thickness (= shell)'),
  }, proj, solids, [], { f, pd });
}

export interface ManwayInput { D: 20 | 24; cls: PipeClass; shellT: number }
/** SW-EQC-2: manway with a blind cover on a davit; z along the manway from the shell */
export function makeManway(id: string, inp: ManwayInput): PartSpec {
  const proj = 10, pd = pipeDims(inp.D, inp.cls), f = designFlange(inp.D, inp.cls), Lf = flangeLen(f), coverT = f.tf;
  const solids: Solid[] = [{ name: 'neck', mesh: tube(pd.OD / 2, pd.t, proj - Lf, 0) }, ...flangeSolids(f).map(s => ({ ...s, mesh: transformMesh(s.mesh, multiply(translate(0, 0, proj), rotateX(Math.PI))) })),
    { name: 'reinforcing pad', mesh: tube(pd.OD, pd.OD / 2, inp.shellT, 0) }, { name: 'blind cover', mesh: cylZ(0, 0, f.OD / 2, proj, proj + coverT) }];
  const postX = f.OD / 2 + 4, postH = proj + coverT + 12, arm = postX;
  solids.push({ name: 'davit post 1-1/2 bar', mesh: cylZ(postX, 0, 0.75, 0, postH, 24) }, { name: 'davit arm', mesh: cylX(0, postH, 0.75, 0, postX, 24) });
  return done(id, 'MANWAY', `Manway ${inp.D}" ${inp.cls} with davit`, {
    D: drawing(inp.D, 'Size'), shellT: drawing(inp.shellT, 'Shell thickness'), projection: rule(proj, 'SW-EQC-2', 'Projection'), coverT: rule(coverT, 'SW-EQC-2', 'Cover thickness (blind, SW-FLG-*)'),
    davitPost: rule(postH, 'SW-EQC-2', 'Davit post height (12 in above the cover)'), davitArm: rule(arm, 'SW-EQC-2', 'Davit arm reach'),
  }, postH, solids, [], { f });
}

/** SW-EQC-3: one lifting lug; the plate stands in the x–z plane on the shell (z = 0), y its thickness */
export function makeLiftingLug(id: string, shellT: number, emptyWeightKips: number): PartSpec {
  const t = Math.max(0.75, shellT), dh = roundUpTo(1 + emptyWeightKips / 40, 1 / 8), w = 4 * dh, h = 3 * dh;
  const n = 16, top: Polygon = [{ x: -w / 2, y: 0 }, { x: w / 2, y: 0 }, { x: w / 2, y: h - dh }, ...Array.from({ length: n + 1 }, (_, i) => { const a = (Math.PI * i) / n; return { x: dh * Math.cos(a) + (w / 2 - dh) * Math.sign(Math.cos(a) || 1), y: h - dh + dh * Math.sin(a) }; }), { x: -w / 2, y: h - dh }];
  const outline = top.filter((p, i, arr) => i === 0 || Math.hypot(p.x - arr[i - 1].x, p.y - arr[i - 1].y) > 1e-6);
  const prof = ringAroundHole(outline, { x: 0, y: h - 1.5 * dh }, dh / 2, 24);
  const mesh = transformMesh(extrude(prof, t, 0), multiply(translate(0, t / 2, 0), rotateX(Math.PI / 2)));
  return done(id, 'LIFTING_LUG', `Lifting lug PL${t} ${w}" × ${h}", hole ${dh}"`, {
    shellT: drawing(shellT, 'Shell thickness'), W: drawing(emptyWeightKips, 'Empty weight', 'kip'), t: rule(t, 'SW-EQC-3', 'Plate thickness (max 3/4 in, shell)'),
    hole: rule(dh, 'SW-EQC-3', 'Hole diameter 1 + W/40'), w: rule(w, 'SW-EQC-3', 'Width (4 d_h)'), h: rule(h, 'SW-EQC-3', 'Height above the shell (3 d_h)'),
  }, h, [{ name: 'lug plate', mesh }], ['Two lugs per vessel, 180° apart (SW-EQC-3).'], { outline });
}

export interface LegsInput { ID: number; clearance: number }
/** SW-EQC-4: four round legs with base plates for a small vertical vessel; z up from the base plates, the vessel's bottom tangent line at z = clearance + head depth */
export function makeVesselLegs(id: string, inp: LegsInput): PartSpec {
  const OD = roundUpTo(Math.max(3, inp.ID / 12), 0.5), t = 0.25, R = inp.ID / 2, Rl = 0.45 * inp.ID, h = R / 2, L = inp.clearance + h;
  const solids: Solid[] = [];
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2, x = Rl * Math.cos(a), y = Rl * Math.sin(a);
    solids.push({ name: `leg HSS${OD}x1/4`, mesh: at(extrude(hssRoundProfile(OD, t), L, 0.5), x, y, 0) }, { name: 'base plate PL1/2 8x8', mesh: box(x - 4, y - 4, 0, x + 4, y + 4, 0.5) });
  }
  return done(id, 'VESSEL_LEGS', `Vessel legs 4 × HSS${OD}x1/4 × ${L}"`, {
    ID: drawing(inp.ID, 'Vessel ID'), clearance: drawing(inp.clearance, 'Bottom head clearance above the base'),
    OD: rule(OD, 'SW-EQC-4', 'Leg OD (max 3 in, ID/12, to 1/2 in)'), circle: rule(2 * Rl, 'SW-EQC-4', 'Leg circle (0.9 ID)'), L: rule(L, 'SW-EQC-4', 'Leg length (clearance + head depth)'),
  }, L, solids, ['One anchor rod per base plate (SW-AR-*).']);
}

/** SW-EQC-5: four support lugs on a vessel of outer radius R; z up from the lugs' bearing plane; the shell axis is z */
export function makeSupportLugs(id: string, R: number): PartSpec {
  const depth = 12, hgt = 12, solids: Solid[] = [];
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2, rot = rotateZ(a);
    const gusset: Polygon = [{ x: 0, y: 0 }, { x: depth, y: 0 }, { x: 0, y: hgt }];
    for (const dy of [-3, 3]) solids.push({ name: 'lug gusset PL1/2', mesh: transformMesh(transformMesh(extrude({ outer: gusset }, 0.5, 0), multiply(translate(R, dy, 0.75), rotateX(Math.PI / 2))), rot) });
    solids.push({ name: 'lug base PL3/4 8x8', mesh: transformMesh(box(R, -4, 0, R + 8, 4, 0.75), rot) }, { name: 'lug shell plate PL1/2', mesh: transformMesh(box(R - 0.5, -4, 0, R, 4, hgt + 0.75), rot) });
  }
  return done(id, 'SUPPORT_LUGS', `Support lugs 4 × PL1/2 gusseted, PL3/4 8x8 base, on R ${R}"`, {
    R: drawing(R, 'Shell outer radius'), depth: rule(depth, 'SW-EQC-5', 'Bracket depth (SW-EQ-6)'), base: rule(8, 'SW-EQC-5', 'Base plate 8 × 8 × 3/4'),
  }, depth, solids);
}

/** SW-EQC-6: insulation support rings L2x2x1/4 on a shell of outer radius R; z up from the bottom tangent line */
export function makeInsulationRings(id: string, R: number, TT: number): PartSpec {
  const zs: number[] = []; for (let z = 0; z < TT - 6; z += 120) zs.push(z); zs.push(TT - 6);
  const solids = zs.map(z => ({ name: 'insulation ring L2x2x1/4', mesh: at(extrude({ outer: circle(0, 0, R + 2, N), inner: circle(0, 0, R, N) }, 0.25, 0), 0, 0, z) }));
  return done(id, 'INSUL_RINGS', `Insulation rings ${zs.length} × L2x2x1/4 on R ${R}"`, {
    R: drawing(R, 'Shell outer radius'), TT: drawing(TT, 'Tangent to tangent'), rings: rule(zs.length, 'SW-EQC-6', 'Rings (10 ft spacing + one 6 in below the top)', 'count'),
  }, TT, solids, [], { zs });
}

/** SW-EQC-7: davit on a top head; z up from the head where the post is welded */
export function makeDavit(id: string, postH = 60, arm = 48): PartSpec {
  const pd = pipeDims(4, 'P150');
  const solids: Solid[] = [{ name: 'davit post 4 in pipe', mesh: tube(pd.OD / 2, pd.t, postH, 0) }, { name: 'davit arm 4 in pipe', mesh: transformMesh(tube(pd.OD / 2, pd.t, arm, 0), multiply(translate(0, 0, postH - pd.OD / 2), rotateY(Math.PI / 2))) }];
  return done(id, 'DAVIT', `Davit 4" pipe, post ${postH}" arm ${arm}"`, { postH: rule(postH, 'SW-EQC-7', 'Post height'), arm: rule(arm, 'SW-EQC-7', 'Arm reach') }, postH, solids);
}

// ---- equipment items (SW-EQC-8..26) ------------------------------------------------------------------------------

/** SW-EQC-8: electric motor; z along the shaft (shaft stub at +z), y up from the foot's underside */
export function motorSolids(D: number): { solids: Solid[]; L: number } {
  const L = 1.6 * D, footH = 0.6 * D, cy = footH + D / 2;
  return { L, solids: [{ name: 'motor frame', mesh: transformMesh(cylZ(0, cy, D / 2, 0, L), translate(0, 0, 0)) }, { name: 'motor foot', mesh: box(-D / 2, 0, 0.2 * D, D / 2, footH + 0.05 * D, 1.4 * D) },
    { name: 'conduit box', mesh: box(D / 2 - 0.05 * D, cy - 0.15 * D, 0.5 * D, D / 2 + 0.3 * D, cy + 0.15 * D, 0.8 * D) }, { name: 'shaft stub', mesh: cylZ(0, cy, 0.075 * D, L, L + 0.4 * D, 24) }] };
}
export function makeMotor(id: string, frameD: number): PartSpec {
  const { solids, L } = motorSolids(frameD);
  return done(id, 'MOTOR', `Motor ${frameD}" frame`, { D: drawing(frameD, 'Frame diameter'), L: rule(L, 'SW-EQC-8', 'Frame length (1.6 D)'), footH: rule(0.6 * frameD, 'SW-EQC-8', 'Foot height'), shaftY: rule(0.6 * frameD + frameD / 2, 'SW-EQC-8', 'Shaft centreline above the foot') }, L + 0.4 * frameD, solids);
}
/** a motor's solids under a transform (its shaft is local +z, its feet local −y) */
const motorAt = (D: number, tr: number[]): Solid[] => motorSolids(D).solids.map(s => ({ ...s, mesh: transformMesh(s.mesh, tr) }));
/** orientations for a motor (column-major: the images of local x, y, z): shaft along +x with up = +z; shaft along +y with up = +z; shaft down (−z) */
const SHAFT_X_UP_Z = [0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1], SHAFT_Y_UP_Z = [-1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1], SHAFT_DOWN = [0, 1, 0, 0, 1, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1];

export interface ColumnInput extends VesselVInput { trays: number; traySpacing?: number; insulated?: boolean }
/** SW-EQC-9: column = vertical vessel + davit + lugs + insulation rings; trays as data */
export function makeColumn(inp: ColumnInput): PartSpec {
  const v = makeVerticalVessel(inp), R = inp.ID / 2 + inp.t, h = R / 2, top = inp.skirtH + h + inp.TT, spacing = inp.traySpacing ?? 24;
  const solids = [...(v.extra!.solids as Solid[])];
  for (const s of makeDavit(`${inp.tag}-davit`).extra!.solids as Solid[]) solids.push({ ...s, mesh: at(s.mesh, R * 0.5, 0, top + h - (h * (1 - Math.sqrt(1 - 0.25))) ) });
  const lug = makeLiftingLug(`${inp.tag}-lug`, inp.t, v.weight.value / 1000);
  for (const a of [0, Math.PI]) for (const s of lug.extra!.solids as Solid[]) solids.push({ ...s, mesh: transformMesh(s.mesh, multiply(rotateZ(a), translate(R, 0, top - 2))) });
  if (inp.insulated) for (const s of makeInsulationRings(`${inp.tag}-ir`, R, inp.TT).extra!.solids as Solid[]) solids.push({ ...s, mesh: at(s.mesh, 0, 0, inp.skirtH + h) });
  return done(inp.tag, 'COLUMN', `${inp.tag} column ${inp.ID}" ID × ${inp.TT}" T/T, ${inp.trays} trays`, {
    ...v.dims, trays: drawing(inp.trays, 'Tray count', 'count'), traySpacing: inp.traySpacing !== undefined ? drawing(spacing, 'Tray spacing') : rule(spacing, 'SW-EQC-9', 'Tray spacing'),
    firstTray: rule(inp.skirtH + h + (inp.TT - (inp.trays - 1) * spacing) / 2, 'SW-EQC-9', 'First tray elevation (trays centred in the shell)'),
  }, v.length!.value, solids, ['Trays are data (elevations), not solids (SW-EQC-9).'], { ...(v.extra ?? {}), trays: Array.from({ length: inp.trays }, (_, i) => inp.skirtH + h + (inp.TT - (inp.trays - 1) * spacing) / 2 + i * spacing) });
}

/** SW-EQC-10: reactor = vertical vessel with t ≥ ID/48 and a bottom dump nozzle */
export function makeReactor(inp: VesselVInput & { dumpNPS?: number; cls?: PipeClass }): PartSpec {
  const t = Math.max(inp.t, inp.ID / 48), v = makeVerticalVessel({ ...inp, t }), R = inp.ID / 2 + t, h = R / 2, nps = inp.dumpNPS ?? 4;
  const solids = [...(v.extra!.solids as Solid[])];
  for (const s of makeNozzle(`${inp.tag}-dump`, { NPS: nps, cls: inp.cls ?? 'P300', shellT: t }).extra!.solids as Solid[]) solids.push({ ...s, mesh: transformMesh(s.mesh, multiply(translate(0, 0, inp.skirtH), rotateX(Math.PI))) });
  return done(inp.tag, 'REACTOR', `${inp.tag} reactor ${inp.ID}" ID × ${inp.TT}" T/T, t ${t}"`, { ...v.dims, t: rule(t, 'SW-EQC-10', 'Shell thickness (max stated, ID/48)'), dump: drawing(nps, 'Catalyst dump nozzle') }, v.length!.value, solids, [], { ...(v.extra ?? {}), R, h });
}

export interface AirCoolerInput { tag: string; W: number; L: number; fans: number; legH: number }
/** SW-EQC-11: forced-draught air cooler; z up from the column bases, x along the tubes, y across */
export function makeAirCooler(inp: AirCoolerInput): PartSpec {
  const depth = 24, hdr = 12, plenum = 0.5 * inp.W, fanD = (0.9 * inp.W) / inp.fans, zP = inp.legH, zB = zP + plenum, solids: Solid[] = [];
  solids.push({ name: 'tube bundle', mesh: box(-inp.L / 2, -inp.W / 2, zB, inp.L / 2, inp.W / 2, zB + depth) });
  for (const x of [-inp.L / 2 - hdr, inp.L / 2]) solids.push({ name: 'header box', mesh: box(x, -inp.W / 2, zB - 2, x + hdr, inp.W / 2, zB + depth + 2) });
  solids.push({ name: 'plenum', mesh: extrude({ outer: rect(-inp.L / 2, -inp.W / 2, inp.L / 2, inp.W / 2), inner: rect(-inp.L / 2 + 0.25, -inp.W / 2 + 0.25, inp.L / 2 - 0.25, inp.W / 2 - 0.25) }, plenum, zP) });
  for (let i = 0; i < inp.fans; i++) {
    const x = -inp.L / 2 + ((i + 0.5) * inp.L) / inp.fans;
    solids.push({ name: 'fan ring', mesh: at(tube(fanD / 2, 0.25, 12), x, 0, zP - 12) }, { name: 'fan hub', mesh: cylZ(x, 0, 0.1 * fanD, zP - 10, zP - 2, 24) });
    for (const s of motorAt(12, translate(x, 0, zP - 34))) solids.push(s);   // shaft up (local z) to the fan hub, 24 in motor + stub
  }
  const w6 = proportionW(6, 15), prof = wProfile(w6);
  for (const [x, y] of [[-inp.L / 2 + 12, -inp.W / 2 + 6], [inp.L / 2 - 12, -inp.W / 2 + 6], [-inp.L / 2 + 12, inp.W / 2 - 6], [inp.L / 2 - 12, inp.W / 2 - 6]]) solids.push({ name: 'column W6x15', mesh: at(extrude({ outer: prof }, zP, 0), x, y, 0) });
  const brace = lProfile(3, 3, 0.25), bl = Math.hypot(inp.L - 24, zP);
  for (const y of [-inp.W / 2 + 6, inp.W / 2 - 6]) solids.push({ name: 'brace L3x3x1/4', mesh: transformMesh(extrude({ outer: brace }, bl, 0), multiply(translate(-inp.L / 2 + 12, y, 0), rotateY(Math.PI / 2 - Math.atan2(zP, inp.L - 24)))) });
  return done(inp.tag, 'AIR_COOLER', `${inp.tag} air cooler ${inp.W}" × ${inp.L}", ${inp.fans} fans`, {
    W: drawing(inp.W, 'Bundle width'), L: drawing(inp.L, 'Tube length'), fans: drawing(inp.fans, 'Fans', 'count'), legH: drawing(inp.legH, 'Column height to the plenum'),
    depth: rule(depth, 'SW-EQC-11', 'Bundle depth'), plenum: rule(plenum, 'SW-EQC-11', 'Plenum depth (0.5 W)'), fanD: rule(fanD, 'SW-EQC-11', 'Fan ring diameter (0.9 W / n)'), header: rule(hdr, 'SW-EQC-11', 'Header box depth'),
  }, inp.L + 2 * hdr, solids, [], { zTop: zB + depth + 2 });
}

export interface CompressorInput { tag: string; skidW: number; skidL: number; casingD: number; motorD: number }
/** SW-EQC-12: centrifugal compressor package; z along the shaft, y up from the skid's underside */
export function makeCompressorPackage(inp: CompressorInput): PartSpec {
  const D = inp.casingD, cy = 1 + 0.6 * inp.motorD + inp.motorD / 2, solids: Solid[] = [{ name: 'skid PL1', mesh: box(-inp.skidW / 2, 0, -inp.skidL / 2, inp.skidW / 2, 1, inp.skidL / 2) }];
  const zc = -inp.skidL / 2 + 6;
  solids.push({ name: 'compressor casing', mesh: cylZ(0, cy, D / 2, zc, zc + 1.2 * D) }, { name: 'casing pedestal', mesh: box(-0.4 * D, 1, zc, 0.4 * D, cy, zc + 1.2 * D) });
  const zg = zc + 1.2 * D + 4; solids.push({ name: 'gearbox', mesh: box(-0.4 * D, 1, zg, 0.4 * D, 1 + 0.8 * D, zg + 0.8 * D) });
  for (const s of motorAt(inp.motorD, translate(0, 1, zg + 0.8 * D + 4))) solids.push(s);
  solids.push({ name: 'lube console', mesh: box(inp.skidW / 2 + 6, 0, -24, inp.skidW / 2 + 30, 48, 12) });
  return done(inp.tag, 'COMPRESSOR', `${inp.tag} centrifugal compressor package ${inp.skidW}" × ${inp.skidL}" skid`, {
    skidW: drawing(inp.skidW, 'Skid width'), skidL: drawing(inp.skidL, 'Skid length'), casingD: drawing(D, 'Casing diameter'), motorD: drawing(inp.motorD, 'Motor frame'),
    casingL: rule(1.2 * D, 'SW-EQC-12', 'Casing length (1.2 D)'), gearbox: rule(0.8 * D, 'SW-EQC-12', 'Gearbox cube (0.8 D)'), shaftY: rule(cy, 'SW-EQC-12', 'Shaft centreline above the skid'),
  }, inp.skidL, solids, ['On a 12 in pad (SW-CIV-5).']);
}

export interface RecipInput { tag: string; frameL: number; bore: number; motorD: number }
/** SW-EQC-13: reciprocating compressor; z along the crankshaft, cylinders along ±x, y up from the frame's underside */
export function makeRecipCompressor(inp: RecipInput): PartSpec {
  const L = inp.frameL, W = 0.5 * L, H = 0.6 * L, B = inp.bore, cy = H / 2, solids: Solid[] = [{ name: 'frame', mesh: box(-W / 2, 0, -L / 2, W / 2, H, L / 2) }];
  for (const sgn of [-1, 1]) {
    const x0 = sgn > 0 ? W / 2 + 0.5 * B : -W / 2 - 3.5 * B, x1 = x0 + 3 * B;
    solids.push({ name: 'cylinder', mesh: cylX(cy, 0, B, x0, x1) }, { name: 'distance piece', mesh: cylX(cy, 0, 0.7 * B, sgn > 0 ? W / 2 : -W / 2 - 0.5 * B, sgn > 0 ? W / 2 + 0.5 * B : -W / 2, 24) });
  }
  for (const s of motorAt(inp.motorD, translate(0, 0, L / 2 + 6))) solids.push(s);
  return done(inp.tag, 'COMPRESSOR', `${inp.tag} reciprocating compressor, frame ${L}", bore ${B}"`, {
    frameL: drawing(L, 'Frame length'), bore: drawing(B, 'Cylinder bore'), motorD: drawing(inp.motorD, 'Motor frame'),
    frameW: rule(W, 'SW-EQC-13', 'Frame width (0.5 L)'), frameH: rule(H, 'SW-EQC-13', 'Frame height (0.6 L)'), cylD: rule(2 * B, 'SW-EQC-13', 'Cylinder outside diameter (2 B)'), cylL: rule(3 * B, 'SW-EQC-13', 'Cylinder length (3 B)'),
  }, L + 6 + 2 * inp.motorD, solids);
}

export interface BlowerInput { tag: string; wheelD: number; motorD: number }
/** SW-EQC-14: centrifugal blower; z along the shaft, y up from the base's underside */
export function makeBlower(inp: BlowerInput): PartSpec {
  const D = inp.wheelD, cD = 1.4 * D, cW = 0.5 * D, cy = 1 + 0.7 * D + 6, baseL = cW + 12 + 1.6 * inp.motorD + 12, solids: Solid[] = [];
  solids.push({ name: 'base PL1', mesh: box(-cD / 2 - 6, 0, -6, cD / 2 + 6, 1, baseL - 6) }, { name: 'scroll casing', mesh: cylZ(0, cy, cD / 2, 0, cW) }, { name: 'casing pedestal', mesh: box(-0.3 * D, 1, 0, 0.3 * D, cy, cW) });
  solids.push({ name: 'outlet', mesh: box(-0.25 * D, cy + cD / 2 - 2, 0.05 * D, 0.25 * D, cy + cD / 2 + 0.4 * D, 0.45 * D) });
  solids.push({ name: 'inlet cone', mesh: at(revolve([{ r: 0.3 * D, z: 0 }, { r: 0.35 * D, z: -0.2 * D }, { r: 0.33 * D, z: -0.2 * D }, { r: 0.28 * D, z: 0 }], N), 0, cy, 0) });
  for (const s of motorAt(inp.motorD, translate(0, 1, cW + 12))) solids.push(s);
  return done(inp.tag, 'BLOWER', `${inp.tag} blower, wheel ${D}"`, {
    wheelD: drawing(D, 'Wheel diameter'), motorD: drawing(inp.motorD, 'Motor frame'), casingD: rule(cD, 'SW-EQC-14', 'Casing diameter (1.4 D)'), casingW: rule(cW, 'SW-EQC-14', 'Casing width (0.5 D)'),
    outlet: rule(0.5 * D, 'SW-EQC-14', 'Outlet 0.5 D × 0.4 D'), inlet: rule(0.6 * D, 'SW-EQC-14', 'Inlet cone diameter (0.6 D)'), shaftY: rule(cy, 'SW-EQC-14', 'Shaft centreline above the base'),
  }, baseL, solids);
}

export interface HeaterInput { tag: string; D: number; H: number; stackH: number }
/** SW-EQC-15: vertical cylindrical fired heater; z up from the leg bases */
export function makeFiredHeater(inp: HeaterInput): PartSpec {
  const legH = 96, D = inp.D, R = D / 2, t = 0.25, solids: Solid[] = [], w8 = proportionW(8, 24), prof = wProfile(w8);
  for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + (i * Math.PI) / 2; solids.push({ name: 'leg W8x24', mesh: transformMesh(extrude({ outer: prof }, legH, 0), multiply(translate((R - 6) * Math.cos(a), (R - 6) * Math.sin(a), 0), rotateZ(a))) }); }
  solids.push({ name: 'floor plate', mesh: cylZ(0, 0, R, legH, legH + 0.5) }, { name: 'radiant shell', mesh: tube(R, t, inp.H, legH + 0.5) });
  const zc = legH + 0.5 + inp.H, cs = 0.6 * D, ch = 0.4 * D;
  solids.push({ name: 'convection box', mesh: extrude({ outer: rect(-cs / 2, -cs / 2, cs / 2, cs / 2), inner: rect(-cs / 2 + t, -cs / 2 + t, cs / 2 - t, cs / 2 - t) }, ch, zc) }, { name: 'convection roof', mesh: box(-cs / 2, -cs / 2, zc + ch, cs / 2, cs / 2, zc + ch + t) });
  solids.push({ name: 'stack', mesh: tube(0.15 * D, 0.1875, inp.stackH, zc + ch + t) });
  return done(inp.tag, 'HEATER', `${inp.tag} fired heater ${D}" dia × ${inp.H}" radiant, stack ${inp.stackH}"`, {
    D: drawing(D, 'Radiant shell diameter'), H: drawing(inp.H, 'Radiant height'), stackH: drawing(inp.stackH, 'Stack height above the convection box'),
    legH: rule(legH, 'SW-EQC-15', 'Legs W8, 8 ft'), convection: rule(cs, 'SW-EQC-15', 'Convection box side (0.6 D)'), stackD: rule(0.3 * D, 'SW-EQC-15', 'Stack diameter (0.3 D)'),
  }, legH + inp.H + ch + inp.stackH, solids, ['Burners are data.'], { top: zc + ch + t + inp.stackH });
}

export interface AgitatedInput extends VesselVInput { motorD: number }
/** SW-EQC-16: agitated tank = vertical vessel with a top-mounted agitator; z up from the skirt base */
export function makeAgitatedTank(inp: AgitatedInput): PartSpec {
  const v = makeVerticalVessel(inp), ID = inp.ID, R = ID / 2 + inp.t, h = R / 2, top = inp.skirtH + h + inp.TT + h, bottomTL = inp.skirtH + h, solids = [...(v.extra!.solids as Solid[])];
  const gb = 0.8 * inp.motorD, nz = makeNozzle(`${inp.tag}-agit`, { NPS: 6, cls: inp.nozzles ? 'P150' : 'P150', shellT: inp.t });
  for (const s of nz.extra!.solids as Solid[]) solids.push({ ...s, mesh: at(s.mesh, 0, 0, top) });
  solids.push({ name: 'gearbox', mesh: box(-gb / 2, -gb / 2, top + 8, gb / 2, gb / 2, top + 8 + gb) });
  for (const s of motorAt(inp.motorD, multiply(translate(0, 0, top + 8 + gb + 1.6 * inp.motorD), SHAFT_DOWN))) solids.push(s);
  const shaftR = 0.04 * ID, zImp = bottomTL + 0.3 * ID;
  solids.push({ name: 'agitator shaft', mesh: cylZ(0, 0, shaftR, zImp, top + 8, 24) }, { name: 'impeller hub', mesh: cylZ(0, 0, 2 * shaftR, zImp - 2, zImp + 2, 24) });
  for (let i = 0; i < 3; i++) solids.push({ name: 'impeller blade', mesh: transformMesh(box(2 * shaftR, -0.04 * ID, zImp - 0.25, 0.165 * ID, 0.04 * ID, zImp + 0.25), rotateZ((2 * Math.PI * i) / 3)) });
  return done(inp.tag, 'AGITATED_TANK', `${inp.tag} agitated tank ${ID}" ID × ${inp.TT}" T/T`, {
    ...v.dims, motorD: drawing(inp.motorD, 'Agitator motor frame'), gearbox: rule(gb, 'SW-EQC-16', 'Gearbox cube (0.8 D)'), shaftD: rule(2 * shaftR, 'SW-EQC-16', 'Shaft diameter (0.08 ID)'),
    impeller: rule(0.33 * ID, 'SW-EQC-16', 'Impeller span (0.33 ID)'), impellerZ: rule(zImp, 'SW-EQC-16', 'Impeller elevation (0.3 ID above the bottom tangent line)'),
  }, top + 8 + gb + 1.6 * inp.motorD, solids, [], { ...(v.extra ?? {}) });
}

export interface FilterInput { tag: string; ID: number; t: number; TT: number; clearance: number; cls?: PipeClass }
/** SW-EQC-17: vertical quick-opening filter on legs; z up from the leg base plates */
export function makeFilter(inp: FilterInput): PartSpec {
  const R = inp.ID / 2 + inp.t, h = R / 2, legs = makeVesselLegs(`${inp.tag}-legs`, { ID: inp.ID, clearance: inp.clearance }), z0 = inp.clearance + h;
  const solids: Solid[] = [...(legs.extra!.solids as Solid[])];
  for (const s of vesselSolids(R, inp.t, inp.TT, 'head', 'head')) solids.push({ ...s, mesh: at(s.mesh, 0, 0, z0) });
  const f = designFlange(inp.ID, inp.cls ?? 'P150', inp.ID, inp.t, 2 * R), top = z0 + inp.TT;
  for (const s of flangeSolids(f, 'shell flange')) solids.push({ ...s, mesh: transformMesh(s.mesh, multiply(translate(0, 0, top), rotateX(Math.PI))) });
  for (const s of flangeSolids(f, 'head flange')) solids.push({ ...s, mesh: at(s.mesh, 0, 0, top) });
  for (const s of makeDavit(`${inp.tag}-davit`, 36, R + 6).extra!.solids as Solid[]) solids.push({ ...s, mesh: at(s.mesh, -R - 4, 0, top - 12) });
  return done(inp.tag, 'FILTER', `${inp.tag} filter ${inp.ID}" ID × ${inp.TT}" T/T, quick-opening`, {
    ID: drawing(inp.ID, 'Inside diameter'), t: drawing(inp.t, 'Shell thickness'), TT: drawing(inp.TT, 'Tangent to tangent'), clearance: drawing(inp.clearance, 'Bottom head clearance'),
    flangeOD: rule(f.OD, 'SW-EQC-17', 'Shell flange OD (SW-FLG-*)'), davit: rule(36, 'SW-EQC-17', 'Head davit post'),
  }, top + 2 * flangeLen(f) + h, solids, [], { R, top });
}

export interface BaghouseInput { tag: string; W: number; L: number; H: number; legH: number; outlet: number }
/** SW-EQC-18: dust collector; z up from the leg bases */
export function makeDustCollector(inp: BaghouseInput): PartSpec {
  const t = 0.1875, hopH = ((Math.min(inp.W, inp.L) - inp.outlet) / 2) * Math.tan(Math.PI / 3), zH = inp.legH, zB = zH + hopH, zT = zB + inp.H, solids: Solid[] = [];
  const w6 = proportionW(6, 15), prof = wProfile(w6);
  for (const [x, y] of [[-inp.L / 2 + 4, -inp.W / 2 + 4], [inp.L / 2 - 4, -inp.W / 2 + 4], [-inp.L / 2 + 4, inp.W / 2 - 4], [inp.L / 2 - 4, inp.W / 2 - 4]]) solids.push({ name: 'leg W6x15', mesh: at(extrude({ outer: prof }, zB, 0), x, y, 0) });
  // pyramidal hopper: four trapezoid plates on the slopes (SW-EQC-18)
  const o = inp.outlet / 2, X = inp.L / 2, Y = inp.W / 2;
  solids.push({ name: 'hopper (south)', mesh: quadPlate([[-X, -Y, zB], [X, -Y, zB], [o, -o, zH], [-o, -o, zH]], t) }, { name: 'hopper (north)', mesh: quadPlate([[X, Y, zB], [-X, Y, zB], [-o, o, zH], [o, o, zH]], t) },
    { name: 'hopper (east)', mesh: quadPlate([[X, -Y, zB], [X, Y, zB], [o, o, zH], [o, -o, zH]], t) }, { name: 'hopper (west)', mesh: quadPlate([[-X, Y, zB], [-X, -Y, zB], [-o, -o, zH], [-o, o, zH]], t) });
  solids.push({ name: 'housing', mesh: extrude({ outer: rect(-X, -Y, X, Y), inner: rect(-X + t, -Y + t, X - t, Y - t) }, inp.H, zB) }, { name: 'tube sheet', mesh: box(-X, -Y, zT - t, X, Y, zT) });
  solids.push({ name: 'clean-air plenum', mesh: extrude({ outer: rect(-X, -Y, X, Y), inner: rect(-X + t, -Y + t, X - t, Y - t) }, 24, zT) }, { name: 'plenum roof', mesh: box(-X, -Y, zT + 24, X, Y, zT + 24 + t) });
  for (const s of makeNozzle(`${inp.tag}-out`, { NPS: 12, cls: 'P150', shellT: t }).extra!.solids as Solid[]) solids.push({ ...s, mesh: at(s.mesh, 0, 0, zT + 24 + t) });
  solids.push({ name: 'outlet flange (feeder mount)', mesh: box(-o - 2, -o - 2, zH - 0.75, o + 2, o + 2, zH) });
  return done(inp.tag, 'DUST_COLLECTOR', `${inp.tag} dust collector ${inp.W}" × ${inp.L}" × ${inp.H}"`, {
    W: drawing(inp.W, 'Housing width'), L: drawing(inp.L, 'Housing length'), H: drawing(inp.H, 'Housing height'), legH: drawing(inp.legH, 'Hopper outlet height'), outlet: drawing(inp.outlet, 'Outlet square'),
    hopperH: rule(hopH, 'SW-EQC-18', 'Hopper height (60°)'), plenum: rule(24, 'SW-EQC-18', 'Clean-air plenum height'), t: rule(t, 'SW-EQC-18', 'Plate thickness'),
  }, zT + 24 + t + 8, solids, ['Rotary feeder at the outlet is a valve of the piping catalogue (SW-VLV-ROTARY).'], { zH, zB, zT });
}

export interface CycloneInput { tag: string; D: number }
/** SW-EQC-19: cyclone; z up from the cone's outlet */
export function makeCyclone(inp: CycloneInput): PartSpec {
  const D = inp.D, R = D / 2, t = 0.1875, ro = 0.125 * D, hc = (R - ro) * Math.tan(Math.PI / 3), zb = hc, zt = zb + 1.5 * D, solids: Solid[] = [];
  solids.push({ name: 'cone', mesh: revolve([{ r: ro, z: 0 }, { r: R, z: zb }, { r: R - t, z: zb }, { r: ro - Math.min(t, ro / 2), z: 0 }], N) }, { name: 'body', mesh: tube(R, t, 1.5 * D, zb) }, { name: 'top plate', mesh: at(extrude({ outer: circle(0, 0, R, N), inner: circle(0, 0, 0.25 * D, N) }, t, 0), 0, 0, zt) });
  solids.push({ name: 'vortex finder', mesh: tube(0.25 * D, t, 0.5 * D + 0.5 * D, zt - 0.5 * D) });
  solids.push({ name: 'inlet box', mesh: box(R - 0.2 * D, -0.5 * D - R, zt - 0.5 * D, R, 0, zt - 0.5 * D + 0.5 * D) });
  for (const s of makeSupportLugs(`${inp.tag}-lugs`, R).extra!.solids as Solid[]) solids.push({ ...s, mesh: at(s.mesh, 0, 0, zb + 0.5 * D) });
  return done(inp.tag, 'CYCLONE', `${inp.tag} cyclone ${D}" dia`, {
    D: drawing(D, 'Body diameter'), bodyH: rule(1.5 * D, 'SW-EQC-19', 'Body height (1.5 D)'), coneH: rule(hc, 'SW-EQC-19', 'Cone height (60°)'), outlet: rule(2 * ro, 'SW-EQC-19', 'Dust outlet (0.25 D)'),
    inlet: rule(0.5 * D, 'SW-EQC-19', 'Inlet 0.5 D × 0.2 D'), finder: rule(0.5 * D, 'SW-EQC-19', 'Vortex finder diameter (0.5 D)'), t: rule(t, 'SW-EQC-19', 'Plate thickness'),
  }, zt + 0.5 * D, solids, [], { zb, zt });
}

export interface ScrewInput { tag: string; D: number; L: number; motorD: number }
/** SW-EQC-20: screw conveyor; x along the trough, z up from the leg bases, trough bottom at z = legH (36 in) */
export function makeScrewConveyor(inp: ScrewInput): PartSpec {
  const D = inp.D, L = inp.L, t = 0.1875, w = D + 1, depth = 1.1 * D, legH = 36, zc = legH + w / 2, solids: Solid[] = [];
  const n = 24, u: Polygon = [{ x: -w / 2, y: depth }, { x: -w / 2, y: 0 }, ...Array.from({ length: n + 1 }, (_, i) => { const a = Math.PI + (Math.PI * i) / n; return { x: (w / 2) * Math.cos(a), y: (w / 2) * Math.sin(a) }; }).slice(1, -1), { x: w / 2, y: 0 }, { x: w / 2, y: depth }, { x: w / 2 - t, y: depth }, { x: w / 2 - t, y: 0 },
    ...Array.from({ length: n + 1 }, (_, i) => { const a = 2 * Math.PI - (Math.PI * i) / n; return { x: (w / 2 - t) * Math.cos(a), y: (w / 2 - t) * Math.sin(a) }; }).slice(1, -1), { x: -w / 2 + t, y: 0 }, { x: -w / 2 + t, y: depth }];
  solids.push({ name: 'trough', mesh: transformMesh(extrude({ outer: u }, L, 0), multiply(translate(0, 0, zc), multiply(rotateY(Math.PI / 2), rotateZ(0)))) });
  solids.push({ name: 'cover', mesh: box(0, -w / 2, zc + depth, L, w / 2, zc + depth + t) });
  const shaft = pipeDims(Math.max(1, Math.round(0.2 * D)), 'P150');
  solids.push({ name: 'shaft pipe', mesh: cylX(0, zc, shaft.OD / 2, -6, L + 6, 24) });
  solids.push({ name: 'screw flight', mesh: transformMesh(helixTube(D / 2 - 0.5, D, L / D, 0.5, 24, 8), multiply(translate(0, 0, zc), rotateY(Math.PI / 2))) });
  for (let x = 0; x <= L; x += 120) { const xx = Math.min(x, L - 3); for (const y of [-w / 2 - 2, w / 2 + 2]) solids.push({ name: 'leg L3x3x1/4', mesh: transformMesh(extrude({ outer: lProfile(3, 3, 0.25) }, legH, 0), translate(xx, y, 0)) }); solids.push({ name: 'saddle PL1/4', mesh: box(xx - 2, -w / 2 - 3, legH - 0.25, xx + 2, w / 2 + 3, legH) }); }
  for (const s of motorAt(inp.motorD, multiply(translate(L + 6, 0, zc - 1.1 * inp.motorD), SHAFT_X_UP_Z))) solids.push(s);
  return done(inp.tag, 'SCREW_CONVEYOR', `${inp.tag} screw conveyor ${D}" × ${(L / 12).toFixed(0)}'`, {
    D: drawing(D, 'Screw diameter'), L: drawing(L, 'Length'), motorD: drawing(inp.motorD, 'Drive motor frame'),
    troughW: rule(w, 'SW-EQC-20', 'Trough inside width (D + 1)'), troughD: rule(depth, 'SW-EQC-20', 'Trough depth above the centre (1.1 D)'), pitch: rule(D, 'SW-EQC-20', 'Screw pitch (= D)'), shaft: rule(shaft.OD, 'SW-EQC-20', 'Shaft pipe OD (0.2 D)'), legH: rule(legH, 'SW-EQC-20', 'Trough bottom height'),
  }, L + 12 + 1.6 * inp.motorD, solids, [], { zc });
}

export interface ElevatorInput { tag: string; W: number; H: number; motorD: number }
/** SW-EQC-21: bucket elevator; z up from the boot's base */
export function makeBucketElevator(inp: ElevatorInput): PartSpec {
  const W = inp.W, H = inp.H, t = 0.1875, bootH = 1.5 * W, headH = 2 * W, legD = 0.5 * W, solids: Solid[] = [];
  solids.push({ name: 'boot', mesh: extrude({ outer: rect(-W, -W / 2, W, W / 2), inner: rect(-W + t, -W / 2 + t, W - t, W / 2 - t) }, bootH, 0) }, { name: 'boot bottom', mesh: box(-W, -W / 2, 0, W, W / 2, t) });
  for (const x of [-W + 2, W - 2 - legD]) solids.push({ name: 'casing leg', mesh: extrude({ outer: rect(x, -W / 2 + 2, x + legD, W / 2 - 2), inner: rect(x + t, -W / 2 + 2 + t, x + legD - t, W / 2 - 2 - t) }, H - bootH - headH, bootH) });
  solids.push({ name: 'head', mesh: extrude({ outer: rect(-W, -W / 2, W, W / 2), inner: rect(-W + t, -W / 2 + t, W - t, W / 2 - t) }, headH, H - headH) }, { name: 'head roof', mesh: box(-W, -W / 2, H, W, W / 2, H + t) });
  solids.push({ name: 'discharge spout', mesh: box(W, -W / 4, H - headH + W / 2, W + W / 2, W / 4, H - headH + W) }, { name: 'inlet chute', mesh: box(-W - W / 2, -W / 4, bootH - W / 2, -W, W / 4, bootH) });
  for (const s of motorAt(inp.motorD, multiply(translate(0, W / 2 + 4, H - headH / 2 - 1.1 * inp.motorD), SHAFT_Y_UP_Z))) solids.push(s);
  return done(inp.tag, 'BUCKET_ELEVATOR', `${inp.tag} bucket elevator ${W}" × ${(H / 12).toFixed(0)}'`, {
    W: drawing(W, 'Leg section width'), H: drawing(H, 'Height to the head roof'), motorD: drawing(inp.motorD, 'Drive motor frame'),
    legD: rule(legD, 'SW-EQC-21', 'Leg section depth (0.5 W)'), boot: rule(bootH, 'SW-EQC-21', 'Boot height (1.5 W)'), head: rule(headH, 'SW-EQC-21', 'Head height (2 W)'), t: rule(t, 'SW-EQC-21', 'Plate thickness'),
  }, H + t, solids, ['Belt and buckets not modeled (SW-EQC-21).']);
}

export interface SiloInput { tag: string; D: number; H: number; outletNPS: number; outletH: number; t?: number }
/** SW-EQC-22: cone-bottom silo on a skirt; z up from the base ring */
export function makeSilo(inp: SiloInput): PartSpec {
  const R = inp.D / 2, t = inp.t ?? 0.25, ro = inp.outletNPS / 2, hc = (R - ro) * Math.tan(Math.PI / 3), zc = inp.outletH, zb = zc + hc, zt = zb + inp.H, solids: Solid[] = [];
  solids.push({ name: 'cone', mesh: revolve([{ r: ro, z: zc }, { r: R, z: zb }, { r: R - t, z: zb }, { r: ro - Math.min(t, ro / 2), z: zc }], N_REV) }, { name: 'shell', mesh: at(shellRing(R, t, inp.H), 0, 0, zb) }, { name: 'top plate', mesh: at(extrude({ outer: circle(0, 0, R, N_REV) }, t, 0), 0, 0, zt) });
  solids.push({ name: 'skirt', mesh: tube(R, 0.375, zb, 0) }, { name: 'base ring PL3/4', mesh: at(extrude({ outer: circle(0, 0, R + 6, N_REV), inner: circle(0, 0, R - 0.375, N_REV) }, 0.75, 0), 0, 0, -0.75) });
  const openHalf = Math.asin(Math.min(0.9, 12 / R)); solids.push({ name: 'skirt opening frame', mesh: at(extrude({ outer: annularSector(R - 0.375, R + 1, -openHalf, openHalf, 8), inner: annularSector(R - 0.375 + 0.01, R + 0.99, -openHalf, openHalf, 8) }, 36, 24), 0, 0, 0) });
  for (const s of makeManway(`${inp.tag}-mw`, { D: 20, cls: 'P150', shellT: t }).extra!.solids as Solid[]) solids.push({ ...s, mesh: at(s.mesh, R * 0.45, 0, zt + t) });
  for (const s of makeNozzle(`${inp.tag}-vent`, { NPS: 4, cls: 'P150', shellT: t }).extra!.solids as Solid[]) solids.push({ ...s, mesh: at(s.mesh, -R * 0.45, 0, zt + t) });
  return done(inp.tag, 'SILO', `${inp.tag} silo ${inp.D}" dia × ${inp.H}", cone bottom`, {
    D: drawing(inp.D, 'Shell diameter'), H: drawing(inp.H, 'Shell height'), outlet: drawing(inp.outletNPS, 'Outlet size'), outletH: drawing(inp.outletH, 'Outlet height above the base'), t: inp.t !== undefined ? drawing(t, 'Plate thickness') : rule(t, 'SW-EQC-22', 'Plate thickness'),
    coneH: rule(hc, 'SW-EQC-22', 'Cone height (60°)'), skirtH: rule(zb, 'SW-EQC-22', 'Skirt height (to the cone\'s rim)'), skirtT: rule(0.375, 'SW-EQ-1', 'Skirt thickness'),
  }, zt + t + 10 + 12, solids, ['Skirt and base ring as SW-EQ-1 (anchor rods SW-AR-*).'], { zc, zb, zt, R });
}

export interface SumpPumpInput { tag: string; NPS: number; cls: PipeClass; columnL: number; motorD: number; plate: number }
/** SW-EQC-23: vertical sump pump; z up from the bowl's bottom; the mounting plate at z = columnL + bowl length */
export function makeSumpPump(inp: SumpPumpInput): PartSpec {
  const pd = pipeDims(inp.NPS, inp.cls), bowlD = 2 * pd.OD, bowlL = 1.5 * pd.OD, zPlate = bowlL + inp.columnL, solids: Solid[] = [];
  solids.push({ name: 'bowl', mesh: cylZ(0, 0, bowlD / 2, 0, bowlL) }, { name: 'column pipe', mesh: tube(pd.OD / 2, pd.t, inp.columnL, bowlL) }, { name: 'mounting plate PL1', mesh: box(-inp.plate / 2, -inp.plate / 2, zPlate, inp.plate / 2, inp.plate / 2, zPlate + 1) });
  const dp = pipeDims(Math.max(1, inp.NPS / 2), inp.cls), xd = pd.OD / 2 + dp.OD;
  solids.push({ name: 'discharge pipe', mesh: at(tube(dp.OD / 2, dp.t, inp.columnL + 6, bowlL), xd, 0, 0) }, { name: 'discharge elbow', mesh: at(revolve([{ r: dp.OD / 2, z: 0 }, { r: dp.OD / 2, z: dp.OD }, { r: dp.OD / 2 - dp.t, z: dp.OD }, { r: dp.OD / 2 - dp.t, z: 0 }], 24), xd, 0, zPlate + 1 + 5) });
  for (const s of flangeSolids(designFlange(Math.max(1, inp.NPS / 2), inp.cls), 'discharge flange')) solids.push({ ...s, mesh: transformMesh(s.mesh, multiply(translate(xd, 0, zPlate + 1 + 5 + dp.OD), rotateX(Math.PI))) });
  for (const s of motorAt(inp.motorD, multiply(translate(0, 0, zPlate + 1 + 1.6 * inp.motorD), SHAFT_DOWN))) solids.push(s);
  return done(inp.tag, 'SUMP_PUMP', `${inp.tag} vertical sump pump ${inp.NPS}" column × ${inp.columnL}"`, {
    NPS: drawing(inp.NPS, 'Column pipe size'), columnL: drawing(inp.columnL, 'Column length'), motorD: drawing(inp.motorD, 'Motor frame'), plate: drawing(inp.plate, 'Mounting plate side'),
    bowlD: rule(bowlD, 'SW-EQC-23', 'Bowl diameter (2 × column OD)'), bowlL: rule(bowlL, 'SW-EQC-23', 'Bowl length (1.5 × column OD)'),
  }, zPlate + 1 + 1.6 * inp.motorD + 0.6 * inp.motorD, solids, [], { zPlate });
}

export interface HairpinInput { tag: string; innerNPS: number; outerNPS: number; cls: PipeClass; legL: number }
/** SW-EQC-24: double-pipe exchanger; x along the legs, y up from the cradle bases, legs at z = ±6 */
export function makeHairpin(inp: HairpinInput): PartSpec {
  const po = pipeDims(inp.outerNPS, inp.cls), pi = pipeDims(inp.innerNPS, inp.cls), y = 18, solids: Solid[] = [];
  for (const z of [-6, 6]) solids.push({ name: 'outer pipe', mesh: cylX(y, z, po.OD / 2, 0, inp.legL) }, { name: 'inner pipe', mesh: cylX(y, z, pi.OD / 2, -12, inp.legL + 12, 24) });
  const half = (() => { const positions: number[] = [], indices: number[] = [], n = 12, m = 16; for (let i = 0; i <= n; i++) { const a = (Math.PI * i) / n; for (let j = 0; j < m; j++) { const b = (2 * Math.PI * j) / m; const r = 6 + (po.OD / 2) * Math.cos(b); positions.push(inp.legL + r * Math.sin(a), y + (po.OD / 2) * Math.sin(b), r * Math.cos(a)); } } for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const a = i * m + j, b = i * m + ((j + 1) % m), c = (i + 1) * m + j, d = (i + 1) * m + ((j + 1) % m); indices.push(a, c, b, b, c, d); } for (let j = 1; j < m - 1; j++) indices.push(0, j, j + 1); const o = n * m; for (let j = 1; j < m - 1; j++) indices.push(o, o + j + 1, o + j); return { positions, indices }; })();
  solids.push({ name: 'return bend', mesh: half });
  for (const x of [inp.legL * 0.2, inp.legL * 0.8]) for (const z of [-6, 6]) solids.push({ name: 'cradle L3x3x1/4', mesh: transformMesh(extrude({ outer: lProfile(3, 3, 0.25) }, y - po.OD / 2, 0), multiply(translate(x, 0, z), rotateX(-Math.PI / 2))) });
  return done(inp.tag, 'HAIRPIN', `${inp.tag} hairpin exchanger ${inp.innerNPS}" in ${inp.outerNPS}" × ${(inp.legL / 12).toFixed(0)}'`, {
    innerNPS: drawing(inp.innerNPS, 'Inner pipe'), outerNPS: drawing(inp.outerNPS, 'Outer pipe'), legL: drawing(inp.legL, 'Leg length'), spacing: rule(12, 'SW-EQC-24', 'Leg spacing on centres'), cradleH: rule(y, 'SW-EQC-24', 'Centreline above the cradle base'),
  }, inp.legL + 6 + po.OD / 2, solids, ['Return bend drawn as a half torus of the outer pipe (SW-EQC-24).']);
}

export interface PlateExchangerInput { tag: string; plates: number; W: number; H: number }
/** SW-EQC-25: plate exchanger; z along the pack, y up from the feet */
export function makePlateExchanger(inp: PlateExchangerInput): PartSpec {
  const pitch = 0.125, packL = inp.plates * pitch, ft = 2, y0 = 6, solids: Solid[] = [];
  solids.push({ name: 'fixed frame PL2', mesh: box(-inp.W / 2, y0, 0, inp.W / 2, y0 + inp.H, ft) }, { name: 'plate pack', mesh: box(-inp.W / 2 + 2, y0 + 2, ft, inp.W / 2 - 2, y0 + inp.H - 2, ft + packL) }, { name: 'moving frame PL2', mesh: box(-inp.W / 2, y0, ft + packL, inp.W / 2, y0 + inp.H, 2 * ft + packL) });
  for (const [x, y] of [[-inp.W / 2 + 3, y0 + 3], [inp.W / 2 - 3, y0 + 3], [-inp.W / 2 + 3, y0 + inp.H - 3], [inp.W / 2 - 3, y0 + inp.H - 3]]) solids.push({ name: 'tie rod RD1', mesh: cylZ(x, y, 0.5, -2, 2 * ft + packL + 2, 16) });
  const c6 = proportionC(6, 8.2); for (const x of [-inp.W / 2 + 4, inp.W / 2 - 4]) solids.push({ name: 'foot C6x8.2', mesh: transformMesh(extrude({ outer: cProfile(c6) }, 2 * ft + packL + 12, -6), multiply(translate(x, y0, 0), rotateZ(Math.PI / 2))) });
  const f = designFlange(4, 'P150');
  for (const [x, y] of [[-inp.W / 4, y0 + inp.H - 8], [inp.W / 4, y0 + inp.H - 8], [-inp.W / 4, y0 + 8], [inp.W / 4, y0 + 8]]) for (const s of flangeSolids(f, 'nozzle')) solids.push({ ...s, mesh: transformMesh(s.mesh, multiply(translate(x, y, -4), rotateX(0))) });
  return done(inp.tag, 'PLATE_EXCHANGER', `${inp.tag} plate exchanger ${inp.plates} plates, ${inp.W}" × ${inp.H}"`, {
    plates: drawing(inp.plates, 'Plate count', 'count'), W: drawing(inp.W, 'Plate width'), H: drawing(inp.H, 'Plate height'), pitch: rule(pitch, 'SW-EQC-25', 'Plate pitch'), packL: rule(packL, 'SW-EQC-25', 'Pack length'), frameT: rule(ft, 'SW-EQC-25', 'Frame plate thickness'),
  }, 2 * ft + packL + 12, solids, ['Nozzles 4 in on the fixed frame (SW-EQC-25).']);
}

void headLoop; void RHO;
