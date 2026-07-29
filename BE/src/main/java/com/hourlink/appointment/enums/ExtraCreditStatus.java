package com.hourlink.appointment.enums;

/**
 * ExtraCreditStatus — Trạng thái xin thêm tín dụng giờ khi lịch hẹn kéo dài hơn dự kiến.
 */
public enum ExtraCreditStatus {
    NONE,       // Không xin thêm
    PENDING,    // Chờ duyệt
    APPROVED,   // Đã chấp thuận
    REJECTED    // Từ chối
}
