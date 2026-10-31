import { makeElbow, makeTee, makeReducer, makeCap, makeButtWeld, makeShoe, makeStanchion, makeHanger, makeTrunnion, elbowRadius, teeC, reducerLength, pipeDims } from '../src/catalogue';
import { buildGeometry } from '../src/geometry/partGeometry';
import { isClosed, signedVolume } from '../src/geometry/mesh';
import { setMaxCells } from '../src/geometry/sdf';

describe('fittings (SW-FIT-*)', () => {
  it('elbow radius 5/3 OD, closed, volume by Pappus', () => {
    for (const [n, a] of [[2, 90], [6, 90], [12, 45]] as const) {
      const e = makeElbow('e', n, 'P300', a), p = pipeDims(n, 'P300'), g = buildGeometry(e);
      expect(e.dims.R.value).toBeCloseTo(elbowRadius(p.OD), 9);
      expect(isClosed(g.solids[0].mesh)).toBe(true);
      const V = Math.PI * (p.OD ** 2 - p.D ** 2) / 4 * e.dims.R.value * (a * Math.PI / 180);
      expect(Math.abs(g.volume - V) / V).toBeLessThan(0.01);
    }
  });
  it('tee, reducer, cap are closed with positive volume', () => {
    setMaxCells(60);
    for (const part of [makeTee('t', 6, 'P150'), makeTee('t', 8, 'P300', 3), makeReducer('r', 6, 4, 'P150'), makeReducer('r', 8, 4, 'P300', 'bottom'), makeCap('c', 6, 'P150')]) {
      const g = buildGeometry(part);
      for (const s of g.solids) { expect(isClosed(s.mesh), part.designation).toBe(true); expect(signedVolume(s.mesh)).toBeGreaterThan(0); }
    }
    expect(teeC(6)).toBeCloseTo(3 + 2, 9);
    expect(reducerLength(6, 4)).toBeCloseTo(1 / Math.tan(12 * Math.PI / 180) + 2, 9);
    setMaxCells(110);
  });
  it('butt weld ring and supports are closed', () => {
    for (const part of [makeButtWeld('w', 6, 'P300'), makeShoe('s', 6, 'P300', 'guide'), makeStanchion('st', 4, 'P150', 60), makeHanger('h', 4, 'P150', 80), makeTrunnion('tr', 6, 'P300', 50)]) {
      for (const s of buildGeometry(part).solids) expect(isClosed(s.mesh), `${part.designation} ${s.name}`).toBe(true);
    }
    expect(makeButtWeld('w', 6, 'P300').weight.value).toBeGreaterThan(0);
  });
});
