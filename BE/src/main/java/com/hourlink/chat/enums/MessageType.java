package com.hourlink.chat.enums;

/**
 * MessageType — Phân loại tin nhắn trong cuộc trò chuyện (chức năng 9.10).
 */
public enum MessageType {
    /** Tin nhắn văn bản thông thường */
    TEXT,

    /** Hình ảnh (upload lên Cloudinary) */
    IMAGE,

    /** Tài liệu: pdf, doc, docx, ppt, pptx (upload lên Cloudinary) */
    DOCUMENT,

    /** Vị trí gặp mặt (latitude / longitude) */
    LOCATION,

    /** Link phòng họp online (Google Meet, Zoom...) */
    MEETING_LINK,

    /** Đề xuất đổi lịch — gắn với Invitation.rescheduleTime */
    RESCHEDULE_PROPOSAL,

    /** Card lịch hẹn — hiển thị thông tin lịch hẹn trong chat */
    APPOINTMENT_CARD,

    /** Tin nhắn hệ thống (mở đầu cuộc trò chuyện, thông báo trạng thái) */
    SYSTEM
}
