package com.hourlink.community.repository;

import com.hourlink.community.entity.ActivityParticipant;
import com.hourlink.community.enums.ParticipantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ActivityParticipantRepository extends JpaRepository<ActivityParticipant, UUID> {
    boolean existsByActivityIdAndUserIdAndStatusNot(UUID activityId, UUID userId, ParticipantStatus status);
    
    Optional<ActivityParticipant> findByActivityIdAndUserId(UUID activityId, UUID userId);
    
    List<ActivityParticipant> findByActivityId(UUID activityId);
    
    List<ActivityParticipant> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
