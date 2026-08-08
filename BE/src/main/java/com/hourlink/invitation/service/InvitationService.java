package com.hourlink.invitation.service;

import com.hourlink.appointment.entity.Appointment;
import com.hourlink.appointment.enums.AppointmentStatus;
import com.hourlink.appointment.repository.AppointmentRepository;
import com.hourlink.chat.service.ChatService;
import com.hourlink.chat.repository.UserBlockRepository;
import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.common.util.SecurityUtil;
import com.hourlink.helprequest.entity.HelpRequest;
import com.hourlink.helprequest.enums.RequestStatus;
import com.hourlink.helprequest.repository.HelpRequestRepository;
import com.hourlink.invitation.dto.request.InvitationRequest;
import com.hourlink.invitation.dto.request.RespondInvitationRequest;
import com.hourlink.invitation.dto.response.InvitationResponse;
import com.hourlink.invitation.entity.Invitation;
import com.hourlink.invitation.enums.InvitationStatus;
import com.hourlink.invitation.repository.InvitationRepository;
import com.hourlink.notification.enums.NotificationType;
import com.hourlink.notification.service.NotificationService;
import com.hourlink.skill.entity.Skill;
import com.hourlink.skill.enums.SkillStatus;
import com.hourlink.skill.repository.SkillRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * InvitationService — Business logic cho chức năng 9.9 Gửi lời mời hỗ trợ.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InvitationService {

    private static final List<AppointmentStatus> ACTIVE_APPOINTMENT_STATUSES = List.of(
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.UPCOMING,
            AppointmentStatus.IN_PROGRESS,
            AppointmentStatus.RESCHEDULED,
            AppointmentStatus.DISPUTED
    );

    private final InvitationRepository invitationRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final HelpRequestRepository helpRequestRepository;
    private final UserBlockRepository userBlockRepository;
    private final ChatService chatService;
    private final NotificationService notificationService;

    // ─── Gửi lời mời hỗ trợ ─────────────────────────────────────────────────

    /**
     * Người cần hỗ trợ (sender) gửi lời mời đến người có kỹ năng (receiver).
     */
    @Transactional
    public InvitationResponse sendInvitation(InvitationRequest request) {
        String senderEmail = SecurityUtil.getCurrentUserEmail();

        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Không được tự gửi lời mời cho chính mình
        if (sender.getId().equals(receiver.getId())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Không thể gửi lời mời cho chính mình.");
        }
        if (receiver.isLocked()) {
            throw new AppException(ErrorCode.ACCOUNT_LOCKED);
        }
        if (userBlockRepository.existsBlockBetween(sender.getId(), receiver.getId())) {
            throw new AppException(ErrorCode.USER_BLOCKED,
                    "Không thể gửi lời mời vì một trong hai tài khoản đã chặn người kia.");
        }

        // Kiểm tra trùng lời mời PENDING (theo skill nếu có, không thì theo receiver)
        if (request.getSkillId() != null) {
            boolean duplicated = invitationRepository.existsBySender_EmailAndReceiver_IdAndSkill_IdAndStatus(
                    senderEmail, request.getReceiverId(), request.getSkillId(), InvitationStatus.PENDING);
            if (duplicated) {
                throw new AppException(ErrorCode.INVITATION_ALREADY_RESPONDED);
            }
        } else {
            boolean duplicated = invitationRepository.existsBySender_EmailAndReceiver_IdAndStatus(
                    senderEmail, request.getReceiverId(), InvitationStatus.PENDING);
            if (duplicated) {
                throw new AppException(ErrorCode.INVITATION_ALREADY_RESPONDED);
            }
        }

        // Tìm kỹ năng liên quan (tùy chọn)
        Skill skill = null;
        if (request.getSkillId() != null) {
            skill = skillRepository.findById(request.getSkillId())
                    .orElseThrow(() -> new AppException(ErrorCode.SKILL_NOT_FOUND));
            if (!skill.getUser().getId().equals(receiver.getId())) {
                throw new AppException(ErrorCode.INVALID_REQUEST,
                        "Kỹ năng được chọn không thuộc người nhận lời mời.");
            }
            if (skill.getStatus() != SkillStatus.VISIBLE) {
                throw new AppException(ErrorCode.SKILL_ALREADY_INACTIVE);
            }
        }

        // Tìm HelpRequest liên kết (tùy chọn)
        HelpRequest helpRequest = null;
        if (request.getHelpRequestId() != null) {
            helpRequest = helpRequestRepository.findById(request.getHelpRequestId())
                    .orElseThrow(() -> new AppException(ErrorCode.REQUEST_NOT_FOUND));
            if (!helpRequest.getRequester().getId().equals(sender.getId())) {
                throw new AppException(ErrorCode.ACCESS_DENIED,
                        "Bạn chỉ có thể liên kết lời mời với yêu cầu hỗ trợ của mình.");
            }
            if (helpRequest.getStatus() != RequestStatus.SEARCHING) {
                throw new AppException(ErrorCode.INVALID_REQUEST,
                        "Yêu cầu hỗ trợ này không còn nhận lời mời mới.");
            }
        }

        Invitation invitation = Invitation.builder()
                .sender(sender)
                .receiver(receiver)
                .skill(skill)
                .helpRequest(helpRequest)
                .content(request.getContent().trim())
                .message(trimToNull(request.getMessage()))
                .proposedTime(trimToNull(request.getProposedTime()))
                .duration(request.getDuration())
                .format(request.getFormat())
                .status(InvitationStatus.PENDING)
                .build();

        Invitation saved = invitationRepository.save(invitation);
        log.info("Invitation sent: {} → {}", senderEmail, receiver.getEmail());

        // Gửi thông báo cho receiver
        String skillName = skill != null ? skill.getName() : "kỹ năng của bạn";
        notificationService.createNotification(
                receiver,
                sender,
                NotificationType.INVITATION_RECEIVED,
                "📩 Lời mời hỗ trợ mới",
                sender.getFullName() + " muốn bạn hỗ trợ về " + skillName,
                saved.getId()
        );

        return mapToResponse(saved);
    }

    // ─── Lấy danh sách lời mời ───────────────────────────────────────────────

    /** Lời mời tôi đã gửi */
    public List<InvitationResponse> getMySentInvitations() {
        String email = SecurityUtil.getCurrentUserEmail();
        return invitationRepository.findAllBySender_EmailOrderByCreatedAtDesc(email)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /** Lời mời tôi nhận được */
    public List<InvitationResponse> getMyReceivedInvitations() {
        String email = SecurityUtil.getCurrentUserEmail();
        return invitationRepository.findAllByReceiver_EmailOrderByCreatedAtDesc(email)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /** Chi tiết một lời mời */
    public InvitationResponse getInvitationDetail(UUID id) {
        String email = SecurityUtil.getCurrentUserEmail();
        Invitation inv = invitationRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVITATION_NOT_FOUND));

        // Chỉ cho phép sender hoặc receiver xem
        boolean isSender   = inv.getSender().getEmail().equals(email);
        boolean isReceiver = inv.getReceiver().getEmail().equals(email);
        if (!isSender && !isReceiver) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        return mapToResponse(inv);
    }

    // ─── Phản hồi lời mời (helper) ────────────────────────────────────────────

    /**
     * Receiver phản hồi lời mời PENDING; sender quyết định đề xuất RESCHEDULED.
     */
    @Transactional
    public InvitationResponse respondToInvitation(UUID id, RespondInvitationRequest request) {
        String email = SecurityUtil.getCurrentUserEmail();
        Invitation inv = invitationRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVITATION_NOT_FOUND));
        String action = request.getAction().trim().toUpperCase(Locale.ROOT);

        if (inv.getStatus() == InvitationStatus.PENDING) {
            if (!inv.getReceiver().getEmail().equals(email)) {
                throw new AppException(ErrorCode.ACCESS_DENIED);
            }
            respondToPendingInvitation(inv, request, action);
        } else if (inv.getStatus() == InvitationStatus.RESCHEDULED) {
            if (!inv.getSender().getEmail().equals(email)) {
                throw new AppException(ErrorCode.ACCESS_DENIED);
            }
            decideRescheduledInvitation(inv, action);
        } else {
            throw new AppException(ErrorCode.INVITATION_ALREADY_RESPONDED);
        }

        Invitation saved = invitationRepository.save(inv);

        // Chức năng 9.10: lời mời được chấp nhận → mở cuộc trò chuyện cho hai bên
        if (saved.getStatus() == InvitationStatus.ACCEPTED) {
            chatService.createConversationInternal(saved);
        }

        log.info("Invitation {} responded with action={} by {}", id, action, email);
        return mapToResponse(saved);
    }

    // ─── Hủy lời mời (sender) ─────────────────────────────────────────────────

    /**
     * Sender hủy lời mời đã gửi (chỉ được hủy khi PENDING hoặc RESCHEDULED).
     */
    @Transactional
    public InvitationResponse cancelInvitation(UUID id) {
        String email = SecurityUtil.getCurrentUserEmail();
        Invitation inv = invitationRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVITATION_NOT_FOUND));

        // Chỉ sender mới được hủy
        if (!inv.getSender().getEmail().equals(email)) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        // Chỉ hủy được khi PENDING hoặc RESCHEDULED
        if (inv.getStatus() != InvitationStatus.PENDING && inv.getStatus() != InvitationStatus.RESCHEDULED) {
            throw new AppException(ErrorCode.INVITATION_ALREADY_RESPONDED);
        }

        inv.setStatus(InvitationStatus.CANCELLED);
        Invitation saved = invitationRepository.save(inv);

        // Thông báo cho receiver
        notificationService.createNotification(
                inv.getReceiver(),
                inv.getSender(),
                NotificationType.INVITATION_CANCELLED,
                "🚫 Lời mời đã bị hủy",
                inv.getSender().getFullName() + " đã hủy lời mời hỗ trợ",
                saved.getId()
        );

        log.info("Invitation {} cancelled by sender {}", id, email);
        return mapToResponse(saved);
    }

    private void respondToPendingInvitation(Invitation inv, RespondInvitationRequest request, String action) {
        User sender = inv.getSender();
        User receiver = inv.getReceiver();
        String skillName = inv.getSkill() != null ? inv.getSkill().getName() : "kỹ năng";

        switch (action) {
            case "ACCEPT" -> {
                inv.setStatus(InvitationStatus.ACCEPTED);
                notificationService.createNotification(
                        sender, receiver, NotificationType.INVITATION_ACCEPTED,
                        "✅ Lời mời được chấp nhận",
                        receiver.getFullName() + " đã chấp nhận lời mời hỗ trợ về " + skillName,
                        inv.getId());
            }
            case "REJECT" -> {
                String reason = requireText(request.getRejectReason(), "Vui lòng nhập lý do từ chối.");
                inv.setStatus(InvitationStatus.REJECTED);
                inv.setRejectReason(reason);
                notificationService.createNotification(
                        sender, receiver, NotificationType.INVITATION_REJECTED,
                        "❌ Lời mời bị từ chối",
                        receiver.getFullName() + " đã từ chối lời mời về " + skillName + ": " + reason,
                        inv.getId());
            }
            case "RESCHEDULE" -> {
                String newTime = requireText(request.getRescheduleTime(),
                        "Vui lòng nhập thời gian đề xuất mới.");
                inv.setStatus(InvitationStatus.RESCHEDULED);
                inv.setRescheduleTime(newTime);
                notificationService.createNotification(
                        sender, receiver, NotificationType.INVITATION_RESCHEDULED,
                        "📅 Đề xuất đổi lịch",
                        receiver.getFullName() + " đề xuất đổi sang: " + newTime,
                        inv.getId());
            }
            default -> throw new AppException(ErrorCode.INVALID_REQUEST,
                    "Hành động này không hợp lệ với lời mời đang chờ phản hồi.");
        }
    }

    private void decideRescheduledInvitation(Invitation inv, String action) {
        User sender = inv.getSender();
        User receiver = inv.getReceiver();

        switch (action) {
            case "ACCEPT_RESCHEDULE" -> {
                String newTime = requireText(inv.getRescheduleTime(),
                        "Lời mời chưa có thời gian mới để xác nhận.");
                inv.setProposedTime(newTime);
                inv.setStatus(InvitationStatus.ACCEPTED);
                notificationService.createNotification(
                        receiver, sender, NotificationType.INVITATION_RESCHEDULE_ACCEPTED,
                        "✅ Thời gian mới đã được đồng ý",
                        sender.getFullName() + " đã đồng ý thời gian: " + newTime,
                        inv.getId());
            }
            case "REJECT_RESCHEDULE" -> {
                inv.setStatus(InvitationStatus.PENDING);
                inv.setRescheduleTime(null);
                notificationService.createNotification(
                        receiver, sender, NotificationType.INVITATION_RESCHEDULE_REJECTED,
                        "↩️ Vui lòng chọn thời gian khác",
                        sender.getFullName() + " chưa phù hợp với thời gian mới. Bạn có thể đề xuất lại.",
                        inv.getId());
            }
            default -> throw new AppException(ErrorCode.INVALID_REQUEST,
                    "Người gửi chỉ có thể đồng ý hoặc yêu cầu chọn lại thời gian mới.");
        }
    }

    private String requireText(String value, String message) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, message);
        }
        return normalized;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    // ─── Mapper ───────────────────────────────────────────────────────────────

    private InvitationResponse mapToResponse(Invitation inv) {
        Appointment activeAppointment = appointmentRepository
                .findFirstByInvitation_IdAndStatusInOrderByCreatedAtDesc(
                        inv.getId(), ACTIVE_APPOINTMENT_STATUSES)
                .orElse(null);

        return InvitationResponse.builder()
                .id(inv.getId())
                // Sender
                .senderId(inv.getSender().getId())
                .senderName(inv.getSender().getFullName())
                .senderAvatarUrl(inv.getSender().getAvatarUrl())
                // Receiver
                .receiverId(inv.getReceiver().getId())
                .receiverName(inv.getReceiver().getFullName())
                .receiverAvatarUrl(inv.getReceiver().getAvatarUrl())
                // Skill
                .skillId(inv.getSkill() != null ? inv.getSkill().getId() : null)
                .skillName(inv.getSkill() != null ? inv.getSkill().getName() : null)
                // HelpRequest
                .helpRequestId(inv.getHelpRequest() != null ? inv.getHelpRequest().getId() : null)
                .helpRequestTitle(inv.getHelpRequest() != null ? inv.getHelpRequest().getTitle() : null)
                // Nội dung
                .content(inv.getContent())
                .message(inv.getMessage())
                .proposedTime(inv.getProposedTime())
                .duration(inv.getDuration())
                .format(inv.getFormat())
                // Trạng thái
                .status(inv.getStatus())
                .rejectReason(inv.getRejectReason())
                .rescheduleTime(inv.getRescheduleTime())
                .activeAppointmentId(activeAppointment != null ? activeAppointment.getId() : null)
                .activeAppointmentStatus(activeAppointment != null ? activeAppointment.getStatus() : null)
                .canCreateAppointment(inv.getStatus() == InvitationStatus.ACCEPTED && activeAppointment == null)
                // Timestamps
                .createdAt(inv.getCreatedAt())
                .updatedAt(inv.getUpdatedAt())
                .build();
    }
}
