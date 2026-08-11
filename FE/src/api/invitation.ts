import api from './axiosInstance';
import type { ApiResponse } from '@types';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'RESCHEDULED';
export type InvitationAction =
  | 'ACCEPT'
  | 'REJECT'
  | 'RESCHEDULE'
  | 'ACCEPT_RESCHEDULE'
  | 'REJECT_RESCHEDULE';

export interface InvitationResponse {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  receiverId: string;
  receiverName: string;
  receiverAvatarUrl?: string;
  skillId?: string;
  skillName?: string;
  helpRequestId?: string;
  helpRequestTitle?: string;
  content: string;
  message?: string;
  proposedTime?: string;
  duration?: number;
  format: 'ONLINE' | 'OFFLINE' | 'BOTH';
  status: InvitationStatus;
  rejectReason?: string;
  rescheduleTime?: string;
  activeAppointmentId?: string;
  activeAppointmentStatus?: string;
  canCreateAppointment: boolean;
  createdAt: string;
  updatedAt?: string;
}

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
  }) => api.post<ApiResponse<InvitationResponse>>('/invitation', data),

  /** Danh sách lời mời đã gửi */
  getSent: () => api.get<ApiResponse<InvitationResponse[]>>('/invitation/sent'),

  /** Danh sách lời mời nhận được */
  getReceived: () => api.get<ApiResponse<InvitationResponse[]>>('/invitation/received'),

  /** Chi tiết lời mời */
  getDetail: (id: string) => api.get<ApiResponse<InvitationResponse>>(`/invitation/${id}`),

  /** Phản hồi lời mời hoặc quyết định thời gian được đề xuất lại */
  respond: (id: string, data: {
    action: InvitationAction;
    rejectReason?: string;
    rescheduleTime?: string;
  }) => api.put<ApiResponse<InvitationResponse>>(`/invitation/${id}/respond`, data),

  /** Hủy lời mời đã gửi */
  cancel: (id: string) => api.put<ApiResponse<InvitationResponse>>(`/invitation/${id}/cancel`),
};

export default InvitationApi;
