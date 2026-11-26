/**
 * Plant 3: the cooling water mains as a plant for the piping generator of plants 1 and 2 (DESIGN_BASIS.md §81, SW-CWM-*).
 * Two 30 in mains on concrete sleepers at grade in the corridor's north strip, from limit spools at the edge of the cooling
 * tower's plot to limit spools 20 ft west of their westernmost branch, and a branch from each to every unit's cooling water
 * header spool at its limit (SW-RPI-15). The generator is unchanged: it is given the sleeper way as a rack of one tier, the
 * spools as nozzles, a line list and where lines may travel; everything the pipeway and the units have built stands as solid.
 */
import { readFileSync } from 'node:fs';
import { pipeDims, designFlange, gateFaceToFace, type PipeClass } from '../catalogue';
import type { PlantDef } from '../generator/plant';
import { jointBySpec, flangeBySpec, lineGroup } from '../generator/plant';
import type { Nozzle, NozzleDef } from '../generator/nozzles';
import type { LineDef, EndRef, Service } from '../generator/linelist';
import type { BuildingModel, Placed } from '../generator/building';
import type { InteriorModel } from '../generator/interior';
import { interiorKit } from '../generator/interiorKit';
import { worldBox, type PipingModel } from '../generator/piping';
import { frameFromAxes, multiply, translate } from '../geometry/transform';
import type { Mat4 } from '../geometry/mesh';
import { cells } from './assemble';
import { bench, PIPEWAY_Z } from './site';
import { RACK } from './cell';
import { unitPiping, block, gateWidth, gateReach, type UnitRun, type RackLane, type V3 } from './unitPiping';
import { lineNumber } from './registry';
import { plantHeaders } from './headers';
import { pipeway, PWY, PIPED, MIN_BRANCH, unitToPipeway, type PipewayLine } from './pipeway';
import { runSolids, valveBoxFn } from './pipingReport';

const up = (v: number, s = 6) => Math.ceil(v / s - 1e-9) * s, down = (v: number, s = 6) => Math.floor(v / s + 1e-9) * s;
const xf = (m: Mat4, p: V3): V3 => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]].map(v => Math.round(v * 1e6) / 1e6) as V3;
const rot = (m: Mat4, p: V3): V3 => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2], m[1] * p[0] + m[5] * p[1] + m[9] * p[2], m[2] * p[0] + m[6] * p[1] + m[10] * p[2]].map(v => Math.round(v * 1e6) / 1e6) as V3;

/** SW-CWM-1, SW-CWM-2, SW-CWM-3, SW-CWM-5: the area's own figures, in */
export const CWM = {
  area: 27, /** the sleeper way's centre line, from the main rack's, z (north is negative) */ way: -234, /** a sleeper's top above grade, its length along the way */ sleeperTop: 11, sleeperW: 12,
  /** how far a sleeper reaches beyond the pipes */ sleeperOver: 12, /** the west spools, beyond the westernmost branch */ westBeyond: 240, /** open over the ground to the tower, either side of its spools */ approach: 120,
  /** room above the units' top tiers */ headRoom: 72, /** beyond a spool in a valve bay */ bayBeyond: 18,
} as const;
const LENGTH = PWY.bays * PWY.bent;
/** the area's frame from the pipeway's: the way's centre line on z = 0 */
const SHIFT: Mat4 = translate(0, 0, -CWM.way);
const toArea = (p: V3): V3 => [p[0], p[1], Math.round((p[2] - CWM.way) * 1e6) / 1e6];

export interface CwSpool { tag: string; stream: string; party: string; unit: number; sends: boolean; line: string; stub?: string; NPS: number; cls: PipeClass; at: V3; where: string }
export interface CwBranch { unit: number; stream: string; spool: string; spoolNPS: number; NPS: number; line: string; sends: boolean }
export interface CwMain { stream: string; fluid: string; line: string; NPS: number; cls: PipeClass; designP: number; designT: number; lane: number; y: number }
export interface CoolingWater {
  plant: PlantDef; lines: PipewayLine[]; nozzles: Map<string, Nozzle>; runs: UnitRun[]; runOf: Map<string, number>; runPlant: (k: number, prior: Placed[], whole?: boolean | 'close') => PlantDef;
  foreseen: RackLane[]; /** what is real: the steel, the sleepers and the solids of what the pipeway and units have built */ interior: InteriorModel;
  mains: CwMain[]; branches: CwBranch[]; spools: CwSpool[]; sleepers: { x: number; z0: number; z1: number }[]; notes: string[];
  rack: { x0: number; x1: number; bentSpacing: number; halfWidth: number; tiers: number[]; loadPsf: number };
  /** from the area's frame to the pipeway's */ toPipeway: Mat4;
}

let cache: CoolingWater | undefined;
/** SW-CWM-*: the cooling water mains as a plant */
export function coolingWater(root = '.'): CoolingWater {
  if (cache) return cache;
  const pw = pipeway(), notes: string[] = [], vb = valveBoxFn();
  const site = cells();
  const units = site.filter(c => c.plot.kind === 'unit' && PIPED.includes(c.plot.unit)).map(({ plot, cell }) => ({ unit: plot.unit, plot, cell, T: unitToPipeway(plot, cell) }));
  const ct = site.find(c => c.plot.id === 'CT'); if (!ct) throw new Error('no cooling tower plot');
  if (bench(ct.plot.bench).el !== bench(units[0].plot.bench).el) throw new Error('the cooling tower plot is not on the corridor\'s bench (SW-CWM-3)');
  const PH = plantHeaders(() => 0).filter(h => h.fluid === 'CWS' || h.fluid === 'CWR').sort((a, b) => (a.fluid === 'CWS' ? -1 : 1) - (b.fluid === 'CWS' ? -1 : 1));
  if (PH.length !== 2) throw new Error(`the plant has ${PH.length} cooling water headers, not a supply and a return`);

  // ---- nozzles ----
  const nozzles = new Map<string, Nozzle>(), defs: NozzleDef[] = [];
  const addNozzle = (id: string, equip: string, service: string, NPS: number, cls: PipeClass, A: V3, u: V3, S = 12) => { nozzles.set(id, { id, equip, service, NPS, cls, A, u, face: [A[0] + u[0] * S, A[1] + u[1] * S, A[2] + u[2] * S], S, z0: A[2] }); defs.push({ equip, id, service, NPS, cls, at: { on: 'top', dx: 0, dz: 0 } }); };

  // SW-CWM-2: the lanes the generator will give the mains (SW-RT-2): the first on the centre line, the next the first place outward 3 in clear of it, north first
  const OD = pipeDims(PH[0].NPS, PH[0].cls).OD, y = up(CWM.sleeperTop + 4 + OD / 2);
  // the supply on the centre line; the return a valve's pitch north of it (SW-PWY-4's pitch), held there by a fence between while it is routed
  const fl = designFlange(PH[0].NPS, PH[0].cls).OD, pitch = up(Math.max(fl + 6, gateWidth(PH[0].NPS, PH[0].cls) + 3)), lanes = [0, -pitch];

  // ---- SW-CWM-4: each unit's cooling water header spools, as they stand in its model ----
  interface Conn { stream: string; fluid: string; unit: number; tag: string; sends: boolean; NPS: number; cls: PipeClass; nozzle: string; face: V3 }
  const conns: Conn[] = [], cwTags = new Set<string>(), bays: { unit: number; x0: number; x1: number; side: -1 | 1; depth: number }[] = [];
  for (const U of units) {
    const upu = unitPiping(U.unit), o = xf(U.T, [0, 0, 0]), side: -1 | 1 = xf(U.T, [100, 0, 0])[2] > o[2] ? 1 : -1;
    for (const h of PH) for (const sp of upu.spools.filter(q => q.stream === h.key)) {
      const q = upu.nozzles.get(`${sp.tag}-P`)!, A = toArea(xf(U.T, q.A as V3)), dir = rot(U.T, q.u as V3), id = `${sp.tag}-P`;
      if (sp.cls !== h.cls) throw new Error(`${sp.tag}: its class ${sp.cls} is not its header's, ${h.cls} (SW-PRC-19)`);
      addNozzle(id, sp.tag, 'cooling water side', sp.NPS, sp.cls, A, dir, q.S); cwTags.add(sp.tag);
      conns.push({ stream: h.key, fluid: h.fluid, unit: U.unit, tag: sp.tag, sends: sp.dir === 'out', NPS: sp.NPS, cls: sp.cls, nozzle: id, face: nozzles.get(id)!.face });
    }
    const mine = conns.filter(c => c.unit === U.unit);
    if (mine.length) bays.push({ unit: U.unit, x0: o[0] - U.cell.rack.halfWidth, x1: o[0] + U.cell.rack.halfWidth, side, depth: Math.max(...mine.map(c => Math.abs(c.face[2] + CWM.way) - 360)) + CWM.bayBeyond });
  }
  if (!conns.length) throw new Error('no unit has a cooling water header spool');

  // ---- SW-CWM-3: the limit spools at the tower's plot and at the west end ----
  const spools: CwSpool[] = []; let seq = 0; const newTag = () => `PL-${CWM.area}${String(++seq).padStart(2, '0')}`;
  const ctX = ((ct.plot.x0 + ct.plot.x1) / 2 - PWY.west) * 12, ctZ = (ct.plot.z1 - PIPEWAY_Z) * 12;   // the plot's south edge, in the pipeway's frame
  const towerX = PH.map(h => up(ctX + (h.fluid === 'CWS' ? 1 : -1) * pitch / 2));
  const westX = down(Math.min(...conns.map(c => c.face[0])) - CWM.westBeyond);
  const ends = new Map<string, { tower: string; west: string }>();
  PH.forEach((h, i) => {
    const t = newTag(), A = toArea([towerX[i], y, ctZ]); addNozzle(`${t}-P`, t, 'cooling water side', h.NPS, h.cls, A, [0, 0, 1]); addNozzle(`${t}-U`, t, 'limit', h.NPS, h.cls, A, [0, 0, -1]);
    const w = newTag(), B: V3 = [westX, y, lanes[i]]; addNozzle(`${w}-P`, w, 'cooling water side', h.NPS, h.cls, B, [1, 0, 0]); addNozzle(`${w}-U`, w, 'limit', h.NPS, h.cls, B, [-1, 0, 0]);
    ends.set(h.key, { tower: t, west: w });
  });

  // ---- the line list: the two mains, then the branches, the largest first, then the valve and blind beyond each limit spool ----
  const lines: PipewayLine[] = [], mains: CwMain[] = [], branches: CwBranch[] = []; let seqMain = 0, seqBranch = 100, seqStub = 800;
  for (const [i, h] of PH.entries()) {
    const e = ends.get(h.key)!, no = lineNumber(CWM.area, ++seqMain, h.NPS, h.cls, h.fluid), rest = { unit: CWM.area, stream: h.key, fluid: h.fluid, designP: h.designP, designT: h.designT };
    // the supply flows from the tower to the west end; the return from the west end to the tower
    const tower: EndRef = { k: 'nozzle', id: `${e.tower}-P` }, west: EndRef = { k: 'nozzle', id: `${e.west}-P` };
    lines.push({ def: { no, service: 'P' as Service, NPS: h.NPS, cls: h.cls, from: h.fluid === 'CWS' ? tower : west, to: h.fluid === 'CWS' ? west : tower, kind: 'routed' }, seq: seqMain, origin: 'main', ...rest, tier: 0, bare: ['from', 'to'] });
    mains.push({ stream: h.key, fluid: h.fluid, line: no, NPS: h.NPS, cls: h.cls, designP: h.designP, designT: h.designT, lane: lanes[i], y });
  }
  for (const c of [...conns].sort((a, b) => b.NPS - a.NPS || a.face[0] - b.face[0] || a.nozzle.localeCompare(b.nozzle))) {
    const m = mains.find(q => q.stream === c.stream)!, size = Math.max(MIN_BRANCH, c.NPS), no = lineNumber(CWM.area, ++seqBranch, size, m.cls, m.fluid), tap: EndRef = { k: 'tap', line: m.line, valve: false }, nz: EndRef = { k: 'nozzle', id: c.nozzle };
    lines.push({ def: { no, service: 'P' as Service, NPS: size, cls: m.cls, from: c.sends ? nz : tap, to: c.sends ? tap : nz, kind: 'routed' }, seq: seqBranch, origin: 'branch', unit: CWM.area, stream: m.stream, fluid: m.fluid, designP: m.designP, designT: m.designT, bare: [c.sends ? 'from' : 'to'] });
    branches.push({ unit: c.unit, stream: c.stream, spool: c.tag, spoolNPS: c.NPS, NPS: size, line: no, sends: c.sends });
  }
  for (const m of mains) {
    const e = ends.get(m.stream)!;
    for (const [tag, where] of [[e.tower, 'the cooling tower plot\'s south edge'], [e.west, 'the west end of the sleeper way']] as const) {
      const stub = lineNumber(CWM.area, ++seqStub, m.NPS, m.cls, m.fluid);
      lines.push({ def: { no: stub, service: 'P' as Service, NPS: m.NPS, cls: m.cls, from: { k: 'nozzle', id: `${tag}-U` }, to: { k: 'blind' }, kind: 'stub' }, seq: seqStub, origin: 'limit', unit: CWM.area, stream: m.stream, fluid: m.fluid, designP: m.designP, designT: m.designT });
      const sends = tag === e.tower ? m.fluid === 'CWS' : m.fluid === 'CWR';
      spools.push({ tag, stream: m.stream, party: tag === e.tower ? 'the cooling tower' : 'the areas beyond the bench', unit: tag === e.tower ? 19 : 0, sends, line: m.line, stub, NPS: m.NPS, cls: m.cls, at: nozzles.get(`${tag}-P`)!.A as V3, where });
    }
  }
  const list = lines.map(l => l.def), byNo = new Map(list.map(l => [l.no, l]));

  // ---- SW-CWM-2: the sleeper way, a rack of one tier, and its sleepers on the main rack's bent lines ----
  const rack = { x0: down(westX - PWY.bent, PWY.bent), x1: Math.min(LENGTH, up(Math.max(...towerX) + PWY.bent, PWY.bent)), bentSpacing: PWY.bent, halfWidth: 96, tiers: [CWM.sleeperTop], loadPsf: 0 };
  const own: Placed[] = [], derived: InteriorModel['derived'] = {}, kit = interiorKit({ pedestal: 6, padHeight: 6 }, own, derived);

  // ---- SW-CWM-5: what stands: the pipeway's steel, and as solids every piece of the pipeway's lines and of the units' lines in their valve bays ----
  const solids: Placed[] = [];
  // SW-PWY-8: the tier beams of a unit's first bent are steel all the same, but not shown to the generator while it routes (its valve at a spool stands over them)
  const firstBent = `rack-bent:${RACK.start - RACK.bent}`, hiddenBeam = (pl: Placed) => pl.tags.includes('beam') && pl.tags.includes(firstBent) && pl.tags.some(t => t.startsWith('unit-'));
  for (const pl of pw.interior.instances) solids.push({ part: pl.part, transform: multiply(SHIFT, pl.transform), tags: [...pl.tags, ...(hiddenBeam(pl) ? ['first bent'] : [])] });
  const pm = JSON.parse(readFileSync(`${root}/public/refinery/piping/pipeway.json`, 'utf8')) as PipingModel;
  for (const b of runSolids(pm, vb)) solids.push({ ...b, transform: multiply(SHIFT, b.transform), tags: [...(b.tags ?? []), 'pipeway line'] });
  for (const U of units) {
    const bay = bays.find(b => b.unit === U.unit); if (!bay) continue;
    const um = JSON.parse(readFileSync(`${root}/public/refinery/piping/unit-${U.unit}.json`, 'utf8')) as PipingModel;
    // the unit's frame: x into the unit from its limit. A piece within its valve bay, but for the pieces of a cooling water spool itself (the branch bolts to those)
    const inBay = (p: V3) => p[0] < RACK.start + 24 && Math.abs(p[2]) < U.cell.rack.halfWidth + 36;
    const near: PipingModel = { ...um, lines: [...um.lines.map(r => ({ ...r, comps: r.comps.filter(c => inBay(c.a) || inBay(c.b)), supports: r.supports.filter(s => inBay(s.at as V3)), side: (r.side ?? []).filter(c => inBay(c.a) || inBay(c.b)) })),
      { no: 'spools', comps: um.nozzles.filter(n => !cwTags.has(n.equip)).flatMap(n => n.comps ?? []).filter(c => inBay(c.a) || inBay(c.b)), supports: [], welds: [], path: [] } as unknown as PipingModel['lines'][number]] };
    for (const b of runSolids(near, vb)) solids.push({ ...b, transform: multiply(SHIFT, multiply(U.T, b.transform)), tags: [...(b.tags ?? []), `unit-${U.unit} line`] });
  }
  // sleepers, each where it stands 3 in clear of the steel (a junction frame's post)
  const sleepers: CoolingWater['sleepers'] = [], zs0 = Math.min(...lanes) - OD / 2 - CWM.sleeperOver, zs1 = Math.max(...lanes) + OD / 2 + CWM.sleeperOver;
  const steelBoxes = pw.interior.instances.filter(pl => pl.tags.includes('junction') || pl.tags.some(t => t.startsWith('rack'))).map(pl => { const b = placedBox(pl); return [[b[0][0], b[0][1], b[0][2] - CWM.way], [b[1][0], b[1][1], b[1][2] - CWM.way]] as [V3, V3]; });
  let left = 0;
  for (let x = rack.x0; x <= rack.x1 + 1e-6; x += PWY.bent) {
    const mn: V3 = [x - CWM.sleeperW / 2 - 3, 0, zs0 - 3], mx: V3 = [x + CWM.sleeperW / 2 + 3, CWM.sleeperTop + 3, zs1 + 3];
    if (steelBoxes.some(b => b[0].every((v, k) => v < mx[k]) && b[1].every((v, k) => v > mn[k]))) { left++; continue; }
    own.push({ part: kit.concrete('sleeper', CWM.sleeperW, CWM.sleeperTop, zs1 - zs0), transform: frameFromAxes([x, CWM.sleeperTop / 2, zs0], [0, 1, 0], [0, 0, 1]), tags: ['sleeper', 'pad', `sleeper:${x}`] });
    sleepers.push({ x, z0: zs0, z1: zs1 });
  }
  if (left) notes.push(`${left} sleeper${left > 1 ? 's' : ''} left out where it would come within 3 in of a junction frame's steel (SW-CWM-2).`);
  const interior: InteriorModel = { instances: [...own, ...solids], derived, notes: [`Cooling water mains: a sleeper way from x ${rack.x0} to ${rack.x1}, ${sleepers.length} sleepers (SW-CWM-2).`], equipment: [] };

  // ---- SW-CWM-5: where lines may travel (in the pipeway's frame, then moved) ----
  const gridTop = up(Math.max(RACK.tiers[RACK.tiers.length - 1] + CWM.headRoom, ...conns.map(c => c.face[1] + gateReach(c.NPS) + 6))), G = { x0: -60, x1: LENGTH + 60, z0: up(ctZ - 120) - 120, z1: 720 };
  const keep: [V3, V3][] = [];
  for (const side of [-1, 1] as const) {
    const holes = bays.filter(b => b.side === side).map(b => ({ x0: b.x0, x1: b.x1, depth: b.depth }));
    if (side === -1) holes.push({ x0: Math.min(...towerX) - CWM.approach, x1: Math.max(...towerX) + CWM.approach, depth: Infinity });
    holes.sort((a, b) => a.x0 - b.x0);
    let x = G.x0; const zin = side * 360, zout = side === -1 ? G.z0 : G.z1, z0 = Math.min(zin, zout), z1 = Math.max(zin, zout);
    for (const h of holes) { if (h.x0 > x) keep.push([[x, 0, z0], [h.x0, gridTop, z1]]); if (Number.isFinite(h.depth)) { const zd = side * (360 + h.depth); keep.push([[h.x0, 0, Math.min(zd, zout)], [h.x1, 0 + gridTop, Math.max(zd, zout)]]); } x = Math.max(x, h.x1); }
    if (x < G.x1) keep.push([[x, 0, z0], [G.x1, gridTop, z1]]);
  }
  const keepOut = keep.map(([a, b]) => block(toArea(a), toArea(b)));
  const shown: InteriorModel = { ...interior, instances: [...interior.instances, ...keepOut] };
  const building = { instances: [], derived: {}, notes: [], drawing: { bays: PWY.bays, bayFt: PWY.bent / 12, widthFt: 10, eaveFt: 0, slopeRisePer12: 0, slabIn: 0 } } as unknown as BuildingModel;
  const plant: PlantDef = {
    id: `R${CWM.area}`, name: 'SmartWeld coastal refinery (plant 3), area 27: the cooling water mains',
    building: () => building, interior: () => shown, nozzles: () => nozzles, nozzleDefs: () => defs, lines: () => list, rack,
    grid: { x0: G.x0, x1: G.x1, y1: gridTop, z0: G.z0 - CWM.way, z1: G.z1 - CWM.way },
    joint: l => jointBySpec(lineGroup(l, byNo), l.NPS), flangeType: l => flangeBySpec(lineGroup(l, byNo), l.NPS, l.cls), verticalThroughPlatforms: true,
    areas: { CWM: { name: 'Cooling water mains', equipment: [...new Set([...nozzles.values()].map(q => q.equip))] } }, pilot: [],
    paths: { piping: 'public/refinery/piping/cooling-water.json', groundtruth: 'public/refinery/units/cooling-water/groundtruth', answerKey: 'eval/refinery/answer-key-cooling-water.json', designer: 'downloads/refinery/cooling-water' },
  };
  // SW-CWM-4: two runs, the supply's lines and then the return's, each main with its branches and the valves beyond its limit spools
  const runs: UnitRun[] = mains.map(m => ({ kind: 'rest', lines: lines.filter(l => l.stream === m.stream).map(l => l.def.no) })), runOf = new Map(runs.flatMap((r, k) => r.lines.map(no => [no, k] as const)));
  // SW-CWM-5: while it routes, the generator is not shown the pipes of the pipeway and the units that stand where its own valve at a unit's spool stands, with its stem up
  // (that valve is not built, SW-PWY-7); the checks are made against them all the same
  const room = conns.map(c => { const q = nozzles.get(c.nozzle)!, f = q.face, u = q.u, L = gateFaceToFace(c.NPS, c.cls) + 6, w = gateWidth(c.NPS, c.cls) / 2 + 3, r = designFlange(c.NPS, c.cls).OD / 2;
    const b: V3 = [f[0] + u[0] * L, f[1], f[2] + u[2] * L], cw = (k: number) => (u[k] ? 0 : w);
    return [[Math.min(f[0], b[0]) - cw(0) - 3, f[1] - r - 3, Math.min(f[2], b[2]) - cw(2) - 3], [Math.max(f[0], b[0]) + cw(0) + 3, f[1] + gateReach(c.NPS) + 6, Math.max(f[2], b[2]) + cw(2) + 3]] as [V3, V3]; });
  const lineSolid = (pl: Placed) => pl.tags.some(t => t === 'pipeway line' || / line$/.test(t) && t.startsWith('unit-'));
  const inRoom = (pl: Placed) => { const b = placedBox(pl); return room.some(([mn, mx]) => b[0].every((v, k) => v < mx[k]) && b[1].every((v, k) => v > mn[k])); };
  const routed = shown.instances.filter(pl => !pl.tags.includes('first bent') && !pl.tags.includes('sleeper') && !(lineSolid(pl) && inRoom(pl)));
  const hiddenCount = shown.instances.length - routed.length;
  // a first bent's tier beam is shown as a solid 4 in short of its top: no pipe passes through it, and the valve over it (a flange's half and 3 in) stands clear
  for (const pl of shown.instances.filter(q => q.tags.includes('first bent'))) { const [mn, mx] = placedBox(pl); routed.push(block(mn, [mx[0], mx[1] - 4, mx[2]], 'first bent beam, below its top')); }
  // the fence that holds the return in its lane: either side of the centre line, between the supply's pipe and the return's lane, along the way short of the tower's drops
  const r = OD / 2, fx1 = Math.min(...towerX) - CWM.approach;
  const fx0 = westX + CWM.westBeyond, fence = [block([fx0, y - r, -pitch + r + 6], [fx1, y + r, -r], 'lane fence'), block([fx0, y - r, r], [fx1, y + r, pitch - r - 6], 'lane fence')];
  const runPlant = (k: number, prior: Placed[]): PlantDef => ({ ...plant, interior: () => ({ ...shown, instances: [...routed, ...(k > 0 ? fence : []), ...prior] }) });
  notes.push(`${hiddenCount} solids not shown to the generator while it routes: the sleepers, the first bents' tier beams of the units and the pieces of the pipeway's and units' lines where the generator's own valve at a unit's spool stands (SW-CWM-5).`);
  cache = { plant, lines, nozzles, runs, runOf, runPlant, foreseen: [], interior, mains, branches, spools, sleepers, notes, rack, toPipeway: translate(0, 0, CWM.way) };
  return cache;
}

/** a placed part's box in its parent's frame, from its solid boxes */
function placedBox(pl: Placed): [V3, V3] { const b = worldBox(pl.part, pl.transform as Mat4); if (!b) throw new Error('a part with no solid'); return b as [V3, V3]; }
