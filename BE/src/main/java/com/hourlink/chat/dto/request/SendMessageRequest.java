package com.hourlink.chat.dto.request;

import com.hourlink.chat.enums.MessageType;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * SendMessageRequest — Gửi tin nhắn dạng TEXT / LOCATION / MEETING_LINK.
 * Ảnh và tài liệu đi qua endpoint multipart riêng.
 */
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SendMessageRequest {

    /** Loại tin nhắn cần gửi */
    @NotNull(message = "Loại tin nhắn không được để trống")
    MessageType type;

    /** Nội dung văn bản (bắt buộc với TEXT) */
    String content;

    /** Link phòng họp online (bắt buộc với MEETING_LINK) */
    String meetingLink;

    /** Vĩ độ (bắt buộc với LOCATION) */
    Double latitude;

    /** Kinh độ (bắt buộc với LOCATION) */
    Double longitude;

    /** Mô tả địa điểm (tùy chọn, đi kèm LOCATION) */
    String locationLabel;
}
