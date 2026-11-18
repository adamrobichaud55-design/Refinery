// Builds the stay's page from site.config.js: the film's captions, what is there, photographs, and a calendar
// that prices any free dates the visitor picks.
(function () {
  'use strict';
  const S = window.SITE, T = S.stay, H = S.host, B = S.booking, $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tel = H.phone.replace(/[^\d+]/g, ''), root = document.documentElement, money = n => B.currency + Math.round(n).toLocaleString('en-US');
  if (S.accent) root.style.setProperty('--accent', S.accent);
  document.title = T.name + ', ' + T.place;
  $('mark').textContent = T.name; $('barCall').textContent = S.hero.cta; $('barCall').href = '#book';
  $('foot').innerHTML = `<span>${esc(T.name)}, ${esc(T.place)}</span><span>Hosted by ${esc(H.name)}</span><span>${esc(H.email)}</span>`;

  // ---- the film ----
  const hero = { id: 'hero', frames: [0, 36], hero: true }, chapters = [hero, ...S.chapters];
  $('panels').innerHTML = chapters.map(c => c.hero
    ? `<div class="panel hero"><span class="label">${esc(T.kind)} · ${esc(T.place)}</span><h1>${esc(T.name)}</h1><p>${esc(T.summary)}</p><div class="from"><b>${money(B.nightly)}</b>a night · ${esc(T.facts.slice(0, 2).map(f => f[0] + ' ' + f[1].toLowerCase()).join(' · '))}</div><a class="btn" href="#book">${esc(S.hero.cta)}</a><span class="hint">${esc(S.hero.hint)}</span></div>`
    : `<div class="panel" style="--dot:${esc(c.color || S.accent)}"><span class="label">${esc(c.label)}</span><h2>${esc(c.title)}</h2><p>${esc(c.body)}</p>${c.cta ? `<a class="btn" href="#book">${esc(c.cta)}</a>` : ''}</div>`).join('');
  const callouts = [];
  $('callouts').innerHTML = S.chapters.map(c => (c.callouts || []).map((k, n) => { callouts.push({ ch: c, k }); return `<div class="callout${n % 2 ? ' low' : ''}" style="--dot:${esc(c.color || S.accent)}"><i></i><b></b><span>${esc(k.text)}</span></div>`; }).join('')).join('');
  $('rail').innerHTML = S.chapters.map(c => `<li style="--dot:${esc(c.color || S.accent)}">${esc(c.label)}</li>`).join('');
  const panelEls = [...$('panels').children], calloutEls = [...$('callouts').children], railEls = [...$('rail').children];
  const vis = (c, f) => { const [a, b] = c.frames, e = 5; return c.hero ? Math.min(1, Math.max(0, (b - f) / e)) : Math.min(1, Math.max(0, Math.min((f - a) / e, (b - f) / e))); };
  const stage = $('stage'), bg = getComputedStyle(root).getPropertyValue('--bg').trim() || '#010205';
  stage.style.backgroundImage = `url(frames/poster-${innerHeight > innerWidth * 1.05 ? 'port' : 'land'}.jpg)`;
  window.ScrollFilm({
    canvas: $('filmCanvas'), section: $('film'), base: 'frames/', bg,
    scale: o => (o.portrait ? Math.min(o.cover, (o.width / o.w) * 1.12) : Math.min(o.cover, (o.width / o.w) * 0.88, (o.height / o.h) * 1.05)),
    shift: (portrait, w) => (portrait ? [0, 0.045] : [w > 820 ? 0.13 : 0, 0.02]),
    onUpdate(u) {
      chapters.forEach((c, i) => { const o = vis(c, u.frame), el = panelEls[i]; el.style.setProperty('--o', o.toFixed(3)); el.classList.toggle('on', o > 0.02); });
      S.chapters.forEach((c, i) => railEls[i].classList.toggle('on', u.frame >= c.frames[0] - 4 && u.frame <= c.frames[1] + 2));
      callouts.forEach((c, i) => { const a = u.anchors[c.k.anchor], el = calloutEls[i], o = a && a[2] ? vis(c.ch, u.frame) : 0; el.style.setProperty('--o', o.toFixed(3)); if (!a || o <= 0) return; const [x, y] = u.place(a[0], a[1]); el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`; el.classList.toggle('flip', x > u.width * 0.62); });
    },
    onLoad: f => { const i = $('loadline').firstElementChild; i.style.width = f * 100 + '%'; if (f >= 1) { i.style.opacity = 0; stage.style.backgroundImage = 'none'; } },
  });

  // ---- what is there ----
  $('about').innerHTML = `<div class="in"><div class="head"><span class="label">${esc(T.kind)}</span><h2>${esc(T.name)}, <i>${esc(T.place)}</i></h2></div>
    <div class="facts">${T.facts.map(f => `<div><b>${esc(f[0])}</b><span>${esc(f[1])}</span></div>`).join('')}</div>
    <div class="about"><div class="text">${T.description.map(p => `<p>${esc(p)}</p>`).join('')}<dl class="rules">${T.rules.map(r => `<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join('')}</dl></div><ul class="ticks">${T.amenities.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div></div>`;
  $('gallery').innerHTML = `<div class="in"><div class="head"><span class="label">Photographs</span><h2>Have a look round</h2></div><div class="shots">${T.photos.map((p, i) => `<figure><img src="${esc(p)}" alt="${esc(T.name)}, photograph ${i + 1}" loading="lazy" width="960" height="600"></figure>`).join('')}</div><p class="sample">Sample pictures of a model house. Replace them with photographs of the stay.</p></div>`;

  // ---- calendar and price ----
  const D = s => new Date(s + 'T00:00:00Z'), iso = d => d.toISOString().slice(0, 10), add = (d, n) => new Date(d.getTime() + n * 864e5);
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const booked = new Set(); for (const [a, b] of B.booked) for (let d = D(a); d <= D(b); d = add(d, 1)) booked.add(iso(d));
  const first = D(B.start + '-01'); let view = 0, guests = 2, inDay = null, outDay = null, msg = '';
  const nice = s => { const d = D(s); return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)}`; };
  /** the nights from a to b (b not included) are all free */
  const free = (a, b) => { for (let d = D(a); d < D(b); d = add(d, 1)) if (booked.has(iso(d))) return false; return true; };
  // open on the first free weekend that meets the minimum stay
  for (let d = first, k = 0; k < 120 && !inDay; d = add(d, 1), k++) if (d.getUTCDay() === 5 && free(iso(d), iso(add(d, B.minNights)))) { inDay = iso(d); outDay = iso(add(d, B.minNights)); }
  $('book').innerHTML = `<div class="in"><div class="head"><span class="label">Availability</span><h2>${esc(B.title)}</h2><p>${esc(B.note)}</p></div>
    <div class="booker"><div class="cal"><div class="calhead"><button type="button" id="calPrev" aria-label="Earlier months">←</button><span class="label" id="calNote"></span><button type="button" id="calNext" aria-label="Later months">→</button></div><div class="months" id="months"></div>
      <div class="legend"><span>Tap a first night, then the morning you leave</span><span><s>12</s> booked</span></div></div>
    <div class="bill"><div class="dates"><div><span>Check in</span><b id="bIn"></b></div><div><span>Check out</span><b id="bOut"></b></div></div>
      <div class="guests"><span>Guests</span><div class="step"><button type="button" id="gLess" aria-label="Fewer guests">−</button><b id="gNum"></b><button type="button" id="gMore" aria-label="More guests">+</button></div></div>
      <dl class="lines" id="lines"></dl>
      <form id="bookForm" novalidate><div class="two"><label for="fName">Name<input id="fName" name="name" autocomplete="name" required></label><label for="fPhone">Phone or email<input id="fPhone" name="contact" required></label></div>
        <label for="fMsg">Anything the host should know<textarea id="fMsg" name="message"></textarea></label>
        <div><button class="btn" type="submit">Request to book</button></div><p class="note" id="formNote" role="status"></p></form>
      <div class="hostline"><b>${esc(H.name)}</b><span>${esc(H.line)}</span><a class="tel" href="tel:${tel}">${esc(H.phone)}</a></div>
      ${S.platformLink && S.platformLink.url ? `<p><a href="${esc(S.platformLink.url)}" target="_blank" rel="noopener">${esc(S.platformLink.label)}</a></p>` : ''}</div></div></div>`;
  function month(k) {
    const m0 = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + k, 1)), n = new Date(Date.UTC(m0.getUTCFullYear(), m0.getUTCMonth() + 1, 0)).getUTCDate();
    let h = `<div class="month"><h3>${MONTHS[m0.getUTCMonth()]} ${m0.getUTCFullYear()}</h3><div class="grid7">${DAYS.map(d => `<span>${d[0]}</span>`).join('')}${'<i></i>'.repeat(m0.getUTCDay())}`;
    for (let d = 1; d <= n; d++) {
      const s = iso(new Date(Date.UTC(m0.getUTCFullYear(), m0.getUTCMonth(), d))), isOut = inDay && !outDay && s > inDay;
      // a booked night cannot start a stay, but its morning can end one
      const off = booked.has(s) && !(isOut && free(inDay, s)), cls = s === inDay || s === outDay ? 'end' : inDay && outDay && s > inDay && s < outDay ? 'in' : '';
      h += `<button type="button" data-d="${s}" class="${cls}"${off ? ' disabled' : ''} aria-label="${nice(s)}${booked.has(s) ? ', booked' : ''}">${d}</button>`;
    }
    return h + '</div></div>';
  }
  function draw() {
    $('months').innerHTML = month(view) + month(view + 1); $('calPrev').disabled = view === 0; $('gNum').textContent = guests;
    $('bIn').textContent = inDay ? nice(inDay) : 'Pick a date'; $('bOut').textContent = outDay ? nice(outDay) : inDay ? 'Pick a date' : '';
    $('calNote').textContent = msg || (inDay && !outDay ? 'Now the morning you leave' : `${B.minNights} nights or more`);
    if (!(inDay && outDay)) { $('lines').innerHTML = `<dt>${money(B.nightly)} a night, ${money(B.weekendNightly)} on Fridays and Saturdays</dt><dd></dd>`; return; }
    let nights = 0, week = 0, wkend = 0; for (let d = D(inDay); d < D(outDay); d = add(d, 1)) { nights++; if (d.getUTCDay() === 5 || d.getUTCDay() === 6) wkend++; else week++; }
    const stay = week * B.nightly + wkend * B.weekendNightly, tax = ((stay + B.cleaning) * B.taxPercent) / 100;
    $('lines').innerHTML = (week ? `<dt>${week} ${week === 1 ? 'night' : 'nights'} at ${money(B.nightly)}</dt><dd>${money(week * B.nightly)}</dd>` : '') + (wkend ? `<dt>${wkend} weekend ${wkend === 1 ? 'night' : 'nights'} at ${money(B.weekendNightly)}</dt><dd>${money(wkend * B.weekendNightly)}</dd>` : '')
      + `<dt>Cleaning</dt><dd>${money(B.cleaning)}</dd><dt>Tax (${B.taxPercent}%)</dt><dd>${money(tax)}</dd><dt class="total">Total for ${nights} nights</dt><dd class="total">${money(stay + B.cleaning + tax)}</dd>`;
  }
  $('months').addEventListener('click', e => {
    const b = e.target.closest('button[data-d]'); if (!b || b.disabled) return; const s = b.dataset.d; msg = '';
    if (!inDay || outDay || s <= inDay) { inDay = booked.has(s) ? null : s; outDay = null; }
    else if (!free(inDay, s)) { msg = 'Those dates cross a booking'; inDay = booked.has(s) ? null : s; }
    else if ((D(s) - D(inDay)) / 864e5 < B.minNights) msg = `${B.minNights} nights or more`;
    else outDay = s;
    draw();
  });
  $('calPrev').addEventListener('click', () => { view = Math.max(0, view - 1); draw(); }); $('calNext').addEventListener('click', () => { view = Math.min(10, view + 1); draw(); });
  $('gLess').addEventListener('click', () => { guests = Math.max(1, guests - 1); draw(); }); $('gMore').addEventListener('click', () => { guests = Math.min(B.maxGuests, guests + 1); draw(); });
  $('bookForm').addEventListener('submit', e => {
    e.preventDefault();
    const note = $('formNote'), say = t => { note.textContent = t; note.classList.add('show'); }, f = e.target;
    if (!(inDay && outDay)) return say('Pick your dates on the calendar first.');
    if (!f.name.value.trim() || !f.contact.value.trim()) return say('Please add your name and a phone number or email so the host can reply.');
    if (!S.contact.endpoint) return say(`This is a demo, so nothing was sent. With a form address in site.config.js (contact.endpoint), the host would receive: ${nice(inDay)} to ${nice(outDay)}, ${guests} guests.`);
    say('Sending…');
    fetch(S.contact.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ stay: T.name, checkIn: inDay, checkOut: outDay, guests, ...Object.fromEntries(new FormData(f)) }) })
      .then(r => { if (!r.ok) throw new Error(r.status); f.reset(); say('Thanks. The host has your request and will confirm shortly. Nothing is charged until they do.'); })
      .catch(() => say('That did not go through. Please call ' + H.phone + ' instead.'));
  });
  draw();

  $('reviews').innerHTML = `<div class="in"><div class="head"><span class="label">Reviews</span><h2>${esc(S.reviews.title)}</h2></div><div class="quotes">${S.reviews.items.map(r => `<blockquote><p>${esc(r.text)}</p><cite>${esc(r.who)}</cite></blockquote>`).join('')}</div></div>`;
  document.addEventListener('click', e => { const a = e.target.closest('a[href^="#"]'); if (!a) return; const t = document.getElementById(a.getAttribute('href').slice(1)); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); } });
})();
