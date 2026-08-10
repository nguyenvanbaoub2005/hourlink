package com.hourlink.admin.dto.response;

import com.hourlink.admin.enums.AdminReportSource;
import com.hourlink.report.enums.ReportStatus;
import com.hourlink.report.enums.ReportTargetType;

import java.time.Instant;
import java.util.UUID;

public record AdminReportResponse(
        UUID id,
        AdminReportSource source,
        UUID targetId,
        ReportTargetType targetType,
        String targetLabel,
        String reason,
        String description,
        int evidenceCount,
        ReportStatus status,
        UUID reporterId,
        String reporterName,
        String reporterEmail,
        Instant createdAt,
        Instant updatedAt
) {
}
