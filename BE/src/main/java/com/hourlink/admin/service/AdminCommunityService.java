package com.hourlink.admin.service;

import com.hourlink.admin.dto.response.AdminCommunityActivityDetailResponse;
import com.hourlink.admin.dto.response.AdminCommunityActivityResponse;
import com.hourlink.admin.dto.response.AdminCommunityEvidenceResponse;
import com.hourlink.admin.dto.response.AdminCommunityParticipantResponse;
import com.hourlink.admin.dto.response.AdminCommunityStatsResponse;
import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.community.entity.ActivityParticipant;
import com.hourlink.community.entity.CommunityActivity;
import com.hourlink.community.enums.ActivityParticipantStatus;
import com.hourlink.community.enums.ActivityStatus;
import com.hourlink.community.repository.ActivityParticipantRepository;
import com.hourlink.community.repository.CommunityActivityRepository;
import com.hourlink.community.service.CommunityService;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminCommunityService {

    private final CommunityActivityRepository activityRepository;
    private final ActivityParticipantRepository participantRepository;
    private final CommunityService communityService;

    public Page<AdminCommunityActivityResponse> getActivities(
            String search,
            ActivityStatus status,
            UUID organizerId,
            Instant startFrom,
            Instant startTo,
            Pageable pageable) {
        if (startFrom != null && startTo != null && startFrom.isAfter(startTo)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Thời gian bắt đầu không thể sau thời gian kết thúc");
        }

        Specification<CommunityActivity> spec = Specification.where(null);
        if (search != null && !search.isBlank()) {
            String keyword = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, query, cb) -> {
                var organizer = root.join("organizer", JoinType.LEFT);
                return cb.or(
                        cb.like(cb.lower(root.get("title")), keyword),
                        cb.like(cb.lower(root.get("location")), keyword),
                        cb.like(cb.lower(organizer.get("fullName")), keyword),
                        cb.like(cb.lower(organizer.get("email")), keyword));
            });
        }
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (organizerId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("organizer").get("id"), organizerId));
        }
        if (startFrom != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("startTime"), startFrom));
        }
        if (startTo != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("startTime"), startTo));
        }

        Page<CommunityActivity> activities = activityRepository.findAll(spec, pageable);
        Map<UUID, EnumMap<ActivityParticipantStatus, Long>> counts = getStatusCounts(
                activities.getContent().stream().map(CommunityActivity::getId).toList());
        return activities.map(activity -> toSummary(activity, counts.get(activity.getId())));
    }

    public AdminCommunityActivityDetailResponse getActivity(UUID id) {
        CommunityActivity activity = getOrThrow(id);
        Map<UUID, EnumMap<ActivityParticipantStatus, Long>> counts = getStatusCounts(List.of(id));
        return toDetail(activity, counts.get(id));
    }

    public Page<AdminCommunityParticipantResponse> getParticipants(UUID activityId, Pageable pageable) {
        getOrThrow(activityId);
        return participantRepository.findByActivityIdOrderByCreatedAtDesc(activityId, pageable)
                .map(this::toParticipant);
    }

    public AdminCommunityStatsResponse getStats() {
        long registrations = participantRepository.count();
        long confirmed = participantRepository.countByStatus(ActivityParticipantStatus.CONFIRMED);
        Double awardedHours = participantRepository.sumActualHoursByStatus(ActivityParticipantStatus.CONFIRMED);
        return new AdminCommunityStatsResponse(
                activityRepository.count(),
                activityRepository.countByStatus(ActivityStatus.OPEN),
                activityRepository.countByStatus(ActivityStatus.CLOSED),
                activityRepository.countByStatus(ActivityStatus.COMPLETED),
                activityRepository.countByStatus(ActivityStatus.CANCELLED),
                registrations,
                confirmed,
                awardedHours == null ? 0 : awardedHours);
    }

    @Transactional
    public AdminCommunityActivityDetailResponse closeRegistration(UUID id) {
        communityService.closeRegistration(id);
        return getActivity(id);
    }

    @Transactional
    public AdminCommunityActivityDetailResponse cancelActivity(UUID id) {
        communityService.cancelActivity(id);
        return getActivity(id);
    }

    private CommunityActivity getOrThrow(UUID id) {
        return activityRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ACTIVITY_NOT_FOUND));
    }

    private Map<UUID, EnumMap<ActivityParticipantStatus, Long>> getStatusCounts(List<UUID> activityIds) {
        Map<UUID, EnumMap<ActivityParticipantStatus, Long>> result = new HashMap<>();
        if (activityIds.isEmpty()) return result;
        participantRepository.countStatusesByActivityIds(activityIds).forEach(row ->
                result.computeIfAbsent(row.getActivityId(), ignored -> new EnumMap<>(ActivityParticipantStatus.class))
                        .put(row.getStatus(), row.getTotal()));
        return result;
    }

    private long count(EnumMap<ActivityParticipantStatus, Long> counts, ActivityParticipantStatus status) {
        return counts == null ? 0 : counts.getOrDefault(status, 0L);
    }

    private AdminCommunityActivityResponse toSummary(
            CommunityActivity activity, EnumMap<ActivityParticipantStatus, Long> counts) {
        return new AdminCommunityActivityResponse(
                activity.getId(), activity.getTitle(), activity.getLocation(), activity.getStartTime(),
                activity.getEndTime(), activity.getMaxParticipants(), activity.getCreditReward(), activity.getStatus(),
                activity.getOrganizer().getId(), activity.getOrganizer().getFullName(),
                activity.getOrganizer().getEmail(), count(counts, ActivityParticipantStatus.REGISTERED),
                count(counts, ActivityParticipantStatus.CONFIRMED),
                count(counts, ActivityParticipantStatus.ABSENT),
                count(counts, ActivityParticipantStatus.CANCELLED), activity.getCreatedAt());
    }

    private AdminCommunityActivityDetailResponse toDetail(
            CommunityActivity activity, EnumMap<ActivityParticipantStatus, Long> counts) {
        return new AdminCommunityActivityDetailResponse(
                activity.getId(), activity.getTitle(), activity.getDescription(), activity.getLocation(),
                activity.getStartTime(), activity.getEndTime(), activity.getMaxParticipants(),
                activity.getCreditReward(), activity.getStatus(), activity.getOrganizer().getId(),
                activity.getOrganizer().getFullName(), activity.getOrganizer().getEmail(),
                activity.getOrganizer().getAvatarUrl(), count(counts, ActivityParticipantStatus.REGISTERED),
                count(counts, ActivityParticipantStatus.CONFIRMED),
                count(counts, ActivityParticipantStatus.ABSENT),
                count(counts, ActivityParticipantStatus.CANCELLED), activity.getCreatedAt(), activity.getUpdatedAt());
    }

    private AdminCommunityParticipantResponse toParticipant(ActivityParticipant participant) {
        return new AdminCommunityParticipantResponse(
                participant.getId(), participant.getUser().getId(), participant.getUser().getFullName(),
                participant.getUser().getEmail(), participant.getUser().getAvatarUrl(), participant.getStatus(),
                participant.getActualHours(), participant.getConfirmNote(), participant.getConfirmedAt(),
                participant.getCreditAwarded(), participant.getEvidenceNote(), participant.getEvidenceSubmittedAt(),
                participant.getEvidence().stream().map(evidence -> new AdminCommunityEvidenceResponse(
                        evidence.getId(), evidence.getFileUrl(), evidence.getOriginalName(),
                        evidence.getFileSize(), evidence.getCreatedAt())).toList(),
                participant.getCreatedAt());
    }
}
