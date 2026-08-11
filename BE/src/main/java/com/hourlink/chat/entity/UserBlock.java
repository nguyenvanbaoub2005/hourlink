package com.hourlink.chat.entity;

import com.hourlink.common.entity.BaseEntity;
import com.hourlink.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * UserBlock — Bản ghi một người dùng chặn một người dùng khác (chức năng 9.10).
 *
 * <p>Việc chặn có hiệu lực hai chiều khi gửi tin: cả người chặn lẫn người bị
 * chặn đều không gửi được tin nhắn mới cho nhau.</p>
 */
@Entity
@Table(name = "user_block",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_block_pair", columnNames = {"blocker_id", "blocked_id"}),
        indexes = {
                @Index(name = "idx_block_blocker", columnList = "blocker_id"),
                @Index(name = "idx_block_blocked", columnList = "blocked_id")
        })
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserBlock extends BaseEntity {

    /** Người thực hiện chặn */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocker_id", nullable = false)
    User blocker;

    /** Người bị chặn */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocked_id", nullable = false)
    User blocked;

    /** Lý do chặn (tùy chọn) */
    @Column(name = "reason", columnDefinition = "TEXT")
    String reason;
}
