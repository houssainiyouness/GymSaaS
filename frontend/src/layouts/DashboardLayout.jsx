import { useState } from "react";
import { Outlet } from "react-router";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "../styles/dashboard-shell.css";

function DashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="dashboard-shell">
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      {menuOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="dashboard-content">
        <Topbar
          onMenuClick={() => setMenuOpen(true)}
        />

        <main className="dashboard-outlet">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;