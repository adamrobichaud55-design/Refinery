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
  makeTubeBundle, makeBundleExchanger, makePlatformedColumn, makeCatCracker, makeCokeDrums, makeStack, makeFlareStack, makeWetScrubber, makeSteamDrum, makeMudDrum, makeFlueGasCooler, makeBurner, makeEconomizer, makeWaterTubeBoiler, makeConeRoofTank, makeFloatingRoofTank, floorsThrough,
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

const units: PartSpec[] = [
  makeTubeBundle('TB', 24, 120), makeBundleExchanger({ tag: 'E-311', ID: 24, t: 0.375, TT: 144, centreline: 60 }), makePlatformedColumn({ tag: 'C-311', ID: 96, t: 0.625, TT: 960, skirtH: 96, trays: 36 }),
  makeCatCracker({ tag: 'R-401', regenD: 240, regenTT: 300, reactorD: 144, reactorTT: 240 }), makeCokeDrums({ tag: 'D-501', D: 288, TT: 720 }), makeStack('ST', 60, 1200), makeFlareStack({ tag: 'FL-1', D: 24, H: 1800 }), makeFlareStack({ tag: 'FL-2', D: 36, H: 2400, derrick: true }),
  makeWetScrubber({ tag: 'T-601', D: 120, H: 480 }), makeSteamDrum({ tag: 'SD', ID: 54, L: 240 }), makeMudDrum({ tag: 'MD', ID: 36, L: 240 }), makeFlueGasCooler({ tag: 'E-601', D: 48, L: 180 }), makeBurner('BR', 24), makeEconomizer('EC', 60, 72, 96),
  makeWaterTubeBoiler({ tag: 'B-601', steamID: 54, L: 240, centres: 180 }), makeConeRoofTank({ tag: 'T-701', D: 480, H: 384 }), makeFloatingRoofTank({ tag: 'T-702', D: 720, H: 480 }),
];
for (const [name, parts] of [['civil catalogue (SW-CIV-*)', civil], ['equipment catalogue (SW-EQC-*)', equipment], ['process units, boiler equipment and tanks (SW-EQC-27..44)', units]] as const) describe(name, () => {
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
  it('air cooler fan ring 0.9 W/n; cyclone cone at 60°; silo skirt ends where its inside face meets the cone (SW-EQC-22 as amended 2026-11-27)', () => {
    expect(makeAirCooler({ tag: 'E', W: 96, L: 240, fans: 2, legH: 120 }).dims.fanD.value).toBeCloseTo(43.2, 9);
    const cy = makeCyclone({ tag: 'S', D: 48 }); expect(cy.dims.coneH.value).toBeCloseTo((24 - 6) * Math.tan(Math.PI / 3), 9);
    const si = makeSilo({ tag: 'R', D: 96, H: 240, outletNPS: 8, outletH: 72 }); expect(si.dims.skirtH.value).toBeCloseTo(72 + (48 - 4) * Math.tan(Math.PI / 3) - 0.375 * Math.tan(Math.PI / 3), 9);   // the cone's rim less the skirt's thickness up the 60° cone
  });
  it('SW-EQC-11 (amended 2026-11-27): an air cooler\'s braces end at the column bases, their feet cut level with them, none of them below', () => {
    for (const [W, L, legH] of [[96, 240, 120], [168, 384, 23.835]]) {
      const braces = (makeAirCooler({ tag: 'E', W, L, fans: 2, legH }).extra!.solids as { name: string; mesh: { positions: number[] } }[]).filter(s => /^brace/.test(s.name));
      expect(braces.length).toBe(2);
      const sinA = legH / Math.hypot(L - 24, legH);
      for (const s of braces) {
        const P = s.mesh.positions, z = P.filter((_, i) => i % 3 === 2), foot = P.filter((_, i) => i % 3 === 0 && Math.abs(P[i + 2]) < 1e-9);
        expect(Math.min(...z)).toBeGreaterThanOrEqual(-1e-9); expect(Math.max(...z)).toBeCloseTo(legH, 9);            // between the column bases and tops
        expect(Math.min(...foot)).toBeCloseTo(-L / 2 + 12, 9);                                                            // the foot starts at the column's line
        expect(Math.max(...foot)).toBeCloseTo(-L / 2 + 12 + 3 / sinA, 6);                                                 // and runs on the bases' plane until the 3 in leg has risen clear
      }
    }
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

describe('process units, boiler equipment and tanks: the rules (SW-EQC-27..44)', () => {
  it('SW-EQC-28: floors are never more than 15 ft apart, and a platformed column has one at each', () => {
    const fl = floorsThrough([500, 700, 1500]); let last = 0; for (const z of fl) { expect(z - last).toBeLessThanOrEqual(180 + 1e-9); last = z; } expect(fl[fl.length - 1]).toBe(1500);
    const c = makePlatformedColumn({ tag: 'C', ID: 96, t: 0.625, TT: 960, skirtH: 96, trays: 36 }), floors = c.extra!.floors as number[];
    for (let i = 1; i < floors.length; i++) expect(floors[i] - floors[i - 1]).toBeLessThanOrEqual(180 + 1e-9);
    expect(c.dims.platforms.value).toBe(floors.length);
    const names = (c.extra!.solids as { name: string }[]).map(q => q.name);
    for (let k = 1; k <= floors.length; k++) { expect(names.some(n => n.startsWith(`platform ${k}:`)), `platform ${k}`).toBe(true); expect(names.some(n => n.startsWith(`ladder ${k}:`)), `ladder ${k}`).toBe(true); }
  });
  it('SW-EQC-30: tubes on a 1.25 d triangular pitch inside the limit circle; baffles at 0.4 ID', () => {
    const b = makeTubeBundle('B', 36, 190);
    expect(b.dims.pitch.value).toBeCloseTo(0.9375, 9); expect(b.dims.baffleSpacing.value).toBeCloseTo(14.4, 9);
    const packed = (Math.PI * (36 / 2 - 0.75 - 0.375) ** 2) / (0.9375 * 0.9375 * 0.8660254);   // tubes a triangular lattice puts in the limit circle
    expect(b.dims.tubes.value).toBeGreaterThan(0.93 * packed); expect(b.dims.tubes.value).toBeLessThan(1.03 * packed);
  });
  it('SW-EQC-33: the cat cracker\'s reactor stands above the regenerator; SW-EQC-34: derricks 0.8 of the drum', () => {
    const f = makeCatCracker({ tag: 'R', regenD: 240, regenTT: 300, reactorD: 144, reactorTT: 240 });
    expect(f.dims.reactorBase.value).toBeGreaterThan(f.dims.skirtH.value + 240 / 4 + 300); expect(f.dims.riserD.value).toBeCloseTo(36, 9); expect(f.dims.skirtH.value % 12).toBe(0);
    const k = makeCokeDrums({ tag: 'D', D: 288, TT: 720 }); expect(k.dims.derrick.value).toBeCloseTo(576, 9); expect(k.dims.flange.value).toBeCloseTo(72, 9);
  });
  it('SW-EQC-33, SW-EQC-36: what a plant states of the lines that join its cracker and its scrubber; unstated, they are drawn as before', () => {
    type Sol = { name: string; mesh: { positions: ArrayLike<number> } };
    const names = (p: PartSpec) => (p.extra!.solids as Sol[]).map(q => q.name);
    const box = (p: PartSpec, re: RegExp) => { const q = (p.extra!.solids as Sol[]).filter(v => re.test(v.name)); expect(q.length, String(re)).toBeGreaterThan(0); const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity]; for (const v of q) { const P = v.mesh.positions; for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], P[i + k]); mx[k] = Math.max(mx[k], P[i + k]); } } return { mn, mx }; }, mid = (b: { mn: number[]; mx: number[] }, k: number) => (b.mn[k] + b.mx[k]) / 2;
    const base = { tag: 'R', regenD: 240, regenTT: 300, reactorD: 144, reactorTT: 240 }, f = makeCatCracker(base), g = makeCatCracker({ ...base, plant: { flueOD: 42, airOD: 20, grid: 6, riserSide: 1, airAt: Math.PI / 2 } }), Rg = 240 / 2 + 1;
    // where the plant's own lines join, the stubs and flanges the catalogue draws are left off; nothing else is taken away, nothing added
    const off = ['flue gas outlet', 'flue gas outlet flange', 'air inlet flange', 'vapour outlet', 'vapour outlet flange'];
    for (const n of off) { expect(names(f), n).toContain(n); expect(names(g), n).not.toContain(n); }
    expect(names(f).filter(n => !off.includes(n))).toEqual(names(g));
    // the top cone closes to the flue gas line's outside diameter, at 45°; the top of the item is the reactor's head, no outlet stub above it
    const cone = box(g, /^regenerator top cone$/); expect(cone.mx[2] - cone.mn[2]).toBeCloseTo(Rg - 21, 6); expect(g.extra!.zCone as number).toBeCloseTo(cone.mx[2], 6); expect(g.dims.flueD.value).toBe(42); expect(f.dims.flueD.value).toBe(60);
    expect(g.dims.top.value).toBeCloseTo(box(g, /^reactor top head$/).mx[2], 1); expect(f.dims.top.value).toBeCloseTo(box(f, /^reactor top head$/).mx[2] + 28, 1); expect(g.extra!.zHead as number).toBeCloseTo(g.dims.top.value, 9); expect(g.dims.vapourD).toBeUndefined();
    // the air inlet line: of the line's outside diameter, out the way stated (here +y), 36 in beyond the shell; unstated it leaves toward −x, 0.2 Dg across
    const air = box(g, /^air inlet line$/), air0 = box(f, /^air inlet line$/), e = g.extra!.airEnd as number[];
    expect(e[0]).toBeCloseTo(0, 6); expect(e[1]).toBeCloseTo(Rg + 36, 6); expect(e[2]).toBeCloseTo(g.extra!.zAir as number, 9); expect(air.mx[1]).toBeCloseTo(Rg + 36, 6); expect(air.mx[0] - air.mn[0]).toBeGreaterThan(19.5); expect(air.mx[0] - air.mn[0]).toBeLessThanOrEqual(20 + 1e-6); expect(g.dims.airD.value).toBe(20);
    expect(air0.mn[0]).toBeCloseTo(-(Rg + 36), 6); expect(air0.mx[1] - air0.mn[1]).toBeGreaterThan(47); expect(air0.mx[1] - air0.mn[1]).toBeLessThanOrEqual(48 + 1e-6);
    // the height the air inlet line runs out at, stated: in place of 0.25 Dg below the bottom head; refused where the line's bend and 6 in do not fit under that head, or a foot over the base
    { const low = (f.extra!.zg0 as number) - Rg / 2, h = makeCatCracker({ ...base, plant: { flueOD: 42, airOD: 20, grid: 6, airZ: 150 } }), lineOf = (p: PartSpec) => box(p, /^air inlet line$/);
      expect(g.extra!.zAir as number).toBeCloseTo((g.extra!.zg0 as number) - Rg / 2 - 0.25 * 240, 9); expect(h.extra!.zAir).toBe(150); expect((h.extra!.airEnd as number[])[2]).toBe(150);
      expect(lineOf(h).mn[2]).toBeCloseTo(150 - 10, 1); expect(lineOf(g).mn[2]).toBeCloseTo((g.extra!.zAir as number) - 10, 1); expect(lineOf(h).mx[2]).toBeCloseTo(lineOf(g).mx[2], 6);   // from the same point of the bottom head
      expect(() => makeCatCracker({ ...base, plant: { flueOD: 42, airOD: 20, grid: 6, airZ: low - 24 - 10 - 6 } })).not.toThrow(); expect(() => makeCatCracker({ ...base, plant: { flueOD: 42, airOD: 20, grid: 6, airZ: low - 24 - 10 - 5 } })).toThrow(/air inlet line cannot run out/);
      expect(() => makeCatCracker({ ...base, plant: { flueOD: 42, airOD: 20, grid: 6, airZ: 22 } })).not.toThrow(); expect(() => makeCatCracker({ ...base, plant: { flueOD: 42, airOD: 20, grid: 6, airZ: 21 } })).toThrow(/SW-EQC-33/); }
    // on the plant's grid: the two vessels' centres and the riser; the riser on the +y side when mirrored, on −y as drawn by default
    const X = g.extra!.X as number, X0 = f.extra!.X as number, [rx, ry] = g.extra!.riser as number[];
    expect(X % 6).toBe(0); expect(X).toBeGreaterThanOrEqual(X0); expect(X - X0).toBeLessThan(6); expect(g.dims.centres.value).toBe(X); expect(rx).toBe(X - 30); expect(ry % 6).toBe(0); expect(ry).toBeGreaterThan(0);
    expect(mid(box(g, /^riser$/), 0)).toBeCloseTo(rx, 6); expect(mid(box(g, /^riser$/), 1)).toBeCloseTo(ry, 6); expect(mid(box(f, /^riser$/), 1)).toBeLessThan(0); expect(mid(box(g, /^reactor shell$/), 0)).toBeCloseTo(X, 6);
    expect(mid(box(g, /^riser guides$/), 1)).toBeGreaterThan(0); expect(mid(box(f, /^riser guides$/), 1)).toBeLessThan(0);
    // the scrubber: its inlet duct level and of the line's outside diameter, without a flange; its pumps where stated
    const sc = { tag: 'T', D: 120, H: 480 }, s0 = makeWetScrubber(sc), s1 = makeWetScrubber({ ...sc, inlet: { OD: 36 }, pumpsAt: -Math.PI / 2 });
    expect(names(s0)).toContain('gas inlet flange'); expect(names(s1)).not.toContain('gas inlet flange'); expect(names(s0).filter(n => n !== 'gas inlet flange')).toEqual(names(s1));
    const d0 = box(s0, /^gas inlet duct$/), d1 = box(s1, /^gas inlet duct$/);
    expect(d1.mx[2] - d1.mn[2]).toBeGreaterThan(35.5); expect(d1.mx[2] - d1.mn[2]).toBeLessThanOrEqual(36 + 1e-6); expect(mid(d1, 2)).toBeCloseTo(s1.extra!.zInlet as number, 6); expect(s1.dims.inlet.value).toBe(36);
    expect(d0.mx[2] - d0.mn[2]).toBeGreaterThan(60.5 + 0.1 * 120); expect(s0.dims.inlet.value).toBe(60);   // as drawn by default it slopes down into the shell
    expect(mid(box(s0, /^recirculation pump 1: /), 1)).toBeGreaterThan(60); expect(mid(box(s1, /^recirculation pump 1: /), 1)).toBeLessThan(-60); expect(mid(box(s1, /^recirculation riser/), 1)).toBeLessThan(-60);
  });
  it('SW-EQC-40: the boiler\'s mud drum is 0.65 of the steam drum; SW-EQC-44: tank capacity from the shell', () => {
    const b = makeWaterTubeBoiler({ tag: 'B', steamID: 54, L: 240, centres: 180 }); expect(b.dims.mudID.value).toBeCloseTo(35.1, 9); expect(b.dims.bank.value).toBe(8 * b.dims.walls.value);
    const t = makeConeRoofTank({ tag: 'T', D: 480, H: 384 }); expect(t.dims.courses.value).toBe(4); expect(t.dims.capacity.value).toBeGreaterThan(7000); expect(t.dims.capacity.value).toBeLessThan(7200);
    const names = (makeFloatingRoofTank({ tag: 'T', D: 720, H: 480 }).extra!.solids as { name: string }[]).map(q => q.name);
    for (const want of ['wind girder walkway', 'floating roof pontoon', 'rim seal', 'rolling ladder', 'stair treads', 'shell manway 1']) expect(names.some(n => n.startsWith(want)), want).toBe(true);
  });
});
