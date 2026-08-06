package com.hourlink.wallet.service;

import com.hourlink.appointment.entity.Appointment;
import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.common.util.SecurityUtil;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import com.hourlink.wallet.dto.response.WalletResponse;
import com.hourlink.wallet.dto.response.WalletTransactionResponse;
import com.hourlink.wallet.entity.Wallet;
import com.hourlink.wallet.entity.WalletTransaction;
import com.hourlink.wallet.enums.WalletTxType;
import com.hourlink.wallet.repository.WalletRepository;
import com.hourlink.wallet.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * WalletService — Business logic cho module Wallet (chức năng 9.16 & 9.17).
 *
 * <p>Các phương thức internal (holdCredit, transferCredit, releaseCredit)
 * được gọi trong cùng @Transactional với AppointmentService để đảm bảo
 * tính toàn vẹn dữ liệu (nếu Appointment save lỗi thì Wallet cũng rollback).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository txRepository;
    private final UserRepository userRepository;

    // ─── 1. Khởi tạo ví khi đăng ký (gọi từ AuthService) ────────────────────

    /**
     * Tạo Wallet mới với balance = 5.0 Time Credit khởi đầu.
     * Được gọi ngay sau khi User được lưu vào DB trong quá trình đăng ký.
     */
    @Transactional
    public Wallet initWallet(User user) {
        if (walletRepository.existsByUserId(user.getId())) {
            log.warn("initWallet called but wallet already exists for user [{}]", user.getId());
            return walletRepository.findByUserId(user.getId()).orElseThrow();
        }

        Wallet wallet = Wallet.builder()
                .user(user)
                .balance(5.0)
                .heldAmount(0.0)
                .totalEarned(5.0)
                .totalUsed(0.0)
                .build();
        wallet = walletRepository.save(wallet);

        // Ghi giao dịch BONUS khởi đầu
        recordTransaction(wallet, null, WalletTxType.BONUS, 5.0, wallet.getBalance(),
                "Time Credit khởi đầu khi tham gia HourLink");

        log.info("Wallet initialized for user [{}] with 5.0 Time Credit", user.getId());
        return wallet;
    }

    // ─── 2. Đọc thông tin ví (API endpoint) ──────────────────────────────────

    /** Lấy thông tin ví của người dùng đang đăng nhập. */
    public WalletResponse getMyWallet() {
        User currentUser = getCurrentUser();
        Wallet wallet = getWalletByUser(currentUser);
        return WalletResponse.fromEntity(wallet);
    }

    /** Lấy lịch sử giao dịch phân trang, mới nhất trước. */
    public Page<WalletTransactionResponse> getMyTransactions(int page, int size) {
        User currentUser = getCurrentUser();
        Wallet wallet = getWalletByUser(currentUser);
        return txRepository.findByWalletIdOrderByCreatedAtDesc(
                wallet.getId(), PageRequest.of(page, size))
                .map(WalletTransactionResponse::fromEntity);
    }

    // ─── 3. Wallet Hooks — gọi từ AppointmentService (cùng @Transactional) ──

    /**
     * HOOK: Appointment → CONFIRMED.
     * Tạm giữ {@code amount} Time Credit từ ví của Receiver.
     * Ném INSUFFICIENT_CREDIT nếu số dư không đủ.
     */
    @Transactional
    public void holdCredit(User receiver, Double amount, Appointment appointment) {
        Wallet wallet = getWalletByUser(receiver);

        if (wallet.getBalance() < amount) {
            throw new AppException(ErrorCode.INSUFFICIENT_CREDIT);
        }

        wallet.setBalance(wallet.getBalance() - amount);
        wallet.setHeldAmount(wallet.getHeldAmount() + amount);
        walletRepository.save(wallet);

        recordTransaction(wallet, appointment, WalletTxType.HOLD, amount, wallet.getBalance(),
                "Tạm giữ cho lịch hẹn: " + appointment.getTitle());

        log.info("HOLD {} TC from receiver [{}] for appointment [{}]",
                amount, receiver.getId(), appointment.getId());
    }

    /**
     * HOOK: Appointment → COMPLETED (cả 2 bên đã xác nhận).
     * Trừ Time Credit của Receiver (SPEND) và cộng cho Provider (EARN).
     */
    @Transactional
    public void transferCredit(Appointment appointment) {
        User receiver = appointment.getReceiver();
        User provider = appointment.getProvider();
        Double amount  = appointment.getTimeCreditAmount();

        // --- Receiver: release hold → SPEND ---
        Wallet receiverWallet = getWalletByUser(receiver);
        if (receiverWallet.getHeldAmount() < amount) {
            // Fallback: trừ thẳng balance nếu chưa hold (trường hợp bất thường)
            log.warn("transferCredit: held_amount < amount for receiver [{}]. Deducting from balance.", receiver.getId());
            if (receiverWallet.getBalance() < amount) {
                throw new AppException(ErrorCode.INSUFFICIENT_CREDIT);
            }
            receiverWallet.setBalance(receiverWallet.getBalance() - amount);
        } else {
            receiverWallet.setHeldAmount(receiverWallet.getHeldAmount() - amount);
        }
        receiverWallet.setTotalUsed(receiverWallet.getTotalUsed() + amount);
        walletRepository.save(receiverWallet);

        recordTransaction(receiverWallet, appointment, WalletTxType.SPEND, amount,
                receiverWallet.getBalance(),
                "Thanh toán cho lịch hẹn: " + appointment.getTitle());

        // --- Provider: EARN ---
        Wallet providerWallet = getWalletByUser(provider);
        providerWallet.setBalance(providerWallet.getBalance() + amount);
        providerWallet.setTotalEarned(providerWallet.getTotalEarned() + amount);
        walletRepository.save(providerWallet);

        recordTransaction(providerWallet, appointment, WalletTxType.EARN, amount,
                providerWallet.getBalance(),
                "Nhận Time Credit từ lịch hẹn: " + appointment.getTitle());

        log.info("TRANSFER {} TC: receiver [{}] → provider [{}] for appointment [{}]",
                amount, receiver.getId(), provider.getId(), appointment.getId());
    }

    /**
     * HOOK: Appointment → CANCELLED (sau khi đã CONFIRMED, tức đã hold).
     * Hoàn trả Time Credit tạm giữ về balance của Receiver.
     */
    @Transactional
    public void releaseCredit(Appointment appointment) {
        User receiver = appointment.getReceiver();
        Double amount  = appointment.getTimeCreditAmount();

        Wallet wallet = getWalletByUser(receiver);

        // Chỉ release nếu thực sự đang hold
        if (wallet.getHeldAmount() <= 0) {
            log.warn("releaseCredit: no held amount to release for receiver [{}], appointment [{}]",
                    receiver.getId(), appointment.getId());
            return;
        }

        double releaseAmount = Math.min(amount, wallet.getHeldAmount());
        wallet.setHeldAmount(wallet.getHeldAmount() - releaseAmount);
        wallet.setBalance(wallet.getBalance() + releaseAmount);
        walletRepository.save(wallet);

        recordTransaction(wallet, appointment, WalletTxType.RELEASE, releaseAmount,
                wallet.getBalance(),
                "Hoàn trả Time Credit từ lịch hẹn đã hủy: " + appointment.getTitle());

        log.info("RELEASE {} TC to receiver [{}] for cancelled appointment [{}]",
                releaseAmount, receiver.getId(), appointment.getId());
    }

    // ─── 4. Internal helpers ──────────────────────────────────────────────────

    /** Tìm ví theo user; tự động tạo nếu chưa có (dành cho acc cũ). */
    public Wallet getWalletByUser(User user) {
        return walletRepository.findByUserId(user.getId())
                .orElseGet(() -> initWallet(user));
    }

    /** Ghi bản ghi WalletTransaction. Gọi bên trong @Transactional của caller. */
    private WalletTransaction recordTransaction(Wallet wallet,
                                                Appointment appointment,
                                                WalletTxType type,
                                                Double amount,
                                                Double balanceAfter,
                                                String description) {
        WalletTransaction tx = WalletTransaction.builder()
                .wallet(wallet)
                .appointment(appointment)
                .type(type)
                .amount(amount)
                .balanceAfter(balanceAfter)
                .description(description)
                .build();
        return txRepository.save(tx);
    }

    // ─── 5. Community Hook (US-38) ────────────────────────────────────────────

    /**
     * Cộng Time Credit BONUS vào ví của user sau khi tổ chức xác nhận tham gia hoạt động.
     * Được gọi từ CommunityService trong cùng @Transactional để đảm bảo toàn vẹn dữ liệu.
     *
     * @param user        Người nhận Time Credit
     * @param amount      Số TC cộng thêm
     * @param description Mô tả giao dịch
     */
    @Transactional
    public void addTimeCredit(User user, Double amount, String description) {
        Wallet wallet = getWalletByUser(user);
        wallet.setBalance(wallet.getBalance() + amount);
        wallet.setTotalEarned(wallet.getTotalEarned() + amount);
        walletRepository.save(wallet);

        recordTransaction(wallet, null, WalletTxType.BONUS, amount, wallet.getBalance(), description);

        log.info("COMMUNITY BONUS: +{} TC → user [{}] | reason: {}", amount, user.getId(), description);
    }

    private User getCurrentUser() {
        String email = SecurityUtil.getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }
}
