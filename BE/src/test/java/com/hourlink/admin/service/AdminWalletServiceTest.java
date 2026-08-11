package com.hourlink.admin.service;

import com.hourlink.admin.dto.request.AdminWalletAdjustmentRequest;
import com.hourlink.admin.dto.response.AdminWalletAdjustmentResponse;
import com.hourlink.admin.dto.response.AdminWalletAnomalyResponse;
import com.hourlink.admin.entity.UserAdminAction;
import com.hourlink.admin.enums.AdminWalletAnomalyType;
import com.hourlink.admin.repository.UserAdminActionRepository;
import com.hourlink.appointment.entity.Appointment;
import com.hourlink.common.exception.AppException;
import com.hourlink.notification.service.NotificationService;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import com.hourlink.user.repository.UserRoleRepository;
import com.hourlink.wallet.entity.Wallet;
import com.hourlink.wallet.entity.WalletTransaction;
import com.hourlink.wallet.enums.WalletTxType;
import com.hourlink.wallet.repository.WalletRepository;
import com.hourlink.wallet.repository.WalletTransactionRepository;
import com.hourlink.wallet.service.WalletService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminWalletServiceTest {

    @Mock WalletRepository walletRepository;
    @Mock WalletTransactionRepository transactionRepository;
    @Mock UserRepository userRepository;
    @Mock UserRoleRepository userRoleRepository;
    @Mock UserAdminActionRepository userAdminActionRepository;
    @Mock WalletService walletService;
    @Mock NotificationService notificationService;
    @InjectMocks AdminWalletService service;

    @Test
    void adjust_positiveAmountRoundsAndPreservesInvariant() {
        User admin = user("Admin", "admin@hourlink.vn");
        User target = user("Người dùng", "user@hourlink.vn");
        Wallet wallet = wallet(target, 3, 2, 5, 0);
        AdminWalletAdjustmentRequest request = request(target.getId(), "2.345", "Bù giao dịch", UUID.randomUUID());

        when(userRepository.findByEmailForUpdate(admin.getEmail())).thenReturn(Optional.of(admin));
        when(userRepository.findById(target.getId())).thenReturn(Optional.of(target));
        when(walletRepository.findByUserIdForUpdate(target.getId())).thenReturn(Optional.of(wallet));
        when(walletRepository.save(wallet)).thenReturn(wallet);
        when(transactionRepository.save(any(WalletTransaction.class))).thenAnswer(invocation -> {
            WalletTransaction transaction = invocation.getArgument(0);
            transaction.setId(UUID.randomUUID());
            transaction.setCreatedAt(Instant.now());
            return transaction;
        });

        AdminWalletAdjustmentResponse response = service.adjust(request, admin.getEmail());

        assertFalse(response.idempotentReplay());
        assertEquals(5.35, wallet.getBalance(), 0.0001);
        assertEquals(2, wallet.getHeldAmount(), 0.0001);
        assertEquals(7.35, wallet.getTotalEarned(), 0.0001);
        assertEquals(0, wallet.getTotalUsed(), 0.0001);
        assertEquals(wallet.getTotalEarned() - wallet.getTotalUsed(),
                wallet.getBalance() + wallet.getHeldAmount(), 0.0001);

        ArgumentCaptor<WalletTransaction> tx = ArgumentCaptor.forClass(WalletTransaction.class);
        verify(transactionRepository).save(tx.capture());
        assertEquals(WalletTxType.ADJUSTMENT, tx.getValue().getType());
        assertEquals(2.35, tx.getValue().getAmount(), 0.0001);
        assertEquals(admin.getId(), tx.getValue().getReferenceId());
        assertEquals("ADMIN_ADJUSTMENT:" + request.getRequestId(), tx.getValue().getIdempotencyKey());
        verify(userAdminActionRepository).save(any(UserAdminAction.class));
        verify(notificationService).createNotification(
                org.mockito.ArgumentMatchers.eq(target), any(), any(), any(), any());
    }

    @Test
    void initializeWallet_createsOnlyMissingWalletAndWritesAdminAudit() {
        User admin = user("Admin", "admin@hourlink.vn");
        User target = user("Người dùng cũ", "legacy@hourlink.vn");
        Wallet initialized = wallet(target, 5, 0, 5, 0);
        when(userRepository.findByEmail(admin.getEmail())).thenReturn(Optional.of(admin));
        when(userRepository.findByIdForUpdate(target.getId())).thenReturn(Optional.of(target));
        when(walletRepository.findByUserId(target.getId())).thenReturn(Optional.empty());
        when(walletService.initWallet(target)).thenReturn(initialized);

        var response = service.initializeWallet(target.getId(), admin.getEmail());

        assertEquals(initialized.getId(), response.walletId());
        assertEquals(5, response.balance(), 0.0001);
        verify(walletService).initWallet(target);
        verify(userAdminActionRepository).save(any(UserAdminAction.class));
    }

    @Test
    void initializeWallet_existingWalletIsIdempotent() {
        User admin = user("Admin", "admin@hourlink.vn");
        User target = user("Người dùng", "user@hourlink.vn");
        Wallet existing = wallet(target, 8, 0, 8, 0);
        when(userRepository.findByEmail(admin.getEmail())).thenReturn(Optional.of(admin));
        when(userRepository.findByIdForUpdate(target.getId())).thenReturn(Optional.of(target));
        when(walletRepository.findByUserId(target.getId())).thenReturn(Optional.of(existing));

        var response = service.initializeWallet(target.getId(), admin.getEmail());

        assertEquals(existing.getId(), response.walletId());
        verify(walletService, never()).initWallet(any());
        verify(userAdminActionRepository, never()).save(any());
    }

    @Test
    void initializeWallet_rejectsDeletedTarget() {
        User admin = user("Admin", "admin@hourlink.vn");
        User deleted = user("Đã xóa", "deleted@hourlink.vn");
        deleted.setDeleted(true);
        when(userRepository.findByEmail(admin.getEmail())).thenReturn(Optional.of(admin));
        when(userRepository.findByIdForUpdate(deleted.getId())).thenReturn(Optional.of(deleted));

        AppException deletedError = assertThrows(AppException.class,
                () -> service.initializeWallet(deleted.getId(), admin.getEmail()));

        assertTrue(deletedError.getMessage().contains("vô hiệu hóa"));
        verify(walletService, never()).initWallet(any());
    }

    @Test
    void initializeWallet_rejectsAdminTarget() {
        User actor = user("Admin actor", "actor@hourlink.vn");
        User target = user("Admin target", "target@hourlink.vn");
        when(userRepository.findByEmail(actor.getEmail())).thenReturn(Optional.of(actor));
        when(userRepository.findByIdForUpdate(target.getId())).thenReturn(Optional.of(target));
        when(userRoleRepository.existsByUser_IdAndRole_RoleCode(target.getId(), "ROLE_ADMIN"))
                .thenReturn(true);

        assertThrows(AppException.class,
                () -> service.initializeWallet(target.getId(), actor.getEmail()));

        verify(walletService, never()).initWallet(any());
    }

    @Test
    void adjust_negativeAmountCannotMakeAvailableBalanceNegative() {
        User admin = user("Admin", "admin@hourlink.vn");
        User target = user("Người dùng", "user@hourlink.vn");
        Wallet wallet = wallet(target, 1, 4, 5, 0);
        AdminWalletAdjustmentRequest request = request(target.getId(), "-1.01", "Trừ nhầm thưởng", UUID.randomUUID());
        when(userRepository.findByEmailForUpdate(admin.getEmail())).thenReturn(Optional.of(admin));
        when(userRepository.findById(target.getId())).thenReturn(Optional.of(target));
        when(walletRepository.findByUserIdForUpdate(target.getId())).thenReturn(Optional.of(wallet));

        AppException exception = assertThrows(AppException.class,
                () -> service.adjust(request, admin.getEmail()));

        assertTrue(exception.getMessage().contains("số dư khả dụng sẽ bị âm"));
        assertEquals(1, wallet.getBalance(), 0.0001);
        assertEquals(4, wallet.getHeldAmount(), 0.0001);
        verify(walletRepository, never()).save(any());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void adjust_identicalIdempotencyRequestReturnsExistingTransaction() {
        User target = user("Người dùng", "user@hourlink.vn");
        Wallet wallet = wallet(target, 7, 0, 7, 0);
        UUID requestId = UUID.randomUUID();
        WalletTransaction existing = WalletTransaction.builder()
                .wallet(wallet)
                .type(WalletTxType.ADJUSTMENT)
                .amount(2.0)
                .balanceAfter(7.0)
                .description("Điều chỉnh bởi quản trị viên: Bù giao dịch")
                .referenceType("ADMIN_ADJUSTMENT")
                .idempotencyKey("ADMIN_ADJUSTMENT:" + requestId)
                .build();
        existing.setId(UUID.randomUUID());
        when(transactionRepository.findByIdempotencyKey(existing.getIdempotencyKey()))
                .thenReturn(Optional.of(existing));

        AdminWalletAdjustmentResponse response = service.adjust(
                request(target.getId(), "2", "Bù giao dịch", requestId), "admin@hourlink.vn");

        assertTrue(response.idempotentReplay());
        assertEquals(existing.getId(), response.transaction().id());
        verify(userRepository, never()).findByEmailForUpdate(any());
        verify(walletRepository, never()).save(any());
        verify(userAdminActionRepository, never()).save(any());
    }

    @Test
    void adjust_reusedRequestIdWithDifferentPayloadIsRejected() {
        User target = user("Người dùng", "user@hourlink.vn");
        Wallet wallet = wallet(target, 7, 0, 7, 0);
        UUID requestId = UUID.randomUUID();
        WalletTransaction existing = WalletTransaction.builder()
                .wallet(wallet)
                .type(WalletTxType.ADJUSTMENT)
                .amount(2.0)
                .balanceAfter(7.0)
                .description("Điều chỉnh bởi quản trị viên: Lý do cũ")
                .idempotencyKey("ADMIN_ADJUSTMENT:" + requestId)
                .build();
        when(transactionRepository.findByIdempotencyKey(existing.getIdempotencyKey()))
                .thenReturn(Optional.of(existing));

        AppException exception = assertThrows(AppException.class, () -> service.adjust(
                request(target.getId(), "3", "Lý do mới", requestId), "admin@hourlink.vn"));

        assertTrue(exception.getMessage().contains("đã được dùng"));
        verify(walletRepository, never()).save(any());
    }

    @Test
    void adjust_rejectsAdminTarget() {
        User actor = user("Admin actor", "actor@hourlink.vn");
        User target = user("Admin target", "target@hourlink.vn");
        when(userRepository.findByEmailForUpdate(actor.getEmail())).thenReturn(Optional.of(actor));
        when(userRepository.findById(target.getId())).thenReturn(Optional.of(target));
        when(userRoleRepository.existsByUser_IdAndRole_RoleCode(target.getId(), "ROLE_ADMIN"))
                .thenReturn(true);

        assertThrows(AppException.class, () -> service.adjust(
                request(target.getId(), "1", "Không hợp lệ", UUID.randomUUID()), actor.getEmail()));

        verify(walletRepository, never()).findByUserIdForUpdate(any());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void anomalies_ignoreInitialSignupBonusEvenWhenAmountExceedsThreshold() {
        User target = user("Người dùng", "user@hourlink.vn");
        Wallet wallet = wallet(target, 5, 0, 5, 0);
        WalletTransaction signup = WalletTransaction.builder()
                .wallet(wallet)
                .type(WalletTxType.BONUS)
                .amount(100.0)
                .description("Time Credit khởi đầu khi tham gia HourLink")
                .build();
        when(walletRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(wallet)));
        when(transactionRepository.findAllByCreatedAtGreaterThanEqual(any())).thenReturn(List.of(signup));
        when(transactionRepository.findByTypeAndCreatedAtGreaterThanEqual(
                org.mockito.ArgumentMatchers.eq(WalletTxType.EARN), any())).thenReturn(List.of());

        List<AdminWalletAnomalyResponse> anomalies = service.getAnomalies(20, 3);

        assertTrue(anomalies.stream().noneMatch(item -> item.type() == AdminWalletAnomalyType.HIGH_24H_INFLOW));
    }

    @Test
    @SuppressWarnings("unchecked")
    void anomalies_canonicalizePairWhenProviderReceiverRolesAreReversed() {
        User first = user("Một", "one@hourlink.vn");
        User second = user("Hai", "two@hourlink.vn");
        Wallet wallet = wallet(first, 5, 0, 5, 0);
        Appointment forward = Appointment.builder().provider(first).receiver(second).build();
        Appointment reverse = Appointment.builder().provider(second).receiver(first).build();
        List<WalletTransaction> earns = List.of(
                earn(wallet, forward), earn(wallet, forward), earn(wallet, reverse));
        when(walletRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(wallet)));
        when(transactionRepository.findAllByCreatedAtGreaterThanEqual(any())).thenReturn(List.of());
        when(transactionRepository.findByTypeAndCreatedAtGreaterThanEqual(
                org.mockito.ArgumentMatchers.eq(WalletTxType.EARN), any())).thenReturn(earns);

        List<AdminWalletAnomalyResponse> anomalies = service.getAnomalies(20, 3);

        List<AdminWalletAnomalyResponse> pairItems = anomalies.stream()
                .filter(item -> item.type() == AdminWalletAnomalyType.FREQUENT_PAIR).toList();
        assertEquals(1, pairItems.size());
        assertEquals(3, pairItems.getFirst().metricValue(), 0.0001);
    }

    private WalletTransaction earn(Wallet wallet, Appointment appointment) {
        return WalletTransaction.builder()
                .wallet(wallet)
                .appointment(appointment)
                .type(WalletTxType.EARN)
                .amount(1.0)
                .build();
    }

    private AdminWalletAdjustmentRequest request(UUID userId, String amount, String reason, UUID requestId) {
        AdminWalletAdjustmentRequest request = new AdminWalletAdjustmentRequest();
        request.setUserId(userId);
        request.setAmount(new BigDecimal(amount));
        request.setReason(reason);
        request.setRequestId(requestId);
        return request;
    }

    private User user(String name, String email) {
        User user = User.builder().fullName(name).email(email).passwordHash("hash").build();
        user.setId(UUID.randomUUID());
        return user;
    }

    private Wallet wallet(User user, double balance, double held, double earned, double used) {
        Wallet wallet = Wallet.builder()
                .user(user)
                .balance(balance)
                .heldAmount(held)
                .totalEarned(earned)
                .totalUsed(used)
                .build();
        wallet.setId(UUID.randomUUID());
        wallet.setCreatedAt(Instant.now());
        return wallet;
    }
}
