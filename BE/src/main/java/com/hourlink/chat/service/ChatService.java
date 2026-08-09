package com.hourlink.chat.service;

import com.hourlink.appointment.entity.Appointment;
import com.hourlink.appointment.enums.AppointmentStatus;
import com.hourlink.appointment.repository.AppointmentRepository;
import com.hourlink.chat.dto.request.BlockUserRequest;
import com.hourlink.chat.dto.request.ProposeRescheduleRequest;
import com.hourlink.chat.dto.request.ReportMessageRequest;
import com.hourlink.chat.dto.request.SendMessageRequest;
import com.hourlink.chat.dto.response.BlockedUserResponse;
import com.hourlink.chat.dto.response.ChatMessageResponse;
import com.hourlink.chat.dto.response.ChatReportResponse;
import com.hourlink.chat.dto.response.ConversationResponse;
import com.hourlink.chat.dto.response.FirebaseTokenResponse;
import com.hourlink.chat.entity.ChatMessage;
import com.hourlink.chat.entity.ChatReport;
import com.hourlink.chat.entity.Conversation;
import com.hourlink.chat.entity.UserBlock;
import com.hourlink.chat.enums.ChatReportStatus;
import com.hourlink.chat.enums.ConversationSourceType;
import com.hourlink.chat.enums.MessageType;
import com.hourlink.chat.repository.ChatMessageRepository;
import com.hourlink.chat.repository.ChatReportRepository;
import com.hourlink.chat.repository.ConversationRepository;
import com.hourlink.chat.repository.UserBlockRepository;
import com.hourlink.common.constant.AppConstants;
import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.common.response.PagedResponse;
import com.hourlink.common.service.CloudinaryService;
import com.hourlink.common.service.FirebaseService;
import com.hourlink.common.util.SecurityUtil;
import com.hourlink.community.entity.ActivityParticipant;
import com.hourlink.community.entity.CommunityActivity;
import com.hourlink.community.enums.ActivityParticipantStatus;
import com.hourlink.community.repository.ActivityParticipantRepository;
import com.hourlink.community.repository.CommunityActivityRepository;
import com.hourlink.invitation.entity.Invitation;
import com.hourlink.invitation.enums.InvitationStatus;
import com.hourlink.invitation.repository.InvitationRepository;
import com.hourlink.notification.enums.NotificationType;
import com.hourlink.notification.service.NotificationService;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/**
 * ChatService — Business logic cho chức năng 9.10 Chat.
 *
 * <p>Cuộc trò chuyện chỉ mở sau khi lời mời hỗ trợ được chấp nhận. Tin nhắn
 * được lưu vào MySQL (nguồn sự thật, làm bằng chứng khi xử lý tranh chấp ở
 * mục 9.23) rồi mirror sang Firestore để client nhận realtime.</p>
 *
 * <p>Lưu ý phụ thuộc: service này inject {@link InvitationRepository} chứ
 * <b>không</b> inject {@code InvitationService}, vì {@code InvitationService}
 * inject ngược lại {@code ChatService} để tạo hội thoại khi lời mời được
 * chấp nhận — giữ một chiều để tránh circular dependency.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

    private static final String CLOUDINARY_FOLDER = "chat_attachments";
    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024L; // 20MB

    private static final List<AppointmentStatus> ACTIVE_APPOINTMENT_STATUSES = List.of(
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.UPCOMING,
            AppointmentStatus.IN_PROGRESS,
            AppointmentStatus.RESCHEDULED,
            AppointmentStatus.DISPUTED
    );

    private static final List<String> ALLOWED_IMAGE_TYPES = List.of(
            "image/jpeg", "image/png", "image/gif", "image/webp");

    private static final List<String> ALLOWED_DOC_TYPES = List.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation");

    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserBlockRepository userBlockRepository;
    private final ChatReportRepository chatReportRepository;
    private final InvitationRepository invitationRepository;
    private final AppointmentRepository appointmentRepository;
    private final CommunityActivityRepository communityActivityRepository;
    private final ActivityParticipantRepository activityParticipantRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;
    private final FirebaseService firebaseService;
    private final NotificationService notificationService;

    // ─── Đăng nhập Firebase (realtime) ──────────────────────────────────────

    /**
     * Cấp Firebase Custom Token cho người dùng đang đăng nhập.
     * uid dùng chính UUID trong MySQL để Firestore Rules đối chiếu được
     * {@code request.auth.uid} với mảng {@code participants} của hội thoại.
     */
    public FirebaseTokenResponse createFirebaseToken() {
        String email = SecurityUtil.getCurrentUserEmail();
        User user = getUser(email);
        String uid = user.getId().toString();

        return FirebaseTokenResponse.builder()
                .enabled(firebaseService.isEnabled())
                .token(firebaseService.createCustomToken(uid, email))
                .uid(uid)
                .build();
    }

    // ─── Tạo cuộc trò chuyện ────────────────────────────────────────────────

    /**
     * Tạo cuộc trò chuyện từ một lời mời đã được chấp nhận (idempotent).
     * Được gọi tự động từ InvitationService khi receiver bấm ACCEPT, và cũng
     * gọi được từ FE qua endpoint riêng (nút "Nhắn tin").
     */
    @Transactional
    public ConversationResponse getOrCreateConversation(UUID invitationId) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new AppException(ErrorCode.INVITATION_NOT_FOUND));

        String email = SecurityUtil.getCurrentUserEmail();
        boolean isParticipant = invitation.getSender().getEmail().equals(email)
                || invitation.getReceiver().getEmail().equals(email);
        if (!isParticipant) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        Conversation conversation = createConversationInternal(invitation);
        return mapToConversationResponse(conversation, email);
    }

    /**
     * Phiên bản dùng nội bộ (không kiểm tra người đăng nhập) — InvitationService
     * gọi hàm này ngay trong luồng chấp nhận lời mời.
     */
    @Transactional
    public Conversation createConversationInternal(Invitation invitation) {
        // Chỉ mở chat khi lời mời đã được chấp nhận (hoặc đang thương lượng lại)
        if (invitation.getStatus() != InvitationStatus.ACCEPTED
                && invitation.getStatus() != InvitationStatus.RESCHEDULED) {
            throw new AppException(ErrorCode.CHAT_NOT_ALLOWED);
        }

        String pairKey = personalPairKey(invitation.getSender().getId(), invitation.getReceiver().getId());

        // Một cặp người chỉ có một chat cá nhân, kể cả khi đổi kỹ năng hoặc gửi
        // thêm lời mời sau khi buổi trước đã hoàn thành.
        Conversation existing = conversationRepository
                .findByPersonalPairKeyAndIsActiveTrue(pairKey)
                .orElseGet(() -> conversationRepository.findByInvitation_Id(invitation.getId())
                        .orElse(null));
        if (existing != null) {
            return reusePersonalConversation(existing, invitation, pairKey);
        }

        Conversation conversation = conversationRepository.save(Conversation.builder()
                .invitation(invitation)
                .sourceType(ConversationSourceType.SKILL_INVITATION)
                .personalPairKey(pairKey)
                .userOne(invitation.getSender())
                .userTwo(invitation.getReceiver())
                .isActive(true)
                .build());

        appendInvitationSystemMessage(conversation, invitation, false);
        log.info("Personal conversation {} created for pair {}", conversation.getId(), pairKey);
        return conversation;
    }

    private Conversation reusePersonalConversation(Conversation conversation, Invitation invitation,
                                                     String pairKey) {
        Invitation currentInvitation = conversation.getInvitation();
        boolean hasNewerContext = isNewerInvitation(invitation, currentInvitation);

        conversation.setSourceType(ConversationSourceType.SKILL_INVITATION);
        conversation.setPersonalPairKey(pairKey);
        conversation.setIsActive(true);
        // Có một lời mời mới thì đưa phòng đã ẩn trở lại danh sách cho cả hai.
        if (hasNewerContext) {
            conversation.setInvitation(invitation);
            conversation.setHiddenByUserOne(false);
            conversation.setHiddenByUserTwo(false);
        }
        conversationRepository.save(conversation);

        if (hasNewerContext) {
            appendInvitationSystemMessage(conversation, invitation, true);
        } else {
            mirrorConversation(conversation);
        }
        return conversation;
    }

    private void appendInvitationSystemMessage(Conversation conversation, Invitation invitation,
                                                boolean continuingConversation) {
        String skillName = invitation.getSkill() != null
                ? invitation.getSkill().getName() : "yêu cầu hỗ trợ";
        String content = continuingConversation
                ? "Lời mời mới về \"" + skillName
                        + "\" đã được chấp nhận. Hai bạn có thể tiếp tục trao đổi tại đây."
                : "Lời mời đã được chấp nhận. Hai bạn có thể trao đổi về \""
                        + skillName + "\" và thống nhất lịch hẹn.";
        ChatMessage systemMessage = chatMessageRepository.save(ChatMessage.builder()
                .conversation(conversation)
                .sender(null)
                .type(MessageType.SYSTEM)
                .content(content)
                .isRead(false)
                .build());

        conversation.setLastMessagePreview(truncate(content));
        conversation.setLastMessageType(MessageType.SYSTEM);
        conversation.setLastMessageAt(systemMessage.getCreatedAt() != null
                ? systemMessage.getCreatedAt() : Instant.now());
        conversationRepository.save(conversation);
        mirrorConversation(conversation);
        mirrorMessage(conversation, systemMessage);
    }

    private boolean isNewerInvitation(Invitation candidate, Invitation current) {
        if (current == null) return true;
        if (current.getId().equals(candidate.getId())) return false;
        if (current.getCreatedAt() == null) return candidate.getCreatedAt() != null;
        return candidate.getCreatedAt() != null
                && candidate.getCreatedAt().isAfter(current.getCreatedAt());
    }

    /**
     * Hợp nhất dữ liệu cũ: giữ phòng cá nhân đầu tiên làm phòng chính, chuyển
     * toàn bộ tin nhắn sang đó và lưu trữ các phòng trùng. Không xóa lời mời,
     * tin nhắn hay bằng chứng báo cáo.
     *
     * @return số phòng trùng đã được lưu trữ
     */
    @Transactional
    public int consolidateDuplicatePersonalConversations() {
        List<Conversation> activePersonal = conversationRepository
                .findAllActiveBySourceType(ConversationSourceType.SKILL_INVITATION);
        Map<String, List<Conversation>> grouped = new HashMap<>();
        activePersonal.forEach(conversation -> grouped
                .computeIfAbsent(personalPairKey(
                        conversation.getUserOne().getId(), conversation.getUserTwo().getId()),
                        ignored -> new ArrayList<>())
                .add(conversation));

        int archivedCount = 0;
        for (Map.Entry<String, List<Conversation>> entry : grouped.entrySet()) {
            String pairKey = entry.getKey();
            List<Conversation> group = entry.getValue();
            Conversation canonical = group.stream()
                    .filter(c -> pairKey.equals(c.getPersonalPairKey()))
                    .findFirst()
                    .orElseGet(() -> group.stream()
                            .min(Comparator.comparing(this::conversationCreatedAt))
                            .orElseThrow());

            if (group.size() == 1) {
                if (!Objects.equals(canonical.getPersonalPairKey(), pairKey)) {
                    canonical.setPersonalPairKey(pairKey);
                    conversationRepository.save(canonical);
                    mirrorConversation(canonical);
                }
                continue;
            }

            Invitation newestInvitation = group.stream()
                    .filter(c -> c.getInvitation() != null)
                    .max(Comparator.comparing(this::invitationContextAt))
                    .map(Conversation::getInvitation)
                    .orElse(null);
            Conversation newestSummary = group.stream()
                    .max(Comparator.comparing(this::conversationActivityAt))
                    .orElse(canonical);
            boolean hiddenByUserOne = group.stream().allMatch(c ->
                    isHiddenFor(c, canonical.getUserOne().getId()));
            boolean hiddenByUserTwo = group.stream().allMatch(c ->
                    isHiddenFor(c, canonical.getUserTwo().getId()));

            List<Conversation> duplicates = group.stream()
                    .filter(c -> !c.getId().equals(canonical.getId()))
                    .toList();
            List<UUID> duplicateIds = duplicates.stream().map(Conversation::getId).toList();
            chatMessageRepository.moveToConversation(canonical, duplicateIds);

            // Giải phóng hai khóa unique trước khi gắn context mới vào canonical.
            group.forEach(c -> {
                c.setInvitation(null);
                c.setPersonalPairKey(null);
            });
            duplicates.forEach(c -> {
                c.setIsActive(false);
                c.setHiddenByUserOne(true);
                c.setHiddenByUserTwo(true);
            });
            conversationRepository.saveAll(group);
            conversationRepository.flush();

            canonical.setInvitation(newestInvitation);
            canonical.setPersonalPairKey(pairKey);
            canonical.setIsActive(true);
            canonical.setHiddenByUserOne(hiddenByUserOne);
            canonical.setHiddenByUserTwo(hiddenByUserTwo);
            canonical.setLastMessagePreview(newestSummary.getLastMessagePreview());
            canonical.setLastMessageType(newestSummary.getLastMessageType());
            canonical.setLastMessageAt(newestSummary.getLastMessageAt());
            conversationRepository.save(canonical);

            if (firebaseService.isEnabled()) {
                chatMessageRepository.findAllByConversation_IdOrderByCreatedAtAsc(canonical.getId())
                        .forEach(message -> mirrorMessage(canonical, message));
                duplicates.forEach(this::mirrorConversation);
            }
            mirrorConversation(canonical);
            archivedCount += duplicates.size();
            log.info("Merged {} duplicate personal conversations into {} for pair {}",
                    duplicates.size(), canonical.getId(), pairKey);
        }
        return archivedCount;
    }

    /**
     * Mở hội thoại giữa người đã đăng ký hoạt động và tổ chức (idempotent).
     * userOne luôn là tổ chức, userTwo luôn là người tham gia để khóa duy nhất
     * theo (activity, participant) ở cả ứng dụng lẫn cơ sở dữ liệu.
     */
    @Transactional
    public ConversationResponse getOrCreateCommunityConversation(UUID activityId) {
        String email = SecurityUtil.getCurrentUserEmail();
        User participantUser = getUser(email);
        CommunityActivity activity = communityActivityRepository.findByIdForUpdate(activityId)
                .orElseThrow(() -> new AppException(ErrorCode.ACTIVITY_NOT_FOUND));

        if (activity.getOrganizer().getId().equals(participantUser.getId())) {
            throw new AppException(ErrorCode.COMMUNITY_CHAT_NOT_ALLOWED);
        }

        ActivityParticipant participant = activityParticipantRepository
                .findByActivityIdAndUserId(activityId, participantUser.getId())
                .filter(p -> p.getStatus() != ActivityParticipantStatus.CANCELLED)
                .orElseThrow(() -> new AppException(ErrorCode.COMMUNITY_CHAT_NOT_ALLOWED));

        Conversation conversation = conversationRepository
                .findByCommunityActivity_IdAndUserTwo_Id(activityId, participantUser.getId())
                .orElseGet(() -> createCommunityConversation(activity, participant));
        return mapToConversationResponse(conversation, email);
    }

    private Conversation createCommunityConversation(CommunityActivity activity,
                                                       ActivityParticipant participant) {
        Conversation conv = conversationRepository.save(Conversation.builder()
                .communityActivity(activity)
                .sourceType(ConversationSourceType.COMMUNITY_ACTIVITY)
                .userOne(activity.getOrganizer())
                .userTwo(participant.getUser())
                .isActive(true)
                .build());

        ChatMessage systemMsg = chatMessageRepository.save(ChatMessage.builder()
                .conversation(conv)
                .sender(null)
                .type(MessageType.SYSTEM)
                .content("Bạn đã đăng ký hoạt động \"" + activity.getTitle()
                        + "\". Bạn có thể trao đổi trực tiếp với tổ chức tại đây.")
                .isRead(false)
                .build());

        conv.setLastMessagePreview(truncate(systemMsg.getContent()));
        conv.setLastMessageType(MessageType.SYSTEM);
        conv.setLastMessageAt(Instant.now());
        conversationRepository.save(conv);

        mirrorConversation(conv);
        mirrorMessage(conv, systemMsg);
        log.info("Community conversation created for activity {} and participant {}",
                activity.getId(), participant.getUser().getId());
        return conv;
    }

    // ─── Đọc danh sách / chi tiết ───────────────────────────────────────────

    /** Danh sách cuộc trò chuyện của tôi, mới nhất trước */
    public List<ConversationResponse> getMyConversations() {
        String email = SecurityUtil.getCurrentUserEmail();
        return conversationRepository.findAllByParticipantEmail(email)
                .stream()
                .filter(c -> {
                    if (c.getUserOne().getEmail().equals(email)) return !c.isHiddenByUserOne();
                    return !c.isHiddenByUserTwo();
                })
                .map(c -> mapToConversationResponse(c, email))
                .toList();
    }

    /** Chi tiết một cuộc trò chuyện */
    public ConversationResponse getConversationDetail(UUID conversationId) {
        String email = SecurityUtil.getCurrentUserEmail();
        Conversation conv = requireParticipant(conversationId, email);
        return mapToConversationResponse(conv, email);
    }

    /** Lịch sử tin nhắn (phân trang, mới nhất trước) */
    public PagedResponse<ChatMessageResponse> getMessages(UUID conversationId, int page, int size) {
        String email = SecurityUtil.getCurrentUserEmail();
        Conversation conv = requireParticipant(conversationId, email);

        int safeSize = Math.min(Math.max(size, 1), AppConstants.MAX_PAGE_SIZE);
        Page<ChatMessage> result = chatMessageRepository
                .findAllByConversation_IdOrderByCreatedAtDesc(
                        conv.getId(), PageRequest.of(Math.max(page, 0), safeSize));

        // Lọc bỏ các tin nhắn mà user hiện tại đã chọn "Xóa phía tôi"
        List<ChatMessageResponse> filteredMessages = result.getContent().stream()
                .filter(msg -> {
                    if (msg.getSender() != null && msg.getSender().getEmail().equals(email)) {
                        return !msg.isHiddenBySender();
                    } else {
                        return !msg.isHiddenByReceiver();
                    }
                })
                .map(msg -> {
                    ChatMessageResponse res = mapToMessageResponse(msg);
                    if (msg.isRecalled()) {
                        res.setContent("Tin nhắn đã bị thu hồi");
                        res.setAttachmentUrl(null);
                        // Giữ nguyên các type hoặc set về một dạng khác nếu client cần
                        // FE có thể check flag isRecalled nếu ta map nó vào DTO
                    }
                    return res;
                })
                .toList();

        return PagedResponse.<ChatMessageResponse>builder()
                .content(filteredMessages)
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements()) // Lưu ý: totalElements vẫn tính tin nhắn ẩn, nhưng UI thường không quan tâm pagination chính xác tới từng msg
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    /** Tổng số tin nhắn chưa đọc — dùng cho badge */
    public long getTotalUnreadCount() {
        return chatMessageRepository.countTotalUnread(SecurityUtil.getCurrentUserEmail());
    }

    // ─── Gửi tin nhắn ───────────────────────────────────────────────────────

    /** Gửi tin nhắn TEXT / LOCATION / MEETING_LINK */
    @Transactional
    public ChatMessageResponse sendMessage(UUID conversationId, SendMessageRequest request) {
        String email = SecurityUtil.getCurrentUserEmail();
        Conversation conv = requireParticipant(conversationId, email);
        User sender = getUser(email);
        User receiver = otherUserOf(conv, email);

        requireNotBlocked(sender, receiver);

        ChatMessage.ChatMessageBuilder builder = ChatMessage.builder()
                .conversation(conv)
                .sender(sender)
                .type(request.getType())
                .isRead(false);

        String preview;
        switch (request.getType()) {
            case TEXT -> {
                if (isBlank(request.getContent())) {
                    throw new AppException(ErrorCode.INVALID_REQUEST);
                }
                builder.content(request.getContent().trim());
                preview = request.getContent().trim();
            }
            case MEETING_LINK -> {
                if (isBlank(request.getMeetingLink())) {
                    throw new AppException(ErrorCode.INVALID_REQUEST);
                }
                builder.meetingLink(request.getMeetingLink().trim())
                        .content(request.getContent());
                preview = "🔗 Link phòng họp";
            }
            case LOCATION -> {
                if (request.getLatitude() == null || request.getLongitude() == null) {
                    throw new AppException(ErrorCode.INVALID_REQUEST);
                }
                builder.latitude(request.getLatitude())
                        .longitude(request.getLongitude())
                        .locationLabel(request.getLocationLabel());
                preview = "📍 " + (isBlank(request.getLocationLabel())
                        ? "Vị trí được chia sẻ" : request.getLocationLabel());
            }
            // IMAGE/DOCUMENT đi qua endpoint multipart; SYSTEM/RESCHEDULE do hệ thống sinh
            default -> throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        ChatMessage saved = chatMessageRepository.save(builder.build());
        afterMessageSent(conv, saved, sender, receiver, preview);
        return mapToMessageResponse(saved);
    }

    /** Gửi ảnh hoặc tài liệu */
    @Transactional
    public ChatMessageResponse sendAttachment(UUID conversationId, MultipartFile file, String caption) {
        String email = SecurityUtil.getCurrentUserEmail();
        Conversation conv = requireParticipant(conversationId, email);
        User sender = getUser(email);
        User receiver = otherUserOf(conv, email);

        requireNotBlocked(sender, receiver);
        boolean isImage = validateFile(file);

        try {
            Map<String, Object> uploadResult = cloudinaryService.uploadFile(file, CLOUDINARY_FOLDER);

            ChatMessage saved = chatMessageRepository.save(ChatMessage.builder()
                    .conversation(conv)
                    .sender(sender)
                    .type(isImage ? MessageType.IMAGE : MessageType.DOCUMENT)
                    .content(caption)
                    .attachmentUrl((String) uploadResult.get("secure_url"))
                    .publicId((String) uploadResult.get("public_id"))
                    .originalName(file.getOriginalFilename())
                    .fileSize(file.getSize())
                    .isRead(false)
                    .build());

            String preview = isImage ? "🖼️ Hình ảnh" : "📄 " + file.getOriginalFilename();
            afterMessageSent(conv, saved, sender, receiver, preview);
            return mapToMessageResponse(saved);

        } catch (IOException e) {
            log.error("Upload đính kèm chat thất bại: {}", e.getMessage());
            throw new AppException(ErrorCode.UPLOAD_FAILED);
        }
    }

    /**
     * Đề xuất đổi lịch ngay trong cuộc trò chuyện.
     * Đây là tin nhắn thương lượng. Trạng thái Invitation/Appointment chỉ được
     * thay đổi qua workflow tương ứng để không làm một lời mời ACCEPTED bị kẹt.
     */
    @Transactional
    public ChatMessageResponse proposeReschedule(UUID conversationId, ProposeRescheduleRequest request) {
        String email = SecurityUtil.getCurrentUserEmail();
        Conversation conv = requireParticipant(conversationId, email);
        User sender = getUser(email);
        User receiver = otherUserOf(conv, email);

        requireNotBlocked(sender, receiver);

        if (conv.getInvitation() == null) {
            throw new AppException(ErrorCode.CHAT_NOT_ALLOWED);
        }

        ChatMessage saved = chatMessageRepository.save(ChatMessage.builder()
                .conversation(conv)
                .sender(sender)
                .type(MessageType.RESCHEDULE_PROPOSAL)
                .proposedTime(request.getProposedTime())
                .content(request.getNote())
                .isRead(false)
                .build());

        conv.setLastMessagePreview(truncate("📅 Đề xuất đổi lịch: " + request.getProposedTime()));
        conv.setLastMessageType(MessageType.RESCHEDULE_PROPOSAL);
        conv.setLastMessageAt(saved.getCreatedAt() != null ? saved.getCreatedAt() : Instant.now());
        conversationRepository.save(conv);

        mirrorConversation(conv);
        mirrorMessage(conv, saved);
        mirrorUnread(conv, receiver);

        notificationService.createNotification(receiver, sender, NotificationType.CHAT_RESCHEDULE_PROPOSED,
                "📅 Đề xuất đổi lịch",
                sender.getFullName() + " đề xuất thời gian mới: " + request.getProposedTime(),
                conv.getId());

        log.info("Reschedule proposed in conversation {} by {}", conv.getId(), email);
        return mapToMessageResponse(saved);
    }

    /**
     * Gửi card lịch hẹn vào cuộc trò chuyện (được AppointmentService gọi sau khi tạo lịch).
     * Không yêu cầu người dùng đăng nhập — gọi nội bộ từ AppointmentService.
     */
    @Transactional
    public void sendAppointmentCardInternal(UUID conversationId, UUID appointmentId, String appointmentData,
                                            User sender) {
        if (conversationId == null) return;
        Conversation conv = conversationRepository.findById(conversationId)
                .orElse(null);
        if (conv == null) return;
        if (conv.getInvitation() == null) return;

        User receiver = otherUserOf(conv, sender.getEmail());

        ChatMessage saved = chatMessageRepository.save(ChatMessage.builder()
                .conversation(conv)
                .sender(sender)
                .type(MessageType.APPOINTMENT_CARD)
                .content("📅 Lịch hẹn mới được đề xuất")
                .appointmentId(appointmentId)
                .appointmentData(appointmentData)
                .isRead(false)
                .build());

        conv.setLastMessagePreview(truncate("📅 Đề xuất lịch hẹn mới"));
        conv.setLastMessageType(MessageType.APPOINTMENT_CARD);
        conv.setLastMessageAt(saved.getCreatedAt() != null ? saved.getCreatedAt() : Instant.now());
        conversationRepository.save(conv);

        mirrorConversation(conv);
        mirrorMessage(conv, saved);
        mirrorUnread(conv, receiver);

        log.info("Appointment card sent to conversation {} for appointment {}", conversationId, appointmentId);
    }

    /**
     * Cập nhật dữ liệu thẻ lịch hẹn (được AppointmentService gọi khi trạng thái lịch đổi).
     * Bắn cập nhật lên Firebase để app realtime cập nhật.
     */
    @Transactional
    public void updateAppointmentCardData(UUID appointmentId, String newAptData) {
        List<ChatMessage> cards = chatMessageRepository.findAllByAppointmentId(appointmentId);
        cards.forEach(card -> card.setAppointmentData(newAptData));
        chatMessageRepository.saveAll(cards);
        cards.forEach(card -> mirrorMessage(card.getConversation(), card));
        if (!cards.isEmpty()) {
            log.info("Updated appointment card data for appointment {} ({} messages)", appointmentId, cards.size());
        }
    }

    /**
     * Tìm cuộc trò chuyện giữa hai người dùng bất kỳ.
     */
    public UUID findConversationIdByUsers(UUID userId1, UUID userId2) {
        return conversationRepository
                .findByPersonalPairKeyAndIsActiveTrue(personalPairKey(userId1, userId2))
                .map(Conversation::getId)
                .orElse(null);
    }

    /**
     * Mọi lời mời của cùng một cặp người đều trỏ về phòng cá nhân chính.
     * Nhờ vậy tạo buổi học tiếp theo không sinh thêm một hàng chat.
     */
    public UUID findConversationIdByInvitation(UUID invitationId) {
        return conversationRepository.findByInvitation_Id(invitationId)
                .map(this::resolveCanonicalConversation)
                .map(Conversation::getId)
                .orElseGet(() -> invitationRepository.findById(invitationId)
                        .flatMap(invitation -> conversationRepository
                                .findByPersonalPairKeyAndIsActiveTrue(personalPairKey(
                                        invitation.getSender().getId(), invitation.getReceiver().getId())))
                        .map(Conversation::getId)
                        .orElse(null));
    }

    /** Đánh dấu toàn bộ tin nhắn của người kia là đã đọc */
    @Transactional
    public void markAsRead(UUID conversationId) {
        String email = SecurityUtil.getCurrentUserEmail();
        Conversation conv = requireParticipant(conversationId, email);

        int updated = chatMessageRepository.markAllReadInConversation(conv.getId(), email);
        if (updated > 0) {
            mirrorUnread(conv, getUser(email));
            log.info("Marked {} messages as read in conversation {}", updated, conv.getId());
        }
    }

    // ─── Báo cáo tin nhắn ───────────────────────────────────────────────────

    @Transactional
    public ChatReportResponse reportMessage(UUID messageId, ReportMessageRequest request) {
        String email = SecurityUtil.getCurrentUserEmail();
        User reporter = getUser(email);

        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new AppException(ErrorCode.MESSAGE_NOT_FOUND));

        // Chỉ người trong cuộc mới báo cáo được
        Conversation conv = message.getConversation();
        if (!isParticipant(conv, email)) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        // Không báo cáo tin hệ thống hoặc tin của chính mình
        if (message.getSender() == null || message.getSender().getEmail().equals(email)) {
            throw new AppException(ErrorCode.CANNOT_REPORT_OWN_MESSAGE);
        }

        if (chatReportRepository.existsByReporter_EmailAndMessage_Id(email, messageId)) {
            throw new AppException(ErrorCode.MESSAGE_ALREADY_REPORTED);
        }

        ChatReport report = chatReportRepository.save(ChatReport.builder()
                .reporter(reporter)
                .reportedUser(message.getSender())
                .message(message)
                .reason(request.getReason())
                .description(request.getDescription())
                .messageSnapshot(snapshotOf(message))
                .status(ChatReportStatus.PENDING)
                .build());

        log.info("Message {} reported by {} — reason {}", messageId, email, request.getReason());

        return toChatReportResponse(report);
    }

    public List<ChatReportResponse> getMyMessageReports() {
        String email = SecurityUtil.getCurrentUserEmail();
        return chatReportRepository.findAllByReporter_EmailOrderByCreatedAtDesc(email)
                .stream().map(this::toChatReportResponse).toList();
    }

    public ChatReportResponse getMyMessageReport(UUID reportId) {
        String email = SecurityUtil.getCurrentUserEmail();
        ChatReport report = chatReportRepository.findByIdAndReporter_Email(reportId, email)
                .orElseThrow(() -> new AppException(ErrorCode.REPORT_NOT_FOUND));
        return toChatReportResponse(report);
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public List<ChatReportResponse> getAllMessageReports() {
        return chatReportRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toChatReportResponse).toList();
    }

    @Transactional
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ChatReportResponse updateMessageReportStatus(UUID reportId, ChatReportStatus status) {
        ChatReport report = chatReportRepository.findById(reportId)
                .orElseThrow(() -> new AppException(ErrorCode.REPORT_NOT_FOUND));
        report.setStatus(status);
        return toChatReportResponse(chatReportRepository.save(report));
    }

    private ChatReportResponse toChatReportResponse(ChatReport report) {
        ChatMessage message = report.getMessage();
        return ChatReportResponse.builder()
                .id(report.getId())
                .messageId(message.getId())
                .reportedUserId(report.getReportedUser().getId())
                .reportedUserName(report.getReportedUser().getFullName())
                .reason(report.getReason())
                .description(report.getDescription())
                .evidence(report.getMessageSnapshot())
                .status(report.getStatus())
                .createdAt(report.getCreatedAt())
                .build();
    }

    // ─── Chặn người dùng ────────────────────────────────────────────────────

    @Transactional
    public BlockedUserResponse blockUser(BlockUserRequest request) {
        String email = SecurityUtil.getCurrentUserEmail();
        User blocker = getUser(email);
        User blocked = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (blocker.getId().equals(blocked.getId())) {
            throw new AppException(ErrorCode.CANNOT_BLOCK_SELF);
        }
        if (userBlockRepository.existsByBlocker_IdAndBlocked_Id(blocker.getId(), blocked.getId())) {
            throw new AppException(ErrorCode.ALREADY_BLOCKED);
        }

        UserBlock block = userBlockRepository.save(UserBlock.builder()
                .blocker(blocker)
                .blocked(blocked)
                .reason(request.getReason())
                .build());

        syncBlockFlag(blocker, blocked, true);
        log.info("User {} blocked {}", email, blocked.getEmail());

        return mapToBlockedResponse(block);
    }

    @Transactional
    public void unblockUser(UUID userId) {
        String email = SecurityUtil.getCurrentUserEmail();
        User blocker = getUser(email);

        UserBlock block = userBlockRepository.findByBlocker_IdAndBlocked_Id(blocker.getId(), userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_BLOCKED));

        User blocked = block.getBlocked();
        userBlockRepository.delete(block);

        // Chỉ bỏ cờ chặn khi không còn chiều nào chặn nữa
        if (!userBlockRepository.existsBlockBetween(blocker.getId(), userId)) {
            syncBlockFlag(blocker, blocked, false);
        }
        log.info("User {} unblocked {}", email, userId);
    }

    /** Danh sách người tôi đã chặn */
    public List<BlockedUserResponse> getBlockedUsers() {
        String email = SecurityUtil.getCurrentUserEmail();
        return userBlockRepository.findAllByBlocker_EmailOrderByCreatedAtDesc(email)
                .stream().map(this::mapToBlockedResponse).toList();
    }

    // ─── Xóa / Thu hồi / Ẩn (9.10 nâng cao) ────────────────────────────────

    @Transactional
    public void recallMessage(UUID messageId) {
        String email = SecurityUtil.getCurrentUserEmail();
        ChatMessage msg = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Tin nhắn không tồn tại"));

        if (msg.getSender() == null || !msg.getSender().getEmail().equals(email)) {
            throw new AppException(ErrorCode.ACCESS_DENIED, "Chỉ người gửi mới có thể thu hồi tin nhắn");
        }
        
        // Chỉ cho thu hồi trong vòng 10 phút
        if (msg.getCreatedAt().plus(java.time.Duration.ofMinutes(10)).isBefore(Instant.now())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Đã quá thời gian thu hồi tin nhắn (10 phút)");
        }

        msg.setRecalled(true);
        // Không xóa content gốc để admin xem lại nếu có dispute, chỉ ẩn ở UI
        chatMessageRepository.save(msg);

        if (firebaseService.isEnabled()) {
            mirrorMessage(msg.getConversation(), msg); // Push cập nhật qua Firebase
        }
        log.info("Message {} recalled by {}", messageId, email);
    }

    @Transactional
    public void deleteMessageForMe(UUID messageId) {
        String email = SecurityUtil.getCurrentUserEmail();
        ChatMessage msg = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Tin nhắn không tồn tại"));
        
        // Kiểm tra xem user đang gọi là sender hay receiver
        if (msg.getSender() != null && msg.getSender().getEmail().equals(email)) {
            msg.setHiddenBySender(true);
        } else {
            // Nếu không phải sender thì kiểm tra receiver (user còn lại trong hội thoại)
            Conversation conv = msg.getConversation();
            User otherUser = otherUserOf(conv, msg.getSender() != null ? msg.getSender().getEmail() : "");
            if (otherUser != null && otherUser.getEmail().equals(email)) {
                msg.setHiddenByReceiver(true);
            } else if (isParticipant(conv, email)) {
                 msg.setHiddenByReceiver(true); // Tin nhắn hệ thống (sender=null)
            } else {
                 throw new AppException(ErrorCode.ACCESS_DENIED);
            }
        }
        chatMessageRepository.save(msg);
        log.info("Message {} hidden by {}", messageId, email);
    }

    @Transactional
    public void hideConversation(UUID conversationId) {
        String email = SecurityUtil.getCurrentUserEmail();
        Conversation conv = requireParticipant(conversationId, email);

        if (conv.getUserOne().getEmail().equals(email)) {
            conv.setHiddenByUserOne(true);
        } else {
            conv.setHiddenByUserTwo(true);
        }
        conversationRepository.save(conv);
        log.info("Conversation {} hidden by {}", conversationId, email);
    }

    // ─── Helper nghiệp vụ ───────────────────────────────────────────────────

    /** Sau khi lưu tin nhắn: cập nhật hội thoại, mirror Firestore, tạo thông báo */
    private void afterMessageSent(Conversation conv, ChatMessage msg,
                                  User sender, User receiver, String preview) {
        conv.setLastMessagePreview(truncate(preview));
        conv.setLastMessageType(msg.getType());
        conv.setLastMessageAt(msg.getCreatedAt() != null ? msg.getCreatedAt() : Instant.now());
        conversationRepository.save(conv);

        mirrorConversation(conv);
        mirrorMessage(conv, msg);
        mirrorUnread(conv, receiver);

        notificationService.createNotification(receiver, sender, NotificationType.NEW_MESSAGE,
                "💬 Tin nhắn mới từ " + sender.getFullName(),
                truncate(preview), conv.getId());
    }

    private Conversation requireParticipant(UUID conversationId, String email) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
        if (!isParticipant(conv, email)) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        return resolveCanonicalConversation(conv);
    }

    private Conversation resolveCanonicalConversation(Conversation conversation) {
        if (sourceTypeOf(conversation) == ConversationSourceType.COMMUNITY_ACTIVITY) {
            return conversation;
        }
        String pairKey = personalPairKey(
                conversation.getUserOne().getId(), conversation.getUserTwo().getId());
        return conversationRepository.findByPersonalPairKeyAndIsActiveTrue(pairKey)
                .orElse(conversation);
    }

    private boolean isParticipant(Conversation conv, String email) {
        return conv.getUserOne().getEmail().equals(email)
                || conv.getUserTwo().getEmail().equals(email);
    }

    private User otherUserOf(Conversation conv, String email) {
        return conv.getUserOne().getEmail().equals(email) ? conv.getUserTwo() : conv.getUserOne();
    }

    static String personalPairKey(UUID userId1, UUID userId2) {
        String first = userId1.toString();
        String second = userId2.toString();
        return first.compareTo(second) <= 0
                ? first + ":" + second
                : second + ":" + first;
    }

    private Instant conversationCreatedAt(Conversation conversation) {
        return conversation.getCreatedAt() != null ? conversation.getCreatedAt() : Instant.EPOCH;
    }

    private Instant conversationActivityAt(Conversation conversation) {
        return conversation.getLastMessageAt() != null
                ? conversation.getLastMessageAt() : conversationCreatedAt(conversation);
    }

    private Instant invitationContextAt(Conversation conversation) {
        Invitation invitation = conversation.getInvitation();
        if (invitation != null && invitation.getCreatedAt() != null) {
            return invitation.getCreatedAt();
        }
        return conversationCreatedAt(conversation);
    }

    private boolean isHiddenFor(Conversation conversation, UUID userId) {
        if (conversation.getUserOne().getId().equals(userId)) {
            return conversation.isHiddenByUserOne();
        }
        return conversation.isHiddenByUserTwo();
    }

    /** Chặn có hiệu lực hai chiều: một bên chặn thì cả hai đều không gửi được */
    private void requireNotBlocked(User sender, User receiver) {
        if (userBlockRepository.existsBlockBetween(sender.getId(), receiver.getId())) {
            throw new AppException(ErrorCode.USER_BLOCKED);
        }
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    /** @return true nếu là ảnh, false nếu là tài liệu */
    private boolean validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        String contentType = file.getContentType() != null ? file.getContentType() : "";
        if (ALLOWED_IMAGE_TYPES.contains(contentType)) return true;
        if (ALLOWED_DOC_TYPES.contains(contentType)) return false;
        throw new AppException(ErrorCode.INVALID_REQUEST);
    }

    private String snapshotOf(ChatMessage m) {
        return switch (m.getType()) {
            case IMAGE, DOCUMENT -> "[" + m.getType() + "] " + m.getAttachmentUrl();
            case LOCATION -> "[LOCATION] " + m.getLatitude() + "," + m.getLongitude();
            case MEETING_LINK -> "[MEETING_LINK] " + m.getMeetingLink();
            case RESCHEDULE_PROPOSAL -> "[RESCHEDULE] " + m.getProposedTime();
            default -> m.getContent();
        };
    }

    private static String truncate(String s) {
        if (s == null) return null;
        return s.length() <= 250 ? s : s.substring(0, 250) + "…";
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    // ─── Mirror sang Firestore (fail-soft) ──────────────────────────────────

    private void mirrorConversation(Conversation conv) {
        if (!firebaseService.isEnabled()) return;

        Map<String, Object> data = new HashMap<>();
        data.put("participants", List.of(
                conv.getUserOne().getId().toString(), conv.getUserTwo().getId().toString()));
        data.put("participantInfo", Map.of(
                conv.getUserOne().getId().toString(), participantInfo(conv.getUserOne()),
                conv.getUserTwo().getId().toString(), participantInfo(conv.getUserTwo())));
        data.put("sourceType", sourceTypeOf(conv).name());
        data.put("invitationId", conv.getInvitation() != null
                ? conv.getInvitation().getId().toString() : null);
        data.put("skillName", conv.getInvitation() != null && conv.getInvitation().getSkill() != null
                ? conv.getInvitation().getSkill().getName() : null);
        data.put("communityActivityId", conv.getCommunityActivity() != null
                ? conv.getCommunityActivity().getId().toString() : null);
        data.put("communityActivityTitle", conv.getCommunityActivity() != null
                ? conv.getCommunityActivity().getTitle() : null);
        data.put("lastMessage", conv.getLastMessagePreview());
        data.put("lastMessageType", conv.getLastMessageType() != null
                ? conv.getLastMessageType().name() : null);
        data.put("lastMessageAt", conv.getLastMessageAt() != null
                ? conv.getLastMessageAt().toEpochMilli() : null);
        data.put("isActive", Boolean.TRUE.equals(conv.getIsActive()));

        firebaseService.upsertConversation(conv.getId().toString(), data);
    }

    private Map<String, Object> participantInfo(User u) {
        Map<String, Object> info = new HashMap<>();
        info.put("fullName", u.getFullName());
        info.put("avatarUrl", u.getAvatarUrl());
        return info;
    }

    private void mirrorMessage(Conversation conv, ChatMessage m) {
        if (!firebaseService.isEnabled()) return;

        Map<String, Object> data = new HashMap<>();
        data.put("id", m.getId().toString());
        data.put("conversationId", conv.getId().toString());
        data.put("senderId", m.getSender() != null ? m.getSender().getId().toString() : null);
        data.put("senderName", m.getSender() != null ? m.getSender().getFullName() : null);
        data.put("senderAvatarUrl", m.getSender() != null ? m.getSender().getAvatarUrl() : null);
        data.put("type", m.getType().name());
        data.put("content", m.getContent());
        data.put("attachmentUrl", m.getAttachmentUrl());
        data.put("originalName", m.getOriginalName());
        data.put("fileSize", m.getFileSize());
        data.put("latitude", m.getLatitude());
        data.put("longitude", m.getLongitude());
        data.put("locationLabel", m.getLocationLabel());
        data.put("meetingLink", m.getMeetingLink());
        data.put("proposedTime", m.getProposedTime());
        data.put("appointmentId", m.getAppointmentId() != null ? m.getAppointmentId().toString() : null);
        data.put("appointmentData", m.getAppointmentData());
        data.put("isRecalled", m.isRecalled());
        data.put("recalled", m.isRecalled());
        data.put("createdAt", m.getCreatedAt() != null
                ? m.getCreatedAt().toEpochMilli() : Instant.now().toEpochMilli());

        firebaseService.pushMessage(conv.getId().toString(), m.getId().toString(), data);
    }

    private void mirrorUnread(Conversation conv, User forUser) {
        if (!firebaseService.isEnabled()) return;
        long unread = chatMessageRepository.countUnreadInConversation(conv.getId(), forUser.getEmail());
        firebaseService.updateUnread(conv.getId().toString(), forUser.getId().toString(), unread);
    }

    /** Đồng bộ cờ chặn lên mọi hội thoại chung của hai người */
    private void syncBlockFlag(User a, User b, boolean blocked) {
        if (!firebaseService.isEnabled()) return;
        conversationRepository.findAllByParticipantEmail(a.getEmail()).stream()
                .filter(c -> c.getUserOne().getId().equals(b.getId())
                        || c.getUserTwo().getId().equals(b.getId()))
                .forEach(c -> firebaseService.setBlocked(c.getId().toString(), blocked));
    }

    // ─── Mapper ─────────────────────────────────────────────────────────────

    private ConversationResponse mapToConversationResponse(Conversation conv, String myEmail) {
        User other = otherUserOf(conv, myEmail);
        User me = conv.getUserOne().getEmail().equals(myEmail) ? conv.getUserOne() : conv.getUserTwo();

        // Tìm tin nhắn mới nhất còn hiển thị với user này (không bị ẩn/thu hồi)
        var lastVisible = chatMessageRepository.findLastVisibleForUser(conv.getId(), myEmail);
        String preview = lastVisible.map(m -> {
            if (m.isRecalled()) return "Tin nhắn đã bị thu hồi";
            return m.getContent() != null ? truncate(m.getContent()) : conv.getLastMessagePreview();
        }).orElse(null);
        var lastType = lastVisible.map(ChatMessage::getType).orElse(conv.getLastMessageType());
        var lastAt = lastVisible.map(ChatMessage::getCreatedAt).orElse(conv.getLastMessageAt());

        Invitation invitation = conv.getInvitation();
        CommunityActivity activity = conv.getCommunityActivity();
        Appointment activeAppointment = sourceTypeOf(conv) == ConversationSourceType.COMMUNITY_ACTIVITY
                ? null
                : appointmentRepository.findActiveBetweenUsers(
                                conv.getUserOne().getId(), conv.getUserTwo().getId(),
                                ACTIVE_APPOINTMENT_STATUSES, PageRequest.of(0, 1))
                        .stream().findFirst().orElse(null);

        return ConversationResponse.builder()
                .id(conv.getId())
                .sourceType(sourceTypeOf(conv))
                .invitationId(invitation != null ? invitation.getId() : null)
                .invitationStatus(invitation != null ? invitation.getStatus() : null)
                .invitationSenderId(invitation != null ? invitation.getSender().getId() : null)
                .invitationReceiverId(invitation != null ? invitation.getReceiver().getId() : null)
                .activeAppointmentId(activeAppointment != null ? activeAppointment.getId() : null)
                .activeAppointmentStatus(activeAppointment != null ? activeAppointment.getStatus() : null)
                .canCreateAppointment(invitation != null
                        && invitation.getStatus() == InvitationStatus.ACCEPTED
                        && activeAppointment == null)
                .skillName(invitation != null && invitation.getSkill() != null
                        ? invitation.getSkill().getName() : null)
                .communityActivityId(activity != null ? activity.getId() : null)
                .communityActivityTitle(activity != null ? activity.getTitle() : null)
                .otherUserId(other.getId())
                .otherUserName(other.getFullName())
                .otherUserAvatarUrl(other.getAvatarUrl())
                .otherUserReputationScore(other.getReputationScore())
                .lastMessagePreview(preview)
                .lastMessageType(lastType)
                .lastMessageAt(lastAt)
                .unreadCount(chatMessageRepository.countUnreadInConversation(conv.getId(), myEmail))
                .isBlockedByMe(userBlockRepository.existsByBlocker_IdAndBlocked_Id(me.getId(), other.getId()))
                .hasBlockedMe(userBlockRepository.existsByBlocker_IdAndBlocked_Id(other.getId(), me.getId()))
                .isActive(conv.getIsActive())
                .createdAt(conv.getCreatedAt())
                .build();
    }

    private ConversationSourceType sourceTypeOf(Conversation conv) {
        if (conv.getSourceType() != null) return conv.getSourceType();
        return conv.getCommunityActivity() != null
                ? ConversationSourceType.COMMUNITY_ACTIVITY
                : ConversationSourceType.SKILL_INVITATION;
    }

    private ChatMessageResponse mapToMessageResponse(ChatMessage m) {
        return ChatMessageResponse.builder()
                .id(m.getId())
                .conversationId(m.getConversation().getId())
                .senderId(m.getSender() != null ? m.getSender().getId() : null)
                .senderName(m.getSender() != null ? m.getSender().getFullName() : null)
                .senderAvatarUrl(m.getSender() != null ? m.getSender().getAvatarUrl() : null)
                .type(m.getType())
                .content(m.getContent())
                .attachmentUrl(m.getAttachmentUrl())
                .originalName(m.getOriginalName())
                .fileSize(m.getFileSize())
                .latitude(m.getLatitude())
                .longitude(m.getLongitude())
                .locationLabel(m.getLocationLabel())
                .meetingLink(m.getMeetingLink())
                .proposedTime(m.getProposedTime())
                .appointmentId(m.getAppointmentId())
                .appointmentData(m.getAppointmentData())
                .isRecalled(m.isRecalled())
                .isRead(m.getIsRead())
                .createdAt(m.getCreatedAt())
                .build();
    }

    private BlockedUserResponse mapToBlockedResponse(UserBlock b) {
        return BlockedUserResponse.builder()
                .id(b.getId())
                .userId(b.getBlocked().getId())
                .fullName(b.getBlocked().getFullName())
                .avatarUrl(b.getBlocked().getAvatarUrl())
                .reason(b.getReason())
                .blockedAt(b.getCreatedAt())
                .build();
    }
}
