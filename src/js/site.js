(() => {
  const { page, defaultLang, langs, version, locales, storageKey } = document.body.dataset;
  const langList = langs ? langs.split(",").filter(Boolean) : [];
  const localeMap = locales ? JSON.parse(locales) : {};
  const langButtons = document.querySelectorAll("[data-lang-option]");
  const langShortLabels = { vi: "VN", en: "EN", zh: "中文" };
  const themeKey = "vwin-theme";
  const themeToggle = document.querySelector("[data-theme-toggle]");
  let darkAssetsLoaded = false;
  let lightAssetsLoading = false;
  let lightAssetsReady = false;
  const themeImageCache = new Set();

  const isUsableSource = (item) => {
    if (item.tagName === "SOURCE") {
      return !item.media || window.matchMedia(item.media).matches;
    }

    return window.getComputedStyle(item).display !== "none";
  };

  const collectThemeAssetUrls = (theme) => {
    const key = theme === "light" ? "lightSrc" : "darkSrc";
    const urls = new Set();

    document.querySelectorAll("[data-dark-src][data-light-src]").forEach((item) => {
      if (!isUsableSource(item)) return;

      const url = item.dataset[key];
      if (url) urls.add(url);
    });

    return [...urls];
  };

  const preloadImage = (url) => {
    if (themeImageCache.has(url)) return Promise.resolve();

    return new Promise((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        themeImageCache.add(url);
        resolve();
      };
      image.onerror = resolve;
      image.src = url;
    }).then(() => undefined);
  };

  const preloadLightAssets = () => {
    if (!darkAssetsLoaded || lightAssetsLoading || lightAssetsReady) return;

    const urls = collectThemeAssetUrls("light");
    if (!urls.length) {
      lightAssetsReady = true;
      return;
    }

    lightAssetsLoading = true;
    Promise.all(urls.map(preloadImage)).then(() => {
      lightAssetsReady = true;
      lightAssetsLoading = false;
      if (document.body.dataset.theme === "light") swapThemeAssets("light");
    });
  };

  const isDeferredHeroLayer = (image) =>
    image.classList.contains("hero-layer-pulse") || image.classList.contains("hero-layer-float");

  const isPrimaryHeroImage = (item) => {
    if (item.tagName !== "IMG") return false;
    if (isDeferredHeroLayer(item)) return false;
    if (item.classList.contains("site-loader-logo") || item.classList.contains("hero-logo")) return false;
    return item.closest(".hero-media") !== null;
  };

  const swapPrimaryHeroImage = (item, nextSrc) => {
    if (item.getAttribute("src") === nextSrc) return;

    if (themeImageCache.has(nextSrc)) {
      item.setAttribute("src", nextSrc);
      return;
    }

    const loader = new Image();
    loader.decoding = "async";
    loader.src = nextSrc;
    waitForImage(loader).then(() => {
      themeImageCache.add(nextSrc);
      item.setAttribute("src", nextSrc);
    });
  };

  const swapThemeAssets = (theme) => {
    document.querySelectorAll("[data-dark-src][data-light-src]").forEach((item) => {
      if (!isUsableSource(item)) return;

      const nextSrc = theme === "light" ? item.dataset.lightSrc : item.dataset.darkSrc;
      if (!nextSrc) return;

      if (item.tagName === "SOURCE") {
        item.srcset = nextSrc;
        return;
      }

      if (item.getAttribute("src") === nextSrc) return;

      if (isDeferredHeroLayer(item)) {
        if (themeImageCache.has(nextSrc)) {
          item.setAttribute("src", nextSrc);
          item.classList.add("is-layer-ready");
          return;
        }

        item.classList.remove("is-layer-ready");
        item.setAttribute("src", nextSrc);
        waitForImage(item).then(() => {
          themeImageCache.add(nextSrc);
          item.classList.add("is-layer-ready");
        });
        return;
      }

      if (isPrimaryHeroImage(item)) {
        swapPrimaryHeroImage(item, nextSrc);
        return;
      }

      item.setAttribute("src", nextSrc);
    });
  };

  const setTheme = (theme, options = {}) => {
    const nextTheme = theme === "light" ? "light" : "dark";
    const shouldPersist = options.persist !== false;
    const shouldSwapAssets = options.swapAssets !== false;

    document.body.dataset.theme = nextTheme;
    themeToggle?.setAttribute("aria-pressed", String(nextTheme === "dark"));

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) metaThemeColor.content = nextTheme === "dark" ? "#0c2230" : "#eb4758";

    if (shouldSwapAssets) {
      if (nextTheme === "dark") {
        swapThemeAssets("dark");
      } else if (lightAssetsReady) {
        swapThemeAssets("light");
      } else {
        preloadLightAssets();
      }
    }
    if (shouldPersist) window.localStorage.setItem(themeKey, nextTheme);
  };

  setTheme("dark", { persist: false, swapAssets: false });
  themeToggle?.addEventListener("click", () => {
    setTheme(document.body.dataset.theme === "dark" ? "light" : "dark");
  });

  const updateCtaLinks = (ctaUrl) => {
    const url = ctaUrl || "#";

    document.querySelectorAll(".hero-copy-cta, .feature-offer-cta, .hero-logo-link, .feature-carousel-link").forEach((link) => {
      link.href = url;
    });
  };

  const readCopy = () => {
    const inline = document.getElementById("site-i18n");
    if (inline?.textContent) {
      try {
        return JSON.parse(inline.textContent);
      } catch {
        return null;
      }
    }
    return null;
  };

  const initCopy = async () => {
    if (!page || !langList.length) return;

    if (langList.includes("zh")) {
      document.fonts?.load?.('400 1em "tt-hei-chs-variable"', "88 次幸运免费旋转");
      document.fonts?.load?.('400 1em "tt-hei-chs-variable"', "填写您的基本资料，简单几个步骤即可完成注册。");
      document.fonts?.load?.('500 1em "tt-hei-chs-variable"', "领取奖励");
    }

    let copy = readCopy();
    if (!copy) {
      try {
        const response = await fetch(`./assets/i18n.json?v=${version}`, { cache: "no-cache" });
        copy = await response.json();
      } catch {
        return;
      }
    }

    const setLanguage = (lang) => {
      const fallbackLang = langList.includes("zh") ? "zh" : langList[0];
      const dictionary = copy[lang] || copy[fallbackLang] || {};
      const isEnglish = lang === "en";
      const isChinese = lang === "zh";

      document.documentElement.lang = localeMap[lang] || localeMap[fallbackLang] || lang;
      document.body.classList.toggle("font-cn", isChinese);
      document.body.classList.toggle("font-vn", !isChinese && lang !== "vi");
      document.body.classList.toggle("font-vn-vi", lang === "vi");
      document.title = dictionary["meta.title"] || document.title;

      const description = document.querySelector('meta[name="description"]');
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (description && dictionary["meta.description"]) description.content = dictionary["meta.description"];
      if (ogTitle && dictionary["meta.title"]) ogTitle.content = dictionary["meta.title"];
      if (ogDescription && dictionary["meta.description"]) ogDescription.content = dictionary["meta.description"];

      document.querySelectorAll("[data-i18n]").forEach((item) => {
        const value = dictionary[item.dataset.i18n];
        if (value) item.textContent = value;
      });

      document.querySelectorAll("[data-i18n-html]").forEach((item) => {
        const value = dictionary[item.dataset.i18nHtml];
        if (value) item.innerHTML = value;
      });

      document.querySelectorAll("[data-i18n-alt]").forEach((item) => {
        const value = dictionary[item.dataset.i18nAlt];
        if (value) item.alt = value;
      });

      document.querySelectorAll("[data-lang-current]").forEach((item) => {
        item.textContent = dictionary["lang.current"] || (isEnglish ? "English" : isChinese ? "中文" : lang);
      });

      document.querySelectorAll("[data-lang-current-short]").forEach((item) => {
        item.textContent = langShortLabels[lang] || lang.toUpperCase();
      });

      langButtons.forEach((button) => {
        button.setAttribute("aria-current", button.dataset.langOption === lang ? "true" : "false");
      });

      updateCtaLinks(dictionary["links.cta"]);
      if (storageKey) window.localStorage.setItem(storageKey, lang);
    };

    langButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setLanguage(button.dataset.langOption);
        button.closest("details")?.removeAttribute("open");
      });
    });

    const savedLang = storageKey ? window.localStorage.getItem(storageKey) : null;
    setLanguage(savedLang && langList.includes(savedLang) ? savedLang : defaultLang || langList[0]);
  };

  initCopy();

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const waitForImage = (image) => {
    const decodeImage = () => {
      if (typeof image.decode === "function") {
        return image.decode().catch(() => undefined);
      }

      return Promise.resolve();
    };

    const src = image.currentSrc || image.src || "";
    const isSvg = /\.svg($|\?)/i.test(src);

    if (image.complete && (image.naturalWidth > 0 || isSvg)) {
      if (src) themeImageCache.add(src);
      return decodeImage();
    }

    return new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    }).then(decodeImage).then(() => {
      if (src) themeImageCache.add(src);
    });
  };

  const revealDeferredLayer = (image) => {
    image.classList.remove("is-layer-ready");
    return waitForImage(image).then(() => {
      image.classList.add("is-layer-ready");
    });
  };

  const initDeferredHeroLayers = () => {
    document.querySelectorAll(".hero-layer-pulse, .hero-layer-float").forEach((image) => {
      if (window.getComputedStyle(image).display === "none") return;
      revealDeferredLayer(image);
    });
  };

  let pageRevealed = false;

  const revealPage = () => {
    if (pageRevealed) return;
    pageRevealed = true;

    document.body.classList.add("is-ready");
    document.querySelectorAll(".hero-media").forEach((media) => {
      media.classList.add("is-loaded");
    });

    document.querySelectorAll(".hero-logo-link, .hero-copy-title, .hero-copy-reward, .hero-copy-cta, .hero-decor").forEach((item) => {
      item.style.opacity = "";
    });

    if (window.localStorage.getItem(themeKey) === "light") setTheme("light", { persist: false });
  };

  const initPageLoader = () => {
    initDeferredHeroLayers();

    const logo = document.querySelector(".hero-logo-link .hero-logo");
    const heroMedia = document.querySelector(".hero-media");
    const criticalImages = [];

    if (logo) criticalImages.push(logo);

    if (heroMedia) {
      criticalImages.push(
        ...[...heroMedia.querySelectorAll("img")].filter((image) => {
          if (window.getComputedStyle(image).display === "none") return false;
          return !image.classList.contains("hero-layer-pulse") && !image.classList.contains("hero-layer-float");
        })
      );
    }

    if (!criticalImages.length) {
      revealPage();
      return;
    }

    Promise.all(criticalImages.map(waitForImage)).then(() => {
      darkAssetsLoaded = true;
      preloadLightAssets();
      revealPage();
    });
    window.setTimeout(revealPage, 2500);
  };

  initPageLoader();

  const initProductCarousels = () => {
    const Embla = window.EmblaCarousel;
    const carousels = document.querySelectorAll(".product-carousel");
    if (!Embla || !carousels.length) return;

    carousels.forEach((carousel) => {
      const viewport = carousel.querySelector(".product-viewport");
      if (!viewport) return;

      Embla(viewport, {
        align: "start",
        containScroll: "trimSnaps",
        dragFree: true,
      });
    });
  };

  initProductCarousels();

  const scrollBehavior = reduceMotion ? "auto" : "smooth";

  const initTermsNavigation = () => {
    document.querySelectorAll(".terms-back-top").forEach((button) => {
      button.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: scrollBehavior });
      });
    });

    document.querySelectorAll('a[href="#terms"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        document.getElementById("terms")?.scrollIntoView({ behavior: scrollBehavior, block: "start" });
      });
    });
  };

  const initTermsDetails = () => {
    document.querySelectorAll("#terms details").forEach((details) => {
      const summary = details.querySelector("summary");
      const inner = details.querySelector(".terms-collapse-inner");
      if (!summary || !inner) return;

      if (reduceMotion) return;

      summary.addEventListener("click", (event) => {
        event.preventDefault();

        if (details.dataset.termsAnimating === "true") return;

        if (details.open) {
          details.dataset.termsAnimating = "true";
          inner.style.height = `${inner.scrollHeight}px`;
          inner.style.overflow = "hidden";

          requestAnimationFrame(() => {
            inner.style.height = "0px";
          });

          inner.addEventListener(
            "transitionend",
            (transitionEvent) => {
              if (transitionEvent.propertyName !== "height") return;

              details.removeAttribute("open");
              inner.style.height = "";
              inner.style.overflow = "";
              delete details.dataset.termsAnimating;
            },
            { once: true }
          );
          return;
        }

        details.dataset.termsAnimating = "true";
        details.setAttribute("open", "");
        inner.style.height = "0px";
        inner.style.overflow = "hidden";

        requestAnimationFrame(() => {
          inner.style.height = `${inner.scrollHeight}px`;
        });

        inner.addEventListener(
          "transitionend",
          (transitionEvent) => {
            if (transitionEvent.propertyName !== "height") return;

            inner.style.height = "auto";
            inner.style.overflow = "";
            delete details.dataset.termsAnimating;
          },
          { once: true }
        );
      });
    });
  };

  initTermsNavigation();
  initTermsDetails();

  const revealItems = document.querySelectorAll(".reveal");

  if (reduceMotion) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => observer.observe(item));

  const parallaxItems = document.querySelectorAll("[data-parallax]");
  let ticking = false;

  const updateParallax = () => {
    const isMobile = window.innerWidth < 768;
    parallaxItems.forEach((item) => {
      const baseSpeed = Number(item.dataset.parallax || 0.08);
      const speed = isMobile ? baseSpeed * 0.45 : baseSpeed;
      const maxOffset = isMobile ? 22 : 54;
      const offset = Math.min(window.scrollY * speed, maxOffset);
      item.style.transform = `translate3d(0, ${offset}px, 0)`;
    });
    ticking = false;
  };

  const requestUpdate = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  };

  updateParallax();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
})();
