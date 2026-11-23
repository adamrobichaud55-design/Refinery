/** Civil and concrete catalogue (DESIGN_BASIS.md §65, SW-CIV-*) and equipment catalogue (§66, SW-EQC-*): every part builds,
 *  its solids are closed with positive volume, every dimension carries a basis written in the design basis, and the
 *  quantity rules hold. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  makeFooting, makePedestal, makeEquipmentPad, makeSlab, makeOctagonFoundation, makeRingWall, makeDrilledPier, makeGradeBeam, makeGroutBed, makeCurb, makePaving, makeTrench, makeSump, makeDike,
  barArea, barDiameter, octagonArea, octagon, type Bar,
  makeNozzle, makeManway, makeLiftingLug, makeVesselLegs, makeSupportLugs, makeInsulationRings, makeDavit, makeMotor, makeColumn, makeReactor, makeAirCooler, makeCompressorPackage, makeRecipCompressor,
  makeBlower, makeFiredHeater, makeAgitatedTank, makeFilter, makeDustCollector, makeCyclone, makeScrewConveyor, makeBucketElevator, makeSilo, makeSumpPump, makeHairpin, makePlateExchanger,
  makeDressedVessel, makeProcessPump, makeShellTubeExchanger, MOTOR_SHAFT,
} from '../src/catalogue';
import { buildGeometry } from '../src/geometry/partGeometry';
import { isClosed, signedVolume } from '../src/geometry/mesh';
import { area } from '../src/geometry/polygon';
import { ruleIdsOf } from '../src/core/basis';
import { K } from '../src/core/constants';
import type { PartSpec } from '../src/catalogue';

const basisDoc = readFileSync(new URL('../DESIGN_BASIS.md', import.meta.url), 'utf8');
const definedRules = new Set([...basisDoc.matchAll(/`(SW-[A-Z]+-\d+[a-z]?)`/g)].map(m => m[1]));
const definedConstants = new Set([...basisDoc.matchAll(/`(K-\d+)`/g)].map(m => m[1]));

const civil: PartSpec[] = [
  makeFooting('F1', { loadKips: 60, pedestalSide: 24 }), makeFooting('F2', { loadKips: 200, bearingKsf: 2, pedestalSide: 30 }),
  makePedestal('PD1', { plateN: 16, plateB: 14, height: 36 }), makePedestal('PD2', { plateN: 10, plateB: 10, height: 6 }),
  makeEquipmentPad('PAD1', { baseW: 108, baseL: 108 }), makeEquipmentPad('PAD2', { baseW: 30, baseL: 72, pump: true }),
  makeSlab('SL1', { w: 480, L: 1200 }), makeSlab('SL2', { w: 240, L: 240, t: 8, thickenedEdge: false }),
  makeOctagonFoundation('OF1', { baseRingOD: 85, weightKips: 60, pedestalH: 30 }), makeRingWall('RW1', { tankD: 144 }), makeRingWall('RW2', { tankD: 480, fillPcf: 110 }),
  makeDrilledPier('DP1', { D: 24, loadKips: 150 }), makeDrilledPier('DP2', { D: 12, loadKips: 30, endBearingKsf: 20, frictionKsf: 1 }),
  makeGradeBeam('GB1', { L: 240 }), makeGroutBed('GR1', 16, 14), makeCurb('CB1', 120), makePaving('PV1', 240, 480),
  makeTrench('TR1', { L: 360 }), makeSump('SU1'), makeDike('DK1', { planL: 1200, planW: 720, tanks: [{ D: 144, H: 264 }, { D: 144, H: 264 }] }),
];
const equipment: PartSpec[] = [
  makeNozzle('N1', { NPS: 4, cls: 'P150', shellT: 0.5 }), makeNozzle('N2', { NPS: 2, cls: 'P300', shellT: 0.5, projection: 10 }),
  makeManway('MW1', { D: 24, cls: 'P150', shellT: 0.5 }), makeLiftingLug('LL1', 0.5, 20), makeVesselLegs('LG1', { ID: 36, clearance: 30 }), makeSupportLugs('SL1', 25), makeInsulationRings('IR1', 37, 216), makeDavit('DV1'),
  makeMotor('M1', 18), makeColumn({ tag: 'C-301', ID: 72, t: 0.5, TT: 480, skirtH: 72, trays: 20, insulated: true }), makeReactor({ tag: 'R-301', ID: 72, t: 0.5, TT: 216, skirtH: 48 }),
  makeAirCooler({ tag: 'E-305', W: 96, L: 240, fans: 2, legH: 120 }), makeCompressorPackage({ tag: 'K-301', skidW: 96, skidL: 240, casingD: 36, motorD: 36 }), makeRecipCompressor({ tag: 'K-302', frameL: 96, bore: 8, motorD: 30 }),
  makeBlower({ tag: 'B-301', wheelD: 36, motorD: 18 }), makeFiredHeater({ tag: 'H-301', D: 120, H: 240, stackH: 360 }), makeAgitatedTank({ tag: 'T-305', ID: 72, t: 0.375, TT: 96, skirtH: 36, motorD: 14 }),
  makeFilter({ tag: 'F-301', ID: 24, t: 0.375, TT: 48, clearance: 30 }), makeDustCollector({ tag: 'D-305', W: 96, L: 120, H: 120, legH: 60, outlet: 12 }), makeCyclone({ tag: 'S-305', D: 48 }),
  makeScrewConveyor({ tag: 'J-301', D: 12, L: 240, motorD: 14 }), makeBucketElevator({ tag: 'J-302', W: 24, H: 480, motorD: 14 }), makeSilo({ tag: 'R-305', D: 96, H: 240, outletNPS: 8, outletH: 72 }),
  makeSumpPump({ tag: 'P-305', NPS: 4, cls: 'P150', columnL: 72, motorD: 14, plate: 24 }), makeHairpin({ tag: 'E-306', innerNPS: 2, outerNPS: 4, cls: 'P150', legL: 240 }), makePlateExchanger({ tag: 'E-307', plates: 80, W: 24, H: 60 }),
  makeDressedVessel({ tag: 'V-301', ID: 72, t: 0.5, TT: 216, skirtH: 48 }), makeProcessPump({ tag: 'P-301', suctionNPS: 4, dischargeNPS: 3, cls: 'P300', impellerD: 13, motorD: 16 }), makeShellTubeExchanger({ tag: 'E-301', ID: 36, t: 0.5, TT: 192, centreline: 72 }),
  makeNozzle('N3', { NPS: 6, cls: 'P150', shellT: 0.5, shellR: 36.5, blind: true }), makeManway('MW2', { D: 20, cls: 'P150', shellT: 0.5, shellR: 24.5 }),
];

for (const [name, parts] of [['civil catalogue (SW-CIV-*)', civil], ['equipment catalogue (SW-EQC-*)', equipment]] as const) describe(name, () => {
  for (const p of parts) it(`${p.designation}: builds, closed solids, bases written`, () => {
    const geo = buildGeometry(p);
    expect(geo.solids.length).toBeGreaterThan(0);
    for (const s of geo.solids) { expect(isClosed(s.mesh), `${p.id} ${s.name} closed`).toBe(true); expect(signedVolume(s.mesh), `${p.id} ${s.name} volume`).toBeGreaterThan(0); }
    expect(p.weight.value).toBeGreaterThan(0); expect(Number.isFinite(p.weight.value)).toBe(true);
    for (const id of [...ruleIdsOf(p.dims), ...(p.weight.basis.kind === 'rule' ? [p.weight.basis.id] : [])]) expect(definedRules.has(id), `rule ${id} in DESIGN_BASIS.md`).toBe(true);
    for (const d of Object.values(p.dims)) { expect(Number.isFinite(d.value), `${p.id} ${d.label}`).toBe(true); if (d.basis.kind === 'constant') expect(definedConstants.has(d.basis.id)).toBe(true); expect(d.basis.kind).not.toBe('regulation'); }
    expect(p.category).toBe(name.startsWith('civil') ? 'civil' : 'equipment');
  });
});

describe('civil quantities (SW-CIV-1, -3, -7, -8, -14, -15)', () => {
  it('a bar #n is n/8 in; its weight is area × length × steel density', () => {
    expect(barDiameter(5)).toBe(5 / 8); expect(barArea(8)).toBeCloseTo(Math.PI / 4, 9);
    const f = makeFooting('F', { loadKips: 60, pedestalSide: 24 }), b = (f.extra!.bars as Bar[])[0];
    expect(b.weight).toBeCloseTo(b.count * b.length * barArea(5) * K.STEEL_DENSITY_LB_IN3, 6);
  });
  it('footing: plan from bearing with 1.1 P, thickness = projection (45° spread), weight = concrete + bars', () => {
    const f = makeFooting('F', { loadKips: 60, pedestalSide: 24 });
    const B = f.dims.B.value; expect(B).toBeGreaterThanOrEqual(Math.sqrt((1.1 * 60) / 3) * 12); expect(B % 6).toBe(0);
    expect(f.dims.t.value).toBeGreaterThanOrEqual((B - 24) / 2); expect(f.dims.t.value % 3).toBe(0);
    expect(f.dims.volume.value).toBeCloseTo((B * B * f.dims.t.value) / 46656, 6);
    expect(f.weight.value).toBeCloseTo(f.dims.concreteWeight.value + f.dims.barWeight.value, 6);
    expect(f.dims.concreteWeight.value).toBeCloseTo(B * B * f.dims.t.value * K.CONCRETE_DENSITY_LB_IN3, 3);
  });
  it('octagon: area 2(√2−1)F², footing not smaller than the pedestal + 24 in', () => {
    expect(area(octagon(100))).toBeCloseTo(octagonArea(100), 6);
    const o = makeOctagonFoundation('O', { baseRingOD: 85, weightKips: 60, pedestalH: 30 });
    expect(o.dims.Ff.value).toBeGreaterThanOrEqual(o.dims.Fp.value + 24); expect(o.dims.Fp.value).toBe(98);
  });
  it('ring wall: at least four hoop bars, more when the tank is large', () => {
    expect(makeRingWall('R', { tankD: 144 }).dims.hoops.value).toBe(4);
    expect(makeRingWall('R', { tankD: 1200 }).dims.hoops.value).toBeGreaterThanOrEqual(4);
  });
  it('dike: holds 1.1 × the largest tank within 18 to 72 in', () => {
    const d = makeDike('D', { planL: 1200, planW: 720, tanks: [{ D: 144, H: 264 }, { D: 144, H: 264 }] });
    expect(d.dims.holds.value).toBeGreaterThanOrEqual(1.1); expect(d.dims.H.value).toBeGreaterThanOrEqual(18); expect(d.dims.H.value).toBeLessThanOrEqual(72);
  });
  it('pedestal: plate + 6 in each side to 2 in, minimum 12 in', () => {
    expect(makePedestal('P', { plateN: 16, plateB: 14, height: 36 }).dims.a.value).toBe(28);
    expect(makePedestal('P', { plateN: 4, plateB: 4, height: 6 }).dims.a.value).toBe(16);
  });
});

describe('equipment proportions (SW-EQC-*)', () => {
  it('nozzle: a pad only from 3 in up, projection 8 in by rule', () => {
    expect(makeNozzle('n', { NPS: 2, cls: 'P150', shellT: 0.5 }).dims.padOD.value).toBe(0);
    const n4 = makeNozzle('n', { NPS: 4, cls: 'P150', shellT: 0.5 }); expect(n4.dims.padOD.value).toBeGreaterThan(0); expect(n4.dims.projection.value).toBe(8);
  });
  it('lifting lug: hole 1 + W/40 to 1/8 in, width 4 d, height 3 d', () => {
    const l = makeLiftingLug('l', 0.5, 20); expect(l.dims.hole.value).toBe(1.5); expect(l.dims.w.value).toBe(6); expect(l.dims.h.value).toBe(4.5);
  });
  it('motor: length 1.6 D; column trays centred in the shell; reactor shell at least ID/48', () => {
    expect(makeMotor('m', 20).dims.L.value).toBeCloseTo(32, 9);
    const c = makeColumn({ tag: 'C', ID: 72, t: 0.5, TT: 480, skirtH: 72, trays: 20 }), trays = c.extra!.trays as number[];
    const bottomTL = 72 + 18.25, topTL = bottomTL + 480;
    expect(trays.length).toBe(20); expect(trays[0] - bottomTL).toBeCloseTo(topTL - trays[19], 6); expect(trays[1] - trays[0]).toBe(24);
    expect(makeReactor({ tag: 'R', ID: 96, t: 0.5, TT: 216, skirtH: 48 }).dims.t.value).toBe(2);
  });
  it('air cooler fan ring 0.9 W/n; cyclone cone at 60°; silo skirt reaches the cone rim', () => {
    expect(makeAirCooler({ tag: 'E', W: 96, L: 240, fans: 2, legH: 120 }).dims.fanD.value).toBeCloseTo(43.2, 9);
    const cy = makeCyclone({ tag: 'S', D: 48 }); expect(cy.dims.coneH.value).toBeCloseTo((24 - 6) * Math.tan(Math.PI / 3), 9);
    const si = makeSilo({ tag: 'R', D: 96, H: 240, outletNPS: 8, outletH: 72 }); expect(si.dims.skirtH.value).toBeCloseTo(72 + (48 - 4) * Math.tan(Math.PI / 3), 9);
  });
  it('weights come from the drawn steel (SW-EQ-7)', () => {
    for (const p of equipment) { const geo = buildGeometry(p); expect(p.weight.value).toBeCloseTo(geo.volume * K.STEEL_DENSITY_LB_IN3, 3); }
  });
});

describe('real detail (SW-DET-*)', () => {
  it('SW-DET-1: the drawn bars equal the bar list in count, for every civil part', () => {
    for (const p of civil) {
      const list = p.extra!.bars as Bar[], drawnCounts = p.extra!.barsDrawn as number[];
      expect(drawnCounts.reduce((a, b) => a + b, 0), p.designation).toBe(list.reduce((a, b) => a + b.count, 0));
    }
  });
  it('SW-DET-2: a chamfered pad holds less concrete than its square block, by the chamfer strips', () => {
    const pad = makeEquipmentPad('P', { baseW: 108, baseL: 108 }), w = 120, h = 6, vol = pad.extra!.concreteVolume as number;
    expect(vol).toBeLessThan(w * w * h); expect(w * w * h - vol).toBeLessThan(4 * w * 0.75 * 0.75);
  });
  it('SW-DET-3: a pedestal carries four anchor rods; an octagon the vessel\'s', () => {
    const names = (p: PartSpec) => (p.extra!.solids as { name: string }[]).map(s => s.name);
    expect(names(makePedestal('P', { plateN: 16, plateB: 14, height: 36 })).some(n => n.startsWith('anchor rods'))).toBe(true);
    expect(names(makeOctagonFoundation('O', { baseRingOD: 85, weightKips: 60, pedestalH: 30, rods: 12 })).some(n => n.startsWith('anchor rods 12'))).toBe(true);
  });
  it('SW-DET-5/-7: a dressed vessel has its manway, nozzles, seams, lugs and chairs, with bolting on closed joints', () => {
    const names = (makeDressedVessel({ tag: 'V', ID: 72, t: 0.5, TT: 216, skirtH: 48 }).extra!.solids as { name: string }[]).map(s => s.name);
    for (const want of ['weld seams', 'inlet nozzle', 'top nozzle', 'vent', 'drain', 'level connection', 'manway', 'lifting lug', 'nameplate', 'anchor chairs', 'skirt vent']) expect(names.some(n => n.startsWith(want)), want).toBe(true);
    expect(names.some(n => n.includes('studs and nuts'))).toBe(true);
    expect(names.some(n => n.startsWith('manway'))).toBe(true);
    expect((makeDressedVessel({ tag: 'V', ID: 30, t: 0.375, TT: 96, skirtH: 36 }).extra!.solids as { name: string }[]).some(s => s.name.startsWith('manway'))).toBe(false);
  });
  it('SW-DET-9/-10: motor fins by the 1.5 in rule; the pump and motor shafts line up', () => {
    expect(makeMotor('m', 18).dims.fins.value).toBe(Math.round((Math.PI * 18) / 1.5));
    const p = makeProcessPump({ tag: 'P', suctionNPS: 4, dischargeNPS: 3, cls: 'P300', impellerD: 13, motorD: 16 });
    expect(p.dims.shaftY.value).toBeGreaterThanOrEqual(2 + MOTOR_SHAFT(16));
  });
});
