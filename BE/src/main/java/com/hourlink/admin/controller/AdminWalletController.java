package com.hourlink.admin.controller;

import com.hourlink.admin.dto.request.AdminWalletAdjustmentRequest;
import com.hourlink.admin.dto.response.AdminWalletAdjustmentResponse;
import com.hourlink.admin.dto.response.AdminWalletAnomalyResponse;
import com.hourlink.admin.dto.response.AdminWalletOverviewResponse;
import com.hourlink.admin.dto.response.AdminWalletResponse;
import com.hourlink.admin.dto.response.AdminWalletTransactionResponse;
import com.hourlink.admin.service.AdminWalletService;
import com.hourlink.wallet.enums.WalletTxType;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/wallet")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminWalletController {

    private final AdminWalletService adminWalletService;

    @GetMapping("/overview")
    public ResponseEntity<AdminWalletOverviewResponse> getOverview() {
        return ResponseEntity.ok(adminWalletService.getOverview());
    }

    @GetMapping("/wallets")
    public ResponseEntity<Page<AdminWalletResponse>> getWallets(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean hasHeld,
            @RequestParam(required = false) Boolean inconsistent,
            @RequestParam(required = false) Double minBalance,
            @RequestParam(required = false) Double maxBalance,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminWalletService.getWallets(
                search, hasHeld, inconsistent, minBalance, maxBalance, pageable));
    }

    @GetMapping("/wallets/{userId}")
    public ResponseEntity<AdminWalletResponse> getWallet(@PathVariable UUID userId) {
        return ResponseEntity.ok(adminWalletService.getWallet(userId));
    }

    @PostMapping("/wallets/{userId}/initialize")
    public ResponseEntity<AdminWalletResponse> initializeWallet(
            @PathVariable UUID userId,
            Authentication authentication) {
        return ResponseEntity.ok(adminWalletService.initializeWallet(userId, authentication.getName()));
    }

    @GetMapping("/transactions")
    public ResponseEntity<Page<AdminWalletTransactionResponse>> getTransactions(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) WalletTxType type,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminWalletService.getTransactions(
                search, userId, type, dateFrom, dateTo, pageable));
    }

    @GetMapping("/anomalies")
    public ResponseEntity<List<AdminWalletAnomalyResponse>> getAnomalies(
            @RequestParam(defaultValue = "20") double highInflowThreshold,
            @RequestParam(defaultValue = "3") int frequentPairThreshold) {
        return ResponseEntity.ok(adminWalletService.getAnomalies(
                highInflowThreshold, frequentPairThreshold));
    }

    @PostMapping("/adjust")
    public ResponseEntity<AdminWalletAdjustmentResponse> adjust(
            @Valid @RequestBody AdminWalletAdjustmentRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(adminWalletService.adjust(request, authentication.getName()));
    }
}
