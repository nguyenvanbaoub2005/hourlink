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

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    @Query("SELECT a FROM Appointment a WHERE a.provider.id = :userId OR a.receiver.id = :userId")
    Page<Appointment> findByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT a FROM Appointment a WHERE (a.provider.id = :userId OR a.receiver.id = :userId) AND a.status IN :statuses")
    Page<Appointment> findByUserIdAndStatusIn(@Param("userId") UUID userId, @Param("statuses") List<AppointmentStatus> statuses, Pageable pageable);

    @Query("SELECT a FROM Appointment a WHERE (a.provider.id = :userId OR a.receiver.id = :userId) AND a.status = :status")
    Page<Appointment> findByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") AppointmentStatus status, Pageable pageable);

    Optional<Appointment> findByInvitationId(UUID invitationId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Appointment a WHERE a.id = :id")
    Optional<Appointment> findByIdForUpdate(@Param("id") UUID id);
}
