/** Equipment envelopes: DESIGN_BASIS.md section 25 (SW-EQ-*). Nozzles are stage-5 data. */
import { K } from '../../core/constants';
import { drawing, rule, constant, type Dim } from '../../core/basis';
import { DEFAULT_MATERIAL, type PartSpec, type Material } from '../part';
import { revolve, extrude, transformMesh, signedVolume, type MeshData } from '../../geometry/mesh';
import { circle, rect, annularSector } from '../../geometry/polygon';
import { frameFromAxes, translate, multiply, rotateX } from '../../geometry/transform';

const RHO = K.STEEL_DENSITY_LB_IN3;
const rhoDim = () => constant(K.STEEL_DENSITY_LB_FT3, 'K-1', 'Steel density', 'lb/ft3');
export const N_REV = 64;

export interface NozzleSpec { tag: string; service: string; nps: number; elevation: number; angleDeg: number; orientation: 'radial' | 'top' | 'bottom' }

/** 2:1 ellipsoidal head loop (SW-EQ-1): outer and inner surfaces, tangent line at z = 0, apex at ±D/4. */
function headLoop(R: number, t: number, dir: 1 | -1): { r: number; z: number }[] {
  const n = 16, h = R / 2, out: { r: number; z: number }[] = [];
  for (let i = 0; i <= n; i++) { const a = (Math.PI / 2) * (i / n); out.push({ r: R * Math.cos(a), z: dir * h * Math.sin(a) }); }
  for (let i = n; i >= 0; i--) { const a = (Math.PI / 2) * (i / n); out.push({ r: (R - t) * Math.cos(a), z: dir * (h - t) * Math.sin(a) }); }
  return out;
}
const shellRing = (R: number, t: number, L: number): MeshData => extrude({ outer: circle(0, 0, R, N_REV), inner: circle(0, 0, R - t, N_REV) }, L);

/** Build solids for a cylindrical vessel along local z (z = 0 at the bottom tangent line). */
function vesselSolids(R: number, t: number, L: number, bottom: 'head' | 'flat' | 'none', top: 'head' | 'cone' | 'flat', coneRise = 0, flatT = 0): { name: string; mesh: MeshData }[] {
  const s: { name: string; mesh: MeshData }[] = [{ name: 'shell', mesh: shellRing(R, t, L) }];
  if (bottom === 'head') s.push({ name: 'bottom head', mesh: revolve(headLoop(R, t, -1), N_REV) });
  if (bottom === 'flat') s.push({ name: 'bottom plate', mesh: transformMesh(extrude({ outer: circle(0, 0, R, N_REV) }, flatT), translate(0, 0, -flatT)) });
  if (top === 'head') s.push({ name: 'top head', mesh: transformMesh(revolve(headLoop(R, t, 1), N_REV), translate(0, 0, L)) });
  if (top === 'cone') s.push({ name: 'cone roof', mesh: transformMesh(revolve([{ r: R, z: 0 }, { r: 0, z: coneRise }, { r: 0, z: coneRise + flatT }, { r: R, z: flatT }], N_REV), translate(0, 0, L)) });
  if (top === 'flat') s.push({ name: 'cover', mesh: transformMesh(extrude({ outer: circle(0, 0, R, N_REV) }, flatT), translate(0, 0, L)) });
  return s;
}

function finish(id: string, kind: PartSpec['kind'], designation: string, dims: Record<string, Dim>, lengthIn: number, solids: { name: string; mesh: MeshData }[], material: Material, nozzles: NozzleSpec[], notes: string[], extra: Record<string, unknown> = {}): PartSpec {
  const vol = solids.reduce((a, s) => a + signedVolume(s.mesh), 0);
  return {
    id, kind, category: 'equipment', designation, dims: { ...dims, rho: rhoDim() },
    length: drawing(lengthIn, 'Overall length along the axis'), material,
    weight: rule(vol * RHO, 'SW-EQ-7', 'Empty steel weight from the drawn envelope', 'lb'),
    notes: ['Envelope only; internals not modeled (SW-EQ-*). Nozzles placed in stage 5.', ...notes],
    extra: { solids, nozzles, ...extra },
  };
}

export interface VesselVInput { tag: string; ID: number; t: number; TT: number; skirtH: number; rods?: number; nozzles?: NozzleSpec[] }
/** Vertical vessel on a skirt (SW-EQ-1). Local z up from the skirt base (z = 0 at the base ring). */
export function makeVerticalVessel(inp: VesselVInput, material: Material = DEFAULT_MATERIAL): PartSpec {
  const R = inp.ID / 2 + inp.t, h = R / 2, rods = Math.max(8, inp.rods ?? 8);
  const solids = vesselSolids(R, inp.t, inp.TT, 'head', 'head').map(s => ({ ...s, mesh: transformMesh(s.mesh, translate(0, 0, inp.skirtH + h)) }));
  // skirt with one access opening: two ring sectors
  const openHalf = Math.asin(12 / R);
  const openH = Math.min(36, inp.skirtH - 8), openBottom = Math.min(24, (inp.skirtH - openH) / 2);  // 24 × 36 opening, clamped for short skirts
  const skirtLo = extrude({ outer: circle(0, 0, R, N_REV), inner: circle(0, 0, R - 0.375, N_REV) }, openBottom);
  const skirtSector = extrude({ outer: annularSector(R - 0.375, R, openHalf, 2 * Math.PI - openHalf, N_REV), inner: undefined }, openH);
  const skirtHi = extrude({ outer: circle(0, 0, R, N_REV), inner: circle(0, 0, R - 0.375, N_REV) }, inp.skirtH - openBottom - openH);
  solids.push({ name: 'skirt (below opening)', mesh: skirtLo }, { name: 'skirt (at opening)', mesh: transformMesh(skirtSector, translate(0, 0, openBottom)) }, { name: 'skirt (above opening)', mesh: transformMesh(skirtHi, translate(0, 0, openBottom + openH)) });
  solids.push({ name: 'base ring', mesh: transformMesh(extrude({ outer: circle(0, 0, R + 6, N_REV), inner: circle(0, 0, R - 0.375, N_REV) }, 0.75), translate(0, 0, -0.75)) });
  const total = inp.skirtH + inp.TT + 2 * h;
  return finish(inp.tag, 'VESSEL_V', `${inp.tag} vertical vessel ${inp.ID}" ID × ${inp.TT}" T/T`, {
    ID: drawing(inp.ID, 'Inside diameter'), t: drawing(inp.t, 'Shell thickness'), TT: drawing(inp.TT, 'Tangent to tangent'), skirtH: drawing(inp.skirtH, 'Skirt height'),
    headDepth: rule(h, 'SW-EQ-1', 'Head depth (2:1 ellipsoidal)'), skirtT: rule(0.375, 'SW-EQ-1', 'Skirt thickness'), baseRingW: rule(6, 'SW-EQ-1', 'Base ring width'),
    rods: rule(rods, 'SW-EQ-1', 'Anchor rod count', 'count'), topTangent: rule(inp.skirtH + h + inp.TT, 'SW-EQ-1', 'Top tangent line elevation above base'),
  }, total, solids, material, inp.nozzles ?? [], [], { R, rods, baseRingR: R + 3 });
}

export interface VesselHInput { tag: string; ID: number; t: number; TT: number; centreline: number; nozzles?: NozzleSpec[] }
/** Horizontal vessel on saddles (SW-EQ-2). Local z along the axis from the left tangent line; local y up; saddles reach down to y = −centreline. */
export function makeHorizontalVessel(inp: VesselHInput, material: Material = DEFAULT_MATERIAL, channel = 0, coverT = 0): PartSpec {
  const R = inp.ID / 2 + inp.t, h = R / 2;
  const body = vesselSolids(R, inp.t, inp.TT, channel ? 'none' : 'head', 'head');
  const solids: { name: string; mesh: MeshData }[] = body;
  if (channel) {
    solids.push({ name: 'channel', mesh: transformMesh(shellRing(R, inp.t, channel), translate(0, 0, -channel)) });
    solids.push({ name: 'channel cover', mesh: transformMesh(extrude({ outer: circle(0, 0, R + 2, N_REV) }, coverT), translate(0, 0, -channel - coverT)) });
  }
  // saddles at 0.2 L from each tangent line (SW-EQ-2): web plate, base plate, wear plate 120°
  const sw = Math.max(6, inp.ID / 3), wear = 1 / 2;
  for (const zc of [0.2 * inp.TT, 0.8 * inp.TT]) {
    const webH = inp.centreline - 0.5, wPlate = 2 * R * 0.95;
    // web: rectangle in local xy (x across, y down from the shell bottom to the base), trimmed by the shell arc approximately as a rectangle below the shell
    const web = extrude({ outer: rect(-wPlate / 2, -inp.centreline + 0.5, wPlate / 2, -R + 1) }, 0.5);
    solids.push({ name: 'saddle web', mesh: transformMesh(web, translate(0, 0, zc - 0.25)) });
    solids.push({ name: 'saddle base', mesh: transformMesh(extrude({ outer: rect(-wPlate / 2 - 2, -inp.centreline, wPlate / 2 + 2, -inp.centreline + 0.5) }, sw), translate(0, 0, zc - sw / 2)) });
    solids.push({ name: 'saddle wear plate', mesh: transformMesh(extrude({ outer: annularSector(R, R + wear, Math.PI * (1 + 1 / 6), Math.PI * (2 - 1 / 6), 24) }, sw + 4), translate(0, 0, zc - sw / 2 - 2)) });
    void webH;
  }
  const total = inp.TT + 2 * h + channel + coverT;
  return finish(inp.tag, channel ? 'EXCHANGER' : 'VESSEL_H', `${inp.tag} ${channel ? 'shell-and-tube exchanger' : 'horizontal vessel'} ${inp.ID}" ID × ${inp.TT}"`, {
    ID: drawing(inp.ID, 'Inside diameter'), t: drawing(inp.t, 'Shell thickness'), TT: drawing(inp.TT, 'Tangent to tangent'), centreline: drawing(inp.centreline, 'Centreline elevation above the pad'),
    headDepth: rule(h, channel ? 'SW-EQ-3' : 'SW-EQ-2', 'Head depth (2:1 ellipsoidal)'), saddleW: rule(sw, 'SW-EQ-2', 'Saddle width'), saddleZ: rule(0.2 * inp.TT, 'SW-EQ-2', 'Saddle from tangent line'),
    ...(channel ? { channel: rule(channel, 'SW-EQ-3', 'Channel length'), coverT: rule(coverT, 'SW-EQ-3', 'Channel cover thickness') } : {}),
  }, total, solids, material, inp.nozzles ?? [], [], { R });
}
export const makeExchanger = (inp: VesselHInput, material?: Material) => makeHorizontalVessel(inp, material, inp.ID / 2, Math.max(1, inp.ID / 12));

export interface PumpInput { tag: string; baseW: number; baseL: number; casingD: number; casingW: number; motorD: number; motorL: number; nozzles?: NozzleSpec[] }
/** Centrifugal pump (SW-EQ-4). Local z along the shaft (motor at +z), x across, y up from the baseplate underside. */
export function makePump(inp: PumpInput, material: Material = DEFAULT_MATERIAL): PartSpec {
  const solids: { name: string; mesh: MeshData }[] = [];
  solids.push({ name: 'baseplate', mesh: transformMesh(extrude({ outer: rect(-inp.baseW / 2, 0, inp.baseW / 2, 1) }, inp.baseL), translate(0, 0, -inp.baseL / 2)) });
  const shaftY = 1 + inp.casingD / 2 + 4;
  solids.push({ name: 'pump pedestal', mesh: transformMesh(extrude({ outer: rect(-inp.casingD / 3, 1, inp.casingD / 3, shaftY - 2) }, inp.casingW + 4), translate(0, 0, -inp.baseL / 2 + 4)) });
  solids.push({ name: 'casing', mesh: transformMesh(extrude({ outer: circle(0, shaftY, inp.casingD / 2, 32) }, inp.casingW), translate(0, 0, -inp.baseL / 2 + 6)) });
  solids.push({ name: 'coupling guard', mesh: transformMesh(extrude({ outer: rect(-3, shaftY - 3, 3, shaftY + 3) }, 8), translate(0, 0, -inp.baseL / 2 + 6 + inp.casingW)) });
  const mz = -inp.baseL / 2 + 14 + inp.casingW;
  solids.push({ name: 'motor foot', mesh: transformMesh(extrude({ outer: rect(-inp.motorD / 2, 1, inp.motorD / 2, shaftY - inp.motorD / 2 + 1) }, inp.motorL - 4), translate(0, 0, mz + 2)) });
  solids.push({ name: 'motor', mesh: transformMesh(extrude({ outer: circle(0, shaftY, inp.motorD / 2, 32) }, inp.motorL), translate(0, 0, mz)) });
  return finish(inp.tag, 'PUMP', `${inp.tag} centrifugal pump`, {
    baseW: drawing(inp.baseW, 'Baseplate width'), baseL: drawing(inp.baseL, 'Baseplate length'), casingD: drawing(inp.casingD, 'Casing diameter'), motorD: drawing(inp.motorD, 'Motor diameter'), motorL: drawing(inp.motorL, 'Motor length'),
    baseT: rule(1, 'SW-EQ-4', 'Baseplate thickness'), shaftY: rule(shaftY, 'SW-EQ-4', 'Shaft centreline above the pad'),
  }, inp.baseL, solids, material, inp.nozzles ?? [], [], {});
}

export interface TankInput { tag: string; D: number; H: number; t: number; nozzles?: NozzleSpec[] }
/** Flat-bottom tank with cone roof (SW-EQ-5). Local z up from the slab. */
export function makeTank(inp: TankInput, material: Material = DEFAULT_MATERIAL): PartSpec {
  const R = inp.D / 2, rise = (R * 0.75) / 12, roofT = 3 / 16;
  const solids = vesselSolids(R, inp.t, inp.H, 'flat', 'cone', rise, roofT).map(s => s.name === 'bottom plate' ? { ...s, mesh: transformMesh(s.mesh, translate(0, 0, roofT)) } : s);
  // curb angle L2x2x1/4 (SW-EQ-5) as a ring: vertical leg outside the shell top, horizontal leg inward under the roof
  solids.push({ name: 'curb angle', mesh: transformMesh(extrude({ outer: circle(0, 0, R + 0.25, N_REV), inner: circle(0, 0, R, N_REV) }, 2), translate(0, 0, inp.H - 2)) });
  solids.push({ name: 'curb angle leg', mesh: transformMesh(extrude({ outer: circle(0, 0, R + 0.25, N_REV), inner: circle(0, 0, R - 2, N_REV) }, 0.25), translate(0, 0, inp.H - 0.25)) });
  return finish(inp.tag, 'TANK', `${inp.tag} tank ${inp.D / 12}' dia × ${inp.H / 12}' high`, {
    D: drawing(inp.D, 'Diameter'), H: drawing(inp.H, 'Shell height'), t: drawing(inp.t, 'Shell thickness'),
    roofRise: rule(rise, 'SW-EQ-5', 'Cone roof rise'), roofT: rule(roofT, 'SW-EQ-5', 'Roof plate thickness'), bottomT: rule(roofT, 'SW-EQ-5', 'Bottom plate thickness'),
  }, inp.H + rise + roofT, solids, material, inp.nozzles ?? [], [], { R });
}
void frameFromAxes; void multiply; void rotateX;
