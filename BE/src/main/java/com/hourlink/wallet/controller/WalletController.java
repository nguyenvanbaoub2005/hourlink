package com.hourlink.wallet.controller;

import com.hourlink.common.response.ApiResponse;
import com.hourlink.wallet.dto.response.WalletResponse;
import com.hourlink.wallet.dto.response.WalletTransactionResponse;
import com.hourlink.wallet.service.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

/**
 * WalletController — API endpoints cho module Wallet (chức năng 9.16).
 */
@Tag(name = "Wallet Management", description = "Quản lý ví Time Credit và lịch sử giao dịch")
@RestController
@RequestMapping("/wallet")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class WalletController {

    WalletService walletService;

    @Operation(
            summary = "Lấy thông tin ví Time Credit",
            description = "Trả về số dư khả dụng, số đang tạm giữ, tổng đã kiếm và tổng đã dùng của người dùng hiện tại"
    )
    @GetMapping
    public ApiResponse<WalletResponse> getMyWallet() {
        return ApiResponse.success("Lấy thông tin ví thành công", walletService.getMyWallet());
    }

    @Operation(
            summary = "Lịch sử giao dịch Time Credit",
            description = "Danh sách giao dịch của người dùng, sắp xếp mới nhất trước, có phân trang"
    )
    @GetMapping("/transactions")
    public ApiResponse<Page<WalletTransactionResponse>> getMyTransactions(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success("Lấy lịch sử giao dịch thành công",
                walletService.getMyTransactions(page, size));
    }
}
