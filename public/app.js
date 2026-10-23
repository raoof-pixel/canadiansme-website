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
