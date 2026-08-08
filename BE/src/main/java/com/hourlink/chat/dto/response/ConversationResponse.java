package com.hourlink.chat.dto.response;

import com.hourlink.chat.enums.MessageType;
import com.hourlink.invitation.enums.InvitationStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

/**
 * ConversationResponse — Một cuộc trò chuyện ở màn danh sách (chức năng 9.10).
 */
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConversationResponse {

    UUID id;

    // ─── Lời mời nguồn ───────────────────────────────────────────────────────
    UUID invitationId;
    InvitationStatus invitationStatus;
    UUID invitationSenderId;
    UUID invitationReceiverId;

    /** Tên kỹ năng trao đổi, hiển thị làm phụ đề dưới tên người dùng */
    String skillName;

    // ─── Người còn lại trong cuộc trò chuyện ─────────────────────────────────
    UUID otherUserId;
    String otherUserName;
    String otherUserAvatarUrl;
    Double otherUserReputationScore;

    // ─── Tin nhắn cuối ───────────────────────────────────────────────────────
    String lastMessagePreview;
    MessageType lastMessageType;
    Instant lastMessageAt;

    /** Số tin nhắn tôi chưa đọc trong cuộc trò chuyện này */
    Long unreadCount;

    // ─── Trạng thái chặn ─────────────────────────────────────────────────────

    /** Tôi đã chặn người kia */
    Boolean isBlockedByMe;

    /** Người kia đã chặn tôi */
    Boolean hasBlockedMe;

    Boolean isActive;
    Instant createdAt;
}
