// Walk3D: a walk through rooms rebuilt in 3D from overlapping photographs.
// A reconstruction step (../../tools/recon/) works out where each photograph was taken and how far away every part
// of it is, in one shared scale per room. Here each photograph becomes a textured surface standing in its true
// place, so together they form the room. Scrolling moves the camera from one real viewpoint to the next along a
// smooth path; in between, the picture is made from the two nearest photographs, with the others filling in what
// those two cannot see. Rooms follow one another; the camera keeps moving while one room gives way to the next.
//
//   Walk3D({ canvas, section, rooms: [{ base: 'walk/bedroom/', walk: { views, path } }, ...], onUpdate, onLoad })
//   onUpdate({ frame 0..239, room, spans: [[from, to] per room, in frames], ... })
import * as THREE from 'three';

const clamp01 = v => Math.min(1, Math.max(0, v)), smooth = v => v * v * (3 - 2 * v);
const HANDOVER = 0.6;                       // how many "stops" of each room are shared with the next one

window.Walk3D = function (opt) {
  const canvas = opt.canvas, coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.autoClear = false;
  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 400);
  const rt = (samples = 4) => new THREE.WebGLRenderTarget(4, 4, { samples }), rtA = rt(), rtB = rt(), rtC = rt(), rtX = rt(0), rtY = rt(0), targets = [rtA, rtB, rtC, rtX, rtY];
  // A and B are the two photographs the camera is between; C is what the others can add. Where A and B both see a
  // point they are cross-faded; where only one does it is used alone; where neither does, C fills in.
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)), quadScene = new THREE.Scene(), quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); quadScene.add(quad);
  const vs = 'varying vec2 v; void main(){ v = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const join = new THREE.ShaderMaterial({ depthTest: false, vertexShader: vs, uniforms: { a: { value: rtA.texture }, b: { value: rtB.texture }, c: { value: rtC.texture }, w: { value: 0 }, bg: { value: new THREE.Color(opt.bg || '#0b0d10') } },
    fragmentShader: `uniform sampler2D a, b, c; uniform float w; uniform vec3 bg; varying vec2 v;
      void main(){ vec4 A = texture2D(a, v), B = texture2D(b, v), C = texture2D(c, v);
        float k = smoothstep(0.22, 0.78, w), wa = A.a * (1.0 - k) + 0.0005 * A.a, wb = B.a * k + 0.0005 * B.a, s = wa + wb;
        vec3 ab = s > 0.0 ? (A.rgb / max(A.a, 0.001) * wa + B.rgb / max(B.a, 0.001) * wb) / s : vec3(0.0); float cover = clamp(max(A.a, B.a), 0.0, 1.0);
        vec3 fill = mix(bg, C.rgb / max(C.a, 0.001), clamp(C.a, 0.0, 1.0));
        gl_FragColor = vec4(mix(fill, ab, cover), 1.0); }` });
  const cross = new THREE.ShaderMaterial({ depthTest: false, vertexShader: vs, uniforms: { x: { value: rtX.texture }, y: { value: rtY.texture }, t: { value: 0 } },
    fragmentShader: 'uniform sampler2D x, y; uniform float t; varying vec2 v; void main(){ gl_FragColor = vec4(mix(texture2D(x, v).rgb, texture2D(y, v).rgb, t), 1.0); }' });
  const photoMat = map => new THREE.ShaderMaterial({ uniforms: { map: { value: map } }, vertexShader: 'attribute float solid; varying vec2 v; varying float s; void main(){ v = uv; s = solid; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform sampler2D map; varying vec2 v; varying float s; void main(){ float a = smoothstep(0.0, 0.9, s); gl_FragColor = vec4(texture2D(map, v).rgb * a, a); }' });   // colour already multiplied by its coverage
  const img = src => new Promise((ok, no) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = no; i.src = src; });

  // ---- rooms and their views ----
  const rooms = opt.rooms.map(r => {
    const views = r.walk.views.map(d => { const m = new THREE.Matrix4().fromArray(d.m); return { d, base: r.base || '', state: '', m, pos: new THREE.Vector3().setFromMatrixPosition(m), quat: new THREE.Quaternion().setFromRotationMatrix(m), tw: (d.w / 2) / d.f, th: (d.h / 2) / d.f }; });
    return { views, path: r.walk.path, n: r.walk.path.length, len: r.walk.path.length - 1 };
  });
  let at = 0; for (const [k, r] of rooms.entries()) { r.start = at; at += r.len - (k < rooms.length - 1 ? HANDOVER : 0); }
  const total = at, spans = rooms.map(r => [(r.start / total) * 239, ((r.start + r.len) / total) * 239]);

  async function load(V) {
    if (V.state) return; V.state = 'loading';
    try {
      const d = V.d, [photo, dimg] = await Promise.all([img(V.base + d.src), img(V.base + d.depth)]); if (V.state !== 'loading') return;
      const c = document.createElement('canvas'); c.width = dimg.naturalWidth; c.height = dimg.naturalHeight; const cx = c.getContext('2d', { willReadFrequently: true }); cx.drawImage(dimg, 0, 0);
      const D = cx.getImageData(0, 0, c.width, c.height).data, dw = c.width, dh = c.height;
      const near = (u, v) => { const x = clamp01(u) * (dw - 1), y = clamp01(v) * (dh - 1), x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(dw - 1, x0 + 1), y1 = Math.min(dh - 1, y0 + 1), fx = x - x0, fy = y - y0, g = (X, Y) => (D[(Y * dw + X) * 4] * 256 + D[(Y * dw + X) * 4 + 1]) / 65535; return (g(x0, y0) * (1 - fx) + g(x1, y0) * fx) * (1 - fy) + (g(x0, y1) * (1 - fx) + g(x1, y1) * fx) * fy; };
      const GW = d.w >= d.h ? 288 : 216, GH = Math.round((GW * d.h) / d.w), row = GW + 1, pos = new Float32Array(row * (GH + 1) * 3), uv = new Float32Array(row * (GH + 1) * 2), zz = new Float32Array(row * (GH + 1));
      for (let j = 0, k = 0; j <= GH; j++) for (let i = 0; i <= GW; i++, k++) {
        const u = i / GW, v = j / GH, z = Math.min(60, 1 / Math.max(1e-4, d.A * near(u, v) + d.B));        // the distance, in the room's own scale
        pos[k * 3] = ((u * d.w - d.cx) / d.f) * z; pos[k * 3 + 1] = -((v * d.h - d.cy) / d.f) * z; pos[k * 3 + 2] = -z; uv[k * 2] = u; uv[k * 2 + 1] = 1 - v; zz[k] = z;
      }
      // Two surfaces from the same points. "cut" is torn wherever depth jumps (the edge of a chair against the wall
      // behind it), so nothing is smeared across the gap: another photograph shows what is there. "whole" is not torn;
      // it goes underneath everything as a last resort, so that a gap no photograph covers is never an empty hole.
      const cut = [], whole = [], solid = new Float32Array(row * (GH + 1)).fill(1), torn = [];
      for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { const a = j * row + i, b = a + 1, e = a + row, f = e + 1, lo = Math.min(zz[a], zz[b], zz[e], zz[f]), hi = Math.max(zz[a], zz[b], zz[e], zz[f]); whole.push(a, e, b, b, e, f); if (hi / lo < (opt.cut || 1.14)) cut.push(a, e, b, b, e, f); else torn.push(a, b, e, f); }
      for (const k of torn) solid[k] = 0;                                 // the surface fades out towards a tear, so its edge is soft and not a row of steps
      const posA = new THREE.BufferAttribute(pos, 3), uvA = new THREE.BufferAttribute(uv, 2), one = new THREE.BufferAttribute(new Float32Array(row * (GH + 1)).fill(1), 1), geo = (idx, sol) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', posA); g.setAttribute('uv', uvA); g.setAttribute('solid', sol); g.setIndex(idx); return g; };
      const tex = new THREE.Texture(photo); tex.colorSpace = THREE.NoColorSpace; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4; tex.needsUpdate = true;
      const material = photoMat(tex), mk = g => { const m = new THREE.Mesh(g, material); m.matrixAutoUpdate = false; m.matrix.copy(V.m); m.matrixWorld.copy(V.m); m.matrixWorldAutoUpdate = false; m.frustumCulled = false; return m; };
      V.cut = mk(geo(cut, new THREE.BufferAttribute(solid, 1))); V.whole = mk(geo(whole, one)); V.tex = tex; V.material = material; V.state = 'ready';
    } catch (e) { V.state = ''; console.error('Walk3D: could not load', V.d.src, e); }
  }
  function drop(V) { if (V.state !== 'ready') { if (V.state === 'loading') V.state = ''; return; } V.tex.dispose(); V.material.dispose(); V.cut.geometry.dispose(); V.whole.geometry.dispose(); V.cut = V.whole = V.tex = V.material = null; V.state = ''; }
  /** keep the photographs around stop i of a room in memory, and let go of the rest of that room */
  function keep(room, i, reach = 3) { const want = new Set(); for (let k = Math.max(0, i - reach + 1); k <= Math.min(room.n - 1, i + reach); k++) want.add(room.views[room.path[k]]); for (const V of room.views) (want.has(V) ? load : drop)(V); return [...want]; }

  let W = 1, H = 1, cur = 0, dead = false, first = true, lastT = 0, shown = true;
  const scene = new THREE.Scene(), show = list => { scene.clear(); for (const m of list) scene.add(m); };
  function size() { const r = canvas.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); const pr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2); renderer.setPixelRatio(pr); renderer.setSize(W, H, false); for (const t of targets) t.setSize(Math.round(W * pr), Math.round(H * pr)); }
  /** the view from point g along one room's walk (0 = its first photograph's viewpoint, 1 = the second's ...), drawn into a target */
  function compose(room, g, target, strict) {
    const i = Math.min(room.n - 2, Math.max(0, Math.floor(g))), u = clamp01(g - i), e = u * 0.35 + smooth(u) * 0.65, A = room.views[room.path[i]], B = room.views[room.path[i + 1]], near = keep(room, i);
    if (A.state !== 'ready' || B.state !== 'ready' || (strict && near.some(V => V.state !== 'ready'))) return false;
    camera.position.lerpVectors(A.pos, B.pos, e); camera.quaternion.slerpQuaternions(A.quat, B.quat, e);
    // the view stays inside what both photographs cover
    const a = W / H, m = opt.margin || 0.78, tw = Math.min(A.tw, B.tw) * m, th = Math.min(A.th, B.th) * m, dh = Math.min(th, tw / a);
    camera.aspect = a; camera.fov = (2 * Math.atan(dh) * 180) / Math.PI; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(rtA); renderer.clear(); show([A.cut]); renderer.render(scene, camera);
    renderer.setRenderTarget(rtB); renderer.clear(); show([B.cut]); renderer.render(scene, camera);
    // underneath: the untorn surfaces of A and B, then (drawn over them) whatever the other nearby photographs really show
    const others = near.filter(V => V !== A && V !== B && V.state === 'ready').sort((p, q) => p.pos.distanceToSquared(camera.position) - q.pos.distanceToSquared(camera.position)).slice(0, 3);
    renderer.setRenderTarget(rtC); renderer.clear(); show([A.whole, B.whole]); renderer.render(scene, camera);
    if (others.length) { renderer.clearDepth(); show(others.map(V => V.cut)); renderer.render(scene, camera); }
    scene.clear(); join.uniforms.w.value = e; quad.material = join; renderer.setRenderTarget(target); renderer.render(quadScene, quadCam); return true;
  }
  /** the picture at point x of the whole walk */
  function draw(x, strict) {
    let k = rooms.length - 1; while (k > 0 && x < rooms[k].start) k--;
    const r = rooms[k], g = x - r.start, prev = k > 0 ? rooms[k - 1] : null, gp = prev ? x - prev.start : 0;
    for (const [j, q] of rooms.entries()) if (j !== k && !(prev && j === k - 1 && gp <= prev.len)) for (const V of q.views) drop(V);
    if (prev && gp <= prev.len) {                                    // one room is giving way to the next: both keep moving
      const okP = compose(prev, gp, rtX, strict), okR = compose(r, g, rtY, strict);
      if (!okP && !okR) return false; if (strict && !(okP && okR)) return false;
      cross.uniforms.t.value = !okP ? 1 : !okR ? 0 : smooth(clamp01(g / HANDOVER)); quad.material = cross; renderer.setRenderTarget(null); renderer.render(quadScene, quadCam); return true;
    }
    return compose(r, g, null, strict);
  }
  const progress = () => { const r = opt.section.getBoundingClientRect(), span = r.height - innerHeight; return span > 0 ? clamp01(-r.top / span) : 0; };
  function tick(now) {
    if (dead) return; requestAnimationFrame(tick); if (!shown && !first) return;
    const dt = Math.min(0.1, (now - lastT) / 1000 || 0.016); lastT = now;
    const p = progress(), goal = p * total; cur = first ? goal : Math.abs(goal - cur) < 0.0004 ? goal : cur + (goal - cur) * Math.min(1, dt * 6);
    if (draw(cur) && first) { first = false; opt.onLoad && opt.onLoad(1); }
    let room = rooms.length - 1; while (room > 0 && cur < rooms[room].start + HANDOVER / 2) room--;
    opt.onUpdate && opt.onUpdate({ frame: (cur / total) * 239, room, spans, progress: p, portrait: W < H, width: W, height: H, anchors: {}, place: (x, y) => [x * W, y * H] });
  }
  if (window.IntersectionObserver) new IntersectionObserver(e => { shown = e[0].isIntersecting; }).observe(canvas);
  let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(size, 120); });
  size(); if (!opt.still) requestAnimationFrame(tick);
  return { destroy() { dead = true; }, spans, total,
    /** draw one point of the walk (frame 0 to 239), for stills and videos; resolves when the photographs it needs are in */
    async render(f) { dead = true; const x = (f / 239) * total; for (let k = 0; k < 800; k++) { if (draw(x, true)) return true; await new Promise(r => setTimeout(r, 40)); } return false; } };
};
