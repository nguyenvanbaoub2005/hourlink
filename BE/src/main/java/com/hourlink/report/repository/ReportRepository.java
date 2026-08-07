package com.hourlink.report.repository;

import com.hourlink.report.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {
    List<Report> findByReporterIdOrderByCreatedAtDesc(UUID reporterId);
}
