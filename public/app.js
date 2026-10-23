// Small progressive enhancements. The site works without this file.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Images come from WordPress's image CDN (i0.wp.com). If the CDN fails to deliver
  // one, load the original from canadiansme.ca instead; only hide it if that fails too.
  const fromOrigin = (src) => src.replace('https://i0.wp.com/', 'https://').split('?')[0];
  const handleError = (img) => {
    if (!img.dataset.retried && img.src.includes('i0.wp.com/')) {
      img.dataset.retried = '1';
      img.removeAttribute('srcset');
      img.src = fromOrigin(img.src);
      return;
    }
    img.classList.add('is-missing');
  };
  $$('img').forEach((img) => {
    img.addEventListener('error', () => handleError(img));
    img.addEventListener('load', () => img.classList.remove('is-missing'));
    // Eager images may already have failed before this script ran.
    if (img.loading !== 'lazy' && img.complete && img.naturalWidth === 0) handleError(img);
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
    const pause = () => { stop(); root.classList.add('is-paused'); };
    const resume = () => { root.classList.remove('is-paused'); play(); };
    root.addEventListener('mouseenter', pause);
    root.addEventListener('mouseleave', resume);
    root.addEventListener('focusin', pause);
    root.addEventListener('focusout', resume);
    if (reduce) root.classList.add('is-paused');
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

  // Insights: topic filters, a quick search and "show more".
  $$('[data-insights]').forEach((root) => {
    const grid = $('[data-insights-grid]', root);
    const cards = $$('[data-cat]', grid);
    const step = Number(grid.dataset.show) || 9;
    const input = $('[data-insights-search]', root);
    const empty = $('[data-insights-empty]', root);
    const more = $('[data-insights-more]', root);
    const filters = $$('[data-filter]', root);
    let cat = 'all';
    let limit = step;
    const apply = (animate) => {
      const words = (input?.value || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
      const matches = cards.filter((c) => (cat === 'all' || c.dataset.cat === cat) && words.every((w) => c.dataset.text.includes(w)));
      cards.forEach((c) => {
        const i = matches.indexOf(c);
        const wasShown = !c.classList.contains('is-filtered') && !c.classList.contains('is-folded');
        c.classList.toggle('is-filtered', i === -1);
        c.classList.toggle('is-folded', i >= limit);
        const shown = i !== -1 && i < limit;
        c.classList.toggle('is-new', Boolean(animate && shown && !wasShown));
      });
      empty.hidden = matches.length > 0;
      more.parentElement.hidden = matches.length <= limit;
    };
    filters.forEach((b) => b.addEventListener('click', () => {
      cat = b.dataset.filter;
      limit = step;
      filters.forEach((f) => { const on = f === b; f.classList.toggle('is-on', on); f.setAttribute('aria-pressed', String(on)); });
      cards.forEach((c) => c.classList.add('is-folded'));
      apply(true);
    }));
    input?.addEventListener('input', () => { limit = step; apply(false); });
    more.addEventListener('click', () => { limit += step; apply(true); });
    apply(false);
  });

  // Carousels: arrow buttons scroll one card; buttons dim at the ends.
  $$('[data-carousel]').forEach((root) => {
    const track = $('[data-car-track]', root);
    const prev = $('[data-car-prev]', root);
    const next = $('[data-car-next]', root);
    if (!track) return;
    const stepBy = () => (track.firstElementChild?.getBoundingClientRect().width || 300) + 24;
    const update = () => {
      prev.disabled = track.scrollLeft < 4;
      next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 4;
    };
    prev?.addEventListener('click', () => track.scrollBy({ left: -stepBy(), behavior: reduce ? 'auto' : 'smooth' }));
    next?.addEventListener('click', () => track.scrollBy({ left: stepBy(), behavior: reduce ? 'auto' : 'smooth' }));
    track.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  });

  // Magazine reader: opens Issuu issues on the page instead of a new tab.
  const readerEl = $('[data-reader-modal]');
  if (readerEl) {
    const frame = $('[data-reader-frame]', readerEl);
    const name = $('[data-reader-name]', readerEl);
    const out = $('[data-reader-out]', readerEl);
    let lastFocus = null;
    const close = () => {
      readerEl.classList.remove('is-open');
      document.documentElement.style.overflow = '';
      setTimeout(() => { readerEl.hidden = true; frame.src = 'about:blank'; }, reduce ? 0 : 420);
      lastFocus?.focus?.();
    };
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-reader]');
      if (!trigger || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      lastFocus = trigger;
      const doc = trigger.dataset.reader;
      frame.src = `https://e.issuu.com/embed.html?d=${encodeURIComponent(doc)}&u=canadiansme`;
      name.textContent = trigger.dataset.readerTitle || 'CanadianSME Small Business Magazine';
      out.href = trigger.dataset.readerHref || `https://issuu.com/canadiansme/docs/${doc}`;
      readerEl.hidden = false;
      document.documentElement.style.overflow = 'hidden';
      requestAnimationFrame(() => requestAnimationFrame(() => readerEl.classList.add('is-open')));
      setTimeout(() => $('[data-reader-close]', readerEl).focus(), 80);
    });
    $('[data-reader-close]', readerEl).addEventListener('click', close);
    readerEl.addEventListener('click', (e) => { if (e.target === readerEl) close(); });
    readerEl.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  // Floating side cards step aside whenever a full-width dark band (hero,
  // magazine band, footer) passes behind them, so they never sit on top of one.
  const railEls = $$('[data-rail]');
  const bands = $$('.hero, .band, .footer');
  const placeRails = () => {
    if (!railEls.length || getComputedStyle(railEls[0]).display === 'none') return;
    railEls.forEach((r) => {
      const top = parseFloat(getComputedStyle(r).top) || 150;
      const bottom = top + r.offsetHeight;
      const covered = bands.some((b) => { const br = b.getBoundingClientRect(); return br.top < bottom && br.bottom > top; });
      r.classList.toggle('is-hidden', covered);
    });
  };

  // Floating "Subscribe free" pill steps aside when the footer (with its own form) is in view.
  const floater = $('[data-floater]');
  const foot = $('.footer');
  if (floater && foot && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => floater.classList.toggle('is-hidden', e.isIntersecting)).observe(foot);
  }

  // Copy-link buttons on articles.
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.classList.add('is-done'); setTimeout(() => b.classList.remove('is-done'), 1600); } catch { /* clipboard unavailable */ }
  }));

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
      placeRails();
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
  addEventListener('resize', onScroll);
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
