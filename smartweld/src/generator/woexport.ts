/** Stage-7 export files (deterministic): per-line isometrics and the work orders with their HTML packs. */
import type { PipingModel } from './piping';
import { lineFileName, type GroundTruth, type GTEquipment } from './groundtruth';
import { buildWorkOrders } from './workorders';
import { makeIsometric } from './isometric';
import { woHtml, woIsometrics } from './wopack';
import { importedFor, weldRef, type ImportedIndex, type ImportedRef } from './imported';

const r4 = (_k: string, v: unknown) => (typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v);
export const isoFileName = (line: string) => `ISO-${lineFileName(line).replace(/\.json$/, '.svg')}`;
/** SW-IMP-6: each work order lists the owner's imported drawings of its lines, and each new weld where the weld it replaces is on them */
export function linkImported(wos: ReturnType<typeof buildWorkOrders>, idx: ImportedIndex) {
  for (const w of wos) {
    const refs = new Map<string, ImportedRef>();
    for (const ln of w.lines) { const r = importedFor(idx, ln); if (r && !refs.has(r.drawing)) refs.set(r.drawing, r); }
    w.importedIsometrics = [...refs.values()];
    for (const n of w.newWelds) { const r = weldRef(idx, n.replaces); if (r) n.drawingRef = r; }
  }
}
export function workOrderFiles(m: PipingModel, gt: GroundTruth, eq: GTEquipment[], imported?: ImportedIndex): Map<string, string> {
  const f = new Map<string, string>(), lineGT = new Map(gt.lines.map(l => [l.header.line, l] as const));
  for (const l of gt.lines) f.set(`isometrics/${isoFileName(l.header.line)}`, makeIsometric(l));
  const wos = buildWorkOrders(m, gt, eq);
  if (imported) linkImported(wos, imported);
  f.set('workorders/index.json', JSON.stringify({ notice: wos[0]?.notice, workOrders: wos.map(w => ({ number: w.number, title: w.title, area: w.area, areaName: w.areaName, type: w.type, typeName: w.typeName, priority: w.priority, equipment: w.equipment ?? null, primaryAsset: { tag: w.primaryAsset.tag, kind: w.primaryAsset.kind, description: w.primaryAsset.description }, assets: w.assets.length, lines: w.lines, importedIsometrics: (w.importedIsometrics ?? []).map(r => r.drawing), items: w.items.length, newWelds: w.newWelds.length, itp: w.itp.length, holdPoints: w.itp.filter(a => [a.contractor, a.owner, a.thirdParty].includes('H')).length, file: `${w.number}.json`, pack: `${w.number}.html`, pdf: `pdf/${w.number}.pdf` })) }, r4, 1));
  for (const w of wos) {
    f.set(`workorders/${w.number}.json`, JSON.stringify(w, r4, 1));
    f.set(`workorders/${w.number}.html`, woHtml(w, woIsometrics(w, lineGT), imported));
  }
  return f;
}
