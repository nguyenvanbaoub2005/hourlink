package com.hourlink.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserActionRequest {
    @NotBlank(message = "Action type is required (WARN, LOCK, UNLOCK)")
    private String actionType;
    private String reason;
}
