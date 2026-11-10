import type { Category, CurrentUser, MobileAuthResponse, Poi } from "../types/api";

// EXPO_PUBLIC_API_URL: IP local da máquina rodando o backend (não
// "localhost" — o celular físico não é a mesma máquina), ex:
// http://192.168.0.42:8000. Ver README.md deste pacote.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.detail ?? response.statusText, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export async function mobileGoogleLogin(idToken: string): Promise<MobileAuthResponse> {
  return request<MobileAuthResponse>("/api/v1/mobile/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken }),
  });
}

export async function fetchCurrentUser(token: string): Promise<CurrentUser> {
  return request<CurrentUser>("/api/v1/mobile/auth/me", { headers: authHeaders(token) });
}

export async function fetchPois(token: string): Promise<Poi[]> {
  return request<Poi[]>("/api/v1/pois", { headers: authHeaders(token) });
}

export async function fetchCategories(): Promise<Category[]> {
  // Sem auth — GET /categories é público, igual na web.
  return request<Category[]>("/api/v1/categories");
}
