import { NavLink, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { useAuth } from "../context/AuthContext";

const links = [
  ["/client", "clientNavigation.home", "home"],
  ["/client/subscription", "clientNavigation.subscription", "calendar"],
  ["/client/payments", "clientNavigation.payments", "card"],
  ["/client/attendances", "clientNavigation.attendances", "activity"],
  ["/client/qr-code", "clientNavigation.qr", "qr"],
  ["/client/profile", "clientNavigation.profile", "user"],
];

function ClientSidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useTranslation();

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <aside className="client-sidebar">
      <div className="client-brand">
        <strong>
          GYM<span>SAAS</span>
        </strong>
        <small>{t("clientNavigation.memberSpace")}</small>
      </div>

      <nav className="client-nav">
        {links.map(([to, translationKey, icon]) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/client"}
            className={({ isActive }) =>
              `client-nav-link ${isActive ? "active" : ""}`
            }
          >
            <ClientIcon name={icon} />
            <span>{t(translationKey)}</span>
          </NavLink>
        ))}
      </nav>

      <button className="client-logout" type="button" onClick={handleLogout}>
        <ClientIcon name="logout" />
        <span>{t("navigation.logout")}</span>
      </button>
    </aside>
  );
}

function ClientIcon({ name }) {
  const content = {
    home: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h14v-9.5M9 20v-6h6v6"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></>,
    activity: <><path d="M3 12h4l2-5 4 10 2-5h6"/></>,
    qr: <><rect x="3" y="3" width="6" height="6"/><rect x="15" y="3" width="6" height="6"/><rect x="3" y="15" width="6" height="6"/><path d="M15 15h2v2h-2zM19 15h2v6h-2M15 19h2v2h-2"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></>,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {content[name]}
    </svg>
  );
}

export default ClientSidebar;
