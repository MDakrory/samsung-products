(function () {
  const cache = {};
  const fallbackImage =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420"><rect width="640" height="420" fill="#f0f4ff"/><text x="50%" y="47%" text-anchor="middle" font-family="Arial" font-size="44" font-weight="700" fill="#1428A0">SAMSUNG</text><text x="50%" y="60%" text-anchor="middle" font-family="Arial" font-size="22" fill="#666">Product image</text></svg>',
    );

  let currentCategory = null;
  let currentSubcategory = null;
  let currentProduct = null;
  let trackedSku = null;

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function getDataPath(file) {
    const inAdmin = window.location.pathname.includes("/admin/");
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

  function findProduct(products, sku) {
    return products.find((product) => product.sku === sku && product.active !== false);
  }

  function filterProducts(products, categoryId, subcategoryId = null) {
    return products.filter(
      (product) =>
        product.active !== false &&
        product.category === categoryId &&
        (subcategoryId === null || product.subcategory === subcategoryId),
    );
  }

  function getRelated(products, currentSku, subcategory, category) {
    const sameSub = products.filter(
      (product) => product.active !== false && product.sku !== currentSku && product.subcategory === subcategory,
    );
    if (sameSub.length >= 4) return sameSub.slice(0, 4);
    const sameCat = products.filter(
      (product) =>
        product.active !== false &&
        product.sku !== currentSku &&
        product.category === category &&
        !sameSub.includes(product),
    );
    return [...sameSub, ...sameCat].slice(0, 4);
  }

  function lang() {
    return typeof getLang === "function" ? getLang() : "ar";
  }

  function pick(item, base) {
    const suffix = lang() === "ar" ? "Ar" : "En";
    return item?.[`${base}${suffix}`] || item?.[`${base}En`] || item?.[`${base}Ar`] || "";
  }

  function numberText(count) {
    if (lang() === "ar") return `${new Intl.NumberFormat("ar").format(count)} منتجاً`;
    return `${count} ${count === 1 ? "Product" : "Products"}`;
  }

  function modelText(sku) {
    return lang() === "ar" ? `الموديل: ${sku}` : `Model: ${sku}`;
  }

  function modelMarkup(sku) {
    return lang() === "ar"
      ? `<span>الموديل:</span> <b dir="ltr">${sku}</b>`
      : `<span>Model:</span> <b dir="ltr">${sku}</b>`;
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
    };
    return `<svg ${common}>${paths[icon] || paths.washer}</svg>`;
  }

  function setImageFallback(image, label = "Samsung") {
    image.onerror = () => {
      image.onerror = null;
      image.src = fallbackImage;
      image.alt = label;
      image.classList.add("image-fallback");
    };
  }

  function productUrl(product, storeId = null) {
    const params = new URLSearchParams({ sku: product.sku });
    if (storeId) params.set("store", storeId);
    return `product.html?${params.toString()}`;
  }

  function productCard(product, storeId = null) {
    const highlights = (product.highlights || [])
      .slice(0, 2)
      .map((highlight) => `<span class="badge">${pick(highlight, "title")}</span>`)
      .join("");
    return `
      <article class="product-card">
        <a class="product-image-link" href="${productUrl(product, storeId)}">
          <img src="${product.imageUrl}" alt="${pick(product, "shortTitle")}" loading="lazy" data-fallback-title="${pick(product, "shortTitle")}">
        </a>
        <div class="product-card-body">
          <h3>${pick(product, "shortTitle")}</h3>
          <p class="model-sku">${modelMarkup(product.sku)}</p>
          <div class="badge-row">${highlights}</div>
          <a class="button button-small" href="${productUrl(product, storeId)}" data-ar="عرض المنتج" data-en="View Product">${lang() === "ar" ? "عرض المنتج" : "View Product"}</a>
        </div>
      </article>
    `;
  }

  function applyProductImageFallbacks(root = document) {
    root.querySelectorAll(".product-card img, .product-hero-image").forEach((image) => {
      setImageFallback(image, image.dataset.fallbackTitle || image.alt);
    });
  }

  async function dataBundle() {
    const [products, categories, config] = await Promise.all([
      fetchJSON(getDataPath("products.json")),
      fetchJSON(getDataPath("categories.json")),
      fetchJSON(getDataPath("config.json")),
    ]);
    return { products, categories, config };
  }

  async function renderHome() {
    const grid = document.getElementById("category-grid");
    if (!grid) return;
    const { products, categories } = await dataBundle();
    grid.innerHTML = categories
      .map((category) => {
        const count = products.filter((product) => product.active !== false && product.category === category.id).length;
        return `
          <a class="category-card" href="category.html?cat=${encodeURIComponent(category.id)}">
            <span class="category-icon">${iconSvg(category.icon)}</span>
            <span class="category-name">${pick(category, "name")}</span>
            <span class="category-count">${numberText(count)}</span>
          </a>
        `;
      })
      .join("");
  }

  function renderCategoryProducts(products) {
    const grid = document.getElementById("product-grid");
    if (!grid) return;
    if (!products.length) {
      grid.innerHTML = `<div class="empty-state" data-ar="لا توجد منتجات في هذا القسم حالياً" data-en="No products in this category yet.">${lang() === "ar" ? "لا توجد منتجات في هذا القسم حالياً" : "No products in this category yet."}</div>`;
      return;
    }
    grid.innerHTML = products.map((product) => productCard(product)).join("");
    applyProductImageFallbacks(grid);
  }

  async function renderCategory() {
    const catId = getParam("cat");
    const { products, categories } = await dataBundle();
    const category = categories.find((item) => item.id === catId);
    const title = document.getElementById("category-title");
    const crumb = document.getElementById("category-crumb");
    const tabs = document.getElementById("subcategory-tabs");

    if (!category) {
      if (title) title.textContent = lang() === "ar" ? "القسم غير متاح" : "Category unavailable";
      renderCategoryProducts([]);
      return;
    }

    currentCategory = category;
    document.title = `${pick(category, "name")} | Samsung`;
    if (title) title.textContent = pick(category, "name");
    if (crumb) crumb.textContent = pick(category, "name");

    const activeProducts = filterProducts(products, category.id, currentSubcategory);
    if (tabs) {
      if (category.subcategories.length) {
        const allSelected = currentSubcategory === null;
        tabs.innerHTML = `
          <button class="pill ${allSelected ? "is-active" : ""}" data-subcategory="">${lang() === "ar" ? "الكل" : "All"}</button>
          ${category.subcategories
            .map(
              (subcategory) =>
                `<button class="pill ${currentSubcategory === subcategory.id ? "is-active" : ""}" data-subcategory="${subcategory.id}">${pick(subcategory, "name")}</button>`,
            )
            .join("")}
        `;
        tabs.hidden = false;
        tabs.querySelectorAll("button").forEach((button) => {
          button.addEventListener("click", () => {
            currentSubcategory = button.dataset.subcategory || null;
            renderCategory();
          });
        });
      } else {
        tabs.hidden = true;
      }
    }
    renderCategoryProducts(activeProducts);
  }

  function unavailableProduct() {
    const target = document.getElementById("product-detail");
    if (!target) return;
    document.title = lang() === "ar" ? "المنتج غير متاح" : "Product unavailable";
    target.innerHTML = `
      <section class="empty-state empty-state-large">
        <h1>${lang() === "ar" ? "هذا المنتج غير متاح" : "This product is no longer available"}</h1>
        <p>${lang() === "ar" ? "ربما تم حذف المنتج أو إخفاؤه من الكتالوج." : "The product may have been removed or hidden from the catalogue."}</p>
        <a class="button" href="index.html">${lang() === "ar" ? "العودة للرئيسية" : "Back to Home"}</a>
      </section>
    `;
  }

  async function renderProduct() {
    const sku = getParam("sku");
    const storeId = getParam("store") || sessionStorage.getItem("utm_store") || "";
    const { products, categories } = await dataBundle();
    const product = findProduct(products, sku);
    const target = document.getElementById("product-detail");
    if (!target) return;

    if (!product) {
      unavailableProduct();
      return;
    }

    currentProduct = product;
    document.title = `${pick(product, "shortTitle")} | Samsung`;
    const headerBack = document.getElementById("product-back");
    if (headerBack) headerBack.href = `category.html?cat=${encodeURIComponent(product.category)}`;
    const category = categories.find((item) => item.id === product.category);
    const subcategory = category?.subcategories.find((item) => item.id === product.subcategory);
    const related = getRelated(products, product.sku, product.subcategory, product.category);
    const highlights = (product.highlights || [])
      .map(
        (highlight) => `
          <article class="highlight-card">
            <h3>${pick(highlight, "title")}</h3>
            ${pick(highlight, "body") ? `<p>${pick(highlight, "body")}</p>` : ""}
          </article>
        `,
      )
      .join("");

    target.innerHTML = `
      <a class="back-link" href="category.html?cat=${encodeURIComponent(product.category)}">${lang() === "ar" ? "العودة للقسم" : "Back to category"}</a>
      <section class="product-detail-grid">
        <div class="product-copy">
          <h1>${pick(product, "title")}</h1>
          <p class="product-model">${modelMarkup(product.sku)}</p>
          <div class="quick-facts" aria-label="Product quick facts">
            <span>${product.sku}</span>
            <span>${category ? pick(category, "name") : product.category}</span>
            ${product.subcategory ? `<span>${subcategory ? pick(subcategory, "name") : product.subcategory}</span>` : ""}
          </div>
          <p class="product-description">${pick(product, "description")}</p>
        </div>
        <div class="product-media">
          <img class="product-hero-image" src="${product.imageUrl}" alt="${pick(product, "shortTitle")}" loading="lazy" data-fallback-title="${pick(product, "shortTitle")}">
        </div>
      </section>
      <section class="section-block">
        <h2>${lang() === "ar" ? "أبرز المزايا" : "Highlights"}</h2>
        <div class="highlight-grid">${highlights}</div>
      </section>
      <section class="section-block">
        <h2>${lang() === "ar" ? "قد يعجبك أيضاً" : "You May Also Like"}</h2>
        <div class="related-strip">${related.map((item) => productCard(item, storeId)).join("") || `<p class="muted">${lang() === "ar" ? "لا توجد منتجات مشابهة حالياً." : "No related products yet."}</p>`}</div>
      </section>
      <a class="button feedback-button" href="feedback.html?sku=${encodeURIComponent(product.sku)}">${lang() === "ar" ? "إرسال ملاحظة" : "Send Feedback"}</a>
    `;
    applyProductImageFallbacks(target);

    if (trackedSku !== product.sku && window.SamsungAnalytics) {
      trackedSku = product.sku;
      window.SamsungAnalytics.trackProductView(product.sku, getParam("store"));
    }
  }

  async function renderFeedback() {
    const { products, config } = await dataBundle();
    const sku = getParam("sku");
    const product = findProduct(products, sku);
    const context = document.getElementById("feedback-context");
    const frame = document.getElementById("feedback-frame");

    if (context && product) {
      context.textContent = `${pick(product, "shortTitle")} (${product.sku})`;
      context.hidden = false;
    }

    if (frame) {
      frame.src = config.feedbackFormUrl || "about:blank";
    }
  }

  async function initRoutePage() {
    const page = document.body.dataset.page;
    try {
      if (page === "home") await renderHome();
      if (page === "category") await renderCategory();
      if (page === "product") await renderProduct();
      if (page === "feedback") await renderFeedback();
    } catch (error) {
      const main = document.querySelector("main");
      if (main) {
        main.innerHTML = `<section class="empty-state empty-state-large"><h1>${lang() === "ar" ? "تعذر تحميل البيانات" : "Could not load data"}</h1><p>${error.message}</p></section>`;
      }
      console.error(error);
    }
  }

  document.addEventListener("DOMContentLoaded", initRoutePage);
  document.addEventListener("langchange", () => {
    currentCategory = currentCategory || null;
    const page = document.body.dataset.page;
    if (page === "home") renderHome();
    if (page === "category") renderCategory();
    if (page === "product" && currentProduct) renderProduct();
    if (page === "feedback") renderFeedback();
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
