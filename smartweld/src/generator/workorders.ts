/**
 * Shutdown work orders (stage 7, DESIGN_BASIS.md §45–50). The facility owner's work list (drawing data) names the
 * task and its target; everything else — affected items, isolations and blinds, new welds, welding specification,
 * NDE, inspections, test, bolting, permits, parts and the ITP — is derived from the plant model and ground truth by
 * the SW-WO / SW-WPS / SW-NDE / SW-TEST / SW-ITP rules.
 *
 * DEMONSTRATION ONLY — NOT A QUALIFIED PROCEDURE; THE FACILITY OWNER'S QUALIFIED PROCEDURES AND APPLICABLE CODES GOVERN.
 */
import { CLASS_PRESSURE, pipeDims, STUD_FU, elbowRadius, type PipeClass } from '../catalogue';
import { partFromKey, type PipingModel } from './piping';
import { plantText, type GroundTruth, type GTLine, type GTItem, type GTEquipment, type PlantPt } from './groundtruth';
import { AREAS, areaOfLine, areaOfEquipment } from './areas';
import { formatLength } from '../core/units';

export const DEMO_NOTICE = 'DEMONSTRATION ONLY — NOT A QUALIFIED PROCEDURE; THE FACILITY OWNER\'S QUALIFIED PROCEDURES AND APPLICABLE CODES GOVERN.';

// ---- the owner's work list (drawing, SW-WO-1) -----------------------------------------------------------------
export type TaskType = 'VR' | 'SR' | 'GJ' | 'PR' | 'PO' | 'VI' | 'XB' | 'TI' | 'SP' | 'UT';
export const TASK_NAMES: Record<TaskType, string> = { VR: 'Valve replacement in kind', SR: 'Spool replacement', GJ: 'Flanged joint remake', PR: 'Relief valve bench test and reinstatement', PO: 'Pump overhaul', VI: 'Internal inspection', XB: 'Exchanger bundle pull, clean and tube-side test', TI: 'Tank internal inspection', SP: 'Pipe support replacement', UT: 'Ultrasonic thickness survey' };
interface WorkListEntry { area: string; type: TaskType; priority: 1 | 2 | 3; reason: string; line?: string; equipment?: string; nth?: number; valve?: string; count?: number }
export const OWNER_WORK_LIST: WorkListEntry[] = [
  { area: 'A100', type: 'TI', equipment: 'T-101', priority: 2, reason: 'Scheduled internal inspection of the shell, floor and roof.' },
  { area: 'A100', type: 'PR', line: '3"-P150-RV-4002', priority: 1, reason: 'Relief valve due for its periodic bench test.' },
  { area: 'A100', type: 'SR', line: '6"-P150-P-1001', nth: 2, priority: 2, reason: 'External corrosion found on the tank outlet line at the first bend.' },
  { area: 'A100', type: 'GJ', line: '2"-P300-LS-3007', nth: 1, priority: 1, reason: 'Steam leak at the tank heating-coil inlet flange.' },
  { area: 'A100', type: 'VR', line: '2"-P150-SC-3010', valve: 'GATE', nth: 1, priority: 3, reason: 'Condensate isolation valve passing; replace in kind.' },
  { area: 'A200', type: 'VI', equipment: 'C-101', priority: 2, reason: 'Scheduled internal inspection of the column.' },
  { area: 'A200', type: 'VI', equipment: 'V-101', priority: 2, reason: 'Scheduled internal inspection of the vessel.' },
  { area: 'A200', type: 'VR', line: '4"-P300-P-1021', valve: 'GATE', nth: 1, priority: 2, reason: 'Outlet isolation valve stem packing leaking and seat passing.' },
  { area: 'A200', type: 'UT', line: '6"-P300-P-1011', priority: 2, reason: 'Thickness survey of the column overhead line.' },
  { area: 'A200', type: 'SR', line: '6"-P300-P-1017', nth: 2, priority: 2, reason: 'Wall loss below the owner\'s minimum found by the last survey on the column bottoms line.' },
  { area: 'A300', type: 'XB', equipment: 'E-101', priority: 2, reason: 'Fouling: tube bundle to be pulled, cleaned and tested.' },
  { area: 'A300', type: 'XB', equipment: 'E-103', priority: 2, reason: 'Fouling: tube bundle to be pulled, cleaned and tested.' },
  { area: 'A300', type: 'VI', equipment: 'D-101', priority: 2, reason: 'Scheduled internal inspection of the drum.' },
  { area: 'A300', type: 'PR', line: '3"-P300-RV-4001', priority: 1, reason: 'Relief valve due for its periodic bench test.' },
  { area: 'A300', type: 'VR', line: '4"-P300-P-1005', valve: 'CONTROL', nth: 1, priority: 3, reason: 'Control valve trim worn; replace the valve in kind.' },
  { area: 'A300', type: 'SR', line: '4"-P150-CWS-3003', priority: 3, reason: 'Internal corrosion on the cooling water supply branch.' },
  { area: 'A400', type: 'PO', equipment: 'P-101A', priority: 3, reason: 'Mechanical seal leaking; overhaul seal and bearings.' },
  { area: 'A400', type: 'PO', equipment: 'P-103B', priority: 3, reason: 'High bearing vibration; overhaul seal and bearings.' },
  { area: 'A400', type: 'VR', line: '4"-P300-P-1008', valve: 'CHECK', nth: 1, priority: 2, reason: 'Discharge check valve slamming; replace in kind.' },
  { area: 'A400', type: 'GJ', line: '3"-P300-P-1015', nth: 6, priority: 2, reason: 'Weeping joint at the control valve station.' },
  { area: 'A400', type: 'SR', line: '4"-P300-P-1019', priority: 2, reason: 'Erosion at the pump discharge bend.' },
  { area: 'A500', type: 'SP', line: '8"-P150-FL-2009', count: 3, priority: 3, reason: 'Corroded shoes and guides on the flare header.' },
  { area: 'A500', type: 'UT', line: '6"-P300-LS-2003', priority: 2, reason: 'Thickness survey of the steam header.' },
  { area: 'A500', type: 'SR', line: '1"-P300-HS-5013', priority: 3, reason: 'Steam hose-station drop corroded at the elbow.' },
  { area: 'A500', type: 'VR', line: '1"-P150-HS-5011', valve: 'BALL', nth: 1, priority: 3, reason: 'Hose-station take-off valve at the water header seized.' },
];

// ---- records ----------------------------------------------------------------------------------------------------
export type Point = 'H' | 'W' | 'R' | 'S' | '—';
export interface ITPActivity { step: number; activity: string; reference: string; acceptance: string; record: string; contractor: Point; owner: Point; thirdParty: Point; status: 'open'; signoffs: { contractor: null; owner: null; thirdParty: null }; date: null; remark: '' }
export interface Isolation { seq: number; kind: 'valve' | 'blind' | 'electrical' | 'equipment' | 'removal'; tag: string; line: string; description: string; at?: PlantPt }
export interface NewWeld { id: string; replaces: string; line: string; NPS: number; cls: PipeClass; wall: number; shopField: 'shop' | 'field'; ws: string; nde: string[]; at: PlantPt; joins: [string, string] }
export interface TML { id: string; item: string; description: string; at: PlantPt; readings: string[]; nominalWall?: number }
export interface WorkOrder {
  number: string; title: string; area: string; areaName: string; type: TaskType; typeName: string; priority: number; issuedBy: string; notice: string;
  reason: string; scope: string[]; equipment?: string; lines: string[]; isometrics: string[]; items: string[];
  isolations: Isolation[]; permits: string[]; newWelds: NewWeld[]; weldSpecs: string[];
  nde: { method: string; extent: string; welds: string[]; basis: string }[]; inspections: { id: string; description: string; criteria: string; basis: string }[];
  tmls: TML[]; test: { kind: string; description: string; pressure?: number; hold?: string; basis: string } | null;
  bolting: { joint: string; studs: string; preloadPerStud: number; passes: number; basis: string }[];
  parts: { description: string; qty: number; replaces?: string }[]; itp: ITPActivity[]; rules: string[];
}

// ---- rule data -----------------------------------------------------------------------------------------------
/** SW-WPS-1: weld specification by joint */
export const WELD_SPECS: Record<string, { title: string; scope: string; process: string; filler: string; joint: string; preheat: string; interpass: string; pwht: string; rules: string[] }> = {
  'WS-01': { title: 'Butt welds, pipe grade, wall to 1/2 in', scope: 'Pipe, fittings and weld-neck flanges of Grade 35 pipe / Grade 36 forging, wall up to 1/2 in', process: 'Root: gas-shielded tungsten arc. Fill and cap: shielded metal arc.', filler: 'Root SW-F1 wire; fill and cap SW-F2 covered electrode (matching strength, low hydrogen)', joint: 'Single-V, 60° included, root opening 1/8 in, root face 1/16 in (SW-WD-4)', preheat: '≥ 30 °F above dew point and ≥ 60 °F, 3 in each side', interpass: '≤ 450 °F', pwht: 'Not specified (owner to state)', rules: ['SW-WPS-1', 'SW-WPS-2', 'SW-WPS-3', 'SW-WD-4'] },
  'WS-02': { title: 'Butt welds, pipe grade, wall over 1/2 in', scope: 'As WS-01, wall over 1/2 in', process: 'As WS-01', filler: 'As WS-01', joint: 'As WS-01', preheat: '≥ 150 °F, 3 in each side', interpass: '≤ 450 °F', pwht: 'Not specified (owner to state)', rules: ['SW-WPS-1', 'SW-WPS-2', 'SW-WPS-3', 'SW-WD-4'] },
  'WS-03': { title: 'Fillet welds of support attachments', scope: 'Shoes, guides and anchors to pipe or steel', process: 'Shielded metal arc throughout', filler: 'SW-F2 covered electrode', joint: 'Fillet, leg per the support part (SW-PS-12)', preheat: '≥ 30 °F above dew point and ≥ 60 °F', interpass: '≤ 450 °F', pwht: 'None', rules: ['SW-WPS-1', 'SW-WPS-2', 'SW-WPS-3', 'SW-PS-12'] },
};
const wsFor = (wall: number) => (wall <= 0.5 ? 'WS-01' : 'WS-02');
/** SW-NDE-2: volumetric extent by line-class fluid group */
const highConsequence = (lineClass: string) => ['H', 'S', 'F'].includes(lineClass[0]);
/** SW-WO-5: stud preload */
const studPreload = (d: number) => 0.5 * STUD_FU * 1000 * (Math.PI / 4) * d * d;

// ---- helpers --------------------------------------------------------------------------------------------------
const chainOf = (l: GTLine) => l.items.filter(i => i.kind !== 'studs');
const isIsolationValve = (i: GTItem) => i.kind === 'valve' && /VALVE, (GATE|FLOATING BALL|BALL)/.test(i.description) && !/CHECK|CONTROL/.test(i.description);
const act = (step: number, activity: string, reference: string, acceptance: string, record: string, contractor: Point, owner: Point, thirdParty: Point): ITPActivity =>
  ({ step, activity, reference, acceptance, record, contractor, owner, thirdParty, status: 'open', signoffs: { contractor: null, owner: null, thirdParty: null }, date: null, remark: '' });
const fmtP = (q: PlantPt) => plantText(q);

export function buildWorkOrders(m: PipingModel, gt: GroundTruth, equipment: GTEquipment[]): WorkOrder[] {
  const lineGT = new Map(gt.lines.map(l => [l.header.line, l] as const)), eqMap = new Map(equipment.map(e => [e.tag, e] as const));
  const seq = new Map<string, number>(), out: WorkOrder[] = [];
  for (const w of OWNER_WORK_LIST) {
    const n = (seq.get(w.area) ?? 0) + 1; seq.set(w.area, n);
    const number = `WO-${w.area.slice(1)}-${String(n).padStart(2, '0')}`;
    const wo: WorkOrder = { number, title: '', area: w.area, areaName: AREAS[w.area].name, type: w.type, typeName: TASK_NAMES[w.type], priority: w.priority, issuedBy: 'Facility owner (demonstration)', notice: DEMO_NOTICE,
      reason: w.reason, scope: [], lines: [], isometrics: [], items: [], isolations: [], permits: ['General work permit'], newWelds: [], weldSpecs: [], nde: [], inspections: [], tmls: [], test: null, bolting: [], parts: [], itp: [], rules: ['SW-WO-1', 'SW-WO-2', 'SW-ITP-1', 'SW-ITP-2', 'SW-ITP-3'] };
    const l = w.line ? lineGT.get(w.line) : undefined, e = w.equipment ? eqMap.get(w.equipment) : undefined;
    if (w.line && !l) throw new Error(`${number}: line ${w.line} not in the plant`);
    if (w.equipment && !e) throw new Error(`${number}: equipment ${w.equipment} not in the plant`);
    if (l && areaOfLine(m.lines.find(x => x.no === l.header.line)!) !== w.area && w.type !== 'SP' && w.type !== 'UT') throw new Error(`${number}: line ${l.header.line} is not in ${w.area}`);
    if (e && areaOfEquipment(e.tag) !== w.area) throw new Error(`${number}: ${e.tag} is not in ${w.area}`);
    if (l) { wo.lines.push(l.header.line); }
    if (e) wo.equipment = e.tag;
    const ctx = { wo, l, e, w, lineGT, m };
    switch (w.type) {
      case 'VR': valveReplacement(ctx); break;
      case 'GJ': jointRemake(ctx); break;
      case 'SR': spoolReplacement(ctx); break;
      case 'PR': reliefValve(ctx); break;
      case 'PO': pumpOverhaul(ctx); break;
      case 'VI': case 'XB': case 'TI': equipmentInternal(ctx); break;
      case 'SP': supportReplacement(ctx); break;
      case 'UT': thicknessSurvey(ctx); break;
    }
    wo.isometrics = wo.lines.map(x => `ISO-${x}`);
    wo.weldSpecs = [...new Set(wo.newWelds.map(x => x.ws))];
    wo.rules = [...new Set(wo.rules)].sort();
    out.push(wo);
  }
  return out;
}

type Ctx = { wo: WorkOrder; l?: GTLine; e?: GTEquipment; w: WorkListEntry; lineGT: Map<string, GTLine>; m: PipingModel };

/** SW-WO-3: nearest isolation valve on each side of chain positions [i0, i1], each with a blind on the work side */
function isolateAround(wo: WorkOrder, l: GTLine, i0: number, i1: number) {
  const c = chainOf(l);
  const side = (from: number, step: 1 | -1) => {
    for (let i = from; i >= 0 && i < c.length; i += step) if (isIsolationValve(c[i])) {
      let j = i - step; while (j >= 0 && j < c.length && c[j].kind === 'gasket') j -= step;               // flange next to the valve, on the work side
      const fl = c[j];
      push(wo, 'valve', c[i].tag, l.header.line, `Close and lock ${c[i].description} (${c[i].tag})`, c[i].centre);
      if (fl) push(wo, 'blind', fl.tag, l.header.line, `Fit a line blind between ${c[i].tag} and ${fl.description} (${fl.tag}), work side`, fl.a);
      return;
    }
    const end = step < 0 ? l.header.from : l.header.to;
    push(wo, end.startsWith('tap ') ? 'valve' : 'equipment', end, l.header.line, end.startsWith('tap ')
      ? `No valve on this side within the line: isolate the parent line ${end.slice(4)} or depressure it under the shutdown isolation`
      : `Line end at ${end}: the equipment is out of service, drained and isolated under the shutdown isolation`);
  };
  side(i0 - 1, -1); side(i1 + 1, 1);
  wo.rules.push('SW-WO-3');
}
function push(wo: WorkOrder, kind: Isolation['kind'], tag: string, line: string, description: string, at?: PlantPt) { wo.isolations.push({ seq: wo.isolations.length + 1, kind, tag, line, description, ...(at ? { at } : {}) }); }
/** SW-WO-3 for equipment: the first isolation valve from every nozzle, blinded at the nozzle side */
function isolateEquipment(wo: WorkOrder, e: GTEquipment, lineGT: Map<string, GTLine>) {
  for (const nz of e.nozzles) {
    const l = lineGT.get(nz.line!)!, c = chainOf(l), fromStart = l.header.from === nz.id || l.header.from === `PSV on ${nz.id}`;
    if (l.header.service === 'RV') { push(wo, 'removal', l.items.find(i => i.kind === 'valve')!.tag, l.header.line, `Remove the relief valve on ${nz.id} and blind the nozzle`); continue; }
    const order = fromStart ? c.map((_, i) => i) : c.map((_, i) => c.length - 1 - i);
    const k = order.find(i => isIsolationValve(c[i]));
    if (k === undefined) { push(wo, 'equipment', nz.id, l.header.line, `No valve on ${l.header.line}: isolate it at its far end (${fromStart ? l.header.to : l.header.from})`); continue; }
    const step = fromStart ? -1 : 1; let j = k + step; while (j >= 0 && j < c.length && c[j].kind === 'gasket') j += step;
    push(wo, 'valve', c[k].tag, l.header.line, `Close and lock ${c[k].description} (${c[k].tag}) on ${nz.id}`, c[k].centre);
    if (c[j]) push(wo, 'blind', c[j].tag, l.header.line, `Fit a blind between ${c[k].tag} and ${c[j].tag}, ${e.tag} side`, c[j].a);
    else push(wo, 'blind', nz.id, l.header.line, `Fit a blind between ${c[k].tag} and the nozzle flange ${nz.id}`, nz.face);   // the valve bolts straight to the nozzle
    if (!wo.lines.includes(l.header.line)) wo.lines.push(l.header.line);
  }
  wo.rules.push('SW-WO-3');
}
/** SW-WO-5 bolting of a remade joint (its stud set) */
function bolting(wo: WorkOrder, l: GTLine, gasket: GTItem) {
  const studs = l.items.find(i => i.kind === 'studs' && Math.hypot(i.centre.E - gasket.centre.E, i.centre.N - gasket.centre.N, i.centre.EL - gasket.centre.EL) < 0.01);
  if (!studs) return;
  const p = partFromKey(studs.key), d = p.dims.d.value, nst = p.dims.n.value;
  wo.bolting.push({ joint: gasket.tag, studs: `${nst} × ${d}" studs (${studs.tag})`, preloadPerStud: studPreload(d), passes: 3, basis: 'SW-WO-5' });
  wo.parts.push({ description: gasket.description, qty: 1, replaces: gasket.tag }, { description: studs.description, qty: 1, replaces: studs.tag });
  wo.rules.push('SW-WO-5', 'SW-NDE-5');
}
const gasketsNext = (l: GTLine, idx: number) => { const c = chainOf(l), g: GTItem[] = []; for (const k of [idx - 1, idx + 1]) if (c[k]?.kind === 'gasket') g.push(c[k]); return g; };

// ---- task builders ----------------------------------------------------------------------------------------------
function commonOpenITP(wo: WorkOrder, extra: ITPActivity[], test?: ITPActivity, entry = false) {
  const a: ITPActivity[] = [];
  let s = 0; const add = (x: Omit<ITPActivity, 'step'>) => a.push({ ...x, step: ++s } as ITPActivity);
  add(act(0, 'Work permit issued; isolation list (valves locked, blinds fitted) verified at zero pressure and drained', 'SW-WO-3, isolation list', 'Every isolation in place and tagged; zero pressure at the vent', 'Signed isolation certificate', 'H', 'H', '—'));
  if (entry) add(act(0, 'Equipment vented, purged and gas-tested for entry; confined-space entry permit issued', 'Owner entry procedure', 'Atmosphere safe for entry per owner limits', 'Gas test record, entry permit', 'H', 'H', '—'));
  for (const x of extra) add(x);
  if (test) add(test);
  add(act(0, 'Blinds removed, isolations returned to normal line-up per the isolation list', 'SW-WO-3', 'Every blind removed and accounted for', 'Isolation certificate closed', 'H', 'H', '—'));
  add(act(0, 'Records complete; work order handed back to operations', 'SW-ITP-3', 'All ITP activities accepted or not applicable', 'Signed ITP and completion record', 'H', 'H', 'R'));
  wo.itp = a;
}
function valveReplacement({ wo, l, w }: Ctx) {
  const c = chainOf(l!), valves = c.map((x, i) => [x, i] as const).filter(([x]) => x.kind === 'valve' && x.description.includes(w.valve === 'CHECK' ? 'CHECK' : w.valve === 'CONTROL' ? 'CONTROL' : w.valve!) && (w.valve !== 'GATE' || isIsolationValve(x)));
  const [v, i] = valves[(w.nth ?? 1) - 1]; if (!v) throw new Error(`${wo.number}: no ${w.valve} on ${l!.header.line}`);
  wo.title = `Replace ${v.description} (${v.tag})`;
  const g = gasketsNext(l!, i); wo.items = [v.tag, ...g.map(x => x.tag)];
  isolateAround(wo, l!, i - 1, i + 1);
  wo.scope = [`Isolate per the isolation list, drain and vent ${l!.header.line} between the isolations.`, `Unbolt and remove ${v.description} (${v.tag}) at ${fmtP(v.centre)}.`, `Inspect both flange faces (SW-NDE-5); dress or report damage.`, `Install a new ${v.description} of the same size, class and face-to-face (${v.designation}), with new gaskets and studs, stem orientation as removed.`, `Tighten the studs to the stated preload in three passes, cross pattern (SW-WO-5).`, `Remove blinds, restore the line-up, leak test the two joints on start-up (SW-TEST-2).`];
  wo.parts.push({ description: v.description, qty: 1, replaces: v.tag });
  for (const x of g) bolting(wo, l!, x);
  wo.inspections.push({ id: `${wo.number}-I1`, description: 'Flange faces of both joints before the new gaskets go in', criteria: 'No radial scratch across the sealing face (SW-NDE-5)', basis: 'SW-NDE-5' });
  wo.test = { kind: 'Service leak test', description: 'Both remade joints checked at operating pressure on start-up', basis: 'SW-TEST-2' };
  commonOpenITP(wo, [
    act(0, `Valve ${v.tag} removed; flange faces inspected`, 'SW-NDE-5', 'No radial scratch across the sealing face', 'Flange face inspection record', 'W', 'W', '—'),
    act(0, 'New valve verified: type, size, class, face-to-face and tag', `${v.designation}`, 'Matches the parts list and the line class', 'Material receiving record', 'R', 'R', '—'),
    act(0, 'New gaskets fitted, studs tightened to preload in three passes', 'SW-WO-5', `Preload per stud as stated; three passes, cross pattern`, 'Bolt-up record per joint', 'W', 'W', '—'),
  ], act(0, 'Service leak test of the remade joints on start-up', 'SW-TEST-2', 'No leak at either joint', 'Leak test record', 'W', 'W', '—'));
  wo.rules.push('SW-TEST-2');
}
function jointRemake({ wo, l, w }: Ctx) {
  const c = chainOf(l!), gaskets = c.map((x, i) => [x, i] as const).filter(([x]) => x.kind === 'gasket');
  const [g, i] = gaskets[Math.min(gaskets.length, w.nth ?? 1) - 1];
  wo.title = `Remake flanged joint ${g.tag} on ${l!.header.line}`;
  wo.items = [g.tag, c[i - 1]?.tag, c[i + 1]?.tag].filter(Boolean) as string[];
  isolateAround(wo, l!, i - 1, i + 1);
  wo.scope = [`Isolate per the isolation list, drain and vent ${l!.header.line}.`, `Break the joint at ${fmtP(g.centre)} between ${c[i - 1].description} and ${c[i + 1].description}.`, 'Inspect both flange faces (SW-NDE-5).', 'Fit a new gasket and new studs; tighten to the stated preload in three passes, cross pattern (SW-WO-5).', 'Remove blinds; leak test on start-up (SW-TEST-2).'];
  bolting(wo, l!, g);
  wo.inspections.push({ id: `${wo.number}-I1`, description: 'Flange faces before the new gasket goes in', criteria: 'No radial scratch across the sealing face (SW-NDE-5)', basis: 'SW-NDE-5' });
  wo.test = { kind: 'Service leak test', description: 'The remade joint checked at operating pressure on start-up', basis: 'SW-TEST-2' };
  commonOpenITP(wo, [
    act(0, 'Joint broken; both flange faces inspected', 'SW-NDE-5', 'No radial scratch across the sealing face', 'Flange face inspection record', 'W', 'W', '—'),
    act(0, 'New gasket fitted; studs tightened to preload in three passes', 'SW-WO-5', 'Preload per stud as stated', 'Bolt-up record', 'W', 'W', '—'),
  ], act(0, 'Service leak test on start-up', 'SW-TEST-2', 'No leak', 'Leak test record', 'W', 'W', '—'));
  wo.rules.push('SW-TEST-2');
}
function spoolReplacement({ wo, l, w, lineGT }: Ctx) {
  const L = l!, sp = w.nth ? L.spools[Math.min(L.spools.length, w.nth) - 1] : L.spools.reduce((a, b) => (b.items.length > a.items.length ? b : a)), members = new Set(sp.items), c = chainOf(L);
  const idx = c.map((x, i) => [x, i] as const).filter(([x]) => members.has(x.tag)).map(([, i]) => i), i0 = Math.min(...idx), i1 = Math.max(...idx);
  wo.title = `Replace spool ${sp.id.split('-').pop()} of ${L.header.line}`;
  wo.items = [...sp.items];
  isolateAround(wo, L, i0, i1);
  // SW-WO-4: every shop weld of the spool and every field weld at its ends is re-made
  const welds = L.welds.filter(x => x.shopField === 'shop' ? members.has(x.joins[0]) && members.has(x.joins[1]) : members.has(x.joins[0]) || members.has(x.joins[1]));
  for (const other of lineGT.values()) if (other !== L) for (const x of other.welds) if (members.has(x.joins[0]) || members.has(x.joins[1])) { welds.push(x); if (!wo.lines.includes(other.header.line)) wo.lines.push(other.header.line); }   // branch outlet welds on the spool's tees
  const wall = pipeDims(L.header.NPS, L.header.cls).t, hi = highConsequence(L.header.lineClass);
  welds.forEach((x, k) => { const wl = pipeDims(x.NPS, x.cls).t; wo.newWelds.push({ id: `${wo.number}-W${String(k + 1).padStart(2, '0')}`, replaces: x.tag, line: x.line, NPS: x.NPS, cls: x.cls, wall: wl, shopField: x.shopField, ws: wsFor(wl), nde: ['VT'], at: x.at, joins: x.joins }); });
  const vol = hi ? wo.newWelds : wo.newWelds.slice(0, Math.max(1, Math.ceil(0.1 * wo.newWelds.length)));
  for (const nw of vol) nw.nde.push('RT');
  wo.nde.push({ method: 'VT', extent: '100 % of new welds, before and after welding', welds: wo.newWelds.map(x => x.id), basis: 'SW-NDE-1' });
  wo.nde.push({ method: 'RT (UT where RT is impractical)', extent: hi ? `100 % of new welds (class ${L.header.lineClass}, high consequence)` : `10 % of new welds, at least one per welder (class ${L.header.lineClass}); welds shown are preliminary, final choice by the owner's inspector`, welds: vol.map(x => x.id), basis: 'SW-NDE-2' });
  // flanged ends of the spool: new gaskets and studs
  for (const k of [i0 - 1, i1 + 1]) if (c[k]?.kind === 'gasket') bolting(wo, L, c[k]);
  const spItems = L.items.filter(x => members.has(x.tag)), byDesc = new Map<string, number>();
  for (const x of spItems) byDesc.set(x.description, (byDesc.get(x.description) ?? 0) + 1);
  for (const [d, q] of byDesc) wo.parts.push({ description: d, qty: q });
  const pipeLen = spItems.filter(x => x.kind === 'pipe').reduce((a, x) => a + (x.cutLength ?? 0), 0);
  const P = CLASS_PRESSURE[L.header.cls], Pt = 1.4 * P;
  wo.permits.push('Hot work permit');
  wo.scope = [`Isolate per the isolation list; drain, vent and purge ${L.header.line} between the isolations; confirm gas-free for hot work.`,
    `Remove spool ${sp.id} (${spItems.length} items, ${formatLength(pipeLen)} of pipe) — cut at the field welds and break the flanged joints at its ends as listed.`,
    `Fabricate the replacement spool to ISO-${L.header.line} with the same items (parts list), welding to ${wsFor(wall)}; ${wo.newWelds.filter(x => x.shopField === 'shop').length} shop welds.`,
    `Install the spool; make ${wo.newWelds.filter(x => x.shopField === 'field').length} field welds; new gaskets and studs at flanged ends, tightened per SW-WO-5.`,
    `NDE per the NDE table; hydrostatic test at ${Pt.toFixed(0)} psi for 30 minutes with the relief valves blinded (SW-TEST-1).`,
    'Remove blinds, restore the line-up, hand back.'];
  wo.test = { kind: 'Hydrostatic test', description: `Test boundary between the isolations; relief valves blinded or removed`, pressure: Pt, hold: '30 minutes, no leak, no pressure drop', basis: 'SW-TEST-1' };
  const fitPoint: Point = hi ? 'H' : 'W';
  commonOpenITP(wo, [
    act(0, 'Line drained, vented and purged; gas-free for hot work', 'Owner hot-work procedure', 'Gas test within owner limits', 'Gas test record, hot work permit', 'H', 'H', '—'),
    act(0, 'Replacement materials verified against the parts list (size, class, grade, heat marking)', 'Parts list, SW-LC-3', 'All items match the line class', 'Material receiving record', 'R', 'R', 'R'),
    act(0, `Welding specification ${wsFor(wall)} and welder identification available at the work`, `${wsFor(wall)}, SW-WPS-3`, 'Specification on site; every welder identified', 'Welder list', 'R', 'R', 'R'),
    act(0, 'Fit-up of every new weld: root opening and alignment within the root face', 'SW-WPS-3, SW-WD-4', 'Root opening 1/8 in; bores aligned within 1/16 in', 'Fit-up record per weld', 'H', fitPoint, 'S'),
    act(0, 'Preheat and interpass temperatures maintained during welding', `${wsFor(wall)}, SW-WPS-2`, `Preheat ${WELD_SPECS[wsFor(wall)].preheat}; interpass ${WELD_SPECS[wsFor(wall)].interpass}`, 'Weld record per weld (welder, temperatures)', 'S', 'S', 'S'),
    act(0, 'Visual examination of every new weld', 'SW-NDE-1, SW-NDE-4', 'No crack, lack of fusion or incomplete penetration', 'VT report', 'W', 'W', 'W'),
    act(0, 'Volumetric examination per the NDE table; repairs re-examined', 'SW-NDE-2, SW-NDE-4', 'Acceptance per SW-NDE-4 and the owner\'s criteria', 'RT/UT reports', 'R', 'H', 'R'),
    act(0, 'Flanged ends: faces inspected, new gaskets, studs to preload', 'SW-NDE-5, SW-WO-5', 'No radial scratch; preload as stated', 'Bolt-up record', 'W', 'W', '—'),
  ], act(0, `Hydrostatic test at ${Pt.toFixed(0)} psi, 30 minutes`, 'SW-TEST-1', 'No leak, no pressure drop', 'Test record with gauge calibration', 'H', 'H', 'H'));
  wo.rules.push('SW-WO-4', 'SW-WO-5', 'SW-WPS-1', 'SW-WPS-2', 'SW-WPS-3', 'SW-NDE-1', 'SW-NDE-2', 'SW-NDE-4', 'SW-TEST-1');
}
function reliefValve({ wo, l, lineGT }: Ctx) {
  const v = l!.items.find(x => x.kind === 'valve')!, nozzle = l!.header.from, out = [...lineGT.values()].find(x => x.header.from === `PSV on ${nozzle}`)!;
  wo.title = `Bench test relief valve ${v.tag} on ${nozzle}`;
  const og = out.items.find(x => x.kind === 'gasket')!, ig = l!.items.find(x => x.kind === 'gasket')!;
  wo.items = [v.tag, ig.tag, og.tag]; wo.lines.push(out.header.line);
  push(wo, 'equipment', nozzle.split('-').slice(0, 2).join('-'), l!.header.line, `${nozzle.split('-').slice(0, 2).join('-')} depressured, drained and isolated under the shutdown isolation (no inlet valve)`);
  push(wo, 'blind', ig.tag, l!.header.line, `Blind the nozzle ${nozzle} once the valve is removed`, ig.a);
  push(wo, 'blind', og.tag, out.header.line, `Blind the outlet line ${out.header.line} at its first flange`, og.a);
  const P = CLASS_PRESSURE[l!.header.cls];
  wo.scope = [`Confirm ${nozzle.split('-').slice(0, 2).join('-')} depressured and isolated.`, `Unbolt and remove ${v.description} (${v.tag}); blind the nozzle and the outlet line.`, `Bench test: set pressure ${P} psi and seat tightness (SW-TEST-3); service the valve as found.`, 'Reinstall with new gaskets and studs, tightened per SW-WO-5; remove blinds.'];
  bolting(wo, l!, ig); bolting(wo, out, og);
  wo.test = { kind: 'Relief valve bench test', description: `Set pressure ${P} psi (class design pressure, PSV-1) and seat tightness`, pressure: P, basis: 'SW-TEST-3' };
  wo.permits.push('Lifting plan');
  commonOpenITP(wo, [
    act(0, 'Relief valve removed; nozzle and outlet blinded', 'SW-WO-3', 'Both openings blinded and tagged', 'Isolation certificate', 'W', 'W', '—'),
    act(0, 'As-found bench test (pop pressure recorded before any service)', 'SW-TEST-3', 'Recorded', 'Bench test record', 'W', 'W', 'W'),
    act(0, 'Set pressure and seat tightness after service', 'SW-TEST-3, PSV-1', `Set at ${P} psi; seat tight`, 'Bench test record, seal tag', 'H', 'H', 'W'),
    act(0, 'Valve reinstalled; new gaskets; studs to preload', 'SW-WO-5', 'Preload as stated', 'Bolt-up record', 'W', 'W', '—'),
  ]);
  wo.rules.push('SW-TEST-3', 'SW-WO-5');
}
function pumpOverhaul({ wo, e, lineGT }: Ctx) {
  wo.title = `Overhaul pump ${e!.tag} (mechanical seal and bearings)`;
  wo.items = [e!.tag];
  push(wo, 'electrical', `${e!.tag}-M`, '', `Motor of ${e!.tag}: isolated, locked and tried at the starter`);
  isolateEquipment(wo, e!, lineGT);
  const suction = lineGT.get(e!.nozzles.find(n => n.service === 'suction')!.line!)!, discharge = lineGT.get(e!.nozzles.find(n => n.service === 'discharge')!.line!)!;
  const gS = suction.header.to === `${e!.tag}-S` ? chainOf(suction).slice().reverse().find(x => x.kind === 'gasket')! : chainOf(suction).find(x => x.kind === 'gasket')!;
  const gD = discharge.header.from === `${e!.tag}-D` ? chainOf(discharge).find(x => x.kind === 'gasket')! : chainOf(discharge).slice().reverse().find(x => x.kind === 'gasket')!;
  bolting(wo, suction, gS); bolting(wo, discharge, gD);
  wo.parts.push({ description: `Mechanical seal kit for ${e!.tag}`, qty: 1 }, { description: `Bearing set for ${e!.tag}`, qty: 1 });
  wo.permits.push('Lifting plan');
  wo.scope = [`Isolate ${e!.tag} electrically and per the isolation list; drain the casing.`, 'Record as-found shaft alignment; remove the coupling guard and spacer.', 'Break the suction and discharge nozzle joints; remove the pump to the workshop.', 'Replace the mechanical seal and the bearings; inspect the impeller and wear rings.', 'Reinstall; new nozzle gaskets and studs tightened per SW-WO-5; align to the owner\'s alignment criteria.', 'Remove blinds and isolations; run test.'];
  wo.test = { kind: 'Run test', description: 'Running at duty: no seal leak; bearing temperature and vibration within the owner\'s limits', basis: 'SW-TEST-2' };
  commonOpenITP(wo, [
    act(0, 'As-found alignment recorded', 'Owner alignment procedure', 'Recorded', 'Alignment record', 'W', 'R', '—'),
    act(0, 'Seal and bearings replaced; impeller and wear rings inspected', 'Owner pump procedure', 'Clearances within the owner\'s criteria', 'Pump overhaul record', 'S', 'R', '—'),
    act(0, 'Nozzle joints remade with new gaskets; studs to preload', 'SW-WO-5', 'Preload as stated', 'Bolt-up record', 'W', 'W', '—'),
    act(0, 'Final alignment', 'Owner alignment procedure', 'Within the owner\'s alignment criteria', 'Alignment record', 'W', 'W', '—'),
  ], act(0, 'Run test at duty', 'SW-TEST-2', 'No seal leak; temperatures and vibration within owner limits', 'Run test record', 'W', 'H', '—'));
  wo.rules.push('SW-WO-5', 'SW-TEST-2');
}
/** SW-WO-6 equipment TMLs */
function equipmentTMLs(wo: WorkOrder, e: GTEquipment) {
  const d = Object.fromEntries(e.dims.map(x => [x.name, x.value])), out: TML[] = [];
  const add = (description: string, at: PlantPt, readings = ['0°', '90°', '180°', '270°']) => out.push({ id: `${wo.number}-TML${String(out.length + 1).padStart(2, '0')}`, item: e.tag, description, at, readings });
  for (const n of e.nozzles) add(`Nozzle neck ${n.id}`, n.face, ['top', 'side', 'bottom', 'side']);
  const o = e.origin;
  if (e.type === 'Cone-roof storage tank') {
    add('Floor centre', o, ['centre']);
    for (let h = 0; h <= d.H; h += 72) add(`Shell at ${formatLength(h)} above the floor`, { E: o.E, N: o.N, EL: o.EL + h });
  } else if (e.type === 'Vertical vessel') {
    const y0 = o.EL + d.skirtH; add('Bottom head centre', { ...o, EL: y0 - d.headDepth }, ['centre']); add('Top head centre', { ...o, EL: y0 + d.TT + d.headDepth }, ['centre']);
    for (let h = 0; h <= d.TT; h += 72) add(`Shell at ${formatLength(h)} above the lower tangent`, { ...o, EL: y0 + h });
  } else {
    add('Left head centre', { ...o, E: o.E - d.headDepth }, ['centre']); add('Right head centre', { ...o, E: o.E + d.TT + d.headDepth }, ['centre']);
    for (let x = 0; x <= d.TT; x += 72) add(`Shell at ${formatLength(x)} from the left tangent`, { ...o, E: o.E + x });
  }
  wo.tmls = out; wo.rules.push('SW-WO-6');
}
function equipmentInternal({ wo, e, lineGT, w }: Ctx) {
  const E = e!;
  wo.title = w.type === 'XB' ? `Pull, clean and test the tube bundle of ${E.tag}` : w.type === 'TI' ? `Internal inspection of tank ${E.tag}` : `Internal inspection of ${E.type.toLowerCase()} ${E.tag}`;
  wo.items = [E.tag];
  isolateEquipment(wo, E, lineGT);
  equipmentTMLs(wo, E);
  wo.permits.push('Confined-space entry permit'); if (w.type === 'XB') wo.permits.push('Lifting plan');
  const tubeCls = E.nozzles.find(n => n.service === 'tube in')?.cls, Pt = tubeCls ? 1.4 * CLASS_PRESSURE[tubeCls] : 0;
  wo.inspections.push({ id: `${wo.number}-I1`, description: `Internal visual examination of ${w.type === 'XB' ? 'the shell, channel and tube bundle' : w.type === 'TI' ? 'the shell, floor, roof structure and nozzles' : 'the shell, heads and nozzles'}`, criteria: 'Findings recorded against the owner\'s integrity criteria', basis: 'SW-NDE-4' });
  wo.inspections.push({ id: `${wo.number}-I2`, description: `Ultrasonic thickness at the ${wo.tmls.length} TMLs listed`, criteria: 'Each reading above the owner\'s minimum wall', basis: 'SW-WO-6' });
  if (w.type === 'TI') wo.inspections.push({ id: `${wo.number}-I3`, description: 'Floor scan for under-floor corrosion over the full floor', criteria: 'Owner\'s floor acceptance criteria', basis: 'SW-WO-6' });
  wo.scope = w.type === 'XB'
    ? [`Isolate ${E.tag} per the isolation list (tube and shell sides); drain and vent.`, 'Remove the channel cover; pull the tube bundle to the cleaning bay.', 'Clean the tubes and shell side; inspect visually; thickness at the TMLs.', `Reinstall the bundle with new gaskets; tube-side hydrostatic test at ${Pt.toFixed(0)} psi (SW-TEST-1).`, 'Remove blinds; restore the line-up.']
    : [`Isolate ${E.tag} per the isolation list; drain, vent, purge and gas-test for entry.`, 'Open for entry; clean as needed for inspection.', `Internal visual examination; ultrasonic thickness at the ${wo.tmls.length} TMLs${w.type === 'TI' ? '; floor scan' : ''}.`, 'Close with new gaskets on every opened joint; remove blinds; restore the line-up.'];
  wo.test = w.type === 'XB' ? { kind: 'Hydrostatic test (tube side)', description: 'Tube side of the reinstalled bundle', pressure: Pt, hold: '30 minutes, no leak, no pressure drop', basis: 'SW-TEST-1' } : { kind: 'Service leak test', description: 'Every opened joint checked at operating pressure on start-up', basis: 'SW-TEST-2' };
  commonOpenITP(wo, [
    act(0, w.type === 'XB' ? 'Channel cover removed; bundle pulled and cleaned' : 'Opened for entry; cleaned for inspection', 'Owner procedure', 'Surfaces clean enough to inspect', 'Daily report', 'S', 'S', '—'),
    act(0, 'Internal visual examination', 'SW-NDE-4', 'Findings recorded', 'Inspection report with photographs', 'W', 'H', 'W'),
    act(0, `Ultrasonic thickness at ${wo.tmls.length} TMLs`, 'SW-WO-6', 'Above the owner\'s minimum wall', 'Thickness record per TML', 'S', 'R', 'R'),
    ...(w.type === 'TI' ? [act(0, 'Floor scan', 'SW-WO-6', 'Owner\'s floor criteria', 'Floor scan report', 'S', 'R', 'R')] : []),
    act(0, 'Owner\'s decision on findings (repair, monitor or accept)', 'Owner integrity procedure', 'Decision recorded', 'Signed disposition', 'R', 'H', 'R'),
    act(0, 'Closed with new gaskets on every opened joint; studs to preload', 'SW-WO-5', 'Preload as stated', 'Bolt-up record', 'W', 'W', '—'),
  ], w.type === 'XB' ? act(0, `Tube-side hydrostatic test at ${Pt.toFixed(0)} psi, 30 minutes`, 'SW-TEST-1', 'No leak, no pressure drop', 'Test record', 'H', 'H', 'H') : act(0, 'Service leak test of opened joints on start-up', 'SW-TEST-2', 'No leak', 'Leak test record', 'W', 'W', '—'), true);
  wo.rules.push('SW-WO-5', 'SW-WO-6', w.type === 'XB' ? 'SW-TEST-1' : 'SW-TEST-2');
}
function supportReplacement({ wo, l, w }: Ctx) {
  const L = l!, picks = L.supports.filter(s => ['shoe', 'guide', 'anchor'].includes(s.type)).slice(0, w.count ?? 2);
  wo.title = `Replace ${picks.length} supports on ${L.header.line}`;
  wo.items = picks.map(s => s.tag);
  wo.permits.push('Hot work permit');
  picks.forEach((s, k) => wo.newWelds.push({ id: `${wo.number}-W${String(k + 1).padStart(2, '0')}`, replaces: s.tag, line: L.header.line, NPS: L.header.NPS, cls: L.header.cls, wall: 0, shopField: 'field', ws: 'WS-03', nde: ['VT', 'MT'], at: s.at, joins: [s.tag, L.header.line] }));
  wo.nde.push({ method: 'VT + MT', extent: '100 % of attachment fillet welds', welds: wo.newWelds.map(x => x.id), basis: 'SW-NDE-3' });
  for (const s of picks) wo.parts.push({ description: s.description, qty: 1, replaces: s.tag });
  wo.scope = [`Support ${L.header.line} temporarily either side of each support location.`, ...picks.map(s => `Cut out ${s.type} ${s.tag} at ${fmtP(s.at)}; prepare surfaces.`), 'Weld new supports to WS-03; VT and MT of every fillet weld (SW-NDE-3).', 'Remove temporary supports; check the line rests on every support.'];
  commonOpenITP(wo, [
    act(0, 'Temporary supports in place; line load taken', 'Owner rigging procedure', 'Line held at its elevation', 'Daily report', 'H', 'W', '—'),
    act(0, 'Old supports removed; pipe surface inspected under the support', 'SW-NDE-4', 'No wall loss beyond the owner\'s criteria (else raise a spool work order)', 'Inspection record', 'W', 'H', '—'),
    act(0, 'New supports welded to WS-03', 'WS-03, SW-WPS-3', 'Fit and leg as specified', 'Weld record', 'S', 'S', '—'),
    act(0, 'VT and MT of every attachment weld', 'SW-NDE-3', 'No crack or lack of fusion', 'VT/MT reports', 'W', 'R', 'R'),
  ]);
  wo.itp.shift(); wo.itp.splice(-2, 1); wo.itp.forEach((a, i) => (a.step = i + 1));     // no isolation for external work
  wo.rules.push('SW-WPS-1', 'SW-NDE-3', 'SW-PS-12');
}
function thicknessSurvey({ wo, l }: Ctx) {
  const L = l!, t = pipeDims(L.header.NPS, L.header.cls).t, OD = pipeDims(L.header.NPS, L.header.cls).OD;
  wo.title = `Ultrasonic thickness survey of ${L.header.line}`;
  const add = (it: GTItem, description: string, at: PlantPt) => wo.tmls.push({ id: `${wo.number}-TML${String(wo.tmls.length + 1).padStart(2, '0')}`, item: it.tag, description, at, readings: ['0°', '90°', '180°', '270°'], nominalWall: t });
  for (const it of L.items) {
    if (it.kind === 'elbow') {
      // extrados at mid-arc: from the arc centre through the mid-arc point to the outer surface (SW-WO-6)
      const a = [it.a.E, it.a.N, it.a.EL], b = [it.b.E, it.b.N, it.b.EL], R = elbowRadius(OD), node = L.nodes.find(n => n.ref === it.tag && n.kind === 'elbow work point')!;
      const wp = [node.at.E, node.at.N, node.at.EL], cc = a.map((v, k) => v + b[k] - wp[k]), dv = wp.map((v, k) => v - cc[k]), dl = Math.hypot(dv[0], dv[1], dv[2]);
      const ex = cc.map((v, k) => v + (dv[k] / dl) * (R + OD / 2));
      add(it, `Elbow ${it.tag} extrados`, { E: ex[0], N: ex[1], EL: ex[2] });
    } else if (it.kind === 'tee') add(it, `Tee ${it.tag} branch outlet`, it.centre);
    else if (it.kind === 'pipe' && (it.cutLength ?? 0) >= 24) add(it, `Pipe ${it.tag} mid-length`, it.centre);
  }
  wo.items = wo.tmls.map(x => x.item);
  wo.inspections.push({ id: `${wo.number}-I1`, description: `Ultrasonic thickness at ${wo.tmls.length} TMLs, four readings each`, criteria: `Nominal wall ${t} in; each reading above the owner's minimum wall`, basis: 'SW-WO-6' });
  wo.scope = [`Erect access and remove insulation at the TMLs where fitted (class ${L.header.lineClass}${L.header.insulated ? ', insulated' : ''}).`, `Calibrate the thickness gauge on a step block covering ${t} in.`, `Take four readings 90° apart at each of the ${wo.tmls.length} TMLs (SW-WO-6).`, 'Report readings against the owner\'s minimum wall; raise a spool replacement for any reading below it.'];
  wo.itp = [
    act(1, 'Gauge calibrated on a step block; operator qualification checked', 'Owner UT procedure', 'Calibration within the owner\'s tolerance', 'Calibration record', 'R', 'R', 'R'),
    act(2, `Readings at ${wo.tmls.length} TMLs`, 'SW-WO-6', 'Four readings per TML recorded', 'Thickness record per TML', 'S', 'S', 'S'),
    act(3, 'Results reviewed against the owner\'s minimum wall', 'Owner integrity procedure', 'Every reading above the minimum, or a work order raised', 'Signed thickness report', 'R', 'H', 'R'),
    act(4, 'Insulation and access reinstated; work order handed back', 'SW-ITP-3', 'All activities accepted', 'Signed ITP', 'H', 'H', 'R'),
  ];
  wo.rules.push('SW-WO-6');
}

