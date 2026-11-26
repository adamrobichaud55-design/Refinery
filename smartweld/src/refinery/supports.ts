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
import { pipeDims, makeWideFlange, type PipeClass } from '../catalogue';
import { interiorKit } from '../generator/interiorKit';
import type { Placed } from '../generator/building';
import { multiply, translate, standUp } from '../geometry/transform';
import { PAD } from './cell';

type Member = Extract<Obstacle, { kind: 'cap' }>;
type Box = [V3, V3];
/** SW-PS-9: what a rod may hang from: horizontal steel, not equipment, columns, ladders, guardrails or grating */
const HANG_FROM = (tag: string) => !/equipment|pad|grout|ladder|guardrail|cage|rail|tread|stair|grating|cladding|door|slab|base-plate|anchor|weld|bolt|clip|column|keep-out|pier/.test(tag);
/** SW-PS-7: the span a line carries */
const spanOf = (OD: number) => (OD >= 3.5 ? 240 : OD >= 2.375 ? 180 : 120);
const POST_MAX = 600, HANG_MAX = 240, up6 = (v: number) => Math.ceil(v / 6 - 1e-9) * 6;

/** SW-RPI-17: a pipe frame: two posts and a beam across under a pipe, the pipe on a shoe on the beam. `u` is square to the run in plan; post A stands at `at` − u·d[0], post B at `at` + u·d[1], each on its floor (grade, on a pedestal, or a pad's top); the beam's top is at `top` */
export interface FrameSpec { line: string; at: V3; u: V3; /** 0 on a side with no post (a cantilever) */ d: [number, number]; floors: [number, number]; top: number; post: 'W8x31' | 'W10x49'; /** the pipe's radius: a cantilever's beam reaches 4 in past it */ rad?: number }
export const FRAME_BEAM = { D: 8, w: 31 }, SHOE_H = 4, PEDESTAL = 20;
/** the depth of a frame's beam: `W8x31` to 20 ft long, `W12x40` longer */
export const beamDepth = (f: FrameSpec) => (f.d[0] > 0 ? f.d[0] + 4 : (f.rad ?? 0) + 4) + (f.d[1] > 0 ? f.d[1] + 4 : (f.rad ?? 0) + 4) > 248 ? 12 : FRAME_BEAM.D;
/** the parts of a pipe frame, placed */
export function framePlaced(f: FrameSpec): Placed[] {
  const out: Placed[] = [], kit = interiorKit({ pedestal: PAD, padHeight: PAD }, out, {}), [pD, pw] = f.post === 'W8x31' ? [8, 31] : [10, 49], tag = `pipe-frame:${f.line}`;
  f.d.forEach((d, k) => {
    if (d <= 0) return;
    const s = k ? 1 : -1, px = f.at[0] + f.u[0] * d * s, pz = f.at[2] + f.u[2] * d * s, floor = f.floors[k], base = floor > 0 ? floor : PAD;
    if (floor <= 0) out.push({ part: kit.concrete('pedestal', PEDESTAL, PAD, PEDESTAL), transform: frameFromAxes([px - PEDESTAL / 2, PAD / 2, pz], [0, 1, 0], [1, 0, 0]), tags: [tag, 'pad'] });
    out.push({ part: makeWideFlange(f.post, pD, pw, f.top - beamDepth(f) - base), transform: multiply(translate(px, base, pz), standUp()), tags: [tag, 'post'] });
  });
  const reach = (d: number) => (d > 0 ? d + 4 : (f.rad ?? 0) + 4), L = reach(f.d[0]) + reach(f.d[1]), a: V3 = [f.at[0] - f.u[0] * reach(f.d[0]), f.top - FRAME_BEAM.D / 2, f.at[2] - f.u[2] * reach(f.d[0])];
  const [bD, bw] = L > 248 ? [12, 40] : [FRAME_BEAM.D, FRAME_BEAM.w]; a[1] = f.top - bD / 2;
  out.push({ part: makeWideFlange(L > 248 ? 'W12x40' : 'W8x31', bD, bw, L), transform: frameFromAxes(a, [0, 1, 0], f.u), tags: [tag, 'beam'] });
  return out;
}
export interface SpanSupports { hangers: number; stanchions: number; posts: number; onSteel: number; lines: string[]; frames: FrameSpec[] }

export function supportsAlongSpans(m: PipingModel, plant: PlantDef, vb: (c: Comp) => Box, withFrames = true): SpanSupports {
  const pass = (frames: boolean, out: SpanSupports) => passOnce(m, plant, vb, frames, out), all: SpanSupports = { hangers: 0, stanchions: 0, posts: 0, onSteel: 0, lines: [], frames: [] };
  pass(false, all); if (withFrames) pass(true, all); return all;
}
function passOnce(m: PipingModel, plant: PlantDef, vb: (c: Comp) => Box, frames: boolean, out: SpanSupports): void {
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
  /** a post's true shape 1 in clear: its base plate (with the rods' nuts) as a box on the floor, its post as a round from there to under the pipe */
  const postClear = (no: string, key: string, base: V3, top: number, floorTop?: number, except?: Obstacle) => {
    const part = partFromKey(key), rp = (part.dims.post?.value ?? 2) / 2, sb = 2 * rp + 6, shapes: K.Shape[] = [{ kind: 'box', mn: [base[0] - sb / 2, base[1], base[2] - sb / 2], mx: [base[0] + sb / 2, base[1] + 1.25, base[2] + sb / 2] }, { kind: 'cap', a: [base[0], base[1] + 1.25, base[2]], b: [base[0], top, base[2]], r: rp }];
    for (const sh of shapes) {
      const b = boxOfShape(sh);
      const li = items.find(q => q.line !== no && near(q.box, b, 1) && K.gap(q.s, sh) < 1); if (li) { lastBlock = `line ${li.line}`; return false; }
      const si = solidBoxes.findIndex((q, i) => statics[i] !== except && near(q.box, b, 1) && !(floorTop !== undefined && q.s.kind === 'box' && Math.abs(q.s.mx[1] - floorTop) < 0.01) && K.gap(q.s, sh) < 1); if (si >= 0) { lastBlock = `solid ${statics[si].tag}`; return false; }
    }
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
      const place = (p: V3): boolean => (frames ? frameAt(p) : placeSupport(p));
      /** SW-RPI-17: a pipe frame across the run at p */
      const frameAt = (p: V3): boolean => {
        const u: V3 = [-w[2], 0, w[0]], top = p[1] - rad - SHOE_H;
        const side = (s: 1 | -1): { d: number; floor: number; post: 'W8x31' | 'W10x49' } | undefined => {
          for (let d = up6(rad + 12); d <= 180; d += 6) {
            const px = p[0] + u[0] * d * s, pz = p[2] + u[2] * d * s, fl = floorUnder([px, top, pz]), base = fl > 0 ? fl : PAD, h = top - FRAME_BEAM.D - base; if (h < 12 || h > POST_MAX) continue;
            const post: 'W8x31' | 'W10x49' = h > 360 ? 'W10x49' : 'W8x31', half = post === 'W8x31' ? 4.25 : 5.25;
            if (!clearBox(r.no, [[px - half, base, pz - half], [px + half, top - FRAME_BEAM.D, pz + half]], fl > 0 ? fl : undefined)) continue;
            if (fl <= 0 && !clearBox(r.no, [[px - PEDESTAL / 2, 0, pz - PEDESTAL / 2], [px + PEDESTAL / 2, PAD, pz + PEDESTAL / 2]], 0)) continue;
            return { d, floor: fl, post };
          }
          return undefined;
        };
        let A = side(-1), B = side(1);
        // a post on one side only, within 4 ft: a cantilever (SW-PS-6); two posts more than 20 ft apart: the nearer one alone, if within 4 ft
        if (A && B && A.d + B.d + 8 > 360) { if (Math.min(A.d, B.d) <= 48) { if (A.d <= B.d) B = undefined; else A = undefined; } else { why(r.no, `at ${p.map(Math.round)}: no frame (posts more than 30 ft apart)`); return false; } }
        if (!A && !B) { why(r.no, `at ${p.map(Math.round)}: no frame (no place for a post on either side; last ${lastBlock})`); return false; }
        if (!A || !B) { const one = (A ?? B)!; if (one.d > 48) { why(r.no, `at ${p.map(Math.round)}: no frame (a post on one side only, ${one.d} in out; last ${lastBlock})`); return false; } }
        const NONE = { d: 0, floor: 0, post: 'W8x31' as const }; if (!A) A = NONE; if (!B) B = NONE;
        const e = A.d > 0 ? A.d + 4 : rad + 4, f2 = B.d > 0 ? B.d + 4 : rad + 4, ends: V3[] = [[p[0] - u[0] * e, top - FRAME_BEAM.D, p[2] - u[2] * e], [p[0] + u[0] * f2, top, p[2] + u[2] * f2]];
        const bd = e + f2 > 248 ? 12 : FRAME_BEAM.D, beam: Box = [[Math.min(ends[0][0], ends[1][0]) - (Math.abs(u[0]) < 0.5 ? 4.5 : 0), top - bd, Math.min(ends[0][2], ends[1][2]) - (Math.abs(u[2]) < 0.5 ? 4.5 : 0)], [Math.max(ends[0][0], ends[1][0]) + (Math.abs(u[0]) < 0.5 ? 4.5 : 0), top, Math.max(ends[0][2], ends[1][2]) + (Math.abs(u[2]) < 0.5 ? 4.5 : 0)]];
        if (!clearBox(r.no, beam)) { why(r.no, `at ${p.map(Math.round)}: no frame (beam blocked by ${lastBlock})`); return false; }
        const spec: FrameSpec = { line: r.no, at: [p[0], p[1], p[2]], u, d: [A.d, B.d], floors: [A.floor, B.floor], top, post: A.post === 'W10x49' || B.post === 'W10x49' ? 'W10x49' : 'W8x31', rad };
        out.frames.push(spec); for (const q of framePlaced(spec)) { const b = worldBox(q.part, q.transform as never); if (b) items.push({ line: `frame:${r.no}`, s: { kind: 'box', mn: b[0], mx: b[1] }, box: b }); }
        push(`SHOE|${r.NPS}|${r.cls}|shoe|${SHOE_H.toFixed(3)}`, frameFromAxes([p[0], p[1] - rad, p[2]], [0, 1, 0], w) as number[], 'shoe', [p[0], top, p[2]]); return true;
      };
      const placeSupport = (p: V3): boolean => {
        const top = steelOver(p, rad, r.no);
        if (top !== undefined) { const key = `HANG|${r.NPS}|${r.cls}|${(top - p[1]).toFixed(2)}`, T = frameFromAxes(p, [0, 1, 0], w); push(key, T, 'hanger', p); out.hangers++; return true; }
        // on steel directly below, at most 10 ft under the pipe: the highest member whose axis passes under it
        let sb = -Infinity, sm: Obstacle | undefined; for (const o of members) { const dx = o.b[0] - o.a[0], dz = o.b[2] - o.a[2], u = Math.max(0, Math.min(1, ((p[0] - o.a[0]) * dx + (p[2] - o.a[2]) * dz) / (dx * dx + dz * dz || 1))), q = [o.a[0] + dx * u, o.a[1] + (o.b[1] - o.a[1]) * u, o.a[2] + dz * u]; if (Math.hypot(q[0] - p[0], q[2] - p[2]) > o.r * 0.6) continue; const tp = q[1] + o.r * 0.7; if (tp < p[1] - rad - 6 && tp > sb) { sb = tp; sm = o; } }
        if (isFinite(sb) && p[1] - rad - sb <= 120) { const h2 = p[1] - rad - sb, key = `STAN|${r.NPS}|${r.cls}|${h2.toFixed(2)}`, T = frameFromAxes([p[0], sb, p[2]], [0, 1, 0], w), b = worldBox(partFromKey(key), T as never);
          if (b && postClear(r.no, key, [p[0], sb + 0.5, p[2]], p[1] - rad - 0.5, undefined, sm)) { push(key, T, 'stanchion', p); out.onSteel++; return true; } }
        const f = floorUnder(p), h = p[1] - rad - f; if (h < 6 || h > POST_MAX) { why(r.no, `at ${p.map(Math.round)}: no steel above, ${isFinite(sb) ? `steel below at ${sb.toFixed(0)} (blocked by ${lastBlock})` : 'no steel below'}, floor ${f} out of reach`); return false; }
        const key = `STAN|${r.NPS}|${r.cls}|${h.toFixed(2)}`, T = frameFromAxes([p[0], f, p[2]], [0, 1, 0], w), b = worldBox(partFromKey(key), T as never);
        if (!b || !postClear(r.no, key, [p[0], f, p[2]], p[1] - rad - 0.5, f)) { why(r.no, `at ${p.map(Math.round)}: no steel above, ${isFinite(sb) ? `steel below at ${sb.toFixed(0)}` : 'no steel below'}; a post from ${f} blocked by ${lastBlock}`); return false; }
        push(key, T, 'stanchion', p); if (h > 168) out.posts++; else out.stanchions++; return true;
      };
      const push = (key: string, T: number[], type: 'hanger' | 'stanchion' | 'shoe', p: V3) => {
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
}
