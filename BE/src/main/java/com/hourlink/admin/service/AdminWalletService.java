package com.hourlink.admin.service;

import com.hourlink.admin.dto.request.AdminWalletAdjustmentRequest;
import com.hourlink.admin.dto.response.AdminWalletAdjustmentResponse;
import com.hourlink.admin.dto.response.AdminWalletAnomalyResponse;
import com.hourlink.admin.dto.response.AdminWalletOverviewResponse;
import com.hourlink.admin.dto.response.AdminWalletResponse;
import com.hourlink.admin.dto.response.AdminWalletTransactionResponse;
import com.hourlink.admin.entity.UserAdminAction;
import com.hourlink.admin.enums.AdminWalletAnomalySeverity;
import com.hourlink.admin.enums.AdminWalletAnomalyType;
import com.hourlink.admin.enums.AdminWalletTransactionDirection;
import com.hourlink.admin.repository.UserAdminActionRepository;
import com.hourlink.appointment.entity.Appointment;
import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.notification.enums.NotificationType;
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
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminWalletService {

    private static final String ROLE_ADMIN = "ROLE_ADMIN";
    private static final String ADJUSTMENT_REFERENCE = "ADMIN_ADJUSTMENT";
    private static final String ADJUSTMENT_KEY_PREFIX = "ADMIN_ADJUSTMENT:";
    private static final String ADJUSTMENT_DESCRIPTION_PREFIX = "Điều chỉnh bởi quản trị viên: ";
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final double EPSILON = 0.009;
    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> WALLET_SORTS = Set.of(
            "createdAt", "updatedAt", "balance", "heldAmount", "totalEarned", "totalUsed", "userFullName");
    private static final Set<String> TRANSACTION_SORTS = Set.of(
            "createdAt", "amount", "balanceAfter", "type", "userFullName");

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserAdminActionRepository userAdminActionRepository;
    private final WalletService walletService;
    private final NotificationService notificationService;

    public AdminWalletOverviewResponse getOverview() {
        WalletRepository.WalletOverviewProjection wallets = walletRepository.getOverview();
        Instant today = LocalDate.now(BUSINESS_ZONE).atStartOfDay(BUSINESS_ZONE).toInstant();
        WalletTransactionRepository.TodayTransactionOverviewProjection transactions =
                transactionRepository.getOverviewSince(today);

        double available = round(value(wallets.getTotalAvailableBalance()));
        double held = round(value(wallets.getTotalHeldAmount()));
        return new AdminWalletOverviewResponse(
                longValue(wallets.getTotalWallets()),
                available,
                held,
                round(available + held),
                round(value(wallets.getTotalEarned())),
                round(value(wallets.getTotalUsed())),
                walletRepository.countActiveNonAdminUsersWithoutWallet(),
                longValue(wallets.getWalletsWithHeldCredit()),
                longValue(wallets.getInconsistentWallets()),
                longValue(transactions.getTransactionCount()),
                round(value(transactions.getTransactionVolume())),
                longValue(transactions.getAdjustmentCount()),
                round(value(transactions.getAdjustmentVolume())),
                Instant.now());
    }

    public Page<AdminWalletResponse> getWallets(
            String search,
            Boolean hasHeld,
            Boolean inconsistent,
            Double minBalance,
            Double maxBalance,
            Pageable pageable) {
        validateFinite(minBalance, "Số dư tối thiểu");
        validateFinite(maxBalance, "Số dư tối đa");
        if (minBalance != null && maxBalance != null && minBalance > maxBalance) {
            throw invalid("Số dư tối thiểu không thể lớn hơn số dư tối đa");
        }

        Specification<Wallet> spec = Specification.where(null);
        if (search != null && !search.isBlank()) {
            String keyword = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, query, cb) -> {
                var user = root.join("user", JoinType.INNER);
                return cb.or(
                        cb.like(cb.lower(user.get("fullName")), keyword),
                        cb.like(cb.lower(user.get("email")), keyword));
            });
        }
        if (hasHeld != null) {
            spec = spec.and((root, query, cb) -> hasHeld
                    ? cb.greaterThan(root.<Double>get("heldAmount"), EPSILON)
                    : cb.lessThanOrEqualTo(root.<Double>get("heldAmount"), EPSILON));
        }
        if (inconsistent != null) {
            spec = spec.and((root, query, cb) -> {
                var difference = cb.abs(cb.diff(
                        cb.sum(root.<Double>get("balance"), root.<Double>get("heldAmount")),
                        cb.diff(root.<Double>get("totalEarned"), root.<Double>get("totalUsed"))));
                return inconsistent
                        ? cb.greaterThan(difference, EPSILON)
                        : cb.lessThanOrEqualTo(difference, EPSILON);
            });
        }
        if (minBalance != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("balance"), minBalance));
        }
        if (maxBalance != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("balance"), maxBalance));
        }

        return walletRepository.findAll(spec, sanitize(pageable, WALLET_SORTS, "createdAt", "user.fullName"))
                .map(this::toWalletResponse);
    }

    public AdminWalletResponse getWallet(UUID userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        return toWalletResponse(wallet);
    }

    /**
     * Khởi tạo một ví còn thiếu bằng thao tác Admin rõ ràng. Không tự động
     * backfill khi khởi động hoặc khi đọc dữ liệu để tránh thay đổi tài chính
     * hàng loạt ngoài ý muốn.
     */
    @Transactional
    public AdminWalletResponse initializeWallet(UUID userId, String adminEmail) {
        if (adminEmail == null || adminEmail.isBlank()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        User target = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (target.isDeleted()) {
            throw invalid("Không thể khởi tạo ví cho tài khoản đã bị vô hiệu hóa");
        }
        if (userRoleRepository.existsByUser_IdAndRole_RoleCode(target.getId(), ROLE_ADMIN)) {
            throw invalid("Không thể khởi tạo ví cho tài khoản quản trị viên");
        }

        var existing = walletRepository.findByUserId(target.getId());
        if (existing.isPresent()) {
            return toWalletResponse(existing.get());
        }

        Wallet wallet = walletService.initWallet(target);
        userAdminActionRepository.save(UserAdminAction.builder()
                .user(target)
                .admin(admin)
                .actionType("WALLET_INITIALIZED")
                .reason("Khởi tạo ví Time Credit còn thiếu với 5 TC ban đầu")
                .build());
        return toWalletResponse(wallet);
    }

    public Page<AdminWalletTransactionResponse> getTransactions(
            String search,
            UUID userId,
            WalletTxType type,
            LocalDate dateFrom,
            LocalDate dateTo,
            Pageable pageable) {
        if (dateFrom != null && dateTo != null && dateFrom.isAfter(dateTo)) {
            throw invalid("Ngày bắt đầu không thể sau ngày kết thúc");
        }

        Specification<WalletTransaction> spec = Specification.where(null);
        if (search != null && !search.isBlank()) {
            String keyword = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, query, cb) -> {
                var wallet = root.join("wallet", JoinType.INNER);
                var user = wallet.join("user", JoinType.INNER);
                return cb.or(
                        cb.like(cb.lower(user.get("fullName")), keyword),
                        cb.like(cb.lower(user.get("email")), keyword),
                        cb.like(cb.lower(root.get("description")), keyword),
                        cb.like(cb.lower(root.get("referenceType")), keyword));
            });
        }
        if (userId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("wallet").get("user").get("id"), userId));
        }
        if (type != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("type"), type));
        }
        if (dateFrom != null) {
            Instant from = dateFrom.atStartOfDay(BUSINESS_ZONE).toInstant();
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), from));
        }
        if (dateTo != null) {
            Instant untilExclusive = dateTo.plusDays(1).atStartOfDay(BUSINESS_ZONE).toInstant();
            spec = spec.and((root, query, cb) -> cb.lessThan(root.get("createdAt"), untilExclusive));
        }

        return transactionRepository.findAll(
                        spec, sanitize(pageable, TRANSACTION_SORTS, "createdAt", "wallet.user.fullName"))
                .map(this::toTransactionResponse);
    }

    public List<AdminWalletAnomalyResponse> getAnomalies(
            double highInflowThreshold,
            int frequentPairThreshold) {
        validateFinite(highInflowThreshold, "Ngưỡng dòng tiền vào");
        if (highInflowThreshold <= 0 || highInflowThreshold > 10_000) {
            throw invalid("Ngưỡng dòng tiền vào phải lớn hơn 0 và không quá 10.000");
        }
        if (frequentPairThreshold < 2 || frequentPairThreshold > 100) {
            throw invalid("Ngưỡng cặp giao dịch phải từ 2 đến 100");
        }

        Instant now = Instant.now();
        List<AdminWalletAnomalyResponse> anomalies = new ArrayList<>();
        List<Wallet> wallets = walletRepository.findAll(
                Specification.where(null), Pageable.unpaged()).getContent();
        for (Wallet wallet : wallets) {
            double difference = invariantDifference(wallet);
            if (Math.abs(difference) > EPSILON) {
                anomalies.add(anomaly(
                        "INVARIANT_MISMATCH:" + wallet.getId(),
                        AdminWalletAnomalyType.INVARIANT_MISMATCH,
                        AdminWalletAnomalySeverity.CRITICAL,
                        wallet.getUser(), null, Math.abs(difference), EPSILON,
                        "Số dư ví không khớp với sổ cái (chênh lệch " + round(Math.abs(difference)) + " TC)", now));
            }
            if (wallet.getBalance() < -EPSILON || wallet.getHeldAmount() < -EPSILON) {
                anomalies.add(anomaly(
                        "NEGATIVE_BALANCE:" + wallet.getId(),
                        AdminWalletAnomalyType.NEGATIVE_BALANCE,
                        AdminWalletAnomalySeverity.CRITICAL,
                        wallet.getUser(), null, Math.min(wallet.getBalance(), wallet.getHeldAmount()), 0,
                        "Ví có số dư khả dụng hoặc số dư tạm giữ âm", now));
            }
        }

        Instant since24Hours = now.minusSeconds(24 * 60 * 60);
        Map<UUID, Inflow> inflows = new HashMap<>();
        for (WalletTransaction tx : transactionRepository.findAllByCreatedAtGreaterThanEqual(since24Hours)) {
            double credit = inflowAmount(tx);
            if (credit <= 0 || isSignupBonus(tx)) continue;
            User user = tx.getWallet().getUser();
            inflows.computeIfAbsent(user.getId(), ignored -> new Inflow(user)).total += credit;
        }
        inflows.values().stream()
                .filter(flow -> flow.total >= highInflowThreshold)
                .forEach(flow -> anomalies.add(anomaly(
                        "HIGH_24H_INFLOW:" + flow.user.getId(),
                        AdminWalletAnomalyType.HIGH_24H_INFLOW,
                        AdminWalletAnomalySeverity.WARNING,
                        flow.user, null, round(flow.total), highInflowThreshold,
                        "Tổng Time Credit ghi có trong 24 giờ vượt ngưỡng theo dõi", now)));

        Instant since7Days = now.minusSeconds(7L * 24 * 60 * 60);
        Map<String, PairActivity> pairs = new LinkedHashMap<>();
        for (WalletTransaction tx : transactionRepository.findByTypeAndCreatedAtGreaterThanEqual(
                WalletTxType.EARN, since7Days)) {
            Appointment appointment = tx.getAppointment();
            if (appointment == null) continue;
            User first = appointment.getProvider();
            User second = appointment.getReceiver();
            if (first.getId().compareTo(second.getId()) > 0) {
                User swap = first;
                first = second;
                second = swap;
            }
            String key = first.getId() + ":" + second.getId();
            PairActivity pair = pairs.get(key);
            if (pair == null) {
                pair = new PairActivity(first, second);
                pairs.put(key, pair);
            }
            pair.count++;
            pair.volume += Math.abs(tx.getAmount());
        }
        pairs.forEach((key, pair) -> {
            if (pair.count >= frequentPairThreshold) {
                anomalies.add(anomaly(
                        "FREQUENT_PAIR:" + key,
                        AdminWalletAnomalyType.FREQUENT_PAIR,
                        AdminWalletAnomalySeverity.WARNING,
                        pair.first, pair.second, pair.count, frequentPairThreshold,
                        "Cặp người dùng có " + pair.count + " lần chuyển Time Credit trong 7 ngày"
                                + " (" + round(pair.volume) + " TC)", now));
            }
        });

        anomalies.sort(Comparator
                .comparing((AdminWalletAnomalyResponse item) -> item.severity() == AdminWalletAnomalySeverity.CRITICAL ? 0 : 1)
                .thenComparing(AdminWalletAnomalyResponse::type)
                .thenComparing(AdminWalletAnomalyResponse::anomalyKey));
        return anomalies;
    }

    @Transactional
    public AdminWalletAdjustmentResponse adjust(
            AdminWalletAdjustmentRequest request,
            String adminEmail) {
        if (request == null) throw invalid("Yêu cầu điều chỉnh không được để trống");
        if (request.getUserId() == null) throw invalid("Người dùng không được để trống");
        if (request.getRequestId() == null) throw invalid("Mã yêu cầu không được để trống");
        if (adminEmail == null || adminEmail.isBlank()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        double amount = normalizeAdjustmentAmount(request.getAmount());
        String reason = request.getReason() == null ? "" : request.getReason().trim();
        if (reason.isEmpty()) throw invalid("Lý do điều chỉnh không được để trống");
        if (reason.length() > 500) throw invalid("Lý do điều chỉnh tối đa 500 ký tự");

        String idempotencyKey = ADJUSTMENT_KEY_PREFIX + request.getRequestId();
        String description = ADJUSTMENT_DESCRIPTION_PREFIX + reason;
        var existing = transactionRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            return replayOrReject(existing.get(), request.getUserId(), amount, description);
        }

        // Serialize adjustment commands by the acting admin, then lock the target wallet.
        User admin = userRepository.findByEmailForUpdate(adminEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        User target = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (userRoleRepository.existsByUser_IdAndRole_RoleCode(target.getId(), ROLE_ADMIN)) {
            throw invalid("Không thể điều chỉnh ví của tài khoản quản trị viên");
        }

        Wallet wallet = walletRepository.findByUserIdForUpdate(target.getId())
                .orElseGet(() -> walletService.initWallet(target));
        validateWalletState(wallet);

        existing = transactionRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            return replayOrReject(existing.get(), request.getUserId(), amount, description);
        }

        double newBalance = round(wallet.getBalance() + amount);
        if (newBalance < -EPSILON) {
            throw new AppException(ErrorCode.INSUFFICIENT_CREDIT,
                    "Không thể điều chỉnh vì số dư khả dụng sẽ bị âm");
        }
        wallet.setBalance(Math.max(0, newBalance));
        if (amount > 0) {
            wallet.setTotalEarned(round(wallet.getTotalEarned() + amount));
        } else {
            wallet.setTotalUsed(round(wallet.getTotalUsed() + Math.abs(amount)));
        }
        wallet = walletRepository.save(wallet);

        WalletTransaction transaction = WalletTransaction.builder()
                .wallet(wallet)
                .type(WalletTxType.ADJUSTMENT)
                .amount(amount)
                .balanceAfter(wallet.getBalance())
                .description(description)
                .referenceType(ADJUSTMENT_REFERENCE)
                .referenceId(admin.getId())
                .idempotencyKey(idempotencyKey)
                .build();
        transaction = transactionRepository.save(transaction);

        userAdminActionRepository.save(UserAdminAction.builder()
                .user(target)
                .admin(admin)
                .actionType("WALLET_ADJUSTMENT")
                .reason((amount > 0 ? "+" : "") + amount + " TC — " + reason)
                .build());

        notificationService.createNotification(
                target,
                NotificationType.WALLET_ADJUSTED,
                "Ví Time Credit đã được điều chỉnh",
                "Quản trị viên đã " + (amount > 0 ? "cộng " : "trừ ")
                        + round(Math.abs(amount)) + " TC. Lý do: " + reason,
                transaction.getId());

        return new AdminWalletAdjustmentResponse(
                toWalletResponse(wallet), toTransactionResponse(transaction), false);
    }

    private AdminWalletAdjustmentResponse replayOrReject(
            WalletTransaction existing,
            UUID userId,
            double amount,
            String description) {
        boolean same = existing.getType() == WalletTxType.ADJUSTMENT
                && existing.getWallet().getUser().getId().equals(userId)
                && Math.abs(existing.getAmount() - amount) <= EPSILON
                && description.equals(existing.getDescription());
        if (!same) {
            throw invalid("Mã yêu cầu đã được dùng cho một nội dung điều chỉnh khác");
        }
        return new AdminWalletAdjustmentResponse(
                toWalletResponse(existing.getWallet()), toTransactionResponse(existing), true);
    }

    private AdminWalletResponse toWalletResponse(Wallet wallet) {
        User user = wallet.getUser();
        double ledger = round(wallet.getTotalEarned() - wallet.getTotalUsed());
        double difference = roundToFour((wallet.getBalance() + wallet.getHeldAmount()) - ledger);
        return new AdminWalletResponse(
                wallet.getId(), user.getId(), user.getFullName(), user.getEmail(), user.getUserType(),
                user.getAvatarUrl(), user.isLocked(), user.isDeleted(), round(wallet.getBalance()),
                round(wallet.getHeldAmount()), round(wallet.getTotalEarned()), round(wallet.getTotalUsed()),
                ledger, Math.abs(difference) > EPSILON, difference, wallet.getCreatedAt(), wallet.getUpdatedAt());
    }

    private AdminWalletTransactionResponse toTransactionResponse(WalletTransaction tx) {
        User user = tx.getWallet().getUser();
        Appointment appointment = tx.getAppointment();
        double signed = signedAmount(tx);
        return new AdminWalletTransactionResponse(
                tx.getId(), tx.getWallet().getId(), user.getId(), user.getFullName(), user.getEmail(),
                tx.getType(), round(tx.getAmount()), round(signed), direction(tx), round(tx.getBalanceAfter()),
                tx.getDescription(), appointment == null ? null : appointment.getId(),
                appointment == null ? null : appointment.getTitle(), tx.getReferenceType(), tx.getReferenceId(),
                tx.getIdempotencyKey(), tx.getCreatedAt());
    }

    private AdminWalletTransactionDirection direction(WalletTransaction tx) {
        return switch (tx.getType()) {
            case HOLD -> AdminWalletTransactionDirection.HOLD;
            case RELEASE -> AdminWalletTransactionDirection.RELEASE;
            case SPEND -> AdminWalletTransactionDirection.DEBIT;
            case ADJUSTMENT -> tx.getAmount() < 0
                    ? AdminWalletTransactionDirection.DEBIT : AdminWalletTransactionDirection.CREDIT;
            default -> AdminWalletTransactionDirection.CREDIT;
        };
    }

    private double signedAmount(WalletTransaction tx) {
        return switch (tx.getType()) {
            case SPEND, HOLD -> -Math.abs(tx.getAmount());
            case ADJUSTMENT -> tx.getAmount();
            default -> Math.abs(tx.getAmount());
        };
    }

    private double inflowAmount(WalletTransaction tx) {
        return switch (tx.getType()) {
            case EARN, BONUS, REFUND -> Math.abs(tx.getAmount());
            case ADJUSTMENT -> Math.max(0, tx.getAmount());
            default -> 0;
        };
    }

    private boolean isSignupBonus(WalletTransaction tx) {
        return tx.getType() == WalletTxType.BONUS
                && tx.getDescription() != null
                && tx.getDescription().toLowerCase(Locale.ROOT).contains("khởi đầu khi tham gia hourlink");
    }

    private AdminWalletAnomalyResponse anomaly(
            String key,
            AdminWalletAnomalyType type,
            AdminWalletAnomalySeverity severity,
            User user,
            User relatedUser,
            double metric,
            double threshold,
            String message,
            Instant detectedAt) {
        return new AdminWalletAnomalyResponse(
                key, type, severity, user.getId(), user.getFullName(), user.getEmail(),
                relatedUser == null ? null : relatedUser.getId(),
                relatedUser == null ? null : relatedUser.getFullName(),
                relatedUser == null ? null : relatedUser.getEmail(),
                round(metric), round(threshold), message, detectedAt);
    }

    private double invariantDifference(Wallet wallet) {
        return (wallet.getBalance() + wallet.getHeldAmount())
                - (wallet.getTotalEarned() - wallet.getTotalUsed());
    }

    private Pageable sanitize(
            Pageable pageable,
            Set<String> allowed,
            String defaultProperty,
            String userFullNamePath) {
        int page = Math.max(0, pageable.getPageNumber());
        int size = Math.min(MAX_PAGE_SIZE, Math.max(1, pageable.getPageSize()));
        List<Sort.Order> orders = pageable.getSort().stream()
                .filter(order -> allowed.contains(order.getProperty()))
                .map(order -> new Sort.Order(order.getDirection(),
                        "userFullName".equals(order.getProperty()) ? userFullNamePath : order.getProperty()))
                .toList();
        Sort sort = orders.isEmpty()
                ? Sort.by(Sort.Direction.DESC, defaultProperty)
                : Sort.by(orders);
        return PageRequest.of(page, size, sort);
    }

    private double normalizeAdjustmentAmount(BigDecimal rawAmount) {
        if (rawAmount == null) throw invalid("Số Time Credit điều chỉnh không được để trống");
        BigDecimal normalized = rawAmount.setScale(2, RoundingMode.HALF_UP);
        if (normalized.signum() == 0) throw invalid("Số Time Credit điều chỉnh phải khác 0");
        if (normalized.abs().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw invalid("Mỗi lần chỉ được điều chỉnh tối đa 100 Time Credit");
        }
        return normalized.doubleValue();
    }

    private void validateFinite(Double value, String label) {
        if (value != null && !Double.isFinite(value)) throw invalid(label + " không hợp lệ");
    }

    private void validateFinite(double value, String label) {
        if (!Double.isFinite(value)) throw invalid(label + " không hợp lệ");
    }

    private void validateWalletState(Wallet wallet) {
        validateFinite(wallet.getBalance(), "Số dư khả dụng");
        validateFinite(wallet.getHeldAmount(), "Số dư tạm giữ");
        validateFinite(wallet.getTotalEarned(), "Tổng Time Credit đã nhận");
        validateFinite(wallet.getTotalUsed(), "Tổng Time Credit đã dùng");
        if (wallet.getHeldAmount() < -EPSILON
                || wallet.getTotalEarned() < -EPSILON
                || wallet.getTotalUsed() < -EPSILON) {
            throw invalid("Ví có dữ liệu âm bất thường; cần đối soát trước khi điều chỉnh");
        }
        if (Math.abs(invariantDifference(wallet)) > EPSILON) {
            throw invalid("Ví đang lệch sổ cái; cần đối soát trước khi điều chỉnh");
        }
    }

    private AppException invalid(String message) {
        return new AppException(ErrorCode.INVALID_REQUEST, message);
    }

    private double value(Double value) {
        return value == null ? 0 : value;
    }

    private long longValue(Long value) {
        return value == null ? 0 : value;
    }

    private double round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private double roundToFour(double value) {
        return BigDecimal.valueOf(value).setScale(4, RoundingMode.HALF_UP).doubleValue();
    }

    private static final class Inflow {
        private final User user;
        private double total;

        private Inflow(User user) {
            this.user = user;
        }
    }

    private static final class PairActivity {
        private final User first;
        private final User second;
        private int count;
        private double volume;

        private PairActivity(User first, User second) {
            this.first = first;
            this.second = second;
        }
    }
}
