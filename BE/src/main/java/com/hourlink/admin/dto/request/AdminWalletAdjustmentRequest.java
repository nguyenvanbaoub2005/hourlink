package com.hourlink.admin.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class AdminWalletAdjustmentRequest {

    @NotNull(message = "Người dùng không được để trống")
    private UUID userId;

    /** Giá trị có dấu: số dương để cộng, số âm để trừ. */
    @NotNull(message = "Số Time Credit điều chỉnh không được để trống")
    @DecimalMin(value = "-100", message = "Chỉ được trừ tối đa 100 Time Credit mỗi lần")
    @DecimalMax(value = "100", message = "Chỉ được cộng tối đa 100 Time Credit mỗi lần")
    private BigDecimal amount;

    @NotBlank(message = "Lý do điều chỉnh không được để trống")
    @Size(max = 500, message = "Lý do điều chỉnh tối đa 500 ký tự")
    private String reason;

    /** Khóa idempotency do client sinh; mỗi thao tác phải dùng một UUID mới. */
    @NotNull(message = "Mã yêu cầu không được để trống")
    private UUID requestId;
}
