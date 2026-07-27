package com.hourlink.chat.enums;

/**
 * ChatReportReason — Lý do báo cáo một tin nhắn (chức năng 9.10 + 9.22).
 *
 * <p>Cố ý tách khỏi {@code report.enums.ReportReason} (hiện là enum rỗng thuộc
 * phạm vi chức năng 9.22 chưa triển khai) để module Chat không phụ thuộc vào
 * module chưa hoàn thiện. Khi làm 9.22 cần cân nhắc hợp nhất hai enum này.</p>
 */
public enum ChatReportReason {
    /** Nội dung xúc phạm */
    OFFENSIVE,

    /** Quấy rối */
    HARASSMENT,

    /** Spam, làm phiền */
    SPAM,

    /** Lừa đảo */
    SCAM,

    /** Yêu cầu thanh toán bằng tiền ngoài hệ thống */
    OUTSIDE_PAYMENT,

    /** Yêu cầu chia sẻ mật khẩu hoặc mã OTP */
    ASK_CREDENTIALS,

    /** Lý do khác (bắt buộc mô tả thêm) */
    OTHER
}
