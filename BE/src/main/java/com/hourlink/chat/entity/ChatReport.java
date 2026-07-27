package com.hourlink.chat.entity;

import com.hourlink.common.entity.BaseEntity;
import com.hourlink.chat.enums.ChatReportReason;
import com.hourlink.chat.enums.ChatReportStatus;
import com.hourlink.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * ChatReport — Báo cáo một tin nhắn vi phạm (chức năng 9.10).
 *
 * <p>Giữ lại {@code messageSnapshot} tại thời điểm báo cáo để admin vẫn có
 * bằng chứng ngay cả khi tin nhắn gốc bị thay đổi hoặc xoá (mục 9.22, 9.23).</p>
 */
@Entity
@Table(name = "chat_report", indexes = {
        @Index(name = "idx_chat_report_reporter", columnList = "reporter_id"),
        @Index(name = "idx_chat_report_message",  columnList = "message_id"),
        @Index(name = "idx_chat_report_status",   columnList = "status")
})
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatReport extends BaseEntity {

    /** Người gửi báo cáo */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    User reporter;

    /** Người bị báo cáo (người gửi tin nhắn) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_user_id", nullable = false)
    User reportedUser;

    /** Tin nhắn bị báo cáo */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    ChatMessage message;

    /** Lý do báo cáo */
    @Enumerated(EnumType.STRING)
    @Column(name = "reason", length = 50, nullable = false)
    ChatReportReason reason;

    /** Mô tả chi tiết do người báo cáo nhập */
    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    /** Bản sao nội dung tin nhắn tại thời điểm báo cáo (bằng chứng) */
    @Column(name = "message_snapshot", columnDefinition = "TEXT")
    String messageSnapshot;

    /** Trạng thái xử lý của admin */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    ChatReportStatus status = ChatReportStatus.PENDING;
}
