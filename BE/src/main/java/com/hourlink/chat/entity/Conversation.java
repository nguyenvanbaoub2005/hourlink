package com.hourlink.chat.entity;

import com.hourlink.common.entity.BaseEntity;
import com.hourlink.chat.enums.ConversationSourceType;
import com.hourlink.chat.enums.MessageType;
import com.hourlink.community.entity.CommunityActivity;
import com.hourlink.invitation.entity.Invitation;
import com.hourlink.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

/**
 * Conversation — Cuộc trò chuyện 1-1 giữa hai người dùng (chức năng 9.10).
 *
 * <p>Hội thoại có thể được tạo từ lời mời kỹ năng đã chấp nhận hoặc từ một
 * lượt đăng ký hoạt động cộng đồng hợp lệ.</p>
 *
 * <p>Tin nhắn được mirror sang Firebase Firestore theo đường dẫn
 * {@code conversations/{id}/messages} để phục vụ realtime; MySQL vẫn là
 * nguồn sự thật và là bằng chứng khi xử lý tranh chấp (mục 9.23).</p>
 */
@Entity
@Table(name = "conversation", indexes = {
        @Index(name = "idx_conv_user_one",     columnList = "user_one_id"),
        @Index(name = "idx_conv_user_two",     columnList = "user_two_id"),
        @Index(name = "idx_conv_community_activity", columnList = "community_activity_id"),
        @Index(name = "idx_conv_last_msg_at",  columnList = "last_message_at")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_conv_community_participant",
                columnNames = {"community_activity_id", "user_two_id"})
})
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Conversation extends BaseEntity {

    /** Lời mời đã được chấp nhận; null với hội thoại hoạt động cộng đồng. */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invitation_id", unique = true)
    Invitation invitation;

    /** Hoạt động nguồn; null với hội thoại kỹ năng. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "community_activity_id")
    CommunityActivity communityActivity;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 30,
            columnDefinition = "VARCHAR(30) DEFAULT 'SKILL_INVITATION'")
    @Builder.Default
    ConversationSourceType sourceType = ConversationSourceType.SKILL_INVITATION;

    /** Người thứ nhất: sender lời mời hoặc tổ chức hoạt động. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_one_id", nullable = false)
    User userOne;

    /** Người thứ hai: receiver lời mời hoặc người đăng ký hoạt động. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_two_id", nullable = false)
    User userTwo;

    /** Trích đoạn tin nhắn cuối, hiển thị ở màn danh sách (denormalize) */
    @Column(name = "last_message_preview", length = 255)
    String lastMessagePreview;

    /** Loại tin nhắn cuối, để hiển thị icon phù hợp ở danh sách */
    @Enumerated(EnumType.STRING)
    @Column(name = "last_message_type", length = 50)
    MessageType lastMessageType;

    /** Thời điểm tin nhắn cuối — dùng để sắp xếp danh sách hội thoại */
    @Column(name = "last_message_at")
    Instant lastMessageAt;

    // ─── Các cờ Ẩn / Lưu trữ (Hide/Archive) ─────────────────────────────────

    /** Cờ đánh dấu userOne đã ẩn cuộc trò chuyện này */
    @Column(name = "hidden_by_user_one", nullable = false)
    @Builder.Default
    boolean hiddenByUserOne = false;

    /** Cờ đánh dấu userTwo đã ẩn cuộc trò chuyện này */
    @Column(name = "hidden_by_user_two", nullable = false)
    @Builder.Default
    boolean hiddenByUserTwo = false;

    /** Cuộc trò chuyện còn hoạt động hay không */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    Boolean isActive = true;
}
