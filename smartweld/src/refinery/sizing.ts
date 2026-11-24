/**
 * Plant 3: sizes from the process (DESIGN_BASIS.md §75, SW-PRC-2..17). For every line of every unit: design pressure
 * and temperature, pressure class and size. For every equipment item: its design conditions, the size and class of
 * each nozzle, and the dimensions its duty calls for. Nothing here is geometry; the catalogue builds each part from
 * these sizes by its own rules.
 */
import { K } from '../core/constants';
import { CLASS_PRESSURE, CLASS_SERIES, pipeDims, type PipeClass } from '../catalogue';
import { FLUIDS, rho, rhoL, rhoV, cfs, ATM, BBL_FT3, liquid, vapour, type State } from './fluids';
import { STEAM, STEAM_SAT, type UnitSheet, type Equip, type PLine, type Util, type End } from './flowsheet';
import { processModel } from './process';

const G = K.G_FT_S2, up = (x: number, step: number) => Math.ceil(x / step - 1e-9) * step;
/** SW-PRC-4: the line sizes used */
export const LINE_SIZES = [0.75, 1, 1.5, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 30, 36, 42, 48];

// ───────────────────────── design conditions and class (SW-PRC-2, SW-PRC-3) ─────────────────────────
export const designPressure = (op: number) => Math.max(50, up(Math.max(1.1 * op, op + 25), 5));
export const designTemperature = (op: number) => Math.max(150, up(op + 50, 5));
/** the smallest class whose pressure covers the design pressure, one higher above 700 °F */
export function classFor(P: number, T: number): PipeClass {
  let i = CLASS_SERIES.findIndex(c => CLASS_PRESSURE[c] >= Math.max(P, 1)); if (i < 0) throw new Error(`no class for ${P} psi`);
  if (T > 700) i = Math.min(i + 1, CLASS_SERIES.length - 1);
  return CLASS_SERIES[i];
}
/** SW-PRC-2: flue gas above 1,000 °F runs in lined ducts whose steel is designed for 650 °F */
const metalT = (s: State) => (s.fluid === 'FLG' && s.T > 1000 ? 650 : designTemperature(s.T));

// ───────────────────────── lines (SW-PRC-4) ─────────────────────────
export interface LineSize {
  id: number; unit: number; NPS: number; cls: PipeClass; designP: number; designT: number; vacuum: boolean; /** flowing velocity, ft/s */ v: number;
  /** which limit sized it */ by: 'suction or gravity, 4 ft/s' | 'liquid, 8 ft/s' | 'gas momentum' | 'gas, 200 ft/s' | 'smallest size'; /** parallel lines where one of 48 in is not enough */ n: number;
  /** the pump whose blocked-in pressure sets the design pressure */ pump?: string;
}
const bore = (NPS: number, cls: PipeClass) => (Math.PI / 4) * (pipeDims(NPS, cls).D / 12) ** 2;
/** size for a flowing state: the smallest size within the velocity limit */
export function lineSize(s: State, slow: boolean, cls: PipeClass, least = 2): { NPS: number; v: number; by: LineSize['by']; n: number } {
  const q = cfs(s), d = rho(s), isL = s.ph === 'L', vmax = isL ? (slow ? 4 : 8) : Math.min(200, Math.sqrt(4000 / d));
  const by: LineSize['by'] = isL ? (slow ? 'suction or gravity, 4 ft/s' : 'liquid, 8 ft/s') : vmax < 200 ? 'gas momentum' : 'gas, 200 ft/s';
  for (let n = 1; n <= 4; n++) for (const NPS of LINE_SIZES) { if (NPS < least) continue; const v = q / n / bore(NPS, cls); if (v <= vmax + 1e-9) return { NPS, v, by: NPS === least && v < 0.5 * vmax ? 'smallest size' : by, n }; }
  throw new Error(`no line size for ${q.toFixed(1)} ft3/s`);
}
const smaller = (NPS: number) => LINE_SIZES[Math.max(0, LINE_SIZES.indexOf(NPS) - 1)];

// ───────────────────────── equipment ─────────────────────────
export interface Nozzle { port: string; dir: 'in' | 'out'; NPS: number; cls: PipeClass; /** the line it serves, or the utility */ line?: number; util?: string; fluid: string; n: number }
export interface Side { designP: number; designT: number; cls: PipeClass; vacuum: boolean }
export interface EquipSize {
  tag: string; unit: number; kind: Equip['kind']; service: string; /** machines or shells installed under this tag */ count: number; /** of which running */ running: number;
  designP: number; designT: number; vacuum: boolean; cls: PipeClass; sides: Record<string, Side>; nozzles: Nozzle[];
  /** dimensions for the duty: inches unless the name says otherwise */ d: Record<string, number>; /** how the driver or type was chosen */ type: string; /** one line for the equipment list */ text: string;
}
export interface UnitSizing { no: number; name: string; lines: LineSize[]; utils: (Util & { NPS: number; cls: PipeClass; designP: number; designT: number })[]; equip: Map<string, EquipSize> }

/** SW-PRC-5: motor ratings, horsepower */
export function motorHp(shaft: number): number { for (let k = 0; k < 6; k++) for (const m of [1, 1.5, 2, 3, 5, 7.5]) if (m * 10 ** k >= shaft - 1e-9) return m * 10 ** k; throw new Error(`no motor for ${shaft} hp`); }
/** SW-PRC-14: allowable stress at a design temperature, psi; wall thickness of a shell, in */
export const allowable = (T: number) => (T <= 650 ? 18000 : T >= 1000 ? 9000 : 18000 - (9000 * (T - 650)) / 350);
export function wall(ID: number, P: number, T: number, vacuum = false): number { return up(Math.max((P * ID) / 2 / allowable(T) + 0.125, 0.375, ID / 250, vacuum ? ID / 150 : 0), 0.125); }
/** SW-EQC-30: tubes of diameter d on a 1.25 d triangular pitch within a circle 3/4 in inside the shell */
export function tubeCount(ID: number, d = 0.75): number {
  const p = 1.25 * d, Rl = ID / 2 - 0.75, rowH = p * 0.8660254, m = Math.ceil(Rl / rowH); let n = 0;
  for (let j = -m; j <= m; j++) for (let i = -Math.ceil(Rl / p) - 1; i <= Math.ceil(Rl / p) + 1; i++) if (Math.hypot(i * p + (Math.abs(j) % 2 ? p / 2 : 0), j * rowH) <= Rl - d / 2) n++;
  return n;
}
/** SW-PRC-8: surface of one shell, ft² (3/4 in tubes 20 ft long) */
export const shellArea = (ID: number) => tubeCount(ID) * Math.PI * (0.75 / 12) * 20;
export const SHELL_IDS = [12, 18, 24, 30, 36, 42, 48, 54, 60];
/** SW-PRC-14: a sphere's shell, stressed half as much as a cylinder's of its diameter */
export function sphereWall(ID: number, P: number, T: number): number { return up(Math.max((P * ID) / 4 / allowable(T) + 0.125, 0.75), 0.125); }
/** SW-EQC-37: the fire tubes of the flue gas cooler, 2 in on a 2.5 in triangular pitch within a circle 2 in inside the shell */
export function fireTubeCount(D: number): number {
  const p = 2.5, Rl = D / 2 - 2, rowH = p * 0.8660254; let n = 0;
  for (let j = -Math.ceil(Rl / rowH); j <= Math.ceil(Rl / rowH); j++) for (let i = -Math.ceil(Rl / p) - 1; i <= Math.ceil(Rl / p) + 1; i++) if (Math.hypot(i * p + (Math.abs(j) % 2 ? p / 2 : 0), j * rowH) <= Rl - 1) n++;
  return n;
}
/** the bore of a tube of outside diameter d and wall d / 9 (SW-EQC-30), ft² */
export const tubeBore = (d: number) => (Math.PI / 4) * ((d * (7 / 9)) / 12) ** 2;
/** SW-PRC-8: a gas under 50 psi passes through tubes no faster than this, ft/s */
export const TUBE_GAS_FTS = 100;
const lmtd = (hi: number, ho: number, ci: number, co: number) => { const a = Math.max(5, hi - co), b = Math.max(5, ho - ci); return Math.abs(a - b) < 1e-6 ? a : (a - b) / Math.log(a / b); };
/** SW-PRC-6: settling velocity of a drop, ft/s */
const settle = (dL: number, dV: number) => 0.18 * Math.sqrt(Math.max(dL - dV, 1) / dV);

const HEAVY = new Set(['CR', 'GO', 'RS', 'SL']), WATERY = new Set(['PW', 'SW', 'OW', 'BW', 'CO', 'CWS', 'CWR', 'RW', 'DM', 'AM', 'CA']);
interface HxSide { fluid: string; Tin: number; Tout: number; P: number; gas: boolean; condensing: boolean; how: 'process' | 'water' | 'steam' | 'boiling' }
/** SW-PRC-8: overall coefficient by the pair of fluids, Btu/h·ft²·°F */
export function coefficient(a: HxSide, b: HxSide): number {
  const proc = a.how === 'process' ? a : b, other = proc === a ? b : a;
  if (other.how === 'steam') return WATERY.has(proc.fluid) ? 250 : 100;
  if (other.how === 'boiling' || other.how === 'water') {
    if (proc.gas && !proc.condensing) return proc.P < 50 ? 20 : 60;
    if (other.how === 'water' && proc.condensing) return 90;
    if (HEAVY.has(proc.fluid)) return 50;
    if (WATERY.has(proc.fluid)) return 150;
    return 70;
  }
  if (HEAVY.has(a.fluid) && HEAVY.has(b.fluid)) return 40;
  if (a.fluid === 'AM' && b.fluid === 'AM') return 100;
  if (WATERY.has(a.fluid) && WATERY.has(b.fluid)) return 150;
  return 60;
}

const PASS = new Set<Equip['kind']>(['hx', 'aircooler', 'heater', 'filter', 'package', 'condenser', 'fluegascooler']);
/** items whose pressure is that of what leaves them: what enters comes through a valve, or from something at a higher pressure */
const HOLDS = new Set<Equip['kind']>(['drum', 'column', 'desalter', 'deaerator', 'tank', 'sphere', 'bullet', 'basin', 'pit', 'coolingtower', 'flare', 'stack', 'hopper', 'loading', 'cracker', 'scrubber', 'psa', 'boiler', 'furnace', 'incinerator']);
/** SW-PRC-2: items open to the atmosphere, which have no design pressure */
const ATMOSPHERIC = new Set<Equip['kind']>(['tank', 'basin', 'pit', 'coolingtower', 'stack', 'flare', 'loading', 'hopper', 'scrubber', 'incinerator']);
/** the side of an item a connection belongs to: exchangers have a shell and a tube side; a heater's steam coil and its fuel are apart from its process coil; utilities to anything else are apart from it */
function sideOf(e: Equip, name: string, utility: boolean): string {
  if (e.kind === 'hx') return name.startsWith('tube') ? 'tube' : 'shell';
  if (e.kind === 'condenser' || e.kind === 'fluegascooler') return utility ? 'steam side' : 'process';
  if (e.kind === 'heater') return name.startsWith('steam coil') ? 'steam coil' : utility || /gas$/.test(name) ? 'fuel' : 'process';
  return utility ? 'utility' : 'process';
}
const isEq = (e: End, tag: string, port?: string) => e.k === 'eq' && e.tag === tag && (port === undefined || e.port === port);
/** SW-PRC-2: the lines of each pump's discharge system, with its blocked-in pressure */
function blockedIn(sh: UnitSheet): { line: Map<number, { P: number; pump: string }>; item: Map<string, number> } {
  const out = new Map<number, { P: number; pump: string }>(), item = new Map<string, number>();
  for (const e of sh.equip.values()) {
    if (e.kind !== 'pump') continue;
    const S = e.ports.find(p => p.name === 'S')!, D = e.ports.find(p => p.name === 'D')!, shut = up(designPressure(S.s.P) + 1.25 * (D.s.P - S.s.P), 5);
    const seen = new Set<number>(), stack = sh.lines.filter(l => isEq(l.from, e.tag, 'D')).map(l => l.id);
    while (stack.length) {
      const id = stack.pop()!; if (seen.has(id)) continue; seen.add(id);
      const l = sh.lines[id], was = out.get(id); if (!was || was.P < shut) out.set(id, { P: shut, pump: e.tag });
      for (const b of sh.lines) if (b.from.k === 'tap' && b.from.line === id) stack.push(b.id);
      if (l.cv) continue;
      if (l.to.k === 'tap') stack.push(l.to.line);
      else if (l.to.k === 'eq') {
        const t = sh.equip.get(l.to.tag)!; if (!PASS.has(t.kind)) continue;
        const key = `${t.tag}|${sideOf(t, l.to.port, false)}`; item.set(key, Math.max(item.get(key) ?? 0, shut));
        const port = l.to.port.replace(/ in$/, ' out').replace(/^inlet$/, 'outlet');
        for (const n of sh.lines) if (isEq(n.from, t.tag, port)) stack.push(n.id);
      }
    }
  }
  return { line: out, item };
}

/** the state a utility connection flows at */
function utilState(u: Util): State {
  const f = u.fluid;
  if (f === 'HS' || f === 'MS' || f === 'LS') return vapour(f, u.w, 18, u.T, u.P);
  if (f === 'FG') return vapour(f, u.w, 16, u.T, u.P);
  if (f === 'IA' || f === 'PA') return vapour(f, u.w, 29, u.T, u.P);
  if (f === 'NI') return vapour(f, u.w, 28, u.T, u.P);
  return liquid(f, u.w, f === 'CA' ? 1.2 : 1, u.T, u.P);
}

export function sizeUnit(sh: UnitSheet): UnitSizing {
  const shut = blockedIn(sh);
  // lines
  const lines: LineSize[] = sh.lines.map(l => {
    const b = shut.line.get(l.id), designP = Math.max(designPressure(l.s.P), b?.P ?? 0), designT = metalT(l.s), cls = classFor(designP, designT);
    const z = lineSize(l.s, l.slow, cls, FLUIDS[l.s.fluid].svc === 'P' ? 2 : 0.75);
    return { id: l.id, unit: sh.no, NPS: z.NPS, cls, designP, designT, vacuum: l.s.P < 0, v: z.v, by: z.by, n: z.n, ...(b && b.P > designPressure(l.s.P) ? { pump: b.pump } : {}) };
  });
  const utils = sh.utils.map(u => {
    const s = utilState(u), designP = designPressure(u.P), designT = designTemperature(u.T), cls = classFor(designP, designT), z = lineSize(s, false, cls, 0.75);
    return { ...u, NPS: z.NPS, cls, designP, designT };
  });
  // equipment
  const equip = new Map<string, EquipSize>();
  for (const e of sh.equip.values()) equip.set(e.tag, sizeEquip(sh, e, lines, utils, shut.item));
  return { no: sh.no, name: sh.name, lines, utils, equip };
}

function sizeEquip(sh: UnitSheet, e: Equip, lines: LineSize[], utils: UnitSizing['utils'], shut: Map<string, number>): EquipSize {
  const port = (name: string) => e.ports.find(p => p.name === name), ins = e.ports.filter(p => p.dir === 'in'), outs = e.ports.filter(p => p.dir === 'out');
  const lineOf = (name: string) => sh.lines.find(l => isEq(l.from, e.tag, name) || isEq(l.to, e.tag, name));
  // nozzles: one for each port with a line, and one for each utility connection
  const nozzles: Nozzle[] = [];
  for (const p of e.ports) {
    const l = lineOf(p.name); if (!l) continue;                                                        // open ports have no line
    const z = lines[l.id]; nozzles.push({ port: p.name, dir: p.dir, NPS: e.kind === 'pump' ? smaller(z.NPS) : z.NPS, cls: z.cls, line: l.id, fluid: p.s.fluid, n: z.n });
  }
  for (const u of utils.filter(x => x.tag === e.tag)) nozzles.push({ port: u.port, dir: u.dir === 'to' ? 'in' : 'out', NPS: u.NPS, cls: u.cls, util: u.fluid, fluid: u.fluid, n: 1 });
  // design conditions, by side (SW-PRC-2)
  const sides: Record<string, Side> = {};
  const lined = e.kind === 'cracker' || e.kind === 'furnace' || e.kind === 'incinerator' || e.kind === 'stack' || e.kind === 'flare';
  const add = (k: string, P: number, T: number, opP: number) => {
    const s = (sides[k] ??= { designP: 50, designT: 150, cls: 'P150', vacuum: false });
    s.designP = Math.max(s.designP, P); s.designT = Math.max(s.designT, T); if (opP < 0) s.vacuum = true;
  };
  const holds = HOLDS.has(e.kind) && outs.some(p => !/open/.test(p.name));
  for (const p of e.ports) {
    if (/open/.test(p.name)) continue;
    const k = sideOf(e, p.name, false), counts = !holds || p.dir === 'out';
    add(k, counts ? designPressure(p.s.P) : 50, lined ? 650 : metalT(p.s), counts ? p.s.P : 0);
  }
  for (const u of utils.filter(x => x.tag === e.tag)) add(sideOf(e, u.port, true), u.designP, u.designT, u.P);
  for (const [key, P] of shut) { const [tag, k] = key.split('|'); if (tag === e.tag) add(k, P, 0, 0); }
  if (e.kind === 'pump') { const S = port('S')!, D = port('D')!; add('process', up(designPressure(S.s.P) + 1.25 * (D.s.P - S.s.P), 5), 0, 0); }
  if (!Object.keys(sides).length) for (const p of e.ports) add('process', designPressure(p.s.P), lined ? 650 : metalT(p.s), p.s.P);   // an item open to the air or a duct at both ends
  if (ATMOSPHERIC.has(e.kind) && !(e.kind === 'tank' && e.p.vertical) && sides.process) sides.process.designP = 0;
  for (const s of Object.values(sides)) s.cls = classFor(s.designP, s.designT);
  const own = e.kind === 'hx' ? Object.values(sides) : [sides.process ?? Object.values(sides)[0]], designP = Math.max(...own.map(s => s.designP)), designT = Math.max(...own.map(s => s.designT)), vacuum = own.some(s => s.vacuum);
  const r: EquipSize = { tag: e.tag, unit: e.unit, kind: e.kind, service: e.service, count: 1, running: 1, designP, designT, vacuum, cls: classFor(designP, designT), sides, nozzles, d: {}, type: '', text: '' };
  const num = (k: string, dflt = 0) => (typeof e.p[k] === 'number' ? (e.p[k] as number) : dflt);
  const ft = (inch: number) => `${(inch / 12).toFixed(inch % 12 ? 1 : 0)} ft`;
  const liqOut = outs.filter(p => p.s.ph === 'L' && !/open/.test(p.name)), gasOut = outs.filter(p => p.s.ph === 'V' && !/open/.test(p.name));
  const qGas = gasOut.reduce((a, p) => a + cfs(p.s), 0), qLiq = liqOut.reduce((a, p) => a + cfs(p.s), 0);
  const dV = gasOut.length ? gasOut.reduce((a, p) => a + p.s.w, 0) / 3600 / qGas : 0, dL = liqOut.length ? liqOut.reduce((a, p) => a + p.s.w, 0) / 3600 / qLiq : 50;

  switch (e.kind) {
    case 'pump': {                                                                                      // SW-PRC-5
      const S = port('S')!, D = port('D')!, installed = num('count', e.spare ? 2 : 1), running = Math.max(1, installed - (installed > 1 ? 1 : 0));
      const d = rhoL(S.s.sg, S.s.T), gpmEach = (1.1 * (S.s.w / d / 60) * (1728 / 231)) / running, head = ((D.s.P - S.s.P) * 144) / d;
      const hyd = ((gpmEach * 231) / 1728 / 60) * d * head / 550, shaft = hyd / (gpmEach < 100 ? 0.55 : 0.7), hp = motorHp(shaft);
      const rpm = gpmEach > 3000 ? 1780 : 3560, dia = (h: number, n: number) => ((60 * Math.sqrt((G * h) / 0.5)) / (Math.PI * n)) * 12; let stages = 1;
      while (dia(head / stages, rpm) > (rpm === 3560 ? 16 : 24)) stages++;
      Object.assign(r, { count: installed, running }); Object.assign(r.d, { gpm: gpmEach, headFt: head, shaftHp: shaft, motorHp: hp, rpm, stages, impeller: dia(head / stages, rpm), motorFrame: 10 * Math.cbrt(hp / 10) });
      r.type = /engine driven/.test(e.service) ? 'engine and motor driven' : 'motor driven';
      r.text = `${Math.round(gpmEach)} gpm each × ${Math.round(head)} ft, ${hp} hp at ${rpm} rpm${stages > 1 ? `, ${stages} stages` : ''}; ${installed} installed, ${running} running`;
      break;
    }
    case 'drum': {                                                                                      // SW-PRC-6, SW-PRC-17
      const vertical = !!num('vertical'), feedWater = utils.filter(u => u.tag === e.tag && u.fluid === 'BW').reduce((a, u) => a + u.w, 0);
      const hold = num('holdMin', 5), vLiq = num('steamDrum') ? (feedWater / 50 / 60) * 5 : qLiq * 60 * hold, u0 = gasOut.length || num('steamDrum') ? settle(dL, dV || rhoV(18, 490, 600)) : 0;
      const qv = num('steamDrum') ? utils.filter(u => u.tag === e.tag && u.dir === 'from').reduce((a, u) => a + u.w, 0) / 3600 / rhoV(18, 490, 600) : qGas;
      let D: number, L: number;
      if (vertical) {
        const byGas = qv > 0 ? Math.sqrt((4 * qv) / (Math.PI * u0)) : 0, byHold = num('receiver') ? Math.cbrt((4 * qv * 30) / (3 * Math.PI)) : Math.cbrt((4 * vLiq) / Math.PI);                 // liquid in the bottom diameter of height
        D = Math.max(36, up(Math.max(byGas, byHold) * 12, 6)); L = 3 * D;
      } else {
        const byHold = Math.cbrt((8 * vLiq) / (3 * Math.PI)), byGas = qv > 0 ? Math.sqrt((8 * qv) / (6 * u0 * Math.PI)) : 0;
        D = Math.max(36, up(Math.max(byGas, byHold) * 12, 6)); L = 3 * D;
      }
      Object.assign(r.d, { D, L, t: wall(D, designP, designT, vacuum), vertical: vertical ? 1 : 0, ...(num('boot') ? { boot: Math.max(12, up(D / 3, 6)) } : {}) });
      r.type = vertical ? 'vertical' : 'horizontal'; r.text = `${D} in inside diameter × ${ft(L)} between tangents, ${r.type}${num('boot') ? ', with a water boot' : ''}`;
      break;
    }
    case 'desalter': {
      const feed = ins[0].s, vol = (feed.w / rhoL(feed.sg, feed.T) / 60) * 20, D = up(Math.cbrt(vol / Math.PI) * 12, 6);
      Object.assign(r.d, { D, L: 4 * D, t: wall(D, designP, designT) }); r.type = 'horizontal'; r.text = `${D} in inside diameter × ${ft(4 * D)} between tangents, horizontal`;
      break;
    }
    case 'deaerator': {
      const o = outs.find(p => p.name === 'outlet')!.s, vol = 2 * (o.w / rhoL(1, o.T) / 60) * 10, D = up(Math.cbrt((4 * vol) / (3 * Math.PI)) * 12, 6);
      Object.assign(r.d, { D, L: 3 * D, dome: D / 2, domeH: D / 2, t: wall(D, designP, designT) }); r.type = 'horizontal storage with heater section'; r.text = `storage ${D} in × ${ft(3 * D)}, heater section ${D / 2} in`;
      break;
    }
    case 'vessel': case 'filter': {                                                                    // SW-PRC-17
      const n = num('shells', 1), s = ins[0].s, q = cfs(s) / n, gas = s.ph !== 'L';
      let D: number, L: number;
      if (e.kind === 'vessel') { const vol = gas ? q * 20 : q * 600; D = Math.max(36, up(Math.cbrt((4 * vol) / (2.5 * Math.PI)) * 12, 6)); L = 2.5 * D; }
      else { const vel = gas ? settle(50, rho(s)) : 0.1; D = Math.max(24, up(Math.sqrt((4 * q) / (Math.PI * vel)) * 12, 6)); L = 2 * D; }
      Object.assign(r, { count: n, running: n }); Object.assign(r.d, { D, L, t: wall(D, designP, designT) }); r.type = 'vertical';
      r.text = `${n > 1 ? `${n} × ` : ''}${D} in inside diameter × ${ft(L)} between tangents, vertical`;
      break;
    }
    case 'column': {                                                                                    // SW-PRC-7
      const dLq = rhoL(num('liqSg', 0.7), num('vapT', 200)), dia = (w: number, mw: number, T: number, P: number) => { const dv = rhoV(mw, T, P), u = 0.25 * Math.sqrt((dLq - dv) / dv); return up(Math.sqrt((4 * (w / dv / 3600)) / (u * 0.85 * Math.PI)) * 12, 6); };
      const skirt = num('skirt', 180);
      if (num('swaged')) {
        const Dm = dia(num('vapW'), num('vapMw'), num('vapT'), num('vapP')), Dt = dia(num('topVapW'), num('topMw'), num('topT'), num('vapP') - 0.2), Db = dia(num('botVapW'), num('botMw'), num('vapT'), num('vapP'));
        const cone = (a: number, b: number) => up(Math.abs(a - b) / 2 / Math.tan(Math.PI / 6), 6);     // 30° half-angle cones
        const TT = num('hBot') + cone(Dm, Db) + num('hMid') + cone(Dm, Dt) + num('hTop');
        Object.assign(r.d, { D: Dm, Dtop: Dt, Dbot: Db, hBot: num('hBot'), hMid: num('hMid'), hTop: num('hTop'), coneBot: cone(Dm, Db), coneTop: cone(Dm, Dt), TT, skirt, t: wall(Dm, designP, designT, true) });
        r.type = 'swaged, packed'; r.text = `${Db} / ${Dm} / ${Dt} in inside diameter (stripping / flash / top) × ${ft(TT)} between tangents, on a ${ft(skirt)} skirt`;
      } else {
        const lp = ins.find(p => p.s.fluid === 'LP'), boil = ins.filter(p => /reboiler return/.test(p.name) && p.s.vf > 0), boilUp = boil.reduce((a, p) => a + p.s.w * p.s.vf, 0);
        // the vapour loads: the stated one, and what each reboiler boils; the liquid loads: each draw, and the bottoms with the boil-up
        const byVapour = Math.max(dia(num('vapW'), num('vapMw'), num('vapT'), num('vapP')), ...boil.map(p => dia(p.s.w * p.s.vf, p.s.mw, p.s.T, p.s.P)));
        const down = Math.max(0, ...outs.filter(p => p.s.ph === 'L' && !/reboiler draw|rich amine/.test(p.name)).map(p => (p.s.w + (p.name === 'bottoms' ? boilUp : 0)) / rhoL(p.s.sg, p.s.T) / 3600));
        const byLiquid = up(Math.sqrt((4 * down) / (Math.PI * 0.05)) * 12, 6);
        const D = num('liquidOnly') ? Math.max(36, up(Math.sqrt((4 * cfs(lp!.s)) / (Math.PI * 0.05)) * 12, 6)) : Math.max(36, byVapour, byLiquid);
        const trays = num('trays'), TT = trays * 24 + 144 + 96;
        Object.assign(r.d, { D, trays, TT, skirt, t: wall(D, designP, designT, vacuum) });
        r.type = num('liquidOnly') ? 'liquid contactor' : num('sections') ? `trayed, ${num('sections')} stacked sections` : 'trayed'; r.text = `${D} in inside diameter × ${ft(TT)} between tangents, ${trays} trays, on a ${ft(skirt)} skirt`;
      }
      break;
    }
    case 'hx': case 'condenser': case 'fluegascooler': {                                               // SW-PRC-8
      const mk = (k: string): HxSide | undefined => {
        const i = port(`${k} in`) ?? (k === 'process' ? port('inlet') : undefined), o = port(`${k} out`) ?? (k === 'process' ? port('outlet') : undefined);
        return i && o ? { fluid: i.s.fluid, Tin: i.s.T, Tout: o.s.T, P: i.s.P, gas: i.s.ph === 'V', condensing: o.s.vf < i.s.vf - 1e-6, how: 'process' } : undefined;
      };
      const proc = e.kind === 'hx' ? [mk('shell'), mk('tube')].filter((x): x is HxSide => !!x) : [mk('process')!];
      const uu = utils.filter(u => u.tag === e.tag), key = String(e.p.utility ?? (uu.some(u => u.fluid === 'BW') ? 'SG-LS' : ''));
      let other: HxSide;
      if (proc.length === 2) other = proc[1];
      else if (key === 'CW') other = { fluid: 'CWS', Tin: 85, Tout: 105, P: 60, gas: false, condensing: false, how: 'water' };
      else if (key.startsWith('SG-') || e.kind !== 'hx') { const lv = (uu.find(u => u.dir === 'from')?.fluid ?? 'LS') as keyof typeof STEAM_SAT; other = { fluid: 'BW', Tin: STEAM_SAT[lv], Tout: STEAM_SAT[lv], P: 0, gas: false, condensing: false, how: 'boiling' }; }
      else { const lv = key as keyof typeof STEAM_SAT; if (!STEAM_SAT[lv]) throw new Error(`${e.tag}: no second side`); other = { fluid: lv, Tin: STEAM_SAT[lv], Tout: STEAM_SAT[lv], P: 0, gas: true, condensing: true, how: 'steam' }; }
      const a = proc[0], Q = Math.max(...Object.values(e.duty).map(Math.abs)), hot = a.Tin > a.Tout || (a.Tin === a.Tout && other.Tin < a.Tin) ? a : other, cold = hot === a ? other : a;
      const dT = lmtd(hot.Tin, hot.Tout, cold.Tin, cold.Tout), U = coefficient(a, other), A = Q / (0.9 * U * dT);
      // SW-PRC-8: a gas under 50 psi inside the tubes needs this much bore, ft²
      const ti = e.kind === 'hx' ? port('tube in') : port('process in') ?? port('inlet'), to = e.kind === 'hx' ? port('tube out') : port('process out') ?? port('outlet');
      const bore = ti && to && ti.s.ph === 'V' && ti.s.P < 50 ? cfs({ ...ti.s, T: (ti.s.T + to.s.T) / 2 }) / TUBE_GAS_FTS : 0;
      const fire = e.kind === 'fluegascooler', dTube = fire ? 2 : 0.75, ids = fire ? [36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96, 102, 108, 114, 120, 126, 132, 138, 144] : SHELL_IDS;
      const count = (d: number) => (fire ? fireTubeCount(d) : tubeCount(d)), area = (d: number) => count(d) * Math.PI * (dTube / 12) * 20, enough = (k: number, d: number) => k * area(d) >= A && k * count(d) * tubeBore(dTube) >= bore;
      let n = 1; while (!enough(n, ids[ids.length - 1])) n++;
      const ID = ids.find(d => enough(n, d))!;
      const tShell = Math.max(...Object.entries(sides).filter(([k]) => k !== 'utility').map(([, q]) => wall(ID, q.designP, q.designT, q.vacuum)));
      Object.assign(r, { count: n, running: n }); Object.assign(r.d, { dutyMMBtu: Q / 1e6, lmtd: dT, U, areaFt2: A, shells: n, ID, tubes: count(ID), tubeOD: dTube, tubeLength: 240, tShell, ...(fire ? { drumT: wall(0.6 * ID, (sides['steam side'] ?? sides.process).designP, (sides['steam side'] ?? sides.process).designT) } : {}), ...(bore ? { tubeGasFts: (bore * TUBE_GAS_FTS) / (n * count(ID) * tubeBore(dTube)) } : {}) });
      r.type = key.startsWith('SG-') || e.kind !== 'hx' ? 'steam generator' : key === 'CW' ? 'water cooler' : key ? 'steam heater' : 'process to process';
      r.text = `${(Q / 1e6).toFixed(1)} million Btu/h, ${Math.round(A).toLocaleString('en-US')} ft²: ${n > 1 ? `${n} shells of ` : ''}${ID} in × 20 ft, ${count(ID).toLocaleString('en-US')} tubes${fire ? ' of 2 in' : ''}${n > 1 ? ' each' : ''}${bore ? `, the gas at ${Math.round(r.d.tubeGasFts)} ft/s in them` : ''}`;
      break;
    }
    case 'aircooler': {                                                                                 // SW-PRC-9
      const i = port('inlet')!.s, o = port('outlet')!.s, Q = Math.abs(e.duty.process ?? 0), tubesPerBay = 4 * Math.floor((14 * 12) / 2.5), bare = tubesPerBay * Math.PI * (1 / 12) * 32;
      const dT = lmtd(i.T, o.T, 90, 130), bays = Math.max(1, Math.ceil(Q / (80 * bare * dT)));
      Object.assign(r, { count: bays, running: bays }); Object.assign(r.d, { dutyMMBtu: Q / 1e6, lmtd: dT, bays, bayWidth: 168, tubeLength: 384, tubesPerBay, fans: 2 * bays });
      r.type = 'forced draught'; r.text = `${(Q / 1e6).toFixed(1)} million Btu/h: ${bays} bay${bays > 1 ? 's' : ''} of 14 ft × 32 ft, ${2 * bays} fans`;
      break;
    }
    case 'heater': {                                                                                    // SW-PRC-10
      const Q = Math.abs(e.duty.process ?? 0), fired = Q / 0.85, tubeArea = (0.7 * Q) / 10000, wallArea = tubeArea / (Math.PI / 2);
      if (Q > 30e6) { const W = Q <= 50e6 ? 192 : 240, H = 2 * W, L = Math.max(240, up((wallArea * 144) / (2 * H), 12)); Object.assign(r.d, { absorbedMMBtu: Q / 1e6, firedMMBtu: fired / 1e6, W, H, L, tubes: 2 * Math.floor(H / 12) }); r.type = 'cabin'; r.text = `${(Q / 1e6).toFixed(1)} million Btu/h absorbed, ${(fired / 1e6).toFixed(1)} fired: cabin ${ft(W)} wide × ${ft(L)} long, radiant section ${ft(H)} high`; }
      else { const D = Math.max(72, up(Math.sqrt(wallArea / (2.5 * Math.PI)) * 12, 6)), H = 2.5 * D; Object.assign(r.d, { absorbedMMBtu: Q / 1e6, firedMMBtu: fired / 1e6, D, H }); r.type = 'vertical cylindrical'; r.text = `${(Q / 1e6).toFixed(1)} million Btu/h absorbed, ${(fired / 1e6).toFixed(1)} fired: vertical cylinder ${ft(D)} diameter × ${ft(H)} high`; }
      break;
    }
    case 'reactor': {                                                                                   // SW-PRC-11, SW-PRC-17
      const feed = REACTOR_FEED[e.tag];
      if (feed) {
        const sheetFeed = sh.equip.get(feed.from)!.ports.find(p => p.name === feed.port)!.s, vol = (sheetFeed.w / (sheetFeed.sg * K.WATER_DENSITY_LB_FT3) / feed.lhsv) * feed.share;
        const D = up(Math.cbrt((4 * vol) / (feed.ratio * Math.PI)) * 12, 6), bed = up((vol / ((Math.PI / 4) * (D / 12) ** 2)) * 12, 6), beds = num('beds', 1), TT = bed + D + (beds - 1) * 48;
        Object.assign(r.d, { catalystFt3: vol, D, bed, beds, TT, t: wall(D, designP, designT) }); r.type = 'vertical, fixed bed'; r.text = `${Math.round(vol).toLocaleString('en-US')} ft³ of catalyst in ${beds > 1 ? `${beds} beds` : 'one bed'}: ${D} in inside diameter × ${ft(TT)} between tangents`;
      } else {
        const q = cfs(ins[0].s), D = up(Math.sqrt(q / 3) * 12, 6); Object.assign(r.d, { D, L: 3 * D, bed: 36, t: wall(D, designP, designT) }); r.type = 'horizontal, one bed'; r.text = `${D} in inside diameter × ${ft(3 * D)} between tangents, horizontal, bed 3 ft deep`;
      }
      break;
    }
    case 'compressor': case 'blower': {                                                                 // SW-PRC-12
      const g = gasPower(e), turbine = /turbine/.test(e.service), shaft = typeof e.p.shaft === 'string' ? e.p.shaft : '', driven = typeof e.p.drives === 'string' ? gasPower(sh.equip.get(e.p.drives)!).hp : 0;
      const power = g.hp + driven, driverHp = shaft ? 0 : turbine ? up(power, 50) : motorHp(power);
      Object.assign(r, { count: g.installed, running: g.running }); Object.assign(r.d, { acfm: g.acfm, ratio: g.ratio, stages: g.stages, gasHp: g.hp, driverHp, ...(shaft ? {} : turbine ? { wheel: 12 * Math.cbrt(power / 100) } : { motorFrame: 10 * Math.cbrt(driverHp / 10) }) });
      r.type = shaft ? `on the shaft of ${shaft}` : turbine ? 'steam turbine driven' : 'motor driven';
      r.text = `${Math.round(g.acfm).toLocaleString('en-US')} ft³/min at suction, ratio ${g.ratio.toFixed(2)}, ${g.stages} stage${g.stages > 1 ? 's' : ''}, ${Math.round(g.hp).toLocaleString('en-US')} hp of gas power; ${shaft ? `driven by ${shaft}'s turbine` : `${driverHp.toLocaleString('en-US')} hp ${turbine ? 'turbine' : 'motor'}${driven ? `, which also drives ${e.p.drives}` : ''}`}${g.installed > 1 ? `; ${g.installed} installed, ${g.running} running` : ''}`;
      break;
    }
    case 'tank': {                                                                                      // SW-PRC-13
      const vol = num('bbl') * BBL_FT3;
      if (num('vertical')) { const D = up(Math.cbrt((4 * vol) / (3 * Math.PI)) * 12, 6); Object.assign(r.d, { bbl: num('bbl'), D, H: 3 * D, t: wall(D, designP, designT) }); r.type = 'vertical vessel, vacuum insulated'; r.text = `${num('bbl').toLocaleString('en-US')} bbl: ${ft(D)} diameter × ${ft(3 * D)} high`; break; }
      let H = 48, D = up(Math.sqrt((4 * vol) / (Math.PI * H)), 5);
      if (D < H) { H = Math.max(16, Math.floor(Math.cbrt((4 * vol) / Math.PI) / 8) * 8); D = up(Math.sqrt((4 * vol) / (Math.PI * H)), 5); }
      if (D > 180) throw new Error(`${e.tag}: ${D} ft is over 180 ft; use more tanks`);
      Object.assign(r.d, { bbl: num('bbl'), Dft: D, Hft: H, courses: H / 8 }); r.type = `${e.p.roof === 'floating' ? 'floating roof' : 'cone roof'}${num('heated') ? ', heated' : ''}`;
      r.text = `${Math.round(num('bbl')).toLocaleString('en-US')} bbl: ${D} ft diameter × ${H} ft high, ${r.type}`;
      break;
    }
    case 'sphere': { const D = up(Math.cbrt((6 * num('bbl') * BBL_FT3) / Math.PI), 1); if (D > 60) throw new Error(`${e.tag}: sphere of ${D} ft`); Object.assign(r.d, { bbl: num('bbl'), Dft: D, t: sphereWall(D * 12, designP, designT) }); r.type = 'sphere'; r.text = `${Math.round(num('bbl')).toLocaleString('en-US')} bbl: ${D} ft inside diameter`; break; }
    case 'bullet': { const D = up(Math.cbrt((4 * num('bbl') * BBL_FT3) / (6 * Math.PI)) * 12, 6); Object.assign(r.d, { bbl: num('bbl'), D, L: 6 * D, t: wall(D, designP, designT) }); r.type = 'horizontal'; r.text = `${num('bbl')} bbl: ${D} in inside diameter × ${ft(6 * D)} between tangents`; break; }
    case 'coolingtower': {                                                                              // SW-PRC-16
      const ret = port('return')!.s, gal = (ret.w / K.WATER_DENSITY_LB_FT3 / 60) * (1728 / 231), cells = Math.ceil(gal / 5000 - 1e-9) + 1, side = Math.ceil(Math.sqrt(5000 / 4));
      Object.assign(r, { count: cells, running: cells - 1 }); Object.assign(r.d, { gpm: gal, cells, cellFt: side }); r.type = 'induced draught, counterflow'; r.text = `${Math.round(gal).toLocaleString('en-US')} gpm: ${cells} cells of ${side} ft × ${side} ft`;
      break;
    }
    case 'psa': Object.assign(r, { count: 4, running: 4 }); Object.assign(r.d, { D: 72, TT: 240, beds: 4, t: wall(72, designP, designT) }); r.type = 'four adsorbers'; r.text = 'four adsorbers of 72 in × 20 ft between tangents'; break;   // SW-CELL-4
    case 'furnace': { const b = sides.utility ?? sides.process; Object.assign(r.d, { D: 72, furnaceL: 180, boilerL: 180, t: 0.75, boilerT: wall(72, b.designP, b.designT), drumT: wall(0.6 * 72, b.designP, b.designT) }); r.type = 'reaction furnace with waste heat boiler'; r.text = '72 in: 15 ft of chamber and 15 ft of waste heat boiler'; break; }   // SW-CELL-4
    case 'boiler': { const Ts = designTemperature(STEAM_SAT.HS); Object.assign(r.d, { steamID: 54, L: 300, centres: 180, drumT: wall(54, designP, Ts), drumDesignT: Ts }); r.type = 'water-tube, two drums'; r.text = `${Math.round(num('lbh')).toLocaleString('en-US')} lb/h of steam at ${STEAM.HS.P} psi and ${STEAM.HS.T} °F: steam drum 54 in × 25 ft`; break; }   // SW-CELL-4
    default: r.text = '';                                                                               // the remaining kinds are sized with their bodies (stage R5)
  }
  return r;
}
/** SW-PRC-12: gas power of a compressor or blower, each machine: stages of equal ratio, cooled between */
function gasPower(e: Equip): { hp: number; stages: number; ratio: number; acfm: number; installed: number; running: number } {
  const i = e.ports.find(p => p.dir === 'in')!.s, o = e.ports.find(p => p.dir === 'out' && !/withdrawal/.test(p.name))!.s, k = i.fluid === 'HY' || i.fluid === 'AIR' || i.fluid === 'PA' ? 1.4 : 1.3, ratio = (o.P + ATM) / (i.P + ATM);
  const n = typeof e.p.count === 'number' ? e.p.count : e.spare ? 2 : 1, running = Math.max(1, n - (n > 1 ? 1 : 0)), stages = Math.max(1, Math.ceil(Math.log(ratio) / Math.log(3.5) - 1e-9));
  const hp = (stages * (i.w / running / i.mw) * 1.986 * (i.T + 459.67) * (k / (k - 1)) * (ratio ** ((k - 1) / k / stages) - 1)) / 0.75 / 2544.43;
  return { hp, stages, ratio, acfm: (cfs(i) / running) * 60, installed: n, running };
}
/** SW-PRC-11: whose liquid feed sizes each reactor, the space velocity, the share of the catalyst and the bed's height in diameters */
const REACTOR_FEED: Record<string, { from: string; port: string; lhsv: number; share: number; ratio: number }> = {
  'R-1301': { from: 'D-1301', port: 'outlet', lhsv: 6, share: 1, ratio: 3 }, 'R-1501': { from: 'D-1501', port: 'outlet', lhsv: 3, share: 1, ratio: 3 }, 'R-1601': { from: 'D-1601', port: 'outlet', lhsv: 1.2, share: 1, ratio: 3 },
  'R-1401': { from: 'D-1401', port: 'outlet', lhsv: 1.6, share: 0.2, ratio: 2 }, 'R-1402': { from: 'D-1401', port: 'outlet', lhsv: 1.6, share: 0.3, ratio: 2 }, 'R-1403': { from: 'D-1401', port: 'outlet', lhsv: 1.6, share: 0.5, ratio: 2 },
};

let cache: Map<number, UnitSizing> | undefined;
/** every unit, sized */
export function sizing(): Map<number, UnitSizing> { return (cache ??= new Map(processModel().sheets.map(sh => [sh.no, sizeUnit(sh)]))); }
/**
 * The line a stream between units runs in (SW-REF-12): the size of its largest end; the temperature of its hottest;
 * the pressure of the ends that reach it without a control valve at the battery limit, and of the units that receive it.
 * A unit's control valve station at its battery limit is where the class may change.
 */
export function transferLine(key: string): { NPS: number; cls: PipeClass; designP: number; designT: number; opP: number } {
  const M = processModel(), Z = sizing(); let NPS = 0, designT = 0, designP = 0, opP = -ATM, found = false;
  for (const sh of M.sheets) for (const l of sh.lines) for (const [e, sending] of [[l.from, false], [l.to, true]] as const) if (e.k === 'bl' && e.name === key) {
    const z = Z.get(sh.no)!.lines[l.id]; found = true; NPS = Math.max(NPS, z.NPS); designT = Math.max(designT, z.designT);
    if (!(sending && l.cv)) { designP = Math.max(designP, z.designP); opP = Math.max(opP, l.s.P); }
  }
  if (!found) throw new Error(`no stream ${key}`);
  if (designP === 0) { const t = M.transfers.find(x => x.key === key)!; opP = Math.max(...t.from.map(p => p.s.P)); designP = designPressure(opP); }   // a stream with no receiving unit and a valve at every source
  return { NPS, cls: classFor(designP, designT), designP, designT, opP };
}
export type { PLine };
