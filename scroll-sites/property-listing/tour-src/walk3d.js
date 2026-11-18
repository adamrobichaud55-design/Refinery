// Walk3D: a house tour made only from photographs, driven by scrolling.
// A preparation step (../../tools/recon/build_tour.py) works out, for each room, where every photograph was taken and
// how far away each part of it is. Here every photograph becomes a textured surface standing in its true place, so
// together they form the room. The camera glides through each room on one smooth path at a steady walking pace,
// past the spots the photographs were taken from and on towards the far end of the room; what it sees is put
// together from the nearest photographs. A room with a single photograph still gets a walk: forward into it.
// At the end of a room the next one opens out of the middle of the view, the way a doorway comes towards you.
//
//   Walk3D({ canvas, section, rooms: [{ base: 'walk/01-living/', walk: { views: [...] } }, ...], onUpdate, onLoad })
//   onUpdate({ frame 0..239, room, spans, chapters, ... });  returns { total, spans, chapters: [{ room, label, from, to }], render(f) }
// A room's walk.json may bring its own camera path ("cams", from build_walk.py) and the names of the rooms along it.
import * as THREE from 'three';

const clamp01 = v => Math.min(1, Math.max(0, v)), smooth = v => v * v * (3 - 2 * v);
const HANDOVER = 0.7;                      // how much of each room's walk is shared with the next one (in path units)
const TURN = 1.2;                          // how much walking one radian of turning counts for, when pacing the walk

window.Walk3D = function (opt) {
  const canvas = opt.canvas, coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.autoClear = false;
  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 400);
  const rt = (samples = 4) => new THREE.WebGLRenderTarget(4, 4, { samples }), rtA = rt(), rtB = rt(), rtC = rt(), rtX = rt(0), rtY = rt(0), rtJ = new THREE.WebGLRenderTarget(4, 4, { samples: 0, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter }), targets = [rtA, rtB, rtC, rtX, rtY, rtJ];
  // A and B are the two photographs nearest the camera; C is what the others can add. Where A and B both see a point
  // they are blended by how near each is; where only one does it is used alone; where neither does, C fills in.
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)), quadScene = new THREE.Scene(), quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); quadScene.add(quad);
  const vs = 'varying vec2 v; void main(){ v = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const join = new THREE.ShaderMaterial({ depthTest: false, vertexShader: vs, uniforms: { a: { value: rtA.texture }, b: { value: rtB.texture }, c: { value: rtC.texture }, w: { value: 0 }, audit: { value: 0 }, bg: { value: new THREE.Color(opt.bg || '#2a2622') } },
    fragmentShader: `uniform sampler2D a, b, c; uniform float w, audit; uniform vec3 bg; varying vec2 v;
      void main(){ vec4 A = texture2D(a, v), B = texture2D(b, v), C = texture2D(c, v);
        float k = smoothstep(0.2, 0.8, w), wa = A.a * (1.0 - k) + 0.0005 * A.a, wb = B.a * k + 0.0005 * B.a, s = wa + wb;
        vec3 ab = s > 0.0 ? (A.rgb / max(A.a, 0.001) * wa + B.rgb / max(B.a, 0.001) * wb) / s : vec3(0.0); float cover = clamp(max(A.a, B.a), 0.0, 1.0);
        float ca = clamp(C.a, 0.0, 1.0), all = cover + (1.0 - cover) * ca;
        if (audit > 0.5) { gl_FragColor = vec4(cover, all, 0.0, 1.0); return; }  // for checking: red where the two nearest photographs show the scene, green where any does
        gl_FragColor = vec4(ab * cover + (1.0 - cover) * ca * C.rgb / max(C.a, 0.001), all); }` });
  // What no photograph shows (a sliver behind a door frame, say) is not left dark: it takes the colours around it,
  // from softer and softer copies of the picture, so a gap reads as a patch of wall and not as a hole.
  const heal = new THREE.ShaderMaterial({ depthTest: false, vertexShader: vs, uniforms: { j: { value: rtJ.texture }, audit: join.uniforms.audit, bg: join.uniforms.bg },
    fragmentShader: `uniform sampler2D j; uniform float audit; uniform vec3 bg; varying vec2 v;
      void main(){ vec4 s = texture2D(j, v); if (audit > 0.5) { gl_FragColor = s; return; }
        for (int l = 1; l < 9; l++) { if (s.a > 0.995) break; s += (1.0 - s.a) * textureLod(j, v, float(l)); }
        gl_FragColor = vec4(s.rgb + (1.0 - clamp(s.a, 0.0, 1.0)) * bg, 1.0); }` });
  // one room giving way to the next: the next room opens out of the middle of the view
  const cross = new THREE.ShaderMaterial({ depthTest: false, vertexShader: vs, uniforms: { x: { value: rtX.texture }, y: { value: rtY.texture }, t: { value: 0 }, aspect: { value: 1 } },
    fragmentShader: `uniform sampler2D x, y; uniform float t, aspect; varying vec2 v;
      void main(){ vec2 p = (v - 0.5) * vec2(aspect, 1.0); float d = length(p) / length(vec2(aspect, 1.0) * 0.5), r = t * 1.5;
        float inside = 1.0 - smoothstep(r - 0.45, r, d); gl_FragColor = vec4(mix(texture2D(x, v).rgb, texture2D(y, v).rgb, inside * smoothstep(0.0, 0.25, t)), 1.0); }` });
  const photoMat = map => new THREE.ShaderMaterial({ uniforms: { map: { value: map } }, vertexShader: 'attribute float solid; varying vec2 v; varying float s; void main(){ v = uv; s = solid; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform sampler2D map; varying vec2 v; varying float s; void main(){ float a = smoothstep(0.0, 0.9, s); gl_FragColor = vec4(texture2D(map, v).rgb * a, a); }' });   // colour already multiplied by its coverage
  const img = src => new Promise((ok, no) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = no; i.src = src; });
  const FWD = new THREE.Vector3(0, 0, -1), dirOf = q => FWD.clone().applyQuaternion(q);

  // ---- rooms: their photographs, and the path the camera takes through them ----
  const rooms = opt.rooms.map(r => {
    const views = r.walk.views.map((d, i) => { const m = new THREE.Matrix4().fromArray(d.m), quat = new THREE.Quaternion().setFromRotationMatrix(m); return { d, i, base: r.base || '', state: '', m, pos: new THREE.Vector3().setFromMatrixPosition(m), quat, dir: dirOf(quat), tw: (d.w / 2) / d.f, th: (d.h / 2) / d.f }; });
    // A walk planned from a video or a dense set of photographs brings its own camera path; otherwise the key poses
    // are each photograph's own viewpoint in turn, then on towards the far end of the last one.
    const planned = r.walk.cams && r.walk.cams.length > 1;
    if (planned) {
      const keys = r.walk.cams.map(c => { const m = new THREE.Matrix4().fromArray(c.m); return { p: new THREE.Vector3().setFromMatrixPosition(m), q: new THREE.Quaternion().setFromRotationMatrix(m) }; });
      for (let k = 1; k < keys.length; k++) if (keys[k].q.dot(keys[k - 1].q) < 0) keys[k].q.set(-keys[k].q.x, -keys[k].q.y, -keys[k].q.z, -keys[k].q.w);
      const cum = [0]; for (let k = 1; k < keys.length; k++) cum.push(cum[k - 1] + Math.max(0.02, keys[k].p.distanceTo(keys[k - 1].p) + TURN * keys[k].q.angleTo(keys[k - 1].q)));
      // the view is kept well inside what one frame covers, so that a frame turned a little differently still fills it
      const at = r.walk.cams.map(c => c.v);
      return { views, keys, cum, len: cum[cum.length - 1], tw: Math.min(...views.map(V => V.tw)) * (opt.marginX || 0.62), th: Math.min(...views.map(V => V.th)) * (opt.marginY || 0.8), centre: seg => at[Math.min(at.length - 1, seg)], reach: 4, chapters: r.walk.chapters || [], name: r.name };
    }
    const keys = views.map(V => ({ p: V.pos.clone(), q: V.quat.clone() })), L = views[views.length - 1], d = L.d, far = d.far || [0.5, 0.5];
    const toFar = new THREE.Vector3((far[0] * d.w - d.cx) / d.f, -(far[1] * d.h - d.cy) / d.f, -1).normalize(), zmed = d.zmed || 3;
    const push = Math.min(0.4 * (d.zto || zmed), 0.6 * zmed, 0.36 * (d.znear || zmed)) * (r.push || 1), look = new THREE.Quaternion().setFromUnitVectors(FWD, toFar), ang = 2 * Math.acos(Math.min(1, Math.abs(look.w)));
    keys.push({ p: L.pos.clone().add(toFar.clone().applyQuaternion(L.quat).multiplyScalar(push)), q: L.quat.clone().multiply(new THREE.Quaternion().slerp(look, ang > 0 ? Math.min(1, 0.09 / ang) : 0)) });
    for (let k = 1; k < keys.length; k++) if (keys[k].q.dot(keys[k - 1].q) < 0) keys[k].q.set(-keys[k].q.x, -keys[k].q.y, -keys[k].q.z, -keys[k].q.w);
    const cum = [0]; for (let k = 1; k < keys.length; k++) cum.push(cum[k - 1] + Math.max(k < keys.length - 1 ? 0.35 : views.length === 1 ? 1.5 : 0.9, keys[k].p.distanceTo(keys[k - 1].p) + TURN * keys[k].q.angleTo(keys[k - 1].q)));   // the walk into a lone photograph, and the last steps of any room, are given time
    // one field of view for the whole room, inside what every photograph covers
    const m = opt.margin || 0.8, tw = Math.min(...views.map(V => V.tw)) * m, th = Math.min(...views.map(V => V.th)) * m;
    return { views, keys, cum, len: cum[cum.length - 1], tw, th, centre: seg => Math.min(views.length - 1, seg), reach: 3, chapters: [], name: r.name };
  });
  let at = 0; for (const [k, r] of rooms.entries()) { r.start = at; at += r.len - (k < rooms.length - 1 ? HANDOVER : 0); }
  const total = at, fr = x => (x / total) * 239, spans = rooms.map(r => [fr(r.start), fr(r.start + r.len)]);
  // the stretches of the tour to caption: the named rooms along a planned walk, or each room as a whole
  const chapters = rooms.flatMap((r, k) => r.chapters.length ? r.chapters.map(c => ({ room: k, label: c.label, from: fr(r.start + r.cum[Math.min(r.cum.length - 1, c.from)]), to: fr(r.start + r.cum[Math.min(r.cum.length - 1, c.to)]) })) : [{ room: k, label: r.name || '', from: spans[k][0], to: spans[k][1] }]);

  const cr = (a, b, c, d, u) => 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  /** the camera's raw pose a distance s along a room's path */
  function rawPose(room, s, p, q) {
    const K = room.keys, n = K.length; s = Math.min(room.len, Math.max(0, s)); let k = 0; while (k < n - 2 && s > room.cum[k + 1]) k++;
    const u = (s - room.cum[k]) / (room.cum[k + 1] - room.cum[k]), a = K[Math.max(0, k - 1)].p, b = K[k].p, c = K[k + 1].p, d = K[Math.min(n - 1, k + 2)].p;
    p.set(cr(a.x, b.x, c.x, d.x, u), cr(a.y, b.y, c.y, d.y, u), cr(a.z, b.z, c.z, d.z, u)); q.slerpQuaternions(K[k].q, K[k + 1].q, u); return k;
  }
  /** the pose the camera actually takes: the raw one averaged over a short stretch, so that speed and turning never change abruptly */
  const tp = new THREE.Vector3(), tq = new THREE.Quaternion(), ref = new THREE.Quaternion();
  function pose(room, s) {
    const acc = new THREE.Vector3(), qa = [0, 0, 0, 0]; let ws = 0, seg = 0;
    for (let i = -4; i <= 4; i++) { const w = Math.exp(-(i * i) / 6), k = rawPose(room, s + i * 0.12, tp, tq); if (i === 0) { seg = k; ref.copy(tq); } acc.addScaledVector(tp, w); const sg = i < 0 || i > 0 ? Math.sign(tq.dot(ref) || 1) : 1; qa[0] += w * sg * tq.x; qa[1] += w * sg * tq.y; qa[2] += w * sg * tq.z; qa[3] += w * sg * tq.w; ws += w; }
    return { p: acc.multiplyScalar(1 / ws), q: new THREE.Quaternion(qa[0], qa[1], qa[2], qa[3]).normalize(), seg };
  }

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
  function keep(room, i) { const want = []; for (const V of room.views) (V.i > i - room.reach && V.i <= i + room.reach ? (want.push(V), load) : drop)(V); return want; }

  let W = 1, H = 1, cur = 0, dead = false, first = true, lastT = 0, shown = true;
  const scene = new THREE.Scene(), show = list => { scene.clear(); for (const m of list) scene.add(m); };
  function size() { const r = canvas.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); const pr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2); renderer.setPixelRatio(pr); renderer.setSize(W, H, false); for (const t of targets) t.setSize(Math.round(W * pr), Math.round(H * pr)); cross.uniforms.aspect.value = W / H; }
  /** the view from a distance s along one room's path, drawn into a target */
  function compose(room, s, target, strict) {
    const c = pose(room, s), near = keep(room, room.centre(c.seg)), ready = near.filter(V => V.state === 'ready');
    if (!ready.length || (strict && ready.length < near.length)) return false;
    camera.position.copy(c.p); camera.quaternion.copy(c.q);
    const a = W / H, dh = Math.min(room.th, room.tw / a); camera.aspect = a; camera.fov = (2 * Math.atan(dh) * 180) / Math.PI; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    // the photographs, nearest first: by how far the camera is from where each was taken, and how differently it is turned
    const cd = dirOf(c.q), score = V => V.pos.distanceTo(c.p) + TURN * Math.acos(Math.min(1, Math.max(-1, V.dir.dot(cd)))), list = ready.map(V => [score(V), V]).sort((p, q) => p[0] - q[0]);
    const A = list[0][1], B = (list[1] || list[0])[1], dA = list[0][0], dB = (list[1] || list[0])[0], T = list[2] ? list[2][0] : dA + dB + 1e-6, wA = Math.max(0, 1 - dA / T), wB = list[1] ? Math.max(0, 1 - dB / T) : 0;
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(rtA); renderer.clear(); show([A.cut]); renderer.render(scene, camera);
    renderer.setRenderTarget(rtB); renderer.clear(); show([B.cut]); renderer.render(scene, camera);
    // underneath: the untorn surfaces of A and B, then (drawn over them) whatever the other nearby photographs really show
    const others = list.slice(2, 5).map(e => e[1]);
    renderer.setRenderTarget(rtC); renderer.clear(); show([...new Set([A, B, ...others])].map(V => V.whole)); renderer.render(scene, camera);
    if (others.length) { renderer.clearDepth(); show(others.map(V => V.cut)); renderer.render(scene, camera); }
    scene.clear(); join.uniforms.w.value = wA + wB > 0 ? wB / (wA + wB) : 0; quad.material = join; renderer.setRenderTarget(rtJ); renderer.render(quadScene, quadCam);
    quad.material = heal; renderer.setRenderTarget(target); renderer.render(quadScene, quadCam); return true;
  }
  /** the picture at point x of the whole tour */
  function draw(x, strict) {
    let k = rooms.length - 1; while (k > 0 && x < rooms[k].start) k--;
    const r = rooms[k], g = x - r.start, prev = k > 0 ? rooms[k - 1] : null, gp = prev ? x - prev.start : 0;
    for (const [j, q] of rooms.entries()) if (j !== k && !(prev && j === k - 1 && gp <= prev.len)) for (const V of q.views) drop(V);
    if (prev && gp <= prev.len) {                                    // one room is giving way to the next: both keep moving
      const okP = compose(prev, gp, rtX, strict), okR = compose(r, g, rtY, strict);
      if (!okP && !okR) return false; if (strict && !(okP && okR)) return false;
      cross.uniforms.t.value = !okP ? 1 : !okR ? 0 : clamp01(g / HANDOVER); quad.material = cross; renderer.setRenderTarget(null); renderer.render(quadScene, quadCam); return true;
    }
    return compose(r, g, null, strict);
  }
  const progress = () => { const r = opt.section.getBoundingClientRect(), span = r.height - innerHeight; return span > 0 ? clamp01(-r.top / span) : 0; };
  function tick(now) {
    if (dead) return; requestAnimationFrame(tick); if (!shown && !first) return;
    const dt = Math.min(0.1, (now - lastT) / 1000 || 0.016); lastT = now;
    const p = progress(), goal = p * total; cur = first ? goal : Math.abs(goal - cur) < 0.0004 ? goal : cur + (goal - cur) * Math.min(1, dt * 5);
    if (draw(cur) && first) { first = false; opt.onLoad && opt.onLoad(1); }
    let room = rooms.length - 1; while (room > 0 && cur < rooms[room].start + HANDOVER / 2) room--;
    opt.onUpdate && opt.onUpdate({ frame: (cur / total) * 239, room, spans, chapters, progress: p, portrait: W < H, width: W, height: H, anchors: {}, place: (x, y) => [x * W, y * H] });
  }
  if (window.IntersectionObserver) new IntersectionObserver(e => { shown = e[0].isIntersecting; }).observe(canvas);
  let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(size, 120); });
  size(); if (!opt.still) requestAnimationFrame(tick);
  return { destroy() { dead = true; }, spans, chapters, total,
    /** draw one point of the tour (frame 0 to 239), for stills and videos; resolves when the photographs it needs are in */
    /** how many camera positions each room's path has, for audit() */
    plan: rooms.map(r => r.keys.length),
    /** for checking a tour: at camera position j of room k, the share of the picture the two nearest photographs do not show (it is patched from others), and the share no photograph shows at all */
    async audit(k, j) {
      dead = true; const r = rooms[k]; for (const [i, q] of rooms.entries()) if (i !== k) for (const V of q.views) drop(V);
      join.uniforms.audit.value = 1; let res = null;
      for (let n = 0; n < 800 && !res; n++) {
        if (!compose(r, r.cum[j], null, true)) { await new Promise(done => setTimeout(done, 40)); continue; }
        const gl = renderer.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
        let patched = 0, hole = 0; for (let i = 0; i < px.length; i += 4) { if (px[i] < 128) patched++; if (px[i + 1] < 128) hole++; } res = { patched: patched / (w * h), hole: hole / (w * h) };
      }
      join.uniforms.audit.value = 0; return res;
    },
    async render(f) { dead = true; const x = (f / 239) * total; for (let k = 0; k < 800; k++) { if (draw(x, true)) return true; await new Promise(r => setTimeout(r, 40)); } return false; } };
};
