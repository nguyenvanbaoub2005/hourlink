import api from './axiosInstance';
import type { ApiResponse, PagedResponse } from '@types';
// TODO: import request/response types as they are implemented

/**
 * CommunityApi — API calls cho module community.
 * Base URL: /community
 */
const CommunityApi = {
  getActivities: () => api.get('/community'),
  getById: (id: string) => api.get(`/community/{id}`),
  register: () => api.post(`/community/{id}/register`),
};

export default CommunityApi;
