/**
 * Stage 10 (DESIGN_BASIS.md §65): plant 3, the crude topping unit, built from plant 2's kit, catalogue and rules.
 */
import { readFileSync, existsSync } from 'node:fs';
import { PLANT1 } from '../src/generator/plant';
import { PLANT2 } from '../src/generator/plant2';
import { PLANT3 } from '../src/generator/plant3';
import { PLANTS } from '../src/generator/plants';
import type { PipingModel } from '../src/generator/piping';
import { checkPlant } from '../src/exchange/pcfCheck';

const root = new URL('../', import.meta.url);
const basis = readFileSync(new URL('DESIGN_BASIS.md', root), 'utf8');

describe('plant 3 (SW-PLANT-8..11)', () => {
  const p = new URL(PLANT3.paths.piping, root), have = existsSync(p);
  const m = have ? (JSON.parse(readFileSync(p, 'utf8')) as PipingModel) : null;
  it('is the third plant and its definition builds: building, interior, nozzles and lines', () => {
    expect(PLANTS.map(x => x.id)).toEqual(['P1', 'P2', 'P3']);
    expect(PLANT3.building().instances.length).toBe(PLANT2.building().instances.length);       // SW-PLANT-8: plant 2's building drawing
    const eq = PLANT3.interior().equipment.map(e => e.tag);
    expect(eq.length).toBe(26); expect(new Set(eq).size).toBe(26);
    const nz = PLANT3.nozzles(), ls = PLANT3.lines(); expect(ls.length).toBeGreaterThan(300);
    for (const l of ls) for (const e of [l.from, l.to]) if (e.k === 'nozzle') expect(nz.has(e.id), e.id).toBe(true);
    expect(new Set(ls.map(l => l.no)).size).toBe(ls.length);
  });
  it('no tag or line number is shared with plants 1 and 2 (SW-PLANT-10)', () => {
    const tags = (pl: typeof PLANT1) => pl.interior().equipment.map(e => e.tag), t3 = tags(PLANT3), ls = PLANT3.lines();
    for (const t of t3) expect(/^[A-Z]-3\d\d[AB]?$/.test(t), t).toBe(true);
    for (const other of [PLANT1, PLANT2]) {
      expect(tags(other).some(t => t3.includes(t))).toBe(false);
      const nos = new Set(other.lines().map(l => l.no)); expect(ls.some(l => nos.has(l.no))).toBe(false);
    }
    expect(Object.values(PLANT3.areas).flatMap(a => a.equipment).sort()).toEqual([...t3].sort());   // SW-PLANT-11: every item in one area
  });
  it('uses no solids service and no part type beyond plant 2\'s (SW-PLANT-9)', () => {
    expect(PLANT3.lines().some(l => l.service === 'CA')).toBe(false);
    if (!m) return;
    const kinds = (x: PipingModel) => new Set(x.lines.flatMap(l => l.comps.map(c => c.key.split('|')[0])));
    const m2 = JSON.parse(readFileSync(new URL(PLANT2.paths.piping, root), 'utf8')) as PipingModel, k2 = kinds(m2);
    expect([...kinds(m)].filter(k => !k2.has(k))).toEqual([]);
  });
  it('the committed plant-3 piping exists and every line is routed or placed', () => {
    expect(have).toBe(true); if (!m) return;
    expect(m.plant).toBe('P3'); expect(m.lines.length).toBe(PLANT3.lines().length); expect(m.failures).toEqual([]);
    expect(m.lines.every(l => l.ok)).toBe(true);
    for (const no of PLANT3.pilot) expect(m.lines.some(l => l.no === no), no).toBe(true);
  });
  it('the ground truth passes the owner\'s zero-checks (SW-LL-8, SW-GT-7, SW-PCF-*, SW-PEN-1)', () => {
    if (!existsSync(new URL(PLANT3.paths.groundtruth + '/index.json', root))) return;
    const r = checkPlant(PLANT3.paths.groundtruth);
    expect(Object.entries(r.counts).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`)).toEqual([]);
  }, 120_000);
  it('every SW-PLANT rule ID used in plant 3\'s code is written in DESIGN_BASIS.md', () => {
    for (const f of ['src/generator/plant3.ts', 'tests/stage10.test.ts']) for (const id of new Set(readFileSync(new URL(f, root), 'utf8').match(/SW-PLANT-\d+/g) ?? [])) expect(basis.includes('`' + id + '`'), `${id} in ${f}`).toBe(true);
  });
});
