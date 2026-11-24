/** Plant 3: the review images of the equipment model and what each shows (DESIGN_BASIS.md §78). */
import { processModel } from './process';

const unitName = (no: number) => processModel().sheet(no).name;
export const MODEL_IMAGES: Record<string, string> = {
  ...Object.fromEntries([11, 12, 13, 14, 15, 16, 17, 18, 19].flatMap(u => [[`unit-${u}-from-the-vessel-side`, `Plant 3, unit ${u} (${unitName(u)}): equipment and rack, from the vessel side; no piping yet`], [`unit-${u}-from-the-exchanger-side`, `Plant 3, unit ${u} (${unitName(u)}): equipment and rack, from the exchanger side; no piping yet`]])),
  'cooling-tower-from-the-vessel-side': 'Plant 3, unit 19: the cooling tower with its circulating pumps', 'cooling-tower-from-the-exchanger-side': 'Plant 3, unit 19: the cooling tower, from the other side',
  'plant-from-the-south-west': 'Plant 3: the plant on its site from the south-west; equipment, racks and tanks, no piping yet',
  'plant-from-the-south-east': 'Plant 3: the plant from the south-east', 'plant-process-units-from-the-south': 'Plant 3: the process units on both sides of the main pipeway, from the south',
  'plant-crude-and-vacuum-units': 'Plant 3: the crude and vacuum units', 'plant-tank-farm-from-the-north-east': 'Plant 3: the tank terraces from the north-east', 'plant-piped-units-along-the-pipeway': 'Plant 3: the piped units along the main pipeway, their lines coloured by line class',
};
