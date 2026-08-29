import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";

function ClientTopbar() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const name =
    user?.full_name ||
    user?.username ||
    t("client.member");

  const firstName = user?.first_name || name;

  const initials = String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <header className="client-topbar">
      <div className="client-topbar-intro">
        <span className="client-topbar-label">GYMSAAS CLUB</span>
        <strong>{t("client.hello", { name: firstName })}</strong>
      </div>

      <div className="client-topbar-actions">
        <LanguageSwitcher />

        <Link
          className="client-user-chip"
          to="/client/profile"
          data-no-auto-translate="true"
        >
          <span>{initials}</span>
          <div>
            <strong>{name}</strong>
            <small>{t("client.member")}</small>
          </div>
        </Link>
      </div>
    </header>
  );
}

export default ClientTopbar;
