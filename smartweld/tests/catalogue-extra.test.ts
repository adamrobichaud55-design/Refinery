/** The wider 3D catalogue (DESIGN_BASIS.md §70 onward): piping specials, further equipment, structural assemblies and
 *  further civil items. Every entry of the catalogue list in these groups builds, its solids are closed with positive
 *  volume, every dimension carries a basis written in the design basis, and the stated rules hold. Catalogue items
 *  only: nothing here is in a plant, the ground truth or the PCF mapping. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ENTRIES } from '../src/scene/catalogueList';
import { makeTurbineCompressor, makeLoadingStation, makePlatformedColumn, makeFlueGasCooler, makeHorizontalDrum, makeBullet, makeDesalter, makeDeaerator, makeKettleReboiler, makeEjector, makeEjectorSet, ejectorSetLayout, makeSteamTurbine, makeInlinePump, makeSulfurFurnace, makeDuctRun, makeSphere, makeCoolingTower, makeCabinHeater, makeReformer, makePsaUnit, makeIncinerator, makePrecipitator, makeVentSilencer, makeMultiBedReactor, makeSwagedTower, seriesUp } from '../src/catalogue';
import { makePileCap, makeRetainingWall, makeCatchBasin, makeManhole, makeSleeper, makeMachineBlock, makeTableTop, makeSeparatorBasin, makeSulfurPit, makeBoxCulvert, makeDuctBank, planeMat, type Bar } from '../src/catalogue';
import { makeMitreBend, makeInsulatedPipe, insulationThickness, makeExpansionJoint, makeYStrainer, makeStubIn, makeSpringHanger, makeConeStrainer, makeLateral, makeSteamTrap, bendPath, pipeDims, designFlange } from '../src/catalogue';
import { makePipeRack, makeStairFlight, makeStairTower, makePlatform, makeFixedLadder, makePipeBridge, makeFireproofedColumn, makeTSupport, makeGoalPost, makeMonorail, makeProcessStructure, stairFlight, stairTower, sec, colSec, zReq } from '../src/scene/structures';
import { buildGeometry } from '../src/geometry/partGeometry';
import { isClosed, signedVolume } from '../src/geometry/mesh';
import { ruleIdsOf } from '../src/core/basis';

const basisDoc = readFileSync(new URL('../DESIGN_BASIS.md', import.meta.url), 'utf8');
const definedRules = new Set([...basisDoc.matchAll(/`(SW-[A-Z]+-\d+[a-z]?)`/g)].map(m => m[1]));
const definedConstants = new Set([...basisDoc.matchAll(/`(K-\d+)`/g)].map(m => m[1]));
const GROUPS = ['Piping specials', 'Structural assemblies', 'Process equipment', 'Civil'];
const bbox = (p: ReturnType<typeof makeMitreBend>) => { const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity]; for (const s of buildGeometry(p).solids) for (let i = 0; i < s.mesh.positions.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], s.mesh.positions[i + k]); mx[k] = Math.max(mx[k], s.mesh.positions[i + k]); } return { mn, mx }; };

describe('wider catalogue: every entry builds true and audited', () => {
  for (const e of ENTRIES.filter(e => GROUPS.includes(e.group))) it(`${e.group}: ${e.label}`, () => {
    const p = e.build(), g = buildGeometry(p);
    expect(g.solids.length).toBeGreaterThan(0);
    for (const s of g.solids) { expect(isClosed(s.mesh), `${s.name} closed`).toBe(true); expect(signedVolume(s.mesh), `${s.name} volume`).toBeGreaterThan(0); }
    expect(p.weight.value).toBeGreaterThan(0);
    for (const id of [...ruleIdsOf(p.dims), ...(p.weight.basis.kind === 'rule' ? [p.weight.basis.id] : [])]) expect(definedRules.has(id), `rule ${id} in DESIGN_BASIS.md`).toBe(true);
    for (const d of Object.values(p.dims)) { expect(Number.isFinite(d.value), `${p.id} ${d.label}`).toBe(true); if (d.basis.kind === 'constant') expect(definedConstants.has(d.basis.id)).toBe(true); expect(d.basis.kind).not.toBe('regulation'); }
    expect(p.designation).not.toMatch(/undefined|NaN/);
  });
  it('labels are unique', () => { const l = ENTRIES.map(e => e.label); expect(new Set(l).size).toBe(l.length); });
});

describe('piping specials (SW-PSP-*)', () => {
  it('SW-PSP-12: a mitre bend turns 90° on a radius of 1.5 OD and keeps the metal of its centreline length', () => {
    for (const pieces of [3, 4, 5]) {
      const p = makeMitreBend('MB', 24, 'P150', pieces), pd = pipeDims(24, 'P150'), R = 1.5 * pd.OD, b = bbox(p), g = buildGeometry(p);
      expect(p.dims.R.value).toBeCloseTo(R); expect(p.dims.cut.value).toBeCloseTo(45 / (pieces - 1));
      const A = (Math.PI / 4) * (pd.OD ** 2 - pd.D ** 2), cl = 2 * (pieces - 1) * R * Math.tan(Math.PI / 4 / (pieces - 1));
      expect(signedVolume(g.solids.find(s => s.name.startsWith('mitred'))!.mesh) / (A * cl)).toBeCloseTo(1, 2);
      // the bend starts along z at the origin and ends pointing up y at (R, R): its box reaches R + OD/2 both ways
      expect(b.mx[1]).toBeCloseTo(R, 0); expect(b.mx[2]).toBeCloseTo(R + pd.OD / 2, 0); expect(b.mn[2]).toBeCloseTo(0, 3);
    }
  });
  it('SW-PSP-15: insulation steps with size and is not weighed (SW-PSP-18)', () => {
    expect([1, 2, 3, 6, 8, 12, 14, 24].map(insulationThickness)).toEqual([1, 1, 1.5, 1.5, 2, 2, 3, 3]);
    const p = makeInsulatedPipe('IP', 6, 'P150', 96, false), pd = pipeDims(6, 'P150'), pipeLb = ((Math.PI / 4) * (pd.OD ** 2 - pd.D ** 2) * 96 * p.dims.rho.value) / 1728;
    expect(p.weight.value).toBeGreaterThan(pipeLb); expect(p.weight.value).toBeLessThan(1.25 * pipeLb);
  });
  it('SW-PSP-5: bellows convolutions as stated, 0.6 pitch high', () => {
    const p = makeExpansionJoint('EJ', 8, 'P150', 7); expect(p.dims.convolutions.value).toBe(7); expect(p.dims.height.value).toBeCloseTo(0.6 * p.dims.pitch.value);
    expect(makeExpansionJoint('EJ', 8, 'P150', 7).dims.FF.value - makeExpansionJoint('EJ', 8, 'P150', 5).dims.FF.value).toBeCloseTo(2 * p.dims.pitch.value);
  });
  it('SW-PSP-1, -3, -11, -13: proportions follow the pipe', () => {
    const pd = pipeDims(4, 'P150'), f = designFlange(4, 'P150');
    expect(makeYStrainer('Y', 4, 'P150').dims.FF.value).toBeCloseTo(2 * (f.tf + f.hubLen + f.neckLen) + 2.5 * pd.OD);
    expect(makeConeStrainer('C', 4, 'P150').dims.ring.value).toBeLessThan(f.BC - f.d);       // the ring sits inside the bolts
    expect(makeLateral('L', 4, 'P150').dims.B.value).toBeCloseTo(2.7 * pd.OD + 2);
    const si = makeStubIn('S', 12, 4, 'P150'); expect(si.dims.padOD.value).toBeCloseTo(2 * pd.OD); expect(si.dims.padT.value).toBeCloseTo(pipeDims(12, 'P150').t);
    expect(makeSteamTrap('T', 0.75, 'P600', 'bucket').dims.FF.value).toBeGreaterThan(makeSteamTrap('T', 0.75, 'P600', 'disc').dims.FF.value);
  });
  it('SW-PSP-14: a spring hanger is a support, hung above its pipe', () => {
    const p = makeSpringHanger('SH', 8, 'P150', 36); expect(p.kind).toBe('SUPPORT'); expect(p.category).toBe('piping');
    const b = bbox(p); expect(b.mx[1]).toBeGreaterThan(36 + 14); expect(b.mn[1]).toBeCloseTo(-pipeDims(8, 'P150').OD / 2 - 0.375, 1);
  });
  it('bendPath eases every corner to the radius', () => {
    const pts = bendPath([[0, 0, 0], [0, 0, 40], [50, 0, 40]], 10, 6);
    expect(pts[1]).toEqual([0, 0, 30]); expect(pts[pts.length - 2][0]).toBeCloseTo(10); expect(pts[pts.length - 2][2]).toBeCloseTo(40);
    for (const q of pts.slice(1, -1)) expect(Math.hypot(q[0] - 10, q[2] - 30)).toBeCloseTo(10);
  });
});

describe('structural assemblies (SW-STA-*)', () => {
  const names = (p: ReturnType<typeof makePipeRack>) => buildGeometry(p).solids.map(s => s.name);
  it('SW-STA-1: sections come from the SW-PF-3 search; weight is the drawn steel, concrete not weighed', () => {
    expect(sec(8).w % 5).toBe(0); expect(sec(12, 60).w).toBeGreaterThan(sec(12, 10).w); expect(colSec(8, 100).dims.A).toBeGreaterThanOrEqual(100 / (0.45 * 36) - 0.35);
    expect(zReq(100, 48, 96)).toBeCloseTo(((100 * 4) / 12000) * 96 * 96 / 8 / 32.4, 6);
    const p = makeGoalPost('G', 144, 120), g = buildGeometry(p), steel = g.solids.filter(s => s.role !== 'concrete' && s.role !== 'grout').reduce((a, s) => a + signedVolume(s.mesh), 0);
    expect(p.category).toBe('structure'); expect(g.solids.some(s => s.role === 'concrete')).toBe(true); expect(p.weight.value).toBeCloseTo((steel * 490) / 1728, 0);
  });
  it('SW-STA-3: a pipe rack follows SW-RK-1..3', () => {
    const p = makePipeRack('R', { width: 240, tiers: [192, 264], bents: 3 });
    expect(p.dims.spacing.value).toBe(240); expect(p.dims.beamD.value).toBe(12); expect(p.dims.columnD.value).toBe(12); expect(p.dims.strutD.value).toBe(8);
    expect(makePipeRack('R', { width: 360, tiers: [240], bents: 2 }).dims.beamD.value).toBe(18);
    expect(names(p).some(n => n.startsWith('rod bracing'))).toBe(true);
  });
  it('SW-STA-4, -5: equal risers close the height; no flight rises more than 12 ft', () => {
    for (const h of [90, 120, 144]) { const f = stairFlight(h); expect(f.risers * f.rise).toBeCloseTo(h); expect(Math.abs(f.rise - 7.5)).toBeLessThan(0.45); expect(f.Lx).toBe((f.risers - 1) * 10); expect(f.D).toBeGreaterThanOrEqual(10); }
    expect(() => makeStairFlight('S', 150)).toThrow(/SW-SR-3/);
    for (const h of [200, 288, 400]) { const t = stairTower(h); expect(t.hf).toBeLessThanOrEqual(144); expect(t.flights * t.hf).toBeCloseTo(h); expect(t.flights).toBeGreaterThanOrEqual(2); }
    expect(makeStairTower('T', 288).dims.flights.value).toBe(2);
  });
  it('SW-STA-6: platform floor beams at 4 ft at most, guardrail 42 in, ladder without a cage up to 20 ft', () => {
    const p = makePlatform('P', { L: 240, W: 96, elevation: 144 }); expect(p.dims.beamSpacing.value).toBeLessThanOrEqual(48); expect(p.dims.rail.value).toBe(42); expect(p.dims.beamD.value).toBeGreaterThanOrEqual(6);
    expect(names(p).some(n => n.startsWith('cage'))).toBe(false); expect(names(makePlatform('P', { L: 240, W: 96, elevation: 300 })).some(n => n.startsWith('cage'))).toBe(true);
  });
  it('SW-STA-7 (SW-LD-3): a ladder is caged above 20 ft of climb', () => {
    expect(makeFixedLadder('L', 240).dims.cage.value).toBe(0); expect(makeFixedLadder('L', 252).dims.cage.value).toBe(30);
    const z = (p: ReturnType<typeof makeFixedLadder>) => Math.max(...buildGeometry(p).solids.flatMap(s => Array.from(s.mesh.positions).filter((_, i) => i % 3 === 2)));
    expect(z(makeFixedLadder('L', 144))).toBeCloseTo(144 + 42, 3);
  });
  it('SW-STA-8: bridge panels near square; chord area carries the chord force', () => {
    const p = makePipeBridge('B', { span: 720, width: 120, depth: 96, clear: 216 }); expect(p.dims.panels.value).toBe(8); expect(p.dims.panel.value).toBeCloseTo(90);
    expect(p.dims.chordForce.value).toBeCloseTo((((40 * 120) / 12 / 1000 / 12) * 720 * 720) / 8 / 96, 6);
    const heavy = makePipeBridge('B', { span: 1440, width: 240, depth: 96, clear: 216 }); expect(heavy.dims.chordW.value).toBeGreaterThan(p.dims.chordW.value);
    expect((heavy.dims.chordW.value * 144) / 490).toBeGreaterThanOrEqual(heavy.dims.chordForce.value / (0.9 * 36) - 1e-6);
  });
  it('SW-STA-9: the casing covers the column by 2 in and its concrete weight is stated', () => {
    const p = makeFireproofedColumn('F', 14, 90, 240, 180), c = buildGeometry(p).solids.find(s => s.role === 'concrete' && s.name.startsWith('fireproofing'))!;
    const xs = Array.from(c.mesh.positions).filter((_, i) => i % 3 === 0); expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(14); expect(p.dims.cover.value).toBe(2); expect(p.dims.casingWeight.value).toBeGreaterThan(1000);
  });
  it('SW-STA-10: a T-support is braced only when its arms pass 24 in', () => {
    expect(names(makeTSupport('T', 120, 96)).some(n => n.startsWith('knee'))).toBe(true); expect(names(makeTSupport('T', 120, 48)).some(n => n.startsWith('knee'))).toBe(false);
    expect(makeGoalPost('G', 240, 120).dims.D.value).toBe(12);
  });
  it('SW-STA-11: the monorail beam grows with its capacity and span', () => {
    const a = makeMonorail('M', { span: 240, width: 96, hookBeam: 168, tons: 2 }), b = makeMonorail('M', { span: 240, width: 96, hookBeam: 168, tons: 30 });
    expect(a.dims.D.value).toBe(16); expect(b.dims.w.value).toBeGreaterThan(a.dims.w.value); expect(a.dims.capacity.value).toBe(4);
  });
  it('SW-STA-12: floors are stair landings; columns carry their floors', () => {
    const p = makeProcessStructure('S', { L: 480, W: 240, floors: [144, 288] }); expect(p.dims.floorLoad.value).toBe(0.25); expect(p.dims.columnLoad.value).toBeCloseTo(100); expect((p.dims.columnW.value * 144) / 490).toBeGreaterThanOrEqual(100 / 16.2 - 0.35);
    expect(p.dims.beamSpacing.value).toBeLessThanOrEqual(48); expect(p.dims.grid.value).toBeLessThanOrEqual(240);
    expect(() => makeProcessStructure('S', { L: 480, W: 240, floors: [120, 288] })).toThrow(/SW-STA-12/);
    expect(makeProcessStructure('S', { L: 480, W: 240, floors: [144, 288], floorPsf: 100 }).dims.girderW.value).toBeLessThan(p.dims.girderW.value);
  });
});

describe('further process equipment (SW-EQC-45..65)', () => {
  const solidsOf = (p: ReturnType<typeof makeSphere>) => buildGeometry(p).solids;
  it('SW-EQC-45: drum thickness, connections and boot follow the diameter', () => {
    const p = makeHorizontalDrum({ tag: 'D', ID: 96, L: 288, boot: true }), q = makeHorizontalDrum({ tag: 'D', ID: 96, L: 288 });
    expect(p.dims.t.value).toBe(1); expect(makeHorizontalDrum({ tag: 'D', ID: 24, L: 96 }).dims.t.value).toBe(0.375); expect(p.dims.inlet.value).toBe(seriesUp(12)); expect(p.dims.outlet.value).toBe(seriesUp(8)); expect(p.dims.saddle.value).toBeCloseTo(0.2 * 288);
    expect(p.dims.bootD.value).toBe(32); expect(p.dims.bootL.value).toBe(48); expect(q.dims.bootD).toBeUndefined(); expect(q.dims.centreline.value).toBeCloseTo(49 + 36); expect(p.dims.centreline.value).toBeGreaterThan(q.dims.centreline.value + 48);
    expect(makeHorizontalDrum({ tag: 'D', ID: 36, L: 120 }).dims.manway.value).toBe(20);
  });
  it('SW-EQC-46, -47, -50: bullet, desalter and deaerator', () => {
    const b = makeBullet({ tag: 'V', ID: 120, L: 720 }); expect(b.dims.t.value).toBeCloseTo(Math.ceil((120 / 72) * 8) / 8); expect(b.dims.walkway.value).toBeCloseTo(432); expect(solidsOf(b).some(s => s.name.includes('ladder cage'))).toBe(true);
    const d = makeDesalter({ tag: 'D', ID: 144, L: 600 }); expect(d.dims.transformer.value).toBe(36); expect(d.dims.header.value).toBe(seriesUp(18)); expect(solidsOf(d).filter(s => s.name === 'transformer tanks').length).toBe(2);
    const a = makeDeaerator({ tag: 'DA', ID: 96, L: 240, centreline: 108 }); expect(a.dims.domeD.value).toBe(48); expect(a.dims.domeH.value).toBe(72);
    const top = Math.max(...solidsOf(a).flatMap(s => Array.from(s.mesh.positions).filter((_, i) => i % 3 === 1))); expect(top).toBeGreaterThan(49 + 72);
  });
  it('SW-EQC-48: a sphere stands on columns that grow in number with its size', () => {
    const p = makeSphere({ tag: 'T', D: 600 }); expect(p.dims.t.value).toBe(3); expect(p.dims.columns.value).toBe(13); expect(p.dims.columnOD.value).toBe(38); expect(p.dims.clear.value).toBe(100);
    expect(makeSphere({ tag: 'T', D: 240 }).dims.columns.value).toBe(6); expect(makeSphere({ tag: 'T', D: 240 }).dims.clear.value).toBe(60); expect(makeSphere({ tag: 'T', D: 240 }).dims.t.value).toBe(1.25);
    const shell = solidsOf(p).find(s => s.name === 'shell')!; expect(signedVolume(shell.mesh) / ((4 / 3) * Math.PI * (303 ** 3 - 300 ** 3))).toBeCloseTo(1, 2);
  });
  it('SW-EQC-49: a cooling tower is weighed without its basin', () => {
    const p = makeCoolingTower({ tag: 'CT', cells: 2, cellL: 360, cellW: 360, H: 300, riserNPS: 24 }), g = solidsOf(p), all = g.reduce((a, s) => a + signedVolume(s.mesh), 0);
    expect(p.dims.stackD.value).toBeCloseTo(216); expect(p.dims.inlet.value).toBeCloseTo(90); expect(g.filter(s => s.name === 'fan motor: motor frame').length).toBe(2); expect(g.some(s => s.role === 'concrete')).toBe(true); expect(p.weight.value).toBeLessThan((all * 490) / 1728 / 2);
  });
  it('SW-EQC-53, -54: heaters count their burners and tubes by rule', () => {
    const c = makeCabinHeater({ tag: 'H', L: 480, W: 192, H: 240 }); expect(c.dims.burners.value).toBe(5); expect(c.dims.throat.value).toBeCloseTo(23.04); expect(c.dims.convW.value).toBeCloseTo(76.8); expect(c.dims.stackH.value).toBe(360);
    const r = makeReformer({ tag: 'H', L: 480, W: 384, H: 480 }); expect(r.dims.rows.value).toBe(4); expect(r.dims.tubes.value).toBe(4 * 37); expect(r.dims.burners.value).toBe(5 * 9);
  });
  it('SW-EQC-55, -58, -59, -60: units', () => {
    const a = makePsaUnit({ tag: 'A', ID: 72, TT: 216 }); expect(a.dims.beds.value).toBe(4); expect(a.dims.pitch.value).toBeCloseTo(1.75 * 73.5); expect(makePsaUnit({ tag: 'A', ID: 72, TT: 216, beds: 6 }).dims.beds.basis.kind).toBe('drawing');
    const i = makeIncinerator({ tag: 'F', D: 96, L: 288, stackH: 1200 }); expect(i.dims.stackD.value).toBeCloseTo(57.6); expect(i.dims.burner.value).toBeCloseTo(28.8);
    const e = makePrecipitator({ tag: 'EP', L: 432, W: 288, H: 360 }); expect(e.dims.fields.value).toBe(3); expect(e.dims.hoppers.value).toBe(6); expect(e.dims.hopperH.value).toBeCloseTo(0.6 * 144);
    const v = makeVentSilencer('SL', 48); expect(v.dims.H.value).toBe(144); expect(v.dims.inlet.value).toBe(seriesUp(16));
  });
  it('SW-EQC-62, -65: tall vessels keep their platforms within 15 ft', () => {
    const r = makeMultiBedReactor({ tag: 'R', ID: 120, TT: 720, t: 4, skirtH: 120 }); expect(r.dims.beds.value).toBe(3); expect(r.dims.bedH.value).toBe(240); expect((120 + 32 + 720 - 6) / r.dims.platforms.value).toBeLessThanOrEqual(180);
    expect(solidsOf(r).some(s => s.name.startsWith('quench nozzle 2'))).toBe(true); expect(solidsOf(r).some(s => s.name.startsWith('quench nozzle 3'))).toBe(false);
    const c = makeSwagedTower({ tag: 'C', sections: [[120, 240], [240, 480], [144, 300]], skirtH: 180 }); expect(c.dims.cone1.value).toBeCloseTo(60 / Math.tan(Math.PI / 6)); expect(c.dims.cone2.value).toBeCloseTo(48 / Math.tan(Math.PI / 6)); expect(c.dims.overhead.value).toBe(24);
    const ps = solidsOf(c).filter(s => /^platform \d+: platform grating/.test(s.name)).map(s => Math.max(...Array.from(s.mesh.positions).filter((_, i) => i % 3 === 2))).sort((x, y) => x - y);
    expect(ps.length).toBe(c.dims.platforms.value); expect(ps[0]).toBeLessThanOrEqual(260); for (let k = 1; k < ps.length; k++) expect(ps[k] - ps[k - 1]).toBeLessThanOrEqual(180.01);
    expect(() => makeSwagedTower({ tag: 'C', sections: [[120, 240], [240, 480]] as never, skirtH: 180 })).toThrow(/SW-EQC-65/);
  });
  it('SW-EQC-66, -67 and the options a plant states: turbine-driven compressor, loading station, column access, ducts', () => {
    const k = makeTurbineCompressor({ tag: 'K', skidW: 84, skidL: 162, casingD: 30, wheelD: 30 }); expect(k.dims.shaftY.value).toBe(1 + 0.9 * 30 + 4); expect(k.dims.least.value).toBeLessThanOrEqual(162);
    expect(solidsOf(k).some(q => q.name === 'turbine: casing')).toBe(true); expect(solidsOf(k).some(q => /motor frame/.test(q.name))).toBe(false);
    const ls = makeLoadingStation({ tag: 'X', NPS: 3 }); expect(ls.dims.H.value).toBe(144); expect(ls.dims.reach.value).toBe(96); expect(solidsOf(ls).some(q => q.name === 'loading arm riser')).toBe(true);
    // a column's davit and platform arc as stated; unchanged where they are not
    const base = { tag: 'C', ID: 72, t: 0.625, TT: 720, skirtH: 96, trays: 20 }, a = makePlatformedColumn(base), b = makePlatformedColumn({ ...base, platformArc: 180, davitAngle: 0 }), box = (p: typeof a, re: RegExp) => { const q = solidsOf(p).filter(v => re.test(v.name)); return [0, 1].map(ax => Math.max(...q.flatMap(v => Array.from(v.mesh.positions).filter((_, i) => i % 3 === ax)))); };
    expect(JSON.stringify(makePlatformedColumn(base).dims)).toBe(JSON.stringify(a.dims)); expect(a.dims.platformArc).toBeUndefined(); expect(b.dims.platformArc.value).toBe(180);
    expect(Math.min(...solidsOf(b).filter(v => /^platform \d+: platform grating/.test(v.name)).flatMap(v => Array.from(v.mesh.positions).filter((_, i) => i % 3 === 0)))).toBeGreaterThan(-2);   // a half ring about +x
    expect(box(b, /^davit arm/)[0]).toBeGreaterThan(box(a, /^davit arm/)[0]);                                    // swung outward
    // a flue gas cooler's ducts as stated
    const c0 = makeFlueGasCooler({ tag: 'E', D: 96, L: 240 }), c1 = makeFlueGasCooler({ tag: 'E', D: 96, L: 240, ducts: { outletOD: 24, plain: ['outlet'] } });
    expect(solidsOf(c0).filter(q => /duct flange/.test(q.name)).length).toBe(2); expect(solidsOf(c1).filter(q => /duct flange/.test(q.name)).length).toBe(1);
    const od = (p: typeof c0) => { const q = solidsOf(p).find(v => v.name === 'outlet duct')!; return 2 * Math.max(...Array.from(q.mesh.positions).filter((_, i) => i % 3 === 0)); }; expect(od(c0)).toBeCloseTo(0.5 * 96 + 1.5, 1); expect(od(c1)).toBeCloseTo(24, 1);
    expect(solidsOf(makeSulfurPit('X', { L: 384, W: 180, D: 96, noDischarge: true })).length).toBe(solidsOf(makeSulfurPit('X', { L: 384, W: 180, D: 96 })).length);
  }, 120_000);
  it('SW-EQC-52 with stated sizes, and SW-EQC-68: the vacuum ejector set', () => {
    // an ejector with nothing stated is as it was; a stated discharge ends the diverging cone at its diameter, a stated steam size is the nozzle's
    const plain = makeEjector('J', 6), sized = makeEjector('J', 8, { dischargeNPS: 6, motiveNPS: 2 }), box = (p: typeof plain, name: string) => { const q = solidsOf(p).find(v => v.name === name)!, P = Array.from(q.mesh.positions); return { r: Math.max(...P.filter((_, i) => i % 3 === 0)), z1: Math.max(...P.filter((_, i) => i % 3 === 2)) }; };
    expect(plain.designation).toBe('Steam jet ejector, 6" suction'); expect(plain.dims.discharge).toBeUndefined(); expect(plain.dims.motive.value).toBe(2); expect(box(plain, 'diffuser outlet cone').r).toBeCloseTo(pipeDims(6, 'P150').OD / 2, 1);
    expect(sized.designation).toBe('Steam jet ejector, 8" suction, 6" discharge'); expect(sized.dims.discharge.value).toBe(6); expect(box(sized, 'diffuser outlet cone').r).toBeCloseTo(pipeDims(6, 'P150').OD / 2, 1); expect(sized.dims.overall.value).toBeGreaterThan(10 * pipeDims(8, 'P150').OD);
    const inp = { tag: 'J', steam: 6, water: 12, stages: [{ suction: 48, discharge: 42, motive: 6, ID: 60, t: 0.5, vent: 8, water: 12, drain: 3 }, { suction: 8, discharge: 6, motive: 2, ID: 18, t: 0.375, vent: 4, water: 3, drain: 3 }, { suction: 4, discharge: 3, motive: 2, ID: 12, t: 0.375, vent: 0, water: 2, drain: 3 }] };
    const set = makeEjectorSet(inp), L = ejectorSetLayout(inp), so = solidsOf(set), ext = (re: RegExp) => { const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity]; for (const q of so) if (re.test(q.name)) for (let i = 0; i < q.mesh.positions.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], q.mesh.positions[i + a]); mx[a] = Math.max(mx[a], q.mesh.positions[i + a]); } return { mn, mx, mid: mn.map((v, a) => (v + mx[a]) / 2) }; };
    // the condensers side by side on the 6 in module, 30 in and 18 in between body flanges at least; saddles in one line on the steel
    expect(L.x[0]).toBe(0); for (const [k, x] of L.x.entries()) { expect(x % 6).toBe(0); if (k) { const gap = x - L.x[k - 1] - L.half[k] - L.half[k - 1]; expect(gap).toBeGreaterThanOrEqual(k === 1 ? 30 : 18); expect(gap).toBeLessThan((k === 1 ? 30 : 18) + 6); } }
    for (let k = 1; k <= 3; k++) { const sd = ext(new RegExp(`^condenser ${k}: saddle base`)); expect(sd.mn[1]).toBeCloseTo(0, 6); expect(ext(new RegExp(`^condenser ${k}: shell$`)).mn[1]).toBeCloseTo(48, 6); expect(sd.mid[2]).toBeCloseTo(120, 6); }
    // what a plant connects to stands on the 6 in module from the first condenser's axis and the tubesheet line: the first suction on top, the drains under their boots, steam and water below the steel
    const at = (re: RegExp) => ext(re).mid, onGrid = (v: number) => expect(Math.abs(v / 6 - Math.round(v / 6))).toBeLessThan(1e-6);
    const chamber = at(/^stage 1 ejector: suction chamber$/); expect(chamber[0]).toBeCloseTo(0, 6); expect(L.suctionZ % 6).toBe(0); expect(ext(/^stage 1 ejector: suction nozzle: flange ring$/).mid[2]).toBeCloseTo(L.suctionZ, 3);
    for (let k = 1; k <= 3; k++) { const b = ext(new RegExp(`^condenser ${k}: condensate boot$`)); expect(b.mid[0]).toBeCloseTo(L.x[k - 1], 6); expect(b.mid[2]).toBeCloseTo(L.drainZ, 6); expect(b.mn[1]).toBeCloseTo(36, 6); }
    for (const leg of [/^motive steam leg$/, /^cooling water supply leg$/, /^cooling water return leg$/]) { const b = ext(leg); onGrid(b.mid[0]); onGrid(b.mid[2]); expect(b.mn[1]).toBeCloseTo(-24, 6); expect(b.mid[0]).toBeGreaterThan(L.half[0]); }
    expect(at(/^cooling water return leg$/)[0] - at(/^cooling water supply leg$/)[0]).toBeCloseTo(42, 6);
    // the later ejectors stand on their condensers' inlets, discharge down; the first lies above its condenser and overhangs its rear head, on two frames
    for (const k of [2, 3]) { const ch = ext(new RegExp(`^stage ${k} ejector: suction chamber$`)), cone = ext(new RegExp(`^stage ${k} ejector: diffuser outlet cone$`)), shell = ext(new RegExp(`^condenser ${k}: shell$`)); expect(ch.mn[1]).toBeGreaterThan(cone.mx[1] - 1e-6); expect(cone.mn[1]).toBeGreaterThan(shell.mx[1]); expect(ch.mid[0]).toBeCloseTo(L.x[k - 1], 3); }
    expect(ext(/^stage 1 ejector: suction chamber$/).mn[2]).toBeGreaterThan(ext(/^condenser 1: rear head$/).mx[2]); expect(so.filter(q => /^ejector frame \d: posts/.test(q.name)).length).toBe(2);
    // each straight and each bend of the pipework is a solid of its own; in a plant the seven connections' own flanges are left off, and only those
    expect(so.filter(q => /^vent 1: (run|bend) \d$/.test(q.name)).length).toBe(7);
    const off = so.filter(q => /nozzle/.test(q.name)).map(q => q.name.split(':')[0].replace(/ flange.*$/, '')); expect([...new Set(off)].sort()).toEqual(['condensate 1 nozzle', 'condensate 2 nozzle', 'cooling water in nozzle', 'cooling water out nozzle', 'motive steam nozzle', 'outlet nozzle', 'stage 1 ejector']);
    expect(so.some(q => /stub|blind flange|flange face/.test(q.name))).toBe(false);
    expect(set.weight.value).toBeGreaterThan(60000); expect(set.dims.top.value).toBeCloseTo(L.top, 6);
  }, 120_000);
  it('SW-EQC-51, -52, -61, -63, -64, -56: machines and the rest', () => {
    expect(makeKettleReboiler({ tag: 'E', bundleD: 30, tubeL: 192 }).dims.shellD.value).toBe(48); expect(makeEjector('J', 6).dims.diverging.value).toBeCloseTo(5 * pipeDims(6, 'P150').OD);
    const t = makeSteamTurbine('ST', 24); expect(t.dims.casingD.value).toBe(36); expect(t.dims.inlet.value).toBe(4); expect(t.dims.exhaust.value).toBe(8);
    expect(makeDuctRun('DU', 48, 36).dims.blades.value).toBe(4); expect(makeDuctRun('DU', 48, 40).dims.blades.value).toBe(5);
    const p = makeInlinePump({ tag: 'P', NPS: 4, motorD: 14 }); expect(p.dims.casingD.value).toBeCloseTo(2.4 * pipeDims(4, 'P150').OD); expect(solidsOf(p).some(s => s.name === 'feet')).toBe(false);
    const f = makeSulfurFurnace({ tag: 'F', D: 84, furnaceL: 240, boilerL: 240 }); expect(f.dims.burner.value).toBeCloseTo(25.2); expect(solidsOf(f).some(s => s.name.includes('fire tubes'))).toBe(false); expect(solidsOf(f).some(s => s.name.includes('steam drum'))).toBe(true);
  });
});

describe('further civil items (SW-CIV-17..28)', () => {
  const parts = [makePileCap('PC', { pileL: 360 }), makePileCap('PC9', { perSide: 3, pileD: 18, pileL: 240 }), makeRetainingWall('RW', { H: 120, L: 240 }), makeManhole('MH', { depth: 96 }), makeSleeper('SL', { L: 120 }), makeMachineBlock('MB', { weightKips: 40, baseL: 144, baseW: 72, reciprocating: true }), makeMachineBlock('MB2', { weightKips: 20, baseL: 96, baseW: 60 }),
    makeTableTop('TT', { L: 360, W: 192, H: 216 }), makeSeparatorBasin('SB', { w: 72, d: 72, L: 480 }), makeSulfurPit('SP', { L: 240, W: 120, D: 96 }), makeBoxCulvert('BC', { span: 72, rise: 48, L: 240 }), makeDuctBank('DB', { rows: 3, cols: 3, L: 240 })];
  it('SW-CIV-15: every bar in the list is drawn, and the weight is concrete plus bars', () => {
    for (const p of parts) {
      const list = p.extra!.bars as Bar[], drawn = p.extra!.barsDrawn as number[];
      expect(drawn.length, p.id).toBe(list.length); list.forEach((b, i) => expect(drawn[i], `${p.id} ${b.note}`).toBe(b.count));
      expect(p.weight.value).toBeCloseTo(p.dims.concreteWeight.value + p.dims.barWeight.value, 3); expect(p.category).toBe('civil');
      for (const s of buildGeometry(p).solids) { expect(isClosed(s.mesh), `${p.id} ${s.name}`).toBe(true); expect(signedVolume(s.mesh)).toBeGreaterThan(0); }
    }
  });
  it('SW-CIV-17: a mat has a bar every spacing each way', () => {
    const m = planeMat(5, [0, 0, 0], [1, 0, 0], [0, 1, 0], 120, 60, 'test'); expect(m.list[0].count).toBe(Math.ceil(56 / 12) + 1); expect(m.list[1].count).toBe(Math.ceil(116 / 12) + 1); expect(m.list[0].length).toBe(116); expect(m.list[1].length).toBe(56);
  });
  it('SW-CIV-18: the cap is as deep as its piles are apart', () => {
    const p = parts[0], q = parts[1]; expect(p.dims.piles.value).toBe(4); expect(p.dims.spacing.value).toBe(48); expect(p.dims.B.value).toBe(48 + 16 + 18); expect(p.dims.t.value).toBe(48); expect(q.dims.piles.value).toBe(9); expect(q.dims.spacing.value).toBe(54); expect(q.dims.t.value).toBe(54); expect(q.dims.pileD.basis.kind).toBe('drawing');
  });
  it('SW-CIV-19: wall proportions follow the retained height', () => {
    const p = parts[2]; expect(p.dims.stem.value).toBe(12); expect(p.dims.base.value).toBe(84); expect(p.dims.toe.value).toBe(28); expect(p.dims.heel.value).toBe(44); expect(makeRetainingWall('R', { H: 180, L: 120 }).dims.stem.value).toBe(18);
  });
  it('SW-CIV-20, -21, -22: basin, manhole and sleeper', () => {
    const c = makeCatchBasin('CB'); expect(c.dims.d.value).toBe(36); expect(c.dims.outlet.value).toBe(8); expect(buildGeometry(c).solids.some(s => s.role === 'pipe')).toBe(true);
    const m = parts[3]; expect(m.dims.ID.value).toBe(48); expect(m.dims.rungs.value).toBe(7); expect(buildGeometry(m).solids.filter(s => s.role === 'casting').length).toBe(2);
    expect(parts[4].dims.footingW.value).toBe(24); expect(buildGeometry(parts[4]).solids.some(s => s.name.startsWith('wear strip'))).toBe(true);
  });
  it('SW-CIV-23: the block outweighs its machine by the factor and stays squat', () => {
    for (const p of [parts[5], parts[6]]) { expect(p.dims.concreteWeight.value).toBeGreaterThanOrEqual(p.dims.factor.value * p.dims.W.value * 1000 * 0.98); expect(p.dims.depth.value).toBeLessThanOrEqual(0.6 * p.dims.B.value + 1e-6); expect(p.dims.depth.value).toBeGreaterThanOrEqual(36); }
    expect(parts[5].dims.factor.value).toBe(5); expect(parts[6].dims.factor.value).toBe(3);
  });
  it('SW-CIV-24: table-top columns and depths', () => {
    const p = parts[7]; expect(p.dims.columns.value).toBe(6); expect(p.dims.column.value).toBe(30); expect(p.dims.deck.value).toBe(42); expect(makeTableTop('T', { L: 240, W: 144, H: 144 }).dims.columns.value).toBe(4);
  });
  it('SW-CIV-25..28: basin, pit, culvert and duct bank', () => {
    expect(parts[8].dims.weir.value).toBe(60); expect(parts[8].dims.channels.value).toBe(2); expect(buildGeometry(parts[8]).solids.filter(s => s.name === 'outlet weir wall').length).toBe(2);
    expect(parts[9].dims.roof.value).toBe(10); expect(buildGeometry(parts[9]).solids.some(s => s.name.startsWith('steam coil'))).toBe(true);
    expect(parts[10].dims.t.value).toBe(8); expect(makeBoxCulvert('B', { span: 144, rise: 96, L: 240 }).dims.t.value).toBe(12);
    const d = parts[11], Wd = d.dims.W.value, Hd = d.dims.H.value; expect(Wd).toBe(25.5); expect((d.extra!.concreteVolume as number) / ((Wd * Hd - 9 * Math.PI * 2.25 * 2.25) * 240)).toBeCloseTo(1, 2);
  });
});
