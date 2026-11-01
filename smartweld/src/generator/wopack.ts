/**
 * Work-order packs (stage 7): the printable HTML of a work order — cover and scope, isolation list, parts, new welds,
 * welding specifications, NDE, inspections and TMLs, test, bolting, the ITP with sign-off columns (SW-ITP-1..3), and
 * the attached isometrics (SW-ISO-2). Printed to PDF by tools/wo-pdf.mjs.
 */
import { plantText, type GTLine } from './groundtruth';
import { makeIsometric } from './isometric';
import { WELD_SPECS, DEMO_NOTICE, type WorkOrder } from './workorders';

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const table = (head: string[], rows: unknown[][]) => `<table><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

/** the work order's isometrics: the work line(s) clouded with the affected items, other attached lines with isolations clouded */
export function woIsometrics(wo: WorkOrder, lineGT: Map<string, GTLine>): Map<string, string> {
  const out = new Map<string, string>(), affected = new Set([...wo.items, ...wo.isolations.map(i => i.tag)]);
  for (const ln of wo.lines) {
    const L = lineGT.get(ln); if (!L) continue;
    out.set(ln, makeIsometric(L, { cloud: affected, wo: wo.number, title: wo.title, newWelds: wo.newWelds.filter(w => w.line === ln && w.ws !== 'WS-03').map(w => ({ id: w.id, replaces: w.replaces })) }));
  }
  return out;
}

export function woHtml(wo: WorkOrder, isos: Map<string, string>): string {
  const sec: string[] = [];
  sec.push(`<section class="cover"><div class="demo">${esc(DEMO_NOTICE)}</div>
    <h1>${esc(wo.number)} — ${esc(wo.title)}</h1>
    <table class="kv"><tr><td>Area</td><td>${esc(wo.area)} ${esc(wo.areaName)}</td><td>Task</td><td>${esc(wo.type)} ${esc(wo.typeName)}</td></tr>
    <tr><td>Priority</td><td>${wo.priority} (${['', 'safety', 'integrity', 'reliability'][wo.priority]})</td><td>Issued by</td><td>${esc(wo.issuedBy)}</td></tr>
    <tr><td>Primary asset</td><td colspan="3"><b>${esc(wo.primaryAsset.tag)}</b> — ${esc(wo.primaryAsset.description)} — ${esc(plantText(wo.primaryAsset.at))}</td></tr>
    <tr><td>Equipment</td><td>${esc(wo.equipment ?? '—')}</td><td>Lines</td><td>${esc(wo.lines.join(', '))}</td></tr>
    <tr><td>Isometrics</td><td colspan="3">${esc(wo.isometrics.join(', '))}</td></tr>
    <tr><td>Permits</td><td colspan="3">${esc(wo.permits.join(', '))}</td></tr></table>
    <h2>Reason</h2><p>${esc(wo.reason)}</p><h2>Scope of work</h2><ol>${wo.scope.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    <p class="small">Affected items: ${esc(wo.items.join(', '))}</p><p class="small">Rules: ${esc(wo.rules.join(', '))}</p></section>`);
  sec.push(`<section><h2>Assets in the plant model (SW-WO-7)</h2>${table(['Tag', 'Kind', 'Description', 'Line', 'Location'], wo.assets.map(x => [x.tag, x.kind, x.description, x.line ?? '', plantText(x.at)]))}</section>`);
  if (wo.isolations.length) sec.push(`<section><h2>Isolation list (SW-WO-3)</h2>${table(['#', 'Kind', 'Tag', 'Line', 'Action', 'Location', 'Fitted ✓', 'Removed ✓'], wo.isolations.map(i => [i.seq, i.kind, i.tag, i.line, i.description, i.at ? plantText(i.at) : '', '', '']))}</section>`);
  if (wo.parts.length) sec.push(`<section><h2>Parts</h2>${table(['Description', 'Qty', 'Replaces'], wo.parts.map(p => [p.description, p.qty, p.replaces ?? '']))}</section>`);
  if (wo.newWelds.length) sec.push(`<section><h2>New welds (SW-WO-4)</h2>${table(['Weld', 'Replaces', 'Line', 'Size', 'Wall', 'Shop/field', 'Spec', 'NDE', 'Location', 'Welder', 'Date'], wo.newWelds.map(w => [w.id, w.replaces, w.line, `${w.NPS}" ${w.cls}`, w.wall ? `${w.wall} in` : '—', w.shopField, w.ws, w.nde.join(' + '), plantText(w.at), '', '']))}</section>`);
  for (const id of wo.weldSpecs) { const s = WELD_SPECS[id]; sec.push(`<section><h2>Welding specification ${esc(id)} — ${esc(s.title)}</h2><div class="demo">${esc(DEMO_NOTICE)}</div><table class="kv">${[['Scope', s.scope], ['Joint', s.joint], ['Process', s.process], ['Filler', s.filler], ['Preheat', s.preheat], ['Interpass', s.interpass], ['Post-weld heat treatment', s.pwht], ['Rules', s.rules.join(', ')]].map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table></section>`); }
  if (wo.nde.length) sec.push(`<section><h2>NDE</h2>${table(['Method', 'Extent', 'Welds', 'Basis'], wo.nde.map(n => [n.method, n.extent, n.welds.join(', '), n.basis]))}</section>`);
  if (wo.inspections.length) sec.push(`<section><h2>Inspections</h2>${table(['Id', 'Inspection', 'Criteria', 'Basis'], wo.inspections.map(i => [i.id, i.description, i.criteria, i.basis]))}</section>`);
  if (wo.tmls.length) sec.push(`<section><h2>Thickness monitoring locations (SW-WO-6)</h2>${table(['TML', 'Item', 'Location', 'Position', 'Nominal wall', ...['R1', 'R2', 'R3', 'R4']], wo.tmls.map(t => [t.id, t.item, t.description, plantText(t.at), t.nominalWall ? `${t.nominalWall} in` : '', ...t.readings.map(r => `${r}: ____`), ...Array(Math.max(0, 4 - t.readings.length)).fill('')]))}</section>`);
  if (wo.bolting.length) sec.push(`<section><h2>Bolt-up (SW-WO-5)</h2>${table(['Joint', 'Studs', 'Preload per stud (lbf)', 'Passes', 'Done ✓'], wo.bolting.map(b => [b.joint, b.studs, Math.round(b.preloadPerStud).toLocaleString('en-US'), b.passes, '']))}</section>`);
  if (wo.test) sec.push(`<section><h2>Test — ${esc(wo.test.kind)}</h2><table class="kv"><tr><td>Description</td><td>${esc(wo.test.description)}</td></tr>${wo.test.pressure ? `<tr><td>Pressure</td><td>${Math.round(wo.test.pressure)} psi</td></tr>` : ''}${wo.test.hold ? `<tr><td>Hold</td><td>${esc(wo.test.hold)}</td></tr>` : ''}<tr><td>Basis</td><td>${esc(wo.test.basis)}</td></tr></table></section>`);
  sec.push(`<section class="itp"><h2>Inspection and test plan (SW-ITP-1..3)</h2><p class="small">H hold · W witness · R review · S surveillance. Status: accepted / rejected / not applicable.</p>${table(['#', 'Activity', 'Reference', 'Acceptance', 'Record', 'Contr.', 'Owner', '3rd party', 'Status', 'Signed (contr. / owner / 3rd)', 'Date', 'Remark'], wo.itp.map(a => [a.step, a.activity, a.reference, a.acceptance, a.record, a.contractor, a.owner, a.thirdParty, '', '', '', '']))}</section>`);
  for (const [ln, svg] of isos) sec.push(`<section class="iso"><h2>Isometric ISO-${esc(ln)}</h2>${svg}</section>`);
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(wo.number)} — ${esc(wo.title)}</title><style>
  @page { size: 17in 11in; margin: 0.4in; } body { font: 11px/1.35 system-ui, sans-serif; color: #1b1f24; }
  h1 { font-size: 20px; margin: 6px 0 10px; } h2 { font-size: 14px; margin: 14px 0 6px; border-bottom: 1px solid #1b1f24; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 8px; } th, td { border: 1px solid #9aa3ad; padding: 3px 5px; text-align: left; vertical-align: top; }
  th { background: #eef2f7; } table.kv td:nth-child(odd) { background: #f6f8fa; font-weight: 600; width: 14%; }
  .demo { color: #d0021b; font-weight: 700; border: 2px solid #d0021b; padding: 4px 8px; margin: 4px 0; } .small { color: #555; font-size: 10px; }
  section { page-break-inside: auto; } section.iso, section.itp { page-break-before: always; } section.iso svg { width: 100%; height: auto; }
  </style></head><body>${sec.join('\n')}</body></html>`;
}
