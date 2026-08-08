package com.hourlink.community.service;

import com.hourlink.community.enums.ActivityParticipantStatus;
import com.hourlink.community.enums.ActivityStatus;
import com.hourlink.community.repository.CommunityActivityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/** Đồng bộ vòng đời hoạt động theo thời gian, không phụ thuộc người dùng mở màn hình. */
@Slf4j
@Service
@RequiredArgsConstructor
public class CommunityLifecycleService {

    private final CommunityActivityRepository activityRepository;

    @Scheduled(fixedDelayString = "${community.lifecycle-delay-ms:60000}")
    @Transactional
    public void synchronizeStatuses() {
        Instant now = Instant.now();
        int closed = activityRepository.closeStartedActivities(
                now, ActivityStatus.OPEN, ActivityStatus.CLOSED);
        int completed = activityRepository.completeEndedActivitiesWithoutPending(
                now,
                List.of(ActivityStatus.OPEN, ActivityStatus.CLOSED),
                ActivityParticipantStatus.REGISTERED,
                ActivityStatus.COMPLETED);
        if (closed > 0 || completed > 0) {
            log.info("Community lifecycle synchronized: closed={}, completed={}", closed, completed);
        }
    }
}
