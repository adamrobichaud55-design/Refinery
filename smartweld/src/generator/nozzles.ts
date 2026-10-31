/**
 * Equipment nozzles (SW-NOZ-*). The nozzle schedule is the plant's drawing (basis `drawing`):
 * which equipment, service, size, class and where on the shell. World positions follow from the
 * stage-3 layout (DEMO_LAYOUT) and the equipment rules (SW-EQ-*).
 */
import { designFlange, makeValve, type PipeClass } from '../catalogue';
import { DEMO_LAYOUT } from './interior';

export type V3 = [number, number, number];
export interface Nozzle { id: string; equip: string; service: string; NPS: number; cls: PipeClass; A: V3; u: V3; face: V3; S: number }

type Place =
  | { on: 'shell'; e: number; dir: '+x' | '-x' | '+z' | '-z' }                 // radial on a vertical shell at absolute elevation e
  | { on: 'top'; dx: number; dz: number }                                   // on a vertical vessel's top head / tank roof at a plan offset
  | { on: 'hshell'; x: number; side: 'top' | 'bottom' | '+z' | '-z' }        // on a horizontal shell at an absolute x
  | { on: 'suction' } | { on: 'discharge' } | { on: 'flush' };

interface NozzleDef { equip: string; id: string; service: string; NPS: number; cls: PipeClass; at: Place }

const L = DEMO_LAYOUT, E = L.equipment, yVessel = L.padHeight + 1.5 + 0.75;
/** equipment geometry needed to place nozzles */
interface Geo { kind: 'vv' | 'hv' | 'pump' | 'tank'; x: number; z: number; R: number; yb?: number; yt?: number; yc?: number; s?: 1 | -1; xo?: number; roof?: (r: number) => number }
function geometry(): Record<string, Geo> {
  const g: Record<string, Geo> = {};
  const vv = (tag: string, x: number, z: number, ID: number, t: number, TT: number, skirt: number) => { const R = ID / 2 + t, yb = yVessel + skirt + R / 2; g[tag] = { kind: 'vv', x, z, R, yb, yt: yb + TT }; };
  vv('V-101', E.V101.x, E.V101.z, E.vessel.ID, E.vessel.t, E.vessel.TT, E.vessel.skirtH);
  vv('V-102', E.V102.x, E.V102.z, E.vessel.ID, E.vessel.t, E.vessel.TT, E.vessel.skirtH);
  vv('C-101', E.C101.x, E.C101.z, E.C101.ID, E.C101.t, E.C101.TT, E.C101.skirtH);
  g['D-101'] = { kind: 'hv', x: E.D101.x, z: E.D101.z, R: E.D101.ID / 2 + E.D101.t, yc: L.padHeight + E.D101.centreline, xo: E.D101.x - E.D101.TT / 2 };
  for (const [tag, pos] of [['E-101', E.E101], ['E-102', E.E102], ['E-103', E.E103]] as const)
    g[tag] = { kind: 'hv', x: pos.x, z: pos.z, R: E.exchanger.ID / 2 + E.exchanger.t, yc: L.padHeight + E.exchanger.centreline, xo: pos.x - E.exchanger.TT / 2 + E.exchanger.ID / 4 };
  const pumpTags = ['P-101A', 'P-101B', 'P-102A', 'P-102B', 'P-103A', 'P-103B'];
  E.pumpsS.forEach((p, i) => { g[pumpTags[i]] = { kind: 'pump', x: p.x, z: p.z, R: E.pump.casingD / 2, s: 1 }; });
  E.pumpsN.forEach((p, i) => { g[['P-104A', 'P-104B'][i]] = { kind: 'pump', x: p.x, z: p.z, R: E.pump.casingD / 2, s: -1 }; });
  for (const [tag, pos] of [['T-101', E.T101], ['T-102', E.T102]] as const) {
    const R = E.tank.D / 2, rise = (R * 0.75) / 12, top = L.padHeight + E.tank.H;
    g[tag] = { kind: 'tank', x: pos.x, z: pos.z, R, roof: (r: number) => top + rise * (1 - r / R) };
  }
  return g;
}

/** The nozzle schedule (drawing). Elevations and offsets are multiples of 6 in (SW-LAY-2). */
export const DEMO_NOZZLES: NozzleDef[] = (() => {
  const d: NozzleDef[] = [];
  const n = (equip: string, id: string, service: string, NPS: number, cls: PipeClass, at: Place) => d.push({ equip, id: `${equip}-${id}`, service, NPS, cls, at });
  for (const [v, side] of [['V-101', '+x'], ['V-102', '-x']] as const) {
    n(v, 'N1', 'inlet', 4, 'P300', { on: 'shell', e: 252, dir: '-z' });
    n(v, 'N2', 'outlet', v === 'V-101' ? 6 : 4, 'P300', { on: 'shell', e: 108, dir: '-z' });
    n(v, 'N3', 'vent', 1, 'P150', { on: 'top', dx: 0, dz: 0 });
    n(v, 'N4', 'drain', 1, 'P150', { on: 'shell', e: 102, dir: side });
    n(v, 'N5', 'nitrogen', 1, 'P150', { on: 'shell', e: 246, dir: side });
    n(v, 'N6', 'instrument', 0.75, 'P300', { on: 'shell', e: 150, dir: side });
    n(v, 'N7', 'instrument', 0.75, 'P300', { on: 'shell', e: 216, dir: side });
    n(v, 'N8', 'sample', 0.75, 'P300', { on: 'shell', e: 126, dir: side });
  }
  n('C-101', 'N1', 'feed', 4, 'P300', { on: 'shell', e: 192, dir: '+z' });
  n('C-101', 'N2', 'overhead', 6, 'P300', { on: 'top', dx: 0, dz: 0 });
  n('C-101', 'N3', 'bottoms', 6, 'P300', { on: 'shell', e: 78, dir: '+z' });
  n('C-101', 'N4', 'reflux', 3, 'P300', { on: 'shell', e: 300, dir: '+z' });    // above the top platform's guardrail: its control valve clears the feed's
  n('C-101', 'N5', 'vent', 1, 'P150', { on: 'top', dx: 18, dz: 0 });     // clear of the overhead gate valve's handwheel
  n('C-101', 'N6', 'drain', 1, 'P150', { on: 'shell', e: 72, dir: '-x' });
  n('C-101', 'N7', 'nitrogen', 1, 'P150', { on: 'shell', e: 180, dir: '-z' });     // −x above 132 in is the upper ladder
  n('C-101', 'N8', 'instrument', 0.75, 'P300', { on: 'shell', e: 102, dir: '-x' });
  n('C-101', 'N9', 'instrument', 0.75, 'P300', { on: 'shell', e: 210, dir: '-z' });
  n('C-101', 'N10', 'sample', 0.75, 'P300', { on: 'shell', e: 90, dir: '-x' });
  const xo = E.D101.x - E.D101.TT / 2;
  n('D-101', 'N1', 'inlet', 6, 'P300', { on: 'hshell', x: xo + 30, side: 'top' });
  n('D-101', 'N2', 'outlet', 4, 'P300', { on: 'hshell', x: xo + 168, side: 'bottom' });
  n('D-101', 'N3', 'relief', 3, 'P300', { on: 'hshell', x: xo + 120, side: 'top' });
  n('D-101', 'N4', 'vent', 1, 'P150', { on: 'hshell', x: xo + 60, side: 'top' });
  n('D-101', 'N5', 'drain', 1, 'P150', { on: 'hshell', x: xo + 18, side: 'bottom' });
  n('D-101', 'N6', 'nitrogen', 1, 'P150', { on: 'hshell', x: xo + 90, side: 'top' });
  n('D-101', 'N7', 'instrument', 0.75, 'P300', { on: 'hshell', x: xo + 90, side: '+z' });
  n('D-101', 'N8', 'instrument', 0.75, 'P300', { on: 'hshell', x: xo + 132, side: '+z' });
  n('D-101', 'N9', 'sample', 0.75, 'P300', { on: 'hshell', x: xo + 108, side: 'bottom' });
  for (const [tag, pos] of [['E-101', E.E101], ['E-102', E.E102], ['E-103', E.E103]] as const) {
    const x0 = pos.x - E.exchanger.TT / 2 + E.exchanger.ID / 4, away = pos.z > 0 ? '+z' : '-z';
    const tubeCls: PipeClass = tag === 'E-103' ? 'P150' : 'P300', shellCls: PipeClass = tag === 'E-103' ? 'P300' : 'P150', shellNPS = tag === 'E-103' ? 6 : 4;
    n(tag, 'N1', 'tube in', 4, tubeCls, { on: 'hshell', x: x0 - 12, side: 'top' });
    n(tag, 'N2', 'tube out', 4, tubeCls, { on: 'hshell', x: x0 - 12, side: 'bottom' });
    n(tag, 'N3', 'shell in', shellNPS, shellCls, { on: 'hshell', x: x0 + 24, side: 'top' });
    n(tag, 'N4', 'shell out', shellNPS, shellCls, { on: 'hshell', x: x0 + 168, side: 'bottom' });
    n(tag, 'N5', 'vent', 1, 'P150', { on: 'hshell', x: x0 + 156, side: 'top' });
    n(tag, 'N6', 'drain', 1, 'P150', { on: 'hshell', x: x0 + 24, side: 'bottom' });
    n(tag, 'N7', 'instrument', 0.75, 'P300', { on: 'hshell', x: x0 + 96, side: away });
  }
  for (const p of ['P-101A', 'P-101B', 'P-102A', 'P-102B', 'P-103A', 'P-103B', 'P-104A', 'P-104B']) {
    n(p, 'S', 'suction', 4, p.startsWith('P-101') ? 'P150' : 'P300', { on: 'suction' });
    n(p, 'D', 'discharge', 3, 'P300', { on: 'discharge' });
    n(p, 'F', 'seal flush', 0.75, 'P150', { on: 'flush' });
  }
  for (const t of ['T-101', 'T-102']) {
    n(t, 'N1', 'outlet', 6, 'P150', { on: 'shell', e: 18, dir: '+x' });
    n(t, 'N2', 'inlet', 4, t === 'T-102' ? 'P300' : 'P150', { on: 'top', dx: 0, dz: 48 });
    n(t, 'N3', 'relief', 3, 'P150', { on: 'top', dx: -36, dz: 0 });
    n(t, 'N4', 'vent', 1, 'P150', { on: 'top', dx: 0, dz: 0 });
    n(t, 'N5', 'drain', 1, 'P150', { on: 'shell', e: 12, dir: '-x' });
    n(t, 'N6', 'nitrogen', 1, 'P150', { on: 'top', dx: 36, dz: 0 });
    n(t, 'N7', 'steam in', 2, 'P300', { on: 'shell', e: 30, dir: '-x' });
    n(t, 'N8', 'condensate out', 2, 'P150', { on: 'shell', e: 54, dir: '-x' });
    n(t, 'N9', 'instrument', 0.75, 'P150', { on: 'shell', e: 84, dir: '-x' });
    n(t, 'N10', 'instrument', 0.75, 'P150', { on: 'shell', e: 204, dir: '-x' });
  }
  return d;
})();

const dirVec = (d: '+x' | '-x' | '+z' | '-z'): V3 => (d === '+x' ? [1, 0, 0] : d === '-x' ? [-1, 0, 0] : d === '+z' ? [0, 0, 1] : [0, 0, -1]);
/** SW-NOZ-1 standout: flange face at flange OD/2 + 3 in from the shell */
export const nozzleStandout = (NPS: number, cls: PipeClass) => designFlange(NPS, cls).OD / 2 + 3;

export function buildNozzles(): Map<string, Nozzle> {
  const g = geometry(), out = new Map<string, Nozzle>();
  for (const d of DEMO_NOZZLES) {
    const q = g[d.equip], at = d.at; let S = nozzleStandout(d.NPS, d.cls);
    let A: V3, u: V3;
    if (at.on === 'shell') { u = dirVec(at.dir); A = [q.x + u[0] * q.R, at.e, q.z + u[2] * q.R]; }
    else if (at.on === 'top') {
      const r = Math.hypot(at.dx, at.dz);
      const y = q.kind === 'tank' ? q.roof!(r) : q.yt! + (q.R / 2) * Math.sqrt(Math.max(0, 1 - (r / q.R) ** 2));
      A = [q.x + at.dx, y, q.z + at.dz]; u = [0, 1, 0];
    } else if (at.on === 'hshell') {
      u = at.side === 'top' ? [0, 1, 0] : at.side === 'bottom' ? [0, -1, 0] : dirVec(at.side);
      A = [at.x, q.yc! + u[1] * q.R, q.z + u[2] * q.R];
    } else if (at.on === 'suction') { A = [q.x, E.pumpPad + 15, q.z - 30 * q.s!]; u = [0, 0, -q.s!]; }
    else if (at.on === 'discharge') { A = [q.x, E.pumpPad + 15 + q.R, q.z - 24 * q.s!]; u = [0, 1, 0]; }
    else { A = [q.x + q.R, E.pumpPad + 15, q.z - 24 * q.s!]; u = [1, 0, 0]; }
    if (d.service === 'relief') {
      // SW-NOZ-4: the standout grows by less than one grid step so the safety valve's outlet centreline is on the 6 in grid
      const f = designFlange(d.NPS, d.cls), v = makeValve('psv-geometry', 'PSV', d.NPS, d.cls), up = A[1] + S + f.gasketT + f.rfH + v.dims.CFin.value;
      S += Math.ceil(up / 6 - 1e-9) * 6 - up;
    }
    const face: V3 = [A[0] + u[0] * S, A[1] + u[1] * S, A[2] + u[2] * S];
    out.set(d.id, { id: d.id, equip: d.equip, service: d.service, NPS: d.NPS, cls: d.cls, A, u, face, S });
  }
  return out;
}
