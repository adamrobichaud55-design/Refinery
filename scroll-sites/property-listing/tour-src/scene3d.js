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
const PACE = 1.2;                          // how much walking one radian of turning counts for, when pacing the walk

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
  let W = 1, H = 1, mesh = null, dead = false, detail = 1;

  // ---- the projectors: each photograph, where it was taken ----
  const keys = S.keys.map((d, i) => {
    const r = d.r, pos = new THREE.Vector3(...d.p), toCam = new THREE.Matrix4().set(r[0], r[1], r[2], 0, r[3], r[4], r[5], 0, r[6], r[7], r[8], 0, 0, 0, 0, 1).multiply(new THREE.Matrix4().makeTranslation(-pos.x, -pos.y, -pos.z));
    return { d, i, pos, dir: new THREE.Vector3(r[6], r[7], r[8]), toCam, lens: new THREE.Vector4(d.f[0], d.f[1], d.c[0], d.c[1]), gain: new THREE.Vector3(...(d.g || [1, 1, 1])), state: '', tex: null, depth: null, used: 0 };
  });
  const block = k => `{ vec4 c = cam${k} * vec4(vW, 1.0);
      if (wt${k} > 0.0 && c.z > 0.12) { vec2 uv = vec2(lens${k}.x * c.x / c.z + lens${k}.z, lens${k}.y * c.y / c.z + lens${k}.w);
        if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
          float seen = unpack(texture2D(dep${k}, vec2(uv.x, 1.0 - uv.y))) * ${FAR.toFixed(1)}, vis = 1.0 - smoothstep(0.03 + 0.02 * c.z, 0.08 + 0.05 * c.z, c.z - seen);      // only what this photograph really saw
          vec2 e = min(uv, 1.0 - uv); vec3 toP = pos${k} - vW; float far = length(toP), square = abs(dot(nrm, toP / far)), edge = smoothstep(0.0, 0.08, min(e.x, e.y)), ang = max(dot(toEye, toP / far), 0.0);
          vec2 d1 = vec2(uv.x, 1.0 - uv.y) + vec2(0.004, 0.005), d2 = vec2(uv.x, 1.0 - uv.y) - vec2(0.004, 0.005);
          float rough = max(abs(unpack(texture2D(dep${k}, d1)) * ${FAR.toFixed(1)} - seen), abs(unpack(texture2D(dep${k}, d2)) * ${FAR.toFixed(1)} - seen)), calm = 1.0 - smoothstep(0.06 + 0.03 * c.z, 0.3 + 0.12 * c.z, rough);     // a photograph is trusted less right at the edge of an object, where a small error would paint it onto what is behind
          // Each surface takes its colour mostly from the photograph that saw it best: squarely and from close by. That choice
          // belongs to the surface, so it stays put as the visitor moves and the picture does not swim; where the visitor
          // stands only tips the balance a little, and brings photographs in and out of use gently.
          float w = smoothstep(0.0, 0.3, wt${k}) * vis * edge * (0.12 + 0.88 * calm) * (0.05 + square * square) / (0.4 + 0.3 * far * far) * (0.45 + 0.55 * ang * ang); r${k} = w; c${k} = texture2D(tex${k}, uv).rgb * gain${k}; } } }`;
  const ids = [...Array(K).keys()], uniforms = { eye: { value: new THREE.Vector3() }, cut: { value: 99 }, plain: { value: 0 }, shell: { value: 0 } };
  for (const k of ids) Object.assign(uniforms, { ['tex' + k]: { value: null }, ['dep' + k]: { value: null }, ['cam' + k]: { value: new THREE.Matrix4() }, ['lens' + k]: { value: new THREE.Vector4() }, ['pos' + k]: { value: new THREE.Vector3() }, ['gain' + k]: { value: new THREE.Vector3(1, 1, 1) }, ['wt' + k]: { value: 0 } });
  const material = new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms,
    vertexShader: 'attribute vec4 tint; varying vec3 vW; varying vec3 vTint; void main(){ vW = position; vTint = tint.rgb; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 eye; uniform float cut, plain, shell; varying vec3 vW; varying vec3 vTint;
      ${ids.map(k => `uniform sampler2D tex${k}, dep${k}; uniform mat4 cam${k}; uniform vec4 lens${k}; uniform vec3 pos${k}, gain${k}; uniform float wt${k};`).join('\n')}
      float unpack(vec4 c){ return dot(c, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0)); }
      void main(){ if (vW.y > cut) discard;                               // the cutaway: nothing above this height is drawn, so the home can be seen from above
        vec3 acc = vec3(0.0), toEye = normalize(eye - vW), nrm = normalize(cross(dFdx(vW), dFdy(vW))); float tot = 0.0, top = 0.0;
        ${ids.map(k => `vec3 c${k} = vec3(0.0); float r${k} = 0.0;`).join(' ')}
        ${ids.map(block).join('\n')}
        ${ids.map(k => `top = max(top, r${k});`).join(' ')}
        float doubt = 0.0;
        if (top > 0.0) { ${ids.map(k => `{ float w = r${k} / top; w = w * w; acc += c${k} * w; tot += w; }`).join(' ')}      // the best photograph for this surface leads; the others soften its edges
          vec3 mean = acc / tot; float sum = 0.0; ${ids.map(k => `{ float w = r${k} / top; vec3 d = c${k} - mean; doubt += w * dot(d, d); sum += w; }`).join(' ')} doubt = sqrt(doubt / max(sum, 1e-4)); }
        // Where the photographs flatly contradict each other about a surface, the model is wrong there (a thin door, a chair
        // leg, a plant): sharp detail would be sharp nonsense, so the picture falls back toward the model's own soft colour.
        vec3 col = mix(vTint, acc / max(tot, 1e-6), step(0.5, tot) * (1.0 - plain) * (1.0 - 0.9 * smoothstep(0.16, 0.34, doubt)));
        if (!gl_FrontFacing) col = mix(col, vec3(0.83, 0.82, 0.8) * (0.72 + 0.28 * clamp(vW.y / 2.0, 0.0, 1.0)), shell);        // seen from outside, the walls are a plain shell
        gl_FragColor = vec4(col, 1.0); }` });   // where no photograph reaches, the model's own (softer) colour
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
      Kf.img = img; arrived.push(Kf);
    } catch (e) { Kf.state = ''; console.error('Scene3D: could not load a photograph', e); }
  }
  // A photograph that has arrived waits its turn: one is made ready each frame (its picture handed to the graphics chip,
  // and what it can see worked out), so that several arriving together never make the walk hitch. It then fades in.
  const arrived = [];
  function admit(all) {
    while (arrived.length) {
      const Kf = arrived.shift(); if (Kf.state !== 'loading') continue;
      const tex = new THREE.Texture(Kf.img); tex.flipY = false; tex.colorSpace = THREE.NoColorSpace; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4; tex.needsUpdate = true;
      Kf.tex = tex; Kf.img = null; Kf.depth = see(Kf); Kf.state = 'ready'; Kf.born = all ? -1e9 : performance.now();
      if (!all) break;
    }
  }
  function drop(Kf) { if (Kf.state === 'ready') { Kf.tex.dispose(); Kf.depth.dispose(); Kf.tex = Kf.depth = null; } Kf.img = null; Kf.state = ''; }
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
    admit(strict);
    const pick = choose(eyeP, fwd, K - LOW); pick.push(...choose(eyeP, lowDir.set(fwd.x * 0.74, fwd.y * 0.74 - 0.67, fwd.z * 0.74).normalize(), LOW, new Set(pick.map(e => e.Kf)))); clock++;
    for (const { Kf } of pick) { Kf.used = clock; load(Kf); }
    if (strict && overNow < 0.999 && pick.some(({ Kf }) => Kf.state !== 'ready')) return false;
    const ready = keys.filter(Kf => Kf.state === 'ready'); if (ready.length > 28) for (const Kf of ready.sort((a, b) => a.used - b.used).slice(0, ready.length - 28)) drop(Kf);
    uniforms.eye.value.copy(eyeP);
    const nowT = performance.now();
    pick.forEach(({ Kf, w }, k) => { const on = Kf.state === 'ready' && overNow < 0.999; uniforms['wt' + k].value = on ? Math.max(w, 0.0001) * clamp01((nowT - Kf.born) / 350) : 0; if (on) { uniforms['tex' + k].value = Kf.tex; uniforms['dep' + k].value = Kf.depth.texture; uniforms['cam' + k].value.copy(Kf.toCam); uniforms['lens' + k].value.copy(Kf.lens); uniforms['pos' + k].value.copy(Kf.pos); uniforms['gain' + k].value.copy(Kf.gain); } });
    for (let k = pick.length; k < K; k++) uniforms['wt' + k].value = 0;
    renderer.render(world, camera); return true;
  }

  // ---- the walking route ----
  const P = S.path.map(c => new THREE.Vector3(...c.p)), D = S.path.map(c => new THREE.Vector3(...c.d).normalize()), n = P.length, STEP = n > 1 ? P[1].distanceTo(P[0]) || 0.1 : 0.1;
  // The walk is paced by what the visitor sees move, not only by distance: turning the head counts as walking does
  // (a quarter turn takes as long as about two metres), so the view never whips round.
  const cum = [0]; for (let k = 1; k < n; k++) cum.push(cum[k - 1] + P[k].distanceTo(P[k - 1]) + PACE * D[k].angleTo(D[k - 1]));
  const total = cum[n - 1];
  const INTRO_ = opt.intro === false || opt.explore ? 0 : 7, fr = s => (s / (total + INTRO_)) * 239, chapters = (S.chapters || []).map(c => ({ room: 0, label: c.label, from: fr(INTRO_ + cum[Math.min(n - 1, c.from)]), to: fr(INTRO_ + cum[Math.min(n - 1, c.to)]) }));
  const look = new THREE.Matrix4(), UP = new THREE.Vector3(0, 1, 0), tmp = new THREE.Vector3();
  /** the camera a distance s along the route: averaged over a short stretch, so that pace and turning never change abruptly */
  function pose(s) {
    const p = new THREE.Vector3(), d = new THREE.Vector3(); let ws = 0, k = 0;
    for (let i = -6; i <= 6; i++) { const x = Math.min(total, Math.max(0, s + i * 0.11)); while (k < n - 2 && cum[k + 1] < x) k++; while (k > 0 && cum[k] > x) k--; const u = clamp01((x - cum[k]) / Math.max(1e-6, cum[k + 1] - cum[k])), w = Math.exp(-(i * i) / 12); p.addScaledVector(tmp.copy(P[k]).lerp(P[k + 1], u), w); d.addScaledVector(tmp.copy(D[k]).lerp(D[k + 1], u), w); ws += w; }
    p.multiplyScalar(1 / ws); d.normalize(); return { p, q: new THREE.Quaternion().setFromRotationMatrix(look.lookAt(p, tmp.copy(p).add(d), UP)) };
  }
  // ---- the overview: the whole home from above with its ceiling off, and the way down into it ----
  const size3 = S.size || [10, 3, 10], mid = new THREE.Vector3(), bgIn = new THREE.Color(opt.bg || '#d9dde0'), bgOut = new THREE.Color(opt.bgOver || '#010205'), bgNow = new THREE.Color();
  const yaw0 = (size3[2] >= size3[0] ? 0 : Math.PI / 2), orbit = { yaw: yaw0, tilt: 1.0, zoom: 1 };       // seen along its length on a tall screen, across it on a wide one
  /** the overview camera: far enough back, for this screen and this angle, to take in the whole home */
  let shape = new Float32Array([-5, 0, -5, 5, 0, -5, -5, 0, 5, 5, 0, 5]); const box = new THREE.Box3(new THREE.Vector3(-5, 0, -5), new THREE.Vector3(5, 2, 5)), corner = new THREE.Vector3(), cx = new THREE.Vector3(), cy = new THREE.Vector3(), cz = new THREE.Vector3();
  function overCam() {
    const off = new THREE.Vector3(Math.cos(orbit.tilt) * Math.sin(orbit.yaw), Math.sin(orbit.tilt), Math.cos(orbit.tilt) * Math.cos(orbit.yaw)), aim = tmp.set(mid.x, 0.9, mid.z).clone();
    const q = new THREE.Quaternion().setFromRotationMatrix(look.lookAt(off, new THREE.Vector3(), UP)); look.extractBasis(cx, cy, cz);
    const tv = Math.tan((camera.fov * Math.PI) / 360) * 0.84, th = tv * camera.aspect; let need = 1;                       // the home fills most of the screen, with a margin
    for (let i = 0; i < shape.length; i += 3) { corner.set(shape[i], shape[i + 1], shape[i + 2]).sub(aim); const x = Math.abs(corner.dot(cx)), y = Math.abs(corner.dot(cy)), z = corner.dot(cz); need = Math.max(need, x / th + z, y / tv + z); }       // every part of the home, as it really is (an L-shaped home is not treated as its bounding box)
    return { p: aim.addScaledVector(off, need * orbit.zoom), q };
  }
  /** the camera for a blend between standing inside (over = 0) and the overview (over = 1): from the overview it comes
   *  in over the spot, looking down on it, then drops through where the ceiling was and lifts its eyes to the room */
  const sm = v => v * v * (3 - 2 * v), qDown = new THREE.Quaternion(), eDown = new THREE.Euler(), eOf = new THREE.Euler();
  function blend(inside, over) {
    const o = overCam(), t = 1 - over, tA = sm(clamp01(t / 0.62)), tB = sm(clamp01((t - 0.62) / 0.38)), yawIn = eOf.setFromQuaternion(inside.q, 'YXZ').y;
    qDown.setFromEuler(eDown.set(-1.32, yawIn, 0, 'YXZ'));
    camera.position.copy(o.p).lerp(tmp.set(inside.p.x, 4.4, inside.p.z), tA).lerp(inside.p, tB); camera.quaternion.copy(o.q).slerp(qDown, tA).slerp(inside.q, tB);
    rig.position.set(0, 0, 0); rig.quaternion.identity();
    const out = clamp01((camera.position.y - 1.9) / 0.6);                // the ceiling comes off as the camera rises through it
    uniforms.cut.value = out > 0 ? 2.05 + (1 - out) * 3 : 99; uniforms.plain.value = clamp01((camera.position.y - 2.4) / 1.6); uniforms.shell.value = out; overNow = uniforms.plain.value;
    renderer.setClearColor(bgNow.copy(bgIn).lerp(bgOut, out), 1);
  }
  let overNow = 0;
  const INTRO = opt.intro === false || opt.explore ? 0 : 7, whole = total + INTRO;       // the scroll tour opens on the overview, turning, and then goes in
  const place = s => { if (INTRO && s < INTRO) { const u = s / INTRO; orbit.yaw = yaw0 + (W < H ? 0 : Math.PI / 2) - 0.3 + u * 0.6; blend(pose(0), 1 - clamp01((u - 0.4) / 0.6)); } else { const c = pose(s - INTRO); if (INTRO) blend(c, 0); else { rig.position.set(0, 0, 0); rig.quaternion.identity(); camera.position.copy(c.p); camera.quaternion.copy(c.q); } } };

  function size() {
    const r = canvas.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); if (renderer.xr.isPresenting) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2) * detail); renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.fov = W < H ? 78 : 60; camera.updateProjectionMatrix();     // a tall screen sees more up and down, a wide one more to the sides: both take in a room
  }
  // ---- scrolling drives the walk ----
  let cur = 0, first = true, shown = true, lastT = 0, mode = opt.explore ? 'explore' : 'tour', tick = 0, pace = 16, calm = 0, sized = 0;
  const progress = () => { if (!opt.section) return 0; const r = opt.section.getBoundingClientRect(), span = r.height - innerHeight; return span > 0 ? clamp01(-r.top / span) : 0; };
  const free = { yaw: 0, pitch: 0, pos: new THREE.Vector3(), goal: null, keys: new Set(), auto: false, over: 0, overGoal: 0 };
  function frame(now) {
    if (dead) return; const dt = Math.min(0.1, (now - lastT) / 1000 || 0.016); lastT = now;
    if (!shown && !first && !renderer.xr.isPresenting) return;
    if (mode === 'tour') { const p = progress(), goal = p * whole; cur = first ? goal : Math.abs(goal - cur) < 0.0004 ? goal : cur + (goal - cur) * Math.min(1, dt * 5); place(cur); }
    else roam(dt);
    if (draw(false) && first && keys.some(Kf => Kf.state === 'ready')) { first = false; opt.onLoad && opt.onLoad(1); }
    if (mode === 'tour' && cur >= INTRO * 0.4 && (tick++ & 7) === 0) { const a = pose(Math.min(total, Math.max(0, cur - INTRO) + 1.6)), d = tmp2.set(0, 0, -1).applyQuaternion(a.q); for (const { Kf } of choose(a.p, d, K - LOW)) load(Kf); }      // the photographs for a few steps ahead are fetched before they are needed
    // The picture is drawn with as many pixels as this device can turn out smoothly: fewer if frames are coming slowly, more again if there is time to spare.
    pace += (dt * 1000 - pace) * 0.08; calm = dt < 0.022 ? calm + dt : 0;
    if (!renderer.xr.isPresenting && now - sized > 1200) { if (pace > 25 && detail > 0.5) { detail = Math.max(0.5, detail * 0.85); sized = now; size(); } else if (calm > 4 && detail < 1) { detail = Math.min(1, detail * 1.12); sized = now; calm = 0; size(); } }
    if (mode === 'tour') opt.onUpdate && opt.onUpdate({ frame: fr(cur), room: 0, rush: 0, chapters, progress: progress(), portrait: W < H, width: W, height: H });
  }

  // ---- looking around freely: drag to look, tap or click a spot to walk to it, arrow keys or WASD to walk; in a headset, the thumbsticks ----
  const ray = new THREE.Raycaster(), eyeH = S.eye || 1.45, tmp2 = new THREE.Vector3(), qIn = new THREE.Quaternion(), eIn = new THREE.Euler();
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
    free.over += Math.sign(free.overGoal - free.over) * Math.min(Math.abs(free.overGoal - free.over), dt / 1.3);
    if (xr) { rig.position.set(free.pos.x, 0, free.pos.z); rig.rotation.set(0, free.yaw, 0); }          // in a headset the visitor's own floor is the home's floor, and their head does the looking
    else blend({ p: tmp2.set(free.pos.x, eyeH, free.pos.z), q: qIn.setFromEuler(eIn.set(free.pitch, free.yaw, 0, 'YXZ')) }, free.over);
  }
  function goTo(x, y) {                                                // walk to the spot under a tap: onto the floor there, or up to whatever stands in the way
    if (!mesh) return; ray.setFromCamera(new THREE.Vector2((x / W) * 2 - 1, -(y / H) * 2 + 1), camera); ray.far = 80; const hit = ray.intersectObject(mesh).find(h => h.point.y <= uniforms.cut.value); if (!hit) return;
    if (free.overGoal > 0.5) { free.pos.set(hit.point.x, eyeH, hit.point.z); free.yaw = orbit.yaw; free.pitch = -0.1; free.goal = null; free.overGoal = 0; free.auto = false; opt.onMode && opt.onMode('walk'); return; }      // from the overview: down into the spot that was tapped
    const g = hit.point.clone(); if (hit.point.y > 0.5) g.addScaledVector(ray.ray.direction, -0.7); g.y = eyeH; free.goal = g; free.auto = false;
  }
  if (opt.explore) {
    let down = null, moved = 0;
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; moved = 0; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - down[0], dy = e.clientY - down[1]; moved += Math.abs(dx) + Math.abs(dy); down = [e.clientX, e.clientY]; free.auto = false;
      if (free.overGoal > 0.5) { orbit.yaw -= dx * 0.006; orbit.tilt = Math.max(0.45, Math.min(1.45, orbit.tilt + dy * 0.005)); } else { free.yaw += dx * 0.0045; free.pitch = Math.max(-1.2, Math.min(1.2, free.pitch + dy * 0.0045)); } });
    canvas.addEventListener('wheel', e => { if (free.overGoal > 0.5) { e.preventDefault(); orbit.zoom = Math.max(0.45, Math.min(1.6, orbit.zoom * (1 + e.deltaY * 0.001))); } }, { passive: false });
    canvas.addEventListener('pointerup', e => { if (down && moved < 8) { const r = canvas.getBoundingClientRect(); goTo(e.clientX - r.left, e.clientY - r.top); } down = null; });
    addEventListener('keydown', e => { free.keys.add(e.key.toLowerCase()); free.auto = false; }); addEventListener('keyup', e => free.keys.delete(e.key.toLowerCase()));
  }
  const start = s => { cur = s; const c = pose(s); free.pos.copy(c.p); const e = new THREE.Euler().setFromQuaternion(c.q, 'YXZ'); free.yaw = e.y; free.pitch = e.x; };

  if (window.IntersectionObserver) new IntersectionObserver(e => { shown = e[0].isIntersecting; }).observe(canvas);
  let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(size, 120); });
  size(); start(0);
  // (a host that serves only web file types can be given the model wrapped in a .json file instead: { "glb": "<base64>" })
  const ready = fetch(base + S.mesh).then(r => { if (!r.ok) throw new Error(S.mesh + ' ' + r.status); return S.mesh.endsWith('.json') ? r.json().then(j => Uint8Array.from(atob(j.glb), c => c.charCodeAt(0)).buffer) : r.arrayBuffer(); }).then(buf => { mesh = new THREE.Mesh(readGlb(buf), material); mesh.frustumCulled = false; mesh.geometry.computeBoundingSphere(); mesh.geometry.computeBoundingBox(); box.copy(mesh.geometry.boundingBox); box.getCenter(mid); world.add(mesh);
    { const pa = mesh.geometry.getAttribute('position').array, pts = []; for (let i = 0; i < pa.length; i += 3 * 61) if (pa[i + 1] < 2.05 && pa[i + 1] > -0.2) pts.push(pa[i], pa[i + 1], pa[i + 2]); if (pts.length > 30) shape = new Float32Array(pts); } if (!opt.still) renderer.setAnimationLoop(frame); });
  ready.catch(e => console.error('Scene3D: could not load the model', e));

  return { total: whole, chapters, spans: [[0, 239]], ready, view: { camera, renderer, mid, orbit }, pose, intro: fr(INTRO), frameOfStep: k => fr(INTRO + cum[Math.min(n - 1, k)]),
    destroy() { dead = true; renderer.setAnimationLoop(null); },
    /** draw one point of the tour (frame 0 to 239), for stills and videos; resolves when the photographs it needs are in */
    async render(f) { await ready; renderer.setAnimationLoop(null); place((f / 239) * whole); for (let k = 0; k < 1500; k++) { if (draw(true)) return true; await new Promise(r => setTimeout(r, 30)); } return false; },
    explore: {
      /** start (or stop) drifting along the planned route */
      tour(on) { free.auto = on; if (on) free.overGoal = 0; },
      /** rise to the overview of the whole home (true), or come back down (false) */
      overview(on) { free.overGoal = on ? 1 : 0; free.auto = false; free.goal = null; },
      /** where the visitor stands and faces, and a way to move them: for a map */
      where() { return { x: free.pos.x, z: free.pos.z, yaw: free.yaw, over: free.over }; },
      jump(x, z) { free.pos.set(x, eyeH, z); free.goal = null; free.auto = false; free.overGoal = 0; },
      /** put the scene in a headset, where the browser offers one; resolves to false where it does not */
      async vr() {
        if (!navigator.xr || !(await navigator.xr.isSessionSupported('immersive-vr').catch(() => false))) return false;
        const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] }); renderer.xr.enabled = true; renderer.xr.setReferenceSpaceType('local-floor'); await renderer.xr.setSession(session);
        session.addEventListener('end', () => { renderer.xr.enabled = false; size(); }); return true;
      },
      async vrOffered() { return !!navigator.xr && !!(await navigator.xr.isSessionSupported('immersive-vr').catch(() => false)); },
    } };
};
