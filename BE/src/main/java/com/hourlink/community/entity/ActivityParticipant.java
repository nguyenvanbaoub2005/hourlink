package com.hourlink.community.entity;

import com.hourlink.common.entity.BaseEntity;
import com.hourlink.community.enums.ParticipantStatus;
import com.hourlink.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * ActivityParticipant — Người tham gia hoạt động cộng đồng (US-36, US-37).
 */
@Entity
@Table(
    name = "activity_participant",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_participant_activity_user",
        columnNames = {"activity_id", "user_id"}
    )
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ActivityParticipant extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    CommunityActivity activity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    /**
     * PENDING   — đã đăng ký, chờ tổ chức xác nhận.
     * CONFIRMED — tổ chức đã xác nhận tham gia, TC đã được cộng.
     * CANCELLED — đã hủy đăng ký.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    ParticipantStatus status = ParticipantStatus.PENDING;

    /** Số giờ đóng góp (tổ chức điền khi xác nhận) */
    @Column(name = "contribution_hours")
    Double contributionHours;
}
