package com.hourlink.admin.dto.response;

import com.hourlink.community.enums.ActivityParticipantStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AdminCommunityParticipantResponse(
        UUID id,
        UUID userId,
        String userName,
        String userEmail,
        String userAvatarUrl,
        ActivityParticipantStatus status,
        Double actualHours,
        String confirmNote,
        Instant confirmedAt,
        Boolean creditAwarded,
        String evidenceNote,
        Instant evidenceSubmittedAt,
        List<AdminCommunityEvidenceResponse> evidence,
        Instant registeredAt
) {
}
