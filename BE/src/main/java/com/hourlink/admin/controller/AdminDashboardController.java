package com.hourlink.admin.controller;

import com.hourlink.admin.dto.response.AdminDashboardChartPointResponse;
import com.hourlink.admin.dto.response.AdminDashboardStatsResponse;
import com.hourlink.admin.service.AdminDashboardService;
import com.hourlink.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminDashboardStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getStats()));
    }

    @GetMapping("/user-growth")
    public ResponseEntity<ApiResponse<List<AdminDashboardChartPointResponse>>> getUserGrowth(
            @RequestParam(defaultValue = "week") String period) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getUserGrowth(period)));
    }

    @GetMapping("/appointment-stats")
    public ResponseEntity<ApiResponse<List<AdminDashboardChartPointResponse>>> getAppointmentStats(
            @RequestParam(defaultValue = "week") String period) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getAppointmentStats(period)));
    }

    @GetMapping("/top-skills")
    public ResponseEntity<ApiResponse<List<AdminDashboardChartPointResponse>>> getTopSkills() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getTopSkills()));
    }
}
