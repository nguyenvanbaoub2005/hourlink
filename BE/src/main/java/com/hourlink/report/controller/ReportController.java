package com.hourlink.report.controller;

import com.hourlink.common.response.ApiResponse;
import com.hourlink.report.dto.request.ReportRequest;
import com.hourlink.report.dto.response.ReportResponse;
import com.hourlink.report.enums.ReportStatus;
import com.hourlink.report.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * ReportController — API endpoints cho tính năng báo cáo vi phạm (US-39, US-40).
 */
@Tag(name = "Report Management", description = "Quản lý báo cáo vi phạm")
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReportController {

    ReportService reportService;

    // ==========================================
    // Dành cho Người dùng (User)
    // ==========================================

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Tạo báo cáo vi phạm", description = "US-39: Tạo báo cáo người dùng, tin nhắn hoặc nội dung vi phạm")
    public ApiResponse<ReportResponse> createReport(@Valid @RequestBody ReportRequest request) {
        return ApiResponse.success(reportService.createReport(request));
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy danh sách báo cáo của tôi", description = "US-40: Lấy tất cả báo cáo do tôi gửi (có thể lọc theo trạng thái)")
    public ApiResponse<List<ReportResponse>> getMyReports(
            @RequestParam(required = false) ReportStatus status) {
        
        if (status != null) {
            return ApiResponse.success(reportService.getMyReportsByStatus(status));
        }
        return ApiResponse.success(reportService.getMyReports());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết báo cáo", description = "US-40: Xem chi tiết trạng thái xử lý của một báo cáo")
    public ApiResponse<ReportResponse> getReportById(@PathVariable UUID id) {
        return ApiResponse.success(reportService.getReportById(id));
    }
}
