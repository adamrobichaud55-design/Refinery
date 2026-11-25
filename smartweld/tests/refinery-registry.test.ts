/** Plant 3, the coastal refinery: its code layer (DESIGN_BASIS.md §76). Every pressure vessel and boiler has a record
 *  whose wall is the wall its body is drawn with and holds its pressure; every line has a fluid service, a line class
 *  and a severity; every design, piping system and fitting category has an invented registration number; every value
 *  says whether it is the model's, recalled or invented; and the files on disk are what the code produces. */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { processModel } from '../src/refinery/process';
import { sizing, allowable, wall, sphereWall, fireTubeCount, stationed, headerDesign } from '../src/refinery/sizing';
import { cells, siteParts } from '../src/refinery/assemble';
import { FLUIDS } from '../src/refinery/fluids';
import { equipmentRecords, lineRecords, lineClasses, coilRecords, componentRecords, registrationIndex, stressCheck, fluidService, severity, designCrn, fittingCrn, FITTING_CATEGORIES, MAKERS, NOTICE } from '../src/refinery/registry';
import { registryData, registryDocument, recordBlocks, BAND, REGISTRY_IMAGES } from '../src/refinery/registryReport';
import { registryPdf } from '../src/refinery/registryPdf';
import { parseFont } from '../src/pdf/ttf';
import { makeFlueGasCooler, makeSphere, makeWaterTubeBoiler } from '../src/catalogue';

const M = processModel(), Z = sizing(), E = equipmentRecords(), L = lineRecords(), X = registrationIndex();
const basisDoc = readFileSync(new URL('../DESIGN_BASIS.md', import.meta.url), 'utf8');
const kindOf = new Map<string, string>(); for (const sh of M.sheets) for (const e of sh.equip.values()) kindOf.set(e.tag, e.kind);
const body = new Map<string, { dims: Record<string, { value: unknown }>; weight: { value: number } }>();
for (const { cell } of cells()) for (const q of cell.interior.equipment) body.set(q.tag, q.part);
for (const p of siteParts()) if (p.tags.includes('equipment') && !body.has(p.tags[0])) body.set(p.tags[0], p.part);

describe('plant 3: which items have a pressure equipment record (SW-REG-1, SW-REG-2)', () => {
  it('every pressure vessel and boiler has its records, and nothing outside the layer has one', () => {
    const records = (tag: string) => E.filter(r => r.item === tag);
    for (const sh of M.sheets) for (const e of sh.equip.values()) {
      const z = Z.get(sh.no)!.equip.get(e.tag)!, n = records(e.tag).length;
      switch (e.kind) {
        case 'column': case 'reactor': case 'drum': case 'desalter': case 'deaerator': case 'sphere': case 'bullet': case 'furnace': case 'boiler': case 'fluegascooler': expect(n, e.tag).toBe(1); break;
        case 'hx': case 'condenser': expect(n, e.tag).toBe(z.d.shells); break;
        case 'aircooler': expect(n, e.tag).toBe(z.d.bays); break;
        case 'filter': case 'vessel': expect(n, e.tag).toBe(z.count); break;
        case 'psa': expect(n, e.tag).toBe(4); break;
        case 'cracker': expect(n, e.tag).toBe(2); break;
        case 'ejector': expect(n, e.tag).toBe(z.d.stages); break;                                              // one surface condenser a stage (SW-PRC-18)
        case 'tank': expect(n, e.tag).toBe(e.p.vertical ? 1 : 0); break;
        default: expect(n, `${e.tag} (${e.kind})`).toBe(0);                                                  // pumps, compressors, heaters, hoppers, basins, pits, packages, the cooling tower, loading, the flare
      }
    }
    expect(new Set(E.map(r => r.tag)).size).toBe(E.length);
    expect(E.length).toBeGreaterThan(190);
  });
  it('names the code and the report designation by the kind of item', () => {
    for (const r of E) {
      const k = r.kind, section1 = k === 'boiler' || k === 'fluegascooler';
      expect(r.code.value, r.tag).toBe(section1 ? 'ASME Boiler and Pressure Vessel Code, Section I' : 'ASME Boiler and Pressure Vessel Code, Section VIII, Division 1');
      expect(r.report.value, r.tag).toBe(section1 ? 'P-3' : ['column', 'reactor', 'sphere', 'hx', 'condenser', 'furnace', 'cracker', 'ejector'].includes(k) ? 'U-1' : 'U-1A');
      expect(r.code.source).toBe('recalled'); expect(r.report.source).toBe('recalled');
      if (r.report.value === 'U-1' && ['hx', 'condenser', 'furnace', 'ejector'].includes(k)) expect(r.chambers.length, r.tag).toBe(2);
      if (section1) { expect(r.parts!.some(p => p.report?.value === 'P-4'), r.tag).toBe(true); expect(r.parts!.some(p => p.report?.value === 'P-4A'), r.tag).toBe(true); }
    }
    expect(E.filter(r => r.report.value === 'P-3').map(r => r.tag).sort()).toEqual(['B-1901', 'B-1902', 'E-1703']);
  });
  it('lists each fired heater coil, and the packaged components with the fittings', () => {
    const heaters = [...kindOf].filter(([, k]) => k === 'heater').map(([t]) => t), coils = coilRecords();
    for (const h of heaters) expect(coils.some(c => c.heater === h && c.coil === 'process coil'), h).toBe(true);
    for (const c of coils) { expect(c.code.source).toBe('recalled'); expect(c.registration.value).toMatch(/^[A-Z]\d{4}\.7$/); expect(c.design.value.P).toBeGreaterThan(0); }
    const comps = componentRecords();
    expect(comps.map(c => c.tag).sort()).toEqual(['J-1201-J1', 'J-1201-J2', 'J-1201-J3', 'X-1901', 'X-1902', 'X-1904']);
    for (const c of comps) { expect(c.category).toBe('H'); expect(c.registration.value).toMatch(/^0H\d{5}\.7$/); expect(MAKERS).toContain(c.maker.value); }
  });
});

describe('plant 3: what a record says (SW-REG-3)', () => {
  it('takes its design conditions from the sized item and its test pressure from the recalled factor', () => {
    for (const r of E) {
      const section1 = r.report.value === 'P-3';
      for (const c of r.chambers) {
        expect(c.mawp.value, r.tag).toBeGreaterThanOrEqual(50); expect(c.mawp.source).toBe('model'); expect(c.temperature.value, r.tag).toBeGreaterThanOrEqual(150);
        expect(c.testPressure.value, r.tag).toBe(Math.ceil((section1 ? 1.5 : 1.3) * c.mawp.value)); expect(c.testPressure.source).toBe('recalled'); expect(c.contents.length, `${r.tag} ${c.name}`).toBeGreaterThan(0);
      }
      expect(r.relief.length).toBe(r.chambers.length); r.relief.forEach((q, i) => { expect(q.setPressure.value).toBe(r.chambers[i].mawp.value); expect(q.tag.value).toMatch(/^PSV-/); });
      expect(new Set(r.relief.map(q => q.tag.value)).size).toBe(r.relief.length);
      expect(r.nozzles.length, r.tag).toBeGreaterThan(0); expect(r.signatures).toBe('demonstration record: not certified, not signed'); expect(r.demonstration).toBe(true); expect(r.notice).toBe(NOTICE);
    }
    const c1101 = E.find(r => r.tag === 'C-1101')!, z = Z.get(11)!.equip.get('C-1101')!;
    expect(c1101.chambers[0].mawp.value).toBe(z.designP); expect(c1101.chambers[0].temperature.value).toBe(z.designT); expect(c1101.shell.insideDiameter!.value).toBe(z.d.D); expect(c1101.nozzles.length).toBe(z.nozzles.length);
    expect(E.find(r => r.tag === 'C-1201')!.chambers[0].fullVacuum.value).toBe(true);
  });
  it('states the wall the body is drawn with', () => {
    let seen = 0;
    for (const r of E) {
      const b = body.get(r.tag) ?? body.get(r.item), t = b?.dims.t?.value;
      if (r.kind === 'furnace') { expect(b!.dims.boilerT.value).toBe(r.chambers[1].thickness!.value); seen++; continue; }
      if (typeof t !== 'number' || r.kind === 'cracker' || r.kind === 'aircooler') continue;
      expect(r.shell.thickness!.value, r.tag).toBe(t); seen++;
      const id = b!.dims.ID?.value ?? b!.dims.D?.value ?? b!.dims.D2?.value; if (typeof id === 'number') expect(r.shell.insideDiameter!.value, r.tag).toBe(id);
    }
    expect(seen).toBeGreaterThan(150);
    // the items the catalogue walls by proportion take the stated wall (§72), and are unchanged without one
    expect(Number(makeSphere({ tag: 'S', D: 648 }).dims.t.value)).toBe(3.25); expect(Number(makeSphere({ tag: 'S', D: 648, t: 2 }).dims.t.value)).toBe(2);
    expect(makeFlueGasCooler({ tag: 'E', D: 48, L: 240 }).dims.t).toBeUndefined(); expect(Number(makeFlueGasCooler({ tag: 'E', D: 90, L: 240, t: 2.125 }).dims.t.value)).toBe(2.125);
    expect(makeWaterTubeBoiler({ tag: 'B', steamID: 54, L: 300, centres: 180, drumT: 1.25 }).weight.value).toBeGreaterThan(makeWaterTubeBoiler({ tag: 'B', steamID: 54, L: 300, centres: 180 }).weight.value);
    expect(Number(makeFlueGasCooler({ tag: 'E', D: 90, L: 240 }).dims.tubes.value)).toBe(fireTubeCount(90));
  });
  it('every wall holds its pressure by SmartWeld\'s own rule (SW-PRC-14)', () => {
    let checks = 0;
    for (const r of E) {
      const c = stressCheck(r);
      if (r.shape !== 'tube bundle') expect(c.length, r.tag).toBeGreaterThan(0);
      for (const q of c) { expect(q.stress, `${r.tag} ${q.chamber}`).toBeLessThanOrEqual(q.allowed + 0.5); checks++; }
    }
    expect(checks).toBeGreaterThan(230);
    expect(sphereWall(648, 205, 160)).toBe(2); expect(wall(648, 205, 160)).toBeGreaterThan(3.5);          // a sphere needs half a cylinder's wall
    expect(allowable(540)).toBe(18000); expect(allowable(1000)).toBe(9000);
    const s = E.find(r => r.tag === 'S-2101')!; expect(s.shape).toBe('sphere'); expect(stressCheck(s)[0].stress).toBeCloseTo((205 * 648) / 4 / (2 - 0.125), 6);
  });
  it('applies the recalled rules for radiography, heat treatment, lethal service and cold service', () => {
    for (const r of E) {
      const thick = Math.max(r.shell.thickness?.value ?? 0, ...r.chambers.map(c => c.thickness?.value ?? 0)) > 1.25;
      if (thick || r.lethalService.value) { expect(r.radiography.value, r.tag).toBe('full'); expect(r.jointEfficiency.value).toBe(1); }
      expect(r.jointEfficiency.value).toBe(r.radiography.value === 'full' ? 1 : 0.85);
      if (thick && r.shell.material.value !== 'SA-240-304') expect(r.heatTreatment.value, r.tag).toBe('post-weld heat treated');
      for (const k of ['radiography', 'jointEfficiency', 'heatTreatment', 'lethalService', 'mdmt'] as const) expect(r[k].source, `${r.tag} ${k}`).toBe('recalled');
    }
    const lethal = E.filter(r => r.lethalService.value); expect(lethal.length).toBeGreaterThan(10); for (const r of lethal) expect(r.unit, r.tag).toBe(18);
    expect(E.find(r => r.tag === 'C-1801')!.heatTreatment.value).toBe('post-weld heat treated');             // amine
    expect(E.find(r => r.tag === 'S-2101')!.mdmt.value).toBe(-50); expect(E.find(r => r.tag === 'S-2104')!.mdmt.value).toBe(-50); expect(E.find(r => r.tag === 'D-1102')!.mdmt.value).toBe(-20);
    const n2 = E.find(r => r.tag === 'T-1903')!; expect(n2.mdmt.value).toBe(-320); expect(n2.shell.material.value).toBe('SA-240-304'); expect(n2.corrosionAllowance.value).toBe(0);
    const hot = E.filter(r => r.shell.material.value === 'SA-387-11'); expect(hot.length).toBeGreaterThan(5); for (const r of hot) expect([13, 14, 15, 16]).toContain(r.unit);
  });
  it('weighs each record from its body, with an exchanger\'s tubes added and an air cooler\'s pressure parts alone', () => {
    const none = E.filter(r => !r.emptyWeightLb).map(r => r.tag).sort();
    expect(none).toEqual(['D-2201', 'D-2301', 'D-2501', 'D-2502', 'R-1701-RG', 'R-1701-RX']);               // the offsite drums are not placed yet; the cracker's weight is not split
    const e = E.find(r => r.tag === 'E-1109')!, tubes = e.tubes!.count.value * e.tubes!.length.value * Math.PI * (0.75 - 0.75 / 9) * (0.75 / 9) * 0.2836;
    expect(e.emptyWeightLb!.value).toBe(Math.round(body.get('E-1109')!.weight.value + tubes)); expect(tubes).toBeGreaterThan(body.get('E-1109')!.weight.value);
    const a = E.find(r => r.tag === 'A-1101A')!; expect(a.emptyWeightLb!.value).toBeLessThan(25000); expect(a.emptyWeightLb!.value).toBeGreaterThan(10000); expect(a.weightBasis).toMatch(/pressure parts only/);
    for (const r of E) if (r.volumeFt3) expect(r.volumeFt3.value, r.tag).toBeGreaterThan(0);
  });
});

describe('plant 3: lines, their fluid service, line class and severity (SW-REG-4, SW-REG-5, SW-REG-8)', () => {
  it('has a record for every process line and utility connection, each numbered once', () => {
    // a utility connection with a control valve station is two records, as it is piped (SW-PRC-19, SW-RPI-9)
    expect(L.length).toBe(M.sheets.reduce((a, s) => a + s.lines.length, 0) + [...Z.values()].reduce((a, z) => a + z.utils.length + z.utils.filter(stationed).length, 0));
    expect(new Set(L.map(l => l.number)).size).toBe(L.length);
    for (const l of L) { expect(l.number).toMatch(/^(\d+(\.\d+)?|1\/2|3\/4)"-P\d+-[A-Z]+-\d{5}$/); /* a size as SW-LL-1 writes it, with no hyphen of its own */ expect(Math.floor(Number(l.number.slice(-5)) / 1000)).toBe(l.unit); expect(l.code.value).toBe('ASME B31.3 Process Piping'); expect(l.demonstration).toBe(true); }
  });
  it('a utility connection with a control valve station is two lines: the part on the header\'s side of the header\'s class and conditions, the part on the item\'s side of the item\'s own (SW-PRC-19, SW-RPI-9)', () => {
    let n = 0;
    for (const [unit, z] of Z) z.utils.forEach((u, i) => {
      const first = L.filter(l => l.unit === unit && Number(l.number.slice(-5)) === unit * 1000 + 501 + i); expect(first.length, `${u.tag} ${u.port}`).toBe(1);
      if (!stationed(u)) { expect(first[0].pipeClass.value).toBe(u.cls); expect(first[0].design.value.P).toBe(u.designP); return; }
      n++; const second = L.find(l => l.unit === unit && Number(l.number.slice(-5)) === unit * 1000 + 551 + z.utils.slice(0, i).filter(stationed).length)!, hd = headerDesign(u.fluid);
      const [own, hdr] = u.dir === 'to' ? [second, first[0]] : [first[0], second];
      expect(first[0].to).toBe(`control station of ${u.tag} ${u.port}`); expect(second.from).toBe(first[0].to); expect(second.size.value).toBe(first[0].size.value);
      expect(hdr.pipeClass.value).toBe(hd.cls); expect(hdr.design.value.P).toBe(hd.designP); expect(hdr.design.value.T).toBe(hd.designT); expect(own.pipeClass.value).toBe(u.cls); expect(own.design.value.P).toBe(u.designP);
      expect(u.dir === 'to' ? second.to : first[0].from).toBe(`${u.tag} ${u.port}`);
    });
    expect(n).toBeGreaterThan(16);
  });
  it('designates the fluid service by the fluid and the design conditions', () => {
    expect(fluidService('CWS', 100, 150)).toBe('D'); expect(fluidService('CWS', 155, 150)).toBe('Normal'); expect(fluidService('LS', 80, 350)).toBe('D'); expect(fluidService('LS', 80, 370)).toBe('Normal');
    expect(fluidService('AG', 50, 200)).toBe('M'); expect(fluidService('CR', 50, 150)).toBe('Normal'); expect(fluidService('BW', 50, 300)).toBe('Normal'); expect(fluidService('NI', 100, -310)).toBe('Normal');
    for (const l of L) {
      const c = l.fluidService.value; expect(c).toBe(fluidService(l.fluid, l.design.value.P, l.design.value.T)); expect(l.fluidService.source).toBe('recalled');
      if (c === 'D') { expect(FLUIDS[l.fluid].hazard === 'flammable' || FLUIDS[l.fluid].hazard === 'toxic', l.number).toBe(false); expect(l.design.value.P).toBeLessThanOrEqual(150); expect(l.design.value.T).toBeLessThanOrEqual(366); expect(l.examination.value).toBe('visual'); }
      if (c === 'M') { expect(l.threadedJoints.value).toBe(false); expect(l.examination.value).toMatch(/20 %/); expect(l.unit).toBe(18); } else expect(l.threadedJoints.value).toBe(true);
      if (c === 'Normal') expect(l.examination.value).toMatch(/5 %/);
      expect(l.leakTest.value).toContain(`hydrostatic at ${Math.ceil(1.5 * l.design.value.P)} psi`);
    }
    const n = (c: string) => L.filter(l => l.fluidService.value === c).length; expect(n('D')).toBeGreaterThan(80); expect(n('M')).toBeGreaterThan(10); expect(n('Normal')).toBeGreaterThan(500);
  });
  it('writes each line class so that its name carries the pressure and the medium, and ranks its severity', () => {
    expect(severity('P150', 'CWS', 'liquid', 'D')).toEqual({ level: 1, pressure: 1, medium: 1 }); expect(severity('P1200', 'BW', 'liquid', 'Normal')).toEqual({ level: 4, pressure: 4, medium: 2 });
    expect(severity('P150', 'CR', 'liquid', 'Normal').medium).toBe(3); expect(severity('P150', 'NA', 'vapour', 'Normal').medium).toBe(4); expect(severity('P300', 'LP', 'liquid', 'Normal').medium).toBe(4); expect(severity('P150', 'AG', 'vapour', 'M').level).toBe(5);
    for (const l of L) {
      const m = /^([HWSCGF])(\d+)-(CS|C1|C5|SS)-([DNM])([1-5])$/.exec(l.lineClass.value)!; expect(m, l.number).not.toBeNull();
      expect(`P${m[2]}`).toBe(l.pipeClass.value); expect(m[3]).toBe(l.materials.value.code); expect(m[4]).toBe(l.fluidService.value === 'Normal' ? 'N' : l.fluidService.value); expect(Number(m[5])).toBe(l.severity.value.medium);
      expect(l.severity.value.level).toBe(Math.max(l.severity.value.pressure, l.severity.value.medium)); expect(l.lineClass.source).toBe('model');
    }
    const C = lineClasses(); expect(C.reduce((a, c) => a + c.lines, 0)).toBe(L.length); expect(C.length).toBeGreaterThan(25);
    for (const c of C) { expect(c.severity).toBe(Math.max(c.pressureRank, c.mediumRank)); expect(c.severity).toBe(Math.max(...L.filter(l => l.lineClass.value === c.lineClass).map(l => l.severity.value.level))); }
    expect(C[0].severity).toBe(5); expect(C[C.length - 1].severity).toBe(1);
  });
  it('labels materials by service and marks boiler external piping and the hottest lines', () => {
    for (const l of L) {
      const m = l.materials.value; expect(l.materials.source).toBe('recalled');
      if (m.code === 'C1') { expect([13, 14, 15, 16]).toContain(l.unit); expect(['RX', 'HY']).toContain(l.fluid); expect(l.design.value.T).toBeGreaterThan(500); expect(m.pipe).toBe('A335-P11'); }
      if (m.code === 'C5') { expect([11, 12, 17]).toContain(l.unit); expect(l.design.value.T).toBeGreaterThan(600); expect(m.pipe).toBe('A335-P5'); }
      if (m.code === 'SS') { expect(l.unit).toBe(18); expect(m.pipe).toBe('A312-TP316L'); }
      if (m.code === 'CS') expect(m.pipe).toBe('A106-B');
      expect(!!l.elevatedTemperature).toBe(l.design.value.T >= 800);
    }
    const bep = L.filter(l => l.boilerExternalPiping); expect(bep.length).toBeGreaterThanOrEqual(6);
    for (const l of bep) expect(/B-190[12]|E-1703/.test(`${l.from} ${l.to}`), l.number).toBe(true);
    expect(L.filter(l => l.materials.value.code === 'SS').length).toBeGreaterThan(4);
  });
});

describe('plant 3: registration numbers (SW-REG-6)', () => {
  it('are invented by a rule from the tag, in the recalled form, and end in the digit for New Brunswick', () => {
    expect(designCrn('C-1101')).toBe(designCrn('C-1101')); expect(designCrn('C-1101')).not.toBe(designCrn('C-1102'));
    for (const r of E) { expect(r.registration.value).toMatch(/^[A-Z]\d{4}\.7$/); expect(r.registration.value).toBe(designCrn(r.tag)); expect(r.registration.source).toBe('invented'); expect(r.fabricator.value).toMatch(/^Demonstration Fabricator [A-F]$/); expect(r.serial.source).toBe('invented'); }
    for (const l of L) { expect(l.pipingSystemRegistration.value).toMatch(/^[A-Z]\d{4}\.7$/); expect(l.pipingSystemRegistration.value).toBe(designCrn(`piping:${l.unit}:${l.lineClass.value}`)); }
    expect(fittingCrn('C', 'P300', MAKERS[0])).toMatch(/^0C\d{5}\.7$/);
  });
  it('index every design once: vessels, piping systems by unit and class, heater coils, components and fittings', () => {
    expect(X.demonstration).toBe(true); expect(X.vessels.length).toBe(E.length);
    const systems = new Set(L.map(l => `${l.unit}:${l.lineClass.value}`)); expect(X.pipingSystems.length).toBe(systems.size); expect(X.pipingSystems.reduce((a, s) => a + s.lines, 0)).toBe(L.length);
    const designs = [...X.vessels.map(v => v.registration), ...X.pipingSystems.map(s => s.registration), ...X.heaterCoils.map(c => c.registration)]; expect(new Set(designs).size).toBe(designs.length);
    const classes = new Set(L.map(l => l.pipeClass.value)); expect(X.fittings.length).toBe(Object.keys(FITTING_CATEGORIES).length * classes.size * MAKERS.length); expect(new Set(X.fittings.map(q => q.registration)).size).toBe(X.fittings.length);
    for (const q of X.fittings) expect(q.registration.startsWith(`0${q.category}`)).toBe(true);
  });
});

describe('plant 3: the code layer\'s files (SW-REG-7)', () => {
  it('every value in the data says whether it is the model\'s, recalled or invented', () => {
    let fields = 0; const walk = (v: unknown): void => {
      if (Array.isArray(v)) return v.forEach(walk);
      if (v && typeof v === 'object') { const o = v as Record<string, unknown>; if ('source' in o) { expect(['model', 'recalled', 'invented']).toContain(o.source); expect('value' in o).toBe(true); fields++; } Object.values(o).forEach(walk); }
    };
    const D = registryData(); walk(D.equipment); walk(D.lines); expect(fields).toBeGreaterThan(10000);
    for (const k of ['equipment', 'lines', 'registration'] as const) { expect(D[k].demonstration).toBe(true); expect(D[k].notice).toBe(NOTICE); }
  });
  it('the files on disk are what the code produces', () => {
    const D = registryData(), round = (_k: string, v: unknown) => (typeof v === 'number' && !Number.isInteger(v) ? Number(v.toPrecision(7)) : v);
    for (const [name, data] of Object.entries(D)) expect(readFileSync(new URL(`../public/refinery/registry/${name}.json`, import.meta.url), 'utf8'), name).toBe(JSON.stringify(data, round, 1) + '\n');
    expect(readFileSync(new URL('../docs/REFINERY-REGISTRY.md', import.meta.url), 'utf8')).toBe(registryDocument() + '\n');
    for (const u of [...M.sheets.map(s => `unit-${s.no}`), 'registration-index']) expect(existsSync(new URL(`../public/refinery/registry/${u}.pdf`, import.meta.url)), u).toBe(true);
    const index = readFileSync(new URL('../screenshots/INDEX.md', import.meta.url), 'utf8');
    for (const name of Object.keys(REGISTRY_IMAGES)) { expect(existsSync(new URL(`../screenshots/refinery/${name}.png`, import.meta.url)), name).toBe(true); expect(index).toContain(`refinery/${name}.png`); }
  });
  it('a printable record carries the demonstration band on every page and reproduces no form', () => {
    const font = parseFont(new Uint8Array(readFileSync(new URL('../assets/fonts/DejaVuSans.ttf', import.meta.url)))), { doc, pdf, pageCount } = registryPdf(font, 15);
    expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe('%PDF-'); expect(pageCount).toBe(doc.pages.length);
    for (const p of doc.pages) expect(p.recs.some(r => r.k === 'text' && r.str === BAND)).toBe(true);
    expect(pageCount).toBeGreaterThanOrEqual(2 + E.filter(r => r.unit === 15).length);
    const text = recordBlocks(E.find(r => r.tag === 'C-1501')!).map(b => JSON.stringify(b)).join(' ');
    expect(text).toContain('SmartWeld\'s own layout'); expect(text).toContain('not certified, not signed'); expect(text).not.toMatch(/FORM U-1|Certificate of Shop Compliance|National Board/i);
  });
  it('every rule the code cites is written in the design basis', () => {
    const defined = new Set([...basisDoc.matchAll(/`(SW-[A-Z]+-\d+[a-z]?)`/g)].map(m => m[1]));
    for (const f of ['registry', 'registryReport', 'registryPdf']) for (const m of readFileSync(new URL(`../src/refinery/${f}.ts`, import.meta.url), 'utf8').matchAll(/SW-[A-Z]+-\d+[a-z]?/g)) expect(defined.has(m[0]), `${f}: ${m[0]}`).toBe(true);
    for (const k of ['SW-REG-0', 'SW-REG-1', 'SW-REG-2', 'SW-REG-3', 'SW-REG-4', 'SW-REG-5', 'SW-REG-6', 'SW-REG-7', 'SW-REG-8']) expect(defined.has(k), k).toBe(true);
  });
});
