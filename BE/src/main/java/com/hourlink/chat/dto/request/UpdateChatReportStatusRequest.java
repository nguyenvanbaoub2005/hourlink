package com.hourlink.chat.dto.request;

import com.hourlink.chat.enums.ChatReportStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateChatReportStatusRequest {
    @NotNull(message = "Trạng thái không được để trống")
    private ChatReportStatus status;
}
