import api from './axiosInstance';
import type { 
  ApiResponse, 
  PagedResponse,
  AppointmentItem, 
  CreateAppointmentPayload, 
  RespondAppointmentPayload, 
  VerifyCodePayload, 
  ConfirmCompletionPayload,
  AppointmentVerificationItem
} from '@types';

/**
 * AppointmentApi — API calls cho module appointment (9.11, 9.12, 9.14, 9.15).
 * Base URL: /appointment (hỗ trợ cả /appointments trên BE)
 */
const AppointmentApi = {
  create: (data: CreateAppointmentPayload) => 
    api.post<ApiResponse<AppointmentItem>>('/appointment', data),

  getMyAppointments: (tab: string = 'ALL', page: number = 0, size: number = 20) => 
    api.get<ApiResponse<PagedResponse<AppointmentItem>>>('/appointment', { params: { tab, page, size } }),

  getById: (id: string) => 
    api.get<ApiResponse<AppointmentItem>>(`/appointment/${id}`),

  respond: (id: string, data: RespondAppointmentPayload) => 
    api.put<ApiResponse<AppointmentItem>>(`/appointment/${id}/respond`, data),

  generateVerification: (id: string) => 
    api.post<ApiResponse<AppointmentVerificationItem>>(`/appointment/${id}/generate-verification`),

  verifyCode: (id: string, data: VerifyCodePayload) => 
    api.post<ApiResponse<AppointmentItem>>(`/appointment/${id}/verify-code`, data),

  confirmCompletion: (id: string, data: ConfirmCompletionPayload) => 
    api.post<ApiResponse<AppointmentItem>>(`/appointment/${id}/confirm-completion`, data),

  // Aliases for compatibility
  generateQr: (id: string) => 
    api.post<ApiResponse<AppointmentVerificationItem>>(`/appointment/${id}/generate-verification`),
  verifyOtp: (id: string, data: any) => 
    api.post<ApiResponse<AppointmentItem>>(`/appointment/${id}/verify-code`, data),
  confirmStart: (id: string) => 
    api.post<ApiResponse<AppointmentVerificationItem>>(`/appointment/${id}/generate-verification`),
  confirmComplete: (id: string) => 
    api.post<ApiResponse<AppointmentItem>>(`/appointment/${id}/confirm-completion`, { actualDurationMinutes: 60, hasIssue: false }),
};

export default AppointmentApi;
