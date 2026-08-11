package com.hourlink.community.dto.response;

import com.hourlink.community.entity.CommunityActivity;
import com.hourlink.community.enums.ActivityStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/**
 * Response hoạt động cộng đồng trả về client.
 */
@Data
@Builder
public class ActivityResponse {

    private UUID id;
    private UUID organizerId;
    private String organizerName;
    private String organizerAvatarUrl;

    private String title;
    private String description;
    private String location;
    private Instant startTime;
    private Instant endTime;
    private Integer maxParticipants;
    private Double creditReward;
    private ActivityStatus status;

    /** Số người đăng ký hiện tại (status = REGISTERED) */
    private long registeredCount;

    /** Người dùng hiện tại đã đăng ký chưa */
    private boolean registered;

    /** Người dùng hiện tại có đang theo dõi tổ chức này không */
    private boolean organizerFollowed;

    private Instant createdAt;

    public static ActivityResponse fromEntity(CommunityActivity a, long registeredCount,
                                              boolean registered, boolean organizerFollowed) {
        return ActivityResponse.builder()
                .id(a.getId())
                .organizerId(a.getOrganizer().getId())
                .organizerName(a.getOrganizer().getFullName())
                .organizerAvatarUrl(a.getOrganizer().getAvatarUrl())
                .title(a.getTitle())
                .description(a.getDescription())
                .location(a.getLocation())
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .maxParticipants(a.getMaxParticipants())
                .creditReward(a.getCreditReward())
                .status(a.getStatus())
                .registeredCount(registeredCount)
                .registered(registered)
                .organizerFollowed(organizerFollowed)
                .createdAt(a.getCreatedAt())
                .build();
    }
}
