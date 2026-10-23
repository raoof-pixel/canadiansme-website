// Builds the static site into ./dist from the files in ./content.
// Usage: node build.mjs            (pretty links: /slug/)
//        node build.mjs --index     (links end in index.html, for file previews)
import { readFile, writeFile, mkdir, rm, cp, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeLinker, readingTime } from './src/lib.mjs';
import { loadFromCMS } from './src/cms.mjs';
import { refreshHomepage } from './src/homepage.mjs';
import * as t from './src/templates.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, 'dist');
const indexLinks = process.argv.includes('--index');

const readJSON = async (p) => JSON.parse(await readFile(join(root, p), 'utf8'));

const site = await readJSON('content/site.json');
let categoriesList = await readJSON('content/categories.json');
let authorsList = [...(await readJSON('content/authors.json')), ...(await readJSON('content/authors-more.json'))];
let rawPosts = [...(await readJSON('content/posts.json')), ...(await readJSON('content/posts-more.json'))];
const home = await readJSON('content/homepage.json');
const pages = await readJSON('content/pages.json');

// Live content from the CMS when CMS_URL is set (see src/cms.mjs); otherwise the JSON files above.
const CMS_URL = process.env.CMS_URL;
let cmsBodies = null;
if (CMS_URL) {
  const cms = await loadFromCMS({
    base: CMS_URL,
    localCategories: categoriesList,
    localAuthors: authorsList,
    maxPosts: Number(process.env.CMS_MAX_POSTS) || 1500,
  });
  ({ categoriesList, authorsList } = cms);
  rawPosts = cms.posts;
  cmsBodies = cms.bodies;
}

const seenSlugs = new Set();
for (const p of rawPosts) {
  if (seenSlugs.has(p.slug)) throw new Error(`Duplicate post slug: ${p.slug}`);
  seenSlugs.add(p.slug);
}

const categories = Object.fromEntries(categoriesList.map((c) => [c.slug, c]));
const authors = Object.fromEntries(authorsList.map((a) => [a.slug, a]));

// Load bodies and sort newest first.
const bodies = {};
const posts = [];
for (const [i, p] of rawPosts.entries()) {
  if (!categories[p.category]) throw new Error(`Unknown category "${p.category}" on ${p.slug}`);
  if (!authors[p.author]) throw new Error(`Unknown author "${p.author}" on ${p.slug}`);
  let html = '';
  if (cmsBodies) {
    html = cmsBodies[p.slug] || '';
  } else if (p.body) {
    const file = join(root, 'content/articles', `${p.body}.html`);
    if (!existsSync(file)) throw new Error(`Missing body file ${file}`);
    html = await readFile(file, 'utf8');
  }
  bodies[p.slug] = html;
  posts.push({ ...p, id: i + 1, readingTime: p.readingTime || (html ? readingTime(html) : 2) });
}
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

const byCategory = Object.fromEntries(categoriesList.map((c) => [c.slug, posts.filter((p) => p.category === c.slug)]));
const featured = [...posts.filter((p) => p.featured), ...posts.filter((p) => !p.featured && p.category !== 'latest-news')];
const now = new Date(posts[0].date);

const searchIndex = posts.map((p) => ({ s: p.slug, t: p.title, c: categories[p.category].name }));

const postsBySlug = Object.fromEntries(posts.map((p) => [p.slug, p]));
if (CMS_URL) refreshHomepage(home, { posts, postsBySlug, byCategory, featured });
// Changes on every build so browsers and CDNs never mix new pages with old CSS/JS.
const version = Date.now().toString(36);
const base = { version, site, categories, authors, posts, postsBySlug, byCategory, featured, latest: posts, now, searchIndex, home };

async function emit(path, render) {
  const depth = path.split('/').length - 1;
  const ctx = { ...base, link: makeLinker(depth, { indexLinks }), depth };
  const file = join(out, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, render(ctx));
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

await emit('index.html', (ctx) => t.home(ctx));
for (const p of posts) await emit(`${p.slug}/index.html`, (ctx) => t.article(ctx, p, bodies[p.slug]));
for (const c of categoriesList) await emit(`category/${c.slug}/index.html`, (ctx) => t.category(ctx, c));
for (const a of authorsList) await emit(`author/${a.slug}/index.html`, (ctx) => t.authorPage(ctx, a));
for (const pg of pages) {
  const html = await readFile(join(root, 'content/pages', `${pg.file}.html`), 'utf8');
  await emit(`${pg.slug}/index.html`, (ctx) => t.staticPage(ctx, pg, html));
}
await emit('404.html', (ctx) => t.notFound(ctx));
// Template the CMS fills in to show unpublished drafts in the real site design (Preview button).
await emit('_preview/index.html', (ctx) => t.previewTemplate(ctx));
// Search index as its own file (cached once) instead of inside every page.
await mkdir(join(out, 'assets'), { recursive: true });
await writeFile(join(out, 'assets', 'search-index.js'), `window.__SEARCH_INDEX__=${JSON.stringify(searchIndex)};`);

// SEO files
const urls = [
  `${site.url}/`,
  ...pages.map((p) => `${site.url}/${p.slug}/`),
  ...posts.map((p) => `${site.url}/${p.slug}/`),
  ...categoriesList.map((c) => `${site.url}/category/${c.slug}/`),
  ...authorsList.map((a) => `${site.url}/author/${a.slug}/`),
];
await writeFile(
  join(out, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`
);
// SITE_NOINDEX=1 keeps test copies of the site out of Google.
await writeFile(
  join(out, 'robots.txt'),
  process.env.SITE_NOINDEX ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`
);

await cp(join(root, 'public'), join(out, 'assets'), { recursive: true });

const count = (await readdir(out, { recursive: true })).filter((f) => f.endsWith('.html')).length;
console.log(`Built ${count} pages into dist/${indexLinks ? ' (index.html links)' : ''}`);
