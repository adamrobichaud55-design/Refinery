/**
 * Contact sheets of review images (DESIGN_BASIS.md §56, SW-REN-3): SmartWeld's own renders tiled and labelled with
 * the embedded DejaVu Sans outlines (SW-LIC-3). Reads only PNGs written by SmartWeld's renderer (8-bit RGB, no filter).
 */
import { inflateSync } from 'node:zlib';
import { Raster, type RGB } from './raster';
import { glyphOutline, type Font } from '../pdf/ttf';

export function readOwnPng(b: Uint8Array): { w: number; h: number; rgb: Uint8Array } {
  const B = Buffer.from(b); let p = 8, w = 0, h = 0; const idat: Buffer[] = [];
  while (p < B.length) {
    const len = B.readUInt32BE(p), type = B.toString('latin1', p + 4, p + 8), data = B.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); if (data[8] !== 8 || data[9] !== 2) throw new Error('not a SmartWeld render (8-bit RGB expected)'); }
    if (type === 'IDAT') idat.push(data);
    p += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat)), rgb = new Uint8Array(w * h * 3);
  for (let y = 0; y < h; y++) { if (raw[y * (3 * w + 1)] !== 0) throw new Error('not a SmartWeld render (filter 0 expected)'); rgb.set(raw.subarray(y * (3 * w + 1) + 1, (y + 1) * (3 * w + 1)), 3 * w * y); }
  return { w, h, rgb };
}

/** text drawn from the font's glyph outlines, baseline at (x, y) in output pixels */
export function drawText(R: Raster, font: Font, x: number, y: number, str: string, size: number, color: RGB) {
  const k = size / font.unitsPerEm;
  for (const ch of str) {
    const g = font.gid.get(ch.codePointAt(0)!) ?? 0, cts = glyphOutline(font, g).map(ct => ct.map(([gx, gy]) => [x + gx * k, y - gy * k] as [number, number]));
    if (cts.length) R.fill(cts, color);
    x += font.advance[g] * k;
  }
}

export function contactSheet(font: Font, tiles: { label: string; png: Uint8Array }[], cols = 4, tw = 400, th = 300): Uint8Array {
  const rows = Math.ceil(tiles.length / cols), R = new Raster(cols * tw, rows * th, 1, [223, 230, 238]);
  tiles.forEach((t, i) => {
    const im = readOwnPng(t.png), s = Math.min(tw / im.w, (th - 22) / im.h), ow = Math.floor(im.w * s), oh = Math.floor(im.h * s);
    const x0 = (i % cols) * tw + Math.floor((tw - ow) / 2), y0 = Math.floor(i / cols) * th + 22 + Math.floor((th - 22 - oh) / 2);
    for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {      // box filter down to the tile
      const sx0 = Math.floor(x / s), sx1 = Math.max(sx0 + 1, Math.floor((x + 1) / s)), sy0 = Math.floor(y / s), sy1 = Math.max(sy0 + 1, Math.floor((y + 1) / s));
      const c = [0, 0, 0]; let n = 0;
      for (let yy = sy0; yy < Math.min(sy1, im.h); yy++) for (let xx = sx0; xx < Math.min(sx1, im.w); xx++) { for (let k = 0; k < 3; k++) c[k] += im.rgb[3 * (yy * im.w + xx) + k]; n++; }
      R.px.set(c.map(v => v / n), 3 * ((y0 + y) * R.W + x0 + x));
    }
    const lx = (i % cols) * tw, ly = Math.floor(i / cols) * th;
    R.fill([[[lx, ly], [lx + tw, ly], [lx + tw, ly + 20], [lx, ly + 20]]], [255, 255, 255]);
    drawText(R, font, lx + 6, ly + 15, t.label, 13, [27, 31, 36]);
  });
  return R.png();
}
