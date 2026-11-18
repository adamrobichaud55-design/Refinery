// Stock photos for the dealer site: each sample car on its own, three-quarter view. Frame i is car i.
import { makeCar } from './cars.js';
import { STOCK } from './stock.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
export function build({ THREE, renderer, aspect }) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x14121c);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.45;
  const camera = new THREE.PerspectiveCamera(26, aspect, 0.5, 100); camera.position.set(6.6, 2.5, 7.2); camera.lookAt(0, 0.72, 0);
  scene.add(new THREE.HemisphereLight(0xbfc8ff, 0x1a1420, 1.1));
  const key = new THREE.DirectionalLight(0xfff2e0, 2.6); key.position.set(5, 9, 6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); key.shadow.normalBias = 0.03; scene.add(key);
  const rim = new THREE.DirectionalLight(0xff8a5c, 1.2); rim.position.set(-7, 3, -6); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.1, 64), new THREE.MeshStandardMaterial({ color: 0x1d1a27, roughness: 0.5 })); floor.position.y = -0.05; floor.receiveShadow = true; scene.add(floor);
  const cars = STOCK.map(s => { const c = makeCar(THREE, s.type, s.color, { lights: 0.9 }); c.rotation.y = 0.18; c.visible = false; scene.add(c); return c; });
  return { scene, camera, frames: STOCK.length, apply: i => cars.forEach((c, k) => { c.visible = k === i; }), bloom: { strength: 0.35, radius: 0.5, threshold: 0.95 }, anchors: {} };
}
