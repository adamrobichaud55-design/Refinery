/**
 * Stage-6 tests (DESIGN_BASIS.md §44): line classes and the ground-truth export, read from the committed plant
 * piping (public/plant-piping.json, itself checked against a fresh run by the stage-5 tests).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { buildGroundTruth, exportFiles, toPlant, fromPlant, type GroundTruth } from '../src/generator/groundtruth';
import { lineClassCode } from '../src/generator/lineclass';
import type { PipingModel } from '../src/generator/piping';

const root = new URL('../public/', import.meta.url);
const m = JSON.parse(readFileSync(new URL('plant-piping.json', root), 'utf8')) as PipingModel;
let gt: GroundTruth;
beforeAll(() => { gt = buildGroundTruth(m); }, 600_000);
const OWN: Record<string, string> = { P: 'H', RV: 'H', CWS: 'W', CWR: 'W', W: 'W', LS: 'S', SC: 'C', IA: 'G', PA: 'G', N: 'G', FL: 'F' };

describe('stage 6 — line classes (SW-LC-*)', () => {
  it('every line has exactly one class, consistent with SW-LC-2 and its pressure class', () => {
    const byNo = new Map(m.lines.map(l => [l.no, l] as const));
    for (const l of m.lines) {
      expect(l.lineClass, l.no).toBe(lineClassCode(l, byNo));
      expect(l.lineClass!.slice(1), l.no).toBe(l.cls.slice(1));
      if (OWN[l.service]) expect(l.lineClass![0], l.no).toBe(OWN[l.service]);
      if (l.from.startsWith('tap ') && !OWN[l.service]) expect(l.lineClass![0], l.no).toBe(byNo.get(l.from.slice(4))!.lineClass![0]);
    }
    const codes = new Set(m.lines.map(l => l.lineClass));
    expect(codes.size).toBeGreaterThanOrEqual(6);
    expect(gt.classes.map(c => c.code).sort()).toEqual([...codes].sort());
    for (const c of gt.classes) expect(c.lines.length).toBe(m.lines.filter(l => l.lineClass === c.code).length);
  });
  it('every item of a line carries that line\'s class', () => {
    for (const l of gt.lines) for (const x of [...l.items, ...l.welds, ...l.supports]) expect(x.lineClass).toBe(l.header.lineClass);
  });
});

describe('stage 6 — item metadata (SW-GT-1..3)', () => {
  it('every item of the plant model appears exactly once, tags unique', () => {
    const tags = [...gt.lines.flatMap(l => [...l.items, ...l.welds, ...l.supports].map(x => x.tag)), ...gt.nozzles.map(x => x.tag)];
    expect(new Set(tags).size).toBe(tags.length);
    const model = [...m.lines.flatMap(l => [...l.comps.map(c => c.tag), ...l.welds.map(w => w.id), ...l.supports.map(s => s.id)]), ...m.nozzles.flatMap(n => n.comps.map(c => c.tag))];
    expect(tags.slice().sort()).toEqual(model.slice().sort());
  });
  it('every SW-GT-1 field is filled', () => {
    for (const l of gt.lines) for (const it of l.items) {
      for (const k of ['tag', 'line', 'lineClass', 'kind', 'description', 'designation', 'key', 'cls', 'material', 'ends', 'spool'] as const) expect(String(it[k]).length, `${it.tag} ${k}`).toBeGreaterThan(0);
      expect(it.itemNo).toBeGreaterThan(0); expect(it.NPS).toBeGreaterThan(0); expect(it.weight).toBeGreaterThanOrEqual(0);
      if (it.kind !== 'gasket') expect(it.weight, it.tag).toBeGreaterThan(0);
      if (it.kind === 'pipe') expect(it.cutLength!, it.tag).toBeGreaterThan(0);
      expect(it.rules.length, it.tag).toBeGreaterThan(0);
      for (const p of [it.a, it.b, it.centre]) for (const v of [p.E, p.N, p.EL]) expect(Number.isFinite(v)).toBe(true);
    }
  });
  it('item numbers: one per description, numbered in order of first appearance', () => {
    for (const l of gt.lines) {
      const seen = new Map<string, number>(); let next = 1;
      for (const it of l.items) { if (!seen.has(it.description)) seen.set(it.description, next++); expect(it.itemNo).toBe(seen.get(it.description)); }
    }
  });
  it('item weights sum to the line BOM weight; pipe lengths to the BOM length', () => {
    for (const l of gt.lines) {
      const w = l.items.reduce((a, i) => a + i.weight, 0);
      expect(l.bom.reduce((a, b) => a + b.weight, 0)).toBeCloseTo(w, 6); expect(l.totals.weight).toBeCloseTo(w, 6);
      expect(l.bom.reduce((a, b) => a + (b.length ?? 0), 0)).toBeCloseTo(l.totals.pipeLength, 6);
    }
  });
  it('plant coordinates convert back to model coordinates exactly (SW-GT-2)', () => {
    for (const p of [[0, 0, 0], [1234.5, 96.25, -318], [-12, 400, 480]] as [number, number, number][]) expect(fromPlant(toPlant(p))).toEqual(p);
    expect(toPlant([0, 0, 0]).EL).toBe(1200);
  });
});

describe('stage 6 — spools and isometric data (SW-GT-4..5)', () => {
  it('pipe, fittings and weld-neck flanges are in spools; valves, gaskets, stud sets and blinds are loose', () => {
    for (const l of gt.lines) for (const it of l.items) {
      if (['valve', 'gasket', 'studs', 'blind'].includes(it.kind)) expect(it.spool, it.tag).toBe('loose');
      else expect(it.spool, it.tag).toMatch(/-SP\d\d$/);
    }
  });
  it('shop welds join two items of one spool; field welds join different spools or a parent tee', () => {
    for (const l of gt.lines) for (const w of l.welds) {
      if (w.shopField === 'shop') { expect(w.spools[0], w.tag).toBe(w.spools[1]); expect(w.spool).toBe(w.spools[0]); }
      else expect(w.spools[0] !== w.spools[1] || w.spools.some(s => s.startsWith('parent ')), w.tag).toBe(true);
    }
  });
  it('spools are numbered from the line start, without gaps', () => {
    for (const l of gt.lines) { const ids = l.spools.map(s => Number(s.id.slice(-2))); expect(ids).toEqual(ids.map((_, i) => i + 1)); }
  });
  it('isometric nodes run continuously along the axes from the line start to its end', () => {
    for (const l of gt.lines) {
      expect(l.nodes.length, l.header.line).toBeGreaterThan(1);
      for (let i = 1; i < l.nodes.length; i++) {
        const a = l.nodes[i - 1].at, b = l.nodes[i].at, moved = [b.E - a.E, b.N - a.N, b.EL - a.EL].filter(v => Math.abs(v) > 1e-3).length;
        expect(moved, `${l.header.line} node ${i}`).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('stage 6 — export (SW-GT-6)', () => {
  it('the committed export equals a fresh export', () => {
    const files = exportFiles(gt), dir = new URL('groundtruth/', root);
    expect(readdirSync(new URL('lines/', dir)).length).toBe(gt.lines.length);
    for (const [p, c] of files) expect(readFileSync(new URL(p, dir), 'utf8') === c, p).toBe(true);
  });
  it('every stage-6 rule ID used in code is written in DESIGN_BASIS.md', () => {
    const basis = readFileSync(new URL('../DESIGN_BASIS.md', import.meta.url), 'utf8');
    for (const f of ['generator/groundtruth.ts', 'generator/lineclass.ts']) {
      const src = readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8');
      for (const id of new Set(src.match(/SW-[A-Z]+-\d+[a-z]?/g) ?? [])) expect(basis.includes('`' + id + '`'), `${id} in ${f}`).toBe(true);
    }
  });
});
