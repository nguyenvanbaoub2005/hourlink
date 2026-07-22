package com.hourlink.security;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.*;
import com.nimbusds.jwt.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

/**
 * JwtService — Tạo và xác minh JWT token cho HourLink.
 * Dùng thuật toán HMAC SHA-512 (HS512) với Nimbus JOSE — giống SCMS.
 */
@Slf4j
@Service
public class JwtService {

    @Value("${jwt.signerKey}")
    private String signerKey;

    @Value("${jwt.valid-duration}")
    private long validDuration;        // giây

    @Value("${jwt.refreshable-duration}")
    private long refreshableDuration;  // giây

    // ─── Generate ──────────────────────────────────────────────────

    /**
     * Tạo access token.
     * @param email    subject (email của user)
     * @param role     ROLE_USER | ROLE_ADMIN | ROLE_ORG
     * @param userId   UUID của user (claim "uid")
     */
    public String generateAccessToken(String email, String role, String userId) {
        return buildToken(email, role, userId, validDuration, "access");
    }

    /**
     * Tạo refresh token.
     */
    public String generateRefreshToken(String email, String role, String userId) {
        return buildToken(email, role, userId, refreshableDuration, "refresh");
    }

    private String buildToken(String email, String role, String userId,
                              long durationSeconds, String type) {
        try {
            JWSSigner signer = new MACSigner(signerKey.getBytes());

            JWTClaimsSet claims = new JWTClaimsSet.Builder()
                    .subject(email)
                    .issuer("hourlink.vn")
                    .issueTime(new Date())
                    .expirationTime(Date.from(
                            Instant.now().plus(durationSeconds, ChronoUnit.SECONDS)))
                    .jwtID(UUID.randomUUID().toString())
                    .claim("scope", role)
                    .claim("uid", userId)
                    .claim("type", type)
                    .build();

            SignedJWT signedJWT = new SignedJWT(
                    new JWSHeader(JWSAlgorithm.HS512), claims);
            signedJWT.sign(signer);

            return signedJWT.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("Không thể tạo JWT token", e);
        }
    }

    // ─── Verify ────────────────────────────────────────────────────

    /**
     * Xác minh token. Ném exception nếu không hợp lệ hoặc hết hạn.
     * @param isRefresh true nếu verify refresh token (bỏ qua expiry để cho phép refresh)
     */
    public SignedJWT verifyToken(String token, boolean isRefresh) throws Exception {
        JWSVerifier verifier = new MACVerifier(signerKey.getBytes());
        SignedJWT signedJWT  = SignedJWT.parse(token);

        if (!signedJWT.verify(verifier)) {
            throw new RuntimeException("Chữ ký JWT không hợp lệ");
        }

        Date expiry = signedJWT.getJWTClaimsSet().getExpirationTime();
        if (!isRefresh && expiry.before(new Date())) {
            throw new RuntimeException("Token đã hết hạn");
        }

        if (isRefresh) {
            // Kiểm tra trong khoảng refreshable duration
            Instant issueTime = signedJWT.getJWTClaimsSet().getIssueTime().toInstant();
            if (issueTime.plus(refreshableDuration, ChronoUnit.SECONDS).isBefore(Instant.now())) {
                throw new RuntimeException("Refresh token đã hết hạn");
            }
        }

        return signedJWT;
    }

    // ─── Extract ───────────────────────────────────────────────────

    public String extractEmail(SignedJWT jwt) throws Exception {
        return jwt.getJWTClaimsSet().getSubject();
    }

    public String extractRole(SignedJWT jwt) throws Exception {
        return jwt.getJWTClaimsSet().getStringClaim("scope");
    }

    public String extractTokenType(SignedJWT jwt) throws Exception {
        return jwt.getJWTClaimsSet().getStringClaim("type");
    }
}
