import { afterEach, beforeEach, describe, expect, it } from "vitest";

import api, { refreshApi } from "./api";

class StorageMock {
  constructor() { this.store = new Map(); }
  getItem(key) { return this.store.has(key) ? this.store.get(key) : null; }
  setItem(key, value) { this.store.set(key, String(value)); }
  removeItem(key) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

if (!globalThis.localStorage) globalThis.localStorage = new StorageMock();

const originalApiAdapter = api.defaults.adapter;
const originalRefreshAdapter = refreshApi.defaults.adapter;

function response(config, data = {}) {
  return { data, status: 200, statusText: "OK", headers: {}, config, request: {} };
}

function unauthorized(config) {
  const error = new Error("Unauthorized");
  error.config = config;
  error.response = { data: { detail: "Token non valide." }, status: 401, headers: {}, config };
  return error;
}

beforeEach(() => localStorage.clear());

afterEach(() => {
  api.defaults.adapter = originalApiAdapter;
  refreshApi.defaults.adapter = originalRefreshAdapter;
});

describe("intercepteurs Axios JWT", () => {
  it("envoie l'access token avec le schéma Bearer", async () => {
    localStorage.setItem("accessToken", "access-valide");
    api.defaults.adapter = async (config) => {
      expect(config.headers?.Authorization).toBe("Bearer access-valide");
      return response(config);
    };

    await api.get("/auth/me/");
  });

  it("n'envoie aucun token lorsque skipAuth est actif", async () => {
    localStorage.setItem("accessToken", "access-existant");
    localStorage.setItem("authToken", "ancien-token");
    api.defaults.adapter = async (config) => {
      expect(config.skipAuth).toBe(true);
      expect(config.headers?.Authorization).toBeUndefined();
      return response(config);
    };

    await api.post("/auth/login/", { username: "u", password: "p" }, { skipAuth: true });
  });

  it("supprime une ancienne session Token devenue incompatible", async () => {
    localStorage.setItem("authToken", "ancien-token");
    localStorage.setItem("authUser", JSON.stringify({ username: "monim" }));
    api.defaults.adapter = async (config) => {
      expect(config.headers?.Authorization).toBeUndefined();
      return response(config);
    };

    await api.get("/auth/me/", { skipAuth: true });

    expect(localStorage.getItem("authToken")).toBeNull();
    expect(localStorage.getItem("authUser")).toBeNull();
  });

  it("renouvelle le token puis rejoue une requête protégée une seule fois", async () => {
    localStorage.setItem("accessToken", "access-expire");
    localStorage.setItem("refreshToken", "refresh-initial");
    let apiCalls = 0;
    let refreshCalls = 0;

    api.defaults.adapter = async (config) => {
      apiCalls += 1;
      if (apiCalls === 1) throw unauthorized(config);
      expect(config._retry).toBe(true);
      expect(config.headers?.Authorization).toBe("Bearer access-renouvele");
      return response(config, { username: "monim" });
    };

    refreshApi.defaults.adapter = async (config) => {
      refreshCalls += 1;
      expect(JSON.parse(config.data)).toEqual({ refresh: "refresh-initial" });
      return response(config, { access: "access-renouvele", refresh: "refresh-tourne" });
    };

    const result = await api.get("/auth/me/");

    expect(result.data.username).toBe("monim");
    expect(apiCalls).toBe(2);
    expect(refreshCalls).toBe(1);
    expect(localStorage.getItem("accessToken")).toBe("access-renouvele");
    expect(localStorage.getItem("refreshToken")).toBe("refresh-tourne");
  });

  it("utilise le refresh token tourné si une déconnexion doit être rejouée", async () => {
    localStorage.setItem("accessToken", "access-expire");
    localStorage.setItem("refreshToken", "refresh-initial");
    let apiCalls = 0;

    api.defaults.adapter = async (config) => {
      apiCalls += 1;
      if (apiCalls === 1) throw unauthorized(config);
      expect(JSON.parse(config.data)).toEqual({ refresh: "refresh-tourne" });
      return response(config, { detail: "Déconnexion réussie." });
    };
    refreshApi.defaults.adapter = async (config) => response(
      config,
      { access: "access-renouvele", refresh: "refresh-tourne" },
    );

    await api.post("/auth/logout/", { refresh: "refresh-initial" });
    expect(apiCalls).toBe(2);
  });

  it("supprime toute la session si le refresh token est refusé", async () => {
    localStorage.setItem("accessToken", "access-expire");
    localStorage.setItem("refreshToken", "refresh-expire");
    localStorage.setItem("authUser", JSON.stringify({ username: "monim" }));
    localStorage.setItem("authToken", "ancien-token");

    api.defaults.adapter = async (config) => { throw unauthorized(config); };
    refreshApi.defaults.adapter = async (config) => { throw unauthorized(config); };

    await expect(api.get("/auth/me/")).rejects.toThrow("Unauthorized");
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(localStorage.getItem("authUser")).toBeNull();
    expect(localStorage.getItem("authToken")).toBeNull();
  });
});
