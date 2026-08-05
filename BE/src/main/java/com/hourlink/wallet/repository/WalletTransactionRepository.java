package com.hourlink.wallet.repository;

import com.hourlink.wallet.entity.WalletTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, UUID> {

    /**
     * Lấy toàn bộ lịch sử giao dịch của một ví, sắp xếp mới nhất trước.
     * Dùng cho endpoint GET /wallet/transactions (phân trang).
     */
    Page<WalletTransaction> findByWalletIdOrderByCreatedAtDesc(UUID walletId, Pageable pageable);
}
