package com.hourlink.admin.dto.response;

import com.hourlink.appointment.enums.AppointmentStatus;
import com.hourlink.appointment.enums.ExtraCreditStatus;
import com.hourlink.skill.enums.SessionFormat;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record AdminAppointmentDetailResponse(
        UUID id,
        String title,
        String description,
        AppointmentStatus status,
        LocalDate appointmentDate,
        LocalTime startTime,
        LocalTime endTime,
        SessionFormat meetingType,
        String locationOrLink,
        Double timeCreditAmount,
        String notes,
        String cancelReason,
        String rescheduleProposedTime,
        ExtraCreditStatus extraCreditStatus,
        UUID providerId,
        String providerName,
        String providerEmail,
        UUID receiverId,
        String receiverName,
        String receiverEmail,
        UUID proposedById,
        UUID skillId,
        String skillName,
        UUID invitationId,
        Instant createdAt,
        Instant updatedAt,
        List<AdminAppointmentConfirmationResponse> confirmations
) {
}
