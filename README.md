# Umrah & Hajj, Step by Step

Illustrated, step-by-step guides to performing Umrah and Hajj, live at **https://umrahhaj.com**.

| Page | English (default) | Other languages |
|---|---|---|
| Home: choose a guide | `/` | `/fr/` `/de/` `/es/` `/ar/` |
| Umrah guide (6 steps) | `/umrah/` | `/fr/umrah/` … `/ar/umrah/` |
| Hajj guide (8 steps) | `/hajj/` | `/fr/hajj/` … `/ar/hajj/` |

Arabic pages are right-to-left. Each step has its own link, for example `/hajj/#arafah` or `/fr/umrah/#tawaf`.

## How it is built

Every page is plain static HTML, generated from templates:

```
src/home.html, src/umrah.html, src/hajj.html   one template per page, with {{keys}} where text goes
src/partials/                                  pieces shared by all pages: head, CSS, top bar,
                                               support section, footer, core.js, guide.js (step navigation)
i18n/common/<lang>.json                        text shared by all pages (site name, menu, donations, buttons)
i18n/home|umrah|hajj/<lang>.json               text for each page
build.mjs                                      writes all 15 pages and sitemap.xml
```

**Do not edit the generated `index.html` files** (at `/`, in `umrah/`, `hajj/` and the language folders). They are overwritten by the build.

To change text or layout:

1. Edit a template in `src/` or a text file in `i18n/`. English is the reference: every language must have exactly the same keys.
2. Run `node build.mjs`. It stops with an error if a language is missing a key, a placeholder like `{n}` doesn't match, or a `{{key}}` is left unreplaced.
3. Commit everything, including the generated pages, and push to `main`. Vercel deploys automatically.

The Arabic du'as and Qur'an verses live in the templates, so they are identical in every language.

The Google Search Console verification tag is added to the English home page by `build.mjs`. Keep it.

## Run locally

The pages use root paths (`/favicon.svg`), so serve the folder rather than opening the files:

```sh
python -m http.server 8000    # then open http://localhost:8000/
```

## Support

The guides are free with no ads. To support them, use the donation links on the site.
Questions or corrections: info@baamiis.co.uk
