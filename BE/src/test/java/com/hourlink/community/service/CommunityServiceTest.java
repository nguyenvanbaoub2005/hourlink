package com.hourlink.community.service;

import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.community.dto.request.ConfirmParticipantsRequest;
import com.hourlink.community.entity.ActivityParticipant;
import com.hourlink.community.entity.CommunityActivity;
import com.hourlink.community.enums.ActivityParticipantStatus;
import com.hourlink.community.enums.ActivityStatus;
import com.hourlink.community.repository.ActivityParticipantRepository;
import com.hourlink.community.repository.CommunityActivityRepository;
import com.hourlink.notification.service.NotificationService;
import com.hourlink.notification.enums.NotificationType;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import com.hourlink.wallet.service.WalletService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommunityServiceTest {

    @Mock CommunityActivityRepository activityRepo;
    @Mock ActivityParticipantRepository participantRepo;
    @Mock UserRepository userRepository;
    CommunityService service;
    TestWalletService walletService;
    TestNotificationService notificationService;

    private User currentUser;

    @BeforeEach
    void authenticate() {
        walletService = new TestWalletService();
        notificationService = new TestNotificationService();
        service = new CommunityService(activityRepo, participantRepo, userRepository,
                walletService, notificationService);
        currentUser = user("user@hourlink.vn");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(currentUser.getEmail(), null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))));
        when(userRepository.findByEmail(currentUser.getEmail())).thenReturn(Optional.of(currentUser));
    }

    @AfterEach
    void clearSecurity() { SecurityContextHolder.clearContext(); }

    @Test
    void register_reactivatedRegistrationStillChecksCapacity() {
        CommunityActivity activity = futureActivity(user("org@hourlink.vn"));
        ActivityParticipant cancelled = participant(activity, currentUser, ActivityParticipantStatus.CANCELLED);
        when(activityRepo.findByIdForUpdate(activity.getId())).thenReturn(Optional.of(activity));
        when(participantRepo.findByActivityIdAndUserId(activity.getId(), currentUser.getId()))
                .thenReturn(Optional.of(cancelled));
        when(participantRepo.countByActivityIdAndStatus(activity.getId(), ActivityParticipantStatus.REGISTERED))
                .thenReturn(1L);

        AppException error = assertThrows(AppException.class, () -> service.register(activity.getId()));

        assertEquals(ErrorCode.ACTIVITY_FULL, error.getErrorCode());
        assertEquals(ActivityParticipantStatus.CANCELLED, cancelled.getStatus());
        verify(participantRepo, never()).save(any());
    }

    @Test
    void register_organizerCannotRegisterOwnActivity() {
        CommunityActivity activity = futureActivity(currentUser);
        when(activityRepo.findByIdForUpdate(activity.getId())).thenReturn(Optional.of(activity));

        AppException error = assertThrows(AppException.class, () -> service.register(activity.getId()));

        assertEquals(ErrorCode.ORGANIZER_CANNOT_REGISTER, error.getErrorCode());
    }

    @Test
    void confirmLastParticipant_awardsOnceAndCompletesActivity() {
        User organizer = currentUser;
        User participantUser = user("participant@hourlink.vn");
        CommunityActivity activity = futureActivity(organizer);
        activity.setStartTime(Instant.now().minusSeconds(7200));
        activity.setEndTime(Instant.now().minusSeconds(3600));
        ActivityParticipant participant = participant(activity, participantUser, ActivityParticipantStatus.REGISTERED);
        ConfirmParticipantsRequest request = new ConfirmParticipantsRequest();
        request.setParticipantIds(List.of(participant.getId()));
        request.setActualHours(2.0);

        when(activityRepo.findById(activity.getId())).thenReturn(Optional.of(activity));
        when(participantRepo.findById(participant.getId())).thenReturn(Optional.of(participant));
        when(participantRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(activityRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(participantRepo.countByActivityIdAndStatus(activity.getId(), ActivityParticipantStatus.REGISTERED))
                .thenReturn(0L);

        var result = service.confirmParticipants(activity.getId(), request);

        assertEquals(1, result.size());
        assertEquals(ActivityParticipantStatus.CONFIRMED, participant.getStatus());
        assertTrue(participant.getCreditAwarded());
        assertEquals(ActivityStatus.COMPLETED, activity.getStatus());
        assertEquals(1, walletService.calls);
        assertEquals(1, notificationService.calls);
    }

    private static User user(String email) {
        User user = User.builder().email(email).fullName(email).passwordHash("hash").build();
        user.setId(UUID.randomUUID());
        return user;
    }

    private static CommunityActivity futureActivity(User organizer) {
        CommunityActivity activity = CommunityActivity.builder()
                .organizer(organizer).title("Activity").startTime(Instant.now().plusSeconds(3600))
                .endTime(Instant.now().plusSeconds(7200)).creditReward(2.0).maxParticipants(1)
                .status(ActivityStatus.OPEN).build();
        activity.setId(UUID.randomUUID());
        return activity;
    }

    private static ActivityParticipant participant(CommunityActivity activity, User user,
                                                   ActivityParticipantStatus status) {
        ActivityParticipant participant = ActivityParticipant.builder()
                .activity(activity).user(user).status(status).creditAwarded(false).build();
        participant.setId(UUID.randomUUID());
        participant.setCreatedAt(Instant.now());
        return participant;
    }

    private static class TestWalletService extends WalletService {
        int calls;
        TestWalletService() { super(null, null, null); }
        @Override
        public boolean addCommunityCredit(User user, Double amount, String description,
                                          UUID activityId, UUID participantId) {
            calls++;
            return true;
        }
    }

    private static class TestNotificationService extends NotificationService {
        int calls;
        TestNotificationService() { super(null); }
        @Override
        public void createNotification(User user, NotificationType type, String title,
                                       String body, UUID referenceId) {
            calls++;
        }
    }
}
