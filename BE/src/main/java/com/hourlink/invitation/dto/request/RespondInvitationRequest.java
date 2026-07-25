package com.hourlink.invitation.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * RespondInvitationRequest — Dữ liệu phản hồi lời mời hỗ trợ.
 * Dùng cho helper khi chấp nhận, từ chối, hoặc đề xuất thời gian khác.
 */
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RespondInvitationRequest {

    /**
     * Hành động phản hồi: ACCEPT, REJECT, RESCHEDULE
     */
    @NotNull(message = "Hành động phản hồi không được để trống")
    String action;

    /** Lý do từ chối (bắt buộc khi action = REJECT) */
    String rejectReason;

    /** Thời gian đề xuất mới (bắt buộc khi action = RESCHEDULE) */
    String rescheduleTime;
}
