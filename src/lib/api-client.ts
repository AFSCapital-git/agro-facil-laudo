// src/lib/api-client.ts
// HTTP client para a API Python externa (FastAPI em 187.127.24.128:8001).
// Usa chave de localStorage isolada (`api_access_token`) para NÃO colidir
// com a sessão do Supabase/Lovable Cloud usada em useAuth.tsx.

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "https://187.127.24.128";

export const API_TOKEN_KEY = "api_access_token";
export const API_USER_ID_KEY = "api_user_id";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: injeta Bearer token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(API_TOKEN_KEY);
  if (token) {
    config.headers.set?.("Authorization", `Bearer ${token}`);
  }
  return config;
});

// Response interceptor: em 401 limpa credenciais da API e manda para /auth
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(API_TOKEN_KEY);
      localStorage.removeItem(API_USER_ID_KEY);
      if (typeof window !== "undefined" && window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
