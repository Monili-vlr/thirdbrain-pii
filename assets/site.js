// ThirdBrain-PII site: menu, video on click, lightbox, interactive replay. No cookies, no storage, no outside calls.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mobile menu
  const btn = $('.menu-btn'), nav = $('nav.main');
  if (btn && nav) {
    btn.addEventListener('click', () => { const o = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', String(o)); });
    $$('a', nav).forEach((a) => a.addEventListener('click', () => { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }));
  }

  // Video: loaded only on click; the same click starts it with sound.
  $$('.video[data-src]').forEach((box) => {
    const b = $('button', box);
    b.addEventListener('click', () => {
      const v = document.createElement('video');
      v.src = box.dataset.src; v.controls = true; v.playsInline = true; v.preload = 'auto';
      v.poster = box.dataset.poster || '';
      v.setAttribute('aria-label', box.dataset.label || 'Product video');
      box.replaceChildren(v);
      v.muted = false; v.volume = 1;
      const p = v.play(); if (p) p.catch(() => {});
      v.focus();
    });
  });

  // Lightbox for the gallery and feature images
  const dlg = $('dialog.lightbox');
  if (dlg) {
    const items = $$('[data-lb]');
    let i = 0;
    const img = $('img', dlg), cap = $('.lb-cap', dlg);
    const show = (k) => { i = (k + items.length) % items.length; const it = items[i]; img.src = it.dataset.lb; img.alt = it.dataset.alt || ''; cap.textContent = it.dataset.cap || ''; };
    items.forEach((it, k) => it.addEventListener('click', () => { show(k); dlg.showModal(); }));
    $('.lb-prev', dlg).addEventListener('click', () => show(i - 1));
    $('.lb-next', dlg).addEventListener('click', () => show(i + 1));
    $('.lb-close', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(i - 1); if (e.key === 'ArrowRight') show(i + 1); });
  }

  // Interactive replay: recorded output of the real engine (panel 0.3.16) on three example texts.
  const demo = $('#demo-box');
  if (!demo) return;
  const T = window.TB_EXAMPLES;
  const ori = $('#d-ori'), mir = $('#d-mir'), range = $('#d-range'), play = $('#d-play'), brushBox = $('#d-brush'), count = $('#d-count');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const col = (g) => `var(--${g})`;
  let cur = 0, timer = 0;
  const len = (t) => t.reduce((a, s) => a + (typeof s === 'string' ? s.length : s[0].length), 0);
  function render() {
    const t = T[cur].segs, n = +range.value, brushed = brushBox.checked;
    let o = '', m = '', used = 0, covered = 0;
    for (const s of t) {
      if (used >= n) break;
      if (typeof s === 'string') { const p = s.slice(0, n - used); o += esc(p); m += esc(p); used += p.length; continue; }
      const [orig, ph, g, brush] = s; const p = orig.slice(0, n - used); used += p.length; const done = p.length === orig.length;
      if (brush) {
        if (brushed && g) { o += `<span class="hl" style="background:color-mix(in srgb, ${col(g)} 70%, transparent)">${esc(p)}</span>`; m += `<span class="ph" style="background:${col(g)}">${esc(ph)}</span>`; if (done) covered++; }
        else { o += esc(p); m += esc(p); }
        continue;
      }
      o += done ? `<span class="hl" style="background:color-mix(in srgb, ${col(g)} 70%, transparent)">${esc(p)}</span>` : esc(p);
      m += done ? `<span class="ph" style="background:${col(g)}">${esc(ph)}</span>` : `<span class="muted">${esc(p)}</span>`;
      if (done) covered++;
    }
    ori.innerHTML = o || '<span class="muted">…</span>'; mir.innerHTML = m || '<span class="muted">…</span>';
    count.textContent = `${covered} value${covered === 1 ? '' : 's'} replaced`;
  }
  function select(k) {
    cur = k; stop();
    $$('.demo-tabs button').forEach((b, j) => b.setAttribute('aria-selected', String(j === k)));
    $('#d-note').textContent = T[k].note;
    brushBox.parentElement.hidden = !T[k].segs.some((s) => Array.isArray(s) && s[3]);
    range.max = String(len(T[k].segs)); range.value = range.max; render();
  }
  function stop() { clearInterval(timer); timer = 0; play.textContent = '▶ Type it'; }
  play.addEventListener('click', () => {
    if (timer) return stop();
    if (+range.value >= +range.max) range.value = '0';
    play.textContent = '❚❚ Pause';
    const step = reduce ? 1e9 : 4;
    timer = setInterval(() => { range.value = String(Math.min(+range.max, +range.value + step)); render(); if (+range.value >= +range.max) stop(); }, 16);
  });
  range.addEventListener('input', () => { stop(); render(); });
  brushBox.addEventListener('change', render);
  $$('.demo-tabs button').forEach((b, k) => b.addEventListener('click', () => select(k)));
  select(0);
})();
