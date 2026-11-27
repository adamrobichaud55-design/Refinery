import { mkdirSync } from 'node:fs';
/**
 * "routes": an independent detector for plant 3 that trusts none of the model's own checks.
 *
 * Method: route and shape logic, per line. Every line is rebuilt from its JSON record as a route (its chain of pieces, its
 * centreline and its path), its shape is checked (one continuous chain, no self-approach, no tight U-turn, no needless hop,
 * nothing below grade, no elbow whose legs reverse, no overlap with its own non-neighbour pieces), and its route tube - each
 * piece swept with its own envelope (pipe, flange ring, valve body and handwheel, elbow as a bent tube) - is tested against
 * the routes of every other line and spool of every model and against the plant's steel, equipment, concrete, pipe frames
 * and sleepers. The narrow phase is exact for convex pieces: min over directions n of (cA-cB).n + extA(n) + extB(n) is the
 * penetration depth when positive and minus the separation when negative. Contacts are excused only by a named
 * relationship (chain neighbours, a bolted joint, a branch at its tee or olet, a support on its line or bearing on its member,
 * a nozzle on its own equipment, a pipe through its grating cut, steel of one structure), never by depth.
 *
 * Run: cd /home/user/Refinery/smartweld && MODELS=<dir> [LABEL=x] [PLANT=1] npx vite-node <this file>
 *
 * Reviewed and fixed in place by a second auditor (review-routes). The blind spots found and closed, each marked "review fix" below:
 *  - tees were enveloped as two nominal rounds; the catalogue draws a blended crotch up to 3 % of the OD outside them (0.72 in on a 24 in tee):
 *    tee envelopes are now fitted to the drawn mesh, with the crotch held by a box checked on the meshes;
 *  - the drawn weld beads (every weld record, lines and nozzles) were not loaded; they are pieces now, excused only against the pieces they join;
 *  - a support's bearing solids were excused against every static solid at any depth, and its 'seat' was anything they touched or sank into: now a
 *    seat is a solid a bearing plate meets face to face (within JOIN), or for a hanger the member holding its top plate; a plate sunk deeper, or in
 *    anything else, is a clash;
 *  - a body's anchor bolts were excused in every static solid of any structure: now only in a solid the body stands on face to face;
 *  - a nozzle was excused against every solid of its item (platform handrails, ladders, pedestals): now only the solid its neck ends in and the
 *    item's weld seams; a line's studs at an equipment nozzle only against the body's own drawn flange;
 *  - a support was excused against every piece of its own line: now only the run it carries (pipes, elbows, tees, reducers, olets, their welds);
 *  - a pipe through a grating cut was excused whatever its size: now only where it fits the cut;
 *  - the mesh check looked at the 24 deepest envelope pairs of a piece pair only and kept the first one borne out: now all, and the deepest;
 *    the depth on the meshes is taken from the triangles clipped to each envelope's box, not from the vertices that happen to fall in it;
 *  - 'equipment-seat' (a body sunk into the steel it stands on) was left out of the count of clashes: it is counted now (no face excuses it).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { cells } from '../../src/refinery/assemble';
import { unitToPipeway, pipeway, PWY } from '../../src/refinery/pipeway';
import { CWM } from '../../src/refinery/coolingWater';
import { framePlaced, type FrameSpec } from '../../src/refinery/supports';
import { partFromKey } from '../../src/generator/piping';
import { buildGeometry } from '../../src/geometry/partGeometry';
import { pipeDims, designFlange, teeC, type PartSpec, type PipeClass } from '../../src/catalogue';
import { interiorKit } from '../../src/generator/interiorKit';
import { gateWidth } from '../../src/refinery/unitPiping';
import { frameFromAxes, multiply, translate } from '../../src/geometry/transform';

const T0 = Date.now();
// the caches (part envelopes, the pipeway's steel for PW_CACHE) live beside this script; ROUTES_OUT (development only) sends the findings elsewhere
const CACHE_DIR = (process.env.AUDIT_OUT ?? 'audit-out') + '/routes'; mkdirSync(CACHE_DIR, { recursive: true }); const OUT_DIR = process.env.ROUTES_OUT || CACHE_DIR;
const MODELS = process.env.MODELS; if (!MODELS) throw new Error('set MODELS to the model folder');
const LABEL = process.env.LABEL || 'run', PLANT = process.env.PLANT === '1', PW_CACHE = process.env.PW_CACHE === '1', AUDIT = process.env.AUDIT === '1';
const NOISE = 0.02, JOIN = 0.05;
const log = (s: string) => { if (process.env.QUIET !== '1') { const m = process.memoryUsage(); console.error(`[${((Date.now() - T0) / 1000).toFixed(1)}s ${(m.rss / 2 ** 30).toFixed(1)}G] ${s}`); } };

// ------------------------------------------------------------------------------------------------ vectors
type V3 = [number, number, number]; type M4 = number[];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const unit = (a: V3): V3 => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const xf = (M: M4, p: V3): V3 => [M[0] * p[0] + M[4] * p[1] + M[8] * p[2] + M[12], M[1] * p[0] + M[5] * p[1] + M[9] * p[2] + M[13], M[2] * p[0] + M[6] * p[1] + M[10] * p[2] + M[14]];
const rv = (M: M4, v: V3): V3 => [M[0] * v[0] + M[4] * v[1] + M[8] * v[2], M[1] * v[0] + M[5] * v[1] + M[9] * v[2], M[2] * v[0] + M[6] * v[1] + M[10] * v[2]];
const r3 = (v: V3): V3 => v.map(x => Math.round(x * 1000) / 1000) as V3;
const I4: M4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
/** distance from p to segment ab, and the parameter along it (0..L) */
function ptSeg(p: V3, a: V3, b: V3): { d: number; t: number; L: number } {
  const ab = sub(b, a), L = len(ab); if (L < 1e-9) return { d: dist(p, a), t: 0, L: 0 };
  const u: V3 = [ab[0] / L, ab[1] / L, ab[2] / L], t = dot(sub(p, a), u), tc = Math.max(0, Math.min(L, t));
  return { d: dist(p, add(a, u, tc)), t, L };
}
/** closest points of two segments */
function segSeg(p1: V3, q1: V3, p2: V3, q2: V3): { d: number; c1: V3; c2: V3 } {
  const d1 = sub(q1, p1), d2 = sub(q2, p2), r = sub(p1, p2), a = dot(d1, d1), e = dot(d2, d2), f = dot(d2, r);
  let s = 0, t = 0;
  if (a < 1e-12 && e < 1e-12) { s = 0; t = 0; }
  else if (a < 1e-12) { s = 0; t = Math.min(1, Math.max(0, f / e)); }
  else { const c = dot(d1, r); if (e < 1e-12) { t = 0; s = Math.min(1, Math.max(0, -c / a)); } else { const b = dot(d1, d2), den = a * e - b * b; s = den > 1e-12 ? Math.min(1, Math.max(0, (b * f - c * e) / den)) : 0; t = (b * s + f) / e; if (t < 0) { t = 0; s = Math.min(1, Math.max(0, -c / a)); } else if (t > 1) { t = 1; s = Math.min(1, Math.max(0, (b - c) / a)); } } }
  const c1 = add(p1, d1, s), c2 = add(p2, d2, t); return { d: dist(c1, c2), c1, c2 };
}

// ------------------------------------------------------------------------------------------------ primitives
/** a convex envelope: a flat-ended cylinder (t 0: centre c, axis u, half-length h, radius r) or a box (t 1: centre c, axes e0..e2, half-extents s) */
interface LPrim { t: 0 | 1; c: V3; u: V3; h: number; r: number; e: [V3, V3, V3]; s: V3; nm: string; bear: boolean; anchor: boolean }
interface Prim extends LPrim { mn: V3; mx: V3; p: number }
const BEARING = /^(shoe base|guide angle|base plate|anchor rods|top plate|top plates)/;
const lcache = new Map<PartSpec, LPrim[]>();
function lBox(L: LPrim): [V3, V3] {
  const mn: V3 = [0, 0, 0], mx: V3 = [0, 0, 0];
  for (let k = 0; k < 3; k++) { const e = L.t === 0 ? L.h * Math.abs(L.u[k]) + L.r * Math.sqrt(Math.max(0, 1 - L.u[k] * L.u[k])) : L.s[0] * Math.abs(L.e[0][k]) + L.s[1] * Math.abs(L.e[1][k]) + L.s[2] * Math.abs(L.e[2][k]); mn[k] = L.c[k] - e; mx[k] = L.c[k] + e; }
  return [mn, mx];
}
function insideL(B: LPrim, p: V3): boolean {
  const w = sub(p, B.c);
  if (B.t === 1) return [0, 1, 2].every(i => Math.abs(dot(w, B.e[i])) <= B.s[i] + 1e-6);
  const ax = dot(w, B.u); if (Math.abs(ax) > B.h + 1e-6) return false; return len(add(w, B.u, -ax)) <= B.r + 1e-6;
}
const AX: [V3, V3, V3] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
function cylL(a: V3, b: V3, r: number, nm: string): LPrim { const d = sub(b, a), L = len(d); return { t: 0, c: add(a, d, 0.5), u: L > 1e-9 ? unit(d) : [0, 0, 1], h: L / 2, r, e: AX, s: [0, 0, 0], nm, bear: false, anchor: false }; }
/** the local envelopes of a part: per drawn solid, the smaller of its box and its round about a box axis (each encloses every vertex); an elbow as a bent tube of short cylinders on its tangent polygon; a tee as run and branch */
function localPrims(part: PartSpec): LPrim[] {
  let out = lcache.get(part); if (out) return out; out = [];
  const isSupport = part.kind === 'SUPPORT';
  if (part.kind === 'ELBOW') {
    const R = part.dims.R.value, ang = (part.dims.angle.value * Math.PI) / 180, r = part.dims.OD.value / 2;
    const dth = Math.min((15 * Math.PI) / 180, 2 * Math.acos(1 / (1 + 0.02 / R))), n = Math.max(2, Math.ceil(ang / dth)), D = ang / n, rho = R / Math.cos(D / 2), ext = r * Math.tan(D / 2);
    const P = (th: number, rad = R): V3 => [R - rad * Math.cos(th), 0, rad * Math.sin(th)];
    const pts: V3[] = [P(0)]; for (let k = 0; k < n; k++) pts.push(P((k + 0.5) * D, rho)); pts.push(P(ang));
    for (let k = 0; k + 1 < pts.length; k++) { const a = pts[k], b = pts[k + 1], u = unit(sub(b, a)), a2 = k > 0 ? add(a, u, -ext) : a, b2 = k + 2 < pts.length ? add(b, u, ext) : b; out.push(cylL(a2, b2, r, 'elbow')); }
  } else if (part.kind === 'TEE' && part.id.startsWith('TEE|')) {
    out = teeMeshPrims(part);
  } else if (part.kind === 'STUD' && part.dims.n) {
    // a stud set: each stud with its nuts as its own round, found by splitting the drawn studs by their angle about the joint's axis
    const n = Math.round(part.dims.n.value), P = buildGeometry(part).solids.flatMap(so => { const q: V3[] = []; for (let i = 0; i < so.mesh.positions.length; i += 3) q.push([so.mesh.positions[i], so.mesh.positions[i + 1], so.mesh.positions[i + 2]]); return q; });
    const ang = P.map(q => Math.atan2(q[1], q[0])), ord = ang.map((_, i) => i).sort((i, j) => ang[i] - ang[j]), gaps = ord.map((i, k) => ({ k, g: k + 1 < ord.length ? ang[ord[k + 1]] - ang[i] : ang[ord[0]] + 2 * Math.PI - ang[i] })).sort((x, y) => y.g - x.g).slice(0, n).map(x => x.k).sort((x, y) => x - y);
    const groups: V3[][] = []; for (let g = 0; g < gaps.length; g++) { const from = gaps[g] + 1, to = g + 1 < gaps.length ? gaps[g + 1] : gaps[0] + ord.length, grp: V3[] = []; for (let k = from; k <= to; k++) grp.push(P[ord[k % ord.length]]); groups.push(grp); }
    if (groups.length === n && groups.every(g => g.length > 0)) for (const g of groups) {
      const mn = [0, 1, 2].map(a => Math.min(...g.map(q => q[a]))), mx = [0, 1, 2].map(a => Math.max(...g.map(q => q[a]))), cx = (mn[0] + mx[0]) / 2, cy = (mn[1] + mx[1]) / 2;
      const r = Math.max(...g.map(q => Math.hypot(q[0] - cx, q[1] - cy))); out.push(cylL([cx, cy, mn[2]], [cx, cy, mx[2]], r, `stud of ${n}`));
    }
  }
  if (!out.length) {
    for (const so of buildGeometry(part).solids) {
      const P = so.mesh.positions; if (!P || P.length < 3) continue;
      // a valve's body and bonnet are cut into slabs along the stem (its frame's y), each slab enveloped on its own: a yoke narrows to its stem nut
      const whole = envelopeOf(P, so.name), slabs = part.kind === 'VALVE' && whole?.t === 1 && so.mesh.indices?.length ? slabCut(P, so.mesh.indices, 1) : [P];
      for (const Q of slabs) {
        const best = envelopeOf(Q, so.name); if (!best) continue;
        if (isSupport && BEARING.test(so.name)) best.bear = true;
        if (isSupport && /^anchor rods/.test(so.name)) best.anchor = true;
        if (part.kind === 'ANCHOR_ROD' || (!isSupport && /anchor (bolt|rod)/i.test(so.name))) best.anchor = true;
        out.push(best);
      }
    }
    // drop an envelope that lies inside another of the same part (a valve's seat rings inside its body): it adds nothing
    const keep = out.map(() => true);
    for (let i = 0; i < out.length; i++) {
      const [mn, mx] = lBox(out[i]), cs: V3[] = []; for (let k = 0; k < 8; k++) cs.push([k & 1 ? mx[0] : mn[0], k & 2 ? mx[1] : mn[1], k & 4 ? mx[2] : mn[2]]);
      for (let j = 0; j < out.length; j++) if (j !== i && keep[j] && out[j].bear === out[i].bear && cs.every(p => insideL(out[j], p))) { keep[i] = false; break; }
    }
    out = out.filter((_, i) => keep[i]);
  }
  lcache.set(part, out); return out;
}
/** a tee from its key: the run, and the branch up the frame's y to its outlet (teeC, the catalogue's centre-to-end, SW-FIT-2) */
function teePrims(key: string): LPrim[] {
  const k = key.split('|'), cls = k[2] as PipeClass, OD = pipeDims(Number(k[1]), cls).OD, C = teeC(OD), br = pipeDims(Number(k[3]), cls).OD / 2;
  return [cylL([0, 0, -C], [0, 0, C], OD / 2, 'tee run'), cylL([0, 0, 0], [0, C, 0], br, 'tee branch')];
}
/** review fix: a tee as drawn. The catalogue's tee is meshed with a blended crotch that stands up to 3 % of its OD outside the run and the branch
 *  (0.72 in on a 24 in tee), so the nominal two rounds of teePrims did not hold it. Here the run and the branch are fitted to the drawn points
 *  away from the crotch, and every drawn point outside both is held by one more envelope (a box, checked on the meshes) */
function teeMeshPrims(part: PartSpec): LPrim[] {
  const k = part.id.split('|'), cls = k[2] as PipeClass, r = pipeDims(Number(k[1]), cls).OD / 2, br = pipeDims(Number(k[3]), cls).OD / 2;
  const P: number[] = []; for (const so of buildGeometry(part).solids) for (let i = 0; i < so.mesh.positions.length; i++) P.push(so.mesh.positions[i]);
  let z0 = Infinity, z1 = -Infinity, y1 = -Infinity, rr = r, rb = br;
  for (let i = 0; i < P.length; i += 3) { const x = P[i], y = P[i + 1], z = P[i + 2]; z0 = Math.min(z0, z); z1 = Math.max(z1, z); y1 = Math.max(y1, y); if (Math.abs(z) >= 1.25 * br) rr = Math.max(rr, Math.hypot(x, y)); if (y >= 1.25 * r) rb = Math.max(rb, Math.hypot(x, z)); }
  const run = cylL([0, 0, z0], [0, 0, z1], rr, 'tee run'), bra = cylL([0, 0, 0], [0, y1, 0], rb, 'tee branch'), out: LPrim[] = [run, bra];
  const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity]; let n = 0;
  for (let i = 0; i < P.length; i += 3) { const q: V3 = [P[i], P[i + 1], P[i + 2]]; if (insideL(run, q) || insideL(bra, q)) continue; n++; for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], q[a]); mx[a] = Math.max(mx[a], q[a]); } }
  if (n) out.push({ t: 1, c: [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2], u: [0, 0, 1], h: 0, r: 0, e: AX, s: [(mx[0] - mn[0]) / 2 + 1e-6, (mx[1] - mn[1]) / 2 + 1e-6, (mx[2] - mn[2]) / 2 + 1e-6], nm: 'tee crotch', bear: false, anchor: false });
  return out;
}
// the envelopes of the catalogue's slow parts (valves and olets are meshed from distance fields, seconds each) are kept on disk between runs, by part key
const ENV_VERSION = 'routes-env-5', ENV_FILE = `${CACHE_DIR}/env-cache.json`;
const envDisk: Record<string, LPrim[]> = (() => { try { const j = JSON.parse(readFileSync(ENV_FILE, 'utf8')); return j.version === ENV_VERSION ? j.entries : {}; } catch { return {}; } })();
let envDirty = 0;
function envOf(key: string): LPrim[] {
  // a tee's drawn envelopes are kept under their own name (the cache of the first version held none for tees)
  const ck = key.startsWith('TEE|') ? `drawn-tee:${key}` : key, d = envDisk[ck]; if (d) return d;
  const part = partFromKey(key), L = localPrims(part);
  if (part.kind === 'VALVE' || part.kind === 'FITTING' || part.kind === 'STUD' || part.kind === 'TEE') { envDisk[ck] = L; envDirty++; }
  return L;
}
/** the smaller of a point set's box and its round about a box axis (each encloses every point) */
function envelopeOf(P: ArrayLike<number>, nm: string): LPrim | undefined {
  const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < P.length; i += 3) for (let a = 0; a < 3; a++) { const v = P[i + a]; if (v < mn[a]) mn[a] = v; if (v > mx[a]) mx[a] = v; }
  if (!Number.isFinite(mn[0])) return undefined;
  const ex = [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]], c: V3 = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2];
  let bestVol = ex[0] * ex[1] * ex[2], best: LPrim = { t: 1, c, u: [0, 0, 1], h: 0, r: 0, e: AX, s: [ex[0] / 2, ex[1] / 2, ex[2] / 2], nm, bear: false, anchor: false };
  for (let k = 0; k < 3; k++) {
    const i = (k + 1) % 3, j = (k + 2) % 3; let R2 = 0;
    for (let q = 0; q < P.length; q += 3) { const di = P[q + i] - c[i], dj = P[q + j] - c[j], v = di * di + dj * dj; if (v > R2) R2 = v; }
    const vol = Math.PI * R2 * ex[k]; if (vol < bestVol * 0.999) { bestVol = vol; best = { t: 0, c, u: AX[k], h: ex[k] / 2, r: Math.sqrt(R2), e: AX, s: [0, 0, 0], nm, bear: false, anchor: false }; }
  }
  return best;
}
/** a mesh cut into slabs along axis k, about 3 in thick (at most 8): each slab's points are the triangles clipped to it */
function slabCut(P: number[], I: number[], k: number): number[][] {
  let lo = Infinity, hi = -Infinity; for (let i = k; i < P.length; i += 3) { lo = Math.min(lo, P[i]); hi = Math.max(hi, P[i]); }
  const m = Math.max(1, Math.min(8, Math.ceil((hi - lo) / 3))); if (m === 1) return [P];
  const out: number[][] = Array.from({ length: m }, () => []);
  const clip = (poly: V3[], t: number, keepAbove: boolean): V3[] => { const r: V3[] = []; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], ia = keepAbove ? a[k] >= t : a[k] <= t, ib = keepAbove ? b[k] >= t : b[k] <= t; if (ia) r.push(a); if (ia !== ib) { const f = (t - a[k]) / (b[k] - a[k]); r.push([a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1]), a[2] + f * (b[2] - a[2])]); } } return r; };
  for (let q = 0; q < I.length; q += 3) {
    const tri: V3[] = [0, 1, 2].map(o => [P[3 * I[q + o]], P[3 * I[q + o] + 1], P[3 * I[q + o] + 2]] as V3), tlo = Math.min(tri[0][k], tri[1][k], tri[2][k]), thi = Math.max(tri[0][k], tri[1][k], tri[2][k]);
    for (let j = Math.max(0, Math.floor(((tlo - lo) / (hi - lo)) * m)); j <= Math.min(m - 1, Math.floor(((thi - lo) / (hi - lo)) * m)); j++) {
      const t0 = lo + ((hi - lo) * j) / m, t1 = lo + ((hi - lo) * (j + 1)) / m; let poly = clip(tri, t0, true); if (poly.length) poly = clip(poly, t1, false);
      for (const v of poly) out[j].push(v[0], v[1], v[2]);
    }
  }
  return out.filter(o => o.length);
}
const prims: Prim[] = [];
const triCache = new Map<string, Float64Array>();   // the world triangles of pieces' solids, the most recently used kept (see trisOf)
function placePrims(part: PartSpec | LPrim[], W: M4, piece: number): number[] {
  const ids: number[] = [];
  for (const L of Array.isArray(part) ? part : localPrims(part)) {
    const c = xf(W, L.c); let P: Prim;
    if (L.t === 0) P = { ...L, c, u: unit(rv(W, L.u)), mn: [0, 0, 0], mx: [0, 0, 0], p: piece };
    else P = { ...L, c, e: [unit(rv(W, L.e[0])), unit(rv(W, L.e[1])), unit(rv(W, L.e[2]))], mn: [0, 0, 0], mx: [0, 0, 0], p: piece };
    const [mn, mx] = lBox(P); P.mn = mn; P.mx = mx; ids.push(prims.length); prims.push(P);
  }
  return ids;
}

// ------------------------------------------------------------------------------------------------ narrow phase
function extOf(P: Prim, nx: number, ny: number, nz: number): number {
  if (P.t === 0) { const un = P.u[0] * nx + P.u[1] * ny + P.u[2] * nz; return P.h * Math.abs(un) + P.r * Math.sqrt(Math.max(0, 1 - un * un)); }
  const e = P.e, s = P.s;
  return s[0] * Math.abs(e[0][0] * nx + e[0][1] * ny + e[0][2] * nz) + s[1] * Math.abs(e[1][0] * nx + e[1][1] * ny + e[1][2] * nz) + s[2] * Math.abs(e[2][0] * nx + e[2][1] * ny + e[2][2] * nz);
}
function closestOnBox(B: Prim, p: V3): V3 { const w = sub(p, B.c); let q = B.c; for (let i = 0; i < 3; i++) { const t = Math.max(-B.s[i], Math.min(B.s[i], dot(w, B.e[i]))); q = add(q, B.e[i], t); } return q; }
/** min over unit n of (cA-cB).n + extA(n) + extB(n): the penetration depth if positive, minus the separation if negative. `exact` false: return as soon as a separating direction is seen */
function depth(A: Prim, B: Prim, exact = false): { d: number; n: V3 } {
  const D = sub(A.c, B.c); let best = Infinity, bn: V3 = [0, 0, 1];
  const top: { v: number; n: V3 }[] = [];
  const q = (n: V3) => D[0] * n[0] + D[1] * n[1] + D[2] * n[2] + extOf(A, n[0], n[1], n[2]) + extOf(B, n[0], n[1], n[2]);
  let sep = false;
  const test = (n0: V3) => {
    const l = len(n0); if (l < 1e-9) return; const n: V3 = [n0[0] / l, n0[1] / l, n0[2] / l];
    for (const m of [n, [-n[0], -n[1], -n[2]] as V3]) { const v = q(m); top.push({ v, n: m }); if (v < best) { best = v; bn = m; } }
    if (best < -1e-9) sep = true;
  };
  const axA: V3[] = A.t === 0 ? [A.u] : A.e, axB: V3[] = B.t === 0 ? [B.u] : B.e;
  for (const a of axA) { test(a); if (sep && !exact) return { d: best, n: bn }; }
  for (const b of axB) { test(b); if (sep && !exact) return { d: best, n: bn }; }
  for (const a of axA) for (const b of axB) { test(cross(a, b)); if (sep && !exact) return { d: best, n: bn }; }
  if (A.t === 1 && B.t === 1) return { d: best, n: bn };   // two boxes: the 15 axes are exact
  test(D);
  for (const P of [A, B]) if (P.t === 0) { const w = add(D, P.u, -dot(D, P.u)); test(w); }
  if (A.t === 0 && B.t === 0) { const s = segSeg(add(A.c, A.u, -A.h), add(A.c, A.u, A.h), add(B.c, B.u, -B.h), add(B.c, B.u, B.h)); test(sub(s.c1, s.c2)); test(add(sub(s.c1, s.c2), A.u, -dot(sub(s.c1, s.c2), A.u))); test(add(sub(s.c1, s.c2), B.u, -dot(sub(s.c1, s.c2), B.u))); }
  else {
    const C = A.t === 0 ? A : B, X = A.t === 0 ? B : A, sg = A.t === 0 ? 1 : -1;
    for (let k = 0; k < 8; k++) { let p = X.c; for (let i = 0; i < 3; i++) p = add(p, X.e[i], (k >> i) & 1 ? X.s[i] : -X.s[i]); const w = sub(C.c, p), wr = add(w, C.u, -dot(w, C.u)); test(sg > 0 ? wr : [-wr[0], -wr[1], -wr[2]]); }
    for (let k = 0; k <= 4; k++) { const p = add(C.c, C.u, -C.h + (2 * C.h * k) / 4), b = closestOnBox(X, p), w = sub(p, b); test(sg > 0 ? w : [-w[0], -w[1], -w[2]]); }
  }
  if (sep && !exact) return { d: best, n: bn };
  // refine from the best few by a pattern search on the sphere
  top.sort((x, y) => x.v - y.v);
  const starts: V3[] = []; for (const t of top) { if (starts.length >= 3) break; if (starts.every(s => dot(s, t.n) < 0.995)) starts.push(t.n); }
  for (const s0 of starts) {
    let n = s0, f = q(n), step = 0.3;
    while (step > 2e-6) {
      const t1 = unit(Math.abs(n[0]) < 0.9 ? cross(n, [1, 0, 0]) : cross(n, [0, 1, 0])), t2 = cross(n, t1); let moved = false;
      for (const [x, y] of [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7071, 0.7071], [-0.7071, 0.7071], [0.7071, -0.7071], [-0.7071, -0.7071]]) {
        const m = unit([n[0] + step * (x * t1[0] + y * t2[0]), n[1] + step * (x * t1[1] + y * t2[1]), n[2] + step * (x * t1[2] + y * t2[2])]), v = q(m);
        if (v < f - 1e-12) { f = v; n = m; moved = true; break; }
      }
      if (!moved) step *= 0.5;
      if (!exact && f < -1e-9) break;
    }
    if (f < best) { best = f; bn = n; }
    if (!exact && best < -1e-9) break;
  }
  return { d: best, n: bn };
}

if (process.env.SELFTEST === '1') {
  const mk = (L: LPrim): Prim => { const P = { ...L, mn: [0, 0, 0] as V3, mx: [0, 0, 0] as V3, p: 0 }; const [a, b] = lBox(P); P.mn = a; P.mx = b; return P; };
  const box = (c: V3, s: V3, e: [V3, V3, V3] = AX): Prim => mk({ t: 1, c, u: [0, 0, 1], h: 0, r: 0, e, s, nm: 'b', bear: false, anchor: false });
  const cyl = (a: V3, b: V3, r: number) => mk(cylL(a, b, r, 'c'));
  const cases: [string, Prim, Prim, number][] = [
    ['crossing pipes r1+r1, axes 1.5 apart', cyl([-10, 0, 0], [10, 0, 0], 1), cyl([0, 1.5, -10], [0, 1.5, 10], 1), 0.5],
    ['crossing pipes 3 apart (gap 1)', cyl([-10, 0, 0], [10, 0, 0], 1), cyl([0, 3, -10], [0, 3, 10], 1), -1],
    ['parallel pipes 1.8 apart', cyl([-10, 0, 0], [10, 0, 0], 1), cyl([-5, 0, 1.8], [5, 0, 1.8], 1), 0.2],
    ['coaxial end to end, 0.5 overlap', cyl([0, 0, 0], [10, 0, 0], 2), cyl([9.5, 0, 0], [20, 0, 0], 1), 0.5],
    ['pipe on box top sunk 0.3', cyl([-10, 0, 0], [10, 0, 0], 2), box([0, -3.7, 0], [4, 2, 4]), 0.3],
    ['pipe over box corner diagonal gap', cyl([-10, 0, 0], [10, 0, 0], 1), box([0, -2, -2], [20, 0.5, 0.5]), -(Math.hypot(1.5, 1.5) - 1)],
    ['disc beside disc, flat ends 0.25', cyl([0, 0, 0], [0, 0, 1], 10), cyl([0, 0, 0.75], [0, 0, 2], 3), 0.25],
    ['rotated boxes', box([0, 0, 0], [1, 1, 1]), box([2.2, 0, 0], [1, 1, 1], [unit([1, 1, 0]), unit([-1, 1, 0]), [0, 0, 1]]), Math.SQRT2 - 1.2],
  ];
  for (const [n, A, B, want] of cases) { const g = depth(A, B, true).d; console.log(`${Math.abs(g - want) < 1e-3 ? 'ok  ' : 'FAIL'} ${n}: ${g.toFixed(5)} (want ${want.toFixed(5)})`); }
  for (const key of ['TEE|8|P300|6', 'TEE|12|P150|3', 'TEE|3|P600|3']) { const k = key.split('|'); console.log(key, 'C part', partFromKey(key).dims.C.value, 'teeC', teeC(pipeDims(Number(k[1]), k[2] as PipeClass).OD)); }
  for (const key of ['EL|8|P300|90', 'TEE|8|P300|6', 'WNF|8|P300', 'STUDS|8|P300|3.500', 'VLV|GATE|8|P300', 'SHOE|8|P300|guide|8.000', 'STAN|8|P300|30.00', 'HANG|8|P300|40.00']) { const pp = partFromKey(key); console.log(key, pp.id, localPrims(pp).map(L => `${L.nm}:${L.t ? 'box' : 'cyl'}${L.bear ? '*' : ''}${L.t ? ' s=' + L.s.map(v => v.toFixed(2)) : ' r=' + L.r.toFixed(3) + ' h=' + L.h.toFixed(3)}`).join(' | ')); }
  process.exit(0);
}

// ------------------------------------------------------------------------------------------------ the plant's pieces
type Cat = 'comp' | 'pen' | 'ncomp' | 'sup' | 'static';
interface Piece {
  id: number; cat: Cat; model: string; owner: string; line: string; tag: string; kind: string; key: string;
  ci: number; a: V3; b: V3; ports: V3[]; studs: boolean; NPS: number; cls: string; W: M4;
  equip?: string; onRun?: string; runPt?: V3; supLine?: string; supType?: string;
  struct?: string; tags?: string[]; src?: string; foundation?: boolean; ground?: boolean; grating?: boolean; plantOwn?: boolean; part?: PartSpec;
  /** a weld (review fix: the drawn weld beads are pieces too): the tags of the two pieces it joins, and its axis */ joins?: string[]; wdir?: V3;
  prims: number[];
}
const pieces: Piece[] = [];
interface Comp { tag: string; kind: string; key: string; T: M4; a: V3; b: V3; NPS: number; cls: string; e1?: string; e2?: string; onRun?: string }
interface Sup { id: string; line: string; type: string; at: V3; key: string; T: M4 }
interface WeldR { id: string; line: string; type: string; at: V3; dir: V3; joins: [string, string]; NPS: number; key: string; T: M4 }
interface LineRec { no: string; NPS: number; cls: string; kind: string; from: string; to: string; comps: Comp[]; supports: Sup[]; path: V3[]; pens?: Comp[]; side?: Comp[]; welds?: WeldR[] }
interface NozRec { id: string; equip: string; NPS: number; cls: string; face: V3; u: V3; comps: Comp[]; welds?: WeldR[] }
interface Model { lines: LineRec[]; nozzles: NozRec[]; cuts?: { x: number; y: number; z: number; r: number }[] }
interface LineInfo { key: string; model: string; rec: LineRec; M: M4; chain: number[]; all: number[]; sups: number[]; OD: number; path: V3[] }
const lines = new Map<string, LineInfo>();
const nozzles = new Map<string, { model: string; rec: NozRec; M: M4; pieces: number[] }>();
const links = new Map<string, Set<string>>();
const link = (a: string, b: string) => { for (const [x, y] of [[a, b], [b, a]]) { let s = links.get(x); if (!s) links.set(x, (s = new Set())); s.add(y); } };
const linked = (a: string, b: string) => a === b || (links.get(a)?.has(b) ?? false);
const cutsByModel = new Map<string, V3[]>(), cutR = new Map<V3, number>();

const tagOf = (no: string) => no;
function addComp(model: string, owner: string, line: string, c: Comp, M: M4, cat: Cat, ci: number, extra: Partial<Piece> = {}): number {
  const W = multiply(M, c.T) as M4, id = pieces.length;
  const a = xf(M, c.a), b = xf(M, c.b), ports = [a, b];
  if (c.kind === 'tee' && c.key.startsWith('TEE|')) { const k = c.key.split('|'); ports.push(xf(W, [0, teeC(pipeDims(Number(k[1]), k[2] as PipeClass).OD), 0])); }
  const pc: Piece = { id, cat, model, owner, line, tag: c.tag, kind: c.kind, key: c.key, ci, a, b, ports, studs: c.kind === 'studs', NPS: c.NPS, cls: c.cls, W, onRun: c.onRun, runPt: c.kind === 'olet' ? (c.e1 === 'X' ? a : b) : undefined, prims: [], ...extra };
  pieces.push(pc); pc.prims = placePrims(envOf(c.key), W, id); return id;
}
/** review fix: a drawn weld bead (the renderer draws every weld at its transform; a butt weld's cap stands 1/16 in proud of the pipe) */
let nWelds = 0;
function addWeld(model: string, owner: string, line: string, w: WeldR, M: M4, cat: Cat, extra: Partial<Piece> = {}): number {
  const W = multiply(M, w.T) as M4, id = pieces.length, at = xf(M, w.at);
  const pc: Piece = { id, cat, model, owner, line, tag: w.id, kind: 'weld', key: w.key, ci: -1, a: at, b: at, ports: [at], studs: false, NPS: w.NPS, cls: '', W, joins: w.joins, wdir: unit(rv(M, w.dir)), prims: [], ...extra };
  pieces.push(pc); pc.prims = placePrims(envOf(w.key), W, id); nWelds++; return id;
}

const cellList = cells();
const unitCell = (u: number) => { const c = cellList.find(q => q.plot.kind === 'unit' && q.plot.unit === u); if (!c) throw new Error(`no cell for unit ${u}`); return c; };
const M_CW: M4 = translate(0, 0, CWM.way) as M4;
const modelFiles: { name: string; M: M4; unit?: number }[] = [
  ...[11, 12, 13, 14, 15, 16, 17, 18, 19].map(u => { const c = unitCell(u); return { name: `unit-${u}`, M: unitToPipeway(c.plot, c.cell) as M4, unit: u }; }),
  { name: 'pipeway', M: I4 }, { name: 'cooling-water', M: M_CW },
];
const loaded = new Map<string, Model>();
for (const mf of modelFiles) {
  const f = `${MODELS}/${mf.name}.json`; if (!existsSync(f)) throw new Error(`missing ${f}`);
  loaded.set(mf.name, JSON.parse(readFileSync(f, 'utf8')) as Model);
}

// ---- the planted clashes (PLANT=1), made in memory before anything is built ----
const planted: string[] = [];
if (PLANT) {
  const pm = loaded.get('pipeway')!;
  type Cand = { l: LineRec; c: Comp; y: number; z: number; x0: number; x1: number; r: number };
  const runs: Cand[] = [];
  for (const l of pm.lines) for (const c of l.comps) if (c.kind === 'pipe' && Math.abs(c.a[1] - c.b[1]) < 1e-6 && Math.abs(c.a[2] - c.b[2]) < 1e-6 && Math.abs(c.b[0] - c.a[0]) >= 96) runs.push({ l, c, y: c.a[1], z: c.a[2], x0: Math.min(c.a[0], c.b[0]), x1: Math.max(c.a[0], c.b[0]), r: pipeDims(c.NPS, c.cls as PipeClass).OD / 2 });
  // (1) a copy of a pipe moved across into its nearest neighbour of another line on the same tier, 2 in deep
  let best: { A: Cand; B: Cand; gap: number } | undefined;
  for (const A of runs) for (const B of runs) if (A.l !== B.l && Math.abs(A.y - B.y) < 1e-6 && Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0) >= 48) { const gap = Math.abs(A.z - B.z) - A.r - B.r; if (gap > 0 && (!best || gap < best.gap)) best = { A, B, gap }; }
  if (best) {
    const { A, B, gap } = best, dz = Math.sign(B.z - A.z) * (gap + 2), c = A.c, T = [...c.T]; T[14] += dz;
    A.l.comps.push({ ...c, tag: `${c.tag}/PLANTED-PIPE`, T, a: [c.a[0], c.a[1], c.a[2] + dz], b: [c.b[0], c.b[1], c.b[2] + dz] });
    planted.push(`copy of ${c.tag} moved ${dz.toFixed(3)} in in z (gap was ${gap.toFixed(3)}) into ${B.c.tag} of ${B.l.no}: expect 2.000 in`);
  }
  // (2) a copy of a pipe on the lowest tier pushed down 2 in into the bent beams it crosses
  const low = runs.filter(R => R.y - R.r - PWY.tiers[0] >= 4 - 1e-6 && R.y - R.r - PWY.tiers[0] < 10 && R.x1 - R.x0 >= 300).sort((p, q) => Math.abs(p.z) - Math.abs(q.z))[0];
  if (low) {
    const dy = -(low.y - low.r - PWY.tiers[0]) - 2, c = low.c, T = [...c.T]; T[13] += dy;
    low.l.comps.push({ ...c, tag: `${c.tag}/PLANTED-BEAM`, T, a: [c.a[0], c.a[1] + dy, c.a[2]], b: [c.b[0], c.b[1] + dy, c.b[2]] });
    planted.push(`copy of ${c.tag} (${low.l.no}) moved ${dy.toFixed(3)} in down: its bottom 2 in below the tier-1 beam tops (y ${PWY.tiers[0]}): expect 2.000 in against the bent beams`);
  }
  // (4) review: a copy of a pipeway shoe pushed 2 in down: its base and guide angles sunk 2 in into the beam they stood on (before the review fix a
  // bearing plate was excused in any static solid at any depth, and this was not reported)
  { const l = pm.lines.find(q => q.supports.some(s => s.type === 'shoe')), s = l?.supports.find(q => q.type === 'shoe');
    if (l && s) { const T = [...s.T]; T[13] -= 2; l.supports.push({ ...s, id: `${s.id}/PLANTED-SUNK`, T, at: [s.at[0], s.at[1] - 2, s.at[2]] }); planted.push(`copy of shoe ${s.id} (${l.no}) moved 2 in down: its base sunk 2 in into the steel it rests on: expect 2.000 in (support-static)`); } }
  // (5) review: a 2 in pipe of a line of its own laid beside the largest equal tee, along its run, its surface 3 % of the tee's OD/2 outside the run's
  // round: clear of the nominal tee the first version enveloped, inside the blended crotch the catalogue draws (it stands 6 % out)
  { let best: { m: Model; c: Comp; r: number } | undefined;
    for (const [, m] of loaded) for (const l of m.lines) for (const c of l.comps) { const k = c.key.split('|'); if (k[0] === 'TEE' && k[1] === k[3]) { const r = pipeDims(Number(k[1]), k[2] as PipeClass).OD / 2; if (!best || r > best.r) best = { m, c, r }; } }
    if (best) { const { m, c, r } = best, k = c.key.split('|'), C = teeC(2 * r), x0 = 1.03 * r + 1, T = multiply(c.T, translate(x0, 0, -C)) as M4;
      m.lines.push({ no: 'PLANTED-TEE', NPS: 2, cls: k[2], kind: 'routed', from: 'open', to: 'open', comps: [{ tag: 'PLANTED-TEE/p1', kind: 'pipe', key: `PIPE|2|${k[2]}|${(2 * C).toFixed(3)}`, T, a: xf(c.T, [x0, 0, -C]), b: xf(c.T, [x0, 0, C]), NPS: 2, cls: k[2], e1: 'BW', e2: 'BW' }], supports: [], path: [] });
      planted.push(`a 2 in pipe of its own line beside tee ${c.tag} (${c.key}), along its run, ${(0.03 * r).toFixed(3)} in clear of the nominal run: expect about ${(0.03 * r).toFixed(3)} in into the drawn crotch`); } }
  // (3) a shape defect: a copy of a pipe of a unit line laid back over a non-neighbour pipe of the same line, 1 in off its axis
  const um = loaded.get('unit-15')!;
  for (const l of um.lines) { const ps = l.comps.filter(c => c.kind === 'pipe' && dist(c.a, c.b) > 60); if (ps.length >= 3) { const c = ps[0], T = [...c.T]; T[13] += 1; l.comps.push({ ...c, tag: `${c.tag}/PLANTED-SELF`, T, a: [c.a[0], c.a[1] + 1, c.a[2]], b: [c.b[0], c.b[1] + 1, c.b[2]] }); planted.push(`copy of ${c.tag} (${l.no}) appended to its own line 1 in above itself: a same-line non-neighbour overlap and a broken chain`); break; } }
}

// ---- the lines, spools and nozzles of every model ----
for (const mf of modelFiles) {
  const m = loaded.get(mf.name)!, M = mf.M;
  for (const n of m.nozzles) {
    const owner = `N|${n.id}`, ids: number[] = [];
    n.comps.forEach((c, i) => ids.push(addComp(mf.name, owner, n.id, c, M, 'ncomp', i, { equip: n.equip })));
    for (const w of n.welds ?? []) addWeld(mf.name, owner, n.id, w, M, 'ncomp', { equip: n.equip });
    nozzles.set(n.id, { model: mf.name, rec: n, M, pieces: ids });
  }
  if (m.cuts?.length) cutsByModel.set(mf.name, m.cuts.map(c => { const p = xf(M, [c.x, c.y, c.z]); cutR.set(p, c.r); return p; }));
  for (const l of m.lines) {
    const key = `${mf.name}|L|${l.no}`, chain: number[] = [], all: number[] = [];
    let ci = 0;
    for (const c of l.comps) { const id = addComp(mf.name, key, l.no, c, M, 'comp', c.kind === 'studs' ? -1 : ci); if (c.kind !== 'studs') { chain.push(id); ci++; } all.push(id); }
    for (const c of l.pens ?? []) all.push(addComp(mf.name, key, l.no, c, M, 'pen', -1));
    for (const c of l.side ?? []) all.push(addComp(mf.name, key, l.no, c, M, 'comp', -1));
    for (const w of l.welds ?? []) addWeld(mf.name, key, l.no, w, M, 'comp');
    const sups: number[] = [];
    for (const s of l.supports) {
      const W = multiply(M, s.T) as M4, part = partFromKey(s.key), id = pieces.length, at = xf(M, s.at);
      const pc: Piece = { id, cat: 'sup', model: mf.name, owner: `S|${mf.name}|${s.id}`, line: s.line, tag: s.id, kind: `support:${s.type}`, key: s.key, ci: -1, a: at, b: at, ports: [], studs: false, NPS: l.NPS, cls: l.cls, W, supLine: `${mf.name}|L|${s.line}`, supType: s.type, prims: [] };
      pieces.push(pc); pc.prims = placePrims(part, W, id); sups.push(id);
    }
    lines.set(key, { key, model: mf.name, rec: l, M, chain, all, sups, OD: pipeDims(l.NPS, l.cls as PipeClass).OD, path: (l.path ?? []).map(p => xf(M, p)) });
    for (const e of [l.from, l.to]) { if (e.startsWith('tap ')) link(key, `${mf.name}|L|${e.slice(4)}`); else if (/-/.test(e) && !e.includes(' ')) link(key, `N|${e}`); }
    for (const c of l.comps) { const t = c.tag.indexOf('/T:'); if (c.kind === 'tee' && t >= 0) link(key, `${mf.name}|L|${c.tag.slice(t + 3)}`); if (c.onRun) link(key, `${mf.name}|L|${c.onRun}`); }
  }
}
// the two nozzles of a spool body are one piece of pipe
{ const byEquip = new Map<string, string[]>(); for (const [id, n] of nozzles) { const l = byEquip.get(n.rec.equip) ?? []; l.push(id); byEquip.set(n.rec.equip, l); } for (const ids of byEquip.values()) for (const a of ids) for (const b of ids) if (a < b) link(`N|${a}`, `N|${b}`); }
const nPipingPieces = pieces.length;
const byTag = new Map<string, number[]>(); for (const P of pieces) if (P.cat !== 'sup' && P.kind !== 'weld') { const l = byTag.get(P.tag) ?? []; l.push(P.id); byTag.set(P.tag, l); }
/** the pieces a weld joins: by tag, in its own model first */
const joinedOf = (Wd: Piece): Piece[] => (Wd.joins ?? []).flatMap(t => { const l = (byTag.get(t) ?? []).map(i => pieces[i]), own = l.filter(q => q.model === Wd.model); return own.length ? own : l; });
const studsBy = new Map<string, number[]>(); for (const P of pieces) if (P.studs) { const l = studsBy.get(P.owner) ?? []; l.push(P.id); studsBy.set(P.owner, l); }
log(`${nPipingPieces} piping pieces (${nWelds} of them welds; ${prims.length} envelopes) from ${modelFiles.length} models`);

// ---- the steel, equipment and concrete ----
let nStatic = 0;
const FOUNDATION_KINDS = new Set(['CONCRETE', 'FOOTING', 'PEDESTAL', 'PAD', 'SLAB', 'PIER', 'GRADE_BEAM', 'GROUT', 'PILE_CAP', 'SLEEPER', 'ANCHOR_ROD', 'MACHINE_BLOCK', 'RETAINING_WALL']);
const GROUND_KINDS = new Set(['PIT', 'SUMP', 'BASIN', 'TRENCH', 'MANHOLE', 'CULVERT', 'DUCT_BANK']);
function addStatic(src: string, struct: string, part: PartSpec, W: M4, tags: string[], plantOwn: boolean) {
  const id = pieces.length, pc: Piece = { id, cat: 'static', model: src, owner: struct, line: struct, tag: tags.join('/'), kind: part.kind, key: part.id, ci: -1, a: [W[12], W[13], W[14]], b: [W[12], W[13], W[14]], ports: [], studs: false, NPS: 0, cls: '', W, struct, tags, src, foundation: FOUNDATION_KINDS.has(part.kind), ground: GROUND_KINDS.has(part.kind), grating: part.kind === 'GRATING' || part.kind === 'GRATING_TREAD', plantOwn, part, prims: [] };
  pieces.push(pc); pc.prims = placePrims(part, W, id); nStatic++;
}
const EQTAG = /^[A-Z]{1,3}-\d{3,4}[A-Z]?$/;
function cellStruct(cell: string, tags: string[]): string {
  const t0 = tags[0] ?? '';
  if (tags.includes('equipment') || (EQTAG.test(t0) && (tags.includes('pad') || tags.includes('pier')))) return `${cell}:eq:${t0}`;
  if (t0.startsWith('rack-') || t0 === 'cooler-deck') return `${cell}:rack`;
  if (t0 === 'yard-support') return `${cell}:yard`;
  const j = /^([A-Z]+-\d+)-(deck|stair)$/.exec(t0); if (j) return `${cell}:${j[1]}-structure`;
  return `${cell}:${t0}`;
}
for (const { plot, cell } of cellList) {
  const src = plot.kind === 'unit' ? `cell-U${plot.unit}` : `cell-${plot.id}`, M = unitToPipeway(plot, cell) as M4;
  for (const pl of cell.interior.instances) { if (pl.tags.includes('keep-out')) continue; addStatic(src, cellStruct(src, pl.tags), pl.part, multiply(M, pl.transform as M4) as M4, pl.tags, false); }
}
log(`unit cells: ${nStatic} instances`);
// the pipeway's own steel (its copies of the units' valve-bay steel, tagged unit-NN, are left out: the cells are authoritative)
const pwBoxes: [V3, V3][] = [];
{
  const before = nStatic, cacheFile = `${CACHE_DIR}/pw-steel-cache.json`;
  type CP = { src: string; struct: string; tags: string[]; kind: string; key: string; W: M4; f: boolean; g: boolean; gr: boolean; prims: LPrim[] };
  if (PW_CACHE && existsSync(cacheFile)) {
    for (const c of JSON.parse(readFileSync(cacheFile, 'utf8')) as CP[]) {
      const id = pieces.length, pc: Piece = { id, cat: 'static', model: c.src, owner: c.struct, line: c.struct, tag: c.tags.join('/'), kind: c.kind, key: c.key, ci: -1, a: [c.W[12], c.W[13], c.W[14]], b: [c.W[12], c.W[13], c.W[14]], ports: [], studs: false, NPS: 0, cls: '', W: c.W, struct: c.struct, tags: c.tags, src: c.src, foundation: c.f, ground: c.g, grating: c.gr, plantOwn: true, prims: [] };
      pieces.push(pc); for (const L of c.prims) { const P: Prim = { ...L, mn: [0, 0, 0], mx: [0, 0, 0], p: id }; const [mn, mx] = lBox(P); P.mn = mn; P.mx = mx; pc.prims.push(prims.length); prims.push(P); } nStatic++;
    }
    log('pipeway steel from the cache (development only)');
  } else {
    const pw = pipeway();
    for (const pl of pw.interior.instances) {
      if (pl.tags.includes('keep-out') || pl.tags.some(t => /^unit-\d+$/.test(t))) continue;
      const struct = pl.tags.includes('junction') ? `pipeway:${pl.tags.find(t => t.startsWith('junction:')) ?? 'junction'}` : 'pipeway:rack';
      addStatic('pipeway-steel', struct, pl.part, pl.transform as M4, pl.tags, true);
    }
    if (PW_CACHE) writeFileSync(cacheFile, JSON.stringify(pieces.slice(pieces.length - (nStatic - before)).map(p => ({ src: p.src, struct: p.struct, tags: p.tags, kind: p.kind, key: p.key, W: p.W, f: p.foundation, g: p.ground, gr: p.grating, prims: p.prims.map(i => { const { mn, mx, p: _p, ...L } = prims[i]; return L; }) }))));
  }
  for (const p of pieces.slice(pieces.length - (nStatic - before))) if (p.tags!.includes('junction') || p.tags!.some(t => t.startsWith('rack'))) { const ps = p.prims.map(i => prims[i]); pwBoxes.push([[Math.min(...ps.map(q => q.mn[0])), Math.min(...ps.map(q => q.mn[1])), Math.min(...ps.map(q => q.mn[2]))], [Math.max(...ps.map(q => q.mx[0])), Math.max(...ps.map(q => q.mx[1])), Math.max(...ps.map(q => q.mx[2]))]]); }
  log(`pipeway steel: ${nStatic - before} instances`);
}
// the pipe frames of plant 3's own (SW-RPI-17), from each model's report
let nFrames = 0;
for (const mf of modelFiles) {
  const f = `${MODELS}/${mf.name}.report.json`; if (!existsSync(f)) continue;
  const rep = JSON.parse(readFileSync(f, 'utf8')) as { frames?: FrameSpec[] };
  (rep.frames ?? []).forEach((fs, i) => { for (const pl of framePlaced(fs)) addStatic(`frames:${mf.name}`, `frame:${mf.name}:${i}:${fs.line}`, pl.part, multiply(mf.M, pl.transform as M4) as M4, pl.tags, true); nFrames++; });
}
// the cooling water mains' sleepers (SW-CWM-2), rebuilt from coolingWater.ts's own rule: on the main rack's bent lines along the way, left out within 3 in of the pipeway's steel
let nSleepers = 0, sleeperNote = '';
{
  const rep = JSON.parse(readFileSync(`${MODELS}/cooling-water.report.json`, 'utf8')) as { way: { x0: number; x1: number }; sleepers: number };
  const cw = loaded.get('cooling-water')!, mains = cw.lines.filter(l => l.kind === 'routed' && !l.from.startsWith('tap') && !l.to.startsWith('tap'));
  const NPS = mains[0].NPS, cls = mains[0].cls as PipeClass, OD = pipeDims(NPS, cls).OD, fl = designFlange(NPS, cls).OD, up6 = (v: number) => Math.ceil(v / 6 - 1e-9) * 6;
  const pitch = up6(Math.max(fl + 6, gateWidth(NPS, cls) + 3)), lanes = [0, -pitch], zs0 = Math.min(...lanes) - OD / 2 - CWM.sleeperOver, zs1 = Math.max(...lanes) + OD / 2 + CWM.sleeperOver;
  const laneZ = [...new Set(mains.flatMap(l => l.path.filter((p, i) => i > 0 && Math.abs(p[1] - l.path[i - 1][1]) < 1e-6 && Math.abs(p[2] - l.path[i - 1][2]) < 1e-6 && Math.abs(p[0] - l.path[i - 1][0]) > 1000).map(p => p[2])))];
  const kit = interiorKit({ pedestal: 6, padHeight: 6 }, [], {}); let left = 0;
  for (let x = rep.way.x0; x <= rep.way.x1 - CWM.sleeperW / 2 + 1e-6; x += PWY.bent) {
    const mn: V3 = [x - CWM.sleeperW / 2 - 3, 0, zs0 + CWM.way - 3], mx: V3 = [x + CWM.sleeperW / 2 + 3, CWM.sleeperTop + 3, zs1 + CWM.way + 3];
    if (pwBoxes.some(b => b[0].every((v, k) => v < mx[k]) && b[1].every((v, k) => v > mn[k]))) { left++; continue; }
    addStatic('cw-sleepers', `sleeper:${x}`, kit.concrete('sleeper', CWM.sleeperW, CWM.sleeperTop, zs1 - zs0), multiply(M_CW, frameFromAxes([x, CWM.sleeperTop / 2, zs0], [0, 1, 0], [0, 0, 1]) as M4) as M4, ['sleeper', 'pad', `sleeper:${x}`], true); nSleepers++;
  }
  sleeperNote = `${nSleepers} sleepers rebuilt (${left} left out by the 3 in rule; the report says ${rep.sleepers}); lanes ${lanes.join(', ')} vs the mains' own long runs at z ${laneZ.join(', ')} (area frame)`;
  if (nSleepers !== rep.sleepers) console.error(`WARNING: ${sleeperNote}`);
}
log(`${pieces.length} pieces, ${prims.length} envelopes (${nFrames} frames, ${sleeperNote})`);
// review guard: a piece with no envelope (a part drawn with no solid) would never be tested; and the grid's cell keys must not wrap
const bare = pieces.filter(P => !P.prims.length), bareKinds = [...new Set(bare.map(P => `${P.cat}:${P.kind}`))];
if (bare.length) console.error(`WARNING: ${bare.length} pieces have no envelope and are not tested (${bareKinds.join(', ')})`);
{ const bad = prims.filter(P => !P.mn.every(Number.isFinite) || !P.mx.every(Number.isFinite) || P.mn[0] < -600 * 48 || P.mn[1] < -600 * 48 || P.mx[1] >= (2048 - 600) * 48 || P.mn[2] < -2000 * 48 || P.mx[2] >= (4096 - 2000) * 48);
  if (bad.length) throw new Error(`${bad.length} envelopes outside the grid's range or not finite: the broad phase would miss them`); }

// ------------------------------------------------------------------------------------------------ relationships
const nearPt = (p: V3, q: V3, t = JOIN) => Math.abs(p[0] - q[0]) <= t && Math.abs(p[1] - q[1]) <= t && Math.abs(p[2] - q[2]) <= t && dist(p, q) <= t;
const sharePort = (P: Piece, Q: Piece, ends = false) => { const pp = ends ? [P.a, P.b] : P.ports, qq = ends ? [Q.a, Q.b] : Q.ports; return pp.some(p => qq.some(q => nearPt(p, q))); };
/** a stud set's axis passes through an end of the other piece, within the studs' length */
const studsAt = (S: Piece, X: Piece) => X.ports.some(p => { const r = ptSeg(p, S.a, S.b); return r.d <= JOIN && r.t >= -JOIN && r.t <= r.L + JOIN; });
const isPiping = (P: Piece) => P.cat === 'comp' || P.cat === 'pen' || P.cat === 'ncomp';
/** an olet's base on its run: its first point lies on the axis of a piece of the line it sits on */
const oletOn = (O: Piece, Q: Piece) => O.kind === 'olet' && !!O.onRun && !!O.runPt && Q.owner === `${O.model}|L|${O.onRun}` && Q.kind !== 'elbow' && ptSeg(O.runPt, Q.a, Q.b).d <= JOIN;
function cutThrough(P: Piece, G: Piece): boolean {
  const cuts = cutsByModel.get(P.model); if (!cuts || !G.grating) return false;
  const d = unit(sub(P.b, P.a)); if (Math.abs(d[1]) < 0.999) return false;
  // review fix: and the piece is no wider than the cut where it passes the grating (a flange or a valve body through a pipe's cut is a clash)
  const gy0 = Math.min(...G.prims.map(i => prims[i].mn[1])), gy1 = Math.max(...G.prims.map(i => prims[i].mx[1]));
  const fits = (c: V3) => P.prims.every(i => { const q = prims[i]; if (q.mx[1] < gy0 || q.mn[1] > gy1) return true;
    const rad = q.t === 0 && Math.abs(q.u[1]) > 0.999 ? Math.hypot(q.c[0] - c[0], q.c[2] - c[2]) + q.r : Math.max(...[0, 1, 2, 3].map(k => Math.hypot((k & 1 ? q.mx[0] : q.mn[0]) - c[0], (k & 2 ? q.mx[2] : q.mn[2]) - c[2])));
    return rad <= (cutR.get(c) ?? 0) + JOIN; });
  return cuts.some(c => Math.hypot(c[0] - P.a[0], c[2] - P.a[2]) <= JOIN && fits(c) && G.prims.some(i => { const g = prims[i]; return c[0] >= g.mn[0] && c[0] <= g.mx[0] && c[2] >= g.mn[2] && c[2] <= g.mx[2]; }));
}
const CARRIED = new Set(['pipe', 'nipple', 'elbow', 'tee', 'reducer', 'olet', 'weld']);
/** the relationship by which two pieces may touch, or '' if none; 'BEARING' means only a support's bearing plates are excused */
function relation(P: Piece, Q: Piece): string {
  if (P.cat === 'static' && Q.cat === 'static') return P.struct === Q.struct ? 'one structure' : '';
  if (Q.cat === 'static' && P.cat !== 'static') return relStatic(P, Q);
  if (P.cat === 'static') return relStatic(Q, P);
  if (P.cat === 'sup' || Q.cat === 'sup') {
    const S = P.cat === 'sup' ? P : Q, X = S === P ? Q : P;
    if (X.cat === 'sup') return '';
    // review fix: a support is excused against the run of its line it is clamped or welded to (pipes, elbows, tees, reducers, olets and their welds),
    // not against the line's flanges, gaskets, bolting, valves, blinds or caps (before: every piece of its line, at any depth)
    return X.owner === S.supLine && CARRIED.has(X.kind) ? 'support on its line' : '';
  }
  // piping and piping
  // review fix: a weld bead and the two pieces it joins (an olet's fillet weld and the run it sits on, by that olet)
  if (P.kind === 'weld' || Q.kind === 'weld') {
    const Wd = P.kind === 'weld' ? P : Q, X = Wd === P ? Q : P, J = joinedOf(Wd);
    if (J.includes(X)) return 'weld of its joint';
    if (X.kind !== 'weld' && J.some(o => oletOn(o, X))) return 'weld of an olet on its run';
    return '';
  }
  if (P.owner === Q.owner) {
    if (P.studs || Q.studs) { const S = P.studs ? P : Q, X = S === P ? Q : P; return !X.studs && studsAt(S, X) ? 'bolted joint' : ''; }
    if (P.cat === 'pen' || Q.cat === 'pen') { const S = P.cat === 'pen' ? P : Q, X = S === P ? Q : P, c = add(S.a, sub(S.b, S.a), 0.5); return ptSeg(c, X.a, X.b).d <= JOIN ? 'sleeve on its line' : ''; }
    if (P.cat === 'ncomp') return sharePort(P, Q, true) ? 'nozzle chain' : '';
    if (P.ci >= 0 && Q.ci >= 0 && Math.abs(P.ci - Q.ci) === 1 && sharePort(P, Q, true)) return 'chain neighbours';
    if ((studsBy.get(P.owner) ?? []).some(S => studsAt(pieces[S], P) && studsAt(pieces[S], Q))) return 'one bolted joint';
    return '';
  }
  if (!linked(P.owner, Q.owner)) return '';
  if (P.studs && !Q.studs && studsAt(P, Q)) return 'bolted joint';
  // two faces of one bolted joint (a gasket or a spade between them): a stud set of either side passes through both
  if (!P.studs && !Q.studs && [...(studsBy.get(P.owner) ?? []), ...(studsBy.get(Q.owner) ?? [])].some(S => studsAt(pieces[S], P) && studsAt(pieces[S], Q))) return 'one bolted joint';
  if (Q.studs && !P.studs && studsAt(Q, P)) return 'bolted joint';
  if (P.studs || Q.studs) return '';
  if (oletOn(P, Q) || oletOn(Q, P)) return 'olet on its run';
  if (sharePort(P, Q)) return P.cat === 'ncomp' && Q.cat === 'ncomp' ? 'spool body' : 'joined at a shared face';
  return '';
}
function relStatic(P: Piece, S: Piece): string {
  if (P.cat === 'sup') return 'BEARING';
  // review fix: a nozzle's pieces and its equipment's body, not the body's pads and piers (tagged with the same item)
  const body = !!S.tags && S.tags.includes('equipment') && !!S.struct?.includes(':eq:');
  // review fix: and only the body's solid that the nozzle's neck ends in (its shell), decided per envelope in the overlap pass: before, a nozzle was
  // excused against every solid of its item, its platforms' handrails and its ladders too
  if (P.cat === 'ncomp' && P.equip && S.tags && S.tags[0] === P.equip && body) return `NOZZLE:${P.line}`;
  if (P.kind === 'weld' && body) { const o = joinedOf(P).find(q => q.cat === 'ncomp' && q.equip === S.tags![0]); if (o) return `NOZZLE:${o.line}`; }
  // the studs of a line's joint at an equipment's nozzle pass through that body's own drawn flange there
  if (P.studs && S.struct?.includes(':eq:') && S.tags && [...(links.get(P.owner) ?? [])].some(o => o.startsWith('N|') && nozzles.get(o.slice(2))?.rec.equip === S.tags![0] && nozzles.get(o.slice(2))!.pieces.some(i => studsAt(P, pieces[i])))) return 'STUDS-EQ';   // review fix: decided per envelope, the body's own drawn flange only
  if ((P.cat === 'comp' || P.cat === 'pen') && cutThrough(P, S)) return 'through its grating cut';
  return '';
}

// ------------------------------------------------------------------------------------------------ broad phase
const CS = 48, ckey = (ix: number, iy: number, iz: number) => ((ix + 600) * 2048 + (iy + 600)) * 4096 + (iz + 2000);
const grid = new Map<number, number[]>();
for (let i = 0; i < prims.length; i++) {
  const P = prims[i];
  for (let x = Math.floor(P.mn[0] / CS); x <= Math.floor(P.mx[0] / CS); x++) for (let y = Math.floor(P.mn[1] / CS); y <= Math.floor(P.mx[1] / CS); y++) for (let z = Math.floor(P.mn[2] / CS); z <= Math.floor(P.mx[2] / CS); z++) { const k = ckey(x, y, z); let l = grid.get(k); if (!l) grid.set(k, (l = [])); l.push(i); }
}
log(`grid: ${grid.size} cells`);
function query(mn: V3, mx: V3): Set<number> {
  const out = new Set<number>();
  for (let x = Math.floor(mn[0] / CS); x <= Math.floor(mx[0] / CS); x++) for (let y = Math.floor(mn[1] / CS); y <= Math.floor(mx[1] / CS); y++) for (let z = Math.floor(mn[2] / CS); z <= Math.floor(mx[2] / CS); z++) for (const i of grid.get(ckey(x, y, z)) ?? []) { const P = prims[i]; if (P.mn[0] <= mx[0] && P.mx[0] >= mn[0] && P.mn[1] <= mx[1] && P.mx[1] >= mn[1] && P.mn[2] <= mx[2] && P.mx[2] >= mn[2]) out.add(i); }
  return out;
}

// ------------------------------------------------------------------------------------------------ findings
interface Who { model: string; line: string; tag: string; kind: string }
interface Finding { a: Who; b: Who; depthIn: number; at: V3; note: string; cls: string; rule?: string }
const findings: Finding[] = [];
const who = (P: Piece): Who => ({ model: P.cat === 'static' ? P.src! : P.model, line: P.cat === 'static' ? P.struct! : P.line, tag: P.tag, kind: P.cat === 'static' ? P.kind : P.kind });
const NONE = (tag: string, kind = '-'): Who => ({ model: '-', line: '-', tag, kind });
const descr = (P: Piece) => P.cat === 'static' ? `${P.kind} ${P.tag} (${P.src})` : P.cat === 'sup' ? `${P.kind} ${P.tag}` : P.cat === 'ncomp' ? `${P.kind} ${P.tag} of nozzle/spool ${P.line} (${P.model})` : `${P.kind} ${P.tag} (${P.model})`;

// ---- review fix: what each support bears on, as a shared face. Before, every bearing solid of a support (shoe base, guide angles, base plate,
// anchor rods, top plates) was excused against every static solid at any depth, and the solids it touched or sank into at any depth were its
// 'seat'. Now a static solid is a seat of the support only where a bearing plate (not an anchor rod) meets it face to face, within JOIN; a bearing
// plate is excused only on its seat and only to JOIN; anchor rods only in a seat. A plate sunk deeper, or a plate in anything else, is reported ----
// A hanger or trapeze is drawn with its top plate set in the member it hangs from: that member (the one holding the top plate's centre) is its seat too,
// and the top plate is excused in it at any depth (hangOf).
const seatOf = new Map<number, Set<number>>(), hangOf = new Map<number, Set<number>>();
for (const L of lines.values()) for (const si of L.sups) {
  const S = pieces[si], m = new Set<number>(), h = new Set<number>();
  for (const bi of S.prims) { const A = prims[bi]; if (!A.bear || A.anchor) continue; const top = /^top plate/.test(A.nm);
    for (const j of query([A.mn[0] - JOIN, A.mn[1] - JOIN, A.mn[2] - JOIN], [A.mx[0] + JOIN, A.mx[1] + JOIN, A.mx[2] + JOIN])) { const X = pieces[prims[j].p]; if (X.cat !== 'static') continue; const d = depth(A, prims[j], true).d; if (Math.abs(d) <= JOIN) m.add(X.id); if (top && insideL(prims[j], A.c)) { m.add(X.id); h.add(X.id); } } }
  seatOf.set(si, m); hangOf.set(si, h);
}
if (process.env.DEBUG_SUP) {
  const want = process.env.DEBUG_SUP.split(',');
  for (const P of pieces) if (P.cat === 'sup' && want.some(w => P.tag === w)) {
    console.log(`== ${P.model} ${P.tag} ${P.key} at ${r3(P.a)} seats: ${[...(seatOf.get(P.id) ?? [])].map(i => descr(pieces[i])).join('; ')}`);
    for (const i of P.prims) { const A = prims[i]; console.log(`  ${A.nm}${A.bear ? '*' : ''}${A.anchor ? '(anchor)' : ''} box ${r3(A.mn)} .. ${r3(A.mx)}`);
      for (const j of query([A.mn[0] - 1, A.mn[1] - 1, A.mn[2] - 1], [A.mx[0] + 1, A.mx[1] + 1, A.mx[2] + 1])) { const X = pieces[prims[j].p]; if (X.cat !== 'static') continue; const B = prims[j]; console.log(`     ${depth(A, B, true).d.toFixed(3)} ${descr(X)} [${B.nm}] box ${r3(B.mn)} .. ${r3(B.mx)}`); } }
  }
  process.exit(0);
}
// ---- review fix: a body's anchor bolts are excused only in a solid that the body itself stands on face to face (within JOIN); before, an anchor was
// excused against every static solid of any other structure ----
const anchorSeat = new Map<number, boolean>();
function anchoredIn(E: Piece, X: Piece, NPc: number): boolean {
  const k = E.id * NPc + X.id; let v = anchorSeat.get(k); if (v !== undefined) return v; v = false;
  for (const i of E.prims) { const A = prims[i]; if (A.anchor) continue; for (const j of X.prims) { const d = depth(A, prims[j], true).d; if (Math.abs(d) <= JOIN) { v = true; break; } } if (v) break; }
  anchorSeat.set(k, v); return v;
}
// ---- review fix: the solid of a nozzle's item that its neck ends in: a drawn point on the nozzle's axis about its far end lies inside that solid ----
const heldCache = new Map<string, boolean>();
function nozzleHeldBy(id: string, X: Piece, nm: string): boolean {
  const k = `${id}|${X.id}|${nm}`; let v = heldCache.get(k); if (v !== undefined) return v; v = false;
  const nz = nozzles.get(id);
  if (nz) {
    const face = xf(nz.M, nz.rec.face), u = unit(rv(nz.M, nz.rec.u)), ends = nz.pieces.flatMap(i => [pieces[i].a, pieces[i].b]), base = ends.reduce((m, p) => (dist(p, face) > dist(m, face) ? p : m), face);
    const T = trisOf(X, nm); if (T) v = [-1, -0.5, -0.1, 0, 0.1, 0.5, 1].some(t => inside(T, add(base, u, t)));
  }
  heldCache.set(k, v); return v;
}
// ---- every overlap between pieces not related ----
type PP = { d: number; at: V3; i: number; j: number; n: V3 };
const pairBest = new Map<number, PP>(), pairAll = new Map<number, PP[]>();
const relCache = new Map<number, string>();
let nPairs = 0, nNarrow = 0;
const NP = pieces.length;
const auditRel = new Map<string, { n: number; ex: string[] }>();
const auditNote = (why: string, PA: Piece, PB: Piece, A: Prim, B: Prim, d: number) => { let e = auditRel.get(why); if (!e) auditRel.set(why, (e = { n: 0, ex: [] })); e.n++; if (e.ex.length < (/support on its line|nozzle|NOW/.test(why) ? 400 : 40)) e.ex.push(`${d.toFixed(3)} ${PA.model}:${PA.kind} ${PA.tag} [${A.nm}] ~ ${PB.model}:${PB.kind} ${PB.tag} [${B.nm}]`); };
for (const [k, list] of grid) {
  const kx = Math.floor(k / (2048 * 4096)) - 600, ky = Math.floor((k % (2048 * 4096)) / 4096) - 600, kz = (k % 4096) - 2000;
  for (let ii = 0; ii < list.length; ii++) {
    const A = prims[list[ii]], PA = pieces[A.p];
    for (let jj = ii + 1; jj < list.length; jj++) {
      const B = prims[list[jj]]; if (A.p === B.p) continue;
      const PB = pieces[B.p];
      if (PA.cat === 'static' && PB.cat === 'static' && PA.struct === PB.struct) continue;
      if (A.mn[0] >= B.mx[0] || B.mn[0] >= A.mx[0] || A.mn[1] >= B.mx[1] || B.mn[1] >= A.mx[1] || A.mn[2] >= B.mx[2] || B.mn[2] >= A.mx[2]) continue;
      // the pair is handled once: in the cell holding the low corner of the boxes' overlap
      const lx = Math.max(A.mn[0], B.mn[0]), ly = Math.max(A.mn[1], B.mn[1]), lz = Math.max(A.mn[2], B.mn[2]);
      if (Math.floor(lx / CS) !== kx || Math.floor(ly / CS) !== ky || Math.floor(lz / CS) !== kz) continue;
      const pk = Math.min(A.p, B.p) * NP + Math.max(A.p, B.p);
      let rel = relCache.get(pk); if (rel === undefined) { rel = relation(PA, PB); relCache.set(pk, rel); }
      if (rel.startsWith('NOZZLE:') || rel === 'STUDS-EQ') {
        // a nozzle: the solid of its item its neck ends in, and that item's weld seams (they lie on the shell); studs: the body's own drawn flange
        const X = PA.cat === 'static' ? PA : PB, E = X === PA ? A : B, ok = rel === 'STUDS-EQ' ? /flange/.test(E.nm) : /seams/.test(E.nm) || nozzleHeldBy(rel.slice(7), X, E.nm);
        if (ok) { if (AUDIT) { const d = depth(A, B).d; if (d > NOISE) auditNote(rel === 'STUDS-EQ' ? 'studs at the body\'s own flange' : `nozzle in its shell [${E.nm}]`, PA, PB, A, B, d); } continue; }
        if (AUDIT) { const d = depth(A, B).d; if (d > NOISE) auditNote(rel === 'STUDS-EQ' ? 'NOW REPORTED: studs in a solid of the body that is not its flange' : `NOW REPORTED: nozzle in a solid of its item it does not end in [${E.nm}]`, PA, PB, A, B, d); }
      } else if (rel && rel !== 'BEARING') { if (AUDIT) { const d = depth(A, B).d; if (d > NOISE) auditNote(rel === 'support on its line' ? `${rel} (${(PA.cat === 'sup' ? PB : PA).kind})` : rel, PA, PB, A, B, d); } continue; }
      nPairs++;
      const r = depth(A, B); nNarrow++;
      if (rel === 'BEARING') {
        const SP = PA.cat === 'sup' ? PA : PB, S = SP === PA ? A : B, X = SP === PA ? PB : PA;
        if (S.bear && seatOf.get(SP.id)?.has(X.id) && (S.anchor || r.d <= JOIN || (/^top plate/.test(S.nm) && hangOf.get(SP.id)?.has(X.id)))) { if (AUDIT && r.d > NOISE) auditNote(S.anchor ? 'anchor rods in the seat' : 'bearing plate on its seat', PA, PB, A, B, r.d); continue; }
        if (AUDIT && S.bear && r.d > NOISE) auditNote(seatOf.get(SP.id)?.has(X.id) ? 'NOW REPORTED: bearing plate sunk into its seat' : 'NOW REPORTED: bearing solid in a solid that is not its seat', PA, PB, A, B, r.d);
      }
      if (PA.cat === 'static' && PB.cat === 'static' && (A.anchor || B.anchor)) {
        const E = A.anchor ? PA : PB, X = E === PA ? PB : PA;
        if (anchoredIn(E, X, NP) || (A.anchor && B.anchor && anchoredIn(PB, PA, NP))) { if (AUDIT && r.d > NOISE) auditNote('anchor in what its body stands on', PA, PB, A, B, r.d); continue; }
        if (AUDIT && r.d > NOISE) auditNote('NOW REPORTED: anchor in a solid its body does not stand on', PA, PB, A, B, r.d);
      }
      if (r.d > NOISE) {
        const at: V3 = [(lx + Math.min(A.mx[0], B.mx[0])) / 2, (ly + Math.min(A.mx[1], B.mx[1])) / 2, (lz + Math.min(A.mx[2], B.mx[2])) / 2];
        const e: PP = { d: r.d, at, i: list[ii], j: list[jj], n: r.n }, cur = pairBest.get(pk); if (!cur || r.d > cur.d) pairBest.set(pk, e);
        let l = pairAll.get(pk); if (!l) pairAll.set(pk, (l = [])); l.push(e);
      }
    }
  }
}
log(`overlap pass: ${nPairs} envelope pairs tested, ${pairBest.size} piece pairs overlap`);
const clsOf = (P: Piece, Q: Piece) => {
  if (P.cat === 'static' && Q.cat === 'static') return 'static-static';
  if (P.cat !== 'static' && Q.cat !== 'static') { if (P.owner === Q.owner) return 'self'; if (P.cat === 'sup' || Q.cat === 'sup') return 'support-piping'; return P.model === Q.model ? 'piping-piping' : 'piping-piping cross-model'; }
  const X = P.cat === 'static' ? Q : P; return X.cat === 'sup' ? 'support-static' : 'piping-static';
};
// ---- every overlap checked again on the drawn meshes: a box or a slab encloses more than its solid ----
function partOfPiece(P: Piece): PartSpec | undefined { if (P.cat === 'static') return P.part; try { return partFromKey(P.key); } catch { return undefined; } }
/** the world triangles of a piece's solid named nm (all its solids where none has that name), 9 numbers each */
function trisOf(P: Piece, nm: string): Float64Array | undefined {
  const k = `${P.id}|${nm}`; let t = triCache.get(k); if (t) { triCache.delete(k); triCache.set(k, t); return t; }
  const part = partOfPiece(P); if (!part) return undefined;
  const sol = buildGeometry(part).solids, pick = sol.some(x => x.name === nm) ? sol.filter(x => x.name === nm) : sol, out: number[] = [], W = P.W;
  for (const so of pick) { const Pp = so.mesh.positions, I = so.mesh.indices; for (let q = 0; q < I.length; q++) { const v = 3 * I[q], x = Pp[v], y = Pp[v + 1], z = Pp[v + 2]; out.push(W[0] * x + W[4] * y + W[8] * z + W[12], W[1] * x + W[5] * y + W[9] * z + W[13], W[2] * x + W[6] * y + W[10] * z + W[14]); } }
  t = Float64Array.from(out); triCache.set(k, t); if (triCache.size > 800) triCache.delete(triCache.keys().next().value!); return t;
}
function triBoxHit(T: Float64Array, o: number, mn: V3, mx: V3) { for (let a = 0; a < 3; a++) { const lo = Math.min(T[o + a], T[o + 3 + a], T[o + 6 + a]), hi = Math.max(T[o + a], T[o + 3 + a], T[o + 6 + a]); if (hi < mn[a] || lo > mx[a]) return false; } return true; }
/** Moller's triangle-triangle test; a coplanar touch is not a crossing */
function triTri(A: Float64Array, a: number, B: Float64Array, b: number): boolean {
  const v = (T: Float64Array, o: number, i: number): V3 => [T[o + 3 * i], T[o + 3 * i + 1], T[o + 3 * i + 2]];
  const a0 = v(A, a, 0), a1 = v(A, a, 1), a2 = v(A, a, 2), b0 = v(B, b, 0), b1 = v(B, b, 1), b2 = v(B, b, 2);
  const n2 = cross(sub(b1, b0), sub(b2, b0)), d2 = -dot(n2, b0), da = [dot(n2, a0) + d2, dot(n2, a1) + d2, dot(n2, a2) + d2];
  const e2 = 1e-9 * (len(n2) + 1); for (let i = 0; i < 3; i++) if (Math.abs(da[i]) < e2) da[i] = 0;
  if ((da[0] > 0 && da[1] > 0 && da[2] > 0) || (da[0] < 0 && da[1] < 0 && da[2] < 0)) return false;
  const n1 = cross(sub(a1, a0), sub(a2, a0)), d1 = -dot(n1, a0), db = [dot(n1, b0) + d1, dot(n1, b1) + d1, dot(n1, b2) + d1];
  const e1 = 1e-9 * (len(n1) + 1); for (let i = 0; i < 3; i++) if (Math.abs(db[i]) < e1) db[i] = 0;
  if ((db[0] > 0 && db[1] > 0 && db[2] > 0) || (db[0] < 0 && db[1] < 0 && db[2] < 0)) return false;
  if (da.every(x => x === 0) || db.every(x => x === 0)) return false;   // coplanar: a touch
  const D = cross(n1, n2), ax = Math.abs(D[0]) > Math.abs(D[1]) ? (Math.abs(D[0]) > Math.abs(D[2]) ? 0 : 2) : (Math.abs(D[1]) > Math.abs(D[2]) ? 1 : 2);
  const iv = (p: V3[], d: number[]): [number, number] | null => {
    const pr = p.map(q => q[ax]); let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) { if ((d[i] > 0 && d[j] < 0) || (d[i] < 0 && d[j] > 0)) { const t = pr[i] + ((pr[j] - pr[i]) * d[i]) / (d[i] - d[j]); lo = Math.min(lo, t); hi = Math.max(hi, t); } }
    for (let i = 0; i < 3; i++) if (d[i] === 0) { lo = Math.min(lo, pr[i]); hi = Math.max(hi, pr[i]); }
    return Number.isFinite(lo) ? [lo, hi] : null;
  };
  const ia = iv([a0, a1, a2], da), ib = iv([b0, b1, b2], db); if (!ia || !ib) return false;
  return Math.min(ia[1], ib[1]) - Math.max(ia[0], ib[0]) > 1e-7;
}
/** a point inside a closed mesh: crossings of a ray along a slightly skew direction */
function inside(T: Float64Array, p: V3): boolean {
  const d = unit([1, 0.0003137, 0.0002718]); let c = 0;
  for (let o = 0; o < T.length; o += 9) {
    const a: V3 = [T[o], T[o + 1], T[o + 2]], e1 = sub([T[o + 3], T[o + 4], T[o + 5]], a), e2 = sub([T[o + 6], T[o + 7], T[o + 8]], a), h = cross(d, e2), det = dot(e1, h); if (Math.abs(det) < 1e-12) continue;
    const f = 1 / det, sv = sub(p, a), u = f * dot(sv, h); if (u < 0 || u > 1) continue; const qv = cross(sv, e1), w = f * dot(d, qv); if (w < 0 || u + w > 1) continue; if (f * dot(e2, qv) > 1e-9) c++;
  }
  return (c & 1) === 1;
}
/** the drawn solids behind two envelopes really overlap: their surfaces cross within the envelopes' common box, or one holds a point of the other */
function meshConfirm(P: Piece, A: Prim, Q: Piece, B: Prim): boolean | undefined {
  const TA = trisOf(P, A.nm), TB = trisOf(Q, B.nm); if (!TA || !TB) return undefined;
  const mn: V3 = [0, 1, 2].map(k => Math.max(A.mn[k], B.mn[k]) - 0.01) as V3, mx: V3 = [0, 1, 2].map(k => Math.min(A.mx[k], B.mx[k]) + 0.01) as V3;
  const ia: number[] = [], ib: number[] = [];
  for (let o = 0; o < TA.length; o += 9) if (triBoxHit(TA, o, mn, mx)) ia.push(o);
  for (let o = 0; o < TB.length; o += 9) if (triBoxHit(TB, o, mn, mx)) ib.push(o);
  if (ia.length && ib.length) {
    // B's triangles on a coarse grid over the common box
    const G = 12, cs = [0, 1, 2].map(k => Math.max(1e-6, (mx[k] - mn[k]) / G)), cell = new Map<number, number[]>(), ck = (x: number, y: number, z: number) => (x * 64 + y) * 64 + z;
    const rng = (T: Float64Array, o: number, k: number): [number, number] => [Math.max(0, Math.min(G - 1, Math.floor((Math.min(T[o + k], T[o + 3 + k], T[o + 6 + k]) - mn[k]) / cs[k]))), Math.max(0, Math.min(G - 1, Math.floor((Math.max(T[o + k], T[o + 3 + k], T[o + 6 + k]) - mn[k]) / cs[k])))];
    for (const o of ib) { const [x0, x1] = rng(TB, o, 0), [y0, y1] = rng(TB, o, 1), [z0, z1] = rng(TB, o, 2); for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) { const k = ck(x, y, z); let l = cell.get(k); if (!l) cell.set(k, (l = [])); l.push(o); } }
    for (const o of ia) { const [x0, x1] = rng(TA, o, 0), [y0, y1] = rng(TA, o, 1), [z0, z1] = rng(TA, o, 2), seen = new Set<number>(); for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (const q of cell.get(ck(x, y, z)) ?? []) { if (seen.has(q)) continue; seen.add(q); if (triTri(TA, o, TB, q)) return true; } }
  }
  // no crossing: one solid wholly inside the other
  const pt = (T: Float64Array, ix: number[]): V3 | undefined => (ix.length ? [(T[ix[0]] + T[ix[0] + 3] + T[ix[0] + 6]) / 3, (T[ix[0] + 1] + T[ix[0] + 4] + T[ix[0] + 7]) / 3, (T[ix[0] + 2] + T[ix[0] + 5] + T[ix[0] + 8]) / 3] : undefined);
  const pb = pt(TB, ib), pa = pt(TA, ia);
  if (pb && inside(TA, pb)) return true; if (pa && inside(TB, pa)) return true;
  return false;
}
/** the depth along n of the two solids' drawn points (their hulls), never more than the envelopes' */
function hullDepth(P: Piece, A: Prim, Q: Piece, B: Prim, n: V3): number | undefined {
  const TA = trisOf(P, A.nm), TB = trisOf(Q, B.nm); if (!TA || !TB) return undefined;
  // q(n) = max over A of x.n - min over B of x.n, with n the direction the envelopes gave; both signs of the pair's order
  // review fix: the drawn surface within each envelope's box is the triangles clipped to that box, not only the vertices that fall in it (a long
  // solid's vertices lie at its ends, so a slab in its middle held none of them and the depth came out too small)
  const ext = (T: Float64Array, E: Prim): [number, number] => {
    let lo = Infinity, hi = -Infinity;
    for (let o = 0; o < T.length; o += 9) { if (!triBoxHit(T, o, E.mn, E.mx)) continue;
      let poly: V3[] = [[T[o], T[o + 1], T[o + 2]], [T[o + 3], T[o + 4], T[o + 5]], [T[o + 6], T[o + 7], T[o + 8]]];
      for (let k = 0; k < 3 && poly.length; k++) for (const [t, above] of [[E.mn[k] - 1e-6, true], [E.mx[k] + 1e-6, false]] as [number, boolean][]) {
        const r: V3[] = []; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], ia = above ? a[k] >= t : a[k] <= t, ib = above ? b[k] >= t : b[k] <= t; if (ia) r.push(a); if (ia !== ib) { const f = (t - a[k]) / (b[k] - a[k]); r.push([a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1]), a[2] + f * (b[2] - a[2])]); } } poly = r; if (!poly.length) break; }
      for (const q of poly) { const v = q[0] * n[0] + q[1] * n[1] + q[2] * n[2]; if (v < lo) lo = v; if (v > hi) hi = v; } }
    return [lo, hi];
  };
  const [minA, maxA] = ext(TA, A), [minB, maxB] = ext(TB, B);
  if (!Number.isFinite(maxA) || !Number.isFinite(maxB)) return undefined;
  return Math.min(maxA - minB, maxB - minA);
}
const tightKinds = new Set(['PIPE', 'FLANGE', 'BLIND', 'GASKET', 'ELBOW', 'TEE', 'STUD', 'CONCRETE', 'PL', 'BASE_PLATE', 'HSS_ROUND', 'HSS_RECT', 'ROD']);
const isTight = (P: Piece, A: Prim) => { const k = P.cat === 'static' ? P.kind : (partOfKind.get(P.key) ?? ''); return tightKinds.has(k) && !(A.t === 1 && k !== 'CONCRETE' && k !== 'PL' && k !== 'BASE_PLATE' && k !== 'HSS_RECT'); };
const partOfKind = new Map<string, string>();
for (const P of pieces) if (P.cat !== 'static' && !partOfKind.has(P.key)) { const k0 = P.key.split('|')[0]; partOfKind.set(P.key, ({ PIPE: 'PIPE', WNF: 'FLANGE', SOF: 'FLANGE', SWF: 'FLANGE', BLIND: 'BLIND', GSK: 'GASKET', EL: 'ELBOW', TEE: 'TEE', STUDS: 'STUD' } as Record<string, string>)[k0] ?? k0); }
let nDropped = 0, nUnverified = 0; const dropped: string[] = [];
for (const [pk, best0] of pairBest) {
  const P = pieces[Math.floor(pk / NP)], Q = pieces[pk % NP];
  let cl = clsOf(P, Q);
  // review fix: every overlapping envelope pair of the two pieces is looked at (before, only the 24 deepest, and the first one the meshes bore out
  // set the depth even when a later one went deeper)
  const all = (pairAll.get(pk) ?? [best0]).sort((x, y) => y.d - x.d);
  let v: PP | undefined, how = '', depthNow = 0;
  for (const e of all) {
    if (v && e.d <= depthNow) break;   // sorted by envelope depth, which bounds what the meshes can show
    const A = prims[e.i], B = prims[e.j], PA = pieces[A.p], PB = pieces[B.p];
    if (isTight(PA, A) && isTight(PB, B)) { v = e; depthNow = e.d; how = 'exact envelopes'; break; }
    const c = meshConfirm(PA, A, PB, B);
    if (c === undefined) { v = e; depthNow = e.d; how = 'envelopes (no mesh to check)'; nUnverified++; break; }
    if (c) { const hd = hullDepth(PA, A, PB, B, e.n), dn = hd !== undefined ? Math.max(Math.min(e.d, hd), 0) : e.d; if (!v || dn > depthNow) { v = e; depthNow = dn; how = `confirmed on the meshes${hd !== undefined && hd < e.d - 1e-3 ? ` (envelopes ${e.d.toFixed(3)} in)` : ''}`; } }
  }
  if (!v) { nDropped++; dropped.push(`${descr(P)} ~ ${descr(Q)}: envelopes ${best0.d.toFixed(3)} in, the meshes do not meet`); continue; }
  if (depthNow <= NOISE) { nDropped++; dropped.push(`${descr(P)} ~ ${descr(Q)}: on the meshes ${depthNow.toFixed(3)} in`); continue; }
  const A = prims[v.i], B = prims[v.j], sa = A.p === P.id ? A : B, sb = sa === A ? B : A;
  let note = `${descr(P)} [${sa.nm}] overlaps ${descr(Q)} [${sb.nm}] by ${depthNow.toFixed(3)} in (${how})`;
  let rule: string | undefined;
  if (cl === 'self') { note += `: two pieces of one line that are not neighbours in its chain (chain positions ${P.ci}, ${Q.ci})`; if (P.studs && Q.studs) { rule = 'double bolting'; note += '; the stud sets of the joints either side of a short (wafer) valve take the same bolt holes: the bolting is drawn twice'; } }
  // review: a nozzle's piece in a solid of its own item other than the one its neck ends in; a support in a piece of its own line it does not carry
  if (cl === 'piping-static') { const N = P.cat === 'ncomp' ? P : Q.cat === 'ncomp' ? Q : undefined, X = N === P ? Q : P; if (N && X.cat === 'static' && X.tags?.[0] === N.equip) { rule = 'nozzle in its own item'; note += `: a piece of nozzle ${N.line} in a solid of its own item ${N.equip} that is not the one its neck ends in`; } }
  if (cl === 'support-piping') { const S = P.cat === 'sup' ? P : Q, X = S === P ? Q : P; if (X.owner === S.supLine) { rule = 'support in its own line'; note += `: a support of ${S.line} in a ${X.kind} of its own line, not in the run it carries`; } }
  // review: a drawn weld bead in a piece it does not join; say how its record's axis lies against the pipe it joins
  { const Wd = P.kind === 'weld' ? P : Q.kind === 'weld' ? Q : undefined;
    if (Wd && cl !== 'static-static') { rule = rule ?? 'weld bead'; const pj = joinedOf(Wd).find(o => o.kind === 'pipe' && dist(o.a, o.b) > 1e-6), ang = pj && Wd.wdir ? (Math.acos(Math.min(1, Math.abs(dot(unit(sub(pj.b, pj.a)), Wd.wdir)))) * 180) / Math.PI : undefined;
      note += `; the weld bead ${Wd.tag} joins ${(Wd.joins ?? []).join(' and ')}${ang !== undefined && ang > 1 ? `, and its record lays it at ${ang.toFixed(1)} deg to the pipe it joins (a butt weld lies square to it)` : ''}`; } }
  if (cl === 'static-static') {
    // a body standing on steel or concrete of another structure: its lowest point lies within what it overlaps
    const E = P.struct?.includes(':eq:') ? P : Q.struct?.includes(':eq:') ? Q : undefined, X = E === P ? Q : P, XB = E ? (sb.p === X.id ? sb : sa) : undefined;
    if (E && XB) { const lo = Math.min(...E.prims.map(i => prims[i].mn[1])); if (lo >= XB.mn[1] - JOIN && lo <= XB.mx[1] + JOIN) { cl = 'equipment-seat'; note += `: ${E.tag} stands on this ${X.kind} (its lowest point, y ${lo.toFixed(3)}, is within it): a body sunk into the steel or concrete it is founded on`; } }
  }
  if (cl === 'support-static') {
    const S = P.cat === 'sup' ? P : Q, X = S === P ? Q : P, seat = seatOf.get(S.id), SB = sa.p === S.id ? sa : sb;
    // review fix: 'support-seat' (listed, not counted as a clash) is kept for a support's rods, post or web in the member one of its bearing plates
    // rests on face to face; a bearing plate sunk into its seat, or a bearing solid in anything else, is a clash
    if (SB.bear) note += seat?.has(X.id) ? `: a bearing solid of the support sunk ${depthNow.toFixed(3)} in into the solid it rests on (more than the ${JOIN} in of a shared face)` : ': a bearing solid of the support in a solid it does not rest on (no bearing plate of it meets this solid face to face)';
    else if (seat?.has(X.id)) { cl = 'support-seat'; note += `: the support is sunk into the solid it bears on (its ${S.supType === 'hanger' || S.supType === 'trapeze' ? 'rod passes into the member it hangs from' : 'post or web stands inside what its base plate sits on'})`; }
    else note += ': a part of the support other than its bearing plates is in a solid it does not bear on';
  }
  findings.push({ a: who(P), b: who(Q), depthIn: Math.round(depthNow * 1000) / 1000, at: r3(v.at), note, cls: cl, ...(rule ? { rule } : {}) });
}
log(`mesh check: ${nDropped} envelope overlaps not borne out by the meshes, ${nUnverified} left on envelopes`);

// ---- near misses between models: the generator keeps 3 in between the pieces of one model (SW-RT), but nothing kept a model clear of another's pieces ----
const CLEAR = 3, nearBest = new Map<number, { d: number; at: V3; i: number; j: number }>();
const crossSrc = (P: Piece) => P.cat !== 'static' && (P.model === 'pipeway' || P.model === 'cooling-water');
for (let i = 0; i < prims.length; i++) {
  const A = prims[i], PA = pieces[A.p]; if (!crossSrc(PA)) continue;
  for (const j of query([A.mn[0] - CLEAR, A.mn[1] - CLEAR, A.mn[2] - CLEAR], [A.mx[0] + CLEAR, A.mx[1] + CLEAR, A.mx[2] + CLEAR])) {
    const B = prims[j], PB = pieces[B.p]; if (PB.cat === 'static' || PB.model === PA.model || (crossSrc(PB) && j < i)) continue;
    const pk = Math.min(A.p, B.p) * NP + Math.max(A.p, B.p); if (pairBest.has(pk)) continue;
    let rel = relCache.get(pk); if (rel === undefined) { rel = relation(PA, PB); relCache.set(pk, rel); } if (rel) continue;
    const oa = PA.supLine ?? PA.owner, ob = PB.supLine ?? PB.owner; if (linked(oa, ob)) continue;   // a line and what it is bolted to are one assembly: only unrelated pieces count as a near miss
    const r = depth(A, B, true); if (r.d <= -CLEAR || r.d > NOISE) continue;
    const cur = nearBest.get(pk); if (!cur || r.d > cur.d) { const at: V3 = [(Math.max(A.mn[0], B.mn[0]) + Math.min(A.mx[0], B.mx[0])) / 2, (Math.max(A.mn[1], B.mn[1]) + Math.min(A.mx[1], B.mx[1])) / 2, (Math.max(A.mn[2], B.mn[2]) + Math.min(A.mx[2], B.mx[2])) / 2]; nearBest.set(pk, { d: r.d, at, i, j }); }
  }
}
for (const [pk, v] of nearBest) {
  const P = pieces[Math.floor(pk / NP)], Q = pieces[pk % NP], A = prims[v.i], B = prims[v.j], sa = A.p === P.id ? A : B, sb = sa === A ? B : A;
  findings.push({ a: who(P), b: who(Q), depthIn: Math.round(v.d * 1000) / 1000, at: r3(v.at), note: `near miss, not an intersection: ${descr(P)} [${sa.nm}] and ${descr(Q)} [${sb.nm}], of two models, are ${(-v.d).toFixed(3)} in apart, under the 3 in the generator keeps between pieces of one model`, cls: 'near-miss cross-model' });
}
log(`near misses between models: ${nearBest.size} piece pairs under ${CLEAR} in`);

// ------------------------------------------------------------------------------------------------ shape checks, per line
const shape = (P: Piece | undefined, Q: Piece | Who | undefined, cls: string, rule: string, note: string, at: V3, d = 0) => findings.push({ a: P ? who(P) : NONE('-'), b: Q ? ('cat' in Q ? who(Q as Piece) : Q as Who) : NONE('-'), depthIn: Math.round(d * 1000) / 1000, at: r3(at), note, cls, rule });
const lineWho = (L: LineInfo, tag = '-', kind = 'line'): Who => ({ model: L.model, line: L.rec.no, tag, kind });
/** the direction a piece runs into itself from its end nearest pt (an elbow's tangents from its frame) */
function dirAt(P: Piece, pt: V3): V3 | undefined {
  if (P.kind === 'elbow') {
    const [s, e] = elbowEnds(P), ang = (partFromKey(P.key).dims.angle.value * Math.PI) / 180;
    return dist(pt, s) <= dist(pt, e) ? unit(rv(P.W, [0, 0, 1])) : unit(rv(P.W, [-Math.sin(ang), 0, -Math.cos(ang)]));
  }
  const d = sub(P.b, P.a); if (len(d) < 1e-6) return undefined; return dist(pt, P.a) <= dist(pt, P.b) ? unit(d) : unit([-d[0], -d[1], -d[2]]);
}
function elbowEnds(P: Piece): [V3, V3] { const part = partFromKey(P.key), R = part.dims.R.value, ang = (part.dims.angle.value * Math.PI) / 180; return [xf(P.W, [0, 0, 0]), xf(P.W, [R - R * Math.cos(ang), 0, R * Math.sin(ang)])]; }
const counts = { lines: 0, chainJoints: 0, hops: 0, hopsJustified: 0, uturns: 0, selfSamples: 0, supports: 0, supportsOnGrade: 0, supportsOnSteel: 0 };
const hopsJustified: string[] = [];

for (const L of lines.values()) {
  counts.lines++;
  const ch = L.chain.map(i => pieces[i]), no = L.rec.no;
  // each piece's entry and exit along the chain (a stack built back from a nozzle is recorded face first, so a and b do not give the way the line runs)
  const ori: { s: V3; e: V3 }[] = [];
  ch.forEach((P, k) => {
    if (k === 0) { const nx = ch[1]; if (!nx) { ori.push({ s: P.a, e: P.b }); return; } const da = Math.min(dist(P.a, nx.a), dist(P.a, nx.b)), db = Math.min(dist(P.b, nx.a), dist(P.b, nx.b)); ori.push(da < db ? { s: P.b, e: P.a } : { s: P.a, e: P.b }); return; }
    const pe = ori[k - 1].e; ori.push(dist(P.a, pe) <= dist(P.b, pe) ? { s: P.a, e: P.b } : { s: P.b, e: P.a });
  });
  // (1) one continuous chain: each piece meets the next end to end, collinear, never doubling back
  for (let k = 0; k + 1 < ch.length; k++) {
    const P = ch[k], Q = ch[k + 1]; counts.chainJoints++;
    let bd = Infinity, be: [0 | 1, 0 | 1] = [1, 0];
    for (const [i, p] of [P.a, P.b].entries()) for (const [j, q] of [Q.a, Q.b].entries()) { const d = dist(p, q); if (d < bd) { bd = d; be = [i as 0 | 1, j as 0 | 1]; } }
    if (bd > JOIN) { shape(P, Q, 'continuity', 'chain gap', `${no}: pieces ${P.tag} and ${Q.tag}, consecutive in its chain, do not meet: their nearest ends are ${bd.toFixed(3)} in apart`, add(P.b, sub(Q.a, P.b), 0.5)); continue; }
    const at = [P.a, P.b][be[0]];
    const dP = dirAt(P, at), dQ = dirAt(Q, at);
    if (dP && dQ && P.kind !== 'olet' && Q.kind !== 'olet') {
      const c = dot(dP, dQ);   // the two pieces run away from their joint in opposite directions when the chain is straight: c = -1
      if (c > 0.999) shape(P, Q, 'shape', 'reversal', `${no}: ${Q.tag} doubles back over ${P.tag}: at their joint both run the same way (the line reverses on itself)`, at);
      else if (c > -0.9999) shape(P, Q, 'shape', 'kink', `${no}: ${P.tag} and ${Q.tag} meet at an angle of ${(180 - (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI).toFixed(2)} deg with no fitting between them`, at);
    }
  }
  // the elbows' own records against their frames, and an elbow's legs must not reverse onto each other
  for (const P of ch.filter(x => x.kind === 'elbow')) {
    const [s, e] = elbowEnds(P), ok = (nearPt(s, P.a, 0.06) && nearPt(e, P.b, 0.06)) || (nearPt(s, P.b, 0.06) && nearPt(e, P.a, 0.06));
    if (!ok) shape(P, undefined, 'continuity', 'elbow record', `${no}: elbow ${P.tag}'s recorded ends do not lie where its frame puts them (${r3(s)} -> ${r3(e)} against ${r3(P.a)} -> ${r3(P.b)})`, P.a);
    const k = ch.indexOf(P), prev = ch[k - 1], next = ch[k + 1];
    if (prev && next && prev.kind !== 'elbow' && next.kind !== 'elbow' && dist(ori[k - 1].s, ori[k - 1].e) > 1e-6 && dist(ori[k + 1].s, ori[k + 1].e) > 1e-6) {
      const u1 = unit(sub(ori[k - 1].e, ori[k - 1].s)), u2 = unit(sub(ori[k + 1].e, ori[k + 1].s)), turn = (Math.acos(Math.max(-1, Math.min(1, dot(u1, u2)))) * 180) / Math.PI, want = partFromKey(P.key).dims.angle.value;
      if (Math.abs(turn - want) > 1) shape(P, next, 'shape', turn > 179 ? 'elbow reverses' : 'elbow legs', `${no}: the pieces either side of the ${want} deg elbow ${P.tag} turn ${turn.toFixed(1)} deg${turn > 179 ? ': its legs lie back onto each other' : ''}`, P.a);
    }
  }
  // the line's ends: where its record says it starts and ends
  const first = ch[0], last = ch[ch.length - 1];
  if (first && last) for (const [end, P, pt] of [[L.rec.from, first, first.a], [L.rec.to, last, last.b]] as [string, Piece, V3][]) {
    if (end.startsWith('tap ')) {
      const par = lines.get(`${L.model}|L|${end.slice(4)}`); if (!par) { shape(P, undefined, 'continuity', 'end', `${no}: its end "${end}" names a line that is not in ${L.model}`, pt); continue; }
      const tee = par.all.map(i => pieces[i]).find(q => q.kind === 'tee' && q.tag.endsWith(`/T:${no}`)), olet = ch.find(q => q.kind === 'olet' && q.onRun === par.rec.no);
      const okTee = tee && tee.ports[2] && [P.a, P.b].some(p => nearPt(p, tee.ports[2])), okOlet = olet && par.all.some(i => oletOn(olet, pieces[i]));
      if (!okTee && !okOlet) shape(P, undefined, 'continuity', 'end', `${no}: its end "${end}" is not met: no tee outlet of ${par.rec.no} at ${r3(pt)} and no olet of its own on that line`, pt);
    } else if (end === 'cap' || end === 'blind') { if (!(P.kind === end || (end === 'blind' && P.kind === 'blind'))) shape(P, undefined, 'continuity', 'end', `${no}: its record ends "${end}" but its chain ends with a ${P.kind}`, pt); }
    else if (/-/.test(end)) {
      const nz = nozzles.get(end); if (!nz) { shape(P, undefined, 'continuity', 'end', `${no}: its end "${end}" is a nozzle no model has`, pt); continue; }
      const face = xf(nz.M, nz.rec.face); if (![P.a, P.b].some(p => nearPt(p, face))) shape(P, NONE(end, 'nozzle'), 'continuity', 'end', `${no}: its end does not meet nozzle ${end}'s face: ${r3(face)} against ${r3(P.a)} / ${r3(P.b)}`, face);
    }
  }
  // (2) the path the line was routed on: each piece's ends on it; no zero-length segment and no vertex that reverses
  const path = L.path;
  if (path.length >= 2) {
    const segs: { a: V3; b: V3; d: V3; L: number }[] = [];
    for (let k = 0; k + 1 < path.length; k++) { const d = sub(path[k + 1], path[k]), l = len(d); if (l < 1e-6) { shape(undefined, lineWho(L), 'shape', 'path', `${no}: its path repeats the point ${r3(path[k])}`, path[k]); continue; } segs.push({ a: path[k], b: path[k + 1], d: unit(d), L: l }); }
    // merge collinear
    const S: typeof segs = []; for (const s of segs) { const p = S[S.length - 1]; if (p && dot(p.d, s.d) > 1 - 1e-9 && nearPt(p.b, s.a, 1e-6)) { p.b = s.b; p.L += s.L; } else S.push({ ...s }); }
    for (let k = 0; k + 1 < S.length; k++) if (dot(S[k].d, S[k + 1].d) < -0.999) shape(undefined, lineWho(L), 'shape', 'path reverses', `${no}: its path turns straight back at ${r3(S[k].b)}`, S[k].b);
    // (3) U-turns and doubling back: antiparallel stretches that overlap along their length closer than 3 diameters
    for (let i = 0; i < S.length; i++) for (let j = i + 2; j < S.length; j++) {
      if (dot(S[i].d, S[j].d) > -0.999) continue;
      const t0 = dot(sub(S[j].a, S[i].a), S[i].d), t1 = dot(sub(S[j].b, S[i].a), S[i].d), lo = Math.max(0, Math.min(t0, t1)), hi = Math.min(S[i].L, Math.max(t0, t1));
      if (hi - lo <= 1e-6) continue;
      const w = sub(S[j].a, S[i].a), perp = len(add(w, S[i].d, -dot(w, S[i].d)));
      counts.uturns++;
      if (perp < 3 * L.OD) shape(undefined, lineWho(L), 'shape', 'U-turn', `${no}: its path doubles back: the stretch from ${r3(S[j].a)} runs back alongside the one from ${r3(S[i].a)}, ${perp.toFixed(2)} in apart (centre to centre), under 3 diameters (${(3 * L.OD).toFixed(2)} in)`, add(S[i].a, S[i].d, (lo + hi) / 2));
    }
    // (4) a rise and fall (or a fall and rise) back to the same level within 20 ft, with nothing in the way at the level it left
    const vert = (s: { d: V3 }) => Math.abs(s.d[1]) > 0.999, horiz = (s: { d: V3 }) => Math.abs(s.d[1]) < 1e-6;
    for (let i = 1; i < S.length - 2; i++) {
      if (!vert(S[i]) || !horiz(S[i - 1])) continue;
      let run = 0, j = i + 1; while (j < S.length && horiz(S[j])) { run += S[j].L; j++; }
      if (j >= S.length - 1 || j === i + 1 || !vert(S[j]) || Math.sign(S[j].d[1]) === Math.sign(S[i].d[1]) || Math.abs(S[i].L - S[j].L) > 0.5 || !horiz(S[j + 1]) || run > 240) continue;
      counts.hops++;
      const dy = S[i].b[1] - S[i].a[1], lvl: V3[] = [S[i].a]; for (let k = i + 1; k < j; k++) lvl.push([S[k].b[0], S[k].b[1] - dy, S[k].b[2]]);
      const rq = L.OD / 2 + 3, hits = new Set<string>(), hopSegs = S.slice(i - 1, j + 2);
      for (let k = 0; k + 1 < lvl.length; k++) {
        const q0: LPrim = cylL(lvl[k], lvl[k + 1], rq, 'level route'), Q: Prim = { ...q0, mn: [0, 0, 0], mx: [0, 0, 0], p: -1 }; const [mn, mx] = lBox(Q); Q.mn = mn; Q.mx = mx;
        for (const i2 of query(mn, mx)) {
          const X = pieces[prims[i2].p]; if (X.supLine === L.key) continue;
          // the line's own pieces count, but for those of the hop itself and the runs either side of it
          if (X.owner === L.key && [X.a, X.b].every(q => hopSegs.some(h => ptSeg(q, h.a, h.b).d <= 0.5))) continue;
          if (depth(Q, prims[i2]).d > 0) hits.add(descr(X));
        }
      }
      const kind = dy > 0 ? 'rises' : 'drops', back = dy > 0 ? 'falls' : 'rises';
      if (hits.size) { counts.hopsJustified++; hopsJustified.push(`${no} ${kind} ${Math.abs(dy).toFixed(1)} in over ${run.toFixed(0)} in at ${r3(S[i].a)}: clears ${[...hits].slice(0, 3).join('; ')}`); }
      else shape(undefined, lineWho(L), 'shape', dy > 0 ? 'needless hop' : 'needless dip', `${no} ${kind} ${Math.abs(dy).toFixed(1)} in at ${r3(S[i].a)}, runs ${run.toFixed(0)} in and ${back} back to the same level, with nothing within 3 in of the straight run it left at that level: ${dy > 0 ? 'a needless hop' : 'a pocket that traps liquid, with nothing above to pass under'}`, S[i].a);
    }
  }
  // (5) self-approach of the centreline: two places of the line within one diameter of each other (surface to surface) that are far apart along it
  {
    type Sm = { p: V3; s: number; r: number; k: number };
    const pts: Sm[] = []; let s = 0;
    for (const [k, P] of ch.entries()) {
      const r = pipeDims(P.NPS, P.cls as PipeClass).OD / 2, step = Math.max(0.5, r);
      if (P.kind === 'elbow') { const part = partFromKey(P.key), R = part.dims.R.value, ang = (part.dims.angle.value * Math.PI) / 180, n = Math.max(2, Math.ceil((R * ang) / step)), fwd = dist(ori[k].s, elbowEnds(P)[0]) <= dist(ori[k].s, elbowEnds(P)[1]); for (let q = 0; q <= n; q++) { const th = (ang * (fwd ? q : n - q)) / n; pts.push({ p: xf(P.W, [R - R * Math.cos(th), 0, R * Math.sin(th)]), s: s + (R * ang * q) / n, r, k }); } s += R * ang; }
      else { const A = ori[k].s, B = ori[k].e, l = dist(A, B), n = Math.max(1, Math.ceil(l / step)); for (let q = 0; q <= n; q++) pts.push({ p: add(A, sub(B, A), q / n), s: s + (l * q) / n, r, k }); s += l; }
    }
    counts.selfSamples += pts.length;
    const cell = 2 * L.OD + 1, h = new Map<string, number[]>(), kk = (p: V3) => p.map(v => Math.floor(v / cell));
    pts.forEach((q, i) => { const c = kk(q.p).join(','); let l = h.get(c); if (!l) h.set(c, (l = [])); l.push(i); });
    const worst = new Map<string, { gap: number; i: number; j: number }>();
    pts.forEach((q, i) => { const [x, y, z] = kk(q.p); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) for (const j of h.get(`${x + a},${y + b},${z + c}`) ?? []) {
      if (j <= i) continue; const w = pts[j], d = dist(q.p, w.p), gap = d - q.r - w.r, od = 2 * Math.min(q.r, w.r);
      if (gap >= od || Math.abs(w.s - q.s) <= 2 * d + 4 * Math.max(q.r, w.r)) continue;
      const key = `${Math.min(q.k, w.k)},${Math.max(q.k, w.k)}`, cur = worst.get(key); if (!cur || gap < cur.gap) worst.set(key, { gap, i, j });
    } });
    for (const v of worst.values()) { const A = ch[pts[v.i].k], B = ch[pts[v.j].k]; shape(A, B, 'shape', v.gap < 0 ? 'self-crossing' : 'self-approach', `${no}: its centreline comes back within ${v.gap < 0 ? 'its own pipe (the line passes through itself)' : `${v.gap.toFixed(2)} in surface to surface, under one diameter (${(2 * pts[v.i].r).toFixed(2)} in),`} of itself: ${A.tag} and ${B.tag} are ${Math.abs(pts[v.j].s - pts[v.i].s).toFixed(0)} in apart along the line`, pts[v.i].p, Math.max(0, -v.gap)); }
  }
}

// ---- (6) below grade: nothing but foundations under y = 0 ----
for (const P of pieces) {
  if (P.foundation || P.ground) continue;
  let lo = Infinity; for (const i of P.prims) if (!prims[i].anchor) lo = Math.min(lo, prims[i].mn[1]);
  if (lo < -NOISE) shape(P, NONE('grade', 'grade'), 'shape', 'below grade', `${descr(P)} reaches ${(-lo).toFixed(3)} in below grade (y ${lo.toFixed(3)} in the pipeway's frame)`, [P.a[0], lo, P.a[2]], -lo);
}

// ---- (7) supports: each touches its line and bears on something real ----
for (const L of lines.values()) for (const si of L.sups) {
  const S = pieces[si], sp = S.prims.map(i => prims[i]); counts.supports++;
  const box = (ps: Prim[], e: number): [V3, V3] => [[Math.min(...ps.map(p => p.mn[0])) - e, Math.min(...ps.map(p => p.mn[1])) - e, Math.min(...ps.map(p => p.mn[2])) - e], [Math.max(...ps.map(p => p.mx[0])) + e, Math.max(...ps.map(p => p.mx[1])) + e, Math.max(...ps.map(p => p.mx[2])) + e]];
  // touches its line
  const [mn, mx] = box(sp, 1); let touch = -Infinity;
  for (const i of query(mn, mx)) { const X = pieces[prims[i].p]; if (X.owner !== L.key) continue; for (const A of sp) if (!A.bear) touch = Math.max(touch, depth(A, prims[i], true).d); }
  if (touch < -JOIN) shape(S, lineWho(L), 'support', 'support off its line', `${S.kind} ${S.tag} does not touch its line ${L.rec.no}: ${Number.isFinite(touch) ? `${(-touch).toFixed(3)} in clear of it` : 'no piece of the line within 1 in'}`, S.a, 0);
  // bears on something
  const bear = sp.filter(p => p.bear && !p.anchor), hang = S.supType === 'hanger' || S.supType === 'trapeze';
  if (!bear.length) { shape(S, undefined, 'support', 'support bearing', `${S.kind} ${S.tag}: no bearing plate in its part (${S.key})`, S.a); continue; }
  const [bm, bx] = box(bear, 1); let on = -Infinity, onWhat = ''; const touched = new Set<Piece>();
  for (const i of query(bm, bx)) { const X = pieces[prims[i].p]; if (X.cat !== 'static') continue; for (const A of bear) { const d = depth(A, prims[i], true).d; if (d >= -JOIN) touched.add(X); if (d > on) { on = d; onWhat = descr(X); } } }
  const yFace = hang ? Math.max(...bear.map(p => p.mx[1])) : Math.min(...bear.map(p => p.mn[1]));
  if (on >= -JOIN) {
    counts.supportsOnSteel++;
    if ([...touched].every(X => X.tags?.includes('equipment'))) shape(S, [...touched][0], 'support', 'support on equipment', `${S.kind} ${S.tag} of ${L.rec.no} bears only on equipment (${[...touched].map(descr).join('; ')}), not on steel, concrete or grade`, [S.a[0], yFace, S.a[2]], 0);
    continue;
  }
  if (!hang && Math.abs(yFace) <= JOIN) { counts.supportsOnGrade++; continue; }
  // nothing there: how far to the nearest thing below (above, for a hanger)
  let gapTo = Infinity, gapWhat = '';
  const [cm, cx] = box(bear, 0), col: [V3, V3] = hang ? [[cm[0], yFace, cm[2]], [cx[0], yFace + 600, cx[2]]] : [[cm[0], Math.max(-1, yFace - 600), cm[2]], [cx[0], yFace, cx[2]]];
  for (const i of query(col[0], col[1])) { const X = pieces[prims[i].p]; if (X.cat !== 'static') continue; const g = hang ? prims[i].mn[1] - yFace : yFace - prims[i].mx[1]; if (g >= -JOIN && g < gapTo) { gapTo = g; gapWhat = descr(X); } }
  if (!hang && yFace < gapTo) { gapTo = yFace; gapWhat = 'grade'; }
  shape(S, NONE(gapWhat || 'nothing', 'support seat'), 'support', 'support floating', `${S.kind} ${S.tag} of ${L.rec.no} bears on nothing: its ${hang ? 'top plate' : 'base'} at y ${yFace.toFixed(3)} is ${Number.isFinite(gapTo) ? `${gapTo.toFixed(3)} in from ${gapWhat}` : 'over nothing within 50 ft'}${Number.isFinite(on) ? ` (nearest solid touching distance ${(-on).toFixed(3)} in: ${onWhat})` : ''}`, [S.a[0], yFace, S.a[2]], 0);
}

// ------------------------------------------------------------------------------------------------ output
if (envDirty) writeFileSync(ENV_FILE, JSON.stringify({ version: ENV_VERSION, entries: envDisk }));
findings.sort((p, q) => q.depthIn - p.depthIn || p.cls.localeCompare(q.cls));
const outFile = `${OUT_DIR}/findings-${LABEL}.json`;
writeFileSync(outFile, JSON.stringify(findings, null, 1));
const by = (c: string) => findings.filter(f => f.cls === c).length;
const SEATS = ['support-seat'], clashes = findings.filter(f => f.depthIn > NOISE && !['shape', 'continuity', 'support', 'near-miss cross-model', ...SEATS].includes(f.cls));
const meta = { label: LABEL, models: MODELS, seconds: (Date.now() - T0) / 1000, pieces: nPipingPieces, statics: nStatic, envelopes: prims.length, envelopePairsTested: nPairs, frames: nFrames, sleepers: sleeperNote, planted, counts, hopsJustified: hopsJustified.length, byClass: Object.fromEntries([...new Set(findings.map(f => f.cls))].map(c => [c, by(c)])), byRule: Object.fromEntries([...new Set(findings.map(f => f.rule ?? f.cls))].map(c => [c, findings.filter(f => (f.rule ?? f.cls) === c).length])) };
writeFileSync(`${OUT_DIR}/meta-${LABEL}.json`, JSON.stringify({ ...meta, welds: nWelds, meshDropped: nDropped, meshUnverified: nUnverified, droppedList: dropped, hopsJustifiedList: hopsJustified, ...(AUDIT ? { audit: Object.fromEntries([...auditRel].sort((a, b) => b[1].n - a[1].n)) } : {}) }, null, 1));
for (const p of planted) console.error(`PLANTED: ${p}`);
console.log(`routes[${LABEL}]: ${findings.length} findings in ${outFile} - ${clashes.length} overlaps > ${NOISE} in between unrelated objects (${Object.entries(meta.byClass).map(([k, v]) => `${k} ${v}`).join(', ')}); ${counts.lines} lines, ${nPipingPieces} pieces, ${nStatic} steel/equipment/concrete, ${counts.supports} supports, ${counts.hops} hops (${counts.hopsJustified} over something); ${meta.seconds.toFixed(0)} s`);
