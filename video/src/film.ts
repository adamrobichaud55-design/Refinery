// Film page: the generated SmartWeld plant assembling itself in a black void. A scripted camera, sub-frame motion blur,
// a reflecting floor for the last shot and a thin tracking overlay. It only reads the SmartWeld sources and the
// published plant piping; nothing here is part of that project.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { buildGeometry, type Role } from '@sw/geometry/partGeometry';
import { transformMesh, mergeMeshes, type MeshData, type Mat4 } from '@sw/geometry/mesh';
import { makeValve, type PartSpec, type ValveType, type PipeClass } from '@sw/catalogue';
import { setMaxCells } from '@sw/geometry/sdf';
import { plantById } from '@sw/generator/plants';
import { buildPipingObject } from '@sw/viewer/pipingView';
import { partFromKey, type PipingModel, type Comp } from '@sw/generator/piping';
import { KEYS, FPS, TOTAL, AT } from './shots';

const q = new URLSearchParams(location.search), plantId = q.get('plant') ?? 'P3', QUALITY = Number(q.get('pr') ?? 1.5), MAXSUB = Number(q.get('sub') ?? 7);
const W = 1280, H = 720;
const glCanvas = document.getElementById('gl') as HTMLCanvasElement, hud = document.getElementById('hud') as HTMLCanvasElement, acc = document.getElementById('acc') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15; renderer.localClippingEnabled = true;
const scene = new THREE.Scene();
const VOID_BG = new THREE.Color(0x000000), voidFog = new THREE.FogExp2(0x000000, 0.00015);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.5;
const camera = new THREE.PerspectiveCamera(42, W / H, 3, 16000);
scene.add(new THREE.HemisphereLight(0xffffff, 0x0c0d0f, 0.25));
const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(700, 1500, 900); scene.add(key);
const rim = new THREE.DirectionalLight(0xdfe8ff, 1.5); rim.position.set(-1100, 600, -1200); scene.add(rim);
const side = new THREE.DirectionalLight(0xffffff, 0.5); side.position.set(1500, 150, -600); scene.add(side);

// what the camera has reached: steel is kept west of steelPlane, piping west of pipePlane (the rack builds ahead of the camera)
const steelPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1e6), pipePlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1e6);
const M = (color: number, metalness: number, roughness: number, planes: THREE.Plane[] = []) => new THREE.MeshStandardMaterial({ color, metalness, roughness, side: THREE.DoubleSide, clippingPlanes: planes });
const palette = (planes: THREE.Plane[]): Record<Role, THREE.Material> => ({   // silver on black, one family of greys
  steel: M(0x7d838b, 0.7, 0.42, planes), hardware: M(0x3c4046, 0.75, 0.4, planes), weld: M(0x9aa0a7, 0.6, 0.45, planes), sheet: M(0x8f959c, 0.6, 0.4, planes),
  concrete: M(0x17191c, 0.1, 0.85, planes), door: M(0x55595e, 0.3, 0.7, planes), equipment: M(0xe9ecef, 0.62, 0.27, planes), casting: M(0x9299a2, 0.78, 0.33, planes),
  closure: M(0xd2d6db, 0.9, 0.22, planes), stem: M(0xe2e5e9, 0.95, 0.2, planes), polymer: M(0x1d1f22, 0.1, 0.8, planes), pipe: M(0xd6dade, 0.86, 0.2, planes),
  operator: M(0xf1f3f5, 0.35, 0.35, planes),
});
// the building shell, raised at the end: its frame is kept west of framePlane and its cladding west of skinPlane
const framePlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), -1e6), skinPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), -1e6);
const MAT_STEEL = palette([steelPlane]), MAT_PIPE = palette([pipePlane]), MAT_FREE = palette([]), MAT_FRAME = palette([framePlane]), MAT_SKIN = palette([skinPlane]);
function toGeo(m: MeshData): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(m.positions, 3)); g.setIndex(m.indices);
  if (m.normals) { g.setAttribute('normal', new THREE.Float32BufferAttribute(m.normals, 3)); return g; }
  if (m.indices.length / 3 > 600000) { const flat = g.toNonIndexed(); flat.computeVertexNormals(); return flat; }
  return toCreasedNormals(g.toNonIndexed(), (35 * Math.PI) / 180);
}
function flatGeo(m: MeshData): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(m.positions, 3)); g.setIndex(m.indices);
  if (m.normals) { g.setAttribute('normal', new THREE.Float32BufferAttribute(m.normals, 3)); return g; }
  const flat = g.toNonIndexed(); flat.computeVertexNormals(); return flat;
}

// The scene is cut into cells so the renderer skips what the camera cannot see; small parts (bolts, studs, welds) are
// dropped beyond a distance at which they are under a pixel, and valves and small fittings carry three detail levels.
type Kind = 'std' | 'small' | 'near' | 'mid' | 'far';
const CELL = 480, LOD_CELL = 240, SMALL_DIST = 650;
const RANGE: Record<Kind, [number, number]> = { std: [-1e9, 1e9], small: [-1e9, SMALL_DIST], near: [-1e9, 230], mid: [230, 900], far: [900, 1e9] };
const LODS = [[34, 'near'], [15, 'mid'], [7, 'far']] as const;
const chunks: { o: THREE.Object3D; c: THREE.Vector3; r: number; kind: Kind; plane: THREE.Plane }[] = [];
const cellOf = (x: number, z: number, c = CELL) => `${Math.floor(x / c)},${Math.floor(z / c)}`;
const isSmall = (mat: THREE.Material) => mat === MAT_STEEL.hardware || mat === MAT_STEEL.weld || mat === MAT_PIPE.hardware || mat === MAT_PIPE.weld || mat === MAT_FRAME.hardware || mat === MAT_FRAME.weld || mat === MAT_SKIN.hardware || mat === MAT_SKIN.weld;
function addChunk(o: THREE.Mesh, kind: Kind, plane: THREE.Plane) {
  const im = o as unknown as THREE.InstancedMesh;
  if (im.isInstancedMesh) im.computeBoundingSphere(); else o.geometry.computeBoundingSphere();
  const bs = (im.isInstancedMesh ? im.boundingSphere : o.geometry.boundingSphere)!;
  scene.add(o); chunks.push({ o, c: bs.center.clone(), r: bs.radius, kind, plane });
}
function addInstanced(geo: THREE.BufferGeometry, mat: THREE.Material, mats: THREE.Matrix4[], kind: Kind) {
  const by = new Map<string, THREE.Matrix4[]>();
  for (const M4 of mats) { const k = cellOf(M4.elements[12], M4.elements[14], kind === 'std' || kind === 'small' ? CELL : LOD_CELL); const a = by.get(k) ?? []; a.push(M4); by.set(k, a); }
  for (const list of by.values()) { const im = new THREE.InstancedMesh(geo, mat, list.length); list.forEach((M4, i) => im.setMatrixAt(i, M4)); im.instanceMatrix.needsUpdate = true; addChunk(im, kind, pipePlane); }
}

interface Equip { tag: string; kind: string; group: THREE.Group; box: THREE.Box3; centre: THREE.Vector3; order: number; out: THREE.Vector3; t0: number }
interface Piece { key: string; label: string; group: THREE.Group; centre: THREE.Vector3; order: number }
const equip: Equip[] = [], pieces: Piece[] = [];
let stats = { lines: 0, comps: 0 };
const grid = new THREE.GridHelper(12000, 60, 0x55585c, 0x47494d); grid.position.set(1900, 0, 0); scene.add(grid);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x020203, roughness: 0.62, metalness: 0.25, depthWrite: false });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000), floorMat); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.5; scene.add(floor);
const mirror = new Reflector(new THREE.PlaneGeometry(60000, 60000), { textureWidth: 1280, textureHeight: 720, color: 0x4a4d52, clipBias: 0.5 }); mirror.rotation.x = -Math.PI / 2; mirror.position.y = -2.5; scene.add(mirror);

async function build() {
  const plant = plantById(plantId);
  const m = (await (await fetch(plantId === 'P1' ? '/plant-piping.json' : `/plants/${plantId}/plant-piping.json`)).json()) as PipingModel;
  const I = plant.interior(m.cuts);                                   // rack, platforms, pads and equipment; the building shell is left out
  const cache = new Map<PartSpec, ReturnType<typeof buildGeometry>>();
  const geomOf = (p: PartSpec) => { let g = cache.get(p); if (!g) { g = buildGeometry(p); cache.set(p, g); } return g; };
  const eqParts = new Set(I.equipment.map(e => e.part));
  // steel, concrete and access: merged per finish and per cell
  const byRole = new Map<string, MeshData[]>();
  for (const inst of I.instances) { if (eqParts.has(inst.part)) continue; for (const sd of geomOf(inst.part).solids) { const T = inst.transform as number[], k = `${sd.role}|${sd.mesh.normals ? 'n' : 'f'}|${cellOf(T[12], T[14])}`; const a = byRole.get(k) ?? []; a.push(transformMesh(sd.mesh, inst.transform as Mat4)); byRole.set(k, a); } }
  for (const [k, meshes] of byRole) { const mat = MAT_STEEL[k.split('|')[0] as Role]; addChunk(new THREE.Mesh(flatGeo(mergeMeshes(meshes)), mat), isSmall(mat) ? 'small' : 'std', steelPlane); }
  // the building shell: frame and cladding, each behind its own plane so the last shot can raise them over the plant
  const shell = new Map<string, MeshData[]>();
  for (const inst of plant.building().instances) { const skin = inst.tags.some(g => g === 'cladding' || g === 'trim' || g === 'roof-sheet'); for (const sd of geomOf(inst.part).solids) { const T = inst.transform as number[], k = `${sd.role}|${skin ? 's' : 'f'}|${cellOf(T[12], T[14])}`; const a = shell.get(k) ?? []; a.push(transformMesh(sd.mesh, inst.transform as Mat4)); shell.set(k, a); } }
  for (const [k, meshes] of shell) { const [role, w] = k.split('|'), mat = (w === 's' ? MAT_SKIN : MAT_FRAME)[role as Role]; addChunk(new THREE.Mesh(flatGeo(mergeMeshes(meshes)), mat), isSmall(mat) ? 'small' : 'std', w === 's' ? skinPlane : framePlane); }
  // equipment: one group each, so it can be placed in the editor view and dropped in later
  const plantCentre = new THREE.Vector3(1900, 0, 0);
  for (const e of I.equipment) {
    const group = new THREE.Group(), box = new THREE.Box3(), by = new Map<Role, MeshData[]>();
    for (const sd of geomOf(e.part).solids) { const t = transformMesh(sd.mesh, e.transform as Mat4); const a = by.get(sd.role) ?? []; a.push(t); by.set(sd.role, a); for (let i = 0; i < t.positions.length; i += 3) box.expandByPoint(new THREE.Vector3(t.positions[i], t.positions[i + 1], t.positions[i + 2])); }
    for (const [role, meshes] of by) group.add(new THREE.Mesh(toGeo(mergeMeshes(meshes)), MAT_FREE[role]));
    scene.add(group);
    const centre = box.getCenter(new THREE.Vector3()), out = centre.clone().sub(plantCentre).setY(0); if (out.length() < 1) out.set(1, 0, 0); out.normalize();
    const kind = e.tag.startsWith('P-') ? 'PUMP' : e.tag.startsWith('E-') ? 'EXCHANGER' : e.tag.startsWith('T-') ? 'TANK' : e.tag.startsWith('C-') ? 'COLUMN' : e.tag.startsWith('D-') ? 'DRUM' : 'VESSEL';
    equip.push({ tag: e.tag, kind, group, box, centre, order: 0, out, t0: 0 });
  }
  [...equip].sort((a, b) => b.centre.x - a.centre.x).forEach((e, i) => { e.order = i; });   // the east end lands first, as the camera leaves the rack there
  planDrops();
  // the control station that assembles on camera: the reflux line's stack at the column, taken out of the piping and built as single parts
  const refl = m.lines.find(l => /^C-\d+-N4$/.test(l.to));
  if (refl) {
    const mine = refl.comps.filter(c => /\/B\d+$/.test(c.tag)); refl.comps = refl.comps.filter(c => !mine.includes(c));
    for (const c of mine) {
      const group = new THREE.Group(), T = new THREE.Matrix4().fromArray(c.T as number[]);
      for (const sd of buildGeometry(partFromKey(c.key)).solids) { const me = new THREE.Mesh(toGeo(sd.mesh), MAT_FREE[sd.role]); me.matrixAutoUpdate = false; me.matrix.copy(T); group.add(me); }
      scene.add(group);
      const k = c.key.split('|'), label = k[0] === 'VLV' ? `${k[1]} VALVE ${k[2]} IN` : `${({ GSK: 'GASKET', WNF: 'FLANGE', STUDS: 'STUD SET', PIPE: 'PIPE', REDE: 'REDUCER', RED: 'REDUCER', SPEC: 'SPECTACLE BLIND' } as Record<string, string>)[k[0]] ?? k[0]} ${k[1]} IN`;
      pieces.push({ key: c.key, label, group, centre: new THREE.Vector3((c.a[0] + c.b[0]) / 2, (c.a[1] + c.b[1]) / 2, (c.a[2] + c.b[2]) / 2), order: Number(c.tag.split('/B')[1]) });
    }
    pieces.sort((a, b) => a.order - b.order).forEach((p, i) => { p.order = i; });
  }
  // piping: the viewer's own instanced build, re-cut into cells; valves and the finely meshed small fittings get lighter meshes
  const HEAVY = /^(SWEL|OLET|SWTEE)\|/, heavy = new Map<string, THREE.Matrix4[]>();
  for (const po of [buildPipingObject(m, MAT_PIPE, toGeo), buildPipingObject(m, MAT_PIPE, toGeo, () => false, undefined, true)]) {
    for (const ch of [...po.group.children]) {
      const im = ch as THREE.InstancedMesh; if (!im.isInstancedMesh || im.name.includes('@')) continue;
      const mats: THREE.Matrix4[] = []; for (let i = 0; i < im.count; i++) { const M4 = new THREE.Matrix4(); im.getMatrixAt(i, M4); mats.push(M4); }
      if (HEAVY.test(im.name)) { if (!heavy.has(im.name)) heavy.set(im.name, mats); continue; }
      addInstanced(im.geometry, im.material as THREE.Material, mats, isSmall(im.material as THREE.Material) ? 'small' : 'std');
    }
  }
  for (const [key0, mats] of heavy) for (const [cells, kind] of LODS) {
    setMaxCells(cells);
    // these parts are meshed once when first made and kept by key; a trailing zero on the size gives the same part a fresh key
    const a = key0.split('|'); a[1] = a[1] + (a[1].includes('.') ? '' : '.') + (kind === 'near' ? '0' : kind === 'mid' ? '00' : '000');
    try { for (const sd of buildGeometry(partFromKey(a.join('|'))).solids) addInstanced(toGeo(sd.mesh), MAT_PIPE[sd.role], mats, kind); }
    finally { setMaxCells(110); }
  }
  const valves = new Map<string, THREE.Matrix4[]>();
  const take = (c: Comp) => { if (c.key.startsWith('VLV')) { const a = valves.get(c.key) ?? []; a.push(new THREE.Matrix4().fromArray(c.T as number[])); valves.set(c.key, a); } };
  for (const l of m.lines) [...l.comps, ...(l.side ?? []), ...(l.pens ?? [])].forEach(take);
  for (const n of m.nozzles) n.comps.forEach(take);
  for (const [vk, mats] of valves) for (const [cells, kind] of LODS) {
    setMaxCells(cells);
    try { const a = vk.split('|').slice(1) as [ValveType, string, PipeClass]; for (const sd of buildGeometry(makeValve(`${vk}@${cells}`, ...(a.map((x, i) => (i === 1 ? Number(x) : x)) as [ValveType, number, PipeClass]))).solids) addInstanced(toGeo(sd.mesh), MAT_PIPE[sd.role], mats, kind); }
    finally { setMaxCells(110); }
  }
  const s = m.stats as unknown as Record<string, number>; stats = { lines: s.lines, comps: s.comps };
  (document.querySelector('#badge span') as HTMLElement).textContent = `PLANT ${plantId.slice(1)}`;
  document.getElementById('t2')!.textContent = `${equip.length} equipment items · ${stats.lines} lines · ${stats.comps.toLocaleString('en-US')} components`;
}

// ---- timeline ------------------------------------------------------------------------------------------------
// One camera move. The keys are joined by a cubic through every key (speed continuous), and that path is then averaged
// over a short window of time, so neither the camera's speed nor the direction it looks in changes abruptly anywhere.
const total = TOTAL, frames = Math.round(total * FPS);
const ease = (u: number) => u * u * (3 - 2 * u), outCubic = (u: number) => 1 - (1 - u) ** 3, clamp01 = (u: number) => Math.min(1, Math.max(0, u));
const KP = KEYS.map(k => [...k.eye, ...k.tgt, k.fov]), KT = KEYS.map(k => k.t);
const KM = KP.map((p, i) => p.map((_, c) => {
  if (i === 0 || i === KP.length - 1) return 0;
  const h0 = KT[i] - KT[i - 1], h1 = KT[i + 1] - KT[i];
  return (((p[c] - KP[i - 1][c]) / h0) * h1 + ((KP[i + 1][c] - p[c]) / h1) * h0) / (h0 + h1);
}));
function rawCam(t: number, out: number[]) {
  t = Math.min(total, Math.max(0, t));
  let i = 0; while (i < KT.length - 2 && t > KT[i + 1]) i++;
  const h = KT[i + 1] - KT[i], x = (t - KT[i]) / h, x2 = x * x, x3 = x2 * x;
  const a = 2 * x3 - 3 * x2 + 1, b = (x3 - 2 * x2 + x) * h, c = -2 * x3 + 3 * x2, d = (x3 - x2) * h;
  for (let k = 0; k < 7; k++) out[k] = a * KP[i][k] + b * KM[i][k] + c * KP[i + 1][k] + d * KM[i + 1][k];
}
const SIGMA = 0.24, TAPS = 9, tmp: number[] = new Array(7).fill(0);
const camAt = (t: number) => {
  const acc7 = [0, 0, 0, 0, 0, 0, 0]; let wsum = 0;
  for (let k = -TAPS; k <= TAPS; k++) { const dt = (k * 3 * SIGMA) / TAPS, w = Math.exp(-(dt * dt) / (2 * SIGMA * SIGMA)); rawCam(t + dt, tmp); for (let c = 0; c < 7; c++) acc7[c] += w * tmp[c]; wsum += w; }
  return { eye: new THREE.Vector3(acc7[0] / wsum, acc7[1] / wsum, acc7[2] / wsum), tgt: new THREE.Vector3(acc7[3] / wsum, acc7[4] / wsum, acc7[5] / wsum), fov: acc7[6] / wsum };
};
const SHUTTER = 0.5;
const DROP_T = 0.6, DROP_H = 340, moved: string[] = [];
/** when each item of equipment lands: in turn from the east end, but never falling through the camera (it lands before the camera gets there) */
function planDrops() {
  for (const e of equip) {
    const base = AT.drop + 0.25 + 2.6 * (e.order / Math.max(1, equip.length - 1));
    const hits = (t0: number) => { for (let t = t0; t <= t0 + DROP_T; t += 1 / 96) { const c = camAt(t).eye, off = DROP_H * (1 - outCubic(clamp01((t - t0) / DROP_T))); if (c.x > e.box.min.x - 70 && c.x < e.box.max.x + 70 && c.z > e.box.min.z - 70 && c.z < e.box.max.z + 70 && c.y > e.box.min.y + off - 70 && c.y < e.box.max.y + off + 70) return true; } return false; };
    let t0 = base; for (let k = 0; k < 20 && hits(t0); k++) t0 -= 0.1;
    if (t0 !== base) moved.push(`${e.tag} lands from ${t0.toFixed(2)} s, not ${base.toFixed(2)} s, to stay clear of the camera`);
    e.t0 = t0;
  }
}
/** everything that depends on time: the camera, what has been built so far, where each moving part is */
function apply(t: number) {
  const { eye, tgt, fov } = camAt(t);
  camera.position.copy(eye); camera.lookAt(tgt); camera.fov = fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  scene.background = VOID_BG; scene.fog = voidFog; grid.visible = false;
  // the floor turns from matt to reflecting as the camera settles on the finished unit
  const fl = 1 - ease(clamp01((t - AT.mirror[0]) / (AT.mirror[1] - AT.mirror[0])));
  floor.visible = fl > 0.001; floorMat.transparent = fl < 0.999; floorMat.opacity = fl; mirror.visible = fl < 0.999;
  // the rack builds ahead of the camera while it flies through; afterwards everything stands
  const u = clamp01(t / AT.rackEnd);
  steelPlane.constant = t < AT.rackEnd ? eye.x + 900 + 500 * u : 1e6; pipePlane.constant = eye.x + 330 + 250 * u + Math.max(0, t - AT.rackEnd) * 2500;
  const bu = clamp01((t - AT.building[0]) / (AT.building[1] - AT.building[0])), inB = t > AT.building[0];   // the frame runs the length of the plant first, the cladding follows it
  framePlane.constant = inB ? -150 + 3400 * clamp01(bu / 0.4) : -1e6; skinPlane.constant = inB ? -150 + 3400 * clamp01((bu - 0.26) / 0.44) : -1e6;
  for (const k of chunks) {
    if (k.c.x - k.r > k.plane.constant) { k.o.visible = false; continue; }
    const d = k.c.distanceTo(eye) - k.r, [a, b] = RANGE[k.kind]; k.o.visible = d >= a && d < b;
  }
  // equipment: absent while the rack builds, then dropping in from the east end
  for (const e of equip) {
    const p = (t - e.t0) / DROP_T;
    e.group.visible = p > 0; e.group.position.set(0, p >= 1 ? 0 : DROP_H * (1 - outCubic(clamp01(p))), 0);
  }
  // the control station: each part comes down into the line in turn
  for (const pc of pieces) { const p = (t - (AT.station + 0.3 + pc.order * 0.072)) / 0.42; pc.group.visible = p > 0; pc.group.position.set(0, p >= 1 ? 0 : 64 * (1 - outCubic(clamp01(p))), 0); }
  return { eye, tgt, mirrorOn: fl < 0.999 };
}

const hctx = hud.getContext('2d')!, actx = acc.getContext('2d')!;
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const v = new THREE.Vector3();
const project = (p: THREE.Vector3): [number, number, number] => { v.copy(p).project(camera); return [(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H, v.z]; };
const ACCENT = '214,242,58';
function marks(seed: number, t: number, bx: number, by: number, a: number, cols = 11, rows = 5) {
  for (let i = 0; i < 24; i++) {
    if (rnd(seed + i * 3.7 + Math.floor(t * 9 + i * 0.37)) < 0.45) continue;
    const gx = bx + Math.floor(rnd(seed * 1.3 + i) * cols) * 9, gy = by + Math.floor(rnd(seed * 2.1 + i * 5) * rows) * 9, sz = rnd(seed + i * 9) > 0.7 ? 5 : 3;
    if (rnd(seed + i * 13) > 0.85) { hctx.fillStyle = `rgba(${ACCENT},${0.9 * a})`; hctx.fillRect(gx, gy, sz, sz); } else { hctx.strokeStyle = `rgba(225,230,238,${0.5 * a})`; hctx.lineWidth = 1; hctx.strokeRect(gx + 0.5, gy + 0.5, sz, sz); }
  }
}
function boxOnScreen(b: THREE.Box3, off: THREE.Vector3) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, behind = false;
  for (let i = 0; i < 8; i++) { const [x, y, z] = project(new THREE.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).add(off)); if (z > 1) behind = true; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return behind ? null : { x0, y0, x1, y1 };
}
const ramp = (t: number, a: number, b: number, r = 0.4) => clamp01(Math.min((t - a) / r, (b - t) / r));   // an overlay comes and goes gradually
function drawHud(t: number) {
  hctx.clearRect(0, 0, W, H);
  // tracked equipment: thin frames, a tag and a cluster of scan marks
  for (const win of AT.tags) {
    const wa = ramp(t, win.a, win.b); if (wa <= 0) continue;
    const fwd = camera.getWorldDirection(new THREE.Vector3()), reach = win.reach;
    const seen = equip.filter(e => e.group.visible && e.group.position.y < 1).map(e => { const d = e.centre.clone().sub(camera.position); return { e, dist: d.length(), ahead: d.dot(fwd) }; }).filter(o => o.ahead > 40 && o.dist < reach)
      .map(o => ({ ...o, b: boxOnScreen(o.e.box, o.e.group.position) })).filter(o => o.b && o.b.x1 > 40 && o.b.x0 < W - 40 && o.b.y1 > 30 && o.b.y0 < H - 30 && o.b.x1 - o.b.x0 < W * 0.7).sort((a, b) => a.dist - b.dist).slice(0, win.n);
    for (const o of seen) {
      const b = o.b!, x0 = Math.max(14, b.x0), y0 = Math.max(30, b.y0), x1 = Math.min(W - 14, b.x1), y1 = Math.min(H - 20, b.y1), a = wa * Math.min(1, Math.max(0.3, 1.25 - o.dist / reach));
      hctx.strokeStyle = `rgba(235,238,242,${0.55 * a})`; hctx.lineWidth = 1; hctx.strokeRect(Math.round(x0) + 0.5, Math.round(y0) + 0.5, Math.round(x1 - x0), Math.round(y1 - y0));
      hctx.font = '700 11px "DejaVu Sans", Arial, sans-serif'; hctx.fillStyle = `rgba(255,255,255,${a})`; hctx.fillText(o.e.tag, x0 + 3, y0 - 5);
      marks(o.e.tag.split('').reduce((n, c) => n + c.charCodeAt(0), 0), t, Math.min(W - 120, x1 + 8), Math.max(34, y0), a);
    }
  }
  // the station's parts as they land
  const la = ramp(t, AT.labels[0], AT.labels[1]);
  if (la > 0) for (const pc of pieces) {
    if (!pc.group.visible || pc.order % 2 || !/^(VLV|WNF|REDE|SPEC)/.test(pc.key)) continue;
    const [x, y, z] = project(pc.centre.clone().add(pc.group.position)); if (z > 1 || x < 20 || x > W - 150) continue;
    const landed = pc.group.position.y < 1, a = la * (landed ? 0.9 : 0.5);
    hctx.strokeStyle = `rgba(${landed ? ACCENT : '235,238,242'},${a})`; hctx.lineWidth = 1; hctx.strokeRect(Math.round(x) - 9.5, Math.round(y) - 9.5, 19, 19);
    hctx.beginPath(); hctx.moveTo(x + 10, y - 10); hctx.lineTo(x + 26, y - 34 - (pc.order % 3) * 13); hctx.lineTo(x + 34, y - 34 - (pc.order % 3) * 13); hctx.stroke();
    hctx.font = '9px "DejaVu Sans Mono", monospace'; hctx.fillStyle = `rgba(235,238,242,${a})`; hctx.fillText(pc.label, x + 38, y - 31 - (pc.order % 3) * 13);
  }
  // drifting scan marks and the lower-left rule
  marks(31 + Math.floor(t / 1.3), t, 120 + rnd(Math.floor(t / 1.3)) * (W - 420), 90 + rnd(Math.floor(t / 1.3) + 5) * (H - 260), 0.75, 16, 7);
  const rx0 = 26, rx1 = 330, ry = H - 22, p = t / total;
  hctx.strokeStyle = 'rgba(225,230,238,0.4)'; hctx.lineWidth = 1; hctx.beginPath(); for (let i = 0; i <= 60; i++) { const x = Math.round(rx0 + ((rx1 - rx0) * i) / 60) + 0.5; hctx.moveTo(x, ry); hctx.lineTo(x, ry - (i % 10 === 0 ? 6 : 3)); } hctx.stroke();
  hctx.fillStyle = `rgba(${ACCENT},0.95)`; hctx.fillRect(rx0, ry + 2, (rx1 - rx0) * p, 1.5);
}

const fadeEl = document.getElementById('fade')!;
/** the camera's travel (in) and turn (degrees) over one shutter interval at time t */
function motion(t: number) {
  const dt = 1 / FPS, c0 = camAt(t), c1 = camAt(Math.min(total, t + dt * SHUTTER));
  return { travel: c0.eye.distanceTo(c1.eye), turn: (c0.tgt.clone().sub(c0.eye).angleTo(c1.tgt.clone().sub(c1.eye)) * 180) / Math.PI };
}
function setFrame(i: number) {
  const t = i / FPS, dt = 1 / FPS;
  // how many sub-frames the motion needs: the camera's travel and turn over one frame
  const { travel, turn } = motion(t), mir = t > AT.mirror[0];
  const N = mir ? Math.max(1, Math.min(4, Math.ceil(Math.max(travel / 6, turn / 0.45)))) : Math.max(1, Math.min(t > AT.drop ? Math.min(MAXSUB, 5) : MAXSUB, Math.ceil(Math.max(travel / 2.6, turn / 0.22))));
  const pr = N > 1 ? Math.min(QUALITY, 1.2) : mir ? Math.min(QUALITY, 1.25) : QUALITY; renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
  actx.globalAlpha = 1; actx.fillStyle = '#000'; actx.fillRect(0, 0, acc.width, acc.height);
  for (let k = 0; k < N; k++) { apply(Math.min(total, t + (dt * SHUTTER * k) / N)); renderer.render(scene, camera); actx.globalAlpha = 1 / (k + 1); actx.drawImage(glCanvas, 0, 0, acc.width, acc.height); }
  actx.globalAlpha = 1;
  apply(t); drawHud(t);
  fadeEl.style.opacity = String(Math.max(t < 0.4 ? 1 - t / 0.4 : 0, total - t < 0.6 ? 1 - (total - t) / 0.6 : 0));
  return N;
}
/** speed (in/s) and turn rate (deg/s) of the camera at every frame, for checking the move */
const profile = () => Array.from({ length: frames }, (_, i) => { const m = motion(i / FPS); return [Math.round((m.travel * FPS) / SHUTTER), Math.round((m.turn * FPS) / SHUTTER)]; });

declare global { interface Window { film: { ready: Promise<void>; frames: number; fps: number; setFrame: (i: number) => number; profile: () => number[][]; moved: string[] } } }
window.film = { ready: build(), frames, fps: FPS, setFrame, profile, moved };
window.film.ready.then(() => setFrame(0)).catch(e => { document.body.insertAdjacentHTML('beforeend', `<pre style="color:#f66;position:absolute;top:0">${String(e?.stack ?? e)}</pre>`); });
