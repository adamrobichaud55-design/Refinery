// Plant 3, SW-NOZ-1 (amended 2026-11-27): a nozzle's neck runs from its flange back to the item's drawn body. The generator builds the neck from the
// nozzle's standout after routing (its pipe from the flange's weld end back to the nozzle's base), so a unit routed afresh has the neck the plan gives;
// a unit kept as routed before has its necks cut again here to the plan, the flange and face left where they are.
import type { PipingModel, Comp } from '../generator/piping';
import type { V3 } from '../generator/router';
import type { PlantNozzle } from './unitPiping';

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], len = (a: V3) => Math.hypot(a[0], a[1], a[2]);

/** Each stored nozzle whose neck ends elsewhere than its plan's base (by more than 0.01 in along its axis) has its neck pipe cut to it. Returns what changed. */
export function necksToPlan(m: PipingModel, nozzles: Map<string, PlantNozzle>): string[] {
  const out: string[] = [];
  for (const n of m.nozzles ?? []) {
    const q = nozzles.get(n.id); if (!q) continue;
    const pipe = (n.comps ?? []).find((c: Comp) => c.kind === 'pipe'), face = n.face as V3, u = n.u as V3;
    // where the stored neck ends: its last piece's far end from the face
    const ends = (n.comps ?? []).flatMap((c: Comp) => [c.a as V3, c.b as V3]), far = ends.reduce((p, e) => (len(sub(e, face)) > len(sub(p, face)) ? e : p), face);
    const now = -((far[0] - face[0]) * u[0] + (far[1] - face[1]) * u[1] + (far[2] - face[2]) * u[2]), want = q.S;
    if (Math.abs(now - want) < 0.01) continue;
    if (len(sub(face, q.face as V3)) > 0.01) throw new Error(`${n.id}: its face on disk is not the plan's (SW-NOZ-1): route the unit again`);
    if (!pipe) throw new Error(`${n.id}: its neck has no pipe to cut to ${want.toFixed(3)} in (SW-NOZ-1)`);
    const b: V3 = [face[0] - u[0] * want, face[1] - u[1] * want, face[2] - u[2] * want], L = len(sub(b, pipe.a as V3));
    if (L < 0.05) throw new Error(`${n.id}: its neck pipe would be ${L.toFixed(3)} in long (SW-NOZ-1)`);
    pipe.b = b; pipe.key = `${pipe.key.split('|').slice(0, 3).join('|')}|${L.toFixed(3)}`;
    out.push(`${n.id} ${now.toFixed(2)} → ${want.toFixed(2)} in`);
  }
  return out;
}
