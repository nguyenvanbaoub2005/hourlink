package com.hourlink.config;

import com.hourlink.user.entity.Role;
import com.hourlink.user.entity.User;
import com.hourlink.user.entity.UserRole;
import com.hourlink.user.repository.RoleRepository;
import com.hourlink.user.repository.UserRepository;
import com.hourlink.user.repository.UserRoleRepository;
import com.hourlink.skill.entity.SkillCategory;
import com.hourlink.skill.repository.SkillCategoryRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.List;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DataInitializer implements CommandLineRunner {

    RoleRepository roleRepository;
    UserRepository userRepository;
    UserRoleRepository userRoleRepository;
    SkillCategoryRepository skillCategoryRepository;
    PasswordEncoder passwordEncoder;
    JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        fixSchemaColumns();
        createRoleIfNotFound("USER", "ROLE_USER", "Quyền người dùng cá nhân (Individual)");
        createRoleIfNotFound("ORGANIZATION", "ROLE_ORGANIZATION", "Quyền tổ chức / CLB / Trường học");
        createRoleIfNotFound("ADMIN", "ROLE_ADMIN", "Quyền quản trị viên hệ thống");
        
        createAdminUserIfNotFound("admin@hourlink.vn", "admin123", "Admin Hệ Thống", "ROLE_ADMIN");
        
        initSkillCategories();
    }

    private void fixSchemaColumns() {
        try {
            jdbcTemplate.execute("ALTER TABLE skill MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'VISIBLE'");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE help_request MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'SEARCHING'");
        } catch (Exception ignored) {}
    }

    private void initSkillCategories() {
        createCategoryIfNotFound("Lập trình", "Lập trình web, mobile, AI, dữ liệu, phần mềm...");
        createCategoryIfNotFound("Ngôn ngữ", "Tiếng Anh, Nhật, Hàn, Trung, Pháp, Đức...");
        createCategoryIfNotFound("Thiết kế", "UI/UX, Photoshop, Illustrator, 3D, video...");
        createCategoryIfNotFound("Kinh doanh", "Khởi nghiệp, tài chính, marketing, bán hàng...");
        createCategoryIfNotFound("Giáo dục", "Toán, Lý, Hóa, Văn, luyện thi, gia sư...");
        createCategoryIfNotFound("Sức khỏe", "Gym, Yoga, dinh dưỡng, bơi lội, thể thao...");
        createCategoryIfNotFound("Nghệ thuật", "Âm nhạc, hội họa, đàn Guitar, Piano...");
        createCategoryIfNotFound("Khác", "Các kỹ năng và lĩnh vực khác");
    }

    private void createCategoryIfNotFound(String name, String description) {
        List<SkillCategory> matchingCategories =
                skillCategoryRepository.findAllByNameIgnoreCase(name);
        if (matchingCategories.stream().anyMatch(category -> !category.isDeleted())) {
            return;
        }

        SkillCategory category = matchingCategories.stream()
                .filter(SkillCategory::isDeleted)
                .findFirst()
                .orElseGet(() -> SkillCategory.builder().name(name).build());
        category.setName(name);
        category.setDescription(description);
        category.setDeleted(false);
        skillCategoryRepository.save(category);
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
