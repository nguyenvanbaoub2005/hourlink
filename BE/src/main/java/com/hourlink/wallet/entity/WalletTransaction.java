package com.hourlink.wallet.entity;

import com.hourlink.appointment.entity.Appointment;
import com.hourlink.common.entity.BaseEntity;
import com.hourlink.wallet.enums.WalletTxType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * WalletTransaction — Lịch sử giao dịch Time Credit (chức năng 9.16).
 * <p>
 * Mỗi hành động liên quan đến Time Credit đều sinh ra một bản ghi ở đây:
 *   HOLD    → khi Appointment CONFIRMED
 *   RELEASE → khi Appointment CANCELLED (sau CONFIRMED)
 *   SPEND   → khi Appointment COMPLETED (Receiver bị trừ)
 *   EARN    → khi Appointment COMPLETED (Provider được cộng)
 *   REFUND  → Admin hoàn trả trong tranh chấp
 *   BONUS   → Tặng thưởng khởi đầu khi đăng ký hoặc hoạt động cộng đồng
 *   ADJUSTMENT → Admin điều chỉnh thủ công
 */
@Entity
@Table(name = "wallet_transaction", indexes = {
        @Index(name = "idx_wallet_tx_wallet",      columnList = "wallet_id"),
        @Index(name = "idx_wallet_tx_type",        columnList = "type"),
        @Index(name = "idx_wallet_tx_appointment", columnList = "appointment_id")
})
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WalletTransaction extends BaseEntity {

    /** Ví mà giao dịch này thuộc về */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", nullable = false)
    Wallet wallet;

    /** Lịch hẹn gây ra giao dịch (nullable nếu BONUS / ADJUSTMENT) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    Appointment appointment;

    /** Loại giao dịch */
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    WalletTxType type;

    /**
     * Số lượng Time Credit của giao dịch này (luôn dương).
     * Chiều dương/âm được xác định bởi type:
     *   EARN, RELEASE, REFUND, BONUS, ADJUSTMENT(+) → cộng vào balance
     *   SPEND, HOLD, ADJUSTMENT(-)                  → trừ khỏi balance
     */
    @Column(name = "amount", nullable = false)
    Double amount;

    /** Số dư ví SAU khi giao dịch này thực hiện (snapshot để hiển thị lịch sử) */
    @Column(name = "balance_after", nullable = false)
    Double balanceAfter;

    /** Mô tả ngắn gọn hiển thị cho người dùng */
    @Column(name = "description", columnDefinition = "TEXT")
    String description;
}
