package com.hourlink.chat.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

/**
 * BlockUserRequest — Chặn một người dùng (chức năng 9.10).
 */
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BlockUserRequest {

    /** ID người cần chặn */
    @NotNull(message = "Người dùng cần chặn không được để trống")
    UUID userId;

    /** Lý do chặn (tùy chọn) */
    String reason;
}
