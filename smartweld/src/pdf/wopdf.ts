/**
 * The work-order pack as a PDF, laid out by SmartWeld's own code (DESIGN_BASIS.md §55, SW-PDF-3/5/6) from the same
 * blocks as the HTML pack (woSections), with the owner's drawing sheets attached unchanged (SW-IMP-8). Replaces
 * printing by a headless browser (SW-LIC-2).
 */
import { PdfDoc, hex, type Page, type RGB } from './pdf';
import { PdfSource } from './import';
import type { Font } from './ttf';
import type { Block, Section } from '../generator/wopack';

const INK = hex('#1b1f24'), GREY = hex('#555555'), RED = hex('#d0021b'), RULE = hex('#9aa3ad'), HEAD = hex('#eef2f7'), LABEL = hex('#f6f8fa');
const BODY = 8, SMALL = 7, H1 = 15, H2 = 10.5, LH = 1.3, PADX = 3, PADY = 2;

export class Layout {
  readonly doc: PdfDoc; page!: Page; y = 0;
  readonly x0: number; readonly x1: number; readonly top: number; readonly bottom: number;
  private sources = new Map<string, PdfSource>();
  constructor(font: Font, title: string, readonly attachment?: (file: string) => Uint8Array) {
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
      case 'attach': {   // the owner's sheets, unchanged (SW-IMP-8, SW-PDF-6)
        if (!this.attachment) throw new Error('layout: no source for attached drawings');
        let src = this.sources.get(b.file); if (!src) { src = new PdfSource(this.attachment(b.file), b.file); this.sources.set(b.file, src); }
        if (this.page.recs.length === 0 && this.doc.pages[this.doc.pages.length - 1] === this.page) this.doc.pages.pop();
        for (const k of b.sheets) this.doc.attach(src, k - 1, `${b.drawing} sheet ${k} of ${b.of}`);
        this.newPage(); break;
      }
    }
  }
}

/** the pack as PDF bytes: the sections, then the notices (SW-PDF-5) */
export function packPdf(font: Font, title: string, sections: Section[], notices: { demo: string; font: string }, attachment?: (file: string) => Uint8Array): Uint8Array {
  return packDoc(font, title, sections, notices, attachment).save();
}
/** the laid-out pack, before it is written: its pages' records also draw the previews (SW-REN-2) */
export function packDoc(font: Font, title: string, sections: Section[], notices: { demo: string; font: string }, attachment?: (file: string) => Uint8Array): PdfDoc {
  const L = new Layout(font, title, attachment);
  sections.forEach((s, i) => {
    if (i > 0 && (s.cls === 'itp' || s.cls === 'iso') && L.y > L.top) L.newPage();
    for (const b of s.blocks) L.block(b);
  });
  L.block({ k: 'h2', text: 'Notices' });
  L.para(notices.demo, SMALL, { bold: true, color: RED });
  L.para(`This document embeds a subset of the DejaVu Sans font (SW-LIC-3), renamed under its licence. ${notices.font}`, 6, { color: GREY });
  return L.doc;
}
