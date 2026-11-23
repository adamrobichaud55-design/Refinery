/**
 * Civil and concrete catalogue: DESIGN_BASIS.md §65 (SW-CIV-*). Every part is a true-scale concrete solid with its bar
 * list and quantities (SW-CIV-15). Local frame: x and y in plan, z up from the bottom of the part (or from grade where
 * a rule says so). Nothing here comes from a published table (PROVENANCE P-72).
 */
import { K } from '../../core/constants';
import { drawing, rule, constant, type Dim } from '../../core/basis';
import { roundUpTo } from '../../core/units';
import type { PartSpec, Material } from '../part';
import { extrude, signedVolume, type MeshData } from '../../geometry/mesh';
import { rect, type Polygon } from '../../geometry/polygon';

const RHO_C = K.CONCRETE_DENSITY_LB_IN3, RHO_S = K.STEEL_DENSITY_LB_IN3;
const rhoC = () => constant(K.CONCRETE_DENSITY_LB_FT3, 'K-7', 'Concrete density', 'lb/ft3');

/** SW-CIV-1: the two concrete classes and the bar grade */
export const CONCRETE_A: Material = { grade: 'Class A concrete (3 ksi)', Fy: rule(3, 'SW-CIV-1', 'Compressive strength (class A)', 'ksi') };
export const CONCRETE_B: Material = { grade: 'Class B concrete (4 ksi)', Fy: rule(4, 'SW-CIV-1', 'Compressive strength (class B)', 'ksi') };
export const GROUT: Material = { grade: 'Non-shrink cementitious grout', Fy: rule(4, 'SW-CIV-11', 'Compressive strength (as class B)', 'ksi') };
export const REBAR_GRADE: Material = { grade: 'Grade 60 reinforcing bar', Fy: drawing(60, 'Minimum yield strength (grade stated on drawing)', 'ksi') };

/** SW-CIV-1: bar #n has diameter n/8 in (SmartWeld's own naming) */
export const barDiameter = (n: number) => n / 8;
export const barArea = (n: number) => (Math.PI * barDiameter(n) ** 2) / 4;
/** SW-CIV-3b: a 90° hook adds 12 d to the bar's length */
export const hookLength = (n: number) => 12 * barDiameter(n);

export interface Bar { designation: string; n: number; count: number; length: number; weight: number; note: string }
export function bars(n: number, count: number, length: number, note: string): Bar {
  return { designation: `#${n}`, n, count, length, weight: count * length * barArea(n) * RHO_S, note };
}
/** bars of size n at spacing s across a width w (cover c each side): count and the clear spacing used */
const spaced = (w: number, s: number, c: number) => Math.max(2, Math.ceil((w - 2 * c) / s) + 1);

const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): MeshData => extrude({ outer: rect(x0, y0, x1, y1) }, z1 - z0, z0);
/** a regular octagon of across-flats width F, centred */
export function octagon(F: number): Polygon {
  const R = F / 2 / Math.cos(Math.PI / 8);
  return Array.from({ length: 8 }, (_, i) => ({ x: R * Math.cos((Math.PI / 4) * i + Math.PI / 8), y: R * Math.sin((Math.PI / 4) * i + Math.PI / 8) }));
}
/** area of a regular octagon of across-flats width F: 2(√2 − 1) F² */
export const octagonArea = (F: number) => 2 * (Math.SQRT2 - 1) * F * F;

interface Solid { name: string; mesh: MeshData }
/** SW-CIV-15: volume, weight, formed area and bars onto the spec */
function finishCivil(id: string, kind: PartSpec['kind'], designation: string, dims: Record<string, Dim>, lengthIn: number, solids: Solid[], material: Material, barList: Bar[], formedIn2: number, notes: string[], extra: Record<string, unknown> = {}): PartSpec {
  const vol = solids.reduce((a, s) => a + signedVolume(s.mesh), 0), wC = vol * RHO_C, wB = barList.reduce((a, b) => a + b.weight, 0);
  return {
    id, kind, category: 'civil', designation,
    dims: {
      ...dims, rho: rhoC(),
      volume: rule(vol / 46656, 'SW-CIV-15', 'Concrete volume', 'yd3'), concreteWeight: rule(wC, 'SW-CIV-15', 'Concrete weight (volume × K-7)', 'lb'),
      formedArea: rule(formedIn2 / 144, 'SW-CIV-15', 'Formed area', 'ft2'), barWeight: rule(wB, 'SW-CIV-15', 'Reinforcing bar weight (K-1)', 'lb'),
    },
    length: drawing(lengthIn, 'Overall length'), material,
    weight: rule(wC + wB, 'SW-CIV-15', 'Concrete plus bars', 'lb'),
    notes: ['Concrete solid at true scale; bars listed, not drawn (SW-CIV-15).', ...notes],
    extra: { solids: solids.map(s => ({ ...s, role: 'concrete' })), bars: barList, ...extra },
  };
}
const cover = { earth: 3, formed: 2, slab: 1.5 };   // SW-CIV-2

export interface FootingInput { loadKips: number; bearingKsf?: number; pedestalSide: number }
/** SW-CIV-3: square spread footing; z up from the bottom; the pedestal (SW-CIV-4) stands on its top */
export function makeFooting(id: string, inp: FootingInput): PartSpec {
  const q = inp.bearingKsf ?? 3, qDim: Dim = inp.bearingKsf !== undefined ? drawing(inp.bearingKsf, 'Allowable bearing', 'ksf') : rule(3, 'SW-CIV-3a', 'Allowable bearing (default)', 'ksf');
  const B = Math.max(36, roundUpTo(Math.sqrt((1.1 * inp.loadKips) / q) * 12, 6));
  const proj = (B - inp.pedestalSide) / 2, t = roundUpTo(Math.max(12, proj), 3);
  const sMat = Math.min(12, barArea(5) / (0.002 * t)), n = spaced(B, sMat, cover.earth), L = B - 2 * cover.earth + 2 * hookLength(5);
  const mat = [bars(5, n, L, 'bottom mat, x direction, hooked ends'), bars(5, n, L, 'bottom mat, y direction, hooked ends')];
  return finishCivil(id, 'FOOTING', `Footing ${B / 12}' × ${B / 12}' × ${t}" (class B)`, {
    P: drawing(inp.loadKips, 'Column load', 'kip'), q: qDim, pedestal: drawing(inp.pedestalSide, 'Pedestal side'),
    B: rule(B, 'SW-CIV-3', 'Plan side (bearing, 1.1 P / q)'), t: rule(t, 'SW-CIV-3', 'Thickness (45° spread from the pedestal face)'),
    barSpacing: rule(sMat, 'SW-CIV-3', 'Mat bar spacing (0.2 % of b·t, ≤ 12 in)'), cover: rule(cover.earth, 'SW-CIV-2', 'Cover (cast against earth)'),
  }, B, [{ name: 'footing', mesh: box(-B / 2, -B / 2, 0, B / 2, B / 2, t) }], CONCRETE_B, mat, 4 * B * t, ['Sides formed, bottom cast against earth.'], { B, t });
}

export interface PedestalInput { plateN: number; plateB: number; height: number }
/** SW-CIV-4: pedestal over a footing; z up from its bottom (the footing top) */
export function makePedestal(id: string, inp: PedestalInput): PartSpec {
  const a = Math.max(12, roundUpTo(inp.plateN + 12, 2)), b = Math.max(12, roundUpTo(inp.plateB + 12, 2)), h = inp.height;
  const nV = 4 + 2 * (Math.max(0, Math.ceil(a / 12) - 1) + Math.max(0, Math.ceil(b / 12) - 1));
  const nT = Math.max(2, Math.floor((h - 3) / 12) + 1), tieL = 2 * (a + b - 4 * cover.formed) + 2 * hookLength(3);
  const list = [bars(5, nV, h + 12 + hookLength(5), 'verticals, hooked into the footing (12 in embedment)'), bars(3, nT, tieL, 'ties at 12 in, first 3 in below the top')];
  return finishCivil(id, 'PEDESTAL', `Pedestal ${a}" × ${b}" × ${h}" (class B)`, {
    plateN: drawing(inp.plateN, 'Base plate N'), plateB: drawing(inp.plateB, 'Base plate B'), h: drawing(h, 'Height'),
    a: rule(a, 'SW-CIV-4', 'Side (plate + 6 in each way, to 2 in)'), b: rule(b, 'SW-CIV-4', 'Side (plate + 6 in each way, to 2 in)'),
    verticals: rule(nV, 'SW-CIV-4', 'Vertical bars #5', 'count'), ties: rule(nT, 'SW-CIV-4', 'Ties #3', 'count'), cover: rule(cover.formed, 'SW-CIV-2', 'Cover (formed)'),
  }, h, [{ name: 'pedestal', mesh: box(-a / 2, -b / 2, 0, a / 2, b / 2, h) }], CONCRETE_B, list, 2 * (a + b) * h, [], { a, b, h });
}

export interface PadInput { baseW: number; baseL: number; height?: number; pump?: boolean }
/** SW-CIV-5: housekeeping pad on the slab; z up from the slab */
export function makeEquipmentPad(id: string, inp: PadInput): PartSpec {
  const h = inp.height ?? (inp.pump ? 9 : 6), w = inp.baseW + 12, L = inp.baseL + 12;
  const nx = spaced(L, 12, cover.slab), ny = spaced(w, 12, cover.slab), nD = Math.ceil((2 * (w + L)) / 24);
  const list = [bars(4, nx, w - 2 * cover.slab, 'mesh across the width at mid-height'), bars(4, ny, L - 2 * cover.slab, 'mesh along the length at mid-height'), bars(4, nD, 10, 'dowels into the slab, 6 in in, 4 in up, at 24 in round the edge')];
  return finishCivil(id, 'PAD', `Equipment pad ${w}" × ${L}" × ${h}" (class B)`, {
    baseW: drawing(inp.baseW, 'Equipment base width'), baseL: drawing(inp.baseL, 'Equipment base length'),
    w: rule(w, 'SW-CIV-5', 'Width (base + 6 in each side)'), L: rule(L, 'SW-CIV-5', 'Length (base + 6 in each side)'), h: inp.height !== undefined ? drawing(h, 'Height') : rule(h, 'SW-CIV-5', inp.pump ? 'Height (pump)' : 'Height'),
    dowels: rule(nD, 'SW-CIV-5', 'Dowels #4', 'count'), cover: rule(cover.slab, 'SW-CIV-2', 'Cover (indoor pad)'),
  }, L, [{ name: 'pad', mesh: box(-L / 2, -w / 2, 0, L / 2, w / 2, h) }], CONCRETE_B, list, 2 * (w + L) * h, [], { w, L, h });
}

export interface SlabInput { w: number; L: number; t?: number; thickenedEdge?: boolean }
/** SW-CIV-6: slab on grade; z up from the slab's underside (the thickened edge hangs below) */
export function makeSlab(id: string, inp: SlabInput): PartSpec {
  const t = inp.t ?? 6, edge = inp.thickenedEdge ?? true, w = inp.w, L = inp.L;
  const solids: Solid[] = [{ name: 'slab', mesh: box(0, 0, 0, L, w, t) }];
  if (edge) for (const [x0, y0, x1, y1] of [[0, 0, L, 12], [0, w - 12, L, w], [0, 12, 12, w - 12], [L - 12, 12, L, w - 12]]) solids.push({ name: 'thickened edge', mesh: box(x0, y0, -12, x1, y1, 0) });
  const nx = spaced(L, 18, cover.slab), ny = spaced(w, 18, cover.slab);
  const list = [bars(4, nx, w - 2 * cover.slab, 'mesh across the width at mid-depth'), bars(4, ny, L - 2 * cover.slab, 'mesh along the length at mid-depth')];
  if (edge) list.push(bars(5, 2, 2 * (w + L), 'thickened edge, continuous (two bars)'));
  return finishCivil(id, 'SLAB', `Slab on grade ${(L / 12).toFixed(0)}' × ${(w / 12).toFixed(0)}' × ${t}" (class A)`, {
    w: drawing(w, 'Width'), L: drawing(L, 'Length'), t: inp.t !== undefined ? drawing(t, 'Thickness') : rule(t, 'SW-CIV-6', 'Thickness'),
    edgeW: rule(edge ? 12 : 0, 'SW-CIV-6', 'Thickened edge width'), edgeD: rule(edge ? 12 : 0, 'SW-CIV-6', 'Thickened edge depth below the slab'),
    cover: rule(cover.slab, 'SW-CIV-2', 'Cover (slab)'),
  }, L, solids, CONCRETE_A, list, 2 * (w + L) * (t + (edge ? 12 : 0)), ['On a 6 in compacted granular base (not modeled).'], { w, L, t });
}

export interface OctagonInput { baseRingOD: number; weightKips: number; bearingKsf?: number; pedestalH: number }
/** SW-CIV-7: octagonal pedestal and footing for a skirt-supported vessel; z up from the footing's bottom */
export function makeOctagonFoundation(id: string, inp: OctagonInput): PartSpec {
  const q = inp.bearingKsf ?? 3, qDim: Dim = inp.bearingKsf !== undefined ? drawing(inp.bearingKsf, 'Allowable bearing', 'ksf') : rule(3, 'SW-CIV-3a', 'Allowable bearing (default)', 'ksf');
  const Fp = roundUpTo(inp.baseRingOD + 12, 2);
  const Ff = Math.max(Fp + 24, roundUpTo(Math.sqrt(((1.1 * inp.weightKips) / q) * 144 / (2 * (Math.SQRT2 - 1))), 6));
  const proj = (Ff - Fp) / 2, t = roundUpTo(Math.max(12, proj), 3);
  const sMat = Math.min(12, barArea(5) / (0.002 * t)), n = spaced(Ff, sMat, cover.earth), L = Ff - 2 * cover.earth + 2 * hookLength(5);
  const perim = 8 * (Fp / (1 + Math.SQRT2)), nV = Math.max(8, Math.ceil(perim / 12)), nT = Math.max(2, Math.floor((inp.pedestalH - 3) / 12) + 1);
  const list = [bars(5, n, L, 'footing mat, x direction, hooked ends'), bars(5, n, L, 'footing mat, y direction, hooked ends'),
    bars(6, nV, inp.pedestalH + 12 + hookLength(6), 'pedestal verticals at 12 in round the perimeter, hooked into the footing'), bars(4, nT, perim - 8 * cover.formed + 2 * hookLength(4), 'pedestal ties at 12 in')];
  const solids: Solid[] = [{ name: 'octagonal footing', mesh: extrude({ outer: octagon(Ff) }, t, 0) }, { name: 'octagonal pedestal', mesh: extrude({ outer: octagon(Fp) }, inp.pedestalH, t) }];
  return finishCivil(id, 'OCTAGON', `Octagonal foundation ${(Ff / 12).toFixed(1)}' A/F footing, ${(Fp / 12).toFixed(1)}' A/F pedestal (class B)`, {
    baseRingOD: drawing(inp.baseRingOD, 'Vessel base ring OD'), W: drawing(inp.weightKips, 'Operating weight', 'kip'), q: qDim, pedestalH: drawing(inp.pedestalH, 'Pedestal height'),
    Fp: rule(Fp, 'SW-CIV-7', 'Pedestal across flats (base ring + 12 in)'), Ff: rule(Ff, 'SW-CIV-7', 'Footing across flats (bearing)'), t: rule(t, 'SW-CIV-3', 'Footing thickness (45° spread)'),
    verticals: rule(nV, 'SW-CIV-7', 'Pedestal verticals #6', 'count'), cover: rule(cover.earth, 'SW-CIV-2', 'Footing cover (earth)'),
  }, Ff, solids, CONCRETE_B, list, 8 * (Ff / (1 + Math.SQRT2)) * t + perim * inp.pedestalH, ['Anchor rods of the vessel (SW-EQ-1, SW-AR-*) are cast in the pedestal.'], { Fp, Ff, t });
}

export interface RingWallInput { tankD: number; fillPcf?: number }
/** SW-CIV-8: ring wall under a flat-bottom tank; z up from the wall's bottom (grade is at z = 36) */
export function makeRingWall(id: string, inp: RingWallInput): PartSpec {
  const w = 12, H = 42, below = 36, gamma = inp.fillPcf ?? 120, R = inp.tankD / 2;
  const gDim: Dim = inp.fillPcf !== undefined ? drawing(gamma, 'Fill unit weight', 'lb/ft3') : rule(120, 'SW-CIV-8a', 'Fill unit weight (default)', 'lb/ft3');
  const p = 0.3 * gamma * (below / 12), T = 0.5 * p * (below / 12) * (R / 12);   // lb: triangular pressure over the buried height times the radius
  const nHoop = Math.max(4, Math.ceil(T / (0.6 * 60000 * barArea(5)))), circ = 2 * Math.PI * R, nV = Math.ceil(circ / 12);
  const list = [bars(5, nHoop, circ + 24, 'hoop bars (two top, two bottom, more by the hoop tension), lapped 24 in'), bars(4, nV, H - 2 * cover.formed, 'verticals at 12 in')];
  const n = 96, outer = Array.from({ length: n }, (_, i) => ({ x: (R + w / 2) * Math.cos((2 * Math.PI * i) / n), y: (R + w / 2) * Math.sin((2 * Math.PI * i) / n) }));
  const inner = Array.from({ length: n }, (_, i) => ({ x: (R - w / 2) * Math.cos((2 * Math.PI * i) / n), y: (R - w / 2) * Math.sin((2 * Math.PI * i) / n) }));
  return finishCivil(id, 'RINGWALL', `Ring wall ${(inp.tankD / 12).toFixed(0)}' tank, ${w}" × ${H}" (class B)`, {
    tankD: drawing(inp.tankD, 'Tank diameter'), gamma: gDim, w: rule(w, 'SW-CIV-8', 'Wall width'), H: rule(H, 'SW-CIV-8', 'Wall height (36 in below grade, 6 in above)'),
    hoopTension: rule(T / 1000, 'SW-CIV-8', 'Hoop tension ½ p H R', 'kip'), hoops: rule(nHoop, 'SW-CIV-8', 'Hoop bars #5', 'count'), cover: rule(cover.formed, 'SW-CIV-2', 'Cover (formed)'),
  }, inp.tankD + w, [{ name: 'ring wall', mesh: extrude({ outer, inner }, H, 0) }], CONCRETE_B, list, 2 * circ * H, ['Inside the ring: compacted granular fill and a 3 in sand cushion (not modeled).'], { R, w, H });
}

export interface PierInput { D: number; loadKips: number; endBearingKsf?: number; frictionKsf?: number }
/** SW-CIV-9: drilled pier; z up from the tip */
export function makeDrilledPier(id: string, inp: PierInput): PartSpec {
  const D = Math.max(18, inp.D), qb = inp.endBearingKsf ?? 10, f = inp.frictionKsf ?? 0.5, A = (Math.PI * D * D) / 4 / 144, circ = (Math.PI * D) / 12;
  const L = Math.max(120, roundUpTo(((1.1 * inp.loadKips) / (qb * A + f * circ)) * 12, 6));
  const nV = Math.max(6, Math.ceil((Math.PI * D) / 6)), cageD = D - 2 * cover.earth, turns = L / 6, spiralL = turns * Math.PI * cageD;
  const list = [bars(6, nV, L, 'verticals, full length'), bars(3, 1, spiralL, 'spiral at 6 in pitch')];
  const n = 48, outer = Array.from({ length: n }, (_, i) => ({ x: (D / 2) * Math.cos((2 * Math.PI * i) / n), y: (D / 2) * Math.sin((2 * Math.PI * i) / n) }));
  return finishCivil(id, 'PIER', `Drilled pier ${D}" dia × ${(L / 12).toFixed(1)}' (class B)`, {
    D: drawing(D, 'Diameter'), P: drawing(inp.loadKips, 'Load', 'kip'),
    qb: inp.endBearingKsf !== undefined ? drawing(qb, 'Allowable end bearing', 'ksf') : rule(10, 'SW-CIV-9a', 'Allowable end bearing (default)', 'ksf'),
    f: inp.frictionKsf !== undefined ? drawing(f, 'Allowable side friction', 'ksf') : rule(0.5, 'SW-CIV-9b', 'Allowable side friction (default)', 'ksf'),
    L: rule(L, 'SW-CIV-9', 'Length (end bearing + side friction, 1.1 P)'), verticals: rule(nV, 'SW-CIV-9', 'Verticals #6 (one per 6 in of circumference)', 'count'), cover: rule(cover.earth, 'SW-CIV-2', 'Cover (earth)'),
  }, L, [{ name: 'pier', mesh: extrude({ outer }, L, 0) }], CONCRETE_B, list, 0, ['Drilled: no formwork.'], { D, L });
}

export interface GradeBeamInput { L: number; w?: number; d?: number }
/** SW-CIV-10: grade beam; x along the beam, z up from its bottom */
export function makeGradeBeam(id: string, inp: GradeBeamInput): PartSpec {
  const w = inp.w ?? 12, d = inp.d ?? 24, nS = Math.floor(inp.L / 12) + 1;
  const list = [bars(5, 2, inp.L + 2 * hookLength(5), 'top, hooked ends'), bars(5, 2, inp.L + 2 * hookLength(5), 'bottom, hooked ends'), bars(3, nS, 2 * (w + d - 4 * cover.formed) + 2 * hookLength(3), 'stirrups at 12 in')];
  return finishCivil(id, 'GRADE_BEAM', `Grade beam ${w}" × ${d}" × ${(inp.L / 12).toFixed(0)}' (class B)`, {
    L: drawing(inp.L, 'Length'), w: inp.w !== undefined ? drawing(w, 'Width') : rule(w, 'SW-CIV-10', 'Width'), d: inp.d !== undefined ? drawing(d, 'Depth') : rule(d, 'SW-CIV-10', 'Depth'),
    stirrups: rule(nS, 'SW-CIV-10', 'Stirrups #3', 'count'), cover: rule(cover.formed, 'SW-CIV-2', 'Cover (formed)'),
  }, inp.L, [{ name: 'grade beam', mesh: box(0, -w / 2, 0, inp.L, w / 2, d) }], CONCRETE_B, list, 2 * inp.L * d, [], { w, d });
}

/** SW-CIV-11: grout bed under a base plate or base ring; z up from the concrete */
export function makeGroutBed(id: string, plateN: number, plateB: number): PartSpec {
  const t = 1.5, a = plateN + 2, b = plateB + 2;
  return finishCivil(id, 'GROUT', `Grout bed ${a}" × ${b}" × 1-1/2"`, {
    plateN: drawing(plateN, 'Plate N'), plateB: drawing(plateB, 'Plate B'), t: rule(t, 'SW-CIV-11', 'Thickness (SW-BP-5)'), a: rule(a, 'SW-CIV-11', 'Plan (plate + 1 in each side)'), b: rule(b, 'SW-CIV-11', 'Plan (plate + 1 in each side)'),
  }, a, [{ name: 'grout', mesh: box(-a / 2, -b / 2, 0, a / 2, b / 2, t) }], GROUT, [], 0, ['Edges chamfered at 45° (drawn square).'], { a, b, t });
}

/** SW-CIV-12: curb along a slab edge; x along the curb */
export function makeCurb(id: string, L: number): PartSpec {
  return finishCivil(id, 'CURB', `Curb 6" × 6" × ${(L / 12).toFixed(0)}' (class A)`, {
    L: drawing(L, 'Length'), h: rule(6, 'SW-CIV-12', 'Height'), w: rule(6, 'SW-CIV-12', 'Width'),
  }, L, [{ name: 'curb', mesh: box(0, -3, 0, L, 3, 6) }], CONCRETE_A, [bars(4, 1, L, 'continuous')], 2 * L * 6, [], {});
}
/** SW-CIV-12: paving slab outdoors; z up from its underside */
export function makePaving(id: string, w: number, L: number): PartSpec {
  const t = 4, nx = spaced(L, 18, cover.slab), ny = spaced(w, 18, cover.slab);
  return finishCivil(id, 'PAVING', `Paving ${(L / 12).toFixed(0)}' × ${(w / 12).toFixed(0)}' × 4" (class A)`, {
    w: drawing(w, 'Width'), L: drawing(L, 'Length'), t: rule(t, 'SW-CIV-12', 'Thickness'), cover: rule(cover.slab, 'SW-CIV-2', 'Cover'),
  }, L, [{ name: 'paving', mesh: box(0, 0, 0, L, w, t) }], CONCRETE_A, [bars(4, nx, w - 2 * cover.slab, 'mesh across'), bars(4, ny, L - 2 * cover.slab, 'mesh along')], 2 * (w + L) * t, [], {});
}

export interface TrenchInput { L: number; w?: number; d?: number }
/** SW-CIV-13: floor trench with a grating cover on an angle frame; x along the trench, z up from the bottom slab's underside */
export function makeTrench(id: string, inp: TrenchInput): PartSpec {
  const w = inp.w ?? 18, d = inp.d ?? 24, L = inp.L, wall = 6;
  // U profile in the y–z plane extruded along x: build it in (x, y) = (y, z) and rotate… simpler: three boxes
  const solids: Solid[] = [{ name: 'trench bottom', mesh: box(0, -w / 2 - wall, 0, L, w / 2 + wall, wall) }, { name: 'trench wall', mesh: box(0, -w / 2 - wall, wall, L, -w / 2, wall + d) }, { name: 'trench wall', mesh: box(0, w / 2, wall, L, w / 2 + wall, wall + d) }];
  const nAlong = 2 * (spaced(d + wall, 12, cover.formed) + 1) + spaced(w + 2 * wall, 12, cover.formed), nAcross = spaced(L, 12, cover.formed);
  const list = [bars(4, nAlong, L, 'longitudinal bars in the walls and bottom at 12 in'), bars(4, nAcross, 2 * (d + wall) + w + 2 * wall - 6 * cover.formed, 'U-shaped bars across at 12 in')];
  const frameL = 2 * L, gratingLb = (L * w * (GRATING_W_PSF / 144));
  return finishCivil(id, 'TRENCH', `Trench ${w}" × ${d}" × ${(L / 12).toFixed(0)}' with grating cover (class B)`, {
    L: drawing(L, 'Length'), w: inp.w !== undefined ? drawing(w, 'Inside width') : rule(w, 'SW-CIV-13', 'Inside width'), d: inp.d !== undefined ? drawing(d, 'Inside depth') : rule(d, 'SW-CIV-13', 'Inside depth'),
    wall: rule(wall, 'SW-CIV-13', 'Wall and bottom thickness'), frame: rule(frameL, 'SW-CIV-13', 'Cover frame L2x2x1/4, total length'), gratingWeight: rule(gratingLb, 'SW-CIV-13', 'Grating cover weight (SW-GR-1)', 'lb'),
  }, L, solids, CONCRETE_B, list, 2 * L * (d + wall) + 2 * L * d, ['Grating cover and its L2x2x1/4 frame are structural catalogue parts (SW-GR-*, SW-L-*), listed by weight.'], { w, d, wall });
}
/** SW-GR-1 bar grating weight per square foot of plan from its bar geometry (1-1/2 × 3/16 at 1-1/2 in, cross bars 1/4 at 4 in) */
const GRATING_W_PSF = ((1.5 * 0.1875 * 12) / 1.5 * 12 + ((0.25 * 0.25 * 12) / 4) * 12) * RHO_S;

export interface SumpInput { w?: number; L?: number; d?: number }
/** SW-CIV-13: sump; z up from the bottom slab's underside */
export function makeSump(id: string, inp: SumpInput = {}): PartSpec {
  const w = inp.w ?? 24, L = inp.L ?? 24, d = inp.d ?? 24, wall = 8;
  const solids: Solid[] = [{ name: 'sump bottom', mesh: box(-L / 2 - wall, -w / 2 - wall, 0, L / 2 + wall, w / 2 + wall, wall) },
    { name: 'sump walls', mesh: extrude({ outer: rect(-L / 2 - wall, -w / 2 - wall, L / 2 + wall, w / 2 + wall), inner: rect(-L / 2, -w / 2, L / 2, w / 2) }, d, wall) }];
  const nV = Math.ceil((2 * (w + L + 4 * wall)) / 12), nH = Math.ceil((d + wall) / 12) + 1;
  const list = [bars(4, nV, d + wall - 2 * cover.formed + hookLength(4), 'wall verticals at 12 in, hooked into the bottom'), bars(4, nH, 2 * (w + L + 4 * wall) - 8 * cover.formed + 2 * hookLength(4), 'wall horizontals at 12 in'), bars(4, 2 * spaced(w + 2 * wall, 12, cover.formed), L + 2 * wall - 2 * cover.formed, 'bottom mat each way')];
  return finishCivil(id, 'SUMP', `Sump ${L}" × ${w}" × ${d}" inside (class B)`, {
    w: inp.w !== undefined ? drawing(w, 'Inside width') : rule(w, 'SW-CIV-13', 'Inside width'), L: inp.L !== undefined ? drawing(L, 'Inside length') : rule(L, 'SW-CIV-13', 'Inside length'), d: inp.d !== undefined ? drawing(d, 'Inside depth') : rule(d, 'SW-CIV-13', 'Inside depth'),
    wall: rule(wall, 'SW-CIV-13', 'Wall and bottom thickness'), cover: rule(cover.formed, 'SW-CIV-2', 'Cover (formed)'),
  }, L + 2 * wall, solids, CONCRETE_B, list, 2 * (2 * (w + L) + 4 * wall) * d, [], { w, L, d, wall });
}

export interface DikeInput { planW: number; planL: number; tanks: { D: number; H: number }[] }
/** SW-CIV-14: containment dike round tanks; x along the length, y across, z up from the footing's bottom (grade) */
export function makeDike(id: string, inp: DikeInput): PartSpec {
  const wall = 8, fW = 24, fD = 12, largest = Math.max(...inp.tanks.map(t => (Math.PI * t.D * t.D * t.H) / 4)), footprints = inp.tanks.reduce((a, t) => a + (Math.PI * t.D * t.D) / 4, 0);
  const area = inp.planL * inp.planW - footprints, Hraw = (1.1 * largest) / area, H = Math.min(72, Math.max(18, roundUpTo(Hraw, 6)));
  const perim = 2 * (inp.planL + inp.planW);
  const solids: Solid[] = [
    { name: 'dike footing', mesh: extrude({ outer: rect(-fW / 2, -fW / 2, inp.planL + fW / 2, inp.planW + fW / 2), inner: rect(fW / 2, fW / 2, inp.planL - fW / 2, inp.planW - fW / 2) }, fD, 0) },
    { name: 'dike wall', mesh: extrude({ outer: rect(-wall / 2, -wall / 2, inp.planL + wall / 2, inp.planW + wall / 2), inner: rect(wall / 2, wall / 2, inp.planL - wall / 2, inp.planW - wall / 2) }, H, fD) },
  ];
  const nV = Math.ceil(perim / 12), nH = Math.ceil(H / 12) + 1;
  const list = [bars(4, nV, H + fD - 2 * cover.formed + hookLength(4), 'wall verticals at 12 in, hooked into the footing'), bars(4, nH, perim + 24, 'wall horizontals at 12 in'), bars(5, 2, perim + 24, 'footing, continuous (two bars)')];
  return finishCivil(id, 'DIKE', `Containment dike ${(inp.planL / 12).toFixed(0)}' × ${(inp.planW / 12).toFixed(0)}', wall ${H}" high (class B)`, {
    planL: drawing(inp.planL, 'Diked plan length'), planW: drawing(inp.planW, 'Diked plan width'), tanks: drawing(inp.tanks.length, 'Tanks inside', 'count'),
    H: rule(H, 'SW-CIV-14', 'Wall height (1.1 × the largest tank, 18 to 72 in)'), wall: rule(wall, 'SW-CIV-14', 'Wall thickness'), fW: rule(fW, 'SW-CIV-14', 'Footing width'), fD: rule(fD, 'SW-CIV-14', 'Footing depth'),
    holds: rule((area * H) / (largest || 1), 'SW-CIV-14', 'Dike volume / largest tank volume', 'count'),
  }, inp.planL, solids, CONCRETE_B, list, 2 * perim * H + 2 * perim * fD, [], { H, wall });
}
