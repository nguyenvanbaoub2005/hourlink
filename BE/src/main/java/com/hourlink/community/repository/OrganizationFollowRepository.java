package com.hourlink.community.repository;

import com.hourlink.community.entity.OrganizationFollow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationFollowRepository extends JpaRepository<OrganizationFollow, UUID> {

    boolean existsByFollowerIdAndOrganizationId(UUID followerId, UUID organizationId);

    Optional<OrganizationFollow> findByFollowerIdAndOrganizationId(UUID followerId, UUID organizationId);

    void deleteByFollowerIdAndOrganizationId(UUID followerId, UUID organizationId);

    List<OrganizationFollow> findByFollowerIdOrderByCreatedAtDesc(UUID followerId);

    List<OrganizationFollow> findByOrganizationId(UUID organizationId);
}
