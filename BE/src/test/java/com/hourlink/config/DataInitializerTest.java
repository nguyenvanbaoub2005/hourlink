package com.hourlink.config;

import com.hourlink.skill.entity.SkillCategory;
import com.hourlink.skill.repository.SkillCategoryRepository;
import com.hourlink.user.entity.Role;
import com.hourlink.user.repository.RoleRepository;
import com.hourlink.user.repository.UserRepository;
import com.hourlink.user.repository.UserRoleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataInitializerTest {

    @Mock RoleRepository roleRepository;
    @Mock UserRepository userRepository;
    @Mock UserRoleRepository userRoleRepository;
    @Mock SkillCategoryRepository categoryRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JdbcTemplate jdbcTemplate;

    @Test
    void run_keepsAdminCreatedCategoriesAndOnlyEnsuresDefaultsExist() throws Exception {
        stubExistingRolesAndAdmin();
        when(categoryRepository.findAllByNameIgnoreCase(anyString())).thenReturn(List.of());

        DataInitializer initializer = new DataInitializer(
                roleRepository,
                userRepository,
                userRoleRepository,
                categoryRepository,
                passwordEncoder,
                jdbcTemplate);

        initializer.run();

        verify(categoryRepository, times(8)).save(any(SkillCategory.class));
        verify(categoryRepository, never()).delete(any(SkillCategory.class));
        // Admin-created categories are no longer enumerated by a canonical-only cleanup.
        verify(categoryRepository, never()).findAll();
    }

    @Test
    void run_restoresSoftDeletedDefaultCategoryWithoutDuplicatingIt() throws Exception {
        stubExistingRolesAndAdmin();
        SkillCategory deletedProgramming = SkillCategory.builder()
                .name("Lập trình")
                .description("Mô tả cũ")
                .isDeleted(true)
                .build();
        when(categoryRepository.findAllByNameIgnoreCase(anyString()))
                .thenAnswer(invocation -> {
                    String name = invocation.getArgument(0);
                    if ("Lập trình".equals(name)) {
                        return List.of(deletedProgramming);
                    }
                    return List.of(SkillCategory.builder().name(name).build());
                });

        DataInitializer initializer = new DataInitializer(
                roleRepository,
                userRepository,
                userRoleRepository,
                categoryRepository,
                passwordEncoder,
                jdbcTemplate);

        initializer.run();

        assertFalse(deletedProgramming.isDeleted());
        verify(categoryRepository).save(deletedProgramming);
    }

    private void stubExistingRolesAndAdmin() {
        when(roleRepository.findByRoleCode(anyString()))
                .thenReturn(Optional.of(Role.builder().roleCode("ROLE_USER").build()));
        when(userRepository.existsByEmail(anyString())).thenReturn(true);
    }
}
