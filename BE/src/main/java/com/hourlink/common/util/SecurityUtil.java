package com.hourlink.common.util;

import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * SecurityUtil — Tiện ích lấy thông tin người dùng đang đăng nhập.
 * Dùng ở Service layer để lấy email/username của current user.
 */
public final class SecurityUtil {

    private SecurityUtil() {}

    /**
     * Lấy email (subject) của người dùng đang đăng nhập.
     * Ném AppException nếu chưa xác thực.
     */
    public static String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return authentication.getName();
    }

    /**
     * Lấy email (subject) của người dùng hiện tại nếu có, trả về null nếu chưa đăng nhập hoặc anonymous.
     */
    public static String getCurrentUserEmailOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        return authentication.getName();
    }
}
