import axiosInstance from './axiosInstance';
import type { 
  ApiResponse, 
  PagedResponse, 
  ActivityResponse, 
  ParticipantResponse,
  CreateActivityRequest,
  UpdateActivityRequest,
  ConfirmParticipantsRequest
} from '@types';

const BASE_URL = '/community';

const CommunityApi = {
  // ─── Lấy danh sách ──────────────────────────────────────────

  getOpenActivities: (page = 0, size = 10) => {
    return axiosInstance.get<ApiResponse<PagedResponse<ActivityResponse>>>(
      `${BASE_URL}/activities`,
      { params: { page, size } }
    );
  },

  getAllActivities: (page = 0, size = 10) => {
    return axiosInstance.get<ApiResponse<PagedResponse<ActivityResponse>>>(
      `${BASE_URL}/activities/all`,
      { params: { page, size } }
    );
  },

  getMyActivities: (page = 0, size = 10) => {
    return axiosInstance.get<ApiResponse<PagedResponse<ActivityResponse>>>(
      `${BASE_URL}/activities/mine`,
      { params: { page, size } }
    );
  },

  getActivityDetail: (id: string) => {
    return axiosInstance.get<ApiResponse<ActivityResponse>>(
      `${BASE_URL}/activities/${id}`
    );
  },

  getMyRegistrations: (page = 0, size = 10) => {
    return axiosInstance.get<ApiResponse<PagedResponse<ParticipantResponse>>>(
      `${BASE_URL}/my-registrations`,
      { params: { page, size } }
    );
  },

  // ─── Tổ chức (CRUD) ─────────────────────────────────────────

  createActivity: (data: CreateActivityRequest) => {
    return axiosInstance.post<ApiResponse<ActivityResponse>>(
      `${BASE_URL}/activities`,
      data
    );
  },

  updateActivity: (id: string, data: UpdateActivityRequest) => {
    return axiosInstance.put<ApiResponse<ActivityResponse>>(
      `${BASE_URL}/activities/${id}`,
      data
    );
  },

  deleteActivity: (id: string) => {
    return axiosInstance.delete<ApiResponse<void>>(
      `${BASE_URL}/activities/${id}`
    );
  },

  closeRegistration: (id: string) => {
    return axiosInstance.patch<ApiResponse<ActivityResponse>>(
      `${BASE_URL}/activities/${id}/close`
    );
  },

  // ─── Đăng ký / Xác nhận (US-36, 37, 38) ──────────────────────

  register: (id: string) => {
    return axiosInstance.post<ApiResponse<ParticipantResponse>>(
      `${BASE_URL}/activities/${id}/register`
    );
  },

  cancelRegistration: (id: string) => {
    return axiosInstance.delete<ApiResponse<void>>(
      `${BASE_URL}/activities/${id}/register`
    );
  },

  getParticipants: (id: string, page = 0, size = 50) => {
    return axiosInstance.get<ApiResponse<PagedResponse<ParticipantResponse>>>(
      `${BASE_URL}/activities/${id}/participants`,
      { params: { page, size } }
    );
  },

  confirmParticipants: (id: string, data: ConfirmParticipantsRequest) => {
    return axiosInstance.post<ApiResponse<ParticipantResponse[]>>(
      `${BASE_URL}/activities/${id}/participants/confirm`,
      data
    );
  }
};

export default CommunityApi;
