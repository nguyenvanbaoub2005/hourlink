package com.hourlink.wallet.enums;

/**
 * WalletTxType — Loại giao dịch Time Credit trong ví HourLink.
 *
 * EARN     : Provider nhận Time Credit sau khi hoàn thành buổi hỗ trợ.
 * SPEND    : Receiver bị trừ Time Credit sau khi hoàn thành buổi hỗ trợ.
 * HOLD     : Tạm giữ Time Credit của Receiver khi Appointment chuyển sang CONFIRMED.
 * RELEASE  : Hoàn trả Time Credit tạm giữ khi Appointment bị hủy hợp lệ.
 * REFUND   : Admin hoàn trả Time Credit trong quá trình xử lý tranh chấp.
 * BONUS    : Tặng thưởng từ hoạt động cộng đồng hoặc tặng khởi đầu khi đăng ký.
 * ADJUSTMENT : Admin điều chỉnh thủ công (tăng/giảm).
 */
public enum WalletTxType {
    EARN,
    SPEND,
    HOLD,
    RELEASE,
    REFUND,
    BONUS,
    ADJUSTMENT
}
