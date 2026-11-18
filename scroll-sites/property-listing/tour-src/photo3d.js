// Photo3D: a walk through real photographs, in 3D, driven by scrolling.
// Each photograph comes with a depth map (how far away every part of it is, made by tools/depth.py). The photograph
// is laid over a surface shaped by that depth, so the camera can really move into it: near things slide past, far
// things come closer. As the camera reaches the far part of one photograph, the next one opens up out of it, far
// parts first, and the move carries on. What is on screen is always the photographs themselves.
//
//   Photo3D({ canvas, section, sets: { land: [shot...], port: [shot...] }, onUpdate({ frame 0..240, ... }), onLoad(1) })
//   shot = { src, depth, to: [x, y] }     "to": the spot the camera heads for, as fractions of the photograph
// "land" is used on wide screens and "port" on upright ones (phones).
import * as THREE from 'three';

const OVERLAP = 0.3;                     // how much of each shot is shared with the next one
const clamp01 = v => Math.min(1, Math.max(0, v)), smooth = v => v * v * (3 - 2 * v);

window.Photo3D = function (opt) {
  const canvas = opt.canvas, coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;            // the photographs go to the screen untouched
  const camera = new THREE.PerspectiveCamera(50, 1, 0.03, 300);
  const rt = () => new THREE.WebGLRenderTarget(4, 4, { samples: 4 }), rtA = rt(), rtB = rt();
  // the two shots on screen are drawn separately, then joined: the next one shows through the far parts of this one first
  const join = new THREE.ShaderMaterial({ depthTest: false, uniforms: { a: { value: rtA.texture }, b: { value: rtB.texture }, t: { value: 0 } },
    vertexShader: 'varying vec2 v; void main(){ v = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: 'uniform sampler2D a, b; uniform float t; varying vec2 v; void main(){ vec4 A = texture2D(a, v); if (t <= 0.0) { gl_FragColor = vec4(A.rgb, 1.0); return; } float e = 1.3 - 1.7 * t; float f = smoothstep(e - 0.22, e + 0.22, A.a); gl_FragColor = vec4(mix(A.rgb, texture2D(b, v).rgb, f), 1.0); }' });
  const joinScene = new THREE.Scene(), joinCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); joinScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), join));
  const photoMat = map => new THREE.ShaderMaterial({ uniforms: { map: { value: map }, far: { value: 10 } },
    vertexShader: 'varying vec2 v; varying float z; void main(){ v = uv; vec4 p = modelViewMatrix * vec4(position, 1.0); z = -p.z; gl_Position = projectionMatrix * p; }',
    fragmentShader: 'uniform sampler2D map; uniform float far; varying vec2 v; varying float z; void main(){ gl_FragColor = vec4(texture2D(map, v).rgb, clamp(z / far, 0.0, 1.0)); }' });   // alpha carries the distance, for the join

  let setName = '', defs = [], shots = [], total = 1, W = 1, H = 1, cur = 0, dead = false, first = true, lastT = 0, shown = true;
  const pick = () => (opt.sets.port && innerHeight > innerWidth * 1.05 ? 'port' : 'land');
  const img = src => new Promise((ok, no) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = no; i.src = src; });

  /** load one shot: the photograph as a texture, and a surface shaped by its depth map */
  async function load(k) {
    const name = setName, s = shots[k]; if (!s || s.state) return; s.state = 'loading';
    try {
      const [photo, dimg] = await Promise.all([img(s.def.src), img(s.def.depth)]); if (setName !== name || s.state !== 'loading') return;
      const c = document.createElement('canvas'); c.width = dimg.naturalWidth; c.height = dimg.naturalHeight; const cx = c.getContext('2d', { willReadFrequently: true }); cx.drawImage(dimg, 0, 0);
      const D = cx.getImageData(0, 0, c.width, c.height).data, dw = c.width, dh = c.height;
      const near = (u, v) => { const x = clamp01(u) * (dw - 1), y = clamp01(v) * (dh - 1), x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(dw - 1, x0 + 1), y1 = Math.min(dh - 1, y0 + 1), fx = x - x0, fy = y - y0, g = (X, Y) => (D[(Y * dw + X) * 4] * 256 + D[(Y * dw + X) * 4 + 1]) / 65535; return (g(x0, y0) * (1 - fx) + g(x1, y0) * fx) * (1 - fy) + (g(x0, y1) * (1 - fx) + g(x1, y1) * fx) * fy; };
      const aspect = photo.naturalWidth / photo.naturalHeight, wide = ((s.def.fov || 84) * Math.PI) / 360, tw = aspect >= 1 ? Math.tan(wide) : Math.tan(wide) * aspect, th = tw / aspect;   // half-widths of the photograph's view
      const ZN = 1, ZF = s.def.far || 14, depthOf = n => 1 / (n * (1 / ZN - 1 / ZF) + 1 / ZF);
      const GW = aspect >= 1 ? 232 : 174, GH = Math.round(GW / aspect), pos = new Float32Array((GW + 3) * (GH + 3) * 3), uv = new Float32Array((GW + 3) * (GH + 3) * 2), zs = [];
      // one extra ring of points beyond the photograph's edge, so that a small turn never shows a gap
      for (let j = -1, n = 0; j <= GH + 1; j++) for (let i = -1; i <= GW + 1; i++, n++) {
        const u = clamp01(i / GW), v = clamp01(j / GH), z = depthOf(near(u, v)), ex = i < 0 ? -0.75 : i > GW ? 1.75 : u, ey = j < 0 ? -0.75 : j > GH ? 1.75 : v;
        pos[n * 3] = (ex - 0.5) * 2 * tw * z; pos[n * 3 + 1] = -(ey - 0.5) * 2 * th * z; pos[n * 3 + 2] = -z; uv[n * 2] = u; uv[n * 2 + 1] = 1 - v; if (i % 4 === 0 && j % 4 === 0) zs.push(z);
      }
      const idx = new Uint32Array((GW + 2) * (GH + 2) * 6), row = GW + 3; for (let j = 0, q = 0; j < GH + 2; j++) for (let i = 0; i < GW + 2; i++) { const a = j * row + i; idx[q++] = a; idx[q++] = a + row; idx[q++] = a + 1; idx[q++] = a + 1; idx[q++] = a + row; idx[q++] = a + row + 1; }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
      const tex = new THREE.Texture(photo); tex.colorSpace = THREE.NoColorSpace; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4; tex.needsUpdate = true;
      const mat = photoMat(tex), mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; s.scene = new THREE.Scene(); s.scene.add(mesh);
      // where the camera goes: towards the chosen spot, stopping well short of whatever stands in the way there
      const to = s.def.to || [0.5, 0.5], ray = new THREE.Vector3((to[0] - 0.5) * 2 * tw, -(to[1] - 0.5) * 2 * th, -1), around = [];
      for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) around.push(depthOf(near(to[0] + a * 0.035, to[1] + b * 0.035)));
      around.sort((p, q) => p - q); zs.sort((p, q) => p - q); const zTo = around[Math.floor(around.length * 0.15)], zMed = zs[Math.floor(zs.length / 2)], zNear = zs[Math.floor(zs.length * 0.03)];
      // not so far that the nearest things in the picture (a table edge, a chair back) are dragged out of shape as they pass
      s.move = ray.clone().multiplyScalar(Math.min(0.4 * zTo, 0.6 * zMed, 0.45 * zNear) * (s.def.push || 1)); s.sway = 0.011 * zMed; mat.uniforms.far.value = Math.min(ZF, zs[Math.floor(zs.length * 0.97)]) * 1.02;
      const turn = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), ray.clone().normalize()), ang = 2 * Math.acos(Math.min(1, Math.abs(turn.w))); s.turn = new THREE.Quaternion().slerp(turn, ang > 0 ? Math.min(1, 0.07 / ang) : 0);   // a slight turn towards it, 4 degrees at most
      s.tw = tw; s.th = th; s.tex = tex; s.geo = geo; s.mat = mat; s.state = 'ready';
    } catch (e) { s.state = ''; console.error('Photo3D: could not load', s.def.src, e); }
  }
  function drop(k) { const s = shots[k]; if (s && s.state === 'ready') { s.tex.dispose(); s.geo.dispose(); s.mat.dispose(); s.scene = s.tex = s.geo = s.mat = null; s.state = ''; } }
  function useSet(name) { for (let k = 0; k < shots.length; k++) drop(k); setName = name; defs = opt.sets[name]; shots = defs.map(def => ({ def, state: '' })); total = (shots.length - 1) * (1 - OVERLAP) + 1; first = true; }
  function size() { const r = canvas.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); const pr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2); renderer.setPixelRatio(pr); renderer.setSize(W, H, false); rtA.setSize(Math.round(W * pr), Math.round(H * pr)); rtB.setSize(Math.round(W * pr), Math.round(H * pr)); }
  /** draw shot k at its own progress s (0 to 1) into a buffer */
  function shoot(k, s, target, now) {
    const S = shots[k], a = W / H, m = 0.8, dh = Math.min(m * S.th, (m * S.tw) / a);        // the view sits inside the photograph, with a margin all round
    camera.aspect = a; camera.fov = (2 * Math.atan(dh) * 180) / Math.PI; camera.updateProjectionMatrix();
    const sw = reduce || now == null ? 0 : S.sway;
    camera.position.copy(S.move).multiplyScalar(s).add(new THREE.Vector3(Math.sin(now * 0.0009) * sw, Math.sin(now * 0.0006 + 1) * sw * 0.5, 0));
    camera.quaternion.identity().slerp(S.turn, smooth(clamp01(s * 1.2))); camera.updateMatrixWorld();
    renderer.setRenderTarget(target); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(S.scene, camera);
  }
  function draw(g, now, strict) {
    const step = 1 - OVERLAP, k = Math.min(shots.length - 1, Math.floor(g / step + 1e-6)), s = g - k * step;
    // A is the shot we are in; B is the next one, once it has begun (the two share the end of A and the start of B)
    const [A, sA, B, sB] = k > 0 && s < OVERLAP ? [k - 1, s + step, k, s] : [k, Math.min(1, s), k + 1, s - step];
    for (let n = 0; n < shots.length; n++) (n >= A - 1 && n <= A + 2 ? load : drop)(n);
    const needB = B < shots.length && sB > 0;
    if (shots[A].state !== 'ready' || (strict && needB && shots[B].state !== 'ready')) return false;
    let t = 0; shoot(A, clamp01(sA), rtA, now);
    if (needB && shots[B].state === 'ready') { t = clamp01(sB / OVERLAP); shoot(B, clamp01(sB), rtB, now); }
    join.uniforms.t.value = t; renderer.setRenderTarget(null); renderer.render(joinScene, joinCam); return true;
  }
  const progress = () => { const r = opt.section.getBoundingClientRect(), span = r.height - innerHeight; return span > 0 ? clamp01(-r.top / span) : 0; };
  function tick(now) {
    if (dead) return; requestAnimationFrame(tick); if (!shown && !first) return;
    const dt = Math.min(0.1, (now - lastT) / 1000 || 0.016); lastT = now;
    const p = progress(), goal = p * total; cur = first ? goal : Math.abs(goal - cur) < 0.0004 ? goal : cur + (goal - cur) * Math.min(1, dt * 6);
    const ok = draw(cur, now); if (ok && first) { first = false; opt.onLoad && opt.onLoad(1); }
    opt.onUpdate && opt.onUpdate({ frame: (cur / total) * 239, progress: p, portrait: setName === 'port', width: W, height: H, anchors: {}, place: (x, y) => [x * W, y * H] });
  }
  if (window.IntersectionObserver) new IntersectionObserver(e => { shown = e[0].isIntersecting; }).observe(canvas);
  let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { size(); if (pick() !== setName) useSet(pick()); }, 120); });
  useSet(pick()); size(); if (!opt.still) requestAnimationFrame(tick);
  return { destroy() { dead = true; }, get total() { return total; },
    /** draw the walk at one chosen point (frame 0 to 239), for making stills and videos; resolves once the photographs are in */
    async render(f) { dead = true; const g = (f / 239) * total; for (let i = 0; i < 600; i++) { if (draw(g, null, true)) return true; await new Promise(r => setTimeout(r, 40)); } return false; } };
};
