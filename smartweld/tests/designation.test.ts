import { parseDesignation, formatDesignation } from '../src/catalogue/designation';
import { parseDrawingNumber, formatFraction, formatLength } from '../src/core/units';

describe('drawing numbers', () => {
  it('parses decimals, fractions and mixed numbers', () => {
    expect(parseDrawingNumber('0.25')).toBe(0.25);
    expect(parseDrawingNumber('1/4')).toBe(0.25);
    expect(parseDrawingNumber('3-1/2')).toBe(3.5);
    expect(parseDrawingNumber('3 1/2')).toBe(3.5);
    expect(() => parseDrawingNumber('abc')).toThrow();
  });
  it('formats fractions and lengths', () => {
    expect(formatFraction(3.5)).toBe('3-1/2');
    expect(formatFraction(0.25)).toBe('1/4');
    expect(formatFraction(12)).toBe('12');
    expect(formatLength(30)).toBe(`2'-6"`);
    expect(formatLength(0.375)).toBe('0.375"');
  });
});

describe('designation grammar (DESIGN_BASIS §3)', () => {
  const cases: [string, string][] = [
    ['W12x26', 'W12x26'], ['W 14 x 90', 'W14x90'], ['C10x15.3', 'C10x15.3'],
    ['L4x3-1/2x1/4', 'L4x3-1/2x1/4'], ['L3x3x0.25', 'L3x3x1/4'],
    ['HSS6x4x1/4', 'HSS6x4x1/4'], ['HSS6x0.25', 'HSS6x1/4'],
    ['PL1/2x12x18', 'PL1/2x12x18'], ['PL3/8x6', 'PL3/8x6'],
    ['B3/4x2-1/2', 'B3/4x2-1/2'], ['AR3/4x18', 'AR3/4x18'], ['FW1/4', 'FW1/4'], ['GW1/2', 'GW1/2'],
  ];
  for (const [input, canonical] of cases) {
    it(`round-trips ${input}`, () => {
      const d = parseDesignation(input);
      expect(formatDesignation(d)).toBe(canonical);
      expect(parseDesignation(canonical)).toEqual(d);
    });
  }
  it('rejects unknown text', () => { expect(() => parseDesignation('X12x3')).toThrow(); });
});
