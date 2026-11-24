/** Plant 3, the coastal refinery: a unit piped (DESIGN_BASIS.md §79). What the generator of plants 1 and 2 is given for a
 *  unit — nozzles, lines, battery limit spools — follows the flowsheet and the rules; and the piped units on disk are whole:
 *  every line routed, continuous, jointed by its class, clear of every other and of the steel. Generating a unit takes
 *  minutes, so the saved model is checked rather than made again here (tools/refinery-piping.ts makes it). */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { unitPiping, gateReach, TIER_ROOM, TIER_MOST } from '../src/refinery/unitPiping';
import { processModel } from '../src/refinery/process';
import { sizing } from '../src/refinery/sizing';
import { FLUIDS } from '../src/refinery/fluids';
import { RACK, valveDrop, bodySolids } from '../src/refinery/cell';
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
    for (const t of RACK.tiers.keys()) {
      const row = up.spools.filter(s => s.tier === t).sort((a, b) => a.at[2] - b.at[2]);
      for (const [i, s] of row.entries()) {
        expect(s.at[0]).toBeGreaterThan(RACK.start - RACK.bent); expect(s.at[0]).toBeLessThan(RACK.start - 60); expect(s.at[1]).toBe(Math.ceil((RACK.tiers[t] + 4 + pipeDims(s.NPS, s.cls).OD / 2) / 6 - 1e-9) * 6);
        const inner = up.nozzles.get(`${s.tag}-U`)!, outer = up.nozzles.get(`${s.tag}-P`)!; expect(inner.u).toEqual([1, 0, 0]); expect(outer.u).toEqual([-1, 0, 0]); expect(inner.face[0] - outer.face[0]).toBe(24);
        if (i) expect(s.at[2] - row[i - 1].at[2]).toBeGreaterThanOrEqual((designFlange(s.NPS, s.cls).OD + designFlange(row[i - 1].NPS, row[i - 1].cls).OD) / 2 + 6 - 1e-9);
        expect(Math.abs(s.at[2])).toBeLessThan(RACK.half);
        expect(s.tier).toBe(up.lines.find(l => l.def.no === s.line)!.tier ?? 0);                           // at its line's tier
      }
      const laned = row.filter(s => s.lane !== undefined).map(s => s.lane!); expect(laned.every((v, i) => !i || laned[i - 1] <= v)).toBe(true);     // in the order of their lanes
    }
  });
  it('shares the lines that run the rack among its tiers, largest lowest, and runs the generator once for each (SW-RPI-7)', () => {
    const xOf = (id: string) => up.nozzles.get(id)!.face[0], onRack = up.lines.filter(l => l.tier !== undefined);
    expect(onRack.length).toBeGreaterThan(8); expect(up.tierRoom).toBeGreaterThanOrEqual(TIER_ROOM); expect(up.tierRoom).toBeLessThanOrEqual(TIER_MOST);
    for (const l of onRack) { expect(l.def.service).toBe('P'); expect(l.def.from.k).toBe('nozzle'); expect(l.def.to.k).toBe('nozzle'); }
    for (const l of up.lines.filter(q => q.def.service === 'P' && q.def.from.k === 'nozzle' && q.def.to.k === 'nozzle' && !q.def.from.id.startsWith('BL-') && !q.def.to.id.startsWith('BL-') && !/^RS-/.test(q.def.from.id + q.def.to.id)))
      expect(l.tier !== undefined, l.def.no).toBe(Math.abs(xOf((l.def.from as { id: string }).id) - xOf((l.def.to as { id: string }).id)) > 240);
    // no tier loaded beyond the unit's room at any section: a pipe's width and 3 in for each line over it
    for (const t of up.tiers) for (let x = RACK.start; x <= up.cell.rack.x1; x += 24) {
      const over = onRack.filter(l => l.tier === t).filter(l => { const a = l.def.from as { id: string }, b = l.def.to as { id: string }, xa = a.id.startsWith('BL-') ? 234 : xOf(a.id), xb = b.id.startsWith('BL-') ? 234 : xOf(b.id); return Math.min(xa, xb) - 36 <= x && Math.max(xa, xb) + 36 >= x; });
      expect(over.reduce((w, l) => w + pipeDims(l.def.NPS, l.def.cls).OD + 3, 0), `tier ${t + 1} at x ${x}`).toBeLessThanOrEqual(up.tierRoom + (t === RACK.tiers.length - 1 ? 0 : 1e-9));
    }
    // the larger a line, the lower its tier, where both run the same stretch
    expect(Math.max(...onRack.filter(l => l.tier === up.tiers[0]).map(l => l.def.NPS))).toBe(Math.max(...onRack.map(l => l.def.NPS)));
    // a run for each tier; a branch goes with the line it taps; headers, take-offs and lines that do not run the rack go last
    expect(up.tiers).toEqual([...new Set(onRack.map(l => l.tier!))].sort((a, b) => a - b)); const last = up.tiers.length - 1;
    for (const l of up.lines) {
      const p = up.passOf.get(l.def.no)!; expect(p, l.def.no).toBeGreaterThanOrEqual(0); expect(p).toBeLessThanOrEqual(last);
      if (l.tier !== undefined) expect(p).toBe(up.tiers.indexOf(l.tier));
      const tap = [l.def.from, l.def.to].find(e => e.k === 'tap') as { line: string } | undefined; if (tap) expect(p, l.def.no).toBe(up.passOf.get(tap.line));
      if (l.origin === 'header' || l.origin === 'utility') expect(p).toBe(last);
    }
    // each run is given the rack from its tier upward, and holds the room later lines' first valves will need
    for (const [k, t] of up.tiers.entries()) {
      const pl = up.passPlant(k, []), later = up.lines.filter(l => up.passOf.get(l.def.no)! > k).flatMap(l => [l.def.from, l.def.to].filter(e => e.k === 'nozzle')).length, lanes = k < last ? up.headers.filter(h => h.z !== undefined).length : 0;
      expect(pl.rack.tiers).toEqual(RACK.tiers.slice(t)); expect(pl.interior().instances.length - up.plant.interior().instances.length).toBe(later + lanes);   /* later lines' valve room, and the headers' lanes until the last run */
    }
  }, 120_000);
  it('stands every control valve station at grade under the rack, on a spool that divides its line (SW-RPI-9)', () => {
    const asked = sh.lines.map((f, i) => ({ f, i })).filter(q => q.f.cv); expect(up.stations.length + up.lines.filter(l => l.cvOmitted).length).toBe(asked.length); expect(up.stations.length).toBeGreaterThan(4);
    for (const st of up.stations) {
      const ahead = up.lines.find(l => l.def.no === st.line)!, after = up.lines.find(l => l.def.no === st.after)!, A = up.nozzles.get(`${st.tag}-A`)!, B = up.nozzles.get(`${st.tag}-B`)!;
      expect(ahead.origin).toBe('process'); expect(ahead.def.cv).toBe(true); expect(ahead.def.to).toEqual({ k: 'nozzle', id: `${st.tag}-A` }); expect(after.origin).toBe('control'); expect(!!after.def.cv).toBe(false); expect(after.def.from).toEqual({ k: 'nozzle', id: `${st.tag}-B` });
      expect(after.def.NPS).toBe(ahead.def.NPS); expect(after.def.cls).toBe(ahead.def.cls); expect(after.flow).toBe(ahead.flow); expect(Number(after.def.no.slice(-5)) - U * 1000).toBeGreaterThan(700);
      expect(st.at[1]).toBe(36); expect([36, 72, 108]).toContain(RACK.half - Math.abs(st.at[2])); expect(st.at[0]).toBeGreaterThan(up.cell.rack.x0); expect(st.at[0]).toBeLessThan(up.cell.rack.x1);
      expect(A.u[1]).toBe(0); expect(A.u[2]).toBe(0); expect(B.u).toEqual(A.u.map(v => -v || 0)); expect(Math.abs(B.face[0] - A.face[0])).toBe(24);
      // the flowsheet's destination is where the part after the station ends, and its source where the line starts
      const f = sh.lines[ahead.flow!]; if (f.to.k === 'eq') expect((after.def.to as { id: string }).id.startsWith(up.cell.spots.find(q => q.item === (f.to as { tag: string }).tag)!.tag)).toBe(true);
    }
    // no two stations on one file overlap along the rack
    for (const a of up.stations) for (const b of up.stations) if (a !== b && a.at[2] === b.at[2]) expect(Math.abs(a.at[0] - b.at[0]), `${a.tag} and ${b.tag}`).toBeGreaterThan(60);
  });
  it('starts a branch that must travel the rack at a root spool, a block valve on each face (SW-RPI-8)', () => {
    expect(up.roots.length).toBeGreaterThan(0);
    for (const r of up.roots) {
      const main = up.lines.find(l => l.def.no === r.line)!, conn = up.lines.find(l => l.def.no === r.connection)!; expect(conn.origin).toBe('root'); expect(conn.def.NPS).toBe(main.def.NPS); expect(conn.def.cls).toBe(main.def.cls);
      expect(Number(conn.def.no.slice(-5)) - U * 1000).toBeGreaterThan(600);
      expect([main.def.from.k, main.def.to.k]).toEqual(['nozzle', 'nozzle']); expect([conn.def.from.k, conn.def.to.k].sort()).toEqual(['nozzle', 'tap']);
      const tap = [conn.def.from, conn.def.to].find(e => e.k === 'tap') as { line: string }; expect(tap.line).toBe(r.parent);
      const A = up.nozzles.get(`${r.tag}-A`)!, B = up.nozzles.get(`${r.tag}-B`)!; expect(A.u.map(v => -v || 0)).toEqual(B.u); expect(Math.abs(B.face[0] - A.face[0])).toBe(24); expect(Math.abs(r.at[2])).toBeLessThan(RACK.half); expect(r.at[0]).toBeGreaterThan(RACK.start);
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
  it('every rule the piping code cites is written in the design basis', () => {
    const defined = new Set([...basisDoc.matchAll(/`(SW-[A-Z]+-\d+[a-z]?)`/g)].map(m => m[1]));
    for (const f of ['unitPiping', 'pipingReport', 'cell']) for (const m of readFileSync(new URL(`../src/refinery/${f}.ts`, import.meta.url), 'utf8').matchAll(/SW-[A-Z]+-\d+[a-z]?/g)) expect(defined.has(m[0]), `${f}: ${m[0]}`).toBe(true);
    for (const k of ['SW-RPI-1', 'SW-RPI-2', 'SW-RPI-3', 'SW-RPI-4', 'SW-RPI-5', 'SW-RPI-6', 'SW-RPI-7', 'SW-RPI-8', 'SW-RPI-9', 'SW-CELL-6', 'SW-CELL-7']) expect(defined.has(k), k).toBe(true);
  });
});
