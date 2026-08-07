import { create } from 'zustand';
import { TOKEN_KEY, REFRESH_KEY } from '@/constants/config';
import { setUnauthorizedHandler } from '@/api/axiosInstance';
import AuthApi from '@/api/auth';

// ─── Helper: decode JWT payload ──────────────────────────────
const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return null;
    const padded =
      payloadBase64.replace(/-/g, '+').replace(/_/g, '/') +
      '=='.slice(0, (4 - (payloadBase64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const decodeRole = (token: string): string | null => {
  const payload = decodeJwtPayload(token);
  return (payload?.scope as string) || null;
};

const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= (payload.exp as number) * 1000;
};

// ─── Store State ─────────────────────────────────────────────
interface AuthState {
  email: string | null;
  accessToken: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  email: null,
  accessToken: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const res = await AuthApi.login({ email, password });
    const { token, refreshToken } = res.data.data;

    // Kiểm tra role từ JWT — chỉ cho phép ADMIN
    const role = decodeRole(token);
    if (!role?.includes('ADMIN')) {
      throw new Error('Tài khoản không có quyền truy cập Admin');
    }

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    set({ email, accessToken: token, role, isAuthenticated: true });
  },

  logout: async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const refreshToken = localStorage.getItem(REFRESH_KEY);
      if (token) {
        await AuthApi.logout({ token, refreshToken });
      }
    } catch {
      // Bỏ qua lỗi nếu token đã hết hạn
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    set({ email: null, accessToken: null, role: null, isAuthenticated: false });
  },

  loadStoredAuth: () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token && !isTokenExpired(token)) {
        const role = decodeRole(token);
        // Chỉ khôi phục phiên nếu là ADMIN
        if (role?.includes('ADMIN')) {
          set({ accessToken: token, role, isAuthenticated: true });
        } else {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_KEY);
        }
      } else if (token) {
        // Token hết hạn → xóa
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
      }
    } catch {
      // Token lỗi
    } finally {
      set({ isLoading: false });
    }

    // Đăng ký handler để logout khi refresh token fail
    setUnauthorizedHandler(() => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      set({ email: null, accessToken: null, role: null, isAuthenticated: false, isLoading: false });
    });
  },
}));
