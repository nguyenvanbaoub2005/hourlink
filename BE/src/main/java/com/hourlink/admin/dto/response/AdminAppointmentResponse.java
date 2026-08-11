package com.hourlink.admin.dto.response;

import com.hourlink.appointment.enums.AppointmentStatus;
import com.hourlink.skill.enums.SessionFormat;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record AdminAppointmentResponse(
        UUID id,
        String title,
        AppointmentStatus status,
        LocalDate appointmentDate,
        LocalTime startTime,
        LocalTime endTime,
        SessionFormat meetingType,
        Double timeCreditAmount,
        UUID providerId,
        String providerName,
        String providerEmail,
        UUID receiverId,
        String receiverName,
        String receiverEmail,
        UUID skillId,
        String skillName,
        Instant createdAt
) {
}
