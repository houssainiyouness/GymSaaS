import { useTranslation } from "react-i18next";

import "../styles/language.css";

function LanguageSwitcher({ className = "" }) {
  const { i18n, t } = useTranslation();

  const language = String(i18n.resolvedLanguage || i18n.language || "fr").toLowerCase();

  function changeLanguage(nextLanguage) {
    i18n.changeLanguage(nextLanguage);
  }

  return (
    <div className={`language-switcher ${className}`.trim()} aria-label={t("common.languageChoice")}>
      <button
        type="button"
        className={language.startsWith("fr") ? "active" : ""}
        onClick={() => changeLanguage("fr")}
        aria-pressed={language.startsWith("fr")}
      >
        <span>FR</span>
        <small aria-hidden="true">🇫🇷</small>
      </button>

      <button
        type="button"
        className={language.startsWith("ar") ? "active" : ""}
        onClick={() => changeLanguage("ar")}
        aria-pressed={language.startsWith("ar")}
      >
        <span>العربية</span>
        <small aria-hidden="true">🇲🇦</small>
      </button>
    </div>
  );
}

export default LanguageSwitcher;
