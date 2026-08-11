package com.hourlink.skill.dto.request;

import com.hourlink.skill.enums.SessionFormat;
import com.hourlink.skill.enums.SkillLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SkillRequest {

    @NotBlank(message = "Tên kỹ năng không được để trống")
    String name;

    String description;

    @NotNull(message = "Trình độ không được để trống")
    SkillLevel level;

    @NotNull(message = "Hình thức không được để trống")
    SessionFormat format;

    Integer duration;

    String freeTime; // Thời gian rảnh có thể dạy

    String region;

    @NotNull(message = "Danh mục không được để trống")
    UUID categoryId;
}
