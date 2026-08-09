import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Config from '@constants/Config';

// ─── Keys lưu token ──────────────────────────────────────────
export const TOKEN_KEY   = 'hourlink_access_token';
export const REFRESH_KEY = 'hourlink_refresh_token';

// ─── Axios instance ──────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: Config.API_URL,
  timeout: 15000,
});

// ─── Request interceptor: gắn Bearer token ───────────────────
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: auto refresh token ────────────────
// Handler do authStore đăng ký: được gọi khi refresh thất bại
// để reset state đăng nhập (tránh import vòng authStore ↔ axiosInstance)
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 từ chính các endpoint /auth (đăng nhập sai mật khẩu, refresh hỏng...)
    // thì trả lỗi thẳng cho màn hình, không đi vào luồng refresh
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
        const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${Config.API_URL}/auth/refresh`, {
          token: refreshToken,
        });

        // BE dùng refresh token rotation: token cũ bị blacklist,
        // PHẢI lưu cả cặp token mới, nếu không lần refresh sau sẽ fail
        const newToken = data.data.token;
        const newRefreshToken = data.data.refreshToken;
        await SecureStore.setItemAsync(TOKEN_KEY, newToken);
        if (newRefreshToken) {
          await SecureStore.setItemAsync(REFRESH_KEY, newRefreshToken);
        }
        processQueue(null, newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        // Xóa token cũ và báo authStore reset state → layout tự redirect về login
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_KEY);
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
