package com.hourlink.admin.service;

import com.hourlink.admin.dto.response.AdminDashboardChartPointResponse;
import com.hourlink.admin.dto.response.AdminDashboardStatsResponse;
import com.hourlink.admin.repository.AdminDashboardQueryRepository;
import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter LABEL_FORMAT = DateTimeFormatter.ofPattern("dd/MM");
    private static final int TOP_SKILLS_LIMIT = 5;

    private final AdminDashboardQueryRepository dashboardRepository;

    public AdminDashboardStatsResponse getStats() {
        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        return new AdminDashboardStatsResponse(
                dashboardRepository.countTotalUsers(),
                dashboardRepository.countActiveUsers(),
                dashboardRepository.countAppointments(),
                dashboardRepository.countActiveAppointments(),
                dashboardRepository.countCompletedAppointments(today),
                round(dashboardRepository.totalTimeCredits()),
                dashboardRepository.countPendingReports(),
                dashboardRepository.countLockedUsers(),
                Instant.now());
    }

    public List<AdminDashboardChartPointResponse> getUserGrowth(String period) {
        DateRange range = range(period);
        Instant from = range.from().atStartOfDay(BUSINESS_ZONE).toInstant();
        Instant toExclusive = range.to().plusDays(1).atStartOfDay(BUSINESS_ZONE).toInstant();
        return fillRange(range, dashboardRepository.getUserGrowth(from, toExclusive));
    }

    public List<AdminDashboardChartPointResponse> getAppointmentStats(String period) {
        DateRange range = range(period);
        return fillRange(range, dashboardRepository.getAppointmentStats(range.from(), range.to()));
    }

    public List<AdminDashboardChartPointResponse> getTopSkills() {
        return dashboardRepository.getTopSkills(TOP_SKILLS_LIMIT).stream()
                .map(item -> new AdminDashboardChartPointResponse(item.name(), item.count()))
                .toList();
    }

    private List<AdminDashboardChartPointResponse> fillRange(DateRange range, Map<LocalDate, Long> values) {
        return IntStream.range(0, range.days())
                .mapToObj(offset -> range.from().plusDays(offset))
                .map(day -> new AdminDashboardChartPointResponse(
                        LABEL_FORMAT.format(day), values.getOrDefault(day, 0L)))
                .toList();
    }

    private DateRange range(String period) {
        String normalized = period == null ? "week" : period.trim().toLowerCase(Locale.ROOT);
        int days = switch (normalized) {
            case "week" -> 7;
            case "month" -> 30;
            default -> throw new AppException(ErrorCode.INVALID_REQUEST,
                    "Khoảng thời gian chỉ nhận week hoặc month");
        };
        LocalDate to = LocalDate.now(BUSINESS_ZONE);
        return new DateRange(to.minusDays(days - 1L), to, days);
    }

    private double round(double value) {
        if (!Double.isFinite(value)) {
            return 0;
        }
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private record DateRange(LocalDate from, LocalDate to, int days) {
    }
}
