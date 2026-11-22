package com.hourlink.practice.dto.response;

import com.hourlink.practice.enums.PracticeStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PracticeAssessmentResponse {

    UUID id;
    UUID appointmentId;
    UUID mentorId;
    String mentorName;
    String mentorAvatarUrl;
    UUID learnerId;
    String learnerName;
    String learnerAvatarUrl;

    String skillTitle;
    String assignmentTitle;
    String scenarioPrompt;
    String practiceCriteria;

    String submissionText;
    String submissionLink;
    Instant submittedAt;

    Double communicationScore;
    Double applicationScore;
    Double confidenceScore;
    Double overallScore;
    String mentorFeedback;

    PracticeStatus status;

    String certificateCode;
    String certificateLevel;
    Double creditHours;
    Instant issuedAt;
    Instant createdAt;
}
