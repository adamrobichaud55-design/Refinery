/** Plant 3, the coastal refinery: a line measured against itself (SW-RPI-22) and corrected on the result where it passes through itself
 *  (SW-RPI-23), with SW-RPI-19, SW-RPI-16 and SW-RPI-8 as amended the same day (DESIGN_BASIS.md §79). Nothing is routed here. The check runs
 *  on records of the lines an independent clash check audited, taken from the models it audited; the corrections run on records of the
 *  lines they correct and of every piece and nozzle near them, taken from the models before the corrections (tests/fixtures/ownline), with
 *  each unit's plant (its steel, equipment, platforms and rack) as unitPiping plans it. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ownClashes, ownClearance, elbowSpacing, shapesOf, selfCorrections, takeOffMoved, straightBetweenStacks, bareTurnAsOffset, offsetOverTakeOff, loopThroughLeg } from '../src/refinery/ownLine';
import { valvesThatStrike } from '../src/refinery/supports';
import { valveBoxFn, restFindings } from '../src/refinery/pipingReport';
import { unitPiping, block, type UnitPiping } from '../src/refinery/unitPiping';
import { partFromKey, solidBoxes, deriveWelds, type Comp, type LineRun, type NozzleRun, type PipingModel } from '../src/generator/piping';
import type { PlantDef } from '../src/generator/plant';
import * as K from '../src/generator/pipingCheck';
import { pipeDims, elbowRadius } from '../src/catalogue';
import { frameFromAxes } from '../src/geometry/transform';

type V3 = [number, number, number];
const fixture = <T>(name: string): T => JSON.parse(readFileSync(new URL(`./fixtures/ownline/${name}`, import.meta.url), 'utf8')) as T;
interface Audited { model: string; role: 'audited' | 'stack'; line: LineRun; nozzles: NozzleRun[]; depth: number }
interface Near { unit: number; whole: string[]; lines: LineRun[]; nozzles: NozzleRun[] }
const near = (u: number) => { const f = fixture<Near>(`unit-${u}.json`); return { ...f, m: { lines: f.lines, nozzles: f.nozzles, failures: [], stats: {}, cuts: [] } as unknown as PipingModel }; };
const seq = (no: string) => no.split('-').pop()!;
const lineOf = (m: PipingModel, s: string) => { const r = m.lines.find(l => seq(l.no) === s); expect(r, s).toBeDefined(); return r!; };
const nozzlesOf = (m: PipingModel) => new Map(m.nozzles.map(n => [n.id, n] as const));
const plans = new Map<number, UnitPiping>(), plan = (u: number) => { let up = plans.get(u); if (!up) plans.set(u, (up = unitPiping(u))); return up; };
const vb = valveBoxFn(), SLOW = 900_000;
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const unit = (a: V3): V3 => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const origin = (c: Comp): V3 => [c.T[12], c.T[13], c.T[14]];
const r1 = (v: number) => Math.round(v * 10) / 10 || 0;
/** the pieces a route laid (not those of the line's end stacks, nor an olet) */
const laid = (r: LineRun) => r.comps.filter(c => c.kind !== 'studs' && !/\/(A|B|L)\d+$|\/O[12]$/.test(c.tag));
const straights = (r: LineRun) => laid(r).filter(c => c.kind === 'pipe').map(c => r1(len(sub(c.b as V3, c.a as V3))));
/** an elbow's corner: its inlet end and its centre-to-end along its inlet direction (SW-FIT-1) */
const cornerOf = (c: Comp): V3 => { const R = elbowRadius(pipeDims(c.NPS, c.cls).OD), L = /\|45$/.test(c.key) ? R * Math.tan(Math.PI / 8) : R; return [c.a[0] + c.T[8] * L, c.a[1] + c.T[9] * L, c.a[2] + c.T[10] * L]; };
const perp = (w: V3): V3 => (Math.abs(w[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]);

/** a line corrected stands as the generator lays a line: its pieces joined end to end, every joint welded or bolted by its class, every straight 2 in or more and no two
 *  elbows back to back but a 45° pair (SW-RT-4, SW-RT-8), each pipe keyed by its length and framed from its start, each elbow keyed by its size, class and angle and
 *  framed from its inlet end, the bend's normal and its inlet direction, each tee about its centre; and it is clear of itself (SW-RPI-22) */
function asLaid(before: PipingModel, m: PipingModel, nos: string[]) {
  const lines = m.lines.filter(l => nos.includes(l.no)), mm = { ...m, lines } as PipingModel;
  const had = new Set(before.lines.flatMap(l => l.comps.map(c => JSON.stringify([c.tag, c.key, c.a, c.b, c.T]))));
  expect(K.checkContinuity(mm)).toEqual([]);
  expect(K.checkElbowsAndStraights(mm)).toEqual([]);
  // the joints of these lines; a tee's outlet is welded by the branch on it, which is checked where the branch is here
  expect(K.checkJoints({ ...mm, nozzles: [] }).filter(v => !/no butt joints/.test(v) && !(/ outlet has 0 weld records/.test(v) && !nos.some(no => v.includes(`/T:${no} `))))).toEqual([]);
  for (const r of lines) {
    const tags = r.comps.map(c => c.tag); expect(tags.filter((t, i) => tags.indexOf(t) !== i), `${r.no}: tags used twice`).toEqual([]);
    // each piece the correction laid or moved
    for (const c of r.comps.filter(q => !had.has(JSON.stringify([q.tag, q.key, q.a, q.b, q.T])))) {
      if (c.kind === 'pipe') { const L = len(sub(c.b as V3, c.a as V3)), w = unit(sub(c.b as V3, c.a as V3)); expect(c.key, c.tag).toBe(`PIPE|${c.NPS}|${c.cls}|${L.toFixed(3)}`); expect(L, c.tag).toBeGreaterThanOrEqual(2 - 1e-6); (frameFromAxes(c.a as V3, perp(w), w) as number[]).forEach((v, i) => expect(c.T[i], `${c.tag} frame`).toBeCloseTo(v, 6)); }
      if (c.kind === 'elbow') {
        expect(c.key, c.tag).toMatch(new RegExp(`^EL\\|${c.NPS}\\|${c.cls}\\|(90|45)$`));
        const z: V3 = [c.T[8], c.T[9], c.T[10]], bo = unit(sub(c.b as V3, cornerOf(c)));
        (frameFromAxes(c.a as V3, cross(z, bo), z) as number[]).forEach((v, i) => expect(c.T[i], `${c.tag} frame`).toBeCloseTo(v, 6));
      }
      if (c.kind === 'tee') origin(c).forEach((v, i) => expect(v, `${c.tag} centre`).toBeCloseTo((c.a[i] + c.b[i]) / 2, 6));
    }
    // each weld joins two pieces there are, at the joint between them
    const all = new Map([...m.lines.flatMap(l => l.comps), ...m.nozzles.flatMap(n => n.comps)].map(c => [c.tag, c] as const));
    for (const w of r.welds) { for (const t of w.joins) expect(all.has(t), `${w.id} joins ${t}`).toBe(true); }
    expect(ownClashes(r, nozzlesOf(m)), `${r.no} through itself`).toEqual([]);
  }
}
/** the lines a correction did not touch are as they were */
function others(before: PipingModel, after: PipingModel, touched: string[]) {
  const was = new Map(before.lines.map(l => [l.no, JSON.stringify(l)] as const));
  expect(after.lines.filter(l => !touched.includes(l.no) && JSON.stringify(l) !== was.get(l.no)).map(l => l.no)).toEqual([]);
}

describe('plant 3: pieces of one line clear of each other (SW-RPI-22)', () => {
  const recs = fixture<Audited[]>('audit-lines.json');
  it('finds each of the 32 lines the independent clash check found passing through themselves, on the models it audited', () => {
    const audited = recs.filter(x => x.role === 'audited');
    expect(audited.length).toBe(32);
    for (const x of audited) expect(ownClashes(x.line, new Map(x.nozzles.map(n => [n.id, n] as const))).length, `${x.model} ${x.line.no}`).toBeGreaterThan(0);
    // as deep as it measured them: a riser through its own handwheel; a spare's branch through its own first leg; a lead elbow into its own butterfly valve's lever
    const deepest = (s: string) => { const x = audited.find(q => seq(q.line.no) === s)!; return Math.max(...ownClashes(x.line, new Map(x.nozzles.map(n => [n.id, n] as const))).map(f => f.depth)); };
    expect(deepest('11323')).toBeCloseTo(13.57, 1); expect(deepest('12002')).toBeCloseTo(12.93, 1); expect(deepest('19301')).toBeCloseTo(9.29, 1);
    expect(deepest('11503')).toBeGreaterThan(0.05); expect(deepest('11503')).toBeLessThan(1); expect(deepest('17515')).toBeLessThan(1.2);
  }, SLOW);
  it('passes the valves, spades and gaskets of a stack or of a control station that stand face to face on one axis (SW-LL-3, SW-LL-7)', () => {
    const stack = recs.filter(x => x.role === 'stack');
    expect(stack.map(x => seq(x.line.no)).sort()).toEqual(['13505', '13506', '14007', '14505', '15501', '17402', '17501', '17551', '18707']);
    for (const x of stack) {
      expect(x.line.comps.filter(c => c.kind === 'valve').length, x.line.no).toBeGreaterThanOrEqual(1);
      expect(ownClashes(x.line, new Map(x.nozzles.map(n => [n.id, n] as const))), `${x.model} ${x.line.no}`).toEqual([]);
    }
  }, SLOW);
  it('says each finding as the generator\'s clearance checks say theirs, and holds each piece by its true shape', () => {
    const x = recs.find(q => seq(q.line.no) === '11323')!, m = { lines: [x.line], nozzles: x.nozzles, failures: [], stats: {}, cuts: [] } as unknown as PipingModel;
    const out = ownClearance(m); expect(out.length).toBeGreaterThan(0);
    for (const v of out) expect(v).toMatch(/^\S+ \S+ \(\w+\) – \S+ \(\w+\): \d+\.\d\d in$/);
    // a 90° elbow by the tube about its arc, a 45° one by its own two legs (SW-RPI-13), a valve by its part's solids, studs not at all
    const el = x.line.comps.find(c => c.kind === 'elbow')!; expect(shapesOf(el).map(s => s.k)).toEqual(['arc']);
    expect(shapesOf({ ...el, key: el.key.replace(/\|90$/, '|45') }).map(s => s.k)).toEqual(['cyl', 'cyl']);
    const v = x.line.comps.find(c => c.kind === 'valve')!; expect(shapesOf(v).length).toBe(solidBoxes(partFromKey(v.key)).length);
    expect(shapesOf({ ...v, kind: 'studs' })).toEqual([]);
  }, SLOW);
});

describe('plant 3: a line through itself, corrected on the result (SW-RPI-23)', () => {
  it('(a) gates on one elbow spacing: two elbow radii and 2 in on the 6 in grid', () => {
    expect([6, 8, 10, 12, 14].map(n => elbowSpacing(n, 'P150'))).toEqual([24, 30, 36, 42, 54]);
    for (const n of [6, 8, 10, 12, 14, 16, 36]) { const k = elbowSpacing(n, 'P150'); expect(k % 6).toBe(0); expect(k).toBeGreaterThanOrEqual(2 * elbowRadius(pipeDims(n, 'P150').OD) + 2); expect(k - 6).toBeLessThan(2 * elbowRadius(pipeDims(n, 'P150').OD) + 2); }
  });
  it('acts on no line SW-RPI-22 does not report', () => {
    const f = near(13), m = { ...f.m, lines: f.m.lines.filter(l => seq(l.no) === '13036') }, was = JSON.stringify(m.lines);
    expect(ownClashes(m.lines[0], nozzlesOf(m))).toEqual([]);
    expect(selfCorrections(m, plan(13), vb)).toEqual([]); expect(JSON.stringify(m.lines)).toBe(was);
    // nor (a) on a line it is given that is clear of itself, though named
    expect(takeOffMoved(m, plan(13), vb, new Set(m.lines.map(l => l.no)))).toEqual([]); expect(JSON.stringify(m.lines)).toBe(was);
  }, SLOW);
  it('(a) 11323: the spare\'s suction tee raised 12 in on the first pump\'s drop, and the branch out 55.0 in and down 7.3 in into its stack', () => {
    const f = near(11), before = structuredClone(f.m), m = f.m, r = lineOf(m, '11323'), parent = r.to.startsWith('tap ') ? r.to.slice(4) : r.from.slice(4);
    expect(ownClashes(r, nozzlesOf(m)).length).toBeGreaterThan(0);
    const notes = takeOffMoved(m, plan(11), vb, new Set([r.no]));
    expect(notes.length).toBe(1); expect(notes[0]).toMatch(/moved 12 in along .* \(y 66\.0 to 78\.0\).*\(SW-RPI-23 \(a\)\)$/);
    const now = lineOf(m, '11323'), tee = m.lines.find(l => l.no === parent)!.comps.find(c => c.tag === `${parent}/T:${r.no}`)!;
    expect(origin(tee)[1]).toBeCloseTo(78, 6);
    expect(now.path.map(p => [r1(p[0]), r1(p[1])])).toEqual([[714, 78], [762, 78], [762, 24]]);
    expect(straights(now)).toEqual([55, 7.3, 4.3]); expect(laid(now).filter(c => c.kind === 'elbow').length).toBe(2);
    asLaid(before, m, [r.no, parent]); others(before, m, [r.no, parent]);
  }, SLOW);
  it('(a) 13315: its tee raised 6 in, the branch 1680,54 | 1680,24', () => {
    const f = near(13), before = structuredClone(f.m), m = f.m, r = lineOf(m, '13315'), parent = (r.to.startsWith('tap ') ? r.to : r.from).slice(4);
    const notes = takeOffMoved(m, plan(13), vb, new Set([r.no]));
    expect(notes.length).toBe(1); expect(notes[0]).toMatch(/moved 6 in along .* \(y 48\.0 to 54\.0\)/);
    const now = lineOf(m, '13315'); expect(now.path.map(p => [r1(p[0]), r1(p[1])])).toEqual([[1680, 54], [1680, 24]]);
    expect(straights(now)).toEqual([4, 3.3, 7.6]);
    asLaid(before, m, [r.no, parent]); others(before, m, [r.no, parent]);
  }, SLOW);
  it('(a) 17302: the spare\'s discharge tee moved 6 in along the first pump\'s discharge, the branch up, along and into it with straights 13.4, 4.0 and 15.0 in', () => {
    const f = near(17), before = structuredClone(f.m), m = f.m, r = lineOf(m, '17302'), parent = (r.to.startsWith('tap ') ? r.to : r.from).slice(4);
    const notes = takeOffMoved(m, plan(17), vb, new Set([r.no]));
    expect(notes.length).toBe(1); expect(notes[0]).toMatch(/moved 6 in along .* \(z -276\.0 to -270\.0\)/);
    const now = lineOf(m, '17302'), tee = m.lines.find(l => l.no === parent)!.comps.find(c => c.tag === `${parent}/T:${r.no}`)!;
    expect(origin(tee)[2]).toBeCloseTo(-270, 6); expect(straights(now)).toEqual([13.4, 4, 15]);
    asLaid(before, m, [r.no, parent]); others(before, m, [r.no, parent]);
  }, SLOW);
  it('(b) 12307: the spare\'s discharge under the tee on the first pump\'s discharge laid as one straight pipe of 24.6 in', () => {
    const f = near(12), before = structuredClone(f.m), m = f.m, r = lineOf(m, '12307'), was = laid(r).length;
    const notes = straightBetweenStacks(m, plan(12), vb, new Set([r.no]));
    expect(notes.length).toBe(1); expect(notes[0]).toMatch(/the 9 pieces between them \(4 elbows\) laid as one straight pipe of 24\.6 in/);
    const now = lineOf(m, '12307'), p = laid(now); expect(was).toBe(9);
    expect(p.length).toBe(1); expect(p[0].kind).toBe('pipe'); expect(p[0].a.map(r1)).toEqual([624, 94.8, -258]); expect(p[0].b.map(r1)).toEqual([624, 119.3, -258]);
    expect(len(sub(p[0].b as V3, p[0].a as V3))).toBeCloseTo(24.57, 2);
    asLaid(before, m, [r.no]); others(before, m, [r.no]);
  }, SLOW);
  it('(c) 12002: the vacuum column\'s 36 in feed, arriving 8 ft below its bare nozzle, laid as a 45° offset with corners at z -324 and -420', () => {
    const f = near(12), before = structuredClone(f.m), m = f.m, r = lineOf(m, '12002');
    expect(plan(12).lines.find(l => l.def.no === r.no)!.bare).toContain('to');   // SW-RPI-14: the connection is left without its valve
    const notes = bareTurnAsOffset(m, plan(12), vb, new Set([r.no]));
    expect(notes.length).toBe(1); expect(notes[0]).toMatch(/laid as a 45° offset from \(600,408,-282\): corners \(600,408,-324\) and \(600,504,-420\), straights 17\.1, 86\.1, 18\.8 in; 9 pieces replaced by 5/);
    const now = lineOf(m, '12002'), e45 = laid(now).filter(c => c.kind === 'elbow' && /\|45$/.test(c.key));
    expect(e45.map(c => cornerOf(c).map(r1))).toEqual([[600, 408, -324], [600, 504, -420]]);
    expect(straights(now).slice(-3)).toEqual([17.1, 86.1, 18.8]);
    // within the plan area of the pieces it replaced, none lower than they
    for (const c of laid(now).slice(-5)) { expect(Math.min(c.a[1], c.b[1])).toBeGreaterThanOrEqual(408 - 1e-6); expect(c.a[0]).toBeCloseTo(600, 6); }
    asLaid(before, m, [r.no]); others(before, m, [r.no]);
  }, SLOW);
  it('(d) 19002: the 45° offset over the spare\'s tee laid as the generator routed it, two 90° elbows at (912,96,-270) and (912,24,-270), 18.0 in of pipe to the tee', () => {
    const f = near(19), before = structuredClone(f.m), m = f.m, r = lineOf(m, '19002');
    const notes = offsetOverTakeOff(m, plan(19), vb, new Set([r.no]));
    expect(notes.length).toBe(1); expect(notes[0]).toMatch(/ran 6\.3 in past the take-off .*T:12"-P150-P-19302; the corner laid as the generator routed it, two 90° elbows at \(912,96,-270\) and \(912,24,-270\), the pipes .*\/p16 lengthened by 24\.3 in to 322\.1 in, 32\.0 in, .*\/p20 lengthened by 11\.7 in to 18\.0 in/);
    const now = lineOf(m, '19002'), els = laid(now).filter(c => c.kind === 'elbow');
    expect(els.some(c => /\|45$/.test(c.key))).toBe(false);
    for (const at of [[912, 96, -270], [912, 24, -270]]) expect(els.filter(c => cornerOf(c).map(r1).join() === at.join()).length, at.join()).toBe(1);
    const i = now.comps.findIndex(c => c.tag === `${r.no}/T:12"-P150-P-19302`), p = now.comps.slice(0, i).reverse().find(c => c.kind !== 'studs')!;
    expect(p.kind).toBe('pipe'); expect(len(sub(p.b as V3, p.a as V3))).toBeCloseTo(18, 3);
    asLaid(before, m, [r.no]); others(before, m, [r.no]);
  }, SLOW);
});

describe('plant 3: a loop through its own leg (SW-RPI-23 (e))', () => {
  // a 6 in line laid as the generator lays a route through its corners, its first point beyond its start a corner (it turns there, as it does one elbow radius beyond a stack),
  // in an open plant: from its start up z to that corner, out x 100 in, z 60 in, back x 50 in and down z 120 in through its own first leg, then on x 150 in
  const S: V3 = [0, 100, -30], C: V3[] = [[0, 100, 0], [100, 100, 0], [100, 100, 60], [50, 100, 60], [50, 100, -60]], E: V3 = [200, 100, -60], NO = '6"-P150-P-99001';
  const routed = (pts: V3[]): Comp[] => {
    const R = elbowRadius(pipeDims(6, 'P150').OD), out: Comp[] = [], pipe = (a: V3, b: V3) => { const w = unit(sub(b, a)); out.push({ tag: `${NO}/p${out.length + 1}`, kind: 'pipe', key: `PIPE|6|P150|${len(sub(b, a)).toFixed(3)}`, T: frameFromAxes(a, perp(w), w) as Comp['T'], a, b, NPS: 6, cls: 'P150', e1: 'BW', e2: 'BW' }); };
    let cur = pts[0];
    for (let i = 1; i + 1 < pts.length; i++) {
      const a = unit(sub(pts[i], pts[i - 1])), b = unit(sub(pts[i + 1], pts[i])), ein: V3 = [pts[i][0] - a[0] * R, pts[i][1] - a[1] * R, pts[i][2] - a[2] * R], eout: V3 = [pts[i][0] + b[0] * R, pts[i][1] + b[1] * R, pts[i][2] + b[2] * R];
      pipe(cur, ein); out.push({ tag: `${NO}/el${out.length + 1}`, kind: 'elbow', key: 'EL|6|P150|90', T: frameFromAxes(ein, cross(a, b), a) as Comp['T'], a: ein, b: eout, NPS: 6, cls: 'P150', e1: 'BW', e2: 'BW' }); cur = eout;
    }
    pipe(cur, pts[pts.length - 1]); return out;
  };
  const open = { plant: { building: () => ({ instances: [] }), interior: () => ({ instances: [] }), rack: { x0: 0, x1: 0, halfWidth: 0, bentSpacing: 240, tiers: [] }, verticalThroughPlatforms: true } as unknown as PlantDef, lines: [] } as unknown as UnitPiping;
  const lineAt = (extra: Partial<LineRun> = {}) => { const comps = routed([S, ...C, E]); return { no: NO, service: 'P', NPS: 6, cls: 'P150', kind: 'routed', from: 'X-1-N1', to: 'X-2-N1', comps, welds: deriveWelds(NO, comps, [], []), supports: [], path: [...C, [150, 100, -60]], ok: true, joint: 'BW', ...extra } as LineRun; };
  it('takes the loop out and turns the line at the crossing, its legs as its pieces lie, every piece square to the plant\'s axes', () => {
    const r = lineAt(), m = { lines: [r], nozzles: [], failures: [], stats: {}, cuts: [] } as unknown as PipingModel, before = structuredClone(m);
    expect(ownClashes(r, new Map()).length).toBeGreaterThan(0);
    const notes = loopThroughLeg(m, open, vb, new Set([NO]));
    expect(notes).toEqual([`${NO}: its route crossed its own leg; the 3 corners of the loop taken out, the line turning at 50, 100, 0 (SW-RPI-23 (e))`]);
    const now = m.lines[0];
    expect(now.comps.filter(c => c.kind === 'elbow').map(c => cornerOf(c).map(r1))).toEqual([[0, 100, 0], [50, 100, 0], [50, 100, -60]]);
    for (const c of now.comps.filter(q => q.kind === 'pipe')) expect([0, 1, 2].filter(k => Math.abs(c.a[k] - c.b[k]) > 1e-6).length, `${c.tag} square to the axes`).toBe(1);
    expect(now.path.map(p => p.map(r1))).toEqual([[0, 100, 0], [50, 100, 0], [50, 100, -60], [150, 100, -60]]);
    asLaid(before, m, [NO]);
  });
  it('leaves a line whose loop carries a branch\'s olet, the run under the olet being taken out', () => {
    const r = lineAt(), m = { lines: [r], nozzles: [], failures: [], stats: {}, cuts: [] } as unknown as PipingModel;
    const at: V3 = [100, 100, 30], olet = { tag: '2"-P150-P-99002/O1', kind: 'olet', key: 'OLET|6|2|P150|SW', T: frameFromAxes(at, [1, 0, 0], [0, 0, 1]) as Comp['T'], a: at, b: [104, 100, 30], NPS: 2, cls: 'P150', onRun: NO } as Comp;
    m.lines.push({ no: '2"-P150-P-99002', comps: [olet], welds: [], supports: [], path: [], ok: true, kind: 'routed', from: `tap ${NO}`, to: 'X-3-N1', NPS: 2, cls: 'P150', joint: 'SW' } as unknown as LineRun);
    const was = JSON.stringify(r), notes = loopThroughLeg(m, open, vb, new Set([NO]));
    expect(notes.length).toBe(1); expect(notes[0]).toMatch(/leave the olet 2"-P150-P-99002\/O1 off its run \(SW-RPI-23 \(e\)\)$/); expect(JSON.stringify(m.lines[0])).toBe(was);
  });
});

describe('plant 3: valves that strike their own line (SW-RPI-19 as amended again), a last run made again (SW-RPI-16), a root spool\'s lane (SW-RPI-8)', () => {
  it('turns the three butterfly valves whose levers their own first elbows strike on the inside of the bend to +x', () => {
    for (const [u, turned] of [[11, ['11503/A4']], [17, ['17515/A3', '17516/B3']]] as const) {
      const f = near(u), m = f.m, vt = valvesThatStrike(m, plan(u).plant, vb);
      for (const t of turned) { const [s, piece] = t.split('/'), r = lineOf(m, s); expect(vt.turned.find(x => x.startsWith(`${r.no}/${piece}:`)), t).toMatch(/struck its own line .*; stem turned to 1,0,0$/); }
      expect(vt.turned.filter(x => /stem turned to 0,-1,0$/.test(x))).toEqual([]);
      for (const r of m.lines) for (const c of r.comps) if (c.kind === 'valve') expect(c.T[5], `${c.tag} stem down`).toBeGreaterThan(-0.99);
    }
  }, SLOW);
  it('never turns a stem down (SW-LL-5): a valve struck above and closed on both sides is left and listed', () => {
    const f = near(13), v = f.lines.flatMap(l => l.comps).find(c => c.kind === 'valve' && c.key.startsWith('VLV|GATE|') && Math.abs(c.b[1] - c.a[1]) < 1e-6 && c.T[5] > 0.999)!;
    expect(v).toBeDefined();
    const T = v.T as number[], at: V3 = [T[12], T[13], T[14]], pts = solidBoxes(partFromKey(v.key)).flatMap(b => [b[0], b[1]].flatMap(x => [b[0], b[1]].map(y => [x[0], y[1], x[2]] as V3)));
    const world = pts.map(p => [0, 1, 2].map(k => T[k] * p[0] + T[4 + k] * p[1] + T[8 + k] * p[2] + T[12 + k]) as V3), lo = [0, 1, 2].map(k => Math.min(...world.map(p => p[k]))), hi = [0, 1, 2].map(k => Math.max(...world.map(p => p[k])));
    const reach = hi[1] - at[1], along = Math.abs(v.b[0] - v.a[0]) > 1e-6 ? 0 : 2, side = 2 - along, wall = (mn: V3, mx: V3) => ({ ...block(mn, mx, 'wall'), tags: ['wall'] });
    const box = (k: number, from: number, to: number): [V3, V3] => { const mn = [lo[0] - 12, at[1] - reach - 12, lo[2] - 12] as V3, mx = [hi[0] + 12, hi[1] + 12, hi[2] + 12] as V3; mn[side] = Math.min(mn[side], at[side] - reach - 12); mx[side] = Math.max(mx[side], at[side] + reach + 12); mn[k] = from; mx[k] = to; return [mn, mx]; };
    const walls = [box(1, hi[1] - 2, hi[1] + 10), box(side, at[side] + reach - 2, at[side] + reach + 10), box(side, at[side] - reach - 10, at[side] - reach + 2)].map(([a, b]) => wall(a, b));
    const plant = { building: () => ({ instances: [] }), interior: () => ({ instances: walls }) } as unknown as PlantDef;
    const line = { no: '6"-P150-P-99999', comps: [{ ...v, tag: '6"-P150-P-99999/A1' }], welds: [], supports: [], path: [], ok: true, from: '', to: '', kind: 'routed' } as unknown as LineRun;
    const m = { lines: [line], nozzles: [], failures: [], stats: {}, cuts: [] } as unknown as PipingModel, was = [...line.comps[0].T];
    const vt = valvesThatStrike(m, plant, vb);
    expect(vt.turned).toEqual([]); expect(vt.stuck.length).toBe(1); expect(vt.stuck[0]).toMatch(/^6"-P150-P-99999\/A1: strikes wall and has no clear direction$/);
    expect([...line.comps[0].T]).toEqual(was);
  }, SLOW);
  it('makes the hydrotreater\'s last run again for the spare\'s suction through its own gate\'s body, not for a stem or lever its line strikes', () => {
    const f = near(19), whole = { ...f.m, lines: f.m.lines.filter(l => f.whole.includes(l.no)) } as PipingModel, own = restFindings({ lines: [] }, whole, vb).own;
    expect(own.map(o => seq(o.line))).toEqual(['19301']); expect(own[0].what).toEqual(['the body of its own valve B9']);
    expect(own[0].solids.length).toBe(3); for (const s of own[0].solids) expect(s.equip).toBe('P-1901B');
    for (const u of [11, 17]) { const g = near(u); expect(restFindings({ lines: [] }, { ...g.m, lines: g.m.lines.filter(l => g.whole.includes(l.no)) } as PipingModel, vb).own).toEqual([]); }
  }, SLOW);
  it('stands the hydrotreater\'s 10 in root spool on its parent\'s tier 36 in from the parent\'s lane, at z -54', () => {
    const up = plan(19), rs = up.roots.find(r => r.tag === 'RS-1906')!, lane = (s: string) => up.foreseen.find(L => L.no !== undefined && seq(L.no) === s)!;
    expect(rs.at).toEqual([1680, 204, -54]); expect(seq(rs.line)).toBe('19022'); expect(seq(rs.parent)).toBe('19021');
    expect(lane('19022').t).toBe(lane('19021').t); expect(lane('19022').z).toBe(-54); expect(Math.abs(lane('19022').z - lane('19021').z)).toBeGreaterThanOrEqual(36);
  }, SLOW);
});
