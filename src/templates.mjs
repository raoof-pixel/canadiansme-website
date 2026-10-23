import { esc, img, full, srcset, shortDate, longDate } from './lib.mjs';

const LOGO_DARK = 'https://i0.wp.com/canadiansme.ca/wp-content/uploads/2021/03/Magazine-dark-logo.png';
const LOGO_LIGHT = 'https://i0.wp.com/canadiansme.ca/wp-content/uploads/2021/02/Magazine-light-logo-1.png';
const FAVICON = 'https://i0.wp.com/canadiansme.ca/wp-content/uploads/2021/02/cropped-whilte-fevicon.png';

// ---------- Small parts ----------

const icon = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/></svg>',
};

const logo = (ctx, light = false) => `
  <a class="logo" href="${ctx.link('')}" aria-label="CanadianSME Small Business Magazine home">
    <img src="${(light ? LOGO_LIGHT : LOGO_DARK)}?w=520&ssl=1" alt="CanadianSME Small Business Magazine" width="230" height="40">
  </a>`;

// Gives each post's image a unique transition name so it can glide between pages.
export const makeVT = () => {
  const used = new Set();
  return (post) => {
    if (used.has(post.id)) return '';
    used.add(post.id);
    return ` style="view-transition-name: p${post.id}"`;
  };
};

const href = (ctx, path) => (/^https?:/.test(path) ? path : ctx.link(path));
const ext = (path) => (/^https?:/.test(path) && !/canadiansme\.ca/.test(path) ? ' target="_blank" rel="noopener"' : '');

const chip = (ctx, cat) =>
  cat ? `<a class="chip" href="${ctx.link(`category/${cat.slug}/`)}">${esc(cat.name)}</a>` : '';

const meta = (ctx, post, { withAuthor = true } = {}) => {
  const author = ctx.authors[post.author];
  const parts = [];
  if (withAuthor && author) parts.push(`<a href="${ctx.link(`author/${author.slug}/`)}">${esc(author.name)}</a>`);
  parts.push(`<time datetime="${post.date}">${shortDate(post.date)}</time>`);
  return `<p class="meta">${parts.join('<span class="sep" aria-hidden="true"></span>')}</p>`;
};

const picture = (post, { w = 800, sizes = '100vw', vt = '', eager = false } = {}) =>
  `<img src="${img(post.image, w)}" srcset="${srcset(post.image)}" sizes="${sizes}" alt="" width="700" height="500"${
    eager ? ' fetchpriority="high"' : ' loading="lazy"'
  } decoding="async"${vt}>`;

// ---------- Ads: always shown at their true proportions, never cropped ----------

export const ad = (ctx, id, { variant = '' } = {}) => {
  const a = ctx.home.ads[id];
  if (!a) return '';
  const w = Math.min(a.w, 1600);
  return `
  <aside class="ad ad--${variant || shape(a)}" aria-label="Advertisement from ${esc(a.sponsor)}">
    <p class="ad__label">Advertisement</p>
    <a href="${a.href}" target="_blank" rel="sponsored noopener">
      <img src="${img(a.image, w)}" alt="${esc(a.alt)}" width="${a.w}" height="${a.h}" loading="lazy" decoding="async" style="aspect-ratio:${a.w}/${a.h}">
    </a>
  </aside>`;
};
const shape = (a) => (a.w / a.h > 2.5 ? 'wide' : a.h > a.w * 1.5 ? 'tall' : 'box');

const cover = (ctx, id, { eager = false, sizes = '(min-width: 1000px) 320px, 60vw' } = {}) => {
  const m = ctx.home.magazines.find((x) => x.id === id);
  if (!m) return '';
  return `<a class="cover" href="${m.href}" target="_blank" rel="noopener" aria-label="Read ${esc(m.title)}, ${esc(m.issue)}">
      <img src="${img(m.cover, 640)}" srcset="${img(m.cover, 320)} 320w, ${img(m.cover, 640)} 640w, ${img(m.cover, 1000)} 1000w" sizes="${sizes}" alt="Cover of ${esc(m.title)}, ${esc(m.issue)}" width="1004" height="1300"${eager ? ' fetchpriority="high"' : ' loading="lazy"'}>
    </a>`;
};

// ---------- Cards ----------

export const rowCard = (ctx, post, vt) => `
  <article class="row-card">
    <a class="row-card__img" href="${ctx.link(`${post.slug}/`)}" tabindex="-1" aria-hidden="true">${picture(post, { w: 480, sizes: '120px', vt: vt(post) })}</a>
    <div>
      <p class="row-card__cat">${esc(ctx.categories[post.category]?.name || '')}</p>
      <h3 class="row-card__title"><a href="${ctx.link(`${post.slug}/`)}">${esc(post.title)}</a></h3>
      ${meta(ctx, post, { withAuthor: false })}
    </div>
  </article>`;

export const storyCard = (ctx, post, vt, { excerpt = false, size = '' } = {}) => `
  <article class="story${size ? ` story--${size}` : ''}">
    <a class="story__img" href="${ctx.link(`${post.slug}/`)}" tabindex="-1" aria-hidden="true">${picture(post, { w: 800, sizes: '(min-width: 1000px) 30vw, (min-width: 640px) 45vw, 100vw', vt: vt(post) })}</a>
    ${chip(ctx, ctx.categories[post.category])}
    <h3 class="story__title"><a href="${ctx.link(`${post.slug}/`)}">${esc(post.title)}</a></h3>
    ${excerpt ? `<p class="story__excerpt">${esc(post.excerpt)}</p>` : ''}
    ${meta(ctx, post)}
  </article>`;

const portrait = (ctx, p, vt) => `
  <article class="portrait">
    <a href="${ctx.link(`${p.slug}/`)}">
      <span class="portrait__img">${picture(p, { w: 800, sizes: '(min-width: 1000px) 30vw, 70vw', vt: vt(p) })}</span>
      <span class="portrait__body">
        <span class="portrait__title">${esc(p.title)}</span>
        <span class="portrait__excerpt">${esc(p.excerpt)}</span>
      </span>
    </a>
  </article>`;

const sectionHead = (ctx, title, more, moreLabel = 'View all', light = false) => `
  <div class="section-head${light ? ' section-head--light' : ''}">
    <h2>${esc(title)}</h2>
    ${more ? `<a class="more" href="${href(ctx, more)}">${moreLabel} ${icon.arrow}</a>` : ''}
  </div>`;

// ---------- Layout ----------

const header = (ctx, active) => `
  <a class="skip" href="#main">Skip to content</a>
  <div class="topbar">
    <div class="wrap topbar__inner">
      <p class="topbar__date">${longDate(ctx.now.toISOString())}</p>
      <nav aria-label="More from CanadianSME" class="topbar__links">
        ${ctx.site.utilityLinks.map((l) => `<a href="${href(ctx, l.href)}"${ext(l.href)}>${esc(l.label)}</a>`).join('')}
      </nav>
    </div>
  </div>
  <header class="masthead" data-masthead>
    <div class="wrap masthead__inner">
      <button class="icon-btn masthead__menu" type="button" data-menu-open aria-label="Open menu">${icon.menu}</button>
      ${logo(ctx)}
      <nav class="mainnav" aria-label="Sections">
        ${ctx.site.nav
          .map((slug) => {
            const c = ctx.categories[slug];
            return `<a href="${ctx.link(`category/${slug}/`)}"${active === slug ? ' aria-current="page"' : ''}>${esc(c.name)}</a>`;
          })
          .join('')}
      </nav>
      <div class="masthead__actions">
        <button class="icon-btn" type="button" data-search-open aria-label="Search articles">${icon.search}</button>
        <a class="btn btn--solid" href="${ctx.link('subscription/')}">Subscribe</a>
      </div>
    </div>
  </header>
  <div class="drawer" data-drawer hidden>
    <div class="drawer__panel" role="dialog" aria-modal="true" aria-label="Menu">
      <button class="icon-btn drawer__close" type="button" data-menu-close aria-label="Close menu">${icon.close}</button>
      <nav aria-label="Sections">
        ${ctx.site.nav.map((slug) => `<a href="${ctx.link(`category/${slug}/`)}">${esc(ctx.categories[slug].name)}</a>`).join('')}
      </nav>
      <nav class="drawer__secondary" aria-label="More from CanadianSME">
        ${ctx.site.utilityLinks.map((l) => `<a href="${href(ctx, l.href)}"${ext(l.href)}>${esc(l.label)}</a>`).join('')}
        <a href="${ctx.link('about-us/')}">About us</a>
        <a href="${ctx.link('contact-us/')}">Contact us</a>
      </nav>
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

const ticker = (ctx) => {
  const items = ctx.latest.slice(0, 8).map((p) => `<a href="${ctx.link(`${p.slug}/`)}">${esc(p.title)}</a>`).join('');
  return `
  <div class="ticker" aria-label="Latest headlines">
    <div class="wrap ticker__inner">
      <p class="ticker__label"><span class="pulse" aria-hidden="true"></span>Latest</p>
      <div class="ticker__viewport">
        <div class="ticker__track">${items}<span aria-hidden="true" class="ticker__dup">${items}</span></div>
      </div>
    </div>
  </div>`;
};

const newsletter = (ctx) => `
  <section class="newsletter" aria-labelledby="nl-title">
    <div class="newsletter__copy">
      <h2 id="nl-title">Subscribe to our magazine</h2>
      <p>Get each new issue free, with event updates and business insights from industry leaders.</p>
    </div>
    <form class="newsletter__form" action="${ctx.link('subscription/')}" method="get">
      <label class="visually-hidden" for="nl-email">Email address</label>
      <input id="nl-email" type="email" name="email" placeholder="you@business.ca" required>
      <button class="btn btn--solid" type="submit">Subscribe</button>
    </form>
  </section>`;

const footer = (ctx) => `
  <footer class="footer">
    <div class="wrap footer__grid">
      <div class="footer__brand">
        ${logo(ctx, true)}
        <p>${esc(ctx.site.tagline)}</p>
        <address>
          ${esc(ctx.site.contact.company)}<br>${esc(ctx.site.contact.address)}<br>
          ${ctx.site.contact.phones.map(esc).join('<br>')}
        </address>
      </div>
      <nav aria-label="Sections" class="footer__col">
        <h2>Sections</h2>
        ${ctx.site.nav.map((s) => `<a href="${ctx.link(`category/${s}/`)}">${esc(ctx.categories[s].name)}</a>`).join('')}
      </nav>
      <nav aria-label="CanadianSME" class="footer__col">
        <h2>CanadianSME</h2>
        ${ctx.site.footerLinks.map((l) => `<a href="${href(ctx, l.href)}">${esc(l.label)}</a>`).join('')}
      </nav>
      <nav aria-label="Events and social" class="footer__col">
        <h2>Events</h2>
        ${ctx.site.utilityLinks.filter((l) => /^https/.test(l.href)).map((l) => `<a href="${l.href}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}
        <h2 class="footer__sub">Follow</h2>
        ${ctx.site.social.map((l) => `<a href="${l.href}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}
      </nav>
    </div>
    <div class="wrap footer__legal">
      <p>All rights reserved. © ${ctx.now.getFullYear()} CanadianSME Magazine</p>
      <p><a href="https://canadiansme.ca/privacy-policy/">Privacy policy</a></p>
    </div>
  </footer>`;

export const page = (ctx, { title, description, canonical, image, active, body, jsonld, type = 'website' }) => `<!doctype html>
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
<meta name="theme-color" content="#15233B">
<link rel="icon" href="${FAVICON}?fit=32%2C32&ssl=1" sizes="32x32">
<link rel="icon" href="${FAVICON}?fit=192%2C192&ssl=1" sizes="192x192">
<link rel="apple-touch-icon" href="${FAVICON}?fit=180%2C180&ssl=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://i0.wp.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap">
<link rel="stylesheet" href="${ctx.link('assets/styles.css')}">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>
<body>
${header(ctx, active)}
${ticker(ctx)}
<main id="main">
${body}
</main>
${footer(ctx)}
<script>window.__SEARCH_INDEX__=${JSON.stringify(ctx.searchIndex)};</script>
<script src="${ctx.link('assets/app.js')}" defer></script>
</body>
</html>`;

// ---------- Homepage sections ----------

const P = (ctx, slug) => {
  const p = ctx.postsBySlug[slug];
  if (!p) throw new Error(`Homepage references unknown post: ${slug}`);
  return p;
};

const sections = {
  'magazine-hero': (ctx, s) => `
  <section class="wrap hero" aria-roledescription="carousel" aria-label="This month at CanadianSME" data-slider>
    <div class="hero__stage">
      ${s.slides
        .map((sl, i) => {
          const m = sl.magazine && ctx.home.magazines.find((x) => x.id === sl.magazine);
          const a = sl.ad && ctx.home.ads[sl.ad];
          const link = m ? m.href : a.href;
          const label = m ? `${m.title}, ${m.issue}` : `Sponsored by ${a.sponsor}`;
          const art = m
            ? cover(ctx, m.id, { eager: i === 0, sizes: '(min-width: 1000px) 360px, 70vw' })
            : `<a class="cover cover--ad" href="${a.href}" target="_blank" rel="sponsored noopener"><img src="${img(a.image, 900)}" alt="${esc(a.alt)}" width="${a.w}" height="${a.h}" loading="lazy"></a>`;
          return `
        <article class="hero__slide${i === 0 ? ' is-active' : ''}" data-slide aria-roledescription="slide" aria-label="${i + 1} of ${s.slides.length}"${i === 0 ? '' : ' aria-hidden="true"'}>
          <div class="hero__copy">
            <p class="hero__issue">${esc(label)}</p>
            <h1 class="hero__title">${esc(sl.heading)}</h1>
            <p class="hero__text">${esc(sl.text)}</p>
            <a class="btn btn--solid btn--lg" href="${link}" target="_blank" rel="${a ? 'sponsored ' : ''}noopener"${i === 0 ? '' : ' tabindex="-1"'}>${esc(sl.cta)}</a>
          </div>
          <div class="hero__art">${art}</div>
        </article>`;
        })
        .join('')}
    </div>
    <div class="hero__controls">
      <button class="icon-btn" type="button" data-prev aria-label="Previous slide">${icon.prev}</button>
      <div class="hero__dots">${s.slides.map((_, i) => `<button type="button" data-dot="${i}" aria-label="Show slide ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}></button>`).join('')}</div>
      <button class="icon-btn" type="button" data-next aria-label="Next slide">${icon.next}</button>
    </div>
  </section>`,

  exclusive: (ctx, s, vt) => {
    const [lead, ...rest] = s.posts.map((x) => P(ctx, x));
    return `
  <section class="wrap block" aria-label="${esc(s.title)}">
    ${sectionHead(ctx, s.title, s.more)}
    <div class="lead">
      <article class="lead__story">
        <a class="lead__img" href="${ctx.link(`${lead.slug}/`)}" tabindex="-1" aria-hidden="true">${picture(lead, { w: 1200, sizes: '(min-width: 1000px) 62vw, 100vw', vt: vt(lead) })}</a>
        <div class="lead__card">
          ${chip(ctx, ctx.categories[lead.category])}
          <h3 class="lead__title"><a href="${ctx.link(`${lead.slug}/`)}">${esc(lead.title)}</a></h3>
          <p class="lead__excerpt">${esc(lead.excerpt)}</p>
          ${meta(ctx, lead)}
        </div>
      </article>
      <div class="lead__rail">${rest.map((p) => rowCard(ctx, p, vt)).join('')}</div>
    </div>
  </section>`;
  },

  feature: (ctx, s, vt) => {
    const p = P(ctx, s.post);
    return `
  <section class="wrap block" aria-label="${esc(s.label)}">
    <article class="feature${s.magazine ? ' feature--issue' : ''}">
      <a class="feature__img" href="${ctx.link(`${p.slug}/`)}" tabindex="-1" aria-hidden="true">${picture(p, { w: 1200, sizes: '(min-width: 1000px) 55vw, 100vw', vt: vt(p) })}</a>
      <div class="feature__body">
        <p class="feature__label">${esc(s.label)}</p>
        <h2 class="feature__title"><a href="${ctx.link(`${p.slug}/`)}">${esc(p.title)}</a></h2>
        <p class="feature__excerpt">${esc(p.excerpt)}</p>
        ${meta(ctx, p)}
        <div class="btn-row">
          <a class="btn btn--solid" href="${ctx.link(`${p.slug}/`)}">Read the article</a>
          ${s.magazine ? `<a class="btn btn--ghost" href="${ctx.home.magazines.find((m) => m.id === s.magazine).href}" target="_blank" rel="noopener">Read the issue</a>` : ''}
        </div>
      </div>
      ${s.magazine ? `<div class="feature__cover">${cover(ctx, s.magazine, { sizes: '200px' })}</div>` : ''}
    </article>
  </section>`;
  },

  podcast: (ctx, s) => `
  <section class="band" aria-labelledby="pod-title">
    <div class="wrap band__inner podcast">
      <div class="podcast__intro">
        <h2 id="pod-title">${esc(s.title)}</h2>
        <p>${esc(s.text)}</p>
        <div class="btn-row">
          <a class="btn btn--light" href="https://smbpodcast.ca/" target="_blank" rel="noopener">${icon.play} Listen now</a>
          <a class="btn btn--outline-light" href="https://www.youtube.com/@Canadian-SME" target="_blank" rel="noopener">Watch on YouTube</a>
        </div>
      </div>
      <ol class="podcast__list">
        ${s.episodes
          .map((e) => `<li><a href="${e.href}" target="_blank" rel="noopener"><span class="podcast__play" aria-hidden="true">${icon.play}</span><span><strong>${esc(e.title)}</strong><span>${esc(e.guest)}</span></span></a></li>`)
          .join('')}
      </ol>
    </div>
  </section>
  <div class="wrap block block--tight">${ad(ctx, s.ad)}</div>`,

  latest: (ctx, s, vt) => `
  <section class="wrap block" aria-label="${esc(s.title)}">
    ${sectionHead(ctx, s.title, s.more)}
    <div class="grid-4">${s.posts.map((x) => storyCard(ctx, P(ctx, x), vt, { size: 'sm' })).join('')}</div>
  </section>`,

  partners: (ctx, s) => `
  <section class="wrap block" aria-labelledby="partners-title">
    <div class="partners">
      <h2 id="partners-title">${esc(s.title)}</h2>
      <ul class="partners__list">
        ${ctx.home.partners
          .map(
            (p) => `<li><a href="${p.href}" target="_blank" rel="noopener">${
              p.logo ? `<img src="${img(p.logo, 240)}" alt="" width="120" height="120" loading="lazy">` : `<span class="partners__mono" aria-hidden="true">${esc(p.name.split(' ').map((w) => w[0]).slice(0, 2).join(''))}</span>`
            }<span><strong>${esc(p.name)}</strong><span>${esc(p.role)}</span></span></a></li>`
          )
          .join('')}
      </ul>
    </div>
    ${ad(ctx, s.ad)}
  </section>`,

  'with-ads': (ctx, s, vt) => `
  <section class="wrap block with-ads">
    <div class="with-ads__main">
      ${s.blocks
        .map((b) => {
          const posts = b.posts.map((x) => P(ctx, x));
          return `
        <div class="sub-block">
          ${sectionHead(ctx, b.title, b.more)}
          <div class="split">
            ${storyCard(ctx, posts[0], vt, { excerpt: true })}
            <div>${posts.slice(1).map((p) => rowCard(ctx, p, vt)).join('')}</div>
          </div>
        </div>`;
        })
        .join('')}
    </div>
    <div class="with-ads__aside"><div class="ad-stack">${s.ads.map((a) => ad(ctx, a)).join('')}</div></div>
  </section>`,

  cta: (ctx, s) => `
  <section class="wrap block">
    <div class="cta">
      <div>
        <h2>${esc(s.title)}</h2>
        <p>${esc(s.text)}</p>
      </div>
      <a class="btn btn--solid btn--lg" href="${href(ctx, s.href)}">${esc(s.button)}</a>
    </div>
  </section>`,

  tiles: (ctx, s, vt) => `
  <section class="wrap block" aria-label="${esc(s.title)}">
    ${sectionHead(ctx, s.title)}
    <div class="tiles">
      ${s.tiles
        .map((t) => {
          const p = P(ctx, t.post);
          return `
        <article class="tile">
          <a class="tile__topic" href="${ctx.link(`category/${t.category}/`)}">${esc(t.title)} ${icon.arrow}</a>
          <a class="tile__img" href="${ctx.link(`${p.slug}/`)}" tabindex="-1" aria-hidden="true">${picture(p, { w: 800, sizes: '(min-width: 1000px) 30vw, 100vw', vt: vt(p) })}</a>
          <h3 class="story__title"><a href="${ctx.link(`${p.slug}/`)}">${esc(p.title)}</a></h3>
          ${meta(ctx, p, { withAuthor: false })}
        </article>`;
        })
        .join('')}
    </div>
  </section>`,

  'sponsor-note': (ctx, s) => `
  <section class="wrap block block--tight">
    <aside class="sponsor-note" aria-label="Advertisement from ${esc(s.sponsor)}">
      <p class="ad__label">Advertisement</p>
      <div>
        <h2>${esc(s.sponsor)}</h2>
        <p>${esc(s.text)}</p>
      </div>
      <a class="btn btn--ghost" href="${s.href}" target="_blank" rel="sponsored noopener">${esc(s.button)}</a>
    </aside>
  </section>`,

  women: (ctx, s, vt) => `
  <section class="wrap block women" aria-labelledby="women-title">
    <div class="women__intro">
      <h2 id="women-title">${esc(s.title)}</h2>
      <p>${esc(ctx.categories['women-entrepreneurship'].description)}</p>
      <a class="btn btn--ghost" href="${ctx.link(s.more)}">Read the profiles</a>
    </div>
    <div class="women__list">${s.posts.map((x) => storyCard(ctx, P(ctx, x), vt)).join('')}</div>
  </section>`,

  interviews: (ctx, s, vt) => `
  <section class="band" aria-labelledby="int-title">
    <div class="wrap band__inner">
      ${sectionHead(ctx, s.title, s.more, 'All interviews', true).replace('<h2>', '<h2 id="int-title">')}
      <div class="portrait-grid">${s.posts.map((x) => portrait(ctx, P(ctx, x), vt)).join('')}</div>
    </div>
  </section>`,

  about: (ctx, s) => `
  <section class="wrap block about">
    <div class="about__copy">
      <h2>${esc(s.title)}</h2>
      <p>${esc(s.text)}</p>
      <div class="btn-row">
        <a class="btn btn--solid" href="${ctx.link('about-us/')}">About CanadianSME</a>
        <a class="btn btn--ghost" href="${ctx.link('contact-us/')}">Contact us</a>
      </div>
    </div>
    <div class="shelf" aria-label="Recent issues">
      ${s.magazines
        .map((id) => {
          const m = ctx.home.magazines.find((x) => x.id === id);
          return `<figure class="shelf__item">${cover(ctx, id, { sizes: '180px' })}<figcaption>${esc(m.issue)}</figcaption></figure>`;
        })
        .join('')}
    </div>
  </section>`,

  'list-grid': (ctx, s, vt) => `
  <section class="wrap block" aria-label="${esc(s.title)}">
    ${sectionHead(ctx, s.title, s.more)}
    <div class="grid-3">${s.posts.map((x) => storyCard(ctx, P(ctx, x), vt)).join('')}</div>
  </section>`,
};

export const home = (ctx) => {
  const vt = makeVT();
  const body = ctx.home.sections.map((s) => sections[s.type](ctx, s, vt)).join('\n') + `<div class="wrap">${newsletter(ctx)}</div>`;
  const first = P(ctx, ctx.home.sections.find((s) => s.type === 'exclusive').posts[0]);
  return page(ctx, {
    title: `${ctx.site.fullName}: News and insights for Canadian SMEs`,
    description: ctx.site.tagline,
    canonical: `${ctx.site.url}/`,
    image: ctx.home.magazines[0].cover,
    body,
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
  }).replace('<!--first-->', first.slug);
};

// ---------- Article ----------

export const article = (ctx, post, html) => {
  const vt = makeVT();
  const cat = ctx.categories[post.category];
  const author = ctx.authors[post.author];
  const related = ctx.byCategory[post.category].filter((p) => p.slug !== post.slug).slice(0, 3);
  const sidebar = ctx.latest.filter((p) => p.slug !== post.slug && !related.includes(p)).slice(0, 4);
  const fallback = `
    <p class="lede">${esc(post.excerpt)}</p>
    <div class="notice">
      <p>This is a preview article. The full text will be brought over with the rest of the archive.</p>
      <a class="btn btn--ghost" href="${ctx.site.url}/${post.slug}/">Read it on canadiansme.ca</a>
    </div>`;

  const body = `
  <div class="progress" data-progress aria-hidden="true"></div>
  <article class="post">
    <header class="wrap post__head">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="${ctx.link('')}">Home</a><span aria-hidden="true">/</span><a href="${ctx.link(`category/${cat.slug}/`)}">${esc(cat.name)}</a></nav>
      <h1 class="post__title">${esc(post.title)}</h1>
      <div class="post__byline">
        <span class="avatar" aria-hidden="true">${esc(initials(author.name))}</span>
        <div>
          <a class="post__author" href="${ctx.link(`author/${author.slug}/`)}">${esc(author.name)}</a>
          <p class="meta"><time datetime="${post.date}">${longDate(post.date)}</time><span class="sep" aria-hidden="true"></span>${post.readingTime} min read</p>
        </div>
      </div>
    </header>
    <figure class="wrap post__hero">${picture(post, { w: 1200, sizes: '(min-width: 1100px) 1040px, 100vw', vt: vt(post), eager: true })}</figure>
    <div class="wrap post__layout">
      <div class="prose">
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
      <aside class="post__aside" aria-labelledby="aside-title">
        <div class="post__aside-inner">
          <h2 id="aside-title" class="rail-title">Latest</h2>
          ${sidebar.map((p) => rowCard(ctx, p, vt)).join('')}
          <div class="ad-stack">${ad(ctx, 'ups-skyscraper')}${ad(ctx, 'wsib-box')}</div>
        </div>
      </aside>
    </div>
  </article>
  ${related.length ? `
  <section class="wrap related" aria-labelledby="related-title">
    <div class="section-head"><h2 id="related-title">More in ${esc(cat.name)}</h2></div>
    <div class="grid-3">${related.map((p) => storyCard(ctx, p, vt)).join('')}</div>
  </section>` : ''}
  <div class="wrap block block--tight">${ad(ctx, 'ups-leaderboard')}</div>
  <div class="wrap">${newsletter(ctx)}</div>`;

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
  const [first, ...rest] = posts;
  const body = `
  <header class="wrap listing__head">
    ${extraHead}
    <h1>${esc(heading)}</h1>
    ${intro ? `<p>${esc(intro)}</p>` : ''}
  </header>
  ${first ? `
  <section class="wrap listing__lead" aria-label="Most recent">
    <article class="wide-card">
      <a class="wide-card__img" href="${ctx.link(`${first.slug}/`)}" tabindex="-1" aria-hidden="true">${picture(first, { w: 1200, sizes: '(min-width: 1000px) 60vw, 100vw', vt: vt(first), eager: true })}</a>
      <div class="wide-card__body">
        ${chip(ctx, ctx.categories[first.category])}
        <h2><a href="${ctx.link(`${first.slug}/`)}">${esc(first.title)}</a></h2>
        <p>${esc(first.excerpt)}</p>
        ${meta(ctx, first)}
      </div>
    </article>
  </section>` : `<p class="wrap empty">No articles here yet.</p>`}
  <div class="wrap block block--tight">${ad(ctx, 'ups-leaderboard')}</div>
  ${rest.length ? `<section class="wrap" aria-label="More articles"><div class="grid-3">${rest.map((p) => storyCard(ctx, p, vt, { excerpt: true })).join('')}</div></section>` : ''}
  <div class="wrap">${newsletter(ctx)}</div>`;
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
    extraHead: `<span class="avatar avatar--xl" aria-hidden="true">${esc(initials(author.name))}</span>${author.role ? `<p class="listing__role">${esc(author.role)}</p>` : ''}`,
  });

// ---------- Static pages ----------

export const staticPage = (ctx, pg, html) => {
  const vt = makeVT();
  const out = html
    .replace(/\{\{link:([^}]+)\}\}/g, (_, p) => ctx.link(p))
    .replace(/\{\{ad:([^}]+)\}\}/g, (_, id) => `<div class="block block--tight">${ad(ctx, id)}</div>`)
    .replace(/\{\{cover:([^}]+)\}\}/g, (_, id) => `<div class="subscribe-hero__cover">${cover(ctx, id, { eager: true, sizes: '320px' })}</div>`)
    .replace('{{partners}}', () => sections.partners(ctx, { title: 'Our supporting partners', ad: 'ups-leaderboard' }).replace('class="wrap block"', 'class="block"'))
    .replace('{{social}}', () => ctx.site.social.map((s) => `<a href="${s.href}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join(''))
    .replace('{{archive}}', () => `
      <section class="page-section">
        <h2 class="page-section__title">Recent issues</h2>
        <div class="shelf shelf--wide">${ctx.home.magazines.map((m) => `<figure class="shelf__item">${cover(ctx, m.id, { sizes: '200px' })}<figcaption>${esc(m.issue)}</figcaption></figure>`).join('')}</div>
      </section>`)
    .replace(/\{\{posts:([^}]+)\}\}/g, (_, cat) => `
      <section class="page-section">
        <h2 class="page-section__title">Small business stories</h2>
        <div class="grid-3">${(ctx.byCategory[cat] || []).slice(0, 6).map((p) => storyCard(ctx, p, vt)).join('')}</div>
      </section>`);

  const body = `
  <header class="wrap listing__head page-head">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="${ctx.link('')}">Home</a><span aria-hidden="true">/</span><span>${esc(pg.title)}</span></nav>
    <h1>${esc(pg.title)}</h1>
  </header>
  <div class="wrap page-body">${out}</div>
  <div class="wrap">${newsletter(ctx)}</div>`;
  return page(ctx, { title: `${pg.title} | ${ctx.site.fullName}`, description: pg.description, canonical: `${ctx.site.url}/${pg.slug}/`, body });
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
      <div class="notfound__actions">
        <button class="btn btn--solid" type="button" data-search-open>Search articles</button>
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
