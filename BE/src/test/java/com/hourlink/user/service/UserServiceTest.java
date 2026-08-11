package com.hourlink.user.service;

import com.cloudinary.Cloudinary;
import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.rating.dto.response.BadgeResponse;
import com.hourlink.rating.service.RatingService;
import com.hourlink.skill.service.SkillService;
import com.hourlink.user.dto.ChangePasswordRequest;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository userRepository;
    @Mock Cloudinary cloudinary;
    @Mock SkillService skillService;
    @Mock RatingService ratingService;
    @Mock PasswordEncoder passwordEncoder;

    UserService service;

    @BeforeEach
    void setUp() {
        service = new UserService(userRepository, cloudinary, skillService, ratingService, passwordEncoder);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
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

    @Test
    void changePassword_updatesEncodedPasswordWhenCurrentPasswordIsCorrect() {
        User user = authenticatedUser("member@hourlink.vn", "encoded-current");
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("current-password")
                .newPassword("new-password")
                .build();
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("current-password", "encoded-current")).thenReturn(true);
        when(passwordEncoder.matches("new-password", "encoded-current")).thenReturn(false);
        when(passwordEncoder.encode("new-password")).thenReturn("encoded-new");

        service.changePassword(request);

        assertEquals("encoded-new", user.getPasswordHash());
        verify(userRepository).save(user);
    }

    @Test
    void changePassword_rejectsWrongCurrentPassword() {
        User user = authenticatedUser("member@hourlink.vn", "encoded-current");
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("wrong-password")
                .newPassword("new-password")
                .build();
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "encoded-current")).thenReturn(false);

        AppException exception = assertThrows(AppException.class, () -> service.changePassword(request));

        assertEquals(ErrorCode.WRONG_PASSWORD, exception.getErrorCode());
        assertEquals("encoded-current", user.getPasswordHash());
        verify(passwordEncoder, never()).encode("new-password");
        verify(userRepository, never()).save(user);
    }

    @Test
    void changePassword_rejectsNewPasswordMatchingCurrentPassword() {
        User user = authenticatedUser("member@hourlink.vn", "encoded-current");
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("same-password")
                .newPassword("same-password")
                .build();
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("same-password", "encoded-current")).thenReturn(true);

        AppException exception = assertThrows(AppException.class, () -> service.changePassword(request));

        assertEquals(ErrorCode.NEW_PASSWORD_SAME_AS_OLD, exception.getErrorCode());
        assertEquals("encoded-current", user.getPasswordHash());
        verify(passwordEncoder, never()).encode("same-password");
        verify(userRepository, never()).save(user);
    }

    private User authenticatedUser(String email, String passwordHash) {
        User user = User.builder()
                .fullName("Thành viên")
                .email(email)
                .passwordHash(passwordHash)
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, null, List.of()));
        return user;
    }
}
