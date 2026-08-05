package com.hourlink.report.enums;

/**
 * ReportStatus — Trạng thái xử lý báo cáo (US-40).
 */
public enum ReportStatus {
    /** Mới gửi, chờ admin xem xét */
    PENDING,
    /** Admin đang xem xét */
    REVIEWING,
    /** Đã giải quyết — vi phạm được xác nhận */
    RESOLVED,
    /** Đã bác bỏ — không có vi phạm */
    DISMISSED
}
