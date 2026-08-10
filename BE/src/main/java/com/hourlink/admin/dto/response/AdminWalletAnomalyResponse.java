package com.hourlink.admin.dto.response;

import com.hourlink.admin.enums.AdminWalletAnomalySeverity;
import com.hourlink.admin.enums.AdminWalletAnomalyType;

import java.time.Instant;
import java.util.UUID;

public record AdminWalletAnomalyResponse(
        String anomalyKey,
        AdminWalletAnomalyType type,
        AdminWalletAnomalySeverity severity,
        UUID userId,
        String userFullName,
        String userEmail,
        UUID relatedUserId,
        String relatedUserFullName,
        String relatedUserEmail,
        double metricValue,
        double threshold,
        String message,
        Instant detectedAt
) {
}
