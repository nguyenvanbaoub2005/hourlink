package com.hourlink.appointment.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Positive;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConfirmCompletionRequest {

    @NotNull(message = "Thời lượng hỗ trợ thực tế không được để trống")
    @Positive(message = "Thời lượng hỗ trợ thực tế phải lớn hơn 0")
    @Max(value = 1440, message = "Thời lượng hỗ trợ thực tế không được vượt quá 1440 phút")
    Integer actualDurationMinutes;

    String contentCompleted;

    Boolean hasIssue;

    String issueDescription;
}
