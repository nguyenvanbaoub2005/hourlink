package com.hourlink.report.service;

import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.common.util.SecurityUtil;
import com.hourlink.report.dto.request.ReportRequest;
import com.hourlink.report.dto.response.ReportResponse;
import com.hourlink.report.entity.Report;
import com.hourlink.report.enums.ReportStatus;
import com.hourlink.report.repository.ReportRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * ReportService — Xử lý logic cho tính năng báo cáo vi phạm (US-39, US-40).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    // ==========================================
    // US-39: Tạo báo cáo vi phạm
    // ==========================================

    @Transactional
    public ReportResponse createReport(ReportRequest request) {
        User currentUser = getCurrentUser();

        // Kiểm tra xem đã báo cáo đối tượng này chưa (để tránh spam)
        if (reportRepository.existsByReporterIdAndTargetId(currentUser.getId(), request.getTargetId())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Bạn đã báo cáo đối tượng này rồi, vui lòng chờ xử lý");
        }

        String evidenceStr = null;
        if (request.getEvidenceUrls() != null && !request.getEvidenceUrls().isEmpty()) {
            evidenceStr = String.join(",", request.getEvidenceUrls());
        }

        Report report = Report.builder()
                .reporter(currentUser)
                .targetType(request.getTargetType())
                .targetId(request.getTargetId())
                .reason(request.getReason())
                .description(request.getDescription())
                .evidenceUrls(evidenceStr)
                .status(ReportStatus.PENDING)
                .build();

        report = reportRepository.save(report);
        log.info("User {} created a report (ID: {}) for target {} (Type: {})", 
                currentUser.getEmail(), report.getId(), request.getTargetId(), request.getTargetType());
        
        return ReportResponse.fromEntity(report);
    }

    // ==========================================
    // US-40: Xem trạng thái xử lý báo cáo
    // ==========================================

    public List<ReportResponse> getMyReports() {
        User currentUser = getCurrentUser();
        return reportRepository.findByReporterIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(ReportResponse::fromEntity)
                .toList();
    }

    public List<ReportResponse> getMyReportsByStatus(ReportStatus status) {
        User currentUser = getCurrentUser();
        return reportRepository.findByReporterIdAndStatusOrderByCreatedAtDesc(currentUser.getId(), status)
                .stream()
                .map(ReportResponse::fromEntity)
                .toList();
    }

    public ReportResponse getReportById(UUID id) {
        User currentUser = getCurrentUser();
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REPORT_NOT_FOUND));

        if (!report.getReporter().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED, "Bạn không có quyền xem báo cáo này");
        }

        return ReportResponse.fromEntity(report);
    }

    // ==========================================
    // Helper Methods
    // ==========================================

    private User getCurrentUser() {
        String email = SecurityUtil.getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }
}
