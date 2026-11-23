/**
 * Structural assemblies for the catalogue: DESIGN_BASIS.md §71 (SW-STA-*). Modules of members drawn in place, z up from
 * the top of concrete, sized by the rules already written for members and access (§4–10, §19–24). Catalogue items only:
 * in no plant and no ground truth. SmartWeld's own arrangements (PROVENANCE P-76).
 */
import { drawing, rule, type Dim } from '../core/basis';
import { K, weightPerFootFromArea } from '../core/constants';
import { roundUpTo } from '../core/units';
import { makeBasePlate, proportionW, proportionC, done, cylZ, at, member, P_L3, type PartSpec, type WDims, type Solid } from '../catalogue';
import { wProfile, cProfile, lProfile } from '../geometry/profiles';
import { extrude, transformMesh, mergeMeshes, signedVolume, type MeshData, type Profile, type Mat4 } from '../geometry/mesh';
import { rect, circle, annularSector } from '../geometry/polygon';
import { translate, multiply, rotateZ, frameFromAxes } from '../geometry/transform';
import { sweep, boxMesh, orient, hexNut, chamferedPrism, type V3 } from '../catalogue/parts/detailKit';
import { sizeW } from '../generator/building';

const FY = 36;
/** SW-PF-3: plastic modulus needed for a uniform load of psf over a tributary width on a span (in) */
export const zReq = (psf: number, tribIn: number, spanIn: number) => (((psf * tribIn) / 144 / 1000) * spanIn * spanIn) / 8 / (0.9 * FY);
export interface Sec { D: number; w: number; dims: WDims; name: string }
/** SW-STA-1: a W of nominal depth D meeting Z; Z = 0 gives the lightest (family reference rounded up to 5 lb/ft) */
export const sec = (D: number, Z = 0): Sec => { const s = sizeW(D, Z); return { D, w: s.w, dims: s.dims, name: `W${D}x${s.w}` }; };
/** SW-STA-1: a column of nominal depth D carrying P kip of floor load: area at least P / (0.45 Fy) */
export const colSec = (D: number, Pkip: number): Sec => { const w = Math.max(sec(D).w, roundUpTo(Math.ceil(weightPerFootFromArea(Pkip / (0.45 * FY))), 5)); return { D, w, dims: proportionW(D, w), name: `W${D}x${w}` }; };
const wp = (s: Sec): Profile => ({ outer: wProfile(s.dims) });
const P_L4: Profile = { outer: lProfile(4, 4, 0.375) }, RING: Profile = { outer: circle(0, 0, 1, 16), inner: circle(0, 0, 0.875, 16) };
const depth = (len: number, ratio: number, least: number) => Math.max(least, roundUpTo(len / ratio, 2));

type Bag = { add(name: string, role: Solid['role'], ...m: MeshData[]): void; solids(): Solid[]; merge(list: Solid[], T?: Mat4): void };
function bag(): Bag {
  const m = new Map<string, { role: Solid['role']; parts: MeshData[] }>();
  const add = (name: string, role: Solid['role'], ...meshes: MeshData[]) => { const e = m.get(name) ?? { role, parts: [] }; e.parts.push(...meshes); m.set(name, e); };
  return { add, solids: () => [...m].map(([name, e]) => ({ name, role: e.role, mesh: mergeMeshes(e.parts) })), merge: (list, T) => { for (const s of list) add(s.name, s.role, T ? transformMesh(s.mesh, T) : s.mesh); } };
}
function structure(id: string, designation: string, dims: Record<string, Dim>, lengthIn: number, solids: Solid[], notes: string[] = []): PartSpec {
  const p = done(id, 'STRUCTURE', designation, dims, lengthIn, solids, notes), vol = (pick: (s: Solid) => boolean) => solids.filter(pick).reduce((a, s) => a + signedVolume(s.mesh), 0);
  const notSteel = (s: Solid) => s.role === 'concrete' || s.role === 'grout';
  return { ...p, category: 'structure', weight: rule((vol(s => !notSteel(s)) * K.STEEL_DENSITY_LB_FT3) / 1728, 'SW-STA-1', 'Weight of the drawn steel', 'lb'), notes: ['Members drawn in place at true size; joints between members are not drawn (SW-STA-1). Concrete and grout are drawn and not weighed.', ...p.notes.filter(n => !n.startsWith('Envelope only'))] };
}
const col = (x: number, y: number, z0: number, z1: number, s: Sec, web: 'x' | 'y') => member([x, y, z0], [x, y, z1], wp(s), web === 'x' ? [1, 0, 0] : [0, 1, 0]);
/** a beam whose top of steel is at zTop, between plan points a and b */
const beam = (a: [number, number], b: [number, number], zTop: number, s: Sec) => member([a[0], a[1], zTop - s.dims.d / 2], [b[0], b[1], zTop - s.dims.d / 2], wp(s), [0, 0, 1]);
/** SW-STA-1: pedestal, grout, base plate and four anchor rods under a column; returns the top of the plate */
function base(b: Bag, x: number, y: number, s: Sec, web: 'x' | 'y'): number {
  const bp = makeBasePlate('BP', { column: s.dims }), N = bp.dims.N.value, Bw = bp.dims.B.value, t = bp.dims.t.value, g = bp.dims.grout.value, hx = (web === 'x' ? N : Bw) / 2, hy = (web === 'x' ? Bw : N) / 2, top = 6 + g + t;
  b.add('pedestals (concrete, 6 in; SW-RK-4)', 'concrete', boxMesh(x - hx - 3, y - hy - 3, 0, x + hx + 3, y + hy + 3, 6));
  b.add('grout beds (SW-BP-5)', 'grout', boxMesh(x - hx, y - hy, 6, x + hx, y + hy, 6 + g));
  b.add('base plates (SW-BP-1..4)', 'steel', boxMesh(x - hx, y - hy, 6 + g, x + hx, y + hy, top));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const rx = x + sx * (hx - 1.5), ry = y + sy * (hy - 1.5); b.add('anchor rods RD3/4 with nuts', 'hardware', cylZ(rx, ry, 0.375, top - 0.25, top + 1.75, 10), at(hexNut(0.75), rx, ry, top)); }
  return top;
}
/** SW-STA-2: guardrail along a path at floor level: a post at every point and at 6 ft at most, top and mid rail, toe plate */
function railPath(b: Bag, pts: V3[], toe = true) {
  const post = (p: V3) => b.add('guardrail HSS2x1/8, 42 in (SW-HR-1)', 'safety', at(extrude(RING, 41, 0), p[0], p[1], p[2]));
  pts.forEach((p, i) => {
    post(p); if (i + 1 === pts.length) return;
    const q = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 72));
    for (let k = 1; k < n; k++) post([p[0] + ((q[0] - p[0]) * k) / n, p[1] + ((q[1] - p[1]) * k) / n, p[2]]);
    for (const h of [41, 20.5]) b.add('guardrail HSS2x1/8, 42 in (SW-HR-1)', 'safety', member([p[0], p[1], p[2] + h], [q[0], q[1], q[2] + h], RING));
    if (toe) b.add('toe plate PL1/4x4', 'steel', member(p, q, { outer: rect(-0.125, 0, 0.125, 4) }, [0, 0, 1]));
  });
}
/** SW-GR-1: grating with its top at zTop; bearing bars run along `along` */
function grate(b: Bag, x0: number, x1: number, y0: number, y1: number, zTop: number, along: 'x' | 'y') {
  const parts: MeshData[] = [];
  if (along === 'y') { for (let x = x0 + 0.75; x < x1; x += 1.5) parts.push(boxMesh(x - 3 / 32, y0, zTop - 1.5, x + 3 / 32, y1, zTop)); for (let y = y0 + 2; y < y1; y += 4) parts.push(boxMesh(x0, y - 0.125, zTop - 0.25, x1, y + 0.125, zTop)); }
  else { for (let y = y0 + 0.75; y < y1; y += 1.5) parts.push(boxMesh(x0, y - 3 / 32, zTop - 1.5, x1, y + 3 / 32, zTop)); for (let x = x0 + 2; x < x1; x += 4) parts.push(boxMesh(x - 0.125, y0, zTop - 0.25, x + 0.125, y1, zTop)); }
  b.add('grating (SW-GR-1)', 'galv', ...parts);
}
/** crossed rod bracing RD3/4 in the panel a–b–c–d (a to c and b to d) */
const rodX = (b: Bag, p: V3, q: V3, r: V3, s: V3) => b.add('rod bracing RD3/4', 'hardware', sweep([p, r], 0.375, 8), sweep([q, s], 0.375, 8));

// ---- SW-STA-7 (SW-LD-1..3): fixed ladder; local frame: the face it climbs is x = 0, the rungs at x = 7, z from 0 to the landing --------
export function ladderParts(climb: number, bracketAt: number[]): Solid[] {
  const b = bag(), top = climb + 42, bar: Profile = { outer: rect(-0.25, -1.25, 0.25, 1.25) }, a = Math.PI - Math.asin(9 / 15), cx = 7 + Math.sqrt(15 * 15 - 81);
  for (const s of [-1, 1]) b.add('ladder rails PL1/2x2-1/2 (SW-LD-1)', 'safety', boxMesh(5.75, s * 9.25 - 0.25, 0, 8.25, s * 9.25 + 0.25, climb), member([7, s * 9.25, climb], [7, s * 12.25, climb + 12], bar, [1, 0, 0]), boxMesh(5.75, s * 12.25 - 0.25, climb + 12, 8.25, s * 12.25 + 0.25, top));
  for (let z = 12; z <= climb + 0.01; z += 12) b.add('ladder rungs RD3/4 at 12 in', 'safety', sweep([[7, -9.25, z], [7, 9.25, z]], 0.375, 8));
  for (const z of bracketAt) for (const s of [-1, 1]) b.add('ladder brackets L3x3x1/4 (SW-LD-2)', 'safety', member([0, s * 9.5, z], [5.75, s * 9.5, z], P_L3, [0, 0, 1]));
  if (climb > 240) {
    for (let z = 84; z <= top; z += 48) b.add('cage hoops PL1/4x2 (SW-LD-3)', 'safety', at(extrude({ outer: annularSector(15, 15.25, -a, a, 32) }, 2, 0), cx, 0, Math.min(z, top - 2)));
    for (const k of [-0.8, -0.4, 0, 0.4, 0.8]) b.add('cage straps PL3/16x1-1/2 (SW-LD-3)', 'safety', transformMesh(boxMesh(15.25, -0.75, 84, 15.4375, 0.75, top), multiply(translate(cx, 0, 0), rotateZ(k * a))));
  }
  return b.solids();
}
/** bracket heights at 8 ft at most between 12 in above the base and 6 in below the landing */
const bracketsFor = (climb: number) => { const n = Math.max(1, Math.ceil((climb - 18) / 96)); return Array.from({ length: n + 1 }, (_, i) => 12 + ((climb - 18) * i) / n); };
export function makeFixedLadder(id: string, climb: number): PartSpec {
  return structure(id, `Fixed ladder, ${(climb / 12).toFixed(0)} ft climb${climb > 240 ? ', caged' : ''}`, { climb: drawing(climb, 'Climb to the landing'), clear: rule(18, 'SW-LD-1', 'Clear between rails'), rung: rule(12, 'SW-LD-1', 'Rung spacing'), standoff: rule(7, 'SW-LD-2', 'Rung centreline off the face'), above: rule(42, 'SW-LD-1', 'Rails above the landing'), cage: rule(climb > 240 ? 30 : 0, 'SW-LD-3', 'Cage diameter (0 = none; caged above 20 ft)') }, climb + 42, ladderParts(climb, bracketsFor(climb)), ['The structure the ladder climbs is not drawn (SW-STA-7).']);
}

// ---- SW-STA-4 (SW-SR-1..5): stair flight; local frame: travel +x from the first riser at x = 0, centred on y, z up from the lower floor ----
export interface Flight { solids: Solid[]; risers: number; rise: number; Lx: number; stringer: string; D: number; outer: number }
export function stairFlight(h: number): Flight {
  const n = Math.round(h / 7.5), rise = h / n, Lx = (n - 1) * 10, th = Math.atan2(rise, 10), ca = Math.cos(th), sa = Math.sin(th), D = depth(Math.hypot(Lx + 10, h), 16, 10);
  let w = 10; for (let k = Math.ceil(weightPerFootFromArea(0.04 * D * D)); k < 200; k++) if (proportionC(D, k).tw >= 0.25) { w = k; break; }
  const cd = proportionC(D, w), off = D / 2 - 1, q0: [number, number] = [off * sa, rise - off * ca], sA = -q0[1] / sa, sB = (Lx - q0[0]) / ca, L = sB - sA, b = bag();
  const a: V3 = [q0[0] + sA * ca, 0, 0], cuts = { start: { dx: 0, dy: -ca / sa }, end: { dx: 0, dy: sa / ca } }, prof = cProfile(cd);
  for (const s of [-1, 1]) b.add(`stringers C${D}x${w} (SW-SR-2)`, 'steel', orient(transformMesh(extrude({ outer: s > 0 ? prof : prof.map(p => ({ x: -p.x, y: p.y })).reverse() }, L, 0, cuts), frameFromAxes([a[0], s * 18, 0], [-sa, 0, ca], [ca, 0, sa]))));
  for (let k = 1; k < n; k++) {
    const x0 = (k - 1) * 10, z = k * rise;
    for (let j = 0; j < 6; j++) b.add('grating treads 36 x 10 (SW-GR-3)', 'galv', boxMesh(x0 + 1.5 + j * 1.5, -17.8, z - 1.5, x0 + 1.6875 + j * 1.5, 17.8, z));
    for (let y = -16; y <= 16; y += 4) b.add('grating treads 36 x 10 (SW-GR-3)', 'galv', boxMesh(x0 + 1.25, y - 0.125, z - 0.25, x0 + 10, y + 0.125, z));
    b.add('tread nosings and carrier plates', 'steel', boxMesh(x0, -17.8, z - 0.1875, x0 + 1.25, 17.8, z), boxMesh(x0, -17.8, z - 1.25, x0 + 0.1875, 17.8, z), boxMesh(x0, -18, z - 2, x0 + 10, -17.8125, z), boxMesh(x0, 17.8125, z - 2, x0 + 10, 18, z));
  }
  const yr = 18 + cd.bf / 2, nb = Math.max(1, Math.ceil(Math.hypot(Lx, h - rise) / 72)), nz = (x: number) => rise + (x * rise) / 10;
  for (const s of [-1, 1]) {
    for (let i = 0; i <= nb; i++) { const x = (Lx * i) / nb; b.add('stair rails HSS2x1/8, 36 in above the nosings (SW-SR-4)', 'safety', at(extrude(RING, 35, 0), x, s * yr, nz(x))); }
    for (const hgt of [35, 17.5]) b.add('stair rails HSS2x1/8, 36 in above the nosings (SW-SR-4)', 'safety', member([0, s * yr, nz(0) + hgt], [Lx, s * yr, nz(Lx) + hgt], RING));
  }
  return { solids: b.solids(), risers: n, rise, Lx, stringer: `C${D}x${w}`, D, outer: 18 + cd.bf };
}
const flightDims = (f: Flight, h: number) => ({ height: drawing(h, 'Height of a flight'), risers: rule(f.risers, 'SW-STA-4', 'Risers (round(height / 7.5))', 'count'), rise: rule(f.rise, 'SW-STA-4', 'Rise'), run: rule(10, 'SW-SR-1', 'Run'), width: rule(36, 'SW-SR-1', 'Clear width'), stringerD: rule(f.D, 'SW-SR-2', 'Stringer depth (slope length / 16, 10 in least)') });
export function makeStairFlight(id: string, h: number): PartSpec {
  if (h > 144) throw new Error('SW-SR-3: a flight rises 12 ft at most');
  const f = stairFlight(h);
  return structure(id, `Stair flight, ${(h / 12).toFixed(0)} ft rise, stringers ${f.stringer}`, flightDims(f, h), f.Lx + 10, f.solids);
}

// ---- SW-STA-5: stair tower; local frame: x along the flights from the entry end, centred on y -----------------------------------------
export interface Tower { solids: Solid[]; T: number; Wt: number; Yc: number; hf: number; flights: number; f: Flight; column: Sec; frame: Sec }
/** exit 'end': off the top landing's short edge; 'y+': off every landing's +y edge, the landing reaching `reach` further that way */
export function stairTower(h: number, exit: 'end' | 'y+' = 'end', reach = 0): Tower {
  const flights = Math.max(2, Math.ceil(h / 144)), hf = h / flights, f = stairFlight(hf), lane = f.outer + 2, Wt = 2 * (2 * f.outer) + 4, T = 84 + f.Lx, cs = sec(depth(h, 36, 6)), fr = sec(6), Yc = Wt / 2 + cs.dims.bf / 2 + 1, b = bag();
  for (const x of [0, T]) for (const y of [-Yc, Yc]) { const z0 = base(b, x, y, cs, 'x'); b.add(`columns ${cs.name}`, 'steel', col(x, y, z0, h - 1.5, cs, 'x')); }
  for (let i = 0; i < flights; i++) {
    const even = i % 2 === 0, z = (i + 1) * hf, top = i === flights - 1;
    b.merge(f.solids, even ? translate(42, -lane, i * hf) : multiply(translate(42 + f.Lx, lane, i * hf), rotateZ(Math.PI)));
    const x0 = even ? T - 42 : 0, x1 = x0 + 42, xo = even ? T : 0, xi = even ? T - 42 : 42, yMax = Wt / 2 + (exit === 'y+' ? reach : 0);
    grate(b, x0, x1, -Wt / 2, Wt / 2, z, 'x');
    if (exit === 'y+' && reach > 0) { const e0 = even ? x0 : cs.dims.d / 2 + 1, e1 = even ? x1 - cs.dims.d / 2 - 1 : x1; grate(b, e0, e1, Wt / 2, yMax, z, 'x'); for (const xe of [e0, e1]) railPath(b, [[xe, Wt / 2, z], [xe, yMax, z]]); }
    b.add(`landing frames and long-face ties ${fr.name}`, 'steel', beam([xo, -Yc], [xo, Yc], z - 1.5, fr), beam([xi, -Yc], [xi, Yc], z - 1.5, fr), beam([0, -Yc], [T, -Yc], z - 1.5, fr), beam([0, Yc], [T, Yc], z - 1.5, fr));
    // guardrail: the outer short edge, the two sides, and the inner edge where no flight meets the landing
    const arrive = even ? -1 : 1, lo = (s: number) => (s < 0 ? -Wt / 2 : 2), hi = (s: number) => (s < 0 ? -2 : Wt / 2), open = exit === 'end' && top ? -arrive : 0;
    if (open === 0) railPath(b, [[xo, -Wt / 2, z], [xo, Wt / 2, z]]); else railPath(b, [[xo, lo(arrive), z], [xo, hi(arrive), z]]);
    railPath(b, [[xi, -Wt / 2, z], [xo, -Wt / 2, z]]); if (exit !== 'y+') railPath(b, [[xi, Wt / 2, z], [xo, Wt / 2, z]]);
    if (top) railPath(b, [[xi, lo(-arrive), z], [xi, hi(-arrive), z]]);
    for (const y of [-Yc, Yc]) rodX(b, [0, y, i * hf + (i ? 0 : 9)], [T, y, i * hf + (i ? 0 : 9)], [T, y, z - 8], [0, y, z - 8]);
  }
  return { solids: b.solids(), T, Wt, Yc, hf, flights, f, column: cs, frame: fr };
}
export function makeStairTower(id: string, h: number): PartSpec {
  const t = stairTower(h);
  return structure(id, `Stair tower, ${(h / 12).toFixed(0)} ft, ${t.flights} flights, columns ${t.column.name}, stringers ${t.f.stringer}`, { ...flightDims(t.f, t.hf), heightAll: drawing(h, 'Height to the top landing'), flights: rule(t.flights, 'SW-STA-5', 'Flights (12 ft rise at most each)', 'count'), landing: rule(42, 'SW-STA-5', 'Landing length'), length: rule(t.T, 'SW-STA-5', 'Tower length'), widthAll: rule(t.Wt, 'SW-STA-5', 'Tower width over the stringers'), columnD: rule(t.column.D, 'SW-STA-5', 'Column depth (height / 36, 6 in least)') }, t.T, t.solids);
}

// ---- SW-STA-3: pipe rack module -------------------------------------------------------------------------------------------------------
export interface RackInput { width: number; tiers: number[]; bents?: number }
export function rackParts(inp: RackInput, x0 = 0): { solids: Solid[]; beam: Sec; column: Sec; strut: Sec } {
  const Wd = inp.width, H = Math.max(...inp.tiers), nb = inp.bents ?? 3, zb = zReq(40, 240, Wd), bm = sec(depth(Wd, 20, 6), zb), cs = sec(depth(H, 24, 6), zb / 2), st = sec(Math.max(6, bm.D - 4)), b = bag(), tiers = [...inp.tiers].sort((p, q) => p - q);
  let z0 = 0;
  for (let i = 0; i < nb; i++) {
    const x = x0 + i * 240;
    for (const y of [0, Wd]) { z0 = base(b, x, y, cs, 'y'); b.add(`columns ${cs.name} (SW-RK-2)`, 'steel', col(x, y, z0, H, cs, 'y')); }
    for (const e of tiers) b.add(`tier beams ${bm.name} (SW-RK-2)`, 'steel', beam([x, cs.dims.d / 2], [x, Wd - cs.dims.d / 2], e, bm));
    if (i + 1 < nb) for (const e of tiers) for (const y of [0, Wd]) b.add(`struts ${st.name} (SW-RK-3)`, 'steel', beam([x + cs.dims.tw / 2, y], [x + 240 - cs.dims.tw / 2, y], e, st));
  }
  if (nb > 1) {
    let lo = z0 + 3;
    for (const e of tiers) { for (const y of [0, Wd]) rodX(b, [x0, y, lo], [x0 + 240, y, lo], [x0 + 240, y, e - st.dims.d - 2], [x0, y, e - st.dims.d - 2]); lo = e + 2; }
    rodX(b, [x0, 0, H - bm.dims.d - 2], [x0 + 240, 0, H - bm.dims.d - 2], [x0 + 240, Wd, H - bm.dims.d - 2], [x0, Wd, H - bm.dims.d - 2]);
  }
  return { solids: b.solids(), beam: bm, column: cs, strut: st };
}
export function makePipeRack(id: string, inp: RackInput): PartSpec {
  const r = rackParts(inp), nb = inp.bents ?? 3, H = Math.max(...inp.tiers);
  return structure(id, `Pipe rack module ${(inp.width / 12).toFixed(0)} ft wide, ${inp.tiers.length} tiers, ${nb} bents: columns ${r.column.name}, beams ${r.beam.name}, struts ${r.strut.name}`, {
    width: drawing(inp.width, 'Rack width (column centres)'), top: drawing(H, 'Top tier elevation'), tiers: drawing(inp.tiers.length, 'Tiers', 'count'), bents: drawing(nb, 'Bents', 'count'), spacing: rule(240, 'SW-RK-1', 'Bent spacing'),
    beamD: rule(r.beam.D, 'SW-RK-2', 'Tier beam depth (width / 20)'), beamW: rule(r.beam.w, 'SW-PF-3', 'Tier beam weight for 40 psf', 'lb/ft'), columnD: rule(r.column.D, 'SW-RK-2', 'Column depth (height / 24)'), columnW: rule(r.column.w, 'SW-PF-3', 'Column weight for half the beam moment', 'lb/ft'), strutD: rule(r.strut.D, 'SW-RK-3', 'Strut depth (beam − 4, 6 in least)'),
  }, (nb - 1) * 240, r.solids);
}

// ---- SW-STA-6: free-standing operating platform with a ladder -------------------------------------------------------------------------
export interface PlatformInput { L: number; W: number; elevation: number }
export function makePlatform(id: string, inp: PlatformInput): PartSpec {
  const { L, W: Wd, elevation: E } = inp, nbay = Math.ceil(L / 240), sx = L / nbay, nfb = Math.ceil(L / 48), s = L / nfb, top = E - 1.5, b = bag();
  const fb = sec(depth(Wd, 20, 6), zReq(100, s, Wd)), gd = sec(Math.max(fb.D, depth(sx, 20, 6)), zReq(100, Wd / 2, sx)), cs = sec(depth(E, 36, 6));
  let z0 = 0;
  for (let i = 0; i <= nbay; i++) for (const y of [0, Wd]) { z0 = base(b, i * sx, y, cs, 'x'); b.add(`columns ${cs.name} (SW-PLT-3)`, 'steel', col(i * sx, y, z0, top - gd.dims.d, cs, 'x')); }
  for (const y of [0, Wd]) b.add(`edge girders ${gd.name} (SW-PLT-2)`, 'steel', beam([0, y], [L, y], top, gd));
  for (let j = 0; j <= nfb; j++) b.add(`floor beams ${fb.name} at ${s.toFixed(0)} in (SW-PLT-2)`, 'steel', beam([j * s, gd.dims.tw / 2], [j * s, Wd - gd.dims.tw / 2], top, fb));
  grate(b, -gd.dims.bf / 2 + 0.5, L + gd.dims.bf / 2 - 0.5, -gd.dims.bf / 2 + 0.5, Wd + gd.dims.bf / 2 - 0.5, E, 'x');
  const e = gd.dims.bf / 2 - 1, zt = top - gd.dims.d - 2;
  railPath(b, [[L + e, Wd / 2 + 12, E], [L + e, Wd + e, E], [-e, Wd + e, E], [-e, -e, E], [L + e, -e, E], [L + e, Wd / 2 - 12, E]]);
  for (const y of [0, Wd]) rodX(b, [0, y, z0 + 3], [sx, y, z0 + 3], [sx, y, zt], [0, y, zt]);
  rodX(b, [0, 0, z0 + 3], [0, Wd, z0 + 3], [0, Wd, zt], [0, 0, zt]);
  b.merge(ladderParts(E, [E - 4]), translate(L + gd.dims.bf / 2, Wd / 2, 0));
  return structure(id, `Operating platform ${(L / 12).toFixed(0)} ft × ${(Wd / 12).toFixed(0)} ft at ${(E / 12).toFixed(0)} ft: columns ${cs.name}, girders ${gd.name}, floor beams ${fb.name}`, {
    L: drawing(L, 'Length'), W: drawing(Wd, 'Width'), elevation: drawing(E, 'Walking surface elevation (top of grating)'), beamSpacing: rule(s, 'SW-PLT-2', 'Floor beam spacing (4 ft at most)'), beamD: rule(fb.D, 'SW-PLT-2', 'Floor beam depth (span / 20, 6 in least)'), beamW: rule(fb.w, 'SW-PF-3', 'Floor beam weight for 100 psf', 'lb/ft'),
    girderD: rule(gd.D, 'SW-PLT-2', 'Edge girder depth'), columnD: rule(cs.D, 'SW-PLT-3', 'Column depth (height / 36, 6 in least)'), rail: rule(42, 'SW-HR-1', 'Guardrail height'), opening: rule(24, 'SW-STA-6', 'Ladder opening in the guardrail'),
  }, L, b.solids());
}

// ---- SW-STA-8: pipe bridge ------------------------------------------------------------------------------------------------------------
export interface BridgeInput { span: number; width: number; depth: number; clear: number }
export function makePipeBridge(id: string, inp: BridgeInput): PartSpec {
  const { span: S, width: Wd, depth: Dp, clear: Hc } = inp, np = Math.max(2, Math.round(S / Dp)), p = S / np, b = bag();
  const wk = (40 * Wd) / 12 / 1000 / 12, F = (wk * S * S) / 8 / Dp, Areq = F / (0.9 * FY), light = sec(8), cw = Math.max(light.w, roundUpTo(Math.ceil(weightPerFootFromArea(Areq)), 5)), ch: Sec = { D: 8, w: cw, dims: proportionW(8, cw), name: `W8x${cw}` };
  const zb0 = zReq(40, 240, Wd), bent = sec(depth(Wd, 20, 6), zb0), fb = sec(depth(Wd, 20, 6), zReq(40, p, Wd)), zB = Hc + bent.dims.d + ch.dims.d / 2, zT = zB + Dp, cs = sec(depth(Hc + bent.dims.d, 24, 6), zb0 / 2);
  for (const x of [0, S]) { for (const y of [0, Wd]) { const z0 = base(b, x, y, cs, 'y'); b.add(`bent columns ${cs.name}`, 'steel', col(x, y, z0, Hc + bent.dims.d, cs, 'y')); } b.add(`bent beams ${bent.name}`, 'steel', beam([x, cs.dims.d / 2], [x, Wd - cs.dims.d / 2], Hc + bent.dims.d, bent)); }
  for (const y of [0, Wd]) {
    b.add(`chords ${ch.name}`, 'steel', member([0, y, zB], [S, y, zB], wp(ch), [0, 0, 1]), member([0, y, zT], [S, y, zT], wp(ch), [0, 0, 1]));
    const lo = zB + ch.dims.d / 2, hi = zT - ch.dims.d / 2, yo = y;
    for (let i = 0; i <= np; i++) b.add('verticals and diagonals L4x4x3/8', 'steel', member([i * p, yo, lo], [i * p, yo, hi], P_L4, [1, 0, 0]));
    for (let i = 0; i < np; i++) { const down = i < np / 2; b.add('verticals and diagonals L4x4x3/8', 'steel', member([i * p, yo, down ? hi : lo], [(i + 1) * p, yo, down ? lo : hi], P_L4, [0, 0, 1])); }
  }
  for (let i = 0; i <= np; i++) for (const z of [zB + ch.dims.d / 2, zT + ch.dims.d / 2]) b.add(`floor beams ${fb.name} at the panel points`, 'steel', beam([i * p, ch.dims.tw / 2], [i * p, Wd - ch.dims.tw / 2], z, fb));
  for (let i = 0; i < np; i++) rodX(b, [i * p, 0, zT], [(i + 1) * p, 0, zT], [(i + 1) * p, Wd, zT], [i * p, Wd, zT]);
  return structure(id, `Pipe bridge ${(S / 12).toFixed(0)} ft span × ${(Wd / 12).toFixed(0)} ft wide × ${(Dp / 12).toFixed(0)} ft deep, ${np} panels: chords ${ch.name}, floor beams ${fb.name}, bents ${cs.name} / ${bent.name}`, {
    span: drawing(S, 'Span'), width: drawing(Wd, 'Width (truss centres)'), depth: drawing(Dp, 'Truss depth (chord centres)'), clear: drawing(Hc, 'Clear height under the bents'), panels: rule(np, 'SW-STA-8', 'Panels (round(span / depth))', 'count'), panel: rule(p, 'SW-STA-8', 'Panel length'),
    chordForce: rule(F, 'SW-STA-8', 'Chord force (w L² / 8 / depth)', 'kip'), chordW: rule(cw, 'SW-STA-8', 'Chord weight (W8, area ≥ F / 0.9 Fy)', 'lb/ft'), floorD: rule(fb.D, 'SW-RK-2', 'Floor beam depth (width / 20)'), columnD: rule(cs.D, 'SW-RK-2', 'Bent column depth'),
  }, S, b.solids());
}

// ---- SW-STA-9: fireproofed column -----------------------------------------------------------------------------------------------------
export function makeFireproofedColumn(id: string, D: number, w: number, height: number, cased: number): PartSpec {
  const s: Sec = { D, w, dims: proportionW(D, w), name: `W${D}x${w}` }, b = bag(), z0 = base(b, 0, 0, s, 'y'), hx = s.dims.bf / 2 + 2, hy = s.dims.d / 2 + 2;
  b.add(`column ${s.name}`, 'steel', col(0, 0, z0, height, s, 'y'));
  const casing = chamferedPrism(rect(-hx, -hy, hx, hy), z0, cased, 1);
  b.add('fireproofing casing (concrete, 2 in cover)', 'concrete', casing);
  return structure(id, `Fireproofed column ${s.name}, ${(height / 12).toFixed(0)} ft, cased to ${(cased / 12).toFixed(0)} ft`, {
    D: drawing(D, 'Column depth'), w: drawing(w, 'Column weight', 'lb/ft'), height: drawing(height, 'Column height'), cased: drawing(cased, 'Cased to'), cover: rule(2, 'SW-STA-9', 'Cover over the flange faces and tips'), slope: rule(1, 'SW-STA-9', 'Top slope'),
    casingWeight: rule((signedVolume(casing) - (s.dims.A * (cased - z0))) * K.CONCRETE_DENSITY_LB_IN3, 'SW-STA-9', 'Casing concrete weight (K-7)', 'lb'),
  }, height, b.solids());
}

// ---- SW-STA-10: T-support and goal post -----------------------------------------------------------------------------------------------
export function makeTSupport(id: string, height: number, beamL: number): PartSpec {
  const s = sec(depth(height, 20, 6)), b = bag(), z0 = base(b, 0, 0, s, 'y'), d = s.dims.d, arm = (beamL - d) / 2;
  b.add(`post ${s.name}`, 'steel', col(0, 0, z0, height - d, s, 'y')); b.add(`cross beam ${s.name}`, 'steel', beam([0, -beamL / 2], [0, beamL / 2], height, s));
  if (arm > 24) for (const sg of [-1, 1]) b.add('knee braces L3x3x1/4', 'steel', member([0, sg * d / 2, height - d - 0.6 * arm], [0, sg * (d / 2 + 0.6 * arm), height - d], P_L3, [1, 0, 0]));
  return structure(id, `T-support ${(height / 12).toFixed(0)} ft high, beam ${(beamL / 12).toFixed(0)} ft, ${s.name}${arm > 24 ? ' with knee braces' : ''}`, { height: drawing(height, 'Top of steel'), beam: drawing(beamL, 'Beam length'), D: rule(s.D, 'SW-STA-10', 'Section depth (height / 20, 6 in least)'), arm: rule(arm, 'SW-STA-10', 'Arm beyond the post'), brace: rule(arm > 24 ? 0.6 * arm : 0, 'SW-STA-10', 'Knee brace reach (arms over 24 in)') }, beamL, b.solids());
}
export function makeGoalPost(id: string, height: number, span: number): PartSpec {
  const s = sec(depth(height, 20, 6)), b = bag(), d = s.dims.d;
  for (const y of [0, span]) { const z0 = base(b, 0, y, s, 'y'); b.add(`posts ${s.name}`, 'steel', col(0, y, z0, height - d, s, 'y')); }
  b.add(`beam ${s.name}`, 'steel', beam([0, -d / 2], [0, span + d / 2], height, s));
  return structure(id, `Goal post ${(height / 12).toFixed(0)} ft high × ${(span / 12).toFixed(0)} ft span, ${s.name}`, { height: drawing(height, 'Top of steel'), span: drawing(span, 'Span (post centres)'), D: rule(s.D, 'SW-STA-10', 'Section depth (height / 20, 6 in least)') }, span, b.solids());
}

// ---- SW-STA-11: monorail with a trolley hoist -----------------------------------------------------------------------------------------
export interface MonorailInput { span: number; width: number; hookBeam: number; tons: number }
export function makeMonorail(id: string, inp: MonorailInput): PartSpec {
  const { span: S, width: Wb, hookBeam: H, tons } = inp, P = tons * 2, mr = sec(depth(S, 15, 8), (1.25 * P * S) / 4 / (0.9 * FY)), cb = sec(depth(Wb, 20, 6), (1.25 * P * Wb) / 4 / (0.9 * FY)), zc = H + mr.dims.d + cb.dims.d, cs = sec(depth(zc, 36, 6)), b = bag(), yc = Wb / 2;
  let z0 = 0;
  for (const x of [0, S]) {
    for (const y of [0, Wb]) { z0 = base(b, x, y, cs, 'y'); b.add(`columns ${cs.name}`, 'steel', col(x, y, z0, zc, cs, 'y')); }
    b.add(`cross beams ${cb.name}`, 'steel', beam([x, cs.dims.d / 2], [x, Wb - cs.dims.d / 2], zc, cb));
    for (const sg of [-1, 1]) { const yf = sg < 0 ? cs.dims.d / 2 : Wb - cs.dims.d / 2; b.add('knee braces L3x3x1/4', 'steel', member([x, yf, zc - cb.dims.d - 24], [x, yf - sg * 24, zc - cb.dims.d], P_L3, [1, 0, 0])); }
  }
  for (const y of [0, Wb]) rodX(b, [0, y, z0 + 3], [S, y, z0 + 3], [S, y, zc - 6], [0, y, zc - 6]);
  b.add(`monorail beam ${mr.name}`, 'steel', beam([-24, yc], [S + 24, yc], H + mr.dims.d, mr));
  for (const x of [-22, S + 18]) for (const sg of [-1, 1]) b.add('end stops L4x4x3/8', 'steel', member([x, yc + sg * mr.dims.tw / 2, H + mr.dims.tf], [x, yc + sg * mr.dims.bf / 2, H + mr.dims.tf], P_L4, [0, 0, 1]));
  // trolley hoist envelope at mid-span
  const xm = S / 2, bf = mr.dims.bf, tf = mr.dims.tf, wheelR = 2.25;
  for (const sg of [-1, 1]) {
    b.add('trolley side plates and hoist body', 'machine', boxMesh(xm - 7, yc + sg * (bf / 2 + 0.75) - 0.25, H - 5, xm + 7, yc + sg * (bf / 2 + 0.75) + 0.25, H + tf + 2 * wheelR + 1));
    for (const dx of [-4, 4]) b.add('trolley wheels', 'hardware', transformMesh(cylZ(0, 0, wheelR, 0, 1.25, 20), multiply(translate(xm + dx, yc + sg * (bf / 2 + 0.5), H + tf + wheelR), [1, 0, 0, 0, 0, 0, -sg, 0, 0, sg, 0, 0, 0, 0, 0, 1])));
  }
  b.add('trolley side plates and hoist body', 'machine', boxMesh(xm - 9, yc - 6, H - 17, xm + 9, yc + 6, H - 5), boxMesh(xm - 7, yc - bf / 2 - 1, H - 5.5, xm + 7, yc + bf / 2 + 1, H - 4.5));
  b.add('load chain and hook', 'hardware', sweep([[xm, yc, H - 17], [xm, yc, H - 60]], 0.3, 8), sweep([[xm, yc, H - 60], [xm + 1.5, yc, H - 63], [xm + 2.5, yc, H - 66], [xm + 1.5, yc, H - 69], [xm - 1, yc, H - 69.5], [xm - 2.5, yc, H - 67]], 0.6, 8));
  return structure(id, `Monorail ${tons} ton, ${(S / 12).toFixed(0)} ft span: beam ${mr.name}, cross beams ${cb.name}, columns ${cs.name}`, {
    span: drawing(S, 'Span between bents'), width: drawing(Wb, 'Bent width'), hookBeam: drawing(H, 'Underside of the monorail beam'), capacity: drawing(P, 'Capacity', 'kip'), D: rule(mr.D, 'SW-STA-11', 'Monorail depth (span / 15, 8 in least)'), w: rule(mr.w, 'SW-PF-3', 'Monorail weight for 1.25 P L / 4', 'lb/ft'),
    crossD: rule(cb.D, 'SW-STA-11', 'Cross beam depth (width / 20, 6 in least)'), overrun: rule(24, 'SW-STA-11', 'Beam past each bent'), columnD: rule(cs.D, 'SW-PLT-3', 'Column depth (height / 36, 6 in least)'),
  }, S + 48, b.solids(), ['The trolley hoist is an envelope (SW-STA-11).']);
}

// ---- SW-STA-12: open process structure with a stair tower ------------------------------------------------------------------------------
export interface ProcessStructureInput { L: number; W: number; floors: number[]; floorPsf?: number }
export function makeProcessStructure(id: string, inp: ProcessStructureInput): PartSpec {
  const { L, W: Wd } = inp, floors = [...inp.floors].sort((p, q) => p - q), H = floors[floors.length - 1], nx = Math.ceil(L / 240), sx = L / nx, nfb = Math.ceil(Wd / 48), sy = Wd / nfb, b = bag();
  const psfV = inp.floorPsf ?? 250, psf: Dim = inp.floorPsf !== undefined ? drawing(psfV / 1000, 'Floor load', 'ksf') : rule(psfV / 1000, 'SW-STA-12', 'Floor load (default for a process floor)', 'ksf'), Pcol = (psfV * (sx / 12) * (Wd / 24) * floors.length) / 1000;
  const cs = colSec(depth(H, 36, 8), Pcol), gd = sec(depth(Wd, 20, 6), zReq(psfV, sx, Wd)), fb = sec(depth(sx, 20, 6), zReq(psfV, sy, sx));
  const hf = floors[0], tw = stairTower(H, 'y+', 12), xo = (L - tw.T) / 2 + 12, yt = -(tw.Wt / 2 + 12);
  if (floors.some((f, i) => Math.abs(f - (i + 1) * hf) > 0.01) || hf > 144) throw new Error('SW-STA-12: floors are equally spaced, 12 ft apart at most, so each is a stair landing');
  let z0 = 0;
  for (let i = 0; i <= nx; i++) for (const y of [0, Wd]) { z0 = base(b, i * sx, y, cs, 'y'); b.add(`columns ${cs.name}`, 'steel', col(i * sx, y, z0, H - 1.5, cs, 'y')); }
  floors.forEach((E, k) => {
    const top = E - 1.5, e = 2;
    for (let i = 0; i <= nx; i++) b.add(`girders ${gd.name} (across, on the column lines)`, 'steel', beam([i * sx, cs.dims.d / 2], [i * sx, Wd - cs.dims.d / 2], top, gd));
    for (let i = 0; i < nx; i++) for (let j = 0; j <= nfb; j++) b.add(`floor beams ${fb.name} at ${sy.toFixed(0)} in`, 'steel', beam([i * sx + gd.dims.tw / 2, j * sy], [(i + 1) * sx - gd.dims.tw / 2, j * sy], top, fb));
    grate(b, -e, L + e, -e, Wd + e, E, 'y');
    // guardrail round the floor, open where the stair landing meets the −y edge
    const even = k % 2 === 0, a0 = xo + (even ? tw.T - 42 : 0), a1 = a0 + 42;
    railPath(b, [[a1, -e, E], [L + e, -e, E], [L + e, Wd + e, E], [-e, Wd + e, E], [-e, -e, E], [a0, -e, E]]);
    const lo = k ? floors[k - 1] + 2 : z0 + 3, hi = top - gd.dims.d - 2;
    for (const y of [0, Wd]) rodX(b, [0, y, lo], [sx, y, lo], [sx, y, hi], [0, y, hi]);
    rodX(b, [L, 0, lo], [L, Wd, lo], [L, Wd, hi], [L, 0, hi]);
  });
  b.merge(tw.solids.map(s => ({ ...s, name: `stair tower: ${s.name}` })), translate(xo, yt, 0));
  return structure(id, `Open process structure ${(L / 12).toFixed(0)} ft × ${(Wd / 12).toFixed(0)} ft, floors at ${floors.map(f => (f / 12).toFixed(0)).join(' and ')} ft, with stair tower: columns ${cs.name}, girders ${gd.name}, floor beams ${fb.name}`, {
    L: drawing(L, 'Length'), W: drawing(Wd, 'Width'), top: drawing(H, 'Top floor elevation'), floors: drawing(floors.length, 'Floors', 'count'), floorLoad: psf, grid: rule(sx, 'SW-STA-12', 'Column spacing along the length (20 ft at most)'), columnD: rule(cs.D, 'SW-STA-12', 'Column depth (height / 36, 8 in least)'), columnLoad: rule(Pcol, 'SW-STA-1', 'Interior column floor load', 'kip'), columnW: rule(cs.w, 'SW-STA-1', 'Column weight (area ≥ P / 0.45 Fy)', 'lb/ft'),
    girderD: rule(gd.D, 'SW-STA-12', 'Girder depth (span / 20)'), girderW: rule(gd.w, 'SW-PF-3', 'Girder weight for the floor load', 'lb/ft'), beamSpacing: rule(sy, 'SW-PLT-2', 'Floor beam spacing (4 ft at most)'), beamD: rule(fb.D, 'SW-PLT-2', 'Floor beam depth (span / 20, 6 in least)'), flights: rule(tw.flights, 'SW-STA-5', 'Stair flights', 'count'),
  }, L, b.solids());
}
