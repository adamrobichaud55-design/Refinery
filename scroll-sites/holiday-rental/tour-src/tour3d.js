// A live 3D walkthrough of a one-bedroom sea-view apartment, drawn in the browser with three.js. Scrolling moves the
// camera along one unbroken path: in at the door, past the kitchen, through the living room, out onto the balcony,
// along it into the bedroom, on to the bathroom, then up through the ceiling to look down on the whole plan.
// Everything is built here from code (walls, furniture, textures, sky and sea): there are no model or image files.
//
//   Tour3D({ canvas, section, onUpdate({ frame 0..240, progress, portrait, width, height }), onLoad(1) })  ->  { setTime(0..1) }
// Units are metres. x runs east, z runs south (the sea is to the north, at negative z), y is up.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const H = 2.7, T = 0.12;                                   // ceiling height, wall thickness
const rng = seed => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const smooth = v => v * v * (3 - 2 * v), clamp01 = v => Math.min(1, Math.max(0, v)), lerp = (a, b, t) => a + (b - a) * t;

// ---- textures, painted on canvases --------------------------------------------------------------------------------
function tex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}
const planks = (base, vary, seed, rows = 32, size = 2048) => tex(size, size, (c, w, h) => {
  const R = rng(seed), rh = h / rows;
  for (let r = 0; r < rows; r++) {
    let x = -R() * w * 0.4;
    while (x < w) {
      const len = w * (0.22 + R() * 0.3), t = (R() - 0.5) * 2 * vary; c.fillStyle = `rgb(${(base[0] + t) | 0},${(base[1] + t * 0.9) | 0},${(base[2] + t * 0.8) | 0})`; c.fillRect(x, r * rh, len, rh);
      for (let k = 0; k < 22; k++) { const y = r * rh + R() * rh; c.strokeStyle = R() < 0.55 ? `rgba(70,45,25,${0.03 + R() * 0.07})` : `rgba(255,240,215,${0.03 + R() * 0.06})`; c.lineWidth = 0.6 + R() * 1.6; c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + len * 0.3, y + (R() - 0.5) * 6, x + len * 0.6, y + (R() - 0.5) * 6, x + len, y + (R() - 0.5) * 4); c.stroke(); }
      c.fillStyle = 'rgba(45,28,16,.5)'; c.fillRect(x + len - 1, r * rh, 2, rh); x += len;
    }
    c.fillStyle = 'rgba(45,28,16,.45)'; c.fillRect(0, r * rh, w, 2);
  }
});
const grain = (seed, lo, hi, n = 9000, size = 256) => tex(size, size, (c, w, h) => { const R = rng(seed); c.fillStyle = `rgb(${lo},${lo},${lo})`; c.fillRect(0, 0, w, h); for (let i = 0; i < n; i++) { const v = (lo + R() * (hi - lo)) | 0; c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(R() * w, R() * h, 1 + R() * 2, 1 + R() * 2); } }, false);
const tiles = (col, line, n, size = 512, seed = 5) => tex(size, size, (c, w, h) => { const R = rng(seed), s = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const t = (R() - 0.5) * 10; c.fillStyle = `rgb(${col[0] + t | 0},${col[1] + t | 0},${col[2] + t | 0})`; c.fillRect(i * s, j * s, s, s); } c.strokeStyle = line; c.lineWidth = 3; for (let i = 0; i <= n; i++) { c.beginPath(); c.moveTo(i * s, 0); c.lineTo(i * s, h); c.moveTo(0, i * s); c.lineTo(w, i * s); c.stroke(); } });
const marble = seed => tex(1024, 512, (c, w, h) => { const R = rng(seed); c.fillStyle = '#f1eee9'; c.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) { c.strokeStyle = `rgba(120,115,110,${0.05 + R() * 0.16})`; c.lineWidth = 0.6 + R() * 2.4; let x = R() * w, y = R() * h; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (R() - 0.3) * 190; y += (R() - 0.5) * 110; c.lineTo(x, y); } c.stroke(); } });
const rugTex = () => tex(1024, 768, (c, w, h) => {
  c.fillStyle = '#e9e1d2'; c.fillRect(0, 0, w, h); const R = rng(11);
  for (let i = 0; i < 16000; i++) { c.fillStyle = `rgba(${R() < 0.5 ? 120 : 255},${R() < 0.5 ? 100 : 250},${R() < 0.5 ? 80 : 235},.07)`; c.fillRect(R() * w, R() * h, 2, 2); }
  c.strokeStyle = '#b9643c'; c.lineWidth = 10; c.strokeRect(46, 46, w - 92, h - 92); c.strokeStyle = '#2f4a45'; c.lineWidth = 4; c.strokeRect(74, 74, w - 148, h - 148);
  for (let i = 0; i < 7; i++) for (let j = 0; j < 4; j++) { const x = 150 + i * 121, y = 150 + j * 156, s = 44; c.fillStyle = (i + j) % 2 ? '#b9643c' : '#2f4a45'; c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s * 0.8, y); c.lineTo(x, y + s); c.lineTo(x - s * 0.8, y); c.closePath(); c.fill(); c.fillStyle = '#e9e1d2'; c.beginPath(); c.arc(x, y, 9, 0, 7); c.fill(); }
});
const artTex = seed => tex(512, 640, (c, w, h) => {
  const R = rng(seed), pal = ['#c2643f', '#e3b27a', '#3d5a52', '#d9cdb8', '#8a9a7e', '#27323a'];
  c.fillStyle = '#efe7d8'; c.fillRect(0, 0, w, h);
  c.fillStyle = pal[(seed + 1) % 6]; c.beginPath(); c.arc(w * (0.3 + R() * 0.4), h * 0.32, w * 0.2, 0, 7); c.fill();
  for (let i = 0; i < 3; i++) { c.fillStyle = pal[(seed + i * 2) % 6]; const x = w * (0.12 + i * 0.26), ww = w * 0.24, top = h * (0.45 + R() * 0.2); c.beginPath(); c.moveTo(x, h * 0.95); c.lineTo(x, top + ww / 2); c.arc(x + ww / 2, top + ww / 2, ww / 2, Math.PI, 0); c.lineTo(x + ww, h * 0.95); c.closePath(); c.fill(); }
  c.strokeStyle = pal[5]; c.lineWidth = 3; c.beginPath(); c.moveTo(w * 0.1, h * 0.8); c.bezierCurveTo(w * 0.35, h * (0.6 + R() * 0.2), w * 0.6, h * 0.95, w * 0.92, h * 0.7); c.stroke();
});
const edgeAO = tex(256, 256, (c, w, h) => { for (const [x0, y0, x1, y1] of [[0, 0, w * 0.2, 0], [w, 0, w * 0.8, 0], [0, 0, 0, h * 0.2], [0, h, 0, h * 0.8]]) { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(0,0,0,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); } });
const blobTex = tex(128, 128, (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(0,0,0,.6)'); g.addColorStop(0.6, 'rgba(0,0,0,.26)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
edgeAO.wrapS = edgeAO.wrapT = blobTex.wrapS = blobTex.wrapT = THREE.ClampToEdgeWrapping;

window.Tour3D = function (opt) {
  const canvas = opt.canvas, coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(55, 1, 0.08, 1500);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.03).texture;

  // ---- materials ----
  const S = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
  const fine = grain(3, 150, 255), weave = grain(7, 90, 255, 16000); weave.repeat.set(6, 6); fine.repeat.set(3, 3);
  const oakMap = planks([186, 148, 104], 16, 21), deckMap = planks([150, 132, 112], 12, 33, 20, 1024);
  const M = {
    floor: S(0xffffff, { map: oakMap, roughness: 0.5 }), deck: S(0xffffff, { map: deckMap, roughness: 0.75 }),
    wall: S(0xf2ede4, { roughness: 0.92, bumpMap: fine, bumpScale: 0.25 }), sage: S(0x8e9b85, { roughness: 0.95 }), clay: S(0xc98f6c, { roughness: 0.95 }), ceil: S(0xf7f4ee, { roughness: 0.95, transparent: true }),
    oak: S(0xb98d5e, { roughness: 0.55 }), walnut: S(0x6a4a33, { roughness: 0.5 }), white: S(0xf4f1ea, { roughness: 0.4 }), black: S(0x1b1c1e, { roughness: 0.45, metalness: 0.6 }), brass: S(0xc9a25a, { roughness: 0.3, metalness: 0.9 }), steel: S(0xb6bbc0, { roughness: 0.32, metalness: 0.85 }),
    sand: S(0xd9cdb8, { roughness: 0.95, bumpMap: weave, bumpScale: 0.6 }), cream: S(0xefe7d9, { roughness: 0.95, bumpMap: weave, bumpScale: 0.6 }), terra: S(0xb86a45, { roughness: 0.95, bumpMap: weave, bumpScale: 0.6 }), deep: S(0x35504a, { roughness: 0.95, bumpMap: weave, bumpScale: 0.6 }), grey: S(0x9a9a94, { roughness: 0.95, bumpMap: weave, bumpScale: 0.6 }),
    linen: S(0xf6f2ea, { roughness: 0.9, bumpMap: weave, bumpScale: 0.35 }), marble: S(0xffffff, { map: marble(4), roughness: 0.22 }), tile: S(0xffffff, { map: tiles([222, 214, 202], 'rgba(150,140,128,.7)', 4), roughness: 0.35 }), stone: S(0xffffff, { map: tiles([196, 188, 176], 'rgba(120,112,100,.6)', 2, 512, 9), roughness: 0.55 }),
    leaf: S(0x3f6b45, { roughness: 0.7, side: THREE.DoubleSide }), leaf2: S(0x5a8052, { roughness: 0.7, side: THREE.DoubleSide }), pot: S(0xd8cdbd, { roughness: 0.7 }), potT: S(0xb5673f, { roughness: 0.8 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xcfe6ee, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.13, depthWrite: false }), sheer: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }),
    mirror: S(0xffffff, { roughness: 0.12, metalness: 0.25, map: tex(64, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#f4f7f8'); g.addColorStop(0.5, '#c9d6da'); g.addColorStop(1, '#93a6ad'); c.fillStyle = g; c.fillRect(0, 0, w, h); }) }), dark: S(0x24272b, { roughness: 0.35 }), rug: S(0xffffff, { map: rugTex(), roughness: 1 }), shade: new THREE.MeshStandardMaterial({ color: 0xf3e6cf, roughness: 0.9, emissive: 0xffc98a, emissiveIntensity: 0 }),
    concrete: S(0xcfc8bc, { roughness: 0.95 }), beach: S(0xe2cfa6, { roughness: 1 }), land: S(0x4f6a4c, { roughness: 1 }),
  };
  M.rug.map.wrapS = M.rug.map.wrapT = THREE.ClampToEdgeWrapping;
  const aoMat = new THREE.MeshBasicMaterial({ map: edgeAO, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const blobMat = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });

  // ---- building blocks ----
  const G = new THREE.Group(), top = new THREE.Group(); scene.add(G, top);          // "top": the ceilings, which fade when the camera rises
  const put = (geo, mat, x, y, z, p = G, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; p.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, p, cast) => put(new THREE.BoxGeometry(w, h, d), mat, x, y, z, p, cast);
  const rbox = (w, h, d, r, mat, x, y, z, p, cast) => put(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.002, h / 2 - 0.002, d / 2 - 0.002)), mat, x, y, z, p, cast);
  const cyl = (rt, rb, h, mat, x, y, z, p, seg = 28, cast) => put(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, p, cast);
  const ball = (r, mat, x, y, z, p) => put(new THREE.SphereGeometry(r, 20, 14), mat, x, y, z, p);
  /** a flat rectangle on the ground (or facing down), with the texture laid out in metres */
  function slab(x0, z0, x1, z1, y, mat, scale, down = false, p = G) {
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(down ? Math.PI / 2 : -Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
    const pos = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < pos.count; i++) uv.setXY(i, scale ? pos.getX(i) / scale : (pos.getX(i) - x0) / (x1 - x0), scale ? pos.getZ(i) / scale : (pos.getZ(i) - z0) / (z1 - z0));
    const m = new THREE.Mesh(g, mat); m.receiveShadow = !!scale; p.add(m); return m;
  }
  const blob = (x, z, w, d, y = 0.012) => { const m = slab(x - w / 2, z - d / 2, x + w / 2, z + d / 2, y, blobMat, 0); m.renderOrder = 2; return m; };
  /** a wall along x (dir 'x', at z = c) or along z (dir 'z', at x = c) from a to b, with gaps: [from, to, bottom, top] */
  function wall(dir, c, a, b, gaps = [], mat = M.wall, h = H) {
    const piece = (p0, p1, y0, y1) => { if (p1 - p0 < 0.005 || y1 - y0 < 0.005) return; dir === 'x' ? box(p1 - p0, y1 - y0, T, mat, (p0 + p1) / 2, (y0 + y1) / 2, c) : box(T, y1 - y0, p1 - p0, mat, c, (y0 + y1) / 2, (p0 + p1) / 2); };
    let at = a; for (const [g0, g1, lo = 0, hi = 2.1] of [...gaps].sort((u, v) => u[0] - v[0])) { piece(at, g0, 0, h); piece(g0, g1, 0, lo); piece(g0, g1, hi, h); at = g1; } piece(at, b, 0, h);
  }
  /** glazing along x at z: panes from a to b with slim dark frames; "open" is a stretch left without glass */
  function glazing(z, a, b, hi, open, n) {
    const w = (b - a) / n; for (let i = 0; i <= n; i++) box(0.045, hi, 0.06, M.black, a + i * w, hi / 2, z);
    box(b - a, 0.05, 0.06, M.black, (a + b) / 2, hi - 0.025, z); box(b - a, 0.03, 0.07, M.black, (a + b) / 2, 0.015, z);
    for (let i = 0; i < n; i++) { const x0 = a + i * w, x1 = x0 + w; if (open && x0 >= open[0] - 0.01 && x1 <= open[1] + 0.01) continue; box(w - 0.05, hi - 0.08, 0.012, M.glass, (x0 + x1) / 2, hi / 2, z, G, false); }
  }
  function curtain(x, z, w, h) { const g = new THREE.PlaneGeometry(w, h, 40, 1), p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin((p.getX(i) / w) * 34) * 0.035); g.computeVertexNormals(); put(g, M.sheer, x, h / 2 + 0.02, z, G, false); box(w + 0.1, 0.03, 0.03, M.black, x, h + 0.04, z); }
  const picture = (seed, w, h, x, y, z, ry) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; G.add(g); box(w + 0.05, h + 0.05, 0.03, M.oak, 0, 0, 0, g); put(new THREE.PlaneGeometry(w, h), S(0xffffff, { map: artTex(seed), roughness: 0.9 }), 0, 0, 0.017, g, false); };
  /** a pot plant with arching leaves */
  function palm(x, z, h, n = 13, seed = 1, potR = 0.19) {
    const R = rng(seed), g = new THREE.Group(); g.position.set(x, 0, z); G.add(g); cyl(potR, potR * 0.78, potR * 2, M.pot, 0, potR, 0, g); cyl(potR * 0.92, potR * 0.92, 0.02, M.walnut, 0, potR * 2 - 0.005, 0, g);
    for (let i = 0; i < n; i++) {
      const L = h * (0.55 + R() * 0.45), bend = 0.9 + R() * 1.1, W = 0.11 + R() * 0.06, rows = 9, pos = [], idx = [];
      for (let r = 0; r <= rows; r++) { const t = r / rows, a = t * bend, y = (L * Math.sin(a)) / bend, out = (L * (1 - Math.cos(a))) / bend, hw = W * Math.pow(Math.sin(Math.PI * Math.min(0.97, t * 0.9 + 0.08)), 0.7); pos.push(-hw, y, out, 0, y + 0.012, out, hw, y, out); }
      for (let r = 0; r < rows; r++) { const k = r * 3; idx.push(k, k + 1, k + 3, k + 1, k + 4, k + 3, k + 1, k + 2, k + 4, k + 2, k + 5, k + 4); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      const m = put(geo, R() < 0.5 ? M.leaf : M.leaf2, 0, potR * 2 - 0.02, 0, g); m.rotation.y = (i / n) * Math.PI * 2 + R() * 0.5; m.rotation.order = 'YXZ'; m.rotation.x = 0.1 + R() * 0.45;
    }
    blob(x, z, potR * 5, potR * 5);
  }
  const bush = (x, y, z, r, p = G) => { for (const [dx, dy, dz, s] of [[0, 0, 0, 1], [0.6, 0.25, 0.2, 0.7], [-0.5, 0.3, -0.3, 0.75], [0.1, 0.6, 0.3, 0.6]]) put(new THREE.IcosahedronGeometry(r * s, 1), M.leaf2, x + dx * r, y + dy * r, z + dz * r, p); };
  const lights = [];                                          // [light, base intensity, what scales it: 'lamp' | 'sun' | 'both']
  const lamp = (x, y, z, k, how = 'lamp', dist = 7, color = 0xffc98a) => { const l = new THREE.PointLight(color, 0, dist, 1.8); l.position.set(x, y, z); scene.add(l); lights.push([l, k, how]); return l; };
  function chair(x, z, ry, seat = M.sand) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g); rbox(0.46, 0.07, 0.46, 0.03, seat, 0, 0.46, 0, g); rbox(0.46, 0.42, 0.06, 0.03, seat, 0, 0.74, -0.21, g).rotation.x = -0.12; for (const [dx, dz] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) cyl(0.016, 0.013, 0.44, M.oak, dx, 0.22, dz, g, 8); blob(x, z, 0.75, 0.75); }
  function stool(x, z) { cyl(0.18, 0.18, 0.05, M.walnut, x, 0.68, z); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.8; cyl(0.013, 0.013, 0.68, M.black, x + Math.cos(a) * 0.14, 0.34, z + Math.sin(a) * 0.14, G, 6); } cyl(0.15, 0.15, 0.012, M.black, x, 0.24, z, G, 20); blob(x, z, 0.55, 0.55); }
  function pendant(x, z, y, r = 0.17) { cyl(0.004, 0.004, H - y - 0.1, M.black, x, (H + y) / 2 + 0.05, z, G, 6, false); const s = put(new THREE.SphereGeometry(r, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), M.shade, x, y, z, G, false); s.material.side = THREE.DoubleSide; }

  // ---- the shell: floors, walls, glazing, ceilings ----
  slab(0, 0, 10, 7, 0, M.floor, 4.48); slab(6.2 + T / 2, 4.2 + T / 2, 8.6 - T / 2, 7, 0.004, M.tile, 1.2); slab(0, -2.2, 10, 0, -0.02, M.deck, 2.8);
  for (const [x0, z0, x1, z1] of [[0, 0, 6.2, 7], [6.2, 0, 10, 4.2], [6.2, 4.2, 8.6, 7]]) { slab(x0 + T / 2, z0 + T / 2, x1 - T / 2, z1 - T / 2, 0.008, aoMat, 0).renderOrder = 1; slab(x0 + T / 2, z0 + T / 2, x1 - T / 2, z1 - T / 2, H - 0.006, aoMat, 0, true, top).renderOrder = 1; }
  box(10.4, 0.25, 9.6, M.concrete, 5, -0.18, 2.4);                                         // floor structure
  wall('x', 7, 0, 10, [[4.7, 5.6, 0, 2.08]]); wall('z', 0, 0, 7); wall('z', 10, 0, 7);        // south (with the front door), west, east
  wall('x', 0, 0, 10, [[0.3, 5.9, 0, 2.5], [6.5, 9.7, 0, 2.5]]);                               // north: all glass
  wall('z', 6.2, 0, 7, [[3.25, 4.1, 0, 2.08]]);                                               // living room | bedroom, bathroom
  wall('x', 4.2, 6.2, 10, [[6.7, 7.55, 0, 2.08]]); wall('z', 8.6, 4.2, 7);                    // bedroom | bathroom, store
  glazing(0, 0.3, 5.9, 2.5, [3.1, 4.5], 4); glazing(0, 6.5, 9.7, 2.5, [6.5, 7.57], 3);
  box(0.9, 2.08, 0.045, M.walnut, 5.15, 1.04, 6.97); ball(0.025, M.brass, 4.83, 1.0, 6.93);    // the front door
  box(0.04, 2.06, 0.82, M.oak, 6.2 + T / 2 + 0.05, 1.03, 2.82).rotation.y = 0.05;                                                              // bedroom door, open flat against the wall
  for (const [x0, x1, y0, y1] of [[6.26, 6.7, 0, H], [6.7, 7.55, 2.08, H], [7.55, 9.94, 0, H]]) box(x1 - x0, y1 - y0, 0.02, M.sage, (x0 + x1) / 2, (y0 + y1) / 2, 4.2 - T / 2 - 0.011);   // bedroom colour, round the bathroom door
  box(0.02, H, 4.0, M.sage, 10 - T / 2 - 0.011, H / 2, 2.1);                         // bedroom colour
  box(0.02, H, 2.6, M.clay, T / 2 + 0.011, H / 2, 2.2);                                                                                           // dining wall colour
  for (const [x, z, w, d] of [[5, 3.5, 10.2, 7.2]]) box(w, 0.2, d, M.ceil, x, H + 0.1, z, top);                                                      // ceiling, and the balcony above
  box(10.2, 0.2, 2.3, M.ceil, 5, H + 0.1, -1.1, top);
  curtain(0.75, 0.11, 0.8, 2.45); curtain(5.5, 0.11, 0.75, 2.45); curtain(9.3, 0.11, 0.75, 2.45);
  // balcony: side fins, glass balustrade, loungers
  box(T, H, 2.2, M.wall, 0.06, H / 2, -1.1); box(T, H, 2.2, M.wall, 9.94, H / 2, -1.1);
  box(9.76, 1.0, 0.014, M.glass, 5, 0.52, -2.17, G, false); box(9.8, 0.04, 0.06, M.black, 5, 1.05, -2.17); for (let i = 0; i <= 8; i++) box(0.03, 1.05, 0.03, M.black, 0.12 + i * 1.22, 0.525, -2.17);
  for (const x of [8.0, 9.15]) { const g = new THREE.Group(); g.position.set(x, 0, -1.15); g.rotation.y = 0.12 * (x < 8.5 ? 1 : -1); G.add(g); rbox(0.66, 0.1, 1.5, 0.04, M.cream, 0, 0.34, 0, g); const b = rbox(0.66, 0.1, 0.7, 0.04, M.cream, 0, 0.6, 0.86, g); b.rotation.x = -0.9; box(0.7, 0.05, 1.56, M.oak, 0, 0.26, 0, g); for (const [dx, dz] of [[-0.3, -0.7], [0.3, -0.7], [-0.3, 0.7], [0.3, 0.7]]) box(0.04, 0.26, 0.04, M.oak, dx, 0.13, dz, g); rbox(0.4, 0.1, 0.3, 0.05, M.terra, 0, 0.52, 0.45, g); }
  cyl(0.24, 0.24, 0.03, M.oak, 8.58, 0.42, -1.5); cyl(0.02, 0.14, 0.42, M.black, 8.58, 0.21, -1.5); cyl(0.04, 0.035, 0.12, M.glass, 8.5, 0.5, -1.45, G, 12, false); palm(0.55, -1.6, 1.25, 12, 5, 0.22); palm(9.45, -0.45, 0.8, 9, 8, 0.16);
  cyl(0.3, 0.3, 0.03, M.oak, 2.0, 0.7, -1.2); cyl(0.025, 0.2, 0.7, M.black, 2.0, 0.35, -1.2); chair(1.35, -1.2, Math.PI / 2 + 0.3, M.deep); chair(2.65, -1.25, -Math.PI / 2 - 0.3, M.deep);

  // ---- kitchen (south-west) ----
  for (let i = 0; i < 6; i++) { const x = 1.15 + i * 0.6; rbox(0.585, 0.82, 0.58, 0.01, i === 3 ? M.dark : M.white, x, 0.47, 6.63); if (i !== 3) box(0.16, 0.012, 0.012, M.brass, x, 0.78, 6.335); }
  box(3.62, 0.04, 0.64, M.marble, 2.65, 0.9, 6.61); box(3.6, 0.07, 0.56, M.dark, 2.65, 0.035, 6.65);
  rbox(0.75, 2.05, 0.66, 0.02, M.steel, 0.47, 1.03, 6.6); box(0.02, 0.9, 0.03, M.black, 0.5, 1.2, 6.25);                                          // fridge
  for (let i = 0; i < 6; i++) rbox(0.585, 0.62, 0.34, 0.01, M.oak, 1.15 + i * 0.6, 1.95, 6.76); box(3.6, 0.72, 0.02, M.tile, 2.65, 1.28, 6.925);    // wall cabinets, splashback
  box(0.58, 0.012, 0.5, M.dark, 2.95, 0.925, 6.6); box(0.5, 0.01, 0.38, M.steel, 1.75, 0.921, 6.6); cyl(0.012, 0.012, 0.28, M.brass, 1.75, 1.06, 6.83, G, 10); { const t = cyl(0.01, 0.01, 0.16, M.brass, 1.75, 1.2, 6.76, G, 10); t.rotation.x = Math.PI / 2; }
  cyl(0.06, 0.05, 0.2, M.potT, 3.9, 1.02, 6.7); bush(3.9, 1.2, 6.7, 0.1); cyl(0.09, 0.09, 0.02, M.oak, 1.25, 0.93, 6.6); for (const dx of [-0.03, 0.04]) ball(0.035, S(0xd9892e), 1.25 + dx, 0.975, 6.6 + dx);
  rbox(2.3, 0.86, 0.8, 0.012, M.walnut, 2.45, 0.45, 4.95); box(2.5, 0.045, 0.98, M.marble, 2.45, 0.905, 4.9); blob(2.45, 4.95, 3.0, 1.5);                 // island
  stool(1.75, 4.3); stool(2.45, 4.3); stool(3.15, 4.3); pendant(1.95, 4.9, 1.85); pendant(2.95, 4.9, 1.85); lamp(1.95, 1.72, 4.9, 3.5); lamp(2.95, 1.72, 4.9, 3.5);
  cyl(0.11, 0.07, 0.07, M.pot, 2.9, 0.965, 4.95); for (const [dx, dz, c] of [[0, 0, 0xd9892e], [0.05, 0.03, 0xc8502e], [-0.04, 0.04, 0xe0b040]]) ball(0.036, S(c), 2.9 + dx, 1.01, 4.95 + dz);
  cyl(0.045, 0.06, 0.24, S(0x3d5a52, { roughness: 0.3 }), 1.8, 1.05, 5.0); bush(1.8, 1.26, 5.0, 0.11);
  // ---- dining (west wall) ----
  cyl(0.62, 0.62, 0.04, M.oak, 1.35, 0.74, 2.2, G, 48); cyl(0.05, 0.05, 0.7, M.oak, 1.35, 0.37, 2.2); cyl(0.3, 0.34, 0.03, M.oak, 1.35, 0.015, 2.2); blob(1.35, 2.2, 1.9, 1.9);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; chair(1.35 + Math.cos(a) * 0.78, 2.2 + Math.sin(a) * 0.78, -a - Math.PI / 2, i % 2 ? M.sand : M.deep); }
  pendant(1.35, 2.2, 1.7, 0.26); lamp(1.35, 1.55, 2.2, 4.5); cyl(0.07, 0.05, 0.2, M.potT, 1.35, 0.86, 2.2); bush(1.35, 1.03, 2.2, 0.1);
  picture(2, 0.7, 0.9, T / 2 + 0.04, 1.55, 1.7, Math.PI / 2); picture(5, 0.7, 0.9, T / 2 + 0.04, 1.55, 2.7, Math.PI / 2);
  // ---- living room (north-east of the open plan) ----
  slab(2.7, 0.5, 5.45, 3.15, 0.011, M.rug, 0);
  rbox(0.95, 0.3, 2.5, 0.06, M.sand, 5.55, 0.25, 1.8); rbox(0.3, 0.52, 2.5, 0.08, M.sand, 5.93, 0.6, 1.8); for (const z of [0.62, 2.98]) rbox(0.95, 0.42, 0.22, 0.07, M.sand, 5.55, 0.5, z);    // sofa: base, back, arms
  for (const z of [1.02, 1.8, 2.58]) { rbox(0.74, 0.16, 0.74, 0.06, M.cream, 5.46, 0.47, z); const b = rbox(0.2, 0.44, 0.7, 0.08, M.cream, 5.78, 0.72, z); b.rotation.z = -0.16; }
  for (const [z, m, r] of [[0.95, M.terra, 0.3], [1.35, M.deep, -0.2], [2.7, M.terra, -0.3]]) { const p = rbox(0.14, 0.38, 0.4, 0.07, m, 5.62, 0.74, z); p.rotation.set(r * 0.4, r, -0.3); }
  blob(5.6, 1.8, 1.7, 3.1);
  cyl(0.5, 0.5, 0.035, M.walnut, 4.25, 0.36, 1.8, G, 48); for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.4; const l = cyl(0.015, 0.015, 0.36, M.black, 4.25 + Math.cos(a) * 0.33, 0.18, 1.8 + Math.sin(a) * 0.33, G, 8); l.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12); } blob(4.25, 1.8, 1.4, 1.4);
  box(0.3, 0.03, 0.22, M.deep, 4.15, 0.395, 1.9); box(0.26, 0.025, 0.2, M.terra, 4.16, 0.42, 1.9); cyl(0.05, 0.07, 0.2, M.pot, 4.45, 0.48, 1.65); bush(4.45, 0.66, 1.65, 0.09);
  { const g = new THREE.Group(); g.position.set(3.15, 0, 1.0); g.rotation.y = 0.75; G.add(g); rbox(0.72, 0.16, 0.7, 0.07, M.terra, 0, 0.4, 0, g); const b = rbox(0.72, 0.5, 0.16, 0.08, M.terra, 0, 0.68, -0.3, g); b.rotation.x = -0.2; for (const dx of [-0.36, 0.36]) rbox(0.07, 0.24, 0.66, 0.03, M.oak, dx, 0.5, 0, g); for (const [dx, dz] of [[-0.3, -0.27], [0.3, -0.27], [-0.3, 0.27], [0.3, 0.27]]) cyl(0.018, 0.014, 0.33, M.oak, dx, 0.165, dz, g, 8); blob(3.15, 1.0, 1.1, 1.1); }
  cyl(0.012, 0.012, 1.5, M.brass, 5.8, 0.76, 0.42, G, 8); cyl(0.14, 0.14, 0.02, M.brass, 5.8, 0.01, 0.42); cyl(0.13, 0.19, 0.26, M.shade, 5.8, 1.6, 0.42, G, 28, false); lamp(5.8, 1.5, 0.42, 4.5);
  palm(0.62, 0.62, 1.7, 15, 3, 0.24); picture(8, 0.95, 1.2, 6.2 - T / 2 - 0.04, 1.6, 1.8, -Math.PI / 2);
  rbox(1.5, 0.5, 0.4, 0.01, M.walnut, 5.9, 0.33, 5.6).rotation.y = Math.PI / 2; cyl(0.3, 0.3, 0.02, M.mirror, 6.2 - T / 2 - 0.025, 1.55, 5.6, G, 40).rotation.z = Math.PI / 2; cyl(0.32, 0.32, 0.015, M.brass, 6.2 - T / 2 - 0.015, 1.55, 5.6, G, 40).rotation.z = Math.PI / 2;
  cyl(0.06, 0.08, 0.28, M.pot, 5.9, 0.72, 5.2); bush(5.9, 0.97, 5.2, 0.13); box(0.22, 0.05, 0.3, M.sage, 5.9, 0.605, 5.9); lamp(3.6, 2.0, 3.6, 5, 'lamp', 9); lamp(3.6, 1.4, 1.6, 2.2, 'sun', 9, 0xffe2bd); lamp(2.6, 2.2, 5.4, 1.6, 'sun', 8, 0xfff0dc);

  // ---- bedroom ----
  slab(7.2, 0.7, 9.7, 3.3, 0.011, S(0xd8cbb6, { roughness: 1, bumpMap: weave, bumpScale: 0.8 }), 0);
  rbox(2.1, 0.22, 1.9, 0.03, M.walnut, 8.85, 0.2, 2.0); rbox(2.0, 0.24, 1.8, 0.08, M.linen, 8.85, 0.42, 2.0); rbox(1.45, 0.1, 1.86, 0.05, M.linen, 8.55, 0.56, 2.0);            // frame, mattress, duvet
  rbox(0.1, 1.05, 2.1, 0.04, M.deep, 9.86, 0.7, 2.0); for (const z of [1.55, 2.45]) { rbox(0.42, 0.16, 0.66, 0.08, M.linen, 9.55, 0.64, z).rotation.z = 0.35; rbox(0.34, 0.14, 0.5, 0.07, M.terra, 9.38, 0.62, z).rotation.z = 0.3; }
  rbox(0.5, 0.06, 1.9, 0.03, M.terra, 8.05, 0.6, 2.0); blob(8.85, 2.0, 2.9, 2.6);
  for (const z of [0.72, 3.28]) { rbox(0.42, 0.44, 0.42, 0.02, M.oak, 9.68, 0.24, z); cyl(0.05, 0.07, 0.2, M.pot, 9.7, 0.56, z); cyl(0.1, 0.14, 0.18, M.shade, 9.7, 0.78, z, G, 24, false); lamp(9.62, 0.85, z, 2.6, 'lamp', 5); }
  picture(11, 1.3, 0.8, 10 - T / 2 - 0.05, 1.75, 2.0, -Math.PI / 2);
  for (let i = 0; i < 3; i++) { rbox(0.42, 2.3, 0.04, 0.01, M.oak, 8.9 + i * 0.44, 1.17, 4.2 - T / 2 - 0.035); box(0.012, 0.3, 0.02, M.brass, 9.07 + i * 0.44 - (i === 2 ? 0.34 : 0), 1.1, 4.2 - T / 2 - 0.06); }
  rbox(1.1, 0.42, 0.42, 0.04, M.cream, 7.0, 0.23, 2.5).rotation.y = Math.PI / 2; palm(9.55, 0.5, 1.1, 10, 12, 0.17); lamp(8.0, 2.0, 2.1, 4, 'lamp', 8); lamp(8.0, 1.4, 1.3, 1.8, 'sun', 8, 0xffe2bd);
  // ---- bathroom ----
  rbox(0.5, 0.2, 1.3, 0.01, M.walnut, 6.2 + T / 2 + 0.26, 0.74, 5.65); box(0.54, 0.03, 1.34, M.marble, 6.2 + T / 2 + 0.27, 0.855, 5.65); rbox(0.36, 0.11, 0.5, 0.04, M.white, 6.2 + T / 2 + 0.27, 0.92, 5.65);
  cyl(0.011, 0.011, 0.2, M.brass, 6.2 + T / 2 + 0.07, 0.99, 5.65, G, 10); cyl(0.4, 0.4, 0.014, M.mirror, 6.2 + T / 2 + 0.02, 1.6, 5.65, G, 44).rotation.z = Math.PI / 2; cyl(0.43, 0.43, 0.008, M.shade, 6.2 + T / 2 + 0.01, 1.6, 5.65, G, 44, false).rotation.z = Math.PI / 2;
  box(0.012, 2.05, 0.95, M.glass, 7.55, 1.03, 6.5, G, false); box(0.03, 2.05, 0.03, M.brass, 7.55, 1.03, 6.02); slab(7.56, 6.0, 8.6 - T / 2, 7 - T / 2, 0.006, M.stone, 0.9); cyl(0.09, 0.09, 0.012, M.brass, 8.1, 2.15, 6.55); cyl(0.008, 0.008, 0.3, M.brass, 8.1, 2.3, 6.55, G, 8);
  rbox(0.38, 0.4, 0.56, 0.08, M.white, 8.28, 0.21, 4.75); rbox(0.4, 0.04, 0.46, 0.02, M.white, 8.28, 0.43, 4.72); rbox(0.36, 0.42, 0.16, 0.04, M.white, 8.28, 0.6, 4.36);
  box(0.02, 0.02, 0.5, M.brass, 8.6 - T / 2 - 0.05, 1.2, 5.5); box(0.04, 0.55, 0.42, M.cream, 8.6 - T / 2 - 0.05, 0.93, 5.5); cyl(0.07, 0.06, 0.16, M.potT, 6.2 + T / 2 + 0.27, 0.95, 6.15); bush(6.2 + T / 2 + 0.27, 1.1, 6.15, 0.09);
  slab(6.95, 4.75, 7.45, 5.75, 0.012, S(0xc9b99f, { roughness: 1, bumpMap: weave, bumpScale: 0.8 }), 0); rbox(0.3, 0.1, 0.2, 0.03, M.cream, 6.2 + T / 2 + 0.3, 0.92, 5.1); cyl(0.03, 0.03, 0.14, M.dark, 6.2 + T / 2 + 0.16, 0.94, 6.0, G, 12);
  lamp(7.4, 2.4, 5.5, 5, 'both', 7, 0xffe6c8);

  // ---- the world outside: tower, beach, sea, far hills, sky ----
  box(10.6, 30, 7.7, M.concrete, 5, -15.3, 3.6); for (let i = 1; i <= 3; i++) box(10.2, 0.2, 2.3, M.concrete, 5, -0.12 - i * 3, -1.1);
  slab(-400, -40, 400, -12, -30.2, M.beach, 0).receiveShadow = false; slab(-400, -12, 400, 300, -30.1, M.land, 0).receiveShadow = false;
  const seaBump = grain(17, 60, 255, 5000, 256); seaBump.repeat.set(70, 70);
  const sea = slab(-700, -900, 700, -36, -30.4, new THREE.MeshStandardMaterial({ color: 0x1d6f82, roughness: 0.22, metalness: 0.15, bumpMap: seaBump, bumpScale: 2.2 }), 0); sea.receiveShadow = false;
  { const g = new THREE.PlaneGeometry(1400, 6, 60, 1); g.rotateX(-Math.PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + Math.sin(p.getX(i) * 0.05) * 1.6); const foam = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })); foam.position.set(0, -30.3, -38); scene.add(foam); }
  for (const [x, z, w, h] of [[-420, -700, 380, 46], [-250, -760, 260, 30], [520, -820, 420, 38]]) { const m = put(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), S(0x41595c, { roughness: 1 }), x, -31, z, scene, false); m.scale.set(w, h, w * 0.5); m.receiveShadow = false; }
  const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, glow: { value: 1 } };
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 20), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: skyU,
    vertexShader: 'varying vec3 d; void main(){ d = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 top, hor, sunDir, sunCol; uniform float glow; varying vec3 d; void main(){ vec3 n = normalize(d); float h = max(n.y, 0.0); vec3 c = mix(hor, top, pow(h, 0.45)); float s = max(dot(n, sunDir), 0.0); c += sunCol * (pow(s, 1400.0) * 9.0 + pow(s, 90.0) * 0.35 * glow + pow(s, 8.0) * 0.12 * glow); if (n.y < 0.0) c = mix(c, hor * 0.7, min(1.0, -n.y * 6.0)); gl_FragColor = vec4(c, 1.0); }' })));

  // ---- light and the time of day ----
  const sun = new THREE.DirectionalLight(0xffffff, 1); sun.castShadow = true; sun.shadow.mapSize.set(coarse ? 2048 : 4096, coarse ? 2048 : 4096); Object.assign(sun.shadow.camera, { left: -8.5, right: 8.5, top: 8.5, bottom: -8.5, near: 5, far: 70 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.025; sun.shadow.radius = 5; sun.target.position.set(5, 0, 2.5); scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1); scene.add(hemi);
  const C = hex => new THREE.Color(hex);
  // each: sun height and bearing (degrees), sun colour and strength, sky, room fill, lamps, exposure, sea
  const TIMES = [
    { t: 0.0, el: 30, az: -24, sun: C(0xfff3e2), sunK: 3.4, top: C(0x2f78d0), hor: C(0xbfdcf0), sunC: C(0xfff6e6), glow: 0.45, hemS: C(0xdfeaff), hemG: C(0xb9a183), hemK: 0.5, env: 0.3, lampK: 0, fillK: 1, exp: 0.86, sea: C(0x1f7f96) },
    { t: 0.55, el: 8, az: -40, sun: C(0xffb066), sunK: 3.6, top: C(0x3c5fa6), hor: C(0xf5b47c), sunC: C(0xff9a4e), glow: 0.9, hemS: C(0xe6b896), hemG: C(0xa9805a), hemK: 0.36, env: 0.22, lampK: 0.3, fillK: 1.1, exp: 0.9, sea: C(0x2f6a84) },
    { t: 1.0, el: 26, az: 30, sun: C(0x9db8ff), sunK: 0.35, top: C(0x070d1f), hor: C(0x1c2a4a), sunC: C(0xc4d6ff), glow: 0.35, hemS: C(0x40507a), hemG: C(0x2a241e), hemK: 0.12, env: 0.05, lampK: 1, fillK: 0, exp: 1.0, sea: C(0x0b2030) },
  ];
  let tod = 0.42, todGoal = 0.42, lampK = 0;
  function applyTime(t) {
    let i = 0; while (i < TIMES.length - 2 && t > TIMES[i + 1].t) i++; const a = TIMES[i], b = TIMES[i + 1], u = smooth(clamp01((t - a.t) / (b.t - a.t))), L = k => lerp(a[k], b[k], u), CL = k => a[k].clone().lerp(b[k], u);
    const el = (L('el') * Math.PI) / 180, az = (L('az') * Math.PI) / 180, dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    sun.position.copy(sun.target.position).addScaledVector(dir, 38); sun.color.copy(CL('sun')); sun.intensity = L('sunK');
    skyU.top.value.copy(CL('top')); skyU.hor.value.copy(CL('hor')); skyU.sunDir.value.copy(dir); skyU.sunCol.value.copy(CL('sunC')); skyU.glow.value = L('glow');
    hemi.color.copy(CL('hemS')); hemi.groundColor.copy(CL('hemG')); hemi.intensity = L('hemK'); scene.environmentIntensity = L('env'); renderer.toneMappingExposure = L('exp'); sea.material.color.copy(CL('sea'));
    lampK = L('lampK'); const fillK = L('fillK'); M.shade.emissiveIntensity = 0.05 + 1.5 * lampK;
    for (const [l, k, how] of lights) l.intensity = k * (how === 'lamp' ? lampK : how === 'sun' ? fillK : 0.55 + 0.45 * lampK);
    renderer.shadowMap.needsUpdate = true;
  }

  // ---- the camera's path: [frame, eye, target, field of view] ----
  const KEYS = [
    [0, [5.25, 1.5, 6.3], [2.7, 1.15, 0.0], 58], [30, [4.55, 1.52, 4.7], [2.0, 0.95, 5.75], 58], [60, [3.85, 1.5, 3.7], [4.9, 0.85, 0.7], 58], [82, [3.8, 1.5, 1.5], [3.7, 1.25, -6], 56],
    [102, [3.8, 1.5, -1.15], [2.6, 0.7, -30], 56], [124, [5.2, 1.5, -1.3], [9.2, 1.0, -1.35], 56], [142, [7.0, 1.5, 0.1], [8.9, 0.9, 2.2], 58], [162, [7.2, 1.5, 1.75], [9.3, 0.85, 2.2], 58],
    [180, [7.12, 1.5, 3.2], [7.1, 1.1, 6.4], 62], [198, [7.5, 1.55, 4.5], [6.85, 1.0, 6.2], 72], [216, [7.0, 5.2, 6.8], [6.0, 0.4, 3.4], 52], [240, [5.0, 13.2, 11.6], [5.0, 0, 2.7], 40],
  ];
  const KP = KEYS.map(k => [...k[1], ...k[2], k[3]]), KT = KEYS.map(k => k[0]);
  const KM = KP.map((p, i) => p.map((_, c) => { if (i === 0 || i === KP.length - 1) return 0; const h0 = KT[i] - KT[i - 1], h1 = KT[i + 1] - KT[i]; return (((p[c] - KP[i - 1][c]) / h0) * h1 + ((KP[i + 1][c] - p[c]) / h1) * h0) / (h0 + h1); }));
  const raw = f => { f = Math.min(240, Math.max(0, f)); let i = 0; while (i < KT.length - 2 && f > KT[i + 1]) i++; const h = KT[i + 1] - KT[i], x = (f - KT[i]) / h, x2 = x * x, x3 = x2 * x, a = 2 * x3 - 3 * x2 + 1, b = (x3 - 2 * x2 + x) * h, c = -2 * x3 + 3 * x2, d = (x3 - x2) * h; return KP[i].map((_, k) => a * KP[i][k] + b * KM[i][k] + c * KP[i + 1][k] + d * KM[i + 1][k]); };
  // smoothed once, into a table: the camera never changes speed or direction abruptly
  const TABLE = []; for (let s = 0; s <= 960; s++) { const f = s / 4, acc = [0, 0, 0, 0, 0, 0, 0]; let ws = 0; for (let k = -8; k <= 8; k++) { const w = Math.exp(-(k * k) / 22), r = raw(f + k * 0.7); for (let c = 0; c < 7; c++) acc[c] += w * r[c]; ws += w; } TABLE.push(acc.map(v => v / ws)); }
  const at = f => { const s = Math.min(959.999, Math.max(0, f * 4)), i = Math.floor(s), u = s - i; return TABLE[i].map((v, c) => v + (TABLE[i + 1][c] - v) * u); };

  // ---- drawing ----
  // the picture is drawn into a multisampled buffer, so edges (window frames, railings) come out smooth
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { samples: 4, type: THREE.HalfFloatType })), bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.14, 0.6, 1.0);
  composer.addPass(new RenderPass(scene, camera)); composer.addPass(bloom); composer.addPass(new OutputPass());
  let W = 1, Hh = 1, ratio = 1, cur = 0, slow = 0, lastT = 0, dead = false, shown = true, first = true;
  function size() { const r = canvas.getBoundingClientRect(); W = Math.max(1, r.width); Hh = Math.max(1, r.height); ratio = Math.min(window.devicePixelRatio || 1, coarse ? 1.6 : 2) * (slow > 1 ? 0.7 : 1); renderer.setPixelRatio(ratio); renderer.setSize(W, Hh, false); composer.setPixelRatio(ratio); composer.setSize(W, Hh); camera.aspect = W / Hh; }
  const fixed = opt.fixed != null ? opt.fixed : null;
  const progress = () => { const r = opt.section.getBoundingClientRect(), span = r.height - innerHeight; return span > 0 ? clamp01(-r.top / span) : 0; };
  function pose() {
    const k = at(cur), portrait = W < Hh * 0.95;
    const back = portrait ? 1 + 0.22 * smooth(clamp01((k[1] - 3) / 8)) : 1;          // an upright screen stands further back for the view from above
    camera.position.set(k[3] + (k[0] - k[3]) * back, k[4] + (k[1] - k[4]) * back, k[5] + (k[2] - k[5]) * back); camera.lookAt(k[3], k[4], k[5]);
    camera.fov = portrait ? Math.min(84, (2 * Math.atan(Math.tan(((k[6] * 0.93) * Math.PI) / 360) / camera.aspect) * 180) / Math.PI) : k[6]; camera.updateProjectionMatrix();
    const lift = 1 - smooth(clamp01((k[1] - 2.35) / 0.9)); M.ceil.opacity = lift; top.visible = lift > 0.01;       // the ceilings melt away as the camera goes up through them
    return portrait;
  }
  function tick(now) {
    if (dead) return; requestAnimationFrame(tick); if (!shown && !first) return;
    const dt = Math.min(0.1, (now - lastT) / 1000 || 0.016); lastT = now;
    if (Math.abs(todGoal - tod) > 0.0005) { tod += (todGoal - tod) * Math.min(1, dt * 3.5); applyTime(tod); }
    const p = fixed != null ? fixed / 240 : progress(), goal = p * 240; cur = fixed != null || first ? goal : Math.abs(goal - cur) < 0.01 ? goal : cur + (goal - cur) * Math.min(1, dt * 6.5);
    const portrait = pose();
    seaBump.offset.set(now * 0.000004, now * 0.000007);
    composer.render();
    if (opt.once && (tick.shots = (tick.shots || 0) + 1) >= 3) { dead = true; opt.onLoad && opt.onLoad(1); return; }   // a still: draw it and stop
    if (first) { first = false; opt.onLoad && opt.onLoad(1); }
    else if (slow < 2 && fixed == null) { tick.n = (tick.n || 0) + 1; tick.sum = (tick.sum || 0) + dt; if (tick.n === 50) { if (tick.sum / 50 > 0.045) { slow++; if (slow === 1) bloom.enabled = false; size(); } tick.n = tick.sum = 0; } }   // a slow phone gets a lighter picture
    opt.onUpdate && opt.onUpdate({ frame: cur, progress: p, portrait, width: W, height: Hh, anchors: {}, place: (x, y) => [x * W, y * Hh] });
  }
  if (window.IntersectionObserver) new IntersectionObserver(e => { shown = e[0].isIntersecting; }).observe(canvas);
  let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(size, 120); });
  if (opt.time != null) tod = todGoal = opt.time;
  size(); applyTime(tod); requestAnimationFrame(tick);
  return { setTime(t) { todGoal = clamp01(t); }, destroy() { dead = true; },
    /** draw one chosen frame at a chosen time of day, at once (for making stills and videos) */
    render(f, t) { dead = true; if (t != null) { tod = todGoal = t; applyTime(t); } cur = f; pose(); seaBump.offset.set(f * 0.0004, f * 0.0007); composer.render(); } };
};
