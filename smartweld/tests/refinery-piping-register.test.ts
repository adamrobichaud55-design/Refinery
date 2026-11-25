/** Plant 3, the coastal refinery: the piping register of each piped unit (DESIGN_BASIS.md §76, SW-REG-9). Every line the
 *  generator built and every component of it has its record; pipe carries its line's piping system number, fittings, flanges
 *  and valves their maker's number in their category; the files on disk are what the code gives. Demonstration data. */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import type { PipingModel } from '../src/generator/piping';
import { unitPiping } from '../src/refinery/unitPiping';
import { pipingRegister, pipingRegisterDocument, serializeRegister, VALVE_BODY, type PipingRegister } from '../src/refinery/pipingRegister';
import { lineRecords, lineNumber, fittingCrn, designCrn, fluidService, serviceOf, utilitySeq, MAKERS, MATERIALS, BOLTING } from '../src/refinery/registry';
import { sizing } from '../src/refinery/sizing';
import { processModel } from '../src/refinery/process';

const src = new URL('../public/refinery/piping/', import.meta.url), dir = new URL('../public/refinery/registry/piping/', import.meta.url);
const units = readdirSync(src).map(f => /^unit-(\d+)\.json$/.exec(f)?.[1]).filter((n): n is string => !!n).map(Number).sort((a, b) => a - b);
const models = new Map(units.map(u => [u, JSON.parse(readFileSync(new URL(`unit-${u}.json`, src), 'utf8')) as PipingModel]));
const registers = new Map<number, PipingRegister>(units.map(u => [u, pipingRegister(unitPiping(u), models.get(u)!)]));
const basisDoc = readFileSync(new URL('../DESIGN_BASIS.md', import.meta.url), 'utf8');

describe('plant 3: the piping register of a piped unit (SW-REG-9)', () => {
  it('has a record for every line the generator built, each once', () => {
    expect(units.length).toBeGreaterThan(0);
    for (const u of units) {
      const r = registers.get(u)!, m = models.get(u)!; expect(r.demonstration).toBe(true); expect(r.notice).toMatch(/DEMONSTRATION DATA/);
      expect(r.lines.map(l => l.number).sort()).toEqual(m.lines.map(l => l.no).sort()); expect(new Set(r.lines.map(l => l.number)).size).toBe(r.lines.length);
      for (const l of r.lines) { expect(l.unit).toBe(u); expect(l.fluidService).toBe(fluidService(l.fluid, l.designP, l.designT)); expect(l.lineClass).toMatch(new RegExp(`^[HWSCGF]${l.pipeClass.slice(1)}-(CS|C1|C5|SS)-(D|N|M)[1-5]$`)); expect(l.pipingSystemRegistration).toBe(designCrn(`piping:${u}:${l.lineClass}`)); expect(l.leakTest).toContain(String(Math.ceil(1.5 * l.designP))); }
    }
  });
  it('gives a flowsheet line and a utility connection the record of the code layer\'s line register, and the parts made in piping the record of the line they belong to', () => {
    const M = processModel(), Z = sizing();
    for (const u of units) {
      const r = registers.get(u)!, base = new Map(lineRecords().filter(q => q.unit === u).map(q => [q.number, q])), sh = M.sheet(u), z = Z.get(u)!;
      for (const l of r.lines.filter(q => q.origin === 'process' || q.origin === 'utility')) {
        const b = base.get(l.number)!; expect(b, l.number).toBeDefined(); expect(l.of).toBeUndefined();
        expect(l.lineClass).toBe(b.lineClass.value); expect(l.fluidService).toBe(b.fluidService.value); expect(l.severity).toBe(b.severity.value.level); expect(l.pipingSystemRegistration).toBe(b.pipingSystemRegistration.value); expect(l.material).toBe(b.materials.value.code); expect(l.examination).toBe(b.examination.value);
      }
      // the part after a control station: the flowsheet line's fluid and material; its own class, never higher than the line ahead
      for (const l of r.lines.filter(q => q.origin === 'control')) { const a = r.lines.find(q => q.number === l.of)!; expect(a, l.number).toBeDefined(); expect(a.station).toBe(l.station); expect(l.fluid).toBe(a.fluid); expect(l.material).toBe(a.material); expect(Number(l.pipeClass.slice(1))).toBeLessThanOrEqual(Number(a.pipeClass.slice(1))); expect(l.designP).toBeLessThanOrEqual(a.designP); }
      for (const l of r.lines.filter(q => q.origin === 'spare' || q.origin === 'root')) { expect(l.of, l.number).toBeDefined(); expect(base.has(l.of!)).toBe(true); expect(l.fluid).toBe(base.get(l.of!)!.fluid); }
      // a header: its fluid's group letter, at the largest design conditions of its connections
      for (const h of r.lines.filter(q => q.origin === 'header')) { const taps = r.lines.filter(q => q.origin === 'utility' && q.fluid === h.fluid); expect(taps.length).toBeGreaterThan(0); expect(h.designP).toBe(Math.max(...taps.map(t => t.designP))); expect(h.designT).toBe(Math.max(...taps.map(t => t.designT))); expect(h.number).toContain(`-${serviceOf(h.fluid, h.pipeClass, true)}-`); }
      // numbers: a flowsheet line is a process line whatever it carries, and every one piped on this plot is in the register (a line wholly of another plot, the cooling tower's, is that plot's); the utility numbers are 401 to 600
      const piped = new Set(unitPiping(u).lines.filter(l => l.origin === 'process').map(l => l.flow!)); expect(piped.size).toBeGreaterThan(0.8 * sh.lines.length);
      sh.lines.forEach((f, i) => { const no = lineNumber(u, i + 1, z.lines[i].NPS, z.lines[i].cls, f.s.fluid); expect(no).toContain('-P-'); expect(r.lines.some(q => q.number === no), no).toBe(piped.has(i)); });
      for (const l of r.lines) expect(utilitySeq(Number(l.number.slice(-5)) - u * 1000), l.number).toBe(l.origin === 'utility' || l.origin === 'header');
    }
  });
  it('has a record for every component of every line and of every spool, each once', () => {
    for (const u of units) {
      const r = registers.get(u)!, m = models.get(u)!, spool = m.nozzles.filter(n => /^(BL|CS|RS)-/.test(n.id));
      const tags = [...m.lines.flatMap(l => l.comps.map(c => c.tag)), ...spool.flatMap(n => n.comps.map(c => c.tag))];
      expect(r.components.map(c => c.tag).sort()).toEqual([...tags].sort()); expect(new Set(tags).size).toBe(tags.length);
      expect(r.totals.components).toBe(tags.length); expect(r.lines.reduce((a, l) => a + l.components, 0)).toBe(tags.length);
      expect(r.totals.welds).toBe(m.lines.reduce((a, l) => a + l.welds.length, 0) + spool.reduce((a, n) => a + n.welds.length, 0)); expect(r.lines.reduce((a, l) => a + l.welds.shop + l.welds.field, 0)).toBe(r.totals.welds);
      // an item's own nozzles are its pressure equipment record's, not the piping's
      for (const n of m.nozzles.filter(q => !/^(BL|CS|RS)-/.test(q.id))) for (const c of n.comps) expect(r.components.some(q => q.tag === c.tag), c.tag).toBe(false);
    }
  });
  it('registers each by its kind: pipe under its line\'s piping system, fittings in A, flanges and line blanks in B, valves in C, studs and gaskets not at all', () => {
    for (const u of units) {
      const r = registers.get(u)!, line = new Map(r.lines.map(l => [l.number, l]));
      for (const c of r.components) {
        const l = line.get(c.line)!, m = MATERIALS[l.material]; expect(l, c.tag).toBeDefined();
        if (c.kind === 'pipe') { expect(c.registered).toBe('pipe'); expect(c.registration).toBe(l.pipingSystemRegistration); expect(c.maker).toBeUndefined(); expect(c.material).toBe(m.pipe); }
        else if (['elbow', 'tee', 'reducer', 'cap', 'olet', 'swage', 'nipple', 'coupling', 'union'].includes(c.kind)) { expect(c.registered, c.tag).toBe('A'); expect(c.material).toBe(m.fittings); }
        else if (['flange', 'blind', 'spade', 'spectacle'].includes(c.kind)) { expect(c.registered, c.tag).toBe('B'); expect(c.material).toBe(m.flanges); }
        else if (c.kind === 'valve') { expect(c.registered).toBe('C'); expect(c.material).toBe(VALVE_BODY[l.material]); expect(c.what).toMatch(/ valve$/); }
        else { expect(['studs', 'gasket']).toContain(c.kind); expect(c.registered).toBe('none'); expect(c.registration).toBeUndefined(); expect(c.maker).toBeUndefined(); if (c.kind === 'studs') expect(c.material).toBe(BOLTING); }
        if (c.registered === 'A' || c.registered === 'B' || c.registered === 'C') { expect(MAKERS).toContain(c.maker); expect(c.registration).toBe(fittingCrn(c.registered, c.pipeClass, c.maker!)); expect(c.registration).toMatch(new RegExp(`^0${c.registered}\\d{5}\\.7$`)); }
      }
      // every piece of one description is one maker's and carries one number
      const byDesignation = new Map<string, Set<string>>(); for (const c of r.components.filter(q => q.maker)) byDesignation.set(c.designation, (byDesignation.get(c.designation) ?? new Set()).add(`${c.maker}|${c.registration}`));
      for (const [d, s] of byDesignation) expect(s.size, d).toBe(1);
      expect(Object.values(r.totals.byRegistration).reduce((a, b) => a + b, 0)).toBe(r.components.length); expect(r.totals.byRegistration.C).toBeGreaterThan(50);
    }
  });
  it('sums its piping systems and its welds by fluid service', () => {
    for (const u of units) {
      const r = registers.get(u)!;
      expect(r.systems.reduce((a, s) => a + s.lines, 0)).toBe(r.lines.length); expect(r.systems.reduce((a, s) => a + s.components, 0)).toBe(r.components.length); expect(new Set(r.systems.map(s => s.registration)).size).toBe(r.systems.length);
      for (const s of r.systems) expect(r.lines.filter(l => l.lineClass === s.lineClass).every(l => l.pipingSystemRegistration === s.registration)).toBe(true);
      expect(r.welds.reduce((a, w) => a + w.lines, 0)).toBe(r.lines.length); for (const w of r.welds) { expect(w.butt + w.socket + w.fillet).toBe(w.shop + w.field); expect(w.examination).toMatch(/^visual/); }
      expect(Math.abs(r.totals.pipeFt - r.lines.reduce((a, l) => a + l.pipeFt, 0))).toBeLessThan(1);
    }
  });
  it('says of every column whether its values are the model\'s, recalled or invented', () => {
    for (const u of units) {
      const r = registers.get(u)!;
      for (const l of r.lines) for (const k of Object.keys(l)) expect(r.sources.lines[k], `line column ${k}`).toMatch(/^(model|recalled|invented)$/);
      for (const c of r.components) for (const k of Object.keys(c)) expect(r.sources.components[k], `component column ${k}`).toMatch(/^(model|recalled|invented)$/);
      expect(r.sources.components.registration).toBe('invented'); expect(r.sources.components.maker).toBe('invented'); expect(r.sources.lines.fluidService).toBe('recalled'); expect(r.sources.components.material).toBe('recalled');
    }
  });
  it('the files on disk are what the code gives from the models on disk', () => {
    for (const u of units) { const f = new URL(`unit-${u}.json`, dir); expect(existsSync(f), `unit ${u}`).toBe(true); expect(readFileSync(f, 'utf8')).toBe(serializeRegister(registers.get(u)!) + '\n'); expect(JSON.parse(readFileSync(f, 'utf8')).totals).toEqual(registers.get(u)!.totals); }
    expect(readdirSync(dir).filter(f => /^unit-\d+\.json$/.test(f)).length).toBe(units.length);
    // the main pipeway's register (§80) follows the units' in the document, once the pipeway is piped; tests/refinery-pipeway.test.ts checks it against its model
    const pw = new URL('pipeway.json', dir), all = [...registers.values(), ...(existsSync(pw) ? [JSON.parse(readFileSync(pw, 'utf8')) as PipingRegister] : [])];
    expect(readFileSync(new URL('../docs/REFINERY-PIPING-REGISTER.md', import.meta.url), 'utf8')).toBe(pipingRegisterDocument(all) + '\n');
  });
  it('the rule is written in the design basis, and no maker is a real company', () => {
    expect(basisDoc).toContain('`SW-REG-9`'); for (const m of readFileSync(new URL('../src/refinery/pipingRegister.ts', import.meta.url), 'utf8').matchAll(/SW-[A-Z]+-\d+/g)) expect(basisDoc).toContain(`\`${m[0]}\``);
    for (const m of MAKERS) expect(m).toMatch(/^Demonstration Maker \d$/);
  });
});
