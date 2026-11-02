/**
 * Work-order packs (stage 7): the content of a work order's pack — cover and scope, the owner's drawings, assets,
 * isolation list, parts, new welds, welding specifications, NDE, inspections and TMLs, test, bolting, the ITP with
 * sign-off columns (SW-ITP-1..3), and the attached isometrics (SW-ISO-2) — as one list of blocks. The HTML pack
 * (woHtml) and SmartWeld's own PDF writer (src/pdf/wopdf.ts, SW-PDF-3) both render these same blocks.
 */
import { plantText, type GTLine } from './groundtruth';
import { makeIsometric } from './isometric';
import { WELD_SPECS, DEMO_NOTICE, type WorkOrder } from './workorders';
import type { ImportedIndex } from './imported';

export type Block =
  | { k: 'demo'; text: string }
  | { k: 'h1'; text: string }
  | { k: 'h2'; text: string }
  | { k: 'p'; text: string; small?: boolean }
  | { k: 'links'; links: { text: string; href: string }[]; after: string }
  | { k: 'ol'; items: string[] }
  | { k: 'kv'; rows: [string, string][][]; strong?: string[] }      // each row: one pair (spanning) or two pairs
  | { k: 'table'; head: string[]; rows: string[][] }
  | { k: 'svg'; svg: string };
export interface Section { cls?: 'cover' | 'itp' | 'iso'; blocks: Block[] }

/** the work order's isometrics: the work line(s) clouded with the affected items, other attached lines with isolations clouded */
export function woIsometrics(wo: WorkOrder, lineGT: Map<string, GTLine>): Map<string, string> {
  const out = new Map<string, string>(), affected = new Set([...wo.items, ...wo.isolations.map(i => i.tag)]);
  for (const ln of wo.lines) {
    const L = lineGT.get(ln); if (!L) continue;
    out.set(ln, makeIsometric(L, { cloud: affected, wo: wo.number, title: wo.title, newWelds: wo.newWelds.filter(w => w.line === ln && w.ws !== 'WS-03').map(w => ({ id: w.id, replaces: w.replaces })) }));
  }
  return out;
}

const s = (v: unknown) => String(v ?? '');
const table = (head: string[], rows: unknown[][]): Block => ({ k: 'table', head, rows: rows.map(r => r.map(s)) });

/** the pack's content, in order */
export function woSections(wo: WorkOrder, isos: Map<string, string>, imported?: ImportedIndex): Section[] {
  const sec: Section[] = [];
  sec.push({ cls: 'cover', blocks: [
    { k: 'demo', text: DEMO_NOTICE },
    { k: 'h1', text: `${wo.number} — ${wo.title}` },
    { k: 'kv', strong: [wo.primaryAsset.tag], rows: [
      [['Area', `${wo.area} ${wo.areaName}`], ['Task', `${wo.type} ${wo.typeName}`]],
      [['Priority', `${wo.priority} (${['', 'safety', 'integrity', 'reliability'][wo.priority]})`], ['Issued by', wo.issuedBy]],
      [['Primary asset', `${wo.primaryAsset.tag} — ${wo.primaryAsset.description} — ${plantText(wo.primaryAsset.at)}`]],
      [['Equipment', wo.equipment ?? '—'], ['Lines', wo.lines.join(', ')]],
      [['Isometrics', `${wo.isometrics.join(', ')}${wo.importedIsometrics?.length ? ` (generated); owner's drawings ${wo.importedIsometrics.map(r => r.drawing).join(', ')}` : ''}`]],
      [['Permits', wo.permits.join(', ')]]] },
    { k: 'h2', text: 'Reason' }, { k: 'p', text: wo.reason },
    { k: 'h2', text: 'Scope of work' }, { k: 'ol', items: wo.scope },
    { k: 'p', small: true, text: `Affected items: ${wo.items.join(', ')}` }, { k: 'p', small: true, text: `Rules: ${wo.rules.join(', ')}` }] });
  if (wo.importedIsometrics?.length && imported) {   // SW-IMP-6: the owner's drawings of the work lines and what the match to the model found
    const fs = wo.importedIsometrics.flatMap(r => imported.drawings[r.drawing].findings.filter(f => f.level !== 'info').map(f => [r.drawing, f.sheet ?? '', f.level, f.message]));
    sec.push({ blocks: [{ k: 'h2', text: "Owner's isometric drawings (SW-IMP-6)" },
      table(['Drawing', 'Line drawn', 'Work line', 'Sheets', 'Match to the plant model'], wo.importedIsometrics.map(r => [r.drawing, imported.drawings[r.drawing].line, r.line, r.sheets, r.errors + r.warnings ? `${r.errors} error(s), ${r.warnings} warning(s) — see below` : 'agrees with the model'])),
      { k: 'links', links: wo.importedIsometrics.map(r => ({ text: `${r.drawing} (PDF)`, href: `../isometrics-imported/${r.file}` })), after: ' — the generated isometrics follow the ITP.' },
      ...(fs.length ? [table(['Drawing', 'Sheet', 'Level', 'Finding'], fs)] : [])] });
  }
  sec.push({ blocks: [{ k: 'h2', text: 'Assets in the plant model (SW-WO-7)' }, table(['Tag', 'Kind', 'Description', 'Line', 'Location'], wo.assets.map(x => [x.tag, x.kind, x.description, x.line ?? '', plantText(x.at)]))] });
  if (wo.isolations.length) sec.push({ blocks: [{ k: 'h2', text: 'Isolation list (SW-WO-3)' }, table(['#', 'Kind', 'Tag', 'Line', 'Action', 'Location', 'Fitted ✓', 'Removed ✓'], wo.isolations.map(i => [i.seq, i.kind, i.tag, i.line, i.description, i.at ? plantText(i.at) : '', '', '']))] });
  if (wo.parts.length) sec.push({ blocks: [{ k: 'h2', text: 'Parts' }, table(['Description', 'Qty', 'Replaces'], wo.parts.map(p => [p.description, p.qty, p.replaces ?? '']))] });
  if (wo.newWelds.length) sec.push({ blocks: [{ k: 'h2', text: 'New welds (SW-WO-4)' }, table(['Weld', 'Replaces', ...(imported ? ['On drawing'] : []), 'Line', 'Size', 'Wall', 'Shop/field', 'Spec', 'NDE', 'Location', 'Welder', 'Date'], wo.newWelds.map(w => [w.id, w.replaces, ...(imported ? [w.drawingRef ?? '—'] : []), w.line, `${w.NPS}" ${w.cls}`, w.wall ? `${w.wall} in` : '—', w.shopField, w.ws, w.nde.join(' + '), plantText(w.at), '', '']))] });
  for (const id of wo.weldSpecs) {
    const x = WELD_SPECS[id];
    sec.push({ blocks: [{ k: 'h2', text: `Welding specification ${id} — ${x.title}` }, { k: 'demo', text: DEMO_NOTICE },
      { k: 'kv', rows: [['Scope', x.scope], ['Joint', x.joint], ['Process', x.process], ['Filler', x.filler], ['Preheat', x.preheat], ['Interpass', x.interpass], ['Post-weld heat treatment', x.pwht], ['Rules', x.rules.join(', ')]].map(([a, b]) => [[a, b]] as [string, string][]) }] });
  }
  if (wo.nde.length) sec.push({ blocks: [{ k: 'h2', text: 'NDE' }, table(['Method', 'Extent', 'Welds', 'Basis'], wo.nde.map(n => [n.method, n.extent, n.welds.join(', '), n.basis]))] });
  if (wo.inspections.length) sec.push({ blocks: [{ k: 'h2', text: 'Inspections' }, table(['Id', 'Inspection', 'Criteria', 'Basis'], wo.inspections.map(i => [i.id, i.description, i.criteria, i.basis]))] });
  if (wo.tmls.length) sec.push({ blocks: [{ k: 'h2', text: 'Thickness monitoring locations (SW-WO-6)' }, table(['TML', 'Item', 'Location', 'Position', 'Nominal wall', 'R1', 'R2', 'R3', 'R4'], wo.tmls.map(t => [t.id, t.item, t.description, plantText(t.at), t.nominalWall ? `${t.nominalWall} in` : '', ...t.readings.map(r => `${r}: ____`), ...Array(Math.max(0, 4 - t.readings.length)).fill('')]))] });
  if (wo.bolting.length) sec.push({ blocks: [{ k: 'h2', text: 'Bolt-up (SW-WO-5)' }, table(['Joint', 'Studs', 'Preload per stud (lbf)', 'Passes', 'Done ✓'], wo.bolting.map(b => [b.joint, b.studs, Math.round(b.preloadPerStud).toLocaleString('en-US'), b.passes, '']))] });
  if (wo.test) sec.push({ blocks: [{ k: 'h2', text: `Test — ${wo.test.kind}` }, { k: 'kv', rows: [[['Description', wo.test.description]], ...(wo.test.pressure ? [[['Pressure', `${Math.round(wo.test.pressure)} psi`]] as [string, string][]] : []), ...(wo.test.hold ? [[['Hold', wo.test.hold]] as [string, string][]] : []), [['Basis', wo.test.basis]]] }] });
  sec.push({ cls: 'itp', blocks: [{ k: 'h2', text: 'Inspection and test plan (SW-ITP-1..3)' }, { k: 'p', small: true, text: 'H hold · W witness · R review · S surveillance. Status: accepted / rejected / not applicable.' },
    table(['#', 'Activity', 'Reference', 'Acceptance', 'Record', 'Contr.', 'Owner', '3rd party', 'Status', 'Signed (contr. / owner / 3rd)', 'Date', 'Remark'], wo.itp.map(a => [a.step, a.activity, a.reference, a.acceptance, a.record, a.contractor, a.owner, a.thirdParty, '', '', '', '']))] });
  for (const [ln, svg] of isos) sec.push({ cls: 'iso', blocks: [{ k: 'h2', text: `Isometric ISO-${ln}` }, { k: 'svg', svg }] });
  return sec;
}

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
function blockHtml(b: Block): string {
  switch (b.k) {
    case 'demo': return `<div class="demo">${esc(b.text)}</div>`;
    case 'h1': return `<h1>${esc(b.text)}</h1>`;
    case 'h2': return `<h2>${esc(b.text)}</h2>`;
    case 'p': return `<p${b.small ? ' class="small"' : ''}>${esc(b.text)}</p>`;
    case 'links': return `<p class="small">${b.links.map(l => `<a href="${esc(l.href)}">${esc(l.text)}</a>`).join(' · ')}${esc(b.after)}</p>`;
    case 'ol': return `<ol>${b.items.map(x => `<li>${esc(x)}</li>`).join('')}</ol>`;
    case 'kv': return `<table class="kv">${b.rows.map(r => `<tr>${r.map(([k, v]) => `<td>${esc(k)}</td><td${r.length === 1 && b.rows.some(x => x.length === 2) ? ' colspan="3"' : ''}>${b.strong?.some(t => v.startsWith(t)) ? `<b>${esc(b.strong.find(t => v.startsWith(t)))}</b>${esc(v.slice(b.strong.find(t => v.startsWith(t))!.length))}` : esc(v)}</td>`).join('')}</tr>`).join('')}</table>`;
    case 'table': return `<table><thead><tr>${b.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    case 'svg': return b.svg;
  }
}

export function woHtml(wo: WorkOrder, isos: Map<string, string>, imported?: ImportedIndex): string {
  const sec = woSections(wo, isos, imported).map(x => `<section${x.cls ? ` class="${x.cls}"` : ''}>${x.blocks.map(blockHtml).join('')}</section>`);
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(wo.number)} — ${esc(wo.title)}</title><style>
  @page { size: 17in 11in; margin: 0.4in; } body { font: 11px/1.35 system-ui, sans-serif; color: #1b1f24; }
  h1 { font-size: 20px; margin: 6px 0 10px; } h2 { font-size: 14px; margin: 14px 0 6px; border-bottom: 1px solid #1b1f24; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 8px; } th, td { border: 1px solid #9aa3ad; padding: 3px 5px; text-align: left; vertical-align: top; }
  th { background: #eef2f7; } table.kv td:nth-child(odd) { background: #f6f8fa; font-weight: 600; width: 14%; }
  .demo { color: #d0021b; font-weight: 700; border: 2px solid #d0021b; padding: 4px 8px; margin: 4px 0; } .small { color: #555; font-size: 10px; }
  section { page-break-inside: auto; } section.iso, section.itp { page-break-before: always; } section.iso svg { width: 100%; height: auto; }
  </style></head><body>${sec.join('\n')}</body></html>`;
}
