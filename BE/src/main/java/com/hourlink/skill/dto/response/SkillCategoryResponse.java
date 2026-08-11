package com.hourlink.skill.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SkillCategoryResponse {
    UUID id;
    String name;
    String description;
    /** Số người dùng khác nhau đang có ít nhất một kỹ năng công khai trong danh mục. */
    long supporterCount;
    /** Số kỹ năng công khai trong danh mục (một người có thể có nhiều kỹ năng). */
    long skillCount;
}
