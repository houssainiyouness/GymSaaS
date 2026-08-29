import { Outlet } from "react-router";

import ClientSidebar from "../components/ClientSidebar";
import ClientTopbar from "../components/ClientTopbar";
import "../styles/client-shell.css";

function ClientLayout() {
  return (
    <div className="client-shell">
      <ClientSidebar />
      <div className="client-main">
        <ClientTopbar />
        <main className="client-outlet">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default ClientLayout;
