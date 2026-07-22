package com.hourlink.common.constant;

/**
 * AppConstants — Hằng số toàn cục của HourLink.
 */
public final class AppConstants {

    private AppConstants() {}

    // Phân trang mặc định
    public static final int DEFAULT_PAGE = 0;
    public static final int DEFAULT_PAGE_SIZE = 10;
    public static final int MAX_PAGE_SIZE = 50;

    // Time Credit
    public static final double DEFAULT_CREDIT_PER_HOUR = 1.0;
    public static final double INITIAL_CREDIT_BALANCE  = 5.0; // Credit tặng khi đăng ký

    // OTP
    public static final int OTP_LENGTH          = 6;
    public static final int OTP_EXPIRE_MINUTES  = 5;

    // Reputation
    public static final double DEFAULT_REPUTATION_SCORE = 5.0;

    // Security roles
    public static final String ROLE_USER   = "ROLE_USER";
    public static final String ROLE_ADMIN  = "ROLE_ADMIN";
    public static final String ROLE_ORG    = "ROLE_ORG";

    // Token type (JWT claim)
    public static final String TOKEN_TYPE_ACCESS  = "access";
    public static final String TOKEN_TYPE_REFRESH = "refresh";
}
