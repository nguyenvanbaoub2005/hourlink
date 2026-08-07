package com.hourlink.community.entity;

import com.hourlink.common.entity.BaseEntity;
import com.hourlink.community.enums.ActivityParticipantStatus;
import com.hourlink.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * ActivityParticipant — Bản ghi đăng ký tham gia hoạt động (US-36, US-37).
 *
 * <p>Mỗi bản ghi tương ứng 1 user đăng ký 1 hoạt động.
 * Khi tổ chức xác nhận, status chuyển CONFIRMED và hệ thống cộng TC.
 */
@Entity
@Table(
    name = "activity_participant",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"activity_id", "user_id"},
        name = "uq_activity_user"
    )
)
@Getter @Setter @Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ActivityParticipant extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    CommunityActivity activity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "VARCHAR(20)")
    @Builder.Default
    ActivityParticipantStatus status = ActivityParticipantStatus.REGISTERED;

    /** Số giờ đóng góp thực tế (tổ chức nhập khi xác nhận) */
    @Column(name = "actual_hours")
    Double actualHours;

    /** Ghi chú của tổ chức khi xác nhận */
    @Column(name = "confirm_note", length = 500)
    String confirmNote;

    /** Đánh dấu đã nhận Time Credit chưa (tránh cộng 2 lần) */
    @Column(name = "credit_awarded", nullable = false)
    @Builder.Default
    Boolean creditAwarded = false;
}
