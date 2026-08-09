package com.hourlink.report.service;

import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.common.util.SecurityUtil;
import com.hourlink.report.dto.ReportRequest;
import com.hourlink.report.dto.ReportResponse;
import com.hourlink.report.entity.Report;
import com.hourlink.report.enums.ReportStatus;
import com.hourlink.report.repository.ReportRepository;
import com.hourlink.chat.repository.ChatMessageRepository;
import com.hourlink.community.entity.CommunityActivity;
import com.hourlink.community.repository.CommunityActivityRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final CommunityActivityRepository communityActivityRepository;

    @Transactional
    public ReportResponse createReport(ReportRequest request) {
        User currentUser = getCurrentUser();

        validateTarget(request, currentUser);
        if (reportRepository.existsByReporterIdAndTargetIdAndTargetType(
                currentUser.getId(), request.getTargetId(), request.getTargetType())) {
            throw new AppException(ErrorCode.REPORT_ALREADY_SUBMITTED);
        }

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

    private void validateTarget(ReportRequest request, User currentUser) {
        switch (request.getTargetType()) {
            case USER -> {
                if (!userRepository.existsById(request.getTargetId())) {
                    throw new AppException(ErrorCode.REPORT_TARGET_NOT_FOUND);
                }
                if (currentUser.getId().equals(request.getTargetId())) {
                    throw new AppException(ErrorCode.CANNOT_REPORT_SELF);
                }
            }
            case MESSAGE -> {
                if (!chatMessageRepository.existsById(request.getTargetId())) {
                    throw new AppException(ErrorCode.REPORT_TARGET_NOT_FOUND);
                }
            }
            case CONTENT -> {
                CommunityActivity activity = communityActivityRepository.findById(request.getTargetId())
                        .orElseThrow(() -> new AppException(ErrorCode.REPORT_TARGET_NOT_FOUND));
                if (activity.getOrganizer().getId().equals(currentUser.getId())) {
                    throw new AppException(ErrorCode.CANNOT_REPORT_SELF);
                }
            }
        }
    }

    public ReportResponse getMyReport(UUID reportId) {
        User currentUser = getCurrentUser();
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new AppException(ErrorCode.REPORT_NOT_FOUND));
        if (!report.getReporterId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.REPORT_NOT_FOUND);
        }
        return toResponse(report);
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public List<ReportResponse> getAllReports() {
        return reportRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    @Transactional
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ReportResponse updateStatus(UUID reportId, ReportStatus status, String adminNote) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new AppException(ErrorCode.REPORT_NOT_FOUND));
        report.setStatus(status);
        report.setAdminNote(adminNote == null || adminNote.isBlank() ? null : adminNote.trim());
        return toResponse(reportRepository.save(report));
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
