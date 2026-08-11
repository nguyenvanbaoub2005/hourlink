package com.hourlink.chat.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

/**
 * BlockedUserResponse — Một người dùng trong danh sách đã chặn (chức năng 9.10).
 */
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BlockedUserResponse {

    /** ID bản ghi chặn */
    UUID id;

    UUID userId;
    String fullName;
    String avatarUrl;

    String reason;
    Instant blockedAt;
}
