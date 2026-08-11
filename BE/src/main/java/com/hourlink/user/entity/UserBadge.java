package com.hourlink.user.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

/**
 * UserBadge — Bảng trung gian lưu huy hiệu đã được trao cho người dùng.
 * Mỗi record = 1 người dùng được nhận 1 huy hiệu tại 1 thời điểm.
 * UniqueConstraint đảm bảo mỗi người chỉ nhận mỗi loại huy hiệu 1 lần.
 */
@Entity
@Table(name = "user_badge", indexes = {
        @Index(name = "idx_user_badge_user",  columnList = "user_id"),
        @Index(name = "idx_user_badge_badge", columnList = "badge_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_user_badge", columnNames = {"user_id", "badge_id"})
})
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserBadge extends BaseEntity {

    /** Người dùng được nhận huy hiệu */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    /** Huy hiệu được trao */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "badge_id", nullable = false)
    Badge badge;

    /** Thời điểm được trao huy hiệu */
    @Column(name = "awarded_at", nullable = false)
    @Builder.Default
    Instant awardedAt = Instant.now();
}
