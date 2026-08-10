package com.hourlink.admin.service;

import com.hourlink.admin.dto.response.AdminAppointmentConfirmationResponse;
import com.hourlink.admin.dto.response.AdminAppointmentDetailResponse;
import com.hourlink.admin.dto.response.AdminAppointmentResponse;
import com.hourlink.admin.dto.response.AdminAppointmentStatsResponse;
import com.hourlink.appointment.entity.Appointment;
import com.hourlink.appointment.entity.AppointmentCompletion;
import com.hourlink.appointment.enums.AppointmentStatus;
import com.hourlink.appointment.repository.AppointmentCompletionRepository;
import com.hourlink.appointment.repository.AppointmentRepository;
import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminAppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentCompletionRepository completionRepository;

    public Page<AdminAppointmentResponse> getAppointments(
            String search,
            AppointmentStatus status,
            UUID userId,
            LocalDate dateFrom,
            LocalDate dateTo,
            Pageable pageable) {
        if (dateFrom != null && dateTo != null && dateFrom.isAfter(dateTo)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Ngày bắt đầu không thể sau ngày kết thúc");
        }

        Specification<Appointment> spec = Specification.where(null);
        if (search != null && !search.isBlank()) {
            String keyword = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, query, cb) -> {
                var provider = root.join("provider", JoinType.LEFT);
                var receiver = root.join("receiver", JoinType.LEFT);
                var skill = root.join("skill", JoinType.LEFT);
                query.distinct(true);
                return cb.or(
                        cb.like(cb.lower(root.get("title")), keyword),
                        cb.like(cb.lower(provider.get("fullName")), keyword),
                        cb.like(cb.lower(provider.get("email")), keyword),
                        cb.like(cb.lower(receiver.get("fullName")), keyword),
                        cb.like(cb.lower(receiver.get("email")), keyword),
                        cb.like(cb.lower(skill.get("name")), keyword));
            });
        }
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (userId != null) {
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.equal(root.get("provider").get("id"), userId),
                    cb.equal(root.get("receiver").get("id"), userId)));
        }
        if (dateFrom != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("appointmentDate"), dateFrom));
        }
        if (dateTo != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("appointmentDate"), dateTo));
        }

        return appointmentRepository.findAll(spec, pageable).map(this::toSummary);
    }

    public AdminAppointmentDetailResponse getAppointment(UUID id) {
        Appointment appointment = getOrThrow(id);
        return toDetail(appointment, getConfirmationLog(id));
    }

    public List<AdminAppointmentConfirmationResponse> getConfirmationLog(UUID appointmentId) {
        getOrThrow(appointmentId);
        return completionRepository.findByAppointmentIdOrderByConfirmedAtAsc(appointmentId)
                .stream().map(this::toConfirmation).toList();
    }

    public AdminAppointmentStatsResponse getStats() {
        long total = appointmentRepository.count();
        long pending = appointmentRepository.countByStatus(AppointmentStatus.PENDING);
        long active = appointmentRepository.countByStatus(AppointmentStatus.CONFIRMED)
                + appointmentRepository.countByStatus(AppointmentStatus.UPCOMING)
                + appointmentRepository.countByStatus(AppointmentStatus.IN_PROGRESS);
        long completed = appointmentRepository.countByStatus(AppointmentStatus.COMPLETED);
        long cancelled = appointmentRepository.countByStatus(AppointmentStatus.CANCELLED);
        long disputed = appointmentRepository.countByStatus(AppointmentStatus.DISPUTED);
        long rescheduled = appointmentRepository.countByStatus(AppointmentStatus.RESCHEDULED);
        return new AdminAppointmentStatsResponse(
                total, pending, active, completed, cancelled, disputed, rescheduled,
                percent(completed, total), percent(cancelled, total), percent(disputed, total));
    }

    private Appointment getOrThrow(UUID id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
    }

    private AdminAppointmentResponse toSummary(Appointment a) {
        return new AdminAppointmentResponse(
                a.getId(), a.getTitle(), a.getStatus(), a.getAppointmentDate(), a.getStartTime(), a.getEndTime(),
                a.getMeetingType(), a.getTimeCreditAmount(),
                a.getProvider().getId(), a.getProvider().getFullName(), a.getProvider().getEmail(),
                a.getReceiver().getId(), a.getReceiver().getFullName(), a.getReceiver().getEmail(),
                a.getSkill() == null ? null : a.getSkill().getId(),
                a.getSkill() == null ? null : a.getSkill().getName(), a.getCreatedAt());
    }

    private AdminAppointmentConfirmationResponse toConfirmation(AppointmentCompletion c) {
        return new AdminAppointmentConfirmationResponse(
                c.getId(), c.getUser().getId(), c.getUser().getFullName(), c.getUser().getEmail(),
                c.getActualDurationMinutes(), c.getContentCompleted(), c.getHasIssue(),
                c.getIssueDescription(), c.getConfirmedAt());
    }

    private AdminAppointmentDetailResponse toDetail(
            Appointment a, List<AdminAppointmentConfirmationResponse> confirmations) {
        return new AdminAppointmentDetailResponse(
                a.getId(), a.getTitle(), a.getDescription(), a.getStatus(), a.getAppointmentDate(),
                a.getStartTime(), a.getEndTime(), a.getMeetingType(), a.getLocationOrLink(),
                a.getTimeCreditAmount(), a.getNotes(), a.getCancelReason(), a.getRescheduleProposedTime(),
                a.getExtraCreditStatus(), a.getProvider().getId(), a.getProvider().getFullName(),
                a.getProvider().getEmail(), a.getReceiver().getId(), a.getReceiver().getFullName(),
                a.getReceiver().getEmail(), a.getProposedBy() == null ? null : a.getProposedBy().getId(),
                a.getSkill() == null ? null : a.getSkill().getId(),
                a.getSkill() == null ? null : a.getSkill().getName(),
                a.getInvitation() == null ? null : a.getInvitation().getId(),
                a.getCreatedAt(), a.getUpdatedAt(), confirmations);
    }

    private double percent(long value, long total) {
        return total == 0 ? 0 : Math.round(value * 10_000.0 / total) / 100.0;
    }
}
