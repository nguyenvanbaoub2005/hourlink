package com.hourlink.auth.service;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.hourlink.auth.dto.request.IntrospectRequest;
import com.hourlink.auth.dto.request.LoginRequest;
import com.hourlink.auth.dto.request.LogoutRequest;
import com.hourlink.auth.dto.request.RefreshRequest;
import com.hourlink.auth.dto.request.RegisterRequest;
import com.hourlink.auth.dto.response.AuthResponse;
import com.hourlink.auth.dto.response.IntrospectResponse;
import com.hourlink.auth.entity.InvalidatedToken;
import com.hourlink.auth.repository.InvalidatedTokenRepository;
import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.user.entity.User;
import com.hourlink.user.entity.UserRole;
import com.hourlink.user.repository.RoleRepository;
import com.hourlink.user.repository.UserRepository;
import com.hourlink.user.repository.UserRoleRepository;
import com.hourlink.wallet.service.WalletService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthService {

    UserRepository userRepository;
    InvalidatedTokenRepository invalidatedTokenRepository;
    PasswordEncoder passwordEncoder;
    RoleRepository roleRepository;
    UserRoleRepository userRoleRepository;
    WalletService walletService;

    @NonFinal
    @Value("${jwt.signerKey}")
    String SIGNER_KEY;

    @NonFinal
    @Value("${jwt.valid-duration}")
    long VALID_DURATION;

    @NonFinal
    @Value("${jwt.refreshable-duration}")
    long REFRESHABLE_DURATION;

    public AuthResponse authenticate(LoginRequest request) {
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // isLocked là field primitive boolean => Lombok sinh isLocked()
        if (user.isLocked()) {
            throw new AppException(ErrorCode.ACCOUNT_LOCKED);
        }

        boolean matched = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());
        if (!matched) {
            throw new AppException(ErrorCode.WRONG_PASSWORD);
        }

        return AuthResponse.builder()
                .token(generateToken(user, "access", VALID_DURATION))
                .refreshToken(generateToken(user, "refresh", REFRESHABLE_DURATION))
                .authenticated(true)
                .build();
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone())) {
            throw new AppException(ErrorCode.PHONE_ALREADY_EXISTS);
        }

        User user = User.builder()
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        user = userRepository.save(user);

        var defaultRole = roleRepository.findByRoleCode("ROLE_USER")
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
        
        var userRole = UserRole.builder()
                .user(user)
                .role(defaultRole)
                .build();
        userRoleRepository.save(userRole);
        
        user.setUserRoles(java.util.List.of(userRole));

        // Khởi tạo ví Time Credit với balance = 5.0 (credit khởi đầu)
        walletService.initWallet(user);

        return AuthResponse.builder()
                .token(generateToken(user, "access", VALID_DURATION))
                .refreshToken(generateToken(user, "refresh", REFRESHABLE_DURATION))
                .authenticated(true)
                .build();
    }

    public IntrospectResponse introspect(IntrospectRequest request) {
        try {
            verifyToken(request.getToken(), false);
            return IntrospectResponse.builder().valid(true).build();
        } catch (AppException | ParseException | JOSEException e) {
            return IntrospectResponse.builder().valid(false).build();
        }
    }

    public AuthResponse refreshToken(RefreshRequest request) {
        try {
            var signedJWT = verifyToken(request.getToken(), true);
            var jit = signedJWT.getJWTClaimsSet().getJWTID();
            var expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();

            invalidatedTokenRepository.save(
                    InvalidatedToken.builder().id(jit).expiryTime(expiryTime).build()
            );

            var email = signedJWT.getJWTClaimsSet().getSubject();
            var user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

            return AuthResponse.builder()
                    .token(generateToken(user, "access", VALID_DURATION))
                    .refreshToken(generateToken(user, "refresh", REFRESHABLE_DURATION))
                    .authenticated(true)
                    .build();
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.warn("refreshToken failed: {}", e.getMessage());
            throw new AppException(ErrorCode.TOKEN_INVALID);
        }
    }

    public void logout(LogoutRequest request) {
        // Blacklist access token — nếu token hết hạn hoặc lỗi thì bỏ qua, coi như logout ok
        try {
            var accessJwt = verifyToken(request.getToken(), false);
            invalidatedTokenRepository.save(InvalidatedToken.builder()
                    .id(accessJwt.getJWTClaimsSet().getJWTID())
                    .expiryTime(accessJwt.getJWTClaimsSet().getExpirationTime())
                    .build());
        } catch (Exception e) {
            // Token hết hạn hoặc không hợp lệ => đã logout rồi => bỏ qua
            log.info("Access token already invalid or expired, skipping blacklist: {}", e.getMessage());
        }

        // Blacklist refresh token nếu có
        if (request.getRefreshToken() != null) {
            try {
                var refreshJwt = verifyToken(request.getRefreshToken(), true);
                invalidatedTokenRepository.save(InvalidatedToken.builder()
                        .id(refreshJwt.getJWTClaimsSet().getJWTID())
                        .expiryTime(refreshJwt.getJWTClaimsSet().getExpirationTime())
                        .build());
            } catch (Exception e) {
                log.info("Refresh token already invalid or expired, skipping blacklist: {}", e.getMessage());
            }
        }
    }

    public SignedJWT verifyToken(String token, boolean isRefresh) throws ParseException, JOSEException {
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());
        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expiryTime = isRefresh
                ? new Date(signedJWT.getJWTClaimsSet().getIssueTime()
                .toInstant().plus(REFRESHABLE_DURATION, ChronoUnit.SECONDS).toEpochMilli())
                : signedJWT.getJWTClaimsSet().getExpirationTime();

        boolean verified = signedJWT.verify(verifier);
        if (!verified || !expiryTime.after(new Date())) {
            throw new AppException(ErrorCode.TOKEN_INVALID);
        }

        if (invalidatedTokenRepository.existsById(signedJWT.getJWTClaimsSet().getJWTID())) {
            throw new AppException(ErrorCode.TOKEN_INVALID);
        }

        return signedJWT;
    }

    private String generateToken(User user, String type, long durationSeconds) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(user.getEmail())
                .issuer("hourlink.vn")
                .issueTime(new Date())
                .expirationTime(new Date(Instant.now().plus(durationSeconds, ChronoUnit.SECONDS).toEpochMilli()))
                .jwtID(UUID.randomUUID().toString())
                .claim("type", type)
                .claim("userId", user.getId().toString())
                .claim("scope", buildScope(user))
                .build();

        JWSObject jwsObject = new JWSObject(header, new Payload(claimsSet.toJSONObject()));
        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Cannot create token", e);
            throw new RuntimeException(e);
        }
    }

    private String buildScope(User user) {
        return resolveCurrentScope(user);
    }

    /**
     * Luôn lấy quyền hiện tại từ DB, không tin scope cũ nằm trong access token.
     * Với dữ liệu cũ bị lệch userType/user_role, userType quyết định quyền nghiệp vụ;
     * ROLE_ADMIN chỉ được công nhận khi có mapping thật trong user_role.
     */
    public String resolveCurrentScope(User user) {
        java.util.List<String> storedRoles = userRoleRepository.findRoleCodesByUserId(user.getId());
        if (storedRoles.contains("ROLE_ADMIN")) {
            return "ROLE_ADMIN";
        }
        return user.getUserType() == com.hourlink.user.enums.UserType.organization
                ? "ROLE_ORGANIZATION"
                : "ROLE_USER";
    }
}
