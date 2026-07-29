package com.hourlink.appointment.enums;

/**
 * AppointmentStatus — Trạng thái của một lịch hẹn hỗ trợ (chức năng 9.11).
 */
public enum AppointmentStatus {
    PENDING,        // Chờ đối phương xác nhận
    CONFIRMED,      // Đã xác nhận (đã tạm giữ Time Credit)
    UPCOMING,       // Sắp diễn ra
    IN_PROGRESS,    // Đang diễn ra (đã check-in QR/OTP thành công)
    COMPLETED,      // Đã hoàn thành (đã chuyển Time Credit)
    CANCELLED,      // Đã hủy
    DISPUTED,       // Đang có tranh chấp
    RESCHEDULED     // Đã đề xuất đổi giờ
}
