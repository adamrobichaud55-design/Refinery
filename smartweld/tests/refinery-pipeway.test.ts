/** Plant 3, the coastal refinery: the main pipeway (DESIGN_BASIS.md §80). What the generator of plants 1 and 2 is given for
 *  it — the rack, the units' spools as connections, a line for every stream between units — follows the process model and the
 *  rules; and the piped pipeway on disk is whole: every line routed, continuous, jointed by its class, clear of every other
 *  and of the steel. Generating it takes a quarter of an hour, so the saved model is checked rather than made again here
 *  (tools/refinery-pipeway.ts makes it). */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { pipeway, PWY, PIPED, mainY, turnHeight, pipewayToSite, stringersOf, stringersBy, MIN_BRANCH } from '../src/refinery/pipeway';
import { pipewayDocument, mainLaneOf, asUnit, supportsAtFirstBents, PIPEWAY_IMAGES, type PipedPipeway } from '../src/refinery/pipewayReport';
import { unitChecks } from '../src/refinery/pipingReport';
import { pipewayRegister, serializeRegister } from '../src/refinery/pipingRegister';
import { unitPiping, laneSpacing, STRINGER } from '../src/refinery/unitPiping';
import { processModel } from '../src/refinery/process';
import { sizing, transferLine, limits, headerDesign } from '../src/refinery/sizing';
import { plantHeaders, unitHeaders } from '../src/refinery/headers';
import { cells, cellToSite } from '../src/refinery/assemble';
import { PLOTS, PIPEWAYS, PIPEWAY_Z, PIPEWAY_HALF, bench } from '../src/refinery/site';
import { RACK } from '../src/refinery/cell';
import { designFlange, pipeDims } from '../src/catalogue';
import { worldBox, type PipingModel } from '../src/generator/piping';

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
    const lim = limits(), utility = new Set(M.headers.map(h => h.key));
    for (const sh of M.sheets) sh.lines.forEach((l, i) => {
      if (l.to.k !== 'bl' || l.cv) return;
      const name = l.to.name;
      if (utility.has(name)) { const hd = headerDesign(M.headers.find(h => h.key === name)!.fluid), z = Z.get(sh.no)!.lines[i]; expect(z.designP, `unit ${sh.no}, line ${i + 1}`).toBe(hd.designP); expect(z.designT).toBe(hd.designT); return; }   // a utility is one system, designed together (SW-PRC-19): unit 19's line is of its header's conditions
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
    // SW-PWY-11: each utility header lies on the top tier, or is named with the reason it does not
    for (const h of M.headers) { const laid = pw.headers.find(q => q.key === h.key), skip = pw.skipped.find(q => q.stream === h.key); expect(!!laid !== !!skip, h.key).toBe(true); if (skip) expect(skip.why, h.key).toMatch(/SW-PWY-11/); }
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
      if (l.where === 'valve bay') { expect(onBench(l.unit) && !PIPED.includes(l.unit), l.tag).toBe(true); expect(Math.abs(l.at[2])).toBe(PIPEWAY_HALF * 12 + (pw.headers.some(h => h.key === l.stream) ? RACK.start - RACK.bent / 2 : RACK.start - RACK.bent + 30)); }   // a header's, at the bay's middle on the top tier (SW-PWY-12)
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
      for (const st of stringersBy(a.t)) expect(Math.abs(a.z - st), `${a.no} over a stringer, or under one of the tier above`).toBeGreaterThanOrEqual(a.OD / 2 + STRINGER);
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
  it('the utility headers lie on the top tier in the lanes the generator will give them, each of its system\'s conditions and size, a branch to every party (SW-PRC-19, SW-PWY-11, SW-PWY-12)', () => {
    const top = PWY.tiers.length - 1, PH = plantHeaders(u => pw.units.find(q => q.unit === u)?.x ?? (u === 25 || u === 26 ? 0 : L), (u, tag) => u !== 19 || unitPiping(19).cell.spots.some(sp => sp.item === tag));
    expect(pw.headers.map(h => h.fluid).sort()).toEqual(['BW', 'CA', 'CO', 'FG', 'HS', 'IA', 'LS', 'MS', 'RW']);
    // the lanes: in the order of the list, each in the first place from the centre line outward its neighbours leave it, by the generator's own spacing (SW-RT-2); the largest first
    const cz: number[] = []; for (let z = -(PWY.half - 18) + 6; z <= PWY.half - 18 - 6; z += 6) cz.push(z); cz.sort((a, b) => Math.abs(a) - Math.abs(b));
    const set: { z: number; OD: number }[] = [];
    for (const [k, h] of pw.headers.entries()) {
      const l = pw.lines.find(q => q.def.no === h.line)!, OD = pipeDims(h.NPS, h.cls).OD, z = cz.find(c => set.every(q => Math.abs(q.z - c) >= (q.OD + OD) / 2 + 3))!; set.push({ z, OD });
      expect(h.z, h.key).toBe(z); if (k) expect(h.NPS).toBeLessThanOrEqual(pw.headers[k - 1].NPS);
      expect(l.origin).toBe('header'); expect(l.def.kind).toBe('header'); expect(l.def.from).toEqual({ k: 'blind' }); expect(l.def.to).toEqual({ k: 'blind' }); expect(l.tier).toBe(top); expect(Number(l.def.no.slice(-5))).toBe(10401 + k);
      expect(pw.runs[pw.runOf.get(h.line)!].kind).toBe('rest');
      // its conditions and size (SW-PRC-19)
      const hd = headerDesign(h.fluid), ph = PH.find(q => q.fluid === h.fluid)!; expect(h.cls).toBe(hd.cls); expect(h.designP).toBe(hd.designP); expect(h.designT).toBe(hd.designT); expect(l.designP).toBe(hd.designP);
      expect(h.NPS).toBe(Math.max(ph.line.NPS, ph.stretchNPS, ph.joined)); expect(h.sizedBy).toEqual({ line: ph.line.NPS, stretch: ph.stretch, stretchNPS: ph.stretchNPS, joined: ph.joined });
      // its parties: unit 19's spool for it, and the header spool of every unit of the bench that takes it or makes it; each by a branch of its spool's size, of the header's class, with no valve at the header
      const units = ph.parties.filter(q => !q.line && onBench(q.unit)).map(q => q.unit).sort(), got = [...new Set(h.parties.filter(q => /header/.test(q.party)).map(q => q.unit))].sort(); expect(got, h.key).toEqual(units);
      expect(h.parties.filter(q => q.party === 'unit 19').length, h.key).toBe(1);
      for (const q of h.parties) {
        const b = pw.lines.find(v => v.def.no === q.branch)!, nz = [b.def.from, b.def.to].find(e => e.k === 'nozzle')!, tap = [b.def.from, b.def.to].find(e => e.k === 'tap')!, n = pw.nozzles.get(q.nozzle)!;
        expect(nz.k === 'nozzle' && nz.id === q.nozzle).toBe(true); expect(tap.k === 'tap' && tap.line === h.line && !tap.valve, q.branch).toBe(true); expect(b.origin).toBe('branch'); expect(b.stream).toBe(h.key);
        expect(MIN_BRANCH).toBe(3); expect(b.def.NPS).toBe(Math.max(MIN_BRANCH, n.NPS)); expect(q.NPS).toBe(b.def.NPS); expect(q.spool).toBe(n.NPS);   // 3 in at least, reduced at a smaller spool
        expect(b.def.NPS).toBeLessThanOrEqual(h.NPS); expect(b.def.cls).toBe(h.cls); expect(n.cls).toBe(h.cls); expect(b.def.from.k === 'nozzle').toBe(q.sends); expect(b.bare).toEqual([q.sends ? 'from' : 'to']);
        const seq = Number(q.branch.slice(-5)); expect(seq).toBeGreaterThan(10600); expect(seq).toBeLessThan(10800); expect(b.def.service).toBe('P');   // built as a process line: it has no valve of its own expect(pw.runs[pw.runOf.get(q.branch)!].kind).toBe('rest');
      }
    }
    // a piped unit's header spool of a header on the rack is a party of it; of one not on the rack (cooling water) it waits
    for (const u of PIPED) for (const sp of unitPiping(u).spools.filter(q => q.header)) { const h = pw.headers.find(q => q.key === sp.stream); if (h) expect(h.parties.some(q => q.nozzle === `${sp.tag}-P`), sp.tag).toBe(true); else expect(sp.stream).toMatch(/^cooling water/); }
    // every unit of the process bench is piped now (the cracker with them): none of them has a limit spool on the main rack, each header's branch ends at the unit's own spool
    for (const uh of unitHeaders(17)) { const h = pw.headers.find(q => q.fluid === uh.fluid); if (!h) continue; const q = h.parties.find(v => v.unit === 17)!; expect(q, uh.fluid).toBeDefined(); expect(pw.limits.some(v => `${v.tag}-P` === q.nozzle), uh.fluid).toBe(false); expect(unitPiping(17).spools.some(sp => sp.header && `${sp.tag}-P` === q.nozzle), uh.fluid).toBe(true); }
    // the band and the strips beside it are taken on the top tier before any stream's line is given a lane
    const z0 = Math.min(...pw.headers.map(h => h.z - pipeDims(h.NPS, h.cls).OD / 2)), z1 = Math.max(...pw.headers.map(h => h.z + pipeDims(h.NPS, h.cls).OD / 2));
    for (const a of pw.foreseen.filter(q => q.no !== undefined && q.t === top)) expect(Math.min(Math.abs(a.z - a.OD / 2 - z1), Math.abs(a.z + a.OD / 2 - z0)), a.no).toBeGreaterThanOrEqual(36);
    expect(z1 - z0).toBeLessThan(160);
    // SW-PWY-13: no tier is loaded beyond what it is built for
    expect(pw.loads.map(q => q.tier)).toEqual([1, 2, 3]); for (const q of pw.loads) { expect(q.limit).toBe(1200); expect(q.most).toBeGreaterThan(0); expect(q.most, `tier ${q.tier}`).toBeLessThanOrEqual(q.limit); }
    // what a run is given over the top tier: the band held until the last run; in the last run the space over the tier closed outside the band and its strips
    const base = pw.plant.interior().instances.length, boxes = (k: number) => pw.runPlant(k, []).interior().instances.slice(base).map(q => worldBox(q.part, q.transform)!), y0 = PWY.tiers[top];
    const held = boxes(0).filter(b => Math.abs(b[0][1] - (y0 + 4)) < 1e-6 && Math.abs(b[1][1] - (y0 + 72)) < 1e-6 && b[0][2] <= z0 - 36 + 1e-6 && b[1][2] >= z1 + 36 - 1e-6); expect(held.length).toBe(1);
    expect(held[0][0][0]).toBeLessThanOrEqual(pw.rack.x0 + 6); expect(held[0][1][0]).toBeGreaterThanOrEqual(pw.rack.x1 - 6);
    const last = boxes(pw.runs.length - 1), lid = last.filter(b => Math.abs(b[0][1] - (y0 + 72)) < 1e-6 && b[1][1] > y0 + 100), sides = last.filter(b => Math.abs(b[0][1] - y0) < 1e-6 && Math.abs(b[1][1] - (y0 + 72)) < 1e-6);
    expect(lid.length).toBe(1); expect(sides.length).toBe(2);
    for (const b of sides) { expect(b[0][2] >= z1 + 36 - 1e-6 || b[1][2] <= z0 - 36 + 1e-6).toBe(true); expect(Math.max(Math.abs(b[0][2]), Math.abs(b[1][2]))).toBe(PWY.junction - 6); expect(b[0][0]).toBe(pw.rack.x0); expect(b[1][0]).toBe(pw.rack.x1); }
    expect(last.filter(b => b[1][0] - b[0][0] === 9).length).toBe(2 * pw.headers.length);   // a block about each cap (SW-RPI-12)
  }, 600_000);
  it('a junction frame stands 2 ft inside the corridor from each unit\'s limit, a beam under each main tier (SW-PWY-9)', () => {
    for (const u of pw.units) {
      const j = pw.junctions.find(q => q.unit === u.unit), mine = pw.conns.filter(c => c.unit === u.unit); if (!mine.length) { expect(j).toBeUndefined(); continue; }
      expect(j, `unit ${u.unit}`).toBeDefined(); expect(j!.z).toBe(u.side * PWY.junction); expect(j!.x).toBe(u.x); expect(j!.half).toBe(u.half); expect(j!.tiers).toEqual([...PWY.tiers.keys()]);
      const steel = pw.own.filter(q => q.tags.includes(`junction:U${u.unit}`)); expect(steel.filter(q => q.tags.includes('post')).length).toBe(2); expect(steel.filter(q => q.tags.includes('beam')).length).toBe(j!.tiers.length);
      // each line from a spool has steel within 15 ft, what a 3 in line spans: the first bent's beam under it (SW-PWY-8), the junction beam over it, then the rack's strut
      const zb = PIPEWAY_HALF * 12 + RACK.start - RACK.bent;
      for (const c of mine) { expect(Math.abs(c.z)).toBeGreaterThan(zb); expect(Math.abs(c.z) - zb).toBeLessThanOrEqual(180); expect(c.y + pipeDims(c.NPS, c.cls).OD / 2 + 3).toBeLessThan(PWY.tiers[c.unitTier!] - Number(/^W(\d+)x/.exec(j!.beam)![1])); }
      expect(zb - PWY.junction).toBeLessThanOrEqual(180); expect(PWY.junction - PWY.half).toBeLessThanOrEqual(180);
    }
    expect(pw.own.filter(q => q.tags.includes('rack-stringer')).length).toBe(PWY.tiers.reduce((a, _t, t) => a + stringersOf(t).length, 0) * PWY.bays); expect(stringersOf(0)).toEqual([-60, 60]); expect(stringersOf(PWY.tiers.length - 1)).toEqual([-96, 0, 96]); expect(stringersBy(0)).toEqual([-60, 60]); expect(stringersBy(1).sort((a, b) => a - b)).toEqual([-96, -60, 0, 60, 96]);
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
    expect(r.headers).toEqual(JSON.parse(JSON.stringify(pw.headers))); expect(r.loads).toEqual(pw.loads);
    for (const l of r.lines) { const d = pw.lines.find(q => q.def.no === l.no)!; expect(l.designP).toBe(d.designP); expect(l.designT).toBe(d.designT); expect(l.cls).toBe(d.def.cls); expect(l.NPS).toBe(d.def.NPS); }
  });
  it('every line is routed, and the generator\'s own checks of continuity, joints, elbows, valves, clearances and spans are at zero', () => {
    if (!r || !m) return;
    expect(r.failures).toEqual([]); for (const l of r.lines) expect(l.routed, l.no).toBe(true);
    for (const k of ['continuity', 'joints', 'elbows', 'valves', 'lineClearance', 'staticClearance', 'supports'] as const) expect(r.checks[k], k).toEqual([]);
    // the checks run again here on the saved model give what the report says
    const again = unitChecks(m, asUnit(pw)); for (const k of ['continuity', 'joints', 'elbows', 'valves', 'lineClearance', 'staticClearance', 'supports'] as const) expect(again[k], k).toEqual(r.checks[k]);
  }, 600_000);
  it('each line that runs the rack lies in the lane it was given, on its tier', () => {
    if (!r || !m) return;
    for (const a of pw.foreseen.filter(q => q.no !== undefined)) { const run = m.lines.find(l => l.no === a.no)!; expect(mainLaneOf(run, a.t), a.no).toBe(a.z); }
  });
  it('each header lies in its lane on the top tier from cap to cap; each branch leaves its top, comes down beside the band and goes out under the tier (SW-PWY-11, SW-PWY-12)', () => {
    if (!r || !m) return;
    const top = PWY.tiers.length - 1, y0 = PWY.tiers[top], z0 = Math.min(...pw.headers.map(h => h.z - pipeDims(h.NPS, h.cls).OD / 2)), z1 = Math.max(...pw.headers.map(h => h.z + pipeDims(h.NPS, h.cls).OD / 2)), s0 = Math.min(z0 - 36, -96), s1 = Math.max(z1 + 36, 96);
    for (const h of pw.headers) {
      const run = m.lines.find(l => l.no === h.line)!, kinds = run.comps.map(c => c.kind), y = mainY(top, h.NPS, h.cls);
      expect(run.from).toBe('cap'); expect(run.to).toBe('cap'); expect(kinds[0]).toBe('cap'); expect(kinds[kinds.length - 1]).toBe('cap'); expect(kinds.filter(k => k === 'cap').length).toBe(2);
      expect(run.path[0]).toEqual([pw.rack.x0 + 12, y, h.z]); expect(run.path[run.path.length - 1]).toEqual([pw.rack.x1 - 12, y, h.z]);
      for (const c of run.comps.filter(q => q.kind === 'pipe')) { expect(c.a[1]).toBe(y); expect(c.a[2]).toBe(h.z); expect(Math.abs(c.b[0] - c.a[0])).toBeLessThanOrEqual(480 + 1e-6); }
      // carried on every bent's top tier beam it crosses: the bents between its caps
      const bents: number[] = []; for (let x = pw.rack.x0; x <= pw.rack.x1; x += PWY.bent) if (x > pw.rack.x0 + 12 && x < pw.rack.x1 - 12) bents.push(x);
      for (const x of bents) expect(run.supports.some(sp => Math.abs(sp.at[0] - x) < 1), `${h.line} at the bent at x ${x}`).toBe(true);
      // a tee in it or a branch fitting on it for every party (the fitting is the first piece of the branch), and that party's branch welded there
      expect(run.comps.filter(c => c.kind === 'tee').length + m.lines.reduce((a, l) => a + l.comps.filter(c => c.kind === 'olet' && c.onRun === h.line).length, 0), h.key).toBe(h.parties.length);
      for (const q of h.parties) {
        const b = m.lines.find(l => l.no === q.branch)!, pts = b.path, at = q.sends ? pts[pts.length - 1] : pts[0];
        expect(b.ok, q.branch).toBe(true); expect(q.sends ? b.to : b.from).toBe(`tap ${h.line}`);
        expect(at[2], `${q.branch} leaves over its header's axis`).toBe(h.z); expect(at[1]).toBeGreaterThan(y);                               // from the top of the header
        for (const p of pts) { expect(p[1]).toBeLessThanOrEqual(y0 + 72); if (p[2] < s0 - 1e-6 || p[2] > s1 + 1e-6) expect(p[1], `${q.branch}: over the top tier outside the band and its strips`).toBeLessThan(y0); }
        // it comes down to cross out under the top tier: its level where it passes the rack's column line is under the tier's steel
        const n = pw.nozzles.get(q.nozzle)!, side = Math.sign(n.face[2]), out = pts.filter(p => p[2] * side > PWY.half - 1e-6); expect(out.length).toBeGreaterThan(0); for (const p of out) expect(p[1]).toBeLessThan(y0 - 18);
      }
    }
  });
  it('a line that passes over a unit\'s first bent on its way to its spool is carried there and on from there: a shoe on the tier beam, a post where it passes higher, hangers where the generator\'s stepping had stopped (SW-PWY-8)', () => {
    if (!r || !m) return;
    let shoes = 0, posts = 0;
    const topT = RACK.tiers[RACK.tiers.length - 1];
    for (const U of pw.units) {   // a unit not yet piped has its rack too
      const zb = U.side * (PIPEWAY_HALF * 12 + RACK.start - RACK.bent);
      for (const run of m.lines) for (const c of run.comps) {
        if (c.kind !== 'pipe' || Math.abs(c.a[0] - c.b[0]) > 1e-6 || Math.abs(c.a[1] - c.b[1]) > 1e-6 || Math.abs(c.a[0] - U.x) > U.half || (c.a[2] - zb) * (c.b[2] - zb) > 0 || Math.min(Math.abs(c.a[2] - zb), Math.abs(c.b[2] - zb)) < 6) continue;
        const bottom = c.a[1] - pipeDims(c.NPS, c.cls).OD / 2, tier = RACK.tiers.find(t => bottom - t >= 4 - 1e-6 && bottom - t < 10), here = run.supports.filter(sp => Math.abs(sp.at[2] - zb) < 1e-6 && Math.abs(sp.at[0] - c.a[0]) < 1e-6);
        if (tier !== undefined) {   // at the height a line of that tier lies at: a shoe on the beam, of the pipe's own size and class (a branch is reduced only at its spool)
          expect(here.map(sp => sp.type), `${run.no} at unit ${U.unit}`).toEqual(['shoe']); shoes++;
          expect(here[0].at[1]).toBe(tier); expect(here[0].key).toBe(`SHOE|${c.NPS}|${c.cls}|shoe|${(bottom - tier).toFixed(3)}`);
        } else if (bottom - topT >= 10 - 1e-6 && bottom - topT <= 48 + 1e-6 && here.length) {   // higher over the top tier: a post on its beam, where nothing lies between
          expect(here.map(sp => sp.type), `${run.no} at unit ${U.unit}`).toEqual(['stanchion']); posts++;
          expect(here[0].key).toBe(`STAN|${c.NPS}|${c.cls}|${(bottom - topT).toFixed(2)}`);
        }
      }
    }
    expect(shoes).toBeGreaterThan(80); expect(r.notes.some(x => x.startsWith(`${shoes} shoes set on the tier beams of the units' first bents`))).toBe(true);
    const said = r.notes.find(x => /^\d+ posts? set on the top-tier beams of first bents/.test(x)); expect(said).toBeDefined(); if (!said) return;
    const hangers = Number(/and (\d+) hangers set/.exec(said)![1]); expect(posts).toBeGreaterThan(0); expect(said.startsWith(`${posts} `)).toBe(true); expect(hangers).toBeGreaterThan(0);
    // set once and the same again: with the posts and hangers the note names taken out of a copy of the saved model, the same are set again, and no shoe is missing
    const where = /: (.+) \(SW-PWY-8\)\.$/.exec(said)![1].split('; ').map(s => /^(\S+) (?:(\d+) posts?)?(?: and )?(?:(\d+) hangers?)?$/.exec(s)!), copy = JSON.parse(JSON.stringify(m)) as PipingModel;
    for (const w of where) { const run = copy.lines.find(l => l.no === w[1])!, n = Number(w[2] ?? 0) + Number(w[3] ?? 0); expect(n).toBeGreaterThan(0); run.supports.splice(run.supports.length - n, n); }
    const again = supportsAtFirstBents(copy, pw); expect(again.shoes).toBe(0); expect(again.posts).toBe(posts); expect(again.hangers).toBe(hangers);
    for (const run of copy.lines) expect(JSON.parse(JSON.stringify(run.supports)), run.no).toEqual(m.lines.find(l => l.no === run.no)!.supports);   // as saved: through JSON
    // every hanger hangs from steel over it: its rod ends at the underside the generator takes for a member, and no rod is longer than 20 ft
    for (const w of where) for (const sp of m.lines.find(l => l.no === w[1])!.supports.filter(q => q.type === 'hanger')) { const rod = Number(sp.key.split('|')[3]); expect(rod).toBeGreaterThan(6); expect(rod).toBeLessThanOrEqual(240); }
  }, 600_000);
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
  it('what is not at zero would be said: a support span left open is listed in the report and the document', () => {
    if (!r) return;
    const doc = readFileSync(new URL('../docs/REFINERY-PIPEWAY.md', import.meta.url), 'utf8'); for (const s of r.checks.supports) expect(doc).toContain(s);
  });
});
