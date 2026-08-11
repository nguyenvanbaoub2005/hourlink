package com.hourlink.admin.dto.response;

import com.hourlink.admin.enums.AdminReportSource;
import com.hourlink.report.enums.ReportStatus;
import com.hourlink.report.enums.ReportTargetType;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AdminReportDetailResponse(
        UUID id,
        AdminReportSource source,
        UUID targetId,
        ReportTargetType targetType,
        String targetLabel,
        String targetDescription,
        String reason,
        String description,
        int evidenceCount,
        List<String> evidenceUrls,
        ReportStatus status,
        String adminNote,
        UUID reporterId,
        String reporterName,
        String reporterEmail,
        String reporterAvatarUrl,
        UUID targetUserId,
        String targetUserName,
        String targetUserEmail,
        Boolean targetUserLocked,
        Instant createdAt,
        Instant updatedAt
) {
}
