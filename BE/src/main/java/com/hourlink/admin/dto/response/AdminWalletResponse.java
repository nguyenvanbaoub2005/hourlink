package com.hourlink.admin.dto.response;

import com.hourlink.user.enums.UserType;

import java.time.Instant;
import java.util.UUID;

public record AdminWalletResponse(
        UUID walletId,
        UUID userId,
        String userFullName,
        String userEmail,
        UserType userType,
        String userAvatarUrl,
        boolean locked,
        boolean deleted,
        double balance,
        double heldAmount,
        double totalEarned,
        double totalUsed,
        double ledgerBalance,
        boolean inconsistent,
        double invariantDifference,
        Instant createdAt,
        Instant updatedAt
) {
}
