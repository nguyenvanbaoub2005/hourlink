package com.hourlink.admin.dto.request;

import com.hourlink.skill.enums.SessionFormat;
import com.hourlink.skill.enums.SkillLevel;
import com.hourlink.skill.enums.SkillStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class AdminUpdateSkillRequest {

    @NotBlank(message = "Tên kỹ năng không được để trống")
    @Size(max = 150, message = "Tên kỹ năng tối đa 150 ký tự")
    private String name;

    private String description;

    private UUID categoryId;

    private SkillLevel level;

    private SessionFormat format;

    private Integer duration;

    @Size(max = 200)
    private String freeTime;

    @Size(max = 200)
    private String region;

    private SkillStatus status;
}
