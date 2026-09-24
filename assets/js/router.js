(function () {
  const cache = {};
  const fallbackImage =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><rect width="640" height="480" fill="#f4f4f4"/><text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="40" font-weight="700" letter-spacing="4" fill="#c4c4c4">SAMSUNG</text></svg>',
    );

  const state = {
    products: [],
    categories: [],
    config: {},
    subcategory: null,
    sort: "default",
    trackedSku: null,
  };

  /* ---------- data ---------- */

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function getDataPath(file) {
    const inAdmin = /\/(?:admin|local-admin)\//.test(window.location.pathname);
    return `${inAdmin ? "../" : ""}data/${file}`;
  }

  async function fetchJSON(path) {
    if (cache[path]) return cache[path];
    cache[path] = fetch(path, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${path}`);
        return response.json();
      })
      .catch(() => fetchJSONWithXHR(path));
    return cache[path];
  }

  function fetchJSONWithXHR(path) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.overrideMimeType("application/json");
      request.open("GET", path, true);
      request.onload = () => {
        if ((request.status >= 200 && request.status < 300) || (request.status === 0 && request.responseText)) {
          try {
            resolve(JSON.parse(request.responseText));
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`Failed to load ${path}`));
        }
      };
      request.onerror = () => reject(new Error(`Failed to load ${path}`));
      request.send();
    });
  }

  const isVisible = (product) => product.active !== false;

  function findProduct(products, sku) {
    return products.find((product) => product.sku === sku && isVisible(product));
  }

  function filterProducts(products, categoryId, subcategoryId = null) {
    return products.filter(
      (product) =>
        isVisible(product) &&
        product.category === categoryId &&
        (subcategoryId === null || product.subcategory === subcategoryId),
    );
  }

  function getRelated(products, currentSku, subcategory, category) {
    const pool = products.filter((product) => isVisible(product) && product.sku !== currentSku && product.category === category);
    const sameSub = pool.filter((product) => subcategory && product.subcategory === subcategory);
    const rest = pool.filter((product) => !sameSub.includes(product));
    return [...sameSub, ...rest].slice(0, 8);
  }

  async function dataBundle() {
    const [products, categories, config] = await Promise.all([
      fetchJSON(getDataPath("products.json")),
      fetchJSON(getDataPath("categories.json")),
      fetchJSON(getDataPath("config.json")),
    ]);
    return { products, categories, config };
  }

  /* ---------- helpers ---------- */

  function lang() {
    return typeof getLang === "function" ? getLang() : "ar";
  }

  function t(ar, en) {
    return lang() === "ar" ? ar : en;
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function pick(item, base) {
    const suffix = lang() === "ar" ? "Ar" : "En";
    return item?.[`${base}${suffix}`] || item?.[`${base}En`] || item?.[`${base}Ar`] || "";
  }

  function shortTitle(product) {
    return pick(product, "shortTitle") || pick(product, "title") || product.sku;
  }

  function formatNumber(count) {
    return new Intl.NumberFormat(lang() === "ar" ? "ar" : "en").format(count);
  }

  function numberText(count) {
    if (lang() === "ar") return `${formatNumber(count)} ${count === 1 ? "منتج" : "منتجات"}`;
    return `${count} ${count === 1 ? "product" : "products"}`;
  }

  function categoryOf(product) {
    return state.categories.find((category) => category.id === product.category);
  }

  function subcategoryOf(product) {
    return categoryOf(product)?.subcategories?.find((subcategory) => subcategory.id === product.subcategory);
  }

  const UI_ICONS = {
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    share: '<path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  };

  function uiIcon(name, extraClass = "") {
    const flip = ["arrow", "back"].includes(name) ? " icon-flip" : "";
    return `<svg class="ui-icon${flip} ${extraClass}" viewBox="0 0 24 24" aria-hidden="true">${UI_ICONS[name]}</svg>`;
  }

  function iconSvg(icon) {
    const common = 'viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
    const paths = {
      washer: '<rect x="9" y="5" width="30" height="38" rx="4"/><circle cx="24" cy="27" r="10"/><path d="M15 12h10M33 12h.1M18 27c3 3 9 3 12 0"/>',
      fridge: '<rect x="12" y="4" width="24" height="40" rx="3"/><path d="M12 19h24M18 12v3M18 26v4"/>',
      ac: '<rect x="6" y="12" width="36" height="14" rx="3"/><path d="M13 32c2 3 2 5 0 8M24 32c2 3 2 5 0 8M35 32c2 3 2 5 0 8M12 19h24"/>',
      dishwasher: '<rect x="10" y="5" width="28" height="38" rx="3"/><path d="M10 16h28M17 11h.1M23 11h8M17 30c4 3 10 3 14 0"/>',
      oven: '<rect x="8" y="7" width="32" height="34" rx="3"/><path d="M8 17h32M16 12h.1M23 12h.1M30 12h.1M16 31h16"/>',
      microwave: '<rect x="5" y="12" width="38" height="24" rx="3"/><rect x="10" y="17" width="21" height="14" rx="2"/><path d="M36 19h.1M36 25h.1M36 31h.1"/>',
      tv: '<rect x="4" y="8" width="40" height="26" rx="3"/><path d="M17 40h14M24 34v6"/>',
      phone: '<rect x="14" y="4" width="20" height="40" rx="4"/><path d="M22 38h4"/>',
      vacuum: '<circle cx="16" cy="36" r="6"/><path d="M20 32 36 8M33 6l6 4M22 36h18"/>',
      box: '<path d="M6 14 24 6l18 8v20l-18 8-18-8z"/><path d="M6 14l18 8 18-8M24 22v20"/>',
    };
    return `<svg ${common}>${paths[icon] || paths.box}</svg>`;
  }

  function productUrl(product, storeId = "") {
    const params = new URLSearchParams({ sku: product.sku });
    if (storeId) params.set("store", storeId);
    return `product.html?${params.toString()}`;
  }

  function fallbackFor(iconName) {
    const icon = iconSvg(iconName)
      .replace("<svg ", '<svg x="200" y="160" width="240" height="240" ')
      .replace('stroke="currentColor"', 'stroke="#b8b8b8"')
      .replace('stroke-width="2.4"', 'stroke-width="1.6"');
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 560">${icon}</svg>`);
  }

  function imageTag(src, alt, className = "", eager = false, icon = "") {
    const fallback = icon ? fallbackFor(icon) : fallbackImage;
    return `<img class="${className}" src="${esc(src || fallback)}" alt="${esc(alt)}" ${eager ? "" : 'loading="lazy"'} decoding="async" data-fallback="${esc(fallback)}">`;
  }

  function productImage(product, className = "", eager = false) {
    return imageTag(product.imageUrl, shortTitle(product), className, eager, categoryOf(product)?.icon || "box");
  }

  function applyImageFallbacks(root = document) {
    root.querySelectorAll("img[data-fallback]").forEach((image) => {
      const fallback = image.dataset.fallback || fallbackImage;
      image.removeAttribute("data-fallback");
      const fail = () => {
        image.onerror = null;
        image.src = fallback;
        image.classList.add("image-fallback");
      };
      image.onerror = fail;
      if (image.complete && image.naturalWidth === 0 && image.src !== fallback) fail();
    });
  }

  function productCard(product, storeId = "") {
    const sub = subcategoryOf(product);
    const eyebrow = sub ? pick(sub, "name") : categoryOf(product) ? pick(categoryOf(product), "name") : "";
    return `
      <a class="product-card" href="${productUrl(product, storeId)}">
        <div class="product-card-media">${productImage(product)}</div>
        <div class="product-card-body">
          ${eyebrow ? `<span class="eyebrow">${esc(eyebrow)}</span>` : ""}
          <h3 class="product-card-title">${esc(shortTitle(product))}</h3>
          <span class="model-tag" dir="ltr">${esc(product.sku)}</span>
          <span class="product-card-cta">${t("عرض التفاصيل", "View details")} ${uiIcon("arrow")}</span>
        </div>
      </a>
    `;
  }

  function skeletonCards(count) {
    return Array.from({ length: count }, () => '<div class="product-card is-skeleton"><div class="product-card-media"></div><div class="product-card-body"><span></span><span></span></div></div>').join("");
  }

  let toastTimer = null;
  function toast(message) {
    let element = document.getElementById("toast");
    if (!element) {
      element = document.createElement("div");
      element.id = "toast";
      element.className = "toast";
      element.setAttribute("role", "status");
      document.body.appendChild(element);
    }
    element.textContent = message;
    element.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove("is-visible"), 2200);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    }
  }

  /* ---------- site-wide config ---------- */

  function feedbackEnabled() {
    return state.config.feedbackEnabled !== false && Boolean(state.config.feedbackFormUrl);
  }

  function applySiteConfig() {
    const { config } = state;
    document.querySelectorAll(".js-feedback-link").forEach((link) => {
      link.hidden = !feedbackEnabled();
    });
    document.querySelectorAll(".js-search-open").forEach((button) => {
      button.hidden = config.showSearch === false;
    });
    if (typeof hasStoredLang === "function" && !hasStoredLang() && config.defaultLang && config.defaultLang !== lang()) {
      applyLanguage(config.defaultLang, false);
    }
    renderFooterCategories();
  }

  function renderFooterCategories() {
    const target = document.getElementById("footer-categories");
    if (!target) return;
    target.innerHTML = state.categories
      .map((category) => `<a href="category.html?cat=${encodeURIComponent(category.id)}">${esc(pick(category, "name"))}</a>`)
      .join("");
  }

  /* ---------- search ---------- */

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/[\s/\-_.]+/g, "");
  }

  function searchProducts(query) {
    const q = normalize(query);
    if (!q) return [];
    return state.products
      .filter(isVisible)
      .map((product) => {
        const sku = normalize(product.sku);
        const text = normalize(`${product.shortTitleAr} ${product.shortTitleEn} ${product.titleAr} ${product.titleEn}`);
        const score = sku.startsWith(q) ? 3 : sku.includes(q) ? 2 : text.includes(q) ? 1 : 0;
        return { product, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((item) => item.product);
  }

  function renderSearchResults() {
    const input = document.getElementById("search-input");
    const results = document.getElementById("search-results");
    if (!input || !results) return;
    const query = input.value.trim();
    if (!query) {
      results.innerHTML = `
        <p class="search-hint">${t("اقتراحات", "Browse categories")}</p>
        <div class="search-chips">${state.categories
          .map((category) => `<a class="chip" href="category.html?cat=${encodeURIComponent(category.id)}">${esc(pick(category, "name"))}</a>`)
          .join("")}</div>`;
      return;
    }
    const found = searchProducts(query);
    if (!found.length) {
      results.innerHTML = `<p class="search-empty">${t("لا توجد نتائج لـ", "No results for")} “${esc(query)}”</p>`;
      return;
    }
    results.innerHTML = `
      <p class="search-hint">${numberText(found.length)}</p>
      ${found
        .map(
          (product) => `
          <a class="search-result" href="${productUrl(product)}">
            <span class="search-thumb">${productImage(product)}</span>
            <span class="search-text">
              <strong>${esc(shortTitle(product))}</strong>
              <span dir="ltr">${esc(product.sku)}</span>
            </span>
            ${uiIcon("arrow")}
          </a>`,
        )
        .join("")}`;
    applyImageFallbacks(results);
  }

  function openSearch(prefill = "") {
    const overlay = document.getElementById("search-overlay");
    const input = document.getElementById("search-input");
    if (!overlay || !input) return;
    overlay.hidden = false;
    document.body.classList.add("no-scroll");
    input.value = prefill;
    renderSearchResults();
    requestAnimationFrame(() => input.focus());
  }

  function closeSearch() {
    const overlay = document.getElementById("search-overlay");
    if (!overlay) return;
    overlay.hidden = true;
    document.body.classList.remove("no-scroll");
  }

  function initSearch() {
    document.querySelectorAll(".js-search-open").forEach((button) => button.addEventListener("click", () => openSearch()));
    document.querySelectorAll(".js-search-close").forEach((button) => button.addEventListener("click", closeSearch));
    document.getElementById("search-overlay")?.addEventListener("click", (event) => {
      if (event.target.id === "search-overlay") closeSearch();
    });
    document.getElementById("search-input")?.addEventListener("input", renderSearchResults);
    document.getElementById("search-input")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") document.querySelector("#search-results .search-result")?.click();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeSearch();
      if (event.key === "/" && !/input|textarea|select/i.test(document.activeElement?.tagName || "") && state.config.showSearch !== false) {
        event.preventDefault();
        openSearch();
      }
    });
  }

  /* ---------- pages ---------- */

  function renderHome() {
    const { products, categories, config } = state;
    const visible = products.filter(isVisible);

    const heroTitle = document.getElementById("hero-title");
    const heroSubtitle = document.getElementById("hero-subtitle");
    if (heroTitle) heroTitle.textContent = pick(config, "heroTitle") || t("اكتشف منتجات سامسونج", "Discover Samsung Products");
    if (heroSubtitle) heroSubtitle.textContent = pick(config, "heroSubtitle") || t("تقنية ذكية لحياة أفضل", "Smart technology for a better life");

    const heroSearch = document.getElementById("hero-search");
    if (heroSearch) heroSearch.hidden = config.showSearch === false;

    const stats = document.getElementById("hero-stats");
    if (stats) {
      stats.innerHTML = `
        <span><b>${formatNumber(visible.length)}</b> ${t("منتج", "products")}</span>
        <span><b>${formatNumber(categories.length)}</b> ${t("أقسام", "categories")}</span>`;
    }

    const grid = document.getElementById("category-grid");
    if (grid) {
      grid.innerHTML = categories
        .map((category) => {
          const inCategory = visible.filter((product) => product.category === category.id);
          const cover = category.imageUrl || inCategory.find((product) => product.imageUrl)?.imageUrl;
          return `
            <a class="category-card" href="category.html?cat=${encodeURIComponent(category.id)}">
              <span class="category-media">
                ${cover ? imageTag(cover, "", "", false, category.icon) : `<span class="category-icon">${iconSvg(category.icon)}</span>`}
              </span>
              <span class="category-text">
                <span class="category-name">${esc(pick(category, "name"))}</span>
                <span class="category-count">${numberText(inCategory.length)}</span>
              </span>
              <span class="category-arrow">${uiIcon("arrow")}</span>
            </a>`;
        })
        .join("");
      applyImageFallbacks(grid);
    }

    const featuredSection = document.getElementById("featured-section");
    const featuredGrid = document.getElementById("featured-grid");
    if (featuredSection && featuredGrid) {
      let featured = visible.filter((product) => product.featured);
      if (!featured.length) {
        featured = categories.map((category) => visible.find((product) => product.category === category.id)).filter(Boolean);
      }
      featuredSection.hidden = config.showFeatured === false || !featured.length;
      featuredGrid.innerHTML = featured.slice(0, 8).map((product) => productCard(product)).join("");
      applyImageFallbacks(featuredGrid);
    }
  }

  function sortProducts(list) {
    const sorted = [...list];
    if (state.sort === "name") sorted.sort((a, b) => shortTitle(a).localeCompare(shortTitle(b), lang()));
    if (state.sort === "model") sorted.sort((a, b) => a.sku.localeCompare(b.sku));
    if (state.sort === "newest") sorted.sort((a, b) => String(b.addedDate || "").localeCompare(String(a.addedDate || "")));
    return sorted;
  }

  function renderCategory() {
    const catId = getParam("cat");
    const category = state.categories.find((item) => item.id === catId);
    const title = document.getElementById("category-title");
    const crumb = document.getElementById("category-crumb");
    const count = document.getElementById("category-count");
    const tabs = document.getElementById("subcategory-tabs");
    const grid = document.getElementById("product-grid");
    const sort = document.getElementById("sort-select");

    if (!category) {
      document.getElementById("category-toolbar")?.setAttribute("hidden", "");
      if (title) title.textContent = t("القسم غير متاح", "Category unavailable");
      if (crumb) crumb.textContent = "";
      if (count) count.textContent = "";
      if (grid) grid.innerHTML = emptyState(t("لم نجد هذا القسم.", "We couldn't find this category."));
      return;
    }

    document.title = `${pick(category, "name")} | Samsung`;
    if (title) title.textContent = pick(category, "name");
    if (crumb) crumb.textContent = pick(category, "name");

    const inCategory = filterProducts(state.products, category.id);
    const shown = sortProducts(filterProducts(state.products, category.id, state.subcategory));
    if (count) count.textContent = numberText(shown.length);

    if (tabs) {
      const subs = (category.subcategories || []).filter((sub) => inCategory.some((product) => product.subcategory === sub.id));
      tabs.hidden = !subs.length;
      tabs.innerHTML = [
        `<button class="chip ${state.subcategory === null ? "is-active" : ""}" type="button" data-subcategory="">${t("الكل", "All")} <span>${formatNumber(inCategory.length)}</span></button>`,
        ...subs.map((sub) => {
          const subCount = inCategory.filter((product) => product.subcategory === sub.id).length;
          return `<button class="chip ${state.subcategory === sub.id ? "is-active" : ""}" type="button" data-subcategory="${esc(sub.id)}">${esc(pick(sub, "name"))} <span>${formatNumber(subCount)}</span></button>`;
        }),
      ].join("");
      tabs.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", () => {
          state.subcategory = button.dataset.subcategory || null;
          const url = new URL(window.location.href);
          if (state.subcategory) url.searchParams.set("sub", state.subcategory);
          else url.searchParams.delete("sub");
          history.replaceState(null, "", url);
          renderCategory();
        });
      });
    }

    if (sort) {
      sort.innerHTML = [
        ["default", t("الترتيب المقترح", "Recommended")],
        ["name", t("الاسم (أ-ي)", "Name (A–Z)")],
        ["model", t("رقم الموديل", "Model number")],
        ["newest", t("الأحدث", "Newest")],
      ]
        .map(([value, label]) => `<option value="${value}" ${state.sort === value ? "selected" : ""}>${label}</option>`)
        .join("");
    }

    if (grid) {
      grid.innerHTML = shown.length ? shown.map((product) => productCard(product)).join("") : emptyState(t("لا توجد منتجات في هذا القسم حالياً.", "No products in this category yet."));
      applyImageFallbacks(grid);
    }
  }

  function emptyState(message, extra = "") {
    return `<div class="empty-state"><p>${message}</p>${extra || `<a class="button" href="index.html">${t("العودة للرئيسية", "Back to home")}</a>`}</div>`;
  }

  function renderProduct() {
    const sku = getParam("sku");
    const storeId = getParam("store") || sessionStorage.getItem("utm_store") || "";
    const product = findProduct(state.products, sku);
    const target = document.getElementById("product-detail");
    const actionBar = document.getElementById("product-actionbar");
    if (!target) return;

    if (!product) {
      document.title = t("المنتج غير متاح", "Product unavailable");
      if (actionBar) actionBar.hidden = true;
      target.innerHTML = `
        <section class="empty-state empty-state-large">
          <h1>${t("هذا المنتج غير متاح", "This product is no longer available")}</h1>
          <p>${t("ربما تم حذف المنتج أو إخفاؤه من الكتالوج.", "The product may have been removed or hidden from the catalogue.")}</p>
          <a class="button" href="index.html">${t("العودة للرئيسية", "Back to home")}</a>
        </section>`;
      return;
    }

    const category = categoryOf(product);
    const sub = subcategoryOf(product);
    const highlights = product.highlights || [];
    const related = state.config.showRelated === false ? [] : getRelated(state.products, product.sku, product.subcategory, product.category);
    const showFeedback = feedbackEnabled() && state.config.showFeedbackOnProduct !== false;
    const feedbackUrl = `feedback.html?sku=${encodeURIComponent(product.sku)}`;
    const categoryUrl = category ? `category.html?cat=${encodeURIComponent(category.id)}` : "index.html";
    document.title = `${shortTitle(product)} | Samsung`;

    target.innerHTML = `
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="index.html">${t("الرئيسية", "Home")}</a>
        <span aria-hidden="true">/</span>
        <a href="${categoryUrl}">${esc(category ? pick(category, "name") : product.category)}</a>
        <span aria-hidden="true">/</span>
        <span dir="ltr">${esc(product.sku)}</span>
      </nav>

      <section class="product-hero">
        <div class="product-gallery">
          ${productImage(product, "product-hero-image", true)}
        </div>
        <div class="product-info">
          <div class="chip-row">
            ${category ? `<a class="chip chip-soft" href="${categoryUrl}">${esc(pick(category, "name"))}</a>` : ""}
            ${sub ? `<a class="chip chip-soft" href="${categoryUrl}&sub=${encodeURIComponent(sub.id)}">${esc(pick(sub, "name"))}</a>` : ""}
          </div>
          <h1 class="product-title">${esc(pick(product, "title") || shortTitle(product))}</h1>
          <div class="model-row">
            <span class="model-label">${t("رقم الموديل", "Model")}</span>
            <b dir="ltr">${esc(product.sku)}</b>
            <button class="icon-button icon-button-sm" type="button" id="copy-sku" aria-label="${t("نسخ رقم الموديل", "Copy model number")}">${uiIcon("copy")}</button>
          </div>
          ${pick(product, "description") ? `<p class="product-description">${esc(pick(product, "description"))}</p>` : ""}
          ${
            highlights.length
              ? `<ul class="key-features">${highlights
                  .slice(0, 4)
                  .map((highlight) => `<li>${uiIcon("check")}<span>${esc(pick(highlight, "title"))}</span></li>`)
                  .join("")}</ul>`
              : ""
          }
          <div class="product-actions">
            ${showFeedback ? `<a class="button" href="${feedbackUrl}">${uiIcon("chat")} ${t("شاركنا رأيك", "Share feedback")}</a>` : ""}
            <button class="button button-secondary js-share" type="button">${uiIcon("share")} ${t("مشاركة", "Share")}</button>
          </div>
        </div>
      </section>

      ${
        highlights.length
          ? `<section class="section-block" id="features">
              <div class="section-head"><h2>${t("أبرز المزايا", "Key features")}</h2></div>
              <div class="highlight-grid">
                ${highlights
                  .map(
                    (highlight, index) => `
                    <article class="highlight-card">
                      <span class="highlight-index">${String(index + 1).padStart(2, "0")}</span>
                      <h3>${esc(pick(highlight, "title"))}</h3>
                      ${pick(highlight, "body") ? `<p>${esc(pick(highlight, "body"))}</p>` : ""}
                    </article>`,
                  )
                  .join("")}
              </div>
            </section>`
          : ""
      }

      ${
        related.length
          ? `<section class="section-block">
              <div class="section-head">
                <h2>${t("منتجات مشابهة", "You may also like")}</h2>
                <a class="text-link" href="${categoryUrl}">${t("عرض الكل", "View all")} ${uiIcon("arrow")}</a>
              </div>
              <div class="scroll-row">${related.map((item) => productCard(item, storeId)).join("")}</div>
            </section>`
          : ""
      }
    `;

    if (actionBar) {
      actionBar.hidden = false;
      actionBar.innerHTML = `
        <div class="actionbar-info">
          <strong>${esc(shortTitle(product))}</strong>
          <span dir="ltr">${esc(product.sku)}</span>
        </div>
        <div class="actionbar-buttons">
          <button class="icon-button js-share" type="button" aria-label="${t("مشاركة", "Share")}">${uiIcon("share")}</button>
          ${showFeedback ? `<a class="button button-small" href="${feedbackUrl}">${t("رأيك", "Feedback")}</a>` : ""}
        </div>`;
    }

    document.getElementById("copy-sku")?.addEventListener("click", async () => {
      if (await copyText(product.sku)) toast(t("تم نسخ رقم الموديل", "Model number copied"));
    });
    document.querySelectorAll(".js-share").forEach((button) =>
      button.addEventListener("click", async () => {
        const url = new URL(productUrl(product), window.location.href).href;
        if (navigator.share) {
          try {
            await navigator.share({ title: shortTitle(product), text: `${shortTitle(product)} (${product.sku})`, url });
          } catch (error) {
            /* share dismissed */
          }
        } else if (await copyText(url)) {
          toast(t("تم نسخ الرابط", "Link copied"));
        }
      }),
    );
    applyImageFallbacks(target);
    applyImageFallbacks(actionBar || document);

    if (state.trackedSku !== product.sku && window.SamsungAnalytics) {
      state.trackedSku = product.sku;
      window.SamsungAnalytics.trackProductView(product.sku, getParam("store"));
    }
  }

  function renderFeedback() {
    const target = document.getElementById("feedback-content");
    if (!target) return;
    if (!feedbackEnabled()) {
      document.title = `${t("الملاحظات غير متاحة", "Feedback unavailable")} | Samsung`;
      target.innerHTML = `
        <section class="empty-state empty-state-large">
          <h1>${t("صفحة الملاحظات غير متاحة حالياً", "Feedback is currently unavailable")}</h1>
          <p>${t("شكراً لاهتمامك. يمكنك متابعة تصفح المنتجات.", "Thank you for your interest. You can keep browsing our products.")}</p>
          <a class="button" href="index.html">${t("تصفح المنتجات", "Browse products")}</a>
        </section>`;
      return;
    }
    const product = findProduct(state.products, getParam("sku"));
    const existing = document.getElementById("feedback-frame");
    const frameSrc = state.config.feedbackFormUrl;
    target.innerHTML = `
      <div class="page-head">
        <h1 class="page-title">${t("آراؤكم تهمنا", "Your feedback matters")}</h1>
        <p class="page-lead">${t("ساعدنا في تحسين تجربتك. يستغرق الأمر أقل من دقيقة.", "Help us improve your experience. It takes less than a minute.")}</p>
      </div>
      ${
        product
          ? `<a class="feedback-product" href="${productUrl(product)}">
              <span class="search-thumb">${productImage(product)}</span>
              <span class="search-text"><strong>${esc(shortTitle(product))}</strong><span dir="ltr">${esc(product.sku)}</span></span>
            </a>`
          : ""
      }
      <div class="feedback-card" id="feedback-slot"></div>`;
    const slot = document.getElementById("feedback-slot");
    const frame = existing || Object.assign(document.createElement("iframe"), { id: "feedback-frame", className: "feedback-frame", title: "Feedback form", loading: "lazy" });
    if (frame.getAttribute("src") !== frameSrc) frame.src = frameSrc;
    slot.appendChild(frame);
    applyImageFallbacks(target);
  }

  function renderPage() {
    const page = document.body.dataset.page;
    if (page === "home") renderHome();
    if (page === "category") renderCategory();
    if (page === "product") renderProduct();
    if (page === "feedback") renderFeedback();
    if (document.getElementById("search-overlay") && !document.getElementById("search-overlay").hidden) renderSearchResults();
  }

  async function initRoutePage() {
    const page = document.body.dataset.page;
    if (!page || page.startsWith("admin")) return;
    initSearch();
    document.getElementById("hero-search")?.addEventListener("click", () => openSearch());
    document.getElementById("sort-select")?.addEventListener("change", (event) => {
      state.sort = event.target.value;
      renderCategory();
    });
    const grid = document.getElementById("product-grid") || document.getElementById("featured-grid");
    if (grid && !grid.innerHTML.trim()) grid.innerHTML = skeletonCards(4);

    try {
      const { products, categories, config } = await dataBundle();
      Object.assign(state, { products, categories, config: config || {} });
      state.subcategory = getParam("sub") || null;
      applySiteConfig();
      renderPage();
    } catch (error) {
      const main = document.querySelector("main");
      if (main) {
        main.innerHTML = `<section class="container empty-state empty-state-large"><h1>${t("تعذر تحميل البيانات", "Could not load data")}</h1><p>${esc(error.message)}</p></section>`;
      }
      console.error(error);
    }
  }

  document.addEventListener("DOMContentLoaded", initRoutePage);
  document.addEventListener("langchange", () => {
    const page = document.body.dataset.page;
    if (!state.categories.length || !page || page.startsWith("admin")) return;
    renderFooterCategories();
    renderPage();
  });

  window.getParam = getParam;
  window.fetchJSON = fetchJSON;
  window.findProduct = findProduct;
  window.filterProducts = filterProducts;
  window.getRelated = getRelated;
  window.SamsungRouter = {
    getParam,
    fetchJSON,
    findProduct,
    filterProducts,
    getRelated,
    getDataPath,
    pick,
    iconSvg,
    fallbackImage,
  };
})();
