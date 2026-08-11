package com.hourlink.wallet.entity;

import com.hourlink.common.entity.BaseEntity;
import com.hourlink.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Wallet — Ví Time Credit của mỗi người dùng HourLink (chức năng 9.16).
 * <p>
 * - balance     : Số dư khả dụng (có thể dùng ngay).
 * - heldAmount  : Số đang bị tạm giữ (khi Appointment CONFIRMED).
 * - totalEarned : Tổng Time Credit đã kiếm được từ trước tới nay.
 * - totalUsed   : Tổng Time Credit đã sử dụng từ trước tới nay.
 * <p>
 * Invariant: balance + heldAmount = totalEarned - totalUsed.
 * Credit khởi đầu đã được tính trong {@code totalEarned}, nên không cộng thêm lần nữa.
 */
@Entity
@Table(name = "wallet", indexes = {
        @Index(name = "idx_wallet_user", columnList = "user_id", unique = true)
})
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Wallet extends BaseEntity {

    /** Chủ ví — quan hệ 1-1 với User */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    User user;

    /** Số dư Time Credit khả dụng (dùng được ngay) */
    @Column(name = "balance", nullable = false)
    @Builder.Default
    Double balance = 5.0;

    /** Số Time Credit đang bị tạm giữ (khi có Appointment CONFIRMED) */
    @Column(name = "held_amount", nullable = false)
    @Builder.Default
    Double heldAmount = 0.0;

    /** Tổng Time Credit đã kiếm được (cộng dồn toàn bộ lịch sử EARN + BONUS) */
    @Column(name = "total_earned", nullable = false)
    @Builder.Default
    Double totalEarned = 5.0;

    /** Tổng Time Credit đã sử dụng (cộng dồn toàn bộ lịch sử SPEND) */
    @Column(name = "total_used", nullable = false)
    @Builder.Default
    Double totalUsed = 0.0;
}
