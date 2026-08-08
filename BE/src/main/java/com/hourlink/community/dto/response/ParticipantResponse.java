package com.hourlink.community.dto.response;

import com.hourlink.community.entity.ActivityParticipant;
import com.hourlink.community.enums.ActivityParticipantStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/**
 * Response thông tin người tham gia hoạt động (US-37).
 */
@Data
@Builder
public class ParticipantResponse {

    private UUID id;
    private UUID userId;
    private String userName;
    private String userAvatarUrl;
    private ActivityParticipantStatus status;
    private Double actualHours;
    private String confirmNote;
    private Boolean creditAwarded;
    private Instant confirmedAt;
    private UUID activityId;
    private String activityTitle;
    private String activityLocation;
    private Instant activityStartTime;
    private Instant activityEndTime;
    private Double activityCreditReward;
    private Instant createdAt;

    public static ParticipantResponse fromEntity(ActivityParticipant p) {
        return ParticipantResponse.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .userName(p.getUser().getFullName())
                .userAvatarUrl(p.getUser().getAvatarUrl())
                .status(p.getStatus())
                .actualHours(p.getActualHours())
                .confirmNote(p.getConfirmNote())
                .creditAwarded(p.getCreditAwarded())
                .confirmedAt(p.getConfirmedAt())
                .activityId(p.getActivity().getId())
                .activityTitle(p.getActivity().getTitle())
                .activityLocation(p.getActivity().getLocation())
                .activityStartTime(p.getActivity().getStartTime())
                .activityEndTime(p.getActivity().getEndTime())
                .activityCreditReward(p.getActivity().getCreditReward())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
