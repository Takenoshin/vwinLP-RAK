(() => {
  const { page, defaultLang, langs, version, locales, storageKey } = document.body.dataset;
  const langList = langs ? langs.split(",").filter(Boolean) : [];
  const localeMap = locales ? JSON.parse(locales) : {};
  const langButtons = document.querySelectorAll("[data-lang-option]");

  const updateCtaLinks = (ctaUrl) => {
    const url = ctaUrl || "#";

    document.querySelectorAll(".hero-copy-cta, .feature-offer-cta").forEach((link) => {
      link.href = url;
    });
  };

  const initCopy = async () => {
    if (!page || !langList.length) return;

    if (langList.includes("zh")) {
      document.fonts?.load?.('400 1em "tt-hei-chs-variable"', "88 次幸运免费旋转");
      document.fonts?.load?.('400 1em "tt-hei-chs-variable"', "填写您的基本资料，简单几个步骤即可完成注册。");
      document.fonts?.load?.('500 1em "tt-hei-chs-variable"', "领取奖励");
    }

    let copy;
    try {
      const response = await fetch(`./assets/i18n.json?v=${version}`, { cache: "no-cache" });
      copy = await response.json();
    } catch {
      return;
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

  const initHeroMedia = () => {
    document.querySelectorAll(".hero-media").forEach((media) => {
      const visibleImages = [...media.querySelectorAll("img")].filter((image) => {
        return window.getComputedStyle(image).display !== "none";
      });

      if (!visibleImages.length) {
        media.classList.add("is-loaded");
        return;
      }

      const waitForImage = (image) => {
        const decodeImage = () => {
          if (typeof image.decode === "function") {
            return image.decode().catch(() => undefined);
          }

          return Promise.resolve();
        };

        if (image.complete && image.naturalWidth > 0) {
          return decodeImage();
        }

        return new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        }).then(decodeImage);
      };

      Promise.all(visibleImages.map(waitForImage)).then(() => {
        media.classList.add("is-loaded");
      });

      window.setTimeout(() => {
        media.classList.add("is-loaded");
      }, 3500);
    });
  };

  initHeroMedia();

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

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
