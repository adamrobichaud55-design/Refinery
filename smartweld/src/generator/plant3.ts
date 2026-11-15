/**
 * Plant 3, the crude topping unit (DESIGN_BASIS.md §65, SW-PLANT-8..11): its layout, interior, nozzle schedule and
 * line list, on plant 2's building drawing and rack. Every value of the layout and schedules is drawing data (basis
 * `drawing`); the steel, equipment and access are built by the same kit and rules as plants 1 and 2 (§19–27), and the
 * piping by the same line-list, joint and routing rules as plant 2 (§36–38, §59–61).
 */
import { drawing, rule, type Dim } from '../core/basis';
import {
  makeVerticalVessel, makeHorizontalVessel, makeExchanger, makePump, makeTank, makeAnchorRod, makePlate, CAGE,
  type PartSpec, type PipeClass,
} from '../catalogue';
import { frameFromAxes, multiply, translate, standUp, type Vec3 } from '../geometry/transform';
import type { Mat4 } from '../geometry/mesh';
import { generateBuilding, type BuildingDrawing, type BuildingModel, type Placed } from './building';
import type { InteriorModel } from './interior';
import { interiorKit, type RackLayout } from './interiorKit';
import { nonSteel } from './nonSteel';
import { buildNozzlesFrom, type Geo, type NozzleDef, type Nozzle } from './nozzles';
import { lineNo, type LineDef, type EndRef, type Service, type V3 } from './linelist';
import { jointBySpec, flangeBySpec, lineGroup, type PlantDef, type GratingCut } from './plant';
import { PLANT2_BUILDING, L2 } from './plant2';

// ---- building drawing (SW-PLANT-8): plant 2's ----------------------------------------------------------------------
const L3 = L2;                                                               // 3000 in

// ---- layout (SW-PLANT-5/6, drawing) ----------------------------------------------------------------------------------
export const PLANT3_LAYOUT = {
  rack: { x0: 240, x1: 2760, bentSpacing: 240, halfWidth: 144, tiers: [192, 264, 336], loadPsf: 40 } as RackLayout,
  pedestal: 6, padHeight: 6,
  vessel: { ID: 72, t: 0.5, TT: 216, skirtH: 48, rods: 8 }, platformTop: 285, stairLane: 330,   // plant 2's vessels and skirt, unchanged (SW-PLANT-9)
  V301: { x: 420, z: 330 }, V302: { x: 660, z: 330 },
  C301: { x: 840, z: -330, ID: 48, t: 0.5, TT: 240, skirtH: 48, rods: 8, platforms: [132, 240] as const },
  D301: { x: 1098, z: 330, ID: 60, t: 0.5, TT: 180, centreline: 84 },
  D302: { x: 3300, z: -120, ID: 42, t: 0.5, TT: 144, centreline: 90 },      // outdoor air receiver (high enough for its bottom outlet stack)
  D303: { x: 3300, z: 120, ID: 60, t: 0.5, TT: 180, centreline: 84 },       // outdoor flare knock-out drum
  exchanger: { ID: 36, t: 0.5, TT: 192, centreline: 72 },
  E301: { x: 1425, z: 330 }, E302: { x: 1701, z: 330 }, E303: { x: 1131, z: -330 }, E304: { x: 1407, z: -330 }, E305: { x: 1683, z: -330 }, E306: { x: 2403, z: -330 },   // E-305 overhead condenser and E-306 distillate cooler in the north row
  pump: { baseW: 30, baseL: 72, casingD: 20, casingW: 12, motorD: 18, motorL: 30 }, pumpPad: 9,
  pumpsS: [1980, 2070, 2160, 2250, 2340, 2430, 2520, 2610].map(x => ({ x, z: 246 })), pumpsN: [2070, 2160].map(x => ({ x, z: -246 })),   // 90 in pitch: room for the seal-flush stacks (SW-LL-6)
  tank: { D: 144, H: 264, t: 0.25 }, T301: { x: 3300, z: 420 }, T302: { x: 3300, z: -420 }, T303: { x: 3612, z: 420 }, T304: { x: 3600, z: -180 },   // crude, naphtha, residue (behind the crude tank), distillate (behind the air receiver)
  outdoor: { x0: L3, x1: 3720 },
} as const;
const Y = PLANT3_LAYOUT;
export const PUMPS3_S = ['P-301A', 'P-301B', 'P-302A', 'P-302B', 'P-303A', 'P-303B', 'P-304A', 'P-304B'], PUMPS3_N = ['P-305A', 'P-305B'];
const EXCH3 = [['E-301', Y.E301], ['E-302', Y.E302], ['E-303', Y.E303], ['E-304', Y.E304], ['E-305', Y.E305], ['E-306', Y.E306]] as const;
const TANKS3 = [['T-301', Y.T301], ['T-302', Y.T302], ['T-303', Y.T303], ['T-304', Y.T304]] as const;

// ---- interior (§19–27 by the kit) -----------------------------------------------------------------------------------
export function generateInterior3(cuts: GratingCut[] = []): InteriorModel {
  const out: Placed[] = [], notes: string[] = [], derived: Record<string, Dim> = {}, equipment: InteriorModel['equipment'] = [];
  const kit = interiorKit(Y, out, derived);
  const { part, add, barDepth, concrete, platform, postColumn, guardrail, RISE, RUN, stairFlight, ladder, platformBeam, vesselAnnulus } = kit;
  const rk = Y.rack, { Db, beamSize, Dc, colSize, Ds, wS } = kit.rack(rk);
  const place = (p: PartSpec, tr: Mat4, tag: string) => { add(p, tr, tag, 'equipment'); equipment.push({ tag: p.id, part: p, transform: tr }); };
  const padFor = (x: number, z: number, w: number, L: number, tag: string) => add(concrete('equipment pad', w, Y.padHeight, L), frameFromAxes([x - L / 2, Y.padHeight / 2, z], [0, 1, 0], [1, 0, 0]), tag, 'pad');
  const vesselRods = (p: PartSpec, x: number, z: number, tag: string) => {
    const R = p.extra!.baseRingR as number, n = p.extra!.rods as number;
    const rod = part('vrod', () => makeAnchorRod('AR-V', { d: 1, basePlateT: 0.75, groutT: 1.5, plateWasherT: 0.375 }));
    for (let i = 0; i < n; i++) { const a = (2 * Math.PI * (i + 0.5)) / n; add(rod, multiply(translate(x + R * Math.cos(a), Y.padHeight, z + R * Math.sin(a)), standUp()), tag, 'anchor-rod'); }
    add(concrete('grout', 2 * R + 6, 1.5, 2 * R + 6), frameFromAxes([x - R - 3, Y.padHeight + 0.75, z], [0, 1, 0], [1, 0, 0]), tag, 'grout');
  };
  const pumpPad = (x: number, z: number, tag: string) => add(concrete('pump pad', Y.pump.baseL + 12, Y.pumpPad, Y.pump.baseW + 12), frameFromAxes([x - (Y.pump.baseW + 12) / 2, Y.pumpPad / 2, z], [0, 1, 0], [1, 0, 0]), tag, 'pad');
  const yVessel = Y.padHeight + 1.5 + 0.75;
  for (const [tag, pos] of [['V-301', Y.V301], ['V-302', Y.V302]] as const) {
    const v = makeVerticalVessel({ tag, ...Y.vessel }); padFor(pos.x, pos.z, Y.vessel.ID + 36, Y.vessel.ID + 36, tag);
    place(v, multiply(translate(pos.x, yVessel, pos.z), standUp()), tag); vesselRods(v, pos.x, pos.z, tag);
  }
  const c1 = makeVerticalVessel({ tag: 'C-301', ID: Y.C301.ID, t: Y.C301.t, TT: Y.C301.TT, skirtH: Y.C301.skirtH, rods: Y.C301.rods });
  padFor(Y.C301.x, Y.C301.z, Y.C301.ID + 36, Y.C301.ID + 36, 'C-301'); place(c1, multiply(translate(Y.C301.x, yVessel, Y.C301.z), standUp()), 'C-301'); vesselRods(c1, Y.C301.x, Y.C301.z, 'C-301');
  for (const [tag, d] of [['D-301', Y.D301], ['D-302', Y.D302], ['D-303', Y.D303]] as const) {
    const v = makeHorizontalVessel({ tag, ID: d.ID, t: d.t, TT: d.TT, centreline: d.centreline });
    padFor(d.x, d.z, d.ID + 24, d.TT + 24, tag); place(v, frameFromAxes([d.x - d.TT / 2, Y.padHeight + d.centreline, d.z], [0, 1, 0], [1, 0, 0]), tag);
  }
  for (const [tag, pos] of EXCH3) {
    const e = makeExchanger({ tag, ...Y.exchanger }); padFor(pos.x, pos.z, Y.exchanger.ID + 24, Y.exchanger.TT + Y.exchanger.ID / 2 + 24, tag);
    place(e, frameFromAxes([pos.x - Y.exchanger.TT / 2 + Y.exchanger.ID / 4, Y.padHeight + Y.exchanger.centreline, pos.z], [0, 1, 0], [1, 0, 0]), tag);
  }
  Y.pumpsS.forEach((pos, i) => { const p = makePump({ tag: PUMPS3_S[i], ...Y.pump }); pumpPad(pos.x, pos.z, PUMPS3_S[i]); place(p, frameFromAxes([pos.x, Y.pumpPad, pos.z], [0, 1, 0], [0, 0, 1]), PUMPS3_S[i]); });
  Y.pumpsN.forEach((pos, i) => { const p = makePump({ tag: PUMPS3_N[i], ...Y.pump }); pumpPad(pos.x, pos.z, PUMPS3_N[i]); place(p, frameFromAxes([pos.x, Y.pumpPad, pos.z], [0, 1, 0], [0, 0, -1]), PUMPS3_N[i]); });
  for (const [tag, pos] of TANKS3) {
    const t = makeTank({ tag, ...Y.tank }); padFor(pos.x, pos.z, Y.tank.D + 24, Y.tank.D + 24, tag); place(t, multiply(translate(pos.x, Y.padHeight, pos.z), standUp()), tag);
    ladder([pos.x, Y.padHeight, pos.z + (pos.z < 0 ? 1 : -1) * (Y.tank.D / 2 + CAGE.standoff)], Y.tank.H, [0, pos.z < 0 ? 1 : -1], tag);   // ladder on the side toward the building centreline
  }

  // ---- vessel platforms, bridge and stair tower (SW-LAY-3), as plant 1 ----
  const Rv = Y.vessel.ID / 2 + Y.vessel.t, inner = Rv + 2, outer = Rv + 50, top = Y.platformTop;
  const laneA = [Y.stairLane - 39, Y.stairLane - 3], bridgeZ = [Y.V301.z - 18, Y.V301.z + 18];
  const frac = (edgeLo: number, edgeHi: number, lo: number, hi: number, reversed = false): [number, number] => { const L = edgeHi - edgeLo; const f0 = (lo - edgeLo) / L, f1 = (hi - edgeLo) / L; return reversed ? [1 - f1, 1 - f0] : [f0, f1]; };
  const op = (edge: 'E' | 'W' | 'N' | 'S', f: [number, number]) => ({ edge, from: f[0], to: f[1] });
  const cutsOf = (tag: string) => cuts.filter(c => c.y === top).map(c => ({ cx: c.x, cy: c.z, r: c.r })).filter(() => true) as { cx: number; cy: number; r: number }[];
  vesselAnnulus(Y.V301.x, Y.V301.z, Rv, inner, outer, top, 'platform-V301', [op('E', frac(Y.V301.z - outer, Y.V301.z + outer, bridgeZ[0], bridgeZ[1]))], cutsOf('platform-V301'));
  vesselAnnulus(Y.V302.x, Y.V302.z, Rv, inner, outer, top, 'platform-V302', [op('W', frac(Y.V302.z - outer, Y.V302.z + outer, bridgeZ[0], bridgeZ[1], true)), op('E', frac(Y.V302.z - outer, Y.V302.z + outer, laneA[0], laneA[1]))], cutsOf('platform-V302'));
  platform(Y.V301.x + outer, bridgeZ[0], Y.V302.x - outer, bridgeZ[1], top, { span: 'x', tag: 'platform-bridge',
    rails: [[[Y.V301.x + outer, top, bridgeZ[0]], [Y.V302.x - outer, top, bridgeZ[0]]], [[Y.V302.x - outer, top, bridgeZ[1]], [Y.V301.x + outer, top, bridgeZ[1]]]], railCentre: [(Y.V301.x + Y.V302.x) / 2, Y.V301.z] });
  const stairTower = (xEdge: number, laneLo: number, topEl: number, tag: string, sgn: 1 | -1 = 1) => {   // sgn +1: the tower descends east of its edge; -1: west of it (mirrored)
    const risers = Math.round(topEl / RISE), flights = [Math.floor(risers / 3), Math.floor(risers / 3), risers - 2 * Math.floor(risers / 3)];
    const laneAz = laneLo + 18, laneBz = laneAz + 42, zL = [laneLo - 3, laneBz + 21] as const;
    const X = (u: number) => xEdge + sgn * (u - xEdge), box = (u0: number, u1: number) => ({ x0: Math.min(X(u0), X(u1)), x1: Math.max(X(u0), X(u1)), z0: zL[0], z1: zL[1] });
    const L0 = box(xEdge, xEdge + 36);
    const [f1, f2, f3] = flights;
    const u0 = xEdge + 36, b1u = u0 + (f1 - 1) * RUN, el1 = topEl - f1 * RISE, L1 = box(b1u, b1u + 36);
    const b2u = b1u - (f2 - 1) * RUN, el2 = el1 - f2 * RISE, L2r = box(b2u - 36, b2u);
    const b3u = b2u + (f3 - 1) * RUN;
    const b1x = X(b1u), b2x = X(b2u), b3x = X(b3u), dn = (-1 * sgn) as 1 | -1, up = (1 * sgn) as 1 | -1;
    stairFlight([b1x, el1, laneAz], dn, f1, tag); stairFlight([b2x, el2, laneBz], up, f2, tag); stairFlight([b3x, 0, laneAz], dn, f3, tag);
    platform(L0.x0, L0.z0, L0.x1, L0.z1, topEl, { span: 'z', tag: `${tag}-landing` }); platform(L1.x0, L1.z0, L1.x1, L1.z1, el1, { span: 'z', tag: `${tag}-landing` }); platform(L2r.x0, L2r.z0, L2r.x1, L2r.z1, el2, { span: 'z', tag: `${tag}-landing` });
    for (const [x, z] of [[L0.x0, L0.z0], [L0.x1, L0.z0], [L0.x1, L0.z1], [L0.x0, L0.z1]]) postColumn(x, z, topEl - barDepth - platformBeam.dims.d, `${tag}-landing`);
    for (const [x, z] of [[L1.x0, L1.z0], [L1.x1, L1.z0], [L1.x1, L1.z1], [L1.x0, L1.z1]]) postColumn(x, z, el1 - barDepth - platformBeam.dims.d, `${tag}-landing`);
    for (const [x, z] of [[L2r.x0, L2r.z0], [L2r.x1, L2r.z0], [L2r.x1, L2r.z1], [L2r.x0, L2r.z1]]) postColumn(x, z, el2 - barDepth - platformBeam.dims.d, `${tag}-landing`);
    const c = (Lr: { x0: number; x1: number; z0: number; z1: number }): [number, number] => [(Lr.x0 + Lr.x1) / 2, (Lr.z0 + Lr.z1) / 2];
    const inn = (Lr: { x0: number; x1: number }) => (sgn > 0 ? Lr.x0 : Lr.x1), out = (Lr: { x0: number; x1: number }) => (sgn > 0 ? Lr.x1 : Lr.x0);   // inner face (toward the platform) and outer face of a landing
    guardrail([[inn(L0), topEl, L0.z1], [out(L0), topEl, L0.z1], [out(L0), topEl, laneLo + 36 + 3]], c(L0), `${tag}-landing`); guardrail([[inn(L0), topEl, L0.z0], [out(L0), topEl, L0.z0]], c(L0), `${tag}-landing`);
    guardrail([[out(L1), el1, L1.z0], [out(L1), el1, L1.z1]], c(L1), `${tag}-landing`); guardrail([[inn(L1), el1, L1.z1], [out(L1), el1, L1.z1]], c(L1), `${tag}-landing`); guardrail([[inn(L1), el1, L1.z0], [out(L1), el1, L1.z0]], c(L1), `${tag}-landing`);
    guardrail([[inn(L2r), el2, L2r.z0], [inn(L2r), el2, L2r.z1]], c(L2r), `${tag}-landing`); guardrail([[inn(L2r), el2, L2r.z1], [out(L2r), el2, L2r.z1]], c(L2r), `${tag}-landing`); guardrail([[inn(L2r), el2, L2r.z0], [out(L2r), el2, L2r.z0]], c(L2r), `${tag}-landing`);
    return { risers, flights };
  };
  const st = stairTower(Y.V302.x + outer, laneA[0], top, 'stair');
  derived.stair = rule(st.risers, 'SW-SR-1', `Stair: ${st.risers} risers at ${RISE} in in flights of ${st.flights.join('/')}`, 'count');

  // column C-301 platforms with ladders, as plant 1
  const Rc = Y.C301.ID / 2 + Y.C301.t, inC = Rc + 2, outC = Rc + 50, [elMid, elTop] = Y.C301.platforms;
  vesselAnnulus(Y.C301.x, Y.C301.z, Rc, inC, outC, elMid, 'platform-C301-mid', [], [{ x0: Y.C301.x + inC, y0: Y.C301.z - 15, x1: Y.C301.x + inC + 30, y1: Y.C301.z + 15 }, ...cuts.filter(c => c.y === elMid).map(c => ({ cx: c.x, cy: c.z, r: c.r }))]);
  vesselAnnulus(Y.C301.x, Y.C301.z, Rc, inC, outC, elTop, 'platform-C301-top', [], [{ x0: Y.C301.x - inC - 30, y0: Y.C301.z - 15, x1: Y.C301.x - inC, y1: Y.C301.z + 15 }, ...cuts.filter(c => c.y === elTop).map(c => ({ cx: c.x, cy: c.z, r: c.r }))]);
  ladder([Y.C301.x + Rc + CAGE.standoff, Y.padHeight, Y.C301.z], elMid - Y.padHeight, [1, 0], 'C-301-ladder');
  ladder([Y.C301.x - Rc - CAGE.standoff, elMid, Y.C301.z], elTop - elMid, [-1, 0], 'C-301-ladder');

  // ---- rack access walkway (SW-PLANT-5 amended): 3 ft grating along the rack's south edge at the second tier, posts at every bent, guardrail, a ladder at each end ----
  const rwz0 = rk.halfWidth + 12, rwz1 = rwz0 + 36, rwt = rk.tiers[0] + 6, rx0 = rk.x0 + 12, rx1 = rk.x1 - 12;
  platform(rx0, rwz0, rx1, rwz1, rwt, { span: 'z', tag: 'rack-walkway' });
  for (let x = rx0; x <= rx1 + 1e-6; x += rk.bentSpacing) postColumn(x, rwz1, rwt - barDepth - platformBeam.dims.d, 'rack-walkway');
  guardrail([[rx0, rwt, rwz1], [rx1, rwt, rwz1]], [(rx0 + rx1) / 2, (rwz0 + rwz1) / 2], 'rack-walkway'); guardrail([[rx1, rwt, rwz0], [rx0, rwt, rwz0]], [(rx0 + rx1) / 2, (rwz0 + rwz1) / 2], 'rack-walkway');
  ladder([rx1 + CAGE.standoff, 0, (rwz0 + rwz1) / 2], rwt, [1, 0], 'rack-walkway'); ladder([rx0 - CAGE.standoff, 0, (rwz0 + rwz1) / 2], rwt, [-1, 0], 'rack-walkway');
  // ---- access platforms over the exchangers and the drum (SW-PLANT-5 amended): 16 ft up, four posts, guardrail, ladder on the rack side ----
  const topPlatform = (x0: number, z0: number, x1: number, z1: number, tag: string, rackSide: 1 | -1, ept: number) => {
    platform(x0, z0, x1, z1, ept, { span: 'z', tag, cuts: cuts.filter(c => c.y === ept).map(c => ({ cx: c.x, cy: c.z, r: c.r })) });
    for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) postColumn(x, z, ept - barDepth - platformBeam.dims.d, tag);
    guardrail([[x0, ept, z0], [x1, ept, z0], [x1, ept, z1], [x0, ept, z1]], [(x0 + x1) / 2, (z0 + z1) / 2], tag, true);
    ladder([(x0 + x1) / 2, 0, rackSide > 0 ? z0 - CAGE.standoff : z1 + CAGE.standoff], ept, [0, rackSide > 0 ? -1 : 1], tag);
  };
  for (const [tag, pos] of EXCH3) topPlatform(pos.x - 120, pos.z - 36, pos.x - 36, pos.z + 36, `${tag}-platform`, pos.z > 0 ? 1 : -1, 288);   // over the tube-side and shell-side inlet nozzles, above their stations (SW-LL-8 stubs)
  topPlatform(Y.D301.x - Y.D301.TT / 2 - 12, Y.D301.z - 42, Y.D301.x + Y.D301.TT / 2 + 12, Y.D301.z + 42, 'D-301-platform', 1, 324);
  // ---- operating platforms over the pump rows (SW-PLANT-5 amended): 10 ft up, posts in the gaps between the pumps, guardrail, ladder ----
  const pumpRow = (xs: number[], zc: number, tag: string) => {
    const pt = 150, hz = Y.pump.baseL / 2 + 12, x0 = Math.min(...xs) - 48, x1 = Math.max(...xs) + 48, z0 = zc - hz, z1 = zc + hz, side = Math.sign(zc) as 1 | -1;
    platform(x0, z0, x1, z1, pt, { span: 'z', tag, cuts: cuts.filter(c => c.y === pt).map(c => ({ cx: c.x, cy: c.z, r: c.r })) });
    const px = [x0, ...xs.slice(0, -1).map((x, i) => (x + xs[i + 1]) / 2), x1];
    for (const x of px) for (const z of [z0, z1]) postColumn(x, z, pt - barDepth - platformBeam.dims.d, tag);
    guardrail([[x0, pt, z0], [x1, pt, z0], [x1, pt, z1], [x0, pt, z1]], [(x0 + x1) / 2, zc], tag, true);
    ladder([(x0 + x1) / 2, 0, side > 0 ? z1 + CAGE.standoff : z0 - CAGE.standoff], pt, [0, side], tag);
  };
  pumpRow(Y.pumpsS.map(p => p.x), Y.pumpsS[0].z, 'pump-platform-S'); pumpRow(Y.pumpsN.map(p => p.x), Y.pumpsN[0].z, 'pump-platform-N');
  void guardrail;

  notes.push(`Pipe rack: bents at ${rk.bentSpacing / 12} ft, tiers at ${rk.tiers.map(t => t / 12).join(', ')} ft, beams W${Db}x${beamSize.w}, columns W${Dc}x${colSize.w}, struts W${Ds}x${wS} (SW-RK-*).`);
  notes.push(`Vessel platforms at ${top / 12} ft with a 3-flight stair; column platforms at ${elMid / 12} and ${elTop / 12} ft; caged ladders on the four tanks and the rack ends (SW-LAY-3). Outdoor area east of the building (SW-PLANT-6).`);
  return { instances: out, derived, notes, equipment };
}

// ---- nozzle geometry and schedule (SW-NOZ-2, drawing) --------------------------------------------------------------
function geometry3(): Record<string, Geo> {
  const g: Record<string, Geo> = {}, yV = Y.padHeight + 1.5 + 0.75;
  const vv = (tag: string, x: number, z: number, ID: number, t: number, TT: number, skirt: number) => { const R = ID / 2 + t, yb = yV + skirt + R / 2; g[tag] = { kind: 'vv', x, z, R, yb, yt: yb + TT }; };
  vv('V-301', Y.V301.x, Y.V301.z, Y.vessel.ID, Y.vessel.t, Y.vessel.TT, Y.vessel.skirtH); vv('V-302', Y.V302.x, Y.V302.z, Y.vessel.ID, Y.vessel.t, Y.vessel.TT, Y.vessel.skirtH);
  vv('C-301', Y.C301.x, Y.C301.z, Y.C301.ID, Y.C301.t, Y.C301.TT, Y.C301.skirtH);
  for (const [tag, d] of [['D-301', Y.D301], ['D-302', Y.D302], ['D-303', Y.D303]] as const) g[tag] = { kind: 'hv', x: d.x, z: d.z, R: d.ID / 2 + d.t, yc: Y.padHeight + d.centreline, xo: d.x - d.TT / 2 };
  for (const [tag, pos] of EXCH3) g[tag] = { kind: 'hv', x: pos.x, z: pos.z, R: Y.exchanger.ID / 2 + Y.exchanger.t, yc: Y.padHeight + Y.exchanger.centreline, xo: pos.x - Y.exchanger.TT / 2 + Y.exchanger.ID / 4 };
  Y.pumpsS.forEach((p, i) => { g[PUMPS3_S[i]] = { kind: 'pump', x: p.x, z: p.z, R: Y.pump.casingD / 2, s: 1 }; });
  Y.pumpsN.forEach((p, i) => { g[PUMPS3_N[i]] = { kind: 'pump', x: p.x, z: p.z, R: Y.pump.casingD / 2, s: -1 }; });
  for (const [tag, pos] of TANKS3) { const R = Y.tank.D / 2, rise = (R * 0.75) / 12, topY = Y.padHeight + Y.tank.H; g[tag] = { kind: 'tank', x: pos.x, z: pos.z, R, roof: (r: number) => topY + rise * (1 - r / R) }; }
  return g;
}
export const PLANT3_NOZZLES: NozzleDef[] = (() => {
  const d: NozzleDef[] = [];
  const n = (equip: string, id: string, service: string, NPS: number, cls: PipeClass, at: NozzleDef['at']) => d.push({ equip, id: `${equip}-${id}`, service, NPS, cls, at });
  for (const [v, side] of [['V-301', '+x'], ['V-302', '-x']] as const) {
    n(v, 'N1', 'inlet', 4, 'P300', { on: 'shell', e: 252, dir: '-z' }); n(v, 'N2', 'outlet', 4, 'P300', { on: 'shell', e: 108, dir: '-z' });
    n(v, 'N3', 'vent', 1, 'P150', { on: 'top', dx: 0, dz: 0 }); n(v, 'N4', 'drain', 2, 'P150', { on: 'shell', e: 102, dir: side });
    n(v, 'N5', 'nitrogen', 1, 'P150', { on: 'shell', e: 246, dir: side }); n(v, 'N6', 'instrument', 0.75, 'P300', { on: 'shell', e: 150, dir: side });
    n(v, 'N7', 'instrument', 0.75, 'P300', { on: 'shell', e: 216, dir: side }); n(v, 'N8', 'sample', 0.75, 'P300', { on: 'shell', e: 126, dir: side });
    n(v, 'N10', 'relief', 3, 'P300', { on: 'top', dx: -24, dz: 0 });
    n(v, 'N9', 'water', 2, 'P150', { on: 'shell', e: 168, dir: '+z' });   // desalter wash water (SW-PLANT-9)
  }
  n('C-301', 'N1', 'feed', 4, 'P300', { on: 'shell', e: 192, dir: '+z' }); n('C-301', 'N2', 'overhead', 6, 'P300', { on: 'top', dx: 0, dz: 0 }); n('C-301', 'N3', 'bottoms', 6, 'P300', { on: 'shell', e: 78, dir: '+z' });
  n('C-301', 'N4', 'reflux', 3, 'P300', { on: 'shell', e: 300, dir: '+z' }); n('C-301', 'N5', 'vent', 1, 'P150', { on: 'top', dx: 18, dz: 0 }); n('C-301', 'N6', 'drain', 2, 'P150', { on: 'shell', e: 72, dir: '-x' });
  n('C-301', 'N7', 'nitrogen', 1, 'P150', { on: 'shell', e: 186, dir: '+x' });   // above the mid platform's ladder rails
  n('C-301', 'N8', 'instrument', 0.75, 'P300', { on: 'shell', e: 102, dir: '-x' }); n('C-301', 'N9', 'instrument', 0.75, 'P300', { on: 'shell', e: 210, dir: '-z' });
  n('C-301', 'N10', 'sample', 0.75, 'P300', { on: 'shell', e: 108, dir: '-z' }); n('C-301', 'N11', 'relief', 3, 'P300', { on: 'top', dx: -18, dz: 0 });   // the sample nozzle above the drain's valved tee branch (SW-LL-8)
  n('C-301', 'N12', 'outlet', 4, 'P300', { on: 'shell', e: 216, dir: '+x' });   // distillate side draw between the platforms, above the feed (SW-PLANT-9)
  for (const [tag, dd, cls] of [['D-301', Y.D301, 'P300'], ['D-302', Y.D302, 'P150'], ['D-303', Y.D303, 'P150']] as const) {
    const xo = dd.x - dd.TT / 2, big = tag === 'D-301' ? 6 : tag === 'D-303' ? 8 : 4;
    n(tag, 'N1', 'inlet', big, cls, { on: 'hshell', x: xo + 30, side: 'top' }); n(tag, 'N2', 'outlet', tag === 'D-302' ? 3 : 4, cls, { on: 'hshell', x: xo + (tag === 'D-302' ? 90 : 108), side: 'bottom' });   // between the saddles (SW-EQ-2)
    n(tag, 'N3', 'relief', 3, cls, { on: 'hshell', x: xo + 108, side: 'top' }); n(tag, 'N4', 'vent', 1, 'P150', { on: 'hshell', x: xo + 60, side: 'top' });
    n(tag, 'N5', 'drain', 2, 'P150', { on: 'hshell', x: xo + 18, side: 'bottom' }); n(tag, 'N6', 'nitrogen', 1, 'P150', { on: 'hshell', x: xo + 84, side: 'top' });
    n(tag, 'N7', 'instrument', 0.75, cls, { on: 'hshell', x: xo + 84, side: '+z' }); n(tag, 'N8', 'instrument', 0.75, cls, { on: 'hshell', x: xo + 126, side: '+z' }); n(tag, 'N9', 'sample', 0.75, cls, { on: 'hshell', x: xo + 42, side: '+z' });   // clear of the instrument stub's manifold ports (SW-LL-8 side stacks)
    if (tag !== 'D-301') n(tag, 'N10', 'outlet 2', 2, cls, { on: 'hshell', x: xo + (tag === 'D-302' ? 120 : 156), side: tag === 'D-302' ? '-z' : '+z' });
    if (tag === 'D-301') n(tag, 'N11', 'inlet 2', 3, cls, { on: 'hshell', x: xo + 132, side: 'top' });
    if (tag === 'D-301') n(tag, 'N12', 'inlet 3', 3, cls, { on: 'hshell', x: xo + 156, side: 'top' });   // condensate from the overhead condenser (SW-PLANT-9)
  }
  for (const [tag, pos] of EXCH3) {
    const x0 = pos.x - Y.exchanger.TT / 2 + Y.exchanger.ID / 4, away = pos.z > 0 ? '+z' : '-z', steam = tag === 'E-301' || tag === 'E-302';
    n(tag, 'N1', 'tube in', 3, 'P300', { on: 'hshell', x: x0 - 12, side: 'top' }); n(tag, 'N2', 'tube out', 3, 'P300', { on: 'hshell', x: x0 - 12, side: 'bottom' });   // SW-LL-7: 3 in on 4 in lines
    n(tag, 'N3', 'shell in', steam ? 3 : 4, steam ? 'P300' : 'P150', { on: 'hshell', x: x0 + 24, side: 'top' }); n(tag, 'N4', 'shell out', steam ? 2 : 4, steam ? 'P150' : 'P150', { on: 'hshell', x: x0 + 168, side: away });   // every shell outlet on the side away from the rack: a water outlet's block, stub and globe (SW-LL-8) would reach the floor from the bottom, and the preheaters' condensate outlets stand where plant 2's water outlets do
    n(tag, 'N5', 'vent', 2, 'P150', { on: 'hshell', x: x0 + 156, side: 'top' }); n(tag, 'N6', 'drain', 1, 'P150', { on: 'hshell', x: x0 + 24, side: 'bottom' });   // SW-LL-7: 2 in vent nozzle
    n(tag, 'N7', 'instrument', 1, 'P300', { on: 'hshell', x: x0 + 96, side: away }); n(tag, 'N8', 'relief', 1, 'P150', { on: 'hshell', x: x0 + 120, side: 'top' });
  }
  const pumpNz: Record<string, [number, number]> = { 'P-301': [3, 2], 'P-302': [3, 3], 'P-303': [4, 3], 'P-304': [4, 3], 'P-305': [3, 2] };   // SW-LL-7: [suction, discharge], one size below the lines
  for (const p of [...PUMPS3_S, ...PUMPS3_N]) { const [sN, dN] = pumpNz[p.slice(0, 5)]; n(p, 'S', 'suction', sN, 'P150', { on: 'suction' }); n(p, 'D', 'discharge', dN, 'P300', { on: 'discharge' }); n(p, 'F', 'seal flush', 0.75, 'P150', { on: 'flush' }); }
  for (const t of ['T-301', 'T-302', 'T-303', 'T-304']) {
    const far = t === 'T-303' || t === 'T-304';   // the far tanks (residue, distillate) are vented only: no blanketing, relief valve or water connection (SW-PLANT-9)
    n(t, 'N1', 'outlet', 6, 'P150', { on: 'shell', e: 18, dir: '-x' }); n(t, 'N2', 'inlet', 4, 'P300', { on: 'top', dx: 0, dz: t === 'T-304' ? -48 : 48 }); if (!far) n(t, 'N3', 'relief', 3, 'P150', { on: 'top', dx: -36, dz: 0 });   // the distillate tank's inlet on the side away from the air receiver
    n(t, 'N4', 'vent', 3, 'P150', { on: 'top', dx: 0, dz: 0 }); n(t, 'N5', 'drain', 1, 'P150', { on: 'shell', e: 12, dir: '+x' }); if (!far) n(t, 'N6', 'nitrogen', 1, 'P150', { on: 'top', dx: 36, dz: 0 });
    n(t, 'N7', 'instrument', 0.75, 'P150', { on: 'shell', e: 84, dir: '-x' }); n(t, 'N8', 'instrument', 0.75, 'P150', { on: 'shell', e: 204, dir: '-x' }); if (!far) n(t, 'N9', 'water', 2, 'P150', { on: 'shell', e: 60, dir: '+x' });
  }
  return d;
})();
export const buildNozzles3 = (): Map<string, Nozzle> => buildNozzlesFrom(PLANT3_NOZZLES, geometry3(), Y.pumpPad);

// ---- line list (SW-LL-*, SW-PLANT-10) ---------------------------------------------------------------------------------
export function buildLineList3(): LineDef[] {
  const L: LineDef[] = [];
  const add = (seq: number, service: Service, NPS: number, cls: PipeClass, from: EndRef, to: EndRef, kind: LineDef['kind'] = 'routed', cv = false, check = false) => { const d: LineDef = { no: lineNo(NPS, cls, service, seq), service, NPS, cls, from, to, kind, cv, ...(check ? { check } : {}) }; L.push(d); return d.no; };
  const nz = (id: string): EndRef => ({ k: 'nozzle', id });
  const tap = (line: string, valve = false, via?: 'tee' | 'olet' | 'tway' | 'fway'): EndRef => ({ k: 'tap', line, valve, ...(via ? { via } : {}) });
  // ---- process (H), plant 2's lines first and in its order so they keep its routes (SW-PLANT-10): crude tank → charge pumps →
  //      steam preheaters E-301/E-302 (3-way pair) → desalters via a 4-way → column; overhead (hot-vapour bypass) → drum →
  //      reflux and naphtha pumps; bottoms → pumps → residue coolers E-303/E-304 (3-way pair) → residue tank; knock-out drum
  //      liquid → overhead drum. Then plant 3's own: overhead → condenser E-305 → drum; side draw → cooler E-306 → distillate tank ----
  let q = 1301;
  const proc = (a: EndRef, b: EndRef, NPS: number, cls: PipeClass, cv = false) => add(q++, 'P', NPS, cls, a, b, 'routed', cv);
  const s303 = proc(nz('T-301-N1'), nz('P-303A-S'), 6, 'P150'); proc(tap(s303), nz('P-303B-S'), 6, 'P150');
  const d303 = proc(nz('P-303A-D'), nz('E-301-N1'), 4, 'P300', true); proc(nz('P-303B-D'), tap(d303), 4, 'P300');
  proc(tap(d303, false, 'tway'), nz('E-302-N1'), 4, 'P300', true);                            // the three-way diverts to the second preheater (SW-LL-7: control valve)
  const o301 = proc(nz('E-301-N2'), nz('V-301-N1'), 4, 'P300', true); proc(nz('E-302-N2'), tap(o301, false, 'tway'), 4, 'P300');   // the second preheater's outlet combines by a three-way
  proc(tap(o301, false, 'fway'), nz('V-302-N1'), 4, 'P300', true);                            // the four-way switches the desalters (SW-LL-7: control valve)
  const f301 = proc(nz('V-301-N2'), nz('C-301-N1'), 4, 'P300', true); proc(nz('V-302-N2'), tap(f301), 4, 'P300', true);
  const ovh = proc(nz('C-301-N2'), nz('D-301-N1'), 6, 'P300', true);                          // overhead: the hot-vapour bypass straight to the drum, pressure control (SW-LL-7)
  const s301 = proc(nz('D-301-N2'), nz('P-301A-S'), 4, 'P300'); proc(tap(s301), nz('P-301B-S'), 4, 'P300');
  const r301 = proc(nz('P-301A-D'), nz('C-301-N4'), 3, 'P300', true); proc(nz('P-301B-D'), tap(r301), 3, 'P300');
  const s302 = proc(tap(s301), nz('P-302A-S'), 4, 'P300'); proc(tap(s302), nz('P-302B-S'), 4, 'P300');
  const d302 = proc(nz('P-302A-D'), nz('T-302-N2'), 4, 'P300', true); proc(nz('P-302B-D'), tap(d302), 4, 'P300');   // naphtha to its tank
  const s304 = proc(nz('C-301-N3'), nz('P-304A-S'), 6, 'P300'); proc(tap(s304), nz('P-304B-S'), 6, 'P300');
  const d304 = proc(nz('P-304A-D'), nz('E-303-N1'), 4, 'P300', true); proc(nz('P-304B-D'), tap(d304), 4, 'P300');
  proc(tap(d304, false, 'tway'), nz('E-304-N1'), 4, 'P300', true);   // SW-LL-7: control valve
  const o303 = proc(nz('E-303-N2'), nz('T-303-N2'), 4, 'P300', true); proc(nz('E-304-N2'), tap(o303, false, 'tway'), 4, 'P300');   // cooled residue to its tank
  const s305 = proc(nz('D-303-N2'), nz('P-305A-S'), 4, 'P150'); proc(tap(s305), nz('P-305B-S'), 4, 'P150');
  const d305 = proc(nz('P-305A-D'), nz('D-301-N11'), 3, 'P300', true); proc(nz('P-305B-D'), tap(d305), 3, 'P300');   // knock-out drum liquid to the overhead drum
  proc(tap(ovh), nz('E-305-N1'), 4, 'P300');                                                  // overhead vapour to the condenser
  proc(nz('E-305-N2'), nz('D-301-N12'), 3, 'P300');                                           // condensed overhead to the drum
  proc(nz('C-301-N12'), nz('E-306-N1'), 3, 'P300', true);                                     // distillate side draw to its cooler (SW-LL-7: control valve)
  proc(nz('E-306-N2'), nz('T-304-N2'), 3, 'P300', true);                                      // cooled distillate to its tank
  const processLines = L.filter(l => l.service === 'P').map(l => l.no);
  // ---- utility headers on the rack, upper tier (SW-RT-1, SW-LL-4) ----
  const hdr: Record<string, string> = {};
  for (const [svc, NPS, cls] of [['CWS', 8, 'P150'], ['CWR', 8, 'P150'], ['LS', 6, 'P300'], ['SC', 4, 'P150'], ['IA', 2, 'P150'], ['PA', 3, 'P150'], ['N', 2, 'P150'], ['W', 3, 'P150'], ['FL', 8, 'P150']] as [Service, number, PipeClass][])
    hdr[svc] = add(2301 + Object.keys(hdr).length, svc, NPS, cls, { k: 'blind' }, { k: 'blind' }, 'header');
  // ---- utility branches ----
  q = 3301;
  for (const e of ['E-303', 'E-304', 'E-305', 'E-306']) { add(q++, 'CWS', 4, 'P150', tap(hdr.CWS, true), nz(`${e}-N3`), 'routed', true); add(q++, 'CWR', 4, 'P150', nz(`${e}-N4`), tap(hdr.CWR, true), 'routed', false, true); }
  for (const e of ['E-301', 'E-302']) { add(q++, 'LS', 3, 'P300', tap(hdr.LS, true), nz(`${e}-N3`), 'routed', true, true); add(q++, 'SC', 2, 'P150', nz(`${e}-N4`), tap(hdr.SC, true), 'routed', false, true); }   // preheat steam
  for (const id of ['V-301-N5', 'V-302-N5', 'C-301-N7', 'D-301-N6', 'T-301-N6', 'T-302-N6', 'D-302-N6', 'D-303-N6']) add(q++, 'N', 1, 'P150', tap(hdr.N, true), nz(id));
  for (const p of [...PUMPS3_S, ...PUMPS3_N]) add(q++, 'W', 0.75, 'P150', tap(hdr.W, true), nz(`${p}-F`));
  for (const t of ['T-301', 'T-302']) add(q++, 'W', 2, 'P150', tap(hdr.W, true), nz(`${t}-N9`), 'routed', true, true);
  for (const v of ['V-301', 'V-302']) add(q++, 'W', 2, 'P150', tap(hdr.W, true), nz(`${v}-N9`), 'routed', true, true);   // desalter wash water
  add(q++, 'IA', 2, 'P150', nz('D-302-N10'), tap(hdr.IA, true), 'routed', false, true);             // the air receiver feeds the instrument-air header (check; SW-LL-7)
  add(q++, 'PA', 3, 'P150', nz('D-302-N2'), tap(hdr.PA, true), 'routed', false, true);              // and the plant-air header
  add(q++, 'FL', 8, 'P150', tap(hdr.FL, false), nz('D-303-N1'));                                    // the flare header runs out to the knock-out drum
  // ---- relief valves and their outlets to the flare header ----
  q = 4301;
  const rv = ['V-301-N10', 'V-302-N10', 'C-301-N11', 'D-301-N3', 'D-302-N3', 'D-303-N3', 'T-301-N3', 'T-302-N3'];
  for (const id of rv) { const cls: PipeClass = /^(V|C|D-301)/.test(id) ? 'P300' : 'P150'; add(q++, 'RV', 3, cls, nz(id), { k: 'blind' }, 'stub'); }
  for (const id of rv) add(q++, 'FL', 4, 'P150', { k: 'psv', nozzle: id }, tap(hdr.FL, false));
  for (const [e] of EXCH3) { add(q++, 'RV', 1, 'P150', nz(`${e}-N8`), { k: 'blind' }, 'stub'); add(q++, 'FL', 1.5, 'P150', { k: 'psv', nozzle: `${e}-N8` }, tap(hdr.FL, false)); }
  // thermal relief on every pump discharge: a 1 in relief valve on a tap, its outlet a small-bore line to the flare header
  for (const no of processLines.filter(n => L.find(l => l.no === n)!.from.k === 'nozzle' && /-D$/.test((L.find(l => l.no === n)!.from as { id: string }).id))) {
    const rvNo = add(q++, 'RV', 1, 'P300', tap(no, false), { k: 'blind' }, 'stub');
    add(q++, 'FL', 1, 'P150', { k: 'psv', nozzle: rvNo }, tap(hdr.FL, false));   // SW-LL-7: 1 in
  }
  // ---- hose stations (north side of the rack, every bent but the north pumps') ----
  q = 5301;
  const rk = Y.rack;
  for (let xb: number = rk.x0; xb <= rk.x1; xb += rk.bentSpacing) {
    if (xb === 2160) continue;                                                          // the north pumps' bent
    const svcs: [Service, number, PipeClass][] = [['W', 1.5, 'P150'], ['PA', 1, 'P150'], ['N', 1, 'P150'], ['IA', 0.5, 'P150']];   // SW-LL-7: water stations 1-1/2 in
    svcs.forEach(([svc, NPS, cls], i) => add(q++, 'HS', NPS, cls, tap(hdr[svc], true), { k: 'station', at: [xb === rk.x1 ? xb - 102 + 18 * i : xb + 30 + 18 * i, 42, -156] }));
  }
  // ---- equipment stubs: vents, drains, instruments, samples (SW-LL-3) ----
  q = 6301;
  const stub = (svc: Service, id: string, NPS: number, cls: PipeClass) => add(q++, svc, NPS, cls, nz(id), { k: 'blind' }, 'stub');
  for (const v of ['V-301', 'V-302']) { stub('V', `${v}-N3`, 1, 'P150'); stub('D', `${v}-N4`, 1.5, 'P150'); stub('I', `${v}-N6`, 0.75, 'P300'); stub('I', `${v}-N7`, 0.75, 'P300'); stub('SP', `${v}-N8`, 0.75, 'P300'); }
  stub('V', 'C-301-N5', 1, 'P150'); stub('D', 'C-301-N6', 1.5, 'P150'); stub('I', 'C-301-N8', 0.75, 'P300'); stub('I', 'C-301-N9', 0.75, 'P300'); stub('SP', 'C-301-N10', 0.75, 'P300');
  for (const [dd, cls] of [['D-301', 'P300'], ['D-302', 'P150'], ['D-303', 'P150']] as const) { stub('V', `${dd}-N4`, 1, 'P150'); stub('D', `${dd}-N5`, 1.5, 'P150'); stub('I', `${dd}-N7`, 0.75, cls); stub('I', `${dd}-N8`, 0.75, cls); stub('SP', `${dd}-N9`, 0.75, cls); }
  stub('P', 'D-303-N10', 2, 'P150');
  for (const [e] of EXCH3) { stub('V', `${e}-N5`, 1, 'P150'); stub('D', `${e}-N6`, 1, 'P150'); stub('I', `${e}-N7`, 1, 'P300'); }   // SW-LL-7: 1 in instrument stubs
  for (const [t] of TANKS3) { stub('V', `${t}-N4`, 1, 'P150'); stub('D', `${t}-N5`, 1, 'P150'); stub('I', `${t}-N7`, 0.75, 'P150'); stub('I', `${t}-N8`, 0.75, 'P150'); }
  // ---- taps on process lines: an instrument connection each, a sample point on every pump discharge, a gauge on every suction ----
  q = 7301;
  for (const no of processLines) add(q++, 'I', 0.75, 'P300', tap(no, true), { k: 'blind' }, 'stub');
  const fromId = (no: string) => { const l = L.find(x => x.no === no)!; return l.from.k === 'nozzle' ? l.from.id : ''; };
  const toId = (no: string) => { const l = L.find(x => x.no === no)!; return l.to.k === 'nozzle' ? l.to.id : ''; };
  for (const no of processLines.filter(n => /A-D$/.test(fromId(n)))) { add(q++, 'SP', 0.75, 'P300', tap(no, true), { k: 'blind' }, 'stub'); add(q++, 'SP', 0.75, 'P300', tap(no, true), { k: 'blind' }, 'stub'); }   // SW-LL-7: a pump pair's two sample points on its common discharge
  add(q++, 'SP', 0.75, 'P300', tap(ovh, true), { k: 'blind' }, 'stub');   // and one on the column overhead
  for (const no of processLines.filter(n => /-S$/.test(toId(n)))) add(q++, 'I', 0.75, 'P300', tap(no, true), { k: 'blind' }, 'stub');
  // ---- header drains (one at each end) and a high-point vent on every header ----
  q = 8301;
  for (const h of Object.values(hdr)) for (const svc of ['D', 'D', 'V'] as Service[]) add(q++, svc, 0.75, 'P150', tap(h, true), { k: 'blind' }, 'stub');
  return L;
}

// ---- the plant ----------------------------------------------------------------------------------------------------
export const PLANT3: PlantDef = {
  id: 'P3', name: 'SmartWeld crude topping unit (plant 3)',
  building: () => generateBuilding(PLANT2_BUILDING), interior: (cuts) => generateInterior3(cuts), nozzles: buildNozzles3, nozzleDefs: () => PLANT3_NOZZLES, lines: buildLineList3,
  rack: Y.rack, grid: { x0: -120, x1: Y.outdoor.x1, y1: 520, z0: -660, z1: 660 },
  joint: (l, byNo) => jointBySpec(lineGroup(l, byNo), l.NPS), flangeType: (l, byNo) => flangeBySpec(lineGroup(l, byNo), l.NPS, l.cls),
  verticalThroughPlatforms: true, wallX: L3, stubsClearOfParentStacks: true,
  areas: {
    A300: { name: 'Tank farm and outdoor drums', equipment: ['T-301', 'T-302', 'T-303', 'T-304', 'D-302', 'D-303'] },
    A310: { name: 'Desalting and distillation', equipment: ['V-301', 'V-302', 'C-301', 'D-301'] },
    A320: { name: 'Exchangers', equipment: EXCH3.map(e => e[0]) },
    A330: { name: 'Pumps', equipment: [...PUMPS3_S, ...PUMPS3_N] },
    A350: { name: 'Pipe rack', equipment: [] },
  },
  pilot: ['6"-P150-P-1301', '3/4"-P150-W-3321', '1"-P150-FL-4330', '1"-P150-HS-5302'],   // a butt-weld process line, a threaded seal flush, a socket-weld relief outlet, a hose station
  paths: { piping: 'public/plants/P3/plant-piping.json', groundtruth: 'public/plants/P3/groundtruth', answerKey: 'eval/P3/answer-key.json', designer: 'downloads/designer-package-P3' },
};
export type { BuildingModel };
void makePlate; void drawing; void nonSteel; void (0 as unknown as Vec3); void (0 as unknown as V3);

