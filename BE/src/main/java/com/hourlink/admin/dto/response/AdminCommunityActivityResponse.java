package com.hourlink.admin.dto.response;

import com.hourlink.community.enums.ActivityStatus;

import java.time.Instant;
import java.util.UUID;

public record AdminCommunityActivityResponse(
        UUID id,
        String title,
        String location,
        Instant startTime,
        Instant endTime,
        Integer maxParticipants,
        Double creditReward,
        ActivityStatus status,
        UUID organizerId,
        String organizerName,
        String organizerEmail,
        long registeredCount,
        long confirmedCount,
        long absentCount,
        long cancelledCount,
        Instant createdAt
) {
}
