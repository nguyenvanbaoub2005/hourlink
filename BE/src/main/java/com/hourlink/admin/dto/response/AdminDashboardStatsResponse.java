package com.hourlink.admin.dto.response;

import java.time.Instant;

public record AdminDashboardStatsResponse(
        long totalUsers,
        long activeUsers,
        long totalAppointments,
        long activeAppointments,
        long completedToday,
        double totalTimeCredits,
        long pendingReports,
        long lockedAccounts,
        Instant generatedAt
) {
}
