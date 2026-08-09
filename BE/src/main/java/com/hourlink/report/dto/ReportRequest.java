package com.hourlink.report.dto;

import com.hourlink.report.enums.ReportReason;
import com.hourlink.report.enums.ReportTargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Setter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReportRequest {

    @NotNull(message = "Target ID cannot be null")
    UUID targetId;

    @NotNull(message = "Target type cannot be null")
    ReportTargetType targetType;

    @NotNull(message = "Reason cannot be null")
    ReportReason reason;

    @NotBlank(message = "Description cannot be blank")
    String description;

    String evidenceUrls;
}
