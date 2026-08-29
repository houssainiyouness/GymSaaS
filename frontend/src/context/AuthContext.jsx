import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  clearSession,
  getCurrentUser,
  getStoredUser,
  getToken,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(Boolean(getToken()));

  const validateSession = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const current = await getCurrentUser();
      setUser(current);
    } catch {
      clearSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  useEffect(() => {
    const expire = () => {
      setUser(null);
      setLoading(false);
    };
    window.addEventListener("gymsaas:auth-expired", expire);
    return () => window.removeEventListener("gymsaas:auth-expired", expire);
  }, []);

  const login = useCallback(async (username, password) => {
    const nextUser = await loginRequest(username, password);
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback(async (payload) => {
    const nextUser = await registerRequest(payload);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser: validateSession,
      isAuthenticated: Boolean(user && getToken()),
    }),
    [user, loading, login, register, logout, validateSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return context;
}
