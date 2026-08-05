package com.hourlink.rating.entity;

import com.hourlink.appointment.entity.Appointment;
import com.hourlink.common.entity.BaseEntity;
import com.hourlink.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Rating — Đánh giá sau mỗi buổi hỗ trợ (chức năng 9.18).
 * Hai bên đánh giá nhau sau khi Appointment hoàn thành.
 * Mỗi cặp (appointment + reviewer) chỉ có 1 rating duy nhất.
 */
@Entity
@Table(name = "rating", indexes = {
        @Index(name = "idx_rating_appointment", columnList = "appointment_id"),
        @Index(name = "idx_rating_reviewer",    columnList = "reviewer_id"),
        @Index(name = "idx_rating_reviewee",    columnList = "reviewee_id")
}, uniqueConstraints = {
        // Mỗi người chỉ được đánh giá 1 lần cho mỗi buổi hẹn
        @UniqueConstraint(name = "uq_rating_appointment_reviewer",
                columnNames = {"appointment_id", "reviewer_id"})
})
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Rating extends BaseEntity {

    /** Lịch hẹn được đánh giá */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    Appointment appointment;

    /** Người thực hiện đánh giá */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    User reviewer;

    /** Người được đánh giá */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewee_id", nullable = false)
    User reviewee;

    /** Điểm đúng giờ (1-5) */
    @Min(1) @Max(5)
    @Column(name = "punctuality_score")
    Integer punctualityScore;

    /** Điểm thái độ (1-5) */
    @Min(1) @Max(5)
    @Column(name = "attitude_score")
    Integer attitudeScore;

    /** Điểm giao tiếp (1-5) */
    @Min(1) @Max(5)
    @Column(name = "communication_score")
    Integer communicationScore;

    /** Điểm chất lượng hỗ trợ (1-5) */
    @Min(1) @Max(5)
    @Column(name = "quality_score")
    Integer qualityScore;

    /**
     * Tổng điểm sao tổng quát (1-5) — bắt buộc.
     * Được tính = trung bình cộng các tiêu chí, hoặc người dùng tự chọn.
     */
    @Min(1) @Max(5)
    @Column(name = "overall_stars", nullable = false)
    Integer overallStars;

    /** Nhận xét văn bản của người đánh giá */
    @Column(name = "comment", columnDefinition = "TEXT")
    String comment;
}
