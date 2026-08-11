import api from './axiosInstance';
import type { ApiResponse, AuthResponse, LoginRequest } from '@/types';

/**
 * AuthApi — API calls cho Admin Auth.
 * Dùng cùng endpoint /auth/login với FE mobile,
 * BE kiểm tra role ADMIN trong JWT scope.
 */
const AuthApi = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data),

  refresh: (data: { token: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/refresh', data),

  logout: (data: { token: string; refreshToken: string | null }) =>
    api.post('/auth/logout', data),
};

export default AuthApi;
