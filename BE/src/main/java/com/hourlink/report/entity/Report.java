package com.hourlink.report.entity;

import com.hourlink.common.entity.BaseEntity;
import com.hourlink.report.enums.ReportReason;
import com.hourlink.report.enums.ReportStatus;
import com.hourlink.report.enums.ReportTargetType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Entity
@Table(name = "report")
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Report extends BaseEntity {

    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    @Column(name = "evidence_urls", columnDefinition = "TEXT")
    String evidenceUrls;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason", nullable = false)
    ReportReason reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    ReportStatus status = ReportStatus.PENDING;

    @Column(name = "target_id", nullable = false)
    UUID targetId;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false)
    ReportTargetType targetType;

    @Column(name = "reporter_id", nullable = false)
    UUID reporterId;

    @Column(name = "admin_note", columnDefinition = "TEXT")
    String adminNote;
}
