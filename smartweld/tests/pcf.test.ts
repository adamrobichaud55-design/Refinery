/**
 * Piping component files (DESIGN_BASIS.md SW-PCF-1..4): every line of both plants writes a PCF from its ground truth; the
 * records chain, every item kind is in the mapping table, the bill matches the ground truth and the output is deterministic.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pcfFor, chained, PCF_MAP, mapOf, skeyOf, pcfDir, pcfName } from '../src/exchange/pcf';
import { checkPlant } from '../src/exchange/pcfCheck';
import type { GTLine } from '../src/generator/groundtruth';

const root = new URL('../', import.meta.url);
const load = (gt: string): GTLine[] => { const d = new URL(gt + '/lines/', root); return readdirSync(d).sort().map(f => JSON.parse(readFileSync(new URL(f, d), 'utf8')) as GTLine); };

for (const [plant, gt] of [['P1', 'public/groundtruth'], ['P2', 'public/plants/P2/groundtruth']] as const) describe(`PCF files, plant ${plant} (SW-PCF-*)`, () => {
  const lines = load(gt);
  it('every item kind and every valve type of the plant is in the mapping table, with a four-letter symbol key', () => {
    for (const L of lines) for (const x of L.items) { expect(mapOf(x), x.key).toBeDefined(); expect(skeyOf(x), x.key).toMatch(/^[A-Z0-9]{4}$/); }
    expect(PCF_MAP.length).toBeGreaterThan(30);
  });
  it('every line writes a file whose records chain and whose bill lists every item code (SW-PCF-2, SW-PCF-4)', () => {
    for (const L of lines) {
      const text = pcfFor(L, lines);
      expect(text.startsWith('UNITS-BORE INCH')).toBe(true); expect(text.includes('ISOGEN')).toBe(false); expect(text.includes(' undefined')).toBe(false);   // no product name, no undefined attribute
      expect(text.includes(`PIPELINE-REFERENCE ${L.header.line}`)).toBe(true);
      expect((text.match(/^END-POINT|^    END-POINT/gm) ?? []).length).toBeGreaterThanOrEqual(2 * L.items.length);
      expect(chained(L), L.header.line).toBe(true);
      for (const x of L.items) expect(text.includes(`ITEM-CODE ${x.designation.replace(/\s+/g, '-')}`), x.tag).toBe(true);
      expect((text.match(/^WELD$/gm) ?? []).length).toBe(L.welds.length);
      expect((text.match(/^SUPPORT$/gm) ?? []).length).toBe(L.supports.length);
    }
  });
  it('a tee, an outlet or a station with a branch line carries its branch point (SW-PCF-2)', () => {
    let branches = 0;
    for (const L of lines) { const t = pcfFor(L, lines); branches += (t.match(/BRANCH1-POINT/g) ?? []).length; }
    expect(branches).toBeGreaterThan(plant === 'P1' ? 100 : 25);   // plant 2 branches mostly through outlets, whose outlet end is their own record
  });
  it('the owner\'s zero-checks of the review (SW-LL-8, SW-GT-7, SW-PCF-2..4) all read zero on the committed files', () => {
    const dir = pcfDir(gt); if (!existsSync(join(dir, 'INDEX.csv'))) return;
    const r = checkPlant(gt, { valveToValve: plant !== 'P1' });
    expect(Object.entries(r.counts).filter(([, v]) => v > 0).map(([k, v]) => `${k}: ${v} e.g. ${r.examples[k].join(', ')}`)).toEqual([]);
  });
  it('the committed files equal a fresh write (deterministic)', () => {
    const dir = pcfDir(gt); if (!existsSync(join(dir, 'INDEX.csv'))) return;
    for (const L of lines) expect(readFileSync(join(dir, pcfName(L.header.line)), 'utf8') === pcfFor(L, lines), L.header.line).toBe(true);
  });
});
