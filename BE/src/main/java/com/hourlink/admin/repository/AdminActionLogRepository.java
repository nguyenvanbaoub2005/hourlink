package com.hourlink.admin.repository;

import com.hourlink.admin.entity.AdminActionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface AdminActionLogRepository extends JpaRepository<AdminActionLog, UUID> {
    // TODO: thêm custom queries
}
