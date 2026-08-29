import { Navigate, Outlet } from "react-router";

import { useAuth } from "../context/AuthContext";

function ProtectedRoute() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) return <div className="route-loader">Validation de votre session…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export default ProtectedRoute;
