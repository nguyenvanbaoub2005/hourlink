package com.hourlink.common.util;

import com.hourlink.common.constant.AppConstants;

import java.security.SecureRandom;

/**
 * OtpUtil — Sinh mã OTP ngẫu nhiên cho:
 *  - Xác minh email / phone khi đăng ký
 *  - Xác nhận bắt đầu / kết thúc buổi hỗ trợ
 */
public final class OtpUtil {

    private static final SecureRandom RANDOM = new SecureRandom();

    private OtpUtil() {}

    /**
     * Sinh OTP số có độ dài = AppConstants.OTP_LENGTH (mặc định 6 ký tự).
     */
    public static String generate() {
        int bound = (int) Math.pow(10, AppConstants.OTP_LENGTH);
        int otp = RANDOM.nextInt(bound);
        return String.format("%0" + AppConstants.OTP_LENGTH + "d", otp);
    }
}
