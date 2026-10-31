import { readFileSync } from 'node:fs';
import { generateBuilding, billOfMaterials, DEMO_PLANT, sizeW } from '../src/generator/building';
import { cfDims, zProfile, csProfile, sizeColdFormed, CF_THICKNESS_SERIES, panelProfile, makePanel, PANEL, trimProfile, ridgeCapProfile, makeZ, makeCS, makeTrim, makeRod, makeFilletWeldAround, proportionW } from '../src/catalogue';
import { sectionProps, wPlasticModulus } from '../src/geometry/properties';
import { isSimple, isCCW, ensureCCW } from '../src/geometry/polygon';
import { buildGeometry } from '../src/geometry/partGeometry';
import { isClosed, signedVolume } from '../src/geometry/mesh';
import { wProfile } from '../src/geometry/profiles';
import { ruleIdsOf } from '../src/core/basis';

const basisDoc = readFileSync(new URL('../DESIGN_BASIS.md', import.meta.url), 'utf8');
const definedRules = new Set([...basisDoc.matchAll(/`(SW-[A-Z]+-\d+[a-z]?)`/g)].map(m => m[1]));

describe('section property integrator (SW-CF-3)', () => {
  it('rectangle b h^3/12', () => {
    const p = sectionProps({ outer: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 10 }, { x: 0, y: 10 }] });
    expect(p.A).toBeCloseTo(40, 9); expect(p.Ixx).toBeCloseTo((4 * 1000) / 12, 9); expect(p.Iyy).toBeCloseTo((10 * 64) / 12, 9);
    expect(p.cx).toBeCloseTo(2, 9); expect(p.cy).toBeCloseTo(5, 9); expect(p.Sx).toBeCloseTo((4 * 1000) / 12 / 5, 9);
  });
  it('is winding-independent and handles rings', () => {
    const r = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 10 }, { x: 0, y: 10 }];
    const a = sectionProps({ outer: r }), b = sectionProps({ outer: [...r].reverse() });
    expect(a.Ixx).toBeCloseTo(b.Ixx, 9);
    const ring = sectionProps({ outer: r, inner: [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 9 }, { x: 1, y: 9 }] });
    expect(ring.A).toBeCloseTo(40 - 16, 9);
    expect(ring.Ixx).toBeCloseTo((4 * 1000) / 12 - (2 * 512) / 12, 9);
  });
  it('W plastic modulus closed form', () => {
    expect(wPlasticModulus(10, 5, 0.5, 0.3)).toBeCloseTo(5 * 0.5 * 9.5 + (0.3 * 81) / 4, 9);
  });
});

describe('cold-formed sections (SW-CF-1/5)', () => {
  it('Z and C profiles are simple polygons with the expected area', () => {
    for (const [D, B, t] of [[8, 2.5, 0.0625], [10, 2.5, 0.078125], [12, 3.5, 0.140625]]) {
      const c = cfDims(D, B, t);
      for (const poly of [zProfile(c), csProfile(c)]) {
        expect(isSimple(poly)).toBe(true);
        const A = sectionProps({ outer: ensureCCW(poly) }).A;
        const approx = t * (D + 2 * B + 2 * c.lip); // centre-line length × t, bends ignored
        expect(Math.abs(A - approx) / approx).toBeLessThan(0.06);
      }
    }
  });
  it('thickness series is monotone in demand', () => {
    const Fy = 50;
    let last = 0;
    for (const span of [120, 180, 240, 300, 360]) {
      const s = sizeColdFormed('Z', span, 1.5, Fy);
      expect(CF_THICKNESS_SERIES).toContain(s.t);
      expect(s.S).toBeGreaterThanOrEqual(s.Sreq);
      expect(s.D * 1000 + s.t).toBeGreaterThanOrEqual(last); last = s.D * 1000 + s.t;
    }
    const a = sizeColdFormed('Z', 300, 1.0, Fy), b = sizeColdFormed('Z', 300, 3.0, Fy);
    expect(b.t).toBeGreaterThanOrEqual(a.t);
  });
  it('Z weight is derived and meshes close', () => {
    for (const p of [makeZ('z', 10, 2.5, 0.078125, 120), makeCS('c', 8, 2.5, 0.0625, 96)]) {
      const g = buildGeometry(p);
      expect(isClosed(g.solids[0].mesh)).toBe(true);
      expect(Math.abs(g.volume * 490 / 1728 - p.weight.value) / p.weight.value).toBeLessThan(0.005);
    }
  });
});

describe('cladding (SW-CL-1/3/5)', () => {
  it('panel profile is simple, thickness correct, and carries the demo spans', () => {
    const poly = panelProfile();
    expect(isSimple(poly)).toBe(true);
    const props = sectionProps({ outer: ensureCCW(poly) });
    const centreLineLen = props.A / PANEL.t;
    expect(centreLineLen).toBeGreaterThan(PANEL.cover); // ribs add length
    const SxPerFt = (props.Sx * 12) / PANEL.cover;
    for (const [span, psf] of [[60, DEMO_PLANT.roofLoadPsf], [90, DEMO_PLANT.wallPsf]]) {
      const M = ((psf / 12) * span * span) / 8; // lb·in per foot of width
      expect(SxPerFt).toBeGreaterThanOrEqual(M / (0.9 * 50 * 1000));
    }
  });
  it('panel, trim and ridge cap meshes close and weigh their drawn volume', () => {
    for (const p of [makePanel('p', 120), makeTrim('t', 'corner', 4, 4, 60), makeTrim('r', 'ridge', 12, 12, 60, undefined, undefined, Math.atan(1 / 12))]) {
      const g = buildGeometry(p);
      expect(isClosed(g.solids[0].mesh)).toBe(true);
      expect(Math.abs(g.volume * 490 / 1728 - p.weight.value) / p.weight.value).toBeLessThan(0.005);
    }
    expect(isSimple(trimProfile(4, 4))).toBe(true);
    expect(isSimple(ridgeCapProfile(12, Math.atan(1 / 12)))).toBe(true);
  });
});

describe('frame sizing (SW-PF-*)', () => {
  it('sizeW returns a multiple of 5 lb/ft meeting Z', () => {
    const r = sizeW(24, 160);
    expect(r.w % 5).toBe(0); expect(r.Z).toBeGreaterThanOrEqual(160);
    expect(sizeW(24, 300).w).toBeGreaterThan(r.w);
  });
  it('weld all around a profile is closed with the right volume', () => {
    const col = proportionW(10, 49);
    const w = makeFilletWeldAround('w', wProfile(col), 0.5);
    const g = buildGeometry(w);
    expect(isClosed(g.solids[0].mesh)).toBe(true);
    expect(Math.abs(g.volume * 490 / 1728 - w.weight.value) / w.weight.value).toBeLessThan(0.08); // miter offset vs. ideal triangle sweep
  });
});

describe('demonstration plant (DESIGN_BASIS §18)', () => {
  const model = generateBuilding();
  const tagged = (t: string) => model.instances.filter(i => i.tags.includes(t));
  it('has the right member counts', () => {
    expect(tagged('column').length).toBe(2 * (DEMO_PLANT.bays + 1));
    expect(tagged('rafter').length).toBe(2 * (DEMO_PLANT.bays + 1));
    expect(tagged('base-plate').length).toBe(2 * (DEMO_PLANT.bays + 1) + tagged('post').length);
    expect(tagged('anchor-rod').length).toBe(4 * tagged('base-plate').length);
    expect(tagged('post').length).toBe(2 * 3);
    expect(tagged('leaf').length).toBe(4); expect(tagged('curtain').length).toBe(2);
  });
  it('purlin spacing ≤ 5 ft and girt spacing ≤ 7.5 ft', () => {
    const ys = [...new Set(tagged('purlin').filter(i => i.transform[14] > 0).map(i => i.transform[14]))].sort((a, b) => a - b); // z of south-slope purlins
    for (let k = 1; k < ys.length; k++) expect(ys[k] - ys[k - 1]).toBeLessThanOrEqual(60 + 1e-6);
    const gy = [...new Set(tagged('girt').map(i => i.transform[13]))].sort((a, b) => a - b);
    for (let k = 1; k < gy.length; k++) expect(gy[k] - gy[k - 1]).toBeLessThanOrEqual(90 + 1e-6);
    expect(gy[0]).toBeLessThanOrEqual(90);
  });
  it('rafter section meets Z, bolts ≥ 3/4 in, no door overlaps a column', () => {
    expect(model.derived.frameSection.value).toBeGreaterThanOrEqual(model.derived.Zreq?.value ?? 0);
    expect(model.derived.kneeBolt.value).toBeGreaterThanOrEqual(0.75);
    const colX = tagged('column').map(i => i.transform[12]);
    for (const leaf of tagged('leaf')) for (const x of colX) expect(Math.abs(leaf.transform[12] - x)).toBeGreaterThan(DEMO_PLANT.personnelDoor.w / 2 + 6);
  });
  it('is plain data: serialisable, finite transforms, every rule written in DESIGN_BASIS.md', () => {
    const json = JSON.stringify(model);
    expect(json.length).toBeGreaterThan(1000);
    for (const i of model.instances) {
      for (const v of i.transform) expect(Number.isFinite(v)).toBe(true);
      for (const id of ruleIdsOf(i.part.dims)) expect(definedRules.has(id), `rule ${id} missing`).toBe(true);
      if (i.part.weight.basis.kind === 'rule') expect(definedRules.has(i.part.weight.basis.id)).toBe(true);
    }
    for (const dm of Object.values(model.derived)) if (dm.basis.kind === 'rule') expect(definedRules.has(dm.basis.id), `derived rule ${dm.basis.id}`).toBe(true);
  });
  it('bill of materials sums the instance weights', () => {
    const bom = billOfMaterials(model);
    const total = bom.reduce((s, e) => s + e.weight, 0);
    const direct = model.instances.filter(i => i.part.category !== 'non-steel').reduce((s, i) => s + i.part.weight.value, 0);
    expect(total).toBeCloseTo(direct, 6);
    expect(total).toBeGreaterThan(100000); // a 200 ft × 80 ft steel building weighs well over 50 tons
  });
  it('every placed part builds a closed mesh', () => {
    const seen = new Set<string>();
    for (const i of model.instances) {
      if (seen.has(i.part.id + i.part.designation + i.part.length?.value)) continue;
      seen.add(i.part.id + i.part.designation + i.part.length?.value);
      const g = buildGeometry(i.part);
      expect(g.solids.length).toBeGreaterThan(0);
      for (const s of g.solids) { expect(isClosed(s.mesh), `${i.part.designation} ${s.name}`).toBe(true); expect(signedVolume(s.mesh)).toBeGreaterThan(0); }
    }
  });
});
