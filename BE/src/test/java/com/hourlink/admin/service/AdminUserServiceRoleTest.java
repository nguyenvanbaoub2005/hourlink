package com.hourlink.admin.service;

import com.hourlink.admin.dto.request.AdminUpdateUserRequest;
import com.hourlink.admin.dto.request.UserActionRequest;
import com.hourlink.admin.repository.UserAdminActionRepository;
import com.hourlink.appointment.repository.AppointmentRepository;
import com.hourlink.common.service.CloudinaryService;
import com.hourlink.common.service.EmailService;
import com.hourlink.common.exception.BadRequestException;
import com.hourlink.helprequest.repository.HelpRequestRepository;
import com.hourlink.user.entity.Role;
import com.hourlink.user.entity.User;
import com.hourlink.user.entity.UserRole;
import com.hourlink.user.enums.UserType;
import com.hourlink.user.repository.RoleRepository;
import com.hourlink.user.repository.UserRepository;
import com.hourlink.user.repository.UserRoleRepository;
import com.hourlink.wallet.service.WalletService;
import com.hourlink.admin.dto.request.AdminCreateUserRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceRoleTest {

    @Mock UserRepository userRepository;
    @Mock UserAdminActionRepository userAdminActionRepository;
    @Mock AppointmentRepository appointmentRepository;
    @Mock HelpRequestRepository helpRequestRepository;
    @Mock EmailService emailService;
    @Mock RoleRepository roleRepository;
    @Mock UserRoleRepository userRoleRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock CloudinaryService cloudinaryService;
    @Mock WalletService walletService;
    @InjectMocks AdminUserService service;

    @Test
    void updateUser_toOrganization_replacesBusinessRole() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .fullName("Người dùng")
                .email("user@hourlink.vn")
                .phone("0900000000")
                .passwordHash("hash")
                .userType(UserType.individual)
                .build();
        user.setId(userId);
        Role organizationRole = Role.builder()
                .roleId(UUID.randomUUID())
                .roleCode("ROLE_ORGANIZATION")
                .roleName("ORGANIZATION")
                .build();
        AdminUpdateUserRequest request = new AdminUpdateUserRequest();
        request.setFullName(user.getFullName());
        request.setEmail(user.getEmail());
        request.setPhone(user.getPhone());
        request.setUserType(UserType.organization);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);
        when(roleRepository.findByRoleCode("ROLE_ORGANIZATION")).thenReturn(Optional.of(organizationRole));

        service.updateUser(userId, request);

        assertEquals(UserType.organization, user.getUserType());
        verify(userRoleRepository).deleteByUserIdAndRoleCodes(
                userId, Set.of("ROLE_USER", "ROLE_ORGANIZATION"));
        ArgumentCaptor<UserRole> mapping = ArgumentCaptor.forClass(UserRole.class);
        verify(userRoleRepository).save(mapping.capture());
        assertEquals("ROLE_ORGANIZATION", mapping.getValue().getRole().getRoleCode());
        assertEquals(userId, mapping.getValue().getUser().getId());
    }

    @Test
    void performAction_rejectsAdminTarget() {
        UUID adminId = UUID.randomUUID();
        User admin = User.builder()
                .fullName("Quản trị viên")
                .email("admin-target@hourlink.vn")
                .passwordHash("hash")
                .userType(UserType.admin)
                .build();
        admin.setId(adminId);
        UserActionRequest request = new UserActionRequest();
        request.setActionType("LOCK");
        request.setReason("Không áp dụng được cho quản trị viên");
        when(userRepository.findById(adminId)).thenReturn(Optional.of(admin));
        when(userRoleRepository.existsByUser_IdAndRole_RoleCode(adminId, "ROLE_ADMIN")).thenReturn(true);

        assertThrows(BadRequestException.class,
                () -> service.performAction(adminId, request, "other-admin@hourlink.vn"));

        verify(userRepository, never()).save(admin);
        verify(userAdminActionRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void createUser_initializesWalletImmediately() {
        Role userRole = Role.builder()
                .roleId(UUID.randomUUID())
                .roleCode("ROLE_USER")
                .roleName("USER")
                .build();
        AdminCreateUserRequest request = new AdminCreateUserRequest();
        request.setFullName("Người dùng mới");
        request.setEmail("new-user@hourlink.vn");
        request.setPassword("password123");
        request.setUserType(UserType.individual);

        when(passwordEncoder.encode("password123")).thenReturn("hash");
        when(userRepository.save(org.mockito.ArgumentMatchers.any(User.class)))
                .thenAnswer(invocation -> {
                    User saved = invocation.getArgument(0);
                    saved.setId(UUID.randomUUID());
                    return saved;
                });
        when(roleRepository.findByRoleCode("ROLE_USER")).thenReturn(Optional.of(userRole));

        service.createUser(request);

        ArgumentCaptor<User> created = ArgumentCaptor.forClass(User.class);
        verify(walletService).initWallet(created.capture());
        assertEquals("new-user@hourlink.vn", created.getValue().getEmail());
    }
}
