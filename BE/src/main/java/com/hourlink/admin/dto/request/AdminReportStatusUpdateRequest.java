package com.hourlink.admin.dto.request;

import com.hourlink.admin.enums.AdminReportUserAction;
import com.hourlink.report.enums.ReportStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminReportStatusUpdateRequest {

    @NotNull(message = "Trạng thái không được để trống")
    private ReportStatus status;

    @Size(max = 2000, message = "Ghi chú quản trị tối đa 2000 ký tự")
    private String adminNote;

    private AdminReportUserAction userAction = AdminReportUserAction.NONE;
}
