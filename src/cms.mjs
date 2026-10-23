// Loads articles, categories and authors from the CanadianSME CMS (Payload) at build time.
//
// Turned on by setting CMS_URL, e.g. CMS_URL=https://canadiansme-cms.vercel.app
// Without CMS_URL the site builds from the JSON files in ./content as before.
//
// Options (environment variables):
//   CMS_MAX_POSTS   newest N published articles to build (default 1500)
//
// If CMS_URL is set but the CMS can't be reached, the build fails on purpose, so the
// last good version of the website stays online instead of an empty one.
import { lexicalToHtml } from './lexical.mjs';

const WP_UPLOADS = /^https?:\/\/(?:i\d\.wp\.com\/)?(?:www\.)?canadiansme\.ca\/wp-content\/uploads\//i;
const FALLBACK_IMAGE = '2021/03/Magazine-dark-logo.png';
// The CMS calls the house byline "admin" (its WordPress username); the website uses "canadiansme".
const AUTHOR_ALIASES = { admin: 'canadiansme' };

const get = async (base, path, tries = 3) => {
  const url = `${base}/api/${path}`;
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' } });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      if (i >= tries) throw new Error(`CMS request failed (${url}): ${err.message}`);
      await new Promise((r) => setTimeout(r, 1000 * i));
    }
  }
};

const all = async (base, collection, query, max = Infinity, perPage = 100) => {
  const docs = [];
  for (let page = 1; docs.length < max; page++) {
    const res = await get(base, `${collection}?${query}&limit=${perPage}&page=${page}`);
    docs.push(...res.docs);
    if (!res.hasNextPage) break;
  }
  return docs.slice(0, max);
};

const abs = (base, url) => (!url ? '' : /^https?:/.test(url) ? url : `${base}${url.startsWith('/') ? '' : '/'}${url}`);

// WordPress images go through the Jetpack image CDN (resized on the fly); new uploads are served
// from the CMS's own storage.
const imageOf = (base, media) => {
  if (!media || typeof media !== 'object') return FALLBACK_IMAGE;
  if (media.wpUrl && WP_UPLOADS.test(media.wpUrl)) return media.wpUrl.replace(WP_UPLOADS, '');
  return abs(base, media.sizes?.large?.url || media.url) || FALLBACK_IMAGE;
};

const slugOf = (v) => (v && typeof v === 'object' ? v.slug : null);
const authorSlug = (s) => AUTHOR_ALIASES[s] || s;

export async function loadFromCMS({ base, localCategories, localAuthors, maxPosts }) {
  base = base.replace(/\/$/, '');
  const started = Date.now();

  const cmsPosts = await all(
    base,
    'posts',
    'depth=1&sort=-publishedAt&where[_status][equals]=published',
    maxPosts
  );
  if (!cmsPosts.length) throw new Error('The CMS returned no published articles.');

  const curated = new Map(localCategories.map((c) => [c.slug, c]));
  const categories = new Map(curated);
  const authors = new Map(localAuthors.map((a) => [a.slug, a]));

  const posts = [];
  const bodies = {};
  for (const p of cmsPosts) {
    if (!p.slug) continue;
    const cats = [p.primaryCategory, ...(p.categories || [])].filter((c) => c && typeof c === 'object');
    // Prefer a category the website already features in its navigation.
    const cat = cats.find((c) => curated.has(c.slug)) || cats[0];
    let category = 'latest-news';
    if (cat?.slug) {
      category = cat.slug;
      if (!categories.has(cat.slug)) categories.set(cat.slug, { slug: cat.slug, name: cat.title, description: cat.description || '' });
    }

    const a = (p.authors || []).find((x) => x && typeof x === 'object');
    let author = 'canadiansme';
    if (a?.slug) {
      author = authorSlug(a.slug);
      if (!authors.has(author)) authors.set(author, { slug: author, name: a.name, role: a.jobTitle || '', bio: a.bio || '' });
    }

    const html = p.useLegacyHtml && p.legacyHtml ? p.legacyHtml : lexicalToHtml(p.content) || p.legacyHtml || '';
    bodies[p.slug] = html;
    posts.push({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt || '',
      date: p.publishedAt || p.createdAt,
      category,
      author,
      image: imageOf(base, p.featuredImage),
      featured: Boolean(p.isFeatured),
      readingTime: p.readingTime || undefined,
      cmsId: p.id,
    });
  }

  // Only keep categories and authors that have something to show (plus the curated ones).
  const usedCats = new Set(posts.map((p) => p.category));
  const usedAuthors = new Set(posts.map((p) => p.author));
  const categoriesList = [...categories.values()].filter((c) => curated.has(c.slug) || usedCats.has(c.slug));
  const authorsList = [...authors.values()].filter((a) => usedAuthors.has(a.slug) || localAuthors.some((l) => l.slug === a.slug));

  console.log(`CMS: loaded ${posts.length} articles, ${categoriesList.length} categories, ${authorsList.length} authors in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  return { posts, bodies, categoriesList, authorsList };
}
