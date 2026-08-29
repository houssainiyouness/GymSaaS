import api from "./api";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  saveSession,
} from "./session";

export function getToken() {
  return getAccessToken();
}

export { clearSession, getStoredUser, saveSession };

export async function login(username, password) {
  const response = await api.post(
    "/auth/login/",
    { username, password },
    { skipAuth: true },
  );

  saveSession(response.data.access, response.data.refresh, response.data.user);
  return response.data.user;
}

export async function register(payload) {
  const response = await api.post("/auth/register/", payload, { skipAuth: true });
  saveSession(response.data.access, response.data.refresh, response.data.user);
  return response.data.user;
}

export async function logout() {
  const refresh = getRefreshToken();

  try {
    if (getToken() && refresh) await api.post("/auth/logout/", { refresh });
  } finally {
    clearSession();
  }
}

export async function getCurrentUser() {
  const response = await api.get("/auth/me/");
  localStorage.setItem("authUser", JSON.stringify(response.data));
  return response.data;
}
