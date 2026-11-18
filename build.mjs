// Builds one static page per language from src/template.html + i18n/<lang>.json.
//   node build.mjs
// Output (committed, served as-is by Vercel): index.html (English), fr/, de/, es/, ar/ and sitemap.xml.
import fs from 'fs';
import path from 'path';

const SITE = 'https://umrahhaj.com';
const LANGS = [
  { code: 'en', name: 'English',  short: 'EN', dir: 'ltr', path: '/',    locale: 'en_GB' },
  { code: 'fr', name: 'Français', short: 'FR', dir: 'ltr', path: '/fr/', locale: 'fr_FR' },
  { code: 'de', name: 'Deutsch',  short: 'DE', dir: 'ltr', path: '/de/', locale: 'de_DE' },
  { code: 'es', name: 'Español',  short: 'ES', dir: 'ltr', path: '/es/', locale: 'es_ES' },
  { code: 'ar', name: 'العربية',  short: 'ع',  dir: 'rtl', path: '/ar/', locale: 'ar_AR' },
];
const BASE_FONTS = 'family=Amiri:wght@400;700&family=Reem+Kufi:wght@500;700&family=Source+Sans+3:wght@400;600';
const AR_FONTS = '&family=IBM+Plex+Sans+Arabic:wght@400;600';
const VERIFY = '<meta name="google-site-verification" content="ylQwtzN4r6WZ7ARziccwIyn72u5d4ryJ4R2BWqnxjAA">';

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const template = fs.readFileSync(path.join(root, 'src/template.html'), 'utf8');
const load = code => JSON.parse(fs.readFileSync(path.join(root, `i18n/${code}.json`), 'utf8'));
const en = load('en');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fail = msg => { console.error('BUILD FAILED: ' + msg); process.exit(1); };

const alternates = LANGS.map(l => `<link rel="alternate" hreflang="${l.code}" href="${SITE}${l.path}">`).join('\n')
  + `\n<link rel="alternate" hreflang="x-default" href="${SITE}/">`;

const only = process.env.ONLY ? process.env.ONLY.split(',') : null;   // e.g. ONLY=en while drafting
for (const L of LANGS.filter(l => !only || only.includes(l.code))) {
  const t = load(L.code);
  // Every language must have exactly the English keys, all non-empty.
  const missing = Object.keys(en).filter(k => !(k in t)), extra = Object.keys(t).filter(k => !(k in en));
  if (missing.length || extra.length) fail(`${L.code}.json missing [${missing}] extra [${extra}]`);
  for (const [k, v] of Object.entries(t)) if (typeof v !== 'string' || !v.trim()) fail(`${L.code}.json "${k}" is empty`);
  // Placeholders like {n} must match English.
  for (const k of Object.keys(en)) {
    const ph = s => (s.match(/\{\w+\}/g) || []).sort().join();
    if (ph(en[k]) !== ph(t[k])) fail(`${L.code}.json "${k}" placeholders differ from English`);
  }

  const js = Object.fromEntries(Object.entries(t).filter(([k]) => k.startsWith('js.')).map(([k, v]) => [k.slice(3), v]));
  const menu = `<details class="lang"><summary aria-label="${esc(t.langLabel)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>${L.short}</summary><ul>`
    + LANGS.map(o => `<li><a href="${o.path}" hreflang="${o.code}" lang="${o.code}"${o.code === L.code ? ' aria-current="true"' : ''}>${o.name}</a></li>`).join('')
    + '</ul></details>';
  const seo = [
    `<link rel="canonical" href="${SITE}${L.path}">`,
    L.code === 'en' ? VERIFY : '',
    alternates,
    `<meta property="og:url" content="${SITE}${L.path}">`,
    `<meta property="og:locale" content="${L.locale}">`,
    ...LANGS.filter(o => o !== L).map(o => `<meta property="og:locale:alternate" content="${o.locale}">`),
  ].filter(Boolean).join('\n');
  const fonts = `<link href="https://fonts.googleapis.com/css2?${BASE_FONTS}${L.code === 'ar' ? AR_FONTS : ''}&display=swap" rel="stylesheet">`;

  let out = template
    .replace('{{@seo}}', seo).replace('{{@fonts}}', fonts).replace('{{@langMenu}}', menu)
    .replace('{{@js}}', JSON.stringify(js).replace(/</g, '\\u003c'))
    .replace(/\{\{@lang\}\}/g, L.code).replace(/\{\{@dir\}\}/g, L.dir)
    .replace(/\{\{([\w.]+)\}\}/g, (m, k) => { if (!(k in t)) fail(`template key {{${k}}} not in ${L.code}.json`); return esc(t[k]); });
  if (out.includes('{{')) fail(`unreplaced placeholder in ${L.code}: ` + out.slice(out.indexOf('{{'), out.indexOf('{{') + 40));

  const file = path.join(root, L.path, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, out);
  console.log(`${L.code}  ${L.path}index.html  ${Math.round(out.length / 1024)} KB`);
}

// Sitemap with language alternates
const today = new Date().toISOString().slice(0, 10);
const xhtml = LANGS.map(l => `    <xhtml:link rel="alternate" hreflang="${l.code}" href="${SITE}${l.path}"/>`).join('\n')
  + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/"/>`;
fs.writeFileSync(path.join(root, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`
  + LANGS.map(l => `  <url>\n    <loc>${SITE}${l.path}</loc>\n    <lastmod>${today}</lastmod>\n${xhtml}\n  </url>`).join('\n')
  + '\n</urlset>\n');
console.log('sitemap.xml');
