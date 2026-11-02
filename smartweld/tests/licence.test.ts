/**
 * Licence, PDF-writer and renderer tests (DESIGN_BASIS.md §0.1 SW-LIC-*, §55 SW-PDF-*, §56 SW-REN-*).
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { PipingModel } from '../src/generator/piping';
import type { GTLine, GTEquipment, GroundTruth } from '../src/generator/groundtruth';
import type { ImportedIndex } from '../src/generator/imported';
import { workOrderPdfs, linkImported } from '../src/generator/woexport';
import { buildWorkOrders, DEMO_NOTICE } from '../src/generator/workorders';
import { woIsometrics, woSections } from '../src/generator/wopack';
import { packDoc } from '../src/pdf/wopdf';
import { parseFont } from '../src/pdf/ttf';
import { readOwnPng } from '../src/render/sheet';

const root = new URL('../', import.meta.url), pub = new URL('public/', root);
const rd = (p: string) => readFileSync(new URL(p, root));
const PERMISSIVE = /^(MIT|ISC|BSD-2-Clause|BSD-3-Clause|0BSD|Apache-2\.0|BlueOak-1\.0\.0|Unlicense|CC0-1\.0|Python-2\.0)$/;

describe('licences (SW-LIC-1..3)', () => {
  it('every installed npm package is under a permissive licence', () => {
    const bad: string[] = [];
    const walk = (d: string) => { if (!existsSync(d)) return; for (const n of readdirSync(d)) { if (n.startsWith('.')) continue; const p = join(d, n); if (n.startsWith('@')) { walk(p); continue; } const pj = join(p, 'package.json'); if (existsSync(pj)) { const j = JSON.parse(readFileSync(pj, 'utf8')); if (j.name) { const l = String(j.license ?? 'UNKNOWN'); if (!l.split(/ OR |[()]/).filter(Boolean).some(x => PERMISSIVE.test(x.trim()))) bad.push(`${j.name}@${j.version} ${l}`); } walk(join(p, 'node_modules')); } } };
    walk(new URL('node_modules', root).pathname);
    expect(bad).toEqual([]);
  });
  it('no code or tool of the project calls a copyleft program or a browser (SW-LIC-2)', () => {
    const files: string[] = [];
    const walk = (d: string) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) { if (n !== '__pycache__') walk(p); } else if (/\.(ts|mjs|js|py)$/.test(n)) files.push(p); } };
    for (const d of ['src', 'tools', 'tests']) walk(new URL(d, root).pathname);
    const pkg = rd('package.json').toString();
    const pattern = new RegExp(['pdf' + 'totext', 'pdf' + 'toppm', 'pop' + 'pler', 'play' + 'wright', 'chrom' + 'ium', 'ghost' + 'script', 'mu' + 'tool', 'ff' + 'mpeg', 'ink' + 'scape', 'image' + 'magick', 'puppet' + 'eer'].join('|'), 'i');
    for (const f of files) expect(pattern.test(readFileSync(f, 'utf8')), f).toBe(false);
    expect(pattern.test(pkg)).toBe(false);
  });
  it('the only font file is DejaVu Sans, with its licence notice (SW-LIC-3)', () => {
    expect(readdirSync(new URL('assets/fonts/', root)).sort()).toEqual(['DejaVuSans-LICENSE.txt', 'DejaVuSans.ttf']);
    const lic = rd('assets/fonts/DejaVuSans-LICENSE.txt').toString();
    expect(lic).toContain('Bitstream Vera is a trademark'); expect(lic).toContain('only if the fonts');
    expect(rd('THIRD_PARTY_NOTICES.md').toString()).toContain('DejaVu Sans');
  });
});

describe('PDF writer (SW-PDF-1..5)', () => {
  const m = JSON.parse(readFileSync(new URL('plant-piping.json', pub), 'utf8')) as PipingModel;
  const order = new Map(m.lines.map((l, i) => [l.no, i] as const));
  const lines = readdirSync(new URL('groundtruth/lines/', pub)).map(f => JSON.parse(readFileSync(new URL(`groundtruth/lines/${f}`, pub), 'utf8')) as GTLine).sort((a, b) => order.get(a.header.line)! - order.get(b.header.line)!);
  const gt = { lines, classes: JSON.parse(readFileSync(new URL('groundtruth/line-classes.json', pub), 'utf8')), nozzles: [] } as GroundTruth;
  const eq = JSON.parse(readFileSync(new URL('groundtruth/equipment.json', pub), 'utf8')) as GTEquipment[];
  const imported = JSON.parse(readFileSync(new URL('isometrics-imported/index.json', pub), 'utf8')) as ImportedIndex;
  const font = parseFont(new Uint8Array(rd('assets/fonts/DejaVuSans.ttf'))), notice = rd('assets/fonts/DejaVuSans-LICENSE.txt').toString();
  it('every committed work-order PDF equals a fresh run byte for byte (deterministic, SW-PDF-1)', () => {
    const fresh = workOrderPdfs(m, gt, eq, font, notice, imported);
    expect(fresh.size).toBe(readdirSync(new URL('workorders/pdf/', pub)).length);
    for (const [p, b] of fresh) expect(Buffer.compare(Buffer.from(b), readFileSync(new URL(p, pub))), p).toBe(0);
  }, 120000);
  it('every PDF is well formed: header, cross-reference offsets, and the subset named DejaVuSans only (SW-PDF-1/2, SW-LIC-3)', () => {
    for (const f of readdirSync(new URL('workorders/pdf/', pub))) {
      const b = readFileSync(new URL(`workorders/pdf/${f}`, pub)), s = b.toString('latin1');
      expect(s.startsWith('%PDF-1.7')).toBe(true);
      const xref = Number(/startxref\n(\d+)/.exec(s)![1]); expect(s.slice(xref, xref + 4)).toBe('xref');
      const offs = [...s.slice(xref).matchAll(/^(\d{10}) 00000 n $/gm)].map(x => Number(x[1]));
      offs.forEach((o, i) => expect(s.slice(o, o + String(i + 1).length + 6), `${f} object ${i + 1}`).toBe(`${i + 1} 0 obj`));
      const names = [...s.matchAll(/\/BaseFont \/([A-Z]{6}\+[A-Za-z]+)/g)].map(x => x[1]);
      expect(names.length, f).toBeGreaterThan(0);
      for (const n of names) { expect(n).toMatch(/^[A-Z]{6}\+DejaVuSans$/); expect(/Bitstream|Vera/.test(n)).toBe(false); }
    }
  });
  it('the layout keeps every text and path inside the page, and each pack ends with the notices (SW-PDF-3/5)', () => {
    const wos = buildWorkOrders(m, gt, eq); linkImported(wos, imported);
    const lineGT = new Map(lines.map(l => [l.header.line, l] as const));
    for (const w of wos.slice(0, 6)) {
      const doc = packDoc(font, w.number, woSections(w, woIsometrics(w, lineGT), imported), { demo: DEMO_NOTICE, font: notice });
      for (const p of doc.pages) for (const r of p.recs) {
        if (r.k === 'text') { expect(r.x, w.number).toBeGreaterThanOrEqual(doc.margin - 0.01); expect(r.x + doc.width(r.str, r.size), `${w.number} "${r.str}"`).toBeLessThanOrEqual(doc.W - doc.margin + 0.01); expect(r.y).toBeLessThanOrEqual(doc.H - doc.margin + 0.01); }
        else for (const [x, y] of r.pts) { expect(x).toBeGreaterThanOrEqual(doc.margin - 3); expect(x).toBeLessThanOrEqual(doc.W - doc.margin + 3); expect(y).toBeLessThanOrEqual(doc.H - doc.margin + 3); }
      }
      const last = doc.pages.slice(-2).flatMap(p => p.recs).filter(r => r.k === 'text').map(r => (r as { str: string }).str).join(' ');
      expect(last).toContain('Bitstream Vera is a trademark'); expect(last).toContain('DEMONSTRATION ONLY');
    }
  }, 120000);
});

describe('renderer (SW-REN-1..3)', () => {
  it('every review image is a SmartWeld render listed with its view in screenshots/INDEX.md', () => {
    const index = rd('screenshots/INDEX.md').toString();
    const pngs: string[] = [];
    for (const d of readdirSync(new URL('screenshots/', root))) { const p = new URL(`screenshots/${d}`, root); if (statSync(p).isDirectory()) for (const f of readdirSync(p)) pngs.push(`${d}/${f}`); }
    expect(pngs.length).toBeGreaterThan(50);
    for (const p of pngs) { expect(p.endsWith('.png'), p).toBe(true); expect(index.includes('`' + p + '`'), p).toBe(true); expect(() => readOwnPng(new Uint8Array(rd(`screenshots/${p}`))), p).not.toThrow(); }
  });
  it('every stage-9 rule ID used in code is written in DESIGN_BASIS.md', () => {
    const basis = rd('DESIGN_BASIS.md').toString();
    for (const f of ['src/pdf/ttf.ts', 'src/pdf/pdf.ts', 'src/pdf/wopdf.ts', 'src/render/raster.ts', 'src/render/page.ts', 'src/render/scene.ts', 'src/render/view3d.ts', 'src/render/sheet.ts', 'tools/render-views.ts', 'tools/export-wo.ts', 'tools/isoparse.py']) {
      for (const id of new Set(rd(f).toString().match(/SW-(?:LIC|PDF|REN)-\d+/g) ?? [])) expect(basis.includes('`' + id + '`'), `${id} in ${f}`).toBe(true);
    }
  });
});
