#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "fs";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const distRoot = join(root, "dist");
const configPath = join(root, "config", "site.json");

const bumpVersion = process.argv.includes("--bump");
let config = JSON.parse(readFileSync(configPath, "utf8"));

if (bumpVersion) {
  config.assetVersion = new Date()
    .toISOString()
    .replace(/\D/g, "")
    .slice(0, 14);
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`Bumped assetVersion → ${config.assetVersion}`);
}

const version = config.assetVersion;
const brand = config.brand;

console.log("Cleaning dist/ …");
rmSync(distRoot, { recursive: true, force: true });
mkdirSync(distRoot, { recursive: true });

console.log("Building CSS …");
const cssOut = join(distRoot, ".styles.css");
try {
  execSync(`npx --yes @tailwindcss/cli -i src/input.css -o ${cssOut} --minify`, {
    cwd: root,
    stdio: "inherit",
  });
} catch (error) {
  console.warn("Tailwind build failed; falling back to last compiled CSS if present.");
  const fallback = join(root, "output-v20260509.css");
  if (existsSync(fallback)) {
    cpSync(fallback, cssOut);
  } else {
    throw error;
  }
}

const template = readFileSync(join(root, "src", "index.template.html"), "utf8");
const assetFiles = readdirSync(join(root, "assets")).filter((name) => {
  const path = join(root, "assets", name);
  return statSync(path).isFile();
});

const assetUrl = (file) => `./assets/${file}?v=${version}`;

const loadLocale = (market, lang) => {
  const path = join(root, "locales", `${market}.${lang}.json`);
  return JSON.parse(readFileSync(path, "utf8"));
};

const buildI18nBundle = (market, languages) => {
  const bundle = {};
  for (const lang of languages) {
    bundle[lang] = loadLocale(market, lang);
  }
  return bundle;
};

const buildLangSwitcher = () => `        <details class="group absolute right-4 top-4 z-30 sm:right-8 sm:top-6">
          <summary class="flex cursor-pointer list-none items-center gap-2 rounded-full border border-white/70 bg-white/85 px-3 py-1 text-sm text-[#252b38] shadow-[0_10px_28px_rgba(15,23,42,0.12)] backdrop-blur">
            <span data-lang-current>English</span>
            <svg class="h-5 w-5 text-slate-500 transition group-open:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </summary>
          <div class="absolute right-0 mt-2 w-full min-w-full overflow-hidden rounded-2xl border border-white/70 bg-white/95 py-1 text-sm shadow-[0_18px_48px_rgba(15,23,42,0.16)] backdrop-blur">
            <button class="flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-left text-[#252b38] transition hover:bg-[#ef0338]/10" type="button" data-lang-option="en">
              <span>English</span>
            </button>
            <button class="flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-left text-[#252b38] transition hover:bg-[#ef0338]/10" type="button" data-lang-option="zh">
              <span>中文</span>
            </button>
          </div>
        </details>`;

const layoutConfig = {
  bilingual: {
    headFonts: `    <link href="https://fonts.googleapis.com/css2?family=Sofia+Sans:ital,wght@0,400;1,700&display=swap" rel="stylesheet" />
    <script>
      (function(d) {
        var config = {
          kitId: 'qbw4zxv',
          scriptTimeout: 3000,
          async: true
        },
        h=d.documentElement,t=setTimeout(function(){h.className=h.className.replace(/\\bwf-loading\\b/g,"")+" wf-inactive";},config.scriptTimeout),tk=d.createElement("script"),f=false,s=d.getElementsByTagName("script")[0],a;h.className+=" wf-loading";tk.src='https://use.typekit.net/'+config.kitId+'.js';tk.async=true;tk.onload=tk.onreadystatechange=function(){a=this.readyState;if(f||a&&a!="complete"&&a!="loaded")return;f=true;clearTimeout(t);try{Typekit.load(config)}catch(e){}};s.parentNode.insertBefore(tk,s)
      })(document);
    </script>`,
    fontPreload: `    <span class="font-cn pointer-events-none absolute -z-10 opacity-0" lang="zh-Hans" aria-hidden="true">88 次幸运免费旋转 仅限前 300 名玩家 解锁大奖 为什么选择 开启娱乐旅程</span>`,
    logoClass: "hero-logo absolute left-4 top-5 z-20 w-36 sm:inset-x-0 sm:top-7 sm:mx-auto sm:w-52",
    heroTitleClass: "hero-copy-title text-balance font-cn-display max-w-3xl text-3xl text-[#2c303a] sm:text-5xl",
    sectionTitleClass: "text-balance font-cn-section text-2xl sm:text-3xl",
    featureHeadingClass: "text-balance font-black font-cn-section",
    bodyClass: "font-vn bg-white text-[#252b38] antialiased",
  },
  vietnamese: {
    headFonts: `    <link href="https://fonts.googleapis.com/css2?family=Fjalla+One&family=Monda:wght@400..700&display=swap" rel="stylesheet" />`,
    fontPreload: `    <link rel="preload" as="font" type="font/woff2" crossorigin href="https://fonts.gstatic.com/s/fjallaone/v16/Yq6R-LCAWCX3-6Ky7FAFrO56kjouQb5-6g.woff2" />
    <link rel="preload" as="font" type="font/woff2" crossorigin href="https://fonts.gstatic.com/s/fjallaone/v16/Yq6R-LCAWCX3-6Ky7FAFrOF6kjouQb4.woff2" />`,
    logoClass: "hero-logo absolute inset-x-0 top-5 z-20 mx-auto w-36 sm:top-7 sm:w-52",
    heroTitleClass: "hero-copy-title font-hero-display text-balance max-w-3xl text-3xl text-[#2c303a] sm:text-5xl",
    sectionTitleClass: "text-balance text-2xl font-bold sm:text-3xl",
    featureHeadingClass: "text-balance font-bold",
    bodyClass: "font-vn font-vn-vi bg-white text-[#252b38] antialiased",
  },
};

const renderHtml = (marketId, market) => {
  const layout = layoutConfig[market.layout] || layoutConfig.bilingual;
  const defaultCopy = loadLocale(marketId, market.defaultLang);
  const htmlLang = market.locales[market.defaultLang] || market.defaultLang;
  const langs = market.languages.join(",");
  const localesJson = JSON.stringify(market.locales).replace(/"/g, "&quot;");
  const storageKey = `vwin-${marketId}-lang-v3`;

  let html = template
    .replaceAll("{{HTML_LANG}}", htmlLang)
    .replaceAll("{{META_TITLE}}", defaultCopy["meta.title"] || `${brand}`)
    .replaceAll("{{META_DESCRIPTION}}", defaultCopy["meta.description"] || "")
    .replaceAll("{{VERSION}}", version)
    .replaceAll("{{THEME_COLOR}}", config.themeColor)
    .replaceAll("{{BRAND}}", brand)
    .replaceAll("{{HEAD_FONTS}}", layout.headFonts)
    .replaceAll("{{FONT_PRELOAD}}", layout.fontPreload)
    .replaceAll("{{LANG_SWITCHER}}", market.languages.length > 1 ? buildLangSwitcher() : "")
    .replaceAll("{{LOGO_CLASS}}", layout.logoClass)
    .replaceAll("{{HERO_TITLE_CLASS}}", layout.heroTitleClass)
    .replaceAll("{{SECTION_TITLE_CLASS}}", layout.sectionTitleClass)
    .replaceAll("{{FEATURE_HEADING_CLASS}}", layout.featureHeadingClass)
    .replaceAll("{{BODY_CLASS}}", layout.bodyClass)
    .replaceAll("{{MARKET_ID}}", marketId)
    .replaceAll("{{DEFAULT_LANG}}", market.defaultLang)
    .replaceAll("{{LANGS}}", langs)
    .replaceAll("{{LOCALES_JSON}}", localesJson)
    .replaceAll("{{STORAGE_KEY}}", storageKey);

  html = html.replace(/\{\{A:([^}]+)\}\}/g, (_, file) => assetUrl(file));

  return html;
};

for (const [marketId, market] of Object.entries(config.markets)) {
  const outDir = join(distRoot, marketId);
  const assetsDir = join(outDir, "assets");
  mkdirSync(assetsDir, { recursive: true });

  cpSync(cssOut, join(outDir, "styles.css"));
  cpSync(join(root, "src", "js", "site.js"), join(assetsDir, "site.js"));
  cpSync(join(root, "src", "js", "embla-carousel.umd.js"), join(assetsDir, "embla-carousel.umd.js"));

  for (const file of assetFiles) {
    cpSync(join(root, "assets", file), join(assetsDir, file));
  }

  writeFileSync(join(assetsDir, "i18n.json"), `${JSON.stringify(buildI18nBundle(marketId, market.languages), null, 2)}\n`);
  writeFileSync(join(outDir, "index.html"), renderHtml(marketId, market));

  console.log(`Built dist/${marketId}/`);
}

rmSync(cssOut, { force: true });
writeFileSync(join(distRoot, ".build-version"), `${version}\n`);
console.log(`Done. assetVersion=${version}`);
