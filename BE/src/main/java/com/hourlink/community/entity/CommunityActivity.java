package com.hourlink.community.entity;

import com.hourlink.common.entity.BaseEntity;
import com.hourlink.community.enums.ActivityStatus;
import com.hourlink.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * CommunityActivity — Hoạt động cộng đồng do tổ chức/cá nhân tạo ra (US-35).
 *
 * <p>Tổ chức tạo hoạt động, người dùng đăng ký tham gia,
 * sau khi hoàn thành tổ chức xác nhận → Hệ thống cộng Time Credit (US-38).
 */
@Entity
@Table(name = "community_activity")
@Getter @Setter @Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CommunityActivity extends BaseEntity {

    /** Tổ chức/người dùng tạo hoạt động */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id", nullable = false)
    User organizer;

    @Column(nullable = false, length = 200)
    String title;

    @Column(columnDefinition = "TEXT")
    String description;

    /** Địa điểm tổ chức (có thể là link online) */
    @Column(length = 500)
    String location;

    /** Thời gian bắt đầu hoạt động */
    @Column(name = "start_time", nullable = false)
    Instant startTime;

    /** Thời gian kết thúc dự kiến */
    @Column(name = "end_time", nullable = false)
    Instant endTime;

    /** Số chỗ tối đa (null = không giới hạn) */
    @Column(name = "max_participants")
    Integer maxParticipants;

    /**
     * Số Time Credit người dùng nhận được sau khi tổ chức xác nhận (US-38).
     * Ví dụ: 1.0 TC cho 60 phút tham gia.
     */
    @Column(name = "credit_reward", nullable = false)
    Double creditReward;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    ActivityStatus status = ActivityStatus.OPEN;

    /** Danh sách người đăng ký */
    @OneToMany(mappedBy = "activity", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<ActivityParticipant> participants = new ArrayList<>();
}
