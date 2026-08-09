import api from './axiosInstance';

export type RequestStatus = 'SEARCHING' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED' | 'DELETED';
export type SessionFormat = 'ONLINE' | 'OFFLINE';

export interface AdminHelpRequestResponse {
  id: string;
  title: string;
  status: RequestStatus;
  categoryName: string | null;
  region: string | null;
  requesterId: string;
  requesterFullName: string;
  requesterEmail: string;
  requesterAvatarUrl: string | null;
  timeCreditAmount: number;
  createdAt: string;
}

export interface AdminHelpRequestDetailResponse {
  id: string;
  title: string;
  description: string | null;
  currentLevel: string | null;
  format: SessionFormat | null;
  desiredTime: string | null;
  duration: number | null;
  region: string | null;
  timeCreditAmount: number;
  status: RequestStatus;
  responseCount: number;
  categoryName: string | null;
  createdAt: string;
  updatedAt: string;
  requesterId: string;
  requesterFullName: string;
  requesterEmail: string;
  requesterAvatarUrl: string | null;
  requesterReputationScore: number;
  requesterCompletedSessions: number;
  requesterWarningCount: number;
}

export interface PaginatedHelpRequestResponse {
  content: AdminHelpRequestResponse[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export const helpRequestsApi = {
  getHelpRequests: async (
    page = 0,
    size = 10,
    title = '',
    requesterName = '',
    requesterEmail = '',
    status = '',
    categoryId = '',
    region = ''
  ) => {
    const response = await api.get<PaginatedHelpRequestResponse>('/admin/help-requests', {
      params: {
        page,
        size,
        title: title || undefined,
        requesterName: requesterName || undefined,
        requesterEmail: requesterEmail || undefined,
        status: status || undefined,
        categoryId: categoryId || undefined,
        region: region || undefined,
      },
    });
    return response.data;
  },

  getHelpRequestDetail: async (id: string) => {
    const response = await api.get<AdminHelpRequestDetailResponse>(`/admin/help-requests/${id}`);
    return response.data;
  },

  performAction: async (
    id: string,
    actionType: 'DELETE' | 'WARN',
    reason?: string
  ) => {
    const response = await api.post(`/admin/help-requests/${id}/actions`, { actionType, reason });
    return response.data;
  },

  createHelpRequest: async (data: {
    requesterId: string;
    title: string;
    description?: string;
    categoryId?: string;
    currentLevel?: string;
    format?: string;
    desiredTime?: string;
    duration?: number;
    region?: string;
    timeCreditAmount?: number;
    status?: string;
  }) => {
    await api.post('/admin/help-requests', data);
  },

  updateHelpRequest: async (id: string, data: {
    title: string;
    description?: string;
    categoryId?: string | null;
    currentLevel?: string;
    format?: string | null;
    desiredTime?: string;
    duration?: number | null;
    region?: string;
    timeCreditAmount?: number;
    status?: string;
  }) => {
    await api.put(`/admin/help-requests/${id}`, data);
  },
};
