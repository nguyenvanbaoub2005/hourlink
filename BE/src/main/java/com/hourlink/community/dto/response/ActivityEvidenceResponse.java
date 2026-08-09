package com.hourlink.community.dto.response;

import com.hourlink.community.entity.ActivityEvidence;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ActivityEvidenceResponse {
    private UUID id;
    private String fileUrl;
    private String originalName;
    private Long fileSize;
    private Instant createdAt;

    public static ActivityEvidenceResponse fromEntity(ActivityEvidence evidence) {
        return ActivityEvidenceResponse.builder()
                .id(evidence.getId())
                .fileUrl(evidence.getFileUrl())
                .originalName(evidence.getOriginalName())
                .fileSize(evidence.getFileSize())
                .createdAt(evidence.getCreatedAt())
                .build();
    }
}
