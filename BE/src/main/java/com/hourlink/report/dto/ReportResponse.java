package com.hourlink.report.dto;

import com.hourlink.report.enums.ReportReason;
import com.hourlink.report.enums.ReportStatus;
import com.hourlink.report.enums.ReportTargetType;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReportResponse {
    UUID id;
    UUID targetId;
    ReportTargetType targetType;
    ReportReason reason;
    String description;
    String evidenceUrls;
    ReportStatus status;
    String adminNote;
    Instant createdAt;
}
