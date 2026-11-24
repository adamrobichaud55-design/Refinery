/**
 * Plant 3: the printable records (DESIGN_BASIS.md §76, SW-REG-7), laid out by SmartWeld's own PDF writer (SW-PDF-*).
 * Every page carries the demonstration band at its head and the document's name and page number at its foot.
 */
import { Layout } from '../pdf/wopdf';
import { hex, type PdfDoc } from '../pdf/pdf';
import type { Font } from '../pdf/ttf';
import { unitSections, indexSections, BAND } from './registryReport';

const RED = hex('#d0021b'), GREY = hex('#555555');
/** a unit's records, or with unit 0 the registration index */
export function registryPdf(font: Font, unit: number): { name: string; pdf: Uint8Array; pageCount: number; doc: PdfDoc } {
  const S = unit ? unitSections(unit) : indexSections(), L = new Layout(font, S.title);
  S.pages.forEach((blocks, i) => { if (i > 0) L.newPage(); for (const b of blocks) L.block(b); });
  const doc = L.doc, n = doc.pages.length;
  doc.pages.forEach((p, i) => {
    doc.text(p, doc.margin, 18, BAND, 8, { bold: true, color: RED });
    const foot = `${S.title}   page ${i + 1} of ${n}`; doc.text(p, doc.W - doc.margin - doc.width(foot, 7), doc.H - 11, foot, 7, { color: GREY });
  });
  return { name: unit ? `unit-${unit}.pdf` : 'registration-index.pdf', pdf: doc.save(), pageCount: n, doc };
}
