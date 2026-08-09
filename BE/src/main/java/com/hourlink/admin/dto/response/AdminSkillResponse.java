package com.hourlink.admin.dto.response;

import com.hourlink.skill.enums.SessionFormat;
import com.hourlink.skill.enums.SkillLevel;
import com.hourlink.skill.enums.SkillStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

/**
 * AdminSkillResponse — Thông tin tóm tắt kỹ năng cho danh sách Admin.
 */
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminSkillResponse {
    UUID id;
    String name;
    SkillStatus status;
    SkillLevel level;
    SessionFormat format;
    String categoryName;
    // Người đăng
    UUID userId;
    String userFullName;
    String userEmail;
    String userAvatarUrl;
    // Thống kê
    int attachmentCount;
    Instant createdAt;
}
