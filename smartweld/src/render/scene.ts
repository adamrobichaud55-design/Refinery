/**
 * Scenes for SmartWeld's own renderer (DESIGN_BASIS.md §56, SW-REN-1): the model's part meshes placed in the plant,
 * in the viewer's finish colours. Built from the same generators and part keys as the viewer, without a browser.
 */
import { buildGeometry, type Role } from '../geometry/partGeometry';
import { setMaxCells } from '../geometry/sdf';
import type { MeshData, Mat4 } from '../geometry/mesh';
import { partFromKey, type PipingModel, type LineRun } from '../generator/piping';
import { makeValve, type PartSpec, type ValveType, type PipeClass } from '../catalogue';
import { classColour } from '../generator/lineclass';
import type { RGB } from './raster';

/** a part's mesh template, its placement (column-major 4 × 4) and its colour; templates are shared, never copied */
export interface Drawable { mesh: MeshData; T: Mat4; color: RGB }
const C = (h: number): RGB => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
/** the viewer's finish colours (src/viewer/main.ts MATERIALS), one per role */
export const ROLE_COLOUR: Record<Role, RGB> = {
  steel: C(0x6f7b8a), hardware: C(0x2e3238), weld: C(0xc8a24a), sheet: C(0xb8c4cf), concrete: C(0xb9b4a8), door: C(0x8a4b3c),
  equipment: C(0x9aa7a0), casting: C(0x56606a), closure: C(0xa9adb2), stem: C(0xb8bcc1), polymer: C(0x222222), pipe: C(0x6e7781), operator: C(0xb3261e),
} as Record<Role, RGB>;
export const HIGHLIGHT: RGB = C(0xff8c1a), ISOLATION: RGB = C(0x1f6fd1);

const partCache = new Map<PartSpec, { role: Role; mesh: MeshData }[]>();
/** placed parts (building, interior, a catalogue entry) */
export function partDrawables(list: { part: PartSpec; transform: Mat4 }[], colour?: (role: Role) => RGB): Drawable[] {
  const out: Drawable[] = [];
  for (const i of list) {
    let g = partCache.get(i.part); if (!g) { g = buildGeometry(i.part).solids.map(s => ({ role: s.role, mesh: s.mesh })); partCache.set(i.part, g); }
    for (const s of g) out.push({ mesh: s.mesh, T: i.transform, color: colour ? colour(s.role) : ROLE_COLOUR[s.role] ?? ROLE_COLOUR.steel });
  }
  return out;
}

const keyCache = new Map<string, { role: Role; mesh: MeshData }[]>();
function solidsOfKey(key: string, valveCells: number) {
  const ck = key.startsWith('VLV') ? `${key}@${valveCells}` : key;
  let g = keyCache.get(ck);
  if (!g) {
    if (key.startsWith('VLV')) {
      const [, t, n, c] = key.split('|');
      setMaxCells(valveCells);
      try { g = buildGeometry(makeValve(ck, t as ValveType, Number(n), c as PipeClass)).solids.map(s => ({ role: s.role, mesh: s.mesh })); } finally { setMaxCells(110); }
    } else g = buildGeometry(partFromKey(key)).solids.map(s => ({ role: s.role, mesh: s.mesh }));
    keyCache.set(ck, g);
  }
  return g;
}

export interface PipingOpts {
  only?: (l: LineRun) => boolean;
  /** colour by line (e.g. by line class); default the finish colour of each part */
  lineColour?: (l: LineRun) => RGB | undefined;
  /** tags drawn in a highlight colour */
  mark?: Map<string, RGB>;
  /** marching-grid cells for valves (the viewer's plant views use a coarser grid at distance) */
  valveCells?: number;
  nozzles?: boolean;
}
/** the plant piping: every pipe, fitting, flange, valve, weld and support at its transform (pipes scaled to length) */
export function pipingDrawables(m: PipingModel, o: PipingOpts = {}): Drawable[] {
  const out: Drawable[] = [], cells = o.valveCells ?? 18;
  const place = (key: string, T: Mat4, tag: string, lineCol?: RGB, sz = 1) => {
    const M = [...T] as Mat4; if (sz !== 1) { M[8] *= sz; M[9] *= sz; M[10] *= sz; }
    const mark = o.mark?.get(tag);
    for (const s of solidsOfKey(key, cells)) out.push({ mesh: s.mesh, T: M, color: mark ?? lineCol ?? ROLE_COLOUR[s.role] ?? ROLE_COLOUR.steel });
  };
  for (const l of m.lines) {
    if (o.only && !o.only(l)) continue;
    const lc = o.lineColour?.(l);
    for (const c of l.comps) {
      if (c.kind === 'pipe') { const [, n, k] = c.key.split('|'); place(`PIPE|${n}|${k}|1.000`, c.T, c.tag, lc, Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1], c.b[2] - c.a[2])); }
      else place(c.key, c.T, c.tag, lc);
    }
    for (const w of l.welds) place(w.key, w.T, w.id, lc);
    for (const s of l.supports) place(s.key, s.T, s.id, lc);
  }
  if (o.nozzles ?? !o.only) for (const nz of m.nozzles) { for (const c of nz.comps) place(c.key, c.T, c.tag); for (const w of nz.welds) place(w.key, w.T, w.id); }
  return out;
}
export const byLineClass = (l: LineRun): RGB => C(classColour(l.lineClass!));
