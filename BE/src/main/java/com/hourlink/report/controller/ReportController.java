package com.hourlink.report.controller;

import com.hourlink.common.response.ApiResponse;
import com.hourlink.report.dto.ReportRequest;
import com.hourlink.report.dto.ReportResponse;
import com.hourlink.report.dto.UpdateReportStatusRequest;
import com.hourlink.report.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Report Management")
@RestController
@RequestMapping("/report")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReportController {

    ReportService reportService;

    @Operation(summary = "Create a new report")
    @PostMapping
    public ApiResponse<ReportResponse> createReport(@Valid @RequestBody ReportRequest request) {
        ReportResponse response = reportService.createReport(request);
        return ApiResponse.success(response);
    }

    @Operation(summary = "Get current user's reports")
    @GetMapping("/my")
    public ApiResponse<List<ReportResponse>> getMyReports() {
        List<ReportResponse> responses = reportService.getMyReports();
        return ApiResponse.success(responses);
    }

    @Operation(summary = "Get one report submitted by the current user")
    @GetMapping("/my/{reportId}")
    public ApiResponse<ReportResponse> getMyReport(@PathVariable UUID reportId) {
        return ApiResponse.success(reportService.getMyReport(reportId));
    }

    @Operation(summary = "Admin: list all reports")
    @GetMapping("/admin")
    public ApiResponse<List<ReportResponse>> getAllReports() {
        return ApiResponse.success(reportService.getAllReports());
    }

    @Operation(summary = "Admin: update report status")
    @PatchMapping("/admin/{reportId}/status")
    public ApiResponse<ReportResponse> updateStatus(
            @PathVariable UUID reportId,
            @Valid @RequestBody UpdateReportStatusRequest request) {
        return ApiResponse.success("Đã cập nhật trạng thái báo cáo",
                reportService.updateStatus(reportId, request.getStatus(), request.getAdminNote()));
    }
}
