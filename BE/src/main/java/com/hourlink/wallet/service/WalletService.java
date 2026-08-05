package com.hourlink.wallet.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * WalletService — TODO: implement business logic cho module wallet.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WalletService {
    // TODO: inject repositories + implement methods

    @Transactional
    public void addTimeCredit(UUID userId, int amount, String description) {
        // FIXME: Đây là method giả lập để CommunityService (US-38) có thể gọi.
        // Khi làm module Wallet sẽ code logic thực sự cộng TC và lưu transaction.
        log.info("Mock Wallet API: Added {} TC to user {} - Reason: {}", amount, userId, description);
    }
}
