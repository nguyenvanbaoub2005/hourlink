package com.hourlink.auth.service;

import com.hourlink.auth.dto.request.LoginRequest;
import com.hourlink.auth.dto.request.RefreshRequest;
import com.hourlink.auth.repository.InvalidatedTokenRepository;
import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.user.entity.User;
import com.hourlink.user.enums.UserType;
import com.hourlink.user.repository.RoleRepository;
import com.hourlink.user.repository.UserRepository;
import com.hourlink.user.repository.UserRoleRepository;
import com.hourlink.wallet.service.WalletService;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceRoleTest {

    @Mock UserRepository userRepository;
    @Mock InvalidatedTokenRepository invalidatedTokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock RoleRepository roleRepository;
    @Mock UserRoleRepository userRoleRepository;
    @Mock WalletService walletService;
    @Spy @InjectMocks AuthService service;

    @Test
    void authenticate_rejectsSoftDeletedAccountBeforePasswordCheck() {
        User user = user(UserType.individual);
        user.setDeleted(true);
        LoginRequest request = LoginRequest.builder()
                .email(user.getEmail())
                .password("password")
                .build();
        when(userRepository.findByEmail(user.getEmail())).thenReturn(java.util.Optional.of(user));

        AppException error = assertThrows(AppException.class, () -> service.authenticate(request));

        assertEquals(ErrorCode.ACCOUNT_DELETED, error.getErrorCode());
        verify(passwordEncoder, never()).matches(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void refreshToken_rejectsLockedAccount() throws Exception {
        assertRefreshRejectedForInactiveAccount(true, false, ErrorCode.ACCOUNT_LOCKED);
    }

    @Test
    void refreshToken_rejectsSoftDeletedAccount() throws Exception {
        assertRefreshRejectedForInactiveAccount(false, true, ErrorCode.ACCOUNT_DELETED);
    }

    @Test
    void verifyToken_rejectsTokenWithWrongPurpose() throws Exception {
        String signerKey = "hourlink-test-key-that-is-long-enough-for-hs512-signing-1234567890";
        ReflectionTestUtils.setField(service, "SIGNER_KEY", signerKey);
        ReflectionTestUtils.setField(service, "REFRESHABLE_DURATION", 3600L);

        SignedJWT accessToken = signedToken("access", signerKey);
        SignedJWT refreshToken = signedToken("refresh", signerKey);

        AppException accessAsRefresh = assertThrows(AppException.class,
                () -> service.verifyToken(accessToken.serialize(), true));
        AppException refreshAsAccess = assertThrows(AppException.class,
                () -> service.verifyToken(refreshToken.serialize(), false));

        assertEquals(ErrorCode.TOKEN_INVALID, accessAsRefresh.getErrorCode());
        assertEquals(ErrorCode.TOKEN_INVALID, refreshAsAccess.getErrorCode());
    }

    @Test
    void resolveCurrentScope_usesOrganizationTypeForLegacyMismatchedRole() {
        User user = user(UserType.organization);
        when(userRoleRepository.findRoleCodesByUserId(user.getId())).thenReturn(List.of("ROLE_USER"));

        assertEquals("ROLE_ORGANIZATION", service.resolveCurrentScope(user));
    }

    @Test
    void resolveCurrentScope_neverGrantsAdminFromUserTypeAlone() {
        User user = user(UserType.admin);
        when(userRoleRepository.findRoleCodesByUserId(user.getId())).thenReturn(List.of("ROLE_USER"));

        assertEquals("ROLE_USER", service.resolveCurrentScope(user));
    }

    @Test
    void resolveCurrentScope_preservesStoredAdminRole() {
        User user = user(UserType.individual);
        when(userRoleRepository.findRoleCodesByUserId(user.getId())).thenReturn(List.of("ROLE_ADMIN"));

        assertEquals("ROLE_ADMIN", service.resolveCurrentScope(user));
    }

    private User user(UserType userType) {
        User user = User.builder()
                .fullName("Test")
                .email("test@hourlink.vn")
                .passwordHash("hash")
                .userType(userType)
                .build();
        user.setId(UUID.randomUUID());
        return user;
    }

    private SignedJWT signedToken(String type, String signerKey) throws Exception {
        Instant now = Instant.now();
        SignedJWT jwt = new SignedJWT(
                new JWSHeader(JWSAlgorithm.HS512),
                new JWTClaimsSet.Builder()
                        .subject("test@hourlink.vn")
                        .issueTime(Date.from(now))
                        .expirationTime(Date.from(now.plusSeconds(3600)))
                        .jwtID(UUID.randomUUID().toString())
                        .claim("type", type)
                        .build());
        jwt.sign(new MACSigner(signerKey.getBytes()));
        return jwt;
    }

    private void assertRefreshRejectedForInactiveAccount(
            boolean locked,
            boolean deleted,
            ErrorCode expectedError) throws Exception {
        User user = user(UserType.individual);
        user.setLocked(locked);
        user.setDeleted(deleted);
        SignedJWT jwt = new SignedJWT(
                new JWSHeader(JWSAlgorithm.HS256),
                new JWTClaimsSet.Builder()
                        .subject(user.getEmail())
                        .jwtID(UUID.randomUUID().toString())
                        .expirationTime(new java.util.Date(System.currentTimeMillis() + 60_000))
                        .build());
        doReturn(jwt).when(service).verifyToken("refresh-token", true);
        when(userRepository.findByEmail(user.getEmail())).thenReturn(java.util.Optional.of(user));

        AppException error = assertThrows(AppException.class,
                () -> service.refreshToken(RefreshRequest.builder().token("refresh-token").build()));

        assertEquals(expectedError, error.getErrorCode());
    }
}
