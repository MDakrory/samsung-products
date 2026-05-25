const LANG_KEY = "samsung_lang";

function getLang() {
  return localStorage.getItem(LANG_KEY) || "ar";
}

function applyLanguage(lang) {
  const nextLang = lang === "en" ? "en" : "ar";
  document.documentElement.setAttribute("lang", nextLang);
  document.documentElement.setAttribute("dir", nextLang === "ar" ? "rtl" : "ltr");

  document.querySelectorAll("[data-ar][data-en]").forEach((element) => {
    element.textContent = element.dataset[nextLang] || "";
  });

  const toggle = document.getElementById("lang-toggle");
  if (toggle) {
    toggle.textContent = nextLang === "ar" ? "EN" : "عربي";
    toggle.setAttribute("aria-label", nextLang === "ar" ? "Switch to English" : "التبديل إلى العربية");
  }

  localStorage.setItem(LANG_KEY, nextLang);
  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: nextLang } }));
}

function initLang() {
  applyLanguage(getLang());
  document.getElementById("lang-toggle")?.addEventListener("click", () => {
    applyLanguage(getLang() === "ar" ? "en" : "ar");
  });
}

document.addEventListener("DOMContentLoaded", initLang);
