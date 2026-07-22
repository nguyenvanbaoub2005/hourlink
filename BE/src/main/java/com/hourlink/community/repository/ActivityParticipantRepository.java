package com.hourlink.community.repository;

import com.hourlink.community.entity.ActivityParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ActivityParticipantRepository extends JpaRepository<ActivityParticipant, UUID> {
    // TODO: thêm custom queries
}
