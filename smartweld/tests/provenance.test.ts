import { readFileSync } from 'node:fs';
import { makePart, makeBasePlate, makeAnchorRod, makeStiffener, makeGusset, proportionW } from '../src/catalogue';
import { ruleIdsOf } from '../src/core/basis';

const basisDoc = readFileSync(new URL('../DESIGN_BASIS.md', import.meta.url), 'utf8');
const definedRules = new Set([...basisDoc.matchAll(/`(SW-[A-Z]+-\d+[a-z]?)`/g)].map(m => m[1]));
const definedConstants = new Set([...basisDoc.matchAll(/`(K-\d+)`/g)].map(m => m[1]));

describe('audit: every rule used in code is written in DESIGN_BASIS.md', () => {
  const col = proportionW(10, 49);
  const bp = makeBasePlate('bp', { column: col });
  const parts = [
    ...['W12x26', 'C10x15.3', 'L4x4x1/4', 'HSS6x4x1/4', 'HSS6x0.25', 'PL1/2x12x18', 'B3/4x2-1/2', 'FW1/4', 'GW1/2'].map(d => makePart('t', d)),
    bp,
    makeAnchorRod('ar', { basePlateT: bp.dims.t.value, groutT: 1.5, plateWasherT: 0.375 }),
    makeStiffener('st', col),
    makeGusset('g', [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }], 0.5),
  ];
  for (const p of parts) {
    it(`${p.designation}`, () => {
      const ids = [...ruleIdsOf(p.dims), ...(p.weight.basis.kind === 'rule' ? [p.weight.basis.id] : []), ...(p.length?.basis.kind === 'rule' ? [p.length.basis.id] : [])];
      for (const id of ids) expect(definedRules.has(id), `rule ${id} missing from DESIGN_BASIS.md`).toBe(true);
      for (const d of Object.values(p.dims)) {
        expect(d.basis).toBeDefined();
        if (d.basis.kind === 'constant') expect(definedConstants.has(d.basis.id), `constant ${d.basis.id} missing`).toBe(true);
        expect(Number.isFinite(d.value)).toBe(true);
      }
    });
  }
  it('no regulation basis is claimed in stage 1 (eCFR unreachable, PROVENANCE P-7)', () => {
    for (const p of parts) for (const d of Object.values(p.dims)) expect(d.basis.kind).not.toBe('regulation');
  });
});
