package com.hourlink.appointment.repository;

import com.hourlink.appointment.entity.Appointment;
import com.hourlink.appointment.enums.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDate;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    @Query("SELECT a FROM Appointment a WHERE a.provider.id = :userId OR a.receiver.id = :userId")
    Page<Appointment> findByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT a FROM Appointment a WHERE (a.provider.id = :userId OR a.receiver.id = :userId) AND a.status IN :statuses")
    Page<Appointment> findByUserIdAndStatusIn(@Param("userId") UUID userId, @Param("statuses") List<AppointmentStatus> statuses, Pageable pageable);

    @Query("SELECT a FROM Appointment a WHERE (a.provider.id = :userId OR a.receiver.id = :userId) AND a.status = :status")
    Page<Appointment> findByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") AppointmentStatus status, Pageable pageable);

    Optional<Appointment> findFirstByInvitation_IdAndStatusInOrderByCreatedAtDesc(
            UUID invitationId, List<AppointmentStatus> statuses);

    /** Lịch đang hoạt động mới nhất của một cặp người, không phụ thuộc lời mời nào. */
    @Query("""
            SELECT a FROM Appointment a
            WHERE ((a.provider.id = :firstUserId AND a.receiver.id = :secondUserId)
                OR (a.provider.id = :secondUserId AND a.receiver.id = :firstUserId))
              AND a.status IN :statuses
            ORDER BY a.createdAt DESC
            """)
    List<Appointment> findActiveBetweenUsers(
            @Param("firstUserId") UUID firstUserId,
            @Param("secondUserId") UUID secondUserId,
            @Param("statuses") List<AppointmentStatus> statuses,
            Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Appointment a WHERE a.id = :id")
    Optional<Appointment> findByIdForUpdate(@Param("id") UUID id);

    /** Các lịch cần đồng bộ trạng thái theo thời gian, khóa để tránh scheduler xử lý trùng. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT a FROM Appointment a
            WHERE a.status IN :statuses AND a.appointmentDate <= :latestDate
            """)
    List<Appointment> findLifecycleCandidatesForUpdate(
            @Param("statuses") List<AppointmentStatus> statuses,
            @Param("latestDate") LocalDate latestDate);
}
