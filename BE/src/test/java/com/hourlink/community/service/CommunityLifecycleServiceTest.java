package com.hourlink.community.service;

import com.hourlink.community.enums.ActivityParticipantStatus;
import com.hourlink.community.enums.ActivityStatus;
import com.hourlink.community.repository.CommunityActivityRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collection;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommunityLifecycleServiceTest {

    @Mock CommunityActivityRepository activityRepository;

    @Test
    void synchronizeStatuses_closesStartedAndCompletesEndedResolvedActivities() {
        when(activityRepository.closeStartedActivities(
                any(), eq(ActivityStatus.OPEN), eq(ActivityStatus.CLOSED))).thenReturn(2);
        when(activityRepository.completeEndedActivitiesWithoutPending(
                any(), any(), eq(ActivityParticipantStatus.REGISTERED), eq(ActivityStatus.COMPLETED)))
                .thenReturn(1);

        new CommunityLifecycleService(activityRepository).synchronizeStatuses();

        ArgumentCaptor<Instant> closeTime = ArgumentCaptor.forClass(Instant.class);
        verify(activityRepository).closeStartedActivities(
                closeTime.capture(), eq(ActivityStatus.OPEN), eq(ActivityStatus.CLOSED));
        ArgumentCaptor<Collection<ActivityStatus>> statuses = ArgumentCaptor.forClass(Collection.class);
        ArgumentCaptor<Instant> completionTime = ArgumentCaptor.forClass(Instant.class);
        verify(activityRepository).completeEndedActivitiesWithoutPending(
                completionTime.capture(), statuses.capture(),
                eq(ActivityParticipantStatus.REGISTERED), eq(ActivityStatus.COMPLETED));
        assertTrue(statuses.getValue().contains(ActivityStatus.OPEN));
        assertTrue(statuses.getValue().contains(ActivityStatus.CLOSED));
        assertTrue(Math.abs(completionTime.getValue().toEpochMilli() - closeTime.getValue().toEpochMilli()) < 10);
    }
}
