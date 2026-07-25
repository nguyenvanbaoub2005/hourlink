import api from './axiosInstance';
import type { ApiResponse, PagedResponse } from '@types';
// TODO: import request/response types as they are implemented

/**
 * HelpRequestApi — API calls cho module helprequest.
 * Base URL: /help-requests
 */
const HelpRequestApi = {
  getRequests: () => api.get('/help-request'),
  getMyRequests: () => api.get('/help-request/my-requests'),
  createRequest: (data: any) => api.post('/help-request', data),
  updateRequest: (id: string, data: any) => api.put(`/help-request/${id}`, data),
  deleteRequest: (id: string) => api.delete(`/help-request/${id}`),
  closeRequest: (id: string) => api.put(`/help-request/${id}/close`),
};

export default HelpRequestApi;
