/** PartSpec → solids (plain mesh arrays). Same data feeds the viewer and the ground-truth export. */
import type { PartSpec } from '../catalogue/part';
import type { WDims } from '../catalogue/parts/wideFlange';
import type { CDims } from '../catalogue/parts/channel';
import { hexHardware } from '../catalogue/parts/hardware';
import { grooveDims } from '../catalogue/parts/welds';
import { extrude, transformMesh, translation, signedVolume, type MeshData, type Profile } from './mesh';
import { circle, regularHexagon, type Polygon, type Pt } from './polygon';
import { wProfile, cProfile, lProfile, hssRectProfile, hssRoundProfile, filletProfile, grooveProfile, ringAroundHole, N_CIRCLE } from './profiles';

export interface Solid { name: string; mesh: MeshData; role: 'steel' | 'hardware' | 'weld' }
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
    case 'W': case 'C': case 'L': case 'HSS_RECT': case 'HSS_ROUND': case 'PL': case 'GUSSET': case 'STIFFENER':
      solids.push({ name: part.designation, role: 'steel', mesh: extrude(profile!, part.length!.value) });
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
