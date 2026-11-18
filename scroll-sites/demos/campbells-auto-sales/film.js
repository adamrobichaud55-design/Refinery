// ScrollFilm: plays a film of still frames as the visitor scrolls. No libraries.
// The frames come packed in a few files (frames/manifest.json lists them); they are decoded only when needed, so a
// phone never holds the whole film in memory. Landscape and portrait screens each get their own set of frames.
//
//   const film = ScrollFilm({ canvas, section, base: 'frames/', bg: '#0b0f16', scale: (o) => o.cover, shift: (portrait) => [dx, dy], onUpdate });
//   onUpdate({ frame, progress, portrait, place(x, y) -> [px, py], anchors })   every drawn frame
// Options: count: 240 reports "frame" on a 0..239 scale however many frames the film really has (so the page's
// chapter numbers survive a shorter film); blend: true dissolves between neighbouring frames, which suits a film
// made from photographs and lets it be packed with fewer frames.
(function () {
  'use strict';
  window.ScrollFilm = function (opt) {
    const canvas = opt.canvas, ctx = canvas.getContext('2d', { alpha: false }), section = opt.section, base = opt.base || 'frames/';
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let man = null, set = null, setName = '', blobs = [], cache = new Map(), pending = new Set(), cur = 0, target = 0, lastDrawn = -1, lastKey = '', cssW = 0, cssH = 0, dpr = 1, loaded = 0, dead = false;
    const state = { ready: false, loadedFraction: 0 };

    const pickSet = () => (man.sets.port && innerHeight > innerWidth * 1.05 ? 'port' : man.sets.land ? 'land' : 'port');
    function size() {
      const r = canvas.getBoundingClientRect(); cssW = Math.max(1, r.width); cssH = Math.max(1, r.height); dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(cssW * dpr), h = Math.round(cssH * dpr); if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      lastKey = '';
    }
    /** where the frame is drawn, in CSS px: it covers the stage, then moves by the page's shift */
    function rect() {
      const cover = Math.max(cssW / set.w, cssH / set.h), k = opt.scale ? opt.scale({ portrait: setName === 'port', cover, width: cssW, height: cssH, w: set.w, h: set.h }) : cover, w = set.w * k, h = set.h * k, s = opt.shift ? opt.shift(setName === 'port', cssW, cssH) : [0, 0];
      return { x: (cssW - w) / 2 + s[0] * cssW, y: (cssH - h) / 2 + s[1] * cssH, w, h };
    }
    async function loadSet(name) {
      setName = name; set = man.sets[name]; blobs = new Array(set.index.length); for (const b of cache.values()) b.close && b.close(); cache = new Map(); pending = new Set(); loaded = 0; lastDrawn = -1; lastKey = '';
      for (let c = 0; c < set.chunks.length; c++) {
        if (dead || setName !== name) return;
        try {
          const buf = await (await fetch(base + set.chunks[c])).arrayBuffer(); if (setName !== name) return;
          set.index.forEach((e, i) => { if (e[0] === c) { blobs[i] = new Blob([buf.slice(e[1], e[1] + e[2])], { type: 'image/webp' }); loaded++; } });
          state.loadedFraction = loaded / set.index.length; state.ready = true; lastKey = ''; opt.onLoad && opt.onLoad(state.loadedFraction);
        } catch (e) { console.error('ScrollFilm: could not load', set.chunks[c], e); }
      }
    }
    function decode(i) {
      if (cache.has(i) || pending.has(i) || !blobs[i]) return;
      pending.add(i);
      const done = bmp => { pending.delete(i); cache.set(i, bmp); lastKey = ''; if (cache.size > 48) { const far = [...cache.keys()].sort((a, b) => Math.abs(b - cur) - Math.abs(a - cur))[0]; const old = cache.get(far); cache.delete(far); old.close && old.close(); } };
      if (window.createImageBitmap) createImageBitmap(blobs[i]).then(done, () => pending.delete(i));
      else { const im = new Image(), u = URL.createObjectURL(blobs[i]); im.onload = () => { URL.revokeObjectURL(u); done(im); }; im.onerror = () => pending.delete(i); im.src = u; }
    }
    function nearest(i) { let best = -1; for (const k of cache.keys()) if (best < 0 || Math.abs(k - i) < Math.abs(best - i)) best = k; return best; }
    function progress() { const r = section.getBoundingClientRect(), span = r.height - innerHeight; return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0; }
    function tick() {
      if (dead) return;
      requestAnimationFrame(tick);
      if (!man || !set) return;
      const n = man.frames, p = progress(); target = p * (n - 1);
      cur = reduce ? target : Math.abs(target - cur) < 0.02 ? target : cur + (target - cur) * 0.16;
      const i = Math.round(cur), dir = target >= cur ? 1 : -1;
      decode(i); for (let k = 1; k <= 5; k++) { const j = i + dir * k; if (j >= 0 && j < n) decode(j); }
      const lo = Math.floor(cur), mix = opt.blend && cache.has(lo) && cache.has(lo + 1) ? cur - lo : 0;
      const show = mix ? lo : cache.has(i) ? i : nearest(i), key = show + '|' + cur.toFixed(2) + '|' + cssW + 'x' + cssH;
      if (key === lastKey) return; lastKey = key;
      const R = rect();
      if (show >= 0 && show !== lastDrawn || show >= 0) {
        ctx.fillStyle = opt.bg || '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(cache.get(show), R.x * dpr, R.y * dpr, R.w * dpr, R.h * dpr);
        if (mix > 0.01) { ctx.globalAlpha = mix; ctx.drawImage(cache.get(lo + 1), R.x * dpr, R.y * dpr, R.w * dpr, R.h * dpr); ctx.globalAlpha = 1; }
        // the frame's edges melt into the page, so the film can sit off-centre without a seam
        const f = 0.07; for (const [x0, x1] of [[R.x, R.x + R.w * f], [R.x + R.w, R.x + R.w * (1 - f)]]) { const g = ctx.createLinearGradient(x0 * dpr, 0, x1 * dpr, 0); g.addColorStop(0, opt.bg || '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(Math.min(x0, x1) * dpr - 1, R.y * dpr, Math.abs(x1 - x0) * dpr + 2, R.h * dpr); }
        for (const [y0, y1] of [[R.y, R.y + R.h * f], [R.y + R.h, R.y + R.h * (1 - f)]]) { const g = ctx.createLinearGradient(0, y0 * dpr, 0, y1 * dpr); g.addColorStop(0, opt.bg || '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(R.x * dpr, Math.min(y0, y1) * dpr - 1, R.w * dpr, Math.abs(y1 - y0) * dpr + 2); }
        lastDrawn = show;
      }
      const an = man.anchors && man.anchors[setName] ? man.anchors[setName][Math.min(n - 1, Math.max(0, i))] : null;
      opt.onUpdate && opt.onUpdate({ frame: opt.count && n > 1 ? (cur * (opt.count - 1)) / (n - 1) : cur, progress: p, portrait: setName === 'port', place: (x, y) => [R.x + x * R.w, R.y + y * R.h], anchors: an || {}, width: cssW, height: cssH });
    }
    fetch(base + 'manifest.json').then(r => r.json()).then(m => { man = m; size(); return loadSet(pickSet()); }).catch(e => console.error('ScrollFilm: no manifest', e));
    let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { size(); if (man && pickSet() !== setName) loadSet(pickSet()); }, 120); });
    size(); requestAnimationFrame(tick);
    return { state, destroy() { dead = true; } };
  };
})();
