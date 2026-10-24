import { esc, img, full, srcset, shortDate, longDate, safeJson } from './lib.mjs';

const LOGO_DARK = 'https://i0.wp.com/canadiansme.ca/wp-content/uploads/2021/03/Magazine-dark-logo.png';
const LOGO_LIGHT = 'https://i0.wp.com/canadiansme.ca/wp-content/uploads/2021/02/Magazine-light-logo-1.png';
const FAVICON = 'https://i0.wp.com/canadiansme.ca/wp-content/uploads/2021/02/cropped-whilte-fevicon.png';

// ---------- Icons ----------

const icon = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="m4 7 8 6 8-6"/></svg>',
};

// ---------- Topic colours ----------
// One colour per category: drives the chip, card accent line and topic cards.
const TONES = {
  'latest-news': '#2563eb', 'small-business-leadership': '#7c3aed', interviews: '#e11d48', technology: '#0891b2',
  'women-entrepreneurship': '#db2777', 'finance-for-small-businesses': '#059669', marketing: '#ea580c', retail: '#ca8a04',
  workplace: '#4f46e5', 'small-business': '#d71920', entrepreneurship: '#9333ea', 'artificial-intelligence': '#0284c7',
  innovation: '#0d9488', 'cybersecurity-for-small-businesses': '#475569', economy: '#16a34a', 'diversity-and-inclusion': '#c026d3',
  'e-commerce': '#d97706', sustainability: '#65a30d', 'editors-pick': '#b45309',
};
const toneOf = (slug) => TONES[slug] || '#d71920';
const tone = (slug) => ` style="--c:${toneOf(slug)}"`;

// ---------- Helpers ----------

const href = (ctx, path) => (/^https?:/.test(path) ? path : ctx.link(path));
const ext = (path) => (/^https?:/.test(path) && !/canadiansme\.ca/.test(path) ? ' target="_blank" rel="noopener"' : '');
const postUrl = (ctx, p) => ctx.link(`${p.slug}/`);
const catOf = (ctx, p) => ctx.categories[p.category];

const P = (ctx, slug) => {
  const p = ctx.postsBySlug[slug];
  if (!p) throw new Error(`Unknown post referenced: ${slug}`);
  return p;
};
const mag = (ctx, id) => ctx.home.magazines.find((m) => m.id === id);

// Opens an Issuu issue in the on-page reader; the Issuu link stays as the fallback.
const readerAttrs = (m) => {
  const doc = (m.href.split('/docs/')[1] || '').split(/[?#]/)[0];
  return doc ? ` data-reader="${esc(doc)}" data-reader-title="${esc(`${m.title}, ${m.issue}`)}" data-reader-href="${m.href}"` : '';
};

// Each post image gets a unique transition name once per page, so it can glide into the article.
export const makeVT = () => {
  const used = new Set();
  return (post) => {
    if (used.has(post.id)) return '';
    used.add(post.id);
    return ` style="view-transition-name: p${post.id}"`;
  };
};

const picture = (post, { w = 800, sizes = '100vw', vt = '', eager = false, cls = '' } = {}) =>
  `<img${cls ? ` class="${cls}"` : ''} src="${img(post.image, w)}" srcset="${srcset(post.image)}" sizes="${sizes}" alt="" width="700" height="500"${
    eager ? ' fetchpriority="high"' : ' loading="lazy"'
  } decoding="async"${vt}>`;

const label = (ctx, p, text) => {
  const c = catOf(ctx, p);
  return text ? `<p class="label">${esc(text)}</p>` : `<a class="label" href="${ctx.link(`category/${c.slug}/`)}">${esc(c.name)}</a>`;
};

const meta = (ctx, p, { author = true, read = false } = {}) => {
  const a = ctx.authors[p.author];
  const parts = [];
  if (author && a) parts.push(`<a href="${ctx.link(`author/${a.slug}/`)}">${esc(a.name)}</a>`);
  parts.push(`<time datetime="${p.date}">${shortDate(p.date)}</time>`);
  if (read) parts.push(`${p.readingTime} min read`);
  return `<p class="meta">${parts.join('<span class="sep" aria-hidden="true"></span>')}</p>`;
};

const foot = (ctx, p) => {
  const a = ctx.authors[p.author];
  return `<div class="card__foot">
      <span class="avatar avatar--sm" aria-hidden="true">${esc(initials(a?.name || 'CanadianSME'))}</span>
      <span class="card__who">${a ? `<a href="${ctx.link(`author/${a.slug}/`)}">${esc(a.name)}</a>` : ''}<span><time datetime="${p.date}">${shortDate(p.date)}</time> · ${p.readingTime} min read</span></span>
    </div>`;
};

const head = (ctx, title, more, moreLabel = 'View all', extra = '') => `
  <div class="head">
    <h2>${esc(title)}</h2>
    ${extra}
    ${more ? `<a class="more" href="${href(ctx, more)}">${moreLabel} ${icon.arrow}</a>` : ''}
  </div>`;

// ---------- Cards ----------

// Standard card: image on top. Used in grids and carousels.
export const card = (ctx, p, vt, { excerpt = true, sizes = '(min-width: 1100px) 25vw, (min-width: 700px) 45vw, 90vw', attrs = '', badge = '' } = {}) => `
  <article class="card"${tone(p.category)}${attrs}>
    <a class="card__img" href="${postUrl(ctx, p)}" tabindex="-1" aria-hidden="true">${picture(p, { w: 800, sizes, vt: vt(p) })}${badge ? `<span class="card__badge">${esc(badge)}</span>` : ''}</a>
    <div class="card__body">
      ${label(ctx, p)}
      <h3 class="card__title"><a href="${postUrl(ctx, p)}">${esc(p.title)}</a></h3>
      ${excerpt ? `<p class="card__excerpt">${esc(p.excerpt)}</p>` : ''}
      ${foot(ctx, p)}
    </div>
  </article>`;

// Portrait card for interviews.
const portrait = (ctx, p, vt) => `
  <article class="portrait"${tone(p.category)}>
    <a class="portrait__img" href="${postUrl(ctx, p)}" tabindex="-1" aria-hidden="true">${picture(p, { w: 800, sizes: '(min-width: 1100px) 22vw, 70vw', vt: vt(p) })}</a>
    <h3 class="card__title"><a href="${postUrl(ctx, p)}">${esc(p.title)}</a></h3>
    <p class="card__excerpt">${esc(p.excerpt)}</p>
    <p class="portrait__who">${esc(ctx.authors[p.author]?.name || '')}</p>
  </article>`;

// Story row: text left, large image right (FullStory pattern).
const storyRow = (ctx, p, vt, { flip = false } = {}) => `
  <article class="row${flip ? ' row--flip' : ''}"${tone(p.category)}>
    <div class="row__text">
      ${label(ctx, p)}
      <h3 class="row__title"><a href="${postUrl(ctx, p)}">${esc(p.title)}</a></h3>
      <p class="row__excerpt">${esc(p.excerpt)}</p>
      ${foot(ctx, p)}
    </div>
    <a class="row__img" href="${postUrl(ctx, p)}" tabindex="-1" aria-hidden="true">${picture(p, { w: 1000, sizes: '(min-width: 1100px) 34vw, 90vw', vt: vt(p) })}</a>
  </article>`;

// Thumbnail line for sidebars and compact lists.
export const thumb = (ctx, p, vt) => `
  <article class="thumb"${tone(p.category)}>
    <a class="thumb__img" href="${postUrl(ctx, p)}" tabindex="-1" aria-hidden="true">${picture(p, { w: 320, sizes: '96px', vt: vt(p) })}</a>
    <div>
      <p class="thumb__cat">${esc(catOf(ctx, p).name)}</p>
      <h3 class="thumb__title"><a href="${postUrl(ctx, p)}">${esc(p.title)}</a></h3>
      <p class="meta"><time datetime="${p.date}">${shortDate(p.date)}</time></p>
    </div>
  </article>`;

// Back-compat names used by listing pages.
export const storyCard = (ctx, p, vt) => card(ctx, p, vt);
export const rowCard = thumb;

// ---------- Ads and magazine ----------

const shape = (a) => (a.w / a.h > 2.5 ? 'wide' : a.h > a.w * 1.5 ? 'tall' : 'box');

export const ad = (ctx, id) => {
  const a = ctx.home.ads[id];
  if (!a) return '';
  return `
  <aside class="ad ad--${shape(a)}" aria-label="Advertisement from ${esc(a.sponsor)}">
    <p class="ad__label">Advertisement</p>
    <a href="${a.href}" target="_blank" rel="sponsored noopener">
      <img src="${img(a.image, Math.min(a.w, 1600))}" alt="${esc(a.alt)}" width="${a.w}" height="${a.h}" loading="lazy" decoding="async" style="aspect-ratio:${a.w}/${a.h}">
    </a>
  </aside>`;
};

const cover = (ctx, id, { eager = false, sizes = '240px', cls = '' } = {}) => {
  const m = mag(ctx, id);
  if (!m) return '';
  return `<a class="cover${cls ? ` ${cls}` : ''}" href="${m.href}" target="_blank" rel="noopener"${readerAttrs(m)} aria-label="Read ${esc(m.title)}, ${esc(m.issue)}">
      <img src="${img(m.cover, 640)}" srcset="${img(m.cover, 320)} 320w, ${img(m.cover, 640)} 640w, ${img(m.cover, 1000)} 1000w" sizes="${sizes}" alt="Cover of ${esc(m.title)}, ${esc(m.issue)}" width="1004" height="1300"${eager ? ' fetchpriority="high"' : ' loading="lazy"'}>
    </a>`;
};

// ---------- Layout shell ----------

const logo = (ctx, light = false) => `
  <a class="logo" href="${ctx.link('')}" aria-label="CanadianSME Small Business Magazine home">
    <img src="${light ? LOGO_LIGHT : LOGO_DARK}?w=520&ssl=1" alt="CanadianSME Small Business Magazine" width="230" height="40">
  </a>`;

const SOCIAL_SHORT = { LinkedIn: 'In', YouTube: 'YT', Instagram: 'IG', Facebook: 'FB', X: 'X' };
const isActive = (item, active) => item.match && (Array.isArray(item.match) ? item.match.includes(active) : item.match === active);

const header = (ctx, active) => {
  const menu = ctx.site.menu;
  const social = ['LinkedIn', 'YouTube', 'Instagram', 'Facebook', 'X'].map((n) => ctx.site.social.find((x) => x.label === n)).filter(Boolean);
  return `
  <a class="skip" href="#main">Skip to content</a>
  <div class="topbar">
    <div class="wrap topbar__inner">
      <p class="topbar__left"><strong>${longDate(ctx.now.toISOString())}</strong><span class="topbar__bar" aria-hidden="true"></span><span class="topbar__strap">${esc(ctx.site.strapline)}</span></p>
      <div class="topbar__right">
        <nav class="topbar__social" aria-label="CanadianSME on social media">${social.map((x) => `<a href="${x.href}" target="_blank" rel="noopener" aria-label="${esc(x.label)}">${SOCIAL_SHORT[x.label]}</a>`).join('')}</nav>
        <button class="topbar__search" type="button" data-search-open>${icon.search} Search</button>
      </div>
    </div>
  </div>
  <header class="masthead" data-masthead>
    <div class="wrap masthead__inner">
      ${logo(ctx)}
      <nav class="mainnav" aria-label="Main menu">
        ${menu.map((m) => `<a href="${href(ctx, m.href)}"${ext(m.href)}${isActive(m, active) ? ' aria-current="page"' : ''}>${esc(m.label)}</a>`).join('')}
      </nav>
      <div class="masthead__actions">
        <button class="icon-btn masthead__search" type="button" data-search-open aria-label="Search articles">${icon.search}</button>
        <a class="btn btn--red masthead__sub" href="${ctx.link('subscription/')}">Subscribe Free</a>
        <button class="menu-btn" type="button" data-menu-open aria-label="Open menu">${icon.menu}<span>Menu</span></button>
      </div>
    </div>
  </header>
  <div class="drawer" data-drawer hidden>
    <div class="drawer__panel" role="dialog" aria-modal="true" aria-label="Menu">
      <div class="drawer__top">
        ${logo(ctx)}
        <button class="icon-btn drawer__close" type="button" data-menu-close aria-label="Close menu">${icon.close}</button>
      </div>
      <nav class="drawer__main" aria-label="Main menu">
        ${menu.map((m) => `<a href="${href(ctx, m.href)}"${ext(m.href)}${isActive(m, active) ? ' aria-current="page"' : ''}>${esc(m.label)}</a>`).join('')}
      </nav>
      <div class="drawer__group">
        <p class="drawer__title">All topics</p>
        <nav class="drawer__chips" aria-label="All topics">${Object.values(ctx.categories).map((c) => `<a href="${ctx.link(`category/${c.slug}/`)}"${tone(c.slug)}>${esc(c.name)}</a>`).join('')}</nav>
      </div>
      <div class="drawer__group drawer__cols">
        <nav aria-label="Events">
          <p class="drawer__title">Events</p>
          ${ctx.site.events.map((l) => `<a href="${l.href}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}
        </nav>
        <nav aria-label="CanadianSME">
          <p class="drawer__title">CanadianSME</p>
          <a href="${ctx.link('about-us/')}">About us</a>
          <a href="${ctx.link('ups-small-business/')}">UPS Small Business</a>
          <a href="${ctx.link('start-up-stories/')}">Start-up stories</a>
          <a href="${ctx.link('contact-us/')}">Advertise</a>
          <a href="${ctx.link('contact-us/')}">Contact us</a>
        </nav>
      </div>
      <a class="btn btn--red btn--block" href="${ctx.link('subscription/')}">Subscribe Free</a>
      <nav class="drawer__social" aria-label="Social">${social.map((x) => `<a href="${x.href}" target="_blank" rel="noopener">${esc(x.label)}</a>`).join('')}</nav>
    </div>
  </div>
  <div class="search" data-search hidden>
    <div class="search__panel" role="dialog" aria-modal="true" aria-label="Search">
      <label class="search__field">
        ${icon.search}
        <input type="search" placeholder="Search articles" autocomplete="off" data-search-input aria-label="Search articles">
        <button class="icon-btn" type="button" data-search-close aria-label="Close search">${icon.close}</button>
      </label>
      <ul class="search__results" data-search-results></ul>
    </div>
  </div>`;
};

const newsletter = (ctx, id = 'nl') => `
  <form class="newsletter" action="${ctx.link('subscription/')}" method="get">
    <label class="visually-hidden" for="${id}-email">Email address</label>
    <input id="${id}-email" type="email" name="email" placeholder="you@business.ca" autocomplete="email" required>
    <button class="btn btn--red" type="submit">Subscribe</button>
  </form>`;

const footer = (ctx) => `
  <footer class="footer">
    <div class="wrap footer__top">
      <div class="footer__about">
        ${logo(ctx, true)}
        <h2>About CanadianSME</h2>
        <p>The premier platform for Canada’s small and medium enterprises: news, interviews, research and the free monthly magazine, from the team behind the Small Business Summit, Expo and National Business Awards.</p>
      </div>
      <div class="footer__news">
        <h2>${icon.mail} Newsletter</h2>
        <p>Each new issue, event updates and business insights in your inbox. Free.</p>
        ${newsletter(ctx, 'ft')}
      </div>
    </div>
    <div class="wrap footer__links">
      <nav aria-label="Sections">${Object.values(ctx.categories).slice(0, 12).map((c) => `<a href="${ctx.link(`category/${c.slug}/`)}">${esc(c.name)}</a>`).join('')}</nav>
      <nav aria-label="CanadianSME">${ctx.site.footerLinks.map((l) => `<a href="${href(ctx, l.href)}">${esc(l.label)}</a>`).join('')}</nav>
    </div>
    <div class="wrap footer__legal">
      <p>© ${ctx.now.getFullYear()} CanadianSME Magazine. All rights reserved.<span class="sep" aria-hidden="true"></span>${esc(ctx.site.contact.company)}, ${esc(ctx.site.contact.address)}<span class="sep" aria-hidden="true"></span>${ctx.site.contact.phones.map(esc).join(', ')}</p>
      <nav class="footer__social" aria-label="Social">${ctx.site.social.map((s) => `<a href="${s.href}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('')}</nav>
    </div>
  </footer>`;

const readerModal = () => `
<div class="reader" data-reader-modal hidden>
  <div class="reader__panel" role="dialog" aria-modal="true" aria-labelledby="reader-title">
    <div class="reader__bar">
      <p id="reader-title" class="reader__title" data-reader-name>CanadianSME Small Business Magazine</p>
      <a class="btn btn--ghost" href="https://issuu.com/canadiansme" target="_blank" rel="noopener" data-reader-out>Open in a new tab</a>
      <button class="icon-btn" type="button" data-reader-close aria-label="Close magazine">${icon.close}</button>
    </div>
    <div class="reader__frame"><iframe data-reader-frame title="Magazine reader" allowfullscreen></iframe></div>
  </div>
</div>`;

export const page = (ctx, { title, description, canonical, image, active, body, jsonld, type = 'website', bodyClass = '' }) => `<!doctype html>
<html lang="${ctx.site.locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="${type}">
<meta property="og:locale" content="en_CA">
<meta property="og:site_name" content="${esc(ctx.site.fullName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
${image ? `<meta property="og:image" content="${img(image, 1200)}">\n<meta name="twitter:card" content="summary_large_image">` : '<meta name="twitter:card" content="summary">'}
<meta name="twitter:site" content="@canadian_sme">
<meta name="theme-color" content="#0B1220">
<link rel="icon" href="${FAVICON}?fit=32%2C32&ssl=1" sizes="32x32">
<link rel="icon" href="${FAVICON}?fit=192%2C192&ssl=1" sizes="192x192">
<link rel="apple-touch-icon" href="${FAVICON}?fit=180%2C180&ssl=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://i0.wp.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap">
<link rel="stylesheet" href="${ctx.link('assets/styles.css')}?v=${ctx.version}">
${jsonld ? `<script type="application/ld+json">${safeJson(jsonld)}</script>` : ''}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
${header(ctx, active)}
<main id="main">
${body}
</main>
${footer(ctx)}
${readerModal()}
<script src="${ctx.link('assets/search-index.js')}?v=${ctx.version}" defer></script>
<script src="${ctx.link('assets/app.js')}?v=${ctx.version}" defer></script>
</body>
</html>`;

// ---------- Homepage sections ----------

const sections = {
  hero: (ctx, s) => `
  <section class="hero" aria-roledescription="carousel" aria-label="Top stories and this month’s magazine" data-slider>
    ${s.slides
      .map((sl, i) => {
        const on = i === 0;
        const hide = on ? '' : ' tabindex="-1"';
        if (sl.kind === 'magazine') {
          const m = mag(ctx, sl.magazine);
          const hl = (sl.highlights || [])
            .map((h) => `<li><a href="${ctx.link(`${h.post}/`)}"${hide}><span>p. ${esc(h.page)}</span>${esc(h.title)}</a></li>`)
            .join('');
          return `
      <article class="hero__slide hero__slide--mag${on ? ' is-active' : ''}" data-slide aria-roledescription="slide" aria-label="${i + 1} of ${s.slides.length}"${on ? '' : ' aria-hidden="true"'}>
        <div class="hero__bg hero__bg--blur" style="background-image:url('${img(m.cover, 600)}')" aria-hidden="true"></div>
        <div class="wrap hero__inner">
          <div class="hero__copy">
            <p class="label label--light">${esc(m.title)}, ${esc(m.issue)}</p>
            <h${on ? 1 : 2} class="hero__title">${esc(sl.heading)}</h${on ? 1 : 2}>
            <p class="hero__text">${esc(sl.text)}</p>
            ${hl ? `<ul class="hero__issue-list">${hl}</ul>` : ''}
            <div class="btn-row">
              <a class="btn btn--red btn--lg" href="${m.href}" target="_blank" rel="noopener"${readerAttrs(m)}${hide}>${icon.book} ${esc(sl.cta)}</a>
              <a class="btn btn--outline-light btn--lg" href="${ctx.link('subscription/')}"${hide}>Subscribe free</a>
            </div>
          </div>
          <div class="hero__cover">${cover(ctx, m.id, { eager: on, sizes: '(min-width: 900px) 340px, 60vw' })}</div>
        </div>
      </article>`;
        }
        const p = P(ctx, sl.post);
        const a = ctx.authors[p.author];
        return `
      <article class="hero__slide hero__slide--story${on ? ' is-active' : ''}" data-slide aria-roledescription="slide" aria-label="${i + 1} of ${s.slides.length}"${on ? '' : ' aria-hidden="true"'}>
        <div class="hero__bg" aria-hidden="true">${picture(p, { w: 1600, sizes: '100vw', eager: on, cls: 'hero__photo' })}</div>
        <div class="wrap hero__inner">
          <div class="hero__copy">
            <p class="label label--light">${esc(sl.label || catOf(ctx, p).name)}</p>
            <h${on ? 1 : 2} class="hero__title"><a href="${postUrl(ctx, p)}"${hide}>${esc(p.title)}</a></h${on ? 1 : 2}>
            <p class="hero__text">${esc(p.excerpt)}</p>
            <p class="hero__meta"><a href="${postUrl(ctx, p)}"${hide}>Read story ${icon.arrow}</a><span>${esc(a.name)}</span><span>${p.readingTime} min read</span></p>
          </div>
        </div>
      </article>`;
      })
      .join('')}
    <div class="hero__bar">
      <div class="wrap hero__bar-inner">
        <div class="hero__tabs" role="tablist" aria-label="Choose a story">
          ${s.slides
            .map((sl, i) => {
              let pic, kicker, title;
              if (sl.kind === 'magazine') {
                const m = mag(ctx, sl.magazine);
                pic = `<img src="${img(m.cover, 160)}" alt="" width="54" height="70" decoding="async" class="hero__tab-cover">`;
                kicker = 'Magazine';
                title = `${m.issue} issue`;
              } else {
                const p = P(ctx, sl.post);
                pic = `<img src="${img(p.image, 240)}" alt="" width="92" height="62" decoding="async">`;
                kicker = sl.label || catOf(ctx, p).name;
                title = p.title;
              }
              return `<button class="hero__tab" type="button" role="tab" data-dot="${i}" aria-label="Show slide ${i + 1}: ${esc(title)}"${i === 0 ? ' aria-current="true"' : ''}><span class="hero__tab-line" aria-hidden="true"></span><span class="hero__tab-pic">${pic}</span><span class="hero__tab-text"><span class="hero__tab-kicker">${esc(kicker)}</span><span class="hero__tab-title">${esc(title)}</span></span></button>`;
            })
            .join('')}
        </div>
        <div class="hero__arrows">
          <button class="round-btn round-btn--light" type="button" data-prev aria-label="Previous slide">${icon.prev}</button>
          <button class="round-btn round-btn--light" type="button" data-next aria-label="Next slide">${icon.next}</button>
        </div>
      </div>
    </div>
  </section>`,

  trending: (ctx, s) => `
  <nav class="trending" aria-label="Trending topics">
    <div class="wrap trending__inner">
      <p class="trending__title"><span class="dot" aria-hidden="true"></span>${esc(s.title)}</p>
      <div class="trending__chips">${s.topics.map((t) => `<a class="chip"${tone(t)} href="${ctx.link(`category/${t}/`)}">${esc(ctx.categories[t].name)}</a>`).join('')}</div>
    </div>
  </nav>`,

  'featured-row': (ctx, s, vt) => `
  <section class="wrap section section--first" aria-label="Featured stories">
    ${head(ctx, s.title || 'Featured this week', s.more)}
    <div class="grid grid--4">${s.posts.map((x, i) => card(ctx, P(ctx, x), vt, { badge: i === 0 ? 'Featured' : '' })).join('')}</div>
  </section>`,

  'main-sidebar': (ctx, s, vt) => `
  <section class="wrap section split">
    <div class="split__main">
      ${head(ctx, s.title, s.more)}
      <div class="rows">${s.rows.map((x) => storyRow(ctx, P(ctx, x), vt)).join('')}</div>
    </div>
    <aside class="split__side" aria-label="${esc(s.sideTitle)}">
      <h2 class="side-title">${esc(s.sideTitle)}</h2>
      <div class="thumbs">${s.side.map((x) => thumb(ctx, P(ctx, x), vt)).join('')}</div>
      ${ad(ctx, s.ad)}
      <div class="promo">
        <p class="promo__title">${esc(s.promo.title)}</p>
        <p>${esc(s.promo.text)}</p>
        <a class="btn btn--red" href="${href(ctx, s.promo.href)}">${esc(s.promo.button)}</a>
      </div>
    </aside>
  </section>`,

  ad: (ctx, s) => `<div class="wrap section section--ad">${ad(ctx, s.ad)}</div>`,

  podcast: (ctx, s) => `
  <section class="wrap section">
    <div class="podcast">
      <div class="podcast__intro">
        <p class="label label--light">Podcast</p>
        <h2>${esc(s.title)}</h2>
        <p>${esc(s.text)}</p>
        <div class="btn-row">
          <a class="btn btn--light" href="https://smbpodcast.ca/" target="_blank" rel="noopener">${icon.play} Listen now</a>
          <a class="btn btn--outline-light" href="https://www.youtube.com/@Canadian-SME" target="_blank" rel="noopener">Watch on YouTube</a>
        </div>
      </div>
      <ol class="podcast__list">
        ${s.episodes.map((e) => `<li><a href="${e.href}" target="_blank" rel="noopener"><span class="podcast__play" aria-hidden="true">${icon.play}</span><span><strong>${esc(e.title)}</strong><span>${esc(e.guest)}</span></span></a></li>`).join('')}
      </ol>
    </div>
    <div class="section--ad">${ad(ctx, s.ad)}</div>
  </section>`,

  insights: (ctx, s, vt) => {
    const posts = [...new Set(s.posts)].map((x) => P(ctx, x));
    return `
  <section class="section section--soft" aria-labelledby="ins-title" data-insights>
    <div class="wrap">
      <div class="insights__head">
        <div>
          <h2 id="ins-title">${esc(s.title)}</h2>
          <p>${esc(s.text)}</p>
        </div>
        <label class="insights__search">
          ${icon.search}
          <span class="visually-hidden">Search these articles</span>
          <input type="search" placeholder="Search: cash flow, AI, tariffs" data-insights-search>
        </label>
      </div>
      <div class="filters" role="group" aria-label="Filter by topic">
        <button class="chip is-on" type="button" data-filter="all" aria-pressed="true">All</button>
        ${s.filters.map((f) => `<button class="chip" type="button" data-filter="${f}" aria-pressed="false">${esc(ctx.categories[f].name)}</button>`).join('')}
      </div>
      <div class="insights__body">
        <div>
          <div class="grid grid--3" data-insights-grid data-show="${s.show}">
            ${posts.map((p) => card(ctx, p, vt, { excerpt: true, sizes: '(min-width: 1100px) 22vw, (min-width: 700px) 45vw, 90vw', attrs: ` data-cat="${p.category}" data-text="${esc((p.title + ' ' + p.excerpt).toLowerCase())}"` })).join('')}
          </div>
          <p class="insights__empty" data-insights-empty hidden>No articles match that search. Try a broader word, or pick All.</p>
          <div class="insights__more"><button class="btn btn--ghost" type="button" data-insights-more>Show more articles</button></div>
        </div>
        <aside class="insights__side">${s.ads.map((a) => ad(ctx, a)).join('')}</aside>
      </div>
    </div>
  </section>`;
  },

  carousel: (ctx, s, vt) => `
  <section class="tint tint--${s.tint || 'none'}" aria-label="${esc(s.title)}" data-carousel><div class="wrap section">
    ${head(ctx, s.title, s.more, 'View all', `<div class="carousel__nav"><button class="round-btn" type="button" data-car-prev aria-label="Scroll back">${icon.prev}</button><button class="round-btn" type="button" data-car-next aria-label="Scroll forward">${icon.next}</button></div>`)}
    <div class="carousel${s.style === 'portrait' ? ' carousel--portrait' : ''}" data-car-track tabindex="0">
      ${s.posts.map((x) => (s.style === 'portrait' ? portrait(ctx, P(ctx, x), vt) : card(ctx, P(ctx, x), vt, { sizes: '(min-width: 1100px) 25vw, (min-width: 700px) 34vw, 70vw' }))).join('')}
    </div>
  </div></section>`,

  topics: (ctx, s) => `
  <section class="wrap section" aria-labelledby="topics-title">
    <div class="topics__head">
      <div>
        <h2 id="topics-title">${esc(s.title)}</h2>
        <p>${esc(s.text)}</p>
      </div>
    </div>
    <div class="topics">
      ${s.topics
        .map((slug) => {
          const c = ctx.categories[slug];
          const list = ctx.byCategory[slug] || [];
          const latest = list[0];
          return `
      <article class="topic"${tone(slug)}>
        <a class="topic__link" href="${ctx.link(`category/${slug}/`)}">
          ${latest ? `<span class="topic__img">${picture(latest, { w: 400, sizes: '(min-width: 1100px) 15vw, 40vw' })}</span>` : ''}
          <span class="topic__body">
            <span class="topic__count">${list.length} ${list.length === 1 ? 'story' : 'stories'}</span>
            <span class="topic__name">${esc(c.name)}</span>
            <span class="topic__text">${esc(c.description || '')}</span>
            ${latest ? `<span class="topic__latest"><span>Latest</span>${esc(latest.title)}</span>` : ''}
          </span>
          <span class="topic__go" aria-hidden="true">${icon.arrow}</span>
        </a>
      </article>`;
        })
        .join('')}
    </div>
  </section>`,

  'partner-content': (ctx, s, vt) => `
  <section class="wrap section" aria-labelledby="pc-title">
    <div class="head"><h2 id="pc-title">${esc(s.title)}</h2></div>
    <div class="partners">
      ${ctx.home.partners
        .map((p) => `<a class="partner" href="${p.href}" target="_blank" rel="noopener">${p.logo ? `<img src="${img(p.logo, 240)}" alt="" width="120" height="60" loading="lazy">` : `<span class="partner__mono" aria-hidden="true">AC</span>`}<span><strong>${esc(p.name)}</strong><span>${esc(p.role)}</span></span></a>`)
        .join('')}
    </div>
    <div class="grid grid--3">${s.posts.map((x) => card(ctx, P(ctx, x), vt, { sizes: '(min-width: 1100px) 30vw, 90vw', badge: 'Partner content' })).join('')}</div>
    <aside class="sponsor-note" aria-label="Advertisement from ${esc(s.note.sponsor)}">
      <p class="ad__label">Advertisement</p>
      <p><strong>${esc(s.note.sponsor)}.</strong> ${esc(s.note.text)}</p>
      <a class="btn btn--ghost" href="${s.note.href}" target="_blank" rel="sponsored noopener">${esc(s.note.button)}</a>
    </aside>
  </section>`,

  'two-col-lists': (ctx, s, vt) => `
  <section class="wrap section lists">
    ${s.blocks
      .map((b) => {
        const posts = b.posts.map((x) => P(ctx, x));
        return `
      <div class="lists__col">
        ${head(ctx, b.title, b.more, 'More')}
        ${card(ctx, posts[0], vt, { sizes: '(min-width: 1100px) 30vw, 90vw', excerpt: false })}
        <div class="thumbs">${posts.slice(1).map((p) => thumb(ctx, p, vt)).join('')}</div>
      </div>`;
      })
      .join('')}
  </section>`,

  'magazine-band': (ctx, s) => {
    const [first, ...rest] = s.magazines;
    const m = mag(ctx, first);
    return `
  <section class="band" aria-labelledby="mag-title">
    <div class="wrap band__inner magband">
      <div class="magband__lead">
        ${cover(ctx, first, { sizes: '(min-width: 900px) 300px, 60vw', cls: 'cover--lg' })}
        <div class="magband__copy">
          <p class="label label--light">${esc(m.issue)}</p>
          <h2 id="mag-title">${esc(s.title)}</h2>
          <p>${esc(s.text)}</p>
          <div class="btn-row">
            <a class="btn btn--red btn--lg" href="${m.href}" target="_blank" rel="noopener"${readerAttrs(m)}>${icon.book} Read the latest issue</a>
            <a class="btn btn--outline-light btn--lg" href="${ctx.link('subscription/')}">Subscribe free</a>
          </div>
        </div>
      </div>
      <div class="shelf" aria-label="Past issues">
        ${rest.map((id) => `<figure class="shelf__item">${cover(ctx, id, { sizes: '160px' })}<figcaption>${esc(mag(ctx, id).issue)}</figcaption></figure>`).join('')}
      </div>
    </div>
  </section>`;
  },

  cta: (ctx, s) => `
  <section class="wrap section">
    <div class="cta">
      <div>
        <h2>${esc(s.title)}</h2>
        <p>${esc(s.text)}</p>
      </div>
      <a class="btn btn--dark btn--lg" href="${href(ctx, s.href)}">${esc(s.button)} ${icon.arrow}</a>
    </div>
  </section>`,
};

export const home = (ctx) => {
  const vt = makeVT();
  const body = ctx.home.sections.map((s) => sections[s.type](ctx, s, vt)).join('\n');
  return page(ctx, {
    title: `${ctx.site.fullName}: News and insights for Canadian SMEs`,
    description: ctx.site.tagline,
    canonical: `${ctx.site.url}/`,
    image: ctx.home.magazines[0].cover,
    body,
    active: 'home',
    bodyClass: 'is-home',
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'NewsMediaOrganization',
      name: ctx.site.fullName,
      url: ctx.site.url,
      logo: LOGO_DARK,
      address: ctx.site.contact.address,
      telephone: ctx.site.contact.phones[0],
      sameAs: ctx.site.social.map((s) => s.href),
    },
  });
};

// ---------- Article ----------

export const article = (ctx, post, html) => {
  const vt = makeVT();
  const cat = catOf(ctx, post);
  const author = ctx.authors[post.author];
  const related = ctx.byCategory[post.category].filter((p) => p.slug !== post.slug).slice(0, 4);
  const pageUrl = `${ctx.site.url}/${post.slug}/`;
  const u = encodeURIComponent(pageUrl);
  const t = encodeURIComponent(post.title);
  const share = [
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${u}`, '<path d="M14 8.5h2V5.2h-2.4C11 5.2 10 6.8 10 9v1.8H8V14h2v6h3.2v-6h2.4l.4-3.2h-2.8V9.4c0-.6.3-.9.8-.9z" fill="currentColor" stroke="none"/>'],
    ['X', `https://twitter.com/intent/tweet?url=${u}&text=${t}`, '<path d="M5 5l14 14M19 5 5 19" stroke-width="2"/>'],
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, '<path d="M6.5 9.5V18M6.5 6v.01M10.5 18v-5a2.5 2.5 0 0 1 5 0v5M10.5 11v7"/>'],
    ['WhatsApp', `https://wa.me/?text=${t}%20${u}`, '<path d="M5 19l1.2-3.6A7.5 7.5 0 1 1 9 18.3z"/><path d="M9.5 9.5c.3 1.7 1.8 3.4 3.8 4l1-1 1.7.8"/>'],
  ];
  const shareLinks = (cls) => `<div class="${cls}">${share
    .map(([n, h, d]) => `<a href="${h}" target="_blank" rel="noopener" aria-label="Share on ${n}"><svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg><span>${n}</span></a>`)
    .join('')}<button type="button" data-copy="${pageUrl}" aria-label="Copy link"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg><span>Copy link</span></button></div>`;
  const clock = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 1.8"/></svg>';
  const cal = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M4 10h16M9 3.5v4M15 3.5v4"/></svg>';
  const fallback = `
    <p class="lede">${esc(post.excerpt)}</p>
    <div class="notice">
      <p>This is a preview article. The full text will be brought over with the rest of the archive.</p>
      <a class="btn btn--ghost" href="${ctx.site.url}/${post.slug}/">Read it on canadiansme.ca</a>
    </div>`;

  const body = `
  <div class="progress" data-progress aria-hidden="true"></div>
  <article class="story"${tone(post.category)}>
    <header class="story__hero">
      <div class="story__glow" aria-hidden="true" style="background-image:url('${img(post.image, 500)}')"></div>
      <div class="wrap story__hero-inner">
        <div class="story__intro">
          <nav class="crumbs crumbs--light" aria-label="Breadcrumb"><a href="${ctx.link('')}">Home</a><span aria-hidden="true">/</span><a href="${ctx.link(`category/${cat.slug}/`)}">${esc(cat.name)}</a></nav>
          <h1 class="story__title">${esc(post.title)}</h1>
          <p class="story__dek">${esc(post.excerpt)}</p>
          <p class="story__meta">
            <a class="label" href="${ctx.link(`category/${cat.slug}/`)}">${esc(cat.name)}</a>
            <span>${cal}<time datetime="${post.date}">${longDate(post.date)}</time></span>
            <span>${clock}${post.readingTime} min read</span>
          </p>
        </div>
        <figure class="story__figure">
          ${picture(post, { w: 1400, sizes: '(min-width: 1100px) 46vw, 92vw', vt: vt(post), eager: true })}
        </figure>
      </div>
      ${shareLinks('story__share')}
    </header>

    <div class="wrap story__layout">
      <aside class="story__side" aria-label="About this article">
        <div class="story__side-inner">
          <p class="story__reading">You’re reading</p>
          <p class="story__side-title">${esc(post.title)}</p>
          <p class="story__time">${clock}${post.readingTime} min read</p>
          <div class="story__meter" aria-hidden="true"><span data-meter></span></div>
          <div class="story__author">
            <span class="avatar avatar--lg" aria-hidden="true">${esc(initials(author.name))}</span>
            <p><a href="${ctx.link(`author/${author.slug}/`)}">${esc(author.name)}</a>${author.role ? `<span>${esc(author.role)}</span>` : ''}<span>Published on ${shortDate(post.date)}</span></p>
          </div>
          <p class="story__share-title">Share this story</p>
          ${shareLinks('story__share story__share--inline')}
        </div>
      </aside>

      <div class="prose story__body">
        ${html || fallback}
        <aside class="author-card" aria-label="About the author">
          <span class="avatar avatar--lg" aria-hidden="true">${esc(initials(author.name))}</span>
          <div>
            <p class="author-card__name"><a href="${ctx.link(`author/${author.slug}/`)}">${esc(author.name)}</a></p>
            ${author.role ? `<p class="author-card__role">${esc(author.role)}</p>` : ''}
            ${author.bio ? `<p class="author-card__bio">${esc(author.bio)}</p>` : ''}
          </div>
        </aside>
      </div>

      <aside class="story__ad" aria-label="Advertisement">
        <div class="story__ad-inner">${ad(ctx, 'ups-skyscraper')}</div>
      </aside>
    </div>
  </article>
  ${related.length ? `
  <section class="wrap section story__related" aria-labelledby="related-title">
    ${head(ctx, `More in ${cat.name}`, `category/${cat.slug}/`).replace('<h2>', '<h2 id="related-title">')}
    <div class="grid grid--4">${related.map((p) => card(ctx, p, vt)).join('')}</div>
  </section>` : ''}
  <div class="wrap section section--ad">${ad(ctx, 'ups-leaderboard')}</div>`;

  const url = `${ctx.site.url}/${post.slug}/`;
  return page(ctx, {
    title: `${post.title} | ${ctx.site.name}`,
    description: post.excerpt,
    canonical: url,
    image: post.image,
    active: post.category,
    type: 'article',
    body,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: post.title,
      description: post.excerpt,
      image: [img(post.image, 1200)],
      datePublished: post.date,
      author: { '@type': /canadiansme|duca|startup|wow/.test(author.slug) ? 'Organization' : 'Person', name: author.name, url: `${ctx.site.url}/author/${author.slug}/` },
      publisher: { '@type': 'NewsMediaOrganization', name: ctx.site.fullName, url: ctx.site.url, logo: { '@type': 'ImageObject', url: LOGO_DARK } },
      mainEntityOfPage: url,
    },
  });
};

// ---------- Listings ----------

const listing = (ctx, { heading, intro, posts, active, canonical, title, extraHead = '' }) => {
  const vt = makeVT();
  // Long archives (thousands of articles) show the newest ones.
  const [first, ...rest] = posts.slice(0, 60);
  const body = `
  <header class="wrap listing__head">
    ${extraHead}
    <h1>${esc(heading)}</h1>
    ${intro ? `<p>${esc(intro)}</p>` : ''}
  </header>
  ${first ? `<section class="wrap section section--first" aria-label="Most recent"><div class="rows rows--lead">${storyRow(ctx, first, vt)}</div></section>` : `<p class="wrap empty">No articles here yet.</p>`}
  ${rest.length ? `<section class="wrap section" aria-label="More articles"><div class="grid grid--3">${rest.map((p) => card(ctx, p, vt)).join('')}</div></section>` : ''}
  <div class="wrap section section--ad">${ad(ctx, 'ups-leaderboard')}</div>`;
  return page(ctx, { title, description: intro || ctx.site.tagline, canonical, image: first?.image, active, body });
};

export const category = (ctx, cat) =>
  listing(ctx, {
    heading: cat.name,
    intro: cat.description,
    posts: ctx.byCategory[cat.slug],
    active: cat.slug,
    canonical: `${ctx.site.url}/category/${cat.slug}/`,
    title: `${cat.name} | ${ctx.site.fullName}`,
  });

export const authorPage = (ctx, author) =>
  listing(ctx, {
    heading: author.name,
    intro: author.bio,
    posts: ctx.posts.filter((p) => p.author === author.slug),
    canonical: `${ctx.site.url}/author/${author.slug}/`,
    title: `${author.name} | ${ctx.site.fullName}`,
    extraHead: `<span class="avatar avatar--xl" aria-hidden="true">${esc(initials(author.name))}</span>${author.role ? `<p class="label">${esc(author.role)}</p>` : ''}`,
  });

// ---------- Static pages ----------

export const staticPage = (ctx, pg, html) => {
  const vt = makeVT();
  const out = html
    .replace(/\{\{link:([^}]+)\}\}/g, (_, p) => ctx.link(p))
    .replace(/\{\{ad:([^}]+)\}\}/g, (_, id) => `<div class="section--ad">${ad(ctx, id)}</div>`)
    .replace(/\{\{cover:([^}]+)\}\}/g, (_, id) => `<div class="subscribe-hero__cover">${cover(ctx, id, { eager: true, sizes: '320px' })}</div>`)
    .replace('{{partners}}', () => `<section class="page-section"><h2 class="page-section__title">Our supporting partners</h2><div class="partners">${ctx.home.partners
      .map((p) => `<a class="partner" href="${p.href}" target="_blank" rel="noopener">${p.logo ? `<img src="${img(p.logo, 240)}" alt="" width="120" height="60" loading="lazy">` : `<span class="partner__mono" aria-hidden="true">AC</span>`}<span><strong>${esc(p.name)}</strong><span>${esc(p.role)}</span></span></a>`)
      .join('')}</div></section>`)
    .replace('{{social}}', () => ctx.site.social.map((s) => `<a href="${s.href}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join(''))
    .replace('{{archive}}', () => `
      <section class="page-section">
        <h2 class="page-section__title">Recent issues</h2>
        <div class="shelf shelf--light">${ctx.home.magazines.map((m) => `<figure class="shelf__item">${cover(ctx, m.id, { sizes: '180px' })}<figcaption>${esc(m.issue)}</figcaption></figure>`).join('')}</div>
      </section>`)
    .replace(/\{\{posts:([^}]+)\}\}/g, (_, c) => `
      <section class="page-section">
        <h2 class="page-section__title">Small business stories</h2>
        <div class="grid grid--3">${(ctx.byCategory[c] || []).slice(0, 6).map((p) => card(ctx, p, vt)).join('')}</div>
      </section>`);

  const body = `
  <header class="wrap listing__head">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="${ctx.link('')}">Home</a><span aria-hidden="true">/</span><span>${esc(pg.title)}</span></nav>
    <h1>${esc(pg.title)}</h1>
  </header>
  <div class="wrap page-body">${out}</div>`;
  return page(ctx, { title: `${pg.title} | ${ctx.site.fullName}`, description: pg.description, canonical: `${ctx.site.url}/${pg.slug}/`, active: pg.slug, body });
};

// ---------- Draft preview ----------

// An article page with placeholders (%%TITLE%% etc.). The CMS fills it in to show a draft in the
// real site design before it is published. Never linked from the site.
export const PREVIEW_IMAGE = 'https://preview.invalid/%%IMAGE%%';
export const previewTemplate = (ctx) => {
  const cat = { slug: '%%CATSLUG%%', name: '%%CATEGORY%%', description: '' };
  const author = { slug: '%%AUTHORSLUG%%', name: '%%AUTHOR%%', role: '', bio: '' };
  const post = {
    id: 0,
    slug: '%%SLUG%%',
    title: '%%TITLE%%',
    excerpt: '%%EXCERPT%%',
    date: '2000-01-01T00:00:00',
    category: cat.slug,
    author: author.slug,
    image: PREVIEW_IMAGE,
    readingTime: '%%READ%%',
  };
  const pctx = {
    ...ctx,
    categories: { ...ctx.categories, [cat.slug]: cat },
    authors: { ...ctx.authors, [author.slug]: author },
    byCategory: { ...ctx.byCategory, [cat.slug]: [] },
  };
  return article(pctx, post, '%%BODY%%');
};

export const notFound = (ctx) =>
  page(ctx, {
    title: `Page not found | ${ctx.site.name}`,
    description: 'This page could not be found.',
    canonical: `${ctx.site.url}/404/`,
    body: `
    <section class="wrap notfound">
      <h1>We couldn’t find that page</h1>
      <p>It may have moved when we redesigned the site. Try searching, or start from the latest stories.</p>
      <div class="btn-row">
        <button class="btn btn--red" type="button" data-search-open>Search articles</button>
        <a class="btn btn--ghost" href="${ctx.link('')}">Go to the homepage</a>
      </div>
    </section>`,
  });

function initials(name) {
  return name
    .replace(/CanadianSME/i, 'C S')
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export { full };
