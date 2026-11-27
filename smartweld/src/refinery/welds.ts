/**
 * Plant 3, SW-RPI-24: a weld bead square to its joint. The generator orients a butt weld by the direction from one end of the
 * second piece it joins to the other, which at an elbow is the elbow's chord; here each butt weld is set square to the axis of
 * the joint it closes. Its place, record and joins stay; only its direction and frame change.
 */
import type { PipingModel, Comp } from '../generator/piping';
import type { V3 } from '../generator/router';
import { frameFromAxes } from '../geometry/transform';
import { pipeDims, elbowRadius, type PipeClass } from '../catalogue';

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const unit = (a: V3): V3 => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const perp = (w: V3): V3 => (Math.abs(w[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]);   // as the generator chooses a weld's second axis

/** the axis of a piece at one of its ends: a straight piece's own, an elbow's tangent there */
function axisAt(c: Comp, at: V3): V3 | undefined {
  const a = c.a as V3, b = c.b as V3;
  if (c.kind !== 'elbow') return len(sub(b, a)) > 1e-6 ? unit(sub(b, a)) : undefined;
  const k = c.key.split('|'), ang = Number(k[3]) || 90, OD = pipeDims(c.NPS, c.cls as PipeClass).OD, R = elbowRadius(OD), Lc = ang === 90 ? R : R * Math.tan(Math.PI / 8);
  const zin: V3 = unit([c.T[8], c.T[9], c.T[10]] as V3), corner: V3 = [a[0] + zin[0] * Lc, a[1] + zin[1] * Lc, a[2] + zin[2] * Lc];
  const atA = len(sub(at, a)) <= len(sub(at, b));
  return atA ? zin : unit(sub(b, corner));
}

export function squareWelds(m: PipingModel): string[] {
  const out: string[] = [];
  const byTag = new Map<string, Comp>(); for (const r of m.lines) for (const c of r.comps) byTag.set(c.tag, c); for (const n of m.nozzles ?? []) for (const c of n.comps ?? []) byTag.set(c.tag, c);
  for (const r of m.lines) for (const w of r.welds) {
    if (w.type !== 'BW') continue;
    const at = w.at as V3, pieces = w.joins.map(t => byTag.get(t)).filter((c): c is Comp => !!c && c.kind !== 'studs');
    if (!pieces.length) continue;
    const straight = pieces.find(c => c.kind !== 'elbow'), axis = straight ? axisAt(straight, at) : axisAt(pieces[0], at);
    if (!axis) continue;
    const old = unit(w.dir as V3), d = dot(old, axis) < 0 ? ([-axis[0], -axis[1], -axis[2]] as V3) : axis;
    if (Math.abs(dot(old, d)) > 1 - 1e-6) continue;
    w.dir = d; w.T = frameFromAxes(at, perp(d), d) as never; out.push(w.id);
  }
  return out;
}
