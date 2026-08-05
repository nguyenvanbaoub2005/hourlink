package com.hourlink.rating.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/**
 * RatingSummaryResponse — Thống kê tổng hợp đánh giá của một người dùng.
 * Dùng cho endpoint GET /rating/user/{userId}/summary
 */
@Data
@Builder
public class RatingSummaryResponse {

    UUID userId;
    String fullName;
    String avatarUrl;

    /** Điểm trung bình (1.0 – 5.0), 0.0 nếu chưa có đánh giá */
    double averageScore;

    /** Tổng số đánh giá nhận được */
    long totalRatings;

    /** Điểm uy tín (thang 0–100, = averageScore * 20) */
    double reputationScore;

    /** Số buổi đã hoàn thành */
    int completedSessions;

    /** Tỷ lệ hủy (0.0 – 1.0) */
    double cancelRate;
}
