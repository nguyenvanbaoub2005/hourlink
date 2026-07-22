package com.hourlink.auth.repository;

import com.hourlink.auth.entity.UserVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserVerificationRepository extends JpaRepository<UserVerification, UUID> {
    // TODO: findByUserIdAndOtpCodeAndPurpose(...)
}
