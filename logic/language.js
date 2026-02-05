import { translations } from "./i18n.js";

let currentLang = localStorage.getItem("lang") || "pt-BR";

export function getTranslation(key) {
    return translations[currentLang][key] || key;
}

export function setLanguage(lang) {
    if (!translations[lang]) return;

    currentLang = lang;
    localStorage.setItem("lang", lang);
    applyLanguageToDOM();
}

export function applyLanguageToDOM() {
    // 1. Static Elements with data-i18n
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (translations[currentLang][key]) {
            el.innerText = translations[currentLang][key];
        }
    });

    // 2. Placeholders (Inputs)
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (translations[currentLang][key]) {
            el.placeholder = translations[currentLang][key];
        }
    });
}

// Inicializa ao carregar
document.addEventListener("DOMContentLoaded", () => {
    applyLanguageToDOM();
});

// Expose globally for HTML buttons if needed (though app.js should handle it)
window.setLang = setLanguage;
