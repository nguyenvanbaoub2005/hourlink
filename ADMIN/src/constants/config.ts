// ─── Cấu hình API giống pattern FE/src/constants/Config.ts ───
const isDev = import.meta.env.MODE === 'development';

const ENV = {
  dev: {
    API_URL: import.meta.env.VITE_API_URL || 'http://192.168.1.5:8085/api',
  },
  prod: {
    API_URL: import.meta.env.VITE_API_URL || 'https://api.hourlink.vn/api',
  },
};

export const config = isDev ? ENV.dev : ENV.prod;

// Keys lưu JWT vào localStorage (web dùng localStorage, không dùng SecureStore như mobile)
export const TOKEN_KEY = 'hl_admin_access_token';
export const REFRESH_KEY = 'hl_admin_refresh_token';

export const PAGINATION_SIZE = 20;
