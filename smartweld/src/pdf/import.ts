/**
 * Attached documents (DESIGN_BASIS.md §55, SW-PDF-6): reads a PDF with a classic cross-reference table and gives its
 * pages as object graphs, so SmartWeld's PDF writer can copy them unchanged (only object numbers renumbered).
 * Streams keep their dictionaries and their bytes exactly; nothing is decoded or redrawn.
 */
export type PVal = number | boolean | null | { t: 'name'; v: string } | { t: 'str'; b: Uint8Array } | { t: 'ref'; n: number; g: number }
  | PVal[] | { t: 'dict'; v: Map<string, PVal> } | { t: 'stream'; dict: Map<string, PVal>; data: Uint8Array };

const WS = new Set([0, 9, 10, 12, 13, 32]), DELIM = new Set('()<>[]{}/%'.split('').map(c => c.charCodeAt(0)));

export class PdfSource {
  private offsets = new Map<number, number>(); private cache = new Map<number, PVal>();
  constructor(readonly b: Uint8Array, readonly name: string) {
    const tail = Buffer.from(b.subarray(Math.max(0, b.length - 1024))).toString('latin1');
    const sx = /startxref\s+(\d+)/.exec(tail); if (!sx) throw new Error(`${name}: no startxref`);
    let p = Number(sx[1]);
    if (Buffer.from(b.subarray(p, p + 4)).toString('latin1') !== 'xref') throw new Error(`${name}: not a classic cross-reference table (SW-PDF-6)`);
    p += 4;
    const text = Buffer.from(b.subarray(p)).toString('latin1'); let i = 0;
    const next = () => { while (/\s/.test(text[i])) i++; const s = i; while (i < text.length && !/\s/.test(text[i])) i++; return text.slice(s, i); };
    for (;;) {
      const a = next(); if (a === 'trailer') break;
      const first = Number(a), count = Number(next());
      for (let k = 0; k < count; k++) { const off = Number(next()); next(); const f = next(); if (f === 'n' && !this.offsets.has(first + k)) this.offsets.set(first + k, off); }
    }
    this.trailerPos = p + i;
  }
  private trailerPos: number;
  trailer(): Map<string, PVal> { const r = new Reader(this.b, this.trailerPos); const v = r.value(); if (!isDict(v)) throw new Error('bad trailer'); return v.v; }
  obj(n: number): PVal {
    if (this.cache.has(n)) return this.cache.get(n)!;
    const off = this.offsets.get(n); if (off === undefined) return null;
    const r = new Reader(this.b, off); r.value(); r.value(); r.keyword('obj');
    let v = r.value();
    if (isDict(v) && r.peekKeyword('stream')) {
      r.keyword('stream'); if (this.b[r.p] === 13) r.p++; if (this.b[r.p] === 10) r.p++;
      const L = this.resolve(v.v.get('Length') ?? null); if (typeof L !== 'number') throw new Error(`${this.name}: stream ${n} without a length`);
      v = { t: 'stream', dict: v.v, data: this.b.slice(r.p, r.p + L) };
    }
    this.cache.set(n, v); return v;
  }
  resolve(v: PVal): PVal { return isRef(v) ? this.obj(v.n) : v; }
  /** the page dictionaries in order, with inherited attributes (Resources, MediaBox, CropBox, Rotate) filled in */
  pages(): Map<string, PVal>[] {
    const root = this.resolve(this.trailer().get('Root') ?? null); if (!isDict(root)) throw new Error('no catalog');
    const out: Map<string, PVal>[] = [];
    const walk = (node: PVal, inh: Map<string, PVal>) => {
      const d = this.resolve(node); if (!isDict(d)) return;
      const here = new Map(inh); for (const k of ['Resources', 'MediaBox', 'CropBox', 'Rotate']) if (d.v.has(k)) here.set(k, d.v.get(k)!);
      const type = this.resolve(d.v.get('Type') ?? null);
      if (isName(type) && type.v === 'Pages') { const kids = this.resolve(d.v.get('Kids') ?? null); if (Array.isArray(kids)) for (const k of kids) walk(k, here); }
      else { const pg = new Map(d.v); for (const [k, v] of here) if (!pg.has(k)) pg.set(k, v); pg.delete('Parent'); out.push(pg); }
    };
    walk(root.v.get('Pages') ?? null, new Map());
    return out;
  }
}

export const isDict = (v: PVal): v is { t: 'dict'; v: Map<string, PVal> } => !!v && typeof v === 'object' && !Array.isArray(v) && (v as { t: string }).t === 'dict';
export const isRef = (v: PVal): v is { t: 'ref'; n: number; g: number } => !!v && typeof v === 'object' && !Array.isArray(v) && (v as { t: string }).t === 'ref';
const isName = (v: PVal): v is { t: 'name'; v: string } => !!v && typeof v === 'object' && !Array.isArray(v) && (v as { t: string }).t === 'name';

class Reader {
  constructor(readonly b: Uint8Array, public p: number) {}
  skip() { for (;;) { while (this.p < this.b.length && WS.has(this.b[this.p])) this.p++; if (this.b[this.p] === 37) { while (this.p < this.b.length && this.b[this.p] !== 10 && this.b[this.p] !== 13) this.p++; continue; } break; } }
  token(): string { this.skip(); const s = this.p; while (this.p < this.b.length && !WS.has(this.b[this.p]) && !DELIM.has(this.b[this.p])) this.p++; return Buffer.from(this.b.subarray(s, this.p)).toString('latin1'); }
  keyword(k: string) { const t = this.token(); if (t !== k) throw new Error(`expected ${k}, found ${t}`); }
  peekKeyword(k: string) { const save = this.p; const t = this.token(); this.p = save; return t === k; }
  value(): PVal {
    this.skip(); const c = this.b[this.p];
    if (c === 60 && this.b[this.p + 1] === 60) {   // dictionary
      this.p += 2; const m = new Map<string, PVal>();
      for (;;) { this.skip(); if (this.b[this.p] === 62 && this.b[this.p + 1] === 62) { this.p += 2; return { t: 'dict', v: m }; } const k = this.value(); if (!isName(k)) throw new Error('dictionary key is not a name'); m.set(k.v, this.value()); }
    }
    if (c === 91) { this.p++; const a: PVal[] = []; for (;;) { this.skip(); if (this.b[this.p] === 93) { this.p++; return a; } a.push(this.value()); } }
    if (c === 47) { this.p++; const s = this.p; while (this.p < this.b.length && !WS.has(this.b[this.p]) && !DELIM.has(this.b[this.p])) this.p++; return { t: 'name', v: Buffer.from(this.b.subarray(s, this.p)).toString('latin1').replace(/#([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))) }; }
    if (c === 40) {   // literal string, kept as raw bytes after escapes
      this.p++; let depth = 1; const out: number[] = [];
      while (depth) {
        const x = this.b[this.p++];
        if (x === 92) { const y = this.b[this.p++]; const map: Record<number, number> = { 110: 10, 114: 13, 116: 9, 98: 8, 102: 12, 40: 40, 41: 41, 92: 92 };
          if (y in map) out.push(map[y]); else if (y >= 48 && y <= 55) { let o = y - 48; for (let k = 0; k < 2 && this.b[this.p] >= 48 && this.b[this.p] <= 55; k++) o = o * 8 + this.b[this.p++] - 48; out.push(o & 255); } else if (y === 13) { if (this.b[this.p] === 10) this.p++; } else if (y !== 10) out.push(y); }
        else { if (x === 40) depth++; if (x === 41 && --depth === 0) break; out.push(x); }
      }
      return { t: 'str', b: new Uint8Array(out) };
    }
    if (c === 60) { this.p++; const s = this.p; while (this.b[this.p] !== 62) this.p++; const h = Buffer.from(this.b.subarray(s, this.p)).toString('latin1').replace(/\s/g, ''); this.p++; return { t: 'str', b: new Uint8Array(Buffer.from(h.length % 2 ? h + '0' : h, 'hex')) }; }
    const t = this.token();
    if (t === 'true') return true; if (t === 'false') return false; if (t === 'null') return null;
    const n = Number(t); if (t === '' || isNaN(n)) throw new Error(`unexpected token '${t}'`);
    if (Number.isInteger(n)) {   // an object reference "n g R"?
      const save = this.p, g = this.token(), r = this.token();
      if (/^\d+$/.test(g) && r === 'R') return { t: 'ref', n, g: Number(g) };
      this.p = save;
    }
    return n;
  }
}

/** a value written back as PDF syntax; references renumbered by ref() */
export function writeVal(v: PVal, ref: (n: number) => number): string {
  if (v === null) return 'null'; if (typeof v === 'boolean') return String(v); if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(+v.toFixed(6));
  if (Array.isArray(v)) return `[${v.map(x => writeVal(x, ref)).join(' ')}]`;
  switch (v.t) {
    case 'name': return '/' + v.v.replace(/[^!-~]|[#()<>[\]{}/%]/g, c => '#' + c.charCodeAt(0).toString(16).padStart(2, '0'));
    case 'str': return `<${Buffer.from(v.b).toString('hex')}>`;
    case 'ref': return `${ref(v.n)} 0 R`;
    case 'dict': return `<< ${[...v.v].map(([k, x]) => `${writeVal({ t: 'name', v: k }, ref)} ${writeVal(x, ref)}`).join(' ')} >>`;
    case 'stream': throw new Error('a stream cannot be written inline');
  }
}
