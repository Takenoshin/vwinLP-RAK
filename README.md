# Longfu88 Landing Pages

Static landing pages for MY, VN, and SG.

## Structure

- `MY/index.html` - Malaysia page with English/Chinese language switcher
- `VN/index.html` - Vietnam page
- `SG/index.html` - Singapore page
- `assets/` - shared images, scripts, and JSON copy
- `input.css` - Tailwind source plus project CSS
- `output-v20260509.css` - current compiled CSS used by the pages

## Cache busting

After changing images or assets, bump the version in:

- `MY/index.html`, `SG/index.html`, `VN/index.html` (`?v=…` on local asset URLs)
- `assets/site-v20260509.js` (`ASSET_VERSION`)

Then sync `assets/` into `release/*/assets-v20260427/` and deploy `release/`.

## Build CSS

Use the Tailwind standalone CLI:

```sh
./tailwindcss -i input.css -o output.css --minify
cp output.css output-v20260509.css
```

The `tailwindcss` binary is not committed. Download the standalone CLI from the official Tailwind CSS releases for your OS.

## Local Preview

Serve one page folder at a time:

```sh
cd MY
python3 -m http.server 4174
```

Then open `http://127.0.0.1:4174/`.
