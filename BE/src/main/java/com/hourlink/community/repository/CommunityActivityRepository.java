package com.hourlink.community.repository;

import com.hourlink.community.entity.CommunityActivity;
import com.hourlink.community.enums.ActivityStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface CommunityActivityRepository extends JpaRepository<CommunityActivity, UUID> {

    /** Lấy tất cả hoạt động theo trạng thái, phân trang, mới nhất trước */
    Page<CommunityActivity> findByStatusOrderByCreatedAtDesc(ActivityStatus status, Pageable pageable);

    /** Lấy tất cả hoạt động của một tổ chức, mới nhất trước */
    Page<CommunityActivity> findByOrganizerIdOrderByCreatedAtDesc(UUID organizerId, Pageable pageable);

    /** Lấy tất cả hoạt động (bất kể trạng thái), phân trang */
    @Query("SELECT a FROM CommunityActivity a ORDER BY a.createdAt DESC")
    Page<CommunityActivity> findAllPaged(Pageable pageable);

    /** Đếm số lượng người đã đăng ký (status = REGISTERED) cho 1 hoạt động */
    @Query("SELECT COUNT(p) FROM ActivityParticipant p WHERE p.activity.id = :activityId AND p.status = 'REGISTERED'")
    long countActiveParticipants(@Param("activityId") UUID activityId);
}
