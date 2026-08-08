package com.hourlink.chat.repository;

import com.hourlink.chat.entity.ChatReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * ChatReportRepository — Truy vấn DB cho báo cáo tin nhắn (chức năng 9.10).
 */
@Repository
public interface ChatReportRepository extends JpaRepository<ChatReport, UUID> {

    /** Tôi đã báo cáo tin nhắn này chưa (chặn báo cáo trùng) */
    boolean existsByReporter_EmailAndMessage_Id(String reporterEmail, UUID messageId);

    /** Danh sách báo cáo tôi đã gửi */
    List<ChatReport> findAllByReporter_EmailOrderByCreatedAtDesc(String reporterEmail);
    List<ChatReport> findAllByOrderByCreatedAtDesc();

    java.util.Optional<ChatReport> findByIdAndReporter_Email(UUID id, String reporterEmail);
}
