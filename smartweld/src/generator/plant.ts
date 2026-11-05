/**
 * Plant definitions (DESIGN_BASIS.md §59, SW-PLANT-1/2): one data object per plant that every generator reads.
 * Plant 1 is the demonstration plant of stages 1–8 (its code and files unchanged); plant 2 is the coverage plant.
 */
import type { PipeClass, JointEnd, Cut } from '../catalogue';
import { generateBuilding, type BuildingModel } from './building';
import { generateInterior, DEMO_LAYOUT, type InteriorModel } from './interior';
import type { RackLayout } from './interiorKit';
import { buildNozzles, DEMO_NOZZLES, type Nozzle, type NozzleDef } from './nozzles';
import { buildLineList, type LineDef } from './linelist';
import { fluidGroupOf, type FluidGroup } from './lineclass';
import { AREAS } from './areas';

/** a round cut through a platform grating at a world point (SW-PEN-1), given to the interior builder */
export interface GratingCut { x: number; z: number; y: number; r: number }
export interface PlantDef {
  id: string; name: string;
  building: () => BuildingModel;
  interior: (cuts?: GratingCut[]) => InteriorModel;
  nozzles: () => Map<string, Nozzle>;
  nozzleDefs: () => NozzleDef[];
  lines: () => LineDef[];
  rack: RackLayout;
  /** routing grid extents (in): plant 1 is the building; plant 2 adds the outdoor area (SW-PLANT-6) */
  grid: { x0: number; x1: number; y1: number; z0: number; z1: number };
  /** SW-SPEC-1: the joint type of a line */
  joint: (l: LineDef, byNo: Map<string, LineDef>) => JointEnd;
  /** SW-FLG-10: the flange type of a line's flanged joints */
  flangeType: (l: LineDef, byNo: Map<string, LineDef>) => 'WN' | 'SO';
  /** SW-PEN-4: vertical runs may pass through platform gratings (with a sleeve) */
  verticalThroughPlatforms: boolean;
  /** the east steel line, where outdoor lines pass the end wall (SW-PEN-2); undefined = no outdoor area */
  wallX?: number;
  areas: Record<string, { name: string; equipment: string[] }>;
  /** SW-XCH-4: the three pilot lines */
  pilot: string[];
  /** where the plant's files live (SW-PLANT-2) */
  paths: { piping: string; groundtruth: string; answerKey: string; designer: string };
}

const lineGroup = (l: LineDef, byNo: Map<string, LineDef>): FluidGroup => {
  const like = (x: LineDef) => ({ no: x.no, service: x.service, cls: x.cls, from: x.from.k === 'tap' ? `tap ${x.from.line}` : x.from.k, to: x.to.k === 'tap' ? `tap ${x.to.line}` : x.to.k });
  const m = new Map([...byNo].map(([k, v]) => [k, like(v)] as const));
  return fluidGroupOf(like(l), m);
};
export { lineGroup };

export const PLANT1: PlantDef = {
  id: 'P1', name: 'SmartWeld demonstration plant (plant 1)',
  building: () => generateBuilding(), interior: () => generateInterior(), nozzles: () => buildNozzles(), nozzleDefs: () => DEMO_NOZZLES, lines: () => buildLineList(),
  rack: DEMO_LAYOUT.rack, grid: { x0: 0, x1: 2400, y1: 396, z0: -480, z1: 480 },
  joint: () => 'BW', flangeType: () => 'WN', verticalThroughPlatforms: false, areas: AREAS, pilot: ['6"-P150-P-1001', '1"-P150-HS-5002', '3"-P150-SC-2004'],
  paths: { piping: 'public/plant-piping.json', groundtruth: 'public/groundtruth', answerKey: 'eval/answer-key.json', designer: 'downloads/designer-package' },
};

/** SW-SPEC-1: butt welds at NPS ≥ 2; socket welds for small bore in H, S and F; threads for small bore in G, W and C */
export const jointBySpec = (group: FluidGroup, NPS: number): JointEnd => (NPS >= 2 ? 'BW' : group === 'H' || group === 'S' || group === 'F' ? 'SW' : 'TH');
/** SW-FLG-10: slip-on flanges for NPS ≥ 2 in the W and G classes at P150 */
export const flangeBySpec = (group: FluidGroup, NPS: number, cls: PipeClass): 'WN' | 'SO' => (NPS >= 2 && (group === 'W' || group === 'G') && cls === 'P150' ? 'SO' : 'WN');
void (0 as unknown as Cut);
