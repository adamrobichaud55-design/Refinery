/**
 * Plant 3: joints within a rack's own steel (DESIGN_BASIS.md SW-CELL-8, added 2026-11-27). The interior kit builds a rack as plants 1 and 2 use it; these
 * act after it on plant 3's placed parts only (a unit's cell, SW-CELL-2 and SW-CELL-6; the main pipeway's rack, SW-PWY-2 and SW-PWY-9), and only take steel away.
 */
import { makeWideFlange, makeAngle } from '../catalogue';
import type { PartSpec } from '../catalogue/part';
import { K } from '../core/constants';
import { rule } from '../core/basis';
import { frameFromAxes } from '../geometry/transform';
import { worldBox } from '../generator/piping';
import type { Placed } from '../generator/building';

type Box = [number[], number[]];
const meets = (a: Box, b: Box) => [0, 1, 2].every(k => a[0][k] < b[1][k] && a[1][k] > b[0][k]);
const boxOf = (p: Placed): Box => { const b = worldBox(p.part, p.transform); if (!b) throw new Error(`${p.tags.join('/')}: no solid to frame (SW-CELL-8)`); return b as Box; };
const dot3 = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** SW-CELL-8: each stringer framed to the intermediate channels it meets: the channel whole, the stringer in lengths that end on the channel's web back and its toes. Returns the joints made. */
export function frameStringersAtChannels(out: Placed[]): number {
  const chans = out.filter(p => p.tags.includes('intermediate-beam')).map(boxOf), memo = new Map<string, PartSpec>(); let n = 0;
  for (let i = out.length - 1; i >= 0; i--) {
    const s = out[i]; if (!s.tags.includes('rack-stringer')) continue;
    const T = s.transform as number[]; if (Math.abs(T[8] - 1) > 1e-9) throw new Error('a rack stringer not laid along +x (SW-CELL-8)');
    const hit = chans.filter(c => meets(boxOf(s), c)).sort((a, b) => a[0][0] - b[0][0]); if (!hit.length) continue;
    const ends: [number, number][] = []; let x = T[12];
    for (const c of hit) { ends.push([x, c[0][0]]); x = c[1][0]; }
    ends.push([x, T[12] + s.part.length!.value]);
    const D = s.part.dims.D.value, w = s.part.dims.w.value, mat = s.part.material;
    out.splice(i, 1, ...ends.filter(([a, b]) => b - a > 1e-6).map(([a, b]) => {
      const key = `${s.part.id}|${D}|${w}|${b - a}`; let p = memo.get(key);
      if (!p) memo.set(key, (p = makeWideFlange(s.part.id, D, w, b - a, mat)));
      return { part: p, transform: frameFromAxes([a, T[13], T[14]], [0, 1, 0], [1, 0, 0]), tags: [...s.tags] } as Placed;
    }));
    n += hit.length;
  }
  return n;
}

/** SW-CELL-8: a rack-end ladder's bracket cut back to the tier beam's flange it meets. Returns the brackets cut. */
export function trimBracketsAtBeams(out: Placed[]): number {
  const beams = out.filter(p => p.tags.includes('beam') && p.tags.some(t => t.startsWith('rack-bent:'))).map(boxOf); let n = 0;
  for (let i = 0; i < out.length; i++) {
    const b = out[i]; if (!b.tags.includes('rack-ladder') || b.part.kind !== 'L') continue;
    const T = b.transform as number[], s = Math.sign(T[8]); if (Math.abs(Math.abs(T[8]) - 1) > 1e-9) continue;
    const hit = beams.filter(m => meets(boxOf(b), m)); if (!hit.length) continue;
    const face = s > 0 ? Math.max(...hit.map(m => m[1][0])) : Math.min(...hit.map(m => m[0][0])), cut = s * (face - T[12]), L = b.part.length!.value;
    if (cut <= 0 || cut >= L - 1) throw new Error(`${b.tags.join('/')}: a ladder bracket with no room to be cut back to the beam it meets (SW-CELL-8)`);
    out[i] = { part: makeAngle(b.part.id, b.part.dims.a.value, b.part.dims.b.value, b.part.dims.t.value, L - cut, b.part.material), transform: frameFromAxes([T[12] + s * cut, T[13], T[14]], [T[4], T[5], T[6]], [T[8], T[9], T[10]]), tags: [...b.tags] };
    n++;
  }
  return n;
}

/** SW-CELL-8: each cage hoop ends on the outer face of each side rail of its ladder, never in it. Returns the hoops cut. */
export function fitCageHoops(out: Placed[]): number {
  const fitted = new Map<string, PartSpec>(); let n = 0;
  for (const h of out) {
    if (h.part.kind !== 'CAGE_HOOP' || !h.tags.includes('cage')) continue;
    const ex = h.part.extra as { R: number; t: number; a0: number; a1: number }, T = h.transform as number[];
    const hx = [T[0], T[1], T[2]], hy = [T[4], T[5], T[6]], o = [T[12], T[13], T[14]], hH = h.part.length!.value;
    let railOut = 0;
    for (const r of out) {
      if (r.tags[0] !== h.tags[0] || r.part.kind !== 'PL' || !r.tags.includes('ladder')) continue;
      const M = r.transform as number[], d = [M[12] - o[0], M[13] - o[1], M[14] - o[2]], x = dot3(d, hx), y = dot3(d, hy);
      if (Math.abs(x) > ex.R || Math.abs(y) > ex.R || o[1] < M[13] - 1e-6 || o[1] + hH > M[13] + r.part.length!.value + 1e-6) continue;   // a rail of this hoop's ladder, the hoop's height within it
      const half = (r.part.dims.w.value / 2) * Math.abs(dot3([M[0], M[1], M[2]], hx)) + (r.part.dims.t.value / 2) * Math.abs(dot3([M[4], M[5], M[6]], hx));
      railOut = Math.max(railOut, Math.abs(x) + half);                     // the rail's outer face, from the hoop's centre along the rungs
    }
    if (railOut <= ex.R * Math.cos(ex.a0) || railOut >= ex.R) continue;    // no rail, or the hoop already ends outside it
    const key = `${h.part.id}:${railOut.toFixed(4)}`; let p = fitted.get(key);
    if (!p) {
      const e = Math.asin(railOut / ex.R), a0 = -Math.PI / 2 + e, a1 = 1.5 * Math.PI - e, arc = ex.R * (a1 - a0);
      p = { ...h.part, id: `${h.part.id}:to-rail:${railOut.toFixed(3)}`, extra: { ...ex, a0, a1 }, dims: { ...h.part.dims, arc: rule(arc, 'SW-CELL-8', 'Developed length') },
        weight: rule(arc * ex.t * h.part.dims.w.value * K.STEEL_DENSITY_LB_IN3, 'SW-CELL-8', 'Weight', 'lb'),
        notes: [...h.part.notes, 'Each end cut back to the outer face of the ladder rail and welded to it (SW-CELL-8).'] };
      fitted.set(key, p);
    }
    h.part = p; n++;
  }
  return n;
}

/** SW-CELL-8, all three joints, in order, after the kit has built a rack. */
export function rackJoints(out: Placed[]): { stringers: number; brackets: number; hoops: number } {
  return { stringers: frameStringersAtChannels(out), brackets: trimBracketsAtBeams(out), hoops: fitCageHoops(out) };
}
