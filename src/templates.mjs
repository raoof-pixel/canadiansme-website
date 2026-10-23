// temp-2: FullStory-style layout for CanadianSME.
// Navy header, full-bleed photo slider, story rows with a sticky sidebar,
// photo-card carousels on a pale band and a navy footer.
import { esc, img, full, srcset, shortDate, longDate } from './lib.mjs';

const LOGO_DARK = 'https://i0.wp.com/canadiansme.ca/wp-content/uploads/2021/03/Magazine-dark-logo.png';
const LOGO_LIGHT = 'https://i0.wp.com/canadiansme.ca/wp-content/uploads/2021/02/Magazine-light-logo-1.png';
const FAVICON = 'https://i0.wp.com/canadiansme.ca/wp-content/uploads/2021/02/cropped-whilte-fevicon.png';

// ---------- Icons ----------

const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" aria-hidden="true"${extra}>${d}</svg>`;
const icon = {
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'),
  menu: svg('<path d="M4 7h16M8 12h12M4 17h16"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  arrow: svg('<path d="M5 12h13M13 6l6 6-6 6"/>'),
  prev: svg('<path d="M19 12H6M11 6l-6 6 6 6"/>'),
  next: svg('<path d="M5 12h13M13 6l6 6-6 6"/>'),
  chevron: svg('<path d="M10 7l5 5-5 5"/>'),
  user: svg('<circle cx="12" cy="8.5" r="3.5"/><path d="M5 19.5c1.4-3.2 4-4.5 7-4.5s5.6 1.3 7 4.5"/>'),
  clock: svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 1.8"/>'),
  play: svg('<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>'),
  book: svg('<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>'),
  mail: svg('<rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="m4 7 8 6 8-6"/>'),
  link: svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
};
const social = {
  Facebook: svg('<path d="M14 8.5h2V5.2h-2.4C11 5.2 10 6.8 10 9v1.8H8V14h2v6h3.2v-6h2.4l.4-3.2h-2.8V9.4c0-.6.3-.9.8-.9z" fill="currentColor" stroke="none"/>'),
  X: svg('<path d="M5 5l14 14M19 5 5 19" stroke-width="2"/>'),
  LinkedIn: svg('<path d="M6.5 9.5V18M6.5 6v.01M10.5 18v-5a2.5 2.5 0 0 1 5 0v5M10.5 11v7"/>'),
  Instagram: svg('<rect x="4.5" y="4.5" width="15" height="15" rx="4"/><circle cx="12" cy="12" r="3.4"/><path d="M16.6 7.4v.01"/>'),
  YouTube: svg('<rect x="3.5" y="6.5" width="17" height="11" rx="3"/><path d="M10.5 9.8v4.4l3.8-2.2z" fill="currentColor"/>'),
};
const socialIcon = (label) => social[label] || social[Object.keys(social).find((k) => label.includes(k))] || icon.link;

// ---------- Helpers ----------

const href = (ctx, path) => (/^https?:/.test(path) ? path : ctx.link(path));
const ext = (path) => (/^https?:/.test(path) && !/canadiansme\.ca/.test(path) ? ' target="_blank" rel="noopener"' : '');
const postUrl = (ctx, p) => ctx.link(`${p.slug}/`);
const catOf = (ctx, p) => ctx.categories[p.category];
const authorOf = (ctx, p) => ctx.authors[p.author];

const P = (ctx, slug) => {
  const p = ctx.postsBySlug[slug];
  if (!p) throw new Error(`Unknown post referenced: ${slug}`);
  return p;
};
const mag = (ctx, id) => ctx.home.magazines.find((m) => m.id === id);
const fromCat = (ctx, slug, n, skip = []) => (ctx.byCategory[slug] || []).filter((p) => !skip.includes(p.slug)).slice(0, n);

// Opens an Issuu issue in the on-page reader; the Issuu link stays as the fallback.
const readerAttrs = (m) => {
  const doc = (m.href.split('/docs/')[1] || '').split(/[?#]/)[0];
  return doc ? ` data-reader="${esc(doc)}" data-reader-title="${esc(`${m.title}, ${m.issue}`)}" data-reader-href="${m.href}"` : '';
};
const magLink = (m, cls, inner, extra = '') => `<a class="${cls}" href="${m.href}" target="_blank" rel="noopener"${readerAttrs(m)}${extra}>${inner}</a>`;

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
  return text ? `<p class="tag">${esc(text)}</p>` : `<a class="tag" href="${ctx.link(`category/${c.slug}/`)}">${esc(c.name)}</a>`;
};

const dateLine = (p) => `<p class="when"><time datetime="${p.date}">${shortDate(p.date)}</time><span class="dot" aria-hidden="true"></span>${p.readingTime} min read</p>`;
const byLine = (ctx, p) => {
  const a = authorOf(ctx, p);
  return a ? `<p class="by">Author: <a href="${ctx.link(`author/${a.slug}/`)}">${esc(a.name)}</a></p>` : '';
};

const sectionHead = (ctx, title, more, extra = '') => `
  <div class="shead">
    <h2>${esc(title)}</h2>
    <div class="shead__end">
      ${more ? `<a class="shead__more" href="${href(ctx, more)}">View all</a>` : ''}
      ${extra}
    </div>
  </div>`;

const arrows = (prev, next, cls = '') => `
  <div class="arrows${cls}">
    <button class="arrow" type="button" ${prev} aria-label="Previous">${icon.prev}</button>
    <button class="arrow" type="button" ${next} aria-label="Next">${icon.next}</button>
  </div>`;

// ---------- Cards ----------

// Story row: text left, big photo right (the FullStory signature).
const row = (ctx, p, vt, { eager = false } = {}) => `
  <article class="row">
    <div class="row__text">
      ${label(ctx, p)}
      <h3 class="row__title"><a href="${postUrl(ctx, p)}">${esc(p.title)}</a></h3>
      <p class="row__excerpt">${esc(p.excerpt)}</p>
      <div class="row__meta">${dateLine(p)}${byLine(ctx, p)}</div>
    </div>
    <a class="row__img" href="${postUrl(ctx, p)}" tabindex="-1" aria-hidden="true">${picture(p, { w: 1000, sizes: '(min-width: 1200px) 560px, (min-width: 760px) 55vw, 92vw', vt: vt(p), eager })}</a>
  </article>`;

// Small thumbnail line for sidebars.
export const thumb = (ctx, p, vt) => `
  <article class="thumb">
    <a class="thumb__img" href="${postUrl(ctx, p)}" tabindex="-1" aria-hidden="true">${picture(p, { w: 300, sizes: '104px', vt: vt(p) })}</a>
    <h3 class="thumb__title"><a href="${postUrl(ctx, p)}">${esc(p.title)}</a></h3>
  </article>`;

// Tall photo card with the title over the image (carousels).
const tile = (ctx, p, vt) => `
  <article class="tile">
    <a class="tile__link" href="${postUrl(ctx, p)}">
      ${picture(p, { w: 700, sizes: '(min-width: 1200px) 300px, (min-width: 760px) 40vw, 72vw', vt: vt(p) })}
      <span class="tile__body">
        <span class="tile__tag">${esc(catOf(ctx, p).name)}</span>
        <span class="tile__title">${esc(p.title)}</span>
      </span>
    </a>
  </article>`;

// Standard card: photo on top (listings, related).
export const card = (ctx, p, vt, { excerpt = true, paid = false } = {}) => `
  <article class="card">
    <a class="card__img" href="${postUrl(ctx, p)}" tabindex="-1" aria-hidden="true">${picture(p, { w: 800, sizes: '(min-width: 1200px) 400px, (min-width: 760px) 45vw, 92vw', vt: vt(p) })}</a>
    ${paid ? '<p class="paid">Partner content</p>' : ''}
    ${label(ctx, p)}
    <h3 class="card__title"><a href="${postUrl(ctx, p)}">${esc(p.title)}</a></h3>
    ${excerpt ? `<p class="card__excerpt">${esc(p.excerpt)}</p>` : ''}
    ${dateLine(p)}
  </article>`;

export const storyCard = (ctx, p, vt) => card(ctx, p, vt);
export const rowCard = thumb;

// ---------- Ads, magazine, subscribe ----------

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

const coverImg = (m, { eager = false, sizes = '240px' } = {}) =>
  `<img src="${img(m.cover, 640)}" srcset="${img(m.cover, 320)} 320w, ${img(m.cover, 640)} 640w, ${img(m.cover, 1000)} 1000w" sizes="${sizes}" alt="Cover of ${esc(m.title)}, ${esc(m.issue)}" width="1004" height="1300"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;

const cover = (ctx, id, opts = {}) => {
  const m = mag(ctx, id);
  return m ? magLink(m, `cover${opts.cls ? ` ${opts.cls}` : ''}`, coverImg(m, opts), ` aria-label="Read ${esc(m.title)}, ${esc(m.issue)}"`) : '';
};

const subscribeForm = (ctx, id, { dark = true } = {}) => `
  <form class="subform${dark ? ' subform--dark' : ''}" action="${ctx.link('subscription/')}" method="get">
    <label class="visually-hidden" for="${id}-first">First name</label>
    <input id="${id}-first" name="first" placeholder="First name" autocomplete="given-name" required>
    <label class="visually-hidden" for="${id}-email">Email</label>
    <input id="${id}-email" name="email" type="email" placeholder="Email address" autocomplete="email" required>
    <button class="btn btn--accent" type="submit">Subscribe free</button>
  </form>`;

// Tall navy promo card that stays in view in the sidebar.
const promoCard = (ctx, s) => {
  const m = mag(ctx, s.magazine);
  return `
  <aside class="promo" aria-labelledby="promo-title">
    <div class="promo__bg" aria-hidden="true">${m ? coverImg(m, { sizes: '340px' }) : ''}</div>
    <div class="promo__body">
      <h2 id="promo-title" class="promo__title">${esc(s.title)} <span>[${esc(s.accent)}]</span></h2>
      <p>${esc(s.text)}</p>
      ${subscribeForm(ctx, 'promo')}
    </div>
  </aside>`;
};

// ---------- Layout shell ----------

const logo = (ctx, light = true) => `
  <a class="logo" href="${ctx.link('')}" aria-label="CanadianSME Small Business Magazine home">
    <img src="${light ? LOGO_LIGHT : LOGO_DARK}?w=520&ssl=1" alt="CanadianSME Small Business Magazine" width="230" height="40">
  </a>`;

const header = (ctx, active) => `
  <a class="skip" href="#main">Skip to content</a>
  <header class="nav" data-masthead>
    <div class="wrap nav__inner">
      ${logo(ctx)}
      <nav class="nav__links" aria-label="Sections">
        ${ctx.site.nav.map((slug) => `<a href="${ctx.link(`category/${slug}/`)}"${active === slug ? ' aria-current="page"' : ''}>${esc(ctx.categories[slug].name)}</a>`).join('')}
      </nav>
      <button class="nav__search" type="button" data-search-open aria-label="Search articles"><span>Search...</span><i>${icon.search}</i></button>
      <button class="nav__menu" type="button" data-menu-open aria-label="Open menu">${icon.menu}</button>
    </div>
  </header>
  <div class="drawer" data-drawer hidden>
    <div class="drawer__panel" role="dialog" aria-modal="true" aria-label="Menu">
      <div class="drawer__top">${logo(ctx)}<button class="nav__menu" type="button" data-menu-close aria-label="Close menu">${icon.close}</button></div>
      <button class="nav__search nav__search--wide" type="button" data-search-open data-menu-close><span>Search articles</span><i>${icon.search}</i></button>
      <nav class="drawer__main" aria-label="Sections">
        ${ctx.site.nav.map((slug) => `<a href="${ctx.link(`category/${slug}/`)}">${esc(ctx.categories[slug].name)}</a>`).join('')}
      </nav>
      <nav class="drawer__more" aria-label="More from CanadianSME">
        ${ctx.site.utilityLinks.map((l) => `<a href="${href(ctx, l.href)}"${ext(l.href)}>${esc(l.label)}</a>`).join('')}
        <a href="${ctx.link('about-us/')}">About us</a>
        <a href="${ctx.link('contact-us/')}">Contact us</a>
      </nav>
      <a class="btn btn--accent btn--block" href="${ctx.link('subscription/')}">Subscribe free</a>
    </div>
  </div>
  <div class="search" data-search hidden>
    <div class="search__panel" role="dialog" aria-modal="true" aria-label="Search">
      <label class="search__field">
        ${icon.search}
        <input type="search" placeholder="Search articles" autocomplete="off" data-search-input aria-label="Search articles">
        <button class="search__close" type="button" data-search-close aria-label="Close search">${icon.close}</button>
      </label>
      <ul class="search__results" data-search-results></ul>
    </div>
  </div>`;

const footer = (ctx) => `
  <footer class="footer">
    <div class="wrap">
      <div class="footer__top">
        <div class="footer__about">
          ${logo(ctx)}
          <h2>About CanadianSME</h2>
          <p>The premier platform for Canada’s small and medium enterprises: news, interviews, research and a free monthly magazine, from the team behind the Small Business Summit, Expo and National Business Awards.</p>
        </div>
        <div class="footer__news">
          <h2>${icon.mail} Newsletter</h2>
          <p>Subscribe now to get every new issue, event updates and business insights in your inbox.</p>
          <form class="footer__form" action="${ctx.link('subscription/')}" method="get">
            <label class="visually-hidden" for="ft-email">Email address</label>
            <input id="ft-email" type="email" name="email" placeholder="you@business.ca" autocomplete="email" required>
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </div>
      <nav class="footer__nav" aria-label="Sections">${Object.values(ctx.categories).slice(0, 12).map((c) => `<a href="${ctx.link(`category/${c.slug}/`)}">${esc(c.name)}</a>`).join('')}</nav>
      <nav class="footer__nav footer__nav--sub" aria-label="CanadianSME">
        ${[...ctx.site.utilityLinks, ...ctx.site.footerLinks].filter((l, i, all) => all.findIndex((x) => x.label === l.label) === i).map((l) => `<a href="${href(ctx, l.href)}"${ext(l.href)}>${esc(l.label)}</a>`).join('')}
      </nav>
      <div class="footer__legal">
        <p>© ${ctx.now.getFullYear()} CanadianSME Magazine<span class="bar" aria-hidden="true"></span>All rights reserved<span class="bar" aria-hidden="true"></span>${esc(ctx.site.contact.company)}, ${esc(ctx.site.contact.address)}<span class="bar" aria-hidden="true"></span>${ctx.site.contact.phones.map(esc).join(', ')}</p>
        <nav class="footer__social" aria-label="Social">${ctx.site.social.map((s) => `<a href="${s.href}" target="_blank" rel="noopener" aria-label="${esc(s.label)}">${socialIcon(s.label)}</a>`).join('')}</nav>
      </div>
    </div>
  </footer>`;

const readerModal = () => `
<div class="reader" data-reader-modal hidden>
  <div class="reader__panel" role="dialog" aria-modal="true" aria-labelledby="reader-title">
    <div class="reader__bar">
      <p id="reader-title" class="reader__title" data-reader-name>CanadianSME Small Business Magazine</p>
      <a class="btn btn--line" href="https://issuu.com/canadiansme" target="_blank" rel="noopener" data-reader-out>Open in a new tab</a>
      <button class="search__close" type="button" data-reader-close aria-label="Close magazine">${icon.close}</button>
    </div>
    <div class="reader__frame"><iframe data-reader-frame title="Magazine reader" allowfullscreen></iframe></div>
  </div>
</div>`;

// Floating pill, like FullStory's corner button: always one tap from subscribing.
const floater = (ctx) => `<a class="floater" href="${ctx.link('subscription/')}" data-floater>${icon.mail} Subscribe free</a>`;

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
<meta name="theme-color" content="#020A1C">
<link rel="icon" href="${FAVICON}?fit=32%2C32&ssl=1" sizes="32x32">
<link rel="icon" href="${FAVICON}?fit=192%2C192&ssl=1" sizes="192x192">
<link rel="apple-touch-icon" href="${FAVICON}?fit=180%2C180&ssl=1">
<link rel="preconnect" href="https://api.fontshare.com">
<link rel="preconnect" href="https://cdn.fontshare.com" crossorigin>
<link rel="preconnect" href="https://i0.wp.com">
<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap">
<link rel="stylesheet" href="${ctx.link('assets/styles.css')}?v=${ctx.version}">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
${header(ctx, active)}
<main id="main">
${body}
</main>
${footer(ctx)}
${floater(ctx)}
${readerModal()}
<script>window.__SEARCH_INDEX__=${JSON.stringify(ctx.searchIndex)};</script>
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
        const H = on ? 'h1' : 'h2';
        const attrs = `data-slide aria-roledescription="slide" aria-label="${i + 1} of ${s.slides.length}"${on ? '' : ' aria-hidden="true"'}`;
        if (sl.kind === 'magazine') {
          const m = mag(ctx, sl.magazine);
          const hl = (sl.highlights || []).map((h) => `<li><a href="${ctx.link(`${h.post}/`)}"${hide}><span>p. ${esc(h.page)}</span>${esc(h.title)}</a></li>`).join('');
          return `
      <article class="hero__slide hero__slide--mag${on ? ' is-active' : ''}" ${attrs}>
        <div class="hero__media" aria-hidden="true"><span class="hero__blur" style="background-image:url('${img(m.cover, 600)}')"></span></div>
        <div class="wrap hero__inner">
          <div class="hero__copy">
            <p class="tag tag--light">${esc(m.title)} · ${esc(m.issue)}</p>
            <${H} class="hero__title">${esc(sl.heading)}</${H}>
            <p class="hero__text">${esc(sl.text)}</p>
            ${hl ? `<ul class="hero__list">${hl}</ul>` : ''}
            <div class="hero__actions">
              ${magLink(m, 'btn btn--accent btn--lg', `${icon.book} ${esc(sl.cta)}`, hide)}
              <a class="btn btn--glass btn--lg" href="${ctx.link('subscription/')}"${hide}>Subscribe free</a>
            </div>
          </div>
          <div class="hero__cover">${magLink(m, 'cover', coverImg(m, { eager: on, sizes: '(min-width: 900px) 360px, 50vw' }), `${hide} aria-label="Read ${esc(m.title)}, ${esc(m.issue)}"`)}</div>
        </div>
      </article>`;
        }
        const p = P(ctx, sl.post);
        const a = authorOf(ctx, p);
        return `
      <article class="hero__slide${on ? ' is-active' : ''}" ${attrs}>
        <div class="hero__media" aria-hidden="true">
          <span class="hero__blur" style="background-image:url('${img(p.image, 400)}')"></span>
          ${picture(p, { w: 1600, sizes: '(min-width: 900px) 64vw, 100vw', eager: on, cls: 'hero__photo' })}
        </div>
        <div class="wrap hero__inner">
          <div class="hero__copy">
            <p class="tag tag--light">${esc(sl.label || catOf(ctx, p).name)}</p>
            <${H} class="hero__title"><a href="${postUrl(ctx, p)}"${hide}>${esc(p.title)}</a></${H}>
            <p class="hero__text">${esc(p.excerpt)}</p>
            <p class="hero__meta">
              <a href="${postUrl(ctx, p)}"${hide}><i>${icon.chevron}</i>Read story</a>
              <a href="${ctx.link(`author/${a.slug}/`)}"${hide}><i>${icon.user}</i>${esc(a.name)}</a>
              <span><i>${icon.clock}</i>${p.readingTime} min read</span>
            </p>
          </div>
        </div>
      </article>`;
      })
      .join('')}
    <div class="wrap hero__controls">
      <div class="hero__dots">${s.slides.map((_, i) => `<button type="button" data-dot="${i}" aria-label="Show slide ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}><span></span></button>`).join('')}</div>
      ${arrows('data-prev', 'data-next', ' arrows--glass')}
    </div>
  </section>`,

  stories: (ctx, s, vt) => {
    const m = mag(ctx, s.banner.magazine);
    return `
  <section class="wrap layout" aria-label="Top stories">
    <div class="layout__main">
      <div class="rows">${s.rows.map((x) => row(ctx, P(ctx, x), vt)).join('')}</div>
      <aside class="banner" aria-label="${esc(m.issue)} magazine">
        <div class="banner__copy">
          <p class="tag tag--light">${esc(m.issue)}</p>
          <h2 class="banner__title">${esc(s.banner.title)}</h2>
          <p>${esc(s.banner.text)}</p>
          ${magLink(m, 'btn btn--accent', `${icon.book} ${esc(s.banner.button)}`)}
        </div>
        <div class="banner__cover">${cover(ctx, m.id, { sizes: '220px' })}</div>
      </aside>
    </div>
    <aside class="layout__side" aria-labelledby="side-title">
      <h2 id="side-title" class="side-title">${esc(s.sideTitle)}</h2>
      <div class="thumbs">${s.side.map((x) => thumb(ctx, P(ctx, x), vt)).join('')}</div>
      <div class="sticky">${promoCard(ctx, s.promo)}</div>
    </aside>
  </section>`;
  },

  ad: (ctx, s) => `<div class="wrap adrow">${ad(ctx, s.ad)}</div>`,

  carousel: (ctx, s, vt) => {
    const posts = s.posts ? s.posts.map((x) => P(ctx, x)) : fromCat(ctx, s.category, 9);
    return `
  <section class="band-soft${s.soft ? '' : ' band-soft--white'}" aria-label="${esc(s.title)}" data-carousel>
    <div class="wrap">
      ${sectionHead(ctx, s.title, s.more, arrows('data-car-prev', 'data-car-next'))}
      <div class="carousel" data-car-track tabindex="0">${posts.map((p) => tile(ctx, p, vt)).join('')}</div>
    </div>
  </section>`;
  },

  feature: (ctx, s, vt) => {
    const lead = P(ctx, s.lead);
    const c = ctx.categories[s.category];
    const more = s.more.map((x) => P(ctx, x));
    const side = fromCat(ctx, s.sideCategory, s.sideCount || 5, [lead.slug, ...s.more]);
    return `
  <section class="wrap feature${s.flip ? ' feature--flip' : ''}" aria-labelledby="ft-${c.slug}">
    <div class="feature__text">
      <a class="tag" href="${ctx.link(`category/${c.slug}/`)}">${esc(c.name)}</a>
      <h2 id="ft-${c.slug}" class="feature__title"><a href="${postUrl(ctx, lead)}">${esc(lead.title)}</a></h2>
      <p class="feature__excerpt">${esc(lead.excerpt)}</p>
      <div class="row__meta">${dateLine(lead)}${byLine(ctx, lead)}</div>
      <div class="more-list">
        <h3>${esc(s.moreTitle)}</h3>
        <ul>${more.map((p) => `<li><a href="${postUrl(ctx, p)}">${esc(p.title)}</a></li>`).join('')}</ul>
      </div>
    </div>
    <a class="feature__img" href="${postUrl(ctx, lead)}" tabindex="-1" aria-hidden="true">${picture(lead, { w: 1000, sizes: '(min-width: 1200px) 520px, 92vw', vt: vt(lead) })}</a>
    <aside class="feature__side" aria-label="${esc(s.sideTitle)}">
      <div class="side-head"><h3 class="side-title">${esc(s.sideTitle)}</h3><a href="${ctx.link(`category/${s.sideCategory}/`)}">View all</a></div>
      <div class="thumbs">${side.map((p) => thumb(ctx, p, vt)).join('')}</div>
      ${s.ad ? ad(ctx, s.ad) : ''}
    </aside>
  </section>`;
  },

  podcast: (ctx, s) => `
  <section class="wrap podrow" aria-labelledby="pod-title">
    <div class="podcast">
      <div class="podcast__intro">
        <p class="tag tag--light">Podcast</p>
        <h2 id="pod-title">${esc(s.title)}</h2>
        <p>${esc(s.text)}</p>
        <div class="hero__actions">
          <a class="btn btn--accent" href="https://smbpodcast.ca/" target="_blank" rel="noopener">${icon.play} Listen now</a>
          <a class="btn btn--glass" href="https://www.youtube.com/@Canadian-SME" target="_blank" rel="noopener">Watch on YouTube</a>
        </div>
      </div>
      <ol class="podcast__list">
        ${s.episodes.map((e, i) => `<li><a href="${e.href}" target="_blank" rel="noopener"><span class="podcast__num">${String(i + 1).padStart(2, '0')}</span><span><strong>${esc(e.title)}</strong><span>${esc(e.guest)}</span></span><i>${icon.play}</i></a></li>`).join('')}
      </ol>
    </div>
    ${ad(ctx, s.ad)}
  </section>`,

  'partner-content': (ctx, s, vt) => `
  <section class="wrap partners-sec" aria-labelledby="pc-title">
    ${sectionHead(ctx, s.title)}
    <div class="partners">
      ${ctx.home.partners.map((p) => `<a class="partner" href="${p.href}" target="_blank" rel="noopener">${p.logo ? `<img src="${img(p.logo, 240)}" alt="" width="120" height="60" loading="lazy">` : `<span class="partner__mono" aria-hidden="true">AC</span>`}<span><strong>${esc(p.name)}</strong><span>${esc(p.role)}</span></span></a>`).join('')}
    </div>
    <div class="grid grid--3">${s.posts.map((x) => card(ctx, P(ctx, x), vt, { paid: true })).join('')}</div>
    <aside class="note" aria-label="Advertisement from ${esc(s.note.sponsor)}">
      <p><span class="ad__label">Advertisement</span><strong>${esc(s.note.sponsor)}.</strong> ${esc(s.note.text)}</p>
      <a class="btn btn--line" href="${s.note.href}" target="_blank" rel="sponsored noopener">${esc(s.note.button)}</a>
    </aside>
  </section>`,

  'magazine-band': (ctx, s) => {
    const [first, ...rest] = s.magazines;
    const m = mag(ctx, first);
    return `
  <section class="magband" aria-labelledby="mag-title">
    <div class="wrap">
      <div class="magband__lead">
        ${cover(ctx, first, { sizes: '(min-width: 900px) 280px, 56vw', cls: 'cover--lg' })}
        <div class="magband__copy">
          <p class="tag tag--light">${esc(m.issue)}</p>
          <h2 id="mag-title">${esc(s.title)}</h2>
          <p>${esc(s.text)}</p>
          <div class="hero__actions">
            ${magLink(m, 'btn btn--accent btn--lg', `${icon.book} Read the latest issue`)}
            <a class="btn btn--glass btn--lg" href="${ctx.link('subscription/')}">Subscribe free</a>
          </div>
        </div>
      </div>
      <div class="shelf" aria-label="Past issues">
        ${rest.map((id) => `<figure class="shelf__item">${cover(ctx, id, { sizes: '170px' })}<figcaption>${esc(mag(ctx, id).issue)}</figcaption></figure>`).join('')}
      </div>
    </div>
  </section>`;
  },

  cta: (ctx, s) => `
  <section class="wrap ctarow">
    <div class="cta">
      <div>
        <h2>${esc(s.title)}</h2>
        <p>${esc(s.text)}</p>
      </div>
      <a class="btn btn--accent btn--lg" href="${href(ctx, s.href)}">${esc(s.button)} ${icon.arrow}</a>
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

const shareLinks = (ctx, post) => {
  const u = encodeURIComponent(`${ctx.site.url}/${post.slug}/`);
  const t = encodeURIComponent(post.title);
  return [
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${u}`],
    ['X', `https://twitter.com/intent/tweet?url=${u}&text=${t}`],
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${u}`],
  ]
    .map(([n, h]) => `<a href="${h}" target="_blank" rel="noopener" aria-label="Share on ${n}">${socialIcon(n)}</a>`)
    .join('') + `<button type="button" data-copy="${ctx.site.url}/${post.slug}/" aria-label="Copy link">${icon.link}</button>`;
};

export const article = (ctx, post, html) => {
  const vt = makeVT();
  const cat = catOf(ctx, post);
  const author = authorOf(ctx, post);
  const related = ctx.byCategory[post.category].filter((p) => p.slug !== post.slug).slice(0, 8);
  const latest = ctx.latest.filter((p) => p.slug !== post.slug && !related.includes(p)).slice(0, 5);
  const fallback = `
    <p class="lede">${esc(post.excerpt)}</p>
    <div class="notice">
      <p>This is a preview article. The full text will be brought over with the rest of the archive.</p>
      <a class="btn btn--line" href="${ctx.site.url}/${post.slug}/">Read it on canadiansme.ca</a>
    </div>`;

  const body = `
  <div class="progress" data-progress aria-hidden="true"></div>
  <article class="post">
    <header class="post__hero">
      <div class="post__media" aria-hidden="true">${picture(post, { w: 1800, sizes: '100vw', vt: vt(post), eager: true })}</div>
      <div class="wrap post__head">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="${ctx.link('')}">Home</a>${icon.chevron}<a href="${ctx.link(`category/${cat.slug}/`)}">${esc(cat.name)}</a></nav>
        <h1 class="post__title">${esc(post.title)}</h1>
        <p class="hero__meta">
          <a href="${ctx.link(`author/${author.slug}/`)}"><i>${icon.user}</i>${esc(author.name)}</a>
          <span><i>${icon.clock}</i>${post.readingTime} min read</span>
          <span><time datetime="${post.date}">${longDate(post.date)}</time></span>
        </p>
      </div>
      <nav class="post__share" aria-label="Share">${shareLinks(ctx, post)}</nav>
    </header>
    <div class="wrap post__layout">
      <aside class="post__left" aria-label="You’re reading">
        <div class="sticky">
          <p class="tag">You’re reading</p>
          <p class="post__left-title">${esc(post.title)}</p>
          <p class="when"><i>${icon.clock}</i>${post.readingTime} min read</p>
          <nav class="post__share post__share--inline" aria-label="Share">${shareLinks(ctx, post)}</nav>
        </div>
      </aside>
      <div class="prose">
        ${html || fallback}
        <aside class="author-card" aria-label="About the author">
          <span class="avatar" aria-hidden="true">${esc(initials(author.name))}</span>
          <div>
            <p class="author-card__name"><a href="${ctx.link(`author/${author.slug}/`)}">${esc(author.name)}</a></p>
            ${author.role ? `<p class="author-card__role">${esc(author.role)}</p>` : ''}
            ${author.bio ? `<p class="author-card__bio">${esc(author.bio)}</p>` : ''}
          </div>
        </aside>
      </div>
      <aside class="post__right" aria-labelledby="aside-title">
        <h2 id="aside-title" class="side-title">Latest</h2>
        <div class="thumbs">${latest.map((p) => thumb(ctx, p, vt)).join('')}</div>
        <div class="sticky">${ad(ctx, 'ups-skyscraper')}</div>
      </aside>
    </div>
  </article>
  ${related.length ? `
  <section class="band-soft" aria-label="More in ${esc(cat.name)}" data-carousel>
    <div class="wrap">
      ${sectionHead(ctx, `More in ${cat.name}`, `category/${cat.slug}/`, arrows('data-car-prev', 'data-car-next'))}
      <div class="carousel" data-car-track tabindex="0">${related.map((p) => tile(ctx, p, vt)).join('')}</div>
    </div>
  </section>` : ''}
  <div class="wrap adrow">${ad(ctx, 'ups-leaderboard')}</div>`;

  const url = `${ctx.site.url}/${post.slug}/`;
  return page(ctx, {
    title: `${post.title} | ${ctx.site.name}`,
    description: post.excerpt,
    canonical: url,
    image: post.image,
    active: post.category,
    type: 'article',
    body,
    bodyClass: 'is-article',
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

const pageHead = (ctx, { crumbs, heading, intro, extra = '' }) => `
  <header class="phead">
    <div class="wrap phead__inner">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="${ctx.link('')}">Home</a>${icon.chevron}<span>${esc(crumbs)}</span></nav>
      ${extra}
      <h1>${esc(heading)}</h1>
      ${intro ? `<p>${esc(intro)}</p>` : ''}
    </div>
  </header>`;

const listing = (ctx, { crumbs, heading, intro, posts, active, canonical, title, extra = '' }) => {
  const vt = makeVT();
  const latest = ctx.latest.filter((p) => !posts.includes(p)).slice(0, 5);
  const body = `
  ${pageHead(ctx, { crumbs, heading, intro, extra })}
  <section class="wrap layout" aria-label="Articles">
    <div class="layout__main">
      ${posts.length ? `<div class="rows">${posts.map((p, i) => row(ctx, p, vt, { eager: i === 0 })).join('')}</div>` : '<p class="empty">No articles here yet.</p>'}
    </div>
    <aside class="layout__side" aria-labelledby="side-title">
      <h2 id="side-title" class="side-title">Latest</h2>
      <div class="thumbs">${latest.map((p) => thumb(ctx, p, vt)).join('')}</div>
      <div class="sticky">${promoCard(ctx, { magazine: ctx.home.magazines[0].id, title: 'We go beyond the headlines to bring you the', accent: 'full story', text: 'Subscribe to CanadianSME for free: every new issue, event updates and business insights in your inbox.' })}</div>
    </aside>
  </section>
  <div class="wrap adrow">${ad(ctx, 'ups-leaderboard')}</div>`;
  return page(ctx, { title, description: intro || ctx.site.tagline, canonical, image: posts[0]?.image, active, body });
};

export const category = (ctx, cat) =>
  listing(ctx, {
    crumbs: cat.name,
    heading: cat.name,
    intro: cat.description,
    posts: ctx.byCategory[cat.slug],
    active: cat.slug,
    canonical: `${ctx.site.url}/category/${cat.slug}/`,
    title: `${cat.name} | ${ctx.site.fullName}`,
  });

export const authorPage = (ctx, author) =>
  listing(ctx, {
    crumbs: 'Authors',
    heading: author.name,
    intro: author.bio,
    posts: ctx.posts.filter((p) => p.author === author.slug),
    canonical: `${ctx.site.url}/author/${author.slug}/`,
    title: `${author.name} | ${ctx.site.fullName}`,
    extra: `<div class="phead__author"><span class="avatar avatar--lg" aria-hidden="true">${esc(initials(author.name))}</span>${author.role ? `<p class="tag tag--light">${esc(author.role)}</p>` : ''}</div>`,
  });

// ---------- Static pages ----------

export const staticPage = (ctx, pg, html) => {
  const vt = makeVT();
  const out = html
    .replace(/\{\{link:([^}]+)\}\}/g, (_, p) => ctx.link(p))
    .replace(/\{\{ad:([^}]+)\}\}/g, (_, id) => `<div class="adrow adrow--flat">${ad(ctx, id)}</div>`)
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
  ${pageHead(ctx, { crumbs: pg.title, heading: pg.title, intro: pg.description })}
  <div class="wrap page-body">${out}</div>`;
  return page(ctx, { title: `${pg.title} | ${ctx.site.fullName}`, description: pg.description, canonical: `${ctx.site.url}/${pg.slug}/`, body });
};

export const notFound = (ctx) =>
  page(ctx, {
    title: `Page not found | ${ctx.site.name}`,
    description: 'This page could not be found.',
    canonical: `${ctx.site.url}/404/`,
    body: `
    ${pageHead(ctx, { crumbs: 'Not found', heading: 'We couldn’t find that page', intro: 'It may have moved when we redesigned the site. Try searching, or start from the latest stories.' })}
    <section class="wrap notfound">
      <button class="btn btn--accent btn--lg" type="button" data-search-open>${icon.search} Search articles</button>
      <a class="btn btn--line btn--lg" href="${ctx.link('')}">Go to the homepage</a>
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
