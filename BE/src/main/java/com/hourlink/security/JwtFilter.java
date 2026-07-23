package com.hourlink.security;

import com.hourlink.auth.service.AuthService;
import com.hourlink.user.repository.UserRepository;
import com.nimbusds.jwt.SignedJWT;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final AuthService authService;
    private final UserRepository userRepository;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/auth/")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/error");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7).trim();
        if (token.toLowerCase().startsWith("bearer ")) {
            token = token.substring(7).trim();
        }
        token = token.replace("\"", "");

        try {
            SignedJWT signedJWT = authService.verifyToken(token, false);

            String tokenType = signedJWT.getJWTClaimsSet().getStringClaim("type");
            if (!"access".equals(tokenType)) {
                filterChain.doFilter(request, response);
                return;
            }

            String email = signedJWT.getJWTClaimsSet().getSubject();
            String scope = signedJWT.getJWTClaimsSet().getStringClaim("scope");

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                userRepository.findByEmail(email).ifPresentOrElse(user -> {
                    var authorities = AuthorityUtils.commaSeparatedStringToAuthorityList(
                            scope != null ? scope.replace(" ", ",") : "");
                    var auth = new UsernamePasswordAuthenticationToken(email, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                    logger.info("Authenticated user: " + email);
                }, () -> logger.warn("User not found in DB: " + email));
            }

        } catch (Exception e) {
            logger.warn("Invalid JWT token: " + e.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
