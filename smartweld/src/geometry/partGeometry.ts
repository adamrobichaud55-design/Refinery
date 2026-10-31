/** PartSpec → solids (plain mesh arrays). Same data feeds the viewer and the ground-truth export. */
import type { PartSpec } from '../catalogue/part';
import type { WDims } from '../catalogue/parts/wideFlange';
import type { CDims } from '../catalogue/parts/channel';
import { hexHardware } from '../catalogue/parts/hardware';
import { grooveDims } from '../catalogue/parts/welds';
import { cfDims, zProfile, csProfile } from '../catalogue/parts/coldFormed';
import { panelProfile, trimProfile } from '../catalogue/parts/cladding';
import { extrude, transformMesh, translation, signedVolume, mergeMeshes, type MeshData, type Profile, type EndCuts } from './mesh';
import { multiply as multiply4 } from './transform';
import { filletAroundProfile } from './sweep';
import { circle, regularHexagon, annularSector, rect, type Polygon, type Pt } from './polygon';
import { GRATING, type BarSeg } from '../catalogue/parts/access';
import { type FlangeDesign } from '../catalogue/parts/pipe';
import { revolve } from './mesh';
import { wProfile, cProfile, lProfile, hssRectProfile, hssRoundProfile, filletProfile, grooveProfile, ringAroundHole, N_CIRCLE } from './profiles';
const arcPts = (r: number, a0: number, a1: number, n: number) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return { x: r * Math.cos(a), y: r * Math.sin(a) }; });

export type Role = 'steel' | 'hardware' | 'weld' | 'sheet' | 'concrete' | 'door' | 'equipment' | 'casting' | 'closure' | 'stem' | 'polymer' | 'operator' | 'pipe';
export interface Solid { name: string; mesh: MeshData; role: Role }
export interface PartGeometry { partId: string; solids: Solid[]; profile?: Profile; volume: number }

const v = (dims: PartSpec['dims'], k: string) => dims[k].value;

export function profileOf(part: PartSpec): Profile | undefined {
  const d = part.dims;
  switch (part.kind) {
    case 'W': return { outer: wProfile({ D: v(d, 'D'), w: v(d, 'w'), A: v(d, 'A'), bf: v(d, 'bf'), tw: v(d, 'tw'), tf: v(d, 'tf'), R: v(d, 'R'), T: v(d, 'T'), d: v(d, 'd') } as WDims) };
    case 'C': return { outer: cProfile({ D: v(d, 'D'), w: v(d, 'w'), A: v(d, 'A'), bf: v(d, 'bf'), tw: v(d, 'tw'), tf: v(d, 'tf'), tTip: v(d, 'tTip'), tRoot: v(d, 'tRoot'), R: v(d, 'R'), rToe: v(d, 'rToe'), d: v(d, 'd') } as CDims) };
    case 'L': return { outer: lProfile(v(d, 'a'), v(d, 'b'), v(d, 't')) };
    case 'HSS_RECT': return hssRectProfile(v(d, 'H'), v(d, 'B'), v(d, 't'));
    case 'HSS_ROUND': return hssRoundProfile(v(d, 'OD'), v(d, 't'));
    case 'PL': { const w = v(d, 'w'), t = v(d, 't'); return { outer: [{ x: -w / 2, y: -t / 2 }, { x: w / 2, y: -t / 2 }, { x: w / 2, y: t / 2 }, { x: -w / 2, y: t / 2 }] }; }
    case 'GUSSET': case 'STIFFENER': return { outer: part.extra!.outline as Polygon };
    case 'Z': return { outer: zProfile(cfDims(v(d, 'D'), v(d, 'B'), v(d, 't'))) };
    case 'CS': return { outer: csProfile(cfDims(v(d, 'D'), v(d, 'B'), v(d, 't'))) };
    case 'ROD': return { outer: circle(0, 0, v(d, 'd') / 2, 24) };
    case 'PANEL': return { outer: panelProfile(v(d, 'cover')) };
    case 'TRIM': return { outer: (part.extra?.outline as Polygon | undefined) ?? trimProfile(v(d, 'a'), v(d, 'b'), v(d, 't')) };
    case 'CONCRETE': case 'DOOR_LEAF': case 'DOOR_CURTAIN': { const w = v(d, 'w'), t = v(d, 't'); return { outer: [{ x: -w / 2, y: -t / 2 }, { x: w / 2, y: -t / 2 }, { x: w / 2, y: t / 2 }, { x: -w / 2, y: t / 2 }] }; }
    case 'DOOR_DRUM': return { outer: circle(0, 0, v(d, 'dia') / 2, 32) };
    case 'FILLET_WELD': return { outer: filletProfile(v(d, 'leg')) };
    case 'GROOVE_WELD': return { outer: grooveProfile(grooveDims(v(d, 't'))) };
    default: return undefined;
  }
}

/** Plate with round holes: split into one convex cell per hole (Voronoi-like split along the mid-lines), each a ring. */
function plateWithHoles(w: number, h: number, t: number, holes: Pt[], holeD: number): MeshData[] {
  const out: MeshData[] = [];
  const xs = [...new Set(holes.map(p => p.x))].sort((a, b) => a - b);
  const ys = [...new Set(holes.map(p => p.y))].sort((a, b) => a - b);
  const bounds = (vals: number[], val: number, lo: number, hi: number) => {
    const i = vals.indexOf(val);
    const a = i === 0 ? lo : (vals[i - 1] + val) / 2;
    const b = i === vals.length - 1 ? hi : (val + vals[i + 1]) / 2;
    return [a, b];
  };
  for (const c of holes) {
    const [x0, x1] = bounds(xs, c.x, -w / 2, w / 2);
    const [y0, y1] = bounds(ys, c.y, -h / 2, h / 2);
    const rect: Polygon = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
    out.push(extrude(ringAroundHole(rect, c, holeD / 2, N_CIRCLE), t));
  }
  return out;
}

function hexNut(F: number, holeD: number, height: number): MeshData {
  return extrude(ringAroundHole(regularHexagon(F), { x: 0, y: 0 }, holeD / 2, N_CIRCLE), height);
}
function washerRing(OD: number, ID: number, t: number): MeshData {
  return extrude({ outer: circle(0, 0, OD / 2, N_CIRCLE), inner: circle(0, 0, ID / 2, N_CIRCLE) }, t);
}
function squareWasher(side: number, holeD: number, t: number): MeshData {
  const h = side / 2;
  return extrude(ringAroundHole([{ x: -h, y: -h }, { x: h, y: -h }, { x: h, y: h }, { x: -h, y: h }], { x: 0, y: 0 }, holeD / 2, N_CIRCLE), t);
}

export function buildGeometry(part: PartSpec): PartGeometry {
  const d = part.dims;
  const solids: Solid[] = [];
  const profile = profileOf(part);
  switch (part.kind) {
    case 'W': case 'C': case 'L': case 'HSS_RECT': case 'HSS_ROUND': case 'PL': case 'GUSSET': case 'STIFFENER': case 'Z': case 'CS': case 'ROD':
      solids.push({ name: part.designation, role: 'steel', mesh: extrude(profile!, part.length!.value, 0, part.extra?.endCuts as EndCuts | undefined) });
      break;
    case 'PANEL': case 'TRIM':
      solids.push({ name: part.designation, role: 'sheet', mesh: extrude(profile!, part.length!.value, 0, part.extra?.endCuts as EndCuts | undefined) });
      break;
    case 'FILLET_WELD_AROUND':
      solids.push({ name: part.designation, role: 'weld', mesh: filletAroundProfile(part.extra!.outline as Polygon, v(d, 'leg')) });
      break;
    case 'GRATING': case 'GRATING_TREAD': {
      const g = GRATING, bars = part.extra!.bars as BarSeg[], crosses = part.extra!.crosses as BarSeg[];
      const barMeshes: MeshData[] = [], crossMeshes: MeshData[] = [];
      for (const b of bars) barMeshes.push(transformMesh(extrude({ outer: rect(b.x0, b.y0 - g.barT / 2, b.x1, b.y0 + g.barT / 2) }, g.barDepth), translation(0, 0, -g.barDepth)));
      for (const c of crosses) crossMeshes.push(transformMesh(extrude({ outer: rect(c.x0 - g.crossSize / 2, c.y0, c.x0 + g.crossSize / 2, c.y1) }, g.crossSize), translation(0, 0, -g.crossSize)));
      solids.push({ name: 'bearing bars', role: 'steel', mesh: mergeMeshes(barMeshes) });
      if (crossMeshes.length) solids.push({ name: 'cross bars', role: 'steel', mesh: mergeMeshes(crossMeshes) });
      if (part.kind === 'GRATING_TREAD') {
        const w = v(d, 'width');
        solids.push({ name: 'nosing', role: 'steel', mesh: transformMesh(extrude({ outer: [{ x: 0, y: 0 }, { x: 1.25, y: 0 }, { x: 1.25, y: g.barT }, { x: g.barT, y: g.barT }, { x: g.barT, y: 1.25 }, { x: 0, y: 1.25 }] }, w), multiply4(translation(0, 0, 0), [0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, -1.25, 0, 1])) });
        for (const x of [0, w - g.barT]) solids.push({ name: 'carrier plate', role: 'steel', mesh: transformMesh(extrude({ outer: rect(x, 0, x + g.barT, 10) }, 2), translation(0, 0, -2)) });
      }
      break;
    }
    case 'CAGE_HOOP': {
      const { R, t, a0, a1 } = part.extra as { R: number; t: number; a0: number; a1: number };
      solids.push({ name: 'hoop', role: 'steel', mesh: extrude({ outer: annularSector(R, R + t, a0, a1, 48) }, part.length!.value) });
      break;
    }
    case 'VESSEL_V': case 'VESSEL_H': case 'EXCHANGER': case 'PUMP': case 'TANK':
      for (const s of part.extra!.solids as { name: string; mesh: MeshData }[]) solids.push({ name: s.name, role: 'equipment', mesh: s.mesh });
      break;
    case 'ELBOW': case 'TEE': case 'REDUCER': case 'CAP': case 'BUTT_WELD': case 'SUPPORT':
      for (const s of part.extra!.solids as { name: string; mesh: MeshData; role: Role }[]) solids.push({ name: s.name, role: s.role, mesh: s.mesh });
      break;
    case 'VALVE':
      for (const s of part.extra!.solids as { name: string; mesh: MeshData; role: Role }[]) solids.push({ name: s.name, role: s.role, mesh: s.mesh });
      break;
    case 'PIPE':
      solids.push({ name: part.designation, role: 'pipe', mesh: extrude({ outer: circle(0, 0, v(d, 'OD') / 2, 48), inner: circle(0, 0, v(d, 'D') / 2, 48) }, part.length!.value) });
      break;
    case 'FLANGE': case 'BLIND': {
      const f = part.extra!.design as FlangeDesign, blind = part.kind === 'BLIND';
      const bore = blind ? 0 : f.bore;
      const cells: MeshData[] = [];
      for (let i = 0; i < f.n; i++) {
        const a = (2 * Math.PI * (i + 0.5)) / f.n, half = Math.PI / f.n;
        const sector = blind ? [{ x: 0, y: 0 }, ...arcPts(f.OD / 2, a - half, a + half, 8)] : annularSector(bore / 2, f.OD / 2, a - half, a + half, 6);
        cells.push(extrude(ringAroundHole(sector, { x: (f.BC / 2) * Math.cos(a), y: (f.BC / 2) * Math.sin(a) }, f.holeD / 2, 24), f.tf));
      }
      solids.push({ name: 'flange ring', role: 'steel', mesh: mergeMeshes(cells) });
      solids.push({ name: 'raised face', role: 'steel', mesh: transformMesh(blind ? extrude({ outer: circle(0, 0, f.rfOD / 2, 48) }, f.rfH) : extrude({ outer: circle(0, 0, f.rfOD / 2, 48), inner: circle(0, 0, bore / 2, 48) }, f.rfH), translation(0, 0, -f.rfH)) });
      if (!blind) {
        const loop = [{ r: f.bore / 2, z: f.tf }, { r: f.bore / 2 + f.hubT, z: f.tf }, { r: f.bore / 2 + f.pipeT, z: f.tf + f.hubLen }, { r: f.bore / 2 + f.pipeT, z: f.tf + f.hubLen + f.neckLen }, { r: f.bore / 2, z: f.tf + f.hubLen + f.neckLen }];
        solids.push({ name: 'hub and neck', role: 'steel', mesh: revolve(loop, 48) });
      }
      break;
    }
    case 'GASKET': {
      const f = part.extra!.design as FlangeDesign;
      solids.push({ name: 'gasket', role: 'polymer', mesh: extrude({ outer: circle(0, 0, f.gasketID / 2 + f.wg, 48), inner: circle(0, 0, f.gasketID / 2, 48) }, f.gasketT) });
      break;
    }
    case 'STUD': {
      if (part.extra?.solids) { for (const s of part.extra.solids as { name: string; mesh: MeshData; role: Role }[]) solids.push({ name: s.name, role: s.role, mesh: s.mesh }); break; }
      const dia = v(d, 'd'), L = v(d, 'L'), h = hexHardware(dia);
      solids.push({ name: 'stud', role: 'hardware', mesh: extrude({ outer: circle(0, 0, dia / 2, 24) }, L) });
      for (const z of [h.nutH * 0.5, L - h.nutH * 1.5]) solids.push({ name: 'nut', role: 'hardware', mesh: transformMesh(hexNut(h.F, dia, h.nutH), translation(0, 0, z)) });
      break;
    }
    case 'CONCRETE':
      solids.push({ name: part.designation, role: 'concrete', mesh: extrude(profile!, part.length!.value) });
      break;
    case 'DOOR_LEAF': case 'DOOR_CURTAIN': case 'DOOR_DRUM':
      solids.push({ name: part.designation, role: 'door', mesh: extrude(profile!, part.length!.value) });
      break;
    case 'FILLET_WELD': case 'GROOVE_WELD':
      solids.push({ name: part.designation, role: 'weld', mesh: extrude(profile!, part.length!.value) });
      break;
    case 'BASE_PLATE': {
      const holes = part.extra!.holes as Pt[];
      for (const m of plateWithHoles(v(d, 'B'), v(d, 'N'), v(d, 't'), holes, v(d, 'hole')))
        solids.push({ name: 'base plate', role: 'steel', mesh: m });
      break;
    }
    case 'BOLT': {
      const dia = v(d, 'd'), L = v(d, 'L'), h = hexHardware(dia);
      const grip = d.grip ? d.grip.value : Math.max(0, L - h.washerT - h.nutH - dia / 4);
      solids.push({ name: 'head', role: 'hardware', mesh: transformMesh(extrude({ outer: regularHexagon(h.F) }, h.H), translation(0, 0, -h.H)) });
      solids.push({ name: 'shank', role: 'hardware', mesh: extrude({ outer: circle(0, 0, dia / 2, N_CIRCLE) }, L) });
      solids.push({ name: 'washer', role: 'hardware', mesh: transformMesh(washerRing(h.washerOD, h.hole, h.washerT), translation(0, 0, grip)) });
      solids.push({ name: 'nut', role: 'hardware', mesh: transformMesh(hexNut(h.F, dia, h.nutH), translation(0, 0, grip + h.washerT)) }); // nut bore at d (threads engaged)
      break;
    }
    case 'ANCHOR_ROD': {
      const dia = v(d, 'd'), h = hexHardware(dia);
      const embed = v(d, 'embed'), proj = v(d, 'proj'), grout = v(d, 'grout'), tbp = v(d, 'basePlateT');
      const hole = dia + 1 / 16; // washer holes; nut bores are at d
      solids.push({ name: 'rod', role: 'hardware', mesh: transformMesh(extrude({ outer: circle(0, 0, dia / 2, N_CIRCLE) }, embed + proj), translation(0, 0, -embed)) });
      solids.push({ name: 'embedded nut', role: 'hardware', mesh: transformMesh(hexNut(h.F, dia, h.nutH), translation(0, 0, -embed)) });
      solids.push({ name: 'embedded plate washer', role: 'hardware', mesh: transformMesh(squareWasher(3 * dia, hole, 3 / 8), translation(0, 0, -embed + h.nutH)) });
      solids.push({ name: 'leveling nut', role: 'hardware', mesh: transformMesh(hexNut(h.F, dia, h.nutH), translation(0, 0, grout - h.nutH)) });
      solids.push({ name: 'top plate washer', role: 'hardware', mesh: transformMesh(squareWasher(3 * dia, dia + 0.5, v(d, 'topWasherT')), translation(0, 0, grout + tbp)) });
      solids.push({ name: 'top nut', role: 'hardware', mesh: transformMesh(hexNut(h.F, dia, h.nutH), translation(0, 0, grout + tbp + v(d, 'topWasherT'))) });
      break;
    }
  }
  const volume = solids.reduce((s, x) => s + signedVolume(x.mesh), 0);
  return { partId: part.id, solids, profile, volume };
}
