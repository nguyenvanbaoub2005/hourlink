package com.hourlink.community.repository;

import com.hourlink.community.entity.ActivityParticipant;
import com.hourlink.community.enums.ActivityParticipantStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ActivityParticipantRepository extends JpaRepository<ActivityParticipant, UUID> {

    interface ActivityStatusCount {
        UUID getActivityId();
        ActivityParticipantStatus getStatus();
        long getTotal();
    }

    /** Kiểm tra user đã đăng ký hoạt động này chưa (status REGISTERED) */
    boolean existsByActivityIdAndUserIdAndStatus(UUID activityId, UUID userId, ActivityParticipantStatus status);

    /** Kiểm tra user có bất kỳ bản ghi nào cho hoạt động này không (kể cả đã hủy) */
    boolean existsByActivityIdAndUserId(UUID activityId, UUID userId);

    /** Tìm bản ghi đăng ký theo activityId + userId */
    Optional<ActivityParticipant> findByActivityIdAndUserId(UUID activityId, UUID userId);

    /** Lấy tất cả người tham gia của 1 hoạt động, phân trang */
    Page<ActivityParticipant> findByActivityIdOrderByCreatedAtDesc(UUID activityId, Pageable pageable);

    /** Lấy tất cả hoạt động người dùng đã đăng ký */
    @Query("SELECT p FROM ActivityParticipant p WHERE p.user.id = :userId ORDER BY p.createdAt DESC")
    Page<ActivityParticipant> findByUserIdPaged(@Param("userId") UUID userId, Pageable pageable);

    /** Lấy danh sách người đăng ký để xác nhận hàng loạt */
    List<ActivityParticipant> findByActivityIdAndStatus(UUID activityId, ActivityParticipantStatus status);

    /** Đếm số lượng người đã đăng ký (status = REGISTERED) cho 1 hoạt động */
    long countByActivityIdAndStatus(UUID activityId, ActivityParticipantStatus status);

    long countByStatus(ActivityParticipantStatus status);

    @Query("SELECT COALESCE(SUM(p.actualHours), 0) FROM ActivityParticipant p WHERE p.status = :status")
    Double sumActualHoursByStatus(@Param("status") ActivityParticipantStatus status);

    @Query("""
            SELECT p.activity.id AS activityId, p.status AS status, COUNT(p) AS total
            FROM ActivityParticipant p
            WHERE p.activity.id IN :activityIds
            GROUP BY p.activity.id, p.status
            """)
    List<ActivityStatusCount> countStatusesByActivityIds(@Param("activityIds") List<UUID> activityIds);

}
