package com.hourlink.security;

import com.hourlink.auth.service.AuthService;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class JwtFilterAccountStatusTest {

    private final AuthService authService = mock(AuthService.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final JwtFilter filter = new JwtFilter(authService, userRepository);

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @ParameterizedTest
    @CsvSource({"true,false", "false,true"})
    void inactiveAccountCannotAuthenticateWithExistingAccessToken(boolean locked, boolean deleted) throws Exception {
        String email = "inactive@hourlink.vn";
        SignedJWT jwt = new SignedJWT(
                new JWSHeader(JWSAlgorithm.HS256),
                new JWTClaimsSet.Builder()
                        .subject(email)
                        .claim("type", "access")
                        .build());
        User user = User.builder()
                .fullName("Inactive")
                .email(email)
                .passwordHash("hash")
                .isLocked(locked)
                .isDeleted(deleted)
                .build();
        when(authService.verifyToken("access-token", false)).thenReturn(jwt);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/wallet");
        request.setServletPath("/wallet");
        request.addHeader("Authorization", "Bearer access-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(authService, never()).resolveCurrentScope(user);
        verify(chain).doFilter(request, response);
    }
}
