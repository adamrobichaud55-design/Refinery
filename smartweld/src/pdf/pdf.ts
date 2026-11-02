/**
 * SmartWeld's own PDF writer (DESIGN_BASIS.md §55, SW-PDF-1/2): pages of text and vector drawing, the embedded font
 * subset, deterministic output. Every drawing call is also kept as a record, so the page previews (SW-REN-2) draw
 * exactly what the PDF holds.
 */
import { deflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { subsetFont, type Font } from './ttf';
import { writeVal, isRef, type PdfSource, type PVal } from './import';

export type RGB = [number, number, number];
export interface TextRec { k: 'text'; x: number; y: number; size: number; bold: boolean; color: RGB; str: string; gids: number[] }
export interface PathRec { k: 'path'; pts: [number, number][]; closed: boolean; fill?: RGB; stroke?: RGB; width: number; dash?: number[] }
export type Rec = TextRec | PathRec;
/** a page drawn here (recs), or a page of another PDF attached unchanged (SW-PDF-6) */
export interface Page { recs: Rec[]; attached?: { src: PdfSource; dict: Map<string, PVal>; label: string } }

const n = (v: number) => (Math.round(v * 1000) / 1000).toString();
const col = (c: RGB) => c.map(v => n(v / 255)).join(' ');
export const hex = (h: string): RGB => { const s = h.replace('#', ''); const f = s.length === 3 ? s.split('').map(c => c + c).join('') : s; return [0, 2, 4].map(i => parseInt(f.slice(i, i + 2), 16)) as RGB; };

export class PdfDoc {
  readonly W = 1224; readonly H = 792; readonly margin = 28.8;
  pages: Page[] = [];
  /** glyph -> [font slot, one-byte code]; 255 codes per embedded subset */
  private slot = new Map<number, [number, number]>(); private uni = new Map<number, string>(); private nextSlot = 0;
  constructor(readonly font: Font, readonly title: string) {}
  newPage(): Page { const p = { recs: [] }; this.pages.push(p); return p; }
  /** attach page i (0-based) of another PDF, unchanged (SW-PDF-6) */
  attach(src: PdfSource, i: number, label: string): Page { const pages = src.pages(); if (!pages[i]) throw new Error(`${src.name}: no page ${i + 1}`); const p: Page = { recs: [], attached: { src, dict: pages[i], label } }; this.pages.push(p); return p; }
  /** the glyphs of a text; a character the font lacks is an error (SW-PDF-2) */
  glyphs(str: string): number[] {
    return [...str].map(ch => { const g = this.font.gid.get(ch.codePointAt(0)!); if (!g) throw new Error(`font has no glyph for '${ch}' (U+${ch.codePointAt(0)!.toString(16)}) in "${str}"`); return g; });
  }
  width(str: string, size: number): number { return this.glyphs(str).reduce((s, g) => s + this.font.advance[g], 0) * size / this.font.unitsPerEm; }
  /** text with its baseline at y (from the top of the page) */
  text(p: Page, x: number, y: number, str: string, size: number, opt: { bold?: boolean; color?: RGB } = {}) {
    if (!str) return;
    const gids = this.glyphs(str);
    [...str].forEach((ch, i) => { const g = gids[i]; if (!this.slot.has(g)) { this.slot.set(g, [Math.floor(this.nextSlot / 255), 1 + (this.nextSlot % 255)]); this.nextSlot++; } this.uni.set(g, ch); });
    p.recs.push({ k: 'text', x, y, size, bold: !!opt.bold, color: opt.color ?? [27, 31, 36], str, gids });
  }
  path(p: Page, pts: [number, number][], o: { closed?: boolean; fill?: RGB; stroke?: RGB; width?: number; dash?: number[] }) {
    if (pts.length < 2) return;
    p.recs.push({ k: 'path', pts, closed: !!o.closed, fill: o.fill, stroke: o.stroke, width: o.width ?? 1, dash: o.dash });
  }
  rect(p: Page, x: number, y: number, w: number, h: number, o: { fill?: RGB; stroke?: RGB; width?: number }) { this.path(p, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { ...o, closed: true }); }
  circle(p: Page, cx: number, cy: number, r: number, o: { fill?: RGB; stroke?: RGB; width?: number }) {
    const pts: [number, number][] = []; for (let i = 0; i < 24; i++) { const a = (i / 24) * 2 * Math.PI; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    this.path(p, pts, { ...o, closed: true });
  }

  private content(p: Page): string {
    const o: string[] = [], Y = (y: number) => n(this.H - y);
    for (const r of p.recs) {
      if (r.k === 'path') {
        const op = r.fill && r.stroke ? 'B' : r.fill ? 'f' : 'S';
        o.push('q');
        if (r.fill) o.push(`${col(r.fill)} rg`);
        if (r.stroke) o.push(`${col(r.stroke)} RG ${n(r.width)} w 1 J 1 j${r.dash ? ` [${r.dash.map(n).join(' ')}] 0 d` : ''}`);
        o.push(`${n(r.pts[0][0])} ${Y(r.pts[0][1])} m ${r.pts.slice(1).map(q => `${n(q[0])} ${Y(q[1])} l`).join(' ')}${r.closed ? ' h' : ''} ${r.closed || !r.fill ? op : 'S'}`);
        o.push('Q');
      } else {
        // runs of glyphs in the same embedded subset
        let i = 0;
        let x = r.x;
        while (i < r.gids.length) {
          const s0 = this.slot.get(r.gids[i])![0]; let j = i; let hexs = '';
          while (j < r.gids.length && this.slot.get(r.gids[j])![0] === s0) { hexs += this.slot.get(r.gids[j])![1].toString(16).padStart(2, '0'); j++; }
          o.push(`BT /F${s0 + 1} ${n(r.size)} Tf ${col(r.color)} rg${r.bold ? ` ${col(r.color)} RG ${n(0.04 * r.size)} w 2 Tr` : ' 0 Tr'} ${n(x)} ${Y(r.y)} Td <${hexs}> Tj ET`);
          for (let k = i; k < j; k++) x += this.font.advance[r.gids[k]] * r.size / this.font.unitsPerEm;
          i = j;
        }
      }
    }
    return o.join('\n');
  }

  save(): Uint8Array {
    const objs: (string | { dict: string; data: Uint8Array } | { raw: string; data: Uint8Array })[] = [];
    const add = (o: string | { dict: string; data: Uint8Array } | { raw: string; data: Uint8Array }) => { objs.push(o); return objs.length; };
    const catalog = add(''), pagesId = add('');
    // fonts: one subset per slot of 255 glyphs
    const bySlot = new Map<number, [number, number][]>();   // slot -> [code, gid]
    for (const [g, [s, c]] of this.slot) { if (!bySlot.has(s)) bySlot.set(s, []); bySlot.get(s)!.push([c, g]); }
    const F = this.font, k = 1000 / F.unitsPerEm, fontIds: number[] = [];
    for (const [s, codes] of [...bySlot].sort((a, b) => a[0] - b[0])) {
      codes.sort((a, b) => a[0] - b[0]);
      const sub = subsetFont(F, codes);
      const tag = createHash('sha256').update(sub).digest().subarray(0, 6).reduce((t, b) => t + String.fromCharCode(65 + (b % 26)), '');
      const file = add({ dict: `/Length1 ${sub.length}`, data: sub });
      const desc = add(`<< /Type /FontDescriptor /FontName /${tag}+${F.name} /Flags 4 /FontBBox [${F.bbox.map(v => Math.round(v * k)).join(' ')}] /ItalicAngle 0 /Ascent ${Math.round(F.ascent * k)} /Descent ${Math.round(F.descent * k)} /CapHeight ${Math.round(F.capHeight * k)} /StemV 80 /FontFile2 ${file} 0 R >>`);
      const first = codes[0][0], last = codes[codes.length - 1][0], w: number[] = [];
      const byCode = new Map(codes);
      for (let c = first; c <= last; c++) w.push(byCode.has(c) ? Math.round(F.advance[byCode.get(c)!] * k) : 0);
      const cm = ['/CIDInit /ProcSet findresource begin', '12 dict begin', 'begincmap', '/CMapName /SmartWeld-ToUnicode def', '/CMapType 2 def',
        '1 begincodespacerange', '<00> <FF>', 'endcodespacerange'];
      for (let i = 0; i < codes.length; i += 100) {
        const part = codes.slice(i, i + 100);
        cm.push(`${part.length} beginbfchar`, ...part.map(([c, g]) => `<${c.toString(16).padStart(2, '0')}> <${[...Buffer.from(this.uni.get(g)!, 'utf16le')].reduce((h, b, j, arr) => j % 2 ? h : h + (arr[j + 1] ?? 0).toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0'), '')}>`), 'endbfchar');
      }
      cm.push('endcmap', 'CMapName currentdict /CMap defineresource pop', 'end', 'end');
      const tu = add({ dict: '', data: new TextEncoder().encode(cm.join('\n')) });
      fontIds[s] = add(`<< /Type /Font /Subtype /TrueType /BaseFont /${tag}+${F.name} /FirstChar ${first} /LastChar ${last} /Widths [${w.join(' ')}] /FontDescriptor ${desc} 0 R /ToUnicode ${tu} 0 R >>`);
    }
    const fontRes = `<< ${fontIds.map((id, s) => `/F${s + 1} ${id} 0 R`).join(' ')} >>`;
    const pageIds: number[] = [];
    const copied = new Map<PdfSource, Map<number, number>>();
    /** an attached page's objects, copied once per source; streams keep their dictionary and bytes (SW-PDF-6) */
    const copy = (src: PdfSource, n: number): number => {
      let m = copied.get(src); if (!m) { m = new Map(); copied.set(src, m); }
      if (m.has(n)) return m.get(n)!;
      const id = add(''); m.set(n, id);
      const v = src.obj(n), ref = (k: number) => copy(src, k);
      if (v && typeof v === 'object' && !Array.isArray(v) && v.t === 'stream') {
        const d = new Map(v.dict); d.set('Length', v.data.length);
        objs[id - 1] = { raw: writeVal({ t: 'dict', v: d }, ref), data: v.data };
      } else objs[id - 1] = writeVal(v, ref);
      return id;
    };
    for (const p of this.pages) {
      if (p.attached) {
        const { src, dict } = p.attached, d = new Map(dict);
        d.set('Type', { t: 'name', v: 'Page' });
        const body = writeVal({ t: 'dict', v: d }, k => copy(src, k)).replace(/^<< /, `<< /Parent ${pagesId} 0 R `);
        pageIds.push(add(body));
        continue;
      }
      const c = add({ dict: '', data: new TextEncoder().encode(this.content(p)) });
      pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${this.W} ${this.H}] /Resources << /Font ${fontRes} >> /Contents ${c} 0 R >>`));
    }
    objs[catalog - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
    objs[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map(i => `${i} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
    const pdfStr = (s: string) => '(' + s.replace(/[\\()]/g, m => '\\' + m).replace(/[^\x20-\x7e]/g, '?') + ')';
    const info = add(`<< /Title ${pdfStr(this.title)} /Producer (SmartWeld PDF writer, DESIGN_BASIS SW-PDF) >>`);
    // assemble
    const parts: Uint8Array[] = [], enc = new TextEncoder(); let len = 0; const offs: number[] = [];
    const put = (b: Uint8Array | string) => { const u = typeof b === 'string' ? enc.encode(b) : b; parts.push(u); len += u.length; };
    put('%PDF-1.7\n%\xe2\xe3\xcf\xd3\n'.replace(/[\xe2\xe3\xcf\xd3]/g, '~'));
    objs.forEach((o, i) => {
      offs.push(len);
      if (typeof o === 'string') put(`${i + 1} 0 obj\n${o}\nendobj\n`);
      else if ('raw' in o) { put(`${i + 1} 0 obj\n${o.raw}\nstream\n`); put(o.data); put('\nendstream\nendobj\n'); }
      else { const z = deflateSync(o.data, { level: 9 }); put(`${i + 1} 0 obj\n<< /Length ${z.length} /Filter /FlateDecode ${o.dict} >>\nstream\n`); put(z); put('\nendstream\nendobj\n'); }
    });
    const body = Buffer.concat(parts), id = createHash('sha256').update(body).digest('hex').slice(0, 32);
    const xref = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map(o => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
    const trailer = `trailer\n<< /Size ${objs.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R /ID [<${id}> <${id}>] >>\nstartxref\n${len}\n%%EOF\n`;
    return new Uint8Array(Buffer.concat([body, Buffer.from(xref + trailer, 'latin1')]));
  }
}
