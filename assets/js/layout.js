(function () {
  const ICONS = {
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  };

  const headerHtml = `
    <a class="skip-link" href="#main" data-ar="تخطَّ إلى المحتوى" data-en="Skip to content">تخطَّ إلى المحتوى</a>
    <header class="site-header">
      <div class="container header-inner">
        <a class="logo" href="index.html" aria-label="Samsung">
          <img src="assets/samsung-logo.svg" alt="Samsung" width="130" height="29">
        </a>
        <nav class="header-nav" aria-label="Main">
          <a href="index.html" data-nav="home" data-ar="الرئيسية" data-en="Home">الرئيسية</a>
          <a href="index.html#categories" data-nav="categories" data-ar="الأقسام" data-en="Categories">الأقسام</a>
          <a href="feedback.html" class="js-feedback-link" data-nav="feedback" hidden data-ar="آراؤكم تهمنا" data-en="Feedback">آراؤكم تهمنا</a>
        </nav>
        <div class="header-actions">
          <button class="icon-button js-search-open" type="button" hidden data-ar-label="بحث" data-en-label="Search" aria-label="بحث">${ICONS.search}</button>
          <button class="lang-toggle js-lang-toggle" type="button">EN</button>
        </div>
      </div>
    </header>
    <div class="search-overlay" id="search-overlay" hidden>
      <div class="search-panel" role="dialog" aria-modal="true" aria-label="Search">
        <div class="search-bar">
          ${ICONS.search}
          <input id="search-input" type="search" autocomplete="off" enterkeyhint="search"
            data-ar-placeholder="ابحث باسم المنتج أو رقم الموديل" data-en-placeholder="Search by product name or model">
          <button class="icon-button js-search-close" type="button" data-ar-label="إغلاق" data-en-label="Close" aria-label="إغلاق">${ICONS.close}</button>
        </div>
        <div id="search-results" class="search-results" aria-live="polite"></div>
      </div>
    </div>
  `;

  const footerHtml = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-top">
          <div class="footer-brand">
            <img src="assets/samsung-logo.svg" alt="Samsung" width="110" height="25">
            <p data-ar="دليل منتجات الأجهزة المنزلية من سامسونج" data-en="Samsung home appliance product guide">دليل منتجات الأجهزة المنزلية من سامسونج</p>
          </div>
          <nav class="footer-links" aria-label="Categories">
            <h2 data-ar="الأقسام" data-en="Categories">الأقسام</h2>
            <div id="footer-categories"></div>
          </nav>
          <nav class="footer-links" aria-label="Help">
            <h2 data-ar="روابط" data-en="Links">روابط</h2>
            <div>
              <a href="index.html" data-ar="الرئيسية" data-en="Home">الرئيسية</a>
              <a href="feedback.html" class="js-feedback-link" hidden data-ar="آراؤكم تهمنا" data-en="Feedback">آراؤكم تهمنا</a>
            </div>
          </nav>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()}</span>
          <span data-ar="سامسونج — دليل المنتجات" data-en="Samsung — Product Guide">سامسونج — دليل المنتجات</span>
        </div>
      </div>
    </footer>
  `;

  const header = document.getElementById("site-header");
  if (header) header.outerHTML = headerHtml;
  const footer = document.getElementById("site-footer");
  if (footer) footer.outerHTML = footerHtml;

  const page = document.body.dataset.page;
  const active = page === "feedback" ? "feedback" : page === "home" ? "home" : "";
  if (active) document.querySelector(`.header-nav [data-nav="${active}"]`)?.setAttribute("aria-current", "page");
})();
