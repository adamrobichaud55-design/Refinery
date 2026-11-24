/** Plant 3, the coastal refinery: the exports of each piped unit (DESIGN_BASIS.md §79): its ground truth and its piping
 *  component files, written by the exporters of plants 1 and 2 as they are. What is on disk is whole: a file for every line
 *  of the unit's model, every weld and component in it, the unit's equipment with its connections. */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import type { PipingModel } from '../src/generator/piping';
import { lineFileName, type GTLine, type GTEquipment, type GTItem } from '../src/generator/groundtruth';
import { pcfName } from '../src/exchange/pcf';
import { unitPiping } from '../src/refinery/unitPiping';

const src = new URL('../public/refinery/piping/', import.meta.url), out = (u: number, f: string) => new URL(`../public/refinery/units/unit-${u}/${f}`, import.meta.url);
const units = readdirSync(src).map(f => /^unit-(\d+)\.json$/.exec(f)?.[1]).filter((n): n is string => !!n).map(Number).sort((a, b) => a - b);
const json = <T>(u: URL) => JSON.parse(readFileSync(u, 'utf8')) as T;

describe('plant 3: the exports of the piped units', () => {
  it('each piped unit has its ground truth: a file for every line, with every component, weld and support of the model', () => {
    expect(units.length).toBeGreaterThan(0);
    for (const u of units) {
      const m = json<PipingModel>(new URL(`unit-${u}.json`, src)), idx = json<{ lines: { line: string; file: string }[] }>(out(u, 'groundtruth/index.json'));
      expect(idx.lines.map(l => l.line).sort(), `unit ${u}`).toEqual(m.lines.map(l => l.no).sort());
      let welds = 0, items = 0, supports = 0;
      for (const l of m.lines) {
        const f = out(u, `groundtruth/lines/${lineFileName(l.no)}`); expect(existsSync(f), l.no).toBe(true); const g = json<GTLine>(f);
        expect(g.header.line).toBe(l.no); expect(g.welds.length, l.no).toBe(l.welds.length); expect(g.supports.length, l.no).toBe(l.supports.length); expect(g.items.length, l.no).toBeGreaterThanOrEqual(l.comps.filter(c => c.kind !== 'studs').length);
        welds += g.welds.length; items += g.items.length; supports += g.supports.length;
        for (const w of g.welds) { expect(w.line).toBe(l.no); expect(['shop', 'field']).toContain(w.shopField); }
      }
      expect(welds).toBe(m.lines.reduce((a, l) => a + l.welds.length, 0)); expect(items).toBeGreaterThan(1000); expect(supports).toBeGreaterThan(50);
      expect(existsSync(out(u, 'groundtruth/bom.csv'))).toBe(true); expect(existsSync(out(u, 'groundtruth/line-classes.json'))).toBe(true);
      expect(json<GTItem[]>(out(u, 'groundtruth/nozzles.json')).length).toBeGreaterThan(m.nozzles.length);
    }
  });
  it('lists the unit\'s equipment with its connections and the line at each', () => {
    for (const u of units) {
      const up = unitPiping(u), eq = json<GTEquipment[]>(out(u, 'groundtruth/equipment.json')), m = json<PipingModel>(new URL(`unit-${u}.json`, src)), ends = new Set(m.lines.flatMap(l => [l.from, l.to]));
      expect(eq.map(e => e.tag).sort()).toEqual(up.cell.interior.equipment.map(e => e.tag).sort());
      const own = [...up.nozzles.values()].filter(n => !/^(BL|CS|RS)-/.test(n.id)); expect(eq.reduce((a, e) => a + e.nozzles.length, 0)).toBe(own.length);
      for (const e of eq) for (const n of e.nozzles) { expect(up.nozzles.has(n.id), n.id).toBe(true); expect(n.line !== null, n.id).toBe(ends.has(n.id)); }
      expect(eq.flatMap(e => e.nozzles).filter(n => n.line !== null).length).toBeGreaterThan(0.9 * own.length);   // nearly every connection is piped; the rest are listed by the unit's report
    }
  });
  it('each piped unit has a piping component file for every line, and an index of them', () => {
    for (const u of units) {
      const m = json<PipingModel>(new URL(`unit-${u}.json`, src)), index = readFileSync(out(u, 'pcf/INDEX.csv'), 'utf8').trim().split('\n');
      expect(index.length - 1).toBe(m.lines.length);
      for (const l of m.lines) { const f = out(u, `pcf/${pcfName(l.no)}`); expect(existsSync(f), l.no).toBe(true); const t = readFileSync(f, 'utf8'); expect(t.length).toBeGreaterThan(200); expect(t).toContain(`PIPELINE-REFERENCE ${l.no}`); }
    }
  });
});
