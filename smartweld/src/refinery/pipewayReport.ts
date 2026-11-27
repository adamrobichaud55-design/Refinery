/**
 * Plant 3: the main pipeway piped (DESIGN_BASIS.md §80). Runs the generator of plants 1 and 2 on the pipeway as it is run
 * on a unit (SW-RPI-7, SW-PWY-6), takes out the valves that are not built (SW-PWY-7), runs that generator's own checks
 * (§40) on the result against the steel as it stands, and writes what is found: nothing is hidden.
 */
import { staticObstacles, partFromKey, worldBox, type PipingModel, type LineRun, type Obstacle } from '../generator/piping';
import { squareWelds } from './welds';
import * as K from '../generator/pipingCheck';
import type { V3 } from '../generator/router';
import { generateUnit, unitChecks, valveBoxFn, spanNote, type UnitChecks, type RunCache } from './pipingReport';
import { supportsThatStrike, supportsAlongSpans, valvesThatStrike, hangerTops, waferStuds, type FrameSpec } from './supports';
import type { UnitPiping } from './unitPiping';
import { pipeway, PWY, type Pipeway, type LimitSpool, type Junction, type StreamPlan, type PipewayLine, type HeaderPlan, type TierLoad } from './pipeway';
import { FLUIDS } from './fluids';
import { RACK } from './cell';
import { pipeDims, type PipeClass } from '../catalogue';
import { frameFromAxes } from '../geometry/transform';

export interface PipewayLineRec { no: string; origin: PipewayLine['origin']; stream: string; fluid: string; fluidName: string; from: string; to: string; NPS: number; cls: string; designP: number; designT: number; routed: boolean; components: number; welds: number; supports: number; lengthFt: number; /** the main tier it runs on, 1 the lowest */ tier?: number; /** the lane it runs in, z in the pipeway's frame */ lane?: number }
export interface PipedPipeway {
  demonstration: true; area: number; name: string; frame: string; rack: { lengthFt: number; widthFt: number; tiersFt: number[]; bays: number }; runs: number; tiers: number[]; tierRoom: number; seconds: number;
  stats: Record<string, number>; failures: string[]; checks: UnitChecks; limits: LimitSpool[]; junctions: Junction[]; streams: StreamPlan[]; /** SW-PWY-11, SW-PWY-13 */ headers: HeaderPlan[]; loads: TierLoad[]; skipped: Pipeway['skipped']; lines: PipewayLineRec[];
  counts: { components: Record<string, number>; welds: Record<string, number>; supports: Record<string, number> }; notes: string[]; /** SW-RPI-17: pipe frames of plant 3's own */ frames?: FrameSpec[];
}
const pathLen = (r: LineRun) => r.path.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - r.path[i - 1][0], p[1] - r.path[i - 1][1], p[2] - r.path[i - 1][2]) : 0), 0);
/** the lane a line runs in on a tier of the main rack: where its longest stretch along the rack at that tier's elevation lies, if that is 8 ft or more */
export function mainLaneOf(r: LineRun, tier: number): number | undefined {
  let best = 96 - 1e-6, z: number | undefined;
  for (let i = 1; i < r.path.length; i++) { const a = r.path[i - 1], b = r.path[i], L = Math.abs(a[0] - b[0]); if (Math.abs(a[1] - b[1]) < 1e-6 && Math.abs(a[2] - b[2]) < 1e-6 && L > best && a[1] > PWY.tiers[tier] && a[1] < PWY.tiers[tier] + 24) { best = L; z = a[2]; } }
  return z;
}
/** the pipeway as the generator's runner and checks take a unit (SW-PWY-6): its runs, its lines, its steel as it stands */
export const asUnit = (pw: Pipeway): UnitPiping => ({ unit: PWY.area, runs: pw.runs, runPlant: pw.runPlant, lines: pw.lines, cell: { interior: pw.interior }, plant: pw.plant, foreseen: pw.foreseen } as unknown as UnitPiping);

/**
 * SW-PWY-8: the tier beams of each unit's first bent are not shown to the generator while it routes, so it sets no support on them. They are steel all the same: where a
 * line of the pipeway passes over one on its way to its spool, at the height a line of that tier lies at, a shoe is set on it here, as the generator sets one on a rack beam
 * (SW-PS-*). Returns how many were set.
 */
export function shoesAtFirstBents(m: PipingModel, pw: Pick<Pipeway, 'units'>): number {
  let n = 0;
  for (const U of pw.units) {   // a unit not yet piped has its rack too, and its limit spools stand in its valve bay
    const zb = U.side * (360 + RACK.start - RACK.bent);
    for (const r of m.lines) for (const c of r.comps) {
      if (c.kind !== 'pipe' || Math.abs(c.a[0] - c.b[0]) > 1e-6 || Math.abs(c.a[1] - c.b[1]) > 1e-6 || Math.abs(c.a[0] - U.x) > U.half || (c.a[2] - zb) * (c.b[2] - zb) > 0 || Math.min(Math.abs(c.a[2] - zb), Math.abs(c.b[2] - zb)) < 6) continue;
      const rad = pipeDims(c.NPS, c.cls as PipeClass).OD / 2, tier = RACK.tiers.find(t => c.a[1] - rad - t >= 4 - 1e-6 && c.a[1] - rad - t < 10); if (tier === undefined || r.supports.some(sp => Math.abs(sp.at[2] - zb) < 1 && Math.abs(sp.at[0] - c.a[0]) < 1)) continue;
      const ids = new Set(r.supports.map(sp => sp.id)); let k = r.supports.length + 1; while (ids.has(`${r.no}/S${k}`)) k++;
      r.supports.push({ id: `${r.no}/S${k}`, line: r.no, type: 'shoe', at: [c.a[0], tier, zb], key: `SHOE|${c.NPS}|${c.cls}|shoe|${(c.a[1] - rad - tier).toFixed(3)}`, T: frameFromAxes([c.a[0], c.a[1] - rad, zb], [0, 1, 0], [0, 0, 1]) } as PipingModel['lines'][number]['supports'][number]); n++;
    }
  }
  return n;
}
/** SW-PS-9: what a rod does not hang from, as the generator has it; SW-PS-7: what a line spans */
const HANG_FROM = (tag: string) => !/equipment|pad|grout|ladder|guardrail|cage|rail|tread|stair|grating|cladding|door|slab|base-plate|anchor|weld|bolt|clip|column/.test(tag);
const spanOf = (OD: number) => (OD >= 3.5 ? 240 : OD >= 2.375 ? 180 : 120);
/**
 * SW-PWY-8: the supports the generator does not set because it is not shown the units' first bents. A shoe on the first bent's beam (`shoesAtFirstBents`); a post on its
 * top-tier beam under a line that passes higher than a shoe stands; and, on a run that crosses a first bent, the generator's stepping done again between the supports
 * the run has: a hanger at a member crossing over the run wherever a stretch is longer than the line spans, by the generator's own conditions (SW-PS-9). Returns how
 * many of each were set and, for the posts and hangers, on which lines.
 */
export function supportsAtFirstBents(m: PipingModel, pw: Pick<Pipeway, 'units' | 'interior'> & { plant?: Pipeway['plant'] }): { shoes: number; posts: number; hangers: number; where: string[] } {
  const shoes = shoesAtFirstBents(m, pw), vb = valveBoxFn(), topT = RACK.tiers[RACK.tiers.length - 1], where = new Map<string, { posts: number; hangers: number }>();
  type Member = Extract<Obstacle, { kind: 'cap' }>;
  const statics = staticObstacles([], pw.interior.instances, true).obstacles;
  const members = statics.filter((o): o is Member => { if (o.kind !== 'cap' || !HANG_FROM(o.tag)) return false; const d = [o.b[0] - o.a[0], o.b[1] - o.a[1], o.b[2] - o.a[2]], L = Math.hypot(d[0], d[1], d[2]); return L > 1e-6 && Math.abs(d[1]) / L <= 0.5; });
  const boxOf = (s: K.Shape): [V3, V3] => (s.kind === 'box' ? [s.mn, s.mx] : [[0, 1, 2].map(k => Math.min(s.a[k], s.b[k]) - s.r) as V3, [0, 1, 2].map(k => Math.max(s.a[k], s.b[k]) + s.r) as V3]);
  const items = m.lines.flatMap(r => r.comps.flatMap(c => K.compShapes(c, vb).map(s => ({ line: r.no, s, box: boxOf(s) }))));
  /** a solid standing in the box b is 1 in clear of every other line */
  // and of each unit's cooling water spool and the room in front of it, where the mains' branch will stand (SW-PWY-8 as amended 2026-11-26)
  const cwRooms = (pw.plant?.interior().instances ?? []).filter(pl => pl.tags.some(t => t === 'cooling water spool')).flatMap(pl => { const b = worldBox(pl.part, pl.transform); return b ? [b as [V3, V3]] : []; });
  const boxClear = (no: string, b: [V3, V3]) => cwRooms.every(q => K.boxGap(b, q) >= 1) && items.every(q => q.line === no || K.boxGap(b, q.box) >= 1 || (q.s.kind !== 'box' && K.gap(q.s, { kind: 'box', mn: b[0], mx: b[1] }) >= 1));
  /** a rod's way up, from y0 to y1 over (x, z), is 1 in clear of every other line and passes through no solid of the steel */
  const rodClear = (no: string, x: number, z: number, y0: number, y1: number) => {
    if (y1 <= y0) return true; const rod: K.Shape = { kind: 'cap', a: [x, y0, z], b: [x, y1, z], r: 0.25 };
    if (!items.every(q => q.line === no || q.box[0][0] > x + 1.25 || q.box[1][0] < x - 1.25 || q.box[0][2] > z + 1.25 || q.box[1][2] < z - 1.25 || q.box[0][1] > y1 + 1.25 || q.box[1][1] < y0 - 1.25 || K.gap(q.s, rod) >= 1)) return false;
    return !statics.some(o => o.kind === 'box' && x > o.mn[0] - 0.25 && x < o.mx[0] + 0.25 && z > o.mn[2] - 0.25 && z < o.mx[2] + 0.25 && o.mn[1] < y1 && o.mx[1] > y0);
  };
  const push = (r: LineRun, type: 'stanchion' | 'hanger', at: V3, key: string, T: number[]) => {
    const ids = new Set(r.supports.map(sp => sp.id)); let k = r.supports.length + 1; while (ids.has(`${r.no}/S${k}`)) k++;
    r.supports.push({ id: `${r.no}/S${k}`, line: r.no, type, at, key, T } as LineRun['supports'][number]);
    const w = where.get(r.no) ?? { posts: 0, hangers: 0 }; if (type === 'hanger') w.hangers++; else w.posts++; where.set(r.no, w);
  };
  for (const U of pw.units) {
    const zb = U.side * (360 + RACK.start - RACK.bent);
    for (const r of m.lines) {
      if (r.kind === 'stub' || !r.ok) continue;
      // straight runs, as the generator's check takes them: pipe and in-line tees end to end
      const runs: { a: V3; b: V3; NPS: number; cls: PipeClass }[] = [];
      for (const c of r.comps) { if (c.kind !== 'pipe' && c.kind !== 'tee') continue; const last = runs[runs.length - 1], L = Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1], c.b[2] - c.a[2]), w = [0, 1, 2].map(k => (c.b[k] - c.a[k]) / L);
        if (last) { const Ll = Math.hypot(last.b[0] - last.a[0], last.b[1] - last.a[1], last.b[2] - last.a[2]), wl = [0, 1, 2].map(k => (last.b[k] - last.a[k]) / Ll); if (Math.hypot(last.b[0] - c.a[0], last.b[1] - c.a[1], last.b[2] - c.a[2]) < 0.1 && Math.abs(w[0] * wl[0] + w[1] * wl[1] + w[2] * wl[2] - 1) < 1e-6) { last.b = c.b; continue; } }
        runs.push({ a: c.a, b: c.b, NPS: c.NPS, cls: c.cls as PipeClass }); }
      const fittings = r.comps.filter(c => c.kind !== 'pipe' && c.kind !== 'studs');
      const toSeg = (p: V3, a: V3, b: V3) => { const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2], t = L2 < 1e-12 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1] + (p[2] - a[2]) * d[2]) / L2)); return Math.hypot(p[0] - a[0] - d[0] * t, p[1] - a[1] - d[1] * t, p[2] - a[2] - d[2] * t); };
      const clearOf = (p: V3) => fittings.every(f => toSeg(p, f.a, f.b) > 5) && r.welds.every(w => Math.hypot(w.at[0] - p[0], w.at[1] - p[1], w.at[2] - p[2]) > 5);
      for (const sr of runs) {
        const x = sr.a[0], y = sr.a[1];
        if (Math.abs(sr.b[0] - x) > 1e-6 || Math.abs(sr.b[1] - y) > 1e-6 || Math.abs(x - U.x) > U.half || (sr.a[2] - zb) * (sr.b[2] - zb) > 0 || Math.min(Math.abs(sr.a[2] - zb), Math.abs(sr.b[2] - zb)) < 6) continue;
        const rad = pipeDims(sr.NPS, sr.cls).OD / 2, span = spanOf(2 * rad), s = Math.sign(sr.b[2] - sr.a[2]), L = Math.abs(sr.b[2] - sr.a[2]), at = (t: number): V3 => [x, y, sr.a[2] + s * t];
        // a post on the first bent's top-tier beam, as the generator stands one on a top-tier beam of a rack (SW-PS-9)
        const h = y - rad - topT;
        if (h >= 10 - 1e-6 && h <= 48 + 1e-6 && !r.supports.some(sp => Math.abs(sp.at[2] - zb) < 1 && Math.abs(sp.at[0] - x) < 1) && clearOf([x, y, zb])) {
          const key = `STAN|${sr.NPS}|${sr.cls}|${h.toFixed(2)}`, T = frameFromAxes([x, topT, zb], [0, 1, 0], [0, 0, s]), b = worldBox(partFromKey(key), T)!;
          if (boxClear(r.no, b)) push(r, 'stanchion', [x, y, zb], key, T);
        }
        // members that cross over the run, with how far along it and how far either side of their line a rod may hang (as the generator takes it)
        const cross = members.flatMap(o => { const dx = o.b[0] - o.a[0], dz = o.b[2] - o.a[2]; if (Math.abs(dx) < 1e-9) return []; const u = (x - o.a[0]) / dx, z = o.a[2] + dz * u, t = (z - sr.a[2]) * s; return u >= 0 && u <= 1 && t > 0 && t < L ? [{ t, reach: o.r * 0.6 }] : []; });
        /** the lowest steel a rod can hang from over p, with its way up clear (the generator's `steelAboveExact`) */
        const steelOver = (p: V3): number | undefined => {
          let best = Infinity;
          for (const o of members) { const dx = o.b[0] - o.a[0], dz = o.b[2] - o.a[2], u = Math.max(0, Math.min(1, ((p[0] - o.a[0]) * dx + (p[2] - o.a[2]) * dz) / (dx * dx + dz * dz || 1))), q = [o.a[0] + dx * u, o.a[1] + (o.b[1] - o.a[1]) * u, o.a[2] + dz * u];
            if (Math.hypot(q[0] - p[0], q[2] - p[2]) > o.r * 0.6) continue; const bottom = q[1] - o.r * 0.7; if (bottom > p[1] + rad + 6 && bottom < best) best = bottom; }
          return isFinite(best) && best - p[1] <= 240 && rodClear(r.no, p[0], p[2], p[1] + rad + 3, best - 6) ? best : undefined;
        };
        /** the generator's stepping (SW-PS-7) along the stretch from one support to the next, in the direction given; false where a step finds nothing */
        const step = (lo: number, hi: number, dir: 1 | -1): boolean => {
          let prev = dir > 0 ? lo : hi; const end = dir > 0 ? hi : lo;
          while (Math.abs(end - prev) > span + 1e-6) {
            const rem = Math.abs(end - prev), target = prev + (dir * rem) / Math.ceil(rem / span), within = (t: number) => (t - prev) * dir > 12 && (t - prev) * dir <= span + 1e-6 && (end - t) * dir > 6;
            let placed: number | undefined;
            for (const c of cross.filter(q => within(q.t)).sort((p, q) => Math.abs(p.t - target) - Math.abs(q.t - target))) {
              for (let d = 0; d <= c.reach + 1e-6 && placed === undefined; d += 0.5) for (const off of d ? [d, -d] : [0]) {
                const t = c.t + off, p = at(t); if (!within(t) || !clearOf(p)) continue; const top = steelOver(p); if (top === undefined) continue;
                push(r, 'hanger', p, `HANG|${sr.NPS}|${sr.cls}|${(top - y).toFixed(2)}`, frameFromAxes(p, [0, 1, 0], [0, 0, s])); placed = t; break;
              }
              if (placed !== undefined) break;
            }
            if (placed === undefined) return false; prev = placed;
          }
          return true;
        };
        for (const dir of [1, -1] as const) {
          const on = r.supports.filter(sp => Math.abs(sp.at[0] - x) < 1).map(sp => (sp.at[2] - sr.a[2]) * s).filter(t => t > -1 && t < L + 1).sort((p, q) => p - q), pts = [0, ...on, L];
          for (let i = 1; i < pts.length; i++) if (pts[i] - pts[i - 1] > span + 1e-6) step(pts[i - 1], pts[i], dir);
        }
      }
    }
  }
  const posts = [...where.values()].reduce((n, w) => n + w.posts, 0), hangers = [...where.values()].reduce((n, w) => n + w.hangers, 0);
  return { shoes, posts, hangers, where: [...where].map(([no, w]) => `${no} ${[w.posts ? `${w.posts} ${w.posts === 1 ? 'post' : 'posts'}` : '', w.hangers ? `${w.hangers} ${w.hangers === 1 ? 'hanger' : 'hangers'}` : ''].filter(Boolean).join(' and ')}`) };
}
/** SW-PWY-6, SW-PWY-7: pipe the main pipeway */
export function pipePipeway(log: (s: string) => void = () => {}, watch?: (plant: UnitPiping['plant']) => void, cache?: RunCache): { pw: Pipeway; model: PipingModel; result: PipedPipeway } {
  const t0 = Date.now(), pw = pipeway(), up = asUnit(pw), notes: string[] = [];
  const model = generateUnit(up, log, watch, notes, cache);
  const set = supportsAtFirstBents(model, pw), frames: FrameSpec[] = [];
  // SW-RPI-18 and SW-RPI-17, as for a unit: supports whose rod, post or leg strikes are taken out, and supports set where a span is then too long
  { const vt = valvesThatStrike(model, pw.plant, valveBoxFn()); if (vt.turned.length || vt.stuck.length) notes.push(`${vt.turned.length} valves turned where their stem or handwheel struck (SW-RPI-19)${vt.turned.length ? `: ${vt.turned.join('; ')}` : ''}${vt.stuck.length ? `; ${vt.stuck.length} with no clear direction, left: ${vt.stuck.join('; ')}` : ''}`); }
  { const sw = squareWelds(model); if (sw.length) notes.push(`${sw.length} butt welds set square to their joints (SW-RPI-24)`); }
  { const vbx = valveBoxFn(), struck = supportsThatStrike(model, pw.plant, vbx); if (struck.length) { notes.push(`${struck.length} supports taken out where their rod, post or leg struck another line, steel or another support (SW-RPI-18): ${struck.join('; ')}`); log(`unit ${PWY.area}: ${struck.length} supports that strike taken out (SW-RPI-18)`); }
    const sup = supportsAlongSpans(model, pw.plant, vbx), n = sup.hangers + sup.stanchions + sup.posts + sup.onSteel + sup.frames.length; if (n) { notes.push(spanNote(sup)); log(`unit ${PWY.area}: ${spanNote(sup)}`); } frames.push(...sup.frames); }
  { const ht = hangerTops(model, pw.plant), ws = waferStuds(model); if (ht.length) notes.push(`${ht.length} hangers' rods made to reach the underside of the steel they hang from (SW-RPI-20)`); if (ws.length) notes.push(`${ws.length} wafer valves bolted with one stud set through both flanges (SW-RPI-21)`); }
  if (set.shoes) notes.push(`${set.shoes} shoes set on the tier beams of the units' first bents, where the pipeway's lines pass over them to their spools: those beams are not shown to the generator while it routes (SW-PWY-8).`);
  if (set.posts || set.hangers) notes.push(`${set.posts} ${set.posts === 1 ? 'post' : 'posts'} set on the top-tier beams of first bents under lines that pass higher than a shoe stands, and ${set.hangers} hangers set where the generator's stepping along a run had stopped for want of that steel: ${set.where.join('; ')} (SW-PWY-8).`);
  if (set.shoes || set.posts || set.hangers) log(`unit ${PWY.area}: ${set.shoes} shoes, ${set.posts} posts and ${set.hangers} hangers at and from the units' first bents (SW-PWY-8)`);
  // a unit's spool is the unit's own and stands in its model: the pipeway keeps the limit spools it sets itself
  const own = new Set(pw.limits.map(l => l.tag)); model.nozzles = model.nozzles.filter(n => own.has(n.equip));
  const astray = pw.foreseen.flatMap(L => { const r = L.no === undefined ? undefined : model.lines.find(l => l.no === L.no), z = r && r.ok ? mainLaneOf(r, L.t) : undefined; return z !== undefined && Math.abs(z - L.z) > 1e-6 ? [`${L.no}: given the lane at z ${L.z} on tier ${L.t + 1}, routed at z ${z}`] : []; });
  const moved = pw.headers.flatMap(h => { const r = model.lines.find(l => l.no === h.line), z = r?.path[0]?.[2]; return r && z !== undefined && Math.abs(z - h.z) > 1e-6 ? [`${h.line}: foreseen in the lane at z ${h.z}, laid at z ${z}`] : []; });
  const aside: string[] = [], checks = unitChecks(model, up, aside), count = (xs: string[]) => { const o: Record<string, number> = {}; for (const x of xs) o[x] = (o[x] ?? 0) + 1; return Object.fromEntries(Object.entries(o).sort()); };
  const lines: PipewayLineRec[] = pw.lines.map(l => {
    const r = model.lines.find(q => q.no === l.def.no)!, hz = pw.headers.find(q => q.line === l.def.no)?.z, L = hz !== undefined ? { z: hz } : pw.foreseen.find(q => q.no === l.def.no);
    return { no: l.def.no, origin: l.origin, stream: l.stream, fluid: l.fluid, fluidName: FLUIDS[l.fluid].name, from: r.from, to: r.to, NPS: l.def.NPS, cls: l.def.cls, designP: l.designP, designT: l.designT, routed: r.ok, components: r.comps.filter(c => c.kind !== 'studs').length, welds: r.welds.length, supports: r.supports.length, lengthFt: Math.round(pathLen(r) / 12), ...(l.tier !== undefined ? { tier: l.tier + 1 } : {}), ...(L ? { lane: L.z } : {}) };
  });
  const result: PipedPipeway = {
    demonstration: true, area: PWY.area, name: 'Main pipeway', frame: 'the pipeway\'s own (SW-PWY-1): inches, x east along the rack from its west end, y up from the bench, z south from its centre line',
    rack: { lengthFt: (PWY.bays * PWY.bent) / 12, widthFt: (2 * PWY.half) / 12, tiersFt: PWY.tiers.map(t => t / 12), bays: PWY.bays }, runs: pw.runs.length, tiers: pw.tiers.map(t => t + 1), tierRoom: pw.tierRoom, seconds: Math.round((Date.now() - t0) / 1000),
    stats: Object.fromEntries(Object.entries(model.stats).filter(([k]) => !k.startsWith('t_'))), failures: model.failures, checks, limits: pw.limits, junctions: pw.junctions, streams: pw.streams, headers: pw.headers, loads: pw.loads, skipped: pw.skipped, lines,
    counts: { components: count(model.lines.flatMap(r => r.comps.filter(c => c.kind !== 'studs').map(c => c.kind))), welds: count(model.lines.flatMap(r => r.welds.map(w => `${w.type}${w.field ? ', field' : ', shop'}`))), supports: count(model.lines.flatMap(r => r.supports.map(s => s.type))) },
    notes: [...pw.notes, ...astray, ...moved, ...notes, ...aside], frames,
  };
  return { pw, model, result };
}

// ───────────────────────── the document ─────────────────────────
const table = (head: string[], rows: (string | number)[][]) => [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n');
const fmt = (n: number) => n.toLocaleString('en-US');
export const PIPEWAY_IMAGES: Record<string, string> = {
  'pipeway-from-the-south-west': 'Plant 3, the main pipeway piped, from the south-west: the rack between the two rows of units, a line for every stream between them, coloured by line class',
  'pipeway-a-junction': 'Plant 3, the main pipeway: where a unit\'s lines cross to the rack, hung from the junction frame at the unit\'s limit and from the rack\'s struts and stringers',
  'pipeway-east-limit-bay': 'Plant 3, the main pipeway: the east limit bay, a spool on each line with the block valve and blind that stand until the tank farms are piped',
  'pipeway-along-the-rack': 'Plant 3, the main pipeway from above its west end, looking east along the rack',
  'pipeway-utility-headers': 'Plant 3, the main pipeway: the utility headers on the top tier, and their branches rising from the top of each, crossing to the edge of the band and coming down to cross out under the tier to a unit\'s valve bay',
};
export function pipewayDocument(r: PipedPipeway): string {
  const does = (party: string, sends: boolean) => `${party} ${sends ? 'send' : 'receive'}${/s$/.test(party) ? '' : 's'}`;   // "the fire water tanks receive"
  const out: string[] = [], dirOf = (p: StreamPlan['parties'][number]) => `${does(p.party, p.sends)}${p.role === 'branch' ? ` (a ${p.NPS} in branch)` : ''}`;
  out.push('# Plant 3: the main pipeway', '');
  out.push('> **Demonstration data.** Written by `tools/refinery-pipeway.ts`; do not edit by hand.', '');
  out.push(`The main pipeway joins the units (DESIGN_BASIS.md §80): a rack ${r.rack.lengthFt} ft long and ${r.rack.widthFt} ft wide down the corridor between the two rows, tiers at ${r.rack.tiersFt.join(', ')} ft, and on it a line for every stream between units that has a party on the process bench, from one unit's battery-limit spool to the other's, and on its top tier the plant's utility headers with a branch to each unit. It is piped in its own frame by the generator of plants 1 and 2, unchanged, as each unit is: what the generator is given is the rack, the units' spools as connections, a line list drawn from the process model's streams, and where lines may travel. Its own checks (§40) are then run on the result against the steel as it stands, and reported here as they come out.`, '');
  out.push(table(['Lines', 'Routed', 'Components', 'Welds', 'Supports', 'Pipe, ft', 'Failures', 'Checks not at zero'], [[r.lines.length, r.lines.filter(l => l.routed).length, fmt(Object.values(r.counts.components).reduce((a, b) => a + b, 0)), fmt(Object.values(r.counts.welds).reduce((a, b) => a + b, 0)), fmt(Object.values(r.counts.supports).reduce((a, b) => a + b, 0)), fmt(r.lines.reduce((a, l) => a + l.lengthFt, 0)), r.failures.length, Object.entries(r.checks).filter(([, v]) => v.length).map(([k, v]) => `${k} ${v.length}`).join(', ') || 'none']]), '');
  out.push(`${r.lines.length} lines: ${r.lines.filter(l => l.origin === 'main').length} streams' lines; ${r.lines.filter(l => l.origin === 'branch' && !r.headers.some(h => h.key === l.stream)).length} branches to the further parties of streams that have more than two; ${r.lines.filter(l => l.origin === 'header').length} utility headers and the ${r.lines.filter(l => l.origin === 'branch' && r.headers.some(h => h.key === l.stream)).length} branches from them to their parties (SW-PWY-11, SW-PWY-12); and ${r.lines.filter(l => l.origin === 'limit').length} valves with their blinds beyond the limit spools (SW-PWY-4). The lines that run the rack are on ${r.tiers.length} of its tiers (${r.tiers.map(t => `tier ${t} ${r.lines.filter(l => l.tier === t).length} lines`).join(', ')}), each in a lane given it beforehand, no tier loaded beyond ${r.tierRoom} in of lanes at any section; the middle of the top tier is the utility headers'. The generator was run ${r.runs} times: once for each stream's line that runs the rack, with its branches, and once for the rest, the headers and their branches among it.`, '');
  out.push(table(['Component', 'Count'], Object.entries(r.counts.components)), '');
  out.push(table(['Welds', 'Count'], Object.entries(r.counts.welds)), '', table(['Supports', 'Count'], Object.entries(r.counts.supports)), '');
  out.push('## Checks', '');
  out.push(table(['Check (the generator\'s own, §40)', 'Found'], [['every line continuous from end to end', r.checks.continuity.length], ['every joint a joint of its class', r.checks.joints.length], ['elbows and the straights between them', r.checks.elbows.length], ['valves by class and size', r.checks.valves.length], ['3 in between lines', r.checks.lineClearance.length], ['3 in from steel and equipment', r.checks.staticClearance.length], ['pieces of one line clear of each other (SW-RPI-22)', r.checks.ownClearance?.length ?? 'not measured'], ['spans within SW-PS-7, a support at every rack beam crossed', r.checks.supports.length]]), '');
  if (r.failures.length) out.push('Reported by the generator:', '', ...r.failures.map(f => `- ${f}`), '');
  for (const [k, v] of Object.entries(r.checks) as [string, string[]][]) if (v.length) out.push(`Not at zero, ${k}:`, '', ...v.map(s => `- ${s}`), '');
  out.push('## Streams', '', 'Each stream\'s line, and who is on it (SW-PWY-3). A stream with more than two parties runs between the two furthest apart along the rack; the others join by branches.', '');
  out.push(table(['Stream', 'Line', 'Design', 'Tier', 'Lane, z in', 'Parties', 'Branches'], r.streams.map(s => { const l = r.lines.find(q => q.no === s.main)!; return [s.stream, s.main, `${s.designP} psi, ${s.designT} °F`, l.tier ?? 'direct', l.lane ?? '—', s.parties.map(dirOf).join('; '), s.branches.join(', ') || '—']; })), '');
  if (r.headers.length) {
    out.push('## Utility headers', '', `On the top tier, each from a cap just inside the west limit bay to one just inside the east (SW-PWY-11). A header is of the conditions of its whole system and of the size of unit 19's line, or larger where a stretch of it carries more or a unit's header that joins it is larger (SW-PRC-19). Each party joins by a branch from the top of the header, with its block valve at its own limit (SW-PWY-12).`, '');
    out.push(table(['Header', 'Line', 'Design', 'Lane, z in', 'Unit 19\'s line, in', 'Largest stretch, lb/h (size for it)', 'Largest unit header, in', 'Made, lb/h', 'Used, lb/h', 'Parties'],
      r.headers.map(h => [h.key, h.line, `${h.designP} psi, ${h.designT} °F`, h.z, h.sizedBy.line, `${fmt(Math.round(h.sizedBy.stretch))} (${h.sizedBy.stretchNPS} in)`, h.sizedBy.joined, fmt(Math.round(h.made)), fmt(Math.round(h.used)), h.parties.map(q => `${q.party} ${q.sends ? 'sends' : 'takes'}, ${q.NPS} in${q.spool < q.NPS ? ` reduced to ${q.spool} in at its spool` : ''} (${q.branch.split('-').pop()})`).join('; ')])), '');
    const ls = r.headers.find(h => h.fluid === 'LS');
    out.push(`Not modelled (SW-PRC-19): ${ls && ls.made > ls.used ? `more low-pressure steam is made than used in this balance, by ${fmt(Math.round(ls.made - ls.used))} lb/h with unit 19's let-down shut, and what a plant does with the rest is not drawn; ` : ''}the steam that flashes from condensate let down to its header is not sized for; and the growth of a hot header along ${r.rack.lengthFt} ft of rack would be taken up in expansion loops, which this model does not draw.`, '');
  }
  out.push('## Tier loads', '', 'What lies along each tier in its heaviest bay, pipe and what it holds (a liquid or two-phase line full of its liquid, a steam or gas line empty; insulation and the branches that cross are not weighed), against the 40 psf a tier is built for (SW-PWY-13).', '');
  out.push(table(['Tier', 'Lines along it', 'Heaviest bay', 'lb a foot of rack there', 'Built for, lb a foot'], r.loads.map(q => [q.tier, q.lines, q.bay, fmt(q.most), fmt(q.limit)])), '');
  out.push('## Limit spools', '', 'Where a party is not yet piped the line ends at a spool of the pipeway\'s own, with the party\'s block valve and a blind beyond it (SW-PWY-4).', '');
  out.push(table(['Spool', 'Stands in', 'At (x, y, z), in', 'Size, class', 'Party', 'Stream', 'Line', 'Valve and blind'], r.limits.map(l => [l.tag, l.where, l.at.join(', '), `${l.NPS} in, ${l.cls}`, does(l.party, l.sends), l.stream, l.line, l.stub])), '');
  out.push('## Junction frames', '', 'At each unit\'s limit: two posts in line with the columns of the unit\'s rack and a beam between them under each main tier, from which the lines that cross to the rack hang (SW-PWY-9).', '');
  out.push(table(['Unit', 'Along the rack, x in', 'Side', 'Span, ft', 'Beams under main tiers', 'Beam', 'Posts'], r.junctions.map(j => [j.unit, j.x, j.z > 0 ? 'south' : 'north', (2 * j.half) / 12, j.tiers.map(t => t + 1).join(', '), j.beam, j.post])), '');
  out.push('## Not on the main pipeway', '', table(['Stream', 'Why'], r.skipped.map(s => [s.stream, s.why])), '');
  if (r.notes.length) out.push('## Notes', '', ...r.notes.map(n => `- ${n}`), '');
  out.push('## Lines', '', table(['Line', 'Kind', 'Stream', 'Fluid', 'From', 'To', 'Design', 'Tier', 'Components', 'Welds', 'Supports', 'Length, ft'], r.lines.map(l => [l.no, l.origin, l.stream, l.fluidName, l.from, l.to, `${l.designP} psi, ${l.designT} °F`, l.tier ?? '—', l.components, l.welds, l.supports, l.lengthFt])), '');
  return out.join('\n');
}
