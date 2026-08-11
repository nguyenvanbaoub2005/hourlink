package com.hourlink.admin.dto.response;

import java.time.Instant;

public record AdminWalletOverviewResponse(
        long totalWallets,
        double totalAvailableBalance,
        double totalHeldAmount,
        double totalEconomyBalance,
        double totalEarned,
        double totalUsed,
        long missingWalletCount,
        long walletsWithHeldCredit,
        long inconsistentWallets,
        long transactionCountToday,
        double transactionVolumeToday,
        long adjustmentCountToday,
        double adjustmentVolumeToday,
        Instant generatedAt
) {
}
