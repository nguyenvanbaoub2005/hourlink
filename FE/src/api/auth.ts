import api from './axiosInstance';
import type { ApiResponse, PagedResponse } from '@types';
// TODO: import request/response types as they are implemented

/**
 * AuthApi — API calls cho module auth.
 * Base URL: /auth
 */
const AuthApi = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  sendOtp: (data: any) => api.post('/auth/send-otp', data),
  verifyOtp: (data: any) => api.post('/auth/verify-otp', data),
  refresh: (data: any) => api.post('/auth/refresh', data),
  logout: (data: { token: string, refreshToken: string | null }) => api.post('/auth/logout', data),
};

export default AuthApi;
