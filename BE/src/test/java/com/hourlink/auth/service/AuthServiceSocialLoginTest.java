package com.hourlink.auth.service;

import com.hourlink.auth.dto.request.SocialLoginRequest;
import com.hourlink.auth.dto.response.AuthResponse;
import com.hourlink.auth.repository.InvalidatedTokenRepository;
import com.hourlink.common.service.FirebaseService;
import com.hourlink.user.entity.Role;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.RoleRepository;
import com.hourlink.user.repository.UserRepository;
import com.hourlink.user.repository.UserRoleRepository;
import com.hourlink.wallet.service.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceSocialLoginTest {

    @Mock UserRepository userRepository;
    @Mock InvalidatedTokenRepository invalidatedTokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock RoleRepository roleRepository;
    @Mock UserRoleRepository userRoleRepository;
    @Mock WalletService walletService;
    @Mock FirebaseService firebaseService;
    @InjectMocks AuthService authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "SIGNER_KEY",
                "hourlink-test-key-that-is-long-enough-for-hs512-signing-1234567890");
        ReflectionTestUtils.setField(authService, "VALID_DURATION", 3600L);
        ReflectionTestUtils.setField(authService, "REFRESHABLE_DURATION", 7200L);
        ReflectionTestUtils.setField(authService, "firebaseService", firebaseService);
    }

    @Test
    void socialLogin_provisionsNewUserAndWalletWhenVerifiedByFirebaseAdmin() {
        when(firebaseService.verifyIdToken("firebase-id-token")).thenReturn(
                new FirebaseService.VerifiedFirebaseUser("uid-1", "google.user@hourlink.vn", "Google User", null));
        when(userRepository.findByEmail("google.user@hourlink.vn")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });
        when(roleRepository.findByRoleCode("ROLE_USER")).thenReturn(
                Optional.of(Role.builder().roleCode("ROLE_USER").build()));
        when(userRoleRepository.findRoleCodesByUserId(any())).thenReturn(List.of("ROLE_USER"));

        AuthResponse response = authService.socialLogin(SocialLoginRequest.builder()
                .provider("google")
                .idToken("firebase-id-token")
                .build());

        assertTrue(response.isAuthenticated());
        assertNotNull(response.getToken());
        assertNotNull(response.getRefreshToken());
        verify(walletService).initWallet(any(User.class));
    }
}
