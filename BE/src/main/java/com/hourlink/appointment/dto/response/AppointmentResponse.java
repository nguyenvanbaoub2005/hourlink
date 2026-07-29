package com.hourlink.appointment.dto.response;

import com.hourlink.appointment.entity.Appointment;
import com.hourlink.appointment.enums.AppointmentStatus;
import com.hourlink.appointment.enums.ExtraCreditStatus;
import com.hourlink.skill.enums.SessionFormat;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AppointmentResponse {

    UUID id;

    UUID providerId;
    String providerName;
    String providerAvatarUrl;

    UUID receiverId;
    String receiverName;
    String receiverAvatarUrl;

    UUID invitationId;
    UUID skillId;
    String skillName;

    String title;
    String description;
    LocalDate appointmentDate;
    LocalTime startTime;
    LocalTime endTime;
    SessionFormat meetingType;
    String locationOrLink;
    Double timeCreditAmount;
    String notes;

    AppointmentStatus status;
    String cancelReason;
    String rescheduleProposedTime;
    ExtraCreditStatus extraCreditStatus;

    Instant createdAt;
    Instant updatedAt;

    public static AppointmentResponse fromEntity(Appointment a) {
        return AppointmentResponse.builder()
                .id(a.getId())
                .providerId(a.getProvider().getId())
                .providerName(a.getProvider().getFullName())
                .providerAvatarUrl(a.getProvider().getAvatarUrl())
                .receiverId(a.getReceiver().getId())
                .receiverName(a.getReceiver().getFullName())
                .receiverAvatarUrl(a.getReceiver().getAvatarUrl())
                .invitationId(a.getInvitation() != null ? a.getInvitation().getId() : null)
                .skillId(a.getSkill() != null ? a.getSkill().getId() : null)
                .skillName(a.getSkill() != null ? a.getSkill().getName() : null)
                .title(a.getTitle())
                .description(a.getDescription())
                .appointmentDate(a.getAppointmentDate())
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .meetingType(a.getMeetingType())
                .locationOrLink(a.getLocationOrLink())
                .timeCreditAmount(a.getTimeCreditAmount())
                .notes(a.getNotes())
                .status(a.getStatus())
                .cancelReason(a.getCancelReason())
                .rescheduleProposedTime(a.getRescheduleProposedTime())
                .extraCreditStatus(a.getExtraCreditStatus())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
