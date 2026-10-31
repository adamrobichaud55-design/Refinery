import { readFileSync } from 'node:fs';
import { pipeDims, designFlange, makePipe, makeFlange, makeBlindFlange, makeGasket, makeStud, makeValve, sizeOperator, risingStem, CLASS_PRESSURE, CLASS_SERIES, SIZE_SERIES, VALVE_TYPES, isOffered, offeredSizes, offeredClasses, type PipeClass, type ValveType } from '../src/catalogue';
import { buildGeometry } from '../src/geometry/partGeometry';
import { isClosed, signedVolume } from '../src/geometry/mesh';
import { ruleIdsOf } from '../src/core/basis';

const basisDoc = readFileSync(new URL('../DESIGN_BASIS.md', import.meta.url), 'utf8');
const definedRules = new Set([...basisDoc.matchAll(/`(SW-[A-Z]+-\d+[a-z]?)`/g)].map(m => m[1]));
// valve type rules are written as `G-1`, `GL-1` … under the SW-VLV family
for (const m of basisDoc.matchAll(/`(G|K|GL|GY|GA|C|CL|CD|B|BT|BF|BL|BD|PL|DI|NE|PSV|CV)-(\d+)`/g)) definedRules.add(`SW-VLV-${m[1]}-${m[2]}`);
const SIZES = [0.5, 1, 2, 3, 4, 6, 8, 10, 12, 16, 24, 36, 48], CLASSES: PipeClass[] = CLASS_SERIES;

describe('pipe (SW-PIPE-*)', () => {
  it('wall meets Barlow + CA and the handling minimum; bore < OD', () => {
    for (const NPS of SIZES) for (const cls of CLASSES) {
      const p = pipeDims(NPS, cls);
      expect(p.t).toBeGreaterThanOrEqual((CLASS_PRESSURE[cls] * NPS) / (2 * 17500) + 1 / 16 - 1e-9);
      expect(p.t).toBeGreaterThanOrEqual(NPS / 40 + 1 / 16 - 1e-9);
      expect(p.D).toBeLessThan(p.OD); expect(p.OD).toBe(NPS);
    }
    expect(pipeDims(6, 'P600').t).toBeGreaterThanOrEqual(pipeDims(6, 'P150').t);
  });
});

describe('flanges (SW-FLG-*)', () => {
  it('bolt pattern, pitch, OD and thickness rules hold for every size and class', () => {
    for (const NPS of SIZES) for (const cls of CLASSES) {
      const f = designFlange(NPS, cls);
      expect(f.n % 4).toBe(0);
      const pitch = (Math.PI * f.BC) / f.n;
      expect(pitch).toBeGreaterThanOrEqual(3 * f.d - 1e-9); expect(pitch).toBeLessThanOrEqual(5 * f.d + 1e-9);
      expect(f.OD).toBeCloseTo(f.BC + 3 * f.d, 9);
      expect(f.tf).toBeGreaterThanOrEqual(f.d + 0.25 - 1e-9);
      expect(f.n * (90000 / 3) * (Math.PI / 4) * f.d * f.d).toBeGreaterThanOrEqual(f.W);
      expect(f.tf).toBeGreaterThanOrEqual(Math.sqrt(6 * (1.5 * f.n * (Math.PI / 4) * f.d * f.d * 30000 * (f.BC - f.G) / 2 / (Math.PI * f.G)) / (0.6 * 36000)) - 1e-9);
      expect(f.studLen).toBeGreaterThanOrEqual(2 * f.tf + f.gasketT);
      expect(f.W).toBe(Math.max(f.Wseat, f.Wop));
    }
    expect(designFlange(6, 'P600').tf).toBeGreaterThanOrEqual(designFlange(6, 'P150').tf);
    expect(designFlange(12, 'P300').OD).toBeGreaterThan(designFlange(6, 'P300').OD);
  });
  it('blind is at least as thick as the flange; meshes close; weights follow the solids', () => {
    for (const p of [makePipe('p', 6, 'P300', 60), makeFlange('f', 6, 'P300'), makeFlange('f', 12, 'P600'), makeBlindFlange('b', 6, 'P300'), makeStud('s', 0.75, 5)]) {
      const g = buildGeometry(p);
      for (const s of g.solids) { expect(isClosed(s.mesh), `${p.designation} ${s.name}`).toBe(true); expect(signedVolume(s.mesh)).toBeGreaterThan(0); }
      expect(Math.abs(g.volume * 490 / 1728 - p.weight.value) / p.weight.value).toBeLessThan(0.03);
    }
    expect(makeBlindFlange('b', 6, 'P300').dims.tb.value).toBeGreaterThanOrEqual(designFlange(6, 'P300').tf);
    expect(buildGeometry(makeGasket('g', 6, 'P300')).solids[0].role).toBe('polymer');
  });
});

describe('valves (SW-VLV-*)', () => {
  it('operator sizing keeps the effort within SW-VLV-4 (50 lbf lever, 80 lbf wheel)', () => {
    for (const T of [50, 300, 900, 3000, 20000]) for (const q of [true, false]) {
      const op = sizeOperator(T, q);
      expect(op.rimForce).toBeLessThanOrEqual((op.kind === 'lever' ? 50 : 80) + 1e-9);
      if (op.kind === 'handwheel') { expect(op.Dhw!).toBeLessThanOrEqual(30); expect(op.Dhw! % 2).toBe(0); }
      if (op.kind === 'lever') expect(op.lever!).toBeLessThanOrEqual(24);
    }
    expect(sizeOperator(20000, false).kind).toBe('gear');
  });
  it('rising stem: diameter ≥ 1/2 in and from thrust; thread pitch d/5', () => {
    const st = risingStem(20000);
    expect(st.ds).toBeGreaterThanOrEqual(Math.sqrt((4 * 20000) / (Math.PI * 0.25 * 60000)) - 1e-9);
    expect(st.p).toBeCloseTo(st.ds / 5, 9); expect(st.T).toBeGreaterThan(0);
  });
  it('offering matrix (SW-VLV-11): every type has sizes in every class it allows, and P·D² ≤ 1.8e6', () => {
    for (const t of VALVE_TYPES) {
      expect(offeredSizes(t.id, 'P150').length).toBeGreaterThan(0);
      for (const n of SIZE_SERIES) for (const c of CLASS_SERIES) if (isOffered(t.id, n, c)) expect(n * n * CLASS_PRESSURE[c]).toBeLessThanOrEqual(1800000);
    }
    expect(isOffered('BALL', 8, 'P150')).toBe(false); expect(isOffered('TBALL', 8, 'P150')).toBe(true);
    expect(isOffered('KNIFE', 6, 'P300')).toBe(false); expect(isOffered('NEEDLE', 0.5, 'P4800')).toBe(true);
    expect(() => makeValve('x', 'BALL', 8, 'P150')).toThrow();
  });
  const sample: [ValveType, number, PipeClass][] = [];
  for (const t of VALVE_TYPES) {
    for (const n of offeredSizes(t.id, 'P150')) sample.push([t.id, n, 'P150']);                 // every size at the lowest class
    const mid = offeredSizes(t.id, 'P150'); const n2 = mid[Math.floor(mid.length / 2)];
    for (const c of offeredClasses(t.id, n2)) if (c !== 'P150') sample.push([t.id, n2, c]);      // every class at a middle size
  }
  it(`sample covers ${sample.length} builds across all 18 types`, () => { expect(sample.length).toBeGreaterThan(150); });
  for (const [type, NPS, cls] of sample) {
    it(`${type}${NPS}-${cls}: rules hold, solids closed, rules audited`, () => {
      const v = makeValve('v', type, NPS, cls);
      const D = pipeDims(NPS, cls).D, f = designFlange(NPS, cls);
      expect(v.dims.D.value).toBeCloseTo(D, 9);
      if (['GATE', 'GLOBE', 'YGLOBE', 'CHECK', 'LCHECK', 'BALL', 'TBALL', 'PLUG', 'DIAPH', 'CONTROL'].includes(type)) expect(v.dims.F2F.value).toBeCloseTo(2 * f.tf + 2 * (f.hubLen + 1) + v.dims.wBody.value, 9);
      if (type === 'GATE') { expect(v.dims.stroke.value).toBeGreaterThanOrEqual(D); expect(v.dims.stemD.value).toBeGreaterThanOrEqual(D / 8 - 1e-9); }
      if (type === 'GLOBE' || type === 'YGLOBE') expect(v.dims.lift.value).toBeCloseTo(D / 4, 9);
      if (v.dims.rimForce) expect(v.dims.rimForce.value).toBeLessThanOrEqual((v.dims.operator.label === 'Lever length' ? 50 : v.dims.operator.label === 'T-bar length' ? 25 : 80) + 1e-9);
      const g = buildGeometry(v);
      expect(g.solids.length).toBeGreaterThan(5);
      for (const s of g.solids) { expect(isClosed(s.mesh), `${v.designation} ${s.name}`).toBe(true); expect(signedVolume(s.mesh), `${v.designation} ${s.name}`).toBeGreaterThan(0); }
      const steel = g.solids.filter(s => s.role !== 'polymer').reduce((a, s) => a + signedVolume(s.mesh), 0);
      expect(Math.abs(steel * 490 / 1728 - v.weight.value) / v.weight.value).toBeLessThan(1e-6);
      for (const id of ruleIdsOf(v.dims)) expect(definedRules.has(id), `rule ${id} missing`).toBe(true);
    });
  }
});
