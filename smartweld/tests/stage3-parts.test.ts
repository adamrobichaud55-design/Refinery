import { makeGrating, makeTread, makeCageHoop, clipSegment, GRATING, makeVerticalVessel, makeHorizontalVessel, makeExchanger, makePump, makeTank } from '../src/catalogue';
import { buildGeometry } from '../src/geometry/partGeometry';
import { isClosed, signedVolume, revolve } from '../src/geometry/mesh';

describe('grating (SW-GR-*)', () => {
  it('bar count and weight follow the panel size', () => {
    const g = makeGrating('g', 48, 36);
    expect(g.dims.bars.value).toBe(Math.floor(36 / GRATING.barPitch));
    const bars = g.dims.bars.value * 48 * GRATING.barDepth * GRATING.barT;
    const crosses = Math.floor(48 / GRATING.crossPitch) * 36 * GRATING.crossSize ** 2;
    expect(g.weight.value).toBeCloseTo((bars + crosses) * 490 / 1728, 6);
    const geo = buildGeometry(g);
    expect(Math.abs(geo.volume - (bars + crosses)) / (bars + crosses)).toBeLessThan(1e-6);
  });
  it('clips bars around a circular cut-out', () => {
    const pieces = clipSegment({ x0: 0, y0: 10, x1: 100, y1: 10 }, [{ cx: 50, cy: 10, r: 20 }]);
    expect(pieces.length).toBe(2); expect(pieces[0].x1).toBeCloseTo(30, 9); expect(pieces[1].x0).toBeCloseTo(70, 9);
    expect(clipSegment({ x0: 0, y0: 40, x1: 100, y1: 40 }, [{ cx: 50, cy: 10, r: 20 }]).length).toBe(1);
    const g = makeGrating('g', 100, 100, [{ cx: 50, cy: 50, r: 30 }]);
    expect(g.weight.value).toBeLessThan(makeGrating('g0', 100, 100).weight.value);
  });
  it('tread and hoop meshes are closed', () => {
    for (const p of [makeTread('t', 36), makeCageHoop('h')]) for (const s of buildGeometry(p).solids) expect(isClosed(s.mesh), `${p.designation} ${s.name}`).toBe(true);
  });
});

describe('revolve and equipment envelopes (SW-EQ-*)', () => {
  it('revolved shell ring equals the analytic volume', () => {
    const m = revolve([{ r: 10, z: 0 }, { r: 10, z: 5 }, { r: 9, z: 5 }, { r: 9, z: 0 }], 256);
    const exact = Math.PI * (100 - 81) * 5;
    expect(isClosed(m)).toBe(true);
    expect(Math.abs(signedVolume(m) - exact) / exact).toBeLessThan(0.001);
    const cone = revolve([{ r: 10, z: 0 }, { r: 0, z: 3 }, { r: 0, z: 0 }], 256); // solid cone with apex points
    expect(isClosed(cone)).toBe(true);
    expect(Math.abs(signedVolume(cone) - Math.PI * 100 * 3 / 3) / (Math.PI * 100)).toBeLessThan(0.001);
  });
  it('every equipment solid is closed with positive volume and the weight follows', () => {
    const items = [
      makeVerticalVessel({ tag: 'V-1', ID: 72, t: 0.5, TT: 240, skirtH: 72 }),
      makeHorizontalVessel({ tag: 'D-1', ID: 60, t: 0.5, TT: 180, centreline: 84 }),
      makeExchanger({ tag: 'E-1', ID: 36, t: 0.5, TT: 192, centreline: 60 }),
      makePump({ tag: 'P-1', baseW: 30, baseL: 72, casingD: 20, casingW: 12, motorD: 18, motorL: 30 }),
      makeTank({ tag: 'T-1', D: 144, H: 240, t: 0.25 }),
    ];
    for (const p of items) {
      const g = buildGeometry(p);
      expect(g.solids.length).toBeGreaterThan(0);
      for (const s of g.solids) { expect(isClosed(s.mesh), `${p.designation} ${s.name}`).toBe(true); expect(signedVolume(s.mesh), `${p.designation} ${s.name}`).toBeGreaterThan(0); }
      expect(Math.abs(g.volume * 490 / 1728 - p.weight.value) / p.weight.value).toBeLessThan(1e-6);
      expect(p.weight.value).toBeGreaterThan(100);
    }
  });
});
