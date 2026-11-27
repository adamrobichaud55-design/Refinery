/**
 * voxel: an independent clash detector for plant 3 by VOXEL OCCUPANCY (0.5 in cells).
 *
 *   cd /home/user/Refinery/smartweld && MODELS=<dir> [LABEL=run] [PLANT=pipe|beam|both|sunk|inside|all] npx vite-node <this file>
 *   (debug: DBG="patA~patB" fine-samples a pair; ONLY=unit-12,... restricts the units; RELAUDIT=1 also rasterises every RELATED pair and
 *   writes relaudit-<label>.json with how deep each excused contact goes; SHAPECHECK=1|exit compares every part's 110-cell catalogue mesh
 *   with the shapes held; WELDS=recorded holds weld records as recorded instead of square to their pipe; OLD=torus,bearing,chain,tee,
 *   containment,eqgroup,hardware,sleeve restores a behaviour of the detector as first written, for comparison; NOCACHE=1 ignores the
 *   shape cache)
 *
 * Trusts none of the model's own checks: every solid is rebuilt from its part key / catalogue part and placed in the
 * PIPEWAY frame (inches; x east along the rack, y up from the bench, z south). Each solid's shapes are rasterised at
 * 0.5 in into a sparse hash of cells, tile by tile (32 in tiles), each cell remembering every object that occupies it
 * and that object's signed distance at the cell centre. A cell occupied by two UNRELATED objects is a hit; hits are
 * clustered into one finding per object pair, its depth the deepest -(sdA + sdB) of the cluster (the overlap depth
 * for faces in contact, sub-voxel).
 *
 * Shapes (exact or conservative, never shrunk): pipe = solid cylinder of its OD; elbow = solid torus section with its end
 * disks; tee = two solid cylinders united with the catalogue tee's own mesh (its crotch reaches 0.7 in beyond them);
 * profile-extruded parts (steel sections, plates, rods, concrete) = their exact profile prism; every other solid is split
 * into its connected mesh components, each an exact box, a solid of revolution (only when its volume matches the mesh's
 * within 2%), or else the mesh surface itself (signed by its outward normals). Cast bodies (valves, olets) are polygonised at
 * the catalogue's 110 cells (cached on disk, see keyShapes). A piece wholly inside a closed mesh solid is found by the
 * containment check (ray parity), since a mesh surface is rasterised only near its faces.
 *
 * Contact policy: see CONTACT_POLICY below. Overlaps under 0.02 in are numeric noise.
 *
 * REVIEW (independent reviewer, 2026-11-27): the changes against the first version are marked "REVIEW" in the code. In short:
 * the elbow's signed distance treated its end faces as half-infinite cylinders (a 45 degree elbow reached behind its inlet:
 * false hits, and deep chain overlaps hidden by the chain excuse); bearings (supports, frame posts, equipment) were excused at
 * any depth and a hanger rod was excused against whatever it crossed within 8 in of its top: a bearing is now a contact within
 * 0.05 in; an item was grouped with its own pads, piers, deck and stair at any depth: it now bears on them; connection hardware
 * was excused against all steel and concrete of its cell: now only within its own structure; a sleeve was excused against
 * anything within 6 in: now its floor at its mid point; chain neighbours were excused even where the route folds back over
 * itself; valves and olets were held at 32 cells (up to 2.4 in smaller than the 110-cell part); tees as two cylinders; and a
 * piece inside a mesh solid was not seen.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cells } from '../../src/refinery/assemble';
import { unitToPipeway, PWY, stringersOf } from '../../src/refinery/pipeway';
import { CWM } from '../../src/refinery/coolingWater';
import { framePlaced, type FrameSpec } from '../../src/refinery/supports';
import { gateWidth } from '../../src/refinery/unitPiping';
import { interiorKit } from '../../src/generator/interiorKit';
import { partFromKey, solidBoxes } from '../../src/generator/piping';
import { buildGeometry, profileOf } from '../../src/geometry/partGeometry';
import { setMaxCells } from '../../src/geometry/sdf';
import { multiply, translate, standUp, frameFromAxes } from '../../src/geometry/transform';
import { pipeDims, designFlange, makeWideFlange, teeC, makeValve, type PartSpec, type PipeClass } from '../../src/catalogue';
import { makeOlet } from '../../src/catalogue/parts/smallbore';

type V3 = [number, number, number];
type Mat4 = number[];
const T0 = Date.now(), tick = (s: string) => console.error(`[${((Date.now() - T0) / 1000).toFixed(1)}s] ${s}`);
const HERE = (process.env.AUDIT_OUT ?? 'audit-out') + '/voxel'; mkdirSync(HERE, { recursive: true });
const MODELS = process.env.MODELS; if (!MODELS || !existsSync(`${MODELS}/pipeway.json`)) throw new Error('set MODELS to the model folder');
const LABEL = process.env.LABEL ?? 'run', PLANT = process.env.PLANT ?? '';
const VOX = 0.5, H = (VOX * Math.sqrt(3)) / 2, NOISE = 0.02, ROI_R = 240, JOIN = 0.05;
// REVIEW switches (all off by default; each restores one behaviour of the detector as first written, for comparison runs)
const OLD = new Set((process.env.OLD ?? '').split(',').filter(Boolean)), OLD_TORUS = OLD.has('torus');
const CONTACT_POLICY = [
  'Every solid is voxelised at 0.5 in; a cell counts for an object when the object\'s signed distance at the cell centre is <= the cell\'s half diagonal (0.433 in); the depth of a shared cell is -(sdA+sdB), exact for faces in contact, so touching faces give 0 and a finding needs depth > 0.02 in (numeric noise). A piece inside a closed mesh solid without crossing its faces is found by ray parity (containment).',
  'Pairs are excused ONLY by a named relationship: (chain) consecutive pieces of one line or one nozzle/spool, i.e. neighbours in its component list (stud sets skipped) or sharing an end/port within 0.05 in, but not where the route folds back through the shared end (their directions there reversed); (flanged joint) the pieces of one gasket/spade stack and the two faces either side of it; (bolting) a stud set with every coaxial piece whose face lies within the studs\' length; (line-to-nozzle) a line\'s piece with a piece of the nozzle/spool named as its from/to whose end is within 1 in of the line\'s (across models too); (spool-body) the -P and -U halves of one spool sharing an end; (branch) a branch\'s end piece with the parent line\'s piece it meets within 0.05 in (tee outlet) and an olet with the parent\'s run pieces under its base; (weld) a weld with the pieces it joins and the pieces ending at it; (sleeve) a floor sleeve with its line and the floor within 0.15 in of its mid point.',
  '(support) a support with every piece and weld of its own line; and with the object its bearing face rests on (found within 0.15 in under a shoe/guide/anchor/stanchion/trunnion base, its anchor rods left out, or over a hanger/trapeze top plate: the member, floor, frame beam or sleeper) only as a CONTACT: if that object reaches more than 0.05 in inside the bearing face the pair is not excused (SUNK BEARING); nothing a hanger rod crosses is excused; (frame) a pipe frame\'s parts with each other, and with what each post base or pedestal stands on, as a contact likewise; (nozzle-on-equipment) a nozzle\'s pieces and welds with its own equipment body (same tag, same unit); (equipment) an item\'s body with the pads, piers, deck or other steel under the bottom of each of its solids, as a contact (its own anchor bolts set in its foundation excused); its body is no longer grouped with its foundations or deck; (structure) steel and concrete of one kit structure with each other (a unit cell\'s rack; one item\'s deck and stair; one item\'s pads and piers; the yard supports; the cooler deck; the pipeway\'s rack with its stringers; one junction frame; one sleeper; one pipe frame), its connection hardware included. Nothing else is excused: no depth threshold. A second, prescribed box tier (flanges, valves, gaskets, studs, spades, supports and welds as solidBoxes; pipes and fittings round) runs only on piping-vs-piping pairs of DIFFERENT models; its extra hits are labelled box-only with the exact clearance.',
].join(' ');

// ------------------------------------------------------------------------------------------------------------------
// small vector helpers
const dist3 = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const xfP = (M: ArrayLike<number>, x: number, y: number, z: number): V3 => [M[0] * x + M[4] * y + M[8] * z + M[12], M[1] * x + M[5] * y + M[9] * z + M[13], M[2] * x + M[6] * y + M[10] * z + M[14]];
const round = (v: number, k = 1e3) => Math.round(v * k) / k;

// ------------------------------------------------------------------------------------------------------------------
// LOCAL SHAPES: a part's solids in its own frame. Each has a signed distance (exact, or >= the true one: never deeper
// inside nor nearer outside than the solid really is) and a local box.
interface Box6 { mn: V3; mx: V3 }
type Shape =
  | { t: 0; b: Box6; mn: V3; mx: V3; exact: true }                                                     // box
  | { t: 1; L: number; ro: number; ri: number; mn: V3; mx: V3 }                                        // hollow cylinder on local z, 0..L
  | { t: 2; k: number; cu: number; cv: number; P: Float64Array; n: number; mn: V3; mx: V3 }             // solid of revolution: meridian polygon (rho, t) about axis k through (cu, cv)
  | { t: 3; R: number; ro: number; ri: number; ang: number; mn: V3; mx: V3 }                           // elbow: hollow torus section (inlet at origin along +z, turning toward +x about (R,0,0))
  | { t: 4; O: Float64Array; I: Float64Array | null; z0: number; z1: number; mn: V3; mx: V3 }          // prism: profile polygon (and hole) extruded on z
  | { t: 5; pos: ArrayLike<number>; tri: Int32Array; sgn: number; mn: V3; mx: V3; grid?: TriGrid };    // mesh surface: triangles; sgn 1/-1 orientation, 0 unsigned

interface TriGrid { o: V3; c: number; nx: number; ny: number; nz: number; start: Int32Array; items: Int32Array }

function polySd(px: number, py: number, P: Float64Array): number {
  const n = P.length / 2; let d = Infinity, s = 1;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = P[2 * i], yi = P[2 * i + 1], ex = P[2 * j] - xi, ey = P[2 * j + 1] - yi, wx = px - xi, wy = py - yi, ee = ex * ex + ey * ey;
    const t = ee > 0 ? Math.min(1, Math.max(0, (wx * ex + wy * ey) / ee)) : 0, bx = wx - ex * t, by = wy - ey * t, dd = bx * bx + by * by;
    if (dd < d) d = dd;
    const c1 = py >= yi, c2 = py < P[2 * j + 1], c3 = ex * wy > ey * wx;
    if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
  }
  return s * Math.sqrt(d);
}
const comb2 = (a: number, b: number) => (a > 0 || b > 0 ? Math.hypot(Math.max(a, 0), Math.max(b, 0)) : Math.max(a, b));

/** signed distance of a local point to a shape (not for t=5) */
function shapeSd(s: Shape, x: number, y: number, z: number): number {
  switch (s.t) {
    case 0: { const b = s.b, dx = Math.max(b.mn[0] - x, x - b.mx[0]), dy = Math.max(b.mn[1] - y, y - b.mx[1]), dz = Math.max(b.mn[2] - z, z - b.mx[2]);
      if (dx > 0 || dy > 0 || dz > 0) return Math.hypot(Math.max(dx, 0), Math.max(dy, 0), Math.max(dz, 0)); return Math.max(dx, dy, dz); }
    case 1: { const r = Math.hypot(x, y), dr = s.ri > 0 ? Math.max(r - s.ro, s.ri - r) : r - s.ro, dz = Math.max(-z, z - s.L); return comb2(dr, dz); }
    case 2: { const u = s.k === 0 ? y : x, v = s.k === 2 ? y : z, t = s.k === 0 ? x : s.k === 1 ? y : z; return polySd(Math.hypot(u - s.cu, v - s.cv), t, s.P); }
    case 3: {
      const X = x - s.R, ang = s.ang, th = Math.atan2(z, -X);
      const dIn = z, dOut = -X * Math.sin(ang) - z * Math.cos(ang);
      if (th >= 0 && th <= ang && dIn >= 0 && dOut >= 0) { const rr = Math.hypot(Math.hypot(X, z) - s.R, y), dr = Math.max(rr - s.ro, s.ri - rr); return Math.max(dr, -dIn, -dOut); }
      // beyond an end: distance to that end's annulus face
      const endD = (cx: number, cz: number, ux: number, uz: number) => { const qx = x - cx, qz = z - cz, ax = qx * ux + qz * uz, rx = qx - ux * ax, rz = qz - uz * ax, rad = Math.hypot(rx, y, rz), dr = Math.max(rad - s.ro, s.ri - rad); return OLD_TORUS ? comb2(dr, ax) : Math.hypot(Math.max(dr, 0), ax); };   // REVIEW: outside the bend's wedge the solid's nearest point is on an end disk (it was a half-infinite cylinder, which held a 45 degree elbow as reaching behind its inlet)
      const a = endD(0, 0, 0, -1), b = endD(s.R - s.R * Math.cos(ang), s.R * Math.sin(ang), Math.sin(ang), Math.cos(ang));
      return Math.min(a, b);
    }
    case 4: { let d2 = polySd(x, y, s.O); if (s.I) d2 = Math.max(d2, -polySd(x, y, s.I)); return comb2(d2, Math.max(s.z0 - z, z - s.z1)); }
  }
  return Infinity;
}

// ---- connected components of a mesh (by shared vertex index and by coincident position) ----
function components(P: ArrayLike<number>, I: ArrayLike<number>): Int32Array[] {
  const n = P.length / 3, par = new Int32Array(n); for (let i = 0; i < n; i++) par[i] = i;
  const f = (x: number): number => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  const uni = (a: number, b: number) => { a = f(a); b = f(b); if (a !== b) par[a] = b; };
  for (let t = 0; t < I.length; t += 3) { uni(I[t], I[t + 1]); uni(I[t], I[t + 2]); }
  const q = 1e4, map = new Map<number, number>();
  for (let i = 0; i < n; i++) {
    const kx = Math.round(P[3 * i] * q), ky = Math.round(P[3 * i + 1] * q), kz = Math.round(P[3 * i + 2] * q);
    const key = ((kx * 73856093) ^ (ky * 19349663) ^ (kz * 83492791)) >>> 0;
    // chained check against collisions: store the first index; compare exact quantised coords
    const j = map.get(key);
    if (j === undefined) map.set(key, i);
    else if (Math.round(P[3 * j] * q) === kx && Math.round(P[3 * j + 1] * q) === ky && Math.round(P[3 * j + 2] * q) === kz) uni(i, j);
  }
  // triangles per component root
  const byRoot = new Map<number, number[]>();
  for (let t = 0; t < I.length; t += 3) { const r = f(I[t]); let l = byRoot.get(r); if (!l) byRoot.set(r, l = []); l.push(I[t], I[t + 1], I[t + 2]); }
  return [...byRoot.values()].map(l => Int32Array.from(l));
}
function triVolume(P: ArrayLike<number>, tri: Int32Array): number {
  let v = 0;
  for (let t = 0; t < tri.length; t += 3) {
    const a = 3 * tri[t], b = 3 * tri[t + 1], c = 3 * tri[t + 2];
    v += P[a] * (P[b + 1] * P[c + 2] - P[b + 2] * P[c + 1]) - P[a + 1] * (P[b] * P[c + 2] - P[b + 2] * P[c]) + P[a + 2] * (P[b] * P[c + 1] - P[b + 1] * P[c]);
  }
  return v / 6;
}
const STATS = { box: 0, axi: 0, gen: 0, genUnsigned: 0, prism: 0, cyl: 0, torus: 0, nonRigid: 0, weldsSquared: 0, weldsTilted: 0 };
let tiltedNow = false;
/** classify one mesh component: exact box, validated solid of revolution, or mesh surface */
function classify(P: ArrayLike<number>, tri: Int32Array): Shape | null {
  const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity];
  const vs = new Set<number>(); for (let i = 0; i < tri.length; i++) vs.add(tri[i]);
  const idx = [...vs];
  for (const i of idx) for (let a = 0; a < 3; a++) { const v = P[3 * i + a]; if (v < mn[a]) mn[a] = v; if (v > mx[a]) mx[a] = v; }
  if (!Number.isFinite(mn[0])) return null;
  const size: V3 = [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]], big = Math.max(1, ...size), tol = 1e-4 * big;
  const vol = triVolume(P, tri), bvol = size[0] * size[1] * size[2];
  if (Math.min(...size) < 1e-6) return null;                                                               // a flat sheet with no volume
  // exact box: every vertex at a corner of its bounds, and the volume of the bounds
  if (idx.every(i => [0, 1, 2].every(a => Math.abs(P[3 * i + a] - mn[a]) < tol || Math.abs(P[3 * i + a] - mx[a]) < tol)) && Math.abs(Math.abs(vol) - bvol) < 0.02 * bvol) { STATS.box++; return { t: 0, b: { mn, mx }, mn, mx, exact: true }; }
  // solid of revolution about a local axis through its bounds' centre: every level's vertices on circles; meridian polygon from the
  // levels (outer = largest radius at the level, inner = smallest where the level has two), accepted only if its volume is the mesh's
  if (Math.abs(vol) > 1e-9) for (const k of [2, 1, 0]) {
    const [u, v] = [0, 1, 2].filter(a => a !== k), cu = (mn[u] + mx[u]) / 2, cv = (mn[v] + mx[v]) / 2, hu = size[u] / 2, hv = size[v] / 2;
    if (Math.abs(hu - hv) > 0.015 * Math.max(hu, hv)) continue;
    let mr = 0; for (const i of idx) mr = Math.max(mr, Math.hypot(P[3 * i + u] - cu, P[3 * i + v] - cv));
    if (mr > Math.max(hu, hv) * 1.015 + 1e-6) continue;
    const lv = new Map<number, { t: number; lo: number; hi: number }>();
    for (const i of idx) { const t = Math.round(P[3 * i + k] * 1e3) / 1e3, r = Math.hypot(P[3 * i + u] - cu, P[3 * i + v] - cv); const e = lv.get(t); if (e) { e.lo = Math.min(e.lo, r); e.hi = Math.max(e.hi, r); } else lv.set(t, { t, lo: r, hi: r }); }
    const L = [...lv.values()].sort((a, b) => a.t - b.t); if (L.length < 2 || L.length > 160) continue;
    const two = L.filter(e => e.hi - e.lo > 1e-3 * big);
    const hollow = two.length >= 2 && two.every(e => e.lo > 1e-3 * big);
    const inner = (t: number) => { if (!hollow) return 0; let j = 0; while (j < two.length - 1 && two[j + 1].t < t) j++; const a = two[Math.min(j, two.length - 1)], b = two[Math.min(j + 1, two.length - 1)]; if (t <= a.t || a === b) return a.lo; if (t >= b.t) return b.lo; return a.lo + ((b.lo - a.lo) * (t - a.t)) / (b.t - a.t); };
    const pts: number[] = [];
    for (const e of L) pts.push(e.hi, e.t);
    if (hollow) for (let j = L.length - 1; j >= 0; j--) pts.push(Math.min(inner(L[j].t), L[j].hi), L[j].t);
    else for (let j = L.length - 1; j >= 0; j--) pts.push(-L[j].hi, L[j].t);
    // revolved volume of the meridian polygon (Pappus over the rho >= 0 half for a hollow one; half of the mirrored one for a solid one)
    const poly = Float64Array.from(pts);
    let A = 0, Mx = 0; const n = poly.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i++) { const x0 = poly[2 * j], y0 = poly[2 * j + 1], x1 = poly[2 * i], y1 = poly[2 * i + 1], c = x0 * y1 - x1 * y0; A += c; Mx += (x0 + x1) * c; }
    A /= 2; Mx /= 6; // Mx = integral of rho dA
    let revVol: number;
    if (hollow) revVol = Math.abs(2 * Math.PI * Mx);
    else { let Ah = 0, Mh = 0; const m = L.length, half: number[] = []; for (const e of L) half.push(e.hi, e.t); for (let j = m - 1; j >= 0; j--) half.push(0, L[j].t);
      for (let i = 0, j = half.length / 2 - 1; i < half.length / 2; j = i++) { const x0 = half[2 * j], y0 = half[2 * j + 1], x1 = half[2 * i], y1 = half[2 * i + 1], c = x0 * y1 - x1 * y0; Ah += c; Mh += (x0 + x1) * c; } void Ah; revVol = Math.abs(2 * Math.PI * Mh / 6); }
    if (Math.abs(revVol - Math.abs(vol)) <= 0.02 * Math.abs(vol)) { STATS.axi++; return { t: 2, k, cu, cv, P: poly, n: poly.length / 2, mn, mx }; }
  }
  // the surface itself; signed by its orientation when it encloses a volume
  const sgn = Math.abs(vol) > 1e-6 * Math.max(bvol, 1e-9) ? Math.sign(vol) : 0; if (!sgn) STATS.genUnsigned++;
  STATS.gen++;
  return { t: 5, pos: P, tri, sgn, mn, mx };
}

const PRISM_KINDS = new Set(['W', 'C', 'L', 'HSS_RECT', 'HSS_ROUND', 'PL', 'GUSSET', 'STIFFENER', 'Z', 'CS', 'ROD', 'PANEL', 'TRIM', 'CONCRETE', 'DOOR_LEAF', 'DOOR_CURTAIN', 'DOOR_DRUM', 'FILLET_WELD', 'GROOVE_WELD']);
const shapeCache = new WeakMap<object, Shape[]>();
function boundsOfPoly(P: Float64Array) { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (let i = 0; i < P.length; i += 2) { x0 = Math.min(x0, P[i]); x1 = Math.max(x1, P[i]); y0 = Math.min(y0, P[i + 1]); y1 = Math.max(y1, P[i + 1]); } return [x0, y0, x1, y1]; }
/** the shapes of a catalogue part in its own frame */
function partShapes(part: PartSpec): Shape[] {
  const hit = shapeCache.get(part); if (hit) return hit;
  const out: Shape[] = [];
  if (PRISM_KINDS.has(part.kind) && part.length) {
    const pr = profileOf(part)!, O = Float64Array.from(pr.outer.flatMap(p => [p.x, p.y])), I = pr.inner ? Float64Array.from((pr.inner as { x: number; y: number }[]).flatMap(p => [p.x, p.y])) : null, L = part.length.value, [x0, y0, x1, y1] = boundsOfPoly(O);
    out.push({ t: 4, O, I, z0: 0, z1: L, mn: [x0, y0, 0], mx: [x1, y1, L] }); STATS.prism++;
  } else for (const so of buildGeometry(part).solids) {
    const P = so.mesh.positions, I = so.mesh.indices; if (!P.length || !I.length) continue;
    for (const c of components(P, I)) { const s = classify(P, c); if (s) { if (/anchor/i.test(so.name)) (s as { anchor?: boolean }).anchor = true; out.push(s); } }
  }
  shapeCache.set(part, out); return out;
}
const keyShapeCache = new Map<string, Shape[]>(), CAST_CELLS = Number(process.env.CAST_CELLS ?? 110);
// REVIEW: cast bodies (valves, olets) are polygonised from their signed distance fields; at the 32 cells first used a 24 in gate valve lost a
// whole feature and the 110-cell surface reached up to 2.4 in beyond the shapes held. They are now polygonised at the catalogue's default 110
// cells. That costs about 5 minutes, so their classified shapes are cached on disk under a hash of the catalogue and geometry sources and of
// this file's shape code (a changed source is a new cache folder; NOCACHE=1 ignores the cache).
const isCast = (key: string) => key.startsWith('VLV') || key.startsWith('OLET');
const castBoxes = new Map<string, [V3, V3][]>();
let CACHE_DIR = '';
function cacheDir(): string {
  if (CACHE_DIR) return CACHE_DIR;
  const h = createHash('sha1'), walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(`${d}/${e.name}`) : /\.ts$/.test(e.name) ? [`${d}/${e.name}`] : [])).sort();
  const root = new URL('../../src/', import.meta.url).pathname.replace(/\/$/, '');   // from this file, wherever it is run from
  for (const f of [...walk(`${root}/catalogue`), ...walk(`${root}/geometry`), `${root}/generator/piping.ts`]) h.update(f).update(readFileSync(f));
  h.update(String(CAST_CELLS)).update(components.toString()).update(classify.toString()).update('shapes of a part: buildGeometry solids, split into components, each classified; v2');
  CACHE_DIR = `${HERE}/shape-cache/${h.digest('hex').slice(0, 16)}`; return CACHE_DIR;
}
const cacheFile = (key: string) => `${cacheDir()}/${key.replace(/[^A-Za-z0-9.]+/g, '_')}.bin`;
function writeCache(key: string, shapes: Shape[], boxes: [V3, V3][]) {
  const bufs: (Float64Array | Int32Array)[] = [], ids = new Map<unknown, number>(), buf = (a: ArrayLike<number>, int: boolean) => { let i = ids.get(a); if (i === undefined) { ids.set(a, i = bufs.length); bufs.push(int ? Int32Array.from(a) : Float64Array.from(a)); } return i; };
  const head = shapes.map(sh => (sh.t === 5 ? { t: 5, pos: buf(sh.pos, false), tri: buf(sh.tri, true), sgn: sh.sgn, mn: sh.mn, mx: sh.mx } : sh.t === 2 ? { t: 2, k: sh.k, cu: sh.cu, cv: sh.cv, P: buf(sh.P, false), n: sh.n, mn: sh.mn, mx: sh.mx } : sh.t === 0 ? { t: 0, mn: sh.mn, mx: sh.mx } : null));
  if (head.includes(null)) return;
  const meta = Buffer.from(JSON.stringify({ key, head, boxes, bufs: bufs.map(b => [b instanceof Int32Array ? 'i' : 'f', b.length]) })), len = Buffer.alloc(4); len.writeUInt32LE(meta.length);
  mkdirSync(cacheDir(), { recursive: true }); writeFileSync(cacheFile(key), Buffer.concat([len, meta, ...bufs.map(b => Buffer.from(b.buffer, b.byteOffset, b.byteLength))]));
}
function readCache(key: string): { shapes: Shape[]; boxes: [V3, V3][] } | undefined {
  const f = cacheFile(key); if (process.env.NOCACHE || !existsSync(f)) return undefined;
  const B = readFileSync(f), n = B.readUInt32LE(0), meta = JSON.parse(B.subarray(4, 4 + n).toString()); if (meta.key !== key) return undefined;
  let off = 4 + n; const bufs = (meta.bufs as [string, number][]).map(([t, len]) => { const bytes = len * (t === 'i' ? 4 : 8), ab = new ArrayBuffer(bytes); new Uint8Array(ab).set(B.subarray(off, off + bytes)); off += bytes; return t === 'i' ? new Int32Array(ab) : new Float64Array(ab); });
  const shapes = (meta.head as any[]).map(h => (h.t === 5 ? { t: 5, pos: bufs[h.pos], tri: bufs[h.tri] as Int32Array, sgn: h.sgn, mn: h.mn, mx: h.mx } : h.t === 2 ? { t: 2, k: h.k, cu: h.cu, cv: h.cv, P: bufs[h.P] as Float64Array, n: h.n, mn: h.mn, mx: h.mx } : { t: 0, b: { mn: h.mn, mx: h.mx }, mn: h.mn, mx: h.mx, exact: true })) as Shape[];
  for (const sh of shapes) { if (sh.t === 0) STATS.box++; else if (sh.t === 2) STATS.axi++; else if (sh.t === 5) STATS.gen++; }
  return { shapes, boxes: meta.boxes };
}
let cacheHits = 0, cacheMisses = 0;
if (process.env.HASHONLY) { console.log(cacheDir()); process.exit(0); }
function keyShapes(key: string): Shape[] {
  let s = keyShapeCache.get(key); if (s) return s;
  if (isCast(key)) { const c = readCache(key); if (c) { cacheHits++; keyShapeCache.set(key, c.shapes); castBoxes.set(key, c.boxes); return c.shapes; } cacheMisses++; setMaxCells(CAST_CELLS); }
  try { const part = partFromKey(key); s = partShapes(part); if (isCast(key)) { const b = solidBoxes(part); castBoxes.set(key, b); writeCache(key, s, b); } } finally { setMaxCells(110); }
  keyShapeCache.set(key, s); return s;
}
/** a part's solid boxes (the box tier); a cast body's from the same polygonisation as its shapes */
function keyBoxes(key: string): [V3, V3][] { if (isCast(key)) { keyShapes(key); return castBoxes.get(key)!; } return solidBoxes(partFromKey(key)); }

// ------------------------------------------------------------------------------------------------------------------
// OBJECTS and PRIMITIVES (a shape placed by a rigid transform)
type Cat = 'pipe' | 'support' | 'weld' | 'nozzle' | 'steel' | 'hardware' | 'concrete' | 'equipment' | 'frame' | 'junction' | 'sleeper' | 'pwsteel' | 'planted';
interface Obj { id: number; model: string; line: string; tag: string; kind: string; cat: Cat; group: number; prims: number[]; mn: V3; mx: V3; lineKey: string; unit?: number; equipTag?: string; ports?: number[]; extra?: any }
const objs: Obj[] = [];
interface Prim { obj: number; s: Shape; M: Float64Array; mn: V3; mx: V3 }
const prims: Prim[] = [];
const groupIds = new Map<string, number>(); const gid = (k: string) => { let g = groupIds.get(k); if (g === undefined) groupIds.set(k, g = groupIds.size); return g; };

function newObj(o: Omit<Obj, 'id' | 'prims' | 'mn' | 'mx'>): Obj { const ob: Obj = { ...o, id: objs.length, prims: [], mn: [Infinity, Infinity, Infinity], mx: [-Infinity, -Infinity, -Infinity] }; objs.push(ob); return ob; }
function rigid(M: Mat4): Float64Array {
  const m = Float64Array.from(M.slice(0, 16));
  const c = [[m[0], m[1], m[2]], [m[4], m[5], m[6]], [m[8], m[9], m[10]]];
  const err = Math.abs(Math.hypot(...c[0]) - 1) + Math.abs(Math.hypot(...c[1]) - 1) + Math.abs(Math.hypot(...c[2]) - 1) + Math.abs(c[0][0] * c[1][0] + c[0][1] * c[1][1] + c[0][2] * c[1][2]) + Math.abs(c[0][0] * c[2][0] + c[0][1] * c[2][1] + c[0][2] * c[2][2]) + Math.abs(c[1][0] * c[2][0] + c[1][1] * c[2][1] + c[1][2] * c[2][2]);
  if (err > 1e-4) {
    STATS.nonRigid++;
    const z = c[2].map(v => v / Math.hypot(...c[2])), y0 = c[1], xr = [y0[1] * z[2] - y0[2] * z[1], y0[2] * z[0] - y0[0] * z[2], y0[0] * z[1] - y0[1] * z[0]], xl = Math.hypot(...xr), x = xr.map(v => v / xl), y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    m[0] = x[0]; m[1] = x[1]; m[2] = x[2]; m[4] = y[0]; m[5] = y[1]; m[6] = y[2]; m[8] = z[0]; m[9] = z[1]; m[10] = z[2];
  }
  return m;
}
function addPrim(ob: Obj, s: Shape, M: Float64Array) {
  const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity];
  for (let k = 0; k < 8; k++) { const p = xfP(M, k & 1 ? s.mx[0] : s.mn[0], k & 2 ? s.mx[1] : s.mn[1], k & 4 ? s.mx[2] : s.mn[2]); for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], p[a] - H); mx[a] = Math.max(mx[a], p[a] + H); } }
  prims.push({ obj: ob.id, s, M, mn, mx }); ob.prims.push(prims.length - 1);
  for (let a = 0; a < 3; a++) { ob.mn[a] = Math.min(ob.mn[a], mn[a]); ob.mx[a] = Math.max(ob.mx[a], mx[a]); }
}
function addShapes(ob: Obj, shapes: Shape[], M: Mat4) { const R = rigid(M); for (const s of shapes) addPrim(ob, s, R); }
/** world point to a primitive's local frame */
function toLocal(M: Float64Array, x: number, y: number, z: number): V3 { const dx = x - M[12], dy = y - M[13], dz = z - M[14]; return [M[0] * dx + M[1] * dy + M[2] * dz, M[4] * dx + M[5] * dy + M[6] * dz, M[8] * dx + M[9] * dy + M[10] * dz]; }

// ------------------------------------------------------------------------------------------------------------------
// LOAD: the piping models
interface Comp { tag: string; kind: string; key: string; T: Mat4; a: V3; b: V3; NPS: number; cls: PipeClass; e1?: string; e2?: string; ins?: [number, number]; onRun?: string }
interface Line { no: string; NPS: number; cls: PipeClass; kind: string; from: string; to: string; comps: Comp[]; supports: { id: string; line: string; type: string; at: V3; key: string; T: Mat4 }[]; welds: { id: string; line: string; type: string; at: V3; joins: [string, string]; key: string; T: Mat4 }[]; pens?: Comp[]; side?: Comp[] }
interface Nozzle { id: string; equip: string; face: V3; u: V3; comps: Comp[]; welds: Line['welds'] }
interface Model { lines: Line[]; nozzles: Nozzle[] }
const load = (f: string) => JSON.parse(readFileSync(`${MODELS}/${f}`, 'utf8'));

tick('cells()');
const site = cells();
const unitT = new Map<string, Mat4>();       // model name -> its frame in the pipeway frame
for (const { plot, cell } of site) unitT.set(plot.kind === 'unit' ? `unit-${plot.unit}` : `unit-${plot.unit}-tower`, unitToPipeway(plot, cell));
const CW_T: Mat4 = translate(0, 0, CWM.way);
const I4: Mat4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
const MODEL_NAMES = [...[11, 12, 13, 14, 15, 16, 17, 18, 19].map(u => `unit-${u}`), 'pipeway', 'cooling-water'].filter(m => !ONLY || ONLY.has(m) || m === 'pipeway' || m === 'cooling-water');
const frameOf = (m: string): Mat4 => (m === 'pipeway' ? I4 : m === 'cooling-water' ? CW_T : unitT.get(m)!);

tick('piping models');
const models = new Map<string, Model>();
for (const m of MODEL_NAMES) models.set(m, load(`${m}.json`));
const pipeKeyDims = new Map<string, { OD: number; D: number }>();
const pipeDimsOf = (key: string) => { const k = key.split('|'), base = `PIPE|${k[1]}|${k[2]}|1.000${k[4] ? '|' + k[4] : ''}`; let d = pipeKeyDims.get(base); if (!d) { const p = partFromKey(base); d = { OD: p.dims.OD.value, D: p.dims.D.value }; pipeKeyDims.set(base, d); } return d; };
const lineObjs = new Map<string, Obj[]>();          // lineKey -> its pieces (comps), in order
const tagIndex = new Map<string, Obj>();            // model|tag -> object
const nozzleIndex = new Map<string, { model: string; nz: Nozzle; objs: Obj[] }>();
const lineIndex = new Map<string, { model: string; line: Line; objs: Obj[] }>();
const portXf = (M: Mat4, p: V3) => xfP(M, p[0], p[1], p[2]);

function compShapesPlaced(ob: Obj, c: Comp, F: Mat4) {
  const M = multiply(F, c.T);
  if (c.kind === 'pipe') {
    const d = pipeDimsOf(c.key), ins = c.ins ? c.ins[0] + c.ins[1] : 0, L = dist3(c.a, c.b) + ins;
    addShapes(ob, [{ t: 1, L, ro: d.OD / 2, ri: 0, mn: [-d.OD / 2, -d.OD / 2, 0], mx: [d.OD / 2, d.OD / 2, L] }], M); STATS.cyl++;
  } else if (c.kind === 'elbow' && c.key.startsWith('EL|')) {
    const p = partFromKey(c.key), R = p.extra!.R as number, ang = p.extra!.angle as number, pd = pipeDims(c.NPS, c.cls), ro = pd.OD / 2, ri = 0;
    addShapes(ob, [{ t: 3, R, ro, ri, ang, mn: [-ro, -ro, -ro], mx: [R + ro, ro, R + ro] }], M); STATS.torus++;
  } else if (c.kind === 'tee' && c.key.startsWith('TEE|')) {
    const k = c.key.split('|'), run = pipeDims(Number(k[1]), k[2] as PipeClass), br = pipeDims(Number(k[3] ?? k[1]), k[2] as PipeClass), C = teeC(run.OD);
    addShapes(ob, [{ t: 1, L: 2 * C, ro: run.OD / 2, ri: 0, mn: [-run.OD / 2, -run.OD / 2, 0], mx: [run.OD / 2, run.OD / 2, 2 * C] }], multiply(M, translate(0, 0, -C)));
    const B: Mat4 = [1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1];   // local z -> part y
    addShapes(ob, [{ t: 1, L: C, ro: br.OD / 2, ri: 0, mn: [-br.OD / 2, -br.OD / 2, 0], mx: [br.OD / 2, br.OD / 2, C] }], multiply(M, B)); STATS.cyl += 2;
    ob.ports!.push(...xfP(M, 0, C, 0));
    // REVIEW: the catalogue tee's body reaches up to 0.7 in beyond the two cylinders (its crotch); held as their union with its own mesh
    if (!OLD.has('tee')) addShapes(ob, keyShapes(c.key), M);
  } else addShapes(ob, keyShapes(c.key), M);
}
for (const [m, md] of models) {
  const F = frameOf(m);
  for (const n of md.nozzles) {
    const ent = { model: m, nz: n, objs: [] as Obj[] }; nozzleIndex.set(n.id, ent);
    for (const c of n.comps) {
      const ob = newObj({ model: m, line: n.id, tag: c.tag, kind: c.kind, cat: 'nozzle', group: -1, lineKey: `${m}|N:${n.id}`, equipTag: n.equip, ports: [...portXf(F, c.a), ...portXf(F, c.b)], extra: { comp: c, F } });
      compShapesPlaced(ob, c, F); ent.objs.push(ob); tagIndex.set(`${m}|${c.tag}`, ob);
    }
    lineObjs.set(`${m}|N:${n.id}`, ent.objs);
  }
  for (const l of md.lines) {
    const ent = { model: m, line: l, objs: [] as Obj[] }; lineIndex.set(`${m}|${l.no}`, ent);
    for (const c of [...l.comps, ...(l.side ?? [])]) {
      const ob = newObj({ model: m, line: l.no, tag: c.tag, kind: c.kind, cat: 'pipe', group: -1, lineKey: `${m}|${l.no}`, ports: [...portXf(F, c.a), ...portXf(F, c.b)], extra: { comp: c, F } });
      compShapesPlaced(ob, c, F); ent.objs.push(ob); tagIndex.set(`${m}|${c.tag}`, ob);
    }
    lineObjs.set(`${m}|${l.no}`, ent.objs);
    for (const c of l.pens ?? []) { const ob = newObj({ model: m, line: l.no, tag: c.tag, kind: 'penetration', cat: 'pipe', group: -1, lineKey: `${m}|${l.no}|pen`, ports: [], extra: { comp: c, F, pen: true } }); addShapes(ob, keyShapes(c.key), multiply(F, c.T)); tagIndex.set(`${m}|${c.tag}`, ob); }
    for (const s of l.supports) { const ob = newObj({ model: m, line: l.no, tag: s.id, kind: `support:${s.type}`, cat: 'support', group: -1, lineKey: `${m}|${l.no}|sup`, extra: { sup: s, F } }); addShapes(ob, keyShapes(s.key), multiply(F, s.T)); }
  }
  const byTag = new Map<string, Comp>(); for (const l of md.lines) for (const c of l.comps) byTag.set(c.tag, c); for (const n of md.nozzles) for (const c of n.comps) byTag.set(c.tag, c);
  const weldT = (w: Line['welds'][number]): Mat4 => {
    // the pipe's axis at the joint: a straight piece's a->b, or an elbow's tangent at the end the weld is on
    let t: V3 | undefined;
    for (const tg of w.joins) { const c = byTag.get(tg); if (!c || c.kind === 'studs' || c.kind === 'olet' || c.kind === 'tee') continue; const L = dist3(c.a, c.b); if (L < 1e-6) continue;
      if (c.kind !== 'elbow') { t = [(c.b[0] - c.a[0]) / L, (c.b[1] - c.a[1]) / L, (c.b[2] - c.a[2]) / L]; break; }
      if (c.key.startsWith('EL|')) { const ang = (partFromKey(c.key).extra!.angle as number), atA = dist3(w.at, c.a) < dist3(w.at, c.b), T = c.T; t = atA ? [T[8], T[9], T[10]] : [T[0] * Math.sin(ang) + T[8] * Math.cos(ang), T[1] * Math.sin(ang) + T[9] * Math.cos(ang), T[2] * Math.sin(ang) + T[10] * Math.cos(ang)]; } }
    if (!t) return w.T;
    tiltedNow = false;
    const d = [w.T[8], w.T[9], w.T[10]], cos = Math.abs(d[0] * t[0] + d[1] * t[1] + d[2] * t[2]) / (Math.hypot(d[0], d[1], d[2]) || 1);
    if (cos > Math.cos(Math.PI / 180)) return w.T;
    tiltedNow = true; if (process.env.WELDS === 'recorded') return w.T;
    STATS.weldsSquared++; return frameFromAxes(w.at, Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], t);
  };
  for (const l of md.lines) for (const w of l.welds) { tiltedNow = false; const WT = weldT(w); const ob = newObj({ model: m, line: l.no, tag: w.id, kind: `weld:${w.type}`, cat: 'weld', group: -1, lineKey: `${m}|${l.no}|weld`, extra: { weld: w, F, tilted: tiltedNow } }); addShapes(ob, keyShapes(w.key), multiply(F, WT)); if (tiltedNow) STATS.weldsTilted++; }
  for (const n of md.nozzles) for (const w of n.welds) { tiltedNow = false; const WT = weldT(w); const ob = newObj({ model: m, line: n.id, tag: w.id, kind: `weld:${w.type}`, cat: 'weld', group: -1, lineKey: `${m}|N:${n.id}|weld`, extra: { weld: w, F, tilted: tiltedNow } }); addShapes(ob, keyShapes(w.key), multiply(F, WT)); if (tiltedNow) STATS.weldsTilted++; }
}
const nPiping = objs.length;
tick(`piping objects ${nPiping}, prims ${prims.length}; cast bodies (valves, olets) at ${CAST_CELLS} cells: ${cacheHits} from the shape cache, ${cacheMisses} polygonised (${cacheDir()})`);

// ------------------------------------------------------------------------------------------------------------------
// LOAD: steel, equipment and concrete of the cells; the pipeway's own steel; the sleepers; the pipe frames
const HARDWARE_KINDS = new Set(['BOLT', 'ANCHOR_ROD', 'FILLET_WELD', 'FILLET_WELD_AROUND', 'BASE_PLATE', 'GROOVE_WELD', 'STUD']);
const equipByUnitTag = new Map<string, Obj[]>();
const EQUIP_TAGS = new Map<string, Set<string>>();
for (const { plot, cell } of site) { const model = plot.kind === 'unit' ? `unit-${plot.unit}` : `unit-${plot.unit}-tower`; EQUIP_TAGS.set(model, new Set(cell.interior.instances.filter(i => i.tags.includes('equipment')).map(i => i.tags[0]))); }
function structureGroup(model: string, tags: string[]): string {
  const t0 = tags[0] ?? '';
  if (/^rack-/.test(t0)) return `${model}:rack`;
  // an item's own foundations (pad, pier, ...) and the deck and stair built for it: with the item (equipment-own-structure)
  // REVIEW: an item's deck and stair are one structure, and its pads and piers another; neither is grouped with the item's body, which is excused
  // against them only where it bears on them (its bottom face at their top within JOIN): a body standing in its own deck steel or sunk in its pad is reported
  const m = /^([A-Z]+-\d+[A-Z]?)-(deck|stair)/.exec(t0); if (m && EQUIP_TAGS.get(model)?.has(m[1])) return OLD.has('eqgroup') ? `${model}:eq:${m[1]}` : `${model}:${m[1]}-structure`; if (m) return `${model}:${m[1]}-structure`;
  if (EQUIP_TAGS.get(model)?.has(t0)) return OLD.has('eqgroup') ? `${model}:eq:${t0}` : `${model}:foundation:${t0}`;
  return `${model}:${t0}`;
}
for (const { plot, cell } of site) {
  const model = plot.kind === 'unit' ? `unit-${plot.unit}` : `unit-${plot.unit}-tower`, F = unitT.get(model)!;
  if (ONLY && !ONLY.has(`unit-${plot.unit}`)) continue;
  for (const inst of cell.interior.instances) {
    if (inst.tags.includes('keep-out')) continue;
    const isEq = inst.tags.includes('equipment'), kind = inst.part.kind, hw = HARDWARE_KINDS.has(kind) || (kind === 'PL' && (inst.tags.includes('clip') || inst.tags.includes('end-plate')));
    const cat: Cat = isEq ? 'equipment' : hw ? 'hardware' : kind === 'CONCRETE' || inst.tags.includes('pad') ? 'concrete' : 'steel';
    const group = isEq ? gid(`${model}:eq:${inst.tags[0]}`) : gid(structureGroup(model, inst.tags));
    const ob = newObj({ model, line: isEq ? inst.tags[0] : structureGroup(model, inst.tags).split(':').slice(1).join(':'), tag: inst.tags.join(','), kind: isEq ? `equipment:${kind}` : `${kind}:${inst.tags.slice(1).join(',') || inst.tags[0]}`, cat, group, lineKey: `${model}|cell`, unit: plot.unit, equipTag: isEq ? inst.tags[0] : undefined });
    addShapes(ob, partShapes(inst.part), multiply(F, inst.transform));
    if (isEq) { const k = `${plot.unit}|${inst.tags[0]}`; const l = equipByUnitTag.get(k) ?? []; l.push(ob); equipByUnitTag.set(k, l); }
  }
}
tick(`cells: objects ${objs.length}, prims ${prims.length}`);

// the pipeway's own steel, rebuilt as pipeway() builds it (SW-PWY-2, SW-PWY-9): the rack, the stringers under each tier, a junction frame at each unit's limit
const pwRep = load('pipeway.report.json'), cwRep = load('cooling-water.report.json');
const own: { part: PartSpec; transform: Mat4; tags: string[] }[] = [];
{
  const LENGTH = PWY.bays * PWY.bent, kit = interiorKit({ pedestal: PWY.PAD, padHeight: PWY.PAD }, own as never, {});
  kit.rack({ x0: 0, x1: LENGTH, bentSpacing: PWY.bent, halfWidth: PWY.half, tiers: PWY.tiers as unknown as number[], loadPsf: PWY.loadPsf });
  const st = makeWideFlange('W8x18', 8, 18, PWY.bent - 12);
  for (const [t, tier] of PWY.tiers.entries()) for (const z of stringersOf(t)) for (let x = 0; x < LENGTH - 1e-6; x += PWY.bent) own.push({ part: st, transform: frameFromAxes([x + 6, tier - 16, z], [0, 1, 0], [1, 0, 0]), tags: ['rack-stringer', 'beam'] });
  const up = (v: number, s = 6) => Math.ceil(v / s - 1e-9) * s;
  for (const J of pwRep.junctions as { unit: number; x: number; z: number; half: number; tiers: number[]; beam: string; post: string }[]) {
    const tiers = J.tiers, span = 2 * J.half, D = up(span / 20, 2), w = up(2.75 * D, 5), Dp = Math.max(10, D - 2), wp = up(2.75 * Dp, 5), z = J.z;
    if (`W${D}x${w}` !== J.beam || `W${Dp}x${wp}` !== J.post) throw new Error(`junction U${J.unit}: rebuilt sections W${D}x${w}/W${Dp}x${wp} are not the report's ${J.beam}/${J.post}`);
    const beam = makeWideFlange(`W${D}x${w}`, D, w, span - Dp), post = makeWideFlange(`W${Dp}x${wp}`, Dp, wp, PWY.tiers[tiers[tiers.length - 1]] - PWY.PAD), tag = `junction:U${J.unit}`;
    for (const sx of [-1, 1]) { const x = J.x + sx * J.half; own.push({ part: kit.concrete('pedestal', Dp + 12, PWY.PAD, Dp + 12), transform: frameFromAxes([x - (Dp + 12) / 2, PWY.PAD / 2, z], [0, 1, 0], [1, 0, 0]), tags: ['junction', tag, 'pad'] }); own.push({ part: post, transform: multiply(translate(x, PWY.PAD, z), standUp()), tags: ['junction', tag, 'post'] }); }
    for (const t of tiers) own.push({ part: beam, transform: frameFromAxes([J.x - J.half + Dp / 2, PWY.tiers[t] - D / 2, z], [0, 1, 0], [1, 0, 0]), tags: ['junction', tag, 'beam'] });
  }
}
// self-check against a dump of pipeway().own made once (explore/pwown.json), when present
{ const ref = `${HERE}/explore/pwown.json`; if (existsSync(ref)) { const R = JSON.parse(readFileSync(ref, 'utf8')).own as { id: string; T: number[] }[]; const key = (id: string, T: number[]) => `${id}|${T.slice(12, 15).map(v => Math.round(v * 100) / 100).join(',')}|${T.slice(0, 11).map(v => Math.round(v * 100) / 100).join(',')}`; const a = new Set(R.map(r => key(r.id, r.T))); const b = own.map(o => key(o.part.id, o.transform)); const miss = b.filter(k => !a.has(k)).length; console.error(`  pipeway own steel rebuilt: ${own.length} parts; reference pipeway(): ${R.length}; not in reference: ${miss}`); } }
for (const pl of own) {
  const jt = pl.tags.find(t => t.startsWith('junction:')), group = jt ? `pipeway:${jt}` : 'pipeway:rack', kind = pl.part.kind, hw = HARDWARE_KINDS.has(kind) || (kind === 'PL' && (pl.tags.includes('clip') || pl.tags.includes('end-plate')));
  const ob = newObj({ model: 'pipeway', line: group.slice(8), tag: pl.tags.join(','), kind: `${kind}:${pl.tags.filter(t => !t.startsWith('rack-bent') && !t.startsWith('rack-bay') && !t.startsWith('junction')).join(',') || pl.tags[0]}`, cat: jt ? 'junction' : hw ? 'hardware' : kind === 'CONCRETE' ? 'concrete' : 'pwsteel', group: gid(group), lineKey: 'pipeway|steel' });
  addShapes(ob, partShapes(pl.part), pl.transform);
}
// the cooling water mains' sleepers, rebuilt as coolingWater() builds them (SW-CWM-2): on the main rack's bent lines from the way's x0 to x1, under both mains, 3 in clear of a junction frame's or the rack's steel
{
  const md = models.get('cooling-water')!, mains = md.lines.filter(l => l.kind === 'routed' && /-27\d{3}$/.test(l.no) && Number(l.no.slice(-3)) < 100);
  const NPS = mains[0].NPS, cls = mains[0].cls, OD = pipeDims(NPS, cls).OD, fl = designFlange(NPS, cls).OD, up = (v: number, s = 6) => Math.ceil(v / s - 1e-9) * s;
  const pitch = up(Math.max(fl + 6, gateWidth(NPS, cls) + 3)), lanes = [0, -pitch], zs0 = Math.min(...lanes) - OD / 2 - CWM.sleeperOver, zs1 = Math.max(...lanes) + OD / 2 + CWM.sleeperOver;
  const kit = interiorKit({ pedestal: 6, padHeight: 6 }, [] as never, {});
  const steel = objs.filter(o => o.model === 'pipeway' && (o.cat === 'junction' || o.tag.split(',').some(t => t.startsWith('rack'))));
  let n = 0, left = 0;
  for (let x = cwRep.way.x0; x <= cwRep.way.x1 - CWM.sleeperW / 2 + 1e-6; x += PWY.bent) {
    const mn: V3 = [x - CWM.sleeperW / 2 - 3, 0, zs0 - 3 + CWM.way], mx: V3 = [x + CWM.sleeperW / 2 + 3, CWM.sleeperTop + 3, zs1 + 3 + CWM.way];
    if (steel.some(o => o.prims.some(pi => { const p = prims[pi]; return [0, 1, 2].every(k => p.mn[k] + H < mx[k] && p.mx[k] - H > mn[k]); }))) { left++; continue; }
    const ob = newObj({ model: 'cooling-water', line: `sleeper:${x}`, tag: `sleeper:${x}`, kind: 'CONCRETE:sleeper', cat: 'sleeper', group: gid(`cw:sleeper:${x}`), lineKey: 'cw|sleeper' });
    addShapes(ob, partShapes(kit.concrete('sleeper', CWM.sleeperW, CWM.sleeperTop, zs1 - zs0)), multiply(CW_T, frameFromAxes([x, CWM.sleeperTop / 2, zs0], [0, 1, 0], [0, 0, 1]))); n++;
  }
  console.error(`  sleepers rebuilt: ${n} (left out ${left}); the report says ${cwRep.sleepers}`);
}
// the pipe frames of plant 3's own (SW-RPI-17), from each report's FrameSpecs, in that model's frame
let nFrames = 0;
for (const m of MODEL_NAMES) {
  const rep = existsSync(`${MODELS}/${m}.report.json`) ? load(`${m}.report.json`) : null; if (!rep?.frames) continue;
  (rep.frames as FrameSpec[]).forEach((f, i) => {
    const g = gid(`${m}:frame#${i}`); nFrames++;
    for (const pl of framePlaced(f)) { const ob = newObj({ model: m, line: `pipe-frame:${f.line}#${i}`, tag: pl.tags.join(','), kind: `frame:${pl.tags[1] ?? pl.part.kind}`, cat: 'frame', group: g, lineKey: `${m}|frame#${i}`, extra: { frame: f } }); addShapes(ob, partShapes(pl.part), multiply(frameOf(m), pl.transform)); }
  });
}
tick(`all objects ${objs.length}, prims ${prims.length}, frames ${nFrames}; shapes ${JSON.stringify(STATS)}`);
{ const empty = new Map<string, number>(); for (const o of objs) if (!o.prims.length) { const k = `${o.cat} ${o.kind.split(':')[0]}`; empty.set(k, (empty.get(k) ?? 0) + 1); } console.error(`  objects with no solid held (never tested): ${[...empty.values()].reduce((a, b) => a + b, 0)}${empty.size ? ' ' + JSON.stringify(Object.fromEntries(empty)) : ''}`); }

// ------------------------------------------------------------------------------------------------------------------
// PLANTED clash (calibration): a copy of a pipeway pipe moved 2 in into a neighbouring pipe of another line, and/or a copy pushed 2 in into the beam under it
const planted: { obj: number; expect: string; depth: number }[] = [];
if (PLANT) {
  const pw = objs.filter(o => o.model === 'pipeway' && o.cat === 'pipe' && o.kind === 'pipe');
  const info = (o: Obj) => { const c = o.extra.comp as Comp, d = pipeDimsOf(c.key); return { c, r: d.OD / 2, a: c.a, b: c.b }; };
  const horizX = pw.filter(o => { const { a, b } = info(o); return Math.abs(a[1] - b[1]) < 1e-6 && Math.abs(a[2] - b[2]) < 1e-6 && Math.abs(b[0] - a[0]) > 200; });
  if (PLANT === 'pipe' || PLANT === 'both' || PLANT === 'all') {
    let best: { o: Obj; nb: Obj; dz: number; gap: number } | undefined;
    for (const o of horizX) { const A = info(o); for (const q of horizX) { if (q.line === o.line) continue; const B = info(q); if (Math.abs(A.a[1] - B.a[1]) > 1e-6) continue; const lo = Math.max(Math.min(A.a[0], A.b[0]), Math.min(B.a[0], B.b[0])), hi = Math.min(Math.max(A.a[0], A.b[0]), Math.max(B.a[0], B.b[0])); if (hi - lo < 100) continue; const dz = B.a[2] - A.a[2], gap = Math.abs(dz) - A.r - B.r; if (gap > 0 && (!best || gap < best.gap)) best = { o, nb: q, dz, gap }; } if (best && best.gap < 6) break; }
    if (best) {
      const c = best.o.extra.comp as Comp, sh = Math.sign(best.dz) * (best.gap + 2), T = [...c.T]; T[14] += sh;
      const ob = newObj({ model: 'PLANTED', line: `PLANTED-pipe`, tag: `copy of ${c.tag} moved ${round(sh)} in in z`, kind: 'pipe', cat: 'planted', group: -1, lineKey: 'PLANTED|pipe', ports: [] });
      compShapesPlaced(ob, { ...c, T, a: [c.a[0], c.a[1], c.a[2] + sh], b: [c.b[0], c.b[1], c.b[2] + sh] }, I4);
      planted.push({ obj: ob.id, expect: `pipeway ${best.nb.line} ${best.nb.tag}`, depth: 2 });
      console.error(`  PLANTED: ${ob.tag}, 2 in into ${best.nb.line} ${best.nb.tag}`);
    }
  }
  if (PLANT === 'beam' || PLANT === 'both' || PLANT === 'all') {
    // a pipe resting on shoes on a tier: the beam top is under its shoes; push a copy down so its bottom is 2 in below the beam top
    const sup = objs.filter(o => o.model === 'pipeway' && o.kind === 'support:shoe');
    for (const o of horizX) {
      const A = info(o), s = sup.find(q => q.line === o.line && (q.extra.sup.at[0] - Math.min(A.a[0], A.b[0])) > 20 && (Math.max(A.a[0], A.b[0]) - q.extra.sup.at[0]) > 20); if (!s) continue;
      const beamTop = (s.extra.sup.T[13] as number) - Number(s.extra.sup.key.split('|')[4] ?? 4), bottom = A.a[1] - A.r, sh = -(bottom - beamTop + 2), c = A.c, T = [...c.T]; T[13] += sh;
      const ob = newObj({ model: 'PLANTED', line: `PLANTED-beam`, tag: `copy of ${c.tag} moved ${round(sh)} in in y`, kind: 'pipe', cat: 'planted', group: -1, lineKey: 'PLANTED|beam', ports: [] });
      compShapesPlaced(ob, { ...c, T, a: [c.a[0], c.a[1] + sh, c.a[2]], b: [c.b[0], c.b[1] + sh, c.b[2]] }, I4);
      planted.push({ obj: ob.id, expect: 'a pipeway tier beam', depth: 2 }); console.error(`  PLANTED: ${ob.tag}, 2 in into the beam under ${s.tag}`); break;
    }
  }
}

// ------------------------------------------------------------------------------------------------------------------
// SIGNED DISTANCE of an object at a world point (min over its primitives; mesh surfaces by nearest triangle)
const triScratch = { d: 0, sgn: 0 };
function closestTri(px: number, py: number, pz: number, P: ArrayLike<number>, i0: number, i1: number, i2: number, out: Float64Array): number {
  // Ericson, closest point on triangle; returns squared distance, out = closest point + region flag (1 interior)
  const ax = P[3 * i0], ay = P[3 * i0 + 1], az = P[3 * i0 + 2], bx = P[3 * i1], by = P[3 * i1 + 1], bz = P[3 * i1 + 2], cx = P[3 * i2], cy = P[3 * i2 + 1], cz = P[3 * i2 + 2];
  const abx = bx - ax, aby = by - ay, abz = bz - az, acx = cx - ax, acy = cy - ay, acz = cz - az, apx = px - ax, apy = py - ay, apz = pz - az;
  const d1 = abx * apx + aby * apy + abz * apz, d2 = acx * apx + acy * apy + acz * apz;
  let qx: number, qy: number, qz: number, inter = 0;
  if (d1 <= 0 && d2 <= 0) { qx = ax; qy = ay; qz = az; }
  else {
    const bpx = px - bx, bpy = py - by, bpz = pz - bz, d3 = abx * bpx + aby * bpy + abz * bpz, d4 = acx * bpx + acy * bpy + acz * bpz;
    if (d3 >= 0 && d4 <= d3) { qx = bx; qy = by; qz = bz; }
    else {
      const vc = d1 * d4 - d3 * d2;
      if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); qx = ax + abx * v; qy = ay + aby * v; qz = az + abz * v; }
      else {
        const cpx = px - cx, cpy = py - cy, cpz = pz - cz, d5 = abx * cpx + aby * cpy + abz * cpz, d6 = acx * cpx + acy * cpy + acz * cpz;
        if (d6 >= 0 && d5 <= d6) { qx = cx; qy = cy; qz = cz; }
        else {
          const vb = d5 * d2 - d1 * d6;
          if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); qx = ax + acx * w; qy = ay + acy * w; qz = az + acz * w; }
          else {
            const va = d3 * d6 - d5 * d4;
            if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const w = (d4 - d3) / ((d4 - d3) + (d5 - d6)); qx = bx + (cx - bx) * w; qy = by + (cy - by) * w; qz = bz + (cz - bz) * w; }
            else { const den = 1 / (va + vb + vc), v = vb * den, w = vc * den; qx = ax + abx * v + acx * w; qy = ay + aby * v + acy * w; qz = az + abz * v + acz * w; inter = 1; }
          }
        }
      }
    }
  }
  out[0] = qx; out[1] = qy; out[2] = qz; out[3] = inter;
  // face normal (unnormalised): ab x ac
  out[4] = aby * acz - abz * acy; out[5] = abz * acx - abx * acz; out[6] = abx * acy - aby * acx;
  const dx = px - qx, dy = py - qy, dz = pz - qz; return dx * dx + dy * dy + dz * dz;
}
function buildGrid(s: Extract<Shape, { t: 5 }>): TriGrid {
  const c = Math.max(2, Math.cbrt(((s.mx[0] - s.mn[0] + 1) * (s.mx[1] - s.mn[1] + 1) * (s.mx[2] - s.mn[2] + 1)) / Math.max(1, s.tri.length / 3) * 4));
  const nx = Math.min(64, Math.ceil((s.mx[0] - s.mn[0]) / c) + 1), ny = Math.min(64, Math.ceil((s.mx[1] - s.mn[1]) / c) + 1), nz = Math.min(64, Math.ceil((s.mx[2] - s.mn[2]) / c) + 1);
  const cx = (s.mx[0] - s.mn[0]) / nx + 1e-9, cy = (s.mx[1] - s.mn[1]) / ny + 1e-9, cz = (s.mx[2] - s.mn[2]) / nz + 1e-9, cc = Math.max(cx, cy, cz);
  const NX = Math.ceil((s.mx[0] - s.mn[0]) / cc) + 1, NY = Math.ceil((s.mx[1] - s.mn[1]) / cc) + 1, NZ = Math.ceil((s.mx[2] - s.mn[2]) / cc) + 1, N = NX * NY * NZ;
  const count = new Int32Array(N + 1), P = s.pos, nt = s.tri.length / 3;
  const rng = (t: number, f: (cell: number) => void) => { let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity; for (let k = 0; k < 3; k++) { const v = 3 * s.tri[3 * t + k]; x0 = Math.min(x0, P[v]); x1 = Math.max(x1, P[v]); y0 = Math.min(y0, P[v + 1]); y1 = Math.max(y1, P[v + 1]); z0 = Math.min(z0, P[v + 2]); z1 = Math.max(z1, P[v + 2]); }
    const i0 = Math.max(0, Math.floor((x0 - s.mn[0]) / cc)), i1 = Math.min(NX - 1, Math.floor((x1 - s.mn[0]) / cc)), j0 = Math.max(0, Math.floor((y0 - s.mn[1]) / cc)), j1 = Math.min(NY - 1, Math.floor((y1 - s.mn[1]) / cc)), k0 = Math.max(0, Math.floor((z0 - s.mn[2]) / cc)), k1 = Math.min(NZ - 1, Math.floor((z1 - s.mn[2]) / cc));
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (let k = k0; k <= k1; k++) f(i + NX * (j + NY * k)); };
  for (let t = 0; t < nt; t++) rng(t, c2 => count[c2 + 1]++);
  for (let i = 0; i < N; i++) count[i + 1] += count[i];
  const fill = count.slice(), items = new Int32Array(count[N]);
  for (let t = 0; t < nt; t++) rng(t, c2 => { items[fill[c2]++] = t; });
  return { o: [...s.mn] as V3, c: cc, nx: NX, ny: NY, nz: NZ, start: count, items };
}
/** the triangles of a mesh shape that may lie within the local box (lo, hi) */
function trisNear(s: Extract<Shape, { t: 5 }>, lo: V3, hi: V3, visit: (t: number) => void) {
  const nt = s.tri.length / 3;
  if (nt <= 48) { for (let t = 0; t < nt; t++) visit(t); return; }
  const g = s.grid ?? (s.grid = buildGrid(s)), seen = new Set<number>();
  const i0 = Math.max(0, Math.floor((lo[0] - g.o[0]) / g.c)), i1 = Math.min(g.nx - 1, Math.floor((hi[0] - g.o[0]) / g.c)), j0 = Math.max(0, Math.floor((lo[1] - g.o[1]) / g.c)), j1 = Math.min(g.ny - 1, Math.floor((hi[1] - g.o[1]) / g.c)), k0 = Math.max(0, Math.floor((lo[2] - g.o[2]) / g.c)), k1 = Math.min(g.nz - 1, Math.floor((hi[2] - g.o[2]) / g.c));
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (let k = k0; k <= k1; k++) { const c = i + g.nx * (j + g.ny * k); for (let q = g.start[c]; q < g.start[c + 1]; q++) { const t = g.items[q]; if (!seen.has(t)) { seen.add(t); visit(t); } } }
}
const tmp8 = new Float64Array(8);
/** signed distance of a primitive at a world point; for a mesh surface, searched within `reach` (Infinity beyond) */
function primSd(p: Prim, x: number, y: number, z: number, reach = 2): number {
  const q = toLocal(p.M, x, y, z), s = p.s;
  if (s.t !== 5) return shapeSd(s, q[0], q[1], q[2]);
  let best = Infinity, acc = 0;
  trisNear(s, [q[0] - reach, q[1] - reach, q[2] - reach], [q[0] + reach, q[1] + reach, q[2] + reach], t => {
    const d2 = closestTri(q[0], q[1], q[2], s.pos, s.tri[3 * t], s.tri[3 * t + 1], s.tri[3 * t + 2], tmp8);
    const nl = Math.hypot(tmp8[4], tmp8[5], tmp8[6]) || 1, sd = ((q[0] - tmp8[0]) * tmp8[4] + (q[1] - tmp8[1]) * tmp8[5] + (q[2] - tmp8[2]) * tmp8[6]) / nl;
    if (d2 < best - 1e-9) { best = d2; acc = sd; } else if (d2 <= best + 1e-9) acc += sd;
  });
  if (!Number.isFinite(best)) return Infinity;
  const d = Math.sqrt(best); return s.sgn === 0 ? d : (acc * s.sgn >= 0 ? d : -d);
}
function objSd(o: Obj, x: number, y: number, z: number): number { let d = Infinity; for (const pi of o.prims) { const p = prims[pi]; if (x < p.mn[0] - 2 || x > p.mx[0] + 2 || y < p.mn[1] - 2 || y > p.mx[1] + 2 || z < p.mn[2] - 2 || z > p.mx[2] + 2) continue; d = Math.min(d, primSd(p, x, y, z)); } return d; }
// REVIEW: inside tests for closed mesh solids (used by the containment check and the planted 'inside' clash)
const rayHits = (s: Extract<Shape, { t: 5 }>, o: V3, ax: number): number => {
  const P = s.pos, T = s.tri, nt = T.length / 3, d: V3 = [0, 0, 0]; d[ax] = 1; let n = 0;
  const test = (t: number) => { const a = 3 * T[3 * t], b = 3 * T[3 * t + 1], c = 3 * T[3 * t + 2];
    const e1x = P[b] - P[a], e1y = P[b + 1] - P[a + 1], e1z = P[b + 2] - P[a + 2], e2x = P[c] - P[a], e2y = P[c + 1] - P[a + 1], e2z = P[c + 2] - P[a + 2];
    const px = d[1] * e2z - d[2] * e2y, py = d[2] * e2x - d[0] * e2z, pz = d[0] * e2y - d[1] * e2x, det = e1x * px + e1y * py + e1z * pz; if (Math.abs(det) < 1e-12) return;
    const inv = 1 / det, tx = o[0] - P[a], ty = o[1] - P[a + 1], tz = o[2] - P[a + 2], u = (tx * px + ty * py + tz * pz) * inv; if (u < 0 || u > 1) return;
    const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x, v = (d[0] * qx + d[1] * qy + d[2] * qz) * inv; if (v < 0 || u + v > 1) return;
    if ((e2x * qx + e2y * qy + e2z * qz) * inv > 0) n++; };
  if (nt <= 48) { for (let t = 0; t < nt; t++) test(t); return n; }
  const lo: V3 = [o[0], o[1], o[2]], hi: V3 = [o[0], o[1], o[2]]; hi[ax] = s.mx[ax] + 1; trisNear(s, lo, hi, test); return n;
};
function insideMesh(p: Prim, w: V3): boolean {
  const s = p.s; if (s.t !== 5 || s.sgn === 0) return false; const q = toLocal(p.M, w[0], w[1], w[2]);
  if (q[0] < s.mn[0] || q[0] > s.mx[0] || q[1] < s.mn[1] || q[1] > s.mx[1] || q[2] < s.mn[2] || q[2] > s.mx[2]) return false;
  const j: V3 = [q[0] + 1.3e-5, q[1] + 0.7e-5, q[2] + 1.1e-5]; let odd = 0; for (const ax of [0, 1, 2]) if (rayHits(s, j, ax) % 2 === 1) odd++; return odd >= 2;
}
function samplePts(o: Obj): V3[] {
  const out: V3[] = [];
  for (const pi of o.prims) { const p = prims[pi], s = p.s;
    if (s.t === 5) { const P = s.pos, T = s.tri, step = Math.max(1, Math.floor(T.length / 3 / 24)); for (let t = 0; t < T.length / 3; t += step) { const a = 3 * T[3 * t], b = 3 * T[3 * t + 1], c = 3 * T[3 * t + 2];
        // a point just inside the face (against its outward normal)
        const cx = (P[a] + P[b] + P[c]) / 3, cy = (P[a + 1] + P[b + 1] + P[c + 1]) / 3, cz = (P[a + 2] + P[b + 2] + P[c + 2]) / 3, e1 = [P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]], e2 = [P[c] - P[a], P[c + 1] - P[a + 1], P[c + 2] - P[a + 2]];
        const nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0], nl = Math.hypot(nx, ny, nz) || 1, k = -0.05 * (s.sgn || 1) / nl;
        out.push(xfP(p.M, cx + nx * k, cy + ny * k, cz + nz * k)); } }
    else { const c = [(s.mn[0] + s.mx[0]) / 2, (s.mn[1] + s.mx[1]) / 2, (s.mn[2] + s.mx[2]) / 2];
      for (const f of [[0, 0, 0], [0.4, 0, 0], [-0.4, 0, 0], [0, 0.4, 0], [0, -0.4, 0], [0, 0, 0.4], [0, 0, -0.4]]) { const q = [0, 1, 2].map(a => c[a] + f[a] * (s.mx[a] - s.mn[a])); if (shapeSd(s, q[0], q[1], q[2]) < 0) out.push(xfP(p.M, q[0], q[1], q[2])); } } }
  return out;
}

// SHAPECHECK: the reference surface of each distinct part (its catalogue mesh at the default 110-cell polygonisation) against the shapes this
// detector holds it by: the largest signed distance of a reference vertex from the shapes (> 0: the real part reaches beyond the shape held)
if (process.env.SHAPECHECK) {
  const seen = new Map<string, Obj>();
  for (const o of objs) { const k = o.extra?.comp?.key ?? o.extra?.sup?.key ?? o.extra?.weld?.key ?? (o.cat === 'pipe' || o.cat === 'nozzle' ? undefined : `cell:${o.kind}:${o.prims.length}`); if (k && !seen.has(k) && o.prims.length) seen.set(k, o); }
  const rows: { key: string; tag: string; max: number; n: number }[] = [];
  let nk = 0; for (const [k, o] of seen) {
    if (k.startsWith('cell:')) continue; if (++nk % 500 === 0) tick(`shapecheck ${nk}`);
    let part: PartSpec; const c = o.extra?.comp as Comp | undefined;
    try { const a = k.split('|'); setMaxCells(110); part = a[0] === 'VLV' ? makeValve(`${k}@110`, a[1] as never, Number(a[2]), a[3] as PipeClass, (a[4] ?? 'RF') as never) : a[0] === 'OLET' ? makeOlet(`${k}@110`, Number(a[1]), Number(a[2]), a[3] as PipeClass, a[4] as never) : partFromKey(k); } catch (e) { console.error('  SHAPECHECK skip', k, String(e).slice(0, 80)); continue; }
    if (c && c.kind === 'pipe') continue;   // pipes: a cylinder by definition (scene scales PIPE|..|1.000)
    setMaxCells(110); const g = buildGeometry(part);
    const M = c ? (() => { const R = rigid(multiply(o.extra.F, c.T)); return R; })() : o.extra?.sup ? rigid(multiply(o.extra.F, o.extra.sup.T)) : prims[o.prims[0]].M;
    let mx = -Infinity, n = 0;
    const nv = g.solids.reduce((a, so) => a + so.mesh.positions.length / 3, 0), stride = 3 * Math.max(1, Math.floor(nv / 1500));
    for (const so of g.solids) { const P = so.mesh.positions; for (let i = 0; i < P.length; i += stride) { const w = xfP(M, P[i], P[i + 1], P[i + 2]); let d = objSd(o, w[0], w[1], w[2]); if (!Number.isFinite(d)) d = 99; if (d > mx) mx = d; n++; } }
    rows.push({ key: k, tag: o.tag, max: round(mx, 1000), n });
  }
  rows.sort((a, b) => b.max - a.max);
  const tt = new Map<string, number[]>(); for (const o of objs) { const k = `${o.cat} ${o.kind.split(':')[0]}`; const e = tt.get(k) ?? [0, 0, 0, 0, 0, 0, 0]; e[6]++; for (const pi of o.prims) e[prims[pi].s.t]++; tt.set(k, e); }
  for (const [k, e] of [...tt.entries()].sort((a, b) => b[1][5] - a[1][5])) if (e[5]) console.error(`  SHAPETYPES ${k}: objects ${e[6]}; prims box ${e[0]} cyl ${e[1]} rev ${e[2]} torus ${e[3]} prism ${e[4]} MESH ${e[5]}`);
  const fam = new Map<string, { n: number; worst: number; key: string }>(); for (const r of rows) { const f = r.key.split('|')[0] + (r.key.startsWith('VLV') ? '|' + r.key.split('|')[1] : ''); const e = fam.get(f) ?? { n: 0, worst: -Infinity, key: '' }; e.n++; if (r.max > e.worst) { e.worst = r.max; e.key = r.key; } fam.set(f, e); }
  for (const [f, e] of [...fam.entries()].sort((a, b) => b[1].worst - a[1].worst)) console.error(`  SHAPECHECK ${f}: ${e.n} keys, worst reference vertex ${e.worst} in outside the shapes held (${e.key})`);
  writeFileSync(`${process.env.OUT ?? HERE}/shapecheck-${LABEL}.json`, JSON.stringify(rows, null, 1));
  if (process.env.SHAPECHECK === 'exit') process.exit(0);
}
// REVIEW: two more planted clashes, of the classes the review found excused or unseen: PLANT=sunk sinks a pipeway shoe 1 in into the tier
// beam it bears on (in memory: its placement moved down); PLANT=inside puts a 2 in long piece of 1 in pipe wholly inside a closed mesh
// equipment body, 3 in clear of its surface. PLANT=all plants all four.
if (PLANT === 'sunk' || PLANT === 'all') {
  const o = objs.find(q => q.model === 'pipeway' && q.kind === 'support:shoe' && q.extra.sup.at[1] > 200 && Math.abs(q.extra.sup.at[0] % 240 - 0) < 1e-6);
  if (o) { for (const pi of o.prims) { const p = prims[pi]; p.M = Float64Array.from(p.M); p.M[13] -= 1; p.mn[1] -= 1; p.mx[1] -= 1; } o.mn[1] -= 1; o.mx[1] -= 1; o.extra.sup = { ...o.extra.sup, at: [o.extra.sup.at[0], o.extra.sup.at[1] - 1, o.extra.sup.at[2]] };
    planted.push({ obj: o.id, expect: 'the tier beam it bears on', depth: 1 }); console.error(`  PLANTED: ${o.tag} (shoe at a bent) sunk 1 in into the tier beam under it`); }
}
if (PLANT === 'inside' || PLANT === 'all') {
  let done = false;
  for (const o of objs) { if (done || o.cat !== 'equipment') continue;
    for (const pi of o.prims) { const p = prims[pi], s = p.s; if (s.t !== 5 || !s.sgn || Math.min(s.mx[0] - s.mn[0], s.mx[1] - s.mn[1], s.mx[2] - s.mn[2]) < 12) continue;
      const c: V3 = xfP(p.M, (s.mn[0] + s.mx[0]) / 2, (s.mn[1] + s.mx[1]) / 2, (s.mn[2] + s.mx[2]) / 2);
      if (!insideMesh(p, c) || Math.abs(primSd(p, c[0], c[1], c[2], 1e6)) < 3 + 1.5) continue;
      const ob = newObj({ model: 'PLANTED', line: 'PLANTED-inside', tag: `1 in pipe inside ${o.tag}`, kind: 'pipe', cat: 'planted', group: -1, lineKey: 'PLANTED|inside', ports: [] });
      const r = pipeDims(1, 'P150').OD / 2; addShapes(ob, [{ t: 1, L: 2, ro: r, ri: 0, mn: [-r, -r, 0], mx: [r, r, 2] }], translate(c[0], c[1], c[2] - 1));
      planted.push({ obj: ob.id, expect: `${o.model} ${o.tag}`, depth: r }); console.error(`  PLANTED: ${ob.tag} at ${c.map(v => round(v, 10))}`); done = true; break; } }
}
// ------------------------------------------------------------------------------------------------------------------
// BROADPHASE grid of objects (96 in cells)
const G = 96, gk = (i: number, j: number, k: number) => (i + 512) + 1024 * ((j + 64) + 128 * (k + 512));
const grid = new Map<number, number[]>();
for (const o of objs) {
  if (!o.prims.length) continue;
  const i0 = Math.floor(o.mn[0] / G), i1 = Math.floor(o.mx[0] / G), j0 = Math.floor(o.mn[1] / G), j1 = Math.floor(o.mx[1] / G), k0 = Math.floor(o.mn[2] / G), k1 = Math.floor(o.mx[2] / G);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (let k = k0; k <= k1; k++) { const key = gk(i, j, k); let l = grid.get(key); if (!l) grid.set(key, l = []); l.push(o.id); }
}
/** objects whose solid lies within `tol` of a world point */
function objectsAt(p: V3, tol: number, filter: (o: Obj) => boolean): Obj[] {
  const out: Obj[] = [], l = grid.get(gk(Math.floor(p[0] / G), Math.floor(p[1] / G), Math.floor(p[2] / G))) ?? [];
  for (const id of l) { const o = objs[id]; if (!filter(o)) continue; if (p[0] < o.mn[0] - tol || p[0] > o.mx[0] + tol || p[1] < o.mn[1] - tol || p[1] > o.mx[1] + tol || p[2] < o.mn[2] - tol || p[2] > o.mx[2] + tol) continue; if (objSd(o, p[0], p[1], p[2]) <= tol) out.push(o); }
  return out;
}
tick(`broadphase grid: ${grid.size} cells`);

// ------------------------------------------------------------------------------------------------------------------
// RELATIONS (the contact policy): explicit pairs, each with its name
const rel = new Map<number, string>();
const N_OBJ = objs.length + 1;
const pk = (a: number, b: number) => (a < b ? a * N_OBJ + b : b * N_OBJ + a);
const relate = (a: Obj, b: Obj, why: string) => { if (a.id !== b.id && !rel.has(pk(a.id, b.id))) rel.set(pk(a.id, b.id), why); };
// a hash of the piping pieces' ports (ends), 0.1 in bins
const portBins = new Map<number, { o: Obj; p: V3 }[]>(), PB = 0.5;
const pbk = (i: number, j: number, k: number) => (i + 65536) + 131072 * ((j + 8192) + 16384 * (k + 65536));
for (const o of objs) if (o.ports) for (let i = 0; i < o.ports.length; i += 3) { const p: V3 = [o.ports[i], o.ports[i + 1], o.ports[i + 2]], k = pbk(Math.floor(p[0] / PB), Math.floor(p[1] / PB), Math.floor(p[2] / PB)); const l = portBins.get(k) ?? []; l.push({ o, p }); portBins.set(k, l); }
function portsNear(p: V3, r: number): { o: Obj; p: V3 }[] {
  const out: { o: Obj; p: V3 }[] = [];
  for (let i = Math.floor((p[0] - r) / PB); i <= Math.floor((p[0] + r) / PB); i++) for (let j = Math.floor((p[1] - r) / PB); j <= Math.floor((p[1] + r) / PB); j++) for (let k = Math.floor((p[2] - r) / PB); k <= Math.floor((p[2] + r) / PB); k++) for (const e of portBins.get(pbk(i, j, k)) ?? []) if (dist3(e.p, p) <= r) out.push(e);
  return out;
}
const lineEnds = (m: string, l: Line) => [l.from, l.to];
// REVIEW: (chain) is a joint end to end: two pieces are joined only where the route goes ON through their shared end. A piece whose direction at
// the shared end is reversed from its neighbour's (the route folds back, so the two pieces lie over each other) is not excused.
const tangentAt = (c: Comp, end: 'a' | 'b'): V3 | undefined => {
  if (c.kind === 'elbow' && c.key.startsWith('EL|')) { const ang = (Number(c.key.split('|')[3]) * Math.PI) / 180, T = c.T; return end === 'a' ? [T[8], T[9], T[10]] : [T[0] * Math.sin(ang) + T[8] * Math.cos(ang), T[1] * Math.sin(ang) + T[9] * Math.cos(ang), T[2] * Math.sin(ang) + T[10] * Math.cos(ang)]; }
  if (c.kind === 'elbow') return undefined;
  if (c.kind === 'tee') return [c.T[8], c.T[9], c.T[10]];
  if (c.kind !== 'pipe' && c.kind !== 'reducer') return undefined;   // flanges, gaskets, spades, valves: their a/b need not follow the route
  const L = dist3(c.a, c.b); return L > 1e-6 ? [(c.b[0] - c.a[0]) / L, (c.b[1] - c.a[1]) / L, (c.b[2] - c.a[2]) / L] : undefined;
};
let foldBacks = 0; const foldList: string[] = [], foldPairs = new Set<number>(), sunkPairs = new Map<number, string>();
function foldsBack(x: Obj, y: Obj): boolean {
  const cx = x.extra?.comp as Comp | undefined, cy = y.extra?.comp as Comp | undefined; if (!cx || !cy || OLD.has('chain')) return false;
  let best: [number, 'a' | 'b', 'a' | 'b'] | undefined;
  for (const ex of ['a', 'b'] as const) for (const ey of ['a', 'b'] as const) { const d = dist3(cx[ex], cy[ey]); if (!best || d < best[0]) best = [d, ex, ey]; }
  if (!best || best[0] > JOIN) return false;
  const tx = tangentAt(cx, best[1]), ty = tangentAt(cy, best[2]); if (!tx || !ty) return false;
  const sx = best[1] === 'b' ? 1 : -1, sy = best[2] === 'a' ? 1 : -1, cos = sx * sy * (tx[0] * ty[0] + tx[1] * ty[1] + tx[2] * ty[2]);
  if (cos >= 0) return false;
  foldBacks++; foldPairs.add(pk(x.id, y.id)); if (foldList.length < 20) foldList.push(`${x.model} ${x.tag} / ${y.tag} (cos ${round(cos, 100)})`); return true;
}
// (chain) neighbours in the component list, stud sets skipped; (chain/line-to-nozzle/spool-body/branch) shared ports
for (const [key, list] of lineObjs) {
  const seq = list.filter(o => o.kind !== 'studs'), thin = (o: Obj) => o.kind === 'gasket' || o.kind === 'spade' || o.kind === 'spectacle';
  for (let i = 1; i < seq.length; i++) if (!foldsBack(seq[i - 1], seq[i])) relate(seq[i - 1], seq[i], 'chain: neighbours in the line\'s component list');
  for (let i = 0; i < seq.length; i++) { if (thin(seq[i])) continue; for (let j = i + 1; j < seq.length && thin(seq[j]); j++) { for (let k = i + 1; k < j; k++) relate(seq[i], seq[k], 'flanged joint: pieces of one joint stack'); if (j + 1 < seq.length && !thin(seq[j + 1])) relate(seq[i], seq[j + 1], 'flanged joint: the two faces either side of its gasket stack'); } }
  void key;
}
for (const o of objs) if (o.ports && o.cat === 'pipe') { const lo = lineIndex.get(`${o.model}|${o.line}`); if (!lo) continue; const ends = lineEnds(o.model, lo.line);
  for (let i = 0; i < o.ports.length; i += 3) for (const e of portsNear([o.ports[i], o.ports[i + 1], o.ports[i + 2]], 1.0)) if (e.o.cat === 'nozzle' && ends.includes(e.o.line)) relate(o, e.o, `line-to-nozzle: ${o.line} bolts to ${e.o.line} (within its joint stack)`); }
for (const o of objs) if (o.ports && o.cat !== 'planted') for (let i = 0; i < o.ports.length; i += 3) {
  const p: V3 = [o.ports[i], o.ports[i + 1], o.ports[i + 2]];
  for (const e of portsNear(p, JOIN)) {
    const q = e.o; if (q.id <= o.id || q.cat === 'planted') continue;
    if (q.lineKey === o.lineKey) { if (!foldsBack(o, q)) relate(o, q, 'chain: share an end within 0.05 in'); continue; }
    const li = (x: Obj) => (x.cat === 'pipe' ? lineIndex.get(`${x.model}|${x.line}`) : undefined);
    const lo = li(o), lq = li(q);
    // a line's piece and a piece of the nozzle (spool) named as the line's from/to
    if (lo && q.cat === 'nozzle' && lineEnds(o.model, lo.line).includes(q.line)) { relate(o, q, `line-to-nozzle: ${o.line} ends at ${q.line}`); continue; }
    if (lq && o.cat === 'nozzle' && lineEnds(q.model, lq.line).includes(o.line)) { relate(o, q, `line-to-nozzle: ${q.line} ends at ${o.line}`); continue; }
    // the two halves of one spool
    if (o.cat === 'nozzle' && q.cat === 'nozzle' && o.model === q.model && o.equipTag === q.equipTag) { relate(o, q, `spool-body: two halves of ${o.equipTag}`); continue; }
    // a branch's end at its parent line (a tee's outlet, or the run its piece starts on)
    if (lo && lq && o.model === q.model && (lineEnds(o.model, lo.line).includes(`tap ${q.line}`) || lineEnds(q.model, lq.line).includes(`tap ${o.line}`))) { relate(o, q, 'branch: the branch meets its parent line'); continue; }
  }
}
// (branch) an olet with the parent's run pieces under its base
for (const o of objs) {
  const c = o.extra?.comp as Comp | undefined; if (!c || c.kind !== 'olet' || !c.onRun) continue;
  const base = portXf(o.extra.F, c.e1 === 'X' ? c.a : c.b), par = lineObjs.get(`${o.model}|${c.onRun}`) ?? [];
  for (const q of par) { const qc = q.extra.comp as Comp, a = portXf(q.extra.F, qc.a), b = portXf(q.extra.F, qc.b), ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2, t = L2 > 0 ? Math.max(0, Math.min(1, ((base[0] - a[0]) * ab[0] + (base[1] - a[1]) * ab[1] + (base[2] - a[2]) * ab[2]) / L2)) : 0;
    if (Math.hypot(base[0] - a[0] - ab[0] * t, base[1] - a[1] - ab[1] * t, base[2] - a[2] - ab[2] * t) <= 0.1 || (q.kind === 'elbow' || q.kind === 'tee') && objSd(q, base[0], base[1], base[2]) <= pipeDims(qc.NPS, qc.cls).OD / 2 + 0.1) relate(o, q, `branch: olet on its parent ${c.onRun}`); }
}
// (bolting) a stud set with the coaxial pieces whose faces lie within its length
for (const o of objs) {
  if (o.kind !== 'studs' || !o.extra?.comp) continue;
  const c = o.extra.comp as Comp, a = portXf(o.extra.F, c.a), b = portXf(o.extra.F, c.b), L = dist3(a, b), u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L, (b[2] - a[2]) / L], mid: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  for (const e of portsNear(mid, L / 2 + 0.1)) {
    const q = e.o; if (q.id === o.id || q.kind === 'studs' || q.cat === 'planted') continue;
    const w = [e.p[0] - mid[0], e.p[1] - mid[1], e.p[2] - mid[2]], t = w[0] * u[0] + w[1] * u[1] + w[2] * u[2], off = Math.hypot(w[0] - u[0] * t, w[1] - u[1] * t, w[2] - u[2] * t);
    if (off <= 0.1 && Math.abs(t) <= L / 2 + 0.1) relate(o, q, 'bolting: a stud set through its joint');
  }
}
// (weld) a weld with the pieces it joins and its line's pieces ending at it
for (const o of objs) {
  if (o.cat !== 'weld') continue;
  const w = o.extra.weld, at = portXf(o.extra.F, w.at);
  for (const t of w.joins as string[]) { const q = tagIndex.get(`${o.model}|${t}`); if (q) relate(o, q, 'weld: joins it'); }
  for (const e of portsNear(at, 0.1)) if (e.o.cat !== 'planted') relate(o, e.o, 'weld: a piece ending at the weld');
  // a weld on a run (an olet's or a fitting's), the pieces it lies on
  for (const t of w.joins as string[]) { const q = tagIndex.get(`${o.model}|${t}`); if (q?.extra?.comp?.onRun) for (const r of lineObjs.get(`${o.model}|${q.extra.comp.onRun}`) ?? []) if (objSd(r, at[0], at[1], at[2]) <= 0.5) relate(o, r, 'weld: an olet\'s weld on its parent run'); }
}
// (support) its own line's pieces and welds; what it bears on
const isPipingCat = (o: Obj) => o.cat === 'pipe' || o.cat === 'nozzle' || o.cat === 'weld' || o.cat === 'support' || o.cat === 'planted';
const weldsByLine = new Map<string, Obj[]>(); for (const q of objs) if (q.cat === 'weld') { const k = `${q.model}|${q.line}`; const l = weldsByLine.get(k) ?? []; l.push(q); weldsByLine.set(k, l); }
let bearFound = 0, bearNone = 0, bearSunk = 0;
const bearSunkList: string[] = [];
const bearNoneList: string[] = [];
for (const o of objs) {
  if (o.cat !== 'support') continue;
  for (const q of lineObjs.get(`${o.model}|${o.line}`) ?? []) relate(o, q, 'support: carries its own line');
  for (const q of weldsByLine.get(`${o.model}|${o.line}`) ?? []) relate(o, q, 'support: on its own line\'s weld');
  // bearing face: the lowest face of a base-bearing support, the highest of a hanging one
  const s = o.extra.sup, hang = s.type === 'hanger' || s.type === 'trapeze', pts: V3[] = [];
  // REVIEW: the bearing face is that of the support's own solids, not of its anchor rods, which are set into what it stands on by design (a
  // stanchion's rods reach 0.5 in below its base plate); they are excused with it when the base plate bears as a contact
  const wb0 = o.prims.map(pi => prims[pi]), wbNoRod = wb0.filter(p => !(p.s as { anchor?: boolean }).anchor), wb = OLD.has('bearing') || !wbNoRod.length ? wb0 : wbNoRod;
  const yEdge = hang ? Math.max(...wb.map(p => p.mx[1] - H)) : Math.min(...wb.map(p => p.mn[1] + H));
  for (const p of wb) { const top = p.mx[1] - H, bot = p.mn[1] + H; if (hang ? Math.abs(top - yEdge) > 0.05 : Math.abs(bot - yEdge) > 0.05) continue;
    const x0 = p.mn[0] + H, x1 = p.mx[0] - H, z0 = p.mn[2] + H, z1 = p.mx[2] - H; for (const fx of [0.1, 0.5, 0.9]) for (const fz of [0.1, 0.5, 0.9]) pts.push([x0 + (x1 - x0) * fx, yEdge + (hang ? 0.05 : -0.05), z0 + (z1 - z0) * fz]); }
  const got = new Set<Obj>(), side = hang ? 0.5 : -0.5, sunk = new Set<Obj>();
  for (const p of pts) for (const q of objectsAt(p, 0.15, q => !isPipingCat(q))) { const d0 = objSd(q, p[0], p[1], p[2]), d1 = objSd(q, p[0], p[1] + side, p[2]); if (d0 < 0 || d1 < d0) { got.add(q);
    // REVIEW: a bearing is a contact: the support's bearing face may lie at most JOIN (0.05 in) into what it bears on; a point JOIN inside the support's face that is inside q means it is sunk deeper
    if (!OLD.has('bearing') && objSd(q, p[0], yEdge + (hang ? -JOIN : JOIN) * 1.001, p[2]) < 0) sunk.add(q); } }
  if (OLD.has('bearing') && hang) for (const p of wb) { if (Math.abs(p.mx[1] - H - yEdge) > 0.05) continue; const cx = (p.mn[0] + p.mx[0]) / 2, cz = (p.mn[2] + p.mx[2]) / 2; for (let y = yEdge - 8; y <= yEdge + 0.05; y += 0.25) for (const q of objectsAt([cx, y, cz], 0, q => !isPipingCat(q))) got.add(q); }
  for (const q of sunk) { got.delete(q); bearSunk++; sunkPairs.set(pk(o.id, q.id), `${s.type} bearing face more than ${JOIN} in inside ${q.kind}`); if (bearSunkList.length < 40) bearSunkList.push(`${o.model} ${o.tag} (${s.type}) into ${q.model} ${q.tag}`); }
  if (process.env.DBGSUP && o.tag.includes(process.env.DBGSUP)) { console.error(`DBGSUP ${o.tag} yEdge ${yEdge} probes ${pts.length}: ${pts.map(p => p.map(v => round(v, 100)).join(',')).join(' | ')} -> ${[...got].map(q => q.tag).join('; ')}`); for (const pi of o.prims) console.error(`   prim t=${prims[pi].s.t} mn ${prims[pi].mn.map(v => round(v, 100))} mx ${prims[pi].mx.map(v => round(v, 100))}`); const p0 = pts[4] ?? pts[0]; if (p0) { const l = grid.get(gk(Math.floor(p0[0] / G), Math.floor(p0[1] / G), Math.floor(p0[2] / G))) ?? []; for (const id of l) { const q = objs[id]; if (q.tag.includes('junction') || q.kind.startsWith('W')) { const d = objSd(q, p0[0], p0[1], p0[2]); if (d < 3) console.error(`   near ${q.tag} ${q.kind} sd ${round(d, 1000)} box ${q.mn.map(v => round(v, 10))} ${q.mx.map(v => round(v, 10))}`); } } } }
  for (const q of got) relate(o, q, `support: bears on ${q.model} ${q.line} ${q.kind}`);
  if (got.size) bearFound++; else { bearNone++; if (bearNoneList.length < 30) bearNoneList.push(`${o.model} ${o.tag} at y ${round(yEdge, 100)}`); }
}
// (sleeve) a floor sleeve with its line and the floor it is set in
for (const o of objs) if (o.extra?.pen) { for (const q of lineObjs.get(`${o.model}|${o.line}`) ?? []) relate(o, q, 'sleeve: its own line'); const c = o.extra.comp as Comp, at = portXf(o.extra.F, [(c.a[0] + c.b[0]) / 2, (c.a[1] + c.b[1]) / 2, (c.a[2] + c.b[2]) / 2]); for (const q of objectsAt(at, OLD.has('sleeve') ? 6 : 0.15, q => !isPipingCat(q))) relate(o, q, 'sleeve: set in its floor'); }
// (nozzle-on-equipment) a nozzle's pieces with its own equipment body
for (const o of objs) {
  if (o.cat !== 'nozzle' && !(o.cat === 'weld' && o.lineKey.includes('|N:'))) continue;
  const unit = /^unit-(\d+)/.exec(o.model)?.[1]; if (!unit) continue;
  if (o.cat === 'weld') { const nz = nozzleIndex.get(o.line); if (nz) o.equipTag = nz.nz.equip; }
  for (const q of equipByUnitTag.get(`${unit}|${o.equipTag}`) ?? []) relate(o, q, `nozzle-on-equipment: ${o.equipTag}`);
}
// (frame) what each post base and pedestal stands on
for (const o of objs) if (o.cat === 'frame' && /post|pad/.test(o.kind)) { const y = o.mn[1] + H, c: V3 = [(o.mn[0] + o.mx[0]) / 2, y - 0.05, (o.mn[2] + o.mx[2]) / 2]; for (const q of objectsAt(c, 0.15, q => !isPipingCat(q) && q.group !== o.group)) { const d0 = objSd(q, c[0], c[1], c[2]), d1 = objSd(q, c[0], c[1] - 0.5, c[2]); if (d0 < 0 || d1 < d0) { if (!OLD.has('bearing') && objSd(q, c[0], y + JOIN * 1.001, c[2]) < 0) { bearSunk++; sunkPairs.set(pk(o.id, q.id), `frame post base more than ${JOIN} in inside ${q.kind}`); if (bearSunkList.length < 40) bearSunkList.push(`${o.model} ${o.tag} (frame base) into ${q.model} ${q.tag}`); continue; } relate(o, q, `frame: founded on ${q.model} ${q.line} ${q.kind}`); } } }
let eqBear = 0;
for (const o of objs) {
  if (o.cat !== 'equipment') continue;
  const got = new Set<Obj>(), eqSunk = new Set<Obj>();
  // REVIEW: every solid of the item is probed under its bottom (none skipped once its foundation is found): a motor that reaches 7 in below the
  // baseplate into the pad is sunk even though the baseplate bears on it. An item's own anchor bolts are set in its foundation by design: they
  // neither bear nor sink.
  for (const pi of o.prims) { const p = prims[pi], c: V3 = [(p.mn[0] + p.mx[0]) / 2, p.mn[1] + H - 0.05, (p.mn[2] + p.mx[2]) / 2];
    if ((p.s as { anchor?: boolean }).anchor && !OLD.has('bearing')) continue;
    for (const q of objectsAt(c, 0.15, q => !isPipingCat(q) && q.cat !== 'equipment' && q.group !== o.group)) { if (OLD.has('bearing') ? got.has(q) : eqSunk.has(q)) continue; const d0 = objSd(q, c[0], c[1], c[2]), d1 = objSd(q, c[0], c[1] - 0.5, c[2]); if (d0 < 0 || d1 < d0) { if (!OLD.has('bearing') && objSd(q, c[0], p.mn[1] + H + JOIN * 1.001, c[2]) < 0) { eqSunk.add(q); continue; } got.add(q); } } }
  for (const q of eqSunk) { got.delete(q); bearSunk++; sunkPairs.set(pk(o.id, q.id), `equipment bottom more than ${JOIN} in inside ${q.kind}${q.line.endsWith(':' + o.equipTag) ? ' (its own foundation)' : ''}`); if (bearSunkList.length < 40) bearSunkList.push(`${o.model} ${o.tag} (equipment) into ${q.model} ${q.tag}`); }
  for (const q of got) { relate(o, q, `equipment: bears on ${q.model} ${q.line} ${q.kind}`); eqBear++; }
}
tick(`chain pairs folding back (not excused): ${foldBacks}${foldList.length ? ': ' + foldList.join('; ') : ''}`);
tick(`relations: ${rel.size}; supports bearing on something ${bearFound}, on nothing found (grade or none) ${bearNone}; equipment bearing relations ${eqBear}; bearings sunk deeper than ${JOIN} in (not excused) ${bearSunk}`);
for (const l of bearSunkList.slice(0, 12)) console.error(`  sunk: ${l}`);

const related = (a: Obj, b: Obj): boolean => {
  if (a.id === b.id) return true;
  if (a.group >= 0 && a.group === b.group) return true;
  // connection hardware with the steel and concrete of its own cell
  if (OLD.has('hardware') && a.model === b.model && ((a.cat === 'hardware' && (b.cat === 'steel' || b.cat === 'concrete' || b.cat === 'hardware' || b.cat === 'pwsteel' || b.cat === 'junction')) || (b.cat === 'hardware' && (a.cat === 'steel' || a.cat === 'concrete' || a.cat === 'pwsteel' || a.cat === 'junction')))) return true;
  return rel.has(pk(a.id, b.id));
};
const relWhy = (a: Obj, b: Obj) => (a.group >= 0 && a.group === b.group ? 'same structure' : rel.get(pk(a.id, b.id)) ?? (a.cat === 'hardware' || b.cat === 'hardware' ? 'connection hardware' : ''));

// DEBUG: DBG="patA~patB[;patC~patD]" prints, for objects whose line or tag contains the patterns, the relation and a fine (0.1 in) sampling of -(sdA+sdB)
if (process.env.DBG) for (const spec of process.env.DBG.split(';')) {
  const [pa, pb] = spec.split('~'), match = (o: Obj, q: string) => o.line.includes(q) || o.tag.includes(q);
  const As = objs.filter(o => match(o, pa)), Bs = objs.filter(o => match(o, pb));
  console.error(`DBG ${spec}: ${As.length} x ${Bs.length} objects`);
  for (const A of As) for (const B of Bs) {
    if (A.id === B.id || A.mn[0] > B.mx[0] || B.mn[0] > A.mx[0] || A.mn[1] > B.mx[1] || B.mn[1] > A.mx[1] || A.mn[2] > B.mx[2] || B.mn[2] > A.mx[2]) continue;
    const lo = [0, 1, 2].map(k => Math.max(A.mn[k], B.mn[k])), hi = [0, 1, 2].map(k => Math.min(A.mx[k], B.mx[k])), st = Math.max(0.1, Math.cbrt((hi[0] - lo[0]) * (hi[1] - lo[1]) * (hi[2] - lo[2]) / 2e5));
    let best = -Infinity, at: number[] = [];
    for (let x = lo[0]; x <= hi[0]; x += st) for (let y = lo[1]; y <= hi[1]; y += st) for (let z = lo[2]; z <= hi[2]; z += st) { const a = objSd(A, x, y, z); if (a > 1) continue; const b = objSd(B, x, y, z); if (-(a + b) > best) { best = -(a + b); at = [x, y, z, a, b]; } }
    console.error(`  ${A.model} ${A.line} ${A.tag} [${A.kind}] x ${B.model} ${B.line} ${B.tag} [${B.kind}]: related=${related(A, B)} ${relWhy(A, B)}; sampled step ${round(st, 100)}: max -(sdA+sdB) ${round(best, 1000)} at ${at.map(v => round(v, 100)).join(',')}`);
    if (process.env.DBGV) for (const o of [A, B]) for (const pi of o.prims) { const pr = prims[pi]; console.error(`     ${o.tag} prim t=${pr.s.t} mn ${pr.mn.map(v => round(v, 100))} mx ${pr.mx.map(v => round(v, 100))}`); }
  }
}

// ------------------------------------------------------------------------------------------------------------------
// REGION: within 20 ft of any piping (96 in coarse cells touched by a piping object's box grown by 240 in)
const ROIC = 96, roi = new Set<number>();
for (let i = 0; i < objs.length; i++) { const o = objs[i]; if (!isPipingCat(o) || !o.prims.length) continue; const i0 = Math.floor((o.mn[0] - ROI_R) / ROIC), i1 = Math.floor((o.mx[0] + ROI_R) / ROIC), j0 = Math.floor((o.mn[1] - ROI_R) / ROIC), j1 = Math.floor((o.mx[1] + ROI_R) / ROIC), k0 = Math.floor((o.mn[2] - ROI_R) / ROIC), k1 = Math.floor((o.mx[2] + ROI_R) / ROIC); for (let a = i0; a <= i1; a++) for (let b = j0; b <= j1; b++) for (let c = k0; c <= k1; c++) roi.add(gk(a, b, c)); }
const boxInRoi = (mn: V3, mx: V3) => { for (let a = Math.floor(mn[0] / ROIC); a <= Math.floor(mx[0] / ROIC); a++) for (let b = Math.floor(mn[1] / ROIC); b <= Math.floor(mx[1] / ROIC); b++) for (let c = Math.floor(mn[2] / ROIC); c <= Math.floor(mx[2] / ROIC); c++) if (roi.has(gk(a, b, c))) return true; return false; };
tick(`region: ${roi.size} cells of 8 ft within 20 ft of piping`);

// ------------------------------------------------------------------------------------------------------------------
// THE PRESCRIBED BOX TIER (piping vs piping of ANOTHER model only: the class of defect at issue): pipes and fittings (pipe, nipple, elbow, tee, reducer, cap, olet, coupling, swage) by
// their round solids as above, every other piping part (flanges, gaskets, blinds, spades, valves, stud sets, supports, welds) by the
// boxes of its solids (solidBoxes, in its own frame). It reproduces what a box model of those parts sees; a pair it finds that the
// exact tier does not is reported as box-only, with the exact clearance between the true solids.
const ROUND = new Set(['pipe', 'nipple', 'elbow', 'tee', 'reducer', 'cap', 'olet', 'coupling', 'swage']);
const bprimsOf = new Map<number, number[]>();
for (const o of objs) {
  if (!isPipingCat(o) || !o.prims.length) continue;
  const key = o.extra?.comp?.key ?? o.extra?.sup?.key ?? o.extra?.weld?.key;
  if (o.cat === 'planted' || ROUND.has(o.kind) || !key) { bprimsOf.set(o.id, o.prims); continue; }
  const M = prims[o.prims[0]].M, out: number[] = [];
  for (const [mn, mx] of keyBoxes(key)) { const sh: Shape = { t: 0, b: { mn, mx }, mn, mx, exact: true }; const dummy = { ...o, prims: [] as number[], mn: [...o.mn] as V3, mx: [...o.mx] as V3 } as Obj; addPrim(dummy, sh, M); out.push(...dummy.prims); }
  for (const pi of out) prims[pi].obj = o.id;
  bprimsOf.set(o.id, out);
}

// ------------------------------------------------------------------------------------------------------------------
// one PASS: candidate pairs (unrelated, grown boxes overlapping, overlap within the region), jobs per 32 in tile, rasterisation into the
// sparse cell table, and per pair: occupied cells, cells deeper than noise, cells with both centres inside, deepest, where, deep bounds
const TV = 64, NC = TV * TV * TV, BLK = 8, BLKR = (BLK * VOX * Math.sqrt(3)) / 2;
const cellStamp = new Int32Array(NC), cellHead = new Int32Array(NC), touched = new Int32Array(NC);
let poolObj = new Int32Array(1 << 20), poolSd = new Float32Array(1 << 20), poolNext = new Int32Array(1 << 20), np = 0, nt = 0, stamp = 0;
const scrStamp = new Int32Array(NC), scrDist = new Float64Array(NC), scrAcc = new Float64Array(NC), scrList = new Int32Array(NC); let scrN = 0, scrS = 0;
function grow() { const n = poolObj.length * 2; const a = new Int32Array(n); a.set(poolObj); poolObj = a; const b = new Float32Array(n); b.set(poolSd); poolSd = b; const c = new Int32Array(n); c.set(poolNext); poolNext = c; }
function put(c: number, o: number, sd: number) {
  if (cellStamp[c] !== stamp) { cellStamp[c] = stamp; cellHead[c] = -1; touched[nt++] = c; }
  for (let e = cellHead[c]; e >= 0; e = poolNext[e]) if (poolObj[e] === o) { if (sd < poolSd[e]) poolSd[e] = sd; return; }
  if (np >= poolObj.length) grow();
  poolObj[np] = o; poolSd[np] = sd; poolNext[np] = cellHead[c]; cellHead[c] = np++;
}
const cl = new Float64Array(8);
interface PassResult { name: string; pairs: { a: number; b: number }[]; occ: Int32Array; deep: Int32Array; both: Int32Array; max: Float64Array; at: Float64Array; bb: Float64Array; sampledM: number; outside: number; relSkipped: number; tiles: number }
function runPass(name: string, primsFor: (o: Obj) => number[] | undefined, keep: (o: Obj) => boolean, pairOk: (a: Obj, b: Obj) => boolean = () => true, audit = false): PassResult {
  // object boxes of this tier and a grid of them
  const omn = new Map<number, V3>(), omx = new Map<number, V3>(), g = new Map<number, number[]>();
  for (const o of objs) {
    if (!keep(o)) continue; const pl = primsFor(o); if (!pl?.length) continue;
    const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity]; for (const pi of pl) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], prims[pi].mn[a]); mx[a] = Math.max(mx[a], prims[pi].mx[a]); }
    omn.set(o.id, mn); omx.set(o.id, mx);
    for (let i = Math.floor(mn[0] / G); i <= Math.floor(mx[0] / G); i++) for (let j = Math.floor(mn[1] / G); j <= Math.floor(mx[1] / G); j++) for (let k = Math.floor(mn[2] / G); k <= Math.floor(mx[2] / G); k++) { const key = gk(i, j, k); let l = g.get(key); if (!l) g.set(key, l = []); l.push(o.id); }
  }
  const pairs: { a: number; b: number }[] = [], pairIdx = new Map<number, number>(); let outside = 0, relSkipped = 0;
  for (const [key, l] of g) {
    if (l.length < 2) continue;
    for (let x = 0; x < l.length; x++) {
      const A = objs[l[x]], amn = omn.get(A.id)!, amx = omx.get(A.id)!;
      for (let y = x + 1; y < l.length; y++) {
        const B = objs[l[y]], bmn = omn.get(B.id)!, bmx = omx.get(B.id)!;
        if (A.group >= 0 && A.group === B.group && !(audit && process.env.RELAUDIT === 'groups')) continue;
        if (amn[0] > bmx[0] || bmn[0] > amx[0] || amn[1] > bmx[1] || bmn[1] > amx[1] || amn[2] > bmx[2] || bmn[2] > amx[2]) continue;
        const lo: V3 = [Math.max(amn[0], bmn[0]), Math.max(amn[1], bmn[1]), Math.max(amn[2], bmn[2])];
        if (gk(Math.floor(lo[0] / G), Math.floor(lo[1] / G), Math.floor(lo[2] / G)) !== key) continue;     // taken once, in the cell holding the overlap's low corner
        if (!pairOk(A, B)) continue;
        if (related(A, B) !== audit) { relSkipped++; continue; }
        const hi: V3 = [Math.min(amx[0], bmx[0]), Math.min(amx[1], bmx[1]), Math.min(amx[2], bmx[2])];
        if (!boxInRoi(lo, hi)) { outside++; continue; }
        pairIdx.set(pk(A.id, B.id), pairs.length); pairs.push({ a: A.id, b: B.id });
      }
    }
  }
  tick(`${name}: candidate pairs ${pairs.length} (related skipped ${relSkipped}, outside the region ${outside})`);
  // jobs: each primitive over the overlap of its box with each unrelated primitive's box, cut into tiles
  const jobs = new Map<number, Map<number, number[]>>();
  const tkey = (i: number, j: number, k: number) => (i + 2048) + 4096 * ((j + 256) + 512 * (k + 2048));
  const addJob = (pi: number, mn: V3, mx: V3) => {
    const i0 = Math.ceil(mn[0] / VOX - 0.5), i1 = Math.floor(mx[0] / VOX - 0.5), j0 = Math.ceil(mn[1] / VOX - 0.5), j1 = Math.floor(mx[1] / VOX - 0.5), k0 = Math.ceil(mn[2] / VOX - 0.5), k1 = Math.floor(mx[2] / VOX - 0.5);
    if (i1 < i0 || j1 < j0 || k1 < k0) return;
    for (let ti = Math.floor(i0 / TV); ti <= Math.floor(i1 / TV); ti++) for (let tj = Math.floor(j0 / TV); tj <= Math.floor(j1 / TV); tj++) for (let tk = Math.floor(k0 / TV); tk <= Math.floor(k1 / TV); tk++) {
      const a0 = Math.max(i0, ti * TV), a1 = Math.min(i1, ti * TV + TV - 1), b0 = Math.max(j0, tj * TV), b1 = Math.min(j1, tj * TV + TV - 1), c0 = Math.max(k0, tk * TV), c1 = Math.min(k1, tk * TV + TV - 1);
      const key = tkey(ti, tj, tk); let m = jobs.get(key); if (!m) jobs.set(key, m = new Map());
      const e = m.get(pi);
      if (!e) m.set(pi, [a0, a1, b0, b1, c0, c1]); else { e[0] = Math.min(e[0], a0); e[1] = Math.max(e[1], a1); e[2] = Math.min(e[2], b0); e[3] = Math.max(e[3], b1); e[4] = Math.min(e[4], c0); e[5] = Math.max(e[5], c1); }
    }
  };
  for (const pr of pairs) {
    const amn = omn.get(pr.a)!, amx = omx.get(pr.a)!, bmn = omn.get(pr.b)!, bmx = omx.get(pr.b)!, lo: V3 = [Math.max(amn[0], bmn[0]), Math.max(amn[1], bmn[1]), Math.max(amn[2], bmn[2])], hi: V3 = [Math.min(amx[0], bmx[0]), Math.min(amx[1], bmx[1]), Math.min(amx[2], bmx[2])];
    const inBox = (p: Prim) => p.mn[0] <= hi[0] && p.mx[0] >= lo[0] && p.mn[1] <= hi[1] && p.mx[1] >= lo[1] && p.mn[2] <= hi[2] && p.mx[2] >= lo[2];
    const pa = primsFor(objs[pr.a])!.filter(i => inBox(prims[i])), pb = primsFor(objs[pr.b])!.filter(i => inBox(prims[i]));
    for (const i of pa) { const P = prims[i]; for (const j of pb) { const Q = prims[j];
      if (P.mn[0] > Q.mx[0] || Q.mn[0] > P.mx[0] || P.mn[1] > Q.mx[1] || Q.mn[1] > P.mx[1] || P.mn[2] > Q.mx[2] || Q.mn[2] > P.mx[2]) continue;
      const mn: V3 = [Math.max(P.mn[0], Q.mn[0]), Math.max(P.mn[1], Q.mn[1]), Math.max(P.mn[2], Q.mn[2])], mx: V3 = [Math.min(P.mx[0], Q.mx[0]), Math.min(P.mx[1], Q.mx[1]), Math.min(P.mx[2], Q.mx[2])];
      addJob(i, mn, mx); addJob(j, mn, mx); } }
  }
  let jobVoxels = 0; for (const m of jobs.values()) for (const e of m.values()) jobVoxels += (e[1] - e[0] + 1) * (e[3] - e[2] + 1) * (e[5] - e[4] + 1);
  tick(`${name}: tiles ${jobs.size}, voxels in job boxes ${(jobVoxels / 1e6).toFixed(1)} M`);
  const n = pairs.length, R: PassResult = { name, pairs, occ: new Int32Array(n), deep: new Int32Array(n), both: new Int32Array(n), max: new Float64Array(n).fill(-Infinity), at: new Float64Array(3 * n), bb: new Float64Array(6 * n), sampledM: 0, outside, relSkipped, tiles: jobs.size };
  for (let i = 0; i < n; i++) { R.bb[6 * i] = R.bb[6 * i + 1] = R.bb[6 * i + 2] = Infinity; R.bb[6 * i + 3] = R.bb[6 * i + 4] = R.bb[6 * i + 5] = -Infinity; }
  let sampled = 0;
  for (const [key, m] of jobs) {
    stamp++; np = 0; nt = 0;
    const ti = (key % 4096) - 2048, tj = (Math.floor(key / 4096) % 512) - 256, tk = Math.floor(key / (4096 * 512)) - 2048, bi = ti * TV, bj = tj * TV, bk = tk * TV;
    for (const [pi, e] of m) {
      const p = prims[pi], o = p.obj, s = p.s;
      if (s.t !== 5) {
        // analytic: every cell centre of the job box, 4 in blocks wholly clear of the solid skipped
        for (let I0 = e[0]; I0 <= e[1]; I0 += BLK) for (let J0 = e[2]; J0 <= e[3]; J0 += BLK) for (let K0 = e[4]; K0 <= e[5]; K0 += BLK) {
          const I1 = Math.min(e[1], I0 + BLK - 1), J1 = Math.min(e[3], J0 + BLK - 1), K1 = Math.min(e[5], K0 + BLK - 1);
          if (I1 - I0 + J1 - J0 + K1 - K0 > 6) { const q = toLocal(p.M, ((I0 + I1) / 2 + 0.5) * VOX, ((J0 + J1) / 2 + 0.5) * VOX, ((K0 + K1) / 2 + 0.5) * VOX); if (shapeSd(s, q[0], q[1], q[2]) > H + BLKR) continue; }
          for (let i = I0; i <= I1; i++) for (let j = J0; j <= J1; j++) for (let k = K0; k <= K1; k++) {
            const q = toLocal(p.M, (i + 0.5) * VOX, (j + 0.5) * VOX, (k + 0.5) * VOX), sd = shapeSd(s, q[0], q[1], q[2]); sampled++;
            if (sd <= H) put((i - bi) + TV * ((j - bj) + TV * (k - bk)), o, sd);
          }
        }
      } else {
        // a mesh surface: from each triangle near the job box, the cells within the half diagonal of it, signed by the nearest face's outward normal
        scrS++; scrN = 0;
        const llo: V3 = [Infinity, Infinity, Infinity], lhi: V3 = [-Infinity, -Infinity, -Infinity];
        for (let c = 0; c < 8; c++) { const q = toLocal(p.M, ((c & 1 ? e[1] : e[0]) + 0.5) * VOX, ((c & 2 ? e[3] : e[2]) + 0.5) * VOX, ((c & 4 ? e[5] : e[4]) + 0.5) * VOX); for (let a = 0; a < 3; a++) { llo[a] = Math.min(llo[a], q[a] - H); lhi[a] = Math.max(lhi[a], q[a] + H); } }
        const M = p.M, P = s.pos;
        trisNear(s, llo, lhi, t => {
          const v0 = 3 * s.tri[3 * t], v1 = 3 * s.tri[3 * t + 1], v2 = 3 * s.tri[3 * t + 2];
          if (Math.min(P[v0], P[v1], P[v2]) > lhi[0] || Math.max(P[v0], P[v1], P[v2]) < llo[0] || Math.min(P[v0 + 1], P[v1 + 1], P[v2 + 1]) > lhi[1] || Math.max(P[v0 + 1], P[v1 + 1], P[v2 + 1]) < llo[1] || Math.min(P[v0 + 2], P[v1 + 2], P[v2 + 2]) > lhi[2] || Math.max(P[v0 + 2], P[v1 + 2], P[v2 + 2]) < llo[2]) return;
          let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
          for (const v of [v0, v1, v2]) { const w = xfP(M, P[v], P[v + 1], P[v + 2]); x0 = Math.min(x0, w[0]); x1 = Math.max(x1, w[0]); y0 = Math.min(y0, w[1]); y1 = Math.max(y1, w[1]); z0 = Math.min(z0, w[2]); z1 = Math.max(z1, w[2]); }
          const a0 = Math.max(e[0], Math.ceil((x0 - H) / VOX - 0.5)), a1 = Math.min(e[1], Math.floor((x1 + H) / VOX - 0.5)), b0 = Math.max(e[2], Math.ceil((y0 - H) / VOX - 0.5)), b1 = Math.min(e[3], Math.floor((y1 + H) / VOX - 0.5)), c0 = Math.max(e[4], Math.ceil((z0 - H) / VOX - 0.5)), c1 = Math.min(e[5], Math.floor((z1 + H) / VOX - 0.5));
          for (let i = a0; i <= a1; i++) for (let j = b0; j <= b1; j++) for (let k = c0; k <= c1; k++) {
            const q = toLocal(M, (i + 0.5) * VOX, (j + 0.5) * VOX, (k + 0.5) * VOX), d2 = closestTri(q[0], q[1], q[2], P, s.tri[3 * t], s.tri[3 * t + 1], s.tri[3 * t + 2], cl); sampled++;
            if (d2 > H * H) continue;
            const nl = Math.hypot(cl[4], cl[5], cl[6]) || 1, sgd = ((q[0] - cl[0]) * cl[4] + (q[1] - cl[1]) * cl[5] + (q[2] - cl[2]) * cl[6]) / nl, c = (i - bi) + TV * ((j - bj) + TV * (k - bk));
            if (scrStamp[c] !== scrS) { scrStamp[c] = scrS; scrDist[c] = d2; scrAcc[c] = sgd; scrList[scrN++] = c; }
            else if (d2 < scrDist[c] - 1e-9) { scrDist[c] = d2; scrAcc[c] = sgd; }
            else if (d2 <= scrDist[c] + 1e-9) scrAcc[c] += sgd;
          }
        });
        for (let q = 0; q < scrN; q++) { const c = scrList[q], d = Math.sqrt(scrDist[c]); put(c, o, s.sgn === 0 ? d : scrAcc[c] * s.sgn >= 0 ? d : -d); }
      }
    }
    // score the cells held by two objects of a candidate pair
    for (let q = 0; q < nt; q++) {
      const c = touched[q], h = cellHead[c]; if (h < 0 || poolNext[h] < 0) continue;
      for (let e1 = h; e1 >= 0; e1 = poolNext[e1]) for (let e2 = poolNext[e1]; e2 >= 0; e2 = poolNext[e2]) {
        const idx = pairIdx.get(pk(poolObj[e1], poolObj[e2])); if (idx === undefined) continue;
        const sa = poolSd[e1], sb = poolSd[e2], d = -(sa + sb);
        R.occ[idx]++; if (sa < 0 && sb < 0) R.both[idx]++;
        if (d > NOISE) {
          const li = c % TV, lj = Math.floor(c / TV) % TV, lk = Math.floor(c / (TV * TV)), x = (bi + li + 0.5) * VOX, y = (bj + lj + 0.5) * VOX, z = (bk + lk + 0.5) * VOX;
          R.deep[idx]++;
          if (d > R.max[idx]) { R.max[idx] = d; R.at[3 * idx] = x; R.at[3 * idx + 1] = y; R.at[3 * idx + 2] = z; }
          const bb = 6 * idx; R.bb[bb] = Math.min(R.bb[bb], x); R.bb[bb + 1] = Math.min(R.bb[bb + 1], y); R.bb[bb + 2] = Math.min(R.bb[bb + 2], z); R.bb[bb + 3] = Math.max(R.bb[bb + 3], x); R.bb[bb + 4] = Math.max(R.bb[bb + 4], y); R.bb[bb + 5] = Math.max(R.bb[bb + 5], z);
        } else if (d > R.max[idx]) R.max[idx] = d;
      }
    }
  }
  R.sampledM = round(sampled / 1e6, 10);
  tick(`${name}: rasterised, ${R.sampledM} M distance samples`);
  return R;
}
if (process.env.RELAUDIT) {
  const RA = runPass('related audit', o => o.prims, () => true, () => true, true);
  const cat = (w: string) => w.replace(/: .*$/, '').replace(/ (on|of|with|bears|carries|ends|bolts|meets|founded).*$/, '');
  const by = new Map<string, { n: number; deep: number; max: number; ex: string[] }>();
  const rows: any[] = [];
  for (let i = 0; i < RA.pairs.length; i++) { if (!(RA.max[i] > NOISE)) continue; const A = objs[RA.pairs[i].a], B = objs[RA.pairs[i].b], why = relWhy(A, B), k = `${cat(why)} | ${A.cat}/${B.cat}`;
    const e = by.get(k) ?? { n: 0, deep: 0, max: 0, ex: [] }; e.n++; if (RA.max[i] > 0.5) e.deep++; e.max = Math.max(e.max, RA.max[i]); by.set(k, e);
    rows.push({ why, a: `${A.model} ${A.tag} [${A.kind}]`, b: `${B.model} ${B.tag} [${B.kind}]`, d: round(RA.max[i], 1000), at: [RA.at[3 * i], RA.at[3 * i + 1], RA.at[3 * i + 2]].map(v => round(v, 10)) }); }
  rows.sort((p, q) => q.d - p.d);
  for (const [k, e] of [...by.entries()].sort((a, b) => b[1].max - a[1].max)) console.error(`  RELAUDIT ${k}: ${e.n} pairs deeper than noise, ${e.deep} deeper than 0.5 in, max ${round(e.max, 1000)}`);
  writeFileSync(`${process.env.OUT ?? HERE}/relaudit-${LABEL}.json`, JSON.stringify(rows, null, 1));
}
const EX = runPass('exact', o => o.prims, () => true);
// REVIEW: CONTAINMENT. A mesh-surface solid is rasterised only within the half diagonal of its surface, so a piece wholly inside one (crossing none
// of its faces) shares no cell with it. For every candidate pair the exact pass left at or under noise, sample points inside each side's solids are
// tested against the other side's closed meshes by ray parity (three axis rays, majority); a point inside both is an overlap, its depth
// -(sdA + sdB) with the mesh side's distance taken to its nearest triangle.
const CONTAINED: { i: number; depth: number; at: V3; inner: number }[] = [];
if (!OLD.has('containment')) {
  let tested = 0;
  for (let i = 0; i < EX.pairs.length; i++) {
    if (EX.max[i] > NOISE) continue; const A = objs[EX.pairs[i].a], B = objs[EX.pairs[i].b];
    for (const [X, Y] of [[A, B], [B, A]] as [Obj, Obj][]) {
      const meshes = Y.prims.filter(pi => prims[pi].s.t === 5 && (prims[pi].s as { sgn: number }).sgn !== 0); if (!meshes.length) continue; tested++;
      let best: { depth: number; at: V3 } | undefined;
      for (const w of samplePts(X)) for (const pi of meshes) { const P = prims[pi]; if (w[0] < P.mn[0] || w[0] > P.mx[0] || w[1] < P.mn[1] || w[1] > P.mx[1] || w[2] < P.mn[2] || w[2] > P.mx[2]) continue;
        if (!insideMesh(P, w)) continue; const dY = primSd(P, w[0], w[1], w[2], 1e6), dX = objSd(X, w[0], w[1], w[2]), depth = Math.abs(dY) - Math.min(0, dX); if (!best || depth > best.depth) best = { depth, at: w }; }
      if (best && best.depth > NOISE) { CONTAINED.push({ i, depth: best.depth, at: best.at, inner: X.id }); break; }
    }
  }
  tick(`containment: ${tested} pair sides with a closed mesh tested, ${CONTAINED.length} pairs with a piece inside the other's mesh`);
  for (const c of CONTAINED) { EX.max[c.i] = c.depth; EX.at[3 * c.i] = c.at[0]; EX.at[3 * c.i + 1] = c.at[1]; EX.at[3 * c.i + 2] = c.at[2]; EX.deep[c.i] = Math.max(EX.deep[c.i], 1); const bb = 6 * c.i; EX.bb[bb] = EX.bb[bb + 3] = c.at[0]; EX.bb[bb + 1] = EX.bb[bb + 4] = c.at[1]; EX.bb[bb + 2] = EX.bb[bb + 5] = c.at[2]; }
}
const BX = runPass('box tier', o => bprimsOf.get(o.id), o => isPipingCat(o), (a, b) => a.model !== b.model);

// ------------------------------------------------------------------------------------------------------------------
// FINDINGS: one per object pair whose cluster is deeper than noise
const desc = (o: Obj) => ({ model: o.model, line: o.line, tag: o.tag, kind: o.kind });
const approx = (o: Obj) => o.prims.some(pi => prims[pi].s.t === 5 && (prims[pi].s as { sgn: number }).sgn === 0);
interface Finding { a: ReturnType<typeof desc>; b: ReturnType<typeof desc>; depthIn: number; at: V3; note: string; tier: 'solid' | 'box-only'; clearanceIn?: number }
const findings: Finding[] = [];
let refineBudget = Number(process.env.REFINE_MS ?? 120000), nRefined = 0;   // at most 2 minutes of depth refinement in all
const solidKeys = new Set<number>();
function emit(R: PassResult, i: number, tier: Finding['tier']) {
  let A = objs[R.pairs[i].a], B = objs[R.pairs[i].b];
  if (isPipingCat(B) && !isPipingCat(A)) [A, B] = [B, A];
  if (B.model === 'pipeway' && A.model !== 'pipeway' && isPipingCat(B)) [A, B] = [B, A];
  const bb = 6 * i, ext = [R.bb[bb + 3] - R.bb[bb] + VOX, R.bb[bb + 4] - R.bb[bb + 1] + VOX, R.bb[bb + 5] - R.bb[bb + 2] + VOX].map(v => round(v, 10));
  const cross = A.model !== B.model ? 'across models' : A.line !== B.line ? 'between lines/objects of one model' : 'within one line (not neighbours in its chain)';
  let at: V3 = [R.at[3 * i], R.at[3 * i + 1], R.at[3 * i + 2]], depth = R.max[i], refined = '';
  // REVIEW: the cell-centre depth misses the overlap of a plate thinner than a cell (a cell centre nearer a plate's far face): a shoe base 0.2 in
  // into a beam read 0.07 in. Each solid finding is refined by sampling -(sdA+sdB) finely (about 1500 points, step >= 0.05 in) over its deep
  // cluster grown by 0.5 in; the depth reported is the larger of the two.
  if (tier === 'solid' && !OLD.has('depth') && refineBudget > 0) {
    const t0 = Date.now(), lo = [R.bb[bb] - 0.5, R.bb[bb + 1] - 0.5, R.bb[bb + 2] - 0.5], hi = [R.bb[bb + 3] + 0.5, R.bb[bb + 4] + 0.5, R.bb[bb + 5] + 0.5];
    if (Number.isFinite(lo[0])) { const st = Math.max(0.05, Math.cbrt(((hi[0] - lo[0]) * (hi[1] - lo[1]) * (hi[2] - lo[2])) / 1500));
      for (let x = lo[0]; x <= hi[0] + 1e-9; x += st) for (let y = lo[1]; y <= hi[1] + 1e-9; y += st) for (let z = lo[2]; z <= hi[2] + 1e-9; z += st) { const a = objSd(A, x, y, z); if (a > 0.5) continue; const b = objSd(B, x, y, z), d = -(a + b); if (d > depth) { depth = d; at = [x, y, z]; refined = ` (refined from ${round(R.max[i], 1000)} in at the cell centres by sampling at ${round(st, 100)} in)`; } } }
    refineBudget -= Date.now() - t0; nRefined++;
  }
  const kinds = (o: Obj) => { let best = Infinity, t = -1; for (const pi of o.prims) { const d = primSd(prims[pi], at[0], at[1], at[2]); if (d < best) { best = d; t = prims[pi].s.t; } } return `${round(best, 1000)} (${['box', 'cylinder', 'revolved', 'torus', 'prism', 'mesh'][t] ?? '?'})`; };
  let clearance: number | undefined, extra = '';
  if (tier === 'box-only' && !process.env.NOCLEAR) {
    // the exact solids' clearance over the box cluster (0.1 in samples)
    const lo = [R.bb[bb] - 0.75, R.bb[bb + 1] - 0.75, R.bb[bb + 2] - 0.75], hi = [R.bb[bb + 3] + 0.75, R.bb[bb + 4] + 0.75, R.bb[bb + 5] + 0.75], st = Math.max(0.2, Math.cbrt((hi[0] - lo[0]) * (hi[1] - lo[1]) * (hi[2] - lo[2]) / 1500));
    let best = -Infinity; for (let x = lo[0]; x <= hi[0]; x += st) for (let y = lo[1]; y <= hi[1]; y += st) for (let z = lo[2]; z <= hi[2]; z += st) { const a = objSd(A, x, y, z); if (a > 3) continue; const b = objSd(B, x, y, z); best = Math.max(best, -(a + b)); }
    clearance = Number.isFinite(best) ? round(-best, 1000) : undefined;
    extra = `; BOX-ONLY: overlaps only where flanges, gaskets, valves, stud sets, spades, blinds, supports or welds are taken as their solids' boxes; the true solids are ${clearance === undefined ? 'more than 4 in' : clearance > 0 ? `${clearance} in apart` : `touching or overlapping by ${-clearance} in (under the exact tier's ${NOISE} in noise or between its cell centres)`}`;
  }
  { const key = pk(A.id, B.id), sk = sunkPairs.get(key), ct = R === EX ? CONTAINED.find(c => c.i === i) : undefined;
    if (sk) extra += `; SUNK BEARING: ${sk} (a bearing is excused only as a contact within ${JOIN} in)`;
    if (foldPairs.has(key)) extra += '; FOLD-BACK: neighbours in the chain whose directions at their shared end are reversed, so one lies over the other';
    if (ct) extra += `; CONTAINED: ${objs[ct.inner].tag} lies inside the other's closed mesh (found by ray parity, no surface crossing)`;
    if (A.cat === 'weld' || B.cat === 'weld') { const w = (A.cat === 'weld' ? A : B); if (w.extra?.tilted) extra += '; WELD RECORD TILTED: this weld record is not square to its pipe (it lies along an elbow chord); held as recorded'; } }
  if (A.kind === 'studs' && B.kind === 'studs' && A.lineKey === B.lineKey) extra += '; two stud sets of neighbouring joints of one line (either side of a short wafer valve) fill the same bolt circle: the joint is bolted twice in the model';
  findings.push({ a: desc(A), b: desc(B), depthIn: round(depth, 1000), at: [round(at[0], 100), round(at[1], 100), round(at[2], 100)], tier, ...(clearance !== undefined ? { clearanceIn: clearance } : {}),
    note: `[${tier}] ${A.cat} vs ${B.cat}, ${cross}; ${R.deep[i]} cells deeper than ${NOISE} in (${R.both[i]} with both centres inside, ${R.occ[i]} shared); deep cluster spans ${ext.join(' x ')} in; signed distances at the deepest point A ${kinds(A)}, B ${kinds(B)}${refined}${approx(A) || approx(B) ? '; one side has an open mesh surface (depth a lower bound)' : ''}${extra}` });
}
for (let i = 0; i < EX.pairs.length; i++) if (EX.max[i] > NOISE) { emit(EX, i, 'solid'); solidKeys.add(pk(EX.pairs[i].a, EX.pairs[i].b)); }
const nSolid = findings.length;
for (let i = 0; i < BX.pairs.length; i++) if (BX.max[i] > NOISE && !solidKeys.has(pk(BX.pairs[i].a, BX.pairs[i].b))) emit(BX, i, 'box-only');
findings.sort((p, q) => (p.tier === q.tier ? q.depthIn - p.depthIn : p.tier === 'solid' ? -1 : 1));
mkdirSync(HERE, { recursive: true });
writeFileSync(`${process.env.OUT ?? HERE}/findings-${LABEL}.json`, JSON.stringify(findings, null, 1));

// calibration report
const KNOWN = [['3"-P600-P-10618', 'BL-1724'], ['4"-P150-P-10632', 'BL-1211'], ['4"-P300-P-10631', 'BL-1611']];
const known = KNOWN.map(([l, s]) => { const f = findings.filter(x => (x.a.line === l && x.b.line.startsWith(s)) || (x.b.line === l && x.a.line.startsWith(s))); return `${l} x ${s}: ${f.length ? f.map(x => `${x.tier} ${x.a.tag} x ${x.b.tag} ${x.depthIn} in${x.clearanceIn !== undefined ? ` (true solids ${x.clearanceIn} in apart)` : ''}`).join('; ') : 'NOT FOUND'}`; });
const plantedRep = planted.map(p => { const P0 = objs[p.obj], f = findings.filter(x => (x.a.model === P0.model && x.a.tag === P0.tag) || (x.b.model === P0.model && x.b.tag === P0.tag)); return `planted ${P0.tag} (expect ${p.expect}, ${round(p.depth, 100)} in) -> ${f.map(x => `${x.tier} ${x.a.tag === P0.tag ? `${x.b.model} ${x.b.line} ${x.b.tag}` : `${x.a.model} ${x.a.line} ${x.a.tag}`} ${x.depthIn} in`).join('; ') || 'NOT FOUND'}`; });
const byKind = new Map<string, number>(); for (const f of findings) { const k = [f.tier, f.a.model === f.b.model ? f.a.model : `${f.a.model}~${f.b.model}`, `${f.a.kind.split(':')[0]}/${f.b.kind.split(':')[0]}`].join(' '); byKind.set(k, (byKind.get(k) ?? 0) + 1); }
const byCat: Record<string, number> = {}; for (const o of objs) byCat[o.cat] = (byCat[o.cat] ?? 0) + 1;
const meta = { label: LABEL, models: MODELS, objects: objs.length, byCat, prims: prims.length, piping: nPiping, frames: nFrames, relations: rel.size, supportsBearing: bearFound, supportsNoBearingFound: bearNone, supportsNoBearingSample: bearNoneList, shapes: STATS,
  passes: [EX, BX].map(R => ({ name: R.name, candidatePairs: R.pairs.length, relatedSkipped: R.relSkipped, outsideRegion: R.outside, tiles: R.tiles, sampledM: R.sampledM })), review: { depthRefined: nRefined, depthRefineBudgetLeftMs: refineBudget, castCells: CAST_CELLS, castFromCache: cacheHits, castPolygonised: cacheMisses, chainFoldBacks: foldBacks, bearingsSunk: bearSunk, sunkSample: bearSunkList, contained: CONTAINED.length, weldRecordsTilted: STATS.weldsTilted, weldsHeld: process.env.WELDS === 'recorded' ? 'as recorded' : 'square to their pipe', old: [...OLD], labelled: { sunkBearing: findings.filter(f => f.note.includes('SUNK BEARING')).length, foldBack: findings.filter(f => f.note.includes('FOLD-BACK')).length, contained: findings.filter(f => f.note.includes('CONTAINED')).length, tiltedWeld: findings.filter(f => f.note.includes('WELD RECORD TILTED')).length } }, seconds: round((Date.now() - T0) / 1000, 10), findings: findings.length, solid: nSolid, boxOnly: findings.length - nSolid, known, planted: plantedRep, byKind: Object.fromEntries([...byKind.entries()].sort((a, b) => b[1] - a[1])), policy: CONTACT_POLICY };
writeFileSync(`${process.env.OUT ?? HERE}/meta-${LABEL}.json`, JSON.stringify(meta, null, 1));
for (const k of known) console.error('  ' + k); for (const p of plantedRep) console.error('  ' + p);
console.log(`voxel ${LABEL}: ${findings.length} findings (${nSolid} solid, deepest ${findings[0]?.depthIn ?? 0} in; ${findings.length - nSolid} box-only) from ${objs.length} objects, ${EX.pairs.length}+${BX.pairs.length} unrelated candidate pairs, in ${round((Date.now() - T0) / 1000, 10)} s -> ${HERE}/findings-${LABEL}.json`);
