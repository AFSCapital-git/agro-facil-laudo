// src/services/auth-service.ts
// Service para a API Python externa. Coexiste com o Supabase Auth — não
// substitui o fluxo atual de login do app.

import apiClient, { API_TOKEN_KEY, API_USER_ID_KEY } from "@/lib/api-client";

export interface UserRegisterRequest {
  email: string;
  password: string;
  nome: string;
  telefone?: string;
  role: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
}

export interface UserResponse {
  id: string;
  email: string;
  nome: string;
  telefone?: string;
  ativo: boolean;
}

export const authService = {
  async register(data: UserRegisterRequest): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>("/api/auth/register", data);
    localStorage.setItem(API_TOKEN_KEY, response.data.access_token);
    localStorage.setItem(API_USER_ID_KEY, response.data.user_id);
    return response.data;
  },

  async login(data: UserLoginRequest): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>("/api/auth/login", data);
    localStorage.setItem(API_TOKEN_KEY, response.data.access_token);
    localStorage.setItem(API_USER_ID_KEY, response.data.user_id);
    return response.data;
  },

  async getCurrentUser(): Promise<UserResponse> {
    const response = await apiClient.get<UserResponse>("/api/auth/me");
    return response.data;
  },

  logout(): void {
    localStorage.removeItem(API_TOKEN_KEY);
    localStorage.removeItem(API_USER_ID_KEY);
  },

  getToken(): string | null {
    return localStorage.getItem(API_TOKEN_KEY);
  },

  getUserId(): string | null {
    return localStorage.getItem(API_USER_ID_KEY);
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  },
};
