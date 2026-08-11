package com.hourlink.community.enums;

/**
 * Trạng thái đăng ký tham gia hoạt động cộng đồng.
 * REGISTERED  → đã đăng ký, chờ hoạt động diễn ra
 * CANCELLED   → đã hủy đăng ký
 * CONFIRMED   → tổ chức đã xác nhận tham gia + ghi nhận giờ đóng góp
 * ABSENT      → tổ chức xác nhận người đăng ký không tham gia
 */
public enum ActivityParticipantStatus {
    REGISTERED,
    CANCELLED,
    CONFIRMED,
    ABSENT
}
