package com.hourlink.appointment.entity;

import com.hourlink.common.entity.BaseEntity;
import com.hourlink.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;

/**
 * AppointmentCompletion — Ghi nhận người tham gia đã xác nhận kết thúc buổi hỗ trợ (chức năng 9.15).
 */
@Entity
@Table(name = "appointment_completion", indexes = {
        @Index(name = "idx_completion_appointment", columnList = "appointment_id"),
        @Index(name = "idx_completion_user", columnList = "user_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_completion_appointment_user", columnNames = {"appointment_id", "user_id"})
})
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AppointmentCompletion extends BaseEntity {

    /** Lịch hẹn liên quan */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    Appointment appointment;

    /** Người dùng bấm xác nhận hoàn thành */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    /** Thời lượng hỗ trợ thực tế (tính bằng phút) */
    @Column(name = "actual_duration_minutes", nullable = false)
    Integer actualDurationMinutes;

    /** Nội dung đã thực hiện/hoàn thành trong buổi học */
    @Column(name = "content_completed", columnDefinition = "TEXT")
    String contentCompleted;

    /** Có vấn đề/tranh chấp phát sinh trong buổi hẹn không */
    @Column(name = "has_issue", nullable = false)
    @Builder.Default
    Boolean hasIssue = false;

    /** Mô tả chi tiết vấn đề phát sinh (nếu hasIssue = true) */
    @Column(name = "issue_description", columnDefinition = "TEXT")
    String issueDescription;

    /** Thời gian xác nhận */
    @Column(name = "confirmed_at", nullable = false)
    LocalDateTime confirmedAt;
}
