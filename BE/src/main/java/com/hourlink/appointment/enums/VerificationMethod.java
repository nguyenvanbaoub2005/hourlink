package com.hourlink.appointment.enums;

/**
 * VerificationMethod — Hình thức xác thực khi bắt đầu lịch hẹn (chức năng 9.14).
 */
public enum VerificationMethod {
    QR,     // Quét mã QR cho gặp trực tiếp (OFFLINE)
    OTP     // Nhập mã OTP 6 số cho gặp trực tuyến (ONLINE)
}
