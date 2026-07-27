package com.hourlink.appointment.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConfirmCompletionRequest {

    @NotNull(message = "Thời lượng hỗ trợ thực tế không được để trống")
    Integer actualDurationMinutes;

    String contentCompleted;

    Boolean hasIssue;

    String issueDescription;
}
