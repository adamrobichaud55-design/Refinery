/** Pipe, flanges, gaskets and studs: DESIGN_BASIS.md sections 29–30 (SW-PIPE-*, SW-FLG-*). */
import { K } from '../../core/constants';
import { drawing, rule, constant, type Dim } from '../../core/basis';
import { roundUpTo } from '../../core/units';
import { DEFAULT_MATERIAL, type PartSpec, type Material } from '../part';
import { hexHardware } from './hardware';

const RHO = K.STEEL_DENSITY_LB_IN3;
const rhoDim = () => constant(K.STEEL_DENSITY_LB_FT3, 'K-1', 'Steel density', 'lb/ft3');

export type PipeClass = 'P150' | 'P300' | 'P600' | 'P1200' | 'P2400' | 'P4800';
export const CLASS_PRESSURE: Record<PipeClass, number> = { P150: 150, P300: 300, P600: 600, P1200: 1200, P2400: 2400, P4800: 4800 }; // psi, by name (SW-PIPE-1)
export const CLASS_SERIES: PipeClass[] = ['P150', 'P300', 'P600', 'P1200', 'P2400', 'P4800'];
/** SW-PIPE-6 size series (nominal inches = SmartWeld outside diameter). */
export const SIZE_SERIES = [0.25, 0.375, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 24, 30, 36, 42, 48];
export const PIPE_GRADE: Material = { grade: 'Grade 35 pipe', Fy: { value: 35, unit: 'ksi', basis: { kind: 'drawing' }, label: 'Minimum yield strength (grade stated on drawing)' } };
export const FORGING_GRADE: Material = { grade: 'Grade 36 forging', Fy: { value: 36, unit: 'ksi', basis: { kind: 'drawing' }, label: 'Minimum yield strength (grade stated on drawing)' } };
export const STUD_FU = 90; // ksi, "Grade 90" (drawing)

export interface PipeDims { NPS: number; cls: PipeClass; P: number; OD: number; t: number; D: number }
export function pipeDims(NPS: number, cls: PipeClass): PipeDims {
  const P = CLASS_PRESSURE[cls], OD = NPS;                                          // SW-PIPE-2
  const S = (PIPE_GRADE.Fy.value * 1000) / 2, CA = 1 / 16;
  const t = roundUpTo(Math.max((P * OD) / (2 * S) + CA, OD / 40 + 1 / 16), 1 / 32); // SW-PIPE-3
  return { NPS, cls, P, OD, t, D: OD - 2 * t };                                     // SW-PIPE-4
}

export function makePipe(id: string, NPS: number, cls: PipeClass, lengthIn: number): PartSpec {
  const p = pipeDims(NPS, cls);
  const A = (Math.PI / 4) * (p.OD ** 2 - p.D ** 2);
  return {
    id, kind: 'PIPE', category: 'piping', designation: `PIPE${NPS}-${cls}`,
    dims: {
      NPS: drawing(NPS, 'Nominal size'), P: drawing(p.P, 'Class design pressure', 'psi'),
      OD: rule(p.OD, 'SW-PIPE-2', 'Outside diameter'), t: rule(p.t, 'SW-PIPE-3', 'Wall thickness'), D: rule(p.D, 'SW-PIPE-4', 'Bore'),
      A: rule(A, 'SW-PIPE-5', 'Metal area', 'in2'), rho: rhoDim(),
    },
    length: drawing(lengthIn, 'Length'), material: PIPE_GRADE,
    weight: rule(A * lengthIn * RHO, 'SW-PIPE-5', 'Weight', 'lb'),
    notes: ['SmartWeld pipe: OD = nominal size, wall by SW-PIPE-3; not interchangeable with any published schedule.'],
  };
}

export interface FlangeDesign {
  NPS: number; cls: PipeClass; P: number; bore: number; pipeT: number;
  gasketID: number; wg: number; G: number; gasketT: number; rfOD: number; rfH: number;
  d: number; n: number; BC: number; OD: number; tf: number; hubLen: number; neckLen: number; hubT: number;
  W: number; Wseat: number; Wop: number; studLen: number; holeD: number;
}
/** SW-FLG-2..7: design a flange joint for a bore and class. `bore`/`pipeT` default to the pipe of the size. */
export function designFlange(NPS: number, cls: PipeClass, boreOverride?: number, pipeTOverride?: number, ODoverride?: number): FlangeDesign {
  const pd = pipeDims(NPS, cls), P = pd.P;
  const bore = boreOverride ?? pd.D, pipeT = pipeTOverride ?? pd.t, OD = ODoverride ?? pd.OD;
  const gasketID = bore + 1 / 8, wg = roundUpTo(Math.max(0.5, OD / 12), 1 / 8), G = gasketID + wg, gasketT = 1 / 8; // SW-FLG-2
  const y = 2000, m = 2;
  const Wseat = Math.PI * G * wg * y, Wop = (Math.PI / 4) * G * G * P + Math.PI * G * wg * m * P;           // SW-FLG-3
  const W = Math.max(Wseat, Wop);
  const rfOD = G + wg + 1 / 8, rfH = 1 / 16;
  type Pick = { d: number; n: number; BC: number; OD: number };
  let chosen: Pick | null = null, compact: Pick | null = null;
  const nMax = Math.max(4, 4 * Math.ceil(Math.max(NPS, bore) / 4));                                                   // counted on the joint bore (body and bonnet joints are larger than the pipe)                                                                  // SW-FLG-4 stud count limit
  for (let d = 0.5; d <= 4 + 1e-9; d += 1 / 8) {
    const cap = (STUD_FU * 1000 / 3) * (Math.PI / 4) * d * d;
    let n = roundUpTo(Math.max(4, Math.ceil(W / cap)), 4);
    let BC = Math.max(rfOD + d + 0.25, (3 * d * n) / Math.PI);
    while ((Math.PI * BC) / n > 5 * d) { n += 4; BC = Math.max(rfOD + d + 0.25, (3 * d * n) / Math.PI); }
    const OD = BC + 3 * d;
    if (!compact || OD < compact.OD - 1e-9) compact = { d, n, BC, OD };
    if (n <= nMax) { chosen = { d, n, BC, OD }; break; }
  }
  if (!chosen) chosen = compact;
  if (!chosen) throw new Error('SW-FLG-4: no stud size fits');
  const { d, n, BC, OD: flOD } = chosen;
  const Wb = 1.5 * n * (Math.PI / 4) * d * d * (STUD_FU * 1000 / 3);                                        // SW-FLG-5: preload capacity
  const a = (BC - G) / 2, mb = (Wb * a) / (Math.PI * G);
  const tf = roundUpTo(Math.max(Math.sqrt((6 * mb) / (0.6 * FORGING_GRADE.Fy.value * 1000)), d + 0.25), 1 / 8);
  const hubLen = 1.5 * tf, neckLen = 1, hubT = 2 * pipeT;                                                     // SW-FLG-6
  const nut = hexHardware(d).nutH;
  const studLen = roundUpTo(2 * tf + gasketT + 2 * nut + 2 * (d / 4), 0.25);                                 // SW-FLG-7
  return { NPS, cls, P, bore, pipeT, gasketID, wg, G, gasketT, rfOD, rfH, d, n, BC, OD: flOD, tf, hubLen, neckLen, hubT, W, Wseat, Wop, studLen, holeD: d + 1 / 8 };
}

function flangeDims(f: FlangeDesign): Record<string, Dim> {
  return {
    NPS: drawing(f.NPS, 'Nominal size'), P: drawing(f.P, 'Class design pressure', 'psi'),
    bore: rule(f.bore, 'SW-FLG-1', 'Bore'), gasketID: rule(f.gasketID, 'SW-FLG-2', 'Gasket inside diameter'), wg: rule(f.wg, 'SW-FLG-2', 'Gasket width'), G: rule(f.G, 'SW-FLG-2', 'Gasket mean diameter'),
    rfOD: rule(f.rfOD, 'SW-FLG-4', 'Raised face diameter'), rfH: rule(f.rfH, 'SW-FLG-1', 'Raised face height'),
    W: rule(f.W, 'SW-FLG-3', 'Design bolt load', 'lb'), d: rule(f.d, 'SW-FLG-4', 'Stud diameter'), n: rule(f.n, 'SW-FLG-4', 'Stud count', 'count'),
    BC: rule(f.BC, 'SW-FLG-4', 'Bolt circle'), OD: rule(f.OD, 'SW-FLG-4', 'Flange outside diameter'), holeD: rule(f.holeD, 'SW-FLG-4', 'Bolt hole'),
    tf: rule(f.tf, 'SW-FLG-5', 'Flange thickness'), hubLen: rule(f.hubLen, 'SW-FLG-6', 'Hub length'), hubT: rule(f.hubT, 'SW-FLG-6', 'Hub wall at the flange'), neckLen: rule(f.neckLen, 'SW-FLG-6', 'Neck length'),
    studLen: rule(f.studLen, 'SW-FLG-7', 'Stud length'), rho: rhoDim(),
  };
}

export function makeFlange(id: string, NPS: number, cls: PipeClass): PartSpec {
  const f = designFlange(NPS, cls);
  const ringVol = (Math.PI / 4) * (f.OD ** 2 - f.bore ** 2) * f.tf - f.n * (Math.PI / 4) * f.holeD ** 2 * f.tf
    + (Math.PI / 4) * (f.rfOD ** 2 - f.bore ** 2) * f.rfH
    + (Math.PI / 4) * ((f.bore + 2 * f.hubT) ** 2 + (f.bore + 2 * f.hubT) * (f.bore + 2 * f.pipeT) + (f.bore + 2 * f.pipeT) ** 2) / 3 * f.hubLen - (Math.PI / 4) * f.bore ** 2 * f.hubLen
    + (Math.PI / 4) * ((f.bore + 2 * f.pipeT) ** 2 - f.bore ** 2) * f.neckLen;
  return {
    id, kind: 'FLANGE', category: 'piping', designation: `FLG${NPS}-${cls}`, dims: flangeDims(f),
    length: rule(f.tf + f.hubLen + f.neckLen, 'SW-FLG-6', 'Overall length (face to weld end)'), material: FORGING_GRADE,
    weight: rule(ringVol * RHO, 'SW-FLG-9', 'Weight (drawn solid)', 'lb'),
    notes: ['Weld-neck flange designed by SW-FLG-2..7 from bolt-load equilibrium; mates only with SmartWeld flanges of the same size and class.'],
    extra: { design: f },
  };
}
export function makeBlindFlange(id: string, NPS: number, cls: PipeClass): PartSpec {
  const f = designFlange(NPS, cls);
  const tb = roundUpTo(Math.max(f.tf, (f.G / 2) * Math.sqrt((1.24 * f.P) / (0.6 * FORGING_GRADE.Fy.value * 1000))), 1 / 8); // SW-FLG-8
  const vol = (Math.PI / 4) * f.OD ** 2 * tb - f.n * (Math.PI / 4) * f.holeD ** 2 * tb + (Math.PI / 4) * f.rfOD ** 2 * f.rfH;
  return {
    id, kind: 'BLIND', category: 'piping', designation: `BLIND${NPS}-${cls}`, dims: { ...flangeDims(f), tb: rule(tb, 'SW-FLG-8', 'Blind thickness') },
    length: rule(tb, 'SW-FLG-8', 'Thickness'), material: FORGING_GRADE,
    weight: rule(vol * RHO, 'SW-FLG-9', 'Weight (drawn solid)', 'lb'), notes: [], extra: { design: { ...f, tf: tb } },
  };
}
export function makeGasket(id: string, NPS: number, cls: PipeClass): PartSpec {
  const f = designFlange(NPS, cls);
  return {
    id, kind: 'GASKET', category: 'non-steel', designation: `GASKET${NPS}-${cls}`,
    dims: { ID: rule(f.gasketID, 'SW-FLG-2', 'Inside diameter'), OD: rule(f.gasketID + 2 * f.wg, 'SW-FLG-2', 'Outside diameter'), t: rule(f.gasketT, 'SW-FLG-2', 'Thickness') },
    length: rule(f.gasketT, 'SW-FLG-2', 'Thickness'), material: { grade: 'compressed sheet (non-steel)', Fy: drawing(0, 'n/a', 'ksi') },
    weight: drawing(0, 'Non-steel; weight not counted', 'lb'), notes: [], extra: { design: f },
  };
}
/** Stud with two heavy hex nuts (SW-FLG-7). Local z along the stud from one end. */
export function makeStud(id: string, d: number, L: number, material: Material = DEFAULT_MATERIAL): PartSpec {
  const h = hexHardware(d);
  const hexA = (Math.sqrt(3) / 2) * h.F * h.F, shank = (Math.PI / 4) * d * d;
  const vol = shank * L + 2 * (hexA - shank) * h.nutH;
  return {
    id, kind: 'STUD', category: 'hardware', designation: `STUD${d}x${L}`,
    dims: { d: drawing(d, 'Diameter'), L: rule(L, 'SW-FLG-7', 'Length'), F: rule(h.F, 'SW-B-3', 'Nut width across flats'), nutH: rule(h.nutH, 'SW-B-3', 'Nut height'), rho: rhoDim() },
    length: rule(L, 'SW-FLG-7', 'Length'), material, weight: rule(vol * RHO, 'SW-FLG-7', 'Weight of stud and two nuts', 'lb'), notes: ['Threads not modeled.'],
  };
}
