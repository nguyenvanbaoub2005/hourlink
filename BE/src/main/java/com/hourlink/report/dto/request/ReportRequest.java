package com.hourlink.report.dto.request;

import com.hourlink.report.enums.ReportReason;
import com.hourlink.report.enums.ReportTargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReportRequest {

    @NotNull(message = "Loại đối tượng báo cáo không được để trống")
    ReportTargetType targetType;

    @NotNull(message = "ID đối tượng báo cáo không được để trống")
    UUID targetId;

    @NotNull(message = "Lý do báo cáo không được để trống")
    ReportReason reason;

    @NotBlank(message = "Mô tả vi phạm không được để trống")
    @Size(min = 10, max = 1000, message = "Mô tả phải từ 10 đến 1000 ký tự")
    String description;

    /** Danh sách URL bằng chứng (tuỳ chọn, tối đa 5) */
    @Size(max = 5, message = "Tối đa 5 bằng chứng")
    List<String> evidenceUrls;
}
