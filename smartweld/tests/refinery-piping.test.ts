/** Plant 3, the coastal refinery: a unit piped (DESIGN_BASIS.md §79). What the generator of plants 1 and 2 is given for a
 *  unit — nozzles, lines, battery limit spools — follows the flowsheet and the rules; and the piped units on disk are whole:
 *  every line routed, continuous, jointed by its class, clear of every other and of the steel. Generating a unit takes
 *  minutes, so the saved model is checked rather than made again here (tools/refinery-piping.ts makes it). */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { unitPiping, gateReach } from '../src/refinery/unitPiping';
import { processModel } from '../src/refinery/process';
import { sizing } from '../src/refinery/sizing';
import { FLUIDS } from '../src/refinery/fluids';
import { RACK, valveDrop } from '../src/refinery/cell';
import { pipingDocument, PIPING_IMAGES, type PipedUnit } from '../src/refinery/pipingReport';
import { makeValve, gateFaceToFace, globeFaceToFace, designFlange, pipeDims } from '../src/catalogue';
import { worldBox, type PipingModel } from '../src/generator/piping';

const M = processModel(), Z = sizing(), U = 15, up = unitPiping(U), sh = M.sheet(U), z = Z.get(U)!;
const basisDoc = readFileSync(new URL('../DESIGN_BASIS.md', import.meta.url), 'utf8');
const dir = new URL('../public/refinery/piping/', import.meta.url);
const reports = readdirSync(dir).filter(f => /^unit-\d+\.report\.json$/.test(f)).map(f => JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as PipedUnit).sort((a, b) => a.unit - b.unit);

describe('plant 3: what the generator is given for a unit (SW-RPI-1 to SW-RPI-5)', () => {
  it('every connection of every body is a nozzle of its line\'s size and class, its axis on the 6 in grid', () => {
    for (const e of sh.equip.values()) for (const [k, s] of up.cell.spots.filter(q => q.item === e.tag).entries()) for (const q of z.equip.get(e.tag)!.nozzles) {
      const id = `${s.tag}-${q.port === 'S' || q.port === 'D' ? q.port : `N${z.equip.get(e.tag)!.nozzles.indexOf(q) + 1}`}`, n = up.nozzles.get(id)!;
      expect(n, `${id} (body ${k})`).toBeDefined(); expect(n.NPS).toBe(q.NPS); expect(n.cls).toBe(q.cls); expect(n.equip).toBe(s.tag);
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
    for (const n of cn.filter(q => q.u[1] === 0)) { expect(n.u).toEqual([0, 0, 1]); for (const f of col.floors!) expect(n.face[1] <= f - 18 || n.face[1] >= f + 54, `${n.id} at ${n.face[1]} by the floor at ${f}`).toBe(true); }
    const shellEl = cn.filter(q => q.u[1] === 0).map(q => q.face[1]).sort((a, b) => a - b); for (let i = 1; i < shellEl.length; i++) expect(shellEl[i] - shellEl[i - 1]).toBeGreaterThanOrEqual(36);
    for (const s of up.cell.spots.filter(q => q.kind === 'aircooler')) for (const n of [...up.nozzles.values()].filter(q => q.equip === s.tag)) { expect(n.u).toEqual([0, 1, 0]); expect(Math.abs(n.face[2])).toBe(198); expect(n.face[1]).toBeGreaterThan(RACK.tiers[2] + 108); }
  });
  it('lists every line of the flowsheet with its size, class, service and ends, and a tee for every spare', () => {
    const proc = up.lines.filter(l => l.origin === 'process'); expect(proc.length).toBe(sh.lines.length);
    proc.forEach((l, i) => { const s = z.lines[i], f = sh.lines[i]; expect(l.def.NPS).toBe(s.NPS); expect(l.def.cls).toBe(s.cls); expect(l.def.service).toBe(FLUIDS[f.s.fluid].svc); expect(l.def.no).toMatch(new RegExp(`-${U * 1000 + i + 1}$`)); expect(l.def.NPS).toBeGreaterThanOrEqual(3); expect(l.designP).toBe(s.designP);
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
  it('ends every stream at the battery limit in a spool in the valve bay, a flange apart, at its line\'s elevation', () => {
    const bl = sh.lines.filter(l => l.from.k === 'bl' || l.to.k === 'bl').length; expect(up.spools.length).toBe(bl);
    const row = [...up.spools].sort((a, b) => a.at[2] - b.at[2]);
    for (const [i, s] of row.entries()) {
      expect(s.at[0]).toBeGreaterThan(RACK.start - RACK.bent); expect(s.at[0]).toBeLessThan(RACK.start - 60); expect(s.at[1]).toBe(Math.ceil((RACK.tiers[0] + 4 + pipeDims(s.NPS, s.cls).OD / 2) / 6 - 1e-9) * 6);
      const inner = up.nozzles.get(`${s.tag}-U`)!, outer = up.nozzles.get(`${s.tag}-P`)!; expect(inner.u).toEqual([1, 0, 0]); expect(outer.u).toEqual([-1, 0, 0]); expect(inner.face[0] - outer.face[0]).toBe(24);
      if (i) expect(s.at[2] - row[i - 1].at[2]).toBeGreaterThanOrEqual((designFlange(s.NPS, s.cls).OD + designFlange(row[i - 1].NPS, row[i - 1].cls).OD) / 2 + 6 - 1e-9);
      expect(Math.abs(s.at[2])).toBeLessThan(RACK.half);
    }
    const laned = row.filter(s => s.lane !== undefined).map(s => s.lane!); expect(laned.every((v, i) => !i || laned[i - 1] <= v)).toBe(true);     // in the order of their lanes
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
  it('every rule the piping code cites is written in the design basis', () => {
    const defined = new Set([...basisDoc.matchAll(/`(SW-[A-Z]+-\d+[a-z]?)`/g)].map(m => m[1]));
    for (const f of ['unitPiping', 'pipingReport', 'cell']) for (const m of readFileSync(new URL(`../src/refinery/${f}.ts`, import.meta.url), 'utf8').matchAll(/SW-[A-Z]+-\d+[a-z]?/g)) expect(defined.has(m[0]), `${f}: ${m[0]}`).toBe(true);
    for (const k of ['SW-RPI-1', 'SW-RPI-2', 'SW-RPI-3', 'SW-RPI-4', 'SW-RPI-5', 'SW-RPI-6', 'SW-CELL-6']) expect(defined.has(k), k).toBe(true);
  });
});
