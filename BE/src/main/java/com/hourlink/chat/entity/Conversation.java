package com.hourlink.chat.entity;

import com.hourlink.common.entity.BaseEntity;
import com.hourlink.chat.enums.MessageType;
import com.hourlink.invitation.entity.Invitation;
import com.hourlink.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

/**
 * Conversation — Cuộc trò chuyện 1-1 giữa hai người dùng (chức năng 9.10).
 *
 * <p>Chỉ được tạo sau khi lời mời hỗ trợ chuyển sang trạng thái ACCEPTED.
 * Mỗi Invitation tương ứng tối đa một Conversation.</p>
 *
 * <p>Tin nhắn được mirror sang Firebase Firestore theo đường dẫn
 * {@code conversations/{id}/messages} để phục vụ realtime; MySQL vẫn là
 * nguồn sự thật và là bằng chứng khi xử lý tranh chấp (mục 9.23).</p>
 */
@Entity
@Table(name = "conversation", indexes = {
        @Index(name = "idx_conv_user_one",     columnList = "user_one_id"),
        @Index(name = "idx_conv_user_two",     columnList = "user_two_id"),
        @Index(name = "idx_conv_last_msg_at",  columnList = "last_message_at")
})
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Conversation extends BaseEntity {

    /** Lời mời đã được chấp nhận, là điều kiện mở cuộc trò chuyện */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invitation_id", nullable = false, unique = true)
    Invitation invitation;

    /** Người tham gia thứ nhất (sender của lời mời — người cần hỗ trợ) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_one_id", nullable = false)
    User userOne;

    /** Người tham gia thứ hai (receiver của lời mời — người hỗ trợ) */
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

    /** Cuộc trò chuyện còn hoạt động hay không */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    Boolean isActive = true;
}
