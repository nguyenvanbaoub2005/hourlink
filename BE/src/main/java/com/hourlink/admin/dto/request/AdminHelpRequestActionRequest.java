package com.hourlink.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminHelpRequestActionRequest {

    @NotBlank(message = "Loại hành động không được để trống")
    String actionType; // DELETE | WARN

    String reason;
}
