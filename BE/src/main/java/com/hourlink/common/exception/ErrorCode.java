package com.hourlink.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

/**
 * ErrorCode — Tập trung toàn bộ mã lỗi của HourLink.
 * Prefix theo module:
 *   1xxx → Auth / User
 *   2xxx → Skill
 *   3xxx → HelpRequest
 *   4xxx → Invitation / Chat
 *   5xxx → Appointment
 *   6xxx → Wallet
 *   7xxx → Rating / Report / Dispute
 *   8xxx → Community / Notification
 *   9xxx → System / Admin
 */
@Getter
public enum ErrorCode {

    // ─── System ───────────────────────────────────────────────────────
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi hệ thống, vui lòng thử lại sau", HttpStatus.INTERNAL_SERVER_ERROR),
    NOT_FOUND(404,           "Không tìm thấy tài nguyên",               HttpStatus.NOT_FOUND),
    ACCESS_DENIED(403,       "Không có quyền truy cập",                 HttpStatus.FORBIDDEN),
    INVALID_REQUEST(400,     "Yêu cầu không hợp lệ",                    HttpStatus.BAD_REQUEST),
    UPLOAD_FAILED(9001,      "Lỗi upload file",                         HttpStatus.INTERNAL_SERVER_ERROR),

    // ─── Auth / User (1xxx) ───────────────────────────────────────────
    UNAUTHENTICATED(1000,          "Chưa xác thực, vui lòng đăng nhập",       HttpStatus.UNAUTHORIZED),
    EMAIL_ALREADY_EXISTS(1001,     "Email đã được sử dụng",                    HttpStatus.BAD_REQUEST),
    PHONE_ALREADY_EXISTS(1002,     "Số điện thoại đã được sử dụng",            HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(1003,           "Không tìm thấy người dùng",                HttpStatus.NOT_FOUND),
    WRONG_PASSWORD(1004,           "Mật khẩu không đúng",                      HttpStatus.BAD_REQUEST),
    ACCOUNT_LOCKED(1005,           "Tài khoản đã bị khóa",                     HttpStatus.FORBIDDEN),
    TOKEN_INVALID(1006,            "Token không hợp lệ hoặc đã hết hạn",       HttpStatus.UNAUTHORIZED),
    OTP_INVALID(1007,              "Mã OTP không đúng hoặc đã hết hạn",        HttpStatus.BAD_REQUEST),
    NEW_PASSWORD_SAME_AS_OLD(1008, "Mật khẩu mới phải khác mật khẩu cũ",      HttpStatus.BAD_REQUEST),
    ACCOUNT_NOT_VERIFIED(1009,     "Tài khoản chưa được xác minh",             HttpStatus.FORBIDDEN),

    // ─── Skill (2xxx) ─────────────────────────────────────────────────
    SKILL_NOT_FOUND(2001,          "Không tìm thấy kỹ năng",                   HttpStatus.NOT_FOUND),
    CATEGORY_NOT_FOUND(2002,       "Không tìm thấy danh mục kỹ năng",          HttpStatus.NOT_FOUND),
    SKILL_ALREADY_INACTIVE(2003,   "Kỹ năng đã bị ẩn",                         HttpStatus.BAD_REQUEST),

    // ─── HelpRequest (3xxx) ───────────────────────────────────────────
    REQUEST_NOT_FOUND(3001,        "Không tìm thấy yêu cầu hỗ trợ",            HttpStatus.NOT_FOUND),
    REQUEST_ALREADY_MATCHED(3002,  "Yêu cầu đã được ghép cặp",                 HttpStatus.BAD_REQUEST),
    REQUEST_ALREADY_CLOSED(3003,   "Yêu cầu đã đóng",                          HttpStatus.BAD_REQUEST),

    // ─── Invitation / Chat (4xxx) ─────────────────────────────────────
    INVITATION_NOT_FOUND(4001,     "Không tìm thấy lời mời",                   HttpStatus.NOT_FOUND),
    INVITATION_ALREADY_RESPONDED(4002, "Lời mời đã được phản hồi",             HttpStatus.BAD_REQUEST),
    CONVERSATION_NOT_FOUND(4003,   "Không tìm thấy cuộc trò chuyện",           HttpStatus.NOT_FOUND),
    USER_BLOCKED(4004,             "Không thể gửi tin nhắn đến người dùng này",HttpStatus.FORBIDDEN),
    MESSAGE_NOT_FOUND(4005,        "Không tìm thấy tin nhắn",                  HttpStatus.NOT_FOUND),
    CHAT_NOT_ALLOWED(4006,         "Chỉ có thể trò chuyện sau khi lời mời được chấp nhận", HttpStatus.FORBIDDEN),
    ALREADY_BLOCKED(4007,          "Bạn đã chặn người dùng này rồi",           HttpStatus.BAD_REQUEST),
    NOT_BLOCKED(4008,              "Bạn chưa chặn người dùng này",             HttpStatus.BAD_REQUEST),
    CANNOT_BLOCK_SELF(4009,        "Không thể tự chặn chính mình",             HttpStatus.BAD_REQUEST),
    MESSAGE_ALREADY_REPORTED(4010, "Bạn đã báo cáo tin nhắn này rồi",          HttpStatus.BAD_REQUEST),
    CANNOT_REPORT_OWN_MESSAGE(4011,"Không thể báo cáo tin nhắn của chính bạn", HttpStatus.BAD_REQUEST),

    // ─── Appointment (5xxx) ───────────────────────────────────────────
    APPOINTMENT_NOT_FOUND(5001,    "Không tìm thấy lịch hẹn",                  HttpStatus.NOT_FOUND),
    APPOINTMENT_INVALID_STATUS(5002, "Trạng thái lịch hẹn không hợp lệ",       HttpStatus.BAD_REQUEST),
    VERIFICATION_INVALID(5003,     "Mã xác minh không đúng hoặc đã hết hạn",   HttpStatus.BAD_REQUEST),
    ALREADY_CONFIRMED(5004,        "Bạn đã xác nhận buổi học này rồi",          HttpStatus.BAD_REQUEST),

    // ─── Wallet (6xxx) ────────────────────────────────────────────────
    WALLET_NOT_FOUND(6001,         "Không tìm thấy ví Time Credit",             HttpStatus.NOT_FOUND),
    INSUFFICIENT_CREDIT(6002,      "Số dư Time Credit không đủ",                HttpStatus.BAD_REQUEST),
    CREDIT_HELD_CONFLICT(6003,     "Time Credit đang bị tạm giữ",               HttpStatus.BAD_REQUEST),

    // ─── Rating / Report / Dispute (7xxx) ────────────────────────────
    RATING_NOT_FOUND(7001,         "Không tìm thấy đánh giá",                  HttpStatus.NOT_FOUND),
    ALREADY_RATED(7002,            "Bạn đã đánh giá buổi học này rồi",          HttpStatus.BAD_REQUEST),
    REPORT_NOT_FOUND(7003,         "Không tìm thấy báo cáo",                    HttpStatus.NOT_FOUND),
    DISPUTE_NOT_FOUND(7004,        "Không tìm thấy tranh chấp",                 HttpStatus.NOT_FOUND),
    DISPUTE_ALREADY_RESOLVED(7005, "Tranh chấp đã được giải quyết",             HttpStatus.BAD_REQUEST),
    REPORT_ALREADY_SUBMITTED(7006, "Bạn đã báo cáo nội dung này rồi",            HttpStatus.BAD_REQUEST),
    CANNOT_REPORT_SELF(7007,       "Không thể báo cáo nội dung của chính bạn",   HttpStatus.BAD_REQUEST),
    REPORT_TARGET_NOT_FOUND(7008,  "Không tìm thấy đối tượng cần báo cáo",       HttpStatus.NOT_FOUND),

    // ─── Community (8xxx) ────────────────────────────────────────────
    ACTIVITY_NOT_FOUND(8001,       "Không tìm thấy hoạt động cộng đồng",       HttpStatus.NOT_FOUND),
    ACTIVITY_FULL(8002,            "Hoạt động đã đủ người tham gia",            HttpStatus.BAD_REQUEST),
    ALREADY_REGISTERED(8003,       "Bạn đã đăng ký hoạt động này rồi",         HttpStatus.BAD_REQUEST),
    ACTIVITY_TIME_INVALID(8004,    "Thời gian hoạt động không hợp lệ",          HttpStatus.BAD_REQUEST),
    ACTIVITY_ALREADY_STARTED(8005, "Hoạt động đã bắt đầu, không thể thay đổi",  HttpStatus.BAD_REQUEST),
    ORGANIZER_CANNOT_REGISTER(8006,"Người tổ chức không thể đăng ký hoạt động của mình", HttpStatus.BAD_REQUEST),
    ACTIVITY_HAS_PARTICIPANTS(8007,"Không thể xóa hoạt động đang có người đăng ký", HttpStatus.BAD_REQUEST),
    ACTIVITY_NOT_ENDED(8008,       "Chỉ có thể xác nhận sau khi hoạt động kết thúc", HttpStatus.BAD_REQUEST),
    PARTICIPANT_NOT_REGISTERED(8009,"Người tham gia không ở trạng thái chờ xác nhận", HttpStatus.BAD_REQUEST),
    NO_PARTICIPANTS_TO_CONFIRM(8010,"Không có người tham gia cần xác nhận",      HttpStatus.BAD_REQUEST),
    EVIDENCE_REQUIRED(8011,       "Vui lòng chọn ít nhất một ảnh minh chứng",    HttpStatus.BAD_REQUEST),
    EVIDENCE_LIMIT_EXCEEDED(8012, "Chỉ được gửi tối đa 5 ảnh minh chứng",        HttpStatus.BAD_REQUEST),
    EVIDENCE_NOT_ALLOWED(8013,    "Không thể gửi minh chứng ở trạng thái hiện tại", HttpStatus.BAD_REQUEST),
    ACTIVITY_CANNOT_CANCEL(8014,  "Không thể hủy hoạt động ở trạng thái hiện tại", HttpStatus.BAD_REQUEST),
    ACTUAL_HOURS_INVALID(8015,    "Số giờ xác nhận không hợp lệ",                 HttpStatus.BAD_REQUEST),
    ORGANIZATION_NOT_FOLLOWABLE(8016, "Không thể theo dõi tổ chức này",           HttpStatus.BAD_REQUEST),
    COMMUNITY_CHAT_NOT_ALLOWED(8017, "Chỉ người đã đăng ký hoạt động mới có thể nhắn tin với tổ chức", HttpStatus.FORBIDDEN);

    // ─── Fields ──────────────────────────────────────────────────────
    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}
