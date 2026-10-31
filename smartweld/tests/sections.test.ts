import { makePart, proportionW, wArea, proportionC, angleArea, hssRectArea, hssRoundArea } from '../src/catalogue';
import { areaFromWeightPerFoot } from '../src/core/constants';
import { profileOf, buildGeometry } from '../src/geometry/partGeometry';
import { profileArea, isClosed, signedVolume } from '../src/geometry/mesh';
import { isSimple, isCCW } from '../src/geometry/polygon';

const W_CASES: [number, number][] = [[6, 9], [8, 10], [8, 31], [10, 22], [12, 26], [12, 65], [14, 90], [14, 211], [16, 36], [18, 50], [21, 62], [24, 76], [30, 108], [36, 160]];
const C_CASES: [number, number][] = [[4, 5.4], [6, 8.2], [8, 11.5], [10, 15.3], [12, 20.7], [15, 33.9]];

describe('W sections (SW-W-*)', () => {
  for (const [D, w] of W_CASES) {
    it(`W${D}x${w}: drawn area matches designation weight within 2 %`, () => {
      const p = proportionW(D, w);
      const A = areaFromWeightPerFoot(w);
      expect(Math.abs(wArea(p) - A) / A).toBeLessThan(0.02);
      // drawn profile (polygon) agrees too
      const part = makePart('t', `W${D}x${w}`);
      const prof = profileOf(part)!;
      expect(Math.abs(profileArea(prof) - A) / A).toBeLessThan(0.02);
      expect(isSimple(prof.outer)).toBe(true);
      expect(isCCW(prof.outer)).toBe(true);
      // sanity: flange thicker than web, depth near nominal, width within envelope
      expect(p.tf).toBeGreaterThan(p.tw);
      expect(p.d - D).toBeLessThanOrEqual(2 * p.tf + 0.02); // SW-W-5: depth grows only by flange thickness
      expect(p.d).toBeGreaterThan(0.95 * D);
      expect(p.bf).toBeLessThanOrEqual(D + 1e-9);
      expect(p.bf).toBeGreaterThanOrEqual(0.4 * D - 0.01);
    });
  }
  it('heavier members of a family are deeper (SW-W-5) and share T', () => {
    const a = proportionW(14, 43), b = proportionW(14, 132);
    expect(b.d).toBeGreaterThan(a.d);
    expect(a.T).toBeCloseTo(b.T, 6);
  });
});

describe('C sections (SW-C-*)', () => {
  for (const [D, w] of C_CASES) {
    it(`C${D}x${w}: drawn area matches designation weight within 2 %`, () => {
      const p = proportionC(D, w);
      const A = areaFromWeightPerFoot(w);
      const part = makePart('t', `C${D}x${w}`);
      const prof = profileOf(part)!;
      expect(Math.abs(profileArea(prof) - A) / A).toBeLessThan(0.02);
      expect(isSimple(prof.outer)).toBe(true);
      expect(isCCW(prof.outer)).toBe(true);
      expect(p.tRoot).toBeGreaterThan(p.tTip);
      expect(p.d).toBe(D);
    });
  }
});

describe('L and HSS (SW-L-3, SW-HSS-4)', () => {
  it('angle polygon area equals closed form within 0.5 %', () => {
    for (const [a, b, t] of [[4, 4, 0.25], [6, 4, 0.5], [3, 3, 0.1875], [8, 8, 1]]) {
      const prof = profileOf(makePart('t', `L${a}x${b}x${t}`))!;
      const A = angleArea(a, b, t);
      expect(Math.abs(profileArea(prof) - A) / A).toBeLessThan(0.005);
      expect(isSimple(prof.outer)).toBe(true);
    }
  });
  it('rect HSS ring area equals closed form within 0.5 %', () => {
    for (const [H, B, t] of [[6, 4, 0.25], [8, 8, 0.5], [4, 2, 0.125], [12, 6, 0.375]]) {
      const prof = profileOf(makePart('t', `HSS${H}x${B}x${t}`))!;
      const A = hssRectArea(H, B, t);
      expect(Math.abs(profileArea(prof) - A) / A).toBeLessThan(0.005);
    }
  });
  it('round HSS ring area equals closed form within 0.5 %', () => {
    const prof = profileOf(makePart('t', 'HSS6x0.25'))!;
    const A = hssRoundArea(6, 0.25);
    expect(Math.abs(profileArea(prof) - A) / A).toBeLessThan(0.005);
  });
  it('rejects impossible walls', () => { expect(() => makePart('t', 'HSS2x2x1')).toThrow(); });
});

describe('meshes are closed and volumes agree (DESIGN_BASIS §12)', () => {
  const designations = ['W12x26', 'W14x90', 'C10x15.3', 'L4x3-1/2x1/4', 'HSS6x4x1/4', 'HSS6x0.25', 'PL1/2x12x18', 'FW1/4', 'GW1/2', 'B3/4x2-1/2'];
  for (const des of designations) {
    it(`${des}`, () => {
      const part = makePart('t', des, 60);
      const g = buildGeometry(part);
      for (const s of g.solids) {
        expect(isClosed(s.mesh)).toBe(true);
        expect(signedVolume(s.mesh)).toBeGreaterThan(0);
      }
      const prof = profileOf(part);
      if (prof) {
        const expected = profileArea(prof) * part.length!.value;
        expect(Math.abs(g.volume - expected) / expected).toBeLessThan(0.005);
      }
    });
  }
});
