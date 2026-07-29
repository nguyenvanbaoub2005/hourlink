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

    /** Có tin nhắn mới trong cuộc trò chuyện */
    NEW_MESSAGE,

    /** Người kia đề xuất đổi lịch ngay trong cuộc trò chuyện */
    CHAT_RESCHEDULE_PROPOSED,

    /** Lịch hẹn sắp đến */
    APPOINTMENT_REMINDER,

    /** Có đánh giá mới */
    NEW_RATING,

    /** Tạo lịch hẹn mới */
    APPOINTMENT_CREATED,

    /** Xác nhận lịch hẹn */
    APPOINTMENT_CONFIRMED,

    /** Hủy lịch hẹn */
    APPOINTMENT_CANCELLED,

    /** Đổi lịch hẹn */
    APPOINTMENT_RESCHEDULED,

    /** Hoàn thành lịch hẹn */
    APPOINTMENT_COMPLETED,
}
