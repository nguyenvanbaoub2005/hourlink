package com.hourlink.wallet.controller;


import com.hourlink.wallet.service.WalletService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

/**
 * WalletController — TODO: implement endpoints cho module wallet.
 */
@Tag(name = "Wallet Management")
@RestController
@RequestMapping("/wallet")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class WalletController {

    WalletService walletService;

    // TODO: thêm các endpoints
}
