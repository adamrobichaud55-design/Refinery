/**
 * TrueType reading and subsetting for SmartWeld's own PDF writer (DESIGN_BASIS.md §55, SW-PDF-2) and renderer (SW-REN-2).
 * Reads only what the PDF and the page previews need: units per em, ascent and descent, the character-to-glyph map,
 * advance widths and the glyph outlines. The subset keeps the font's tables and name and empties unused glyphs
 * (SW-LIC-3: the name contains neither "Bitstream" nor "Vera").
 */
export interface Font {
  bytes: Uint8Array; unitsPerEm: number; ascent: number; descent: number; capHeight: number; bbox: [number, number, number, number];
  numGlyphs: number; gid: Map<number, number>; advance: number[]; name: string;
  tables: Map<string, { off: number; len: number }>; locaLong: boolean;
}

const u16 = (b: Uint8Array, o: number) => (b[o] << 8) | b[o + 1];
const i16 = (b: Uint8Array, o: number) => { const v = u16(b, o); return v & 0x8000 ? v - 0x10000 : v; };
const u32 = (b: Uint8Array, o: number) => ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];

export function parseFont(bytes: Uint8Array): Font {
  const n = u16(bytes, 4), tables = new Map<string, { off: number; len: number }>();
  for (let i = 0; i < n; i++) { const r = 12 + 16 * i; tables.set(String.fromCharCode(...bytes.subarray(r, r + 4)), { off: u32(bytes, r + 8), len: u32(bytes, r + 12) }); }
  const t = (k: string) => { const x = tables.get(k); if (!x) throw new Error(`font: no ${k} table`); return x.off; };
  const head = t('head'), hhea = t('hhea'), maxp = t('maxp'), hmtx = t('hmtx');
  const unitsPerEm = u16(bytes, head + 18), locaLong = i16(bytes, head + 50) === 1;
  const bbox: [number, number, number, number] = [i16(bytes, head + 36), i16(bytes, head + 38), i16(bytes, head + 40), i16(bytes, head + 42)];
  const numGlyphs = u16(bytes, maxp + 4), nh = u16(bytes, hhea + 34);
  const advance: number[] = [];
  for (let g = 0; g < numGlyphs; g++) advance.push(u16(bytes, hmtx + 4 * Math.min(g, nh - 1)));
  const os2 = tables.get('OS/2');
  const capHeight = os2 && u16(bytes, os2.off) >= 2 ? i16(bytes, os2.off + 88) : Math.round(0.7 * unitsPerEm);
  // character map: format 4 (basic plane) and format 12 (all planes)
  const gid = new Map<number, number>(), cmap = t('cmap');
  const subs = Array.from({ length: u16(bytes, cmap + 2) }, (_, i) => ({ pid: u16(bytes, cmap + 4 + 8 * i), eid: u16(bytes, cmap + 6 + 8 * i), off: cmap + u32(bytes, cmap + 8 + 8 * i) }));
  for (const s of subs.filter(s => s.pid === 3 || s.pid === 0)) {
    const f = u16(bytes, s.off);
    if (f === 4) {
      const segX2 = u16(bytes, s.off + 6), ends = s.off + 14, starts = ends + segX2 + 2, deltas = starts + segX2, ranges = deltas + segX2;
      for (let i = 0; i < segX2 / 2; i++) {
        const end = u16(bytes, ends + 2 * i), start = u16(bytes, starts + 2 * i), delta = i16(bytes, deltas + 2 * i), ro = u16(bytes, ranges + 2 * i);
        for (let c = start; c <= end && c !== 0xffff; c++) {
          let g = 0;
          if (ro === 0) g = (c + delta) & 0xffff;
          else { const gi = u16(bytes, ranges + 2 * i + ro + 2 * (c - start)); g = gi ? (gi + delta) & 0xffff : 0; }
          if (g && !gid.has(c)) gid.set(c, g);
        }
      }
    } else if (f === 12) {
      const ng = u32(bytes, s.off + 12);
      for (let i = 0; i < ng; i++) { const r = s.off + 16 + 12 * i, a = u32(bytes, r), b = u32(bytes, r + 4), g0 = u32(bytes, r + 8); for (let c = a; c <= b; c++) if (!gid.has(c)) gid.set(c, g0 + c - a); }
    }
  }
  return { bytes, unitsPerEm, ascent: i16(bytes, hhea + 4), descent: i16(bytes, hhea + 6), capHeight, bbox, numGlyphs, gid, advance, name: 'DejaVuSans', tables, locaLong };
}

function glyphRange(f: Font, g: number): [number, number] {
  const loca = f.tables.get('loca')!.off, glyf = f.tables.get('glyf')!.off;
  const a = f.locaLong ? u32(f.bytes, loca + 4 * g) : 2 * u16(f.bytes, loca + 2 * g);
  const b = f.locaLong ? u32(f.bytes, loca + 4 * g + 4) : 2 * u16(f.bytes, loca + 2 * g + 2);
  return [glyf + a, glyf + b];
}
/** the glyphs a composite glyph is built from */
function components(f: Font, g: number): number[] {
  const [a, b] = glyphRange(f, g); if (b - a < 10 || i16(f.bytes, a) >= 0) return [];
  const out: number[] = []; let p = a + 10, flags = 0;
  do {
    flags = u16(f.bytes, p); out.push(u16(f.bytes, p + 2)); p += 4 + (flags & 1 ? 4 : 2);
    if (flags & 8) p += 2; else if (flags & 0x40) p += 4; else if (flags & 0x80) p += 8;
  } while (flags & 0x20);
  return out;
}

const KEEP = ['head', 'hhea', 'maxp', 'hmtx', 'loca', 'glyf', 'cvt ', 'fpgm', 'prep', 'name', 'OS/2', 'post'];
const checksum = (b: Uint8Array) => { let s = 0; for (let i = 0; i < b.length; i += 4) s = (s + (((b[i] << 24) | ((b[i + 1] ?? 0) << 16) | ((b[i + 2] ?? 0) << 8) | (b[i + 3] ?? 0)) >>> 0)) >>> 0; return s; };

/** a symbol character map (platform 3, encoding 0, format 4): each one-byte code c maps from 0xF000 + c to its glyph */
function symbolCmap(codes: [number, number][]): Uint8Array {
  const segs = [...codes].sort((a, b) => a[0] - b[0]).map(([c, g]) => ({ s: 0xf000 + c, d: (g - (0xf000 + c)) & 0xffff }));
  segs.push({ s: 0xffff, d: 1 });
  const n = segs.length, len = 16 + 8 * n, sub = new DataView(new ArrayBuffer(len));
  let es = 0; while (1 << (es + 1) <= n) es++;
  sub.setUint16(0, 4); sub.setUint16(2, len); sub.setUint16(4, 0); sub.setUint16(6, 2 * n); sub.setUint16(8, 2 << es); sub.setUint16(10, es); sub.setUint16(12, 2 * n - (2 << es));
  segs.forEach((x, i) => { sub.setUint16(14 + 2 * i, x.s); sub.setUint16(16 + 2 * n + 2 * i, x.s); sub.setUint16(16 + 4 * n + 2 * i, x.d); sub.setUint16(16 + 6 * n + 2 * i, 0); });
  const out = new Uint8Array(12 + len), v = new DataView(out.buffer);
  v.setUint16(0, 0); v.setUint16(2, 1); v.setUint16(4, 3); v.setUint16(6, 0); v.setUint32(8, 12); out.set(new Uint8Array(sub.buffer), 12);
  return out;
}

/** the font with only the given glyphs (plus glyph 0 and composite parts) kept and a symbol character map for the
 *  one-byte codes the PDF uses; glyph numbers are unchanged, and the name table (with the copyright notice) is kept */
export function subsetFont(f: Font, codes: [number, number][]): Uint8Array {
  const used = new Set(codes.map(c => c[1]));
  const keep = new Set([0, ...used]); const stack = [...keep];
  while (stack.length) for (const c of components(f, stack.pop()!)) if (!keep.has(c)) { keep.add(c); stack.push(c); }
  const parts: Uint8Array[] = [], loca = new Uint8Array(4 * (f.numGlyphs + 1)), lv = new DataView(loca.buffer);
  let off = 0;
  for (let g = 0; g < f.numGlyphs; g++) {
    lv.setUint32(4 * g, off);
    if (keep.has(g)) { const [a, b] = glyphRange(f, g); const d = f.bytes.slice(a, b); const pad = (4 - (d.length % 4)) % 4; parts.push(d, new Uint8Array(pad)); off += d.length + pad; }
  }
  lv.setUint32(4 * f.numGlyphs, off);
  const glyf = new Uint8Array(off); let p = 0; for (const x of parts) { glyf.set(x, p); p += x.length; }
  const data = new Map<string, Uint8Array>();
  for (const k of KEEP) { const t = f.tables.get(k); if (t) data.set(k, f.bytes.slice(t.off, t.off + t.len)); }
  data.set('glyf', glyf); data.set('loca', loca); data.set('cmap', symbolCmap(codes));
  const post = data.get('post'); if (post) { const p3 = post.slice(0, 32); p3.set([0, 3, 0, 0], 0); data.set('post', p3); }   // no glyph names
  const head = data.get('head')!; head[50] = 0; head[51] = 1;          // long loca offsets
  head.set([0, 0, 0, 0], 8);                                            // checksum adjustment, set below
  const tags = [...data.keys()].sort(), nt = tags.length;
  let size = 12 + 16 * nt; const offs: number[] = [];
  for (const k of tags) { offs.push(size); size += (data.get(k)!.length + 3) & ~3; }
  const out = new Uint8Array(size), v = new DataView(out.buffer);
  let es = 0; while (1 << (es + 1) <= nt) es++;
  v.setUint32(0, 0x00010000); v.setUint16(4, nt); v.setUint16(6, 16 << es); v.setUint16(8, es); v.setUint16(10, nt * 16 - (16 << es));
  tags.forEach((k, i) => {
    const d = data.get(k)!, r = 12 + 16 * i;
    for (let j = 0; j < 4; j++) out[r + j] = k.charCodeAt(j);
    v.setUint32(r + 4, checksum(d)); v.setUint32(r + 8, offs[i]); v.setUint32(r + 12, d.length); out.set(d, offs[i]);
  });
  const headOff = offs[tags.indexOf('head')];
  v.setUint32(headOff + 8, (0xb1b0afba - checksum(out)) >>> 0);
  return out;
}

/** a glyph's outline as closed contours of points in font units (quadratic curves flattened), for the page previews */
export function glyphOutline(f: Font, g: number, depth = 0): [number, number][][] {
  const [a, b] = glyphRange(f, g); if (b - a < 10 || depth > 4) return [];
  const B = f.bytes, nc = i16(B, a);
  if (nc < 0) {   // composite: the parts, each moved by its offset (scales ignored: not used by the glyphs drawn here)
    const out: [number, number][][] = []; let p = a + 10, flags = 0;
    do {
      flags = u16(B, p); const c = u16(B, p + 2); let dx = 0, dy = 0;
      if (flags & 1) { dx = i16(B, p + 4); dy = i16(B, p + 6); p += 8; } else { dx = (B[p + 4] << 24) >> 24; dy = (B[p + 5] << 24) >> 24; p += 6; }
      if (flags & 8) p += 2; else if (flags & 0x40) p += 4; else if (flags & 0x80) p += 8;
      for (const ct of glyphOutline(f, c, depth + 1)) out.push(ct.map(([x, y]) => [x + dx, y + dy] as [number, number]));
    } while (flags & 0x20);
    return out;
  }
  const ends: number[] = []; for (let i = 0; i < nc; i++) ends.push(u16(B, a + 10 + 2 * i));
  const np = nc ? ends[nc - 1] + 1 : 0; let p = a + 10 + 2 * nc; p += 2 + u16(B, p);
  const fl: number[] = [];
  while (fl.length < np) { const x = B[p++]; fl.push(x); if (x & 8) { const r = B[p++]; for (let k = 0; k < r; k++) fl.push(x); } }
  const xs: number[] = [], ys: number[] = []; let x = 0, y = 0;
  for (let i = 0; i < np; i++) { const q = fl[i]; if (q & 2) { const d = B[p++]; x += q & 16 ? d : -d; } else if (!(q & 16)) { x += i16(B, p); p += 2; } xs.push(x); }
  for (let i = 0; i < np; i++) { const q = fl[i]; if (q & 4) { const d = B[p++]; y += q & 32 ? d : -d; } else if (!(q & 32)) { y += i16(B, p); p += 2; } ys.push(y); }
  const out: [number, number][][] = []; let s = 0;
  for (const e of ends) {
    const pts = []; for (let i = s; i <= e; i++) pts.push({ x: xs[i], y: ys[i], on: (fl[i] & 1) === 1 });
    s = e + 1; if (!pts.length) continue;
    // start on an on-curve point (or the midpoint of two off-curve points)
    let k = pts.findIndex(q => q.on); const seq = k >= 0 ? [...pts.slice(k), ...pts.slice(0, k)] : pts;
    const start = k >= 0 ? seq[0] : { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2, on: true };
    const poly: [number, number][] = [[start.x, start.y]]; let prev = start;
    const list = k >= 0 ? [...seq.slice(1), seq[0]] : [...seq, start];
    for (let i = 0; i < list.length; i++) {
      const q = list[i];
      if (q.on) { poly.push([q.x, q.y]); prev = q; continue; }
      const nx = list[(i + 1) % list.length], end = nx.on ? nx : { x: (q.x + nx.x) / 2, y: (q.y + nx.y) / 2, on: true };
      for (let t = 1; t <= 4; t++) { const u = t / 4; poly.push([(1 - u) * (1 - u) * prev.x + 2 * u * (1 - u) * q.x + u * u * end.x, (1 - u) * (1 - u) * prev.y + 2 * u * (1 - u) * q.y + u * u * end.y]); }
      prev = end; if (nx.on) i++;
    }
    out.push(poly);
  }
  return out;
}
