package com.hourlink.chat.enums;

/**
 * ChatReportStatus — Trạng thái xử lý báo cáo tin nhắn (chức năng 9.10).
 */
public enum ChatReportStatus {
    /** Mới gửi, chờ admin xem xét */
    PENDING,

    /** Admin đã xem xét */
    REVIEWED,

    /** Admin kết luận không vi phạm */
    DISMISSED,

    /** Admin đã xử lý (cảnh cáo / khóa tài khoản) */
    ACTIONED
}
