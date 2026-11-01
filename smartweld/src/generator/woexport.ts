/** Stage-7 export files (deterministic): per-line isometrics and the work orders with their HTML packs. */
import type { PipingModel } from './piping';
import { lineFileName, type GroundTruth, type GTEquipment } from './groundtruth';
import { buildWorkOrders } from './workorders';
import { makeIsometric } from './isometric';
import { woHtml, woIsometrics } from './wopack';

const r4 = (_k: string, v: unknown) => (typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v);
export const isoFileName = (line: string) => `ISO-${lineFileName(line).replace(/\.json$/, '.svg')}`;
export function workOrderFiles(m: PipingModel, gt: GroundTruth, eq: GTEquipment[]): Map<string, string> {
  const f = new Map<string, string>(), lineGT = new Map(gt.lines.map(l => [l.header.line, l] as const));
  for (const l of gt.lines) f.set(`isometrics/${isoFileName(l.header.line)}`, makeIsometric(l));
  const wos = buildWorkOrders(m, gt, eq);
  f.set('workorders/index.json', JSON.stringify({ notice: wos[0]?.notice, workOrders: wos.map(w => ({ number: w.number, title: w.title, area: w.area, areaName: w.areaName, type: w.type, typeName: w.typeName, priority: w.priority, equipment: w.equipment ?? null, primaryAsset: { tag: w.primaryAsset.tag, kind: w.primaryAsset.kind, description: w.primaryAsset.description }, assets: w.assets.length, lines: w.lines, items: w.items.length, newWelds: w.newWelds.length, itp: w.itp.length, holdPoints: w.itp.filter(a => [a.contractor, a.owner, a.thirdParty].includes('H')).length, file: `${w.number}.json`, pack: `${w.number}.html`, pdf: `pdf/${w.number}.pdf` })) }, r4, 1));
  for (const w of wos) {
    f.set(`workorders/${w.number}.json`, JSON.stringify(w, r4, 1));
    f.set(`workorders/${w.number}.html`, woHtml(w, woIsometrics(w, lineGT)));
  }
  return f;
}
