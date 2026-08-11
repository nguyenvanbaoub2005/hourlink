package com.hourlink.wallet.service;

import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import com.hourlink.wallet.entity.Wallet;
import com.hourlink.wallet.repository.WalletRepository;
import com.hourlink.wallet.repository.WalletTransactionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WalletServiceTest {
    @Mock WalletRepository walletRepository;
    @Mock WalletTransactionRepository txRepository;
    @Mock UserRepository userRepository;
    @InjectMocks WalletService service;

    @Test
    void addCommunityCredit_existingIdempotencyKeyDoesNotChangeBalance() {
        User user = User.builder().email("user@hourlink.vn").fullName("User").passwordHash("hash").build();
        user.setId(UUID.randomUUID());
        Wallet wallet = Wallet.builder().user(user).balance(5.0).totalEarned(5.0).heldAmount(0.0).totalUsed(0.0).build();
        UUID participantId = UUID.randomUUID();
        when(walletRepository.findByUserIdForUpdate(user.getId())).thenReturn(Optional.of(wallet));
        when(txRepository.existsByIdempotencyKey("COMMUNITY_PARTICIPANT:" + participantId)).thenReturn(true);

        boolean awarded = service.addCommunityCredit(user, 2.0, "Reward", UUID.randomUUID(), participantId);

        assertFalse(awarded);
        assertEquals(5.0, wallet.getBalance());
        assertEquals(5.0, wallet.getTotalEarned());
        verify(walletRepository, never()).save(any());
        verify(txRepository, never()).save(any());
    }
}
