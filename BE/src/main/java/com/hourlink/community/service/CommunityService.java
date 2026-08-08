package com.hourlink.community.service;

import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.common.util.SecurityUtil;
import com.hourlink.common.service.CloudinaryService;
import com.hourlink.community.dto.request.ConfirmParticipantsRequest;
import com.hourlink.community.dto.request.CreateActivityRequest;
import com.hourlink.community.dto.request.MarkParticipantsAbsentRequest;
import com.hourlink.community.dto.request.UpdateActivityRequest;
import com.hourlink.community.dto.response.ActivityResponse;
import com.hourlink.community.dto.response.ParticipantResponse;
import com.hourlink.community.entity.ActivityParticipant;
import com.hourlink.community.entity.ActivityEvidence;
import com.hourlink.community.entity.CommunityActivity;
import com.hourlink.community.enums.ActivityParticipantStatus;
import com.hourlink.community.enums.ActivityStatus;
import com.hourlink.community.repository.ActivityParticipantRepository;
import com.hourlink.community.repository.CommunityActivityRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import com.hourlink.wallet.service.WalletService;
import com.hourlink.notification.enums.NotificationType;
import com.hourlink.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.time.Instant;

/**
 * CommunityService — Toàn bộ logic cho module Community (US-35 → US-38).
 *
 * <p>US-35: Tổ chức CRUD hoạt động cộng đồng.
 * <p>US-36: Người dùng đăng ký / hủy đăng ký tham gia.
 * <p>US-37: Tổ chức xác nhận người tham gia + số giờ đóng góp.
 * <p>US-38: Hệ thống tự động cộng Time Credit qua WalletService sau khi xác nhận.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommunityService {

    private final CommunityActivityRepository activityRepo;
    private final ActivityParticipantRepository participantRepo;
    private final UserRepository userRepository;
    private final WalletService walletService;
    private final NotificationService notificationService;
    private final CloudinaryService cloudinaryService;

    private static final String EVIDENCE_FOLDER = "community_evidence";
    private static final int MAX_EVIDENCE_FILES = 5;
    private static final long MAX_EVIDENCE_FILE_SIZE = 5 * 1024 * 1024L;
    private static final List<String> ALLOWED_EVIDENCE_TYPES = List.of(
            "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"
    );

    // ─── US-35: CRUD Hoạt động cộng đồng ────────────────────────────────────

    /** Tạo hoạt động mới — chỉ tổ chức/người dùng đã xác minh mới tạo được */
    @Transactional
    @PreAuthorize("hasAnyAuthority('ROLE_ORGANIZATION', 'ROLE_ADMIN')")
    public ActivityResponse createActivity(CreateActivityRequest req) {
        User organizer = getCurrentUser();
        if (!isAdmin() && !organizer.isVerified()) {
            throw new AppException(ErrorCode.ACCOUNT_NOT_VERIFIED);
        }
        validateTimes(req.getStartTime(), req.getEndTime());

        CommunityActivity activity = CommunityActivity.builder()
                .organizer(organizer)
                .title(req.getTitle())
                .description(req.getDescription())
                .location(req.getLocation())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .maxParticipants(req.getMaxParticipants())
                .creditReward(req.getCreditReward())
                .status(ActivityStatus.OPEN)
                .build();

        activity = activityRepo.save(activity);
        log.info("Activity created [{}] by organizer [{}]", activity.getId(), organizer.getId());
        return toResponse(activity, organizer);
    }

    /** Cập nhật hoạt động — chỉ người tạo mới được sửa, và chưa COMPLETED/CANCELLED */
    @Transactional
    @PreAuthorize("hasAnyAuthority('ROLE_ORGANIZATION', 'ROLE_ADMIN')")
    public ActivityResponse updateActivity(UUID activityId, UpdateActivityRequest req) {
        User currentUser = getCurrentUser();
        CommunityActivity activity = getActivityOrThrow(activityId);
        checkOrganizer(activity, currentUser);
        checkEditable(activity);

        Instant newStart = req.getStartTime() != null ? req.getStartTime() : activity.getStartTime();
        Instant newEnd = req.getEndTime() != null ? req.getEndTime() : activity.getEndTime();
        validateTimes(newStart, newEnd);
        if (req.getMaxParticipants() != null) {
            long activeRegistrations = participantRepo.countByActivityIdAndStatus(
                    activityId, ActivityParticipantStatus.REGISTERED);
            if (req.getMaxParticipants() < activeRegistrations) {
                throw new AppException(ErrorCode.ACTIVITY_FULL);
            }
        }

        if (req.getTitle() != null)           activity.setTitle(req.getTitle());
        if (req.getDescription() != null)     activity.setDescription(req.getDescription());
        if (req.getLocation() != null)        activity.setLocation(req.getLocation());
        if (req.getStartTime() != null)       activity.setStartTime(req.getStartTime());
        if (req.getEndTime() != null)         activity.setEndTime(req.getEndTime());
        if (req.getMaxParticipants() != null) activity.setMaxParticipants(req.getMaxParticipants());
        if (req.getCreditReward() != null)    activity.setCreditReward(req.getCreditReward());

        activityRepo.save(activity);
        return toResponse(activity, currentUser);
    }

    /** Xóa hoạt động — chỉ người tạo, và phải ở trạng thái OPEN/CLOSED */
    @Transactional
    @PreAuthorize("hasAnyAuthority('ROLE_ORGANIZATION', 'ROLE_ADMIN')")
    public void deleteActivity(UUID activityId) {
        User currentUser = getCurrentUser();
        CommunityActivity activity = getActivityOrThrow(activityId);
        checkOrganizer(activity, currentUser);
        checkEditable(activity);

        if (participantRepo.countByActivityIdAndStatus(
                activityId, ActivityParticipantStatus.REGISTERED) > 0) {
            throw new AppException(ErrorCode.ACTIVITY_HAS_PARTICIPANTS);
        }

        activityRepo.delete(activity);
        log.info("Activity [{}] deleted by organizer [{}]", activityId, currentUser.getId());
    }

    /** Đóng đăng ký thủ công (status → CLOSED) */
    @Transactional
    @PreAuthorize("hasAnyAuthority('ROLE_ORGANIZATION', 'ROLE_ADMIN')")
    public ActivityResponse closeRegistration(UUID activityId) {
        User currentUser = getCurrentUser();
        CommunityActivity activity = getActivityOrThrow(activityId);
        checkOrganizer(activity, currentUser);

        if (activity.getStatus() != ActivityStatus.OPEN) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        activity.setStatus(ActivityStatus.CLOSED);
        activityRepo.save(activity);
        return toResponse(activity, currentUser);
    }

    /** Hủy hoạt động trước khi kết thúc và thông báo cho toàn bộ người đang đăng ký. */
    @Transactional
    @PreAuthorize("hasAnyAuthority('ROLE_ORGANIZATION', 'ROLE_ADMIN')")
    public ActivityResponse cancelActivity(UUID activityId) {
        User currentUser = getCurrentUser();
        CommunityActivity activity = getActivityOrThrow(activityId);
        checkOrganizer(activity, currentUser);

        if (activity.getStatus() == ActivityStatus.COMPLETED ||
                activity.getStatus() == ActivityStatus.CANCELLED ||
                !Instant.now().isBefore(activity.getEndTime())) {
            throw new AppException(ErrorCode.ACTIVITY_CANNOT_CANCEL);
        }

        List<ActivityParticipant> waiting = participantRepo.findByActivityIdAndStatus(
                activityId, ActivityParticipantStatus.REGISTERED);
        for (ActivityParticipant participant : waiting) {
            participant.setStatus(ActivityParticipantStatus.CANCELLED);
            participant.setConfirmNote("Hoạt động đã bị tổ chức hủy");
            participantRepo.save(participant);
            notificationService.createNotification(
                    participant.getUser(), NotificationType.COMMUNITY_ACTIVITY_CANCELLED,
                    "Hoạt động cộng đồng đã bị hủy",
                    String.format("Hoạt động %s đã bị tổ chức hủy", activity.getTitle()),
                    activity.getId());
        }

        activity.setStatus(ActivityStatus.CANCELLED);
        activityRepo.save(activity);
        log.info("Activity [{}] cancelled by organizer [{}]; notified {} participants",
                activityId, currentUser.getId(), waiting.size());
        return toResponse(activity, currentUser);
    }

    // ─── Read: Danh sách hoạt động ───────────────────────────────────────────

    /** Lấy tất cả hoạt động đang OPEN, phân trang, dành cho người dùng browse */
    public Page<ActivityResponse> getOpenActivities(int page, int size) {
        User currentUser = getCurrentUserOrNull();
        return activityRepo.findByStatusAndStartTimeAfterOrderByCreatedAtDesc(
                        ActivityStatus.OPEN, Instant.now(), PageRequest.of(page, size))
                .map(a -> toResponse(a, currentUser));
    }

    /** Lấy tất cả hoạt động (admin / organizer xem toàn bộ) */
    @PreAuthorize("hasAnyAuthority('ROLE_ORGANIZATION', 'ROLE_ADMIN')")
    public Page<ActivityResponse> getAllActivities(int page, int size) {
        User currentUser = getCurrentUserOrNull();
        return activityRepo.findAllPaged(PageRequest.of(page, size))
                .map(a -> toResponse(a, currentUser));
    }

    /** Lấy chi tiết 1 hoạt động */
    public ActivityResponse getActivity(UUID activityId) {
        User currentUser = getCurrentUserOrNull();
        CommunityActivity activity = getActivityOrThrow(activityId);
        return toResponse(activity, currentUser);
    }

    /** Lấy hoạt động do tổ chức tạo */
    @PreAuthorize("hasAnyAuthority('ROLE_ORGANIZATION', 'ROLE_ADMIN')")
    public Page<ActivityResponse> getMyActivities(int page, int size) {
        User currentUser = getCurrentUser();
        return activityRepo.findByOrganizerIdOrderByCreatedAtDesc(currentUser.getId(), PageRequest.of(page, size))
                .map(a -> toResponse(a, currentUser));
    }

    // ─── US-36: Đăng ký / hủy đăng ký ───────────────────────────────────────

    /**
     * Người dùng đăng ký tham gia hoạt động (US-36).
     * Kiểm tra: hoạt động OPEN, chưa đủ chỗ, chưa đăng ký.
     */
    @Transactional
    public ParticipantResponse register(UUID activityId) {
        User currentUser = getCurrentUser();
        CommunityActivity activity = activityRepo.findByIdForUpdate(activityId)
                .orElseThrow(() -> new AppException(ErrorCode.ACTIVITY_NOT_FOUND));

        // Chỉ đăng ký được khi OPEN
        if (activity.getStatus() != ActivityStatus.OPEN) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (!Instant.now().isBefore(activity.getStartTime())) {
            throw new AppException(ErrorCode.ACTIVITY_ALREADY_STARTED);
        }
        if (activity.getOrganizer().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.ORGANIZER_CANNOT_REGISTER);
        }

        ActivityParticipant existing = participantRepo
                .findByActivityIdAndUserId(activityId, currentUser.getId()).orElse(null);
        if (existing != null && existing.getStatus() == ActivityParticipantStatus.REGISTERED) {
            throw new AppException(ErrorCode.ALREADY_REGISTERED);
        }

        // Kiểm tra số lượng tối đa
        if (activity.getMaxParticipants() != null) {
            long count = participantRepo.countByActivityIdAndStatus(activityId, ActivityParticipantStatus.REGISTERED);
            if (count >= activity.getMaxParticipants()) {
                throw new AppException(ErrorCode.ACTIVITY_FULL);
            }
        }

        ActivityParticipant participant;
        if (existing != null) {
            existing.setStatus(ActivityParticipantStatus.REGISTERED);
            existing.setActualHours(null);
            existing.setConfirmNote(null);
            existing.setConfirmedAt(null);
            participant = existing;
        } else {
            participant = ActivityParticipant.builder()
                    .activity(activity)
                    .user(currentUser)
                    .status(ActivityParticipantStatus.REGISTERED)
                    .creditAwarded(false)
                    .build();
        }

        participant = participantRepo.save(participant);
        log.info("User [{}] registered for activity [{}]", currentUser.getId(), activityId);
        return ParticipantResponse.fromEntity(participant);
    }

    /**
     * Người dùng hủy đăng ký tham gia hoạt động (US-36).
     */
    @Transactional
    public void cancelRegistration(UUID activityId) {
        User currentUser = getCurrentUser();
        CommunityActivity activity = getActivityOrThrow(activityId);
        if (!Instant.now().isBefore(activity.getStartTime())) {
            throw new AppException(ErrorCode.ACTIVITY_ALREADY_STARTED);
        }
        ActivityParticipant participant = participantRepo
                .findByActivityIdAndUserId(activityId, currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        if (participant.getStatus() != ActivityParticipantStatus.REGISTERED) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        participant.setStatus(ActivityParticipantStatus.CANCELLED);
        participantRepo.save(participant);
        log.info("User [{}] cancelled registration for activity [{}]", currentUser.getId(), activityId);
    }

    // ─── US-37 + US-38: Tổ chức xác nhận người tham gia ─────────────────────

    /**
     * Tổ chức xác nhận người tham gia và số giờ đóng góp (US-37).
     * Sau khi xác nhận, hệ thống tự động cộng Time Credit (US-38).
     *
     * @param activityId ID của hoạt động
     * @param req        Danh sách participantIds cần xác nhận (để trống = tất cả REGISTERED)
     * @return Danh sách ParticipantResponse đã được xác nhận
     */
    @Transactional
    @PreAuthorize("hasAnyAuthority('ROLE_ORGANIZATION', 'ROLE_ADMIN')")
    public List<ParticipantResponse> confirmParticipants(UUID activityId, ConfirmParticipantsRequest req) {
        User currentUser = getCurrentUser();
        CommunityActivity activity = getActivityOrThrow(activityId);
        checkOrganizer(activity, currentUser);
        if (Instant.now().isBefore(activity.getEndTime())) {
            throw new AppException(ErrorCode.ACTIVITY_NOT_ENDED);
        }

        List<ConfirmationTarget> toConfirm = resolveConfirmations(activityId, req);
        if (toConfirm.isEmpty()) throw new AppException(ErrorCode.NO_PARTICIPANTS_TO_CONFIRM);

        List<ParticipantResponse> results = new ArrayList<>();
        for (ConfirmationTarget target : toConfirm) {
            ActivityParticipant p = target.participant();
            // Xác nhận participant
            p.setStatus(ActivityParticipantStatus.CONFIRMED);
            p.setActualHours(target.actualHours());
            p.setConfirmNote(target.note());
            p.setConfirmedAt(Instant.now());

            // US-38: Cộng Time Credit nếu chưa cộng
            if (!Boolean.TRUE.equals(p.getCreditAwarded())) {
                double awardedCredit = target.actualHours();
                boolean awarded = walletService.addCommunityCredit(
                        p.getUser(),
                        awardedCredit,
                        String.format("Tham gia hoạt động cộng đồng: %s (%.1f giờ)",
                                activity.getTitle(), target.actualHours()),
                        activity.getId(),
                        p.getId()
                );
                p.setCreditAwarded(true);
                if (awarded) {
                    notificationService.createNotification(
                            p.getUser(), NotificationType.COMMUNITY_CREDIT_AWARDED,
                            "Đã ghi nhận đóng góp cộng đồng",
                            String.format("Bạn nhận được %.1f Time Credit từ hoạt động %s",
                                    awardedCredit, activity.getTitle()), activity.getId());
                    log.info("TC awarded to user [{}] for activity [{}]: +{} TC",
                            p.getUser().getId(), activityId, awardedCredit);
                }
            }

            participantRepo.save(p);
            results.add(ParticipantResponse.fromEntity(p));
        }

        // Không còn ai chờ xác nhận → hoàn tất hoạt động.
        completeActivityIfResolved(activity);

        log.info("Organizer [{}] confirmed {} participants for activity [{}]",
                currentUser.getId(), results.size(), activityId);
        return results;
    }

    /** Đánh dấu người không tham gia; không cộng Credit. */
    @Transactional
    @PreAuthorize("hasAnyAuthority('ROLE_ORGANIZATION', 'ROLE_ADMIN')")
    public List<ParticipantResponse> markParticipantsAbsent(
            UUID activityId, MarkParticipantsAbsentRequest request) {
        User currentUser = getCurrentUser();
        CommunityActivity activity = getActivityOrThrow(activityId);
        checkOrganizer(activity, currentUser);
        if (Instant.now().isBefore(activity.getEndTime())) {
            throw new AppException(ErrorCode.ACTIVITY_NOT_ENDED);
        }

        String reason = request.getReason() == null || request.getReason().isBlank()
                ? "Không được tổ chức xác nhận tham gia"
                : request.getReason().trim();
        List<ParticipantResponse> results = new ArrayList<>();
        for (UUID participantId : request.getParticipantIds().stream().distinct().toList()) {
            ActivityParticipant participant = participantRepo.findById(participantId)
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
            if (!participant.getActivity().getId().equals(activityId)) {
                throw new AppException(ErrorCode.INVALID_REQUEST);
            }
            if (participant.getStatus() != ActivityParticipantStatus.REGISTERED) {
                throw new AppException(ErrorCode.PARTICIPANT_NOT_REGISTERED);
            }

            participant.setStatus(ActivityParticipantStatus.ABSENT);
            participant.setConfirmNote(reason);
            participantRepo.save(participant);
            notificationService.createNotification(
                    participant.getUser(), NotificationType.COMMUNITY_PARTICIPANT_ABSENT,
                    "Chưa được xác nhận tham gia",
                    String.format("Bạn được ghi nhận vắng mặt tại hoạt động %s. Lý do: %s",
                            activity.getTitle(), reason), activity.getId());
            results.add(ParticipantResponse.fromEntity(participant));
        }

        completeActivityIfResolved(activity);
        log.info("Organizer [{}] marked {} participants absent for activity [{}]",
                currentUser.getId(), results.size(), activityId);
        return results;
    }

    /** Lấy danh sách người tham gia của 1 hoạt động (dành cho tổ chức xem) */
    public Page<ParticipantResponse> getParticipants(UUID activityId, int page, int size) {
        User currentUser = getCurrentUser();
        CommunityActivity activity = getActivityOrThrow(activityId);
        if (!isAdmin()) checkOrganizer(activity, currentUser);
        return participantRepo.findByActivityIdOrderByCreatedAtDesc(activityId, PageRequest.of(page, size))
                .map(ParticipantResponse::fromEntity);
    }

    /** Lấy danh sách hoạt động người dùng đã đăng ký */
    public Page<ParticipantResponse> getMyRegistrations(int page, int size) {
        User currentUser = getCurrentUser();
        return participantRepo.findByUserIdPaged(currentUser.getId(), PageRequest.of(page, size))
                .map(ParticipantResponse::fromEntity);
    }

    /** Lấy bản ghi tham gia của người dùng hiện tại trong một hoạt động. */
    public ParticipantResponse getMyParticipation(UUID activityId) {
        User currentUser = getCurrentUser();
        ActivityParticipant participant = participantRepo
                .findByActivityIdAndUserId(activityId, currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        return ParticipantResponse.fromEntity(participant);
    }

    /**
     * Gửi mới hoặc thay toàn bộ ảnh minh chứng sau khi hoạt động kết thúc.
     * Minh chứng vẫn có thể bổ sung sau xác nhận để lưu hồ sơ và phục vụ đối soát.
     */
    @Transactional
    public ParticipantResponse submitEvidence(UUID activityId, List<MultipartFile> files, String note) {
        User currentUser = getCurrentUser();
        ActivityParticipant participant = participantRepo
                .findByActivityIdAndUserId(activityId, currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        if ((participant.getStatus() != ActivityParticipantStatus.REGISTERED &&
                participant.getStatus() != ActivityParticipantStatus.CONFIRMED) ||
                Instant.now().isBefore(participant.getActivity().getEndTime())) {
            throw new AppException(ErrorCode.EVIDENCE_NOT_ALLOWED);
        }

        List<MultipartFile> selectedFiles = files == null
                ? List.of()
                : files.stream().filter(file -> file != null && !file.isEmpty()).toList();
        if (selectedFiles.isEmpty() && participant.getEvidence().isEmpty()) {
            throw new AppException(ErrorCode.EVIDENCE_REQUIRED);
        }
        if (selectedFiles.size() > MAX_EVIDENCE_FILES) {
            throw new AppException(ErrorCode.EVIDENCE_LIMIT_EXCEEDED);
        }
        if (note != null && note.trim().length() > 500) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        selectedFiles.forEach(this::validateEvidenceFile);

        if (!selectedFiles.isEmpty()) {
            List<ActivityEvidence> uploaded = uploadEvidenceFiles(participant, selectedFiles);
            List<ActivityEvidence> previous = new ArrayList<>(participant.getEvidence());
            participant.getEvidence().clear();
            participant.getEvidence().addAll(uploaded);
            participantRepo.saveAndFlush(participant);
            previous.forEach(item -> cloudinaryService.deleteFile(item.getPublicId(), true));
        }

        participant.setEvidenceNote(note == null || note.isBlank() ? null : note.trim());
        participant.setEvidenceSubmittedAt(Instant.now());
        participant = participantRepo.saveAndFlush(participant);
        log.info("User [{}] submitted {} evidence images for activity [{}]",
                currentUser.getId(), participant.getEvidence().size(), activityId);
        return ParticipantResponse.fromEntity(participant);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private CommunityActivity getActivityOrThrow(UUID id) {
        return activityRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ACTIVITY_NOT_FOUND));
    }

    private void checkOrganizer(CommunityActivity activity, User user) {
        if (!isAdmin() && !activity.getOrganizer().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
    }

    private void checkEditable(CommunityActivity activity) {
        if (activity.getStatus() == ActivityStatus.COMPLETED ||
            activity.getStatus() == ActivityStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (!Instant.now().isBefore(activity.getStartTime())) {
            throw new AppException(ErrorCode.ACTIVITY_ALREADY_STARTED);
        }
    }

    private void validateEvidenceFile(MultipartFile file) {
        if (file.getSize() > MAX_EVIDENCE_FILE_SIZE) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!ALLOWED_EVIDENCE_TYPES.contains(contentType)) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
    }

    private List<ActivityEvidence> uploadEvidenceFiles(ActivityParticipant participant,
                                                        List<MultipartFile> files) {
        List<ActivityEvidence> uploaded = new ArrayList<>();
        try {
            for (MultipartFile file : files) {
                Map<String, Object> result = cloudinaryService.uploadFile(file, EVIDENCE_FOLDER);
                uploaded.add(ActivityEvidence.builder()
                        .participant(participant)
                        .fileUrl((String) result.get("secure_url"))
                        .publicId((String) result.get("public_id"))
                        .originalName(file.getOriginalFilename())
                        .fileSize(file.getSize())
                        .build());
            }
            return uploaded;
        } catch (IOException | RuntimeException error) {
            uploaded.forEach(item -> cloudinaryService.deleteFile(item.getPublicId(), true));
            log.error("Failed to upload community evidence: {}", error.getMessage());
            if (error instanceof AppException appException) throw appException;
            throw new AppException(ErrorCode.UPLOAD_FAILED);
        }
    }

    private void validateTimes(Instant start, Instant end) {
        if (start == null || end == null || !start.isAfter(Instant.now()) || !end.isAfter(start)) {
            throw new AppException(ErrorCode.ACTIVITY_TIME_INVALID);
        }
    }

    private void completeActivityIfResolved(CommunityActivity activity) {
        if (participantRepo.countByActivityIdAndStatus(
                activity.getId(), ActivityParticipantStatus.REGISTERED) == 0) {
            activity.setStatus(ActivityStatus.COMPLETED);
            activityRepo.save(activity);
        }
    }

    private List<ConfirmationTarget> resolveConfirmations(UUID activityId, ConfirmParticipantsRequest req) {
        List<ConfirmationTarget> result = new ArrayList<>();
        if (req.getConfirmations() != null && !req.getConfirmations().isEmpty()) {
            for (ConfirmParticipantsRequest.ParticipantConfirmation item : req.getConfirmations()) {
                result.add(toConfirmationTarget(activityId, item.getParticipantId(),
                        item.getActualHours(), item.getConfirmNote()));
            }
            return result;
        }
        if (req.getActualHours() == null || req.getActualHours() < 0.5) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        List<UUID> ids = req.getParticipantIds();
        if (ids == null || ids.isEmpty()) {
            return participantRepo.findByActivityIdAndStatus(activityId, ActivityParticipantStatus.REGISTERED)
                    .stream().map(p -> {
                        validateActualHours(req.getActualHours());
                        return new ConfirmationTarget(p, req.getActualHours(), req.getConfirmNote());
                    }).toList();
        }
        for (UUID id : ids) {
            result.add(toConfirmationTarget(activityId, id, req.getActualHours(), req.getConfirmNote()));
        }
        return result;
    }

    private ConfirmationTarget toConfirmationTarget(UUID activityId, UUID participantId,
                                                     Double actualHours, String note) {
        ActivityParticipant participant = participantRepo.findById(participantId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        if (!participant.getActivity().getId().equals(activityId)) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (participant.getStatus() != ActivityParticipantStatus.REGISTERED) {
            throw new AppException(ErrorCode.PARTICIPANT_NOT_REGISTERED);
        }
        validateActualHours(actualHours);
        return new ConfirmationTarget(participant, actualHours, note);
    }

    private void validateActualHours(Double actualHours) {
        if (actualHours == null || !Double.isFinite(actualHours) ||
                actualHours < 0.5) {
            throw new AppException(ErrorCode.ACTUAL_HOURS_INVALID);
        }
    }

    private boolean isAdmin() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    private record ConfirmationTarget(ActivityParticipant participant, Double actualHours, String note) {}

    private ActivityResponse toResponse(CommunityActivity activity, User currentUser) {
        long count = participantRepo.countByActivityIdAndStatus(activity.getId(), ActivityParticipantStatus.REGISTERED);
        boolean registered = false;
        if (currentUser != null) {
            registered = participantRepo.findByActivityIdAndUserId(activity.getId(), currentUser.getId())
                    .map(p -> p.getStatus() == ActivityParticipantStatus.REGISTERED ||
                            p.getStatus() == ActivityParticipantStatus.CONFIRMED)
                    .orElse(false);
        }
        return ActivityResponse.fromEntity(activity, count, registered);
    }

    private User getCurrentUser() {
        String email = SecurityUtil.getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private User getCurrentUserOrNull() {
        String email = SecurityUtil.getCurrentUserEmailOrNull();
        if (email == null) return null;
        return userRepository.findByEmail(email).orElse(null);
    }
}
