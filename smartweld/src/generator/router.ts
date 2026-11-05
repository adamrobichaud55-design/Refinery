/**
 * Orthogonal pipe router (SW-RT-*): a 6 in occupancy grid of the building, a distance field for
 * clearances, and an A* search over (cell, direction, straight-run) states so elbows are never closer
 * than their own length (SW-RT-4). Plain data in, plain data out.
 */
export type V3 = [number, number, number];
export const H = 6;                                  // SW-RT-3 grid (in)
export const STATIC = 65535;
export const DIRS: V3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
export const dirIndex = (d: V3) => DIRS.findIndex(e => e[0] === Math.sign(d[0]) && e[1] === Math.sign(d[1]) && e[2] === Math.sign(d[2]));

export class Grid {
  readonly nx: number; readonly ny: number; readonly nz: number; readonly N: number;
  occ: Uint16Array; dist: Float32Array; near: Uint16Array; head: Uint8Array;   // head: 1 = headroom zone (floor walkway or above a platform)
  plat: Uint8Array;                                                           // 1 = a platform grating or the headroom above it that only vertical moves may cross (SW-PEN-4)
  /** reach: how far (in) the occupant's surface may extend beyond this occupied cell's centre, so that for any
   *  point P the gap to that occupant is at least |P − centre| − reach (SW-RT-3 clearance is checked with it) */
  reach: Float32Array; maxReach = 0;
  /** 1 where the occupant was marked as a box (its exact box is held elsewhere for exact tests) */
  boxy: Uint8Array;
  constructor(readonly ox: number, readonly oy: number, readonly oz: number, x1: number, y1: number, z1: number) {
    this.nx = Math.ceil((x1 - ox) / H) + 1; this.ny = Math.ceil((y1 - oy) / H) + 1; this.nz = Math.ceil((z1 - oz) / H) + 1; this.N = this.nx * this.ny * this.nz;
    this.occ = new Uint16Array(this.N); this.dist = new Float32Array(this.N).fill(1e6); this.near = new Uint16Array(this.N); this.head = new Uint8Array(this.N); this.plat = new Uint8Array(this.N); this.reach = new Float32Array(this.N); this.boxy = new Uint8Array(this.N);
  }
  idx(i: number, j: number, k: number) { return i + this.nx * (j + this.ny * k); }
  ijk(c: number): V3 { const i = c % this.nx, j = Math.floor(c / this.nx) % this.ny, k = Math.floor(c / (this.nx * this.ny)); return [i, j, k]; }
  cellOf(p: V3): V3 { return [Math.round((p[0] - this.ox) / H), Math.round((p[1] - this.oy) / H), Math.round((p[2] - this.oz) / H)]; }
  pos(i: number, j: number, k: number): V3 { return [this.ox + i * H, this.oy + j * H, this.oz + k * H]; }
  inside(i: number, j: number, k: number) { return i >= 0 && j >= 0 && k >= 0 && i < this.nx && j < this.ny && k < this.nz; }
  onGrid(p: V3) { return [0, 1, 2].every(a => Math.abs(((p[a] - [this.ox, this.oy, this.oz][a]) / H) - Math.round((p[a] - [this.ox, this.oy, this.oz][a]) / H)) < 1e-6); }

  /** mark cells whose centres lie inside an axis-aligned box */
  /** occupancy: cells within half a cell of the box (so every face has marked centres within H/2 of it), reach H/2;
   *  headroom: cells whose centres are inside the box */
  markBox(mn0: V3, mx0: V3, id: number, field: 'occ' | 'head' | 'plat' = 'occ') {
    const e = field === 'occ' ? H / 2 : 0, mn: V3 = [mn0[0] - e, mn0[1] - e, mn0[2] - e], mx: V3 = [mx0[0] + e, mx0[1] + e, mx0[2] + e];
    const i0 = Math.max(0, Math.ceil((mn[0] - this.ox) / H - 1e-9)), i1 = Math.min(this.nx - 1, Math.floor((mx[0] - this.ox) / H + 1e-9));
    const j0 = Math.max(0, Math.ceil((mn[1] - this.oy) / H - 1e-9)), j1 = Math.min(this.ny - 1, Math.floor((mx[1] - this.oy) / H + 1e-9));
    const k0 = Math.max(0, Math.ceil((mn[2] - this.oz) / H - 1e-9)), k1 = Math.min(this.nz - 1, Math.floor((mx[2] - this.oz) / H + 1e-9));
    const out: number[] = [];
    for (let k = k0; k <= k1; k++) for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const c = this.idx(i, j, k);
      if (field === 'head') this.head[c] = 1; else if (field === 'plat') this.plat[c] = 1; else if (this.occ[c] === 0 || id === STATIC) { this.occ[c] = id; this.reach[c] = Math.max(this.reach[c], H / 2); this.boxy[c] = 1; out.push(c); }
    }
    if (field === 'occ') this.maxReach = Math.max(this.maxReach, H / 2);
    return out;
  }
  /** mark cells whose centres lie within r of the segment a–b (members, pipes) */
  /** mark cells within r (+ inflate, for axes off the grid) of the segment; reach = r − distance of the centre from the axis */
  markCapsule(a: V3, b: V3, r: number, id: number, inflate = 0) {
    const q = r + inflate, mn: V3 = [Math.min(a[0], b[0]) - q, Math.min(a[1], b[1]) - q, Math.min(a[2], b[2]) - q], mx: V3 = [Math.max(a[0], b[0]) + q, Math.max(a[1], b[1]) + q, Math.max(a[2], b[2]) + q];
    const i0 = Math.max(0, Math.ceil((mn[0] - this.ox) / H)), i1 = Math.min(this.nx - 1, Math.floor((mx[0] - this.ox) / H));
    const j0 = Math.max(0, Math.ceil((mn[1] - this.oy) / H)), j1 = Math.min(this.ny - 1, Math.floor((mx[1] - this.oy) / H));
    const k0 = Math.max(0, Math.ceil((mn[2] - this.oz) / H)), k1 = Math.min(this.nz - 1, Math.floor((mx[2] - this.oz) / H));
    const ab: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2 || 1e-12, out: number[] = [];
    for (let k = k0; k <= k1; k++) for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const p = this.pos(i, j, k), t = Math.min(1, Math.max(0, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1] + (p[2] - a[2]) * ab[2]) / L2));
      const d = Math.hypot(p[0] - a[0] - t * ab[0], p[1] - a[1] - t * ab[1], p[2] - a[2] - t * ab[2]);
      if (d <= r + inflate) { const c = this.idx(i, j, k); if (this.occ[c] === 0 || id === STATIC) { this.occ[c] = id; this.reach[c] = Math.max(this.reach[c], r - d); out.push(c); } }
    }
    this.maxReach = Math.max(this.maxReach, r);
    return out;
  }
  /** SW-RT-3: a pipe of radius r on this cell centre keeps `clr` from everything except the ids in `own` */
  clear(i: number, j: number, k: number, r: number, own: number[], clr = 3): boolean {
    const c = this.idx(i, j, k), o = this.occ[c];
    if (o !== 0 && !own.includes(o)) return false;
    if (this.dist[c] * H >= r + clr + this.maxReach) return true;
    const Rc = Math.ceil((r + clr + this.maxReach) / H);
    for (let dk = -Rc; dk <= Rc; dk++) for (let dj = -Rc; dj <= Rc; dj++) for (let di = -Rc; di <= Rc; di++) {
      const ii = i + di, jj = j + dj, kk = k + dk; if (!this.inside(ii, jj, kk)) continue;
      const q = this.idx(ii, jj, kk), o2 = this.occ[q]; if (o2 === 0 || own.includes(o2)) continue;
      if (Math.hypot(di, dj, dk) * H - this.reach[q] < r + clr) return false;
    }
    return true;
  }
  /** full distance field (cells, chamfer approximation of Euclidean) with the id of the nearest occupant */
  computeDistance() {
    const { nx, ny, nz, dist, near, occ } = this;
    for (let c = 0; c < this.N; c++) { if (occ[c]) { dist[c] = 0; near[c] = occ[c]; } else { dist[c] = 1e6; near[c] = 0; } }
    const w = [1, Math.SQRT2, Math.sqrt(3)];
    const nb: [number, number, number, number][] = [];
    for (let dk = -1; dk <= 1; dk++) for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const order = di + 3 * dj + 9 * dk; if (order >= 0) continue;          // backward half for the forward pass
      nb.push([di, dj, dk, w[Math.abs(di) + Math.abs(dj) + Math.abs(dk) - 1]]);
    }
    const pass = (sign: 1 | -1) => {
      const ks = sign > 0 ? [0, nz, 1] : [nz - 1, -1, -1], js = sign > 0 ? [0, ny, 1] : [ny - 1, -1, -1], is = sign > 0 ? [0, nx, 1] : [nx - 1, -1, -1];
      for (let k = ks[0]; k !== ks[1]; k += ks[2]) for (let j = js[0]; j !== js[1]; j += js[2]) for (let i = is[0]; i !== is[1]; i += is[2]) {
        const c = i + nx * (j + ny * k); let d = dist[c], n = near[c];
        for (const [di, dj, dk, ww] of nb) {
          const ii = i + sign * di, jj = j + sign * dj, kk = k + sign * dk;
          if (ii < 0 || jj < 0 || kk < 0 || ii >= nx || jj >= ny || kk >= nz) continue;
          const q = ii + nx * (jj + ny * kk), v = dist[q] + ww;
          if (v < d) { d = v; n = near[q]; }
        }
        dist[c] = d; near[c] = n;
      }
    };
    pass(1); pass(-1);
  }
  /** local distance update after new cells were occupied by `id` (radius R cells) */
  updateDistance(cells: number[], id: number, R = 6) {
    for (const c of cells) {
      const [i, j, k] = this.ijk(c);
      for (let dk = -R; dk <= R; dk++) for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) {
        const ii = i + di, jj = j + dj, kk = k + dk; if (!this.inside(ii, jj, kk)) continue;
        const q = this.idx(ii, jj, kk), d = Math.hypot(di, dj, dk);
        if (d < this.dist[q]) { this.dist[q] = d; this.near[q] = id; }
      }
    }
  }
}

export interface RouteReq {
  id: number;                 // line occupancy id
  r: number;                  // pipe outside radius (in)
  start: V3; startDir: number;  // on-grid start point and direction of the first move
  goal: V3; goalDirs?: number[];  // allowed arrival directions (undefined = any except the reverse of runDir)
  runDir?: number;            // direction the line continues after the goal (rack run); turning into it needs half a turn length
  k: number;                  // minimum cells between elbows (SW-RT-4)
  zones: V3[];                // end points whose 4 ft plan neighbourhood is exempt from headroom (SW-RT-3)
  margin?: number;            // search box margin (in)
  clearance?: number;         // SW-RT-3 clearance (in)
  vertThrough?: boolean;      // SW-PEN-4: vertical moves may cross platform gratings and their headroom
  zoneR?: number;             // plan radius of the headroom-exempt zone around each end point (48 in; 72 in in plant 2 for its tanks and silos)
  maxExpand?: number;         // search budget (states expanded) before giving up; 3,000,000 unless stated
}
export interface RouteResult { ok: boolean; cells: V3[]; turns: number; expanded: number; why?: string }

class Heap { a: number[] = []; s: number[] = []; push(f: number, st: number) { const a = this.a, s = this.s; a.push(f); s.push(st); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p] <= a[i]) break; [a[p], a[i]] = [a[i], a[p]]; [s[p], s[i]] = [s[i], s[p]]; i = p; } }
  pop(): number { const a = this.a, s = this.s, top = s[0], lf = a.pop()!, ls = s.pop()!; if (a.length) { a[0] = lf; s[0] = ls; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l] < a[m]) m = l; if (r < a.length && a[r] < a[m]) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; [s[m], s[i]] = [s[i], s[m]]; i = m; } } return top; }
  get size() { return this.a.length; } }

const TURN = 8;                                           // 4 ft per elbow (SW-RT-3)
export function route(g: Grid, q: RouteReq): RouteResult {
  const clr = q.clearance ?? 3;
  const s = g.cellOf(q.start), t = g.cellOf(q.goal), M = Math.ceil((q.margin ?? 240) / H);
  const b0: V3 = [Math.max(0, Math.min(s[0], t[0]) - M), Math.max(0, Math.min(s[1], t[1]) - M), Math.max(0, Math.min(s[2], t[2]) - M)];
  const b1: V3 = [Math.min(g.nx - 1, Math.max(s[0], t[0]) + M), Math.min(g.ny - 1, Math.max(s[1], t[1]) + M), Math.min(g.nz - 1, Math.max(s[2], t[2]) + M)];
  const lx = b1[0] - b0[0] + 1, ly = b1[1] - b0[1] + 1, lz = b1[2] - b0[2] + 1, K = q.k + 1;
  const zoneR2 = (q.zoneR ?? 48) ** 2;
  const own = [q.id];
  const free = (i: number, j: number, k: number, vertical = false) => {
    if (i < b0[0] || j < b0[1] || k < b0[2] || i > b1[0] || j > b1[1] || k > b1[2]) return false;
    const c = g.idx(i, j, k);
    if (g.head[c] || (g.plat[c] && !vertical)) { const p = g.pos(i, j, k); if (!q.zones.some(z => (p[0] - z[0]) ** 2 + (p[2] - z[2]) ** 2 <= zoneR2)) return false; }
    return g.clear(i, j, k, q.r, own, clr);
  };
  const enc = (i: number, j: number, k: number, d: number, run: number) => ((((i - b0[0]) + lx * ((j - b0[1]) + ly * (k - b0[2]))) * 6 + d) * K + run);
  const dec = (st: number) => { const run = st % K; let r = (st - run) / K; const d = r % 6; r = (r - d) / 6; const i = r % lx; r = (r - i) / lx; const j = r % ly; const k = (r - j) / ly; return [i + b0[0], j + b0[1], k + b0[2], d, run]; };
  const gs = new Map<number, number>(), par = new Map<number, number>(), heap = new Heap();
  const hfun = (i: number, j: number, k: number) => Math.abs(i - t[0]) + Math.abs(j - t[1]) + Math.abs(k - t[2]);
  const st0 = enc(s[0], s[1], s[2], q.startDir, q.k);
  const blockedWhy = (i: number, j: number, k: number) => {
    const c = g.idx(i, j, k), o = g.occ[c]; if (o !== 0 && o !== q.id) return `occ ${o}`;
    const p = g.pos(i, j, k); if (g.head[c] && !q.zones.some(z => (p[0] - z[0]) ** 2 + (p[2] - z[2]) ** 2 <= zoneR2)) return 'headroom';
    const Rc = Math.ceil((q.r + clr + g.maxReach) / H);
    for (let dk = -Rc; dk <= Rc; dk++) for (let dj = -Rc; dj <= Rc; dj++) for (let di = -Rc; di <= Rc; di++) { if (!g.inside(i + di, j + dj, k + dk)) continue; const qq = g.idx(i + di, j + dj, k + dk), o2 = g.occ[qq]; if (o2 && o2 !== q.id && Math.hypot(di, dj, dk) * H - g.reach[qq] < q.r + clr) return `clearance to ${o2} at ${g.pos(i + di, j + dj, k + dk)}`; }
    return 'free?';
  };
  if (!free(s[0], s[1], s[2], true)) return { ok: false, cells: [], turns: 0, expanded: 0, why: 'start ' + blockedWhy(s[0], s[1], s[2]) };
  if (!free(t[0], t[1], t[2], true)) return { ok: false, cells: [], turns: 0, expanded: 0, why: 'goal ' + blockedWhy(t[0], t[1], t[2]) };
  gs.set(st0, 0); heap.push(hfun(s[0], s[1], s[2]), st0);
  const rev = (d: number) => d ^ 1;
  let expanded = 0, found = -1;
  const budget = q.maxExpand ?? 3_000_000;
  while (heap.size && expanded < budget) {
    const st = heap.pop(); const [i, j, k, d, run] = dec(st); const gc = gs.get(st)!;
    expanded++;
    if (i === t[0] && j === t[1] && k === t[2]) {
      const okDir = q.goalDirs ? q.goalDirs.includes(d) : q.runDir === undefined || (d === q.runDir || (d !== rev(q.runDir) && run >= q.k));
      if (okDir) { found = st; break; }
    }
    for (let nd = 0; nd < 6; nd++) {
      if (nd === rev(d)) continue;
      if (nd !== d && run < q.k) continue;                              // SW-RT-4: no elbow until the straight is long enough
      const v = DIRS[nd], ni = i + v[0], nj = j + v[1], nk = k + v[2];
      if (!free(ni, nj, nk, !!q.vertThrough && v[1] !== 0)) continue;
      const nrun = nd === d ? Math.min(run + 1, q.k) : 1, ns = enc(ni, nj, nk, nd, nrun), ng = gc + 1 + (nd === d ? 0 : TURN);
      if (ng < (gs.get(ns) ?? Infinity)) { gs.set(ns, ng); par.set(ns, st); heap.push(ng + hfun(ni, nj, nk), ns); }
    }
  }
  if (found < 0) return { ok: false, cells: [], turns: 0, expanded, why: `exhausted ${expanded}` };
  const cells: V3[] = []; let cur: number | undefined = found, turns = 0, prevD = -1;
  while (cur !== undefined) { const [i, j, k, d] = dec(cur); cells.push(g.pos(i, j, k)); if (prevD >= 0 && d !== prevD) turns++; prevD = d; cur = par.get(cur); }
  cells.reverse();
  return { ok: true, cells, turns, expanded };
}

/** reduce a cell path to its corner vertices */
export function corners(cells: V3[]): V3[] {
  if (cells.length < 2) return cells.slice();
  const out: V3[] = [cells[0]];
  for (let i = 1; i < cells.length - 1; i++) {
    const a = cells[i - 1], b = cells[i], c = cells[i + 1];
    const d1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], d2 = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
    if (d1[0] !== d2[0] || d1[1] !== d2[1] || d1[2] !== d2[2]) out.push(b);
  }
  out.push(cells[cells.length - 1]);
  return out;
}
