/**
 * Isometric drawings (DESIGN_BASIS.md §51, SW-ISO-1/2), generated from a line's ground truth as SVG.
 * Axes: East to the lower right at 30°, North to the upper right at 30°, elevation up. Not to scale: each straight
 * run is drawn with a length that grows with the square root of its true length, so short fittings stay legible;
 * true lengths are written on the drawing.
 */
import { formatLength } from '../core/units';
import type { GTLine, GTItem, PlantPt } from './groundtruth';
import { DEMO_NOTICE } from './workorders';

const C30 = Math.cos(Math.PI / 6), S30 = 0.5;
type P2 = [number, number];
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const proj = (d: { E: number; N: number; EL: number }): P2 => [(d.E + d.N) * C30, (d.E - d.N) * S30 - d.EL];
const sub3 = (a: PlantPt, b: PlantPt) => ({ E: a.E - b.E, N: a.N - b.N, EL: a.EL - b.EL });
const len3 = (d: { E: number; N: number; EL: number }) => Math.hypot(d.E, d.N, d.EL);
const near = (a: PlantPt, b: PlantPt) => len3(sub3(a, b)) < 0.01;
const fmtIn = (n: number) => formatLength(n);

export interface IsoOptions { cloud?: Set<string>; newWelds?: { id: string; replaces: string }[]; wo?: string; title?: string; rev?: string }

/** SW-ISO-1: the isometric of a line; SW-ISO-2: with a work order's items clouded and its new welds named */
export function makeIsometric(L: GTLine, o: IsoOptions = {}): string {
  const W = 1190, Hh = 842, drawW = 760, drawH = 600, ox = 30, oy = 60;
  // ---- lay the nodes out: direction true, length compressed ----
  const nodes = L.nodes, pos: P2[] = [];
  let cur: P2 = [0, 0];
  nodes.forEach((n, i) => {
    if (i > 0) {
      const d = sub3(n.at, nodes[i - 1].at), l = len3(d);
      if (l > 1e-6) { const u = proj({ E: d.E / l, N: d.N / l, EL: d.EL / l }), s = 14 + 9 * Math.sqrt(l); cur = [cur[0] + u[0] * s, cur[1] + u[1] * s]; }
    }
    pos.push(cur);
  });
  const xs = pos.map(p => p[0]), ys = pos.map(p => p[1]), minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const sc = Math.min((drawW - 120) / Math.max(1, maxX - minX), (drawH - 120) / Math.max(1, maxY - minY), 3);
  const P = (p: P2): P2 => [ox + 60 + (p[0] - minX) * sc + ((drawW - 120) - (maxX - minX) * sc) / 2, oy + 60 + (p[1] - minY) * sc + ((drawH - 120) - (maxY - minY) * sc) / 2];
  const at = (q: PlantPt, ref?: string): { p: P2; dir: P2 } => {                        // screen position of a plant point on the path
    if (ref) { const k = nodes.findIndex(n => n.ref === ref && n.kind === 'elbow work point'); if (k >= 0) q = nodes[k].at; }
    for (let i = 0; i < nodes.length; i++) if (near(nodes[i].at, q)) { const j = i + 1 < nodes.length ? i + 1 : i - 1, a = P(pos[Math.min(i, j)]), b = P(pos[Math.max(i, j)]); const dl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return { p: P(pos[i]), dir: [(b[0] - a[0]) / dl, (b[1] - a[1]) / dl] }; }
    for (let i = 1; i < nodes.length; i++) {
      const a = nodes[i - 1].at, b = nodes[i].at, ab = sub3(b, a), l = len3(ab); if (l < 1e-6) continue;
      const t = ((q.E - a.E) * ab.E + (q.N - a.N) * ab.N + (q.EL - a.EL) * ab.EL) / (l * l);
      if (t < -1e-6 || t > 1 + 1e-6) continue;
      const pr = { E: a.E + ab.E * t, N: a.N + ab.N * t, EL: a.EL + ab.EL * t }; if (len3(sub3(pr, q)) > 0.6) continue;
      const A = P(pos[i - 1]), B = P(pos[i]), dl = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1;
      return { p: [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t], dir: [(B[0] - A[0]) / dl, (B[1] - A[1]) / dl] };
    }
    let best = 0; nodes.forEach((n, i) => { if (len3(sub3(n.at, q)) < len3(sub3(nodes[best].at, q))) best = i; });   // nearest node (off-path points)
    return { p: P(pos[best]), dir: [1, 0] };
  };
  const g: string[] = [];
  // centreline
  g.push(`<polyline class="pipe" points="${pos.map(p => P(p).map(v => v.toFixed(1)).join(',')).join(' ')}"/>`);
  // items
  const cloud = o.cloud ?? new Set<string>();
  const itemSym = (it: GTItem) => {
    const { p, dir } = at(it.centre, it.kind === 'elbow' ? it.tag : undefined), n: P2 = [-dir[1], dir[0]], t = (k: number, m: number): string => `${(p[0] + dir[0] * k + n[0] * m).toFixed(1)},${(p[1] + dir[1] * k + n[1] * m).toFixed(1)}`;
    let s = '';
    switch (it.kind) {
      case 'valve': { const ty = /CHECK/.test(it.description) ? 'C' : /CONTROL/.test(it.description) ? 'CV' : /SAFETY|RELIEF/.test(it.description) ? 'PSV' : /BALL/.test(it.description) ? 'B' : 'G';
        s = `<polygon class="sym" points="${t(-9, -6)} ${t(9, 6)} ${t(9, -6)} ${t(-9, 6)}"/><text class="tag" x="${(p[0] + n[0] * 14).toFixed(1)}" y="${(p[1] + n[1] * 14).toFixed(1)}">${ty}</text>`; break; }
      case 'flange': s = `<line class="sym" x1="${t(0, -7).split(',')[0]}" y1="${t(0, -7).split(',')[1]}" x2="${t(0, 7).split(',')[0]}" y2="${t(0, 7).split(',')[1]}"/>`; break;
      case 'blind': s = `<polyline class="blind" points="${t(0, -8)} ${t(0, 8)}"/>`; break;
      case 'gasket': s = `<polyline class="gsk" points="${t(0, -5)} ${t(0, 5)}"/>`; break;
      case 'reducer': s = `<polygon class="sym" points="${t(-7, -6)} ${t(7, -3)} ${t(7, 3)} ${t(-7, 6)}"/>`; break;
      case 'tee': { const child = it.tag.split('/T:')[1] ?? ''; s = `<circle class="tee" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5"/><line class="pipe thin" x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${(p[0] + n[0] * 22).toFixed(1)}" y2="${(p[1] + n[1] * 22).toFixed(1)}"/><text class="small" x="${(p[0] + n[0] * 26).toFixed(1)}" y="${(p[1] + n[1] * 26).toFixed(1)}">${esc(child)}</text>`; break; }
      case 'cap': s = `<circle class="sym" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="5"/>`; break;
      case 'elbow': s = `<circle class="ell" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="1.6"/>`; break;
      default: s = '';
    }
    const cl = cloud.has(it.tag) ? `<ellipse class="cloud" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" rx="20" ry="14"/>` : '';
    g.push(`<g data-tag="${esc(it.tag)}" data-kind="${it.kind}">${s}${cl}</g>`);
  };
  for (const it of L.items) if (it.kind !== 'studs' && it.kind !== 'pipe') itemSym(it);
  for (const it of L.items) if (it.kind === 'pipe' || it.kind === 'studs') g.push(`<g data-tag="${esc(it.tag)}" data-kind="${it.kind}"/>`);
  // welds: shop dot, field flag; numbered
  const nw = new Map((o.newWelds ?? []).map(w => [w.replaces, w.id] as const));
  for (const w of L.welds) {
    const { p, dir } = at(w.at), n: P2 = [-dir[1], dir[0]], num = w.tag.split('/').pop()!;
    const sym = w.shopField === 'field' ? `<polygon class="field" points="${p[0].toFixed(1)},${p[1].toFixed(1)} ${(p[0] + n[0] * 10).toFixed(1)},${(p[1] + n[1] * 10).toFixed(1)} ${(p[0] + n[0] * 6 + dir[0] * 6).toFixed(1)},${(p[1] + n[1] * 6 + dir[1] * 6).toFixed(1)}"/>` : `<circle class="weld" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.6"/>`;
    const lab = nw.has(w.tag) ? `<text class="new" x="${(p[0] - n[0] * 12).toFixed(1)}" y="${(p[1] - n[1] * 12).toFixed(1)}">${esc(nw.get(w.tag)!.split('-').pop()!)}</text>` : `<text class="small" x="${(p[0] - n[0] * 10).toFixed(1)}" y="${(p[1] - n[1] * 10).toFixed(1)}">${num}</text>`;
    g.push(`<g data-tag="${esc(w.tag)}" data-kind="weld">${sym}${lab}</g>`);
  }
  // supports
  for (const s of L.supports) {
    const { p } = at(s.at), num = s.tag.split('/').pop()!;
    g.push(`<g data-tag="${esc(s.tag)}" data-kind="support"><polygon class="sup" points="${p[0].toFixed(1)},${(p[1] + 4).toFixed(1)} ${(p[0] - 5).toFixed(1)},${(p[1] + 12).toFixed(1)} ${(p[0] + 5).toFixed(1)},${(p[1] + 12).toFixed(1)}"/><text class="small" x="${(p[0] + 7).toFixed(1)}" y="${(p[1] + 14).toFixed(1)}">${num}</text></g>`);
  }
  // dimensions of straight runs (between changes of direction) and elevations at changes of level
  let runStart = 0;
  const dirOf = (i: number) => { const d = sub3(nodes[i].at, nodes[i - 1].at), l = len3(d); return l < 1e-6 ? null : `${Math.round(d.E / l)},${Math.round(d.N / l)},${Math.round(d.EL / l)}`; };
  for (let i = 2; i <= nodes.length; i++) {
    if (i < nodes.length && dirOf(i) === dirOf(runStart + 1)) continue;
    const a = nodes[runStart].at, b = nodes[i - 1].at, l = len3(sub3(b, a));
    if (l > 6) {
      const A = P(pos[runStart]), B = P(pos[i - 1]), dl = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, n: P2 = [-(B[1] - A[1]) / dl, (B[0] - A[0]) / dl], off = 16;
      const mx = (A[0] + B[0]) / 2 + n[0] * off, my = (A[1] + B[1]) / 2 + n[1] * off;
      g.push(`<line class="dim" x1="${(A[0] + n[0] * off).toFixed(1)}" y1="${(A[1] + n[1] * off).toFixed(1)}" x2="${(B[0] + n[0] * off).toFixed(1)}" y2="${(B[1] + n[1] * off).toFixed(1)}"/><text class="dimt" x="${mx.toFixed(1)}" y="${my.toFixed(1)}">${esc(fmtIn(l))}</text>`);
      if (Math.abs(b.EL - a.EL) > 1) g.push(`<text class="el" x="${(B[0] + 8).toFixed(1)}" y="${(B[1] + 4).toFixed(1)}">EL ${esc(fmtIn(b.EL))}</text>`);
    }
    runStart = i - 1;
  }
  const s0 = P(pos[0]), s1 = P(pos[pos.length - 1]), first = nodes[0].at, last = nodes[nodes.length - 1].at;
  g.push(`<text class="end" x="${(s0[0] + 8).toFixed(1)}" y="${(s0[1] - 10).toFixed(1)}">FROM ${esc(L.header.from)}</text><text class="small" x="${(s0[0] + 8).toFixed(1)}" y="${(s0[1] + 2).toFixed(1)}">E ${esc(fmtIn(first.E))} N ${esc(fmtIn(first.N))} EL ${esc(fmtIn(first.EL))}</text>`);
  g.push(`<text class="end" x="${(s1[0] + 8).toFixed(1)}" y="${(s1[1] - 10).toFixed(1)}">TO ${esc(L.header.to)}</text><text class="small" x="${(s1[0] + 8).toFixed(1)}" y="${(s1[1] + 2).toFixed(1)}">E ${esc(fmtIn(last.E))} N ${esc(fmtIn(last.N))} EL ${esc(fmtIn(last.EL))}</text>`);
  // north arrow (plan north on the iso)
  const na = proj({ E: 0, N: 1, EL: 0 });
  g.push(`<g transform="translate(70,105)"><line class="na" x1="0" y1="0" x2="${(na[0] * 36).toFixed(1)}" y2="${(na[1] * 36).toFixed(1)}"/><text class="end" x="${(na[0] * 44).toFixed(1)}" y="${(na[1] * 44).toFixed(1)}">N</text></g>`);
  // BOM, weld list, title block
  const bx = 820, rows: string[] = [];
  let y = 70;
  rows.push(`<text class="h" x="${bx}" y="${y}">BILL OF MATERIALS</text>`); y += 14;
  for (const b of L.bom) { rows.push(`<text class="small" x="${bx}" y="${y}">${b.itemNo}</text><text class="small" x="${bx + 18}" y="${y}">${esc(b.description.length > 56 ? b.description.slice(0, 55) + '…' : b.description)}</text><text class="small" x="${W - 22}" y="${y}" text-anchor="end">${b.length !== undefined ? esc(fmtIn(b.length)) : b.qty}</text>`); y += 11; }
  y += 8; rows.push(`<text class="h" x="${bx}" y="${y}">WELDS ${L.totals.welds} (${L.totals.fieldWelds} FIELD) · SUPPORTS ${L.totals.supports} · SPOOLS ${L.spools.length}</text>`); y += 13;
  const wl = L.welds.map(w => `${w.tag.split('/').pop()}${w.shopField === 'field' ? 'F' : ''}`), perRow = 10;
  for (let i = 0; i < wl.length && y < 600; i += perRow) { rows.push(`<text class="small" x="${bx}" y="${y}">${esc(wl.slice(i, i + perRow).join('  '))}</text>`); y += 11; }
  if (o.newWelds?.length) { y += 6; rows.push(`<text class="h new" x="${bx}" y="${y}">NEW WELDS (${esc(o.wo ?? '')})</text>`); y += 12; for (const w of o.newWelds) { if (y > 620) break; rows.push(`<text class="small" x="${bx}" y="${y}">${esc(w.id)} replaces ${esc(w.replaces.split('/').pop()!)}</text>`); y += 10; } }
  const h = L.header, tb = 660;
  const title = [`<rect class="frame" x="${bx - 10}" y="${tb}" width="${W - bx - 10}" height="${Hh - tb - 20}"/>`,
    `<text class="tt" x="${bx}" y="${tb + 22}">${esc(h.line)}</text>`,
    `<text class="small" x="${bx}" y="${tb + 40}">CLASS ${esc(h.lineClass)} — ${esc(h.fluid)}${h.insulated ? ' — INSULATED' : ''}</text>`,
    `<text class="small" x="${bx}" y="${tb + 53}">SERVICE ${esc(h.service)} · ${h.NPS}" · ${h.cls} · DESIGN ${h.designPressure} psi</text>`,
    `<text class="small" x="${bx}" y="${tb + 66}">${esc(h.from)} → ${esc(h.to)}</text>`,
    `<text class="small" x="${bx}" y="${tb + 79}">PIPE ${esc(fmtIn(L.totals.pipeLength))} · WEIGHT ${L.totals.weight.toFixed(0)} lb</text>`,
    `<text class="h" x="${bx}" y="${tb + 98}">DWG ISO-${esc(h.line)}   REV ${esc(o.rev ?? '0')}${o.wo ? '   ' + esc(o.wo) : ''}</text>`,
    `<text class="small" x="${bx}" y="${tb + 113}">SmartWeld AI · not to scale · E lower right, N upper right, EL up (SW-ISO-1)</text>`,
    `<text class="demo" x="${bx}" y="${tb + 128}">${esc(DEMO_NOTICE.split(';')[0])}</text>`];
  const style = `<style>.pipe{fill:none;stroke:#1b1f24;stroke-width:2.4;stroke-linejoin:round}.thin{stroke-width:1.2}.sym{fill:#fff;stroke:#1b1f24;stroke-width:1.4}.blind{stroke:#1b1f24;stroke-width:4}.gsk{stroke:#555;stroke-width:1}.tee{fill:#1b1f24}.ell{fill:#1b1f24}.weld{fill:#1b1f24}.field{fill:#c0392b}.sup{fill:none;stroke:#2e6da4;stroke-width:1.2}.cloud{fill:none;stroke:#d0021b;stroke-width:1.6;stroke-dasharray:4 3}.dim{stroke:#777;stroke-width:.7}.dimt{font:9px sans-serif;fill:#333;text-anchor:middle}.el{font:9px sans-serif;fill:#2e6da4}.tag{font:bold 9px sans-serif;fill:#1b1f24;text-anchor:middle}.small{font:8.5px sans-serif;fill:#1b1f24}.h{font:bold 10px sans-serif;fill:#1b1f24}.tt{font:bold 16px sans-serif;fill:#1b1f24}.end{font:bold 10px sans-serif;fill:#1b1f24}.new{fill:#d0021b;font:bold 9px sans-serif}.na{stroke:#1b1f24;stroke-width:1.5}.frame{fill:none;stroke:#1b1f24;stroke-width:1}.demo{font:bold 8px sans-serif;fill:#d0021b}</style>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}" data-line="${esc(h.line)}">${style}<rect x="0" y="0" width="${W}" height="${Hh}" fill="#fff"/><rect class="frame" x="10" y="10" width="${W - 20}" height="${Hh - 20}"/><text class="h" x="30" y="40">ISOMETRIC — ${esc(h.line)}${o.title ? ' — ' + esc(o.title) : ''}</text>${g.join('')}${rows.join('')}${title.join('')}</svg>`;
}
