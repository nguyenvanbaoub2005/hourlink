package com.hourlink.skill.dto.response;

import com.hourlink.skill.enums.SessionFormat;
import com.hourlink.skill.enums.SkillLevel;
import com.hourlink.skill.enums.SkillStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SkillResponse {
    UUID id;
    String name;
    String description;
    SkillLevel level;
    SessionFormat format;
    Integer duration;
    String freeTime;
    String region;
    SkillStatus status;
    UUID categoryId;
    String categoryName;
    UUID userId;
    String userFullName;
    String userAvatarUrl;
    Double userReputationScore;
    Integer userCompletedSessions;
    String userRegion;
    String userOccupation;
    Instant createdAt;
    Instant updatedAt;
}
