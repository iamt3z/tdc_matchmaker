import { apiClient, setStoredAuth, clearStoredAuth } from "./client";
import type { ApiSuccess, LoginResponse } from "./types";

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiSuccess<LoginResponse>>(
    "/api/auth/login",
    { username, password },
  );

  if (!data.success || !data.data) {
    throw new Error("Login failed");
  }

  const result = data.data;
  if (result.accessToken) {
    setStoredAuth(result.accessToken, result.user);
  }

  return result;
}

export function logout(): void {
  clearStoredAuth();
}
