/**
 * Units and precision helpers. Internal unit is the inch (SW-U-1).
 * Rounding rules: SW-U-3.
 */

/** Parse a drawing-style number: "0.25", "1/4", "3-1/2", "3 1/2". Returns inches (or whatever unit the field is). */
export function parseDrawingNumber(text: string): number {
  const s = text.trim();
  const mixed = /^(\d+)[-\s](\d+)\/(\d+)$/.exec(s);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = /^(\d+)\/(\d+)$/.exec(s);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const dec = /^\d*\.?\d+$/.exec(s);
  if (dec) return Number(s);
  throw new Error(`Cannot parse number "${text}"`);
}

/** Round to the nearest multiple of `step`. */
export function roundTo(x: number, step: number): number {
  return Math.round(x / step) * step;
}
/** Round up to the next multiple of `step` (with a small tolerance so exact multiples stay put). */
export function roundUpTo(x: number, step: number): number {
  return Math.ceil(x / step - 1e-9) * step;
}
/** Round down to the previous multiple of `step`. */
export function roundDownTo(x: number, step: number): number {
  return Math.floor(x / step + 1e-9) * step;
}

/** SW-U-3: thicknesses to 0.005 in. */
export const roundThickness = (t: number) => roundTo(t, 0.005);
/** SW-U-3: widths, depths, radii to 0.01 in. */
export const roundWidth = (w: number) => roundTo(w, 0.01);

/** Format inches as a drawing fraction to 1/16 ("3-1/2", "1/4", "12"). */
export function formatFraction(inches: number, denom = 16): string {
  const sign = inches < 0 ? '-' : '';
  const v = Math.abs(inches);
  let whole = Math.floor(v);
  let num = Math.round((v - whole) * denom);
  if (num === denom) { whole += 1; num = 0; }
  let d = denom;
  while (num > 0 && num % 2 === 0) { num /= 2; d /= 2; }
  if (num === 0) return `${sign}${whole}`;
  if (whole === 0) return `${sign}${num}/${d}`;
  return `${sign}${whole}-${num}/${d}`;
}

/** SW-U-2: display a length. Over 24 in as feet-inches; else inches. Thin dimensions as decimals. */
export function formatLength(inches: number): string {
  if (inches >= 24) {
    const ft = Math.floor(inches / 12);
    const rem = inches - ft * 12;
    return rem < 1 / 32 ? `${ft}'-0"` : `${ft}'-${formatFraction(rem)}"`;
  }
  if (inches < 2) return `${inches.toFixed(3)}"`;
  return `${formatFraction(inches)}"`;
}
