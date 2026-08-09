package com.hourlink.chat.dto.response;

import com.hourlink.chat.enums.ChatReportReason;
import com.hourlink.chat.enums.ChatReportStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

/**
 * ChatReportResponse — Kết quả gửi báo cáo tin nhắn (chức năng 9.10).
 */
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatReportResponse {

    UUID id;
    UUID messageId;

    UUID reportedUserId;
    String reportedUserName;

    ChatReportReason reason;
    String description;
    String evidence;
    ChatReportStatus status;

    Instant createdAt;
}
