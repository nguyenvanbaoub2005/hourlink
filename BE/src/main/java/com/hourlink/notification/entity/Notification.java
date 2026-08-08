package com.hourlink.notification.entity;

import com.hourlink.common.entity.BaseEntity;
import com.hourlink.notification.enums.NotificationType;
import com.hourlink.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

/**
 * Notification — Thông báo trong app HourLink.
 * Lưu tất cả thông báo gửi đến từng user (lời mời, phản hồi, nhắc nhở...).
 */
@Entity
@Table(name = "notification", indexes = {
        @Index(name = "idx_notif_user",    columnList = "user_id"),
        @Index(name = "idx_notif_is_read", columnList = "is_read"),
})
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Notification extends BaseEntity {

    /** Người nhận thông báo */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    /**
     * Người gây ra thông báo (người gửi tin nhắn, người gửi lời mời...).
     * Null với thông báo do hệ thống tự sinh. FE dùng để hiển thị ảnh đại diện
     * của người đó trên thông báo, giống Facebook.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    User actor;

    /** Loại thông báo */
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 60, columnDefinition = "VARCHAR(60)")
    NotificationType type;

    /** Tiêu đề ngắn */
    @Column(name = "title", length = 200, nullable = false)
    String title;

    /** Nội dung chi tiết */
    @Column(name = "body", columnDefinition = "TEXT")
    String body;

    /**
     * ID tham chiếu đến đối tượng liên quan (invitation_id, appointment_id...).
     * FE dùng để navigate tới màn hình tương ứng.
     */
    @Column(name = "reference_id", columnDefinition = "BINARY(16)")
    UUID referenceId;

    /** Đã đọc chưa */
    @Builder.Default
    @Column(name = "is_read", nullable = false)
    Boolean isRead = false;
}
