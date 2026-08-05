package com.hourlink.report.dto.response;

import com.hourlink.report.entity.Report;
import com.hourlink.report.enums.ReportReason;
import com.hourlink.report.enums.ReportStatus;
import com.hourlink.report.enums.ReportTargetType;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class ReportResponse {
    private UUID id;
    private UUID reporterId;
    private String reporterName;
    private ReportTargetType targetType;
    private UUID targetId;
    private ReportReason reason;
    private String description;
    private List<String> evidenceUrls;
    private ReportStatus status;
    private String adminNote;
    private Instant createdAt;
    private Instant updatedAt;

    public static ReportResponse fromEntity(Report entity) {
        List<String> urls = (entity.getEvidenceUrls() != null && !entity.getEvidenceUrls().isBlank())
                ? Arrays.asList(entity.getEvidenceUrls().split(","))
                : Collections.emptyList();

        return ReportResponse.builder()
                .id(entity.getId())
                .reporterId(entity.getReporter().getId())
                .reporterName(entity.getReporter().getFullName())
                .targetType(entity.getTargetType())
                .targetId(entity.getTargetId())
                .reason(entity.getReason())
                .description(entity.getDescription())
                .evidenceUrls(urls)
                .status(entity.getStatus())
                .adminNote(entity.getAdminNote())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
