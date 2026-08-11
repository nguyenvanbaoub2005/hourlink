package com.hourlink.admin.dto.response;

import com.hourlink.skill.dto.response.SkillAttachmentResponse;
import com.hourlink.skill.enums.SessionFormat;
import com.hourlink.skill.enums.SkillLevel;
import com.hourlink.skill.enums.SkillStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * AdminSkillDetailResponse — Chi tiết đầy đủ kỹ năng + minh chứng cho Admin.
 */
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminSkillDetailResponse {
    // ─── Kỹ năng ───────────────────────────────────────
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
    Instant createdAt;
    Instant updatedAt;

    // ─── Người đăng ────────────────────────────────────
    UUID userId;
    String userFullName;
    String userEmail;
    String userAvatarUrl;
    Double userReputationScore;
    Integer userCompletedSessions;
    Integer userWarningCount;
    String userRegion;
    String userOccupation;

    // ─── Minh chứng ────────────────────────────────────
    List<SkillAttachmentResponse> attachments;
}
