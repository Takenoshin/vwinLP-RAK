(() => {
  const initLanguageSwitcher = async () => {
    const langButtons = document.querySelectorAll("[data-lang-option]");
    if (!langButtons.length) return;

    document.fonts?.load?.('400 1em "tt-hei-chs-variable"', "88 次幸运免费旋转");
    document.fonts?.load?.('500 1em "tt-hei-chs-variable"', "领取奖励");

    let copy;
    try {
      const scriptUrl = document.currentScript?.src || "./assets/site.js";
      const response = await fetch(new URL("i18n-my-v20260509.json", scriptUrl), { cache: "no-cache" });
      copy = await response.json();
    } catch {
      return;
    }

    const setLanguage = (lang) => {
      const dictionary = copy[lang] || copy.zh;
      const isEnglish = lang === "en";

      document.documentElement.lang = isEnglish ? "en-MY" : "zh-Hans-MY";
      document.body.classList.toggle("font-cn", !isEnglish);
      document.body.classList.toggle("font-vn", isEnglish);
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

      document.querySelectorAll("[data-lang-current]").forEach((item) => {
        item.textContent = dictionary["lang.current"] || (isEnglish ? "English" : "中文");
      });

      langButtons.forEach((button) => {
        button.setAttribute("aria-current", button.dataset.langOption === lang ? "true" : "false");
      });

      window.localStorage.setItem("longfu88-my-lang-v2", lang);
    };

    langButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setLanguage(button.dataset.langOption);
        button.closest("details")?.removeAttribute("open");
      });
    });

    setLanguage(window.localStorage.getItem("longfu88-my-lang-v2") || "en");
  };

  initLanguageSwitcher();

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
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const carousels = document.querySelectorAll(".product-carousel");
    if (!Embla || !carousels.length) return;

    carousels.forEach((carousel) => {
      const viewport = carousel.querySelector(".product-viewport");
      if (!viewport) return;

      const embla = Embla(viewport, {
        align: "start",
        containScroll: "trimSnaps",
        dragFree: true,
      });

      carousel.querySelectorAll(".product-slide").forEach((link) => {
        link.href = carousel.dataset.productLink || "#";
      });
    });
  };

  initProductCarousels();

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
