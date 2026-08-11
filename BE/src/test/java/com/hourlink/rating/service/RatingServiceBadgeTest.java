package com.hourlink.rating.service;

import com.hourlink.appointment.repository.AppointmentRepository;
import com.hourlink.rating.repository.RatingRepository;
import com.hourlink.user.entity.Badge;
import com.hourlink.user.entity.User;
import com.hourlink.user.entity.UserBadge;
import com.hourlink.user.repository.BadgeRepository;
import com.hourlink.user.repository.UserBadgeRepository;
import com.hourlink.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RatingServiceBadgeTest {

    @Mock RatingRepository ratingRepository;
    @Mock AppointmentRepository appointmentRepository;
    @Mock UserRepository userRepository;
    @Mock BadgeRepository badgeRepository;
    @Mock UserBadgeRepository userBadgeRepository;

    RatingService service;

    @BeforeEach
    void setUp() {
        service = new RatingService(ratingRepository, appointmentRepository, userRepository,
                badgeRepository, userBadgeRepository);
    }

    @Test
    void firstCompletedSession_awardsStarterBadgeImmediately() {
        User user = userWithCompletedSessions(1);
        Badge starter = badge("SESSION_1", "SESSION_COUNT", 1);
        when(ratingRepository.countByRevieweeId(user.getId())).thenReturn(0L);
        when(badgeRepository.findByCode("SESSION_1")).thenReturn(Optional.of(starter));
        when(userBadgeRepository.existsByUserIdAndBadgeId(user.getId(), starter.getId())).thenReturn(false);
        when(userBadgeRepository.findByUserIdAndBadgeCategory(user.getId(), "SESSION_COUNT"))
                .thenReturn(List.of());

        service.checkAndAwardBadges(user);

        ArgumentCaptor<UserBadge> awarded = ArgumentCaptor.forClass(UserBadge.class);
        verify(userBadgeRepository).save(awarded.capture());
        assertSame(user, awarded.getValue().getUser());
        assertSame(starter, awarded.getValue().getBadge());
    }

    @Test
    void fifthCompletedSession_replacesLowerTierWithSessionFiveBadge() {
        User user = userWithCompletedSessions(5);
        Badge starter = badge("SESSION_1", "SESSION_COUNT", 1);
        Badge active = badge("SESSION_5", "SESSION_COUNT", 2);
        UserBadge oldAward = UserBadge.builder().user(user).badge(starter).build();
        when(ratingRepository.countByRevieweeId(user.getId())).thenReturn(0L);
        when(badgeRepository.findByCode("SESSION_5")).thenReturn(Optional.of(active));
        when(userBadgeRepository.existsByUserIdAndBadgeId(user.getId(), active.getId())).thenReturn(false);
        when(userBadgeRepository.findByUserIdAndBadgeCategory(user.getId(), "SESSION_COUNT"))
                .thenReturn(List.of(oldAward));

        service.checkAndAwardBadges(user);

        verify(userBadgeRepository).delete(oldAward);
        verify(userBadgeRepository).save(any(UserBadge.class));
    }

    @Test
    void noCompletedSession_doesNotAwardSessionBadge() {
        User user = userWithCompletedSessions(0);
        when(ratingRepository.countByRevieweeId(user.getId())).thenReturn(0L);

        service.checkAndAwardBadges(user);

        verify(badgeRepository, never()).findByCode(any());
        verify(userBadgeRepository, never()).save(any());
    }

    private User userWithCompletedSessions(int sessions) {
        User user = User.builder()
                .fullName("Người dùng")
                .email("badge-" + sessions + "@hourlink.vn")
                .passwordHash("hash")
                .completedSessions(sessions)
                .reputationScore(0)
                .build();
        user.setId(UUID.randomUUID());
        return user;
    }

    private Badge badge(String code, String category, int level) {
        Badge badge = Badge.builder()
                .code(code)
                .name(code)
                .category(category)
                .level(level)
                .build();
        badge.setId(UUID.randomUUID());
        return badge;
    }
}
