import api from './axiosInstance';
import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest } from '@types';

/**
 * AuthApi — API calls cho module auth.
 * Base URL: /auth
 */
const AuthApi = {
  login: (data: LoginRequest) => api.post<ApiResponse<AuthResponse>>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<ApiResponse<AuthResponse>>('/auth/register', data),
  sendOtp: (data: any) => api.post('/auth/send-otp', data),
  verifyOtp: (data: any) => api.post('/auth/verify-otp', data),
  refresh: (data: any) => api.post('/auth/refresh', data),
  logout: (data: { token: string, refreshToken: string | null }) => api.post('/auth/logout', data),
};

export default AuthApi;
