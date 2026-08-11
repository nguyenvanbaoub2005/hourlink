package com.hourlink.wallet.dto.response;

import com.hourlink.wallet.entity.Wallet;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

/**
 * WalletResponse — DTO trả về thông tin ví Time Credit cho client (chức năng 9.16).
 */
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WalletResponse {

    UUID id;
    UUID userId;
    String userFullName;

    /** Số dư có thể dùng ngay */
    Double balance;

    /** Số đang bị tạm giữ */
    Double heldAmount;

    /** Tổng Time Credit đã kiếm từ trước tới nay */
    Double totalEarned;

    /** Tổng Time Credit đã sử dụng từ trước tới nay */
    Double totalUsed;

    Instant updatedAt;

    public static WalletResponse fromEntity(Wallet w) {
        return WalletResponse.builder()
                .id(w.getId())
                .userId(w.getUser().getId())
                .userFullName(w.getUser().getFullName())
                .balance(w.getBalance())
                .heldAmount(w.getHeldAmount())
                .totalEarned(w.getTotalEarned())
                .totalUsed(w.getTotalUsed())
                .updatedAt(w.getUpdatedAt())
                .build();
    }
}
