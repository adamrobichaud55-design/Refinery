// Film page: the generated SmartWeld plant in a dark scene, a scripted camera path and a tracking overlay.
// It only reads the SmartWeld sources and the published plant piping; nothing here is part of that project.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildGeometry, type Role } from '@sw/geometry/partGeometry';
import { transformMesh, mergeMeshes, type MeshData, type Mat4 } from '@sw/geometry/mesh';
import { makeValve, type PartSpec, type ValveType, type PipeClass } from '@sw/catalogue';
import { setMaxCells } from '@sw/geometry/sdf';
import { plantById } from '@sw/generator/plants';
import { buildPipingObject } from '@sw/viewer/pipingView';
import { partFromKey, type PipingModel, type Comp } from '@sw/generator/piping';
import { SHOTS, TITLE_SECONDS, FPS, type Shot } from './shots';

const q = new URLSearchParams(location.search), plantId = q.get('plant') ?? 'P3', PR = Number(q.get('pr') ?? 1);
const W = 1280, H = 720, BG = 0x05070a;
const glCanvas = document.getElementById('gl') as HTMLCanvasElement, hud = document.getElementById('hud') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: q.get('aa') !== '0', preserveDrawingBuffer: true });
renderer.setPixelRatio(PR); renderer.setSize(W, H, false); glCanvas.style.width = W + 'px'; glCanvas.style.height = H + 'px';
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene(); scene.background = new THREE.Color(BG); scene.fog = new THREE.FogExp2(BG, 0.00021);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.55;
const camera = new THREE.PerspectiveCamera(42, W / H, 3, 14000);
scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x10141a, 0.35));
const key = new THREE.DirectionalLight(0xdfe9ff, 2.4); key.position.set(900, 1400, 700); scene.add(key);
const rim = new THREE.DirectionalLight(0xffb070, 1.3); rim.position.set(-900, 500, -1100); scene.add(rim);
const fillL = new THREE.DirectionalLight(0x6fa8ff, 0.5); fillL.position.set(1200, 200, -900); scene.add(fillL);

const M = (color: number, metalness: number, roughness: number, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, metalness, roughness, side: THREE.DoubleSide, ...extra });
const MATERIALS: Record<Role, THREE.Material> = {
  steel: M(0x4b5663, 0.55, 0.5), hardware: M(0x23272c, 0.7, 0.4), weld: M(0xd0a84a, 0.4, 0.5), sheet: M(0x8f9aa6, 0.6, 0.4),
  concrete: M(0x34373b, 0.0, 0.95), door: M(0x7a3f33, 0.1, 0.8), equipment: M(0xc3ccd2, 0.72, 0.3), casting: M(0x5d6873, 0.55, 0.42),
  closure: M(0xb4b9bf, 0.9, 0.25), stem: M(0xc4c8cd, 0.95, 0.2), polymer: M(0x1c1c1c, 0.0, 0.9), pipe: M(0x8e99a4, 0.82, 0.27),
  operator: M(0xd0281e, 0.2, 0.4, { emissive: 0x3a0603 }),
};
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

interface Track { tag: string; kind: string; box: THREE.Box3; centre: THREE.Vector3 }
const tracks: Track[] = [];
let stats = { lines: 0, comps: 0, welds: 0, supports: 0 }, equipCount = 0;
// The scene is cut into 40 ft cells so the renderer skips what the camera cannot see; small parts (bolts, studs, welds)
// are dropped beyond a distance at which they are under a pixel, and valves swap to a coarser mesh when far.
type Kind = 'std' | 'small' | 'near' | 'mid' | 'far';
const CELL = 480, LOD_CELL = 240, SMALL_DIST = 650;
const RANGE: Record<Kind, [number, number]> = { std: [-1e9, 1e9], small: [-1e9, SMALL_DIST], near: [-1e9, 230], mid: [230, 900], far: [900, 1e9] };
const LODS = [[34, 'near'], [15, 'mid'], [7, 'far']] as const;
const census2: Record<string, { tris: number; inst: number; per: number }> = {};
const chunks: { o: THREE.Object3D; c: THREE.Vector3; r: number; kind: Kind }[] = [];
const cellOf = (x: number, z: number, c = CELL) => `${Math.floor(x / c)},${Math.floor(z / c)}`;
const SMALL = new Set<THREE.Material>();
function addChunk(o: THREE.Mesh, kind: Kind) {
  if ((o as unknown as THREE.InstancedMesh).isInstancedMesh) (o as unknown as THREE.InstancedMesh).computeBoundingSphere(); else o.geometry.computeBoundingSphere();
  const bs = ((o as unknown as THREE.InstancedMesh).isInstancedMesh ? (o as unknown as THREE.InstancedMesh).boundingSphere : o.geometry.boundingSphere)!;
  scene.add(o); chunks.push({ o, c: bs.center.clone(), r: bs.radius, kind });
}
function addInstanced(geo: THREE.BufferGeometry, mat: THREE.Material, mats: THREE.Matrix4[], kind: Kind, label = '') {
  const by = new Map<string, THREE.Matrix4[]>();
  for (const M4 of mats) { const k = cellOf(M4.elements[12], M4.elements[14], kind === 'std' || kind === 'small' ? CELL : LOD_CELL); const a = by.get(k) ?? []; a.push(M4); by.set(k, a); }
  for (const list of by.values()) { const im = new THREE.InstancedMesh(geo, mat, list.length); im.name = label; list.forEach((M4, i) => im.setMatrixAt(i, M4)); im.instanceMatrix.needsUpdate = true; addChunk(im, kind); }
}
function cull() {
  for (const k of chunks) {
    if (k.kind === 'std') continue;
    const d = k.c.distanceTo(camera.position) - k.r;
    const [a, b] = RANGE[k.kind]; k.o.visible = d >= a && d < b;
  }
}

async function build() {
  const plant = plantById(plantId);
  const m = (await (await fetch(plantId === 'P1' ? '/plant-piping.json' : `/plants/${plantId}/plant-piping.json`)).json()) as PipingModel;
  const B = plant.building(), I = plant.interior(m.cuts);
  const hidden = ['cladding', 'trim', 'roof-sheet'];
  const list = [...B.instances, ...I.instances].filter(i => !hidden.some(t => i.tags.includes(t)));
  const cache = new Map<PartSpec, ReturnType<typeof buildGeometry>>();
  const geomOf = (p: PartSpec) => { let g = cache.get(p); if (!g) { g = buildGeometry(p); cache.set(p, g); } return g; };
  SMALL.add(MATERIALS.hardware); SMALL.add(MATERIALS.weld);
  // steel, concrete and equipment: merged per finish and per cell
  const byRole = new Map<string, MeshData[]>();
  for (const inst of list) for (const sd of geomOf(inst.part).solids) { const T = inst.transform as number[], k = `${sd.role}|${sd.mesh.normals ? 'n' : 'f'}|${cellOf(T[12], T[14])}`; const a = byRole.get(k) ?? []; a.push(transformMesh(sd.mesh, inst.transform as Mat4)); byRole.set(k, a); }
  for (const [k, meshes] of byRole) { const role = k.split('|')[0] as Role, mat = MATERIALS[role]; addChunk(new THREE.Mesh(role === 'equipment' ? toGeo(mergeMeshes(meshes)) : flatGeo(mergeMeshes(meshes)), mat), SMALL.has(mat) ? 'small' : 'std'); }
  const HEAVY = /^(SWEL|OLET|SWTEE)\|/, heavy = new Map<string, THREE.Matrix4[]>();
  // piping: the viewer's own instanced build, re-cut into cells; its valve meshes are replaced by ours below
  for (const po of [buildPipingObject(m, MATERIALS, toGeo), buildPipingObject(m, MATERIALS, toGeo, () => false, undefined, true)]) {
    for (const ch of [...po.group.children]) {
      const im = ch as THREE.InstancedMesh; if (!im.isInstancedMesh || im.name.includes('@')) continue;
      if (HEAVY.test(im.name)) { if (!heavy.has(im.name)) { const mats: THREE.Matrix4[] = []; for (let i = 0; i < im.count; i++) { const M4 = new THREE.Matrix4(); im.getMatrixAt(i, M4); mats.push(M4); } heavy.set(im.name, mats); } continue; }
      const mats: THREE.Matrix4[] = []; for (let i = 0; i < im.count; i++) { const M4 = new THREE.Matrix4(); im.getMatrixAt(i, M4); mats.push(M4); }
      { const g0 = im.geometry, n = (g0.index ? g0.index.count : g0.attributes.position.count) / 3, pre = im.name.split('|')[0]; const e = (census2[pre] ??= { tris: 0, inst: 0, per: 0 }); e.tris += n * im.count; e.inst += im.count; e.per = Math.max(e.per, n); }
      addInstanced(im.geometry, im.material as THREE.Material, mats, SMALL.has(im.material as THREE.Material) ? 'small' : 'std', im.name.split('|')[0]);
    }
  }
  // the small socket-weld and threaded fittings are meshed very finely for the catalogue view: two lighter meshes here, as for valves
  for (const [key, mats] of heavy) for (const [cells, kind] of LODS) {
    setMaxCells(cells);
    // these parts are meshed once when first made and kept by key; a trailing zero on the size gives the same part a fresh key
    const a = key.split('|'); a[1] = a[1] + (a[1].includes('.') ? '' : '.') + (kind === 'near' ? '0' : kind === 'mid' ? '00' : '000');
    try { for (const sd of buildGeometry(partFromKey(a.join('|'))).solids) addInstanced(toGeo(sd.mesh), MATERIALS[sd.role], mats, kind, a[0]); }
    finally { setMaxCells(110); }
  }
  const valves = new Map<string, THREE.Matrix4[]>();
  const take = (c: Comp) => { if (c.key.startsWith('VLV')) { const a = valves.get(c.key) ?? []; a.push(new THREE.Matrix4().fromArray(c.T as number[])); valves.set(c.key, a); } };
  for (const l of m.lines) [...l.comps, ...(l.side ?? []), ...(l.pens ?? [])].forEach(take);
  for (const n of m.nozzles) n.comps.forEach(take);
  for (const [key, mats] of valves) for (const [cells, kind] of LODS) {
    setMaxCells(cells);
    try { const a = key.split('|').slice(1) as [ValveType, string, PipeClass]; for (const sd of buildGeometry(makeValve(`${key}@${cells}`, ...(a.map((x, i) => (i === 1 ? Number(x) : x)) as [ValveType, number, PipeClass]))).solids) addInstanced(toGeo(sd.mesh), MATERIALS[sd.role], mats, kind, 'VLV-' + a[0]); }
    finally { setMaxCells(110); }
  }
  // a dark ground plane so the slab and pads sit on something
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40000, 40000), new THREE.MeshStandardMaterial({ color: 0x0b0e12, roughness: 0.9, metalness: 0.1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -8; scene.add(ground);
  for (const e of I.equipment) {
    const box = new THREE.Box3();
    for (const s of geomOf(e.part).solids) { const t = transformMesh(s.mesh, e.transform as Mat4); for (let i = 0; i < t.positions.length; i += 3) box.expandByPoint(new THREE.Vector3(t.positions[i], t.positions[i + 1], t.positions[i + 2])); }
    const kind = e.tag.startsWith('P-') ? 'PUMP' : e.tag.startsWith('E-') ? 'EXCHANGER' : e.tag.startsWith('T-') ? 'TANK' : e.tag.startsWith('C-') ? 'COLUMN' : e.tag.startsWith('D-') ? 'DRUM' : 'VESSEL';
    tracks.push({ tag: e.tag, kind, box, centre: box.getCenter(new THREE.Vector3()) });
  }
  equipCount = I.equipment.length;
  const s = m.stats as unknown as Record<string, number>; stats = { lines: s.lines, comps: s.comps, welds: s.welds, supports: s.supports };
  (document.querySelector('#badge span') as HTMLElement).textContent = plantId === 'P3' ? 'PLANT 3' : plantId === 'P2' ? 'PLANT 2' : 'PLANT 1';
  document.getElementById('t2')!.textContent = `${equipCount} equipment items · ${stats.lines} lines · ${stats.comps.toLocaleString('en-US')} components`;
  document.getElementById('t3')!.textContent = 'Every pipe, fitting, flange, valve and support generated from plain-language rules';
}

// ---- timeline ------------------------------------------------------------------------------------------------
const curves = SHOTS.map(s => ({ eye: new THREE.CatmullRomCurve3(s.eye.map(p => new THREE.Vector3(...p)), false, 'centripetal'), tgt: new THREE.CatmullRomCurve3(s.tgt.map(p => new THREE.Vector3(...p)), false, 'centripetal') }));
const total = SHOTS.reduce((a, s) => a + s.dur, 0) + TITLE_SECONDS, frames = Math.round(total * FPS);
const ease = (u: number) => u * u * (3 - 2 * u), mix = (u: number, k: number) => k * ease(u) + (1 - k) * u;   // mostly linear with soft ends
const capEl = document.getElementById('cap')!, statsEl = document.getElementById('stats')!, fadeEl = document.getElementById('fade')!, titleEl = document.getElementById('title')!;
const ctx = hud.getContext('2d')!;
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const v = new THREE.Vector3();
const project = (p: THREE.Vector3): [number, number, number] => { v.copy(p).project(camera); return [(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H, v.z]; };

function drawHud(t: number, shot: Shot | null, u: number, dim: number) {
  ctx.clearRect(0, 0, W, H); if (dim <= 0.01) return;
  ctx.globalAlpha = dim;
  // tracked equipment: the nearest few in view get corner brackets, a tag and a small cluster of scan marks
  const fwd = camera.getWorldDirection(new THREE.Vector3());
  const seen = tracks.map(k => { const d = k.centre.clone().sub(camera.position); return { k, dist: d.length(), ahead: d.dot(fwd) }; }).filter(o => o.ahead > 40 && o.dist < (shot?.reach ?? 1500))
    .map(o => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const b = o.k.box; for (let i = 0; i < 8; i++) { const [x, y] = project(new THREE.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z)); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return { ...o, x0, y0, x1, y1 }; })
    .filter(o => o.x1 > 40 && o.x0 < W - 40 && o.y1 > 50 && o.y0 < H - 50 && o.x1 - o.x0 < W * 0.8).sort((a, b) => a.dist - b.dist).slice(0, shot?.maxTags ?? 5);
  for (const o of seen) {
    const x0 = Math.max(18, o.x0), y0 = Math.max(44, o.y0), x1 = Math.min(W - 18, o.x1), y1 = Math.min(H - 44, o.y1), a = Math.min(1, Math.max(0.25, 1.25 - o.dist / (shot?.reach ?? 1500)));
    const L = Math.max(6, Math.min(16, (x1 - x0) * 0.18));
    ctx.strokeStyle = `rgba(214,242,58,${0.9 * a})`; ctx.lineWidth = 1.3; ctx.beginPath();
    for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x1, y1, -1, -1], [x0, y1, 1, -1]] as const) { ctx.moveTo(cx + sx * L, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + sy * L); }
    ctx.stroke();
    ctx.font = '700 12px "DejaVu Sans", Arial, sans-serif'; ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillText(o.k.tag, x0 + 2, y0 - 16);
    ctx.font = '9px "DejaVu Sans Mono", monospace'; ctx.fillStyle = `rgba(174,183,194,${a})`; ctx.fillText(`${o.k.kind}  ${(o.dist / 12).toFixed(0)} FT`, x0 + 2, y0 - 5);
    const seed = o.k.tag.split('').reduce((s, c) => s + c.charCodeAt(0), 0), bx = Math.min(W - 150, x1 + 10), by = Math.max(60, y0 - 6);
    for (let i = 0; i < 22; i++) {
      const on = rnd(seed + i * 3.7 + Math.floor(t * 9 + i * 0.37)) > 0.42; if (!on) continue;
      const gx = bx + Math.floor(rnd(seed * 1.3 + i) * 11) * 10, gy = by + Math.floor(rnd(seed * 2.1 + i * 5) * 5) * 10, s = rnd(seed + i * 9) > 0.7 ? 5 : 3;
      const c = rnd(seed + i * 13);
      if (c > 0.82) { ctx.fillStyle = `rgba(214,242,58,${0.85 * a})`; ctx.fillRect(gx, gy, s, s); } else { ctx.strokeStyle = `rgba(200,210,224,${0.55 * a})`; ctx.lineWidth = 1; ctx.strokeRect(gx + 0.5, gy + 0.5, s, s); }
    }
  }
  // lower rule: ticks, the elapsed part in the accent colour, a cursor
  const rx0 = 30, rx1 = W - 30, ry = H - 42, p = Math.min(1, t / (total - TITLE_SECONDS));
  ctx.strokeStyle = 'rgba(200,210,224,0.35)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let i = 0; i <= 120; i++) { const x = rx0 + ((rx1 - rx0) * i) / 120; ctx.moveTo(x + 0.5, ry); ctx.lineTo(x + 0.5, ry - (i % 10 === 0 ? 7 : 3)); }
  ctx.stroke();
  ctx.fillStyle = 'rgba(214,242,58,0.9)'; ctx.fillRect(rx0, ry - 1, (rx1 - rx0) * p, 1.5); ctx.fillRect(rx0 + (rx1 - rx0) * p - 1, ry - 9, 2, 10);
  ctx.globalAlpha = 1;
}

function setFrame(i: number) {
  const t = i / FPS; let acc = 0, si = -1, u = 0;
  for (let k = 0; k < SHOTS.length; k++) { if (t < acc + SHOTS[k].dur) { si = k; u = (t - acc) / SHOTS[k].dur; break; } acc += SHOTS[k].dur; }
  let fade = 0, titleA = 0, dim = 1;
  if (si >= 0) {
    const s = SHOTS[si], c = curves[si], w = mix(u, s.ease ?? 0.35);
    camera.position.copy(c.eye.getPoint(w)); camera.lookAt(c.tgt.getPoint(w)); camera.fov = s.fov ?? 42;
    const into = u * s.dur, left = (1 - u) * s.dur, f = si === 0 ? 0.9 : 0.22;
    fade = Math.max(into < f ? 1 - into / f : 0, left < 0.22 && si < SHOTS.length - 1 ? 1 - left / 0.22 : 0);
    capEl.innerHTML = `<small>${s.sub}</small>${s.cap}`; capEl.style.opacity = String(Math.min(1, into / 0.5, left / 0.3));
  } else {   // closing title over the last shot's end frame, slowly drifting on
    const tt = t - (total - TITLE_SECONDS), last = SHOTS.length - 1, c = curves[last], s = SHOTS[last];
    const d = c.eye.getPoint(1).sub(c.eye.getPoint(0.97)).multiplyScalar(tt * 0.9);
    camera.position.copy(c.eye.getPoint(1)).add(d); camera.lookAt(c.tgt.getPoint(1)); camera.fov = s.fov ?? 42;
    titleA = Math.min(1, tt / 0.8); dim = 1 - titleA; fade = 0.72 * titleA + Math.max(0, (tt - (TITLE_SECONDS - 0.6)) / 0.6) * 0.28;
    capEl.style.opacity = '0';
  }
  camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  cull();
  renderer.render(scene, camera);
  drawHud(t, si >= 0 ? SHOTS[si] : null, u, dim);
  fadeEl.style.opacity = String(fade); titleEl.style.opacity = String(titleA);
  const k = Math.min(1, t / 3.2), n = (x: number) => Math.round(x * ease(k)).toLocaleString('en-US');
  statsEl.innerHTML = `LINES <b>${n(stats.lines)}</b> · COMPONENTS <b>${n(stats.comps)}</b><br>WELDS <b>${n(stats.welds)}</b> · SUPPORTS <b>${n(stats.supports)}</b><br>E <b>${(camera.position.x / 12).toFixed(1)}</b> N <b>${(-camera.position.z / 12).toFixed(1)}</b> EL <b>${(100 + camera.position.y / 12).toFixed(1)}</b> FT`;
  statsEl.style.opacity = String(dim);
}

declare global { interface Window { film: { ready: Promise<void>; frames: number; fps: number; setFrame: (i: number) => void; shotStarts: number[] } } }
const starts: number[] = []; { let a = 0; for (const s of SHOTS) { starts.push(Math.round(a * FPS)); a += s.dur; } }
window.film = { ready: build(), frames, fps: FPS, setFrame, shotStarts: starts };
(window as unknown as { filmDebug: unknown }).filmDebug = { drawn: (i: number) => { setFrame(i); const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)), out: Record<string, number> = {}; for (const k of chunks) { if (!k.o.visible || !fr.intersectsSphere(new THREE.Sphere(k.c, k.r))) continue; const me = k.o as THREE.Mesh, g = me.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3 * ((me as unknown as THREE.InstancedMesh).isInstancedMesh ? (me as unknown as THREE.InstancedMesh).count : 1); const key = k.kind + ':' + (Object.entries(MATERIALS).find(([, m]) => m === me.material)?.[0]) + ':' + (me.name || ((me as unknown as THREE.InstancedMesh).isInstancedMesh ? 'inst' : 'merged')); out[key] = (out[key] ?? 0) + n; } return out; }, keys: () => census2, census: () => { const out: Record<string, number> = {}; scene.traverse(o => { const me = o as THREE.Mesh; if (!me.isMesh || !me.visible) return; const g = me.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3, inst = (me as unknown as THREE.InstancedMesh).isInstancedMesh ? (me as unknown as THREE.InstancedMesh).count : 1; const mat = Object.entries(MATERIALS).find(([, m]) => m === me.material)?.[0] ?? 'other'; const k = ((me as unknown as THREE.InstancedMesh).isInstancedMesh ? 'inst:' : 'merged:') + mat + (o.parent === scene ? ':static' : ':piping'); out[k] = (out[k] ?? 0) + Math.round(n * inst); }); return out; }, time: (i: number) => { const t = performance.now(); setFrame(i); renderer.getContext().finish(); const px = new Uint8Array(4); renderer.getContext().readPixels(0, 0, 1, 1, 6408, 5121, px); return { ms: performance.now() - t, tris: renderer.info.render.triangles, calls: renderer.info.render.calls }; } };
window.film.ready.then(() => setFrame(0)).catch(e => { document.body.insertAdjacentHTML('beforeend', `<pre style="color:#f66;position:absolute;top:0">${String(e?.stack ?? e)}</pre>`); });
