package com.hourlink.rating.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * RatingRequest — Request body gửi lên khi người dùng đánh giá sau buổi hẹn.
 */
@Data
public class RatingRequest {

    @NotNull(message = "Thiếu appointmentId")
    private String appointmentId;

    /** ID của người được đánh giá */
    @NotNull(message = "Thiếu revieweeId")
    private String revieweeId;

    /** Điểm đúng giờ (tùy chọn, 1-5) */
    @Min(1) @Max(5)
    private Integer punctualityScore;

    /** Điểm thái độ (tùy chọn, 1-5) */
    @Min(1) @Max(5)
    private Integer attitudeScore;

    /** Điểm giao tiếp (tùy chọn, 1-5) */
    @Min(1) @Max(5)
    private Integer communicationScore;

    /** Điểm chất lượng hỗ trợ (tùy chọn, 1-5) */
    @Min(1) @Max(5)
    private Integer qualityScore;

    /** Điểm sao tổng quát (bắt buộc, 1-5) */
    @NotNull(message = "Vui lòng chọn số sao đánh giá")
    @Min(value = 1, message = "Điểm tối thiểu là 1 sao")
    @Max(value = 5, message = "Điểm tối đa là 5 sao")
    private Integer overallStars;

    /** Nhận xét bằng văn bản (tùy chọn) */
    @Size(max = 1000, message = "Nhận xét tối đa 1000 ký tự")
    private String comment;
}
