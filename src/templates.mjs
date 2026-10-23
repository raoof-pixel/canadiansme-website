import { esc, img, srcset, shortDate, longDate } from './lib.mjs';

// ---------- Small parts ----------

const icon = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
  leaf: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2.5l2.2 4.6 3.6-1.2-1 5.2 3.8-2.6.9 3.3 4.1-.6-2.3 4.6 2 1.4-6.8 5.1.8 2.9-6.1-.9.3 6.2h-3l.3-6.2-6.1.9.8-2.9-6.8-5.1 2-1.4-2.3-4.6 4.1.6.9-3.3 3.8 2.6-1-5.2 3.6 1.2z"/></svg>',
};

// Gives each post's image a unique transition name so it can glide between pages.
export const makeVT = () => {
  const used = new Set();
  return (post) => {
    if (used.has(post.id)) return '';
    used.add(post.id);
    return ` style="view-transition-name: p${post.id}"`;
  };
};

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
  `<img src="${img(post.image, w)}" srcset="${srcset(post.image)}" sizes="${sizes}" alt="" width="1080" height="720"${
    eager ? ' fetchpriority="high"' : ' loading="lazy"'
  } decoding="async"${vt}>`;

// ---------- Cards (three distinct treatments, chosen by role) ----------

// Compact row with thumbnail: for "top stories" rails and lists.
export const rowCard = (ctx, post, vt) => `
  <article class="row-card">
    <a class="row-card__img" href="${ctx.link(`${post.slug}/`)}" tabindex="-1" aria-hidden="true">${picture(post, { w: 480, sizes: '120px', vt: vt(post) })}</a>
    <div>
      <p class="row-card__cat">${esc(ctx.categories[post.category]?.name || '')}</p>
      <h3 class="row-card__title"><a href="${ctx.link(`${post.slug}/`)}">${esc(post.title)}</a></h3>
      ${meta(ctx, post, { withAuthor: false })}
    </div>
  </article>`;

// Image-on-top story: for grids.
export const storyCard = (ctx, post, vt, { excerpt = false } = {}) => `
  <article class="story">
    <a class="story__img" href="${ctx.link(`${post.slug}/`)}" tabindex="-1" aria-hidden="true">${picture(post, { w: 800, sizes: '(min-width: 1000px) 30vw, (min-width: 640px) 45vw, 100vw', vt: vt(post) })}</a>
    ${chip(ctx, ctx.categories[post.category])}
    <h3 class="story__title"><a href="${ctx.link(`${post.slug}/`)}">${esc(post.title)}</a></h3>
    ${excerpt ? `<p class="story__excerpt">${esc(post.excerpt)}</p>` : ''}
    ${meta(ctx, post)}
  </article>`;

// Text-only headline: for dense news lists.
export const headlineItem = (ctx, post) => `
  <li class="headline">
    <time datetime="${post.date}">${timeLabel(post.date, ctx.now)}</time>
    <a href="${ctx.link(`${post.slug}/`)}">${esc(post.title)}</a>
  </li>`;

const timeLabel = (iso, now) => {
  const d = new Date(iso);
  const hours = (now - d) / 36e5;
  if (hours < 24 && hours >= 0) {
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${((h + 11) % 12) + 1}:${m} ${h < 12 ? 'a.m.' : 'p.m.'}`;
  }
  return shortDate(iso).replace(/, \d{4}$/, '');
};

// ---------- Layout ----------

const header = (ctx, active) => `
  <a class="skip" href="#main">Skip to content</a>
  <div class="topbar">
    <div class="wrap topbar__inner">
      <p class="topbar__date">${longDate(ctx.now.toISOString())}</p>
      <nav aria-label="More from CanadianSME" class="topbar__links">
        ${ctx.site.utilityLinks.map((l) => `<a href="${l.href}">${esc(l.label)}</a>`).join('')}
      </nav>
    </div>
  </div>
  <header class="masthead" data-masthead>
    <div class="wrap masthead__inner">
      <button class="icon-btn masthead__menu" type="button" data-menu-open aria-label="Open menu">${icon.menu}</button>
      <a class="logo" href="${ctx.link('')}" aria-label="CanadianSME home">
        <span class="logo__mark">${icon.leaf}</span>
        <span class="logo__word">Canadian<b>SME</b></span>
      </a>
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
        <a class="btn btn--solid" href="https://canadiansme.ca/subscription/">Subscribe</a>
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
        ${ctx.site.utilityLinks.map((l) => `<a href="${l.href}">${esc(l.label)}</a>`).join('')}
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
  const items = ctx.latest.slice(0, 8)
    .map((p) => `<a href="${ctx.link(`${p.slug}/`)}">${esc(p.title)}</a>`)
    .join('');
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

const newsletter = () => `
  <section class="newsletter" aria-labelledby="nl-title">
    <div class="newsletter__copy">
      <h2 id="nl-title">The week in Canadian small business</h2>
      <p>One email every Friday with the stories, funding news and interviews worth your time.</p>
    </div>
    <form class="newsletter__form" action="https://canadiansme.ca/subscription/" method="get">
      <label class="visually-hidden" for="nl-email">Email address</label>
      <input id="nl-email" type="email" name="email" placeholder="you@business.ca" required>
      <button class="btn btn--solid" type="submit">Subscribe</button>
    </form>
  </section>`;

const footer = (ctx) => `
  <footer class="footer">
    <div class="wrap footer__grid">
      <div class="footer__brand">
        <a class="logo logo--light" href="${ctx.link('')}" aria-label="CanadianSME home">
          <span class="logo__mark">${icon.leaf}</span>
          <span class="logo__word">Canadian<b>SME</b></span>
        </a>
        <p>${esc(ctx.site.tagline)}</p>
      </div>
      <nav aria-label="Sections" class="footer__col">
        <h2>Sections</h2>
        ${Object.values(ctx.categories).map((c) => `<a href="${ctx.link(`category/${c.slug}/`)}">${esc(c.name)}</a>`).join('')}
      </nav>
      <nav aria-label="Magazine" class="footer__col">
        <h2>Magazine</h2>
        ${ctx.site.utilityLinks.map((l) => `<a href="${l.href}">${esc(l.label)}</a>`).join('')}
        <a href="https://canadiansme.ca/subscription/">Subscribe</a>
      </nav>
      <nav aria-label="Social" class="footer__col">
        <h2>Follow</h2>
        ${ctx.site.social.map((l) => `<a href="${l.href}" rel="noopener">${esc(l.label)}</a>`).join('')}
      </nav>
    </div>
    <div class="wrap footer__legal">
      <p>© ${ctx.now.getFullYear()} ${esc(ctx.site.fullName)}</p>
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://i0.wp.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap">
<link rel="stylesheet" href="${ctx.link('assets/styles.css')}">
<link rel="icon" href="${ctx.link('assets/favicon.svg')}" type="image/svg+xml">
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

// ---------- Pages ----------

export const home = (ctx) => {
  const vt = makeVT();
  const lead = ctx.featured[0];
  const topStories = ctx.featured.slice(1, 5);
  const newsList = ctx.byCategory['latest-news'].slice(0, 9);
  const sectionBlocks = ['small-business-leadership', 'finance-for-small-businesses', 'technology', 'marketing'];
  const interviews = ctx.byCategory['interviews'].slice(0, 4);
  const women = ctx.byCategory['women-entrepreneurship'].slice(0, 3);

  const body = `
  <section class="wrap lead" aria-label="Top story">
    <article class="lead__story">
      <a class="lead__img" href="${ctx.link(`${lead.slug}/`)}" tabindex="-1" aria-hidden="true">${picture(lead, { w: 1200, sizes: '(min-width: 1000px) 62vw, 100vw', vt: vt(lead), eager: true })}</a>
      <div class="lead__card">
        ${chip(ctx, ctx.categories[lead.category])}
        <h1 class="lead__title"><a href="${ctx.link(`${lead.slug}/`)}">${esc(lead.title)}</a></h1>
        <p class="lead__excerpt">${esc(lead.excerpt)}</p>
        ${meta(ctx, lead)}
      </div>
    </article>
    <aside class="lead__rail" aria-labelledby="top-stories">
      <h2 id="top-stories" class="rail-title">Top stories</h2>
      ${topStories.map((p) => rowCard(ctx, p, vt)).join('')}
    </aside>
  </section>

  <section class="wrap news" aria-labelledby="news-title">
    <div class="section-head">
      <h2 id="news-title">Today’s business news</h2>
      <a class="more" href="${ctx.link('category/latest-news/')}">All news ${icon.arrow}</a>
    </div>
    <div class="news__grid">
      <div class="news__feature">
        ${newsList.slice(0, 2).map((p) => storyCard(ctx, p, vt)).join('')}
      </div>
      <ol class="news__list">
        ${newsList.slice(2).map((p) => headlineItem(ctx, p)).join('')}
      </ol>
    </div>
  </section>

  <section class="interviews" aria-labelledby="int-title">
    <div class="wrap">
      <div class="section-head section-head--light">
        <h2 id="int-title">In conversation</h2>
        <a class="more" href="${ctx.link('category/interviews/')}">All interviews ${icon.arrow}</a>
      </div>
      <div class="interviews__row">
        ${interviews
          .map(
            (p) => `
          <article class="portrait">
            <a href="${ctx.link(`${p.slug}/`)}">
              <span class="portrait__img">${picture(p, { w: 800, sizes: '(min-width: 1000px) 25vw, 70vw', vt: vt(p) })}</span>
              <span class="portrait__body">
                <span class="portrait__title">${esc(p.title)}</span>
                <span class="portrait__excerpt">${esc(p.excerpt)}</span>
              </span>
            </a>
          </article>`
          )
          .join('')}
      </div>
    </div>
  </section>

  <section class="wrap sections" aria-label="More sections">
    ${sectionBlocks
      .map((slug) => {
        const cat = ctx.categories[slug];
        const posts = ctx.byCategory[slug].slice(0, 3);
        if (!posts.length) return '';
        return `
      <div class="section-block">
        <div class="section-head">
          <h2>${esc(cat.name)}</h2>
          <a class="more" href="${ctx.link(`category/${slug}/`)}">More ${icon.arrow}</a>
        </div>
        ${storyCard(ctx, posts[0], vt, { excerpt: true })}
        <div class="section-block__rows">${posts.slice(1).map((p) => rowCard(ctx, p, vt)).join('')}</div>
      </div>`;
      })
      .join('')}
  </section>

  <section class="wrap women" aria-labelledby="women-title">
    <div class="women__intro">
      <h2 id="women-title">Women entrepreneurs</h2>
      <p>${esc(ctx.categories['women-entrepreneurship'].description)}</p>
      <a class="btn btn--ghost" href="${ctx.link('category/women-entrepreneurship/')}">Read the profiles</a>
    </div>
    <div class="women__list">
      ${women.map((p) => storyCard(ctx, p, vt)).join('')}
    </div>
  </section>

  <div class="wrap">${newsletter()}</div>`;

  return page(ctx, {
    title: `${ctx.site.fullName}: Canadian small business news and insights`,
    description: ctx.site.tagline,
    canonical: `${ctx.site.url}/`,
    image: lead.image,
    body,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'NewsMediaOrganization',
      name: ctx.site.fullName,
      url: ctx.site.url,
      sameAs: ctx.site.social.map((s) => s.href),
    },
  });
};

export const article = (ctx, post, html) => {
  const vt = makeVT();
  const cat = ctx.categories[post.category];
  const author = ctx.authors[post.author];
  const related = ctx.byCategory[post.category].filter((p) => p.slug !== post.slug).slice(0, 3);
  const sidebar = ctx.latest.filter((p) => p.slug !== post.slug && !related.includes(p)).slice(0, 5);
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
    <figure class="wrap post__hero">${picture(post, { w: 1200, sizes: '(min-width: 1200px) 1120px, 100vw', vt: vt(post), eager: true })}</figure>
    <div class="wrap post__layout">
      <div class="prose">
        ${html || fallback}
        <aside class="author-card" aria-label="About the author">
          <span class="avatar avatar--lg" aria-hidden="true">${esc(initials(author.name))}</span>
          <div>
            <p class="author-card__name"><a href="${ctx.link(`author/${author.slug}/`)}">${esc(author.name)}</a></p>
            <p class="author-card__role">${esc(author.role)}</p>
            <p class="author-card__bio">${esc(author.bio)}</p>
          </div>
        </aside>
      </div>
      <aside class="post__aside" aria-labelledby="aside-title">
        <div class="post__aside-inner">
          <h2 id="aside-title" class="rail-title">Latest</h2>
          ${sidebar.map((p) => rowCard(ctx, p, vt)).join('')}
        </div>
      </aside>
    </div>
  </article>
  ${related.length ? `
  <section class="wrap related" aria-labelledby="related-title">
    <div class="section-head"><h2 id="related-title">More in ${esc(cat.name)}</h2></div>
    <div class="grid-3">${related.map((p) => storyCard(ctx, p, vt)).join('')}</div>
  </section>` : ''}
  <div class="wrap">${newsletter()}</div>`;

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
      author: { '@type': author.slug === 'canadiansme' ? 'Organization' : 'Person', name: author.name, url: `${ctx.site.url}/author/${author.slug}/` },
      publisher: { '@type': 'NewsMediaOrganization', name: ctx.site.fullName, url: ctx.site.url },
      mainEntityOfPage: url,
    },
  });
};

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
  ${rest.length ? `<section class="wrap" aria-label="More articles"><div class="grid-3">${rest.map((p) => storyCard(ctx, p, vt, { excerpt: true })).join('')}</div></section>` : ''}
  <div class="wrap">${newsletter()}</div>`;
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
    extraHead: `<span class="avatar avatar--xl" aria-hidden="true">${esc(initials(author.name))}</span><p class="listing__role">${esc(author.role)}</p>`,
  });

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
