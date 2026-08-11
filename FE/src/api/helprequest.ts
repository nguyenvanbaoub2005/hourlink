import api from './axiosInstance';
import type { ApiResponse } from '@types';

export type HelpRequestStatus = 'SEARCHING' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED' | 'DELETED';

export interface HelpRequestResponse {
  id: string;
  title: string;
  description: string;
  currentLevel?: string;
  format: 'ONLINE' | 'OFFLINE' | 'BOTH';
  desiredTime?: string;
  duration: number;
  region?: string;
  timeCreditAmount: number;
  status: HelpRequestStatus;
  categoryId?: string;
  categoryName?: string;
  requesterId: string;
  requesterFullName?: string;
  responseCount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * HelpRequestApi — API calls cho module helprequest.
 * Base URL: /help-requests
 */
const HelpRequestApi = {
  getRequests: () => api.get<ApiResponse<HelpRequestResponse[]>>('/help-request'),
  getMyRequests: () => api.get<ApiResponse<HelpRequestResponse[]>>('/help-request/my-requests'),
  createRequest: (data: any) => api.post('/help-request', data),
  updateRequest: (id: string, data: any) => api.put<ApiResponse<HelpRequestResponse>>(`/help-request/${id}`, data),
  deleteRequest: (id: string) => api.delete<ApiResponse<void>>(`/help-request/${id}`),
  closeRequest: (id: string) => api.put<ApiResponse<HelpRequestResponse>>(`/help-request/${id}/close`),
};

export default HelpRequestApi;
