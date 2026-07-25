package com.hourlink.helprequest.dto.request;

import com.hourlink.skill.enums.SessionFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HelpRequestRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    String title;

    String description;

    String currentLevel;

    @NotNull(message = "Hình thức không được để trống")
    SessionFormat format;

    String desiredTime;

    Integer duration;

    String region;

    @NotNull(message = "Danh mục không được để trống")
    UUID categoryId;
}
