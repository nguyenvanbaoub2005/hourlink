import api from './axiosInstance';

/**
 * InvitationApi — API calls cho module invitation (chức năng 9.9).
 * Base URL: /invitation
 */
const InvitationApi = {
  /** Gửi lời mời hỗ trợ mới */
  sendInvitation: (data: {
    receiverId: string;
    skillId?: string;
    helpRequestId?: string;
    content: string;
    message?: string;
    proposedTime?: string;
    duration?: number;
    format: string;
  }) => api.post('/invitation', data),

  /** Danh sách lời mời đã gửi */
  getSent: () => api.get('/invitation/sent'),

  /** Danh sách lời mời nhận được */
  getReceived: () => api.get('/invitation/received'),

  /** Chi tiết lời mời */
  getDetail: (id: string) => api.get(`/invitation/${id}`),

  /** Phản hồi lời mời: ACCEPT, REJECT, RESCHEDULE */
  respond: (id: string, data: {
    action: string;
    rejectReason?: string;
    rescheduleTime?: string;
  }) => api.put(`/invitation/${id}/respond`, data),

  /** Hủy lời mời đã gửi */
  cancel: (id: string) => api.put(`/invitation/${id}/cancel`),
};

export default InvitationApi;
