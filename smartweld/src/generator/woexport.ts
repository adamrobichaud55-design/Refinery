/** Stage-7 export files (deterministic): per-line isometrics and the work orders with their HTML packs. */
import type { PipingModel } from './piping';
import type { GroundTruth, GTEquipment } from './groundtruth';
import { buildWorkOrders } from './workorders';
import { woHtml, woSections } from './wopack';
import { packPdf } from '../pdf/wopdf';
import type { Font } from '../pdf/ttf';
import { DEMO_NOTICE } from './workorders';
import { importedFor, weldRef, type ImportedIndex, type ImportedRef } from './imported';

const r4 = (_k: string, v: unknown) => (typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v);
/** SW-IMP-6: each work order lists the owner's imported drawings of its lines, and each new weld where the weld it replaces is on them */
export function linkImported(wos: ReturnType<typeof buildWorkOrders>, idx: ImportedIndex) {
  for (const w of wos) {
    const refs = new Map<string, ImportedRef>();
    for (const ln of w.lines) { const r = importedFor(idx, ln); if (r && !refs.has(r.drawing)) refs.set(r.drawing, r); }
    w.importedIsometrics = [...refs.values()];
    w.isometrics = w.importedIsometrics.map(r => r.drawing);   // the owner's drawings are the isometrics (SW-IMP-8)
    for (const n of w.newWelds) { const r = weldRef(idx, n.replaces); if (r) n.drawingRef = r; }
  }
}
export function workOrderFiles(m: PipingModel, gt: GroundTruth, eq: GTEquipment[], imported?: ImportedIndex): Map<string, string> {
  const f = new Map<string, string>();
  const wos = buildWorkOrders(m, gt, eq);
  if (imported) linkImported(wos, imported);
  f.set('workorders/index.json', JSON.stringify({ notice: wos[0]?.notice, workOrders: wos.map(w => ({ number: w.number, title: w.title, area: w.area, areaName: w.areaName, type: w.type, typeName: w.typeName, priority: w.priority, equipment: w.equipment ?? null, primaryAsset: { tag: w.primaryAsset.tag, kind: w.primaryAsset.kind, description: w.primaryAsset.description }, assets: w.assets.length, lines: w.lines, importedIsometrics: (w.importedIsometrics ?? []).map(r => r.drawing), items: w.items.length, newWelds: w.newWelds.length, itp: w.itp.length, holdPoints: w.itp.filter(a => [a.contractor, a.owner, a.thirdParty].includes('H')).length, file: `${w.number}.json`, pack: `${w.number}.html`, pdf: `pdf/${w.number}.pdf` })) }, r4, 1));
  for (const w of wos) {
    f.set(`workorders/${w.number}.json`, JSON.stringify(w, r4, 1));
    f.set(`workorders/${w.number}.html`, woHtml(w, imported));
  }
  return f;
}

/** each work order's pack as a PDF, written by SmartWeld's own PDF writer (SW-PDF-1..6; SW-LIC-2), with the owner's
 *  drawing sheets attached unchanged (SW-IMP-8); attachment(file) gives the bytes of a drawing's PDF */
export function workOrderPdfs(m: PipingModel, gt: GroundTruth, eq: GTEquipment[], font: Font, fontNotice: string, imported: ImportedIndex, attachment: (file: string) => Uint8Array): Map<string, Uint8Array> {
  const f = new Map<string, Uint8Array>();
  const wos = buildWorkOrders(m, gt, eq);
  linkImported(wos, imported);
  for (const w of wos) f.set(`workorders/pdf/${w.number}.pdf`, packPdf(font, `${w.number} — ${w.title}`, woSections(w, imported), { demo: DEMO_NOTICE, font: fontNotice }, attachment));
  return f;
}
