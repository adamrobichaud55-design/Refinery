/**
 * Stage 9 (DESIGN_BASIS.md §59–64): the new catalogue parts, plant 2's model and coverage, and the erection drawings.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { makeSmallElbow, makeSmallTee, makeCoupling, makeOlet, makeSwage, makeNipple, makePlug, makeSlipOnFlange, makeSocketWeldFlange, makeSpade, makeSpectacleBlind, makeFloorSleeve, makeWallSleeve, makeValve, makeHopper, smallBore, closeNippleLength, pipeDims } from '../src/catalogue';
import { buildGeometry } from '../src/geometry/partGeometry';
import { isClosed, signedVolume } from '../src/geometry/mesh';
import { setMaxCells } from '../src/geometry/sdf';
import { PLANT2 } from '../src/generator/plant2';
import { PLANT1 } from '../src/generator/plant';
import type { PipingModel } from '../src/generator/piping';
import { coverage, SYMBOL_CLASSES } from '../src/generator/coverage';
import { erectionDrawings, MEMBER } from '../src/drawings/erection';
import { parseFont } from '../src/pdf/ttf';
setMaxCells(36);

const root = new URL('../', import.meta.url);
const basis = readFileSync(new URL('DESIGN_BASIS.md', root), 'utf8');

describe('small-bore joints and fittings (SW-SWT-*, SW-FLG-10..13, SW-PEN-*)', () => {
  it('socket, thread and wall rules follow from the pipe of the size (SW-SWT-1/2)', () => {
    for (const NPS of [0.5, 0.75, 1, 1.5]) for (const cls of ['P150', 'P300'] as const) {
      const sb = smallBore(NPS, cls), p = pipeDims(NPS, cls);
      expect(sb.s).toBeGreaterThanOrEqual(Math.max(3 / 8, p.OD / 3) - 1e-9); expect(sb.tf).toBeGreaterThanOrEqual(Math.max(3 / 16, 1.5 * p.t) - 1e-9);
      expect(sb.leg * Math.SQRT1_2).toBeGreaterThanOrEqual(p.t - 0.07);                     // throat ≈ wall
      expect(sb.socketBore).toBeCloseTo(p.OD + 1 / 16, 9); expect(sb.Lt).toBeGreaterThanOrEqual(0.4 * p.OD - 1e-9);
    }
  });
  const parts = [
    makeSmallElbow('a', 0.75, 'P300', 90, 'SW'), makeSmallElbow('b', 1, 'P150', 45, 'TH'), makeSmallTee('c', 1, 'P300', 'SW'), makeSmallTee('c2', 1, 'P150', 'TH', 0.5),
    makeCoupling('d', 0.75, 'P150', 'TH'), makeCoupling('d2', 1.5, 'P300', 'SW'), makeOlet('e', 6, 0.75, 'P300', 'SW'), makeOlet('e2', 4, 1, 'P150', 'TH'), makeOlet('e3', 8, 2, 'P150', 'BW'),
    makeSwage('f', 1, 0.5, 'P150', 'TH', 'TH'), makeSwage('f2', 2, 0.75, 'P300', 'BW', 'SW'), makeNipple('g', 0.75, 'P150', closeNippleLength(0.75, 'P150'), 'TBE'), makeNipple('g2', 1, 'P300', 6, 'PBE'),
    makePlug('h', 0.5, 'P150'), makePlug('h2', 1, 'P150'), makePlug('h3', 0.75, 'P300', true), makeSlipOnFlange('i', 4, 'P150'), makeSocketWeldFlange('j', 1, 'P300'), makeSpade('k', 6, 'P300'), makeSpectacleBlind('l', 4, 'P150'),
    makeFloorSleeve('m', 3, 'P300'), makeWallSleeve('n', 6, 'P150'), makeValve('v1', 'GATE', 0.75, 'P300', 'SW'), makeValve('v2', 'BALL', 1, 'P150', 'SW'), makeValve('v3', 'GATE', 1, 'P150', 'TH'),
    makeValve('v6', 'TWAY', 2, 'P300'), makeValve('v7', 'TWAY', 1, 'P300', 'SW'), makeValve('v8', 'FWAY', 2, 'P150'), makeValve('v10', 'ROTARY', 6, 'P150'), makeHopper({ tag: 'H', D: 48, H: 72, outletNPS: 4, legH: 108 }),
  ];
  for (const p of parts) it(`${p.designation}: closed solids, positive volume, rules audited`, () => {
    const g = buildGeometry(p); expect(g.solids.length).toBeGreaterThan(0);
    for (const s of g.solids) { expect(isClosed(s.mesh), s.name).toBe(true); expect(signedVolume(s.mesh), s.name).toBeGreaterThan(0); }
    for (const d of Object.values(p.dims)) if (d.basis.kind === 'rule') expect(basis.includes('`' + d.basis.id + '`') || /^(SW-VLV-)?[A-Z0-9]{1,3}-\d/.test(d.basis.id), d.basis.id).toBe(true);
  });
  it('a plugged threaded gate valve and a three-piece ball valve are the forged forms (SW-SWT-10/11)', () => {
    expect(makeValve('x', 'GATE', 1, 'P150', 'TH').dims.F2F.value).toBeGreaterThan(makeValve('y', 'GATE', 1, 'P150').dims.wBody.value);
    expect(makeValve('z', 'BALL', 1, 'P150', 'SW').notes.some(n => /three-piece/i.test(n))).toBe(true);
    expect(() => makeValve('w', 'GATE', 2, 'P150', 'SW')).toThrow();
  });
});

describe('plant 2 (SW-PLANT-*, SW-COV-*)', () => {
  const p = new URL('public/plants/P2/plant-piping.json', root), have = existsSync(p);
  const m = have ? (JSON.parse(readFileSync(p, 'utf8')) as PipingModel) : null;
  it('its definition builds: building, interior, nozzles and lines', () => {
    expect(PLANT2.building().instances.length).toBeGreaterThan(1000); expect(PLANT2.interior().equipment.length).toBeGreaterThan(30);
    const nz = PLANT2.nozzles(), ls = PLANT2.lines(); expect(ls.length).toBeGreaterThan(300);
    for (const l of ls) for (const e of [l.from, l.to]) if (e.k === 'nozzle') expect(nz.has(e.id), e.id).toBe(true);
    expect(new Set(ls.map(l => l.no)).size).toBe(ls.length);
    expect(PLANT1.lines().every(l => !ls.some(x => x.no === l.no))).toBe(true);                 // SW-PLANT-3: no line number shared with plant 1
  });
  it('the committed plant-2 piping exists and every line is routed or placed', () => {
    expect(have).toBe(true); if (!m) return;
    expect(m.plant).toBe('P2'); expect(m.lines.length).toBeGreaterThan(300); expect(m.failures).toEqual([]);
  });
  it('every symbol class of the owner\'s set appears at least 20 times on 4 lines and 2 sizes (SW-COV-2)', () => {
    if (!m) return;
    const c = coverage(m);
    expect(SYMBOL_CLASSES.length).toBe(52);
    expect(c.short.map(s => `${s.cls}: ${s.count} on ${s.lines} lines, ${s.sizes} sizes`)).toEqual([]);
  });
  it('socket welds, threaded joints and sleeves are recorded (SW-SWT-1/2, SW-PEN-1/2)', () => {
    if (!m) return;
    expect(m.lines.flatMap(l => l.welds).filter(w => w.type === 'SW').length).toBeGreaterThan(100);
    expect(m.lines.flatMap(l => l.pens ?? []).length).toBeGreaterThan(40); expect((m.cuts ?? []).length).toBeGreaterThan(20);
    for (const l of m.lines) for (const c of l.comps) if (c.kind === 'pipe' && c.e1 === 'SP') expect(c.ins).toBeDefined();
  });
});

describe('structural erection drawings (SW-ERD-*)', () => {
  const font = parseFont(new Uint8Array(readFileSync(new URL('assets/fonts/DejaVuSans.ttf', root))));
  it('plant 1: every sheet of SW-ERD-1, every member drawn whole on a framing sheet, deterministic output', () => {
    const a = erectionDrawings(PLANT1, font), b = erectionDrawings(PLANT1, font);
    expect(a.sheets.length).toBeGreaterThanOrEqual(12);
    for (const t of ['anchor-bolt plan', 'column schedule', 'roof framing plan', 'sidewall framing elevation', 'end wall framing elevation', 'typical frame elevation', 'pipe rack framing plan', 'bent elevation', 'member schedule', 'weld schedule', 'bolt and anchor rod schedule']) expect(a.sheets.some(s => s.title.includes(t)), t).toBe(true);
    const members = a.all.filter(p => MEMBER.has(p.part.kind));
    const missing = members.filter(p => !a.drawn.has(p)); expect(missing.length, missing.slice(0, 5).map(p => p.tags.join('/') + ' ' + p.part.designation).join('; ')).toBe(0);
    expect(a.welds.length).toBeGreaterThan(5); expect(a.bolts.length).toBeGreaterThan(5);
    const h = (d: Uint8Array) => createHash('sha256').update(d).digest('hex');
    expect(h(a.doc.save())).toBe(h(b.doc.save()));
  }, 120_000);
  it('every SW-ERD rule ID used in code is written in DESIGN_BASIS.md', () => {
    for (const f of ['src/drawings/erection.ts', 'tools/erection.ts', 'tests/stage9.test.ts']) for (const id of new Set(readFileSync(new URL(f, root), 'utf8').match(/SW-ERD-\d+/g) ?? [])) expect(basis.includes('`' + id + '`'), `${id} in ${f}`).toBe(true);
  });
});
