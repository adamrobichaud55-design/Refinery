/**
 * SmartWeld's own rasterizer (DESIGN_BASIS.md §56, SW-REN-1/2): filled polygons (nonzero rule), stroked lines, a depth
 * buffer for triangles, supersampled, and PNG output with Node's built-in zlib. No third-party drawing library.
 */
import { deflateSync } from 'node:zlib';

export type RGB = [number, number, number];

export class Raster {
  readonly W: number; readonly H: number; readonly px: Float32Array; readonly depth: Float32Array;
  /** w × h output pixels, drawn at ss × ss samples each */
  constructor(readonly w: number, readonly h: number, readonly ss = 3, bg: RGB = [255, 255, 255]) {
    this.W = w * ss; this.H = h * ss; this.px = new Float32Array(this.W * this.H * 3); this.depth = new Float32Array(this.W * this.H).fill(Infinity);
    for (let i = 0; i < this.W * this.H; i++) this.px.set(bg, 3 * i);
  }
  /** fill polygons (coordinates in output pixels, y down) by the nonzero winding rule */
  fill(contours: [number, number][][], c: RGB) {
    const s = this.ss, edges: { x0: number; y0: number; x1: number; y1: number; d: number }[] = [];
    let ymin = Infinity, ymax = -Infinity;
    for (const ct of contours) for (let i = 0; i < ct.length; i++) {
      const a = ct[i], b = ct[(i + 1) % ct.length];
      if (a[1] === b[1]) continue;
      const [p, q, d] = a[1] < b[1] ? [a, b, 1] : [b, a, -1];
      edges.push({ x0: p[0] * s, y0: p[1] * s, x1: q[0] * s, y1: q[1] * s, d });
      ymin = Math.min(ymin, p[1] * s); ymax = Math.max(ymax, q[1] * s);
    }
    const y0 = Math.max(0, Math.floor(ymin)), y1 = Math.min(this.H - 1, Math.ceil(ymax));
    for (let y = y0; y <= y1; y++) {
      const yc = y + 0.5, xs: [number, number][] = [];
      for (const e of edges) if (yc >= e.y0 && yc < e.y1) xs.push([e.x0 + (yc - e.y0) * (e.x1 - e.x0) / (e.y1 - e.y0), e.d]);
      if (!xs.length) continue;
      xs.sort((a, b) => a[0] - b[0]);
      let wind = 0;
      for (let i = 0; i < xs.length - 1; i++) {
        wind += xs[i][1];
        if (wind !== 0) { const a = Math.max(0, Math.ceil(xs[i][0] - 0.5)), b = Math.min(this.W - 1, Math.floor(xs[i + 1][0] - 0.5)); for (let x = a; x <= b; x++) this.px.set(c, 3 * (y * this.W + x)); }
      }
    }
  }
  /** a stroked polyline: each segment a quadrilateral, round joins and caps */
  stroke(pts: [number, number][], width: number, c: RGB, closed = false, dash?: number[]) {
    const segs: [[number, number], [number, number]][] = [];
    const all = closed ? [...pts, pts[0]] : pts;
    for (let i = 0; i < all.length - 1; i++) segs.push([all[i], all[i + 1]]);
    const parts = dash && dash.length ? dashSegments(segs, dash) : segs;
    const r = Math.max(width, 0.6 / this.ss) / 2, shapes: [number, number][][] = [];
    for (const [a, b] of parts) {
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); if (L < 1e-9) continue;
      const nx = -dy / L * r, ny = dx / L * r;
      shapes.push([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]]);
      if (r * this.ss > 1) for (const p of [a, b]) shapes.push(Array.from({ length: 10 }, (_, k) => [p[0] + r * Math.cos(k * Math.PI / 5), p[1] + r * Math.sin(k * Math.PI / 5)] as [number, number]));
    }
    for (const sh of shapes) this.fill([sh], c);   // one by one, so overlapping parts never cancel
  }
  /** a triangle with depth (pixel coordinates, depth z smaller = nearer) */
  tri(a: [number, number, number], b: [number, number, number], c: [number, number, number], col: RGB) {
    const s = this.ss, A = [a[0] * s, a[1] * s, a[2]], B = [b[0] * s, b[1] * s, b[2]], C = [c[0] * s, c[1] * s, c[2]];
    const x0 = Math.max(0, Math.floor(Math.min(A[0], B[0], C[0]))), x1 = Math.min(this.W - 1, Math.ceil(Math.max(A[0], B[0], C[0])));
    const y0 = Math.max(0, Math.floor(Math.min(A[1], B[1], C[1]))), y1 = Math.min(this.H - 1, Math.ceil(Math.max(A[1], B[1], C[1])));
    const area = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]); if (Math.abs(area) < 1e-12) return;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5, py = y + 0.5;
      const w0 = ((B[0] - px) * (C[1] - py) - (B[1] - py) * (C[0] - px)) / area, w1 = ((C[0] - px) * (A[1] - py) - (C[1] - py) * (A[0] - px)) / area, w2 = 1 - w0 - w1;
      if (w0 < 0 || w1 < 0 || w2 < 0) continue;
      const z = w0 * A[2] + w1 * B[2] + w2 * C[2], i = y * this.W + x;
      if (z < this.depth[i]) { this.depth[i] = z; this.px.set(col, 3 * i); }
    }
  }
  /** the supersamples averaged to the output size, as PNG bytes */
  png(): Uint8Array {
    const s = this.ss, raw = Buffer.alloc((this.w * 3 + 1) * this.h);
    for (let y = 0; y < this.h; y++) {
      raw[y * (this.w * 3 + 1)] = 0;
      for (let x = 0; x < this.w; x++) for (let ch = 0; ch < 3; ch++) {
        let v = 0; for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) v += this.px[3 * ((y * s + j) * this.W + x * s + i) + ch];
        raw[y * (this.w * 3 + 1) + 1 + 3 * x + ch] = Math.max(0, Math.min(255, Math.round(v / (s * s))));
      }
    }
    return png(this.w, this.h, raw);
  }
}

function dashSegments(segs: [[number, number], [number, number]][], dash: number[]) {
  const out: [[number, number], [number, number]][] = []; let k = 0, left = dash[0], on = true;
  for (const [a, b] of segs) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]); let t = 0;
    while (t < L - 1e-9) {
      const step = Math.min(left, L - t), p = (u: number): [number, number] => [a[0] + (b[0] - a[0]) * u / L, a[1] + (b[1] - a[1]) * u / L];
      if (on) out.push([p(t), p(t + step)]);
      t += step; left -= step;
      if (left <= 1e-9) { k = (k + 1) % dash.length; left = dash[k]; on = !on; }
    }
  }
  return out;
}

const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b: Uint8Array) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function png(w: number, h: number, raw: Buffer): Uint8Array {
  const chunk = (type: string, data: Uint8Array) => { const t = Buffer.concat([Buffer.from(type, 'latin1'), Buffer.from(data)]); const out = Buffer.alloc(12 + data.length); out.writeUInt32BE(data.length, 0); t.copy(out, 4); out.writeUInt32BE(crc32(t), 8 + data.length); return out; };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return new Uint8Array(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', new Uint8Array(0))]));
}
