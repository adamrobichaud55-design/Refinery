/**
 * Plant 3, SW-RPI-17: supports where the generator's stepping stopped. On a finished model, each stretch of a horizontal
 * run longer than its line's span is stepped along from both ends, as the generator steps (SW-PS-9), and at each place
 * the first of a hanger from steel above or a stanchion (or support post, SW-PS-9 as amended) from the floor below that
 * stands clear is set. Only supports are added: no line, joint or component moves.
 */
import { staticObstacles, partFromKey, worldBox, solidBoxes, type PipingModel, type Comp, type LineRun, type Obstacle } from '../generator/piping';
import * as K from '../generator/pipingCheck';
import type { PlantDef } from '../generator/plant';
import type { V3 } from '../generator/router';
import { frameFromAxes } from '../geometry/transform';
import { pipeDims, makeWideFlange, designFlange, elbowRadius, type PipeClass } from '../catalogue';
import { arcPoints, arcMeetsBox, shapesOf, type OwnShape } from './ownLine';
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
  // SW-RPI-18 (amended): no support set here overlaps a solid of any support already on the model, its own line's included
  const keptAll: KeptSupport[] = m.lines.flatMap(r => r.supports.map(sp => keptOf(sp, r.no)));
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
  const freeOf = (key: string, T: number[]) => { const mine = supportSolids(key, T), q = keptAll.find(k => k.solids.some(a => mine.some(b => deep(a, b)))); if (q) lastBlock = `the support ${q.id}`; return !q; };
  const rodClear = (no: string, x: number, z: number, y0: number, y1: number) => y1 <= y0 || clearBox(no, [[x - 0.25, y0, z - 0.25], [x + 0.25, y1, z + 0.25]]);
  const steelOver = (p: V3, rad: number, no: string): number | undefined => {
    let best = Infinity;
    for (const o of members) {
      const dx = o.b[0] - o.a[0], dz = o.b[2] - o.a[2], u = Math.max(0, Math.min(1, ((p[0] - o.a[0]) * dx + (p[2] - o.a[2]) * dz) / (dx * dx + dz * dz || 1))), q = [o.a[0] + dx * u, o.a[1] + (o.b[1] - o.a[1]) * u, o.a[2] + dz * u];
      if (Math.hypot(q[0] - p[0], q[2] - p[2]) > o.r * 0.6) continue; const bottom = q[1] - o.r * 0.7; if (bottom > p[1] + rad + 6 && bottom - p[1] <= HANG_MAX && bottom < best) best = bottom;
    }
    return isFinite(best) && rodClear(no, p[0], p[2], p[1] + rad + 3, best - 6) ? best : undefined;
  };
  // SW-RPI-18 (amended): SW-RPI-17 sets nothing that test would take out; and the true tops of horizontal members, from their own boxes
  const strikes = strikeTest(m, plant, vb);
  const memberTops = plant.interior().instances.filter(pl => !pl.tags.some(t => /keep-out|equipment|pad|grating|ladder|guardrail|stair|bracing|column|post|pedestal|anchor|bolt|weld|clip|plate/.test(t)))
    .map(pl => worldBox(pl.part, pl.transform)).filter((q): q is Box => !!q && q[1][1] - q[0][1] <= 36 && Math.max(q[1][0] - q[0][0], q[1][2] - q[0][2]) >= 24);
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
        const shoeKey = `SHOE|${r.NPS}|${r.cls}|shoe|${SHOE_H.toFixed(3)}`, shoeT = frameFromAxes([p[0], p[1] - rad, p[2]], [0, 1, 0], w) as number[];
        if (!freeOf(shoeKey, shoeT)) { why(r.no, `at ${p.map(Math.round)}: no frame (its shoe on ${lastBlock})`); return false; }
        const spec: FrameSpec = { line: r.no, at: [p[0], p[1], p[2]], u, d: [A.d, B.d], floors: [A.floor, B.floor], top, post: A.post === 'W10x49' || B.post === 'W10x49' ? 'W10x49' : 'W8x31', rad };
        out.frames.push(spec); for (const q of framePlaced(spec)) { const b = worldBox(q.part, q.transform as never); if (b) items.push({ line: `frame:${r.no}`, s: { kind: 'box', mn: b[0], mx: b[1] }, box: b }); }
        push(`SHOE|${r.NPS}|${r.cls}|shoe|${SHOE_H.toFixed(3)}`, frameFromAxes([p[0], p[1] - rad, p[2]], [0, 1, 0], w) as number[], 'shoe', [p[0], top, p[2]]); return true;
      };
      const placeSupport = (p: V3): boolean => {
        const top = steelOver(p, rad, r.no);
        if (top !== undefined) { const key = `HANG|${r.NPS}|${r.cls}|${(top - p[1]).toFixed(2)}`, T = frameFromAxes(p, [0, 1, 0], w) as number[]; if (freeOf(key, T)) { push(key, T, 'hanger', p); out.hangers++; return true; } }
        // on steel directly below, at most 10 ft under the pipe: the highest member whose axis passes under it
        let sb = -Infinity, sm: Obstacle | undefined; for (const o of members) { const dx = o.b[0] - o.a[0], dz = o.b[2] - o.a[2], u = Math.max(0, Math.min(1, ((p[0] - o.a[0]) * dx + (p[2] - o.a[2]) * dz) / (dx * dx + dz * dz || 1))), q = [o.a[0] + dx * u, o.a[1] + (o.b[1] - o.a[1]) * u, o.a[2] + dz * u]; if (Math.hypot(q[0] - p[0], q[2] - p[2]) > o.r * 0.6) continue; const tp = q[1] + o.r * 0.7; if (tp < p[1] - rad - 6 && tp > sb) { sb = tp; sm = o; } }
        // the member's true top, from its own box, where one under p has its top within 3 in of the estimate (SW-RPI-18 as amended)
        if (isFinite(sb)) { const tb = memberTops.filter(q => p[0] >= q[0][0] - 0.01 && p[0] <= q[1][0] + 0.01 && p[2] >= q[0][2] - 0.01 && p[2] <= q[1][2] + 0.01 && Math.abs(q[1][1] - sb) <= 3).sort((x, y) => Math.abs(x[1][1] - sb) - Math.abs(y[1][1] - sb))[0]; if (tb) sb = tb[1][1]; }
        if (isFinite(sb) && p[1] - rad - sb <= 120) { const h2 = p[1] - rad - sb, key = `STAN|${r.NPS}|${r.cls}|${h2.toFixed(2)}`, T = frameFromAxes([p[0], sb, p[2]], [0, 1, 0], w), b = worldBox(partFromKey(key), T as never);
          if (b && postClear(r.no, key, [p[0], sb + 0.5, p[2]], p[1] - rad - 0.5, undefined, sm) && !strikes({ id: '', type: 'stanchion', key, T }, r.no) && freeOf(key, T as number[])) { push(key, T, 'stanchion', p); out.onSteel++; return true; } }
        const f = floorUnder(p), h = p[1] - rad - f; if (h < 6 || h > POST_MAX) { why(r.no, `at ${p.map(Math.round)}: no steel above, ${isFinite(sb) ? `steel below at ${sb.toFixed(0)} (blocked by ${lastBlock})` : 'no steel below'}, floor ${f} out of reach`); return false; }
        const key = `STAN|${r.NPS}|${r.cls}|${h.toFixed(2)}`, T = frameFromAxes([p[0], f, p[2]], [0, 1, 0], w), b = worldBox(partFromKey(key), T as never);
        if (!b || !postClear(r.no, key, [p[0], f, p[2]], p[1] - rad - 0.5, f) || strikes({ id: '', type: 'stanchion', key, T }, r.no) || !freeOf(key, T as number[])) { why(r.no, `at ${p.map(Math.round)}: no steel above, ${isFinite(sb) ? `steel below at ${sb.toFixed(0)}` : 'no steel below'}; a post from ${f} blocked by ${lastBlock}`); return false; }
        push(key, T, 'stanchion', p); if (h > 168) out.posts++; else out.stanchions++; return true;
      };
      const push = (key: string, T: number[], type: 'hanger' | 'stanchion' | 'shoe', p: V3) => {
        const ids = new Set(r.supports.map(sp => sp.id)); let k = r.supports.length + 1; while (ids.has(`${r.no}/S${k}`)) k++;
        const sp = { id: `${r.no}/S${k}`, line: r.no, type, at: p, key, T } as LineRun['supports'][number]; r.supports.push(sp); added++;
        const b = vb({ key, T } as Comp); items.push({ line: r.no, s: { kind: 'box', mn: b[0], mx: b[1] }, box: b }); keptAll.push(keptOf(sp, r.no));
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

/** a part's solid box from its own frame into the world, as the box round its eight corners */
const xfp = (T: number[], p: V3): V3 => [T[0] * p[0] + T[4] * p[1] + T[8] * p[2] + T[12], T[1] * p[0] + T[5] * p[1] + T[9] * p[2] + T[13], T[2] * p[0] + T[6] * p[1] + T[10] * p[2] + T[14]];
const toWorld = (T: number[], q: Box): Box => { const cs: V3[] = []; for (const x of [q[0][0], q[1][0]]) for (const y of [q[0][1], q[1][1]]) for (const z of [q[0][2], q[1][2]]) cs.push(xfp(T, [x, y, z])); return [[0, 1, 2].map(k => Math.min(...cs.map(c => c[k]))), [0, 1, 2].map(k => Math.max(...cs.map(c => c[k])))] as Box; };
/** every solid of a support's part, in the world */
export const supportSolids = (key: string, T: number[]): Box[] => solidBoxes(partFromKey(key)).map(q => toWorld(T, q as Box));
/** SW-RPI-18 (amended): the tall members of a support's part in the world, each trimmed 3 in at each end along its height: every solid standing
 *  more than 6.5 in and taller than it is wide (a hanger's rod, a stanchion's post, a trunnion's leg; not a hanger's clamp ring, as tall as it
 *  is wide); a trapeze's two rods, which its part holds as one solid, one by one, each at its side of that solid, as wide as the solid is thick
 *  and as long as its own rod (the key's two heights). `whole`: untrimmed */
const tallOf = (key: string, T: number[], whole = false): Box[] => {
  const out: Box[] = [], k = key.split('|'), e = whole ? 0 : 3;
  for (const q of solidBoxes(partFromKey(key))) {
    const h = q[1][1] - q[0][1], wx = q[1][0] - q[0][0], wz = q[1][2] - q[0][2];
    if (h <= 6.5 || h <= Math.max(wx, wz)) continue;
    const each: Box[] = k[0] === 'TRAP' && wx > 2 * wz ? [[[q[0][0], q[0][1], q[0][2]], [q[0][0] + wz, Number(k[3]), q[1][2]]], [[q[1][0] - wz, q[0][1], q[0][2]], [q[1][0], Number(k[4]), q[1][2]]]] : [q as Box];
    for (const x of each) { const t = toWorld(T, x); if (t[1][1] - t[0][1] > 6.5) out.push([[t[0][0], t[0][1] + e, t[0][2]], [t[1][0], t[1][1] - e, t[1][2]]]); }
  }
  return out;
};
/** SW-RPI-18 (amended): the base of a part, every solid within 1 in of its lowest point and no more than 1 in high: its plate (not the anchor rods, which go into the member by design) */
const baseOf = (key: string, T: number[]): Box[] => { const world = supportSolids(key, T); if (!world.length) return []; const lo = Math.min(...world.map(q => q[0][1])); return world.filter(q => q[0][1] <= lo + 1 && q[1][1] - q[0][1] <= 1); };
/** two boxes overlap by more than e in every direction */
const deep = (a: Box, b: Box, e = 0.02) => [0, 1, 2].every(k => Math.min(a[1][k], b[1][k]) - Math.max(a[0][k], b[0][k]) > e);
const ovBox = (a: Box, b: Box) => [0, 1, 2].every(k => a[0][k] < b[1][k] && b[0][k] < a[1][k]);
/** a support kept by SW-RPI-18: its line, its tall members and all its solids */
export interface KeptSupport { line: string; id: string; tall: Box[]; solids: Box[] }
export const keptOf = (sp: { id: string; key: string; T: unknown }, line: string): KeptSupport => ({ line, id: sp.id, tall: tallOf(sp.key, sp.T as number[]), solids: supportSolids(sp.key, sp.T as number[]) });
/** a point's distance to a box */
const boxDist = (p: V3, b: Box) => Math.hypot(Math.max(b[0][0] - p[0], 0, p[0] - b[1][0]), Math.max(b[0][1] - p[1], 0, p[1] - b[1][1]), Math.max(b[0][2] - p[2], 0, p[2] - b[1][2]));
/** an arc's point at angle th */
const arcAt = (s: Extract<OwnShape, { k: 'arc' }>, th: number): V3 => [0, 1, 2].map(i => s.O[i] + (s.u[i] * Math.cos(th) + s.v[i] * Math.sin(th)) * s.R) as V3;
/** SW-RPI-18 (amended): whether a piece's true shape (SW-RPI-22's: a pipe a flat-ended cylinder, an elbow its arc's tube, a valve its part's solids) overlaps a box
 *  by more than e. A cylinder along an axis exactly; an oblique one, and an arc, by the round swept along it short of its ends by its radius, which lies
 *  within the piece (so near its ends a piece is held a little short of its true shape, where the piece joined to it is tested as well) */
function shapeInBox(s: OwnShape, b: Box, e = 0.02): boolean {
  if (s.k === 'box') return deep([s.mn, s.mx], b, e);
  if (s.k === 'cyl') {
    const d: V3 = [s.b[0] - s.a[0], s.b[1] - s.a[1], s.b[2] - s.a[2]], L = Math.hypot(d[0], d[1], d[2]); if (L < 1e-9) return false;
    const k = [0, 1, 2].find(i => Math.abs(d[i]) / L > 0.9999);
    if (k !== undefined) {
      const lo = Math.min(s.a[k], s.b[k]), hi = Math.max(s.a[k], s.b[k]); if (Math.min(hi, b[1][k]) - Math.max(lo, b[0][k]) <= e) return false;
      const [i, j] = [0, 1, 2].filter(q => q !== k); return Math.hypot(Math.max(b[0][i] - s.a[i], 0, s.a[i] - b[1][i]), Math.max(b[0][j] - s.a[j], 0, s.a[j] - b[1][j])) < s.r - e;
    }
    const rr = Math.min(s.r, L / 2), u: V3 = [d[0] / L, d[1] / L, d[2] / L], a: V3 = [s.a[0] + u[0] * rr, s.a[1] + u[1] * rr, s.a[2] + u[2] * rr], c: V3 = [s.b[0] - u[0] * rr, s.b[1] - u[1] * rr, s.b[2] - u[2] * rr];
    return K.segBox(a, c, b[0], b[1]) < rr - e;
  }
  const d0 = Math.min(s.r / s.R, Math.PI / 4), span = Math.PI / 2 - 2 * d0, N = 45, f = (th: number) => boxDist(arcAt(s, th), b);
  let bi = 0, bv = Infinity; for (let i = 0; i <= N; i++) { const v = f(d0 + (span * i) / N); if (v < bv) { bv = v; bi = i; } }
  // refined about the nearest sample (the distance to a box along a short arc has one least value)
  let lo = d0 + (span * Math.max(0, bi - 1)) / N, hi = d0 + (span * Math.min(N, bi + 1)) / N;
  for (let it = 0; it < 40; it++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (f(m1) < f(m2)) hi = m2; else lo = m1; }
  return Math.min(bv, f((lo + hi) / 2)) < s.r - e;
}
const shapeBox = (s: OwnShape): Box => {
  if (s.k === 'box') return [s.mn, s.mx];
  if (s.k === 'cyl') return [[0, 1, 2].map(i => Math.min(s.a[i], s.b[i]) - s.r) as V3, [0, 1, 2].map(i => Math.max(s.a[i], s.b[i]) + s.r) as V3];
  const ps = Array.from({ length: 19 }, (_, i) => arcAt(s, (i * Math.PI) / 36)); return [[0, 1, 2].map(i => Math.min(...ps.map(p => p[i])) - s.r) as V3, [0, 1, 2].map(i => Math.max(...ps.map(p => p[i])) + s.r) as V3];
};
/** the pieces of the lines and of the nozzles' spools by their true shapes (SW-RPI-22's), each with its box */
function piecesOf(m: PipingModel, _vb?: (c: Comp) => Box) {
  const of = (line: string, c: Comp) => shapesOf(c).map(s => ({ line, kind: c.kind, tag: c.tag, s, box: shapeBox(s) }));
  return [...m.lines.flatMap(r => r.comps.filter(c => c.kind !== 'studs').flatMap(c => of(r.no, c))), ...(m.nozzles ?? []).flatMap(n => (n.comps ?? []).filter(c => c.kind !== 'studs').flatMap(c => of(`nozzle ${n.equip}`, c)))];
}
type Piece = ReturnType<typeof piecesOf>[number];
/** a piece overlaps the box b by more than e */
const pieceIn = (q: Piece, b: Box, e = 0.02) => ovBox(q.box, b) && shapeInBox(q.s, b, e);
/**
 * SW-RPI-18: supports that strike. On a finished model, each hanger, stanchion, trunnion and trapeze is tested by the tall members of its part (its rods,
 * post or leg), less 3 in at each of their ends, against every piece of every line (its own but for a trunnion's own elbow), every solid of the plant's
 * steel, concrete and equipment, and the tall members of every support of another line tested before it; its base plate against the plant's solids; and
 * every support, of whatever kind, by all its solids against the solids of every support tested before it. One that strikes is taken out of its line.
 * Returns what was taken out, and why.
 */
export function supportsThatStrike(m: PipingModel, plant: PlantDef, vb: (c: Comp) => Box): string[] {
  const out: string[] = [], test = strikeTest(m, plant, vb), kept: KeptSupport[] = [];
  for (const r of m.lines) {
    const keep: typeof r.supports = [];
    for (const sp of r.supports) { const why = test(sp, r.no, kept); if (why) { out.push(`${sp.id} (${sp.type}): ${why}`); continue; } keep.push(sp); }
    r.supports = keep;
  }
  return out;
}
/** SW-RPI-18's test of one support: why it strikes, or undefined. `kept`: the supports already kept, to which a clear one is added */
export function strikeTest(m: PipingModel, plant: PlantDef, vb: (c: Comp) => Box): (sp: { id: string; type: string; key: string; T: unknown }, line: string, kept?: KeptSupport[]) => string | undefined {
  const TALL = new Set(['hanger', 'stanchion', 'trunnion', 'trapeze']);
  const statics = staticObstacles(plant.building().instances, plant.interior().instances, true).obstacles.filter(o => !/keep-out/.test(o.tag));
  const pieces = piecesOf(m, vb);
  const sBox = statics.map(o => ({ o, box: (o.kind === 'box' ? [o.mn, o.mx] : [[0, 1, 2].map(k => Math.min(o.a[k], o.b[k]) - o.r), [0, 1, 2].map(k => Math.max(o.a[k], o.b[k]) + o.r)]) as Box }));
  return (sp, no, kept = []) => {
    const T = sp.T as number[], me = keptOf(sp, no);
    // SW-RPI-18 (amended): no solid of it inside a solid of a support set before it, of its own line or another
    for (const q of kept) if (q.id !== sp.id && q.solids.some(a => me.solids.some(b => deep(a, b)))) return `its part overlaps the support ${q.id}`;
    if (TALL.has(sp.type)) {
      // its base plate (a stanchion's or a trunnion's) on a solid, not inside one by more than 0.05 in
      const bases = sp.type === 'stanchion' || sp.type === 'trunnion' ? baseOf(sp.key, T) : [];
      const sunk = bases.map(base => sBox.find(q => deep(base, q.box, 0.05) && (q.o.kind === 'box' || K.segBox(q.o.a, q.o.b, base[0], base[1]) < q.o.r - 0.05))).find(Boolean);
      if (sunk) return `its base plate inside ${sunk.o.tag}`;
      // a trunnion's own elbow, which its leg is welded into: an elbow of its own line that the untrimmed leg reaches
      const legs = sp.type === 'trunnion' ? tallOf(sp.key, T, true) : [], ownElbow = (q: Piece) => sp.type === 'trunnion' && q.line === no && q.kind === 'elbow' && legs.some(l => ovBox(q.box, l));
      for (const b of me.tall) {
        // every line's pieces, its own too (SW-RPI-18 amended); its trimmed ends hold the piece it carries
        const line = pieces.find(q => !ownElbow(q) && pieceIn(q, b));
        const solid = line ? undefined : sBox.find(q => ovBox(q.box, b) && (q.o.kind === 'box' || K.segBox(q.o.a, q.o.b, b[0], b[1]) < q.o.r));
        const other = line || solid ? undefined : kept.find(q => q.line !== no && q.tall.some(t => ovBox(t, b)));
        if (line || solid || other) return `its ${sp.type === 'hanger' || sp.type === 'trapeze' ? 'rod' : sp.type === 'trunnion' ? 'leg' : 'post'} ${line ? `through ${line.line}${line.line === no ? ` (${line.tag}, ${line.kind})` : ''}` : solid ? `through ${solid.o.tag}` : `through the support of ${other!.line} in the same place`}`;
      }
    }
    kept.push(me); return undefined;
  };
}
/**
 * SW-RPI-18 (amended): the pipe frames of SW-RPI-17, each tested as a support is: its pedestals, posts and beam against every piece of every line and of
 * the nozzles' spools, every solid of the plant (not its frames: `plant` without them), every support but its own shoe, and the frames kept before it.
 * A frame that overlaps any of them by more than 0.02 in is taken out with its shoe. Returns the frames kept and what was taken out.
 */
export function framesThatStrike(m: PipingModel, plant: PlantDef, frames: FrameSpec[], vb: (c: Comp) => Box): { kept: FrameSpec[]; out: string[] } {
  const statics = staticObstacles(plant.building().instances, plant.interior().instances, true).obstacles.filter(o => !/keep-out/.test(o.tag));
  const sBox = statics.map(o => ({ o, box: (o.kind === 'box' ? [o.mn, o.mx] : [[0, 1, 2].map(k => Math.min(o.a[k], o.b[k]) - o.r), [0, 1, 2].map(k => Math.max(o.a[k], o.b[k]) + o.r)]) as Box }));
  const pieces = piecesOf(m, vb), shoeOf = (f: FrameSpec) => (s: { type: string; at: V3 | number[] }) => s.type === 'shoe' && Math.abs(s.at[0] - f.at[0]) < 0.5 && Math.abs(s.at[2] - f.at[2]) < 0.5;
  const sup = m.lines.flatMap(r => r.supports.map(sp => ({ line: r.no, sp, solids: supportSolids(sp.key, sp.T as unknown as number[]) })));
  const kept: FrameSpec[] = [], keptBoxes: Box[] = [], out: string[] = [];
  for (const f of frames) {
    const parts = framePlaced(f).map(q => ({ what: q.tags[q.tags.length - 1], box: worldBox(q.part, q.transform) })).filter((q): q is { what: string; box: Box } => !!q.box);
    const own = shoeOf(f);
    let why: string | undefined;
    for (const { what, box } of parts) {
      const li = pieces.find(q => pieceIn(q, box)); if (li) { why = `its ${what} through ${li.line} (${li.tag})`; break; }
      const so = sBox.find(q => deep(q.box, box) && (q.o.kind === 'box' || K.segBox(q.o.a, q.o.b, box[0], box[1]) < q.o.r - 0.02)); if (so) { why = `its ${what} inside ${so.o.tag}`; break; }
      const su = sup.find(q => !(q.line === f.line && own(q.sp as never)) && q.solids.some(s => deep(s, box))); if (su) { why = `its ${what} through the support ${su.sp.id}`; break; }
      if (keptBoxes.some(b => deep(b, box))) { why = `its ${what} inside another frame`; break; }
    }
    if (!why) { kept.push(f); keptBoxes.push(...parts.map(q => q.box)); continue; }
    const r = m.lines.find(q => q.no === f.line); if (r) r.supports = r.supports.filter(s => !own(s as never));
    out.push(`the pipe frame of ${f.line} at ${f.at.map(Math.round).join(', ')}: ${why}`);
  }
  return { kept, out };
}
export function valvesThatStrike(m: PipingModel, plant: PlantDef, vb?: (c: Comp) => Box): { turned: string[]; stuck: string[] } {
  const turned: string[] = [], stuck: string[] = [];
  const statics = staticObstacles(plant.building().instances, plant.interior().instances, true).obstacles.filter(o => !/keep-out/.test(o.tag));
  const xfp = (T: number[], p: V3): V3 => [T[0] * p[0] + T[4] * p[1] + T[8] * p[2] + T[12], T[1] * p[0] + T[5] * p[1] + T[9] * p[2] + T[13], T[2] * p[0] + T[6] * p[1] + T[10] * p[2] + T[14]];
  const solidsOf = (key: string, T: number[]): Box[] => solidBoxes(partFromKey(key)).map(b => { const cs: V3[] = []; for (const x of [b[0][0], b[1][0]]) for (const y of [b[0][1], b[1][1]]) for (const z of [b[0][2], b[1][2]]) cs.push(xfp(T, [x, y, z])); return [[0, 1, 2].map(k => Math.min(...cs.map(c => c[k]))), [0, 1, 2].map(k => Math.max(...cs.map(c => c[k])))] as Box; });
  const ov = (a: Box, b: Box, g = 0) => [0, 1, 2].every(k => a[0][k] - g < b[1][k] && b[0][k] - g < a[1][k]);
  // every other line's pieces by the shapes the generator's checks hold them by (a flange by its own diameter, a valve by its box); a box is held as a box
  const pieces = m.lines.flatMap(r => r.comps.filter(c => c.kind !== 'studs').flatMap(c => K.compShapes(c, vb ?? (() => [[0, 0, 0], [0, 0, 0]] as Box)).map(sh => sh.kind === 'box'
    ? { line: r.no, a: [(sh.mn[0] + sh.mx[0]) / 2, (sh.mn[1] + sh.mx[1]) / 2, (sh.mn[2] + sh.mx[2]) / 2] as V3, b: [(sh.mn[0] + sh.mx[0]) / 2, (sh.mn[1] + sh.mx[1]) / 2, (sh.mn[2] + sh.mx[2]) / 2] as V3, r: 0, box: [sh.mn, sh.mx] as Box, kind: c.kind, isBox: true }
    : { line: r.no, a: sh.a as V3, b: sh.b as V3, r: sh.r, box: [[0, 1, 2].map(k => Math.min(sh.a[k], sh.b[k]) - sh.r), [0, 1, 2].map(k => Math.max(sh.a[k], sh.b[k]) + sh.r)] as Box, kind: c.kind, isBox: false })));
  const near = (p: (typeof pieces)[number], b: Box, g: number) => ov(p.box, b, g) && (p.isBox || K.segBox(p.a, p.b, [b[0][0] - g, b[0][1] - g, b[0][2] - g], [b[1][0] + g, b[1][1] + g, b[1][2] + g]) < p.r);
  const sBox = statics.map(o => ({ o, box: (o.kind === 'box' ? [o.mn, o.mx] : [[0, 1, 2].map(k => Math.min(o.a[k], o.b[k]) - o.r), [0, 1, 2].map(k => Math.max(o.a[k], o.b[k]) + o.r)]) as Box }));
  /** what one of a valve's solids, grown by g, overlaps: a solid of the plant or a pipe or fitting of another line (held by its axis and radius) */
  const hit = (no: string, b: Box, g: number) => sBox.find(q => ov(q.box, b, g) && (q.o.kind === 'box' || K.segBox(q.o.a, q.o.b, [b[0][0] - g, b[0][1] - g, b[0][2] - g], [b[1][0] + g, b[1][1] + g, b[1][2] + g]) < q.o.r))?.o.tag
    ?? pieces.find(q => q.line !== no && near(q, b, g - 0.02))?.line;
  /** SW-RPI-19 (amended): a valve's own line's pieces that are not of its own stack: off its run's axis, and not joined end to end with a piece on it.
   *  Amended again (SW-RPI-22): an elbow is never of the stack, even joined end to end with a piece on its axis; and an elbow is held by its arc (SW-RPI-13),
   *  a 90° elbow by the tube about its arc, flat at its ends (within the box of points every 5° along its centre line), a 45° elbow by its own two legs, R tan 22.5° each */
  const ownOff = (r: (typeof m.lines)[number], c: Comp) => {
    const L = Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1], c.b[2] - c.a[2]) || 1, w = [(c.b[0] - c.a[0]) / L, (c.b[1] - c.a[1]) / L, (c.b[2] - c.a[2]) / L];
    const offAxis = (p: number[]) => { const d = [p[0] - c.a[0], p[1] - c.a[1], p[2] - c.a[2]], t = d[0] * w[0] + d[1] * w[1] + d[2] * w[2]; return Math.hypot(d[0] - w[0] * t, d[1] - w[1] * t, d[2] - w[2] * t) > 0.05; };
    const on = r.comps.filter(q => q.kind !== 'studs' && q.kind !== 'elbow' && !offAxis(q.a) && !offAxis(q.b)), ends = on.flatMap(q => [q.a, q.b]);
    const joined = (q: Comp) => q.kind !== 'elbow' && ends.some(e => [q.a, q.b].some(p => Math.hypot(p[0] - e[0], p[1] - e[1], p[2] - e[2]) < 0.05));
    const shapesOf = (q: Comp): K.Shape[] => {
      if (q.kind !== 'elbow' || !/\|45(\||$)/.test(q.key)) return K.compShapes(q, vb ?? (() => [[0, 0, 0], [0, 0, 0]] as Box));
      const OD = pipeDims(q.NPS, q.cls).OD, leg = elbowRadius(OD) * Math.tan(Math.PI / 8), corner: V3 = [q.a[0] + q.T[8] * leg, q.a[1] + q.T[9] * leg, q.a[2] + q.T[10] * leg];
      return [{ kind: 'cap', a: q.a, b: corner, r: OD / 2 }, { kind: 'cap', a: corner, b: q.b, r: OD / 2 }];
    };
    return r.comps.filter(q => q.kind !== 'studs' && !on.includes(q) && !joined(q)).flatMap((q): { box: Box; a: V3; b: V3; r: number; isBox: boolean; meets?: (mn: V3, mx: V3) => boolean }[] => {
      if (q.kind === 'elbow' && q.key.startsWith('EL|') && !/\|45(\||$)/.test(q.key)) {
        const arc = arcPoints(q), rad = pipeDims(q.NPS, q.cls).OD / 2;
        return [{ box: [[0, 1, 2].map(k => Math.min(...arc.map(p => p[k])) - rad), [0, 1, 2].map(k => Math.max(...arc.map(p => p[k])) + rad)] as Box, a: [0, 0, 0] as V3, b: [0, 0, 0] as V3, r: rad, isBox: false, meets: arcMeetsBox(q) }];
      }
      return shapesOf(q).map(sh => sh.kind === 'box' ? { box: [sh.mn, sh.mx] as Box, a: [0, 0, 0] as V3, b: [0, 0, 0] as V3, r: 0, isBox: true } : { box: [[0, 1, 2].map(k => Math.min(sh.a[k], sh.b[k]) - sh.r), [0, 1, 2].map(k => Math.max(sh.a[k], sh.b[k]) + sh.r)] as Box, a: sh.a as V3, b: sh.b as V3, r: sh.r, isBox: false });
    });
  };
  // a 90° elbow's tube about its arc against the solid grown by g, flat at the elbow's ends (SW-RPI-22's shape); any other piece by its axis and radius
  const ownHit = (own: ReturnType<typeof ownOff>, b: Box, g: number) => own.some(p => ov(p.box, b, g) && (p.isBox || (p.meets ? p.meets([b[0][0] - g, b[0][1] - g, b[0][2] - g], [b[1][0] + g, b[1][1] + g, b[1][2] + g]) : K.segBox(p.a, p.b, [b[0][0] - g, b[0][1] - g, b[0][2] - g], [b[1][0] + g, b[1][1] + g, b[1][2] + g]) < p.r)));
  for (const r of m.lines) for (const c of r.comps) {
    if (c.kind !== 'valve') continue;
    const own = ownOff(r, c);
    const T = c.T as unknown as number[], first = solidsOf(c.key, T).map(b => hit(r.no, b, 0) ?? (ownHit(own, b, -0.02) ? `its own line ${r.no}` : undefined)).find(Boolean); if (!first) continue;
    const L = Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1], c.b[2] - c.a[2]), f: V3 = [(c.b[0] - c.a[0]) / L, (c.b[1] - c.a[1]) / L, (c.b[2] - c.a[2]) / L], stem: V3 = [T[4], T[5], T[6]], at: V3 = [T[12], T[13], T[14]];
    // up, then +x, -x, +z and -z; never stem down (SW-LL-5; SW-RPI-19 as amended again)
    const dirs = ([[0, 1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]] as V3[]).filter(d => Math.abs(d[0] * f[0] + d[1] * f[1] + d[2] * f[2]) < 1e-6 && Math.hypot(d[0] - stem[0], d[1] - stem[1], d[2] - stem[2]) > 1e-6);
    // clear by 1 in of the plant's solids and by 3 in of every other line (SW-RT-3's clearance between lines, which the generator's own check holds a valve's box to)
    const d = dirs.find(q => { const Tq = frameFromAxes(at, q, f) as unknown as number[], sol = solidsOf(c.key, Tq); const vbox = vb ? [vb({ ...c, T: Tq } as unknown as Comp)] : sol; return sol.every(b => !hit(r.no, b, 1) && !ownHit(own, b, 1)) && vbox.every(b => !pieces.some(p => p.line !== r.no && near(p, b, 3))); });
    if (!d) { stuck.push(`${c.tag}: strikes ${first} and has no clear direction`); continue; }
    c.T = frameFromAxes(at, d, f) as never; turned.push(`${c.tag}: struck ${first}; stem turned to ${d.join(',')}`);
  }
  return { turned, stuck };
}

/**
 * SW-RPI-20: a hanger's top at the steel it hangs from. Each hanger's rod is made as long as brings its top plate's upper face to the underside of the lowest
 * horizontal member over it whose underside lies within 6 in of the plate. Returns the hangers changed.
 */
export function hangerTops(m: PipingModel, plant: PlantDef): string[] {
  const out: string[] = [], PLATE = 0.375;
  const members = plant.interior().instances.filter(pl => !pl.tags.some(t => /keep-out|equipment|pad|grating|ladder|guardrail|stair|bracing|column|post|pedestal|anchor|bolt|weld|clip|plate/.test(t)))
    .map(pl => worldBox(pl.part, pl.transform)).filter((b): b is Box => !!b && b[1][1] - b[0][1] <= 36 && Math.max(b[1][0] - b[0][0], b[1][2] - b[0][2]) >= 24);
  for (const r of m.lines) for (const sp of r.supports) {
    if (sp.type !== 'hanger') continue;
    const k = sp.key.split('|'), L = Number(k[3]), top = sp.at[1] + L + PLATE, x = sp.at[0], z = sp.at[2];
    const over = members.filter(b => x >= b[0][0] - 0.01 && x <= b[1][0] + 0.01 && z >= b[0][2] - 0.01 && z <= b[1][2] + 0.01 && Math.abs(b[0][1] - top) <= 6).sort((p, q) => p[0][1] - q[0][1]);
    if (!over.length) continue;
    const under = over[0][0][1], L2 = under - PLATE - sp.at[1]; if (Math.abs(L2 - L) < 0.01 || L2 < 8) continue;
    sp.key = [k[0], k[1], k[2], L2.toFixed(2), ...k.slice(4)].join('|'); out.push(`${sp.id}: rod ${L.toFixed(2)} → ${L2.toFixed(2)} in`);
  }
  return out;
}
/** SW-RPI-21: the two stud sets of the joints either side of a wafer valve made one set through both flanges. Returns the valves corrected. */
export function waferStuds(m: PipingModel): string[] {
  const out: string[] = [], d3 = (p: V3, q: V3) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  for (const r of m.lines) for (const v of r.comps.filter(c => c.kind === 'valve' && /^VLV\|BFLY\|/.test(c.key))) {
    const L = d3(v.a as V3, v.b as V3); if (L < 1e-6) continue;
    const w: V3 = [(v.b[0] - v.a[0]) / L, (v.b[1] - v.a[1]) / L, (v.b[2] - v.a[2]) / L], mid: V3 = [(v.a[0] + v.b[0]) / 2, (v.a[1] + v.b[1]) / 2, (v.a[2] + v.b[2]) / 2];
    const along = (p: V3) => (p[0] - mid[0]) * w[0] + (p[1] - mid[1]) * w[1] + (p[2] - mid[2]) * w[2], off = (p: V3) => { const t = along(p); return d3(p, [mid[0] + w[0] * t, mid[1] + w[1] * t, mid[2] + w[2] * t]); };
    const sets = r.comps.filter(c => c.kind === 'studs' && c.NPS === v.NPS && off(c.T.slice(12, 15) as unknown as V3) < 0.05 && Math.abs(along(c.T.slice(12, 15) as unknown as V3)) < L / 2 + 3);
    if (sets.length !== 2) continue;
    const ext = sets.flatMap(c => { const at = c.T.slice(12, 15) as unknown as V3, st = Number(c.key.split('|')[3]); return [along(at) - st / 2, along(at) + st / 2]; });
    const lo = Math.min(...ext), hi = Math.max(...ext), stack = hi - lo, c0 = (lo + hi) / 2, at: V3 = [mid[0] + w[0] * c0, mid[1] + w[1] * c0, mid[2] + w[2] * c0];
    const f = designFlange(v.NPS, v.cls as PipeClass), len = f.studLen + Math.max(0, stack - (2 * (f.tf + f.rfH) + f.gasketT));
    const [keep, drop] = sets, T = keep.T.slice() as number[]; T[12] = at[0]; T[13] = at[1]; T[14] = at[2];
    Object.assign(keep, { key: `STUDS|${v.NPS}|${v.cls}|${stack.toFixed(3)}`, T, a: [at[0] - w[0] * len / 2, at[1] - w[1] * len / 2, at[2] - w[2] * len / 2], b: [at[0] + w[0] * len / 2, at[1] + w[1] * len / 2, at[2] + w[2] * len / 2] });
    r.comps = r.comps.filter(c => c !== drop); out.push(`${v.tag}: one stud set of ${stack.toFixed(3)} in through both flanges`);
  }
  return out;
}

/** SW-RPI-18 (amended): a plant with the pipe frames a model already has (from its report) among its solids, for the tests and for SW-RPI-17 */
export function withFrames(plant: PlantDef, frames: FrameSpec[]): PlantDef {
  if (!frames.length) return plant;
  const placed = frames.flatMap(f => framePlaced(f));
  return { ...plant, interior: () => { const i = plant.interior(); return { ...i, instances: [...i.instances, ...placed] }; } };
}
