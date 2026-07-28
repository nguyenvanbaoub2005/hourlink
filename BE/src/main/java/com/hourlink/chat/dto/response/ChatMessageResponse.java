package com.hourlink.chat.dto.response;

import com.hourlink.chat.enums.MessageType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

/**
 * ChatMessageResponse — Một tin nhắn trả về cho client (chức năng 9.10).
 */
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessageResponse {

    UUID id;
    UUID conversationId;

    // ─── Người gửi ───────────────────────────────────────────────────────────
    UUID senderId;
    String senderName;
    String senderAvatarUrl;

    // ─── Nội dung ────────────────────────────────────────────────────────────
    MessageType type;
    String content;

    /** Đính kèm (IMAGE / DOCUMENT) */
    String attachmentUrl;
    String originalName;
    Long fileSize;

    /** Vị trí (LOCATION) */
    Double latitude;
    Double longitude;
    String locationLabel;

    /** Link họp online (MEETING_LINK) */
    String meetingLink;

    /** Thời gian đề xuất mới (RESCHEDULE_PROPOSAL) */
    String proposedTime;

    /** ID lịch hẹn (APPOINTMENT_CARD) */
    UUID appointmentId;

    /** JSON data snapshot lịch hẹn (APPOINTMENT_CARD) */
    String appointmentData;

    // ─── Trạng thái ──────────────────────────────────────────────────────────
    Boolean isRead;
    Instant createdAt;
}
