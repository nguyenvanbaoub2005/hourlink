package com.hourlink.chat.repository;

import com.hourlink.chat.entity.ChatReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ChatReportRepository extends JpaRepository<ChatReport, UUID> {
    // TODO: thêm custom queries
}
