import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config, TOKEN_KEY, REFRESH_KEY } from '@/constants/config';

// ─── Axios instance (mirror FE/src/api/axiosInstance.ts) ─────
const api: AxiosInstance = axios.create({
  baseURL: config.API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: đính Bearer token ──────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: auto-refresh + redirect ───────────
// Handler do authStore đăng ký để tránh circular import
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token!);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem(REFRESH_KEY);
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${config.API_URL}/auth/refresh`, {
          token: refreshToken,
        });

        // BE dùng refresh token rotation — lưu cả cặp token mới
        const newToken: string = data.data.token;
        const newRefreshToken: string = data.data.refreshToken;
        localStorage.setItem(TOKEN_KEY, newToken);
        if (newRefreshToken) localStorage.setItem(REFRESH_KEY, newRefreshToken);

        processQueue(null, newToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        onUnauthorized?.();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
