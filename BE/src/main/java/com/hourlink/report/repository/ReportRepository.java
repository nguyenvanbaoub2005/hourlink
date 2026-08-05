package com.hourlink.report.repository;

import com.hourlink.report.entity.Report;
import com.hourlink.report.enums.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {

    /** US-40: Lấy tất cả báo cáo của người dùng, sắp xếp mới nhất trước */
    List<Report> findByReporterIdOrderByCreatedAtDesc(UUID reporterId);

    /** US-40: Lọc báo cáo theo trạng thái */
    List<Report> findByReporterIdAndStatusOrderByCreatedAtDesc(UUID reporterId, ReportStatus status);

    /** Kiểm tra đã báo cáo đối tượng này chưa */
    boolean existsByReporterIdAndTargetId(UUID reporterId, UUID targetId);
}
