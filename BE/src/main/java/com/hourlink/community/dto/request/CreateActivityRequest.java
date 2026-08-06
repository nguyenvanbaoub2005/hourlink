package com.hourlink.community.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.Instant;

/**
 * Request tạo hoạt động cộng đồng (US-35 — Tổ chức CRUD).
 */
@Data
public class CreateActivityRequest {

    @NotBlank(message = "Tên hoạt động không được để trống")
    @Size(max = 200)
    private String title;

    @Size(max = 5000)
    private String description;

    @Size(max = 500)
    private String location;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private Instant startTime;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private Instant endTime;

    /** Số người tối đa (null = không giới hạn) */
    @Min(value = 1, message = "Số lượng tối thiểu là 1")
    private Integer maxParticipants;

    /**
     * Số Time Credit thưởng cho mỗi người sau khi xác nhận.
     * Tối thiểu 0.5 TC.
     */
    @NotNull(message = "Credit thưởng không được để trống")
    @DecimalMin(value = "0.5", message = "Credit thưởng tối thiểu là 0.5 TC")
    private Double creditReward;
}
