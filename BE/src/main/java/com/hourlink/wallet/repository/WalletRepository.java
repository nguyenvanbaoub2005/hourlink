package com.hourlink.wallet.repository;

import com.hourlink.wallet.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, UUID> {

    /** Tìm ví theo userId — dùng trong mọi nghiệp vụ Wallet */
    Optional<Wallet> findByUserId(UUID userId);

    /** Kiểm tra user đã có ví chưa — dùng khi initWallet */
    boolean existsByUserId(UUID userId);
}
