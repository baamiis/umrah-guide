// Builds one static page per (page, language) from src/<page>.html + i18n/{common,<page>}/<lang>.json.
//   node build.mjs
// Output (committed, served as-is by Vercel):
//   /            home (English)        /umrah/   /hajj/
//   /fr/ /de/ /es/ /ar/  home in that language, each with umrah/ and hajj/ below it
//   sitemap.xml
// Templates can include src/partials/<name> with {{>name}}, and use {{key}} for text.
import fs from 'fs';
import path from 'path';

const SITE = 'https://umrahhaj.com';
const LANGS = [
  { code: 'en', name: 'English',  short: 'EN', dir: 'ltr', base: '/',    locale: 'en_GB' },
  { code: 'fr', name: 'Français', short: 'FR', dir: 'ltr', base: '/fr/', locale: 'fr_FR' },
  { code: 'de', name: 'Deutsch',  short: 'DE', dir: 'ltr', base: '/de/', locale: 'de_DE' },
  { code: 'es', name: 'Español',  short: 'ES', dir: 'ltr', base: '/es/', locale: 'es_ES' },
  { code: 'ar', name: 'العربية',  short: 'ع',  dir: 'rtl', base: '/ar/', locale: 'ar_AR' },
];
const PAGES = [
  { id: 'home',  sub: '',       og: 'og-home.png' },
  { id: 'umrah', sub: 'umrah/', og: 'og-image.png' },
  { id: 'hajj',  sub: 'hajj/',  og: 'og-hajj.png' },
];
const BASE_FONTS = 'family=Amiri:wght@400;700&family=Reem+Kufi:wght@500;700&family=Source+Sans+3:wght@400;600';
const AR_FONTS = '&family=IBM+Plex+Sans+Arabic:wght@400;600';
// Google Search Console checks this tag on https://umrahhaj.com/ — it must stay on the English home page.
const VERIFY = '<meta name="google-site-verification" content="ylQwtzN4r6WZ7ARziccwIyn72u5d4ryJ4R2BWqnxjAA">';

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const json = p => JSON.parse(read(p));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fail = msg => { console.error('BUILD FAILED: ' + msg); process.exit(1); };
const url = (L, P) => `${SITE}${L.base}${P.sub}`;

function includePartials(src, depth = 0){
  if (depth > 5) fail('partials nested too deeply');
  return src.replace(/\{\{>([\w.-]+)\}\}/g, (m, name) => includePartials(read(`src/partials/${name}`), depth + 1));
}

// Text for one page in one language = common + page dictionary (no key may be in both).
function dict(page, code){
  const c = json(`i18n/common/${code}.json`), p = json(`i18n/${page}/${code}.json`);
  for (const k of Object.keys(p)) if (k in c) fail(`"${k}" is in both i18n/common/${code}.json and i18n/${page}/${code}.json`);
  return { ...c, ...p };
}

const onlyPages = process.env.PAGES ? process.env.PAGES.split(',') : null;   // e.g. PAGES=umrah while drafting
const onlyLangs = process.env.ONLY ? process.env.ONLY.split(',') : null;
const built = [];

for (const P of PAGES.filter(p => !onlyPages || onlyPages.includes(p.id))) {
  const template = includePartials(read(`src/${P.id}.html`));
  const en = dict(P.id, 'en');
  const alternates = LANGS.map(l => `<link rel="alternate" hreflang="${l.code}" href="${url(l, P)}">`).join('\n')
    + `\n<link rel="alternate" hreflang="x-default" href="${url(LANGS[0], P)}">`;

  for (const L of LANGS.filter(l => !onlyLangs || onlyLangs.includes(l.code))) {
    const t = dict(P.id, L.code);
    // Every language must have exactly the English keys, all non-empty, with the same {placeholders}.
    const missing = Object.keys(en).filter(k => !(k in t)), extra = Object.keys(t).filter(k => !(k in en));
    if (missing.length || extra.length) fail(`${P.id}/${L.code}: missing [${missing}] extra [${extra}]`);
    for (const [k, v] of Object.entries(t)) if (typeof v !== 'string' || !v.trim()) fail(`${P.id}/${L.code} "${k}" is empty`);
    const ph = s => (s.match(/\{\w+\}/g) || []).sort().join();
    for (const k of Object.keys(en)) if (ph(en[k]) !== ph(t[k])) fail(`${P.id}/${L.code} "${k}" placeholders differ from English`);

    const js = Object.fromEntries(Object.entries(t).filter(([k]) => k.startsWith('js.')).map(([k, v]) => [k.slice(3), v]));
    const menu = `<details class="lang"><summary aria-label="${esc(t.langLabel)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>${L.short}</summary><ul>`
      + LANGS.map(o => `<li><a href="${o.base}${P.sub}" hreflang="${o.code}" lang="${o.code}"${o.code === L.code ? ' aria-current="true"' : ''}>${o.name}</a></li>`).join('')
      + '</ul></details>';
    const seo = [
      `<link rel="canonical" href="${url(L, P)}">`,
      L.code === 'en' && P.id === 'home' ? VERIFY : '',
      alternates,
      `<meta property="og:url" content="${url(L, P)}">`,
      `<meta property="og:locale" content="${L.locale}">`,
      ...LANGS.filter(o => o !== L).map(o => `<meta property="og:locale:alternate" content="${o.locale}">`),
    ].filter(Boolean).join('\n');
    const fonts = `<link href="https://fonts.googleapis.com/css2?${BASE_FONTS}${L.code === 'ar' ? AR_FONTS : ''}&display=swap" rel="stylesheet">`;

    const out = template
      .replace('{{@seo}}', seo).replace('{{@fonts}}', fonts).replace('{{@langMenu}}', menu)
      .replace('{{@js}}', JSON.stringify(js).replace(/</g, '\\u003c'))
      .replace(/\{\{@lang\}\}/g, L.code).replace(/\{\{@dir\}\}/g, L.dir).replace(/\{\{@page\}\}/g, P.id)
      .replace(/\{\{@base\}\}/g, L.base).replace(/\{\{@ogImage\}\}/g, P.og)
      .replace(/\{\{([\w.]+)\}\}/g, (m, k) => { if (!(k in t)) fail(`{{${k}}} in src/${P.id}.html is not in the ${L.code} text`); return esc(t[k]); });
    if (out.includes('{{')) fail(`unreplaced placeholder in ${P.id}/${L.code}: ` + out.slice(out.indexOf('{{'), out.indexOf('{{') + 40));
    if (!fs.existsSync(path.join(root, P.og))) fail(`missing share image ${P.og}`);

    const file = path.join(root, L.base, P.sub, 'index.html');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, out);
    built.push({ L, P });
    console.log(`${(L.base + P.sub).padEnd(12)} ${Math.round(out.length / 1024)} KB`);
  }
}

// Sitemap: every page in every language, each listing its language alternates
if (!onlyPages && !onlyLangs) {
  const today = new Date().toISOString().slice(0, 10);
  const entries = PAGES.flatMap(P => LANGS.map(L => {
    const alts = LANGS.map(o => `    <xhtml:link rel="alternate" hreflang="${o.code}" href="${url(o, P)}"/>`).join('\n')
      + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${url(LANGS[0], P)}"/>`;
    return `  <url>\n    <loc>${url(L, P)}</loc>\n    <lastmod>${today}</lastmod>\n${alts}\n  </url>`;
  }));
  fs.writeFileSync(path.join(root, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`);
  console.log(`sitemap.xml  ${entries.length} URLs`);
}
