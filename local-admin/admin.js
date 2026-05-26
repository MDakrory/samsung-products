(function () {
  let products = [];
  let categories = [];
  let config = {};
  let qrItems = [];
  let debounceTimer = null;

  function lang() {
    return typeof getLang === "function" ? getLang() : "ar";
  }

  function t(ar, en) {
    return lang() === "ar" ? ar : en;
  }

  function pick(item, base) {
    return window.SamsungRouter?.pick(item, base) || item?.[`${base}${lang() === "ar" ? "Ar" : "En"}`] || "";
  }

  function dataPath(file) {
    return `../data/${file}`;
  }

  async function loadAdminData() {
    [products, categories, config] = await Promise.all([
      window.fetchJSON(dataPath("products.json")),
      window.fetchJSON(dataPath("categories.json")),
      window.fetchJSON(dataPath("config.json")),
    ]);
    products = JSON.parse(JSON.stringify(products));
  }

  function makeImageUrl(sku, category) {
    const code = (sku || "").replace(/[^A-Za-z0-9]/g, "");
    const categoryPaths = {
      washer: "home/laundry/washers",
      refrigerator: "home-appliances/refrigerators",
      "air-conditioner": "home-appliances/air-conditioners",
      dishwasher: "home-appliances/dishwashers",
      oven: "home-appliances/wall-ovens",
      microwave: "home-appliances/microwaves",
    };
    return `https://image-us.samsung.com/SamsungUS/${categoryPaths[category] || "home-appliances"}/${code}/${code}_001_Front.jpg`;
  }

  function showMessage(id, message, isError = false) {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = message;
    element.hidden = false;
    element.classList.toggle("error", isError);
  }

  function categoryName(id) {
    const category = categories.find((item) => item.id === id);
    return category ? pick(category, "name") : id || "";
  }

  function subcategoryName(categoryId, subcategoryId) {
    const category = categories.find((item) => item.id === categoryId);
    const subcategory = category?.subcategories.find((item) => item.id === subcategoryId);
    return subcategory ? pick(subcategory, "name") : subcategoryId || "";
  }

  function fillCategorySelect(select, includeAll = false) {
    if (!select) return;
    select.innerHTML = `${includeAll ? `<option value="">${t("كل الأقسام", "All Categories")}</option>` : ""}${categories
      .map((category) => `<option value="${category.id}">${pick(category, "name")}</option>`)
      .join("")}`;
  }

  function activateTab(name) {
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tabTarget === name);
    });
    document.querySelectorAll(".admin-panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.id === `tab-${name}`);
    });
  }

  function renderList() {
    const tbody = document.getElementById("admin-product-rows");
    if (!tbody) return;
    const query = (document.getElementById("admin-search")?.value || "").trim().toLowerCase();
    const categoryFilter = document.getElementById("admin-category-filter")?.value || "";
    const filtered = products.filter((product) => {
      const haystack = `${product.sku} ${product.shortTitleAr} ${product.shortTitleEn} ${product.titleAr} ${product.titleEn}`.toLowerCase();
      return (!query || haystack.includes(query)) && (!categoryFilter || product.category === categoryFilter);
    });

    tbody.innerHTML = filtered
      .map((product) => {
        const index = products.indexOf(product);
        return `
          <tr data-index="${index}">
            <td>${product.sku}</td>
            <td>${product.shortTitleAr || product.titleAr || product.shortTitleEn}</td>
            <td>${categoryName(product.category)}</td>
            <td>${subcategoryName(product.category, product.subcategory)}</td>
            <td>
              <label class="switch">
                <input class="active-toggle" type="checkbox" ${product.active !== false ? "checked" : ""}>
                <span></span>
              </label>
            </td>
            <td>
              <button class="button button-small edit-product" type="button">${t("تعديل", "Edit")}</button>
              <button class="button button-danger button-small delete-product" type="button">${t("حذف", "Delete")}</button>
            </td>
          </tr>
        `;
      })
      .join("");

    tbody.querySelectorAll("tr").forEach((row) => {
      const index = Number(row.dataset.index);
      row.querySelector(".active-toggle").addEventListener("change", (event) => {
        products[index].active = event.target.checked;
      });
      row.querySelector(".edit-product").addEventListener("click", () => {
        fillForm(index);
        activateTab("form");
      });
      row.querySelector(".delete-product").addEventListener("click", () => {
        if (window.confirm(t("هل أنت متأكد؟", "Are you sure?"))) {
          products.splice(index, 1);
          renderList();
        }
      });
    });
  }

  function renderSubcategories(selected = "") {
    const categoryId = document.getElementById("category")?.value;
    const select = document.getElementById("subcategory");
    const category = categories.find((item) => item.id === categoryId);
    if (!select) return;
    select.innerHTML = `<option value="">${t("بدون", "None")}</option>${(category?.subcategories || [])
      .map((subcategory) => `<option value="${subcategory.id}">${pick(subcategory, "name")}</option>`)
      .join("")}`;
    select.value = selected || "";
  }

  function highlightRow(highlight = {}) {
    const wrapper = document.createElement("div");
    wrapper.className = "highlight-row";
    wrapper.innerHTML = `
      <label class="field">
        <span>${t("عنوان عربي", "Title AR")}</span>
        <input class="highlight-title-ar" value="${escapeAttr(highlight.titleAr || "")}">
      </label>
      <label class="field">
        <span>${t("عنوان إنجليزي", "Title EN")}</span>
        <input class="highlight-title-en" value="${escapeAttr(highlight.titleEn || "")}">
      </label>
      <label class="field">
        <span>${t("نص عربي", "Body AR")}</span>
        <textarea class="highlight-body-ar">${escapeHtml(highlight.bodyAr || "")}</textarea>
      </label>
      <label class="field">
        <span>${t("نص إنجليزي", "Body EN")}</span>
        <textarea class="highlight-body-en">${escapeHtml(highlight.bodyEn || "")}</textarea>
      </label>
      <button class="button button-danger button-small remove-highlight" type="button">${t("حذف", "Remove")}</button>
    `;
    wrapper.querySelector(".remove-highlight").addEventListener("click", () => wrapper.remove());
    return wrapper;
  }

  function renderHighlights(highlights = [{}]) {
    const editor = document.getElementById("highlight-editor");
    if (!editor) return;
    editor.innerHTML = "";
    highlights.forEach((highlight) => editor.appendChild(highlightRow(highlight)));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }

  function resetForm() {
    const form = document.getElementById("product-form");
    if (!form) return;
    form.reset();
    document.getElementById("edit-index").value = "";
    document.getElementById("active").checked = true;
    document.getElementById("category").value = categories[0]?.id || "";
    renderSubcategories();
    renderHighlights([{}]);
    document.getElementById("form-message").hidden = true;
  }

  function fillForm(index) {
    const product = products[index];
    if (!product) return;
    document.getElementById("edit-index").value = index;
    [
      "sku",
      "titleAr",
      "titleEn",
      "shortTitleAr",
      "shortTitleEn",
      "descriptionAr",
      "descriptionEn",
      "imageUrl",
    ].forEach((id) => {
      document.getElementById(id).value = product[id] || "";
    });
    document.getElementById("category").value = product.category || "";
    renderSubcategories(product.subcategory);
    document.getElementById("active").checked = product.active !== false;
    renderHighlights(product.highlights?.length ? product.highlights : [{}]);
  }

  function collectProduct() {
    const editIndex = document.getElementById("edit-index").value;
    const sku = document.getElementById("sku").value.trim();
    const category = document.getElementById("category").value;
    const subcategory = document.getElementById("subcategory").value;
    const titleAr = document.getElementById("titleAr").value.trim();
    const titleEn = document.getElementById("titleEn").value.trim();
    const duplicate = products.some((product, index) => product.sku === sku && String(index) !== editIndex);

    if (!sku || !category || !titleAr || !titleEn) {
      throw new Error(t("يرجى تعبئة SKU والقسم والعنوانين.", "Please fill SKU, category, and both titles."));
    }
    if (duplicate) {
      throw new Error(t("SKU مستخدم مسبقاً.", "SKU must be unique."));
    }

    const highlights = Array.from(document.querySelectorAll(".highlight-row"))
      .map((row) => ({
        titleAr: row.querySelector(".highlight-title-ar").value.trim(),
        titleEn: row.querySelector(".highlight-title-en").value.trim(),
        bodyAr: row.querySelector(".highlight-body-ar").value.trim(),
        bodyEn: row.querySelector(".highlight-body-en").value.trim(),
      }))
      .filter((highlight) => highlight.titleAr || highlight.titleEn || highlight.bodyAr || highlight.bodyEn);

    if (!highlights.length) {
      throw new Error(t("أضف ميزة واحدة على الأقل.", "Add at least one highlight."));
    }

    return {
      sku,
      active: document.getElementById("active").checked,
      category,
      subcategory,
      titleAr,
      titleEn,
      shortTitleAr: document.getElementById("shortTitleAr").value.trim(),
      shortTitleEn: document.getElementById("shortTitleEn").value.trim(),
      descriptionAr: document.getElementById("descriptionAr").value.trim(),
      descriptionEn: document.getElementById("descriptionEn").value.trim(),
      highlights,
      imageUrl: document.getElementById("imageUrl").value.trim() || makeImageUrl(sku, category),
      addedDate: editIndex ? products[Number(editIndex)].addedDate : new Date().toISOString().slice(0, 10),
    };
  }

  function downloadProductsJson() {
    const blob = new Blob([JSON.stringify(products, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "products.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function toBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  async function publishToGitHub() {
    const repo = document.getElementById("github-repo").value.trim();
    const token = document.getElementById("github-token").value.trim();
    if (!repo || !token) {
      showMessage("publish-message", t("أدخل المستودع ورمز الوصول.", "Enter repository and token."), true);
      return;
    }
    localStorage.setItem("samsung_github_repo", repo);
    localStorage.setItem("samsung_github_token", token);

    const apiUrl = `https://api.github.com/repos/${repo}/contents/data/products.json`;
    try {
      const current = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
      });
      const currentJson = current.ok ? await current.json() : {};
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Update products.json from admin panel",
          content: toBase64(JSON.stringify(products, null, 2)),
          sha: currentJson.sha,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "GitHub API error");
      showMessage("publish-message", t("تم النشر! سيتم تحديث الموقع خلال دقيقة تقريباً.", "Published! Site will update in ~1 minute."));
    } catch (error) {
      showMessage("publish-message", error.message, true);
    }
  }

  async function initManage() {
    await loadAdminData();
    fillCategorySelect(document.getElementById("admin-category-filter"), true);
    fillCategorySelect(document.getElementById("category"));
    renderSubcategories();
    renderHighlights([{}]);
    renderList();

    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", () => activateTab(button.dataset.tabTarget));
    });
    document.getElementById("admin-search").addEventListener("input", renderList);
    document.getElementById("admin-category-filter").addEventListener("change", renderList);
    document.getElementById("new-product-btn").addEventListener("click", () => {
      resetForm();
      activateTab("form");
    });
    document.getElementById("category").addEventListener("change", () => {
      renderSubcategories();
      const imageInput = document.getElementById("imageUrl");
      if (!imageInput.value && document.getElementById("sku").value.trim()) {
        imageInput.value = makeImageUrl(document.getElementById("sku").value.trim(), document.getElementById("category").value);
      }
    });
    document.getElementById("sku").addEventListener("input", () => {
      const imageInput = document.getElementById("imageUrl");
      if (!imageInput.value) imageInput.value = makeImageUrl(document.getElementById("sku").value.trim(), document.getElementById("category").value);
    });
    document.getElementById("add-highlight-btn").addEventListener("click", () => {
      document.getElementById("highlight-editor").appendChild(highlightRow({}));
    });
    document.getElementById("reset-form-btn").addEventListener("click", resetForm);
    document.getElementById("product-form").addEventListener("submit", (event) => {
      event.preventDefault();
      try {
        const product = collectProduct();
        const editIndex = document.getElementById("edit-index").value;
        if (editIndex) products[Number(editIndex)] = product;
        else products.unshift(product);
        showMessage("form-message", t("تم حفظ المنتج في الذاكرة. انتقل إلى حفظ ونشر لتحديث الملف.", "Product saved in memory. Go to Save & Publish to update the file."));
        renderList();
        activateTab("list");
      } catch (error) {
        showMessage("form-message", error.message, true);
      }
    });
    document.getElementById("download-json-btn").addEventListener("click", downloadProductsJson);
    document.getElementById("publish-github-btn").addEventListener("click", publishToGitHub);
    document.getElementById("github-repo").value = localStorage.getItem("samsung_github_repo") || config.githubRepo || "";
    document.getElementById("github-token").value = localStorage.getItem("samsung_github_token") || config.githubToken || "";
  }

  function defaultBaseUrl() {
    if (config.baseSiteUrl) return config.baseSiteUrl;
    const path = window.location.pathname
      .replace(/\/(?:admin|local-admin)\/qr-generator\.html$/, "/")
      .replace(/\/(?:admin|local-admin)\/$/, "/");
    return `${window.location.origin}${path}`.replace(/\/$/, "");
  }

  function normalizeBase(value) {
    return (value || defaultBaseUrl()).replace(/\/+$/, "");
  }

  function productQrUrl(product, storeId, baseUrl) {
    const params = new URLSearchParams({ sku: product.sku });
    if (storeId) params.set("store", storeId);
    return `${normalizeBase(baseUrl)}/product.html?${params.toString()}`;
  }

  async function generateQrCodes() {
    const grid = document.getElementById("qr-grid");
    const storeId = document.getElementById("store-id").value.trim();
    const baseUrl = document.getElementById("base-url").value.trim();
    const category = document.getElementById("qr-category").value;
    const activeOnly = document.getElementById("active-only").checked;
    if (!grid) return;
    if (!storeId) {
      showMessage("qr-message", "Enter a Store ID.", true);
      return;
    }
    const selected = products.filter((product) => (!category || product.category === category) && (!activeOnly || product.active !== false));
    qrItems = [];
    grid.innerHTML = "";

    for (const product of selected) {
      const url = productQrUrl(product, storeId, baseUrl);
      const dataUrl = window.QRCode?.toDataURL
        ? await window.QRCode.toDataURL(url, { width: 256, margin: 1 })
        : fallbackQrToDataURL(url);
      qrItems.push({ sku: product.sku, storeId, dataUrl });
      const tile = document.createElement("article");
      tile.className = "qr-tile";
      tile.innerHTML = `
        <strong>${product.shortTitleAr || product.shortTitleEn || product.sku}</strong>
        <img src="${dataUrl}" alt="QR ${product.sku}">
        <span class="qr-url">${url}</span>
        <a class="button button-small" download="${product.sku.replace(/[^A-Za-z0-9_-]/g, "")}_${storeId}.png" href="${dataUrl}">Download PNG</a>
      `;
      grid.appendChild(tile);
    }
    showMessage("qr-message", `${selected.length} QR codes generated.`);
  }

  async function downloadQrZip() {
    if (!qrItems.length) {
      showMessage("qr-message", "Generate QR codes first.", true);
      return;
    }
    if (!window.JSZip) {
      showMessage("qr-message", "JSZip library did not load.", true);
      return;
    }
    const zip = new window.JSZip();
    qrItems.forEach((item) => {
      const cleanSku = item.sku.replace(/[^A-Za-z0-9_-]/g, "");
      zip.file(`${cleanSku}_${item.storeId}.png`, item.dataUrl.split(",")[1], { base64: true });
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `qr_codes_${qrItems[0].storeId}.zip`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function fallbackQrToDataURL(text) {
    const matrix = createFixedQrMatrix(text);
    const moduleSize = 6;
    const quiet = 4;
    const size = matrix.length;
    const canvas = document.createElement("canvas");
    canvas.width = (size + quiet * 2) * moduleSize;
    canvas.height = canvas.width;
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#000000";
    matrix.forEach((row, y) => {
      row.forEach((dark, x) => {
        if (dark) {
          context.fillRect((x + quiet) * moduleSize, (y + quiet) * moduleSize, moduleSize, moduleSize);
        }
      });
    });
    return canvas.toDataURL("image/png");
  }

  function createFixedQrMatrix(text) {
    const version = 6;
    const size = 17 + version * 4;
    const dataCodewords = 136;
    const eccPerBlock = 18;
    const blockCount = 2;
    const bytes = Array.from(new TextEncoder().encode(text));
    if (bytes.length > 134) {
      throw new Error("QR URL is too long for the offline fallback. Shorten the base URL or use the CDN QR library.");
    }

    const bits = [0, 1, 0, 0];
    appendBits(bits, bytes.length, 8);
    bytes.forEach((byte) => appendBits(bits, byte, 8));
    appendBits(bits, 0, Math.min(4, dataCodewords * 8 - bits.length));
    while (bits.length % 8) bits.push(0);

    const data = [];
    for (let index = 0; index < bits.length; index += 8) {
      data.push(bits.slice(index, index + 8).reduce((value, bit) => (value << 1) | bit, 0));
    }
    for (let pad = 0xec; data.length < dataCodewords; pad ^= 0xfd) {
      data.push(pad);
    }

    const blocks = [];
    for (let block = 0; block < blockCount; block += 1) {
      const chunk = data.slice(block * 68, block * 68 + 68);
      blocks.push({ data: chunk, ecc: reedSolomonRemainder(chunk, eccPerBlock) });
    }

    const codewords = [];
    for (let index = 0; index < 68; index += 1) blocks.forEach((block) => codewords.push(block.data[index]));
    for (let index = 0; index < eccPerBlock; index += 1) blocks.forEach((block) => codewords.push(block.ecc[index]));

    const modules = Array.from({ length: size }, () => Array(size).fill(false));
    const isFunction = Array.from({ length: size }, () => Array(size).fill(false));
    const setFunction = (x, y, dark) => {
      if (x >= 0 && y >= 0 && x < size && y < size) {
        modules[y][x] = dark;
        isFunction[y][x] = true;
      }
    };

    drawFinder(setFunction, 3, 3);
    drawFinder(setFunction, size - 4, 3);
    drawFinder(setFunction, 3, size - 4);
    drawAlignment(setFunction, 34, 34);
    for (let i = 0; i < size; i += 1) {
      if (!isFunction[6][i]) setFunction(i, 6, i % 2 === 0);
      if (!isFunction[i][6]) setFunction(6, i, i % 2 === 0);
    }
    drawFormatBits(setFunction, size, 0);

    const dataBits = [];
    codewords.forEach((codeword) => appendBits(dataBits, codeword, 8));
    let bitIndex = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vertical = 0; vertical < size; vertical += 1) {
        for (let offset = 0; offset < 2; offset += 1) {
          const x = right - offset;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? size - 1 - vertical : vertical;
          if (!isFunction[y][x] && bitIndex < dataBits.length) {
            const mask = (x + y) % 2 === 0;
            modules[y][x] = Boolean(dataBits[bitIndex]) !== mask;
            bitIndex += 1;
          }
        }
      }
    }
    drawFormatBits(setFunction, size, 0);
    return modules;
  }

  function appendBits(bits, value, length) {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
  }

  function drawFinder(setFunction, centerX, centerY) {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        setFunction(centerX + dx, centerY + dy, distance !== 2 && distance !== 4);
      }
    }
  }

  function drawAlignment(setFunction, centerX, centerY) {
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        setFunction(centerX + dx, centerY + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  function drawFormatBits(setFunction, size, mask) {
    const data = (1 << 3) | mask;
    let remainder = data;
    for (let i = 0; i < 10; i += 1) {
      remainder = (remainder << 1) ^ (((remainder >>> 9) & 1) ? 0x537 : 0);
    }
    const bits = ((data << 10) | remainder) ^ 0x5412;
    const bit = (index) => ((bits >>> index) & 1) !== 0;
    for (let i = 0; i <= 5; i += 1) setFunction(8, i, bit(i));
    setFunction(8, 7, bit(6));
    setFunction(8, 8, bit(7));
    setFunction(7, 8, bit(8));
    for (let i = 9; i < 15; i += 1) setFunction(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i += 1) setFunction(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i += 1) setFunction(8, size - 15 + i, bit(i));
    setFunction(8, size - 8, true);
  }

  function reedSolomonRemainder(data, degree) {
    const generator = reedSolomonGenerator(degree);
    const result = Array(degree).fill(0);
    data.forEach((byte) => {
      const factor = byte ^ result.shift();
      result.push(0);
      generator.forEach((coefficient, index) => {
        result[index] ^= finiteMultiply(coefficient, factor);
      });
    });
    return result;
  }

  function reedSolomonGenerator(degree) {
    const result = Array(degree).fill(0);
    result[degree - 1] = 1;
    let root = 1;
    for (let i = 0; i < degree; i += 1) {
      for (let j = 0; j < result.length; j += 1) {
        result[j] = finiteMultiply(result[j], root);
        if (j + 1 < result.length) result[j] ^= result[j + 1];
      }
      root = finiteMultiply(root, 2);
    }
    return result;
  }

  function finiteMultiply(left, right) {
    let product = 0;
    for (let i = 7; i >= 0; i -= 1) {
      product = (product << 1) ^ ((product >>> 7) * 0x11d);
      product ^= ((right >>> i) & 1) * left;
    }
    return product & 0xff;
  }

  async function initQr() {
    await loadAdminData();
    fillCategorySelect(document.getElementById("qr-category"), true);
    document.getElementById("base-url").value = defaultBaseUrl();
    document.getElementById("generate-qr-btn").addEventListener("click", generateQrCodes);
    document.getElementById("download-zip-btn").addEventListener("click", downloadQrZip);
    ["store-id", "base-url", "qr-category", "active-only"].forEach((id) => {
      document.getElementById(id).addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (document.getElementById("store-id").value.trim()) generateQrCodes();
        }, 500);
      });
      document.getElementById(id).addEventListener("change", () => {
        if (document.getElementById("store-id").value.trim()) generateQrCodes();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;
    if (page === "admin-manage") initManage().catch((error) => showMessage("form-message", error.message, true));
    if (page === "admin-qr") initQr().catch((error) => showMessage("qr-message", error.message, true));
  });

  document.addEventListener("langchange", () => {
    const page = document.body.dataset.page;
    if (page === "admin-manage" && products.length) {
      fillCategorySelect(document.getElementById("admin-category-filter"), true);
      fillCategorySelect(document.getElementById("category"));
      renderSubcategories(document.getElementById("subcategory")?.value || "");
      renderList();
    }
    if (page === "admin-qr" && categories.length) {
      fillCategorySelect(document.getElementById("qr-category"), true);
    }
  });
})();
