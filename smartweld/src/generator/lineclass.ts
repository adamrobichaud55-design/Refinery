/**
 * Line classes (DESIGN_BASIS.md §41, SW-LC-*): SmartWeld piping specifications, one per fluid group and
 * pressure class, and the assignment of every line to one.
 */
import { CLASS_PRESSURE, type PipeClass } from '../catalogue';

export type FluidGroup = 'H' | 'W' | 'S' | 'C' | 'G' | 'F';
/** SW-LC-1 fluid groups; SW-LC-3 insulation; colour is display only (not ground truth) */
export const FLUID_GROUPS: Record<FluidGroup, { name: string; insulated: boolean; colour: number }> = {
  H: { name: 'Hydrocarbon process', insulated: false, colour: 0xc8742a },
  W: { name: 'Water (cooling and process)', insulated: false, colour: 0x2f7fc1 },
  S: { name: 'Low-pressure steam', insulated: true, colour: 0xb83a3a },
  C: { name: 'Steam condensate', insulated: true, colour: 0x8a5cb8 },
  G: { name: 'Air and gases', insulated: false, colour: 0x3a9e5c },
  F: { name: 'Flare and relief outlets', insulated: false, colour: 0xd4b21f },
};
/** SW-LC-2: services that carry their own fluid */
const BY_SERVICE: Partial<Record<string, FluidGroup>> = { P: 'H', RV: 'H', CWS: 'W', CWR: 'W', W: 'W', LS: 'S', SC: 'C', IA: 'G', PA: 'G', N: 'G', FL: 'F', CA: 'G' };

export interface LineClass {
  code: string; group: FluidGroup; fluid: string; cls: PipeClass; designPressure: number; insulated: boolean;
  materials: Record<string, string>; valves: string; branch: string; rules: string[];
}
/** SW-LC-3: what a class records */
export function lineClassFor(group: FluidGroup, cls: PipeClass): LineClass {
  const g = FLUID_GROUPS[group];
  return {
    code: `${group}${cls.slice(1)}`, group, fluid: g.name, cls, designPressure: CLASS_PRESSURE[cls], insulated: g.insulated,
    materials: { pipe: 'Grade 35 pipe', fittings: 'Grade 35 pipe', flanges: 'Grade 36 forging', valveBodies: 'Grade 36 casting', studs: 'Grade 90 stud', gaskets: 'compressed sheet' },
    valves: 'Isolation: gate 2 in and above, floating ball below 2 in where offered; pump discharge: swing check then gate; control valves with a gate each side; relief: safety valve (SW-LL-3, SW-VLV-11)',
    branch: 'Tee (SW-FIT-2)',
    rules: ['SW-LC-1', 'SW-LC-3', 'SW-PIPE-1', 'SW-PIPE-2', 'SW-PIPE-3', 'SW-FLG-2', 'SW-FLG-7', 'SW-FIT-1', 'SW-FIT-2', 'SW-LL-3', 'SW-VLV-11'],
  };
}

interface LineLike { no: string; service: string; cls: PipeClass; from: string; to: string }
/** SW-LC-2: the fluid group of a line — its own service's, or that of the line it taps (vents, drains, instruments,
 *  samples and hose stations); on equipment nozzles those carry the process fluid */
export function fluidGroupOf(l: LineLike, byNo: Map<string, LineLike>, seen = new Set<string>()): FluidGroup {
  const own = BY_SERVICE[l.service]; if (own) return own;
  if (seen.has(l.no)) return 'H'; seen.add(l.no);
  for (const end of [l.from, l.to]) if (end.startsWith('tap ')) { const p = byNo.get(end.slice(4)); if (p) return fluidGroupOf(p, byNo, seen); }
  return 'H';
}
export const lineClassCode = (l: LineLike, byNo: Map<string, LineLike>) => `${fluidGroupOf(l, byNo)}${l.cls.slice(1)}`;
/** display colour of a class (viewer only): its fluid group's colour, darker by 35 % above P150 so classes of one
 *  group stay distinct */
export function classColour(code: string): number {
  const c = FLUID_GROUPS[code[0] as FluidGroup].colour, k = code.slice(1) === '150' ? 1 : 0.65;
  return (Math.round(((c >> 16) & 255) * k) << 16) | (Math.round(((c >> 8) & 255) * k) << 8) | Math.round((c & 255) * k);
}
