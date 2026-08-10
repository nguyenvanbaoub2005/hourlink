package com.hourlink.admin.dto.response;

public record AdminWalletAdjustmentResponse(
        AdminWalletResponse wallet,
        AdminWalletTransactionResponse transaction,
        boolean idempotentReplay
) {
}
