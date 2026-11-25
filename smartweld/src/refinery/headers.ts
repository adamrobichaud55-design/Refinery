/**
 * Plant 3: the utility headers (DESIGN_BASIS.md SW-PRC-19, SW-RPI-5, SW-PWY-11). A utility is one system of pipe:
 * unit 19's line to it or from it, the plant's header along the main rack and the header of each unit that takes
 * from it or makes into it. This module sizes a unit's headers and the plant's; it holds no geometry.
 */
import type { PipeClass } from '../catalogue';
import { processModel, type Header } from './process';
import { sizing, lineSize, utilState, headerDesign, stationed, type UnitSizing } from './sizing';

type Conn = UnitSizing['utils'][number];
/** SW-PRC-19, SW-RPI-9: a connection as it meets its header: its size, the class of the part that taps the header, and whether a control valve station divides it */
export function connection(u: Conn): { NPS: number; cls: PipeClass; station: boolean } {
  if (!stationed(u)) return { NPS: u.NPS, cls: u.cls, station: false };
  const hd = headerDesign(u.fluid);
  return { NPS: Math.max(u.NPS, lineSize(utilState(u), false, hd.cls, 2).NPS), cls: hd.cls, station: true };   // both parts of one size, the larger of what each alone would be
}

/** a unit's header of one utility (SW-RPI-5): sized for the larger of what its items take from it and what they make into it, not smaller than its largest connection; of the plant header's class and conditions (SW-PRC-19) */
export interface UnitHeader {
  unit: number; fluid: string; /** the plant header's name (unit 19's stream) */ key: string; NPS: number; cls: PipeClass; designP: number; designT: number;
  /** what its items take from it and make into it, lb/h */ takes: number; makes: number; /** its connections: indices into the unit's utility connections */ utils: number[];
}
/** SW-RPI-5: the headers of a unit, in the order its flowsheet first names each utility. `here`: whether an item stands on the plot in question (unit 19's cooling tower group has a plot of its own) */
export function unitHeaders(unit: number, here: (tag: string) => boolean = () => true): UnitHeader[] {
  const M = processModel(), Z = sizing().get(unit)!, byFluid = new Map<string, number[]>();
  Z.utils.forEach((u, i) => { if (here(u.tag)) byFluid.set(u.fluid, [...(byFluid.get(u.fluid) ?? []), i]); });
  return [...byFluid].map(([fluid, utils]) => {
    const us = utils.map(i => Z.utils[i]), hd = headerDesign(fluid), key = M.headers.find(h => h.fluid === fluid)?.key; if (!key) throw new Error(`unit ${unit}: no plant header for ${fluid}`);
    const takes = us.filter(u => u.dir === 'to').reduce((a, u) => a + u.w, 0), makes = us.filter(u => u.dir === 'from').reduce((a, u) => a + u.w, 0), P = Math.max(...us.map(u => u.P)), T = Math.max(...us.map(u => u.T));
    const NPS = Math.max(lineSize(utilState({ fluid, w: Math.max(takes, makes), T, P }), false, hd.cls, 2).NPS, ...us.map(u => connection(u).NPS));   // no stretch of it carries more than the larger of the two
    return { unit, fluid, key, NPS, cls: hd.cls, designP: hd.designP, designT: hd.designT, takes, makes, utils };
  });
}

/** a party on a plant header: a unit's own header, with what it makes less what it takes; or unit 19's line, with the balance */
export interface HeaderParty { unit: number; /** unit 19's line to the header or from it, not a header of the unit */ line?: boolean; /** what it puts into the header less what it takes, lb/h */ net: number; /** where it stands along the main rack, in */ x: number }
/** the plant's header of one utility (SW-PRC-19) */
export interface PlantHeader {
  fluid: string; key: string; dir: Header['dir']; NPS: number; cls: PipeClass; designP: number; designT: number;
  /** unit 19's line to it or from it: its size and what it is sized for, lb/h */ line: { NPS: number; w: number };
  /** the largest flow a stretch of it carries, lb/h, and the size for that alone */ stretch: number; stretchNPS: number; /** the largest unit header that joins it */ joined: number;
  /** what the units make into it and take from it, lb/h */ made: number; used: number; parties: HeaderParty[];
}
/**
 * SW-PRC-19: the plant's headers. Each is the size of unit 19's line, or larger where a stretch of it carries more (the parties in their order along the rack,
 * unit 19's line with the balance) or where a unit's header that joins it is larger. `xOf`: where a unit stands along the main rack.
 */
export function plantHeaders(xOf: (unit: number) => number, here: (unit: number, tag: string) => boolean = () => true): PlantHeader[] {
  const M = processModel(), Z = sizing(), s19 = M.sheet(19), z19 = Z.get(19)!;
  return M.headers.map(h => {
    const i = s19.lines.findIndex(l => (l.to.k === 'bl' && l.to.name === h.key) || (l.from.k === 'bl' && l.from.name === h.key)); if (i < 0) throw new Error(`unit 19 has no line for ${h.key}`);
    const hd = headerDesign(h.fluid), s = s19.lines[i].s, net = new Map<number, number>();
    for (const p of h.made) net.set(p.unit, (net.get(p.unit) ?? 0) + p.w); for (const p of h.used) net.set(p.unit, (net.get(p.unit) ?? 0) - p.w);
    const others: HeaderParty[] = [...net].map(([unit, w]) => ({ unit, net: w, x: xOf(unit) })), balance = -others.reduce((a, p) => a + p.net, 0);
    const parties = [...others, { unit: 19, line: true, net: balance, x: xOf(19) }].sort((a, b) => a.x - b.x || Number(!!b.line) - Number(!!a.line));
    let run = 0, stretch = 0; for (const p of parties.slice(0, -1)) { run += p.net; stretch = Math.max(stretch, Math.abs(run)); }
    const stretchNPS = stretch > 0 ? lineSize(utilState({ fluid: h.fluid, w: stretch, T: s.T, P: s.P }), false, hd.cls, 2).NPS : 0;
    const joined = Math.max(0, ...M.sheets.filter(sh => net.has(sh.no)).flatMap(sh => unitHeaders(sh.no, tag => here(sh.no, tag)).filter(q => q.fluid === h.fluid).map(q => q.NPS)));
    return { fluid: h.fluid, key: h.key, dir: h.dir, NPS: Math.max(z19.lines[i].NPS, stretchNPS, joined), cls: hd.cls, designP: hd.designP, designT: hd.designT, line: { NPS: z19.lines[i].NPS, w: s.w },
      stretch, stretchNPS, joined, made: h.made.reduce((a, p) => a + p.w, 0), used: h.used.reduce((a, p) => a + p.w, 0), parties };
  });
}
