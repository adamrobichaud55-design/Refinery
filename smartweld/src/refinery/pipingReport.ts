/**
 * Plant 3: a unit piped (DESIGN_BASIS.md §79). Runs the generator of plants 1 and 2 on the unit, sets the battery limit
 * spools on the lanes it gave (SW-RPI-4), runs that generator's own checks (§40) on the result, and writes what is found:
 * nothing is hidden, and a check that does not come to zero is listed.
 */
import { generatePiping, partFromKey, staticObstacles, worldBox, type PipingModel, type Comp, type LineRun, type Obstacle } from '../generator/piping';
import * as K from '../generator/pipingCheck';
import { buildGeometry } from '../geometry/partGeometry';
import { pipeDims, elbowRadius, designFlange } from '../catalogue';
import type { V3 } from '../generator/router';
import { frameFromAxes } from '../geometry/transform';
import { supportsAlongSpans, type SpanSupports, type FrameSpec } from './supports';
import { unitPiping, block, laneSpacing, type UnitPiping, type UnitLine, type BlSpool, type RootSpool, type StationSpool } from './unitPiping';
import type { Placed } from '../generator/building';
import { processModel } from './process';
import { FLUIDS } from './fluids';
import { RACK } from './cell';

export interface UnitChecks { continuity: string[]; joints: string[]; elbows: string[]; valves: string[]; lineClearance: string[]; staticClearance: string[]; supports: string[] }
export interface PipedLine { no: string; origin: UnitLine['origin']; fluid: string; fluidName: string; from: string; to: string; NPS: number; cls: string; designP: number; designT: number; routed: boolean; components: number; welds: number; supports: number; lengthFt: number; /** the rack tier it runs on, 1 the lowest (SW-RPI-7) */ tier?: number; /** the control station it is divided at (SW-RPI-9) */ station?: string; controlValve?: 'piped' | 'omitted' }
export interface PipedUnit {
  /** SW-RPI-17: plant 3's own pipe frames, which the generator's model has no place for */
  frames?: FrameSpec[]; demonstration: true; unit: number; name: string; frame: string; /** the runs of the generator (SW-RPI-7): one for each line that runs the rack and each column's overhead line, and one for the rest */ runs: number; /** the rack tiers its lines run on, 1 the lowest (SW-RPI-7) */ tiers: number[]; /** the width of lanes each tier is loaded to, in */ tierRoom: number; seconds: number; stats: Record<string, number>; failures: string[]; checks: UnitChecks; spools: BlSpool[]; /** branch root spools (SW-RPI-8) */ roots: RootSpool[]; /** control station spools (SW-RPI-9) */ stations: StationSpool[]; lines: PipedLine[]; counts: { components: Record<string, number>; welds: Record<string, number>; supports: Record<string, number> }; notes: string[] }

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
/**
 * SW-RPI-13: the section of a steel member the checks hold as a round about its axis: the box of the member's own solids, where the member lies square to the
 * axes (a column, a beam, a strut; not a bracing rod). `undefined` for any other obstacle.
 */
export function sectionBoxFn(instances: Placed[]): (o: Obstacle) => [V3, V3] | undefined {
  const local = new WeakMap<object, [V3, V3]>(), byTag = new Map<string, Placed[]>();
  for (const pl of instances) { const t = pl.tags.join('/'); byTag.set(t, [...(byTag.get(t) ?? []), pl]); }
  const boxOf = (pl: Placed): [V3, V3] => {
    let b = local.get(pl.part);
    if (!b) { const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity]; for (const so of buildGeometry(pl.part).solids) for (let i = 0; i < so.mesh.positions.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], so.mesh.positions[i + a]); mx[a] = Math.max(mx[a], so.mesh.positions[i + a]); } b = [mn, mx]; local.set(pl.part, b); }
    const T = pl.transform, mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity];
    for (let k = 0; k < 8; k++) { const p = [k & 1 ? b[1][0] : b[0][0], k & 2 ? b[1][1] : b[0][1], k & 4 ? b[1][2] : b[0][2]], w = [T[0] * p[0] + T[4] * p[1] + T[8] * p[2] + T[12], T[1] * p[0] + T[5] * p[1] + T[9] * p[2] + T[13], T[2] * p[0] + T[6] * p[1] + T[10] * p[2] + T[14]]; for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], w[a]); mx[a] = Math.max(mx[a], w[a]); } }
    return [mn, mx];
  };
  return (o: Obstacle) => {
    if (o.kind !== 'cap') return undefined;
    const d = [o.b[0] - o.a[0], o.b[1] - o.a[1], o.b[2] - o.a[2]], L = Math.hypot(d[0], d[1], d[2]); if (L < 1e-6 || Math.max(...d.map(Math.abs)) < 0.999999 * L) return undefined;
    for (const pl of byTag.get(o.tag) ?? []) { const [mn, mx] = boxOf(pl); if ([o.a, o.b].every(q => [0, 1, 2].every(k => q[k] >= mn[k] - 0.01 && q[k] <= mx[k] + 0.01))) return [mn, mx]; }
    return undefined;
  };
}
/** the generator's checks (§40) on a unit's piping, against the unit's real steel and equipment; `notes` takes what SW-RPI-13 set aside, with both distances */
export function unitChecks(m: PipingModel, up: Pick<UnitPiping, 'cell' | 'plant'>, notes: string[] = []): UnitChecks {
  const vb = valveBoxFn(), byTag = new Map<string, Comp>(); for (const r of m.lines) for (const c of r.comps) byTag.set(c.tag, c);
  // SW-RPI-13: a pair the clearance check reports for the way it holds a piece at 45° is measured again, and stays reported if it is nearer than 3 in
  const real = (v: string) => { const t = /^\S+ (\S+) – \S+ (\S+): /.exec(v), a = t && byTag.get(t[1]), b = t && byTag.get(t[2]); if (!a || !b) return true; const g = measuredAgain(a, b, vb); return g === undefined || g < 3; };
  // SW-RPI-13: a 90° elbow reported against steel or equipment is measured again from its arc, and stays reported if that is nearer than 3 in
  const statics = staticObstacles([], up.cell.interior.instances, true).obstacles, section = sectionBoxFn(up.cell.interior.instances);
  // SW-RPI-13: the gap between a piece and an obstacle, a 90° elbow by its arc, a 45° elbow by its own two legs, a member square to the axes by its own section
  const is45 = (c: Comp) => c.kind === 'elbow' && /\|45(\||$)/.test(c.key);
  const gapTo = (c: Comp, o: Obstacle): number => {
    const sb = section(o), t: Obstacle = sb ? { tag: o.tag, kind: 'box', mn: sb[0], mx: sb[1] } : o;
    if (c.kind === 'elbow' && !is45(c)) return elbowGap(c, t);
    const OD = pipeDims(c.NPS, c.cls).OD, leg = elbowRadius(OD) * Math.tan(Math.PI / 8), corner: V3 = [c.a[0] + c.T[8] * leg, c.a[1] + c.T[9] * leg, c.a[2] + c.T[10] * leg];
    const shapes: K.Shape[] = is45(c) ? [{ kind: 'cap', a: c.a, b: corner, r: OD / 2 }, { kind: 'cap', a: corner, b: c.b, r: OD / 2 }] : K.compShapes(c, vb);
    const box = (sh: K.Shape): [V3, V3] => (sh.kind === 'box' ? [sh.mn, sh.mx] : [[0, 1, 2].map(k => Math.min(sh.a[k], sh.b[k]) - sh.r) as V3, [0, 1, 2].map(k => Math.max(sh.a[k], sh.b[k]) + sh.r) as V3]);
    return Math.min(...shapes.map(sh => (t.kind === 'box' ? (sh.kind === 'cap' ? K.segBox(sh.a, sh.b, t.mn, t.mx) - sh.r : K.boxGap(box(sh), [t.mn, t.mx])) : K.gap(sh, { kind: 'cap', a: t.a, b: t.b, r: t.r }))));
  };
  const stays = (v: string): boolean => {
    const t = /^(\S+) (\S+) \((\w+)\) – (.+): ([\d.]+) in$/.exec(v), c = t && byTag.get(t[2]); if (!t || !c) return true;
    const os = statics.filter(o => o.tag === t[4]); if (!os.length) return true;
    if (is45(c) && !os.some(o => section(o))) return true;                                                // a 45° elbow against anything but a member's section: as the check gives it
    if (c.kind !== 'elbow' && !os.some(o => section(o))) return true;                                    // a straight piece against anything but a member's section: the check is exact
    const g = Math.min(...os.map(o => gapTo(c, o))); if (g < 3) return true;
    if (os.some(o => section(o))) { const n = `${c.tag} (${c.kind}) passes ${t[4]} at ${t[5]} in from the round the check holds that member by and ${g.toFixed(2)} in from its section (SW-RPI-13)`; if (!notes.includes(n)) notes.push(n); }
    return false;
  };
  return {
    continuity: K.checkContinuity(m), joints: K.checkJoints(m), elbows: K.checkElbowsAndStraights(m),
    valves: K.checkNumberingAndValves(m).filter(v => !v.startsWith('bad line number')),                    // plant 3's numbers carry a five-digit sequence (SW-REF-3)
    lineClearance: [...new Set(K.checkLineClearance(m, vb).violations)].filter(real),
    staticClearance: K.checkStaticClearance(m, statics, vb).filter(stays),
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
/** a place to keep each single-line run's result and take it from again when the same run is made (a tool's aid while a later run is worked on; a final result is made without one) */
export interface RunCache { get: (k: number, lines: string[]) => PipingModel | undefined; put: (k: number, lines: string[], m: PipingModel) => void }
/** SW-RPI-17: the note on the supports set where the generator's stepping stopped */
export const spanNote = (s: SpanSupports) => `${s.hangers + s.stanchions + s.posts + s.onSteel + s.frames.length} supports set where the generator's stepping along a run had stopped (SW-RPI-17): ${s.hangers} hangers from steel above, ${s.onSteel} stanchions on steel below, ${s.stanchions} stanchions and ${s.posts} support posts from the floor, and ${s.frames.length} pipe frames`;
/** SW-RPI-7: another lane for a run whose line found its own shut at the outset */
function laneAgain(up: UnitPiping, k: number, prior: Placed[], m: PipingModel): { m: PipingModel; note: string } | undefined {
  const run = up.runs[k], L = run.lane!, main = run.lines[0];
  if (!m.failures.some(f => f.startsWith(`${main}: no rack lane with clear drops: `) && f.trim().endsWith(':'))) return undefined;
  const foreseen = up.foreseen ?? [], rk = up.plant.rack, HW = rk.halfWidth, r = L.OD / 2, y = Math.ceil((rk.tiers[L.t] + 4 + r) / 6 - 1e-9) * 6, x0 = L.x0 + 36, x1 = L.x1 - 36, was = L.z;
  const others = foreseen.filter(q => q !== L && q.t === L.t && !(q.x1 < L.x0 - 24 || q.x0 > L.x1 + 24));
  const boxes = prior.flatMap(p => { const b = worldBox(p.part, p.transform); return b && b[1][0] > x0 && b[0][0] < x1 && b[1][1] > y - r - 9 && b[0][1] < y + r + 9 ? [b] : []; });
  const clear = (z: number) => boxes.every(b => b[1][2] < z - r - 9 || b[0][2] > z + r + 9);
  const cands: number[] = []; for (let z = -(HW - 24); z <= HW - 24; z += 6) if (Math.abs(z - was) > 1e-6) cands.push(z); cands.sort((p, q) => Math.abs(p - was) - Math.abs(q - was) || p - q);
  let tries = 0;
  for (const z of cands) {
    if (!others.every(q => Math.abs(q.z - z) >= laneSpacing(q.OD, L.OD)) || !clear(z)) continue;
    if (++tries > 4) break;
    L.z = z; const mine = new Set(run.lines), again = generatePiping({ plant: up.runPlant(k, prior), only: l => mine.has(l.no) });
    if (again.failures.length < m.failures.length) return { m: again, note: `${main}: the lane given it at z ${was} on tier ${L.t + 1} was found shut by what an earlier run left; routed in the lane at z ${z} (SW-RPI-7)` };
  }
  L.z = was; return undefined;
}
/** SW-RPI-16: what the last run reports that it is made again for: the lines named where a valve strikes in every stem direction, and each valve within 3 in of a header pipe */
function restFindings(up: UnitPiping, m: PipingModel, vb: (c: Comp) => [V3, V3]) {
  const named = [...new Set(m.failures.flatMap(f => { const q = /^(\S+): a valve at .* in every stem direction/.exec(f); return q ? [q[1]] : []; }))];
  const heads = new Set(up.lines.filter(l => l.origin === 'header').map(l => l.def.no)), pipes = m.lines.filter(r => heads.has(r.no)).flatMap(r => r.comps.filter(c => c.kind === 'pipe').map(c => ({ line: r.no, c, s: K.compShapes(c, vb)[0] })));
  const near: { valve: Comp; line: string; header: Comp }[] = [];
  for (const r of m.lines) { if (heads.has(r.no)) continue; for (const c of r.comps) { if (c.kind !== 'valve') continue; const vs = K.compShapes(c, vb); for (const p of pipes) if (vs.some(s => K.gap(s, p.s) < 3 - 1e-6)) near.push({ valve: c, line: r.no, header: p.c }); } }
  return { named, near };
}
function findingsOf(up: UnitPiping, m: PipingModel, vb: (c: Comp) => [V3, V3]) { const f = restFindings(up, m, vb); return m.failures.length + f.near.length; }
function restAgain(up: UnitPiping, k: number, prior0: Placed[], m: PipingModel, vb: (c: Comp) => [V3, V3], earlier: PipingModel[] = []): { first: PipingModel; rest: PipingModel; why: string; after: number } | undefined {
  const { named, near } = restFindings(up, m, vb); if (!named.length && !near.length) return undefined;
  // a valve of an earlier run that the striking valve meets as it stands: its stem turned to the first other direction square to its run in which it comes within 3 in of nothing
  const turned: string[] = [];
  if (named.length) {
    const others = earlier.flatMap(q => q.lines.flatMap(r => r.comps.filter(c => c.kind !== 'studs').map(c => ({ line: r.no, c, s: K.compShapes(c, vb) }))));
    const here = m.lines.filter(r => !named.includes(r.no)).flatMap(r => r.comps.filter(c => c.kind !== 'studs').map(c => ({ line: r.no, c, s: K.compShapes(c, vb) })));
    const statics = up.runPlant(k, []).interior().instances.flatMap(p => { const b = worldBox(p.part, p.transform); return b ? [b] : []; });
    for (const no of named) for (const v of m.lines.find(r => r.no === no)?.comps.filter(c => c.kind === 'valve') ?? []) {
      const vs = K.compShapes(v, vb);
      for (const o of others) {
        if (o.c.kind !== 'valve' || !o.s.some(s => vs.some(w => K.gap(s, w) < 1))) continue;
        const c = o.c, L = Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1], c.b[2] - c.a[2]), f: V3 = [(c.b[0] - c.a[0]) / L, (c.b[1] - c.a[1]) / L, (c.b[2] - c.a[2]) / L], stem: V3 = [c.T[4], c.T[5], c.T[6]], at: V3 = [c.T[12], c.T[13], c.T[14]];
        const dirs: V3[] = ([[0, 1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0]] as V3[]).filter(d => Math.abs(d[0] * f[0] + d[1] * f[1] + d[2] * f[2]) < 1e-6 && Math.hypot(d[0] - stem[0], d[1] - stem[1], d[2] - stem[2]) > 1e-6);
        for (const d of dirs) {
          const T = frameFromAxes(at, d, f) as number[], tried = { ...c, T } as Comp, ts = K.compShapes(tried, vb), [mn, mx] = vb(tried);
          const clear = [...others, ...here].every(q => q.line === o.line || q.s.every(s => ts.every(w => K.gap(s, w) >= 3))) && vs.every(w => ts.every(s => K.gap(s, w) >= 3)) && statics.every(b => b[1][0] < mn[0] || b[0][0] > mx[0] || b[1][1] < mn[1] || b[0][1] > mx[1] || b[1][2] < mn[2] || b[0][2] > mx[2]);
          if (!clear) continue;
          c.T = T as never; turned.push(`${o.line}'s valve ${c.tag.split('/').pop()} turned stem ${d.join(',')}`); break;
        }
      }
    }
  }
  const prior = turned.length ? earlier.flatMap(q => runSolids(q, vb)) : prior0;
  const run = up.runs[k], mine = new Set(run.lines), defs = new Map(up.lines.map(l => [l.def.no, l.def]));
  // the lines named, and the lines they tap, first
  const firstSet = new Set<string>(); for (const no of named) { firstSet.add(no); const d = defs.get(no); for (const e of d ? [d.from, d.to] : []) if (e.k === 'tap' && mine.has(e.line)) firstSet.add(e.line); }
  // and the branches of a line routed first, with theirs: the generator plans a branch's take-off on its parent in the same run (a main of the cooling water mains, SW-CWM-4)
  for (let grew = true; grew;) { grew = false; for (const l of up.lines) if (mine.has(l.def.no) && !firstSet.has(l.def.no) && [l.def.from, l.def.to].some(e => e.k === 'tap' && firstSet.has(e.line))) { firstSet.add(l.def.no); grew = true; } }
  const first = firstSet.size ? generatePiping({ plant: up.runPlant(k, prior), only: l => firstSet.has(l.no) }) : { ...m, lines: [], failures: [], stats: {}, cuts: [] } as PipingModel;
  // a strip 3 in thick along the side of each header a valve came near, facing the valve
  const strips: Placed[] = near.flatMap(({ valve, header }) => {
    if (Math.abs(header.a[1] - header.b[1]) > 1e-6 || Math.abs(header.a[2] - header.b[2]) > 1e-6) return [];
    const r = pipeDims(header.NPS, header.cls as never).OD / 2, [mn, mx] = vb(valve), hz = header.a[2], hy = header.a[1], sg = Math.sign((mn[2] + mx[2]) / 2 - hz) || 1;
    const x0 = Math.max(Math.min(header.a[0], header.b[0]), mn[0] - 3), x1 = Math.min(Math.max(header.a[0], header.b[0]), mx[0] + 3); if (x1 - x0 < 1) return [];
    return [block([x0, hy - r, sg > 0 ? hz + r : hz - r - 3], [x1, hy + r, sg > 0 ? hz + r + 3 : hz - r], 'valve kept clear of a header')];
  });
  const rest = generatePiping({ plant: up.runPlant(k, [...prior, ...runSolids(first, vb), ...strips]), only: l => mine.has(l.no) && !firstSet.has(l.no) });
  const both: PipingModel = { ...rest, lines: [...first.lines, ...rest.lines], failures: [...first.failures, ...rest.failures] }, after = findingsOf(up, both, vb);
  if (after >= m.failures.length + near.length) return undefined;
  return { first, rest, why: [...turned, named.length ? `${named.join(', ')} with ${[...firstSet].filter(x => !named.includes(x)).join(', ') || 'no parent'} routed first` : '', near.length ? `${strips.length} strip${strips.length > 1 ? 's' : ''} beside header${strips.length > 1 ? 's' : ''} where ${near.length} valve${near.length > 1 ? 's' : ''} came within 3 in` : ''].filter(Boolean).join('; '), after };
}
export function generateUnit(up: UnitPiping, log: (s: string) => void = () => {}, watch?: (plant: UnitPiping['plant']) => void, notes: string[] = [], cache?: RunCache): PipingModel {
  const vb = valveBoxFn(), models: PipingModel[] = [], prior: Placed[] = [], t00 = Date.now(); let routed = 0, failed = 0;
  for (const [k, run] of up.runs.entries()) {
    const mine = new Set(run.lines), only = (l: { no: string }) => mine.has(l.no), t0 = Date.now();
    const kept = run.kind !== 'rest' ? cache?.get(k, run.lines) : undefined;
    let plant = up.runPlant(k, prior); if (!kept) watch?.(plant);
    let m = kept ?? generatePiping({ plant, only });
    // a line that finds no way in its cut grid is run again on the unit's whole grid before it is reported
    if (m.failures.length && run.kind !== 'rest') { plant = up.runPlant(k, prior, true); watch?.(plant); const again = generatePiping({ plant, only }); if (again.failures.length < m.failures.length) { m = again; notes.push(`${run.lines[0]}: routed on the unit's whole grid, having found no way in the grid cut to it (SW-RPI-7)`); } }
    // and one that finds none there either, on a grid cut close to it, 10 ft beyond its connections: the generator's search looks at a limited number of places, and the less ground it is shown the further that number goes
    if (m.failures.length && run.kind !== 'rest') { plant = up.runPlant(k, prior, 'close'); watch?.(plant); const again = generatePiping({ plant, only }); if (again.failures.length < m.failures.length) { m = again; notes.push(`${run.lines[0]}: routed on a grid cut close to it, 10 ft beyond its connections, having found no way in the grid first cut to it nor in the unit's whole grid (SW-RPI-7)`); } }
    // SW-RPI-16: the last run made again, once, where it reports a valve that strikes in every direction or a valve within 3 in of a header
    if (run.kind === 'rest') { const again = restAgain(up, k, prior, m, vb, models); if (again) { const was = findingsOf(up, again.first.lines.length ? m : m, vb); m = again.rest; models.push(again.first); notes.push(`the last run made again (SW-RPI-16): ${again.why}; ${was} findings before, ${again.after} after`); log(`unit ${up.unit}: the last run made again (SW-RPI-16): ${again.why}; findings ${was} → ${again.after}`); } }
    // SW-RPI-7: a line whose lane is shut at the outset, given the nearest other lane that is free and clear of what the earlier runs left
    if (m.failures.length && run.kind === 'rack' && run.lane && !kept) { const again = laneAgain(up, k, prior, m); if (again) { m = again.m; notes.push(again.note); log(`unit ${up.unit}: ${again.note}`); } }
    if (!kept && run.kind !== 'rest') cache?.put(k, run.lines, m);
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
    model = { ...models[models.length - 1], lines: [...up.lines.map(l => l.def.no), ...(up.feeds ?? []).map(f => f.stub.no)].map(no => byNo.get(no)!).filter(Boolean), failures: models.flatMap(m => m.failures), stats, cuts: models.flatMap(m => m.cuts ?? []) };
  }
  const joined = joinHeaders(model, up); if (joined.length) { notes.push(`${joined.length} header${joined.length > 1 ? 's' : ''} carried on in line to ${joined.length > 1 ? 'their block valves' : 'its block valve'} at the battery limit, the cap there left out (SW-RPI-15): ${joined.join('; ')}`); log(`unit ${up.unit}: ${joined.length} header${joined.length > 1 ? 's' : ''} joined to ${joined.length > 1 ? 'their valves' : 'its valve'} at the limit (SW-RPI-15)`); }
  const bared = removeValves(model, up); if (bared.length) { notes.push(...bared.map(c => `${c} (SW-RPI-14)`)); log(`unit ${up.unit}: ${bared.length} connection${bared.length > 1 ? 's' : ''} left without the generator's valve (SW-RPI-14)`); }
  const made = lengthenShortPieces(model); if (made.length) { notes.push(...made.map(c => `${c}: a make-up piece under 2 in beside a 45° offset, the offset moved along the run to make it 2 in (SW-RPI-11)`)); log(`unit ${up.unit}: ${made.length} make-up piece${made.length > 1 ? 's' : ''} under 2 in lengthened (SW-RPI-11)`); }
  const cut = cutLongPipes(model); if (cut.length) { notes.push(...cut.map(c => `${c}: a piece of pipe over 40 ft, cut again with a shop weld (SW-RPI-10)`)); log(`unit ${up.unit}: ${cut.length} piece${cut.length > 1 ? 's' : ''} of pipe over 40 ft cut again (SW-RPI-10)`); }
  return model;
}
/**
 * SW-RPI-15: a header at the battery limit. The generator lays a header from cap to cap and builds its block valve at the limit as a stub on the spool's inner face
 * (gasket, valve, gasket, blind). Here the two are made one line: the blind becomes a weld-neck flange on the same gasket and studs; the header's cap at that end is
 * taken off; its first piece is carried back to the flange and welded to it as it was welded to the cap; the valve's pieces go to the head of the header's list, and the
 * stub is no longer a line. A shoe like the header's others is set on each beam the lengthened piece crosses: the tier beam of the rack's first full bent, and the valve
 * bay's mid-bay beam for a header the generator carries at mid-bay too. Returns the headers joined.
 */
export function joinHeaders(m: PipingModel, up: Pick<UnitPiping, 'feeds' | 'cell'>): string[] {
  const done: string[] = [], d3 = (p: V3, q: V3) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  for (const f of up.feeds ?? []) {
    const H = m.lines.find(r => r.no === f.header), S = m.lines.find(r => r.no === f.stub.no); if (!H || !S) throw new Error(`${f.header}: the header or the stub of its valve at ${f.tag} is not in the generator's result (SW-RPI-15)`);
    const blind = S.comps.find(c => c.kind === 'blind'), cap = H.comps[0], pipe = H.comps[1], weld = cap && pipe ? H.welds.find(wd => wd.joins.includes(cap.tag) && wd.joins.includes(pipe.tag)) : undefined;
    if (!blind || S.comps[0].kind !== 'gasket' || !S.comps.some(c => c.kind === 'valve') || S.welds.length || cap?.kind !== 'cap' || pipe?.kind !== 'pipe' || !weld || d3(cap.b, pipe.a) > 0.01)
      throw new Error(`${f.header}: not a capped header and a valve stub SW-RPI-15 knows (${S.comps.map(c => c.kind).join(', ')}; ${H.comps.slice(0, 2).map(c => c.kind).join(', ')})`);
    // the flange in the blind's place: the generator sets either from the face it bolts by, in one frame
    const L0 = d3(blind.a, blind.b), w: V3 = [(blind.b[0] - blind.a[0]) / L0, (blind.b[1] - blind.a[1]) / L0, (blind.b[2] - blind.a[2]) / L0], fd = designFlange(blind.NPS, blind.cls), len = fd.rfH + fd.tf + fd.hubLen + fd.neckLen;
    const end: V3 = [blind.a[0] + w[0] * len, blind.a[1] + w[1] * len, blind.a[2] + w[2] * len], along = (pipe.a[0] - end[0]) * w[0] + (pipe.a[1] - end[1]) * w[1] + (pipe.a[2] - end[2]) * w[2];
    if (along < 2 || Math.abs(d3(pipe.a, end) - along) > 0.01 || blind.NPS !== pipe.NPS || blind.cls !== pipe.cls) throw new Error(`${f.header}: its valve at ${f.tag} does not stand in line with it (${along.toFixed(2)} in along, ${d3(pipe.a, end).toFixed(2)} in off)`);
    const was = pipe.a, tagOf = (i: number) => `${H.no}/L${i + 1}`, moveTo = <T extends number[]>(t: T, o: V3): T => [...t.slice(0, 12), o[0], o[1], o[2], 1] as unknown as T;
    const head: Comp[] = S.comps.map((c, i) => (c === blind ? { ...c, tag: tagOf(i), kind: 'flange', key: `WNF|${c.NPS}|${c.cls}`, b: end, e1: 'RF', e2: 'BW' } : { ...c, tag: tagOf(i) }));
    pipe.a = end; pipe.T = moveTo(pipe.T, end); pipe.key = `${pipe.key.split('|').slice(0, 3).join('|')}|${d3(pipe.a, pipe.b).toFixed(3)}`;
    weld.at = end; weld.T = moveTo(weld.T, end); weld.joins = [head[S.comps.indexOf(blind)].tag, pipe.tag];
    H.comps = [...head, ...H.comps.slice(1)]; H.from = S.from; H.path = [S.path[0], ...H.path.slice(1)];
    // a shoe on each beam the lengthened piece crosses, 6 in at least from the new weld
    const shoe = H.supports.find(sp => sp.type === 'shoe'), x0 = up.cell.rack.x0, bent = up.cell.rack.bentSpacing, midBay = H.supports.some(sp => Math.abs((((sp.at[0] - x0) % bent) + bent) % bent - bent / 2) < 1), added: number[] = [];
    if (shoe) for (const x of [x0, ...(midBay ? [x0 - bent / 2] : [])]) {
      if (x < end[0] + 6 || x > was[0] + 1e-6 || H.supports.some(sp => Math.abs(sp.at[0] - x) < 1)) continue;
      const ids = new Set(H.supports.map(sp => sp.id)); let k = H.supports.length + 1; while (ids.has(`${H.no}/S${k}`)) k++;
      H.supports.unshift({ ...shoe, id: `${H.no}/S${k}`, at: [x, shoe.at[1], shoe.at[2]], T: moveTo(shoe.T, [x, shoe.T[13], shoe.T[14]]) }); added.push(x);
    }
    m.lines = m.lines.filter(r => r !== S); m.stats.comps = (m.stats.comps ?? 0) - 1;
    done.push(`${H.no} from ${S.from}, its first piece ${(was[0] - end[0]).toFixed(1)} in longer${added.length ? `, a shoe at x ${added.join(' and ')}` : ''}`);
  }
  return done;
}
/**
 * SW-RPI-14: valves not built. At each end a line names (`UnitLine.bare`), what the generator stood between the nozzle and the line's own flange is taken out:
 * the valve, a blind or spade, a second valve with its stub and flanges, their gaskets and studs. The line's flange is brought up to the nozzle with the
 * gasket at the nozzle's face and the studs of the joint it made with the valve; the pipe behind it is lengthened by what was taken out, and its weld moves
 * with the flange. Returns the ends corrected.
 */
export function removeValves(m: PipingModel, up: Pick<UnitPiping, 'lines'>): string[] {
  const done: string[] = [], d3 = (p: V3, q: V3) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]), STACK = new Set(['gasket', 'spectacle', 'spade', 'valve', 'studs', 'flange']);
  for (const l of up.lines) for (const side of l.bare ?? []) {
    const r = m.lines.find(q => q.no === l.def.no); if (!r || !r.ok) continue;
    // from the nozzle outward. The generator builds a stack from its nozzle, so each of its pieces has its end `a` toward the nozzle at either end of a line; a pipe runs with the flow
    const cs = side === 'from' ? r.comps : [...r.comps].reverse(), near = 'a', far = 'b', pEnd = side === 'from' ? 'a' : 'b', end = l.def[side];
    // the last valve reached from the nozzle through nothing but the pieces of a valve stack and stubs under 12 in; the line's flange is the first after it
    let iv = -1; for (let i = 0; i < cs.length; i++) { const c = cs[i]; if (c.kind === 'valve') iv = i; else if (!(STACK.has(c.kind) || (c.kind === 'pipe' && d3(c.a, c.b) < 12))) break; }
    // behind that flange the line's pipe, or first a reducer where the line is of another size than the nozzle (it moves up with the flange)
    const iF = iv < 0 ? -1 : cs.findIndex((c, i) => i > iv && c.kind === 'flange'), g = cs[0], fl = cs[iF], behind = iF < 0 ? [] : cs.slice(iF + 1).filter(c => c.kind !== 'studs'), red = behind[0]?.kind === 'reducer' ? behind[0] : undefined, pipe = red ? behind[1] : behind[0], last = red ?? fl;
    if (iv < 0 || !fl || g.kind !== 'gasket' || !pipe || pipe.kind !== 'pipe' || d3(pipe[pEnd], last[far]) > 0.01 || (red && d3(red[near], fl[far]) > 0.01)) throw new Error(`${r.no}: its ${side} end is not a valve stack SW-RPI-14 knows (${cs.slice(0, 10).map(c => c.kind).join(', ')})`);
    const shift: V3 = [g[far][0] - fl[near][0], g[far][1] - fl[near][1], g[far][2] - fl[near][2]], add = (p: V3): V3 => [p[0] + shift[0], p[1] + shift[1], p[2] + shift[2]], moveT = <T extends number[]>(t: T): T => [...t.slice(0, 12), t[12] + shift[0], t[13] + shift[1], t[14] + shift[2], 1] as unknown as T;
    // the studs of the joint the flange made: those nearest its face; every other piece between the nozzle's gasket and the flange goes
    const studs = cs.slice(1, iF + 2).filter(c => c.kind === 'studs').sort((p, q) => d3([(p.a[0] + p.b[0]) / 2, (p.a[1] + p.b[1]) / 2, (p.a[2] + p.b[2]) / 2], fl[near]) - d3([(q.a[0] + q.b[0]) / 2, (q.a[1] + q.b[1]) / 2, (q.a[2] + q.b[2]) / 2], fl[near]))[0];
    const out = new Set(cs.slice(1, iF + 2).filter(c => c !== fl && c !== red && c !== studs && (c.kind !== 'pipe' || cs.indexOf(c) < iF)).map(c => c.tag)), valves = cs.filter(c => out.has(c.tag) && c.kind === 'valve').map(c => c.key.split('|').slice(1, 3).join(' '));
    for (const wd of r.welds) if ((wd.joins.includes(fl.tag) && d3(wd.at, fl[far]) < 0.01) || (red && wd.joins.includes(red.tag) && d3(wd.at, red[far]) < 0.01)) { wd.at = add(wd.at); wd.T = moveT(wd.T); }
    for (const c of [fl, ...(red ? [red] : []), ...(studs ? [studs] : [])]) { c.a = add(c.a); c.b = add(c.b); c.T = moveT(c.T); }
    pipe[pEnd] = add(pipe[pEnd]); if (pEnd === 'a') pipe.T = [...pipe.T.slice(0, 12), pipe.a[0], pipe.a[1], pipe.a[2], 1] as typeof pipe.T;
    pipe.key = `${pipe.key.split('|').slice(0, 3).join('|')}|${d3(pipe.a, pipe.b).toFixed(3)}`;
    const welds = r.welds.filter(wd => wd.joins.some(t => out.has(t))).length;
    r.comps = r.comps.filter(c => !out.has(c.tag)); r.welds = r.welds.filter(wd => !wd.joins.some(t => out.has(t)));
    m.stats.comps = (m.stats.comps ?? 0) - out.size; m.stats.welds = (m.stats.welds ?? 0) - welds;
    done.push(`${r.no}: no valve at ${end.k === 'nozzle' ? end.id : side}; ${valves.join(' and ')} and what stood with ${valves.length > 1 ? 'them' : 'it'} left out, ${out.size} pieces, the pipe ${d3(shift, [0, 0, 0]).toFixed(1)} in longer`);
  }
  return done;
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
export function pipeUnit(unit: number, log: (s: string) => void = () => {}, watch?: (plant: UnitPiping['plant']) => void, cache?: RunCache): { up: UnitPiping; model: PipingModel; result: PipedUnit } {
  const t0 = Date.now(), recut: string[] = [], up = unitPiping(unit), model = generateUnit(up, log, watch, recut, cache);
  // SW-RPI-17: supports where the generator's stepping stopped
  const sup = supportsAlongSpans(model, up.plant, valveBoxFn()); { const n = sup.hangers + sup.stanchions + sup.posts + sup.onSteel + sup.frames.length; if (n) { recut.push(spanNote(sup)); log(`unit ${unit}: ${spanNote(sup)}`); } }
  // SW-RPI-7: each line that runs the rack lies in the lane it was given; one found in another is said, and so is a header (their lanes are held where they were foreseen)
  const astray = up.foreseen.flatMap(L => { const r = L.no === undefined ? undefined : model.lines.find(l => l.no === L.no), z = r && r.ok ? laneOf(r, L.t) : undefined; return z !== undefined && Math.abs(z - L.z) > 1e-6 ? [`${L.no}: given the lane at z ${L.z} on tier ${L.t + 1}, routed at z ${z}`] : []; });
  const moved = up.headers.flatMap(h => { const r = model.lines.find(l => l.no === h.line), z = r?.path[0]?.[2]; return r && h.z !== undefined && z !== undefined && Math.abs(z - h.z) > 1e-6 ? [`${h.line}: foreseen in the lane at z ${h.z}, routed at z ${z}`] : []; });
  const aside: string[] = [], checks = unitChecks(model, up, aside), M = processModel(), sh = M.sheet(unit), count = (xs: string[]) => { const o: Record<string, number> = {}; for (const x of xs) o[x] = (o[x] ?? 0) + 1; return Object.fromEntries(Object.entries(o).sort()); };
  const lines: PipedLine[] = up.lines.map(l => { const r = model.lines.find(q => q.no === l.def.no)!; const fl = l.flow !== undefined ? sh.lines[l.flow] : undefined;
    return { no: l.def.no, origin: l.origin, fluid: l.fluid, fluidName: FLUIDS[l.fluid].name, from: r.from, to: r.to, NPS: l.def.NPS, cls: l.def.cls, designP: l.designP, designT: l.designT, routed: r.ok, components: r.comps.filter(c => c.kind !== 'studs').length, welds: r.welds.length, supports: r.supports.length, lengthFt: Math.round(pathLen(r) / 12), ...(l.tier !== undefined ? { tier: l.tier + 1 } : {}),
      ...(l.station ? { station: l.station } : {}), ...(fl?.cv && l.origin === 'process' ? { controlValve: l.cvOmitted ? 'omitted' as const : 'piped' as const } : {}) }; });
  const result: PipedUnit = {
    demonstration: true, unit, name: sh.name, frame: 'the unit\'s own (SW-CELL-1): inches, x from its battery limit along its rack, y up from its bench, z across the rack', runs: up.runs.length, tiers: up.tiers.map(t => t + 1), tierRoom: up.tierRoom, seconds: Math.round((Date.now() - t0) / 1000),
    stats: Object.fromEntries(Object.entries(model.stats).filter(([k]) => !k.startsWith('t_'))), failures: model.failures, checks, spools: up.spools, roots: up.roots, stations: up.stations, lines,
    counts: { components: count(model.lines.flatMap(r => r.comps.filter(c => c.kind !== 'studs').map(c => c.kind))), welds: count(model.lines.flatMap(r => r.welds.map(w => `${w.type}${w.field ? ', field' : ', shop'}`))), supports: count(model.lines.flatMap(r => r.supports.map(s => s.type))) },
    notes: [...up.notes, ...astray, ...moved, ...recut, ...aside], frames: sup.frames,
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
    const cv = u.lines.filter(l => l.controlValve || (l.origin === 'utility' && l.station));
    if (cv.length) out.push('### Control valve stations', '', 'Each stands at grade under the rack, on a spool that divides its line (SW-RPI-9): the flowsheet\'s control valves, and those of the utility connections that are fed or drained under control (boiler feed water to a steam generator, condensate from a steam heater: SW-PRC-19).', '', table(['Line', 'Station', 'Spool', 'Stands at (x, y, z), in', 'The line after it'], cv.map(l => { const st = u.stations.find(q => q.line === l.no); return [l.no, l.controlValve ?? 'piped', st?.tag ?? '—', st ? st.at.join(', ') : '—', st?.after ?? '—']; })), '');
    const joined = (u.notes ?? []).find(n => n.includes('(SW-RPI-15)'));
    if (joined) out.push('### Headers at the battery limit', '', `Each utility header ends at the limit in a block valve and a spool on the top tier, in its own lane, and runs straight through the valve; the plant's header joins it on the pipeway's side (SW-RPI-15, SW-PWY-12). ${joined.replace(' (SW-RPI-15)', '')}.`, '');
    const bare = (u.notes ?? []).filter(n => n.endsWith('(SW-RPI-14)'));
    if (bare.length) out.push('### Connections without a valve', '', 'At these ends the valve the generator stands at every equipment connection is not built, and the line\'s own flange meets the nozzle (SW-RPI-14): a transfer line from a fired heater, a line from a column\'s top, an ejector set\'s drains and its connections under its deck.', '', ...bare.map(n => `- ${n.replace(' (SW-RPI-14)', '')}`), '');
    if (u.stats.penetrations) out.push(`${u.stats.penetrations} floor penetration${u.stats.penetrations > 1 ? 's' : ''}: a sleeve where a line passes down through a deck's grating (SW-PEN-1).`, '');
    out.push('### Lines', '', table(['Line', 'Kind', 'Fluid', 'From', 'To', 'Design', 'Rack tier', 'Components', 'Welds', 'Supports', 'Length, ft'], u.lines.map(l => [l.no, l.origin, l.fluidName, l.from, l.to, `${l.designP} psi, ${l.designT} °F`, l.tier ?? '—', l.components, l.welds, l.supports, l.lengthFt])), '');
  }
  return out.join('\n');
}
