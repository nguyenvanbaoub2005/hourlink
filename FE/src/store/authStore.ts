import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY, REFRESH_KEY, setUnauthorizedHandler } from '@api/axiosInstance';
import AuthApi from '@api/auth';
import UserApi from '@api/user';
import type { UserResponse } from '@types';

interface AuthState {
  user: UserResponse | null;
  accessToken: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (accessToken: string, refreshToken: string) => Promise<void>;
  fetchProfile: () => Promise<void>;
  logout: () => Promise<void>;
  clearSession: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  setUser: (user: UserResponse) => void;
}

// Hermes không có sẵn Buffer/atob ở mọi phiên bản → tự decode base64
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const base64Decode = (input: string): string => {
  const clean = input.replace(/=+$/, '');
  let bits = 0;
  let buffer = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const value = B64_CHARS.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  try {
    // Chuyển chuỗi byte → UTF-8 (payload JWT có thể chứa unicode)
    return decodeURIComponent(
      binary.replace(/[\x80-\xff]/g, (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
    );
  } catch {
    return binary;
  }
};

const decodeJwtRole = (token: string): string | null => {
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return null;
    const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = base64Decode(normalized);
    const parsed = JSON.parse(decoded);
    // BE đặt danh sách role trong claim "scope", vd: "ROLE_USER ROLE_ADMIN"
    return parsed.scope || null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (accessToken, refreshToken) => {
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    const role = decodeJwtRole(accessToken);
    set({ accessToken, role, isAuthenticated: true });
    await get().fetchProfile();
  },

  fetchProfile: async () => {
    try {
      const response = await UserApi.getMyProfile();
      set({ user: response.data.data });
    } catch {
      // Lỗi mạng/tạm thời: giữ phiên đăng nhập, user sẽ được fetch lại
      // ở lần vào Profile/Home kế tiếp. 401 thật sự đã được axios xử lý.
    }
  },

  logout: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
      if (token) {
        await AuthApi.logout({ token, refreshToken });
      }
    } catch {
      // Token hết hạn/không hợp lệ vẫn coi là logout thành công
    }
    await get().clearSession();
  },

  clearSession: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    set({ user: null, accessToken: null, role: null, isAuthenticated: false });
  },

  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        const role = decodeJwtRole(token);
        set({ accessToken: token, role, isAuthenticated: true });
        // Không await: tránh chặn splash khi mạng chậm
        get().fetchProfile();
      }
    } catch {
      // Token lỗi
    } finally {
      set({ isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
}));

// Khi refresh token thất bại (axios đã xóa token) → reset state để
// các layout tự Redirect về màn đăng nhập
setUnauthorizedHandler(() => {
  useAuthStore.getState().clearSession();
});
