# Umrah, Step by Step

An illustrated, step-by-step guide to performing Umrah, live at **https://umrahhaj.com**.

It is available in five languages:

| Language | URL |
|---|---|
| English (default) | https://umrahhaj.com/ |
| Français | https://umrahhaj.com/fr/ |
| Deutsch | https://umrahhaj.com/de/ |
| Español | https://umrahhaj.com/es/ |
| العربية | https://umrahhaj.com/ar/ (right-to-left) |

## How it is built

Each language is a plain static page generated from one template:

```
src/template.html    the page: HTML, CSS and JS, with {{keys}} where text goes
i18n/en.json         English text (the reference; every language has exactly the same keys)
i18n/fr.json, de.json, es.json, ar.json
build.mjs            writes index.html, fr/, de/, es/, ar/ and sitemap.xml
```

**Do not edit `index.html` or the language folders directly.** They are overwritten by the build.

To change text or layout:

1. Edit `src/template.html` or the files in `i18n/`.
2. Run `node build.mjs`. It stops with an error if a language is missing a key, a placeholder like `{n}` doesn't match, or a `{{key}}` is left unreplaced.
3. Commit everything, including the generated pages, and push to `main`. Vercel deploys automatically.

The Arabic du'as and Qur'an verses live in the template, so they are identical in every language.

## Run locally

The pages use root paths (`/favicon.svg`), so serve the folder rather than opening the file:

```sh
python -m http.server 8000    # then open http://localhost:8000/
```

## Support

The guide is free with no ads. To support it, use the donation links on the site.
Questions or corrections: info@baamiis.co.uk
