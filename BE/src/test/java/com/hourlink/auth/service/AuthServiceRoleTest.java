package com.hourlink.auth.service;

import com.hourlink.auth.repository.InvalidatedTokenRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.enums.UserType;
import com.hourlink.user.repository.RoleRepository;
import com.hourlink.user.repository.UserRepository;
import com.hourlink.user.repository.UserRoleRepository;
import com.hourlink.wallet.service.WalletService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceRoleTest {

    @Mock UserRepository userRepository;
    @Mock InvalidatedTokenRepository invalidatedTokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock RoleRepository roleRepository;
    @Mock UserRoleRepository userRoleRepository;
    @Mock WalletService walletService;
    @InjectMocks AuthService service;

    @Test
    void resolveCurrentScope_usesOrganizationTypeForLegacyMismatchedRole() {
        User user = user(UserType.organization);
        when(userRoleRepository.findRoleCodesByUserId(user.getId())).thenReturn(List.of("ROLE_USER"));

        assertEquals("ROLE_ORGANIZATION", service.resolveCurrentScope(user));
    }

    @Test
    void resolveCurrentScope_neverGrantsAdminFromUserTypeAlone() {
        User user = user(UserType.admin);
        when(userRoleRepository.findRoleCodesByUserId(user.getId())).thenReturn(List.of("ROLE_USER"));

        assertEquals("ROLE_USER", service.resolveCurrentScope(user));
    }

    @Test
    void resolveCurrentScope_preservesStoredAdminRole() {
        User user = user(UserType.individual);
        when(userRoleRepository.findRoleCodesByUserId(user.getId())).thenReturn(List.of("ROLE_ADMIN"));

        assertEquals("ROLE_ADMIN", service.resolveCurrentScope(user));
    }

    private User user(UserType userType) {
        User user = User.builder()
                .fullName("Test")
                .email("test@hourlink.vn")
                .passwordHash("hash")
                .userType(userType)
                .build();
        user.setId(UUID.randomUUID());
        return user;
    }
}
