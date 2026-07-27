import api from './axiosInstance';

/**
 * AuthApi — API calls cho module auth.
 * Base URL: /auth
 */
const AuthApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { fullName: string; email: string; password: string; phone?: string }) =>
    api.post('/auth/register', data),
  // ⚠️ BE CHƯA có 2 endpoint OTP này (thuộc scope DEV1) — đừng gọi cho tới khi BE xong
  sendOtp: (data: any) => api.post('/auth/send-otp', data),
  verifyOtp: (data: any) => api.post('/auth/verify-otp', data),
  refresh: (data: { token: string }) => api.post('/auth/refresh', data),
  logout: (data: { token: string, refreshToken: string | null }) => api.post('/auth/logout', data),
};

export default AuthApi;
