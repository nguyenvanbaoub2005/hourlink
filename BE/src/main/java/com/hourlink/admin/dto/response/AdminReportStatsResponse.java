package com.hourlink.admin.dto.response;

public record AdminReportStatsResponse(
        long total,
        long pending,
        long reviewing,
        long resolved,
        long dismissed
) {
}
