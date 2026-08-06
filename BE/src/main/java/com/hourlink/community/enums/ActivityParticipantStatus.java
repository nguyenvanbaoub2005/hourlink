package com.hourlink.community.enums;

/**
 * Trạng thái đăng ký tham gia hoạt động cộng đồng.
 * REGISTERED  → đã đăng ký, chờ hoạt động diễn ra
 * CANCELLED   → đã hủy đăng ký
 * CONFIRMED   → tổ chức đã xác nhận tham gia + ghi nhận giờ đóng góp
 */
public enum ActivityParticipantStatus {
    REGISTERED,
    CANCELLED,
    CONFIRMED
}
