package com.hourlink.appointment.entity;

import com.hourlink.common.entity.BaseEntity;
import com.hourlink.appointment.enums.AppointmentStatus;
import com.hourlink.appointment.enums.ExtraCreditStatus;
import com.hourlink.invitation.entity.Invitation;
import com.hourlink.skill.entity.Skill;
import com.hourlink.skill.enums.SessionFormat;
import com.hourlink.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Appointment — Lịch hẹn hỗ trợ kỹ năng (chức năng 9.11).
 */
@Entity
@Table(name = "appointment", indexes = {
        @Index(name = "idx_appointment_provider", columnList = "provider_id"),
        @Index(name = "idx_appointment_receiver", columnList = "receiver_id"),
        @Index(name = "idx_appointment_status", columnList = "status"),
        @Index(name = "idx_appointment_date", columnList = "appointment_date")
})
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Appointment extends BaseEntity {

    /** Người hỗ trợ kỹ năng (provider/helper) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", nullable = false)
    User provider;

    /** Người nhận hỗ trợ (receiver/requester) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    User receiver;

    /** Người đưa ra lịch/khung giờ hiện tại; bên còn lại mới được chấp nhận. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposed_by")
    User proposedBy;

    /** Lời mời gốc tạo nên lịch hẹn này (nullable nếu tạo trực tiếp) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invitation_id")
    Invitation invitation;

    /** Kỹ năng được trao đổi trong buổi hẹn */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id")
    Skill skill;

    /** Tiêu đề lịch hẹn */
    @Column(name = "title", nullable = false, length = 255)
    String title;

    /** Mô tả chi tiết nội dung hỗ trợ */
    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    /** Ngày diễn ra lịch hẹn */
    @Column(name = "appointment_date", nullable = false)
    LocalDate appointmentDate;

    /** Giờ bắt đầu */
    @Column(name = "start_time", nullable = false)
    LocalTime startTime;

    /** Giờ kết thúc */
    @Column(name = "end_time", nullable = false)
    LocalTime endTime;

    /** Hình thức họp: ONLINE, OFFLINE */
    @Enumerated(EnumType.STRING)
    @Column(name = "meeting_type", length = 50, nullable = false)
    SessionFormat meetingType;

    /** Địa điểm gặp mặt trực tiếp hoặc đường link họp Online */
    @Column(name = "location_or_link", length = 500, nullable = false)
    String locationOrLink;

    /** Số Time Credit sử dụng cho buổi hẹn (tính bằng số giờ) */
    @Column(name = "time_credit_amount", nullable = false)
    @Builder.Default
    Double timeCreditAmount = 1.0;

    /** Ghi chú thêm cho lịch hẹn */
    @Column(name = "notes", columnDefinition = "TEXT")
    String notes;

    /** Trạng thái lịch hẹn */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    AppointmentStatus status = AppointmentStatus.PENDING;

    /** Lý do hủy lịch (khi status = CANCELLED) */
    @Column(name = "cancel_reason", columnDefinition = "TEXT")
    String cancelReason;

    /** Thời gian đề xuất mới khi RESCHEDULED (ví dụ "2026-07-30 19:00-20:00") */
    @Column(name = "reschedule_proposed_time", length = 200)
    String rescheduleProposedTime;

    /** Đánh dấu đã gửi nhắc lịch để scheduler không gửi lặp. */
    @Column(name = "reminder_sent_at")
    Instant reminderSentAt;

    /** Trạng thái xin thêm tín dụng giờ phát sinh */
    @Enumerated(EnumType.STRING)
    @Column(name = "extra_credit_status", length = 50)
    @Builder.Default
    ExtraCreditStatus extraCreditStatus = ExtraCreditStatus.NONE;
}
