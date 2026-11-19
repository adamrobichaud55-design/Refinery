// Scene3D: one 3D scene of a home, shown three ways: a scroll-driven tour, frames for a video, and a free look around
// (on a screen or in a headset).
//
// The scene comes from ../../tools/scene/build_scene.py: a solid model of the home fused from a phone scan (mesh.glb),
// a few hundred of the scan's sharpest photographs with the exact place each was taken, and a planned walking route.
// Here the photographs are projected onto the model, as slide projectors standing where the camera stood: from
// wherever the visitor looks, the nearest few projectors light the surfaces in view, each only where it really saw
// them (a projector does not shine through a sofa onto the wall behind). So the picture has the photographs' detail
// and the model's solidity, and holds together from any angle.
//
//   Scene3D({ canvas, section, base: 'scene/', scene: <scene.json>, onUpdate, onLoad, still, explore })
//   returns { total, chapters, render(f), pose(s), view, explore: { ... } }
import * as THREE from 'three';

const clamp01 = v => Math.min(1, Math.max(0, v));
const K = 6;                               // how many photographs are projected at once: four facing the way the visitor looks ...
const LOW = 2;                             // ... and, among the six, two that look down at the floor in front, which the others miss
const FAR = 40;                            // the furthest distance a projector's view is measured to, in metres
const TURN = 1.2;                          // how much walking one radian of turning counts for, when scoring photographs

/** the triangles, positions and colours out of the .glb file the builder writes */
function readGlb(buf) {
  const dv = new DataView(buf), jl = dv.getUint32(12, true), gl = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl))), bin = 20 + jl + 8;
  const view = (i, T, per) => { const a = gl.accessors[i], v = gl.bufferViews[a.bufferView]; return new T(buf.slice(bin + (v.byteOffset || 0), bin + (v.byteOffset || 0) + v.byteLength), 0, a.count * per); };
  const p = gl.meshes[0].primitives[0], g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(view(p.attributes.POSITION, Float32Array, 3), 3)); g.setAttribute('tint', new THREE.BufferAttribute(view(p.attributes.COLOR_0, Uint8Array, 4), 4, true)); g.setIndex(new THREE.BufferAttribute(view(p.indices, Uint32Array, 1), 1));
  return g;
}

window.Scene3D = function (opt) {
  const canvas = opt.canvas, S = opt.scene, base = opt.base || 'scene/', coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.setClearColor(opt.bg || '#d9dde0', 1);
  const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 80), rig = new THREE.Group(), world = new THREE.Scene(); rig.add(camera); world.add(rig);
  let W = 1, H = 1, mesh = null, dead = false;

  // ---- the projectors: each photograph, where it was taken ----
  const keys = S.keys.map((d, i) => {
    const r = d.r, pos = new THREE.Vector3(...d.p), toCam = new THREE.Matrix4().set(r[0], r[1], r[2], 0, r[3], r[4], r[5], 0, r[6], r[7], r[8], 0, 0, 0, 0, 1).multiply(new THREE.Matrix4().makeTranslation(-pos.x, -pos.y, -pos.z));
    return { d, i, pos, dir: new THREE.Vector3(r[6], r[7], r[8]), toCam, lens: new THREE.Vector4(d.f[0], d.f[1], d.c[0], d.c[1]), gain: new THREE.Vector3(...(d.g || [1, 1, 1])), state: '', tex: null, depth: null, used: 0 };
  });
  const block = k => `{ vec4 c = cam${k} * vec4(vW, 1.0);
      if (wt${k} > 0.0 && c.z > 0.12) { vec2 uv = vec2(lens${k}.x * c.x / c.z + lens${k}.z, lens${k}.y * c.y / c.z + lens${k}.w);
        if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
          float seen = unpack(texture2D(dep${k}, vec2(uv.x, 1.0 - uv.y))) * ${FAR.toFixed(1)}, vis = 1.0 - smoothstep(0.03 + 0.02 * c.z, 0.08 + 0.05 * c.z, c.z - seen);      // only what this photograph really saw
          vec2 e = min(uv, 1.0 - uv); float edge = smoothstep(0.0, 0.08, min(e.x, e.y)), ang = pow(max(dot(toEye, normalize(pos${k} - vW)), 0.0), 8.0);
          float w = wt${k} * vis * edge * (0.03 + ang); w *= w; acc += texture2D(tex${k}, uv).rgb * gain${k} * w; tot += w; } } }`;
  const ids = [...Array(K).keys()], uniforms = { eye: { value: new THREE.Vector3() } };
  for (const k of ids) Object.assign(uniforms, { ['tex' + k]: { value: null }, ['dep' + k]: { value: null }, ['cam' + k]: { value: new THREE.Matrix4() }, ['lens' + k]: { value: new THREE.Vector4() }, ['pos' + k]: { value: new THREE.Vector3() }, ['gain' + k]: { value: new THREE.Vector3(1, 1, 1) }, ['wt' + k]: { value: 0 } });
  const material = new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms,
    vertexShader: 'attribute vec4 tint; varying vec3 vW; varying vec3 vTint; void main(){ vW = position; vTint = tint.rgb; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 eye; varying vec3 vW; varying vec3 vTint;
      ${ids.map(k => `uniform sampler2D tex${k}, dep${k}; uniform mat4 cam${k}; uniform vec4 lens${k}; uniform vec3 pos${k}, gain${k}; uniform float wt${k};`).join('\n')}
      float unpack(vec4 c){ return dot(c, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0)); }
      void main(){ vec3 acc = vec3(0.0), toEye = normalize(eye - vW); float tot = 0.0;
        ${ids.map(block).join('\n')}
        gl_FragColor = vec4(mix(vTint, acc / max(tot, 1e-6), smoothstep(0.0, 0.0004, tot)), 1.0); }` });   // where no photograph reaches, the model's own (softer) colour
  // how far each projector sees, in every direction of its picture: the model drawn from where it stood
  const depthMat = new THREE.ShaderMaterial({ side: THREE.DoubleSide, vertexShader: 'varying float z; void main(){ vec4 v = viewMatrix * vec4(position, 1.0); z = -v.z; gl_Position = projectionMatrix * v; }',
    fragmentShader: `varying float z; vec4 pack(float v){ vec4 e = fract(v * vec4(1.0, 255.0, 65025.0, 16581375.0)); return e - e.yzww * vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0); } void main(){ gl_FragColor = pack(clamp(z / ${FAR.toFixed(1)}, 0.0, 0.9999)); }` });
  const dcam = new THREE.PerspectiveCamera(); dcam.matrixAutoUpdate = false; dcam.matrixWorldAutoUpdate = false;
  function see(Kf) {
    const d = Kf.d, r = d.r, n = 0.05, rt = new THREE.WebGLRenderTarget(384, Math.round(384 * d.h / d.w), { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    dcam.matrixWorld.set(r[0], -r[3], -r[6], Kf.pos.x, r[1], -r[4], -r[7], Kf.pos.y, r[2], -r[5], -r[8], Kf.pos.z, 0, 0, 0, 1); dcam.matrixWorldInverse.copy(dcam.matrixWorld).invert();
    dcam.projectionMatrix.makePerspective((-d.c[0] / d.f[0]) * n, ((1 - d.c[0]) / d.f[0]) * n, (d.c[1] / d.f[1]) * n, (-(1 - d.c[1]) / d.f[1]) * n, n, FAR); dcam.projectionMatrixInverse.copy(dcam.projectionMatrix).invert();
    const xr = renderer.xr.enabled, target = renderer.getRenderTarget(); renderer.xr.enabled = false; world.overrideMaterial = depthMat; renderer.setRenderTarget(rt); renderer.setClearColor(0xffffff, 1); renderer.clear(); renderer.render(world, dcam);
    world.overrideMaterial = null; renderer.setRenderTarget(target); renderer.setClearColor(opt.bg || '#d9dde0', 1); renderer.xr.enabled = xr; return rt;
  }
  // the photographs travel sixteen to a file: a file is fetched once and each picture cut out of it
  const packs = new Map();
  const pack = url => { if (!packs.has(url)) { packs.set(url, fetch(url).then(r => { if (!r.ok) throw new Error(url + ' ' + r.status); return r.arrayBuffer(); })); packs.get(url).catch(() => packs.delete(url)); if (packs.size > 10) packs.delete(packs.keys().next().value); } return packs.get(url); };
  async function load(Kf) {
    if (Kf.state) return; Kf.state = 'loading';
    try {
      const buf = await pack(base + Kf.d.pack), url = URL.createObjectURL(new Blob([buf.slice(Kf.d.at[0], Kf.d.at[0] + Kf.d.at[1])], { type: 'image/webp' }));
      const img = await new Promise((ok, no) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = no; i.src = url; }); URL.revokeObjectURL(url);
      if (Kf.state !== 'loading' || !mesh) { Kf.state = ''; return; }
      const tex = new THREE.Texture(img); tex.flipY = false; tex.colorSpace = THREE.NoColorSpace; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4; tex.needsUpdate = true;
      Kf.tex = tex; Kf.depth = see(Kf); Kf.state = 'ready';
    } catch (e) { Kf.state = ''; console.error('Scene3D: could not load a photograph', e); }
  }
  function drop(Kf) { if (Kf.state === 'ready') { Kf.tex.dispose(); Kf.depth.dispose(); Kf.tex = Kf.depth = null; } Kf.state = ''; }
  let clock = 0;
  /** the photographs nearest a viewpoint: by how far away each was taken and how differently it faces. Their weights
   *  fall to nothing at the first one left out, so the set changes without a jump as the visitor moves. */
  function choose(p, dir, many, skip) {
    const list = keys.filter(Kf => !skip || !skip.has(Kf)).map(Kf => [Kf.pos.distanceTo(p) + TURN * Math.acos(Math.min(1, Math.max(-1, Kf.dir.dot(dir)))), Kf]).sort((a, b) => a[0] - b[0]), cut = list[Math.min(many, list.length - 1)][0];
    return list.slice(0, many).map(([s, Kf]) => ({ Kf, w: list.length > many ? Math.max(0, 1 - s / cut) : 1 }));
  }
  const fwd = new THREE.Vector3(), eyeP = new THREE.Vector3(), lowDir = new THREE.Vector3();
  /** draw the scene from the camera as it stands; false if (when strict) a photograph it needs has not arrived */
  function draw(strict) {
    if (!mesh) return false;
    const cam = renderer.xr.isPresenting ? renderer.xr.getCamera() : camera; camera.updateMatrixWorld(); cam.getWorldPosition(eyeP); cam.getWorldDirection(fwd);
    const pick = choose(eyeP, fwd, K - LOW); pick.push(...choose(eyeP, lowDir.set(fwd.x * 0.74, fwd.y * 0.74 - 0.67, fwd.z * 0.74).normalize(), LOW, new Set(pick.map(e => e.Kf)))); clock++;
    for (const { Kf } of pick) { Kf.used = clock; load(Kf); }
    if (strict && pick.some(({ Kf }) => Kf.state !== 'ready')) return false;
    const ready = keys.filter(Kf => Kf.state === 'ready'); if (ready.length > 28) for (const Kf of ready.sort((a, b) => a.used - b.used).slice(0, ready.length - 28)) drop(Kf);
    uniforms.eye.value.copy(eyeP);
    pick.forEach(({ Kf, w }, k) => { const on = Kf.state === 'ready'; uniforms['wt' + k].value = on ? Math.max(w, 0.0001) : 0; if (on) { uniforms['tex' + k].value = Kf.tex; uniforms['dep' + k].value = Kf.depth.texture; uniforms['cam' + k].value.copy(Kf.toCam); uniforms['lens' + k].value.copy(Kf.lens); uniforms['pos' + k].value.copy(Kf.pos); uniforms['gain' + k].value.copy(Kf.gain); } });
    for (let k = pick.length; k < K; k++) uniforms['wt' + k].value = 0;
    renderer.render(world, camera); return true;
  }

  // ---- the walking route ----
  const P = S.path.map(c => new THREE.Vector3(...c.p)), D = S.path.map(c => new THREE.Vector3(...c.d).normalize()), n = P.length, STEP = n > 1 ? P[1].distanceTo(P[0]) || 0.1 : 0.1, total = (n - 1) * STEP;
  const fr = s => (s / total) * 239, chapters = (S.chapters || []).map(c => ({ room: 0, label: c.label, from: fr(c.from * STEP), to: fr(c.to * STEP) }));
  const look = new THREE.Matrix4(), UP = new THREE.Vector3(0, 1, 0), tmp = new THREE.Vector3();
  /** the camera a distance s along the route: averaged over a short stretch, so that pace and turning never change abruptly */
  function pose(s) {
    const p = new THREE.Vector3(), d = new THREE.Vector3(); let ws = 0;
    for (let i = -4; i <= 4; i++) { const x = Math.min(total, Math.max(0, s + i * 0.09)) / STEP, k = Math.min(n - 2, Math.floor(x)), u = x - k, w = Math.exp(-(i * i) / 6); p.addScaledVector(tmp.copy(P[k]).lerp(P[k + 1], u), w); d.addScaledVector(tmp.copy(D[k]).lerp(D[k + 1], u), w); ws += w; }
    p.multiplyScalar(1 / ws); d.normalize(); return { p, q: new THREE.Quaternion().setFromRotationMatrix(look.lookAt(p, tmp.copy(p).add(d), UP)) };
  }
  const place = s => { const c = pose(s); rig.position.set(0, 0, 0); rig.quaternion.identity(); camera.position.copy(c.p); camera.quaternion.copy(c.q); };

  function size() {
    const r = canvas.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); if (renderer.xr.isPresenting) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2)); renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.fov = W < H ? 78 : 60; camera.updateProjectionMatrix();     // a tall screen sees more up and down, a wide one more to the sides: both take in a room
  }
  // ---- scrolling drives the walk ----
  let cur = 0, first = true, shown = true, lastT = 0, mode = opt.explore ? 'explore' : 'tour';
  const progress = () => { if (!opt.section) return 0; const r = opt.section.getBoundingClientRect(), span = r.height - innerHeight; return span > 0 ? clamp01(-r.top / span) : 0; };
  const free = { yaw: 0, pitch: 0, pos: new THREE.Vector3(), goal: null, keys: new Set(), auto: false };
  function frame(now) {
    if (dead) return; const dt = Math.min(0.1, (now - lastT) / 1000 || 0.016); lastT = now;
    if (!shown && !first && !renderer.xr.isPresenting) return;
    if (mode === 'tour') { const p = progress(), goal = p * total; cur = first ? goal : Math.abs(goal - cur) < 0.0004 ? goal : cur + (goal - cur) * Math.min(1, dt * 5); place(cur); }
    else roam(dt);
    if (draw(false) && first && keys.some(Kf => Kf.state === 'ready')) { first = false; opt.onLoad && opt.onLoad(1); }
    if (mode === 'tour') opt.onUpdate && opt.onUpdate({ frame: fr(cur), room: 0, rush: 0, chapters, progress: progress(), portrait: W < H, width: W, height: H });
  }

  // ---- looking around freely: drag to look, tap or click a spot to walk to it, arrow keys or WASD to walk; in a headset, the thumbsticks ----
  const ray = new THREE.Raycaster(), eyeH = S.eye || 1.45;
  function roam(dt) {
    const xr = renderer.xr.isPresenting;
    if (free.auto) { cur = (cur + dt * 0.9) % total; const c = pose(cur); free.pos.copy(c.p); const e = new THREE.Euler().setFromQuaternion(c.q, 'YXZ'); free.yaw = e.y; free.pitch = e.x; }
    else {
      const f = new THREE.Vector3(-Math.sin(free.yaw), 0, -Math.cos(free.yaw)), r = new THREE.Vector3(Math.cos(free.yaw), 0, -Math.sin(free.yaw)), move = new THREE.Vector3(); let turn = 0;
      if (free.keys.has('w') || free.keys.has('arrowup')) move.add(f); if (free.keys.has('s') || free.keys.has('arrowdown')) move.sub(f); if (free.keys.has('d')) move.add(r); if (free.keys.has('a')) move.sub(r);
      if (free.keys.has('arrowleft')) turn += 1; if (free.keys.has('arrowright')) turn -= 1;
      if (xr) for (const src of renderer.xr.getSession().inputSources) { const g = src.gamepad; if (!g || g.axes.length < 4) continue; const x = g.axes[2], y = g.axes[3];
        if (src.handedness === 'left') { const hd = new THREE.Vector3(); renderer.xr.getCamera().getWorldDirection(hd); hd.y = 0; hd.normalize(); move.addScaledVector(hd, -y).addScaledVector(new THREE.Vector3(-hd.z, 0, hd.x), x); } else if (Math.abs(x) > 0.5) turn -= x; }
      free.yaw += turn * dt * 1.6;
      if (move.lengthSq() > 0.01) { free.goal = null; move.normalize(); ray.set(free.pos, move); ray.far = 0.4; if (!mesh || !ray.intersectObject(mesh).length) free.pos.addScaledVector(move, dt * 1.3); }       // not through walls
      if (free.goal) { const to = tmp.copy(free.goal).sub(free.pos); to.y = 0; const d = to.length(); if (d < 0.05) free.goal = null; else free.pos.addScaledVector(to.normalize(), Math.min(d, dt * 1.6)); }
    }
    if (xr) { rig.position.set(free.pos.x, 0, free.pos.z); rig.rotation.set(0, free.yaw, 0); }          // in a headset the visitor's own floor is the home's floor, and their head does the looking
    else { rig.position.set(0, 0, 0); rig.quaternion.identity(); camera.position.set(free.pos.x, eyeH, free.pos.z); camera.rotation.set(free.pitch, free.yaw, 0, 'YXZ'); }
  }
  function goTo(x, y) {                                                // walk to the spot under a tap: onto the floor there, or up to whatever stands in the way
    if (!mesh) return; ray.setFromCamera(new THREE.Vector2((x / W) * 2 - 1, -(y / H) * 2 + 1), camera); ray.far = 30; const hit = ray.intersectObject(mesh)[0]; if (!hit) return;
    const g = hit.point.clone(); if (hit.point.y > 0.5) g.addScaledVector(ray.ray.direction, -0.7); g.y = eyeH; free.goal = g; free.auto = false;
  }
  if (opt.explore) {
    let down = null, moved = 0;
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; moved = 0; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - down[0], dy = e.clientY - down[1]; moved += Math.abs(dx) + Math.abs(dy); down = [e.clientX, e.clientY]; free.auto = false; free.yaw += dx * 0.0045; free.pitch = Math.max(-1.2, Math.min(1.2, free.pitch + dy * 0.0045)); });
    canvas.addEventListener('pointerup', e => { if (down && moved < 8) { const r = canvas.getBoundingClientRect(); goTo(e.clientX - r.left, e.clientY - r.top); } down = null; });
    addEventListener('keydown', e => { free.keys.add(e.key.toLowerCase()); free.auto = false; }); addEventListener('keyup', e => free.keys.delete(e.key.toLowerCase()));
  }
  const start = s => { cur = s; const c = pose(s); free.pos.copy(c.p); const e = new THREE.Euler().setFromQuaternion(c.q, 'YXZ'); free.yaw = e.y; free.pitch = e.x; };

  if (window.IntersectionObserver) new IntersectionObserver(e => { shown = e[0].isIntersecting; }).observe(canvas);
  let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(size, 120); });
  size(); start(0);
  // (a host that serves only web file types can be given the model wrapped in a .json file instead: { "glb": "<base64>" })
  const ready = fetch(base + S.mesh).then(r => { if (!r.ok) throw new Error(S.mesh + ' ' + r.status); return S.mesh.endsWith('.json') ? r.json().then(j => Uint8Array.from(atob(j.glb), c => c.charCodeAt(0)).buffer) : r.arrayBuffer(); }).then(buf => { mesh = new THREE.Mesh(readGlb(buf), material); mesh.frustumCulled = false; mesh.geometry.computeBoundingSphere(); world.add(mesh); if (!opt.still) renderer.setAnimationLoop(frame); });
  ready.catch(e => console.error('Scene3D: could not load the model', e));

  return { total, chapters, spans: [[0, 239]], ready, view: { camera, renderer }, pose,
    destroy() { dead = true; renderer.setAnimationLoop(null); },
    /** draw one point of the tour (frame 0 to 239), for stills and videos; resolves when the photographs it needs are in */
    async render(f) { await ready; renderer.setAnimationLoop(null); place((f / 239) * total); for (let k = 0; k < 1500; k++) { if (draw(true)) return true; await new Promise(r => setTimeout(r, 30)); } return false; },
    explore: {
      /** start (or stop) drifting along the planned route */
      tour(on) { free.auto = on; },
      /** put the scene in a headset, where the browser offers one; resolves to false where it does not */
      async vr() {
        if (!navigator.xr || !(await navigator.xr.isSessionSupported('immersive-vr').catch(() => false))) return false;
        const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] }); renderer.xr.enabled = true; renderer.xr.setReferenceSpaceType('local-floor'); await renderer.xr.setSession(session);
        session.addEventListener('end', () => { renderer.xr.enabled = false; size(); }); return true;
      },
      async vrOffered() { return !!navigator.xr && !!(await navigator.xr.isSessionSupported('immersive-vr').catch(() => false)); },
    } };
};
