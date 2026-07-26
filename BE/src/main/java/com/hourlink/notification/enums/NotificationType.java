package com.hourlink.notification.enums;

/**
 * NotificationType — Phân loại thông báo trong HourLink.
 */
public enum NotificationType {
    /** Nhận được lời mời hỗ trợ mới */
    INVITATION_RECEIVED,

    /** Lời mời của bạn được chấp nhận */
    INVITATION_ACCEPTED,

    /** Lời mời của bạn bị từ chối */
    INVITATION_REJECTED,

    /** Người nhận đề xuất đổi thời gian */
    INVITATION_RESCHEDULED,

    /** Lời mời bị hủy bởi người gửi */
    INVITATION_CANCELLED,

    /** Lịch hẹn sắp đến */
    APPOINTMENT_REMINDER,

    /** Có đánh giá mới */
    NEW_RATING,
}
