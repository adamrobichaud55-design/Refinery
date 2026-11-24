/**
 * Plant 3 flowsheets (DESIGN_BASIS.md §74, SW-REF-10): a unit is written as streams passing through equipment, and the
 * builder records every equipment item with its ports and duty and every line with the condition of what it carries.
 * The sizes of SW-PRC-* and the piping line list follow from this record; nothing here is geometry.
 */
import { FLUIDS, type State, type Phase } from './fluids';

export type EqKind = 'pump' | 'hx' | 'aircooler' | 'heater' | 'drum' | 'vessel' | 'column' | 'reactor' | 'compressor' | 'blower' | 'filter' | 'ejector' | 'desalter'
  | 'boiler' | 'deaerator' | 'coolingtower' | 'tank' | 'sphere' | 'bullet' | 'stack' | 'cracker' | 'scrubber' | 'fluegascooler' | 'furnace' | 'condenser' | 'incinerator' | 'psa' | 'hopper' | 'pit' | 'basin' | 'flare' | 'loading' | 'package';
export interface Port { name: string; dir: 'in' | 'out'; s: State }
export interface Equip {
  tag: string; unit: number; kind: EqKind; service: string; /** an installed spare stands beside it (SW-PRC-5) */ spare: boolean; ports: Port[];
  /** stated parameters (drawing data) and, after sizing, the sizes */ p: Record<string, number | string>;
  /** heat duty by side, Btu/h (positive: the stream is heated) */ duty: Record<string, number>;
}
export type End = { k: 'eq'; tag: string; port: string } | { k: 'bl'; name: string } | { k: 'tap'; line: number };
export interface PLine { id: number; unit: number; from: End; to: End; s: State; /** to a pump or compressor suction, or gravity flow (SW-PRC-4) */ slow: boolean; /** a control valve station at the destination (SW-LL-3) */ cv: boolean; note: string }
/** a utility connection on an item: steam to a reboiler, cooling water to a cooler, fuel gas to a heater (SW-PRC-15) */
export interface Util { fluid: string; tag: string; port: string; dir: 'to' | 'from'; w: number; T: number; P: number }
export type UtilKind = 'CW' | 'LS' | 'MS' | 'HS' | 'SG-LS' | 'SG-MS' | 'SG-HS';
/** steam levels: gauge pressure, psi, and temperature, °F (SW-REF-10, unit 19) */
export const STEAM = { HS: { P: 600, T: 650 }, MS: { P: 150, T: 400 }, LS: { P: 50, T: 300 } } as const;
/** the temperature each steam level condenses at, °F (properties of water, round figures: SW-PRC-8) */
export const STEAM_SAT = { HS: 490, MS: 365, LS: 300 } as const;
export interface UnitSheet { no: number; name: string; equip: Map<string, Equip>; lines: PLine[]; utils: Util[]; blIn: Map<string, State>; blOut: Map<string, State> }

const cpOf = (s: State) => { const f = FLUIDS[s.fluid]; return s.ph === 'L' ? f.cpL : s.ph === 'V' ? f.cpV : s.vf * f.cpV + (1 - s.vf) * f.cpL; };
/** heat taken up by a stream going from state a to state b, Btu/h: sensible on the mean specific heat, plus latent on the mass vaporised */
export function heat(a: State, b: State): number { const f = FLUIDS[a.fluid]; return a.w * (((cpOf(a) + cpOf(b)) / 2) * (b.T - a.T) + (b.vf - a.vf) * f.latent); }

interface Thru { service?: string; /** pressure drop, psi */ dP?: number; P?: number; ph?: Phase; vf?: number; mw?: number; sg?: number; cv?: boolean; shells?: number; spare?: boolean; note?: string; /** mass joining inside or just ahead of the item, lb/h */ addW?: number; fluid?: string; /** the utility on the other side of an exchanger, or raised or used by the item */ util?: UtilKind; /** installed machines where not one and a spare */ count?: number }

export class Flow {
  lastLine = -1;
  private waiting: ((id: number) => void)[] = [];
  /** what the branches waiting to leave this stream's next line take with them, lb/h */
  private leaving = 0;
  constructor(readonly u: UnitBuilder, public s: State, public at: End) {}
  private line(to: End, slow = false, cv = false, note = ''): number {
    if (this.at.k === 'tap' && this.at.line < 0) throw new Error(`unit ${this.u.sheet.no}: a branch is used before the run it leaves (${note || JSON.stringify(to)})`);
    // a line that branches leave carries their flow too as far as the tee, and is sized for it (SW-PRC-4)
    const id = this.u.sheet.lines.length; this.u.sheet.lines.push({ id, unit: this.u.sheet.no, from: this.at, to, s: { ...this.s, w: this.s.w + this.leaving }, slow, cv, note });
    this.lastLine = id; this.leaving = 0; for (const w of this.waiting.splice(0)) w(id);
    return id;
  }
  /** change the stream's condition without equipment (a valve's pressure drop, a named phase) */
  set(c: Partial<State>): this { this.s = { ...this.s, ...c }; return this; }
  private pass(tag: string, kind: EqKind, pin: string, pout: string, next: Partial<State>, o: Thru, slow = false): this {
    const e = this.u.eq(tag, kind, o.service ?? '', o.spare ?? kind === 'pump');
    if (o.shells) e.p.shells = o.shells; if (o.count) e.p.count = o.count;
    this.line({ k: 'eq', tag, port: pin }, slow, !!o.cv, o.note ?? '');
    e.ports.push({ name: pin, dir: 'in', s: { ...this.s } });
    const out: State = { ...this.s, ...next }; if (out.ph === 'L') out.vf = 0; if (out.ph === 'V') out.vf = 1;
    if (out.ph !== 'V' && !(out.sg > 0)) out.sg = FLUIDS[out.fluid].sg0; if (out.ph !== 'L' && !(out.mw > 0)) out.mw = FLUIDS[out.fluid].mw0;
    const side = pin.replace(/ in$/, '').replace(/^(inlet|S|suction)$/, 'process'), q = heat(this.s, out); e.duty[side] = (e.duty[side] ?? 0) + q;
    if (o.addW) out.w += o.addW; if (o.fluid) out.fluid = o.fluid;
    if (o.util) this.u.utilityFor(e, o.util, q, kind === 'hx' ? (side === 'shell' ? 'tube' : 'shell') : '');
    this.s = out; e.ports.push({ name: pout, dir: 'out', s: { ...out } }); this.at = { k: 'eq', tag, port: pout };
    return this;
  }
  private nx(o: Thru, T?: number, dP = 0): Partial<State> { return { ...(T !== undefined ? { T } : {}), P: o.P ?? this.s.P - (o.dP ?? dP), ...(o.ph ? { ph: o.ph } : {}), ...(o.vf !== undefined ? { vf: o.vf } : {}), ...(o.mw ? { mw: o.mw } : {}), ...(o.sg ? { sg: o.sg } : {}) }; }
  /** a pump (with its installed spare) raising the stream to a discharge pressure */
  pump(tag: string, Pout: number, service = '', o: Thru = {}): this { return this.pass(tag, 'pump', 'S', 'D', { P: Pout }, { ...o, service }, true); }
  /** one side of a shell-and-tube exchanger, leaving at Tout */
  hx(tag: string, side: 'shell' | 'tube', Tout: number, service = '', o: Thru = {}): this { return this.pass(tag, 'hx', `${side} in`, `${side} out`, this.nx(o, Tout, 10), { ...o, service }); }
  /** the other side of an exchanger whose first side is already written: it leaves at the temperature its duty gives */
  hxMatch(tag: string, side: 'shell' | 'tube', o: Thru = {}): this {
    const e = this.u.sheet.equip.get(tag); if (!e) throw new Error(`${tag}: the other side is not written yet`);
    const q = -Object.values(e.duty).reduce((a, b) => a + b, 0), f = FLUIDS[this.s.fluid], end: State = { ...this.s, ...this.nx(o, this.s.T, 10) };
    if (end.ph === 'L') end.vf = 0; if (end.ph === 'V') end.vf = 1;
    const cp = (cpOf(this.s) + cpOf(end)) / 2, Tout = this.s.T + (q / this.s.w - (end.vf - this.s.vf) * f.latent) / cp;
    return this.pass(tag, 'hx', `${side} in`, `${side} out`, this.nx(o, Tout, 10), o);
  }
  /** an air cooler */
  air(tag: string, Tout: number, service = '', o: Thru = {}): this { return this.pass(tag, 'aircooler', 'inlet', 'outlet', this.nx(o, Tout, 5), { ...o, service }); }
  /** a fired heater */
  fired(tag: string, Tout: number, service = '', o: Thru = {}): this { return this.pass(tag, 'heater', 'inlet', 'outlet', this.nx(o, Tout, 40), { ...o, service }); }
  /** any other item the stream passes straight through */
  thru(tag: string, kind: EqKind, service = '', o: Thru & { T?: number; in?: string; out?: string } = {}): this { return this.pass(tag, kind, o.in ?? 'inlet', o.out ?? 'outlet', this.nx(o, o.T, 5), { ...o, service }, kind === 'compressor' || kind === 'blower'); }
  /** end at a port of a vessel, column, tank or other item with several connections */
  into(tag: string, port: string, o: { kind?: EqKind; service?: string; cv?: boolean; slow?: boolean; note?: string } = {}): void {
    const e = this.u.eq(tag, o.kind ?? 'drum', o.service ?? '', false);
    this.line({ k: 'eq', tag, port }, !!o.slow, !!o.cv, o.note ?? ''); e.ports.push({ name: port, dir: 'in', s: { ...this.s } });
  }
  /** end at the unit's battery limit; streams leaving under one name add */
  toBL(name: string, o: { cv?: boolean } = {}): void { this.line({ k: 'bl', name }, false, !!o.cv, name); const b = this.u.sheet.blOut.get(name); this.u.sheet.blOut.set(name, b ? { ...b, w: b.w + this.s.w } : { ...this.s }); }
  /** take w lb/h off as a branch; this stream goes on with the rest, and the branch leaves the next line this stream runs */
  split(w: number, c: Partial<State> = {}): Flow {
    if (w >= this.s.w) throw new Error(`unit ${this.u.sheet.no}: a branch of ${w} from a stream of ${this.s.w}`);
    const at: End = { k: 'tap', line: -1 }, b = new Flow(this.u, { ...this.s, ...c, w }, at); this.s = { ...this.s, w: this.s.w - w };
    this.waiting.push(id => { at.line = id; }); this.leaving += w;
    return b;
  }
  /** an alternative route for the whole stream, one route flowing at a time (the tanks on one rundown): it leaves the next line this stream runs, and this stream goes on undiminished */
  alt(c: Partial<State> = {}): Flow {
    const at: End = { k: 'tap', line: -1 }, b = new Flow(this.u, { ...this.s, ...c }, at);
    this.waiting.push(id => { at.line = id; });
    return b;
  }
  /**
   * End as a branch into a line: the one another stream ran last, or a line by its number. A branch into a line that
   * leaves the unit adds to what leaves, unless it is a standby source that flows instead of the main one.
   */
  mixInto(target: Flow | number, note = '', o: { slow?: boolean; standby?: boolean } = {}): void {
    const id = typeof target === 'number' ? target : target.lastLine, sh = this.u.sheet;
    if (id < 0 || id >= sh.lines.length) throw new Error(`unit ${sh.no}: nothing to join (${note})`);
    this.line({ k: 'tap', line: id }, !!o.slow, false, note);
    const l = sh.lines[id];
    if (l.to.k === 'bl' && !o.standby) { l.s = { ...l.s, w: l.s.w + this.s.w }; const b = sh.blOut.get(l.to.name)!; sh.blOut.set(l.to.name, { ...b, w: b.w + this.s.w }); }
  }
}

export class UnitBuilder {
  readonly sheet: UnitSheet;
  constructor(no: number, name: string) { this.sheet = { no, name, equip: new Map(), lines: [], utils: [], blIn: new Map(), blOut: new Map() }; }
  /** a utility connection stated outright */
  utility(fluid: string, tag: string, port: string, dir: 'to' | 'from', w: number, T: number, P: number): void {
    const e = this.sheet.equip.get(tag); if (!e) throw new Error(`${tag} is not declared`);
    this.sheet.utils.push({ fluid, tag, port, dir, w, T, P });
  }
  /** the utility side of an item of duty q (Btu/h into the process): cooling water rising 20 °F, steam condensing, or steam raised from boiler feed water */
  utilityFor(e: Equip, k: UtilKind, q: number, side: string): void {
    const a = Math.abs(q), pre = side ? `${side} ` : '', port = (io: string) => (side ? `${side} ${io}` : io);
    e.p.utility = k;
    if (k === 'CW') { const w = a / 20; this.utility('CWS', e.tag, port('in'), 'to', w, 85, 60); this.utility('CWR', e.tag, port('out'), 'from', w, 105, 45); }
    else if (k === 'LS' || k === 'MS' || k === 'HS') { const w = a / FLUIDS[k].latent; this.utility(k, e.tag, side ? `${pre}in` : 'steam in', 'to', w, STEAM[k].T, STEAM[k].P); this.utility('CO', e.tag, side ? `${pre}out` : 'condensate out', 'from', w, STEAM[k].T - 40, STEAM[k].P - 10); }
    else { const lv = k.slice(3) as 'LS' | 'MS' | 'HS', w = a / (FLUIDS[lv].latent + 150); this.utility('BW', e.tag, side ? `${pre}in` : 'feed water in', 'to', w, 250, STEAM[lv].P + 100); this.utility(lv, e.tag, side ? `${pre}out` : 'steam out', 'from', w, STEAM_SAT[lv], STEAM[lv].P); }
  }
  /** a port open to the atmosphere or to a duct, with no line (an air intake, a stack) */
  open(tag: string, port: string, dir: 'in' | 'out', s: State): void { const e = this.sheet.equip.get(tag); if (!e) throw new Error(`${tag} is not declared`); e.ports.push({ name: `${port} (open)`, dir, s: { ...s } }); }
  eq(tag: string, kind: EqKind, service: string, spare = false): Equip {
    let e = this.sheet.equip.get(tag);
    if (!e) { e = { tag, unit: this.sheet.no, kind, service, spare, ports: [], p: {}, duty: {} }; this.sheet.equip.set(tag, e); }
    else { if (service && !e.service) e.service = service; if (e.kind !== kind && kind !== 'drum') throw new Error(`${tag} is a ${e.kind}, not a ${kind}`); }
    return e;
  }
  /** declare an item with its stated parameters (trays, pressure, a vapour load, a volume) before streams reach it */
  item(tag: string, kind: EqKind, service: string, p: Record<string, number | string> = {}): Equip { const e = this.eq(tag, kind, service, false); Object.assign(e.p, p); return e; }
  /** a stream entering at the battery limit */
  feed(name: string, s: State): Flow { const b = this.sheet.blIn.get(name); this.sheet.blIn.set(name, b ? { ...b, w: b.w + s.w } : { ...s }); return new Flow(this, { ...s }, { k: 'bl', name }); }
  /** a stream leaving a port of an item */
  out(tag: string, port: string, s: State): Flow {
    const e = this.sheet.equip.get(tag); if (!e) throw new Error(`${tag} is not declared`);
    e.ports.push({ name: port, dir: 'out', s: { ...s } }); return new Flow(this, { ...s }, { k: 'eq', tag, port });
  }
  /** the finished sheet, checked: every line resolved, every item connected both ways unless it is a source or a sink */
  done(): UnitSheet {
    const sh = this.sheet;
    for (const l of sh.lines) for (const e of [l.from, l.to]) if (e.k === 'tap' && (e.line < 0 || e.line >= sh.lines.length)) throw new Error(`unit ${sh.no}: line ${l.id} has an unresolved branch`);
    const ENDS = new Set<EqKind>(['tank', 'sphere', 'bullet', 'stack', 'flare', 'pit', 'basin', 'loading', 'hopper', 'coolingtower']);
    for (const e of sh.equip.values()) {
      const ins = e.ports.filter(p => p.dir === 'in').length, outs = e.ports.filter(p => p.dir === 'out').length;
      if (!e.service) throw new Error(`${e.tag} has no service`);
      if (!ENDS.has(e.kind) && (ins === 0 || outs === 0)) throw new Error(`${e.tag} (${e.service}) has ${ins} inlets and ${outs} outlets`);
      const names = e.ports.map(p => p.name); if (new Set(names).size !== names.length) throw new Error(`${e.tag} has a port connected twice: ${names.join(', ')}`);
    }
    return sh;
  }
}
