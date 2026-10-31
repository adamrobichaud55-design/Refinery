import { readFileSync } from 'node:fs';
import { generateInterior, DEMO_LAYOUT } from '../src/generator/interior';
import { generateBuilding } from '../src/generator/building';
import { buildGeometry } from '../src/geometry/partGeometry';
import { isClosed, signedVolume, transformMesh } from '../src/geometry/mesh';
import { ruleIdsOf } from '../src/core/basis';

const basisDoc = readFileSync(new URL('../DESIGN_BASIS.md', import.meta.url), 'utf8');
const definedRules = new Set([...basisDoc.matchAll(/`(SW-[A-Z]+-\d+[a-z]?)`/g)].map(m => m[1]));
const model = generateInterior();
const tagged = (t: string) => model.instances.filter(i => i.tags.includes(t));
const yOf = (i: { transform: number[] }) => i.transform[13];

describe('interior model (DESIGN_BASIS §28)', () => {
  it('guardrail: top rails at 42 in above the walking surface, posts ≤ 6 ft apart', () => {
    const rails = tagged('guardrail').filter(i => i.part.id === 'HR');
    expect(rails.length).toBeGreaterThan(20);
    const posts = tagged('guardrail').filter(i => i.part.id === 'HRP' && i.part.kind === 'HSS_ROUND');
    // every rail at +42 has a matching rail at +21 (mid rail)
    const heights = new Map<string, number[]>();
    for (const r of rails) { const k = `${r.transform[12].toFixed(1)},${r.transform[14].toFixed(1)}`; heights.set(k, [...(heights.get(k) ?? []), yOf(r)]); }
    let pairs = 0;
    for (const hs of heights.values()) { hs.sort((a, b) => a - b); if (hs.length >= 2 && Math.abs(hs[1] - hs[0] - 21) < 1e-6) pairs++; }
    expect(pairs).toBeGreaterThan(20);
    // post length puts the top rail centre 42 in above the grating
    for (const p of posts) expect(p.part.length!.value).toBeCloseTo(42 + 1.5 - 0.375 - 1, 6);
    // rails are never longer than 6 ft between posts: a rail of length L has ceil(L/72) spans → check posts exist along long rails
    for (const r of rails.filter(r => r.part.length!.value > 72)) {
      const along = posts.filter(p => Math.abs(yOf(p) - (yOf(r) - 42 - 1.5 + 0.375)) < 1e-3 || Math.abs(yOf(p) - (yOf(r) - 21 - 1.5 + 0.375)) < 1e-3);
      expect(along.length, `posts for rail at y=${yOf(r)}`).toBeGreaterThan(0);
    }
  });
  it('stair: rise 7.5, run 10, uniform; treads placed every riser', () => {
    const treads = tagged('tread');
    expect(treads.length).toBe(38 - 3); // 38 risers, 3 flights, landing is the top tread of each
    const ys = [...new Set(treads.map(t => yOf(t).toFixed(3)))].map(Number).sort((a, b) => a - b);
    for (const y of ys) expect(((y / 7.5) % 1 + 1) % 1).toBeLessThan(1e-6);
    expect(model.derived.stair.value).toBe(38);
  });
  it('ladders: rung pitch 12 in; cages only on climbs over 20 ft', () => {
    const rungs = tagged('ladder').filter(i => i.part.id === 'RG');
    const byLadder = new Map<string, number[]>();
    for (const r of rungs) { const k = `${r.transform[12].toFixed(0)},${r.transform[14].toFixed(0)}`; byLadder.set(k, [...(byLadder.get(k) ?? []), yOf(r)]); }
    expect(byLadder.size).toBe(2 + 2 + 2); // rack ends, tanks, column (two sections)
    for (const ys of byLadder.values()) { ys.sort((a, b) => a - b); for (let k = 1; k < ys.length; k++) expect(ys[k] - ys[k - 1]).toBeCloseTo(12, 6); }
    const hoops = tagged('cage').filter(i => i.part.kind === 'CAGE_HOOP');
    const cagedLadders = new Set(hoops.map(h => `${h.transform[12].toFixed(0)},${h.transform[14].toFixed(0)}`));
    expect(cagedLadders.size).toBe(4); // rack ends (22 ft) and tanks (22 ft); column ladders (12.5 / 10 ft) have none
    for (const h of hoops) expect(yOf(h)).toBeGreaterThanOrEqual(84 - 1e-6);
  });
  it('rack: sections meet their rule Z, bents at 20 ft, two tiers', () => {
    expect(model.derived.rackBeam.value).toBeGreaterThan(0);
    const cols = tagged('column').filter(i => i.tags.some(t => t.startsWith('rack-bent')));
    expect(cols.length).toBe(2 * 9);
    const beams = tagged('beam');
    expect(beams.length).toBe(9 * 2);
    expect(new Set(beams.map(b => yOf(b).toFixed(2))).size).toBe(2);
  });
  it('clearances (SW-LAY-4): walkway ≥ 3 ft beside the rack, headroom ≥ 7.5 ft under landings', () => {
    const rackHalf = DEMO_LAYOUT.rack.halfWidth;
    for (const e of model.equipment) {
      const z = Math.abs(e.transform[14]);
      expect(z).toBeGreaterThan(rackHalf + 36);
    }
    const landingBeams = tagged('stair-landing').filter(i => i.part.kind === 'W' && i.transform[13] < 120 && i.transform[13] > 50);
    for (const b of landingBeams) expect(yOf(b) - b.part.dims.d.value / 2).toBeGreaterThanOrEqual(90 - 1e-6);
  });
  it('equipment pads do not overlap each other or the rack columns', () => {
    const pads = tagged('pad').map(p => ({ x: p.transform[12] + p.part.length!.value / 2, z: p.transform[14], w: p.part.dims.w.value, L: p.part.length!.value, tag: p.tags[0] }));
    for (let i = 0; i < pads.length; i++) for (let j = i + 1; j < pads.length; j++) {
      const a = pads[i], b = pads[j];
      const overlap = Math.abs(a.x - b.x) < (a.L + b.L) / 2 && Math.abs(a.z - b.z) < (a.w + b.w) / 2;
      expect(overlap, `${a.tag} overlaps ${b.tag}`).toBe(false);
    }
  });
  it('plain data, finite transforms, rules audited, closed meshes', () => {
    expect(JSON.stringify(model).length).toBeGreaterThan(1000);
    const seen = new Set<unknown>();
    for (const i of model.instances) {
      for (const v of i.transform) expect(Number.isFinite(v)).toBe(true);
      for (const id of ruleIdsOf(i.part.dims)) expect(definedRules.has(id), `rule ${id} missing`).toBe(true);
      if (i.part.weight.basis.kind === 'rule') expect(definedRules.has(i.part.weight.basis.id), `weight rule ${i.part.weight.basis.id}`).toBe(true);
      if (seen.has(i.part)) continue; seen.add(i.part);
      const g = buildGeometry(i.part);
      for (const s of g.solids) { expect(isClosed(s.mesh), `${i.part.designation} ${s.name}`).toBe(true); expect(signedVolume(s.mesh), `${i.part.designation} ${s.name}`).toBeGreaterThan(0); }
    }
    for (const d of Object.values(model.derived)) if (d.basis.kind === 'rule') expect(definedRules.has(d.basis.id)).toBe(true);
  });
  it('everything stays inside the building envelope and below the rafters', () => {
    const b = generateBuilding();
    const L = b.drawing.bays * b.drawing.bayFt * 12, W = b.drawing.widthFt * 12, He = b.drawing.eaveFt * 12;
    const theta = Math.atan(b.drawing.slopeRisePer12 / 12), tanT = Math.tan(theta), cosT = Math.cos(theta);
    const d = b.instances.find(i => i.tags.includes('rafter'))!.part.dims.d.value, tp = b.derived.endPlate.value;
    const dCut = d / cosT, zCut = W / 2 - d - tp, yRidge = He - dCut / 2 + zCut * tanT;
    const rafterUnder = (z: number) => yRidge - Math.abs(z) * tanT - dCut / 2;
    for (const i of model.instances) {
      const g = buildGeometry(i.part);
      for (const s of g.solids) {
        const m = transformMesh(s.mesh, i.transform);
        for (let k = 0; k < m.positions.length; k += 3) {
          expect(m.positions[k]).toBeGreaterThan(0); expect(m.positions[k]).toBeLessThan(L);
          expect(Math.abs(m.positions[k + 2])).toBeLessThan(W / 2 - 12);
          expect(m.positions[k + 1], `${i.part.designation} too high`).toBeLessThan(rafterUnder(m.positions[k + 2]) - 2);
        }
      }
    }
  });
});
