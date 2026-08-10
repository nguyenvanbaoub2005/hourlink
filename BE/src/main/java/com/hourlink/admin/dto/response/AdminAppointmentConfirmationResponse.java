package com.hourlink.admin.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminAppointmentConfirmationResponse(
        UUID id,
        UUID userId,
        String userName,
        String userEmail,
        Integer actualDurationMinutes,
        String contentCompleted,
        Boolean hasIssue,
        String issueDescription,
        LocalDateTime confirmedAt
) {
}
