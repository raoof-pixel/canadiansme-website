// Small progressive enhancements. Every page works without this file.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };

  // Links from the site root, in whichever link style this build uses.
  const ROOT = document.body.dataset.root || './';
  const INDEX = document.body.dataset.index === '1';
  const siteLink = (u) => {
    if (/^https?:/.test(u)) return u;
    const [path, hash = ''] = u.split('#');
    const p = path === '' || path.endsWith('/') ? path + (INDEX ? 'index.html' : '') : path;
    return ROOT + p + (hash ? `#${hash}` : '');
  };
  const hitUrl = (h) => (h.s ? siteLink(`${h.s}/`) : siteLink(h.u));
  const hitKind = (h) => (h.s ? `Article · ${h.c}` : h.k === 'Resource' ? `Resource · ${h.c}` : h.c);

  // Images come from WordPress's image CDN (i0.wp.com). If the CDN fails, load the original
  // from canadiansme.ca instead; only hide the image if that fails too.
  const fromOrigin = (src) => src.replace('https://i0.wp.com/', 'https://').split('?')[0];
  const handleError = (img) => {
    if (!img.dataset.retried && img.src.includes('i0.wp.com/')) {
      img.dataset.retried = '1';
      img.removeAttribute('srcset');
      img.src = fromOrigin(img.src);
      return;
    }
    img.classList.add('is-broken');
  };
  $$('img').forEach((img) => {
    img.addEventListener('error', () => handleError(img));
    if (img.loading !== 'lazy' && img.complete && img.naturalWidth === 0) handleError(img);
  });

  // Today's date in the top bar (pages are built ahead of time).
  const today = $('[data-today]');
  if (today) today.textContent = new Date().toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' });

  // "This week": next CRA deadline and countdown, worked out from today's date.
  const fmt = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
  const midnight = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const next = $('[data-next-deadline]');
  if (next) {
    const list = JSON.parse(next.dataset.deadlines || '[]');
    const now = midnight();
    const hit = list.find(([d]) => new Date(`${d}T00:00:00`) >= now);
    if (hit) {
      const n = Math.round((new Date(`${hit[0]}T00:00:00`) - now) / 86400000);
      $('[data-days]', next).textContent = n === 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`;
      $('[data-date]', next).textContent = fmt(hit[0]);
      $('[data-title]', next).textContent = hit[1];
    }
  }
  // The calendar shows the next six dates that have not passed yet.
  let shownDates = 0;
  $$('[data-deadline-list] li').forEach((li) => {
    const upcoming = new Date(`${li.dataset.date}T23:59:59`) >= new Date();
    li.hidden = !upcoming || shownDates >= 6;
    if (upcoming) shownDates++;
  });

  // Bookmarks (kept in this browser only).
  const saved = new Set(store.get('csme-bookmarks', []));
  const paintBookmark = (b) => {
    const on = saved.has(b.dataset.bookmark);
    b.setAttribute('aria-pressed', String(on));
    b.textContent = on ? '♥' : '♡';
    b.setAttribute('aria-label', on ? 'Remove bookmark' : 'Bookmark this article');
  };
  $$('[data-bookmark]').forEach((b) => {
    paintBookmark(b);
    b.addEventListener('click', () => {
      const k = b.dataset.bookmark;
      saved.has(k) ? saved.delete(k) : saved.add(k);
      store.set('csme-bookmarks', [...saved]);
      $$(`[data-bookmark="${CSS.escape(k)}"]`).forEach(paintBookmark);
      const msg = $('[data-share-msg]');
      if (msg && b.closest('.share')) msg.textContent = saved.has(k) ? 'Saved to your bookmarks.' : 'Bookmark removed.';
    });
  });

  // Copy link.
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    const msg = $('[data-share-msg]');
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      if (msg) msg.textContent = 'Link copied to clipboard.';
    } catch {
      if (msg) msg.textContent = 'Copy this link: ' + b.dataset.copy;
    }
  }));

  // Latest Business Insights: topic chips, live search and "Load more".
  $$('[data-latest]').forEach((root) => {
    const grid = $('[data-latest-grid]', root);
    const cards = $$('[data-cat]', grid);
    const step = Number(grid.dataset.show) || 9;
    const input = $('[data-latest-q]', root);
    const empty = $('[data-latest-empty]', root);
    const more = $('[data-latest-more]', root);
    const count = $('[data-latest-count]', root);
    const chips = $$('[data-chip]', root);
    let cat = 'all';
    let limit = step;
    const apply = () => {
      const words = (input.value || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
      const matches = cards.filter((c) => (cat === 'all' || c.dataset.cat === cat) && words.every((w) => c.dataset.text.includes(w)));
      cards.forEach((c) => {
        const i = matches.indexOf(c);
        c.classList.toggle('is-filtered', i === -1);
        c.classList.toggle('is-folded', i >= limit);
      });
      empty.hidden = matches.length > 0;
      more.hidden = matches.length <= limit;
      count.textContent = !words.length && cat === 'all'
        ? `Showing the ${Math.min(limit, matches.length)} most recent articles`
        : `${matches.length} ${matches.length === 1 ? 'article matches' : 'articles match'}`;
    };
    chips.forEach((b) => b.addEventListener('click', () => {
      cat = b.dataset.chip;
      limit = step;
      chips.forEach((c) => { const on = c === b; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', String(on)); });
      apply();
    }));
    input.addEventListener('input', () => { limit = step; apply(); });
    more.addEventListener('click', () => { limit += step; apply(); });
    apply();
  });

  // Category and contributor pages: sort and pages of 12.
  $$('[data-listing]').forEach((root) => {
    const grid = $('[data-listing-grid]', root);
    const pager = $('[data-pager]', root);
    const sort = $('[data-sort]', root);
    const per = Number(grid.dataset.perPage) || 12;
    const cards = $$('.card', grid);
    let pageNo = 1;
    const order = { new: (a, b) => a.dataset.i - b.dataset.i, old: (a, b) => b.dataset.i - a.dataset.i, az: (a, b) => a.dataset.title.localeCompare(b.dataset.title) };
    const render = (scroll) => {
      const sorted = [...cards].sort(order[sort.value] || order.new);
      sorted.forEach((c) => grid.appendChild(c));
      const pages = Math.ceil(sorted.length / per);
      pageNo = Math.min(pageNo, pages);
      sorted.forEach((c, i) => { c.hidden = Math.floor(i / per) + 1 !== pageNo; });
      pager.hidden = pages < 2;
      if (pages > 1) {
        const btn = (label, n, extra = '') => `<button type="button" data-page="${n}"${extra}>${label}</button>`;
        let html = btn('←', pageNo - 1, `${pageNo === 1 ? ' disabled' : ''} aria-label="Previous page"`);
        for (let n = 1; n <= pages; n++) html += btn(n, n, n === pageNo ? ' aria-current="page"' : ` aria-label="Page ${n}"`);
        html += btn('→', pageNo + 1, `${pageNo === pages ? ' disabled' : ''} aria-label="Next page"`);
        pager.innerHTML = html;
      }
      if (scroll) root.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    };
    pager.addEventListener('click', (e) => {
      const b = e.target.closest('[data-page]');
      if (!b || b.disabled) return;
      pageNo = Number(b.dataset.page);
      render(true);
    });
    sort.addEventListener('change', () => { pageNo = 1; render(false); });
    render(false);
  });

  // Forms. There is no mailing-list or inbox connection yet, so after checking the fields we say
  // so plainly instead of pretending the message was sent.
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  const say = (form, text, ok) => {
    const s = $('[data-status]', form);
    s.textContent = text;
    s.classList.toggle('is-error', !ok);
    s.classList.toggle('is-ok', ok);
  };
  const flag = (form, name) => {
    $$('[aria-invalid]', form).forEach((el) => el.removeAttribute('aria-invalid'));
    const el = form.elements[name];
    if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); }
  };
  $$('[data-signup]').forEach((form) => form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = form.elements;
    if (f.first.value.trim().length < 2) { flag(form, 'first'); return say(form, 'Please enter your first name.', false); }
    if (!emailOk(f.email.value)) { flag(form, 'email'); return say(form, 'Please enter a valid email address.', false); }
    if (!f.province.value) { flag(form, 'province'); return say(form, 'Please select your province.', false); }
    if (!f.stage.value) { flag(form, 'stage'); return say(form, 'Please select your business stage.', false); }
    if (!f.consent.checked) { flag(form, 'consent'); return say(form, 'Please confirm you agree to receive communications.', false); }
    $$('[aria-invalid]', form).forEach((el) => el.removeAttribute('aria-invalid'));
    say(form, `Thanks, ${f.first.value.trim()}. Online sign-up opens soon. Until then, follow the magazine free at issuu.com/canadiansme.`, true);
  }));
  $$('[data-contact]').forEach((form) => {
    const reason = new URLSearchParams(location.search).get('reason');
    if (reason && form.elements.reason.querySelector(`option[value="${CSS.escape(reason)}"]`)) form.elements.reason.value = reason;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = form.elements;
      if (f.name.value.trim().length < 2) { flag(form, 'name'); return say(form, 'Please enter your name.', false); }
      if (!emailOk(f.email.value)) { flag(form, 'email'); return say(form, 'Please enter a valid email address.', false); }
      if (!f.reason.value) { flag(form, 'reason'); return say(form, 'Please choose a reason for contact.', false); }
      if (f.message.value.trim().length < 10) { flag(form, 'message'); return say(form, 'Please add a little more detail to your message.', false); }
      $$('[aria-invalid]', form).forEach((el) => el.removeAttribute('aria-invalid'));
      say(form, `Thanks, ${f.name.value.trim()}. Our online form isn’t connected yet, so please call us on +1 416 655 0205 and we’ll take it from there.`, true);
    });
  });

  // Search page: articles, tools, episodes, resources and events.
  const index = () => window.__SEARCH_INDEX__ || [];
  const score = (h, words) => {
    const t = h.t.toLowerCase();
    const all = `${t} ${(h.c || '').toLowerCase()} ${(h.x || '').toLowerCase()}`;
    if (!words.every((w) => all.includes(w))) return 0;
    return words.reduce((s, w) => s + (t.includes(w) ? 3 : 1), 0) + (h.s ? 0 : 0.5);
  };
  const find = (q, n) => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return index().map((h) => [score(h, words), h]).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0]).slice(0, n).map(([, h]) => h);
  };
  const page = $('[data-search-page]');
  if (page) {
    const input = $('[data-page-q]', page);
    const list = $('[data-search-list]', page);
    const summary = $('[data-search-summary]', page);
    const run = () => {
      const q = input.value.trim();
      if (!q) { list.innerHTML = ''; summary.textContent = 'Type a word or two and press Search.'; return; }
      const hits = find(q, 60);
      summary.textContent = hits.length ? `${hits.length} ${hits.length === 1 ? 'result' : 'results'} for “${q}”` : `No results for “${q}”. Try a broader word, a company name or a topic like funding.`;
      list.innerHTML = hits.map((h) => `<li><a href="${esc(hitUrl(h))}"${/^https?:/.test(h.u || '') ? ' target="_blank" rel="noopener"' : ''}><span class="results__kind">${esc(hitKind(h))}</span><span class="results__title">${esc(h.t)}</span>${h.x ? `<span class="results__text">${esc(h.x)}</span>` : ''}</a></li>`).join('');
    };
    const q0 = new URLSearchParams(location.search).get('q') || '';
    input.value = q0;
    // The index script loads with defer, just before this one, so it is ready here.
    run();
    $('form', page).addEventListener('submit', (e) => {
      e.preventDefault();
      history.replaceState(null, '', `?q=${encodeURIComponent(input.value.trim())}`);
      run();
    });
  }

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
      readerEl.hidden = true;
      frame.src = 'about:blank';
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
      readerEl.classList.add('is-open');
      setTimeout(() => $('[data-reader-close]', readerEl).focus(), 50);
    });
    $('[data-reader-close]', readerEl).addEventListener('click', close);
    readerEl.addEventListener('click', (e) => { if (e.target === readerEl) close(); });
    readerEl.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  // Cards rise gently into place as they scroll into view (movement only: text is never hidden).
  if ('IntersectionObserver' in window && !reduce) {
    const items = $$('.card, .tile, .tool-card, .res-card, .episode, .event-card, .comm__col, .cover-card, .mini').filter((el) => !el.closest('.drawer, .search, .reader'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('reveal');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    items.forEach((el) => { if (el.getBoundingClientRect().top > innerHeight) io.observe(el); });
  }

  // Sticky header shadow, reading progress and the current "In this article" heading.
  const masthead = $('[data-masthead]');
  const progress = $('[data-progress]');
  const prose = $('.article__body');
  const tocLinks = $$('[data-toc]');
  const heads = tocLinks.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      masthead?.classList.toggle('is-scrolled', scrollY > 40);
      if (progress && prose) {
        const r = prose.getBoundingClientRect();
        const done = Math.min(1, Math.max(0, -r.top / Math.max(r.height - innerHeight * 0.6, 1)));
        progress.style.transform = `scaleX(${done})`;
      }
      if (heads.length) {
        let cur = 0;
        heads.forEach((h, i) => { if (h.getBoundingClientRect().top < 140) cur = i; });
        tocLinks.forEach((a, i) => a.classList.toggle('is-current', i === cur));
      }
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // Overlays: open/close, return focus, close on Escape or a click outside.
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
      setTimeout(() => { el.hidden = true; }, reduce ? 0 : 300);
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

  // Mega menus: open on hover or keyboard focus, close on leave, Escape or outside click.
  const megaItems = $$('[data-mega]');
  const megaPanels = $$('[data-mega-panel]');
  let megaTimer = null;
  function closeMegas() {
    clearTimeout(megaTimer);
    megaPanels.forEach((p) => { p.hidden = true; });
    megaItems.forEach((li) => { li.classList.remove('is-open'); $('a', li)?.setAttribute('aria-expanded', 'false'); });
  }
  const openMega = (key) => {
    clearTimeout(megaTimer);
    megaPanels.forEach((p) => { p.hidden = p.dataset.megaPanel !== key; });
    megaItems.forEach((li) => {
      const on = li.dataset.mega === key;
      li.classList.toggle('is-open', on);
      $('a', li)?.setAttribute('aria-expanded', String(on));
    });
  };
  if (megaItems.length && masthead) {
    megaItems.forEach((li) => {
      li.addEventListener('mouseenter', () => { megaTimer = setTimeout(() => openMega(li.dataset.mega), 90); });
      li.addEventListener('mouseleave', () => clearTimeout(megaTimer));
      $('a', li).addEventListener('focus', () => openMega(li.dataset.mega));
    });
    $$('.mainnav li:not([data-mega])').forEach((li) => li.addEventListener('mouseenter', closeMegas));
    $$('.mainnav li:not([data-mega]) a, .logo, .masthead__actions a, .masthead__actions button').forEach((el) => el.addEventListener('focus', closeMegas));
    masthead.addEventListener('mouseleave', () => { megaTimer = setTimeout(closeMegas, 180); });
    masthead.addEventListener('mouseenter', () => clearTimeout(megaTimer));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMegas(); });
    document.addEventListener('click', (e) => { if (!e.target.closest('[data-masthead]')) closeMegas(); });
    addEventListener('scroll', () => { if (scrollY > 600) closeMegas(); }, { passive: true });
  }

  // Quick search overlay.
  const searchEl = $('[data-search]');
  if (searchEl) {
    const search = overlay(searchEl);
    const input = $('[data-search-input]', searchEl);
    const results = $('[data-search-results]', searchEl);
    const render = () => {
      const q = input.value.trim();
      if (!q) { results.innerHTML = ''; return; }
      const hits = find(q, 8);
      results.innerHTML = hits.length
        ? hits.map((h) => `<li><a href="${esc(hitUrl(h))}"><span>${esc(hitKind(h))}</span><strong>${esc(h.t)}</strong></a></li>`).join('') +
          `<li><a href="${esc(siteLink('search/'))}?q=${encodeURIComponent(q)}"><span>All results</span><strong>See everything for “${esc(q)}” →</strong></a></li>`
        : `<li class="search__empty">Nothing matches “${esc(q)}”. Try a company name or a topic like funding.</li>`;
    };
    input.addEventListener('input', render);
    $$('[data-search-open]').forEach((b) => b.addEventListener('click', search.open));
    $$('[data-search-close]').forEach((b) => b.addEventListener('click', search.close));
    addEventListener('keydown', (e) => {
      if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); search.open(); }
    });
  }
})();
