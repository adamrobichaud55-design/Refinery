/**
 * Plant 3: a unit piped (DESIGN_BASIS.md §79). Runs the generator of plants 1 and 2 on the unit, sets the battery limit
 * spools on the lanes it gave (SW-RPI-4), runs that generator's own checks (§40) on the result, and writes what is found:
 * nothing is hidden, and a check that does not come to zero is listed.
 */
import { generatePiping, partFromKey, staticObstacles, type PipingModel, type Comp, type LineRun, type Obstacle } from '../generator/piping';
import * as K from '../generator/pipingCheck';
import { buildGeometry } from '../geometry/partGeometry';
import { pipeDims, elbowRadius } from '../catalogue';
import type { V3 } from '../generator/router';
import { unitPiping, block, type UnitPiping, type UnitLine, type BlSpool, type RootSpool, type StationSpool } from './unitPiping';
import type { Placed } from '../generator/building';
import { processModel } from './process';
import { FLUIDS } from './fluids';
import { RACK } from './cell';

export interface UnitChecks { continuity: string[]; joints: string[]; elbows: string[]; valves: string[]; lineClearance: string[]; staticClearance: string[]; supports: string[] }
export interface PipedLine { no: string; origin: UnitLine['origin']; fluid: string; fluidName: string; from: string; to: string; NPS: number; cls: string; designP: number; designT: number; routed: boolean; components: number; welds: number; supports: number; lengthFt: number; /** the rack tier it runs on, 1 the lowest (SW-RPI-7) */ tier?: number; /** the control station it is divided at (SW-RPI-9) */ station?: string; controlValve?: 'piped' | 'omitted' }
export interface PipedUnit { demonstration: true; unit: number; name: string; frame: string; /** the runs of the generator (SW-RPI-7): one for each line that runs the rack and each column's overhead line, and one for the rest */ runs: number; /** the rack tiers its lines run on, 1 the lowest (SW-RPI-7) */ tiers: number[]; /** the width of lanes each tier is loaded to, in */ tierRoom: number; seconds: number; stats: Record<string, number>; failures: string[]; checks: UnitChecks; spools: BlSpool[]; /** branch root spools (SW-RPI-8) */ roots: RootSpool[]; /** control station spools (SW-RPI-9) */ stations: StationSpool[]; lines: PipedLine[]; counts: { components: Record<string, number>; welds: Record<string, number>; supports: Record<string, number> }; notes: string[] }

/** a valve's box in the plant, from its drawn solids (as the generator's tools take it) */
export function valveBoxFn(): (c: Comp) => [V3, V3] {
  const cache = new Map<string, [V3, V3]>();
  return (c: Comp): [V3, V3] => {
    let b = cache.get(c.key);
    if (!b) { const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity]; for (const s of buildGeometry(partFromKey(c.key)).solids) for (let i = 0; i < s.mesh.positions.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], s.mesh.positions[i + a]); mx[a] = Math.max(mx[a], s.mesh.positions[i + a]); } b = [mn, mx]; cache.set(c.key, b); }
    const T = c.T, mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity];
    for (let k = 0; k < 8; k++) { const p = [k & 1 ? b[1][0] : b[0][0], k & 2 ? b[1][1] : b[0][1], k & 4 ? b[1][2] : b[0][2]], w = [T[0] * p[0] + T[4] * p[1] + T[8] * p[2] + T[12], T[1] * p[0] + T[5] * p[1] + T[9] * p[2] + T[13], T[2] * p[0] + T[6] * p[1] + T[10] * p[2] + T[14]]; for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], w[a]); mx[a] = Math.max(mx[a], w[a]); } }
    return [mn, mx];
  };
}
/**
 * SW-RPI-13: the gap between two components measured as the generator's check measures it, except that a 45° elbow is held by its own two legs
 * (R tan 22.5° each, not a 90° elbow's) and a piece askew to the axes is measured against a valve's box from points every 1/4 in along its axis
 * (not by its bounding box). `undefined` where the pair is neither case and the check's own figure stands.
 */
export function measuredAgain(a: Comp, b: Comp, vb: (c: Comp) => [V3, V3]): number | undefined {
  const is45 = (c: Comp) => c.kind === 'elbow' && /\|45(\||$)/.test(c.key), askew = (c: Comp) => c.kind !== 'valve' && [0, 1, 2].filter(k => Math.abs(c.a[k] - c.b[k]) > 1e-6).length > 1;
  if (!is45(a) && !is45(b) && !(a.kind === 'valve' && askew(b)) && !(b.kind === 'valve' && askew(a))) return undefined;
  const shapes = (c: Comp): K.Shape[] => { if (!is45(c)) return K.compShapes(c, vb); const OD = pipeDims(c.NPS, c.cls).OD, leg = elbowRadius(OD) * Math.tan(Math.PI / 8), corner: V3 = [c.a[0] + c.T[8] * leg, c.a[1] + c.T[9] * leg, c.a[2] + c.T[10] * leg]; return [{ kind: 'cap', a: c.a, b: corner, r: OD / 2 }, { kind: 'cap', a: corner, b: c.b, r: OD / 2 }]; };
  const exact = (x: K.Shape, y: K.Shape): number => {
    if (x.kind === 'box' && y.kind === 'cap') return exact(y, x);
    if (x.kind !== 'cap' || y.kind !== 'box') return K.gap(x, y);
    const L = Math.hypot(x.b[0] - x.a[0], x.b[1] - x.a[1], x.b[2] - x.a[2]), n = Math.max(1, Math.ceil(L / 0.25)); let best = Infinity;
    for (let i = 0; i <= n; i++) { let d2 = 0; for (let k = 0; k < 3; k++) { const p = x.a[k] + ((x.b[k] - x.a[k]) * i) / n, d = Math.max(y.mn[k] - p, p - y.mx[k], 0); d2 += d * d; } best = Math.min(best, Math.sqrt(d2)); }
    return best - x.r;
  };
  return Math.min(...shapes(a).flatMap(x => shapes(b).map(y => exact(x, y))));
}
/**
 * SW-RPI-13: the gap between a 90° elbow and a piece of steel or equipment, measured from the elbow's own arc: the generator's check holds the elbow by its two
 * straight legs, which meet at a corner the elbow cuts off by R(√2 − 1). Points every 5° along the arc of its centre line, less the pipe's radius.
 */
export function elbowGap(c: Comp, o: Obstacle): number {
  const OD = pipeDims(c.NPS, c.cls).OD, R = elbowRadius(OD), k: V3 = [c.a[0] + c.T[8] * R, c.a[1] + c.T[9] * R, c.a[2] + c.T[10] * R], O: V3 = [c.a[0] + c.b[0] - k[0], c.a[1] + c.b[1] - k[1], c.a[2] + c.b[2] - k[2]];
  let best = Infinity;
  for (let i = 0; i <= 18; i++) { const t = (i * Math.PI) / 36, p: V3 = [0, 1, 2].map(a => O[a] + (c.a[a] - O[a]) * Math.cos(t) + (c.b[a] - O[a]) * Math.sin(t)) as V3;
    best = Math.min(best, o.kind === 'box' ? Math.hypot(...[0, 1, 2].map(a => Math.max(o.mn[a] - p[a], p[a] - o.mx[a], 0))) : K.segSeg(p, p, o.a, o.b) - o.r); }
  return best - OD / 2;
}
/** the generator's checks (§40) on a unit's piping, against the unit's real steel and equipment */
export function unitChecks(m: PipingModel, up: UnitPiping): UnitChecks {
  const vb = valveBoxFn(), byTag = new Map<string, Comp>(); for (const r of m.lines) for (const c of r.comps) byTag.set(c.tag, c);
  // SW-RPI-13: a pair the clearance check reports for the way it holds a piece at 45° is measured again, and stays reported if it is nearer than 3 in
  const real = (v: string) => { const t = /^\S+ (\S+) – \S+ (\S+): /.exec(v), a = t && byTag.get(t[1]), b = t && byTag.get(t[2]); if (!a || !b) return true; const g = measuredAgain(a, b, vb); return g === undefined || g < 3; };
  // SW-RPI-13: a 90° elbow reported against steel or equipment is measured again from its arc, and stays reported if that is nearer than 3 in
  const statics = staticObstacles([], up.cell.interior.instances, true).obstacles;
  return {
    continuity: K.checkContinuity(m), joints: K.checkJoints(m), elbows: K.checkElbowsAndStraights(m),
    valves: K.checkNumberingAndValves(m).filter(v => !v.startsWith('bad line number')),                    // plant 3's numbers carry a five-digit sequence (SW-REF-3)
    lineClearance: [...new Set(K.checkLineClearance(m, vb).violations)].filter(real),
    staticClearance: K.checkStaticClearance(m, statics, vb).filter(v => { const t = /^\S+ (\S+) \(elbow\) – (.+): [\d.]+ in$/.exec(v), c = t && byTag.get(t[1]); if (!c || /\|45(\||$)/.test(c.key)) return true; const os = statics.filter(o => o.tag === t![2]); return !os.length || Math.min(...os.map(o => elbowGap(c, o))) < 3; }),
    supports: K.checkSupports(m, up.plant.rack),
  };
}
/** the lane a line runs in on a tier of the rack: where its longest stretch along the rack at that tier's elevation lies, if that is 8 ft or more */
export function laneOf(r: LineRun, tier: number): number | undefined {
  let best = 96 - 1e-6, z: number | undefined;
  for (let i = 1; i < r.path.length; i++) { const a = r.path[i - 1], b = r.path[i], L = Math.abs(a[0] - b[0]); if (Math.abs(a[1] - b[1]) < 1e-6 && Math.abs(a[2] - b[2]) < 1e-6 && L > best && a[1] > RACK.tiers[tier] && a[1] < RACK.tiers[tier] + 24) { best = L; z = a[2]; } }
  return z;
}
const pathLen = (r: LineRun) => r.path.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - r.path[i - 1][0], p[1] - r.path[i - 1][1], p[2] - r.path[i - 1][2]) : 0), 0);

/** SW-RPI-7: what a run leaves standing for the runs after it: each component by the shape the checks hold it by, each support by its part's box (one under a pipe on the rack cut to the pipe's width) */
export function runSolids(m: PipingModel, vb: (c: Comp) => [V3, V3]): Placed[] {
  const out: Placed[] = [], add = (mn: V3, mx: V3) => { if ([0, 1, 2].every(k => mx[k] - mn[k] > 0.05)) out.push(block(mn, mx, 'earlier run')); };
  for (const r of m.lines) {
    for (const c of [...r.comps, ...(r.side ?? [])]) for (const sh of K.compShapes(c, vb)) {
      if (sh.kind === 'box') { add(sh.mn, sh.mx); continue; }
      const d = [sh.b[0] - sh.a[0], sh.b[1] - sh.a[1], sh.b[2] - sh.a[2]], L = Math.hypot(d[0], d[1], d[2]) || 1, e = d.map(v => sh.r * Math.sqrt(Math.max(0, 1 - (v / L) ** 2)));   // a cylinder's reach along each axis
      add([Math.min(sh.a[0], sh.b[0]) - e[0], Math.min(sh.a[1], sh.b[1]) - e[1], Math.min(sh.a[2], sh.b[2]) - e[2]], [Math.max(sh.a[0], sh.b[0]) + e[0], Math.max(sh.a[1], sh.b[1]) + e[1], Math.max(sh.a[2], sh.b[2]) + e[2]]);
    }
    // a shoe, guide or anchor under a pipe on the rack is held no wider than its pipe: its base is an inch or two wider, and the grid would hold that out to the lane beside it
    const rad = pipeDims(r.NPS, r.cls).OD / 2;
    for (const sp of r.supports) { const [mn, mx] = vb({ key: sp.key, T: sp.T } as Comp); if (sp.type === 'shoe' || sp.type === 'guide' || sp.type === 'anchor') for (const a of [0, 2]) if (Math.abs(sp.T[8 + a]) < 0.5) { mn[a] = Math.max(mn[a], sp.at[a] - rad); mx[a] = Math.min(mx[a], sp.at[a] + rad); } add(mn, mx); }
  }
  return out;
}
/** SW-RPI-7: the generator run once for each column's overhead line and each line that runs the rack, on the lane given it, then once for the rest; each run sees the ones before it; the runs' results as one model */
export function generateUnit(up: UnitPiping, log: (s: string) => void = () => {}, watch?: (plant: UnitPiping['plant']) => void, notes: string[] = []): PipingModel {
  const vb = valveBoxFn(), models: PipingModel[] = [], prior: Placed[] = [], t00 = Date.now(); let routed = 0, failed = 0;
  for (const [k, run] of up.runs.entries()) {
    const mine = new Set(run.lines), only = (l: { no: string }) => mine.has(l.no), t0 = Date.now();
    let plant = up.runPlant(k, prior); watch?.(plant);
    let m = generatePiping({ plant, only });
    // a line that finds no way in its cut grid is run again on the unit's whole grid before it is reported
    if (m.failures.length && run.kind !== 'rest') { plant = up.runPlant(k, prior, true); watch?.(plant); const again = generatePiping({ plant, only }); if (again.failures.length < m.failures.length) { m = again; notes.push(`${run.lines[0]}: routed on the unit's whole grid, having found no way in the grid cut to it (SW-RPI-7)`); } }
    models.push(m); routed += m.stats.routed ?? 0; failed += m.failures.length;
    if (run.kind === 'rest') log(`unit ${up.unit}: the rest, ${m.stats.routed} of ${m.lines.filter(l => l.kind !== 'stub').length} lines routed, ${m.failures.length} failures, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    else if (m.failures.length) log(`unit ${up.unit}: run ${k + 1} of ${up.runs.length}, ${run.lines[0]}${run.lane ? ` on tier ${run.lane.t + 1} in the lane at z ${run.lane.z}` : ''}: ${m.failures.length} failure${m.failures.length > 1 ? 's' : ''}, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    for (const f of m.failures) log(`   ${f}`);
    if (run.kind !== 'rest' && (k + 1 === up.runs.length - 1 || (k + 1) % 20 === 0)) log(`unit ${up.unit}: ${k + 1} of ${up.runs.length - 1} runs of single lines, ${routed} lines routed, ${failed} failures, ${((Date.now() - t00) / 1000).toFixed(0)} s`);
    if (k < up.runs.length - 1) for (const b of runSolids(m, vb)) prior.push(b);
  }
  let model = models[0];
  if (models.length > 1) {
    const byNo = new Map(models.flatMap(m => m.lines.map(r => [r.no, r] as const))), stats: Record<string, number> = {};
    for (const m of models) for (const [key, v] of Object.entries(m.stats)) stats[key] = (stats[key] ?? 0) + v;
    model = { ...models[models.length - 1], lines: up.lines.map(l => byNo.get(l.def.no)!).filter(Boolean), failures: models.flatMap(m => m.failures), stats };
  }
  const made = lengthenShortPieces(model); if (made.length) { notes.push(...made.map(c => `${c}: a make-up piece under 2 in beside a 45° offset, the offset moved along the run to make it 2 in (SW-RPI-11)`)); log(`unit ${up.unit}: ${made.length} make-up piece${made.length > 1 ? 's' : ''} under 2 in lengthened (SW-RPI-11)`); }
  const cut = cutLongPipes(model); if (cut.length) { notes.push(...cut.map(c => `${c}: a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)`)); log(`unit ${up.unit}: ${cut.length} piece${cut.length > 1 ? 's' : ''} of pipe over 40 ft cut again (SW-RPI-10)`); }
  return model;
}
/**
 * SW-RPI-11: no make-up piece shorter than 2 in. The generator sets a branch's tee on its parent's run and afterwards turns a short jog of that run into
 * a pair of 45° elbows (SW-RT-8), which can leave less than 2 in of pipe between the tee and the first of the pair, as its own check then reports. Here the
 * pair, with the piece between its elbows, is moved along the run until the short piece is 2 in; the pipe beyond the pair gives up what was added. Returns the pieces lengthened.
 */
export function lengthenShortPieces(m: PipingModel, least = 2): string[] {
  const done: string[] = [], d3 = (p: V3, q: V3) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]), is45 = (c?: Comp) => !!c && c.kind === 'elbow' && /\|45(\||$)/.test(c.key);
  for (const r of m.lines) for (let i = 0; i < r.comps.length; i++) {
    const c = r.comps[i]; if (c.kind !== 'pipe') continue;
    const L = d3(c.a, c.b); if (L >= least - 1e-6 || L < 1e-6) continue;
    const w: V3 = [(c.b[0] - c.a[0]) / L, (c.b[1] - c.a[1]) / L, (c.b[2] - c.a[2]) / L], d = least - L;
    // the pair of 45° elbows on one side of the piece, and the pipe beyond it
    const fwd = is45(r.comps[i + 1]) && r.comps[i + 2]?.kind === 'pipe' && is45(r.comps[i + 3]) && r.comps[i + 4]?.kind === 'pipe', back = !fwd && is45(r.comps[i - 1]) && r.comps[i - 2]?.kind === 'pipe' && is45(r.comps[i - 3]) && r.comps[i - 4]?.kind === 'pipe';
    if (!fwd && !back) continue;                                                                             // not this case: left to the check to report
    const sgn = fwd ? 1 : -1, group = [1, 2, 3].map(k => r.comps[i + sgn * k]), beyond = r.comps[i + sgn * 4]; if (d3(beyond.a, beyond.b) < least + d) continue;
    const shift: V3 = [w[0] * d * sgn, w[1] * d * sgn, w[2] * d * sgn], add = (p: V3): V3 => [p[0] + shift[0], p[1] + shift[1], p[2] + shift[2]];
    const moved = [group[0].a, group[0].b, group[2].a, group[2].b, ...(fwd ? [c.b] : [c.a])].map(p => [...p] as V3), at = (p: V3) => moved.some(q => d3(p, q) < 1e-3);
    for (const q of m.lines) for (const wd of q.welds) if ((q === r || wd.joins.some(t => group.some(g => g.tag === t))) && at(wd.at)) { wd.at = add(wd.at); wd.T = [...wd.T.slice(0, 12), wd.T[12] + shift[0], wd.T[13] + shift[1], wd.T[14] + shift[2], 1] as typeof wd.T; }
    for (const g of group) { g.a = add(g.a); g.b = add(g.b); g.T = [...g.T.slice(0, 12), g.T[12] + shift[0], g.T[13] + shift[1], g.T[14] + shift[2], 1] as typeof g.T; }
    const key = (q: Comp) => `${q.key.split('|').slice(0, 3).join('|')}|${d3(q.a, q.b).toFixed(3)}`;
    if (fwd) { c.b = add(c.b); beyond.a = add(beyond.a); beyond.T = [...beyond.T.slice(0, 12), beyond.a[0], beyond.a[1], beyond.a[2], 1] as typeof beyond.T; } else { c.a = add(c.a); c.T = [...c.T.slice(0, 12), c.a[0], c.a[1], c.a[2], 1] as typeof c.T; beyond.b = add(beyond.b); }
    c.key = key(c); beyond.key = key(beyond); done.push(`${c.tag} (${L.toFixed(2)} in)`);
  }
  return done;
}
/**
 * SW-RPI-10: no piece of pipe is longer than 40 ft. The generator cuts a long run into equal lengths of 40 ft at most and then moves each
 * splice off the rack's beams, by up to 2 ft, which on a run long enough can leave a piece longer than 40 ft. Such a piece is cut again here,
 * as near its middle as keeps the new weld 14 in from every support of its line (the generator's own clearance for a splice), with a shop
 * butt weld. Returns the pieces cut.
 */
export function cutLongPipes(m: PipingModel, most = 480): string[] {
  const done: string[] = [], d3 = (p: V3, q: V3) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  for (const r of m.lines) for (let i = 0; i < r.comps.length; i++) {
    const c = r.comps[i]; if (c.kind !== 'pipe') continue;
    const L = d3(c.a, c.b); if (L <= most + 1e-6) continue;
    if (c.e1 !== 'BW' || c.e2 !== 'BW' || L > 2 * most) throw new Error(`${c.tag}: a ${L.toFixed(0)} in piece of pipe that SW-RPI-10 does not cut (ends ${c.e1}, ${c.e2})`);
    const w: V3 = [(c.b[0] - c.a[0]) / L, (c.b[1] - c.a[1]) / L, (c.b[2] - c.a[2]) / L], at = (s: number): V3 => [c.a[0] + w[0] * s, c.a[1] + w[1] * s, c.a[2] + w[2] * s];
    const clear = (s: number) => s <= most && L - s <= most && r.supports.every(sp => { const t = (sp.at[0] - c.a[0]) * w[0] + (sp.at[1] - c.a[1]) * w[1] + (sp.at[2] - c.a[2]) * w[2]; return t < -1 || t > L + 1 || Math.abs(t - s) >= 14; });
    let s: number | undefined; for (let k = 0; k <= 40 && s === undefined; k++) for (const v of k ? [L / 2 + 6 * k, L / 2 - 6 * k] : [L / 2]) if (s === undefined && clear(v)) s = v;
    if (s === undefined) throw new Error(`${c.tag}: no place for a splice in a ${L.toFixed(0)} in piece of pipe`);
    const mid = at(s), far = c.b, tags = new Set(r.comps.map(q => q.tag)); let n = r.comps.length + 1; while (tags.has(`${r.no}/p${n}`)) n++;
    const key = (len: number) => `${c.key.split('|').slice(0, 3).join('|')}|${len.toFixed(3)}`, T = (o: V3) => [...c.T.slice(0, 12), o[0], o[1], o[2], 1] as typeof c.T;
    const first: Comp = { ...c, key: key(s), b: mid }, second: Comp = { ...c, tag: `${r.no}/p${n}`, key: key(L - s), a: mid, T: T(mid) };
    // what was welded to the far end of the piece, on this line or on a branch from it, is welded to the second half
    for (const q of m.lines) for (const wd of q.welds) if (wd.joins.includes(c.tag) && (wd.at[0] - c.a[0]) * w[0] + (wd.at[1] - c.a[1]) * w[1] + (wd.at[2] - c.a[2]) * w[2] > s) wd.joins = wd.joins.map(t => (t === c.tag ? second.tag : t)) as [string, string];
    const like = r.welds.find(wd => wd.type === 'BW' && wd.NPS === c.NPS); if (!like) throw new Error(`${c.tag}: no butt weld on its line to take the splice's size from`);
    const ids = new Set(r.welds.map(wd => wd.id)); let k = r.welds.length + 1; while (ids.has(`${r.no}/W${k}`)) k++;
    r.welds.push({ ...like, id: `${r.no}/W${k}`, at: mid, dir: w, joins: [first.tag, second.tag], field: false, T: T(mid) });
    r.comps.splice(i, 1, first, second); i++; m.stats.comps = (m.stats.comps ?? 0) + 1; m.stats.welds = (m.stats.welds ?? 0) + 1; done.push(`${c.tag} (${(L / 12).toFixed(1)} ft, far end ${far.map(v => Math.round(v)).join(',')})`);
  }
  return done;
}

/** SW-RPI-1, SW-RPI-7: pipe a unit */
export function pipeUnit(unit: number, log: (s: string) => void = () => {}, watch?: (plant: UnitPiping['plant']) => void): { up: UnitPiping; model: PipingModel; result: PipedUnit } {
  const t0 = Date.now(), recut: string[] = [], up = unitPiping(unit), model = generateUnit(up, log, watch, recut);
  // SW-RPI-7: each line that runs the rack lies in the lane it was given; one found in another is said, and so is a header (their lanes are held where they were foreseen)
  const astray = up.foreseen.flatMap(L => { const r = L.no === undefined ? undefined : model.lines.find(l => l.no === L.no), z = r && r.ok ? laneOf(r, L.t) : undefined; return z !== undefined && Math.abs(z - L.z) > 1e-6 ? [`${L.no}: given the lane at z ${L.z} on tier ${L.t + 1}, routed at z ${z}`] : []; });
  const moved = up.headers.flatMap(h => { const r = model.lines.find(l => l.no === h.line), z = r?.path[0]?.[2]; return r && h.z !== undefined && z !== undefined && Math.abs(z - h.z) > 1e-6 ? [`${h.line}: foreseen in the lane at z ${h.z}, routed at z ${z}`] : []; });
  const checks = unitChecks(model, up), M = processModel(), sh = M.sheet(unit), count = (xs: string[]) => { const o: Record<string, number> = {}; for (const x of xs) o[x] = (o[x] ?? 0) + 1; return Object.fromEntries(Object.entries(o).sort()); };
  const lines: PipedLine[] = up.lines.map(l => { const r = model.lines.find(q => q.no === l.def.no)!; const fl = l.flow !== undefined ? sh.lines[l.flow] : undefined;
    return { no: l.def.no, origin: l.origin, fluid: l.fluid, fluidName: FLUIDS[l.fluid].name, from: r.from, to: r.to, NPS: l.def.NPS, cls: l.def.cls, designP: l.designP, designT: l.designT, routed: r.ok, components: r.comps.filter(c => c.kind !== 'studs').length, welds: r.welds.length, supports: r.supports.length, lengthFt: Math.round(pathLen(r) / 12), ...(l.tier !== undefined ? { tier: l.tier + 1 } : {}),
      ...(l.station ? { station: l.station } : {}), ...(fl?.cv && l.origin === 'process' ? { controlValve: l.cvOmitted ? 'omitted' as const : 'piped' as const } : {}) }; });
  const result: PipedUnit = {
    demonstration: true, unit, name: sh.name, frame: 'the unit\'s own (SW-CELL-1): inches, x from its battery limit along its rack, y up from its bench, z across the rack', runs: up.runs.length, tiers: up.tiers.map(t => t + 1), tierRoom: up.tierRoom, seconds: Math.round((Date.now() - t0) / 1000),
    stats: Object.fromEntries(Object.entries(model.stats).filter(([k]) => !k.startsWith('t_'))), failures: model.failures, checks, spools: up.spools, roots: up.roots, stations: up.stations, lines,
    counts: { components: count(model.lines.flatMap(r => r.comps.filter(c => c.kind !== 'studs').map(c => c.kind))), welds: count(model.lines.flatMap(r => r.welds.map(w => `${w.type}${w.field ? ', field' : ', shop'}`))), supports: count(model.lines.flatMap(r => r.supports.map(s => s.type))) },
    notes: [...up.notes, ...astray, ...moved, ...recut],
  };
  return { up, model, result };
}

// ───────────────────────── the document ─────────────────────────
const table = (head: string[], rows: (string | number)[][]) => [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n');
const fmt = (n: number) => n.toLocaleString('en-US');
export const PIPING_IMAGES = (unit: number, name: string): Record<string, string> => ({
  [`unit-${unit}-piping-from-the-vessel-side`]: `Plant 3, unit ${unit} (${name}) piped, from the vessel side: lines coloured by line class`,
  [`unit-${unit}-piping-from-the-exchanger-side`]: `Plant 3, unit ${unit} (${name}) piped, from the exchanger side`,
  [`unit-${unit}-piping-valve-bay`]: `Plant 3, unit ${unit}: the valve bay at the battery limit, a block valve and spool on each line`,
  [`unit-${unit}-piping-exchangers`]: `Plant 3, unit ${unit}: piping at the exchangers`,
});
export function pipingDocument(all: PipedUnit[]): string {
  // a report written before tiers and branch roots were recorded reads as one tier and no roots
  const units = all.map(u => ({ ...u, tiers: u.tiers ?? [1], tierRoom: u.tierRoom ?? 0, roots: u.roots ?? [], stations: u.stations ?? [] })), out: string[] = [];
  out.push('# Plant 3: piping of the units', '');
  out.push('> **Demonstration data.** Written by `tools/refinery-piping.ts`; do not edit by hand.', '');
  out.push('Each unit is piped in its own frame by the generator of plants 1 and 2, unchanged (DESIGN_BASIS.md §79): what it is given is the unit\'s rack and bodies, a nozzle schedule and a line list drawn from the flowsheet, battery limit spools in a valve bay, and where lines may travel. Its own checks (§40) are then run on the result and reported here as they come out.', '');
  out.push(table(['Unit', 'Name', 'Lines', 'Routed', 'Components', 'Welds', 'Supports', 'Pipe, ft', 'Failures', 'Checks not at zero'], units.map(u => [u.unit, u.name, u.lines.length, u.lines.filter(l => l.routed).length, fmt(Object.values(u.counts.components).reduce((a, b) => a + b, 0)), fmt(Object.values(u.counts.welds).reduce((a, b) => a + b, 0)), fmt(Object.values(u.counts.supports).reduce((a, b) => a + b, 0)), fmt(u.lines.reduce((a, l) => a + l.lengthFt, 0)), u.failures.length, Object.entries(u.checks).filter(([, v]) => v.length).map(([k, v]) => `${k} ${v.length}`).join(', ') || 'none'])), '');
  for (const u of units) {
    out.push(`## Unit ${u.unit}: ${u.name}`, '');
    out.push(`${u.lines.length} lines: ${u.lines.filter(l => l.origin === 'process').length} of the flowsheet, ${u.lines.filter(l => l.origin === 'spare').length} to installed spares and parallel bodies, ${u.lines.filter(l => l.origin === 'header').length} utility headers and ${u.lines.filter(l => l.origin === 'utility').length} utility connections${u.lines.some(l => l.origin === 'control') ? `, ${u.lines.filter(l => l.origin === 'control').length} parts of lines after their control stations (SW-RPI-9)` : ''}${u.lines.some(l => l.origin === 'root') ? `, and ${u.lines.filter(l => l.origin === 'root').length} connections to branch root spools (SW-RPI-8)` : ''}. ${u.tiers.length > 1 ? `The lines that run the rack are on ${u.tiers.length} of its tiers (SW-RPI-7), each in a lane given it beforehand, no tier loaded beyond ${u.tierRoom} in of lanes at any section: ${u.tiers.map(t => `tier ${t} ${u.lines.filter(l => l.tier === t).length} lines`).join(', ')}.` : 'The lines that run the rack are all on its lowest tier, each in a lane given it beforehand.'} The generator was run ${u.runs} times: once for each line that runs the rack or rises in a column's chase, with the branches that tap it, and once for the rest.`, '');
    out.push(table(['Component', 'Count'], Object.entries(u.counts.components)), '');
    out.push(table(['Welds', 'Count'], Object.entries(u.counts.welds)), '', table(['Supports', 'Count'], Object.entries(u.counts.supports)), '');
    out.push('### Checks', '');
    out.push(table(['Check (the generator\'s own, §40)', 'Found'], [['every line continuous from end to end', u.checks.continuity.length], ['every joint a joint of its class', u.checks.joints.length], ['elbows and the straights between them', u.checks.elbows.length], ['valves by class and size', u.checks.valves.length], ['3 in between lines', u.checks.lineClearance.length], ['3 in from steel and equipment', u.checks.staticClearance.length], ['spans within SW-PS-7, a support at every rack beam crossed', u.checks.supports.length]]), '');
    if (u.failures.length) out.push('Reported by the generator:', '', ...u.failures.map(f => `- ${f}`), '');
    for (const [k, v] of Object.entries(u.checks) as [string, string[]][]) if (v.length) out.push(`Not at zero, ${k}:`, '', ...v.map(s => `- ${s}`), '');
    if (u.checks.supports.length) out.push('These runs are longer than a pipe of their size spans and no steel stands where a support would go: lines that cross the yard or run beside the rack away from the support beams. They are listed, not hidden, and want pipe supports of their own.', '');
    out.push('### Battery limit', '', table(['Spool', 'Stream', 'Direction', 'Line', 'Stands at (x, y, z), in', 'Tier', 'Lane'], u.spools.map(s => [s.tag, s.stream, s.dir, s.line, s.at.join(', '), s.tier + 1, s.lane ?? '—'])), '');
    if (u.roots.length) out.push('### Branch roots', '', 'Branches that travel the rack start at a spool on it, a block valve on each face (SW-RPI-8).', '', table(['Spool', 'Branch', 'Connection to the tee', 'On', 'Stands at (x, y, z), in', 'Tier'], u.roots.map(r => [r.tag, r.line, r.connection, r.parent, r.at.join(', '), r.tier + 1])), '');
    const cv = u.lines.filter(l => l.controlValve);
    if (cv.length) out.push('### Control valve stations', '', 'Each stands at grade under the rack, on a spool that divides its line (SW-RPI-9).', '', table(['Line', 'Station', 'Spool', 'Stands at (x, y, z), in', 'The line after it'], cv.map(l => { const st = u.stations.find(q => q.line === l.no); return [l.no, l.controlValve!, st?.tag ?? '—', st ? st.at.join(', ') : '—', st?.after ?? '—']; })), '');
    out.push('### Lines', '', table(['Line', 'Kind', 'Fluid', 'From', 'To', 'Design', 'Rack tier', 'Components', 'Welds', 'Supports', 'Length, ft'], u.lines.map(l => [l.no, l.origin, l.fluidName, l.from, l.to, `${l.designP} psi, ${l.designT} °F`, l.tier ?? '—', l.components, l.welds, l.supports, l.lengthFt])), '');
  }
  return out.join('\n');
}
