package com.hourlink.report.controller;

import com.hourlink.common.response.ApiResponse;
import com.hourlink.report.dto.ReportRequest;
import com.hourlink.report.dto.ReportResponse;
import com.hourlink.report.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}
