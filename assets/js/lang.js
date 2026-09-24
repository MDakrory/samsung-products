const LANG_KEY = "samsung_lang";

function readStoredLang() {
  try {
    return localStorage.getItem(LANG_KEY);
  } catch (error) {
    return null;
  }
}

function hasStoredLang() {
  return Boolean(readStoredLang());
}

function getLang() {
  return readStoredLang() || document.documentElement.getAttribute("lang") || "ar";
}

function applyLanguage(lang, persist = true) {
  const nextLang = lang === "en" ? "en" : "ar";
  document.documentElement.setAttribute("lang", nextLang);
  document.documentElement.setAttribute("dir", nextLang === "ar" ? "rtl" : "ltr");

  document.querySelectorAll("[data-ar][data-en]").forEach((element) => {
    element.textContent = element.dataset[nextLang] || "";
  });
  document.querySelectorAll("[data-ar-placeholder]").forEach((element) => {
    element.placeholder = nextLang === "ar" ? element.dataset.arPlaceholder : element.dataset.enPlaceholder;
  });
  document.querySelectorAll("[data-ar-label]").forEach((element) => {
    element.setAttribute("aria-label", nextLang === "ar" ? element.dataset.arLabel : element.dataset.enLabel);
  });

  document.querySelectorAll("#lang-toggle, .js-lang-toggle").forEach((toggle) => {
    toggle.textContent = nextLang === "ar" ? "EN" : "عربي";
    toggle.setAttribute("aria-label", nextLang === "ar" ? "Switch to English" : "التبديل إلى العربية");
  });

  if (persist) {
    try {
      localStorage.setItem(LANG_KEY, nextLang);
    } catch (error) {
      /* storage unavailable */
    }
  }
  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: nextLang } }));
}

function initLang() {
  applyLanguage(getLang(), hasStoredLang());
  document.querySelectorAll("#lang-toggle, .js-lang-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => applyLanguage(getLang() === "ar" ? "en" : "ar"));
  });
}

document.addEventListener("DOMContentLoaded", initLang);
