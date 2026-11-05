/** The plants (SW-PLANT-1): plant 1 (stages 1–8) and plant 2 (stage 9). */
import { PLANT1, type PlantDef } from './plant';
import { PLANT2 } from './plant2';
export const PLANTS: PlantDef[] = [PLANT1, PLANT2];
export const plantById = (id: string): PlantDef => { const p = PLANTS.find(x => x.id === id); if (!p) throw new Error(`no plant ${id}`); return p; };
