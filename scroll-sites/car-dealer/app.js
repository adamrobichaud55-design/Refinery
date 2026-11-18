// Builds the dealer's page from site.config.js: the film's captions and price tags, the finder, the stock,
// the two-car comparison and the monthly-payment sum.
(function () {
  'use strict';
  const S = window.SITE, $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tel = S.business.phone.replace(/[^\d+]/g, ''), root = document.documentElement;
  const money = n => S.currency + Math.round(n).toLocaleString('en-US'), num = n => Math.round(n).toLocaleString('en-US');
  if (S.accent) root.style.setProperty('--accent', S.accent);
  document.title = S.business.name;
  $('mark').textContent = S.business.short || S.business.name;
  $('barCall').textContent = S.business.phone; $('barCall').href = 'tel:' + tel;
  $('foot').innerHTML = `<span>${esc(S.business.name)}</span><span>${esc(S.business.address)}</span><span>${esc(S.business.licence)}</span>`;
  const specLine = c => [c.year, num(c.miles) + ' ' + S.distance, c.fuel, c.gearbox].map(esc).join(' · ');

  // ---- the film ----
  const hero = { id: 'hero', frames: [0, 36], hero: true }, chapters = [hero, ...S.chapters];
  $('panels').innerHTML = chapters.map(c => {
    if (c.hero) return `<div class="panel"><span class="label">${esc(S.hero.kicker)}</span><h1 class="big">${esc(S.hero.title)}</h1><p>${esc(S.hero.sub)}</p><a class="btn" href="#stock">${esc(S.hero.cta)}</a><span class="hint">${esc(S.hero.hint)}</span></div>`;
    if (c.stock != null) { const k = S.stock[c.stock]; return `<div class="panel"><span class="label">${esc(c.label)}</span><h2 class="big">${esc(k.name)}</h2><div class="spec"><span>${specLine(k)}</span></div><p>${esc(k.line)}</p><div class="price">${money(k.price)}</div><a class="btn line" href="#finance" data-pay="${c.stock}">Work out payments</a></div>`; }
    return `<div class="panel"><span class="label">${esc(c.label)}</span><h2 class="big">${esc(c.title)}</h2><p>${esc(c.body)}</p>${c.cta ? `<a class="btn" href="#finder">${esc(c.cta)}</a>` : ''}</div>`;
  }).join('');
  const tagged = S.chapters.filter(c => c.anchor && c.stock != null);
  $('tags').innerHTML = tagged.map(c => `<div class="tag"><span>${money(S.stock[c.stock].price)}</span></div>`).join('');
  const panelEls = [...$('panels').children], tagEls = [...$('tags').children];
  const vis = (c, f) => { const [a, b] = c.frames, e = 5; return c.hero ? Math.min(1, Math.max(0, (b - f) / e)) : Math.min(1, Math.max(0, Math.min((f - a) / e, (b - f) / e))); };
  const stage = $('stage'), bg = getComputedStyle(root).getPropertyValue('--bg').trim() || '#020104';
  stage.style.backgroundImage = `url(frames/poster-${innerHeight > innerWidth * 1.05 ? 'port' : 'land'}.jpg)`;
  window.ScrollFilm({
    canvas: $('filmCanvas'), section: $('film'), base: 'frames/', bg,
    onUpdate(u) {
      chapters.forEach((c, i) => { const o = vis(c, u.frame), el = panelEls[i]; el.style.setProperty('--o', o.toFixed(3)); el.classList.toggle('on', o > 0.02); });
      tagged.forEach((c, i) => { const a = u.anchors[c.anchor], el = tagEls[i], o = a && a[2] ? vis(c, u.frame) : 0; el.style.setProperty('--o', o.toFixed(3)); if (a && o > 0) { const [x, y] = u.place(a[0], a[1]); el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`; } });
    },
    onLoad: f => { const i = $('loadline').firstElementChild; i.style.width = f * 100 + '%'; if (f >= 1) { i.style.opacity = 0; stage.style.backgroundImage = 'none'; } },
  });

  // ---- finder + stock ----
  const bodies = ['Any', ...new Set(S.stock.map(c => c.body))], maxP = Math.ceil(Math.max(...S.stock.map(c => c.price)) / 1000) * 1000, minP = Math.floor(Math.min(...S.stock.map(c => c.price)) / 1000) * 1000;
  const maxM = Math.ceil(Math.max(...S.stock.map(c => c.miles)) / 5000) * 5000, minM = Math.floor(Math.min(...S.stock.map(c => c.miles)) / 5000) * 5000;
  const F = { body: 'Any', price: maxP, miles: maxM }, picked = [0, 1];
  $('finder').innerHTML = `<div class="in"><div class="head"><span class="label">Finder</span><h2 class="big">${esc(S.finder.title)}</h2><p>${esc(S.finder.sub)}</p></div>
    <div class="box finder">
      <div class="field"><span>Shape</span><div class="chips" id="fBody">${bodies.map(b => `<button type="button" aria-pressed="${b === 'Any'}">${esc(b)}</button>`).join('')}</div></div>
      <div class="field"><label for="fPrice">Budget up to <b id="fPriceOut"></b></label><input type="range" id="fPrice" min="${minP}" max="${maxP}" step="500" value="${maxP}"></div>
      <div class="field"><label for="fMiles">No more than <b id="fMilesOut"></b></label><input type="range" id="fMiles" min="${minM}" max="${maxM}" step="5000" value="${maxM}"></div>
      <div class="count"><span id="fCount"></span><small>on the lot</small></div>
    </div></div>`;
  $('stock').innerHTML = `<div class="in"><div class="head"><span class="label">Stock</span><h2 class="big">${esc(S.stockTitle)}</h2></div><div class="cards" id="cards"></div></div>`;
  function drawStock() {
    const list = S.stock.map((c, i) => [c, i]).filter(([c]) => (F.body === 'Any' || c.body === F.body) && c.price <= F.price && c.miles <= F.miles);
    $('fPriceOut').textContent = money(F.price); $('fMilesOut').textContent = num(F.miles) + ' ' + S.distance; $('fCount').textContent = list.length;
    $('cards').innerHTML = list.length ? list.map(([c, i]) => `<article class="card${picked.includes(i) ? ' picked' : ''}"><img src="${esc(c.img)}" alt="${esc(c.name)}" loading="lazy" width="720" height="450">
      <div class="body"><h3>${esc(c.name)}</h3><span class="meta">${specLine(c)}</span><div class="row"><span class="p">${money(c.price)}</span>
      <span class="acts"><button type="button" class="btn line small" data-cmp="${i}" aria-pressed="${picked.includes(i)}">Compare</button><button type="button" class="btn line small" data-pay="${i}">Payments</button></span></div></div></article>`).join('')
      : '<p class="none">Nothing matches that today. Widen the budget or the mileage, or call us: stock changes every week.</p>';
  }
  $('fBody').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; F.body = b.textContent; [...$('fBody').children].forEach(x => x.setAttribute('aria-pressed', String(x === b))); drawStock(); });
  $('fPrice').addEventListener('input', e => { F.price = Number(e.target.value); drawStock(); });
  $('fMiles').addEventListener('input', e => { F.miles = Number(e.target.value); drawStock(); });

  // ---- compare two ----
  const opts = sel => S.stock.map((c, i) => `<option value="${i}"${i === sel ? ' selected' : ''}>${esc(c.name)} · ${money(c.price)}</option>`).join('');
  $('compare').innerHTML = `<div class="in"><div class="head"><span class="label">Compare</span><h2 class="big">${esc(S.compare.title)}</h2><p>${esc(S.compare.sub)}</p></div>
    <div class="box duel"><div class="picks"><div class="field"><label for="cA">First car</label><select id="cA">${opts(0)}</select></div><div class="field"><label for="cB">Second car</label><select id="cB">${opts(1)}</select></div></div>
    <div id="duel"></div><p class="verdict" id="verdict"></p></div></div>`;
  function drawDuel() {
    const a = S.stock[picked[0]], b = S.stock[picked[1]];
    const rows = [['Price', a.price, b.price, money, -1], ['Year', a.year, b.year, String, 1], [S.distance[0].toUpperCase() + S.distance.slice(1), a.miles, b.miles, num, -1], ['Economy', a.mpg, b.mpg, v => v + ' mpg', 1], ['Fuel', a.fuel, b.fuel, String, 0], ['Gearbox', a.gearbox, b.gearbox, String, 0]];
    let wa = 0, wb = 0;
    const body = rows.map(([n, x, y, fmt, dir]) => { const w = dir && x !== y ? ((x - y) * dir > 0 ? 'a' : 'b') : ''; if (w === 'a') wa++; if (w === 'b') wb++; return `<tr><th scope="row">${esc(n)}</th><td class="${w === 'a' ? 'win' : ''}">${esc(fmt(x))}</td><td class="${w === 'b' ? 'win' : ''}">${esc(fmt(y))}</td></tr>`; }).join('');
    $('duel').innerHTML = `<table><thead><tr><th></th><td>${esc(a.name)}</td><td>${esc(b.name)}</td></tr></thead><tbody>${body}</tbody></table>`;
    $('verdict').innerHTML = picked[0] === picked[1] ? 'Pick two different cars to compare.' : wa === wb ? 'Level on the numbers. Come and drive both.' : `On the numbers, the <b>${esc((wa > wb ? a : b).name)}</b> wins ${Math.max(wa, wb)} lines to ${Math.min(wa, wb)}.`;
    $('cA').value = picked[0]; $('cB').value = picked[1];
  }
  $('cA').addEventListener('change', e => { picked[0] = Number(e.target.value); drawDuel(); drawStock(); });
  $('cB').addEventListener('change', e => { picked[1] = Number(e.target.value); drawDuel(); drawStock(); });

  // ---- monthly payments ----
  const P = S.finance; let term = P.startTerm, payCar = 0;
  $('finance').innerHTML = `<div class="in"><div class="head"><span class="label">Finance</span><h2 class="big">${esc(P.title)}</h2></div>
    <div class="box pay"><div class="ctl">
      <div class="field"><label for="pCar">Car</label><select id="pCar">${opts(0)}</select></div>
      <div class="field"><label for="pDep">Deposit <b id="pDepOut"></b></label><input type="range" id="pDep" min="0" max="10000" step="250" value="${P.startDeposit}"></div>
      <div class="field"><span>Months</span><div class="chips" id="pTerm">${P.terms.map(t => `<button type="button" aria-pressed="${t === term}">${t}</button>`).join('')}</div></div>
    </div><div class="out"><span class="label">Each month</span><output id="pOut" for="pCar pDep"></output>
      <dl><dt>Borrowed</dt><dd id="pLoan"></dd><dt>Interest</dt><dd id="pInt"></dd><dt>Total you pay</dt><dd id="pTot"></dd><dt>Rate</dt><dd>${P.apr}% APR, fixed</dd></dl><p class="small">${esc(P.note)}</p></div></div></div>`;
  function drawPay() {
    const car = S.stock[payCar], dep = Math.min(Number($('pDep').value), car.price), loan = car.price - dep, r = P.apr / 100 / 12;
    const m = loan <= 0 ? 0 : r === 0 ? loan / term : (loan * r) / (1 - Math.pow(1 + r, -term));   // the standard repayment sum
    $('pDep').max = Math.floor(car.price / 250) * 250; $('pDepOut').textContent = money(dep);
    $('pOut').innerHTML = `${money(m)}<small> / month</small>`; $('pLoan').textContent = money(loan); $('pInt').textContent = money(m * term - loan); $('pTot').textContent = money(m * term + dep);
    $('pCar').value = payCar;
  }
  $('pCar').addEventListener('change', e => { payCar = Number(e.target.value); drawPay(); });
  $('pDep').addEventListener('input', drawPay);
  $('pTerm').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; term = Number(b.textContent); [...$('pTerm').children].forEach(x => x.setAttribute('aria-pressed', String(x === b))); drawPay(); });

  // buttons on the cards and the film: compare this car, or work out its payments
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-cmp]'), p = e.target.closest('[data-pay]');
    if (c) { const i = Number(c.dataset.cmp); if (!picked.includes(i)) { picked[0] = picked[1]; picked[1] = i; } drawDuel(); drawStock(); $('compare').scrollIntoView({ behavior: 'smooth' }); }
    if (p) { payCar = Number(p.dataset.pay); drawPay(); if (p.tagName !== 'A') $('finance').scrollIntoView({ behavior: 'smooth' }); }
  });

  // ---- contact ----
  $('contact').innerHTML = `<div class="in"><div class="head"><span class="label">Visit</span><h2 class="big">${esc(S.contact.title)}</h2><p>${esc(S.contact.sub)}</p></div>
    <div class="contact"><div class="side"><div class="telrow"><a class="tel" href="tel:${tel}">${esc(S.business.phone)}</a><button type="button" class="copy" id="copyTel">Copy number</button></div>
      <p>${esc(S.business.address)}<br><span style="color:var(--muted)">${esc(S.business.email)}</span></p><dl class="hours">${S.business.hours.map(h => `<dt>${esc(h[0])}</dt><dd>${esc(h[1])}</dd>`).join('')}</dl></div>
    <form id="bookForm" novalidate><div class="two"><label for="fName">Name<input id="fName" name="name" autocomplete="name" required></label><label for="fPhone">Phone<input id="fPhone" name="phone" type="tel" autocomplete="tel" required></label></div>
      <label for="fCar">Which car?<select id="fCar" name="car">${S.stock.map(c => `<option>${esc(c.name)}</option>`).join('')}</select></label>
      <label for="fMsg">Anything to add (part exchange, a time that suits)<textarea id="fMsg" name="message"></textarea></label>
      <div><button class="btn" type="submit">Book a test drive</button></div><p class="note" id="formNote" role="status"></p></form></div></div>`;
  $('copyTel').addEventListener('click', () => {
    const b = $('copyTel'), ok = () => { b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy number'; }, 1600); };
    const pick = () => { const r = document.createRange(); r.selectNodeContents(document.querySelector('.tel')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Number selected'; };
    try { navigator.clipboard.writeText(S.business.phone).then(ok, pick); } catch (e) { pick(); }
  });
  $('bookForm').addEventListener('submit', e => {
    e.preventDefault();
    const note = $('formNote'), say = t => { note.textContent = t; note.classList.add('show'); }, f = e.target;
    if (!f.name.value.trim() || !f.phone.value.trim()) return say('Please add your name and a phone number so we can confirm the time.');
    if (!S.contact.endpoint) return say('This is a demo, so nothing was sent. Add a form address in site.config.js (contact.endpoint) and requests will arrive there.');
    say('Sending…');
    fetch(S.contact.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(f))) })
      .then(r => { if (!r.ok) throw new Error(r.status); f.reset(); say('Thanks. We will ring you to confirm the test drive.'); })
      .catch(() => say('That did not go through. Please call us on ' + S.business.phone + ' instead.'));
  });
  document.addEventListener('click', e => { const a = e.target.closest('a[href^="#"]'); if (!a) return; const t = document.getElementById(a.getAttribute('href').slice(1)); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); } });
  drawStock(); drawDuel(); drawPay();
})();
