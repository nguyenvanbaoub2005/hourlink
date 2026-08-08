package com.hourlink.community.repository;

import com.hourlink.community.entity.CommunityActivity;
import com.hourlink.community.enums.ActivityParticipantStatus;
import com.hourlink.community.enums.ActivityStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.UUID;
import java.time.Instant;
import java.util.Collection;

public interface CommunityActivityRepository extends JpaRepository<CommunityActivity, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM CommunityActivity a WHERE a.id = :id")
    Optional<CommunityActivity> findByIdForUpdate(@Param("id") UUID id);

    /** Lấy tất cả hoạt động theo trạng thái, phân trang, mới nhất trước */
    Page<CommunityActivity> findByStatusOrderByCreatedAtDesc(ActivityStatus status, Pageable pageable);

    Page<CommunityActivity> findByStatusAndStartTimeAfterOrderByCreatedAtDesc(
            ActivityStatus status, Instant now, Pageable pageable);

    /**
     * Feed Community: hoạt động đang mở cho mọi người và các hoạt động mà user
     * đã/đang tham gia. Nhờ vậy hoạt động không biến mất khỏi UI trước lúc user
     * có thể gửi minh chứng sau khi kết thúc.
     */
    @Query(value = """
            SELECT DISTINCT a FROM CommunityActivity a
            LEFT JOIN a.participants p
            WHERE (a.status = :open AND a.startTime > :now)
               OR (p.user.id = :userId AND p.status IN :participantStatuses)
            ORDER BY a.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(DISTINCT a) FROM CommunityActivity a
            LEFT JOIN a.participants p
            WHERE (a.status = :open AND a.startTime > :now)
               OR (p.user.id = :userId AND p.status IN :participantStatuses)
            """)
    Page<CommunityActivity> findCommunityFeedForUser(
            @Param("userId") UUID userId,
            @Param("now") Instant now,
            @Param("open") ActivityStatus open,
            @Param("participantStatuses") Collection<ActivityParticipantStatus> participantStatuses,
            Pageable pageable);

    /** Lấy tất cả hoạt động của một tổ chức, mới nhất trước */
    Page<CommunityActivity> findByOrganizerIdOrderByCreatedAtDesc(UUID organizerId, Pageable pageable);

    boolean existsByOrganizerId(UUID organizerId);

    /** Lấy tất cả hoạt động (bất kể trạng thái), phân trang */
    @Query("SELECT a FROM CommunityActivity a ORDER BY a.createdAt DESC")
    Page<CommunityActivity> findAllPaged(Pageable pageable);

    @Modifying
    @Query("UPDATE CommunityActivity a SET a.status = :closed " +
            "WHERE a.status = :open AND a.startTime <= :now")
    int closeStartedActivities(@Param("now") Instant now,
                               @Param("open") ActivityStatus open,
                               @Param("closed") ActivityStatus closed);

    @Modifying
    @Query("UPDATE CommunityActivity a SET a.status = :completed " +
            "WHERE a.status IN :activeStatuses AND a.endTime <= :now " +
            "AND NOT EXISTS (SELECT p.id FROM ActivityParticipant p " +
            "WHERE p.activity = a AND p.status = :registered)")
    int completeEndedActivitiesWithoutPending(
            @Param("now") Instant now,
            @Param("activeStatuses") java.util.Collection<ActivityStatus> activeStatuses,
            @Param("registered") com.hourlink.community.enums.ActivityParticipantStatus registered,
            @Param("completed") ActivityStatus completed);
}
