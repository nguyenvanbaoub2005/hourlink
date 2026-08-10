package com.hourlink.wallet.repository;

import com.hourlink.wallet.entity.WalletTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import com.hourlink.wallet.enums.WalletTxType;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, UUID>,
        JpaSpecificationExecutor<WalletTransaction> {

    interface TodayTransactionOverviewProjection {
        Long getTransactionCount();
        Double getTransactionVolume();
        Long getAdjustmentCount();
        Double getAdjustmentVolume();
    }

    @Override
    @EntityGraph(attributePaths = {"wallet.user", "appointment"})
    Page<WalletTransaction> findAll(Specification<WalletTransaction> spec, Pageable pageable);

    /**
     * Lấy toàn bộ lịch sử giao dịch của một ví, sắp xếp mới nhất trước.
     * Dùng cho endpoint GET /wallet/transactions (phân trang).
     */
    Page<WalletTransaction> findByWalletIdOrderByCreatedAtDesc(UUID walletId, Pageable pageable);

    boolean existsByIdempotencyKey(String idempotencyKey);

    @EntityGraph(attributePaths = {"wallet.user", "appointment"})
    Optional<WalletTransaction> findByIdempotencyKey(String idempotencyKey);

    @EntityGraph(attributePaths = {"wallet.user", "appointment.provider", "appointment.receiver"})
    List<WalletTransaction> findAllByCreatedAtGreaterThanEqual(Instant createdAt);

    @EntityGraph(attributePaths = {"wallet.user", "appointment.provider", "appointment.receiver"})
    List<WalletTransaction> findByTypeAndCreatedAtGreaterThanEqual(WalletTxType type, Instant createdAt);

    @Query("""
            SELECT COUNT(tx) AS transactionCount,
                   COALESCE(SUM(ABS(tx.amount)), 0.0) AS transactionVolume,
                   COALESCE(SUM(CASE WHEN tx.type = com.hourlink.wallet.enums.WalletTxType.ADJUSTMENT
                         THEN 1 ELSE 0 END), 0) AS adjustmentCount,
                   COALESCE(SUM(CASE WHEN tx.type = com.hourlink.wallet.enums.WalletTxType.ADJUSTMENT
                         THEN ABS(tx.amount) ELSE 0.0 END), 0.0) AS adjustmentVolume
            FROM WalletTransaction tx
            WHERE tx.createdAt >= :since
            """)
    TodayTransactionOverviewProjection getOverviewSince(@Param("since") Instant since);
}
