package com.hourlink.community.dto.response;

import com.hourlink.community.entity.ActivityParticipant;
import com.hourlink.community.enums.ParticipantStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
public class ParticipantResponse {
    private UUID id;
    private UUID activityId;
    private String activityTitle;
    private UUID userId;
    private String userName;
    private String userAvatar;
    private ParticipantStatus status;
    private Double contributionHours;
    private Instant registeredAt;

    public static ParticipantResponse fromEntity(ActivityParticipant entity) {
        return ParticipantResponse.builder()
                .id(entity.getId())
                .activityId(entity.getActivity().getId())
                .activityTitle(entity.getActivity().getTitle())
                .userId(entity.getUser().getId())
                .userName(entity.getUser().getFullName())
                .userAvatar(entity.getUser().getAvatarUrl())
                .status(entity.getStatus())
                .contributionHours(entity.getContributionHours())
                .registeredAt(entity.getCreatedAt())
                .build();
    }
}
