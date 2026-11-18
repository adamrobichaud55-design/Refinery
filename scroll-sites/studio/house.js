// The home-services film: a model house at dusk. The camera makes one full turn round it while the roof and the upper
// storey lift off, the shell turns to glass and the heating, plumbing and electrical systems light up in turn, and the
// house closes again with its lights on. Everything is built here from boxes, cylinders and cones: no outside assets.
export function build({ THREE, portrait, aspect }) {
  const FRAMES = 240, BG = 0x0b0f16;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(BG);
  const camera = new THREE.PerspectiveCamera(portrait ? 50 : 30, aspect, 1, 400);
  scene.add(new THREE.HemisphereLight(0x8fa8d8, 0x1a1512, 0.7));
  const key = new THREE.DirectionalLight(0xc4d5ff, 1.9); key.position.set(-15, 24, 17); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 90 }); key.shadow.bias = -0.0005; key.shadow.normalBias = 0.04; scene.add(key);
  const rim = new THREE.DirectionalLight(0xffa868, 0.75); rim.position.set(18, 7, -9); scene.add(rim);

  // ---- materials ----
  const shellMats = [], sysMats = {};
  const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.86, metalness: 0, ...o });
  const shell = (color, o = {}) => { const m = M(color, o); m.userData.shell = true; shellMats.push(m); return m; };
  const wallM = shell(0xe9e5dc), trimM = shell(0x23272d, { roughness: 0.6 }), roofM = shell(0x2a2f37, { roughness: 0.7 }), slabM = shell(0xc9bfae), partM = shell(0xddd8cd);
  const furnA = shell(0x9aa3ad), furnB = shell(0xb9ae9b), furnC = shell(0x6f7b87), whiteM = shell(0xf2f1ee, { roughness: 0.5 });
  const glassM = new THREE.MeshStandardMaterial({ color: 0x1a140d, emissive: 0xffc27a, emissiveIntensity: 1, roughness: 0.3, transparent: true });
  const edgeM = new THREE.LineBasicMaterial({ color: 0xbcd0ff, transparent: true, opacity: 0, depthWrite: false });
  const sys = (name, color) => (sysMats[name] = new THREE.MeshStandardMaterial({ color: 0x3f444c, emissive: color, emissiveIntensity: 0, roughness: 0.55 }));
  const hvacM = sys('hvac', 0xff7a2e), plumbM = sys('plumbing', 0x39a8ff), elecM = sys('electrical', 0xffd034);
  const lawnM = M(0x22332a), baseM = M(0x161b22), driveM = M(0x2f343c), stoneM = M(0x4b5059), treeM = M(0x2c4a3e, { flatShading: true }), leafM = M(0x3a5a47, { flatShading: true }), barkM = M(0x3a2f28);
  const vanM = M(0xe3e6ea, { roughness: 0.45 }), darkM = M(0x1b1e23, { roughness: 0.5 }), tyreM = M(0x101214);

  // ---- helpers ----
  const shellMeshes = [];
  function add(parent, geo, mat, x, y, z) {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m);
    if (mat.userData.shell) { shellMeshes.push(m); m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), edgeM)); }
    return m;
  }
  const box = (p, mat, w, h, d, x, y, z) => add(p, new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  const cyl = (p, mat, r, h, x, y, z, seg = 20) => add(p, new THREE.CylinderGeometry(r, r, h, seg), mat, x, y, z);
  /** a run of round pipe through the points, with rounded joints */
  function pipe(p, mat, pts, r) {
    for (let i = 0; i < pts.length; i++) {
      const a = new THREE.Vector3(...pts[i]); add(p, new THREE.SphereGeometry(r, 10, 8), mat, a.x, a.y, a.z);
      if (i === pts.length - 1) break;
      const b = new THREE.Vector3(...pts[i + 1]), mid = a.clone().add(b).multiplyScalar(0.5), m = add(p, new THREE.CylinderGeometry(r, r, a.distanceTo(b), 10), mat, mid.x, mid.y, mid.z);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    }
  }
  /** a rectangular duct between two points on one axis */
  function duct(p, mat, a, b, w, h) {
    const dx = Math.abs(b[0] - a[0]), dy = Math.abs(b[1] - a[1]), dz = Math.abs(b[2] - a[2]);
    return box(p, mat, dx > 0.01 ? dx + w : w, dy > 0.01 ? dy + h : h, dz > 0.01 ? dz + w : (dx > 0.01 || dy > 0.01 ? w : w), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  }

  // ---- the plot ----
  const CX = 1.5;
  box(scene, baseM, 23.5, 1.4, 19.5, CX, -0.7, 0.5); box(scene, lawnM, 22.9, 0.06, 18.9, CX, 0.0, 0.5);
  box(scene, driveM, 4.0, 0.08, 5.6, 7.25, 0.03, 6.3); box(scene, driveM, 22.9, 0.08, 0.9, CX, 0.03, 9.5);
  for (let i = 0; i < 4; i++) box(scene, stoneM, 1.1, 0.08, 0.7, 1.5 + (i % 2 ? 0.12 : -0.12), 0.05, 5.5 + i * 1.0);
  box(scene, stoneM, 4.6, 0.1, 2.8, -2.5, 0.05, -5.1);                                             // back patio
  box(scene, furnC, 1.0, 0.7, 1.0, -2.5, 0.45, -5.2); for (const dx of [-1.1, 1.1]) box(scene, furnA, 0.6, 0.8, 0.6, -2.5 + dx, 0.5, -5.2);
  for (let i = 0; i < 6; i++) box(scene, leafM, 0.9, 0.7, 0.7, -4.4 + i * 0.95, 0.38, 4.25);         // hedge under the living-room window
  const conifer = (x, z, s = 1) => { cyl(scene, barkM, 0.13 * s, 0.9 * s, x, 0.45 * s, z, 8); [[1.05, 1.5, 1.4], [0.82, 1.3, 2.35], [0.56, 1.15, 3.2]].forEach(([r, h, y]) => add(scene, new THREE.ConeGeometry(r * s, h * s, 7), treeM, x, y * s, z)); };
  const blob = (x, z, s = 1) => { cyl(scene, barkM, 0.14 * s, 1.5 * s, x, 0.75 * s, z, 8); add(scene, new THREE.IcosahedronGeometry(1.25 * s, 1), leafM, x, 2.2 * s, z); add(scene, new THREE.IcosahedronGeometry(0.85 * s, 1), leafM, x + 0.7 * s, 1.75 * s, z + 0.3 * s); };
  conifer(-8.6, -6.6, 1.2); conifer(-9.2, -2.8, 0.9); conifer(11.6, -7.2, 1.15); conifer(3.4, -7.9, 1.0); conifer(-5.0, -8.0, 0.85);
  blob(-8.3, 5.2, 1.1); blob(11.9, -2.6, 0.8); blob(-8.9, 8.6, 0.6);
  cyl(scene, darkM, 0.05, 1.1, -0.3, 0.55, 8.7, 8); box(scene, whiteM, 0.5, 0.28, 0.3, -0.3, 1.2, 8.7);   // mailbox

  // the service van on the drive: plain, unbranded
  const van = new THREE.Group(); van.position.set(7.25, 0, 6.6); scene.add(van);
  box(van, vanM, 1.95, 1.55, 3.3, 0, 1.2, -0.55); box(van, vanM, 1.95, 1.0, 1.3, 0, 0.92, 1.7); box(van, darkM, 1.8, 0.62, 0.9, 0, 1.55, 1.38); box(van, darkM, 1.97, 0.16, 4.6, 0, 0.5, 0.1);
  for (const [x, z] of [[-0.98, 1.5], [0.98, 1.5], [-0.98, -1.4], [0.98, -1.4]]) { const w = cyl(van, tyreM, 0.4, 0.26, x, 0.4, z, 18); w.rotation.z = Math.PI / 2; }

  // ---- the house ----
  const T = 0.25, HW = 5, HD = 3.5, H0 = 2.8, H1 = 2.6;
  const G0 = new THREE.Group(), G1 = new THREE.Group(), ROOF = new THREE.Group(), GAR = new THREE.Group(), GROOF = new THREE.Group();
  scene.add(G0, G1, ROOF, GAR, GROOF); G1.userData.y = H0; ROOF.userData.y = H0 + H1; GROOF.userData.y = H0;
  function walls(g, h, skipRight = false) {
    box(g, wallM, 2 * HW, h, T, 0, h / 2, HD - T / 2); box(g, wallM, 2 * HW, h, T, 0, h / 2, -HD + T / 2);
    box(g, wallM, T, h, 2 * HD - 2 * T, -HW + T / 2, h / 2, 0); if (!skipRight) box(g, wallM, T, h, 2 * HD - 2 * T, HW - T / 2, h / 2, 0);
  }
  /** a lit window (or a door when solid is given) set into a wall: side F, B, L or R; u along the wall */
  function opening(g, side, u, sill, w, h, solid) {
    const fb = side === 'F' || side === 'B', s = side === 'F' || side === 'R' ? 1 : -1, off = (fb ? HD : HW) - T / 2, y = sill + h / 2, D = T + 0.08;
    const put = (mat, ww, hh, dd, du, dy) => (fb ? box(g, mat, ww, hh, dd, u + du, y + dy, s * off) : box(g, mat, dd, hh, ww, s * off, y + dy, u + du));
    put(solid ?? glassM, w, h, D, 0, 0);
    put(trimM, w + 0.2, 0.1, D + 0.08, 0, h / 2 + 0.05); put(trimM, w + 0.2, 0.1, D + 0.08, 0, -h / 2 - 0.05); put(trimM, 0.1, h, D + 0.08, -w / 2 - 0.05, 0); put(trimM, 0.1, h, D + 0.08, w / 2 + 0.05, 0);
    if (!solid && w > 1.5) put(trimM, 0.06, h, D + 0.04, 0, 0);
  }
  // ground storey
  box(G0, slabM, 2 * HW - 0.02, 0.16, 2 * HD - 0.02, 0, 0.08, 0); walls(G0, H0);
  opening(G0, 'F', -2.6, 0.75, 3.2, 1.55); opening(G0, 'F', 3.7, 0.95, 1.2, 1.2); opening(G0, 'F', 1.5, 0.16, 1.0, 2.1, trimM);
  opening(G0, 'B', -2.5, 0.16, 2.4, 2.1); opening(G0, 'B', 2.0, 1.05, 1.6, 1.0); opening(G0, 'L', 0.4, 0.85, 1.8, 1.4);
  box(G0, stoneM, 2.6, 0.16, 1.5, 1.5, 0.08, 4.25); box(G0, trimM, 2.8, 0.1, 1.6, 1.5, 2.5, 4.3); for (const dx of [-1.2, 1.2]) box(G0, trimM, 0.1, 2.4, 0.1, 1.5 + dx, 1.25, 4.95);
  const P = 2.5;                                                                                     // partitions
  box(G0, partM, 0.12, P, 3.0, 1.0, P / 2 + 0.16, -1.9); box(G0, partM, 2.5, P, 0.12, 3.45, P / 2 + 0.16, 0.0); box(G0, partM, 0.12, P, 1.6, 3.35, P / 2 + 0.16, -2.5); box(G0, partM, 0.9, P, 0.12, 4.25, P / 2 + 0.16, -1.65);
  box(G0, furnC, 3.4, 0.03, 2.3, -2.5, 0.175, 0.7);                                                  // living room: rug, sofa, table, console
  box(G0, furnA, 2.5, 0.45, 0.95, -2.5, 0.4, -0.55); box(G0, furnA, 2.5, 0.5, 0.25, -2.5, 0.85, -0.92); box(G0, furnA, 0.95, 0.45, 1.5, -4.0, 0.4, 0.75);
  box(G0, furnB, 1.2, 0.08, 0.65, -2.4, 0.5, 0.9); for (const [dx, dz] of [[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]]) box(G0, furnB, 0.06, 0.34, 0.06, -2.4 + dx, 0.33, 0.9 + dz);
  box(G0, furnB, 2.2, 0.5, 0.4, -2.3, 0.42, 2.95); box(G0, darkM, 1.5, 0.85, 0.06, -2.3, 1.2, 3.0);
  cyl(G0, furnB, 0.2, 0.4, -4.3, 0.36, 2.7, 10); add(G0, new THREE.ConeGeometry(0.42, 1.1, 7), leafM, -4.3, 1.1, 2.7);
  box(G0, furnB, 1.9, 0.07, 0.9, -2.9, 0.92, -2.35); for (const [dx, dz] of [[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]]) box(G0, furnB, 0.07, 0.74, 0.07, -2.9 + dx, 0.53, -2.35 + dz);
  for (const [dx, dz] of [[-0.5, -0.75], [0.5, -0.75], [-0.5, 0.75], [0.5, 0.75]]) box(G0, furnC, 0.42, 0.48, 0.42, -2.9 + dx, 0.4, -2.35 + dz);
  box(G0, whiteM, 2.2, 0.9, 0.6, 2.15, 0.61, -2.95); box(G0, furnC, 2.24, 0.05, 0.64, 2.15, 1.08, -2.95); const sink = box(G0, darkM, 0.55, 0.04, 0.4, 1.9, 1.1, -2.95);   // kitchen
  box(G0, whiteM, 1.6, 0.9, 0.8, 2.15, 0.61, -1.25); box(G0, furnC, 1.7, 0.05, 0.9, 2.15, 1.08, -1.25);
  for (let i = 0; i < 12; i++) box(G0, furnB, 0.2, 0.2 + i * 0.215, 0.95, 2.3 + i * 0.2, 0.16 + (0.2 + i * 0.215) / 2, 1.0);   // stairs
  // upper storey
  box(G1, slabM, 2 * HW - 0.02, 0.2, 2 * HD - 0.02, 0, 0.1, 0); walls(G1, H1);
  for (const u of [-3.1, 0, 3.1]) opening(G1, 'F', u, 0.95, 1.4, 1.25); opening(G1, 'B', -2.6, 0.95, 1.6, 1.25); opening(G1, 'B', 2.6, 1.3, 1.0, 0.8); opening(G1, 'L', -0.3, 0.95, 1.5, 1.25); opening(G1, 'R', 1.2, 0.95, 1.3, 1.25);
  const Q = 2.3; box(G1, partM, 0.12, Q, 2 * HD - 2 * T, -0.6, Q / 2 + 0.2, 0); box(G1, partM, 5.3, Q, 0.12, 2.1, Q / 2 + 0.2, -0.4);
  const bed = (x, z, w, l) => { box(G1, furnB, w, 0.3, l, x, 0.4, z); box(G1, whiteM, w - 0.08, 0.2, l - 0.1, x, 0.62, z); box(G1, furnA, w, 0.9, 0.12, x, 0.7, z - l / 2 - 0.06); box(G1, furnA, w - 0.3, 0.14, 0.4, x, 0.78, z - l / 2 + 0.35); };
  bed(-3.0, -1.6, 1.9, 2.1); box(G1, furnB, 0.5, 0.5, 0.45, -1.6, 0.45, -2.6); box(G1, furnC, 2.4, 2.0, 0.6, -2.8, 1.2, 2.85); bed(2.6, 1.35, 1.3, 2.0); box(G1, furnB, 1.3, 0.75, 0.6, 0.4, 0.58, 2.9);
  const tub = box(G1, whiteM, 1.8, 0.6, 0.8, 3.6, 0.5, -2.7); box(G1, whiteM, 1.0, 0.85, 0.5, 0.3, 0.62, -2.95); box(G1, whiteM, 0.42, 0.42, 0.62, 1.9, 0.41, -2.85); box(G1, whiteM, 0.42, 0.75, 0.18, 1.9, 0.58, -3.12);
  // roof
  const pitch = (35 * Math.PI) / 180, rise = Math.tan(pitch) * HD, slope = (HD + 0.55) / Math.cos(pitch), tR = 0.2;
  for (const s of [1, -1]) {
    const g = new THREE.Group(); g.position.set(0, (rise - Math.tan(pitch) * 0.55) / 2 + (tR / 2) * Math.cos(pitch), s * ((HD + 0.55) / 2 + (tR / 2) * Math.sin(pitch))); g.rotation.x = s * pitch; ROOF.add(g);
    box(g, roofM, 2 * HW + 1.0, tR, slope, 0, 0, 0); for (let i = 0; i <= 16; i++) box(g, roofM, 0.06, 0.07, slope, -5.3 + i * 0.6625, tR / 2 + 0.035, 0);
  }
  box(ROOF, roofM, 2 * HW + 1.0, 0.14, 0.3, 0, rise + 0.2, 0);
  const tri = new THREE.Shape(); tri.moveTo(-HD, 0); tri.lineTo(HD, 0); tri.lineTo(0, rise); tri.closePath();
  for (const s of [1, -1]) { const m = add(ROOF, new THREE.ExtrudeGeometry(tri, { depth: T, bevelEnabled: false }), wallM, s > 0 ? HW - T : -HW, 0, 0); m.rotation.y = Math.PI / 2; m.position.z = 0; }
  box(ROOF, wallM, 0.85, 2.6, 0.85, -3.0, 1.9, -1.3); box(ROOF, trimM, 1.0, 0.14, 1.0, -3.0, 3.25, -1.3);
  // garage wing
  const gx = 7.25, gz = 0.5, gw = 4.5, gd = 6.0;
  box(GAR, slabM, gw, 0.12, gd, gx, 0.06, gz); box(GAR, wallM, gw, H0, T, gx, H0 / 2, gz + gd / 2 - T / 2); box(GAR, wallM, gw, H0, T, gx, H0 / 2, gz - gd / 2 + T / 2); box(GAR, wallM, T, H0, gd - 2 * T, gx + gw / 2 - T / 2, H0 / 2, gz);
  box(GAR, whiteM, 3.2, 2.2, T + 0.06, gx, 1.22, gz + gd / 2 - T / 2); for (let i = 0; i < 4; i++) box(GAR, trimM, 3.2, 0.035, T + 0.1, gx, 0.55 + i * 0.55, gz + gd / 2 - T / 2);
  box(GAR, furnC, 0.5, 1.8, 2.2, gx + 1.7, 1.02, gz - 1.2); box(GAR, furnB, 1.6, 0.9, 0.6, gx - 0.4, 0.57, gz - 2.5);
  box(GROOF, roofM, gw + 0.3, 0.2, gd + 0.3, gx, 0.1, gz); for (const [w, d, x, z] of [[gw + 0.3, 0.14, gx, gz + gd / 2 + 0.08], [gw + 0.3, 0.14, gx, gz - gd / 2 - 0.08], [0.14, gd + 0.3, gx + gw / 2 + 0.08, gz]]) box(GROOF, trimM, w, 0.3, d, x, 0.3, z);

  // ---- heating and cooling ----
  const furnace = box(G0, hvacM, 0.7, 1.7, 0.7, 4.32, 1.01, -2.85); box(G0, hvacM, 0.5, 0.5, 0.5, 4.32, 2.1, -2.85);
  duct(G0, hvacM, [4.32, 2.42, -2.85], [4.32, 2.42, -2.05], 0.5, 0.3); duct(G0, hvacM, [-4.2, 2.42, -2.05], [4.32, 2.42, -2.05], 0.5, 0.3);
  for (const x of [-3.6, -1.3, 2.2]) { duct(G0, hvacM, [x, 2.42, -2.05], [x, 2.42, 2.6], 0.28, 0.2); box(G0, hvacM, 0.5, 0.06, 0.3, x, 2.3, 2.6); }
  duct(G0, hvacM, [0.4, 2.42, -2.05], [0.4, H0 - 0.02, -2.05], 0.34, 0.34);
  duct(G1, hvacM, [0.4, 0, -2.05], [0.4, 2.2, -2.05], 0.34, 0.34); duct(G1, hvacM, [-3.8, 2.2, -2.05], [3.9, 2.2, -2.05], 0.42, 0.26);
  for (const x of [-3.2, 2.9]) { duct(G1, hvacM, [x, 2.2, -2.05], [x, 2.2, 2.3], 0.26, 0.18); box(G1, hvacM, 0.46, 0.06, 0.28, x, 2.08, 2.3); }
  const cond = box(scene, hvacM, 0.95, 0.9, 0.95, 4.3, 0.55, -4.7); cyl(scene, darkM, 0.36, 0.04, 4.3, 1.02, -4.7, 20); box(scene, stoneM, 1.2, 0.1, 1.2, 4.3, 0.06, -4.7);
  pipe(scene, hvacM, [[4.3, 0.7, -4.2], [4.3, 0.7, -3.3], [4.32, 0.7, -3.2]], 0.045);
  // ---- plumbing ----
  const heater = cyl(G0, plumbM, 0.27, 1.45, 3.78, 0.9, -2.1, 18); cyl(G0, plumbM, 0.29, 0.06, 3.78, 1.66, -2.1, 18);
  pipe(G0, plumbM, [[3.0, 0.3, 6.5], [3.0, 0.3, -1.3], [3.78, 0.3, -1.3], [3.78, 0.3, -1.75]], 0.07);
  pipe(G0, plumbM, [[3.78, 1.7, -2.1], [3.78, 1.95, -2.1], [3.78, 1.95, -3.12], [1.9, 1.95, -3.12], [1.9, 1.15, -3.12]], 0.06);
  pipe(G0, plumbM, [[1.35, 1.95, -3.12], [1.9, 1.95, -3.12]], 0.06); pipe(G0, plumbM, [[1.35, 1.95, -3.12], [1.35, H0, -3.12]], 0.06);
  pipe(G0, plumbM, [[4.55, 0.25, -3.12], [4.55, H0, -3.12]], 0.09); pipe(G0, plumbM, [[4.55, 0.25, -3.12], [4.55, 0.25, -5.6]], 0.09);
  pipe(G1, plumbM, [[1.35, 0, -3.12], [1.35, 0.45, -3.12], [3.6, 0.45, -3.12], [3.6, 0.85, -3.12]], 0.06); pipe(G1, plumbM, [[0.3, 0.45, -3.12], [1.35, 0.45, -3.12]], 0.06); pipe(G1, plumbM, [[0.3, 0.45, -3.12], [0.3, 1.05, -3.12]], 0.06);
  pipe(G1, plumbM, [[4.55, 0, -3.12], [4.55, 0.3, -3.12], [1.9, 0.3, -3.12]], 0.09);
  // ---- electrical ----
  const panel = box(GAR, elecM, 0.12, 0.75, 0.5, 5.18, 1.55, 1.9); const lamp = (g, x, y, z) => cyl(g, elecM, 0.18, 0.06, x, y, z, 16), R = 0.04, yc = 2.62;
  pipe(GAR, elecM, [[5.18, 1.95, 1.9], [5.18, yc, 1.9], [4.6, yc, 1.9]], R); pipe(GAR, elecM, [[5.3, yc, 1.9], [7.25, yc, 1.9], [7.25, yc, 0.5]], R); lamp(GAR, 7.25, yc - 0.05, 0.5);
  pipe(G0, elecM, [[4.6, yc, 1.9], [4.6, yc, 1.5], [-4.3, yc, 1.5]], R);
  for (const [x, z] of [[-2.5, 0.5], [-2.9, -2.35], [2.15, -1.6], [3.3, 1.5]]) { if (z !== 1.5) pipe(G0, elecM, [[x, yc, 1.5], [x, yc, z]], R); lamp(G0, x, yc - 0.05, z); }
  for (const [x, z] of [[-4.3, 1.5], [0.6, 1.5]]) { pipe(G0, elecM, [[x, yc, z], [x, yc, 3.18], [x, 0.5, 3.18]], R); box(G0, elecM, 0.14, 0.2, 0.06, x, 0.5, 3.2); }
  pipe(G0, elecM, [[4.6, yc, 1.5], [4.6, H0, 1.5]], R);
  const yu = 2.42; pipe(G1, elecM, [[4.6, 0, 1.5], [4.6, yu, 1.5], [-3.0, yu, 1.5]], R);
  for (const [x, z] of [[-3.0, -0.6], [2.6, 1.5], [2.4, -1.9]]) { if (z !== 1.5) pipe(G1, elecM, [[x, yu, 1.5], [x, yu, z]], R); lamp(G1, x, yu - 0.05, z); }
  // warm light inside
  const glow = []; for (const [g, x, y, z] of [[G0, -2.5, 2.0, 0.4], [G0, 2.3, 2.0, -1.5], [G1, -2.9, 1.9, 0], [G1, 2.6, 1.9, 1.3], [GAR, 7.25, 2.0, 0.5]]) { const l = new THREE.PointLight(0xffb86a, 0, 9, 1.8); l.position.set(x, y, z); g.add(l); glow.push(l); }
  const porch = new THREE.PointLight(0xffc98a, 0, 7, 1.8); porch.position.set(1.5, 2.2, 4.4); scene.add(porch);

  // ---- time ----
  const sm = u => u * u * (3 - 2 * u);
  const track = pts => f => { if (f <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (f <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((f - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0])); return pts[pts.length - 1][1]; };
  const explode = track([[38, 0], [86, 1], [194, 1], [228, 0]]), xray = track([[84, 0], [104, 1], [190, 1], [214, 0]]);
  const hv = track([[90, 0], [106, 1], [122, 1], [136, 0.035], [200, 0.035], [214, 0]]), pl = track([[126, 0], [141, 1], [157, 1], [171, 0.04], [200, 0.04], [214, 0]]), el = track([[161, 0], [176, 1], [192, 1], [208, 0]]);
  const win = track([[0, 1.0], [84, 1.0], [104, 0.45], [190, 0.45], [222, 1.9], [239, 2.1]]), lightsIn = track([[0, 9], [84, 9], [104, 3], [190, 3], [222, 16], [239, 18]]);
  // the camera: one turn round the house. [frame, turn (degrees from the front), height angle, distance, target height]
  const CAM = [[0, -38, 12, 39, 2.9], [40, -16, 16, 37, 3.1], [88, 26, 33, 46, 5.0], [124, 84, 31, 45, 4.9], [159, 150, 30, 45, 4.9], [194, 216, 30, 46, 4.8], [239, 322, 14, 40, 3.0]];
  const CM = CAM.map((k, i) => k.map((_, c) => { if (i === 0 || i === CAM.length - 1 || c === 0) return 0; const h0 = k[0] - CAM[i - 1][0], h1 = CAM[i + 1][0] - k[0]; return (((k[c] - CAM[i - 1][c]) / h0) * h1 + ((CAM[i + 1][c] - k[c]) / h1) * h0) / (h0 + h1); }));
  function camAt(f) {
    let i = 0; while (i < CAM.length - 2 && f > CAM[i + 1][0]) i++;
    const h = CAM[i + 1][0] - CAM[i][0], x = Math.min(1, Math.max(0, (f - CAM[i][0]) / h)), x2 = x * x, x3 = x2 * x, a = 2 * x3 - 3 * x2 + 1, b = (x3 - 2 * x2 + x) * h, c = -2 * x3 + 3 * x2, d = (x3 - x2) * h;
    return [1, 2, 3, 4].map(k => a * CAM[i][k] + b * CM[i][k] + c * CAM[i + 1][k] + d * CM[i + 1][k]);
  }
  const wp = new THREE.Vector3(), at = (o, dy = 0) => () => { o.getWorldPosition(wp); wp.y += dy; return wp; };
  function apply(f) {
    const e = explode(f), x = xray(f);
    G1.position.y = G1.userData.y + 2.5 * e; ROOF.position.y = ROOF.userData.y + 4.9 * e; GROOF.position.y = GROOF.userData.y + 1.9 * e;
    for (const m of shellMats) { const t = x > 0.002; if (m.transparent !== t) { m.transparent = t; m.needsUpdate = true; } m.opacity = 1 - 0.9 * x; m.depthWrite = x < 0.5; }
    for (const m of shellMeshes) m.castShadow = x < 0.5;
    edgeM.opacity = 0.5 * x;
    hvacM.emissiveIntensity = 2.6 * hv(f); plumbM.emissiveIntensity = 2.8 * pl(f); elecM.emissiveIntensity = 2.4 * el(f);
    glassM.emissiveIntensity = win(f); glassM.opacity = 1 - 0.8 * x; glassM.depthWrite = x < 0.5; glow.forEach(l => { l.intensity = lightsIn(f); }); porch.intensity = lightsIn(f) * 0.6;
    const [turn, tilt, dist, ty] = camAt(f), th = (turn * Math.PI) / 180, ph = (tilt * Math.PI) / 180, r = dist * (portrait ? 1.2 : 1);
    camera.position.set(CX + r * Math.sin(th) * Math.cos(ph), ty + r * Math.sin(ph), 0.5 + r * Math.cos(th) * Math.cos(ph)); camera.lookAt(CX, ty, 0.5); camera.updateMatrixWorld();
  }
  return { scene, camera, frames: FRAMES, apply, bloom: { strength: 0.42, radius: 0.55, threshold: 0.92 }, parts: { G0, G1, glassM, glow, porch, box, cyl, add, M },
    anchors: { furnace: at(furnace, 0.9), condenser: at(cond, 0.5), heater: at(heater, 0.8), sink: at(sink), bath: at(tub, 0.3), panel: at(panel, 0.4), door: () => wp.set(1.5, 1.3, 3.6), ridge: () => wp.set(0, ROOF.position.y + rise + 0.3, 0), van: at(van, 2.1) } };
}
