package com.hourlink.admin.service;

import com.hourlink.admin.dto.response.AdminDashboardChartPointResponse;
import com.hourlink.admin.dto.response.AdminDashboardStatsResponse;
import com.hourlink.admin.repository.AdminDashboardQueryRepository;
import com.hourlink.common.exception.AppException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceTest {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter LABEL_FORMAT = DateTimeFormatter.ofPattern("dd/MM");

    @Mock AdminDashboardQueryRepository dashboardRepository;
    @InjectMocks AdminDashboardService service;

    @Test
    void getStatsCombinesRealSourcesAndRoundsCredit() {
        when(dashboardRepository.countTotalUsers()).thenReturn(18L);
        when(dashboardRepository.countActiveUsers()).thenReturn(15L);
        when(dashboardRepository.countAppointments()).thenReturn(42L);
        when(dashboardRepository.countActiveAppointments()).thenReturn(6L);
        when(dashboardRepository.countCompletedAppointments(any())).thenReturn(3L);
        when(dashboardRepository.totalTimeCredits()).thenReturn(123.456);
        when(dashboardRepository.countPendingReports()).thenReturn(4L);
        when(dashboardRepository.countLockedUsers()).thenReturn(2L);

        AdminDashboardStatsResponse result = service.getStats();

        assertEquals(18, result.totalUsers());
        assertEquals(15, result.activeUsers());
        assertEquals(42, result.totalAppointments());
        assertEquals(6, result.activeAppointments());
        assertEquals(3, result.completedToday());
        assertEquals(123.46, result.totalTimeCredits(), 0.0001);
        assertEquals(4, result.pendingReports());
        assertEquals(2, result.lockedAccounts());
    }

    @Test
    void userGrowthFillsAllSevenDaysIncludingZeroDays() {
        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        LocalDate firstDay = today.minusDays(6);
        when(dashboardRepository.getUserGrowth(any(), any()))
                .thenReturn(Map.of(firstDay, 2L, today, 5L));

        List<AdminDashboardChartPointResponse> result = service.getUserGrowth("week");

        assertEquals(7, result.size());
        assertEquals(LABEL_FORMAT.format(firstDay), result.getFirst().label());
        assertEquals(2, result.getFirst().value());
        assertEquals(0, result.get(1).value());
        assertEquals(LABEL_FORMAT.format(today), result.getLast().label());
        assertEquals(5, result.getLast().value());
    }

    @Test
    void appointmentMonthReturnsThirtyPoints() {
        when(dashboardRepository.getAppointmentStats(any(), any())).thenReturn(Map.of());

        List<AdminDashboardChartPointResponse> result = service.getAppointmentStats("month");

        assertEquals(30, result.size());
        assertEquals(0, result.stream().mapToLong(AdminDashboardChartPointResponse::value).sum());
    }

    @Test
    void topSkillsKeepsRepositoryOrderAndLimit() {
        when(dashboardRepository.getTopSkills(anyInt())).thenReturn(List.of(
                new AdminDashboardQueryRepository.NamedCount("Java", 8),
                new AdminDashboardQueryRepository.NamedCount("Guitar", 5)));

        List<AdminDashboardChartPointResponse> result = service.getTopSkills();

        assertEquals(List.of(
                new AdminDashboardChartPointResponse("Java", 8),
                new AdminDashboardChartPointResponse("Guitar", 5)), result);
    }

    @Test
    void unsupportedPeriodIsRejected() {
        assertThrows(AppException.class, () -> service.getUserGrowth("year"));
    }
}
