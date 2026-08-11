package com.hourlink.admin.repository;

import com.hourlink.admin.entity.UserAdminAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserAdminActionRepository extends JpaRepository<UserAdminAction, UUID> {
    List<UserAdminAction> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
