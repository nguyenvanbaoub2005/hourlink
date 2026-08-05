package com.hourlink.rating.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

/**
 * RatingResponse — Response trả về khi đọc thông tin 1 đánh giá.
 */
@Data
@Builder
public class RatingResponse {
    private String id;
    private String appointmentId;

    // Thông tin người đánh giá
    private String reviewerId;
    private String reviewerName;
    private String reviewerAvatarUrl;

    // Thông tin người được đánh giá
    private String revieweeId;
    private String revieweeName;

    // Các tiêu chí điểm
    private Integer punctualityScore;
    private Integer attitudeScore;
    private Integer communicationScore;
    private Integer qualityScore;
    private Integer overallStars;

    private String comment;
    private Instant createdAt;
}
