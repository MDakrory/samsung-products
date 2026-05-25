(function () {
  const state = {
    loadedId: null,
  };

  function dataPath(file) {
    const inAdmin = window.location.pathname.includes("/admin/");
    return `${inAdmin ? "../" : ""}data/${file}`;
  }

  async function loadConfig() {
    try {
      const response = await fetch(dataPath("config.json"), { cache: "no-store" });
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      return null;
    }
  }

  function injectGtag(measurementId) {
    if (!measurementId || measurementId === "G-XXXXXXXXXX" || state.loadedId === measurementId) return;
    state.loadedId = measurementId;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", measurementId);
  }

  async function initAnalytics() {
    const config = await loadConfig();
    if (config?.googleAnalyticsMeasurementId) {
      injectGtag(config.googleAnalyticsMeasurementId);
    }
  }

  function trackProductView(sku, storeId) {
    if (typeof window.gtag === "undefined") return;
    window.gtag("event", "product_page_view", { product_sku: sku });
    if (storeId) {
      window.gtag("event", "store_qr_scan", {
        store_id: storeId,
        product_sku: sku,
        event_category: "QR Traffic",
      });
      sessionStorage.setItem("utm_store", storeId);
    }
  }

  window.SamsungAnalytics = {
    initAnalytics,
    trackProductView,
  };

  document.addEventListener("DOMContentLoaded", initAnalytics);
})();
