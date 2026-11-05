/**
 * Structural steel erection drawings and weld details (DESIGN_BASIS.md §64, SW-ERD-1..8), drawn from a plant's
 * structural model (the building and interior generators) with SmartWeld's own PDF writer. Every line, mark, size and
 * number on the sheets comes from the placed parts; the conventions (marks, grids, weld symbols) are SmartWeld's own.
 */
import { PdfDoc, hex, type Page, type RGB } from '../pdf/pdf';
import type { Font } from '../pdf/ttf';
import { solidBoxes } from '../generator/piping';
import type { Placed } from '../generator/building';
import type { PlantDef } from '../generator/plant';
import { formatLength } from '../core/units';
import type { PartSpec } from '../catalogue';

type V3 = [number, number, number]; type P2 = [number, number];
const INK = hex('#1b1f24'), GREY = hex('#6b7380'), LIGHT = hex('#aab2bd'), RULE = hex('#9aa3ad'), HEAD = hex('#eef2f7'), WELD = hex('#b0601a');
const W = 1224, H = 792, M = 30, TB = 54;                                    // sheet, margin, title block height (pt)
const AREA = { x0: M, y0: M, x1: W - M, y1: H - M - TB };                   // drawing area
const STEEL = new Set(['W', 'C', 'L', 'HSS_RECT', 'HSS_ROUND', 'Z', 'CS', 'ROD', 'PL', 'BASE_PLATE', 'GUSSET', 'STIFFENER', 'CAGE_HOOP', 'GRATING', 'GRATING_TREAD']);
export const MEMBER = new Set(['W', 'C', 'L', 'HSS_RECT', 'HSS_ROUND', 'Z', 'CS', 'ROD']);
/** SW-ERD-3: the standard scales (pt per inch of the plant), largest first */
const SCALES: [string, number][] = [['3" = 1\'-0"', 18], ['1-1/2" = 1\'-0"', 9], ['1" = 1\'-0"', 6], ['1/2" = 1\'-0"', 3], ['3/8" = 1\'-0"', 2.25], ['1/4" = 1\'-0"', 1.5], ['3/16" = 1\'-0"', 1.125], ['1/8" = 1\'-0"', 0.75], ['1/16" = 1\'-0"', 0.375], ['1/32" = 1\'-0"', 0.1875]];

// ---- marks (SW-ERD-2) ---------------------------------------------------------------------------------------------
const LETTER: Record<string, string> = { column: 'C', rafter: 'R', post: 'P', beam: 'B', 'intermediate-beam': 'B', strut: 'S', 'eave-strut': 'S', girt: 'G', purlin: 'Z', bracing: 'X', stringer: 'K', ladder: 'L', guardrail: 'H', handrail: 'H', 'end-plate': 'E', 'base-plate': 'BP', clip: 'CL', bracket: 'CL', 'anchor-rod': 'AR', header: 'D', jamb: 'D', cage: 'CG', grating: 'GR', tread: 'T' };
export interface Mark { mark: string; letter: string; designation: string; length: number; kind: string; count: number; unitWeight: number; rule: string; group: string }
const roleOf = (p: Placed) => p.tags[1] ?? p.tags[0] ?? p.part.kind;
const lengthOf = (p: Placed) => Math.round((p.part.length?.value ?? 0) * 16) / 16;
/** one mark per distinct part (designation and length), lettered by its role, numbered in the order met */
export function markParts(all: Placed[]): { marks: Mark[]; markOf: Map<Placed, Mark> } {
  const marks: Mark[] = [], by = new Map<string, Mark>(), markOf = new Map<Placed, Mark>(), next: Record<string, number> = {};
  for (const p of all) {
    if (!STEEL.has(p.part.kind) && p.part.kind !== 'BOLT' && p.part.kind !== 'ANCHOR_ROD') continue;
    const role = roleOf(p), letter = p.part.kind === 'BOLT' ? 'BT' : (LETTER[role] ?? (p.part.kind === 'W' ? 'B' : p.part.kind === 'PL' ? 'PL' : 'M'));
    if (p.part.kind === 'GRATING' && role !== 'grating') continue;
    const key = `${letter}|${p.part.designation}|${lengthOf(p)}`;
    let m = by.get(key);
    if (!m) { next[letter] = (next[letter] ?? 0) + 1; m = { mark: `${letter}${next[letter]}`, letter, designation: p.part.designation, length: lengthOf(p), kind: p.part.kind, count: 0, unitWeight: p.part.weight.value, rule: ruleOf(p.part), group: p.tags[0] }; by.set(key, m); marks.push(m); }
    m.count++; markOf.set(p, m);
  }
  return { marks, markOf };
}
const ruleOf = (p: PartSpec) => { const ids = new Set<string>(); for (const d of Object.values(p.dims)) if (d.basis.kind === 'rule') ids.add(d.basis.id); if (p.weight.basis.kind === 'rule') ids.add(p.weight.basis.id); return [...ids].filter(i => !/^K-|^SW-WD|^SW-U/.test(i)).slice(0, 2).join(', '); };

// ---- geometry: world boxes, projections, hulls, clipping ------------------------------------------------------------
const xf = (T: number[], p: V3): V3 => [T[0] * p[0] + T[4] * p[1] + T[8] * p[2] + T[12], T[1] * p[0] + T[5] * p[1] + T[9] * p[2] + T[13], T[2] * p[0] + T[6] * p[1] + T[10] * p[2] + T[14]];
const corners = (b: [V3, V3]): V3[] => { const c: V3[] = []; for (let k = 0; k < 8; k++) c.push([k & 1 ? b[1][0] : b[0][0], k & 2 ? b[1][1] : b[0][1], k & 4 ? b[1][2] : b[0][2]]); return c; };
/** the part's local box (every drawn solid) */
function localBox(p: PartSpec): [V3, V3] | null {
  const bs = solidBoxes(p); if (!bs.length) return null;
  const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity];
  for (const b of bs) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], b[0][a]); mx[a] = Math.max(mx[a], b[1][a]); }
  return [mn, mx];
}
const worldCorners = (p: Placed): V3[] | null => { const b = localBox(p.part); return b ? corners(b).map(c => xf(p.transform, c)) : null; };
const worldBoxOf = (p: Placed): [V3, V3] | null => { const cs = worldCorners(p); if (!cs) return null; const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity]; for (const c of cs) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], c[a]); mx[a] = Math.max(mx[a], c[a]); } return [mn, mx]; };
function hull(pts: P2[]): P2[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [], up: P2[] = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}
/** Sutherland–Hodgman clip of a polygon to a rectangle */
function clipRect(poly: P2[], r: { x0: number; y0: number; x1: number; y1: number }): P2[] {
  let out = poly;
  const edges: [(p: P2) => boolean, (a: P2, b: P2) => P2][] = [
    [p => p[0] >= r.x0, (a, b) => [r.x0, a[1] + (b[1] - a[1]) * (r.x0 - a[0]) / (b[0] - a[0])]], [p => p[0] <= r.x1, (a, b) => [r.x1, a[1] + (b[1] - a[1]) * (r.x1 - a[0]) / (b[0] - a[0])]],
    [p => p[1] >= r.y0, (a, b) => [a[0] + (b[0] - a[0]) * (r.y0 - a[1]) / (b[1] - a[1]), r.y0]], [p => p[1] <= r.y1, (a, b) => [a[0] + (b[0] - a[0]) * (r.y1 - a[1]) / (b[1] - a[1]), r.y1]],
  ];
  for (const [inside, cut] of edges) { const inp = out; out = []; for (let i = 0; i < inp.length; i++) { const a = inp[i], b = inp[(i + 1) % inp.length]; if (inside(b)) { if (!inside(a)) out.push(cut(a, b)); out.push(b); } else if (inside(a)) out.push(cut(a, b)); } if (!out.length) return []; }
  return out;
}

/** a view: a projection of plant coordinates (in) to paper (pt). Plans look down with east right and north up (+z is south,
 *  so it goes down the page); elevations look at a face. */
export interface View { kind: 'plan' | 'north' | 'south' | 'east' | 'west'; scale: number; ox: number; oy: number; label: string; scaleName: string; win: [V3, V3] }
const axes = (k: View['kind']): ((p: V3) => P2) => k === 'plan' ? p => [p[0], p[2]] : k === 'north' ? p => [p[0], -p[1]] : k === 'south' ? p => [-p[0], -p[1]] : k === 'east' ? p => [p[2], -p[1]] : p => [-p[2], -p[1]];
/** a view of the world window `win` fitted into the paper rectangle at the largest standard scale */
function fitView(kind: View['kind'], win: [V3, V3], paper: { x0: number; y0: number; x1: number; y1: number }, label: string, maxScale = 18): View {
  const ax = axes(kind), cs = corners(win).map(ax), u0 = Math.min(...cs.map(c => c[0])), u1 = Math.max(...cs.map(c => c[0])), v0 = Math.min(...cs.map(c => c[1])), v1 = Math.max(...cs.map(c => c[1]));
  const pw = paper.x1 - paper.x0 - 40, ph = paper.y1 - paper.y0 - 40;
  let pick = SCALES[SCALES.length - 1];
  for (const s of SCALES) if (s[1] <= maxScale && (u1 - u0) * s[1] <= pw && (v1 - v0) * s[1] <= ph) { pick = s; break; }
  const scale = pick[1], ox = (paper.x0 + paper.x1) / 2 - ((u0 + u1) / 2) * scale, oy = (paper.y0 + paper.y1) / 2 - ((v0 + v1) / 2) * scale;
  return { kind, scale, ox, oy, label, scaleName: pick[0], win };
}
const toPaper = (v: View, p: V3): P2 => { const [u, w] = axes(v.kind)(p); return [v.ox + u * v.scale, v.oy + w * v.scale]; };
const paperRect = (v: View) => { const cs = corners(v.win).map(p => toPaper(v, p)); return { x0: Math.min(...cs.map(c => c[0])), y0: Math.min(...cs.map(c => c[1])), x1: Math.max(...cs.map(c => c[0])), y1: Math.max(...cs.map(c => c[1])) }; };
const inWin = (b: [V3, V3], win: [V3, V3]) => b[1][0] >= win[0][0] && b[0][0] <= win[1][0] && b[1][1] >= win[0][1] && b[0][1] <= win[1][1] && b[1][2] >= win[0][2] && b[0][2] <= win[1][2];

// ---- the sheet set ------------------------------------------------------------------------------------------------
export interface Sheet { no: string; title: string; page: Page; scale?: string }
export function erectionDrawings(plant: PlantDef, font: Font): { doc: PdfDoc; sheets: Sheet[]; marks: Mark[]; welds: WeldRow[]; bolts: BoltRow[]; drawn: Map<Placed, Set<string>>; all: Placed[] } {
  const doc = new PdfDoc(font, `${plant.name} — structural steel erection drawings`);
  const B = plant.building(), I = plant.interior();
  const all = [...B.instances, ...I.instances].filter(p => !p.tags.includes('cladding') && !p.tags.includes('trim') && p.part.category !== 'non-steel' && p.part.category !== 'equipment' && p.part.kind !== 'DOOR_LEAF' && p.part.kind !== 'DOOR_CURTAIN' && p.part.kind !== 'DOOR_DRUM');
  const { marks, markOf } = markParts(all);
  const Lb = B.drawing.bays * B.drawing.bayFt * 12, Wb = B.drawing.widthFt * 12, He = B.drawing.eaveFt * 12, bay = B.drawing.bayFt * 12;
  const box = new Map<Placed, [V3, V3]>(); for (const p of all) { const b = worldBoxOf(p); if (b) box.set(p, b); }
  const sheets: Sheet[] = [];
  const text = (pg: Page, x: number, y: number, s: string, size = 7, o: { bold?: boolean; color?: RGB } = {}) => doc.text(pg, x, y, s, size, { color: INK, ...o });
  const line = (pg: Page, a: P2, b: P2, width = 0.5, color: RGB = INK, dash?: number[]) => doc.path(pg, [a, b], { stroke: color, width, dash });

  // ---- sheet frame and title block ----
  const newSheet = (title: string, scale?: string): Page => {
    const pg = doc.newPage(); const no = `S-${String(sheets.length + 1).padStart(2, '0')}`;
    doc.rect(pg, M - 6, M - 6, W - 2 * M + 12, H - 2 * M + 12, { stroke: INK, width: 1.2 });
    doc.rect(pg, M - 6, H - M - TB, W - 2 * M + 12, TB + 6, { stroke: INK, width: 0.8 });
    const y = H - M - TB + 6;
    for (const [i, [k, v]] of [['Plant', plant.name], ['Drawing', `Structural steel erection drawings — ${title}`], ['Sheet', no], ['Scale', scale ?? 'as noted'], ['Basis', 'SmartWeld DESIGN_BASIS.md §64 (SW-ERD-1..8); every size from the model; no outside material']].entries()) {
      const x = M + [0, 240, 700, 790, 900][i]; text(pg, x, y + 9, k.toUpperCase(), 5.5, { color: GREY }); text(pg, x, y + 22, v, i === 1 ? 9 : 8, { bold: i < 3 });
    }
    text(pg, M, y + 42, 'Dimensions in feet and inches to the member centreline or the steel line (SW-ERD-4). Marks: see the member schedule. Weld symbols: sheet S-02.', 6, { color: GREY });
    sheets.push({ no, title, page: pg, scale }); return pg;
  };
  const caption = (pg: Page, v: View, x?: number, y?: number) => { const r = paperRect(v); text(pg, x ?? r.x0, (y ?? r.y1) + 14, `${v.label}   scale ${v.scaleName}`, 8, { bold: true }); };

  // ---- drawing the model in a view ----
  const drawn = new Map<Placed, Set<string>>();
  const drawInstances = (pg: Page, v: View, ps: Placed[], o: { marks?: boolean; markEvery?: boolean; clip?: boolean; bolts?: boolean; weight?: number } = {}) => {
    const r = paperRect(v), done = new Set<string>(), labelled = new Map<string, number>(), sheetNo = sheets[sheets.length - 1].no;
    for (const p of ps) {
      const b = box.get(p); if (!b || !inWin(b, v.win)) continue;
      if (!o.clip) { let d = drawn.get(p); if (!d) drawn.set(p, (d = new Set())); d.add(sheetNo); }   // SW-ERD-8: the sheets each instance is drawn whole on
      const cs = worldCorners(p)!.map(c => toPaper(v, c));
      if (p.part.kind === 'BOLT' || p.part.kind === 'ANCHOR_ROD') { if (!o.bolts) continue; const c = toPaper(v, xf(p.transform, [0, 0, 0])), rad = Math.max(1, (p.part.dims.d?.value ?? 0.75) / 2 * v.scale); doc.circle(pg, c[0], c[1], rad, { stroke: INK, width: 0.4 }); continue; }
      if (p.part.kind === 'FILLET_WELD' || p.part.kind === 'FILLET_WELD_AROUND' || p.part.kind === 'GROOVE_WELD') continue;
      let poly = hull(cs); if (o.clip) poly = clipRect(poly, r); if (poly.length < 3) continue;
      const thin = p.part.kind === 'ROD' || p.part.kind === 'PL' || p.part.kind === 'GRATING';
      doc.path(pg, poly, { closed: true, stroke: p.part.kind === 'GRATING' ? LIGHT : INK, width: o.weight ?? (thin ? 0.35 : 0.6), dash: p.part.kind === 'GRATING' ? [2, 2] : undefined });
      if (o.marks) {
        const m = markOf.get(p); if (!m) continue;
        const n = labelled.get(m.mark) ?? 0; labelled.set(m.mark, n + 1);
        if (!o.markEvery && n > 0) continue;                                     // SW-ERD-4: a repeating mark is written once, with "typ."
        const cx = cs.reduce((s, c) => s + c[0], 0) / cs.length, cy = cs.reduce((s, c) => s + c[1], 0) / cs.length, key = `${m.mark}@${Math.round(cx)},${Math.round(cy)}`;
        if (done.has(key) || cx < r.x0 || cx > r.x1 || cy < r.y0 || cy > r.y1) continue; done.add(key);
        text(pg, cx + 2, cy - 2, m.mark, 6, { bold: true });
      }
    }
    let li = 0; for (const [mark, n] of labelled) if (!o.markEvery && n > 1) text(pg, Math.min(r.x1 + 8, W - M - 60), r.y0 + 6 + 8 * li++, `${mark} typ. ×${n}`, 6, { color: GREY });   // SW-ERD-4: repeated marks, listed beside the view
  };
  /** grid lines and the dimensions between them (SW-ERD-3) */
  const gridLines = (pg: Page, v: View, xs: { at: number; name: string }[], zs: { at: number; name: string }[]) => {
    const r = paperRect(v);
    const bubble = (x: number, y: number, name: string) => { doc.circle(pg, x, y, 7, { stroke: INK, width: 0.5, fill: hex('#ffffff') }); text(pg, x - doc.width(name, 7) / 2, y + 2.5, name, 7, { bold: true }); };
    if (v.kind === 'plan' || v.kind === 'north' || v.kind === 'south') for (const g of xs) { const p = toPaper(v, [g.at, 0, 0]); line(pg, [p[0], r.y0 - 16], [p[0], r.y1 + 6], 0.3, GREY, [6, 3]); bubble(p[0], r.y0 - 24, g.name); }
    if (v.kind === 'plan') for (const g of zs) { const p = toPaper(v, [0, 0, g.at]); line(pg, [r.x0 - 16, p[1]], [r.x1 + 6, p[1]], 0.3, GREY, [6, 3]); bubble(r.x0 - 24, p[1], g.name); }
    if (v.kind === 'east' || v.kind === 'west') for (const g of zs) { const p = toPaper(v, [0, 0, g.at]); line(pg, [p[0], r.y0 - 16], [p[0], r.y1 + 6], 0.3, GREY, [6, 3]); bubble(p[0], r.y0 - 24, g.name); }
    // dimensions between consecutive grid lines along the bottom
    const along = v.kind === 'plan' || v.kind === 'north' || v.kind === 'south' ? xs : zs, axis = v.kind === 'plan' || v.kind === 'north' || v.kind === 'south' ? 0 : 2;
    const sorted = [...along].sort((a, b) => a.at - b.at), yD = r.y1 + 22;
    for (let i = 0; i + 1 < sorted.length; i++) {
      const a = toPaper(v, axis === 0 ? [sorted[i].at, 0, 0] : [0, 0, sorted[i].at]), b = toPaper(v, axis === 0 ? [sorted[i + 1].at, 0, 0] : [0, 0, sorted[i + 1].at]);
      const [x0, x1] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
      line(pg, [x0, yD], [x1, yD], 0.4); line(pg, [x0 - 3, yD + 3], [x0 + 3, yD - 3], 0.4); line(pg, [x1 - 3, yD + 3], [x1 + 3, yD - 3], 0.4);
      const s = formatLength(sorted[i + 1].at - sorted[i].at); text(pg, (x0 + x1) / 2 - doc.width(s, 6) / 2, yD - 2, s, 6);
    }
    if (sorted.length > 1) { const a = toPaper(v, axis === 0 ? [sorted[0].at, 0, 0] : [0, 0, sorted[0].at]), b = toPaper(v, axis === 0 ? [sorted[sorted.length - 1].at, 0, 0] : [0, 0, sorted[sorted.length - 1].at]), [x0, x1] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])], yO = yD + 14; line(pg, [x0, yO], [x1, yO], 0.4); const s = formatLength(sorted[sorted.length - 1].at - sorted[0].at); text(pg, (x0 + x1) / 2 - doc.width(s, 6) / 2, yO - 2, s, 6); }
  };
  const frameGrid = () => { const xs: { at: number; name: string }[] = []; for (let i = 0; i <= B.drawing.bays; i++) xs.push({ at: i * bay, name: String(i + 1) }); return xs; };
  const widthGrid = () => [{ at: -Wb / 2, name: 'A' }, { at: -plant.rack.halfWidth, name: 'B' }, { at: 0, name: 'C' }, { at: plant.rack.halfWidth, name: 'D' }, { at: Wb / 2, name: 'E' }];
  const elevMark = (pg: Page, v: View, y: number, label: string) => { const r = paperRect(v), p = toPaper(v, [0, y, 0]); line(pg, [r.x0 - 4, p[1]], [r.x1, p[1]], 0.3, GREY, [2, 2]); text(pg, r.x1 + 4, p[1] + 2, `${label} EL ${formatLength(1200 + y)}`, 6, { color: GREY }); };

  // ---- weld symbols (SW-ERD-6) ----
  const weldSymbol = (pg: Page, at: P2, from: P2, w: { kind: 'fillet' | 'groove'; size: string; length?: string; around?: boolean; field?: boolean; note?: string }) => {
    line(pg, at, from, 0.5, WELD);                                                                        // arrow
    const dir = Math.sign(from[0] - at[0]) || 1, ah = 3; doc.path(pg, [[at[0] + dir * ah, at[1] - ah / 2], at, [at[0] + dir * ah, at[1] + ah / 2]], { stroke: WELD, width: 0.5 });
    const ref: P2 = [from[0] + dir * 28, from[1]]; line(pg, from, ref, 0.6, WELD);                        // reference line
    const sx = from[0] + dir * 10, sy = from[1];
    if (w.kind === 'fillet') doc.path(pg, [[sx, sy], [sx, sy - 6], [sx + 6, sy]], { closed: true, fill: WELD });                          // a filled right triangle
    else doc.path(pg, [[sx, sy], [sx + 3, sy - 6], [sx + 6, sy]], { stroke: WELD, width: 0.6 });                                            // an open V
    if (w.around) doc.circle(pg, from[0], from[1], 2.5, { stroke: WELD, width: 0.6 });
    if (w.field) doc.path(pg, [[from[0], from[1]], [from[0], from[1] - 9], [from[0] + 6, from[1] - 7]], { closed: true, fill: WELD });
    text(pg, sx - doc.width(w.size, 6) - 2, sy - 1, w.size, 6, { color: WELD }); if (w.length) text(pg, sx + 8, sy - 1, w.length, 6, { color: WELD });
    if (w.note) text(pg, ref[0] + (dir > 0 ? 2 : -doc.width(w.note, 6) - 2), ref[1] + 2, w.note, 6, { color: WELD });
  };

  // ==== S-01 cover ====
  { const pg = newSheet('cover and sheet index'); text(pg, 80, 110, plant.name, 22, { bold: true }); text(pg, 80, 140, 'Structural steel erection drawings with weld details', 14); text(pg, 80, 160, 'Drawn from the structural model by SmartWeld rule (DESIGN_BASIS.md §64). The sheet index is completed on this page once the set is drawn.', 8, { color: GREY }); (pg as Page & { _index?: true })._index = true; }
  // ==== S-02 notes and legend ====
  { const pg = newSheet('general notes and symbol legend');
    const notes = ['1. All steel by SmartWeld DESIGN_BASIS.md: W, C, L, HSS, Z and CS sections proportioned by rule (§4–7), plates and bolts by §8–9, welds by §10.', '2. Material: Grade 36 (members, plates), Grade 50 cold-formed (purlins, girts), Grade 90 bolts and anchor rods, as stated on the drawing (SW-MAT-1).',
      '3. Marks (SW-ERD-2): C columns, R rafters, P wind posts, B beams, S struts, G girts, Z purlins, X bracing rods, K stair stringers, L ladders, H guardrail and handrail, E end plates, BP base plates, CL clips and tabs, AR anchor rods, D door framing, CG cages, GR grating, T treads; BT bolts (bolt schedule).', '4. Elevations are above the floor datum EL 100\'-0" (SW-GT-2). Plans show east to the right and north up.',
      '5. Fillet welds are sized by SW-WD-1 from the thinner part; groove welds are complete-penetration single-V (SW-WD-4). Weld sizes on the details are from the weld parts of the model, not typical values.', '6. Shop welds unless flagged; field welds carry the flag. Bolted connections are made on site.', '7. Every member instance of the model appears once on a framing plan or elevation; repeated marks are written once with "typ." and their count (SW-ERD-4).'];
    let y = 70; for (const n of notes) { text(pg, 60, y, n, 8); y += 16; }
    text(pg, 60, y + 20, 'Weld symbol legend (SmartWeld\'s own, SW-ERD-6)', 10, { bold: true }); y += 40;
    weldSymbol(pg, [100, y + 30], [140, y + 10], { kind: 'fillet', size: '3/8', length: '12', note: 'fillet weld, leg 3/8 in, 12 in long (no length: the full joint)' }); y += 50;
    weldSymbol(pg, [100, y + 30], [140, y + 10], { kind: 'fillet', size: '3/16', around: true, note: 'fillet all around the profile (the circle at the bend)' }); y += 50;
    weldSymbol(pg, [100, y + 30], [140, y + 10], { kind: 'groove', size: 't = 1/2', note: 'complete-penetration single-V groove weld, plate thickness t' }); y += 50;
    weldSymbol(pg, [100, y + 30], [140, y + 10], { kind: 'fillet', size: '1/4', field: true, note: 'field weld (the flag)' }); y += 50;
    text(pg, 60, y + 10, '"typ." with a count: one symbol stands for every joint of that kind on the sheet.', 7, { color: GREY });
  }
  // ==== S-03 anchor-bolt plan ====
  { const win: [V3, V3] = [[-24, -1, -Wb / 2 - 24], [Lb + 24, 40, Wb / 2 + 24]];
    const pg = newSheet('anchor-bolt plan'); const v = fitView('plan', win, AREA, 'ANCHOR-BOLT PLAN (base plates and anchor rods at EL 100\'-0")');
    const ps = all.filter(p => p.tags.includes('base-plate') || p.tags.includes('anchor-rod') || p.tags.includes('pedestal'));
    drawInstances(pg, v, ps, { marks: true, bolts: true }); gridLines(pg, v, frameGrid(), widthGrid()); caption(pg, v);
    const bps = marks.filter(m => m.letter === 'BP' || m.letter === 'AR'); let y = AREA.y0 + 30; text(pg, AREA.x1 - 300, y, 'Base plates and anchor rods', 8, { bold: true }); y += 12;
    for (const m of bps) { text(pg, AREA.x1 - 300, y, `${m.mark}  ${m.designation}  ×${m.count}  (${m.rule})`, 6.5); y += 9; }
    sheets[sheets.length - 1].scale = v.scaleName; }
  // ==== S-04 column schedule and base detail ====
  { const pg = newSheet('column schedule and base details');
    const cols = marks.filter(m => m.letter === 'C' || m.letter === 'P');
    let y = 70; text(pg, 60, y, 'COLUMN SCHEDULE', 10, { bold: true }); y += 16;
    const head = ['Mark', 'Section', 'Length', 'Count', 'Unit weight (lb)', 'Base plate', 'Anchor rods', 'Rule'], ws = [50, 110, 80, 50, 90, 140, 140, 140];
    const row = (cells: string[], bold = false) => { let x = 60; cells.forEach((c, i) => { doc.rect(pg, x, y, ws[i], 12, { stroke: RULE, width: 0.4, fill: bold ? HEAD : undefined }); text(pg, x + 3, y + 9, c, 7, { bold }); x += ws[i]; }); y += 12; };
    row(head, true);
    for (const m of cols) { const inst = all.find(p => markOf.get(p) === m)!, grp = inst.tags[0], bp = all.find(p => p.tags[0] === grp && p.tags.includes('base-plate')), ar = all.filter(p => p.tags[0] === grp && p.tags.includes('anchor-rod'));
      row([m.mark, m.designation, formatLength(m.length), String(m.count), m.unitWeight.toFixed(0), bp ? `${markOf.get(bp)?.mark ?? ''} ${bp.part.designation}` : '—', ar.length ? `${ar.length / Math.max(1, all.filter(p => p.tags[0] === grp && p.tags.includes('column')).length)} × ${ar[0].part.designation}` : '—', m.rule]); }
    // base detail: the first frame column's base, plan and elevation at 1" = 1'
    const col = all.find(p => p.tags[0] === 'frame:0' && p.tags.includes('column') && xf(p.transform, [0, 0, 0])[2] > 0);
    if (col) { const o = xf(col.transform, [0, 0, 0]), half = 30, winP: [V3, V3] = [[o[0] - half, -6, o[2] - half], [o[0] + half, 60, o[2] + half]];
      const vP = fitView('plan', winP, { x0: 60, y0: y + 40, x1: 420, y1: y + 360 }, 'COLUMN BASE — PLAN (frame column at grid 1/E)', 6), vE = fitView('north', winP, { x0: 440, y0: y + 40, x1: 800, y1: y + 360 }, 'COLUMN BASE — ELEVATION', 6);
      const ps = all.filter(p => (p.tags[0] === 'frame:0' || p.tags[0] === 'endwall') && (box.get(p) ? inWin(box.get(p)!, winP) : false));
      drawInstances(pg, vP, ps, { clip: true, bolts: true, marks: true, markEvery: false }); drawInstances(pg, vE, ps, { clip: true, bolts: true });
      const wd = ps.find(p => p.part.kind === 'FILLET_WELD_AROUND'); const cP = toPaper(vP, [o[0] + 6, 0, o[2]]), cE = toPaper(vE, [o[0] + 6, 2, o[2]]);
      if (wd) { weldSymbol(pg, cP, [cP[0] + 40, cP[1] - 30], { kind: 'fillet', size: fmtIn(wd.part.dims.leg.value), around: true, note: `${wd.part.designation} (SW-PF-7)` }); weldSymbol(pg, cE, [cE[0] + 40, cE[1] - 30], { kind: 'fillet', size: fmtIn(wd.part.dims.leg.value), around: true }); }
      caption(pg, vP); caption(pg, vE); elevMark(pg, vE, 0, 'floor'); }
  }
  // ==== S-05 roof framing plan ====
  { const win: [V3, V3] = [[-24, He - 60, -Wb / 2 - 24], [Lb + 24, He + 200, Wb / 2 + 24]];
    const pg = newSheet('roof framing plan'); const v = fitView('plan', win, AREA, 'ROOF FRAMING PLAN (rafters, purlins, eave struts, roof bracing)');
    drawInstances(pg, v, all.filter(p => p.tags.includes('rafter') || p.tags.includes('purlin') || p.tags.includes('eave-strut') || (p.tags.includes('bracing') && (box.get(p)?.[0][1] ?? 0) > He - 60)), { marks: true });
    gridLines(pg, v, frameGrid(), widthGrid()); caption(pg, v); sheets[sheets.length - 1].scale = v.scaleName; }
  // ==== S-06 sidewall framing elevations ====
  for (const [side, kind, name] of [[1, 'south', 'SOUTH SIDEWALL (grid E), looking north'], [-1, 'north', 'NORTH SIDEWALL (grid A), looking south']] as const) {
    const pg = newSheet(`${name.toLowerCase().split(' (')[0]} framing elevation`); const zc = side * Wb / 2, win: [V3, V3] = [[-24, -6, zc - 30], [Lb + 24, He + 80, zc + 30]];
    const v = fitView(kind, win, AREA, `${name} — columns, girts, eave strut, bracing, door framing`);
    const ps = all.filter(p => { const b = box.get(p); return !!b && inWin(b, win) && (p.tags.includes('column') || p.tags.includes('girt') || p.tags.includes('eave-strut') || p.tags.includes('bracing') || p.tags[0] === 'door' || p.tags.includes('rafter')); });
    drawInstances(pg, v, ps, { marks: true }); gridLines(pg, v, frameGrid(), []); caption(pg, v); elevMark(pg, v, 0, 'floor'); elevMark(pg, v, He, 'eave'); sheets[sheets.length - 1].scale = v.scaleName; }
  // ==== S-07 endwall framing elevations ====
  for (const [xw, kind, name] of [[0, 'west', 'WEST END WALL (grid 1), looking east'], [Lb, 'east', `EAST END WALL (grid ${B.drawing.bays + 1}), looking west`]] as const) {
    const pg = newSheet(`${name.toLowerCase().split(' (')[0]} framing elevation`); const win: [V3, V3] = [[xw - 30, -6, -Wb / 2 - 24], [xw + 30, He + 140, Wb / 2 + 24]];
    const v = fitView(kind, win, AREA, `${name} — frame, wind posts, girts, door framing`);
    const ps = all.filter(p => { const b = box.get(p); return !!b && inWin(b, win) && (p.tags.includes('column') || p.tags.includes('rafter') || p.tags.includes('post') || p.tags.includes('girt') || p.tags[0] === 'door' || p.tags.includes('end-plate')); });
    drawInstances(pg, v, ps, { marks: true }); gridLines(pg, v, [], widthGrid()); caption(pg, v); elevMark(pg, v, 0, 'floor'); elevMark(pg, v, He, 'eave'); sheets[sheets.length - 1].scale = v.scaleName; }
  // ==== S-08 typical frame elevation with knee and ridge details ====
  { const pg = newSheet('typical frame elevation, knee and ridge details'); const xf1 = bay, win: [V3, V3] = [[xf1 - 40, -6, -Wb / 2 - 24], [xf1 + 40, He + 140, Wb / 2 + 24]];
    const v = fitView('east', win, { x0: AREA.x0, y0: AREA.y0, x1: AREA.x1 - 420, y1: AREA.y1 }, 'TYPICAL FRAME (grid 2), looking west');
    const frameParts = all.filter(p => p.tags[0] === 'frame:1');
    drawInstances(pg, v, frameParts, { marks: true, bolts: true }); gridLines(pg, v, [], widthGrid()); caption(pg, v); elevMark(pg, v, 0, 'floor'); elevMark(pg, v, He, 'eave');
    const raf = frameParts.find(p => p.tags.includes('rafter')), col = frameParts.find(p => p.tags.includes('column') && xf(p.transform, [0, 0, 0])[2] > 0);
    if (raf && col) {
      const kz = xf(col.transform, [0, 0, 0])[2], kneeWin: [V3, V3] = [[xf1 - 30, He - 50, kz - 60], [xf1 + 30, He + 40, kz + 20]];
      const vK = fitView('east', kneeWin, { x0: AREA.x1 - 400, y0: AREA.y0, x1: AREA.x1, y1: AREA.y0 + 320 }, 'KNEE DETAIL (grid 2/E)', 6);
      drawInstances(pg, vK, frameParts, { clip: true, bolts: true, marks: true });
      const pw = frameParts.find(p => p.part.kind === 'FILLET_WELD_AROUND' && (box.get(p)?.[0][1] ?? 0) > He - 60);
      const c = toPaper(vK, [xf1, He - 20, kz - 14]); if (pw) weldSymbol(pg, c, [c[0] - 50, c[1] - 30], { kind: 'fillet', size: fmtIn(pw.part.dims.leg.value), around: true, note: 'rafter end to end plate (SW-PF-5)' });
      caption(pg, vK);
      const ridgeWin: [V3, V3] = [[xf1 - 30, He - 10, -40], [xf1 + 30, He + 140, 40]];
      const vR = fitView('east', ridgeWin, { x0: AREA.x1 - 400, y0: AREA.y0 + 350, x1: AREA.x1, y1: AREA.y1 }, 'RIDGE DETAIL (grid 2/C)', 6);
      drawInstances(pg, vR, frameParts, { clip: true, bolts: true, marks: true }); caption(pg, vR);
      const bolt = frameParts.find(p => p.part.kind === 'BOLT'); if (bolt) text(pg, AREA.x1 - 395, AREA.y1 - 6, `Knee and ridge bolts ${bolt.part.designation}, two rows each side of each flange (SW-PF-5)`, 6, { color: GREY });
    }
    sheets[sheets.length - 1].scale = v.scaleName; }
  // ==== S-09 rack framing plans per tier ====
  const rk = plant.rack;
  for (const [ti, tier] of rk.tiers.entries()) {
    const win: [V3, V3] = [[rk.x0 - 60, ti === 0 ? -6 : tier - 30, -rk.halfWidth - 36], [rk.x1 + 60, tier + 6, rk.halfWidth + 36]];
    const pg = newSheet(`pipe rack framing plan, tier ${ti + 1}`); const v = fitView('plan', win, AREA, `PIPE RACK FRAMING PLAN — TIER ${ti + 1} at EL ${formatLength(1200 + tier)} (beams, struts, intermediate beams, tier bracing)`);
    const ps = all.filter(p => (p.tags[0].startsWith('rack-bent') || p.tags[0].startsWith('rack-bay')) && (ti === 0 || !p.tags.includes('column')) && !p.tags.includes('base-plate') && !p.tags.includes('anchor-rod') && !p.tags.includes('pedestal') && (box.get(p) ? inWin(box.get(p)!, win) : false));   // the columns appear whole on the first tier's plan
    const xs: { at: number; name: string }[] = []; for (let x = rk.x0, i = 0; x <= rk.x1 + 1e-6; x += rk.bentSpacing, i++) xs.push({ at: x, name: `R${i + 1}` });
    drawInstances(pg, v, ps, { marks: true }); gridLines(pg, v, xs, [{ at: -rk.halfWidth, name: 'B' }, { at: rk.halfWidth, name: 'D' }]); caption(pg, v); sheets[sheets.length - 1].scale = v.scaleName; }
  // ==== S-10 rack bent elevation and details ====
  { const pg = newSheet('pipe rack bent elevation, strut, tab and bracing details'); const xb = rk.x0 + rk.bentSpacing, win: [V3, V3] = [[xb - 40, -6, -rk.halfWidth - 40], [xb + 40, rk.tiers[rk.tiers.length - 1] + 60, rk.halfWidth + 40]];
    const v = fitView('east', win, { x0: AREA.x0, y0: AREA.y0, x1: AREA.x1 - 440, y1: AREA.y1 }, 'TYPICAL RACK BENT (grid R2), looking west');
    const bent = all.filter(p => p.tags[0] === `rack-bent:${xb}`);
    drawInstances(pg, v, bent, { marks: true, bolts: true }); gridLines(pg, v, [], [{ at: -rk.halfWidth, name: 'B' }, { at: rk.halfWidth, name: 'D' }]); caption(pg, v); elevMark(pg, v, 0, 'floor'); for (const [i, t] of rk.tiers.entries()) elevMark(pg, v, t, `tier ${i + 1}`);
    // beam end plate detail (plan at the top tier), strut tab (elevation), bracing rod end
    const topT = rk.tiers[rk.tiers.length - 1], zc = rk.halfWidth - 6, w1: [V3, V3] = [[xb - 24, topT - 40, zc - 40], [xb + 24, topT + 10, zc + 24]];
    const v1 = fitView('east', w1, { x0: AREA.x1 - 420, y0: AREA.y0, x1: AREA.x1 - 220, y1: AREA.y0 + 220 }, 'BEAM END PLATE (R2/D, tier top)', 6);
    drawInstances(pg, v1, bent, { clip: true, bolts: true, marks: true }); const kw = bent.find(p => p.part.kind === 'FILLET_WELD_AROUND' && (box.get(p)?.[0][1] ?? 0) > topT - 60); const c1 = toPaper(v1, [xb, topT - 20, zc - 10]);
    if (kw) weldSymbol(pg, c1, [c1[0] - 46, c1[1] - 26, ], { kind: 'fillet', size: fmtIn(kw.part.dims.leg.value), around: true, note: 'beam to end plate' }); caption(pg, v1);
    const bay0 = all.filter(p => p.tags[0] === 'rack-bay:0'), strut = bay0.find(p => p.tags.includes('strut')), tab = bay0.find(p => p.tags.includes('clip'));
    if (strut && tab) { const o = xf(tab.transform, [0, 0, 0]), w2: [V3, V3] = [[o[0] - 14, o[1] - 10, o[2] - 16], [o[0] + 30, o[1] + 16, o[2] + 16]];
      const v2 = fitView('south', w2, { x0: AREA.x1 - 200, y0: AREA.y0, x1: AREA.x1, y1: AREA.y0 + 220 }, 'STRUT TAB (R1, tier 1)', 9);
      drawInstances(pg, v2, [...bay0, ...all.filter(p => p.tags[0] === `rack-bent:${rk.x0}`)], { clip: true, bolts: true, marks: true });
      const tw = bay0.find(p => p.part.kind === 'FILLET_WELD'); const c2 = toPaper(v2, [o[0] - 1, o[1] + 2, o[2]]); if (tw) weldSymbol(pg, c2, [c2[0] + 40, c2[1] - 30], { kind: 'fillet', size: fmtIn(tw.part.dims.leg.value), length: fmtIn(tw.part.length!.value), note: 'tab to column flange (SW-RK-3)' }); caption(pg, v2); }
    const rod = bay0.find(p => p.tags.includes('bracing')); if (rod) { const o = xf(rod.transform, [0, 0, 0]), w3: [V3, V3] = [[o[0] - 20, o[1] - 20, o[2] - 20], [o[0] + 40, o[1] + 40, o[2] + 20]];
      const v3 = fitView('south', w3, { x0: AREA.x1 - 420, y0: AREA.y0 + 240, x1: AREA.x1 - 220, y1: AREA.y0 + 460 }, 'BRACING ROD END (R1, column line)', 6); drawInstances(pg, v3, [...bay0, ...all.filter(p => p.tags[0] === `rack-bent:${rk.x0}`)], { clip: true, bolts: true, marks: true }); caption(pg, v3); text(pg, AREA.x1 - 420, AREA.y0 + 480, `${rod.part.designation} rods, clevis and pin not modeled (SW-RK-3); welded gusset to the column flange, fillet by SW-WD-1`, 6, { color: GREY }); }
    sheets[sheets.length - 1].scale = v.scaleName; }
  // ==== S-11.. platform framing plans, stair and ladder elevations ====
  const platGroups = [...new Set(all.filter(p => /^(platform|stair|bin-walkway|bin-stair|rack-ladder|C-\d+-ladder|T-\d+|S-\d+)/.test(p.tags[0]) && (p.tags.includes('grating') || p.tags.includes('stringer') || p.tags.includes('ladder'))).map(p => p.tags[0].replace(/-(mid|top|landing)$/, '')))].sort();
  for (const grp of platGroups) {
    const ps = all.filter(p => p.tags[0] === grp || p.tags[0].startsWith(grp + '-')); const bs = ps.map(p => box.get(p)).filter(Boolean) as [V3, V3][]; if (!bs.length) continue;
    const win: [V3, V3] = [[Math.min(...bs.map(b => b[0][0])) - 24, Math.min(...bs.map(b => b[0][1])) - 12, Math.min(...bs.map(b => b[0][2])) - 24], [Math.max(...bs.map(b => b[1][0])) + 24, Math.max(...bs.map(b => b[1][1])) + 12, Math.max(...bs.map(b => b[1][2])) + 24]];
    const isStair = /stair/.test(grp), isLadder = /ladder|^T-|^S-/.test(grp);
    const pg = newSheet(`${grp} — ${isLadder ? 'ladder elevation' : isStair ? 'stair elevation and landings' : 'platform framing plan'}`);
    if (isLadder || isStair) { const v = fitView(isStair ? 'south' : 'east', win, { x0: AREA.x0, y0: AREA.y0, x1: AREA.x0 + 560, y1: AREA.y1 }, `${grp.toUpperCase()} — ELEVATION`); drawInstances(pg, v, ps, { marks: true, bolts: true }); caption(pg, v); elevMark(pg, v, win[0][1] + 12, 'base');
      const vp = fitView('plan', win, { x0: AREA.x0 + 600, y0: AREA.y0, x1: AREA.x1, y1: AREA.y1 }, `${grp.toUpperCase()} — PLAN`); drawInstances(pg, vp, ps, { marks: true }); caption(pg, vp); sheets[sheets.length - 1].scale = v.scaleName; }
    else { const v = fitView('plan', win, { x0: AREA.x0, y0: AREA.y0, x1: AREA.x1 - 320, y1: AREA.y1 }, `${grp.toUpperCase()} — FRAMING PLAN (beams, clips, columns; grating dashed) at EL ${formatLength(1200 + win[1][1] - 12)}`); drawInstances(pg, v, ps, { marks: true }); caption(pg, v);
      const ve = fitView('south', win, { x0: AREA.x1 - 300, y0: AREA.y0, x1: AREA.x1, y1: AREA.y0 + 300 }, `${grp.toUpperCase()} — ELEVATION`); drawInstances(pg, ve, ps, { marks: false, clip: true }); caption(pg, ve); sheets[sheets.length - 1].scale = v.scaleName;
      const post = ps.find(p => p.tags.includes('guardrail') && p.part.kind === 'PL'), clip = ps.find(p => p.tags.includes('clip'));
      if (post) { const o = xf(post.transform, [2.5, 0, -2.5]), w4: [V3, V3] = [[o[0] - 8, o[1] - 6, o[2] - 8], [o[0] + 8, o[1] + 14, o[2] + 8]]; const v4 = fitView('south', w4, { x0: AREA.x1 - 300, y0: AREA.y0 + 330, x1: AREA.x1 - 150, y1: AREA.y1 }, 'GUARDRAIL POST', 12); drawInstances(pg, v4, ps, { clip: true, bolts: true }); const rw = ps.find(p => p.tags.includes('weld') && p.part.kind === 'FILLET_WELD'); const c4 = toPaper(v4, [o[0] + 1, o[1] + 1, o[2]]); if (rw) weldSymbol(pg, c4, [c4[0] + 30, c4[1] - 24], { kind: 'fillet', size: fmtIn(rw.part.dims.leg.value), around: true, note: 'post to plate (SW-HR-3)' }); caption(pg, v4); }
      if (clip) { const o = xf(clip.transform, [0, 0, 0]), w5: [V3, V3] = [[o[0] - 10, o[1] - 14, o[2] - 10], [o[0] + 10, o[1] + 10, o[2] + 10]]; const v5 = fitView('plan', w5, { x0: AREA.x1 - 140, y0: AREA.y0 + 330, x1: AREA.x1, y1: AREA.y1 }, 'SHELL CLIP (SW-EQ-6)', 12); drawInstances(pg, v5, ps, { clip: true }); caption(pg, v5); const c5 = toPaper(v5, [o[0], o[1], o[2]]); weldSymbol(pg, c5, [c5[0] + 24, c5[1] - 20], { kind: 'fillet', size: fmtIn(0.375), note: 'clip to shell, both sides' }); }
    }
  }
  // ==== member schedule ====
  const scheduleSheets = (title: string, head: string[], ws: number[], rows: string[][]) => {
    let pg = newSheet(title), y = AREA.y0 + 30;
    const row = (cells: string[], bold = false) => { let x = AREA.x0 + 10; cells.forEach((c, i) => { doc.rect(pg, x, y, ws[i], 11, { stroke: RULE, width: 0.4, fill: bold ? HEAD : undefined }); text(pg, x + 3, y + 8.5, c.length > 70 ? c.slice(0, 69) + '…' : c, 6.5, { bold }); x += ws[i]; }); y += 11; };
    text(pg, AREA.x0 + 10, y - 8, title.toUpperCase(), 10, { bold: true }); row(head, true);
    for (const r of rows) { if (y > AREA.y1 - 14) { pg = newSheet(`${title} (continued)`); y = AREA.y0 + 30; row(head, true); } row(r); }
  };
  scheduleSheets('member schedule', ['Mark', 'Designation', 'Kind', 'Length', 'Count', 'Unit weight (lb)', 'Total weight (lb)', 'Where', 'Sized by rule'], [50, 170, 70, 80, 50, 90, 90, 190, 300],
    marks.filter(m => m.letter !== 'BT' && m.letter !== 'AR').map(m => [m.mark, m.designation, m.kind, m.length ? formatLength(m.length) : '—', String(m.count), m.unitWeight.toFixed(1), (m.unitWeight * m.count).toFixed(0), m.group.replace(/:\d+$/, ' (every)'), m.rule]));
  // ==== weld schedule ====
  const weldRows: WeldRow[] = []; { const by = new Map<string, WeldRow>();
    for (const p of all) { if (!['FILLET_WELD', 'FILLET_WELD_AROUND', 'GROOVE_WELD'].includes(p.part.kind)) continue;
      const joint = jointName(p), key = `${p.part.designation}|${(p.part.length?.value ?? 0).toFixed(2)}|${joint}`, e = by.get(key) ?? { mark: '', joint, type: p.part.kind === 'GROOVE_WELD' ? 'groove, complete penetration' : p.part.kind === 'FILLET_WELD_AROUND' ? 'fillet all around' : 'fillet', size: fmtIn(p.part.dims.leg?.value ?? p.part.dims.t?.value ?? 0), length: p.part.length?.value ?? 0, count: 0, unitWeight: p.part.weight.value, shopField: 'shop', detail: '', designation: p.part.designation };
      e.count++; by.set(key, e); }
    let n = 0; for (const e of [...by.values()].sort((a, b) => a.joint.localeCompare(b.joint) || a.designation.localeCompare(b.designation))) { e.mark = `W${++n}`; weldRows.push(e); } }
  scheduleSheets('weld schedule', ['Mark', 'Joint', 'Type', 'Size', 'Length', 'Count', 'Unit weight (lb)', 'Total (lb)', 'Shop/field', 'Designation'], [40, 230, 130, 60, 70, 50, 80, 70, 60, 150],
    weldRows.map(w => [w.mark, w.joint, w.type, w.size, formatLength(w.length), String(w.count), w.unitWeight.toFixed(2), (w.unitWeight * w.count).toFixed(1), w.shopField, w.designation]));
  // ==== bolt schedule ====
  const boltRows: BoltRow[] = []; { const by = new Map<string, BoltRow>();
    for (const p of all) { if (p.part.kind !== 'BOLT' && p.part.kind !== 'ANCHOR_ROD') continue; const key = `${p.part.kind}|${p.part.designation}|${p.tags[0].replace(/:\d+$/, '')}`, e = by.get(key) ?? { mark: '', designation: p.part.designation, kind: p.part.kind === 'BOLT' ? 'bolt' : 'anchor rod', d: p.part.dims.d?.value ?? 0, L: p.part.dims.L?.value ?? p.part.length?.value ?? 0, grip: p.part.dims.grip?.value, grade: p.part.material.grade, count: 0, where: p.tags[0].replace(/:\d+$/, '') }; e.count++; by.set(key, e); }
    let n = 0; for (const e of [...by.values()].sort((a, b) => a.kind.localeCompare(b.kind) || a.designation.localeCompare(b.designation))) { e.mark = `${e.kind === 'bolt' ? 'BT' : 'AR'}${++n}`; boltRows.push(e); } }
  scheduleSheets('bolt and anchor rod schedule', ['Mark', 'Designation', 'Kind', 'Diameter', 'Length', 'Grip', 'Grade', 'Count', 'Where'], [40, 150, 70, 70, 70, 70, 120, 60, 200],
    boltRows.map(b => [b.mark, b.designation, b.kind, fmtIn(b.d), fmtIn(b.L), b.grip !== undefined ? fmtIn(b.grip) : '—', b.grade, String(b.count), b.where]));
  // ==== the index on the cover ====
  { const cover = sheets[0].page; let y = 200; text(cover, 80, y, 'SHEET INDEX', 10, { bold: true }); y += 14;
    for (const s of sheets) { text(cover, 80, y, s.no, 8, { bold: true }); text(cover, 130, y, s.title, 8); if (s.scale) text(cover, 700, y, s.scale, 7, { color: GREY }); y += 12; if (y > H - M - TB - 20) { y = 200; } }
    text(cover, 80, y + 20, `${marks.filter(m => m.letter !== 'BT' && m.letter !== 'AR').length} member marks, ${weldRows.length} weld marks, ${boltRows.length} bolt marks; steel ${(all.filter(p => STEEL.has(p.part.kind)).reduce((s, p) => s + p.part.weight.value, 0) / 2000).toFixed(1)} tons.`, 8, { color: GREY }); }
  return { doc, sheets, marks, welds: weldRows, bolts: boltRows, drawn, all };
}
export interface WeldRow { mark: string; joint: string; type: string; size: string; length: number; count: number; unitWeight: number; shopField: string; detail: string; designation: string }
export interface BoltRow { mark: string; designation: string; kind: string; d: number; L: number; grip?: number; grade: string; count: number; where: string }
const fmtIn = (v: number) => { const s = Math.round(v * 16), w = Math.floor(s / 16), f = s % 16; const fr = f ? (f % 8 === 0 ? `${f / 8}/2` : f % 4 === 0 ? `${f / 4}/4` : f % 2 === 0 ? `${f / 2}/8` : `${f}/16`) : ''; return `${w ? w : ''}${w && fr ? '-' : ''}${fr || (w ? '' : '0')} in`; };
/** the joint a weld part belongs to, from its tags and designation (SW-ERD-7) */
function jointName(p: Placed): string {
  const g = p.tags[0].replace(/:\d+$/, ''), d = p.part.designation;
  if (/^frame/.test(g)) return d.includes('all around') ? (p.part.id.startsWith('BW') ? 'frame column to base plate (SW-PF-7)' : 'rafter and column ends to end plates (SW-PF-5)') : 'frame';
  if (/^endwall/.test(g)) return 'wind post to base plate';
  if (/^bay/.test(g)) return 'purlin and girt clips to rafters and columns (SW-CF-6)';
  if (/^rack-bent/.test(g)) return p.part.id.startsWith('BW') ? 'rack column to base plate (SW-RK-4)' : 'rack beam ends to end plates (SW-RK-2)';
  if (/^rack-bay/.test(g)) return 'strut tabs to column flanges (SW-RK-3)';
  if (/platform|landing|walkway/.test(g)) return d.includes('all around') ? 'platform column to base plate (SW-PLT-3)' : 'guardrail posts to post plates (SW-HR-3)';
  if (/stair/.test(g)) return 'stair handrail posts to stringers (SW-SR-4)';
  return g;
}
