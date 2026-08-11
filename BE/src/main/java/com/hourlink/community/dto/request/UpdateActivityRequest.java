package com.hourlink.community.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.Instant;

/**
 * Request cập nhật hoạt động cộng đồng (US-35 — CRUD).
 * Tất cả các field đều tuỳ chọn (null = không đổi).
 */
@Data
public class UpdateActivityRequest {

    @Size(max = 200)
    private String title;

    @Size(max = 5000)
    private String description;

    @Size(max = 500)
    private String location;

    private Instant startTime;
    private Instant endTime;

    @Min(value = 1)
    private Integer maxParticipants;

    @DecimalMin(value = "0.5")
    private Double creditReward;
}
