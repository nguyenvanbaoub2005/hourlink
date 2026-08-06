package com.hourlink.community.service;

import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.common.util.SecurityUtil;
import com.hourlink.community.dto.request.ConfirmParticipantsRequest;
import com.hourlink.community.dto.request.CreateActivityRequest;
import com.hourlink.community.dto.request.UpdateActivityRequest;
import com.hourlink.community.dto.response.ActivityResponse;
import com.hourlink.community.dto.response.ParticipantResponse;
import com.hourlink.community.entity.ActivityParticipant;
import com.hourlink.community.entity.CommunityActivity;
import com.hourlink.community.enums.ActivityParticipantStatus;
import com.hourlink.community.enums.ActivityStatus;
import com.hourlink.community.repository.ActivityParticipantRepository;
import com.hourlink.community.repository.CommunityActivityRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import com.hourlink.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

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

    // ─── US-35: CRUD Hoạt động cộng đồng ────────────────────────────────────

    /** Tạo hoạt động mới — chỉ tổ chức/người dùng đã xác minh mới tạo được */
    @Transactional
    public ActivityResponse createActivity(CreateActivityRequest req) {
        User organizer = getCurrentUser();

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
    public ActivityResponse updateActivity(UUID activityId, UpdateActivityRequest req) {
        User currentUser = getCurrentUser();
        CommunityActivity activity = getActivityOrThrow(activityId);
        checkOrganizer(activity, currentUser);
        checkEditable(activity);

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
    public void deleteActivity(UUID activityId) {
        User currentUser = getCurrentUser();
        CommunityActivity activity = getActivityOrThrow(activityId);
        checkOrganizer(activity, currentUser);
        checkEditable(activity);

        activityRepo.delete(activity);
        log.info("Activity [{}] deleted by organizer [{}]", activityId, currentUser.getId());
    }

    /** Đóng đăng ký thủ công (status → CLOSED) */
    @Transactional
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

    // ─── Read: Danh sách hoạt động ───────────────────────────────────────────

    /** Lấy tất cả hoạt động đang OPEN, phân trang, dành cho người dùng browse */
    public Page<ActivityResponse> getOpenActivities(int page, int size) {
        User currentUser = getCurrentUserOrNull();
        return activityRepo.findByStatusOrderByCreatedAtDesc(ActivityStatus.OPEN, PageRequest.of(page, size))
                .map(a -> toResponse(a, currentUser));
    }

    /** Lấy tất cả hoạt động (admin / organizer xem toàn bộ) */
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
        CommunityActivity activity = getActivityOrThrow(activityId);

        // Chỉ đăng ký được khi OPEN
        if (activity.getStatus() != ActivityStatus.OPEN) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        // Kiểm tra đã đăng ký chưa (bao gồm cả đã hủy rồi đăng ký lại)
        participantRepo.findByActivityIdAndUserId(activityId, currentUser.getId())
                .ifPresent(p -> {
                    if (p.getStatus() == ActivityParticipantStatus.REGISTERED) {
                        throw new AppException(ErrorCode.ALREADY_REGISTERED);
                    }
                    // Nếu đã hủy trước đó → cho phép đăng ký lại
                    p.setStatus(ActivityParticipantStatus.REGISTERED);
                    participantRepo.save(p);
                });

        // Kiểm tra chưa có bản ghi nào
        boolean hasRecord = participantRepo.existsByActivityIdAndUserId(activityId, currentUser.getId());
        if (hasRecord) {
            // Đã xử lý trong ifPresent bên trên (đăng ký lại)
            ActivityParticipant existing = participantRepo
                    .findByActivityIdAndUserId(activityId, currentUser.getId())
                    .orElseThrow();
            return ParticipantResponse.fromEntity(existing);
        }

        // Kiểm tra số lượng tối đa
        if (activity.getMaxParticipants() != null) {
            long count = activityRepo.countActiveParticipants(activityId);
            if (count >= activity.getMaxParticipants()) {
                throw new AppException(ErrorCode.ACTIVITY_FULL);
            }
        }

        ActivityParticipant participant = ActivityParticipant.builder()
                .activity(activity)
                .user(currentUser)
                .status(ActivityParticipantStatus.REGISTERED)
                .creditAwarded(false)
                .build();

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
    public List<ParticipantResponse> confirmParticipants(UUID activityId, ConfirmParticipantsRequest req) {
        User currentUser = getCurrentUser();
        CommunityActivity activity = getActivityOrThrow(activityId);
        checkOrganizer(activity, currentUser);

        // Xác định danh sách cần xác nhận
        List<ActivityParticipant> toConfirm;
        if (req.getParticipantIds() == null || req.getParticipantIds().isEmpty()) {
            // Xác nhận TẤT CẢ người đã đăng ký
            toConfirm = participantRepo.findByActivityIdAndStatus(activityId, ActivityParticipantStatus.REGISTERED);
        } else {
            // Xác nhận từng người theo danh sách ID
            toConfirm = new ArrayList<>();
            for (UUID pId : req.getParticipantIds()) {
                ActivityParticipant p = participantRepo.findById(pId)
                        .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
                if (!p.getActivity().getId().equals(activityId)) {
                    throw new AppException(ErrorCode.INVALID_REQUEST);
                }
                if (p.getStatus() == ActivityParticipantStatus.REGISTERED) {
                    toConfirm.add(p);
                }
            }
        }

        List<ParticipantResponse> results = new ArrayList<>();
        for (ActivityParticipant p : toConfirm) {
            // Xác nhận participant
            p.setStatus(ActivityParticipantStatus.CONFIRMED);
            p.setActualHours(req.getActualHours());
            p.setConfirmNote(req.getConfirmNote());

            // US-38: Cộng Time Credit nếu chưa cộng
            if (!Boolean.TRUE.equals(p.getCreditAwarded())) {
                walletService.addTimeCredit(
                        p.getUser(),
                        activity.getCreditReward(),
                        String.format("Tham gia hoạt động cộng đồng: %s (%.1f giờ)",
                                activity.getTitle(), req.getActualHours())
                );
                p.setCreditAwarded(true);
                log.info("TC awarded to user [{}] for activity [{}]: +{} TC",
                        p.getUser().getId(), activityId, activity.getCreditReward());
            }

            participantRepo.save(p);
            results.add(ParticipantResponse.fromEntity(p));
        }

        // Nếu xác nhận tất cả → đánh dấu hoạt động là COMPLETED
        if (req.getParticipantIds() == null || req.getParticipantIds().isEmpty()) {
            activity.setStatus(ActivityStatus.COMPLETED);
            activityRepo.save(activity);
        }

        log.info("Organizer [{}] confirmed {} participants for activity [{}]",
                currentUser.getId(), results.size(), activityId);
        return results;
    }

    /** Lấy danh sách người tham gia của 1 hoạt động (dành cho tổ chức xem) */
    public Page<ParticipantResponse> getParticipants(UUID activityId, int page, int size) {
        getActivityOrThrow(activityId); // validate tồn tại
        return participantRepo.findByActivityIdOrderByCreatedAtDesc(activityId, PageRequest.of(page, size))
                .map(ParticipantResponse::fromEntity);
    }

    /** Lấy danh sách hoạt động người dùng đã đăng ký */
    public Page<ParticipantResponse> getMyRegistrations(int page, int size) {
        User currentUser = getCurrentUser();
        return participantRepo.findByUserIdPaged(currentUser.getId(), PageRequest.of(page, size))
                .map(ParticipantResponse::fromEntity);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private CommunityActivity getActivityOrThrow(UUID id) {
        return activityRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ACTIVITY_NOT_FOUND));
    }

    private void checkOrganizer(CommunityActivity activity, User user) {
        if (!activity.getOrganizer().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
    }

    private void checkEditable(CommunityActivity activity) {
        if (activity.getStatus() == ActivityStatus.COMPLETED ||
            activity.getStatus() == ActivityStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
    }

    private ActivityResponse toResponse(CommunityActivity activity, User currentUser) {
        long count = activityRepo.countActiveParticipants(activity.getId());
        boolean registered = currentUser != null && participantRepo.existsByActivityIdAndUserIdAndStatus(
                activity.getId(), currentUser.getId(), ActivityParticipantStatus.REGISTERED);
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
