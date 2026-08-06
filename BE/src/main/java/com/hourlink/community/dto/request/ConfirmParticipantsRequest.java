package com.hourlink.community.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Request tổ chức xác nhận người tham gia và số giờ đóng góp (US-37).
 * Có thể xác nhận từng người hoặc xác nhận hàng loạt theo danh sách participantId.
 */
@Data
public class ConfirmParticipantsRequest {

    /**
     * Danh sách ID của ActivityParticipant cần xác nhận.
     * Để trống = xác nhận TẤT CẢ người đã đăng ký (status = REGISTERED).
     */
    private List<UUID> participantIds;

    /** Số giờ đóng góp thực tế */
    @NotNull(message = "Số giờ đóng góp không được để trống")
    @DecimalMin(value = "0.5", message = "Tối thiểu 0.5 giờ")
    private Double actualHours;

    /** Ghi chú của tổ chức */
    @Size(max = 500)
    private String confirmNote;
}
