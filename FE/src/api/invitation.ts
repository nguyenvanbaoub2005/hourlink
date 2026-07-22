import api from './axiosInstance';
import type { ApiResponse, PagedResponse } from '@types';
// TODO: import request/response types as they are implemented

/**
 * InvitationApi — API calls cho module invitation.
 * Base URL: /invitation
 */
const InvitationApi = {
  getSent: () => api.get('/invitation/sent'),
  getReceived: () => api.get('/invitation/received'),
  sendInvitation: (data: any) => api.post('/invitation', data),
  accept: (id: string) => api.put(`/invitation/${id}/accept`),
  reject: (id: string) => api.put(`/invitation/${id}/reject`),
  cancel: (id: string) => api.put(`/invitation/${id}/cancel`),
};

export default InvitationApi;
