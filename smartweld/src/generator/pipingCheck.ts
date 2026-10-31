/**
 * Independent checks of a generated piping model against DESIGN_BASIS.md §40 (stage-5 tests).
 * Each check returns a list of human-readable violations; an empty list is a pass. The checks read only
 * the plain-data model plus the catalogue rules, never the router's internals, so they audit its output.
 */
import { pipeDims, designFlange, elbowRadius, teeC, isOffered, type PipeClass, type ValveType } from '../catalogue';
import { DEMO_LAYOUT } from './interior';
import type { PipingModel, Comp, LineRun, WeldRec, Obstacle } from './piping';
import type { V3 } from './router';

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const unit = (a: V3): V3 => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const TOL = 1 / 16;
const WELDED = new Set(['pipe', 'elbow', 'tee', 'reducer', 'cap']);
const zAxis = (c: Comp): V3 => [c.T[8], c.T[9], c.T[10]];
const yAxis = (c: Comp): V3 => [c.T[4], c.T[5], c.T[6]];
const origin = (c: Comp): V3 => [c.T[12], c.T[13], c.T[14]];

/** the chain of a line: every component except the stud bolting, in assembly order */
export const chain = (r: LineRun | { comps: Comp[] }) => r.comps.filter(c => c.kind !== 'studs');
const joint = (x: Comp, y: Comp): { d: number; at: V3 } => {
  let best = { d: Infinity, at: x.b };
  for (const p of [x.a, x.b]) for (const q of [y.a, y.b]) { const d = len(sub(p, q)); if (d < best.d) best = { d, at: p }; }
  return best;
};
/** tee branch outlet point (SW-FIT-2): C from the run axis along the tee's local y */
export const teeOutlet = (t: Comp): V3 => add(origin(t), yAxis(t), teeC(pipeDims(t.NPS, t.cls).OD));

export function checkContinuity(m: PipingModel): string[] {
  const v: string[] = [];
  for (const r of m.lines) {
    const c = chain(r);
    for (let i = 1; i < c.length; i++) {
      const j = joint(c[i - 1], c[i]);
      if (j.d > TOL) v.push(`${r.no}: gap ${j.d.toFixed(3)} in between ${c[i - 1].tag} (${c[i - 1].kind}) and ${c[i].tag} (${c[i].kind})`);
      if (c[i - 1].cls !== c[i].cls) v.push(`${r.no}: class change ${c[i - 1].cls}→${c[i].cls} at ${c[i].tag}`);
      const sizeOk = c[i - 1].NPS === c[i].NPS || c[i - 1].kind === 'reducer' || c[i].kind === 'reducer' || (c[i - 1].kind === 'valve' && c[i - 1].key.startsWith('VLV|PSV'));
      if (!sizeOk) v.push(`${r.no}: size change ${c[i - 1].NPS}→${c[i].NPS} at ${c[i].tag} without a reducer`);
    }
  }
  return v;
}

/** butt joints carry exactly one weld; flanged joints carry a gasket between faces and a stud set (SW-PW-1, SW-FLG) */
export function checkJoints(m: PipingModel): string[] {
  const v: string[] = [], allWelds: WeldRec[] = [...m.lines.flatMap(r => r.welds), ...m.nozzles.flatMap(n => n.welds)];
  const weldsAt = (p: V3) => allWelds.filter(w => len(sub(w.at, p)) < TOL);
  const runs: { no: string; comps: Comp[] }[] = [...m.lines.map(r => ({ no: r.no, comps: r.comps })), ...m.nozzles.map(n => ({ no: n.id, comps: n.comps }))];
  let butt = 0;
  for (const r of runs) {
    const c = chain(r), studs = r.comps.filter(x => x.kind === 'studs');
    for (let i = 1; i < c.length; i++) {
      const x = c[i - 1], y = c[i], j = joint(x, y);
      const isButt = (WELDED.has(x.kind) && (WELDED.has(y.kind) || y.kind === 'flange')) || (WELDED.has(y.kind) && x.kind === 'flange');
      if (isButt) { butt++; const n = weldsAt(j.at).length; if (n !== 1) v.push(`${r.no}: butt joint ${x.tag}/${y.tag} has ${n} weld records`); continue; }
      if (WELDED.has(x.kind) || WELDED.has(y.kind)) { v.push(`${r.no}: ${x.kind} joined to ${y.kind} at ${y.tag}`); continue; }
      if (x.kind === 'flange' && y.kind === 'flange') { v.push(`${r.no}: flange faces ${x.tag}/${y.tag} without a gasket`); continue; }
      const g = x.kind === 'gasket' ? x : y.kind === 'gasket' ? y : null;
      if (!g) { if (!(x.key.startsWith('VLV|PSV') || y.key.startsWith('VLV|PSV'))) v.push(`${r.no}: ${x.kind}/${y.kind} joint ${x.tag}/${y.tag} has no gasket`); continue; }
      if (g === y) {   // check each gasket once: as the second of its pair, its stud set must sit at its centre
        const mid = add(g.a, sub(g.b, g.a), 0.5);
        if (!studs.some(s => len(sub(origin(s), mid)) < TOL)) v.push(`${r.no}: gasket ${g.tag} has no stud set`);
      }
    }
    // every gasket sits between two bolted faces
    c.forEach((x, i) => { if (x.kind === 'gasket' && (i === 0 ? false : WELDED.has(c[i - 1].kind)) ) v.push(`${r.no}: gasket ${x.tag} against a welded end`); });
  }
  // tee outlets: the branch joint carries exactly one weld
  for (const r of m.lines) for (const t of r.comps.filter(c => c.kind === 'tee')) { butt++; const n = weldsAt(teeOutlet(t)).length; if (n !== 1) v.push(`${r.no}: tee ${t.tag} outlet has ${n} weld records`); }
  // no two weld records at the same point
  const seen = new Map<string, string>();
  for (const w of allWelds) { const k = w.at.map(q => Math.round(q * 16)).join(','); if (seen.has(k)) v.push(`duplicate weld ${w.id} and ${seen.get(k)}`); else seen.set(k, w.id); }
  if (butt === 0) v.push('no butt joints found');
  return v;
}

/** SW-FIT-1 radius; SW-RT-4: at least 2 in of straight pipe between two elbows; every pipe piece 0 or ≥ 2 in */
export function checkElbowsAndStraights(m: PipingModel): string[] {
  const v: string[] = [];
  for (const r of m.lines) {
    const c = chain(r);
    for (const e of c.filter(x => x.kind === 'elbow')) {
      const Rr = elbowRadius(pipeDims(e.NPS, e.cls).OD), chord = len(sub(e.b, e.a));
      if (Math.abs(chord - Rr * Math.SQRT2) > TOL) v.push(`${r.no}: elbow ${e.tag} chord ${chord.toFixed(3)} ≠ R√2 ${(Rr * Math.SQRT2).toFixed(3)}`);
    }
    for (const p of c.filter(x => x.kind === 'pipe')) { const L = len(sub(p.b, p.a)); if (L < 2 - 1e-6) v.push(`${r.no}: pipe ${p.tag} only ${L.toFixed(2)} in long`); if (L > 480 + 1e-6) v.push(`${r.no}: pipe ${p.tag} ${L.toFixed(0)} in exceeds 40 ft (SW-RT-5)`); }
    for (let i = 1; i < c.length; i++) if (c[i - 1].kind === 'elbow' && c[i].kind === 'elbow') v.push(`${r.no}: elbows ${c[i - 1].tag} and ${c[i].tag} welded back to back`);
  }
  return v;
}

/** SW-LL-1 numbering, SW-VLV-11 offering */
export function checkNumberingAndValves(m: PipingModel): string[] {
  const v: string[] = [], re = /^(\d+(\.\d+)?|1\/2|3\/4)"-P(150|300|600|1200|2400|4800)-(P|CWS|CWR|LS|SC|IA|PA|N|W|FL|V|D|I|SP|HS|RV)-\d{4}$/;
  const nos = new Set<string>();
  for (const r of m.lines) {
    if (!re.test(r.no)) v.push(`bad line number ${r.no}`);
    if (nos.has(r.no)) v.push(`duplicate line number ${r.no}`); nos.add(r.no);
    const [size, cls, svc] = r.no.split('-');
    const nps = size === '1/2"' ? 0.5 : size === '3/4"' ? 0.75 : Number(size.replace('"', ''));
    if (nps !== r.NPS || cls !== r.cls || svc !== r.service) v.push(`${r.no}: number does not match NPS ${r.NPS} class ${r.cls} service ${r.service}`);
    for (const c of r.comps.filter(x => x.kind === 'valve')) { const [, type, n, k] = c.key.split('|'); if (!isOffered(type as ValveType, Number(n), k as PipeClass)) v.push(`${r.no}: ${type} ${n} ${k} is not offered`); }
  }
  return v;
}

// ---- clearance (SW-RT-3 / SW-RT-6) -------------------------------------------------------------------------
export type Shape = { kind: 'cap'; a: V3; b: V3; r: number } | { kind: 'box'; mn: V3; mx: V3 } | { kind: 'disc'; a: V3; b: V3; r: number };
/** the envelope of a placed component: capsules for pipe, fittings and flanges, the box for valves (given) */
export function compShapes(c: Comp, valveBox: (c: Comp) => [V3, V3]): Shape[] {
  const OD = pipeDims(c.NPS, c.cls).OD;
  switch (c.kind) {
    case 'valve': { const [mn, mx] = valveBox(c); return [{ kind: 'box', mn, mx }]; }
    case 'elbow': { const Rr = elbowRadius(OD), corner = add(c.a, zAxis(c), Rr); return [{ kind: 'cap', a: c.a, b: corner, r: OD / 2 }, { kind: 'cap', a: corner, b: c.b, r: OD / 2 }]; }
    case 'tee': return [{ kind: 'cap', a: c.a, b: c.b, r: OD / 2 }, { kind: 'cap', a: origin(c), b: teeOutlet(c), r: OD / 2 }];
    case 'flange': case 'blind': case 'gasket': return [{ kind: 'disc', a: c.a, b: c.b, r: designFlange(c.NPS, c.cls).OD / 2 }];
    case 'studs': return [];
    case 'reducer': case 'pipe': case 'cap': return [{ kind: 'cap', a: c.a, b: c.b, r: OD / 2 }];
    default: return [{ kind: 'cap', a: c.a, b: c.b, r: OD / 2 }];
  }
}
const boxOf = (s: Shape): [V3, V3] => s.kind === 'box' ? [s.mn, s.mx] : s.kind === 'disc' ? discBox(s) : [[Math.min(s.a[0], s.b[0]) - s.r, Math.min(s.a[1], s.b[1]) - s.r, Math.min(s.a[2], s.b[2]) - s.r], [Math.max(s.a[0], s.b[0]) + s.r, Math.max(s.a[1], s.b[1]) + s.r, Math.max(s.a[2], s.b[2]) + s.r]];
export const boxGap = (a: [V3, V3], b: [V3, V3]) => { let s = 0; for (let k = 0; k < 3; k++) { const d = Math.max(a[0][k] - b[1][k], b[0][k] - a[1][k], 0); s += d * d; } return Math.sqrt(s); };
export function segSeg(p1: V3, q1: V3, p2: V3, q2: V3): number {
  const d1 = sub(q1, p1), d2 = sub(q2, p2), r = sub(p1, p2), a = dot(d1, d1), e = dot(d2, d2), f = dot(d2, r);
  let s: number, t: number;
  if (a < 1e-12 && e < 1e-12) return len(r);
  if (a < 1e-12) { s = 0; t = Math.min(1, Math.max(0, f / e)); }
  else { const c = dot(d1, r); if (e < 1e-12) { t = 0; s = Math.min(1, Math.max(0, -c / a)); } else { const b = dot(d1, d2), den = a * e - b * b; s = den > 1e-12 ? Math.min(1, Math.max(0, (b * f - c * e) / den)) : 0; t = (b * s + f) / e; if (t < 0) { t = 0; s = Math.min(1, Math.max(0, -c / a)); } else if (t > 1) { t = 1; s = Math.min(1, Math.max(0, (b - c) / a)); } } }
  return len(sub(add(p1, d1, s), add(p2, d2, t)));
}
/** a flat-ended cylinder (flange, gasket, blind) between a and b of radius r: its exact axis-aligned bounds */
function discBox(s: { a: V3; b: V3; r: number }): [V3, V3] {
  const n = unit(sub(s.b, s.a)), mn: V3 = [0, 0, 0], mx: V3 = [0, 0, 0];
  for (let k = 0; k < 3; k++) { const e = s.r * Math.sqrt(Math.max(0, 1 - n[k] * n[k])); mn[k] = Math.min(s.a[k], s.b[k]) - e; mx[k] = Math.max(s.a[k], s.b[k]) + e; }
  return [mn, mx];
}
/** distance from a point to a flat-ended cylinder */
function pointCyl(p: V3, s: { a: V3; b: V3; r: number }): number {
  const ab = sub(s.b, s.a), L = len(ab), n = unit(ab), t = dot(sub(p, s.a), n), rad = len(sub(sub(p, s.a), [n[0] * t, n[1] * t, n[2] * t]));
  const dax = t < 0 ? -t : t > L ? t - L : 0, drad = Math.max(0, rad - s.r);
  return Math.hypot(dax, drad);
}
/** surface gap between two shapes: capsule–capsule exact; cylinder–capsule by sampling the capsule axis at 1/4 in;
 *  cylinder–cylinder by sampling one cylinder's rim and faces; anything with a box: box–box of their bounds */
export function gap(x: Shape, y: Shape): number {
  if (x.kind === 'cap' && y.kind === 'cap') return segSeg(x.a, x.b, y.a, y.b) - x.r - y.r;
  if (x.kind === 'disc' && y.kind === 'cap') return gap(y, x);
  if (x.kind === 'cap' && y.kind === 'disc') {
    const L = len(sub(x.b, x.a)), n = Math.max(1, Math.ceil(L / 0.25)); let best = Infinity;
    for (let i = 0; i <= n; i++) best = Math.min(best, pointCyl(add(x.a, sub(x.b, x.a), i / n), y));
    return best - x.r;
  }
  if (x.kind === 'disc' && y.kind === 'disc') {
    const n = unit(sub(x.b, x.a)), u = unit(Math.abs(n[1]) < 0.9 ? [n[2], 0, -n[0]] : [1, 0, 0]), v = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]] as V3;
    let best = Infinity;
    for (const end of [x.a, x.b]) for (let ri = 0; ri <= 4; ri++) for (let k = 0; k < 48; k++) { const a = (2 * Math.PI * k) / 48, rr = (x.r * ri) / 4; best = Math.min(best, pointCyl(add(add(end, u, rr * Math.cos(a)), v, rr * Math.sin(a)), y)); }
    return best;
  }
  return boxGap(boxOf(x), boxOf(y));
}

export interface ClashReport { pairs: number; min: number; violations: string[] }
/**
 * Clearance between every two lines (SW-RT-3): `clearance` in. Pairs that are meant to touch are skipped —
 * a branch and the parent it tees into (within 2 C of the tee), and a relief valve stub and the flare line on its outlet.
 */
export function checkLineClearance(m: PipingModel, valveBox: (c: Comp) => [V3, V3], clearance = 3): ClashReport {
  type It = { line: string; tag: string; s: Shape; box: [V3, V3] };
  const items: It[] = [];
  for (const r of m.lines) for (const c of r.comps) for (const s of compShapes(c, valveBox)) items.push({ line: r.no, tag: c.tag, s, box: boxOf(s) });
  const parentOf = new Map<string, string>(), tees: { parent: string; at: V3; C: number }[] = [];
  for (const r of m.lines) { if (r.from.startsWith('tap ')) parentOf.set(r.no, r.from.slice(4)); if (r.to.startsWith('tap ')) parentOf.set(r.no, r.to.slice(4)); if (r.from.startsWith('PSV on ')) parentOf.set(r.no, 'PSV:' + r.from.slice(7)); }
  for (const r of m.lines) for (const t of r.comps.filter(c => c.kind === 'tee')) tees.push({ parent: r.no, at: teeOutlet(t), C: teeC(pipeDims(t.NPS, t.cls).OD) });
  const rvOf = new Map(m.lines.filter(r => r.service === 'RV').map(r => ['PSV:' + r.from, r.no] as const));
  const related = (a: It, b: It) => {
    const pa = parentOf.get(a.line), pb = parentOf.get(b.line);
    if (pa && (pa === b.line || rvOf.get(pa) === b.line)) return true;
    if (pb && (pb === a.line || rvOf.get(pb) === a.line)) return true;
    return false;
  };
  const nearTee = (a: It, b: It) => tees.some(t => (t.parent === a.line || t.parent === b.line) && boxGap(a.box, [add(t.at, [-2 * t.C, -2 * t.C, -2 * t.C]), add(t.at, [2 * t.C, 2 * t.C, 2 * t.C])]) < 1e-9 && boxGap(b.box, [add(t.at, [-2 * t.C, -2 * t.C, -2 * t.C]), add(t.at, [2 * t.C, 2 * t.C, 2 * t.C])]) < 1e-9);
  // uniform-grid broad phase
  const cell = 48, buckets = new Map<string, number[]>();
  items.forEach((it, i) => { const [mn, mx] = it.box; for (let x = Math.floor((mn[0] - clearance) / cell); x <= Math.floor((mx[0] + clearance) / cell); x++) for (let y = Math.floor((mn[1] - clearance) / cell); y <= Math.floor((mx[1] + clearance) / cell); y++) for (let z = Math.floor((mn[2] - clearance) / cell); z <= Math.floor((mx[2] + clearance) / cell); z++) { const k = `${x},${y},${z}`; let b = buckets.get(k); if (!b) buckets.set(k, (b = [])); b.push(i); } });
  const done = new Set<number>(), v: string[] = []; let pairs = 0, min = Infinity;
  for (const b of buckets.values()) for (let p = 0; p < b.length; p++) for (let q = p + 1; q < b.length; q++) {
    const i = Math.min(b[p], b[q]), j = Math.max(b[p], b[q]), A = items[i], B = items[j]; if (A.line === B.line) continue;
    const key = i * items.length + j; if (done.has(key)) continue; done.add(key);
    if (boxGap(A.box, B.box) >= clearance) continue;
    if (related(A, B) && nearTee(A, B)) continue;
    if ((A.tag.endsWith(`/T:${B.line}`)) || (B.tag.endsWith(`/T:${A.line}`))) continue;   // a tee and its own branch meet at the outlet
    if (related(A, B) && (A.line.includes('-FL-') || B.line.includes('-FL-')) && (A.line.includes('-RV-') || B.line.includes('-RV-'))) continue;
    pairs++; const d = gap(A.s, B.s); min = Math.min(min, d);
    if (d < clearance - 1e-6) v.push(`${A.line} ${A.tag} – ${B.line} ${B.tag}: ${d.toFixed(2)} in`);
  }
  return { pairs, min, violations: v };
}

/** clearance of lines to the static plant (members as capsules, solids as boxes); a line's own end stacks may touch its own equipment */
export function checkStaticClearance(m: PipingModel, statics: Obstacle[], valveBox: (c: Comp) => [V3, V3], clearance = 3): string[] {
  const v: string[] = [], cell = 96, buckets = new Map<string, number[]>();
  const sbox = (o: Obstacle): [V3, V3] => o.kind === 'box' ? [o.mn, o.mx] : boxOf({ kind: 'cap', a: o.a, b: o.b, r: o.r });
  statics.forEach((o, i) => { const [mn, mx] = sbox(o); for (let x = Math.floor(mn[0] / cell); x <= Math.floor(mx[0] / cell); x++) for (let y = Math.floor(mn[1] / cell); y <= Math.floor(mx[1] / cell); y++) for (let z = Math.floor(mn[2] / cell); z <= Math.floor(mx[2] / cell); z++) { const k = `${x},${y},${z}`; let b = buckets.get(k); if (!b) buckets.set(k, (b = [])); b.push(i); } });
  const nozzleFaces = new Map(m.nozzles.map(n => [n.id, n] as const));
  for (const r of m.lines) {
    const own = [r.from, r.to].map(e => nozzleFaces.get(e) ?? (e.startsWith('PSV on ') ? nozzleFaces.get(e.slice(7)) : undefined)).filter(Boolean);
    for (const c of r.comps) for (const s of compShapes(c, valveBox)) {
      const bx = boxOf(s), cand = new Set<number>();
      for (let x = Math.floor((bx[0][0] - clearance) / cell); x <= Math.floor((bx[1][0] + clearance) / cell); x++) for (let y = Math.floor((bx[0][1] - clearance) / cell); y <= Math.floor((bx[1][1] + clearance) / cell); y++) for (let z = Math.floor((bx[0][2] - clearance) / cell); z <= Math.floor((bx[1][2] + clearance) / cell); z++) for (const i of buckets.get(`${x},${y},${z}`) ?? []) cand.add(i);
      for (const i of cand) {
        const o = statics[i]; if (boxGap(bx, sbox(o)) >= clearance - 1e-6) continue;
        let d: number;
        if (o.kind === 'cap') d = s.kind === 'cap' ? segSeg(s.a, s.b, o.a, o.b) - s.r - o.r : s.kind === 'disc' ? gap({ kind: 'cap', a: o.a, b: o.b, r: o.r }, s) : segBox(o.a, o.b, bx[0], bx[1]) - o.r;
        else d = s.kind === 'cap' ? segBox(s.a, s.b, o.mn, o.mx) - s.r : boxGap(bx, [o.mn, o.mx]);
        if (d >= clearance - 1e-6) continue;
        if (own.some(n => o.tag.startsWith(n!.equip + '/') && len(sub(add(c.a, sub(c.b, c.a), 0.5), n!.face)) < 120)) continue;
        v.push(`${r.no} ${c.tag} (${c.kind}) – ${o.tag}: ${d.toFixed(2)} in`);
      }
    }
  }
  return v;
}
export function segBox(a: V3, b: V3, mn: V3, mx: V3): number {
  // sample the segment finely; exact enough for axis-aligned runs, conservative for elbows' chords
  const L = len(sub(b, a)), n = Math.max(1, Math.ceil(L / 0.5)); let best = Infinity;
  for (let i = 0; i <= n; i++) { const p = add(a, sub(b, a), i / n); let s = 0; for (let k = 0; k < 3; k++) { const d = Math.max(mn[k] - p[k], p[k] - mx[k], 0); s += d * d; } best = Math.min(best, Math.sqrt(s)); }
  return best;
}

/** SW-PS-7 spans on horizontal runs; SW-PS-8 a shoe, guide or anchor at every rack beam crossed */
export function checkSupports(m: PipingModel): string[] {
  const v: string[] = [], rk = DEMO_LAYOUT.rack;
  for (const r of m.lines) {
    if (r.kind === 'stub' || !r.ok) continue;
    const OD = pipeDims(r.NPS, r.cls).OD, span = OD >= 3.5 ? 240 : OD >= 2.375 ? 180 : 120;
    // merge collinear pipe/tee pieces into straight runs
    const runs: { a: V3; b: V3 }[] = [];
    for (const c of r.comps.filter(x => x.kind === 'pipe' || x.kind === 'tee')) { const last = runs[runs.length - 1]; const w = unit(sub(c.b, c.a)); if (last && len(sub(last.b, c.a)) < 0.1 && Math.abs(dot(unit(sub(last.b, last.a)), w) - 1) < 1e-6) last.b = c.b; else runs.push({ a: c.a, b: c.b }); }
    for (const sr of runs) {
      const w = unit(sub(sr.b, sr.a)), L = len(sub(sr.b, sr.a)); if (Math.abs(w[1]) > 0.5 || L <= span) continue;
      const on = r.supports.map(s => dot(sub(s.at, sr.a), w)).filter(t => t > -1 && t < L + 1 && r.supports.length).sort((a, b) => a - b);
      const pts = [0, ...on, L];
      for (let i = 1; i < pts.length; i++) if (pts[i] - pts[i - 1] > span + 1e-6) { v.push(`${r.no}: unsupported span ${(pts[i] - pts[i - 1]).toFixed(0)} in > ${span} on run from ${sr.a.map(q => q.toFixed(0))}`); break; }
      const onRack = Math.abs(w[0]) > 0.5 && Math.abs(sr.a[2]) < rk.halfWidth && rk.tiers.some(t => sr.a[1] - OD / 2 - t >= 3.9 && sr.a[1] - OD / 2 - t <= 12);
      if (onRack) for (let x = rk.x0; x <= rk.x1; x += rk.bentSpacing) {
        const lo = Math.min(sr.a[0], sr.b[0]), hi = Math.max(sr.a[0], sr.b[0]); if (x <= lo + 6 || x >= hi - 6) continue;
        if (!r.supports.some(s => Math.abs(s.at[0] - x) < 1e-6 && Math.abs(s.at[2] - sr.a[2]) < 1e-6 && ['shoe', 'guide', 'anchor'].includes(s.type))) v.push(`${r.no}: no shoe at bent x=${x}`);
      }
    }
  }
  return v;
}
