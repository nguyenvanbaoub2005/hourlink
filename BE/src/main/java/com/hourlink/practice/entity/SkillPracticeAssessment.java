package com.hourlink.practice.entity;

import com.hourlink.appointment.entity.Appointment;
import com.hourlink.common.entity.BaseEntity;
import com.hourlink.practice.enums.PracticeStatus;
import com.hourlink.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

/**
 * SkillPracticeAssessment — Bài thực hành Kỹ năng mềm, Chấm điểm 3 tiêu chí & Chứng nhận kỹ năng số.
 */
@Entity
@Table(name = "skill_practice_assessment", indexes = {
        @Index(name = "idx_practice_appointment", columnList = "appointment_id", unique = true),
        @Index(name = "idx_practice_learner", columnList = "learner_id"),
        @Index(name = "idx_practice_mentor", columnList = "mentor_id"),
        @Index(name = "idx_practice_cert_code", columnList = "certificate_code")
})
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SkillPracticeAssessment extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id", nullable = false)
    User mentor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", nullable = false)
    User learner;

    @Column(name = "skill_title", nullable = false, length = 255)
    String skillTitle;

    /** Tiêu đề thử thách thực hành kỹ năng mềm */
    @Column(name = "assignment_title", nullable = false, length = 255)
    String assignmentTitle;

    /** Tình huống thực tế / đề bài thực hành do Mentor giao */
    @Column(name = "scenario_prompt", columnDefinition = "TEXT", nullable = false)
    String scenarioPrompt;

    /** Các tiêu chí đánh giá kỹ năng mềm */
    @Column(name = "practice_criteria", columnDefinition = "TEXT")
    String practiceCriteria;

    /** Phần trình bày giải pháp / thu hoạch của người học */
    @Column(name = "submission_text", columnDefinition = "TEXT")
    String submissionText;

    /** Link video quay thử / ghi âm / slide thuyết trình (tùy chọn) */
    @Column(name = "submission_link", length = 500)
    String submissionLink;

    @Column(name = "submitted_at")
    Instant submittedAt;

    /** Điểm Giao tiếp & Diễn đạt (1–10) */
    @Column(name = "communication_score")
    Double communicationScore;

    /** Điểm Vận dụng & Xử lý tình huống thực tế (1–10) */
    @Column(name = "application_score")
    Double applicationScore;

    /** Điểm Tư duy phản biện & Sự tự tin (1–10) */
    @Column(name = "confidence_score")
    Double confidenceScore;

    /** Điểm tổng kết trung bình (0–10, làm tròn 1 chữ số thập phân) */
    @Column(name = "overall_score")
    Double overallScore;

    /** Nhận xét chi tiết của người hướng dẫn */
    @Column(name = "mentor_feedback", columnDefinition = "TEXT")
    String mentorFeedback;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 40, nullable = false)
    @Builder.Default
    PracticeStatus status = PracticeStatus.ASSIGNED;

    /** Mã chứng nhận kỹ năng số duy nhất (VD: HL-CERT-2026-8F9A2C) */
    @Column(name = "certificate_code", length = 64, unique = true)
    String certificateCode;

    /** Xếp loại chứng nhận: XUẤT SẮC (>=8.5), GIỎI (>=7.0), ĐẠT (>=5.0) */
    @Column(name = "certificate_level", length = 40)
    String certificateLevel;

    /** Số giờ kỹ năng đã hoàn thành được ghi nhận trên chứng chỉ */
    @Column(name = "credit_hours")
    Double creditHours;

    @Column(name = "issued_at")
    Instant issuedAt;
}
