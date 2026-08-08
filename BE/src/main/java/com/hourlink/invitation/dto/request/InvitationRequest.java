package com.hourlink.invitation.dto.request;

import com.hourlink.skill.enums.SessionFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
    @Size(max = 500, message = "Nội dung yêu cầu không được vượt quá 500 ký tự")
    String content;

    /** Tin nhắn giới thiệu cá nhân */
    @Size(max = 500, message = "Tin nhắn giới thiệu không được vượt quá 500 ký tự")
    String message;

    /** Thời gian đề xuất (ví dụ: "Tối thứ Bảy 19:00") */
    @Size(max = 200, message = "Thời gian đề xuất không được vượt quá 200 ký tự")
    String proposedTime;

    /** Thời lượng đề xuất (phút) */
    @Min(value = 30, message = "Thời lượng tối thiểu là 30 phút")
    @Max(value = 480, message = "Thời lượng tối đa là 480 phút")
    Integer duration;

    /** Hình thức hỗ trợ */
    @NotNull(message = "Hình thức hỗ trợ không được để trống")
    SessionFormat format;
}
