package com.hourlink.appointment.dto.request;

import com.hourlink.skill.enums.SessionFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateAppointmentRequest {

    UUID invitationId;
    
    @NotNull(message = "Provider ID không được để trống")
    UUID providerId;

    @NotNull(message = "Receiver ID không được để trống")
    UUID receiverId;

    UUID skillId;

    @NotBlank(message = "Tiêu đề không được để trống")
    String title;

    String description;

    @NotNull(message = "Ngày hẹn không được để trống")
    LocalDate appointmentDate;

    @NotNull(message = "Giờ bắt đầu không được để trống")
    LocalTime startTime;

    @NotNull(message = "Giờ kết thúc không được để trống")
    LocalTime endTime;

    @NotNull(message = "Hình thức họp không được để trống")
    SessionFormat meetingType;

    @NotBlank(message = "Địa điểm hoặc link họp không được để trống")
    String locationOrLink;

    Double timeCreditAmount;

    String notes;
}
