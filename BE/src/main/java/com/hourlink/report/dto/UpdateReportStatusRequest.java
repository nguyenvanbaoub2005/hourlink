package com.hourlink.report.dto;

import com.hourlink.report.enums.ReportStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateReportStatusRequest {
    @NotNull(message = "Trạng thái không được để trống")
    private ReportStatus status;
    private String adminNote;
}
