package com.hourlink.chat.entity;

import com.hourlink.common.entity.BaseEntity;
import com.hourlink.chat.enums.MessageType;
import com.hourlink.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.util.UUID;

/**
 * ChatMessage — Một tin nhắn trong cuộc trò chuyện (chức năng 9.10).
 *
 * <p>Hỗ trợ đủ 6 dạng nội dung theo tài liệu: văn bản, hình ảnh, tài liệu,
 * vị trí, link họp online và đề xuất đổi lịch (cộng thêm tin hệ thống).</p>
 */
@Entity
@Table(name = "chat_message", indexes = {
        @Index(name = "idx_msg_conversation", columnList = "conversation_id"),
        @Index(name = "idx_msg_sender",       columnList = "sender_id"),
        @Index(name = "idx_msg_is_read",      columnList = "is_read")
})
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessage extends BaseEntity {

    /** Cuộc trò chuyện chứa tin nhắn này */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    Conversation conversation;

    /** Người gửi (null với tin SYSTEM do hệ thống sinh) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    User sender;

    /** Loại tin nhắn */
    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 50, nullable = false)
    @Builder.Default
    MessageType type = MessageType.TEXT;

    /** Nội dung văn bản, hoặc chú thích đi kèm ảnh/tài liệu */
    @Column(name = "content", columnDefinition = "TEXT")
    String content;

    // ─── Đính kèm (IMAGE / DOCUMENT) ────────────────────────────────────────

    /** URL file trên Cloudinary (secure_url) */
    @Column(name = "attachment_url", columnDefinition = "TEXT")
    String attachmentUrl;

    /** public_id trên Cloudinary, cần khi xoá file */
    @Column(name = "public_id", length = 300)
    String publicId;

    /** Tên file gốc người dùng tải lên */
    @Column(name = "original_name", length = 255)
    String originalName;

    /** Dung lượng file (byte) */
    @Column(name = "file_size")
    Long fileSize;

    // ─── Vị trí (LOCATION) ──────────────────────────────────────────────────

    /** Vĩ độ */
    @Column(name = "latitude")
    Double latitude;

    /** Kinh độ */
    @Column(name = "longitude")
    Double longitude;

    /** Mô tả địa điểm, ví dụ "Quán cà phê Highlands Nguyễn Huệ" */
    @Column(name = "location_label", length = 255)
    String locationLabel;

    // ─── Link họp online (MEETING_LINK) ─────────────────────────────────────

    /** Link phòng họp: Google Meet, Zoom... */
    @Column(name = "meeting_link", columnDefinition = "TEXT")
    String meetingLink;

    // ─── Đề xuất đổi lịch (RESCHEDULE_PROPOSAL) ─────────────────────────────

    /** Thời gian đề xuất mới, cùng định dạng với Invitation.rescheduleTime */
    @Column(name = "proposed_time", length = 200)
    String proposedTime;

    // ─── Trạng thái ─────────────────────────────────────────────────────────

    /** Người nhận đã đọc tin này chưa */
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    Boolean isRead = false;

    // ─── Lịch hẹn (APPOINTMENT_CARD) ────────────────────────────────────────

    /** ID lịch hẹn được nhúng vào card chat */
    @Column(name = "appointment_id")
    UUID appointmentId;

    /** JSON snapshot thông tin lịch hẹn (để hiển thị ngay mà không cần query) */
    @Column(name = "appointment_data", columnDefinition = "TEXT")
    String appointmentData;
}
