/**
 * Plant 3: the cooling water mains piped by the generator of plants 1 and 2, checked, and written up (DESIGN_BASIS.md §81, SW-CWM-*).
 */
import type { PipingModel, LineRun } from '../generator/piping';
import { squareWelds } from './welds';
import { FLUIDS } from './fluids';
import { coolingWater, CWM, type CwBranch, type CwMain, type CwSpool } from './coolingWater';
import { unitChecks, valveBoxFn, spanNote, removeValves, lengthenShortPieces, cutLongPipes, runSolids } from './pipingReport';
import { generatePiping } from '../generator/piping';
import type { Placed } from '../generator/building';
import { supportsAlongSpans, supportsThatStrike, valvesThatStrike, hangerTops, waferStuds, type FrameSpec } from './supports';
import type { UnitPiping } from './unitPiping';

export interface CwLineRec { no: string; origin: string; stream: string; fluid: string; fluidName: string; from: string; to: string; NPS: number; cls: string; designP: number; designT: number; routed: boolean; components: number; welds: number; supports: number; lengthFt: number }
export interface PipedCoolingWater {
  demonstration: true; area: number; name: string; frame: string; seconds: number; sleepers: number; way: { x0: number; x1: number; centreZ: number; sleeperTopIn: number };
  stats: Record<string, number>; failures: string[]; checks: Record<string, string[]>; mains: CwMain[]; branches: CwBranch[]; spools: CwSpool[]; lines: CwLineRec[];
  counts: { components: Record<string, number>; welds: Record<string, number>; supports: Record<string, number> }; notes: string[]; frames: FrameSpec[];
}
const pathLen = (r: LineRun) => r.path.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - r.path[i - 1][0], p[1] - r.path[i - 1][1], p[2] - r.path[i - 1][2]) : 0), 0);

export function pipeCoolingWater(log: (s: string) => void = () => {}): { model: PipingModel; result: PipedCoolingWater } {
  const t0 = Date.now(), cw = coolingWater(), notes: string[] = [];
  const up = { unit: CWM.area, runs: cw.runs, runOf: cw.runOf, runPlant: cw.runPlant, lines: cw.lines, cell: { interior: cw.interior, rack: cw.rack }, plant: cw.plant, foreseen: cw.foreseen } as unknown as UnitPiping;
  // SW-CWM-4: the supply's run, then the return's; each run's valves not built are taken out (SW-PWY-7) before its lines stand as solids for the next
  const vb = valveBoxFn(), models: PipingModel[] = [], prior: Placed[] = [];
  for (const [k, run] of cw.runs.entries()) {
    const mine = new Set(run.lines), t1 = Date.now(), m = generatePiping({ plant: cw.runPlant(k, prior), only: l => mine.has(l.no) });
    const bared = removeValves(m, { lines: cw.lines.filter(l => mine.has(l.def.no)) } as never); if (bared.length) notes.push(...bared.map(c => `${c} (SW-PWY-7)`));
    log(`area ${CWM.area}: run ${k + 1} of ${cw.runs.length}, ${run.lines[0]} and its branches: ${m.stats.routed} of ${m.lines.filter(l => l.kind !== 'stub').length} routed, ${m.failures.length} failures, ${((Date.now() - t1) / 1000).toFixed(0)} s`);
    for (const f of m.failures) log(`   ${f}`);
    models.push(m); prior.push(...runSolids(m, vb));
  }
  const byNo = new Map(models.flatMap(m => m.lines.map(r => [r.no, r] as const))), stats: Record<string, number> = {};
  for (const m of models) for (const [key, v] of Object.entries(m.stats)) stats[key] = (stats[key] ?? 0) + v;
  const model: PipingModel = { ...models[models.length - 1], lines: cw.lines.map(l => byNo.get(l.def.no)!).filter(Boolean), failures: models.flatMap(m => m.failures), stats, cuts: models.flatMap(m => m.cuts ?? []), nozzles: models.flatMap(m => m.nozzles) };
  const made = lengthenShortPieces(model); if (made.length) notes.push(...made.map(c => `${c}: a make-up piece under 2 in beside a 45° offset, the offset moved along the run to make it 2 in (SW-RPI-11)`));
  const cut = cutLongPipes(model); if (cut.length) notes.push(`${cut.length} pieces of pipe over 40 ft cut again with a shop weld (SW-RPI-10)`);
  void up;
  // the limit spools are the area's own; a unit's spool stands in its model
  const own = new Set(cw.spools.map(s => s.tag)); model.nozzles = [...new Map(model.nozzles.filter(n => own.has(n.equip)).map(n => [n.id, n])).values()];
  // SW-CWM-7: SW-RPI-17's correction, against the real steel and solids (no keep-outs)
  const real = { ...cw.plant, interior: () => cw.interior };
  { const vt = valvesThatStrike(model, real, vb); if (vt.turned.length || vt.stuck.length) notes.push(`${vt.turned.length} valves turned where their stem or handwheel struck (SW-RPI-19)${vt.turned.length ? `: ${vt.turned.join('; ')}` : ''}${vt.stuck.length ? `; ${vt.stuck.length} with no clear direction, left: ${vt.stuck.join('; ')}` : ''}`); }
  { const sw = squareWelds(model); if (sw.length) notes.push(`${sw.length} butt welds set square to their joints (SW-RPI-24)`); }
  const ht0 = hangerTops(model, real);   // SW-RPI-20 first (amended 2026-11-27), then again for what SW-RPI-17 sets
  const struck = supportsThatStrike(model, real, vb); if (struck.length) { notes.push(`${struck.length} supports taken out where their rod, post or leg struck another line, steel or another support (SW-RPI-18): ${struck.join('; ')}`); log(`area ${CWM.area}: ${struck.length} supports that strike taken out (SW-RPI-18)`); }
  const sup = supportsAlongSpans(model, real, vb); { const n = sup.hangers + sup.stanchions + sup.posts + sup.onSteel + sup.frames.length; if (n) { notes.push(spanNote(sup)); log(`area ${CWM.area}: ${spanNote(sup)}`); } }
  { const ht = [...ht0, ...hangerTops(model, real)], ws = waferStuds(model); if (ht.length) notes.push(`${ht.length} hangers' rods made to reach the underside of the steel they hang from (SW-RPI-20)`); if (ws.length) notes.push(`${ws.length} wafer valves bolted with one stud set through both flanges (SW-RPI-21)`); }
  const aside: string[] = [], checks = unitChecks(model, { cell: { interior: cw.interior, rack: cw.rack }, plant: real } as unknown as UnitPiping, aside);
  const count = (xs: string[]) => { const o: Record<string, number> = {}; for (const x of xs) o[x] = (o[x] ?? 0) + 1; return Object.fromEntries(Object.entries(o).sort()); };
  // the lanes the mains were given against those foreseen (SW-CWM-2)
  for (const m of cw.mains) { const r = model.lines.find(q => q.no === m.line); if (!r?.ok) continue; let best = 0, z: number | undefined; for (let i = 1; i < r.path.length; i++) { const a = r.path[i - 1], b = r.path[i], L = Math.abs(a[0] - b[0]); if (Math.abs(a[2] - b[2]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6 && L > best) { best = L; z = a[2]; } } if (z !== undefined && Math.abs(z - m.lane) > 1e-6) notes.push(`${m.line}: foreseen in the lane at z ${m.lane}, laid at z ${z} (SW-CWM-2)`); }
  const lines: CwLineRec[] = cw.lines.map(l => {
    const r = model.lines.find(q => q.no === l.def.no)!;
    return { no: l.def.no, origin: l.origin, stream: l.stream, fluid: l.fluid, fluidName: FLUIDS[l.fluid as keyof typeof FLUIDS].name, from: r?.from ?? '', to: r?.to ?? '', NPS: l.def.NPS, cls: l.def.cls, designP: l.designP, designT: l.designT, routed: !!r?.ok, components: r ? r.comps.filter(c => c.kind !== 'studs').length : 0, welds: r ? r.welds.length : 0, supports: r ? r.supports.length : 0, lengthFt: r ? Math.round(pathLen(r) / 12) : 0 };
  });
  const result: PipedCoolingWater = {
    demonstration: true, area: CWM.area, name: 'Cooling water mains', frame: `the main pipeway's (SW-PWY-1) moved ${-CWM.way} in north (SW-CWM-1): inches, x east from the rack's west end, y up from the bench, z south from the sleeper way's centre line`,
    seconds: Math.round((Date.now() - t0) / 1000), sleepers: cw.sleepers.length, way: { x0: cw.rack.x0, x1: cw.rack.x1, centreZ: CWM.way, sleeperTopIn: CWM.sleeperTop },
    stats: Object.fromEntries(Object.entries(model.stats).filter(([k]) => !k.startsWith('t_'))), failures: model.failures, checks: checks as unknown as Record<string, string[]>, mains: cw.mains, branches: cw.branches, spools: cw.spools, lines,
    counts: { components: count(model.lines.flatMap(r => r.comps.filter(c => c.kind !== 'studs').map(c => c.kind))), welds: count(model.lines.flatMap(r => r.welds.map(w => `${w.type}${w.field ? ', field' : ', shop'}`))), supports: count(model.lines.flatMap(r => r.supports.map(s => s.type))) },
    notes: [...cw.notes, ...notes, ...aside], frames: sup.frames,
  };
  return { model, result };
}

const table = (head: string[], rows: (string | number)[][]) => [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n');
const fmt = (n: number) => n.toLocaleString('en-US');
export const COOLING_WATER_IMAGES: Record<string, string> = {
  'cooling-water-from-the-tower': 'Plant 3, the cooling water mains: the two 30 in mains leaving the cooling tower plot\'s limit spools and turning west along the corridor on their sleepers',
  'cooling-water-risers': 'Plant 3, the cooling water mains: a unit\'s supply and return branches rising from the mains to its header spools at its limit, the main rack beyond',
  'cooling-water-along-the-way': 'Plant 3, the cooling water mains from their west end, looking east along the sleeper way under the main rack\'s north columns',
};
export function coolingWaterDocument(r: PipedCoolingWater): string {
  const out: string[] = [];
  out.push('# Plant 3: the cooling water mains', '', '> **Demonstration data.** Written by `tools/refinery-cooling-water.ts`; do not edit by hand.', '');
  out.push(`The two cooling water mains (DESIGN_BASIS.md §81) lie on ${r.sleepers} concrete sleepers at grade in the corridor's north strip, ${-r.way.centreZ} in north of the main rack's centre line, from the cooling tower plot's south edge to ${Math.round(r.way.x0 / 12)} ft east of the rack's west end, with a branch to each unit's cooling water header spool at its limit. Piped by the generator of plants 1 and 2, unchanged; frame: ${r.frame}.`, '');
  const tot = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0), bad = Object.entries(r.checks).filter(([, v]) => v.length);
  out.push(table(['Lines', 'Routed', 'Components', 'Welds', 'Supports', 'Pipe, ft', 'Failures', 'Checks not at zero'], [[r.lines.filter(l => l.origin !== 'limit').length, r.lines.filter(l => l.routed && l.origin !== 'limit').length, fmt(tot(r.counts.components)), fmt(tot(r.counts.welds)), fmt(tot(r.counts.supports)), fmt(r.lines.reduce((a, l) => a + l.lengthFt, 0)), r.failures.length, bad.length ? bad.map(([k, v]) => `${k} ${v.length}`).join(', ') : 'none']]), '');
  out.push('## Mains', '', table(['Main', 'Line', 'Design', 'Lane, z in', 'Axis above grade, in'], r.mains.map(m => [m.stream, m.line, `${m.designP} psi, ${m.designT} °F`, m.lane, m.y])), '');
  out.push('## Branches', '', table(['Unit', 'Stream', 'Spool', 'Branch', 'Size, in', 'Routed'], r.branches.map(b => [b.unit, b.stream, b.spool, b.line, b.NPS, r.lines.find(l => l.no === b.line)?.routed ? 'yes' : 'no'])), '');
  out.push('## Limit spools', '', table(['Spool', 'Main', 'Where', 'Beyond it'], r.spools.map(s => [s.tag, s.line, s.where, `block valve and blind (${s.stub})`])), '');
  out.push(table(['Component', 'Count'], Object.entries(r.counts.components)), '', table(['Welds', 'Count'], Object.entries(r.counts.welds)), '', table(['Supports', 'Count'], Object.entries(r.counts.supports)), '');
  out.push('## Checks', '', table(['Check (the generator\'s own, §40, against everything SW-CWM-5 shows as solid)', 'Found'], Object.entries(r.checks).map(([k, v]) => [k, v.length])), '');
  if (r.failures.length) out.push('Reported by the generator:', '', ...r.failures.map(f => `- ${f}`), '');
  for (const [k, v] of bad) out.push(`Not at zero, ${k}:`, '', ...v.map(s => `- ${s}`), '');
  if (r.notes.length) out.push('## Notes', '', ...r.notes.map(n => `- ${n}`), '');
  out.push('Not in this stage (SW-CWM-8): the cooling tower plot\'s own piping; the mains end at its edge, each at a limit spool with its block valve and blind.', '');
  return out.join('\n');
}
