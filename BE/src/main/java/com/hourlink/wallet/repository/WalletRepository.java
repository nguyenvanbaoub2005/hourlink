package com.hourlink.wallet.repository;

import com.hourlink.wallet.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, UUID>, JpaSpecificationExecutor<Wallet> {

    interface WalletOverviewProjection {
        Long getTotalWallets();
        Double getTotalAvailableBalance();
        Double getTotalHeldAmount();
        Double getTotalEarned();
        Double getTotalUsed();
        Long getWalletsWithHeldCredit();
        Long getInconsistentWallets();
    }

    @Override
    @EntityGraph(attributePaths = "user")
    Page<Wallet> findAll(Specification<Wallet> spec, Pageable pageable);

    /** Tìm ví theo userId — dùng trong mọi nghiệp vụ Wallet */
    Optional<Wallet> findByUserId(UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = "user")
    @Query("SELECT w FROM Wallet w WHERE w.user.id = :userId")
    Optional<Wallet> findByUserIdForUpdate(@Param("userId") UUID userId);

    /** Kiểm tra user đã có ví chưa — dùng khi initWallet */
    boolean existsByUserId(UUID userId);

    @Query("""
            SELECT COUNT(w) AS totalWallets,
                   COALESCE(SUM(w.balance), 0.0) AS totalAvailableBalance,
                   COALESCE(SUM(w.heldAmount), 0.0) AS totalHeldAmount,
                   COALESCE(SUM(w.totalEarned), 0.0) AS totalEarned,
                   COALESCE(SUM(w.totalUsed), 0.0) AS totalUsed,
                   COALESCE(SUM(CASE WHEN w.heldAmount > 0.009 THEN 1 ELSE 0 END), 0) AS walletsWithHeldCredit,
                   COALESCE(SUM(CASE WHEN ABS((w.balance + w.heldAmount)
                         - (w.totalEarned - w.totalUsed)) > 0.009 THEN 1 ELSE 0 END), 0) AS inconsistentWallets
            FROM Wallet w
            """)
    WalletOverviewProjection getOverview();

    @Query("""
            SELECT COUNT(u)
            FROM User u
            WHERE u.isDeleted = false
              AND NOT EXISTS (SELECT w.id FROM Wallet w WHERE w.user = u)
              AND NOT EXISTS (
                  SELECT ur.id FROM UserRole ur
                  WHERE ur.user = u AND ur.role.roleCode = 'ROLE_ADMIN'
              )
            """)
    long countActiveNonAdminUsersWithoutWallet();
}
