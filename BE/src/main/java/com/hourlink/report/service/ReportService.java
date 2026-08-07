package com.hourlink.report.service;

import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.common.util.SecurityUtil;
import com.hourlink.report.dto.ReportRequest;
import com.hourlink.report.dto.ReportResponse;
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
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReportResponse createReport(ReportRequest request) {
        User currentUser = getCurrentUser();

        Report report = Report.builder()
                .targetId(request.getTargetId())
                .targetType(request.getTargetType())
                .reason(request.getReason())
                .description(request.getDescription())
                .evidenceUrls(request.getEvidenceUrls())
                .status(ReportStatus.PENDING)
                .reporterId(currentUser.getId())
                .build();

        Report savedReport = reportRepository.save(report);
        return toResponse(savedReport);
    }

    public List<ReportResponse> getMyReports() {
        User currentUser = getCurrentUser();
        List<Report> reports = reportRepository.findByReporterIdOrderByCreatedAtDesc(currentUser.getId());
        return reports.stream().map(this::toResponse).collect(Collectors.toList());
    }

    private User getCurrentUser() {
        String email = SecurityUtil.getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private ReportResponse toResponse(Report report) {
        return ReportResponse.builder()
                .id(report.getId())
                .targetId(report.getTargetId())
                .targetType(report.getTargetType())
                .reason(report.getReason())
                .description(report.getDescription())
                .evidenceUrls(report.getEvidenceUrls())
                .status(report.getStatus())
                .adminNote(report.getAdminNote())
                .createdAt(report.getCreatedAt())
                .build();
    }
}
