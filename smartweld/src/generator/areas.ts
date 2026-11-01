/** Maintenance areas (DESIGN_BASIS.md §45, SW-AREA-1/2). */
export const AREAS: Record<string, { name: string; equipment: string[] }> = {
  A100: { name: 'Tank farm', equipment: ['T-101', 'T-102'] },
  A200: { name: 'Vessels and column', equipment: ['V-101', 'V-102', 'C-101'] },
  A300: { name: 'Exchangers and drum', equipment: ['E-101', 'E-102', 'E-103', 'D-101'] },
  A400: { name: 'Pumps', equipment: ['P-101A', 'P-101B', 'P-102A', 'P-102B', 'P-103A', 'P-103B', 'P-104A', 'P-104B'] },
  A500: { name: 'Pipe rack', equipment: [] },
};
/** SW-AREA-1: the area of a piece of equipment */
export const areaOfEquipment = (tag: string) => Object.keys(AREAS).find(a => AREAS[a].equipment.includes(tag)) ?? 'A500';
/** equipment tag at a line end ("E-101-N1", "PSV on D-101-N3", "P-101A-S") or null */
export function equipmentAt(end: string): string | null {
  const s = end.startsWith('PSV on ') ? end.slice(7) : end;
  for (const a of Object.values(AREAS)) for (const e of a.equipment) if (s.startsWith(e + '-')) return e;
  return null;
}
/** SW-AREA-2: a line's area — the equipment at its start, else at its end, else the rack */
export function areaOfLine(l: { from: string; to: string }): string {
  const e = equipmentAt(l.from) ?? equipmentAt(l.to);
  return e ? areaOfEquipment(e) : 'A500';
}
