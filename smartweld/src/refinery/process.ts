/**
 * Plant 3's process model as one object (DESIGN_BASIS.md §74): the material balance, the flowsheet of every unit, the
 * streams that pass between units and the utility headers. Everything that sizes or places equipment and piping reads
 * this; it holds no geometry.
 */
import { balance, type Balance } from './balance';
import type { UnitSheet } from './flowsheet';
import type { State } from './fluids';
import { unit11, unit12 } from './units/crude';
import { unit13, unit14, unit15, unit16 } from './units/treating';
import { unit17 } from './units/cracking';
import { unit18 } from './units/sulfur';
import { unit19 } from './units/utilities';
import { unit20, unit21, unit22, unit23, unit24, unit25, unit26 } from './units/offsites';

/** a unit's end of a stream that crosses battery limits */
export interface Party { unit: number; w: number; s: State; /** a tank standing on the line: it takes the stream or gives it, not both, and neither in normal running */ standby?: boolean }
/**
 * How a stream between units flows: steadily; as an alternate route used when a unit is down; only while a ship or
 * truck is at the berth or rack, or a tank is being topped up; or collected from several small pump-outs.
 */
export type Carry = 'steady' | 'alternate' | 'intermittent' | 'collected';
export interface Transfer { key: string; fluid: string; carry: Carry; from: Party[]; to: Party[]; /** the site boundary supplies it or receives it */ boundary?: 'in' | 'out'; /** what stands at the open end of a stream with units at one end only */ where?: string; note: string }
/** a utility header: what unit 19 exports to it or takes from it, what other units make into it, and what they use */
export interface Header { fluid: string; key: string; dir: 'supply' | 'return'; capacity: number; made: Party[]; used: Party[] }
export interface ProcessModel { B: Balance; sheets: UnitSheet[]; sheet: (no: number) => UnitSheet; transfers: Transfer[]; headers: Header[] }

/** SW-REF-10: streams that do not flow steadily from one unit to another, and why */
const CARRY: Record<string, { carry: Carry; boundary?: 'in' | 'out'; where?: string; note: string }> = {
  'crude from the marine terminal': { carry: 'intermittent', note: 'while a tanker discharges' },
  'gasoline to the marine terminal': { carry: 'intermittent', note: 'while a cargo loads' },
  'jet fuel to the marine terminal': { carry: 'intermittent', note: 'while a cargo loads' },
  'diesel to the marine terminal': { carry: 'intermittent', note: 'while a cargo loads' },
  'fuel oil to the marine terminal': { carry: 'intermittent', note: 'while a cargo loads' },
  'gasoline to truck loading': { carry: 'intermittent', note: 'while trucks load' },
  'jet fuel to truck loading': { carry: 'intermittent', note: 'while trucks load' },
  'diesel to truck loading': { carry: 'intermittent', note: 'while trucks load' },
  'asphalt to truck loading': { carry: 'intermittent', note: 'while trucks load' },
  'three-carbon liquefied gas to loading': { carry: 'intermittent', note: 'while trucks load' },
  'four-carbon liquefied gas to loading': { carry: 'intermittent', note: 'while trucks load' },
  'slop oil': { carry: 'collected', note: 'pumped out of drums and sumps as they fill; the header is sized for the largest of them' },
  'slop oil to crude': { carry: 'intermittent', note: 'recovered oil worked off into the crude charge' },
  'fire water make-up': { carry: 'intermittent', note: 'refilling the fire water tanks' },
  'heavy naphtha to storage': { carry: 'alternate', note: 'when unit 14 is down' },
  'heavy naphtha from storage': { carry: 'alternate', note: 'when unit 13 is down' },
  'raw water': { carry: 'steady', boundary: 'in', where: 'the intake', note: 'from the intake at the site boundary' },
  'purchased gas': { carry: 'steady', boundary: 'in', where: 'the gas main', note: 'from the gas main at the site boundary' },
  'treated effluent': { carry: 'steady', boundary: 'out', where: 'the outfall', note: 'to the outfall' },
  'fire water ring main': { carry: 'intermittent', boundary: 'out', where: 'the ring main', note: 'to the ring main and its hydrants and monitors (noted, not drawn: SW-REF-11)' },
  'flare header': { carry: 'collected', boundary: 'in', where: 'every unit', note: 'from the relief valves of every unit, by the flare header in the pipeway' },
};
/** the utility headers: fluid, unit 19's battery-limit stream, and whether unit 19 supplies it or takes it back */
const HEADERS: [string, string, 'supply' | 'return'][] = [
  ['HS', 'high-pressure steam', 'supply'], ['MS', 'medium-pressure steam', 'supply'], ['LS', 'low-pressure steam', 'supply'], ['CO', 'condensate', 'return'], ['BW', 'boiler feed water', 'supply'],
  ['CWS', 'cooling water supply', 'supply'], ['CWR', 'cooling water return', 'return'], ['FG', 'fuel gas to users', 'supply'], ['IA', 'instrument air', 'supply'], ['PA', 'plant air', 'supply'],
  ['NI', 'nitrogen', 'supply'], ['RW', 'service water', 'supply'], ['CA', 'caustic', 'supply'],
];

let cache: ProcessModel | undefined;
export function processModel(): ProcessModel {
  if (cache) return cache;
  const B = balance(), sheets = [unit11, unit12, unit13, unit14, unit15, unit16, unit17, unit18, unit19, unit20, unit21, unit22, unit23, unit24, unit25, unit26].map(f => f(B));
  const headerKeys = new Set(HEADERS.map(h => h[1])), keys: string[] = [];
  for (const sh of sheets) for (const k of [...sh.blOut.keys(), ...sh.blIn.keys()]) if (!headerKeys.has(k) && !keys.includes(k)) keys.push(k);
  const transfers: Transfer[] = keys.map(key => {
    const from: Party[] = [], to: Party[] = [];
    for (const sh of sheets) { const o = sh.blOut.get(key), i = sh.blIn.get(key); if (o) from.push({ unit: sh.no, w: o.w, s: o }); if (i) to.push({ unit: sh.no, w: i.w, s: i }); }
    for (const p of from) if (to.some(q => q.unit === p.unit)) { p.standby = true; to.find(q => q.unit === p.unit)!.standby = true; }
    const c = CARRY[key] ?? { carry: 'steady' as Carry, note: '' };
    return { key, fluid: (to[0] ?? from[0]).s.fluid, carry: c.carry, from, to, ...(c.boundary ? { boundary: c.boundary } : {}), ...(c.where ? { where: c.where } : {}), note: c.note };
  });
  const headers: Header[] = HEADERS.map(([fluid, key, dir]) => {
    const s19 = sheets.find(s => s.no === 19)!, cap = (dir === 'supply' ? s19.blOut : s19.blIn).get(key);
    if (!cap) throw new Error(`unit 19 has no ${key}`);
    const made: Party[] = [], used: Party[] = [];
    for (const sh of sheets) {
      const sum = (d: 'to' | 'from') => sh.utils.filter(x => x.fluid === fluid && x.dir === d).reduce((a, x) => a + x.w, 0);
      const u = sum('to'), m = sum('from');
      if (u > 0) used.push({ unit: sh.no, w: u, s: cap }); if (m > 0) made.push({ unit: sh.no, w: m, s: cap });
    }
    return { fluid, key, dir, capacity: cap.w, made, used };
  });
  cache = { B, sheets, sheet: no => { const s = sheets.find(x => x.no === no); if (!s) throw new Error(`no unit ${no}`); return s; }, transfers, headers };
  return cache;
}
/** what the steady parties of a transfer send and receive, lb/h */
export const sent = (t: Transfer) => t.from.filter(p => !p.standby).reduce((a, p) => a + p.w, 0);
export const received = (t: Transfer) => t.to.filter(p => !p.standby).reduce((a, p) => a + p.w, 0);
