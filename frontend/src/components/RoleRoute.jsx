import { Navigate, Outlet, useLocation } from "react-router";

import { useAuth } from "../context/AuthContext";
import { homeForUser, isAdmin, isMember } from "../services/roles";

function RoleRoute({ allow }) {
  const location = useLocation();
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="route-loader" role="status">Validation de votre session…</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to={allow === "admin" ? "/admin-login" : "/login"}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  const allowed = allow === "admin" ? isAdmin(user) : isMember(user);

  if (!allowed) {
    return <Navigate to={homeForUser(user)} replace />;
  }

  return <Outlet />;
}

export default RoleRoute;
