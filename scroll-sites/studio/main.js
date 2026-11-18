// Shared studio shell: picks a scene (?scene=house|carlot) and an output size (?w=&h=), renders frame i with
// sub-pixel accumulation (anti-aliasing) and bloom, and reports where the scene's named points land on screen.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
const q = new URLSearchParams(location.search), W = Number(q.get('w') ?? 1440), H = Number(q.get('h') ?? 810), SAMPLES = Number(q.get('s') ?? 10);
const gl = document.getElementById('gl'), out = document.getElementById('out'); out.width = W; out.height = H;
const renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
const mod = await import(`./${q.get('scene') ?? 'house'}.js`);
const S = mod.build({ THREE, renderer, portrait: H > W, aspect: W / H });   // { scene, camera, frames, apply(f), anchors: {name: Vector3 getter}, bloom }
const composer = new EffectComposer(renderer); composer.setSize(W, H);
composer.addPass(new RenderPass(S.scene, S.camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), S.bloom?.strength ?? 0.5, S.bloom?.radius ?? 0.6, S.bloom?.threshold ?? 0.9); composer.addPass(bloom);
composer.addPass(new OutputPass());
const ctx = out.getContext('2d');
const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
function setFrame(i) {
  S.apply(i);
  ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  for (let k = 0; k < SAMPLES; k++) {
    S.camera.setViewOffset(W, H, halton(k + 1, 2) - 0.5, halton(k + 1, 3) - 0.5, W, H);
    composer.render(); ctx.globalAlpha = 1 / (k + 1); ctx.drawImage(gl, 0, 0);
  }
  S.camera.clearViewOffset(); ctx.globalAlpha = 1; S.camera.updateMatrixWorld();
  const a = {}, v = new THREE.Vector3();
  for (const [name, get] of Object.entries(S.anchors ?? {})) { v.copy(get()).project(S.camera); a[name] = [Number((v.x * 0.5 + 0.5).toFixed(4)), Number((-v.y * 0.5 + 0.5).toFixed(4)), v.z < 1 ? 1 : 0]; }
  return a;
}
/** where the named points are at frame i, without drawing it */
function anchorsAt(i) { S.apply(i); S.camera.updateMatrixWorld(); const a = {}, v = new THREE.Vector3(); for (const [name, get] of Object.entries(S.anchors ?? {})) { v.copy(get()).project(S.camera); a[name] = [Number((v.x * 0.5 + 0.5).toFixed(4)), Number((-v.y * 0.5 + 0.5).toFixed(4)), v.z < 1 ? 1 : 0]; } return a; }
window.studio = { frames: S.frames, setFrame, anchorsAt, W, H };
setFrame(Number(q.get('f') ?? 0));
