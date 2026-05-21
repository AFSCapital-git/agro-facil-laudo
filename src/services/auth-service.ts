// src/services/auth-service.ts
import apiClient from '@/lib/api-client';

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
    const response = await apiClient.post<TokenResponse>('/api/auth/register', data);
    
    // Save token
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('user_id', response.data.user_id);
    
    return response.data;
  },

  async login(data: UserLoginRequest): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/api/auth/login', data);
    
    // Save token
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('user_id', response.data.user_id);
    
    return response.data;
  },

  async getCurrentUser(): Promise<UserResponse> {
    const response = await apiClient.get<UserResponse>('/api/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
  },

  getToken(): string | null {
    return localStorage.getItem('access_token');
  },

  getUserId(): string | null {
    return localStorage.getItem('user_id');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
