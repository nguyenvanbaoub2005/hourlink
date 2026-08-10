package com.hourlink.admin.dto.response;

import com.hourlink.admin.enums.AdminWalletTransactionDirection;
import com.hourlink.wallet.enums.WalletTxType;

import java.time.Instant;
import java.util.UUID;

public record AdminWalletTransactionResponse(
        UUID id,
        UUID walletId,
        UUID userId,
        String userFullName,
        String userEmail,
        WalletTxType type,
        double amount,
        double signedAmount,
        AdminWalletTransactionDirection direction,
        double balanceAfter,
        String description,
        UUID appointmentId,
        String appointmentTitle,
        String referenceType,
        UUID referenceId,
        String idempotencyKey,
        Instant createdAt
) {
}
