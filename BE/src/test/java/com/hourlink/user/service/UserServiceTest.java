package com.hourlink.user.service;

import com.cloudinary.Cloudinary;
import com.hourlink.rating.dto.response.BadgeResponse;
import com.hourlink.rating.service.RatingService;
import com.hourlink.skill.service.SkillService;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository userRepository;
    @Mock Cloudinary cloudinary;
    @Mock SkillService skillService;
    @Mock RatingService ratingService;

    UserService service;

    @BeforeEach
    void setUp() {
        service = new UserService(userRepository, cloudinary, skillService, ratingService);
    }

    @Test
    void publicProfile_includesOnlyEarnedBadgesFromBadgeService() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .fullName("Người dùng công khai")
                .email("public@hourlink.vn")
                .passwordHash("hash")
                .completedSessions(1)
                .build();
        user.setId(userId);
        BadgeResponse starter = BadgeResponse.builder()
                .id(UUID.randomUUID().toString())
                .code("SESSION_1")
                .name("Khởi đầu")
                .build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(skillService.getVisibleSkillsOfUser(userId)).thenReturn(List.of());
        when(ratingService.getUserBadges(userId)).thenReturn(List.of(starter));

        var profile = service.getPublicProfile(userId);

        assertEquals(1, profile.getBadges().size());
        assertSame(starter, profile.getBadges().get(0));
    }
}
