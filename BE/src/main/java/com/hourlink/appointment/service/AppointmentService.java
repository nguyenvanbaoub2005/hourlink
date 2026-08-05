package com.hourlink.appointment.service;

import com.hourlink.appointment.dto.request.*;
import com.hourlink.appointment.dto.response.*;
import com.hourlink.appointment.entity.*;
import com.hourlink.appointment.enums.AppointmentStatus;
import com.hourlink.appointment.enums.VerificationMethod;
import com.hourlink.appointment.repository.*;
import com.hourlink.chat.service.ChatService;
import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.common.util.SecurityUtil;
import com.hourlink.invitation.entity.Invitation;
import com.hourlink.invitation.repository.InvitationRepository;
import com.hourlink.notification.enums.NotificationType;
import com.hourlink.notification.service.NotificationService;
import com.hourlink.skill.entity.Skill;
import com.hourlink.skill.enums.SessionFormat;
import com.hourlink.skill.repository.SkillRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.UUID;

/**
 * AppointmentService — Implement business logic cho module appointment (9.11, 9.12, 9.14, 9.15).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentVerificationRepository verificationRepository;
    private final AppointmentCompletionRepository completionRepository;
    private final UserRepository userRepository;
    private final InvitationRepository invitationRepository;
    private final SkillRepository skillRepository;
    private final NotificationService notificationService;
    private final ChatService chatService;

    // ─── 1. Tạo lịch hẹn (9.11) ──────────────────────────────────────────────

    @Transactional
    public AppointmentResponse createAppointment(CreateAppointmentRequest req) {
        String currentUserEmail = SecurityUtil.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        User provider = userRepository.findById(req.getProviderId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        User receiver = userRepository.findById(req.getReceiverId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Invitation invitation = null;
        if (req.getInvitationId() != null) {
            invitation = invitationRepository.findById(req.getInvitationId())
                    .orElseThrow(() -> new AppException(ErrorCode.INVITATION_NOT_FOUND));
        }

        Skill skill = null;
        if (req.getSkillId() != null) {
            skill = skillRepository.findById(req.getSkillId())
                    .orElseThrow(() -> new AppException(ErrorCode.SKILL_NOT_FOUND));
        }

        // Validate: nếu hình thức Online thì người tạo phải cung cấp link họp
        if (req.getMeetingType() == SessionFormat.ONLINE) {
            if (req.getLocationOrLink() == null || req.getLocationOrLink().trim().isEmpty()) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "Hình thức Online yêu cầu cung cấp link họp.");
            }
        }

        // Validate: người tạo phải là 1 trong 2 bên
        boolean isProvider = currentUser.getId().equals(provider.getId());
        boolean isReceiver = currentUser.getId().equals(receiver.getId());
        if (!isProvider && !isReceiver) {
            throw new AppException(ErrorCode.ACCESS_DENIED, "Bạn không phải người tham gia lịch hẹn này.");
        }

        Appointment appointment = Appointment.builder()
                .provider(provider)
                .receiver(receiver)
                .invitation(invitation)
                .skill(skill)
                .title(req.getTitle())
                .description(req.getDescription())
                .appointmentDate(req.getAppointmentDate())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .meetingType(req.getMeetingType())
                .locationOrLink(req.getLocationOrLink())
                .timeCreditAmount(req.getTimeCreditAmount() != null ? req.getTimeCreditAmount() : 1.0)
                .notes(req.getNotes())
                .status(AppointmentStatus.PENDING)
                .build();

        appointment = appointmentRepository.save(appointment);

        // Gửi thông báo cho bên kia
        User targetUser = isProvider ? receiver : provider;
        notificationService.createNotification(targetUser, currentUser, NotificationType.APPOINTMENT_CREATED,
                "Lịch hẹn mới: " + req.getTitle(),
                currentUser.getFullName() + " đã đề xuất lịch hẹn với bạn.",
                appointment.getId());

        // Gửi card lịch hẹn vào chat để bên kia có thể phản hồi trực tiếp
        try {
            UUID conversationId = chatService.findConversationIdByUsers(provider.getId(), receiver.getId());
            if (conversationId != null) {
                String aptData = buildAppointmentCardData(appointment);
                chatService.sendAppointmentCardInternal(conversationId, appointment.getId(), aptData, currentUser);
            }
        } catch (Exception e) {
            log.warn("Không gửi được card lịch hẹn vào chat: {}", e.getMessage());
        }

        log.info("Created appointment ID [{}] by user [{}]", appointment.getId(), currentUserEmail);
        return AppointmentResponse.fromEntity(appointment);
    }

    /** Tạo JSON snapshot đơn giản của lịch hẹn để nhúng vào APPOINTMENT_CARD */
    private String buildAppointmentCardData(Appointment apt) {
        return String.format(
            "{\"id\":\"%s\",\"title\":\"%s\",\"date\":\"%s\",\"start\":\"%s\",\"end\":\"%s\"," +
            "\"meetingType\":\"%s\",\"locationOrLink\":\"%s\",\"timeCreditAmount\":%s,\"status\":\"%s\"}",
            apt.getId(),
            apt.getTitle() != null ? apt.getTitle().replace("\"", "'") : "",
            apt.getAppointmentDate(),
            apt.getStartTime(),
            apt.getEndTime(),
            apt.getMeetingType(),
            apt.getLocationOrLink() != null ? apt.getLocationOrLink().replace("\"", "'") : "",
            apt.getTimeCreditAmount(),
            apt.getStatus()
        );
    }

    // ─── 2. Quản lý lịch cá nhân (9.12) ──────────────────────────────────────

    public Page<AppointmentResponse> getMyAppointments(String tab, int page, int size) {
        String currentUserEmail = SecurityUtil.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Pageable pageable = PageRequest.of(page, size, Sort.by("appointmentDate").descending().and(Sort.by("startTime").descending()));
        UUID userId = currentUser.getId();

        Page<Appointment> appointmentPage;
        if ("UPCOMING".equalsIgnoreCase(tab)) {
            appointmentPage = appointmentRepository.findByUserIdAndStatusIn(userId,
                    List.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.UPCOMING, AppointmentStatus.RESCHEDULED),
                    pageable);
        } else if ("IN_PROGRESS".equalsIgnoreCase(tab)) {
            appointmentPage = appointmentRepository.findByUserIdAndStatus(userId, AppointmentStatus.IN_PROGRESS, pageable);
        } else if ("HISTORY".equalsIgnoreCase(tab) || "COMPLETED".equalsIgnoreCase(tab)) {
            appointmentPage = appointmentRepository.findByUserIdAndStatusIn(userId,
                    List.of(AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.DISPUTED),
                    pageable);
        } else {
            appointmentPage = appointmentRepository.findByUserId(userId, pageable);
        }

        return appointmentPage.map(AppointmentResponse::fromEntity);
    }

    public AppointmentResponse getAppointmentDetail(UUID id) {
        Appointment appointment = getAppointmentById(id);
        checkUserAccess(appointment);
        return AppointmentResponse.fromEntity(appointment);
    }

    // ─── 3. Phản hồi lịch hẹn (Xác nhận, Đổi, Hủy) ──────────────────────────

    @Transactional
    public AppointmentResponse respondAppointment(UUID id, RespondAppointmentRequest req) {
        Appointment appointment = getAppointmentById(id);
        User currentUser = checkUserAccess(appointment);
        User targetUser = currentUser.getId().equals(appointment.getProvider().getId())
                ? appointment.getReceiver() : appointment.getProvider();

        String action = req.getAction() != null ? req.getAction().toUpperCase() : "";

        if ("CONFIRM".equals(action)) {
            // Cả hai bên đều có thể xác nhận lịch hẹn (người không tạo thì xác nhận đồng ý)
            if (appointment.getStatus() != AppointmentStatus.PENDING && appointment.getStatus() != AppointmentStatus.RESCHEDULED) {
                throw new AppException(ErrorCode.APPOINTMENT_INVALID_STATUS);
            }
            if (appointment.getMeetingType() == SessionFormat.ONLINE) {
                if (appointment.getLocationOrLink() == null || appointment.getLocationOrLink().trim().isEmpty()) {
                    if (req.getLocationOrLink() == null || req.getLocationOrLink().trim().isEmpty()) {
                        throw new AppException(ErrorCode.INVALID_REQUEST, "Hình thức Online yêu cầu cung cấp link họp khi xác nhận.");
                    }
                    appointment.setLocationOrLink(req.getLocationOrLink());
                }
            }
            appointment.setStatus(AppointmentStatus.CONFIRMED);
            // TODO (Wallet Hook): Tạo lệnh hold Time Credit của receiver khi chốt lịch
            notificationService.createNotification(targetUser, currentUser, NotificationType.APPOINTMENT_CONFIRMED,
                    "Lịch hẹn đã được xác nhận",
                    currentUser.getFullName() + " đã xác nhận lịch hẹn: " + appointment.getTitle(),
                    appointment.getId());
        } else if ("CANCEL".equals(action)) {
            if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
                throw new AppException(ErrorCode.APPOINTMENT_INVALID_STATUS);
            }
            appointment.setStatus(AppointmentStatus.CANCELLED);
            appointment.setCancelReason(req.getReason());
            // TODO (Wallet Hook): Hoàn lại Time Credit tạm giữ nếu có
            notificationService.createNotification(targetUser, currentUser, NotificationType.APPOINTMENT_CANCELLED,
                    "Lịch hẹn đã bị hủy",
                    currentUser.getFullName() + " đã hủy lịch hẹn. Lý do: " + (req.getReason() != null ? req.getReason() : "Không có"),
                    appointment.getId());
            // Task 33: Cập nhật tỷ lệ hủy của người hủy
            updateCancelRate(currentUser);
        } else if ("RESCHEDULE".equals(action)) {
            appointment.setStatus(AppointmentStatus.RESCHEDULED);
            appointment.setRescheduleProposedTime(req.getNewTime());
            notificationService.createNotification(targetUser, currentUser, NotificationType.APPOINTMENT_RESCHEDULED,
                    "Đề xuất đổi thời gian lịch hẹn",
                    currentUser.getFullName() + " đề xuất đổi thời gian thành: " + req.getNewTime(),
                    appointment.getId());
        } else {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        return AppointmentResponse.fromEntity(appointmentRepository.save(appointment));
    }

    // ─── 4. Xác nhận bằng QR hoặc OTP (9.14) ────────────────────────────────

    @Transactional
    public AppointmentVerificationResponse generateVerificationCode(UUID id) {
        Appointment appointment = getAppointmentById(id);
        checkUserAccess(appointment);

        if (appointment.getStatus() != AppointmentStatus.CONFIRMED && appointment.getStatus() != AppointmentStatus.UPCOMING) {
            throw new AppException(ErrorCode.APPOINTMENT_INVALID_STATUS);
        }

        VerificationMethod method = (appointment.getMeetingType() == SessionFormat.OFFLINE)
                ? VerificationMethod.QR : VerificationMethod.OTP;

        String code;
        if (method == VerificationMethod.QR) {
            code = UUID.randomUUID().toString();
        } else {
            code = String.valueOf(100000 + new Random().nextInt(900000));
        }

        LocalDateTime appointmentEndDateTime = LocalDateTime.of(appointment.getAppointmentDate(), appointment.getEndTime());
        
        AppointmentVerification verification = AppointmentVerification.builder()
                .appointment(appointment)
                .method(method)
                .code(code)
                .expiresAt(appointmentEndDateTime.plusHours(1)) // Hết hạn sau 1 tiếng kể từ lúc lịch hẹn kết thúc
                .build();

        verification = verificationRepository.save(verification);
        log.info("Generated {} verification code for appointment ID [{}]", method, id);
        return AppointmentVerificationResponse.fromEntity(verification);
    }

    @Transactional
    public AppointmentResponse verifyCode(UUID id, VerifyCodeRequest req) {
        Appointment appointment = getAppointmentById(id);
        User currentUser = checkUserAccess(appointment);

        AppointmentVerification verification = verificationRepository.findByAppointmentIdAndCode(id, req.getCode().trim())
                .orElseThrow(() -> new AppException(ErrorCode.VERIFICATION_INVALID));

        if (LocalDateTime.now().isAfter(verification.getExpiresAt())) {
            throw new AppException(ErrorCode.VERIFICATION_INVALID);
        }

        verification.setVerifiedAt(LocalDateTime.now());
        verification.setVerifiedBy(currentUser);
        verificationRepository.save(verification);

        appointment.setStatus(AppointmentStatus.IN_PROGRESS);
        appointmentRepository.save(appointment);

        User targetUser = currentUser.getId().equals(appointment.getProvider().getId())
                ? appointment.getReceiver() : appointment.getProvider();
        notificationService.createNotification(targetUser, currentUser, NotificationType.APPOINTMENT_CONFIRMED,
                "Buổi hỗ trợ đã bắt đầu",
                "Xác thực " + verification.getMethod() + " thành công. Buổi hỗ trợ bắt đầu diễn ra.",
                appointment.getId());

        log.info("Verified appointment ID [{}] successfully by user [{}]", id, currentUser.getEmail());
        return AppointmentResponse.fromEntity(appointment);
    }

    // ─── 5. Xác nhận kết thúc và chuyển Time Credit (9.15) ──────────────────

    @Transactional
    public AppointmentResponse confirmCompletion(UUID id, ConfirmCompletionRequest req) {
        Appointment appointment = getAppointmentById(id);
        User currentUser = checkUserAccess(appointment);

        if (appointment.getStatus() != AppointmentStatus.IN_PROGRESS && appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new AppException(ErrorCode.APPOINTMENT_INVALID_STATUS);
        }

        if (completionRepository.existsByAppointmentIdAndUserId(id, currentUser.getId())) {
            throw new AppException(ErrorCode.ALREADY_CONFIRMED);
        }

        AppointmentCompletion completion = AppointmentCompletion.builder()
                .appointment(appointment)
                .user(currentUser)
                .actualDurationMinutes(req.getActualDurationMinutes())
                .contentCompleted(req.getContentCompleted())
                .hasIssue(req.getHasIssue() != null && req.getHasIssue())
                .issueDescription(req.getIssueDescription())
                .confirmedAt(LocalDateTime.now())
                .build();
        completionRepository.save(completion);

        List<AppointmentCompletion> allCompletions = completionRepository.findByAppointmentId(id);
        allCompletions.add(completion); // bao gồm cả bản ghi vừa thêm

        boolean anyIssue = allCompletions.stream().anyMatch(c -> Boolean.TRUE.equals(c.getHasIssue()));
        if (anyIssue) {
            appointment.setStatus(AppointmentStatus.DISPUTED);
        } else if (allCompletions.size() >= 2) {
            // Cả hai bên đều đã xác nhận hoàn thành không có vấn đề
            appointment.setStatus(AppointmentStatus.COMPLETED);
            // TODO (Wallet Hook): Trừ Time Credit ở ví receiver và cộng vào ví provider
            notificationService.createNotification(appointment.getProvider(), null, NotificationType.APPOINTMENT_COMPLETED,
                    "Buổi hỗ trợ hoàn thành!",
                    "Cả hai bên đã xác nhận hoàn thành buổi hẹn: " + appointment.getTitle() + ". Time Credit đã được chuyển.",
                    appointment.getId());
            notificationService.createNotification(appointment.getReceiver(), null, NotificationType.APPOINTMENT_COMPLETED,
                    "Buổi hỗ trợ hoàn thành!",
                    "Cả hai bên đã xác nhận hoàn thành buổi hẹn: " + appointment.getTitle() + ". Time Credit đã được chuyển.",
                    appointment.getId());
            // Task 33: Tăng số buổi hoàn thành cho cả hai bên
            incrementCompletedSessions(appointment.getProvider());
            incrementCompletedSessions(appointment.getReceiver());
        }

        return AppointmentResponse.fromEntity(appointmentRepository.save(appointment));
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Appointment getAppointmentById(UUID id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
    }

    private User checkUserAccess(Appointment appointment) {
        String currentUserEmail = SecurityUtil.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!currentUser.getId().equals(appointment.getProvider().getId()) &&
            !currentUser.getId().equals(appointment.getReceiver().getId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        return currentUser;
    }

    // ─── Task 33: Cập nhật thống kê người dùng ───────────────────────────────

    /**
     * Tăng completedSessions sau khi cả hai bên xác nhận hoàn thành.
     */
    private void incrementCompletedSessions(User user) {
        user.setCompletedSessions(user.getCompletedSessions() + 1);
        userRepository.save(user);
        log.info("Incremented completedSessions for user [{}] → {}", user.getEmail(), user.getCompletedSessions());
    }

    /**
     * Cập nhật cancelRate = số lịch bị hủy / tổng số lịch đã từng tham gia.
     */
    private void updateCancelRate(User user) {
        long totalByUser = appointmentRepository.countByProviderIdOrReceiverId(user.getId(), user.getId());
        long cancelledByUser = appointmentRepository.countCancelledByUserId(user.getId());
        if (totalByUser > 0) {
            double rate = (double) cancelledByUser / totalByUser * 100.0;
            user.setCancelRate(rate);
            userRepository.save(user);
            log.info("Updated cancelRate for user [{}] → {}%", user.getEmail(), rate);
        }
    }
}
