/** The plants (SW-PLANT-1): plant 1 (stages 1–8), plant 2 (stage 9) and plant 3 (stage 10). */
import { PLANT1, type PlantDef } from './plant';
import { PLANT2 } from './plant2';
import { PLANT3 } from './plant3';
export const PLANTS: PlantDef[] = [PLANT1, PLANT2, PLANT3];
export const plantById = (id: string): PlantDef => { const p = PLANTS.find(x => x.id === id); if (!p) throw new Error(`no plant ${id}`); return p; };
