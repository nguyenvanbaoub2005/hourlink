package com.hourlink.wallet.dto.response;

import com.hourlink.wallet.entity.WalletTransaction;
import com.hourlink.wallet.enums.WalletTxType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

/**
 * WalletTransactionResponse — DTO lịch sử giao dịch Time Credit (chức năng 9.16).
 */
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WalletTransactionResponse {

    UUID id;

    /** Loại giao dịch */
    WalletTxType type;

    /** Số lượng Time Credit (luôn dương; chiều xác định bởi type) */
    Double amount;

    /** Số dư ví ngay sau giao dịch này (snapshot lịch sử) */
    Double balanceAfter;

    /** Mô tả hiển thị cho người dùng */
    String description;

    /** UUID của lịch hẹn liên quan (nếu có) */
    UUID relatedAppointmentId;

    /** Tiêu đề lịch hẹn liên quan (nếu có) */
    String relatedAppointmentTitle;

    Instant createdAt;

    public static WalletTransactionResponse fromEntity(WalletTransaction tx) {
        return WalletTransactionResponse.builder()
                .id(tx.getId())
                .type(tx.getType())
                .amount(tx.getAmount())
                .balanceAfter(tx.getBalanceAfter())
                .description(tx.getDescription())
                .relatedAppointmentId(
                        tx.getAppointment() != null ? tx.getAppointment().getId() : null)
                .relatedAppointmentTitle(
                        tx.getAppointment() != null ? tx.getAppointment().getTitle() : null)
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
