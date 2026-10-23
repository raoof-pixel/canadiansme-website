// Keeps the homepage fresh when the site is built from the CMS.
//
// content/homepage.json still decides the layout (sections, ads, magazines, podcast) and the
// hand-picked stories. On top of that:
//   - "featured-row" and the "Around CanadianSME" sidebar always show the newest articles,
//   - a carousel or list with a "View all" category link shows that category's newest articles,
//   - any hand-picked story that no longer exists (unpublished, renamed) is swapped for a
//     recent one instead of breaking the build.

const catFrom = (more) => (more || '').match(/^category\/([^/]+)\/?$/)?.[1];

export function refreshHomepage(home, { posts, postsBySlug, byCategory, featured }) {
  const used = new Set();
  const take = (pool, n) => {
    const out = [];
    for (const p of pool) {
      if (out.length >= n) break;
      if (!used.has(p.slug)) {
        out.push(p.slug);
        used.add(p.slug);
      }
    }
    return out;
  };
  // Last resort on a small archive: reuse stories already shown elsewhere rather than leave a gap.
  const fill = (list, n) => {
    for (const p of posts) {
      if (list.length >= n) break;
      if (!list.includes(p.slug)) list.push(p.slug);
    }
    return list;
  };
  // Hand-picked slugs that still exist, topped up from `pool` to the original length.
  const keep = (list = [], pool = posts) => {
    const ok = list.filter((s) => postsBySlug[s]);
    ok.forEach((s) => used.add(s));
    return fill([...ok, ...take(pool, list.length - ok.length)], list.length);
  };
  const fresh = (list = [], pool) => {
    const n = list.length;
    const out = take(pool, n);
    return out.length < n ? fill([...out, ...keep(list.filter((s) => !out.includes(s))).slice(0, n - out.length)], n) : out;
  };

  for (const s of home.sections) {
    switch (s.type) {
      case 'hero':
        s.slides = s.slides.filter((sl) => {
          if (sl.kind !== 'story') return true;
          if (postsBySlug[sl.post]) return used.add(sl.post), true;
          const [next] = take(featured, 1);
          if (next) sl.post = next;
          return Boolean(next);
        });
        break;
      case 'featured-row':
        s.posts = fresh(s.posts, featured);
        break;
      case 'main-sidebar':
        s.rows = keep(s.rows, byCategory[catFrom(s.more)] || posts);
        s.side = fresh(s.side, posts);
        break;
      case 'carousel': {
        const cat = byCategory[catFrom(s.more)];
        s.posts = cat ? fresh(s.posts, cat) : keep(s.posts);
        break;
      }
      case 'two-col-lists':
        for (const b of s.blocks) {
          const cat = byCategory[catFrom(b.more)];
          b.posts = cat ? fresh(b.posts, cat) : keep(b.posts);
        }
        break;
      default:
        if (Array.isArray(s.posts)) s.posts = keep(s.posts);
        if (Array.isArray(s.rows)) s.rows = keep(s.rows);
        if (Array.isArray(s.side)) s.side = keep(s.side);
    }
  }
  return home;
}
