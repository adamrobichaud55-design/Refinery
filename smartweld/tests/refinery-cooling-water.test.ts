/** Plant 3, the coastal refinery: the cooling water mains (DESIGN_BASIS.md §81). The plan the generator of plants 1 and 2 is given
 *  for them follows the rules, and the piped mains on disk are whole: every line routed, continuous, jointed by its class, and
 *  clear of one another, of the steel and of everything the pipeway and the units have built. Routing them takes minutes, so the
 *  saved model is checked rather than made again here (tools/refinery-cooling-water.ts makes it). */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { coolingWater, CWM } from '../src/refinery/coolingWater';
import { unitPiping } from '../src/refinery/unitPiping';
import { plantHeaders } from '../src/refinery/headers';
import { pipeDims, designFlange } from '../src/catalogue';
import type { PipingModel } from '../src/generator/piping';
import type { PipedCoolingWater } from '../src/refinery/coolingWaterReport';

const basisDoc = readFileSync(new URL('../DESIGN_BASIS.md', import.meta.url), 'utf8');
const dir = new URL('../public/refinery/piping/', import.meta.url);

describe('plant 3: the cooling water mains (SW-CWM-*)', () => {
  it('every rule the mains are built by is written in the design basis', () => {
    for (let i = 1; i <= 8; i++) expect(basisDoc).toContain(`\`SW-CWM-${i}\``);
  });
  const cw = coolingWater();
  it('two mains of their plant headers\' size and class, the supply on the way\'s centre line and the return a valve\'s pitch north, on sleepers', () => {
    const ph = plantHeaders(() => 0).filter(h => h.fluid === 'CWS' || h.fluid === 'CWR');
    expect(cw.mains.map(m => m.fluid)).toEqual(['CWS', 'CWR']);
    for (const m of cw.mains) { const h = ph.find(q => q.fluid === m.fluid)!; expect([m.NPS, m.cls]).toEqual([h.NPS, h.cls]); }
    const [s, r] = cw.mains, OD = pipeDims(s.NPS, s.cls).OD;
    expect(s.lane).toBe(0); expect(s.lane - r.lane).toBeGreaterThanOrEqual(designFlange(s.NPS, s.cls).OD + 6);
    expect(s.y - OD / 2).toBeCloseTo(CWM.sleeperTop + 4, 6);   // on a 4 in shoe on the sleeper's top
    expect(cw.sleepers.length).toBeGreaterThan(40);
    for (const sl of cw.sleepers) { expect(sl.z0).toBeLessThan(r.lane - OD / 2); expect(sl.z1).toBeGreaterThan(s.lane + OD / 2); }
  });
  it('a branch to every unit\'s cooling water header spool, of the spool\'s size (3 in at least), from the main of its service', () => {
    let n = 0;
    for (const u of [11, 12, 13, 14, 15, 16, 17, 18]) for (const sp of unitPiping(u).spools.filter(q => q.stream === 'cooling water supply' || q.stream === 'cooling water return')) {
      const b = cw.branches.find(q => q.spool === sp.tag); expect(b, sp.tag).toBeDefined(); n++;
      expect(b!.NPS).toBe(Math.max(3, sp.NPS)); expect(b!.stream).toBe(sp.stream); expect(b!.sends).toBe(sp.dir === 'out');
      const l = cw.lines.find(q => q.def.no === b!.line)!, main = cw.mains.find(m => m.stream === sp.stream)!;
      expect([l.def.from, l.def.to].some(e => e.k === 'tap' && e.line === main.line)).toBe(true);
    }
    expect(n).toBe(16); expect(cw.branches.length).toBe(16);
  });
  it('each main from a limit spool at the tower plot\'s edge to one at the west end, each with its valve and blind beyond', () => {
    expect(cw.spools.length).toBe(4);
    for (const m of cw.mains) { const sp = cw.spools.filter(s => s.line === m.line); expect(sp.map(s => s.unit).sort()).toEqual([0, 19]); for (const s of sp) expect(cw.lines.find(l => l.def.no === s.stub)?.def.kind).toBe('stub'); }
  });
  const f = new URL('cooling-water.json', dir), rf = new URL('cooling-water.report.json', dir);
  it.runIf(existsSync(f) && existsSync(rf))('the piped mains on disk: every line routed and every check at zero', () => {
    const m = JSON.parse(readFileSync(f, 'utf8')) as PipingModel, r = JSON.parse(readFileSync(rf, 'utf8')) as PipedCoolingWater;
    expect(r.failures).toEqual([]);
    expect(r.lines.filter(l => !l.routed).map(l => l.no)).toEqual([]);
    for (const [k, v] of Object.entries(r.checks)) expect(v, k).toEqual([]);
    expect(m.lines.length).toBe(cw.lines.length);
  });
});
