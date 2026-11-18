// The car-dealer film: a small lot at dusk. The camera comes down from above the forecourt, visits three featured cars
// on their turntables and lifts away again. Built from simple shapes; the cars are generic and unbranded.
import { makeCar } from './cars.js';
import { STOCK } from './stock.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
export function build({ THREE, renderer, portrait, aspect }) {
  const FRAMES = 240, BG = 0x0d0b14;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(BG);
  const camera = new THREE.PerspectiveCamera(portrait ? 52 : 34, aspect, 0.5, 400);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.3;   // soft reflections for the paint
  scene.add(new THREE.HemisphereLight(0x8f8fd8, 0x15101a, 0.7));
  const moon = new THREE.DirectionalLight(0xbac4ff, 1.3); moon.position.set(-18, 26, 14); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); Object.assign(moon.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 100 }); moon.shadow.bias = -0.0005; moon.shadow.normalBias = 0.04; scene.add(moon);
  const dusk = new THREE.DirectionalLight(0xff8f5c, 0.9); dusk.position.set(22, 5, -14); scene.add(dusk);
  const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
  const add = (p, geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; p.add(m); return m; };
  const box = (mat, w, h, d, x, y, z, p = scene) => add(p, new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  const cyl = (mat, r, h, x, y, z, seg = 16, p = scene) => add(p, new THREE.CylinderGeometry(r, r, h, seg), mat, x, y, z);
  const glowM = (color, k) => new THREE.MeshStandardMaterial({ color: 0x111111, emissive: color, emissiveIntensity: k });
  const asphalt = M(0x17181e, { roughness: 0.5 }), baseM = M(0x100f16), lineM = M(0xcfd3d8, { roughness: 0.6 }), wallM = M(0x23252d, { roughness: 0.7 }), trimM = M(0x0f1014, { roughness: 0.5 }), kerbM = M(0x3a3c44);
  const glassGlow = glowM(0xffdcae, 0.62), signGlow = glowM(0xf4f6ff, 0.75), lampGlow = glowM(0xffe2b4, 2.6), ringGlow = glowM(0xfff4e2, 0.9), leafM = M(0x2c3f3a, { flatShading: true }), barkM = M(0x2a2320);
  // the lot
  box(baseM, 48, 1.4, 34, 0, -0.7, 1); box(asphalt, 47.4, 0.06, 33.4, 0, 0, 1); box(kerbM, 47.4, 0.14, 0.5, 0, 0.07, 14.2); box(M(0x101116, { roughness: 0.6 }), 47.4, 0.07, 3.2, 0, 0.0, 16.1);
  for (let i = 0; i < 10; i++) box(lineM, 1.6, 0.07, 0.14, -20.5 + i * 4.6, 0.01, 16.1);
  for (let i = -5; i <= 5; i++) box(lineM, 0.1, 0.07, 5.2, i * 3 - 1.5, 0.01, 2);
  for (const sx of [-1, 1]) for (let i = 0; i <= 3; i++) box(lineM, 0.1, 0.07, 5.2, sx * (6 + i * 3), 0.01, -3.4);
  // the showroom: a lit glass front, a blank lightbox where the dealer's sign goes, a service bay beside it
  box(wallM, 18, 4.6, 6.6, 0, 2.3, -10.2); box(trimM, 19, 0.35, 7.6, 0, 4.78, -9.9); box(signGlow, 6.4, 0.9, 0.12, 0, 5.5, -6.5); box(trimM, 6.8, 1.2, 0.3, 0, 5.5, -6.7);
  for (let i = 0; i < 5; i++) box(glassGlow, 3.2, 3.5, 0.12, -6.8 + i * 3.4, 1.95, -6.86); for (let i = 0; i <= 5; i++) box(trimM, 0.16, 3.9, 0.22, -8.5 + i * 3.4, 1.95, -6.84);
  box(glowM(0xfff3dd, 0.9), 17.6, 0.06, 0.5, 0, 4.56, -6.3);
  box(wallM, 7, 3.8, 6, 12.5, 1.9, -10.5); box(trimM, 7.4, 0.25, 6.4, 12.5, 3.9, -10.5); for (const x of [10.9, 14.1]) { box(M(0x3a3d46), 2.6, 2.9, 0.14, x, 1.45, -7.44); for (let k = 0; k < 4; k++) box(trimM, 2.6, 0.03, 0.18, x, 0.6 + k * 0.6, -7.42); }
  const inside = []; for (const x of [-5, 0, 5]) { const l = new THREE.PointLight(0xffe0b0, 9, 16, 1.7); l.position.set(x, 3.2, -5.2); scene.add(l); inside.push(l); }
  // lamp posts
  const posts = [[-18, 10.5], [18, 10.5], [-18, -2], [18, -2], [-6, 12.6], [6, 12.6]], lamps = [];
  for (const [x, z] of posts) { cyl(trimM, 0.1, 7, x, 3.5, z, 8); const dir = Math.sign(-x) || 1; box(trimM, 1.4, 0.1, 0.12, x + dir * 0.6, 6.95, z); box(lampGlow, 0.7, 0.08, 0.34, x + dir * 1.1, 6.88, z); const l = new THREE.PointLight(0xffd6a0, 34, 34, 1.5); l.position.set(x + dir * 1.1, 6.6, z); scene.add(l); lamps.push(l); }
  // hedges and trees behind
  for (let i = 0; i < 11; i++) box(leafM, 3.6, 1.1, 1.0, -20 + i * 4, 0.55, -15.0);
  for (const [x, z, s] of [[-21, -12, 1.2], [-21.5, -6, 0.9], [21.5, -12.5, 1.1], [21, -6.5, 0.85]]) { cyl(barkM, 0.16 * s, 1.6 * s, x, 0.8 * s, z, 8); add(scene, new THREE.IcosahedronGeometry(1.5 * s, 1), leafM, x, 2.6 * s, z); }
  // rows of stock
  const tones = [0x8e99a6, 0x23272e, 0x7a1f24, 0x244a7a, 0xd9dde2, 0x3c4a3f, 0xb8b2a2, 0x111317, 0x5a6470], kinds = ['sedan', 'suv', 'hatch', 'sedan', 'pickup', 'suv', 'hatch', 'sedan', 'suv'];
  const park = (type, color, x, z, turn, lights = 0.12) => { const c = makeCar(THREE, type, color, { lights }); c.position.set(x, 0, z); c.rotation.y = turn; scene.add(c); return c; };
  for (let i = 0; i < 9; i++) park(kinds[i], tones[(i * 5 + 2) % 9], -12 + i * 3, 2, -Math.PI / 2);
  [-13.5, -10.5, -7.5, 7.5, 10.5, 13.5].forEach((x, i) => park(kinds[(i + 3) % 9], tones[(i * 2 + 1) % 9], x, -3.4, -Math.PI / 2));
  // the three featured cars, each on a turntable
  const spots = [[-7.5, 8.6, -Math.PI / 2 + 0.55], [0, 8.9, -Math.PI / 2], [7.5, 8.6, -Math.PI / 2 - 0.5]];
  const featured = spots.map(([x, z, turn], i) => {
    cyl(M(0x0e0e13, { roughness: 0.4, metalness: 0.3 }), 3.3, 0.14, x, 0.07, z, 56); const ring = add(scene, new THREE.TorusGeometry(3.3, 0.035, 8, 96), ringGlow, x, 0.15, z); ring.rotation.x = Math.PI / 2;
    const c = park(STOCK[i].type, STOCK[i].color, x, z, turn, 1); c.position.y = 0.14; return c;
  });
  // the camera: [frame, eye, target]
  const CAM = [[0, [27, 21, 31], [0, 1, 0]], [36, [19, 11, 27], [0, 1.2, 3]], [70, [-1.5, 3.0, 17.5], [-7.5, 0.9, 8.6]], [92, [-11.6, 1.7, 14.4], [-7.5, 0.9, 8.6]], [112, [-12.8, 1.9, 11.4], [-7.5, 0.9, 8.6]],
    [134, [-4.8, 2.2, 15.4], [0, 1.0, 8.9]], [150, [1.4, 1.5, 15.0], [0, 1.0, 8.9]], [166, [4.4, 1.9, 14.6], [3, 1.0, 8.8]], [186, [4.4, 2.0, 15.2], [7.5, 1.0, 8.6]], [204, [12.0, 1.7, 14.0], [7.5, 1.0, 8.6]], [239, [-25, 17, 30], [0, 1.2, -1]]];
  const KP = CAM.map(k => [...k[1], ...k[2]]), KT = CAM.map(k => k[0]);
  const KM = KP.map((p, i) => p.map((_, c) => { if (i === 0 || i === KP.length - 1) return 0; const h0 = KT[i] - KT[i - 1], h1 = KT[i + 1] - KT[i]; return (((p[c] - KP[i - 1][c]) / h0) * h1 + ((KP[i + 1][c] - p[c]) / h1) * h0) / (h0 + h1); }));
  function raw(f) { f = Math.min(FRAMES - 1, Math.max(0, f)); let i = 0; while (i < KT.length - 2 && f > KT[i + 1]) i++; const h = KT[i + 1] - KT[i], x = (f - KT[i]) / h, x2 = x * x, x3 = x2 * x, a = 2 * x3 - 3 * x2 + 1, b = (x3 - 2 * x2 + x) * h, c = -2 * x3 + 3 * x2, d = (x3 - x2) * h; return KP[i].map((_, k) => a * KP[i][k] + b * KM[i][k] + c * KP[i + 1][k] + d * KM[i + 1][k]); }
  function camAt(f) { const acc = [0, 0, 0, 0, 0, 0]; let ws = 0; for (let k = -6; k <= 6; k++) { const w = Math.exp(-(k * k) / 18), r = raw(f + k * 1.2); for (let c = 0; c < 6; c++) acc[c] += w * r[c]; ws += w; } return acc.map(v => v / ws); }
  const wp = new THREE.Vector3(), tag = c => () => { c.getWorldPosition(wp); wp.y += 2.25; return wp; };
  function apply(f) {
    const [ex, ey, ez, tx, ty, tz] = camAt(f), k = portrait ? 1.3 : 1;
    camera.position.set(tx + (ex - tx) * k, ty + (ey - ty) * k, tz + (ez - tz) * k); camera.lookAt(tx, ty, tz); camera.updateMatrixWorld();
    featured.forEach((c, i) => { c.rotation.y = spots[i][2] + Math.sin((f / FRAMES) * Math.PI * 2 + i) * 0.06; });
  }
  return { scene, camera, frames: FRAMES, apply, bloom: { strength: 0.3, radius: 0.5, threshold: 1.0 }, anchors: { car1: tag(featured[0]), car2: tag(featured[1]), car3: tag(featured[2]), sign: () => wp.set(0, 6.3, -6.5) } };
}
