# Vwin Landing Pages (RAK)

Static landing pages for MY, SG, and VN. Built from one template, config, and locale files.

## Structure

```
config/site.json       Market settings, cache-bust version, product lists
locales/               Copy per market + language (edit these)
src/index.template.html
src/input.css          Tailwind source
src/js/                Site scripts
assets/                Shared images only
dist/                  Generated output (gitignored, wiped every build)
```

## Commands

```sh
npm install
npm run build          # clean dist/ and rebuild all markets
npm run build:bump     # bump assetVersion in config, then build
npm run dev            # build + local preview servers
```

Preview URLs after `npm run dev`:

- MY: http://127.0.0.1:4174/
- SG: http://127.0.0.1:4175/
- VN: http://127.0.0.1:4176/

## Edit copy

| Market | Files |
|--------|-------|
| Malaysia EN | `locales/my.en.json` |
| Malaysia 中文 | `locales/my.zh.json` |
| Singapore EN | `locales/sg.en.json` |
| Singapore 中文 | `locales/sg.zh.json` |
| Vietnam | `locales/vn.vi.json` |

CTA links live in each locale file as `links.cta`.

## Cache busting

Set `assetVersion` in `config/site.json`, or run:

```sh
npm run build:bump
```

Every asset URL and stylesheet gets `?v=<assetVersion>`. Each build deletes `dist/` first so old files never linger.

## Deploy

Upload the contents of each `dist/{market}/` folder to its domain root. See `DEPLOY.md`.
