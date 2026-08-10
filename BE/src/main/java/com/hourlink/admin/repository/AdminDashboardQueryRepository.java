package com.hourlink.admin.repository;

import com.hourlink.appointment.enums.AppointmentStatus;
import com.hourlink.chat.enums.ChatReportStatus;
import com.hourlink.report.enums.ReportStatus;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class AdminDashboardQueryRepository {

    private static final String ADMIN_ROLE = "ROLE_ADMIN";
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final EntityManager entityManager;

    public long countTotalUsers() {
        return countUsers(null);
    }

    public long countActiveUsers() {
        return countUsers(false);
    }

    public long countLockedUsers() {
        return countUsers(true);
    }

    private long countUsers(Boolean locked) {
        String lockedClause = locked == null ? "" : " AND u.isLocked = :locked";
        var query = entityManager.createQuery("""
                SELECT COUNT(u) FROM User u
                WHERE u.isDeleted = false
                  AND NOT EXISTS (
                      SELECT ur.id FROM UserRole ur
                      WHERE ur.user = u AND ur.role.roleCode = :adminRole
                  )
                """ + lockedClause, Long.class);
        query.setParameter("adminRole", ADMIN_ROLE);
        if (locked != null) {
            query.setParameter("locked", locked);
        }
        return query.getSingleResult();
    }

    public long countAppointments() {
        return entityManager.createQuery("SELECT COUNT(a) FROM Appointment a", Long.class)
                .getSingleResult();
    }

    public long countActiveAppointments() {
        return entityManager.createQuery("""
                        SELECT COUNT(a) FROM Appointment a
                        WHERE a.status IN :statuses
                        """, Long.class)
                .setParameter("statuses", List.of(
                        AppointmentStatus.PENDING,
                        AppointmentStatus.CONFIRMED,
                        AppointmentStatus.UPCOMING,
                        AppointmentStatus.IN_PROGRESS,
                        AppointmentStatus.RESCHEDULED))
                .getSingleResult();
    }

    public long countCompletedAppointments(LocalDate date) {
        return entityManager.createQuery("""
                        SELECT COUNT(a) FROM Appointment a
                        WHERE a.status = :status AND a.appointmentDate = :date
                        """, Long.class)
                .setParameter("status", AppointmentStatus.COMPLETED)
                .setParameter("date", date)
                .getSingleResult();
    }

    public double totalTimeCredits() {
        Double value = entityManager.createQuery("""
                        SELECT COALESCE(SUM(w.balance + w.heldAmount), 0.0)
                        FROM Wallet w
                        """, Double.class)
                .getSingleResult();
        return value == null ? 0 : value;
    }

    public long countPendingReports() {
        long general = entityManager.createQuery("""
                        SELECT COUNT(r) FROM Report r WHERE r.status = :status
                        """, Long.class)
                .setParameter("status", ReportStatus.PENDING)
                .getSingleResult();
        long chat = entityManager.createQuery("""
                        SELECT COUNT(r) FROM ChatReport r WHERE r.status = :status
                        """, Long.class)
                .setParameter("status", ChatReportStatus.PENDING)
                .getSingleResult();
        return general + chat;
    }

    public Map<LocalDate, Long> getUserGrowth(Instant fromInclusive, Instant toExclusive) {
        List<Object[]> rows = entityManager.createQuery("""
                        SELECT FUNCTION('DATE', u.createdAt), COUNT(u)
                        FROM User u
                        WHERE u.createdAt >= :fromInclusive
                          AND u.createdAt < :toExclusive
                          AND u.isDeleted = false
                          AND NOT EXISTS (
                              SELECT ur.id FROM UserRole ur
                              WHERE ur.user = u AND ur.role.roleCode = :adminRole
                          )
                        GROUP BY FUNCTION('DATE', u.createdAt)
                        ORDER BY FUNCTION('DATE', u.createdAt)
                        """, Object[].class)
                .setParameter("fromInclusive", fromInclusive)
                .setParameter("toExclusive", toExclusive)
                .setParameter("adminRole", ADMIN_ROLE)
                .getResultList();
        return toDailyMap(rows);
    }

    public Map<LocalDate, Long> getAppointmentStats(LocalDate fromInclusive, LocalDate toInclusive) {
        List<Object[]> rows = entityManager.createQuery("""
                        SELECT a.appointmentDate, COUNT(a)
                        FROM Appointment a
                        WHERE a.appointmentDate >= :fromInclusive
                          AND a.appointmentDate <= :toInclusive
                        GROUP BY a.appointmentDate
                        ORDER BY a.appointmentDate
                        """, Object[].class)
                .setParameter("fromInclusive", fromInclusive)
                .setParameter("toInclusive", toInclusive)
                .getResultList();
        return toDailyMap(rows);
    }

    public List<NamedCount> getTopSkills(int limit) {
        return entityManager.createQuery("""
                        SELECT s.name, COUNT(a)
                        FROM Appointment a JOIN a.skill s
                        WHERE a.status <> :cancelled
                        GROUP BY s.name
                        ORDER BY COUNT(a) DESC, s.name ASC
                        """, Object[].class)
                .setParameter("cancelled", AppointmentStatus.CANCELLED)
                .setMaxResults(limit)
                .getResultList()
                .stream()
                .map(row -> new NamedCount((String) row[0], ((Number) row[1]).longValue()))
                .toList();
    }

    private Map<LocalDate, Long> toDailyMap(List<Object[]> rows) {
        Map<LocalDate, Long> result = new LinkedHashMap<>();
        for (Object[] row : rows) {
            result.put(toLocalDate(row[0]), ((Number) row[1]).longValue());
        }
        return result;
    }

    private LocalDate toLocalDate(Object value) {
        if (value instanceof LocalDate date) {
            return date;
        }
        if (value instanceof Date date) {
            return date.toLocalDate();
        }
        if (value instanceof java.util.Date date) {
            return date.toInstant().atZone(BUSINESS_ZONE).toLocalDate();
        }
        return LocalDate.parse(value.toString());
    }

    public record NamedCount(String name, long count) {
    }
}
