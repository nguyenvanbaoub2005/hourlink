package com.hourlink.config;

import com.hourlink.user.entity.Role;
import com.hourlink.user.entity.User;
import com.hourlink.user.entity.UserRole;
import com.hourlink.user.repository.RoleRepository;
import com.hourlink.user.repository.UserRepository;
import com.hourlink.user.repository.UserRoleRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DataInitializer implements CommandLineRunner {

    RoleRepository roleRepository;
    UserRepository userRepository;
    UserRoleRepository userRoleRepository;
    PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        createRoleIfNotFound("USER", "ROLE_USER", "Quyền người dùng cá nhân (Individual)");
        createRoleIfNotFound("ORGANIZATION", "ROLE_ORGANIZATION", "Quyền tổ chức / CLB / Trường học");
        createRoleIfNotFound("ADMIN", "ROLE_ADMIN", "Quyền quản trị viên hệ thống");
        
        createAdminUserIfNotFound("admin@hourlink.vn", "admin123", "Admin Hệ Thống", "ROLE_ADMIN");
    }

    private void createRoleIfNotFound(String roleName, String roleCode, String description) {
        Optional<Role> roleOpt = roleRepository.findByRoleCode(roleCode);
        if (roleOpt.isEmpty()) {
            Role role = Role.builder()
                    .roleName(roleName)
                    .roleCode(roleCode)
                    .description(description)
                    .build();
            roleRepository.save(role);
        }
    }

    private void createAdminUserIfNotFound(String email, String password, String fullName, String roleCode) {
        if (!userRepository.existsByEmail(email)) {
            User admin = User.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode(password))
                    .fullName(fullName)
                    .phone("0999999999")
                    .build();
            admin = userRepository.save(admin);

            Role adminRole = roleRepository.findByRoleCode(roleCode).orElseThrow();
            UserRole userRole = UserRole.builder()
                    .user(admin)
                    .role(adminRole)
                    .build();
            userRoleRepository.save(userRole);
        }
    }
}
