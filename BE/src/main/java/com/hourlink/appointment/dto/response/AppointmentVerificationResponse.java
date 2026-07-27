package com.hourlink.appointment.dto.response;

import com.hourlink.appointment.entity.AppointmentVerification;
import com.hourlink.appointment.enums.VerificationMethod;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AppointmentVerificationResponse {

    UUID id;
    UUID appointmentId;
    VerificationMethod method;
    String code;
    LocalDateTime expiresAt;
    LocalDateTime verifiedAt;
    UUID verifiedById;
    Instant createdAt;

    public static AppointmentVerificationResponse fromEntity(AppointmentVerification v) {
        return AppointmentVerificationResponse.builder()
                .id(v.getId())
                .appointmentId(v.getAppointment().getId())
                .method(v.getMethod())
                .code(v.getCode())
                .expiresAt(v.getExpiresAt())
                .verifiedAt(v.getVerifiedAt())
                .verifiedById(v.getVerifiedBy() != null ? v.getVerifiedBy().getId() : null)
                .createdAt(v.getCreatedAt())
                .build();
    }
}
