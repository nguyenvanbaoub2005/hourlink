package com.hourlink.appointment.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RespondAppointmentRequest {

    @NotBlank(message = "Hành động (CONFIRM, CANCEL, RESCHEDULE) không được để trống")
    String action;

    String reason;

    String newTime;
}
