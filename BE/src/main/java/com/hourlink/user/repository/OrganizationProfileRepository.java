package com.hourlink.user.repository;

import com.hourlink.user.entity.OrganizationProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationProfileRepository extends JpaRepository<OrganizationProfile, UUID> {
    // Optional<OrganizationProfile> findByUserId(UUID userId);
}
