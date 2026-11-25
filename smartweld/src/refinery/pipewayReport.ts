/**
 * Plant 3: the main pipeway piped (DESIGN_BASIS.md §80). Runs the generator of plants 1 and 2 on the pipeway as it is run
 * on a unit (SW-RPI-7, SW-PWY-6), takes out the valves that are not built (SW-PWY-7), runs that generator's own checks
 * (§40) on the result against the steel as it stands, and writes what is found: nothing is hidden.
 */
import type { PipingModel, LineRun } from '../generator/piping';
import { generateUnit, unitChecks, type UnitChecks } from './pipingReport';
import type { UnitPiping } from './unitPiping';
import { pipeway, PWY, type Pipeway, type LimitSpool, type Junction, type StreamPlan, type PipewayLine } from './pipeway';
import { FLUIDS } from './fluids';

export interface PipewayLineRec { no: string; origin: PipewayLine['origin']; stream: string; fluid: string; fluidName: string; from: string; to: string; NPS: number; cls: string; designP: number; designT: number; routed: boolean; components: number; welds: number; supports: number; lengthFt: number; /** the main tier it runs on, 1 the lowest */ tier?: number; /** the lane it runs in, z in the pipeway's frame */ lane?: number }
export interface PipedPipeway {
  demonstration: true; area: number; name: string; frame: string; rack: { lengthFt: number; widthFt: number; tiersFt: number[]; bays: number }; runs: number; tiers: number[]; tierRoom: number; seconds: number;
  stats: Record<string, number>; failures: string[]; checks: UnitChecks; limits: LimitSpool[]; junctions: Junction[]; streams: StreamPlan[]; skipped: Pipeway['skipped']; lines: PipewayLineRec[];
  counts: { components: Record<string, number>; welds: Record<string, number>; supports: Record<string, number> }; notes: string[];
}
const pathLen = (r: LineRun) => r.path.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - r.path[i - 1][0], p[1] - r.path[i - 1][1], p[2] - r.path[i - 1][2]) : 0), 0);
/** the lane a line runs in on a tier of the main rack: where its longest stretch along the rack at that tier's elevation lies, if that is 8 ft or more */
export function mainLaneOf(r: LineRun, tier: number): number | undefined {
  let best = 96 - 1e-6, z: number | undefined;
  for (let i = 1; i < r.path.length; i++) { const a = r.path[i - 1], b = r.path[i], L = Math.abs(a[0] - b[0]); if (Math.abs(a[1] - b[1]) < 1e-6 && Math.abs(a[2] - b[2]) < 1e-6 && L > best && a[1] > PWY.tiers[tier] && a[1] < PWY.tiers[tier] + 24) { best = L; z = a[2]; } }
  return z;
}
/** the pipeway as the generator's runner and checks take a unit (SW-PWY-6): its runs, its lines, its steel as it stands */
export const asUnit = (pw: Pipeway): UnitPiping => ({ unit: PWY.area, runs: pw.runs, runPlant: pw.runPlant, lines: pw.lines, cell: { interior: pw.interior }, plant: pw.plant } as unknown as UnitPiping);

/** SW-PWY-6, SW-PWY-7: pipe the main pipeway */
export function pipePipeway(log: (s: string) => void = () => {}, watch?: (plant: UnitPiping['plant']) => void): { pw: Pipeway; model: PipingModel; result: PipedPipeway } {
  const t0 = Date.now(), pw = pipeway(), up = asUnit(pw), notes: string[] = [], model = generateUnit(up, log, watch, notes);
  // a unit's spool is the unit's own and stands in its model: the pipeway keeps the limit spools it sets itself
  const own = new Set(pw.limits.map(l => l.tag)); model.nozzles = model.nozzles.filter(n => own.has(n.equip));
  const astray = pw.foreseen.flatMap(L => { const r = L.no === undefined ? undefined : model.lines.find(l => l.no === L.no), z = r && r.ok ? mainLaneOf(r, L.t) : undefined; return z !== undefined && Math.abs(z - L.z) > 1e-6 ? [`${L.no}: given the lane at z ${L.z} on tier ${L.t + 1}, routed at z ${z}`] : []; });
  const aside: string[] = [], checks = unitChecks(model, up, aside), count = (xs: string[]) => { const o: Record<string, number> = {}; for (const x of xs) o[x] = (o[x] ?? 0) + 1; return Object.fromEntries(Object.entries(o).sort()); };
  const lines: PipewayLineRec[] = pw.lines.map(l => {
    const r = model.lines.find(q => q.no === l.def.no)!, L = pw.foreseen.find(q => q.no === l.def.no);
    return { no: l.def.no, origin: l.origin, stream: l.stream, fluid: l.fluid, fluidName: FLUIDS[l.fluid].name, from: r.from, to: r.to, NPS: l.def.NPS, cls: l.def.cls, designP: l.designP, designT: l.designT, routed: r.ok, components: r.comps.filter(c => c.kind !== 'studs').length, welds: r.welds.length, supports: r.supports.length, lengthFt: Math.round(pathLen(r) / 12), ...(l.tier !== undefined ? { tier: l.tier + 1 } : {}), ...(L ? { lane: L.z } : {}) };
  });
  const result: PipedPipeway = {
    demonstration: true, area: PWY.area, name: 'Main pipeway', frame: 'the pipeway\'s own (SW-PWY-1): inches, x east along the rack from its west end, y up from the bench, z south from its centre line',
    rack: { lengthFt: (PWY.bays * PWY.bent) / 12, widthFt: (2 * PWY.half) / 12, tiersFt: PWY.tiers.map(t => t / 12), bays: PWY.bays }, runs: pw.runs.length, tiers: pw.tiers.map(t => t + 1), tierRoom: pw.tierRoom, seconds: Math.round((Date.now() - t0) / 1000),
    stats: Object.fromEntries(Object.entries(model.stats).filter(([k]) => !k.startsWith('t_'))), failures: model.failures, checks, limits: pw.limits, junctions: pw.junctions, streams: pw.streams, skipped: pw.skipped, lines,
    counts: { components: count(model.lines.flatMap(r => r.comps.filter(c => c.kind !== 'studs').map(c => c.kind))), welds: count(model.lines.flatMap(r => r.welds.map(w => `${w.type}${w.field ? ', field' : ', shop'}`))), supports: count(model.lines.flatMap(r => r.supports.map(s => s.type))) },
    notes: [...pw.notes, ...astray, ...notes, ...aside],
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
};
export function pipewayDocument(r: PipedPipeway): string {
  const out: string[] = [], dirOf = (p: StreamPlan['parties'][number]) => `${p.party} ${p.sends ? 'sends' : 'receives'}${p.role === 'branch' ? ` (a ${p.NPS} in branch)` : ''}`;
  out.push('# Plant 3: the main pipeway', '');
  out.push('> **Demonstration data.** Written by `tools/refinery-pipeway.ts`; do not edit by hand.', '');
  out.push(`The main pipeway joins the units (DESIGN_BASIS.md §80): a rack ${r.rack.lengthFt} ft long and ${r.rack.widthFt} ft wide down the corridor between the two rows, tiers at ${r.rack.tiersFt.join(', ')} ft, and on it a line for every stream between units that has a party on the process bench, from one unit's battery-limit spool to the other's. It is piped in its own frame by the generator of plants 1 and 2, unchanged, as each unit is: what the generator is given is the rack, the units' spools as connections, a line list drawn from the process model's streams, and where lines may travel. Its own checks (§40) are then run on the result against the steel as it stands, and reported here as they come out.`, '');
  out.push(table(['Lines', 'Routed', 'Components', 'Welds', 'Supports', 'Pipe, ft', 'Failures', 'Checks not at zero'], [[r.lines.length, r.lines.filter(l => l.routed).length, fmt(Object.values(r.counts.components).reduce((a, b) => a + b, 0)), fmt(Object.values(r.counts.welds).reduce((a, b) => a + b, 0)), fmt(Object.values(r.counts.supports).reduce((a, b) => a + b, 0)), fmt(r.lines.reduce((a, l) => a + l.lengthFt, 0)), r.failures.length, Object.entries(r.checks).filter(([, v]) => v.length).map(([k, v]) => `${k} ${v.length}`).join(', ') || 'none']]), '');
  out.push(`${r.lines.length} lines: ${r.lines.filter(l => l.origin === 'main').length} streams' lines, ${r.lines.filter(l => l.origin === 'branch').length} branches to the further parties of streams that have more than two, and ${r.lines.filter(l => l.origin === 'limit').length} valves with their blinds beyond the limit spools (SW-PWY-4). The lines that run the rack are on ${r.tiers.length} of its tiers (${r.tiers.map(t => `tier ${t} ${r.lines.filter(l => l.tier === t).length} lines`).join(', ')}), each in a lane given it beforehand, no tier loaded beyond ${r.tierRoom} in of lanes at any section; the top tier is kept for the utility headers of the next stage. The generator was run ${r.runs} times: once for each line that runs the rack, with its branches, and once for the rest.`, '');
  out.push(table(['Component', 'Count'], Object.entries(r.counts.components)), '');
  out.push(table(['Welds', 'Count'], Object.entries(r.counts.welds)), '', table(['Supports', 'Count'], Object.entries(r.counts.supports)), '');
  out.push('## Checks', '');
  out.push(table(['Check (the generator\'s own, §40)', 'Found'], [['every line continuous from end to end', r.checks.continuity.length], ['every joint a joint of its class', r.checks.joints.length], ['elbows and the straights between them', r.checks.elbows.length], ['valves by class and size', r.checks.valves.length], ['3 in between lines', r.checks.lineClearance.length], ['3 in from steel and equipment', r.checks.staticClearance.length], ['spans within SW-PS-7, a support at every rack beam crossed', r.checks.supports.length]]), '');
  if (r.failures.length) out.push('Reported by the generator:', '', ...r.failures.map(f => `- ${f}`), '');
  for (const [k, v] of Object.entries(r.checks) as [string, string[]][]) if (v.length) out.push(`Not at zero, ${k}:`, '', ...v.map(s => `- ${s}`), '');
  out.push('## Streams', '', 'Each stream\'s line, and who is on it (SW-PWY-3). A stream with more than two parties runs between the two furthest apart along the rack; the others join by branches.', '');
  out.push(table(['Stream', 'Line', 'Design', 'Tier', 'Lane, z in', 'Parties', 'Branches'], r.streams.map(s => { const l = r.lines.find(q => q.no === s.main)!; return [s.stream, s.main, `${s.designP} psi, ${s.designT} °F`, l.tier ?? 'direct', l.lane ?? '—', s.parties.map(dirOf).join('; '), s.branches.join(', ') || '—']; })), '');
  out.push('## Limit spools', '', 'Where a party is not yet piped the line ends at a spool of the pipeway\'s own, with the party\'s block valve and a blind beyond it (SW-PWY-4).', '');
  out.push(table(['Spool', 'Stands in', 'At (x, y, z), in', 'Size, class', 'Party', 'Stream', 'Line', 'Valve and blind'], r.limits.map(l => [l.tag, l.where, l.at.join(', '), `${l.NPS} in, ${l.cls}`, `${l.party} ${l.sends ? 'sends' : 'receives'}`, l.stream, l.line, l.stub])), '');
  out.push('## Junction frames', '', 'At each unit\'s limit: two posts in line with the columns of the unit\'s rack and a beam between them under each main tier, from which the lines that cross to the rack hang (SW-PWY-9).', '');
  out.push(table(['Unit', 'Along the rack, x in', 'Side', 'Span, ft', 'Beams under main tiers', 'Beam', 'Posts'], r.junctions.map(j => [j.unit, j.x, j.z > 0 ? 'south' : 'north', (2 * j.half) / 12, j.tiers.map(t => t + 1).join(', '), j.beam, j.post])), '');
  out.push('## Not on the main pipeway', '', table(['Stream', 'Why'], r.skipped.map(s => [s.stream, s.why])), '');
  if (r.notes.length) out.push('## Notes', '', ...r.notes.map(n => `- ${n}`), '');
  out.push('## Lines', '', table(['Line', 'Kind', 'Stream', 'Fluid', 'From', 'To', 'Design', 'Tier', 'Components', 'Welds', 'Supports', 'Length, ft'], r.lines.map(l => [l.no, l.origin, l.stream, l.fluidName, l.from, l.to, `${l.designP} psi, ${l.designT} °F`, l.tier ?? '—', l.components, l.welds, l.supports, l.lengthFt])), '');
  return out.join('\n');
}
