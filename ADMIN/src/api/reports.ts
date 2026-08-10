import api from './axiosInstance';
import type { PaginatedResponse } from './users';

export type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
export type ReportTargetType = 'USER' | 'MESSAGE' | 'CONTENT';
export type ReportUserAction = 'NONE' | 'WARN' | 'LOCK';
export type ReportSource = 'GENERAL' | 'CHAT';
export type ReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'MISINFORMATION'
  | 'ILLEGAL_CONTENT'
  | 'FRAUD'
  | 'OFFENSIVE'
  | 'SCAM'
  | 'OUTSIDE_PAYMENT'
  | 'ASK_CREDENTIALS'
  | 'OTHER';

export interface AdminReport {
  id: string;
  source?: ReportSource;
  targetId: string;
  targetType: ReportTargetType;
  targetLabel: string;
  reason: ReportReason;
  description: string | null;
  evidenceCount: number;
  status: ReportStatus;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReportDetail extends AdminReport {
  targetDescription: string | null;
  evidenceUrls: string[];
  adminNote: string | null;
  targetUserId?: string | null;
  targetUserName?: string | null;
  targetUserEmail?: string | null;
  targetUserLocked?: boolean | null;
}

export interface ReportStats {
  total: number;
  pending: number;
  reviewing: number;
  resolved: number;
  dismissed: number;
}

export interface ReportFilters {
  page: number;
  size: number;
  userId?: string;
  search?: string;
  status?: ReportStatus | '';
  targetType?: ReportTargetType | '';
  reason?: ReportReason | '';
  source?: ReportSource | '';
  dateFrom?: string;
  dateTo?: string;
}

export interface UpdateReportStatusRequest {
  status: ReportStatus;
  adminNote: string;
  userAction?: ReportUserAction;
}

export const reportsApi = {
  getReports: async (filters: ReportFilters) => {
    const response = await api.get<PaginatedResponse<AdminReport>>('/admin/reports', {
      params: {
        ...filters,
        search: filters.search || undefined,
        status: filters.status || undefined,
        targetType: filters.targetType || undefined,
        reason: filters.reason || undefined,
        source: filters.source || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      },
    });
    return response.data;
  },

  getReportsForUser: async (
    userId: string,
    page = 0,
    size = 10,
  ): Promise<PaginatedResponse<AdminReport>> => reportsApi.getReports({ page, size, userId }),

  getStats: async () => {
    const response = await api.get<ReportStats>('/admin/reports/stats');
    return response.data;
  },

  getDetail: async (id: string, source: ReportSource = 'GENERAL') => {
    const response = await api.get<AdminReportDetail>(`/admin/reports/${id}`, {
      params: { source },
    });
    return response.data;
  },

  updateStatus: async (
    id: string,
    source: ReportSource,
    payload: UpdateReportStatusRequest,
  ) => {
    const response = await api.patch<AdminReportDetail>(`/admin/reports/${id}/status`, payload, {
      params: { source },
    });
    return response.data;
  },
};
