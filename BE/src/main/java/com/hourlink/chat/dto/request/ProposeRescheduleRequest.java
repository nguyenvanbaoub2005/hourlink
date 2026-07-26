package com.hourlink.chat.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * ProposeRescheduleRequest — Đề xuất đổi lịch ngay trong cuộc trò chuyện.
 * Cập nhật luôn Invitation gắn với cuộc trò chuyện (chức năng 9.9 + 9.10).
 */
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProposeRescheduleRequest {

    /** Thời gian đề xuất mới, ví dụ "Tối thứ Bảy 19:00" */
    @NotBlank(message = "Thời gian đề xuất không được để trống")
    String proposedTime;

    /** Ghi chú thêm cho đề xuất (tùy chọn) */
    String note;
}
