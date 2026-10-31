/**
 * Stage-5 tests (DESIGN_BASIS.md §40) on the full generated plant piping. The generator runs once (about a minute);
 * every check reads only the plain-data model and the catalogue rules (src/generator/pipingCheck.ts).
 */
import { readFileSync } from 'node:fs';
import { generatePiping, partFromKey, staticPlant, worldBox, serializePiping, type PipingModel, type Comp } from '../src/generator/piping';
import * as K from '../src/generator/pipingCheck';
import { elbowRadius, pipeDims } from '../src/catalogue';

let m: PipingModel;
const vb = (c: Comp) => worldBox(partFromKey(c.key), c.T)!;
beforeAll(() => { m = generatePiping(); }, 600_000);

describe('stage 5 — plant piping (§40)', () => {
  it('at least 200 lines, every one routed or placed, no failures', () => {
    expect(m.lines.length).toBeGreaterThanOrEqual(200);
    expect(m.failures).toEqual([]);
    expect(m.lines.every(l => l.ok)).toBe(true);
    expect(m.lines.filter(l => l.kind === 'routed').length).toBeGreaterThanOrEqual(80);
  });
  it('every line is continuous: ends meet within 1/16 in, size and class carried', () => expect(K.checkContinuity(m)).toEqual([]));
  it('every butt joint has exactly one weld; every flanged joint a gasket and a stud set', () => expect(K.checkJoints(m)).toEqual([]));
  it('elbows have the SW-FIT-1 radius; no back-to-back elbows; pipe pieces ≥ 2 in and ≤ 40 ft', () => {
    expect(K.checkElbowsAndStraights(m)).toEqual([]);
    const e = m.lines.flatMap(l => l.comps).find(c => c.kind === 'elbow')!;
    expect(e.key.split('|')[3]).toBe('90');
    expect(elbowRadius(pipeDims(e.NPS, e.cls).OD)).toBeCloseTo((5 / 3) * pipeDims(e.NPS, e.cls).OD, 9);
  });
  it('line numbers follow SW-LL-1; every valve is offered in its size and class', () => expect(K.checkNumberingAndValves(m)).toEqual([]));
  it('no two lines come within 3 in (valves by their drawn envelope)', () => expect(K.checkLineClearance(m, vb).violations).toEqual([]));
  it('no line comes within 3 in of the structure or equipment', () => expect(K.checkStaticClearance(m, staticPlant(), vb)).toEqual([]), 120_000);
  it('spans within SW-PS-7; a shoe, guide or anchor at every rack beam crossed', () => expect(K.checkSupports(m)).toEqual([]));
  it('one anchor per rack run, guides beside it', () => {
    for (const l of m.lines) { const a = l.supports.filter(s => s.type === 'anchor').length; if (l.supports.some(s => s.type === 'shoe' || s.type === 'guide')) expect(a, l.no).toBeGreaterThanOrEqual(1); }
  });
  it('welds carry ids, line, size, the two components and shop/field status (SW-PW-3)', () => {
    const w = m.lines.flatMap(l => l.welds);
    expect(w.length).toBeGreaterThan(1000);
    for (const x of w) { expect(x.id.startsWith(x.line + '/W')).toBe(true); expect(x.joins[0] && x.joins[1]).toBeTruthy(); expect(x.size).toBeGreaterThan(0); expect(typeof x.field).toBe('boolean'); }
    expect(w.some(x => x.field) && w.some(x => !x.field)).toBe(true);
  });
  it('every nozzle has its neck pipe and weld-neck flange (SW-NOZ-1), face where its line starts', () => {
    for (const n of m.nozzles) { expect(n.comps[0].kind).toBe('flange'); const used = m.lines.some(l => l.comps.some(c => Math.hypot(c.a[0] - n.face[0], c.a[1] - n.face[1], c.a[2] - n.face[2]) < 1 / 16)); expect(used, n.id).toBe(true); }
  });
  it('every part key rebuilds a part', () => {
    const keys = new Set(m.lines.flatMap(l => [...l.comps.map(c => c.key), ...l.welds.map(w => w.key), ...l.supports.map(s => s.key)]));
    for (const k of keys) { if (k.startsWith('VLV')) continue; const p = partFromKey(k); if (p.category === 'non-steel') expect(p.weight.value, k).toBe(0); else expect(p.weight.value, k).toBeGreaterThan(0); }
  });
  it('the committed plant data (public/plant-piping.json) equals a fresh run', () => {
    expect(readFileSync(new URL('../public/plant-piping.json', import.meta.url), 'utf8') === serializePiping(m)).toBe(true);
  });
});

describe('audit: every stage-5 rule used in code is written in DESIGN_BASIS.md', () => {
  const basis = readFileSync(new URL('../DESIGN_BASIS.md', import.meta.url), 'utf8');
  const files = ['generator/piping.ts', 'generator/router.ts', 'generator/nozzles.ts', 'generator/linelist.ts', 'generator/pipingCheck.ts', 'catalogue/parts/fittings.ts'];
  for (const f of files) it(f, () => {
    const src = readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8');
    for (const id of new Set(src.match(/SW-[A-Z]+-\d+[a-z]?/g) ?? [])) expect(basis.includes('`' + id + '`'), `${id} in ${f}`).toBe(true);
  });
});
