import api from './axiosInstance';
import type { ApiResponse, PagedResponse, RatingResponse, BadgeResponse } from '@types';

export interface SubmitRatingRequest {
  appointmentId: string;
  revieweeId: string;
  punctualityScore?: number;
  attitudeScore?: number;
  communicationScore?: number;
  qualityScore?: number;
  overallStars: number;
  comment?: string;
}

/**
 * RatingApi — API calls cho module Rating & Badge.
 * Base URL: /ratings
 */
const RatingApi = {
  /** Kiểm tra xem user hiện tại đã đánh giá lịch hẹn này chưa, trả về RatingResponse hoặc null */
  getRatingForAppointment: (appointmentId: string) =>
    api.get<ApiResponse<RatingResponse | null>>(`/ratings/appointment/${appointmentId}`),

  /** Gửi đánh giá sau buổi hẹn hoàn thành */
  submitRating: (data: SubmitRatingRequest) =>
    api.post<ApiResponse<RatingResponse>>('/ratings', data),

  /** Lấy đánh giá mà userId nhận được (reviewee) */
  getRatingsReceived: (userId: string, page = 0, size = 10) =>
    api.get<ApiResponse<PagedResponse<RatingResponse>>>(`/ratings/received/${userId}`, {
      params: { page, size },
    }),

  /** Lấy đánh giá mà userId đã gửi (reviewer) */
  getRatingsGiven: (userId: string, page = 0, size = 10) =>
    api.get<ApiResponse<PagedResponse<RatingResponse>>>(`/ratings/given/${userId}`, {
      params: { page, size },
    }),

  /** Lấy danh sách huy hiệu của userId */
  getUserBadges: (userId: string) =>
    api.get<ApiResponse<BadgeResponse[]>>(`/ratings/badges/${userId}`),
};

export default RatingApi;
