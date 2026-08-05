package com.hourlink.community.service;

import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.common.util.SecurityUtil;
import com.hourlink.community.dto.request.ActivityRequest;
import com.hourlink.community.dto.request.ActivityUpdateRequest;
import com.hourlink.community.dto.request.ParticipantConfirmRequest;
import com.hourlink.community.dto.response.ActivityResponse;
import com.hourlink.community.dto.response.ParticipantResponse;
import com.hourlink.community.entity.ActivityParticipant;
import com.hourlink.community.entity.CommunityActivity;
import com.hourlink.community.enums.ActivityStatus;
import com.hourlink.community.enums.ParticipantStatus;
import com.hourlink.community.repository.ActivityParticipantRepository;
import com.hourlink.community.repository.CommunityActivityRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import com.hourlink.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommunityService {

    private final CommunityActivityRepository activityRepository;
    private final ActivityParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final WalletService walletService;

    // ==========================================
    // US-35: Tổ chức tạo và quản lý hoạt động
    // ==========================================

    @Transactional
    public ActivityResponse createActivity(ActivityRequest request) {
        User currentUser = getCurrentUser();

        CommunityActivity activity = CommunityActivity.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .location(request.getLocation())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .creditReward(request.getCreditReward())
                .maxParticipants(request.getMaxParticipants())
                .status(ActivityStatus.OPEN)
                .organizer(currentUser)
                .build();

        activity = activityRepository.save(activity);
        log.info("User {} created community activity: {}", currentUser.getEmail(), activity.getId());
        return ActivityResponse.fromEntity(activity);
    }

    @Transactional
    public ActivityResponse updateActivityStatus(UUID activityId, ActivityStatus newStatus) {
        User currentUser = getCurrentUser();
        CommunityActivity activity = getActivityAndCheckOwner(activityId, currentUser);
        
        activity.setStatus(newStatus);
        activity = activityRepository.save(activity);
        log.info("Activity {} status changed to {}", activityId, newStatus);
        return ActivityResponse.fromEntity(activity);
    }

    @Transactional
    public ActivityResponse updateActivity(UUID activityId, ActivityUpdateRequest request) {
        User currentUser = getCurrentUser();
        CommunityActivity activity = getActivityAndCheckOwner(activityId, currentUser);

        if (activity.getStatus() != ActivityStatus.OPEN) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Chỉ có thể sửa hoạt động khi đang mở đăng ký");
        }

        if (request.getEndTime().isBefore(request.getStartTime())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Thời gian kết thúc phải sau thời gian bắt đầu");
        }

        activity.setTitle(request.getTitle());
        activity.setDescription(request.getDescription());
        activity.setLocation(request.getLocation());
        activity.setStartTime(request.getStartTime());
        activity.setEndTime(request.getEndTime());
        activity.setCreditReward(request.getCreditReward());
        activity.setMaxParticipants(request.getMaxParticipants());

        activity = activityRepository.save(activity);
        log.info("User {} updated community activity: {}", currentUser.getEmail(), activity.getId());
        return ActivityResponse.fromEntity(activity);
    }

    @Transactional
    public void deleteActivity(UUID activityId) {
        User currentUser = getCurrentUser();
        CommunityActivity activity = getActivityAndCheckOwner(activityId, currentUser);

        if (activity.getStatus() == ActivityStatus.IN_PROGRESS || activity.getStatus() == ActivityStatus.CLOSED) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Không thể xóa hoạt động đã diễn ra hoặc đã đóng");
        }

        activityRepository.delete(activity);
        log.info("User {} deleted community activity: {}", currentUser.getEmail(), activityId);
    }

    public List<ActivityResponse> getAllActivities() {
        return activityRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(ActivityResponse::fromEntity)
                .toList();
    }

    public ActivityResponse getActivityById(UUID id) {
        CommunityActivity activity = activityRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ACTIVITY_NOT_FOUND));
        return ActivityResponse.fromEntity(activity);
    }

    public List<ActivityResponse> getMyCreatedActivities() {
        User currentUser = getCurrentUser();
        return activityRepository.findByOrganizerIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(ActivityResponse::fromEntity)
                .toList();
    }

    // ==========================================
    // US-36: Người dùng đăng ký / hủy đăng ký
    // ==========================================

    @Transactional
    public ParticipantResponse registerForActivity(UUID activityId) {
        User currentUser = getCurrentUser();
        CommunityActivity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new AppException(ErrorCode.ACTIVITY_NOT_FOUND));

        if (activity.getStatus() != ActivityStatus.OPEN) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Hoạt động không mở đăng ký");
        }

        if (!activity.hasCapacity()) {
            throw new AppException(ErrorCode.ACTIVITY_FULL);
        }

        ActivityParticipant participant = participantRepository.findByActivityIdAndUserId(activityId, currentUser.getId())
                .orElse(null);

        if (participant != null) {
            if (participant.getStatus() != ParticipantStatus.CANCELLED) {
                throw new AppException(ErrorCode.ALREADY_REGISTERED);
            }
            // Đã hủy trước đó -> đăng ký lại
            participant.setStatus(ParticipantStatus.PENDING);
        } else {
            // Đăng ký mới
            participant = ActivityParticipant.builder()
                    .activity(activity)
                    .user(currentUser)
                    .status(ParticipantStatus.PENDING)
                    .build();
            activity.getParticipants().add(participant);
        }

        participantRepository.save(participant);
        // Không cần activityRepository.save() thừa — CascadeType.ALL tự xử lý khi participant mới
        
        log.info("User {} registered for activity {}", currentUser.getEmail(), activityId);
        return ParticipantResponse.fromEntity(participant);
    }

    @Transactional
    public void unregisterForActivity(UUID activityId) {
        User currentUser = getCurrentUser();
        ActivityParticipant participant = participantRepository.findByActivityIdAndUserId(activityId, currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Bạn chưa đăng ký hoạt động này"));

        if (participant.getStatus() == ParticipantStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Bạn đã hủy đăng ký hoạt động này rồi");
        }

        if (participant.getStatus() == ParticipantStatus.CONFIRMED) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Không thể hủy khi đã được tổ chức xác nhận");
        }

        participant.setStatus(ParticipantStatus.CANCELLED);
        participantRepository.save(participant);
        log.info("User {} unregistered from activity {}", currentUser.getEmail(), activityId);
    }

    public List<ParticipantResponse> getMyRegistrations() {
        User currentUser = getCurrentUser();
        return participantRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(ParticipantResponse::fromEntity)
                .toList();
    }

    // ==========================================
    // US-37 & US-38: Tổ chức xác nhận hoàn thành
    // ==========================================

    public List<ParticipantResponse> getActivityParticipants(UUID activityId) {
        User currentUser = getCurrentUser();
        getActivityAndCheckOwner(activityId, currentUser);
        
        return participantRepository.findByActivityId(activityId)
                .stream()
                .map(ParticipantResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ParticipantResponse confirmParticipant(UUID activityId, UUID participantId, ParticipantConfirmRequest request) {
        User currentUser = getCurrentUser();
        CommunityActivity activity = getActivityAndCheckOwner(activityId, currentUser);

        ActivityParticipant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Không tìm thấy người tham gia"));

        if (!participant.getActivity().getId().equals(activityId)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Người tham gia không thuộc hoạt động này");
        }

        if (participant.getStatus() == ParticipantStatus.CONFIRMED) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Người tham gia đã được xác nhận");
        }
        
        if (participant.getStatus() == ParticipantStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Người tham gia đã hủy đăng ký");
        }

        participant.setStatus(ParticipantStatus.CONFIRMED);
        participant.setContributionHours(request.getContributionHours());
        participant = participantRepository.save(participant);

        // US-38: Yêu cầu Wallet cộng Credit sau khi xác nhận hoàn thành
        if (activity.getCreditReward() > 0) {
            walletService.addTimeCredit(
                participant.getUser().getId(), 
                activity.getCreditReward(), 
                "Thưởng hoạt động cộng đồng: " + activity.getTitle()
            );
        }

        log.info("Organizer {} confirmed participant {} for activity {}. Granted {} TC", 
                currentUser.getEmail(), participant.getUser().getEmail(), activityId, activity.getCreditReward());
                
        return ParticipantResponse.fromEntity(participant);
    }

    // ==========================================
    // Helper Methods
    // ==========================================

    private User getCurrentUser() {
        String email = SecurityUtil.getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private CommunityActivity getActivityAndCheckOwner(UUID activityId, User user) {
        CommunityActivity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new AppException(ErrorCode.ACTIVITY_NOT_FOUND));
        
        if (!activity.getOrganizer().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED, "Bạn không phải là ban tổ chức của hoạt động này");
        }
        return activity;
    }
}
