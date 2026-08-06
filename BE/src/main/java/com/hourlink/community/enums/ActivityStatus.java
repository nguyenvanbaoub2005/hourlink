package com.hourlink.community.enums;

/**
 * Trạng thái của hoạt động cộng đồng.
 * OPEN       → đang mở đăng ký
 * CLOSED     → đã đóng đăng ký (đủ chỗ hoặc tổ chức đóng thủ công)
 * COMPLETED  → hoạt động đã kết thúc, tổ chức đã xác nhận
 * CANCELLED  → hoạt động bị hủy
 */
public enum ActivityStatus {
    OPEN,
    CLOSED,
    COMPLETED,
    CANCELLED
}
