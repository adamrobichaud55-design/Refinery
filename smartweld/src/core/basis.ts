/**
 * Every dimension carries its basis (DESIGN_BASIS.md section 0).
 */
export type Basis =
  | { kind: 'drawing' }
  | { kind: 'constant'; id: string }
  | { kind: 'rule'; id: string }
  | { kind: 'regulation'; cite: string };

export interface Dim {
  /** value in inches (or the unit named in `unit`) */
  value: number;
  unit: 'in' | 'lb/ft' | 'lb/ft3' | 'lb' | 'in2' | 'ksi' | 'deg' | 'count';
  basis: Basis;
  /** short human description for the dimension table */
  label: string;
}

export const drawing = (value: number, label: string, unit: Dim['unit'] = 'in'): Dim =>
  ({ value, unit, basis: { kind: 'drawing' }, label });
export const rule = (value: number, id: string, label: string, unit: Dim['unit'] = 'in'): Dim =>
  ({ value, unit, basis: { kind: 'rule', id }, label });
export const constant = (value: number, id: string, label: string, unit: Dim['unit']): Dim =>
  ({ value, unit, basis: { kind: 'constant', id }, label });

export function basisText(b: Basis): string {
  switch (b.kind) {
    case 'drawing': return 'stated on drawing';
    case 'constant': return `physical constant ${b.id}`;
    case 'rule': return `proportioned by SmartWeld rule ${b.id}`;
    case 'regulation': return `regulation ${b.cite}`;
  }
}

/** All rule IDs referenced by a set of dims (for the audit test). */
export function ruleIdsOf(dims: Record<string, Dim>): string[] {
  const out: string[] = [];
  for (const d of Object.values(dims)) if (d.basis.kind === 'rule') out.push(d.basis.id);
  return out;
}
