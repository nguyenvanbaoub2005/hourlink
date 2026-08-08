// ============================================================
// ADMIN — TypeScript Types (mirror từ FE/src/types/index.ts)
// ============================================================

// ─── API Response wrapper (giống hệt BE ApiResponse<T>) ─────
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// ─── Auth ────────────────────────────────────────────────────
/** Mirror com.hourlink.auth.dto.response.AuthResponse */
export interface AuthResponse {
  token: string;
  refreshToken: string;
  authenticated: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ─── Admin User (JWT Payload) ─────────────────────────────────
export interface AdminTokenPayload {
  sub: string;       // email
  scope: string;     // "ROLE_ADMIN"
  exp: number;
  iat: number;
}

// ─── User ────────────────────────────────────────────────────
export type UserType = 'individual' | 'organization' | 'admin';
export type UserStatus = 'active' | 'locked' | 'pending';

export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  dob?: string;
  region?: string;
  occupation?: string;
  userType: UserType;
  avatarUrl?: string;
  bio?: string;
  verified: boolean;
  locked: boolean;
  reputationScore: number;
  completedSessions: number;
  cancelRate: number;
  createdAt: string;
}

// ─── Dashboard ───────────────────────────────────────────────
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalAppointments: number;
  completedToday: number;
  totalTimeCredits: number;
  pendingReports: number;
  openDisputes: number;
  lockedAccounts: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}
