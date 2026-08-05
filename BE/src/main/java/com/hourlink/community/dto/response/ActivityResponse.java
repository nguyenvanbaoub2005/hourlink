package com.hourlink.community.dto.response;

import com.hourlink.community.entity.CommunityActivity;
import com.hourlink.community.enums.ActivityStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
public class ActivityResponse {
    private UUID id;
    private String title;
    private String description;
    private String location;
    private Instant startTime;
    private Instant endTime;
    private int creditReward;
    private int maxParticipants;
    private int currentParticipants;
    private ActivityStatus status;
    private UUID organizerId;
    private String organizerName;
    private String organizerAvatar;
    private Instant createdAt;

    public static ActivityResponse fromEntity(CommunityActivity entity) {
        return ActivityResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .location(entity.getLocation())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .creditReward(entity.getCreditReward())
                .maxParticipants(entity.getMaxParticipants())
                .currentParticipants(entity.getCurrentParticipantCount())
                .status(entity.getStatus())
                .organizerId(entity.getOrganizer().getId())
                .organizerName(entity.getOrganizer().getFullName())
                .organizerAvatar(entity.getOrganizer().getAvatarUrl())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
