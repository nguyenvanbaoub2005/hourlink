package com.hourlink.rating.entity;

import com.hourlink.appointment.entity.Appointment;
import com.hourlink.common.entity.BaseEntity;
import com.hourlink.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Rating — Đánh giá của người dùng sau khi hoàn thành lịch hẹn.
 */
@Entity
@Table(name = "rating", indexes = {
        @Index(name = "uq_rating_appointment_from", columnList = "appointment_id, from_user_id", unique = true),
        @Index(name = "idx_rating_to_user", columnList = "to_user_id")
})
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Rating extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_user_id", nullable = false)
    User fromUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_user_id", nullable = false)
    User toUser;

    /** Số sao từ 1 đến 5 */
    @Column(name = "score", nullable = false)
    int score;

    /** Nhận xét (tùy chọn) */
    @Column(name = "comment", columnDefinition = "TEXT")
    String comment;
}
