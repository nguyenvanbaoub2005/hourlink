package com.hourlink.appointment.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VerifyCodeRequest {

    @NotBlank(message = "Mã xác nhận không được để trống")
    String code;

    /** Người dùng đã xác nhận cảnh báo khi muốn bắt đầu trước giờ hẹn. */
    Boolean allowEarlyStart;
}
