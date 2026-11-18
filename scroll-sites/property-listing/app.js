// Builds the listing page from site.config.js and ties the words to the film.
(function () {
  'use strict';
  const S = window.SITE, L = S.listing, A = S.agent, $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tel = A.phone.replace(/[^\d+]/g, ''), root = document.documentElement, money = n => L.currency + Math.round(n).toLocaleString('en-US');
  if (S.accent) root.style.setProperty('--accent', S.accent);
  document.title = L.address + ', ' + L.town;
  $('mark').textContent = A.brokerage; $('barCall').textContent = A.phone; $('barCall').href = 'tel:' + tel;
  $('foot').innerHTML = `<span>${esc(L.address)}, ${esc(L.town)}</span><span>${esc(L.id)}</span><span>${esc(A.name)} · ${esc(A.brokerage)}</span>`;

  // ---- the film ----
  const hero = { id: 'hero', frames: [0, 36], hero: true }, chapters = [hero, ...S.chapters];
  $('panels').innerHTML = chapters.map(c => c.hero
    ? `<div class="panel hero"><span class="label">${esc(L.status)} · ${esc(L.town)}</span><h1>${esc(L.address)}</h1><p>${esc(L.summary)}</p><div class="ask">${money(L.price)}<small>${esc(L.facts.slice(0, 2).map(f => f[0] + ' ' + f[1].toLowerCase().slice(0, 3)).join(' · '))}</small></div><a class="btn" href="#contact">${esc(S.hero.cta)}</a><span class="hint">${esc(S.hero.hint)}</span></div>`
    : `<div class="panel" style="--dot:${esc(c.color || S.accent)}"><span class="label">${esc(c.label)}</span><h2>${esc(c.title)}</h2><p>${esc(c.body)}</p>${c.cta ? `<a class="btn" href="#contact">${esc(c.cta)}</a>` : ''}</div>`).join('');
  const callouts = [];
  $('callouts').innerHTML = S.chapters.map(c => (c.callouts || []).map((k, n) => { callouts.push({ ch: c, k }); return `<div class="callout${n % 2 ? ' low' : ''}" style="--dot:${esc(c.color || S.accent)}"><i></i><b></b><span>${esc(k.text)}</span></div>`; }).join('')).join('');
  $('rail').innerHTML = S.chapters.map(c => `<li style="--dot:${esc(c.color || S.accent)}">${esc(c.label)}</li>`).join('');
  const panelEls = [...$('panels').children], calloutEls = [...$('callouts').children], railEls = [...$('rail').children];
  const vis = (c, f) => { const [a, b] = c.frames, e = 5; return c.hero ? Math.min(1, Math.max(0, (b - f) / e)) : Math.min(1, Math.max(0, Math.min((f - a) / e, (b - f) / e))); };
  const COVER = !!(S.film && S.film.fit === 'cover'); if (COVER) $('stage').classList.add('photo');
  const stage = $('stage'), bg = getComputedStyle(root).getPropertyValue('--bg').trim() || '#010205';
  stage.style.backgroundImage = `url(frames/poster-${innerHeight > innerWidth * 1.05 ? 'port' : 'land'}.jpg)`;
  window.ScrollFilm({
    canvas: $('filmCanvas'), section: $('film'), base: 'frames/', bg,
    // a film made from photographs fills the screen; the model-house film floats beside the words
    scale: o => (COVER ? o.cover : o.portrait ? Math.min(o.cover, (o.width / o.w) * 1.12) : Math.min(o.cover, (o.width / o.w) * 0.88, (o.height / o.h) * 1.05)),
    shift: (portrait, w) => (COVER ? [0, 0] : portrait ? [0, 0.045] : [w > 820 ? 0.13 : 0, 0.02]),
    onUpdate(u) {
      chapters.forEach((c, i) => { const o = vis(c, u.frame), el = panelEls[i]; el.style.setProperty('--o', o.toFixed(3)); el.classList.toggle('on', o > 0.02); });
      S.chapters.forEach((c, i) => railEls[i].classList.toggle('on', u.frame >= c.frames[0] - 4 && u.frame <= c.frames[1] + 2));
      callouts.forEach((c, i) => { const a = u.anchors[c.k.anchor], el = calloutEls[i], o = a && a[2] ? vis(c.ch, u.frame) : 0; el.style.setProperty('--o', o.toFixed(3)); if (!a || o <= 0) return; const [x, y] = u.place(a[0], a[1]); el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`; el.classList.toggle('flip', x > u.width * 0.62); });
    },
    onLoad: f => { const i = $('loadline').firstElementChild; i.style.width = f * 100 + '%'; if (f >= 1) { i.style.opacity = 0; stage.style.backgroundImage = 'none'; } },
  });

  // ---- facts and description ----
  $('facts').innerHTML = `<div class="in"><div class="head"><span class="label">${esc(L.status)}</span><h2>${esc(L.address)}, <i>${esc(L.town)}</i></h2></div>
    <div class="facts">${L.facts.map(f => `<div><b>${esc(f[0])}</b><span>${esc(f[1])}</span></div>`).join('')}</div>
    <div class="about"><div class="text">${L.description.map(p => `<p>${esc(p)}</p>`).join('')}</div><ul class="ticks">${L.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div></div>`;
  $('gallery').innerHTML = `<div class="in"><div class="head"><span class="label">Photographs</span><h2>Take a look round</h2></div><div class="shots">${L.photos.map((p, i) => `<figure><img src="${esc(p)}" alt="${esc(L.address)}, photograph ${i + 1}" loading="lazy" width="960" height="600"></figure>`).join('')}</div>${L.photoNote ? `<p class="sample">${esc(L.photoNote)}</p>` : ''}</div>`;
  $('rooms').innerHTML = `<div class="in"><div class="head"><span class="label">Rooms</span><h2>Room by room</h2></div><table class="roomtable"><thead><tr><th scope="col">Room</th><th scope="col">Floor</th><th scope="col">Size</th></tr></thead><tbody>${L.rooms.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</tbody></table></div>`;

  // ---- the monthly cost ----
  const M = S.mortgage; let years = M.startYears;
  $('mortgage').innerHTML = `<div class="in"><div class="head"><span class="label">Mortgage</span><h2>${esc(M.title)}</h2></div>
    <div class="tool"><div class="ctl">
      <div class="field"><label for="mDown">Down payment <b id="mDownOut"></b></label><input type="range" id="mDown" min="5" max="50" step="1" value="${M.down}"></div>
      <div class="field"><label for="mRate">Interest rate <b id="mRateOut"></b></label><input type="range" id="mRate" min="2" max="9" step="0.05" value="${M.rate}"></div>
      <div class="field"><span>Paid off over</span><div class="chips" id="mYears">${M.years.map(y => `<button type="button" aria-pressed="${y === years}">${y} years</button>`).join('')}</div></div>
    </div><div class="result"><span class="label">Each month</span><output id="mOut" for="mDown mRate"></output><small id="mSplit"></small><small>${esc(M.note)}</small></div></div></div>`;
  function cost() {
    const down = Number($('mDown').value) / 100, rate = Number($('mRate').value) / 100, loan = L.price * (1 - down), n = years * 12;
    // the rate for one month: Canadian fixed mortgages compound twice a year, most others monthly
    const r = M.compounding === 'semi-annual' ? Math.pow(1 + rate / 2, 1 / 6) - 1 : rate / 12, pay = r === 0 ? loan / n : (loan * r) / (1 - Math.pow(1 + r, -n)), tax = (M.taxPerYear || 0) / 12;
    $('mDownOut').textContent = Math.round(down * 100) + '% · ' + money(L.price * down); $('mRateOut').textContent = (rate * 100).toFixed(2) + '%';
    $('mOut').textContent = money(pay + tax); $('mSplit').textContent = `${money(pay)} mortgage on ${money(loan)}${tax ? ' + ' + money(tax) + ' property tax' : ''}`;
  }
  $('mDown').addEventListener('input', cost); $('mRate').addEventListener('input', cost);
  $('mYears').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; years = parseInt(b.textContent, 10); [...$('mYears').children].forEach(x => x.setAttribute('aria-pressed', String(x === b))); cost(); }); cost();

  // ---- the agent and the viewing form ----
  $('contact').innerHTML = `<div class="in"><div class="head"><span class="label">Viewings</span><h2>${esc(S.contact.title)}</h2><p>${esc(S.contact.sub)}</p></div>
    <div class="contact"><div class="side"><span class="open">${esc(L.openHouse)}</span>
      <div class="telrow"><a class="tel" href="tel:${tel}">${esc(A.phone)}</a><button type="button" class="copy" id="copyTel">Copy number</button></div>
      <div class="agent"><b>${esc(A.name)}</b><span>${esc(A.brokerage)} · ${esc(A.licence)}</span><span>${esc(A.email)}</span></div>
      <p><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(L.mapQuery)}" target="_blank" rel="noopener">${esc(L.address)}, ${esc(L.town)}: open in maps</a></p></div>
    <form id="bookForm" novalidate><div class="two"><label for="fName">Name<input id="fName" name="name" autocomplete="name" required></label><label for="fPhone">Phone<input id="fPhone" name="phone" type="tel" autocomplete="tel" required></label></div>
      <label for="fWhen">When would suit?<input id="fWhen" name="when" placeholder="Saturday afternoon"></label>
      <label for="fMsg">Questions for the agent<textarea id="fMsg" name="message"></textarea></label>
      <div><button class="btn" type="submit">Request a viewing</button></div><p class="note" id="formNote" role="status"></p></form></div></div>`;
  $('copyTel').addEventListener('click', () => {
    const b = $('copyTel'), ok = () => { b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy number'; }, 1600); };
    const pick = () => { const r = document.createRange(); r.selectNodeContents(document.querySelector('.tel')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Number selected'; };
    try { navigator.clipboard.writeText(A.phone).then(ok, pick); } catch (e) { pick(); }
  });
  $('bookForm').addEventListener('submit', e => {
    e.preventDefault();
    const note = $('formNote'), say = t => { note.textContent = t; note.classList.add('show'); }, f = e.target;
    if (!f.name.value.trim() || !f.phone.value.trim()) return say('Please add your name and a phone number so the agent can confirm.');
    if (!S.contact.endpoint) return say('This is a demo, so nothing was sent. Add a form address in site.config.js (contact.endpoint) and requests will reach the agent.');
    say('Sending…');
    fetch(S.contact.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ listing: L.address, ...Object.fromEntries(new FormData(f)) }) })
      .then(r => { if (!r.ok) throw new Error(r.status); f.reset(); say('Thanks. The agent will be in touch to confirm your viewing.'); })
      .catch(() => say('That did not go through. Please call ' + A.phone + ' instead.'));
  });
  document.addEventListener('click', e => { const a = e.target.closest('a[href^="#"]'); if (!a) return; const t = document.getElementById(a.getAttribute('href').slice(1)); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); } });
})();
