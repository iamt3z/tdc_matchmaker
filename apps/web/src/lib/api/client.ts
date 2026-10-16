import axios, { AxiosError } from "axios";

/**
 * Axios client for the TDC Matchmaker API.
 *
 * Base URL follows the monorepo convention: API on port 4000 in development.
 * Override at runtime with NEXT_PUBLIC_API_URL if the host app provides it.
 * No secrets are hardcoded here.
 */
const baseURL =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:4000";

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30_000,
});

const TOKEN_KEY = "tdc_access_token";
const USER_KEY = "tdc_auth_user";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuth(token: string, user: unknown): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function getStoredUser<T = unknown>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorBody>;
    const body = axiosError.response?.data;
    if (body && typeof body === "object" && "error" in body && body.error?.message) {
      return body.error.message;
    }
    if (axiosError.response?.status === 401) {
      return "Authentication is required. Please sign in again.";
    }
    if (axiosError.message) return axiosError.message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Session invalid — clear local auth so protected routes redirect.
      const path = window.location.pathname;
      if (!path.startsWith("/login")) {
        clearStoredAuth();
      }
    }
    return Promise.reject(error);
  },
);
