/**
 * The work-order pack as a PDF, laid out by SmartWeld's own code (DESIGN_BASIS.md §55, SW-PDF-3..5) from the same
 * blocks as the HTML pack (woSections). Replaces printing by a headless browser (SW-LIC-2).
 */
import { PdfDoc, hex, type Page, type RGB } from './pdf';
import type { Font } from './ttf';
import type { Block, Section } from '../generator/wopack';

const INK = hex('#1b1f24'), GREY = hex('#555555'), RED = hex('#d0021b'), RULE = hex('#9aa3ad'), HEAD = hex('#eef2f7'), LABEL = hex('#f6f8fa');
const BODY = 8, SMALL = 7, H1 = 15, H2 = 10.5, LH = 1.3, PADX = 3, PADY = 2;

export class Layout {
  readonly doc: PdfDoc; page!: Page; y = 0;
  readonly x0: number; readonly x1: number; readonly top: number; readonly bottom: number;
  constructor(font: Font, title: string) {
    this.doc = new PdfDoc(font, title);
    this.x0 = this.doc.margin; this.x1 = this.doc.W - this.doc.margin; this.top = this.doc.margin; this.bottom = this.doc.H - this.doc.margin;
    this.newPage();
  }
  get width() { return this.x1 - this.x0; }
  newPage() { this.page = this.doc.newPage(); this.y = this.top; }
  /** start a new page unless h fits below the cursor */
  need(h: number) { if (this.y + h > this.bottom + 1e-6) { if (this.y === this.top) throw new Error(`layout: a block of ${h.toFixed(1)} pt is taller than the page`); this.newPage(); } }
  /** the text broken into lines no wider than w (SW-PDF-3) */
  wrap(text: string, size: number, w: number): string[] {
    const out: string[] = [];
    for (const para of String(text).split('\n')) {
      let cur = '';
      for (const word of para.split(' ')) {
        const tryLine = cur ? `${cur} ${word}` : word;
        if (this.doc.width(tryLine, size) <= w) { cur = tryLine; continue; }
        if (cur) out.push(cur);
        if (this.doc.width(word, size) <= w) { cur = word; continue; }
        let piece = '';   // a word wider than the column: broken between characters
        for (const ch of word) { if (this.doc.width(piece + ch, size) > w && piece) { out.push(piece); piece = ''; } piece += ch; }
        cur = piece;
      }
      out.push(cur);
    }
    for (const l of out) if (this.doc.width(l, size) > w + 1e-6) throw new Error(`layout: line wider than its box: "${l}"`);
    return out;
  }
  /** lines of text with their first line's top at y */
  lines(x: number, y: number, lines: string[], size: number, o: { bold?: boolean; color?: RGB } = {}) {
    lines.forEach((l, i) => this.doc.text(this.page, x, y + i * size * LH + size * 0.95, l, size, o));
    return lines.length * size * LH;
  }
  para(text: string, size: number, o: { bold?: boolean; color?: RGB; indent?: number; gap?: number } = {}) {
    const ls = this.wrap(text, size, this.width - (o.indent ?? 0));
    for (const l of ls) { this.need(size * LH); this.lines(this.x0 + (o.indent ?? 0), this.y, [l], size, o); this.y += size * LH; }
    this.y += o.gap ?? 4;
  }
  /** column widths: at least the longest word, at most the full text, the rest shared in proportion (SW-PDF-3) */
  columns(cells: string[][], size: number, avail: number, fixed?: number[]): number[] {
    if (fixed) return fixed.map(f => f * avail);
    const nC = cells[0].length, pad = 2 * PADX;
    const mn = Array(nC).fill(pad + 4), mx = Array(nC).fill(pad + 4);
    for (const r of cells) r.forEach((c, i) => {
      const words = String(c).split(/[ \n]/);
      mn[i] = Math.max(mn[i], pad + Math.min(Math.max(...words.map(w => this.doc.width(w, size))), avail / nC));
      mx[i] = Math.max(mx[i], pad + Math.max(...String(c).split('\n').map(l => this.doc.width(l, size))));
    });
    // a column left blank for hand entry keeps at least 1 in, or its heading's width (SW-PDF-3)
    for (let i = 0; i < nC; i++) if (cells.length > 1 && cells.slice(1).every(r => !String(r[i] ?? '').trim())) { mn[i] = Math.max(mn[i], 72, mx[i]); mx[i] = mn[i]; }
    const smin = mn.reduce((a, b) => a + b, 0), smax = mx.reduce((a, b) => a + b, 0);
    if (smax <= avail) return mx.map(v => v + (avail - smax) * (v / smax));
    if (smin >= avail) return mn.map(v => v * avail / smin);
    return mn.map((v, i) => v + (mx[i] - v) * (avail - smin) / (smax - smin));
  }
  table(head: string[] | null, rows: string[][], o: { fixed?: number[]; labelCols?: number[]; spans?: (number[] | null)[] } = {}) {
    const all = head ? [head, ...rows] : rows, nC = all[0].length;
    const ws = this.columns(all.map(r => r.length === nC ? r : [...r, ...Array(nC - r.length).fill('')]), BODY, this.width, o.fixed);
    const handEntry = !!head && rows.length > 0 && head.some((_, i) => rows.every(r => !String(r[i] ?? '').trim()));   // SW-PDF-3
    const drawRow = (cells: string[], isHead: boolean, span: number[] | null) => {
      // span: the width of each cell in columns (a value cell may span several)
      const widths: number[] = []; let ci = 0;
      cells.forEach((_, k) => { const n = span ? span[k] : 1; widths.push(ws.slice(ci, ci + n).reduce((a, b) => a + b, 0)); ci += n; });
      const wrapped = cells.map((c, k) => this.wrap(c, BODY, widths[k] - 2 * PADX));
      const h = Math.max(Math.max(...wrapped.map(w => w.length)) * BODY * LH + 2 * PADY, handEntry && !isHead ? 21.6 : 0);
      return { h, draw: () => {
        let x = this.x0;
        cells.forEach((_, k) => {
          const label = o.labelCols?.includes(k) ?? false;
          this.doc.rect(this.page, x, this.y, widths[k], h, { fill: isHead ? HEAD : label ? LABEL : undefined, stroke: RULE, width: 0.5 });
          this.lines(x + PADX, this.y + PADY, wrapped[k], BODY, { bold: isHead || label });
          x += widths[k];
        });
        this.y += h;
      } };
    };
    const headRow = head ? drawRow(head, true, null) : null;
    rows.forEach((r, i) => {
      const row = drawRow(r, false, o.spans?.[i] ?? null);
      const startOfTable = i === 0;
      if (this.y + row.h + (startOfTable && headRow ? headRow.h : 0) > this.bottom) { this.newPage(); if (headRow) { this.need(headRow.h + row.h); headRow.draw(); } }
      else if (startOfTable && headRow) headRow.draw();
      this.need(row.h); row.draw();
    });
    this.y += 6;
  }
  block(b: Block) {
    switch (b.k) {
      case 'demo': {
        const ls = this.wrap(b.text, BODY, this.width - 16), h = ls.length * BODY * LH + 8;
        this.need(h + 6); this.doc.rect(this.page, this.x0, this.y, this.width, h, { stroke: RED, width: 1.5 });
        this.lines(this.x0 + 8, this.y + 4, ls, BODY, { bold: true, color: RED }); this.y += h + 6; break;
      }
      case 'h1': this.need(H1 * LH * 2); this.para(b.text, H1, { bold: true, gap: 6 }); break;
      case 'h2': {
        this.need(H2 * LH + 30); this.y += 6; this.para(b.text, H2, { bold: true, gap: 0 });
        this.doc.path(this.page, [[this.x0, this.y + 1], [this.x1, this.y + 1]], { stroke: INK, width: 0.75 }); this.y += 5; break;
      }
      case 'p': this.para(b.text, b.small ? SMALL : BODY, { color: b.small ? GREY : INK }); break;
      case 'links': this.para(b.links.map(l => `${l.text}: ${l.href}`).join(' · ') + b.after, SMALL, { color: GREY }); break;
      case 'ol': b.items.forEach((it, i) => {
        const ls = this.wrap(it, BODY, this.width - 18);
        this.need(ls.length * BODY * LH); this.lines(this.x0 + 2, this.y, [`${i + 1}.`], BODY); this.y += this.lines(this.x0 + 18, this.y, ls, BODY) + 1;
      }); this.y += 4; break;
      case 'kv': {
        const two = b.rows.some(r => r.length === 2);
        const fixed = two ? [0.14, 0.36, 0.14, 0.36] : [0.14, 0.86];
        this.table(null, b.rows.map(r => r.flat()), { fixed, labelCols: [0, 2], spans: b.rows.map(r => two && r.length === 1 ? [1, 3] : null) });
        break;
      }
      case 'table': this.table(b.head, b.rows); break;
      case 'svg': drawSvg(this, b.svg); break;
    }
  }
}

// ---- isometric SVG (SW-ISO-1) to PDF drawing (SW-PDF-4) ----------------------------------------------------------------
const ent = (t: string) => t.replace(/&(quot|amp|lt|gt|apos|#\d+|#x[0-9a-f]+);/gi, (_, e: string) => ({ quot: '"', amp: '&', lt: '<', gt: '>', apos: "'" } as Record<string, string>)[e.toLowerCase()] ?? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)));
const attrs = (s: string) => { const a: Record<string, string> = {}; for (const m of s.matchAll(/([\w:-]+)="([^"]*)"/g)) a[m[1]] = ent(m[2]); return a; };
type Style = Record<string, string>;

export function drawSvg(L: Layout, svg: string) {
  const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)!, VW = +vb[1], VH = +vb[2];
  const avail = L.bottom - L.y, k = Math.min(L.width / VW, avail / VH);
  if (k < 0.5) throw new Error('layout: no room for the isometric');
  const ox = L.x0 + (L.width - VW * k) / 2, oy = L.y;
  const css = new Map<string, Style>();
  for (const m of (/<style>([\s\S]*?)<\/style>/.exec(svg)?.[1] ?? '').matchAll(/\.([\w-]+)\{([^}]*)\}/g)) {
    const st: Style = {}; for (const d of m[2].split(';')) { const [p, ...v] = d.split(':'); if (p) st[p.trim()] = v.join(':').trim(); } css.set(m[1], st);
  }
  const style = (a: Record<string, string>, inherited: Style): Style => {
    const st: Style = { ...inherited };
    for (const c of (a.class ?? '').split(/\s+/)) Object.assign(st, css.get(c) ?? {});
    for (const p of ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'text-anchor', 'font']) if (a[p]) st[p] = a[p];
    return st;
  };
  const P = (x: number, y: number, t: [number, number]): [number, number] => [ox + (x + t[0]) * k, oy + (y + t[1]) * k];
  const stack: { st: Style; t: [number, number] }[] = [{ st: {}, t: [0, 0] }];
  const body = svg.replace(/<style>[\s\S]*?<\/style>/, '');
  const re = /<(\/?)(\w+)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>([^<]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const [, close, tag, at, self, after] = m, top = stack[stack.length - 1];
    if (close) { if (tag === 'g') stack.pop(); continue; }
    const a = attrs(at), st = style(a, top.st);
    let t = top.t;
    const tr = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(a.transform ?? ''); if (tr) t = [t[0] + +tr[1], t[1] + +tr[2]];
    if (tag === 'g') { if (!self) stack.push({ st, t }); continue; }
    const fill = st.fill === 'none' ? undefined : hex(st.fill && st.fill.startsWith('#') ? st.fill : '#000000');
    const stroke = st.stroke && st.stroke !== 'none' ? hex(st.stroke) : undefined;
    const sw = (st['stroke-width'] ? parseFloat(st['stroke-width']) : 1) * k, dash = st['stroke-dasharray'] ? st['stroke-dasharray'].split(/[ ,]+/).map(v => +v * k) : undefined;
    const sty = { fill: tag === 'line' || tag === 'polyline' ? (st.fill && st.fill !== 'none' && tag === 'polyline' ? fill : undefined) : fill, stroke, width: sw, dash };
    if (tag === 'rect') L.doc.rect(L.page, ...P(+a.x, +a.y, t), +a.width * k, +a.height * k, sty);
    else if (tag === 'line') L.doc.path(L.page, [P(+a.x1, +a.y1, t), P(+a.x2, +a.y2, t)], { ...sty, fill: undefined });
    else if (tag === 'polyline' || tag === 'polygon') {
      const pts = a.points.trim().split(/\s+/).map(q => q.split(',').map(Number)).map(([x, y]) => P(x, y, t));
      L.doc.path(L.page, pts, { ...sty, closed: tag === 'polygon' });
    } else if (tag === 'circle') L.doc.circle(L.page, ...P(+a.cx, +a.cy, t), +a.r * k, sty);
    else if (tag === 'ellipse') {
      const pts: [number, number][] = []; for (let i = 0; i < 36; i++) { const u = (i / 36) * 2 * Math.PI; pts.push(P(+a.cx + +a.rx * Math.cos(u), +a.cy + +a.ry * Math.sin(u), t)); }
      L.doc.path(L.page, pts, { ...sty, closed: true });
    }
    else if (tag !== 'text' && tag !== 'svg') throw new Error(`isometric: SVG element <${tag}> is not drawn by the PDF writer (SW-PDF-4)`);
    else if (tag === 'text') {
      const text = ent(after).trim(); if (!text) continue;
      const f = /(bold\s+)?([\d.]+)px/.exec(st.font ?? '') ?? [null, null, '10'];
      const size = +f[2]! * k, bold = !!f[1], w = L.doc.width(text, size);
      const [x, y] = P(+a.x, +a.y, t), anchor = st['text-anchor'] ?? 'start';
      L.doc.text(L.page, anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x, y, text, size, { bold, color: fill ?? INK });
    }
  }
  L.y += VH * k;
}

/** the pack as PDF bytes: the sections, then the notices (SW-PDF-5) */
export function packPdf(font: Font, title: string, sections: Section[], notices: { demo: string; font: string }): Uint8Array {
  return packDoc(font, title, sections, notices).save();
}
/** the laid-out pack, before it is written: its pages' records also draw the previews (SW-REN-2) */
export function packDoc(font: Font, title: string, sections: Section[], notices: { demo: string; font: string }): PdfDoc {
  const L = new Layout(font, title);
  sections.forEach((s, i) => {
    if (i > 0 && (s.cls === 'itp' || s.cls === 'iso') && L.y > L.top) L.newPage();
    for (const b of s.blocks) L.block(b);
  });
  L.block({ k: 'h2', text: 'Notices' });
  L.para(notices.demo, SMALL, { bold: true, color: RED });
  L.para(`This document embeds a subset of the DejaVu Sans font (SW-LIC-3), renamed under its licence. ${notices.font}`, 6, { color: GREY });
  return L.doc;
}
