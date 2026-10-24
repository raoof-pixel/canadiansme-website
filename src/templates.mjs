// Page templates. Layout, type and colour follow the CanadianSME website design guide (v1, October 2026).
import { esc, img, full, srcset, shortDate, longDate, safeJson } from './lib.mjs';

const LOGO_DARK = 'https://i0.wp.com/canadiansme.ca/wp-content/uploads/2021/03/Magazine-dark-logo.png';
const FAVICON = 'https://i0.wp.com/canadiansme.ca/wp-content/uploads/2021/02/cropped-whilte-fevicon.png';

// ---------- Icons ----------

const icon = {
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
};

// Simple line icons for the topic tiles.
const topicIcon = {
  'small-business': '<path d="M4 10h16v10H4zM3 10l2-5h14l2 5M9 20v-5h6v5"/>',
  'finance-for-small-businesses': '<path d="M4 19h16M6 16V10M10 16V7M14 16v-4M18 16V5"/>',
  technology: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M9 20h6M12 16v4"/>',
  'artificial-intelligence': '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
  'small-business-leadership': '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
  marketing: '<path d="M4 10v4l11 5V5zM15 9a3 3 0 0 1 0 6M4 14l1.5 5h3L7 14.5"/>',
  'women-entrepreneurship': '<circle cx="12" cy="9" r="5"/><path d="M12 14v7M9 18h6"/>',
  'cybersecurity-for-small-businesses': '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-4"/>',
  interviews: '<path d="M5 5h14v10H9l-4 4z"/>',
  entrepreneurship: '<path d="M12 3c3 2 5 5.5 5 9l-2 4H9l-2-4c0-3.5 2-7 5-9zM10 20h4"/>',
};
const tIcon = (slug) => `<svg viewBox="0 0 24 24" aria-hidden="true">${topicIcon[slug] || topicIcon['small-business']}</svg>`;

// ---------- Helpers ----------

const href = (ctx, path) => (/^(https?:|mailto:|tel:)/.test(path) ? path : ctx.link(path));
const ext = (path) => (/^https?:/.test(path) && !/\/\/(www\.)?canadiansme\.ca/.test(path) ? ' target="_blank" rel="noopener"' : '');
const postUrl = (ctx, p) => ctx.link(`${p.slug}/`);
const catOf = (ctx, p) => ctx.categories[p.category];
const catUrl = (ctx, slug) => ctx.link(`category/${slug}/`);

const P = (ctx, slug) => {
  const p = ctx.postsBySlug[slug];
  if (!p) throw new Error(`Unknown post referenced: ${slug}`);
  return p;
};
const mag = (ctx, id) => ctx.home.magazines.find((m) => m.id === id);
const imgSrc = (ctx, url, w) => (url.startsWith('LOCAL:') ? ctx.link(`assets/${url.slice(6)}`) : img(url, w));

// Opens an Issuu issue in the on-page reader; the Issuu link stays as the fallback.
const readerAttrs = (m) => {
  const doc = (m.href.split('/docs/')[1] || '').split(/[?#]/)[0];
  return doc ? ` data-reader="${esc(doc)}" data-reader-title="${esc(`${m.title}, ${m.issue}`)}" data-reader-href="${m.href}"` : '';
};

const picture = (post, { w = 800, sizes = '100vw', eager = false, cls = '', alt = '' } = {}) =>
  `<img${cls ? ` class="${cls}"` : ''} src="${img(post.image, w)}" srcset="${srcset(post.image)}" sizes="${sizes}" alt="${esc(alt)}" width="700" height="500"${
    eager ? ' fetchpriority="high"' : ' loading="lazy"'
  } decoding="async">`;

const extImg = (url, { w = 800, alt = '', cls = '' } = {}) =>
  `<img${cls ? ` class="${cls}"` : ''} src="${img(url, w)}" srcset="${srcset(url)}" sizes="(min-width: 1100px) 25vw, 90vw" alt="${esc(alt)}" width="700" height="440" loading="lazy" decoding="async">`;

const metaLine = (p, { read = true } = {}) => `<p class="meta"><time datetime="${p.date}">${shortDate(p.date)}</time>${read ? ` · ${p.readingTime} min read` : ''}</p>`;

const initials = (name) =>
  name
    .replace(/CanadianSME/i, 'C S')
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

// Section heading: eyebrow, H2, optional intro and "more" link. `rule` adds the 2px ink underline.
const shead = (ctx, { eyebrow = '', title, id = '', text = '', more = '', moreLabel = 'View all', rule = false, tag = '' }) => `
  <div class="shead${rule ? ' shead--rule' : ''}">
    <div class="shead__copy">
      ${tag}${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
      <h2 class="h-section"${id ? ` id="${id}"` : ''}>${esc(title)}</h2>
      ${text ? `<p class="shead__text">${esc(text)}</p>` : ''}
    </div>
    ${more ? `<a class="link-arrow" href="${href(ctx, more)}"${ext(more)}>${esc(moreLabel)} →</a>` : ''}
  </div>`;

const crumbs = (ctx, items) => `
  <nav class="crumbs" aria-label="Breadcrumb"><div class="wrap"><ol>
    <li><a href="${ctx.link('')}">Home</a></li>
    ${items.map(([label, path], i) => (path && i < items.length - 1 ? `<li><a href="${href(ctx, path)}">${esc(label)}</a></li>` : `<li aria-current="page">${esc(label)}</li>`)).join('')}
  </ol></div></nav>`;

const bookmark = (p) => `<button class="bookmark" type="button" data-bookmark="${esc(p.slug)}" aria-pressed="false" aria-label="Bookmark this article">♡</button>`;

// ---------- Cards ----------

// Standard article card: 180px image, eyebrow + bookmark, title, two-line excerpt, meta.
export const card = (ctx, p, { sizes = '(min-width: 1100px) 25vw, (min-width: 700px) 45vw, 92vw', attrs = '', tag = '', note = '', excerpt = true } = {}) => {
  const c = catOf(ctx, p);
  return `
  <article class="card"${attrs}>
    <a class="card__img" href="${postUrl(ctx, p)}" tabindex="-1" aria-hidden="true">${picture(p, { w: 800, sizes })}${tag ? `<span class="card__tag">${esc(tag)}</span>` : ''}</a>
    <div class="card__body">
      <div class="card__top"><a class="eyebrow" href="${catUrl(ctx, c.slug)}">${esc(c.name)}</a>${bookmark(p)}</div>
      <h3 class="card__title"><a href="${postUrl(ctx, p)}">${esc(p.title)}</a></h3>
      ${excerpt ? `<p class="card__excerpt">${esc(p.excerpt)}</p>` : ''}
      ${note ? `<p class="card__note">${esc(note)}</p>` : ''}
      ${metaLine(p)}
    </div>
  </article>`;
};
export const storyCard = (ctx, p) => card(ctx, p);
export const rowCard = (ctx, p) => card(ctx, p);
export const thumb = (ctx, p) => card(ctx, p);
export const makeVT = () => () => '';

// ---------- Ads and magazine ----------

export const ad = (ctx, id, { cls = '' } = {}) => {
  const a = ctx.home.ads[id];
  if (!a) return '';
  return `
  <aside class="ad${cls ? ` ${cls}` : ''}" aria-label="Advertisement from ${esc(a.sponsor)}">
    <p class="ad__label">Advertisement</p>
    <a href="${a.href}" target="_blank" rel="sponsored noopener">
      <img src="${imgSrc(ctx, a.image, Math.min(a.w, 1600))}" alt="${esc(a.alt)}" width="${a.w}" height="${a.h}" loading="lazy" decoding="async" style="aspect-ratio:${a.w}/${a.h}">
    </a>
  </aside>`;
};

const cover = (ctx, m, { eager = false, sizes = '240px', cls = '', reader = true } = {}) => `
  <a class="cover${cls ? ` ${cls}` : ''}" href="${m.href}" target="_blank" rel="noopener"${reader ? readerAttrs(m) : ''} aria-label="Read ${esc(m.title)}, ${esc(m.issue)}">
    <img src="${img(m.cover, 640)}" srcset="${img(m.cover, 320)} 320w, ${img(m.cover, 640)} 640w, ${img(m.cover, 1000)} 1000w" sizes="${sizes}" alt="Cover of ${esc(m.title)}, ${esc(m.issue)}" width="1004" height="1300"${eager ? ' fetchpriority="high"' : ' loading="lazy"'}>
  </a>`;

// ---------- Layout shell ----------

const logo = (ctx) => `
  <a class="logo" href="${ctx.link('')}" aria-label="CanadianSME Small Business Magazine home">
    <img src="${LOGO_DARK}?w=520&ssl=1" alt="CanadianSME Small Business Magazine" width="230" height="40">
  </a>`;

const SOCIAL_SHORT = { LinkedIn: 'in', YouTube: 'YT', Instagram: 'IG', Facebook: 'f', X: 'X' };
const isActive = (item, active) => item.match && (Array.isArray(item.match) ? item.match.includes(active) : item.match === active);

// Menu links: '?q=word' opens the site search for that word.
const menuLink = (ctx, l, extra = '') => {
  if (l.href.startsWith('?q=')) {
    const q = decodeURIComponent(l.href.slice(3));
    return `<a href="${ctx.link('search/')}${l.href}" data-search-q="${esc(q)}"${extra}>${esc(l.label)}</a>`;
  }
  return `<a href="${href(ctx, l.href)}"${ext(l.href)}${extra}>${esc(l.label)}</a>`;
};

const header = (ctx, active) => {
  const menu = ctx.site.menu;
  const social = ['LinkedIn', 'YouTube', 'Instagram', 'Facebook', 'X'].map((n) => ctx.site.social.find((x) => x.label === n)).filter(Boolean);
  const megas = Object.entries(ctx.site.megaMenus || {})
    .map(([key, m]) => {
      const pick = ctx.postsBySlug[m.featured];
      return `
      <div class="mega__panel" id="mega-${key}" data-mega-panel="${key}" hidden>
        <div class="wrap mega__grid">
          ${m.cols.map((c) => `<div class="mega__col${c.links.length > 6 ? ' mega__col--wide' : ''}"><h3>${esc(c.heading)}</h3><ul>${c.links.map((l) => `<li>${menuLink(ctx, l)}</li>`).join('')}</ul></div>`).join('')}
          ${pick ? `<a class="mega__pick" href="${postUrl(ctx, pick)}"><span class="mega__badge" aria-hidden="true">${esc(m.badge)}</span><span><span class="mega__pick-label">Editor’s Pick</span><span class="mega__pick-title">${esc(pick.title)}</span></span></a>` : ''}
        </div>
      </div>`;
    })
    .join('');
  return `
  <a class="skip" href="#main">Skip to content</a>
  <div class="topbar">
    <div class="wrap topbar__inner">
      <p class="topbar__left"><strong data-today>${longDate(ctx.today.toISOString())}</strong><span class="topbar__bar" aria-hidden="true"></span><span class="topbar__strap">${esc(ctx.site.strapline)}</span></p>
      <div class="topbar__right">
        <a class="topbar__link" href="${ctx.link('tools/')}">Free tools</a>
        <a class="topbar__link" href="${ctx.link('advertise/')}">Advertise</a>
        <span class="topbar__bar" aria-hidden="true"></span>
        <nav class="topbar__social" aria-label="CanadianSME on social media">${social.map((x) => `<a href="${x.href}" target="_blank" rel="noopener" aria-label="CanadianSME on ${esc(x.label)}">${SOCIAL_SHORT[x.label]}</a>`).join('')}</nav>
      </div>
    </div>
  </div>
  <header class="masthead" data-masthead>
    <div class="wrap masthead__inner">
      ${logo(ctx)}
      <nav class="mainnav" aria-label="Main menu">
        <ul>
          ${menu
            .map((m) => {
              const cur = isActive(m, active) ? ' aria-current="page"' : '';
              return m.mega
                ? `<li data-mega="${m.mega}"><a href="${href(ctx, m.href)}"${cur} aria-haspopup="true" aria-expanded="false" aria-controls="mega-${m.mega}">${esc(m.label)}</a></li>`
                : `<li>${menuLink(ctx, m, cur)}</li>`;
            })
            .join('')}
        </ul>
      </nav>
      <div class="masthead__actions">
        <button class="icon-btn" type="button" data-search-open aria-label="Search the site">${icon.search}</button>
        <a class="btn btn--primary btn--sm masthead__sub" href="${ctx.link('subscription/')}">Subscribe</a>
        <button class="menu-btn" type="button" data-menu-open aria-label="Open menu" aria-expanded="false"><span aria-hidden="true">☰</span><span class="menu-btn__text">Menu</span></button>
      </div>
    </div>
    <div class="mega" data-mega-wrap>${megas}</div>
  </header>
  <div class="drawer" data-drawer hidden>
    <div class="drawer__panel" role="dialog" aria-modal="true" aria-label="Site menu">
      <div class="drawer__top">
        <span class="drawer__heading">Menu</span>
        <button class="drawer__close" type="button" data-menu-close aria-label="Close menu">×</button>
      </div>
      <nav class="drawer__list" aria-label="Site menu">
        ${ctx.site.drawerMenu.map((l) => menuLink(ctx, l)).join('')}
      </nav>
      <a class="btn btn--primary drawer__sub" href="${ctx.link('subscription/')}">Subscribe free</a>
    </div>
  </div>
  <div class="search" data-search hidden>
    <div class="search__panel" role="dialog" aria-modal="true" aria-label="Search">
      <form class="search__field" action="${ctx.link('search/')}" method="get" role="search">
        ${icon.search}
        <input type="search" name="q" placeholder="Search articles, tools and events" autocomplete="off" data-search-input aria-label="Search the site">
        <button class="icon-btn" type="button" data-search-close aria-label="Close search">${icon.close}</button>
      </form>
      <ul class="search__results" data-search-results></ul>
    </div>
  </div>`;
};

// The newsletter form: used in the red homepage band and on the Subscribe page.
const PROVINCE_NAMES = ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon'];
const STAGES = ['Idea or pre-launch', 'Newly launched', 'Growing', 'Established', 'Scaling nationally or exporting'];
const signupForm = (ctx, id, { dark = true } = {}) => `
  <form class="signup${dark ? ' signup--dark' : ''}" data-signup novalidate>
    <div class="signup__grid">
      <div class="field"><label for="${id}-first">First name</label><input id="${id}-first" name="first" autocomplete="given-name"></div>
      <div class="field"><label for="${id}-email">Email address</label><input id="${id}-email" name="email" type="email" autocomplete="email" inputmode="email"></div>
      <div class="field"><label for="${id}-prov">Province</label><select id="${id}-prov" name="province"><option value="">Select province</option>${PROVINCE_NAMES.map((p) => `<option>${p}</option>`).join('')}</select></div>
      <div class="field"><label for="${id}-stage">Business stage</label><select id="${id}-stage" name="stage"><option value="">Select stage</option>${STAGES.map((s) => `<option>${s}</option>`).join('')}</select></div>
    </div>
    <label class="check"><input type="checkbox" name="consent"> <span>I agree to receive email from CanadianSME. You can unsubscribe at any time.</span></label>
    <p class="form-status" role="status" aria-live="polite" data-status></p>
    <button class="btn btn--primary btn--block" type="submit">Subscribe for Free</button>
    <p class="signup__fine">Free to join. No spam. Unsubscribe anytime.</p>
  </form>`;

const newsletterBand = (ctx) => `
  <section class="nlband" id="newsletter" aria-labelledby="nl-title">
    <div class="wrap nlband__inner">
      <div class="nlband__copy">
        <p class="eyebrow eyebrow--light">Newsletter</p>
        <h2 class="h-section" id="nl-title">Canadian Business Insights, Delivered to Your Inbox</h2>
        <p>The weekly briefing for owners: new stories, CRA deadlines before they land, funding programs while they are open, and each new magazine edition.</p>
      </div>
      ${signupForm(ctx, 'nl')}
    </div>
  </section>`;

const footer = (ctx) => {
  const d = ctx.data;
  const social = ctx.site.social;
  const col = (title, links) => `<div class="footer__col"><h2>${esc(title)}</h2><ul>${links.map(([l, h]) => `<li><a href="${href(ctx, h)}"${ext(h)}>${esc(l)}</a></li>`).join('')}</ul></div>`;
  return `
  <footer class="footer">
    <div class="footer__also">
      <div class="wrap footer__also-inner">
        <p class="footer__also-label">Also from Cmarketing Inc.</p>
        <ul>${d.sisterTitles.map((s) => `<li>${s.href ? `<a href="${s.href}" target="_blank" rel="noopener">${esc(s.title)}</a>` : esc(s.title)}</li>`).join('')}</ul>
      </div>
    </div>
    <div class="wrap footer__grid">
      <div class="footer__about">
        <a class="footer__logo" href="${ctx.link('')}" aria-label="CanadianSME home"><img src="${LOGO_DARK}?w=440&ssl=1" alt="CanadianSME Small Business Magazine" width="200" height="35" loading="lazy"></a>
        <p>Canada’s leading platform for small business insights: news, interviews, practical tools and the free monthly magazine, from the team behind the Small Business Summit, Show and National Business Awards.</p>
        <nav class="footer__social" aria-label="CanadianSME on social media">${social.map((s) => `<a href="${s.href}" target="_blank" rel="noopener" aria-label="CanadianSME on ${esc(s.label)}">${SOCIAL_SHORT[s.label] || esc(s.label)}</a>`).join('')}</nav>
      </div>
      ${col('Explore', [['Latest Articles', 'category/latest-news/'], ['Magazine', 'magazine/'], ['Podcast', 'podcast/'], ['Events', 'events/'], ['Business Resources', 'resources/'], ['Free Tools', 'tools/']])}
      ${col('Company', [['About CanadianSME', 'about-us/'], ['Leadership', 'about-us/#leadership'], ['Contact Us', 'contact-us/'], ['Start-up Stories', 'start-up-stories/']])}
      ${col('Work With Us', [['Advertise', 'advertise/'], ['Become a Partner', 'advertise/#options'], ['Partner Content', 'advertise/#options'], ['Submit a Story', 'start-up-stories/']])}
      ${col('Community', [['Small Business Summit', 'https://smesummit.ca/'], ['National Business Awards', 'https://www.smeawards.ca/'], ['Small Business Show', 'https://smbshow.ca/'], ['Canada Business Talks', 'https://www.smemagazine.ca/business-talks/'], ['UPS Small Business of the Day', 'ups-small-business/']])}
    </div>
    <div class="wrap footer__bottom">
      <p>© ${ctx.today.getFullYear()} CanadianSME Small Business Magazine, published by ${esc(ctx.site.contact.company)}, ${esc(ctx.site.contact.address)}.</p>
      <nav aria-label="Legal"><a href="https://canadiansme.ca/privacy-policy/">Privacy Policy</a><a href="https://canadiansme.ca/terms-of-service/">Terms of Service</a></nav>
    </div>
  </footer>`;
};

const readerModal = () => `
<div class="reader" data-reader-modal hidden>
  <div class="reader__panel" role="dialog" aria-modal="true" aria-labelledby="reader-title">
    <div class="reader__bar">
      <p id="reader-title" class="reader__title" data-reader-name>CanadianSME Small Business Magazine</p>
      <a class="btn btn--secondary btn--sm" href="https://issuu.com/canadiansme" target="_blank" rel="noopener" data-reader-out>Open in a new tab</a>
      <button class="icon-btn" type="button" data-reader-close aria-label="Close magazine">${icon.close}</button>
    </div>
    <div class="reader__frame"><iframe data-reader-frame title="Magazine reader" allowfullscreen></iframe></div>
  </div>
</div>`;

// Lets the scripts build links from the site root, in both link styles.
const rootAttrs = (ctx) => ` data-root="${ctx.link('assets/styles.css').replace(/assets\/styles\.css$/, '')}" data-index="${ctx.link('x/').endsWith('index.html') ? 1 : 0}"`;

const headTags = (ctx, { title, description, canonical, image, jsonld, type = 'website' }) => `<!doctype html>
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
<meta name="theme-color" content="#101828">
<link rel="icon" href="${FAVICON}?fit=32%2C32&ssl=1" sizes="32x32">
<link rel="icon" href="${FAVICON}?fit=192%2C192&ssl=1" sizes="192x192">
<link rel="apple-touch-icon" href="${FAVICON}?fit=180%2C180&ssl=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://i0.wp.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<link rel="stylesheet" href="${ctx.link('assets/styles.css')}?v=${ctx.version}">
${jsonld ? `<script type="application/ld+json">${safeJson(jsonld)}</script>` : ''}
</head>`;

export const page = (ctx, { title, description, canonical, image, active, body, jsonld, type = 'website', bodyClass = '', newsletter = false }) => `${headTags(ctx, { title, description, canonical, image, jsonld, type })}
<body${bodyClass ? ` class="${bodyClass}"` : ''}${rootAttrs(ctx)}>
${header(ctx, active)}
<main id="main">
${body}
</main>
${newsletter ? newsletterBand(ctx) : ''}
${footer(ctx)}
${readerModal()}
<script src="${ctx.link('assets/search-index.js')}?v=${ctx.version}" defer></script>
<script src="${ctx.link('assets/app.js')}?v=${ctx.version}" defer></script>
</body>
</html>`;

// ---------- Homepage sections ----------

const nextDeadline = (ctx) => ctx.data.deadlines.find((d) => new Date(`${d.date}T23:59:59`) >= ctx.today) || ctx.data.deadlines.at(-1);
const daysUntil = (ctx, iso) => {
  const t = new Date(`${iso}T00:00:00`);
  const now = new Date(ctx.today);
  now.setHours(0, 0, 0, 0);
  const n = Math.round((t - now) / 86400000);
  return n <= 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`;
};
const dayMonth = (iso) => shortDate(`${iso}T12:00:00`).replace(/, \d{4}$/, '');

const sections = {
  hero: (ctx, s) => `
  <section class="slider" aria-roledescription="carousel" aria-label="Top stories and this month’s magazine" data-slider>
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
      <article class="slider__slide slider__slide--mag${on ? ' is-active' : ''}" data-slide aria-roledescription="slide" aria-label="${i + 1} of ${s.slides.length}"${on ? '' : ' aria-hidden="true"'}>
        <div class="slider__bg slider__bg--blur" style="background-image:url('${img(m.cover, 600)}')" aria-hidden="true"></div>
        <div class="wrap slider__inner">
          <div class="slider__copy">
            <p class="slider__label">${esc(m.title)}, ${esc(m.issue)}</p>
            <h${on ? 1 : 2} class="slider__title">${esc(sl.heading)}</h${on ? 1 : 2}>
            <p class="slider__text">${esc(sl.text)}</p>
            ${hl ? `<ul class="slider__issue-list">${hl}</ul>` : ''}
            <div class="btn-row">
              <a class="btn btn--primary" href="${m.href}" target="_blank" rel="noopener"${readerAttrs(m)}${hide}>${icon.book} ${esc(sl.cta)}</a>
              <a class="btn btn--ghost-dark" href="${ctx.link('subscription/')}"${hide}>Subscribe free</a>
            </div>
          </div>
          <div class="slider__cover">${cover(ctx, m, { eager: on, sizes: '(min-width: 900px) 340px, 60vw' })}</div>
        </div>
      </article>`;
        }
        const p = P(ctx, sl.post);
        const a = ctx.authors[p.author];
        return `
      <article class="slider__slide slider__slide--story${on ? ' is-active' : ''}" data-slide aria-roledescription="slide" aria-label="${i + 1} of ${s.slides.length}"${on ? '' : ' aria-hidden="true"'}>
        <div class="slider__bg" aria-hidden="true">${picture(p, { w: 1600, sizes: '100vw', eager: on, cls: 'slider__photo' })}</div>
        <div class="wrap slider__inner">
          <div class="slider__copy">
            <p class="slider__label">${esc(sl.label || catOf(ctx, p).name)}</p>
            <h${on ? 1 : 2} class="slider__title"><a href="${postUrl(ctx, p)}"${hide}>${esc(p.title)}</a></h${on ? 1 : 2}>
            <p class="slider__text">${esc(p.excerpt)}</p>
            <p class="slider__meta"><a href="${postUrl(ctx, p)}"${hide}>Read story ${icon.arrow}</a><span>${esc(a.name)}</span><span>${p.readingTime} min read</span></p>
          </div>
        </div>
      </article>`;
      })
      .join('')}
    <div class="slider__bar">
      <div class="wrap slider__bar-inner">
        <div class="slider__tabs" role="tablist" aria-label="Choose a story">
          ${s.slides
            .map((sl, i) => {
              let pic, kicker, title;
              if (sl.kind === 'magazine') {
                const m = mag(ctx, sl.magazine);
                pic = `<img src="${img(m.cover, 160)}" alt="" width="54" height="70" decoding="async" class="slider__tab-cover">`;
                kicker = 'Magazine';
                title = `${m.issue} issue`;
              } else {
                const p = P(ctx, sl.post);
                pic = `<img src="${img(p.image, 240)}" alt="" width="92" height="62" decoding="async">`;
                kicker = sl.label || catOf(ctx, p).name;
                title = p.title;
              }
              return `<button class="slider__tab" type="button" role="tab" data-dot="${i}" aria-label="Show slide ${i + 1}: ${esc(title)}"${i === 0 ? ' aria-current="true"' : ''}><span class="slider__tab-line" aria-hidden="true"></span><span class="slider__tab-pic">${pic}</span><span class="slider__tab-text"><span class="slider__tab-kicker">${esc(kicker)}</span><span class="slider__tab-title">${esc(title)}</span></span></button>`;
            })
            .join('')}
        </div>
        <div class="slider__arrows">
          <button class="slider__arrow" type="button" data-prev aria-label="Previous slide">${icon.prev}</button>
          <button class="slider__arrow" type="button" data-next aria-label="Next slide">${icon.next}</button>
        </div>
      </div>
    </div>
  </section>`,

  top: (ctx, s) => {
    const [lead, ...rest] = s.posts.map((x) => P(ctx, x));
    const c = catOf(ctx, lead);
    return `
  <section class="hero" aria-labelledby="hero-title">
    <div class="wrap">
      <div class="hero__main">
        <div class="hero__copy">
          <p class="hero__kicker"><a class="pill" href="${catUrl(ctx, c.slug)}">${esc(c.name)}</a><span>Featured Story · ${shortDate(lead.date)} · ${lead.readingTime} min read</span></p>
          <h1 class="h-display" id="hero-title"><a href="${postUrl(ctx, lead)}">${esc(lead.title)}</a></h1>
          <p class="hero__excerpt">${esc(lead.excerpt)}</p>
          <div class="btn-row">
            <a class="btn btn--primary" href="${postUrl(ctx, lead)}">Read Featured Story</a>
            <a class="btn btn--secondary" href="${catUrl(ctx, 'latest-news')}">Latest news</a>
          </div>
        </div>
        <a class="hero__img" href="${postUrl(ctx, lead)}" tabindex="-1" aria-hidden="true">${picture(lead, { w: 1200, sizes: '(min-width: 1000px) 50vw, 92vw', eager: true })}</a>
      </div>
      <div class="hero__more">
        ${rest
          .map((p) => `
        <article class="mini">
          <a class="mini__img" href="${postUrl(ctx, p)}" tabindex="-1" aria-hidden="true">${picture(p, { w: 600, sizes: '(min-width: 1000px) 22vw, 92vw' })}</a>
          <a class="eyebrow" href="${catUrl(ctx, p.category)}">${esc(catOf(ctx, p).name)}</a>
          <h2 class="mini__title"><a href="${postUrl(ctx, p)}">${esc(p.title)}</a></h2>
          <p class="mini__excerpt">${esc(p.excerpt)}</p>
        </article>`)
          .join('')}
      </div>
    </div>
  </section>`;
  },

  week: (ctx) => {
    const d = nextDeadline(ctx);
    return `
  <section class="week" aria-label="This week for your business">
    <div class="wrap week__inner">
      <div class="week__col week__col--intro"><p class="eyebrow eyebrow--light">This week</p><p class="week__big">For your business</p></div>
      <a class="week__col" href="#deadlines" data-next-deadline data-deadlines="${esc(JSON.stringify(ctx.data.deadlines.map((x) => [x.date, x.title])))}">
        <span class="week__label">Next CRA deadline · <span data-days>${daysUntil(ctx, d.date)}</span></span>
        <span class="week__title"><span data-date>${dayMonth(d.date)}</span> — <span data-title>${esc(d.title)}</span></span>
      </a>
      <a class="week__col" href="${ctx.link('tools/')}#gst"><span class="week__label">Free tool</span><span class="week__title">GST/HST Calculator</span></a>
      <a class="week__col" href="#provinces"><span class="week__label">Grants &amp; programs</span><span class="week__title">Find support in your province</span></a>
      <a class="week__col" href="#newsletter"><span class="week__label">Every week</span><span class="week__title">Deadlines &amp; grants in your inbox</span></a>
    </div>
  </section>`;
  },

  trending: (ctx, s) => `
  <nav class="trending" aria-label="Trending topics">
    <div class="wrap trending__inner">
      <p class="trending__title">${esc(s.title)}</p>
      <div class="trending__chips">${s.topics.filter((t) => ctx.categories[t]).map((t) => `<a class="tchip" href="${catUrl(ctx, t)}">${esc(ctx.categories[t].name)}</a>`).join('')}</div>
    </div>
  </nav>`,

  latest: (ctx, s) => {
    const used = new Set(ctx.home.sections.find((x) => x.type === 'top')?.posts || []);
    const posts = ctx.posts.filter((p) => !used.has(p.slug) && !['editors-pick', 'latest-news'].includes(p.category)).slice(0, 30);
    const filters = s.filters.filter((f) => ctx.categories[f]);
    const sp = ctx.postsBySlug[s.sponsoredPost];
    return `
  <section class="section" id="latest" aria-labelledby="latest-title" data-latest>
    <div class="wrap">
      ${shead(ctx, { eyebrow: s.eyebrow, title: s.title, id: 'latest-title', rule: true })}
      <div class="latest">
        <div class="latest__main">
          <div class="latest__tools">
            <div class="field latest__search">
              <label for="latest-q">Search articles</label>
              <div class="input-icon">${icon.search}<input id="latest-q" type="search" placeholder="e.g. cash flow, AI, CRM" data-latest-q autocomplete="off"></div>
            </div>
            <p class="latest__count" role="status" aria-live="polite" data-latest-count>Showing the ${Math.min(s.show, posts.length)} most recent articles</p>
          </div>
          <div class="chips" role="group" aria-label="Filter by topic">
            <button class="chip is-on" type="button" data-chip="all" aria-pressed="true">All</button>
            ${filters.map((f) => `<button class="chip" type="button" data-chip="${f}" aria-pressed="false">${esc(ctx.categories[f].name)}</button>`).join('')}
          </div>
          <div class="grid" data-latest-grid data-show="${s.show}">
            ${posts.map((p) => card(ctx, p, { sizes: '(min-width: 1100px) 26vw, (min-width: 700px) 45vw, 92vw', attrs: ` data-cat="${p.category}" data-text="${esc(`${p.title} ${p.excerpt} ${catOf(ctx, p).name}`.toLowerCase())}"` })).join('')}
          </div>
          <p class="empty" data-latest-empty hidden>No articles match that search. Try a broader word, or choose All.</p>
          <div class="latest__more">
            <button class="btn btn--secondary" type="button" data-latest-more>Load more</button>
            <a class="btn btn--secondary" href="${catUrl(ctx, 'latest-news')}">View All Articles</a>
          </div>
        </div>
        <aside class="latest__side" aria-label="More from CanadianSME">
          <div class="side-panel">${ad(ctx, s.ad)}</div>
          ${sp ? `
          <article class="sponsored-mini">
            <span class="tag tag--gold">Partner Content</span>
            <a class="sponsored-mini__img" href="${postUrl(ctx, sp)}" tabindex="-1" aria-hidden="true">${picture(sp, { w: 600, sizes: '300px' })}</a>
            <h3><a href="${postUrl(ctx, sp)}">${esc(sp.title)}</a></h3>
            <p class="meta">Presented with ADP Canada</p>
          </article>` : ''}
          <div class="mostread">
            <h3 class="mostread__title">${esc(s.sideTitle)}</h3>
            <ol>${s.side.map((x, i) => P(ctx, x)).map((p, i) => `<li><span class="mostread__n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><a href="${postUrl(ctx, p)}">${esc(p.title)}</a></li>`).join('')}</ol>
          </div>
        </aside>
      </div>
    </div>
  </section>`;
  },

  sponsored: (ctx, s) => `
  <section class="section section--tight" aria-labelledby="sp-title">
    <div class="wrap">
      ${shead(ctx, {
        tag: '<span class="tag tag--gold">Partner Content</span>',
        title: s.title,
        id: 'sp-title',
        text: 'Articles written with our partners are always labelled. Our newsroom’s stories are never paid for.',
        more: 'advertise/',
        moreLabel: 'Partner with us',
        rule: true,
      })}
      <div class="grid grid--3">${s.posts.map((x, i) => card(ctx, P(ctx, x), { tag: 'Partner', note: `Presented with ${s.partners[i]}`, sizes: '(min-width: 1100px) 30vw, 92vw' })).join('')}</div>
    </div>
  </section>`,

  banners: (ctx, s) => `
  <section class="banners" aria-label="Advertisements">
    <div class="wrap banners__grid">${s.ads.map((id) => ad(ctx, id)).join('')}</div>
  </section>`,

  magazine: (ctx, s) => {
    const m = mag(ctx, s.magazine);
    return `
  <section class="dark magband" aria-labelledby="mag-title">
    <div class="wrap magband__inner">
      <div class="magband__cover">${cover(ctx, m, { sizes: '(min-width: 900px) 400px, 80vw' })}</div>
      <div class="magband__copy">
        <p class="eyebrow eyebrow--gold">${esc(m.issue)} Edition</p>
        <h2 class="h-section" id="mag-title">CanadianSME Small Business Magazine</h2>
        <p>Every month: interviews with Canadian founders, practical guides on money, people and technology, and the programs and events that matter to owners. Read it free online.</p>
        <div class="btn-row">
          <a class="btn btn--primary" href="${m.href}" target="_blank" rel="noopener"${readerAttrs(m)}>Read Digital Magazine</a>
          <a class="btn btn--ghost-dark" href="${ctx.link('magazine/')}">View Past Issues</a>
        </div>
        <p class="magband__free"><span class="dot dot--gold" aria-hidden="true"></span>Free digital access</p>
      </div>
    </div>
  </section>`;
  },

  ai: (ctx, s) => {
    const [lead, ...more] = s.posts.map((x) => P(ctx, x));
    return `
  <section class="section" aria-labelledby="ai-title">
    <div class="wrap">
      ${shead(ctx, { eyebrow: 'Topic', title: 'Artificial Intelligence', id: 'ai-title', more: `category/${s.category}/`, moreLabel: 'All AI coverage', rule: true })}
      <div class="ai">
        <article class="ai__lead">
          <a class="ai__lead-img" href="${postUrl(ctx, lead)}" tabindex="-1" aria-hidden="true">${picture(lead, { w: 1200, sizes: '(min-width: 1000px) 55vw, 92vw' })}</a>
          <h3 class="ai__lead-title"><a href="${postUrl(ctx, lead)}">${esc(lead.title)}</a></h3>
          <p>${esc(lead.excerpt)}</p>
          ${metaLine(lead)}
        </article>
        <div class="ai__rows">
          ${more
            .map((p) => `
          <article class="ai__row">
            <a class="ai__row-img" href="${postUrl(ctx, p)}" tabindex="-1" aria-hidden="true">${picture(p, { w: 400, sizes: '132px' })}</a>
            <div>
              <h3 class="card__title"><a href="${postUrl(ctx, p)}">${esc(p.title)}</a></h3>
              <p class="card__excerpt">${esc(p.excerpt)}</p>
              ${metaLine(p)}
            </div>
          </article>`)
            .join('')}
        </div>
      </div>
    </div>
  </section>`;
  },

  topics: (ctx, s) => `
  <section class="section" aria-labelledby="topics-title">
    <div class="wrap">
      ${shead(ctx, { eyebrow: 'Topics', title: s.title, id: 'topics-title' })}
      <div class="tiles tiles--4">
        ${s.topics
          .filter((t) => ctx.categories[t])
          .map((slug) => {
            const c = ctx.categories[slug];
            return `<a class="tile" href="${catUrl(ctx, slug)}"><span class="tile__icon">${tIcon(slug)}</span><span class="tile__title">${esc(c.name)}</span><span class="tile__text">${esc(c.description || '')}</span></a>`;
          })
          .join('')}
      </div>
    </div>
  </section>`,

  spotlight: (ctx, s) => {
    const p = P(ctx, s.posts[0]);
    return `
  <section class="section spotlight" aria-labelledby="spot-title">
    <div class="wrap spotlight__inner">
      <div class="spotlight__copy">
        <p class="eyebrow">Entrepreneur Spotlight</p>
        <h2 class="h-section" id="spot-title">The People Behind Canada’s Most Inspiring Businesses</h2>
        <p class="shead__text">Every week we sit down with Canadian founders to ask how they built it, what went wrong, and what they would tell an owner starting out today.</p>
        <div class="spotlight__feature">
          <p class="eyebrow">Featured interview</p>
          <h3><a href="${postUrl(ctx, p)}">${esc(p.title)}</a></h3>
          <p>${esc(p.excerpt)}</p>
        </div>
        <div class="btn-row">
          <a class="btn btn--primary" href="${postUrl(ctx, p)}">Read the Interview</a>
          <a class="btn btn--secondary" href="${catUrl(ctx, 'interviews')}">Meet More Entrepreneurs</a>
        </div>
      </div>
      <a class="spotlight__img" href="${postUrl(ctx, p)}" tabindex="-1" aria-hidden="true">${picture(p, { w: 1000, sizes: '(min-width: 1000px) 45vw, 92vw' })}</a>
    </div>
  </section>`;
  },

  tools: (ctx) => `
  <section class="section" aria-labelledby="tools-title">
    <div class="wrap">
      ${shead(ctx, { eyebrow: 'Free tools', title: 'Calculators Built for Canadian Rules', id: 'tools-title', more: 'tools/', moreLabel: 'All tools' })}
      <div class="tiles tiles--4">
        ${ctx.data.tools.map((t) => `<a class="tool-card" href="${ctx.link('tools/')}#${t.key}"><span class="tool-card__mark" aria-hidden="true">${esc(t.mark)}</span><span class="tile__title">${esc(t.title)}</span><span class="tile__text">${esc(t.desc)}</span><span class="tool-card__go">Open calculator →</span></a>`).join('')}
      </div>
    </div>
  </section>`,

  deadlines: (ctx) => {
    const list = ctx.data.deadlines;
    const upcoming = list.filter((d) => new Date(`${d.date}T23:59:59`) >= ctx.today);
    return `
  <section class="section" id="deadlines" aria-labelledby="dead-title">
    <div class="wrap deadlines">
      <div class="deadlines__intro">
        <p class="eyebrow">Compliance calendar</p>
        <h2 class="h-section" id="dead-title">What’s Due Next</h2>
        <p class="shead__text">The federal filing and remittance dates most small businesses face. Your own dates depend on your fiscal year end and filing frequency.</p>
        <p><a class="link-arrow" href="https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/remitting-source-deductions.html">CRA remittance rules →</a></p>
        <p><a class="link-arrow" href="${ctx.link('tools/')}#payroll">Estimate payroll deductions →</a></p>
        <p class="deadlines__note">When a due date falls on a weekend or public holiday, the CRA accepts payment on the next business day. Dates shown are already adjusted.</p>
      </div>
      <ol class="deadlines__list" data-deadline-list>
        ${list.map((d) => `<li data-date="${d.date}"${new Date(`${d.date}T23:59:59`) < ctx.today || upcoming.indexOf(d) >= 6 ? ' hidden' : ''}><time class="deadlines__date" datetime="${d.date}">${dayMonth(d.date)}</time><span><strong>${esc(d.title)}</strong><span>${esc(d.who)}</span></span></li>`).join('')}
      </ol>
    </div>
  </section>`;
  },

  wotm: (ctx, s) => {
    const p = P(ctx, s.posts[0]);
    return `
  <section class="dark wotm" aria-labelledby="wotm-title">
    <div class="wrap wotm__inner">
      <a class="wotm__img" href="${postUrl(ctx, p)}" tabindex="-1" aria-hidden="true">${picture(p, { w: 1200, sizes: '(min-width: 1000px) 50vw, 92vw' })}</a>
      <div class="wotm__copy">
        <p class="eyebrow eyebrow--gold">Business Woman of the Month · ${esc(s.month)}</p>
        <h2 class="h-section" id="wotm-title">${esc(s.name)}</h2>
        <p class="wotm__role">${esc(s.role)}</p>
        ${s.kicker ? `<p class="wotm__kicker">${esc(s.kicker)}</p>` : ''}
        <p class="wotm__excerpt">${esc(p.excerpt)}</p>
        <div class="btn-row">
          <a class="btn btn--primary" href="${postUrl(ctx, p)}">Read her story</a>
          <a class="btn btn--ghost-dark" href="${ctx.link('contact-us/')}?reason=story">Nominate someone</a>
        </div>
      </div>
    </div>
  </section>`;
  },

  communities: (ctx) => `
  <section class="section" aria-labelledby="comm-title">
    <div class="wrap">
      ${shead(ctx, { eyebrow: 'Communities', title: 'Entrepreneurs Building Canada', id: 'comm-title', text: 'Founders from every community, and the programs and people backing them.' })}
      <div class="comm">
        ${ctx.data.communities
          .map((c) => {
            const [lead, ...more] = c.posts;
            return `
        <div class="comm__col">
          <h3 class="comm__head">${esc(c.heading)}</h3>
          <a class="comm__img" href="${lead.href}" tabindex="-1" aria-hidden="true">${extImg(lead.image, { w: 600, alt: '' })}</a>
          <h4 class="card__title"><a href="${lead.href}">${esc(lead.title)}</a></h4>
          <p class="card__excerpt">${esc(lead.excerpt)}</p>
          <ul class="comm__more">${more.map((m) => `<li><a href="${m.href}">${esc(m.title)}</a></li>`).join('')}</ul>
          <a class="link-arrow" href="${href(ctx, c.more)}"${ext(c.more)}>More on ${esc(c.heading.replace(/ Businesses$/, ''))} →</a>
        </div>`;
          })
          .join('')}
      </div>
    </div>
  </section>`,

  provinces: (ctx) => `
  <section class="section section--mist" id="provinces" aria-labelledby="prov-title">
    <div class="wrap">
      ${shead(ctx, { eyebrow: 'Where you operate', title: 'Business in Your Province', id: 'prov-title', text: 'Sales tax, workplace insurance and the provincial programs owners ask us about most.' })}
      <div class="tiles tiles--prov">
        ${ctx.data.provinces.map((p) => `<a class="tile tile--prov" href="${ctx.link('search/')}?q=${encodeURIComponent(p.label)}"><span class="tile__title">${esc(p.label)}</span><span class="tile__text">${esc(p.watch)}</span></a>`).join('')}
      </div>
    </div>
  </section>`,

  podcast: (ctx) => `
  <section class="dark podband" aria-labelledby="pod-title">
    <div class="wrap">
      <div class="podband__head">
        <div>
          <p class="eyebrow eyebrow--light">CanadianSME Podcast</p>
          <h2 class="h-section" id="pod-title">Insights You Can Take Anywhere</h2>
          <p>Conversations with Canadian business experts and entrepreneurs on growth, tools, people and technology.</p>
        </div>
        <div class="podband__actions">
          <div class="btn-row">
            <a class="btn btn--primary" href="https://smbpodcast.ca/" target="_blank" rel="noopener">Listen to the latest</a>
            <a class="btn btn--ghost-dark" href="${ctx.link('podcast/')}">All episodes</a>
          </div>
          <div class="platforms">${ctx.data.podcastLinks.map((l) => `<a class="platform" href="${l.href}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</div>
        </div>
      </div>
      <div class="episodes">${ctx.data.episodes.slice(0, 4).map((e) => episodeCard(e)).join('')}</div>
    </div>
  </section>`,

  events: (ctx) => `
  <section class="section" aria-labelledby="ev-title">
    <div class="wrap">
      ${shead(ctx, { eyebrow: 'Events & Community', title: 'Connect with Canada’s Small Business Community', id: 'ev-title' })}
      <div class="tiles tiles--4">${ctx.data.events.map((e) => eventCard(ctx, e)).join('')}</div>
      <div class="btn-row btn-row--center">
        <a class="btn btn--primary" href="${ctx.link('events/')}">Explore Upcoming Events</a>
        <a class="btn btn--secondary" href="${ctx.link('advertise/')}">Become an Event Partner</a>
      </div>
    </div>
  </section>`,

  resources: (ctx) => {
    const items = ctx.data.resourceGroups.flatMap((g) => g.items).filter((i) => !/^tools\//.test(i.href)).slice(0, 8);
    return `
  <section class="section section--mist" aria-labelledby="res-title">
    <div class="wrap">
      ${shead(ctx, { eyebrow: 'Business resources', title: 'Practical Resources for Every Stage of Business', id: 'res-title', more: 'resources/', moreLabel: 'All resources' })}
      <div class="links-grid">${items.map((i) => `<a class="link-tile" href="${href(ctx, i.href)}"${ext(i.href)}><span><span class="link-tile__kind">${esc(i.kind)}</span><span class="link-tile__title">${esc(i.title)}</span></span><span aria-hidden="true">→</span></a>`).join('')}</div>
    </div>
  </section>`;
  },

  partners: (ctx) => {
    const logos = ctx.home.partners.map((p) => `<a class="marquee__item" href="${p.href}" target="_blank" rel="noopener" aria-label="${esc(p.name)}">${p.logo ? `<img src="${img(p.logo, 300)}" alt="" width="150" height="70" loading="lazy">` : `<span class="marquee__text">${esc(p.name)}</span>`}</a>`).join('');
    return `
  <section class="section partners" aria-labelledby="partners-title">
    <div class="wrap">
      ${shead(ctx, { eyebrow: 'Our partners', title: 'Backed by Partners Who Champion Canadian Business', id: 'partners-title' })}
      <ul class="pills">${ctx.home.partners.map((p) => `<li>${esc(p.role)}</li>`).join('')}</ul>
    </div>
    <div class="marquee" aria-label="Partner logos">
      <div class="marquee__track">${logos}${logos.replace(/<a /g, '<a tabindex="-1" aria-hidden="true" ')}${logos.replace(/<a /g, '<a tabindex="-1" aria-hidden="true" ')}</div>
    </div>
    <div class="wrap btn-row btn-row--center"><a class="btn btn--secondary" href="${ctx.link('advertise/')}">Become a CanadianSME Partner</a></div>
  </section>`;
  },

  newsletter: () => '',
};

function episodeCard(e, { big = false } = {}) {
  return `
  <article class="episode${big ? ' episode--light' : ''}">
    <span class="episode__box" aria-hidden="true">${icon.play}</span>
    <div class="episode__body">
      <p class="episode__meta">With ${esc(e.guest)}</p>
      <h3 class="episode__title"><a href="${e.href}" target="_blank" rel="noopener">${esc(e.title)}</a></h3>
    </div>
    <a class="episode__play" href="${e.href}" target="_blank" rel="noopener" aria-label="Play: ${esc(e.title)}">${icon.play}</a>
  </article>`;
}

const isPast = (ctx, e) => e.date && new Date(`${e.date}T23:59:59`) < ctx.today;
const eventWhen = (ctx, e) => (e.date ? `${shortDate(`${e.date}T12:00:00`)}${isPast(ctx, e) ? ' · Past event' : ''}` : 'Ongoing series');

function eventCard(ctx, e) {
  const d = e.date ? new Date(`${e.date}T12:00:00`) : null;
  return `
  <article class="event-card">
    <a class="event-card__slot" href="${ctx.link(`events/${e.slug}/`)}" tabindex="-1" aria-hidden="true">
      ${d ? `<span class="event-card__day">${d.getDate()}</span><span class="event-card__month">${d.toLocaleString('en-CA', { month: 'short' })} ${d.getFullYear()}</span>` : '<span class="event-card__month">Series</span>'}
    </a>
    <p class="event-card__meta">${esc(eventWhen(ctx, e))} · ${esc(e.venue.split(',').at(-1).trim())}</p>
    <h3 class="card__title"><a href="${ctx.link(`events/${e.slug}/`)}">${esc(e.name)}</a></h3>
    <p class="card__excerpt">${esc(e.desc)}</p>
  </article>`;
}

export const home = (ctx) => {
  const body = ctx.home.sections.map((s) => (sections[s.type] ? sections[s.type](ctx, s) : '')).join('\n');
  return page(ctx, {
    title: `${ctx.site.fullName}: News and insights for Canadian SMEs`,
    description: ctx.site.tagline,
    canonical: `${ctx.site.url}/`,
    image: ctx.home.magazines[0].cover,
    body,
    active: 'home',
    bodyClass: 'is-home',
    newsletter: ctx.home.sections.some((s) => s.type === 'newsletter'),
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

// Gives every <h2> an id so the "In this article" list can link to it.
const withHeadingIds = (html) => {
  const toc = [];
  const used = new Set();
  const out = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, (m, attrs, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
    if (!text) return m;
    let id = (attrs.match(/\sid="([^"]+)"/) || [])[1];
    if (!id) {
      id = text.toLowerCase().replace(/&[a-z#0-9]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'section';
      while (used.has(id)) id += '-2';
    }
    used.add(id);
    toc.push({ id, text });
    return /\sid="/.test(attrs) ? m : `<h2${attrs} id="${id}">${inner}</h2>`;
  });
  return { html: out, toc };
};

export const article = (ctx, post, html) => {
  const cat = catOf(ctx, post);
  const author = ctx.authors[post.author];
  const related = (ctx.byCategory[post.category] || []).filter((p) => p.slug !== post.slug).slice(0, 3);
  const pageUrl = `${ctx.site.url}/${post.slug}/`;
  const u = encodeURIComponent(pageUrl);
  const t = encodeURIComponent(post.title);
  const { html: bodyHtml, toc } = withHeadingIds(html || '');
  const fallback = `
    <p>${esc(post.excerpt)}</p>
    <div class="notice">
      <p>The full text of this article is being moved to the new site.</p>
      <a class="btn btn--secondary btn--sm" href="${ctx.site.url}/${post.slug}/">Read it on canadiansme.ca</a>
    </div>`;
  const partner = /Partner/.test(author.role || '');

  const body = `
  <div class="progress" data-progress aria-hidden="true"></div>
  ${crumbs(ctx, [[cat.name, `category/${cat.slug}/`], [post.title]])}
  <article class="article">
    <header class="wrap"><div class="article__head">
      <p class="article__kicker"><a class="pill" href="${catUrl(ctx, cat.slug)}">${esc(cat.name)}</a>${partner ? `<span class="tag tag--gold">Partner Content · ${esc(author.name)}</span>` : ''}</p>
      <h1 class="h-page">${esc(post.title)}</h1>
      <p class="article__standfirst">${esc(post.excerpt)}</p>
      <div class="article__byline">
        <span class="avatar" aria-hidden="true">${esc(initials(author.name))}</span>
        <div>
          <p class="article__author"><a href="${ctx.link(`author/${author.slug}/`)}">${esc(author.name)}</a>${author.role ? `<span>${esc(author.role)}</span>` : ''}</p>
          <p class="meta">Published <time datetime="${post.date}">${shortDate(post.date)}</time>${post.modified && post.modified.slice(0, 10) !== post.date.slice(0, 10) ? ` · Updated <time datetime="${post.modified}">${shortDate(post.modified)}</time>` : ''} · ${post.readingTime} min read</p>
        </div>
      </div>
      <div class="share" role="group" aria-label="Share this article">
        <a class="btn btn--secondary btn--sm" href="https://www.linkedin.com/sharing/share-offsite/?url=${u}" target="_blank" rel="noopener">Share</a>
        <a class="btn btn--secondary btn--sm" href="https://twitter.com/intent/tweet?url=${u}&amp;text=${t}" target="_blank" rel="noopener">Post</a>
        <button class="btn btn--secondary btn--sm" type="button" data-copy="${pageUrl}">Copy link</button>
        <button class="btn btn--secondary btn--sm bookmark bookmark--btn" type="button" data-bookmark="${esc(post.slug)}" aria-pressed="false" aria-label="Bookmark this article">♡</button>
        <span class="share__msg" role="status" aria-live="polite" data-share-msg></span>
      </div>
    </div></header>
    <figure class="wrap article__figure">
      ${picture(post, { w: 1600, sizes: '(min-width: 1280px) 1232px, 96vw', eager: true, alt: post.imageAlt || '' })}
      ${post.imageCaption ? `<figcaption>${esc(post.imageCaption)}</figcaption>` : ''}
    </figure>
    <div class="wrap article__layout">
      <div class="prose article__body">
        ${bodyHtml || fallback}
      </div>
      <aside class="article__aside" aria-label="Article tools">
        <div class="article__aside-inner">
          ${ad(ctx, 'ups-skyscraper')}
          ${toc.length > 1 ? `<nav class="toc" aria-label="In this article"><p class="toc__title">In this article</p><ol>${toc.map((h) => `<li><a href="#${h.id}" data-toc>${esc(h.text)}</a></li>`).join('')}</ol></nav>` : ''}
          <div class="briefing">
            <p class="briefing__title">Get the weekly briefing</p>
            <p>New stories, CRA deadlines and funding programs for Canadian owners. Free.</p>
            <a class="btn btn--primary btn--block" href="${ctx.link('subscription/')}">Subscribe free</a>
          </div>
        </div>
      </aside>
    </div>
    <div class="wrap">
      <aside class="author-box" aria-label="About the author">
        <span class="avatar avatar--lg" aria-hidden="true">${esc(initials(author.name))}</span>
        <div>
          <p class="eyebrow">About the author</p>
          <p class="author-box__name"><a href="${ctx.link(`author/${author.slug}/`)}">${esc(author.name)}</a></p>
          ${author.role ? `<p class="author-box__role">${esc(author.role)}</p>` : ''}
          ${author.bio ? `<p class="author-box__bio">${esc(author.bio)}</p>` : ''}
        </div>
      </aside>
    </div>
  </article>
  ${related.length ? `
  <section class="section section--mist" aria-labelledby="related-title">
    <div class="wrap">
      ${shead(ctx, { title: 'Related articles', id: 'related-title', more: `category/${cat.slug}/`, moreLabel: `More in ${cat.name}` })}
      <div class="grid grid--3">${related.map((p) => card(ctx, p, { sizes: '(min-width: 1100px) 30vw, 92vw' })).join('')}</div>
    </div>
  </section>` : ''}`;

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

const pageHead = (ctx, { eyebrow = '', title, text = '', extra = '', cls = '' }) => `
  <header class="wrap page-head${cls ? ` ${cls}` : ''}">
    ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
    <h1 class="h-page">${esc(title)}</h1>
    ${text ? `<p class="page-head__text">${esc(text)}</p>` : ''}
    ${extra}
  </header>`;

const listingGrid = (ctx, posts) => `
  <div class="listing" data-listing>
    <div class="listing__bar">
      <p class="listing__count">${posts.length} ${posts.length === 1 ? 'article' : 'articles'}</p>
      <div class="listing__tools">
        <label class="inline-field"><span>Sort</span>
          <select data-sort>
            <option value="new">Most recent</option>
            <option value="old">Oldest first</option>
            <option value="az">Title A–Z</option>
          </select>
        </label>
        <a class="link-arrow" href="${ctx.link('search/')}">Search all articles →</a>
      </div>
    </div>
    <div class="grid" data-listing-grid data-per-page="12">
      ${posts.map((p, i) => card(ctx, p, { attrs: ` data-i="${i}" data-title="${esc(p.title.toLowerCase())}"` })).join('')}
    </div>
    <nav class="pager" aria-label="Pages" data-pager hidden></nav>
  </div>`;

export const category = (ctx, cat) => {
  const posts = (ctx.byCategory[cat.slug] || []).slice(0, 240);
  const body = `
  ${crumbs(ctx, [[cat.name]])}
  ${pageHead(ctx, { eyebrow: 'Category', title: cat.name, text: cat.description })}
  <section class="wrap section section--flush">
    ${posts.length ? listingGrid(ctx, posts) : '<p class="empty">No articles here yet.</p>'}
  </section>
  <div class="wrap section section--tight">${ad(ctx, 'ups-leaderboard')}</div>`;
  return page(ctx, { title: `${cat.name} | ${ctx.site.fullName}`, description: cat.description || ctx.site.tagline, canonical: `${ctx.site.url}/category/${cat.slug}/`, image: posts[0]?.image, active: cat.slug, body });
};

// Contributor page.
export const authorPage = (ctx, author) => {
  const posts = ctx.posts.filter((p) => p.author === author.slug);
  const photo = author.slug === 'sk-uddin' ? `<img class="contrib__photo" src="${ctx.link('assets/img/sk-uddin.jpg')}" alt="SK Uddin" width="300" height="300">` : `<span class="avatar avatar--xl" aria-hidden="true">${esc(initials(author.name))}</span>`;
  const body = `
  ${crumbs(ctx, [['Contributors'], [author.name]])}
  <header class="wrap contrib">
    ${photo}
    <div>
      <p class="eyebrow">Contributor</p>
      <h1 class="h-page">${esc(author.name)}</h1>
      ${author.role ? `<p class="contrib__role">${esc(author.role)}</p>` : ''}
      ${author.bio ? `<p class="page-head__text">${esc(author.bio)}</p>` : ''}
    </div>
  </header>
  <section class="wrap section section--flush" aria-labelledby="work-title">
    ${shead(ctx, { title: 'Recent work', id: 'work-title', rule: true })}
    ${posts.length ? listingGrid(ctx, posts.slice(0, 120)) : '<p class="empty">No articles yet.</p>'}
  </section>`;
  return page(ctx, { title: `${author.name} | ${ctx.site.fullName}`, description: author.bio || ctx.site.tagline, canonical: `${ctx.site.url}/author/${author.slug}/`, body });
};

// ---------- Search ----------

export const searchPage = (ctx) => {
  const body = `
  ${crumbs(ctx, [['Search']])}
  ${pageHead(ctx, { title: 'Search CanadianSME', text: 'Articles, tools, podcast episodes, resources and events.' })}
  <section class="wrap section section--flush" data-search-page>
    <form class="bigsearch" action="" method="get" role="search">
      <label class="visually-hidden" for="page-q">Search the site</label>
      <input id="page-q" type="search" name="q" placeholder="e.g. cash flow, tariffs, hiring" autocomplete="off" data-page-q>
      <button class="btn btn--primary" type="submit">Search</button>
    </form>
    <p class="search-summary" role="status" aria-live="polite" data-search-summary>Type a word or two and press Search.</p>
    <ol class="results" data-search-list></ol>
  </section>`;
  return page(ctx, { title: `Search | ${ctx.site.fullName}`, description: 'Search CanadianSME Small Business Magazine.', canonical: `${ctx.site.url}/search/`, body });
};

// ---------- Magazine ----------

export const magazineArchive = (ctx) => {
  const [current] = ctx.home.magazines;
  const body = `
  ${crumbs(ctx, [['Magazine']])}
  ${pageHead(ctx, { eyebrow: 'The Magazine', title: 'Every Issue of CanadianSME', text: 'Read each edition free online. Tap a cover to open it here, or read it on Issuu.' })}
  <section class="wrap section section--flush">
    <div class="covers">
      ${ctx.home.magazines
        .map(
          (m) => `
      <article class="cover-card">
        ${cover(ctx, m, { sizes: '(min-width: 1100px) 22vw, 45vw' })}
        <p class="cover-card__month">${esc(m.issue)}</p>
        <h2 class="cover-card__title"><a href="${ctx.link(`magazine/${m.id}/`)}">${esc(m.title)}</a></h2>
        ${m.id === current.id ? `<a class="link-arrow" href="${ctx.link(`magazine/${m.id}/`)}">Current issue →</a>` : `<a class="link-arrow link-arrow--quiet" href="${ctx.link(`magazine/${m.id}/`)}">Issue details →</a>`}
      </article>`
        )
        .join('')}
    </div>
    <div class="btn-row btn-row--center"><a class="btn btn--secondary" href="https://issuu.com/canadiansme" target="_blank" rel="noopener">Older issues on Issuu</a></div>
  </section>`;
  return page(ctx, { title: `Magazine | ${ctx.site.fullName}`, description: 'Every issue of CanadianSME Small Business Magazine, free to read online.', canonical: `${ctx.site.url}/magazine/`, image: current.cover, active: 'magazine', body });
};

export const magazineIssue = (ctx, m) => {
  const others = ctx.home.magazines.filter((x) => x.id !== m.id).slice(0, 4);
  const body = `
  ${crumbs(ctx, [['Magazine', 'magazine/'], [m.issue]])}
  <section class="dark issue" aria-labelledby="issue-title">
    <div class="wrap issue__inner">
      <div class="issue__cover">${cover(ctx, m, { eager: true, sizes: '(min-width: 900px) 360px, 80vw' })}</div>
      <div>
        <p class="eyebrow eyebrow--gold">${esc(m.issue)} Edition</p>
        <h1 class="h-page" id="issue-title">${esc(m.title)}</h1>
        <p class="issue__text">The ${esc(m.issue)} edition is free to read online. Open it here in the reader, or on Issuu.</p>
        <div class="btn-row">
          <a class="btn btn--primary" href="${m.href}" target="_blank" rel="noopener"${readerAttrs(m)}>Read Digital Magazine</a>
          <a class="btn btn--ghost-dark" href="${ctx.link('magazine/')}">View Past Issues</a>
        </div>
        <p class="magband__free"><span class="dot dot--gold" aria-hidden="true"></span>Free digital access</p>
      </div>
    </div>
  </section>
  <section class="wrap section" aria-labelledby="more-issues">
    ${shead(ctx, { title: 'More issues', id: 'more-issues', more: 'magazine/', moreLabel: 'All issues', rule: true })}
    <div class="covers">${others.map((o) => `<article class="cover-card">${cover(ctx, o, { sizes: '(min-width: 1100px) 22vw, 45vw' })}<p class="cover-card__month">${esc(o.issue)}</p><h2 class="cover-card__title"><a href="${ctx.link(`magazine/${o.id}/`)}">${esc(o.title)}</a></h2></article>`).join('')}</div>
  </section>`;
  return page(ctx, { title: `${m.title}, ${m.issue} | ${ctx.site.name}`, description: `Read the ${m.issue} edition of ${m.title} free online.`, canonical: `${ctx.site.url}/magazine/${m.id}/`, image: m.cover, active: 'magazine', body });
};

// ---------- Podcast ----------

export const podcastPage = (ctx) => {
  const body = `
  ${crumbs(ctx, [['Podcast']])}
  ${pageHead(ctx, {
    eyebrow: 'CanadianSME Podcast',
    title: 'Every Episode',
    text: 'The CanadianSME Small Business Podcast interviews Canadian business experts and entrepreneurs, giving owners practical knowledge on growth, trends, tools and technology.',
    extra: `<div class="platforms platforms--light">${ctx.data.podcastLinks.map((l) => `<a class="platform" href="${l.href}" target="_blank" rel="noopener">Listen on ${esc(l.label)}</a>`).join('')}</div>`,
  })}
  <section class="wrap section section--flush" aria-label="Latest episodes">
    <div class="episodes episodes--list">${ctx.data.episodes.map((e) => episodeCard(e, { big: true })).join('')}</div>
    <div class="btn-row btn-row--center"><a class="btn btn--secondary" href="https://smbpodcast.ca/category/episodes/" target="_blank" rel="noopener">All episodes on smbpodcast.ca</a></div>
  </section>
  <div class="wrap section section--tight">${ad(ctx, 'ai-breakdown')}</div>`;
  return page(ctx, { title: `Podcast | ${ctx.site.fullName}`, description: 'Interviews with Canadian business experts and entrepreneurs.', canonical: `${ctx.site.url}/podcast/`, active: 'podcast', body });
};

// ---------- Events ----------

export const eventsPage = (ctx) => {
  const list = [...ctx.data.events].sort((a, b) => (isPast(ctx, a) - isPast(ctx, b)) || (a.date || '9').localeCompare(b.date || '9'));
  const body = `
  ${crumbs(ctx, [['Events']])}
  ${pageHead(ctx, { eyebrow: 'Events & Community', title: 'Upcoming CanadianSME Events', text: 'Shows, summits, awards and talks that bring Canada’s small business community together.' })}
  <section class="wrap section section--flush">
    <div class="event-rows">
      ${list
        .map((e) => {
          const d = e.date ? new Date(`${e.date}T12:00:00`) : null;
          return `
      <article class="event-row${isPast(ctx, e) ? ' is-past' : ''}">
        <a class="event-card__slot" href="${ctx.link(`events/${e.slug}/`)}" tabindex="-1" aria-hidden="true">${d ? `<span class="event-card__day">${d.getDate()}</span><span class="event-card__month">${d.toLocaleString('en-CA', { month: 'short' })} ${d.getFullYear()}</span>` : '<span class="event-card__month">Series</span>'}</a>
        <div>
          <p class="event-card__meta">${esc(eventWhen(ctx, e))} · ${esc(e.venue)}</p>
          <h2 class="h-card"><a href="${ctx.link(`events/${e.slug}/`)}">${esc(e.name)}</a></h2>
          <p class="card__excerpt">${esc(e.desc)}</p>
          <a class="link-arrow" href="${ctx.link(`events/${e.slug}/`)}">Event details →</a>
        </div>
      </article>`;
        })
        .join('')}
    </div>
  </section>`;
  return page(ctx, { title: `Events | ${ctx.site.fullName}`, description: 'CanadianSME events for Canadian small business owners.', canonical: `${ctx.site.url}/events/`, active: 'events', body });
};

export const eventPage = (ctx, e) => {
  const past = isPast(ctx, e);
  const body = `
  ${crumbs(ctx, [['Events', 'events/'], [e.name]])}
  <section class="wrap section section--flush event">
    <div class="event__slot" aria-hidden="true"><span>${esc(e.theme)}</span></div>
    <div class="event__layout">
      <div>
        <p class="eyebrow">CanadianSME Event</p>
        <h1 class="h-page">${esc(e.name)}</h1>
        <p class="page-head__text">${esc(e.desc)}</p>
        <h2 class="h-sub">What to expect</h2>
        <ul class="ticks">${e.expect.map((x) => `<li>${icon.check}<span>${esc(x)}</span></li>`).join('')}</ul>
      </div>
      <aside class="event__aside" aria-label="Event details">
        <dl>
          <div><dt>Date</dt><dd>${e.date ? longDate(`${e.date}T12:00:00`) : 'Ongoing series'}${past ? ' (past event)' : ''}</dd></div>
          <div><dt>Location</dt><dd>${esc(e.venue)}</dd></div>
          <div><dt>Details</dt><dd><a href="${e.href}" target="_blank" rel="noopener">${esc(e.href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a></dd></div>
        </dl>
        <a class="btn btn--primary btn--block" href="${e.href}" target="_blank" rel="noopener">${past ? 'See highlights and next dates' : 'Register now'}</a>
        <a class="btn btn--secondary btn--block" href="${ctx.link('advertise/')}">Partner with us</a>
      </aside>
    </div>
  </section>`;
  return page(ctx, { title: `${e.name} | ${ctx.site.name}`, description: e.desc, canonical: `${ctx.site.url}/events/${e.slug}/`, active: 'events', body });
};

// ---------- Resources ----------

export const resourcesPage = (ctx) => {
  const body = `
  ${crumbs(ctx, [['Business Resources']])}
  ${pageHead(ctx, { eyebrow: 'Resources', title: 'Business Resources', text: 'Free tools, official government guides and our own coverage, grouped by what you are trying to get done.' })}
  ${ctx.data.resourceGroups
    .map(
      (g, gi) => `
  <section class="wrap section${gi === 0 ? ' section--flush' : ' section--tight'}" aria-labelledby="rg-${gi}">
    ${shead(ctx, { title: g.heading, id: `rg-${gi}`, text: g.sub, rule: true })}
    <div class="tiles tiles--4">
      ${g.items.map((i) => `<a class="res-card" href="${href(ctx, i.href)}"${ext(i.href)}><span class="res-card__kind">${esc(i.kind)}</span><span class="tile__title">${esc(i.title)}</span><span class="tile__text">${esc(i.desc)}</span><span class="link-arrow">${/^https?:/.test(i.href) ? 'Open guide' : /^tools/.test(i.href) ? 'Open calculator' : 'Read more'} →</span></a>`).join('')}
    </div>
  </section>`
    )
    .join('')}`;
  return page(ctx, { title: `Business Resources | ${ctx.site.fullName}`, description: 'Free tools, official guides and practical coverage for Canadian small business owners.', canonical: `${ctx.site.url}/resources/`, active: 'resources', body });
};

// ---------- About ----------

export const aboutPage = (ctx) => {
  const c = ctx.site.contact;
  const body = `
  ${crumbs(ctx, [['About']])}
  <section class="wrap section section--flush about-hero">
    <div>
      <p class="eyebrow">About CanadianSME</p>
      <h1 class="h-page">Empowering Canada’s Small and Medium-Sized Businesses</h1>
      <p class="page-head__text">CanadianSME is the premier and most relevant platform for SMEs in Canada. We highlight growing businesses and thought leaders with a strong focus on innovation, growth and marketing, so owners can get the results they know they are capable of.</p>
      <div class="btn-row"><a class="btn btn--primary" href="${ctx.link('subscription/')}">Subscribe free</a><a class="btn btn--secondary" href="${ctx.link('contact-us/')}">Contact us</a></div>
    </div>
    ${cover(ctx, ctx.home.magazines[0], { sizes: '320px', cls: 'about-hero__cover' })}
  </section>
  <section class="section section--mist" id="leadership" aria-labelledby="lead-title">
    <div class="wrap leader">
      <img class="leader__photo" src="${ctx.link('assets/img/sk-uddin.jpg')}" alt="SK Uddin" width="300" height="300" loading="lazy">
      <div>
        <p class="eyebrow">Leadership</p>
        <h2 class="h-section" id="lead-title">SK Uddin</h2>
        <p class="leader__role">Editor &amp; Publisher, CanadianSME Small Business Magazine</p>
        <p>${esc(ctx.authors['sk-uddin']?.bio || '')}</p>
        <a class="link-arrow" href="${ctx.link('author/sk-uddin/')}">Read his articles →</a>
      </div>
    </div>
  </section>
  <section class="wrap section" aria-label="Our approach">
    <div class="tiles tiles--3">
      <div class="info"><h2 class="h-card">Our approach</h2><p>Cmarketing Inc. is a marketing agency and business management boutique that helps Canadian SMEs. Recognizing the Canadian economy’s dependence on SMEs, the agency publishes a magazine whose content supports them.</p></div>
      <div class="info"><h2 class="h-card">Our philosophy</h2><p>Through our conferences, online and social presence, CanadianSME provides a platform to position and promote your products and services, extending reach through standard and emerging technologies.</p></div>
      <div class="info"><h2 class="h-card">Our mission</h2><p>SMEs in Canada make up the vast majority of businesses. We help them succeed through business publications, events, special projects and business consulting.</p></div>
    </div>
  </section>
  <section class="dark why" aria-labelledby="why-title">
    <div class="wrap"><div class="why__inner">
      <p class="eyebrow eyebrow--light">Why we exist</p>
      <h2 class="h-section" id="why-title">Small business support you can trust</h2>
      <p>CanadianSME Business Magazine was created out of passion for and admiration of entrepreneurs. With SMEs playing such a crucial role in Canada’s economy, CanadianSME was built to provide a much-needed support system for hard-working business owners.</p>
    </div></div>
  </section>
  <section class="wrap section" aria-labelledby="run-title">
    ${shead(ctx, { eyebrow: 'Programs', title: 'What we run', id: 'run-title', rule: true })}
    <div class="tiles tiles--3">${ctx.data.programs.map((p) => `<a class="tile" href="${href(ctx, p.href)}"${ext(p.href)}><span class="tile__title">${esc(p.title)}</span><span class="tile__text">${esc(p.desc)}</span><span class="link-arrow">${esc(p.cta)} →</span></a>`).join('')}</div>
  </section>
  <section class="section section--mist" aria-labelledby="pub-title">
    <div class="wrap publisher">
      <div>
        <p class="eyebrow">Publisher</p>
        <h2 class="h-section" id="pub-title">Published by ${esc(c.company)}</h2>
        <p>${esc(c.address)}</p>
        <p class="publisher__phones">${c.phones.map((p) => `<a href="tel:${p.replace(/\s/g, '')}">${esc(p)}</a>`).join('')}</p>
      </div>
      <a class="btn btn--primary" href="${ctx.link('subscription/')}">Subscribe to the magazine</a>
    </div>
  </section>`;
  return page(ctx, { title: `About | ${ctx.site.fullName}`, description: 'CanadianSME is the premier and most relevant platform for SMEs in Canada.', canonical: `${ctx.site.url}/about-us/`, active: 'about-us', body });
};

// ---------- Advertise ----------

export const advertisePage = (ctx) => {
  const opts = [
    ['Display advertising', 'Leaderboards, sidebar units and in-article placements across the site, seen by owners and decision-makers.'],
    ['Partner content', 'Articles written with your team and clearly labelled, published on the site and shared with our audience.'],
    ['Magazine', 'Print-ready and digital placements in the monthly CanadianSME Small Business Magazine.'],
    ['Events', 'Sponsorship at the Small Business Show, Summit, National Business Awards and Canada Business Talks.'],
  ];
  const body = `
  ${crumbs(ctx, [['Advertise']])}
  ${pageHead(ctx, { eyebrow: 'Work With Us', title: 'Reach Canada’s Small Business Decision-Makers', text: 'CanadianSME connects your brand with owners and leaders of Canadian small and medium-sized businesses, online, in the magazine and in the room at our events.' })}
  <section class="wrap section section--flush" id="options" aria-label="Ways to work with us">
    <div class="tiles tiles--4">${opts.map(([t, d]) => `<div class="info"><h2 class="h-card">${esc(t)}</h2><p>${esc(d)}</p></div>`).join('')}</div>
    <div class="mediakit">
      <div>
        <h2 class="h-sub">Request the media kit</h2>
        <p>Tell us about your goals and we will send audience details, formats and rates.</p>
      </div>
      <div class="btn-row">
        <a class="btn btn--primary" href="${ctx.link('contact-us/')}?reason=advertising">Request the media kit</a>
        <a class="btn btn--ghost-dark" href="tel:${ctx.site.contact.phones[0].replace(/\s/g, '')}">Call ${esc(ctx.site.contact.phones[0])}</a>
      </div>
    </div>
  </section>
  <section class="wrap section section--tight" aria-labelledby="cur-partners">
    ${shead(ctx, { title: 'Current partners', id: 'cur-partners', rule: true })}
    <ul class="pills">${ctx.home.partners.map((p) => `<li><a href="${p.href}" target="_blank" rel="noopener">${esc(p.name)} · ${esc(p.role)}</a></li>`).join('')}</ul>
  </section>`;
  return page(ctx, { title: `Advertise | ${ctx.site.fullName}`, description: 'Advertise with CanadianSME and reach Canadian small business decision-makers.', canonical: `${ctx.site.url}/advertise/`, active: 'advertise', body });
};

// ---------- Contact ----------

const REASONS = [
  ['story', 'Story tip or pitch'],
  ['advertising', 'Advertising and partnerships'],
  ['events', 'Events'],
  ['magazine', 'Magazine subscription'],
  ['other', 'Something else'],
];

export const contactPage = (ctx) => {
  const c = ctx.site.contact;
  const body = `
  ${crumbs(ctx, [['Contact']])}
  <section class="wrap section section--flush contact">
    <div>
      <p class="eyebrow">Contact</p>
      <h1 class="h-page">Get in Touch</h1>
      <p class="page-head__text">Questions, story ideas, advertising and partnerships: we would like to hear from you.</p>
      <dl class="contact__info">
        <div><dt>Phone</dt><dd>${c.phones.map((p) => `<a href="tel:${p.replace(/\s/g, '')}">${esc(p)}</a>`).join('<br>')}</dd></div>
        <div><dt>Office</dt><dd>${esc(c.company)}<br>${esc(c.address)}</dd></div>
        <div><dt>Social</dt><dd class="contact__social">${ctx.site.social.map((s) => `<a href="${s.href}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('')}</dd></div>
      </dl>
    </div>
    <form class="form-card" data-contact novalidate>
      <h2 class="h-sub">Send a message</h2>
      <div class="field"><label for="c-name">Name</label><input id="c-name" name="name" autocomplete="name"></div>
      <div class="field"><label for="c-email">Email</label><input id="c-email" name="email" type="email" autocomplete="email"></div>
      <div class="field"><label for="c-reason">Reason for contact</label><select id="c-reason" name="reason"><option value="">Choose a reason</option>${REASONS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
      <div class="field"><label for="c-msg">Message</label><textarea id="c-msg" name="message" rows="6"></textarea></div>
      <p class="form-status" role="status" aria-live="polite" data-status></p>
      <button class="btn btn--primary" type="submit">Send message</button>
    </form>
  </section>`;
  return page(ctx, { title: `Contact | ${ctx.site.fullName}`, description: 'Questions, suggestions, advertising and partnerships: get in touch with CanadianSME.', canonical: `${ctx.site.url}/contact-us/`, active: 'contact-us', body });
};

// ---------- Subscribe ----------

export const subscribePage = (ctx) => {
  const benefits = ['The weekly briefing for Canadian owners', 'Each new magazine edition, free', 'Funding deadlines before they close', 'Early access to event registration'];
  const body = `
  ${crumbs(ctx, [['Subscribe']])}
  <section class="wrap section section--flush subscribe">
    <div>
      <p class="eyebrow">Newsletter</p>
      <h1 class="h-page">Subscribe to CanadianSME</h1>
      <p class="page-head__text">Practical news and ideas for Canadian small business, plus the free monthly magazine.</p>
      <ul class="ticks">${benefits.map((b) => `<li>${icon.check}<span>${esc(b)}</span></li>`).join('')}</ul>
      ${cover(ctx, ctx.home.magazines[0], { sizes: '220px', cls: 'subscribe__cover' })}
    </div>
    <div class="form-card form-card--ink">${signupForm(ctx, 'sub')}</div>
  </section>`;
  return page(ctx, { title: `Subscribe | ${ctx.site.fullName}`, description: 'Get CanadianSME Small Business Magazine and the weekly briefing free.', canonical: `${ctx.site.url}/subscription/`, active: 'subscription', body });
};

// ---------- Static pages (HTML from content/pages) ----------

export const staticPage = (ctx, pg, html) => {
  const out = html
    .replace(/\{\{link:([^}]+)\}\}/g, (_, p) => ctx.link(p))
    .replace(/\{\{ad:([^}]+)\}\}/g, (_, id) => ad(ctx, id))
    .replace(/\{\{cover:([^}]+)\}\}/g, (_, id) => (mag(ctx, id) ? cover(ctx, mag(ctx, id), { eager: true, sizes: '320px' }) : ''))
    .replace('{{partners}}', () => `<ul class="pills">${ctx.home.partners.map((p) => `<li><a href="${p.href}" target="_blank" rel="noopener">${esc(p.name)}</a></li>`).join('')}</ul>`)
    .replace('{{social}}', () => ctx.site.social.map((s) => `<a href="${s.href}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join(''))
    .replace('{{archive}}', () => `<div class="covers">${ctx.home.magazines.map((m) => `<article class="cover-card">${cover(ctx, m, { sizes: '180px' })}<p class="cover-card__month">${esc(m.issue)}</p></article>`).join('')}</div>`)
    .replace(/\{\{posts:([^}]+)\}\}/g, (_, c) => `<div class="grid grid--3">${(ctx.byCategory[c] || []).slice(0, 6).map((p) => card(ctx, p)).join('')}</div>`)
    .replace(/btn btn--solid/g, 'btn btn--primary')
    .replace(/btn btn--ghost/g, 'btn btn--secondary');

  const body = `
  ${crumbs(ctx, [[pg.title]])}
  ${pageHead(ctx, { title: pg.title })}
  <div class="wrap page-body">${out}</div>`;
  return page(ctx, { title: `${pg.title} | ${ctx.site.fullName}`, description: pg.description, canonical: `${ctx.site.url}/${pg.slug}/`, active: pg.slug, body });
};

// ---------- Tools ----------

const PROV_OPTS = (sel) => PROVINCE_NAMES.map((p) => `<option${p === sel ? ' selected' : ''}>${p}</option>`).join('');
const FREQS = ['Weekly (52 per year)', 'Every two weeks (26 per year)', 'Twice a month (24 per year)', 'Monthly (12 per year)'];
const num = (id, label, value, { step = 'any', min = 0, prefix = '$', note = '' } = {}) => `
  <div class="field"><label for="${id}">${label}</label><div class="input-affix">${prefix ? `<span>${prefix}</span>` : ''}<input id="${id}" type="number" inputmode="decimal" min="${min}" step="${step}" value="${value}" data-in="${id}"></div>${note ? `<p class="field__note" data-out="${id}-note">${note}</p>` : ''}</div>`;
const seg = (name, opts, on) => `<div class="seg" role="radiogroup">${opts.map(([v, l]) => `<label class="seg__opt"><input type="radio" name="${name}" value="${v}" data-in="${name}"${v === on ? ' checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
const disclaimer = (year) => `<div class="notice notice--warn" role="note"><span class="notice__mark" aria-hidden="true">!</span><p><strong>Example and reference only.</strong> This calculator produces illustrative estimates to help you plan, using published ${year} rates and simplified assumptions. Figures are not exact and must not be used to file, remit, or make financial commitments. Confirm every amount with the CRA, Revenu Québec, or your accountant before acting on it. Nothing here is tax, accounting, or financial advice.</p></div>`;

export const toolsPage = (ctx) => {
  const year = 2026;
  const tools = ctx.data.tools;
  const tabs = [['index', 'All tools'], ...tools.map((t) => [t.key, t.title.replace(/ (Calculator|Estimator|Forecaster)$/, '')])];
  const body = `
  <div class="tools-top"><div class="wrap wrap--tools tools-top__inner"><p>Free for Canadian small business owners — no sign-up, no email required</p><a href="${ctx.link('')}">← Back to CanadianSME</a></div></div>
  <header class="tools-head">
    <div class="wrap wrap--tools tools-head__inner">
      <a class="tools-brand" href="${ctx.link('tools/')}"><img src="${LOGO_DARK}?w=360&ssl=1" alt="CanadianSME" width="160" height="28"><span>Business Tools</span></a>
      <nav class="tools-tabs" aria-label="Calculators">${tabs.map(([k, l]) => `<a href="#${k}" data-tab="${k}">${esc(l)}</a>`).join('')}</nav>
    </div>
  </header>
  <main id="main" class="wrap wrap--tools tools" data-tools>
    <section class="tool-view" id="index" data-view="index" aria-labelledby="t-index">
      <p class="eyebrow">Free tools</p>
      <h1 class="h-page" id="t-index">Calculators Built for Canadian Rules</h1>
      <p class="page-head__text">Every calculator here uses published ${year} federal and provincial rates. Nothing is stored, and nothing asks for your email. Results are illustrative examples for reference only.</p>
      <div class="tiles tiles--4">${tools.map((t) => `<a class="tool-card" href="#${t.key}"><span class="tool-card__mark" aria-hidden="true">${esc(t.mark)}</span><span class="tile__title">${esc(t.title)}</span><span class="tile__text">${esc(t.desc)}</span><span class="tool-card__go">Open calculator →</span></a>`).join('')}</div>
      <div class="notice notice--warn" role="note"><span class="notice__mark" aria-hidden="true">!</span><p><strong>Example and reference only.</strong> These calculators are illustrative planning aids built on published ${year} federal and provincial rates. They use simplified assumptions, do not account for your full circumstances, and their results are not exact. Do not use them to file a return, remit deductions, or commit to financing. Confirm payroll amounts against the CRA Payroll Deductions Online Calculator, and check any figure with your accountant or the relevant tax authority before you act on it. Nothing here is tax, accounting, or financial advice.</p></div>
    </section>

    <section class="tool-view" id="gst" data-view="gst" aria-labelledby="t-gst">
      <p class="eyebrow">Sales tax</p>
      <h1 class="h-page" id="t-gst">GST/HST Calculator</h1>
      <p class="page-head__text">Work out what to charge, or back out the tax from a total you have already been paid. Covers GST, HST, and the provinces that run a separate PST, RST, or QST.</p>
      ${disclaimer(year)}
      <div class="calc">
        <form class="calc__form" data-calc="gst" onsubmit="return false">
          <div class="field"><label for="gst-prov">Province or territory</label><select id="gst-prov" data-in="gst-prov">${PROV_OPTS('Ontario')}</select></div>
          <fieldset class="field"><legend>Amount entered is</legend>${seg('gst-mode', [['add', 'Before tax'], ['remove', 'Tax included']], 'add')}</fieldset>
          ${num('gst-amount', 'Amount (CAD)', 1000)}
        </form>
        <div class="calc__out">
          <div class="result"><p class="result__label" data-out="gst-total-label">Total to charge the customer</p><p class="result__value" data-out="gst-total">$1,130.00</p><p class="result__note" data-out="gst-rate-note"></p></div>
          <h2 class="h-small">Breakdown</h2>
          <table class="table"><tbody data-out="gst-rows"></tbody></table>
          <p class="calc__guide" data-out="gst-guide"></p>
        </div>
      </div>
      <h2 class="h-small">Rates across Canada</h2>
      <div class="table-wrap"><table class="table table--striped"><thead><tr><th scope="col">Province / territory</th><th scope="col">System</th><th scope="col" class="num">Total rate</th></tr></thead><tbody data-out="gst-table"></tbody></table></div>
      <p class="calc__guide">You must register for GST/HST once your worldwide taxable revenue passes $30,000 in a single calendar quarter or over four consecutive quarters. Registering voluntarily below that threshold lets you claim input tax credits on your own purchases.</p>
    </section>

    <section class="tool-view" id="payroll" data-view="payroll" aria-labelledby="t-pay">
      <p class="eyebrow">Payroll</p>
      <h1 class="h-page" id="t-pay">Payroll Deductions Estimator</h1>
      <p class="page-head__text">Estimate CPP, EI, and income tax withheld per pay period, plus the employer contributions that land on top of the salary. Uses ${year} ceilings.</p>
      ${disclaimer(year)}
      <div class="calc">
        <form class="calc__form" data-calc="payroll" onsubmit="return false">
          <fieldset class="field"><legend>This employee is paid</legend>${seg('pay-basis', [['salary', 'Salary'], ['hourly', 'Hourly']], 'salary')}</fieldset>
          <div data-show-when="pay-basis=salary">${num('pay-gross', 'Annual gross salary (CAD)', 65000, { note: ' ' })}</div>
          <div class="field-pair" data-show-when="pay-basis=hourly" hidden>${num('pay-rate', 'Hourly rate', 24)}${num('pay-hours', 'Hours a week', 40, { prefix: '' })}</div>
          <div class="field"><label for="pay-prov">Province of employment</label><select id="pay-prov" data-in="pay-prov">${PROV_OPTS('Ontario')}</select></div>
          <div class="field"><label for="pay-freq">Pay frequency</label><select id="pay-freq" data-in="pay-freq">${FREQS.map((f, i) => `<option value="${[52, 26, 24, 12][i]}"${i === 1 ? ' selected' : ''}>${f}</option>`).join('')}</select></div>
          <p class="field__note">Assumes the basic personal amount only, no additional TD1 credits, no taxable benefits, and no employer pension or union deductions.</p>
        </form>
        <div class="calc__out">
          <div class="result-pair">
            <div class="result"><p class="result__label">Net pay per period</p><p class="result__value" data-out="pay-net"></p><p class="result__note" data-out="pay-period-note"></p><p class="result__note" data-out="pay-equiv"></p></div>
            <div class="result result--light"><p class="result__label">True cost to employer</p><p class="result__value" data-out="pay-employer"></p><p class="result__note" data-out="pay-employer-note"></p></div>
          </div>
          <h2 class="h-small">Per pay period</h2>
          <div class="table-wrap"><table class="table"><thead><tr><th scope="col">Item</th><th scope="col" class="num">Employee</th><th scope="col" class="num">Employer</th></tr></thead><tbody data-out="pay-rows"></tbody></table></div>
          <h2 class="h-small">${year} ceilings used</h2>
          <table class="table"><tbody data-out="pay-ceilings"></tbody></table>
          <p class="calc__guide" data-out="pay-remit"></p>
        </div>
      </div>
    </section>

    <section class="tool-view" id="cashflow" data-view="cashflow" aria-labelledby="t-cash">
      <p class="eyebrow">Cash flow</p>
      <h1 class="h-page" id="t-cash">13-Week Cash-Flow Forecaster</h1>
      <p class="page-head__text">A quarter is the horizon most owners can actually see. This projects your bank balance week by week and flags the week you run out — including the remittances that catch people off guard.</p>
      ${disclaimer(year)}
      <div class="calc">
        <form class="calc__form" data-calc="cash" onsubmit="return false">
          ${num('cash-open', 'Opening bank balance', 40000, { min: '' })}
          ${num('cash-in', 'Average weekly collections', 14000)}
          ${num('cash-out', 'Average weekly operating costs', 9000)}
          ${num('cash-pay', 'Payroll per run', 12000)}
          <div class="field"><label for="cash-freq">Payroll runs</label><select id="cash-freq" data-in="cash-freq"><option value="1">Weekly</option><option value="2" selected>Every two weeks</option><option value="2">Twice a month</option><option value="4">Monthly</option></select></div>
          ${num('cash-gst', 'Quarterly GST/HST remittance', 9500)}
          <div class="field-pair">${num('cash-oneoff', 'Other one-off cost', 0)}${num('cash-week', 'Week it lands', 6, { prefix: '', min: 1, step: 1 })}</div>
        </form>
        <div class="calc__out">
          <div class="result" data-out-box="cash-verdict"><p class="result__label">Lowest point in 13 weeks</p><p class="result__value" data-out="cash-low"></p><p class="result__note" data-out="cash-verdict"></p></div>
          <h2 class="h-small">Week by week</h2>
          <div class="table-wrap"><table class="table"><thead><tr><th scope="col">Week</th><th scope="col" class="num">In</th><th scope="col" class="num">Out</th><th scope="col" class="num">Balance</th></tr></thead><tbody data-out="cash-rows"></tbody></table></div>
          <p class="calc__guide">Remittances are money you collected on the government’s behalf, not revenue. If the forecast only works because the GST/HST sitting in your account hasn’t been remitted yet, the business is short — move it to a separate account and forecast without it.</p>
        </div>
      </div>
    </section>

    <section class="tool-view" id="loan" data-view="loan" aria-labelledby="t-loan">
      <p class="eyebrow">Financing</p>
      <h1 class="h-page" id="t-loan">Loan Payment Calculator</h1>
      <p class="page-head__text">Compare what the same borrowing costs as a term loan, an operating line, or equipment financing — and what each does to your monthly cash requirement.</p>
      ${disclaimer(year)}
      <div class="calc">
        <form class="calc__form" data-calc="loan" onsubmit="return false">
          ${num('loan-amt', 'Amount borrowed', 150000)}
          <div class="field"><label for="loan-rate">Annual interest rate — <span data-out="loan-rate-label">8.50%</span></label><input id="loan-rate" type="range" min="2" max="20" step="0.25" value="8.5" data-in="loan-rate"></div>
          <div class="field"><label for="loan-yrs">Term — <span data-out="loan-yrs-label">5 years</span></label><input id="loan-yrs" type="range" min="1" max="25" step="1" value="5" data-in="loan-yrs"></div>
          <fieldset class="field"><legend>Typical starting points</legend>
            <div class="presets">
              <button type="button" class="preset" data-preset="100000,8.5,5"><strong>BDC small business loan</strong><span>$100,000 over 5 years, around 8.5%</span></button>
              <button type="button" class="preset" data-preset="250000,7.25,7"><strong>Equipment purchase</strong><span>$250,000 over 7 years, around 7.25%</span></button>
              <button type="button" class="preset" data-preset="50000,10.5,3"><strong>Working capital top-up</strong><span>$50,000 over 3 years, around 10.5%</span></button>
            </div>
          </fieldset>
        </form>
        <div class="calc__out">
          <div class="result"><p class="result__label">Monthly payment</p><p class="result__value" data-out="loan-monthly"></p>
            <div class="result__split"><p><span>Total interest</span><strong data-out="loan-interest"></strong></p><p><span>Total repaid</span><strong data-out="loan-total"></strong></p></div></div>
          <h2 class="h-small">Same money, three structures</h2>
          <div class="table-wrap"><table class="table"><thead><tr><th scope="col">Structure</th><th scope="col" class="num">Monthly</th><th scope="col" class="num">Interest cost</th></tr></thead><tbody data-out="loan-compare"></tbody></table></div>
          <h2 class="h-small">Before you sign</h2>
          <ul class="arrows">
            <li>Ask for the total cost of borrowing in dollars, not just the rate — setup fees, standby charges, and insurance are often quoted separately.</li>
            <li>Check the prepayment terms. Some term loans charge three months of interest to pay out early, which matters if you expect a strong year.</li>
            <li>Confirm whether a personal guarantee is required, and for how much. This is the single most consequential clause for an owner-operator.</li>
            <li>Run the payment against your worst quarter, not your average one. Debt service is due whether the season cooperates or not.</li>
            <li>If the rate is variable, model it two points higher before you sign.</li>
          </ul>
        </div>
      </div>
    </section>
  </main>
  <footer class="tools-foot">
    <div class="wrap wrap--tools">
      <p><strong>CanadianSME Business Tools.</strong> For example and reference only. Illustrative estimates based on published ${year} federal and provincial rates, using simplified assumptions — not exact figures. Do not use them to file, remit, or commit to financing. Confirm payroll amounts against the CRA Payroll Deductions Online Calculator and check any figure with your accountant. Not tax, accounting, or financial advice.</p>
      <nav aria-label="Tools">${tools.map((t) => `<a href="#${t.key}">${esc(t.title)}</a>`).join('')}</nav>
      <p>Published by Cmarketing Inc., Mississauga, Ontario. · <a href="${ctx.link('')}">CanadianSME home</a></p>
    </div>
  </footer>`;
  return `${headTags(ctx, { title: 'Free Small Business Calculators | CanadianSME', description: 'Free GST/HST, payroll, cash-flow and loan calculators built for Canadian rules.', canonical: `${ctx.site.url}/tools/` })}
<body class="is-tools"${rootAttrs(ctx)}>
<a class="skip" href="#main">Skip to content</a>
${body}
<script src="${ctx.link('assets/tools.js')}?v=${ctx.version}" defer></script>
</body>
</html>`;
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
      <p class="notfound__code" aria-hidden="true">404</p>
      <h1 class="h-page">We couldn’t find that page</h1>
      <p class="page-head__text">It may have moved when we redesigned the site. Try searching, or start from the homepage.</p>
      <div class="btn-row">
        <a class="btn btn--primary" href="${ctx.link('')}">Back to homepage</a>
        <a class="btn btn--secondary" href="${ctx.link('search/')}">Search the site</a>
      </div>
    </section>`,
  });

export { full };
