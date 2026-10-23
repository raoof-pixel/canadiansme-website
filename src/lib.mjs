// Small helpers shared by the templates. No dependencies.

export const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Jetpack image CDN (i0.wp.com) resizes on the fly with ?w=
const UPLOADS = 'https://i0.wp.com/canadiansme.ca/wp-content/uploads/';
export const full = (url) => (/^https?:/.test(url) ? url : UPLOADS + url);
export const img = (url, w) => `${full(url)}?w=${w}&ssl=1`;

export const srcset = (url, widths = [480, 800, 1200]) =>
  widths.map((w) => `${img(url, w)} ${w}w`).join(', ');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const shortDate = (iso) => {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

export const longDate = (iso) => {
  const d = new Date(iso);
  return `${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

export const readingTime = (html = '') => {
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
};

// Builds relative links so the site works from any folder or host.
// depth = how many folders deep the current page is.
export const makeLinker = (depth, { indexLinks = false } = {}) => {
  const up = '../'.repeat(depth);
  return (path = '') => {
    if (/^https?:/.test(path)) return path;
    if (path === '' || path === '/') return up + (indexLinks ? 'index.html' : '') || './';
    const clean = path.replace(/^\//, '');
    if (clean.endsWith('/')) return up + clean + (indexLinks ? 'index.html' : '');
    return up + clean;
  };
};
