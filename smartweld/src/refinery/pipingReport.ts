/**
 * Plant 3: a unit piped (DESIGN_BASIS.md §79). Runs the generator of plants 1 and 2 on the unit, sets the battery limit
 * spools on the lanes it gave (SW-RPI-4), runs that generator's own checks (§40) on the result, and writes what is found:
 * nothing is hidden, and a check that does not come to zero is listed.
 */
import { generatePiping, partFromKey, staticObstacles, type PipingModel, type Comp, type LineRun } from '../generator/piping';
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
export interface PipedUnit { demonstration: true; unit: number; name: string; frame: string; /** how many times the unit was generated (a second time where the battery limit spools had to follow the lanes taken) */ runs: number; /** the rack tiers its lines run on, 1 the lowest: one run of the generator each (SW-RPI-7) */ tiers: number[]; /** the width of lanes each tier is loaded to, in */ tierRoom: number; seconds: number; stats: Record<string, number>; failures: string[]; checks: UnitChecks; spools: BlSpool[]; /** branch root spools (SW-RPI-8) */ roots: RootSpool[]; /** control station spools (SW-RPI-9) */ stations: StationSpool[]; lines: PipedLine[]; counts: { components: Record<string, number>; welds: Record<string, number>; supports: Record<string, number> }; notes: string[] }

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
/** the generator's checks (§40) on a unit's piping, against the unit's real steel and equipment */
export function unitChecks(m: PipingModel, up: UnitPiping): UnitChecks {
  const vb = valveBoxFn(), byTag = new Map<string, Comp>(); for (const r of m.lines) for (const c of r.comps) byTag.set(c.tag, c);
  // the clearance check holds a 45° elbow as a 90° one's two legs, which reach beyond it; such a pair is measured again with the elbow's own legs (R tan 22.5°)
  const shapes = (c: Comp): K.Shape[] => { if (c.kind !== 'elbow' || !/\|45(\||$)/.test(c.key)) return K.compShapes(c, vb); const OD = pipeDims(c.NPS, c.cls).OD, leg = elbowRadius(OD) * Math.tan(Math.PI / 8), corner: V3 = [c.a[0] + c.T[8] * leg, c.a[1] + c.T[9] * leg, c.a[2] + c.T[10] * leg]; return [{ kind: 'cap', a: c.a, b: corner, r: OD / 2 }, { kind: 'cap', a: corner, b: c.b, r: OD / 2 }]; };
  const real = (v: string) => { const t = /^\S+ (\S+) – \S+ (\S+): /.exec(v), a = t && byTag.get(t[1]), b = t && byTag.get(t[2]); if (!a || !b || ![a, b].some(c => c.kind === 'elbow' && /\|45(\||$)/.test(c.key))) return true; return Math.min(...shapes(a).flatMap(x => shapes(b).map(y => K.gap(x, y)))) < 3; };
  return {
    continuity: K.checkContinuity(m), joints: K.checkJoints(m), elbows: K.checkElbowsAndStraights(m),
    valves: K.checkNumberingAndValves(m).filter(v => !v.startsWith('bad line number')),                    // plant 3's numbers carry a five-digit sequence (SW-REF-3)
    lineClearance: [...new Set(K.checkLineClearance(m, vb).violations)].filter(real),
    staticClearance: K.checkStaticClearance(m, staticObstacles([], up.cell.interior.instances, true).obstacles, vb),
    supports: K.checkSupports(m, up.plant.rack),
  };
}
/** the lane a line runs in on a tier of the rack: where it runs 20 ft or more along the rack at that tier's elevation */
function laneOf(r: LineRun, tier: number): number | undefined {
  for (let i = 1; i < r.path.length; i++) { const a = r.path[i - 1], b = r.path[i]; if (Math.abs(a[1] - b[1]) < 1e-6 && Math.abs(a[2] - b[2]) < 1e-6 && Math.abs(a[0] - b[0]) >= 240 && a[1] > RACK.tiers[tier] && a[1] < RACK.tiers[tier] + 24) return a[2]; }
  return undefined;
}
const pathLen = (r: LineRun) => r.path.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - r.path[i - 1][0], p[1] - r.path[i - 1][1], p[2] - r.path[i - 1][2]) : 0), 0);

/** SW-RPI-7: what a run leaves standing for the runs after it: each component by the shape the checks hold it by, each support by its part's box */
export function runSolids(m: PipingModel, vb: (c: Comp) => [V3, V3]): Placed[] {
  const out: Placed[] = [], add = (mn: V3, mx: V3) => { if ([0, 1, 2].every(k => mx[k] - mn[k] > 0.05)) out.push(block(mn, mx, 'earlier run')); };
  for (const r of m.lines) {
    for (const c of [...r.comps, ...(r.side ?? [])]) for (const sh of K.compShapes(c, vb)) {
      if (sh.kind === 'box') { add(sh.mn, sh.mx); continue; }
      const d = [sh.b[0] - sh.a[0], sh.b[1] - sh.a[1], sh.b[2] - sh.a[2]], L = Math.hypot(d[0], d[1], d[2]) || 1, e = d.map(v => sh.r * Math.sqrt(Math.max(0, 1 - (v / L) ** 2)));   // a cylinder's reach along each axis
      add([Math.min(sh.a[0], sh.b[0]) - e[0], Math.min(sh.a[1], sh.b[1]) - e[1], Math.min(sh.a[2], sh.b[2]) - e[2]], [Math.max(sh.a[0], sh.b[0]) + e[0], Math.max(sh.a[1], sh.b[1]) + e[1], Math.max(sh.a[2], sh.b[2]) + e[2]]);
    }
    for (const sp of r.supports) { const [mn, mx] = vb({ key: sp.key, T: sp.T } as Comp); add(mn, mx); }
  }
  return out;
}
/** SW-RPI-7: the generator run once for each tier in use, lowest first, each run seeing the ones before it; the runs' results as one model */
export function generateUnit(up: UnitPiping, log: (s: string) => void = () => {}, watch?: (plant: UnitPiping['plant']) => void): PipingModel {
  const vb = valveBoxFn(), models: PipingModel[] = []; let prior: Placed[] = [];
  for (const [k, t] of up.tiers.entries()) {
    const plant = up.passPlant(k, prior), t0 = Date.now(); watch?.(plant);
    const m = generatePiping({ plant, only: l => up.passOf.get(l.no) === k }); models.push(m);
    if (up.tiers.length > 1) log(`unit ${up.unit}: tier ${t + 1}, ${m.stats.routed} of ${m.lines.filter(l => l.kind !== 'stub').length} lines routed, ${m.failures.length} failures, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    if (k < up.tiers.length - 1) prior = [...prior, ...runSolids(m, vb)];
  }
  if (models.length === 1) return models[0];
  const byNo = new Map(models.flatMap(m => m.lines.map(r => [r.no, r] as const))), stats: Record<string, number> = {};
  for (const m of models) for (const [key, v] of Object.entries(m.stats)) stats[key] = (stats[key] ?? 0) + v;
  return { ...models[models.length - 1], lines: up.lines.map(l => byNo.get(l.def.no)!).filter(Boolean), failures: models.flatMap(m => m.failures), stats };
}

/** SW-RPI-1, SW-RPI-4: pipe a unit; where a battery limit line took another lane than foreseen, set the spools from the lanes it took and pipe it once more */
export function pipeUnit(unit: number, log: (s: string) => void = () => {}, watch?: (plant: UnitPiping['plant']) => void): { up: UnitPiping; model: PipingModel; result: PipedUnit } {
  const t0 = Date.now(); let up = unitPiping(unit), model = generateUnit(up, log, watch), runs = 1;
  const taken = () => { const m = new Map<string, number>(); for (const s of up.spools) { const r = model.lines.find(l => l.no === s.line), z = r && r.ok ? laneOf(r, s.tier) : undefined; if (z !== undefined) m.set(s.line, z); } return m; };
  // on each tier, the spools in the order of the lanes their lines took
  const sortedOn = (lanes: Map<string, number>) => RACK.tiers.every((_, t) => { const zs = up.spools.filter(s => s.tier === t && lanes.has(s.line)).sort((a, b) => a.at[2] - b.at[2]).map(s => lanes.get(s.line)!); return zs.every((v, i) => !i || zs[i - 1] <= v); });
  let lanes = taken();
  log(`unit ${unit}: run 1, ${model.stats.routed} of ${model.lines.filter(l => l.kind !== 'stub').length} routed, ${model.failures.length} failures, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  if (!sortedOn(lanes)) { up = unitPiping(unit, lanes); model = generateUnit(up, log, watch); runs = 2; lanes = taken(); log(`unit ${unit}: run 2 with the spools on the lanes taken, ${model.failures.length} failures`); }
  // SW-RPI-7: the headers' lanes were held in the earlier runs where they were foreseen; one found elsewhere is said
  const moved = up.headers.flatMap(h => { const r = model.lines.find(l => l.no === h.line), z = r?.path[0]?.[2]; return r && h.z !== undefined && z !== undefined && Math.abs(z - h.z) > 1e-6 ? [`${h.line}: foreseen in the lane at z ${h.z}, routed at z ${z}`] : []; });
  const checks = unitChecks(model, up), M = processModel(), sh = M.sheet(unit), count = (xs: string[]) => { const o: Record<string, number> = {}; for (const x of xs) o[x] = (o[x] ?? 0) + 1; return Object.fromEntries(Object.entries(o).sort()); };
  const lines: PipedLine[] = up.lines.map(l => { const r = model.lines.find(q => q.no === l.def.no)!; const fl = l.flow !== undefined ? sh.lines[l.flow] : undefined;
    return { no: l.def.no, origin: l.origin, fluid: l.fluid, fluidName: FLUIDS[l.fluid].name, from: r.from, to: r.to, NPS: l.def.NPS, cls: l.def.cls, designP: l.designP, designT: l.designT, routed: r.ok, components: r.comps.filter(c => c.kind !== 'studs').length, welds: r.welds.length, supports: r.supports.length, lengthFt: Math.round(pathLen(r) / 12), ...(l.tier !== undefined ? { tier: l.tier + 1 } : {}),
      ...(l.station ? { station: l.station } : {}), ...(fl?.cv && l.origin === 'process' ? { controlValve: l.cvOmitted ? 'omitted' as const : 'piped' as const } : {}) }; });
  const result: PipedUnit = {
    demonstration: true, unit, name: sh.name, frame: 'the unit\'s own (SW-CELL-1): inches, x from its battery limit along its rack, y up from its bench, z across the rack', runs, tiers: up.tiers.map(t => t + 1), tierRoom: up.tierRoom, seconds: Math.round((Date.now() - t0) / 1000),
    stats: Object.fromEntries(Object.entries(model.stats).filter(([k]) => !k.startsWith('t_'))), failures: model.failures, checks, spools: up.spools.map(s => ({ ...s, ...(lanes.has(s.line) ? { lane: lanes.get(s.line) } : {}) })), roots: up.roots, stations: up.stations, lines,
    counts: { components: count(model.lines.flatMap(r => r.comps.filter(c => c.kind !== 'studs').map(c => c.kind))), welds: count(model.lines.flatMap(r => r.welds.map(w => `${w.type}${w.field ? ', field' : ', shop'}`))), supports: count(model.lines.flatMap(r => r.supports.map(s => s.type))) },
    notes: [...up.notes, ...moved],
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
    out.push(`${u.lines.length} lines: ${u.lines.filter(l => l.origin === 'process').length} of the flowsheet, ${u.lines.filter(l => l.origin === 'spare').length} to installed spares and parallel bodies, ${u.lines.filter(l => l.origin === 'header').length} utility headers and ${u.lines.filter(l => l.origin === 'utility').length} utility connections${u.lines.some(l => l.origin === 'control') ? `, ${u.lines.filter(l => l.origin === 'control').length} parts of lines after their control stations (SW-RPI-9)` : ''}${u.lines.some(l => l.origin === 'root') ? `, and ${u.lines.filter(l => l.origin === 'root').length} connections to branch root spools (SW-RPI-8)` : ''}. ${u.tiers.length > 1 ? `The lines that run the rack are on ${u.tiers.length} of its tiers (SW-RPI-7), no tier loaded beyond ${u.tierRoom} in of lanes at any section: ${u.tiers.map(t => `tier ${t} ${u.lines.filter(l => l.tier === t).length} lines`).join(', ')}.` : 'The lines that run the rack are all on its lowest tier.'} Generated ${u.runs > 1 ? 'twice, the second time with the battery limit spools set on the lanes the lines took' : 'once'}.`, '');
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
