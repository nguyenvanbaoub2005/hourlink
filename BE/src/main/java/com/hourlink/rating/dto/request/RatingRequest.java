package com.hourlink.rating.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/**
 * RatingRequest — Yêu cầu gửi đánh giá sau khi hoàn thành lịch hẹn.
 */
@Data
public class RatingRequest {

    @NotNull(message = "Vui lòng cung cấp ID lịch hẹn")
    UUID appointmentId;

    @NotNull(message = "Vui lòng cung cấp ID người được đánh giá")
    UUID toUserId;

    @NotNull(message = "Vui lòng nhập số sao")
    @Min(value = 1, message = "Số sao tối thiểu là 1")
    @Max(value = 5, message = "Số sao tối đa là 5")
    Integer score;

    /** Nhận xét tuỳ chọn */
    String comment;
}
