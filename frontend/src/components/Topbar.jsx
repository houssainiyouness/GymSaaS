import { useTranslation } from "react-i18next";

import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";

import "../styles/dashboard-shell.css";

function Topbar({ onMenuClick }) {
  const { user } = useAuth();
  const { t } = useTranslation();

  const displayName =
    user?.full_name ||
    user?.first_name ||
    user?.username ||
    "Utilisateur";

  const initials = String(displayName)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const userRole = user?.role || "MEMBER";

  return (
    <header className="app-topbar">
      <button
        className="topbar-menu-btn"
        type="button"
        onClick={onMenuClick}
        aria-label="Menu"
      >
        <MenuIcon />
      </button>

      <div className="topbar-title">
        <strong>{t("topbar.managementSpace")}</strong>
        <span>{t("topbar.administration")}</span>
      </div>

      <LanguageSwitcher />

      <div className="topbar-user" data-no-auto-translate="true">
        <div className="topbar-avatar">{initials}</div>

        <div className="topbar-user-text">
          <strong>{displayName}</strong>
          <span>{t(`roles.${userRole}`)}</span>
        </div>
      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export default Topbar;
