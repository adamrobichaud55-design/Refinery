/**
 * Piping generator (stage 5, extended in stage 9): routes every line of a plant's line list through the plant and
 * assembles it into placed parts with weld and support records. DESIGN_BASIS.md §34–39 and §59–63. Output is plain
 * data: each component is a part key plus a transform; `partFromKey` rebuilds the part, so the same data drives the
 * 3D view and the ground-truth export. Plant 1 (every line butt-welded and flanged) is computed exactly as before;
 * the socket-weld and threaded joints, branch outlets, valve stations, 45° offsets, couplings, penetrations and
 * airlocks are the stage-9 additions used by plant 2.
 */
import {
  makePipe, makeFlange, makeBlindFlange, makeGasket, makeValve, makeElbow, makeTee, makeReducer, makeCap, makeButtWeld,
  makeShoe, makeStanchion, makeHanger, makeTrunnion, makeTrapeze, makeStudSet, designFlange, pipeDims, isOffered, elbowRadius, teeC, reducerLength,
  makeSmallElbow, makeSmallTee, makeCoupling, makeOlet, makeSwage, makeNipple, makePlug, makeSlipOnFlange, makeSocketWeldFlange, makeSpade, makeSpectacleBlind,
  makeFloorSleeve, makeWallSleeve, makeSocketWeld, makeFilletRing, smallBore, smallElbowA, smallTeeC, oletHeight, swageLength, closeNippleLength, threadedWall, endLength,
  type PartSpec, type PipeClass, type ValveType, type ValveEnds, type JointEnd, type NippleEnds,
} from '../catalogue';
import { frameFromAxes, type Vec3 } from '../geometry/transform';
import type { Mat4 } from '../geometry/mesh';
import { buildGeometry } from '../geometry/partGeometry';
import { transformMesh } from '../geometry/mesh';
import { Grid, route, corners, H, STATIC, DIRS, dirIndex, type V3 } from './router';
import { type Nozzle } from './nozzles';
import { type LineDef, type EndRef } from './linelist';
import { type Placed } from './building';
import { boxGap, segBox } from './pipingCheck';
import { lineClassCode } from './lineclass';
import { PLANT1, type PlantDef, type GratingCut } from './plant';

/** environment variable when run under Node (debug output only); undefined in the browser */
const envVar = (k: string): string | undefined => (globalThis as { process?: { env?: Record<string, string> } }).process?.env?.[k];

// ---- vectors ---------------------------------------------------------------------------------------------
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const unit = (a: V3): V3 => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const neg = (a: V3): V3 => [-a[0], -a[1], -a[2]];
const snapUp = (v: number) => Math.ceil(v / H - 1e-9) * H;
/** First routed point beyond an end stack: one elbow radius out, snapped outward to the grid; if that would leave a
 *  pipe shorter than SW-RT-4's 2 in between the stack and the elbow, one more grid step (the elbow may also weld
 *  straight to the stack when the snap lands exactly). */
function leadP1(end: V3, u: V3, Rr: number): V3 {
  const ax = u.findIndex(v => v !== 0), sgn = u[ax], P1 = [...end] as V3;
  let s = sgn > 0 ? snapUp(end[ax] + Rr) : -snapUp(-(end[ax] - Rr));
  const gap = sgn * (s - end[ax]) - Rr; if (gap > 0.05 && gap < 2) s += sgn * H;
  P1[ax] = s; return P1;
}
/** any unit vector perpendicular to w, preferring world up, then +x */
const perp = (w: V3): V3 => Math.abs(w[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];

// ---- part keys -------------------------------------------------------------------------------------------
const memo = new Map<string, PartSpec>();
export function partFromKey(key: string): PartSpec {
  let p = memo.get(key); if (p) return p;
  const a = key.split('|'), n = (i: number) => Number(a[i]), c = (i: number) => a[i] as PipeClass, j = (i: number) => a[i] as JointEnd;
  switch (a[0]) {
    case 'PIPE': p = a[4] === 'TH' ? threadedPipe(key, n(1), c(2), n(3)) : makePipe(key, n(1), c(2), n(3)); break;
    case 'EL': p = makeElbow(key, n(1), c(2), n(3) as 90 | 45); break;
    case 'SWEL': p = makeSmallElbow(key, n(1), c(2), n(3) as 90 | 45, a[4] as 'SW' | 'TH'); break;
    case 'TEE': p = makeTee(key, n(1), c(2), n(3)); break;
    case 'SWTEE': p = makeSmallTee(key, n(1), c(2), a[4] as 'SW' | 'TH', n(3)); break;
    case 'RED': p = makeReducer(key, n(1), n(2), c(3), 'none'); break;
    case 'REDE': p = makeReducer(key, n(1), n(2), c(3), a[4] as 'top' | 'bottom'); break;
    case 'CAP': p = makeCap(key, n(1), c(2)); break;
    case 'WNF': p = makeFlange(key, n(1), c(2)); break;
    case 'SOF': p = makeSlipOnFlange(key, n(1), c(2)); break;
    case 'SWF': p = makeSocketWeldFlange(key, n(1), c(2)); break;
    case 'BLIND': p = makeBlindFlange(key, n(1), c(2)); break;
    case 'SPADE': p = makeSpade(key, n(1), c(2)); break;
    case 'SPEC': p = makeSpectacleBlind(key, n(1), c(2)); break;
    case 'GSK': p = makeGasket(key, n(1), c(2)); break;
    case 'STUDS': p = makeStudSet(key, n(1), c(2), n(3)); break;
    case 'VLV': p = makeValve(key, a[1] as ValveType, n(2), c(3), (a[4] as ValveEnds | undefined) ?? 'RF'); break;
    case 'CPLG': p = makeCoupling(key, n(1), c(2), a[3] as 'SW' | 'TH'); break;
    case 'OLET': p = makeOlet(key, n(1), n(2), c(3), j(4)); break;
    case 'SWG': p = makeSwage(key, n(1), n(2), c(3), j(4), j(5)); break;
    case 'NIP': p = makeNipple(key, n(1), c(2), n(3), a[4] as NippleEnds); break;
    case 'PLUG': p = makePlug(key, n(1), c(2), a[3] === 'SW'); break;
    case 'FSLV': p = makeFloorSleeve(key, n(1), c(2)); break;
    case 'WSLV': p = makeWallSleeve(key, n(1), c(2)); break;
    case 'BW': p = makeButtWeld(key, n(1), c(2)); break;
    case 'SWW': p = makeSocketWeld(key, n(1), c(2)); break;
    case 'FWR': p = makeFilletRing(key, n(1), n(2)); break;
    case 'SHOE': p = makeShoe(key, n(1), c(2), a[3] as 'shoe' | 'guide' | 'anchor', a[4] ? n(4) : 4); break;
    case 'STAN': p = makeStanchion(key, n(1), c(2), n(3)); break;
    case 'HANG': p = makeHanger(key, n(1), c(2), n(3)); break;
    case 'TRUN': p = makeTrunnion(key, n(1), c(2), n(3)); break;
    case 'TRAP': p = makeTrapeze(key, n(1), c(2), n(3), n(4)); break;
    default: throw new Error(`unknown part key ${key}`);
  }
  memo.set(key, p); return p;
}
/** pipe supplied for threading (SW-SWT-2): the pipe part with the heavier wall */
function threadedPipe(key: string, NPS: number, cls: PipeClass, L: number): PartSpec {
  const p = makePipe(key, NPS, cls, L), t = threadedWall(NPS, cls), D = NPS - 2 * t, A = (Math.PI / 4) * (NPS ** 2 - D ** 2);
  p.designation = `PIPE${NPS}-${cls}-TH`;
  p.dims.t = { ...p.dims.t, value: t, basis: { kind: 'rule', id: 'SW-SWT-2' }, label: 'Wall thickness (threaded class)' };
  p.dims.D = { ...p.dims.D, value: D }; p.dims.A = { ...p.dims.A, value: A }; p.weight = { ...p.weight, value: A * L * (p.weight.value / (p.dims.A.value * L || 1)) };
  p.weight.value = A * L * 490 / 1728;
  return p;
}

// ---- records (ground truth, SW-PW-3) ---------------------------------------------------------------------------
/** end connection types: BW bevel, SW a socket (on this part), SP a plain end that enters a socket, TH threaded, RF a flange
 *  face, SO the bore of a slip-on flange (the pipe enters it), X none */
export type EndT = 'BW' | 'SW' | 'SP' | 'TH' | 'RF' | 'SO' | 'X';
export interface Comp { tag: string; kind: string; key: string; T: Mat4; a: V3; b: V3; NPS: number; cls: PipeClass; e1?: EndT; e2?: EndT; ins?: [number, number]; onRun?: string }
export interface WeldRec { id: string; line: string; type: 'BW' | 'SW' | 'FW'; size: number; at: V3; dir: V3; joins: [string, string]; field: boolean; NPS: number; key: string; T: Mat4 }
export interface SupportRec { id: string; line: string; type: 'shoe' | 'guide' | 'anchor' | 'stanchion' | 'hanger' | 'trunnion' | 'trapeze'; at: V3; key: string; T: Mat4 }
export interface LineRun { no: string; service: string; NPS: number; cls: PipeClass; lineClass?: string; kind: LineDef['kind']; from: string; to: string; comps: Comp[]; welds: WeldRec[]; supports: SupportRec[]; pens?: Comp[]; side?: Comp[]; path: V3[]; ok: boolean; note?: string; cv?: boolean; joint?: JointEnd }
export interface NozzleRun { id: string; equip: string; service: string; NPS: number; cls: PipeClass; face: V3; u: V3; comps: Comp[]; welds: WeldRec[] }
export interface PipingModel { plant?: string; lines: LineRun[]; nozzles: NozzleRun[]; failures: string[]; stats: Record<string, number>; cuts?: GratingCut[] }

// ---- dimensions of stack items --------------------------------------------------------------------------
const flangeLen = (NPS: number, cls: PipeClass) => { const f = designFlange(NPS, cls); return { f, Lf: f.tf + f.hubLen + f.neckLen, rf: f.rfH }; };
function valveF2F(type: ValveType, NPS: number, cls: PipeClass, ends: ValveEnds = 'RF') { const v = partFromKey(`VLV|${type}|${NPS}|${cls}${ends === 'RF' ? '' : '|' + ends}`); return v.dims.F2F.value + (ends === 'RF' ? 2 * designFlange(NPS, cls).rfH : 0); }

type Item =
  | { k: 'gasket'; NPS: number; cls: PipeClass }
  | { k: 'valve'; type: ValveType; NPS: number; cls: PipeClass; stem?: V3; ends?: ValveEnds; sides?: boolean }   // sides: a four-way gauge manifold's side ports fitted (SW-LL-7)
  | { k: 'swtee'; NPS: number; cls: PipeClass }   // SW-LL-7: a socket-weld tee in a stub with its branch plugged
  | { k: 'wnf' | 'wnfR' | 'blind' | 'blindR' | 'sof' | 'sofR' | 'swf' | 'swfR'; NPS: number; cls: PipeClass }
  | { k: 'spade' | 'spec'; NPS: number; cls: PipeClass }
  | { k: 'reducer'; from: number; to: number; cls: PipeClass; flat?: 'top' | 'bottom' }
  | { k: 'pipe'; NPS: number; cls: PipeClass; L: number; joint?: JointEnd }
  | { k: 'nipple'; NPS: number; cls: PipeClass; L: number; ends: NippleEnds; rev?: boolean }
  | { k: 'coupling'; NPS: number; cls: PipeClass; end: 'SW' | 'TH' }
  | { k: 'swage'; from: number; to: number; cls: PipeClass; e1: JointEnd; e2: JointEnd }
  | { k: 'plug'; NPS: number; cls: PipeClass; socket?: boolean }
  | { k: 'psv'; NPS: number; cls: PipeClass; out: V3; runDir?: V3 };   // runDir: the run a tap stub stands on; the outlet is set square to it
interface Built { comps: Comp[]; end: V3; endIsWeld: boolean; extra?: { psvOutletFace?: V3; psvOutDir?: V3; psvOutNPS?: number; side?: Comp[] } }   // side: items on side ports (SW-LL-7), kept apart from the chain

/** Build a stack of items along w starting at s (the face or weld end they start from). Every component carries its end
 *  connection types (e1 at a, e2 at b) so the welds follow from the chain (SW-PW-1, SW-SWT-1/2, SW-FLG-10/11). */
function buildStack(line: string, s: V3, w: V3, items: Item[], prevTag: string): Built {
  const comps: Comp[] = []; let p = s, lastWeld = false, extra: Built['extra'];
  const yUp = perp(w), stemDir: V3 = Math.abs(w[1]) < 0.9 ? [0, 1, 0] : [0, 0, w[1] > 0 ? 1 : -1];
  let pendingJoint: { at: V3; NPS: number; cls: PipeClass; stack: number } | null = null;
  const push = (c: Omit<Comp, 'tag'>) => { comps.push({ tag: `${line}/${comps.length + 1}`, ...c }); };
  for (const it of items) {
    if (it.k === 'gasket') {
      const f = designFlange(it.NPS, it.cls);
      push({ kind: 'gasket', key: `GSK|${it.NPS}|${it.cls}`, T: frameFromAxes(p, yUp, w), a: p, b: add(p, w, f.gasketT), NPS: it.NPS, cls: it.cls, e1: 'X', e2: 'X' });
      if (pendingJoint) pendingJoint.stack += f.gasketT;                              // the second gasket of a joint holding a spade or spectacle blind
      else pendingJoint = { at: add(p, w, f.gasketT / 2), NPS: it.NPS, cls: it.cls, stack: 2 * (f.tf + f.rfH) + f.gasketT };
      p = add(p, w, f.gasketT); lastWeld = false;
    } else if (it.k === 'spade' || it.k === 'spec') {
      const part = partFromKey(`${it.k === 'spade' ? 'SPADE' : 'SPEC'}|${it.NPS}|${it.cls}`), t = part.dims.t.value, c = add(p, w, t / 2);
      push({ kind: it.k === 'spade' ? 'spade' : 'spectacle', key: part.id, T: frameFromAxes(c, stemDir, w), a: p, b: add(p, w, t), NPS: it.NPS, cls: it.cls, e1: 'RF', e2: 'RF' });
      if (pendingJoint) { pendingJoint.stack += t; pendingJoint.at = add(pendingJoint.at, w, (t + designFlange(it.NPS, it.cls).gasketT) / 2); }
      p = add(p, w, t); lastWeld = false;
    } else if (it.k === 'valve') {
      const ends = it.ends ?? 'RF', L = valveF2F(it.type, it.NPS, it.cls, ends), c = add(p, w, L / 2);
      const T = frameFromAxes(c, it.stem ?? stemDir, w);
      push({ kind: 'valve', key: `VLV|${it.type}|${it.NPS}|${it.cls}${ends === 'RF' ? '' : '|' + ends}`, T, a: p, b: add(p, w, L), NPS: it.NPS, cls: it.cls, e1: ends, e2: ends });
      if (it.sides && it.type === 'FWAY' && ends === 'SW') {   // SW-LL-7: one side port a purge needle valve on a one-end-threaded nipple with a plug, the other a socket plug
        const v = partFromKey(`VLV|FWAY|${it.NPS}|${it.cls}|SW`), sb = smallBore(it.NPS, it.cls), reach = v.dims.sideC.value + sb.tf + endLength(sb, 'SW'), vt = comps[comps.length - 1].tag, side: Comp[] = extra?.side ?? [];
        const xd: V3 = unit([T[0], T[1], T[2]]);
        const pa = buildStack(line, add(c, xd, reach), xd, [{ k: 'nipple', NPS: it.NPS, cls: it.cls, L: 4, ends: 'TOE' }, { k: 'valve', type: 'NEEDLE', NPS: Math.min(it.NPS, 1), cls: it.cls, ends: 'TH' }, { k: 'plug', NPS: Math.min(it.NPS, 1), cls: it.cls }], vt);
        const pb = buildStack(line, add(c, xd, -reach), neg(xd), [{ k: 'nipple', NPS: it.NPS, cls: it.cls, L: 4, ends: 'TOE' }, { k: 'valve', type: 'GATE', NPS: it.NPS, cls: it.cls, ends: 'TH' }, { k: 'plug', NPS: it.NPS, cls: it.cls }], vt);   // SW-LL-8 (1): a plug only in a valve's end
        side.push(...pa.comps.map((x, i) => ({ ...x, tag: `${vt}:A${i + 1}` })), ...pb.comps.map((x, i) => ({ ...x, tag: `${vt}:B${i + 1}` })));
        extra = { ...(extra ?? {}), side };
      }
      p = add(p, w, L); lastWeld = false;
    } else if (it.k === 'swtee') {
      const sb = smallBore(it.NPS, it.cls), C = smallTeeC(sb, 'SW'), c = add(p, w, C), bd = stemDir;
      push({ kind: 'tee', key: `SWTEE|${it.NPS}|${it.cls}|${it.NPS}|SW`, T: frameFromAxes(c, bd, w), a: p, b: add(p, w, 2 * C), NPS: it.NPS, cls: it.cls, e1: 'SW', e2: 'SW' });
      const tt = comps[comps.length - 1].tag, pb = buildStack(line, add(c, bd, C), bd, [{ k: 'nipple', NPS: it.NPS, cls: it.cls, L: 4, ends: 'TOE' }, { k: 'valve', type: 'GATE', NPS: it.NPS, cls: it.cls, ends: 'TH' }, { k: 'plug', NPS: it.NPS, cls: it.cls }], tt), side: Comp[] = extra?.side ?? [];   // SW-LL-8 (1)
      side.push(...pb.comps.map((x, i) => ({ ...x, tag: `${tt}:P${i + 1}` }))); extra = { ...(extra ?? {}), side };
      p = add(p, w, 2 * C); lastWeld = false;
    } else if (it.k === 'psv') {
      const v = partFromKey(`VLV|PSV|${it.NPS}|${it.cls}`), f = designFlange(it.NPS, it.cls), CFin = v.dims.CFin.value, CFout = v.dims.CFout.value;
      const out: V3 = len(it.out) > 0.5 ? it.out : it.runDir && len(cross(it.runDir, w)) > 0.5 ? unit(cross(it.runDir, w)) : Math.abs(w[1]) > 0.5 ? [1, 0, 0] : [0, 1, 0];
      const o = add(p, w, f.rfH + CFin), outNPS = v.dims.outlet.value, fo = designFlange(outNPS, 'P150');
      push({ kind: 'valve', key: `VLV|PSV|${it.NPS}|${it.cls}`, T: frameFromAxes(o, w, out), a: p, b: o, NPS: it.NPS, cls: it.cls, e1: 'RF', e2: 'RF' });
      extra = { psvOutletFace: add(o, out, CFout + fo.rfH), psvOutDir: out, psvOutNPS: outNPS };
      p = o; lastWeld = false;
    } else if (it.k === 'wnf' || it.k === 'wnfR' || it.k === 'blind' || it.k === 'blindR' || it.k === 'sof' || it.k === 'sofR' || it.k === 'swf' || it.k === 'swfR') {
      const { Lf, rf } = flangeLen(it.NPS, it.cls), blind = it.k.startsWith('blind'), so = it.k.startsWith('sof'), sw = it.k.startsWith('swf');
      const keyName = blind ? 'BLIND' : so ? 'SOF' : sw ? 'SWF' : 'WNF', part = partFromKey(`${keyName}|${it.NPS}|${it.cls}`);
      const body = blind ? part.dims.tb.value : so || sw ? part.length!.value : Lf;
      const faceBack = it.k === 'wnf' || it.k === 'blind' || it.k === 'sof' || it.k === 'swf';           // face toward −w (the joint behind), weld end / back toward +w
      // local frame: face at local z = −rf, body toward +z; choose local z = +w (face back) or −w (face forward)
      const zDir = faceBack ? w : neg(w), origin = faceBack ? add(p, w, rf) : add(p, w, body);
      const backEnd: EndT = blind ? 'X' : so ? 'SO' : sw ? 'SW' : 'BW';
      push({ kind: blind ? 'blind' : 'flange', key: part.id, T: frameFromAxes(origin, yUp, zDir), a: p, b: add(p, w, rf + body), NPS: it.NPS, cls: it.cls, e1: faceBack ? 'RF' : backEnd, e2: faceBack ? backEnd : 'RF' });
      p = add(p, w, rf + body); lastWeld = faceBack && !blind;
    } else if (it.k === 'reducer') {
      const a = pipeDims(it.from, it.cls), b = pipeDims(it.to, it.cls), big = Math.max(a.OD, b.OD), sm = Math.min(a.OD, b.OD), Hh = reducerLength(big, sm);
      const growing = it.to > it.from, zDir = growing ? neg(w) : w, origin = growing ? add(p, w, Hh) : p;
      const key = it.flat ? `REDE|${Math.max(it.from, it.to)}|${Math.min(it.from, it.to)}|${it.cls}|${it.flat}` : `RED|${Math.max(it.from, it.to)}|${Math.min(it.from, it.to)}|${it.cls}`;
      // an eccentric reducer keeps its flat side where stated: its local −y is the flat ('bottom'); the frame's y must then be world up
      push({ kind: 'reducer', key, T: frameFromAxes(origin, it.flat ? [0, 1, 0] : yUp, zDir), a: p, b: add(p, w, Hh), NPS: it.to, cls: it.cls, e1: 'BW', e2: 'BW' });
      p = add(p, w, Hh); lastWeld = true;
    } else if (it.k === 'pipe') {
      const joint = it.joint ?? 'BW', e: EndT = joint === 'BW' ? 'BW' : joint === 'SW' ? 'SP' : 'TH';
      push({ kind: 'pipe', key: `PIPE|${it.NPS}|${it.cls}|${it.L.toFixed(3)}${joint === 'TH' ? '|TH' : ''}`, T: frameFromAxes(p, yUp, w), a: p, b: add(p, w, it.L), NPS: it.NPS, cls: it.cls, e1: e, e2: e });
      p = add(p, w, it.L); lastWeld = joint === 'BW';
    } else if (it.k === 'nipple') {
      const ends = it.ends, eA: EndT = ends === 'TBE' ? 'TH' : ends === 'PBE' ? 'SP' : it.rev ? 'TH' : 'BW', eB: EndT = ends === 'TBE' ? 'TH' : ends === 'PBE' ? 'SP' : it.rev ? 'BW' : 'TH';
      push({ kind: 'nipple', key: `NIP|${it.NPS}|${it.cls}|${it.L.toFixed(3)}|${ends}`, T: frameFromAxes(p, yUp, w), a: p, b: add(p, w, it.L), NPS: it.NPS, cls: it.cls, e1: eA, e2: eB });
      p = add(p, w, it.L); lastWeld = false;
    } else if (it.k === 'coupling') {
      const part = partFromKey(`CPLG|${it.NPS}|${it.cls}|${it.end}`), L = part.length!.value;
      push({ kind: 'coupling', key: part.id, T: frameFromAxes(p, yUp, w), a: p, b: add(p, w, L), NPS: it.NPS, cls: it.cls, e1: it.end, e2: it.end });
      p = add(p, w, L); lastWeld = false;
    } else if (it.k === 'swage') {
      const { L } = swageLength(it.from, it.to, it.cls, it.e1, it.e2), growing = it.to > it.from;
      // the part has its large end at local z = 0: for a growing stack the frame points back along −w from the far end
      const key = growing ? `SWG|${it.to}|${it.from}|${it.cls}|${it.e2}|${it.e1}` : `SWG|${it.from}|${it.to}|${it.cls}|${it.e1}|${it.e2}`;
      push({ kind: 'swage', key, T: frameFromAxes(growing ? add(p, w, L) : p, yUp, growing ? neg(w) : w), a: p, b: add(p, w, L), NPS: Math.max(it.from, it.to), cls: it.cls, e1: it.e1 === 'SW' ? 'SW' : it.e1, e2: it.e2 === 'SW' ? 'SW' : it.e2 });
      p = add(p, w, L); lastWeld = false;
    } else if (it.k === 'plug') {
      const part = partFromKey(`PLUG|${it.NPS}|${it.cls}${it.socket ? '|SW' : ''}`), hh = part.dims.headH.value;
      // the plug's shank goes back into the item before it; its head base is at p
      push({ kind: 'plug', key: part.id, T: frameFromAxes(p, yUp, w), a: p, b: add(p, w, hh), NPS: it.NPS, cls: it.cls, e1: it.socket ? 'SP' : 'TH', e2: 'X' });
      p = add(p, w, hh); lastWeld = false;
    }
    if (pendingJoint && it.k !== 'gasket' && it.k !== 'spade' && it.k !== 'spec' && comps.length >= 2 && comps[comps.length - 2].kind === 'gasket') {
      const j = pendingJoint, f = designFlange(j.NPS, j.cls);
      comps.push({ tag: `${line}/${comps.length + 1}`, kind: 'studs', key: `STUDS|${j.NPS}|${j.cls}|${j.stack.toFixed(3)}`, T: frameFromAxes(j.at, yUp, w), a: add(j.at, w, -f.studLen / 2), b: add(j.at, w, f.studLen / 2), NPS: j.NPS, cls: j.cls, e1: 'X', e2: 'X' });
      pendingJoint = null;
    }
  }
  void prevTag;
  return { comps, end: p, endIsWeld: lastWeld, extra };
}
const stackLength = (items: Item[]) => buildStack('x', [0, 0, 0], [0, 0, 1], items, 'x').end[2];

/** SW-SWT-1/2: a plain pipe end entering a socket or thread is drawn to its insertion depth; the record keeps the mouth
 *  as the meeting point and the cut length includes the insertion */
function settleInsertions(comps: Comp[]) {
  const c = comps.filter(x => x.kind !== 'studs');
  for (let i = 0; i < c.length; i++) {
    const x = c[i]; if (x.kind !== 'pipe' && x.kind !== 'nipple') continue;
    const insOf = (own: EndT | undefined, other: EndT | undefined, NPS: number, cls: PipeClass) => {
      if (own === 'SP' && other === 'SW') return smallBore(NPS, cls).s - 1 / 16;
      if (own === 'TH' && other === 'TH') return smallBore(NPS, cls).Lt;
      if ((own === 'SP' || own === 'BW') && other === 'SO') { const f = partFromKey(`SOF|${NPS}|${cls}`); return f.length!.value - (f.extra!.setback as number); }
      return 0;
    };
    const i1 = i > 0 ? insOf(x.e1, c[i - 1].e2, x.NPS, x.cls) : 0, i2 = i < c.length - 1 ? insOf(x.e2, c[i + 1].e1, x.NPS, x.cls) : 0;
    if (!i1 && !i2) continue;
    const w = unit(sub(x.b, x.a)), L = len(sub(x.b, x.a)) + i1 + i2, k = x.key.split('|');
    x.ins = [i1, i2]; k[3] = L.toFixed(3); x.key = k.join('|');
    x.T = frameFromAxes(add(x.a, w, -i1), perp(w), w);
  }
}

// ---- the static plant as obstacles (shared by the router and the checks) ------------------------------------
const xf = (T: Mat4, p: V3): V3 => [T[0] * p[0] + T[4] * p[1] + T[8] * p[2] + T[12], T[1] * p[0] + T[5] * p[1] + T[9] * p[2] + T[13], T[2] * p[0] + T[6] * p[1] + T[10] * p[2] + T[14]];
const boxXf = (b: [V3, V3], T: Mat4): [V3, V3] => { const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity];
  for (let c = 0; c < 8; c++) { const q = xf(T, [c & 1 ? b[1][0] : b[0][0], c & 2 ? b[1][1] : b[0][1], c & 4 ? b[1][2] : b[0][2]]); for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], q[a]); mx[a] = Math.max(mx[a], q[a]); } } return [mn, mx]; };
const sbCache = new WeakMap<PartSpec, [V3, V3][]>();
/** local bounding box of each drawn solid of a part */
export function solidBoxes(p: PartSpec): [V3, V3][] {
  let r = sbCache.get(p); if (r) return r; r = [];
  for (const so of buildGeometry(p).solids) { const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity], P = so.mesh.positions;
    for (let i = 0; i < P.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], P[i + a]); mx[a] = Math.max(mx[a], P[i + a]); }
    if (isFinite(mn[0])) r.push([mn, mx]); }
  sbCache.set(p, r); return r;
}
const unionBox = (bs: [V3, V3][]): [V3, V3] | null => { if (!bs.length) return null; const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity]; for (const b of bs) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], b[0][a]); mx[a] = Math.max(mx[a], b[1][a]); } return [mn, mx]; };
/** world bounding box of a placed part */
export const worldBox = (p: PartSpec, T: Mat4): [V3, V3] | null => { const b = unionBox(solidBoxes(p)); return b ? boxXf(b, T) : null; };
const MEMBERS = new Set(['W', 'C', 'L', 'HSS_RECT', 'HSS_ROUND', 'Z', 'CS', 'ROD', 'PIPE']);
export type Obstacle = { tag: string; kind: 'cap'; a: V3; b: V3; r: number } | { tag: string; kind: 'box'; mn: V3; mx: V3 };
export interface Statics { obstacles: Obstacle[]; headroom: [V3, V3][]; gratings: { box: [V3, V3]; top: number; tag: string }[] }
/** members (lengths of section) as capsules on their axis; every other solid by its own box (so a nozzle between
 *  saddles stays clear); headroom zones above gratings and treads (SW-RT-3). Cladding, trim, anchor rods and the
 *  slab are left out (the floor is handled as a plane). With `throughGratings` (SW-PEN-4) the grating panels are
 *  listed separately instead of as obstacles. */
export function staticObstacles(building: Placed[], interior: Placed[], throughGratings = false): Statics {
  const obstacles: Obstacle[] = [], headroom: [V3, V3][] = [], gratings: Statics['gratings'] = [];
  for (const pl of [...building.filter(p => !p.tags.includes('cladding') && !p.tags.includes('trim')), ...interior]) {
    if (pl.tags.includes('anchor-rod') || pl.tags.includes('slab')) continue;
    const p = pl.part, tag = pl.tags.join('/');
    if (throughGratings && pl.tags.includes('grating')) { const wb = worldBox(p, pl.transform); if (wb) gratings.push({ box: wb, top: wb[1][1], tag }); }
    else if (MEMBERS.has(p.kind) && p.length) {
      const b = unionBox(solidBoxes(p)); if (!b) continue;
      const cx = (b[0][0] + b[1][0]) / 2, cy = (b[0][1] + b[1][1]) / 2, r = Math.hypot(b[1][0] - b[0][0], b[1][1] - b[0][1]) / 2;
      obstacles.push({ tag, kind: 'cap', a: xf(pl.transform, [cx, cy, b[0][2]]), b: xf(pl.transform, [cx, cy, b[1][2]]), r });
    } else for (const b of solidBoxes(p)) { const wb = boxXf(b, pl.transform); obstacles.push({ tag, kind: 'box', mn: wb[0], mx: wb[1] }); }
    if (pl.tags.includes('grating') || pl.tags.includes('tread')) { const wb = worldBox(p, pl.transform); if (wb) headroom.push([[wb[0][0], wb[1][1], wb[0][2]], [wb[1][0], wb[1][1] + 84, wb[1][2]]]); }
  }
  return { obstacles, headroom, gratings };
}
/** the static plant (members as capsules, other solids as boxes) for the clearance checks */
export function staticPlant(plant: PlantDef = PLANT1): Obstacle[] { return staticObstacles(plant.building().instances, plant.interior().instances, plant.verticalThroughPlatforms).obstacles; }

// ---- welds derived from a component chain (SW-PW-1/3, SW-SWT-1, SW-FLG-10) ---------------------------------------
const WELDED = new Set(['pipe', 'elbow', 'tee', 'reducer', 'cap']);
interface ExtJoint { at: V3; tag: string; NPS: number; cls: PipeClass; w: V3; type?: 'BW' | 'SW' | 'FW'; join?: string }   // join: the part this joint welds to (an outlet's base weld joins the outlet, SW-GT-7)
function weldRec(line: string, i: number, type: 'BW' | 'SW' | 'FW', at: V3, w: V3, NPS: number, cls: PipeClass, joins: [string, string], field: boolean, legOverride?: number): WeldRec {
  const key = type === 'BW' ? `BW|${NPS}|${cls}` : type === 'SW' ? `SWW|${NPS}|${cls}` : `FWR|${pipeDims(NPS, cls).OD / 2}|${legOverride ?? smallBore(NPS, cls).tf}`;
  const size = type === 'BW' ? pipeDims(NPS, cls).t : type === 'SW' ? smallBore(NPS, cls).leg : legOverride ?? smallBore(NPS, cls).tf;
  return { id: `${line}/W${i}`, line, type, size, at, dir: w, joins, field, NPS, key, T: frameFromAxes(at, perp(w), w) };
}
/** the ends of a component that face each other across a joint */
const facing = (x: Comp, y: Comp): { ex: EndT | undefined; ey: EndT | undefined; at: V3; w: V3 } => {
  const ds = [[x.a, y.a, x.e1, y.e1], [x.a, y.b, x.e1, y.e2], [x.b, y.a, x.e2, y.e1], [x.b, y.b, x.e2, y.e2]] as [V3, V3, EndT | undefined, EndT | undefined][];
  const best = ds.map(([p, q, ex, ey]) => ({ d: len(sub(p, q)), at: p, ex, ey })).sort((u, v) => u.d - v.d)[0];
  const w = unit(sub(y.b, y.a)); return { ex: best.ex, ey: best.ey, at: best.at, w: len(w) ? w : [0, 0, 1] };
};
/** one weld at every joint of the chain where the two facing ends call for one: bevel to bevel a butt weld, a plain end
 *  in a socket a socket weld, a plain end in a slip-on flange two fillets; `ext` adds joints to components outside the
 *  chain (a parent's tee outlet, the run an olet sits on); welds at `fieldAt` points are field welds */
export function deriveWelds(line: string, comps: Comp[], ext: ExtJoint[], fieldAt: V3[]): WeldRec[] {
  const c = comps.filter(x => x.kind !== 'studs'), out: WeldRec[] = [];
  const isField = (p: V3) => fieldAt.some(q => len(sub(p, q)) < 1e-3);
  for (const e of ext) { const first = c.reduce((best, x) => Math.min(len(sub(x.a, e.at)), len(sub(x.b, e.at))) < Math.min(len(sub(best.a, e.at)), len(sub(best.b, e.at))) ? x : best, c[0]);
    out.push(weldRec(line, out.length + 1, e.type ?? 'BW', e.at, e.w, e.NPS, e.cls, [e.tag, e.join ?? first.tag], e.type !== 'FW')); }
  for (let i = 1; i < c.length; i++) {
    const x = c[i - 1], y = c[i];
    if (x.e1 === undefined || y.e1 === undefined) {                                   // plant 1 records (no end types): the stage-5 rule
      const isButt = (WELDED.has(x.kind) && (WELDED.has(y.kind) || y.kind === 'flange')) || (WELDED.has(y.kind) && x.kind === 'flange');
      if (!isButt) continue;
      const ds = [[x.a, y.a], [x.a, y.b], [x.b, y.a], [x.b, y.b]].map(([p, q]) => ({ p, d: len(sub(p, q)) })).sort((u, v) => u.d - v.d), at = ds[0].p;
      const NPS = y.kind === 'reducer' ? x.NPS : x.kind === 'reducer' ? y.NPS : x.NPS, w = unit(sub(y.b, y.a));
      out.push(weldRec(line, out.length + 1, 'BW', at, len(w) ? w : [0, 0, 1], NPS, x.cls, [x.tag, y.tag], isField(at)));
      continue;
    }
    const { ex, ey, at, w } = facing(x, y);
    const NPS = y.kind === 'reducer' || y.kind === 'swage' ? x.NPS : x.kind === 'reducer' || x.kind === 'swage' ? y.NPS : x.NPS;
    const soOrSw = (c: Comp) => c.kind === 'flange' && /^(SOF|SWF)\|/.test(c.key);
    if (ex === 'BW' && ey === 'BW') out.push(weldRec(line, out.length + 1, 'BW', at, w, NPS, x.cls, [x.tag, y.tag], isField(at) && !soOrSw(x) && !soOrSw(y)));   // SW-LL-8 (2)
    else if ((ex === 'SW' && ey === 'SP') || (ex === 'SP' && ey === 'SW')) out.push(weldRec(line, out.length + 1, 'SW', at, w, Math.min(x.NPS, y.NPS), x.cls, [x.tag, y.tag], false));   // SW-LL-8 (2): socket welds are shop welds
    else if ((ex === 'SO' && (ey === 'SP' || ey === 'BW')) || ((ex === 'SP' || ex === 'BW') && ey === 'SO')) {
      const fl = ex === 'SO' ? x : y, pipe = fl === x ? y : x, leg = pipeDims(pipe.NPS, pipe.cls).t, back = at, face = fl === x ? (len(sub(x.a, at)) < 1e-6 ? x.b : x.a) : (len(sub(y.a, at)) < 1e-6 ? y.b : y.a);
      out.push(weldRec(line, out.length + 1, 'FW', back, w, pipe.NPS, pipe.cls, [fl.tag, pipe.tag], false, leg));            // at the hub back (shop, SW-LL-8 (2))
      out.push(weldRec(line, out.length + 1, 'FW', face, w, pipe.NPS, pipe.cls, [fl.tag, pipe.tag], false, leg));            // inside at the pipe end (SW-FLG-10)
    }
  }
  return out;
}

// ---- the generator -----------------------------------------------------------------------------------------
interface EndPlan { P1: V3; dirOut: V3; built?: Built; startFace?: V3; zone: V3; tap?: { parent: string; at: V3; out: V3; NPS: number; via: TapVia }; tapComps?: Comp[] }
type TapVia = 'tee' | 'olet' | 'tway' | 'fway';

export function generatePiping(opts: { only?: (l: LineDef) => boolean; plant?: PlantDef } = {}): PipingModel {
  const plant = opts.plant ?? PLANT1, P2 = plant.id !== 'P1';
  const building = plant.building(), interior = plant.interior(), nozzles = plant.nozzles(), list = plant.lines().filter(opts.only ?? (() => true));
  const failures: string[] = [], rk = plant.rack, T0 = Date.now(), tm: Record<string, number> = {};
  const g = new Grid(plant.grid.x0, 0, plant.grid.z0, plant.grid.x1, plant.grid.y1, plant.grid.z1);
  const byNoAll = new Map(plant.lines().map(l => [l.no, l]));
  const jointOf = (l: LineDef): JointEnd => plant.joint(l, byNoAll);
  const flangeOf = (l: LineDef): 'WN' | 'SO' => plant.flangeType(l, byNoAll);
  // ---- static obstacles: every member as a capsule along its axis, every other solid as its box; headroom zones ----
  const st = staticObstacles(building.instances, interior.instances, plant.verticalThroughPlatforms);
  // member axes are off the grid: cells within r + H√3/2 are marked so every point of the member has a marked centre
  // near it; each cell's reach (r − its distance from the axis) keeps the clearance test measured from the true surface
  for (const o of st.obstacles) if (o.kind === 'cap') g.markCapsule(o.a, o.b, P2 ? Math.max(o.r, 1.5) : o.r, STATIC, H * Math.sqrt(3) / 2); else g.markBox(o.mn, o.mx, STATIC);   // plant 2: thin rods held as 1.5 in so the grid never lets a line nearer than SW-RT-3
  for (const h of st.headroom) g.markBox(h[0], h[1], 0, plant.verticalThroughPlatforms ? 'plat' : 'head');
  for (const gr of st.gratings) g.markBox([gr.box[0][0], gr.box[0][1] - 1, gr.box[0][2]], [gr.box[1][0], gr.box[1][1] + 1, gr.box[1][2]], 0, 'plat');   // SW-PEN-4: the panel itself bars horizontal runs
  // SW-RT-7: the 2 ft above each rack tier is kept for lines running along the rack (handled like headroom)
  for (const t of rk.tiers) g.markBox([rk.x0 - 12, t, -rk.halfWidth], [rk.x1 + 12, t + 24, rk.halfWidth], 0, 'head');
  g.markBox([-1e6, -1e6, -1e6], [1e6, 96 - 1e-6, 1e6], 0, 'head');          // SW-RT-3: floor walkway headroom
  if (plant.wallX !== undefined) {   // SW-PLANT-6: from 3 ft beyond the rack's end outward one band at 150 in, except at the lines' own equipment
    const bx = rk.x1 + 108; g.markBox([bx, -1e6, -1e6], [1e6, 147 - 1e-6, 1e6], 0, 'head'); g.markBox([bx, 153 + 1e-6, -1e6], [1e6, 1e6, 1e6], 0, 'head');   // the 9 ft slot past the rack end is where lines fall
    // SW-RT-10: the roof plane, the side walls and the west wall bound the grid
    const dr = building.drawing, He = dr.eaveFt * 12, halfW = dr.widthFt * 6, tanT = dr.slopeRisePer12 / 12;
    for (let z = -halfW; z < halfW; z += H) { const yr = He + (halfW - Math.abs(z + H / 2)) * tanT - 1; g.markBox([-1e6, yr, z], [plant.wallX, 1e6, z + H], STATIC); }
    g.markBox([-1e6, -1e6, -1e6], [plant.wallX, 1e6, -halfW], STATIC); g.markBox([-1e6, -1e6, halfW], [plant.wallX, 1e6, 1e6], STATIC); g.markBox([-1e6, -1e6, -1e6], [0, 1e6, 1e6], STATIC);
  }
  g.markBox([-1e6, -1e6, -1e6], [1e6, 0, 1e6], STATIC);                     // floor
  g.computeDistance();
  tm.t_static = Date.now() - T0;

  const bentXs: number[] = []; for (let x = rk.x0; x <= rk.x1 + 1e-6; x += rk.bentSpacing) bentXs.push(x);
  const spanOf = (OD: number) => (OD >= 3.5 ? 240 : OD >= 2.375 ? 180 : 120);                 // SW-PS-7
  /** the tier a horizontal x-run rests on, if it is on the rack (pipe bottom 4–12 in above a tier top) */
  const rackTier = (a: V3, b: V3, r: number) => Math.abs(b[0] - a[0]) > 1e-6 && Math.abs(b[1] - a[1]) < 1e-6 && Math.abs(b[2] - a[2]) < 1e-6 && Math.abs(a[2]) < rk.halfWidth - 6 ? rk.tiers.find(t => a[1] - r - t >= 3.9 && a[1] - r - t <= 12.1) : undefined;
  /** support stations on a rack run: every bent, and mid-bay intermediate beams for lines needing spans under 20 ft (SW-PS-8, SW-RK-6) */
  const rackStations = (lo: number, hi: number, span: number) => { const xs: number[] = []; for (const xb of bentXs) { if (xb > lo + 6 && xb < hi - 6) xs.push(xb); const m = xb + rk.bentSpacing / 2; if (span < rk.bentSpacing && m < rk.x1 && m > lo + 6 && m < hi - 6) xs.push(m); } return xs.sort((p, q) => p - q); };
  const lineId = new Map<string, number>(); list.forEach((l, i) => lineId.set(l.no, i + 1));
  const byNo = new Map(list.map(l => [l.no, l]));
  type Seg = [V3, V3, number] | { box: [V3, V3] };
  /** release every cell a line holds (when a trial routing is abandoned); the distance field is rebuilt */
  const unoccupy = (id: number) => { for (let c = 0; c < g.N; c++) if (g.occ[c] === id) { g.occ[c] = 0; g.reach[c] = 0; g.boxy[c] = 0; } for (let i = lineBoxes.length - 1; i >= 0; i--) if (lineBoxes[i].id === id) lineBoxes.splice(i, 1); g.computeDistance(); };
  const lineBoxes: { id: number; box: [V3, V3] }[] = [];
  const occupy = (id: number, segs: Seg[]) => { const cells: number[] = []; for (const sg of segs) { if (!Array.isArray(sg)) lineBoxes.push({ id, box: sg.box }); cells.push(...(Array.isArray(sg) ? g.markCapsule(sg[0], sg[1], sg[2], id) : g.markBox(sg.box[0], sg.box[1], id))); } g.updateDistance(cells, id, 8); };
  /** reserved envelope of placed components: valves by the box of their drawn solids (stem, handwheel, actuator included),
   *  flanges and gaskets as discs of the flange OD, pipe and fittings as capsules of the pipe OD */
  const compSegs = (comps: Comp[]): Seg[] => comps.filter(c => c.kind !== 'studs').map(c => c.kind === 'valve' ? { box: worldBox(partFromKey(c.key), c.T)! }
    : [c.a, c.b, c.kind === 'pipe' || c.kind === 'reducer' || c.kind === 'nipple' || c.kind === 'coupling' || c.kind === 'swage' || c.kind === 'plug' ? pipeDims(c.NPS, c.cls).OD / 2 + (c.kind === 'coupling' || c.kind === 'swage' ? smallBore(c.NPS, c.cls).tf : 0) : designFlange(c.NPS, c.cls).OD / 2] as Seg);

  const runs = new Map<string, LineRun>();
  const paths = new Map<string, V3[]>();                                    // routed centreline vertices of each line (for taps)
  const teeTag = (parent: string, child: string) => `${parent}/T:${child}`;
  const taps = new Map<string, { at: V3; out: V3; NPS: number; child: string; flR: number; via: TapVia; half: number }[]>();
  /** centre-to-end of a corner (SW-FIT-1 for butt-weld elbows, SW-SWT-3 for forged ones) */
  const Rbw = (NPS: number, cls: PipeClass) => elbowRadius(pipeDims(NPS, cls).OD);
  const R = (NPS: number, cls: PipeClass, joint: JointEnd = 'BW') => (joint === 'BW' ? Rbw(NPS, cls) : smallElbowA(smallBore(NPS, cls), joint));
  const kOf = (NPS: number, cls: PipeClass, joint: JointEnd = 'BW') => Math.ceil((2 * R(NPS, cls, joint) + 2) / H);

  /** a valve's envelope (SW-RT-3) is clear of steel, equipment and other lines' reserved space */
  // exact static test for valve envelopes: a spatial hash of the obstacles
  const SB = 48, sidx = new Map<string, number[]>();
  st.obstacles.forEach((o, i) => { const [mn, mx] = o.kind === 'box' ? [o.mn, o.mx] : [[Math.min(o.a[0], o.b[0]) - o.r, Math.min(o.a[1], o.b[1]) - o.r, Math.min(o.a[2], o.b[2]) - o.r], [Math.max(o.a[0], o.b[0]) + o.r, Math.max(o.a[1], o.b[1]) + o.r, Math.max(o.a[2], o.b[2]) + o.r]];
    for (let x = Math.floor(mn[0] / SB); x <= Math.floor(mx[0] / SB); x++) for (let y = Math.floor(mn[1] / SB); y <= Math.floor(mx[1] / SB); y++) for (let z = Math.floor(mn[2] / SB); z <= Math.floor(mx[2] / SB); z++) { const k = `${x},${y},${z}`; let b = sidx.get(k); if (!b) sidx.set(k, (b = [])); b.push(i); } });
  /** a valve's envelope (SW-RT-3) keeps 3 in from steel and equipment (exactly, except the equipment the stack is
   *  bolted to) and from other lines' reserved space (on the grid, with each cell's reach) */
  let blockedBy = '';
  const boxClear = (bx: [V3, V3], id: number, ownEquip?: string, parentId = 0) => {
    const e = 3 + g.maxReach, c0 = g.cellOf([bx[0][0] - e, bx[0][1] - e, bx[0][2] - e]), c1 = g.cellOf([bx[1][0] + e, bx[1][1] + e, bx[1][2] + e]);
    for (let k = Math.max(0, c0[2]); k <= Math.min(g.nz - 1, c1[2]); k++) for (let j = Math.max(0, c0[1]); j <= Math.min(g.ny - 1, c1[1]); j++) for (let i = Math.max(0, c0[0]); i <= Math.min(g.nx - 1, c1[0]); i++) {
      const c = g.idx(i, j, k), o = g.occ[c]; if (o === 0 || o === id || o === parentId || o === STATIC || g.boxy[c]) continue;
      const p = g.pos(i, j, k); let d2 = 0; for (let a = 0; a < 3; a++) { const d = Math.max(bx[0][a] - p[a], p[a] - bx[1][a], 0); d2 += d * d; }
      if (Math.sqrt(d2) - g.reach[c] < 3) { blockedBy = `line ${list[o - 1]?.no}`; return false; }
    }
    for (const lb of lineBoxes) if (lb.id !== id && lb.id !== parentId && boxGap(bx, lb.box) < 3) { blockedBy = `line ${list[lb.id - 1]?.no}`; return false; }
    if (bx[0][1] < 3) { blockedBy = 'floor'; return false; }                                           // the floor
    const seen = new Set<number>();
    for (let x = Math.floor((bx[0][0] - 3) / SB); x <= Math.floor((bx[1][0] + 3) / SB); x++) for (let y = Math.floor((bx[0][1] - 3) / SB); y <= Math.floor((bx[1][1] + 3) / SB); y++) for (let z = Math.floor((bx[0][2] - 3) / SB); z <= Math.floor((bx[1][2] + 3) / SB); z++)
      for (const i of sidx.get(`${x},${y},${z}`) ?? []) {
        if (seen.has(i)) continue; seen.add(i); const o = st.obstacles[i];
        if (ownEquip && o.tag.startsWith(ownEquip + '/')) continue;
        if (o.kind === 'box' ? boxGap(bx, [o.mn, o.mx]) < 3 : segBox(o.a, o.b, bx[0], bx[1]) - o.r < 3) { blockedBy = o.tag; return false; }
      }
    return true;
  };
  /** SW-LL-5: build a stack, turning any valve whose stem, handwheel or actuator would strike something to the next stem
   *  direction across the flow (up first, then sideways; never stem-down, which traps dirt in the bonnet) */
  const orient = (items0: Item[], build: (it: Item[]) => Built, id: number, w: V3, ownEquip?: string, parentId = 0): { b: Built; ok: boolean } => {
    const items = items0.map(x => ({ ...x }));
    const cands: V3[] = Math.abs(w[1]) < 0.9 ? [[0, 1, 0], ...DIRS.filter(d => d[1] === 0 && Math.abs(dot(d, w)) < 0.5)] : DIRS.filter(d => d[1] === 0);
    let b = build(items), ok = true;
    items.forEach((it, i) => {
      if (it.k !== 'valve' && it.k !== 'psv') return;
      const comp = () => b.comps.filter(c => c.kind === 'valve')[items.slice(0, i).filter(x => x.k === 'valve' || x.k === 'psv').length];
      const sidesClear = () => (b.extra?.side ?? []).every(c => boxClear(worldBox(partFromKey(c.key), c.T)!, id, ownEquip, parentId));   // SW-LL-7 side ports
      if (boxClear(worldBox(partFromKey(comp().key), comp().T)!, id, ownEquip, parentId) && sidesClear()) return;
      if (it.k === 'psv') { ok = false; return; }                                       // a safety valve stands as it is; the tap moves instead
      // a control valve keeps its actuator up and a swing check its cover up in a horizontal run (SW-LL-5)
      if (Math.abs(w[1]) < 0.9 && (it.type === 'CONTROL' || it.type === 'CHECK')) { ok = false; return; }
      for (const sd of cands) { it.stem = sd; b = build(items); if (boxClear(worldBox(partFromKey(comp().key), comp().T)!, id, ownEquip, parentId) && sidesClear()) return; }
      delete it.stem; b = build(items); ok = false;
    });
    return { b, ok };
  };

  // ---- the item stacks (SW-LL-3, SW-LL-6) ------------------------------------------------------------------------
  /** the isolation valve type (SW-LL-3; SW-LL-6 as amended in stage 9): by class group and size, the line and the nozzle it stands at */
  const isoValve = (NPS: number, cls: PipeClass, group = 'H', l?: LineDef, nz?: Nozzle, atDest?: boolean): ValveType => {
    if (!P2 || NPS < 2) return NPS >= 2 ? 'GATE' : isOffered('BALL', NPS, cls) ? 'BALL' : 'GATE';
    if (l?.service === 'CA' && l.NPS >= 4) {                                                    // solids: ball where the line fills a vessel, plug where it empties one
      const svc = nz?.service ?? '';
      if (nz) return svc === 'fill' || svc === 'solids inlet' ? 'BALL' : 'PLUG';
      return l.to.k === 'nozzle' ? 'BALL' : 'PLUG';
    }
    if (l?.service === 'CA' && l.NPS <= 3) return 'BFLY';                                        // the conveying-air line is an air line
    if (group[0] === 'S' || group[0] === 'C') return 'GLOBE';                                     // steam and condensate: throttled at both ends
    if (nz && nz.equip.startsWith('T-') && group[0] === 'H') return 'BFLY';                       // storage tanks' process nozzles
    if (group[0] === 'W' || group[0] === 'G') return 'BFLY';
    return 'GATE';
  };
  const groupOf = (l: LineDef) => (P2 ? lineClassCode({ no: l.no, service: l.service, cls: l.cls, from: l.from.k === 'tap' ? `tap ${l.from.line}` : l.from.k, to: l.to.k === 'tap' ? `tap ${l.to.line}` : l.to.k }, new Map([...byNoAll].map(([k, v]) => [k, { no: v.no, service: v.service, cls: v.cls, from: v.from.k === 'tap' ? `tap ${v.from.line}` : v.from.k, to: v.to.k === 'tap' ? `tap ${v.to.line}` : v.to.k }])))[0] : 'H');
  const fl = (l: LineDef, k: 'wnf' | 'wnfR', NPS = l.NPS, cls = l.cls, so = true): Item => ({ k: so && flangeOf(l) === 'SO' ? (k === 'wnf' ? 'sof' : 'sofR') : k, NPS, cls });
  /** SW-LL-8 (5): no two valves bolt straight together; a 6 in pipe stub flanged with the stack's kind of flange stands between (plant 2) */
  const spaced = (l: LineDef, items: Item[], so = true): Item[] => {
    if (!P2) return items;
    const out: Item[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i]; out.push(it);
      if (it.k === 'valve' && items[i + 1]?.k === 'gasket' && items[i + 2]?.k === 'valve') { out.push(items[i + 1], fl(l, 'wnf', it.NPS, it.cls, so), { k: 'pipe', NPS: it.NPS, cls: it.cls, L: 6 }, fl(l, 'wnfR', it.NPS, it.cls, so), { k: 'gasket', NPS: it.NPS, cls: it.cls }); i++; }
    }
    return out;
  };
  const SPEC_SERVICES = new Set(['inlet', 'outlet', 'feed', 'overhead', 'bottoms', 'reflux', 'outlet 2', 'fill']);
  const blindStart = (l: LineDef, nz: Nozzle): Item[] => {   // SW-LL-6: the blind that goes into the first joint at a nozzle
    if (!P2) return [];
    if (nz.equip.startsWith('E-') || (nz.service === 'suction')) return [{ k: 'spade', NPS: nz.NPS, cls: l.cls }, { k: 'gasket', NPS: nz.NPS, cls: l.cls }];
    if (SPEC_SERVICES.has(nz.service) && /^(V|C|D|T|R)-/.test(nz.equip)) return [{ k: 'spec', NPS: nz.NPS, cls: l.cls }, { k: 'gasket', NPS: nz.NPS, cls: l.cls }];
    return [];
  };
  const NIP = (NPS: number, cls: PipeClass, ends: NippleEnds, L = 4, rev = false): Item => ({ k: 'nipple', NPS, cls, L, ends, rev });
  /** the item stack at a nozzle end (SW-LL-3, SW-LL-6); items listed from the nozzle face outward */
  function nozzleStack(l: LineDef, nz: Nozzle, isDest: boolean): Item[] {
    const NPS = l.NPS, cls = l.cls, joint = jointOf(l), iso = isoValve(NPS, cls, groupOf(l), l, nz, isDest);
    const gasket: Item = { k: 'gasket', NPS: nz.NPS, cls }, lead: Item[] = [gasket, ...blindStart(l, nz)];
    const chk: Item[] = P2 && l.check && isDest ? [{ k: 'valve', type: 'CHECK', NPS, cls }, { k: 'gasket', NPS, cls }] : [];   // SW-LL-7: a check ahead of the block valve at the destination
    if (nz.service === 'suction') {
      const it: Item[] = [...lead, fl(l, 'wnf', nz.NPS)];
      if (NPS !== nz.NPS) it.push({ k: 'reducer', from: nz.NPS, to: NPS, cls, ...(P2 ? { flat: 'top' } : {}) }, fl(l, 'wnfR'));
      else it.push({ k: 'pipe', NPS, cls, L: 6 }, fl(l, 'wnfR'));
      return [...it, { k: 'gasket', NPS, cls }, { k: 'valve', type: 'GATE', NPS, cls }, { k: 'gasket', NPS, cls }, fl(l, 'wnf')];
    }
    if (nz.service === 'discharge') {
      const it: Item[] = spaced(l, [gasket, { k: 'valve', type: 'CHECK', NPS: nz.NPS, cls }, { k: 'gasket', NPS: nz.NPS, cls }, { k: 'valve', type: 'GATE', NPS: nz.NPS, cls }, { k: 'gasket', NPS: nz.NPS, cls }, fl(l, 'wnf', nz.NPS, cls, false)], false);
      if (NPS !== nz.NPS) it.push({ k: 'reducer', from: nz.NPS, to: NPS, cls });
      return it;
    }
    if (nz.service === 'seal flush') return P2 ? [gasket, fl(l, 'wnf', nz.NPS), NIP(NPS, cls, 'TOE'), { k: 'valve', type: 'LCHECK', NPS, cls, ends: 'TH' }, NIP(NPS, cls, 'TBE'), { k: 'valve', type: 'GLOBE', NPS, cls, ends: 'TH' }, NIP(NPS, cls, 'TBE')] : [gasket, { k: 'wnf', NPS, cls }];   // SW-LL-3: isolated at the header take-off only
    if (P2 && (nz.service === 'solids inlet' || nz.service === 'fill' || nz.service === 'solids outlet')) {   // SW-LL-6: a rotary airlock on every solids nozzle, its block valve ahead of it (SW-LL-7)
      const spec: Item[] = nz.equip.startsWith('V-') || (nz.equip.startsWith('R-21') && nz.service === 'solids outlet') ? [{ k: 'spec', NPS: nz.NPS, cls: 'P150' }, { k: 'gasket', NPS: nz.NPS, cls: 'P150' }] : [];
      const feeder: Item[] = spaced(l, [gasket, ...spec, { k: 'valve', type: isoValve(nz.NPS, 'P150', 'G', l, nz, isDest), NPS: nz.NPS, cls: 'P150' }, { k: 'gasket', NPS: nz.NPS, cls: 'P150' }, { k: 'valve', type: 'ROTARY', NPS: nz.NPS, cls: 'P150' }, { k: 'gasket', NPS: nz.NPS, cls: 'P150' }, fl(l, 'wnf', nz.NPS, 'P150', false)], false);
      if (NPS !== nz.NPS) feeder.push({ k: 'reducer', from: nz.NPS, to: NPS, cls });
      return feeder;
    }
    if (P2 && joint === 'TH' && (nz.service === 'nitrogen' || nz.service === 'fluidizing air')) return [gasket, fl(l, 'wnf', nz.NPS), NIP(NPS, cls, 'TOE'), { k: 'valve', type: 'LCHECK', NPS, cls, ends: 'TH' }, NIP(NPS, cls, 'TBE'), { k: 'valve', type: 'GLOBE', NPS, cls, ends: 'TH' }, NIP(NPS, cls, 'TBE')];
    if (P2 && joint === 'TH') return [gasket, fl(l, 'wnf', nz.NPS), NIP(NPS, cls, 'TOE'), { k: 'valve', type: 'GATE', NPS, cls, ends: 'TH' }, NIP(NPS, cls, 'TBE')];
    if (P2 && joint === 'SW') return [gasket, { k: 'swf', NPS, cls }, NIP(NPS, cls, 'PBE'), { k: 'valve', type: 'GATE', NPS, cls, ends: 'SW' }, NIP(NPS, cls, 'PBE')];
    const thr: Item[] = P2 && groupOf(l)[0] === 'W' && (isDest || l.service === 'CWR') ? [{ k: 'valve', type: 'GLOBE', NPS: nz.NPS, cls }, { k: 'gasket', NPS: nz.NPS, cls }] : [];   // SW-LL-7: throttling globe at a water consumer; a return's balancing globe at the exchanger's outlet nozzle
    const nN = P2 ? nz.NPS : NPS;   // plant 2: the stack at the nozzle's size up to its first flange, then a reducer to the line
    const base: Item[] = [...spaced(l, [...lead, { k: 'valve', type: iso, NPS: nN, cls }, { k: 'gasket', NPS: nN, cls }, ...thr, ...chk.map(x => (x.k === 'valve' || x.k === 'gasket' ? { ...x, NPS: nN } : x)), fl(l, 'wnf', nN, cls, false)], false), ...(nN !== NPS ? [{ k: 'reducer', from: nN, to: NPS, cls } as Item] : [])];   // SW-LL-8 (3): weld-neck at a nozzle
    if (l.cv && isDest) return [...base, { k: 'pipe', NPS, cls, L: 18 }, ...cvStation(l)];
    return base;
  }
  /** SW-LL-6: the items of a small-bore stub by service, after its first fitting (the nozzle flange or the branch outlet) */
  function smallStub(l: LineDef, joint: 'SW' | 'TH', atNozzle: boolean, nzNPS?: number): Item[] {
    const NPS = l.NPS, cls = l.cls;
    if (nzNPS) {   // SW-LL-7: a 2 in vent or drain nozzle swages down to the stub in its first fitting (a butt-weld swage, SW-SWT-7)
      const rest = smallStub(l, joint, false).filter((x, i, arr) => !(i === 0 && x.k === 'nipple' && arr.length && joint === 'TH'));   // the tap's leading nipple is not needed behind a swage
      return [{ k: 'gasket', NPS: nzNPS, cls }, { k: 'wnf', NPS: nzNPS, cls }, { k: 'swage', from: nzNPS, to: NPS, cls, e1: 'BW', e2: joint }, ...(joint === 'TH' ? [NIP(NPS, cls, 'TBE')] : []), ...rest];
    }
    // on a tap, the stack starts with a nipple that clears the parent's clearance band (3 in beyond its 4 in): on a threaded tap a nipple of
    // its own ahead of the valve; on a socket-weld tap the stack's own first nipple, lengthened, since two plain-end nipples make no joint
    const open: Item[] = atNozzle ? (joint === 'SW' ? [{ k: 'gasket', NPS, cls }, { k: 'swf', NPS, cls }] : [{ k: 'gasket', NPS, cls }, { k: 'wnf', NPS, cls }, NIP(NPS, cls, 'TOE')]) : joint === 'SW' ? [] : [NIP(NPS, cls, 'TBE', 3)];
    const nip1 = (): Item => NIP(NPS, cls, 'PBE', atNozzle || joint !== 'SW' ? 4 : 7);
    const close: Item[] = joint === 'SW' ? [NIP(NPS, cls, 'PBE'), { k: 'swfR', NPS, cls }, { k: 'gasket', NPS, cls }, { k: 'blind', NPS, cls }] : [{ k: 'plug', NPS, cls }];
    if (l.service === 'I') return joint === 'SW'
      ? [...open, nip1(), { k: 'valve', type: 'GATE', NPS, cls, ends: 'SW' }, NIP(NPS, cls, 'PBE'), { k: 'valve', type: 'FWAY', NPS, cls, ends: 'SW', sides: true }, ...close]
      : [...open, { k: 'valve', type: 'GATE', NPS, cls, ends: 'TH' }, NIP(NPS, cls, 'TBE'), { k: 'valve', type: 'NEEDLE', NPS: Math.min(NPS, 1), cls, ends: 'TH' }, ...close];
    if (l.service === 'SP') {
      const sNPS = 0.5;
      return [...open, nip1(), { k: 'valve', type: 'GATE', NPS, cls, ends: 'SW' }, NIP(NPS, cls, 'PBE'), { k: 'valve', type: 'TWAY', NPS, cls, ends: 'SW' }, NIP(NPS, cls, 'PBE'),
        { k: 'swage', from: NPS, to: sNPS, cls, e1: 'SW', e2: 'TH' }, NIP(sNPS, cls, 'TBE'), { k: 'valve', type: 'NEEDLE', NPS: sNPS, cls, ends: 'TH' }, { k: 'plug', NPS: sNPS, cls }];
    }
    if (l.service === 'RV') return [...open, nip1(), { k: 'swfR', NPS, cls }, { k: 'gasket', NPS, cls }];   // the safety valve follows (planned apart)
    // vents and drains
    return joint === 'SW' ? [...open, nip1(), { k: 'valve', type: 'BALL', NPS, cls, ends: 'SW' }, NIP(NPS, cls, 'PBE'), { k: 'swtee', NPS, cls }, ...close]   // SW-LL-7: a plugged tee (flushing connection) after the valve
      : [...open, { k: 'valve', type: l.service === 'D' ? 'GLOBE' : 'GATE', NPS, cls, ends: 'TH' }, ...close];   // SW-LL-7: drains throttle through a globe
  }
  const stubItems = (l: LineDef, nz?: Nozzle): Item[] => {
    const NPS = l.NPS, cls = l.cls, joint = jointOf(l);
    if (P2 && joint !== 'BW') return smallStub(l, joint, !!nz, nz && nz.NPS > NPS ? nz.NPS : undefined);
    if (nz && P2 && nz.service === 'outlet 2') return [{ k: 'gasket', NPS, cls }, { k: 'spec', NPS, cls }, { k: 'gasket', NPS, cls }, { k: 'valve', type: isoValve(NPS, cls, groupOf(l), l, nz), NPS, cls }, { k: 'gasket', NPS, cls }, { k: 'blind', NPS, cls }];
    return [{ k: 'gasket', NPS, cls }, { k: 'valve', type: isoValve(NPS, cls, groupOf(l), l, nz), NPS, cls }, { k: 'gasket', NPS, cls }, { k: 'blind', NPS, cls }];
  };
  /** SW-LL-3 control station; plant 2 (SW-LL-7): the control valve one size smaller between two eccentric reducers when the line is 3 in or more */
  const cvStation = (l: LineDef): Item[] => {
    const NPS = l.NPS, cls = l.cls, sN = P2 && NPS >= 3 ? ({ 3: 2, 4: 3, 6: 4, 8: 6 } as Record<number, number>)[NPS] ?? NPS : NPS;
    const gate: Item[] = [fl(l, 'wnfR'), { k: 'gasket', NPS, cls }, { k: 'valve', type: 'GATE', NPS, cls }, { k: 'gasket', NPS, cls }, fl(l, 'wnf')];
    if (sN === NPS) return spaced(l, [fl(l, 'wnfR'), { k: 'gasket', NPS, cls }, { k: 'valve', type: 'GATE', NPS, cls }, { k: 'gasket', NPS, cls }, { k: 'valve', type: 'CONTROL', NPS, cls }, { k: 'gasket', NPS, cls }, { k: 'valve', type: 'GATE', NPS, cls }, { k: 'gasket', NPS, cls }, fl(l, 'wnf')]);
    return [...gate, { k: 'reducer', from: NPS, to: sN, cls, flat: 'top' }, fl(l, 'wnfR', sN), { k: 'gasket', NPS: sN, cls }, { k: 'valve', type: 'CONTROL', NPS: sN, cls }, { k: 'gasket', NPS: sN, cls }, fl(l, 'wnf', sN), { k: 'reducer', from: sN, to: NPS, cls, flat: 'top' }, ...gate];
  };
  /** the items at a branch take-off: after a tee outlet a flange, after an olet nothing; the take-off valve by joint type */
  const takeOffItems = (l: LineDef, via: TapVia, valve: boolean, isDest = false): Item[] => {
    const NPS = l.NPS, cls = l.cls, joint = jointOf(l);
    const lead: Item[] = via === 'tway' || via === 'fway' ? (joint === 'BW' ? [{ k: 'gasket', NPS, cls }, fl(l, 'wnf')] : []) : [];
    if (!valve) return lead;
    if (joint === 'TH') return [NIP(NPS, cls, 'TBE'), { k: 'valve', type: 'GATE', NPS, cls, ends: 'TH' }, NIP(NPS, cls, 'TBE')];
    if (joint === 'SW') return [NIP(NPS, cls, 'PBE'), { k: 'valve', type: 'GATE', NPS, cls, ends: 'SW' }, NIP(NPS, cls, 'PBE')];
    const chk: Item[] = P2 && l.check && isDest ? [{ k: 'valve', type: 'CHECK', NPS, cls }, { k: 'gasket', NPS, cls }] : [];   // SW-LL-7: check ahead of the block valve, seen from the header
    const thr: Item[] = [];   // SW-LL-7 (amended): a return's balancing globe stands at the exchanger nozzle, the take-off keeps block and check (a third valve would reach the rafters)
    const so = via !== 'olet';   // SW-LL-8 (4): a weldolet takes weld-neck flanges
    const stub: Item[] = P2 && so && via === 'tee' && flangeOf(l) === 'SO' ? [{ k: 'pipe', NPS, cls, L: 6 }] : [];   // SW-LL-8 (7): a slip-on flange slips over a pipe, not a tee
    const base: Item[] = spaced(l, [...lead, ...stub, fl(l, 'wnfR', NPS, cls, so), { k: 'gasket', NPS, cls }, { k: 'valve', type: isoValve(NPS, cls, groupOf(l), l, undefined, isDest), NPS, cls }, { k: 'gasket', NPS, cls }, ...thr, ...chk, fl(l, 'wnf', NPS, cls, so)], so);
    if (P2 && l.cv && isDest && l.to.k === 'tap') return [...base, { k: 'pipe', NPS, cls, L: 18 }, ...cvStation(l)];   // SW-LL-7: the control station at a destination take-off
    return base;
  };
  /** SW-SWT-6: the branch fitting: an olet when the branch is at most half the run, a tee otherwise, unless the tap names a valve station */
  const viaOf = (parent: LineDef, child: LineDef, e: Extract<EndRef, { k: 'tap' }>): TapVia => e.via ?? (P2 && child.NPS <= parent.NPS / 2 ? 'olet' : 'tee');
  /** the distance from the run axis to the branch's first point, and the half length the fitting takes along the run */
  const tapGeom = (parent: LineDef, child: LineDef, via: TapVia) => {
    const pOD = pipeDims(parent.NPS, parent.cls).OD, pj = jointOf(parent), cj = jointOf(child);
    if (via === 'olet') return { out: oletHeight(smallBore(parent.NPS, parent.cls), smallBore(child.NPS, child.cls), cj), half: smallBore(child.NPS, child.cls).OD / 2 + 2 * smallBore(child.NPS, child.cls).tf + 1 };
    if (via === 'tway' || via === 'fway') {
      if (pj === 'BW') { const v = partFromKey(`VLV|${via === 'tway' ? 'TWAY' : 'FWAY'}|${parent.NPS}|${parent.cls}`), f = designFlange(parent.NPS, parent.cls), { Lf, rf } = flangeLen(parent.NPS, parent.cls);
        return { out: v.dims.sideC.value + f.rfH, half: v.dims.F2F.value / 2 + f.rfH + f.gasketT + rf + Lf }; }
      const v = partFromKey(`VLV|${via === 'tway' ? 'TWAY' : 'FWAY'}|${parent.NPS}|${parent.cls}|${pj}`); return { out: v.dims.sideC.value + smallBore(parent.NPS, parent.cls).tf + endLength(smallBore(parent.NPS, parent.cls), pj), half: v.dims.F2F.value / 2 };
    }
    if (pj === 'BW') return { out: teeC(pOD), half: teeC(pOD) };
    const sb = smallBore(parent.NPS, parent.cls); return { out: smallTeeC(sb, pj), half: smallTeeC(sb, pj) };
  };
  /** plan a nozzle end: build its stack from the face, P1 one elbow length beyond on the grid */
  const planNozzle = (l: LineDef, nz: Nozzle, isDest: boolean): EndPlan => {
    const { b, ok } = orient(nozzleStack(l, nz, isDest), it => buildStack(l.no, nz.face, nz.u, it, `${nz.id}`), lineId.get(l.no)!, nz.u, nz.equip);
    if (!ok) failures.push(`${l.no}: a valve at ${nz.id} strikes ${blockedBy} in every stem direction`);
    const P1 = leadP1(b.end, nz.u, R(l.NPS, l.cls, jointOf(l)));
    return { P1, dirOut: nz.u, built: b, startFace: nz.face, zone: nz.face };
  };
  /** choose a tap on a parent's routed path nearest a point, with the outlet pointing toward it; the whole take-off
   *  column (fitting outlet, take-off stack, and one elbow length beyond) must be clear of other lines and steel */
  const chooseTap = (parentNo: string, toward: V3, child: LineDef, items: Item[], prefUp: boolean, via: TapVia): { at: V3; out: V3; b: Built } | null => {
    const path = paths.get(parentNo), parent = byNo.get(parentNo)!; if (!path) return null;
    const pOD = pipeDims(parent.NPS, parent.cls).OD, { out: C, half } = tapGeom(parent, child, via), Rp = R(parent.NPS, parent.cls, jointOf(parent)), used = taps.get(parentNo) ?? [];
    const cr = pipeDims(child.NPS, child.cls).OD / 2, flr = designFlange(child.NPS, child.cls).OD / 2, reach = C + stackLength(items) + R(child.NPS, child.cls, jointOf(child)) + H;
    const pid = lineId.get(parentNo)!, cid = lineId.get(child.no)!, rr = Math.max(cr, items.length ? flr : cr);
    const station = via === 'tway' || via === 'fway';
    const columnFree = (at: V3, out: V3) => {
      for (let s = snapUp(pOD / 2 + 3); s <= reach + 1e-6; s += H) {
        const cc = g.cellOf(add(at, out, s)); if (!g.inside(cc[0], cc[1], cc[2])) return false;
        if (!g.clear(cc[0], cc[1], cc[2], rr, station && s > pOD / 2 + rr + 4 ? [cid] : [pid, cid])) return false;   // a station's branch may not run into the parent's own end stack (its run is next to the column only at the start)
      }
      return true;
    };
    let best: { at: V3; out: V3; d: number; b: Built } | null = null;
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1], L = len(sub(b, a)), w = unit(sub(b, a));
      // at a header end the cap follows (C + 6); at a line end the pipe runs straight on into the end stack for R; at a corner an elbow takes R
      const pe = ends.get(parentNo), straightOn = (e: EndPlan | undefined, d: V3) => !!e && Math.abs(dot(e.dirOut, d) - 1) < 1e-9;
      const mA = parent.kind === 'header' ? 6 : straightOn(pe?.A, w) ? 3 - Rp : Rp + 3, mB = parent.kind === 'header' ? 6 : straightOn(pe?.B, neg(w)) ? 3 - Rp : Rp + 3;
      const s0 = Math.max(0, half + (i === 0 ? mA : Rp + 3)), s1 = Math.min(L, L - half - (i === path.length - 2 ? mB : Rp + 3));
      for (let s = snapUp(s0); s <= s1 + 1e-6; s += H) {
        const at = add(a, w, s);
        if (used.some(u => len(sub(u.at, at)) < Math.max(u.half + half + 2, Math.max(u.half, half) + Math.max(u.flR, flr) + 3))) continue;   // fittings ≥ 2 in apart, branch flanges clear
        if (rackTier(a, b, pOD / 2) !== undefined && rackStations(-1e9, 1e9, spanOf(pOD)).some(x => Math.abs(x - at[0]) < half + 8)) continue;   // keep fittings off the beams that carry the shoes
        const outs: V3[] = prefUp && Math.abs(w[1]) < 0.5 ? [[0, 1, 0]] : DIRS.filter(d => Math.abs(dot(d, w)) < 0.5);
        for (const out of outs) {
          const d = len(sub(toward, add(at, out, C))) - (prefUp ? 0 : 6 * dot(out, unit(sub(toward, at))));
          if (best && d >= best.d) continue;
          if (!columnFree(at, out)) continue;
          // the take-off stack, valves oriented, must be clear in full (SW-RT-3)
          const outEnd = add(at, out, C), o = orient(items.map(x => (x.k === 'psv' ? { ...x, runDir: w } : x)), it => buildStack(child.no, outEnd, out, it, `${parentNo}/tee`), cid, out, undefined, pid);
          if (!o.ok) continue;
          if (o.b.extra?.psvOutletFace) {   // the safety valve's outlet lead (its flare line's start) must be clear for 3 ft
            let lead = true; const f = o.b.extra.psvOutletFace, d = o.b.extra.psvOutDir!;
            for (let s = 0; s <= 36; s += H / 2) { const cc = g.cellOf(add(f, d, s)); if (!g.inside(cc[0], cc[1], cc[2]) || !g.clear(cc[0], cc[1], cc[2], 1.5, [pid, cid])) { lead = false; break; } }
            if (!lead) continue;
          }
          best = { at, out, d, b: o.b };
        }
      }
    }
    return best ? { at: best.at, out: best.out, b: best.b } : null;
  };
  const planTap = (l: LineDef, e: Extract<EndRef, { k: 'tap' }>, toward: V3): EndPlan | null => {
    const parent = byNo.get(e.line)!, isHeader = parent.kind === 'header', via = viaOf(parent, l, e);
    const items = takeOffItems(l, via, e.valve, e === l.to);
    const t = chooseTap(e.line, toward, l, items, isHeader, via); if (!t) return null;
    const { out: C, half } = tapGeom(parent, l, via), outEnd = add(t.at, t.out, C);
    const b = t.b;
    const P1 = leadP1(b.end, t.out, R(l.NPS, l.cls, jointOf(l)));
    const list0 = taps.get(e.line) ?? []; list0.push({ at: t.at, out: t.out, NPS: l.NPS, child: l.no, flR: designFlange(l.NPS, l.cls).OD / 2, via, half }); taps.set(e.line, list0);
    return { P1, dirOut: t.out, built: b, startFace: outEnd, zone: t.at, tap: { parent: e.line, at: t.at, out: t.out, NPS: l.NPS, via } };
  };

  // ---- 1. headers on the upper tier, process rack runs on the lower tier (SW-RT-1/2) ----
  const tierY = (tier: number, NPS: number, cls: PipeClass) => snapUp(tier + 4 + pipeDims(NPS, cls).OD / 2);
  const lanes: { tier: number; z: number; OD: number; x0: number; x1: number }[] = [];
  const zMax = rk.halfWidth - 18;
  /** SW-RT-2: the width a line needs in its lane — its OD, or the OD of the largest flange on a valved take-off from it */
  const laneD = (l: LineDef) => Math.max(pipeDims(l.NPS, l.cls).OD, ...list.filter(c => [c.from, c.to].some(e => e.k === 'tap' && e.line === l.no && e.valve)).map(c => designFlange(c.NPS, c.cls).OD));
  const laneCands = () => { const c: number[] = []; for (let z = -snapUp(zMax) + H; z <= snapUp(zMax) - H; z += H) c.push(z); return c.sort((a, b) => Math.abs(a) - Math.abs(b) || a - b); };
  const laneFree = (tier: number, z: number, OD: number, x0: number, x1: number) => lanes.every(L => L.tier !== tier || L.x1 < x0 - 24 || L.x0 > x1 + 24 || Math.abs(L.z - z) >= (L.OD + OD) / 2 + 3);
  const assignLane = (tier: number, OD: number, x0: number, x1: number) => {
    const cands: number[] = []; for (let z = -snapUp(zMax) + H; z <= snapUp(zMax) - H; z += H) cands.push(z);
    cands.sort((a, b) => Math.abs(a) - Math.abs(b));
    for (const z of cands) if (lanes.every(L => L.tier !== tier || L.x1 < x0 - 24 || L.x0 > x1 + 24 || Math.abs(L.z - z) >= (L.OD + OD) / 2 + 3)) { lanes.push({ tier, z, OD, x0, x1 }); return z; }
    return null;
  };
  const hx0 = rk.x0 + 12, hx1 = rk.x1 - 12, topTier = rk.tiers[rk.tiers.length - 1];
  for (const l of list.filter(l => l.kind === 'header')) {
    const OD = pipeDims(l.NPS, l.cls).OD, z = assignLane(topTier, laneD(l), hx0, hx1), y = tierY(topTier, l.NPS, l.cls);
    if (z === null) { failures.push(`${l.no}: no lane`); continue; }
    const path: V3[] = [[hx0, y, z], [hx1, y, z]]; paths.set(l.no, path);
    const cl = P2 ? (partFromKey(`CAP|${l.NPS}|${l.cls}`).extra!.len as number) : 0;   // plant 2: the end caps beyond the path are held too
    occupy(lineId.get(l.no)!, [[[hx0 - cl, y, z], [hx1 + cl, y, z], OD / 2]]);
    runs.set(l.no, { no: l.no, service: l.service, NPS: l.NPS, cls: l.cls, kind: l.kind, from: 'cap', to: 'cap', comps: [], welds: [], supports: [], path, ok: true });
  }

  // ---- 2. plan nozzle ends of all routed lines and reserve their stacks ----
  const ends = new Map<string, { A?: EndPlan; B?: EndPlan }>();
  for (const l of list.filter(l => l.kind === 'routed')) {
    const e: { A?: EndPlan; B?: EndPlan } = {};
    if (l.from.k === 'nozzle') e.A = planNozzle(l, nozzles.get(l.from.id)!, false);
    if (l.to.k === 'nozzle') e.B = planNozzle(l, nozzles.get(l.to.id)!, true);
    if (l.to.k === 'station') {                                           // SW-LL-3/6 hose station or open spout: valve at 42 in, blind flange (or a plug) below it
      const at = l.to.at, joint = jointOf(l), NPS = l.NPS, cls = l.cls;
      const items: Item[] = joint === 'TH'
        ? (sN => [{ k: 'plug', NPS: sN, cls } as Item, { k: 'valve', type: 'GATE', NPS: sN, cls, ends: 'TH' }, NIP(sN, cls, 'TBE'), ...(NPS > sN ? [{ k: 'swage', from: sN, to: NPS, cls, e1: 'TH', e2: 'TH' } as Item, NIP(NPS, cls, 'TBE')] : [])])(Math.min(NPS, 0.75))
        : joint === 'SW' ? [{ k: 'plug', NPS, cls }, { k: 'valve', type: 'GATE', NPS, cls, ends: 'TH' }, NIP(NPS, cls, 'TOE', 4, true)]   // SW-LL-8 (1): a threaded plug in a threaded valve, a one-end-threaded nipple up into the socket-weld line
        : [{ k: 'blindR', NPS, cls }, { k: 'gasket', NPS, cls }, { k: 'valve', type: isoValve(NPS, cls, groupOf(l)), NPS, cls }, { k: 'gasket', NPS, cls }, fl(l, 'wnf')];
      const b = orient(items, it => buildStack(l.no, at, [0, 1, 0], it, 'station'), lineId.get(l.no)!, [0, 1, 0]).b;
      if (P2 && l.service === 'HS') {   // SW-LL-6 (amended): the riser offsets 18 in outward at 12.5 ft through two 45° elbows
        const up: V3 = [0, 1, 0], d1 = unit([0, 1, -1]), A45 = R(NPS, cls, joint), C1: V3 = [at[0], 150, at[2]], C2 = add(C1, [0, 18, -18]);
        const ein1 = add(C1, up, -A45), eout1 = add(C1, d1, A45), ein2 = add(C2, d1, -A45), eout2 = add(C2, up, A45);
        const el = (ein: V3, eout: V3, a: V3, bb: V3): Comp => ({ tag: `${l.no}/x`, kind: 'elbow', key: joint === 'BW' ? `EL|${NPS}|${cls}|45` : `SWEL|${NPS}|${cls}|45|${joint}`, T: frameFromAxes(ein, cross(a, bb), a), a: ein, b: eout, NPS, cls, e1: joint === 'BW' ? 'BW' : joint, e2: joint === 'BW' ? 'BW' : joint });
        const s1 = buildStack(l.no, b.end, up, [{ k: 'pipe', NPS, cls, L: len(sub(ein1, b.end)), joint }], 'station'), s2 = buildStack(l.no, eout1, d1, [{ k: 'pipe', NPS, cls, L: len(sub(ein2, eout1)), joint }], 'station');
        b.comps.push(...s1.comps, el(ein1, eout1, up, d1), ...s2.comps, el(ein2, eout2, d1, up)); b.end = eout2;
      }
      const P1 = leadP1(b.end, [0, 1, 0], R(l.NPS, l.cls, joint));
      e.B = { P1, dirOut: [0, 1, 0], built: b, startFace: at, zone: at };
    }
    ends.set(l.no, e);
    for (const p of [e.A, e.B]) if (p?.built) occupy(lineId.get(l.no)!, [...compSegs(p.built.comps), [p.built.end, p.P1, pipeDims(l.NPS, l.cls).OD / 2]]);
  }
  // relief valves (stubs carrying a PSV) on nozzles — their outlets start the flare lines
  const psvOut = new Map<string, { face: V3; dir: V3; NPS: number }>();
  for (const l of list.filter(l => l.service === 'RV' && l.from.k === 'nozzle')) {
    const nz = nozzles.get((l.from as { id: string }).id)!, out: V3 = P2 ? (nz.z0 ?? nz.face[2]) < 0 ? [0, 0, 1] : [0, 0, -1] : nz.equip === 'D-101' ? [0, 0, -1] : [0, 0, 1];
    const b = buildStack(l.no, nz.face, nz.u, [{ k: 'gasket', NPS: l.NPS, cls: l.cls }, { k: 'psv', NPS: l.NPS, cls: l.cls, out }], nz.id);
    psvOut.set(nz.id, { face: b.extra!.psvOutletFace!, dir: out, NPS: b.extra!.psvOutNPS! });
    runs.set(l.no, { no: l.no, service: l.service, NPS: l.NPS, cls: l.cls, kind: 'stub', from: nz.id, to: 'PSV', comps: b.comps, welds: [], supports: [], path: [nz.face, b.end], ok: true });
    occupy(lineId.get(l.no)!, [...compSegs(b.comps), [b.end, add(b.end, nz.u, 40), 10]]);
  }
  const psvLeadItems = (l: LineDef, po: { NPS: number }): Item[] => {
    const joint = jointOf(l);
    if (joint === 'SW') return [{ k: 'gasket', NPS: po.NPS, cls: 'P150' }, { k: 'swf', NPS: po.NPS, cls: 'P150' }, NIP(po.NPS, 'P150', 'PBE'), { k: 'swage', from: po.NPS, to: l.NPS, cls: 'P150', e1: 'SW', e2: 'SW' }];
    return [{ k: 'gasket', NPS: po.NPS, cls: 'P150' }, { k: 'wnf', NPS: po.NPS, cls: 'P150' }, ...(po.NPS !== l.NPS ? [{ k: 'reducer', from: po.NPS, to: l.NPS, cls: 'P150' } as Item] : [])];
  };
  for (const l of list.filter(l => l.kind === 'routed' && l.from.k === 'psv' && psvOut.has((l.from as { nozzle: string }).nozzle))) {
    const po = psvOut.get((l.from as { nozzle: string }).nozzle)!;
    const b = buildStack(l.no, po.face, po.dir, psvLeadItems(l, po), 'PSV');
    const P1 = leadP1(b.end, po.dir, R(l.NPS, l.cls, jointOf(l)));
    ends.get(l.no)!.A = { P1, dirOut: po.dir, built: b, startFace: po.face, zone: po.face };
    occupy(lineId.get(l.no)!, [...compSegs(b.comps), ...(P2 ? [[b.end, P1, pipeDims(l.NPS, l.cls).OD / 2] as Seg] : [])]);
  }

  /** a stub on a nozzle: its stack oriented clear of what stands, then held in the grid */
  function nozzleStub(l: LineDef, id: number) {
    const nz = nozzles.get((l.from as { id: string }).id)!, o = orient(stubItems(l, nz), it => buildStack(l.no, nz.face, nz.u, it, nz.id), id, nz.u, nz.equip), b = o.b;
    if (!o.ok) failures.push(`${l.no}: the valve at ${nz.id} strikes ${blockedBy} in every stem direction`);
    runs.set(l.no, { no: l.no, service: l.service, NPS: l.NPS, cls: l.cls, kind: 'stub', from: nz.id, to: 'blind', comps: b.comps, welds: [], supports: [], path: [nz.face, b.end], ok: true, ...(b.extra?.side ? { side: b.extra.side } : {}) });
    occupy(id, compSegs([...b.comps, ...(b.extra?.side ?? [])]));
  }
  // plant 2: the stubs on nozzles stand before any line is routed, so no line takes a vent's or drain's room (SW-PLANT-6)
  if (P2) for (const l of list.filter(l => l.kind === 'stub' && l.service !== 'RV' && l.from.k === 'nozzle')) nozzleStub(l, lineId.get(l.no)!);

  // ---- 3. route ----
  let lastWhy = '', exp = 0;
  const perLine: [string, number, number][] = [];
  const doRoute = (l: LineDef, id: number, from: EndPlan, goal: V3, goalDirs: number[] | undefined, runDir: number | undefined, zones: V3[], opts?: { margins?: number[]; budget?: number }) => {
    const r = pipeDims(l.NPS, l.cls).OD / 2, k = kOf(l.NPS, l.cls, jointOf(l));
    let why = '';
    for (const margin of opts?.margins ?? [180, 420, 900]) {
      const res = route(g, { id, r, start: from.P1, startDir: dirIndex(from.dirOut), goal, goalDirs, runDir, k, zones, margin, vertThrough: plant.verticalThroughPlatforms, zoneR: P2 ? 72 : 48, maxExpand: opts?.budget ?? (P2 ? 1_500_000 : undefined) });
      exp += res.expanded;
      if (res.ok) return res;
      why = res.why ?? ''; if (!why.startsWith('exhausted')) break;
    }
    lastWhy = `${why} at P1=${from.P1.map(v => v.toFixed(0))} goal=${goal.map(v => v.toFixed(0))}`; return null;
  };
  const routeLine = (l: LineDef) => {
    const id = lineId.get(l.no)!, e = ends.get(l.no)!, r = pipeDims(l.NPS, l.cls).OD / 2;
    // resolve tap / station ends now that parents are routed
    const lead = (t: EndPlan): Seg[] => (P2 ? [[t.built!.end, t.P1, r]] : []);   // plant 2 holds the lead pipe from the stack to P1 as the pre-planned ends do
    if (!e.A && l.from.k === 'tap') { const toward = e.B?.P1 ?? [0, 0, 0]; const t = planTap(l, l.from, toward); if (!t) return fail(l, 'no tap position on ' + l.from.line); e.A = t; occupy(id, [...compSegs(t.built!.comps), ...lead(t)]); }
    if (!e.B && l.to.k === 'tap') { const toward = e.A?.P1 ?? [0, 0, 0]; const t = planTap(l, l.to, toward); if (!t) return fail(l, 'no tap position on ' + l.to.line); e.B = t; occupy(id, [...compSegs(t.built!.comps), ...lead(t)]); }
    if (!e.A || !e.B) return fail(l, 'unresolved end');
    const A = e.A, B = e.B;
    for (const P of [A.P1, B.P1]) if (!g.onGrid(P)) return fail(l, `end point ${P.map(v => v.toFixed(2))} is off the 6 in grid`);
    const viaRack = (l.service === 'P' || (P2 && l.service === 'CA')) && Math.abs(A.P1[0] - B.P1[0]) > 240 && !A.tap && !B.tap;
    let path: V3[], rackEnds: [V3, V3] | undefined;
    if (viaRack) {
      // the rack run: a lane on the lower tier; each end drops off the rack at the bent-line x nearest its equipment,
      // or the nearest free x within 3 ft of it (so two lines leaving at the same place do not cross)
      const clampX = (x: number) => Math.min(rk.x1 - 12, Math.max(rk.x0 + 12, x));
      const xa0 = clampX(snapUp(A.P1[0])), xb0 = clampX(snapUp(B.P1[0])), OD = laneD(l), sgn = Math.sign(xb0 - xa0) || 1;
      const y = tierY(rk.tiers[0], l.NPS, l.cls), offs = [0, -6, 6, -12, 12, -18, 18, -24, 24, -30, 30, -36, 36];
      const runDir = dirIndex([sgn, 0, 0]);
      let ra: ReturnType<typeof doRoute> = null, rb: ReturnType<typeof doRoute> = null, EA: V3 = [xa0, y, 0], EB: V3 = [xb0, y, 0], done = false;
      const laneClear = (z: number, x0: number, x1: number) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x += H) { const c = g.cellOf([x, y, z]); if (!g.clear(c[0], c[1], c[2], r, [id])) return false; } return true; };
      for (const z of laneCands()) {
        if (!laneFree(rk.tiers[0], z, OD, Math.min(xa0, xb0) - 36, Math.max(xa0, xb0) + 36) || !laneClear(z, xa0 + 36 * sgn, xb0 - 36 * sgn)) continue;
        ra = rb = null;
        for (const d of offs) { EA = [clampX(xa0 + d), y, z]; if (!laneClear(z, EA[0], xa0 + 36 * sgn)) continue; ra = doRoute(l, id, A, EA, undefined, runDir, [A.zone, A.P1, EA]); if (ra) break; }
        if (!ra) continue;
        const cellsA = segsOf(ra.cells, r);
        occupy(id, cellsA);
        for (const d of offs) { EB = [clampX(xb0 + d), y, z]; if (sgn * (EB[0] - EA[0]) < 48 || !laneClear(z, EA[0], EB[0])) continue;
          rb = doRoute(l, id, B, EB, undefined, runDir ^ 1, [B.zone, B.P1, EB]); if (rb) break; }
        if (!rb) { unoccupy(id); occupy(id, compSegs([...(A.built?.comps ?? []), ...(B.built?.comps ?? [])])); for (const P of [A, B]) occupy(id, [[P.built!.end, P.P1, r]]); continue; }
        lanes.push({ tier: rk.tiers[0], z, OD, x0: Math.min(EA[0], EB[0]), x1: Math.max(EA[0], EB[0]) });
        occupy(id, [[EA, EB, r], ...segsOf(rb.cells, r)]); rackEnds = [EA, EB]; done = true; break;
      }
      if (!done) return fail(l, 'no rack lane with clear drops: ' + lastWhy);
      path = [...corners(ra!.cells), ...corners(rb!.cells).reverse()];
    } else if (plant.wallX !== undefined && (A.P1[0] - plant.wallX) * (B.P1[0] - plant.wallX) < 0) {
      // SW-RT-9: through the end wall in two legs meeting at a wall gate, both heading straight through it
      const wx = plant.wallX, sgn = Math.sign(B.P1[0] - A.P1[0]), outdoor = A.P1[0] > wx ? A : B, gateX = wx + 30, zMax = building.drawing.widthFt * 6 - 60;
      const z0 = Math.round(outdoor.P1[2] / H) * H, zs: number[] = []; for (let d = 0; d <= 120; d += 12) { if (Math.abs(z0 + d) <= zMax) zs.push(z0 + d); if (d && Math.abs(z0 - d) <= zMax) zs.push(z0 - d); }   // within 10 ft of the outdoor end's z
      const gateFree = (p: V3) => { const c = g.cellOf(p); return g.inside(c[0], c[1], c[2]) && !g.head[g.idx(c[0], c[1], c[2])] && g.clear(c[0], c[1], c[2], r, [id]); };
      let ra: ReturnType<typeof doRoute> = null, rb: ReturnType<typeof doRoute> = null, done = false;
      const restore = () => { unoccupy(id); occupy(id, compSegs([...(A.built?.comps ?? []), ...(B.built?.comps ?? [])])); for (const P of [A, B]) if (P.built) occupy(id, [[P.built.end, P.P1, r]]); };
      const legOpts = { margins: [420], budget: 800_000 }, inOpts = { margins: [420], budget: 1_500_000 }, outIsA = outdoor === A;   // the outdoor leg is short; the indoor leg falls from the rack
      for (const y of [150]) for (const z of zs) { if (done) break;
        const gate: V3 = [gateX, y, z]; if (!gateFree(gate)) continue;
        // the outdoor leg first (short, and the one a blocked approach to the equipment fails), then the indoor leg
        const first = outIsA ? A : B, second = outIsA ? B : A, dFirst = outIsA ? sgn : -sgn;
        const r1 = doRoute(l, id, first, gate, [dirIndex([dFirst, 0, 0])], undefined, [first.zone, first.P1], legOpts); if (!r1) continue;
        occupy(id, segsOf(r1.cells, r));
        const r2 = doRoute(l, id, second, gate, [dirIndex([-dFirst, 0, 0])], undefined, [second.zone, second.P1], inOpts);
        if (!r2) { restore(); continue; }
        occupy(id, segsOf(r2.cells, r)); ra = outIsA ? r1 : r2; rb = outIsA ? r2 : r1; done = true; break;
      }
      if (!done) return fail(l, 'no wall gate with routes to both ends: ' + lastWhy);
      path = [...corners(ra!.cells), ...corners(rb!.cells).reverse()];
    } else {
      const goalDirs = B.tap || l.to.k === 'station' ? undefined : undefined;
      const res = doRoute(l, id, A, B.P1, goalDirs, dirIndex(neg(B.dirOut)), [A.zone, A.P1, B.zone, B.P1]); if (!res) return fail(l, 'route failed: ' + lastWhy);
      occupy(id, segsOf(res.cells, r));
      path = corners(res.cells);
    }
    path = simplify(path); paths.set(l.no, path);
    runs.set(l.no, { no: l.no, service: l.service, NPS: l.NPS, cls: l.cls, kind: l.kind, from: endName(l.from), to: endName(l.to), comps: [], welds: [], supports: [], path, ok: true, cv: l.cv });
    (runs.get(l.no) as LineRun & { _ends?: unknown })._ends = { A, B, rack: rackEnds };
    return true;
  };
  const fail = (l: LineDef, why: string) => { failures.push(`${l.no}: ${why}`); runs.set(l.no, { no: l.no, service: l.service, NPS: l.NPS, cls: l.cls, kind: l.kind, from: endName(l.from), to: endName(l.to), comps: [], welds: [], supports: [], path: [], ok: false, note: why }); return false; };
  const segsOf = (cells: V3[], r: number): Seg[] => { const c = corners(cells), out: Seg[] = []; for (let i = 0; i < c.length - 1; i++) out.push([c[i], c[i + 1], r]); return out; };
  const order = list.filter(l => l.kind === 'routed').sort((a, b) => {
    const rank = (l: LineDef) => (l.service === 'P' ? (l.from.k === 'tap' || l.to.k === 'tap' ? 1 : 0) : l.service === 'HS' ? 4 : l.service === 'FL' ? 3 : 2);
    return rank(a) - rank(b) || b.NPS - a.NPS;
  });
  // taps that carry a safety valve (plant 2 pump discharges) are planned as the parent's children before the flare lines that leave them
  for (const l of order) { if (l.from.k === 'psv' && !psvOut.has(l.from.nozzle)) continue; const t = Date.now(); exp = 0; routeLine(l); perLine.push([l.no, Date.now() - t, exp]); }   // flare lines from the thermal reliefs on taps are routed after the stubs that carry them
  if (envVar("PIPE_DEBUG")) { perLine.sort((a, b) => b[1] - a[1]); console.log(perLine.slice(0, 15)); }
  tm.t_route = Date.now() - T0 - tm.t_static;

  // ---- 4. stubs (valve + blind on nozzles, or on taps) ----
  const stubOnTap = (l: LineDef) => {
    const id = lineId.get(l.no)!, e = l.from as Extract<EndRef, { k: 'tap' }>, parent = byNo.get(e.line)!, pp = paths.get(e.line), via = viaOf(parent, l, e);
    const toward: V3 = pp ? add(pp[Math.floor(pp.length / 2)], [0, 100, 0]) : [0, 0, 0];
    const joint = jointOf(l);
    let items: Item[] = P2 && joint !== 'BW' ? smallStub(l, joint, false)
      : [fl(l, 'wnfR'), { k: 'gasket', NPS: l.NPS, cls: l.cls }, { k: 'valve', type: isoValve(l.NPS, l.cls, groupOf(l)), NPS: l.NPS, cls: l.cls }, { k: 'gasket', NPS: l.NPS, cls: l.cls }, { k: 'blind', NPS: l.NPS, cls: l.cls }];
    if (l.service === 'RV') {   // SW-LL-6: the safety valve stands on the stub; its outlet centreline is brought onto the routing grid by the first nipple (as SW-NOZ-4)
      const v = partFromKey(`VLV|PSV|${l.NPS}|${l.cls}`), f = designFlange(l.NPS, l.cls), along = tapGeom(parent, l, via).out + stackLength(items) + f.rfH + v.dims.CFin.value;   // from the run's centreline: take-off, stub, flange face, valve inlet
      const deficit = (6 - (along % 6) + 6) % 6, first = items.findIndex(x => x.k === 'nipple');
      if (first >= 0 && deficit > 1e-9) items = items.map((x, i) => (i === first && x.k === 'nipple' ? { ...x, L: x.L + deficit } : x));
      items = [...items, { k: 'psv', NPS: l.NPS, cls: l.cls, out: [0, 0, 0] }];   // the outlet direction is set once the tap's direction is known
    }
    const t = chooseTap(e.line, toward, l, items, parent.kind === 'header', via);
    if (!t) { fail(l, 'no tap position on ' + e.line); return null; }
    const { out: C, half } = tapGeom(parent, l, via), outEnd = add(t.at, t.out, C);
    const lst = taps.get(e.line) ?? []; lst.push({ at: t.at, out: t.out, NPS: l.NPS, child: l.no, flR: designFlange(l.NPS, l.cls).OD / 2, via, half: l.service === 'RV' ? half + 12 : half }); taps.set(e.line, lst);   // a safety valve's outlet lead keeps the next tap a foot off
    return { t, outEnd, via, id };
  };
  for (const l of list.filter(l => l.kind === 'stub' && (l.service !== 'RV' || l.from.k === 'tap'))) {
    const id = lineId.get(l.no)!;
    if (l.from.k === 'nozzle') {
      if (P2) continue;   // plant 2: nozzle stubs stood before the routing (above)
      nozzleStub(l, id);
    } else if (l.from.k === 'tap') {
      const s = stubOnTap(l); if (!s) continue;
      const { t, outEnd, via } = s;
      let b = t.b;
      if (l.service === 'RV') {
        const po = { face: b.extra!.psvOutletFace!, dir: b.extra!.psvOutDir!, NPS: b.extra!.psvOutNPS! }; psvOut.set(l.no, po);
        const fl = list.find(x => x.kind === 'routed' && x.from.k === 'psv' && x.from.nozzle === l.no);   // its flare line's lead stands now, before the next stub on the run is placed
        if (fl && ends.get(fl.no) && !ends.get(fl.no)!.A) { const fb = buildStack(fl.no, po.face, po.dir, psvLeadItems(fl, po), 'PSV'), P1 = leadP1(fb.end, po.dir, R(fl.NPS, fl.cls, jointOf(fl)));
          ends.get(fl.no)!.A = { P1, dirOut: po.dir, built: fb, startFace: po.face, zone: po.face }; occupy(lineId.get(fl.no)!, [...compSegs(fb.comps), [fb.end, P1, pipeDims(fl.NPS, fl.cls).OD / 2]]); }
      }
      const comps = [...b.comps];
      if (via === 'olet') comps.unshift(oletComp(l, byNo.get(l.from.line)!, t.at, t.out, outEnd, via));
      const welds0 = P2 ? [] : deriveWelds(l.no, b.comps, [{ at: outEnd, tag: teeTag(l.from.line, l.no), NPS: l.NPS, cls: l.cls, w: t.out }], [outEnd]);   // plant 1 as stage 5; plant 2's follow once the insertions are settled
      runs.set(l.no, { no: l.no, service: l.service, NPS: l.NPS, cls: l.cls, kind: 'stub', from: `tap ${l.from.line}`, to: l.service === 'RV' ? 'PSV' : 'blind', comps, welds: welds0, supports: [], path: [outEnd, b.end], ok: true, ...(b.extra?.side ? { side: b.extra.side } : {}) });
      occupy(id, compSegs([...b.comps, ...(b.extra?.side ?? [])]));
    }
  }
  // flare lines from the thermal reliefs on taps (planned after the stubs that carry them)
  for (const l of list.filter(l => l.kind === 'routed' && l.from.k === 'psv' && byNo.get((l.from as { nozzle: string }).nozzle)?.from.k === 'tap' && psvOut.has((l.from as { nozzle: string }).nozzle))) {
    const po = psvOut.get((l.from as { nozzle: string }).nozzle)!;
    if (!ends.get(l.no)!.A) { const b = buildStack(l.no, po.face, po.dir, psvLeadItems(l, po), 'PSV'); ends.get(l.no)!.A = { P1: leadP1(b.end, po.dir, R(l.NPS, l.cls, jointOf(l))), dirOut: po.dir, built: b, startFace: po.face, zone: po.face }; occupy(lineId.get(l.no)!, compSegs(b.comps)); }
    const t = Date.now(); exp = 0; routeLine(l); perLine.push([l.no, Date.now() - t, exp]);
  }
  /** the branch outlet fitting of a child line (SW-SWT-6): on the run at `at`, its mouth at `outEnd` */
  function oletComp(child: LineDef, parent: LineDef, at: V3, out: V3, outEnd: V3, via: TapVia): Comp {
    const cj = jointOf(child), end: JointEnd = cj; void via;
    const key = `OLET|${parent.NPS}|${child.NPS}|${parent.cls}|${end}`;
    // local +y toward the outlet, local z along the run
    const pp = paths.get(parent.no)!; let w: V3 = [1, 0, 0]; for (let i = 0; i < pp.length - 1; i++) { const a = pp[i], b = pp[i + 1], d = unit(sub(b, a)), s = dot(sub(at, a), d); if (s >= -1e-6 && s <= len(sub(b, a)) + 1e-6 && len(sub(add(a, d, s), at)) < 1e-6) { w = d; break; } }
    return { tag: `${child.no}/O1`, kind: 'olet', key, T: frameFromAxes(at, out, w), a: at, b: outEnd, NPS: child.NPS, cls: child.cls, e1: 'X', e2: end === 'BW' ? 'BW' : end === 'SW' ? 'SW' : 'TH', onRun: parent.no };
  }

  // ---- supports (SW-PS-7..12) ----
  const HANG_FROM = (tag: string) => !/equipment|pad|grout|ladder|guardrail|cage|rail|tread|stair|grating|cladding|door|slab|base-plate|anchor|weld|bolt|clip|column/.test(tag);
  /** lowest steel directly above p that a hanger rod can reach, with the rod path clear of other lines */
  let dbgHang = false;
  const steelAboveExact = (p: V3, r: number, id: number): number | null => {
    let best = Infinity;
    for (let y = Math.floor((p[1] + r) / SB); y <= Math.floor(plant.grid.y1 / SB); y++) for (const dz of (P2 ? [-1, 0, 1] : [0])) for (const i of sidx.get(`${Math.floor(p[0] / SB)},${y},${Math.floor(p[2] / SB) + dz}`) ?? []) {   // plant 2: the purlin bridge reaches a cell either side
      const o = st.obstacles[i]; if (!HANG_FROM(o.tag)) continue;
      if (P2 && o.kind === 'box' && /purlin/.test(o.tag)) { if (p[0] >= o.mn[0] && p[0] <= o.mx[0] && p[2] >= o.mn[2] - 30 && p[2] <= o.mx[2] + 30 && o.mn[1] > p[1] + r) best = Math.min(best, o.mn[1]); continue; }   // SW-PS-9 amended: a purlin above, or a bridge between the two either side (30 in)
      let bottom: number;
      if (o.kind === 'box') { if (p[0] < o.mn[0] || p[0] > o.mx[0] || p[2] < o.mn[2] || p[2] > o.mx[2]) continue; bottom = o.mn[1]; }
      else {
        const ab = sub(o.b, o.a), L = len(ab); if (L < 1e-6 || Math.abs(ab[1]) / L > 0.5) continue;      // horizontal-ish members only
        const t = Math.max(0, Math.min(1, ((p[0] - o.a[0]) * ab[0] + (p[2] - o.a[2]) * ab[2]) / (ab[0] ** 2 + ab[2] ** 2 || 1))), q = add(o.a, ab, t);
        if (Math.hypot(q[0] - p[0], q[2] - p[2]) > (P2 && /purlin/.test(o.tag) ? 30 : o.r * 0.6)) continue; bottom = q[1] - o.r * 0.7;   // SW-PS-9 amended: a purlin bridge reaches 30 in
      }
      if (bottom > p[1] + r + 6 && bottom < best) best = bottom;
    }
    if (dbgHang) console.log('   steel above', p.map(v => v.toFixed(0)).join(','), 'best', isFinite(best) ? best.toFixed(0) : 'none');
    if (!isFinite(best) || best - p[1] > (P2 && r <= 1.2 ? 288 : 240)) return null;          // rods up to 20 ft (SW-PS-9); 24 ft for 2 in and smaller in plant 2
    for (let y = p[1] + r + 3; y < best - 6; y += H / 2) { const c = g.cellOf([p[0], y, p[2]]); if (!g.inside(c[0], c[1], c[2])) return null; const o = g.occ[g.idx(c[0], c[1], c[2])]; if (o !== 0 && o !== id && o !== STATIC) { if (dbgHang) console.log('   rod blocked at y', y.toFixed(0), 'by', o); return null; } }
    return best;
  };
  /** clear path straight down to the floor for a stanchion */
  const floorClear = (p: V3, r: number, id: number, floorY = 3) => { for (let y = p[1] - r - 3; y > floorY; y -= H / 2) { const c = g.cellOf([p[0], y, p[2]]); if (!g.inside(c[0], c[1], c[2])) return false; const o = g.occ[g.idx(c[0], c[1], c[2])]; if (o !== 0 && o !== id) { if (envVar("PIPE_DEBUG_FLOOR")) console.log('floor blocked at', p.map(v => v.toFixed(0)).join(','), 'y', y.toFixed(1), 'by', o); return false; } } return true; };

  function placeSupports(run: LineRun, l: LineDef): SupportRec[] {
    const out: SupportRec[] = [], OD = pipeDims(l.NPS, l.cls).OD, r = OD / 2, span = spanOf(OD), id = lineId.get(run.no)!;
    const fittings = run.comps.filter(c => c.kind !== 'pipe' && c.kind !== 'studs');
    const clearOf = (p: V3, half: number) => fittings.every(f => segDist(p, f.a, f.b) > half + 2) && run.welds.every(w => len(sub(w.at, p)) > half + 2);
    // straight horizontal runs: pipe and inline tees merged
    const runs0: { a: V3; b: V3 }[] = [];
    for (const c of run.comps.filter(x => x.kind === 'pipe' || x.kind === 'tee' || x.kind === 'coupling')) { const last = runs0[runs0.length - 1], w = unit(sub(c.b, c.a)); if (last && len(sub(last.b, c.a)) < 0.1 && Math.abs(dot(unit(sub(last.b, last.a)), w) - 1) < 1e-6) last.b = c.b; else runs0.push({ a: c.a, b: c.b }); }
    let n = 0;
    const push = (type: SupportRec['type'], at: V3, key: string, T: Mat4) => out.push({ id: `${run.no}/S${++n}`, line: run.no, type, at, key, T });
    for (const sr of runs0) {
      const w = unit(sub(sr.b, sr.a)), L = len(sub(sr.b, sr.a));
      if (Math.abs(w[1]) > 0.5) continue;
      const tier = rackTier(sr.a, sr.b, r);
      if (tier !== undefined) {
        const lo = Math.min(sr.a[0], sr.b[0]), hi = Math.max(sr.a[0], sr.b[0]), xs = rackStations(lo, hi, span);
        const bx = xs.filter(x => bentXs.includes(x)), mid = (lo + hi) / 2, anchor = bx.length ? bx.reduce((u, v) => (Math.abs(v - mid) < Math.abs(u - mid) ? v : u)) : NaN, ia = bx.indexOf(anchor);
        const h = sr.a[1] - r - tier;
        for (const x of xs) {
          const ib = bx.indexOf(x);
          const type: SupportRec['type'] = x === anchor ? 'anchor' : ib >= 0 && (Math.abs(ib - ia) === 1 || ib === 0 || ib === bx.length - 1) ? 'guide' : 'shoe';
          push(type, [x, tier, sr.a[2]], `SHOE|${l.NPS}|${l.cls}|${type}|${h.toFixed(3)}`, frameFromAxes([x, sr.a[1] - r, sr.a[2]], [0, 1, 0], [1, 0, 0]));
        }
        continue;
      }
      if (L <= 48 && run.kind !== 'header') continue;                                       // short legs are carried by the fittings either side
      // where the run passes under a horizontal member (in plan), a hanger can hang straight from it
      const crossings: number[] = [];
      if (sr.a[1] - r > 120) {
        const seen = new Set<number>();
        for (let t = 0; t <= L; t += SB / 2) { const q = add(sr.a, w, t); for (let y = Math.floor(q[1] / SB); y <= Math.floor(plant.grid.y1 / SB); y++) for (const i of sidx.get(`${Math.floor(q[0] / SB)},${y},${Math.floor(q[2] / SB)}`) ?? []) {
          if (seen.has(i)) continue; seen.add(i); const o = st.obstacles[i]; if (o.kind !== 'cap' || !HANG_FROM(o.tag)) continue;
          const ab = sub(o.b, o.a); if (Math.abs(ab[1]) > 0.5 * len(ab)) continue;
          // plan intersection of the run (sr.a + w s) with the member axis (o.a + ab u)
          const den = w[0] * ab[2] - w[2] * ab[0]; if (Math.abs(den) < 1e-9) continue;
          const dx = o.a[0] - sr.a[0], dz = o.a[2] - sr.a[2], sPos = (dx * ab[2] - dz * ab[0]) / den, u = (dx * w[2] - dz * w[0]) / den;
          if (u >= 0 && u <= 1 && sPos > 0 && sPos < L) crossings.push(sPos);
        } }
      }
      // supports stepped along the run: each at the equal division of what remains, moved in 6 in steps (never past one
      // span from the last) to clear fittings and welds and to find a floor path or steel above (SW-PS-7, SW-PS-9)
      let prev = 0;
      while (L - prev > span + 1e-6) {
        const k = Math.ceil((L - prev) / span), target = prev + (L - prev) / k, cands: number[] = crossings.filter(c => c > prev + 12 && c <= prev + span && c < L - 6);
        for (let d = 0; d <= span; d += 6) { if (target - d > prev + 12) cands.push(target - d); if (d && target + d <= prev + span && target + d < L - 6) cands.push(target + d); }
        cands.sort((u, v) => Math.abs(u - target) - Math.abs(v - target));
        let placed = -1;
        const dbg = envVar("PIPE_DEBUG_LINE") === run.no; dbgHang = dbg;
        if (dbg) console.log(run.no, 'run', sr.a, sr.b, 'prev', prev, 'target', target, 'crossings', crossings);
        for (const sPos of cands) {
          const p = add(sr.a, w, sPos); if (!clearOf(p, 3)) { if (dbg) console.log('  ', sPos, 'not clear of fittings'); continue; }
          if (dbg) console.log('  ', sPos, 'floor', p[1] - r <= 120 && floorClear(p, r, id), 'steel', steelAboveExact(p, r, id));
          const bottom = p[1] - r;
          const stanMax = plant.wallX !== undefined && p[0] > rk.x1 - 72 ? 168 : 120;   // SW-PLANT-6: stanchions to 14 ft from 6 ft west of the rack's east end outward
          const topT = rk.tiers[rk.tiers.length - 1];
          if (P2 && bottom > topT && bottom - topT <= 48 && Math.abs(p[2]) < rk.halfWidth - 6 && p[0] > rk.x0 - 1 && p[0] < rk.x1 + 1 && bentXs.some(xb => Math.abs(xb - p[0]) < 1) && floorClear(p, r, id, topT + 1)) {   // SW-PS-9 amended: a post on the top-tier beam
            push('stanchion', p, `STAN|${l.NPS}|${l.cls}|${(bottom - topT).toFixed(2)}`, frameFromAxes([p[0], topT, p[2]], [0, 1, 0], [w[0], 0, w[2]])); placed = sPos; break; }
          if (bottom <= stanMax && floorClear(p, r, id, P2 ? 9 : 3)) { push('stanchion', p, `STAN|${l.NPS}|${l.cls}|${bottom.toFixed(2)}`, frameFromAxes([p[0], 0, p[2]], [0, 1, 0], [w[0], 0, w[2]])); placed = sPos; break; }
          const top = steelAboveExact(p, r, id);
          if (top !== null) { push('hanger', p, `HANG|${l.NPS}|${l.cls}|${(top - p[1]).toFixed(2)}`, frameFromAxes(p, [0, 1, 0], [w[0], 0, w[2]])); placed = sPos; break; }
        }
        if (placed < 0) for (const sPos of cands) {                                         // SW-PS-13 trapeze when a line above blocks a single rod
          const p = add(sr.a, w, sPos); if (!clearOf(p, 3)) continue;
          const side = cross(w, [0, 1, 0]), aoff = r + 6, t1 = steelAboveExact(add(p, side, -aoff), 0.5, id), t2 = steelAboveExact(add(p, side, aoff), 0.5, id);
          if (t1 === null || t2 === null) continue;
          push('trapeze', p, `TRAP|${l.NPS}|${l.cls}|${(t1 - p[1]).toFixed(2)}|${(t2 - p[1]).toFixed(2)}`, frameFromAxes(p, [0, 1, 0], w)); placed = sPos; break;
        }
        if (placed < 0) break;                                                              // reported by the span check
        prev = placed;
      }
    }
    // trunnions under the lowest elbow of vertical runs longer than 10 ft, when that elbow is at most 10 ft up (SW-PS-10)
    const els = run.comps.filter(c => c.kind === 'elbow' && c.key.split('|')[3] === '90' && !c.key.startsWith('SWEL'));
    for (const sr of runs0) {
      const w = unit(sub(sr.b, sr.a)); if (Math.abs(w[1]) < 0.5 || len(sub(sr.b, sr.a)) < (P2 ? 72 : 120)) continue;   // SW-PS-10 (plant 2: 6 ft)
      const lowEnd = sr.a[1] < sr.b[1] ? sr.a : sr.b, el = els.find(e => len(sub(e.a, lowEnd)) < 1e-3 || len(sub(e.b, lowEnd)) < 1e-3); if (!el) continue;
      const vtx = add(lowEnd, [0, -1, 0], Rbw(l.NPS, l.cls)), top: V3 = [vtx[0], vtx[1] - r, vtx[2]];
      // the leg's local +x is the direction the elbow turns into, so its saddle top fits the elbow (SW-PS-4)
      const other = len(sub(el.a, lowEnd)) < 1e-3 ? el.b : el.a, turn = unit([other[0] - lowEnd[0], 0, other[2] - lowEnd[2]]);
      if (top[1] <= 120 && top[1] > 6 && floorClear(add(top, [0, r, 0]), r, id)) push('trunnion', top, `TRUN|${l.NPS}|${l.cls}|${top[1].toFixed(2)}`, frameFromAxes(top, [0, 1, 0], cross(turn, [0, 1, 0])));
    }
    return out;
  }

  // ---- 5. assemble routed lines and headers into an ordered chain of components; welds follow from the chain ----
  const cuts: GratingCut[] = [];
  for (const run of runs.values()) {
    if (!run.ok || run.kind === 'stub') continue;
    const l = byNo.get(run.no)!, ends0 = (run as LineRun & { _ends?: { A: EndPlan; B: EndPlan; rack?: [V3, V3] } })._ends;
    const joint = jointOf(l), comps: Comp[] = [], Rr = R(l.NPS, l.cls, joint), OD = pipeDims(l.NPS, l.cls).OD, cl = partFromKey(`CAP|${l.NPS}|${l.cls}`).extra!.len as number;
    const pipeE: EndT = joint === 'BW' ? 'BW' : joint === 'SW' ? 'SP' : 'TH', sideComps: Comp[] = [];
    let pts = simplify(run.kind === 'header' ? run.path : [ends0!.A.built!.end, ...run.path, ends0!.B.built!.end]);
    const myTaps = taps.get(run.no) ?? [];
    // SW-RT-8: short sideways jogs become 45° offsets (plant 2)
    const corner: { p: V3; ang: 45 | 90 }[] = pts.map(p => ({ p, ang: 90 }));
    if (P2) {
      const R45 = joint === 'BW' ? Rbw(l.NPS, l.cls) * Math.tan(Math.PI / 8) : Rr;
      for (let i = 1; i + 2 < pts.length; i++) {
        const a = unit(sub(pts[i], pts[i - 1])), j = sub(pts[i + 1], pts[i]), d = len(j), b = unit(sub(pts[i + 2], pts[i + 1]));
        if (d > 96 || d < 6 || Math.abs(dot(a, b) - 1) > 1e-9) continue;   // SW-RT-8: jogs to 8 ft
        const before = len(sub(pts[i], pts[i - 1])), after = len(sub(pts[i + 2], pts[i + 1])), need = d / 2 + R45 + 2;
        if (before < need + (i === 1 ? 0 : Rr) || after < need + (i + 2 === pts.length - 1 ? 0 : Rr)) continue;
        const Q1 = add(pts[i], a, -d / 2), Q2 = add(pts[i + 1], a, d / 2);
        if (myTaps.some(t => dot(sub(t.at, Q1), a) > -1 && dot(sub(t.at, Q2), a) < 1)) continue;
        let clear = true; const id = lineId.get(run.no)!, r = OD / 2;
        for (let s = 0; s <= len(sub(Q2, Q1)) + 1e-6; s += H / 2) { const q = add(Q1, unit(sub(Q2, Q1)), s), c = g.cellOf(q); if (!g.inside(c[0], c[1], c[2]) || !g.clear(c[0], c[1], c[2], r + 1.5, [id])) { clear = false; break; } }   // the diagonal is off the grid: half a cell of margin
        if (!clear) continue;
        corner.splice(i, 2, { p: Q1, ang: 45 }, { p: Q2, ang: 45 }); pts = corner.map(c => c.p); i++;
      }
    }
    const pieceMax = P2 && joint === 'SW' ? 120 : P2 && joint !== 'BW' ? 240 : 480;   // SW-SWT-5: socket-weld spools 10 ft in plant 2
    const pipeTo = (from: V3, to: V3) => {
      const rem = len(sub(to, from)); if (rem < 0.05) return;
      const w = unit(sub(to, from)), n = Math.ceil((rem + 48) / pieceMax);    // SW-RT-5: ≤ 40 ft lengths, butt-weld splices between (20 ft and couplings in small bore, SW-SWT-5)
      // splices on a rack run are moved (in 6 in steps) off the beams so every beam can carry a shoe
      const tier = rackTier(from, to, OD / 2), stations = tier !== undefined ? rackStations(Math.min(from[0], to[0]) - 1e3, Math.max(from[0], to[0]) + 1e3, spanOf(OD)) : [];
      const cuts0: number[] = [0];
      for (let i = 1; i < n; i++) { let s = (rem * i) / n; for (const d of [0, 6, -6, 12, -12, 18, -18, 24, -24]) { const x = from[0] + w[0] * (s + d); if (stations.every(st => Math.abs(st - x) > 14)) { s += d; break; } } cuts0.push(s); }
      cuts0.push(rem);
      const cL = joint !== 'BW' ? partFromKey(`CPLG|${l.NPS}|${l.cls}|${joint}`).length!.value : 0;
      for (let i = 0; i < n; i++) {
        const a = add(from, w, cuts0[i] + (i > 0 ? cL / 2 : 0)), b = add(from, w, cuts0[i + 1] - (i < n - 1 ? cL / 2 : 0));
        comps.push({ tag: `${run.no}/p${comps.length + 1}`, kind: 'pipe', key: `PIPE|${l.NPS}|${l.cls}|${len(sub(b, a)).toFixed(3)}${joint === 'TH' ? '|TH' : ''}`, T: frameFromAxes(a, perp(w), w), a, b, NPS: l.NPS, cls: l.cls, e1: pipeE, e2: pipeE });
        if (i < n - 1 && joint !== 'BW') { const ca = b, cb = add(b, w, cL); comps.push({ tag: `${run.no}/c${comps.length + 1}`, kind: 'coupling', key: `CPLG|${l.NPS}|${l.cls}|${joint}`, T: frameFromAxes(ca, perp(w), w), a: ca, b: cb, NPS: l.NPS, cls: l.cls, e1: joint, e2: joint }); }
      }
    };
    const stationComps = (t: { at: V3; out: V3; child: string; via: TapVia }, w: V3) => {   // a three-way or four-way valve station in the run (3W-1, 4W-1)
      const child = byNo.get(t.child)!, type: ValveType = t.via === 'tway' ? 'TWAY' : 'FWAY', { half } = tapGeom(l, child, t.via), stem = cross(w, t.out);
      const items: Item[] = joint === 'BW'
        ? [fl(l, 'wnfR'), { k: 'gasket', NPS: l.NPS, cls: l.cls }, { k: 'valve', type, NPS: l.NPS, cls: l.cls, stem }, { k: 'gasket', NPS: l.NPS, cls: l.cls }, fl(l, 'wnf')]
        : [{ k: 'valve', type, NPS: l.NPS, cls: l.cls, stem, ends: joint }];
      const b = buildStack(run.no, add(t.at, w, -half), w, items, run.no);
      const out = b.comps.map(c => ({ ...c, tag: `${run.no}/V${comps.length + 1}:${c.tag.split('/')[1]}` }));
      const spare: Comp[] = [];
      // the four-way's spare port: a blind flange on it (flanged) or a socket plug (SW-SWT-9)
      if (type === 'FWAY') {
        const v = out.find(c => c.kind === 'valve')!, sideDir = neg(t.out), face = add(t.at, sideDir, tapGeom(l, child, t.via).out - (joint === 'BW' ? designFlange(l.NPS, l.cls).rfH : 0));
        const plugItems: Item[] = joint === 'BW' ? [{ k: 'gasket', NPS: l.NPS, cls: l.cls }, { k: 'blind', NPS: l.NPS, cls: l.cls }] : [{ k: 'plug', NPS: l.NPS, cls: l.cls, socket: joint === 'SW' }];
        const pb = buildStack(run.no, face, sideDir, plugItems, v.tag);
        spare.push(...pb.comps.map((c, i) => ({ ...c, tag: `${run.no}/V${comps.length + 1}:P${i + 1}` })));
      }
      return { comps: out, side: spare, a: add(t.at, w, -half), b: add(t.at, w, half) };
    };
    const straight = (from: V3, to: V3) => {
      const w = unit(sub(to, from)), Ltot = len(sub(to, from)); if (Ltot < 1e-6) return;
      const here = myTaps.filter(t => { const s = dot(sub(t.at, from), w); return s > 0 && s < Ltot && len(sub(add(from, w, s), t.at)) < 1e-6; }).sort((a, b) => dot(sub(a.at, from), w) - dot(sub(b.at, from), w));
      let p = from;
      for (const t of here) {
        if (t.via === 'olet') continue;                                                      // the outlet sits on the pipe; it belongs to the branch's chain
        if (t.via === 'tway' || t.via === 'fway') { const s = stationComps(t, w); pipeTo(p, s.a); comps.push(...s.comps); sideComps.push(...s.side); p = s.b; continue; }
        const C = joint === 'BW' ? teeC(OD) : smallTeeC(smallBore(l.NPS, l.cls), joint), te = add(t.at, w, -C); pipeTo(p, te);
        const key = joint === 'BW' ? `TEE|${l.NPS}|${l.cls}|${t.NPS}` : `SWTEE|${l.NPS}|${l.cls}|${t.NPS}|${joint}`;
        comps.push({ tag: teeTag(run.no, t.child), kind: 'tee', key, T: frameFromAxes(t.at, t.out, w), a: te, b: add(t.at, w, C), NPS: l.NPS, cls: l.cls, e1: joint === 'BW' ? 'BW' : joint, e2: joint === 'BW' ? 'BW' : joint });
        p = add(t.at, w, C);
      }
      pipeTo(p, to);
    };
    if (run.kind === 'header') { const w = unit(sub(pts[1], pts[0])); comps.push({ tag: `${run.no}/cap0`, kind: 'cap', key: `CAP|${l.NPS}|${l.cls}`, T: frameFromAxes(pts[0], perp(w), neg(w)), a: add(pts[0], w, -cl), b: pts[0], NPS: l.NPS, cls: l.cls, e1: 'X', e2: 'BW' }); }
    else comps.push(...ends0!.A.built!.comps.map((c, i) => ({ ...c, tag: `${run.no}/A${i + 1}` })));   // SW-GT-1: unique tags (start stack A, end stack B)
    let cursor = pts[0];
    for (let i = 1; i < pts.length - 1; i++) {
      const a = unit(sub(pts[i], pts[i - 1])), b = unit(sub(pts[i + 1], pts[i])), ang = corner[i].ang;
      const Lc = ang === 90 ? Rr : joint === 'BW' ? Rbw(l.NPS, l.cls) * Math.tan(Math.PI / 8) : Rr;
      const ein = add(pts[i], a, -Lc), eout = add(pts[i], b, Lc);
      straight(cursor, ein);
      const key = joint === 'BW' ? `EL|${l.NPS}|${l.cls}|${ang}` : `SWEL|${l.NPS}|${l.cls}|${ang}|${joint}`;
      comps.push({ tag: `${run.no}/el${comps.length + 1}`, kind: 'elbow', key, T: frameFromAxes(ein, cross(a, b), a), a: ein, b: eout, NPS: l.NPS, cls: l.cls, e1: joint === 'BW' ? 'BW' : joint, e2: joint === 'BW' ? 'BW' : joint });
      cursor = eout;
    }
    straight(cursor, pts[pts.length - 1]);
    if (run.kind === 'header') { const w = unit(sub(pts[1], pts[0])), e = pts[pts.length - 1]; comps.push({ tag: `${run.no}/cap1`, kind: 'cap', key: `CAP|${l.NPS}|${l.cls}`, T: frameFromAxes(e, perp(w), w), a: e, b: add(e, w, cl), NPS: l.NPS, cls: l.cls, e1: 'BW', e2: 'X' }); }
    else comps.push(...ends0!.B.built!.comps.map((c, i) => ({ ...c, tag: `${run.no}/B${i + 1}` })).reverse());
    // a branch that leaves its parent through an olet carries the olet as its first item (SW-SWT-6)
    if (ends0) for (const [e, atStart] of [[ends0.A, true], [ends0.B, false]] as const) if (e.tap?.via === 'olet') {
      const parent = byNo.get(e.tap.parent)!, o = oletComp(l, parent, e.tap.at, e.tap.out, e.startFace!, 'olet');
      if (atStart) comps.unshift(o); else comps.push({ ...o, tag: `${run.no}/O2`, a: o.b, b: o.a, e1: o.e2, e2: o.e1 });
    }
    if (P2) { for (const c of comps) if (c.e1 === undefined) { c.e1 = 'BW'; c.e2 = 'BW'; } settleInsertions(comps); if (sideComps.length) run.side = sideComps; }
    run.comps = comps; if (P2) run.joint = joint;
    // field welds (SW-PW-2): the closing weld at each end stack, the tee outlet at a tap, and where the line meets its rack run
    const fieldAt: V3[] = [];
    if (ends0) {
      for (const e of [ends0.A, ends0.B]) fieldAt.push(e.built!.end);
      if (ends0.rack) { const [EA, EB] = ends0.rack, w = unit(sub(EB, EA)); fieldAt.push(add(EA, w, Rr), add(EB, w, -Rr)); }
    }
    const ext: ExtJoint[] = [];
    for (const e of ends0 ? [ends0.A, ends0.B] : []) if (e.tap) {
      if (e.tap.via === 'tee') ext.push({ at: e.startFace!, tag: teeTag(e.tap.parent, run.no), NPS: l.NPS, cls: l.cls, w: e.tap.out, type: joint === 'BW' ? 'BW' : 'SW' });
      else if (e.tap.via === 'olet') { const pOD = pipeDims(byNo.get(e.tap.parent)!.NPS, byNo.get(e.tap.parent)!.cls).OD; ext.push({ at: add(e.tap.at, e.tap.out, pOD / 2), tag: `${e.tap.parent}/run`, NPS: l.NPS, cls: l.cls, w: e.tap.out, type: 'FW', join: e === ends0!.A ? `${run.no}/O1` : `${run.no}/O2` }); }
    }
    run.welds = deriveWelds(run.no, comps, ext, fieldAt);
    run.supports = placeSupports(run, l);
    if (P2) run.pens = penetrations(run, l);
  }
  // stubs on olets: the branch weld to the run, and the socket welds of the stub's own chain
  for (const run of runs.values()) if (run.ok && run.kind === 'stub' && P2) {
    const l = byNo.get(run.no)!; settleInsertions(run.comps);
    const o = run.comps.find(c => c.kind === 'olet'), ext: ExtJoint[] = [];
    if (o) { const parent = byNo.get(o.onRun!)!, pOD = pipeDims(parent.NPS, parent.cls).OD, out = unit(sub(o.b, o.a)); ext.push({ at: add(o.a, out, pOD / 2), tag: `${o.onRun}/run`, NPS: l.NPS, cls: l.cls, w: out, type: 'FW', join: o.tag }); }
    else if (run.from.startsWith('tap ')) { const parent = byNo.get(run.from.slice(4))!, first = run.comps[0], w = unit(sub(first.b, first.a)); ext.push({ at: first.a, tag: teeTag(parent.no, run.no), NPS: l.NPS, cls: l.cls, w, type: jointOf(l) === 'BW' ? 'BW' : 'SW' }); }
    run.welds = deriveWelds(run.no, run.comps, ext, o ? [] : [run.comps[0].a]);
    if (run.side?.length) {   // SW-LL-7: each side-port stack is its own short chain, socket-welded at the port
      settleInsertions(run.side);
      const groups = new Map<string, Comp[]>(); for (const c of run.side) { const k = c.tag.replace(/\d+$/, ''); groups.set(k, [...(groups.get(k) ?? []), c]); }
      let n = run.welds.length;
      for (const [k, g] of groups) { const first = g[0], w = unit(sub(first.b, first.a)); const ws = deriveWelds(run.no, g, [{ at: first.a, tag: k.slice(0, k.lastIndexOf(':')), NPS: first.NPS, cls: first.cls, w, type: 'SW' }], []); run.welds.push(...ws.map(x => ({ ...x, id: `${run.no}/W${++n}` }))); }
    }
  }
  /** SW-PEN-1/2: sleeves where a vertical run passes a platform grating and where a run passes the end wall */
  function penetrations(run: LineRun, l: LineDef): Comp[] {
    const out: Comp[] = []; let n = 0;
    for (const c of run.comps) {
      if (c.kind !== 'pipe' && c.kind !== 'nipple') continue;
      const w = unit(sub(c.b, c.a)), L = len(sub(c.b, c.a));
      if (Math.abs(w[1]) > 0.5) for (const gr of st.gratings) {
        const lo = Math.min(c.a[1], c.b[1]), hi = Math.max(c.a[1], c.b[1]);
        if (gr.top <= lo || gr.top >= hi || c.a[0] < gr.box[0][0] || c.a[0] > gr.box[1][0] || c.a[2] < gr.box[0][2] || c.a[2] > gr.box[1][2]) continue;
        const part = partFromKey(`FSLV|${l.NPS}|${l.cls}`), z0 = part.extra!.z0 as number, z1 = part.extra!.z1 as number, at: V3 = [c.a[0], gr.top, c.a[2]];
        out.push({ tag: `${run.no}/PEN${++n}`, kind: 'penetration', key: part.id, T: frameFromAxes(at, [1, 0, 0], [0, 1, 0]), a: add(at, [0, 1, 0], z0), b: add(at, [0, 1, 0], z1), NPS: l.NPS, cls: l.cls, e1: 'X', e2: 'X' });
        cuts.push({ x: at[0], z: at[2], y: gr.top, r: (part.extra!.cutD as number) / 2 });
      }
      if (plant.wallX !== undefined && Math.abs(w[0]) > 0.5 && Math.min(c.a[0], c.b[0]) < plant.wallX && Math.max(c.a[0], c.b[0]) > plant.wallX) {
        const part = partFromKey(`WSLV|${l.NPS}|${l.cls}`), z0 = part.extra!.z0 as number, z1 = part.extra!.z1 as number, at: V3 = [plant.wallX, c.a[1], c.a[2]], outw: V3 = [1, 0, 0];
        out.push({ tag: `${run.no}/PEN${++n}`, kind: 'penetration', key: part.id, T: frameFromAxes(at, [0, 1, 0], outw), a: add(at, outw, z0), b: add(at, outw, z1), NPS: l.NPS, cls: l.cls, e1: 'X', e2: 'X' });
      }
      void L;
    }
    return out;
  }
  // ---- equipment nozzles (SW-NOZ-1): weld-neck flange facing out, nozzle pipe from its hub back to the shell ----
  const nozzleRuns: NozzleRun[] = [];
  for (const nz of nozzles.values()) {
    const { Lf, rf } = flangeLen(nz.NPS, nz.cls), w = neg(nz.u), Lp = nz.S - rf - Lf;
    const items: Item[] = [{ k: 'wnf', NPS: nz.NPS, cls: nz.cls }, ...(Lp > 0.05 ? [{ k: 'pipe', NPS: nz.NPS, cls: nz.cls, L: Lp } as Item] : [])];
    const b = buildStack(nz.id, nz.face, w, items, nz.id);
    nozzleRuns.push({ id: nz.id, equip: nz.equip, service: nz.service, NPS: nz.NPS, cls: nz.cls, face: nz.face, u: nz.u, comps: b.comps, welds: deriveWelds(nz.id, b.comps, [], []) });
  }

  const lines = list.map(l => runs.get(l.no)!).filter(Boolean);
  { const byRun = new Map(lines.map(r => [r.no, r] as const)); for (const r of lines) r.lineClass = lineClassCode(r, byRun); }   // SW-LC-2
  const stats = { lines: lines.length, routed: lines.filter(r => r.kind !== 'stub' && r.ok).length, failed: failures.length, comps: lines.reduce((s, r) => s + r.comps.length, 0), welds: lines.reduce((s, r) => s + r.welds.length, 0), supports: lines.reduce((s, r) => s + r.supports.length, 0), ...(P2 ? { penetrations: lines.reduce((s, r) => s + (r.pens?.length ?? 0), 0) } : {}), ...tm, t_total: Date.now() - T0 };
  for (const run of runs.values()) delete (run as LineRun & { _ends?: unknown })._ends;
  if (!P2) for (const r of [...lines, ...nozzleRuns]) for (const c of r.comps) { delete c.e1; delete c.e2; }        // plant 1's committed records carry no end types
  return { ...(P2 ? { plant: plant.id } : {}), lines, nozzles: nozzleRuns, failures, stats, ...(P2 ? { cuts } : {}) };
}

const endName = (e: EndRef) => e.k === 'nozzle' ? e.id : e.k === 'tap' ? `tap ${e.line}` : e.k === 'psv' ? `PSV on ${e.nozzle}` : e.k === 'station' ? 'hose station' : 'blind';
function simplify(p: V3[]): V3[] {
  const q = p.filter((v, i) => i === 0 || len(sub(v, p[i - 1])) > 1e-6);
  const out: V3[] = [q[0]];
  for (let i = 1; i < q.length - 1; i++) { const a = unit(sub(q[i], out[out.length - 1])), b = unit(sub(q[i + 1], q[i])); if (Math.abs(dot(a, b) - 1) > 1e-9) out.push(q[i]); }
  if (q.length > 1) out.push(q[q.length - 1]);
  return out;
}
function segDist(p: V3, a: V3, b: V3) { const ab = sub(b, a), t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / (dot(ab, ab) || 1))); return len(sub(p, add(a, ab, t))); }
export { transformMesh };
/** the committed plant piping data: the model with numbers rounded to 1/10000 in (deterministic, compact) */
export const serializePiping = (m: PipingModel) => JSON.stringify({ ...(m.plant ? { plant: m.plant } : {}), lines: m.lines, nozzles: m.nozzles, failures: m.failures, stats: Object.fromEntries(Object.entries(m.stats).filter(([k]) => !k.startsWith('t_'))), ...(m.cuts ? { cuts: m.cuts } : {}) }, (_k, v) => (typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v));
void closeNippleLength; void (0 as unknown as Vec3);
