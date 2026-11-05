/**
 * Interior kit: the shared builders of every plant's interior (guardrails, platforms, free-standing columns, stair flights,
 * ladders, the pipe rack and the vessel platform annulus), DESIGN_BASIS.md sections 19–27. Extracted unchanged from the
 * stage-3 interior generator so that plant 2 (stage 9) builds from the same rules; plant 1's output is identical.
 */
import { rule, type Dim } from '../core/basis';
import { roundUpTo } from '../core/units';
import { weightPerFootFromArea } from '../core/constants';
import {
  makeWideFlange, proportionW, proportionC, makeChannel, makeBasePlate, makeAnchorRod, makePlate, makeBolt, boltLengthForGrip,
  makeFilletWeld, makeFilletWeldAround, makeHssRound, makeRod, makeAngle, makeGrating, makeTread, makeCageHoop, CAGE, GRATING,
  DEFAULT_MATERIAL, type PartSpec, type Material, type Cut,
} from '../catalogue';
import { wProfile } from '../geometry/profiles';
import { frameFromAxes, multiply, translate, standUp, type Vec3 } from '../geometry/transform';
import type { Mat4 } from '../geometry/mesh';
import type { Placed } from './building';
import { sizeW } from './building';
import { nonSteel } from './nonSteel';

const BOLT_GRADE: Material = { grade: 'Grade 90 bolt', Fy: { value: 90, unit: 'ksi', basis: { kind: 'drawing' }, label: 'Bolt tensile strength (grade stated on drawing)' } };
const G36 = DEFAULT_MATERIAL;
const add3 = (a: Vec3, b: Vec3, k = 1): Vec3 => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];
const dist = (a: Vec3, b: Vec3) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);

export interface RackLayout { x0: number; x1: number; bentSpacing: number; halfWidth: number; tiers: readonly number[]; loadPsf: number }
export interface KitLayout { pedestal: number; padHeight: number }

export function interiorKit(lay: KitLayout, out: Placed[], derived: Record<string, Dim>) {
  const memo = new Map<string, PartSpec>();
  const part = <T extends PartSpec>(key: string, make: () => T): T => { let p = memo.get(key) as T | undefined; if (!p) { p = make(); memo.set(key, p); } return p; };
  const add = (p: PartSpec, transform: Mat4, ...tags: string[]) => out.push({ part: p, transform, tags });
  const g = GRATING, barDepth = g.barDepth;
  // ---- shared small parts --------------------------------------------------------------------------
  const railHss = (L: number) => part(`rail:${L.toFixed(2)}`, () => makeHssRound('HR', 2, 0.125, L));      // SW-HR-2
  const toePlate = (L: number) => part(`toe:${L.toFixed(2)}`, () => makePlate('TP', 0.25, 4, L));          // SW-HR-1
  const postPlate = part('pp', () => makePlate('HRP', 0.375, 5, 5));                                       // SW-HR-3
  const postBolt = part('pb', () => makeBolt('HRB', 0.5, boltLengthForGrip(0.5, 0.375 + 0.3), 0.375 + 0.3));
  const railWeld = part('rw', () => makeFilletWeld('HRW', 2 * Math.PI, { tThin: 0.125 }));
  const concrete = (name: string, w: number, h: number, L: number) => part(`conc:${name}:${w}:${h}:${L}`, () => nonSteel(name, 'CONCRETE', name, { w, t: h }, L));

  /** W beam placed from a to b with local y = up (horizontal beams) */
  const wBeam = (D: number, w: number, a: Vec3, b: Vec3, tag: string, yDir: Vec3 = [0, 1, 0]) => {
    const L = dist(a, b);
    const p = part(`W${D}x${w}:${L.toFixed(2)}`, () => makeWideFlange(`W${D}x${w}`, D, w, L));
    add(p, frameFromAxes(a, yDir, [(b[0] - a[0]) / L, (b[1] - a[1]) / L, (b[2] - a[2]) / L]), tag);
    return p;
  };
  const lightestW = (D: number) => roundUpTo(Math.ceil(weightPerFootFromArea(0.045 * D * D)), 5);

  // ---- guardrail (SW-HR-*) along a polyline of edge points at walking elevation; `centre` says which side is inside ----
  const guardrail = (pts: Vec3[], centre: [number, number], tag: string, closed = false) => {
    const n = closed ? pts.length : pts.length - 1;
    const postH = 42 + barDepth - 0.375 - 1;                                   // base plate on the beam flange below the grating, rail centre at 42 in
    for (let k = 0; k < n; k++) {
      const a = pts[k], b = pts[(k + 1) % pts.length];
      const L = dist(a, b); if (L < 1) continue;
      const dir: Vec3 = [(b[0] - a[0]) / L, 0, (b[2] - a[2]) / L];
      let outv: [number, number] = [dir[2], -dir[0]];                           // perpendicular in plan
      const mid: [number, number] = [(a[0] + b[0]) / 2, (a[2] + b[2]) / 2];
      if ((mid[0] - centre[0]) * outv[0] + (mid[1] - centre[1]) * outv[1] < 0) outv = [-outv[0], -outv[1]];
      // rails and toe plate along the edge
      const inset = 1.5;                                                        // rail centreline 1.5 in inside the edge (post diameter)
      const ra: Vec3 = [a[0] - outv[0] * inset, a[1], a[2] - outv[1] * inset], rb: Vec3 = [b[0] - outv[0] * inset, b[1], b[2] - outv[1] * inset];
      for (const hgt of [42, 21]) add(railHss(L), frameFromAxes([ra[0], ra[1] + hgt, ra[2]], [0, 1, 0], dir), tag, 'guardrail');
      add(toePlate(L), frameFromAxes([a[0] - outv[0] * 0.125, a[1] + 2, a[2] - outv[1] * 0.125], [outv[0], 0, outv[1]], dir), tag, 'guardrail');
      // posts at ≤ 6 ft (SW-HR-1), including the start of each edge (and the end of the last open edge)
      const nSp = Math.max(1, Math.ceil(L / 72));
      for (let i = 0; i <= nSp; i++) {
        if (i === nSp && (closed || k < n - 1)) continue;
        const p: Vec3 = add3(ra, dir, (L * i) / nSp);
        const base: Vec3 = [p[0], p[1] - barDepth, p[2]];
        add(postPlate, frameFromAxes([base[0] - 2.5, base[1] + 0.1875, base[2] + 2.5], [0, 1, 0], [1, 0, 0]), tag, 'guardrail');   // 5x5 plate, 3/8 thick, centred on the post (local x = −z)
        add(part(`post:${postH.toFixed(2)}`, () => makeHssRound('HRP', 2, 0.125, postH)), frameFromAxes([base[0], base[1] + 0.375, base[2]], [0, 0, 1], [0, 1, 0]), tag, 'guardrail');
        for (const s of [-1, 1]) add(postBolt, frameFromAxes([base[0] + s * 1.75 * outv[1], base[1] + 0.375, base[2] - s * 1.75 * outv[0]], [1, 0, 0], [0, -1, 0]), tag, 'guardrail');
        add(railWeld, frameFromAxes([base[0] + 1, base[1] + 0.375, base[2]], [0, 1, 0], [0, 0, 1]), tag, 'weld');
      }
    }
  };

  // ---- rectangular platform (SW-PLT-*): walking surface at `top`; beams span along `span` ('x' or 'z'); grating bars span between beams ----
  interface PlatformOpts { cuts?: Cut[]; span: 'x' | 'z'; tag: string; rails?: Vec3[][]; railCentre?: [number, number] }
  const platformBeam = (() => { const D = 6; const s = sizeW(D, 2); return { D, w: s.w, dims: s.dims }; })(); // SW-PLT-2: span/20 ≥ 6 in; 100 psf
  const platform = (x0: number, z0: number, x1: number, z1: number, top: number, o: PlatformOpts) => {
    const d6 = platformBeam.dims.d, yBeam = top - barDepth - d6 / 2;
    const beams: number[] = [];
    const lo = o.span === 'x' ? z0 : x0, hi = o.span === 'x' ? z1 : x1;
    const nB = Math.ceil((hi - lo) / 48);                                       // intermediate beams at ≤ 4 ft
    for (let i = 0; i <= nB; i++) beams.push(lo + ((hi - lo) * i) / nB);
    for (const c of beams) {
      if (o.span === 'x') wBeam(platformBeam.D, platformBeam.w, [x0, yBeam, c], [x1, yBeam, c], o.tag);
      else wBeam(platformBeam.D, platformBeam.w, [c, yBeam, z0], [c, yBeam, z1], o.tag);
    }
    // closing edge beams perpendicular to the span
    if (o.span === 'x') { for (const x of [x0, x1]) wBeam(platformBeam.D, platformBeam.w, [x, yBeam, z0], [x, yBeam, z1], o.tag); }
    else for (const z of [z0, z1]) wBeam(platformBeam.D, platformBeam.w, [x0, yBeam, z], [x1, yBeam, z], o.tag);
    // grating: bars span between beams (perpendicular to the beam direction); panels ≤ 36 in wide
    for (let i = 0; i < nB; i++) {
      const a = beams[i], b = beams[i + 1];
      const along = o.span === 'x' ? x1 - x0 : z1 - z0;
      const nP = Math.ceil(along / 36);
      for (let k = 0; k < nP; k++) {
        const s0 = (along * k) / nP, s1 = (along * (k + 1)) / nP;
        // panel local: x = bar span direction (between beams), y = along the beams
        const w = b - a, h = s1 - s0;
        // panel local frame: span 'x' → local x = world z (from beam a), local y = world x (from x0+s0);
        //                    span 'z' → local x = world x (from beam a), local y = −world z (from z0+s0+h)
        const zTop = z0 + s0 + h;
        const cuts: Cut[] = (o.cuts ?? []).map(c => 'r' in c
          ? (o.span === 'x' ? { cx: c.cy - a, cy: c.cx - (x0 + s0), r: c.r } : { cx: c.cx - a, cy: zTop - c.cy, r: c.r })
          : (o.span === 'x' ? { x0: c.y0 - a, y0: c.x0 - (x0 + s0), x1: c.y1 - a, y1: c.x1 - (x0 + s0) } : { x0: c.x0 - a, y0: zTop - c.y1, x1: c.x1 - a, y1: zTop - c.y0 }));
        const panel = part(`grating:${w.toFixed(2)}:${h.toFixed(2)}:${JSON.stringify(cuts)}`, () => makeGrating('GR', w, h, cuts.map(c => 'r' in c ? { cx: c.cx, cy: c.cy, r: c.r } : c)));
        if (panel.dims.bars.value === 0) continue;
        // place: local x → world z (span 'x' means beams along x, bars along z) or world x; local z (depth) → world y (down from top)
        if (o.span === 'x') add(panel, frameFromAxes([x0 + s0, top, a], [1, 0, 0], [0, 1, 0]), o.tag, 'grating');       // local x = y×z = (1,0,0)×(0,1,0) = (0,0,1)
        else add(panel, frameFromAxes([a, top, zTop], [0, 0, -1], [0, 1, 0]), o.tag, 'grating');                       // local x = (0,0,-1)×(0,1,0) = (1,0,0); local y → −z
      }
    }
    for (const r of o.rails ?? []) guardrail(r, o.railCentre ?? [(x0 + x1) / 2, (z0 + z1) / 2], o.tag);
  };

  // ---- free-standing platform columns (SW-PLT-3) --------------------------------------------------------
  const columnSpots = new Set<string>();
  const postColumn = (x: number, z: number, top: number, tag: string) => {
    const spot = `${x.toFixed(1)},${z.toFixed(1)}`; if (columnSpots.has(spot)) return; columnSpots.add(spot); // a taller column already stands here (landings share columns)
    const D = Math.max(6, roundUpTo(top / 36, 2));
    const col = sizeW(D, 2);
    const bp = part(`pbp:${D}`, () => makeBasePlate(`BP-P${D}`, { column: col.dims }));
    const yb = bp.dims.grout.value + bp.dims.t.value;
    const L = top - yb;
    add(concrete('pad', bp.dims.B.value + 8, lay.padHeight, bp.dims.N.value + 8), frameFromAxes([x - (bp.dims.N.value + 8) / 2, lay.padHeight / 2, z], [0, 1, 0], [1, 0, 0]), tag, 'pad');
    add(bp, multiply(translate(x, lay.padHeight + bp.dims.grout.value, z), standUp()), tag, 'base-plate');
    add(part(`pcolm:${D}:${L.toFixed(2)}`, () => makeWideFlange(`W${D}x${col.w}`, D, col.w, L)), multiply(translate(x, lay.padHeight + yb, z), standUp()), tag, 'column');
    add(part(`pcolw:${D}`, () => makeFilletWeldAround('PCW', wProfile(col.dims), Math.min(col.dims.tw, col.dims.tf, bp.dims.t.value))), multiply(translate(x, lay.padHeight + yb, z), standUp()), tag, 'weld');
    const rod = part(`prod:${D}`, () => makeAnchorRod('AR-P', { basePlateT: bp.dims.t.value, groutT: bp.dims.grout.value, plateWasherT: bp.dims.washerT.value }));
    for (const h of bp.extra!.holes as { x: number; y: number }[]) add(rod, multiply(translate(x + h.x, lay.padHeight, z - h.y), standUp()), tag, 'anchor-rod');
  };

  // ---- stair flight (SW-SR-*): from the floor point at the first riser (centre of the flight width) in direction `dir` (±x), n risers ----
  const RISE = 7.5, RUN = 10, SW = 36;
  const stairFlight = (base: Vec3, dirX: 1 | -1, n: number, tag: string) => {
    const rise = n * RISE, run = (n - 1) * RUN, slopeLen = Math.hypot(run + RUN, rise + RISE);
    const alpha = Math.atan(RISE / RUN), ca = Math.cos(alpha), sa = Math.sin(alpha);
    const Dc = Math.max(10, roundUpTo(slopeLen / 16, 2));                     // SW-SR-2
    let wC = 10; for (let w = Math.ceil(weightPerFootFromArea(0.04 * Dc * Dc)); w < 200; w++) { if (proportionC(Dc, w).tw >= 0.25) { wC = w; break; } }
    const cdims = proportionC(Dc, wC);
    // stringer centreline parallel to the nosing line, `off` below it; starts where it meets the floor, ends at the landing edge (SW-SR-2)
    const off = Dc / 2 + 1;
    const xStart = base[0] + dirX * (off / sa - RUN), xEnd = base[0] + dirX * run;
    const sLen = (run + RUN - off / sa) / ca;
    const up: Vec3 = [dirX * ca, sa, 0], nrm: Vec3 = [-dirX * sa, ca, 0];
    const stringer = part(`str:${Dc}x${wC}:${sLen.toFixed(2)}`, () => {
      const c = makeChannel(`C${Dc}x${wC}`, Dc, wC, sLen);
      c.extra = { endCuts: { start: { dx: 0, dy: -1 / Math.tan(alpha) }, end: { dx: 0, dy: Math.tan(alpha) } } };
      c.notes.push('Bottom cut horizontal, top cut vertical (SW-SR-2).');
      return c;
    });
    for (const side of [-1, 1]) {
      const zc = base[2] + side * (SW / 2 + cdims.tw);                          // web outer face just outside the clear width
      // C profile: web at local x = 0..tw, flanges toward +x; flanges must point toward the treads (−side·z): local x = yDir × up
      const yDir: Vec3 = side === dirX ? nrm : [-nrm[0], -nrm[1], -nrm[2]];
      add(stringer, frameFromAxes([xStart, base[1], zc], yDir, up), tag, 'stringer');
    }
    void xEnd;
    // treads (SW-GR-3): tread k at elevation k·RISE, nosing at (k−1)·RUN from the base
    const tread = part(`tread:${SW}`, () => makeTread('TR', SW));
    for (let k = 1; k < n; k++) {
      const x = base[0] + dirX * (k - 1) * RUN, y = base[1] + k * RISE;
      // tread local: x = width (world z), y = depth going back from the nosing (world x·dirX), z = down
      add(tread, frameFromAxes([x, y, base[2] - dirX * SW / 2], [dirX, 0, 0], [0, 1, 0]), tag, 'tread'); // local x = (dirX,0,0)×(0,1,0) = (0,0,dirX): width across the flight
    }
    // handrails (SW-SR-4): posts on both stringers at ≤ 72 in along the slope, rails at 36 in and 18 in above the nosing line
    const railLen = Math.hypot(run, rise);
    for (const side of [-1, 1]) {
      const zr = base[2] + side * (SW / 2 + cdims.tw + 1.5);
      const p0: Vec3 = [base[0], base[1] + RISE, zr];                           // first nosing
      for (const h of [36, 18]) add(railHss(railLen), frameFromAxes([p0[0], p0[1] + h, p0[2]], nrm, up), tag, 'handrail');
      const nPosts = Math.max(1, Math.ceil(railLen / 72));
      for (let i = 0; i <= nPosts; i++) {
        const t = (railLen * i) / nPosts;
        const p: Vec3 = add3(p0, up, t);
        const postLen = 36 + 1 / ca - 1;                                        // from the stringer top edge (1 in below the nosing line) to the top rail
        add(part(`spost:${postLen.toFixed(2)}`, () => makeHssRound('SRP', 2, 0.125, postLen)), frameFromAxes([p[0], p[1] - 1 / ca, p[2]], [0, 0, 1], [0, 1, 0]), tag, 'handrail');
      }
    }
    // bearings (SW-SR-5)
    const clip = part('sclip', () => makeAngle('SCL', 4, 4, 0.375, 8));
    const bpS = part('sbp', () => makePlate('SBP', 0.5, 8, 10));
    for (const side of [-1, 1]) {
      const zc = base[2] + side * (SW / 2 + cdims.tw);
      add(bpS, frameFromAxes([base[0] - dirX * 2, base[1], zc - 5], [0, 1, 0], [0, 0, 1]), tag, 'base-plate');
      add(clip, frameFromAxes([base[0] + dirX * run, base[1] + rise - Dc - 2, zc + side * 0.2], [dirX, 0, 0], [0, 1, 0]), tag, 'clip');
    }
    return { top: [base[0] + dirX * run, base[1] + rise, base[2]] as Vec3, stringer: `C${Dc}x${wC}` };
  };

  // ---- ladder (SW-LD-*): base at the floor/landing under the rung line centre; `face` = unit vector from the wall toward the climber (in plan) ----
  const ladder = (base: Vec3, climb: number, face: [number, number], tag: string) => {
    const side: [number, number] = [-face[1], face[0]];                        // along the rungs
    const railLen = climb + 42;
    const rail = part(`lrail:${railLen.toFixed(2)}`, () => makePlate('LR', 0.5, 2.5, railLen));
    const rung = part('rung', () => makeRod('RG', 0.75, 19));
    for (const s of [-1, 1]) {
      const o: Vec3 = [base[0] + side[0] * s * 9.25 + face[0] * 1.25, base[1], base[2] + side[1] * s * 9.25 + face[1] * 1.25];
      add(rail, frameFromAxes(o, [side[0], 0, side[1]], [0, 1, 0]), tag, 'ladder');          // flat bar on edge: 0.5 in along the rungs, 2.5 in along the standoff direction
    }
    for (let y = 12; y <= climb; y += 12) add(rung, frameFromAxes([base[0] - side[0] * 9.5, base[1] + y, base[2] - side[1] * 9.5], [0, 1, 0], [side[0], 0, side[1]]), tag, 'ladder');
    // brackets to the structure at ≤ 8 ft (SW-LD-2): L3x3x1/4, 7 in standoff
    const br = part('lbr', () => makeAngle('LB', 3, 3, 0.25, CAGE.standoff));
    for (let y = 48; y < climb; y += 96) for (const s of [-1, 1]) {
      const o: Vec3 = [base[0] + side[0] * s * 9.5 - face[0] * CAGE.standoff, base[1] + y, base[2] + side[1] * s * 9.5 - face[1] * CAGE.standoff];
      add(br, frameFromAxes(o, [0, 1, 0], [face[0], 0, face[1]]), tag, 'ladder');
    }
    // cage (SW-LD-3)
    if (climb > CAGE.minClimb) {
      const hoop = part('hoop', () => makeCageHoop('CH'));
      const centreOff = Math.sqrt(CAGE.R ** 2 - CAGE.chordHalf ** 2);           // hoop centre is in front of the rail plane
      const cx = base[0] + face[0] * centreOff, cz = base[2] + face[1] * centreOff;
      let yTop = 0;
      for (let y = CAGE.startAbove; y <= climb + 42 - 2; y += CAGE.hoopPitch) {
        // hoop profile is open toward local −y; local −y must point back toward the ladder (−face)
        add(hoop, frameFromAxes([cx, y, cz], [face[0], 0, face[1]], [0, 1, 0]), tag, 'cage');
        yTop = y + 2;
      }
      const strapLen = yTop - CAGE.startAbove;
      const strap = part(`strap:${strapLen.toFixed(2)}`, () => makePlate('CS', 3 / 16, 1.5, strapLen));
      const half = Math.asin(CAGE.chordHalf / CAGE.R), a0 = -Math.PI / 2 + half, a1 = 1.5 * Math.PI - half; // hoop-local angles (opening toward local −y = the ladder)
      for (let i = 0; i < CAGE.straps; i++) {
        const a = a0 + ((a1 - a0) * (i + 0.5)) / CAGE.straps;
        const r = CAGE.R + 0.25 + 3 / 32;
        // hoop placed with yDir = face, zDir = up → local x = face × up = side
        const lx: [number, number] = side;
        const px = cx + r * (Math.cos(a) * lx[0] + Math.sin(a) * face[0]), pz = cz + r * (Math.cos(a) * lx[1] + Math.sin(a) * face[1]);
        add(strap, frameFromAxes([px, CAGE.startAbove, pz], [Math.cos(a) * lx[0] + Math.sin(a) * face[0], 0, Math.cos(a) * lx[1] + Math.sin(a) * face[1]], [0, 1, 0]), tag, 'cage');
      }
    }
    return { topRail: base[1] + railLen };
  };

  // ---- pipe rack (SW-RK-*): bents, tier beams, struts, intermediate beams, bracing and the rack-end ladders ----
  const rack = (rk: RackLayout) => {
    const bents: number[] = []; for (let x = rk.x0; x <= rk.x1 + 1e-6; x += rk.bentSpacing) bents.push(x);
    const rackW = 2 * rk.halfWidth, topTier = rk.tiers[rk.tiers.length - 1];
    const Db = roundUpTo(rackW / 20, 2);
    const wBeamLoad = (rk.loadPsf * (rk.bentSpacing / 12)) / 12;                 // lb/in
    const Mb = (wBeamLoad * rackW * rackW) / 8;
    const beamSize = sizeW(Db, Mb / (0.9 * G36.Fy.value * 1000));
    const Dc = roundUpTo(topTier / 24, 2);
    const colSize = sizeW(Dc, Mb / 2 / (0.9 * G36.Fy.value * 1000));
    const cd = colSize.dims, bd = beamSize.dims;
    const Ds = Math.max(6, Db - 4), wS = lightestW(Ds);
    derived.rackBeam = rule(beamSize.Z, 'SW-RK-2', `Rack tier beam W${Db}x${beamSize.w}`, 'in2');
    derived.rackColumn = rule(colSize.Z, 'SW-RK-2', `Rack column W${Dc}x${colSize.w}`, 'in2');
    derived.rackStrut = rule(wS, 'SW-RK-3', `Rack strut W${Ds}x${wS}`, 'lb/ft');
    const probeBp = makeBasePlate('p', { column: cd });
    const Pcol = (wBeamLoad * rackW * rk.tiers.length) / 2 / 1000;                // kips per column (SW-PF-6 applied to the rack)
    const rbp = part('rbp', () => makeBasePlate('BP-R', { column: cd, bearingPressureKsi: Number((Pcol / (probeBp.dims.N.value * probeBp.dims.B.value)).toFixed(3)) }));
    const rRod = part('rrod', () => makeAnchorRod('AR-R', { basePlateT: rbp.dims.t.value, groutT: rbp.dims.grout.value, plateWasherT: rbp.dims.washerT.value }));
    const rWeld = part('rweld', () => makeFilletWeldAround('BW-R', wProfile(cd), Math.min(cd.tw, cd.tf, rbp.dims.t.value)));
    const yRackBase = lay.pedestal + rbp.dims.grout.value + rbp.dims.t.value;
    const colLen = topTier - yRackBase;
    const rackCol = part('rcol', () => makeWideFlange(`W${Dc}x${colSize.w}`, Dc, colSize.w, colLen));
    // knee (SW-PF-5 applied to the rack): beam end plates bolted to the column inner flange
    const Tk = Mb / bd.d / 1000, Ab = Tk / 4 / (0.75 * 90);
    const db = Math.max(0.75, roundUpTo(Math.sqrt((4 * Ab) / Math.PI), 1 / 8)), tp = Math.max(0.75, roundUpTo(1.25 * bd.tf, 1 / 8));
    const gauge = roundUpTo(Math.max(bd.bf / 2, 3 * db), 0.5), rowOff = 1.75, edge = 1.5 * db;
    const plateLen = roundUpTo(bd.d + 2 * (rowOff + edge), 0.5), plateW = roundUpTo(bd.bf + 1, 0.5);
    const kneePlate = part('rkp', () => makePlate('EP-R', tp, plateW, plateLen));
    const kneeBolt = part('rkb', () => makeBolt('KB-R', db, boltLengthForGrip(db, tp + cd.tf), tp + cd.tf, BOLT_GRADE));
    const kneeWeld = part('rkw', () => makeFilletWeldAround('PW-R', wProfile(bd), Math.min(bd.tw, bd.tf, tp)));
    const zInner = rk.halfWidth - cd.d, beamLen = 2 * zInner - 2 * tp;
    const rackBeam = part('rbeam', () => makeWideFlange(`W${Db}x${beamSize.w}`, Db, beamSize.w, beamLen));
    const pedestal = concrete('pedestal', rbp.dims.B.value + 8, lay.pedestal, rbp.dims.N.value + 8);
    for (const x of bents) for (const side of [1, -1]) {
      const zc = side * (rk.halfWidth - cd.d / 2), tag = `rack-bent:${x}`;
      add(pedestal, frameFromAxes([x - (rbp.dims.N.value + 8) / 2, lay.pedestal / 2, zc], [0, 1, 0], [1, 0, 0]), tag, 'pedestal');
      add(rbp, multiply(translate(x, lay.pedestal + rbp.dims.grout.value, zc), standUp()), tag, 'base-plate');
      add(rackCol, multiply(translate(x, yRackBase, zc), standUp()), tag, 'column');
      add(rWeld, multiply(translate(x, yRackBase, zc), standUp()), tag, 'weld');
      for (const h of rbp.extra!.holes as { x: number; y: number }[]) add(rRod, multiply(translate(x + h.x, lay.pedestal, zc - h.y), standUp()), tag, 'anchor-rod');
      for (const tier of rk.tiers) {
        const yc = tier - bd.d / 2;
        add(kneePlate, frameFromAxes([x, yc - plateLen / 2, side * (zInner - tp / 2)], [0, 0, side], [0, 1, 0]), tag, 'end-plate');
        add(kneeWeld, frameFromAxes([x, yc, side * (zInner - tp)], [0, 1, 0], [0, 0, -side]), tag, 'weld');
        for (const yr of [yc + bd.d / 2 + rowOff, yc + bd.d / 2 - bd.tf - rowOff, yc - bd.d / 2 + bd.tf + rowOff, yc - bd.d / 2 - rowOff]) for (const gg of [-gauge / 2, gauge / 2])
          add(kneeBolt, frameFromAxes([x + gg, yr, side * (zInner - tp)], [0, 1, 0], [0, 0, side]), tag, 'bolt');
      }
    }
    for (const x of bents) for (const tier of rk.tiers) add(rackBeam, frameFromAxes([x, tier - bd.d / 2, -(zInner - tp)], [0, 1, 0], [0, 0, 1]), `rack-bent:${x}`, 'beam');
    // struts (SW-RK-3) between bents at each tier on both column lines, with shear tabs
    const strutLen = rk.bentSpacing - cd.bf;
    const strut = part('strut', () => makeWideFlange(`W${Ds}x${wS}`, Ds, wS, strutLen));
    const sd = proportionW(Ds, wS);
    const tab = part('tab', () => makePlate('ST', 0.375, 4, sd.d - 2));
    const tabBolt = part('tabb', () => makeBolt('TB', 0.75, boltLengthForGrip(0.75, 0.375 + sd.tw), 0.375 + sd.tw));
    const tabWeld = part('tabw', () => makeFilletWeld('TW', sd.d - 2, { tThin: 0.375 }));
    for (let i = 0; i < bents.length - 1; i++) for (const side of [1, -1]) for (const tier of rk.tiers) {
      const zc = side * (rk.halfWidth - cd.d / 2), x0 = bents[i] + cd.bf / 2, tag = `rack-bay:${i}`;
      add(strut, frameFromAxes([x0, tier - sd.d / 2, zc], [0, 1, 0], [1, 0, 0]), tag, 'strut');
      for (const [xe, sg] of [[bents[i] + cd.bf / 2, 1], [bents[i + 1] - cd.bf / 2, -1]] as const) {
        add(tab, frameFromAxes([xe, tier - sd.d / 2 - (sd.d - 2) / 2, zc + sd.tw / 2 + 0.1875], [0, 0, 1], [0, 1, 0]), tag, 'clip');   // tab beside the strut web, welded to the column flange tips
        add(tabWeld, frameFromAxes([xe, tier - sd.d / 2 - (sd.d - 2) / 2, zc + sd.tw / 2 + 0.375], [sg, 0, 0], [0, 1, 0]), tag, 'weld');
        for (const dy of [-1.5, 0, 1.5]) add(tabBolt, frameFromAxes([xe + sg * 2, tier - sd.d / 2 + dy, zc + sd.tw / 2 + 0.375], [0, 1, 0], [0, 0, -1]), tag, 'bolt');
      }
    }
    // intermediate beams (SW-RK-6): a channel at mid-bay on each tier, spanning between the struts, top level with the tier beams
    { const Dch = Ds; let wC = 10; for (let w = Math.ceil(weightPerFootFromArea(0.04 * Dch * Dch)); w < 200; w++) { if (proportionC(Dch, w).tw >= 0.25) { wC = w; break; } }
      const cdm = proportionC(Dch, wC), span = 2 * (rk.halfWidth - cd.d / 2) - sd.bf;
      const mid = part('rkmid', () => makeChannel(`C${Dch}x${wC}`, Dch, wC, span));
      for (let i = 0; i < bents.length - 1; i++) for (const tier of rk.tiers) add(mid, frameFromAxes([(bents[i] + bents[i + 1]) / 2 - cdm.bf / 2, tier - Dch / 2, -span / 2], [0, 1, 0], [0, 0, 1]), `rack-bay:${i}`, 'intermediate-beam');   // depth vertical, flanges toward +x
      derived.rackMid = rule(wC, 'SW-RK-6', `Rack intermediate beam C${Dch}x${wC}`, 'lb/ft'); }
    // rod bracing (SW-RK-3): every fourth bay, column planes and tier planes
    const rodP = (L: number) => part(`rrod:${L.toFixed(1)}`, () => makeRod('XR-R', 0.75, L, G36, 'SW-RK-3'));
    for (let i = 0; i < bents.length - 1; i += 4) {
      const x0 = bents[i], x1 = bents[i + 1], tag = `rack-bay:${i}`;
      for (const side of [1, -1]) {
        const zc = side * (rk.halfWidth - cd.d / 2);
        for (const [xa, xb] of [[x0, x1], [x1, x0]]) { const a: Vec3 = [xa, yRackBase + 12, zc], b: Vec3 = [xb, topTier - 12, zc]; const L = dist(a, b); add(rodP(L), frameFromAxes(a, [0, 0, 1], [(b[0] - a[0]) / L, (b[1] - a[1]) / L, 0]), tag, 'bracing'); }
      }
      for (const tier of rk.tiers) for (const [xa, xb] of [[x0, x1], [x1, x0]]) {
        const a: Vec3 = [xa, tier - sd.d / 2, -(rk.halfWidth - cd.d / 2)], b: Vec3 = [xb, tier - sd.d / 2, rk.halfWidth - cd.d / 2]; const L = dist(a, b);
        add(rodP(L), frameFromAxes(a, [0, 1, 0], [(b[0] - a[0]) / L, 0, (b[2] - a[2]) / L]), tag, 'bracing');
      }
    }
    // rack-end ladders (SW-LAY-3) to the top tier, on the outside of the end bents, caged (climb > 20 ft)
    for (const [x, dirX] of [[rk.x0, -1], [rk.x1, 1]] as const) {
      const xr = x + dirX * (cd.bf / 2 + CAGE.standoff);
      ladder([xr, lay.pedestal, rk.halfWidth - cd.d / 2], topTier - lay.pedestal, [dirX, 0], 'rack-ladder');
    }

    return { bents, Db, beamSize, Dc, colSize, Ds, wS, cd, bd, topTier, yRackBase };
  };

  // ---- vessel platform annulus (SW-PLT-*, SW-EQ-6) ----
  const clipBr = part('vclip', () => makePlate('VC', 0.5, 12, 6));
  const vesselAnnulus = (cx: number, cz: number, R: number, inR: number, outR: number, topEl: number, tag: string, railOpenings: { edge: 'E' | 'W' | 'N' | 'S'; from: number; to: number }[], extraCuts: Cut[] = []) => {
    const d6 = platformBeam.dims.d, yBeam = topEl - barDepth - d6 / 2;
    // ring beams (4 sides) and 16 radial beams from shell clips to the ring (SW-PLT-2/3)
    const c = [[cx - outR, cz - outR], [cx + outR, cz - outR], [cx + outR, cz + outR], [cx - outR, cz + outR]];
    for (let k = 0; k < 4; k++) wBeam(platformBeam.D, platformBeam.w, [c[k][0], yBeam, c[k][1]], [c[(k + 1) % 4][0], yBeam, c[(k + 1) % 4][1]], tag);
    for (let i = 0; i < 16; i++) {
      const a = (2 * Math.PI * i) / 16, ca = Math.cos(a), sa = Math.sin(a);
      const rEnd = outR / Math.max(Math.abs(ca), Math.abs(sa));                 // to the square ring
      wBeam(platformBeam.D, platformBeam.w, [cx + (R + 1) * ca, yBeam, cz + (R + 1) * sa], [cx + rEnd * ca, yBeam, cz + rEnd * sa], tag);
      add(clipBr, frameFromAxes([cx + R * ca, yBeam - 6, cz + R * sa], [-sa, 0, ca], [ca, 0, sa]), tag, 'clip');       // bracket plate radial, 12 in deep
    }
    const cuts: Cut[] = [{ cx, cy: cz, r: inR }, ...extraCuts];
    platform(cx - outR, cz + inR, cx + outR, cz + outR, topEl, { span: 'x', tag, cuts });     // N strip (z > 0 side), bars along z... beams along x
    platform(cx - outR, cz - outR, cx + outR, cz - inR, topEl, { span: 'x', tag, cuts });     // S strip
    platform(cx + inR, cz - inR, cx + outR, cz + inR, topEl, { span: 'z', tag, cuts });       // E strip
    platform(cx - outR, cz - inR, cx - inR, cz + inR, topEl, { span: 'z', tag, cuts });       // W strip
    // guardrail around the square with openings
    const edges: Record<'E' | 'W' | 'N' | 'S', [Vec3, Vec3]> = {
      S: [[cx - outR, topEl, cz - outR], [cx + outR, topEl, cz - outR]], E: [[cx + outR, topEl, cz - outR], [cx + outR, topEl, cz + outR]],
      N: [[cx + outR, topEl, cz + outR], [cx - outR, topEl, cz + outR]], W: [[cx - outR, topEl, cz + outR], [cx - outR, topEl, cz - outR]],
    };
    for (const e of ['S', 'E', 'N', 'W'] as const) {
      const [a, b] = edges[e];
      const ops = railOpenings.filter(o => o.edge === e).sort((p, q) => p.from - q.from);
      let t0 = 0;
      const segs: [number, number][] = [];
      for (const o of ops) { segs.push([t0, o.from]); t0 = o.to; }
      segs.push([t0, 1]);
      for (const [u0, u1] of segs) if (u1 - u0 > 1e-6) guardrail([add3(a, [b[0] - a[0], 0, b[2] - a[2]], u0), add3(a, [b[0] - a[0], 0, b[2] - a[2]], u1)], [cx, cz], tag);
    }
  };
  return { part, add, memo, barDepth, railHss, toePlate, concrete, wBeam, lightestW, guardrail, platformBeam, platform, postColumn, RISE, RUN, SW, stairFlight, ladder, rack, clipBr, vesselAnnulus };
}
export type InteriorKit = ReturnType<typeof interiorKit>;
