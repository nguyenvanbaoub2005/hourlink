package com.hourlink.invitation.dto.request;

import com.hourlink.skill.enums.SessionFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

/**
 * InvitationRequest — Dữ liệu gửi lời mời hỗ trợ (chức năng 9.9).
 */
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InvitationRequest {

    /** ID người nhận lời mời (helper) */
    @NotNull(message = "Người nhận không được để trống")
    UUID receiverId;

    /** Kỹ năng liên quan (tùy chọn - khi gửi từ màn Explore) */
    UUID skillId;

    /** Yêu cầu hỗ trợ liên kết (tùy chọn - khi gửi từ HelpRequest) */
    UUID helpRequestId;

    /** Nội dung cụ thể cần hỗ trợ */
    @NotBlank(message = "Nội dung yêu cầu không được để trống")
    String content;

    /** Tin nhắn giới thiệu cá nhân */
    String message;

    /** Thời gian đề xuất (ví dụ: "Tối thứ Bảy 19:00") */
    String proposedTime;

    /** Thời lượng đề xuất (phút) */
    Integer duration;

    /** Hình thức hỗ trợ */
    @NotNull(message = "Hình thức hỗ trợ không được để trống")
    SessionFormat format;
}
