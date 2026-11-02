/**
 * Page previews (DESIGN_BASIS.md §56, SW-REN-2): a page written by SmartWeld's PDF writer, drawn from the same
 * records that wrote it — glyphs filled from the embedded font's outlines, paths filled and stroked.
 */
import { Raster } from './raster';
import { glyphOutline, type Font } from '../pdf/ttf';
import type { Page } from '../pdf/pdf';

export function pagePng(font: Font, page: Page, W: number, H: number, dpi = 100): Uint8Array {
  const k = dpi / 72, R = new Raster(Math.round(W * k), Math.round(H * k), 3);
  const cache = new Map<number, [number, number][][]>();
  for (const r of page.recs) {
    if (r.k === 'path') {
      const pts = r.pts.map(([x, y]) => [x * k, y * k] as [number, number]);
      if (r.fill && r.closed) R.fill([pts], r.fill);
      if (r.stroke) R.stroke(pts, r.width * k, r.stroke, r.closed, r.dash?.map(d => d * k));
    } else {
      let x = r.x; const sc = r.size / font.unitsPerEm;
      for (const g of r.gids) {
        if (!cache.has(g)) cache.set(g, glyphOutline(font, g));
        const cts = cache.get(g)!.map(ct => ct.map(([gx, gy]) => [(x + gx * sc) * k, (r.y - gy * sc) * k] as [number, number]));
        if (cts.length) { R.fill(cts, r.color); if (r.bold) for (const ct of cts) R.stroke(ct, 0.04 * r.size * k, r.color, true); }
        x += font.advance[g] * sc;
      }
    }
  }
  return R.png();
}
