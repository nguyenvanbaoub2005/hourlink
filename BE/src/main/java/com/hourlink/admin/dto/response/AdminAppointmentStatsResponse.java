package com.hourlink.admin.dto.response;

public record AdminAppointmentStatsResponse(
        long total,
        long pending,
        long active,
        long completed,
        long cancelled,
        long disputed,
        long rescheduled,
        double completionRate,
        double cancellationRate,
        double disputeRate
) {
}
