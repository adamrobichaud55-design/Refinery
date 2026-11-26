/**
 * Plant 3, SW-RPI-17: supports where the generator's stepping stopped. On a finished model, each stretch of a horizontal
 * run longer than its line's span is stepped along from both ends, as the generator steps (SW-PS-9), and at each place
 * the first of a hanger from steel above or a stanchion (or support post, SW-PS-9 as amended) from the floor below that
 * stands clear is set. Only supports are added: no line, joint or component moves.
 */
import { staticObstacles, partFromKey, worldBox, type PipingModel, type Comp, type LineRun, type Obstacle } from '../generator/piping';
import * as K from '../generator/pipingCheck';
import type { PlantDef } from '../generator/plant';
import type { V3 } from '../generator/router';
import { frameFromAxes } from '../geometry/transform';
import { pipeDims, type PipeClass } from '../catalogue';

type Member = Extract<Obstacle, { kind: 'cap' }>;
type Box = [V3, V3];
/** SW-PS-9: what a rod may hang from: horizontal steel, not equipment, columns, ladders, guardrails or grating */
const HANG_FROM = (tag: string) => !/equipment|pad|grout|ladder|guardrail|cage|rail|tread|stair|grating|cladding|door|slab|base-plate|anchor|weld|bolt|clip|column|keep-out|pier/.test(tag);
/** SW-PS-7: the span a line carries */
const spanOf = (OD: number) => (OD >= 3.5 ? 240 : OD >= 2.375 ? 180 : 120);
const POST_MAX = 600, HANG_MAX = 240;

export interface SpanSupports { hangers: number; stanchions: number; posts: number; onSteel: number; lines: string[] }

export function supportsAlongSpans(m: PipingModel, plant: PlantDef, vb: (c: Comp) => Box): SpanSupports {
  const out: SpanSupports = { hangers: 0, stanchions: 0, posts: 0, onSteel: 0, lines: [] };
  const dbg = process.env.SUPPORTS_DEBUG, why = (no: string, s: string) => { if (dbg && (dbg === "*" || no.endsWith(dbg))) console.log(`  [${no}] ${s}`); };
  const statics = staticObstacles(plant.building().instances, plant.interior().instances, true).obstacles.filter(o => !/keep-out/.test(o.tag));
  const members = statics.filter((o): o is Member => { if (o.kind !== 'cap' || !HANG_FROM(o.tag)) return false; const d = [o.b[0] - o.a[0], o.b[1] - o.a[1], o.b[2] - o.a[2]], L = Math.hypot(d[0], d[1], d[2]); return L > 1e-6 && Math.abs(d[1]) / L <= 0.5; });
  const floors = statics.filter((o): o is Extract<Obstacle, { kind: 'box' }> => o.kind === 'box' && /pad|slab|pier|deck/.test(o.tag));
  const boxOfShape = (s: K.Shape): Box => (s.kind === 'box' ? [s.mn, s.mx] : [[0, 1, 2].map(k => Math.min(s.a[k], s.b[k]) - s.r) as V3, [0, 1, 2].map(k => Math.max(s.a[k], s.b[k]) + s.r) as V3]);
  const items: { line: string; s: K.Shape; box: Box }[] = [];
  const addLine = (r: LineRun) => { for (const c of r.comps) if (c.kind !== 'studs') for (const s of K.compShapes(c, vb)) items.push({ line: r.no, s, box: boxOfShape(s) }); for (const sp of r.supports) { const b = vb({ key: sp.key, T: sp.T } as Comp); items.push({ line: r.no, s: { kind: 'box', mn: b[0], mx: b[1] }, box: b }); } };
  for (const r of m.lines) addLine(r);
  const solidBoxes: { s: K.Shape; box: Box }[] = statics.map(o => (o.kind === 'box' ? { s: { kind: 'box', mn: o.mn, mx: o.mx } as K.Shape, box: [o.mn, o.mx] as Box } : { s: { kind: 'cap', a: o.a, b: o.b, r: o.r } as K.Shape, box: boxOfShape({ kind: 'cap', a: o.a, b: o.b, r: o.r }) }));
  const near = (a: Box, b: Box, e: number) => a[0][0] < b[1][0] + e && a[1][0] > b[0][0] - e && a[0][1] < b[1][1] + e && a[1][1] > b[0][1] - e && a[0][2] < b[1][2] + e && a[1][2] > b[0][2] - e;
  /** a solid in the box b is 1 in clear of every other line and of every solid of the plant but the floor it stands on */
  let lastBlock = '';
  const clearBox = (no: string, b: Box, floorTop?: number, except?: Obstacle) => {
    const sh: K.Shape = { kind: 'box', mn: b[0], mx: b[1] };
    const li = items.find(q => q.line !== no && near(q.box, b, 1) && K.gap(q.s, sh) < 1); if (li) { lastBlock = `line ${li.line}`; return false; }
    const si = solidBoxes.findIndex((q, i) => statics[i] !== except && near(q.box, b, 1) && !(floorTop !== undefined && q.s.kind === 'box' && Math.abs(q.s.mx[1] - floorTop) < 0.01) && K.gap(q.s, sh) < 1); if (si >= 0) { lastBlock = `solid ${statics[si].tag}`; return false; }
    return true;
  };
  const rodClear = (no: string, x: number, z: number, y0: number, y1: number) => y1 <= y0 || clearBox(no, [[x - 0.25, y0, z - 0.25], [x + 0.25, y1, z + 0.25]]);
  const steelOver = (p: V3, rad: number, no: string): number | undefined => {
    let best = Infinity;
    for (const o of members) {
      const dx = o.b[0] - o.a[0], dz = o.b[2] - o.a[2], u = Math.max(0, Math.min(1, ((p[0] - o.a[0]) * dx + (p[2] - o.a[2]) * dz) / (dx * dx + dz * dz || 1))), q = [o.a[0] + dx * u, o.a[1] + (o.b[1] - o.a[1]) * u, o.a[2] + dz * u];
      if (Math.hypot(q[0] - p[0], q[2] - p[2]) > o.r * 0.6) continue; const bottom = q[1] - o.r * 0.7; if (bottom > p[1] + rad + 6 && bottom - p[1] <= HANG_MAX && bottom < best) best = bottom;
    }
    return isFinite(best) && rodClear(no, p[0], p[2], p[1] + rad + 3, best - 6) ? best : undefined;
  };
  const floorUnder = (p: V3) => { let f = 0; for (const o of floors) if (p[0] > o.mn[0] && p[0] < o.mx[0] && p[2] > o.mn[2] && p[2] < o.mx[2] && o.mx[1] < p[1]) f = Math.max(f, o.mx[1]); return f; };

  for (const r of m.lines) {
    if (r.kind === 'stub' || !r.ok) continue;
    const OD = pipeDims(r.NPS, r.cls as PipeClass).OD, rad = OD / 2, span = spanOf(OD);
    const runs: { a: V3; b: V3 }[] = [];
    for (const c of r.comps.filter(x => x.kind === 'pipe' || x.kind === 'tee')) {
      const last = runs[runs.length - 1], L = Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1], c.b[2] - c.a[2]), w = [0, 1, 2].map(k => (c.b[k] - c.a[k]) / L);
      if (last) { const Ll = Math.hypot(last.b[0] - last.a[0], last.b[1] - last.a[1], last.b[2] - last.a[2]), wl = [0, 1, 2].map(k => (last.b[k] - last.a[k]) / Ll); if (Math.hypot(last.b[0] - c.a[0], last.b[1] - c.a[1], last.b[2] - c.a[2]) < 0.1 && Math.abs(w[0] * wl[0] + w[1] * wl[1] + w[2] * wl[2] - 1) < 1e-6) { last.b = c.b; continue; } }
      runs.push({ a: c.a, b: c.b });
    }
    const fittings = r.comps.filter(c => c.kind !== 'pipe' && c.kind !== 'studs');
    const toSeg = (p: V3, a: V3, b: V3) => { const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L2 = d[0] ** 2 + d[1] ** 2 + d[2] ** 2, t = L2 < 1e-12 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1] + (p[2] - a[2]) * d[2]) / L2)); return Math.hypot(p[0] - a[0] - d[0] * t, p[1] - a[1] - d[1] * t, p[2] - a[2] - d[2] * t); };
    const clearOf = (p: V3) => fittings.every(f => toSeg(p, f.a, f.b) > 5) && r.welds.every(w => Math.hypot(w.at[0] - p[0], w.at[1] - p[1], w.at[2] - p[2]) > 5);
    let added = 0;
    for (const sr of runs) {
      const L = Math.hypot(sr.b[0] - sr.a[0], sr.b[1] - sr.a[1], sr.b[2] - sr.a[2]), w: V3 = [(sr.b[0] - sr.a[0]) / L, (sr.b[1] - sr.a[1]) / L, (sr.b[2] - sr.a[2]) / L];
      if (Math.abs(w[1]) > 0.5 || L <= span) continue;
      const at = (t: number): V3 => [sr.a[0] + w[0] * t, sr.a[1] + w[1] * t, sr.a[2] + w[2] * t];
      // where members cross the run in plan: t along the run, and how far either side a support may stand on or hang from it
      const cross = members.flatMap(o => { const ux = o.b[0] - o.a[0], uz = o.b[2] - o.a[2], den = w[0] * uz - w[2] * ux; if (Math.abs(den) < 1e-9) return []; const ex = o.a[0] - sr.a[0], ez = o.a[2] - sr.a[2], t = (ex * uz - ez * ux) / den, s = (ex * w[2] - ez * w[0]) / den; return s >= 0 && s <= 1 && t > 0 && t < L ? [{ t, reach: o.r * 0.6 }] : []; });
      /** the first support that stands clear at p: a hanger from steel above, or a stanchion or post from the floor */
      const place = (p: V3): boolean => {
        const top = steelOver(p, rad, r.no);
        if (top !== undefined) { const key = `HANG|${r.NPS}|${r.cls}|${(top - p[1]).toFixed(2)}`, T = frameFromAxes(p, [0, 1, 0], w); push(key, T, 'hanger', p); out.hangers++; return true; }
        // on steel directly below, at most 10 ft under the pipe: the highest member whose axis passes under it
        let sb = -Infinity, sm: Obstacle | undefined; for (const o of members) { const dx = o.b[0] - o.a[0], dz = o.b[2] - o.a[2], u = Math.max(0, Math.min(1, ((p[0] - o.a[0]) * dx + (p[2] - o.a[2]) * dz) / (dx * dx + dz * dz || 1))), q = [o.a[0] + dx * u, o.a[1] + (o.b[1] - o.a[1]) * u, o.a[2] + dz * u]; if (Math.hypot(q[0] - p[0], q[2] - p[2]) > o.r * 0.6) continue; const tp = q[1] + o.r * 0.7; if (tp < p[1] - rad - 6 && tp > sb) { sb = tp; sm = o; } }
        if (isFinite(sb) && p[1] - rad - sb <= 120) { const h2 = p[1] - rad - sb, key = `STAN|${r.NPS}|${r.cls}|${h2.toFixed(2)}`, T = frameFromAxes([p[0], sb, p[2]], [0, 1, 0], w), b = worldBox(partFromKey(key), T as never);
          if (b && clearBox(r.no, [[b[0][0], sb + 0.5, b[0][2]], [b[1][0], p[1] - rad - 0.5, b[1][2]]], undefined, sm)) { push(key, T, 'stanchion', p); out.onSteel++; return true; } }
        const f = floorUnder(p), h = p[1] - rad - f; if (h < 6 || h > POST_MAX) { why(r.no, `at ${p.map(Math.round)}: no steel above, ${isFinite(sb) ? `steel below at ${sb.toFixed(0)} (blocked by ${lastBlock})` : 'no steel below'}, floor ${f} out of reach`); return false; }
        const key = `STAN|${r.NPS}|${r.cls}|${h.toFixed(2)}`, T = frameFromAxes([p[0], f, p[2]], [0, 1, 0], w), b = worldBox(partFromKey(key), T as never);
        if (!b || !clearBox(r.no, [b[0], [b[1][0], p[1] - rad - 0.5, b[1][2]]], f)) { why(r.no, `at ${p.map(Math.round)}: no steel above, ${isFinite(sb) ? `steel below at ${sb.toFixed(0)}` : 'no steel below'}; a post from ${f} blocked by ${lastBlock}`); return false; }
        push(key, T, 'stanchion', p); if (h > 168) out.posts++; else out.stanchions++; return true;
      };
      const push = (key: string, T: number[], type: 'hanger' | 'stanchion', p: V3) => {
        const ids = new Set(r.supports.map(sp => sp.id)); let k = r.supports.length + 1; while (ids.has(`${r.no}/S${k}`)) k++;
        const sp = { id: `${r.no}/S${k}`, line: r.no, type, at: p, key, T } as LineRun['supports'][number]; r.supports.push(sp); added++;
        const b = vb({ key, T } as Comp); items.push({ line: r.no, s: { kind: 'box', mn: b[0], mx: b[1] }, box: b });
      };
      /** the generator's stepping along a stretch, in the direction given; false where a step finds nothing */
      const step = (lo: number, hi: number, dir: 1 | -1): boolean => {
        let prev = dir > 0 ? lo : hi; const end = dir > 0 ? hi : lo;
        while (Math.abs(end - prev) > span + 1e-6) {
          const rem = Math.abs(end - prev), target = prev + (dir * rem) / Math.ceil(rem / span), within = (t: number) => (t - prev) * dir > 12 && (t - prev) * dir <= span + 1e-6 && (end - t) * dir > 6;
          let placed: number | undefined;
          // first where a member of steel crosses the run in plan (over or under it), nearest the target, each moved by half-inches within its reach; then the 6 in steps
          for (const c of cross.filter(q => within(q.t)).sort((p, q) => Math.abs(p.t - target) - Math.abs(q.t - target))) {
            for (let d = 0; d <= c.reach + 1e-6 && placed === undefined; d += 0.5) for (const off of d ? [d, -d] : [0]) { const t = c.t + off; if (!within(t)) continue; const p = at(t); if (!clearOf(p)) continue; if (place(p)) { placed = t; break; } }
            if (placed !== undefined) break;
          }
          for (let d = 0; d <= span && placed === undefined; d += 6) for (const off of d ? [-d * dir, d * dir] : [0]) { const t = target + off; if (!within(t)) continue; const p = at(t); if (!clearOf(p)) continue; if (place(p)) { placed = t; break; } }
          if (placed === undefined) return false; prev = placed;
        }
        return true;
      };
      for (const dir of [1, -1] as const) {
        const on = r.supports.map(sp => (sp.at[0] - sr.a[0]) * w[0] + (sp.at[1] - sr.a[1]) * w[1] + (sp.at[2] - sr.a[2]) * w[2]).filter(t => t > -1 && t < L + 1).sort((p, q) => p - q), pts = [0, ...on, L];
        for (let i = 1; i < pts.length; i++) if (pts[i] - pts[i - 1] > span + 1e-6) step(pts[i - 1], pts[i], dir);
      }
    }
    if (added) out.lines.push(`${r.no} (${added})`);
  }
  return out;
}
