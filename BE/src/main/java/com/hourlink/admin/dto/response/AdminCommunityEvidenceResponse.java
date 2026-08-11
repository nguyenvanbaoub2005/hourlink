package com.hourlink.admin.dto.response;

import java.time.Instant;
import java.util.UUID;

public record AdminCommunityEvidenceResponse(
        UUID id,
        String fileUrl,
        String originalName,
        Long fileSize,
        Instant createdAt
) {
}
