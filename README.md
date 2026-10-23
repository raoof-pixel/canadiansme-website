# CanadianSME website

A new front end for [canadiansme.ca](https://canadiansme.ca), built to replace the WordPress theme. Layout inspired by the Presspoint news template on Webflow, redesigned for CanadianSME.

This is a **preview build** that mirrors the live homepage: the same sections, articles, magazine issues and sponsor ads, plus the About, Contact, UPS Small Business, Podcast, Subscribe and Start-up stories pages. About 95 articles were pulled read-only from WordPress (9 with full text). The live site has not been changed.

## Run it

Needs Node 20 or newer. No packages to install.

```bash
npm run dev        # builds and serves at http://localhost:4321
npm run build      # builds the site into dist/
```

## What's here

| Path | What it is |
| --- | --- |
| `content/posts.json` | Articles: title, slug, date, category, author, image, excerpt |
| `content/articles/*.html` | Full article bodies (referenced by `body` in posts.json) |
| `content/categories.json` | Sections and their descriptions |
| `content/authors.json` | Author names, roles and bios |
| `content/site.json` | Site name, navigation, contact details, social links |
| `content/homepage.json` | Homepage sections in order, magazine issues, sponsor ads and partners |
| `content/pages.json`, `content/pages/*.html` | About, Contact, UPS Small Business, Podcast, Subscribe, Start-up stories |
| `content/posts-more.json`, `content/authors-more.json` | Articles and authors used on the homepage |
| `src/templates.mjs` | Page templates: home, article, category, author, 404 |
| `public/styles.css` | Design system and all styles |
| `public/app.js` | Search, mobile menu, reading progress, sticky header |
| `build.mjs` | Turns the content folder into static pages in `dist/` |

## Pages

- **Home**: lead story with top stories, today's business news, interviews, section blocks (Leadership, Finance, Technology, Marketing), women entrepreneurs, newsletter.
- **Article**: `/<slug>/`, the same URL as WordPress, so no redirects are needed when we switch.
- **Section**: `/category/<slug>/`, matching WordPress category URLs.
- **Author**: `/author/<slug>/`, indexable author pages.
- Search (press `/`), sitemap.xml, robots.txt, NewsArticle schema, Open Graph and large Twitter cards on every article.

## Design

- Colours: ink navy `#15233B`, glacier `#F2F5F8`, maple red `#C8102E` (used sparingly).
- Type: Newsreader for headlines and reading, Hanken Grotesk for the interface.
- Motion: smooth cross-page transitions where article images glide into the article page (Chrome, Edge, Safari 18+), soft hover easing, reduced-motion respected.

## Next steps

1. Review the design and pick any changes.
2. Add the admin panel (planned: Payload CMS), so the team can write and publish articles. The templates read from one content layer, so the CMS replaces the JSON files without touching the design.
3. Import all ~8,750 posts, authors and media from WordPress.
4. Host (for example Vercel or Cloudflare Pages) and switch the domain.

## Live content from the CMS

Set `CMS_URL` (e.g. `https://canadiansme-cms.vercel.app`) and the build reads published articles,
categories and authors from the CanadianSME CMS instead of `content/*.json`:

- `CMS_URL` – the CMS address. Without it the site builds from the JSON files as before.
- `CMS_MAX_POSTS` – newest N articles to build (default 1500).
- `SITE_NOINDEX=1` – keeps a test copy out of Google (robots.txt disallows everything).

`content/homepage.json` still controls the homepage layout and hand-picked stories; the featured
row, the "Around CanadianSME" sidebar and category carousels fill themselves with the newest
articles (see `src/homepage.mjs`). Static pages (About, Contact, …) still come from `content/pages`.

The build also writes `/_preview/`, a template the CMS uses to show drafts in the site design.
On Vercel, a Deploy Hook set as `FRONTEND_REVALIDATE_URL` in the CMS rebuilds the site whenever
an article is published, changed or unpublished.
