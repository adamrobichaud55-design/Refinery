/** Plant 3, the coastal refinery: the main pipeway (DESIGN_BASIS.md §80). What the generator of plants 1 and 2 is given for
 *  it — the rack, the units' spools as connections, a line for every stream between units — follows the process model and the
 *  rules; and the piped pipeway on disk is whole: every line routed, continuous, jointed by its class, clear of every other
 *  and of the steel. Generating it takes a quarter of an hour, so the saved model is checked rather than made again here
 *  (tools/refinery-pipeway.ts makes it). */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { pipeway, PWY, PIPED, mainY, turnHeight, pipewayToSite } from '../src/refinery/pipeway';
import { pipewayDocument, mainLaneOf, asUnit, PIPEWAY_IMAGES, type PipedPipeway } from '../src/refinery/pipewayReport';
import { unitChecks } from '../src/refinery/pipingReport';
import { pipewayRegister, serializeRegister } from '../src/refinery/pipingRegister';
import { unitPiping, laneSpacing, STRINGER } from '../src/refinery/unitPiping';
import { processModel } from '../src/refinery/process';
import { sizing, transferLine, limits } from '../src/refinery/sizing';
import { cells, cellToSite } from '../src/refinery/assemble';
import { PLOTS, PIPEWAYS, PIPEWAY_Z, PIPEWAY_HALF, bench } from '../src/refinery/site';
import { RACK } from '../src/refinery/cell';
import { designFlange, pipeDims } from '../src/catalogue';
import type { PipingModel } from '../src/generator/piping';

const M = processModel(), Z = sizing(), pw = pipeway(), L = PWY.bays * PWY.bent;
const basisDoc = readFileSync(new URL('../DESIGN_BASIS.md', import.meta.url), 'utf8');
const dir = new URL('../public/refinery/piping/', import.meta.url);
const onBench = (u: number) => u >= 11 && u <= 19;

describe('plant 3: one pressure class at every battery limit (SW-PRC-2, SW-RPI-9)', () => {
  it('a stream\'s line and every unit line that meets it without a control valve station are of one design pressure, temperature and class', () => {
    let met = 0;
    for (const t of M.transfers) {
      const S = transferLine(t.key);
      for (const sh of M.sheets) sh.lines.forEach((l, i) => {
        for (const [e, sending] of [[l.from, false], [l.to, true]] as const) if (e.k === 'bl' && e.name === t.key && !(sending && l.cv)) { const z = Z.get(sh.no)!.lines[i]; met++; expect(z.designP, `${t.key}, unit ${sh.no}`).toBe(S.designP); expect(z.designT, `${t.key}, unit ${sh.no}`).toBe(S.designT); expect(z.cls, `${t.key}, unit ${sh.no}`).toBe(S.cls); }
      });
    }
    expect(met).toBeGreaterThan(60);
  });
  it('a pump\'s blocked-in pressure is carried across a limit: the vacuum gas oil pumparound through the crude unit\'s exchanger and back', () => {
    const supply = transferLine('vacuum gas oil pumparound supply'), back = transferLine('vacuum gas oil pumparound return'), z11 = Z.get(11)!, sh11 = M.sheet(11);
    expect(back.designP).toBe(supply.designP); expect(back.cls).toBe(supply.cls);
    const into = sh11.lines.findIndex(l => l.from.k === 'bl' && l.from.name === 'vacuum gas oil pumparound supply'), out = sh11.lines.findIndex(l => l.to.k === 'bl' && l.to.name === 'vacuum gas oil pumparound return');
    expect(z11.lines[into].pump).toBe('P-1202'); expect(z11.lines[out].pump).toBe('P-1202'); expect(z11.lines[out].designP).toBe(supply.designP);
    expect(z11.equip.get('E-1108')!.sides.shell.designP).toBe(supply.designP);                               // the exchanger's side on the way
  });
  it('no sending unit\'s line is raised by a pressure from beyond its limit: what a stream\'s line is designed for comes from its senders, or from its receivers\' own conditions', () => {
    const lim = limits();
    for (const sh of M.sheets) sh.lines.forEach((l, i) => {
      if (l.to.k !== 'bl' || l.cv) return;
      const z = Z.get(sh.no)!.lines[i], floor = lim.get(sh.no)!.least.get(i)!;
      // the stream's pressure is this line's own, or the line is one of several that send it and another governs: none does so by a pump beyond the limit
      if (z.designP === floor.P && z.stream === l.to.name) throw new Error(`unit ${sh.no}, line ${i + 1} to "${l.to.name}": raised to ${floor.P} psi from beyond its limit`);
    });
  });
  it('every spool at a limit is of its stream\'s class, in every piped unit', () => {
    for (const u of PIPED) for (const sp of unitPiping(u).spools) { const t = M.transfers.find(q => q.key === sp.stream); if (t) expect(sp.cls, `${sp.tag} ${sp.stream}`).toBe(transferLine(t.key).cls); }
  });
});

describe('plant 3: what the generator is given for the main pipeway (SW-PWY-1 to SW-PWY-9)', () => {
  it('the rack runs down the corridor on the site\'s plan, a whole number of bays, its first and last bays kept as limit bays', () => {
    const main = PIPEWAYS.find(p => p.id === 'main')!;
    expect(main.pts[0]).toEqual([PWY.west, PIPEWAY_Z]); expect(main.pts[1]).toEqual([PWY.west + L / 12, PIPEWAY_Z]); expect(main.width).toBe((2 * PWY.half) / 12);
    expect(PWY.half / 12).toBeLessThan(PIPEWAY_HALF); expect(pw.rack.x0).toBe(PWY.bent); expect(pw.rack.x1).toBe(L - PWY.bent); expect(pw.rack.tiers).toEqual(PWY.tiers);
    const first = Math.min(...PLOTS.filter(p => p.kind === 'unit' && onBench(p.unit)).map(p => p.x0)); expect(first - PWY.west).toBe(15);
    expect(pipewayToSite()[12]).toBe(PWY.west * 12); expect(pipewayToSite()[14]).toBe(PIPEWAY_Z * 12); expect(pipewayToSite()[13]).toBe(bench('process').el * 12);
    // tiers above the units' tiers: 4 ft, 4 ft and 5 ft
    expect(PWY.tiers.map((t, i) => t - RACK.tiers[i])).toEqual([48, 48, 60]);
  });
  it('every unit stands on the pipeway\'s 6 in grid, its limit at the corridor\'s edge', () => {
    for (const { plot: p, cell } of cells().filter(c => c.plot.kind === 'unit' && onBench(c.plot.unit))) {
      const T = cellToSite(p, cell), o = [T[12] - PWY.west * 12, T[14] - PIPEWAY_Z * 12];
      expect(Math.abs(o[0] / 6 - Math.round(o[0] / 6)), `unit ${p.unit}`).toBeLessThan(1e-9); expect(Math.abs(Math.abs(o[1]) - PIPEWAY_HALF * 12)).toBeLessThan(1e-9);
      const u = pw.units.find(q => q.unit === p.unit)!; expect(u.x).toBeCloseTo(o[0], 6); expect(u.side).toBe(o[1] > 0 ? 1 : -1); expect(u.piped).toBe(PIPED.includes(p.unit));
    }
  });
  it('every stream with a party on the process bench has its line; the others are named with the reason', () => {
    for (const t of M.transfers) {
      const parties = [...new Set([...t.from, ...t.to].map(p => p.unit))], s = pw.streams.find(q => q.stream === t.key), skip = pw.skipped.find(q => q.stream === t.key);
      expect(!!s !== !!skip, t.key).toBe(true);
      if (!parties.some(onBench)) { expect(skip, t.key).toBeDefined(); continue; }
      if (!s) { expect(skip!.why, t.key).toMatch(/another plot/); continue; }
      const S = transferLine(t.key); expect(s.NPS).toBe(S.NPS); expect(s.cls).toBe(S.cls); expect(s.designP).toBe(S.designP); expect(s.designT).toBe(S.designT);
      // a party on the bench for each unit of the bench that sends or receives it; beyond the bench only those that exchange with the bench
      for (const u of parties.filter(onBench)) expect(s.parties.some(p => p.party === `unit ${u}`), `${t.key}: unit ${u}`).toBe(true);
      expect(s.parties.filter(p => p.role === 'end').length).toBe(2); expect(s.branches.length).toBe(s.parties.length - 2);
    }
    for (const h of M.headers) expect(pw.skipped.some(q => q.stream === h.key && /utility header/.test(q.why)), h.key).toBe(true);
    expect(pw.streams.length).toBeGreaterThanOrEqual(40);
  });
  it('a stream\'s line runs between its two parties furthest apart; each other party is a branch of its own spool\'s size with a tee', () => {
    for (const s of pw.streams) {
      const cs = pw.conns.filter(c => c.stream === s.stream), xs = cs.map(c => c.x), main = pw.lines.find(l => l.def.no === s.main)!;
      const ends = [main.def.from, main.def.to].map(e => cs.find(c => e.k === 'nozzle' && c.nozzle === e.id)!); expect(ends.every(Boolean), s.stream).toBe(true);
      expect(Math.abs(ends[0].x - ends[1].x)).toBeCloseTo(Math.max(...xs) - Math.min(...xs), 6);
      expect(main.def.NPS).toBe(s.NPS); expect(main.def.cls).toBe(s.cls); expect(main.bare).toEqual(['from', 'to']);
      for (const no of s.branches) {
        const b = pw.lines.find(l => l.def.no === no)!, nz = [b.def.from, b.def.to].find(e => e.k === 'nozzle')!, tap = [b.def.from, b.def.to].find(e => e.k === 'tap')!, c = cs.find(q => nz.k === 'nozzle' && q.nozzle === nz.id)!;
        expect(tap.k === 'tap' && tap.line === s.main && !tap.valve, no).toBe(true); expect(b.def.NPS).toBe(c.NPS); expect(b.def.cls).toBe(s.cls);
        expect(b.def.from.k === 'nozzle').toBe(c.sends); expect(b.bare).toEqual([c.sends ? 'from' : 'to']);
      }
      // where one end sends and the other receives, the line runs with the flow
      if (ends[0].sends !== ends[1].sends) expect(ends[0].sends, s.stream).toBe(true);
    }
  });
  it('the connections are the piped units\' own spools, where each stands on the site; a party not yet piped is met at a limit spool (SW-PWY-4)', () => {
    for (const u of PIPED) {
      const up = unitPiping(u), { plot: p, cell } = cells().find(c => c.plot.unit === u && c.plot.kind === 'unit')!, T = cellToSite(p, cell);
      for (const sp of up.spools) {
        const c = pw.conns.find(q => q.nozzle === `${sp.tag}-P`); if (!c) { expect(pw.skipped.some(q => q.stream === sp.stream || q.stream.startsWith(`${sp.stream} (`)), `${sp.tag} ${sp.stream}`).toBe(true); continue; }
        const f = up.nozzles.get(`${sp.tag}-P`)!.face, site = [T[0] * f[0] + T[4] * f[1] + T[8] * f[2] + T[12], T[1] * f[0] + T[5] * f[1] + T[9] * f[2] + T[13], T[2] * f[0] + T[6] * f[1] + T[10] * f[2] + T[14]];
        expect(c.x).toBeCloseTo(site[0] - PWY.west * 12, 4); expect(c.z).toBeCloseTo(site[2] - PIPEWAY_Z * 12, 4); expect(c.y).toBeCloseTo(site[1] - bench('process').el * 12, 4);
        expect(c.NPS).toBe(sp.NPS); expect(c.cls).toBe(sp.cls); expect(c.sends).toBe(sp.dir === 'out'); expect(c.unitTier).toBe(sp.tier);
        const n = pw.nozzles.get(c.nozzle)!; expect(Math.abs(n.u[2])).toBe(1); expect(Math.sign(n.u[2])).toBe(-Math.sign(n.face[2]));   // it faces the rack
      }
    }
    const tags = new Set(pw.limits.map(l => l.tag)); expect(tags.size).toBe(pw.limits.length);
    for (const l of pw.limits) {
      expect(l.tag).toMatch(/^PL-10\d\d$/); const P = pw.nozzles.get(`${l.tag}-P`)!, U = pw.nozzles.get(`${l.tag}-U`)!;
      expect(P.A).toEqual(U.A); expect(P.u.map(v => -v + 0)).toEqual(U.u.map(v => v + 0)); expect(Math.hypot(...P.face.map((v, k) => v - U.face[k]))).toBe(24);
      const stub = pw.lines.find(q => q.def.no === l.stub)!; expect(stub.def.kind).toBe('stub'); expect(stub.def.from).toEqual({ k: 'nozzle', id: `${l.tag}-U` }); expect(stub.def.to).toEqual({ k: 'blind' });
      const line = pw.lines.find(q => q.def.no === l.line)!; expect([line.def.from, line.def.to].some(e => e.k === 'nozzle' && e.id === `${l.tag}-P`), l.tag).toBe(true);
      if (l.where === 'valve bay') { expect(onBench(l.unit) && !PIPED.includes(l.unit), l.tag).toBe(true); expect(Math.abs(l.at[2])).toBe(PIPEWAY_HALF * 12 + RACK.start - RACK.bent + 30); }
      else { expect(onBench(l.unit)).toBe(false); expect(l.at[0]).toBe(l.where === 'west limit bay' ? PWY.limit : L - PWY.limit); const s = pw.lines.find(q => q.def.no === pw.streams.find(v => v.stream === l.stream)!.main)!; expect(l.at[1]).toBe(mainY(s.tier!, s.def.NPS, s.def.cls)); }
    }
    // a unit's limit spools stand a flange and 6 in apart at least
    for (const u of pw.units.filter(q => !q.piped)) { const mine = pw.limits.filter(l => l.unit === u.unit).sort((a, b) => a.at[0] - b.at[0]); for (let i = 1; i < mine.length; i++) if (mine[i].at[1] === mine[i - 1].at[1]) expect(mine[i].at[0] - mine[i - 1].at[0]).toBeGreaterThanOrEqual((designFlange(mine[i].NPS, mine[i].cls).OD + designFlange(mine[i - 1].NPS, mine[i - 1].cls).OD) / 2 + 6 - 1e-9); }
  });
  it('gives each line that runs the rack a tier and a lane beforehand, and runs the generator once for each (SW-PWY-5, SW-PWY-6)', () => {
    const lanes = pw.foreseen.filter(q => q.no !== undefined);
    expect(lanes.length).toBe(pw.streams.filter(s => s.laid === 'on the rack').length); expect(pw.runs.length).toBe(lanes.length + 1);
    for (const [k, a] of lanes.entries()) {
      const d = pw.lines.find(l => l.def.no === a.no)!; expect(d.tier).toBe(a.t); expect(Math.abs(a.z) + a.OD / 2).toBeLessThan(PWY.half - 14);
      for (const st of PWY.stringers) expect(Math.abs(a.z - st), `${a.no} over a stringer`).toBeGreaterThanOrEqual(a.OD / 2 + STRINGER);
      for (const b of lanes.slice(k + 1)) if (a.t === b.t && !(a.x1 < b.x0 - 24 || a.x0 > b.x1 + 24)) expect(Math.abs(a.z - b.z), `${a.no} and ${b.no}`).toBeGreaterThanOrEqual(laneSpacing(a.OD, b.OD));
      // a line lies on a tier it can turn onto from each of its spools: two elbows and a make-up piece between its lane's height and the spool's
      for (const e of [d.def.from, d.def.to]) { const c = pw.conns.find(q => e.k === 'nozzle' && q.nozzle === e.id)!; if (!c.end) expect(Math.abs(mainY(a.t, d.def.NPS, d.def.cls) - c.y), `${a.no} at ${c.party}`).toBeGreaterThanOrEqual(turnHeight(d.def.NPS, d.def.cls)); }
      const run = pw.runs[pw.runOf.get(a.no!)!]; expect(run.kind).toBe('rack'); expect(run.lines[0]).toBe(a.no); expect(run.lane).toEqual(a);
    }
    // the top tier is kept for the utility headers: only a line whose spools leave it no other lies there
    for (const a of lanes.filter(q => q.t === PWY.tiers.length - 1)) expect(pipeDims(pw.lines.find(l => l.def.no === a.no)!.def.NPS, 'P150').OD).toBeGreaterThan(8);
    expect(pw.runs[pw.runs.length - 1].kind).toBe('rest');
    for (const l of pw.lines) expect(pw.runOf.has(l.def.no), l.def.no).toBe(true);
    for (const s of pw.streams) for (const b of s.branches) expect(pw.runOf.get(b)).toBe(pw.runOf.get(s.main));
  });
  it('a junction frame stands 2 ft inside the corridor from each unit\'s limit, a beam under each main tier (SW-PWY-9)', () => {
    for (const u of pw.units) {
      const j = pw.junctions.find(q => q.unit === u.unit), mine = pw.conns.filter(c => c.unit === u.unit); if (!mine.length) { expect(j).toBeUndefined(); continue; }
      expect(j, `unit ${u.unit}`).toBeDefined(); expect(j!.z).toBe(u.side * PWY.junction); expect(j!.x).toBe(u.x); expect(j!.half).toBe(u.half); expect(j!.tiers).toEqual([...PWY.tiers.keys()]);
      const steel = pw.own.filter(q => q.tags.includes(`junction:U${u.unit}`)); expect(steel.filter(q => q.tags.includes('post')).length).toBe(2); expect(steel.filter(q => q.tags.includes('beam')).length).toBe(j!.tiers.length);
      // each line from a spool has steel over it within 15 ft, what a 3 in line spans: the junction beam, then the rack's strut
      for (const c of mine) { expect(Math.abs(c.z) - PWY.junction).toBeLessThanOrEqual(180); expect(c.y + pipeDims(c.NPS, c.cls).OD / 2 + 3).toBeLessThan(PWY.tiers[c.unitTier!] - Number(/^W(\d+)x/.exec(j!.beam)![1])); }
      expect(PWY.junction - PWY.half).toBeLessThanOrEqual(180);
    }
    expect(pw.own.filter(q => q.tags.includes('rack-stringer')).length).toBe(PWY.tiers.length * PWY.stringers.length * PWY.bays);
  });
  it('the generator sees the corridor and the units\' valve bays and no more; the tier beams of each unit\'s first bent only in the checks (SW-PWY-8)', () => {
    const shown = pw.plant.interior().instances, real = pw.interior.instances, firstBent = `rack-bent:${RACK.start - RACK.bent}`;
    const hidden = real.filter(q => q.tags.includes('beam') && q.tags.includes(firstBent)); expect(hidden.length).toBeGreaterThanOrEqual(pw.units.length * RACK.tiers.length);
    for (const q of hidden) expect(shown.includes(q)).toBe(false);
    for (const q of real) if (!hidden.includes(q)) expect(shown.includes(q)).toBe(true);
    expect(real.some(q => q.tags.includes('rack-ladder') && q.tags.some(t => /^unit-/.test(t)))).toBe(false);   // SW-CELL-2: no ladder at a unit rack's limit end
    expect(shown.filter(q => q.tags.includes('keep-out')).length).toBeGreaterThan(pw.units.length);
    expect(pw.plant.grid.x0).toBeLessThan(0); expect(pw.plant.grid.x1).toBeGreaterThan(L);
  });
  it('every rule the pipeway\'s code cites is written in the design basis', () => {
    const code = ['pipeway.ts', 'pipewayReport.ts'].map(f => readFileSync(new URL(`../src/refinery/${f}`, import.meta.url), 'utf8')).join('\n') + readFileSync(new URL('../tools/refinery-pipeway.ts', import.meta.url), 'utf8');
    for (const id of new Set(code.match(/SW-[A-Z]+-\d+/g) ?? [])) expect(basisDoc.includes(`\`${id}\``), id).toBe(true);
    expect(basisDoc).toContain('## 80. Plant 3: the main pipeway and the lines between units');
  });
});

describe('plant 3: the piped pipeway on disk', () => {
  const has = existsSync(new URL('pipeway.report.json', dir));
  const r = has ? (JSON.parse(readFileSync(new URL('pipeway.report.json', dir), 'utf8')) as PipedPipeway) : undefined;
  const m = has ? (JSON.parse(readFileSync(new URL('pipeway.json', dir), 'utf8')) as PipingModel) : undefined;
  it('is there with its model, report, document and images', () => {
    expect(has).toBe(true); if (!r || !m) return;
    expect(r.demonstration).toBe(true); expect(r.area).toBe(PWY.area);
    expect(readFileSync(new URL('../docs/REFINERY-PIPEWAY.md', import.meta.url), 'utf8')).toBe(pipewayDocument(r) + '\n');
    const index = readFileSync(new URL('../screenshots/INDEX.md', import.meta.url), 'utf8');
    for (const name of Object.keys(PIPEWAY_IMAGES)) { expect(existsSync(new URL(`../screenshots/refinery/${name}.png`, import.meta.url)), name).toBe(true); expect(index).toContain(`refinery/${name}.png`); }
  });
  it('is the pipeway the code describes: the same lines, limit spools and lanes', () => {
    if (!r || !m) return;
    expect(r.lines.map(l => l.no)).toEqual(pw.lines.map(l => l.def.no)); expect(m.lines.map(l => l.no)).toEqual(pw.lines.map(l => l.def.no));
    expect(r.limits).toEqual(JSON.parse(JSON.stringify(pw.limits))); expect(r.streams).toEqual(JSON.parse(JSON.stringify(pw.streams))); expect(r.junctions).toEqual(JSON.parse(JSON.stringify(pw.junctions)));
    for (const l of r.lines) { const d = pw.lines.find(q => q.def.no === l.no)!; expect(l.designP).toBe(d.designP); expect(l.designT).toBe(d.designT); expect(l.cls).toBe(d.def.cls); expect(l.NPS).toBe(d.def.NPS); }
  });
  it('every line is routed, and the generator\'s own checks of continuity, joints, elbows, valves and clearances are at zero', () => {
    if (!r || !m) return;
    expect(r.failures).toEqual([]); for (const l of r.lines) expect(l.routed, l.no).toBe(true);
    for (const k of ['continuity', 'joints', 'elbows', 'valves', 'lineClearance', 'staticClearance'] as const) expect(r.checks[k], k).toEqual([]);
    // the checks run again here on the saved model give what the report says
    const again = unitChecks(m, asUnit(pw)); for (const k of ['continuity', 'joints', 'elbows', 'valves', 'lineClearance', 'staticClearance', 'supports'] as const) expect(again[k], k).toEqual(r.checks[k]);
  }, 600_000);
  it('each line that runs the rack lies in the lane it was given, on its tier', () => {
    if (!r || !m) return;
    for (const a of pw.foreseen.filter(q => q.no !== undefined)) { const run = m.lines.find(l => l.no === a.no)!; expect(mainLaneOf(run, a.t), a.no).toBe(a.z); }
  });
  it('at every spool the line\'s own flange meets the spool\'s face and no valve stands there; beyond each limit spool stand a valve and a blind (SW-PWY-4, SW-PWY-7)', () => {
    if (!r || !m) return;
    const d3 = (p: number[], q: number[]) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
    for (const l of pw.lines) {
      const run = m.lines.find(q => q.no === l.def.no)!;
      for (const side of l.bare ?? []) {
        const e = l.def[side], n = e.k === 'nozzle' ? pw.nozzles.get(e.id)! : undefined; expect(n, l.def.no).toBeDefined(); if (!n) continue;
        const cs = (side === 'from' ? run.comps : [...run.comps].reverse()).filter(c => c.kind !== 'studs');
        expect(cs[0].kind, `${l.def.no} at ${n.id}`).toBe('gasket'); expect(cs[1].kind).toBe('flange'); expect(cs[1].NPS).toBe(n.NPS); expect(cs[1].cls).toBe(n.cls);
        expect(Math.min(d3(cs[0].a, n.face), d3(cs[0].b, n.face))).toBeLessThan(0.01);
        // no valve within the reach of a valve set from that face
        for (const c of cs.slice(0, 8)) if (c.kind === 'valve') expect(Math.min(d3(c.a, n.face), d3(c.b, n.face)), `${l.def.no}: a valve at ${n.id}`).toBeGreaterThan(60);
      }
      if (l.origin === 'limit') { const kinds = run.comps.filter(c => c.kind !== 'studs').map(c => c.kind); expect(kinds, l.def.no).toEqual(['gasket', 'valve', 'gasket', 'blind']); }
    }
    expect(r.notes.filter(n => n.endsWith('(SW-RPI-14)')).length).toBe(pw.lines.reduce((a, l) => a + (l.bare?.length ?? 0), 0));
    // the units' own spools are not in the pipeway's model: only the limit spools it sets itself
    expect(new Set(m.nozzles.map(n => n.equip))).toEqual(new Set(pw.limits.map(l => l.tag)));
  });
  it('the pipeway\'s register on disk is the one its model gives: a record for every line and every component (SW-REG-9, SW-PWY-10)', () => {
    if (!r || !m) return;
    const file = new URL('../public/refinery/registry/piping/pipeway.json', import.meta.url); expect(existsSync(file)).toBe(true);
    const reg = pipewayRegister(pw, m); expect(readFileSync(file, 'utf8')).toBe(serializeRegister(reg) + '\n');
    expect(reg.lines.length).toBe(pw.lines.length); expect(reg.components.length).toBe(m.lines.reduce((a, l) => a + l.comps.length, 0) + m.nozzles.reduce((a, n) => a + n.comps.length, 0));
    for (const c of reg.components) if (c.registered !== 'none') expect(c.registration, c.tag).toBeTruthy();
    for (const l of reg.lines) { expect(['M', 'Normal', 'D']).toContain(l.fluidService); expect(l.stream).toBeTruthy(); }
  }, 300_000);
  it('what is not at zero is said: support spans where no steel stands are listed in the report and the document', () => {
    if (!r) return;
    const doc = readFileSync(new URL('../docs/REFINERY-PIPEWAY.md', import.meta.url), 'utf8'); for (const s of r.checks.supports) expect(doc).toContain(s);
  });
});
