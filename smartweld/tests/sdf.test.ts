import { polygonize, sphere, cylZ, blend, subtract, cylY, superCylY, ellipsoid, setMaxCells } from '../src/geometry/sdf';
import { isClosed, signedVolume } from '../src/geometry/mesh';

describe('SDF polygoniser (marching tetrahedra)', () => {
  it('sphere: closed, volume within 1 %', () => {
    const m = polygonize(sphere(0, 0, 0, 5), [-5, -5, -5], [5, 5, 5]);
    expect(isClosed(m)).toBe(true);
    const V = (4 / 3) * Math.PI * 125;
    expect(Math.abs(signedVolume(m) - V) / V).toBeLessThan(0.01);
  });
  it('hollow blended casting is closed and has positive volume', () => {
    const outer = blend(1, cylZ(3, -8, 8), cylY(4, -3, 6), ellipsoid(0, 0, 0, 4.5, 4, 3.5));
    const inner = blend(0.5, cylZ(2.5, -9, 9), superCylY(3.4, 2.8, -2.4, 7, 2));
    const m = polygonize(subtract(outer, inner), [-5, -5, -8], [5, 7, 8], 0.2);
    expect(isClosed(m)).toBe(true);
    expect(signedVolume(m)).toBeGreaterThan(0);
  });
  it('coarse tessellation is still closed', () => {
    setMaxCells(30);
    const m = polygonize(subtract(cylZ(3, -8, 8), cylZ(2.6, -9, 9)), [-3, -3, -8], [3, 3, 8]);
    expect(isClosed(m)).toBe(true);
    setMaxCells(110);
  });
});
