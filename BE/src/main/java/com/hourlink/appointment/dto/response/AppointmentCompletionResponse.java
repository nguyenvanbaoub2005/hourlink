package com.hourlink.appointment.dto.response;

import com.hourlink.appointment.entity.AppointmentCompletion;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AppointmentCompletionResponse {

    UUID id;
    UUID appointmentId;
    UUID userId;
    String userName;
    Integer actualDurationMinutes;
    String contentCompleted;
    Boolean hasIssue;
    String issueDescription;
    LocalDateTime confirmedAt;
    Instant createdAt;

    public static AppointmentCompletionResponse fromEntity(AppointmentCompletion c) {
        return AppointmentCompletionResponse.builder()
                .id(c.getId())
                .appointmentId(c.getAppointment().getId())
                .userId(c.getUser().getId())
                .userName(c.getUser().getFullName())
                .actualDurationMinutes(c.getActualDurationMinutes())
                .contentCompleted(c.getContentCompleted())
                .hasIssue(c.getHasIssue())
                .issueDescription(c.getIssueDescription())
                .confirmedAt(c.getConfirmedAt())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
