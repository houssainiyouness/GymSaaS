export const ACCESS_TOKEN_KEY = "accessToken";
export const REFRESH_TOKEN_KEY = "refreshToken";
export const USER_KEY = "authUser";
export const LEGACY_TOKEN_KEY = "authToken";

export function getAccessToken() {
  const access = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (!access && localStorage.getItem(LEGACY_TOKEN_KEY)) {
    clearSession();
    return null;
  }

  return access;
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function saveTokens(access, refresh) {
  if (!access || !refresh) {
    throw new Error("La réponse d’authentification ne contient pas la paire JWT complète.");
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function saveSession(access, refresh, user) {
  saveTokens(access, refresh);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}
