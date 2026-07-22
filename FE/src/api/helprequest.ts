import api from './axiosInstance';
import type { ApiResponse, PagedResponse } from '@types';
// TODO: import request/response types as they are implemented

/**
 * HelpRequestApi — API calls cho module helprequest.
 * Base URL: /help-requests
 */
const HelpRequestApi = {
  getRequests: () => api.get('/help-requests'),
  getMyRequests: () => api.get('/help-requests/me'),
  createRequest: (data: any) => api.post('/help-requests', data),
  closeRequest: (id: string) => api.put(`/help-requests/${id}/close`),
};

export default HelpRequestApi;
