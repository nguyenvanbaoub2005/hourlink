package com.hourlink.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * AdminSkillActionRequest — Yêu cầu thực hiện hành động trên kỹ năng.
 * actionType: HIDE | SHOW | DELETE | WARN
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminSkillActionRequest {

    @NotBlank(message = "Loại hành động không được để trống")
    String actionType;

    /** Lý do (bắt buộc cho WARN và DELETE) */
    String reason;
}
