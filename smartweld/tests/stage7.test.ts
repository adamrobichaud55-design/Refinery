/**
 * Stage-7 tests (DESIGN_BASIS.md §52): shutdown work orders, ITPs, isometrics and packs, read from the committed
 * plant piping and ground truth (both checked against fresh runs by the stage-5 and stage-6 tests).
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import type { PipingModel } from '../src/generator/piping';
import type { GTLine, GTEquipment, GroundTruth } from '../src/generator/groundtruth';
import { buildWorkOrders, DEMO_NOTICE, type WorkOrder } from '../src/generator/workorders';
import { workOrderFiles, isoFileName } from '../src/generator/woexport';
import { areaOfLine, areaOfEquipment, equipmentAt } from '../src/generator/areas';
import { generateInterior } from '../src/generator/interior';
import { CLASS_PRESSURE, pipeDims } from '../src/catalogue';

const pub = new URL('../public/', import.meta.url);
const m = JSON.parse(readFileSync(new URL('plant-piping.json', pub), 'utf8')) as PipingModel;
const order = new Map(m.lines.map((l, i) => [l.no, i] as const));
const lines = readdirSync(new URL('groundtruth/lines/', pub)).map(f => JSON.parse(readFileSync(new URL(`groundtruth/lines/${f}`, pub), 'utf8')) as GTLine).sort((a, b) => order.get(a.header.line)! - order.get(b.header.line)!);
const gt = { lines, classes: JSON.parse(readFileSync(new URL('groundtruth/line-classes.json', pub), 'utf8')), nozzles: [] } as GroundTruth;
const eq = JSON.parse(readFileSync(new URL('groundtruth/equipment.json', pub), 'utf8')) as GTEquipment[];
const lineGT = new Map(lines.map(l => [l.header.line, l] as const));
const wos: WorkOrder[] = buildWorkOrders(m, gt, eq);
const OPENS = ['VR', 'SR', 'GJ', 'PR', 'PO', 'VI', 'XB', 'TI'];

describe('stage 7 — work orders (SW-WO-*)', () => {
  it('about 25 work orders across all five areas, numbered by area', () => {
    expect(wos.length).toBeGreaterThanOrEqual(20);
    expect(new Set(wos.map(w => w.area))).toEqual(new Set(['A100', 'A200', 'A300', 'A400', 'A500']));
    for (const w of wos) expect(w.number).toMatch(new RegExp(`^WO-${w.area.slice(1)}-\\d\\d$`));
    expect(new Set(wos.map(w => w.number)).size).toBe(wos.length);
  });
  it('each work order is in the area of its equipment or target line (SW-AREA-1/2)', () => {
    for (const w of wos) {
      if (w.equipment) expect(areaOfEquipment(w.equipment), w.number).toBe(w.area);
      else expect(areaOfLine(m.lines.find(l => l.no === w.lines[0])!), w.number).toBe(w.area);
    }
  });
  it('every work order that opens a line or equipment has an isolation list with blinds (SW-WO-3)', () => {
    for (const w of wos.filter(x => OPENS.includes(x.type))) {
      expect(w.isolations.length, w.number).toBeGreaterThan(0);
      if (w.type !== 'PR') expect(w.isolations.some(i => i.kind === 'valve'), w.number).toBe(true);
      expect(w.isolations.some(i => i.kind === 'blind' || i.kind === 'removal'), w.number).toBe(true);
    }
  });
  it('every ITP has a hold point; isolation and handback are holds where the work opens the plant (SW-ITP-1/2)', () => {
    for (const w of wos) {
      expect(w.itp.some(a => [a.contractor, a.owner, a.thirdParty].includes('H')), w.number).toBe(true);
      w.itp.forEach((a, i) => { expect(a.step).toBe(i + 1); expect(a.status).toBe('open'); expect(a.activity.length).toBeGreaterThan(5); });
      if (OPENS.includes(w.type)) { expect(w.itp[0].owner, w.number).toBe('H'); expect(w.itp[w.itp.length - 1].owner).toBe('H'); }
    }
  });
  it('spool replacements re-make exactly the spool\'s shop welds, its end field welds and its branch outlet welds (SW-WO-4)', () => {
    for (const w of wos.filter(x => x.type === 'SR')) {
      const L = lineGT.get(w.lines[0])!, members = new Set(w.items), sp = L.spools.find(s => s.items.length === members.size && s.items.every(t => members.has(t)))!;
      expect(sp, w.number).toBeTruthy();
      const expected = new Set([...sp.shopWelds, ...L.welds.filter(x => x.shopField === 'field' && (members.has(x.joins[0]) || members.has(x.joins[1]))).map(x => x.tag),
        ...lines.filter(o => o !== L).flatMap(o => o.welds.filter(x => members.has(x.joins[0]) || members.has(x.joins[1])).map(x => x.tag))]);
      expect(new Set(w.newWelds.map(x => x.replaces)), w.number).toEqual(expected);
      for (const x of w.newWelds) expect(x.ws).toBe(pipeDims(x.NPS, x.cls).t <= 0.5 ? 'WS-01' : 'WS-02');
    }
  });
  it('NDE extents follow the line-class consequence (SW-NDE-1/2/3)', () => {
    for (const w of wos.filter(x => x.newWelds.length)) {
      if (w.type === 'SP') { expect(w.newWelds.every(x => x.nde.includes('MT'))).toBe(true); continue; }
      const cls = lineGT.get(w.lines[0])!.header.lineClass, rt = w.newWelds.filter(x => x.nde.includes('RT')).length;
      expect(w.newWelds.every(x => x.nde.includes('VT'))).toBe(true);
      if (['H', 'S', 'F'].includes(cls[0])) expect(rt, w.number).toBe(w.newWelds.length);
      else expect(rt, w.number).toBe(Math.max(1, Math.ceil(0.1 * w.newWelds.length)));
    }
  });
  it('tests follow SW-TEST-1..3', () => {
    for (const w of wos) {
      if (w.type === 'SR') expect(w.test!.pressure).toBeCloseTo(1.4 * CLASS_PRESSURE[lineGT.get(w.lines[0])!.header.cls], 9);
      if (w.type === 'XB') expect(w.test!.basis).toBe('SW-TEST-1');
      if (['VR', 'GJ', 'VI', 'TI'].includes(w.type)) expect(w.test!.basis, w.number).toBe('SW-TEST-2');
      if (w.type === 'PR') expect(w.test!.basis).toBe('SW-TEST-3');
    }
  });
  it('bolt-up preloads equal 0.5 F_u A of the stud (SW-WO-5)', () => {
    for (const w of wos) for (const b of w.bolting) { const d = Number(b.studs.split('×')[1].trim().split('"')[0]); expect(b.preloadPerStud).toBeCloseTo(0.5 * 90000 * (Math.PI / 4) * d * d, 6); }
  });
  it('every work order and pack carries the demonstration notice', () => {
    for (const w of wos) { expect(w.notice).toBe(DEMO_NOTICE); expect(readFileSync(new URL(`workorders/${w.number}.html`, pub), 'utf8')).toContain('DEMONSTRATION ONLY — NOT A QUALIFIED PROCEDURE'); }
  });
});

describe('stage 7 — work orders tied to the plant model (SW-WO-7)', () => {
  const interiorTags = new Set(generateInterior().instances.flatMap(p => p.tags));
  const items = new Set(lines.flatMap(l => [...l.items.map(i => i.tag), ...l.welds.map(x => x.tag), ...l.supports.map(x => x.tag)]));
  const eqTags = new Set(eq.map(e => e.tag)), nozzles = new Set(eq.flatMap(e => e.nozzles.map(n => n.id)));
  it('every asset of every work order is an object of the 3D model', () => {
    for (const w of wos) for (const a of [w.primaryAsset, ...w.assets]) {
      const ok = a.kind === 'equipment' ? eqTags.has(a.tag) : a.kind === 'motor' ? eqTags.has(a.tag.replace(/-M$/, '')) : a.kind === 'nozzle' ? nozzles.has(a.tag) : a.kind === 'structure' ? interiorTags.has(a.tag) : items.has(a.tag);
      expect(ok, `${w.number} ${a.kind} ${a.tag}`).toBe(true);
    }
  });
  it('every affected item, isolation point and replaced weld is among the assets', () => {
    for (const w of wos) { const t = new Set(w.assets.map(a => a.tag)); for (const x of [...w.items, ...w.isolations.filter(i => i.kind !== 'electrical').map(i => i.tag), ...w.newWelds.filter(n => n.ws !== 'WS-03').map(n => n.replaces)]) expect(t.has(x), `${w.number} ${x}`).toBe(true); }
  });
  it('the primary asset is the equipment worked on or served, else the nearest rack bent', () => {
    for (const w of wos) {
      const L = w.lines[0] ? lineGT.get(w.lines[0]) : undefined, served = L ? equipmentAt(L.header.from) ?? equipmentAt(L.header.to) : null;
      if (w.type === 'PO' || w.type === 'VI' || w.type === 'XB' || w.type === 'TI') expect(w.primaryAsset.kind).toBe('equipment');
      else if (served) expect(w.primaryAsset.tag, w.number).toBe(served);
      else expect(w.primaryAsset.tag, w.number).toMatch(/^rack-bent:\d+$/);
    }
  });
});

describe('stage 7 — isometrics (SW-ISO-1/2)', () => {
  it('every isometric contains every item, weld and support of its line', () => {
    for (const L of lines) {
      const svg = readFileSync(new URL(`isometrics/${isoFileName(L.header.line)}`, pub), 'utf8'), tags = new Set([...svg.matchAll(/data-tag="([^"]*)"/g)].map(x => x[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')));
      for (const t of [...L.items.map(i => i.tag), ...L.welds.map(w => w.tag), ...L.supports.map(s => s.tag)]) expect(tags.has(t), `${L.header.line} ${t}`).toBe(true);
    }
  });
});

describe('stage 7 — export', () => {
  it('the committed work orders, packs and isometrics equal a fresh export; every pack has its PDF', () => {
    const files = workOrderFiles(m, gt, eq);
    for (const [p, c] of files) expect(readFileSync(new URL(p, pub), 'utf8') === c, p).toBe(true);
    for (const w of wos) expect(existsSync(new URL(`workorders/pdf/${w.number}.pdf`, pub)), w.number).toBe(true);
  });
  it('every stage-7 rule ID used in code is written in DESIGN_BASIS.md', () => {
    const basis = readFileSync(new URL('../DESIGN_BASIS.md', import.meta.url), 'utf8');
    for (const f of ['generator/workorders.ts', 'generator/isometric.ts', 'generator/wopack.ts', 'generator/woexport.ts', 'generator/areas.ts']) {
      const src = readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8');
      for (const id of new Set(src.match(/SW-[A-Z]+-\d+[a-z]?/g) ?? [])) expect(basis.includes('`' + id + '`'), `${id} in ${f}`).toBe(true);
    }
  });
});
