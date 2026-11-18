// Builds the page from site.config.js and ties the words to the film.
(function () {
  'use strict';
  const S = window.SITE, $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tel = S.business.phone.replace(/[^\d+]/g, '');
  const root = document.documentElement, css = getComputedStyle(root);
  if (S.accent) root.style.setProperty('--accent', S.accent);
  document.title = S.business.name;

  // ---- top bar and footer ----
  $('mark').textContent = S.business.short || S.business.name;
  $('barCall').textContent = S.business.phone; $('barCall').href = 'tel:' + tel;
  $('foot').innerHTML = `<span>${esc(S.business.name)}</span><span>${esc(S.business.licence)}</span><span>${esc(S.business.area)}</span>`;

  // ---- the film: hero panel, one panel per chapter, callouts, rail ----
  const hero = { id: 'hero', frames: [0, 36], hero: true }, chapters = [hero, ...S.chapters];
  $('panels').innerHTML = chapters.map(c => c.hero
    ? `<div class="panel hero" data-id="hero"><span class="label">${esc(S.hero.kicker)}</span><h1>${esc(S.hero.title)}</h1><p>${esc(S.hero.sub)}</p><a class="btn" href="#contact">${esc(S.hero.cta)}</a><span class="hint">${esc(S.hero.hint)}</span></div>`
    : `<div class="panel" data-id="${esc(c.id)}" style="--dot:${esc(c.color || S.accent)}"><span class="label">${esc(c.label)}</span><h2>${esc(c.title)}</h2><p>${esc(c.body)}</p>${c.cta ? `<a class="btn" href="#estimate">${esc(c.cta)}</a>` : ''}</div>`).join('');
  const callouts = [];
  $('callouts').innerHTML = S.chapters.map(c => (c.callouts || []).map((k, n) => { callouts.push({ ch: c, k }); return `<div class="callout${n % 2 ? ' low' : ''}" style="--dot:${esc(c.color || S.accent)}"><i></i><b></b><span>${esc(k.text)}</span></div>`; }).join('')).join('');
  $('rail').innerHTML = S.chapters.map(c => `<li style="--dot:${esc(c.color || S.accent)}">${esc(c.label)}</li>`).join('');
  const panelEls = [...$('panels').children], calloutEls = [...$('callouts').children], railEls = [...$('rail').children];
  /** how visible a chapter is at film frame f: it fades in and out over a few frames at each end */
  const vis = (c, f) => { const [a, b] = c.frames, e = 5; return c.hero ? Math.min(1, Math.max(0, (b - f) / e)) : Math.min(1, Math.max(0, Math.min((f - a) / e, (b - f) / e))); };
  const stage = $('stage'), bg = css.getPropertyValue('--bg').trim() || '#010205';
  stage.style.backgroundImage = `url(frames/poster-${innerHeight > innerWidth * 1.05 ? 'port' : 'land'}.jpg)`;
  function onUpdate(u) {
    chapters.forEach((c, i) => { const o = vis(c, u.frame), el = panelEls[i]; el.style.setProperty('--o', o.toFixed(3)); el.classList.toggle('on', o > 0.02); });
    S.chapters.forEach((c, i) => railEls[i].classList.toggle('on', u.frame >= c.frames[0] - 4 && u.frame <= c.frames[1] + 2));
    callouts.forEach((c, i) => {
      const a = u.anchors[c.k.anchor], el = calloutEls[i], o = a && a[2] ? vis(c.ch, u.frame) : 0; el.style.setProperty('--o', o.toFixed(3));
      if (!a || o <= 0) return; const [x, y] = u.place(a[0], a[1]); el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`; el.classList.toggle('flip', x > u.width * 0.62);
    });
  }
  window.ScrollFilm({
    canvas: $('filmCanvas'), section: $('film'), base: 'frames/', bg,
    // wide screens: the house sits right of centre, the words to its left. Phones: the house fills the width, words below.
    scale: o => (o.portrait ? Math.min(o.cover, (o.width / o.w) * 1.12) : Math.min(o.cover, (o.width / o.w) * 0.88, (o.height / o.h) * 1.05)),
    shift: (portrait, w) => (portrait ? [0, 0.045] : [w > 820 ? 0.13 : 0, 0.02]),
    onUpdate, onLoad: f => { const i = $('loadline').firstElementChild; i.style.width = f * 100 + '%'; if (f >= 1) { i.style.opacity = 0; stage.style.backgroundImage = 'none'; } },
  });

  // ---- services ----
  $('services').innerHTML = `<div class="in"><div class="head"><span class="label">Services</span><h2>${esc(S.services.title)}</h2></div><div class="rows">${S.services.items.map(s =>
    `<div class="row" style="--dot:${esc(s.color || S.accent)}"><h3>${esc(s.name)}</h3><p>${esc(s.text)}</p><span class="from">${esc(s.from || '')}</span></div>`).join('')}</div></div>`;

  // ---- guide price ----
  const E = S.estimator, money = n => E.currency + (Math.round(n / 10) * 10).toLocaleString('en-US');
  $('estimate').innerHTML = `<div class="in"><div class="head"><span class="label">Guide price</span><h2>${esc(E.title)}</h2></div>
    <div class="tool"><div class="ctl">
      <div class="field"><span>Job</span><div class="chips" id="estJobs">${E.jobs.map((j, i) => `<button type="button" aria-pressed="${i === 1}" data-i="${i}">${esc(j.name)}</button>`).join('')}</div></div>
      <div class="field"><label for="estSize">${esc(E.size.label)} <b id="estSizeOut"></b></label><input type="range" id="estSize" min="${E.size.min}" max="${E.size.max}" step="${E.size.step}" value="${E.size.start}"></div>
      <label class="check" for="estUrgent"><input type="checkbox" id="estUrgent"> ${esc(E.urgent.label)}</label>
    </div><div class="result"><span class="label">Typical cost</span><output id="estOut" for="estSize estUrgent"></output><small>${esc(E.note)}</small></div></div></div>`;
  let job = 1;
  function price() {
    const j = E.jobs[job], sq = Number($('estSize').value), m = $('estUrgent').checked ? E.urgent.multiplier : 1, extra = Math.max(0, sq - E.size.min) * j.perSqFt;
    $('estSizeOut').textContent = sq.toLocaleString('en-US') + ' ' + E.size.unit;
    $('estOut').textContent = money((j.base[0] + extra) * m) + ' to ' + money((j.base[1] + extra) * m);
  }
  $('estJobs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; job = Number(b.dataset.i); [...$('estJobs').children].forEach(x => x.setAttribute('aria-pressed', String(x === b))); price(); });
  $('estSize').addEventListener('input', price); $('estUrgent').addEventListener('change', price); price();

  // ---- how a visit works, reviews ----
  $('steps').innerHTML = `<div class="in"><div class="head"><span class="label">The visit</span><h2>${esc(S.steps.title)}</h2></div><ol class="steps">${S.steps.items.map(s => `<li><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></li>`).join('')}</ol></div>`;
  $('reviews').innerHTML = `<div class="in"><div class="head"><span class="label">Reviews</span><h2>${esc(S.reviews.title)}</h2></div><div class="quotes">${S.reviews.items.map(r => `<blockquote><p>${esc(r.text)}</p><cite>${esc(r.who)}</cite></blockquote>`).join('')}</div></div>`;

  // ---- contact ----
  $('contact').innerHTML = `<div class="in"><div class="head"><span class="label">Contact</span><h2>${esc(S.contact.title)}</h2><p>${esc(S.contact.sub)}</p></div>
    <div class="contact"><div class="side">
      <div class="telrow"><a class="tel" href="tel:${tel}">${esc(S.business.phone)}</a><button type="button" class="copy" id="copyTel">Copy number</button></div>
      <p>${esc(S.business.area)}<br><span style="color:var(--muted)">${esc(S.business.email)}</span></p>
      <dl class="hours">${S.business.hours.map(h => `<dt>${esc(h[0])}</dt><dd>${esc(h[1])}</dd>`).join('')}</dl>
    </div>
    <form id="bookForm" novalidate>
      <div class="two"><label for="fName">Name<input id="fName" name="name" autocomplete="name" required></label><label for="fPhone">Phone<input id="fPhone" name="phone" type="tel" autocomplete="tel" required></label></div>
      <label for="fJob">What do you need?<select id="fJob" name="service">${S.services.items.map(s => `<option>${esc(s.name)}</option>`).join('')}</select></label>
      <label for="fMsg">Anything we should know<textarea id="fMsg" name="message"></textarea></label>
      <div><button class="btn" type="submit">Request a call back</button></div>
      <p class="note" id="formNote" role="status"></p>
    </form></div></div>`;
  $('copyTel').addEventListener('click', () => {
    const b = $('copyTel'), ok = () => { b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy number'; }, 1600); };
    const pick = () => { const r = document.createRange(); r.selectNodeContents(document.querySelector('.tel')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Number selected'; };
    try { navigator.clipboard.writeText(S.business.phone).then(ok, pick); } catch (e) { pick(); }
  });
  $('bookForm').addEventListener('submit', e => {
    e.preventDefault();
    const note = $('formNote'), say = t => { note.textContent = t; note.classList.add('show'); }, f = e.target;
    if (!f.name.value.trim() || !f.phone.value.trim()) return say('Please add your name and a phone number so we can call you back.');
    if (!S.contact.endpoint) return say('This is a demo, so nothing was sent. Add a form address in site.config.js (contact.endpoint) and requests will arrive there.');
    say('Sending…');
    fetch(S.contact.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(f))) })
      .then(r => { if (!r.ok) throw new Error(r.status); f.reset(); say('Thanks. We have your request and will call you back within one working hour.'); })
      .catch(() => say('That did not go through. Please call us on ' + S.business.phone + ' instead.'));
  });

  // in-page links scroll without changing the address (works the same inside a preview frame)
  document.addEventListener('click', e => { const a = e.target.closest('a[href^="#"]'); if (!a) return; const t = document.getElementById(a.getAttribute('href').slice(1)); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); } });
})();
