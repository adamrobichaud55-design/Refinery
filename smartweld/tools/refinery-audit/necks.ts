/**
 * necks: a sixth check for plant 3, of each nozzle against its OWN item, the one contact the five clash detectors excuse
 * by relationship (a nozzle on its own item). SW-NOZ-1 as amended 2026-11-27: a neck runs from its flange to the item's
 * drawn body and ends on it, never short of it (in the air) and never past it (into a head or a shell), and no nozzle is
 * set on a weld seam (SW-DET-6 as amended).
 *
 *   cd /home/user/Refinery/smartweld && [UNITS=11,12,...] [LABEL=run] [AUDIT_OUT=<dir>] npx vite-node tools/refinery-audit/necks.ts
 *
 * For every nozzle of every unit's plan (`unitPiping(u).nozzles`, the faces the stored models are routed to), rays parallel
 * to its axis are cast from its face back along its axis and through its neck's wall (12 angles on the wall's outer edge, 12 at
 * mid-wall), against the triangles of every drawn solid of its own item, every crossing of each ray kept. A nozzle is reported
 * when
 *   - a ray meets a solid whose name says it is a weld seam within the neck's reach (the neck stands on a seam);
 *   - the neck's end lies past a plate it entered (the ray left the plate again before the neck's end: the neck runs through
 *     the body's wall into the item), or more than 0.02 in inside a solid more than 2 in thick (into a solid body): a neck's end
 *     inside the wall plate it is set into is its joint, as a nozzle set in through its opening is;
 *   - the neck touches nothing: neither its axis nor any ray through its wall meets the body within 0.1 in of its end (a neck
 *     that continues an opening, an open cone's end or a gas duct, meets it through its wall and not on its axis);
 *   - or a ray through its wall stops short by more than the neck's own outside radius: a straight-cut neck on a round body
 *     leaves its rim off the body at its sides by up to its radius (on a pipe its own size), never by more.
 * Findings: $AUDIT_OUT/necks/findings-<LABEL>.json, each { a, b, depthIn, at, note } as the other detectors write them.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { unitPiping } from '../../src/refinery/unitPiping';
import { buildGeometry } from '../../src/geometry/partGeometry';
import { pipeDims } from '../../src/catalogue/parts/pipe';

type V = number[]; type Tri = { q: number[]; s: string };
const LABEL = process.env.LABEL ?? 'now', OUT = `${process.env.AUDIT_OUT ?? 'audit-out'}/necks`;
// (one ray's nearest hit; kept for a quick look from a REPL)
export const hit = (o: V, d: V, tris: Tri[]): [number, string] => {
  let best = Infinity, nm = '';
  for (const { q, s } of tris) {
    const e1 = [q[3] - q[0], q[4] - q[1], q[5] - q[2]], e2 = [q[6] - q[0], q[7] - q[1], q[8] - q[2]];
    const p = [d[1] * e2[2] - d[2] * e2[1], d[2] * e2[0] - d[0] * e2[2], d[0] * e2[1] - d[1] * e2[0]], det = e1[0] * p[0] + e1[1] * p[1] + e1[2] * p[2]; if (Math.abs(det) < 1e-12) continue;
    const w = [o[0] - q[0], o[1] - q[1], o[2] - q[2]], uu = (w[0] * p[0] + w[1] * p[1] + w[2] * p[2]) / det; if (uu < -1e-9 || uu > 1 + 1e-9) continue;
    const qq = [w[1] * e1[2] - w[2] * e1[1], w[2] * e1[0] - w[0] * e1[2], w[0] * e1[1] - w[1] * e1[0]], v = (d[0] * qq[0] + d[1] * qq[1] + d[2] * qq[2]) / det; if (v < -1e-9 || uu + v > 1 + 1e-9) continue;
    const t = (e2[0] * qq[0] + e2[1] * qq[1] + e2[2] * qq[2]) / det; if (t > 1e-6 && t < best) { best = t; nm = s; }
  }
  return [best, nm];
};
interface Finding { a: { model: string; line: string; tag: string; kind: string }; b: { model: string; line: string; tag: string; kind: string }; depthIn: number; at: number[]; note: string; rule: string }
const findings: Finding[] = []; let all = 0;
for (const u of (process.env.UNITS ?? '11,12,13,14,15,16,17,18,19').split(',').map(Number)) {
  const up = unitPiping(u), inst = [...up.plant.building().instances, ...up.plant.interior().instances], meshOf = new Map<string, Tri[]>();
  const trisOf = (equip: string) => {
    let t = meshOf.get(equip); if (t) return t; t = [];
    for (const p of inst.filter(p => p.tags.includes(equip))) {
      const T = p.transform as number[];
      for (const s of buildGeometry(p.part).solids) {
        const m = s.mesh as { positions: ArrayLike<number>; indices: ArrayLike<number> }, P = m.positions, I = m.indices;
        const w = (i: number) => { const x = P[3 * i], y = P[3 * i + 1], z = P[3 * i + 2]; return [T[0] * x + T[4] * y + T[8] * z + T[12], T[1] * x + T[5] * y + T[9] * z + T[13], T[2] * x + T[6] * y + T[10] * z + T[14]]; };
        for (let k = 0; k < I.length; k += 3) t.push({ q: [...w(I[k]), ...w(I[k + 1]), ...w(I[k + 2])], s: s.name });
      }
    }
    meshOf.set(equip, t); return t;
  };
  for (const z of up.nozzles.values()) {
    const tris = trisOf(z.equip); if (!tris.length) continue; all++;   // a battery limit's, a station's or a branch root's spool: no item drawn
    const pd = pipeDims(z.NPS, z.cls), ro = pd.OD / 2, d = z.u.map(v => -v), a = Math.abs(z.u[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    const e1 = [z.u[1] * a[2] - z.u[2] * a[1], z.u[2] * a[0] - z.u[0] * a[2], z.u[0] * a[1] - z.u[1] * a[0]], n1 = Math.hypot(...e1), p1 = e1.map(v => v / n1), p2 = [z.u[1] * p1[2] - z.u[2] * p1[1], z.u[2] * p1[0] - z.u[0] * p1[2], z.u[0] * p1[1] - z.u[1] * p1[0]];
    // every crossing of a ray with the item's solids, nearest first
    const hits = (o: V, dd: V): [number, string][] => { const out: [number, string][] = [];
      for (const { q, s: nm } of tris) { const e1 = [q[3] - q[0], q[4] - q[1], q[5] - q[2]], e2 = [q[6] - q[0], q[7] - q[1], q[8] - q[2]];
        const p = [dd[1] * e2[2] - dd[2] * e2[1], dd[2] * e2[0] - dd[0] * e2[2], dd[0] * e2[1] - dd[1] * e2[0]], det = e1[0] * p[0] + e1[1] * p[1] + e1[2] * p[2]; if (Math.abs(det) < 1e-12) continue;
        const w = [o[0] - q[0], o[1] - q[1], o[2] - q[2]], uu = (w[0] * p[0] + w[1] * p[1] + w[2] * p[2]) / det; if (uu < -1e-9 || uu > 1 + 1e-9) continue;
        const qq = [w[1] * e1[2] - w[2] * e1[1], w[2] * e1[0] - w[0] * e1[2], w[0] * e1[1] - w[1] * e1[0]], v = (dd[0] * qq[0] + dd[1] * qq[1] + dd[2] * qq[2]) / det; if (v < -1e-9 || uu + v > 1 + 1e-9) continue;
        const t = (e2[0] * qq[0] + e2[1] * qq[1] + e2[2] * qq[2]) / det; if (t > 1e-6 && t < 600) out.push([t, nm]); }
      return out.sort((x, y) => x[0] - y[0]).filter((h, k, a) => !k || h[0] - a[k - 1][0] > 1e-6); };
    let seam = '', into = 0, gap = 0, touch = false, any = false, at: number[] = z.face;
    const ax = hits(z.face, d); if (ax.length) { any = true; if (Math.abs(ax[0][0] - z.S) <= 0.1) touch = true; }
    for (const r of [ro - 0.03, (ro + pd.D / 2) / 2]) for (let k = 0; k < 12; k++) {
      const th = ((k + 0.37) * Math.PI) / 6, o = z.face.map((v, i) => v + r * (Math.cos(th) * p1[i] + Math.sin(th) * p2[i])), hs = hits(o, d);
      if (!hs.length) continue; any = true;
      const [t, nm] = hs[0], dev = t - z.S; if (Math.abs(dev) <= 0.1) touch = true;
      if (/seam/i.test(nm) && dev < ro) { seam = nm; at = o.map((v, i) => v + d[i] * t); }
      if (dev < -0.02) {   // the neck's end beyond the first surface: inside the plate it is set into, or through it, or in a solid
        const exit = hs[1]?.[0], deep = exit === undefined || exit < z.S + 1e-6 ? z.S - t : 0, solid = exit === undefined || exit - t > 2;
        const past = exit !== undefined && exit < z.S - 0.02, inSolid = solid && z.S - t > 0.02;
        if ((past || inSolid) && deep > into) { into = past ? z.S - exit! : z.S - t; at = o.map((v, i) => v + d[i] * z.S); }
      }
      if (dev > gap) gap = dev;
    }
    const never = !any, short = !touch || gap > ro + 0.1;
    const why = seam ? `its neck stands on ${seam}` : into ? `its neck's end lies ${into.toFixed(3)} in past the plate it is set into, or inside a solid of the item` : never ? `nothing of the item lies behind its neck within 600 in` : short ? (touch ? `its rim stands ${gap.toFixed(3)} in off the item's body, more than its own radius (${ro.toFixed(2)} in)` : `its neck touches the item nowhere: its axis and wall meet the body ${gap.toFixed(3)} in or more beyond its end`) : '';
    if (!why) continue;
    findings.push({ a: { model: `unit-${u}`, line: z.id, tag: z.id, kind: 'nozzle' }, b: { model: `cell-U${u}`, line: z.equip, tag: `${z.equip}/equipment`, kind: 'equipment' }, depthIn: Math.max(into, seam ? 0.125 : 0), at, note: `nozzle ${z.id} (${z.NPS} in) on ${z.equip}: ${why}`, rule: seam ? 'nozzle on a seam' : into ? 'neck into its body' : never ? 'neck to nothing' : 'neck short of its body' });
  }
}
mkdirSync(OUT, { recursive: true }); writeFileSync(`${OUT}/findings-${LABEL}.json`, JSON.stringify(findings, null, 1) + '\n');
console.log(`necks [${LABEL}]: ${findings.length} findings over ${all} nozzles on drawn items -> ${OUT}/findings-${LABEL}.json`);
for (const f of findings) console.log(`   ${f.rule}: ${f.note}`);
