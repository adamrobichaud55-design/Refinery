// Walk3D: a walk through a room rebuilt in 3D from overlapping photographs.
// A reconstruction step (see ../../tools/recon/) works out where each photograph was taken and how far away every
// part of it is, in one shared scale. Here each photograph becomes a textured surface standing in its true place, so
// together they form the room. Scrolling moves the camera from one real viewpoint to the next along a smooth path;
// in between, the picture is made from the two nearest photographs, with others filling what those two cannot see.
//
//   Walk3D({ canvas, section, base: 'walk/', walk: { views: [...], path: [...] }, onUpdate, onLoad })
import * as THREE from 'three';

const clamp01 = v => Math.min(1, Math.max(0, v)), smooth = v => v * v * (3 - 2 * v);

window.Walk3D = function (opt) {
  const canvas = opt.canvas, coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches, base = opt.base || '';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 400);
  const rt = () => new THREE.WebGLRenderTarget(4, 4, { samples: 4 }), rtA = rt(), rtB = rt(), rtC = rt();
  // A and B are the two photographs the camera is between; C is what the others can add. Where A and B both see a
  // point they are cross-faded; where only one does it is used alone; where neither does, C fills in.
  const join = new THREE.ShaderMaterial({ depthTest: false, uniforms: { a: { value: rtA.texture }, b: { value: rtB.texture }, c: { value: rtC.texture }, w: { value: 0 }, bg: { value: new THREE.Color(opt.bg || '#0b0d10') } },
    vertexShader: 'varying vec2 v; void main(){ v = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D a, b, c; uniform float w; uniform vec3 bg; varying vec2 v;
      void main(){ vec4 A = texture2D(a, v), B = texture2D(b, v), C = texture2D(c, v);
        float wa = A.a * (1.0 - w) + 0.0005 * A.a, wb = B.a * w + 0.0005 * B.a, s = wa + wb;
        vec3 ab = s > 0.0 ? (A.rgb / max(A.a, 0.001) * wa + B.rgb / max(B.a, 0.001) * wb) / s : vec3(0.0); float cover = clamp(max(A.a, B.a), 0.0, 1.0);
        vec3 fill = mix(bg, C.rgb / max(C.a, 0.001), clamp(C.a, 0.0, 1.0));
        gl_FragColor = vec4(mix(fill, ab, cover), 1.0); }` });
  const joinScene = new THREE.Scene(), joinCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); joinScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), join));
  const mat = map => new THREE.ShaderMaterial({ uniforms: { map: { value: map } }, vertexShader: 'varying vec2 v; void main(){ v = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform sampler2D map; varying vec2 v; void main(){ gl_FragColor = vec4(texture2D(map, v).rgb, 1.0); }' });

  const W3 = opt.walk, views = W3.views.map(d => ({ d, state: '' })), path = W3.path, n = path.length;
  for (const V of views) { V.m = new THREE.Matrix4().fromArray(V.d.m); V.pos = new THREE.Vector3().setFromMatrixPosition(V.m); V.quat = new THREE.Quaternion().setFromRotationMatrix(V.m); V.tw = (V.d.w / 2) / V.d.f; V.th = (V.d.h / 2) / V.d.f; }
  let W = 1, H = 1, cur = 0, dead = false, first = true, lastT = 0, shown = true;
  const img = src => new Promise((ok, no) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = no; i.src = src; });

  async function load(V) {
    if (V.state) return; V.state = 'loading';
    try {
      const d = V.d, [photo, dimg] = await Promise.all([img(base + d.src), img(base + d.depth)]);
      const c = document.createElement('canvas'); c.width = dimg.naturalWidth; c.height = dimg.naturalHeight; const cx = c.getContext('2d', { willReadFrequently: true }); cx.drawImage(dimg, 0, 0);
      const D = cx.getImageData(0, 0, c.width, c.height).data, dw = c.width, dh = c.height;
      const near = (u, v) => { const x = clamp01(u) * (dw - 1), y = clamp01(v) * (dh - 1), x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(dw - 1, x0 + 1), y1 = Math.min(dh - 1, y0 + 1), fx = x - x0, fy = y - y0, g = (X, Y) => (D[(Y * dw + X) * 4] * 256 + D[(Y * dw + X) * 4 + 1]) / 65535; return (g(x0, y0) * (1 - fx) + g(x1, y0) * fx) * (1 - fy) + (g(x0, y1) * (1 - fx) + g(x1, y1) * fx) * fy; };
      const GW = d.w >= d.h ? 256 : 192, GH = Math.round((GW * d.h) / d.w), row = GW + 1, pos = new Float32Array(row * (GH + 1) * 3), uv = new Float32Array(row * (GH + 1) * 2), zz = new Float32Array(row * (GH + 1));
      for (let j = 0, k = 0; j <= GH; j++) for (let i = 0; i <= GW; i++, k++) {
        const u = i / GW, v = j / GH, z = Math.min(60, 1 / Math.max(1e-4, d.A * near(u, v) + d.B));        // the distance, in the scene's own scale
        pos[k * 3] = ((u * d.w - d.cx) / d.f) * z; pos[k * 3 + 1] = -((v * d.h - d.cy) / d.f) * z; pos[k * 3 + 2] = -z; uv[k * 2] = u; uv[k * 2 + 1] = 1 - v; zz[k] = z;
      }
      // the surface is cut wherever depth jumps (the edge of a chair against the wall behind): another photograph shows what is behind
      const idx = []; for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { const a = j * row + i, b = a + 1, e = a + row, f = e + 1, lo = Math.min(zz[a], zz[b], zz[e], zz[f]), hi = Math.max(zz[a], zz[b], zz[e], zz[f]); if (hi / lo < (opt.cut || 1.09)) idx.push(a, e, b, b, e, f); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
      const tex = new THREE.Texture(photo); tex.colorSpace = THREE.NoColorSpace; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4; tex.needsUpdate = true;
      V.mesh = new THREE.Mesh(geo, mat(tex)); V.mesh.matrixAutoUpdate = false; V.mesh.matrix.copy(V.m); V.mesh.frustumCulled = false; V.scene = new THREE.Scene(); V.scene.add(V.mesh); V.state = 'ready';
    } catch (e) { V.state = ''; console.error('Walk3D: could not load', V.d.src, e); }
  }
  const fillScene = new THREE.Scene();
  function size() { const r = canvas.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); const pr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2); renderer.setPixelRatio(pr); renderer.setSize(W, H, false); for (const t of [rtA, rtB, rtC]) t.setSize(Math.round(W * pr), Math.round(H * pr)); }
  /** the view from a point g along the walk (0 = first photograph's viewpoint, 1 = the second's, and so on) */
  function draw(g, strict) {
    const i = Math.min(n - 2, Math.max(0, Math.floor(g))), u = clamp01(g - i), e = u * 0.35 + smooth(u) * 0.65, A = views[path[i]], B = views[path[i + 1]];
    for (const V of views) load(V);
    if (A.state !== 'ready' || B.state !== 'ready' || (strict && views.some(V => V.state !== 'ready'))) return false;
    camera.position.lerpVectors(A.pos, B.pos, e); camera.quaternion.slerpQuaternions(A.quat, B.quat, e);
    // the view stays inside what both photographs cover
    const a = W / H, m = opt.margin || 0.8, tw = Math.min(A.tw, B.tw) * m, th = Math.min(A.th, B.th) * m, dh = Math.min(th, tw / a);
    camera.aspect = a; camera.fov = (2 * Math.atan(dh) * 180) / Math.PI; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(rtA); renderer.clear(); renderer.render(A.scene, camera);
    renderer.setRenderTarget(rtB); renderer.clear(); renderer.render(B.scene, camera);
    // the other photographs nearest to the camera fill what these two cannot see
    while (fillScene.children.length) fillScene.remove(fillScene.children[0]);
    const others = views.filter(V => V !== A && V !== B && V.state === 'ready').sort((p, q) => p.pos.distanceToSquared(camera.position) - q.pos.distanceToSquared(camera.position)).slice(0, opt.fill == null ? 3 : opt.fill);
    for (const V of others) fillScene.add(V.mesh);
    renderer.setRenderTarget(rtC); renderer.clear(); if (others.length) renderer.render(fillScene, camera);
    for (const V of others) V.scene.add(V.mesh);
    join.uniforms.w.value = e; renderer.setRenderTarget(null); renderer.render(joinScene, joinCam); return true;
  }
  const progress = () => { const r = opt.section.getBoundingClientRect(), span = r.height - innerHeight; return span > 0 ? clamp01(-r.top / span) : 0; };
  function tick(now) {
    if (dead) return; requestAnimationFrame(tick); if (!shown && !first) return;
    const dt = Math.min(0.1, (now - lastT) / 1000 || 0.016); lastT = now;
    const p = progress(), goal = p * (n - 1); cur = first ? goal : Math.abs(goal - cur) < 0.0004 ? goal : cur + (goal - cur) * Math.min(1, dt * 6);
    if (draw(cur) && first) { first = false; opt.onLoad && opt.onLoad(1); }
    opt.onUpdate && opt.onUpdate({ frame: (cur / (n - 1)) * 239, progress: p, portrait: W < H, width: W, height: H, anchors: {}, place: (x, y) => [x * W, y * H] });
  }
  if (window.IntersectionObserver) new IntersectionObserver(e => { shown = e[0].isIntersecting; }).observe(canvas);
  let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(size, 120); });
  size(); if (!opt.still) requestAnimationFrame(tick);
  return { destroy() { dead = true; }, stops: n,
    /** draw one point of the walk (frame 0 to 239), for stills and videos; resolves when every photograph is in */
    async render(f) { dead = true; const g = (f / 239) * (n - 1); for (let k = 0; k < 800; k++) { if (draw(g, true)) return true; await new Promise(r => setTimeout(r, 40)); } return false; } };
};
