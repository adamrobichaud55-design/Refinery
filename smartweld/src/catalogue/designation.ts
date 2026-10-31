/**
 * Designation grammar, DESIGN_BASIS.md section 3.
 * A designation is what the drawing states; its numbers carry basis `drawing`.
 */
import { parseDrawingNumber, formatFraction } from '../core/units';

export type Designation =
  | { kind: 'W'; D: number; w: number }
  | { kind: 'C'; D: number; w: number }
  | { kind: 'L'; a: number; b: number; t: number }
  | { kind: 'HSS_RECT'; H: number; B: number; t: number }
  | { kind: 'HSS_ROUND'; OD: number; t: number }
  | { kind: 'PL'; t: number; w: number; L?: number }
  | { kind: 'B'; d: number; L: number }
  | { kind: 'AR'; d: number; L: number }
  | { kind: 'FW'; leg: number }
  | { kind: 'GW'; t: number };

const NUM = String.raw`(\d+(?:[-\s]\d+\/\d+|\/\d+|\.\d+)?|\.\d+)`;
const rx = (prefix: string, n: number, lastOptional = false) => {
  const parts = Array.from({ length: n }, () => NUM);
  const body = lastOptional
    ? parts.slice(0, -1).join('x') + `(?:x${NUM})?`
    : parts.join('x');
  return new RegExp(`^${prefix}${body}$`, 'i');
};

export function parseDesignation(input: string): Designation {
  const s = input.replace(/\s+/g, '').replace(/×/g, 'x');
  let m: RegExpExecArray | null;
  if ((m = rx('W', 2).exec(s))) return { kind: 'W', D: n(m[1]), w: n(m[2]) };
  if ((m = rx('C', 2).exec(s))) return { kind: 'C', D: n(m[1]), w: n(m[2]) };
  if ((m = rx('L', 3).exec(s))) return { kind: 'L', a: n(m[1]), b: n(m[2]), t: n(m[3]) };
  if ((m = rx('HSS', 3).exec(s))) return { kind: 'HSS_RECT', H: n(m[1]), B: n(m[2]), t: n(m[3]) };
  if ((m = rx('HSS', 2).exec(s))) return { kind: 'HSS_ROUND', OD: n(m[1]), t: n(m[2]) };
  if ((m = rx('PL', 3, true).exec(s))) return { kind: 'PL', t: n(m[1]), w: n(m[2]), L: m[3] ? n(m[3]) : undefined };
  if ((m = rx('B', 2).exec(s))) return { kind: 'B', d: n(m[1]), L: n(m[2]) };
  if ((m = rx('AR', 2).exec(s))) return { kind: 'AR', d: n(m[1]), L: n(m[2]) };
  if ((m = rx('FW', 1).exec(s))) return { kind: 'FW', leg: n(m[1]) };
  if ((m = rx('GW', 1).exec(s))) return { kind: 'GW', t: n(m[1]) };
  throw new Error(`Unrecognised designation "${input}"`);
}
const n = (s: string) => parseDrawingNumber(s.replace(/-/g, ' '));

/** Canonical drawing text for a designation. Fractions to 1/16 where the value is a clean fraction, else decimals. */
export function formatDesignation(d: Designation): string {
  const f = (v: number) => {
    const r = Math.round(v * 16) / 16;
    return Math.abs(r - v) < 1e-9 ? formatFraction(v) : String(v);
  };
  switch (d.kind) {
    case 'W': return `W${f(d.D)}x${d.w}`;
    case 'C': return `C${f(d.D)}x${d.w}`;
    case 'L': return `L${f(d.a)}x${f(d.b)}x${f(d.t)}`;
    case 'HSS_RECT': return `HSS${f(d.H)}x${f(d.B)}x${f(d.t)}`;
    case 'HSS_ROUND': return `HSS${f(d.OD)}x${f(d.t)}`;
    case 'PL': return d.L !== undefined ? `PL${f(d.t)}x${f(d.w)}x${f(d.L)}` : `PL${f(d.t)}x${f(d.w)}`;
    case 'B': return `B${f(d.d)}x${f(d.L)}`;
    case 'AR': return `AR${f(d.d)}x${f(d.L)}`;
    case 'FW': return `FW${f(d.leg)}`;
    case 'GW': return `GW${f(d.t)}`;
  }
}
