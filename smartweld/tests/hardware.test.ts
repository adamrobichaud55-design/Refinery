import { hexHardware, boltLengthForGrip, makeBolt, makeAnchorRod, makeBasePlate, makeStiffener, makeGusset, proportionW, filletLegForThickness, grooveDims, makeFilletWeld, makeGrooveWeld } from '../src/catalogue';
import { buildGeometry, profileOf } from '../src/geometry/partGeometry';
import { isClosed, signedVolume, profileArea } from '../src/geometry/mesh';

describe('bolts (SW-B-*)', () => {
  it('bolt length covers grip + washer + nut + stick-out (SW-B-7)', () => {
    for (const d of [0.5, 0.625, 0.75, 0.875, 1, 1.25]) for (const grip of [0.5, 1, 1.75, 3]) {
      const h = hexHardware(d);
      const L = boltLengthForGrip(d, grip);
      expect(L).toBeGreaterThanOrEqual(grip + h.washerT + h.nutH + d / 4 - 1e-9);
      expect(L % 0.25).toBeCloseTo(0, 9);
    }
  });
  it('head and nut geometry', () => {
    const h = hexHardware(0.75);
    expect(h.F).toBeGreaterThanOrEqual(1.125);
    expect(h.C).toBeGreaterThan(h.F);
    expect(h.hole).toBe(0.8125);
  });
  it('bolt mesh pieces are closed; weight is from geometry', () => {
    const b = makeBolt('b1', 0.75, 2.5, 1.5);
    const g = buildGeometry(b);
    expect(g.solids.map(s => s.name)).toEqual(['head', 'shank', 'washer', 'nut']);
    for (const s of g.solids) expect(isClosed(s.mesh)).toBe(true);
    const rho = 490 / 1728;
    expect(Math.abs(g.volume * rho - b.weight.value) / b.weight.value).toBeLessThan(0.01);
  });
});

describe('base plate, anchor rods, stiffeners (SW-BP-*, SW-AR-*, SW-ST-*)', () => {
  const col = proportionW(10, 49);
  const bp = makeBasePlate('bp', { column: col });
  it('plan size clears the column by the edge margin and is a whole inch', () => {
    expect(bp.dims.N.value).toBeGreaterThanOrEqual(col.d + 6);
    expect(bp.dims.B.value).toBeGreaterThanOrEqual(col.bf + 6);
    expect(bp.dims.N.value % 1).toBe(0);
    expect(bp.dims.t.value).toBeGreaterThanOrEqual(0.75);
    expect(bp.dims.rodCount.value).toBe(4);
  });
  it('drawing-stated bearing pressure changes thickness and is tagged drawing', () => {
    const heavy = makeBasePlate('bp2', { column: col, bearingPressureKsi: 3, rodDiameter: 1 });
    expect(heavy.dims.t.value).toBeGreaterThan(bp.dims.t.value);
    expect(heavy.dims.fp.basis.kind).toBe('drawing');
    expect(bp.dims.fp.basis).toEqual({ kind: 'rule', id: 'SW-BP-2a' });
  });
  it('base plate mesh: 4 cells, closed, volume = plan area less holes × t', () => {
    const g = buildGeometry(bp);
    expect(g.solids.length).toBe(4);
    for (const s of g.solids) expect(isClosed(s.mesh)).toBe(true);
    const expected = (bp.dims.N.value * bp.dims.B.value - 4 * Math.PI * (bp.dims.hole.value / 2) ** 2) * bp.dims.t.value;
    expect(Math.abs(g.volume - expected) / expected).toBeLessThan(0.005);
  });
  it('anchor rod length = embedment + projection stack', () => {
    const ar = makeAnchorRod('ar', { basePlateT: bp.dims.t.value, groutT: bp.dims.grout.value, plateWasherT: bp.dims.washerT.value });
    expect(ar.dims.embed.value).toBe(12);
    expect(ar.dims.L.value).toBe(ar.dims.embed.value + ar.dims.proj.value);
    const g = buildGeometry(ar);
    for (const s of g.solids) { expect(isClosed(s.mesh)).toBe(true); expect(signedVolume(s.mesh)).toBeGreaterThan(0); }
    expect(Math.abs(g.volume * 490 / 1728 - ar.weight.value) / ar.weight.value).toBeLessThan(0.01);
  });
  it('stiffener fits inside the flange with clips', () => {
    const st = makeStiffener('st', col);
    expect(st.dims.bs.value).toBeLessThan((col.bf - col.tw) / 2);
    expect(st.dims.ts.value).toBeGreaterThanOrEqual(0.375);
    expect(st.dims.clip.value).toBeGreaterThanOrEqual(col.R + 0.25);
    const g = buildGeometry(st);
    expect(isClosed(g.solids[0].mesh)).toBe(true);
  });
  it('gusset thickness by SW-GP-2', () => {
    const gp = makeGusset('g', [{ x: 0, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 8 }, { x: 0, y: 12 }], 0.5);
    expect(gp.dims.t.value).toBe(0.375);
    const gp2 = makeGusset('g', [{ x: 0, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 8 }, { x: 0, y: 12 }], 1.0);
    expect(gp2.dims.t.value).toBe(0.75);
  });
});

describe('welds (SW-WD-*)', () => {
  it('fillet leg rule', () => {
    expect(filletLegForThickness(0.25)).toBe(0.1875);
    expect(filletLegForThickness(0.5)).toBe(0.375);
    expect(filletLegForThickness(1.0)).toBe(0.75);
    expect(filletLegForThickness(0.375, true)).toBe(0.3125); // t - 1/16 cap along an edge
  });
  it('groove area matches drawn profile', () => {
    const gw = makeGrooveWeld('gw', 0.5, 10);
    const prof = profileOf(gw)!;
    expect(Math.abs(profileArea(prof) - grooveDims(0.5).area) / grooveDims(0.5).area).toBeLessThan(1e-6);
  });
  it('fillet weld weight', () => {
    const fw = makeFilletWeld('fw', 12, { leg: 0.25 });
    expect(fw.weight.value).toBeCloseTo(0.5 * 0.0625 * 12 * 490 / 1728, 9);
  });
});
