package com.hourlink.admin.dto.request;

import com.hourlink.helprequest.enums.RequestStatus;
import com.hourlink.skill.enums.SessionFormat;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class AdminCreateHelpRequestRequest {

    @NotNull(message = "Phải chọn người yêu cầu hỗ trợ")
    private UUID requesterId;

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 255, message = "Tiêu đề tối đa 255 ký tự")
    private String title;

    private String description;

    private UUID categoryId;

    @Size(max = 100)
    private String currentLevel;

    private SessionFormat format;

    @Size(max = 150)
    private String desiredTime;

    private Integer duration;

    @Size(max = 200)
    private String region;

    @Min(value = 0, message = "Tín dụng thời gian tối thiểu là 0.5")
    private Double timeCreditAmount = 1.0;

    private RequestStatus status = RequestStatus.SEARCHING;
}
