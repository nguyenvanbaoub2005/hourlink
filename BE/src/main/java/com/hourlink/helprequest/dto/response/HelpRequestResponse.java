package com.hourlink.helprequest.dto.response;

import com.hourlink.helprequest.enums.RequestStatus;
import com.hourlink.skill.enums.SessionFormat;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HelpRequestResponse {
    UUID id;
    String title;
    String description;
    String currentLevel;
    SessionFormat format;
    String desiredTime;
    Integer duration;
    String region;
    Integer timeCreditAmount;
    RequestStatus status;
    UUID categoryId;
    String categoryName;
    UUID requesterId;
    String requesterFullName;
    Integer responseCount;
    Instant createdAt;
    Instant updatedAt;
}
