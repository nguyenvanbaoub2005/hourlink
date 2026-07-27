package com.hourlink.invitation.dto.response;

import com.hourlink.invitation.enums.InvitationStatus;
import com.hourlink.skill.enums.SessionFormat;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

/**
 * InvitationResponse — Dữ liệu trả về cho lời mời hỗ trợ (chức năng 9.9).
 */
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InvitationResponse {

    UUID id;

    // ─── Sender (người gửi) ──────────────────────────────────────
    UUID senderId;
    String senderName;
    String senderAvatarUrl;

    // ─── Receiver (người nhận) ───────────────────────────────────
    UUID receiverId;
    String receiverName;
    String receiverAvatarUrl;

    // ─── Kỹ năng liên quan ───────────────────────────────────────
    UUID skillId;
    String skillName;

    // ─── Yêu cầu hỗ trợ liên kết ─────────────────────────────────
    UUID helpRequestId;
    String helpRequestTitle;

    // ─── Nội dung lời mời ────────────────────────────────────────
    String content;
    String message;
    String proposedTime;
    Integer duration;
    SessionFormat format;

    // ─── Trạng thái & phản hồi ───────────────────────────────────
    InvitationStatus status;
    String rejectReason;
    String rescheduleTime;

    Instant createdAt;
    Instant updatedAt;
}
