package com.hourlink.chat.dto.request;

import com.hourlink.chat.enums.ChatReportReason;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * ReportMessageRequest — Báo cáo một tin nhắn vi phạm (chức năng 9.10).
 */
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReportMessageRequest {

    /** Lý do báo cáo */
    @NotNull(message = "Lý do báo cáo không được để trống")
    ChatReportReason reason;

    /** Mô tả chi tiết (nên nhập khi chọn lý do OTHER) */
    String description;
}
