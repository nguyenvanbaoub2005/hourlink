package com.hourlink.invitation.enums;

/**
 * InvitationStatus — Trạng thái lời mời hỗ trợ (chức năng 9.9).
 */
public enum InvitationStatus {
    /** Đang chờ người nhận phản hồi */
    PENDING,

    /** Người nhận đã chấp nhận */
    ACCEPTED,

    /** Người nhận đã từ chối */
    REJECTED,

    /** Người gửi hủy lời mời */
    CANCELLED,

    /** Người nhận đề xuất thời gian khác (cần requester xác nhận lại) */
    RESCHEDULED
}
