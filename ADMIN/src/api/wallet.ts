import api from './axiosInstance';
import type { PaginatedResponse } from './users';

export type WalletTransactionType =
  | 'EARN'
  | 'SPEND'
  | 'HOLD'
  | 'RELEASE'
  | 'REFUND'
  | 'BONUS'
  | 'ADJUSTMENT';

export interface AdminWalletOverview {
  totalWallets: number;
  totalAvailableBalance: number;
  totalHeldAmount: number;
  totalEconomyBalance: number;
  totalEarned: number;
  totalUsed: number;
  missingWalletCount: number;
  walletsWithHeldCredit: number;
  inconsistentWallets: number;
  transactionCountToday: number;
  transactionVolumeToday: number;
  adjustmentCountToday: number;
  adjustmentVolumeToday: number;
  generatedAt: string;
}

export interface AdminWalletSummary {
  walletId: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  userType: 'individual' | 'organization' | 'admin';
  userAvatarUrl?: string | null;
  locked: boolean;
  deleted: boolean;
  balance: number;
  heldAmount: number;
  totalEarned: number;
  totalUsed: number;
  ledgerBalance: number;
  inconsistent: boolean;
  invariantDifference: number;
  createdAt: string;
  updatedAt: string;
}

export type AdminWalletDetail = AdminWalletSummary;

export interface AdminWalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  type: WalletTransactionType;
  amount: number;
  signedAmount: number;
  direction: 'CREDIT' | 'DEBIT' | 'HOLD' | 'RELEASE';
  balanceAfter: number;
  description: string | null;
  appointmentId?: string | null;
  appointmentTitle?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  idempotencyKey?: string | null;
  createdAt: string;
}

export type WalletAnomalySeverity = 'WARNING' | 'CRITICAL';
export type WalletAnomalyType = 'INVARIANT_MISMATCH' | 'NEGATIVE_BALANCE' | 'HIGH_24H_INFLOW' | 'FREQUENT_PAIR';

export interface AdminWalletAnomaly {
  anomalyKey: string;
  type: WalletAnomalyType;
  severity: WalletAnomalySeverity;
  userId?: string | null;
  userFullName?: string | null;
  userEmail?: string | null;
  relatedUserId?: string | null;
  relatedUserFullName?: string | null;
  relatedUserEmail?: string | null;
  metricValue: number;
  threshold: number;
  message: string;
  detectedAt: string;
}

export interface WalletListFilters {
  page: number;
  size: number;
  search?: string;
  hasHeld?: boolean | '';
  inconsistent?: boolean | '';
  minBalance?: number | '';
  maxBalance?: number | '';
}

export interface TransactionFilters {
  page: number;
  size: number;
  search?: string;
  userId?: string;
  type?: WalletTransactionType | '';
  dateFrom?: string;
  dateTo?: string;
}

export interface AdjustWalletRequest {
  userId: string;
  amount: number;
  reason: string;
  requestId: string;
}

export interface AdjustWalletResponse {
  wallet: AdminWalletDetail;
  transaction: AdminWalletTransaction;
  idempotentReplay: boolean;
}

const optional = <T,>(value: T | '' | undefined) => value === '' ? undefined : value;

export const walletApi = {
  getOverview: async () => {
    const response = await api.get<AdminWalletOverview>('/admin/wallet/overview');
    return response.data;
  },

  getWallets: async (filters: WalletListFilters) => {
    const response = await api.get<PaginatedResponse<AdminWalletSummary>>('/admin/wallet/wallets', {
      params: {
        ...filters,
        search: filters.search || undefined,
        hasHeld: optional(filters.hasHeld),
        inconsistent: optional(filters.inconsistent),
        minBalance: optional(filters.minBalance),
        maxBalance: optional(filters.maxBalance),
      },
    });
    return response.data;
  },

  getWalletDetail: async (userId: string) => {
    const response = await api.get<AdminWalletDetail>(`/admin/wallet/wallets/${userId}`);
    return response.data;
  },

  initializeWallet: async (userId: string) => {
    const response = await api.post<AdminWalletDetail>(`/admin/wallet/wallets/${userId}/initialize`);
    return response.data;
  },

  getTransactions: async (filters: TransactionFilters) => {
    const response = await api.get<PaginatedResponse<AdminWalletTransaction>>('/admin/wallet/transactions', {
      params: {
        ...filters,
        search: filters.search || undefined,
        userId: filters.userId || undefined,
        type: filters.type || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      },
    });
    return response.data;
  },

  getAnomalies: async () => {
    const response = await api.get<AdminWalletAnomaly[]>('/admin/wallet/anomalies');
    return response.data;
  },

  adjustBalance: async (payload: AdjustWalletRequest) => {
    const response = await api.post<AdjustWalletResponse>('/admin/wallet/adjust', payload);
    return response.data;
  },
};
