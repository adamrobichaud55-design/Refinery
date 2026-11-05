/** Non-steel envelope parts (concrete pads, grout): no weight counted. */
import { drawing, type Dim } from '../core/basis';
import type { PartSpec } from '../catalogue';

export function nonSteel(id: string, kind: PartSpec['kind'], name: string, dims: Record<string, number>, lengthIn: number): PartSpec {
  const d: Record<string, Dim> = {};
  for (const [k, v] of Object.entries(dims)) d[k] = drawing(v, k);
  return { id, kind, category: 'non-steel', designation: name, dims: d, length: drawing(lengthIn, 'Length'), material: { grade: 'non-steel', Fy: drawing(0, 'n/a', 'ksi') }, weight: drawing(0, 'Not steel; weight not counted', 'lb'), notes: [] };
}
