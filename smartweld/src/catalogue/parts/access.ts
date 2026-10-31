/** Grating, treads and ladder cage hoops: DESIGN_BASIS.md sections 19–22. Guardrail, stair and ladder members are ordinary catalogue parts placed by the generator. */
import { K } from '../../core/constants';
import { drawing, rule, constant } from '../../core/basis';
import { DEFAULT_MATERIAL, type PartSpec, type Material } from '../part';
import type { Pt } from '../../geometry/polygon';

const RHO = K.STEEL_DENSITY_LB_IN3;
const rhoDim = () => constant(K.STEEL_DENSITY_LB_FT3, 'K-1', 'Steel density', 'lb/ft3');

export const GRATING = { barDepth: 1.5, barT: 3 / 16, barPitch: 1.5, crossSize: 0.25, crossPitch: 4 } as const; // SW-GR-1

export interface Circle { cx: number; cy: number; r: number }
export interface RectCut { x0: number; y0: number; x1: number; y1: number }
export type Cut = Circle | RectCut;
const isCircle = (c: Cut): c is Circle => 'r' in c;
/** A bar segment in the panel's local plane: bars run along local `axis` ('x' or 'y'). */
export interface BarSeg { x0: number; y0: number; x1: number; y1: number }

/** Clip an axis-aligned segment against circular cut-outs (returns the remaining pieces). */
export function clipSegment(seg: BarSeg, cuts: Cut[]): BarSeg[] {
  let pieces = [seg];
  for (const c of cuts) {
    const next: BarSeg[] = [];
    for (const s of pieces) {
      const horizontal = Math.abs(s.y1 - s.y0) < 1e-9;
      let lo: number, hi: number;
      if (isCircle(c)) {
        const off = horizontal ? s.y0 - c.cy : s.x0 - c.cx;
        if (Math.abs(off) >= c.r) { next.push(s); continue; }
        const half = Math.sqrt(c.r * c.r - off * off);
        lo = (horizontal ? c.cx : c.cy) - half; hi = (horizontal ? c.cx : c.cy) + half;
      } else {
        const k = horizontal ? s.y0 : s.x0;
        const inside = horizontal ? k > c.y0 && k < c.y1 : k > c.x0 && k < c.x1;
        if (!inside) { next.push(s); continue; }
        lo = horizontal ? c.x0 : c.y0; hi = horizontal ? c.x1 : c.y1;
      }
      const a = horizontal ? s.x0 : s.y0, b = horizontal ? s.x1 : s.y1;
      const pushPiece = (p: number, q: number) => { if (q - p > 0.5) next.push(horizontal ? { x0: p, y0: s.y0, x1: q, y1: s.y1 } : { x0: s.x0, y0: p, x1: s.x1, y1: q }); };
      if (hi <= a || lo >= b) { next.push(s); continue; }
      pushPiece(a, Math.min(b, lo)); pushPiece(Math.max(a, hi), b);
    }
    pieces = next;
  }
  return pieces;
}

/**
 * Grating panel in its local plane: rectangle [0,w]×[0,h] with bearing bars along local x (spanning w)
 * at the bar pitch along y, cross bars along y at the cross pitch along x, and optional circular cut-outs.
 * Extruded along local z (bar depth, z = 0 at the top of grating going down to −barDepth).
 */
export function makeGrating(id: string, w: number, h: number, cuts: Cut[] = [], material: Material = DEFAULT_MATERIAL): PartSpec {
  const g = GRATING;
  const bars: BarSeg[] = [], crosses: BarSeg[] = [];
  for (let y = g.barPitch / 2; y < h; y += g.barPitch) bars.push(...clipSegment({ x0: 0, y0: y, x1: w, y1: y }, cuts));
  for (let x = g.crossPitch / 2; x < w; x += g.crossPitch) crosses.push(...clipSegment({ x0: x, y0: 0, x1: x, y1: h }, cuts));
  const barLen = bars.reduce((s, b) => s + (b.x1 - b.x0), 0), crossLen = crosses.reduce((s, b) => s + (b.y1 - b.y0), 0);
  const vol = barLen * g.barDepth * g.barT + crossLen * g.crossSize * g.crossSize;
  return {
    id, kind: 'GRATING', category: 'plate', designation: `GRATING ${g.barDepth}x${g.barT} @ ${g.barPitch}, ${w}x${h}`,
    dims: {
      w: drawing(w, 'Panel width (bar span)'), h: drawing(h, 'Panel length'),
      barDepth: rule(g.barDepth, 'SW-GR-1', 'Bearing bar depth'), barT: rule(g.barT, 'SW-GR-1', 'Bearing bar thickness'),
      barPitch: rule(g.barPitch, 'SW-GR-1', 'Bearing bar pitch'), crossPitch: rule(g.crossPitch, 'SW-GR-1', 'Cross bar pitch'),
      bars: rule(bars.length, 'SW-GR-1', 'Bearing bar pieces', 'count'), rho: rhoDim(),
    },
    length: rule(g.barDepth, 'SW-GR-1', 'Depth (extrusion)'), material,
    weight: rule(vol * RHO, 'SW-GR-4', 'Weight of drawn bars', 'lb'),
    notes: cuts.length ? [`Cut around ${cuts.length} opening(s) (SW-GR-2).`] : [],
    extra: { bars, crosses },
  };
}

/** Grating stair tread (SW-GR-3): bearing bars span the width (local x), 10 in deep (local y), nosing bar along the front (y = 0). */
export function makeTread(id: string, width: number, material: Material = DEFAULT_MATERIAL): PartSpec {
  const g = GRATING, depth = 10;
  const bars: BarSeg[] = []; for (let y = 1.25 + g.barPitch / 2; y < depth; y += g.barPitch) bars.push({ x0: 0, y0: y, x1: width, y1: y });
  const crosses: BarSeg[] = []; for (let x = g.crossPitch / 2; x < width; x += g.crossPitch) crosses.push({ x0: x, y0: 1.25, x1: x, y1: depth });
  const vol = bars.length * width * g.barDepth * g.barT + crosses.length * (depth - 1.25) * g.crossSize ** 2 + width * 1.25 * g.barT * 2 /* nosing angle */ + 2 * 2 * depth * (3 / 16) /* carriers */;
  return {
    id, kind: 'GRATING_TREAD', category: 'plate', designation: `TREAD ${width}x${depth} grating`,
    dims: { width: drawing(width, 'Tread width'), depth: rule(depth, 'SW-GR-3', 'Tread depth'), nosing: rule(1.25, 'SW-GR-3', 'Nosing angle leg'), carrierT: rule(3 / 16, 'SW-GR-3', 'Carrier plate thickness'), rho: rhoDim() },
    length: rule(g.barDepth, 'SW-GR-1', 'Depth (extrusion)'), material,
    weight: rule(vol * RHO, 'SW-GR-4', 'Weight of drawn bars, nosing and carriers', 'lb'),
    notes: [], extra: { bars, crosses, nosing: true, carriers: true },
  };
}

/** Ladder cage hoop (SW-LD-3): PL1/4x2 bent to a 30 in diameter, open at the ladder rails (chord 18 in). */
export function makeCageHoop(id: string, material: Material = DEFAULT_MATERIAL): PartSpec {
  const R = 15, t = 0.25, wPlate = 2, half = Math.asin(9 / R);           // the gap is the 18 in chord at the rails
  const a0 = -Math.PI / 2 + half, a1 = 1.5 * Math.PI - half;             // open toward −y (the ladder side)
  const len = R * (a1 - a0);
  return {
    id, kind: 'CAGE_HOOP', category: 'plate', designation: 'PL1/4x2 cage hoop 30 in dia',
    dims: { R: rule(R, 'SW-LD-3', 'Hoop radius'), t: rule(t, 'SW-LD-3', 'Plate thickness'), w: rule(wPlate, 'SW-LD-3', 'Plate width'), arc: rule(len, 'SW-LD-3', 'Developed length'), rho: rhoDim() },
    length: rule(wPlate, 'SW-LD-3', 'Width (extrusion)'), material,
    weight: rule(len * t * wPlate * RHO, 'SW-LD-3', 'Weight', 'lb'),
    notes: [], extra: { R, t, a0, a1 },
  };
}
export const CAGE = { R: 15, chordHalf: 9, standoff: 7, hoopPitch: 48, startAbove: 84, minClimb: 240, straps: 5 } as const; // SW-LD-2/3
