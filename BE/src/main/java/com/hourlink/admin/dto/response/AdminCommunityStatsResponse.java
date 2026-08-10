package com.hourlink.admin.dto.response;

public record AdminCommunityStatsResponse(
        long totalActivities,
        long openActivities,
        long closedActivities,
        long completedActivities,
        long cancelledActivities,
        long totalRegistrations,
        long confirmedParticipations,
        double awardedHours
) {
}
