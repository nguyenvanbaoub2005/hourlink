package com.hourlink.admin.controller;

import com.hourlink.admin.dto.request.AdminReportStatusUpdateRequest;
import com.hourlink.admin.dto.response.AdminReportDetailResponse;
import com.hourlink.admin.dto.response.AdminReportResponse;
import com.hourlink.admin.dto.response.AdminReportStatsResponse;
import com.hourlink.admin.enums.AdminReportSource;
import com.hourlink.admin.service.AdminReportService;
import com.hourlink.report.enums.ReportStatus;
import com.hourlink.report.enums.ReportTargetType;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminReportController {

    private final AdminReportService adminReportService;

    @GetMapping
    public ResponseEntity<Page<AdminReportResponse>> getReports(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) AdminReportSource source,
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) ReportTargetType targetType,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminReportService.getReports(
                search, source, status, targetType, reason, dateFrom, dateTo, pageable));
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminReportStatsResponse> getStats() {
        return ResponseEntity.ok(adminReportService.getStats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminReportDetailResponse> getReport(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "GENERAL") AdminReportSource source) {
        return ResponseEntity.ok(adminReportService.getReport(id, source));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AdminReportDetailResponse> updateStatus(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "GENERAL") AdminReportSource source,
            @Valid @RequestBody AdminReportStatusUpdateRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(adminReportService.updateStatus(
                id, source, request, authentication.getName()));
    }
}
