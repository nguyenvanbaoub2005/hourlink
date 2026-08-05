package com.hourlink.community.enums;

/**
 * ParticipantStatus — Trạng thái tham gia hoạt động của người dùng.
 */
public enum ParticipantStatus {
    /** Đã đăng ký, chờ xác nhận */
    PENDING,
    
    /** Đã được tổ chức xác nhận tham gia và cộng TC */
    CONFIRMED,
    
    /** Đã hủy đăng ký */
    CANCELLED
}
