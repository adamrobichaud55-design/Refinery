/**
 * Building shell generator: DESIGN_BASIS.md sections 13–17.
 * Output is plain data: a list of placed parts (PartSpec + 4x4 transform + tags).
 * World frame (SW-U-4): +Y up, +X along the building length (0..L), +Z across the width (−W/2..W/2), ridge at z = 0, floor top at y = 0.
 * Part local frames: profile in local xy, extruded along local +z. frameFromAxes(origin, yDir, zDir) gives local x = y × z.
 */
import { drawing, rule, type Dim } from '../core/basis';
import { roundUpTo } from '../core/units';
import { weightPerFootFromArea } from '../core/constants';
import {
  makeWideFlange, proportionW, makeBasePlate, makeAnchorRod, makePlate, makeBolt, boltLengthForGrip,
  makeFilletWeld, makeFilletWeldAround, makeZ, makeCS, sizeColdFormed, makePanel, makeTrim, panelPsf, PANEL, makeRod,
  DEFAULT_MATERIAL, CF_GRADE_50, type PartSpec, type Material, type WDims,
} from '../catalogue';
import { wProfile } from '../geometry/profiles';
import { wPlasticModulus } from '../geometry/properties';
import { frameFromAxes, multiply, translate, rotateY, standUp, type Vec3 } from '../geometry/transform';
import type { Mat4 } from '../geometry/mesh';

export interface BuildingDrawing {
  widthFt: number; bays: number; bayFt: number; eaveFt: number; slopeRisePer12: number;
  roofLoadPsf: number; wallPsf: number; slabIn: number;
  boltFu: number; // ksi, "Grade 90"
  personnelDoor: { w: number; h: number; leafT: number; frameFace: number; frameT: number }; // in
  equipmentDoor: { w: number; h: number; curtainT: number; drumDia: number };               // in
}
export const DEMO_PLANT: BuildingDrawing = {
  widthFt: 80, bays: 8, bayFt: 25, eaveFt: 30, slopeRisePer12: 1, roofLoadPsf: 30, wallPsf: 20, slabIn: 6, boltFu: 90,
  personnelDoor: { w: 36, h: 84, leafT: 1.75, frameFace: 2, frameT: 1 / 16 }, equipmentDoor: { w: 168, h: 192, curtainT: 0.125, drumDia: 24 },
};

export interface Placed { part: PartSpec; transform: Mat4; tags: string[] }
export interface BuildingModel { drawing: BuildingDrawing; derived: Record<string, Dim>; instances: Placed[]; notes: string[] }

const BOLT_GRADE: Material = { grade: 'Grade 90 bolt', Fy: { value: 90, unit: 'ksi', basis: { kind: 'drawing' }, label: 'Bolt tensile strength (grade stated on drawing)' } };
const GRADE_36 = DEFAULT_MATERIAL;
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const add3 = (a: Vec3, b: Vec3, k = 1): Vec3 => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];

/** SW-PF-3: lightest W at depth D whose plastic modulus meets Zreq; weight rounded up to a multiple of 5 lb/ft. */
export function sizeW(D: number, ZreqIn3: number): { w: number; Z: number; dims: WDims } {
  const w0 = Math.ceil(weightPerFootFromArea(0.045 * D * D));
  for (let w = w0; w < 1000; w++) {
    const p = proportionW(D, w);
    if (wPlasticModulus(p.d, p.bf, p.tf, p.tw) >= ZreqIn3) {
      const wr = roundUpTo(w, 5), pr = proportionW(D, wr);
      return { w: wr, Z: wPlasticModulus(pr.d, pr.bf, pr.tf, pr.tw), dims: pr };
    }
  }
  throw new Error('SW-PF-3: no W section at this depth meets the required Z');
}

/** Place a member between two points: local z from A to B; local y as given (must be ⊥ to AB). */
function along(a: Vec3, b: Vec3, yDir: Vec3): { tr: Mat4; len: number } {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  return { tr: frameFromAxes(a, yDir, [(b[0] - a[0]) / len, (b[1] - a[1]) / len, (b[2] - a[2]) / len]), len };
}
/** Place a part whose local x and y are prescribed, extruded from A toward B (|AB| = length); flips the start if x × y points the other way. */
function alongXY(a: Vec3, b: Vec3, xDir: Vec3, yDir: Vec3): Mat4 {
  const z = cross(xDir, yDir);
  const ab: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const dot = z[0] * ab[0] + z[1] * ab[1] + z[2] * ab[2];
  return frameFromAxes(dot >= 0 ? a : b, yDir, z);
}

export function generateBuilding(dr: BuildingDrawing = DEMO_PLANT): BuildingModel {
  const out: Placed[] = [];
  const notes: string[] = [];
  const derived: Record<string, Dim> = {};
  const memo = new Map<string, PartSpec>();
  const part = <T extends PartSpec>(key: string, make: () => T): T => { let p = memo.get(key) as T | undefined; if (!p) { p = make(); memo.set(key, p); } return p; };
  const add = (p: PartSpec, transform: Mat4, ...tags: string[]) => out.push({ part: p, transform, tags });

  // ---- drawing inputs ----------------------------------------------------------------------------
  const W = dr.widthFt * 12, bay = dr.bayFt * 12, L = dr.bays * bay, He = dr.eaveFt * 12;
  const theta = Math.atan(dr.slopeRisePer12 / 12), cosT = Math.cos(theta), sinT = Math.sin(theta), tanT = Math.tan(theta);
  const halfW = W / 2, slopeLen = halfW / cosT;
  const frameX = Array.from({ length: dr.bays + 1 }, (_, i) => i * bay);

  // ---- secondary sizes first (SW-CF-4/5): the frame load depends on them --------------------------
  const purlinSpacing = 60, girtSpacing = 90;
  const purlinSize = sizeColdFormed('Z', bay, (dr.roofLoadPsf * (purlinSpacing / 12)) / 12, CF_GRADE_50.Fy.value);
  const girtSize = sizeColdFormed('Z', bay, (dr.wallPsf * (girtSpacing / 12)) / 12, CF_GRADE_50.Fy.value);
  const purlinProto = part('purlin', () => makeZ('PURLIN', purlinSize.D, purlinSize.B, purlinSize.t, bay));
  const Dp = purlinSize.D, tP = purlinSize.t, Dg = girtSize.D, Bg = girtSize.B, tG = girtSize.t;
  const roofDead = panelPsf() + purlinProto.dims.w.value / (purlinSpacing / 12);
  derived.roofDeadPsf = rule(roofDead, 'SW-PF-2', 'Roof dead load from panels and purlins (psf)', 'lb');
  derived.purlin = rule(purlinSize.S, 'SW-CF-5', `Purlin ${purlinProto.designation}: S ≥ ${purlinSize.Sreq.toFixed(2)} in³`, 'in2');
  derived.girt = rule(girtSize.S, 'SW-CF-5', `Girt Z${Dg}x${Bg}x${tG}: S ≥ ${girtSize.Sreq.toFixed(2)} in³`, 'in2');

  // ---- primary frame (SW-PF-1..5) -----------------------------------------------------------------
  const wFrame = ((dr.roofLoadPsf + roofDead) * 1.1 * dr.bayFt) / 12;   // lb/in
  const M = (wFrame * W * W) / 12;                                        // lb·in
  const Zreq = M / (0.9 * GRADE_36.Fy.value * 1000);
  const D = roundUpTo(W / 40, 2);
  const { w: wR, Z, dims: col } = sizeW(D, Zreq);
  const { d, bf, tf, tw } = col;
  derived.frameLoad = rule(wFrame * 12, 'SW-PF-2', 'Frame gravity load', 'lb/ft');
  derived.frameMoment = rule(M / 12000, 'SW-PF-2', 'Design moment (kip·ft)', 'lb');
  derived.frameSection = rule(Z, 'SW-PF-3', `Frame section W${D}x${wR}: Z ≥ ${Zreq.toFixed(0)} in³`, 'in2');
  const Tk = M / d / 1000;                                                // kips, flange force
  const Ab = Tk / 4 / (0.75 * dr.boltFu);
  const db = Math.max(0.75, roundUpTo(Math.sqrt((4 * Ab) / Math.PI), 1 / 8));
  const tp = Math.max(0.75, roundUpTo(1.25 * tf, 1 / 8));
  const gauge = roundUpTo(Math.max(bf / 2, 3 * db), 0.5);
  const rowOff = 1.75, edge = 1.5 * db;
  const dCut = d / cosT;                                                  // depth of the vertical cut
  const plateLen = roundUpTo(dCut + 2 * (rowOff + edge), 0.5), plateW = roundUpTo(bf + 1, 0.5);
  derived.kneeBolt = rule(db, 'SW-PF-5', 'Knee/ridge bolt diameter');
  derived.endPlate = rule(tp, 'SW-PF-5', `End plate PL${tp}x${plateW}x${plateLen}`);

  // ---- bases (SW-PF-6/7) ---------------------------------------------------------------------------
  const P = (wFrame * W) / 2 / 1000;                                       // kips
  const probe = makeBasePlate('probe', { column: col });
  const fp = Number((P / (probe.dims.N.value * probe.dims.B.value)).toFixed(3));
  const bp = part('bp', () => makeBasePlate('BP-1', { column: col, bearingPressureKsi: fp }));
  const tbp = bp.dims.t.value, grout = bp.dims.grout.value, yBase = grout + tbp;
  const rod = part('ar', () => makeAnchorRod('AR-1', { basePlateT: tbp, groutT: grout, plateWasherT: bp.dims.washerT.value }));
  const groutPad = part('grout', () => nonSteel('GROUT-1', 'CONCRETE', 'grout bed', { w: bp.dims.B.value, t: grout }, bp.dims.N.value));
  const colOutline = wProfile(col);
  const cutOutline = colOutline.map(p => ({ x: p.x, y: p.y / cosT }));   // the W outline on a vertical cut
  const baseWeld = part('bw', () => makeFilletWeldAround('BW-1', colOutline, Math.min(tw, tf, tbp)));
  const plateWeld = part('pw', () => makeFilletWeldAround('PW-1', cutOutline, Math.min(tw, tf, tp)));

  // ---- frame geometry ------------------------------------------------------------------------------
  const zColC = halfW - d / 2, zInner = halfW - d, zCut = zInner - tp;    // column: outside flange on the steel line
  const yK = He - dCut / 2;                                               // rafter centreline at the knee cut (rafter top = He there)
  const yRidge = yK + zCut * tanT;                                        // rafter centreline at z = 0
  const colTop = He + rowOff + edge, colLen = colTop - yBase;
  const rafterLen = (zCut - tp) / cosT;
  const column = part('col', () => makeWideFlange('COL', D, wR, colLen));
  const rafter = part('raf', () => { const r = makeWideFlange('RAF', D, wR, rafterLen); r.extra = { endCuts: { start: { dx: 0, dy: tanT }, end: { dx: 0, dy: tanT } } }; r.notes.push('Ends cut vertical (SW-PF-5).'); return r; });
  const endPlate = part('ep', () => makePlate('EP-1', tp, plateW, plateLen));
  const kneeBolt = part('kb', () => makeBolt('KB-1', db, boltLengthForGrip(db, tp + tf), tp + tf, BOLT_GRADE));
  const ridgeBolt = part('rb', () => makeBolt('RB-1', db, boltLengthForGrip(db, 2 * tp), 2 * tp, BOLT_GRADE));
  derived.column = rule(colLen, 'SW-PF-4', `Column ${column.designation} length`);
  derived.rafter = rule(rafterLen, 'SW-PF-1', `Rafter ${rafter.designation} length along slope`);
  const rowsAbout = (yc: number) => [yc + dCut / 2 + rowOff, yc + dCut / 2 - tf / cosT - rowOff, yc - dCut / 2 + tf / cosT + rowOff, yc - dCut / 2 - rowOff];

  for (const [i, x] of frameX.entries()) {
    const tagF = `frame:${i}`;
    for (const side of [1, -1]) {
      const zc = side * zColC;
      add(groutPad, translate(x, grout / 2, zc - bp.dims.N.value / 2), tagF, 'grout');
      add(bp, multiply(translate(x, grout, zc), standUp()), tagF, 'base-plate');
      add(column, multiply(translate(x, yBase, zc), standUp()), tagF, 'column');
      add(baseWeld, multiply(translate(x, yBase, zc), standUp()), tagF, 'weld');
      for (const h of bp.extra!.holes as { x: number; y: number }[]) add(rod, multiply(translate(x + h.x, 0, zc - h.y), standUp()), tagF, 'anchor-rod');
      const up: Vec3 = [0, sinT, -side * cosT], nrm: Vec3 = [0, cosT, side * sinT];
      add(rafter, frameFromAxes([x, yK, side * zCut], nrm, up), tagF, 'rafter');
      // knee: end plate against the column inner flange, weld ring on the plate face, bolts through plate + flange
      add(endPlate, frameFromAxes([x, yK - plateLen / 2, side * (zInner - tp / 2)], [0, 0, side], [0, 1, 0]), tagF, 'end-plate');
      add(plateWeld, frameFromAxes([x, yK, side * zCut], [0, 1, 0], [0, 0, -side]), tagF, 'weld');
      for (const yr of rowsAbout(yK)) for (const g of [-gauge / 2, gauge / 2])
        add(kneeBolt, frameFromAxes([x + g, yr, side * (zInner - tp)], [0, 1, 0], [0, 0, side]), tagF, 'bolt');
      // ridge: plate at z ∈ [0, side·tp], weld ring at the rafter end face
      const yR = yRidge - tp * tanT;
      add(endPlate, frameFromAxes([x, yR - plateLen / 2, side * tp / 2], [0, 0, side], [0, 1, 0]), tagF, 'end-plate');
      add(plateWeld, frameFromAxes([x, yR, side * tp], [0, 1, 0], [0, 0, side]), tagF, 'weld');
    }
    for (const yr of rowsAbout(yRidge)) for (const g of [-gauge / 2, gauge / 2]) add(ridgeBolt, frameFromAxes([x + g, yr, -tp], [0, 1, 0], [0, 0, 1]), tagF, 'bolt');
  }

  // ---- endwall posts (SW-BLD-4) ---------------------------------------------------------------------
  const postSpacing = 240;
  const postZ: number[] = []; for (let z = -halfW + postSpacing; z < halfW - 1; z += postSpacing) postZ.push(z);
  const Mpost = ((dr.wallPsf * (postSpacing / 12)) / 12) * He * He / 8;
  const Dpost = roundUpTo(He / 36, 2);
  const postSize = sizeW(Dpost, Mpost / (0.9 * GRADE_36.Fy.value * 1000));
  const pd = postSize.dims;
  const postBp = part('pbp', () => makeBasePlate('BP-2', { column: pd }));
  const pg = postBp.dims.grout.value, ptb = postBp.dims.t.value;
  const postRod = part('par', () => makeAnchorRod('AR-2', { basePlateT: ptb, groutT: pg, plateWasherT: postBp.dims.washerT.value }));
  const postGrout = part('pgrout', () => nonSteel('GROUT-2', 'CONCRETE', 'grout bed', { w: postBp.dims.B.value, t: pg }, postBp.dims.N.value));
  const postWeld = part('pwld', () => makeFilletWeldAround('BW-2', wProfile(pd), Math.min(pd.tw, pd.tf, ptb)));
  derived.post = rule(postSize.Z, 'SW-BLD-4', `Endwall post W${Dpost}x${postSize.w}`, 'in2');
  const rafterUnder = (z: number) => yRidge - Math.abs(z) * tanT - dCut / 2;
  for (const [ei, xw] of [0, L].entries()) {
    const sideX = ei === 0 ? -1 : 1, xc = xw - sideX * (pd.d / 2);         // outside flange on the endwall steel line
    for (const z of postZ) {
      const len = rafterUnder(z) - (pg + ptb) - 0.5;
      const post = part(`post:${len.toFixed(2)}`, () => makeWideFlange('POST', Dpost, postSize.w, len));
      const rot = multiply(rotateY(Math.PI / 2), standUp());                 // profile x (bf) → −z, profile y (d) → −x
      add(postGrout, frameFromAxes([xc - postBp.dims.N.value / 2, pg / 2, z], [0, 1, 0], [1, 0, 0]), 'endwall', 'grout');
      add(postBp, multiply(translate(xc, pg, z), rot), 'endwall', 'base-plate');
      add(post, multiply(translate(xc, pg + ptb, z), rot), 'endwall', 'post');
      add(postWeld, multiply(translate(xc, pg + ptb, z), rot), 'endwall', 'weld');
      for (const h of postBp.extra!.holes as { x: number; y: number }[]) add(postRod, multiply(translate(xc - h.y, 0, z - h.x), standUp()), 'endwall', 'anchor-rod');
    }
  }

  // ---- purlins (SW-CF-4/6): Z on the rafter top flange, web normal to the roof, bottom flange down-slope ----
  const purlinS: number[] = []; for (let s = 12; s < slopeLen - 12; s += purlinSpacing) purlinS.push(s);
  const clipP = part('clipP', () => makePlate('CLIP-1', 0.25, 4, Dp - 2));
  const clipG = part('clipG', () => makePlate('CLIP-2', 0.25, 4, Dg - 2));
  const clipWeld = part('clipw', () => makeFilletWeld('CW-1', 4, { tThin: 0.25 }));
  const clipBoltP = part('cbp', () => makeBolt('CB-1', 0.5, boltLengthForGrip(0.5, 0.25 + tP), 0.25 + tP));
  const clipBoltG = part('cbg', () => makeBolt('CB-2', 0.5, boltLengthForGrip(0.5, 0.25 + tG), 0.25 + tG));
  /** point on the rafter top surface at horizontal distance z from the ridge, on `side` */
  const rafterTopAt = (z: number, side: number): Vec3 => [0, yRidge - z * tanT + (d / 2) / cosT, side * z];
  const sheetUnderY = (z: number) => yRidge - Math.abs(z) * tanT + (d / 2 + Dp) / cosT;   // roof sheet underside (purlin top) at z
  for (let i = 0; i < dr.bays; i++) for (const side of [1, -1]) {
    const nrm: Vec3 = [0, cosT, side * sinT], up: Vec3 = [0, sinT, -side * cosT];
    for (const s of purlinS) {
      const p = rafterTopAt(s * cosT, side);
      add(purlinProto, frameFromAxes([frameX[i], p[1] + nrm[1] * (Dp / 2), p[2] + nrm[2] * (Dp / 2)], nrm, [1, 0, 0]), `bay:${i}`, 'purlin');
      for (const [x, sgn] of [[frameX[i], 1], [frameX[i + 1], -1]] as const) {
        const xc = x + sgn * 2.5;
        const base = add3(add3(p, up, tP / 2 + 0.125), [xc, 0, 0]);               // clip centre at the rafter flange, up-slope of the web
        add(clipP, frameFromAxes(add3(base, nrm, 1), up, nrm), `bay:${i}`, 'clip'); // plate: 4 in along x, thin along the slope, standing up the normal
        const face = add3(add3(p, up, tP / 2 + 0.25), [xc, 0, 0]);               // clip's up-slope face
        add(clipWeld, alongXY(add3(face, [-2, 0, 0]), add3(face, [2, 0, 0]), up, nrm), `bay:${i}`, 'weld');
        for (const dz of [-1.5, 1.5]) {
          const o = add3(face, nrm, Dp / 2 + dz);
          add(clipBoltP, frameFromAxes(o, nrm, [-up[0], -up[1], -up[2]]), `bay:${i}`, 'bolt'); // head on the clip face, shank down-slope through clip + web
        }
      }
    }
  }

  // ---- girts (SW-CF-4/6/7): Z lying against the column outer flange, web horizontal, depth normal to the wall ----
  const girtY: number[] = []; for (let y = girtSpacing; y < He - Dg; y += girtSpacing) girtY.push(y);
  const dP = dr.personnelDoor, dE = dr.equipmentDoor;
  const personnelX = [1, dr.bays - 2].map(b => frameX[b] + bay / 2);
  const cutsDoor = (y: number, h: number) => y - Bg < h + Bg + 0.5;          // does a girt at y clash with a door of head height h?
  const wallT = Dg;                                                            // framing thickness outside the steel line
  for (let i = 0; i < dr.bays; i++) for (const side of [1, -1]) {
    const zc = side * (halfW + wallT / 2);
    for (const y of girtY) {
      const door = personnelX.find(px => px > frameX[i] && px < frameX[i + 1]);
      const segs: [number, number][] = door && cutsDoor(y, dP.h) ? [[frameX[i], door - dP.w / 2 - Dg], [door + dP.w / 2 + Dg, frameX[i + 1]]] : [[frameX[i], frameX[i + 1]]];
      for (const [x0, x1] of segs) {
        const g = part(`girt:${(x1 - x0).toFixed(2)}`, () => makeZ('GIRT', Dg, Bg, tG, x1 - x0));
        add(g, frameFromAxes([x0, y, zc], [0, 0, side], [1, 0, 0]), `bay:${i}`, 'girt');   // local x = up (side>0) → bottom flange down, against the column
      }
      for (const [x, sgn] of [[frameX[i], 1], [frameX[i + 1], -1]] as const) {
        const xc = x + sgn * 2.5, yc = y + side * (tG / 2 + 0.125);                   // clip beside the web, opposite the interior flange
        add(clipG, frameFromAxes([xc, yc, side * halfW], [0, 1, 0], [0, 0, side]), `bay:${i}`, 'clip');
        const yFace = y + side * (tG / 2 + 0.25);
        add(clipWeld, alongXY([xc - 2, yFace, side * halfW], [xc + 2, yFace, side * halfW], [0, 0, side], [0, side, 0]), `bay:${i}`, 'weld');
        for (const dz of [-1.5, 1.5]) add(clipBoltG, frameFromAxes([xc, yFace, side * (halfW + Dg / 2 + dz)], [0, 0, side], [0, -side, 0]), `bay:${i}`, 'bolt');
      }
    }
  }
  const ewSupports = [-halfW, ...postZ, halfW];
  for (const [ei, xw] of [0, L].entries()) {
    const sideX = ei === 0 ? -1 : 1, xc = xw + sideX * (wallT / 2);
    for (const y of girtY) for (let k = 0; k < ewSupports.length - 1; k++) {
      const z0 = ewSupports[k], z1 = ewSupports[k + 1];
      const segs: [number, number][] = [];
      if (cutsDoor(y, dE.h) && z1 > -dE.w / 2 - Dg && z0 < dE.w / 2 + Dg) {
        if (z0 < -dE.w / 2 - Dg) segs.push([z0, -dE.w / 2 - Dg]);
        if (z1 > dE.w / 2 + Dg) segs.push([dE.w / 2 + Dg, z1]);
      } else segs.push([z0, z1]);
      for (const [a, b] of segs) {
        const g = part(`girt:${(b - a).toFixed(2)}`, () => makeZ('GIRT', Dg, Bg, tG, b - a));
        add(g, frameFromAxes([xc, y, a], [sideX, 0, 0], [0, 0, 1]), 'endwall', 'girt');
      }
    }
  }
  // eave struts (SW-CF-4): CS at the wall top with web horizontal, flanges up, outside the column
  const eaveProto = part('eave', () => makeCS('EAVE', Dg, Bg, tG, bay));
  for (let i = 0; i < dr.bays; i++) for (const side of [1, -1]) {
    const yE = sheetUnderY(halfW + wallT) - Bg - 0.5;
    add(eaveProto, frameFromAxes([frameX[i], yE, side * (halfW + wallT / 2)], [0, 0, side], [1, 0, 0]), `bay:${i}`, 'eave-strut');
  }

  // ---- bracing rods (SW-PF-8) -------------------------------------------------------------------------
  for (const b of [0, dr.bays - 1]) for (const side of [1, -1]) {
    const x0 = frameX[b], x1 = frameX[b + 1], z = side * zColC;
    for (const [xa, xb] of [[x0, x1], [x1, x0]]) {
      const { tr, len } = along([xa, yBase + 12, z], [xb, He - 12, z], [0, 0, 1]);
      add(part(`rod:${len.toFixed(1)}`, () => makeRod('XR-1', 0.75, len, GRADE_36, 'SW-PF-8')), tr, `bay:${b}`, 'bracing');
    }
    for (const [xa, xb] of [[x0, x1], [x1, x0]]) {
      const { tr, len } = along([xa, yK, side * zCut], [xb, yRidge, 0], [0, cosT, side * sinT]);
      add(part(`rod:${len.toFixed(1)}`, () => makeRod('XR-2', 0.75, len, GRADE_36, 'SW-PF-8')), tr, `bay:${b}`, 'bracing');
    }
  }

  // ---- cladding (SW-CL-1/2) ----------------------------------------------------------------------------
  const cover = PANEL.cover, ribH = PANEL.ribH;
  const wallZ = halfW + wallT;                                          // sidewall sheet pan plane
  const wallX = (ei: number) => (ei === 0 ? -wallT : L + wallT);        // endwall sheet pan plane
  const sideRun = [-(wallT + ribH), L + wallT + ribH];                  // sidewall sheets wrap past the endwall sheets
  /** Tile a wall run [a, b] with sheets of `cover` width, breaking at door edges; pieces inside an opening start at the head. */
  const tileWall = (a: number, b: number, openings: { lo: number; hi: number; head: number }[]) => {
    const cuts = [a, b, ...openings.flatMap(o => [o.lo, o.hi])].filter(c => c >= a && c <= b).sort((p, q) => p - q);
    const pieces: { p0: number; p1: number; y0: number }[] = [];
    for (let k = 0; k < cuts.length - 1; k++) {
      const s0 = cuts[k], s1 = cuts[k + 1]; if (s1 - s0 < 1e-6) continue;
      const mid = (s0 + s1) / 2, op = openings.find(o => mid > o.lo && mid < o.hi);
      for (let hi = s1; hi > s0 + 1e-6; hi -= cover) pieces.push({ p0: Math.max(s0, hi - cover), p1: hi, y0: op ? op.head : 0 });
    }
    return pieces;
  };
  // sidewall sheets: vertical, pan at z = ±wallZ, ribs outward; local x = y × z = (0,0,side) × (0,1,0) = (−side, 0, 0)
  for (const side of [1, -1]) {
    const h = sheetUnderY(wallZ) - 0.5;
    const openings = personnelX.map(px => ({ lo: px - dP.w / 2, hi: px + dP.w / 2, head: dP.h }));
    for (const pc of tileWall(sideRun[0], sideRun[1], openings)) {
      const w = pc.p1 - pc.p0, xs = side > 0 ? pc.p1 : pc.p0;
      const sheet = part(`wall:${w.toFixed(2)}:${(h - pc.y0).toFixed(2)}`, () => makePanel('WS', h - pc.y0, CF_GRADE_50, w));
      add(sheet, frameFromAxes([xs, pc.y0, side * wallZ], [0, 0, side], [0, 1, 0]), 'cladding', 'wall-sheet');
    }
  }
  // endwall sheets: vertical, pan at x = wallX, top cut to the roof line (shear across local x); local x = (0,0,sideX)
  for (const ei of [0, 1]) {
    const sideX = ei === 0 ? -1 : 1, xp = wallX(ei);
    const openings = [{ lo: -dE.w / 2, hi: dE.w / 2, head: dE.h }];
    for (const pc of tileWall(-halfW - wallT, halfW + wallT, openings)) {
      const w = pc.p1 - pc.p0, zStart = sideX > 0 ? pc.p0 : pc.p1;
      const hA = sheetUnderY(zStart) - 0.5, hB = sheetUnderY(zStart + sideX * w) - 0.5, slope = (hB - hA) / w;
      const sheet = part(`end:${w.toFixed(2)}:${(hA - pc.y0).toFixed(2)}:${slope.toFixed(4)}`, () => {
        const sh = makePanel('ES', (hA + hB) / 2 - pc.y0, CF_GRADE_50, w);
        sh.extra = { endCuts: { end: { dx: slope, dy: 0 } } }; sh.length = drawing(hA - pc.y0, 'Sheet length at the first edge (top cut to the roof line, SW-CL-2)');
        return sh;
      });
      add(sheet, frameFromAxes([xp, pc.y0, zStart], [sideX, 0, 0], [0, 1, 0]), 'cladding', 'endwall-sheet');
    }
  }
  // roof sheets: pan on the purlin tops, from the eave overhang up to 1 in short of the ridge
  const zEave = wallZ + ribH + 2, roofLen = (zEave - 1) / cosT;
  for (const side of [1, -1]) {
    const nrm: Vec3 = [0, cosT, side * sinT], up: Vec3 = [0, sinT, -side * cosT];
    const o: Vec3 = [0, sheetUnderY(zEave), side * zEave];
    for (let xs = sideRun[1]; xs > sideRun[0] + 1e-6; xs -= cover) {
      const w = Math.min(cover, xs - sideRun[0]);
      add(part(`roof:${w.toFixed(2)}`, () => makePanel('RS', roofLen, CF_GRADE_50, w)), frameFromAxes([xs, o[1], o[2]], nrm, up), 'cladding', 'roof-sheet');
    }
  }

  // ---- trim (SW-CL-5) ---------------------------------------------------------------------------------
  const faceZ = wallZ + ribH, faceX = (ei: number) => wallX(ei) + (ei === 0 ? -ribH : ribH);
  const cornerTrim = part('ct', () => makeTrim('CT-1', 'corner', 4, 4, He - 1));
  for (const ei of [0, 1]) for (const sz of [-1, 1]) {
    const sx = ei === 0 ? -1 : 1, x = faceX(ei), z = sz * faceZ;
    add(cornerTrim, alongXY([x, 0, z], [x, He - 1, z], [0, 0, -sz], [-sx, 0, 0]), 'trim', 'corner');   // legs back onto both walls
  }
  const baseS = part('bts', () => makeTrim('BT-1', 'base', 3, 2, sideRun[1] - sideRun[0]));
  const baseE = part('bte', () => makeTrim('BT-2', 'base', 3, 2, 2 * faceZ));
  const eaveTrim = part('et', () => makeTrim('ET-1', 'eave', 4, 4, sideRun[1] - sideRun[0]));
  for (const side of [1, -1]) {
    add(baseS, alongXY([sideRun[0], 0, side * faceZ], [sideRun[1], 0, side * faceZ], [0, 0, side], [0, 1, 0]), 'trim', 'base');
    add(eaveTrim, alongXY([sideRun[0], sheetUnderY(wallZ) - 0.5, side * faceZ], [sideRun[1], sheetUnderY(wallZ) - 0.5, side * faceZ], [0, 0, side], [0, -1, 0]), 'trim', 'eave');
  }
  for (const ei of [0, 1]) { const sx = ei === 0 ? -1 : 1; add(baseE, alongXY([faceX(ei), 0, -faceZ], [faceX(ei), 0, faceZ], [sx, 0, 0], [0, 1, 0]), 'trim', 'base'); }
  const rakeLen = (zEave) / cosT;
  const rakeTrim = part('rt', () => makeTrim('RT-1', 'rake', 6, 4, rakeLen));
  for (const ei of [0, 1]) for (const side of [1, -1]) {
    const sx = ei === 0 ? -1 : 1, nrm: Vec3 = [0, cosT, side * sinT];
    const a: Vec3 = [faceX(ei), sheetUnderY(zEave) + ribH / cosT, side * zEave], b: Vec3 = [faceX(ei), sheetUnderY(0) + ribH / cosT, 0];
    add(rakeTrim, alongXY(a, b, [-sx, 0, 0], [-nrm[0], -nrm[1], -nrm[2]]), 'trim', 'rake');
  }
  const ridgeCap = part('rc', () => makeTrim('RC-1', 'ridge cap', 12, 12, sideRun[1] - sideRun[0], CF_GRADE_50, PANEL.t, theta));
  add(ridgeCap, frameFromAxes([sideRun[0], sheetUnderY(0) + ribH / cosT + 0.25, 0], [0, 1, 0], [1, 0, 0]), 'trim', 'ridge');

  // ---- doors (SW-DR-1..3) -------------------------------------------------------------------------------
  const girtAbove = (h: number) => girtY.find(y => !cutsDoor(y, h) || y - Bg > h) ?? He;
  const jambP = part('jambP', () => makeCS('JAMB', Dg, Bg, tG, girtAbove(dP.h) - Bg - 0.5));
  const headP = part('headP', () => makeCS('HEADER', Dg, Bg, tG, dP.w));
  const leaf = part('leaf', () => nonSteel('DL-1', 'DOOR_LEAF', 'personnel door leaf', { w: dP.w, t: dP.leafT }, dP.h));
  const frameJ = part('dfj', () => makeTrim('DF-1', 'door jamb trim', dP.frameFace, Dg, dP.h, CF_GRADE_50, dP.frameT));
  const frameH = part('dfh', () => makeTrim('DF-2', 'door head trim', dP.frameFace, Dg, dP.w, CF_GRADE_50, dP.frameT));
  for (const side of [1, -1]) for (const px of personnelX) {
    const zc = side * (halfW + wallT / 2), zf = side * wallZ;
    for (const sx of [-1, 1]) {
      const xe = px + sx * dP.w / 2;
      add(jambP, frameFromAxes([xe, 0, zc], [0, 0, -sx], [0, 1, 0]), 'door', 'jamb');                      // web at the opening edge, flanges away
      add(frameJ, alongXY([xe, 0, zf], [xe, dP.h, zf], [0, 0, -side], [sx, 0, 0]), 'door', 'frame');
    }
    add(headP, frameFromAxes([px - dP.w / 2, dP.h, zc], [0, 0, side], [1, 0, 0]), 'door', 'header');
    add(frameH, alongXY([px - dP.w / 2, dP.h, zf], [px + dP.w / 2, dP.h, zf], [0, 0, -side], [0, 1, 0]), 'door', 'frame');
    add(leaf, frameFromAxes([px, 0, zc], [0, 0, side], [0, 1, 0]), 'door', 'leaf');
  }
  const jambE = part('jambE', () => makeCS('JAMB', Dg, Bg, tG, girtAbove(dE.h) - Bg - 0.5));
  const headE = part('headE', () => makeCS('HEADER', Dg, Bg, tG, dE.w));
  const curtain = part('curtain', () => nonSteel('RD-1', 'DOOR_CURTAIN', 'roll-up door curtain', { w: dE.w, t: dE.curtainT }, dE.h));
  const drum = part('drum', () => nonSteel('RD-2', 'DOOR_DRUM', 'roll-up door drum', { dia: dE.drumDia }, dE.w + 12));
  const bracket = part('brk', () => makePlate('DB-1', 0.25, 12, dE.drumDia + 6));
  for (const ei of [0, 1]) {
    const sideX = ei === 0 ? -1 : 1, xw = ei === 0 ? 0 : L, xc = xw + sideX * (wallT / 2);
    for (const sz of [-1, 1]) add(jambE, frameFromAxes([xc, 0, sz * dE.w / 2], [-sz, 0, 0], [0, 1, 0]), 'door', 'jamb');
    add(headE, frameFromAxes([xc, dE.h, -dE.w / 2], [-1, 0, 0], [0, 0, 1]), 'door', 'header');
    add(curtain, frameFromAxes([xw - sideX * (dE.curtainT / 2 + 0.5), 0, 0], [sideX, 0, 0], [0, 1, 0]), 'door', 'curtain');
    add(drum, frameFromAxes([xw - sideX * (dE.drumDia / 2 + 2), dE.h + dE.drumDia / 2 + 2, -dE.w / 2 - 6], [0, 1, 0], [0, 0, 1]), 'door', 'drum');
    for (const sz of [-1, 1]) add(bracket, frameFromAxes([xw - sideX * (dE.drumDia / 2 + 2), dE.h, sz * (dE.w / 2 + 6)], [0, 0, sz], [0, 1, 0]), 'door', 'bracket');
  }

  // ---- slab (SW-BLD-3) -------------------------------------------------------------------------------------
  const slab = part('slab', () => nonSteel('SLAB-1', 'CONCRETE', 'floor slab', { w: W + 12, t: dr.slabIn }, L + 12));
  add(slab, frameFromAxes([-6, -dr.slabIn / 2, 0], [0, 1, 0], [1, 0, 0]), 'slab');

  notes.push(`Primary frames W${D}x${wR} (Z ${Z.toFixed(0)} ≥ ${Zreq.toFixed(0)} in³), knee bolts ${db} in, end plates ${tp} in; purlins ${purlinProto.designation}; girts Z${Dg}x${Bg}x${tG}; endwall posts W${Dpost}x${postSize.w}.`);
  notes.push('Preliminary proportions for a visual-reference model (SW-PF-*); wind and seismic not analysed; fasteners and laps not modeled (SW-CL-4, SW-CF-2); post-to-rafter and jamb-to-girt connections not modeled (SW-BLD-4, SW-DR-2).');
  return { drawing: dr, derived, instances: out, notes };
}

/** Non-steel or non-structural parts (concrete, grout, door leaf/curtain/drum). Weight not counted in the steel BOM. */
function nonSteel(id: string, kind: PartSpec['kind'], name: string, dims: Record<string, number>, lengthIn: number): PartSpec {
  const d: Record<string, Dim> = {};
  for (const [k, v] of Object.entries(dims)) d[k] = drawing(v, k);
  return {
    id, kind, category: 'non-steel', designation: name, dims: d,
    length: drawing(lengthIn, 'Length'), material: { grade: 'non-steel', Fy: drawing(0, 'n/a', 'ksi') },
    weight: drawing(0, 'Not steel; weight not counted', 'lb'), notes: [],
  };
}

/** Bill of materials grouped by designation (steel only), from the same instance list that drives the 3D view. */
export function billOfMaterials(model: BuildingModel): { designation: string; kind: string; qty: number; weight: number; rules: string[] }[] {
  const map = new Map<string, { designation: string; kind: string; qty: number; weight: number; rules: Set<string> }>();
  for (const inst of model.instances) {
    const p = inst.part; if (p.category === 'non-steel') continue;
    const key = `${p.designation}|${p.length?.value.toFixed(2) ?? ''}`;
    const e = map.get(key) ?? { designation: p.designation + (p.length ? ` × ${(p.length.value / 12).toFixed(2)} ft` : ''), kind: p.kind, qty: 0, weight: 0, rules: new Set<string>() };
    e.qty++; e.weight += p.weight.value;
    for (const dm of Object.values(p.dims)) if (dm.basis.kind === 'rule') e.rules.add(dm.basis.id);
    map.set(key, e);
  }
  return [...map.values()].map(e => ({ ...e, rules: [...e.rules].sort() })).sort((a, b) => b.weight - a.weight);
}
