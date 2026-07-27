package com.hourlink.appointment.repository;

import com.hourlink.appointment.entity.AppointmentCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface AppointmentCompletionRepository extends JpaRepository<AppointmentCompletion, UUID> {

    List<AppointmentCompletion> findByAppointmentId(UUID appointmentId);

    boolean existsByAppointmentIdAndUserId(UUID appointmentId, UUID userId);
}
