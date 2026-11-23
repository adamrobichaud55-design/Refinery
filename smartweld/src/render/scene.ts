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
import type { FinishName } from './photo';

/** a part's mesh template, its placement (column-major 4 × 4) and its colour; templates are shared, never copied */
export interface Drawable { mesh: MeshData; T: Mat4; color: RGB; finish?: FinishName; cuttable?: boolean }
/** SW-REN-4: the finish each role wears in the photo style */
export const ROLE_FINISH: Record<Role, FinishName> = {
  steel: 'paint', hardware: 'zinc', weld: 'weld', sheet: 'paint', concrete: 'concrete', door: 'paint', equipment: 'gloss', casting: 'paint', closure: 'stainless', stem: 'stainless', polymer: 'polymer', pipe: 'paint', operator: 'gloss',
  rebar: 'rebar', galv: 'galv', jacket: 'aluminium', machine: 'gloss', safety: 'gloss', grout: 'concrete', nameplate: 'stainless',
};
const C = (h: number): RGB => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
/** the viewer's finish colours (src/viewer/main.ts MATERIALS), one per role */
export const ROLE_COLOUR: Record<Role, RGB> = {
  steel: C(0x6f7b8a), hardware: C(0x2e3238), weld: C(0xc8a24a), sheet: C(0xb8c4cf), concrete: C(0xb9b4a8), door: C(0x8a4b3c),
  equipment: C(0x9aa7a0), casting: C(0x56606a), closure: C(0xa9adb2), stem: C(0xb8bcc1), polymer: C(0x222222), pipe: C(0x6e7781), operator: C(0xb3261e),
  rebar: C(0x6b4a3a), galv: C(0xc3c8cc), jacket: C(0xdfe2e4), machine: C(0x2f5f8f), safety: C(0xe2b21c), grout: C(0xcfcbc0), nameplate: C(0xd0d3d6),
} as Record<Role, RGB>;
export const HIGHLIGHT: RGB = C(0xff8c1a), ISOLATION: RGB = C(0x1f6fd1);

const GALVANISED = new Set<PartSpec['kind']>(['GRATING', 'GRATING_TREAD', 'CAGE_HOOP', 'Z', 'CS', 'ROD']);
const partCache = new Map<PartSpec, { role: Role; mesh: MeshData }[]>();
/** placed parts (building, interior, a catalogue entry) */
export function partDrawables(list: { part: PartSpec; transform: Mat4 }[], colour?: (role: Role) => RGB): Drawable[] {
  const out: Drawable[] = [];
  for (const i of list) {
    let g = partCache.get(i.part); if (!g) { g = buildGeometry(i.part).solids.map(s => ({ role: s.role, mesh: s.mesh })); partCache.set(i.part, g); }
    const galv = GALVANISED.has(i.part.kind);   // SW-REN-4: gratings, treads, cage hoops, cold-formed purlins and girts and bracing rods are galvanised
    for (const s of g) out.push({ mesh: s.mesh, T: i.transform, color: colour ? colour(s.role) : galv && s.role === 'steel' ? ROLE_COLOUR.galv : ROLE_COLOUR[s.role] ?? ROLE_COLOUR.steel, finish: galv && s.role === 'steel' ? 'galv' : ROLE_FINISH[s.role] ?? 'paint', cuttable: s.role === 'concrete' || s.role === 'grout' });
  }
  return out;
}

const keyCache = new Map<string, { role: Role; mesh: MeshData }[]>();
function solidsOfKey(key: string, valveCells: number) {
  const ck = key.startsWith('VLV') ? `${key}@${valveCells}` : key;
  let g = keyCache.get(ck);
  if (!g) {
    if (key.startsWith('VLV')) {
      const [, t, n, c, e] = key.split('|');
      setMaxCells(valveCells);
      try { g = buildGeometry(makeValve(ck, t as ValveType, Number(n), c as PipeClass, (e as 'SW' | 'TH' | undefined) ?? 'RF')).solids.map(s => ({ role: s.role, mesh: s.mesh })); } finally { setMaxCells(110); }
    } else g = buildGeometry(partFromKey(key)).solids.map(s => ({ role: s.role, mesh: s.mesh }));
    keyCache.set(ck, g);
  }
  return g;
}

/** a piping or support part by its model key, placed: for the catalogue images of the piping families (SW-REN-4) */
export function keyDrawables(key: string, T: Mat4, valveCells = 110): Drawable[] {
  return solidsOfKey(key, valveCells).map(s => ({ mesh: s.mesh, T, color: ROLE_COLOUR[s.role] ?? ROLE_COLOUR.steel, finish: ROLE_FINISH[s.role] ?? 'paint' }));
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
    for (const c of [...l.comps, ...(l.side ?? []), ...(l.pens ?? [])]) {   // the chain, a valve station's spare-port closure, the sleeves (stage 9)
      if (c.kind === 'pipe' || c.kind === 'nipple') { const k = c.key.split('|'); const ins = c.ins ? c.ins[0] + c.ins[1] : 0; place(c.kind === 'pipe' ? `PIPE|${k[1]}|${k[2]}|1.000${k[4] ? '|' + k[4] : ''}` : `NIP|${k[1]}|${k[2]}|1.000|${k[4]}`, c.T, c.tag, lc, Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1], c.b[2] - c.a[2]) + ins); }
      else place(c.key, c.T, c.tag, lc);
    }
    for (const w of l.welds) place(w.key, w.T, w.id, lc);
    for (const s of l.supports) place(s.key, s.T, s.id, lc);
  }
  if (o.nozzles ?? !o.only) for (const nz of m.nozzles) { for (const c of nz.comps) place(c.key, c.T, c.tag); for (const w of nz.welds) place(w.key, w.T, w.id); }
  return out;
}
export const byLineClass = (l: LineRun): RGB => C(classColour(l.lineClass!));
