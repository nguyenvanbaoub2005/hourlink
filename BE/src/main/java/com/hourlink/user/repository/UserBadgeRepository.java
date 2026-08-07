package com.hourlink.user.repository;

import com.hourlink.user.entity.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserBadgeRepository extends JpaRepository<UserBadge, UUID> {
    List<UserBadge> findByUserIdOrderByAwardedAtDesc(UUID userId);
    boolean existsByUserIdAndBadgeId(UUID userId, UUID badgeId);
    Optional<UserBadge> findByUserIdAndBadgeCode(UUID userId, String badgeCode);
    List<UserBadge> findByUserIdAndBadgeCategory(UUID userId, String category);
}
