// src/lib/api-client.ts
import axios, { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://187.127.24.128:8001';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh/errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_id');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
