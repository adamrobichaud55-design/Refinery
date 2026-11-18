// "Photographs" of the model house for a listing: twelve still views, outside and room by room, at dusk with the
// lights on. Frame i is photograph i. Everything is the same hand-built model as the film, with the rooms dressed.
import { build as buildHouse } from './house.js';
export function build(ctx) {
  const { THREE, renderer, aspect } = ctx, base = buildHouse({ ...ctx, portrait: false }), { scene, camera } = base, { G0, G1, glassM, glow, porch, box, cyl, add, M } = base.parts;
  // ---- dress the rooms ----
  const wood = M(0x8a6a4a, { roughness: 0.6 }), dark = M(0x23272d, { roughness: 0.6 }), cloth = M(0x4f6a72), cream = M(0xf0ebe0), steel = M(0xb9bec6, { roughness: 0.3, metalness: 0.7 }), green = M(0x3a5a47, { flatShading: true });
  const lampM = new THREE.MeshStandardMaterial({ color: 0x332a1c, emissive: 0xffd29a, emissiveIntensity: 1.5 }), art = [M(0xc7714e), M(0x44607c), M(0xd9b56a), M(0x7c8f6f)];
  const light = (g, x, y, z, k = 9) => { const l = new THREE.PointLight(0xffc98a, k * 0.3, 7, 1.7); l.position.set(x, y, z); g.add(l); };
  const pendant = (g, x, y, z) => { cyl(g, dark, 0.012, 2.66 - y, x, (2.66 + y) / 2, z, 6); add(g, new THREE.SphereGeometry(0.13, 16, 12), lampM, x, y, z); };
  const picture = (g, k, w, h, x, y, z, side) => { side === 'x' ? (box(g, dark, 0.04, h + 0.08, w + 0.08, x, y, z), box(g, art[k % 4], 0.05, h, w, x, y, z)) : (box(g, dark, w + 0.08, h + 0.08, 0.04, x, y, z), box(g, art[k % 4], w, h, 0.05, x, y, z)); };
  const plant = (g, x, z, s = 1) => { cyl(g, cream, 0.17 * s, 0.34 * s, x, 0.16 + 0.17 * s, z, 12); add(g, new THREE.IcosahedronGeometry(0.34 * s, 1), green, x, 0.16 + 0.62 * s, z); add(g, new THREE.IcosahedronGeometry(0.24 * s, 1), green, x + 0.16 * s, 0.16 + 0.95 * s, z + 0.08 * s); };
  // living room
  picture(G0, 0, 1.3, 0.8, -4.72, 1.75, -1.6, 'x'); picture(G0, 1, 0.6, 0.8, -4.72, 1.75, -2.75, 'x'); picture(G0, 2, 0.9, 0.6, -1.4, 1.8, -3.22, 'z');
  cyl(G0, dark, 0.02, 1.5, -4.2, 0.91, -1.0, 8); add(G0, new THREE.CylinderGeometry(0.16, 0.24, 0.3, 16, 1, true), lampM, -4.2, 1.72, -1.0); cyl(G0, dark, 0.16, 0.03, -4.2, 0.18, -1.0, 12); light(G0, -4.2, 1.6, -1.0, 7);
  box(G0, cloth, 0.5, 0.14, 0.5, -3.2, 0.72, -0.5); box(G0, cream, 0.45, 0.14, 0.45, -1.9, 0.72, -0.5); box(G0, wood, 0.3, 0.02, 0.22, -2.3, 0.56, 0.95); plant(G0, -0.2, 2.75, 1.2);
  box(G0, wood, 0.34, 1.9, 1.2, 0.76, 1.11, 2.1); for (let i = 0; i < 4; i++) box(G0, cream, 0.36, 0.04, 1.16, 0.76, 0.5 + i * 0.45, 2.1);
  // dining and kitchen
  pendant(G0, -2.9, 1.75, -2.35); light(G0, -2.9, 1.7, -2.35, 7); pendant(G0, 1.75, 1.85, -1.25); pendant(G0, 2.55, 1.85, -1.25); light(G0, 2.15, 1.8, -1.25, 8);
  box(G0, cream, 2.2, 0.7, 0.34, 2.15, 1.95, -3.08); box(G0, steel, 0.7, 1.85, 0.66, 3.0, 1.08, -1.95); box(G0, steel, 0.56, 0.03, 0.5, 2.75, 1.12, -2.95); box(G0, dark, 0.7, 0.35, 0.32, 2.75, 1.78, -3.08);
  box(G0, wood, 0.3, 0.05, 0.2, 2.4, 1.13, -1.2); add(G0, new THREE.SphereGeometry(0.07, 10, 8), art[0], 1.75, 1.18, -1.3); add(G0, new THREE.SphereGeometry(0.07, 10, 8), art[2], 1.87, 1.18, -1.22); for (const dx of [-0.45, 0.45]) { cyl(G0, dark, 0.02, 0.62, 2.15 + dx, 0.47, -0.62, 6); cyl(G0, wood, 0.17, 0.05, 2.15 + dx, 0.8, -0.62, 14); }
  // upstairs: bedrooms and bathroom
  const lampOn = (x, z) => { box(G1, wood, 0.42, 0.5, 0.4, x, 0.45, z); cyl(G1, dark, 0.015, 0.22, x, 0.81, z, 6); add(G1, new THREE.CylinderGeometry(0.09, 0.13, 0.18, 14, 1, true), lampM, x, 0.98, z); light(G1, x, 1.0, z, 4); };
  lampOn(-4.3, -2.55); lampOn(-1.72, -2.55); box(G1, cloth, 1.86, 0.06, 0.9, -3.0, 0.76, -0.95); picture(G1, 3, 1.4, 0.7, -3.0, 1.65, -3.22, 'z'); box(G1, cloth, 2.6, 0.02, 1.4, -3.0, 0.21, 0.4); plant(G1, -4.4, 2.2, 0.9);
  lampOn(3.75, 0.25); box(G1, art[1], 1.26, 0.06, 0.8, 2.6, 0.76, 1.9); picture(G1, 0, 0.7, 0.9, 4.72, 1.6, 2.4, 'x'); box(G1, wood, 1.2, 0.04, 0.5, 0.4, 0.98, 2.9); box(G1, dark, 0.5, 0.34, 0.04, 0.4, 1.2, 3.1);
  box(G1, steel, 0.9, 0.7, 0.04, 0.3, 1.55, -3.2); box(G1, cream, 0.5, 0.03, 0.34, 0.3, 1.06, -2.95); box(G1, cloth, 0.9, 0.02, 0.6, 3.6, 0.21, -1.85); box(G1, steel, 0.04, 0.04, 0.7, 4.7, 1.3, -1.6); box(G1, cream, 0.06, 0.6, 0.5, 4.66, 1.0, -1.6); light(G1, 2.4, 1.9, -1.9, 9);
  // ---- the twelve views: [eye, target, field of view, inside?] ----
  const U = 2.8, VIEWS = [
    [[-13, 3.0, 19], [2.2, 2.8, 0.5], 34, 0],          // 1  the front, from the lane
    [[17, 15, 22], [2, 1.5, 0], 34, 0],                // 2  from above
    [[4.6, 1.7, 10.5], [1.6, 1.9, 3.5], 46, 0],        // 3  the front door
    [[-0.3, 1.55, 3.0], [-3.6, 0.95, -1.4], 68, 1],    // 4  living room
    [[-3.9, 1.55, 2.4], [0.6, 1.0, -2.2], 68, 1],      // 5  living room to the kitchen
    [[-0.4, 1.5, -0.4], [-3.4, 0.95, -2.8], 62, 1],    // 6  dining
    [[1.35, 1.55, 0.2], [2.7, 1.1, -2.9], 66, 1],      // 7  kitchen
    [[-1.0, U + 1.55, 1.6], [-3.6, U + 0.7, -2.4], 68, 1],   // 8  main bedroom
    [[-0.2, U + 1.55, 0.0], [3.2, U + 0.6, 2.2], 68, 1],     // 9  second bedroom
    [[4.45, U + 1.6, -0.75], [1.3, U + 0.7, -3.1], 70, 1],   // 10 bathroom
    [[-2.5, 2.4, -13], [-1, 2.2, -3.5], 52, 0],        // 11 the back, with the patio
    [[15, 3.6, 17], [4, 2.4, 1.5], 34, 0],             // 12 the drive and garage
  ];
  // the pipes, ducts and wiring belong to the film, not to a photograph of a room
  scene.traverse(o => { if (o.isMesh && o.material.color && o.material.color.getHex() === 0x3f444c) o.visible = false; });
  const fill = new THREE.HemisphereLight(0xfff0dc, 0x40342a, 0); scene.add(fill);
  function apply(i) {
    base.apply(239);                                   // the house closed, lights on
    const [eye, tgt, fov, inside] = VIEWS[i];
    camera.fov = fov / Math.max(1, 1.5 / aspect) ; camera.near = inside ? 0.15 : 1; camera.position.set(...eye); camera.lookAt(...tgt); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    // from inside, the windows show the evening outside; from outside, they glow
    glassM.emissive.set(inside ? 0x3a5a94 : 0xffc27a); glassM.emissiveIntensity = inside ? 0.5 : 1.35; fill.intensity = inside ? 0.28 : 0; glow.forEach(l => { l.intensity = inside ? 5 : 14; }); porch.intensity = 6;
    renderer.toneMappingExposure = inside ? 0.98 : 1.15;
  }
  return { scene, camera, frames: VIEWS.length, apply, bloom: { strength: 0.3, radius: 0.5, threshold: 0.95 }, anchors: {} };
}
