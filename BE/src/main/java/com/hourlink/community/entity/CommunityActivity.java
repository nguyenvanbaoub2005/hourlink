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
 * CommunityActivity — Hoạt động cộng đồng do tổ chức tạo (US-35).
 */
@Entity
@Table(name = "community_activity")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CommunityActivity extends BaseEntity {

    @Column(nullable = false)
    String title;

    @Column(columnDefinition = "TEXT")
    String description;

    /** Địa điểm hoặc link online */
    @Column(nullable = false)
    String location;

    /** Thời gian bắt đầu hoạt động */
    @Column(name = "start_time", nullable = false)
    Instant startTime;

    /** Thời gian kết thúc hoạt động */
    @Column(name = "end_time", nullable = false)
    Instant endTime;

    /** Số lượng Time Credit được cộng cho người tham gia sau khi xác nhận */
    @Column(name = "credit_reward", nullable = false)
    int creditReward;

    /** Số lượng người tham gia tối đa (0 = không giới hạn) */
    @Column(name = "max_participants", nullable = false)
    int maxParticipants;

    /** Trạng thái hoạt động */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    ActivityStatus status = ActivityStatus.OPEN;

    /** Tổ chức / người tạo hoạt động */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id", nullable = false)
    User organizer;

    /** Danh sách người đăng ký */
    @OneToMany(mappedBy = "activity", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<ActivityParticipant> participants = new ArrayList<>();

    /** Số người đã đăng ký hiện tại */
    public int getCurrentParticipantCount() {
        return participants.size();
    }

    /** Kiểm tra còn chỗ trống không */
    public boolean hasCapacity() {
        return maxParticipants <= 0 || participants.size() < maxParticipants;
    }
}
