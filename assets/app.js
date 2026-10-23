// Small progressive enhancements. The site works without this file.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hide images that fail to load; their soft placeholder background shows instead.
  const markMissing = (img) => img.classList.add('is-missing');
  $$('img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) markMissing(img);
    else img.addEventListener('error', () => markMissing(img), { once: true });
  });

  // Magazine slider: soft crossfade, auto-advance, pause on hover/focus, swipe.
  $$('[data-slider]').forEach((root) => {
    const slides = $$('[data-slide]', root);
    const dots = $$('[data-dot]', root);
    if (slides.length < 2) return;
    let index = 0;
    let timer = null;
    const show = (i) => {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => {
        const on = n === index;
        s.classList.toggle('is-active', on);
        s.toggleAttribute('aria-hidden', !on);
        $$('a, button', s).forEach((el) => (on ? el.removeAttribute('tabindex') : el.setAttribute('tabindex', '-1')));
      });
      dots.forEach((d, n) => d.setAttribute('aria-current', String(n === index)));
    };
    const play = () => { if (!reduce) { stop(); timer = setInterval(() => show(index + 1), 7000); } };
    const stop = () => clearInterval(timer);
    $('[data-prev]', root)?.addEventListener('click', () => { show(index - 1); play(); });
    $('[data-next]', root)?.addEventListener('click', () => { show(index + 1); play(); });
    dots.forEach((d) => d.addEventListener('click', () => { show(Number(d.dataset.dot)); play(); }));
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', play);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', play);
    let x0 = null;
    root.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) { show(index + (dx < 0 ? 1 : -1)); play(); }
      x0 = null;
    });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()));
    play();
  });

  // Masthead settles into a compact state once the page scrolls.
  const masthead = $('[data-masthead]');
  const progress = $('[data-progress]');
  const prose = $('.prose');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      masthead?.classList.toggle('is-scrolled', scrollY > 40);
      if (progress && prose) {
        const r = prose.getBoundingClientRect();
        const total = r.height - innerHeight * 0.6;
        const done = Math.min(1, Math.max(0, -r.top / Math.max(total, 1)));
        progress.style.transform = `scaleX(${done})`;
      }
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Overlays: open/close with a soft fade, trap focus loosely, close on Escape.
  const overlay = (el) => {
    let lastFocus = null;
    const open = () => {
      lastFocus = document.activeElement;
      el.hidden = false;
      document.documentElement.style.overflow = 'hidden';
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-open')));
      setTimeout(() => ($('input', el) || $('a, button', el))?.focus(), 60);
    };
    const close = () => {
      el.classList.remove('is-open');
      document.documentElement.style.overflow = '';
      setTimeout(() => { el.hidden = true; }, reduce ? 0 : 420);
      lastFocus?.focus?.();
    };
    el.addEventListener('click', (e) => { if (e.target === el) close(); });
    el.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    return { open, close };
  };

  const drawerEl = $('[data-drawer]');
  if (drawerEl) {
    const drawer = overlay(drawerEl);
    $$('[data-menu-open]').forEach((b) => b.addEventListener('click', drawer.open));
    $$('[data-menu-close]').forEach((b) => b.addEventListener('click', drawer.close));
  }

  const searchEl = $('[data-search]');
  if (searchEl) {
    const search = overlay(searchEl);
    const input = $('[data-search-input]', searchEl);
    const results = $('[data-search-results]', searchEl);
    const index = window.__SEARCH_INDEX__ || [];
    const home = $('.logo')?.getAttribute('href') || './';
    const base = home.replace(/index\.html$/, '');
    const usesIndex = /index\.html$/.test(home);
    const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    const render = () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { results.innerHTML = ''; return; }
      const words = q.split(/\s+/);
      const hits = index.filter((p) => words.every((w) => (p.t + ' ' + p.c).toLowerCase().includes(w))).slice(0, 8);
      results.innerHTML = hits.length
        ? hits.map((p) => `<li><a href="${base}${p.s}/${usesIndex ? 'index.html' : ''}"><span>${esc(p.c)}</span><strong>${esc(p.t)}</strong></a></li>`).join('')
        : `<li class="search__empty">No articles match “${esc(input.value.trim())}”. Try a company name or a topic like funding.</li>`;
    };
    input.addEventListener('input', render);
    $$('[data-search-open]').forEach((b) => b.addEventListener('click', search.open));
    $$('[data-search-close]').forEach((b) => b.addEventListener('click', search.close));
    addEventListener('keydown', (e) => {
      if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); search.open(); }
    });
  }
})();
