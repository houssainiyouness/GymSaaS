import axios from "axios";

import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "./session";


const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "/api";


/*
 * Ne pas forcer Content-Type ici.
 *
 * Axios choisira automatiquement :
 * - application/json pour les objets JS
 * - multipart/form-data pour FormData
 *
 * C'est indispensable pour l'upload
 * des photos des coachs.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
});


export const refreshApi =
  axios.create({
    baseURL: API_BASE_URL,

    headers: {
      "Content-Type":
        "application/json",
    },
  });


let refreshPromise = null;


function notifyExpiredSession() {
  if (
    typeof window !==
    "undefined"
  ) {
    window.dispatchEvent(
      new Event(
        "gymsaas:auth-expired",
      ),
    );
  }
}


async function renewAccessToken() {
  const refresh =
    getRefreshToken();

  if (!refresh) {
    throw new Error(
      "Refresh token absent.",
    );
  }


  const response =
    await refreshApi.post(
      "/auth/token/refresh/",
      {
        refresh,
      },
    );


  const nextAccess =
    response.data?.access;

  const nextRefresh =
    response.data?.refresh ||
    refresh;


  if (!nextAccess) {
    throw new Error(
      "Access token absent de la réponse.",
    );
  }


  saveTokens(
    nextAccess,
    nextRefresh,
  );


  return nextAccess;
}


api.interceptors.request.use(
  (config) => {
    const token =
      getAccessToken();


    if (
      token &&
      !config.skipAuth
    ) {
      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }


    /*
     * Important :
     * si data est FormData,
     * on laisse le navigateur
     * définir le Content-Type
     * et la boundary.
     */
    if (
      typeof FormData !==
        "undefined" &&
      config.data instanceof
        FormData
    ) {
      if (config.headers) {
        delete config.headers[
          "Content-Type"
        ];
      }
    }


    return config;
  },

  (error) =>
    Promise.reject(error),
);


api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const status =
      error.response?.status;

    const originalRequest =
      error.config;

    const skipAuth =
      Boolean(
        originalRequest
          ?.skipAuth,
      );


    if (
      status !== 401 ||
      skipAuth ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(
        error,
      );
    }


    originalRequest._retry =
      true;


    try {
      if (!refreshPromise) {
        refreshPromise =
          renewAccessToken()
            .finally(() => {
              refreshPromise =
                null;
            });
      }


      const access =
        await refreshPromise;


      originalRequest.headers =
        originalRequest.headers ||
        {};

      originalRequest
        .headers
        .Authorization =
        `Bearer ${access}`;


      if (
        String(
          originalRequest.url,
        ).includes(
          "/auth/logout/",
        )
      ) {
        originalRequest.data =
          JSON.stringify({
            refresh:
              getRefreshToken(),
          });
      }


      return await api(
        originalRequest,
      );

    } catch {
      clearSession();

      notifyExpiredSession();

      return Promise.reject(
        error,
      );
    }
  },
);


export function extractList(
  response,
) {
  const data =
    response?.data;


  if (Array.isArray(data)) {
    return data;
  }


  if (
    Array.isArray(
      data?.results,
    )
  ) {
    return data.results;
  }


  return [];
}


export function getApiError(
  error,
  fallback =
    "Une erreur est survenue.",
) {
  const data =
    error?.response?.data;


  if (!data) {
    return error?.message ===
      "Network Error"
      ? "Impossible de joindre le serveur. Vérifiez que Django est lancé."
      : fallback;
  }


  if (
    typeof data === "string"
  ) {
    return data;
  }


  if (
    typeof data.detail ===
    "string"
  ) {
    return data.detail;
  }


  for (
    const value of
    Object.values(data)
  ) {
    if (
      Array.isArray(value) &&
      value.length
    ) {
      return String(
        value[0],
      );
    }


    if (
      typeof value ===
      "string"
    ) {
      return value;
    }
  }


  return fallback;
}


export function getFieldErrors(
  error,
) {
  const data =
    error?.response?.data;


  if (
    !data ||
    typeof data !==
      "object" ||
    Array.isArray(data)
  ) {
    return {};
  }


  return Object.fromEntries(
    Object.entries(data).map(
      ([
        key,
        value,
      ]) => [
        key,

        Array.isArray(value)
          ? value.join(" ")
          : String(value),
      ],
    ),
  );
}


export default api;