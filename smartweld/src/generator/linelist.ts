/**
 * The plant line list (SW-LL-*): the drawing of which lines exist, their size, class, service and ends.
 * Basis `drawing`; numbering by SW-LL-1.
 */
import type { PipeClass } from '../catalogue';
import { DEMO_LAYOUT } from './interior';

export type Service = 'P' | 'CWS' | 'CWR' | 'LS' | 'SC' | 'IA' | 'PA' | 'N' | 'W' | 'FL' | 'V' | 'D' | 'I' | 'SP' | 'HS' | 'RV' | 'CA';   // CA: conveying air with solids (plant 2)
export type V3 = [number, number, number];
export type EndRef =
  | { k: 'nozzle'; id: string }
  | { k: 'tap'; line: string; valve: boolean; near?: 'from' | 'to'; via?: 'tee' | 'olet' | 'tway' | 'fway' }   // branch from another line: tee or olet by size (SW-SWT-6) unless stated; a three-way or four-way valve station (3W-1, 4W-1); take-off valve on the branch if `valve`
  | { k: 'station'; at: V3 }                                           // hose station: free end, last leg downward to `at`, valve + blind
  | { k: 'blind' }                                                     // stub end: ball valve + blind flange
  | { k: 'psv'; nozzle: string };                                      // the outlet flange of the relief valve on `nozzle`
export interface LineDef { no: string; service: Service; NPS: number; cls: PipeClass; from: EndRef; to: EndRef; kind: 'header' | 'routed' | 'stub'; cv?: boolean }

const fmt = (n: number) => (n === 0.75 ? '3/4' : n === 0.5 ? '1/2' : String(n));
export const lineNo = (NPS: number, cls: PipeClass, svc: Service, seq: number) => `${fmt(NPS)}"-${cls}-${svc}-${seq}`;   // SW-LL-1

export function buildLineList(): LineDef[] {
  const L: LineDef[] = [];
  const add = (seq: number, service: Service, NPS: number, cls: PipeClass, from: EndRef, to: EndRef, kind: LineDef['kind'] = 'routed', cv = false) => {
    const d: LineDef = { no: lineNo(NPS, cls, service, seq), service, NPS, cls, from, to, kind, cv }; L.push(d); return d.no;
  };
  const nz = (id: string): EndRef => ({ k: 'nozzle', id });
  const tap = (line: string, valve = false): EndRef => ({ k: 'tap', line, valve });
  // ---- process (SW-LL-3: B pumps join the A lines with tees) ----
  let q = 1001;
  const proc = (a: string, b: string, NPS: number, cls: PipeClass, cv = false) => add(q++, 'P', NPS, cls, nz(a), nz(b), 'routed', cv);
  const branch = (fromNozzle: string, onLine: string, NPS: number, cls: PipeClass, toTap = true) => add(q++, 'P', NPS, cls, toTap ? nz(fromNozzle) : tap(onLine), toTap ? tap(onLine) : nz(fromNozzle));
  const s101 = proc('T-101-N1', 'P-101A-S', 6, 'P150'); branch('P-101B-S', s101, 6, 'P150', false);
  const d101 = proc('P-101A-D', 'E-101-N1', 4, 'P300'); branch('P-101B-D', d101, 4, 'P300');
  proc('E-101-N2', 'V-101-N1', 4, 'P300', true);
  const s102 = proc('V-101-N2', 'P-102A-S', 6, 'P300'); branch('P-102B-S', s102, 6, 'P300', false);
  const d102 = proc('P-102A-D', 'E-102-N1', 4, 'P300'); branch('P-102B-D', d102, 4, 'P300');
  proc('E-102-N2', 'C-101-N1', 4, 'P300', true);
  proc('C-101-N2', 'E-103-N3', 6, 'P300');
  proc('E-103-N4', 'D-101-N1', 6, 'P300');
  const s103 = proc('D-101-N2', 'P-103A-S', 4, 'P300'); branch('P-103B-S', s103, 4, 'P300', false);
  const d103 = proc('P-103A-D', 'C-101-N4', 3, 'P300', true); branch('P-103B-D', d103, 3, 'P300');
  const s104 = proc('C-101-N3', 'P-104A-S', 6, 'P300'); branch('P-104B-S', s104, 6, 'P300', false);
  const d104 = proc('P-104A-D', 'V-102-N1', 4, 'P300', true); branch('P-104B-D', d104, 4, 'P300');
  proc('V-102-N2', 'T-102-N2', 4, 'P300');
  const processLines = L.filter(l => l.service === 'P').map(l => l.no);
  // ---- utility headers on the rack, upper tier (SW-RT-1, SW-LL-4) ----
  const hdr: Record<string, string> = {};
  for (const [svc, NPS, cls] of [['CWS', 8, 'P150'], ['CWR', 8, 'P150'], ['LS', 6, 'P300'], ['SC', 3, 'P150'], ['IA', 2, 'P150'], ['PA', 2, 'P150'], ['N', 2, 'P150'], ['W', 3, 'P150'], ['FL', 8, 'P150']] as [Service, number, PipeClass][])
    hdr[svc] = add(2000 + Object.keys(hdr).length + 1, svc, NPS, cls, { k: 'blind' }, { k: 'blind' }, 'header');
  // ---- utility branches ----
  q = 3001;
  for (const e of ['E-101', 'E-102']) { add(q++, 'CWS', 4, 'P150', tap(hdr.CWS, true), nz(`${e}-N3`)); add(q++, 'CWR', 4, 'P150', nz(`${e}-N4`), tap(hdr.CWR, true)); }
  add(q++, 'CWS', 4, 'P150', tap(hdr.CWS, true), nz('E-103-N1')); add(q++, 'CWR', 4, 'P150', nz('E-103-N2'), tap(hdr.CWR, true));
  for (const t of ['T-101', 'T-102']) { add(q++, 'LS', 2, 'P300', tap(hdr.LS, true), nz(`${t}-N7`)); add(q++, 'SC', 2, 'P150', nz(`${t}-N8`), tap(hdr.SC, true)); }
  for (const id of ['V-101-N5', 'V-102-N5', 'C-101-N7', 'D-101-N6', 'T-101-N6', 'T-102-N6']) add(q++, 'N', 1, 'P150', tap(hdr.N, true), nz(id));
  for (const p of ['P-101A', 'P-101B', 'P-102A', 'P-102B', 'P-103A', 'P-103B', 'P-104A', 'P-104B']) add(q++, 'W', 0.75, 'P150', tap(hdr.W, true), nz(`${p}-F`));
  // ---- relief valves and their outlets to the flare header ----
  q = 4001;
  for (const id of ['D-101-N3', 'T-101-N3', 'T-102-N3']) { const cls: PipeClass = id.startsWith('D') ? 'P300' : 'P150'; add(q++, 'RV', 3, cls, nz(id), { k: 'blind' }, 'stub'); }
  for (const id of ['D-101-N3', 'T-101-N3', 'T-102-N3']) add(q++, 'FL', 4, 'P150', { k: 'psv', nozzle: id }, tap(hdr.FL, false));
  // ---- hose stations (north side of the rack, every bent except where pumps stand) ----
  q = 5001;
  const rk = DEMO_LAYOUT.rack;
  for (let xb: number = rk.x0; xb <= rk.x1; xb += rk.bentSpacing) {
    if (xb === 1440) continue;
    const svcs: [Service, number, PipeClass][] = [['W', 1, 'P150'], ['PA', 1, 'P150'], ['LS', 1, 'P300'], ['N', 1, 'P150'], ['IA', 0.5, 'P150']];
    svcs.forEach(([svc, NPS, cls], i) => add(q++, 'HS', NPS, cls, tap(hdr[svc], true), { k: 'station', at: [xb === rk.x1 ? xb - 102 + 18 * i : xb + 30 + 18 * i, 42, -132] }));   // in the bay beyond each bent; before the last one
  }
  // ---- equipment stubs: vents, drains, instruments, samples, unused process nozzles (SW-LL-3) ----
  q = 6001;
  const stub = (svc: Service, id: string, NPS: number, cls: PipeClass) => add(q++, svc, NPS, cls, nz(id), { k: 'blind' }, 'stub');
  for (const v of ['V-101', 'V-102']) { stub('V', `${v}-N3`, 1, 'P150'); stub('D', `${v}-N4`, 1, 'P150'); stub('I', `${v}-N6`, 0.75, 'P300'); stub('I', `${v}-N7`, 0.75, 'P300'); stub('SP', `${v}-N8`, 0.75, 'P300'); }
  stub('V', 'C-101-N5', 1, 'P150'); stub('D', 'C-101-N6', 1, 'P150'); stub('I', 'C-101-N8', 0.75, 'P300'); stub('I', 'C-101-N9', 0.75, 'P300'); stub('SP', 'C-101-N10', 0.75, 'P300');
  stub('V', 'D-101-N4', 1, 'P150'); stub('D', 'D-101-N5', 1, 'P150'); stub('I', 'D-101-N7', 0.75, 'P300'); stub('I', 'D-101-N8', 0.75, 'P300'); stub('SP', 'D-101-N9', 0.75, 'P300');
  for (const e of ['E-101', 'E-102', 'E-103']) { stub('V', `${e}-N5`, 1, 'P150'); stub('D', `${e}-N6`, 1, 'P150'); stub('I', `${e}-N7`, 0.75, 'P300'); }
  for (const t of ['T-101', 'T-102']) { stub('V', `${t}-N4`, 1, 'P150'); stub('D', `${t}-N5`, 1, 'P150'); stub('I', `${t}-N9`, 0.75, 'P150'); stub('I', `${t}-N10`, 0.75, 'P150'); }
  stub('P', 'T-101-N2', 4, 'P150'); stub('P', 'T-102-N1', 6, 'P150');
  // ---- taps on process lines: one instrument connection each, plus a sample point on every pump discharge ----
  q = 7001;
  for (const no of processLines) add(q++, 'I', 0.75, 'P300', tap(no, true), { k: 'blind' }, 'stub');
  for (const no of processLines.filter(n => L.find(l => l.no === n)!.from.k === 'nozzle' && /-D$/.test((L.find(l => l.no === n)!.from as { id: string }).id ?? ''))) add(q++, 'SP', 0.75, 'P300', tap(no, true), { k: 'blind' }, 'stub');
  const toNozzle = (no: string) => { const l = L.find(x => x.no === no)!; return l.to.k === 'nozzle' ? l.to.id : l.from.k === 'nozzle' ? l.from.id : ''; };
  for (const no of processLines.filter(n => /-S$/.test(toNozzle(n)))) add(q++, 'I', 0.75, 'P300', tap(no, true), { k: 'blind' }, 'stub');   // pump suction gauge connections
  // ---- header drains (one on each end) and a high-point vent on every header ----
  q = 8001;
  for (const h of Object.values(hdr)) for (const svc of ['D', 'D', 'V'] as Service[]) add(q++, svc, 0.75, 'P150', tap(h, true), { k: 'blind' }, 'stub');
  return L;
}
