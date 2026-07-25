package com.hourlink.invitation.service;

import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.common.util.SecurityUtil;
import com.hourlink.helprequest.entity.HelpRequest;
import com.hourlink.helprequest.repository.HelpRequestRepository;
import com.hourlink.invitation.dto.request.InvitationRequest;
import com.hourlink.invitation.dto.request.RespondInvitationRequest;
import com.hourlink.invitation.dto.response.InvitationResponse;
import com.hourlink.invitation.entity.Invitation;
import com.hourlink.invitation.enums.InvitationStatus;
import com.hourlink.invitation.repository.InvitationRepository;
import com.hourlink.skill.entity.Skill;
import com.hourlink.skill.repository.SkillRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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

    private final InvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final HelpRequestRepository helpRequestRepository;

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
            throw new AppException(ErrorCode.INVALID_REQUEST);
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
        }

        // Tìm HelpRequest liên kết (tùy chọn)
        HelpRequest helpRequest = null;
        if (request.getHelpRequestId() != null) {
            helpRequest = helpRequestRepository.findById(request.getHelpRequestId())
                    .orElseThrow(() -> new AppException(ErrorCode.REQUEST_NOT_FOUND));
        }

        Invitation invitation = Invitation.builder()
                .sender(sender)
                .receiver(receiver)
                .skill(skill)
                .helpRequest(helpRequest)
                .content(request.getContent())
                .message(request.getMessage())
                .proposedTime(request.getProposedTime())
                .duration(request.getDuration())
                .format(request.getFormat())
                .status(InvitationStatus.PENDING)
                .build();

        Invitation saved = invitationRepository.save(invitation);
        log.info("Invitation sent: {} → {}", senderEmail, receiver.getEmail());
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
     * Helper phản hồi lời mời: ACCEPT, REJECT, RESCHEDULE.
     */
    @Transactional
    public InvitationResponse respondToInvitation(UUID id, RespondInvitationRequest request) {
        String email = SecurityUtil.getCurrentUserEmail();
        Invitation inv = invitationRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVITATION_NOT_FOUND));

        // Chỉ receiver mới được phản hồi
        if (!inv.getReceiver().getEmail().equals(email)) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        // Chỉ PENDING mới được phản hồi
        if (inv.getStatus() != InvitationStatus.PENDING) {
            throw new AppException(ErrorCode.INVITATION_ALREADY_RESPONDED);
        }

        switch (request.getAction().toUpperCase()) {
            case "ACCEPT" -> inv.setStatus(InvitationStatus.ACCEPTED);
            case "REJECT" -> {
                inv.setStatus(InvitationStatus.REJECTED);
                inv.setRejectReason(request.getRejectReason());
            }
            case "RESCHEDULE" -> {
                inv.setStatus(InvitationStatus.RESCHEDULED);
                inv.setRescheduleTime(request.getRescheduleTime());
            }
            default -> throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        Invitation saved = invitationRepository.save(inv);
        log.info("Invitation {} responded with action={} by {}", id, request.getAction(), email);
        return mapToResponse(saved);
    }

    // ─── Hủy lời mời (sender) ─────────────────────────────────────────────────

    /**
     * Sender hủy lời mời đã gửi (chỉ được hủy khi PENDING hoặc RESCHEDULED).
     */
    @Transactional
    public InvitationResponse cancelInvitation(UUID id) {
        String email = SecurityUtil.getCurrentUserEmail();
        Invitation inv = invitationRepository.findById(id)
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
        log.info("Invitation {} cancelled by sender {}", id, email);
        return mapToResponse(saved);
    }

    // ─── Mapper ───────────────────────────────────────────────────────────────

    private InvitationResponse mapToResponse(Invitation inv) {
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
                // Timestamps
                .createdAt(inv.getCreatedAt())
                .updatedAt(inv.getUpdatedAt())
                .build();
    }
}
