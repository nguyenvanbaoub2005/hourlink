package com.hourlink.invitation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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
     * Hành động phản hồi của receiver: ACCEPT, REJECT, RESCHEDULE.
     * Quyết định của sender sau khi đổi giờ: ACCEPT_RESCHEDULE, REJECT_RESCHEDULE.
     */
    @NotBlank(message = "Hành động phản hồi không được để trống")
    @Pattern(
            regexp = "(?i)ACCEPT|REJECT|RESCHEDULE|ACCEPT_RESCHEDULE|REJECT_RESCHEDULE",
            message = "Hành động phản hồi không hợp lệ"
    )
    String action;

    /** Lý do từ chối (bắt buộc khi action = REJECT) */
    @Size(max = 500, message = "Lý do từ chối không được vượt quá 500 ký tự")
    String rejectReason;

    /** Thời gian đề xuất mới (bắt buộc khi action = RESCHEDULE) */
    @Size(max = 200, message = "Thời gian đề xuất không được vượt quá 200 ký tự")
    String rescheduleTime;
}
