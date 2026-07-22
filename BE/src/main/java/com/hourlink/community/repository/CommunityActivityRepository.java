package com.hourlink.community.repository;

import com.hourlink.community.entity.CommunityActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface CommunityActivityRepository extends JpaRepository<CommunityActivity, UUID> {
    // TODO: thêm custom queries
}
