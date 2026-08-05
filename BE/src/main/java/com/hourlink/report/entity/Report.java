package com.hourlink.report.entity;

import com.hourlink.common.entity.BaseEntity;
import com.hourlink.report.enums.ReportReason;
import com.hourlink.report.enums.ReportStatus;
import com.hourlink.report.enums.ReportTargetType;
import com.hourlink.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

/**
 * Report — Báo cáo vi phạm (US-39, US-40).
 */
@Entity
@Table(name = "report")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Report extends BaseEntity {

    /** Người gửi báo cáo */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    User reporter;

    /** Loại đối tượng bị báo cáo: USER / MESSAGE / CONTENT */
    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false)
    ReportTargetType targetType;

    /** ID của đối tượng bị báo cáo (user, message, content...) */
    @Column(name = "target_id", nullable = false, columnDefinition = "BINARY(16)")
    UUID targetId;

    /** Lý do báo cáo */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    ReportReason reason;

    /** Mô tả chi tiết vi phạm */
    @Column(columnDefinition = "TEXT")
    String description;

    /**
     * URL bằng chứng (hình ảnh, screenshot...).
     * Lưu danh sách URL phân cách bởi dấu phẩy để đơn giản.
     * Có thể nâng cấp thành bảng riêng về sau.
     */
    @Column(name = "evidence_urls", columnDefinition = "TEXT")
    String evidenceUrls;

    /** Trạng thái xử lý */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    ReportStatus status = ReportStatus.PENDING;

    /** Ghi chú của admin khi xử lý */
    @Column(name = "admin_note", columnDefinition = "TEXT")
    String adminNote;
}
