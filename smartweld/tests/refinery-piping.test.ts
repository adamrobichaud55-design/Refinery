/** Plant 3, the coastal refinery: a unit piped (DESIGN_BASIS.md §79). What the generator of plants 1 and 2 is given for a
 *  unit — nozzles, lines, battery limit spools — follows the flowsheet and the rules; and the piped units on disk are whole:
 *  every line routed, continuous, jointed by its class, clear of every other and of the steel. Generating a unit takes
 *  minutes, so the saved model is checked rather than made again here (tools/refinery-piping.ts makes it). */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { unitPiping, gateReach, gateWidth, laneSpacing, heldAs, BIG, TIER_ROOM, TIER_SHARE } from '../src/refinery/unitPiping';
import { processModel } from '../src/refinery/process';
import { sizing } from '../src/refinery/sizing';
import { serviceOf } from '../src/refinery/registry';
import { RACK, PAD, valveDrop, bodySolids } from '../src/refinery/cell';
import { pipingDocument, cutLongPipes, lengthenShortPieces, measuredAgain, elbowGap, valveBoxFn, runSolids, PIPING_IMAGES, type PipedUnit } from '../src/refinery/pipingReport';
import * as K from '../src/generator/pipingCheck';
import { makeValve, gateFaceToFace, globeFaceToFace, designFlange, pipeDims, elbowRadius } from '../src/catalogue';
import { worldBox, type PipingModel } from '../src/generator/piping';

const M = processModel(), Z = sizing(), U = 15, up = unitPiping(U), sh = M.sheet(U), z = Z.get(U)!;
const basisDoc = readFileSync(new URL('../DESIGN_BASIS.md', import.meta.url), 'utf8');
const dir = new URL('../public/refinery/piping/', import.meta.url);
const reports = readdirSync(dir).filter(f => /^unit-\d+\.report\.json$/.test(f)).map(f => JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as PipedUnit).sort((a, b) => a.unit - b.unit);

describe('plant 3: what the generator is given for a unit (SW-RPI-1 to SW-RPI-5)', () => {
  it('every connection of every body is a nozzle of its line\'s size and class, its axis on the 6 in grid', () => {
    for (const e of sh.equip.values()) for (const [k, s] of up.cell.spots.filter(q => q.item === e.tag).entries()) for (const q of z.equip.get(e.tag)!.nozzles) {
      const id = `${s.tag}-${q.port === 'S' || q.port === 'D' ? q.port : `N${z.equip.get(e.tag)!.nozzles.indexOf(q) + 1}`}`, n = up.nozzles.get(id)!;
      expect(n, `${id} (body ${k})`).toBeDefined(); expect(n.NPS).toBe(q.NPS); expect(Number(n.cls.slice(1))).toBeLessThanOrEqual(Number(q.cls.slice(1))); if (q.dir === 'out' || !sh.lines[q.line ?? -1]?.cv) expect(n.cls).toBe(q.cls); expect(n.equip).toBe(s.tag);   /* a destination past a control station may be of a lower class (SW-RPI-9) */
    }
    for (const n of up.nozzles.values()) {
      const axis = n.u.map(Math.abs).indexOf(1); expect(axis, n.id).toBeGreaterThanOrEqual(0);
      for (let a = 0; a < 3; a++) if (a !== axis) expect(Math.abs(n.face[a] / 6 - Math.round(n.face[a] / 6)), `${n.id} axis ${a} at ${n.face[a]}`).toBeLessThan(1e-9);
      expect(n.S).toBeGreaterThan(0);
    }
    expect(up.notes.filter(s => /stand .* apart/.test(s))).toEqual([]);                                // no two nozzles' valve stacks in each other's way
  });
  it('places nozzles by the kind of body', () => {
    const N = (id: string) => up.nozzles.get(id)!;
    for (const s of up.cell.spots.filter(q => q.shape === 'pump')) { const su = N(`${s.tag}-S`), di = N(`${s.tag}-D`); expect(su.u).toEqual([0, 0, -s.side]); expect(su.face[1]).toBe(s.yc); expect(di.u).toEqual([0, 1, 0]); expect(di.face[2]).toBe(s.zc); expect(su.service).toBe('suction'); expect(di.service).toBe('discharge'); }
    for (const s of up.cell.spots.filter(q => q.shape === 'hx')) { const ns = [...up.nozzles.values()].filter(n => n.equip === s.tag); expect(ns.length).toBe(4); expect(ns.filter(n => n.u[1] > 0).length).toBe(2); expect(ns.filter(n => n.u[1] < 0).length).toBe(2);
      const tube = ns.filter(n => /tube/.test(n.service)); for (const n of tube) expect(n.face[2]).toBe(s.zc); }
    const col = up.cell.spots.find(q => q.tag === 'C-1501')!, cn = [...up.nozzles.values()].filter(n => n.equip === 'C-1501');
    expect(cn.find(n => n.service === 'overhead')!.u).toEqual([0, 1, 0]); expect(cn.find(n => n.service === 'overhead')!.face[1]).toBeGreaterThanOrEqual(col.floors![col.floors!.length - 1] + 54);
    for (const n of cn.filter(q => q.u[1] === 0)) expect(n.u).toEqual([0, 0, 1]);                         // every shell connection faces the rack
    const shellEl = cn.filter(q => q.u[1] === 0).map(q => q.face[1]).sort((a, b) => a - b); for (let i = 1; i < shellEl.length; i++) expect(shellEl[i] - shellEl[i - 1]).toBeGreaterThanOrEqual(36);
    // the platforms, ladders and davit of a column stand on the half away from the rack (SW-CELL-4): none of their solids reaches the rack side of the shell's axis by more than the ladders' depth
    const access = bodySolids(up.cell, 'C-1501').filter(b => /^(platform|ladder|davit)/.test(b.name)); expect(access.length).toBeGreaterThan(10);
    for (const b of access) expect(b.mx[2], b.name).toBeLessThan(/^platform/.test(b.name) ? col.z + 6 : col.z + col.R! + 12);   /* the platforms end at the axis; a ladder's cage at their ends comes about level with the shell's face */
    for (const b of access.filter(q => /davit arm/.test(q.name))) expect(b.mx[2]).toBeLessThan(col.z - 6);             // the arm swung away from the top nozzle
    for (const s of up.cell.spots.filter(q => q.kind === 'aircooler')) {   // in on top of the header, out through its outer face, 3 ft either side of the bay's centre
      const ns = [...up.nozzles.values()].filter(q => q.equip === s.tag), i = ns.find(q => q.service === 'inlet')!, o = ns.find(q => q.service === 'outlet')!;
      expect(i.u).toEqual([0, 1, 0]); expect(Math.abs(i.A[2])).toBe(198); expect(i.A[1]).toBe(s.yt); expect(i.A[0]).toBe(s.x - 36);
      expect(o.u[0]).toBe(0); expect(o.u[1]).toBe(0); expect(Math.abs(o.u[2])).toBe(1); expect(Math.abs(o.A[2])).toBe(204); expect(Math.sign(o.A[2])).toBe(Math.sign(i.A[2])); expect(o.A[0]).toBe(s.x + 36); expect(o.A[1]).toBeLessThan(s.yt!); expect(o.A[1]).toBeGreaterThan(RACK.tiers[2] + 108);
    }
  });
  it('lists every line of the flowsheet with its size, class, service and ends, and a tee for every spare', () => {
    const proc = up.lines.filter(l => l.origin === 'process'); expect(proc.length).toBe(sh.lines.length);
    proc.forEach((l, i) => { const s = z.lines[i], f = sh.lines[i]; expect(l.def.NPS).toBe(s.NPS); expect(l.def.cls).toBe(s.cls); expect(l.def.service).toBe('P'); expect(serviceOf(f.s.fluid, s.cls, false)).toBe('P');   /* a line of the flowsheet is built as a process line whatever it carries (SW-RPI-3) */ expect(l.def.no).toMatch(new RegExp(`-${U * 1000 + i + 1}$`)); expect(l.def.NPS).toBeGreaterThanOrEqual(3); expect(l.designP).toBe(s.designP);
      if (f.cv) expect(!!l.def.cv || !!l.cvOmitted, l.def.no).toBe(true); else expect(!!l.def.cv).toBe(false);
      if (l.def.cv) { const to = l.def.to; expect(to.k).toBe('nozzle'); const n = up.nozzles.get((to as { id: string }).id)!; expect(n.u[1], `${l.def.no} station at ${n.id}`).toBeGreaterThanOrEqual(0); expect(n.service).not.toBe('discharge'); } });
    const spares = up.lines.filter(l => l.origin === 'spare'); let want = 0;
    for (const f of sh.lines) for (const en of [f.from, f.to]) if (en.k === 'eq') want += up.cell.spots.filter(q => q.item === en.tag).length - 1;
    expect(spares.length).toBe(want); for (const l of spares) { expect([l.def.from.k, l.def.to.k].sort()).toEqual(['nozzle', 'tap']); expect(Number(l.def.no.slice(-5)) - U * 1000).toBeGreaterThan(300); }
    expect(new Set(up.lines.map(l => l.def.no)).size).toBe(up.lines.length);
  });
  it('gives each utility a header on the rack and each connection a valved take-off', () => {
    const fluids = new Set(z.utils.map(u => u.fluid)), headers = up.lines.filter(l => l.origin === 'header'); expect(headers.length).toBe(fluids.size);
    for (const h of headers) { expect(h.def.kind).toBe('header'); const taps = up.lines.filter(l => l.origin === 'utility' && l.fluid === h.fluid); expect(taps.length).toBeGreaterThan(0); for (const t of taps) { expect(h.def.NPS).toBeGreaterThanOrEqual(t.def.NPS); const tap = t.def.from.k === 'tap' ? t.def.from : t.def.to; expect(tap.k === 'tap' && tap.line === h.def.no && tap.valve).toBe(true); } }
    expect(up.lines.filter(l => l.origin === 'utility').length).toBe(z.utils.length);
  });
  it('ends every stream at the battery limit in a spool in the valve bay, on its line\'s lane, a flange apart, at its line\'s elevation (SW-RPI-4)', () => {
    const bl = sh.lines.filter(l => l.from.k === 'bl' || l.to.k === 'bl').length; expect(up.spools.length).toBe(bl);
    for (const t of RACK.tiers.keys()) {
      const row = up.spools.filter(s => s.tier === t).sort((a, b) => a.at[2] - b.at[2]);
      for (const [i, s] of row.entries()) {
        expect(s.at[0]).toBeGreaterThan(RACK.start - RACK.bent); expect(s.at[0]).toBeLessThan(RACK.start - 60); expect(s.at[1]).toBe(Math.ceil((RACK.tiers[t] + 4 + pipeDims(s.NPS, s.cls).OD / 2) / 6 - 1e-9) * 6);
        const inner = up.nozzles.get(`${s.tag}-U`)!, outer = up.nozzles.get(`${s.tag}-P`)!; expect(inner.u).toEqual([1, 0, 0]); expect(outer.u).toEqual([-1, 0, 0]); expect(inner.face[0] - outer.face[0]).toBe(24);
        if (i) expect(s.at[2] - row[i - 1].at[2]).toBeGreaterThanOrEqual((designFlange(s.NPS, s.cls).OD + designFlange(row[i - 1].NPS, row[i - 1].cls).OD) / 2 + 6 - 1e-9);
        if (i) expect(s.at[2] - row[i - 1].at[2], `${s.tag} handwheels`).toBeGreaterThanOrEqual((gateWidth(s.NPS, s.cls) + gateWidth(row[i - 1].NPS, row[i - 1].cls)) / 2 + 3 - 1e-9);   // their valves stand stem up side by side
        expect(Math.abs(s.at[2])).toBeLessThan(up.cell.rack.halfWidth);
        const tall = gateReach(s.NPS) > RACK.tiers[1] - RACK.tiers[0] - 12, highest = Math.max(0, ...up.lines.map(l => l.tier ?? 0));
        expect(s.tier).toBe(up.lines.find(l => l.def.no === s.line)!.tier ?? (tall ? highest : 0));         // at its line's tier; with no lane, on the lowest, or the highest in use where its valve is too tall to stand under another
      }
      // on their lanes, in order; spread only where flanges would be closer than 6 in, about the same middle; those with no lane beyond the row's ends
      const laned = row.filter(s => s.lane !== undefined); expect(laned.every((v, i) => !i || laned[i - 1].lane! <= v.lane!)).toBe(true);
      if (laned.length) { expect(Math.abs(laned.reduce((a, q) => a + q.at[2] - q.lane!, 0) / laned.length)).toBeLessThanOrEqual(6); for (const q of laned) expect(Math.abs(q.at[2] - q.lane!), q.tag).toBeLessThanOrEqual(48); }
      for (const [i, q] of laned.entries()) { const a = laned[i - 1], b = laned[i + 1], f = (x: typeof q) => designFlange(x.NPS, x.cls).OD, free = (x: typeof q | undefined) => !x || Math.abs(x.lane! - q.lane!) >= (f(x) + f(q)) / 2 + 6 + 12; if (free(a) && free(b) && laned.length < 3) expect(q.at[2], q.tag).toBe(q.lane); }
      for (const q of row.filter(s => s.lane === undefined)) if (laned.length) expect(q.at[2] < laned[0].at[2] || q.at[2] > laned[laned.length - 1].at[2], q.tag).toBe(true);
    }
  });
  it('sets the connections of the desalter, a horizontal reactor, a boiler, a deaerator and an air compressor where their rules say (SW-RPI-2)', () => {
    const nz = (q: ReturnType<typeof unitPiping>, tag: string, service: string) => { const n = [...q.nozzles.values()].find(x => x.equip === tag && x.service === service); expect(n, `${tag} ${service}`).toBeDefined(); return n!; };
    // the desalter: fed and drained from underneath, its oil from the top at the far end; its shell high enough for the valve under its inlet
    const u11 = unitPiping(11), des = u11.cell.spots.find(q => q.tag === 'D-1101')!, dIn = nz(u11, 'D-1101', 'inlet'), dOil = nz(u11, 'D-1101', 'oil'), dBr = nz(u11, 'D-1101', 'brine');
    expect(dIn.u).toEqual([0, -1, 0]); expect(dBr.u).toEqual([0, -1, 0]); expect(dOil.u).toEqual([0, 1, 0]); expect(dIn.A[0]).toBeLessThan(des.x); expect(dOil.A[0]).toBeGreaterThan(des.x); expect(dBr.A[0]).toBeGreaterThan(des.x);
    expect(des.yc! - des.R! - PAD).toBeGreaterThanOrEqual(valveDrop(dIn.NPS, dIn.cls) - 1e-6);
    // a horizontal reactor: its outlet underneath, with room for its valve
    const u18 = unitPiping(18), rx = u18.cell.spots.find(q => q.tag === 'R-1801')!, rOut = nz(u18, 'R-1801', 'outlet'); expect(rx.shape).toBe('hv'); expect(rOut.u).toEqual([0, -1, 0]); expect(rx.yc! - rx.R! - PAD).toBeGreaterThanOrEqual(valveDrop(rOut.NPS, rOut.cls) - 1e-6);
    // the sulfur unit's tanks stand after its other vessels
    const row = u18.cell.spots.filter(q => q.side === -1 && q.lane === 'vessel'), firstTank = row.findIndex(q => q.shape === 'tank'); expect(firstTank).toBeGreaterThan(0); expect(row.slice(firstTank).every(q => q.shape === 'tank')).toBe(true);
    // a boiler: steam from the superheater's header on top, feed water at the economizer away from the burners, blowdown from the mud drum toward the rack, fuel gas at a burner's windbox
    const u19 = unitPiping(19), box = (tag: string, re: RegExp) => { const bs = bodySolids(u19.cell, tag).filter(b => re.test(b.name)); expect(bs.length, `${tag} ${re}`).toBeGreaterThan(0); return { mn: [0, 1, 2].map(k => Math.min(...bs.map(b => b.mn[k]))), mx: [0, 1, 2].map(k => Math.max(...bs.map(b => b.mx[k]))) }; };
    for (const b of ['B-1901', 'B-1902']) {
      const st = nz(u19, b, 'steam'), fw = nz(u19, b, 'feed water'), bd = nz(u19, b, 'blowdown'), fg = nz(u19, b, 'fuel gas'), sh = box(b, /^superheater headers/), ec = box(b, /^economizer water headers/), mud = box(b, /^mud drum/), wb = box(b, /^burner 1: windbox/), sp = u19.cell.spots.find(q => q.tag === b)!;
      expect(st.u).toEqual([0, 1, 0]); expect(st.A[1]).toBeCloseTo(sh.mx[1], 6); expect(st.A[0]).toBeGreaterThan(sh.mn[0]); expect(st.A[0]).toBeLessThan(sh.mx[0]);
      expect(fw.A[0]).toBeGreaterThan(ec.mn[0] - 6); expect(fw.A[0]).toBeLessThan(ec.mx[0] + 6); expect(Math.abs(fw.u[2])).toBe(1); expect(Math.sign(fw.u[2])).toBe(-Math.sign((wb.mn[2] + wb.mx[2]) / 2 - sp.z));
      expect(bd.u).toEqual([0, 0, -sp.side]); expect(bd.A[1]).toBeGreaterThan(mud.mn[1]); expect(bd.A[1]).toBeLessThan(mud.mx[1]); expect(Math.abs(fg.u[0])).toBe(1); expect(fg.A[1]).toBeGreaterThan(wb.mn[1]); expect(fg.A[1]).toBeLessThan(wb.mx[1]);
      expect(bodySolids(u19.cell, b).some(q => /^superheated steam outlet: /.test(q.name))).toBe(false);           // the catalogue's drawn outlet gives way to the plant's own connection
    }
    // the deaerator: water and steam on its dome, the deaerated water from under the storage shell
    const dome = box('V-1904', /^dome shell$/), da = u19.cell.spots.find(q => q.tag === 'V-1904')!;
    for (const p of ['make-up', 'condensate', 'steam', 'flash steam']) { const n = nz(u19, 'V-1904', p); expect(n.A[1], p).toBeGreaterThan(dome.mn[1]); expect(n.A[0]).toBeGreaterThanOrEqual(dome.mn[0] - 1e-6); expect(n.A[0]).toBeLessThanOrEqual(dome.mx[0] + 1e-6); }
    expect(nz(u19, 'V-1904', 'make-up').u).toEqual([0, 1, 0]); expect(nz(u19, 'V-1904', 'steam').u).toEqual([-1, 0, 0]); expect(nz(u19, 'V-1904', 'outlet').u).toEqual([0, -1, 0]); expect(nz(u19, 'V-1904', 'outlet').A[1]).toBeCloseTo(da.yc! - da.R!, 6);
    // an air compressor drawing from the atmosphere: its discharge on top of the casing
    expect(nz(u19, 'K-1903A', 'discharge').u).toEqual([0, 1, 0]);
    // items on another plot (the cooling tower's group) are reached through spools at the limit; lines wholly of that plot are not in this list
    const sh19 = M.sheet(19), tower = new Set(['X-1903', 'P-1905', 'P-1906', 'F-1902']), touches = (l: typeof sh19.lines[number]) => [l.from, l.to].some(e => e.k === 'eq' && tower.has(e.tag));
    for (const t of tower) expect([...u19.nozzles.values()].some(n => n.equip.startsWith(t))).toBe(false);
    // the make-up to the tower comes from this plot's raw water line: it ends at a spool named after the tower's connection; the tower's own lines are not in this list
    const toTower = u19.spools.filter(q => [...tower].some(t => q.stream.startsWith(t))); expect(toTower.map(q => q.stream)).toEqual(['X-1903 make-up']); expect(u19.lines.some(l => l.def.no === toTower[0].line)).toBe(true);
    const own = sh19.lines.filter(l => touches(l) && ![l.from, l.to].some(e => e.k === 'tap' && !touches(sh19.lines[e.line]))); expect(own.length).toBeGreaterThan(3);
    expect(u19.lines.filter(l => l.origin === 'process').length).toBe(sh19.lines.length - own.length);
  }, 240_000);
  it('a valve at the limit too tall to stand under another tier stands on the top tier, in every unit (SW-RPI-4)', () => {
    for (const u of [11, 13, 14, 16, 18]) {
      const q = unitPiping(u), highest = Math.max(0, ...q.lines.map(l => l.tier ?? 0));
      for (const s of q.spools) if (gateReach(s.NPS) > RACK.tiers[1] - RACK.tiers[0] - 12) { const l = q.lines.find(x => x.def.no === s.line)!; expect(s.tier, `unit ${u} ${s.tag}`).toBe(l.tier !== undefined ? RACK.tiers.length - 1 : highest); expect(q.spools.filter(x => x.tier > s.tier).length).toBe(0); }
      // a column's overhead line that does not run the rack has a run of its own, before any line of the rack (SW-RPI-7)
      const firstRack = q.runs.findIndex(r => r.kind === 'rack');
      for (const sp of q.cell.spots.filter(x => x.shape === 'vv' && x.floors)) { const top = [...q.nozzles.values()].find(n => n.equip === sp.tag && n.u[1] > 0); if (!top) continue; const l = q.lines.find(x => [x.def.from, x.def.to].some(e => e.k === 'nozzle' && e.id === top.id))!;
        if (l.tier === undefined && l.def.from.k === 'nozzle' && l.def.to.k === 'nozzle' && !q.spools.some(x => x.line === l.def.no)) { const k = q.runOf.get(l.def.no)!; expect(q.runs[k].kind, `unit ${u} ${l.def.no}`).toBe('overhead'); expect(q.runs[k].lines[0]).toBe(l.def.no); if (firstRack >= 0) expect(k).toBeLessThan(firstRack); } }
    }
  }, 240_000);
  it('gives each line that runs the rack a tier and a lane, and runs the generator once for each such line (SW-RPI-7)', () => {
    const xOf = (id: string) => up.nozzles.get(id)!.face[0], onRack = up.lines.filter(l => l.tier !== undefined), top = RACK.tiers.length - 1, most = (hw: number) => TIER_SHARE * (2 * hw - 48);
    expect(onRack.length).toBeGreaterThan(8); expect(up.tierRoom).toBeGreaterThanOrEqual(TIER_ROOM); expect(up.tierRoom).toBeLessThanOrEqual(most(up.cell.rack.halfWidth));
    for (const l of onRack) { expect(l.def.service).toBe('P'); expect(l.def.from.k).toBe('nozzle'); expect(l.def.to.k).toBe('nozzle'); }
    for (const l of up.lines.filter(q => q.def.service === 'P' && q.def.from.k === 'nozzle' && q.def.to.k === 'nozzle' && !q.def.from.id.startsWith('BL-') && !q.def.to.id.startsWith('BL-') && !/^RS-/.test(q.def.from.id + q.def.to.id)))
      expect(l.tier !== undefined, l.def.no).toBe(Math.abs(xOf((l.def.from as { id: string }).id) - xOf((l.def.to as { id: string }).id)) > 240);
    // the spacing: 4 in and smaller 12 in apart; 6 to 12 in 18 in from any line of 12 in or smaller; 14 and 16 in 24 in from one of 6 to 16 in; 18 to 24 in 24 in from one of 12 in or smaller, 30 in from a larger; never less than the generator's own
    const od = (n: number) => pipeDims(n, 'P150').OD; expect(heldAs(2)).toBe(3); expect(heldAs(2.9)).toBe(3); expect(heldAs(3)).toBe(9); expect(heldAs(8.9)).toBe(9); expect(heldAs(9)).toBe(15);
    expect(laneSpacing(od(4), od(4))).toBe(12); expect(laneSpacing(od(3), od(2))).toBe(12); expect(laneSpacing(od(6), od(4))).toBe(18); expect(laneSpacing(od(8), od(8))).toBe(18); expect(laneSpacing(od(10), od(2))).toBe(18); expect(laneSpacing(od(12), od(12))).toBe(18);
    expect(laneSpacing(od(14), od(4))).toBe(18); expect(laneSpacing(od(14), od(6))).toBe(24); expect(laneSpacing(od(16), od(16))).toBe(24); expect(laneSpacing(od(24), od(12))).toBe(24); expect(laneSpacing(od(18), od(14))).toBe(30); expect(laneSpacing(od(24), od(24))).toBe(30);
    for (const a of [2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24]) for (const b of [2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24]) { expect(laneSpacing(od(a), od(b))).toBe(laneSpacing(od(b), od(a))); expect(laneSpacing(od(a), od(b))).toBeGreaterThanOrEqual((od(a) + od(b)) / 2 + 3); }
    for (const u of [11, 13, 14, 16, 18, 19]) {
      const q = u === U ? up : unitPiping(u), hw = q.cell.rack.halfWidth, lanes = q.foreseen, isHeader = (L: typeof lanes[number]) => L.no === undefined && L.x0 === q.cell.rack.x0 && L.x1 === q.cell.rack.x1, rack = q.lines.filter(x => x.tier !== undefined);
      expect(lanes.filter(isHeader).length, `unit ${u}`).toBe(q.headers.length);
      // every line that runs the rack has its lane: on the 6 in grid within the tier's lanes, as wide as its pipe, over the stretch between its ends
      for (const l of rack) { const L = lanes.filter(x => x.no === l.def.no); expect(L.length, `unit ${u} ${l.def.no}`).toBe(1); expect(L[0].t).toBe(l.tier); expect(Math.abs(L[0].z)).toBeLessThanOrEqual(hw - 24); expect(Math.abs(L[0].z % 6)).toBe(0); expect(L[0].OD).toBe(pipeDims(l.def.NPS, l.def.cls).OD); expect(L[0].x1 - L[0].x0).toBeGreaterThan(36);
        // one of 14 in and larger on the lowest tier or the top
        if (l.def.NPS >= BIG) expect([0, top], `unit ${u} ${l.def.no}`).toContain(l.tier); }
      // no two lanes of a tier nearer over the same stretch than lets a pipe in either pass the other held as a box; headers among themselves by the generator's spacing; a root spool's place is in its branch's own lane
      for (let i = 0; i < lanes.length; i++) for (let j = i + 1; j < lanes.length; j++) { const a = lanes[i], b = lanes[j]; if (a.t !== b.t || a.x1 < b.x0 - 24 || a.x0 > b.x1 + 24) continue;
        const spool = (L: typeof a, M: typeof a) => L.no === undefined && !isHeader(L) && M.no !== undefined && q.roots.some(r => r.line === M.no && r.at[2] === L.z && Math.abs(r.at[0] - (L.x0 + L.x1) / 2) < 1); if (spool(a, b) || spool(b, a)) { expect(a.z).toBe(b.z); continue; }
        expect(Math.abs(a.z - b.z), `unit ${u} tier ${a.t + 1}: ${a.no ?? 'header or spool'} at ${a.z}, ${b.no ?? 'header or spool'} at ${b.z}`).toBeGreaterThanOrEqual(isHeader(a) && isHeader(b) ? (a.OD + b.OD) / 2 + 3 : laneSpacing(a.OD, b.OD)); }
      // each root spool of a branch that runs the rack stands in that branch's lane (SW-RPI-8)
      for (const r of q.roots) { const L = lanes.find(x => x.no === r.line); if (L) { expect(r.at[2], `unit ${u} ${r.tag}`).toBe(L.z); expect(r.tier).toBe(L.t); } }
      // no tier loaded beyond the unit's room at any section, a pipe's width and 3 in for each lane over it; the top tier, whose count starts with the headers, to 85 % of its lanes by the lines that go there first
      for (const t of [0, 1, 2]) for (let x = q.cell.rack.x0 + 24; x <= q.cell.rack.x1 - 24; x += 24) { const over = lanes.filter(L => L.t === t && (L.no !== undefined || isHeader(L)) && L.x0 <= x && L.x1 >= x), w = over.reduce((a, L) => a + L.OD + 3, 0);
        expect(w, `unit ${u} tier ${t + 1} at x ${x}`).toBeLessThanOrEqual((t === top ? Math.max(q.tierRoom, most(hw)) : q.tierRoom) + 1e-9); }
      // a line of 14 in and larger with a connection above the rack's top tier runs on the top tier
      for (const l of rack) if (l.def.NPS >= BIG && !q.spools.some(x => x.line === l.def.no) && [l.def.from, l.def.to].some(e => e.k === 'nozzle' && !/^(BL|RS)-/.test(e.id) && q.nozzles.get(e.id)!.face[1] > RACK.tiers[top])) expect(l.tier, `unit ${u} ${l.def.no}`).toBe(top);
      // a line with both its ends on one side of the rack lies on that half, nearly always (where that half has a lane for it)
      const zEnd = (e: { k: string; id?: string }) => (e.k === 'nozzle' && !e.id!.startsWith('BL-') ? q.nozzles.get(e.id!)!.face[2] : undefined); let one = 0, own = 0;
      for (const L of lanes.filter(x => x.no !== undefined)) { const d = q.lines.find(x => x.def.no === L.no)!.def, zs = [zEnd(d.from), zEnd(d.to)].filter((v): v is number => v !== undefined), sd = zs.length && zs.every(v => v > 0) ? 1 : zs.length && zs.every(v => v < 0) ? -1 : 0; if (sd) { one++; if (L.z * sd >= 0) own++; } }
      expect(one, `unit ${u}`).toBeGreaterThan(8); expect(own / one, `unit ${u}`).toBeGreaterThan(0.85);
    }
    // the runs: every line in one; first the overheads, then each line of the rack with the branches that tap it, the largest first, then the rest
    expect(up.tiers).toEqual([...new Set(onRack.map(l => l.tier!))].sort((a, b) => a - b));
    const kinds = up.runs.map(r => r.kind); expect(kinds.join(',')).toMatch(/^(overhead,)*((rack|chase),)+rest$/); expect(up.runs.flatMap(r => r.lines).sort()).toEqual(up.lines.map(l => l.def.no).sort());
    for (const [k, r] of up.runs.entries()) for (const no of r.lines) expect(up.runOf.get(no)).toBe(k);
    const rackRuns = up.runs.filter(r => r.kind === 'rack'), size = (no: string) => up.lines.find(l => l.def.no === no)!.def.NPS; expect(rackRuns.length).toBe(onRack.length);
    for (const [i, r] of rackRuns.entries()) { const l = up.lines.find(x => x.def.no === r.lines[0])!; expect(l.tier).toBe(r.lane!.t); expect(r.lane!.no).toBe(l.def.no); expect(r.lane).toBe(up.foreseen.find(L => L.no === l.def.no)); if (i) expect(size(r.lines[0])).toBeLessThanOrEqual(size(rackRuns[i - 1].lines[0])); }
    // a line that rises to a connection high on a column without running the rack has a run of its own too, in every unit prepared, taken in with the rack's lines by size
    for (const u of [11, 13, 14, 16, 18]) { const q = u === U ? up : unitPiping(u), single = q.runs.filter(r => r.kind === 'rack' || r.kind === 'chase'), sz = (no: string) => q.lines.find(l => l.def.no === no)!.def.NPS;
      for (let i = 1; i < single.length; i++) expect(sz(single[i].lines[0]), `unit ${u}`).toBeLessThanOrEqual(sz(single[i - 1].lines[0]));
      for (const r of q.runs.filter(x => x.kind === 'chase')) { const l = q.lines.find(x => x.def.no === r.lines[0])!; expect(l.tier).toBeUndefined(); expect(r.lane).toBeUndefined(); expect([l.def.from, l.def.to].some(e => e.k === 'nozzle' && q.nozzles.get(e.id)!.face[1] > RACK.tiers[top] + 48), `unit ${u} ${l.def.no}`).toBe(true); } }
    for (const l of up.lines) {
      const tap = [l.def.from, l.def.to].find(e => e.k === 'tap') as { line: string } | undefined; if (tap) expect(up.runOf.get(l.def.no), l.def.no).toBe(up.runOf.get(tap.line));
      if (l.origin === 'header' || l.origin === 'utility') expect(up.runs[up.runOf.get(l.def.no)!].kind).toBe('rest');
    }
    // what a run is given: the rack from its tier upward, the room later lines' first valves will need, the headers' lanes until the last run, the lanes kept for the lines not yet routed, its own gate, and a grid cut to it
    const base = up.plant.interior().instances.length, full = up.plant.grid, cells = (g: typeof full) => ((g.x1 - g.x0) / 6 + 1) * (g.y1 / 6 + 1) * ((g.z1 - g.z0) / 6 + 1);
    for (const [k, r] of up.runs.entries()) {
      const pl = up.runPlant(k, []), later = up.lines.filter(l => up.runOf.get(l.def.no)! > k).flatMap(l => [l.def.from, l.def.to].filter(e => e.k === 'nozzle')).reduce((a, e) => a + (/^(BL|RS|CS)-/.test((e as { id: string }).id) ? 2 : 1), 0), rest = r.kind === 'rest';   // a room at each nozzle of a later line, and at a spool a second, as wide as the valve's handwheel and as high as its stem
      const keptLanes = up.foreseen.filter(L => L.no !== undefined && up.runOf.get(L.no)! > k).length, extra = pl.interior().instances.length - base - later;
      expect(pl.rack.tiers).toEqual(RACK.tiers.slice(r.lane ? r.lane.t : rest ? top : 0));
      const gates = extra - (rest ? 2 : 1) * up.headers.filter(h => h.z !== undefined).length - keptLanes;                                     // in the last run a block about each header's two caps instead (SW-RPI-12)
      if (!r.lane) expect(gates, `run ${k + 1}`).toBe(0); else expect(gates).toBeGreaterThanOrEqual(2);                                              // the fence: the tier closed either side of the lane's slot, in more pieces where a root spool's opening cuts it
      const g = pl.grid; expect(g.x0 % 6).toBe(0); expect(g.z0 % 6 === 0).toBe(true); expect(g.x0).toBeGreaterThanOrEqual(full.x0); expect(g.x1).toBeLessThanOrEqual(full.x1); expect(g.y1).toBeLessThanOrEqual(full.y1); expect(g.z0).toBeGreaterThanOrEqual(full.z0); expect(g.z1).toBeLessThanOrEqual(full.z1);
      for (const no of r.lines) for (const e of [up.lines.find(l => l.def.no === no)!.def.from, up.lines.find(l => l.def.no === no)!.def.to]) if (e.k === 'nozzle') { const n = up.nozzles.get(e.id)!; expect(n.face[0]).toBeGreaterThanOrEqual(g.x0); expect(n.face[0]).toBeLessThanOrEqual(g.x1); expect(n.face[1]).toBeLessThan(g.y1); expect(n.face[2]).toBeGreaterThanOrEqual(g.z0); expect(n.face[2]).toBeLessThanOrEqual(g.z1); }
      if (r.lane) { expect(g.z0).toBeLessThan(r.lane.z); expect(g.z1).toBeGreaterThan(r.lane.z); expect(cells(g)).toBeLessThan(cells(full)); }
      expect(up.runPlant(k, [], true).grid).toEqual(full);
    }
    // the fence of a rack line's run: its tier closed from end to end at the height its pipes lie at, but for a slot along its lane, wide enough for its pipe and 3 in clear of each side as the grid holds it, and shutting the lanes 6 in either side
    for (const r of rackRuns.slice(0, 8)) { const L = r.lane!, k = up.runs.indexOf(r), mineN = up.lines.filter(l => up.runOf.get(l.def.no)! > k).flatMap(l => [l.def.from, l.def.to].filter(e => e.k === 'nozzle')).reduce((a, e) => a + (/^(BL|RS|CS)-/.test((e as { id: string }).id) ? 2 : 1), 0), hN = up.headers.filter(h => h.z !== undefined).length, kN = up.foreseen.filter(x => x.no !== undefined && up.runOf.get(x.no)! > k).length;
      const walls = up.runPlant(k, []).interior().instances.slice(base + mineN + hN + kN).map(q => worldBox(q.part, q.transform)!); expect(walls.length).toBeGreaterThanOrEqual(2);
      for (const b of walls) { expect(b[0][1]).toBeCloseTo(RACK.tiers[L.t] + 4, 6); expect(b[1][1]).toBeGreaterThanOrEqual(RACK.tiers[L.t] + 4 + L.OD - 1e-6); }
      const lo = Math.max(...walls.filter(b => b[1][2] <= L.z).map(b => b[1][2])), hi = Math.min(...walls.filter(b => b[0][2] >= L.z).map(b => b[0][2])), grid = (v: number, dir: 1 | -1) => (dir > 0 ? Math.ceil(v / 6 - 1e-9) : Math.floor(v / 6 + 1e-9)) * 6;
      // the cells the grid marks for a wall are those within 3 in of it: the nearest to the lane on either hand leaves the lane's own cell clear by the pipe's radius, 3 in, and the 3 in a marked cell is taken to reach; the cell 6 in from the lane is not clear of it
      for (const edge of [L.z - grid(lo + 3, -1), grid(hi - 3, 1) - L.z]) { expect(edge - 3).toBeGreaterThanOrEqual(L.OD / 2 + 3); expect(edge - 6 - 3).toBeLessThan(L.OD / 2 + 3); }
      // from end to end of the rack
      expect(Math.min(...walls.map(b => b[0][0]))).toBeLessThanOrEqual(up.cell.rack.x0 + 6); expect(Math.max(...walls.map(b => b[1][0]))).toBeGreaterThanOrEqual(up.cell.rack.x1 - 6); }
  }, 240_000);
  it('stands every control valve station at grade under the rack, on a spool that divides its line (SW-RPI-9)', () => {
    const asked = sh.lines.map((f, i) => ({ f, i })).filter(q => q.f.cv); expect(up.stations.length + up.lines.filter(l => l.cvOmitted).length).toBe(asked.length); expect(up.stations.length).toBeGreaterThan(4);
    for (const st of up.stations) {
      const ahead = up.lines.find(l => l.def.no === st.line)!, after = up.lines.find(l => l.def.no === st.after)!, A = up.nozzles.get(`${st.tag}-A`)!, B = up.nozzles.get(`${st.tag}-B`)!;
      expect(ahead.origin).toBe('process'); expect(ahead.def.cv).toBe(true); expect(ahead.def.to).toEqual({ k: 'nozzle', id: `${st.tag}-A` }); expect(after.origin).toBe('control'); expect(!!after.def.cv).toBe(false); expect(after.def.from).toEqual({ k: 'nozzle', id: `${st.tag}-B` });
      expect(after.def.NPS).toBe(ahead.def.NPS); expect(Number(after.def.cls.slice(1))).toBeLessThanOrEqual(Number(ahead.def.cls.slice(1))); expect(B.cls).toBe(after.def.cls); expect(A.cls).toBe(ahead.def.cls); expect(after.flow).toBe(ahead.flow);
      if (after.def.to.k === 'nozzle') expect(up.nozzles.get(after.def.to.id)!.cls, after.def.no).toBe(after.def.cls);   /* the station is the specification break (SW-RPI-9) */ expect(Number(after.def.no.slice(-5)) - U * 1000).toBeGreaterThan(700);
      expect(st.at[1]).toBe(36); expect([0, 36, 72, 108]).toContain(Math.abs(st.at[2])); expect(st.at[0]).toBeGreaterThan(up.cell.rack.x0); expect(st.at[0]).toBeLessThan(up.cell.rack.x1);
      expect(A.u[1]).toBe(0); expect(A.u[2]).toBe(0); expect(B.u).toEqual(A.u.map(v => -v || 0)); expect(Math.abs(B.face[0] - A.face[0])).toBe(24);
      // the flowsheet's destination is where the part after the station ends, and its source where the line starts
      const f = sh.lines[ahead.flow!]; if (f.to.k === 'eq') expect((after.def.to as { id: string }).id.startsWith(up.cell.spots.find(q => q.item === (f.to as { tag: string }).tag)!.tag)).toBe(true);
    }
    // no two stations on one file overlap along the rack
    for (const a of up.stations) for (const b of up.stations) if (a !== b && a.at[2] === b.at[2]) expect(Math.abs(a.at[0] - b.at[0]), `${a.tag} and ${b.tag}`).toBeGreaterThan(60);
    // nearness comes first: each stands within 45 ft along the rack of the connection it feeds, in every unit prepared; in the crude unit, which has 16 of them, the largest valves and four braced bays, within 80 ft
    for (const u of [11, 13, 14, 16, 18, 19]) { const q = u === U ? up : unitPiping(u);
      for (const st of q.stations) { const after = q.lines.find(l => l.def.no === st.after)!, to = after.def.to; if (to.k !== 'nozzle' || to.id.startsWith('BL-')) continue; const x = q.nozzles.get(to.id)!.face[0], lo = q.cell.rack.x0 + 60, hi = q.cell.rack.x1 - 60; expect(Math.abs(st.at[0] - Math.min(hi, Math.max(lo, x))), `unit ${u} ${st.tag}`).toBeLessThanOrEqual(u === 11 ? 960 : 540); } }
  }, 240_000);
  it('starts a branch that must travel the rack at a root spool, a block valve on each face (SW-RPI-8)', () => {
    expect(up.roots.length).toBeGreaterThan(0);
    for (const r of up.roots) {
      const main = up.lines.find(l => l.def.no === r.line)!, conn = up.lines.find(l => l.def.no === r.connection)!; expect(conn.origin).toBe('root'); expect(conn.def.NPS).toBe(main.def.NPS); expect(conn.def.cls).toBe(main.def.cls);
      expect(Number(conn.def.no.slice(-5)) - U * 1000).toBeGreaterThan(600);
      expect([main.def.from.k, main.def.to.k]).toEqual(['nozzle', 'nozzle']); expect([conn.def.from.k, conn.def.to.k].sort()).toEqual(['nozzle', 'tap']);
      const tap = [conn.def.from, conn.def.to].find(e => e.k === 'tap') as { line: string }; expect(tap.line).toBe(r.parent);
      const A = up.nozzles.get(`${r.tag}-A`)!, B = up.nozzles.get(`${r.tag}-B`)!; expect(A.u.map(v => -v || 0)).toEqual(B.u); expect(Math.abs(B.face[0] - A.face[0])).toBe(24); expect(Math.abs(r.at[2])).toBeLessThan(up.cell.rack.halfWidth); expect(r.at[0]).toBeGreaterThan(RACK.start);
      expect(r.at[1]).toBe(Math.ceil((RACK.tiers[r.tier] + 4 + pipeDims(main.def.NPS, main.def.cls).OD / 2) / 6 - 1e-9) * 6);
    }
    // no other line that ends at a tee has its far end more than 20 ft along the rack beyond what it taps
    expect(up.lines.filter(l => l.origin === 'root').length).toBe(up.roots.length);
  });
  it('the generator sees the unit and where lines may travel, and no more of the model than is there', () => {
    const shown = up.plant.interior().instances, real = up.cell.interior.instances, extra = shown.filter(i => !real.includes(i));
    expect(extra.length).toBeGreaterThan(0); for (const k of extra) { expect(k.tags).toContain('keep-out'); expect(k.tags).toContain('cladding'); }
    expect(real.some(i => i.tags.includes('keep-out'))).toBe(false);
    expect(up.plant.rack.x0).toBe(RACK.start); expect(up.plant.id).toBe(`R${U}`); expect(up.plant.verticalThroughPlatforms).toBe(true);
  });
  it('the bounds the rules lean on hold for the catalogue\'s valves', () => {
    for (const [n, c] of [[3, 'P150'], [8, 'P600']] as const) {
      const v = makeValve('x', 'GATE', n, c), b = worldBox(v, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])!;
      expect(gateFaceToFace(n, c)).toBeCloseTo(Number(v.dims.F2F.value), 9); expect(Math.max(...b[1], ...b[0].map(x => -x))).toBeLessThanOrEqual(gateReach(n));
      expect(valveDrop(n, c)).toBeGreaterThan(gateFaceToFace(n, c) + designFlange(n, c).OD / 2); expect(valveDrop(n, c, true)).toBeGreaterThan(valveDrop(n, c) + globeFaceToFace(n, c));
    }
    expect(globeFaceToFace(4, 'P150')).toBeCloseTo(Number(makeValve('g', 'GLOBE', 4, 'P150').dims.F2F.value), 9);
  }, 120_000);
});

describe('plant 3: the piped units on disk', () => {
  it('unit 15, the pilot, is there with its model, report and images', () => {
    expect(reports.map(r => r.unit)).toContain(15);
    for (const r of reports) { expect(existsSync(new URL(`unit-${r.unit}.json`, dir))).toBe(true); for (const name of Object.keys(PIPING_IMAGES(r.unit, r.name))) expect(existsSync(new URL(`../screenshots/refinery/${name}.png`, import.meta.url)), name).toBe(true); }
  });
  it('every line is routed, and the generator\'s own checks of continuity, joints, elbows, valves and clearances are at zero', () => {
    for (const r of reports) {
      expect(r.demonstration).toBe(true); expect(r.lines.every(l => l.routed), `unit ${r.unit}`).toBe(true); expect(r.failures, `unit ${r.unit}`).toEqual([]);
      for (const k of ['continuity', 'joints', 'elbows', 'valves', 'lineClearance', 'staticClearance'] as const) expect(r.checks[k], `unit ${r.unit} ${k}`).toEqual([]);
      const m = JSON.parse(readFileSync(new URL(`unit-${r.unit}.json`, dir), 'utf8')) as PipingModel;
      expect(m.lines.length).toBe(r.lines.length); expect(m.lines.every(l => l.ok)).toBe(true); expect(m.lines.reduce((a, l) => a + l.welds.length, 0)).toBe(Object.values(r.counts.welds).reduce((a, b) => a + b, 0));
      for (const l of m.lines) expect(r.lines.some(q => q.no === l.no), l.no).toBe(true);
    }
  });
  it('the pilot is the unit the code describes', () => {
    const r = reports.find(q => q.unit === U)!; expect(r.lines.map(l => l.no)).toEqual(up.lines.map(l => l.def.no)); expect(r.spools.map(s => s.tag).sort()).toEqual(up.spools.map(s => s.tag).sort());
    for (const l of r.lines) { const d = up.lines.find(q => q.def.no === l.no)!; expect(l.NPS).toBe(d.def.NPS); expect(l.cls).toBe(d.def.cls); expect(l.fluid).toBe(d.fluid); }
    const cv = r.lines.filter(l => l.controlValve); expect(cv.length).toBe(sh.lines.filter(l => l.cv).length); expect(cv.filter(l => l.controlValve === 'piped').length).toBeGreaterThan(cv.length / 2);
    expect(r.counts.components.valve).toBeGreaterThan(100); expect(Object.values(r.counts.welds).reduce((a, b) => a + b, 0)).toBeGreaterThan(600);
  });
  it('what is not at zero is said: support spans where no steel stands are listed in the report and the document', () => {
    const doc = readFileSync(new URL('../docs/REFINERY-PIPING.md', import.meta.url), 'utf8'); expect(doc).toBe(pipingDocument(reports) + '\n');
    for (const r of reports) for (const s of r.checks.supports) expect(doc).toContain(s);
  });
  it('a piece of pipe the generator leaves longer than 40 ft is cut again with a shop weld, clear of the supports (SW-RPI-10)', () => {
    const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0], T = (x: number) => [...I, x, 342, 0, 1], no = '3"-P150-P-99401';
    const pipe = (tag: string, x0: number, x1: number) => ({ tag: `${no}/${tag}`, kind: 'pipe', key: `PIPE|3|P150|${(x1 - x0).toFixed(3)}`, T: T(x0), a: [x0, 342, 0], b: [x1, 342, 0], NPS: 3, cls: 'P150', e1: 'BW', e2: 'BW' });
    const weld = (k: number, x: number, a: string, b: string) => ({ id: `${no}/W${k}`, line: no, type: 'BW', size: 0.1563, at: [x, 342, 0], dir: [1, 0, 0], joins: [`${no}/${a}`, `${no}/${b}`], field: false, NPS: 3, key: 'BW|3|P150', T: T(x) });
    const m = { lines: [{ no, service: 'P', NPS: 3, cls: 'P150', kind: 'header', from: 'cap', to: 'cap', comps: [pipe('p1', 0, 486), pipe('p2', 486, 930), pipe('p3', 930, 1400)], welds: [weld(1, 486, 'p1', 'p2'), weld(2, 930, 'p2', 'p3')], supports: [{ id: `${no}/S1`, line: no, type: 'shoe', at: [240, 336, 0], key: 'SHOE|3|P150|shoe|4.500', T: T(240) }], path: [], ok: true }], nozzles: [], failures: [], stats: { comps: 3, welds: 2 } } as unknown as PipingModel;
    const cut = cutLongPipes(m), l = m.lines[0]; expect(cut.length).toBe(1); expect(cut[0]).toContain(`${no}/p1`);
    expect(l.comps.map(c => c.tag.split('/')[1])).toEqual(['p1', 'p4', 'p2', 'p3']); expect(l.comps.every(c => Math.abs(c.b[0] - c.a[0]) <= 480)).toBe(true);
    const at = l.comps[0].b[0]; expect(l.comps[1].a[0]).toBe(at); expect(Math.abs(at - 240)).toBeGreaterThanOrEqual(14); expect(Math.abs(at - 243)).toBeLessThanOrEqual(12);   /* the middle is 3 in from the shoe: the cut moves off it by the least 6 in step that clears 14 in */
    expect(l.comps[0].key).toBe(`PIPE|3|P150|${at.toFixed(3)}`); expect(l.comps[1].key).toBe(`PIPE|3|P150|${(486 - at).toFixed(3)}`); expect(l.comps[1].T.slice(12, 15)).toEqual([at, 342, 0]);
    expect(l.welds.length).toBe(3); const w = l.welds[2]; expect(w.joins).toEqual([`${no}/p1`, `${no}/p4`]); expect(w.field).toBe(false); expect(w.at).toEqual([at, 342, 0]);
    expect(l.welds[0].joins).toEqual([`${no}/p4`, `${no}/p2`]);                                                // what was welded to the far end is welded to the second half
    expect(m.stats).toEqual({ comps: 4, welds: 3 }); expect(cutLongPipes(m)).toEqual([]);
  });
  it('a make-up piece under 2 in between a tee and a 45° offset is made 2 in by moving the offset along the run (SW-RPI-11)', () => {
    const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0], T = (p: number[]) => [...I, p[0], p[1], p[2], 1], no = '3"-P150-P-99001', c = Math.SQRT1_2;
    const comp = (tag: string, kind: string, key: string, a: number[], b: number[]) => ({ tag: `${no}/${tag}`, kind, key, T: T(a), a, b, NPS: 3, cls: 'P150', e1: 'BW', e2: 'BW' });
    // along +z: a tee, 1.4 in of pipe, a 45° elbow, a diagonal piece, a 45° elbow, 20 in of pipe
    const e = 1.864, comps = [comp('T1', 'tee', 'TEE|3|P150|3', [0, 0, 0], [0, 0, 5]), comp('p2', 'pipe', 'PIPE|3|P150|1.400', [0, 0, 5], [0, 0, 6.4]), comp('el3', 'elbow', 'EL|3|P150|45', [0, 0, 6.4], [e * (1 - c), 0, 6.4 + e * (1 + c)]),
      comp('p4', 'pipe', 'PIPE|3|P150|12.000', [e * (1 - c), 0, 6.4 + e * (1 + c)], [e * (1 - c) + 12 * c, 0, 6.4 + e * (1 + c) + 12 * c]), comp('el5', 'elbow', 'EL|3|P150|45', [e * (1 - c) + 12 * c, 0, 6.4 + e * (1 + c) + 12 * c], [12, 0, 30]), comp('p6', 'pipe', 'PIPE|3|P150|20.000', [12, 0, 30], [12, 0, 50])];
    const weld = (k: number, at: number[], a: string, b: string) => ({ id: `${no}/W${k}`, line: no, type: 'BW', size: 0.2, at, dir: [0, 0, 1], joins: [`${no}/${a}`, `${no}/${b}`], field: false, NPS: 3, key: 'BW|3|P150', T: T(at) });
    const welds = [weld(1, [0, 0, 5], 'T1', 'p2'), weld(2, [0, 0, 6.4], 'p2', 'el3'), weld(3, comps[2].b, 'el3', 'p4'), weld(4, comps[3].b, 'p4', 'el5'), weld(5, [12, 0, 30], 'el5', 'p6')];
    const m = { lines: [{ no, service: 'P', NPS: 3, cls: 'P150', kind: 'routed', from: 'a', to: 'b', comps, welds, supports: [], path: [], ok: true }], nozzles: [], failures: [], stats: {} } as unknown as PipingModel;
    const made = lengthenShortPieces(m), l = m.lines[0]; expect(made.length).toBe(1); expect(made[0]).toContain(`${no}/p2`);
    expect(l.comps[1].b[2]).toBeCloseTo(7, 9); expect(l.comps[1].key).toBe('PIPE|3|P150|2.000'); expect(l.comps[2].a[2]).toBeCloseTo(7, 9); expect(l.comps[4].b).toEqual([12, 0, 30.6]); expect(l.comps[5].a).toEqual([12, 0, 30.6]); expect(l.comps[5].key).toBe('PIPE|3|P150|19.400'); expect(l.comps[5].b).toEqual([12, 0, 50]);
    expect(l.welds[0].at).toEqual([0, 0, 5]); expect(l.welds[1].at[2]).toBeCloseTo(7, 9); expect(l.welds[4].at[2]).toBeCloseTo(30.6, 9); expect(l.welds[2].at[2] - (6.4 + e * (1 + c))).toBeCloseTo(0.6, 9);
    for (let k = 1; k < l.comps.length; k++) expect(Math.hypot(...l.comps[k].a.map((v, a) => v - l.comps[k - 1].b[a]))).toBeLessThan(1e-9);   // still one chain
    expect(lengthenShortPieces(m)).toEqual([]);
  });
  it('a piece at 45° that the clearance check reports against a valve by its bounding box is measured again from its axis (SW-RPI-13)', () => {
    const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0], vb = valveBoxFn(), c = Math.SQRT1_2, OD = pipeDims(4, 'P150').OD;
    const valve = { tag: 'v', kind: 'valve', key: 'VLV|GATE|4|P150', T: [...I, 0, 0, 0, 1], a: [0, 0, 0], b: [0, 0, gateFaceToFace(4, 'P150')], NPS: 4, cls: 'P150' } as unknown as Parameters<typeof vb>[0], [mn, mx] = vb(valve), x = (mn[0] + mx[0]) / 2;
    // a piece in the plane across the valve, at 45°, its axis `off` in from the box's upper corner: its bounding box reaches into the valve's, the piece does not
    const piece = (off: number) => { const d = off / c, a = [x, mx[1] - 10, mx[2] + 10 + d], b = [x, mx[1] + 30, mx[2] - 30 + d]; return { tag: 'p', kind: 'pipe', key: 'PIPE|4|P150|56.569', T: [...I, ...a, 1], a, b, NPS: 4, cls: 'P150' } as unknown as Parameters<typeof vb>[0]; };
    for (const off of [14, 6, 4]) {
      const p = piece(off), g = measuredAgain(p, valve, vb)!; expect(K.gap(K.compShapes(p, vb)[0], K.compShapes(valve, vb)[0])).toBe(0);   // as the generator's check holds the pair
      expect(g).toBeCloseTo(off - OD / 2, 1); expect(measuredAgain(valve, p, vb)).toBeCloseTo(g, 9);
    }
    expect(measuredAgain(piece(4), valve, vb)!).toBeLessThan(3);                                               // nearer than 3 in: it stays in the report
    // a piece square to the axes, and two pieces of pipe, are the check's own to measure
    const square = { ...piece(14), a: [x, mx[1] + 20, mx[2] - 30], b: [x, mx[1] + 20, mx[2] + 30] } as unknown as Parameters<typeof vb>[0]; expect(measuredAgain(square, valve, vb)).toBeUndefined(); expect(measuredAgain(piece(14), piece(6), vb)).toBeUndefined();
    // a 45° elbow by its own legs: nearer its corner than a 90° elbow's legs would put it
    const el = { tag: 'e', kind: 'elbow', key: 'EL|4|P150|45', T: [...I, 0, 0, 0, 1], a: [0, 0, 0], b: [0, 0, 1], NPS: 4, cls: 'P150' } as unknown as Parameters<typeof vb>[0], far = { ...square, a: [40, 0, 0], b: [40, 0, 40] } as unknown as Parameters<typeof vb>[0];
    expect(measuredAgain(el, far, vb)).toBeGreaterThan(K.gap(K.compShapes(el, vb)[1], K.compShapes(far, vb)[0]) - 1e-9);
  });
  it('a 90° elbow that the clearance check reports against steel by its corner is measured again from its arc (SW-RPI-13)', () => {
    const vb = valveBoxFn(), OD = pipeDims(6, 'P150').OD, R = elbowRadius(OD);
    // from the origin along +x, turning to +z: its corner at (R, 0, 0), its arc about (0, 0, R)
    const el = { tag: 'e', kind: 'elbow', key: 'EL|6|P150|90', T: [0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1], a: [0, 0, 0], b: [R, 0, R], NPS: 6, cls: 'P150' } as unknown as Parameters<typeof vb>[0];
    // a post standing off the outside of the corner, d each way from it
    const post = (d: number) => ({ tag: 'post', kind: 'box' as const, mn: [R + d, -50, -d - 8] as [number, number, number], mx: [R + d + 8, 50, -d] as [number, number, number] });
    const legs = (d: number) => Math.min(...K.compShapes(el, vb).map(sh => K.gap(sh, { kind: 'box', mn: post(d).mn, mx: post(d).mx })));
    for (const d of [2, 3.776, 6]) { const byCorner = d * Math.SQRT2 - OD / 2, byArc = elbowGap(el, post(d)); expect(legs(d)).toBeLessThanOrEqual(Math.max(0, byCorner) + 1e-6); expect(byArc).toBeCloseTo(byCorner + R * (Math.SQRT2 - 1), 1); }
    expect(3.776 * Math.SQRT2 - OD / 2).toBeLessThan(3); expect(elbowGap(el, post(3.776))).toBeGreaterThan(3);                     // the utilities unit's case: 2.34 in from the corner, 6 in from the elbow
    // against a round member the same: a column 4 in in radius standing at the same place
    const col = { tag: 'col', kind: 'cap' as const, a: [R + 3.776 + 4, -50, -3.776 - 4] as [number, number, number], b: [R + 3.776 + 4, 50, -3.776 - 4] as [number, number, number], r: 4 };
    expect(elbowGap(el, col)).toBeGreaterThan(elbowGap(el, post(3.776)) - 1e-6);
    // an elbow well clear by its corner is clear by its arc too, and one that touches is still reported
    expect(elbowGap(el, post(-2))).toBeLessThan(3);
  });
  it('what a run leaves for the runs after it holds a shoe under a pipe on the rack no wider than its pipe (SW-RPI-7)', () => {
    const vb = valveBoxFn(), no = '3"-P600-P-99005', T = [0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 720, 268.5, -12, 1], I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
    const pipe = { tag: `${no}/p1`, kind: 'pipe', key: 'PIPE|3|P600|240.000', T: [...I, 600, 270, -12, 1], a: [600, 270, -12], b: [840, 270, -12], NPS: 3, cls: 'P600', e1: 'BW', e2: 'BW' };
    const sup = (type: string, x: number) => ({ id: `${no}/S${x}`, line: no, type, at: [x, 264, -12], key: `SHOE|3|P600|${type}|4.500`, T: [...T.slice(0, 12), x, 268.5, -12, 1] });
    const m = { lines: [{ no, service: 'P', NPS: 3, cls: 'P600', kind: 'routed', from: 'a', to: 'b', comps: [pipe], welds: [], supports: [sup('shoe', 720), sup('guide', 600), sup('anchor', 840)], path: [], ok: true }], nozzles: [], failures: [], stats: {} } as unknown as PipingModel;
    const raw = vb({ key: 'SHOE|3|P600|guide|4.500', T } as unknown as Parameters<typeof vb>[0]); expect(raw[1][2] - raw[0][2]).toBeGreaterThan(3);                     // as the catalogue draws it, wider than the 3 in pipe
    const boxes = runSolids(m, vb).map(q => worldBox(q.part, q.transform)!), under = boxes.filter(b => Math.abs(b[0][1] - 264) < 1e-6); expect(under.length).toBe(3);
    for (const b of under) { expect(b[0][2]).toBeGreaterThanOrEqual(-12 - 1.5 - 1e-6); expect(b[1][2]).toBeLessThanOrEqual(-12 + 1.5 + 1e-6); expect(b[1][0] - b[0][0]).toBeGreaterThan(3); }   // across the pipe no wider than it; along it as long as it is drawn
    // and so the lane 12 in off is clear of it as the grid holds it: no cell within 3 in of the shoe's box is nearer that lane's axis than the pipe's radius and 6 in
    for (const b of under) expect(Math.abs(-24 - Math.round((b[0][2] - 3) / 6 + 0.4999) * 6) - 3).toBeGreaterThanOrEqual(1.5 + 3);
  });
  it('every rule the piping code cites is written in the design basis', () => {
    const defined = new Set([...basisDoc.matchAll(/`(SW-[A-Z]+-\d+[a-z]?)`/g)].map(m => m[1]));
    for (const f of ['unitPiping', 'pipingReport', 'cell']) for (const m of readFileSync(new URL(`../src/refinery/${f}.ts`, import.meta.url), 'utf8').matchAll(/SW-[A-Z]+-\d+[a-z]?/g)) expect(defined.has(m[0]), `${f}: ${m[0]}`).toBe(true);
    for (const k of ['SW-RPI-1', 'SW-RPI-2', 'SW-RPI-3', 'SW-RPI-4', 'SW-RPI-5', 'SW-RPI-6', 'SW-RPI-7', 'SW-RPI-8', 'SW-RPI-9', 'SW-RPI-10', 'SW-RPI-11', 'SW-RPI-12', 'SW-RPI-13', 'SW-CELL-6', 'SW-CELL-7']) expect(defined.has(k), k).toBe(true);
  });
});
