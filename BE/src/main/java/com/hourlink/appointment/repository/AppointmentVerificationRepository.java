package com.hourlink.appointment.repository;

import com.hourlink.appointment.entity.AppointmentVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface AppointmentVerificationRepository extends JpaRepository<AppointmentVerification, UUID> {
    // TODO: thêm custom queries
}
