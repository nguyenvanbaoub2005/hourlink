package com.hourlink.admin.dto.response;

import com.hourlink.helprequest.enums.RequestStatus;
import com.hourlink.skill.enums.SessionFormat;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminHelpRequestDetailResponse {
    UUID id;
    String title;
    String description;
    String currentLevel;
    SessionFormat format;
    String desiredTime;
    Integer duration;
    String region;
    Double timeCreditAmount;
    RequestStatus status;
    Integer responseCount;
    String categoryName;
    Instant createdAt;
    Instant updatedAt;

    // Requester info
    UUID requesterId;
    String requesterFullName;
    String requesterEmail;
    String requesterAvatarUrl;
    Double requesterReputationScore;
    Integer requesterCompletedSessions;
    Integer requesterWarningCount;
}
