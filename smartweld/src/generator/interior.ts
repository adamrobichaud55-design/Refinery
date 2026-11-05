/**
 * Interior generator: equipment, pipe rack, platforms and access steel. DESIGN_BASIS.md sections 19–27.
 * Same world frame and output shape as the building generator (plain data: placed parts).
 */
import { drawing, rule, type Dim } from '../core/basis';
import { roundUpTo } from '../core/units';
import { weightPerFootFromArea } from '../core/constants';
import {
  makeWideFlange, proportionW, proportionC, makeChannel, makeBasePlate, makeAnchorRod, makePlate, makeBolt, boltLengthForGrip,
  makeFilletWeld, makeFilletWeldAround, makeHssRound, makeRod, makeAngle, makeGrating, makeTread, makeCageHoop, CAGE, GRATING,
  makeVerticalVessel, makeHorizontalVessel, makeExchanger, makePump, makeTank,
  DEFAULT_MATERIAL, type PartSpec, type Material, type Cut,
} from '../catalogue';
import { frameFromAxes, multiply, translate, standUp, type Vec3 } from '../geometry/transform';
import { interiorKit } from './interiorKit';
import { nonSteel } from './nonSteel';
import type { Mat4 } from '../geometry/mesh';
import type { Placed } from './building';

export interface InteriorModel { instances: Placed[]; derived: Record<string, Dim>; notes: string[]; equipment: { tag: string; part: PartSpec; transform: Mat4 }[] }

const BOLT_GRADE: Material = { grade: 'Grade 90 bolt', Fy: { value: 90, unit: 'ksi', basis: { kind: 'drawing' }, label: 'Bolt tensile strength (grade stated on drawing)' } };
const G36 = DEFAULT_MATERIAL;
const add3 = (a: Vec3, b: Vec3, k = 1): Vec3 => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];
const dist = (a: Vec3, b: Vec3) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);

/** Layout drawing (SW-LAY-*): all values carry basis `drawing`. Inches. */
export const DEMO_LAYOUT = {
  rack: { x0: 240, x1: 2160, bentSpacing: 240, halfWidth: 120, tiers: [192, 264], loadPsf: 40 },
  pedestal: 6, padHeight: 6,
  equipment: {
    V101: { x: 402, z: 300 }, V102: { x: 642, z: 300 }, vessel: { ID: 72, t: 0.5, TT: 216, skirtH: 72, rods: 8 },
    platformTop: 285, stairLane: 300,
    D101: { x: 1098, z: 300, ID: 60, t: 0.5, TT: 180, centreline: 84 },
    E101: { x: 1425, z: 300 }, E102: { x: 1701, z: 300 }, E103: { x: 1131, z: -300 }, exchanger: { ID: 36, t: 0.5, TT: 192, centreline: 72 },
    pumpsS: [1848, 1908, 1968, 2028, 2088, 2148].map(x => ({ x, z: 222 })), pumpsN: [1398, 1458].map(x => ({ x, z: -222 })),
    pump: { baseW: 30, baseL: 72, casingD: 20, casingW: 12, motorD: 18, motorL: 30 }, pumpPad: 9,
    T101: { x: 300, z: -318 }, T102: { x: 528, z: -318 }, tank: { D: 144, H: 264, t: 0.25 },
    C101: { x: 822, z: -300, ID: 48, t: 0.5, TT: 240, skirtH: 48, rods: 8, platforms: [132, 240] },
  },
} as const;

export function generateInterior(lay = DEMO_LAYOUT): InteriorModel {
  const out: Placed[] = [], notes: string[] = [], derived: Record<string, Dim> = {};
  const equipment: InteriorModel['equipment'] = [];
  const kit = interiorKit(lay, out, derived);
  const { part, add, barDepth, concrete, platform, postColumn, guardrail, RISE, RUN, stairFlight, ladder, platformBeam, clipBr, vesselAnnulus } = kit;
  const rk = lay.rack, { Db, beamSize, Dc, colSize, Ds, wS } = kit.rack(rk);
  // ---- equipment (SW-EQ-*, SW-LAY-2) with pads and anchor rods --------------------------------------------------
  const eq = lay.equipment;
  const place = (p: PartSpec, tr: Mat4, tag: string) => { add(p, tr, tag, 'equipment'); equipment.push({ tag: p.id, part: p, transform: tr }); };
  const padFor = (x: number, z: number, w: number, L: number, tag: string) => add(concrete('equipment pad', w, lay.padHeight, L), frameFromAxes([x - L / 2, lay.padHeight / 2, z], [0, 1, 0], [1, 0, 0]), tag, 'pad');
  const vesselRods = (p: PartSpec, x: number, z: number, tag: string) => {
    const R = p.extra!.baseRingR as number, n = p.extra!.rods as number;
    const rod = part('vrod', () => makeAnchorRod('AR-V', { d: 1, basePlateT: 0.75, groutT: 1.5, plateWasherT: 0.375 }));
    for (let i = 0; i < n; i++) { const a = (2 * Math.PI * (i + 0.5)) / n; add(rod, multiply(translate(x + R * Math.cos(a), lay.padHeight, z + R * Math.sin(a)), standUp()), tag, 'anchor-rod'); }
    add(concrete('grout', 2 * R + 6, 1.5, 2 * R + 6), frameFromAxes([x - R - 3, lay.padHeight + 0.75, z], [0, 1, 0], [1, 0, 0]), tag, 'grout');
  };
  const pumpPad = (x: number, z: number, tag: string) => add(concrete('pump pad', eq.pump.baseL + 12, eq.pumpPad, eq.pump.baseW + 12), frameFromAxes([x - (eq.pump.baseW + 12) / 2, eq.pumpPad / 2, z], [0, 1, 0], [1, 0, 0]), tag, 'pad');
  const yVessel = lay.padHeight + 1.5 + 0.75;                                   // pad + grout + base ring
  for (const [tag, pos] of [['V-101', eq.V101], ['V-102', eq.V102]] as const) {
    const v = makeVerticalVessel({ tag, ...eq.vessel });
    padFor(pos.x, pos.z, eq.vessel.ID + 36, eq.vessel.ID + 36, tag);
    place(v, multiply(translate(pos.x, yVessel, pos.z), standUp()), tag);
    vesselRods(v, pos.x, pos.z, tag);
  }
  const c1 = makeVerticalVessel({ tag: 'C-101', ID: eq.C101.ID, t: eq.C101.t, TT: eq.C101.TT, skirtH: eq.C101.skirtH, rods: eq.C101.rods });
  padFor(eq.C101.x, eq.C101.z, eq.C101.ID + 36, eq.C101.ID + 36, 'C-101');
  place(c1, multiply(translate(eq.C101.x, yVessel, eq.C101.z), standUp()), 'C-101');
  vesselRods(c1, eq.C101.x, eq.C101.z, 'C-101');
  const d1 = makeHorizontalVessel({ tag: 'D-101', ID: eq.D101.ID, t: eq.D101.t, TT: eq.D101.TT, centreline: eq.D101.centreline });
  padFor(eq.D101.x, eq.D101.z, eq.D101.ID + 24, eq.D101.TT + 24, 'D-101');
  place(d1, frameFromAxes([eq.D101.x - eq.D101.TT / 2, lay.padHeight + eq.D101.centreline, eq.D101.z], [0, 1, 0], [1, 0, 0]), 'D-101');
  for (const [tag, pos] of [['E-101', eq.E101], ['E-102', eq.E102], ['E-103', eq.E103]] as const) {
    const e = makeExchanger({ tag, ...eq.exchanger });
    padFor(pos.x, pos.z, eq.exchanger.ID + 24, eq.exchanger.TT + eq.exchanger.ID / 2 + 24, tag);
    place(e, frameFromAxes([pos.x - eq.exchanger.TT / 2 + eq.exchanger.ID / 4, lay.padHeight + eq.exchanger.centreline, pos.z], [0, 1, 0], [1, 0, 0]), tag);
  }
  const pumpTags = ['P-101A', 'P-101B', 'P-102A', 'P-102B', 'P-103A', 'P-103B'];
  eq.pumpsS.forEach((pos, i) => {
    const p = makePump({ tag: pumpTags[i], ...eq.pump });
    pumpPad(pos.x, pos.z, pumpTags[i]);   // pump axis along z: pad long dimension along z
    place(p, frameFromAxes([pos.x, eq.pumpPad, pos.z], [0, 1, 0], [0, 0, 1]), pumpTags[i]);                         // shaft along +z: suction toward the rack
  });
  eq.pumpsN.forEach((pos, i) => {
    const tag = ['P-104A', 'P-104B'][i];
    const p = makePump({ tag, ...eq.pump });
    pumpPad(pos.x, pos.z, tag);
    place(p, frameFromAxes([pos.x, eq.pumpPad, pos.z], [0, 1, 0], [0, 0, -1]), tag);
  });
  for (const [tag, pos] of [['T-101', eq.T101], ['T-102', eq.T102]] as const) {
    const t = makeTank({ tag, ...eq.tank });
    padFor(pos.x, pos.z, eq.tank.D + 24, eq.tank.D + 24, tag);
    place(t, multiply(translate(pos.x, lay.padHeight, pos.z), standUp()), tag);
    // caged ladder to the roof edge on the south side (SW-LAY-3, SW-LD-3)
    ladder([pos.x, lay.padHeight, pos.z + eq.tank.D / 2 + CAGE.standoff], eq.tank.H, [0, 1], tag);
  }

  // ---- vessel platforms (SW-PLT-*, SW-EQ-6): square annulus around V-101 and V-102 at `platformTop`, bridge, stair tower ----
  const Rv = eq.vessel.ID / 2 + eq.vessel.t, inner = Rv + 2, outer = Rv + 50, top = eq.platformTop;
  // openings as fractions along each edge (edges run S: −x→+x, E: −z→+z, N: +x→−x, W: +z→−z)
  const laneA = [eq.stairLane - 39, eq.stairLane - 3];                           // stair lane A in z
  const bridgeZ = [eq.V101.z - 18, eq.V101.z + 18];
  const frac = (edgeLo: number, edgeHi: number, lo: number, hi: number, reversed = false): [number, number] => { const L = edgeHi - edgeLo; const f0 = (lo - edgeLo) / L, f1 = (hi - edgeLo) / L; return reversed ? [1 - f1, 1 - f0] : [f0, f1]; };
  vesselAnnulus(eq.V101.x, eq.V101.z, Rv, inner, outer, top, 'platform-V101', [{ edge: 'E', ...(([f, t]) => ({ from: f, to: t }))(frac(eq.V101.z - outer, eq.V101.z + outer, bridgeZ[0], bridgeZ[1])) }]);
  vesselAnnulus(eq.V102.x, eq.V102.z, Rv, inner, outer, top, 'platform-V102', [
    { edge: 'W', ...(([f, t]) => ({ from: f, to: t }))(frac(eq.V102.z - outer, eq.V102.z + outer, bridgeZ[0], bridgeZ[1], true)) },
    { edge: 'E', ...(([f, t]) => ({ from: f, to: t }))(frac(eq.V102.z - outer, eq.V102.z + outer, laneA[0], laneA[1])) },
  ]);
  // bridge between the annuli (SW-LAY-3): beams along x at the lane edges, bars along z
  platform(eq.V101.x + outer, bridgeZ[0], eq.V102.x - outer, bridgeZ[1], top, { span: 'x', tag: 'platform-bridge',
    rails: [[[eq.V101.x + outer, top, bridgeZ[0]], [eq.V102.x - outer, top, bridgeZ[0]]], [[eq.V102.x - outer, top, bridgeZ[1]], [eq.V101.x + outer, top, bridgeZ[1]]]], railCentre: [(eq.V101.x + eq.V102.x) / 2, eq.V101.z] });

  // stair tower (SW-SR-*, SW-LAY-3): a top landing L0 off the annulus east edge, then three flights with landings L1, L2 on columns
  const risers = Math.round(top / RISE); const flights = [Math.floor(risers / 3), Math.floor(risers / 3), risers - 2 * Math.floor(risers / 3)];
  const laneAz = (laneA[0] + laneA[1]) / 2, laneBz = laneAz + 42;
  const zL = [laneA[0] - 3, laneBz + 21] as const;
  const L0 = { x0: eq.V102.x + outer, x1: eq.V102.x + outer + 36, z0: zL[0], z1: zL[1] };   // top landing at the platform level
  const [f1, f2, f3] = flights;
  const b1x = L0.x1 + (f1 - 1) * RUN, el1 = top - f1 * RISE;                 // flight 1 descends east from L0 to L1's west edge
  const L1 = { x0: b1x, x1: b1x + 36, z0: zL[0], z1: zL[1] };
  const b2x = L1.x0 - (f2 - 1) * RUN, el2 = el1 - f2 * RISE;                  // flight 2 descends west from L1 to L2's east edge
  const L2 = { x0: b2x - 36, x1: b2x, z0: zL[0], z1: zL[1] };
  const b3x = L2.x1 + (f3 - 1) * RUN;                                          // flight 3 descends east from L2 to the floor
  stairFlight([b1x, el1, laneAz], -1, f1, 'stair');
  stairFlight([b2x, el2, laneBz], 1, f2, 'stair');
  stairFlight([b3x, 0, laneAz], -1, f3, 'stair');
  platform(L0.x0, L0.z0, L0.x1, L0.z1, top, { span: 'z', tag: 'stair-landing' });
  platform(L1.x0, L1.z0, L1.x1, L1.z1, el1, { span: 'z', tag: 'stair-landing' });
  platform(L2.x0, L2.z0, L2.x1, L2.z1, el2, { span: 'z', tag: 'stair-landing' });
  for (const [x, z] of [[L0.x0, L0.z0], [L0.x1, L0.z0], [L0.x1, L0.z1], [L0.x0, L0.z1]]) postColumn(x, z, top - barDepth - platformBeam.dims.d, 'stair-landing');
  for (const [x, z] of [[L1.x0, L1.z0], [L1.x1, L1.z0], [L1.x1, L1.z1], [L1.x0, L1.z1]]) postColumn(x, z, el1 - barDepth - platformBeam.dims.d, 'stair-landing');
  for (const [x, z] of [[L2.x0, L2.z0], [L2.x1, L2.z0], [L2.x1, L2.z1], [L2.x0, L2.z1]]) postColumn(x, z, el2 - barDepth - platformBeam.dims.d, 'stair-landing'); // shares L0's columns where they coincide (clips, SW-PLT-2)
  const c = (Lr: { x0: number; x1: number; z0: number; z1: number }): [number, number] => [(Lr.x0 + Lr.x1) / 2, (Lr.z0 + Lr.z1) / 2];
  // landing guardrails: L0 — north and south edges (west = annulus, east = flight 1 lane A; close lane B side on the east)
  guardrail([[L0.x0, top, L0.z1], [L0.x1, top, L0.z1], [L0.x1, top, laneA[1] + 3]], c(L0), 'stair-landing');
  guardrail([[L0.x0, top, L0.z0], [L0.x1, top, L0.z0]], c(L0), 'stair-landing');
  // L1 — east, north, south (west edge receives flight 1 and launches flight 2)
  guardrail([[L1.x1, el1, L1.z0], [L1.x1, el1, L1.z1]], c(L1), 'stair-landing');
  guardrail([[L1.x0, el1, L1.z1], [L1.x1, el1, L1.z1]], c(L1), 'stair-landing');
  guardrail([[L1.x0, el1, L1.z0], [L1.x1, el1, L1.z0]], c(L1), 'stair-landing');
  // L2 — west, north, south (east edge receives flight 2 and launches flight 3)
  guardrail([[L2.x0, el2, L2.z0], [L2.x0, el2, L2.z1]], c(L2), 'stair-landing');
  guardrail([[L2.x0, el2, L2.z1], [L2.x1, el2, L2.z1]], c(L2), 'stair-landing');
  guardrail([[L2.x0, el2, L2.z0], [L2.x1, el2, L2.z0]], c(L2), 'stair-landing');
  derived.stair = rule(risers, 'SW-SR-1', `Stair: ${risers} risers at ${RISE} in in flights of ${flights.join('/')}`, 'count');

  // column C-101 platforms with ladders (SW-LAY-3): annuli at the stated elevations; ladder E side to the first, W side to the second
  const Rc = eq.C101.ID / 2 + eq.C101.t, inC = Rc + 2, outC = Rc + 50;
  const [elMid, elTop] = eq.C101.platforms;
  const ladderCutE: Cut = { x0: eq.C101.x + inC, y0: eq.C101.z - 15, x1: eq.C101.x + inC + 30, y1: eq.C101.z + 15 };
  const ladderCutW: Cut = { x0: eq.C101.x - inC - 30, y0: eq.C101.z - 15, x1: eq.C101.x - inC, y1: eq.C101.z + 15 };
  vesselAnnulus(eq.C101.x, eq.C101.z, Rc, inC, outC, elMid, 'platform-C101-mid', [], [ladderCutE]);
  vesselAnnulus(eq.C101.x, eq.C101.z, Rc, inC, outC, elTop, 'platform-C101-top', [], [ladderCutW]);
  ladder([eq.C101.x + Rc + CAGE.standoff, lay.padHeight, eq.C101.z], elMid - lay.padHeight, [1, 0], 'C-101-ladder');
  ladder([eq.C101.x - Rc - CAGE.standoff, elMid, eq.C101.z], elTop - elMid, [-1, 0], 'C-101-ladder');
  notes.push('Ladder openings in grating are unguarded on the ladder side (SW-HR-4); tank roofs have no perimeter rail (stated).');

  notes.push(`Pipe rack: bents at ${rk.bentSpacing / 12} ft, tiers at ${rk.tiers.map(t => t / 12).join(' and ')} ft, beams W${Db}x${beamSize.w}, columns W${Dc}x${colSize.w}, struts W${Ds}x${wS}, rods RD3/4 in every fourth bay (SW-RK-*).`);
  notes.push(`Vessel platforms at ${top / 12} ft with a 3-flight stair; column platforms at ${elMid / 12} and ${elTop / 12} ft with ladders; caged ladders on the tanks and the rack ends (SW-LD-3). Equipment envelopes only (SW-EQ-*); nozzles in stage 5.`);
  return { instances: out, derived, notes, equipment };
}

