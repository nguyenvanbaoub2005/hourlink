package com.hourlink.community.dto.response;

import com.hourlink.community.entity.OrganizationFollow;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class FollowedOrganizationResponse {
    private UUID organizationId;
    private String organizationName;
    private String organizationAvatarUrl;
    private Instant followedAt;

    public static FollowedOrganizationResponse fromEntity(OrganizationFollow follow) {
        return FollowedOrganizationResponse.builder()
                .organizationId(follow.getOrganization().getId())
                .organizationName(follow.getOrganization().getFullName())
                .organizationAvatarUrl(follow.getOrganization().getAvatarUrl())
                .followedAt(follow.getCreatedAt())
                .build();
    }
}
