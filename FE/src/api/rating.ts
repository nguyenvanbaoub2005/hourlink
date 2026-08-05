import api from './axiosInstance';
import type { ApiResponse } from '@types';

export interface RatingRequest {
  appointmentId: string;
  toUserId: string;
  score: number;       // 1-5
  comment?: string;
}

export interface RatingItem {
  id: string;
  appointmentId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  toUserId: string;
  toUserName: string;
  score: number;
  comment?: string;
  createdAt: string;
}

export interface RatingSummary {
  userId: string;
  fullName: string;
  avatarUrl?: string;
  averageScore: number;
  totalRatings: number;
  reputationScore: number;
  completedSessions: number;
  cancelRate: number;
}

/**
 * RatingApi — API calls cho module rating (Task 32 & 33).
 * Base URL: /rating
 */
const RatingApi = {
  /** Gửi đánh giá sau buổi hỗ trợ */
  submitRating: (data: RatingRequest) =>
    api.post<ApiResponse<RatingItem>>('/rating', data),

  /** Xem danh sách đánh giá tôi nhận được */
  getMyRatings: () =>
    api.get<ApiResponse<RatingItem[]>>('/rating/me'),

  /** Xem đánh giá của một người cụ thể */
  getRatingsByUser: (userId: string) =>
    api.get<ApiResponse<RatingItem[]>>(`/rating/user/${userId}`),

  /** Thống kê đánh giá + uy tín của chính mình */
  getMySummary: () =>
    api.get<ApiResponse<RatingSummary>>('/rating/me/summary'),

  /** Thống kê đánh giá + uy tín của một người cụ thể */
  getSummaryByUser: (userId: string) =>
    api.get<ApiResponse<RatingSummary>>(`/rating/user/${userId}/summary`),

  /** Kiểm tra mình đã đánh giá người kia trong appointment này chưa */
  hasRated: (appointmentId: string, toUserId: string) =>
    api.get<ApiResponse<boolean>>('/rating/has-rated', {
      params: { appointmentId, toUserId },
    }),
};

export default RatingApi;
