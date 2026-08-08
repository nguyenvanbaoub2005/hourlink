package com.hourlink.appointment.service;

import com.hourlink.appointment.dto.request.*;
import com.hourlink.appointment.dto.response.*;
import com.hourlink.appointment.entity.*;
import com.hourlink.appointment.enums.AppointmentStatus;
import com.hourlink.appointment.enums.VerificationMethod;
import com.hourlink.appointment.repository.*;
import com.hourlink.chat.service.ChatService;
import com.hourlink.wallet.service.WalletService;
import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.common.util.SecurityUtil;
import com.hourlink.invitation.entity.Invitation;
import com.hourlink.invitation.enums.InvitationStatus;
import com.hourlink.invitation.repository.InvitationRepository;
import com.hourlink.notification.enums.NotificationType;
import com.hourlink.notification.service.NotificationService;
import com.hourlink.rating.service.RatingService;
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
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
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

    private static final int MAX_CANCEL_REASON_LENGTH = 500;
    private static final int REMINDER_LEAD_MINUTES = 30;
    private static final String AUTO_EXPIRED_REASON = "Lịch hẹn đã tự động hủy vì quá thời gian diễn ra.";

    private static final List<AppointmentStatus> BLOCKING_NEXT_SESSION_STATUSES = List.of(
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.UPCOMING,
            AppointmentStatus.IN_PROGRESS,
            AppointmentStatus.RESCHEDULED,
            AppointmentStatus.DISPUTED
    );

    private static final List<AppointmentStatus> LIFECYCLE_STATUSES = List.of(
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.UPCOMING,
            AppointmentStatus.RESCHEDULED
    );

    private final AppointmentRepository appointmentRepository;
    private final AppointmentVerificationRepository verificationRepository;
    private final AppointmentCompletionRepository completionRepository;
    private final UserRepository userRepository;
    private final InvitationRepository invitationRepository;
    private final SkillRepository skillRepository;
    private final NotificationService notificationService;
    private final ChatService chatService;
    private final WalletService walletService;
    private final RatingService ratingService;

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

        if (provider.getId().equals(receiver.getId())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Người hỗ trợ và người nhận phải là hai người khác nhau.");
        }

        Invitation invitation = null;
        if (req.getInvitationId() != null) {
            invitation = invitationRepository.findByIdForUpdate(req.getInvitationId())
                    .orElseThrow(() -> new AppException(ErrorCode.INVITATION_NOT_FOUND));
            validateInvitationForAppointment(invitation, provider, receiver);
            if (appointmentRepository.findFirstByInvitation_IdAndStatusInOrderByCreatedAtDesc(
                    invitation.getId(), BLOCKING_NEXT_SESSION_STATUSES).isPresent()) {
                throw new AppException(ErrorCode.INVALID_REQUEST,
                        "Hai bạn đang có một lịch hẹn chưa kết thúc. Hãy hoàn thành hoặc hủy lịch đó trước khi tạo buổi tiếp theo.");
            }
        }

        Skill skill = null;
        if (req.getSkillId() != null) {
            skill = skillRepository.findById(req.getSkillId())
                    .orElseThrow(() -> new AppException(ErrorCode.SKILL_NOT_FOUND));
            if (invitation != null && invitation.getSkill() != null
                    && !invitation.getSkill().getId().equals(skill.getId())) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "Kỹ năng của lịch hẹn không khớp với lời mời.");
            }
        } else if (invitation != null) {
            skill = invitation.getSkill();
        }

        validateSchedule(req.getAppointmentDate(), req.getStartTime(), req.getEndTime());
        validateMeetingDetails(req.getMeetingType(), req.getLocationOrLink());
        if (req.getTimeCreditAmount() != null
                && (req.getTimeCreditAmount() < 0.5 || req.getTimeCreditAmount() > 24.0)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Time Credit phải nằm trong khoảng 0.5 đến 24 TC.");
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
                .proposedBy(currentUser)
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
            UUID conversationId = invitation != null
                    ? chatService.findConversationIdByInvitation(invitation.getId())
                    : chatService.findConversationIdByUsers(provider.getId(), receiver.getId());
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
            "\"meetingType\":\"%s\",\"locationOrLink\":\"%s\",\"timeCreditAmount\":%s," +
            "\"status\":\"%s\",\"proposedById\":\"%s\",\"cancelReason\":\"%s\"}",
            apt.getId(),
            escapeJson(apt.getTitle()),
            apt.getAppointmentDate(),
            apt.getStartTime(),
            apt.getEndTime(),
            apt.getMeetingType(),
            escapeJson(apt.getLocationOrLink()),
            apt.getTimeCreditAmount(),
            apt.getStatus(),
            apt.getProposedBy() != null ? apt.getProposedBy().getId() : "",
            escapeJson(apt.getCancelReason())
        );
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    // ─── 2. Quản lý lịch cá nhân (9.12) ──────────────────────────────────────

    public Page<AppointmentResponse> getMyAppointments(String tab, int page, int size) {
        String currentUserEmail = SecurityUtil.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Sort sort = "UPCOMING".equalsIgnoreCase(tab)
                ? Sort.by("appointmentDate").ascending().and(Sort.by("startTime").ascending())
                : Sort.by("appointmentDate").descending().and(Sort.by("startTime").descending());
        Pageable pageable = PageRequest.of(page, size, sort);
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

    /**
     * Đồng bộ vòng đời lịch hẹn mỗi phút: nhắc trước 30 phút, chuyển UPCOMING và
     * tự hủy lịch đã quá giờ mà chưa bắt đầu. Không phụ thuộc người dùng mở app.
     */
    @Scheduled(fixedDelayString = "${appointment.lifecycle-delay-ms:60000}")
    @Transactional
    public void synchronizeLifecycle() {
        synchronizeLifecycleAt(LocalDateTime.now());
    }

    void synchronizeLifecycleAt(LocalDateTime now) {
        List<Appointment> candidates = appointmentRepository.findLifecycleCandidatesForUpdate(
                LIFECYCLE_STATUSES, now.toLocalDate().plusDays(1));
        int upcomingCount = 0;
        int reminderCount = 0;
        int expiredCount = 0;

        for (Appointment appointment : candidates) {
            LocalDateTime startAt = LocalDateTime.of(
                    appointment.getAppointmentDate(), appointment.getStartTime());
            LocalDateTime endAt = LocalDateTime.of(
                    appointment.getAppointmentDate(), appointment.getEndTime());
            AppointmentStatus previousStatus = appointment.getStatus();

            if (now.isAfter(endAt)) {
                appointment.setStatus(AppointmentStatus.CANCELLED);
                appointment.setCancelReason(AUTO_EXPIRED_REASON);
                if (previousStatus == AppointmentStatus.CONFIRMED
                        || previousStatus == AppointmentStatus.UPCOMING) {
                    walletService.releaseCredit(appointment);
                }
                notificationService.createNotification(
                        appointment.getProvider(), null, NotificationType.APPOINTMENT_CANCELLED,
                        "Lịch hẹn đã quá hạn",
                        AUTO_EXPIRED_REASON + " " + appointment.getTitle(), appointment.getId());
                notificationService.createNotification(
                        appointment.getReceiver(), null, NotificationType.APPOINTMENT_CANCELLED,
                        "Lịch hẹn đã quá hạn",
                        AUTO_EXPIRED_REASON + " " + appointment.getTitle(), appointment.getId());
                appointmentRepository.save(appointment);
                updateAppointmentCardFailSoft(appointment);
                expiredCount++;
                continue;
            }

            LocalDateTime reminderAt = startAt.minusMinutes(REMINDER_LEAD_MINUTES);
            boolean inReminderWindow = !now.isBefore(reminderAt) && now.isBefore(endAt);
            boolean changed = false;

            if (appointment.getStatus() == AppointmentStatus.CONFIRMED && inReminderWindow) {
                appointment.setStatus(AppointmentStatus.UPCOMING);
                upcomingCount++;
                changed = true;
            }

            if ((appointment.getStatus() == AppointmentStatus.CONFIRMED
                    || appointment.getStatus() == AppointmentStatus.UPCOMING)
                    && appointment.getReminderSentAt() == null
                    && inReminderWindow) {
                String title = now.isBefore(startAt)
                        ? "Lịch hẹn sắp bắt đầu"
                        : "Lịch hẹn đã đến giờ";
                String body = appointment.getTitle() + " diễn ra lúc "
                        + appointment.getStartTime() + " ngày " + appointment.getAppointmentDate() + ".";
                notificationService.createNotification(
                        appointment.getProvider(), null, NotificationType.APPOINTMENT_REMINDER,
                        title, body, appointment.getId());
                notificationService.createNotification(
                        appointment.getReceiver(), null, NotificationType.APPOINTMENT_REMINDER,
                        title, body, appointment.getId());
                appointment.setReminderSentAt(now.atZone(ZoneId.systemDefault()).toInstant());
                reminderCount++;
                changed = true;
            }

            if (changed) {
                appointmentRepository.save(appointment);
                updateAppointmentCardFailSoft(appointment);
            }
        }

        if (upcomingCount > 0 || reminderCount > 0 || expiredCount > 0) {
            log.info("Appointment lifecycle synchronized: upcoming={}, reminders={}, expired={}",
                    upcomingCount, reminderCount, expiredCount);
        }
    }

    // ─── 3. Phản hồi lịch hẹn (Xác nhận, Đổi, Hủy) ──────────────────────────

    @Transactional
    public AppointmentResponse respondAppointment(UUID id, RespondAppointmentRequest req) {
        Appointment appointment = getAppointmentByIdForUpdate(id);
        User currentUser = checkUserAccess(appointment);
        User targetUser = currentUser.getId().equals(appointment.getProvider().getId())
                ? appointment.getReceiver() : appointment.getProvider();

        String action = req.getAction() != null ? req.getAction().trim().toUpperCase(Locale.ROOT) : "";

        if ("CONFIRM".equals(action)) {
            if (appointment.getStatus() != AppointmentStatus.PENDING && appointment.getStatus() != AppointmentStatus.RESCHEDULED) {
                throw new AppException(ErrorCode.APPOINTMENT_INVALID_STATUS);
            }
            if (LocalDateTime.of(appointment.getAppointmentDate(), appointment.getEndTime())
                    .isBefore(LocalDateTime.now())) {
                throw new AppException(ErrorCode.APPOINTMENT_INVALID_STATUS,
                        "Lịch hẹn đã quá giờ. Vui lòng đề xuất thời gian mới trước khi chấp nhận.");
            }
            if (appointment.getProposedBy() != null
                    && appointment.getProposedBy().getId().equals(currentUser.getId())) {
                throw new AppException(ErrorCode.ACCESS_DENIED, "Người tạo đề xuất không thể tự chấp nhận lịch hẹn.");
            }
            String currentLocation = appointment.getLocationOrLink();
            boolean needsOnlineLink = appointment.getMeetingType() == SessionFormat.ONLINE
                    && (isBlank(currentLocation) || !currentLocation.trim().matches("(?i)^https?://.+"));
            String locationOrLink = isBlank(currentLocation) || needsOnlineLink
                    ? req.getLocationOrLink() : currentLocation;
            validateMeetingDetails(appointment.getMeetingType(), locationOrLink);
            appointment.setLocationOrLink(locationOrLink.trim());
            appointment.setStatus(AppointmentStatus.CONFIRMED);
            appointment.setRescheduleProposedTime(null);
            // Wallet Hook: Tạm giữ Time Credit của receiver khi xác nhận lịch
            walletService.holdCredit(appointment.getReceiver(), appointment.getTimeCreditAmount(), appointment);
            notificationService.createNotification(targetUser, currentUser, NotificationType.APPOINTMENT_CONFIRMED,
                    "Lịch hẹn đã được xác nhận",
                    currentUser.getFullName() + " đã xác nhận lịch hẹn: " + appointment.getTitle(),
                    appointment.getId());
        } else if ("CANCEL".equals(action)) {
            if (!List.of(AppointmentStatus.PENDING, AppointmentStatus.RESCHEDULED,
                    AppointmentStatus.CONFIRMED, AppointmentStatus.UPCOMING).contains(appointment.getStatus())) {
                throw new AppException(ErrorCode.APPOINTMENT_INVALID_STATUS);
            }
            String cancelReason = req.getReason() != null ? req.getReason().trim() : "";
            if (cancelReason.isEmpty()) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "Vui lòng nhập lý do hủy lịch hẹn.");
            }
            if (cancelReason.length() > MAX_CANCEL_REASON_LENGTH) {
                throw new AppException(ErrorCode.INVALID_REQUEST,
                        "Lý do hủy không được vượt quá " + MAX_CANCEL_REASON_LENGTH + " ký tự.");
            }
            AppointmentStatus previousStatus = appointment.getStatus();
            appointment.setStatus(AppointmentStatus.CANCELLED);
            appointment.setCancelReason(cancelReason);
            // Wallet Hook: Hoàn trả Time Credit nếu trước đó đã CONFIRMED/UPCOMING/IN_PROGRESS (đã hold)
            if (previousStatus == AppointmentStatus.CONFIRMED
                    || previousStatus == AppointmentStatus.UPCOMING
                    || previousStatus == AppointmentStatus.IN_PROGRESS) {
                walletService.releaseCredit(appointment);
            }

            notificationService.createNotification(targetUser, currentUser, NotificationType.APPOINTMENT_CANCELLED,
                    "Lịch hẹn đã bị hủy",
                    currentUser.getFullName() + " đã hủy lịch hẹn. Lý do: " + cancelReason,
                    appointment.getId());
        } else if ("RESCHEDULE".equals(action)) {
            if (!List.of(AppointmentStatus.PENDING, AppointmentStatus.RESCHEDULED,
                    AppointmentStatus.CONFIRMED, AppointmentStatus.UPCOMING).contains(appointment.getStatus())) {
                throw new AppException(ErrorCode.APPOINTMENT_INVALID_STATUS);
            }
            if (req.getNewAppointmentDate() == null || req.getNewStartTime() == null || req.getNewEndTime() == null) {
                throw new AppException(ErrorCode.INVALID_REQUEST,
                        "Vui lòng cung cấp đầy đủ ngày, giờ bắt đầu và giờ kết thúc mới.");
            }
            validateSchedule(req.getNewAppointmentDate(), req.getNewStartTime(), req.getNewEndTime());
            AppointmentStatus previousStatus = appointment.getStatus();
            if (previousStatus == AppointmentStatus.CONFIRMED || previousStatus == AppointmentStatus.UPCOMING) {
                walletService.releaseCredit(appointment);
            }
            appointment.setAppointmentDate(req.getNewAppointmentDate());
            appointment.setStartTime(req.getNewStartTime());
            appointment.setEndTime(req.getNewEndTime());
            appointment.setStatus(AppointmentStatus.RESCHEDULED);
            appointment.setProposedBy(currentUser);
            appointment.setReminderSentAt(null);
            String proposedTime = req.getNewAppointmentDate() + " "
                    + req.getNewStartTime() + "-" + req.getNewEndTime();
            appointment.setRescheduleProposedTime(proposedTime);
            notificationService.createNotification(targetUser, currentUser, NotificationType.APPOINTMENT_RESCHEDULED,
                    "Đề xuất đổi thời gian lịch hẹn",
                    currentUser.getFullName() + " đề xuất đổi thời gian thành: " + proposedTime,
                    appointment.getId());
        } else {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        Appointment saved = appointmentRepository.save(appointment);
        AppointmentResponse response = AppointmentResponse.fromEntity(saved);
        updateAppointmentCardFailSoft(saved);
        return response;
    }

    // ─── 4. Xác nhận bằng QR hoặc OTP (9.14) ────────────────────────────────

    @Transactional
    public AppointmentVerificationResponse generateVerificationCode(UUID id) {
        Appointment appointment = getAppointmentByIdForUpdate(id);
        User currentUser = checkUserAccess(appointment);

        if (appointment.getStatus() != AppointmentStatus.CONFIRMED && appointment.getStatus() != AppointmentStatus.UPCOMING) {
            throw new AppException(ErrorCode.APPOINTMENT_INVALID_STATUS);
        }

        var existing = verificationRepository.findTopByAppointmentIdOrderByCreatedAtDesc(id);
        if (existing.isPresent() && existing.get().getVerifiedAt() == null
                && LocalDateTime.now().isBefore(existing.get().getExpiresAt())) {
            return AppointmentVerificationResponse.fromEntity(existing.get());
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
                .generatedBy(currentUser)
                .build();

        verification = verificationRepository.save(verification);
        log.info("Generated {} verification code for appointment ID [{}]", method, id);
        return AppointmentVerificationResponse.fromEntity(verification);
    }

    @Transactional
    public AppointmentResponse verifyCode(UUID id, VerifyCodeRequest req) {
        Appointment appointment = getAppointmentByIdForUpdate(id);
        User currentUser = checkUserAccess(appointment);

        if (appointment.getStatus() != AppointmentStatus.CONFIRMED
                && appointment.getStatus() != AppointmentStatus.UPCOMING) {
            throw new AppException(ErrorCode.APPOINTMENT_INVALID_STATUS);
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startAt = LocalDateTime.of(appointment.getAppointmentDate(), appointment.getStartTime());
        LocalDateTime endAt = LocalDateTime.of(appointment.getAppointmentDate(), appointment.getEndTime());
        if (now.isAfter(endAt)) {
            throw new AppException(ErrorCode.APPOINTMENT_INVALID_STATUS,
                    "Lịch hẹn đã quá thời gian diễn ra.");
        }
        if (now.isBefore(startAt) && !Boolean.TRUE.equals(req.getAllowEarlyStart())) {
            throw new AppException(ErrorCode.INVALID_REQUEST,
                    "Chưa tới giờ hẹn. Vui lòng xác nhận nếu hai bạn muốn bắt đầu sớm.");
        }

        AppointmentVerification verification = verificationRepository.findByAppointmentIdAndCode(id, req.getCode().trim())
                .orElseThrow(() -> new AppException(ErrorCode.VERIFICATION_INVALID));

        if (verification.getVerifiedAt() != null || LocalDateTime.now().isAfter(verification.getExpiresAt())) {
            throw new AppException(ErrorCode.VERIFICATION_INVALID);
        }
        if (verification.getGeneratedBy() != null
                && verification.getGeneratedBy().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED,
                    "Bạn không thể tự xác minh mã do chính mình tạo. Hãy để người còn lại quét hoặc nhập mã.");
        }

        verification.setVerifiedAt(LocalDateTime.now());
        verification.setVerifiedBy(currentUser);
        verificationRepository.save(verification);

        appointment.setStatus(AppointmentStatus.IN_PROGRESS);
        Appointment saved = appointmentRepository.save(appointment);

        User targetUser = currentUser.getId().equals(appointment.getProvider().getId())
                ? appointment.getReceiver() : appointment.getProvider();
        notificationService.createNotification(targetUser, currentUser, NotificationType.APPOINTMENT_CONFIRMED,
                "Buổi hỗ trợ đã bắt đầu",
                "Xác thực " + verification.getMethod() + " thành công. Buổi hỗ trợ bắt đầu diễn ra.",
                appointment.getId());

        log.info("Verified appointment ID [{}] successfully by user [{}]", id, currentUser.getEmail());
        AppointmentResponse response = AppointmentResponse.fromEntity(saved);
        updateAppointmentCardFailSoft(saved);
        return response;
    }

    // ─── 5. Xác nhận kết thúc và chuyển Time Credit (9.15) ──────────────────

    @Transactional
    public AppointmentResponse confirmCompletion(UUID id, ConfirmCompletionRequest req) {
        Appointment appointment = getAppointmentByIdForUpdate(id);
        User currentUser = checkUserAccess(appointment);

        if (appointment.getStatus() != AppointmentStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.APPOINTMENT_INVALID_STATUS);
        }

        if (Boolean.TRUE.equals(req.getHasIssue()) && isBlank(req.getIssueDescription())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Vui lòng mô tả vấn đề phát sinh.");
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

        if (Boolean.TRUE.equals(completion.getHasIssue())) {
            appointment.setStatus(AppointmentStatus.DISPUTED);
        } else {
            // Chỉ cần một trong hai người tham gia xác nhận hoàn thành không có vấn đề.
            appointment.setStatus(AppointmentStatus.COMPLETED);
            
            // Cập nhật số buổi hỗ trợ (hoàn thành) cho cả 2 user
            User provider = appointment.getProvider();
            provider.setCompletedSessions(provider.getCompletedSessions() + 1);
            userRepository.save(provider);
            ratingService.checkAndAwardBadges(provider);
            
            User receiver = appointment.getReceiver();
            receiver.setCompletedSessions(receiver.getCompletedSessions() + 1);
            userRepository.save(receiver);
            ratingService.checkAndAwardBadges(receiver);

            // Wallet Hook: Chuyển Time Credit từ Receiver sang Provider
            walletService.transferCredit(appointment);
            notificationService.createNotification(appointment.getProvider(), null, NotificationType.APPOINTMENT_COMPLETED,
                    "Buổi hỗ trợ hoàn thành!",
                    "Buổi hẹn " + appointment.getTitle() + " đã được xác nhận hoàn thành. Time Credit đã được chuyển.",
                    appointment.getId());
            notificationService.createNotification(appointment.getReceiver(), null, NotificationType.APPOINTMENT_COMPLETED,
                    "Buổi hỗ trợ hoàn thành!",
                    "Buổi hẹn " + appointment.getTitle() + " đã được xác nhận hoàn thành. Time Credit đã được chuyển.",
                    appointment.getId());
        }

        Appointment saved = appointmentRepository.save(appointment);
        AppointmentResponse response = AppointmentResponse.fromEntity(saved);
        if (saved.getStatus() == AppointmentStatus.COMPLETED
                || saved.getStatus() == AppointmentStatus.DISPUTED) {
            updateAppointmentCardFailSoft(saved);
        }
        return response;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Appointment getAppointmentById(UUID id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
    }

    private Appointment getAppointmentByIdForUpdate(UUID id) {
        return appointmentRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
    }

    private void validateInvitationForAppointment(Invitation invitation, User provider, User receiver) {
        if (invitation.getStatus() != InvitationStatus.ACCEPTED) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Chỉ có thể tạo lịch từ lời mời đã được chấp nhận.");
        }
        if (!invitation.getReceiver().getId().equals(provider.getId())
                || !invitation.getSender().getId().equals(receiver.getId())) {
            throw new AppException(ErrorCode.INVALID_REQUEST,
                    "Người hỗ trợ/người nhận không khớp với lời mời.");
        }
    }

    private void validateSchedule(LocalDate date, LocalTime startTime, LocalTime endTime) {
        if (date == null || startTime == null || endTime == null || !endTime.isAfter(startTime)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Giờ kết thúc phải sau giờ bắt đầu.");
        }
        if (LocalDateTime.of(date, endTime).isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Không thể tạo hoặc đổi sang lịch hẹn đã kết thúc.");
        }
    }

    private void validateMeetingDetails(SessionFormat meetingType, String locationOrLink) {
        if (meetingType == null || meetingType == SessionFormat.BOTH) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Vui lòng chọn hình thức ONLINE hoặc OFFLINE.");
        }
        if (isBlank(locationOrLink)) {
            String message = meetingType == SessionFormat.ONLINE
                    ? "Hình thức Online yêu cầu cung cấp link họp."
                    : "Hình thức Offline yêu cầu cung cấp địa điểm.";
            throw new AppException(ErrorCode.INVALID_REQUEST, message);
        }
        if (meetingType == SessionFormat.ONLINE
                && !locationOrLink.trim().matches("(?i)^https?://.+")) {
            throw new AppException(ErrorCode.INVALID_REQUEST,
                    "Link họp Online phải bắt đầu bằng http:// hoặc https://.");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private void updateAppointmentCardFailSoft(Appointment appointment) {
        try {
            chatService.updateAppointmentCardData(appointment.getId(), buildAppointmentCardData(appointment));
        } catch (Exception e) {
            log.warn("Failed to update chat appointment card for apt {}", appointment.getId(), e);
        }
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
}
