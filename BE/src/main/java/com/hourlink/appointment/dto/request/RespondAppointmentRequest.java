package com.hourlink.appointment.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RespondAppointmentRequest {

    @NotBlank(message = "Hành động (CONFIRM, CANCEL, RESCHEDULE) không được để trống")
    String action;

    @Size(max = 500, message = "Lý do hủy không được vượt quá 500 ký tự")
    String reason;

    String newTime;

    LocalDate newAppointmentDate;

    LocalTime newStartTime;

    LocalTime newEndTime;

    String locationOrLink;
}
