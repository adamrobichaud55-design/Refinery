// Plain, unbranded model cars built from two side profiles (body and cabin) pushed out to the car's width.
// No make or model is copied: four generic shapes in any colour.
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
export const BODIES = {
  hatch: { L: 4.1, W: 1.76, r: 0.33, lower: [[-2.05, 0.3], [-2.05, 0.86], [-1.9, 0.98], [0.95, 0.96], [1.75, 0.84], [2.05, 0.66], [2.05, 0.3]], cabin: [[-1.9, 0.94], [-1.5, 1.4], [0.05, 1.45], [0.98, 0.92]] },
  sedan: { L: 4.7, W: 1.82, r: 0.34, lower: [[-2.35, 0.3], [-2.35, 0.82], [-2.15, 0.98], [1.05, 0.95], [2.0, 0.83], [2.35, 0.66], [2.35, 0.3]], cabin: [[-1.6, 0.94], [-0.85, 1.37], [0.2, 1.4], [1.1, 0.91]] },
  suv: { L: 4.6, W: 1.9, r: 0.4, lower: [[-2.3, 0.38], [-2.3, 1.0], [-2.18, 1.14], [1.15, 1.12], [2.0, 1.0], [2.3, 0.8], [2.3, 0.38]], cabin: [[-2.15, 1.1], [-1.95, 1.66], [0.3, 1.72], [1.16, 1.06]] },
  pickup: { L: 5.3, W: 1.95, r: 0.42, lower: [[-2.65, 0.44], [-2.65, 1.1], [1.3, 1.12], [2.3, 1.02], [2.65, 0.82], [2.65, 0.44]], cabin: [[-0.62, 1.08], [-0.5, 1.72], [0.62, 1.78], [1.34, 1.08]] },
};
export function makeCar(THREE, type, color, { lights = 0.5 } = {}) {
  const B = BODIES[type], g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.55 }), glass = new THREE.MeshStandardMaterial({ color: 0x0b0e13, roughness: 0.12, metalness: 0.7 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.7 }), hub = new THREE.MeshStandardMaterial({ color: 0x9aa1ab, roughness: 0.35, metalness: 0.8 });
  const head = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xfff1d6, emissiveIntensity: 2.8 * lights }), tail = new THREE.MeshStandardMaterial({ color: 0x220404, emissive: 0xff2a1a, emissiveIntensity: 2.2 * lights });
  const add = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  /** the outline with its corners rounded off */
  const rounded = (pts, r) => { const s = new THREE.Shape(), n = pts.length, at = (a, b, d) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.min(d, l * 0.45) / l; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; };
    for (let i = 0; i < n; i++) { const p = pts[i], a = at(p, pts[(i + n - 1) % n], r), b = at(p, pts[(i + 1) % n], r); if (i) s.lineTo(a[0], a[1]); else s.moveTo(a[0], a[1]); s.quadraticCurveTo(p[0], p[1], b[0], b[1]); } s.closePath(); return s; };
  const slab = (pts, width, mat, bevel, r = 0.16) => { const s = rounded(pts, r); const geo = new THREE.ExtrudeGeometry(s, { depth: width - 2 * bevel, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 8 }); geo.translate(0, 0, -(width - 2 * bevel) / 2); return add(toCreasedNormals(geo, 0.75), mat); };
  slab(B.lower, B.W, paint, 0.13, 0.2); slab(B.cabin, B.W - 0.3, glass, 0.09, 0.12);
  const c = B.cabin, roofL = c[2][0] - c[1][0]; add(new THREE.BoxGeometry(roofL + 0.12, 0.07, B.W - 0.26), paint, (c[1][0] + c[2][0]) / 2, (c[1][1] + c[2][1]) / 2 + 0.035, 0).rotation.z = Math.atan2(c[2][1] - c[1][1], roofL);
  for (const z of [-1, 1]) for (const [a, b] of [[c[0], c[1]], [c[3], c[2]]]) { const len = Math.hypot(b[0] - a[0], b[1] - a[1]); const p = add(new THREE.BoxGeometry(len, 0.09, 0.07), paint, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z * (B.W / 2 - 0.13)); p.rotation.z = Math.atan2(b[1] - a[1], b[0] - a[0]); }
  add(new THREE.BoxGeometry(B.L - 0.5, 0.2, B.W - 0.3), dark, 0, B.lower[0][1] - 0.04, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (B.L / 2 - 0.86), z = sz * (B.W / 2 - 0.1);
    const t = add(new THREE.CylinderGeometry(B.r, B.r, 0.25, 22), dark, x, B.r, z); t.rotation.x = Math.PI / 2;
    const arch = add(new THREE.CylinderGeometry(B.r + 0.09, B.r + 0.09, 0.06, 22), dark, x, B.r + 0.02, sz * (B.W / 2 - 0.01)); arch.rotation.x = Math.PI / 2;
    const h = add(new THREE.CylinderGeometry(B.r * 0.58, B.r * 0.58, 0.02, 14), hub, x, B.r, z + sz * 0.125); h.rotation.x = Math.PI / 2;
  }
  const nose = B.lower[B.lower.length - 2], yF = nose[1] + 0.07, yR = B.lower[1][1] - 0.1;
  for (const sz of [-1, 1]) { add(new THREE.BoxGeometry(0.06, 0.11, 0.42), head, B.L / 2 - 0.03, yF, sz * (B.W / 2 - 0.36)); add(new THREE.BoxGeometry(0.06, 0.12, 0.4), tail, -B.L / 2 + 0.01, yR, sz * (B.W / 2 - 0.34)); }
  add(new THREE.BoxGeometry(0.05, 0.16, B.W - 1.15), dark, B.L / 2 - 0.02, yF - 0.02, 0);
  if (type === 'pickup') add(new THREE.BoxGeometry(1.75, 0.04, B.W - 0.3), dark, -1.62, 1.11, 0);
  return g;
}
