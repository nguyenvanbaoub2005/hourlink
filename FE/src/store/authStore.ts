import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY, REFRESH_KEY } from '@api/axiosInstance';
import AuthApi from '@api/auth';
import { signOutFirebase } from '@lib/firebase';
import type { UserResponse } from '@types';

interface AuthState {
  user: UserResponse | null;
  accessToken: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: UserResponse, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  setUser: (user: UserResponse) => void;
}

const decodeJwtRole = (token: string): string | null => {
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return null;
    // Pad base64 string to multiple of 4
    const padded = payloadBase64.replace(/-/g, '+').replace(/_/g, '/')
      + '=='.slice(0, (4 - (payloadBase64.length % 4)) % 4);
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);
    return parsed.scope || null;
  } catch (e) {
    return null;
  }
};

/** Kiểm tra token JWT đã hết hạn chưa (dựa vào claim `exp`) */
const isTokenExpired = (token: string): boolean => {
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return true;
    const padded = payloadBase64.replace(/-/g, '+').replace(/_/g, '/')
      + '=='.slice(0, (4 - (payloadBase64.length % 4)) % 4);
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);
    if (!parsed.exp) return true;
    // exp là Unix timestamp tính bằng giây, Date.now() là ms
    return Date.now() >= parsed.exp * 1000;
  } catch {
    return true;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    const role = decodeJwtRole(accessToken);
    set({ user, accessToken, role, isAuthenticated: true });
  },


  logout: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
      if (token) {
        await AuthApi.logout({ token, refreshToken });
      }
    } catch (e) {
      // Ignore errors if token is already expired/invalid
    }
    // Đăng xuất khỏi Firebase để không còn nghe tin nhắn realtime (9.10)
    await signOutFirebase();

    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    set({ user: null, accessToken: null, role: null, isAuthenticated: false });
  },

  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token && !isTokenExpired(token)) {
        // Token còn hạn → khôi phục phiên đăng nhập
        const role = decodeJwtRole(token);
        set({ accessToken: token, role, isAuthenticated: true });
      } else if (token) {
        // Token đã hết hạn → xóa sạch, buộc đăng nhập lại
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_KEY);
      }
    } catch {
      // Token lỗi
    } finally {
      set({ isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
}));
